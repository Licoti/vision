/**
 * Les six règles d'entrée — **l'ordre *est* la règle**.
 *
 * Elles sont écrites dans `tickets-C9.md` parce qu'aucun ticket ne les rouvre ;
 * elles sont écrites **ici** parce qu'un point d'entrée qui décide au fil de
 * l'eau ne se met pas en défaut. Ce module reçoit des *claims déjà vérifiés* —
 * la signature RS256, `iss`, `aud`, l'expiration et le `nonce` sont l'affaire
 * d'`oidc.ts` — et rend un principal ou un refus. **Aucun réseau, aucune
 * dépendance à Next** : c'est ce qui permet de mesurer les six refus sur claims
 * forgés, séparément, sans connexion réelle.
 *
 * **La cause d'un refus ne sort jamais d'ici.** Elle nomme le test qui
 * l'éprouve ; l'écran, lui, dit la même chose dans tous les cas — un refus qui
 * distingue ses causes à l'écran est un oracle offert à qui frappe.
 *
 * **Ce module n'ouvre pas de session, il autorise à en ouvrir une.** Le cookie
 * posé ensuite ne porte que `personId` et `domainId` ; à chaque requête,
 * `loadSession` refait les quatre refus de la règle 6 et refuse en plus un
 * domaine suspendu ou archivé. Un accès retiré après coup ne survit donc pas
 * dans un cookie déjà posé — la porte d'entrée n'est pas la seule barrière,
 * elle est la première.
 */

import { and, eq, sql } from "drizzle-orm";

import type { Principal } from "./cookie";
import type { VerifiedClaims } from "./oidc";
import { resolveDomainId } from "./session";
import { forDomain, superAdmin } from "../db/scoped";
import { persons } from "../db/schema";

/**
 * Pourquoi la porte s'est refermée. **Sept causes pour six règles** : la règle
 * 6 en porte quatre, et elles doivent se distinguer pour s'isoler à la mise en
 * défaut. `domain_closed` est la septième, et elle referme le point qu'`ETAT.md`
 * portait depuis T9.1 — *un domaine suspendu ouvre-t-il une session ?* Non.
 */
export type RefusalCause =
  /** Règle 4 — ni `hd` ni `tid` : le compte n'est pas celui d'une organisation. */
  | "no_enterprise"
  /** Règle 5 — aucune ligne `domain_identities` : l'entreprise n'est pas cliente. */
  | "unknown_enterprise"
  /** Le domaine existe, mais il est suspendu ou archivé. */
  | "domain_closed"
  /** Règle 6 — aucune ligne `persons` du domaine ne correspond. */
  | "no_person"
  /** Règle 6 — la personne est archivée. */
  | "person_archived"
  /** Règle 6 — `is_active` est faux : désactivation d'annuaire. */
  | "person_inactive"
  /** Règle 6 — `has_access` est faux, ou aucun rôle : D19, être référencé n'est pas se connecter. */
  | "no_access";

export type EntryOutcome =
  | { granted: Principal; refused?: undefined }
  | { granted?: undefined; refused: RefusalCause };

export async function resolvePrincipal(
  claims: VerifiedClaims,
): Promise<EntryOutcome> {
  /* --- Règle 2 — `super_admins` en premier -------------------------------
     Un super administrateur est *au-dessus* des domaines : la règle du domaine
     d'entreprise ne le concerne pas. C'est ce qui permet d'être super
     administrateur avec une adresse hors entreprise **sans ouvrir la porte à
     personne d'autre**, et c'est la seule exception à l'arbitrage (2).
     `findSuperAdminByEmail` rapproche sur `lower(email)` et ne rend pas une
     ligne archivée — archiver *est* le geste qui retire le droit. */
  if (claims.email) {
    const admin = await superAdmin.findSuperAdminByEmail(claims.email);
    if (admin) {
      return { granted: { kind: "super_admin", superAdminId: admin.id } };
    }
  }

  /* --- Règles 3 et 4 — l'entreprise se lit dans le jeton ------------------ */
  if (!claims.enterprise) return { refused: "no_enterprise" };

  /* --- Règle 5 — et elle se confronte aux clientes ------------------------ */
  const domainId = await resolveDomainId({
    provider: claims.provider,
    value: claims.enterprise,
  });
  if (!domainId) return { refused: "unknown_enterprise" };

  /* Le domaine désigné doit être ouvert. `findDomainIdentity` ne juge pas de
     son état — T9.1 a eu raison de ne pas trancher là —, et c'est ici que la
     question se tranche, avant qu'une session ne se pose. */
  const domain = await superAdmin.findDomain(domainId);
  if (!domain || domain.archivedAt || domain.status !== "active") {
    return { refused: "domain_closed" };
  }

  /* --- Règle 6 — puis la ligne `persons` du domaine ----------------------- */
  const person = await findPerson(domainId, claims);
  if (!person) return { refused: "no_person" };

  if (person.archivedAt) return { refused: "person_archived" };
  if (!person.isActive) return { refused: "person_inactive" };
  if (!person.hasAccess || !person.domainRole) return { refused: "no_access" };

  return { granted: { kind: "person", personId: person.id, domainId } };
}

/**
 * Le rapprochement de la règle 6, en deux temps.
 *
 * **D'abord le couple (fournisseur, identifiant)**, jamais l'identifiant seul :
 * deux fournisseurs peuvent rendre le même, et c'est la raison même de la
 * colonne `identity_provider` posée par T9.1. **Puis l'e-mail**, au premier
 * passage — sur `lower()` des deux côtés, une adresse revenant en casses
 * différentes d'un fournisseur à l'autre.
 *
 * **Rien n'est réécrit en base au passage, et c'est délibéré.** Inscrire le
 * couple sur la ligne trouvée par e-mail buterait sur
 * `persons_external_id_requires_directory` pour toute personne saisie dans
 * Vision — elles sont toutes `manual` —, et n'aurait d'objet que pour des
 * lignes venues d'un import d'annuaire, que C9 ne fait pas (`docs/05` §3, hors
 * chantier). Écrire pour un cas qui ne peut pas se produire, c'est écrire ce
 * qu'aucune mesure ne couvre : le repli par e-mail reste donc le chemin, et le
 * point part dans `ETAT.md` plutôt que dans du code sans épreuve.
 *
 * **Les lignes archivées sont lues**, pour que le refus porte sa cause : sans
 * cela, une personne archivée et une personne absente seraient le même refus,
 * et la mise en défaut ne pourrait pas les isoler. La distinction ne sort pas
 * d'ici.
 */
async function findPerson(domainId: string, claims: VerifiedClaims) {
  const scope = forDomain({ domainId });

  const byProvider = await scope.list(persons, {
    where: and(
      eq(persons.identityProvider, claims.provider),
      eq(persons.externalId, claims.subject),
    ),
    includeArchived: true,
    limit: 1,
  });
  if (byProvider[0]) return byProvider[0];

  if (!claims.email) return null;

  const byEmail = await scope.list(persons, {
    where: sql`lower(${persons.email}) = lower(${claims.email})`,
    includeArchived: true,
    limit: 1,
  });
  return byEmail[0] ?? null;
}
