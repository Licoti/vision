/**
 * Le bloc « Indicateurs » — ce que le produit mesure, et depuis quand.
 *
 * `docs/06` §6 réserve à C5 la couche « temps long » de la page produit. Ce bloc
 * en est la part lisible sans frise : les indicateurs du produit, chacun avec
 * son **dernier relevé** daté et le nombre de relevés qui le précèdent. Il porte
 * **la section entière**, son en-tête compris — la forme de `Resources` depuis
 * T4.1 — et se place **sous la liste des accompagnements** : la frise de T5.5
 * viendra au-dessus d'elle, ce bloc reste en dessous.
 *
 * **Trois gestes depuis T5.2**, et la promesse écrite ici par T5.1 est tenue :
 * `addHref`, `editHref` et `archiveIndicator` sont exactement les props que
 * `Resources` porte depuis T4bis.5. **T5.3 en a ajouté trois pour les relevés**,
 * sur la même forme et sans qu'une condition s'ajoute chez l'appelant. Le
 * composant, lui, ne connaît **aucun droit** : à `null`, une prop retire son
 * point d'entrée, et c'est l'appelant qui lit la session — la règle de
 * `Roadmap`, de `Resources` et de `PageHeader`.
 *
 * **La série se lit sous son indicateur, du plus récent au plus ancien** (T5.3).
 * Elle n'est pas triée ici : `listProductReadings` la rend déjà ordonnée
 * `read_on desc, id desc`, le **même** couple que l'agrégat qui donne le
 * « dernier relevé » deux lignes plus haut. C'est ce qui fait que la première
 * ligne de la série et la valeur en tête de l'entrée sont le même relevé, par
 * construction et non par coïncidence.
 *
 * **Vision juxtapose, elle ne prouve pas.** Chaque entrée n'affiche que des
 * valeurs reportées : la dernière mesure, sa date, le décompte. Aucun écart à
 * une cible, aucune évolution entre deux relevés, aucune flèche de tendance,
 * aucun pourcentage de progression — D39 pose la frontière, et `docs/03` §7
 * nomme le « +12 % depuis l'accompagnement » comme le point de bascule.
 *
 * **La direction ne qualifie jamais une valeur.** Elle est écrite en toutes
 * lettres — « Plus haut vaut mieux » — parce qu'elle dit dans quel sens la série
 * se lit ; elle ne colore rien, ne décore rien, et ne juge aucun chiffre.
 *
 * **Un indicateur sans relevé le dit, et ne porte aucune date** : « un
 * indicateur sans date de relevé n'est pas affichable sur la frise et doit être
 * signalé comme tel plutôt que positionné arbitrairement à aujourd'hui »
 * (`docs/03` §7).
 *
 * L'état vide est un paragraphe et non un `EmptyState`, qui porterait un `h2`
 * en doublon sous celui de la section — la règle de `Resources`. Il dit ce que
 * le bloc contiendra, et porte le geste depuis T5.2, comme celui de `Resources`
 * depuis T4.2.
 *
 * Le composant ne lit aucune base : `indicators` et `readings` sont ce que
 * `listProductIndicators` et `listProductReadings` ont déjà lu, filtré et trié.
 */

import Link from "next/link";

import { Section, SectionHeader } from "@/components/ui/section";
import {
  formatDateMonth,
  formatIndicatorDirection,
  formatReadings,
  formatResultValue,
} from "@/lib/format";
import type {
  ProductIndicator,
  ProductReading,
} from "@/lib/queries/indicators";

/**
 * Les classes d'un geste texte — la constante `ACTION_LINK` de `resources.tsx`,
 * **redite** plutôt qu'importée : ce module ne l'exporte pas, et il n'appartient
 * pas au périmètre de ce ticket. La dette est consignée au journal, et
 * l'extraction appartient au ticket qui pourra toucher les trois composants
 * ensemble.
 *
 * `content-primary-dark` sur `surface-neutral-pale` n'est **pas un couple neuf
 * par la position** : c'est celui des deux gestes de `Resources`, sur le même
 * fond de `Section`, et celui de « Ajouter un indicateur » en tête de ce bloc.
 */
const ACTION_LINK = "text-xs font-semibold text-content-primary-dark underline";

/**
 * La série de chaque indicateur, en une passe.
 *
 * `readings` arrive **plat et déjà ordonné** — une lecture par écran, jamais une
 * par indicateur (la règle de T5.1). Le regroupement conserve l'ordre reçu, si
 * bien que chaque série sort triée sans qu'un second tri s'écrive ici : une
 * lecture trie, un composant affiche.
 */
function groupByIndicator(
  readings: ProductReading[],
): Map<string, ProductReading[]> {
  const grouped = new Map<string, ProductReading[]>();
  for (const reading of readings) {
    const series = grouped.get(reading.indicatorId);
    if (series) series.push(reading);
    else grouped.set(reading.indicatorId, [reading]);
  }
  return grouped;
}

/**
 * Une ligne de série : sa valeur, son mois, sa note, et ses deux gestes.
 *
 * **Le mois, et non le jour** (D13) : c'est la règle unique du bloc, celle que
 * `formatDateMonth` porte depuis T5.1 pour le « dernier relevé » deux lignes
 * plus haut. Deux granularités dans un même bloc feraient croire à deux natures
 * de date, là où c'est la même colonne.
 *
 * **Rien n'est calculé d'une ligne à l'autre** : ni écart, ni évolution, ni
 * cumul, ni moyenne. On liste la série, on ne la résume pas — D39 pose la
 * frontière, et `docs/03` §7 nomme le « +12 % depuis l'accompagnement » comme le
 * point de bascule. La série est **reçue triée** ; aucun tri ne se rejoue ici.
 */
function Reading({
  reading,
  unit,
  indicatorLabel,
  editReadingHref,
  archiveReading,
}: {
  reading: ProductReading;
  unit: string | null;
  /** Pour nommer les gestes : « Modifier » seul ne dit pas lequel. */
  indicatorLabel: string;
  editReadingHref: ((readingId: string) => string) | null;
  archiveReading: ((readingId: string) => Promise<void>) | null;
}) {
  const value = formatResultValue(reading.value, unit);
  const month = formatDateMonth(reading.readOn);

  return (
    <li className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <span className="text-xs text-content-neutral-base">
        <span className="font-semibold text-content-neutral-dark">{value}</span>
        <span aria-hidden="true">{" · "}</span>
        <span className="sr-only">relevé en </span>
        {month}
        {reading.sourceNote ? (
          <>
            <span aria-hidden="true">{" · "}</span>
            <span className="sr-only">Source : </span>
            {reading.sourceNote}
          </>
        ) : null}
      </span>

      {/* Un `div` et non un `span` : `<form>` est du contenu de flux, et un
          élément de phrasé ne l'accepte pas — le balisage servi serait réécrit
          par le navigateur, et l'hydratation divergerait. */}
      {editReadingHref || archiveReading ? (
        <div className="flex flex-wrap items-center gap-4">
          {editReadingHref ? (
            <Link
              href={editReadingHref(reading.id)}
              aria-label={`Modifier le relevé de ${value} en ${month} — ${indicatorLabel}`}
              className={ACTION_LINK}
            >
              Modifier
            </Link>
          ) : null}
          {archiveReading ? (
            /* Un formulaire nu : ni confirmation (arbitrage (c) de
               `tickets-C4bis.md` — un relevé se retape), ni motif. « Archiver »
               est le mot de l'arbitrage (d), jamais « Supprimer » : rien n'est
               supprimé (règle 4), et c'est le geste que la migration de ce
               ticket autorise. */
            <form action={archiveReading.bind(null, reading.id)}>
              <button
                type="submit"
                aria-label={`Archiver le relevé de ${value} en ${month} — ${indicatorLabel}`}
                className={ACTION_LINK}
              >
                Archiver
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function Indicators({
  indicators,
  readings,
  addHref,
  editHref,
  archiveIndicator,
  addReadingHref,
  editReadingHref,
  archiveReading,
}: {
  indicators: ProductIndicator[];
  /** Tous les relevés vivants du produit, plats et déjà ordonnés (T5.3). */
  readings: ProductReading[];
  /**
   * L'ouverture du panneau, ou `null` pour qui ne peut pas écrire — et sur un
   * produit archivé (T5.2). Le droit se lit chez l'appelant, jamais ici.
   */
  addHref: string | null;
  /** L'ouverture du panneau sur un indicateur donné. Même règle de droit. */
  editHref: ((indicatorId: string) => string) | null;
  /**
   * Le rangement d'un indicateur — l'action serveur **déjà liée au produit**
   * côté serveur, à lier à l'indicateur au moment du rendu. Même règle de droit.
   */
  archiveIndicator: ((indicatorId: string) => Promise<void>) | null;
  /** L'ouverture du panneau de relevé sur un indicateur. Même règle de droit. */
  addReadingHref: ((indicatorId: string) => string) | null;
  /** Le même panneau, sur un relevé à corriger. Même règle de droit. */
  editReadingHref: ((readingId: string) => string) | null;
  /**
   * Le retrait d'un relevé — l'action serveur **déjà liée au produit** côté
   * serveur, à lier au relevé au moment du rendu. Même règle de droit.
   */
  archiveReading: ((readingId: string) => Promise<void>) | null;
}) {
  const series = groupByIndicator(readings);

  return (
    <Section>
      <SectionHeader
        title="Indicateurs"
        note="Ce que ce produit mesure, dans le temps."
        {...(addHref
          ? {
              action: (
                <AddIndicator
                  href={addHref}
                  className="border border-content-neutral-normal bg-surface-neutral-pale text-content-primary-dark"
                />
              ),
            }
          : {})}
      />

      {indicators.length > 0 ? (
        <ul role="list" className="flex flex-col">
          {indicators.map((indicator) => (
            <li
              key={indicator.id}
              className="border-t border-surface-neutral-lighter py-3 first:border-t-0 first:pt-0 last:pb-0"
            >
              <p className="text-sm font-medium text-content-neutral-darkest">
                {indicator.label}
              </p>

              {/* Le dernier relevé, en tête de l'entrée : c'est la valeur qu'on
                  vient chercher. La valeur passe par `formatResultValue` — la
                  colonne est un `numeric(18,4)` que le pilote rend « 71.0000 »,
                  et l'unité se colle ou se sépare selon sa forme. La date se lit
                  au mois (D13).

                  Les deux parts sont nommées pour l'assistance : hors du
                  contexte visuel, « 71 % · juin 2026 » ne dit pas laquelle est
                  la mesure et laquelle la date. Le `·` est décoratif, et garde
                  la couleur du texte qu'il sépare — la règle de `Resources`, où
                  un séparateur mesuré à 2,22:1 entre deux textes de même graisse
                  laisserait lire les deux d'un trait. */}
              <p className="mt-1 text-sm text-content-neutral-dark">
                {indicator.lastReadOn ? (
                  <>
                    <span className="sr-only">Dernier relevé : </span>
                    <span className="font-semibold">
                      {formatResultValue(indicator.lastValue, indicator.unit)}
                    </span>
                    <span aria-hidden="true">{" · "}</span>
                    <span className="sr-only">relevé en </span>
                    {formatDateMonth(indicator.lastReadOn)}
                  </>
                ) : (
                  /* Aucune date, et aucune valeur inventée. La phrase dit
                     l'attente, pas le défaut : un indicateur qu'on n'a pas
                     encore mesuré est un indicateur normal. */
                  "Aucun relevé pour l'instant."
                )}
              </p>

              <p className="mt-1 text-xs text-content-neutral-base">
                <span className="sr-only">Relevés : </span>
                {formatReadings(indicator.readingCount)}
                <span aria-hidden="true">{" · "}</span>
                <span className="sr-only">Sens de lecture : </span>
                {formatIndicatorDirection(indicator.direction)}
                {indicator.source ? (
                  <>
                    <span aria-hidden="true">{" · "}</span>
                    <span className="sr-only">Source : </span>
                    {indicator.source}
                  </>
                ) : null}
              </p>

              {/* La série, sous son indicateur et du plus récent au plus ancien
                  (T5.3). Le retrait et le filet la rattachent visuellement à
                  l'indicateur qu'elle mesure, sans qu'un jeton neuf apparaisse :
                  `surface-neutral-lighter` est déjà le séparateur des entrées de
                  ce bloc.

                  Elle n'est pas repliée derrière un geste d'ouverture : elle se
                  lit d'un trait dans le HTML servi, comme la roadmap. */}
              {(series.get(indicator.id) ?? []).length > 0 ? (
                <ul
                  role="list"
                  className="mt-2 flex flex-col gap-1 border-l border-surface-neutral-lighter pl-4"
                >
                  {(series.get(indicator.id) ?? []).map((reading) => (
                    <Reading
                      key={reading.id}
                      reading={reading}
                      unit={indicator.unit}
                      indicatorLabel={indicator.label}
                      editReadingHref={editReadingHref}
                      archiveReading={archiveReading}
                    />
                  ))}
                </ul>
              ) : null}

              {/* Les gestes de l'entrée, sous la série et jamais à droite : le
                  bloc porte des entrées à plusieurs lignes, et une colonne
                  d'actions y écraserait le libellé.

                  « Ajouter un relevé » vient en tête des trois — c'est le geste
                  le plus courant du bloc depuis T5.3, et sur un indicateur sans
                  relevé il paraît juste sous la phrase qui dit l'absence, soit
                  exactement là où on le cherche.

                  Le nom accessible porte le libellé de l'indicateur, comme celui
                  de « Modifier » dans `Resources` : « Modifier » répété dix fois
                  dans une liste de liens ne dit pas lequel. Le mot reste écrit à
                  l'écran — l'`aria-label` complète, il ne remplace pas.

                  « Archiver » est un formulaire nu : ni confirmation
                  (arbitrage (c) de `tickets-C4bis.md` — un indicateur se
                  retape), ni motif. Le mot est celui de l'arbitrage (d), jamais
                  « Supprimer » : rien n'est supprimé (règle 4). */}
              {/* Un `div` et non un `p` : `<form>` est du contenu de flux, et
                  un paragraphe n'accepte que du phrasé — le balisage servi
                  serait réécrit par le navigateur, et l'hydratation
                  divergerait. */}
              {addReadingHref || editHref || archiveIndicator ? (
                <div className="mt-1.5 flex flex-wrap items-center gap-4">
                  {addReadingHref ? (
                    <Link
                      href={addReadingHref(indicator.id)}
                      aria-label={`Ajouter un relevé à l'indicateur ${indicator.label}`}
                      className={ACTION_LINK}
                    >
                      Ajouter un relevé
                    </Link>
                  ) : null}
                  {editHref ? (
                    <Link
                      href={editHref(indicator.id)}
                      aria-label={`Modifier l'indicateur ${indicator.label}`}
                      className={ACTION_LINK}
                    >
                      Modifier
                    </Link>
                  ) : null}
                  {archiveIndicator ? (
                    <form action={archiveIndicator.bind(null, indicator.id)}>
                      <button
                        type="submit"
                        aria-label={`Archiver l'indicateur ${indicator.label}`}
                        className={ACTION_LINK}
                      >
                        Archiver
                      </button>
                    </form>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-start gap-4">
          <p className="text-sm leading-175 text-content-neutral-base">
            Les mesures suivies sur ce produit s&apos;afficheront ici, chacune
            avec son dernier relevé daté et le nombre de relevés qui le
            précèdent. Un indicateur appartient au produit et se poursuit d&apos;un
            accompagnement à l&apos;autre : c&apos;est ce qui permet de lire son
            évolution dans le temps long.
          </p>
          {addHref ? (
            <AddIndicator
              href={addHref}
              className="bg-surface-primary-base text-content-neutral-pale"
            />
          ) : null}
        </div>
      )}
    </Section>
  );
}

/**
 * L'action d'ouverture du panneau, aux deux emplacements — la forme de
 * `LinkResource` dans `resources.tsx`, et pour la même raison.
 *
 * C'est un lien et non un bouton, parce que c'en est un : il mène à une URL,
 * celle de la page du produit portant `?indicateur=nouvel`. Il se copie, se
 * partage, s'ouvre dans un onglet — ce qu'un bouton d'ouverture piloté par du
 * JavaScript n'aurait fait dans aucun des trois cas.
 *
 * Le `+` est décoratif : « Ajouter un indicateur » se lit seul.
 */
function AddIndicator({
  href,
  className,
}: {
  href: string;
  className: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${className}`}
    >
      <span aria-hidden="true">+</span>
      Ajouter un indicateur
    </Link>
  );
}
