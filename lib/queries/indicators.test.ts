/**
 * Les tests des lectures d'indicateurs : les indicateurs d'un produit avec leur
 * dernier relevé (T5.1), leur série datée (T5.3), l'adoption par un
 * accompagnement (T5.4) et les cibles de la frise (T5.6).
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

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { db } from "@/lib/db/client";
import { forDomain, superAdmin, type ScopedDb } from "@/lib/db/scoped";
import {
  domains,
  entities,
  indicatorReadings,
  indicators,
  products,
  projectIndicators,
  projectStatuses,
  projects,
} from "@/lib/db/schema";

import {
  axisScale,
  curvePath,
  groupByIndicator,
  listAdoptableIndicators,
  listProductAdoptions,
  listProductIndicators,
  listProductReadings,
  listProjectAdoptions,
  targetGap,
  unitCeiling,
  type ProductIndicator,
  type ProductReading,
} from "./indicators";

/** Enfants d'abord, parents ensuite : `domains` refuse la suppression sinon. */
const teardownOrder = [
  projectIndicators,
  indicatorReadings,
  indicators,
  projects,
  projectStatuses,
  products,
  entities,
];

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
  /** L'indicateur aux deux relevés du même jour. */
  tieId: string;
  /** Le relevé **retiré**, identifié nommément (T5.3). */
  archivedReadingId: string;
  /** L'indicateur du produit voisin — la cible des relevés forgés. */
  otherIndicatorId: string;

  /* --- T5.4 : l'adoption --------------------------------------------------- */

  /** L'accompagnement qui adopte deux indicateurs du produit complet. */
  adopterId: string;
  /** Un accompagnement du même produit, sans aucune adoption. */
  looseId: string;
  /** L'accompagnement du produit **voisin** : son produit borne ses options. */
  otherProjectId: string;
  /** L'adoption d'« Autonomie » — celle qui porte les trois valeurs. */
  autonomyAdoptionId: string;
  /** L'adoption de l'indicateur **archivé** : elle ne doit pas se lire. */
  archivedAdoptionId: string;

  /* --- T5.6 : les cibles --------------------------------------------------- */

  /** Le statut du domaine, pour les accompagnements écrits dans un test. */
  statusId: string;
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
    /* **La cible vit ici depuis le 29/08/2026, et nulle part ailleurs.** */
    targetValue?: string | null;
  }) =>
    scope.insert(indicators, {
      productId: values.productId,
      label: `${values.label} ${label}`,
      unit: values.unit ?? null,
      direction: values.direction ?? "higher_is_better",
      source: values.source ?? null,
      targetValue: values.targetValue ?? null,
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
    /* La cible du brief §7 — **portée par l'indicateur**. C'est elle que
       lisent toutes ses adoptions, et elle seule. */
    targetValue: "85",
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

  /* Un relevé **retiré**, et le plus récent de tous ceux d'`Autonomie` (T5.3).
     Sans le filtre posé dans le `on` de la jointure, il ferait tomber les trois
     agrégats d'un coup : il deviendrait *le* dernier relevé, sa valeur
     remplacerait le 71 du brief, et le décompte passerait de 3 à 4. */
  const archivedReading = await reading({
    indicatorId: autonomy.id,
    value: "88",
    readOn: "2026-08-01",
  });
  await scope.archive(indicatorReadings, archivedReading.id);

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

  /* --- L'adoption — T5.4 -------------------------------------------------- */

  const active = await scope.insert(projectStatuses, {
    label: `En cours ${label}`,
    nature: "active",
  });

  const project = async (name: string, productId: string) =>
    scope.insert(projects, {
      name: `${name} ${label}`,
      productId,
      statusId: active.id,
    });

  const adopter = await project("Adoptant", full.id);
  const loose = await project("Sans adoption", full.id);
  const otherProject = await project("Voisin", other.id);

  /* « Autonomie » porte une référence, « Doublon » n'en porte aucune : la
     colonne est nullable, et l'écran doit rendre les deux cas. Elles sont
     écrites **dans le désordre alphabétique**, comme les indicateurs : c'est
     la requête qui trie.

     **Aucune ne porte de cible** — elles ne le peuvent plus depuis le
     29/08/2026, la colonne ayant été supprimée. « Autonomie » en a une, mais
     c'est celle de l'indicateur, et « Doublon » n'en a aucune : les deux cas
     restent couverts, à un étage au-dessus. */
  await scope.insert(projectIndicators, {
    projectId: adopter.id,
    indicatorId: tie.id,
  });

  const autonomyAdoption = await scope.insert(projectIndicators, {
    projectId: adopter.id,
    indicatorId: autonomy.id,
    baselineValue: "54",
  });

  /* L'adoption d'un indicateur **archivé**. Elle n'est plus atteignable par
     l'interface depuis que l'arbitrage (e) refuse d'archiver un indicateur
     adopté, mais des lignes antérieures la portent — et c'est l'`innerJoin` qui
     doit l'écarter, pas un filtre posé sur l'adoption. */
  const archivedAdoption = await scope.insert(projectIndicators, {
    projectId: adopter.id,
    indicatorId: archived.id,
  });

  /* L'adoption du **voisin**, sur son propre indicateur : elle ne doit déborder
     ni sur l'accompagnement adoptant, ni sur ses options. */
  await scope.insert(projectIndicators, {
    projectId: otherProject.id,
    indicatorId: otherIndicator.id,
  });

  return {
    domainId: domain.id,
    scope,
    fullId: full.id,
    emptyId: empty.id,
    otherId: other.id,
    archivedIndicatorId: archived.id,
    autonomyId: autonomy.id,
    tieId: tie.id,
    archivedReadingId: archivedReading.id,
    otherIndicatorId: otherIndicator.id,
    adopterId: adopter.id,
    looseId: loose.id,
    otherProjectId: otherProject.id,
    autonomyAdoptionId: autonomyAdoption.id,
    archivedAdoptionId: archivedAdoption.id,
    statusId: active.id,
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

  test("un relevé retiré ne compte pas et ne fournit pas le dernier relevé", async () => {
    /* Les **trois** agrégats d'un coup : c'est ce que le filtre posé dans le
       `on` de la jointure — et non dans le `where`, qui emporterait l'indicateur
       avec ses relevés — garantit ensemble. Le relevé retiré est le plus récent
       et porte 88 ; sans lui, la lecture reste sur les trois du brief. */
    const rows = await listProductIndicators(a.scope, a.fullId);
    const autonomy = rows.find((row) => row.id === a.autonomyId);

    expect(autonomy).toMatchObject({
      readingCount: 3,
      lastValue: "71.0000",
      lastReadOn: "2026-06-01",
    });
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

/* ==========================================================================
   La série datée — T5.3

   Une lecture **plate** : tous les relevés vivants des indicateurs vivants du
   produit, du plus récent au plus ancien, le regroupement appartenant à
   l'écran. Ce que ces tests éprouvent, en plus des filtres, est la **jointure
   des deux lectures** : la première ligne de la série d'un indicateur est, par
   construction, le « dernier relevé » que l'autre fonction affiche.
   ========================================================================== */

describe("listProductReadings — l'ordre", () => {
  test("la série va du plus récent au plus ancien", async () => {
    const rows = await listProductReadings(a.scope, a.fullId);

    const dates = rows.map((row) => row.readOn);
    expect(dates).toEqual([...dates].sort().reverse());

    // Les trois du brief, les deux de « Baisse », les deux de « Doublon ».
    expect(rows).toHaveLength(7);
  });

  test("deux relevés du même jour se départagent de façon stable", async () => {
    /* `read_on` seule ne tranche pas, et l'ordre physique varie d'un plan
       d'exécution à l'autre : sans le `id desc`, deux affichages successifs
       pourraient intervertir les deux lignes. */
    const first = await listProductReadings(a.scope, a.fullId);
    const second = await listProductReadings(a.scope, a.fullId);

    const idsOf = (rows: Awaited<ReturnType<typeof listProductReadings>>) =>
      rows.filter((row) => row.indicatorId === a.tieId).map((row) => row.id);

    expect(idsOf(first)).toHaveLength(2);
    expect(idsOf(first)).toEqual(idsOf(second));
  });

  test("la première ligne d'une série est le dernier relevé de son indicateur", async () => {
    /* **La propriété que les deux lectures partagent**, et le seul test qui la
       retienne : elles trient sur le même couple `read_on desc, id desc`, si
       bien que la tête de la série et la valeur affichée au-dessus d'elle dans
       le bloc sont le même relevé — par construction, non par coïncidence. Deux
       tris différents feraient mentir l'un des deux affichages. */
    const [indicatorRows, readingRows] = await Promise.all([
      listProductIndicators(a.scope, a.fullId),
      listProductReadings(a.scope, a.fullId),
    ]);

    const measured = indicatorRows.filter((row) => row.readingCount > 0);
    expect(measured.length).toBeGreaterThan(0);

    for (const indicator of measured) {
      const head = readingRows.find((row) => row.indicatorId === indicator.id);

      expect(head?.value).toBe(indicator.lastValue);
      expect(head?.readOn).toBe(indicator.lastReadOn);
    }
  });
});

describe("listProductReadings — les champs", () => {
  test("une ligne rend ses cinq colonnes, brutes", async () => {
    const rows = await listProductReadings(a.scope, a.fullId);
    const head = rows.find((row) => row.indicatorId === a.autonomyId);

    expect(head).toMatchObject({
      indicatorId: a.autonomyId,
      // `numeric(18,4)` revient en chaîne du pilote : la mise en forme
      // appartient à l'écran, jamais à la lecture.
      value: "71.0000",
      readOn: "2026-06-01",
      sourceNote: null,
    });
    expect(head?.id).toEqual(expect.any(String));
  });
});

describe("listProductReadings — le périmètre", () => {
  test("un relevé retiré n'apparaît pas dans la série", async () => {
    const rows = await listProductReadings(a.scope, a.fullId);

    // Le plus récent de tous : sans le filtre, il ouvrirait la série.
    expect(rows.map((row) => row.id)).not.toContain(a.archivedReadingId);
    expect(rows.map((row) => row.readOn)).not.toContain("2026-08-01");
  });

  test("les relevés d'un indicateur archivé sortent avec lui", async () => {
    /* `Ancien` porte un relevé bien vivant : c'est l'`innerJoin` qui l'écarte,
       et non un filtre sur le relevé. Un relevé dont l'indicateur ne s'affiche
       plus n'a nulle part où s'afficher. */
    const rows = await listProductReadings(a.scope, a.fullId);

    expect(rows.map((row) => row.indicatorId)).not.toContain(
      a.archivedIndicatorId,
    );
    expect(rows.map((row) => row.value)).not.toContain("99.0000");
  });

  test("les relevés d'un autre produit du même domaine n'apparaissent pas", async () => {
    const rows = await listProductReadings(a.scope, a.fullId);

    expect(rows.map((row) => row.indicatorId)).not.toContain(
      a.otherIndicatorId,
    );
  });

  test("un produit sans relevé rend un tableau vide", async () => {
    expect(await listProductReadings(a.scope, a.emptyId)).toEqual([]);
  });
});

describe("listProductReadings — étanchéité du domaine", () => {
  test("les relevés d'un produit d'un autre domaine ne se lisent pas", async () => {
    expect(await listProductReadings(b.scope, a.fullId)).toEqual([]);
  });

  test("chaque domaine ne lit que les relevés de ses propres indicateurs", async () => {
    const [own, rows] = await Promise.all([
      listProductIndicators(b.scope, b.fullId),
      listProductReadings(b.scope, b.fullId),
    ]);

    const ids = new Set(own.map((row) => row.id));
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => ids.has(row.indicatorId))).toBe(true);
  });

  test("un relevé forgé d'un autre domaine ne se lit pas", async () => {
    /* Le contournement de `resources.test.ts`, transposé et réécrit ici plutôt
       qu'emprunté au test voisin : `filter(indicatorReadings)` est
       **infalsifiable** sans une ligne que la couche scopée refuse d'écrire, et
       un test qui dépendrait de l'ordre d'exécution d'un autre ne prouverait
       rien le jour où l'un des deux bouge. */
    await db.insert(indicatorReadings).values({
      // La liaison interdite : un relevé du domaine `a` sur un indicateur `b`.
      domainId: a.domainId,
      indicatorId: b.otherIndicatorId,
      value: "888",
      readOn: "2031-01-01",
    });

    expect(await listProductReadings(b.scope, b.otherId)).toEqual([]);
  });
});

/* ==========================================================================
   Le décompte des adoptions — T5.4

   Il ne décrit pas l'indicateur, il gouverne un geste : c'est lui qui fait dire
   au bloc combien d'accompagnements adoptent, là où « Archiver » paraîtrait ne
   rien faire. Ce que ces tests épinglent est la **sous-requête corrélée** —
   qu'une seconde jointure aurait remplacée au prix des trois agrégats voisins.
   ========================================================================== */

describe("listProductIndicators — le décompte des adoptions", () => {
  test("un indicateur adopté dit combien, un indicateur libre dit zéro", async () => {
    const rows = await listProductIndicators(a.scope, a.fullId);

    expect(rows.find((row) => row.id === a.autonomyId)?.adoptionCount).toBe(1);
    expect(rows.find((row) => row.id === a.tieId)?.adoptionCount).toBe(1);
    // « Zèle » n'est adopté par personne, et « Baisse » non plus.
    expect(rows.find((row) => row.label === "Zèle a")?.adoptionCount).toBe(0);
    expect(rows.find((row) => row.label === "Baisse a")?.adoptionCount).toBe(0);
  });

  test("le décompte ne fausse ni les relevés ni le dernier relevé", async () => {
    /* **Le test qui isole la sous-requête corrélée.** Une seconde jointure
       aurait multiplié les lignes par le nombre d'adoptions : « Autonomie » est
       adopté une fois, donc le défaut ne se verrait pas ici — c'est pourquoi le
       constat porte sur les trois agrégats *ensemble*, et pourquoi le test
       ci-dessous ajoute une seconde adoption pour le rendre visible. */
    const rows = await listProductIndicators(a.scope, a.fullId);
    const autonomy = rows.find((row) => row.id === a.autonomyId);

    expect(autonomy).toMatchObject({
      readingCount: 3,
      lastValue: "71.0000",
      lastReadOn: "2026-06-01",
      adoptionCount: 1,
    });
  });

  test("deux adoptions ne dédoublent pas les relevés", async () => {
    /* Le cas qu'une jointure ferait tomber : avec deux adoptions,
       `count(readings)` passerait de 3 à 6. La sous-requête, elle, ne touche pas
       la cardinalité de la lecture. Le second accompagnement est écrit ici et
       non dans la fixture, pour que les autres tests gardent leur décompte. */
    const second = await a.scope.insert(projectIndicators, {
      projectId: a.looseId,
      indicatorId: a.autonomyId,
    });

    try {
      const rows = await listProductIndicators(a.scope, a.fullId);
      const autonomy = rows.find((row) => row.id === a.autonomyId);

      expect(autonomy).toMatchObject({
        readingCount: 3,
        lastValue: "71.0000",
        adoptionCount: 2,
      });
    } finally {
      await a.scope.unlink(projectIndicators, second.id);
    }
  });

  test("une adoption d'un autre domaine ne compte pas", async () => {
    /* La condition de domaine de la sous-requête est écrite en propre :
       `filter` ne s'applique qu'aux tables de la lecture, et elle ne pouvait
       donc pas la porter. Sans elle, l'adoption forgée ci-dessous ferait passer
       le décompte du voisin de 0 à 1. */
    await db.insert(projectIndicators).values({
      // La liaison interdite : une adoption du domaine `a` sur un indicateur `b`.
      domainId: a.domainId,
      projectId: a.adopterId,
      indicatorId: b.otherIndicatorId,
    });

    const rows = await listProductIndicators(b.scope, b.otherId);
    expect(
      rows.find((row) => row.id === b.otherIndicatorId)?.adoptionCount,
    ).toBe(1);
  });
});

/* ==========================================================================
   Les indicateurs adoptés par un accompagnement — T5.4

   Quatre valeurs reportées côte à côte, et pas un cinquième chiffre : la
   lecture rend ce que les lignes portent, jamais leur écart (arbitrage (g),
   D39).
   ========================================================================== */

describe("listProjectAdoptions", () => {
  test("le tri est alphabétique, pas celui des insertions", async () => {
    const rows = await listProjectAdoptions(a.scope, a.adopterId);

    // « Doublon » a été adopté en premier, « Autonomie » en second.
    expect(rows.map((row) => row.label)).toEqual(["Autonomie a", "Doublon a"]);
  });

  test("une adoption rend sa référence, le libellé et le dernier relevé", async () => {
    const rows = await listProjectAdoptions(a.scope, a.adopterId);
    const autonomy = rows.find((row) => row.id === a.autonomyAdoptionId);

    expect(autonomy).toMatchObject({
      indicatorId: a.autonomyId,
      label: "Autonomie a",
      // L'unité vient de l'indicateur : les trois chiffres la partagent.
      unit: "%",
      baselineValue: "54.0000",
      lastValue: "71.0000",
      lastReadOn: "2026-06-01",
    });
  });

  test("l'adoption rend la cible du produit, jamais une cible à elle", async () => {
    /* **La propriété du 29/08/2026, et celle que la mise en défaut vise.**
       `project_indicators` ne porte plus de cible : `productTargetValue` est
       lue sur l'indicateur, par la jointure qui portait déjà le libellé et
       l'unité. Aucune adoption de la fixture n'a jamais écrit « 85 » — cette
       valeur ne peut venir que d'`indicators.target_value`. */
    const rows = await listProjectAdoptions(a.scope, a.adopterId);
    const autonomy = rows.find((row) => row.id === a.autonomyAdoptionId);

    expect(autonomy?.productTargetValue).toBe("85.0000");
  });

  test("deux accompagnements qui adoptent le même indicateur lisent la même cible", async () => {
    /* **La divergence rendue impossible.** C'est le geste que le second lieu
       de vérité autorisait : deux adoptions, deux cibles, et deux écrans qui
       ne disaient pas la même chose. L'écriture est faite ici et défaite en
       `finally` — la fixture est partagée, et un décompte d'adoptions qui
       changerait ferait tomber les tests de T5.4 sans qu'ils soient en cause. */
    const second = await a.scope.insert(projectIndicators, {
      projectId: a.looseId,
      indicatorId: a.autonomyId,
    });

    try {
      const here = await listProjectAdoptions(a.scope, a.adopterId);
      const there = await listProjectAdoptions(a.scope, a.looseId);

      const mine = here.find((row) => row.id === a.autonomyAdoptionId);
      const theirs = there.find((row) => row.id === second.id);

      expect(mine?.productTargetValue).toBe("85.0000");
      expect(theirs?.productTargetValue).toBe(mine?.productTargetValue);
    } finally {
      await a.scope.unlink(projectIndicators, second.id);
    }
  });

  test("la référence est nulle quand rien n'est saisi", async () => {
    /* La colonne est nullable : une adoption qui ne pose aucune référence est
       une adoption normale, et l'écran le dit plutôt que de poser un zéro.
       « Doublon » n'a pas non plus de cible — celle de son indicateur est
       nulle, et c'est ce que la lecture rend. */
    const rows = await listProjectAdoptions(a.scope, a.adopterId);
    const tie = rows.find((row) => row.indicatorId === a.tieId);

    expect(tie).toMatchObject({
      baselineValue: null,
      productTargetValue: null,
    });
  });

  test("le dernier relevé est celui des relevés vivants", async () => {
    /* Le filtre est dans le `on` de la jointure, l'emplacement de T5.3 : le
       relevé retiré du 2026-08-01 porte 88 et serait *le* plus récent. */
    const rows = await listProjectAdoptions(a.scope, a.adopterId);
    const autonomy = rows.find((row) => row.id === a.autonomyAdoptionId);

    expect(autonomy?.lastValue).toBe("71.0000");
    expect(autonomy?.lastReadOn).toBe("2026-06-01");
  });

  test("l'adoption d'un indicateur archivé sort avec lui", async () => {
    const rows = await listProjectAdoptions(a.scope, a.adopterId);

    expect(rows.map((row) => row.id)).not.toContain(a.archivedAdoptionId);
    expect(rows.map((row) => row.label)).not.toContain("Ancien a");
  });

  test("les adoptions d'un autre accompagnement n'apparaissent pas", async () => {
    const rows = await listProjectAdoptions(a.scope, a.adopterId);

    expect(rows.map((row) => row.indicatorId)).not.toContain(
      a.otherIndicatorId,
    );
  });

  test("un accompagnement sans adoption rend un tableau vide", async () => {
    expect(await listProjectAdoptions(a.scope, a.looseId)).toEqual([]);
  });

  test("les adoptions d'un accompagnement d'un autre domaine ne se lisent pas", async () => {
    expect(await listProjectAdoptions(b.scope, a.adopterId)).toEqual([]);
  });
});

/* ==========================================================================
   Les indicateurs adoptables — T5.4

   Ce que le panneau propose : les vivants du produit que cet accompagnement
   n'adopte pas encore, plus l'exception nominative en correction.
   ========================================================================== */

describe("listAdoptableIndicators", () => {
  test("les indicateurs déjà adoptés ne sont pas proposés", async () => {
    const rows = await listAdoptableIndicators(a.scope, a.adopterId, a.fullId);

    // « Autonomie » et « Doublon » sont adoptés ; restent « Baisse » et « Zèle ».
    expect(rows.map((row) => row.label)).toEqual(["Baisse a", "Zèle a"]);
  });

  test("un indicateur archivé n'est pas proposé", async () => {
    const rows = await listAdoptableIndicators(a.scope, a.looseId, a.fullId);

    // Rien n'est adopté par cet accompagnement : les quatre vivants sortent,
    // et « Ancien » — alphabétiquement premier — reste dehors.
    expect(rows.map((row) => row.label)).toEqual([
      "Autonomie a",
      "Baisse a",
      "Doublon a",
      "Zèle a",
    ]);
  });

  test("l'exception nominative rétablit l'indicateur de l'adoption éditée", async () => {
    /* **Le test qui isole l'exception**, et le seul : sans elle, « Autonomie »
       — déjà adopté par cet accompagnement — serait absent de la liste, le
       `select` s'ouvrirait sans option sélectionnée, et la première
       re-soumission changerait l'indicateur de l'adoption ou la refuserait. */
    const rows = await listAdoptableIndicators(a.scope, a.adopterId, a.fullId, {
      keepIndicatorId: a.autonomyId,
    });

    expect(rows.map((row) => row.label)).toEqual([
      "Autonomie a",
      "Baisse a",
      "Zèle a",
    ]);
  });

  test("l'exception nominative rétablit aussi un indicateur archivé, et lui seul", async () => {
    /* Elle couvre les deux exclusions d'un seul chemin. Et elle est
       **nominative** : « Doublon », adopté et non conservé, reste dehors ;
       aucun autre archivé n'entre. */
    const rows = await listAdoptableIndicators(a.scope, a.adopterId, a.fullId, {
      keepIndicatorId: a.archivedIndicatorId,
    });

    expect(rows.map((row) => row.label)).toEqual([
      "Ancien a",
      "Baisse a",
      "Zèle a",
    ]);
  });

  test("les indicateurs d'un autre produit ne sont pas proposés", async () => {
    const rows = await listAdoptableIndicators(
      a.scope,
      a.otherProjectId,
      a.otherId,
    );

    // Le voisin adopte déjà son unique indicateur : il ne reste rien.
    expect(rows).toEqual([]);
    expect(
      (await listAdoptableIndicators(a.scope, a.adopterId, a.fullId)).map(
        (row) => row.label,
      ),
    ).not.toContain("Indicateur du voisin a");
  });

  test("un produit sans indicateur ne propose rien", async () => {
    expect(
      await listAdoptableIndicators(a.scope, a.looseId, a.emptyId),
    ).toEqual([]);
  });

  test("les indicateurs d'un produit d'un autre domaine ne se proposent pas", async () => {
    expect(
      await listAdoptableIndicators(b.scope, a.adopterId, a.fullId),
    ).toEqual([]);
  });

  test("une adoption d'un autre domaine n'exclut rien", async () => {
    /* **Le test qui isole la condition de domaine de l'exclusion**, et il a dû
       être récrit : le premier jet forgeait une adoption sur un projet du
       domaine `a`, que la condition `project_id` écartait déjà — retirer la
       condition de domaine ne le faisait pas tomber. La leçon de T4bis.5 :
       « un test vert au retrait d'une règle est un test qui ne la couvre pas,
       même s'il porte son nom. »

       La ligne forgée porte donc le **projet visé par la lecture**, et ne se
       distingue que par son `domain_id` — la seule chose qui puisse encore
       l'écarter. Aucune écriture de l'application ne la produit : la couche
       scopée la refuserait. */
    await db.insert(projectIndicators).values({
      domainId: a.domainId,
      projectId: b.looseId,
      indicatorId: b.tieId,
    });

    const rows = await listAdoptableIndicators(b.scope, b.looseId, b.fullId);
    expect(rows.map((row) => row.id)).toContain(b.tieId);
  });
});

/* ==========================================================================
   Les cibles de la frise — T5.6

   Ce que ces tests épinglent : la cible rendue avec l'accompagnement qui la
   porte, l'adoption sans cible qui n'a rien à tracer, et l'accompagnement
   archivé écarté — la cohérence des trois couches de la frise, qui n'en porte
   aucune.

   **Les écritures sont faites dans le test et défaites en `finally`**, comme
   celle de la seconde adoption plus haut : la fixture est partagée, et un
   décompte d'adoptions qui changerait ferait tomber les tests de T5.4 sans que
   ceux-ci soient en cause.
   ========================================================================== */

describe("listProductAdoptions", () => {
  test("une adoption se lit avec l'accompagnement qui la porte", async () => {
    const rows = await listProductAdoptions(a.scope, a.fullId);
    const autonomy = rows.find((row) => row.indicatorId === a.autonomyId);

    expect(autonomy).toMatchObject({
      projectId: a.adopterId,
      projectName: "Adoptant a",
      // `numeric(18,4)` revient en chaîne : la mise en forme est à l'écran.
      baselineValue: "54.0000",
    });
  });

  test("une adoption nue se lit quand même", async () => {
    /* **C'est ce qui change avec `listProductTargets`**, qui filtrait sur
       `isNotNull(targetValue)`. Le bloc nomme sous chaque indicateur les
       accompagnements qui l'ont adopté : une adoption nue n'a rien à
       reporter, mais elle a un nom à écrire. */
    const rows = await listProductAdoptions(a.scope, a.fullId);
    const tie = rows.find((row) => row.indicatorId === a.tieId);

    expect(tie).toBeDefined();
    expect(tie?.baselineValue).toBeNull();
  });

  test("la lecture ne porte plus de cible", async () => {
    /* **Le pendant de la suppression du 29/08/2026.** La cible du produit se
       lit sur `listProductIndicators`, jamais ici : deux chemins vers la même
       valeur, c'est le second lieu de vérité qui revient par la fenêtre. */
    const rows = await listProductAdoptions(a.scope, a.fullId);
    const autonomy = rows.find((row) => row.indicatorId === a.autonomyId);

    expect(autonomy).toBeDefined();
    expect(autonomy).not.toHaveProperty("targetValue");
    expect(autonomy).not.toHaveProperty("finalValue");
  });

  test("l'adoption d'un accompagnement archivé n'est pas rendue", async () => {
    /* **Le test qui isole `isNull(projects.archivedAt)`.** La frise écarte déjà
       les accompagnements rangés de ses bandes et de ses repères : une adoption
       qui survivrait serait un nom orphelin sur un axe qui ne porte plus
       l'accompagnement qui l'avait déclarée. */
    const archivedProject = await a.scope.insert(projects, {
      name: `Range ${suffix}`,
      productId: a.fullId,
      statusId: a.statusId,
    });
    const adoption = await a.scope.insert(projectIndicators, {
      projectId: archivedProject.id,
      indicatorId: a.autonomyId,
      baselineValue: "90",
    });
    await a.scope.archive(projects, archivedProject.id);

    try {
      const rows = await listProductAdoptions(a.scope, a.fullId);

      expect(rows.map((row) => row.baselineValue)).not.toContain("90.0000");
      expect(rows.map((row) => row.projectId)).not.toContain(
        archivedProject.id,
      );
    } finally {
      await a.scope.unlink(projectIndicators, adoption.id);
    }
  });

  test("l'adoption d'un indicateur archivé se lit encore, et l'écran l'ignore", async () => {
    /* La lecture ne joint pas `indicators`, et c'est délibéré : le composant
       range chaque adoption sous la bande de son indicateur, et un indicateur
       archivé n'a **aucune bande** — elle n'a nulle part où se poser. Une
       seconde jointure ne changerait rien à l'écran et coûterait une table de
       plus à filtrer. Le test dit ce que la lecture rend vraiment, plutôt que
       de laisser croire à un filtre qui n'existe pas. */
    const rows = await listProductAdoptions(a.scope, a.fullId);

    expect(rows.map((row) => row.indicatorId)).toContain(
      a.archivedIndicatorId,
    );
  });

  test("les adoptions d'un autre produit ne débordent pas", async () => {
    const full = await listProductAdoptions(a.scope, a.fullId);
    const neighbour = await listProductAdoptions(a.scope, a.otherId);

    /* Le voisin adopte son indicateur **sans rien renseigner** : là où
       `listProductTargets` ne rendait rien, cette lecture rend l'adoption. */
    expect(neighbour.map((row) => row.indicatorId)).toEqual([
      a.otherIndicatorId,
    ]);
    expect(full.map((row) => row.indicatorId)).not.toContain(
      a.otherIndicatorId,
    );
  });

  test("un produit sans adoption rend un tableau vide", async () => {
    expect(await listProductAdoptions(a.scope, a.emptyId)).toEqual([]);
  });

  test("les adoptions d'un produit d'un autre domaine ne se lisent pas", async () => {
    /* L'étanchéité par l'adoption : les identifiants sont réels, les lectures
       sont faites sous l'autre domaine. Sans `filter(projectIndicators)`, la
       référence de 54 du domaine voisin se lirait ici. */
    expect(await listProductAdoptions(a.scope, b.fullId)).toEqual([]);
    expect(await listProductAdoptions(b.scope, a.fullId)).toEqual([]);
  });

  test("une adoption portée par un accompagnement d'un autre domaine ne se lit pas", async () => {
    /* **Le test qui isole `filter(projects)`**, et il a dû être écrit : le
       premier jet — les deux lectures croisées ci-dessus — restait vert au
       retrait du filtre, l'adoption du domaine `a` ne pointant jamais, en
       fonctionnement normal, vers un accompagnement du domaine `b`. La leçon de
       T4bis.5, reprise de T5.5 : « un test vert au retrait d'une règle est un
       test qui ne la couvre pas, même s'il porte son nom », et « les filtres de
       domaine se rattrapent ».

       La ligne forgée est la seule qui puisse encore l'éprouver : une adoption
       du domaine `a`, portant une référence, sur un accompagnement du domaine
       `b`. Aucune écriture de l'application ne la produit — la couche scopée la
       refuserait. Sans `filter(projects)`, elle sortirait de la lecture faite
       sous `a` sur le produit voisin. */
    await db.insert(projectIndicators).values({
      domainId: a.domainId,
      projectId: b.looseId,
      indicatorId: b.autonomyId,
      baselineValue: "77",
    });

    expect(await listProductAdoptions(a.scope, b.fullId)).toEqual([]);
  });
});

/* ==========================================================================
   La North Star — hors ticket, 17/08/2026

   Deux colonnes et un index unique partiel. **L'index s'éprouve par l'écriture,
   jamais par l'écran** : c'est lui qui garantit qu'un produit n'a qu'une North
   Star, et un test qui se contenterait de lire le tri ne dirait rien de la
   garantie.

   Les écritures sont défaites en `finally` : la fixture est partagée entre les
   `describe`, et une North Star laissée allumée changerait l'ordre lu ailleurs.
   ========================================================================== */

describe("la North Star — le drapeau et son unicité", () => {
  test("la lecture rend le drapeau et la cible du produit", async () => {
    /* **Seul le drapeau se défait en `finally`.** La cible, elle, appartient
       désormais à la fixture — « Autonomie » la porte depuis le 29/08/2026, et
       les adoptions la lisent. La remettre à `null` ici viderait la propriété
       que `listProjectAdoptions` éprouve deux `describe` plus haut, selon
       l'ordre d'exécution : un test qui range mal ce qu'il a dérangé est un
       test qui en casse un autre à distance. */
    try {
      await a.scope.update(indicators, a.autonomyId, { isNorthStar: true });

      const rows = await listProductIndicators(a.scope, a.fullId);
      const autonomy = rows.find((row) => row.id === a.autonomyId);

      expect(autonomy).toMatchObject({ isNorthStar: true });
      // `numeric(18,4)` revient en chaîne : la mise en forme est à l'écran.
      expect(autonomy?.targetValue).toBe("85.0000");
    } finally {
      await a.scope.update(indicators, a.autonomyId, { isNorthStar: false });
    }
  });

  test("la North Star sort **en tête**, avant l'ordre alphabétique", async () => {
    /* Le tri est dans la lecture et non à l'écran : un composant qui retrierait
       un tableau déjà trié ferait dépendre l'ordre de deux endroits. */
    const before = await listProductIndicators(a.scope, a.fullId);
    const last = before[before.length - 1];
    expect(last).toBeDefined();
    if (!last) return;

    try {
      await a.scope.update(indicators, last.id, { isNorthStar: true });

      const after = await listProductIndicators(a.scope, a.fullId);

      expect(after[0]?.id).toBe(last.id);
      // Les autres gardent leur ordre alphabétique entre eux.
      expect(after.slice(1).map((row) => row.label)).toEqual(
        before.filter((row) => row.id !== last.id).map((row) => row.label),
      );
    } finally {
      await a.scope.update(indicators, last.id, { isNorthStar: false });
    }
  });

  test("deux North Star sur le même produit sont refusées **par la base**", async () => {
    /* **Le test qui isole `indicators_north_star_unique`.** Sans lui, rien ne
       garantirait l'unicité : l'action éteint l'ancienne avant d'allumer la
       nouvelle, mais deux requêtes concurrentes — ou une écriture directe —
       passeraient. C'est la garantie, pas la politesse de l'action, qu'on
       éprouve ici. */
    await a.scope.update(indicators, a.autonomyId, { isNorthStar: true });

    try {
      /* `toThrow()` seul passerait sur **n'importe quelle** erreur — un nom de
         colonne fautif, une panne réseau. C'est l'index nommé qu'on veut voir
         refuser, et rien d'autre. Le nom vit dans la `cause` : Drizzle enveloppe
         l'erreur du pilote dans un message générique. */
      const refused = await a.scope
        .update(indicators, a.tieId, { isNorthStar: true })
        .then(() => null)
        .catch((error: unknown) => error);

      expect(refused).not.toBeNull();
      const cause = (refused as { cause?: { constraint?: string } }).cause;
      expect(cause?.constraint).toBe("indicators_north_star_unique");
    } finally {
      await a.scope.update(indicators, a.autonomyId, { isNorthStar: false });
    }
  });

  test("l'unicité est **par produit** : deux produits peuvent en porter chacun une", async () => {
    try {
      await a.scope.update(indicators, a.autonomyId, { isNorthStar: true });
      await a.scope.update(indicators, a.otherIndicatorId, {
        isNorthStar: true,
      });

      const full = await listProductIndicators(a.scope, a.fullId);
      const other = await listProductIndicators(a.scope, a.otherId);

      expect(full.filter((row) => row.isNorthStar)).toHaveLength(1);
      expect(other.filter((row) => row.isNorthStar)).toHaveLength(1);
    } finally {
      await a.scope.update(indicators, a.autonomyId, { isNorthStar: false });
      await a.scope.update(indicators, a.otherIndicatorId, {
        isNorthStar: false,
      });
    }
  });

  test("un indicateur **archivé** ne retient pas la place", async () => {
    /* La leçon de `results_activity_unique` (T4bis.6) : une unicité totale
       ferait qu'un indicateur rangé occupe toujours la place, et désigner son
       successeur lèverait une violation — un 500 là où l'on attend un écran.
       L'index porte donc `archived_at is null`. */
    await db
      .update(indicators)
      .set({ isNorthStar: true })
      .where(eq(indicators.id, a.archivedIndicatorId));

    try {
      await expect(
        a.scope.update(indicators, a.autonomyId, { isNorthStar: true }),
      ).resolves.toBeDefined();
    } finally {
      await a.scope.update(indicators, a.autonomyId, { isNorthStar: false });
      await db
        .update(indicators)
        .set({ isNorthStar: false })
        .where(eq(indicators.id, a.archivedIndicatorId));
    }
  });
});

/* ==========================================================================
   L'écart à la cible — hors ticket, 17/08/2026

   ⚠ Ces tests éprouvent un calcul que quatre textes du projet interdisent
   (D39, `docs/06` §6, arbitrage (g), `brief-design.md` §4.3). Arbitré par
   l'humain, consigné dans `JOURNAL-TECHNIQUE.md`. Ils sont ici parce qu'un
   calcul qu'on assume se teste comme les autres — et celui-ci a un piège que la
   maquette n'avait pas vu : le sens de lecture.

   Fonction pure : aucune base.
   ========================================================================== */

describe("targetGap — l'écart, selon le sens de lecture", () => {
  test("`higher_is_better` : la cible est atteinte quand on la dépasse", () => {
    expect(targetGap("85", "90", "higher_is_better")).toEqual({
      reached: true,
      distance: 5,
    });
    expect(targetGap("85", "60", "higher_is_better")).toEqual({
      reached: false,
      distance: 25,
    });
  });

  test("`lower_is_better` : la cible est atteinte quand on descend dessous", () => {
    /* **Le piège de la maquette.** Elle fait `target - current` et annonce
       « Encore X pts » : un taux d'abandon à 8 % pour une cible à 5 % y serait
       donné pour atteint, la différence étant négative. */
    expect(targetGap("5", "8", "lower_is_better")).toEqual({
      reached: false,
      distance: 3,
    });
    expect(targetGap("5", "3", "lower_is_better")).toEqual({
      reached: true,
      distance: 2,
    });
  });

  test("l'égalité stricte est une cible atteinte, dans les deux sens", () => {
    expect(targetGap("85", "85", "higher_is_better")?.reached).toBe(true);
    expect(targetGap("85", "85", "lower_is_better")?.reached).toBe(true);
    expect(targetGap("85", "85", "higher_is_better")?.distance).toBe(0);
  });

  test("la distance n'est **jamais signée** : le sens est porté par `reached`", () => {
    expect(targetGap("85", "60", "higher_is_better")?.distance).toBeGreaterThan(0);
    expect(targetGap("5", "8", "lower_is_better")?.distance).toBeGreaterThan(0);
  });

  test("sans ses deux termes, il n'y a pas de comparaison", () => {
    // Une comparaison sans ses deux termes ne s'invente pas : l'écran se tait.
    expect(targetGap(null, "60", "higher_is_better")).toBeNull();
    expect(targetGap("85", null, "higher_is_better")).toBeNull();
    expect(targetGap("", "60", "higher_is_better")).toBeNull();
    expect(targetGap("indisponible", "60", "higher_is_better")).toBeNull();
  });

  test("les zéros de queue de `numeric(18,4)` ne changent rien", () => {
    expect(targetGap("85.0000", "90.0000", "higher_is_better")).toEqual({
      reached: true,
      distance: 5,
    });
  });
});

/* ==========================================================================
   Le tracé — hors ticket, 17/08/2026

   `curvePath` rend l'attribut `d` d'un `path` dans un `viewBox="0 0 100 100"`.
   Une position ne s'écrit pas dans un JSX : elle s'éprouve ici.

   Fonction pure : aucune base.
   ========================================================================== */

describe("unitCeiling — le plafond que l'unité déclare", () => {
  test("le pourcentage plafonne à 100", () => {
    expect(unitCeiling("%")).toBe(100);
    expect(unitCeiling(" % ")).toBe(100);
  });

  test("une note sur N plafonne à N", () => {
    expect(unitCeiling("/100")).toBe(100);
    expect(unitCeiling("/5")).toBe(5);
    expect(unitCeiling("/ 20")).toBe(20);
  });

  test("toute autre unité n'a aucun plafond naturel", () => {
    /* On n'en invente pas : « jours », « s », « € » n'ont pas de maximum, et
       en supposer un fausserait l'échelle. */
    for (const unit of ["jours", "s", "€", "pts", "", null, undefined]) {
      expect(unitCeiling(unit)).toBeNull();
    }
  });

  test("une notation malformée ne provoque rien", () => {
    for (const unit of ["/", "/abc", "/0", "/-5", "100"]) {
      expect(unitCeiling(unit)).toBeNull();
    }
  });
});

describe("axisScale — l'échelle qui part de zéro", () => {
  test("le plafond de l'unité **fixe le maximum**, cible comprise", () => {
    /* Le défaut du 17/08/2026 : sans le plafond, une cible à 85 plus haute que
       tous les relevés devenait le maximum, et le marqueur de la jauge se
       collait au bout de la piste. */
    expect(axisScale(["54", "60", "85"], "%")).toEqual({ min: 0, max: 100 });
  });

  test("le plafond ne rogne jamais une donnée qui le dépasse", () => {
    // Un 120 % saisi par erreur reste visible plutôt qu'écrêté hors de la boîte.
    expect(axisScale(["54", "120"], "%")).toEqual({ min: 0, max: 120 });
  });

  test("sans plafond d'unité, l'échelle se borne sur les données", () => {
    expect(axisScale(["1.4", "2.1"], "jours")).toEqual({ min: 0, max: 2.1 });
  });

  test("une grandeur signée ignore le plafond d'unité", () => {
    // Une variation en points de pourcentage n'est pas un pourcentage.
    expect(axisScale(["-12", "8"], "%")).toEqual({ min: -12, max: 8 });
  });

  test("des valeurs positives donnent un axe qui part de zéro", () => {
    /* C'est ce qui rend l'amplitude vraie : `valueScale` bornerait à 54-60 et
       ferait d'une hausse de six points une envolée pleine hauteur. */
    expect(axisScale(["54", "57", "60"])).toEqual({ min: 0, max: 60 });
  });

  test("la cible entre dans le maximum quand elle dépasse les relevés", () => {
    expect(axisScale(["54", "60", "85"])).toEqual({ min: 0, max: 85 });
  });

  test("un zéro exact reste un plancher, pas un cas limite", () => {
    expect(axisScale(["0", "40"])).toEqual({ min: 0, max: 40 });
  });

  test("une valeur négative fait retomber sur `min → max`", () => {
    /* Une mesure qui descend sous zéro n'a pas de plancher naturel à zéro : l'y
       forcer sortirait ses relevés de la boîte. */
    expect(axisScale(["-12", "8"])).toEqual({ min: -12, max: 8 });
  });

  test("sans valeur exploitable, il n'y a pas d'axe", () => {
    expect(axisScale([])).toBeNull();
    expect(axisScale([null, "", "indisponible"])).toBeNull();
  });
});

describe("curvePath — l'attribut `d`", () => {
  test("les ordonnées sont **retournées** : `y` compte depuis le bas", () => {
    /* Le retournement vit dans la fonction et pas dans l'appelant, pour qu'il
       n'ait à se faire qu'une fois et qu'un test le tienne. */
    expect(curvePath([{ x: 0, y: 0 }, { x: 100, y: 100 }])).toBe(
      "M0,100 L100,0",
    );
  });

  test("un point isolé rend un **segment nul**, jamais une chaîne vide", () => {
    /* Un `path` sans `d` valide est ignoré par le navigateur : le point seul
       disparaîtrait au lieu de se marquer. */
    expect(curvePath([{ x: 50, y: 40 }])).toBe("M50,60 L50,60");
  });

  test("une série vide ne trace rien", () => {
    expect(curvePath([])).toBe("");
  });

  test("les coordonnées sont arrondies à quatre décimales", () => {
    /* Le HTML servi doit être **stable d'un rendu à l'autre** pour se relire et
       se tester : un tiers non arrondi rendrait dix-sept chiffres. */
    expect(curvePath([{ x: 100 / 3, y: 0 }])).toBe("M33.3333,100 L33.3333,100");
  });

  test("aucun lissage : les points sont joints par des segments droits", () => {
    // Le segment joint deux faits, il n'en invente pas un troisième.
    const d = curvePath([
      { x: 0, y: 10 },
      { x: 50, y: 60 },
      { x: 100, y: 30 },
    ]);

    expect(d).toBe("M0,90 L50,40 L100,70");
    expect(d).not.toMatch(/[CQSTA]/u);
  });
});

/* ==========================================================================
   Le regroupement d'une série — TD.1

   Fonction pure, et c'est ce qui la rend testable : elle vivait dans
   `indicators.tsx`, où `vitest` ne va pas, et `timeline.tsx` en refaisait une
   variante. Deux copies sans test valent moins qu'une avec.

   Aucune base ici : le regroupement ne lit rien, il range ce qu'une lecture a
   déjà trié.
   ========================================================================== */

describe("groupByIndicator", () => {
  /** Un relevé réduit à ce que le regroupement regarde. */
  const reading = (id: string, indicatorId: string): ProductReading =>
    ({ id, indicatorId }) as ProductReading;

  test("une série par indicateur, dans l'ordre reçu", () => {
    const grouped = groupByIndicator([
      reading("r1", "i1"),
      reading("r2", "i2"),
      reading("r3", "i1"),
      reading("r4", "i1"),
    ]);

    expect([...grouped.keys()]).toEqual(["i1", "i2"]);
    expect(grouped.get("i1")?.map((r) => r.id)).toEqual(["r1", "r3", "r4"]);
    expect(grouped.get("i2")?.map((r) => r.id)).toEqual(["r2"]);
  });

  test("l'ordre reçu est conservé, jamais rejoué", () => {
    /* La règle de T5.1 : une lecture trie, un composant affiche. Si le
       regroupement retriait quoi que ce soit, le bloc et la frise liraient deux
       chronologies différentes de la même colonne. Les relevés arrivent ici du
       plus récent au plus ancien, et repartent dans cet ordre. */
    const grouped = groupByIndicator([
      reading("juin", "i1"),
      reading("mai", "i1"),
      reading("avril", "i1"),
    ]);

    expect(grouped.get("i1")?.map((r) => r.id)).toEqual([
      "juin",
      "mai",
      "avril",
    ]);
  });

  test("aucun relevé rend une table vide, pas une entrée vide", () => {
    expect(groupByIndicator([]).size).toBe(0);
  });

  test("chaque série est un tableau distinct", () => {
    /* `curvesOf` inverse une **copie** de la série, précisément parce que ce
       tableau est partagé. Le vérifier ici, c'est vérifier que la copie a une
       raison d'être : deux indicateurs ne doivent jamais partager la même
       instance. */
    const grouped = groupByIndicator([
      reading("r1", "i1"),
      reading("r2", "i2"),
    ]);

    expect(grouped.get("i1")).not.toBe(grouped.get("i2"));
  });
});
