/**
 * Le fournisseur d'identité — d'où vient la personne courante.
 *
 * **La promesse de C1 est tenue, et ce fichier en est l'épreuve.** Il annonçait
 * depuis T1.4 qu'il serait « le seul fichier que le SSO réécrira », et que « le
 * contexte, les droits, les écrans et les tests ne bougeront pas ». T9.2 l'a
 * réécrit : `lib/auth/session.ts` n'a vu changer qu'une fonction,
 * `resolveDomainId`, et **aucun écran du produit n'a bougé** — c'est le critère
 * du ticket, et il se lit dans le diff.
 *
 * **Le cookie n'est plus le même objet.** Le stub posait un identifiant de
 * personne en clair : *« il n'authentifie personne, il désigne »*. Celui-ci
 * authentifie, donc il se signe (`cookie.ts`), et il porte **le domaine avec la
 * personne** — c'est ce que la version précédente ne pouvait pas faire, faute
 * de savoir d'où le domaine venait.
 *
 * **La tolérance du stub disparaît avec lui.** Un cookie survivant à un
 * ré-amorçage retombait sur la première personne connectable ; son commentaire
 * le disait déjà : *« le repli est un confort de développement, pas une
 * règle »*. Il n'y a plus de repli. Une identité fournie et inéligible est
 * refusée, jamais remplacée.
 *
 * **`/dev/session` reste**, 404 en production : c'est le seul endroit où l'on
 * change de personne courante en développement, et le SSO ne le remplace pas —
 * une adresse personnelle ne porte ni `hd` ni `tid` (arbitrage 2), donc le
 * chemin d'un membre de domaine ne se parcourt pas au navigateur.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  openPrincipal,
  sealPrincipal,
  type Principal,
} from "./cookie";
import type { ProviderId } from "./oidc";
import { loadSession, type Session } from "./session";
import { superAdmin } from "../db/scoped";

export { SESSION_COOKIE } from "./cookie";

/** Les adresses de l'authentification, en un seul endroit. */
export const AUTH_ROUTES = {
  /** L'écran d'entrée **et** de refus : il dit la même chose dans les deux cas. */
  entry: "/auth/acces",
  signIn: (provider: ProviderId) => `/auth/connexion?fournisseur=${provider}`,
  signOut: "/auth/deconnexion",
} as const;

/**
 * Les attributs du cookie de session, écrits une fois.
 *
 * `sameSite: "lax"` et non `"strict"` : le rappel du fournisseur est une
 * navigation venue d'un autre site, et `strict` ferait perdre le cookie
 * exactement au moment où il vient d'être posé.
 */
export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: SESSION_TTL_SECONDS,
} as const;

/* ==========================================================================
   La lecture
   ========================================================================== */

/**
 * Qui tient le cookie — une personne, un super administrateur, ou personne.
 *
 * `null` couvre les quatre cas d'un même refus : cookie absent, signature
 * falsifiée, charge expirée, forme inconnue. Aucun ne se distingue de
 * l'extérieur, et aucun ne se replie sur quoi que ce soit.
 */
export const readPrincipal = cache(async (): Promise<Principal | null> => {
  const store = await cookies();
  return openPrincipal(store.get(SESSION_COOKIE)?.value);
});

/**
 * La personne courante, une fois par requête.
 *
 * `cache()` de React mémorise le résultat pour la durée du rendu : dix
 * composants peuvent demander la session, la base n'est interrogée qu'une fois.
 *
 * **Un super administrateur rend `null`, et ce n'est pas un refus** : il n'a ni
 * domaine ni ligne `persons` (arbitrage 4), donc pas de `Session` au sens de ce
 * module. L'écran qui le concerne est T9.4 ; `/auth/acces` le reconnaît en
 * attendant.
 *
 * **`loadSession` est la seconde barrière, à chaque requête.** Le cookie ne
 * porte qu'un couple d'identifiants : accès retiré, personne archivée ou
 * désactivée, domaine suspendu — tout cela est réévalué ici, et un cookie déjà
 * posé n'y survit pas.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const principal = await readPrincipal();
  if (principal?.kind !== "person") return null;

  return loadSession({
    domainId: principal.domainId,
    personId: principal.personId,
  });
});

/**
 * La session, ou l'écran d'entrée. Pour les écrans qui n'ont pas de sens sans
 * elle.
 *
 * **Elle redirige, là où le stub levait.** Le stub garantissait toujours une
 * session — la base amorcée, il retombait sur quelqu'un ; une absence était donc
 * un défaut, et une erreur en était la juste traduction. Avec le SSO, une
 * session peut manquer **légitimement** : un visiteur non connecté n'est pas une
 * panne. Le geste vit entièrement ici, et c'est ce qui laisse les quelque cent
 * dix appelants intacts.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(AUTH_ROUTES.entry);
  return session;
}

/* ==========================================================================
   L'écriture
   ========================================================================== */

/**
 * Pose le cookie de session. Appelable depuis une action serveur ou un
 * gestionnaire de route uniquement — poser un cookie ailleurs est refusé par
 * Next.
 */
export async function openSession(principal: Principal): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, sealPrincipal(principal), sessionCookieOptions);
}

/** Referme la session. Un cookie effacé, rien d'autre : il n'y a pas d'état serveur. */
export async function closeSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Désigne la personne courante — **outil de développement, et lui seul**.
 *
 * Sa signature n'a pas bougé, pour que `/dev/session` ne bouge pas non plus.
 * Ce qu'elle fait, en revanche, a changé : elle scelle un principal complet, et
 * doit donc trouver un domaine que le jeton ne lui donne pas.
 *
 * **C'est le dernier endroit du dépôt où vit « le premier domaine actif, par
 * nom »**, et il est borné à trois titres : il est ici et nulle part ailleurs,
 * il lève hors développement, et son unique appelant rend 404 en production.
 * Le couplage que T8.1 nommait — *rien ne peut désigner un autre domaine, donc
 * un test d'action dépend de l'état global de la branche* — ne passe plus par
 * lui : les tests scellent leur propre principal, avec leur propre domaine.
 */
export async function setCurrentPerson(personId: string): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "`setCurrentPerson` est un outil de développement : en production, une " +
        "session s'ouvre par le fournisseur d'identité.",
    );
  }

  const open = await superAdmin.listDomains();
  const domainId = open.find((domain) => domain.status === "active")?.id;
  if (!domainId) {
    throw new Error(
      "Aucun domaine actif : la base n'est pas amorcée. Voir `npm run db:seed`.",
    );
  }

  await openSession({ kind: "person", personId, domainId });
}
