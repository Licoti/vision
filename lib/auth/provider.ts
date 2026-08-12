/**
 * Le fournisseur d'identité — d'où vient la personne courante.
 *
 * **C'est le seul fichier que C7 réécrit.** Le stub lit un cookie ; Entra ID
 * lira un jeton, et appellera le même `loadCurrentSession`. Le contexte, les
 * droits, les écrans et les tests ne bougeront pas. C'est tout l'objet de la
 * séparation entre ce module et `session.ts` : D37 demande la forme
 * définitive dès C1, pas la source définitive.
 *
 * Interdits du ticket T1.4 respectés : aucun appel à Entra ID, aucune page de
 * connexion. Le cookie n'authentifie personne — il désigne, en développement,
 * qui l'on prétend être.
 */

import { cookies } from "next/headers";
import { cache } from "react";

import { loadCurrentSession, type Session } from "./session";

/** Le cookie du stub. Il disparaîtra avec lui en C7. */
export const SESSION_COOKIE = "vision_person";

/**
 * La personne courante, une fois par requête.
 *
 * `cache()` de React mémorise le résultat pour la durée du rendu : dix
 * composants peuvent demander la session, la base n'est interrogée qu'une
 * fois.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const store = await cookies();
  const personId = store.get(SESSION_COOKIE)?.value ?? null;

  const session = await loadCurrentSession(personId);
  if (session || !personId) return session;

  // Tolérance propre au stub, et qui doit rester ici : un cookie peut
  // survivre à un ré-amorçage de la base et pointer une personne disparue.
  // Le contexte, lui, refuse net une identité inéligible — c'est la
  // sécurité de C7. Le repli est un confort de développement, pas une règle.
  return loadCurrentSession(null);
});

/** La session, ou une erreur. Pour les écrans qui n'ont pas de sens sans elle. */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error(
      "Aucune personne courante : le domaine n'est pas amorcé. Voir T1.5.",
    );
  }
  return session;
}

/**
 * Désigne la personne courante. Appelable depuis une action serveur
 * uniquement — poser un cookie ailleurs est refusé par Next.
 */
export async function setCurrentPerson(personId: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, personId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}
