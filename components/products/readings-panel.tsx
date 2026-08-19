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
 * Il ne réutilise pas `Panel` pour cette raison exacte : le corps de TD.1
 * enveloppe ses `children` dans un `<form>` et exige un dispatch, une attente et
 * un libellé d'envoi. Les emprunter pour une liste aurait demandé de rendre
 * `Panel` générique sur ce qu'il n'est pas.
 *
 * **Sa coquille l'a quitté en TD.2**, et c'est ce qui lui permet de rester
 * serveur : le voile, le tiroir, l'en-tête et la croix vivent dans
 * `DrawerHost`, qui est client et porte donc la fermeture. Un composant serveur
 * ne peut pas recevoir de fonction ; il n'a désormais plus à en recevoir.
 *
 * **Ses deux gestes ouvrent un autre panneau sans fermer celui-ci** : ce sont
 * des `DrawerLink`, et la coquille échange son corps au lieu de naviguer.
 *
 * **Rien n'est calculé d'une ligne à l'autre** : ni écart, ni évolution, ni
 * cumul, ni moyenne. On liste la série, on ne la résume pas. La série est
 * **reçue triée** ; aucun tri ne se rejoue ici.
 */

import { ACTION_LINK } from "@/components/ui/action-link";
import { DrawerLink } from "@/components/ui/drawer";
import { formatDateMonth, formatResultValue } from "@/lib/format";
import type {
  ProductIndicator,
  ProductReading,
} from "@/lib/queries/indicators";

export function ReadingsPanel({
  indicator,
  readings,
  addReadingHref,
  editReadingHref,
  archiveReading,
}: {
  indicator: ProductIndicator;
  /** La série de **cet** indicateur, du plus récent au plus ancien (T5.3). */
  readings: ProductReading[];
  /** `null` retire le point d'entrée — le composant ne connaît aucun droit. */
  addReadingHref: string | null;
  editReadingHref: ((readingId: string) => string) | null;
  archiveReading: ((readingId: string) => Promise<void>) | null;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
      {addReadingHref ? (
        <DrawerLink
          href={addReadingHref}
          request={{ kind: "reading", id: indicator.id }}
          className={ACTION_LINK}
        >
          Ajouter un relevé
        </DrawerLink>
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
            <DrawerLink
              href={editReadingHref(reading.id)}
              request={{ kind: "reading", id: reading.id }}
              aria-label={`Modifier le relevé de ${value} en ${month} — ${indicatorLabel}`}
              className={ACTION_LINK}
            >
              Modifier
            </DrawerLink>
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
