/**
 * Le contexte de session — qui est là, dans quel domaine, avec quels droits.
 *
 * D37 — le SSO est reporté en C7, **mais pas la notion d'utilisateur courant**.
 * Ce module porte la forme définitive du contexte ; seule sa source d'identité
 * est provisoire, et elle vit ailleurs (`lib/auth/provider.ts`).
 *
 * **Ce fichier n'importe rien de Next**, et c'est délibéré : le fournisseur
 * appelle le contexte, jamais l'inverse. Les tests le chargent donc sans
 * traîner `next/headers`.
 *
 * **La promesse a été tenue, et T9.2 est l'épreuve qui le dit.** Cet en-tête
 * annonçait « C7 change de source d'identité sans toucher d'une ligne aux
 * droits » — cinquième énoncé de la famille des promesses faites à C7, et un
 * commentaire faux vaut une ligne de code fausse (leçon de T7.5). C'est C9 qui
 * l'a fait, et le SSO n'a touché ici qu'une seule fonction, `resolveDomainId` :
 * `rightsFor`, `loadSession`, `listAccounts` et `resolveAccount` n'ont pas
 * bougé d'un caractère, ni aucun écran du produit.
 *
 * Les droits, en deux règles et pas une de plus :
 *   — `manageDomain` : créer et modifier produits, projets et référentiels.
 *     Réservé au responsable de domaine (F1-D1, D9, D25).
 *   — `writeProject` : saisir dans un projet — activités, ressources,
 *     résultats, relevés (D9, D23). Vrai pour un contributeur désigné, et
 *     vrai pour un responsable de domaine sur tout projet du domaine.
 *     Cette seconde moitié est un écart assumé à la lettre de D9, tranché
 *     avec l'humain en ouverture de T1.4 et consigné au journal technique.
 *
 * Toute lecture passe par `lib/db/scoped.ts`. Règle 1, sans exception.
 */

import { and, asc, eq } from "drizzle-orm";

import { forDomain, superAdmin, type ScopedDb } from "../db/scoped";
import {
  domainRole,
  identityProvider,
  personKind,
  persons,
  projectMembers,
} from "../db/schema";

/* ==========================================================================
   La forme du contexte
   ========================================================================== */

/** `domain_manager` · `member`. Dérivé du schéma, jamais réécrit à la main. */
export type DomainRole = (typeof domainRole.enumValues)[number];

export type PersonKind = (typeof personKind.enumValues)[number];

/**
 * Ce que le contexte connaît de la personne courante. Un extrait de `persons`,
 * pas la ligne entière : le contexte n'est pas un cache d'annuaire.
 */
export type SessionPerson = {
  id: string;
  fullName: string;
  email: string | null;
  jobId: string | null;
  kind: PersonKind;
};

/** Une personne qui peut se connecter, telle que la propose le sélecteur. */
export type SessionAccount = SessionPerson & { role: DomainRole };

export type SessionDomain = {
  id: string;
  name: string;
  competenceCenterName: string;
};

export type SessionRights = {
  /** Créer et modifier produits, projets, référentiels. F1-D1, D9, D25. */
  manageDomain: boolean;
  /** Saisir dans un projet : activités, ressources, résultats, relevés. D9, D23. */
  writeProject: (projectId: string) => boolean;
  /** Vrai si au moins un projet est ouvert à l'écriture. */
  writeAnyProject: boolean;
  /** Les projets où la personne est contributrice désignée. */
  contributorProjectIds: readonly string[];
};

export type Session = {
  person: SessionPerson;
  domain: SessionDomain;
  /** Le domaine courant, répété au premier niveau : c'est ce qu'on passe partout. */
  domainId: string;
  role: DomainRole;
  can: SessionRights;
  /**
   * La couche d'accès déjà scopée sur ce domaine et cette personne.
   * `forDomain({ domainId, actorId })` — `created_by` est rempli sans que
   * l'appelant y pense. C'est le couple que `lib/db/scoped.ts` attendait.
   */
  db: ScopedDb;
};

/* ==========================================================================
   Les droits

   Fonction pure, sans base : la règle est énonçable et vérifiable seule.
   ========================================================================== */

export function rightsFor(
  role: DomainRole,
  contributorProjectIds: readonly string[],
): SessionRights {
  const manageDomain = role === "domain_manager";
  const contributed = new Set(contributorProjectIds);

  return {
    manageDomain,
    contributorProjectIds,
    writeAnyProject: manageDomain || contributed.size > 0,
    writeProject: (projectId) => manageDomain || contributed.has(projectId),
  };
}

/* ==========================================================================
   Le domaine courant

   **Il ne se trouve plus, il se désigne** (T9.2). La version précédente rendait
   « le premier domaine actif, par nom » : `docs/05` §3 posant un domaine unique,
   il n'y avait rien à choisir. Le coût de ce raccourci n'était pas théorique —
   il est **le couplage que T8.1 n'a pas pu lever** : *rien ne pouvait désigner
   un autre domaine, donc un test d'action dépendait de l'état global de la
   branche*, et un domaine résiduel faisait tomber 63 tests sur trois fichiers
   (02/09/2026).

   Le domaine vient désormais du **jeton**, et de lui seul : le `hd` de Google ou
   le `tid` d'Entra, confrontés à `domain_identities`. C'est aussi ce qui
   interdit tout sélecteur de domaine à l'écran — une liste déroulante que
   n'importe qui change serait l'inverse de l'étanchéité qu'elle prétendrait
   servir.
   ========================================================================== */

/**
 * Le domaine d'une entreprise **vérifiée**, ou `null` si elle n'est pas cliente.
 *
 * Règles d'entrée 3 et 5. La lecture ne passe pas par `forDomain`, et ce n'est
 * pas une entorse à la règle 1 : c'est cette ligne qui *désigne* le domaine —
 * la scoper demanderait de connaître la réponse avant de poser la question.
 * Le raisonnement est écrit une fois pour toutes au-dessus du bloc « Ce qui vit
 * avant le domaine » de `lib/db/scoped.ts`.
 */
export async function resolveDomainId(identity: {
  provider: (typeof identityProvider.enumValues)[number];
  value: string;
}): Promise<string | null> {
  const row = await superAdmin.findDomainIdentity(
    identity.provider,
    identity.value,
  );
  return row?.domainId ?? null;
}

/* ==========================================================================
   Les comptes
   ========================================================================== */

/**
 * D19 — être référencé et pouvoir se connecter sont deux choses distinctes.
 * Une personne d'équipe côté entité figure dans `persons` sans jamais
 * apparaître ici : `has_access` est faux.
 */
export async function listAccounts(
  domainId: string,
): Promise<SessionAccount[]> {
  const rows = await forDomain({ domainId }).list(persons, {
    where: and(eq(persons.hasAccess, true), eq(persons.isActive, true)),
    orderBy: [asc(persons.fullName)],
  });

  return rows.flatMap((row) => {
    // Le rôle est garanti non nul par la contrainte `persons_role_requires_access`.
    // Le vérifier plutôt que l'affirmer coûte une ligne.
    if (!row.domainRole) return [];
    return [{ ...toSessionPerson(row), role: row.domainRole }];
  });
}

function toSessionPerson(row: {
  id: string;
  fullName: string;
  email: string | null;
  jobId: string | null;
  kind: PersonKind;
}): SessionPerson {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    jobId: row.jobId,
    kind: row.kind,
  };
}

/* ==========================================================================
   Le chargement
   ========================================================================== */

export type SessionInput = {
  domainId: string;
  /**
   * L'identité que le fournisseur a résolue. Absente, le contexte retombe sur
   * un défaut prévisible — un stub doit être utilisable au premier chargement.
   * **Fournie mais inéligible, le contexte rend `null` et ne retombe sur rien.**
   * C'est ce qui fera qu'un jeton Entra ID nommant une personne sans accès
   * n'ouvrira pas une session sur quelqu'un d'autre.
   */
  personId?: string | null;
};

export async function loadSession(input: SessionInput): Promise<Session | null> {
  const domain = await superAdmin.findDomain(input.domainId);
  if (!domain || domain.archivedAt || domain.status !== "active") return null;

  const account = await resolveAccount(domain.id, input.personId);
  if (!account) return null;

  const scope = forDomain({ domainId: domain.id, actorId: account.id });

  const memberships = await scope.list(projectMembers, {
    where: and(
      eq(projectMembers.personId, account.id),
      eq(projectMembers.isContributor, true),
    ),
  });

  const { role, ...person } = account;

  return {
    person,
    domain: {
      id: domain.id,
      name: domain.name,
      competenceCenterName: domain.competenceCenterName,
    },
    domainId: domain.id,
    role,
    can: rightsFor(
      role,
      memberships.map((membership) => membership.projectId),
    ),
    db: scope,
  };
}

/**
 * La personne courante, ou `null`.
 *
 * `find` est scopé : un identifiant d'un autre domaine ne trouve rien, et la
 * frontière tient sans qu'on ait à la vérifier ici.
 */
async function resolveAccount(
  domainId: string,
  personId: string | null | undefined,
): Promise<SessionAccount | null> {
  if (personId) {
    const row = await forDomain({ domainId }).find(persons, personId);
    if (
      !row ||
      row.archivedAt ||
      !row.isActive ||
      !row.hasAccess ||
      !row.domainRole
    ) {
      return null;
    }
    return { ...toSessionPerson(row), role: row.domainRole };
  }

  // Sans identité fournie : le premier responsable de domaine par nom, sinon
  // la première personne connectable. Un défaut, pas un hasard.
  const accounts = await listAccounts(domainId);
  return (
    accounts.find((account) => account.role === "domain_manager") ??
    accounts[0] ??
    null
  );
}
