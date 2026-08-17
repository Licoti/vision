/**
 * Le panneau « Gérer les relevés » d'un indicateur — la série datée, avec ses
 * gestes de correction et de retrait.
 *
 * **Il existe parce que le bloc fusionné n'a plus la place de porter la série en
 * ligne** (hors ticket, 17/08/2026). Les cartes de la maquette
 * `docs/design/maquettes/blocs/northstar` montrent une sparkline, une valeur et
 * un décompte ; la liste des relevés n'y tient pas, et avec elle disparaîtraient
 * « Modifier » et « Archiver » — deux des six points d'entrée, que T5.3 avait
 * livrés avec leur migration. Un geste qui n'a plus d'écran est un geste perdu.
 *
 * **Ce n'est pas un panneau de saisie**, et il ne ressemble donc pas aux six
 * autres : aucun formulaire, aucun `useActionState`, aucun bouton d'envoi. C'est
 * une **liste**, et il reste rendu sur le serveur — d'où l'absence de
 * `"use client"`, seul panneau du projet dans ce cas.
 *
 * Il ne réutilise pas `Panel` pour cette raison exacte : la coquille de TD.1
 * enveloppe ses `children` dans un `<form>` et exige un dispatch, une attente et
 * un libellé d'envoi. Les emprunter pour une liste aurait demandé de rendre
 * `Panel` générique sur ce qu'il n'est pas. Il en reprend en revanche la mise en
 * page, le voile et le `FocusTrap` — la fermeture reste un lien vers la page nue.
 *
 * **Rien n'est calculé d'une ligne à l'autre** : ni écart, ni évolution, ni
 * cumul, ni moyenne. On liste la série, on ne la résume pas. La série est
 * **reçue triée** ; aucun tri ne se rejoue ici.
 */

import Link from "next/link";

import { FocusTrap } from "@/components/ui/focus-trap";
import { formatDateMonth, formatResultValue } from "@/lib/format";
import type { ProductIndicator, ProductReading } from "@/lib/queries/indicators";

const ACTION_LINK =
  "text-xs font-semibold text-content-primary-dark underline underline-offset-2";

export function ReadingsPanel({
  productName,
  indicator,
  readings,
  closeHref,
  addReadingHref,
  editReadingHref,
  archiveReading,
}: {
  productName: string;
  indicator: ProductIndicator;
  /** La série de **cet** indicateur, du plus récent au plus ancien (T5.3). */
  readings: ProductReading[];
  /** La page nue. Les trois sorties y mènent. */
  closeHref: string;
  /** `null` retire le point d'entrée — le composant ne connaît aucun droit. */
  addReadingHref: string | null;
  editReadingHref: ((readingId: string) => string) | null;
  archiveReading: ((readingId: string) => Promise<void>) | null;
}) {
  return (
    <FocusTrap
      closeHref={closeHref}
      className="fixed inset-0 z-40 flex justify-end"
    >
      {/* Le voile ferme au clic et **ne prend jamais le focus** : la fermeture
          au clavier passe par la croix, qui la porte. La règle de `Panel`. */}
      <Link
        href={closeHref}
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 bg-surface-neutral-opacity-distinct"
      />

      <div
        role="dialog"
        aria-labelledby="panneau-releves-titre"
        className="relative flex w-110 max-w-full flex-col gap-5 overflow-y-auto bg-surface-neutral-pale px-6 py-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2
              id="panneau-releves-titre"
              className="text-md font-semibold text-content-neutral-darkest"
            >
              Relevés
            </h2>
            <p className="text-xs text-content-neutral-base">
              {`${productName} · ${indicator.label}`}
            </p>
          </div>

          {/* `autoFocus` : c'est la sortie, et elle doit être le premier arrêt
              du clavier à l'ouverture. La règle de `Panel`. */}
          <Link
            href={closeHref}
            autoFocus
            aria-label="Fermer"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-content-neutral-base"
          >
            <span aria-hidden="true">×</span>
          </Link>
        </div>

        {addReadingHref ? (
          <Link href={addReadingHref} className={ACTION_LINK}>
            Ajouter un relevé
          </Link>
        ) : null}

        {readings.length > 0 ? (
          <ul role="list" className="flex flex-col gap-3">
            {readings.map((reading) => (
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
        ) : (
          /* Un paragraphe et non un `EmptyState` — la règle de `Resources` et
             d'`Indicators` : un état vide dans un panneau n'a pas de titre à
             porter, le panneau en a déjà un. */
          <p className="text-sm leading-175 text-content-neutral-base">
            Aucun relevé pour l&apos;instant. Un indicateur sans relevé n&apos;est
            pas situé sur l&apos;axe du temps.
          </p>
        )}
      </div>
    </FocusTrap>
  );
}

/**
 * Une ligne de la série — reprise telle quelle du bloc de T5.3, dont elle a
 * quitté la page pour ce panneau.
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
    <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-surface-neutral-lighter pt-3 first:border-t-0 first:pt-0">
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
               supprimé (règle 4). */
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
