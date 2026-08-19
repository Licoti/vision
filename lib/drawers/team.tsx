/**
 * La résolution du panneau de la page Équipe — T5bis.4.
 *
 * **Deux chemins, une seule résolution.** L'URL reste une adresse valide —
 * coller `?personne=<identifiant>` ouvre encore la fiche, au rendu serveur — et
 * le clic passe par `DrawerHost`, qui n'écrit plus l'adresse (TD.2). Les faire
 * diverger mettrait une règle de droit à deux endroits, et c'est exactement ce
 * qu'une refonte de mécanisme ne doit pas produire.
 *
 * **Les disciplines tenues, sans exception.** La forme de l'UUID se vérifie
 * **avant** la base — une colonne `uuid` interrogée avec n'importe quoi rend une
 * erreur PostgreSQL, donc un 500, là où l'on attend la page nue. La cible est
 * ensuite confrontée au domaine et à son archivage par la lecture scopée
 * elle-même : une personne d'un autre domaine n'existe pas, elle ne « manque »
 * pas.
 *
 * **Aucun droit ne garde cette fiche** (D9) : elle se lit par tout le domaine,
 * comme la liste qui la porte — le précédent exact du `personaDetail` de la page
 * produit. T5bis.6 ajoutera trois `case` d'écriture, et c'est **ici** que vivra
 * leur porte, jamais dans l'écran.
 *
 * **Pas de contexte à charger.** La page produit passe à sa résolution les
 * collections qu'elle a déjà lues ; `/equipe` n'a pas d'objet de page, et ses
 * trois lectures ne sont donc payées que lorsqu'un panneau s'ouvre.
 */

import {
  PersonDetail,
  PersonDetailHeader,
} from "@/components/team/person-detail";
import type { Session } from "@/lib/auth/session";
import type { DrawerContent, TeamDrawerRequest } from "@/lib/drawers/types";
import { PERSON_PANEL_PARAM } from "@/lib/navigation";
import { findPersonDetail } from "@/lib/queries/team";
import { isUuid } from "@/lib/uuid";

export async function resolveTeamDrawer(
  session: Session,
  request: TeamDrawerRequest,
): Promise<DrawerContent | null> {
  switch (request.kind) {
    /* ------------------------------------------------------------------ */
    case "personDetail": {
      if (!isUuid(request.id)) return null;

      /* La lecture porte elle-même les trois refus de la fiche : un
         identifiant inconnu, une personne d'un autre domaine et une personne
         archivée rendent `null`, et l'écran est alors la page nue — jamais un
         404 : la liste reste lisible, seul le panneau disparaît. */
      const person = await findPersonDetail(session.db, request.id);
      if (!person) return null;

      return {
        titleId: "panneau-personne-titre",
        title: person.fullName,
        /* Le couple titre / sous-titres n'est pas rendu — l'en-tête ci-dessous
           le remplace —, mais le titre reste porté : c'est lui que la coquille
           emploierait si l'en-tête venait à tomber, et c'est le contrat du
           type. */
        subtitles: [],
        header: <PersonDetailHeader person={person} />,
        body: <PersonDetail person={person} />,
      };
    }
  }
}

/**
 * La traduction des paramètres d'URL en demande — le chemin qui reste ouvert.
 *
 * **Le vocabulaire d'URL vit ici et nulle part ailleurs.** La clé garde le sens
 * que `lib/navigation.ts` lui donne : une valeur qui est **toujours** un
 * identifiant, et toute autre n'ouvre rien — c'est `isUuid`, dans la résolution,
 * qui le tranche. T5bis.6 ajoutera ici la valeur `nouvelle` et la clé
 * `competence`.
 */
export function teamRequestFromParams(asked: {
  personne?: string | undefined;
}): TeamDrawerRequest | null {
  if (asked.personne !== undefined) {
    return { kind: "personDetail", id: asked.personne };
  }
  return null;
}

/**
 * Les clés d'URL qui ouvrent un panneau **sur la page Équipe**.
 *
 * **Les cinq clés de filtre n'y sont pas**, et c'est tout leur sens : `q`,
 * `metier`, `competence`, `niveau` et `dispo` n'ouvrent rien, et les balayer à
 * la fermeture d'un panneau défairait la recherche qui l'a produit. C'est la
 * distinction que `de` et `a` tiennent déjà sur la page produit.
 */
export const TEAM_PANEL_PARAMS = [PERSON_PANEL_PARAM] as const;
