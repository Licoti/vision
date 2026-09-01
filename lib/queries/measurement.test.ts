/**
 * Les tests des lectures du **dispositif de mesure** : les outils posés sur un
 * produit, son plan de taggage, et le référentiel que le panneau propose.
 *
 * Ils tournent sur la branche Neon dédiée — `vitest.config.mts` remappe
 * `DATABASE_URL` sur `TEST_DATABASE_URL` — et écrivent réellement : une
 * jointure filtrée sur le domaine, deux index partiels et un tri par nom d'outil
 * ne se vérifient pas sur un faux.
 *
 * Deux domaines sont amorcés, comme dans `indicators.test.ts` : sans un second
 * domaine, aucun test d'étanchéité ne prouve quoi que ce soit.
 *
 * **Trois propriétés portent ce fichier**, et chacune tient à un index partiel
 * ou à un filtre de domaine :
 *
 *   — les lignes **retirées** ne se lisent plus, et libèrent la place qu'elles
 *     tenaient : « retirer puis redéclarer » est un chemin réel (règle 4) ;
 *   — un produit a **au plus un plan vivant**, ce qui rend `[0] ?? null` exact
 *     et non arbitraire ;
 *   — rien ne traverse la frontière du domaine, ni les outils, ni les plans.
 */

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { db } from "@/lib/db/client";
import { forDomain, superAdmin, type ScopedDb } from "@/lib/db/scoped";
import {
  domains,
  entities,
  productTrackings,
  products,
  taggingPlans,
  tools,
} from "@/lib/db/schema";

import {
  findProductTaggingPlan,
  listAnalyticsTools,
  listProductTrackings,
} from "./measurement";

/** Enfants d'abord, parents ensuite : `domains` refuse la suppression sinon. */
const teardownOrder = [
  productTrackings,
  taggingPlans,
  products,
  tools,
  entities,
];

type Fixture = {
  domainId: string;
  scope: ScopedDb;
  /** Le produit qui porte les outils et le plan. */
  fullId: string;
  /** Un produit sans rien : les deux lectures doivent être vides. */
  emptyId: string;
  /** Un second produit peuplé : son dispositif ne doit pas déborder. */
  otherId: string;
  /** L'outil « Zèle », premier écrit et dernier attendu à l'ordre alphabétique. */
  lastToolId: string;
  /** L'outil d'audit : il ne doit jamais être proposé au panneau. */
  auditToolId: string;
  /** L'outil analytics **archivé** : proposé nulle part, lisible partout. */
  archivedToolId: string;
  /** La ligne de dispositif **retirée**, identifiée nommément. */
  archivedTrackingId: string;
  /** Le plan **retiré** du produit complet : il ne doit pas se lire. */
  archivedPlanId: string;
};

const suffix = Math.random().toString(36).slice(2, 10);
let a: Fixture;
let b: Fixture;

/**
 * Trois produits, quatre outils, et les deux formes d'archivage.
 *
 * Les outils sont écrits **dans le désordre** par rapport à l'ordre
 * alphabétique attendu : c'est la requête qui doit trier, pas la suite des
 * insertions.
 *
 * Le suffixe de domaine est **en fin** de nom et non en tête, pour que l'ordre
 * alphabétique soit celui des outils et non celui des domaines.
 */
async function seedDomain(label: string): Promise<Fixture> {
  const domain = await superAdmin.createDomain({
    name: `__test__measurement__${label}__${suffix}`,
    competenceCenterName: `Centre ${label}`,
  });
  const scope = forDomain({ domainId: domain.id });

  const entity = await scope.insert(entities, { label: `Entité ${label}` });

  const product = async (name: string) =>
    scope.insert(products, { name: `${name} ${label}`, entityId: entity.id });

  const full = await product("Complet");
  const empty = await product("Vide");
  const other = await product("Voisin");

  const tool = async (name: string, kind: "analytics" | "audit") =>
    scope.insert(tools, { name: `${name} ${label}`, kind, baseUrl: null });

  /* Écrit en premier, attendu en dernier : sans `orderBy`, il ouvrirait la
     liste. */
  const zeal = await tool("Zèle", "analytics");
  const clarity = await tool("Clarity", "analytics");
  const ga4 = await tool("Analytics 4", "analytics");
  const audit = await tool("Ergonome", "audit");
  const retired = await tool("Retiré", "analytics");
  await scope.archive(tools, retired.id);

  /* Deux outils vivants sur le produit complet, écrits dans le désordre. */
  await scope.insert(productTrackings, {
    productId: full.id,
    toolId: zeal.id,
    status: "partial",
    scope: "Tunnel de souscription",
    propertyUrl: "https://exemple.test/zele",
    verifiedOn: "2026-03-04",
    note: null,
  });
  await scope.insert(productTrackings, {
    productId: full.id,
    toolId: ga4.id,
    status: "active",
    scope: "Site public",
    propertyUrl: null,
    verifiedOn: null,
    note: null,
  });

  /* La ligne **retirée** : elle ne doit plus se lire, et elle libère la place
     que l'unicité partielle lui donnait. */
  const archivedTracking = await scope.insert(productTrackings, {
    productId: full.id,
    toolId: clarity.id,
    status: "stopped",
    scope: null,
    propertyUrl: null,
    verifiedOn: null,
    note: null,
  });
  await scope.archive(productTrackings, archivedTracking.id);

  /* Le produit voisin porte le sien : il ne doit pas déborder. */
  await scope.insert(productTrackings, {
    productId: other.id,
    toolId: ga4.id,
    status: "planned",
    scope: null,
    propertyUrl: null,
    verifiedOn: null,
    note: null,
  });

  /* Un plan **retiré** puis un plan vivant sur le même produit : c'est ce que
     l'unicité *partielle* autorise, et ce qu'une unicité totale interdirait. */
  const archivedPlan = await scope.insert(taggingPlans, {
    productId: full.id,
    url: "https://exemple.test/plan-v1",
    status: "stale",
    updatedOn: "2024-01-15",
    note: null,
  });
  await scope.archive(taggingPlans, archivedPlan.id);

  await scope.insert(taggingPlans, {
    productId: full.id,
    url: "https://exemple.test/plan-v2",
    status: "current",
    updatedOn: "2026-06-01",
    note: "Repris après la refonte.",
  });

  await scope.insert(taggingPlans, {
    productId: other.id,
    url: "https://exemple.test/plan-voisin",
    status: "draft",
    updatedOn: "2026-08-20",
    note: null,
  });

  return {
    domainId: domain.id,
    scope,
    fullId: full.id,
    emptyId: empty.id,
    otherId: other.id,
    lastToolId: zeal.id,
    auditToolId: audit.id,
    archivedToolId: retired.id,
    archivedTrackingId: archivedTracking.id,
    archivedPlanId: archivedPlan.id,
  };
}

beforeAll(async () => {
  a = await seedDomain("a");
  b = await seedDomain("b");
}, 60_000);

afterAll(async () => {
  const ids = [a?.domainId, b?.domainId].filter(Boolean) as string[];
  if (ids.length === 0) return;
  for (const table of teardownOrder) {
    await db.delete(table).where(inArray(table.domainId, ids));
  }
  await db.delete(domains).where(inArray(domains.id, ids));
});

/* ==========================================================================
   Les outils posés sur un produit
   ========================================================================== */

describe("listProductTrackings", () => {
  test("rend les outils vivants, triés par nom d'outil", async () => {
    const rows = await listProductTrackings(a.scope, a.fullId);

    expect(rows.map((row) => row.toolName)).toEqual([
      "Analytics 4 a",
      "Zèle a",
    ]);
  });

  /* **La ligne retirée ne se lit plus.** C'est `archived_at` qui la range, et le
     filtre de la requête qui l'écarte — jamais une suppression (règle 4). */
  test("écarte la ligne retirée", async () => {
    const rows = await listProductTrackings(a.scope, a.fullId);

    expect(rows.map((row) => row.id)).not.toContain(a.archivedTrackingId);
  });

  test("rend chaque fait tel qu'il a été déclaré", async () => {
    const rows = await listProductTrackings(a.scope, a.fullId);
    const zeal = rows.find((row) => row.toolName === "Zèle a");

    expect(zeal).toMatchObject({
      status: "partial",
      scope: "Tunnel de souscription",
      propertyUrl: "https://exemple.test/zele",
      verifiedOn: "2026-03-04",
    });
  });

  /* Le nom vient de `tools`, jamais d'une copie : un domaine qui renomme son
     outil le renomme sur toutes les lignes d'un coup. */
  test("suit le nom du référentiel quand l'outil est renommé", async () => {
    await a.scope.update(tools, a.lastToolId, { name: "Zèle renommé a" });

    const rows = await listProductTrackings(a.scope, a.fullId);
    expect(rows.map((row) => row.toolName)).toContain("Zèle renommé a");

    await a.scope.update(tools, a.lastToolId, { name: "Zèle a" });
  });

  test("rend une liste vide sur un produit sans dispositif", async () => {
    expect(await listProductTrackings(a.scope, a.emptyId)).toEqual([]);
  });

  /* **L'étanchéité, éprouvée sur l'identifiant d'un autre domaine** : ce n'est
     pas « rien à lire », c'est « ce produit n'existe pas ici ». */
  test("ne rend rien pour un produit d'un autre domaine", async () => {
    expect(await listProductTrackings(a.scope, b.fullId)).toEqual([]);
  });

  test("ne fait pas déborder le dispositif du produit voisin", async () => {
    const rows = await listProductTrackings(a.scope, a.otherId);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe("planned");
  });

  /* Ce qu'on ne propose plus, on continue de l'afficher : un outil archivé
     garde ses lignes déclarées, `on delete restrict` garde l'outil. */
  test("continue de rendre une ligne dont l'outil a été archivé", async () => {
    await a.scope.archive(tools, a.lastToolId);

    const rows = await listProductTrackings(a.scope, a.fullId);
    expect(rows.map((row) => row.toolName)).toContain("Zèle a");

    await a.scope.restore(tools, a.lastToolId);
  });
});

/* ==========================================================================
   Le plan de taggage
   ========================================================================== */

describe("findProductTaggingPlan", () => {
  test("rend le plan vivant, et lui seul", async () => {
    const plan = await findProductTaggingPlan(a.scope, a.fullId);

    expect(plan).toMatchObject({
      url: "https://exemple.test/plan-v2",
      status: "current",
      updatedOn: "2026-06-01",
      note: "Repris après la refonte.",
    });
  });

  /* **Le plan retiré ne revient jamais**, et le vivant qui l'a remplacé prouve
     du même coup que l'unicité est *partielle* : une unicité totale aurait
     refusé la seconde insertion de la fixture. */
  test("écarte le plan retiré", async () => {
    const plan = await findProductTaggingPlan(a.scope, a.fullId);

    expect(plan?.id).not.toBe(a.archivedPlanId);
  });

  /* `null` est un état normal, pas un manque : l'écran le dit et propose de
     l'écrire (règle 5). */
  test("rend `null` sur un produit sans plan", async () => {
    expect(await findProductTaggingPlan(a.scope, a.emptyId)).toBeNull();
  });

  test("rend `null` pour un produit d'un autre domaine", async () => {
    expect(await findProductTaggingPlan(a.scope, b.fullId)).toBeNull();
  });

  test("ne rend pas le plan du produit voisin", async () => {
    const plan = await findProductTaggingPlan(a.scope, a.otherId);

    expect(plan?.status).toBe("draft");
  });

  /* **Aucun état n'est déduit d'une date.** Le plan de 2024 est déclaré
     « à jour » ; la lecture le rend tel quel, sans jamais le requalifier. C'est
     l'interdit d'interface, éprouvé au niveau de la requête. */
  test("ne requalifie jamais un plan ancien", async () => {
    const old = await a.scope.insert(taggingPlans, {
      productId: a.emptyId,
      url: "https://exemple.test/plan-ancien",
      status: "current",
      updatedOn: "2019-01-04",
      note: null,
    });

    const plan = await findProductTaggingPlan(a.scope, a.emptyId);
    expect(plan?.status).toBe("current");

    await a.scope.archive(taggingPlans, old.id);
  });
});

/* ==========================================================================
   Le référentiel que le panneau propose
   ========================================================================== */

describe("listAnalyticsTools", () => {
  test("ne propose que les outils de genre analytics", async () => {
    const rows = await listAnalyticsTools(a.scope);

    expect(rows.map((row) => row.id)).not.toContain(a.auditToolId);
  });

  test("écarte les outils archivés", async () => {
    const rows = await listAnalyticsTools(a.scope);

    expect(rows.map((row) => row.id)).not.toContain(a.archivedToolId);
  });

  test("trie par nom", async () => {
    const rows = await listAnalyticsTools(a.scope);

    expect(rows.map((row) => row.name)).toEqual([
      "Analytics 4 a",
      "Clarity a",
      "Zèle a",
    ]);
  });

  /* L'étanchéité du référentiel : les outils d'un domaine ne se proposent pas
     dans un autre. */
  test("ne propose aucun outil d'un autre domaine", async () => {
    const rows = await listAnalyticsTools(a.scope);

    expect(rows.every((row) => row.name.endsWith(" a"))).toBe(true);
  });
});

/* ==========================================================================
   Ce que les index partiels garantissent
   ========================================================================== */

describe("les unicités partielles", () => {
  /* **« Retirer puis redéclarer » est un chemin réel** — la leçon de T4bis.6.
     Une unicité totale aurait fait de la seconde déclaration une violation
     d'index, donc un 500 là où l'on attend un écran. */
  test("un outil retiré peut être redéclaré sur le même produit", async () => {
    const retiredRow = await a.scope.find(
      productTrackings,
      a.archivedTrackingId,
    );
    expect(retiredRow?.archivedAt).not.toBeNull();

    const again = await a.scope.insert(productTrackings, {
      productId: a.fullId,
      toolId: retiredRow!.toolId,
      status: "active",
      scope: null,
      propertyUrl: null,
      verifiedOn: null,
      note: null,
    });

    const rows = await listProductTrackings(a.scope, a.fullId);
    expect(rows.map((row) => row.id)).toContain(again.id);

    await a.scope.archive(productTrackings, again.id);
  });

  /* Le même outil deux fois **vivant** sur le même produit : la base refuse, et
     c'est elle qui garantit, pas le contrôle de l'action. */
  test("le même outil ne se déclare pas deux fois vivant", async () => {
    const rows = await listProductTrackings(a.scope, a.fullId);
    const existing = rows[0]!;

    await expect(
      a.scope.insert(productTrackings, {
        productId: a.fullId,
        toolId: existing.toolId,
        status: "active",
        scope: null,
        propertyUrl: null,
        verifiedOn: null,
        note: null,
      }),
    ).rejects.toThrow();
  });

  test("un second plan vivant est refusé par la base", async () => {
    await expect(
      a.scope.insert(taggingPlans, {
        productId: a.fullId,
        url: "https://exemple.test/plan-v3",
        status: "draft",
        updatedOn: "2026-09-01",
        note: null,
      }),
    ).rejects.toThrow();
  });

  test("le produit garde bien un seul plan après ces tentatives", async () => {
    const rows = await a.scope.list(taggingPlans, {
      where: eq(taggingPlans.productId, a.fullId),
    });

    expect(rows).toHaveLength(1);
  });
});
