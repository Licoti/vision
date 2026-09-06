/**
 * Le sceau du cookie de session — ce que le stub n'avait pas besoin d'avoir.
 *
 * Le stub posait un identifiant de personne **en clair** dans un cookie
 * `httpOnly`, et son commentaire le disait sans détour : « le cookie
 * n'authentifie personne, il désigne ». Celui-ci authentifie : il se signe.
 * Un cookie forgé à la main ne doit pas ouvrir de session, et c'est la seule
 * chose que ce module garantit — il ne chiffre rien, la charge se lit, elle ne
 * se récrit pas.
 *
 * **`node:crypto` et non WebCrypto, et la raison est mesurable.**
 * `cookies().get()` est **synchrone** : une signature asynchrone obligerait
 * chaque appelant à précalculer sa valeur, et le harnais de tests d'action à
 * la recalculer à chacune des 293 bascules de personne qu'il opère.
 * `oauth4webapi` garde WebCrypto pour ce qui l'exige — la vérification RS256
 * contre le JWKS —, où l'asynchronisme est de toute façon dans le chemin.
 *
 * **Ce module n'importe rien de Next**, comme `session.ts` et pour la même
 * raison : les tests le chargent seuls, et le harnais scelle un principal sans
 * traîner `next/headers`.
 *
 * **La garde sur `AUTH_SECRET` lève, elle ne se replie pas.** C'est le seul
 * endroit du produit où une erreur est silencieuse : un secret absent ou trop
 * court ne produit pas une panne, il produit une session que n'importe qui
 * peut forger. `tickets-C9.md` prescrit `openssl rand -base64 32`, qui rend 44
 * caractères ; en deçà de 32, on refuse de signer.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

/* ==========================================================================
   Qui tient le cookie

   **Deux formes, et c'est l'arbitrage (4) de `tickets-C9.md` qui l'impose.**
   Un super administrateur n'a ni domaine ni ligne `persons` — il est *au-dessus*
   des domaines. Une charge qui porterait toujours un `domainId` ne pourrait pas
   le représenter, et la règle d'entrée 2, qui le consulte **avant** toute
   recherche de domaine, n'aboutirait à aucun cookie.
   ========================================================================== */

export type Principal =
  | { kind: "person"; personId: string; domainId: string }
  | { kind: "super_admin"; superAdminId: string };

/**
 * Ce que `/auth/connexion` confie au navigateur le temps de l'aller-retour :
 * `state`, `nonce` et le vérificateur PKCE, plus le fournisseur qui les a
 * demandés. Scellé du même sceau — un `state` réécrit par le porteur ne
 * protégerait de rien.
 */
export type Handshake = {
  provider: string;
  state: string;
  nonce: string;
  codeVerifier: string;
};

/** Le cookie de session. Nom neuf : le format l'est aussi. */
export const SESSION_COOKIE = "vision_session";

/** Le cookie de l'aller-retour OAuth, effacé par le rappel qui le consomme. */
export const HANDSHAKE_COOKIE = "vision_oauth";

/** Huit heures. Une journée de travail, pas un abonnement. */
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

/** Dix minutes : le temps d'un écran de consentement, jamais davantage. */
export const HANDSHAKE_TTL_SECONDS = 10 * 60;

/** Le seuil de `openssl rand -base64 32`, moins la marge de son padding. */
const MIN_SECRET_LENGTH = 32;

/* ==========================================================================
   Le sceau
   ========================================================================== */

export class AuthSecretError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthSecretError";
  }
}

/**
 * Le secret, lu à l'usage et non au chargement du module.
 *
 * Lever à l'import ferait tomber la suite de tests entière sur un seul fichier
 * mal configuré, et surtout rendrait le défaut illisible : ce qu'on veut voir,
 * c'est « le cookie n'a pas pu être signé », pas « le module n'a pas pu se
 * charger ».
 */
function secret(): string {
  const value = process.env.AUTH_SECRET;

  if (!value) {
    throw new AuthSecretError(
      "AUTH_SECRET est absente : aucun cookie de session ne peut être signé. " +
        "La poser dans .env.local — `openssl rand -base64 32`.",
    );
  }

  if (value.length < MIN_SECRET_LENGTH) {
    throw new AuthSecretError(
      `AUTH_SECRET fait ${value.length} caractères, moins que les ${MIN_SECRET_LENGTH} ` +
        "attendus. Un secret court signe un cookie que l'on peut forger, et un " +
        "cookie forgé n'est pas une erreur : c'est une session. " +
        "La régénérer — `openssl rand -base64 32`.",
    );
  }

  return value;
}

function sign(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

/**
 * Scelle une charge : `<base64url(json)>.<base64url(hmac)>`.
 *
 * `exp` entre **dans la charge signée**, jamais à côté : une expiration que le
 * porteur peut réécrire n'expire rien. Le `Max-Age` du cookie dit la même chose
 * au navigateur ; c'est celle-ci qui fait foi côté serveur.
 */
function seal(payload: object, ttlSeconds: number): string {
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    }),
  ).toString("base64url");

  return `${body}.${sign(body)}`;
}

/** Ouvre une charge scellée, ou `null`. Jamais de levée sur une valeur reçue. */
function open(value: string | undefined | null): unknown {
  if (!value) return null;

  const cut = value.lastIndexOf(".");
  if (cut <= 0) return null;

  const body = value.slice(0, cut);
  const given = Buffer.from(value.slice(cut + 1), "base64url");
  const expected = Buffer.from(sign(body), "base64url");

  /* `timingSafeEqual` lève si les longueurs diffèrent : la comparer d'abord
     n'est pas une optimisation, c'est ce qui empêche une signature tronquée de
     faire remonter une exception au lieu d'un refus. */
  if (given.length !== expected.length) return null;
  if (!timingSafeEqual(given, expected)) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;

  const { exp } = parsed as { exp?: unknown };
  if (typeof exp !== "number" || exp * 1000 <= Date.now()) return null;

  return parsed;
}

/* ==========================================================================
   Les deux charges

   **Chacune se relit par sa forme, jamais sur parole.** Une charge scellée par
   nous reste une charge qui a fait l'aller-retour par le navigateur : la
   signature dit qu'elle n'a pas été récrite, elle ne dit pas qu'elle a la forme
   qu'on attend — un cookie de la veille, d'une version antérieure du format, la
   porte tout autant.
   ========================================================================== */

export function sealPrincipal(
  principal: Principal,
  ttlSeconds = SESSION_TTL_SECONDS,
): string {
  return seal(principal, ttlSeconds);
}

export function openPrincipal(
  value: string | undefined | null,
): Principal | null {
  const payload = open(value) as Record<string, unknown> | null;
  if (!payload) return null;

  if (
    payload.kind === "person" &&
    typeof payload.personId === "string" &&
    typeof payload.domainId === "string"
  ) {
    return {
      kind: "person",
      personId: payload.personId,
      domainId: payload.domainId,
    };
  }

  if (
    payload.kind === "super_admin" &&
    typeof payload.superAdminId === "string"
  ) {
    return { kind: "super_admin", superAdminId: payload.superAdminId };
  }

  return null;
}

export function sealHandshake(handshake: Handshake): string {
  return seal(handshake, HANDSHAKE_TTL_SECONDS);
}

export function openHandshake(
  value: string | undefined | null,
): Handshake | null {
  const payload = open(value) as Record<string, unknown> | null;
  if (!payload) return null;

  if (
    typeof payload.provider !== "string" ||
    typeof payload.state !== "string" ||
    typeof payload.nonce !== "string" ||
    typeof payload.codeVerifier !== "string"
  ) {
    return null;
  }

  return {
    provider: payload.provider,
    state: payload.state,
    nonce: payload.nonce,
    codeVerifier: payload.codeVerifier,
  };
}
