"use server";

/**
 * Le point d'entrée serveur des panneaux de l'écran au-dessus des domaines —
 * jumeau de `loadAdminDrawer`, à l'autorité près.
 *
 * **C'est un point d'entrée HTTP à part entière**, pas un détail de rendu. Que
 * `/domaines` redirige qui n'a pas d'autorité ne protège pas cette fonction-ci,
 * qui vit **à côté** de la route et non derrière elle : `requireSuperAdmin()` y
 * est appelé pour elle-même, et il relit la ligne `super_admins` comme partout
 * ailleurs.
 *
 * **Elle ne fait confiance à aucun de ses arguments.** La demande traverse la
 * frontière du client, donc elle est réécrivable, donc elle ne prouve rien : le
 * `kind` est rétréci avant tout usage, et `resolveDomainDrawer` vérifie ensuite
 * la forme de l'UUID avant toute lecture.
 */

import { requireSuperAdmin } from "@/lib/auth/super-admin";
import { resolveDomainDrawer } from "@/lib/drawers/domains";
import {
  asDomainRequest,
  type DrawerContent,
  type DrawerRequest,
} from "@/lib/drawers/types";

export async function loadDomainDrawer(
  received: DrawerRequest,
): Promise<DrawerContent | null> {
  /* `archive` passe ce filtre depuis les cinq pages qui la portent — c'est la
     résolution qui la refuse, en cherchant un domaine que l'identifiant d'un
     produit ne désigne pas. */
  const request = asDomainRequest(received);
  if (!request) return null;

  const grant = await requireSuperAdmin();

  return resolveDomainDrawer(grant, request);
}
