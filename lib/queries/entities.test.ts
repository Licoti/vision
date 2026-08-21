/**
 * Les tests des lectures de l'écran Administration.
 *
 * Ils tournent sur la branche Neon dédiée — `vitest.config.mts` remappe
 * `DATABASE_URL` sur `TEST_DATABASE_URL` — et écrivent réellement : deux
 * agrégats conditionnels sur une même jointure et un référentiel qui montre ses
 * lignes archivées ne se vérifient pas sur un faux.
 *
 * **Deux domaines sont amorcés**, comme partout dans ce dossier : sans un
 * second domaine, aucun test d'étanchéité ne prouve quoi que ce soit — et la
 * jointure de `listEntitiesForAdmin` porte deux `filter()`, dont un seul se
 * met en défaut sur une ligne forgée d'un autre domaine.
 */

import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { db } from "@/lib/db/client";
import { forDomain, superAdmin, type ScopedDb } from "@/lib/db/scoped";
import { domains, entities, products } from "@/lib/db/schema";

import { listEntitiesForAdmin, listEntityLabels } from "./entities";

/** Enfants d'abord, parents ensuite : `entities` refuse la suppression sinon. */
const teardownOrder = [products, entities];

type Fixture = {
  domainId: string;
  scope: ScopedDb;
  /** Deux produits vivants et un archivé. */
  loadedId: string;
  /** Un seul produit, archivé : archivable, mais pas supprimable. */
  archivedOnlyId: string;
  /** Aucun produit : archivable et supprimable. */
  freeId: string;
  /** Archivée dans la fixture : elle doit rester listée. */
  archivedId: string;
};

const suffix = Math.random().toString(36).slice(2, 10);
let a: Fixture;
let b: Fixture;

async function seedDomain(label: string): Promise<Fixture> {
  const domain = await superAdmin.createDomain({
    name: `__test__entities__${label}__${suffix}`,
    competenceCenterName: `Centre ${label}`,
  });
  const scope = forDomain({ domainId: domain.id });

  /* Les libellés sont préfixés par une lettre choisie : le tri alphabétique se
     lit alors sur la liste rendue, sans dépendre du nom du domaine. */
  const loaded = await scope.insert(entities, { label: `A chargée ${label}` });
  const archivedOnly = await scope.insert(entities, {
    label: `B rangée ${label}`,
  });
  const free = await scope.insert(entities, { label: `C libre ${label}` });
  const archived = await scope.insert(entities, {
    label: `D archivée ${label}`,
  });
  await scope.archive(entities, archived.id);

  await scope.insert(products, {
    name: `Produit vivant 1 ${label}`,
    entityId: loaded.id,
  });
  await scope.insert(products, {
    name: `Produit vivant 2 ${label}`,
    entityId: loaded.id,
  });
  const rangedOnLoaded = await scope.insert(products, {
    name: `Produit rangé ${label}`,
    entityId: loaded.id,
  });
  await scope.archive(products, rangedOnLoaded.id);

  const onlyRanged = await scope.insert(products, {
    name: `Seul produit rangé ${label}`,
    entityId: archivedOnly.id,
  });
  await scope.archive(products, onlyRanged.id);

  return {
    domainId: domain.id,
    scope,
    loadedId: loaded.id,
    archivedOnlyId: archivedOnly.id,
    freeId: free.id,
    archivedId: archived.id,
  };
}

beforeAll(async () => {
  a = await seedDomain("a");
  b = await seedDomain("b");
});

afterAll(async () => {
  const ids = [a?.domainId, b?.domainId].filter(Boolean) as string[];
  if (ids.length === 0) return;
  for (const table of teardownOrder) {
    await db.delete(table).where(inArray(table.domainId, ids));
  }
  await db.delete(domains).where(inArray(domains.id, ids));
});

describe("listEntitiesForAdmin", () => {
  test("rend les quatre entités du domaine, archivée comprise", async () => {
    const rows = await listEntitiesForAdmin(a.scope);

    expect(rows.map((row) => row.id)).toEqual([
      a.loadedId,
      a.archivedOnlyId,
      a.freeId,
      a.archivedId,
    ]);
  });

  test("l'archivage se lit sur la ligne, il ne l'écarte pas", async () => {
    const rows = await listEntitiesForAdmin(a.scope);
    const archived = rows.find((row) => row.id === a.archivedId);
    const free = rows.find((row) => row.id === a.freeId);

    expect(archived?.archivedAt).toBeInstanceOf(Date);
    expect(free?.archivedAt).toBeNull();
  });

  test("le décompte vivant écarte les produits archivés", async () => {
    const rows = await listEntitiesForAdmin(a.scope);
    const loaded = rows.find((row) => row.id === a.loadedId);

    expect(loaded?.liveProductCount).toBe(2);
  });

  test("le décompte total les compte", async () => {
    const rows = await listEntitiesForAdmin(a.scope);
    const loaded = rows.find((row) => row.id === a.loadedId);

    expect(loaded?.totalProductCount).toBe(3);
  });

  test("les deux décomptes se séparent : rien de vivant, un produit rangé", async () => {
    /* C'est la ligne qui distingue les deux règles : archivable — aucun produit
       vivant ne s'y oppose — mais pas supprimable, la clé étrangère retenant
       encore le produit archivé. */
    const rows = await listEntitiesForAdmin(a.scope);
    const ranged = rows.find((row) => row.id === a.archivedOnlyId);

    expect(ranged?.liveProductCount).toBe(0);
    expect(ranged?.totalProductCount).toBe(1);
  });

  test("une entité sans produit compte zéro des deux côtés", async () => {
    const rows = await listEntitiesForAdmin(a.scope);
    const free = rows.find((row) => row.id === a.freeId);

    expect(free?.liveProductCount).toBe(0);
    expect(free?.totalProductCount).toBe(0);
  });

  test("aucune entité de l'autre domaine ne paraît", async () => {
    const rows = await listEntitiesForAdmin(a.scope);
    const foreign = [b.loadedId, b.archivedOnlyId, b.freeId, b.archivedId];

    expect(rows.some((row) => foreign.includes(row.id))).toBe(false);
  });

  test("un produit forgé dans l'autre domaine n'entre dans aucun décompte", async () => {
    /* La jointure porte deux `filter()`. Celui d'`entities` écarte déjà les
       lignes voisines ; seul un produit **de l'autre domaine rattaché à une
       entité de celui-ci** met en défaut celui de `products` — et la couche
       scopée refusant précisément cette écriture, elle se force ici en direct.
       C'est la leçon de T5bis.2 : une jointure scopée ne se met en défaut que
       sur une ligne forgée, et forgée sur une seule colonne. */
    const [forged] = await db
      .insert(products)
      .values({
        domainId: b.domainId,
        name: `Produit forgé ${suffix}`,
        entityId: a.freeId,
      })
      .returning({ id: products.id });

    try {
      const rows = await listEntitiesForAdmin(a.scope);
      const free = rows.find((row) => row.id === a.freeId);

      expect(free?.liveProductCount).toBe(0);
      expect(free?.totalProductCount).toBe(0);
    } finally {
      if (forged) {
        await db.delete(products).where(inArray(products.id, [forged.id]));
      }
    }
  });
});

describe("listEntityLabels", () => {
  test("rend les libellés du domaine, archivés compris", async () => {
    const rows = await listEntityLabels(a.scope);

    expect(rows.map((row) => row.id).sort()).toEqual(
      [a.loadedId, a.archivedOnlyId, a.freeId, a.archivedId].sort(),
    );
  });

  test("`exceptId` écarte la ligne qu'on corrige", async () => {
    const rows = await listEntityLabels(a.scope, { exceptId: a.freeId });

    expect(rows.some((row) => row.id === a.freeId)).toBe(false);
    expect(rows).toHaveLength(3);
  });

  test("aucun libellé de l'autre domaine ne paraît", async () => {
    const rows = await listEntityLabels(a.scope);
    const foreign = [b.loadedId, b.freeId];

    expect(rows.some((row) => foreign.includes(row.id))).toBe(false);
  });
});
