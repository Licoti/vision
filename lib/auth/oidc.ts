/**
 * Les deux fournisseurs d'identité — découverte, autorisation, vérification.
 *
 * Arbitrage (1) de `tickets-C9.md` : **Google et Microsoft, tous deux
 * multi-tenant**. Une seule inscription par fournisseur vaut pour toutes les
 * entreprises clientes ; aucun réenregistrement par client. Écart à `docs/01`
 * §141 — « environnement Microsoft » — consigné au journal technique.
 *
 * **Ce que `oauth4webapi` fait, et que nous n'écrivons pas** : la vérification
 * RS256 contre les clés JWKS et leur rotation, `state`, `nonce`, PKCE. C'est le
 * seul endroit du produit où une erreur est silencieuse — un jeton forgé
 * accepté ne produit pas une erreur, il produit une session. **Aucune URL
 * d'autorisation n'est écrite à la main** : elle se construit sur le document
 * de découverte du fournisseur.
 *
 * **Ce module ne connaît pas les règles d'entrée.** Il rend des *claims
 * vérifiés* ; ce qu'on en fait est l'affaire d'`entry.ts`, et c'est cette
 * séparation qui rend les six règles mesurables sur claims forgés, sans
 * réseau ni connexion réelle.
 *
 * **Un seul fournisseur est branché — Google —, et les deux sont écrits.**
 * Entra ID Free demande une carte bancaire de vérification d'identité
 * (vérifié le 06/09/2026) : ses valeurs n'existent pas encore. Ajouter
 * Microsoft, ce sera deux valeurs dans `.env.local` et **rien dans ce
 * fichier** — c'est ce que la table `PROVIDERS` doit rendre évident. Le
 * corollaire est écrit sans détour : **le chemin Microsoft n'est pas mesuré**,
 * et il porte le seul point de forme qui diffère, celui de l'émetteur.
 */

import * as oauth from "oauth4webapi";

import type { Handshake } from "./cookie";
import type { identityProvider } from "../db/schema";

/** `google` · `microsoft`. Dérivé du schéma, jamais réécrit à la main. */
export type ProviderId = (typeof identityProvider.enumValues)[number];

/* ==========================================================================
   La table des fournisseurs

   Une entrée par valeur de l'énuméré. Un fournisseur de plus est une ligne de
   plus ici, jamais une reprise ailleurs : c'est la promesse de la fiche, et
   c'est cette table qui la tient ou la trahit.
   ========================================================================== */

type ProviderRecord = {
  readonly label: string;
  /** L'identifiant d'émetteur, d'où se déduit l'adresse du document de découverte. */
  readonly issuer: URL;
  /**
   * **Ce que le document de découverte doit annoncer**, qui n'est pas toujours
   * l'identifiant qu'on a interrogé.
   *
   * Chez Google, les deux coïncident. Chez Microsoft, non : le document de
   * `organizations` annonce un émetteur **gabarit**,
   * `https://login.microsoftonline.com/{tenantid}/v2.0`. Mesuré le 06/09/2026 —
   * `processDiscoveryResponse` refusait la découverte entière sur
   * `OAUTH_JSON_ATTRIBUTE_COMPARISON_FAILED`, **avant même que le locataire
   * puisse être connu**. Les deux côtés passant par `new URL().href`, le gabarit
   * se compare à lui-même une fois ses accolades encodées : c'est donc *lui*
   * qu'on attend ici, et le locataire réel se substitue plus tard
   * (`tenantScopedIssuer`).
   */
  readonly declaredIssuer: URL;
  /**
   * Le claim qui porte **l'entreprise vérifiée** — arbitrage (2).
   * `hd` chez Google (*hosted domain*), `tid` chez Microsoft. Un compte grand
   * public n'en porte aucun, et il est refusé au point d'entrée. **Le
   * rattachement ne se fait jamais sur le domaine de la chaîne e-mail** : une
   * adresse peut être un alias, `hd` et `tid` sont vérifiés par le fournisseur.
   */
  readonly enterpriseClaim: "hd" | "tid";
  /**
   * **L'émetteur dépend-il du locataire ?**
   *
   * Chez Google, non : `https://accounts.google.com` émet pour tout le monde,
   * et le document de découverte le dit tel quel.
   *
   * Chez Microsoft, oui — et c'est le seul point de forme où les deux
   * fournisseurs diffèrent. Le document de découverte de `organizations` rend
   * un émetteur **gabarit**, `https://login.microsoftonline.com/{tenantid}/v2.0`
   * (relevé le 06/09/2026 : voir `declaredIssuer`), quand un jeton porte
   * l'émetteur du locataire réel. La vérification se fait donc en deux temps : on lit le `tid` de la charge **sans lui faire
   * confiance**, on en dérive l'émetteur attendu, et c'est `oauth4webapi` qui
   * confronte ensuite signature et `iss` à cette valeur. Un `tid` menti donne
   * un `iss` attendu qui ne correspond plus, et le jeton tombe.
   */
  readonly tenantScopedIssuer: boolean;
  readonly clientIdEnv: string;
  readonly clientSecretEnv: string;
};

export const PROVIDERS: Readonly<Record<ProviderId, ProviderRecord>> = {
  google: {
    label: "Google",
    issuer: new URL("https://accounts.google.com"),
    declaredIssuer: new URL("https://accounts.google.com"),
    enterpriseClaim: "hd",
    tenantScopedIssuer: false,
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
  },
  microsoft: {
    label: "Microsoft",
    issuer: new URL("https://login.microsoftonline.com/organizations/v2.0"),
    declaredIssuer: new URL("https://login.microsoftonline.com/{tenantid}/v2.0"),
    enterpriseClaim: "tid",
    tenantScopedIssuer: true,
    clientIdEnv: "ENTRA_CLIENT_ID",
    clientSecretEnv: "ENTRA_CLIENT_SECRET",
  },
};

/**
 * Les trois portées, et **`offline_access` n'en est pas**.
 *
 * Un jeton de rafraîchissement ne sert qu'à rappeler l'API du fournisseur plus
 * tard, et Vision ne la rappelle jamais : elle lit le jeton d'identité à la
 * connexion, en tire l'entreprise, l'e-mail et l'identifiant, puis pose son
 * propre cookie. Ne pas demander la portée fait tomber avec elle l'expiration
 * à sept jours des jetons de rafraîchissement du mode *Testing* de Google,
 * raccourcit l'écran de consentement, et retire un secret de longue vie.
 */
const SCOPE = "openid email profile";

export function isProviderId(value: string | null): value is ProviderId {
  return value === "google" || value === "microsoft";
}

/**
 * Ce fournisseur est-il **raccordé à cet environnement** ? — 08/09/2026.
 *
 * **Deux questions, et elles ne se confondent pas.** `isProviderId` demande *ce
 * mot désigne-t-il un fournisseur que Vision sait parler* ; celle-ci demande *ce
 * fournisseur a-t-il ses deux valeurs*. La couche s'écrit pour deux fournisseurs
 * et en sert un — c'est l'arbitrage (1) de `tickets-C9.md`, et Entra ID demande
 * une carte bancaire que le POC n'a pas donnée.
 *
 * **Elle existe parce que l'écran d'entrée proposait les deux, et que le second
 * rendait 500** (mesuré le 08/09/2026 : `GET /auth/connexion?fournisseur=microsoft`
 * → `500`, `required()` levant `ProviderConfigError` sans personne pour la
 * rattraper). Un bouton qui mène à une erreur de serveur n'est pas un fournisseur
 * absent, c'est une panne — et la règle 5 veut un **écran**, jamais un cas
 * d'erreur. Le retour, lui, ne souffrait pas du défaut : son `try` embrasse déjà
 * tout ce que le jeton peut avoir de faux.
 *
 * **Elle ne remplace pas `required()`, elle la précède.** La levée nommée reste
 * le dernier mot pour qui appelle `beginAuthorization` sans passer par ici : *un
 * fournisseur sans identifiant client ne marche pas moins bien, il ne marche
 * pas*.
 *
 * **Le secret compte autant que l'identifiant** : l'aller n'a besoin que du
 * premier, mais un fournisseur à demi renseigné mènerait l'utilisateur chez
 * Google pour le faire échouer **au retour**, après consentement — le pire des
 * deux moments pour découvrir un réglage manquant.
 */
export function isProviderConnected(provider: ProviderId): boolean {
  const record = PROVIDERS[provider];
  return Boolean(
    process.env[record.clientIdEnv] && process.env[record.clientSecretEnv],
  );
}

/* ==========================================================================
   Les réglages, lus à l'usage

   Comme `AUTH_SECRET` dans `cookie.ts` : une levée nommée plutôt qu'un repli.
   Un fournisseur sans identifiant client ne « marche pas moins bien », il ne
   marche pas — et le dire au moment où on le demande rend le défaut lisible.
   ========================================================================== */

export class ProviderConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderConfigError";
  }
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ProviderConfigError(
      `${name} est absente de .env.local : ce fournisseur n'est pas raccordé. ` +
        "Voir la table des six valeurs de `tickets-C9.md`.",
    );
  }
  return value;
}

/**
 * L'adresse de rappel, **construite une seule fois et au même endroit** pour
 * les deux usages — la requête d'autorisation et l'échange du code.
 *
 * Google et Microsoft la comparent **au caractère près** à celle enregistrée en
 * console : deux constructions voisines seraient deux occasions de diverger.
 */
export function callbackUrl(provider: ProviderId): string {
  return new URL(`/auth/callback/${provider}`, required("AUTH_URL")).toString();
}

/* ==========================================================================
   La découverte

   Mémorisée par processus : le document d'un fournisseur ne change pas d'une
   requête à l'autre, et une connexion n'a pas à payer un aller-retour de plus.
   Les clés JWKS, elles, ne sont pas mémorisées ici — `oauth4webapi` les relit,
   et c'est leur rotation qui est en jeu.
   ========================================================================== */

const discovered = new Map<ProviderId, Promise<oauth.AuthorizationServer>>();

async function authorizationServer(
  provider: ProviderId,
): Promise<oauth.AuthorizationServer> {
  const known = discovered.get(provider);
  if (known) return known;

  const record = PROVIDERS[provider];
  const pending = oauth
    .discoveryRequest(record.issuer, { algorithm: "oidc" })
    .then((response) =>
      oauth.processDiscoveryResponse(record.declaredIssuer, response),
    );

  discovered.set(provider, pending);

  /* Une découverte en échec ne se garde pas : la mémoriser ferait d'une panne
     de réseau une panne de session jusqu'au prochain déploiement. */
  pending.catch(() => discovered.delete(provider));

  return pending;
}

function client(provider: ProviderId): oauth.Client {
  return { client_id: required(PROVIDERS[provider].clientIdEnv) };
}

function clientAuth(provider: ProviderId): oauth.ClientAuth {
  return oauth.ClientSecretPost(required(PROVIDERS[provider].clientSecretEnv));
}

/* ==========================================================================
   L'aller
   ========================================================================== */

/**
 * L'adresse d'autorisation et ce qu'il faut retenir pour le retour.
 *
 * `state`, `nonce` et le vérificateur PKCE sont tirés par `oauth4webapi` ; ils
 * repartent dans le cookie scellé de l'aller-retour, jamais dans une mémoire
 * de serveur — un déploiement sans état ne retrouverait pas la sienne.
 */
export async function beginAuthorization(
  provider: ProviderId,
): Promise<{ url: string; handshake: Handshake }> {
  const as = await authorizationServer(provider);

  if (!as.authorization_endpoint) {
    throw new ProviderConfigError(
      `Le document de découverte de ${PROVIDERS[provider].label} ne porte ` +
        "aucun `authorization_endpoint`.",
    );
  }

  const codeVerifier = oauth.generateRandomCodeVerifier();
  const handshake: Handshake = {
    provider,
    state: oauth.generateRandomState(),
    nonce: oauth.generateRandomNonce(),
    codeVerifier,
  };

  const url = new URL(as.authorization_endpoint);
  url.searchParams.set("client_id", client(provider).client_id);
  url.searchParams.set("redirect_uri", callbackUrl(provider));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPE);
  url.searchParams.set("state", handshake.state);
  url.searchParams.set("nonce", handshake.nonce);
  url.searchParams.set(
    "code_challenge",
    await oauth.calculatePKCECodeChallenge(codeVerifier),
  );
  url.searchParams.set("code_challenge_method", "S256");

  return { url: url.toString(), handshake };
}

/* ==========================================================================
   Le retour
   ========================================================================== */

/**
 * Ce qu'un jeton vérifié apprend à Vision, et rien de plus.
 *
 * `enterprise` est le `hd` ou le `tid` — **l'entreprise vérifiée par le
 * fournisseur**, `null` pour un compte grand public. C'est la seule valeur sur
 * laquelle un rattachement se fait.
 */
export type VerifiedClaims = {
  provider: ProviderId;
  /** `sub` chez Google, `oid` chez Microsoft : l'identifiant stable de la personne. */
  subject: string;
  email: string | null;
  enterprise: string | null;
};

/**
 * Lit le `tid` d'une charge de jeton **sans la vérifier**, pour en dériver
 * l'émetteur attendu (voir `tenantScopedIssuer`). Ce que cette lecture rend
 * n'est jamais cru : il sert d'*attente*, que la vérification confronte
 * ensuite à la signature et au claim `iss`.
 */
function untrustedTenantId(idToken: string): string | null {
  const body = idToken.split(".")[1];
  if (!body) return null;

  try {
    const payload: unknown = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    );
    if (typeof payload !== "object" || payload === null) return null;
    const { tid } = payload as { tid?: unknown };
    return typeof tid === "string" ? tid : null;
  } catch {
    return null;
  }
}

export class AuthorizationError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "AuthorizationError";
  }
}

/**
 * Échange le code, vérifie le jeton d'identité, rend les claims.
 *
 * Toute anomalie lève : un rappel qui n'aboutit pas ne rend **jamais** des
 * claims partiels, sur lesquels les règles d'entrée statueraient ensuite.
 */
export async function completeAuthorization(
  provider: ProviderId,
  parameters: URLSearchParams,
  handshake: Handshake,
): Promise<VerifiedClaims> {
  if (handshake.provider !== provider) {
    throw new AuthorizationError(
      "Le fournisseur du rappel n'est pas celui de l'aller.",
    );
  }

  const record = PROVIDERS[provider];
  const discoveredAs = await authorizationServer(provider);
  const as = client(provider);

  let checked: URLSearchParams;
  try {
    checked = oauth.validateAuthResponse(
      discoveredAs,
      as,
      parameters,
      handshake.state,
    );
  } catch (cause) {
    throw new AuthorizationError("La réponse d'autorisation est invalide.", {
      cause,
    });
  }

  const response = await oauth.authorizationCodeGrantRequest(
    discoveredAs,
    as,
    clientAuth(provider),
    checked,
    callbackUrl(provider),
    handshake.codeVerifier,
  );

  /* L'émetteur attendu — le seul endroit où les deux fournisseurs diffèrent.
     Chez Google c'est celui de la découverte ; chez Microsoft on le dérive du
     `tid` non vérifié, et la vérification s'en charge juste après. */
  let server = discoveredAs;
  if (record.tenantScopedIssuer) {
    const raw = response.clone();
    const body = (await raw.json().catch(() => null)) as {
      id_token?: unknown;
    } | null;
    const tenantId =
      typeof body?.id_token === "string"
        ? untrustedTenantId(body.id_token)
        : null;

    if (!tenantId) {
      throw new AuthorizationError(
        "Le jeton d'identité ne porte aucun `tid` : il ne vient pas d'un " +
          "annuaire d'organisation.",
      );
    }

    server = {
      ...discoveredAs,
      issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
    };
  }

  let result: oauth.TokenEndpointResponse;
  try {
    result = await oauth.processAuthorizationCodeResponse(
      server,
      as,
      response,
      {
        expectedNonce: handshake.nonce,
        requireIdToken: true,
      },
    );
  } catch (cause) {
    throw new AuthorizationError("Le jeton d'identité est refusé.", { cause });
  }

  const claims = oauth.getValidatedIdTokenClaims(result);
  if (!claims) {
    throw new AuthorizationError("Aucun jeton d'identité dans la réponse.");
  }

  /* `oid` chez Microsoft : `sub` y est propre au couple (application,
     locataire), quand `oid` désigne la personne dans l'annuaire — c'est lui
     que `persons.external_id` retiendra. */
  const subject =
    typeof claims.oid === "string" && claims.oid.length > 0
      ? claims.oid
      : claims.sub;

  /* Un e-mail non vérifié n'est pas un e-mail : la règle d'entrée 6 s'en sert
     pour rapprocher une personne au premier passage, et la règle 2 pour
     reconnaître un super administrateur. */
  const emailVerified = claims.email_verified;
  const email =
    typeof claims.email === "string" && emailVerified !== false
      ? claims.email
      : null;

  const enterprise = claims[record.enterpriseClaim];

  return {
    provider,
    subject,
    email,
    enterprise:
      typeof enterprise === "string" && enterprise.length > 0
        ? enterprise
        : null,
  };
}
