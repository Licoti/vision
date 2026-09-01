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
  contextMarkers,
  domains,
  entities,
  products,
  projectStatuses,
  projects,
  results,
} from "@/lib/db/schema";

import {
  curveTimeline,
  defaultWindow,
  listAccompanimentMarkers,
  listContextMarkers,
  listProductMarkers,
  mergeMarkers,
  monthBand,
  monthMark,
  monthTicks,
  timelineScale,
  timelineWindow,
  valueOffset,
  valueScale,
  neighbourReadings,
  windowMonths,
  windowYears,
  withinWindow,
  yearWindow,
  type ProductMarker,
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

describe("monthTicks — les graduations de l'axe", () => {
  test("le pas suit la largeur de la fenêtre, en trois paliers", () => {
    /* ≤ 8 mois → 2 · ≤ 16 → 3 · au-delà → 6. Le décompte suffit à les
       distinguer : 7 mois de pas 2 en donnent 4, de pas 3 en donneraient 3. */
    const narrow = timelineScale(["2026-01-01", "2026-07-01"]) as TimelineScale;
    const middle = timelineScale(["2026-01-01", "2027-01-01"]) as TimelineScale;
    const wide = timelineScale(["2024-01-01", "2026-12-01"]) as TimelineScale;

    expect(narrow.monthCount).toBe(7);
    expect(monthTicks(narrow).map((t) => t.month)).toEqual([
      "2026-01",
      "2026-03",
      "2026-05",
      "2026-07",
    ]);

    expect(middle.monthCount).toBe(13);
    expect(monthTicks(middle).map((t) => t.month)).toEqual([
      "2026-01",
      "2026-04",
      "2026-07",
      "2026-10",
      "2027-01",
    ]);

    expect(wide.monthCount).toBe(36);
    expect(monthTicks(wide).map((t) => t.month)).toEqual([
      "2024-01",
      "2024-07",
      "2025-01",
      "2025-07",
      "2026-01",
      "2026-07",
      "2026-12",
    ]);
  });

  test("le dernier mois est toujours gradué, même hors du pas", () => {
    /* Trente-six mois de pas 6 tombent sur le 31e ; la borne haute de l'axe
       doit être écrite, sans quoi la fenêtre n'a pas de fin lisible. */
    const scale = timelineScale(["2024-01-01", "2026-12-01"]) as TimelineScale;

    expect(monthTicks(scale).at(-1)?.month).toBe("2026-12");
  });

  test("la graduation tombe au bord gauche de la tranche de son mois", () => {
    // Le même modèle que `monthBand` : filets verticaux et barres s'alignent.
    const scale = timelineScale(["2024-03-01", "2026-02-01"]) as TimelineScale;
    const [first, second] = monthTicks(scale);

    expect(first?.left).toBe(0);
    expect(second?.month).toBe("2024-09");
    expect(second?.left).toBe(round((6 * 100) / 24));
    expect(monthBand(scale, "2024-09-01", null).left).toBe(second?.left);
  });

  test("le calage est positionnel : le premier au début, le dernier à la fin", () => {
    const scale = timelineScale(["2024-01-01", "2026-12-01"]) as TimelineScale;
    const ticks = monthTicks(scale);

    expect(ticks.at(0)?.anchor).toBe("start");
    expect(ticks.at(-1)?.anchor).toBe("end");
    expect(ticks.slice(1, -1).every((t) => t.anchor === "middle")).toBe(true);
    // Le milieu n'est pas vide : sans lui, les deux constats au-dessus
    // passeraient sur une graduation unique qui serait ses deux bouts.
    expect(ticks.slice(1, -1).length).toBeGreaterThan(0);
  });

  test("une fenêtre d'un seul mois porte une graduation, calée au début", () => {
    const scale = timelineScale(["2026-08-14"]) as TimelineScale;

    expect(monthTicks(scale)).toEqual([
      { month: "2026-08", left: 0, anchor: "start" },
    ]);
  });
});

/* ==========================================================================
   La fenêtre affichée — le filtre de période

   Ce que ces tests épinglent : **tout ce qui vient de l'URL**. Neutraliser le
   bornage, la garde des deux bornes ou la remise à l'endroit doit les faire
   tomber, eux et rien d'autre.
   ========================================================================== */

describe("timelineWindow — la fenêtre demandée par l'URL", () => {
  /* Mars 2024 → février 2026, vingt-quatre mois. */
  const scale = timelineScale(["2024-03-01", "2026-02-01"]) as TimelineScale;

  test("deux bornes valides font la fenêtre, bornes comprises", () => {
    expect(timelineWindow(scale, "2025-01", "2025-12")).toEqual<TimelineScale>({
      firstMonth: "2025-01",
      lastMonth: "2025-12",
      monthCount: 12,
    });
  });

  test("sans paramètre, la fenêtre est l'axe entier", () => {
    expect(timelineWindow(scale, undefined, undefined)).toEqual(scale);
    expect(timelineWindow(scale, null, null)).toEqual(scale);
  });

  test("une seule borne ne suffit pas : deviner l'autre serait inventer", () => {
    expect(timelineWindow(scale, "2025-01", undefined)).toEqual(scale);
    expect(timelineWindow(scale, undefined, "2025-12")).toEqual(scale);
  });

  test("un mois malformé est ignoré, jamais réinterprété", () => {
    /* « 2026-13 » n'est pas un mois : le lire comme janvier 2027 afficherait
       une fenêtre que personne n'a demandée. */
    for (const bad of ["oui", "2026", "2026-13", "2026-00", "26-01", ""]) {
      expect(timelineWindow(scale, bad, "2025-12")).toEqual(scale);
      expect(timelineWindow(scale, "2025-01", bad)).toEqual(scale);
    }
  });

  test("deux bornes à l'envers se remettent à l'endroit", () => {
    /* Les deux sélecteurs sont indépendants et sans JavaScript : choisir la fin
       avant le début est un geste courant. */
    expect(timelineWindow(scale, "2025-12", "2025-01")).toEqual(
      timelineWindow(scale, "2025-01", "2025-12"),
    );
  });

  test("rien n'élargit l'axe : une borne au-delà est ramenée dessus", () => {
    expect(timelineWindow(scale, "2000-01", "2099-12")).toEqual(scale);
  });

  test("les deux bornes sur le même mois font une fenêtre d'un mois", () => {
    expect(timelineWindow(scale, "2025-06", "2025-06")).toEqual<TimelineScale>({
      firstMonth: "2025-06",
      lastMonth: "2025-06",
      monthCount: 1,
    });
  });
});

describe("withinWindow — ce que la fenêtre laisse voir", () => {
  /* Janvier → décembre 2025. */
  const scale = timelineScale(["2025-01-01", "2025-12-01"]) as TimelineScale;

  test("une période entièrement antérieure ou postérieure est écartée", () => {
    expect(withinWindow(scale, "2024-01-01", "2024-12-31")).toBe(false);
    expect(withinWindow(scale, "2026-01-01", "2026-12-31")).toBe(false);
  });

  test("une période à cheval sur un bord est gardée", () => {
    expect(withinWindow(scale, "2024-06-01", "2025-03-31")).toBe(true);
    expect(withinWindow(scale, "2025-10-01", "2026-06-30")).toBe(true);
  });

  test("le contact sur un mois de bord suffit : les bornes sont comprises", () => {
    expect(withinWindow(scale, "2024-01-01", "2025-01-31")).toBe(true);
    expect(withinWindow(scale, "2025-12-01", "2026-12-31")).toBe(true);
    /* Un mois de trop de chaque côté, et le contact est rompu. */
    expect(withinWindow(scale, "2024-01-01", "2024-12-31")).toBe(false);
  });

  test("une période ouverte court jusqu'au bout du temps, pas jusqu'à l'axe", () => {
    /* Un accompagnement commencé en 2023 et jamais clos traverse toute fenêtre
       postérieure — y compris une fenêtre au-delà des données connues. */
    expect(withinWindow(scale, "2023-01-01", null)).toBe(true);
    /* Commencé après la fenêtre, il n'y entre pas pour autant. */
    expect(withinWindow(scale, "2026-01-01", null)).toBe(false);
  });

  test("une fin antérieure au début se lit comme le seul mois de début", () => {
    // La lecture de `monthBand`, tenue à l'identique.
    expect(withinWindow(scale, "2025-06-01", "2024-06-01")).toBe(true);
    expect(withinWindow(scale, "2024-06-01", "2023-06-01")).toBe(false);
  });
});

describe("windowYears / yearWindow / windowMonths — la matière du filtre", () => {
  const scale = timelineScale(["2024-03-01", "2026-02-01"]) as TimelineScale;

  test("les millésimes proposés sont ceux que les données couvrent", () => {
    /* Jamais une liste écrite en dur : un préréglage pour une année vide serait
       un bouton qui ne mène qu'au vide. */
    expect(windowYears(scale)).toEqual([2024, 2025, 2026]);
  });

  test("un préréglage d'année est borné à l'axe", () => {
    // 2024 commence en mars dans les données, 2026 s'arrête en février.
    expect(yearWindow(scale, 2024)).toEqual<TimelineScale>({
      firstMonth: "2024-03",
      lastMonth: "2024-12",
      monthCount: 10,
    });
    expect(yearWindow(scale, 2026)).toEqual<TimelineScale>({
      firstMonth: "2026-01",
      lastMonth: "2026-02",
      monthCount: 2,
    });
  });

  test("les mois des sélecteurs sont tous ceux de l'axe, dans l'ordre", () => {
    const months = windowMonths(scale);

    expect(months).toHaveLength(24);
    expect(months[0]).toBe("2024-03");
    expect(months[11]).toBe("2025-02");
    expect(months[23]).toBe("2026-02");
  });
});

/* ==========================================================================
   La fenêtre d'ouverture — 18/08/2026

   Ce que ces tests épinglent : l'année en cours quand l'axe la porte, et le
   **repli sur l'axe entier** quand il ne la porte pas. Neutraliser le repli
   doit faire tomber les deux derniers, et rien d'autre — sans lui, `yearWindow`
   rendrait une fenêtre d'un seul mois, écrasée contre une borne.
   ========================================================================== */

describe("defaultWindow — la fenêtre quand l'URL n'en demande aucune", () => {
  const scale = timelineScale(["2024-03-01", "2026-02-01"]) as TimelineScale;

  test("une année que l'axe couvre entièrement rend ses douze mois", () => {
    expect(defaultWindow(scale, 2025)).toEqual<TimelineScale>({
      firstMonth: "2025-01",
      lastMonth: "2025-12",
      monthCount: 12,
    });
  });

  test("une année que l'axe couvre en partie se borne à l'axe", () => {
    /* Les données s'arrêtent en février 2026 : la fenêtre s'arrête avec elles,
       et n'invente pas dix mois à venir. */
    expect(defaultWindow(scale, 2026)).toEqual<TimelineScale>({
      firstMonth: "2026-01",
      lastMonth: "2026-02",
      monthCount: 2,
    });
  });

  test("une année postérieure à l'axe rend l'axe entier", () => {
    /* Le piège que ce repli écarte : sans lui, `timelineWindow` ramènerait les
       deux bornes de 2027 sur février 2026 et rendrait une fenêtre d'un seul
       mois — une période affirmée que rien ne porte. */
    expect(defaultWindow(scale, 2027)).toEqual(scale);
  });

  test("une année antérieure à l'axe rend l'axe entier", () => {
    expect(defaultWindow(scale, 2023)).toEqual(scale);
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
  /* **Avant `projects` et `products`**, la règle « enfants d'abord » : un
     oubli ici laisse un domaine résiduel, et c'est le **fichier suivant** qui
     tombe, sur une résolution « premier domaine actif par nom ». */
  contextMarkers,
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
  /**
   * Une activité terminée **sans aucun résultat**. C'est elle que la jointure
   * gauche laisse passer, et la passer en jointure interne doit la faire
   * disparaître — elle seule.
   */
  bareActivityId: string;
  /** Un repère de contexte rattaché à un accompagnement vivant. */
  releaseMarkerId: string;
  /** Un repère de contexte sans accompagnement — le cas normal. */
  campaignMarkerId: string;
  /** Un repère de contexte rattaché à un accompagnement **archivé**. */
  orphanMarkerId: string;
};

const suffix = Math.random().toString(36).slice(2, 10);
let a: Fixture;
let b: Fixture;

/**
 * Trois produits, quatre accompagnements, six résultats et quatre repères de
 * contexte.
 *
 * Ce que la lecture doit **écarter** est écrit avec le reste : une activité
 * prévue, une activité annulée, une activité archivée, un accompagnement
 * archivé, un repère de contexte retiré, et un produit voisin.
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

  const audit = await scope.insert(activityTypes, {
    label: `Audit UX ${label}`,
    family: "evaluation",
    producesResult: true,
  });

  /* **Les dates ne vivent plus sur le projet** : sa période se déduit des
     périodes de ses activités (31/08/2026). Le cadrage porte donc la période
     que ces quatre projets annonçaient. Il ne porte aucun résultat — et il
     **entre malgré tout dans les repères** depuis que la lecture s'est élargie
     à toutes les activités terminées : un cadrage est un accompagnement
     réalisé. */
  const framing = await scope.insert(activityTypes, {
    label: `Cadrage ${label}`,
    family: "framing",
  });

  const project = async (
    name: string,
    productId: string,
    periodStart: string,
    periodEnd: string | null,
  ) => {
    const row = await scope.insert(projects, {
      name: `${name} ${label}`,
      productId,
      statusId: active.id,
    });
    await scope.insert(activities, {
      projectId: row.id,
      activityTypeId: framing.id,
      state: periodEnd ? "done" : "planned",
      periodStart,
      ...(periodEnd ? { periodEnd } : {}),
    });
    return row;
  };

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

  /* --- Ce que l'élargissement fait entrer, et ce qu'il laisse dehors ----- */

  /* **Une activité terminée sans aucun résultat** : c'est elle que la jointure
     gauche laisse passer, et la décision de ce ticket tient à elle seule. */
  const bare = await activity(current.id, "2025-04-01", "2025-04-30");

  /* Une activité **prévue** : elle n'a pas eu lieu, elle n'est pas un repère.
     Sans fin de période, elle n'aurait de toute façon pas d'abscisse. */
  await scope.insert(activities, {
    projectId: current.id,
    activityTypeId: audit.id,
    state: "planned",
    periodStart: "2026-09-01",
  });

  /* Une activité **annulée**, datée des deux bouts : c'est le seul cas écarté
     qui porterait une abscisse valide, donc le seul que le filtre d'état
     protège vraiment. */
  await scope.insert(activities, {
    projectId: current.id,
    activityTypeId: audit.id,
    state: "cancelled",
    periodStart: "2025-01-01",
    periodEnd: "2025-01-31",
    cancellationReason: `Annulée ${label}`,
  });

  /* --- Les repères de contexte ------------------------------------------- */

  const release = await scope.insert(contextMarkers, {
    productId: full.id,
    projectId: current.id,
    happenedOn: "2025-06-15",
    label: `Mise en production ${label}`,
    note: `Note de mise en production ${label}`,
  });

  /* Sans accompagnement — le cas normal : une campagne n'est pas la nôtre. */
  const campaign = await scope.insert(contextMarkers, {
    productId: full.id,
    happenedOn: "2024-11-01",
    label: `Campagne ${label}`,
  });

  /* Rattaché à un accompagnement **archivé** : la jointure gauche filtrée doit
     rendre l'identifiant **et** le nom à nul ensemble. Un identifiant sans nom
     mènerait vers une page qu'on ne saurait plus annoncer. */
  const orphan = await scope.insert(contextMarkers, {
    productId: full.id,
    projectId: archivedProject.id,
    happenedOn: "2023-05-05",
    label: `Repère orphelin ${label}`,
  });

  /* Retiré (règle 4) : il ne se lit plus, et il ne bloque pas sa place. */
  const retired = await scope.insert(contextMarkers, {
    productId: full.id,
    happenedOn: "2026-10-01",
    label: `Repère retiré ${label}`,
  });
  await scope.archive(contextMarkers, retired.id);

  /* Le produit voisin, pour les repères de contexte aussi. */
  await scope.insert(contextMarkers, {
    productId: other.id,
    happenedOn: "2026-03-01",
    label: `Repère du voisin ${label}`,
  });

  return {
    domainId: domain.id,
    scope,
    fullId: full.id,
    emptyId: empty.id,
    otherId: other.id,
    auditActivityId: auditActivity.id,
    complianceActivityId: compliance.id,
    bareActivityId: bare.id,
    releaseMarkerId: release.id,
    campaignMarkerId: campaign.id,
    orphanMarkerId: orphan.id,
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

describe("listAccompanimentMarkers — ce que la lecture rend", () => {
  test("toutes les activités terminées, de la plus ancienne fin à la plus récente", async () => {
    const rows = await listAccompanimentMarkers(a.scope, a.fullId);

    /* Les cinq activités terminées du produit, cadrages compris. Les résultats
       ont été écrits dans le désordre : sans l'`order by`, celui de 2026
       ouvrirait la liste. */
    expect(rows.map((row) => row.on)).toEqual([
      "2024-05-31",
      "2024-09-30",
      "2025-04-30",
      "2026-06-30",
      "2026-07-31",
    ]);
    expect(rows.every((row) => row.kind === "accompaniment")).toBe(true);
  });

  test("une activité terminée **sans résultat** est un repère", async () => {
    /* La décision du ticket, et elle tient à la jointure gauche : un atelier de
       restitution ou un cadrage sont des accompagnements réalisés. La passer en
       jointure interne doit faire tomber ce test, et lui seul avec ses voisins
       de la même famille. */
    const rows = await listAccompanimentMarkers(a.scope, a.fullId);
    const bare = rows.find((row) => row.id === a.bareActivityId);

    expect(bare).toMatchObject({
      kind: "accompaniment",
      on: "2025-04-30",
      label: "Audit UX a",
      projectName: "Autonomie a",
      resultLabel: null,
      resultValue: null,
      resultMeasuredOn: null,
    });
  });

  test("un repère porte son type, son accompagnement et son résultat", async () => {
    const rows = await listAccompanimentMarkers(a.scope, a.fullId);
    const audit = rows.find((row) => row.id === a.auditActivityId);

    expect(audit).toMatchObject({
      label: "Audit UX a",
      projectName: "Refonte a",
      resultLabel: "Score d'audit UX a",
      resultUnit: "/100",
      resultMeasuredOn: "2024-05-31",
    });
    // `numeric(18,4)` revient en chaîne du pilote : la lecture ne met pas en
    // forme, `formatResultValue` s'en charge à l'écran.
    expect(audit?.resultValue).toBe("62.0000");
  });

  test("la date du repère est la **fin d'activité**, jamais celle du résultat", async () => {
    /* Les deux diffèrent sur le repère de conformité : l'activité finit le 30
       juin, le résultat est mesuré le 30 aussi — mais c'est `period_end` qui
       porte l'abscisse, et `results.measured_on` qui reste sur la fiche. Le
       constat porte sur l'activité d'audit, où les deux coïncident, et sur le
       repère nu, où la seconde n'existe pas. */
    const rows = await listAccompanimentMarkers(a.scope, a.fullId);
    const bare = rows.find((row) => row.id === a.bareActivityId);

    expect(bare?.on).toBe("2025-04-30");
    expect(bare?.resultMeasuredOn).toBeNull();
  });

  test("un produit sans accompagnement rend une liste vide", async () => {
    expect(await listAccompanimentMarkers(a.scope, a.emptyId)).toEqual([]);
  });
});

describe("listAccompanimentMarkers — ce que la lecture écarte", () => {
  test("une activité **prévue** n'est pas un repère", async () => {
    const rows = await listAccompanimentMarkers(a.scope, a.fullId);

    expect(rows.map((row) => row.on)).not.toContain("2026-09-01");
  });

  test("une activité **annulée** n'est pas un repère", async () => {
    /* Le seul cas écarté qui porterait une abscisse valide : c'est donc lui qui
       éprouve le filtre d'état, et non l'activité prévue, que l'absence de fin
       de période écarterait de toute façon. */
    const rows = await listAccompanimentMarkers(a.scope, a.fullId);

    expect(rows.map((row) => row.on)).not.toContain("2025-01-31");
  });

  test("une activité archivée n'est plus un repère", async () => {
    const rows = await listAccompanimentMarkers(a.scope, a.fullId);

    expect(rows.map((row) => row.on)).not.toContain("2026-08-31");
  });

  test("un résultat retiré laisse son activité, sans sa valeur", async () => {
    /* L'élargissement retourne ce constat : avant, retirer le résultat retirait
       le repère. Désormais l'activité reste — elle a bien eu lieu — et c'est sa
       **valeur** qui disparaît. */
    const rows = await listAccompanimentMarkers(a.scope, a.fullId);
    const host = rows.find((row) => row.on === "2026-07-31");

    expect(host).toBeDefined();
    expect(host?.resultLabel).toBeNull();
  });

  test("les activités d'un accompagnement archivé n'ont plus de repère", async () => {
    /* La cohérence entre les deux couches : `listProductProjects` écarte
       l'accompagnement rangé, et un repère sans accompagnement lisible serait un
       fait orphelin. */
    const rows = await listAccompanimentMarkers(a.scope, a.fullId);

    expect(rows.map((row) => row.projectName)).not.toContain("Rangé a");
  });

  test("le repère du produit voisin ne déborde pas", async () => {
    const rows = await listAccompanimentMarkers(a.scope, a.fullId);
    const neighbour = await listAccompanimentMarkers(a.scope, a.otherId);

    expect(rows.map((row) => row.projectName)).not.toContain("Voisin a");
    expect(neighbour.map((row) => row.projectName)).toEqual([
      "Voisin a",
      "Voisin a",
    ]);
  });

  test("le produit d'un **autre domaine** ne rend rien", async () => {
    /* L'étanchéité : l'identifiant est réel, la lecture est faite sous l'autre
       domaine. Sans `filter` sur chaque table jointe, elle rendrait les repères
       du domaine b. */
    expect(await listAccompanimentMarkers(a.scope, b.fullId)).toEqual([]);
    expect(await listAccompanimentMarkers(b.scope, a.fullId)).toEqual([]);
  });
});

describe("listContextMarkers — la moitié manuelle de la couche", () => {
  test("les repères sortent du plus ancien au plus récent", async () => {
    const rows = await listContextMarkers(a.scope, a.fullId);

    expect(rows.map((row) => row.id)).toEqual([
      a.orphanMarkerId,
      a.campaignMarkerId,
      a.releaseMarkerId,
    ]);
    expect(rows.every((row) => row.kind === "context")).toBe(true);
  });

  test("un repère porte son intitulé, sa note et son accompagnement", async () => {
    const rows = await listContextMarkers(a.scope, a.fullId);
    const release = rows.find((row) => row.id === a.releaseMarkerId);

    expect(release).toMatchObject({
      on: "2025-06-15",
      label: "Mise en production a",
      note: "Note de mise en production a",
      projectName: "Autonomie a",
    });
  });

  test("un repère sans accompagnement est un état normal", async () => {
    const rows = await listContextMarkers(a.scope, a.fullId);
    const campaign = rows.find((row) => row.id === a.campaignMarkerId);

    expect(campaign?.projectId).toBeNull();
    expect(campaign?.projectName).toBeNull();
  });

  test("un accompagnement archivé rend l'identifiant **et** le nom à nul", async () => {
    /* La jointure gauche est filtrée sur l'archivage, et l'identifiant est lu
       **sur la jointure** : les deux tombent ensemble. Le lire sur la colonne
       aurait rendu un identifiant sans nom, donc un lien qu'on ne sait plus
       annoncer. */
    const rows = await listContextMarkers(a.scope, a.fullId);
    const orphan = rows.find((row) => row.id === a.orphanMarkerId);

    expect(orphan).toBeDefined();
    expect(orphan?.projectId).toBeNull();
    expect(orphan?.projectName).toBeNull();
  });

  test("aucun repère ne porte de résultat", async () => {
    /* Un repère de contexte n'est pas une mesure : les cinq colonnes de
       résultat sont nulles par construction, et c'est ce qui les distingue à la
       lecture comme à l'écran. */
    const rows = await listContextMarkers(a.scope, a.fullId);

    expect(
      rows.every((row) => row.resultLabel === null && row.resultUrl === null),
    ).toBe(true);
  });

  test("un repère retiré ne se lit plus", async () => {
    const rows = await listContextMarkers(a.scope, a.fullId);

    expect(rows.map((row) => row.label)).not.toContain("Repère retiré a");
  });

  test("le repère du produit voisin ne déborde pas", async () => {
    const rows = await listContextMarkers(a.scope, a.fullId);
    const neighbour = await listContextMarkers(a.scope, a.otherId);

    expect(rows.map((row) => row.label)).not.toContain("Repère du voisin a");
    expect(neighbour.map((row) => row.label)).toEqual(["Repère du voisin a"]);
  });

  test("le produit d'un **autre domaine** ne rend rien", async () => {
    expect(await listContextMarkers(a.scope, b.fullId)).toEqual([]);
    expect(await listContextMarkers(b.scope, a.fullId)).toEqual([]);
  });
});

describe("listProductMarkers — les deux natures sur un seul axe", () => {
  test("les huit repères se fondent dans l'ordre des dates", async () => {
    const rows = await listProductMarkers(a.scope, a.fullId);

    expect(rows.map((row) => [row.on, row.kind])).toEqual([
      ["2023-05-05", "context"],
      ["2024-05-31", "accompaniment"],
      ["2024-09-30", "accompaniment"],
      ["2024-11-01", "context"],
      ["2025-04-30", "accompaniment"],
      ["2025-06-15", "context"],
      ["2026-06-30", "accompaniment"],
      ["2026-07-31", "accompaniment"],
    ]);
  });

  test("un produit sans rien rend une liste vide", async () => {
    expect(await listProductMarkers(a.scope, a.emptyId)).toEqual([]);
  });
});

/* ==========================================================================
   Le tri de la fusion, l'axe, et les relevés voisins — purs, sans base
   ========================================================================== */

/** Un repère minimal : ces trois tests ne regardent que `on`, `id` et `kind`. */
function marker(
  on: string,
  id: string,
  kind: ProductMarker["kind"] = "accompaniment",
): ProductMarker {
  return {
    kind,
    id,
    on,
    label: id,
    note: null,
    projectId: null,
    projectName: null,
    resultLabel: null,
    resultValue: null,
    resultUnit: null,
    resultMeasuredOn: null,
    resultUrl: null,
  };
}

describe("mergeMarkers — le tri de la fusion", () => {
  test("les deux natures s'entremêlent par date", () => {
    const merged = mergeMarkers(
      [marker("2026-01-01", "a1"), marker("2026-03-01", "a2")],
      [marker("2026-02-01", "c1", "context")],
    );

    expect(merged.map((row) => row.id)).toEqual(["a1", "c1", "a2"]);
  });

  test("deux repères du même jour se départagent par identifiant", () => {
    /* Sans ce départage, l'ordre de deux repères de natures différentes posés
       le même jour dépendrait de l'implémentation du tri — donc varierait d'un
       rendu à l'autre, ce que le HTML servi ne doit jamais faire. */
    const merged = mergeMarkers(
      [marker("2026-01-01", "b")],
      [marker("2026-01-01", "a", "context")],
    );

    expect(merged.map((row) => row.id)).toEqual(["a", "b"]);
  });

  test("les entrées ne sont pas supposées triées", () => {
    const merged = mergeMarkers(
      [marker("2026-05-01", "tard"), marker("2024-01-01", "tôt")],
      [],
    );

    expect(merged.map((row) => row.id)).toEqual(["tôt", "tard"]);
  });

  test("deux listes vides rendent une liste vide", () => {
    expect(mergeMarkers([], [])).toEqual([]);
  });
});

describe("curveTimeline — l'axe contient les deux séries", () => {
  test("un repère hors de la fenêtre des relevés **élargit** l'axe", () => {
    /* Le défaut que cette fonction corrige : borné sur les seuls relevés, l'axe
       ramenait le repère de 2024 contre son bord (`clampIndex`), c'est-à-dire
       qu'il affirmait une date fausse. */
    const scale = curveTimeline(["2026-01-15", "2026-06-15"], ["2024-03-10"]);

    expect(scale).toEqual<TimelineScale>({
      firstMonth: "2024-03",
      lastMonth: "2026-06",
      monthCount: 28,
    });
  });

  test("un repère postérieur au dernier relevé élargit l'autre borne", () => {
    const scale = curveTimeline(["2026-01-15"], ["2026-09-01"]);

    expect(scale?.lastMonth).toBe("2026-09");
  });

  test("sans repère, l'axe est celui des seuls relevés", () => {
    /* Le témoin : sans lui, le test précédent passerait aussi sur une fonction
       qui élargirait toujours. */
    expect(curveTimeline(["2026-01-15", "2026-06-15"], [])).toEqual(
      timelineScale(["2026-01-15", "2026-06-15"]),
    );
  });

  test("des repères seuls suffisent à faire un axe", () => {
    expect(curveTimeline([], ["2025-02-01"])?.firstMonth).toBe("2025-02");
  });

  test("sans aucune date, il n'y a pas d'axe", () => {
    expect(curveTimeline([], [])).toBeNull();
  });
});

describe("neighbourReadings — la sélection, jamais un calcul", () => {
  const series = [
    { readOn: "2026-06-15", value: "71" },
    { readOn: "2026-01-10", value: "64" },
    { readOn: "2025-09-01", value: "63" },
  ];

  test("le dernier avant, le premier après", () => {
    const { before, after } = neighbourReadings(series, "2026-03-15");

    expect(before?.readOn).toBe("2026-01-10");
    expect(after?.readOn).toBe("2026-06-15");
  });

  test("un relevé du **jour même** compte comme « avant »", () => {
    /* La mesure existait quand l'activité s'est terminée ; la ranger « après »
       ferait dire à l'écran qu'elle lui succède. */
    const { before, after } = neighbourReadings(series, "2026-01-10");

    expect(before?.readOn).toBe("2026-01-10");
    expect(after?.readOn).toBe("2026-06-15");
  });

  test("avant le premier relevé, il n'y a pas de « avant »", () => {
    const { before, after } = neighbourReadings(series, "2024-01-01");

    expect(before).toBeNull();
    expect(after?.readOn).toBe("2025-09-01");
  });

  test("après le dernier, il n'y a pas de « après »", () => {
    const { before, after } = neighbourReadings(series, "2027-01-01");

    expect(before?.readOn).toBe("2026-06-15");
    expect(after).toBeNull();
  });

  test("une série vide rend deux absences", () => {
    expect(neighbourReadings([], "2026-01-01")).toEqual({
      before: null,
      after: null,
    });
  });

  test("l'ordre de la série ne change rien au résultat", () => {
    /* La sélection ne suppose aucun tri : un appelant qui changerait le sien ne
       casserait rien en silence. */
    const reversed = [...series].reverse();

    expect(neighbourReadings(reversed, "2026-03-15")).toEqual(
      neighbourReadings(series, "2026-03-15"),
    );
  });
});
