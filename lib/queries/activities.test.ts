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

import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { db } from "@/lib/db/client";
import { forDomain, superAdmin, type ScopedDb } from "@/lib/db/scoped";
import {
  activities,
  activityTypes,
  approaches,
  domains,
  entities,
  products,
  projectStatuses,
  projects,
} from "@/lib/db/schema";

import { listProjectRoadmap, type RoadmapGroup } from "./activities";

/** Enfants d'abord, parents ensuite : `domains` refuse la suppression sinon. */
const teardownOrder = [
  activities,
  projects,
  products,
  activityTypes,
  approaches,
  projectStatuses,
  entities,
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
};

const suffix = Math.random().toString(36).slice(2, 10);
let a: Fixture;
let b: Fixture;

/**
 * Un domaine complet : trois projets, huit types d'activité dont un archivé,
 * une approche, et onze activités couvrant les quatre groupes, l'annulée,
 * l'archivée, l'activité sans date et l'activité sans approche.
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

  const type = async (name: string) =>
    scope.insert(activityTypes, { label: `${name} ${label}`, family: "research" });

  const workshop = await type("Atelier de priorisation");
  const audit = await type("Audit UX");
  const training = await type("Formation");
  const accessibility = await type("Audit d'accessibilité");
  const userTest = await type("Test utilisateur");
  const observation = await type("Observation terrain");
  const handover = await type("Passation");
  const benchmark = await type("Benchmark");

  /* Un type archivé : son libellé doit continuer de s'afficher — on décrit,
     on ne propose pas au choix. */
  const retired = await type("Type retiré");
  await scope.archive(activityTypes, retired.id);

  /* --- Terminé, inséré en premier alors qu'il se lit en dernier ---------- */
  await scope.insert(activities, {
    projectId: full.id,
    activityTypeId: userTest.id,
    state: "done",
    periodStart: "2026-03-01",
    periodEnd: "2026-03-31",
  });
  await scope.insert(activities, {
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
  await scope.insert(activities, {
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
  await scope.insert(activities, {
    projectId: doneOnly.id,
    activityTypeId: audit.id,
    state: "done",
    periodStart: "2025-02-01",
    periodEnd: "2025-02-28",
  });

  return {
    domainId: domain.id,
    scope,
    fullId: full.id,
    emptyId: empty.id,
    doneOnlyId: doneOnly.id,
    cancelledId: cancelled.id,
    archivedActivityId: archived.id,
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
  test("les quatre groupes sortent dans l'ordre de lecture de docs/03 §6", async () => {
    const groups = await listProjectRoadmap(a.scope, a.fullId);

    expect(groups.map((group) => group.key)).toEqual([
      "in_progress",
      "planned",
      "unscheduled",
      "done",
    ]);
    expect(groups.map((group) => group.label)).toEqual([
      "En cours",
      "Prévu",
      "À planifier",
      "Terminé",
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

  test("les cinq entrées du critère se suivent dans l'ordre annoncé", async () => {
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
    ]);
  });
});

/* ==========================================================================
   Ce que la lecture écarte, et ce qu'elle porte
   ========================================================================== */

describe("listProjectRoadmap — le périmètre et les champs", () => {
  test("une activité annulée n'apparaît nulle part", async () => {
    const groups = await listProjectRoadmap(a.scope, a.fullId);
    const ids = groups.flatMap((group) =>
      group.activities.map((activity) => activity.id),
    );

    // Elle est bien en base : c'est la lecture qui l'écarte, faute de groupe
    // pour la recevoir avant T3.5. Le constat porte sur **cette ligne-là**, et
    // non sur un décompte — un test qui compte tombe pour d'autres raisons.
    const row = await a.scope.find(activities, a.cancelledId);
    expect(row?.state).toBe("cancelled");
    expect(ids).not.toContain(a.cancelledId);
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
