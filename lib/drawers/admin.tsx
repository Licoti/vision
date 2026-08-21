/**
 * La résolution des trois panneaux de la page **Administration** (21/08/2026).
 *
 * **Deux chemins, une seule résolution.** L'URL reste une adresse valide —
 * coller `?entite=<identifiant>` ouvre encore le panneau, au rendu serveur — et
 * le clic passe par `DrawerHost`, qui n'écrit plus l'adresse (TD.2). Les faire
 * diverger mettrait une règle de droit à deux endroits, et c'est exactement ce
 * qu'une refonte de mécanisme ne doit pas produire.
 *
 * **Les disciplines tenues, sans exception.** Le droit s'énonce **avant** toute
 * lecture : il ne dépend d'aucun identifiant. La forme de l'UUID se vérifie
 * ensuite, **avant** la base — une colonne `uuid` interrogée avec n'importe quoi
 * rend une erreur PostgreSQL, donc un 500, là où l'on attend la page nue. La
 * cible est enfin confrontée au domaine par la lecture scopée elle-même : une
 * entité d'un autre domaine n'existe pas, elle ne « manque » pas.
 *
 * **Trois écritures, aucune lecture.** À la différence des pages produit et
 * Équipe, cet écran n'a pas la paire « une clé pour lire, une clé pour
 * écrire » : la page entière est réservée à `manageDomain`, il n'y a donc pas
 * deux droits à séparer. Une entité est un libellé — la ligne de liste dit tout
 * ce qu'il y aurait à détailler.
 *
 * **Ce n'est pas ce rendu qui protège** : les cinq actions redérivent le droit
 * sur l'identifiant **reçu** (`app/(app)/administration/actions.ts`). Un panneau
 * absent du rendu n'a jamais protégé le point d'entrée HTTP qui l'accompagne.
 */

import { EntityPanel } from "@/components/admin/entity-panel";
import { ConfirmPanel } from "@/components/ui/confirm-panel";
import type { Session } from "@/lib/auth/session";
import { entities, products } from "@/lib/db/schema";
import type { AdminDrawerRequest, DrawerContent } from "@/lib/drawers/types";
import { formatProducts } from "@/lib/format";
import { toEntityFormValues } from "@/lib/forms/entity";
import { ARCHIVE_PANEL_PARAM, DELETE_PANEL_PARAM, ENTITY_FORM_NEW, ENTITY_FORM_PARAM } from "@/lib/navigation";
import { isUuid } from "@/lib/uuid";

import {
  archiveEntity,
  createEntity,
  deleteEntity,
  updateEntity,
} from "@/app/(app)/administration/actions";

import { eq } from "drizzle-orm";

export async function resolveAdminDrawer(
  session: Session,
  request: AdminDrawerRequest,
): Promise<DrawerContent | null> {
  /* Le droit d'abord, une seule fois pour les trois panneaux : il ne dépend
     d'aucun identifiant, et l'écran entier lui appartient. Qui ne l'a pas
     n'atteint de toute façon pas cette page — elle rend 404. */
  if (!session.can.manageDomain) return null;

  switch (request.kind) {
    /* ------------------------------------------------------------------ */
    case "entity": {
      /* Sans identifiant : la création. Le panneau est vide, et l'action liée
         n'a rien à recevoir. */
      if (request.id === undefined) {
        return {
          titleId: "panneau-entite-titre",
          title: "Ajouter une entité",
          subtitles: ["Référentiel du domaine"],
          body: <EntityPanel action={createEntity} />,
        };
      }

      if (!isUuid(request.id)) return null;

      const entity = await session.db.find(entities, request.id);
      /* Une entité archivée ne se corrige pas : le geste juste est de la
         rétablir, et l'action le refuse de son côté — ce qui est le seul
         contrôle qui protège. */
      if (!entity || entity.archivedAt !== null) return null;

      return {
        titleId: "panneau-entite-titre",
        title: "Modifier l'entité",
        subtitles: [entity.label],
        /* L'action est liée **côté serveur** à l'entité : l'identifiant sort de
           la saisie. Ce n'est pas un verrou — Next sérialise les arguments liés
           dans un champ `$ACTION_…`, réécrivable. Le verrou est dans l'action,
           qui interroge `manageDomain` puis rapproche l'entité reçue du domaine
           courant. */
        body: (
          <EntityPanel
            action={updateEntity.bind(null, entity.id)}
            submitLabel="Enregistrer les modifications"
            initial={toEntityFormValues(entity)}
          />
        ),
      };
    }

    /* ------------------------------------------------------------------ */
    case "archive": {
      // On ne confirme pas l'archivage de ce qui est déjà rangé.
      if (!isUuid(request.id)) return null;

      const entity = await session.db.find(entities, request.id);
      if (!entity || entity.archivedAt !== null) return null;

      /* Le décompte est **lu ici pour être dit** : le panneau annonce ce qui
         s'oppose au geste avant qu'on l'exerce, plutôt que de le refuser après
         coup. Ce n'est pas lui qui décide — `archiveEntity` recompte sur ce
         qu'elle reçoit. */
      const alive = await session.db.count(products, {
        where: eq(products.entityId, entity.id),
      });

      return {
        titleId: "panneau-confirmation-titre",
        title: "Archiver cette entité",
        subtitles: [entity.label],
        body: (
          <ConfirmPanel
            action={archiveEntity.bind(null, entity.id)}
            submitLabel="Archiver cette entité"
            pendingLabel="Archivage…"
          >
            <div className="flex flex-col gap-3 text-sm text-content-neutral-dark">
              <p>
                Cette entité disparaît des filtres de la liste des produits et
                des entités proposées à un produit. Rien n&apos;est supprimé.
              </p>
              <p>
                Les produits déjà rattachés gardent son nom : c&apos;est la
                mémoire de l&apos;accompagnement, elle ne se perd pas.
              </p>
              {alive > 0 ? (
                <p className="font-semibold">
                  {formatProducts(alive)}
                  {alive > 1
                    ? " vivants portent encore cette entité : le geste sera refusé tant qu'ils ne sont pas rattachés ailleurs ou archivés."
                    : " vivant porte encore cette entité : le geste sera refusé tant qu'il n'est pas rattaché ailleurs ou archivé."}
                </p>
              ) : (
                <p>Le geste se défait : une entité archivée se rétablit.</p>
              )}
            </div>
          </ConfirmPanel>
        ),
      };
    }

    /* ------------------------------------------------------------------ */
    case "delete": {
      if (!isUuid(request.id)) return null;

      const entity = await session.db.find(entities, request.id);
      if (!entity) return null;

      /* Le décompte total, archivés compris : c'est celui que la clé étrangère
         `on delete restrict` opposera. Il est lu pour être **dit**, comme
         ci-dessus — `deleteEntity` recompte, et la base tranche. */
      const total = await session.db.count(products, {
        where: eq(products.entityId, entity.id),
        includeArchived: true,
      });

      return {
        titleId: "panneau-confirmation-titre",
        title: "Supprimer cette entité",
        subtitles: [entity.label],
        body: (
          <ConfirmPanel
            action={deleteEntity.bind(null, entity.id)}
            submitLabel="Supprimer définitivement"
            pendingLabel="Suppression…"
          >
            <div className="flex flex-col gap-3 text-sm text-content-neutral-dark">
              {/* Le panneau dit ce que le geste a d'exceptionnel avant de le
                  proposer : c'est la seule suppression de Vision, et elle ne se
                  défait pas. */}
              <p className="font-semibold">
                Ce geste ne se défait pas. La ligne est effacée de la base, elle
                n&apos;est pas rangée.
              </p>
              <p>
                Il n&apos;existe que pour une entité créée par erreur — un
                doublon, une faute de frappe corrigée en créant une seconde
                ligne. Une entité qui a servi s&apos;archive.
              </p>
              {total > 0 ? (
                <p className="font-semibold">
                  {formatProducts(total)}
                  {total > 1
                    ? " portent encore cette entité, archivés compris : le geste sera refusé."
                    : " porte encore cette entité, archivé compris : le geste sera refusé."}
                </p>
              ) : (
                <p>Aucun produit ne la référence : rien ne se perdra.</p>
              )}
            </div>
          </ConfirmPanel>
        ),
      };
    }
  }
}

/**
 * La traduction des paramètres d'URL en demande — le chemin qui reste ouvert.
 *
 * **Le vocabulaire d'URL vit ici et nulle part ailleurs.** Chaque clé garde le
 * sens que `lib/navigation.ts` lui donne : `entite` porte le cas dans sa valeur,
 * `nouvelle` créant et un identifiant corrigeant ; `archiver` et `supprimer`
 * désignent toujours l'entité visée, `/administration` n'ayant pas d'objet de
 * page. Une valeur qui ne désigne rien n'ouvre rien — c'est `isUuid`, dans la
 * résolution, qui le tranche.
 */
export function adminRequestFromParams(asked: {
  entite?: string | undefined;
  archiver?: string | undefined;
  supprimer?: string | undefined;
}): AdminDrawerRequest | null {
  if (asked.entite !== undefined) {
    return asked.entite === ENTITY_FORM_NEW
      ? { kind: "entity" }
      : { kind: "entity", id: asked.entite };
  }

  if (asked.archiver !== undefined) {
    return { kind: "archive", id: asked.archiver };
  }

  if (asked.supprimer !== undefined) {
    return { kind: "delete", id: asked.supprimer };
  }

  return null;
}

/**
 * Les clés d'URL qui ouvrent un panneau **sur la page Administration**.
 *
 * Les trois y sont, et il n'y a rien à en tenir dehors : cet écran ne porte
 * aucun filtre ni aucune recherche, à la différence de `/equipe` et de la page
 * produit. Le jour où il en portera un, il aura la même distinction à faire.
 */
export const ADMIN_PANEL_PARAMS = [
  ENTITY_FORM_PARAM,
  ARCHIVE_PANEL_PARAM,
  DELETE_PANEL_PARAM,
] as const;
