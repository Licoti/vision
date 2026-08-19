"use server";

/**
 * Le point d'entrée serveur du panneau de la page Équipe — T5bis.4.
 *
 * **C'est ici que le clic entre dans le serveur.** `DrawerHost` ouvre sa
 * coquille sans attendre, puis appelle cette fonction ; le corps revient rendu,
 * avec ses composants serveur et ses lectures scopées. Rien n'a changé de
 * nature : c'est l'aller-retour de navigation qui a disparu, pas le rendu
 * serveur.
 *
 * **Elle ne fait confiance à aucun de ses arguments.** La demande traverse la
 * frontière du client, donc elle est réécrivable, donc elle ne prouve rien : le
 * `kind` est rétréci avant tout usage, la session est relue, et la personne est
 * retrouvée dans le domaine courant à partir de ce qui a été **reçu**.
 *
 * **C'est un point d'entrée HTTP à part entière**, pas un détail de rendu : il
 * s'éprouve comme une action — requête capturée puis rejouée à la main, sous une
 * autre identité et avec des charges forgées. Un panneau absent du rendu n'a
 * jamais protégé le point d'entrée qui l'accompagne.
 */

import { requireSession } from "@/lib/auth/provider";
import { resolveTeamDrawer } from "@/lib/drawers/team";
import {
  asTeamRequest,
  type DrawerContent,
  type DrawerRequest,
} from "@/lib/drawers/types";

export async function loadTeamDrawer(
  received: DrawerRequest,
): Promise<DrawerContent | null> {
  /* La demande est rétrécie avant d'être employée : `kind` peut valoir n'importe
     quoi — y compris `personaDetail`, le panneau de la page produit dont le nom
     ne diffère que d'une lettre. Ce qui ne passe pas n'ouvre rien. */
  const request = asTeamRequest(received);
  if (!request) return null;

  const session = await requireSession();

  return resolveTeamDrawer(session, request);
}
