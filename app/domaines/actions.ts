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
import { eq } from "drizzle-orm";

import { requireSuperAdmin } from "@/lib/auth/super-admin";
import { bootstrapReferentials } from "@/lib/db/bootstrap";
import { createReconciler } from "@/lib/db/reconcile";
import {
  asSuperAdmin,
  forDomain,
  superAdmin,
  type SuperAdminGrant,
} from "@/lib/db/scoped";
import { domainIdentities, persons } from "@/lib/db/schema";
import type { ConfirmState } from "@/components/ui/confirm-panel";
import {
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
 * L'autorité, puis l'entreprise visée.
 *
 * **La forme de l'identifiant se vérifie avant la base** : une colonne `uuid`
 * interrogée avec n'importe quoi rend un 500, pas un 404.
 */
async function openDomain(
  domainId: string,
): Promise<
  { grant: SuperAdminGrant; name: string; archivedAt: Date | null } | null
> {
  const grant = await requireSuperAdmin();
  if (!isUuid(domainId)) return null;

  const domain = await superAdmin.findDomain(domainId);
  if (!domain) return null;

  return { grant, name: domain.name, archivedAt: domain.archivedAt };
}

/* ==========================================================================
   L'entreprise
   ========================================================================== */

export async function createDomain(
  _previous: DomainFormState,
  formData: FormData,
): Promise<DomainFormState> {
  const grant = await requireSuperAdmin();

  const { values, errors, input } = parseDomainForm(formData);
  if (!input) return { values, errors };

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

  revalidate();
  return { values, errors: {}, ok: true };
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
 * Le geste sans lequel une entreprise créée reste close.
 *
 * **Il n'ouvre qu'une fois.** Une fois un compte posé, la suite se passe à
 * l'intérieur du domaine : c'est le responsable désigné qui désigne les
 * suivants, `docs/02` §3 lui donnant *« gérer les référentiels et les
 * membres »*. Le super administrateur amorce, il n'entre pas dans les
 * entreprises.
 *
 * **`kind` vaut `center` et `source` vaut `manual`** : un intervenant côté
 * entité ne reçoit jamais d'accès (`docs/05` §4, D2), et
 * `persons_external_id_requires_directory` interdit un `external_id` hors
 * annuaire — c'est le fournisseur qui le rendra au premier passage.
 *
 * **`has_access` et `domain_role` se posent ensemble** :
 * `persons_role_requires_access` refuse *accès sans rôle* et *rôle sans accès*.
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

  const { values, errors, input } = parseDomainManagerForm(formData);
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

  const created = await scope.insert(persons, {
    fullName: input.fullName,
    email: input.email,
    source: "manual",
    kind: "center",
    hasAccess: true,
    domainRole: "domain_manager",
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

  revalidate();
  return { values, errors: {}, ok: true };
}
