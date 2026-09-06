/**
 * Le droit du super administrateur — **le seul droit qui ne vit pas dans une
 * session** (T9.3).
 *
 * `superAdmin` (`lib/db/scoped.ts`) créait et lisait des domaines **sans aucune
 * authentification**. Tant qu'aucun écran ne l'appelait, le fait était sans
 * conséquence ; T9.4 l'appellera. Le droit passe avant l'écran, et pas après.
 *
 * **Pourquoi un module à part, et pas un droit de plus dans `session.ts`.** Un
 * super administrateur n'a ni domaine ni ligne `persons` (arbitrage (4) de
 * `tickets-C9.md`) : `getSession()` rend `null` pour lui, et c'est écrit. Il n'a
 * donc pas de place dans `SessionRights`, dont les deux règles — `manageDomain`
 * et `writeProject` — se lisent l'une et l'autre *à l'intérieur* d'un domaine.
 * L'arbitrage (c) de C5bis interdit d'ailleurs tout droit neuf dans
 * `lib/auth/session.ts`, et ce module le tient sans exception.
 *
 * **Deux barrières, et la seconde est celle qui compte dans le temps.** Le
 * cookie porte un identifiant, rien de plus, et il vit trente jours. La ligne
 * est donc relue à chaque passage : un super administrateur archivé perd son
 * droit à la requête suivante, jamais au bout d'un mois. C'est exactement ce que
 * `getSession` fait déjà de la personne — *un accès retiré ne survit pas dans un
 * cookie déjà posé*.
 *
 * **Ce module produit une preuve, il n'écrit rien.** `requireSuperAdmin()` rend
 * un `SuperAdminGrant`, que `asSuperAdmin(grant)` consomme — et qui n'est pas
 * cru sur parole : la couche relit la ligne avant chaque écriture. Deux lectures
 * pour une écriture est le prix de la seconde barrière, et une création de
 * domaine est un geste rare.
 */

import { redirect } from "next/navigation";
import { cache } from "react";

import { AUTH_ROUTES, readPrincipal } from "./provider";
import { superAdmin, type SuperAdminGrant } from "../db/scoped";

/**
 * Ce que l'on connaît d'un super administrateur en exercice.
 *
 * Un extrait de `super_admins`, pas la ligne entière — même discipline que
 * `SessionPerson` : le contexte n'est pas un cache d'annuaire.
 */
export type SuperAdminIdentity = {
  id: string;
  email: string;
  fullName: string;
};

/**
 * Le super administrateur courant, une fois par requête, ou `null`.
 *
 * `cache()` de React mémorise le résultat pour la durée du rendu, comme
 * `getSession` : plusieurs appels ne coûtent qu'une lecture.
 *
 * `null` couvre trois cas d'un même refus, et **aucun ne se distingue de
 * l'extérieur** : pas de cookie exploitable, un cookie qui porte une personne
 * plutôt qu'un super administrateur, ou une ligne absente ou archivée. Le
 * troisième est la seconde barrière — *archiver **est** le geste qui retire le
 * droit*.
 */
export const getSuperAdmin = cache(
  async (): Promise<SuperAdminIdentity | null> => {
    const principal = await readPrincipal();
    if (principal?.kind !== "super_admin") return null;

    const row = await superAdmin.findSuperAdminById(principal.superAdminId);
    if (!row) return null;

    return { id: row.id, email: row.email, fullName: row.fullName };
  },
);

/**
 * L'autorité d'écrire au-dessus des domaines, ou l'écran d'entrée.
 *
 * **Elle redirige, comme `requireSession`**, et pour la même raison : ne pas
 * être super administrateur n'est pas une panne. `/auth/acces` dit la même
 * chose dans tous les cas — un refus qui distingue ses causes à l'écran est un
 * oracle offert à qui frappe.
 *
 * **La redirection ne prouve rien à elle seule**, et le test ne s'y fie pas :
 * un refus rend 200 comme une réussite (leçon de T6.1). C'est l'étape témoin,
 * puis le décompte en base, qui tranchent.
 */
export async function requireSuperAdmin(): Promise<SuperAdminGrant> {
  const admin = await getSuperAdmin();
  if (!admin) redirect(AUTH_ROUTES.entry);

  return { kind: "super_admin", superAdminId: admin.id };
}
