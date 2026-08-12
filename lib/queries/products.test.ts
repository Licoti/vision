/**
 * Les tests des lectures de la page produit.
 *
 * Ils tournent sur la branche Neon dédiée — `vitest.config.mts` remappe
 * `DATABASE_URL` sur `TEST_DATABASE_URL` — et écrivent réellement : un tri
 * `nulls last` et une jointure filtrée ne se vérifient pas sur un faux.
 *
 * Deux domaines sont amorcés, comme dans `lib/db/scoped.test.ts` : sans un
 * second domaine, aucun test d'étanchéité ne prouve quoi que ce soit. Les
 * écritures de fixture passent par la couche scopée ; les constats passent par
 * les fonctions sous test, qui sont précisément ce que l'écran appelle.
 */

import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { db } from "@/lib/db/client";
import { forDomain, superAdmin, type ScopedDb } from "@/lib/db/scoped";
import {
  domains,
  entities,
  persons,
  products,
  projectMembers,
  projectStatuses,
  projects,
} from "@/lib/db/schema";

import { findProductDetail, listProductProjects } from "./products";

/** Enfants d'abord, parents ensuite : `domains` refuse la suppression sinon. */
const teardownOrder = [
  projectMembers,
  projects,
  products,
  persons,
  projectStatuses,
  entities,
];

type Fixture = {
  domainId: string;
  scope: ScopedDb;
  productId: string;
  /** Un second produit du même domaine : il ne doit jamais déborder. */
  otherProductId: string;
  recentProjectId: string;
  oldProjectId: string;
};

const suffix = Math.random().toString(36).slice(2, 10);
let a: Fixture;
let b: Fixture;

/**
 * Un domaine avec un produit portant trois accompagnements — un ancien, un
 * récent, un sans date de début — plus un archivé, et un second produit.
 */
async function seedDomain(label: string): Promise<Fixture> {
  const domain = await superAdmin.createDomain({
    name: `__test__queries__${label}__${suffix}`,
    competenceCenterName: `Centre ${label}`,
  });
  const scope = forDomain({ domainId: domain.id });

  const entity = await scope.insert(entities, { label: `Entité ${label}` });
  const active = await scope.insert(projectStatuses, {
    label: "En cours",
    nature: "active",
  });
  const done = await scope.insert(projectStatuses, {
    label: "Terminé",
    nature: "done",
  });

  const product = await scope.insert(products, {
    name: `Produit ${label}`,
    entityId: entity.id,
    description: `Description ${label}`,
  });
  const otherProduct = await scope.insert(products, {
    name: `Autre produit ${label}`,
    entityId: entity.id,
  });

  const old = await scope.insert(projects, {
    name: `Ancien ${label}`,
    productId: product.id,
    statusId: done.id,
    startedOn: "2024-03-01",
    expectedEndOn: "2024-09-30",
  });
  const recent = await scope.insert(projects, {
    name: `Récent ${label}`,
    productId: product.id,
    statusId: active.id,
    startedOn: "2026-02-01",
  });
  await scope.insert(projects, {
    name: `Sans date ${label}`,
    productId: product.id,
    statusId: active.id,
  });
  const archived = await scope.insert(projects, {
    name: `Archivé ${label}`,
    productId: product.id,
    statusId: active.id,
    startedOn: "2027-01-01",
  });
  await scope.archive(projects, archived.id);

  // Un projet du second produit : il ne doit apparaître sur aucune liste du
  // premier, pas plus que son équipe.
  const elsewhere = await scope.insert(projects, {
    name: `Ailleurs ${label}`,
    productId: otherProduct.id,
    statusId: active.id,
    startedOn: "2026-06-01",
  });

  const alice = await scope.insert(persons, {
    fullName: `Alice ${label}`,
    source: "manual",
    kind: "center",
  });
  const zoe = await scope.insert(persons, {
    fullName: `Zoé ${label}`,
    source: "manual",
    kind: "stakeholder",
  });
  const intruder = await scope.insert(persons, {
    fullName: `Intrus ${label}`,
    source: "manual",
    kind: "center",
  });

  // Zoé est saisie en premier et n'est pas contributrice : le tri par nom et
  // l'absence de distinction des droits (D9) sont tous deux observables.
  await scope.insert(projectMembers, {
    projectId: recent.id,
    personId: zoe.id,
    isContributor: false,
  });
  await scope.insert(projectMembers, {
    projectId: recent.id,
    personId: alice.id,
    isContributor: true,
  });
  await scope.insert(projectMembers, {
    projectId: elsewhere.id,
    personId: intruder.id,
    isContributor: true,
  });

  return {
    domainId: domain.id,
    scope,
    productId: product.id,
    otherProductId: otherProduct.id,
    recentProjectId: recent.id,
    oldProjectId: old.id,
  };
}

beforeAll(async () => {
  a = await seedDomain("a");
  b = await seedDomain("b");
}, 120_000);

afterAll(async () => {
  const ids = [a?.domainId, b?.domainId].filter(Boolean) as string[];
  if (ids.length === 0) return;
  for (const table of teardownOrder) {
    await db.delete(table).where(inArray(table.domainId, ids));
  }
  await db.delete(domains).where(inArray(domains.id, ids));
});

/* ==========================================================================
   L'en-tête du produit
   ========================================================================== */

describe("findProductDetail", () => {
  test("rend le produit avec le libellé de son entité", async () => {
    const detail = await findProductDetail(a.scope, a.productId);
    expect(detail?.name).toBe("Produit a");
    expect(detail?.entityLabel).toBe("Entité a");
    expect(detail?.description).toBe("Description a");
  });

  test("ne trouve pas le produit d'un autre domaine", async () => {
    expect(await findProductDetail(a.scope, b.productId)).toBeUndefined();
  });
});

/* ==========================================================================
   Les accompagnements
   ========================================================================== */

describe("listProductProjects", () => {
  test("les accompagnements sortent du plus récent au plus ancien", async () => {
    const rows = await listProductProjects(a.scope, a.productId);

    // Le projet sans date de début ferme la marche : `nulls last`.
    expect(rows.map((row) => row.name)).toEqual([
      "Récent a",
      "Ancien a",
      "Sans date a",
    ]);
  });

  test("un projet archivé n'apparaît pas", async () => {
    const rows = await listProductProjects(a.scope, a.productId);
    expect(rows.map((row) => row.name)).not.toContain("Archivé a");
  });

  test("chaque ligne porte son statut, sa nature et sa période", async () => {
    // Recherche par identifiant, et non par position : ce test ne doit rien
    // dire du tri, sans quoi une régression d'ordre en ferait tomber deux.
    const rows = await listProductProjects(a.scope, a.productId);
    const recent = rows.find((row) => row.id === a.recentProjectId);
    const old = rows.find((row) => row.id === a.oldProjectId);

    expect(recent?.statusLabel).toBe("En cours");
    expect(recent?.statusNature).toBe("active");
    expect(recent?.startedOn).toBe("2026-02-01");
    expect(recent?.expectedEndOn).toBeNull();

    expect(old?.statusNature).toBe("done");
    expect(old?.expectedEndOn).toBe("2024-09-30");
  });

  test("l'équipe rendue est celle du projet, triée par nom", async () => {
    const rows = await listProductProjects(a.scope, a.productId);
    const recent = rows.find((row) => row.id === a.recentProjectId);
    const old = rows.find((row) => row.id === a.oldProjectId);

    // Triée par nom, et non par ordre de saisie : Zoé a été insérée d'abord.
    expect(recent?.team.map((member) => member.fullName)).toEqual([
      "Alice a",
      "Zoé a",
    ]);
    // Le membre du projet de l'autre produit ne déborde pas.
    expect(recent?.team.map((member) => member.fullName)).not.toContain(
      "Intrus a",
    );
    // Un projet sans membre est un projet normal, pas une erreur.
    expect(old?.team).toEqual([]);
  });

  test("un produit d'un autre domaine ne rend aucun accompagnement", async () => {
    expect(await listProductProjects(a.scope, b.productId)).toEqual([]);
  });

  test("l'équipe d'un autre domaine ne fuit jamais", async () => {
    const mine = await listProductProjects(a.scope, a.productId);
    const theirs = await listProductProjects(b.scope, b.productId);

    const names = mine.flatMap((row) =>
      row.team.map((member) => member.fullName),
    );
    expect(names.every((name) => name.endsWith(" a"))).toBe(true);
    expect(theirs.flatMap((row) => row.team.map((m) => m.fullName))).toContain(
      "Alice b",
    );
  });
});
