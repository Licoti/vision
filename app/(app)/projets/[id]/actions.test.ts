/**
 * Les tests de `createActivity` et `updateActivity` — **le droit s'éprouve par
 * l'action** (21/08/2026).
 *
 * `CLAUDE.md` pose la discipline en toutes lettres : « un panneau absent du
 * rendu n'a jamais protégé le point d'entrée HTTP qui l'accompagne ». Le
 * panneau de saisie d'activité ne se monte que pour qui peut écrire dans
 * l'accompagnement, et cela ne prouve rien : les identifiants liés d'une action
 * serveur sont sérialisés en clair dans un champ `$ACTION_…`, réécrivable.
 *
 * **Premier fichier de tests d'action de `projets/`**, et il arrive avec la
 * colonne `activities.external_url` — un champ de plus sur un point d'entrée
 * qui existait déjà. C'est précisément ce que ces tests éprouvent : le champ
 * neuf n'ouvre aucune porte, il passe par `openProject` comme les sept autres.
 *
 * **Ce qui est mesuré est la base, jamais le chemin pris.** Un refus se lit à
 * ce qu'aucune ligne n'a bougé ; une écriture, à ce que la colonne porte la
 * valeur attendue. `ok` et `message` sont des indices, la table est la preuve.
 *
 * Deux modules de Next sont remplacés, et deux seulement : `next/headers`, dont
 * le cookie désigne la personne courante au POC, et `next/cache`, dont la
 * revalidation n'a aucun sens hors d'un rendu. Rien d'autre — la base est
 * réelle, les portes sont les vraies, `requireSession` fait son travail entier.
 * Aucun `next/navigation` : ces deux actions ne redirigent pas (TD.2).
 */

import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import { db } from "@/lib/db/client";
import { forDomain, superAdmin, type ScopedDb } from "@/lib/db/scoped";
import {
  activities,
  activityTypes,
  domains,
  entities,
  persons,
  products,
  projectMembers,
  projectStatuses,
  projects,
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

const { createActivity, updateActivity } = await import("./actions");

const suffix = Math.random().toString(36).slice(2, 10);

const LINK = "https://ergonome.example.com/audits/eprouve";

type Fixture = {
  domainId: string;
  scope: ScopedDb;
  contributorId: string;
  outsiderId: string;
  projectId: string;
  archivedProjectId: string;
  typeId: string;
  /** Une activité vivante du projet ouvert, pour éprouver la correction. */
  activityId: string;
};

let f: Fixture;

beforeAll(async () => {
  const domain = await superAdmin.createDomain({
    name: `__test__projet_actions__${suffix}`,
    competenceCenterName: `Centre ${suffix}`,
  });
  const scope = forDomain({ domainId: domain.id });

  const person = (fullName: string) =>
    scope.insert(persons, {
      fullName,
      source: "manual",
      kind: "center",
      hasAccess: true,
      domainRole: "member",
    });

  const contributor = await person(`Contributeur ${suffix}`);
  const outsider = await person(`Membre ${suffix}`);

  const entity = await scope.insert(entities, { label: `Entité ${suffix}` });
  const status = await scope.insert(projectStatuses, {
    label: `En cours ${suffix}`,
    nature: "active",
  });
  const product = await scope.insert(products, {
    name: `Produit ${suffix}`,
    entityId: entity.id,
  });

  const project = await scope.insert(projects, {
    name: `Ouvert ${suffix}`,
    productId: product.id,
    statusId: status.id,
  });
  const archivedProject = await scope.insert(projects, {
    name: `Rangé ${suffix}`,
    productId: product.id,
    statusId: status.id,
  });

  /* Contributeur des **deux** accompagnements : ce qui fait tomber l'écriture
     sur le second est son archivage, et lui seul — pas un droit qui manque. */
  for (const target of [project, archivedProject]) {
    await scope.insert(projectMembers, {
      projectId: target.id,
      personId: contributor.id,
      isContributor: true,
    });
  }
  await scope.archive(projects, archivedProject.id);

  const type = await scope.insert(activityTypes, {
    label: `Audit UX ${suffix}`,
    family: "evaluation",
    producesResult: true,
  });

  const activity = await scope.insert(activities, {
    projectId: project.id,
    activityTypeId: type.id,
    state: "planned",
    periodStart: "2026-10-01",
    periodEnd: "2026-10-31",
  });

  f = {
    domainId: domain.id,
    scope,
    contributorId: contributor.id,
    outsiderId: outsider.id,
    projectId: project.id,
    archivedProjectId: archivedProject.id,
    typeId: type.id,
    activityId: activity.id,
  };
}, 180_000);

afterAll(async () => {
  if (!f?.domainId) return;
  const tables = [
    activities,
    projectMembers,
    projects,
    projectStatuses,
    products,
    activityTypes,
    entities,
    persons,
  ];
  for (const table of tables) {
    await db.delete(table).where(eq(table.domainId, f.domainId));
  }
  await db.delete(domains).where(eq(domains.id, f.domainId));
});

/** Le formulaire tel que le panneau le soumettrait. */
function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(entries)) data.append(name, value);
  return data;
}

/** Une saisie valide, dont chaque test ne dérange qu'un champ. */
function saisie(overrides: Record<string, string> = {}): FormData {
  return form({
    activityTypeId: f.typeId,
    periodStart: "2026-11-01",
    periodEnd: "2026-11-30",
    externalUrl: LINK,
    ...overrides,
  });
}

/** Ce que la base porte, sans passer par une lecture d'écran. */
async function linksOf(projectId: string): Promise<(string | null)[]> {
  const rows = await db
    .select({ externalUrl: activities.externalUrl })
    .from(activities)
    .where(
      and(
        eq(activities.domainId, f.domainId),
        eq(activities.projectId, projectId),
      ),
    );
  return rows.map((row) => row.externalUrl);
}

/** Les activités créées par un test, retirées avant le suivant. */
async function clear(): Promise<void> {
  await db
    .delete(activities)
    .where(
      and(
        eq(activities.domainId, f.domainId),
        eq(activities.periodStart, "2026-11-01"),
      ),
    );
}

describe("createActivity — le lien vers l'outil, écrit", () => {
  test("un contributeur écrit le lien sur l'accompagnement ouvert", async () => {
    currentPerson = f.contributorId;
    const state = await createActivity(f.projectId, { values: {} as never, errors: {} }, saisie());

    expect(state.message).toBeUndefined();
    expect(state.ok).toBe(true);
    expect(await linksOf(f.projectId)).toContain(LINK);
    await clear();
  });

  test("un lien absent part à `null`, et c'est un cas normal", async () => {
    currentPerson = f.contributorId;
    await createActivity(
      f.projectId,
      { values: {} as never, errors: {} },
      saisie({ externalUrl: "" }),
    );

    const rows = await db
      .select({ externalUrl: activities.externalUrl })
      .from(activities)
      .where(
        and(
          eq(activities.domainId, f.domainId),
          eq(activities.periodStart, "2026-11-01"),
        ),
      );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.externalUrl).toBeNull();
    await clear();
  });

  test("un lien qui n'est pas un lien web est refusé, et rien n'est écrit", async () => {
    currentPerson = f.contributorId;
    const state = await createActivity(
      f.projectId,
      { values: {} as never, errors: {} },
      saisie({ externalUrl: "ergonome.example.com" }),
    );

    expect(state.ok).toBeUndefined();
    expect(state.errors.externalUrl).toBe(
      "Cette adresse n'est pas un lien web : elle doit commencer par http:// ou https://.",
    );
    // La saisie revient, elle n'est jamais jetée.
    expect(state.values.externalUrl).toBe("ergonome.example.com");
    expect(await linksOf(f.projectId)).not.toContain("ergonome.example.com");
    await clear();
  });
});

describe("createActivity — le champ neuf n'ouvre aucune porte", () => {
  test("un membre non contributeur n'écrit rien, malgré un projet valide", async () => {
    currentPerson = f.outsiderId;
    const before = await linksOf(f.projectId);

    const state = await createActivity(f.projectId, { values: {} as never, errors: {} }, saisie());

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("réservée au responsable de domaine");
    expect(await linksOf(f.projectId)).toEqual(before);
  });

  test("un accompagnement archivé ne reçoit pas le lien, même d'un contributeur", async () => {
    currentPerson = f.contributorId;
    const before = await linksOf(f.archivedProjectId);

    const state = await createActivity(
      f.archivedProjectId,
      { values: {} as never, errors: {} },
      saisie(),
    );

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("archivé");
    expect(await linksOf(f.archivedProjectId)).toEqual(before);
  });

  /* **Aucun test « sans cookie »**, et l'absence est motivée : le stub
     d'authentification retombe délibérément sur la première personne du domaine
     quand le cookie manque (`lib/auth/provider.ts`, « tolérance propre au
     stub »). Une requête sans cookie n'est donc pas anonyme au POC, elle est
     quelqu'un — et éprouver cela reviendrait à figer en test un confort de
     développement qu'Entra ID retirera en C7. Ce que ce fichier éprouve est le
     droit **par personne**, qui ne bouge pas d'une source d'identité à l'autre.
     Écrit le 21/08/2026 après avoir vu le test correspondant échouer : la
     tolérance était documentée, elle n'était pas comprise. */
});

describe("updateActivity — la correction du lien", () => {
  test("un contributeur pose puis retire le lien d'une activité existante", async () => {
    currentPerson = f.contributorId;

    const posed = await updateActivity(
      f.projectId,
      f.activityId,
      { values: {} as never, errors: {} },
      form({
        activityTypeId: f.typeId,
        periodStart: "2026-10-01",
        periodEnd: "2026-10-31",
        externalUrl: LINK,
      }),
    );
    expect(posed.ok).toBe(true);

    const [afterPose] = await db
      .select({ externalUrl: activities.externalUrl })
      .from(activities)
      .where(eq(activities.id, f.activityId));
    expect(afterPose?.externalUrl).toBe(LINK);

    /* Le retrait est ce que la **huitième** colonne d'`activityRowUnchanged`
       rend possible : sans elle, rien d'autre n'ayant bougé, l'écriture serait
       sautée en silence et le lien resterait. */
    const removed = await updateActivity(
      f.projectId,
      f.activityId,
      { values: {} as never, errors: {} },
      form({
        activityTypeId: f.typeId,
        periodStart: "2026-10-01",
        periodEnd: "2026-10-31",
        externalUrl: "",
      }),
    );
    expect(removed.ok).toBe(true);

    const [afterRemove] = await db
      .select({ externalUrl: activities.externalUrl })
      .from(activities)
      .where(eq(activities.id, f.activityId));
    expect(afterRemove?.externalUrl).toBeNull();
  });

  test("un membre non contributeur ne corrige pas le lien", async () => {
    currentPerson = f.outsiderId;

    const state = await updateActivity(
      f.projectId,
      f.activityId,
      { values: {} as never, errors: {} },
      form({
        activityTypeId: f.typeId,
        periodStart: "2026-10-01",
        periodEnd: "2026-10-31",
        externalUrl: "https://exemple.invalid/force",
      }),
    );

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("réservée au responsable de domaine");

    const [row] = await db
      .select({ externalUrl: activities.externalUrl })
      .from(activities)
      .where(eq(activities.id, f.activityId));
    expect(row?.externalUrl).toBeNull();
  });
});
