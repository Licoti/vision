/**
 * Les **deux premiers blocs** de la page produit — « Vision produit », puis
 * « Indicateurs ». **La question, la mesure de la question, puis le reste de ce
 * qu'on mesure.**
 *
 * Récrit hors ticket le 17/08/2026 d'après
 * `docs/design/maquettes/blocs/northstar/NorthStar.dc.html`, élargi le
 * 18/08/2026 — il ne disait que comment le produit se mesure, jamais pourquoi
 * il existe —, puis **coupé en deux le 28/08/2026** :
 *
 *   Bloc 1, « Vision produit » · la **vision** — pourquoi ce produit existe —,
 *   puis la **North Star**, l'indicateur qui dit si l'on avance dans cette
 *   direction : sa courbe, sa cible, son dernier relevé.
 *
 *   Bloc 2, « Indicateurs » · les **autres mesures**, en cartes, et sous
 *   chacune **l'accompagnement qui la porte**, en puce discrète.
 *
 * **Ce second bloc était un `<details>` replié** au pied du premier, depuis le
 * 18/08/2026. Le repli rendait au premier rang la place de ses cartes ; il
 * coûtait davantage — les indicateurs n'existaient plus pour qui ne remarquait
 * pas un chevron de 10 px, et « Ajouter un indicateur », qui vivait dans la
 * grille en carte pointillée, était enterré avec eux. Le bloc porte désormais
 * son en-tête, son geste et son état vide, et **aucune lecture n'a été
 * ajoutée** : ce sont les mêmes tableaux, séparés par le même `filter`.
 *
 * Le fichier rend donc **deux `Block` dans un fragment**, que `Page` espace de
 * son `gap-6` comme deux blocs quelconques.
 *
 * **Vision et North Star sont deux concepts ajoutés hors des `docs/`**, absents
 * de `docs/02` et de `docs/04` ; les deux écarts sont consignés dans
 * `JOURNAL-TECHNIQUE.md`. La vision vit sur `products.vision`, nullable ; la
 * North Star sur `indicators.is_north_star`, avec un index unique partiel qui en
 * garantit une au plus par produit — la garantie est en base, pas à l'écran.
 * N'avoir ni l'une ni l'autre est un état normal, et l'écran le dit.
 *
 * **Les deux ne portent pas le même droit, et le bloc ne les confond pas.** La
 * vision est une propriété du produit : `manageDomain` seul (F1-D1, D9). Les
 * indicateurs et la North Star relèvent du droit **dérivé des accompagnements**
 * (arbitrage (b) de `tickets-C5.md`). Deux points d'entrée distincts arrivent
 * donc en props, chacun `null` de son côté — le composant n'en sait pas plus.
 *
 * ⚠ **L'écart à la cible que ce bloc affiche est interdit par quatre textes**
 * — D39, `docs/06` §6, l'arbitrage (g) de `tickets-C5.md`, `brief-design.md`
 * §4.3 — qui refusent en propres termes « tout indice calculé par Vision » et
 * « tout calcul d'écart ». Arbitré par l'humain le 17/08/2026, consigné dans
 * `JOURNAL-TECHNIQUE.md` comme le prévoit la règle 6. Le calcul lui-même vit
 * dans `targetGap` (`lib/queries/indicators.ts`), où il s'éprouve par un test et
 * où la dérogation est expliquée. **La jauge est rétablie le 17/08/2026**, sur
 * le même arbitrage : elle est la forme visuelle du même indice, et tombe sous
 * les mêmes interdits d'interface. Elle se borne à `axisScale`, qui part de
 * zéro — le schéma ne porte aucune échelle, et 0-100 ne se code pas en dur.
 *
 * **Deux cibles cohabitent.** `indicators.target_value` est la cible **du
 * produit** — celle que porte la jauge et le trait ★ ; `project_indicators
 * .target_value` est celle qu'un **accompagnement** s'est donnée (`docs/02` §4),
 * tracée en trait discret avec sa seule valeur.
 *
 * **Le rattachement aux accompagnements revient, sous une autre forme**
 * (18/08/2026). L'arbitrage du 17/08/2026 — « strictement la maquette » —
 * l'avait sorti d'ici avec la ligne « Adopté par… », et le renvoyait à la page
 * projet. La demande le rétablit **sur les cartes seulement**, et **en puce** :
 * ce qui alourdissait le bloc était la ligne, pas l'information. La North Star,
 * elle, n'en porte aucune — elle est l'objectif du produit, tous
 * accompagnements confondus, et lui coller une puce dirait le contraire. La
 * page projet garde son bloc « Indicateurs adoptés », qui reste le lieu des
 * quatre valeurs chiffrées ; ici, un nom, et c'est tout. L'écart est consigné.
 *
 * **Le rythme est revenu au `gap-5` de `Block`** (28/08/2026). La reprise de
 * `northstar-v2` avait posé, le 18/08/2026, des marges élément par élément —
 * 16/30-26/14/34-16 — et fait tenir tout le contenu dans un seul enfant de
 * `Block`, ce qu'exigeait le kebab posé en absolu. Le kebab reparti dans
 * l'en-tête, la contrainte tombe avec lui, et le bloc reprend le rythme de ses
 * voisins. `NorthStar` et `IndicatorCard` gardent le leur : ce sont des cartes,
 * pas des colonnes de bloc.
 *
 * **La coquille ET l'en-tête sont ceux de `components/ui/block.tsx`**
 * (28/08/2026). Le 18/08/2026 avait remplacé, pour ce bloc seul, la ligne
 * « titre + note + menu » de `BlockHeader` par un **surtitre** de 12 pixels en
 * capitales et un kebab posé en absolu au coin — un langage d'en-tête que les
 * autres blocs de la page ne partageaient pas, consigné comme **écart assumé**
 * dans `JOURNAL-TECHNIQUE.md`. L'écart est refermé : le premier bloc de la page
 * était celui qui se lisait le moins comme un bloc.
 *
 * Deux choses tombent avec lui. Le kebab reprend sa place d'action d'en-tête,
 * si bien que le contenu n'a plus à tenir dans un unique enfant `relative` : le
 * bloc redevient une colonne à `gap-5`, et **le rythme en marges élément par
 * élément disparaît**. Et la vision passe de 30 à 24 pixels — à 30 elle était
 * le plus gros texte de l'écran, plus gros que le nom du produit, et sa mesure
 * se lisait comme sa note de bas de page. **L'ordre, lui, ne bouge pas** : la
 * vision reste avant la North Star, comme `docs/03` la pose.
 *
 * **La hiérarchie des titres ne bouge pas non plus** : « Vision produit » et
 * « Indicateurs » portent chacun le `h2` de leur bloc, « North Star » reste un
 * `h3`. Les marques (le ★) sortent de l'arbre d'accessibilité : la couleur ne
 * porte jamais seule (`docs/06` §11).
 *
 * **La North Star vit dans une carte blanche** (18/08/2026), ce qui est le
 * changement structurel de la maquette : le rang du milieu se détache de la
 * surface bleue au lieu d'y flotter. Trois éléments s'y peignaient avec le fond
 * du bloc pour rester lisibles par-dessus les filets de la courbe — les deux
 * pastilles de cible et l'anneau des points ; ils prennent le fond de la carte,
 * faute de quoi ils y dessineraient un rectangle bleu.
 *
 * **Le tracé est en `path`, et c'est neuf.** La contrainte de T5.6 — pas de
 * `viewBox`, donc pas de `path` — tenait à ce que le SVG portait du texte. Ici
 * il n'en porte aucun : les valeurs, les graduations et les points sont des
 * éléments HTML posés en pourcentage par-dessus. `curvePath` rend le `d`, et
 * s'éprouve par un test.
 *
 * **Le composant ne connaît aucun droit.** Chaque point d'entrée arrive en prop
 * et vaut `null` quand il est fermé — la règle depuis T5.1. Ce n'est pas ce
 * rendu qui protège : les actions redérivent le droit sur l'identifiant reçu.
 */

import type { ReactNode } from "react";

import { DrawerLink } from "@/components/ui/drawer";

import {
  ActionMenu,
  MENU_ITEM,
  MENU_ITEM_DANGER,
} from "@/components/ui/action-menu";
import { Block, BlockHeader } from "@/components/ui/block";
import { MeasurementRank } from "@/components/products/measurement";
import { buttonClass } from "@/components/ui/button";
import { BlockNote } from "@/components/ui/empty-state";
import { Tag } from "@/components/ui/tag";
import { ACTION_LINK } from "@/components/ui/action-link";
import {
  formatDateMonth,
  formatDay,
  formatIndicatorDirection,
  formatMonthTick,
  formatReadings,
  formatResultValue,
} from "@/lib/format";
import type {
  ProductTaggingPlan,
  ProductTracking,
} from "@/lib/queries/measurement";
import {
  axisScale,
  curvePath,
  groupByIndicator,
  targetGap,
  type ProductAdoption,
  type ProductIndicator,
  type ProductReading,
  type TargetGap,
} from "@/lib/queries/indicators";
import {
  curveTimeline,
  monthMark,
  monthTicks,
  valueOffset,
  type ProductMarker,
  type ValueScale,
} from "@/lib/queries/timeline";

/**
 * La nature d'un repère, écrite. **La forme ne porte jamais seule** (`docs/06`
 * §11) : le disque et l'anneau se doublent de ce mot, dans l'infobulle comme
 * dans la phrase accessible.
 */
const TOOLTIP_KIND: Record<ProductMarker["kind"], string> = {
  accompaniment: "accompagnement",
  context: "contexte",
};

const MARKER_KIND: Record<ProductMarker["kind"], string> = {
  accompaniment: "accompagnement",
  context: "repère de contexte",
};

/**
 * Ce qu'une marque de l'axe dit à l'assistance, en une phrase entière.
 *
 * Elle est le **nom accessible** du lien, pas un complément : l'infobulle est
 * `aria-hidden`, et une marque de 8 px n'a aucun contenu textuel propre. Sans
 * cette phrase, la bande serait une rangée de liens sans nom.
 *
 * **Le résultat y entre quand il existe** — une valeur reportée avec son
 * libellé (D39) —, et rien n'en est tiré : aucune comparaison, aucun jugement.
 */
function markerSentence(marker: ProductMarker): string {
  const value = formatResultValue(marker.resultValue, marker.resultUnit);

  /* **La nature ne s'écrit qu'à défaut de nom d'accompagnement** : « Audit UX,
     accompagnement Refonte 2026 » dit déjà que le repère en est un, et le
     répéter donnait « accompagnement · accompagnement Refonte 2026 » — relevé
     dans le HTML servi. Un repère de contexte, lui, n'a souvent aucun
     accompagnement à nommer : c'est là que le mot porte. */
  const origin = marker.projectName
    ? `${MARKER_KIND[marker.kind]} ${marker.projectName}`
    : MARKER_KIND[marker.kind];

  const result =
    marker.resultLabel && value
      ? `${marker.resultLabel} : ${value}`
      : marker.resultLabel;

  return `Repère du ${formatDay(marker.on)} — ${marker.label}, ${origin}.${
    result ? ` ${result}.` : ""
  }`;
}

/**
 * La phrase d'écart à la cible du produit.
 *
 * ⚠ Voir l'avertissement de l'en-tête : ce que cette fonction met en mots est
 * l'indice calculé que D39 interdit. Elle respecte au moins `direction`, ce que
 * la maquette ne faisait pas — « Encore 3 points » sur un taux d'abandon à 8 %
 * pour une cible à 5 % se lisait à l'envers.
 */
function gapSentence(
  gap: TargetGap | null,
  unit: string | null,
): string | null {
  if (!gap) return null;

  if (gap.reached) return "Cible atteinte.";

  const remaining = formatResultValue(String(gap.distance), unit);
  return `Encore ${remaining} pour atteindre la cible.`;
}

/**
 * L'en-tête d'un **rang** dans un bloc : une marque, un titre, une note, une
 * action.
 *
 * **Il remplace le surtitre de `northstar-v2`** (28/08/2026). Ce bloc portait
 * depuis le 18/08/2026 un langage d'en-tête que les deux autres blocs de la
 * page ne partageaient pas — un surtitre de 12 px en capitales et un kebab posé
 * en absolu au coin —, et l'écart était consigné comme assumé. Il ne l'est
 * plus : le bloc reprend `BlockHeader` pour son titre, et ce qui reste ici est
 * l'en-tête d'un **rang intérieur**, que `BlockHeader` ne peut pas rendre — son
 * titre est un `h2`, et un bloc n'en porte qu'un.
 *
 * Le `h3` est celui qu'`Eyebrow` portait, à la même place dans la hiérarchie :
 * seul son dessin change — 16 px gras au lieu de 12 px capitales, la taille
 * d'un rang qui porte une carte et non celle d'un intertitre.
 *
 * **L'action est alignée en haut**, la règle de `BlockHeader` : elle doit rester
 * à hauteur du titre quand la note tient sur deux lignes.
 */
function RankHeader({
  mark,
  title,
  note,
  action,
}: {
  /** **Décorative** : elle sort de l'arbre d'accessibilité (`docs/06` §11). */
  mark?: ReactNode;
  title: string;
  note?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h3 className="flex items-center gap-2 text-md font-bold text-content-neutral-darkest">
          {mark ? <span aria-hidden="true">{mark}</span> : null}
          {title}
        </h3>
        {note ? (
          <p className="mt-1 max-w-160 text-sm leading-175 text-content-neutral-dark">
            {note}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Indicators({
  vision,
  visionHref,
  indicators,
  readings,
  adoptions,
  addHref,
  editHref,
  archiveIndicator,
  addReadingHref,
  readingsHref,
  setNorthStar,
  trackings,
  taggingPlan,
  addTrackingHref,
  editTrackingHref,
  archiveTracking,
  taggingPlanHref,
  archiveTaggingPlan,
  markers,
  markersHref,
  markerHref,
  addContextHref,
}: {
  /**
   * La raison d'être du produit, telle qu'elle est écrite. `null` quand elle ne
   * l'est pas encore — un état normal, que l'écran dit plutôt que de le blanchir.
   */
  vision: string | null;
  /**
   * Le panneau de la vision, ou `null` quand il est fermé. **Ce n'est pas le
   * droit des indicateurs** : la vision demande `manageDomain`, eux non.
   */
  visionHref: string | null;
  /** Les indicateurs vivants, **North Star d'abord** (le tri de la lecture). */
  indicators: ProductIndicator[];
  /** Tous les relevés vivants du produit, plats et ordonnés (T5.3). */
  readings: ProductReading[];
  /** Ce que les accompagnements vivants ont adopté, cible ou non. */
  adoptions: ProductAdoption[];
  addHref: string | null;
  editHref: ((indicatorId: string) => string) | null;
  archiveIndicator: ((indicatorId: string) => Promise<void>) | null;
  addReadingHref: ((indicatorId: string) => string) | null;
  readingsHref: ((indicatorId: string) => string) | null;
  /** `null` sur un indicateur désigne « aucune North Star ». */
  setNorthStar: ((indicatorId: string | null) => Promise<void>) | null;
  /* --- Le dispositif de mesure (01/09/2026), rang du second bloc ---------- */
  /** Les outils vivants du produit, déjà triés par la requête. */
  trackings: readonly ProductTracking[];
  /** `null` est un état normal, pas un manque (règle 5). */
  taggingPlan: ProductTaggingPlan | null;
  addTrackingHref: string | null;
  editTrackingHref: ((trackingId: string) => string) | null;
  archiveTracking: ((trackingId: string) => Promise<void>) | null;
  /** Une seule adresse pour les deux gestes : le plan est unique par produit. */
  taggingPlanHref: string | null;
  archiveTaggingPlan: (() => Promise<void>) | null;
  /* --- Les repères, posés sur l'axe de la North Star ---------------------- */
  /**
   * Ce qui s'est passé sur le produit — les activités terminées de ses
   * accompagnements, et les repères de contexte saisis. **Déjà fondus et
   * triés** par `mergeMarkers` ; le bloc ne retrie rien.
   */
  markers: readonly ProductMarker[];
  /**
   * Le panneau qui liste les repères. **Jamais nul** : il se lit par tout le
   * domaine (D9), comme la fiche d'un persona.
   */
  markersHref: string;
  /** La fiche d'un repère d'accompagnement. Jamais nulle, même raison. */
  markerHref: (activityId: string) => string;
  /** Le seul geste d'écriture de la couche. `null` le retire. */
  addContextHref: string | null;
}) {
  const series = groupByIndicator(readings);

  /* Les adoptions rangées sous leur indicateur, en une passe — la forme de
     `groupByIndicator`, pour la même raison : un `filter` par indicateur
     parcourrait la liste entière autant de fois qu'il y a d'indicateurs.
     **Deux lecteurs depuis le 18/08/2026** : les traits de cible de la courbe
     North Star, et la puce d'accompagnement de chaque carte. Le second est
     précisément ce que le regroupement en une passe rendait gratuit. */
  const adopted = new Map<string, ProductAdoption[]>();
  for (const adoption of adoptions) {
    const list = adopted.get(adoption.indicatorId);
    if (list) list.push(adoption);
    else adopted.set(adoption.indicatorId, [adoption]);
  }

  /* La lecture trie North Star d'abord ; le composant ne retrie pas, il sépare.
     `find` plutôt qu'un `[0]` : un produit sans North Star a bien un premier
     indicateur, et le prendre pour tel serait en désigner une au hasard. */
  const northStar = indicators.find((indicator) => indicator.isNorthStar);
  const others = indicators.filter((indicator) => !indicator.isNorthStar);

  /* **Deux droits, un seul menu.** Ils tombent séparément — `visionHref` sur
     `manageDomain`, `setNorthStar` sur le droit dérivé des accompagnements —,
     et le menu se rend dès que l'un des deux est ouvert. Une personne peut donc
     n'y voir qu'un geste, ou l'autre : c'est exact, et c'est ce que les deux
     règles disent. Le composant ne les interroge pas, il les reçoit. */
  const designate = setNorthStar;

  return (
    <>
      {/* ================= Bloc 1 · la vision et sa mesure ================= */}

      {/* **`BlockHeader`, et non plus le surtitre de `northstar-v2`**
          (28/08/2026). Le bloc portait depuis le 18/08/2026 un langage
          d'en-tête que les deux autres blocs de la page ne partageaient pas ;
          l'écart, consigné comme assumé, est refermé. Le kebab reprend du même
          coup sa place d'action d'en-tête : il était posé en absolu au coin de
          la carte, ce qui obligeait tout le contenu du bloc à tenir dans un
          seul enfant `relative` et à porter son rythme en marges. Le bloc
          redevient une colonne à `gap-5`, comme ses voisins. */}
      <Block tone="primary">
        <BlockHeader
          title="Vision produit"
          note="Pourquoi ce produit existe, et la mesure qui dit s'il y va."
          /* **Trois droits, un seul menu, et il se rend toujours.** Ils
             tombent séparément — `visionHref` sur `manageDomain`,
             `setNorthStar` et `addContextHref` sur le droit dérivé des
             accompagnements —, et une personne peut n'y voir qu'un geste, ou
             deux : c'est exact, et c'est ce que les règles disent.

             **La condition d'existence du menu a disparu** le jour où les
             repères y sont entrés : « Voir les repères » ne tombe avec aucun
             droit (D9), si bien qu'il y a toujours au moins une entrée. Les
             conditions ne décident plus que du contenu. */
          action={
            <ActionMenu
              /* Le rang discret, celui des gestes en haut à droite d'un bloc
                 (21/08/2026). Sur la surface bleue, les trois points tiennent
                 15,14:1 — mesuré, pas supposé. */
              variant="tertiary"
              label="Options du bloc de la vision produit"
            >
              {/* **Le geste de la vision en tête**, avant les désignations :
                  c'est l'ordre de lecture du bloc, et un menu qui rangerait
                  le premier rang après le second se lirait à l'envers. */}
              {visionHref ? (
                <DrawerLink
                  href={visionHref}
                  request={{ kind: "vision" }}
                  role="menuitem"
                  className={MENU_ITEM}
                >
                  {vision
                    ? "Modifier la vision produit"
                    : "Ajouter la vision produit"}
                </DrawerLink>
              ) : null}
              {designate
                ? indicators.map((indicator) => (
                    <form
                      key={indicator.id}
                      action={designate.bind(null, indicator.id)}
                    >
                      <button
                        type="submit"
                        role="menuitem"
                        disabled={indicator.isNorthStar}
                        className={`${MENU_ITEM} disabled:text-content-neutral-light`}
                      >
                        {indicator.isNorthStar
                          ? `★ ${indicator.label}`
                          : `Désigner ${indicator.label}`}
                      </button>
                    </form>
                  ))
                : null}
              {/* **Les deux entrées des repères**, et c'est tout ce que la
                  page annonce de la couche : le reste tient en six marques de
                  8 px sur l'axe. La lecture est ouverte à tout le domaine
                  (D9) ; la saisie tombe avec le droit dérivé, comme les
                  indicateurs et le dispositif de mesure. */}
              <DrawerLink
                href={markersHref}
                request={{ kind: "markers" }}
                role="menuitem"
                className={MENU_ITEM}
              >
                Voir les repères
              </DrawerLink>
              {addContextHref ? (
                <DrawerLink
                  href={addContextHref}
                  request={{ kind: "contextMarker" }}
                  role="menuitem"
                  className={MENU_ITEM}
                >
                  Ajouter un repère de contexte
                </DrawerLink>
              ) : null}
              {designate && northStar ? (
                <form action={designate.bind(null, null)}>
                  <button
                    type="submit"
                    role="menuitem"
                    className={MENU_ITEM_DANGER}
                  >
                    Retirer la North Star
                  </button>
                </form>
              ) : null}
            </ActionMenu>
          }
        />

        {/* ---- Rang 1 · la vision ------------------------------------- */}

        {/* La question à laquelle le produit répond. Elle est écrite, jamais
            déduite — Vision ne synthétise pas une intention à partir des
            accompagnements qu'elle enregistre.

            **Elle passe de 30 à 24 px** (28/08/2026) : à 30 elle était le plus
            gros texte de l'écran, plus gros que le nom du produit en tête de
            page, et la North Star — l'objet mesuré du bloc — se lisait comme sa
            note de bas de page. La hiérarchie de lecture ne bouge pas pour
            autant : la vision reste **avant** sa mesure, comme `docs/03` la
            pose. C'est le poids qui se rééquilibre, pas l'ordre.

            **La phrase d'explication a disparu** : « La raison d'être de ce
            produit… » disait exactement ce que la note de `BlockHeader` dit
            désormais deux centimètres plus haut, et l'écrire deux fois serait
            bégayer.

            **La barre d'accent tient dans les deux états**, écrit ou vide :
            c'est le gabarit du rang, et un état vide qui la perdrait ne se
            lirait plus comme le même rang. Son dégradé est bâti de deux jetons
            existants — le bleu du produit vers le rouge de la cible, ce que le
            rang dit exactement —, si bien qu'aucune valeur ne s'invente là où
            `tokens.css` §9 nomme ses gradients sans les définir. */}
        <div className="flex max-w-215 gap-5">
          <span
            aria-hidden="true"
            className="w-1 flex-none rounded-sm bg-linear-to-b from-content-primary-dark to-content-warning-darker"
          />
          <div className="min-w-0">
            {vision ? (
              <p className="text-2xl font-semibold leading-275 text-content-neutral-darkest">
                {vision}
              </p>
            ) : (
              /* L'état vide est un **paragraphe et non un `EmptyState`**, la
                 règle des blocs voisins : deux phrases distinctes, là où
                 `EmptyState` n'a qu'un `description`. Une absence ne se crie
                 pas — elle ne prend pas les 24 pixels de la vision.

                 Le lien n'apparaît qu'au responsable de domaine — et ce n'est
                 pas ce rendu qui protège : `updateProductVision` redérive le
                 droit sur l'identifiant reçu. */
              <BlockNote>
                Aucune vision pour l&apos;instant. Ce bloc dira pourquoi ce
                produit existe et vers quoi il va — la question que la North
                Star mesure.
                {visionHref ? (
                  <>
                    {" "}
                    <DrawerLink
                      href={visionHref}
                      request={{ kind: "vision" }}
                      className={ACTION_LINK}
                    >
                      Ajouter la vision produit
                    </DrawerLink>
                  </>
                ) : null}
              </BlockNote>
            )}
          </div>
        </div>

        {/* ---- Rang 2 · la North Star --------------------------------- */}

        {/* Le filet pleine largeur de la maquette. Il sépare deux rangs de même
            poids ; un filet qui s'arrête à mi-course hiérarchise, et ce n'est
            pas ce que ces deux-là sont l'un pour l'autre. */}
        <div aria-hidden="true" className="h-px bg-border-primary-lighter" />

        {/* **Le rang nomme l'indicateur qu'il porte** (28/08/2026) : « North
            Star · métrique principale » disait sa fonction, pas son nom, et le
            nom se répétait ensuite en tête de la carte. Le ★ suit la North Star
            — il titrait le bloc tant qu'elle le titrait, il descend avec elle.
            Décoratif : le titre est écrit juste à côté (`docs/06` §11).

            **Le geste de relevé remonte ici** : il vivait dans le menu de
            chaque carte, et la North Star n'a pas de carte à menu. C'est le
            rang le plus consulté du bloc, et saisir un relevé y était le seul
            geste courant sans point d'entrée visible. Ce n'est pas ce rendu qui
            protège : l'action redérive le droit sur l'identifiant reçu. */}
        <RankHeader
          mark={<span className="text-sm leading-none">★</span>}
          title={
            northStar ? `North Star · ${northStar.label}` : "North Star"
          }
          note="La mesure qui dit si le produit avance dans la direction que sa vision lui donne."
          action={
            northStar && addReadingHref ? (
              <DrawerLink
                href={addReadingHref(northStar.id)}
                request={{ kind: "reading", id: northStar.id }}
                className={buttonClass({ variant: "secondary" })}
              >
                Ajouter un relevé
              </DrawerLink>
            ) : null
          }
        />

        {northStar ? (
          /* **La carte blanche**, le changement structurel de la maquette : le
             rang du milieu se détache de la surface bleue. Rayon 16 px
             (`rounded-2xl`), et le blanc du thème est `surface-neutral-pale` —
             `#ffffff` n'a pas de jeton de surface ici, c'est la règle
             qu'`action-menu.tsx` posait déjà. Sans ombre : `tokens.css` §8
             nomme trois élévations sans leur donner de valeur. */
          <div className="rounded-2xl border border-border-primary-lighter bg-surface-neutral-pale p-6">
            <NorthStar
              indicator={northStar}
              series={series.get(northStar.id) ?? []}
              markers={markers}
              markersHref={markersHref}
              markerHref={markerHref}
            />
          </div>
        ) : (
          /* Un paragraphe et non un `EmptyState` — la règle de `Resources` et
             d'`Indicators` : **deux phrases distinctes**, là où `EmptyState`
             n'a qu'un `description`. N'avoir aucun indicateur et n'en avoir
             désigné aucun ne sont pas la même chose, et l'écran ne les confond
             pas.

             **Sans la carte** : elle encadre une North Star, et une carte
             blanche vide dirait qu'il manque quelque chose à l'endroit où il
             n'y a rien à encadrer. Un état vide est un écran à part entière
             (règle 5), pas la version creuse de l'écran plein. */
          <BlockNote>
            {indicators.length === 0
              ? "Aucun indicateur pour l'instant. Le premier que ce produit portera pourra être désigné North Star : celui qui dit où le produit veut aller."
              : "Aucune North Star désignée. Le menu de ce bloc permet de choisir lequel de ces indicateurs porte l'objectif global du produit."}
          </BlockNote>
        )}
      </Block>

      {/* ================= Bloc 2 · les autres indicateurs ================= */}

      {/* **Un bloc à part entière depuis le 28/08/2026**, là où c'était un
          `<details>` replié au pied du bloc précédent. Le repli avait été
          demandé le 18/08/2026 pour rendre au premier rang la place de ses
          cartes ; il coûtait plus qu'il ne rendait — trois indicateurs
          n'existaient plus pour qui ne remarquait pas un chevron de 10 px, et
          « Ajouter un indicateur » était enterré avec eux.

          Le bloc porte donc son propre en-tête, son propre geste, et son propre
          état vide. Il n'y a **aucune lecture neuve** : ce sont les mêmes
          tableaux, séparés par le même `filter`. */}
      <Block>
        <BlockHeader
          title="Indicateurs"
          /* **La note s'élargit le 01/09/2026**, et c'est la seule retouche de
             cet en-tête. Le bloc a gagné un second rang — le dispositif qui
             collecte ces valeurs —, et un bloc nommé d'après une seule de ses
             deux moitiés se lit mal. Le titre, lui, ne bouge pas : les
             indicateurs restent le sujet, le dispositif répond à la question
             qu'ils font naître. */
          note="Ce que ce produit mesure, en plus de sa North Star — et le dispositif qui collecte ces valeurs. Chaque valeur est reportée d'un outil externe, avec sa date."
          /* **Le geste sort de la grille** : il y vivait en carte pointillée,
             ce qui en faisait un dessin de plus pour un geste que les deux
             autres blocs de la page portent en bouton d'en-tête. Un rang, une
             forme. */
          action={
            addHref ? (
              <DrawerLink
                href={addHref}
                request={{ kind: "indicator" }}
                className={buttonClass({ variant: "secondary" })}
              >
                Ajouter un indicateur
              </DrawerLink>
            ) : null
          }
        />

        {/* `min(300px,100%)` et non `300px` (T7.6) : une piste de 300 px dans un
            conteneur qui en fait 255 ne rétrécit pas, elle déborde — et la carte
            sortait de l'écran sur un téléphone. Le minimum cesse de s'imposer
            quand il dépasse la place ; aucun palier n'est nécessaire, la grille
            se mesure elle-même. */}
        {others.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] gap-4">
            {others.map((indicator) => (
              <IndicatorCard
                key={indicator.id}
                indicator={indicator}
                adoptions={adopted.get(indicator.id) ?? []}
                editHref={editHref}
                archiveIndicator={archiveIndicator}
                addReadingHref={addReadingHref}
                readingsHref={readingsHref}
                setNorthStar={setNorthStar}
              />
            ))}
          </div>
        ) : (
          /* Un paragraphe et non un `EmptyState` — la règle du bloc voisin. Le
             geste, quand il existe, est déjà dans l'en-tête : le redonner ici
             ferait deux points d'entrée à dix centimètres l'un de l'autre. */
          <BlockNote>
            {northStar
              ? "Aucun autre indicateur pour l'instant. Ce bloc réunira les mesures qui accompagnent la North Star, chacune avec sa dernière valeur et sa date."
              : "Aucun indicateur pour l'instant. Ce bloc réunira ce que ce produit mesure — chaque valeur reportée d'un outil externe, avec sa date."}
          </BlockNote>
        )}

        {/* **Le second rang du bloc** (01/09/2026). Il vient après la grille
            parce que c'est l'ordre de la question : on lit ce que le produit
            mesure, puis on demande d'où ces valeurs sortent. Le filet lui est
            passé comme à tout `BlockDivider` — le bloc est de tonalité neutre,
            son filet est donc celui de la surface pâle. */}
        <MeasurementRank
          trackings={trackings}
          plan={taggingPlan}
          addTrackingHref={addTrackingHref}
          editTrackingHref={editTrackingHref}
          archiveTracking={archiveTracking}
          planHref={taggingPlanHref}
          archivePlan={archiveTaggingPlan}
          rule="bg-surface-neutral-lighter"
        />
      </Block>
    </>
  );
}

/**
 * La North Star : son identité et ses chiffres à gauche, son tracé à droite.
 *
 * **`items-center`**, comme la maquette : les deux colonnes se centrent l'une
 * sur l'autre au lieu de s'aligner en haut, ce qui évite la colonne de gauche
 * flottant dans le vide sous une courbe plus haute qu'elle.
 *
 * Trois éléments à gauche, et pas un de plus — c'est ce qui a raccourci le
 * bloc : la ligne « Cible du produit » a disparu (la jauge la porte), la ligne
 * « Adopté par… » aussi (arbitrage du 17/08/2026, « strictement la maquette »),
 * et le **libellé** le 28/08/2026, quand `RankHeader` s'est mis à nommer la
 * North Star au-dessus de la carte. Le rattachement aux accompagnements se lit
 * sur la page projet, bloc « Indicateurs adoptés ».
 */
function NorthStar({
  indicator,
  series,
  markers,
  markersHref,
  markerHref,
}: {
  indicator: ProductIndicator;
  /** Du plus récent au plus ancien — l'ordre de la lecture. */
  series: ProductReading[];
  /** Les repères, **déjà triés**. Le composant les passe sans les regarder. */
  markers: readonly ProductMarker[];
  markersHref: string;
  markerHref: (activityId: string) => string;
}) {
  /* La courbe se lit du plus ancien au plus récent, l'inverse de la série
     écrite. **Une copie est inversée**, jamais le tableau du groupement : il est
     partagé, et le retourner sur place ferait dépendre l'ordre d'un autre
     composant de l'ordre de rendu. */
  const ordered = [...series].reverse();

  /* **Une seule échelle pour la jauge et la courbe** : la jauge est la
     projection du dernier point sur l'axe du tracé. */
  /* **Les cibles d'adoption ne rentrent plus dans l'échelle** (29/08/2026) :
     il n'y en a plus. La seule cible est celle de l'indicateur, et c'est la
     seule valeur hors série que l'axe doit contenir. */
  const scale = axisScale(
    [...ordered.map((reading) => reading.value), indicator.targetValue],
    indicator.unit,
  );

  const lastValue = formatResultValue(indicator.lastValue, indicator.unit);

  /* **L'écart est calculé une fois et descend en deux endroits** : la phrase de
     la colonne de gauche, et le crochet de la courbe. Deux appels à `targetGap`
     auraient pu diverger le jour où l'un des deux change d'argument. */
  const gap = targetGap(
    indicator.targetValue,
    indicator.lastValue,
    indicator.direction,
  );
  const gapText = gapSentence(gap, indicator.unit);

  return (
    <div className="grid gap-y-6 lg:grid-cols-[20rem_1fr] lg:items-center lg:gap-x-11">
      <div>
        {/* **Le libellé n'est plus ici** (28/08/2026) : `RankHeader` nomme la
            North Star deux centimètres plus haut, et l'écrire deux fois faisait
            lire le même nom deux fois à la synthèse vocale comme à l'œil. La
            carte commence donc par ce qu'elle seule porte — la valeur. */}
        {lastValue && indicator.lastReadOn ? (
          <p className="flex flex-wrap items-baseline gap-2">
            <span className="text-4xl font-bold leading-none text-content-neutral-darkest">
              {lastValue}
            </span>
            {/* **La date écrite, et non « aujourd'hui »** : la maquette écrit
                « aujourd'hui » sous le dernier relevé, ce qui serait faux d'un
                relevé de 2024 — et `docs/03` §7 interdit de poser à aujourd'hui
                ce qui porte sa propre date. Même place, un mot juste. */}
            <span className="text-sm text-content-neutral-dark">
              {formatDateMonth(indicator.lastReadOn)}
            </span>
          </p>
        ) : (
          <BlockNote className="mt-4">
            Aucun relevé pour l&apos;instant : cette mesure n&apos;est pas
            encore située dans le temps.
          </BlockNote>
        )}

        {scale ? (
          <Gauge
            scale={scale}
            current={indicator.lastValue}
            target={indicator.targetValue}
            unit={indicator.unit}
          />
        ) : null}

        {/* ⚠ L'indice calculé, arbitré le 17/08/2026. Voir l'en-tête. */}
        {gapText ? (
          <p className="text-sm leading-175 text-content-neutral-dark">
            {gapText}
          </p>
        ) : null}

        {indicator.targetValue === null ? (
          <BlockNote>
            Aucune cible de produit. Le panneau de correction de
            l&apos;indicateur permet d&apos;en poser une.
          </BlockNote>
        ) : null}
      </div>

      {scale && ordered.length > 0 ? (
        <Curve
          scale={scale}
          unit={indicator.unit}
          series={ordered}
          productTarget={indicator.targetValue}
          gap={gap}
          markers={markers}
          markersHref={markersHref}
          markerHref={markerHref}
        />
      ) : null}
    </div>
  );
}

/**
 * La jauge — où en est le dernier relevé sur l'axe du produit.
 *
 * ⚠ **C'est la « jauge de compl��tion » que les interdits d'interface refusent**
 * (`CLAUDE.md`, `docs/06` §10, `brief-design.md` §6). Rétablie sur arbitrage du
 * 17/08/2026, consignée dans `JOURNAL-TECHNIQUE.md` avec l'écart à la cible,
 * dont elle est la forme visuelle.
 *
 * **Elle ne se rend qu'avec ses deux termes** : sans cible ou sans relevé, il
 * n'y a rien à situer, et une piste vide vaut moins que rien.
 *
 * `lower_is_better` ne retourne pas le remplissage : il montre **où l'on est**,
 * pas ce qui reste. Le sens de lecture est porté par la phrase d'écart, qui, elle,
 * le respecte. Le **dégradé de la maquette n'est pas repris** : `tokens.css` §9
 * nomme ses gradients sans leur donner de valeur, et rien ne s'invente.
 */
function Gauge({
  scale,
  current,
  target,
  unit,
}: {
  scale: ValueScale;
  current: string | null;
  target: string | null;
  unit: string | null;
}) {
  if (current === null || target === null) return null;

  const fill = valueOffset(scale, current);
  const mark = valueOffset(scale, target);

  return (
    <div className="mt-2">
      {/* `overflow-visible` : le marqueur déborde de 7 px en haut et en bas, et
          son libellé de 30 px au-dessus. */}
      <div className="relative h-3 rounded-md bg-surface-primary-soft">
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 rounded-md bg-surface-primary-dark"
          style={{ width: `${fill}%` }}
        />
        <div
          aria-hidden="true"
          className="absolute -inset-y-1.5 w-0.5 bg-content-warning-darker"
          style={{ left: `${mark}%` }}
        />
        <span
          className="absolute -top-7 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-content-warning-darker"
          style={{ left: `${mark}%` }}
        >
          <span aria-hidden="true">★ </span>
          Cible {formatResultValue(target, unit)}
        </span>
      </div>

      {/* Les deux bornes écrites : sans repère chiffré, la piste serait le
          graphique décoratif que `docs/06` §10 interdit. */}
      <p className="mt-2 flex justify-between text-2xs text-content-neutral-dark">
        <span>{formatResultValue(String(scale.min), unit)}</span>
        <span>{formatResultValue(String(scale.max), unit)}</span>
      </p>
    </div>
  );
}

/**
 * Le tracé — un `path` dans un `viewBox`, et **aucun texte dans le SVG**.
 *
 * C'est cette séparation qui lève la contrainte de T5.6 : le SVG ne porte que la
 * ligne, tout le reste est du HTML posé par-dessus. Il garde donc la taille de
 * texte de la page, et `path` redevient possible.
 *
 * **Rien ici n'est décoratif** (`docs/06` §10, D41) : les trois graduations sont
 * chiffrées, chaque point écrit sa valeur, la cible écrit la sienne. Ce sont des
 * valeurs reportées, jamais un indice — à la seule exception du crochet d'écart,
 * arbitré le 17/08/2026 et signalé sur place.
 */
function Curve({
  scale,
  unit,
  series,
  productTarget,
  gap,
  markers,
  markersHref,
  markerHref,
}: {
  scale: ValueScale;
  unit: string | null;
  /** Du plus ancien au plus récent. Au moins un élément. */
  series: readonly ProductReading[];
  /**
   * La cible de l'indicateur — **la seule**. Le tracé n'a donc qu'un trait
   * tireté à poser, là où il en posait un par adoption jusqu'au 29/08/2026.
   */
  productTarget: string | null;
  /**
   * L'écart du dernier relevé à la cible du produit, **déjà calculé** par
   * `NorthStar`. ⚠ C'est l'indice que D39 interdit — voir l'en-tête.
   */
  gap: TargetGap | null;
  /**
   * Les repères posés sur la ligne du bas — ce qui s'est passé sur le produit.
   *
   * **Ils entrent dans l'axe**, et c'est la seule chose qu'ils y changent : la
   * bande n'ajoute aucune hauteur, ne porte aucun libellé, et l'échelle
   * verticale ne les voit pas — un repère n'a pas de valeur.
   */
  markers: readonly ProductMarker[];
  markersHref: string;
  markerHref: (activityId: string) => string;
}) {
  /* **L'axe contient les deux séries**, et il le doit : borné sur les seuls
     relevés, il ramenait tout repère hors fenêtre contre son bord (`clampIndex`)
     — une date affirmée qui est fausse. La règle vit dans `curveTimeline`, pure
     et éprouvée, plutôt que dans cette expression. */
  const timeline = curveTimeline(
    series.map((reading) => reading.readOn),
    markers.map((marker) => marker.on),
  );
  const ticks = timeline ? monthTicks(timeline) : [];

  /** L'ordonnée d'une valeur, en pourcentage **depuis le haut**. */
  const topOf = (value: string) => 100 - valueOffset(scale, value);

  const points = series.map((reading) => ({
    id: reading.id,
    x: timeline ? monthMark(timeline, reading.readOn) : 50,
    y: valueOffset(scale, reading.value),
    label: formatResultValue(reading.value, unit),
  }));

  const targetTop = productTarget === null ? null : topOf(productTarget);

  /* Les repères prennent **la même abscisse que les points** : même fenêtre,
     même `monthMark`. Rien de neuf ne se calcule — c'est ce qui garantit qu'un
     repère de mars 2026 tombe exactement sous le relevé de mars 2026. */
  const marks = markers.map((marker) => ({
    marker,
    x: timeline ? monthMark(timeline, marker.on) : 50,
  }));

  /* ⚠ **Le crochet d'écart et sa pastille** (18/08/2026, maquette
     `northstar-v2`). Ils redisent en image ce que la phrase de la colonne de
     gauche dit en mots, et tombent sous la même dérogation à D39, arbitrée le
     17/08 puis élargie le 18/08 — voir l'en-tête.

     Rien ne s'y calcule de neuf : `gap` arrive tout fait, et les deux ordonnées
     sont celles que la courbe posait déjà. Il ne se rend que si les trois
     termes existent **et** que la cible n'est pas atteinte : une cible atteinte
     n'a pas d'écart à montrer, et le crochet serait de hauteur nulle. */
  const last = points.at(-1);
  const bracket =
    gap && !gap.reached && targetTop !== null && last
      ? {
          left: last.x,
          top: Math.min(100 - last.y, targetTop),
          height: Math.abs(100 - last.y - targetTop),
          label: `+${formatResultValue(String(gap.distance), unit)}`,
        }
      : null;

  return (
    <div>
      {/* La boîte du tracé : 168 px de haut, 44 px réservés à gauche pour les
          trois libellés d'axe. */}
      <div className="relative h-42 pl-11">
        <span className="absolute left-0 -top-1.5 text-xs text-content-neutral-dark">
          {formatResultValue(String(scale.max), unit)}
        </span>
        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xs text-content-neutral-dark">
          {formatResultValue(String((scale.min + scale.max) / 2), unit)}
        </span>
        <span className="absolute left-0 -bottom-1.5 text-xs text-content-neutral-dark">
          {formatResultValue(String(scale.min), unit)}
        </span>

        <div className="relative h-full">
          {/* Trois filets : haut, milieu, bas. Décoratifs — les trois valeurs
              sont écrites juste à gauche. */}
          {[0, 50, 100].map((at) => (
            <div
              key={at}
              aria-hidden="true"
              className="absolute inset-x-0 h-px bg-surface-neutral-opacity-faint"
              style={{ top: `${at}%` }}
            />
          ))}

          {/* La cible du produit : un trait tireté et sa pastille, posée sur le
              fond du bloc pour rester lisible par-dessus les filets. */}
          {targetTop !== null ? (
            <>
              <div
                aria-hidden="true"
                className="absolute inset-x-0 border-t-[length:var(--border-width-1)] border-dashed border-content-warning-darker"
                style={{ top: `${targetTop}%` }}
              />
              <span
                className="absolute left-0.5 -translate-y-1/2 bg-surface-neutral-pale px-1.5 text-xs font-bold text-content-warning-darker"
                style={{ top: `${targetTop}%` }}
              >
                <span aria-hidden="true">★ </span>
                Cible {formatResultValue(productTarget, unit)}
              </span>
            </>
          ) : null}

          {/* **La gouttière de droite se resserre** (18/08/2026). Elle valait 96
              pixels depuis le 17/08 pour protéger le libellé de cible, qui
              vivait au bord droit ; il est passé à gauche avec la maquette
              `northstar-v2`, et cette largeur n'a plus de raison d'être. Il en
              reste 32 : de quoi laisser respirer la valeur du dernier point et
              sa pastille d'écart, sans écraser le tracé.

              Les filets et les traits de cible gardent, eux, toute la largeur —
              ce sont eux qui portent le libellé, et les rétrécir l'aurait
              décollé du bord. */}
          <div className="absolute inset-y-0 left-0 right-8">
            <svg
              aria-hidden="true"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full overflow-visible"
            >
              <path
                d={curvePath(points)}
                fill="none"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                className="stroke-content-primary-dark"
              />
            </svg>

            {points.map((point) => (
              <div
                key={point.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${point.x}%`, top: `${100 - point.y}%` }}
              >
                {/* L'anneau est une **bordure** de la couleur du fond, et non
                  l'ombre de la maquette : le design system nomme ses trois
                  élévations sans leur donner de valeur (`tokens.css` §8). */}
                <span
                  aria-hidden="true"
                  className="block h-3 w-3 rounded-full border-[length:var(--border-width-1)] border-surface-neutral-pale bg-surface-primary-dark"
                />
                {/* La valeur écrite : c'est elle qui empêche la courbe d'être un
                  graphique décoratif. */}
                {/* Le libellé se cale sur la position, comme les graduations de
                  temps : centré au milieu, mais rentré aux deux bouts — sinon
                  la moitié du premier sort à gauche et la moitié du dernier
                  déborde dans la gouttière. */}
                <span
                  className={`absolute bottom-4 whitespace-nowrap text-xs font-semibold text-content-primary-dark ${
                    point.x <= 8
                      ? "left-0"
                      : point.x >= 92
                        ? "right-0"
                        : "left-1/2 -translate-x-1/2"
                  }`}
                >
                  {point.label}
                </span>
              </div>
            ))}

            {/* ⚠ Le crochet d'écart et sa pastille — la dérogation à D39, voir
              plus haut. Ils vivent **dans la gouttière** avec les points, et
              non dans la boîte pleine largeur : le crochet se pose à l'abscisse
              du dernier point, et un autre repère y aurait décalé les deux.

              La pastille se range **à gauche** du crochet et non dessus : à
              cette abscisse, le crochet touche presque le bord droit, et la
              poser dessus l'en aurait fait sortir. */}
            {bracket ? (
              <>
                <div
                  aria-hidden="true"
                  className="absolute w-0 border-l-[length:var(--border-width-1)] border-dotted border-content-warning-darker"
                  style={{
                    left: `${bracket.left}%`,
                    top: `${bracket.top}%`,
                    height: `${bracket.height}%`,
                  }}
                />
                <span
                  className="absolute -ml-2 -translate-x-full -translate-y-1/2 whitespace-nowrap rounded-full bg-content-warning-darker px-2 py-0.5 text-2xs font-bold text-content-neutral-pale"
                  style={{
                    left: `${bracket.left}%`,
                    top: `${bracket.top + bracket.height / 2}%`,
                  }}
                >
                  {bracket.label}
                </span>
              </>
            ) : null}

            {/* ============ LES REPÈRES ============

              Six marques de 8 px posées **sur la ligne du bas** — l'axe des
              dates, déjà là. Aucune hauteur ajoutée : la cible de clic de 24 px
              déborde du tracé sans le pousser, et le bloc garde exactement la
              taille qu'il avait.

              **La forme distingue, jamais la couleur seule** (`docs/06` §11) :
              disque plein pour un accompagnement, anneau pour un repère de
              contexte — et chaque marque porte sa phrase entière en `sr-only`,
              si bien que ni la forme ni l'infobulle ne portent seules.

              **L'infobulle est en CSS pur.** Elle paraît au survol et au focus
              clavier ; au doigt, c'est le panneau qui s'ouvre, ce qui est le
              meilleur des deux comportements tactiles. Aucun JavaScript, aucun
              composant client — le bloc reste rendu sur le serveur. Elle est
              `aria-hidden` : le nom accessible est le `sr-only`, et le lire
              deux fois serait bégayer.

              Sa surface est `surface-neutral-darkest`, la **seule du thème qui
              se détache sans ombre** — `tokens.css` §8 nomme trois élévations
              sans leur donner de valeur, et aucun neuvième jeton ne s'invente.

              Son calage suit celui des valeurs de point, et pour la même
              raison : centrée au milieu, rentrée aux deux bouts. */}
            {marks.map(({ marker, x }) => (
              <DrawerLink
                key={`${marker.kind}-${marker.id}`}
                href={
                  marker.kind === "accompaniment"
                    ? markerHref(marker.id)
                    : markersHref
                }
                request={
                  marker.kind === "accompaniment"
                    ? { kind: "markerDetail", id: marker.id }
                    : { kind: "markers" }
                }
                className="group absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                style={{ left: `${x}%`, top: "100%" }}
              >
                <span className="sr-only">{markerSentence(marker)}</span>
                <span
                  aria-hidden="true"
                  className={`block size-2 rounded-full border-[length:var(--border-width-1)] ${
                    marker.kind === "accompaniment"
                      ? "border-surface-neutral-pale bg-surface-primary-dark"
                      : "border-surface-neutral-base bg-surface-neutral-pale"
                  }`}
                />
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute bottom-6 z-10 hidden w-64 rounded-xl bg-surface-neutral-darkest px-3 py-2 group-hover:block group-focus-visible:block ${
                    x <= 8
                      ? "left-0"
                      : x >= 92
                        ? "right-0"
                        : "left-1/2 -translate-x-1/2"
                  }`}
                >
                  <span className="block text-2xs leading-125 text-content-neutral-light">
                    {formatDay(marker.on)}
                    {" · "}
                    {TOOLTIP_KIND[marker.kind]}
                  </span>
                  <span className="mt-1 block text-xs font-semibold leading-125 text-content-neutral-pale">
                    {marker.label}
                  </span>
                  {marker.projectName ? (
                    <span className="mt-1 block text-2xs leading-125 text-content-neutral-light">
                      {marker.projectName}
                    </span>
                  ) : null}
                  {marker.resultLabel ? (
                    <span className="mt-1.5 block text-2xs leading-125 text-content-neutral-pale">
                      {marker.resultLabel}
                      {formatResultValue(marker.resultValue, marker.resultUnit)
                        ? ` : ${formatResultValue(marker.resultValue, marker.resultUnit)}`
                        : ""}
                    </span>
                  ) : null}
                </span>
              </DrawerLink>
            ))}
          </div>
        </div>
      </div>

      {/* Les graduations de temps, **alignées sur la zone de tracé** : même
          retrait à gauche pour les libellés d'axe (`ml-11`) et même gouttière à
          droite (`mr-8`) que le tracé. Sans la seconde, la dernière graduation
          tomberait à droite du dernier point qu'elle situe. */}
      {/* **`mt-3` et non `mt-2` depuis les repères** : les marques enjambent la
          ligne du bas du tracé et débordent de quatre pixels dessous. Sans ces
          quatre pixels rendus, elles touchaient les graduations. */}
      <div className="relative ml-11 mr-8 mt-3 h-4">
        {ticks.map((tick) => (
          <span
            key={tick.month}
            className={`absolute whitespace-nowrap text-xs text-content-neutral-dark ${
              tick.anchor === "start"
                ? ""
                : tick.anchor === "end"
                  ? "-translate-x-full"
                  : "-translate-x-1/2"
            }`}
            style={{ left: `${tick.left}%` }}
          >
            {formatMonthTick(tick.month)}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Ce que la puce d'accompagnement dit à l'assistance, en une phrase entière.
 *
 * **Deux phrases entières, choisies par le décompte**, et non une phrase à
 * suffixes : c'est la règle du dépôt depuis T5.4, née d'un refus qui se lisait
 * « ranger le produit **les** ferait disparaître » pour un seul accompagnement.
 * Une phrase à trous ne se relit pas dans ses deux états.
 *
 * Elle nomme **tous** les accompagnements, là où l'écran n'en montre qu'un et
 * compte les autres : le `+2` visible est un raccourci de place, pas une
 * information retirée. Rien ne se perd pour qui écoute la page.
 */
function accompanimentSentence(adoptions: readonly ProductAdoption[]): string {
  const names = adoptions.map((adoption) => adoption.projectName);

  if (names.length === 1) {
    return `Accompagnement qui porte cet indicateur : ${names[0]}.`;
  }
  return `Accompagnements qui portent cet indicateur : ${names.join(", ")}.`;
}

/**
 * Une carte d'indicateur associé.
 *
 * La sparkline **ne porte pas seule** : la dernière valeur, sa date et le
 * décompte de relevés sont écrits à côté. Une courbe sans chiffre serait le
 * graphique décoratif que `docs/06` §10 interdit.
 *
 * **Des marges par élément, jamais un `gap` uniforme** : c'est ce qui rendait
 * les cartes trop aérées. La maquette rythme 12/14/12, un `gap` mettait 12
 * partout, y compris là où elle n'en met aucun.
 */
function IndicatorCard({
  indicator,
  adoptions,
  editHref,
  archiveIndicator,
  addReadingHref,
  readingsHref,
  setNorthStar,
}: {
  indicator: ProductIndicator;
  /**
   * Les accompagnements qui portent cet indicateur, **déjà triés par nom** par
   * `listProductAdoptions`. Vide est une réponse : la carte ne dit rien.
   */
  adoptions: readonly ProductAdoption[];
  editHref: ((indicatorId: string) => string) | null;
  archiveIndicator: ((indicatorId: string) => Promise<void>) | null;
  addReadingHref: ((indicatorId: string) => string) | null;
  readingsHref: ((indicatorId: string) => string) | null;
  setNorthStar: ((indicatorId: string | null) => Promise<void>) | null;
}) {
  const lastValue = formatResultValue(indicator.lastValue, indicator.unit);

  return (
    <div className="relative rounded-2xl border border-surface-neutral-lighter bg-surface-neutral-pale p-3">
      {editHref || addReadingHref || readingsHref || setNorthStar ? (
        /* **Le conteneur porte le positionnement, jamais le menu** : sa racine
           est `relative`, dont son déroulant a besoin pour s'ancrer. */
        <div className="absolute right-3 top-3">
          <ActionMenu label={`Options de l'indicateur ${indicator.label}`}>
            {editHref ? (
              <DrawerLink
                href={editHref(indicator.id)}
                request={{ kind: "indicator", id: indicator.id }}
                role="menuitem"
                className={MENU_ITEM}
              >
                Modifier l&apos;indicateur
              </DrawerLink>
            ) : null}
            {addReadingHref ? (
              <DrawerLink
                href={addReadingHref(indicator.id)}
                request={{ kind: "reading", id: indicator.id }}
                role="menuitem"
                className={MENU_ITEM}
              >
                Ajouter un relevé
              </DrawerLink>
            ) : null}
            {readingsHref ? (
              <DrawerLink
                href={readingsHref(indicator.id)}
                request={{ kind: "readings", id: indicator.id }}
                role="menuitem"
                className={MENU_ITEM}
              >
                Gérer les relevés
              </DrawerLink>
            ) : null}
            {setNorthStar ? (
              <form action={setNorthStar.bind(null, indicator.id)}>
                <button type="submit" role="menuitem" className={MENU_ITEM}>
                  Définir comme North Star
                </button>
              </form>
            ) : null}
            {/* **Le geste disparaît quand l'indicateur est adopté** — l'arbitrage
              (e) de `tickets-C5.md`, inchangé. */}
            {archiveIndicator && indicator.adoptionCount === 0 ? (
              <form action={archiveIndicator.bind(null, indicator.id)}>
                <button
                  type="submit"
                  role="menuitem"
                  className={MENU_ITEM_DANGER}
                >
                  Archiver
                </button>
              </form>
            ) : null}
          </ActionMenu>
        </div>
      ) : null}

      <p className="min-h-8 pr-9 text-sm font-semibold leading-125 text-content-neutral-darkest">
        {indicator.label}
      </p>

      {/* **L'accompagnement qui porte la mesure**, sous son libellé et pas
          ailleurs : c'est ce qui répond à « d'où vient ce chiffre » sans
          déplacer le chiffre. La forme est celle d'`AvatarGroup` — une phrase
          `sr-only` porte tout, les éléments visibles n'en portent rien : une
          puce nue lue « Refonte 2026 » sous un libellé d'indicateur ne dit pas
          ce que ce nom est. */}
      {adoptions.length > 0 ? (
        <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="sr-only">{accompanimentSentence(adoptions)}</span>
          <Tag label={adoptions[0]?.projectName ?? ""} />
          {adoptions.length > 1 ? (
            <span
              aria-hidden="true"
              className="text-2xs font-semibold text-content-neutral-dark"
            >
              {`+${adoptions.length - 1}`}
            </span>
          ) : null}
        </p>
      ) : null}

      {lastValue && indicator.lastReadOn ? (
        <p className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="text-2xl font-bold leading-none text-content-neutral-darkest">
            {lastValue}
          </span>
          <span className="text-xs text-content-neutral-base">
            <span aria-hidden="true">· </span>
            {formatDateMonth(indicator.lastReadOn)}
          </span>
        </p>
      ) : (
        <BlockNote className="mt-2">Aucun relevé pour l&apos;instant.</BlockNote>
      )}

      <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-content-neutral-base">
        <span className="rounded-full bg-surface-primary-lighter px-2 py-0.5 text-2xs font-semibold text-content-neutral-dark">
          {formatIndicatorDirection(indicator.direction)}
        </span>
        {formatReadings(indicator.readingCount)}
      </p>
    </div>
  );
}
