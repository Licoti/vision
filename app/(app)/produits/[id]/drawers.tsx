"use server";

/**
 * Le point d'entrée serveur des panneaux de la page produit — TD.2.
 *
 * **C'est ici que le clic entre dans le serveur.** `DrawerHost` ouvre sa
 * coquille sans attendre, puis appelle cette fonction ; le corps revient rendu,
 * avec ses composants serveur, ses référentiels et ses actions liées côté
 * serveur. Rien de ce que faisait la page n'a changé de nature : c'est
 * l'aller-retour de navigation qui a disparu, pas le rendu serveur.
 *
 * **Elle ne fait confiance à aucun de ses arguments.** `productId` et l'
 * identifiant de la demande traversent la frontière du client, donc ils sont
 * réécrivables, donc ils ne prouvent rien : la session est relue, le produit
 * retrouvé dans le domaine courant, et le droit redérivé sur ce qui a été
 * **reçu**. C'est la règle du dépôt depuis T3.3, et TD.2 ne l'assouplit pas
 * d'un caractère — au contraire, c'est elle qui rend la refonte possible sans
 * toucher à la sécurité.
 *
 * **Ce n'est de toute façon pas ce point d'entrée qui protège** : les actions
 * redérivent le droit de leur côté. Un panneau que cette fonction refuse de
 * rendre n'a jamais fermé le point d'entrée HTTP qui l'accompagne.
 */

import {
  loadProductDrawerContext,
  resolveProductDrawer,
} from "@/lib/drawers/product";
import {
  asProductRequest,
  type DrawerContent,
  type DrawerRequest,
} from "@/lib/drawers/types";
import { requireSession } from "@/lib/auth/provider";
import { findProductDetail } from "@/lib/queries/products";
import { isUuid } from "@/lib/uuid";

export async function loadProductDrawer(
  productId: string,
  received: DrawerRequest,
): Promise<DrawerContent | null> {
  /* La demande est rétrécie avant d'être employée : `kind` traverse la
     frontière du client, donc il peut valoir n'importe quoi — y compris le nom
     d'un panneau de la page projet. Ce qui ne passe pas n'ouvre rien. */
  const request = asProductRequest(received);
  if (!request) return null;

  /* La forme avant la base, comme partout : une colonne `uuid` interrogée avec
     n'importe quoi rend une erreur PostgreSQL, donc un 500, là où l'on attend
     un panneau qui ne s'ouvre pas. */
  if (!isUuid(productId)) return null;

  const session = await requireSession();

  const product = await findProductDetail(session.db, productId);
  if (!product) return null;

  const context = await loadProductDrawerContext(session, product, request);
  return resolveProductDrawer(session, product, context, request);
}
