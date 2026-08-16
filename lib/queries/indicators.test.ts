/**
 * Les tests de la lecture des indicateurs d'un produit.
 *
 * Ils tournent sur la branche Neon dédiée — `vitest.config.mts` remappe
 * `DATABASE_URL` sur `TEST_DATABASE_URL` — et écrivent réellement : un
 * `leftJoin` filtré sur le domaine, trois agrégats et un tri par libellé ne se
 * vérifient pas sur un faux.
 *
 * Deux domaines sont amorcés, comme dans `resources.test.ts` : sans un second
 * domaine, aucun test d'étanchéité ne prouve quoi que ce soit. Les écritures de
 * fixture passent par la couche scopée ; les constats passent par la fonction
 * sous test, qui est précisément ce que l'écran appelle.
 */

import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { db } from "@/lib/db/client";
import { forDomain, superAdmin, type ScopedDb } from "@/lib/db/scoped";
import {
  domains,
  entities,
  indicatorReadings,
  indicators,
  products,
} from "@/lib/db/schema";

import { listProductIndicators, type ProductIndicator } from "./indicators";

/** Enfants d'abord, parents ensuite : `domains` refuse la suppression sinon. */
const teardownOrder = [indicatorReadings, indicators, products, entities];

type Fixture = {
  domainId: string;
  scope: ScopedDb;
  /** Le produit qui porte les quatre formes d'indicateur. */
  fullId: string;
  /** Un produit sans aucun indicateur : la lecture doit être vide. */
  emptyId: string;
  /** Un second produit peuplé : ses indicateurs ne doivent pas déborder. */
  otherId: string;
  /** L'indicateur archivé, identifié nommément. */
  archivedIndicatorId: string;
  /** L'indicateur aux trois relevés du brief §7. */
  autonomyId: string;
  /** L'indicateur du produit voisin — la cible des relevés forgés. */
  otherIndicatorId: string;
};

const suffix = Math.random().toString(36).slice(2, 10);
let a: Fixture;
let b: Fixture;

/**
 * Trois produits et cinq indicateurs couvrant les quatre formes de la lecture,
 * plus le débordement.
 *
 * Les indicateurs sont écrits **dans le désordre** par rapport à l'ordre
 * alphabétique attendu : c'est la requête qui doit trier, pas la suite des
 * insertions. Les relevés le sont aussi, et par rapport à leur date : le dernier
 * relevé n'est pas le dernier écrit.
 *
 * Le préfixe `label` (` a` / ` b`) est **en fin** de libellé et non en tête,
 * pour que l'ordre alphabétique soit celui des noms et non celui des domaines.
 */
async function seedDomain(label: string): Promise<Fixture> {
  const domain = await superAdmin.createDomain({
    name: `__test__indicators__${label}__${suffix}`,
    competenceCenterName: `Centre ${label}`,
  });
  const scope = forDomain({ domainId: domain.id });

  const entity = await scope.insert(entities, { label: `Entité ${label}` });

  const product = async (name: string) =>
    scope.insert(products, { name: `${name} ${label}`, entityId: entity.id });

  const full = await product("Complet");
  const empty = await product("Vide");
  const other = await product("Voisin");

  const indicator = async (values: {
    productId: string;
    label: string;
    unit?: string | null;
    direction?: "higher_is_better" | "lower_is_better";
    source?: string | null;
  }) =>
    scope.insert(indicators, {
      productId: values.productId,
      label: `${values.label} ${label}`,
      unit: values.unit ?? null,
      direction: values.direction ?? "higher_is_better",
      source: values.source ?? null,
    });

  const reading = async (values: {
    indicatorId: string;
    value: string;
    readOn: string;
  }) => scope.insert(indicatorReadings, values);

  /* --- Écrits dans le désordre alphabétique ------------------------------ */

  /* Le dernier de l'ordre attendu, écrit en premier : sans `orderBy`, il
     ouvrirait la liste. Il ne porte **aucun relevé** — le cas du `leftJoin`. */
  await indicator({ productId: full.id, label: "Zèle" });

  const autonomy = await indicator({
    productId: full.id,
    label: "Autonomie",
    unit: "%",
    direction: "higher_is_better",
    source: "Portail analytics",
  });

  /* Les trois relevés du brief §7, écrits **du plus récent au plus ancien** :
     le dernier relevé ne doit rien devoir à l'ordre d'insertion. */
  await reading({ indicatorId: autonomy.id, value: "71", readOn: "2026-06-01" });
  await reading({ indicatorId: autonomy.id, value: "54", readOn: "2024-09-01" });
  await reading({ indicatorId: autonomy.id, value: "63", readOn: "2025-03-01" });

  /* Une série **décroissante** : son dernier relevé n'est pas sa plus grande
     valeur. C'est ce qui distingue l'agrégat ordonné d'un `max(value)`, que la
     série croissante du brief ne mettrait jamais en défaut. */
  const decline = await indicator({
    productId: full.id,
    label: "Baisse",
    unit: "s",
    direction: "lower_is_better",
  });
  await reading({ indicatorId: decline.id, value: "40", readOn: "2024-01-01" });
  await reading({ indicatorId: decline.id, value: "20", readOn: "2026-05-01" });

  /* Deux relevés **au même jour** : le départage par `id` doit rendre le même
     résultat d'un appel à l'autre. Libellé sans accent — l'ordre alphabétique
     d'un caractère accentué dépend de la collation de la base, et un test d'ordre
     ne se fait pas dépendre d'elle. */
  const tie = await indicator({
    productId: full.id,
    label: "Doublon",
    unit: "s",
  });
  await reading({ indicatorId: tie.id, value: "12", readOn: "2026-04-01" });
  await reading({ indicatorId: tie.id, value: "13", readOn: "2026-04-01" });

  /* --- Ce que la lecture doit écarter ------------------------------------ */

  /* Alphabétiquement **premier** de tous : sans le filtre d'archivage, il
     ouvrirait la liste au lieu d'en être absent. */
  const archived = await indicator({ productId: full.id, label: "Ancien" });
  await reading({ indicatorId: archived.id, value: "99", readOn: "2026-07-01" });
  await scope.archive(indicators, archived.id);

  const otherIndicator = await indicator({
    productId: other.id,
    label: "Indicateur du voisin",
    unit: "%",
  });

  return {
    domainId: domain.id,
    scope,
    fullId: full.id,
    emptyId: empty.id,
    otherId: other.id,
    archivedIndicatorId: archived.id,
    autonomyId: autonomy.id,
    otherIndicatorId: otherIndicator.id,
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

/** Les libellés retenus, dans l'ordre rendu. */
function labels(rows: ProductIndicator[]): string[] {
  return rows.map((row) => row.label);
}

/* ==========================================================================
   L'ordre — par libellé, la fiche du ticket
   ========================================================================== */

describe("listProductIndicators — l'ordre", () => {
  test("le tri est alphabétique, pas celui des insertions", async () => {
    const rows = await listProductIndicators(a.scope, a.fullId);

    // « Zèle » a été écrit en premier, « Autonomie » en second.
    expect(labels(rows)).toEqual([
      "Autonomie a",
      "Baisse a",
      "Doublon a",
      "Zèle a",
    ]);
  });
});

/* ==========================================================================
   Ce que la lecture porte
   ========================================================================== */

describe("listProductIndicators — les champs", () => {
  test("l'indicateur du brief rend ses cinq colonnes et son dernier relevé", async () => {
    const rows = await listProductIndicators(a.scope, a.fullId);
    const autonomy = rows.find((row) => row.label === "Autonomie a");

    expect(autonomy).toMatchObject({
      id: a.autonomyId,
      unit: "%",
      direction: "higher_is_better",
      source: "Portail analytics",
      readingCount: 3,
      lastReadOn: "2026-06-01",
    });
    // `numeric(18,4)` revient en chaîne du pilote : la lecture ne met pas en
    // forme, `formatResultValue` s'en charge à l'écran.
    expect(autonomy?.lastValue).toBe("71.0000");
  });

  test("le dernier relevé est le plus récent, pas le dernier écrit", async () => {
    // Les trois relevés sont insérés 71, 54, 63 : sans l'`order by` de
    // l'agrégat, la valeur rendue serait celle de l'ordre physique.
    const rows = await listProductIndicators(a.scope, a.fullId);
    const autonomy = rows.find((row) => row.label === "Autonomie a");

    expect(autonomy?.lastValue).toBe("71.0000");
    expect(autonomy?.lastReadOn).toBe("2026-06-01");
  });

  test("le dernier relevé n'est pas la plus grande valeur", async () => {
    /* Le test qui épingle l'agrégat ordonné, et lui seul : la série du brief
       est croissante, si bien qu'un `max(value)` y rendrait la bonne réponse par
       hasard. Sur une série décroissante, il rendrait 40 là où le dernier relevé
       vaut 20. */
    const rows = await listProductIndicators(a.scope, a.fullId);
    const decline = rows.find((row) => row.label === "Baisse a");

    expect(decline).toMatchObject({
      readingCount: 2,
      lastValue: "20.0000",
      lastReadOn: "2026-05-01",
    });
  });

  test("un indicateur **sans relevé** sort quand même, à zéro et sans date", async () => {
    /* Le `leftJoin` est là pour lui : une jointure interne le ferait
       disparaître de la lecture. Et la date reste nulle — `docs/03` §7 :
       « signalé comme tel plutôt que positionné arbitrairement à aujourd'hui ». */
    const rows = await listProductIndicators(a.scope, a.fullId);
    const zeal = rows.find((row) => row.label === "Zèle a");

    expect(zeal).toBeDefined();
    expect(zeal).toMatchObject({
      readingCount: 0,
      lastValue: null,
      lastReadOn: null,
    });
  });

  test("deux relevés du même jour se départagent de façon stable", async () => {
    /* `read_on` seule ne tranche pas : sans le `id desc` de l'agrégat, l'ordre
       physique déciderait, et il varie d'un plan d'exécution à l'autre. Ce que
       le test éprouve est la **stabilité**, la seule propriété qui se constate
       sans connaître l'identifiant tiré au sort. */
    const first = await listProductIndicators(a.scope, a.fullId);
    const second = await listProductIndicators(a.scope, a.fullId);

    const tieFirst = first.find((row) => row.label === "Doublon a");
    const tieSecond = second.find((row) => row.label === "Doublon a");

    expect(tieFirst?.readingCount).toBe(2);
    expect(tieFirst?.lastReadOn).toBe("2026-04-01");
    expect(tieFirst?.lastValue).toBe(tieSecond?.lastValue);
  });
});

/* ==========================================================================
   Ce que la lecture écarte
   ========================================================================== */

describe("listProductIndicators — le périmètre", () => {
  test("un indicateur archivé n'apparaît nulle part", async () => {
    const rows = await listProductIndicators(a.scope, a.fullId);

    // Il est alphabétiquement le premier de la fixture : sans le filtre, il
    // serait en tête de liste, pas au fond.
    expect(rows.map((row) => row.id)).not.toContain(a.archivedIndicatorId);
    expect(labels(rows)).not.toContain("Ancien a");
  });

  test("les indicateurs d'un autre produit du même domaine n'apparaissent pas", async () => {
    const rows = await listProductIndicators(a.scope, a.fullId);

    expect(labels(rows)).not.toContain("Indicateur du voisin a");
    expect(labels(await listProductIndicators(a.scope, a.otherId))).toEqual([
      "Indicateur du voisin a",
    ]);
  });

  test("un produit sans indicateur rend un tableau vide", async () => {
    expect(await listProductIndicators(a.scope, a.emptyId)).toEqual([]);
  });
});

/* ==========================================================================
   L'étanchéité
   ========================================================================== */

describe("listProductIndicators — étanchéité du domaine", () => {
  test("les indicateurs d'un produit d'un autre domaine ne se lisent pas", async () => {
    expect(await listProductIndicators(b.scope, a.fullId)).toEqual([]);
  });

  test("chaque domaine ne lit que ses propres indicateurs", async () => {
    const rows = await listProductIndicators(b.scope, b.fullId);

    expect(rows.length).toBeGreaterThan(0);
    expect(labels(rows).every((row) => row.endsWith(" b"))).toBe(true);
  });

  /* ------------------------------------------------------------------------
     Le filtre de jointure — éprouvé sur un relevé **forgé**.

     La leçon de `resources.test.ts`, transposée : la jointure porte sur une
     **clé primaire** (`indicator_readings.indicator_id = indicators.id`), et la
     couche d'accès refuse déjà d'écrire un relevé dont l'indicateur relève d'un
     autre domaine. Aucune ligne honnête ne peut donc faire mentir la jointure :
     sans donnée illégitime, `filter(indicatorReadings)` est **infalsifiable**.

     Le test ci-dessous écrit donc directement par `db`, hors de la couche
     scopée, exactement ce qu'`assertPreconditions` interdit — le seul
     contournement du projet, et il ne sert qu'à prouver que la lecture tient
     quand même.
     ---------------------------------------------------------------------- */

  test("un relevé d'un autre domaine ne compte ni ne fournit le dernier relevé", async () => {
    await db.insert(indicatorReadings).values({
      // La liaison interdite : un relevé du domaine `a` sur un indicateur `b`.
      domainId: a.domainId,
      indicatorId: b.otherIndicatorId,
      value: "999",
      // La plus récente de toutes : sans le filtre, elle serait *le* dernier
      // relevé de l'indicateur, et le décompte passerait de 0 à 1.
      readOn: "2030-01-01",
    });

    const rows = await listProductIndicators(b.scope, b.otherId);
    const neighbour = rows.find((row) => row.id === b.otherIndicatorId);

    expect(neighbour).toBeDefined();
    expect(neighbour).toMatchObject({
      readingCount: 0,
      lastValue: null,
      lastReadOn: null,
    });
  });
});
