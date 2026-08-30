/**
 * Les tests des cinq écritures du référentiel des entités — **le droit
 * s'éprouve par l'action**.
 *
 * `CLAUDE.md` pose la discipline en toutes lettres : « un panneau absent du
 * rendu n'a jamais protégé le point d'entrée HTTP qui l'accompagne ». Ici
 * l'écran entier rend 404 à qui n'administre pas, et cela ne prouve **rien** :
 * une action serveur vit à côté de la route, pas derrière elle — ses champs se
 * récoltent sur la page servie au responsable et se repostent sous un autre
 * cookie, les identifiants liés étant sérialisés en clair dans un champ
 * `$ACTION_…`. Ce fichier interroge donc les cinq actions elles-mêmes, sous
 * l'identité d'un membre ordinaire.
 *
 * **Le second sujet est la suppression**, qui est l'écart à la règle 4 arbitré
 * le 21/08/2026. Trois choses la bornent, et les trois s'éprouvent ici : le
 * refus sur un produit **vivant**, le refus sur un produit **archivé** — le cas
 * qui la sépare de l'archivage —, et l'effacement réel quand plus rien ne
 * référence. Le quatrième barrage, la clé étrangère `restrict`, est éprouvé par
 * `lib/db/scoped.test.ts` : c'est la couche qui le porte.
 *
 * **Deux modules de Next sont remplacés**, et pas trois : aucune de ces cinq
 * actions ne redirige — le panneau se referme sur `ok` depuis TD.2, et
 * `restoreEntity` ne rend rien. Rien d'autre n'est simulé : la base est réelle,
 * la porte est la vraie, et `requireSession` fait son travail entier.
 */

import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import { resolveDomainId } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { forDomain, superAdmin, type ScopedDb } from "@/lib/db/scoped";
import {
  activities,
  activityTypes,
  approaches,
  domains,
  entities,
  jobs,
  personSkills,
  persons,
  products,
  projectApproaches,
  projectJobs,
  projects,
  projectStatuses,
  skillLevels,
  skills,
} from "@/lib/db/schema";

/** Qui la requête prétend être. Chaque test la pose avant d'appeler l'action. */
let currentPerson: string | null = null;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "vision_person" && currentPerson
        ? { name, value: currentPerson }
        : undefined,
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const {
  archiveApproach,
  archiveEntity,
  archiveJob,
  archiveSkill,
  archiveSkillLevel,
  createApproach,
  createEntity,
  createJob,
  createSkill,
  createSkillLevel,
  deleteEntity,
  restoreApproach,
  restoreEntity,
  restoreJob,
  restoreSkill,
  restoreSkillLevel,
  updateApproach,
  updateEntity,
  updateJob,
  updateSkill,
  updateSkillLevel,
} = await import("./actions");

const suffix = Math.random().toString(36).slice(2, 10);

/** L'appel de saisie, tel qu'une soumission le fait : un `FormData`. */
function labelForm(label: string): FormData {
  const data = new FormData();
  data.append("label", label);
  return data;
}

const EMPTY = { values: { label: "" }, errors: {} };

/** L'appel d'une confirmation : un état vide, et un `FormData` sans champ. */
function confirm(): [Record<string, never>, FormData] {
  return [{}, new FormData()];
}

type Fixture = {
  domainId: string;
  scope: ScopedDb;
  managerId: string;
  outsiderId: string;
  /** Deux produits vivants : archivage et suppression tous deux refusés. */
  loadedEntityId: string;
  /** Un seul produit, archivé : archivable, mais jamais supprimable. */
  rangedEntityId: string;
  /** Aucun produit : les deux gestes s'ouvrent. */
  freeEntityId: string;
  /** Archivée : corrigeable seulement après rétablissement. */
  archivedEntityId: string;

  /* Les quatre référentiels simples de T7.3. Quatre lignes chacun, et
     chacune n'a qu'un rôle : ce qui s'oppose, ce qui s'archive, ce qui se
     rétablit, ce qui se renomme. Les faire se croiser rendrait chaque test
     dépendant de l'ordre du fichier. */
  /** Un accompagnement vivant et une personne vivante le portent. */
  loadedJobId: string;
  freeJobId: string;
  archivedJobId: string;
  renamedJobId: string;

  /** Une activité vivante la porte. */
  loadedApproachId: string;
  freeApproachId: string;
  archivedApproachId: string;
  renamedApproachId: string;

  /** Une personne vivante la déclare. */
  loadedSkillId: string;
  freeSkillId: string;
  archivedSkillId: string;
  renamedSkillId: string;

  /** Une déclaration le cite. */
  loadedLevelId: string;
  freeLevelId: string;
  archivedLevelId: string;
  renamedLevelId: string;
};

let f: Fixture;

/**
 * Le domaine, retenu **dès sa création** et hors de la fixture.
 *
 * C'est le point ouvert d'`ETAT.md`, refermé ici parce que ce ticket ouvre le
 * fichier : un `beforeAll` qui échoue **après** avoir créé son domaine le
 * laissait en place, et le domaine orphelin faisait tomber le fichier suivant —
 * `resolveDomainId` rendant le premier domaine actif par nom. La forme est celle
 * d'`equipe/actions.test.ts` (28/08/2026).
 */
let domainId: string | null = null;

beforeAll(async () => {
  const domain = await superAdmin.createDomain({
    name: `__0__test__admin__${suffix}`,
    competenceCenterName: `Centre ${suffix}`,
  });
  domainId = domain.id;
  const scope = forDomain({ domainId: domain.id });

  /* **Le domaine courant n'est pas choisi, il est trouvé** : `resolveDomainId`
     rend **le premier domaine actif par nom**, et le POC n'a aucun moyen de lui
     en désigner un autre. D'où le nom qui trie en tête, et cette garde, qui
     échoue en **nommant la cause** — la leçon du 18/08/2026. */
  const resolved = await resolveDomainId();
  if (resolved !== domain.id) {
    const others = await superAdmin.listDomains({ includeArchived: true });
    throw new Error(
      "Le domaine courant n'est pas celui de ce fichier : `resolveDomainId` " +
        "rend le premier domaine actif par nom, et la branche de test en " +
        "porte un qui trie avant. Domaines présents : " +
        others.map((row) => row.name).join(", ") +
        ". Nettoyer les domaines `__test__…` laissés par une exécution " +
        "interrompue avant de relancer.",
    );
  }

  const person = (fullName: string, domainRole: "domain_manager" | "member") =>
    scope.insert(persons, {
      fullName,
      source: "manual",
      kind: "center",
      hasAccess: true,
      domainRole,
    });

  const manager = await person(`Responsable ${suffix}`, "domain_manager");
  const outsider = await person(`Membre ${suffix}`, "member");

  const loaded = await scope.insert(entities, { label: `Chargée ${suffix}` });
  const ranged = await scope.insert(entities, { label: `Rangée ${suffix}` });
  const free = await scope.insert(entities, { label: `Libre ${suffix}` });
  const archived = await scope.insert(entities, {
    label: `Archivée ${suffix}`,
  });
  await scope.archive(entities, archived.id);

  await scope.insert(products, {
    name: `Produit vivant ${suffix}`,
    entityId: loaded.id,
  });
  const onRanged = await scope.insert(products, {
    name: `Produit rangé ${suffix}`,
    entityId: ranged.id,
  });
  await scope.archive(products, onRanged.id);

  /* --------------------------------------------------------------------
     Les quatre référentiels simples, et ce qui les retient.
     -------------------------------------------------------------------- */

  const job = (name: string) =>
    scope.insert(jobs, { label: `${name} métier ${suffix}` });
  const jobRows = {
    loaded: await job("Chargé"),
    free: await job("Libre"),
    renamed: await job("Renommé"),
    archived: await job("Rangé"),
  };
  await scope.archive(jobs, jobRows.archived.id);

  const approach = (name: string) =>
    scope.insert(approaches, { label: `${name} approche ${suffix}` });
  const approachRows = {
    loaded: await approach("Chargée"),
    free: await approach("Libre"),
    renamed: await approach("Renommée"),
    archived: await approach("Rangée"),
  };
  await scope.archive(approaches, approachRows.archived.id);

  const skill = (name: string) =>
    scope.insert(skills, { label: `${name} compétence ${suffix}` });
  const skillRows = {
    loaded: await skill("Chargée"),
    free: await skill("Libre"),
    renamed: await skill("Renommée"),
    archived: await skill("Rangée"),
  };
  await scope.archive(skills, skillRows.archived.id);

  const level = async (name: string, rank: number) =>
    scope.insert(skillLevels, { label: `${name} niveau ${suffix}`, rank });
  const loadedLevel = await level("Chargé", 1);
  const freeLevel = await level("Libre", 2);
  const renamedLevel = await level("Renommé", 3);
  const archivedLevel = await level("Rangé", 4);
  await scope.archive(skillLevels, archivedLevel.id);

  /* Le décor minimal : un produit, un statut, un type — puis un accompagnement
     vivant et une activité vivante, qui sont ce qui **s'oppose**. */
  const status = await scope.insert(projectStatuses, {
    label: `En cours ${suffix}`,
    nature: "active",
  });
  const type = await scope.insert(activityTypes, {
    label: `Atelier ${suffix}`,
    family: "design",
  });
  const product = await scope.insert(products, {
    name: `Produit porteur ${suffix}`,
    entityId: free.id,
  });
  const project = await scope.insert(projects, {
    name: `Accompagnement ${suffix}`,
    productId: product.id,
    statusId: status.id,
  });
  await scope.insert(projectJobs, {
    projectId: project.id,
    jobId: jobRows.loaded.id,
  });
  await scope.insert(activities, {
    projectId: project.id,
    activityTypeId: type.id,
    approachId: approachRows.loaded.id,
    isUnscheduled: true,
  });

  const holder = await scope.insert(persons, {
    fullName: `Porteuse ${suffix}`,
    source: "manual",
    kind: "center",
    jobId: jobRows.loaded.id,
  });
  await scope.insert(personSkills, {
    personId: holder.id,
    skillId: skillRows.loaded.id,
    levelId: loadedLevel.id,
  });

  f = {
    domainId: domain.id,
    scope,
    managerId: manager.id,
    outsiderId: outsider.id,
    loadedEntityId: loaded.id,
    rangedEntityId: ranged.id,
    freeEntityId: free.id,
    archivedEntityId: archived.id,

    loadedJobId: jobRows.loaded.id,
    freeJobId: jobRows.free.id,
    archivedJobId: jobRows.archived.id,
    renamedJobId: jobRows.renamed.id,

    loadedApproachId: approachRows.loaded.id,
    freeApproachId: approachRows.free.id,
    archivedApproachId: approachRows.archived.id,
    renamedApproachId: approachRows.renamed.id,

    loadedSkillId: skillRows.loaded.id,
    freeSkillId: skillRows.free.id,
    archivedSkillId: skillRows.archived.id,
    renamedSkillId: skillRows.renamed.id,

    loadedLevelId: loadedLevel.id,
    freeLevelId: freeLevel.id,
    archivedLevelId: archivedLevel.id,
    renamedLevelId: renamedLevel.id,
  };
}, 180_000);

afterAll(async () => {
  if (!domainId) return;
  /* Enfants d'abord, parents ensuite : les clés `restrict` refusent l'inverse. */
  for (const table of [
    personSkills,
    activities,
    projectApproaches,
    projectJobs,
    projects,
    products,
    persons,
    activityTypes,
    projectStatuses,
    skillLevels,
    skills,
    approaches,
    jobs,
    entities,
  ]) {
    await db.delete(table).where(eq(table.domainId, domainId));
  }
  await db.delete(domains).where(eq(domains.id, domainId));
});

/** La ligne telle qu'elle est en base, sans passer par une lecture d'écran. */
async function entityRow(id: string) {
  const rows = await db.select().from(entities).where(eq(entities.id, id));
  return rows[0];
}

/** Le nombre d'entités du domaine, archivées comprises. */
async function entityCount(): Promise<number> {
  const rows = await db
    .select()
    .from(entities)
    .where(eq(entities.domainId, f.domainId));
  return rows.length;
}

/* ==========================================================================
   Créer
   ========================================================================== */

describe("createEntity — ce que le geste écrit", () => {
  test("le responsable de domaine crée une entité", async () => {
    currentPerson = f.managerId;

    const state = await createEntity(EMPTY, labelForm(`Neuve ${suffix}`));

    expect(state.ok).toBe(true);
    expect(state.errors).toEqual({});

    const created = (
      await db
        .select()
        .from(entities)
        .where(eq(entities.label, `Neuve ${suffix}`))
    )[0];
    expect(created?.domainId).toBe(f.domainId);
    expect(created?.archivedAt).toBeNull();
    /* `position` garde son défaut : le formulaire ne l'écrit pas, et aucun
       écran ne la lit. */
    expect(created?.position).toBe("0.00");
  });
});

describe("createEntity — ce que le geste refuse", () => {
  test("un membre ordinaire ne crée rien", async () => {
    currentPerson = f.outsiderId;
    const before = await entityCount();

    const state = await createEntity(EMPTY, labelForm(`Forgée ${suffix}`));

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("responsable de domaine");
    /* La saisie revient telle quelle : Vision ne jette jamais en silence ce qui
       a été tapé, y compris quand ce qu'elle refuse n'est pas la saisie. */
    expect(state.values.label).toBe(`Forgée ${suffix}`);
    expect(await entityCount()).toBe(before);
  });

  test("un libellé vide est refusé sur le champ", async () => {
    currentPerson = f.managerId;
    const before = await entityCount();

    const state = await createEntity(EMPTY, labelForm("   "));

    expect(state.ok).toBeUndefined();
    expect(state.errors.label).toBe("Le nom de l'entité est obligatoire.");
    expect(await entityCount()).toBe(before);
  });

  test("un libellé déjà pris est refusé, et le refus nomme la jumelle", async () => {
    currentPerson = f.managerId;
    const before = await entityCount();

    const state = await createEntity(EMPTY, labelForm(`Libre ${suffix}`));

    expect(state.ok).toBeUndefined();
    expect(state.errors.label).toContain(`Libre ${suffix}`);
    expect(await entityCount()).toBe(before);
  });

  test("la casse et l'accent ne suffisent pas à en faire une autre", async () => {
    currentPerson = f.managerId;
    const before = await entityCount();

    const state = await createEntity(EMPTY, labelForm(`libre ${suffix}`));

    expect(state.ok).toBeUndefined();
    expect(state.errors.label).toBeDefined();
    expect(await entityCount()).toBe(before);
  });

  test("un libellé pris par une entité **archivée** propose de la rétablir", async () => {
    /* C'est le point ouvert d'`ETAT.md` : l'amorçage rapproche par clé
       naturelle, un renommage recrée sous l'ancien nom. Le refus doit envoyer
       vers le geste juste, et la liste montre la ligne rangée. */
    currentPerson = f.managerId;
    const before = await entityCount();

    const state = await createEntity(EMPTY, labelForm(`Archivée ${suffix}`));

    expect(state.ok).toBeUndefined();
    expect(state.errors.label).toContain("Rétablissez-la");
    expect(await entityCount()).toBe(before);
  });
});

/* ==========================================================================
   Corriger
   ========================================================================== */

describe("updateEntity — ce que le geste écrit", () => {
  test("le responsable renomme une entité", async () => {
    currentPerson = f.managerId;

    const state = await updateEntity(
      f.freeEntityId,
      EMPTY,
      labelForm(`Libre corrigée ${suffix}`),
    );

    expect(state.ok).toBe(true);
    expect((await entityRow(f.freeEntityId))?.label).toBe(
      `Libre corrigée ${suffix}`,
    );

    // Remise en état pour les tests suivants, qui nomment cette ligne.
    await updateEntity(f.freeEntityId, EMPTY, labelForm(`Libre ${suffix}`));
  });

  test("récrire une entité sous son propre nom n'est pas un doublon", async () => {
    currentPerson = f.managerId;

    const state = await updateEntity(
      f.freeEntityId,
      EMPTY,
      labelForm(`Libre ${suffix}`),
    );

    expect(state.ok).toBe(true);
  });
});

describe("updateEntity — ce que le geste refuse", () => {
  test("un membre ordinaire ne corrige rien", async () => {
    currentPerson = f.outsiderId;

    const state = await updateEntity(
      f.freeEntityId,
      EMPTY,
      labelForm(`Volée ${suffix}`),
    );

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("responsable de domaine");
    expect((await entityRow(f.freeEntityId))?.label).toBe(`Libre ${suffix}`);
  });

  test("une entité archivée ne reçoit plus de correction", async () => {
    currentPerson = f.managerId;

    const state = await updateEntity(
      f.archivedEntityId,
      EMPTY,
      labelForm(`Ressuscitée ${suffix}`),
    );

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("archivée");
    expect((await entityRow(f.archivedEntityId))?.label).toBe(
      `Archivée ${suffix}`,
    );
  });

  test("un identifiant inconnu du domaine n'existe pas", async () => {
    currentPerson = f.managerId;

    const state = await updateEntity(
      "00000000-0000-4000-8000-000000000000",
      EMPTY,
      labelForm(`Nulle part ${suffix}`),
    );

    expect(state.ok).toBeUndefined();
    expect(state.message).toBe("Cette entité n'existe plus dans ce domaine.");
  });

  test("prendre le nom d'une voisine est refusé", async () => {
    currentPerson = f.managerId;

    const state = await updateEntity(
      f.freeEntityId,
      EMPTY,
      labelForm(`Chargée ${suffix}`),
    );

    expect(state.ok).toBeUndefined();
    expect(state.errors.label).toContain(`Chargée ${suffix}`);
    expect((await entityRow(f.freeEntityId))?.label).toBe(`Libre ${suffix}`);
  });
});

/* ==========================================================================
   Ranger, sortir du rangement
   ========================================================================== */

describe("archiveEntity", () => {
  test("un membre ordinaire n'archive rien", async () => {
    currentPerson = f.outsiderId;

    const state = await archiveEntity(f.rangedEntityId, ...confirm());

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("responsable de domaine");
    expect((await entityRow(f.rangedEntityId))?.archivedAt).toBeNull();
  });

  test("un produit vivant s'oppose au rangement, et le refus dit combien", async () => {
    currentPerson = f.managerId;

    const state = await archiveEntity(f.loadedEntityId, ...confirm());

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("1 produit vivant");
    expect((await entityRow(f.loadedEntityId))?.archivedAt).toBeNull();
  });

  test("un produit **archivé** ne s'y oppose pas : il a déjà quitté les listes", async () => {
    currentPerson = f.managerId;

    const state = await archiveEntity(f.rangedEntityId, ...confirm());

    expect(state.ok).toBe(true);
    expect((await entityRow(f.rangedEntityId))?.archivedAt).toBeInstanceOf(
      Date,
    );
  });

  test("archiver ce qui est déjà rangé ne fait rien, et ne se dit pas écrit", async () => {
    currentPerson = f.managerId;

    const state = await archiveEntity(f.archivedEntityId, ...confirm());

    expect(state.ok).toBeUndefined();
    expect(state.message).toBeUndefined();
  });

  test("aucune cascade : le produit rattaché n'est pas touché", async () => {
    /* Arbitrage (f) de `tickets-C4bis.md`, transposé : archiver une entité
       n'archive aucun produit. Le produit de `rangedEntityId` était déjà rangé
       avant le test ci-dessus ; ce qui compte est que celui de `loadedEntityId`
       n'ait pas bougé. */
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.entityId, f.loadedEntityId));

    expect(rows).toHaveLength(1);
    expect(rows[0]?.archivedAt).toBeNull();
  });
});

describe("restoreEntity", () => {
  test("un membre ordinaire ne rétablit rien, et le refus est muet", async () => {
    currentPerson = f.outsiderId;

    await expect(restoreEntity(f.rangedEntityId)).resolves.toBeUndefined();
    expect((await entityRow(f.rangedEntityId))?.archivedAt).toBeInstanceOf(
      Date,
    );
  });

  test("le responsable rétablit une entité archivée", async () => {
    currentPerson = f.managerId;

    await restoreEntity(f.rangedEntityId);

    expect((await entityRow(f.rangedEntityId))?.archivedAt).toBeNull();
  });
});

/* ==========================================================================
   Supprimer — l'écart à la règle 4
   ========================================================================== */

describe("deleteEntity — ce que le geste refuse", () => {
  test("un membre ordinaire ne supprime rien", async () => {
    currentPerson = f.outsiderId;

    const state = await deleteEntity(f.freeEntityId, ...confirm());

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("responsable de domaine");
    expect(await entityRow(f.freeEntityId)).toBeDefined();
  });

  test("un produit vivant retient la ligne", async () => {
    currentPerson = f.managerId;

    const state = await deleteEntity(f.loadedEntityId, ...confirm());

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("1 produit");
    expect(await entityRow(f.loadedEntityId)).toBeDefined();
  });

  test("un produit **archivé** la retient tout autant", async () => {
    /* Le cas qui sépare les deux gestes, et la raison des deux décomptes :
       `rangedEntityId` vient d'être archivée puis rétablie sans que rien ne
       s'y oppose, et elle ne se supprime pourtant pas. */
    currentPerson = f.managerId;

    const state = await deleteEntity(f.rangedEntityId, ...confirm());

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("archivé compris");
    expect(await entityRow(f.rangedEntityId)).toBeDefined();
  });

  test("un identifiant inconnu du domaine n'existe pas", async () => {
    currentPerson = f.managerId;

    const state = await deleteEntity(
      "00000000-0000-4000-8000-000000000000",
      ...confirm(),
    );

    expect(state.ok).toBeUndefined();
    expect(state.message).toBe("Cette entité n'existe plus dans ce domaine.");
  });
});

describe("deleteEntity — ce que le geste écrit", () => {
  test("une entité que rien ne référence est effacée pour de bon", async () => {
    currentPerson = f.managerId;

    const doomed = await f.scope.insert(entities, {
      label: `À effacer ${suffix}`,
    });

    const state = await deleteEntity(doomed.id, ...confirm());

    expect(state.ok).toBe(true);
    /* Effacée, et non rangée : c'est ce qui distingue ce geste de tous les
       autres de Vision, et c'est pour cela que le panneau le dit avant. */
    expect(await entityRow(doomed.id)).toBeUndefined();
  });

  test("une entité archivée se supprime aussi, si rien ne la référence", async () => {
    currentPerson = f.managerId;

    const doomed = await f.scope.insert(entities, {
      label: `Rangée puis effacée ${suffix}`,
    });
    await f.scope.archive(entities, doomed.id);

    const state = await deleteEntity(doomed.id, ...confirm());

    expect(state.ok).toBe(true);
    expect(await entityRow(doomed.id)).toBeUndefined();
  });
});

/* ==========================================================================
   Les quatre référentiels simples — T7.3

   **Le droit s'éprouve par l'action, jamais par l'écran.** `/administration`
   rend 404 à qui n'administre pas, et cela ne prouve rien : une action serveur
   vit à côté de la route, pas derrière elle. Chacune des seize est donc
   interrogée sous l'identité d'un membre ordinaire, **décompte en base à
   l'appui** — et chacune reçoit son **étape témoin** : la même charge, sous
   l'identité du responsable, doit écrire. Sans elle, un test ne prouverait que
   l'inertie de la charge.
   ========================================================================== */

/** Le nombre de lignes vivantes ou rangées d'une table, dans ce domaine. */
async function rowCount(
  table:
    | typeof jobs
    | typeof approaches
    | typeof skills
    | typeof skillLevels,
): Promise<number> {
  const rows = await db
    .select()
    .from(table)
    .where(eq(table.domainId, f.domainId));
  return rows.length;
}

/** La ligne telle qu'elle est en base, sans passer par une lecture d'écran. */
async function rowOf(
  table:
    | typeof jobs
    | typeof approaches
    | typeof skills
    | typeof skillLevels,
  id: string,
) {
  const rows = await db.select().from(table).where(eq(table.id, id));
  return rows[0];
}

/** La saisie d'un référentiel ordonné par `position`. */
function positionForm(label: string, position = "50"): FormData {
  const data = new FormData();
  data.append("label", label);
  data.append("position", position);
  return data;
}

/** La saisie de l'échelle de maîtrise. */
function rankForm(label: string, rank = "7"): FormData {
  const data = new FormData();
  data.append("label", label);
  data.append("rank", rank);
  return data;
}

const EMPTY_REFERENTIAL = {
  values: { label: "", position: "", rank: "" },
  errors: {},
};

/* --------------------------------------------------------------------------
   Le droit, sur les seize points d'entrée
   -------------------------------------------------------------------------- */

describe("le droit — les seize actions sous une identité sans manageDomain", () => {
  test("aucune des quatre créations n'écrit une ligne", async () => {
    const targets = [
      [jobs, createJob, positionForm(`Forgé métier ${suffix}`)],
      [approaches, createApproach, positionForm(`Forgée approche ${suffix}`)],
      [skills, createSkill, positionForm(`Forgée compétence ${suffix}`)],
      [skillLevels, createSkillLevel, rankForm(`Forgé niveau ${suffix}`)],
    ] as const;

    for (const [table, create, form] of targets) {
      currentPerson = f.outsiderId;
      const before = await rowCount(table);

      const state = await create(EMPTY_REFERENTIAL, form);

      expect(state.ok).toBeUndefined();
      expect(state.message).toContain("responsable de domaine");
      /* La saisie revient telle quelle : Vision ne jette jamais en silence ce
         qui a été tapé, y compris quand ce qu'elle refuse n'est pas la saisie. */
      expect(state.values.label).toContain("Forgé");
      expect(await rowCount(table)).toBe(before);

      /* L'étape témoin : la **même** charge, sous l'identité du responsable,
         écrit. Sans elle, rien ne dirait que c'est le droit qui a refusé. */
      currentPerson = f.managerId;
      const witness = await create(EMPTY_REFERENTIAL, form);
      expect(witness.ok).toBe(true);
      expect(await rowCount(table)).toBe(before + 1);
    }
  });

  test("aucune des quatre corrections ne renomme une ligne", async () => {
    const targets = [
      [jobs, updateJob, f.renamedJobId, positionForm(`Volé métier ${suffix}`)],
      [
        approaches,
        updateApproach,
        f.renamedApproachId,
        positionForm(`Volée approche ${suffix}`),
      ],
      [
        skills,
        updateSkill,
        f.renamedSkillId,
        positionForm(`Volée compétence ${suffix}`),
      ],
      [
        skillLevels,
        updateSkillLevel,
        f.renamedLevelId,
        rankForm(`Volé niveau ${suffix}`),
      ],
    ] as const;

    for (const [table, update, id, form] of targets) {
      currentPerson = f.outsiderId;
      const before = (await rowOf(table, id))?.label;

      const state = await update(id, EMPTY_REFERENTIAL, form);

      expect(state.ok).toBeUndefined();
      expect(state.message).toContain("responsable de domaine");
      expect((await rowOf(table, id))?.label).toBe(before);

      currentPerson = f.managerId;
      const witness = await update(id, EMPTY_REFERENTIAL, form);
      expect(witness.ok).toBe(true);
      expect((await rowOf(table, id))?.label).not.toBe(before);
    }
  });

  test("aucun des quatre archivages ne range une ligne", async () => {
    const targets = [
      [jobs, archiveJob, f.freeJobId],
      [approaches, archiveApproach, f.freeApproachId],
      [skills, archiveSkill, f.freeSkillId],
      [skillLevels, archiveSkillLevel, f.freeLevelId],
    ] as const;

    for (const [table, archive, id] of targets) {
      currentPerson = f.outsiderId;

      const state = await archive(id, ...confirm());

      expect(state.ok).toBeUndefined();
      expect(state.message).toContain("responsable de domaine");
      expect((await rowOf(table, id))?.archivedAt).toBeNull();

      currentPerson = f.managerId;
      const witness = await archive(id, ...confirm());
      expect(witness.ok).toBe(true);
      expect((await rowOf(table, id))?.archivedAt).toBeInstanceOf(Date);
    }
  });

  test("aucun des quatre rétablissements ne sort une ligne du rangement", async () => {
    /* Les quatre lignes viennent d'être archivées par le test précédent : c'est
       exactement l'état sur lequel le rétablissement s'exerce. */
    const targets = [
      [jobs, restoreJob, f.freeJobId],
      [approaches, restoreApproach, f.freeApproachId],
      [skills, restoreSkill, f.freeSkillId],
      [skillLevels, restoreSkillLevel, f.freeLevelId],
    ] as const;

    for (const [table, restore, id] of targets) {
      currentPerson = f.outsiderId;

      await restore(id);

      /* Un refus est **muet** — la forme de `restoreProduct` : ce geste n'a
         aucune saisie à rendre. Seule la base tranche. */
      expect((await rowOf(table, id))?.archivedAt).toBeInstanceOf(Date);

      currentPerson = f.managerId;
      await restore(id);
      expect((await rowOf(table, id))?.archivedAt).toBeNull();
    }
  });
});

/* --------------------------------------------------------------------------
   Ce que l'archivage refuse — quatre décomptes, quatre refus
   -------------------------------------------------------------------------- */

describe("l'archivage refuse ce qu'une donnée vivante référence encore", () => {
  test("un métier qu'un accompagnement vivant déclare n'est pas rangé", async () => {
    currentPerson = f.managerId;

    const state = await archiveJob(f.loadedJobId, ...confirm());

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("déclare encore ce métier");
    expect((await rowOf(jobs, f.loadedJobId))?.archivedAt).toBeNull();
  });

  test("une approche qu'une activité vivante porte n'est pas rangée", async () => {
    currentPerson = f.managerId;

    const state = await archiveApproach(f.loadedApproachId, ...confirm());

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("cette approche");
    expect(
      (await rowOf(approaches, f.loadedApproachId))?.archivedAt,
    ).toBeNull();
  });

  test("une compétence qu'une personne vivante déclare n'est pas rangée", async () => {
    currentPerson = f.managerId;

    const state = await archiveSkill(f.loadedSkillId, ...confirm());

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("cette compétence");
    expect((await rowOf(skills, f.loadedSkillId))?.archivedAt).toBeNull();
  });

  test("un niveau qu'une déclaration cite n'est pas rangé", async () => {
    currentPerson = f.managerId;

    const state = await archiveSkillLevel(f.loadedLevelId, ...confirm());

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("compétence déclarée cite encore ce niveau");
    expect((await rowOf(skillLevels, f.loadedLevelId))?.archivedAt).toBeNull();
  });

  test("le refus vient de la base, jamais de l'écran", async () => {
    /* Le métier chargé est aussi porté par une personne vivante. Une fois
       l'accompagnement détaché, c'est **elle** qui s'y oppose — et le refus
       change de phrase sans changer d'issue. */
    currentPerson = f.managerId;
    await db
      .delete(projectJobs)
      .where(eq(projectJobs.jobId, f.loadedJobId));

    const state = await archiveJob(f.loadedJobId, ...confirm());

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("porte encore ce métier");
    expect((await rowOf(jobs, f.loadedJobId))?.archivedAt).toBeNull();
  });
});

/* --------------------------------------------------------------------------
   Ce que la saisie refuse
   -------------------------------------------------------------------------- */

describe("la saisie d'un référentiel — ce qu'elle écrit et ce qu'elle refuse", () => {
  test("le responsable crée un métier, position comprise", async () => {
    currentPerson = f.managerId;

    const state = await createJob(
      EMPTY_REFERENTIAL,
      positionForm(`Neuf métier ${suffix}`, "42,5"),
    );

    expect(state.ok).toBe(true);
    const created = (
      await db
        .select()
        .from(jobs)
        .where(eq(jobs.label, `Neuf métier ${suffix}`))
    )[0];
    expect(created?.domainId).toBe(f.domainId);
    expect(created?.archivedAt).toBeNull();
    /* La virgule française est rendue à PostgreSQL en point. */
    expect(created?.position).toBe("42.50");
  });

  test("le responsable crée un niveau, rang compris", async () => {
    currentPerson = f.managerId;

    const state = await createSkillLevel(
      EMPTY_REFERENTIAL,
      rankForm(`Neuf niveau ${suffix}`, "9"),
    );

    expect(state.ok).toBe(true);
    const created = (
      await db
        .select()
        .from(skillLevels)
        .where(eq(skillLevels.label, `Neuf niveau ${suffix}`))
    )[0];
    expect(created?.rank).toBe(9);
    /* `position` garde son défaut : l'échelle ne la saisit pas, et rien ne la
       lit — c'est `rank` qui l'ordonne. */
    expect(created?.position).toBe("0.00");
  });

  test("un libellé déjà pris est refusé, et le refus nomme la jumelle", async () => {
    currentPerson = f.managerId;
    const before = await rowCount(skills);

    const twin = (await rowOf(skills, f.loadedSkillId))?.label ?? "";
    const state = await createSkill(EMPTY_REFERENTIAL, positionForm(twin));

    expect(state.ok).toBeUndefined();
    expect(state.errors.label).toContain(twin);
    expect(await rowCount(skills)).toBe(before);
  });

  test("la casse et l'accent ne suffisent pas à en faire un autre", async () => {
    currentPerson = f.managerId;
    const before = await rowCount(approaches);

    const twin = (await rowOf(approaches, f.loadedApproachId))?.label ?? "";
    const state = await createApproach(
      EMPTY_REFERENTIAL,
      positionForm(twin.toLocaleUpperCase("fr-FR")),
    );

    expect(state.ok).toBeUndefined();
    expect(state.errors.label).toBeDefined();
    expect(await rowCount(approaches)).toBe(before);
  });

  test("un libellé pris par une ligne **archivée** propose de la rétablir", async () => {
    /* C'est le point ouvert d'`ETAT.md` : l'amorçage rapproche par clé
       naturelle, un renommage recrée sous l'ancien nom. Le refus doit envoyer
       vers le geste juste, et la liste montre la ligne rangée. */
    currentPerson = f.managerId;
    const before = await rowCount(jobs);

    const twin = (await rowOf(jobs, f.archivedJobId))?.label ?? "";
    const state = await createJob(EMPTY_REFERENTIAL, positionForm(twin));

    expect(state.ok).toBeUndefined();
    expect(state.errors.label).toContain("Rétablissez-la");
    expect(await rowCount(jobs)).toBe(before);
  });

  test("se renommer soi-même n'est pas un doublon", async () => {
    currentPerson = f.managerId;

    const current = (await rowOf(skills, f.renamedSkillId))?.label ?? "";
    const state = await updateSkill(
      f.renamedSkillId,
      EMPTY_REFERENTIAL,
      positionForm(current, "12"),
    );

    expect(state.ok).toBe(true);
    expect((await rowOf(skills, f.renamedSkillId))?.position).toBe("12.00");
  });

  test("une ligne archivée ne reçoit plus de correction", async () => {
    currentPerson = f.managerId;
    const before = (await rowOf(approaches, f.archivedApproachId))?.label;

    const state = await updateApproach(
      f.archivedApproachId,
      EMPTY_REFERENTIAL,
      positionForm(`Corrigée malgré tout ${suffix}`),
    );

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("Rétablissez-la");
    expect((await rowOf(approaches, f.archivedApproachId))?.label).toBe(before);
  });

  test("un libellé vide est refusé sur le champ, un rang absent aussi", async () => {
    currentPerson = f.managerId;
    const before = await rowCount(skillLevels);

    const empty = await createSkillLevel(EMPTY_REFERENTIAL, rankForm("   "));
    expect(empty.errors.label).toBe("Le libellé est obligatoire.");

    const noRank = new FormData();
    noRank.append("label", `Sans rang ${suffix}`);
    const missing = await createSkillLevel(EMPTY_REFERENTIAL, noRank);
    expect(missing.errors.rank).toBe("Le rang est obligatoire.");

    expect(await rowCount(skillLevels)).toBe(before);
  });

  test("une ligne d'un autre domaine n'existe pas, elle ne manque pas", async () => {
    currentPerson = f.managerId;

    const state = await updateJob(
      "00000000-0000-4000-8000-000000000000",
      EMPTY_REFERENTIAL,
      positionForm(`Hors domaine ${suffix}`),
    );

    expect(state.ok).toBeUndefined();
    expect(state.message).toBe("Cette ligne n'existe plus dans ce domaine.");
  });
});
