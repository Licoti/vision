/**
 * Les tests des lectures d'indicateurs : les indicateurs d'un produit avec leur
 * dernier relevé (T5.1), leur série datée (T5.3), et l'adoption par un
 * accompagnement (T5.4).
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
  projectIndicators,
  projectStatuses,
  projects,
} from "@/lib/db/schema";

import {
  listAdoptableIndicators,
  listProductIndicators,
  listProductReadings,
  listProjectAdoptions,
  type ProductIndicator,
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

  /* « Autonomie » porte les trois valeurs, « Doublon » n'en porte aucune : les
     colonnes sont toutes nullables (`docs/04` §3), et l'écran doit rendre les
     deux cas. Elles sont écrites **dans le désordre alphabétique**, comme les
     indicateurs : c'est la requête qui trie. */
  await scope.insert(projectIndicators, {
    projectId: adopter.id,
    indicatorId: tie.id,
  });

  const autonomyAdoption = await scope.insert(projectIndicators, {
    projectId: adopter.id,
    indicatorId: autonomy.id,
    baselineValue: "54",
    targetValue: "85",
    finalValue: "71",
  });

  /* L'adoption d'un indicateur **archivé**. Elle n'est plus atteignable par
     l'interface depuis que l'arbitrage (e) refuse d'archiver un indicateur
     adopté, mais des lignes antérieures la portent — et c'est l'`innerJoin` qui
     doit l'écarter, pas un filtre posé sur l'adoption. */
  const archivedAdoption = await scope.insert(projectIndicators, {
    projectId: adopter.id,
    indicatorId: archived.id,
    targetValue: "100",
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

  test("une adoption rend ses trois valeurs, le libellé et le dernier relevé", async () => {
    const rows = await listProjectAdoptions(a.scope, a.adopterId);
    const autonomy = rows.find((row) => row.id === a.autonomyAdoptionId);

    expect(autonomy).toMatchObject({
      indicatorId: a.autonomyId,
      label: "Autonomie a",
      // L'unité vient de l'indicateur : les quatre chiffres la partagent.
      unit: "%",
      baselineValue: "54.0000",
      targetValue: "85.0000",
      finalValue: "71.0000",
      lastValue: "71.0000",
      lastReadOn: "2026-06-01",
    });
  });

  test("les trois valeurs sont nulles quand rien n'est saisi", async () => {
    /* Les colonnes sont nullables (`docs/04` §3) : une adoption qui ne fixe
       aucune cible est une adoption normale, et l'écran le dit plutôt que de
       poser un zéro. */
    const rows = await listProjectAdoptions(a.scope, a.adopterId);
    const tie = rows.find((row) => row.indicatorId === a.tieId);

    expect(tie).toMatchObject({
      baselineValue: null,
      targetValue: null,
      finalValue: null,
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
