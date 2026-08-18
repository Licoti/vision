/**
 * Le temps long de la page produit : ce qu'il a besoin de lire, et les échelles
 * sur lesquelles il se dessine (`docs/06` §6, D26 — « la couche temps long
 * attend C5 »).
 *
 * **Deux blocs le consomment**, et c'est le seul endroit où leurs positions se
 * calculent : la **roadmap** (`components/products/roadmap.tsx`) — une bande par
 * accompagnement, un repère par activité porteuse d'un résultat — et les
 * **courbes d'indicateurs** (`components/products/indicator-curves.tsx`), une
 * bande de courbe par indicateur. Les deux ont porté le même axe jusqu'au
 * 17/08/2026 ; ils en portent désormais un chacun, et seule la roadmap est
 * filtrable. L'écart à l'arbitrage (d) de `tickets-C5.md` est consigné dans
 * `JOURNAL-TECHNIQUE.md`.
 *
 * Aucune couche ne demande de lecture neuve à ce module hors les repères :
 * `listProductProjects`, `listProductIndicators` et `listProductReadings`
 * rendent déjà tout le reste pour les blocs de la page. Ce module porte donc les
 * **repères**, et les **échelles** — celle du temps, avec sa fenêtre, et celle
 * des valeurs, propre à chaque courbe.
 *
 * **Ce module ne calcule aucun indice.** Il rend des faits datés — un résultat
 * reporté d'un outil externe, avec sa date — et des **positions** sur un axe.
 * Une position n'est pas un indice au sens de D39 : elle ne qualifie ni un
 * projet, ni une personne, ni une entité ; elle situe une date entre deux
 * bornes, et c'est le lecteur qui juxtapose. Aucun écart, aucune tendance,
 * aucune causalité — `docs/03` §7 nomme le « +12 % depuis l'accompagnement »
 * comme le point de bascule.
 *
 * La lecture joint, donc elle passe par `joinedRead`, et **chaque table jointe
 * porte `filter(table)`** : c'est la condition posée par l'en-tête de
 * `joinedRead`, et un oubli serait une fuite que rien d'autre ne rattraperait.
 *
 * Ce module n'importe pas `db` : il reçoit un `ScopedDb` déjà lié au domaine
 * courant. Règle 1.
 */

import { and, asc, eq, isNull } from "drizzle-orm";

import type { ScopedDb } from "@/lib/db/scoped";
import {
  activities,
  activityTypes,
  projects,
  results,
} from "@/lib/db/schema";

/* ==========================================================================
   Les repères — les activités porteuses d'un résultat
   ========================================================================== */

/** Un repère de la frise : l'activité, son résultat, et de quoi le nommer. */
export type TimelineMilestone = {
  /** L'identifiant de l'**activité** : c'est elle que la frise positionne. */
  id: string;
  projectId: string;
  /** Le nom de l'accompagnement, pour nommer le repère hors de sa bande. */
  projectName: string;
  /** Le libellé du type, **archivé compris** : on décrit, on ne propose pas. */
  typeLabel: string;
  objective: string | null;
  resultLabel: string;
  /**
   * `numeric(18,4)` : le pilote rend la chaîne brute — « 62.0000 » et non 62.
   * La mise en forme appartient à `lib/format`, jamais à la lecture.
   */
  resultValue: string | null;
  resultUnit: string | null;
  /**
   * La date de mesure, « YYYY-MM-DD » — colonne `date`, **non nulle en base**.
   *
   * C'est elle qui positionne le repère, et non la période de l'activité
   * (arbitrage du 16/08/2026) : elle est toujours renseignée, donc aucun repère
   * n'est écarté faute de date, et c'est la valeur que D39 autorise à reporter
   * « avec sa date ». Une activité, elle, peut n'avoir aucune période — et
   * `docs/03` §7 interdit de positionner arbitrairement ce qui n'a pas de date.
   */
  measuredOn: string;
};

/**
 * Les activités d'un produit qui portent un résultat vivant, de la plus
 * ancienne mesure à la plus récente.
 *
 * **Une seule lecture pour toute la couche**, quel que soit le nombre
 * d'accompagnements : la frise ne descend pas projet par projet.
 *
 * `results` est la table de départ, et les trois jointures sont internes : elles
 * **sont** la question. `activities` porte le rattachement et l'archivage,
 * `projects` porte le produit et son propre archivage, `activityTypes` porte le
 * libellé. Chacune filtrée sur le domaine — la règle du fichier, et sans elle un
 * `activity_id` d'un autre domaine rendrait son type.
 *
 * **Les accompagnements archivés sont écartés parce que `listProductProjects` les
 * écarte déjà** : un repère sans bande sous laquelle se lire serait un fait
 * orphelin sur un axe qui ne le porte plus. La cohérence entre les deux couches
 * prime, et c'est la même règle qui vaut entre le bloc « Indicateurs adoptés » et
 * la page produit depuis T5.4.
 *
 * L'unicité partielle de T4bis.6 garantit **un résultat vivant au plus par
 * activité** : une ligne rendue est un repère, sans regroupement à faire.
 *
 * Le tri est par date de mesure, `id` départageant deux mesures du même jour :
 * un ordre qui varierait d'un affichage à l'autre serait un défaut — la règle de
 * tri de `listProjectResources`.
 */
export function listProductMilestones(
  scope: ScopedDb,
  productId: string,
): Promise<TimelineMilestone[]> {
  return scope.joinedRead(async (database, { filter }) => {
    return database
      .select({
        id: activities.id,
        projectId: projects.id,
        projectName: projects.name,
        typeLabel: activityTypes.label,
        objective: activities.objective,
        resultLabel: results.label,
        resultValue: results.value,
        resultUnit: results.unit,
        measuredOn: results.measuredOn,
      })
      .from(results)
      .innerJoin(
        activities,
        and(
          eq(activities.id, results.activityId),
          filter(activities),
          isNull(activities.archivedAt),
        ),
      )
      .innerJoin(
        projects,
        and(
          eq(projects.id, activities.projectId),
          filter(projects),
          isNull(projects.archivedAt),
          eq(projects.productId, productId),
        ),
      )
      .innerJoin(
        activityTypes,
        and(
          eq(activityTypes.id, activities.activityTypeId),
          filter(activityTypes),
        ),
      )
      .where(and(filter(results), isNull(results.archivedAt)))
      .orderBy(asc(results.measuredOn), asc(results.id));
  });
}

/* ==========================================================================
   L'échelle — pure, sans base et sans Next

   Les positions se calculent ici, jamais dans le composant : une position est
   une propriété qu'on éprouve par un test, et un pourcentage écrit au milieu
   d'un JSX ne s'éprouve pas.

   **Le temps se lit au mois** (D13). L'unité de l'axe est donc le mois, et non
   le jour : deux relevés du même mois tombent au même endroit, ce qui est
   exactement ce que Vision prétend savoir.
   ========================================================================== */

/**
 * La fenêtre temporelle de la frise : deux bornes au mois, et leur écart.
 *
 * Les bornes sont **comprises** : une frise dont tout tient dans un seul mois
 * porte `monthCount = 1`, et sa bande occupe toute la largeur.
 */
export type TimelineScale = {
  /** Le premier mois de l'axe, « YYYY-MM ». */
  firstMonth: string;
  /** Le dernier mois de l'axe, « YYYY-MM ». Jamais avant le premier. */
  lastMonth: string;
  /** Le nombre de mois, bornes comprises. Au moins 1. */
  monthCount: number;
};

/** Une position en pourcentage de la largeur de l'axe. */
type Percent = number;

/**
 * L'indice d'un mois, lu **sur la chaîne** et jamais par un `Date`.
 *
 * `lib/format.ts` documente pourquoi une colonne `date` ne traverse pas un
 * fuseau sans dommage : « YYYY-MM-DD » remonté en `Date` recule d'un mois sur un
 * serveur à l'ouest dès que la date tombe un premier. Une position n'a besoin
 * d'aucun objet temps — l'année et le mois se lisent à la position fixe où
 * PostgreSQL les écrit.
 */
function monthIndex(day: string): number {
  return Number(day.slice(0, 4)) * 12 + Number(day.slice(5, 7)) - 1;
}

/** L'inverse : « YYYY-MM » depuis un indice. */
function monthKey(index: number): string {
  const year = Math.floor(index / 12);
  const month = index - year * 12 + 1;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
}

/**
 * Quatre décimales : le HTML servi doit être **stable d'un rendu à l'autre**
 * pour se relire et se tester. Un tiers non arrondi rendrait dix-sept chiffres,
 * et la moindre différence de plateforme se lirait dans le balisage.
 */
function round(value: number): Percent {
  return Math.round(value * 10_000) / 10_000;
}

/**
 * La fenêtre déduite de toutes les dates connues, du premier mois au dernier.
 *
 * **Elle reçoit une liste de dates, et non des projets** : c'est ce qui permet à
 * T5.6 d'y ajouter les dates de relevé sans que le calcul de borne change d'une
 * ligne, et à l'axe de rester **commun** aux couches qu'on empile dessus.
 *
 * « Du premier début connu au dernier terme connu » se lit ainsi, et ne peut pas
 * se lire autrement : sur la fixture, le dernier *terme* d'accompagnement est
 * septembre 2024, alors qu'un accompagnement court depuis février 2026 et qu'un
 * résultat est mesuré en juin 2026. Une borne haute posée sur les seules fins
 * laisserait les deux hors de l'axe.
 *
 * Rend `null` quand aucune date n'est connue : il n'y a alors pas d'axe, et
 * l'état vide appartient à l'écran (règle 5).
 */
export function timelineScale(
  days: readonly (string | null | undefined)[],
): TimelineScale | null {
  let first: number | null = null;
  let last: number | null = null;

  for (const day of days) {
    if (!day) continue;
    const index = monthIndex(day);
    if (!Number.isFinite(index)) continue;
    if (first === null || index < first) first = index;
    if (last === null || index > last) last = index;
  }

  if (first === null || last === null) return null;

  return {
    firstMonth: monthKey(first),
    lastMonth: monthKey(last),
    monthCount: last - first + 1,
  };
}

/** Ramène un indice de mois dans la fenêtre : **rien ne déborde de l'axe**. */
function clampIndex(scale: TimelineScale, day: string): number {
  const first = monthIndex(`${scale.firstMonth}-01`);
  const last = monthIndex(`${scale.lastMonth}-01`);
  return Math.min(Math.max(monthIndex(day), first), last);
}

/**
 * La bande d'une période : sa gauche et sa largeur, en pourcentage de l'axe.
 *
 * **Bornes comprises** : un accompagnement qui commence et finit dans le même
 * mois occupe la tranche entière de ce mois, et non une largeur nulle. Un mois
 * vaut `100 / monthCount` pour cent.
 *
 * **Une période ouverte court jusqu'au bout de l'axe** (arbitrage du
 * 16/08/2026) : `to` vaut `null` et la bande s'arrête à la borne, jamais
 * au-delà. Ce n'est pas une fin inventée — c'est l'axe qui l'arrête, et la
 * période reste écrite « depuis février 2026 » à côté de la bande.
 *
 * Toute borne hors fenêtre est ramenée dedans, et une fin antérieure au début
 * — que rien n'interdit en base — rend la bande du seul mois de début plutôt
 * qu'une largeur négative.
 */
export function monthBand(
  scale: TimelineScale,
  from: string,
  to: string | null,
): { left: Percent; width: Percent } {
  const first = monthIndex(`${scale.firstMonth}-01`);
  const start = clampIndex(scale, from);
  const end = to
    ? Math.max(clampIndex(scale, to), start)
    : first + scale.monthCount - 1;

  return {
    left: round(((start - first) / scale.monthCount) * 100),
    width: round(((end - start + 1) / scale.monthCount) * 100),
  };
}

/**
 * La position d'un repère : le **milieu** de la tranche de son mois.
 *
 * Au milieu et non au bord, parce que le repère dit « ce mois-là » et non « le
 * premier du mois » : posé au bord, il se lirait comme la frontière entre deux
 * mois, et un repère de janvier viendrait se coller à la graduation de l'année.
 */
export function monthMark(scale: TimelineScale, day: string): Percent {
  const first = monthIndex(`${scale.firstMonth}-01`);
  return round(((clampIndex(scale, day) - first + 0.5) / scale.monthCount) * 100);
}

/** Une graduation de l'axe : son mois, sa position, et son calage. */
export type TimelineTick = {
  /** Le mois gradué, « YYYY-MM ». La mise en forme appartient à `lib/format`. */
  month: string;
  left: Percent;
  /**
   * De quel côté le libellé se cale sur sa position.
   *
   * Sans lui, les libellés des deux bouts débordent de la boîte : centré sur 0 %,
   * « mars 2024 » sort à gauche de la moitié de sa largeur. Le calage est
   * **positionnel et non métrique** — le premier au début, le dernier à la fin,
   * les autres centrés —, ce qui le rend vrai quelle que soit la largeur rendue,
   * là où un seuil en pourcentage ne vaudrait que pour une largeur donnée.
   */
  anchor: "start" | "middle" | "end";
};

/**
 * Les graduations de l'axe — un mois, un libellé, à pas adaptatif.
 *
 * Le pas suit la largeur de la fenêtre plutôt qu'une règle fixe : sur trois ans
 * un libellé par semestre suffit, sur six mois il n'en resterait qu'un. Les
 * trois paliers sont ceux de la maquette (`docs/design/maquettes/blocs/roadmap`).
 *
 * **Le dernier mois est toujours gradué**, même quand le pas ne tombe pas
 * dessus : c'est la borne haute de l'axe, et une fenêtre dont la fin n'est pas
 * écrite ne se lit pas. Le premier l'est par construction.
 *
 * La position se compte en **tranches de mois**, comme `monthBand` et
 * `monthMark` : la graduation d'un mois tombe au bord gauche de sa tranche, donc
 * exactement là où commence la bande d'un accompagnement qui démarre ce mois-là.
 * Les filets verticaux et les barres s'alignent, ce qui est tout l'intérêt.
 */
export function monthTicks(scale: TimelineScale): TimelineTick[] {
  const first = monthIndex(`${scale.firstMonth}-01`);
  const last = first + scale.monthCount - 1;
  const step = scale.monthCount <= 8 ? 2 : scale.monthCount <= 16 ? 3 : 6;

  const indexes: number[] = [];
  for (let index = first; index <= last; index += step) indexes.push(index);
  if (indexes[indexes.length - 1] !== last) indexes.push(last);

  return indexes.map((index, order) => ({
    month: monthKey(index),
    left: round(((index - first) / scale.monthCount) * 100),
    anchor:
      order === 0
        ? ("start" as const)
        : order === indexes.length - 1
          ? ("end" as const)
          : ("middle" as const),
  }));
}

/* ==========================================================================
   La fenêtre affichée — le filtre de période de la roadmap

   La roadmap déduit son axe des données, puis le **restreint** à ce que l'URL
   demande. Les deux temps sont distincts et le second ne peut pas élargir le
   premier : on ne montre pas un axe qui va au-delà de ce que le produit porte.

   Tout ce qui vient de l'URL entre par ici, et par nulle part ailleurs. C'est
   ce qui permet de l'éprouver par un test plutôt que de le croire sur un écran.
   ========================================================================== */

/** « YYYY-MM », et rien d'autre — un mois d'URL est accepté ou ignoré. */
const MONTH_PARAM = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * La fenêtre demandée par l'URL, ramenée dans ce que les données portent.
 *
 * **Les deux bornes ou aucune.** Un seul paramètre est une URL incomplète, et
 * deviner l'autre reviendrait à afficher une fenêtre que personne n'a demandée :
 * on retombe alors sur l'axe entier, qui est l'état sans filtre. Idem pour un
 * mois malformé — « 2026-13 » n'est pas un mois, et le lire comme janvier 2027
 * serait une invention.
 *
 * **Deux bornes à l'envers se remettent à l'endroit.** Les deux sélecteurs sont
 * indépendants et sans JavaScript pour les contraindre l'un à l'autre : choisir
 * la fin avant le début est un geste courant, pas une URL malveillante. L'ordre
 * dans lequel on a désigné deux mois ne porte aucune information — l'intervalle
 * entre eux, si.
 *
 * **Rien n'élargit l'axe** : une borne au-delà des données est ramenée sur la
 * borne des données, jamais l'inverse.
 */
export function timelineWindow(
  scale: TimelineScale,
  de: string | null | undefined,
  a: string | null | undefined,
): TimelineScale {
  const first = monthIndex(`${scale.firstMonth}-01`);
  const last = first + scale.monthCount - 1;

  const read = (value: string | null | undefined): number | null => {
    if (!value || !MONTH_PARAM.test(value)) return null;
    const index = monthIndex(`${value}-01`);
    if (!Number.isFinite(index)) return null;
    return Math.min(Math.max(index, first), last);
  };

  const from = read(de);
  const to = read(a);
  if (from === null || to === null) return scale;

  const start = Math.min(from, to);
  const end = Math.max(from, to);

  return {
    firstMonth: monthKey(start),
    lastMonth: monthKey(end),
    monthCount: end - start + 1,
  };
}

/**
 * Une période coupe-t-elle la fenêtre ? Bornes comprises des deux côtés.
 *
 * **Sans ce test, rien ne disparaîtrait.** `monthBand` ramène toute borne dans
 * la fenêtre (`clampIndex`), si bien qu'un accompagnement de 2024 regardé à
 * travers une fenêtre 2026 rendrait une barre écrasée contre le bord gauche —
 * une bande qui affirme une présence que la période dément. Ce prédicat est ce
 * qui l'écarte, et le décompte des écartés est ce qui l'annonce à l'écran.
 *
 * Une période ouverte court jusqu'au bout du temps, et non jusqu'au bout de
 * l'axe : elle coupe toute fenêtre qui commence après son début, y compris une
 * fenêtre entièrement postérieure aux données connues.
 */
export function withinWindow(
  scale: TimelineScale,
  from: string,
  to: string | null,
): boolean {
  const first = monthIndex(`${scale.firstMonth}-01`);
  const last = first + scale.monthCount - 1;

  const start = monthIndex(from);
  if (!Number.isFinite(start)) return false;

  /* Une fin antérieure au début — que rien n'interdit en base — se lit comme le
     seul mois de début, exactement comme `monthBand` la lit. */
  const end = to ? Math.max(monthIndex(to), start) : Number.POSITIVE_INFINITY;

  return start <= last && end >= first;
}

/**
 * Les millésimes que les préréglages du filtre proposent.
 *
 * Déduits des données, jamais écrits en dur : la maquette liste 2024 à 2027
 * parce que ses trois accompagnements factices tiennent là-dedans. Un préréglage
 * pour une année où le produit n'a rien serait un bouton qui ne mène qu'au vide.
 *
 * Reçoit l'axe **entier**, et non la fenêtre courante : les préréglages ne se
 * réduisent pas à mesure qu'on filtre, sans quoi on ne pourrait plus revenir.
 */
export function windowYears(scale: TimelineScale): number[] {
  const firstYear = Number(scale.firstMonth.slice(0, 4));
  const lastYear = Number(scale.lastMonth.slice(0, 4));
  const years: number[] = [];

  for (let year = firstYear; year <= lastYear; year += 1) years.push(year);

  return years;
}

/** Les douze mois d'un millésime, bornés à l'axe — la cible d'un préréglage. */
export function yearWindow(scale: TimelineScale, year: number): TimelineScale {
  return timelineWindow(scale, `${year}-01`, `${year}-12`);
}

/**
 * La fenêtre d'ouverture du bloc, quand l'URL n'en demande aucune : **l'année en
 * cours, de janvier à décembre** (demande du 18/08/2026).
 *
 * L'axe entier était l'état par défaut jusque-là. Il écrase l'année courante
 * contre toute l'histoire du produit, alors que le bloc s'appelle désormais
 * « Accompagnements en cours » : c'est la fenêtre qui porte ce nom, et non un
 * filtre sur le statut — un accompagnement terminé en mars reste dessiné, la
 * liste du bas restant celle qui porte tout.
 *
 * **Le repli sur l'axe entier est ce qui rend la règle honnête.** Sans lui,
 * `yearWindow` ramènerait `2026-01` et `2026-12` sur la borne haute d'un produit
 * dont l'histoire s'arrête en 2024 (`timelineWindow` borne, il n'écarte pas) et
 * rendrait une fenêtre **d'un seul mois** — une période affirmée que rien ne
 * porte, exactement le piège que `withinWindow` a corrigé pour les bandes.
 *
 * Une année partiellement couverte se borne, elle : un produit dont la dernière
 * date connue est juin 2026 s'ouvre sur janvier → juin 2026, ce que `yearWindow`
 * fait déjà.
 *
 * L'année arrive en argument plutôt que d'être lue ici : une fonction qui lit
 * l'horloge ne s'éprouve pas par un test. L'appelant la lit, ce module la pose.
 */
export function defaultWindow(
  scale: TimelineScale,
  year: number,
): TimelineScale {
  /* Les millésimes se lisent sur la chaîne, jamais par un `Date` — la règle du
     module, et `monthIndex` la documente. */
  const firstYear = Number(scale.firstMonth.slice(0, 4));
  const lastYear = Number(scale.lastMonth.slice(0, 4));

  if (year < firstYear || year > lastYear) return scale;

  return yearWindow(scale, year);
}

/**
 * Tous les mois de l'axe, du premier au dernier — les options des sélecteurs.
 *
 * Reçoit l'axe entier pour la raison de `windowYears` : une fenêtre resserrée ne
 * doit pas retirer des sélecteurs les mois qui permettraient de l'élargir.
 */
export function windowMonths(scale: TimelineScale): string[] {
  const first = monthIndex(`${scale.firstMonth}-01`);
  const months: string[] = [];

  for (let index = 0; index < scale.monthCount; index += 1) {
    months.push(monthKey(first + index));
  }

  return months;
}

/* ==========================================================================
   L'échelle verticale d'une bande de courbe — T5.6

   **Une échelle par bande, jamais une pour toutes** (arbitrage (d) de
   `tickets-C5.md`) : superposer un pourcentage et des secondes sur un même axe
   vertical fabriquerait une comparaison que personne n'a demandée. C'est l'axe
   **temporel** qui est partagé — celui de T5.5, juste au-dessus —, jamais
   l'échelle des valeurs.

   Ces deux fonctions vivent ici et non dans `lib/queries/indicators.ts` : la
   position verticale est la sœur de `monthBand` et de `monthMark`, et les
   séparer ferait chercher la moitié d'un dessin dans un module de lecture.
   Écart d'un fichier au périmètre de la fiche, consigné dans
   `JOURNAL-TECHNIQUE.md`.

   **Une position n'est pas un indice** (D39), pas plus verticalement
   qu'horizontalement : elle situe une valeur entre deux bornes qui sont
   elles-mêmes des valeurs reportées. Aucun écart, aucune tendance, aucune
   moyenne — le segment entre deux relevés joint deux faits, il n'en invente pas
   un troisième.
   ========================================================================== */

/** Les deux bornes verticales d'une bande de courbe. */
export type ValueScale = {
  /** La plus basse des valeurs de la bande. */
  min: number;
  /** La plus haute. Jamais inférieure à `min`. */
  max: number;
};

/**
 * Ce qu'une valeur brute vaut en nombre, ou `null` si elle ne vaut rien.
 *
 * `numeric(18,4)` revient **en chaîne** du pilote — « 71.0000 » —, et la
 * conversion appartient à ce module plutôt qu'au composant : c'est ici qu'elle
 * s'éprouve par un test, et un `Number()` égrené dans un JSX ne s'éprouve pas.
 * `Number("")` valant 0, la chaîne vide est écartée avant tout — une valeur
 * absente n'est pas une valeur nulle.
 */
function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Les bornes d'une bande, déduites de ses **propres** valeurs : ses relevés, et
 * ses cibles quand une adoption en porte (fiche T5.6).
 *
 * La cible entre dans les bornes parce qu'un trait de cible hors de la bande ne
 * se verrait pas — et une cible qu'on ne voit pas n'est pas un repère. Ce n'est
 * pas un calcul porté sur la valeur : la cible reste un chiffre saisi, affiché
 * tel quel, jamais comparé au dernier relevé (arbitrage (g)).
 *
 * Rend `null` quand aucune valeur n'est exploitable : il n'y a alors pas de
 * bande, et l'écran le dit plutôt que de tracer une courbe vide.
 */
export function valueScale(
  values: readonly (string | number | null | undefined)[],
): ValueScale | null {
  let min: number | null = null;
  let max: number | null = null;

  for (const value of values) {
    const parsed = toNumber(value);
    if (parsed === null) continue;
    if (min === null || parsed < min) min = parsed;
    if (max === null || parsed > max) max = parsed;
  }

  if (min === null || max === null) return null;

  return { min, max };
}

/**
 * La hauteur d'une valeur dans sa bande, en pourcentage **depuis le bas**.
 *
 * Depuis le bas parce que c'est le sens d'une lecture de courbe ; c'est le
 * composant qui retourne l'ordonnée, le SVG comptant ses pixels vers le bas.
 *
 * **Une bande plate pose tout à 50** : deux relevés de même valeur, ou un relevé
 * seul, donnent `min === max`, et la division serait par zéro. Une droite au
 * milieu est ce que ces relevés disent — ni une montée, ni une chute.
 *
 * Toute valeur hors bornes est ramenée dedans : rien ne déborde de la bande,
 * comme rien ne déborde de l'axe (`clampIndex`).
 */
export function valueOffset(
  scale: ValueScale,
  value: string | number,
): Percent {
  const parsed = toNumber(value);
  if (parsed === null) return 50;
  if (scale.max <= scale.min) return 50;

  const clamped = Math.min(Math.max(parsed, scale.min), scale.max);
  return round(((clamped - scale.min) / (scale.max - scale.min)) * 100);
}
