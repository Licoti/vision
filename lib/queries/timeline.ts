/**
 * La frise du temps long de la page produit : ce qu'elle a besoin de lire, et
 * l'échelle sur laquelle elle se dessine (`docs/06` §6, D26 — « la couche temps
 * long attend C5 »).
 *
 * **Trois couches sur l'axe, et pas une de plus** (`docs/03` §7) : une bande par
 * accompagnement, un repère par activité porteuse d'un résultat, et depuis T5.6
 * une courbe par indicateur. Aucune d'elles ne demande de lecture neuve à ce
 * module hors les repères : `listProductProjects`, `listProductIndicators` et
 * `listProductReadings` rendent déjà tout le reste pour les blocs de la page, et
 * la frise reçoit ce que la page a lu. Ce module porte donc les **repères**, et
 * les **échelles** — celle du temps, partagée par les trois couches, et celle
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

/** Une graduation d'année sur l'axe : son millésime, et sa position. */
export type TimelineYearTick = { year: number; left: Percent };

/**
 * Les graduations d'année — un janvier, un millésime.
 *
 * Pas un mois de graduation : vingt-huit libellés ne se lisent pas, et l'axe
 * porte déjà son premier et son dernier mois écrits à ses deux bouts. L'année
 * suffit à situer ce qu'il y a entre les deux.
 *
 * Le janvier du premier mois de l'axe n'en produit pas : sa graduation
 * tomberait sur le libellé de la borne, et redirait ce qui est déjà écrit.
 */
export function yearTicks(scale: TimelineScale): TimelineYearTick[] {
  const first = monthIndex(`${scale.firstMonth}-01`);
  const last = first + scale.monthCount - 1;
  const ticks: TimelineYearTick[] = [];

  const firstYear = Number(scale.firstMonth.slice(0, 4));
  const lastYear = Number(scale.lastMonth.slice(0, 4));

  for (let year = firstYear; year <= lastYear; year += 1) {
    const january = year * 12;
    if (january <= first || january > last) continue;
    ticks.push({
      year,
      left: round(((january - first) / scale.monthCount) * 100),
    });
  }

  return ticks;
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
