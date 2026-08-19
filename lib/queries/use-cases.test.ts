/**
 * Les tests des lectures de use cases.
 *
 * Ils tournent sur la branche Neon dédiée — `vitest.config.mts` remappe
 * `DATABASE_URL` sur `TEST_DATABASE_URL` — et écrivent réellement : un ordre de
 * déclaration et l'étanchéité d'un domaine ne se vérifient pas sur un faux.
 *
 * Deux domaines sont amorcés, comme dans `personas.test.ts` : sans un second
 * domaine, aucun test d'étanchéité ne prouve quoi que ce soit.
 *
 * **Deux lignes sont forgées par le client brut**, et c'est délibéré : la couche
 * scopée les refuserait par `assertPreconditions`, or c'est précisément à cela
 * qu'une fuite ressemblerait. `listProductUseCases` ne joint rien — elle n'a
 * donc qu'**un seul** filtre par lecture, celui que `list` pose —, et chaque
 * ligne forgée ne franchit la frontière que sur `domain_id`, tout le reste
 * appartenant au domaine observé. C'est ce qui rend la mise en défaut
 * concluante : neutraliser l'un des deux filtres fait tomber un test, et lui
 * seul.
 *
 * **La ligne de liaison forgée est le cas qui compte le plus.** Sans elle, le
 * filtre de domaine de la seconde lecture ne serait éprouvé par rien : un use
 * case du bon domaine rattaché à un persona par une ligne d'un **autre**
 * domaine afficherait un profil que le bloc « Personae » de la page ne montre
 * pas. C'est la leçon de T5bis.3 — un filtre de domaine qu'aucune ligne forgée
 * ne vise n'est pas éprouvé.
 *
 * Les constats se lisent par identifiant et non par position — sauf le test
 * d'ordre, qui compare des rangs relatifs.
 */

import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { db } from "@/lib/db/client";
import { forDomain, superAdmin, type ScopedDb } from "@/lib/db/scoped";
import {
  domains,
  entities,
  personas,
  products,
  useCasePersonas,
  useCases,
} from "@/lib/db/schema";

import { listProductUseCases, personasOf } from "./use-cases";

/** Enfants d'abord, parents ensuite : `domains` refuse la suppression sinon. */
const teardownOrder = [
  useCasePersonas,
  useCases,
  personas,
  products,
  entities,
];

type Fixture = {
  domainId: string;
  scope: ScopedDb;
  productId: string;
  /** Un second produit du même domaine : le filtre par produit s'y lit. */
  otherProductId: string;
  /** Déclaré en premier, nommé en fin d'alphabet : l'ordre n'est pas le nom. */
  zeroId: string;
  /** Déclaré en second, nommé en début d'alphabet. */
  unId: string;
  /** Archivé : absent du bloc. */
  rangeId: string;
  /** Rattaché à l'autre produit : absent de la lecture du premier. */
  ailleursId: string;
  aliceId: string;
  brunoId: string;
  /** Vivante, du même produit, et **délibérément non rattachée** : c'est elle
   *  que la ligne de liaison forgée fait entrer. */
  caroleId: string;
};

const suffix = Math.random().toString(36).slice(2, 10);
let a: Fixture;
let b: Fixture;

async function seedDomain(label: string): Promise<Fixture> {
  const domain = await superAdmin.createDomain({
    name: `__test__usecases__${label}__${suffix}`,
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

  const alice = await scope.insert(personas, {
    productId: product.id,
    name: `Alice Agence ${label}`,
    role: "Réseau d'agences",
    kind: "secondary",
  });
  const bruno = await scope.insert(personas, {
    productId: product.id,
    name: `Bruno Back-office ${label}`,
    kind: "primary",
  });
  const carole = await scope.insert(personas, {
    productId: product.id,
    name: `Carole Conformité ${label}`,
    kind: "secondary",
  });

  /* Déclarés à rebours de l'alphabet : si la lecture triait par titre, le
     premier déclaré ne serait pas le premier rendu, et le test d'ordre le
     dirait. */
  const zero = await scope.insert(useCases, {
    productId: product.id,
    title: `Zéro — déclaré en premier ${label}`,
    summary: "Le scénario par lequel tout commence.",
  });
  const un = await scope.insert(useCases, {
    productId: product.id,
    title: `Alpha — déclaré en second ${label}`,
    summary: "Le scénario venu ensuite.",
  });
  const range = await scope.insert(useCases, {
    productId: product.id,
    title: `Rangé ${label}`,
    summary: "Il a quitté le bloc.",
  });
  await scope.archive(useCases, range.id);
  const ailleurs = await scope.insert(useCases, {
    productId: otherProduct.id,
    title: `Ailleurs ${label}`,
    summary: "Sur l'autre produit du même domaine.",
  });

  /* Deux rattachements sur le premier, aucun sur le second : les deux états
     que l'écran doit savoir rendre, le second étant valide depuis l'arbitrage
     du 19/08/2026. */
  await scope.insert(useCasePersonas, {
    useCaseId: zero.id,
    personaId: alice.id,
  });
  await scope.insert(useCasePersonas, {
    useCaseId: zero.id,
    personaId: bruno.id,
  });

  return {
    domainId: domain.id,
    scope,
    productId: product.id,
    otherProductId: otherProduct.id,
    zeroId: zero.id,
    unId: un.id,
    rangeId: range.id,
    ailleursId: ailleurs.id,
    aliceId: alice.id,
    brunoId: bruno.id,
    caroleId: carole.id,
  };
}

/**
 * Les deux lignes que la couche scopée refuserait d'écrire.
 *
 * Chacune ne franchit la frontière que sur `domain_id` : le produit visé, le use
 * case visé et le persona visé sont **tous** ceux du domaine `a`. Seul le filtre
 * de domaine les écarte, et c'est ce qui fait tomber exactement un test par
 * filtre neutralisé.
 *
 * **La liaison forgée vise Carole, et non Alice, parce que la base l'exige.**
 * La première écriture de ce fichier doublait le rattachement `(zéro, Alice)`
 * sous un autre domaine, pour éprouver qu'un persona n'y soit pas compté deux
 * fois. La base l'a refusée : `use_case_personas_use_case_persona_unique` porte
 * sur `(use_case_id, persona_id)` **sans** `domain_id`, si bien qu'un doublon
 * inter-domaines n'est **pas représentable**. C'est une propriété, pas un
 * obstacle — et elle rend le test suivant plus fort : ce qui fuirait n'est pas
 * un doublon, c'est un persona **de plus**, que le bloc « Personae » de la page
 * n'affiche pas et que la fiche du use case afficherait.
 */
async function forgeLeaks(): Promise<void> {
  await db.insert(useCases).values({
    domainId: b.domainId,
    productId: a.productId,
    title: `Fuite use case ${suffix}`,
    summary: "Une ligne d'un autre domaine, sur le produit observé.",
  });

  await db.insert(useCasePersonas).values({
    domainId: b.domainId,
    useCaseId: a.zeroId,
    personaId: a.caroleId,
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

describe("listProductUseCases", () => {
  test("rend les use cases vivants du produit demandé", async () => {
    const rows = await listProductUseCases(a.scope, a.productId);
    const ids = rows.map((row) => row.id);

    expect(ids).toContain(a.zeroId);
    expect(ids).toContain(a.unId);
    expect(rows).toHaveLength(2);
  });

  test("écarte un use case archivé", async () => {
    const rows = await listProductUseCases(a.scope, a.productId);
    expect(rows.map((row) => row.id)).not.toContain(a.rangeId);
  });

  test("écarte un use case d'un autre produit du même domaine", async () => {
    const rows = await listProductUseCases(a.scope, a.productId);
    expect(rows.map((row) => row.id)).not.toContain(a.ailleursId);
  });

  /* L'ordre est celui de la déclaration, et non l'alphabet : « Zéro » est
     déclaré en premier et rendu en premier, alors que « Alpha » le précède
     dans l'alphabet. Le test tomberait sur un `asc(title)`. */
  test("rend les use cases dans l'ordre où ils ont été déclarés", async () => {
    const rows = await listProductUseCases(a.scope, a.productId);
    expect(rankOf(rows, a.zeroId)).toBeLessThan(rankOf(rows, a.unId));
  });

  test("rend le titre et la description tels qu'ils ont été saisis", async () => {
    const rows = await listProductUseCases(a.scope, a.productId);
    const zero = rows.find((row) => row.id === a.zeroId);

    expect(zero?.title).toContain("Zéro — déclaré en premier");
    expect(zero?.summary).toBe("Le scénario par lequel tout commence.");
  });

  test("rend les identifiants des personae rattachés", async () => {
    const rows = await listProductUseCases(a.scope, a.productId);
    const zero = rows.find((row) => row.id === a.zeroId);

    expect(zero?.personaIds).toHaveLength(2);
    expect(zero?.personaIds).toContain(a.aliceId);
    expect(zero?.personaIds).toContain(a.brunoId);
  });

  /* Un état valide, pas un manque : le rattachement est facultatif depuis
     l'arbitrage du 19/08/2026. */
  test("un use case sans rattachement rend une liste vide", async () => {
    const rows = await listProductUseCases(a.scope, a.productId);
    expect(rows.find((row) => row.id === a.unId)?.personaIds).toEqual([]);
  });

  test("un produit sans use case rend un tableau vide", async () => {
    /* L'état vide appartient à l'écran (règle 5) : la lecture ne s'en émeut
       pas, et surtout elle ne pose **aucune seconde requête** — `inArray` sur
       une liste vide n'a pas lieu d'être. */
    expect(await listProductUseCases(a.scope, b.productId)).toEqual([]);
  });

  /* ------------------------------------------------------------------------
     Les deux étanchéités
     ------------------------------------------------------------------------ */

  test("n'atteint pas le use case d'un autre domaine posé sur ce produit", async () => {
    const rows = await listProductUseCases(a.scope, a.productId);
    expect(rows.map((row) => row.title)).not.toContain(
      `Fuite use case ${suffix}`,
    );
  });

  /* Le rattachement forgé pointe un use case et un persona **du domaine
     observé** : seul le `domain_id` de la ligne de liaison diffère. Sans le
     filtre de la seconde lecture, Carole — qui n'est rattachée à rien —
     apparaîtrait sur « Zéro ». C'est le seul test qui éprouve ce filtre-là, et
     sans lui le retirer ne ferait tomber aucun test (la leçon de T5bis.3). */
  test("n'atteint pas un rattachement d'un autre domaine entre deux lignes du sien", async () => {
    const rows = await listProductUseCases(a.scope, a.productId);
    const zero = rows.find((row) => row.id === a.zeroId);

    expect(zero?.personaIds).not.toContain(a.caroleId);
    expect(zero?.personaIds).toHaveLength(2);
  });

  /* Le miroir du test précédent, vu de l'autre côté. **Il n'affirme pas que la
     liste est vide**, et c'est le piège que la première écriture de ce fichier
     a rencontré : la ligne forgée appartient au domaine `b` et vit sur le
     produit de `a`, si bien que `b` la voit — c'est exactement ce que forger
     voulait dire. Ce qu'il faut lire est que `b` ne voit **aucun des use cases
     de `a`**, ce que la ligne forgée ne peut pas masquer. */
  test("un domaine ne voit aucun use case de l'autre, même sur son produit", async () => {
    const ids = (await listProductUseCases(b.scope, a.productId)).map(
      (row) => row.id,
    );

    expect(ids).not.toContain(a.zeroId);
    expect(ids).not.toContain(a.unId);
    expect(ids).not.toContain(a.rangeId);
  });
});

/* ==========================================================================
   Le rapprochement
   ========================================================================== */

describe("personasOf", () => {
  test("rend les personae rattachés, dans l'ordre de la liste reçue", async () => {
    const rows = await listProductUseCases(a.scope, a.productId);
    const zero = rows.find((row) => row.id === a.zeroId);

    /* L'ordre est celui de la liste passée — celui de `listProductPersonas`,
       les principaux d'abord —, jamais celui où les cases ont été cochées. */
    const ordered = [{ id: a.brunoId }, { id: a.aliceId }];
    expect(personasOf(zero!, ordered).map((p) => p.id)).toEqual([
      a.brunoId,
      a.aliceId,
    ]);
  });

  /* La conséquence directe du choix de ne pas relire les noms : un persona
     archivé quitte `listProductPersonas`, donc il quitte le use case, sans
     qu'une ligne de liaison ne bouge (règle 4). */
  test("un persona absent de la liste reçue disparaît du use case", async () => {
    const rows = await listProductUseCases(a.scope, a.productId);
    const zero = rows.find((row) => row.id === a.zeroId);

    expect(personasOf(zero!, [{ id: a.brunoId }])).toEqual([
      { id: a.brunoId },
    ]);
  });

  test("un use case sans rattachement ne rend aucun persona", async () => {
    expect(personasOf({ personaIds: [] }, [{ id: a.aliceId }])).toEqual([]);
  });
});
