/**
 * Le panneau « Repères » — ce qui s'est passé sur le produit, dans l'ordre de
 * l'axe.
 *
 * **Il porte tout ce que la page ne montre pas.** Sur l'écran, la couche entière
 * tient en six marques de 8 px posées sur la ligne du bas du tracé : le bloc
 * « Vision produit » ne gagne aucun rang, aucun libellé, pas un pixel de
 * hauteur. Le récit vit ici, ouvert depuis le menu du bloc ou depuis une marque.
 *
 * **Ce n'est pas un panneau de saisie**, et il ne réutilise donc pas `Panel` —
 * la règle de `readings-panel.tsx` : le corps de TD.1 enveloppe ses `children`
 * dans un `<form>` et exige un dispatch. C'est une liste, et elle reste rendue
 * sur le serveur.
 *
 * **Du plus ancien au plus récent**, et c'est l'inverse des autres listes de la
 * page. La raison est la correspondance : la bande se lit de gauche à droite, et
 * une liste qui la remonterait obligerait l'œil à retourner l'ordre entre les
 * deux lectures. Écart assumé, consigné.
 *
 * **Rien n'est calculé d'une ligne à l'autre** : ni écart, ni évolution, ni
 * durée entre deux repères. On pose les faits côte à côte, on ne les résume pas
 * — `docs/06` §6 refuse le « +12 % depuis l'accompagnement » en propres termes,
 * et c'est ce paragraphe qui décide de ce que ce panneau n'écrit jamais.
 */

import { ACTION_LINK } from "@/components/ui/action-link";
import { DrawerLink } from "@/components/ui/drawer";
import { BlockNote } from "@/components/ui/empty-state";
import { ExternalLink } from "@/components/ui/external-link";
import { formatDay, formatResultValue } from "@/lib/format";
import type { ProductMarker } from "@/lib/queries/timeline";

/**
 * La nature du repère, écrite. **La forme ne porte jamais seule** (`docs/06`
 * §11) : sur l'axe, le disque et l'anneau se doublent d'un nom accessible ;
 * ici, du mot lui-même.
 */
const KIND_LABEL: Record<ProductMarker["kind"], string> = {
  accompaniment: "accompagnement",
  context: "contexte",
};

export function MarkersPanel({
  markers,
  addContextHref,
  markerHref,
  editContextHref,
  archiveContextMarker,
}: {
  /** Les deux natures fondues, **déjà triées** par `mergeMarkers`. */
  markers: readonly ProductMarker[];
  /** `null` retire le point d'entrée — le composant ne connaît aucun droit. */
  addContextHref: string | null;
  /** La fiche d'un repère d'accompagnement. Se lit par tout le domaine (D9). */
  markerHref: (activityId: string) => string;
  editContextHref: ((markerId: string) => string) | null;
  archiveContextMarker: ((markerId: string) => Promise<void>) | null;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
      <BlockNote>
        Ce qui s&apos;est passé sur ce produit, dans l&apos;ordre de l&apos;axe.
        Les activités terminées des accompagnements remontent toutes seules ;
        les faits du produit que le centre n&apos;a pas produits se saisissent à
        la main.
      </BlockNote>

      {addContextHref ? (
        <DrawerLink
          href={addContextHref}
          request={{ kind: "contextMarker" }}
          className={ACTION_LINK}
        >
          Ajouter un repère de contexte
        </DrawerLink>
      ) : null}

      {markers.length > 0 ? (
        <ul role="list" className="flex flex-col gap-3">
          {markers.map((marker) => (
            <Marker
              key={`${marker.kind}-${marker.id}`}
              marker={marker}
              markerHref={markerHref}
              editContextHref={editContextHref}
              archiveContextMarker={archiveContextMarker}
            />
          ))}
        </ul>
      ) : (
        /* Un paragraphe et non un `EmptyState` — la règle des panneaux voisins :
           un état vide dans un panneau n'a pas de titre à porter, le panneau en
           a déjà un. Deux phrases entières, jamais une phrase à trous. */
        <BlockNote>
          Aucun repère pour l&apos;instant. Les activités terminées des
          accompagnements de ce produit paraîtront ici, et sur l&apos;axe de la
          North Star.
        </BlockNote>
      )}

      {/* **La phrase que ce panneau doit à ses lecteurs.** Elle n'est pas un
          ornement : sans elle, une liste de faits alignés sous une courbe se lit
          comme une démonstration. `docs/03` §7 — « Vision juxtapose, elle ne
          prouve pas ». */}
      {markers.length > 0 ? (
        <BlockNote>
          Vision pose ces faits côte à côte. Elle ne conclut pas : bien
          d&apos;autres choses agissent sur un indicateur, et la lecture
          appartient à qui connaît le contexte.
        </BlockNote>
      ) : null}
    </div>
  );
}

/** Une ligne du récit : ce que le repère est, quand, et d'où il vient. */
function Marker({
  marker,
  markerHref,
  editContextHref,
  archiveContextMarker,
}: {
  marker: ProductMarker;
  markerHref: (activityId: string) => string;
  editContextHref: ((markerId: string) => string) | null;
  archiveContextMarker: ((markerId: string) => Promise<void>) | null;
}) {
  const day = formatDay(marker.on);
  const value = formatResultValue(marker.resultValue, marker.resultUnit);

  return (
    <li className="flex flex-col gap-1.5 border-t border-surface-neutral-lighter pt-3 first:border-t-0 first:pt-0">
      <span className="text-xs text-content-neutral-base">
        {day}
        <span aria-hidden="true">{" · "}</span>
        {KIND_LABEL[marker.kind]}
      </span>

      <span className="text-sm font-semibold leading-125 text-content-neutral-darkest">
        {marker.kind === "accompaniment" ? (
          <DrawerLink
            href={markerHref(marker.id)}
            request={{ kind: "markerDetail", id: marker.id }}
            className="underline"
          >
            {marker.label}
          </DrawerLink>
        ) : (
          marker.label
        )}
      </span>

      {marker.projectName ? (
        <span className="text-xs leading-125 text-content-neutral-base">
          <span className="sr-only">Accompagnement : </span>
          <span aria-hidden="true">Accompagnement : </span>
          {marker.projectName}
        </span>
      ) : null}

      {marker.note ? (
        <span className="text-xs leading-125 text-content-neutral-base">
          {marker.note}
        </span>
      ) : null}

      {/* Le résultat : une valeur **reportée** d'un outil externe, avec sa date
          et son lien (D39). Aucun jugement n'en est tiré. */}
      {marker.resultLabel ? (
        <span className="text-xs leading-125 text-content-neutral-base">
          {marker.resultLabel}
          {value ? (
            <>
              {" : "}
              <span className="font-semibold text-content-neutral-dark">
                {value}
              </span>
            </>
          ) : null}
          {marker.resultUrl ? (
            <>
              <span aria-hidden="true">{" · "}</span>
              <ExternalLink href={marker.resultUrl}>Ouvrir</ExternalLink>
            </>
          ) : null}
        </span>
      ) : null}

      {/* Un `div` et non un `span` : `<form>` est du contenu de flux, et un
          élément de phrasé ne l'accepte pas — le balisage servi serait réécrit
          par le navigateur, et l'hydratation divergerait. */}
      {marker.kind === "context" &&
      (editContextHref || archiveContextMarker) ? (
        <div className="flex flex-wrap items-center gap-4 pt-1">
          {editContextHref ? (
            <DrawerLink
              href={editContextHref(marker.id)}
              request={{ kind: "contextMarker", id: marker.id }}
              aria-label={`Modifier le repère « ${marker.label} » du ${day}`}
              className={ACTION_LINK}
            >
              Modifier
            </DrawerLink>
          ) : null}
          {archiveContextMarker ? (
            /* Un formulaire nu : ni confirmation ni motif — un repère se
               retape. « Archiver » et jamais « Supprimer » : rien n'est
               supprimé (règle 4). */
            <form action={archiveContextMarker.bind(null, marker.id)}>
              <button
                type="submit"
                aria-label={`Archiver le repère « ${marker.label} » du ${day}`}
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
