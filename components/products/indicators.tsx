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
 * `Resources` porte depuis T4bis.5. T5.3 y ajoutera la série des relevés et ses
 * propres gestes. Le composant, lui, ne connaît **aucun droit** : à `null`, une
 * prop retire son point d'entrée, et c'est l'appelant qui lit la session — la
 * règle de `Roadmap`, de `Resources` et de `PageHeader`.
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
 * Le composant ne lit aucune base : `indicators` est ce que
 * `listProductIndicators` a déjà lu, filtré et trié.
 */

import Link from "next/link";

import { Section, SectionHeader } from "@/components/ui/section";
import {
  formatDateMonth,
  formatIndicatorDirection,
  formatReadings,
  formatResultValue,
} from "@/lib/format";
import type { ProductIndicator } from "@/lib/queries/indicators";

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

export function Indicators({
  indicators,
  addHref,
  editHref,
  archiveIndicator,
}: {
  indicators: ProductIndicator[];
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
}) {
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

              {/* Les deux gestes de T5.2, sous la ligne de décompte et jamais à
                  droite : le bloc porte des entrées à trois lignes, et une
                  colonne d'actions y écraserait le libellé.

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
              {editHref || archiveIndicator ? (
                <div className="mt-1.5 flex flex-wrap items-center gap-4">
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
