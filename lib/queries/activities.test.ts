/**
 * Les tests de la lecture de roadmap.
 *
 * Ils tournent sur la branche Neon dédiée — `vitest.config.mts` remappe
 * `DATABASE_URL` sur `TEST_DATABASE_URL` — et écrivent réellement : un `case`
 * de tri, un `nulls last` et un `leftJoin` filtré sur le domaine ne se
 * vérifient pas sur un faux.
 *
 * Deux domaines sont amorcés, comme dans `projects.test.ts` : sans un second
 * domaine, aucun test d'étanchéité ne prouve quoi que ce soit. Les écritures de
 * fixture passent par la couche scopée ; les constats passent par la fonction
 * sous test, qui est précisément ce que l'écran appelle.
 */

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { db } from "@/lib/db/client";
import { forDomain, superAdmin, type ScopedDb } from "@/lib/db/scoped";
import {
  activities,
  activityParticipants,
  activityTypes,
  approaches,
  domains,
  entities,
  persons,
  products,
  projectStatuses,
  projects,
  results,
  tools,
} from "@/lib/db/schema";

import {
  listActivityFormOptions,
  listActivityParticipantIds,
  listProjectRoadmap,
  listResultToolOptions,
  type RoadmapActivity,
  type RoadmapGroup,
} from "./activities";

/**
 * Enfants d'abord, parents ensuite : `domains` refuse la suppression sinon.
 * `activity_participants` n'y figure pas : `activity_id` porte `onDelete:
 * cascade` (T3.6), donc la suppression d'`activities` l'emporte déjà.
 */
const teardownOrder = [
  results,
  activities,
  projects,
  products,
  activityTypes,
  approaches,
  projectStatuses,
  entities,
  persons,
  /* Après `activity_types` et `results`, qui référencent tous deux `tools`. */
  tools,
];

type Fixture = {
  domainId: string;
  scope: ScopedDb;
  /** Le projet qui porte les quatre groupes, plus les deux cas écartés. */
  fullId: string;
  /** Un projet sans aucune activité : la roadmap doit être vide. */
  emptyId: string;
  /** Un projet qui n'a que du terminé : trois groupes ne doivent pas sortir. */
  doneOnlyId: string;
  /** Les deux lignes que la lecture doit écarter, identifiées nommément. */
  cancelledId: string;
  archivedActivityId: string;
  /** Le type d'activité archivé : proposé à personne, sauf à qui le pointe. */
  retiredTypeId: string;
  /** Un type vivant, pour éprouver que l'exception ne duplique rien. */
  liveTypeId: string;
  /**
   * L'activité « Audit d'accessibilité », terminée — porte deux participants,
   * et le résultat au contrat complet (T4.3).
   */
  accessibilityActivityId: string;
  /** L'activité « Atelier de priorisation », en cours — porte un participant. */
  workshopActivityId: string;
  /** L'activité « Test utilisateur », terminée — porte le résultat dégradé. */
  userTestActivityId: string;
  /** L'unique activité du projet « Terminé seul » — porte le résultat archivé. */
  doneOnlyActivityId: string;
  /** L'outil du domaine — la cible de la liaison forgée sur `tools`. */
  toolId: string;
  /** L'outil archivé : proposé à personne, sauf au résultat qui le porte. */
  retiredToolId: string;
  /** Côté centre de compétence — kind `center`. */
  centerPersonId: string;
  /** Côté entité accompagnée — kind `stakeholder` (T3.6, « côté entité »). */
  stakeholderPersonId: string;
};

const suffix = Math.random().toString(36).slice(2, 10);
let a: Fixture;
let b: Fixture;

/**
 * Un domaine complet : trois projets, huit types d'activité dont un archivé,
 * une approche, onze activités couvrant les quatre groupes, l'annulée,
 * l'archivée, l'activité sans date et l'activité sans approche — et trois
 * résultats, dont un archivé (T4.3).
 *
 * Les activités sont insérées **dans le désordre** par rapport à l'ordre
 * attendu : c'est la requête qui doit trier, pas la saisie.
 */
async function seedDomain(label: string): Promise<Fixture> {
  const domain = await superAdmin.createDomain({
    name: `__test__roadmap__${label}__${suffix}`,
    competenceCenterName: `Centre ${label}`,
  });
  const scope = forDomain({ domainId: domain.id });

  const entity = await scope.insert(entities, { label: `Entité ${label}` });
  const active = await scope.insert(projectStatuses, {
    label: "En cours",
    nature: "active",
  });
  const product = await scope.insert(products, {
    name: `Produit ${label}`,
    entityId: entity.id,
  });

  const full = await scope.insert(projects, {
    name: `Complet ${label}`,
    productId: product.id,
    statusId: active.id,
  });
  const empty = await scope.insert(projects, {
    name: `Vide ${label}`,
    productId: product.id,
    statusId: active.id,
  });
  const doneOnly = await scope.insert(projects, {
    name: `Terminé seul ${label}`,
    productId: product.id,
    statusId: active.id,
  });

  const approach = await scope.insert(approaches, { label: `Research ${label}` });

  /* `producesResult` suit la fixture d'amorçage : vrai pour les audits, et
     pour eux seuls (`docs/04` §2). C'est ce drapeau qui conditionne le point
     d'entrée de saisie d'un résultat (T4.4), et la roadmap doit le remonter. */
  const type = async (name: string, producesResult = false) =>
    scope.insert(activityTypes, {
      label: `${name} ${label}`,
      family: "research",
      producesResult,
    });

  const workshop = await type("Atelier de priorisation");
  const audit = await type("Audit UX", true);
  const training = await type("Formation");
  const accessibility = await type("Audit d'accessibilité", true);
  const userTest = await type("Test utilisateur");
  const observation = await type("Observation terrain");
  const handover = await type("Passation");
  const benchmark = await type("Benchmark");

  /* Un type archivé : son libellé doit continuer de s'afficher — on décrit,
     on ne propose pas au choix. */
  const retired = await type("Type retiré");
  await scope.archive(activityTypes, retired.id);

  /* --- Terminé, inséré en premier alors qu'il se lit en dernier ---------- */
  const userTestActivity = await scope.insert(activities, {
    projectId: full.id,
    activityTypeId: userTest.id,
    state: "done",
    periodStart: "2026-03-01",
    periodEnd: "2026-03-31",
  });
  const accessibilityActivity = await scope.insert(activities, {
    projectId: full.id,
    activityTypeId: accessibility.id,
    state: "done",
    periodStart: "2026-06-01",
    periodEnd: "2026-06-30",
    approachId: approach.id,
  });

  /* --- À planifier : l'ordre de déclaration, faute de date -------------- */
  await scope.insert(activities, {
    projectId: full.id,
    activityTypeId: training.id,
    objective: "Formation des équipes produit",
    state: "planned",
    isUnscheduled: true,
  });
  await scope.insert(activities, {
    projectId: full.id,
    activityTypeId: handover.id,
    state: "planned",
    isUnscheduled: true,
  });

  /* --- Prévu : la prochaine échéance en tête ---------------------------- */
  await scope.insert(activities, {
    projectId: full.id,
    activityTypeId: benchmark.id,
    state: "planned",
    periodStart: "2026-12-01",
    periodEnd: "2026-12-31",
  });
  await scope.insert(activities, {
    projectId: full.id,
    activityTypeId: audit.id,
    state: "planned",
    periodStart: "2026-10-01",
    periodEnd: "2026-10-31",
  });

  /* --- En cours : ce qui a commencé en premier en tête, le sans-date en
         dernier. Le schéma ne contraint pas la période d'un `in_progress`. */
  await scope.insert(activities, {
    projectId: full.id,
    activityTypeId: observation.id,
    state: "in_progress",
  });
  const workshopActivity = await scope.insert(activities, {
    projectId: full.id,
    activityTypeId: workshop.id,
    state: "in_progress",
    periodStart: "2026-08-01",
    periodEnd: "2026-08-31",
  });
  await scope.insert(activities, {
    projectId: full.id,
    activityTypeId: retired.id,
    state: "in_progress",
    periodStart: "2026-07-01",
    periodEnd: "2026-07-31",
  });

  /* --- Les deux cas écartés --------------------------------------------- */
  const cancelled = await scope.insert(activities, {
    projectId: full.id,
    activityTypeId: audit.id,
    state: "cancelled",
    cancellationReason: "Le commanditaire a retiré le budget.",
  });
  const archived = await scope.insert(activities, {
    projectId: full.id,
    activityTypeId: audit.id,
    state: "in_progress",
    periodStart: "2020-01-01",
  });
  await scope.archive(activities, archived.id);

  /* --- Le projet qui n'a que du terminé ---------------------------------- */
  const doneOnlyActivity = await scope.insert(activities, {
    projectId: doneOnly.id,
    activityTypeId: audit.id,
    state: "done",
    periodStart: "2025-02-01",
    periodEnd: "2025-02-28",
  });

  /* --- Les participants (T3.6) ------------------------------------------- */
  const person = async (fullName: string, kind: "center" | "stakeholder") =>
    scope.insert(persons, {
      source: "manual",
      fullName,
      kind,
      hasAccess: false,
      domainRole: null,
      isActive: true,
    });

  // « Zoé » avant « Amir » dans l'ordre alphabétique inverse d'insertion :
  // c'est la lecture qui doit trier par nom, pas l'ordre d'écriture.
  const center = await person(`Zoé Centre ${label}`, "center");
  const stakeholder = await person(`Amir Entité ${label}`, "stakeholder");

  await scope.insertMany(activityParticipants, [
    { activityId: accessibilityActivity.id, personId: center.id },
    { activityId: accessibilityActivity.id, personId: stakeholder.id },
    { activityId: workshopActivity.id, personId: stakeholder.id },
  ]);

  /* --- Les résultats (T4.3) ----------------------------------------------
     Trois, tous sur des activités **terminées** : `assertPreconditions` refuse
     tout autre rattachement depuis T1.3, et la fixture ne contourne pas la
     règle qu'elle est censée décrire.

     1. Le contrat complet, outil et lien profond compris ;
     2. le contrat **dégradé** — valeur, unité, outil et lien nuls, les quatre
        colonnes nullables du schéma en même temps : la lecture doit rendre la
        ligne, pas la faire disparaître ;
     3. un résultat **archivé**, posé sur un autre projet pour que sa
        disparition ne dépende de rien d'autre — l'activité est vivante, le
        projet se lit, seul le résultat est rangé. */
  const tool = await scope.insert(tools, {
    name: `Ergonome ${label}`,
    kind: "audit",
  });

  /* Un outil archivé (T4bis.6), sur le modèle du type archivé plus haut :
     proposé à personne, sauf au résultat qui le porte déjà. */
  const retiredTool = await scope.insert(tools, {
    name: `Outil retiré ${label}`,
    kind: "audit",
  });
  await scope.archive(tools, retiredTool.id);

  await scope.insert(results, {
    activityId: accessibilityActivity.id,
    label: `Score d'audit UX ${label}`,
    value: "62",
    unit: "/100",
    measuredOn: "2024-05-31",
    toolId: tool.id,
    externalUrl: `https://exemple.invalid/rapport-${label}`,
  });

  await scope.insert(results, {
    activityId: userTestActivity.id,
    label: `Synthèse de campagne ${label}`,
    measuredOn: "2026-03-31",
  });

  const archivedResult = await scope.insert(results, {
    activityId: doneOnlyActivity.id,
    label: `Résultat rangé ${label}`,
    value: "99",
    measuredOn: "2025-02-28",
  });
  await scope.archive(results, archivedResult.id);

  return {
    domainId: domain.id,
    scope,
    fullId: full.id,
    emptyId: empty.id,
    doneOnlyId: doneOnly.id,
    cancelledId: cancelled.id,
    archivedActivityId: archived.id,
    retiredTypeId: retired.id,
    liveTypeId: audit.id,
    accessibilityActivityId: accessibilityActivity.id,
    workshopActivityId: workshopActivity.id,
    userTestActivityId: userTestActivity.id,
    doneOnlyActivityId: doneOnlyActivity.id,
    toolId: tool.id,
    retiredToolId: retiredTool.id,
    centerPersonId: center.id,
    stakeholderPersonId: stakeholder.id,
  };
}

beforeAll(async () => {
  a = await seedDomain("a");
  b = await seedDomain("b");
}, 180_000);

afterAll(async () => {
  const ids = [a?.domainId, b?.domainId].filter(Boolean) as string[];
  if (ids.length === 0) return;
  for (const table of teardownOrder) {
    await db.delete(table).where(inArray(table.domainId, ids));
  }
  await db.delete(domains).where(inArray(domains.id, ids));
});

/** Les libellés de type retenus dans un groupe, dans l'ordre rendu. */
function labels(groups: RoadmapGroup[], key: string): string[] {
  const group = groups.find((candidate) => candidate.key === key);
  return (group?.activities ?? []).map((activity) => activity.typeLabel);
}

/* ==========================================================================
   Les groupes et leur ordre
   ========================================================================== */

describe("listProjectRoadmap — les groupes", () => {
  test("les cinq groupes sortent dans l'ordre de lecture de docs/03 §6", async () => {
    const groups = await listProjectRoadmap(a.scope, a.fullId);

    expect(groups.map((group) => group.key)).toEqual([
      "in_progress",
      "planned",
      "unscheduled",
      "done",
      "cancelled",
    ]);
    expect(groups.map((group) => group.label)).toEqual([
      "En cours",
      "Prévu",
      "À planifier",
      "Terminé",
      "Annulé",
    ]);
  });

  test("« Prévu » et « À planifier » se distinguent par is_unscheduled, pas par l'état", async () => {
    const groups = await listProjectRoadmap(a.scope, a.fullId);

    // Les quatre sont `planned` en base : c'est D14 qui les sépare à l'écran.
    expect(labels(groups, "planned")).toEqual(["Audit UX a", "Benchmark a"]);
    expect(labels(groups, "unscheduled")).toEqual(["Formation a", "Passation a"]);
  });

  test("un groupe sans activité ne s'affiche pas", async () => {
    const groups = await listProjectRoadmap(a.scope, a.doneOnlyId);

    expect(groups.map((group) => group.key)).toEqual(["done"]);
  });

  test("un projet sans activité ne rend aucun groupe", async () => {
    expect(await listProjectRoadmap(a.scope, a.emptyId)).toEqual([]);
  });
});

/* ==========================================================================
   L'ordre interne — le passé à rebours, le reste dans le sens de la marche
   ========================================================================== */

describe("listProjectRoadmap — l'ordre interne", () => {
  test("« En cours » se lit par période croissante, le sans-date en dernier", async () => {
    const groups = await listProjectRoadmap(a.scope, a.fullId);

    expect(labels(groups, "in_progress")).toEqual([
      "Type retiré a", // juillet 2026
      "Atelier de priorisation a", // août 2026
      "Observation terrain a", // sans date
    ]);
  });

  test("« Prévu » se lit par période croissante : la prochaine échéance en tête", async () => {
    const groups = await listProjectRoadmap(a.scope, a.fullId);

    expect(labels(groups, "planned")).toEqual([
      "Audit UX a", // octobre 2026
      "Benchmark a", // décembre 2026
    ]);
  });

  test("« À planifier » se lit dans l'ordre de déclaration, faute de date", async () => {
    const groups = await listProjectRoadmap(a.scope, a.fullId);

    expect(labels(groups, "unscheduled")).toEqual(["Formation a", "Passation a"]);
  });

  test("« Terminé » se lit du plus récent au plus ancien", async () => {
    const groups = await listProjectRoadmap(a.scope, a.fullId);

    expect(labels(groups, "done")).toEqual([
      "Audit d'accessibilité a", // juin 2026
      "Test utilisateur a", // mars 2026
    ]);
  });

  test("« Annulé » se lit du plus récent au plus ancien, comme « Terminé »", async () => {
    const groups = await listProjectRoadmap(a.scope, a.fullId);

    // La fixture ne porte qu'une seule activité annulée : l'ordre interne se
    // limite ici à vérifier qu'elle s'y trouve bien, seule.
    expect(labels(groups, "cancelled")).toEqual(["Audit UX a"]);
  });

  test("les dix entrées du critère se suivent dans l'ordre annoncé", async () => {
    // Le critère de la fiche, lu de bout en bout et non groupe par groupe :
    // c'est la séquence entière qui compte à l'écran.
    const groups = await listProjectRoadmap(a.scope, a.fullId);
    const flat = groups.flatMap((group) =>
      group.activities.map((activity) => activity.typeLabel),
    );

    expect(flat).toEqual([
      "Type retiré a",
      "Atelier de priorisation a",
      "Observation terrain a",
      "Audit UX a",
      "Benchmark a",
      "Formation a",
      "Passation a",
      "Audit d'accessibilité a",
      "Test utilisateur a",
      "Audit UX a", // l'activité annulée, dans le cinquième groupe
    ]);
  });
});

/* ==========================================================================
   Ce que la lecture écarte, et ce qu'elle porte
   ========================================================================== */

describe("listProjectRoadmap — le périmètre et les champs", () => {
  test("une activité annulée apparaît dans le groupe « Annulé », avec son motif", async () => {
    const groups = await listProjectRoadmap(a.scope, a.fullId);
    const cancelled =
      groups.find((group) => group.key === "cancelled")?.activities ?? [];

    // Avant T3.5, cette même ligne n'apparaissait nulle part faute de groupe
    // pour la recevoir. Le constat porte sur **cette ligne-là**, et non sur un
    // décompte — un test qui compte tombe pour d'autres raisons.
    expect(cancelled).toContainEqual(
      expect.objectContaining({
        id: a.cancelledId,
        cancellationReason: "Le commanditaire a retiré le budget.",
      }),
    );
  });

  test("une activité archivée n'apparaît nulle part", async () => {
    const groups = await listProjectRoadmap(a.scope, a.fullId);
    const ids = groups.flatMap((group) =>
      group.activities.map((activity) => activity.id),
    );

    // Elle est datée de 2020 : sans le filtre, elle ouvrirait « En cours ».
    expect(ids).not.toContain(a.archivedActivityId);
  });

  test("le libellé d'un type archivé s'affiche quand même", async () => {
    const groups = await listProjectRoadmap(a.scope, a.fullId);

    expect(labels(groups, "in_progress")).toContain("Type retiré a");
  });

  test("l'entrée porte son objectif, sa période et son approche", async () => {
    const groups = await listProjectRoadmap(a.scope, a.fullId);
    const done = groups.find((group) => group.key === "done")?.activities ?? [];

    expect(done[0]).toMatchObject({
      typeLabel: "Audit d'accessibilité a",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-30",
      isUnscheduled: false,
      approachLabel: "Research a",
      // Le motif n'a de sens que dans le groupe « Annulé » (T3.5).
      cancellationReason: null,
    });

    const unscheduled =
      groups.find((group) => group.key === "unscheduled")?.activities ?? [];
    expect(unscheduled[0]).toMatchObject({
      typeLabel: "Formation a",
      objective: "Formation des équipes produit",
      periodStart: null,
      periodEnd: null,
      isUnscheduled: true,
      approachLabel: null,
    });
  });

  test("l'entrée porte le `producesResult` de son type (T4.4)", async () => {
    // C'est ce drapeau, et lui seul, qui distingue une activité terminée qui
    // peut recevoir un résultat d'une activité terminée qui ne le peut pas. Le
    // point d'entrée de saisie en dépend entièrement : sans ce champ, la
    // roadmap l'offrirait sur un atelier.
    const groups = await listProjectRoadmap(a.scope, a.fullId);
    const flags = new Map(
      groups.flatMap((group) =>
        group.activities.map(
          (activity) =>
            [activity.typeLabel, activity.producesResult] as const,
        ),
      ),
    );

    expect(flags.get("Audit d'accessibilité a")).toBe(true);
    expect(flags.get("Formation a")).toBe(false);
    expect(flags.get("Test utilisateur a")).toBe(false);
  });
});

/* ==========================================================================
   L'étanchéité
   ========================================================================== */

describe("listProjectRoadmap — étanchéité du domaine", () => {
  test("la roadmap d'un projet d'un autre domaine ne se lit pas", async () => {
    expect(await listProjectRoadmap(b.scope, a.fullId)).toEqual([]);
  });

  test("chaque domaine ne lit que ses propres activités", async () => {
    const groups = await listProjectRoadmap(b.scope, b.fullId);
    const flat = groups.flatMap((group) =>
      group.activities.map((activity) => activity.typeLabel),
    );

    expect(flat.length).toBeGreaterThan(0);
    expect(flat.every((label) => label.endsWith(" b"))).toBe(true);
  });
});

/* ==========================================================================
   Les règles d'intégrité de `docs/04` §3 — T3.5

   Éprouvées **en base**, pas seulement dans le code : c'est Postgres qui
   refuse, via les contraintes `CHECK` posées depuis T1.2.
   ========================================================================== */

describe("les contraintes CHECK du cycle de vie", () => {
  test("une activité « terminée » sans fin de période est refusée en base", async () => {
    await expect(
      a.scope.insert(activities, {
        projectId: a.fullId,
        activityTypeId: a.liveTypeId,
        state: "done",
        periodStart: "2026-01-01",
      }),
    ).rejects.toThrow();
  });

  test("une activité « annulée » sans motif est refusée en base", async () => {
    await expect(
      a.scope.insert(activities, {
        projectId: a.fullId,
        activityTypeId: a.liveTypeId,
        state: "cancelled",
      }),
    ).rejects.toThrow();
  });
});

/* ==========================================================================
   Le référentiel proposé au choix — T3.4

   « On propose des lignes vivantes » (T3.3), avec **une exception nominative** :
   le type que l'activité éditée pointe déjà, fût-il archivé depuis. Sans elle,
   corriger l'objectif d'une activité obligerait à lui changer son type.
   ========================================================================== */

describe("listActivityFormOptions — le type archivé", () => {
  /** Les identifiants proposés au choix, dans l'ordre rendu. */
  async function optionIds(
    scope: ScopedDb,
    options?: { keepActivityTypeId?: string },
  ): Promise<string[]> {
    const { activityTypes: proposed } = await listActivityFormOptions(
      scope,
      options,
    );
    return proposed.map((type) => type.id);
  }

  test("sans exception, un type archivé n'est proposé à personne", async () => {
    const ids = await optionIds(a.scope);
    expect(ids).not.toContain(a.retiredTypeId);
    expect(ids).toContain(a.liveTypeId);
  });

  test("le type de l'activité éditée reste proposé, archivé compris", async () => {
    const ids = await optionIds(a.scope, {
      keepActivityTypeId: a.retiredTypeId,
    });
    expect(ids).toContain(a.retiredTypeId);
  });

  test("l'exception ne retient que celui-là", async () => {
    // Un second type est archivé le temps du test : conserver l'un ne doit pas
    // rouvrir la porte à l'autre.
    await a.scope.archive(activityTypes, a.liveTypeId);
    try {
      const ids = await optionIds(a.scope, {
        keepActivityTypeId: a.retiredTypeId,
      });
      expect(ids).toContain(a.retiredTypeId);
      expect(ids).not.toContain(a.liveTypeId);
    } finally {
      await db
        .update(activityTypes)
        .set({ archivedAt: null })
        .where(eq(activityTypes.id, a.liveTypeId));
    }
  });

  test("un type vivant conservé ne se dédouble pas", async () => {
    const ids = await optionIds(a.scope, { keepActivityTypeId: a.liveTypeId });
    expect(ids.filter((id) => id === a.liveTypeId)).toHaveLength(1);
  });

  test("l'exception ne traverse pas la frontière de domaine", async () => {
    const ids = await optionIds(b.scope, {
      keepActivityTypeId: a.retiredTypeId,
    });
    expect(ids).not.toContain(a.retiredTypeId);
    expect(ids.length).toBeGreaterThan(0);
  });
});

/* ==========================================================================
   L'outil archivé — T4bis.6

   L'exception nominative de T3.4, transposée au troisième panneau. Le bloc est
   celui du type archivé, mot pour mot : ce sont les mêmes cinq questions, et
   qu'elles se posent à l'identique est la propriété qu'on cherchait.
   ========================================================================== */

describe("listResultToolOptions — l'outil archivé", () => {
  async function optionIds(
    scope: ScopedDb,
    options: { keepToolId?: string } = {},
  ): Promise<string[]> {
    const proposed = await listResultToolOptions(scope, options);
    return proposed.map((tool) => tool.id);
  }

  test("sans exception, un outil archivé n'est proposé à personne", async () => {
    const ids = await optionIds(a.scope);
    expect(ids).not.toContain(a.retiredToolId);
    expect(ids).toContain(a.toolId);
  });

  test("l'outil du résultat corrigé reste proposé, archivé compris", async () => {
    const ids = await optionIds(a.scope, { keepToolId: a.retiredToolId });
    expect(ids).toContain(a.retiredToolId);
  });

  test("l'exception ne retient que celui-là", async () => {
    // Un second outil est archivé le temps du test : conserver l'un ne doit pas
    // rouvrir la porte à l'autre.
    await a.scope.archive(tools, a.toolId);
    try {
      const ids = await optionIds(a.scope, { keepToolId: a.retiredToolId });
      expect(ids).toContain(a.retiredToolId);
      expect(ids).not.toContain(a.toolId);
    } finally {
      await db
        .update(tools)
        .set({ archivedAt: null })
        .where(eq(tools.id, a.toolId));
    }
  });

  test("un outil vivant conservé ne se dédouble pas", async () => {
    const ids = await optionIds(a.scope, { keepToolId: a.toolId });
    expect(ids.filter((id) => id === a.toolId)).toHaveLength(1);
  });

  test("l'exception ne traverse pas la frontière de domaine", async () => {
    /* **Le test qui isole le filtre de domaine** — la leçon de T4bis.5, où deux
       filtres se rattrapaient l'un l'autre et où retirer le bon ne faisait
       tomber aucun test. Ici la condition nominative porte sur `tools.id` seul,
       sans domaine : c'est `filter(tools)` de la couche, et lui seul, qui empêche
       l'outil archivé du domaine `a` d'être proposé dans le domaine `b`. */
    const ids = await optionIds(b.scope, { keepToolId: a.retiredToolId });
    expect(ids).not.toContain(a.retiredToolId);
    expect(ids.length).toBeGreaterThan(0);
  });

  test("le tri par nom tient, l'outil conservé compris", async () => {
    // `tools` ne porte pas de `position` : l'alphabet est le seul ordre qui ne
    // varie pas d'un affichage à l'autre. « Ergonome a » avant « Outil retiré a ».
    const proposed = await listResultToolOptions(a.scope, {
      keepToolId: a.retiredToolId,
    });
    const names = proposed.map((tool) => tool.name);

    expect(names).toEqual([...names].sort((x, y) => x.localeCompare(y)));
  });
});

/* ==========================================================================
   Les participants — T3.6
   ========================================================================== */

describe("listActivityFormOptions — les personnes proposées", () => {
  test("les deux personnes du domaine sont proposées, triées par nom", async () => {
    const { persons: proposed } = await listActivityFormOptions(a.scope);

    expect(proposed.map((p) => p.id)).toEqual(
      expect.arrayContaining([a.centerPersonId, a.stakeholderPersonId]),
    );
    // « Amir » avant « Zoé » : l'ordre alphabétique, pas celui de l'écriture.
    const names = proposed.map((p) => p.fullName);
    expect(names.indexOf(`Amir Entité a`)).toBeLessThan(
      names.indexOf(`Zoé Centre a`),
    );
  });

  test("chaque personne porte son côté (`kind`)", async () => {
    const { persons: proposed } = await listActivityFormOptions(a.scope);
    const stakeholder = proposed.find((p) => p.id === a.stakeholderPersonId);
    const center = proposed.find((p) => p.id === a.centerPersonId);

    expect(stakeholder?.kind).toBe("stakeholder");
    expect(center?.kind).toBe("center");
  });

  test("une personne d'un autre domaine n'est jamais proposée", async () => {
    const { persons: proposed } = await listActivityFormOptions(a.scope);
    expect(proposed.map((p) => p.id)).not.toContain(b.stakeholderPersonId);
  });
});

describe("listProjectRoadmap — les participants", () => {
  test("une entrée porte ses participants, triés par nom", async () => {
    const groups = await listProjectRoadmap(a.scope, a.fullId);
    const done = groups.find((group) => group.key === "done")?.activities ?? [];
    const accessibility = done.find((row) => row.id === a.accessibilityActivityId);

    expect(accessibility?.participants).toEqual([
      { id: a.stakeholderPersonId, fullName: `Amir Entité a`, kind: "stakeholder" },
      { id: a.centerPersonId, fullName: `Zoé Centre a`, kind: "center" },
    ]);
  });

  test("une entrée sans participant rend un tableau vide", async () => {
    const groups = await listProjectRoadmap(a.scope, a.fullId);
    const cancelled =
      groups.find((group) => group.key === "cancelled")?.activities ?? [];

    expect(cancelled[0]?.participants).toEqual([]);
  });

  test("les participants d'un autre domaine ne s'y mêlent jamais", async () => {
    const groups = await listProjectRoadmap(a.scope, a.fullId);
    const flatIds = groups.flatMap((group) =>
      group.activities.flatMap((activity) =>
        activity.participants.map((person) => person.id),
      ),
    );

    expect(flatIds).not.toContain(b.centerPersonId);
    expect(flatIds).not.toContain(b.stakeholderPersonId);
  });
});

describe("listActivityParticipantIds", () => {
  test("rend les identifiants liés à l'activité", async () => {
    const ids = await listActivityParticipantIds(
      a.scope,
      a.accessibilityActivityId,
    );
    expect(ids.sort()).toEqual(
      [a.centerPersonId, a.stakeholderPersonId].sort(),
    );
  });

  test("une activité sans participant rend un tableau vide", async () => {
    expect(await listActivityParticipantIds(a.scope, a.cancelledId)).toEqual(
      [],
    );
  });

  test("ne traverse pas la frontière de domaine", async () => {
    // La liaison existe dans le domaine `a` ; interrogée depuis `b`, le
    // filtre de domaine de `scope.list` ne trouve rien — la couche est
    // scopée sur `activity_participants` elle-même, pas seulement sur ce
    // qu'elle joint.
    expect(
      await listActivityParticipantIds(b.scope, a.accessibilityActivityId),
    ).toEqual([]);
  });
});

/* ==========================================================================
   Les résultats (T4.3)
   ========================================================================== */

/** L'entrée d'une activité donnée, cherchée à plat dans les cinq groupes. */
function entryOf(
  groups: RoadmapGroup[],
  activityId: string,
): RoadmapActivity | undefined {
  return groups
    .flatMap((group) => group.activities)
    .find((activity) => activity.id === activityId);
}

describe("listProjectRoadmap — les résultats", () => {
  test("l'entrée porte son résultat, les six champs du contrat unique", async () => {
    const groups = await listProjectRoadmap(a.scope, a.fullId);

    expect(entryOf(groups, a.accessibilityActivityId)?.result).toEqual({
      // Les deux champs que T4bis.6 ajoute : l'identifiant, sans quoi les gestes
      // de correction n'ont rien à lier, et l'identifiant de l'outil, sans quoi
      // le panneau ne peut pas le resélectionner.
      id: expect.any(String),
      label: "Score d'audit UX a",
      // `numeric(18,4)` : le pilote rend la chaîne brute, et c'est bien ce que
      // la lecture doit remonter — le formatage est le travail de
      // `lib/format`, pas le sien.
      value: "62.0000",
      unit: "/100",
      measuredOn: "2024-05-31",
      toolName: "Ergonome a",
      toolId: a.toolId,
      externalUrl: "https://exemple.invalid/rapport-a",
    });
  });

  test("les quatre colonnes nullables du contrat peuvent l'être ensemble", async () => {
    const groups = await listProjectRoadmap(a.scope, a.fullId);

    // La ligne se lit quand même : un résultat sans valeur, sans unité, sans
    // outil et **sans lien profond** est un cas normal — c'est celui des deux
    // résultats de la fixture d'amorçage.
    expect(entryOf(groups, a.userTestActivityId)?.result).toEqual({
      id: expect.any(String),
      label: "Synthèse de campagne a",
      value: null,
      unit: null,
      measuredOn: "2026-03-31",
      toolName: null,
      toolId: null,
      externalUrl: null,
    });
  });

  test("une entrée sans résultat en porte `null`, pas un objet vide", async () => {
    const groups = await listProjectRoadmap(a.scope, a.fullId);

    expect(entryOf(groups, a.workshopActivityId)?.result).toBeNull();
    expect(entryOf(groups, a.cancelledId)?.result).toBeNull();
  });

  test("la plupart des entrées n'en portent aucun", async () => {
    const groups = await listProjectRoadmap(a.scope, a.fullId);
    const carried = groups
      .flatMap((group) => group.activities)
      .filter((activity) => activity.result !== null);

    expect(carried.map((activity) => activity.id).sort()).toEqual(
      [a.accessibilityActivityId, a.userTestActivityId].sort(),
    );
  });

  test("un résultat archivé n'apparaît pas, l'activité restât-elle vivante", async () => {
    const groups = await listProjectRoadmap(a.scope, a.doneOnlyId);

    // L'entrée se lit — son activité n'est pas archivée —, mais elle ne porte
    // rien : c'est le résultat seul qui est rangé.
    expect(entryOf(groups, a.doneOnlyActivityId)).toBeDefined();
    expect(entryOf(groups, a.doneOnlyActivityId)?.result).toBeNull();
  });
});

/* ==========================================================================
   L'unicité partielle — T4bis.6

   **Le seul bloc de ce fichier qui éprouve le schéma plutôt qu'une lecture**,
   et il le fait par la lecture : `results_activity_unique` est devenu un index
   partiel (`where archived_at is null`), et la propriété se constate là où
   l'écran la constate — l'entrée de roadmap porte le résultat ressaisi.

   Avant la migration, ces deux tests ne pouvaient pas exister : le premier
   levait une violation d'unicité — une exception PostgreSQL, donc un 500 —
   parce qu'un résultat archivé occupait toujours la place de son activité.
   C'est la mise en défaut du ticket : rétablir la contrainte totale les fait
   tomber, et eux seuls.

   `doneOnlyActivityId` porte déjà le résultat **archivé** de la fixture : c'est
   exactement l'état d'une activité dont on vient de retirer le résultat.
   ========================================================================== */

describe("results_activity_unique — l'index partiel", () => {
  test("un résultat retiré libère son activité : le suivant s'écrit et se lit", async () => {
    const replacement = await a.scope.insert(results, {
      activityId: a.doneOnlyActivityId,
      label: "Résultat ressaisi a",
      value: "80",
      measuredOn: "2025-03-31",
    });

    try {
      const groups = await listProjectRoadmap(a.scope, a.doneOnlyId);
      const entry = entryOf(groups, a.doneOnlyActivityId);

      // Le ressaisi se lit, l'archivé reste invisible : un seul résultat sur
      // l'entrée, et c'est le vivant.
      expect(entry?.result?.label).toBe("Résultat ressaisi a");
      expect(entry?.result?.id).toBe(replacement.id);
    } finally {
      // Les tests partagent une base réelle : la ligne repart, sans quoi les
      // tests de roadmap qui suivent liraient un résultat de plus.
      await db.delete(results).where(eq(results.id, replacement.id));
    }
  });

  test("deux résultats **vivants** sur une même activité restent refusés", async () => {
    /* La règle de `docs/04` §4 survit à la migration, elle en sort seulement
       exacte : un résultat **vivant** pour une activité au plus.
       `accessibilityActivityId` porte le sien, non archivé. */
    await expect(
      a.scope.insert(results, {
        activityId: a.accessibilityActivityId,
        label: "Second résultat vivant a",
        measuredOn: "2024-06-30",
      }),
    ).rejects.toThrow();

    // Et la lecture n'a pas bougé : l'entrée porte toujours le premier.
    const groups = await listProjectRoadmap(a.scope, a.fullId);
    expect(entryOf(groups, a.accessibilityActivityId)?.result?.label).toBe(
      "Score d'audit UX a",
    );
  });

  test("l'unicité ne connaît pas le domaine, et l'archivage la borne quand même", async () => {
    /* `results_activity_unique` porte sur `activity_id` seul — aucun
       `domain_id`, avant comme après la migration. Une ligne forgée depuis le
       domaine `b` sur une activité du domaine `a` qui porte déjà un résultat
       vivant se heurte donc à l'index, et non à un filtre de domaine. C'est ce
       que le commentaire de `listProjectRoadmap` supposait sans l'éprouver. */
    await expect(
      db.insert(results).values({
        domainId: b.domainId,
        activityId: a.accessibilityActivityId,
        label: "Résultat forgé sur activité occupée b",
        measuredOn: "2027-03-31",
      }),
    ).rejects.toThrow();
  });
});

describe("listProjectRoadmap — étanchéité des résultats", () => {
  test("chaque domaine ne lit que ses propres résultats", async () => {
    const groups = await listProjectRoadmap(b.scope, b.fullId);

    expect(entryOf(groups, b.accessibilityActivityId)?.result?.label).toBe(
      "Score d'audit UX b",
    );
    const labels = groups
      .flatMap((group) => group.activities)
      .map((activity) => activity.result?.label)
      .filter(Boolean);
    expect(labels.every((label) => label?.endsWith(" b"))).toBe(true);
  });

  /* ------------------------------------------------------------------------
     `filter(tools)` — éprouvé sur une liaison **forgée**.

     La raison est celle relevée par T4.1 sur `filter(activities)` : la
     jointure porte sur une clé primaire (`tools.id = results.tool_id`) et la
     couche d'accès refuse déjà d'écrire un `tool_id` hors domaine —
     `assertPreconditions` le vérifie parmi les clés étrangères de la table.
     Aucune ligne honnête ne peut donc faire mentir la jointure : sans donnée
     illégitime, ce filtre est **infalsifiable**.

     Le test écrit donc directement par `db`, hors de la couche scopée,
     exactement ce qu'`assertPreconditions` interdit — le second endroit du
     projet qui la contourne, après `resources.test.ts`, et pour la même
     raison : prouver que la lecture tient quand même.
     ---------------------------------------------------------------------- */
  test("un résultat pointant l'outil d'un autre domaine ne rend aucun nom", async () => {
    const [forgedActivity] = await db
      .insert(activities)
      .values({
        domainId: b.domainId,
        projectId: b.fullId,
        activityTypeId: b.liveTypeId,
        state: "done",
        periodStart: "2027-01-01",
        periodEnd: "2027-01-31",
      })
      .returning();

    await db.insert(results).values({
      domainId: b.domainId,
      activityId: forgedActivity?.id as string,
      label: "Résultat à l'outil forgé b",
      measuredOn: "2027-01-31",
      // La liaison interdite : l'outil du domaine `a`.
      toolId: a.toolId,
    });

    const groups = await listProjectRoadmap(b.scope, b.fullId);
    const forged = entryOf(groups, forgedActivity?.id as string);

    // Le résultat se lit — il est bien du domaine `b` — mais son outil ne rend
    // rien : `filter(tools)` coupe la jointure, et le nom de l'outil voisin ne
    // franchit pas la frontière.
    expect(forged?.result?.label).toBe("Résultat à l'outil forgé b");
    expect(forged?.result?.toolName).toBeNull();

    /* **`toolId` vient de la colonne, `toolName` de la jointure filtrée**, et
       ce test est le seul endroit où la différence se voit (T4bis.6). La ligne
       dit ce qu'elle porte ; la jointure dit ce qu'on a le droit d'en nommer.
       Prendre `tools.id` aurait rendu `null` des deux côtés, et le panneau de
       correction aurait perdu la valeur qu'il doit resélectionner. Rien ne
       fuit pour autant : le nom de l'outil voisin ne franchit pas la
       frontière, et `listResultToolOptions` ne proposera jamais cet
       identifiant dans le domaine `b`. */
    expect(forged?.result?.toolId).toBe(a.toolId);
  });

  test("un résultat forgé sur l'activité d'un autre domaine ne se lit pas", async () => {
    // `results` n'a pas de `project_id` : c'est `innerJoin(activities)` qui
    // porte à la fois l'appartenance au projet et le domaine. Une ligne du
    // domaine `b` accrochée à une activité du domaine `a` ne doit sortir
    // d'aucune des deux roadmaps.
    //
    // La cible est l'atelier, qui ne porte aucun résultat :
    // `results_activity_unique` ne connaît pas le domaine, et une activité qui
    // en porte déjà un refuserait la seconde ligne.
    await db.insert(results).values({
      domainId: b.domainId,
      activityId: a.workshopActivityId,
      label: "Résultat à l'activité forgée b",
      measuredOn: "2027-02-28",
    });

    const seen = [
      ...(await listProjectRoadmap(a.scope, a.fullId)),
      ...(await listProjectRoadmap(b.scope, b.fullId)),
    ]
      .flatMap((group) => group.activities)
      .map((activity) => activity.result?.label);

    expect(seen).not.toContain("Résultat à l'activité forgée b");
  });
});
