/**
 * Le contexte de session — qui est là, dans quel domaine, avec quels droits.
 *
 * D37 — le SSO est reporté en C7, **mais pas la notion d'utilisateur courant**.
 * Ce module porte la forme définitive du contexte ; seule sa source d'identité
 * est provisoire, et elle vit ailleurs (`lib/auth/provider.ts`).
 *
 * **Ce fichier n'importe rien de Next**, et c'est délibéré : le fournisseur
 * appelle le contexte, jamais l'inverse. Les tests le chargent donc sans
 * traîner `next/headers`, et C7 change de source d'identité sans toucher
 * d'une ligne aux droits.
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
import { domainRole, personKind, persons, projectMembers } from "../db/schema";

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

   docs/05 §3 — « domaine unique » au POC. Le domaine n'est donc pas choisi :
   il est trouvé. Une variable d'environnement serait un réglage de plus à
   tenir à jour pour une valeur que la base connaît déjà.
   ========================================================================== */

/** Le premier domaine actif, par nom. `null` si la base n'est pas amorcée. */
export async function resolveDomainId(): Promise<string | null> {
  const open = await superAdmin.listDomains();
  return open.find((domain) => domain.status === "active")?.id ?? null;
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

/** Le domaine du POC, puis la session. Ce qu'appelle le fournisseur. */
export async function loadCurrentSession(
  personId?: string | null,
): Promise<Session | null> {
  const domainId = await resolveDomainId();
  if (!domainId) return null;
  return loadSession({ domainId, personId });
}
