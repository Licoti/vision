/**
 * Le rang **« Dispositif de mesure »**, au pied du bloc « Indicateurs ».
 *
 * **Un rang et non un bloc** (01/09/2026, arbitrage de la session de design).
 * Les indicateurs disent *ce que le produit mesure* ; le dispositif dit *avec
 * quoi cette donnée est collectée*. La question naît de la précédente — « d'où
 * sort ce 61 % ? » —, et un quatrième bloc l'aurait éloignée de sa réponse en
 * plus d'allonger une page qui compte déjà ses chapitres.
 *
 * **Trois niveaux de lecture, trois tailles distinctes**, et c'est toute
 * l'architecture d'information de ce fichier :
 *
 *   20 px gras · le bloc — « Indicateurs », dont la note annonce les deux moitiés
 *   12 px capitales + filet · le rang — « Dispositif de mesure », et ses gestes
 *   10 px capitales · les légendes — « Outils », « Plan de taggage »
 *
 * Le troisième niveau est le seul ajout au langage du bloc, et il était
 * nécessaire : les outils et le plan sont **deux objets différents**, portés par
 * deux tables et deux gestes. Les fondre en une seule liste aurait fait lire
 * « Plan de taggage » comme le nom d'un outil.
 *
 * **Les gestes vivent sur le filet du rang**, pas dans l'en-tête du bloc : le
 * menu d'en-tête porte « Ajouter un indicateur », et y ranger deux objets de
 * plus aurait mélangé trois choses dans un même déroulant. `BlockDivider` a
 * gagné un `action` pour cela, et c'est sa seule retouche.
 *
 * **Rien n'est calculé ici.** Aucune synthèse des états, aucun décompte de ce
 * qui manque, aucune comparaison entre la date d'un plan et aujourd'hui. Le
 * composant affiche ce qui a été déclaré, avec sa date ; la lecture appartient à
 * qui connaît le contexte. C'est la même discipline que la frise du temps long,
 * qui juxtapose et ne conclut pas.
 *
 * Le composant ne connaît **ni droit ni requête** : il reçoit des `href` et des
 * actions déjà nulles quand le droit est fermé, comme `Indicators` et `Roadmap`
 * avant lui.
 */

import { ActionMenu, MENU_ITEM, MENU_ITEM_DANGER } from "@/components/ui/action-menu";
import { BlockDivider } from "@/components/ui/block";
import { DrawerLink } from "@/components/ui/drawer";
import { BlockNote } from "@/components/ui/empty-state";
import { ExternalLink } from "@/components/ui/external-link";
import { TonePill, type PillTone } from "@/components/ui/status-pill";
import { formatDay, formatTaggingPlanStatus, formatTrackingStatus } from "@/lib/format";
import type {
  ProductTaggingPlan,
  ProductTracking,
  TaggingPlanStatus,
  TrackingStatus,
} from "@/lib/queries/measurement";

/**
 * La traduction d'un état déclaré en ton de pastille.
 *
 * **Elle vit ici et non dans le socle** : `TonePill` ne connaît ni les outils de
 * mesure ni les plans de taggage, et c'est ce qui lui permet de servir le
 * prochain état sans changer. Chaque écran tient sa propre table, comme
 * `NATURE_TONE` tient celle des accompagnements.
 *
 * **`partial` et `stale` sont en `warning`, et ce n'est pas une alerte** : le
 * ton dit « cet état demande une lecture », pas « Vision vous signale un
 * retard ». La nuance tient à ce que personne n'a calculé ces états — quelqu'un
 * les a écrits, et la couleur ne fait que rendre lisible ce qu'il a écrit. Le
 * libellé est dans la pastille : la couleur ne porte jamais seule (`docs/06` §11).
 *
 * Les deux `Record` sont exhaustifs à la compilation : un état de plus dans un
 * énuméré et ce fichier ne compile plus tant qu'on ne l'a pas rangé.
 */
const TRACKING_TONE: Record<TrackingStatus, PillTone> = {
  planned: "info",
  active: "success",
  partial: "warning",
  stopped: "neutral",
};

const PLAN_TONE: Record<TaggingPlanStatus, PillTone> = {
  draft: "info",
  current: "success",
  stale: "warning",
};

/** La légende d'un sous-rang — le troisième niveau, et le dernier. */
function Caption({ children }: { children: string }) {
  return (
    <p className="text-2xs font-semibold text-content-neutral-dark uppercase">
      {children}
    </p>
  );
}

/**
 * Une ligne du dispositif : un filet en haut, puis des faits alignés.
 *
 * La forme est celle de `ListRow` — un filet, un rythme vertical, des cellules
 * qui se replient sur les petits écrans (`flex-wrap`) — sans en être une : ces
 * lignes ne mènent nulle part, et une `List` annoncerait un `role="list"` pour
 * deux entrées qui ne sont pas une collection navigable.
 */
function Line({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-surface-neutral-lighter py-3 text-sm text-content-neutral-dark">
      {children}
    </div>
  );
}

export function MeasurementRank({
  trackings,
  plan,
  addTrackingHref,
  editTrackingHref,
  archiveTracking,
  planHref,
  archivePlan,
  rule,
}: {
  /** Les outils vivants, déjà triés par la requête. */
  trackings: readonly ProductTracking[];
  /** `null` est un état normal, pas un manque (règle 5). */
  plan: ProductTaggingPlan | null;
  addTrackingHref: string | null;
  editTrackingHref: ((trackingId: string) => string) | null;
  archiveTracking: ((trackingId: string) => Promise<void>) | null;
  /** Une seule adresse pour les deux gestes : le plan est unique par produit. */
  planHref: string | null;
  archivePlan: (() => Promise<void>) | null;
  /** Le filet du bloc qui contient ce rang, passé comme à tout `BlockDivider`. */
  rule: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <BlockDivider
        title="Dispositif de mesure"
        note="d'où sortent ces valeurs"
        rule={rule}
        /* **Un seul menu pour deux objets**, et il se rend dès que l'un des deux
           gestes est ouvert. Les deux tombent pourtant ensemble — même droit,
           même garde —, si bien qu'en pratique le menu est entier ou absent ; le
           composant ne le suppose pas pour autant, il reçoit deux points
           d'entrée indépendants. La règle du menu de la vision produit. */
        action={
          addTrackingHref || planHref ? (
            <ActionMenu
              variant="tertiary"
              label="Options du dispositif de mesure"
            >
              {addTrackingHref ? (
                <DrawerLink
                  href={addTrackingHref}
                  request={{ kind: "tracking" }}
                  role="menuitem"
                  className={MENU_ITEM}
                >
                  Ajouter un outil
                </DrawerLink>
              ) : null}
              {planHref ? (
                <DrawerLink
                  href={planHref}
                  request={{ kind: "taggingPlan" }}
                  role="menuitem"
                  className={MENU_ITEM}
                >
                  {/* L'existence du plan décide de ce que le geste annonce,
                      jamais l'URL — la règle de la vision produit. */}
                  {plan
                    ? "Modifier le plan de taggage"
                    : "Renseigner le plan de taggage"}
                </DrawerLink>
              ) : null}
            </ActionMenu>
          ) : null
        }
      />

      {/* ---------------------------- les outils ---------------------------- */}
      <div className="flex flex-col gap-1">
        <Caption>Outils</Caption>

        {trackings.length > 0 ? (
          trackings.map((tracking) => (
            <Line key={tracking.id}>
              <span className="font-semibold text-content-neutral-darkest">
                {tracking.toolName}
              </span>
              <TonePill
                tone={TRACKING_TONE[tracking.status]}
                label={formatTrackingStatus(tracking.status)}
              />
              {/* Le périmètre prend la place restante : c'est lui qui donne son
                  sens à « Partiel », et le comprimer viderait l'état. */}
              <span className="min-w-0 flex-1">{tracking.scope}</span>
              {tracking.verifiedOn ? (
                <span className="text-xs text-content-neutral-base">
                  {`Constaté le ${formatDay(tracking.verifiedOn)}`}
                </span>
              ) : null}
              {tracking.propertyUrl ? (
                <ExternalLink href={tracking.propertyUrl}>Ouvrir</ExternalLink>
              ) : null}
              {editTrackingHref || archiveTracking ? (
                <ActionMenu label={`Options de l'outil ${tracking.toolName}`}>
                  {editTrackingHref ? (
                    <DrawerLink
                      href={editTrackingHref(tracking.id)}
                      request={{ kind: "tracking", id: tracking.id }}
                      role="menuitem"
                      className={MENU_ITEM}
                    >
                      Modifier cet outil
                    </DrawerLink>
                  ) : null}
                  {archiveTracking ? (
                    <form action={archiveTracking.bind(null, tracking.id)}>
                      <button
                        type="submit"
                        role="menuitem"
                        className={MENU_ITEM_DANGER}
                      >
                        Retirer cet outil
                      </button>
                    </form>
                  ) : null}
                </ActionMenu>
              ) : null}
            </Line>
          ))
        ) : (
          /* **L'absence de déclaration n'est pas l'absence de mesure**, et la
             phrase le dit : Vision ne sonde rien, elle ne peut donc affirmer que
             ce produit n'est pas mesuré. Un « Aucun outil » sec aurait fait dire
             à l'écran ce qu'il ne sait pas. */
          <BlockNote>
            Aucun outil de mesure déclaré. Ce qui ne dit pas que ce produit
            n&apos;est pas mesuré : personne ne l&apos;a encore écrit ici.
          </BlockNote>
        )}
      </div>

      {/* ------------------------- le plan de taggage ------------------------ */}
      <div className="flex flex-col gap-1">
        <Caption>Plan de taggage</Caption>

        {plan ? (
          <Line>
            <ExternalLink href={plan.url}>Ouvrir le plan</ExternalLink>
            <TonePill
              tone={PLAN_TONE[plan.status]}
              label={formatTaggingPlanStatus(plan.status)}
            />
            <span className="min-w-0 flex-1">{plan.note}</span>
            {/* La date **du document**, jamais celle de la ligne : c'est le fait
                qui permet de dire qu'un plan a vieilli, et le seul que la liste
                des produits reprend. */}
            <span className="text-xs text-content-neutral-base">
              {`Mis à jour le ${formatDay(plan.updatedOn)}`}
            </span>
            {archivePlan ? (
              <ActionMenu label="Options du plan de taggage">
                <form action={archivePlan}>
                  <button
                    type="submit"
                    role="menuitem"
                    className={MENU_ITEM_DANGER}
                  >
                    Retirer le plan
                  </button>
                </form>
              </ActionMenu>
            ) : null}
          </Line>
        ) : (
          <BlockNote>Aucun plan de taggage déclaré.</BlockNote>
        )}
      </div>
    </div>
  );
}
