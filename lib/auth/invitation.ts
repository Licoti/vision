/**
 * L'invitation — la fabriquer, et l'accepter.
 *
 * **Le jeton n'authentifie jamais** (arbitrage (1) de `tickets-C11.md`). Il
 * transporte une intention que le SSO vient valider : un lien magique aurait
 * fait d'une boîte mail la clé des données d'une entreprise cliente, et créé un
 * second chemin à sécuriser en parallèle du premier. C'est ce qui permet à ce
 * module de ne pas toucher `lib/auth/entry.ts`.
 *
 * **L'acceptation vient après `resolvePrincipal`, jamais avant** (arbitrage
 * (4)). Les six règles d'entrée statuent d'abord, et l'invitation ne peut
 * réparer **qu'un seul** de leurs sept refus : `no_access`. Il en découle trois
 * propriétés qu'aucune ligne d'ici n'a à porter — aucune personne ne naît à la
 * volée (`docs/04` §7), aucun domaine non client ne s'ouvre (règle d'entrée 5),
 * personne d'archivé ne ressuscite. **C'est le callback qui tient cet ordre**,
 * et le test qui le déplace est celui qui le prouve.
 *
 * **Pur au sens d'`entry.ts`** : pas de Next, pas de réseau. Ce module reçoit
 * des *claims déjà vérifiés* et un jeton, et rend un principal ou un refus —
 * si bien que ses sept refus se mesurent sur claims forgés, séparément, sans
 * connexion réelle. La base, elle, est du ressort de `lib/db/scoped.ts`, comme
 * pour les six règles d'entrée.
 *
 * **La cause d'un refus ne sort jamais d'ici.** Elle nomme le test qui
 * l'éprouve ; la page d'invitation dit la même chose dans les quatre cas
 * qu'elle connaît, et le callback ramène à l'écran d'entrée dans les sept —
 * un refus qui distingue ses causes est un oracle offert à qui frappe.
 */

import { createHash, randomBytes } from "node:crypto";

import type { Principal } from "./cookie";
import type { VerifiedClaims } from "./oidc";
import { resolveDomainId } from "./session";
import { forDomain, superAdmin } from "../db/scoped";
import { invitations, persons } from "../db/schema";

/* ==========================================================================
   Le jeton
   ========================================================================== */

/**
 * Sept jours — arbitrage (7), et la valeur est écrite **une seule fois**.
 *
 * Assez pour une semaine de congés, trop court pour qu'un lien oublié dans une
 * boîte reste une porte.
 */
export const INVITATION_TTL_DAYS = 7;

/**
 * Trente-deux octets, et c'est la seule fois où le jeton existe en clair.
 *
 * **Rien ne le stocke** : `invitations` n'a aucune colonne `token`, et seule
 * l'empreinte descend en base (T11.1). Le clair remonte à l'appelant, qui
 * l'affiche une fois — le perdre demande de révoquer et de réinviter, ce que le
 * panneau dit avant le clic.
 *
 * `randomBytes` et non `randomUUID` : un UUID v4 porte 122 bits d'aléa et six
 * bits de version, quand un jeton d'entrée n'a aucune raison d'en annoncer
 * moins que 256.
 */
export function newInvitationToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashInvitationToken(token) };
}

/**
 * L'empreinte, et **l'unique forme sous laquelle la base connaît un lien**.
 *
 * SHA-256 nu, sans sel : le jeton porte déjà 256 bits d'aléa, il n'y a rien à
 * ralentir — un sel et un dérivateur lent protègent un secret *devinable*, ce
 * qu'un mot de passe est et qu'un jeton de 32 octets n'est pas.
 */
export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** La péremption d'un lien créé maintenant. `now` s'injecte pour les tests. */
export function invitationExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export class InvitationLinkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvitationLinkError";
  }
}

/**
 * Le lien qu'on transmet, **construit une seule fois et au même endroit**.
 *
 * C'est la règle de `callbackUrl` (`lib/auth/oidc.ts`), et pour un motif
 * voisin : deux constructions d'une même adresse sont deux occasions de
 * diverger. `AUTH_URL` est déjà la valeur qui dit *où Vision répond* — s'en
 * donner une seconde ferait porter à un environnement deux vérités sur
 * lui-même.
 *
 * **Elle lève plutôt que de rendre un chemin relatif.** Un lien sans hôte se
 * colle dans un message et n'y mène nulle part : le silence coûterait ici
 * exactement ce que le lien sert à éviter. L'appelant rattrape et rend un
 * message, comme il rattrape `DomainScopeError`.
 */
export function invitationLink(token: string): string {
  const base = process.env.AUTH_URL;
  if (!base) {
    throw new InvitationLinkError(
      "AUTH_URL est absente : le lien d'invitation n'a pas d'hôte, et un lien " +
        "sans hôte ne mène nulle part. La poser dans .env.local.",
    );
  }

  return new URL(`/invitation/${token}`, base).toString();
}

/* ==========================================================================
   L'acceptation
   ========================================================================== */

/**
 * Pourquoi le lien n'a pas ouvert. **Sept causes, et elles s'isolent** — c'est
 * la forme de `RefusalCause` (`entry.ts`), pour la même raison : une cause qui
 * se confondrait avec une autre ne pourrait pas se mettre en défaut seule.
 */
export type RedeemRefusal =
  /** Aucune ligne ne porte cette empreinte : jeton inventé, ou déjà remplacé. */
  | "unknown"
  /** Le lien a été révoqué — le geste explicite qui précède une réinvitation. */
  | "revoked"
  /** Il a déjà servi. **Un lien vaut une fois**, et `accepted_at` en est la trace. */
  | "already_accepted"
  /** Les sept jours sont passés (arbitrage 7). */
  | "expired"
  /** L'e-mail **vérifié** par le fournisseur n'est pas celui qu'on a invité. */
  | "email_mismatch"
  /** L'entreprise du jeton ne désigne pas le domaine de l'invitation. */
  | "domain_mismatch"
  /** La personne visée a été archivée ou désactivée depuis l'envoi. */
  | "person_unavailable";

export type RedeemOutcome =
  | { granted: Principal; refused?: undefined }
  | { granted?: undefined; refused: RedeemRefusal };

/**
 * Accepte une invitation, ou dit pourquoi elle ne s'accepte pas.
 *
 * **L'ordre est celui des causes, du lien vers la personne** : ce que le jeton
 * désigne, puis ce que le jeton vaut, puis à qui il appartient, puis où il
 * mène, puis qui l'attend. Chaque étape se neutralise seule.
 *
 * **L'e-mail se confronte à celui de l'invitation, pas à celui de la ligne
 * `persons`.** `invitations.email` est **copié** au moment du geste (T11.1) :
 * corriger un profil ensuite ne doit pas déplacer la cible d'un lien déjà
 * parti. Une adresse qui change se traite en révoquant et en refaisant.
 *
 * **Le domaine se réinterroge, il ne se déduit pas du principal.** Le callback
 * n'appelle ce module que sur `no_access`, et `resolvePrincipal` ne rend alors
 * aucun domaine : le rattachement se refait donc ici, sur le `hd` **vérifié** et
 * lui seul — *le domaine vient du jeton, et de lui seul*, jamais de la ligne
 * qu'on vient de lire.
 *
 * **Deux écritures, et la première est le couple.**
 * `persons_role_requires_access` refuse *accès sans rôle* comme *rôle sans
 * accès* : les poser en deux instructions serait, entre les deux, une ligne que
 * la base refuse — et `neon-http` n'a pas de transaction pour la couvrir (dette
 * de T3.6). La datation d'`accepted_at` suit ; si elle échoue, l'accès est
 * ouvert et le lien reste vivant, ce qui est le moins grave des deux ordres
 * possibles — l'inverse aurait consommé un lien sans ouvrir l'accès.
 */
export async function redeemInvitation(
  token: string,
  claims: VerifiedClaims,
  now: Date = new Date(),
): Promise<RedeemOutcome> {
  /* La lecture de T11.1 — **la troisième qui précède le domaine**. Elle ne juge
     de rien, et c'est ce qui permet aux causes ci-dessous d'exister. */
  const invitation = await superAdmin.findInvitationByTokenHash(
    hashInvitationToken(token),
  );
  if (!invitation) return { refused: "unknown" };

  if (invitation.revokedAt) return { refused: "revoked" };
  if (invitation.acceptedAt) return { refused: "already_accepted" };
  if (invitation.expiresAt.getTime() <= now.getTime()) {
    return { refused: "expired" };
  }

  /* `claims.email` est nul quand le fournisseur ne l'a pas **vérifié**
     (`oidc.ts`) : une adresse non vérifiée ne rapproche rien, et l'absence se
     refuse ici plutôt que de comparer une valeur qui n'existe pas. */
  if (
    !claims.email ||
    claims.email.toLowerCase() !== invitation.email.toLowerCase()
  ) {
    return { refused: "email_mismatch" };
  }

  if (!claims.enterprise) return { refused: "domain_mismatch" };

  const domainId = await resolveDomainId({
    provider: claims.provider,
    value: claims.enterprise,
  });
  if (!domainId || domainId !== invitation.domainId) {
    return { refused: "domain_mismatch" };
  }

  /* **La ligne se relit dans son domaine**, et par `forDomain` : la clé
     étrangère de `invitations.person_id` ignore le domaine, la couche non
     (règle 1). Les archivées sont lues pour que le refus porte sa cause —
     la leçon de `findPerson`. */
  const scope = forDomain({ domainId: invitation.domainId });
  const person = await scope.find(persons, invitation.personId);
  if (!person || person.archivedAt || !person.isActive) {
    return { refused: "person_unavailable" };
  }

  await scope.update(persons, person.id, {
    hasAccess: true,
    domainRole: invitation.role,
  });

  await scope.update(invitations, invitation.id, { acceptedAt: now });

  return {
    granted: {
      kind: "person",
      personId: person.id,
      domainId: invitation.domainId,
    },
  };
}
