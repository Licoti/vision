/**
 * Les tests de la couche d'accès scopée.
 *
 * Ils tournent sur une branche Neon dédiée — `vitest.config.ts` remappe
 * `DATABASE_URL` sur `TEST_DATABASE_URL` — et écrivent réellement en base :
 * une isolation qui n'a pas été éprouvée contre PostgreSQL n'est pas éprouvée.
 *
 * **Pourquoi ce fichier importe `db` directement.** C'est la seule exception à
 * la règle 1, et elle est nécessaire : un test qui observerait la base à
 * travers la couche qu'il teste ne prouverait rien. Si le filtre de domaine
 * était rompu, l'outil de vérification le serait aussi, et le test passerait.
 * Les constats se font donc par le client brut ; seules les écritures sous
 * test passent par la couche.
 */

import { and, eq, inArray, like, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { db } from "./client";
import {
  DomainScopeError,
  IntegrityError,
  SuperAdminRequiredError,
  asSuperAdmin,
  forDomain,
  superAdmin,
  withoutAnySession,
  type ScopedDb,
  type ScopedTable,
  type SuperAdminGrant,
} from "./scoped";
import {
  activities,
  activityParticipants,
  activityTypes,
  approaches,
  budgets,
  domainEvents,
  domainIdentities,
  domains,
  entities,
  events,
  indicatorReadings,
  indicators,
  invitations,
  jobs,
  personSkills,
  persons,
  products,
  projectApproaches,
  projectIndicators,
  projectJobs,
  projectLinks,
  projectMembers,
  projectStatuses,
  projects,
  resources,
  results,
  skillLevels,
  skills,
  superAdmins,
  tools,
} from "./schema";

/* Une fixture écrit hors de toute session — l'échappée nommée de T9.3. */
const outsideAnySession = asSuperAdmin(withoutAnySession("fixture"));

/* ==========================================================================
   Deux domaines de test
   ========================================================================== */

/** Enfants d'abord, parents ensuite : `domains` refuse la suppression sinon. */
const teardownOrder: ScopedTable[] = [
  events,
  domainEvents,
  projectLinks,
  budgets,
  projectIndicators,
  indicatorReadings,
  indicators,
  results,
  resources,
  activityParticipants,
  activities,
  projectMembers,
  projectApproaches,
  projectJobs,
  projects,
  products,
  personSkills,
  invitations,
  persons,
  skills,
  skillLevels,
  projectStatuses,
  activityTypes,
  tools,
  approaches,
  jobs,
  entities,
  domainIdentities,
];

type Fixture = {
  domainId: string;
  scope: ScopedDb;
  entityId: string;
  statusId: string;
  activityTypeId: string;
  productId: string;
  projectId: string;
  personId: string;
  skillId: string;
  levelId: string;
};

const suffix = Math.random().toString(36).slice(2, 10);
let a: Fixture;
let b: Fixture;

async function seedDomain(label: string): Promise<Fixture> {
  const domain = await outsideAnySession.createDomain({
    name: `__test__${label}__${suffix}`,
    competenceCenterName: `Centre ${label}`,
  });
  const scope = forDomain({ domainId: domain.id });

  const entity = await scope.insert(entities, { label: `Entité ${label}` });
  const status = await scope.insert(projectStatuses, {
    label: "En cours",
    nature: "active",
  });
  const activityType = await scope.insert(activityTypes, {
    label: "Atelier",
    family: "design",
  });
  const product = await scope.insert(products, {
    name: `Produit ${label}`,
    entityId: entity.id,
  });
  const project = await scope.insert(projects, {
    name: `Projet ${label}`,
    productId: product.id,
    statusId: status.id,
  });

  // Une personne, une compétence et un niveau **par domaine** : sans un second
  // jeu, aucun cas d'étanchéité de `person_skills` ne prouverait quoi que ce soit.
  const person = await scope.insert(persons, {
    fullName: `Personne ${label}`,
    source: "manual",
    kind: "center",
  });
  const skill = await scope.insert(skills, { label: `Compétence ${label}` });
  const level = await scope.insert(skillLevels, {
    label: `Niveau ${label}`,
    rank: 1,
  });

  return {
    domainId: domain.id,
    scope,
    entityId: entity.id,
    statusId: status.id,
    activityTypeId: activityType.id,
    productId: product.id,
    projectId: project.id,
    personId: person.id,
    skillId: skill.id,
    levelId: level.id,
  };
}

beforeAll(async () => {
  a = await seedDomain("a");
  b = await seedDomain("b");
});

afterAll(async () => {
  /* **`super_admins` n'a pas de domaine, donc rien ne la balaie.** Le
     `teardownOrder` ci-dessus efface par `domain_id`, et le balayage de
     `vitest.global-setup.ts` lit les tables au catalogue sur cette même colonne :
     une ligne de super administrateur laissée par une exécution tuée survit aux
     deux. Elle est inoffensive — son e-mail porte le suffixe aléatoire du
     fichier, aucune connexion réelle ne le rapprochera —, mais c'est de la
     poussière, et le fait est consigné au journal technique. Le nettoyage se
     fait donc ici, sur le motif de l'e-mail. */
  await db.delete(superAdmins).where(like(superAdmins.email, `%${suffix}%`));

  const ids = [a?.domainId, b?.domainId].filter(Boolean) as string[];
  if (ids.length === 0) return;
  for (const table of teardownOrder) {
    await db.delete(table).where(inArray(table.domainId, ids));
  }
  await db.delete(domains).where(inArray(domains.id, ids));
});

/* ==========================================================================
   La frontière
   ========================================================================== */

describe("la frontière de domaine", () => {
  test("une lecture ne voit jamais les lignes d'un autre domaine", async () => {
    const rows = await a.scope.list(projects);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe(a.projectId);
    expect(rows.some((row) => row.id === b.projectId)).toBe(false);

    expect(await a.scope.find(projects, b.projectId)).toBeUndefined();
    expect(await a.scope.count(projects)).toBe(1);
  });

  test("une lecture jointe filtrée ne franchit pas la frontière", async () => {
    const rows = await a.scope.joinedRead((database, scope) =>
      database
        .select({ project: projects.name, product: products.name })
        .from(projects)
        .innerJoin(
          products,
          and(eq(products.id, projects.productId), scope.filter(products)),
        )
        .where(scope.filter(projects)),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.product).toContain("Produit a");

    const foreign = await a.scope.joinedRead((database, scope) =>
      database
        .select({ id: projects.id })
        .from(projects)
        .where(scope.filter(projects)),
    );
    expect(foreign.map((row) => row.id)).not.toContain(b.projectId);
  });

  test("une écriture ne touche pas une ligne d'un autre domaine", async () => {
    const before = await db
      .select()
      .from(projects)
      .where(eq(projects.id, b.projectId));

    const updated = await a.scope.update(projects, b.projectId, {
      name: "Renommé depuis A",
    });
    expect(updated).toBeUndefined();

    const after = await db
      .select()
      .from(projects)
      .where(eq(projects.id, b.projectId));
    expect(after[0]?.name).toBe(before[0]?.name);
    expect(after[0]?.updatedAt).toEqual(before[0]?.updatedAt);
  });

  test("un archivage ne franchit pas la frontière", async () => {
    const archived = await a.scope.archive(projects, b.projectId);
    expect(archived).toBeUndefined();

    const row = await db
      .select()
      .from(projects)
      .where(eq(projects.id, b.projectId));
    expect(row[0]?.archivedAt).toBeNull();
  });

  test("`domainId` ne se force pas à l'écriture", async () => {
    await expect(
      // Le typage l'interdit déjà ; le cast vérifie le garde-fou d'exécution,
      // seul rempart si la valeur vient d'un formulaire ou d'un appel JS.
      a.scope.insert(products, {
        name: "Produit intrus",
        entityId: a.entityId,
        domainId: b.domainId,
      } as never),
    ).rejects.toThrow(DomainScopeError);
  });
});

/* ==========================================================================
   Cohérence des parents — ce que la base ne vérifie pas
   ========================================================================== */

describe("la cohérence des parents", () => {
  test("un parent d'un autre domaine est refusé", async () => {
    await expect(
      a.scope.insert(projects, {
        name: "Projet mal rattaché",
        productId: b.productId,
        statusId: a.statusId,
      }),
    ).rejects.toThrow(DomainScopeError);

    // La base l'aurait accepté : la clé étrangère ignore le domaine.
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.productId, b.productId));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.domainId).toBe(b.domainId);
  });

  test("le garde-fou laisse passer le cas normal", async () => {
    const project = await a.scope.insert(projects, {
      name: "Projet bien rattaché",
      productId: a.productId,
      statusId: a.statusId,
    });
    expect(project.domainId).toBe(a.domainId);
    expect(project.lastActivityAt).toBeNull();
  });
});

/* ==========================================================================
   Les deux règles d'intégrité laissées par T1.2
   ========================================================================== */

describe("un résultat ne se rattache qu'à une activité terminée", () => {
  test("une activité non terminée est refusée", async () => {
    const planned = await a.scope.insert(activities, {
      projectId: a.projectId,
      activityTypeId: a.activityTypeId,
      state: "planned",
      periodStart: "2026-04-01",
    });

    await expect(
      a.scope.insert(results, {
        activityId: planned.id,
        label: "Taux de conformité",
        value: "82.0000",
        measuredOn: "2026-04-15",
      }),
    ).rejects.toThrow(IntegrityError);
  });

  test("une activité terminée est acceptée", async () => {
    const done = await a.scope.insert(activities, {
      projectId: a.projectId,
      activityTypeId: a.activityTypeId,
      state: "done",
      periodStart: "2026-02-01",
      periodEnd: "2026-02-20",
    });

    const result = await a.scope.insert(results, {
      activityId: done.id,
      label: "Taux de conformité",
      value: "82.0000",
      measuredOn: "2026-02-25",
    });
    expect(result.domainId).toBe(a.domainId);
  });
});

describe("`last_activity_at` est tenu par la couche d'écriture", () => {
  test("nul à la création, renseigné puis recalculé", async () => {
    const project = await a.scope.insert(projects, {
      name: "Projet suivi",
      productId: a.productId,
      statusId: a.statusId,
    });
    expect(project.lastActivityAt).toBeNull();

    const activity = await a.scope.insert(activities, {
      projectId: project.id,
      activityTypeId: a.activityTypeId,
      state: "done",
      periodStart: "2026-03-10",
      periodEnd: "2026-03-20",
    });

    const afterInsert = await a.scope.find(projects, project.id);
    expect(afterInsert?.lastActivityAt).not.toBeNull();
    expect(afterInsert?.lastActivityAt?.toISOString().slice(0, 10)).toBe(
      "2026-03-20",
    );

    await a.scope.update(activities, activity.id, { periodEnd: "2026-05-04" });
    const afterUpdate = await a.scope.find(projects, project.id);
    expect(afterUpdate?.lastActivityAt?.toISOString().slice(0, 10)).toBe(
      "2026-05-04",
    );

    // Une activité archivée sort du calcul : le projet redevient sans date.
    await a.scope.archive(activities, activity.id);
    const afterArchive = await a.scope.find(projects, project.id);
    expect(afterArchive?.lastActivityAt).toBeNull();
  });

  /**
   * T2.1 — la fraîcheur dit « depuis quand ça n'a pas bougé » (docs/03 §8).
   * Une activité prévue n'a pas eu lieu : elle ne peut pas dater le dernier
   * mouvement du projet, et surtout pas le poser dans le futur.
   */
  test("une activité prévue ne déplace pas la date", async () => {
    const project = await a.scope.insert(projects, {
      name: "Projet à l'arrêt",
      productId: a.productId,
      statusId: a.statusId,
    });

    await a.scope.insert(activities, {
      projectId: project.id,
      activityTypeId: a.activityTypeId,
      state: "done",
      periodStart: "2026-01-05",
      periodEnd: "2026-01-30",
    });
    await a.scope.insert(activities, {
      projectId: project.id,
      activityTypeId: a.activityTypeId,
      state: "planned",
      periodStart: "2027-06-01",
      periodEnd: "2027-06-30",
    });

    const after = await a.scope.find(projects, project.id);
    expect(after?.lastActivityAt?.toISOString().slice(0, 10)).toBe("2026-01-30");
  });

  test("une activité en cours déplace la date, elle a commencé", async () => {
    const project = await a.scope.insert(projects, {
      name: "Projet en mouvement",
      productId: a.productId,
      statusId: a.statusId,
    });

    await a.scope.insert(activities, {
      projectId: project.id,
      activityTypeId: a.activityTypeId,
      state: "done",
      periodStart: "2026-01-05",
      periodEnd: "2026-01-30",
    });
    await a.scope.insert(activities, {
      projectId: project.id,
      activityTypeId: a.activityTypeId,
      state: "in_progress",
      periodStart: "2026-04-01",
      periodEnd: "2026-04-30",
    });

    const after = await a.scope.find(projects, project.id);
    expect(after?.lastActivityAt?.toISOString().slice(0, 10)).toBe("2026-04-30");
  });

  /**
   * Le rafraîchissement rejoue la définition sur des lignes déjà écrites.
   * Sans lui, un changement de définition ne rattraperait jamais l'existant :
   * la valeur est posée à l'écriture, et une écriture passée ne se refait pas.
   */
  test("`refreshLastActivity` rejoue le calcul sur l'existant", async () => {
    const project = await a.scope.insert(projects, {
      name: "Projet à rafraîchir",
      productId: a.productId,
      statusId: a.statusId,
    });
    await a.scope.insert(activities, {
      projectId: project.id,
      activityTypeId: a.activityTypeId,
      state: "done",
      periodStart: "2026-02-01",
      periodEnd: "2026-02-28",
    });

    // Une valeur fausse posée par le client brut, hors de la couche : c'est
    // l'état qu'aurait laissé une ancienne définition.
    await db
      .update(projects)
      .set({ lastActivityAt: new Date("2030-01-01T00:00:00Z") })
      .where(eq(projects.id, project.id));

    const count = await a.scope.refreshLastActivity([project.id]);
    expect(count).toBe(1);

    const after = await a.scope.find(projects, project.id);
    expect(after?.lastActivityAt?.toISOString().slice(0, 10)).toBe("2026-02-28");
  });
});

/* ==========================================================================
   Archivage plutôt que suppression
   ========================================================================== */

describe("l'archivage", () => {
  test("pose `archived_at`, sans supprimer la ligne", async () => {
    const entity = await a.scope.insert(entities, { label: "Entité à ranger" });

    const archived = await a.scope.archive(entities, entity.id);
    expect(archived?.archivedAt).toBeInstanceOf(Date);

    const visible = await a.scope.list(entities);
    expect(visible.map((row) => row.id)).not.toContain(entity.id);

    const all = await a.scope.list(entities, { includeArchived: true });
    expect(all.map((row) => row.id)).toContain(entity.id);

    const row = await db
      .select()
      .from(entities)
      .where(eq(entities.id, entity.id));
    expect(row).toHaveLength(1);
  });

  test("`archivedAt` est refusé dans un `update`", async () => {
    await expect(
      a.scope.update(projects, a.projectId, {
        archivedAt: new Date(),
      } as never),
    ).rejects.toThrow(IntegrityError);
  });

  /* Le rétablissement — T4bis.2. `archive` existait seul depuis T1.3, et un
     geste qui ne se défait pas n'en est pas un : la fiche annonce « Rétablir »
     sur la page d'un produit archivé, et aucune porte n'y menait. */

  test("`restore` remet la ligne dans les listes vivantes", async () => {
    const entity = await a.scope.insert(entities, {
      label: "Entité à ressortir",
    });
    await a.scope.archive(entities, entity.id);
    expect(
      (await a.scope.list(entities)).map((row) => row.id),
    ).not.toContain(entity.id);

    const restored = await a.scope.restore(entities, entity.id);
    expect(restored?.archivedAt).toBeNull();

    const visible = await a.scope.list(entities);
    expect(visible.map((row) => row.id)).toContain(entity.id);
  });

  test("`restore` ne rend rien sur une ligne vivante", async () => {
    const entity = await a.scope.insert(entities, { label: "Entité vivante" });

    // Le filtre `is not null` est ce qui distingue « rétabli » d'« inutile » :
    // sans lui, l'appel toucherait la ligne et prétendrait avoir agi.
    expect(await a.scope.restore(entities, entity.id)).toBeUndefined();

    const row = await db
      .select()
      .from(entities)
      .where(eq(entities.id, entity.id));
    expect(row[0]?.archivedAt).toBeNull();
  });

  test("un rétablissement ne franchit pas la frontière", async () => {
    await b.scope.archive(products, b.productId);

    const restored = await a.scope.restore(products, b.productId);
    expect(restored).toBeUndefined();

    const row = await db
      .select()
      .from(products)
      .where(eq(products.id, b.productId));
    expect(row[0]?.archivedAt).not.toBeNull();

    // La fixture est rendue à son état : les tests suivants la partagent.
    await b.scope.restore(products, b.productId);
  });

  test("l'aller-retour d'une activité fait tomber puis revenir `last_activity_at`", async () => {
    const project = await a.scope.insert(projects, {
      name: "Projet rétabli",
      productId: a.productId,
      statusId: a.statusId,
    });
    const activity = await a.scope.insert(activities, {
      projectId: project.id,
      activityTypeId: a.activityTypeId,
      state: "done",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-30",
    });

    await a.scope.archive(activities, activity.id);
    expect((await a.scope.find(projects, project.id))?.lastActivityAt).toBeNull();

    // La promesse de couche vaut dans les deux sens : rétablir une activité est
    // une écriture d'activité, elle recalcule.
    await a.scope.restore(activities, activity.id);
    const after = await a.scope.find(projects, project.id);
    expect(after?.lastActivityAt?.toISOString().slice(0, 10)).toBe("2026-06-30");
  });

  test("`unlink` défait une liaison, et n'existe que pour elles", async () => {
    const job = await a.scope.insert(jobs, { label: "Product Design" });
    const link = await a.scope.insert(projectJobs, {
      projectId: a.projectId,
      jobId: job.id,
    });

    expect(await b.scope.unlink(projectJobs, link.id)).toBe(0);
    expect(await a.scope.unlink(projectJobs, link.id)).toBe(1);
    expect(await a.scope.find(projectJobs, link.id)).toBeUndefined();
  });
});

/* ==========================================================================
   Les compétences portées — T5bis.1

   Trois propriétés dont les six tickets suivants vivent, et qu'aucun d'eux ne
   revérifiera : la liaison se retire, ses trois parents sont confrontés au
   domaine avant d'être crus, et la disponibilité est refusée à qui n'est pas
   du centre.
   ========================================================================== */

describe("les compétences portées", () => {
  test("`unlink` défait une compétence, et le domaine borne le geste", async () => {
    const held = await a.scope.insert(personSkills, {
      personId: a.personId,
      skillId: a.skillId,
      levelId: a.levelId,
    });

    // Depuis B, le geste ne trouve rien : la ligne est toujours là, constatée
    // par le client brut et non par la couche qu'on teste.
    expect(await b.scope.unlink(personSkills, held.id)).toBe(0);
    const stillThere = await db
      .select()
      .from(personSkills)
      .where(eq(personSkills.id, held.id));
    expect(stillThere).toHaveLength(1);

    expect(await a.scope.unlink(personSkills, held.id)).toBe(1);
    expect(await a.scope.find(personSkills, held.id)).toBeUndefined();
  });

  /**
   * Les trois clés étrangères sont dérivées du schéma par `parentChecksOf` :
   * aucune liste n'est écrite à la main. **Un cas par clé, et non trois
   * assertions dans un cas** — sinon neutraliser l'une d'elles ferait tomber le
   * même test que neutraliser les deux autres, et la mise en défaut ne
   * désignerait plus rien.
   */
  test("une compétence d'un autre domaine est refusée", async () => {
    const before = await db.select().from(personSkills);

    await expect(
      a.scope.insert(personSkills, {
        personId: a.personId,
        skillId: b.skillId,
        levelId: a.levelId,
      }),
    ).rejects.toThrow(DomainScopeError);

    // La base l'aurait acceptée : sa clé étrangère ignore le domaine.
    expect(await db.select().from(personSkills)).toHaveLength(before.length);
  });

  test("un niveau d'un autre domaine est refusé", async () => {
    const before = await db.select().from(personSkills);

    await expect(
      a.scope.insert(personSkills, {
        personId: a.personId,
        skillId: a.skillId,
        levelId: b.levelId,
      }),
    ).rejects.toThrow(DomainScopeError);

    expect(await db.select().from(personSkills)).toHaveLength(before.length);
  });

  test("une personne d'un autre domaine est refusée", async () => {
    const before = await db.select().from(personSkills);

    await expect(
      a.scope.insert(personSkills, {
        personId: b.personId,
        skillId: a.skillId,
        levelId: a.levelId,
      }),
    ).rejects.toThrow(DomainScopeError);

    expect(await db.select().from(personSkills)).toHaveLength(before.length);
  });

  test("le cas normal passe, et la liaison porte le domaine", async () => {
    const held = await a.scope.insert(personSkills, {
      personId: a.personId,
      skillId: a.skillId,
      levelId: a.levelId,
    });
    expect(held.domainId).toBe(a.domainId);

    // La fixture est rendue à son état : les tests suivants la partagent.
    await a.scope.unlink(personSkills, held.id);
  });

  /* **Les deux témoins de l'arbitrage (d) sont partis le 28/08/2026**, avec la
     colonne qu'ils encadraient : `persons_availability_requires_center` n'existe
     plus, la disponibilité étant déduite du nombre d'accompagnements vivants
     (`lib/availability.ts`). L'arbitrage tient toujours — un intervenant côté
     entité n'en porte pas —, mais **il n'a plus de gardien en base** : c'est la
     dérivation qui rend `null`, et ce sont les tests de `lib/queries/team.ts`
     qui l'éprouvent. Perte de garantie consignée au journal technique. */

  test("la présentation se saisit, et elle est facultative", async () => {
    const member = await a.scope.insert(persons, {
      fullName: "Membre présenté",
      source: "manual",
      kind: "center",
      bio: "Une phrase de présentation.",
    });
    expect(member.bio).toBe("Une phrase de présentation.");

    const stakeholder = await a.scope.insert(persons, {
      fullName: "Intervenant sans présentation",
      source: "manual",
      kind: "stakeholder",
    });
    expect(stakeholder.bio).toBeNull();
  });
});

/* ==========================================================================
   Le journal — T6.1

   `record` n'est pas une écriture de plus : c'est `insert(events, …)` avec
   `actor_id` posé depuis le contexte. Ce qui s'éprouve ici n'est donc pas un
   mécanisme neuf, c'est que `record` **emprunte bien** celui d'`insert` — et
   les trois cas d'étanchéité sont ce qui le prouve. S'ils passaient tous,
   `record` aurait pris un chemin qu'`insert` n'a pas.
   ========================================================================== */

describe("le journal", () => {
  /** Le scope tel qu'une session le construit : un domaine, et une personne. */
  const signed = () => forDomain({ domainId: a.domainId, actorId: a.personId });

  test("une ligne porte le domaine, l'acteur du contexte, et sa phrase", async () => {
    const written = await signed().record({
      projectId: a.projectId,
      verb: "created",
      targetType: "project",
      targetId: a.projectId,
      summary: "Accompagnement créé\u00A0: Projet a",
    });

    // Le constat se fait par le client brut : lire par la couche qu'on teste
    // ne prouverait rien si son filtre était rompu.
    const rows = await db.select().from(events).where(eq(events.id, written.id));
    const row = rows[0];
    expect(row?.domainId).toBe(a.domainId);
    expect(row?.actorId).toBe(a.personId);
    expect(row?.createdBy).toBe(a.personId);
    expect(row?.projectId).toBe(a.projectId);
    expect(row?.productId).toBeNull();
    expect(row?.verb).toBe("created");
    expect(row?.targetType).toBe("project");
    expect(row?.targetId).toBe(a.projectId);
    expect(row?.summary).toBe("Accompagnement créé\u00A0: Projet a");
    expect(row?.occurredAt).toBeInstanceOf(Date);
  });

  /* Les trois clés étrangères d'`events` sont dérivées du schéma par
     `parentChecksOf` : aucune liste n'est écrite à la main. **Un cas par clé,
     et non trois assertions dans un cas** — sinon neutraliser l'une ferait
     tomber le même test que neutraliser les deux autres, et la mise en défaut
     ne désignerait plus rien (leçon de T5bis.1). */

  test("un `project_id` d'un autre domaine est refusé", async () => {
    const before = await db.select().from(events);

    await expect(
      signed().record({
        projectId: b.projectId,
        verb: "updated",
        targetType: "project",
        targetId: b.projectId,
        summary: "Ligne forgée",
      }),
    ).rejects.toThrow(DomainScopeError);

    // La base l'aurait acceptée : sa clé étrangère ignore le domaine.
    expect(await db.select().from(events)).toHaveLength(before.length);
  });

  test("un `product_id` d'un autre domaine est refusé", async () => {
    const before = await db.select().from(events);

    await expect(
      signed().record({
        productId: b.productId,
        verb: "created",
        targetType: "indicator_reading",
        targetId: null,
        summary: "Ligne forgée",
      }),
    ).rejects.toThrow(DomainScopeError);

    expect(await db.select().from(events)).toHaveLength(before.length);
  });

  /**
   * L'acteur ne vient pas de l'appelant — il vient du contexte. Le forger
   * demande donc de forger le **scope**, et c'est bien ce qu'une session
   * compromise ferait. `assertPreconditions` le confronte au domaine comme
   * n'importe quel parent : `actor_id` est une clé étrangère sur `persons`.
   */
  test("un acteur d'un autre domaine est refusé, scope forgé compris", async () => {
    const before = await db.select().from(events);

    await expect(
      forDomain({ domainId: a.domainId, actorId: b.personId }).record({
        projectId: a.projectId,
        verb: "archived",
        targetType: "project",
        targetId: a.projectId,
        summary: "Ligne forgée",
      }),
    ).rejects.toThrow(DomainScopeError);

    expect(await db.select().from(events)).toHaveLength(before.length);
  });

  /**
   * `actorId` est facultatif : l'amorçage et les écritures système n'ont pas de
   * personne courante, et `actor_id` est nullable pour cette raison. Une ligne
   * sans acteur reste une ligne — T6.3 la lira « par l'amorçage » plutôt que de
   * la faire disparaître.
   */
  test("un scope sans acteur écrit une ligne sans acteur", async () => {
    const written = await a.scope.record({
      projectId: a.projectId,
      verb: "updated",
      targetType: "project",
      targetId: a.projectId,
      summary: "Ligne de l'amorçage",
    });

    const rows = await db.select().from(events).where(eq(events.id, written.id));
    expect(rows[0]?.actorId).toBeNull();
    expect(rows[0]?.domainId).toBe(a.domainId);
  });

  /**
   * **La forme que T8.3 introduit : un événement de niveau domaine.**
   *
   * `docs/04` §4 la prévoyait depuis T1.2 — `project_id` « null pour les
   * événements de niveau produit **ou domaine** » —, et rien ne l'écrivait :
   * les six `target_type` de C6 portaient tous l'un ou l'autre. `person` et
   * `entity` ne portent aucun des deux, une personne comme une entité existant
   * hors de tout accompagnement et de tout produit.
   *
   * Ce n'est pas un chemin neuf de la couche : `insert` ne vérifie que les clés
   * étrangères **posées**, et deux colonnes nulles ne se confrontent à rien. Ce
   * constat le dit plutôt que de le supposer — c'est la forme sur laquelle
   * reposent sept points d'appel de T8.3.
   */
  test("une ligne sans projet ni produit s'écrit, et reste au domaine", async () => {
    const written = await signed().record({
      verb: "created",
      targetType: "person",
      targetId: a.personId,
      summary: "Personne créée\u00A0: Personne a",
    });

    const rows = await db.select().from(events).where(eq(events.id, written.id));
    const row = rows[0];
    expect(row?.projectId).toBeNull();
    expect(row?.productId).toBeNull();
    expect(row?.domainId).toBe(a.domainId);
    expect(row?.actorId).toBe(a.personId);
    expect(row?.targetType).toBe("person");
    expect(row?.summary).toBe("Personne créée\u00A0: Personne a");
  });

  test("une lecture d'un domaine ne voit pas le journal de l'autre", async () => {
    await forDomain({ domainId: b.domainId, actorId: b.personId }).record({
      projectId: b.projectId,
      verb: "created",
      targetType: "project",
      targetId: b.projectId,
      summary: "Accompagnement créé\u00A0: Projet b",
    });

    const mine = await a.scope.list(events);
    expect(mine.every((row) => row.domainId === a.domainId)).toBe(true);
    expect(mine.map((row) => row.summary)).not.toContain(
      "Accompagnement créé\u00A0: Projet b",
    );
  });
});

/* ==========================================================================
   Contraintes de typage — vérifiées par `tsc --noEmit`, jamais exécutées
   ========================================================================== */

/* ==========================================================================
   La suppression — l'exception à la règle 4
   ========================================================================== */

describe("`deleteRow`", () => {
  test("efface une entité que rien ne référence", async () => {
    const orphan = await a.scope.insert(entities, {
      label: `Orpheline ${suffix}`,
    });

    expect(await a.scope.deleteRow(entities, orphan.id)).toBe(1);
    expect(await a.scope.find(entities, orphan.id)).toBeUndefined();
  });

  test("la clé étrangère refuse une entité qu'un produit porte", async () => {
    /* `a.entityId` porte `a.productId`. C'est **la base** qui refuse, pas la
       couche : `products.entity_id` est déclarée `on delete restrict`, et
       `deleteRow` ne compte rien avant d'effacer. La traduction en
       `IntegrityError` est ce qui évite un 500 à l'écran. */
    await expect(a.scope.deleteRow(entities, a.entityId)).rejects.toThrow(
      IntegrityError,
    );

    expect(await a.scope.find(entities, a.entityId)).toBeDefined();
  });

  test("un produit **archivé** retient la ligne tout autant", async () => {
    /* Le cas qui sépare l'archivage de la suppression : plus rien de vivant ne
       s'oppose au rangement, et la clé étrangère s'oppose pourtant encore à
       l'effacement. C'est pour lui que l'écran porte deux décomptes. */
    const entity = await a.scope.insert(entities, {
      label: `Portée par un rangé ${suffix}`,
    });
    const product = await a.scope.insert(products, {
      name: `Rangé ${suffix}`,
      entityId: entity.id,
    });
    await a.scope.archive(products, product.id);

    await expect(a.scope.deleteRow(entities, entity.id)).rejects.toThrow(
      IntegrityError,
    );
    expect(await a.scope.find(entities, entity.id)).toBeDefined();
  });

  test("une entité de l'autre domaine n'existe pas : rien n'est effacé", async () => {
    expect(await a.scope.deleteRow(entities, b.entityId)).toBe(0);
    expect(await b.scope.find(entities, b.entityId)).toBeDefined();
  });

  test("un identifiant inconnu rend zéro plutôt qu'une erreur", async () => {
    expect(
      await a.scope.deleteRow(entities, "00000000-0000-4000-8000-000000000000"),
    ).toBe(0);
  });

  /* ------------------------------------------------------------------
     Les deux tables entrées dans `DeletableTable` le 28/08/2026. Elles n'ont
     **pas la même barrière**, et c'est tout ce qu'il y a à retenir d'elles.
     ------------------------------------------------------------------ */

  test("`persons` est retenue par une clé `restrict`, comme `entities`", async () => {
    /* `project_members.person_id` est `restrict` : dès qu'une personne est dans
       une équipe, la base refuse de l'effacer. C'est ce qui fait que la règle 4
       garde ses droits sur tout ce qui a servi.

       **La liaison est créée ici et non prise à la fixture** : celle-ci n'en
       porte pas, et un test qui s'appuierait dessus passerait en effaçant la
       personne que les autres partagent. `activity_participants.person_id` est
       la seconde clé de la paire ; elle est éprouvée par son geste, dans
       `app/(app)/equipe/actions.test.ts`. */
    const held = await a.scope.insert(persons, {
      fullName: `Dans une équipe ${suffix}`,
      source: "manual",
      kind: "center",
    });
    await a.scope.insert(projectMembers, {
      projectId: a.projectId,
      personId: held.id,
    });

    await expect(a.scope.deleteRow(persons, held.id)).rejects.toThrow(
      IntegrityError,
    );
    expect(await a.scope.find(persons, held.id)).toBeDefined();
  });

  test("une personne que rien ne référence s'efface, ses compétences avec elle", async () => {
    const doomed = await a.scope.insert(persons, {
      fullName: `Doublon ${suffix}`,
      source: "manual",
      kind: "center",
    });
    const held = await a.scope.insert(personSkills, {
      personId: doomed.id,
      skillId: a.skillId,
      levelId: a.levelId,
    });

    expect(await a.scope.deleteRow(persons, doomed.id)).toBe(1);
    expect(await a.scope.find(persons, doomed.id)).toBeUndefined();
    // `person_skills.person_id` est `cascade` : la liaison part avec elle.
    expect(await a.scope.find(personSkills, held.id)).toBeUndefined();
  });

  /**
   * **`projects` n'a aucune barrière, et c'est le fait qu'il faut voir.**
   *
   * Les dix clés étrangères qui le pointent sont `cascade` : rien ne s'oppose,
   * et l'activité part avec l'accompagnement. Ce test n'éprouve pas un
   * garde-fou — il éprouve **son absence**, qui est ce que `DeletableTable`
   * annonce et ce que le panneau de confirmation doit compenser.
   */
  test("`projects` n'oppose rien : la cascade emporte son contenu", async () => {
    const project = await a.scope.insert(projects, {
      name: `À effacer ${suffix}`,
      productId: a.productId,
      statusId: a.statusId,
    });
    const activity = await a.scope.insert(activities, {
      projectId: project.id,
      activityTypeId: a.activityTypeId,
      state: "planned",
      periodStart: "2026-04-01",
    });

    expect(await a.scope.deleteRow(projects, project.id)).toBe(1);
    expect(await a.scope.find(projects, project.id)).toBeUndefined();
    expect(await a.scope.find(activities, activity.id)).toBeUndefined();
  });
});

/* ==========================================================================
   La ligne qui nomme le domaine — T11.5
   ========================================================================== */

describe("le domaine vu de l'intérieur", () => {
  test("`findOwnDomain` rend la ligne du domaine courant, et elle seule", async () => {
    const own = await a.scope.findOwnDomain();

    expect(own?.id).toBe(a.domainId);
    expect(own?.name).toBe(`__test__a__${suffix}`);
    /* Elle rend la ligne **entière** : la description en fait partie, et c'est
       ce qui permet à l'écran de la pré-remplir sans seconde lecture. */
    expect(own).toHaveProperty("description");

    const other = await b.scope.findOwnDomain();
    expect(other?.id).toBe(b.domainId);
  });

  /**
   * **L'étanchéité tient par une absence, et c'est elle qu'on mesure.**
   * `updateOwnDomain` n'a aucun paramètre de cible : il n'existe donc aucune
   * charge, forgée ou non, par laquelle le domaine `a` atteindrait le `b`. Le
   * constat se fait par le client brut, sur les deux lignes.
   */
  test("une correction ne touche que le domaine de son appelant", async () => {
    const before = await db
      .select()
      .from(domains)
      .where(eq(domains.id, b.domainId));

    const updated = await a.scope.updateOwnDomain({
      name: `__test__a__${suffix}__corrigé`,
      competenceCenterName: "Centre corrigé",
      description: "Ce que fait cette entreprise.",
    });

    expect(updated?.id).toBe(a.domainId);

    const [rowA] = await db
      .select()
      .from(domains)
      .where(eq(domains.id, a.domainId));
    expect(rowA?.name).toBe(`__test__a__${suffix}__corrigé`);
    expect(rowA?.competenceCenterName).toBe("Centre corrigé");
    expect(rowA?.description).toBe("Ce que fait cette entreprise.");
    /* Ni le statut ni l'archivage n'ont bougé : le type ne les propose pas, et
       la requête ne les nomme pas. */
    expect(rowA?.status).toBe("active");
    expect(rowA?.archivedAt).toBeNull();

    const [rowB] = await db
      .select()
      .from(domains)
      .where(eq(domains.id, b.domainId));
    expect(rowB).toEqual(before[0]);

    /* La fixture est laissée telle qu'elle a été trouvée : le nom porte le
       préfixe que le balayage de `vitest.global-setup.ts` reconnaît, et les
       tests qui suivent n'ont pas à savoir que celui-ci est passé. */
    await a.scope.updateOwnDomain({
      name: `__test__a__${suffix}`,
      competenceCenterName: "Centre a",
      description: null,
    });
  });

  test("une description effacée redevient nulle, jamais une phrase vide", async () => {
    await a.scope.updateOwnDomain({ description: "Une phrase." });
    await a.scope.updateOwnDomain({ description: null });

    const [row] = await db
      .select()
      .from(domains)
      .where(eq(domains.id, a.domainId));
    expect(row?.description).toBeNull();
  });

  /**
   * **Un domaine archivé ne se corrige plus**, et le refus se lit en base.
   *
   * Le cas est hors d'atteinte depuis un écran — `loadSession` refuse déjà
   * d'ouvrir une session sur un domaine qui n'est pas actif —, et c'est
   * précisément pourquoi il se mesure ici : la couche peut le rendre, donc elle
   * doit le tenir.
   */
  test("un domaine archivé rend `undefined` et n'écrit rien", async () => {
    const doomed = await outsideAnySession.createDomain({
      name: `__test__archivé__${suffix}`,
      competenceCenterName: "Centre archivé",
    });
    await outsideAnySession.archiveDomain(doomed.id);

    const scope = forDomain({ domainId: doomed.id });
    expect(await scope.updateOwnDomain({ name: "Renommé" })).toBeUndefined();

    const [row] = await db
      .select()
      .from(domains)
      .where(eq(domains.id, doomed.id));
    expect(row?.name).toBe(`__test__archivé__${suffix}`);

    /* **La lecture, elle, ne juge de rien** : elle rend la ligne rangée. */
    expect((await scope.findOwnDomain())?.id).toBe(doomed.id);

    await db.delete(domains).where(eq(domains.id, doomed.id));
  });
});

describe("les garde-fous de typage", () => {
  test("`unlink` refuse une table archivable, `archive` une table de liaison", () => {
    const jamaisAppele = async (scope: ScopedDb) => {
      // @ts-expect-error `entities` porte `archived_at` : elle s'archive, elle ne se supprime pas.
      await scope.unlink(entities, "…");
      // @ts-expect-error `project_jobs` n'a pas `archived_at` : rien à archiver.
      await scope.archive(projectJobs, "…");
      // @ts-expect-error `persons` porte `archived_at` : elle s'archive, elle ne se retire pas.
      await scope.unlink(persons, "…");
      // `person_skills` n'en porte pas : `unlink` y est disponible, sans cast.
      await scope.unlink(personSkills, "…");
      // @ts-expect-error `domains` n'a pas de `domain_id` : elle n'est pas scopable.
      await scope.list(domains);
      // @ts-expect-error `domainId` n'appartient pas à l'appelant.
      await scope.insert(entities, { label: "x", domainId: "…" });
      // @ts-expect-error `products` n'est pas dans `DeletableTable` : une donnée métier ne s'efface pas.
      await scope.deleteRow(products, "…");
      /* **`persons` et `projects` y sont entrés le 28/08/2026**, sur arbitrage
         humain — l'union reste nominative, et c'est elle qu'on relit ici. */
      await scope.deleteRow(persons, "…");
      await scope.deleteRow(projects, "…");
      // `entities` y est depuis le 21/08/2026 : sans cast, comme les deux ci-dessus.
      await scope.deleteRow(entities, "…");
      /* **L'arbitrage de T9.1 se relit ici, à la compilation.**
         `domain_identities` n'a pas d'`archived_at` : un rattachement se retire,
         il ne s'archive pas — l'idiome de `person_skills`. La décision n'est pas
         portée par un commentaire, elle est portée par ces deux lignes. */
      await scope.unlink(domainIdentities, "…");
      // @ts-expect-error `domain_identities` n'a pas `archived_at` : rien à archiver.
      await scope.archive(domainIdentities, "…");
      /* **Le même arbitrage, un chantier plus tard.** `invitations` n'a pas
         d'`archived_at` : une invitation se **révoque** — une date de plus sur
         la ligne —, elle ne s'archive pas. La règle 4 protège la donnée métier,
         et un jeton n'en est pas une. Deux lignes, pas un commentaire. */
      await scope.unlink(invitations, "…");
      // @ts-expect-error `invitations` n'a pas `archived_at` : rien à archiver.
      await scope.archive(invitations, "…");
      /* **Le journal est en écriture seule, et c'est le typage qui le tient**
         (D22, T12.1). `domain_events` n'a pas d'`archived_at` : elle entre dans
         `LinkTable`, donc `archive` est un refus de compilation ; elle n'est pas
         dans `DeletableTable`, donc `deleteRow` en est un aussi. Une trace ne
         s'efface pas, ne se corrige pas et ne s'archive pas — deux lignes, pas
         un commentaire. `unlink` reste disponible à la compilation, comme pour
         les trois autres tables de liaison : **aucun appelant ne l'emploie**, et
         ce qui interdirait la troisième porte est une union nominative, qui est
         un arbitrage humain (voir `DeletableTable`). */
      // @ts-expect-error `domain_events` n'a pas `archived_at` : un journal ne s'archive pas.
      await scope.archive(domainEvents, "…");
      // @ts-expect-error `domain_events` n'est pas dans `DeletableTable` : une trace ne s'efface pas.
      await scope.deleteRow(domainEvents, "…");
      /* **La garde de T9.3 se relit ici, à la compilation.** `createDomain` a
         quitté `superAdmin` : on ne l'obtient qu'en ayant nommé son autorité.
         C'est ce qui a rattrapé les trente-six sites d'appel du jour du ticket,
         et c'est ce qui rattrapera le trente-septième. */
      // @ts-expect-error `createDomain` ne s'obtient que par `asSuperAdmin`.
      await superAdmin.createDomain({ name: "…", competenceCenterName: "…" });
      /* **L'arbitrage (10) de `tickets-C11.md` se relit ici, à la
         compilation.** Un administrateur de domaine gère trois champs
         descriptifs ; `status` et `archived_at` disent qui peut ouvrir une
         session, et `id` désigne le domaine — les trois sont hors de son
         autorité. Ce n'est pas la vigilance qui les tient, c'est le type :
         `OwnDomainValues` étant *faible* — toutes ses propriétés sont
         facultatives —, TypeScript refuse un objet qui n'en partage aucune. */
      await scope.updateOwnDomain({ name: "…" });
      await scope.updateOwnDomain({ description: null });
      // @ts-expect-error `status` n'appartient pas au responsable de domaine.
      await scope.updateOwnDomain({ status: "suspended" });
      // @ts-expect-error `archived_at` non plus : un domaine se range d'au-dessus.
      await scope.updateOwnDomain({ archivedAt: null });
      // @ts-expect-error La cible ne se désigne pas : elle vient de la fermeture.
      await scope.updateOwnDomain({ id: "…" });
    };
    expect(typeof jamaisAppele).toBe("function");
  });
});

/* ==========================================================================
   Le seul chemin non scopé
   ========================================================================== */

describe("superAdmin", () => {
  test("ne donne accès qu'aux domaines et aux identités", async () => {
    const found = await superAdmin.findDomain(a.domainId);
    expect(found?.name).toContain("__test__a__");

    const all = await superAdmin.listDomains();
    const names = all.map((domain) => domain.name);
    expect(names).toContain(`__test__a__${suffix}`);
    expect(names).toContain(`__test__b__${suffix}`);

    /* **La liste reste nominative** — c'est exactement ce que ce sceau sert à
       obtenir : une clé de plus est une décision qui se prend, jamais un ajout
       qui passe.

       **La propriété qu'il garde n'a pas bougé** : aucune de ces fonctions ne
       donne accès à une donnée métier. Ce qui touche `super_admins` vit
       *au-dessus* des domaines et n'en traverse aucun — c'est l'amorçage du
       droit que rien, dans le produit, ne peut s'accorder à lui-même
       (`scripts/auth:super-admin`, T9.2). Le faire vivre dans un script à
       connexion propre aurait contourné la règle 1 plutôt que sa contrainte, et
       **laissé T9.3 sans rien à garder**.

       **Le sceau s'est dédoublé en T9.3, et T9.4 a déplacé sa frontière d'un
       cran.** Le critère n'est pas *lire contre écrire* mais *avec ou sans
       autorité nommable* : `superAdmin` ne garde que ce qui tourne pendant la
       connexion — et dans `/dev/session`, qui par construction n'a pas
       d'autorité. `listSuperAdmins` est passée de l'autre côté : elle dit **qui
       détient le droit**, et son seul appelant tient déjà un grant.

       **Six clés, et chacune dit la sienne** : `findDomain` et `listDomains`
       pour le chargement de session, `findSuperAdminByEmail` pour la règle 2,
       `findSuperAdminById` pour la seconde barrière, `findDomainIdentity` pour
       les règles 3 et 5. Une septième qui ne saurait pas dire la sienne n'aurait
       rien à faire ici.

       **La sixième est la première qui ne vient pas d'une règle d'entrée**, et
       le sceau a fait ce qu'on lui demande : il l'a arrêtée, et elle est entrée
       par une décision. `findInvitationByTokenHash` tourne au même endroit que
       les cinq autres — *pendant* la connexion, avant qu'une session existe :
       sur la page publique d'invitation, qui doit nommer le domaine où l'on
       attend quelqu'un, et au retour du fournisseur, avant que le cookie ne
       soit posé. Le critère du bloc est *avec ou sans autorité nommable*, pas
       *lire contre écrire* ni *les six règles* — et elle est du bon côté.

       **Les deux listes se relisent ensemble**, et c'est la raison de la
       seconde : une fonction qui reviendrait se poser sur `superAdmin`
       quitterait la garde sans qu'aucun autre test ne le dise. */
    expect(Object.keys(superAdmin).sort()).toEqual([
      "findDomain",
      "findDomainIdentity",
      "findInvitationByTokenHash",
      "findSuperAdminByEmail",
      "findSuperAdminById",
      "listDomains",
    ]);

    /* **Neuf clés, dont quatre lisent** — et c'est le déplacement de frontière
       ci-dessus, rendu constatable. Les trois écritures de T9.4 ne touchent que
       `domains` : suspendre, ranger, rétablir. **Aucun `updateDomain`**, et ce
       n'est pas un oubli — la fiche de T9.4 ne liste pas le renommage, et trois
       fonctions nommées le rendent impossible par construction plutôt que par
       vigilance.

       **La neuvième est `listDomainEvents`** (T12.1), et le critère du bloc l'a
       rangée sans hésitation : elle ne tourne pas pendant la connexion, et elle
       dit ce qu'on a fait d'une entreprise. La poser sur `superAdmin` aurait
       ouvert le côté ouvert à une lecture qui n'a rien à y faire — et c'est
       exactement ce que ces deux listes servent à empêcher. */
    expect(Object.keys(outsideAnySession).sort()).toEqual([
      "archiveDomain",
      "createDomain",
      "listDomainEvents",
      "listDomainIdentities",
      "listDomainsForAdmin",
      "listSuperAdmins",
      "restoreDomain",
      "setDomainStatus",
      "upsertSuperAdmin",
    ]);
  });

  test("l'entreprise vérifiée désigne son domaine, et elle seule", async () => {
    const value = `identite-lue-${suffix}.example`;
    await a.scope.insert(domainIdentities, { provider: "google", value });

    const found = await superAdmin.findDomainIdentity("google", value);
    expect(found?.domainId).toBe(a.domainId);

    // Le fournisseur fait partie de la question : la valeur seule ne suffit pas.
    expect(await superAdmin.findDomainIdentity("microsoft", value)).toBeUndefined();
    expect(
      await superAdmin.findDomainIdentity("google", `${value}.absent`),
    ).toBeUndefined();
  });

  /**
   * **La casse du jeton ne décide de rien** (T9.6) — point ouvert refermé.
   *
   * `lib/forms/domain.ts` **abaisse** l'identité à la saisie, si bien qu'une
   * valeur en base est toujours en minuscules. Mais le `hd` que rend le
   * fournisseur, lui, n'était confronté qu'en `eq` : la garantie tenait à un
   * **usage**, pas à une règle. Le jour où un fournisseur rendrait `ACME.COM`,
   * l'entreprise cliente cesserait d'être reconnue — et le refus ne dirait pas
   * pourquoi (T9.2 refuse sans distinguer ses causes, délibérément).
   *
   * C'est la forme de `findSuperAdminByEmail` juste en dessous, et celle du
   * rapprochement de `lib/auth/entry.ts` : les trois lectures d'identité disent
   * maintenant la même chose.
   */
  test("l'entreprise vérifiée se trouve quelle que soit la casse du jeton", async () => {
    const value = `casse-du-jeton-${suffix}.example`;
    await a.scope.insert(domainIdentities, { provider: "google", value });

    for (const received of [
      value.toUpperCase(),
      `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`,
    ]) {
      expect(
        (await superAdmin.findDomainIdentity("google", received))?.domainId,
      ).toBe(a.domainId);
    }
  });

  test("un super administrateur se trouve quelle que soit la casse", async () => {
    const email = `Camille.MAJUSCULE.${suffix}@exemple.test`;
    await db
      .insert(superAdmins)
      .values({ email, fullName: `Camille ${suffix}` });

    expect((await superAdmin.findSuperAdminByEmail(email))?.email).toBe(email);
    // Le fournisseur rendra l'adresse en minuscules : elle doit trouver la ligne.
    expect(
      (await superAdmin.findSuperAdminByEmail(email.toLowerCase()))?.email,
    ).toBe(email);
  });

  test("un super administrateur archivé n'est plus rendu", async () => {
    const email = `archive.${suffix}@exemple.test`;
    const rows = await db
      .insert(superAdmins)
      .values({ email, fullName: `Archivé ${suffix}` })
      .returning();

    expect(await superAdmin.findSuperAdminByEmail(email)).toBeDefined();

    await db
      .update(superAdmins)
      .set({ archivedAt: new Date() })
      .where(eq(superAdmins.id, rows[0]!.id));

    // La ligne est toujours là — c'est le droit qui est retiré, pas la donnée.
    expect(await superAdmin.findSuperAdminByEmail(email)).toBeUndefined();
    expect(
      await db.select().from(superAdmins).where(eq(superAdmins.id, rows[0]!.id)),
    ).toHaveLength(1);
  });

  /* **Rejouable, et mesuré en base** — la propriété que T8.4 a posée sur les
     référentiels, rejouée sur l'amorçage du droit. Un script qu'on hésite à
     relancer n'est pas un outil, et le décompte tranche : un second appel qui
     aurait créé une ligne se lirait exactement comme un appel qui l'a mise à
     jour, si l'on s'en tenait à ce que la fonction rend. */
  test("une seconde pose met à jour plutôt que de doubler", async () => {
    const email = `rejouable.${suffix}@exemple.test`;

    const first = await outsideAnySession.upsertSuperAdmin({
      email,
      fullName: `Première ${suffix}`,
    });
    expect(first.created).toBe(true);

    const second = await outsideAnySession.upsertSuperAdmin({
      email: email.toUpperCase(),
      fullName: `Seconde ${suffix}`,
    });
    expect(second.created).toBe(false);
    expect(second.row.id).toBe(first.row.id);

    const rows = await db
      .select()
      .from(superAdmins)
      .where(sql`lower(${superAdmins.email}) = lower(${email})`);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.fullName).toBe(`Seconde ${suffix}`);
  });

  /* Réaccorder le droit à quelqu'un qu'on avait archivé est un geste légitime.
     Le refuser en silence sur un conflit d'unicité serait illisible : c'est la
     raison pour laquelle cette lecture-ci n'écarte pas les archivés, quand
     `findSuperAdminByEmail` le fait. */
  test("une seconde pose rétablit une ligne archivée", async () => {
    const email = `retabli.${suffix}@exemple.test`;

    const { row } = await outsideAnySession.upsertSuperAdmin({
      email,
      fullName: `À rétablir ${suffix}`,
    });
    await db
      .update(superAdmins)
      .set({ archivedAt: new Date() })
      .where(eq(superAdmins.id, row.id));

    expect(await superAdmin.findSuperAdminByEmail(email)).toBeUndefined();

    const again = await outsideAnySession.upsertSuperAdmin({
      email,
      fullName: `Rétabli ${suffix}`,
    });

    expect(again.created).toBe(false);
    expect(again.row.id).toBe(row.id);
    expect((await superAdmin.findSuperAdminByEmail(email))?.id).toBe(row.id);
  });

  test("la liste ne porte que les super administrateurs en exercice", async () => {
    const email = `hors-liste.${suffix}@exemple.test`;
    const { row } = await outsideAnySession.upsertSuperAdmin({
      email,
      fullName: `Hors liste ${suffix}`,
    });

    expect(
      (await outsideAnySession.listSuperAdmins()).map((admin) => admin.id),
    ).toContain(row.id);

    await db
      .update(superAdmins)
      .set({ archivedAt: new Date() })
      .where(eq(superAdmins.id, row.id));

    expect(
      (await outsideAnySession.listSuperAdmins()).map((admin) => admin.id),
    ).not.toContain(row.id);
  });
});

/* ==========================================================================
   L'autorité d'une écriture au-dessus des domaines — T9.3

   **La couche ne croit pas un `SuperAdminGrant` sur parole.** Le typage oblige
   à nommer une autorité ; il ne dit pas qu'elle existe encore. Sans la relecture
   de la ligne, forger `{ kind: "super_admin", superAdminId: … }` depuis `app/`
   suffirait — et un super administrateur archivé garderait son droit un mois,
   le temps que son cookie expire.

   **Le décompte en base tranche, jamais la levée.** Une exception ressemble à
   une autre, et un refus rend 200 comme une réussite (leçon de T6.1) : chaque
   cas lit la cible **avant** le geste, puis après. Sans l'étape témoin, un test
   qui compte zéro à la fin ne distingue pas un refus d'une cible qui n'a jamais
   été atteignable.
   ========================================================================== */

describe("l'autorité d'une écriture au-dessus des domaines", () => {
  const countDomains = async (name: string): Promise<number> =>
    (await db.select().from(domains).where(eq(domains.name, name))).length;

  const countAdmins = async (email: string): Promise<number> =>
    (await db.select().from(superAdmins).where(eq(superAdmins.email, email)))
      .length;

  /** Un super administrateur en exercice, son identifiant et son autorité. */
  async function grantOf(
    label: string,
  ): Promise<{ id: string; grant: SuperAdminGrant }> {
    const { row } = await outsideAnySession.upsertSuperAdmin({
      email: `${label}.${suffix}@exemple.test`,
      fullName: `Autorité ${label} ${suffix}`,
    });
    return { id: row.id, grant: { kind: "super_admin", superAdminId: row.id } };
  }

  test("une autorité qui ne désigne personne ne crée pas de domaine", async () => {
    const name = `__test__sans-autorite__${suffix}`;
    expect(await countDomains(name)).toBe(0);

    const forged: SuperAdminGrant = {
      kind: "super_admin",
      superAdminId: crypto.randomUUID(),
    };

    await expect(
      asSuperAdmin(forged).createDomain({
        name,
        competenceCenterName: "Centre forgé",
      }),
    ).rejects.toThrow(SuperAdminRequiredError);

    expect(await countDomains(name)).toBe(0);
  });

  test("une autorité archivée ne crée plus de domaine", async () => {
    const { id, grant } = await grantOf("archivee");
    const name = `__test__autorite-archivee__${suffix}`;
    expect(await countDomains(name)).toBe(0);

    /* Archiver **est** le geste qui retire le droit : la ligne existe encore,
       et c'est exactement ce que la relecture doit refuser. */
    await db
      .update(superAdmins)
      .set({ archivedAt: new Date() })
      .where(eq(superAdmins.id, id));

    await expect(
      asSuperAdmin(grant).createDomain({
        name,
        competenceCenterName: "Centre archivé",
      }),
    ).rejects.toThrow(SuperAdminRequiredError);

    expect(await countDomains(name)).toBe(0);
  });

  test("une autorité archivée ne pose plus de super administrateur", async () => {
    const { id, grant } = await grantOf("archivee-bis");
    const email = `jamais-pose.${suffix}@exemple.test`;
    expect(await countAdmins(email)).toBe(0);

    await db
      .update(superAdmins)
      .set({ archivedAt: new Date() })
      .where(eq(superAdmins.id, id));

    await expect(
      asSuperAdmin(grant).upsertSuperAdmin({
        email,
        fullName: `Jamais posé ${suffix}`,
      }),
    ).rejects.toThrow(SuperAdminRequiredError);

    expect(await countAdmins(email)).toBe(0);
  });

  /* **La mesure qui prouve que la garde sert à quelque chose.** Les trois
     au-dessus prouvent qu'elle ne laisse pas passer ; celle-ci prouve qu'elle
     laisse passer ce qu'elle doit. Une garde qui refuse tout se testerait aussi
     bien sans le produit. */
  test("un super administrateur en exercice crée un domaine", async () => {
    const { grant } = await grantOf("en-exercice");
    const name = `__test__autorite-vivante__${suffix}`;
    expect(await countDomains(name)).toBe(0);

    const domain = await asSuperAdmin(grant).createDomain({
      name,
      competenceCenterName: "Centre vivant",
    });

    try {
      expect(await countDomains(name)).toBe(1);
    } finally {
      await db.delete(domains).where(eq(domains.id, domain.id));
    }
  });

  /* ------------------------------------------------------------------------
     Les six clés que T9.4 ajoute — trois lectures, trois écritures

     **La même garde les tient toutes**, et c'est pourquoi elles se mesurent en
     deux cas et non en six : `assertAuthority` neutralisée doit faire tomber
     ceux-ci et rien d'autre. Ce qui se mesure séparément, ce sont les
     conditions **propres** à chaque geste — le `is null` de la bascule, celui du
     rangement —, qui n'ont rien à voir avec l'autorité.
     ------------------------------------------------------------------------ */

  /** Un domaine jetable, rendu avec de quoi le reprendre en base. */
  async function throwawayDomain(label: string): Promise<{ id: string }> {
    const { grant } = await grantOf(`porteur-${label}`);
    const domain = await asSuperAdmin(grant).createDomain({
      name: `__test__${label}__${suffix}`,
      competenceCenterName: `Centre ${label}`,
    });
    return { id: domain.id };
  }

  const domainRow = async (id: string) =>
    (await db.select().from(domains).where(eq(domains.id, id)))[0];

  async function dropDomain(id: string): Promise<void> {
    /* **Les invitations d'abord** : `invitations.person_id` est `restrict`, et
       une personne invitée ne se supprime pas sans que le geste le dise. */
    await db.delete(invitations).where(eq(invitations.domainId, id));
    await db.delete(persons).where(eq(persons.domainId, id));
    await db.delete(domainIdentities).where(eq(domainIdentities.domainId, id));
    await db.delete(domains).where(eq(domains.id, id));
  }

  test("une autorité forgée ne bascule, ne range ni ne rétablit un domaine", async () => {
    const { id } = await throwawayDomain("autorite-forgee");
    const forged: SuperAdminGrant = {
      kind: "super_admin",
      superAdminId: crypto.randomUUID(),
    };

    try {
      /* L'étape témoin : l'état d'avant est lu, sinon « toujours actif » ne
         distinguerait pas un refus d'une bascule qui n'a jamais pu porter. */
      expect((await domainRow(id))?.status).toBe("active");
      expect((await domainRow(id))?.archivedAt).toBeNull();

      await expect(
        asSuperAdmin(forged).setDomainStatus(id, "suspended"),
      ).rejects.toThrow(SuperAdminRequiredError);
      await expect(asSuperAdmin(forged).archiveDomain(id)).rejects.toThrow(
        SuperAdminRequiredError,
      );
      await expect(asSuperAdmin(forged).restoreDomain(id)).rejects.toThrow(
        SuperAdminRequiredError,
      );

      expect((await domainRow(id))?.status).toBe("active");
      expect((await domainRow(id))?.archivedAt).toBeNull();
    } finally {
      await dropDomain(id);
    }
  });

  test("une autorité forgée ne lit rien au-dessus des domaines", async () => {
    const forged: SuperAdminGrant = {
      kind: "super_admin",
      superAdminId: crypto.randomUUID(),
    };

    await expect(asSuperAdmin(forged).listSuperAdmins()).rejects.toThrow(
      SuperAdminRequiredError,
    );
    await expect(asSuperAdmin(forged).listDomainsForAdmin()).rejects.toThrow(
      SuperAdminRequiredError,
    );
    await expect(
      asSuperAdmin(forged).listDomainIdentities(a.domainId),
    ).rejects.toThrow(SuperAdminRequiredError);
  });

  /* **La mesure qui prouve que les trois gestes servent à quelque chose.** */
  test("un super administrateur en exercice suspend, range et rétablit", async () => {
    const { grant } = await grantOf("trois-gestes");
    const { id } = await throwawayDomain("trois-gestes");

    try {
      expect((await asSuperAdmin(grant).setDomainStatus(id, "suspended"))?.status).toBe(
        "suspended",
      );
      expect((await domainRow(id))?.status).toBe("suspended");

      expect(await asSuperAdmin(grant).archiveDomain(id)).toBeDefined();
      expect((await domainRow(id))?.archivedAt).not.toBeNull();

      expect(await asSuperAdmin(grant).restoreDomain(id)).toBeDefined();
      expect((await domainRow(id))?.archivedAt).toBeNull();

      /* **Le statut ne bouge pas au rétablissement** : une entreprise suspendue
         puis rangée revient suspendue. Rétablir défait un rangement, il ne
         rouvre pas une porte fermée pour une autre raison. */
      expect((await domainRow(id))?.status).toBe("suspended");
    } finally {
      await dropDomain(id);
    }
  });

  test("un domaine rangé ne bascule plus de statut", async () => {
    const { grant } = await grantOf("range-fige");
    const { id } = await throwawayDomain("range-fige");

    try {
      await asSuperAdmin(grant).archiveDomain(id);
      expect((await domainRow(id))?.status).toBe("active");

      /* Rend `undefined`, comme un identifiant qui ne désigne rien : sans cette
         condition, « suspendu et archivé » existerait, et aucun écran ne
         saurait quoi en dire. */
      expect(
        await asSuperAdmin(grant).setDomainStatus(id, "suspended"),
      ).toBeUndefined();
      expect((await domainRow(id))?.status).toBe("active");
    } finally {
      await dropDomain(id);
    }
  });

  test("un second rangement ne récrit pas la date du premier", async () => {
    const { grant } = await grantOf("range-deux-fois");
    const { id } = await throwawayDomain("range-deux-fois");

    try {
      const first = await asSuperAdmin(grant).archiveDomain(id);
      expect(first?.archivedAt).toBeDefined();

      expect(await asSuperAdmin(grant).archiveDomain(id)).toBeUndefined();
      expect((await domainRow(id))?.archivedAt?.getTime()).toBe(
        first?.archivedAt?.getTime(),
      );
    } finally {
      await dropDomain(id);
    }
  });

  test("la liste dit ce qui manque à une entreprise pour être joignable", async () => {
    const { grant } = await grantOf("joignable");
    const { id } = await throwawayDomain("joignable");
    const scope = forDomain({ domainId: id });

    const rowOf = async () =>
      (await asSuperAdmin(grant).listDomainsForAdmin()).find(
        (domain) => domain.id === id,
      );

    try {
      /* Un domaine neuf n'est joignable par personne : aucun jeton ne le
         désigne, et aucun compte ne l'ouvre. */
      expect(await rowOf()).toMatchObject({
        hasIdentity: false,
        hasAccount: false,
      });

      await scope.insert(domainIdentities, {
        provider: "google",
        value: `joignable-${suffix}.example`,
      });
      expect(await rowOf()).toMatchObject({
        hasIdentity: true,
        hasAccount: false,
      });

      /* **Une personne sans accès ne compte pas** : être référencé et pouvoir se
         connecter sont deux choses distinctes (D19). */
      const referenced = await scope.insert(persons, {
        fullName: `Référencée ${suffix}`,
        source: "manual",
        kind: "stakeholder",
      });
      expect((await rowOf())?.hasAccount).toBe(false);

      await scope.insert(persons, {
        fullName: `Responsable ${suffix}`,
        source: "manual",
        kind: "center",
        email: `responsable.${suffix}@exemple.test`,
        hasAccess: true,
        domainRole: "domain_manager",
      });
      expect((await rowOf())?.hasAccount).toBe(true);

      /* Archiver le seul compte rend l'entreprise injoignable : c'est la règle 6
         qui le dit, et la lecture doit dire la même chose qu'elle. */
      await db
        .update(persons)
        .set({ archivedAt: new Date() })
        .where(and(eq(persons.domainId, id), eq(persons.hasAccess, true)));
      expect((await rowOf())?.hasAccount).toBe(false);

      expect(referenced.domainId).toBe(id);
    } finally {
      await dropDomain(id);
    }
  });

  /**
   * **Le troisième fait d'accessibilité** — T11.4.
   *
   * Sans lui, un domaine correctement amorcé se lirait comme un domaine que
   * personne ne peut ouvrir : l'administrateur est désigné, son lien est parti,
   * et son compte s'ouvrira à l'acceptation (arbitrage (9)). La lecture doit
   * dire *une invitation attend*, jamais combien ni depuis quand.
   */
  test("la liste dit qu'une invitation attend, et cesse quand elle se referme", async () => {
    const { grant } = await grantOf("invitation-en-attente");
    const { id } = await throwawayDomain("invitation-en-attente");
    const scope = forDomain({ domainId: id });

    const rowOf = async () =>
      (await asSuperAdmin(grant).listDomainsForAdmin()).find(
        (domain) => domain.id === id,
      );

    try {
      expect((await rowOf())?.hasPendingInvitation).toBe(false);

      const invited = await scope.insert(persons, {
        fullName: `Invité ${suffix}`,
        source: "manual",
        kind: "center",
        email: `invite.attente.${suffix}@exemple.test`,
      });

      const row = await scope.insert(invitations, {
        personId: invited.id,
        email: `invite.attente.${suffix}@exemple.test`,
        role: "domain_manager",
        tokenHash: `hash-attente-${suffix}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      expect(await rowOf()).toMatchObject({
        hasAccount: false,
        hasPendingInvitation: true,
      });

      /* **Une invitation périmée compte encore** : le lien est mort, la ligne
         est vivante, et l'index partiel la retiendrait. C'est l'expression de
         `invitations_pending_unique`, mot pour mot — deux lectures qui
         divergeraient ici diraient deux choses de la même ligne. */
      await scope.update(invitations, row.id, {
        expiresAt: new Date(Date.now() - 1_000),
      });
      expect((await rowOf())?.hasPendingInvitation).toBe(true);

      /* Révoquée, elle n'est plus qu'une trace. */
      await scope.update(invitations, row.id, { revokedAt: new Date() });
      expect((await rowOf())?.hasPendingInvitation).toBe(false);

      /* Acceptée, elle n'en est pas une autre — et le compte, lui, paraît. */
      await scope.update(invitations, row.id, {
        revokedAt: null,
        acceptedAt: new Date(),
      });
      await scope.update(persons, invited.id, {
        hasAccess: true,
        domainRole: "domain_manager",
      });
      expect(await rowOf()).toMatchObject({
        hasAccount: true,
        hasPendingInvitation: false,
      });
    } finally {
      await dropDomain(id);
    }
  });

  /**
   * **L'alias, et le piège qu'il ferme** — mesuré par sonde le 06/09/2026 sur
   * les deux sous-requêtes voisines, et reposé ici pour la troisième.
   *
   * Sans alias, `pending.domain_id = domains.id` se résoudrait **dans** la
   * sous-requête et rendrait `false` en silence : un résultat plausible, qu'un
   * test de forme n'aurait pas attrapé. Le témoin est le domaine voisin — celui
   * qui n'a pas d'invitation ne doit pas hériter de celle de l'autre.
   */
  test("l'invitation d'une entreprise n'est jamais lue sur une autre", async () => {
    const { grant } = await grantOf("invitation-voisine");
    const { id } = await throwawayDomain("invitation-voisine");
    const { id: other } = await throwawayDomain("invitation-voisine-temoin");
    const scope = forDomain({ domainId: id });

    try {
      const invited = await scope.insert(persons, {
        fullName: `Invité voisin ${suffix}`,
        source: "manual",
        kind: "center",
        email: `invite.voisin.${suffix}@exemple.test`,
      });
      await scope.insert(invitations, {
        personId: invited.id,
        email: `invite.voisin.${suffix}@exemple.test`,
        role: "domain_manager",
        tokenHash: `hash-voisin-${suffix}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const rows = await asSuperAdmin(grant).listDomainsForAdmin();
      expect(rows.find((domain) => domain.id === id)?.hasPendingInvitation).toBe(
        true,
      );
      expect(
        rows.find((domain) => domain.id === other)?.hasPendingInvitation,
      ).toBe(false);
    } finally {
      await dropDomain(id);
      await dropDomain(other);
    }
  });

  test("les identités d'un domaine ne rendent que les siennes", async () => {
    const { grant } = await grantOf("identites");
    const { id } = await throwawayDomain("identites");
    const scope = forDomain({ domainId: id });

    try {
      await scope.insert(domainIdentities, {
        provider: "google",
        value: `sienne-${suffix}.example`,
      });
      await a.scope.insert(domainIdentities, {
        provider: "microsoft",
        value: `voisine-${suffix}`,
      });

      const rows = await asSuperAdmin(grant).listDomainIdentities(id);
      expect(rows.map((row) => row.value)).toEqual([
        `sienne-${suffix}.example`,
      ]);
    } finally {
      await dropDomain(id);
    }
  });
});

/* ==========================================================================
   Le schéma de l'identité — T9.1

   **Les contraintes se mesurent en base, jamais dans le schéma.** Une
   déclaration Drizzle qui n'aurait pas été portée par la migration se lirait
   exactement comme une déclaration appliquée ; seule une écriture refusée par
   PostgreSQL tranche.

   **Un cas par contrainte**, et non plusieurs assertions dans un cas : sinon,
   neutraliser l'une ferait tomber le même test que neutraliser les autres, et
   la mise en défaut ne désignerait plus rien (précédent des trois clés de
   `person_skills`). Chaque cas compte les lignes **avant et après** au client
   brut — un rejet qui n'aurait rien empêché se lirait pareil sans ce décompte.
   ========================================================================== */

describe("l'identité", () => {
  test("une même entreprise vérifiée n'ouvre pas sur deux domaines", async () => {
    const value = `couple-unique-${suffix}.example`;
    await a.scope.insert(domainIdentities, { provider: "google", value });

    const witness = () =>
      db.select().from(domainIdentities).where(eq(domainIdentities.value, value));
    expect(await witness()).toHaveLength(1);

    // Depuis l'autre domaine, avec le même couple : c'est la porte que
    // `domain_identities_provider_value_unique` ferme.
    await expect(
      b.scope.insert(domainIdentities, { provider: "google", value }),
    ).rejects.toThrow();

    expect(await witness()).toHaveLength(1);
    expect((await witness())[0]?.domainId).toBe(a.domainId);
  });

  test("un rattachement vers un domaine inexistant est refusé", async () => {
    const value = `domaine-absent-${suffix}.example`;
    const before = await db.select().from(domainIdentities);

    /* **Écrit par le client brut, et c'est nécessaire :** la couche scopée pose
       elle-même le `domain_id`, elle ne peut pas en forger un — c'est justement
       sa propriété. Ce qui est sous test ici est la clé étrangère, pas la
       couche. */
    await expect(
      db.insert(domainIdentities).values({
        domainId: "00000000-0000-4000-8000-000000000000",
        provider: "microsoft",
        value,
      }),
    ).rejects.toThrow();

    expect(await db.select().from(domainIdentities)).toHaveLength(before.length);
  });

  test("un second super administrateur sur le même e-mail est refusé", async () => {
    const email = `unique.${suffix}@exemple.test`;
    await db.insert(superAdmins).values({ email, fullName: `Unique ${suffix}` });

    const witness = () =>
      db
        .select()
        .from(superAdmins)
        .where(sql`lower(${superAdmins.email}) = lower(${email})`);
    expect(await witness()).toHaveLength(1);

    await expect(
      db.insert(superAdmins).values({ email, fullName: "Doublon exact" }),
    ).rejects.toThrow();

    /* **La variante de casse, et c'est elle qui mesure `lower(email)`.** Un
       unique ordinaire sur `email` accepterait cette ligne : deux super
       administrateurs pour une seule personne, et le rapprochement de la règle
       d'entrée 2 en trouverait un au hasard. */
    await expect(
      db
        .insert(superAdmins)
        .values({ email: email.toUpperCase(), fullName: "Doublon de casse" }),
    ).rejects.toThrow();

    expect(await witness()).toHaveLength(1);
  });

  test("un fournisseur sans identifiant est refusé sur `super_admins`", async () => {
    const email = `sans-identifiant.${suffix}@exemple.test`;
    const before = await db.select().from(superAdmins);

    await expect(
      db.insert(superAdmins).values({
        email,
        fullName: "Sans identifiant",
        identityProvider: "google",
      }),
    ).rejects.toThrow();

    expect(await db.select().from(superAdmins)).toHaveLength(before.length);
  });

  test("un fournisseur sans identifiant est refusé sur `persons`", async () => {
    const before = await db.select().from(persons).where(eq(persons.domainId, a.domainId));

    /* `source: "manual"` isole la contrainte : avec `directory`, un échec
       pourrait venir de `persons_external_id_requires_directory`, qui existe
       depuis C1. Une contrainte ne se mesure que si elle est seule à pouvoir
       refuser. */
    await expect(
      a.scope.insert(persons, {
        fullName: `Sans identifiant ${suffix}`,
        source: "manual",
        kind: "center",
        identityProvider: "google",
      }),
    ).rejects.toThrow();

    expect(
      await db.select().from(persons).where(eq(persons.domainId, a.domainId)),
    ).toHaveLength(before.length);
  });

  test("l'identifiant d'annuaire reste unique par domaine", async () => {
    const externalId = `annuaire-${suffix}`;
    await a.scope.insert(persons, {
      fullName: `Annuaire ${suffix}`,
      source: "directory",
      externalId,
      identityProvider: "google",
      kind: "center",
    });

    const witness = () =>
      db
        .select()
        .from(persons)
        .where(
          and(eq(persons.domainId, a.domainId), eq(persons.externalId, externalId)),
        );
    expect(await witness()).toHaveLength(1);

    /* **La clé n'a pas changé en T9.1, et c'est ce que ce cas mesure.** Le
       fournisseur n'y est pas entré : l'y ajouter aurait rendu cette seconde
       ligne acceptable dès que le fournisseur est nul, les `NULL` étant
       distincts en PostgreSQL. La colonne neuve ne devait rien affaiblir. */
    await expect(
      a.scope.insert(persons, {
        fullName: `Annuaire doublon ${suffix}`,
        source: "directory",
        externalId,
        kind: "center",
      }),
    ).rejects.toThrow();

    expect(await witness()).toHaveLength(1);

    // Le même identifiant dans l'autre domaine reste légitime : la clé est bornée.
    const elsewhere = await b.scope.insert(persons, {
      fullName: `Annuaire ailleurs ${suffix}`,
      source: "directory",
      externalId,
      kind: "center",
    });
    expect(elsewhere.domainId).toBe(b.domainId);
  });
});

/* ==========================================================================
   L'invitation
   ========================================================================== */

/**
 * Quelle contrainte a refusé cette écriture ?
 *
 * **Un `toThrow()` nu passe pour n'importe quelle levée** — une colonne
 * manquante, un réseau coupé — et cesse alors de dire ce qu'il prétend dire.
 * Le nom de la contrainte, lui, ne peut venir que d'elle. Il vit dans la
 * **cause** : `drizzle` enveloppe la levée du pilote dans un « Failed query »,
 * si bien que le message ne le porte pas.
 */
async function refusedBy(write: Promise<unknown>): Promise<string | undefined> {
  try {
    await write;
    return undefined;
  } catch (error) {
    return (error as { cause?: { constraint?: string } }).cause?.constraint;
  }
}

describe("l'invitation", () => {
  /** Une invitation vivante, prête à être insérée. */
  const pending = (personId: string, tokenHash: string) => ({
    personId,
    email: `invite-${tokenHash}@exemple.test`,
    role: "member" as const,
    tokenHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  /**
   * **Une personne par cas, jamais celle de la fixture.**
   *
   * `invitations_pending_unique` porte sur `(domain_id, person_id)` : deux cas
   * qui partageraient une personne se gêneraient par l'index même qu'ils
   * éprouvent, et le second tomberait pour la raison du premier. Le couplage
   * par l'ordre est un faux positif qui attend son heure.
   */
  const freshPerson = async (scope: typeof a.scope, label: string) =>
    scope.insert(persons, {
      fullName: `Invitée ${label} ${suffix}`,
      source: "manual",
      kind: "center",
    });

  test("une empreinte de jeton ne désigne qu'une invitation", async () => {
    const tokenHash = `hash-unique-${suffix}`;
    const person = await freshPerson(a.scope, "empreinte");
    await a.scope.insert(invitations, pending(person.id, tokenHash));

    /* **L'unicité est ce qui rend la lecture par lien non ambiguë.** Sans elle,
       `findInvitationByTokenHash` ferait un `limit 1` sans ordre sur deux
       candidates — exactement le piège que T9.6 a mesuré sur l'adresse. */
    const elsewhere = await freshPerson(b.scope, "empreinte ailleurs");
    /* **La contrainte se nomme dans l'assertion.** Un `toThrow()` nu passe pour
       n'importe quelle levée — une colonne manquante, un réseau coupé — et
       cesse alors de dire ce qu'il prétend dire. */
    expect(
      await refusedBy(b.scope.insert(invitations, pending(elsewhere.id, tokenHash))),
    ).toBe("invitations_token_hash_unique");

    const rows = await db
      .select()
      .from(invitations)
      .where(eq(invitations.tokenHash, tokenHash));
    expect(rows).toHaveLength(1);
  });

  test("une seule invitation vivante par personne, et les refermées s'accumulent", async () => {
    const person = await freshPerson(a.scope, "vivante");
    const first = await a.scope.insert(
      invitations,
      pending(person.id, `hash-vivante-1-${suffix}`),
    );

    expect(
      await refusedBy(
        a.scope.insert(invitations, pending(person.id, `hash-vivante-2-${suffix}`)),
      ),
    ).toBe("invitations_pending_unique");

    /* Révoquer libère la place : c'est ce qui fait de « réinviter » un geste
       sûr — le lien précédent cesse de valoir avant que le suivant existe. */
    await a.scope.update(invitations, first.id, { revokedAt: new Date() });
    const second = await a.scope.insert(
      invitations,
      pending(person.id, `hash-vivante-2-${suffix}`),
    );

    /* Accepter la libère de même, et l'index étant **partiel**, les deux
       refermées restent en base : une invitation acceptée est une trace. */
    await a.scope.update(invitations, second.id, { acceptedAt: new Date() });
    await a.scope.insert(invitations, pending(person.id, `hash-vivante-3-${suffix}`));

    const rows = await db
      .select()
      .from(invitations)
      .where(eq(invitations.personId, person.id));
    expect(rows).toHaveLength(3);
  });

  test("une personne d'un autre domaine est refusée avant l'écriture", async () => {
    /* La clé étrangère PostgreSQL, elle, accepterait : elle ignore le domaine.
       C'est `assertPreconditions` qui refuse, et il le fait **avant** d'écrire. */
    await expect(
      a.scope.insert(invitations, pending(b.personId, `hash-etranger-${suffix}`)),
    ).rejects.toThrow(DomainScopeError);

    const rows = await db
      .select()
      .from(invitations)
      .where(eq(invitations.personId, b.personId));
    expect(rows).toHaveLength(0);
  });

  test("`findInvitationByTokenHash` rend la ligne sans juger de son état", async () => {
    const tokenHash = `hash-lecture-${suffix}`;
    const person = await freshPerson(a.scope, "lecture");
    const row = await a.scope.insert(invitations, {
      ...pending(person.id, tokenHash),
      /* **Périmée à la seconde où elle est écrite** : la lecture doit la rendre
         quand même. Filtrer ici rendrait un refus *sans cause*, et les sept
         causes de `lib/auth/entry.ts` sont ce qui permet de les isoler à la
         mise en défaut. Le tri appartient à l'appelant. */
      expiresAt: new Date(Date.now() - 1000),
    });

    const found = await superAdmin.findInvitationByTokenHash(tokenHash);
    expect(found?.id).toBe(row.id);
    expect(found?.domainId).toBe(a.domainId);

    /* **Elle ne rend que de quoi désigner un domaine.** C'est la frontière du
       bloc non scopé : l'acceptation, elle, repassera par `forDomain`. */
    expect(
      await superAdmin.findInvitationByTokenHash(`${tokenHash}-absent`),
    ).toBeUndefined();
  });
});

/* ==========================================================================
   L'adresse d'une personne
   ========================================================================== */

describe("l'adresse d'une personne", () => {
  test("deux fois la même adresse dans un domaine sont refusées, casse comprise", async () => {
    const email = `Doublon.${suffix}@exemple.test`;
    await a.scope.insert(persons, {
      fullName: `Adresse une ${suffix}`,
      source: "manual",
      kind: "center",
      email,
    });

    /* **Le refus de T9.6 vivait dans l'action seule.** Il vit maintenant en
       base, et il y vit en `lower()` : une unicité sensible à la casse
       laisserait entrer le doublon qu'elle prétend écarter, quand le
       rapprochement de la règle d'entrée 6 lit `lower()` des deux côtés. */
    expect(
      await refusedBy(
        a.scope.insert(persons, {
          fullName: `Adresse deux ${suffix}`,
          source: "manual",
          kind: "center",
          email: email.toUpperCase(),
        }),
      ),
    ).toBe("persons_domain_email_unique");
  });

  test("une personne archivée retient toujours son adresse", async () => {
    const email = `Archivee.${suffix}@exemple.test`;
    const row = await a.scope.insert(persons, {
      fullName: `Adresse archivée ${suffix}`,
      source: "manual",
      kind: "center",
      email,
    });
    await a.scope.archive(persons, row.id);

    /* **C'est la raison exacte que le point ouvert donnait**, et c'est pourquoi
       l'index n'est pas partiel : le rapprochement de la règle 6 lit
       `includeArchived`, si bien qu'une ligne archivée reste une candidate.
       Une unicité qui les laisserait passer ne protégerait rien. */
    expect(
      await refusedBy(
        a.scope.insert(persons, {
          fullName: `Adresse ressuscitée ${suffix}`,
          source: "manual",
          kind: "center",
          email,
        }),
      ),
    ).toBe("persons_domain_email_unique");
  });

  test("sans adresse, aucune personne n'en gêne une autre", async () => {
    /* D19 — être référencé n'est pas se connecter. Les `NULL` restent
       distincts pour PostgreSQL, et c'est ce qui laisse un domaine porter
       autant de personnes sans compte qu'il en accompagne. */
    for (const rank of [1, 2, 3]) {
      const row = await a.scope.insert(persons, {
        fullName: `Sans adresse ${rank} ${suffix}`,
        source: "manual",
        kind: "stakeholder",
      });
      expect(row.email).toBeNull();
    }
  });

  test("la même adresse dans deux domaines reste légitime", async () => {
    /* La clé est bornée au domaine, comme `persons_domain_external_id_unique` :
       une même personne peut intervenir pour deux entreprises clientes, et
       chacune n'en voit jamais que sa ligne. */
    const email = `Partagee.${suffix}@exemple.test`;
    await a.scope.insert(persons, {
      fullName: `Partagée a ${suffix}`,
      source: "manual",
      kind: "center",
      email,
    });
    const elsewhere = await b.scope.insert(persons, {
      fullName: `Partagée b ${suffix}`,
      source: "manual",
      kind: "center",
      email,
    });
    expect(elsewhere.domainId).toBe(b.domainId);
  });
});

/* ==========================================================================
   Le journal d'administration — T12.1

   **La table existe, et rien ne l'écrit encore** : les dix gestes viendront au
   ticket suivant. Ce qui se mesure ici est donc la table elle-même — ses deux
   garanties d'écriture — et sa seule lecture, avant qu'aucun appelant ne
   dépende d'elle.
   ========================================================================== */

describe("le journal d'administration", () => {
  /** Un super administrateur en exercice, son identifiant et son autorité. */
  async function authority(
    label: string,
  ): Promise<{ id: string; name: string; grant: SuperAdminGrant }> {
    const name = `Autorité ${label} ${suffix}`;
    const { row } = await outsideAnySession.upsertSuperAdmin({
      email: `journal-${label}.${suffix}@exemple.test`,
      fullName: name,
    });
    return {
      id: row.id,
      name,
      grant: { kind: "super_admin", superAdminId: row.id },
    };
  }

  const countEvents = async (domainId: string): Promise<number> =>
    (await db.select().from(domainEvents).where(eq(domainEvents.domainId, domainId)))
      .length;

  /**
   * Un domaine jetable, et sa portée — **jamais ceux de la fixture**.
   *
   * La lecture s'assère mot pour mot sur la liste entière : une ligne laissée
   * par un cas voisin — la trace témoin juste au-dessus, écrite à `defaultNow()`
   * donc en tête — la ferait tomber pour la raison d'un autre. C'est la leçon de
   * `freshPerson` au bloc de l'invitation : le couplage par l'ordre est un faux
   * positif qui attend son heure.
   */
  async function throwaway(label: string): Promise<{ id: string; scope: ScopedDb }> {
    const domain = await outsideAnySession.createDomain({
      name: `__test__journal-${label}__${suffix}`,
      competenceCenterName: `Centre journal ${label}`,
    });
    return { id: domain.id, scope: forDomain({ domainId: domain.id }) };
  }

  async function dropDomains(...ids: string[]): Promise<void> {
    for (const id of ids) {
      await db.delete(domainEvents).where(eq(domainEvents.domainId, id));
      await db.delete(domains).where(eq(domains.id, id));
    }
  }

  test("`domainId` ne se force pas sur une trace", async () => {
    const before = await countEvents(b.domainId);

    await expect(
      /* Le typage l'interdit déjà ; le cast éprouve le garde-fou d'exécution.
         **Hérité de `ScopedTable`, et mesuré ici** : une garantie supposée
         héritée est une garantie que personne n'a vue tenir. */
      a.scope.insert(domainEvents, {
        summary: "Trace intruse",
        domainId: b.domainId,
      } as never),
    ).rejects.toThrow(DomainScopeError);

    expect(await countEvents(b.domainId)).toBe(before);
  });

  test("un acteur qui ne désigne aucune autorité est refusé par la base", async () => {
    /* **La contrainte se nomme dans l'assertion.** Un `toThrow()` nu passerait
       pour n'importe quelle levée — une colonne manquante, un réseau coupé — et
       cesserait alors de dire ce qu'il prétend (leçon de T11.1). Le nom vit dans
       la **cause**, `drizzle` enveloppant la levée du pilote. */
    expect(
      await refusedBy(
        a.scope.insert(domainEvents, {
          summary: "Trace sans autorité",
          superAdminId: crypto.randomUUID(),
        }),
      ),
    ).toBe("domain_events_super_admin_id_super_admins_id_fk");

    /* **L'étape témoin, et elle n'est pas optionnelle** : une clé qui refuse
       tout se testerait aussi bien sans le produit. */
    const { id } = await authority("temoin");
    const written = await a.scope.insert(domainEvents, {
      summary: `Trace témoin ${suffix}`,
      superAdminId: id,
    });
    expect(written.superAdminId).toBe(id);
    expect(written.domainId).toBe(a.domainId);
  });

  test("la lecture rend le seul domaine demandé, du plus récent au plus ancien", async () => {
    const { grant, id, name } = await authority("lecture");
    const { id: other, name: otherName } = await authority("lecture-bis");
    const here = await throwaway("ici");
    const there = await throwaway("ailleurs");

    /* **Les dates sont posées à la main**, et distinctes : trois lignes écrites
       dans la même seconde par `defaultNow()` rendraient l'ordre indécidable, et
       un test qui passe par hasard ne dit rien de la lecture. */
    const at = (minutes: number) => new Date(Date.now() - minutes * 60_000);

    try {
      await here.scope.insert(domainEvents, {
        summary: `Ancienne ${suffix}`,
        superAdminId: id,
        occurredAt: at(30),
      });
      /* **La ligne sans acteur**, celle qu'un `innerJoin` aurait fait
         disparaître en silence : elle dira « depuis le domaine ». */
      await here.scope.insert(domainEvents, {
        summary: `Médiane ${suffix}`,
        occurredAt: at(20),
      });
      await here.scope.insert(domainEvents, {
        summary: `Récente ${suffix}`,
        superAdminId: other,
        occurredAt: at(10),
      });
      await there.scope.insert(domainEvents, {
        summary: `Ailleurs ${suffix}`,
        superAdminId: id,
        occurredAt: at(15),
      });

      const reader = asSuperAdmin(grant);
      const read = await reader.listDomainEvents(here.id);
      const elsewhere = await reader.listDomainEvents(there.id);

      /* **Le décompte est lu sur les deux domaines**, et non sur le seul
         demandé : une lecture qui rendrait tout passerait la première
         assertion. */
      expect(read.map((row) => row.summary)).toEqual([
        `Récente ${suffix}`,
        `Médiane ${suffix}`,
        `Ancienne ${suffix}`,
      ]);
      expect(elsewhere.map((row) => row.summary)).toEqual([`Ailleurs ${suffix}`]);

      /* **Le nom est joint, jamais recopié** : renommer l'autorité renomme la
         trace, ce qui est juste — c'est la même personne. Et le nul reste nul. */
      expect(read.map((row) => row.actorName)).toEqual([otherName, null, name]);
    } finally {
      await dropDomains(here.id, there.id);
    }
  });

  test("sans autorité vivante, le journal ne se lit pas", async () => {
    const forged: SuperAdminGrant = {
      kind: "super_admin",
      superAdminId: crypto.randomUUID(),
    };
    await expect(
      asSuperAdmin(forged).listDomainEvents(a.domainId),
    ).rejects.toThrow(SuperAdminRequiredError);

    /* **Archiver *est* le geste qui retire le droit** : la ligne existe encore,
       et c'est exactement ce que la relecture doit refuser. */
    const { id, grant } = await authority("archivee");
    expect(await asSuperAdmin(grant).listDomainEvents(a.domainId)).toBeDefined();

    await db
      .update(superAdmins)
      .set({ archivedAt: new Date() })
      .where(eq(superAdmins.id, id));

    await expect(
      asSuperAdmin(grant).listDomainEvents(a.domainId),
    ).rejects.toThrow(SuperAdminRequiredError);
  });
});
