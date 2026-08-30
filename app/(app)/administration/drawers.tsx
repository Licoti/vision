"use server";

/**
 * Le point d'entrée serveur des panneaux de la page Administration
 * (21/08/2026) — jumeau de `loadTeamDrawer`.
 *
 * **C'est ici que le clic entre dans le serveur.** `DrawerHost` ouvre sa
 * coquille sans attendre, puis appelle cette fonction ; le corps revient rendu,
 * avec ses composants serveur et ses lectures scopées. Rien n'a changé de
 * nature : c'est l'aller-retour de navigation qui a disparu, pas le rendu
 * serveur.
 *
 * **Elle ne fait confiance à aucun de ses arguments.** La demande traverse la
 * frontière du client, donc elle est réécrivable, donc elle ne prouve rien : le
 * `kind` est rétréci avant tout usage, **le `referential` aussi depuis T7.3** —
 * c'est une seconde valeur venue du client, et sans ce filtre elle descendrait
 * jusqu'à un `switch` qui ne l'attend pas —, la session est relue, le droit est
 * redérivé, et la ligne est retrouvée dans le domaine courant à partir de ce qui
 * a été **reçu**.
 *
 * **C'est un point d'entrée HTTP à part entière**, pas un détail de rendu : il
 * s'éprouve comme une action — requête capturée puis rejouée à la main, sous une
 * autre identité et avec des charges forgées. Que `/administration` rende 404 à
 * qui n'administre pas ne protège pas cette fonction-ci, qui vit à côté de la
 * route et non derrière elle.
 */

import { requireSession } from "@/lib/auth/provider";
import { resolveAdminDrawer } from "@/lib/drawers/admin";
import {
  asAdminRequest,
  type DrawerContent,
  type DrawerRequest,
} from "@/lib/drawers/types";

export async function loadAdminDrawer(
  received: DrawerRequest,
): Promise<DrawerContent | null> {
  /* La demande est rétrécie avant d'être employée : `kind` et `referential`
     peuvent valoir n'importe quoi. `archive` passe ce filtre depuis les quatre
     pages — c'est `resolveAdminDrawer` qui la refuse, en vérifiant le droit puis
     la forme de l'UUID avant toute lecture. */
  const request = asAdminRequest(received);
  if (!request) return null;

  const session = await requireSession();

  return resolveAdminDrawer(session, request);
}
