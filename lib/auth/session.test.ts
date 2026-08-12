/**
 * Les tests du contexte de session.
 *
 * Même dispositif que `lib/db/scoped.test.ts` : branche Neon dédiée, écriture
 * réelle, nettoyage enfants-puis-parents. Un contexte de droits qui n'a jamais
 * lu de vraies lignes ne prouve rien.
 *
 * Ce fichier importe `db` pour son seul nettoyage, comme `scoped.test.ts` —
 * l'exception à la règle 1 est bornée au `afterAll`. Toutes les lectures sous
 * test passent par la couche scopée.
 *
 * Le critère de validation de T1.4 — « le basculement d'utilisateur change les
 * droits observables » — est établi par le test « la bascule change les
 * droits », qui est la raison d'être de ce fichier.
 */

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { db } from "../db/client";
import { forDomain, superAdmin, type ScopedTable } from "../db/scoped";
import {
  domains,
  entities,
  persons,
  products,
  projectMembers,
  projectStatuses,
  projects,
} from "../db/schema";
import {
  listAccounts,
  loadSession,
  resolveDomainId,
  rightsFor,
  type Session,
} from "./session";

/* ==========================================================================
   Le jeu d'essai

   Un domaine, deux projets, et les trois profils que le sélecteur de T1.4
   doit distinguer — plus les cas qui doivent être refusés.
   ========================================================================== */

const teardownOrder: ScopedTable[] = [
  projectMembers,
  projects,
  products,
  persons,
  projectStatuses,
  entities,
];

const suffix = Math.random().toString(36).slice(2, 10);

type Fixture = {
  domainId: string;
  projectA: string;
  projectB: string;
  manager: string;
  contributor: string;
  member: string;
  withoutAccess: string;
  inactive: string;
};

let main: Fixture;
/** Un second domaine, pour éprouver la frontière. */
let other: Fixture;
/** Un domaine suspendu : aucune session ne doit s'y ouvrir. */
let suspendedDomainId: string;

async function seedDomain(label: string): Promise<Fixture> {
  const domain = await superAdmin.createDomain({
    name: `__test__auth__${label}__${suffix}`,
    competenceCenterName: `Centre ${label}`,
  });
  const scope = forDomain({ domainId: domain.id });

  const entity = await scope.insert(entities, { label: `Entité ${label}` });
  const status = await scope.insert(projectStatuses, {
    label: "En cours",
    nature: "active",
  });
  const product = await scope.insert(products, {
    name: `Produit ${label}`,
    entityId: entity.id,
  });

  const projectA = await scope.insert(projects, {
    name: `Projet A ${label}`,
    productId: product.id,
    statusId: status.id,
  });
  const projectB = await scope.insert(projects, {
    name: `Projet B ${label}`,
    productId: product.id,
    statusId: status.id,
  });

  // Les noms fixent l'ordre attendu de `listAccounts`, qui trie par nom.
  const manager = await scope.insert(persons, {
    source: "directory",
    externalId: `mgr-${label}-${suffix}`,
    fullName: `Alice Responsable ${label}`,
    email: `alice.${label}@example.test`,
    kind: "center",
    hasAccess: true,
    domainRole: "domain_manager",
  });
  const contributor = await scope.insert(persons, {
    source: "directory",
    externalId: `ctb-${label}-${suffix}`,
    fullName: `Bruno Contributeur ${label}`,
    kind: "center",
    hasAccess: true,
    domainRole: "member",
  });
  const member = await scope.insert(persons, {
    source: "directory",
    externalId: `mbr-${label}-${suffix}`,
    fullName: `Chloe Membre ${label}`,
    kind: "center",
    hasAccess: true,
    domainRole: "member",
  });
  // D19 — référencée, jamais connectée. Le rôle est nul, la base l'exige.
  const withoutAccess = await scope.insert(persons, {
    source: "manual",
    fullName: `Denis SansAcces ${label}`,
    kind: "stakeholder",
    hasAccess: false,
  });
  const inactive = await scope.insert(persons, {
    source: "directory",
    externalId: `ina-${label}-${suffix}`,
    fullName: `Zoe Partie ${label}`,
    kind: "center",
    hasAccess: true,
    domainRole: "member",
    isActive: false,
  });

  // Bruno est contributeur désigné sur A, simple membre d'équipe sur B :
  // c'est le drapeau qui donne le droit, pas l'appartenance (D9).
  await scope.insert(projectMembers, {
    projectId: projectA.id,
    personId: contributor.id,
    isContributor: true,
  });
  await scope.insert(projectMembers, {
    projectId: projectB.id,
    personId: contributor.id,
    isContributor: false,
  });
  // Chloé n'est rattachée à rien : elle lit le domaine, elle n'y écrit pas.

  return {
    domainId: domain.id,
    projectA: projectA.id,
    projectB: projectB.id,
    manager: manager.id,
    contributor: contributor.id,
    member: member.id,
    withoutAccess: withoutAccess.id,
    inactive: inactive.id,
  };
}

/** `loadSession` qui rend une session, ou fait échouer le test franchement. */
async function sessionOf(domainId: string, personId: string): Promise<Session> {
  const session = await loadSession({ domainId, personId });
  expect(session).not.toBeNull();
  return session as Session;
}

beforeAll(async () => {
  main = await seedDomain("main");
  other = await seedDomain("other");

  const suspended = await superAdmin.createDomain({
    name: `__test__auth__suspended__${suffix}`,
    competenceCenterName: "Centre suspendu",
  });
  suspendedDomainId = suspended.id;
  await db
    .update(domains)
    .set({ status: "suspended" })
    .where(eq(domains.id, suspended.id));
});

afterAll(async () => {
  const ids = [main?.domainId, other?.domainId, suspendedDomainId].filter(
    Boolean,
  ) as string[];
  if (ids.length === 0) return;
  for (const table of teardownOrder) {
    await db.delete(table).where(inArray(table.domainId, ids));
  }
  await db.delete(domains).where(inArray(domains.id, ids));
});

/* ==========================================================================
   La règle de droits, seule
   ========================================================================== */

describe("rightsFor", () => {
  test("un responsable de domaine gère le domaine et écrit partout", () => {
    const rights = rightsFor("domain_manager", []);
    expect(rights.manageDomain).toBe(true);
    expect(rights.writeAnyProject).toBe(true);
    expect(rights.writeProject("n-importe-quel-projet")).toBe(true);
  });

  test("un membre contributeur n'écrit que sur ses projets désignés", () => {
    const rights = rightsFor("member", ["p1"]);
    expect(rights.manageDomain).toBe(false);
    expect(rights.writeAnyProject).toBe(true);
    expect(rights.writeProject("p1")).toBe(true);
    expect(rights.writeProject("p2")).toBe(false);
  });

  test("un membre sans désignation n'écrit nulle part", () => {
    const rights = rightsFor("member", []);
    expect(rights.manageDomain).toBe(false);
    expect(rights.writeAnyProject).toBe(false);
    expect(rights.writeProject("p1")).toBe(false);
  });
});

/* ==========================================================================
   Les trois profils, chargés de la base
   ========================================================================== */

describe("les profils", () => {
  test("le responsable de domaine crée et écrit sur tous les projets", async () => {
    const session = await sessionOf(main.domainId, main.manager);

    expect(session.role).toBe("domain_manager");
    expect(session.person.fullName).toContain("Alice Responsable");
    expect(session.can.manageDomain).toBe(true);
    expect(session.can.writeProject(main.projectA)).toBe(true);
    expect(session.can.writeProject(main.projectB)).toBe(true);
    // Il écrit partout par son rôle, sans être désigné nulle part.
    expect(session.can.contributorProjectIds).toHaveLength(0);
  });

  test("le membre contributeur écrit sur son projet, pas sur l'autre", async () => {
    const session = await sessionOf(main.domainId, main.contributor);

    expect(session.role).toBe("member");
    expect(session.can.manageDomain).toBe(false);
    expect(session.can.writeProject(main.projectA)).toBe(true);
    expect(session.can.writeProject(main.projectB)).toBe(false);
    expect(session.can.contributorProjectIds).toEqual([main.projectA]);
  });

  test("le simple membre lit le domaine et n'y écrit rien", async () => {
    const session = await sessionOf(main.domainId, main.member);

    expect(session.role).toBe("member");
    expect(session.can.manageDomain).toBe(false);
    expect(session.can.writeAnyProject).toBe(false);
    expect(session.can.writeProject(main.projectA)).toBe(false);
  });

  test("la bascule change les droits", async () => {
    const observed: {
      manageDomain: boolean;
      writesOnA: boolean;
      writesOnB: boolean;
    }[] = [];
    for (const personId of [main.manager, main.contributor, main.member]) {
      const session = await sessionOf(main.domainId, personId);
      observed.push({
        manageDomain: session.can.manageDomain,
        writesOnA: session.can.writeProject(main.projectA),
        writesOnB: session.can.writeProject(main.projectB),
      });
    }

    expect(observed).toEqual([
      { manageDomain: true, writesOnA: true, writesOnB: true },
      { manageDomain: false, writesOnA: true, writesOnB: false },
      { manageDomain: false, writesOnA: false, writesOnB: false },
    ]);
  });
});

/* ==========================================================================
   Ce que le contexte donne à la couche d'accès
   ========================================================================== */

describe("le couple domaine / auteur", () => {
  test("la couche scopée de la session porte le domaine et la personne", async () => {
    const session = await sessionOf(main.domainId, main.contributor);

    expect(session.db.domainId).toBe(main.domainId);
    expect(session.db.actorId).toBe(main.contributor);
  });

  test("une écriture faite par la session porte son `created_by`", async () => {
    const session = await sessionOf(main.domainId, main.manager);
    const entity = await session.db.insert(entities, {
      label: `Entité écrite par la session ${suffix}`,
    });

    expect(entity.domainId).toBe(main.domainId);
    expect(entity.createdBy).toBe(main.manager);
  });
});

/* ==========================================================================
   Ce que le contexte refuse
   ========================================================================== */

describe("les identités refusées", () => {
  test("une personne sans accès n'ouvre pas de session", async () => {
    expect(
      await loadSession({
        domainId: main.domainId,
        personId: main.withoutAccess,
      }),
    ).toBeNull();
  });

  test("une personne désactivée n'ouvre pas de session", async () => {
    expect(
      await loadSession({ domainId: main.domainId, personId: main.inactive }),
    ).toBeNull();
  });

  test("une personne archivée n'ouvre plus de session", async () => {
    const scope = forDomain({ domainId: other.domainId });
    await scope.archive(persons, other.member);

    expect(
      await loadSession({ domainId: other.domainId, personId: other.member }),
    ).toBeNull();
  });

  test("une personne d'un autre domaine n'ouvre pas de session", async () => {
    const session = await loadSession({
      domainId: main.domainId,
      personId: other.manager,
    });

    // Ni cette personne, ni un repli silencieux sur quelqu'un du domaine :
    // une identité fournie et inéligible est refusée, pas remplacée.
    expect(session).toBeNull();
  });

  test("un domaine suspendu n'ouvre pas de session", async () => {
    expect(
      await loadSession({ domainId: suspendedDomainId, personId: null }),
    ).toBeNull();
  });

  test("un domaine inexistant n'ouvre pas de session", async () => {
    expect(
      await loadSession({
        domainId: "00000000-0000-0000-0000-000000000000",
        personId: null,
      }),
    ).toBeNull();
  });
});

/* ==========================================================================
   Les comptes et le défaut
   ========================================================================== */

describe("les comptes proposés au sélecteur", () => {
  test("seules les personnes connectables sont proposées, triées par nom", async () => {
    const accounts = await listAccounts(main.domainId);

    expect(accounts.map((account) => account.id)).toEqual([
      main.manager,
      main.contributor,
      main.member,
    ]);
    expect(accounts.map((account) => account.role)).toEqual([
      "domain_manager",
      "member",
      "member",
    ]);
  });

  test("les comptes d'un domaine ne fuient pas dans un autre", async () => {
    const accounts = await listAccounts(main.domainId);
    expect(accounts.map((account) => account.id)).not.toContain(other.manager);
  });

  test("sans identité fournie, le défaut est le responsable de domaine", async () => {
    const session = await loadSession({ domainId: main.domainId });

    expect(session?.person.id).toBe(main.manager);
    expect(session?.can.manageDomain).toBe(true);
  });
});

describe("le domaine courant", () => {
  test("`resolveDomainId` rend un domaine actif et non archivé", async () => {
    const domainId = await resolveDomainId();
    expect(domainId).not.toBeNull();

    const domain = await superAdmin.findDomain(domainId as string);
    expect(domain?.status).toBe("active");
    expect(domain?.archivedAt).toBeNull();
  });
});
