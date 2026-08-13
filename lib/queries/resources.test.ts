/**
 * Les tests de la lecture des ressources d'un projet.
 *
 * Ils tournent sur la branche Neon dédiée — `vitest.config.mts` remappe
 * `DATABASE_URL` sur `TEST_DATABASE_URL` — et écrivent réellement : deux
 * `leftJoin` filtrés sur le domaine et un ordre par `created_at` ne se
 * vérifient pas sur un faux.
 *
 * Deux domaines sont amorcés, comme dans `activities.test.ts` : sans un second
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
  domains,
  entities,
  products,
  projectStatuses,
  projects,
  resources,
} from "@/lib/db/schema";

import { listProjectResources, type ProjectResource } from "./resources";

/** Enfants d'abord, parents ensuite : `domains` refuse la suppression sinon. */
const teardownOrder = [
  resources,
  activities,
  projects,
  products,
  activityTypes,
  projectStatuses,
  entities,
];

type Fixture = {
  domainId: string;
  scope: ScopedDb;
  /** Le projet qui porte les quatre formes de ressource. */
  fullId: string;
  /** Un projet sans aucune ressource : la lecture doit être vide. */
  emptyId: string;
  /** Un second projet peuplé : ses ressources ne doivent pas déborder. */
  otherId: string;
  /** La ressource archivée, identifiée nommément. */
  archivedResourceId: string;
  /** Le titre de la ressource rattachée à une activité **archivée**. */
  onArchivedActivityTitle: string;
  /** L'activité « Test utilisateur » — la cible des liaisons forgées. */
  testActivityId: string;
  /** Son type — la seconde cible des liaisons forgées. */
  userTestTypeId: string;
};

const suffix = Math.random().toString(36).slice(2, 10);
let a: Fixture;
let b: Fixture;

/**
 * Trois projets, deux types d'activité, deux activités dont une archivée, et
 * cinq ressources couvrant les quatre formes de la lecture plus le débordement.
 *
 * Les ressources sont écrites **dans le désordre** par rapport à l'ordre
 * attendu, et leur `created_at` est posé explicitement : c'est la requête qui
 * doit trier, pas la suite des insertions — et un `created_at` laissé par
 * défaut les daterait toutes de la même milliseconde.
 */
async function seedDomain(label: string): Promise<Fixture> {
  const domain = await superAdmin.createDomain({
    name: `__test__resources__${label}__${suffix}`,
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

  const project = async (name: string) =>
    scope.insert(projects, {
      name: `${name} ${label}`,
      productId: product.id,
      statusId: active.id,
    });

  const full = await project("Complet");
  const empty = await project("Vide");
  const other = await project("Voisin");

  const userTest = await scope.insert(activityTypes, {
    label: `Test utilisateur ${label}`,
    family: "research",
  });
  const workshop = await scope.insert(activityTypes, {
    label: `Atelier de cadrage ${label}`,
    family: "framing",
  });

  const testActivity = await scope.insert(activities, {
    projectId: full.id,
    activityTypeId: userTest.id,
    state: "done",
    periodStart: "2026-03-01",
    periodEnd: "2026-03-31",
  });

  /* Une activité archivée : son libellé doit continuer de s'afficher sur la
     ressource qui la pointe — on décrit, on ne propose pas. */
  const archivedActivity = await scope.insert(activities, {
    projectId: full.id,
    activityTypeId: workshop.id,
    state: "in_progress",
    periodStart: "2026-01-01",
  });
  await scope.archive(activities, archivedActivity.id);

  const resource = async (values: {
    projectId: string;
    activityId?: string;
    title: string;
    createdAt: Date;
  }) =>
    scope.insert(resources, {
      projectId: values.projectId,
      ...(values.activityId ? { activityId: values.activityId } : {}),
      title: `${values.title} ${label}`,
      url: `https://exemple.invalid/${encodeURIComponent(values.title)}`,
      resourceType: "powerpoint",
      createdAt: values.createdAt,
    });

  /* --- Écrites dans le désordre : la plus ancienne en premier ------------ */
  await resource({
    projectId: full.id,
    activityId: testActivity.id,
    title: "Restitution des tests",
    createdAt: new Date("2026-05-01T09:00:00Z"),
  });
  await resource({
    projectId: full.id,
    title: "Grille d'entretien",
    createdAt: new Date("2026-07-01T09:00:00Z"),
  });
  const onArchived = await resource({
    projectId: full.id,
    activityId: archivedActivity.id,
    title: "Notes d'atelier",
    createdAt: new Date("2026-06-01T09:00:00Z"),
  });

  /* --- Ce que la lecture doit écarter ------------------------------------ */
  const archivedResource = await resource({
    projectId: full.id,
    title: "Brouillon retiré",
    // La plus récente de toutes : sans le filtre, elle ouvrirait la liste.
    createdAt: new Date("2026-12-01T09:00:00Z"),
  });
  await scope.archive(resources, archivedResource.id);

  await resource({
    projectId: other.id,
    title: "Ressource du voisin",
    createdAt: new Date("2026-08-01T09:00:00Z"),
  });

  return {
    domainId: domain.id,
    scope,
    fullId: full.id,
    emptyId: empty.id,
    otherId: other.id,
    archivedResourceId: archivedResource.id,
    onArchivedActivityTitle: onArchived.title,
    testActivityId: testActivity.id,
    userTestTypeId: userTest.id,
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

/** Les titres retenus, dans l'ordre rendu. */
function titles(rows: ProjectResource[]): string[] {
  return rows.map((row) => row.title);
}

/* ==========================================================================
   L'ordre — tranché par T4.1, faute d'être écrit dans les documents
   ========================================================================== */

describe("listProjectResources — l'ordre", () => {
  test("la plus récemment reliée est en tête", async () => {
    const rows = await listProjectResources(a.scope, a.fullId);

    expect(titles(rows)).toEqual([
      "Grille d'entretien a", // juillet 2026
      "Notes d'atelier a", // juin 2026
      "Restitution des tests a", // mai 2026
    ]);
  });
});

/* ==========================================================================
   Ce que la lecture porte
   ========================================================================== */

describe("listProjectResources — les champs", () => {
  test("une ressource rattachée porte le libellé du type de son activité", async () => {
    const rows = await listProjectResources(a.scope, a.fullId);
    const restitution = rows.find(
      (row) => row.title === "Restitution des tests a",
    );

    expect(restitution).toMatchObject({
      resourceType: "powerpoint",
      activityLabel: "Test utilisateur a",
      url: "https://exemple.invalid/Restitution%20des%20tests",
    });
  });

  test("une ressource sans rattachement sort quand même, l'activité à null", async () => {
    // Le `leftJoin` est là pour elle : une jointure interne la ferait
    // disparaître de la lecture au lieu de la rendre sans activité.
    const rows = await listProjectResources(a.scope, a.fullId);
    const grille = rows.find((row) => row.title === "Grille d'entretien a");

    expect(grille).toBeDefined();
    expect(grille?.activityLabel).toBeNull();
  });

  test("le libellé d'une activité archivée s'affiche quand même", async () => {
    // On décrit, on ne propose pas — la règle que `listProjectRoadmap`
    // applique déjà au libellé d'un type d'activité archivé.
    const rows = await listProjectResources(a.scope, a.fullId);
    const notes = rows.find((row) => row.title === a.onArchivedActivityTitle);

    expect(notes?.activityLabel).toBe("Atelier de cadrage a");
  });
});

/* ==========================================================================
   Ce que la lecture écarte
   ========================================================================== */

describe("listProjectResources — le périmètre", () => {
  test("une ressource archivée n'apparaît nulle part", async () => {
    const rows = await listProjectResources(a.scope, a.fullId);

    // Elle est la plus récente de la fixture : sans le filtre, elle serait en
    // tête de liste, pas au fond.
    expect(rows.map((row) => row.id)).not.toContain(a.archivedResourceId);
  });

  test("les ressources d'un autre projet du même domaine n'apparaissent pas", async () => {
    const rows = await listProjectResources(a.scope, a.fullId);

    expect(titles(rows)).not.toContain("Ressource du voisin a");
    expect(titles(await listProjectResources(a.scope, a.otherId))).toEqual([
      "Ressource du voisin a",
    ]);
  });

  test("un projet sans ressource rend un tableau vide", async () => {
    expect(await listProjectResources(a.scope, a.emptyId)).toEqual([]);
  });
});

/* ==========================================================================
   L'étanchéité
   ========================================================================== */

describe("listProjectResources — étanchéité du domaine", () => {
  test("les ressources d'un projet d'un autre domaine ne se lisent pas", async () => {
    expect(await listProjectResources(b.scope, a.fullId)).toEqual([]);
  });

  test("chaque domaine ne lit que ses propres ressources", async () => {
    const rows = await listProjectResources(b.scope, b.fullId);

    expect(rows.length).toBeGreaterThan(0);
    expect(titles(rows).every((title) => title.endsWith(" b"))).toBe(true);
  });

  /* ------------------------------------------------------------------------
     Les deux filtres de jointure — éprouvés sur des liaisons **forgées**.

     Découvert en mettant les tests en défaut : retirer l'un ou l'autre de ces
     filtres ne fait tomber **aucun** test écrit à partir de données légitimes,
     et pour une raison de fond — la jointure porte sur une **clé primaire**
     (`activities.id = resources.activity_id`), et la couche d'accès refuse déjà
     d'écrire un rattachement hors domaine. Aucune ligne honnête ne peut faire
     mentir la jointure : sans donnée illégitime, ces deux filtres sont
     **infalsifiables**.

     Les deux tests ci-dessous écrivent donc directement par `db`, hors de la
     couche scopée, exactement ce qu'`assertPreconditions` interdit — le seul
     endroit du projet qui la contourne, et il le fait pour prouver que la
     lecture tient quand même.

     Ce qu'ils montrent, une fois écrits, est la propriété relevée de T2.2 à
     T3.1, vérifiée ici une sixième fois : `filter(activities)` retiré **seul**
     ne fait rien tomber — `filter(activityTypes)` le rattrape, le type de
     l'activité étrangère relevant lui aussi de l'autre domaine ;
     `filter(activityTypes)` retiré seul fait tomber le second test ; les deux
     retirés ensemble font tomber les deux.
     ---------------------------------------------------------------------- */

  test("une ressource pointant l'activité d'un autre domaine ne rend aucun libellé", async () => {
    const [forged] = await db
      .insert(resources)
      .values({
        domainId: b.domainId,
        projectId: b.fullId,
        // La liaison interdite : une activité du domaine `a`.
        activityId: a.testActivityId,
        title: "Ressource forgée b",
        url: "https://exemple.invalid/forgee",
        resourceType: "powerpoint",
      })
      .returning();

    const rows = await listProjectResources(b.scope, b.fullId);
    const row = rows.find((candidate) => candidate.id === forged?.id);

    // Elle se lit — elle est bien du domaine `b` — mais son rattachement ne
    // rend rien : `filter(activities)` coupe la jointure.
    expect(row).toBeDefined();
    expect(row?.activityLabel).toBeNull();
    expect(rows.map((candidate) => candidate.activityLabel)).not.toContain(
      "Test utilisateur a",
    );
  });

  test("une activité pointant le type d'un autre domaine ne rend aucun libellé", async () => {
    const [forgedActivity] = await db
      .insert(activities)
      .values({
        domainId: b.domainId,
        projectId: b.fullId,
        // La seconde liaison interdite : un type du domaine `a`.
        activityTypeId: a.userTestTypeId,
        state: "in_progress",
        periodStart: "2026-04-01",
      })
      .returning();

    const [forged] = await db
      .insert(resources)
      .values({
        domainId: b.domainId,
        projectId: b.fullId,
        activityId: forgedActivity?.id,
        title: "Ressource au type forgé b",
        url: "https://exemple.invalid/type-forge",
        resourceType: "powerpoint",
      })
      .returning();

    const rows = await listProjectResources(b.scope, b.fullId);
    const row = rows.find((candidate) => candidate.id === forged?.id);

    // L'activité, elle, est bien du domaine `b` : c'est `filter(activityTypes)`
    // et lui seul qui empêche le libellé de `a` de s'afficher ici.
    expect(row).toBeDefined();
    expect(row?.activityLabel).toBeNull();
  });
});
