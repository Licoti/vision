/**
 * Les tests des lectures de personae.
 *
 * Ils tournent sur la branche Neon dédiée — `vitest.config.mts` remappe
 * `DATABASE_URL` sur `TEST_DATABASE_URL` — et écrivent réellement : un tri par
 * rang puis par nom et l'étanchéité d'un domaine ne se vérifient pas sur un
 * faux.
 *
 * Deux domaines sont amorcés, comme dans `lib/db/scoped.test.ts` : sans un
 * second domaine, aucun test d'étanchéité ne prouve quoi que ce soit.
 *
 * **Deux lignes sont forgées par le client brut**, et c'est délibéré : la couche
 * scopée les refuserait par `assertPreconditions`, or c'est précisément à cela
 * qu'une fuite ressemblerait. Ces deux lectures ne joignent rien — elles n'ont
 * donc qu'**un seul** filtre chacune, celui que `list` pose —, et chaque ligne
 * forgée ne franchit la frontière que sur `domain_id`, tout le reste appartenant
 * au domaine observé. C'est ce qui rend la mise en défaut concluante : neutraliser
 * le filtre de domaine fait tomber ces deux tests, et eux seuls.
 *
 * Les constats se lisent par identifiant et non par position — sauf les tests de
 * tri, qui comparent des rangs relatifs. Un défaut d'ordre ne doit pas faire
 * tomber les autres.
 */

import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { db } from "@/lib/db/client";
import { forDomain, superAdmin, type ScopedDb } from "@/lib/db/scoped";
import {
  domains,
  entities,
  personaTraits,
  personas,
  products,
} from "@/lib/db/schema";

import { listPersonaTraits, listProductPersonas } from "./personas";

/** Enfants d'abord, parents ensuite : `domains` refuse la suppression sinon. */
const teardownOrder = [personaTraits, personas, products, entities];

type Fixture = {
  domainId: string;
  scope: ScopedDb;
  productId: string;
  /** Un second produit du même domaine : le filtre par produit s'y lit. */
  otherProductId: string;
  /** Principal, nommé en fin d'alphabet : le rang doit primer sur le nom. */
  zoeId: string;
  /** Secondaire, nommé en début d'alphabet. */
  aliceId: string;
  /** Secondaire aussi : le nom départage entre eux. */
  brunoId: string;
  /** Archivé : absent du bloc. */
  yvesId: string;
  /** Rattaché à l'autre produit : absent de la lecture du premier. */
  otherId: string;
};

const suffix = Math.random().toString(36).slice(2, 10);
let a: Fixture;
let b: Fixture;

async function seedDomain(label: string): Promise<Fixture> {
  const domain = await superAdmin.createDomain({
    name: `__test__personas__${label}__${suffix}`,
    competenceCenterName: `Centre ${label}`,
  });
  const scope = forDomain({ domainId: domain.id });

  const entity = await scope.insert(entities, { label: `Entité ${label}` });
  const product = await scope.insert(products, {
    name: `Espace client ${label}`,
    entityId: entity.id,
  });
  const otherProduct = await scope.insert(products, {
    name: `Extranet ${label}`,
    entityId: entity.id,
  });

  /* Saisis dans le désordre du rendu attendu : ni l'ordre d'insertion ni
     l'alphabet ne doivent suffire à produire le tri observé. */
  const alice = await scope.insert(personas, {
    productId: product.id,
    name: `Alice Agence ${label}`,
    role: "Réseau d'agences",
    kind: "secondary",
  });
  const zoe = await scope.insert(personas, {
    productId: product.id,
    name: `Zoé Direction ${label}`,
    summary: "Elle arbitre, elle ne saisit pas.",
    imageUrl: "https://exemple.fr/zoe.png",
    kind: "primary",
  });
  const bruno = await scope.insert(personas, {
    productId: product.id,
    name: `Bruno Back-office ${label}`,
    kind: "secondary",
  });
  const yves = await scope.insert(personas, {
    productId: product.id,
    name: `Yves Ancien ${label}`,
    kind: "primary",
  });
  await scope.archive(personas, yves.id);
  const other = await scope.insert(personas, {
    productId: otherProduct.id,
    name: `Olivier Ailleurs ${label}`,
    kind: "primary",
  });

  /* Deux familles, saisies à rebours de l'ordre de rendu : les irritants avant
     les objectifs, et la position 1 avant la position 0. */
  await scope.insert(personaTraits, {
    personaId: zoe.id,
    kind: "pain",
    label: `Irritant ${label}`,
    position: 0,
  });
  await scope.insert(personaTraits, {
    personaId: zoe.id,
    kind: "goal",
    label: `Objectif second ${label}`,
    position: 1,
  });
  await scope.insert(personaTraits, {
    personaId: zoe.id,
    kind: "goal",
    label: `Objectif premier ${label}`,
    position: 0,
  });
  await scope.insert(personaTraits, {
    personaId: zoe.id,
    kind: "expectation",
    label: `Attente ${label}`,
    position: 0,
  });

  return {
    domainId: domain.id,
    scope,
    productId: product.id,
    otherProductId: otherProduct.id,
    zoeId: zoe.id,
    aliceId: alice.id,
    brunoId: bruno.id,
    yvesId: yves.id,
    otherId: other.id,
  };
}

/**
 * Les deux lignes que la couche scopée refuserait d'écrire.
 *
 * Chacune ne franchit la frontière que sur `domain_id` : le produit visé et le
 * persona visé sont ceux du domaine `a`. Seul le filtre de domaine les écarte,
 * et c'est ce qui fait tomber exactement un test par filtre neutralisé.
 */
async function forgeLeaks(): Promise<void> {
  await db.insert(personas).values({
    domainId: b.domainId,
    productId: a.productId,
    name: `Fuite persona ${suffix}`,
    kind: "primary",
  });

  await db.insert(personaTraits).values({
    domainId: b.domainId,
    personaId: a.zoeId,
    kind: "goal",
    label: `Fuite trait ${suffix}`,
    position: 9,
  });
}

beforeAll(async () => {
  a = await seedDomain("a");
  b = await seedDomain("b");
  await forgeLeaks();
}, 120_000);

afterAll(async () => {
  const ids = [a?.domainId, b?.domainId].filter(Boolean) as string[];
  if (ids.length === 0) return;
  for (const table of teardownOrder) {
    await db.delete(table).where(inArray(table.domainId, ids));
  }
  await db.delete(domains).where(inArray(domains.id, ids));
});

/** Le rang d'une ligne dans la liste rendue. */
function rankOf(rows: { id: string }[], id: string): number {
  return rows.findIndex((row) => row.id === id);
}

/* ==========================================================================
   La liste du bloc
   ========================================================================== */

describe("listProductPersonas", () => {
  test("les principaux d'abord, puis par nom", async () => {
    const rows = await listProductPersonas(a.scope, a.productId);

    // Des rangs relatifs, et non des positions absolues : ce test ne dit rien
    // du contenu de la liste, seulement de son ordre.
    expect(rankOf(rows, a.zoeId)).toBeLessThan(rankOf(rows, a.aliceId));
    expect(rankOf(rows, a.aliceId)).toBeLessThan(rankOf(rows, a.brunoId));
  });

  test("rend ce que la ligne porte, sans rien calculer", async () => {
    const rows = await listProductPersonas(a.scope, a.productId);
    const zoe = rows.find((row) => row.id === a.zoeId);

    expect(zoe).toEqual({
      id: a.zoeId,
      name: `Zoé Direction a`,
      role: null,
      summary: "Elle arbitre, elle ne saisit pas.",
      imageUrl: "https://exemple.fr/zoe.png",
      kind: "primary",
    });
  });

  test("un persona archivé n'est plus dans le bloc", async () => {
    const rows = await listProductPersonas(a.scope, a.productId);

    expect(rows.map((row) => row.id)).not.toContain(a.yvesId);
    expect(rows.map((row) => row.id)).toContain(a.zoeId);
  });

  test("un persona d'un autre produit du même domaine reste chez lui", async () => {
    const rows = await listProductPersonas(a.scope, a.productId);
    expect(rows.map((row) => row.id)).not.toContain(a.otherId);

    const others = await listProductPersonas(a.scope, a.otherProductId);
    expect(others.map((row) => row.id)).toEqual([a.otherId]);
  });

  test("un persona forgé sur le produit depuis un autre domaine ne sort pas", async () => {
    const rows = await listProductPersonas(a.scope, a.productId);

    expect(rows.map((row) => row.name)).not.toContain(`Fuite persona ${suffix}`);
  });

  test("un produit sans persona rend un tableau vide, jamais une erreur", async () => {
    const empty = await listProductPersonas(b.scope, b.otherProductId);
    expect(empty.map((row) => row.id)).toEqual([b.otherId]);

    const none = await listProductPersonas(a.scope, b.productId);
    expect(none).toEqual([]);
  });
});

/* ==========================================================================
   Les traits d'un persona
   ========================================================================== */

describe("listPersonaTraits", () => {
  test("par famille — objectifs, irritants, attentes — puis par position", async () => {
    const rows = await listPersonaTraits(a.scope, a.zoeId);

    expect(rows.map((row) => [row.kind, row.position])).toEqual([
      ["goal", 0],
      ["goal", 1],
      ["pain", 0],
      ["expectation", 0],
    ]);
    expect(rows[0]?.label).toBe("Objectif premier a");
  });

  test("un trait forgé depuis un autre domaine ne sort pas", async () => {
    const rows = await listPersonaTraits(a.scope, a.zoeId);

    expect(rows.map((row) => row.label)).not.toContain(`Fuite trait ${suffix}`);
  });

  test("un persona sans trait rend un tableau vide — trois listes vides sont un état normal", async () => {
    expect(await listPersonaTraits(a.scope, a.aliceId)).toEqual([]);
  });

  test("les traits d'un persona d'un autre domaine ne se lisent pas", async () => {
    expect(await listPersonaTraits(a.scope, b.zoeId)).toEqual([]);
  });
});
