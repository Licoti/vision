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
 * **Des marges par élément, jamais un `gap` uniforme — mais à l'intérieur des
 * sous-parties seulement.** Un `gap` met la même valeur partout ; la maquette
 * rythme 18/24/30/12/14, et c'était la cause directe du « trop d'espacements ».
 * La règle vaut toujours dans `NorthStar` et dans `IndicatorCard`. Elle ne vaut
 * **plus au premier rang du bloc** (17/08/2026) : en-tête, North Star,
 * séparateur et grille sont espacés par le `gap-5` de `Block`, comme les enfants
 * de premier rang des deux autres blocs de la page. Un rythme propre à ce bloc
 * était précisément ce que la mise en cohérence retirait.
 *
 * **La coquille et l'en-tête sont ceux de `components/ui/block.tsx`**, partagés
 * avec « Accompagnements » et « Roadmap ». Ce que ce bloc garde en propre est
 * sa **tonalité** — la surface bleue, qui dit que c'est l'objectif du produit —,
 * son ★ et son contenu. Ce qu'il a perdu : son surtitre de 12 pixels en
 * capitales, devenu un titre de plein rang comme les deux autres.
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

import Link from "next/link";

import {
  ActionMenu,
  MENU_ITEM,
  MENU_ITEM_DANGER,
} from "@/components/ui/action-menu";
import { Block, BlockDivider, BlockHeader } from "@/components/ui/block";
import { Tag } from "@/components/ui/tag";
import { ACTION_LINK } from "@/components/ui/action-link";
import {
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
  indicator: ProductIndicator,
  lastValue: string | null,
): string | null {
  const gap = targetGap(indicator.targetValue, lastValue, indicator.direction);
  if (!gap) return null;

  if (gap.reached) return "Cible atteinte.";

  const remaining = formatResultValue(String(gap.distance), indicator.unit);
  return `Encore ${remaining} pour atteindre la cible.`;
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
      <BlockHeader
        title="Vision produit"
        note="La raison d'être de ce produit, et la direction qu'il se donne."
        action={
          visionHref || designate ? (
            <ActionMenu label="Options du bloc de la vision produit">
              {/* **Le geste de la vision en tête**, avant les désignations :
                  c'est l'ordre de lecture du bloc, et un menu qui rangerait le
                  premier rang après le second se lirait à l'envers. */}
              {visionHref ? (
                <Link href={visionHref} role="menuitem" className={MENU_ITEM}>
                  {vision
                    ? "Modifier la vision produit"
                    : "Ajouter la vision produit"}
                </Link>
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
          ) : null
        }
      />

      {/* **Le premier rang du bloc** : la question à laquelle le produit
          répond. Elle est écrite, jamais déduite — Vision ne synthétise pas une
          intention à partir des accompagnements qu'elle enregistre.

          L'état vide est un **paragraphe et non un `EmptyState`**, la règle des
          deux blocs voisins : deux phrases distinctes, là où `EmptyState` n'a
          qu'un `description`. Le lien n'apparaît qu'au responsable de domaine —
          et ce n'est pas ce rendu qui protège : `updateProductVision` redérive
          le droit sur l'identifiant reçu. */}
      {vision ? (
        <p className="max-w-200 text-md leading-175 text-content-neutral-darkest">
          {vision}
        </p>
      ) : (
        <p className="text-sm leading-175 text-content-neutral-dark">
          Aucune vision pour l&apos;instant. Ce bloc dira pourquoi ce produit
          existe et vers quoi il va — la question que la North Star mesure.
          {visionHref ? (
            <>
              {" "}
              <Link href={visionHref} className={ACTION_LINK}>
                Ajouter la vision produit
              </Link>
            </>
          ) : null}
        </p>
      )}

      {/* Le ★ suit la North Star : il titrait le bloc tant qu'elle le titrait,
          il descend avec elle. Décoratif — le titre est écrit juste à côté, et
          la couleur ne porte jamais seule (`docs/06` §11). */}
      <BlockDivider
        mark={<span className="text-content-warning-darker">★</span>}
        title="North Star"
        rule="bg-border-primary-lighter"
      />

      {northStar ? (
        <NorthStar
          indicator={northStar}
          series={series.get(northStar.id) ?? []}
          adoptions={adopted.get(northStar.id) ?? []}
        />
      ) : (
        /* Un paragraphe et non un `EmptyState` — la règle de `Resources` et
           d'`Indicators` : **deux phrases distinctes**, là où `EmptyState` n'a
           qu'un `description`. N'avoir aucun indicateur et n'en avoir désigné
           aucun ne sont pas la même chose, et l'écran ne les confond pas. */
        <p className="text-sm leading-175 text-content-neutral-dark">
          {indicators.length === 0
            ? "Aucun indicateur pour l'instant. Le premier que ce produit portera pourra être désigné North Star : celui qui dit où le produit veut aller."
            : "Aucune North Star désignée. Le menu de ce bloc permet de choisir lequel de ces indicateurs porte l'objectif global du produit."}
        </p>
      )}

      {/* Le séparateur, **espacé par le `gap-5` du bloc** comme tout le reste :
          la maquette rythmait 34/22 de part et d'autre, et ce rythme propre
          était l'un des trois que la page portait. L'interlettrage de `.14em`
          n'est toujours pas rendu — aucun jeton, dette n°4.

          **« Indicateurs associés » et non plus « Autres indicateurs »**
          (18/08/2026) : « autres » ne disait qu'une exclusion — ce qui n'est pas
          la North Star. Le mot juste dit ce qu'ils sont : les mesures qui
          accompagnent celle-là, chacune portée par un accompagnement nommé sous
          son libellé. */}
      <BlockDivider
        title="Indicateurs associés"
        rule="bg-border-primary-lighter"
      />

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
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
          <Link
            href={addHref}
            className="flex min-h-24 items-center justify-center gap-2 rounded-2xl border border-dashed border-border-primary-light text-sm font-semibold text-content-primary-dark"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              +
            </span>
            Ajouter un indicateur
          </Link>
        ) : null}

        {others.length === 0 && !addHref ? (
          <p className="text-sm leading-175 text-content-neutral-dark">
            Aucun indicateur associé sur ce produit.
          </p>
        ) : null}
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
  const gap = gapSentence(indicator, indicator.lastValue);

  return (
    <div className="grid gap-y-6 lg:grid-cols-[20rem_1fr] lg:items-center lg:gap-x-11">
      <div>
        <p className="text-lg font-semibold leading-125 text-content-neutral-darkest">
          {indicator.label}
        </p>

        {lastValue && indicator.lastReadOn ? (
          <p className="mt-4 flex flex-wrap items-baseline gap-2.5">
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
          <p className="mt-4 text-sm leading-175 text-content-neutral-dark">
            Aucun relevé pour l&apos;instant : cette mesure n&apos;est pas encore
            située dans le temps.
          </p>
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
        {gap ? (
          <p className="text-sm leading-175 text-content-neutral-dark">
            {gap}
          </p>
        ) : null}

        {indicator.targetValue === null ? (
          <p className="text-sm leading-175 text-content-neutral-dark">
            Aucune cible de produit. Le panneau de correction de
            l&apos;indicateur permet d&apos;en poser une.
          </p>
        ) : null}
      </div>

      {scale && ordered.length > 0 ? (
        <Curve
          scale={scale}
          unit={indicator.unit}
          series={ordered}
          productTarget={indicator.targetValue}
          adoptions={adoptions}
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
          className="absolute -inset-y-1.75 w-0.5 bg-content-warning-darker"
          style={{ left: `${mark}%` }}
        />
        <span
          className="absolute -top-7.5 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-content-warning-darker"
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
}: {
  scale: ValueScale;
  unit: string | null;
  /** Du plus ancien au plus récent. Au moins un élément. */
  series: readonly ProductReading[];
  productTarget: string | null;
  adoptions: readonly ProductAdoption[];
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
      {/* La boîte du tracé : 170 px de haut, 44 px réservés à gauche pour les
          trois libellés d'axe. */}
      <div className="relative h-42.5 pl-11">
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
                className="absolute right-0.5 -translate-y-1/2 bg-surface-primary-lighter px-1.5 text-xs font-bold text-content-warning-darker"
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
              <span className="absolute right-0.5 -translate-y-1/2 bg-surface-primary-lighter px-1.5 text-2xs font-semibold text-content-warning-darker">
                Cible {formatResultValue(target.value, unit)}
              </span>
            </div>
          ))}

          {/* **La gouttière de droite** (correctif du 17/08/2026) : la valeur du
              dernier point venait manger le libellé de cible, qui vit au bord
              droit. Le tracé et ses points s'arrêtent donc avant lui, là où les
              filets et les traits de cible gardent toute la largeur — ce sont
              eux qui portent le libellé, et les rétrécir l'aurait décollé du
              bord. */}
          <div className="absolute inset-y-0 left-0 right-24">
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
                className="block h-2.75 w-2.75 rounded-full border-[length:var(--border-width-1)] border-surface-primary-lighter bg-surface-primary-dark"
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
          </div>
        </div>
      </div>

      {/* Les graduations de temps, **alignées sur la zone de tracé** : même
          retrait à gauche pour les libellés d'axe (`ml-11`) et même gouttière à
          droite (`mr-24`) que le tracé. Sans la seconde, la dernière graduation
          tomberait à droite du dernier point qu'elle situe. */}
      <div className="relative ml-11 mr-24 mt-2 h-4.5">
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
    <div className="relative rounded-2xl border border-surface-neutral-lighter bg-surface-neutral-pale p-3.5">
      {editHref || addReadingHref || readingsHref || setNorthStar ? (
        /* **Le conteneur porte le positionnement, jamais le menu** : sa racine
           est `relative`, dont son déroulant a besoin pour s'ancrer. */
        <div className="absolute right-3 top-3">
        <ActionMenu label={`Options de l'indicateur ${indicator.label}`}>
          {editHref ? (
            <Link
              href={editHref(indicator.id)}
              role="menuitem"
              className={MENU_ITEM}
            >
              Modifier l&apos;indicateur
            </Link>
          ) : null}
          {addReadingHref ? (
            <Link
              href={addReadingHref(indicator.id)}
              role="menuitem"
              className={MENU_ITEM}
            >
              Ajouter un relevé
            </Link>
          ) : null}
          {readingsHref ? (
            <Link
              href={readingsHref(indicator.id)}
              role="menuitem"
              className={MENU_ITEM}
            >
              Gérer les relevés
            </Link>
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
        <p className="mt-2 text-xs text-content-neutral-base">
          Aucun relevé pour l&apos;instant.
        </p>
      )}

      <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-content-neutral-base">
        <span className="rounded-full bg-surface-primary-lighter px-2.25 py-0.5 text-2xs font-semibold text-content-neutral-dark">
          {formatIndicatorDirection(indicator.direction)}
        </span>
        {formatReadings(indicator.readingCount)}
      </p>
    </div>
  );
}
