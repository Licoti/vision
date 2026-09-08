"use server";

/**
 * Les écritures de l'écran au-dessus des domaines — T9.4.
 *
 * **Le droit, d'abord, sur ce qui est reçu.** Chaque action appelle
 * `requireSuperAdmin()`, qui **relit la ligne `super_admins` à chaque requête** :
 * un super administrateur archivé perd son droit au passage suivant, jamais au
 * bout d'un mois de cookie. Puis la couche relit encore, avant chaque écriture
 * de `domains` — deux barrières, et elles ne se remplacent pas. *Le droit
 * s'éprouve par l'action, jamais par l'écran.*
 *
 * **Deux portes, et elles ne se confondent pas.** Ce qui touche `domains` passe
 * par `asSuperAdmin(grant)` ; ce qui touche `domain_identities` et `persons`
 * passe par `forDomain({ domainId })` — c'est ce que T9.1 a décidé au-dessus de
 * la table : *« qui saisit une identité connaît déjà le domaine auquel il la
 * rattache. »* L'autorité y est prouvée en amont, par la même relecture.
 *
 * **La création écrit dix tables sans transaction** — `neon-http` n'en offre
 * pas (dette de T3.6). La parade est celle que T3.6 a posée : *tout se
 * confronte avant d'écrire*. Une course peut encore la perdre ; c'est pourquoi
 * un domaine sans identité **se lit dans la liste et se répare par un geste**,
 * plutôt que de rester invisible.
 *
 * **L'amorçage vient en dernier, et il n'a pas ce filet** (T9.5) : une panne
 * après l'identité laisserait une entreprise aux référentiels partiels, qu'aucun
 * geste de cet écran ne complète — `npm run db:seed` ne vise que le domaine de
 * démonstration. Le rapprochement de T8.4 rend pourtant le geste **rejouable**
 * sans rien doubler : ce qui manque est ce qu'un second passage créerait. Le
 * fait est consigné au journal plutôt que contourné, et il se referme avec la
 * dette de T3.6 — *le jour où le pilote exposera la transaction interactive*.
 *
 * **Aucun journal sur les gestes de domaine**, et c'est une contrainte, pas un
 * oubli : `domains` n'est pas un `event_target_type`, et en ajouter un serait
 * une migration — signal d'arrêt des interdits communs de C9. La désignation du
 * premier responsable, elle, écrit sa ligne : `person` est déjà un
 * `event_target_type`, et l'acteur y est nul — ce que l'écran rend alors est
 * « l'amorçage », qui est exactement ce dont il s'agit.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";

import {
  invitationExpiry,
  invitationLink,
  InvitationLinkError,
  newInvitationToken,
} from "@/lib/auth/invitation";
import { AUTH_ROUTES } from "@/lib/auth/provider";
import { getSuperAdmin, requireSuperAdmin } from "@/lib/auth/super-admin";
import { bootstrapReferentials } from "@/lib/db/bootstrap";
import { createReconciler } from "@/lib/db/reconcile";
import {
  asSuperAdmin,
  forDomain,
  superAdmin,
  type SuperAdminGrant,
} from "@/lib/db/scoped";
import { domainIdentities, invitations, persons } from "@/lib/db/schema";
import type { ConfirmState } from "@/components/ui/confirm-panel";
import {
  addressDomainsOf,
  parseDomainForm,
  parseDomainIdentityForm,
  readDomainIdentityForm,
  type DomainFormState,
  type DomainIdentityFormState,
} from "@/lib/forms/domain";
import {
  parseDomainManagerForm,
  readDomainManagerForm,
  type DomainManagerFormState,
} from "@/lib/forms/domain-manager";
import { objectPhrase } from "@/lib/journal";
import { sendInvitationMail } from "@/lib/mail/send";
import { ROUTES } from "@/lib/navigation";
import { isUuid } from "@/lib/uuid";

/* ==========================================================================
   Les refus, et la porte
   ========================================================================== */

const GONE = "Cette entreprise n'existe plus.";

const TAKEN =
  "Cette identité vérifiée est déjà rattachée à une entreprise. Une même entreprise ne peut pas ouvrir sur deux domaines.";

const ALREADY_STAFFED =
  "Cette entreprise a déjà un compte. Les suivants se désignent depuis l'intérieur, par son responsable de domaine.";

/**
 * **L'extension d'`ALREADY_STAFFED`** (T11.4), et elle porte son propre mot.
 *
 * Un domaine dont l'invitation est en attente n'accepte pas une seconde
 * désignation : deux liens ouvriraient le même premier compte, et n'en révoquer
 * qu'un laisserait l'autre valide. Le refus **dit le geste qui le débloque** —
 * révoquer, puis redésigner —, comme le sixième refus d'`invitePerson`.
 */
const ALREADY_INVITED =
  "Une invitation est déjà en attente pour cette entreprise : son premier compte s'ouvrira quand la personne l'aura acceptée. Révoquez-la depuis la liste avant d'en désigner un autre.";

const NO_HOST =
  "L'adresse publique de Vision n'est pas configurée sur cet environnement : le lien d'invitation n'aurait mené nulle part, et rien n'a été enregistré.";

/**
 * L'écran ne revalide qu'une adresse — la sienne.
 *
 * **Il n'en touche aucune autre, et c'est l'interdit du ticket** : cet écran
 * administre des domaines, il ne les traverse pas. Revalider une page de produit
 * supposerait qu'il en connaisse une.
 */
function revalidate(): void {
  revalidatePath(ROUTES.domains);
}

/**
 * L'autorité, **et le nom de qui invite** (T11.4).
 *
 * **Ce n'est pas une seconde barrière**, et ce n'en est pas non plus une
 * seconde lecture : `requireSuperAdmin()` vient d'appeler `getSuperAdmin()`,
 * que `cache()` mémorise pour la durée du rendu. Le nom coûte donc zéro
 * requête, et il n'est pas décoratif — *un message sans expéditeur nommé se lit
 * comme un hameçonnage* (`lib/mail/send.ts`).
 *
 * **Le repli redirige plutôt que d'inventer un nom.** Si la ligne avait disparu
 * entre deux instructions, l'autorité n'existerait plus : on repart alors par où
 * `requireSuperAdmin()` serait passé, jamais avec un expéditeur vide.
 */
async function openInviter(): Promise<{
  grant: SuperAdminGrant;
  inviterName: string;
}> {
  const grant = await requireSuperAdmin();

  const admin = await getSuperAdmin();
  if (!admin) redirect(AUTH_ROUTES.entry);

  return { grant, inviterName: admin.fullName };
}

/**
 * L'autorité, puis l'entreprise visée.
 *
 * **La forme de l'identifiant se vérifie avant la base** : une colonne `uuid`
 * interrogée avec n'importe quoi rend un 500, pas un 404.
 */
async function openDomain(domainId: string): Promise<
  | {
      grant: SuperAdminGrant;
      inviterName: string;
      name: string;
      archivedAt: Date | null;
    }
  | null
> {
  const { grant, inviterName } = await openInviter();
  if (!isUuid(domainId)) return null;

  const domain = await superAdmin.findDomain(domainId);
  if (!domain) return null;

  return {
    grant,
    inviterName,
    name: domain.name,
    archivedAt: domain.archivedAt,
  };
}

/* ==========================================================================
   L'amorçage d'un premier administrateur — T11.4
   ========================================================================== */

/** Ce qu'il faut tenir avant d'écrire quoi que ce soit : l'empreinte, le lien, la date. */
type PreparedInvitation = {
  tokenHash: string;
  link: string;
  expiresAt: Date;
};

/**
 * Le jeton et son lien, **construits avant la première écriture**.
 *
 * C'est le geste d'`invitePerson`, et pour la même raison : un `AUTH_URL` absent
 * doit refuser le geste, jamais laisser derrière lui une invitation dont
 * personne ne saurait dire l'adresse. Rend `null` dans ce seul cas ; l'appelant
 * en fait un message, comme il fait un message d'un doublon d'identité.
 *
 * **Le clair ne descend jamais en base** : `newInvitationToken` rend les deux
 * formes, et seule l'empreinte est écrite (T11.1).
 */
function prepareInvitation(): PreparedInvitation | null {
  const { token, tokenHash } = newInvitationToken();

  try {
    return {
      tokenHash,
      link: invitationLink(token),
      expiresAt: invitationExpiry(),
    };
  } catch (error) {
    if (error instanceof InvitationLinkError) return null;
    throw error;
  }
}

/**
 * La personne, l'invitation, la trace, le courriel — **dans cet ordre**, et il
 * n'est pas indifférent.
 *
 * **L'administrateur naît sans accès** (arbitrage (9)) : ni `has_access`, ni
 * `domain_role`, et `persons_role_requires_access` est satisfaite par les deux
 * moitiés nulles. C'est l'acceptation du lien qui pose le couple — *un accès qui
 * n'a jamais servi n'existe pas*. **Contrepartie nommée** : entre la
 * désignation et le premier clic, le domaine n'a aucun administrateur, et
 * `/domaines` le dit.
 *
 * **`kind` vaut `center` et `source` vaut `manual`** : un intervenant côté
 * entité ne reçoit jamais d'accès (`docs/05` §4, D2), et
 * `persons_external_id_requires_directory` interdit un `external_id` hors
 * annuaire — c'est le fournisseur qui le rendra au premier passage.
 *
 * **Aucune transaction ne couvre ces écritures** — `neon-http` n'en offre pas
 * (dette de T3.6) —, d'où l'ordre : ce qui compte d'abord, la datation ensuite.
 * Le pire des ordres possibles serait un courriel parti sur une invitation que
 * rien n'aurait enregistrée.
 *
 * **Rend `sent`**, jamais une levée : `sendInvitationMail` ne lève pas, et un
 * envoi raté ne défait rien — le lien s'affiche et se transmet à la main
 * (T11.3).
 */
async function inviteFirstManager(
  scope: ReturnType<typeof forDomain>,
  domain: { name: string; inviterName: string },
  manager: { fullName: string; email: string },
  prepared: PreparedInvitation,
): Promise<boolean> {
  const created = await scope.insert(persons, {
    fullName: manager.fullName,
    email: manager.email,
    source: "manual",
    kind: "center",
  });

  const invitation = await scope.insert(invitations, {
    personId: created.id,
    /* **L'adresse est copiée, pas jointe** (T11.1) : corriger le profil ensuite
       ne doit pas déplacer la cible d'un lien déjà parti. */
    email: manager.email,
    /* **Le rôle n'est pas un champ, il est le geste** : un membre sans droit
       d'écriture ne pourrait ni gérer les référentiels, ni désigner personne, et
       le domaine resterait inadministrable. */
    role: "domain_manager",
    tokenHash: prepared.tokenHash,
    expiresAt: prepared.expiresAt,
  });

  /* L'acteur est nul — un super administrateur n'a pas de ligne `persons`, et
     `record` pose l'acteur depuis le contexte. L'écran lit alors
     « l'amorçage », ce qui est exactement ce dont il s'agit. */
  await scope.record({
    verb: "created",
    targetType: "person",
    targetId: created.id,
    summary: objectPhrase("person", "created", created.fullName),
  });

  const sent = await sendInvitationMail({
    to: manager.email,
    domainName: domain.name,
    inviterName: domain.inviterName,
    role: "domain_manager",
    expiresAt: prepared.expiresAt,
    link: prepared.link,
  });

  if (sent) {
    await scope.update(invitations, invitation.id, { sentAt: new Date() });
  }

  return sent;
}

/** Une invitation vivante attend-elle dans ce domaine ? */
async function pendingInvitations(scope: ReturnType<typeof forDomain>) {
  return scope.list(invitations, {
    where: and(
      isNull(invitations.acceptedAt),
      isNull(invitations.revokedAt),
    ),
  });
}

/* ==========================================================================
   L'entreprise
   ========================================================================== */

/**
 * Créer une entreprise cliente — **et son premier administrateur** (T11.4).
 *
 * **Un seul formulaire, là où il y en avait deux.** Le geste écrit **quatre
 * tables** — `domains`, `domain_identities`, `persons`, `invitations` — et
 * **il n'est pas atomique** : `neon-http` n'a pas de transaction interactive
 * (dette de T3.6). **Tout se confronte donc avant la première écriture**, du
 * plus contraignant au moins : la règle d'adresse (dans le module pur), puis
 * l'hôte du lien, puis l'unicité de l'identité, puis le reste.
 *
 * **Elle ne rend pas `ok`, et ce n'est pas un oubli** : `ok` referme le panneau
 * (TD.2) et emporterait avec lui la seule occurrence en clair du jeton, dont
 * Vision ne garde que l'empreinte (T11.1). Le panneau reste ouvert sur le lien
 * qu'il vient de créer — écart nommé au patron de TD.2, déjà pris en T11.2.
 */
export async function createDomain(
  _previous: DomainFormState,
  formData: FormData,
): Promise<DomainFormState> {
  const { grant, inviterName } = await openInviter();

  const { values, errors, input } = parseDomainForm(formData);
  if (!input) return { values, errors };

  /* **Le lien avant l'écriture** : sans hôte, rien n'est enregistré du tout —
     ni entreprise, ni identité, ni personne. */
  const prepared = prepareInvitation();
  if (!prepared) return { values, errors: {}, message: NO_HOST };

  /* **La confrontation précède l'écriture**, faute de transaction : sans elle,
     un couple déjà pris ferait échouer la seconde écriture après que la
     première a créé le domaine. C'est le geste de T3.6, appliqué ici. */
  const taken = await superAdmin.findDomainIdentity(
    input.provider,
    input.identityValue,
  );
  if (taken) return { values, errors: { identityValue: TAKEN } };

  const domain = await asSuperAdmin(grant).createDomain({
    name: input.name,
    competenceCenterName: input.competenceCenterName,
    description: input.description,
  });

  const scope = forDomain({ domainId: domain.id });

  /* La course reste possible, et la base tranche : `domain_identities_provider_
     value_unique` refuserait le doublon. L'entreprise existerait alors sans
     identité — état visible dans la liste, et réparable par un geste. */
  await scope.insert(domainIdentities, {
    provider: input.provider,
    value: input.identityValue,
  });

  /* **L'amorçage, et c'est tout T9.5.** `docs/04` §2 : *« créer un domaine
     déclenche l'amorçage de ses référentiels par défaut. »* Huit référentiels,
     les mêmes que ceux de `npm run db:seed` — et **aucune donnée factice** :
     les entités sont les divisions de l'entreprise, elles se saisissent, et
     l'écran qui les attend porte déjà son état vide. Les outils naissent sans
     adresse, qui appartient au client. */
  await bootstrapReferentials(scope, createReconciler());

  const sent = await inviteFirstManager(
    scope,
    { name: input.name, inviterName },
    input.manager,
    prepared,
  );

  revalidate();
  return { values, errors: {}, link: prepared.link, sent };
}

export async function suspendDomain(
  domainId: string,
  _previous: ConfirmState,
  _formData: FormData,
): Promise<ConfirmState> {
  const opened = await openDomain(domainId);
  if (!opened) return { message: GONE };

  const updated = await asSuperAdmin(opened.grant).setDomainStatus(
    domainId,
    "suspended",
  );
  if (!updated) return { message: GONE };

  revalidate();
  return { ok: true };
}

/** Le geste inverse — muet, comme tout ce qui défait (patron de `restoreEntity`). */
export async function resumeDomain(domainId: string): Promise<void> {
  const opened = await openDomain(domainId);
  if (!opened) return;

  await asSuperAdmin(opened.grant).setDomainStatus(domainId, "active");
  revalidate();
}

export async function archiveDomain(
  domainId: string,
  _previous: ConfirmState,
  _formData: FormData,
): Promise<ConfirmState> {
  const opened = await openDomain(domainId);
  if (!opened) return { message: GONE };

  /* Déjà rangée : rien, et rien à dire — le patron d'`archiveEntity`. */
  if (opened.archivedAt) return {};

  await asSuperAdmin(opened.grant).archiveDomain(domainId);

  revalidate();
  return { ok: true };
}

export async function restoreDomain(domainId: string): Promise<void> {
  const opened = await openDomain(domainId);
  if (!opened) return;

  await asSuperAdmin(opened.grant).restoreDomain(domainId);
  revalidate();
}

/* ==========================================================================
   Les identités vérifiées
   ========================================================================== */

export async function addDomainIdentity(
  domainId: string,
  _previous: DomainIdentityFormState,
  formData: FormData,
): Promise<DomainIdentityFormState> {
  const opened = await openDomain(domainId);
  if (!opened) {
    return { values: readDomainIdentityForm(formData), errors: {}, message: GONE };
  }

  const { values, errors, input } = parseDomainIdentityForm(formData);
  if (!input) return { values, errors };

  const taken = await superAdmin.findDomainIdentity(input.provider, input.value);
  if (taken) return { values, errors: { value: TAKEN } };

  await forDomain({ domainId }).insert(domainIdentities, {
    provider: input.provider,
    value: input.value,
  });

  revalidate();
  return { values, errors: {}, ok: true };
}

/**
 * Retirer une identité — **jamais la dernière**.
 *
 * **Le décompte se refait ici**, et non à l'écran : le panneau retire le bouton
 * quand il n'en reste qu'une, mais un bouton absent du rendu n'a jamais protégé
 * le point d'entrée qui l'accompagne. Sans cette condition, une entreprise
 * deviendrait inatteignable — aucun jeton ne la désignerait plus, et **rien dans
 * Vision ne permettrait de la rouvrir de l'intérieur**.
 *
 * Muet, comme tout ce qui se défait : une identité retirée se ressaisit.
 */
export async function removeDomainIdentity(
  domainId: string,
  identityId: string,
): Promise<void> {
  const opened = await openDomain(domainId);
  if (!opened || !isUuid(identityId)) return;

  const scope = forDomain({ domainId });

  const remaining = await scope.count(domainIdentities);
  if (remaining <= 1) return;

  await scope.unlink(domainIdentities, identityId);
  revalidate();
}

/* ==========================================================================
   Le premier responsable
   ========================================================================== */

/**
 * Le geste sans lequel une entreprise créée reste close — **la redésignation**.
 *
 * **Depuis T11.4, la création le fait elle-même** : ce chemin-ci sert aux
 * entreprises créées avant ce ticket, et à celles dont l'invitation a été
 * révoquée parce que la personne n'est jamais venue. C'est le seul chemin de
 * rattrapage, et il est explicite.
 *
 * **Il n'ouvre qu'une fois.** Une fois un compte posé, la suite se passe à
 * l'intérieur du domaine : c'est le responsable désigné qui désigne les
 * suivants, `docs/02` §3 lui donnant *« gérer les référentiels et les
 * membres »*. Le super administrateur amorce, il n'entre pas dans les
 * entreprises.
 *
 * **Deux refus, et le second est l'extension de T11.4** : un compte vivant, ou
 * une invitation en attente. Sans le second, deux liens ouvriraient le même
 * premier compte, et n'en révoquer qu'un laisserait l'autre valide.
 *
 * **La règle d'adresse porte sur les identités du domaine**, et non sur une
 * saisie : l'entreprise en porte déjà au moins une, et l'adresse doit relever de
 * l'une d'elles (arbitrage (11)).
 */
export async function designateDomainManager(
  domainId: string,
  _previous: DomainManagerFormState,
  formData: FormData,
): Promise<DomainManagerFormState> {
  const opened = await openDomain(domainId);
  if (!opened) {
    return { values: readDomainManagerForm(formData), errors: {}, message: GONE };
  }

  const identities = await asSuperAdmin(opened.grant).listDomainIdentities(
    domainId,
  );

  const { values, errors, input } = parseDomainManagerForm(
    formData,
    addressDomainsOf(identities),
  );
  if (!input) return { values, errors };

  const scope = forDomain({ domainId });

  /* **La condition se refait sur ce qui est reçu**, et elle est la même que
     celle qui décide de rendre le panneau. `hasAccess` et `archivedAt` suivent
     `loadSession` : un compte archivé n'ouvre pas de session, il ne compte donc
     pas comme un compte. */
  const staffed = await scope.count(persons, {
    where: eq(persons.hasAccess, true),
  });
  if (staffed > 0) return { values, errors: {}, message: ALREADY_STAFFED };

  /* **Le décompte porte sur les vivantes**, c'est-à-dire sur l'expression même
     de l'index partiel. **Une invitation périmée compte encore** : le lien est
     mort, la ligne est vivante, et l'index la retiendrait — la révoquer est donc
     le geste, et le refus le dit. */
  const pending = await pendingInvitations(scope);
  if (pending.length > 0) {
    return { values, errors: {}, message: ALREADY_INVITED };
  }

  const prepared = prepareInvitation();
  if (!prepared) return { values, errors: {}, message: NO_HOST };

  const sent = await inviteFirstManager(
    scope,
    { name: opened.name, inviterName: opened.inviterName },
    input,
    prepared,
  );

  revalidate();
  return { values, errors: {}, link: prepared.link, sent };
}

/**
 * Révoquer l'invitation d'amorçage — **une date de plus sur la ligne**, jamais
 * un effacement (règle 4).
 *
 * **Sans ce geste, une entreprise dont l'administrateur ne vient jamais serait
 * close pour de bon** : rien ne révoquerait son invitation, `ALREADY_INVITED`
 * refuserait toute redésignation, et le geste de révocation du produit
 * (`revokeInvitation`, `/equipe`) demande une session **dans** le domaine — que
 * personne ne peut ouvrir tant qu'aucun compte n'existe. Décision humaine du
 * 08/09/2026 ; l'attendu de la fiche ne le nommait pas, sa mesure 3 l'exige.
 *
 * **Il se refuse dès qu'un compte vivant existe**, et c'est la même frontière
 * que partout ailleurs sur cet écran : à partir de là, la suite se passe à
 * l'intérieur du domaine, par son responsable. Le super administrateur amorce,
 * il n'administre pas les invitations d'une entreprise ouverte.
 *
 * **Toutes les vivantes sont révoquées, pas la première venue.** L'état ne peut
 * en porter qu'une — sans compte, seul l'amorçage écrit une invitation —, mais
 * *n'en révoquer qu'une laisserait l'autre valide* : un `limit 1` sans ordre
 * choisirait, là où le geste doit refermer.
 *
 * **Muet, comme tout ce qui se défait** : c'est le patron de `resumeDomain` et
 * de `removeDomainIdentity`. Le décompte **se refait ici** — une entrée de menu
 * absente du rendu n'a jamais protégé le point d'entrée HTTP qui l'accompagne.
 */
export async function revokeDomainInvitation(domainId: string): Promise<void> {
  const opened = await openDomain(domainId);
  if (!opened) return;

  const scope = forDomain({ domainId });

  const staffed = await scope.count(persons, {
    where: eq(persons.hasAccess, true),
  });
  if (staffed > 0) return;

  const pending = await pendingInvitations(scope);
  if (pending.length === 0) return;

  const revokedAt = new Date();
  for (const invitation of pending) {
    await scope.update(invitations, invitation.id, { revokedAt });
  }

  revalidate();
}
