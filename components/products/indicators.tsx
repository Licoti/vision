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
 * **Aucun geste, aucune prop d'écriture.** T5.1 lit ; T5.2 ajoute le panneau
 * d'indicateur et T5.3 celui de relevé, avec les `addHref` / `editHref` que
 * `Resources` porte déjà. Le composant ne connaît donc aucun droit, et il n'a
 * rien à en connaître tant que rien ne s'écrit ici.
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
 * le bloc contiendra, sans annoncer un geste que T5.2 n'a pas encore livré.
 *
 * Le composant ne lit aucune base : `indicators` est ce que
 * `listProductIndicators` a déjà lu, filtré et trié.
 */

import { Section, SectionHeader } from "@/components/ui/section";
import {
  formatDateMonth,
  formatIndicatorDirection,
  formatReadings,
  formatResultValue,
} from "@/lib/format";
import type { ProductIndicator } from "@/lib/queries/indicators";

export function Indicators({
  indicators,
}: {
  indicators: ProductIndicator[];
}) {
  return (
    <Section>
      <SectionHeader
        title="Indicateurs"
        note="Ce que ce produit mesure, dans le temps."
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
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-175 text-content-neutral-base">
          Les mesures suivies sur ce produit s&apos;afficheront ici, chacune avec
          son dernier relevé daté et le nombre de relevés qui le précèdent. Un
          indicateur appartient au produit et se poursuit d&apos;un
          accompagnement à l&apos;autre : c&apos;est ce qui permet de lire son
          évolution dans le temps long.
        </p>
      )}
    </Section>
  );
}
