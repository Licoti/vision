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
  domainIdentities,
  domains,
  entities,
  events,
  indicatorReadings,
  indicators,
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
      /* **La garde de T9.3 se relit ici, à la compilation.** `createDomain` a
         quitté `superAdmin` : on ne l'obtient qu'en ayant nommé son autorité.
         C'est ce qui a rattrapé les trente-six sites d'appel du jour du ticket,
         et c'est ce qui rattrapera le trente-septième. */
      // @ts-expect-error `createDomain` ne s'obtient que par `asSuperAdmin`.
      await superAdmin.createDomain({ name: "…", competenceCenterName: "…" });
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

    /* **Sept clés depuis T9.2, et la liste reste nominative** — c'est
       exactement ce que ce sceau sert à obtenir : une clé de plus est une
       décision qui se prend, jamais un ajout qui passe.

       **La propriété qu'il garde n'a pas bougé** : aucune de ces fonctions ne
       donne accès à une donnée métier. Les deux qui s'ajoutent écrivent et
       lisent `super_admins`, qui vit *au-dessus* des domaines et n'en traverse
       aucun — elles amorcent le droit que rien, dans le produit, ne peut
       s'accorder à lui-même (`scripts/auth:super-admin`, T9.2). Les faire vivre
       dans un script à connexion propre aurait contourné la règle 1 plutôt que
       sa contrainte, et **laissé T9.3 sans rien à garder**.

       **Le sceau s'est dédoublé, et c'est la distinction que T9.3 devait
       écrire.** La liste portait sept clés dont deux écrivaient ; elle en porte
       six, qui toutes lisent. Les deux écrivains vivent derrière
       `asSuperAdmin`, et on ne les tient qu'en ayant nommé son autorité.

       **Les deux listes se relisent ensemble**, et c'est la raison de la
       seconde : une écriture qui reviendrait se poser sur `superAdmin`
       quitterait la garde sans qu'aucun autre test ne le dise. */
    expect(Object.keys(superAdmin).sort()).toEqual([
      "findDomain",
      "findDomainIdentity",
      "findSuperAdminByEmail",
      "findSuperAdminById",
      "listDomains",
      "listSuperAdmins",
    ]);

    expect(Object.keys(outsideAnySession).sort()).toEqual([
      "createDomain",
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
      (await superAdmin.listSuperAdmins()).map((admin) => admin.id),
    ).toContain(row.id);

    await db
      .update(superAdmins)
      .set({ archivedAt: new Date() })
      .where(eq(superAdmins.id, row.id));

    expect(
      (await superAdmin.listSuperAdmins()).map((admin) => admin.id),
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
