/**
 * Le bloc « Vision produit » de la page produit — **la question, puis la mesure
 * de la question.**
 *
 * Récrit hors ticket le 17/08/2026 d'après
 * `docs/design/maquettes/blocs/northstar/NorthStar.dc.html`, puis **élargi le
 * 18/08/2026** : il ne disait que comment le produit se mesure, jamais pourquoi
 * il existe. Une North Star sans vision est une métrique posée sans l'intention
 * qu'elle sert. Quatre rangs, dans l'ordre où la question se pose :
 *
 *   1. la **vision produit** — pourquoi ce produit existe, et où il veut aller ;
 *   2. la **North Star** — l'indicateur qui dit si l'on avance dans cette
 *      direction. Sa courbe, sa cible, son dernier relevé ;
 *   3. les **indicateurs associés**, en cartes, sous un séparateur nommé ;
 *   4. sous chacun, **l'accompagnement qui le porte**, en puce discrète.
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
 * **Des marges par élément, jamais un `gap` uniforme.** Un `gap` met la même
 * valeur partout ; les maquettes rythment. La règle a toujours valu dans
 * `NorthStar` et dans `IndicatorCard` ; elle **revaut au premier rang du bloc**
 * depuis la reprise de `northstar-v2` (18/08/2026), qui rythme 16/30-26/14/34-16.
 * Le 17/08 l'avait retirée au profit du `gap-5` de `Block`, par souci de
 * cohérence avec les deux blocs voisins ; la nouvelle maquette la rétablit, et
 * c'est le même arbitrage que celui de l'en-tête ci-dessous. Tout le contenu du
 * bloc tient donc dans **un seul enfant de `Block`** — le `gap-5` ne s'applique
 * plus qu'à lui, et le rythme se porte en marges.
 *
 * **La coquille est celle de `components/ui/block.tsx`, l'en-tête ne l'est
 * plus** (18/08/2026). `Block tone="primary"` ne bouge pas : rayon, filet,
 * surface bleue, `p-6`. `BlockHeader`, si — la maquette remplace la ligne
 * « titre + note + menu » par un **surtitre** de 12 pixels en capitales et un
 * kebab posé en absolu au coin. Ce bloc porte donc désormais un langage
 * d'en-tête que « Accompagnements en cours » et « Tous les accompagnements » ne
 * partagent pas : **c'est un écart assumé**, arbitré le 18/08/2026, consigné
 * dans `JOURNAL-TECHNIQUE.md`. Il défait pour ce bloc seul l'unification du
 * 17/08.
 *
 * **La hiérarchie des titres, elle, ne bouge pas** : le surtitre « Vision
 * produit » porte le `h2` que `BlockHeader` portait, « North Star » et
 * « Indicateurs associés » restent des `h3`. Un surtitre n'est un surtitre que
 * visuellement — pour l'assistance, c'est le titre du bloc, et la page produit
 * en compte trois au même rang. Les marques (le filet, le ★) sortent de l'arbre
 * d'accessibilité : la couleur ne porte jamais seule (`docs/06` §11).
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
import { Block, BlockDivider } from "@/components/ui/block";
import { BlockNote } from "@/components/ui/empty-state";
import { Tag } from "@/components/ui/tag";
import { ACTION_LINK } from "@/components/ui/action-link";
import {
  formatComplementaryIndicators,
  formatDateMonth,
  formatIndicatorDirection,
  formatMonthTick,
  formatReadings,
  formatResultValue,
} from "@/lib/format";
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
  monthMark,
  monthTicks,
  timelineScale,
  valueOffset,
  type ValueScale,
} from "@/lib/queries/timeline";

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
 * Un surtitre de rang : une marque, un mot en capitales, et rien d'autre.
 *
 * **C'est le langage propre à ce bloc**, celui que la maquette `northstar-v2`
 * substitue à `BlockHeader` — voir l'avertissement de l'en-tête. Il vit ici et
 * non dans `components/ui/block.tsx` précisément parce qu'il n'est **pas**
 * partagé : le jour où un second bloc le reprend, il déménagera, et pas avant.
 * `BlockDivider` reste, lui, dans le langage commun — il porte un filet fuyant
 * que celui-ci n'a pas.
 *
 * Le niveau de titre arrive en prop : le premier surtitre est le titre du bloc
 * (`h2`), le second une de ses parties (`h3`). Un surtitre n'est un surtitre
 * que visuellement.
 */
function Eyebrow({
  level,
  mark,
  title,
  tone,
}: {
  level: "h2" | "h3";
  /** **Décorative** : elle sort de l'arbre d'accessibilité. */
  mark: ReactNode;
  title: string;
  /** La classe de couleur du texte — le bleu du produit, le rouge de la cible. */
  tone: string;
}) {
  const Heading = level;

  return (
    <Heading
      className={`flex items-center gap-2 text-xs font-bold uppercase ${tone}`}
    >
      <span aria-hidden="true" className="flex items-center">
        {mark}
      </span>
      {title}
    </Heading>
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
    <Block tone="primary">
      {/* **Un seul enfant de `Block`**, et c'est structurel : le `gap-5` de la
          coquille ne s'applique alors qu'à lui, et le rythme propre de la
          maquette se porte en marges élément par élément. `relative` ancre le
          kebab — `ActionMenu` refuse tout `className`, sa racine portant
          elle-même le `relative` dont son déroulant a besoin (cf. son en-tête),
          et qui veut le placer l'enveloppe. */}
      <div className="relative">
        {visionHref || designate ? (
          <div className="absolute right-0 top-0 z-10">
            <ActionMenu label="Options du bloc de la vision produit">
              {/* **Le geste de la vision en tête**, avant les désignations :
                  c'est l'ordre de lecture du bloc, et un menu qui rangerait le
                  premier rang après le second se lirait à l'envers. */}
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
          </div>
        ) : null}

        {/* ---- Rang 1 · la vision ------------------------------------- */}

        {/* Le filet de 22×3 de la maquette. L'interlettrage de `.16em` n'est
            toujours pas rendu — aucun jeton, dette n°4. */}
        <Eyebrow
          level="h2"
          mark={
            <span className="block h-0.5 w-5 rounded-xs bg-content-primary-dark" />
          }
          title="Vision produit"
          tone="text-content-primary-dark"
        />

        {/* La question à laquelle le produit répond. Elle est écrite, jamais
            déduite — Vision ne synthétise pas une intention à partir des
            accompagnements qu'elle enregistre.

            **La barre d'accent tient dans les deux états**, écrit ou vide :
            c'est le gabarit du rang, et un état vide qui la perdrait ne se
            lirait plus comme le même rang. Son dégradé est bâti de deux jetons
            existants — le bleu du produit vers le rouge de la cible, ce que le
            rang dit exactement —, si bien qu'aucune valeur ne s'invente là où
            `tokens.css` §9 nomme ses gradients sans les définir. */}
        <div className="mt-4 flex max-w-215 gap-5">
          <span
            aria-hidden="true"
            className="w-1 flex-none rounded-sm bg-linear-to-b from-content-primary-dark to-content-warning-darker"
          />
          <div className="min-w-0">
            {vision ? (
              <>
                <p className="text-3xl font-semibold leading-325 text-content-neutral-darkest">
                  {vision}
                </p>
                <p className="mt-3 text-sm leading-175 text-content-neutral-dark">
                  La raison d&apos;être de ce produit, et la direction
                  qu&apos;il se donne. Tous les indicateurs ci-dessous servent
                  cette vision.
                </p>
              </>
            ) : (
              /* L'état vide est un **paragraphe et non un `EmptyState`**, la
                 règle des deux blocs voisins : deux phrases distinctes, là où
                 `EmptyState` n'a qu'un `description`. Il ne reprend pas la note
                 du cas écrit — « ce bloc dira pourquoi ce produit existe » la
                 dit déjà, et l'afficher deux fois serait bégayer. Il ne prend
                 pas non plus les 30 pixels de la vision : une absence ne se
                 crie pas.

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

        {/* Le filet pleine largeur de la maquette, là où le 17/08 posait un
            `BlockDivider` à filet fuyant. Il sépare deux rangs de même poids ;
            un filet qui s'arrête à mi-course hiérarchise, et ce n'est pas ce
            que ces deux-là sont l'un pour l'autre. */}
        <div
          aria-hidden="true"
          className="mt-7 mb-6 h-px bg-border-primary-lighter"
        />

        {/* Le ★ suit la North Star : il titrait le bloc tant qu'elle le
            titrait, il descend avec elle. Décoratif — le titre est écrit juste
            à côté, et la couleur ne porte jamais seule (`docs/06` §11). */}
        <Eyebrow
          level="h3"
          mark={<span className="text-sm leading-none">★</span>}
          title="North Star · métrique principale"
          tone="text-content-warning-darker"
        />

        {northStar ? (
          /* **La carte blanche**, le changement structurel de la maquette : le
             rang du milieu se détache de la surface bleue. Rayon 16 px
             (`rounded-2xl`), et le blanc du thème est `surface-neutral-pale` —
             `#ffffff` n'a pas de jeton de surface ici, c'est la règle
             qu'`action-menu.tsx` posait déjà. Sans ombre : `tokens.css` §8
             nomme trois élévations sans leur donner de valeur. */
          <div className="mt-3 rounded-2xl border border-border-primary-lighter bg-surface-neutral-pale p-6">
            <NorthStar
              indicator={northStar}
              series={series.get(northStar.id) ?? []}
              adoptions={adopted.get(northStar.id) ?? []}
            />
          </div>
        ) : (
          /* Un paragraphe et non un `EmptyState` — la règle de `Resources` et
             d'`Indicators` : **deux phrases distinctes**, là où `EmptyState` n'a
             qu'un `description`. N'avoir aucun indicateur et n'en avoir désigné
             aucun ne sont pas la même chose, et l'écran ne les confond pas.

             **Sans la carte** : elle encadre une North Star, et une carte
             blanche vide dirait qu'il manque quelque chose à l'endroit où il
             n'y a rien à encadrer. Un état vide est un écran à part entière
             (règle 5), pas la version creuse de l'écran plein. */
          <BlockNote className="mt-3">
            {indicators.length === 0
              ? "Aucun indicateur pour l'instant. Le premier que ce produit portera pourra être désigné North Star : celui qui dit où le produit veut aller."
              : "Aucune North Star désignée. Le menu de ce bloc permet de choisir lequel de ces indicateurs porte l'objectif global du produit."}
          </BlockNote>
        )}

        {/* ---- Rang 3 · les indicateurs associés ----------------------- */}

        {/* **« Indicateurs associés » et non « Autres indicateurs »**
            (18/08/2026) : « autres » ne disait qu'une exclusion — ce qui n'est
            pas la North Star. Le mot juste dit ce qu'ils sont : les mesures qui
            accompagnent celle-là.

            Le décompte est neuf (maquette `northstar-v2`) et dit
            « complémentaire » là où l'intertitre dit « associé » : répéter le
            même mot à dix centimètres n'aurait rien ajouté.

            **Replié par défaut** (18/08/2026, demande de l'humain) : le rang
            gagne la place de ses cartes tant qu'on ne les demande pas, et la
            question du produit — la vision, puis la North Star — reste seule à
            l'écran. C'est un `<details>` natif, sans JavaScript, comme le
            groupe « Annulé » de la roadmap projet ; l'intertitre en devient le
            `<summary>`, décompte compris — savoir combien d'indicateurs sont
            repliés est ce qui donne envie de les déplier.

            **L'ajout se replie avec eux.** « Ajouter un indicateur » vit dans
            la grille, et l'en sortir pour le garder visible aurait déplacé un
            point d'entrée que la maquette pose là. Il reste à un clic, et le
            menu du bloc n'est pas le seul chemin. */}
        <details className="group mt-8">
          <BlockDivider
            as="summary"
            /* Le chevron **remplace le triangle natif**, que `flex` retire à
               `<summary>` : il tourne d'un quart de tour à l'ouverture. Il est
               décoratif — `<summary>` expose déjà l'état à l'assistance, et la
               couleur ne porte jamais seule (`docs/06` §11). */
            mark={
              <span className="inline-block text-2xs leading-none transition-transform group-open:rotate-90">
                ▶
              </span>
            }
            title="Indicateurs associés"
            note={formatComplementaryIndicators(others.length)}
            rule="bg-border-primary-lighter"
          />

          {/* La grille **ne bouge pas** : la maquette `northstar-v2` ne porte
              plus les cartes, et c'est une omission de la maquette, pas une
              suppression demandée. */}
          <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
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

            {addHref ? (
              <DrawerLink
                href={addHref}
                request={{ kind: "indicator" }}
                className="flex min-h-24 items-center justify-center gap-2 rounded-2xl border border-dashed border-border-primary-light text-sm font-semibold text-content-primary-dark"
              >
                <span aria-hidden="true" className="text-lg leading-none">
                  +
                </span>
                Ajouter un indicateur
              </DrawerLink>
            ) : null}

            {others.length === 0 && !addHref ? (
              <BlockNote>Aucun indicateur associé sur ce produit.</BlockNote>
            ) : null}
          </div>
        </details>
      </div>
    </Block>
  );
}

/**
 * La North Star : son identité et ses chiffres à gauche, son tracé à droite.
 *
 * **`items-center`**, comme la maquette : les deux colonnes se centrent l'une
 * sur l'autre au lieu de s'aligner en haut, ce qui évite la colonne de gauche
 * flottant dans le vide sous une courbe plus haute qu'elle.
 *
 * Quatre éléments à gauche, et pas un de plus — c'est ce qui a raccourci le
 * bloc : la ligne « Cible du produit » a disparu (la jauge la porte) et la
 * ligne « Adopté par… » aussi (arbitrage du 17/08/2026, « strictement la
 * maquette »). Le rattachement aux accompagnements se lit sur la page projet,
 * bloc « Indicateurs adoptés ».
 */
function NorthStar({
  indicator,
  series,
  adoptions,
}: {
  indicator: ProductIndicator;
  /** Du plus récent au plus ancien — l'ordre de la lecture. */
  series: ProductReading[];
  adoptions: ProductAdoption[];
}) {
  /* La courbe se lit du plus ancien au plus récent, l'inverse de la série
     écrite. **Une copie est inversée**, jamais le tableau du groupement : il est
     partagé, et le retourner sur place ferait dépendre l'ordre d'un autre
     composant de l'ordre de rendu. */
  const ordered = [...series].reverse();

  /* **Une seule échelle pour la jauge et la courbe** : la jauge est la
     projection du dernier point sur l'axe du tracé. */
  const scale = axisScale(
    [
      ...ordered.map((reading) => reading.value),
      ...adoptions.map((adoption) => adoption.targetValue),
      indicator.targetValue,
    ],
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
        <p className="text-lg font-semibold leading-125 text-content-neutral-darkest">
          {indicator.label}
        </p>

        {lastValue && indicator.lastReadOn ? (
          <p className="mt-4 flex flex-wrap items-baseline gap-2">
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
          adoptions={adoptions}
          gap={gap}
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
  adoptions,
  gap,
}: {
  scale: ValueScale;
  unit: string | null;
  /** Du plus ancien au plus récent. Au moins un élément. */
  series: readonly ProductReading[];
  productTarget: string | null;
  adoptions: readonly ProductAdoption[];
  /**
   * L'écart du dernier relevé à la cible du produit, **déjà calculé** par
   * `NorthStar`. ⚠ C'est l'indice que D39 interdit — voir l'en-tête.
   */
  gap: TargetGap | null;
}) {
  const timeline = timelineScale(series.map((reading) => reading.readOn));
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

  /* Les cibles d'adoption qui **ajoutent quelque chose** : ni celle du produit
     répétée, ni deux fois la même. `valueOffset` sert de clé plutôt que la
     chaîne brute — « 85 » et « 85.0000 » sont la même cible, et se
     superposeraient au pixel près. */
  const seen = new Set(
    productTarget === null ? [] : [valueOffset(scale, productTarget)],
  );
  const distinctTargets = adoptions.flatMap((adoption) => {
    if (adoption.targetValue === null) return [];
    const at = valueOffset(scale, adoption.targetValue);
    if (seen.has(at)) return [];
    seen.add(at);
    return [{ projectId: adoption.projectId, value: adoption.targetValue }];
  });

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

          {/* Les cibles d'accompagnement, **dédoublonnées de celle du produit**
              (correctif du 17/08/2026) : quand un accompagnement s'est donné la
              même cible que le produit — le cas courant —, son trait se
              superposait exactement à celui du produit et son libellé
              s'affichait par-dessus. Deux fois « Cible 85 % » au même endroit.
              `distinctTargets` ne garde que les valeurs qui disent autre chose.

              Même rouge que la cible du produit : ce sont des cibles, et la
              couleur les dit. C'est le libellé ★ du produit qui distingue
              l'objectif global, pas une seconde teinte. */}
          {distinctTargets.map((target) => (
            <div
              key={target.projectId}
              className="absolute inset-x-0 border-t border-dashed border-content-warning-darker"
              style={{ top: `${topOf(target.value)}%` }}
            >
              <span className="absolute left-0.5 -translate-y-1/2 bg-surface-neutral-pale px-1.5 text-2xs font-semibold text-content-warning-darker">
                Cible {formatResultValue(target.value, unit)}
              </span>
            </div>
          ))}

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
          </div>
        </div>
      </div>

      {/* Les graduations de temps, **alignées sur la zone de tracé** : même
          retrait à gauche pour les libellés d'axe (`ml-11`) et même gouttière à
          droite (`mr-8`) que le tracé. Sans la seconde, la dernière graduation
          tomberait à droite du dernier point qu'elle situe. */}
      <div className="relative ml-11 mr-8 mt-2 h-4">
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
