/**
 * La frise du temps long — la couche que D26 réservait à C5.
 *
 * `docs/06` §6 la place **au-dessus de la liste des accompagnements, sans la
 * déplacer** : la liste reste ce qu'elle est depuis T2.2, et devient
 * l'équivalent textuel de la frise. Deux couches sur un axe commun, et pas une
 * de plus (`docs/03` §7) : une **bande par accompagnement**, un **repère par
 * activité porteuse d'un résultat**. Les courbes d'indicateurs viendront s'y
 * empiler en T5.6, sur le même axe temporel — c'est le temps qui est partagé,
 * jamais l'échelle des valeurs.
 *
 * **Rendue sur le serveur, en SVG.** Aucune bibliothèque de graphiques, aucune
 * dépendance, aucun JavaScript, aucune mesure de viewport. Les positions
 * viennent de `lib/queries/timeline.ts` — `timelineScale`, `monthBand`,
 * `monthMark`, `yearTicks` —, où elles s'éprouvent par des tests ; ce fichier
 * les pose, il ne les calcule pas.
 *
 * **Aucun viewBox, et c'est un choix.** Les abscisses sont des **pourcentages**
 * de la largeur rendue, les ordonnées des pixels : le texte de la frise garde
 * alors exactement la taille du reste de la page, là où un `viewBox` mis à
 * l'échelle l'aurait grossi d'un facteur qui dépend de la largeur de l'écran.
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
import { formatDateMonth, formatDay, formatPeriod, formatResultValue } from "@/lib/format";
import { ROUTES } from "@/lib/navigation";
import type { ProductProject } from "@/lib/queries/products";
import type { ProjectStatusNature } from "@/lib/queries/projects";
import {
  monthBand,
  monthMark,
  timelineScale,
  yearTicks,
  type TimelineMilestone,
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
} as const;

/**
 * Le remplissage d'une bande, **par la nature du statut** et jamais par son
 * libellé : un domaine renomme « En cours », il ne renomme pas `active`.
 *
 * La table est celle de `StatusDot`, **redite** en `fill-*` plutôt qu'importée :
 * `components/ui/status-dot.tsx` porte des classes `bg-*`, ne les exporte pas, et
 * n'appartient pas au périmètre de ce ticket. La dette est consignée au journal,
 * comme celle d'`ACTION_LINK` en T5.1.
 *
 * Le `Record` est **exhaustif à la compilation** : le jour où l'énuméré
 * s'allonge, ce fichier ne compile plus tant qu'on ne l'a pas complété.
 */
const BAND_FILL: Record<ProjectStatusNature, string> = {
  framing: "fill-surface-info-base",
  active: "fill-surface-primary-base",
  paused: "fill-surface-neutral-base",
  done: "fill-surface-success-base",
};

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
): string {
  /* « d'août 2026 », jamais « de août 2026 » : trois mois français commencent
     par une voyelle — avril, août, octobre — et l'élision se fait sur la
     lettre, pas sur une liste de mois qui se périmerait à la première autre
     langue. */
  const from = /^[aeiouyàâäéèêëîïôöùûü]/i.test(firstMonth)
    ? `d'${firstMonth}`
    : `de ${firstMonth}`;

  const bands =
    bandCount > 1
      ? `${bandCount} accompagnements datés`
      : "1 accompagnement daté";

  const markers =
    markerCount === 0
      ? "aucune activité porteuse d'un résultat"
      : markerCount > 1
        ? `${markerCount} activités porteuses d'un résultat`
        : "1 activité porteuse d'un résultat";

  return `Frise du temps long, ${from} à ${lastMonth} : ${bands}, ${markers}.`;
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
}) {
  /* L'axe se déduit de **toutes** les dates connues des couches affichées, et
     de rien d'autre : aucun réglage de période, aucun zoom, aucun défilement
     horizontal. T5.6 ajoutera les dates de relevé à cette liste sans que le
     calcul de borne change d'une ligne. */
  const scale = timelineScale([
    ...projects.flatMap((project) => [project.startedOn, project.expectedEndOn]),
    ...milestones.map((milestone) => milestone.measuredOn),
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

  if (!scale || bands.length === 0) {
    return (
      <Section>
        <SectionHeader
          title="Frise du temps long"
          note="Les accompagnements et les activités porteuses d'un résultat, sur un axe commun."
        />
        {/* Un paragraphe et non un `EmptyState`, qui porterait un `h2` en
            doublon sous celui de la section — la règle de `Resources` et de
            `Indicators`. Deux phrases distinctes : n'avoir aucun accompagnement
            et n'en avoir aucun de daté ne sont pas la même chose, et l'écran ne
            les confond pas. */}
        <p className="text-sm leading-175 text-content-neutral-base">
          {projects.length === 0
            ? "La frise s'affichera ici dès qu'un accompagnement sera daté : les périodes en bandes, les activités porteuses d'un résultat en repères, sur un axe commun."
            : "Aucun accompagnement de ce produit ne porte de date : il n'y a rien à situer sur un axe. La liste ci-dessous les porte tous."}
        </p>
      </Section>
    );
  }

  const ticks = yearTicks(scale);
  const firstMonth = formatDateMonth(`${scale.firstMonth}-01`);
  const lastMonth = formatDateMonth(`${scale.lastMonth}-01`);

  const bandsTop = GEOMETRY.axisHeight;
  const markersTop = bandsTop + bands.length * GEOMETRY.bandHeight;
  const height =
    markersTop + (milestones.length > 0 ? GEOMETRY.markersHeight : 0);

  return (
    <Section>
      <SectionHeader
        title="Frise du temps long"
        note="Les accompagnements et les activités porteuses d'un résultat, sur un axe commun."
      />

      <svg
        role="group"
        aria-label={frameLabel(
          firstMonth,
          lastMonth,
          bands.length,
          milestones.length,
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
      </svg>
    </Section>
  );
}
