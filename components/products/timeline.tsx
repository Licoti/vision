/**
 * La frise du temps long — la couche que D26 réservait à C5.
 *
 * `docs/06` §6 la place **au-dessus de la liste des accompagnements, sans la
 * déplacer** : la liste reste ce qu'elle est depuis T2.2, et devient
 * l'équivalent textuel de la frise. Trois couches sur un axe commun, et pas une
 * de plus (`docs/03` §7) : une **bande par accompagnement**, un **repère par
 * activité porteuse d'un résultat**, et depuis T5.6 une **courbe par
 * indicateur** — c'est le temps qui est partagé, jamais l'échelle des valeurs
 * (arbitrage (d) de `tickets-C5.md`).
 *
 * **C'est la juxtaposition de `docs/03` §7, et rien d'autre.** Elle répond à
 * « est-ce que ce que nous avons recommandé a fonctionné ? » en donnant à lire,
 * pas en concluant : aucun écart entre un relevé et une cible, aucune moyenne,
 * aucune tendance, aucune projection, aucun lissage. Un segment joint deux
 * faits, il n'en invente pas un troisième.
 *
 * **Rendue sur le serveur, en SVG.** Aucune bibliothèque de graphiques, aucune
 * dépendance, aucun JavaScript, aucune mesure de viewport. Les positions
 * viennent de `lib/queries/timeline.ts` — `timelineScale`, `monthBand`,
 * `monthMark`, `yearTicks`, et `valueScale` / `valueOffset` pour la hauteur
 * d'une valeur dans sa bande —, où elles s'éprouvent par des tests ; ce fichier
 * les pose, il ne les calcule pas.
 *
 * **Aucun viewBox, et c'est un choix.** Les abscisses sont des **pourcentages**
 * de la largeur rendue, les ordonnées des pixels : le texte de la frise garde
 * alors exactement la taille du reste de la page, là où un `viewBox` mis à
 * l'échelle l'aurait grossi d'un facteur qui dépend de la largeur de l'écran.
 *
 * **Conséquence directe : aucune `polyline`, aucun `path`.** L'attribut `points`
 * de l'une et le `d` de l'autre n'acceptent **que des nombres** — un pourcentage
 * y est ignoré, et la courbe se dessinerait dans les quelques pixels du coin
 * haut-gauche. Un segment entre deux relevés est donc une `<line>`, qui, elle,
 * accepte les pourcentages, comme le filet de l'axe et les graduations d'année.
 * Consigné dans `JOURNAL-TECHNIQUE.md`.
 *
 * **Vision juxtapose, elle ne prouve pas.** Aucune annotation de causalité entre
 * une bande et un repère, aucun écart, aucune flèche d'impact, aucun pourcentage
 * d'avancement sur une bande, aucune dépendance entre activités : ce n'est pas
 * un diagramme de Gantt (`docs/06` §10, `docs/03` §6), et `docs/03` §7 nomme le
 * « +12 % depuis l'accompagnement » comme le point de bascule.
 *
 * **La couleur ne porte jamais seule** (`docs/06` §11) : chaque bande écrit son
 * libellé, son statut en toutes lettres et sa période ; chaque repère porte son
 * `<title>` ; l'axe écrit ses deux bornes et ses millésimes.
 *
 * **Le `role="group"`, et non le `role="img"` de la fiche.** Chaque bande mène à
 * sa page projet (`docs/06` §7) et prend donc le focus : un élément focusable
 * dans un `role="img"` reste dans le cycle de tabulation tout en sortant de
 * l'arbre d'accessibilité — un défaut WCAG 4.1.2 dans un produit dont le centre
 * fait métier d'audits d'accessibilité. Écart d'un mot à la fiche, consigné dans
 * `JOURNAL-TECHNIQUE.md`. L'`aria-label` du groupe dit ce que la frise montre,
 * **et ce qu'elle couvre** : le détail se lit dans la liste juste en dessous.
 *
 * Le composant ne lit aucune base et **ne connaît aucun droit** : la frise se lit
 * par tout le domaine (D9), sur un produit vivant comme archivé (règle 4). Elle
 * ne porte aucun geste d'écriture — ce ticket n'ouvre aucun point d'entrée.
 */

import Link from "next/link";

import { Section, SectionHeader } from "@/components/ui/section";
import { BAND_FILL } from "@/components/ui/status-dot";
import { formatDateMonth, formatDay, formatPeriod, formatResultValue } from "@/lib/format";
import { ROUTES } from "@/lib/navigation";
import {
  groupByIndicator,
  type IndicatorTarget,
  type ProductIndicator,
  type ProductReading,
} from "@/lib/queries/indicators";
import type { ProductProject } from "@/lib/queries/products";
import {
  monthBand,
  monthMark,
  timelineScale,
  valueOffset,
  valueScale,
  yearTicks,
  type TimelineMilestone,
  type ValueScale,
} from "@/lib/queries/timeline";

/**
 * Le système de coordonnées du dessin, et **rien d'autre**.
 *
 * Ce ne sont pas des valeurs de thème au sens de la règle 2 : ce sont les
 * ordonnées et les rayons du tracé, ce qu'un SVG ne peut pas ne pas porter. Tout
 * ce qui est **couleur** ou **taille de texte** passe par les classes du thème
 * (`fill-*`, `stroke-*`, `text-xs`), que `@theme inline` génère depuis
 * `tokens.css` — aucune valeur visuelle n'est écrite en dur, et aucun septième
 * substitut n'est inventé (`ETAT.md`).
 *
 * Elles sont groupées ici plutôt qu'égrenées dans le JSX pour qu'un lecteur voie
 * la mise en page d'un seul regard, et pour qu'un rythme se corrige en un
 * endroit.
 */
const GEOMETRY = {
  /** L'en-tête d'axe : les deux bornes écrites, le filet, les millésimes. */
  axisHeight: 34,
  axisBoundsY: 10,
  axisLineY: 18,
  yearTickTop: 13,
  yearTickBottom: 23,
  yearLabelY: 32,

  /** Une bande par accompagnement : deux lignes de texte, puis la barre. */
  bandHeight: 46,
  bandLabelY: 14,
  bandMetaY: 28,
  barY: 34,
  barHeight: 9,

  /** La ligne des repères, sous les bandes. */
  markersHeight: 40,
  markersLabelY: 13,
  markersLineY: 28,
  markerRadius: 5,

  /**
   * Une bande de courbe par indicateur, sous les repères : son libellé, sa
   * borne haute, son tracé, sa borne basse. Les deux bornes sont posées **hors
   * du tracé** — au-dessus et en dessous —, si bien qu'aucune ne peut recouvrir
   * un point, et la graduation qui les rattache à la bande est une largeur en
   * **pourcentage**, seule unité que l'axe connaisse.
   */
  curveHeight: 96,
  curveLabelY: 14,
  curveHighLabelY: 26,
  curvePlotTop: 32,
  curvePlotHeight: 48,
  curveLowLabelY: 92,
  curveTickWidth: 3,
  curvePointRadius: 3.5,
  curveStrokeWidth: 2,
  /** Le tireté de la cible : ce qui la distingue du tracé sans la couleur. */
  targetDash: "5 4",
  targetLabelOffset: 5,
} as const;

/**
 * Ce que la frise montre, dit d'une phrase entière.
 *
 * **Deux phrases choisies par le décompte**, et non une phrase à suffixes :
 * c'est la leçon du refus (e) relevée en T5.1 — un `plural` gouverne le nom et
 * le premier accord, jamais les suivants, et « 1 activités porteuses » se lit
 * faux sans que personne ne s'en aperçoive.
 *
 * Le décompte des bandes dit « datés » parce qu'un accompagnement sans aucune
 * date n'a pas de bande : la frise annonce ce qu'elle couvre plutôt que de
 * laisser croire qu'elle les porte tous. La liste juste en dessous, elle, les
 * porte tous.
 */
function frameLabel(
  firstMonth: string,
  lastMonth: string,
  bandCount: number,
  markerCount: number,
  curveCount: number,
): string {
  /* « d'août 2026 », jamais « de août 2026 » : trois mois français commencent
     par une voyelle — avril, août, octobre — et l'élision se fait sur la
     lettre, pas sur une liste de mois qui se périmerait à la première autre
     langue. */
  const from = /^[aeiouyàâäéèêëîïôöùûü]/i.test(firstMonth)
    ? `d'${firstMonth}`
    : `de ${firstMonth}`;

  /* Le décompte des bandes peut valoir zéro depuis T5.6 : un produit dont aucun
     accompagnement n'est daté garde une frise si un indicateur porte des
     relevés — il y a alors quelque chose à situer sur l'axe. */
  const bands =
    bandCount === 0
      ? "aucun accompagnement daté"
      : bandCount > 1
        ? `${bandCount} accompagnements datés`
        : "1 accompagnement daté";

  const markers =
    markerCount === 0
      ? "aucune activité porteuse d'un résultat"
      : markerCount > 1
        ? `${markerCount} activités porteuses d'un résultat`
        : "1 activité porteuse d'un résultat";

  const curves =
    curveCount === 0
      ? "aucune courbe d'indicateur"
      : curveCount > 1
        ? `${curveCount} courbes d'indicateurs`
        : "1 courbe d'indicateur";

  return `Frise du temps long, ${from} à ${lastMonth} : ${bands}, ${markers}, ${curves}.`;
}

/**
 * Ce qui se trace pour un indicateur : sa série, ses cibles, son échelle.
 *
 * L'échelle est **propre à la bande** (arbitrage (d)) : jamais deux unités sur
 * un même axe vertical, jamais une échelle partagée entre deux indicateurs.
 */
type Curve = {
  indicator: ProductIndicator;
  /** Du plus ancien au plus récent — l'inverse de l'ordre de lecture. */
  series: ProductReading[];
  /** Les cibles de la bande : une par adoption qui en porte une (T5.6). */
  targets: IndicatorTarget[];
  scale: ValueScale;
};

/**
 * Les bandes de courbe, dans l'ordre des indicateurs reçus — celui du bloc
 * « Indicateurs », donc l'ordre alphabétique de `listProductIndicators`.
 *
 * **Un indicateur sans relevé n'a pas de bande** et n'est jamais posé à
 * aujourd'hui : `docs/03` §7 l'exige en toutes lettres, et l'écran le nomme
 * sous la frise plutôt que de lui inventer une date.
 *
 * `readings` arrive **plat et déjà ordonné** `read_on desc, id desc` — une seule
 * lecture pour tout l'écran (la règle de T5.1). Le tri d'une courbe est
 * l'inverse de celui de la série écrite : `reverse` sur la copie rendue par
 * `filter`, jamais sur le tableau reçu en prop, et le départage par `id` est
 * conservé tel quel — deux relevés du même jour gardent un ordre stable d'un
 * affichage à l'autre.
 */
function curvesOf(
  indicators: ProductIndicator[],
  readings: ProductReading[],
  targets: IndicatorTarget[],
): Curve[] {
  const curves: Curve[] = [];

  /* Une passe pour tous les indicateurs, plutôt qu'un `filter` par indicateur :
     `groupByIndicator` vit dans `lib/queries/indicators.ts` depuis TD.1, à côté
     de la lecture qui produit ces relevés, et `indicators.tsx` s'en sert aussi. */
  const grouped = groupByIndicator(readings);

  for (const indicator of indicators) {
    /* La série se lit du plus ancien au plus récent, là où le bloc la lit dans
       l'autre sens. **Une copie est inversée**, jamais le tableau du groupement :
       il est partagé, et le retourner sur place ferait dépendre l'ordre d'un
       autre composant de l'ordre de rendu. */
    const series = [...(grouped.get(indicator.id) ?? [])].reverse();
    if (series.length === 0) continue;

    /* Les cibles de **cet** indicateur, et elles seules : une cible dont
       l'indicateur n'a pas de bande — archivé, ou d'un autre produit — n'a
       nulle part où se poser, et c'est ce filtre qui l'écarte. */
    const bandTargets = targets.filter(
      (target) => target.indicatorId === indicator.id,
    );

    /* La cible entre dans l'échelle **quand une adoption en porte une** : hors
       des bornes, son trait ne se verrait pas. Ce n'est pas une comparaison —
       les deux chiffres sont posés côte à côte, jamais soustraits. */
    const scale = valueScale([
      ...series.map((reading) => reading.value),
      ...bandTargets.map((target) => target.targetValue),
    ]);
    if (!scale) continue;

    curves.push({ indicator, series, targets: bandTargets, scale });
  }

  return curves;
}

/**
 * Le libellé d'une bande : l'identité de la courbe, **écrite**.
 *
 * `docs/06` §11 : la couleur ne porte jamais seule. Toutes les courbes ont le
 * même trait (arbitrage (4) du plan) — c'est la bande qui les sépare, et son
 * libellé qui les nomme. L'unité est dite ici une fois pour toute la bande,
 * plutôt que collée à chaque point.
 */
function curveLabel(indicator: ProductIndicator): string {
  return indicator.unit
    ? `${indicator.label} (${indicator.unit})`
    : indicator.label;
}

/**
 * Ce qu'une cible écrit à côté de son trait.
 *
 * **Sa valeur, jamais son état** (arbitrage (g), D39) : ni « atteinte », ni
 * écart au dernier relevé, ni zone colorée de bon ou mauvais côté. Une cible
 * saisie à la main et un relevé daté sont deux valeurs reportées ; leur
 * différence serait un indice calculé par Vision.
 *
 * L'accompagnement n'est nommé que si la bande porte **plusieurs** cibles : une
 * cible appartient à une adoption, et quand deux accompagnements s'en donnent
 * une sur la même mesure, rien d'autre ne dirait laquelle vient d'où.
 */
function targetLabel(
  target: IndicatorTarget,
  unit: string | null,
  alone: boolean,
): string {
  const value = formatResultValue(target.targetValue, unit);

  return alone
    ? `Cible ${value}`
    : `Cible ${value} · ${target.projectName}`;
}

/**
 * Les indicateurs qu'aucune courbe ne porte, nommés d'une phrase entière.
 *
 * **Deux phrases choisies par le décompte**, jamais une phrase à suffixes : la
 * leçon du refus (e) relevée en T5.1, tenue par `frameLabel` depuis T5.5.
 */
function withoutReadingNotice(labels: string[]): string {
  const named = labels.map((label) => `« ${label} »`).join(", ");

  return labels.length > 1
    ? `Sans relevé, donc sans courbe : ${named}. Ils ne sont pas situés sur l'axe.`
    : `Sans relevé, donc sans courbe : ${named}. Il n'est pas situé sur l'axe.`;
}

/**
 * Ce qu'un repère dit au survol, et à l'assistance.
 *
 * Le résultat est une valeur **reportée** d'un outil externe, avec sa date
 * (D39) : la date se lit au **jour** — la seule entorse au mois, bornée à une
 * date de mesure depuis T4.3, parce qu'un audit rendu le 31 mai perdrait son
 * sens en « mai 2024 ». Aucun jugement n'est tiré de la valeur.
 *
 * L'accompagnement est nommé : un repère vit sur sa propre ligne, sous les
 * bandes, et rien d'autre ne dirait de quel accompagnement il vient.
 */
function milestoneTitle(milestone: TimelineMilestone): string {
  const value = formatResultValue(milestone.resultValue, milestone.resultUnit);

  return [
    milestone.typeLabel,
    value ? `${milestone.resultLabel} : ${value}` : milestone.resultLabel,
    formatDay(milestone.measuredOn),
    milestone.projectName,
  ].join(" · ");
}

export function Timeline({
  projects,
  milestones,
  indicators,
  readings,
  targets,
}: {
  /**
   * Les accompagnements **déjà lus par la page** pour la liste juste en dessous
   * (T2.2) : la frise ne demande aucune lecture neuve pour ses bandes. Ils
   * arrivent du plus récent au plus ancien, et les bandes gardent cet ordre —
   * celui de la liste, donc celui du parcours au clavier.
   */
  projects: ProductProject[];
  /** Les activités porteuses d'un résultat vivant, de la plus ancienne mesure. */
  milestones: TimelineMilestone[];
  /**
   * Les indicateurs vivants du produit, **déjà lus** pour le bloc de T5.1 :
   * les courbes ne coûtent pas une lecture de plus. L'ordre est le leur.
   */
  indicators: ProductIndicator[];
  /** Tous les relevés vivants du produit, plats et ordonnés (T5.3). */
  readings: ProductReading[];
  /** Les cibles des adoptions vivantes — la seule lecture neuve de T5.6. */
  targets: IndicatorTarget[];
}) {
  /* L'axe se déduit de **toutes** les dates connues des couches affichées, et
     de rien d'autre : aucun réglage de période, aucun zoom, aucun défilement
     horizontal. T5.6 y a ajouté les dates de relevé sans qu'une ligne du calcul
     de borne change — `timelineScale` recevait déjà une liste de dates, et non
     des projets, précisément pour cela. */
  const scale = timelineScale([
    ...projects.flatMap((project) => [project.startedOn, project.expectedEndOn]),
    ...milestones.map((milestone) => milestone.measuredOn),
    ...readings.map((reading) => reading.readOn),
  ]);

  /* Un accompagnement sans **aucune** date n'a pas de bande : `docs/03` §7
     interdit de positionner arbitrairement ce qui n'a pas de date, et la liste
     juste en dessous le porte entier. Celui qui n'a qu'une fin est posé sur ce
     seul mois. */
  const bands = scale
    ? projects.flatMap((project) => {
        const from = project.startedOn ?? project.expectedEndOn;
        if (!from) return [];
        return [
          { project, ...monthBand(scale, from, project.expectedEndOn) },
        ];
      })
    : [];

  /* Les courbes, sous les repères (arbitrage (d)) : une bande par indicateur,
     son échelle verticale déduite de ses seuls relevés et de ses cibles. */
  const curves = curvesOf(indicators, readings, targets);

  /* Ceux qu'aucune bande ne porte, pour la mention sous la frise. Le décompte
     se fait sur les courbes rendues et non sur les relevés : une série qu'on
     n'aurait pas su lire tomberait ici, ce qui est le bon endroit — nommée
     comme absente, jamais tracée à faux. */
  const drawn = new Set(curves.map((curve) => curve.indicator.id));
  const withoutReading = indicators
    .filter((indicator) => !drawn.has(indicator.id))
    .map((indicator) => indicator.label);

  /* **L'état vide se juge sur les deux couches situables** : un produit dont
     aucun accompagnement n'est daté garde sa frise si un indicateur porte des
     relevés — il y a alors quelque chose à situer sur l'axe, et le dire absent
     serait faux (arbitrage (5) du plan de T5.6). */
  if (!scale || (bands.length === 0 && curves.length === 0)) {
    return (
      <Section>
        <SectionHeader
          title="Frise du temps long"
          note="Les accompagnements, les activités porteuses d'un résultat et les relevés d'indicateurs, sur un axe commun."
        />
        {/* Un paragraphe et non un `EmptyState` — la règle de `Resources` et
            de `Indicators`. La raison qui reste après TD.1, qui a donné un
            `level` à `EmptyState` : **deux phrases distinctes**, là où
            `EmptyState` n'a qu'un `description`. N'avoir aucun accompagnement et
            n'en avoir aucun de daté ne sont pas la même chose, et l'écran ne les
            confond pas. */}
        <p className="text-sm leading-175 text-content-neutral-base">
          {projects.length === 0
            ? "La frise s'affichera ici dès qu'un accompagnement sera daté ou qu'un indicateur portera un relevé : les périodes en bandes, les activités porteuses d'un résultat en repères, les relevés en courbes, sur un axe commun."
            : "Aucun accompagnement de ce produit ne porte de date, et aucun indicateur ne porte de relevé : il n'y a rien à situer sur un axe. La liste ci-dessous porte tous les accompagnements."}
        </p>
      </Section>
    );
  }

  const ticks = yearTicks(scale);
  const firstMonth = formatDateMonth(`${scale.firstMonth}-01`);
  const lastMonth = formatDateMonth(`${scale.lastMonth}-01`);

  const bandsTop = GEOMETRY.axisHeight;
  const markersTop = bandsTop + bands.length * GEOMETRY.bandHeight;
  const curvesTop =
    markersTop + (milestones.length > 0 ? GEOMETRY.markersHeight : 0);
  const height = curvesTop + curves.length * GEOMETRY.curveHeight;

  return (
    <Section>
      <SectionHeader
        title="Frise du temps long"
        note="Les accompagnements, les activités porteuses d'un résultat et les relevés d'indicateurs, sur un axe commun."
      />

      <svg
        role="group"
        aria-label={frameLabel(
          firstMonth,
          lastMonth,
          bands.length,
          milestones.length,
          curves.length,
        )}
        width="100%"
        height={height}
      >
        {/* ---- L'axe : ses deux bornes écrites, son filet, ses millésimes ----

            `content-neutral-normal` (3,88:1 mesuré) est le substitut de bordure
            de contrôle en vigueur depuis T2.3 : la limite d'un composant se
            mesure à 3:1, et aucun jeton de bordure n'existe au design system
            (`ETAT.md`). Aucun septième substitut n'est inventé ici. */}
        <text
          x="0"
          y={GEOMETRY.axisBoundsY}
          className="fill-content-neutral-base text-xs"
        >
          {firstMonth}
        </text>
        <text
          x="100%"
          y={GEOMETRY.axisBoundsY}
          textAnchor="end"
          className="fill-content-neutral-base text-xs"
        >
          {lastMonth}
        </text>
        <line
          x1="0"
          y1={GEOMETRY.axisLineY}
          x2="100%"
          y2={GEOMETRY.axisLineY}
          className="stroke-content-neutral-normal"
        />

        {ticks.map((tick) => (
          <g key={tick.year}>
            <line
              x1={`${tick.left}%`}
              y1={GEOMETRY.yearTickTop}
              x2={`${tick.left}%`}
              y2={GEOMETRY.yearTickBottom}
              className="stroke-content-neutral-normal"
            />
            <text
              x={`${tick.left}%`}
              y={GEOMETRY.yearLabelY}
              textAnchor="middle"
              className="fill-content-neutral-base text-xs"
            >
              {tick.year}
            </text>
          </g>
        ))}

        {/* ---- Une bande par accompagnement daté ----

            Chaque bande **mène à sa page projet** — la règle de descente de
            `docs/06` §7 — et prend donc le focus, dans l'ordre de la liste. Le
            contour de focus est celui de tout le produit (`*:focus-visible`,
            `app/globals.css`), et il s'applique à un `<a>` SVG comme à tout
            autre. */}
        {bands.map((band, index) => {
          const top = bandsTop + index * GEOMETRY.bandHeight;
          const period = formatPeriod(
            band.project.startedOn,
            band.project.expectedEndOn,
          );

          return (
            <Link
              key={band.project.id}
              href={ROUTES.project(band.project.id)}
              aria-label={`${band.project.name} — ${band.project.statusLabel} — ${period}`}
            >
              {/* La cible du clic couvre la ligne entière : une barre de neuf
                  pixels et deux lignes de texte feraient une cible étroite.
                  `fill="none"` n'est pas une couleur — c'est l'absence de
                  peinture ; `pointerEvents` en fait malgré tout une surface
                  cliquable. */}
              <rect
                x="0"
                y={top}
                width="100%"
                height={GEOMETRY.bandHeight}
                fill="none"
                pointerEvents="all"
              />
              <text
                x="0"
                y={top + GEOMETRY.bandLabelY}
                className="fill-content-neutral-darkest text-sm font-semibold"
              >
                {band.project.name}
              </text>
              <text
                x="0"
                y={top + GEOMETRY.bandMetaY}
                className="fill-content-neutral-base text-xs"
              >
                {`${band.project.statusLabel} · ${period}`}
              </text>
              <rect
                x={`${band.left}%`}
                y={top + GEOMETRY.barY}
                width={`${band.width}%`}
                height={GEOMETRY.barHeight}
                className={BAND_FILL[band.project.statusNature]}
              />
            </Link>
          );
        })}

        {/* ---- Les repères : une activité porteuse d'un résultat ----

            Sur leur propre ligne, comme dans le croquis de `docs/03` §7 : ce
            sont les « activités marquantes positionnées sur l'axe ». Une
            activité sans résultat n'y figure pas — la roadmap de son
            accompagnement reste le seul endroit où elle se lit.

            Aucun lien : la fiche n'en demande que sur les bandes (règle 3). Le
            `<title>` dit ce que le repère porte, l'accompagnement compris. */}
        {milestones.length > 0 ? (
          <g>
            <text
              x="0"
              y={markersTop + GEOMETRY.markersLabelY}
              className="fill-content-neutral-base text-xs"
            >
              Activités porteuses d&apos;un résultat
            </text>
            <line
              x1="0"
              y1={markersTop + GEOMETRY.markersLineY}
              x2="100%"
              y2={markersTop + GEOMETRY.markersLineY}
              className="stroke-content-neutral-normal"
            />
            {milestones.map((milestone) => (
              <circle
                key={milestone.id}
                cx={`${monthMark(scale, milestone.measuredOn)}%`}
                cy={markersTop + GEOMETRY.markersLineY}
                r={GEOMETRY.markerRadius}
                className="fill-surface-secondary-dark"
              >
                <title>{milestoneTitle(milestone)}</title>
              </circle>
            ))}
          </g>
        ) : null}

        {/* ---- Les courbes : une bande par indicateur ----

            **L'axe temporel est partagé, jamais l'échelle des valeurs**
            (arbitrage (d)) : chaque bande borne la sienne sur ses propres
            relevés, si bien qu'un pourcentage et des secondes ne se comparent
            jamais sur une même verticale.

            Aucun `<title>` sur les points, et aucune interaction : la fiche
            interdit l'infobulle au survol, et l'équivalent textuel est la série
            déjà lisible dans le bloc « Indicateurs », sous la liste. Rien n'est
            ajouté pour cela. */}
        {curves.map((curve, index) => {
          const top = curvesTop + index * GEOMETRY.curveHeight;
          const plotTop = top + GEOMETRY.curvePlotTop;
          const plotBottom = plotTop + GEOMETRY.curvePlotHeight;

          /* L'ordonnée d'une valeur : le pourcentage rendu par `valueOffset` se
             compte **depuis le bas**, le SVG compte ses pixels vers le bas. */
          const ordinate = (value: string) =>
            plotBottom -
            (valueOffset(curve.scale, value) / 100) * GEOMETRY.curvePlotHeight;

          const points = curve.series.map((reading) => ({
            id: reading.id,
            x: monthMark(scale, reading.readOn),
            y: ordinate(reading.value),
          }));

          return (
            <g key={curve.indicator.id}>
              <text
                x="0"
                y={top + GEOMETRY.curveLabelY}
                className="fill-content-neutral-darkest text-xs font-semibold"
              >
                {curveLabel(curve.indicator)}
              </text>

              {/* Les deux bornes de la bande, écrites : sans elles, une courbe
                  sans repère chiffré serait un graphique décoratif, que
                  `docs/06` §10 interdit et que D41 refuse pour celle-ci. Ce sont
                  des **valeurs reportées** — la plus basse et la plus haute de
                  ce que la bande porte —, jamais un indice calculé (D39).

                  Chacune est rattachée à son bord par une graduation, et posée
                  hors du tracé : aucune ne peut recouvrir un point. */}
              <line
                x1={`${100 - GEOMETRY.curveTickWidth}%`}
                y1={plotTop}
                x2="100%"
                y2={plotTop}
                className="stroke-content-neutral-normal"
              />
              <text
                x="100%"
                y={top + GEOMETRY.curveHighLabelY}
                textAnchor="end"
                className="fill-content-neutral-base text-xs"
              >
                {formatResultValue(String(curve.scale.max), curve.indicator.unit)}
              </text>
              <line
                x1={`${100 - GEOMETRY.curveTickWidth}%`}
                y1={plotBottom}
                x2="100%"
                y2={plotBottom}
                className="stroke-content-neutral-normal"
              />
              <text
                x="100%"
                y={top + GEOMETRY.curveLowLabelY}
                textAnchor="end"
                className="fill-content-neutral-base text-xs"
              >
                {formatResultValue(String(curve.scale.min), curve.indicator.unit)}
              </text>

              {/* La cible : un trait et un chiffre, jamais un état. Une par
                  adoption qui en porte une — Vision juxtapose, elle ne choisit
                  pas laquelle des deux compte. Le tireté la distingue du tracé
                  sans recourir à une seconde couleur. */}
              {curve.targets.map((target) => {
                const y = ordinate(target.targetValue);

                return (
                  <g key={target.projectId}>
                    <line
                      x1="0"
                      y1={y}
                      x2="100%"
                      y2={y}
                      strokeDasharray={GEOMETRY.targetDash}
                      className="stroke-content-neutral-normal"
                    />
                    <text
                      x="0"
                      y={y - GEOMETRY.targetLabelOffset}
                      className="fill-content-neutral-base text-xs"
                    >
                      {targetLabel(
                        target,
                        curve.indicator.unit,
                        curve.targets.length === 1,
                      )}
                    </text>
                  </g>
                );
              })}

              {/* Un segment entre deux relevés consécutifs, et **une `<line>`
                  par segment** : `polyline` n'accepte pas de pourcentage dans
                  ses `points`, et la frise n'a pas de `viewBox`. Un relevé isolé
                  n'entre dans aucune paire : il reste un point, sans segment —
                  le cas se lit dans le code, pas dans un commentaire.

                  Le segment joint deux faits ; il n'en invente pas un troisième
                  — aucun lissage, aucune projection au-delà du dernier relevé. */}
              {points.flatMap((point, order) => {
                /* Le premier relevé n'ouvre aucun segment — et un relevé isolé
                   n'en ouvre jamais : `flatMap` sur le prédécesseur rend le cas
                   sans le nommer. */
                const previous = points[order - 1];
                if (!previous) return [];

                return [
                  <line
                    key={`${previous.id}-${point.id}`}
                    x1={`${previous.x}%`}
                    y1={previous.y}
                    x2={`${point.x}%`}
                    y2={point.y}
                    strokeWidth={GEOMETRY.curveStrokeWidth}
                    className="stroke-content-primary-dark"
                  />,
                ];
              })}

              {points.map((point) => (
                <circle
                  key={point.id}
                  cx={`${point.x}%`}
                  cy={point.y}
                  r={GEOMETRY.curvePointRadius}
                  className="fill-content-primary-dark"
                />
              ))}
            </g>
          );
        })}
      </svg>

      {/* Les indicateurs sans relevé, **nommés** et jamais positionnés à
          aujourd'hui : « un indicateur sans date de relevé n'est pas affichable
          sur la frise et doit être signalé comme tel plutôt que positionné
          arbitrairement à aujourd'hui » (`docs/03` §7). Sous la frise, hors du
          SVG : c'est du texte, il se lit et se sélectionne comme tel. */}
      {withoutReading.length > 0 ? (
        <p className="text-xs leading-175 text-content-neutral-base">
          {withoutReadingNotice(withoutReading)}
        </p>
      ) : null}
    </Section>
  );
}
