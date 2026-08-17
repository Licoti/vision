/**
 * Les tests de la frise du temps long (T5.5) : l'échelle, et la lecture des
 * repères.
 *
 * **Deux natures de test dans un fichier, et c'est voulu.** L'échelle est pure
 * — ni base, ni Next —, la lecture écrit et lit réellement sur la branche Neon
 * dédiée (`vitest.config.mts` remappe `DATABASE_URL` sur `TEST_DATABASE_URL`).
 * Les deux vivent ici parce que le module sous test est un, et parce que
 * séparer l'un de l'autre ferait croire que la position se vérifie ailleurs que
 * là où elle se calcule.
 *
 * Deux domaines sont amorcés, comme dans `indicators.test.ts` : sans un second
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
  results,
} from "@/lib/db/schema";

import {
  listProductMilestones,
  monthBand,
  monthMark,
  timelineScale,
  valueOffset,
  valueScale,
  yearTicks,
  type TimelineScale,
  type ValueScale,
} from "./timeline";

/* ==========================================================================
   L'échelle — pure, sans base

   Ce que ces tests épinglent : les bornes comprises, la fenêtre d'un seul
   mois, la période ouverte qui s'arrête à l'axe, et le fait que **rien ne
   déborde**. Neutraliser le calcul de borne doit les faire tomber, eux et
   rien d'autre.
   ========================================================================== */

describe("timelineScale — les bornes", () => {
  test("les bornes sont le premier et le dernier mois connus", () => {
    expect(
      timelineScale(["2024-03-01", "2024-09-30", "2026-02-01"]),
    ).toEqual<TimelineScale>({
      firstMonth: "2024-03",
      lastMonth: "2026-02",
      monthCount: 24,
    });
  });

  test("les bornes sont **comprises** : un seul mois fait une fenêtre d'un mois", () => {
    expect(timelineScale(["2026-08-14"])).toEqual<TimelineScale>({
      firstMonth: "2026-08",
      lastMonth: "2026-08",
      monthCount: 1,
    });
  });

  test("l'ordre des dates reçues n'y change rien", () => {
    const forward = timelineScale(["2024-03-01", "2026-06-30"]);
    const backward = timelineScale(["2026-06-30", "2024-03-01"]);

    expect(forward).toEqual(backward);
  });

  test("les dates absentes sont ignorées, jamais comptées comme aujourd'hui", () => {
    /* `docs/03` §7 : ce qui n'a pas de date se signale, il ne se positionne
       pas. Une borne posée sur `null` ferait entrer aujourd'hui dans l'axe. */
    expect(timelineScale([null, "2025-01-01", undefined, null])).toEqual({
      firstMonth: "2025-01",
      lastMonth: "2025-01",
      monthCount: 1,
    });
  });

  test("sans aucune date, il n'y a pas d'axe", () => {
    expect(timelineScale([])).toBeNull();
    expect(timelineScale([null, undefined])).toBeNull();
  });

  test("un mois de décembre et le janvier suivant sont deux mois consécutifs", () => {
    // Le passage d'année se lit sur la chaîne, jamais par un `Date` : c'est le
    // seul endroit où une arithmétique de mois peut se tromper d'un an.
    expect(timelineScale(["2024-12-31", "2025-01-01"])?.monthCount).toBe(2);
  });
});

describe("monthBand — la bande d'une période", () => {
  /* Mars 2024 → février 2026 : vingt-quatre mois, un mois vaut 100/24. */
  const scale = timelineScale(["2024-03-01", "2026-02-01"]) as TimelineScale;

  test("une période d'un seul mois occupe la tranche de ce mois", () => {
    expect(monthBand(scale, "2024-03-01", "2024-03-31")).toEqual({
      left: 0,
      width: round(100 / 24),
    });
  });

  test("une période couvre ses deux bornes comprises", () => {
    // Mars à septembre 2024 : sept mois, et non six.
    expect(monthBand(scale, "2024-03-01", "2024-09-30")).toEqual({
      left: 0,
      width: round((7 * 100) / 24),
    });
  });

  test("une période sans fin court jusqu'au bout de l'axe, et pas au-delà", () => {
    const band = monthBand(scale, "2026-02-01", null);

    expect(band.left).toBe(round((23 * 100) / 24));
    expect(band.width).toBe(round(100 / 24));
    expect(band.left + band.width).toBeCloseTo(100, 3);
  });

  test("aucune bande ne déborde de l'axe, même hors fenêtre", () => {
    // Deux dates antérieures et postérieures à la fenêtre : ramenées dedans.
    const band = monthBand(scale, "2020-01-01", "2030-01-01");

    expect(band.left).toBe(0);
    expect(band.width).toBe(100);
  });

  test("une fin antérieure au début rend le seul mois de début", () => {
    // Rien ne l'interdit en base ; une largeur négative, si.
    const band = monthBand(scale, "2025-06-01", "2024-06-01");

    expect(band.width).toBe(round(100 / 24));
    expect(band.left).toBe(round((15 * 100) / 24));
  });
});

describe("monthMark — la position d'un repère", () => {
  const scale = timelineScale(["2024-03-01", "2026-02-01"]) as TimelineScale;

  test("un repère se pose au milieu de la tranche de son mois", () => {
    expect(monthMark(scale, "2024-03-15")).toBe(round((0.5 * 100) / 24));
  });

  test("deux dates du même mois tombent au même endroit", () => {
    // L'unité de l'axe est le mois (D13) : c'est ce que Vision prétend savoir.
    expect(monthMark(scale, "2024-05-01")).toBe(monthMark(scale, "2024-05-31"));
  });

  test("un repère hors fenêtre est ramené dans l'axe", () => {
    expect(monthMark(scale, "2030-01-01")).toBeLessThan(100);
    expect(monthMark(scale, "2020-01-01")).toBeGreaterThan(0);
  });
});

describe("yearTicks — les graduations d'année", () => {
  test("un janvier compris dans la fenêtre porte son millésime", () => {
    const scale = timelineScale(["2024-03-01", "2026-02-01"]) as TimelineScale;

    expect(yearTicks(scale)).toEqual([
      { year: 2025, left: round((10 * 100) / 24) },
      { year: 2026, left: round((22 * 100) / 24) },
    ]);
  });

  test("une fenêtre dans une seule année n'en porte aucune", () => {
    const scale = timelineScale(["2026-03-01", "2026-09-01"]) as TimelineScale;

    expect(yearTicks(scale)).toEqual([]);
  });

  test("le janvier de la borne gauche n'est pas gradué", () => {
    /* Sa graduation tomberait sur le libellé de la borne, déjà écrit. */
    const scale = timelineScale(["2026-01-01", "2026-12-01"]) as TimelineScale;

    expect(yearTicks(scale)).toEqual([]);
  });
});

/* ==========================================================================
   L'échelle verticale d'une bande de courbe — T5.6

   Ce que ces tests épinglent : la cible comprise dans les bornes, la bande
   plate qui ne divise pas par zéro, et le fait que **rien ne déborde** de la
   bande. Neutraliser le calcul de position verticale doit les faire tomber, eux
   et rien d'autre.
   ========================================================================== */

describe("valueScale — les bornes d'une bande", () => {
  test("les bornes sont la plus petite et la plus grande des valeurs", () => {
    /* Les trois relevés du brief §7, écrits dans le désordre : c'est la
       fonction qui borne, pas l'ordre de la série. */
    expect(valueScale(["63.0000", "54.0000", "71.0000"])).toEqual<ValueScale>({
      min: 54,
      max: 71,
    });
  });

  test("la cible entre dans les bornes quand elle les dépasse", () => {
    /* Sans elle, le trait de cible tomberait hors de la bande — et une cible
       qu'on ne voit pas n'est pas un repère. */
    expect(valueScale(["54", "63", "71", "85"])).toEqual<ValueScale>({
      min: 54,
      max: 85,
    });
  });

  test("une seule valeur borne la bande sur elle-même", () => {
    expect(valueScale(["71.0000"])).toEqual<ValueScale>({ min: 71, max: 71 });
  });

  test("les valeurs illisibles sont ignorées, jamais comptées pour zéro", () => {
    /* `Number("")` vaut 0 : sans le rejet explicite, une valeur absente
       tirerait la borne basse à zéro et écraserait toute la courbe. */
    expect(valueScale([null, "54", undefined, "", "71", "  "])).toEqual({
      min: 54,
      max: 71,
    });
  });

  test("sans aucune valeur, il n'y a pas de bande", () => {
    expect(valueScale([])).toBeNull();
    expect(valueScale([null, undefined, ""])).toBeNull();
  });
});

describe("valueOffset — la hauteur d'une valeur dans sa bande", () => {
  const scale = valueScale(["54", "71", "85"]) as ValueScale;

  test("la borne basse est à 0, la borne haute à 100", () => {
    expect(valueOffset(scale, "54")).toBe(0);
    expect(valueOffset(scale, "85")).toBe(100);
  });

  test("une valeur au milieu est à mi-hauteur", () => {
    const middle = valueScale(["0", "100"]) as ValueScale;

    expect(valueOffset(middle, "50")).toBe(50);
    expect(valueOffset(middle, "25")).toBe(25);
  });

  test("une valeur intermédiaire se lit en pourcentage de l'écart des bornes", () => {
    // 63 entre 54 et 85 : neuf trente-et-unièmes de la hauteur.
    expect(valueOffset(scale, "63.0000")).toBe(round((9 * 100) / 31));
  });

  test("une bande plate pose tout au milieu, sans diviser par zéro", () => {
    const flat = valueScale(["71", "71"]) as ValueScale;

    expect(valueOffset(flat, "71")).toBe(50);
    expect(Number.isFinite(valueOffset(flat, "71"))).toBe(true);
  });

  test("une valeur hors bornes est ramenée dans la bande", () => {
    expect(valueOffset(scale, "0")).toBe(0);
    expect(valueOffset(scale, "1000")).toBe(100);
  });

  test("une valeur illisible se pose au milieu plutôt que nulle part", () => {
    expect(valueOffset(scale, "")).toBe(50);
  });
});

/** Le même arrondi que le module : quatre décimales, pour un HTML stable. */
function round(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

/* ==========================================================================
   Les repères — la lecture, en base réelle
   ========================================================================== */

/** Enfants d'abord, parents ensuite : `domains` refuse la suppression sinon. */
const teardownOrder = [
  results,
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
  /** Le produit qui porte les accompagnements et leurs résultats. */
  fullId: string;
  /** Un produit sans aucun résultat : la lecture doit être vide. */
  emptyId: string;
  /** Un second produit peuplé : ses repères ne doivent pas déborder. */
  otherId: string;
  /** L'activité d'audit du premier accompagnement — le repère de 2024. */
  auditActivityId: string;
  /** L'activité de conformité du second — le repère de 2026. */
  complianceActivityId: string;
};

const suffix = Math.random().toString(36).slice(2, 10);
let a: Fixture;
let b: Fixture;

/**
 * Trois produits, quatre accompagnements et six résultats : deux qui se lisent,
 * quatre que la lecture doit écarter — un résultat archivé, une activité
 * archivée, un accompagnement archivé, un produit voisin.
 *
 * Les résultats sont écrits **dans le désordre** par rapport à l'ordre attendu :
 * c'est la requête qui doit trier, pas la suite des insertions.
 *
 * Un résultat ne se rattache qu'à une activité **terminée** (`assertPreconditions`,
 * T1.3), et une activité terminée porte une fin de période
 * (`activities_done_requires_period_end`) : toutes les activités de la fixture
 * sont donc `done` et datées.
 */
async function seedDomain(label: string): Promise<Fixture> {
  const domain = await superAdmin.createDomain({
    name: `__test__timeline__${label}__${suffix}`,
    competenceCenterName: `Centre ${label}`,
  });
  const scope = forDomain({ domainId: domain.id });

  const entity = await scope.insert(entities, { label: `Entité ${label}` });
  const active = await scope.insert(projectStatuses, {
    label: `En cours ${label}`,
    nature: "active",
  });

  const product = async (name: string) =>
    scope.insert(products, { name: `${name} ${label}`, entityId: entity.id });

  const full = await product("Complet");
  const empty = await product("Vide");
  const other = await product("Voisin");

  const project = async (
    name: string,
    productId: string,
    startedOn: string,
    expectedEndOn: string | null,
  ) =>
    scope.insert(projects, {
      name: `${name} ${label}`,
      productId,
      statusId: active.id,
      startedOn,
      expectedEndOn,
    });

  const audit = await scope.insert(activityTypes, {
    label: `Audit UX ${label}`,
    family: "evaluation",
    producesResult: true,
  });

  const activity = async (
    projectId: string,
    periodStart: string,
    periodEnd: string,
  ) =>
    scope.insert(activities, {
      projectId,
      activityTypeId: audit.id,
      state: "done",
      periodStart,
      periodEnd,
    });

  const result = async (values: {
    activityId: string;
    label: string;
    value?: string | null;
    unit?: string | null;
    measuredOn: string;
  }) =>
    scope.insert(results, {
      activityId: values.activityId,
      label: `${values.label} ${label}`,
      value: values.value ?? null,
      unit: values.unit ?? null,
      measuredOn: values.measuredOn,
    });

  /* --- Les deux repères qui se lisent, écrits à rebours de leur ordre ----- */

  const past = await project("Refonte", full.id, "2024-03-01", "2024-09-30");
  const current = await project("Autonomie", full.id, "2026-02-01", null);

  const compliance = await activity(current.id, "2026-06-01", "2026-06-30");
  await result({
    activityId: compliance.id,
    label: "Taux de conformité",
    value: "68",
    unit: "%",
    measuredOn: "2026-06-30",
  });

  const auditActivity = await activity(past.id, "2024-05-01", "2024-05-31");
  await result({
    activityId: auditActivity.id,
    label: "Score d'audit UX",
    value: "62",
    unit: "/100",
    measuredOn: "2024-05-31",
  });

  /* --- Ce que la lecture doit écarter ------------------------------------ */

  /* Un résultat **retiré** (T4bis.6), le plus récent de tous : sans le filtre,
     il fermerait la liste au lieu d'en être absent. */
  const withdrawnHost = await activity(current.id, "2026-07-01", "2026-07-31");
  const withdrawn = await result({
    activityId: withdrawnHost.id,
    label: "Résultat retiré",
    value: "1",
    measuredOn: "2026-07-31",
  });
  await scope.archive(results, withdrawn.id);

  /* Une **activité archivée** qui porte un résultat vivant : c'est la jointure
     qui doit l'écarter, pas un filtre posé sur le résultat. */
  const archivedActivity = await activity(current.id, "2026-08-01", "2026-08-31");
  await result({
    activityId: archivedActivity.id,
    label: "Résultat d'activité archivée",
    value: "2",
    measuredOn: "2026-08-31",
  });
  await scope.archive(activities, archivedActivity.id);

  /* Un **accompagnement archivé** : ses repères n'ont plus de bande sous
     laquelle se lire, et `listProductProjects` l'écarte déjà de la liste. */
  const archivedProject = await project(
    "Rangé",
    full.id,
    "2023-01-01",
    "2023-06-30",
  );
  const onArchivedProject = await activity(
    archivedProject.id,
    "2023-02-01",
    "2023-02-28",
  );
  await result({
    activityId: onArchivedProject.id,
    label: "Résultat d'accompagnement rangé",
    value: "3",
    measuredOn: "2023-02-28",
  });
  await scope.archive(projects, archivedProject.id);

  /* Le **produit voisin** : son repère ne doit pas déborder sur l'autre. */
  const otherProject = await project(
    "Voisin",
    other.id,
    "2026-05-01",
    "2026-12-31",
  );
  const otherActivity = await activity(otherProject.id, "2026-05-01", "2026-05-31");
  await result({
    activityId: otherActivity.id,
    label: "Résultat du voisin",
    value: "4",
    measuredOn: "2026-05-31",
  });

  return {
    domainId: domain.id,
    scope,
    fullId: full.id,
    emptyId: empty.id,
    otherId: other.id,
    auditActivityId: auditActivity.id,
    complianceActivityId: compliance.id,
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

describe("listProductMilestones — ce que la lecture rend", () => {
  test("les repères sortent de la plus ancienne mesure à la plus récente", async () => {
    const rows = await listProductMilestones(a.scope, a.fullId);

    // Le résultat de 2026 a été écrit en premier : sans l'`order by`, il
    // ouvrirait la liste.
    expect(rows.map((row) => row.id)).toEqual([
      a.auditActivityId,
      a.complianceActivityId,
    ]);
  });

  test("un repère porte son activité, son accompagnement et son résultat", async () => {
    const rows = await listProductMilestones(a.scope, a.fullId);
    const audit = rows.find((row) => row.id === a.auditActivityId);

    expect(audit).toMatchObject({
      typeLabel: "Audit UX a",
      projectName: "Refonte a",
      resultLabel: "Score d'audit UX a",
      resultUnit: "/100",
      measuredOn: "2024-05-31",
    });
    // `numeric(18,4)` revient en chaîne du pilote : la lecture ne met pas en
    // forme, `formatResultValue` s'en charge à l'écran.
    expect(audit?.resultValue).toBe("62.0000");
  });

  test("un produit sans résultat rend une liste vide", async () => {
    expect(await listProductMilestones(a.scope, a.emptyId)).toEqual([]);
  });
});

describe("listProductMilestones — ce que la lecture écarte", () => {
  test("un résultat retiré n'a plus de repère", async () => {
    const rows = await listProductMilestones(a.scope, a.fullId);

    expect(rows.map((row) => row.resultLabel)).not.toContain(
      "Résultat retiré a",
    );
  });

  test("le résultat d'une activité archivée n'a plus de repère", async () => {
    const rows = await listProductMilestones(a.scope, a.fullId);

    expect(rows.map((row) => row.resultLabel)).not.toContain(
      "Résultat d'activité archivée a",
    );
  });

  test("le résultat d'un accompagnement archivé n'a plus de repère", async () => {
    /* La cohérence entre les deux couches : `listProductProjects` écarte
       l'accompagnement rangé, donc sa bande n'existe pas, et un repère sans
       bande sous laquelle se lire serait un fait orphelin. */
    const rows = await listProductMilestones(a.scope, a.fullId);

    expect(rows.map((row) => row.resultLabel)).not.toContain(
      "Résultat d'accompagnement rangé a",
    );
  });

  test("le repère du produit voisin ne déborde pas", async () => {
    const rows = await listProductMilestones(a.scope, a.fullId);
    const neighbour = await listProductMilestones(a.scope, a.otherId);

    expect(rows.map((row) => row.resultLabel)).not.toContain(
      "Résultat du voisin a",
    );
    expect(neighbour.map((row) => row.resultLabel)).toEqual([
      "Résultat du voisin a",
    ]);
  });

  test("le produit d'un **autre domaine** ne rend rien", async () => {
    /* L'étanchéité : l'identifiant est réel, la lecture est faite sous l'autre
       domaine. Sans `filter` sur chaque table jointe, elle rendrait les deux
       repères du domaine b. */
    expect(await listProductMilestones(a.scope, b.fullId)).toEqual([]);
    expect(await listProductMilestones(b.scope, a.fullId)).toEqual([]);
  });
});
