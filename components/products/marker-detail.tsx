/**
 * La fiche d'un **repère d'accompagnement** — une activité terminée, lue depuis
 * la page du produit.
 *
 * **Elle se lit par tout le domaine** (D9), comme la fiche d'un persona et celle
 * d'un use case : c'est le détail que la marque résume. Aucun geste d'écriture
 * n'y figure — une activité se corrige sur la page de son accompagnement, où
 * elle a son panneau et son droit. Le seul chemin d'écriture que cette fiche
 * ouvre est le lien vers l'accompagnement, qui n'est pas un geste.
 *
 * **Composant serveur**, comme les deux fiches voisines : aucun formulaire,
 * donc aucune raison de passer client.
 *
 * ⚠ **Le rang « Les relevés voisins » est le point de ce ticket qui touche à la
 * lisière de D39.** Deux valeurs reportées avec leurs dates — ce que D39
 * autorise — mises en regard d'un accompagnement. Rien n'est soustrait, rien
 * n'est qualifié, et la phrase du bas le dit à l'écran plutôt que de le laisser
 * au lecteur. `neighbourReadings` sélectionne, elle ne calcule pas.
 */

import { DrawerLink } from "@/components/ui/drawer";
import { BlockNote } from "@/components/ui/empty-state";
import { ExternalLink } from "@/components/ui/external-link";
import { formatDateMonth, formatDay, formatResultValue } from "@/lib/format";
import type { ProductReading } from "@/lib/queries/indicators";
import type { ProductMarker } from "@/lib/queries/timeline";

const CAPTION =
  "text-2xs font-semibold uppercase text-content-neutral-base";

export function MarkerDetail({
  marker,
  northStarLabel,
  before,
  after,
  unit,
  projectHref,
  markersHref,
}: {
  marker: ProductMarker;
  /**
   * Le nom de la North Star, pour que le rang des relevés dise **de quoi** il
   * parle. `null` quand le produit n'en a pas désignée : le rang disparaît
   * alors entièrement, il n'y a rien à encadrer.
   */
  northStarLabel: string | null;
  /** Le dernier relevé à la date du repère ou avant. */
  before: ProductReading | null;
  /** Le premier relevé après. */
  after: ProductReading | null;
  unit: string | null;
  /** La descente vers l'accompagnement (`docs/06` §7). `null` s'il n'y en a pas. */
  projectHref: string | null;
  /** Le retour vers la liste entière — le chemin d'où l'on vient. */
  markersHref: string;
}) {
  const value = formatResultValue(marker.resultValue, marker.resultUnit);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
      <dl className="flex flex-col gap-4">
        <div>
          <dt className={CAPTION}>Date</dt>
          <dd className="mt-1 text-sm text-content-neutral-dark">
            {formatDay(marker.on)}
          </dd>
        </div>

        {marker.projectName ? (
          <div>
            <dt className={CAPTION}>Accompagnement</dt>
            <dd className="mt-1 text-sm text-content-neutral-dark">
              {projectHref ? (
                <a href={projectHref} className="underline">
                  {marker.projectName}
                </a>
              ) : (
                marker.projectName
              )}
            </dd>
          </div>
        ) : null}

        {marker.note ? (
          <div>
            <dt className={CAPTION}>Objectif</dt>
            <dd className="mt-1 text-sm leading-175 text-content-neutral-dark">
              {marker.note}
            </dd>
          </div>
        ) : null}
      </dl>

      {/* Le résultat : une valeur **reportée** d'un outil externe, avec sa date
          et son lien (D39). Une activité terminée peut n'en porter aucun — un
          atelier de restitution, un cadrage —, et c'est un état normal. */}
      <div className="border-t border-surface-neutral-lighter pt-5">
        <p className={CAPTION}>Résultat reporté</p>
        {marker.resultLabel ? (
          <>
            <p className="mt-2 flex flex-wrap items-baseline gap-2">
              {value ? (
                <span className="text-2xl font-bold leading-none text-content-neutral-darkest">
                  {value}
                </span>
              ) : null}
              <span className="text-sm font-semibold text-content-neutral-dark">
                {marker.resultLabel}
              </span>
            </p>
            <p className="mt-2 text-xs leading-175 text-content-neutral-base">
              {marker.resultMeasuredOn ? (
                <>
                  <span className="sr-only">Mesuré le </span>
                  <span aria-hidden="true">Mesuré le </span>
                  {formatDay(marker.resultMeasuredOn)}
                </>
              ) : null}
              {marker.resultUrl ? (
                <>
                  <span aria-hidden="true">{" · "}</span>
                  <ExternalLink href={marker.resultUrl}>Ouvrir</ExternalLink>
                </>
              ) : null}
            </p>
          </>
        ) : (
          <BlockNote className="mt-2">
            Aucun résultat reporté. Cette activité a bien eu lieu ; aucun outil
            externe n&apos;en a mesuré la trace.
          </BlockNote>
        )}
      </div>

      {/* ⚠ Le rang de la lisière — voir l'en-tête. */}
      {northStarLabel && (before || after) ? (
        <div className="border-t border-surface-neutral-lighter pt-5">
          <p className={CAPTION}>Les relevés voisins</p>
          <p className="mt-2 text-xs leading-175 text-content-neutral-base">
            {northStarLabel}
          </p>

          <ul role="list" className="mt-3 flex flex-col gap-3">
            <Neighbour label="Relevé précédent" reading={before} unit={unit} />
            <Neighbour label="Relevé suivant" reading={after} unit={unit} />
          </ul>

          <BlockNote className="mt-4">
            Deux valeurs reportées, avec leurs dates. Vision ne calcule pas
            d&apos;écart et n&apos;attribue pas cette évolution à ce repère.
          </BlockNote>
        </div>
      ) : null}

      {/* La descente est toujours possible (`docs/06` §7) : depuis une activité,
          on retrouve son accompagnement. Un `DrawerLink` n'aurait rien à
          ouvrir — c'est une page, pas un panneau. */}
      <p className="flex flex-wrap items-center gap-4 border-t border-surface-neutral-lighter pt-5 text-sm">
        {projectHref ? (
          <a href={projectHref} className="font-semibold underline">
            Ouvrir l&apos;accompagnement
          </a>
        ) : null}
        {/* Le retour à la liste : un `DrawerLink`, donc la coquille échange son
            corps au lieu de naviguer — la règle de `readings-panel.tsx`. */}
        <DrawerLink
          href={markersHref}
          request={{ kind: "markers" }}
          className="font-semibold underline"
        >
          Voir tous les repères
        </DrawerLink>
      </p>
    </div>
  );
}

/**
 * Un relevé voisin, ou son absence dite.
 *
 * **L'absence s'écrit**, elle ne se tait pas : un rang qui ne montrerait qu'un
 * seul côté laisserait croire que l'autre n'a pas été cherché.
 */
function Neighbour({
  label,
  reading,
  unit,
}: {
  label: string;
  reading: ProductReading | null;
  unit: string | null;
}) {
  const value = reading ? formatResultValue(reading.value, unit) : null;

  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <span className="text-xs text-content-neutral-base">{label}</span>
      {reading && value ? (
        <span className="text-sm font-semibold text-content-neutral-darkest">
          {value}
          <span aria-hidden="true">{" · "}</span>
          <span className="font-normal text-content-neutral-base">
            {formatDateMonth(reading.readOn)}
          </span>
        </span>
      ) : (
        <span className="text-xs text-content-neutral-base">Aucun</span>
      )}
    </li>
  );
}
