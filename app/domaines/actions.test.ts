/**
 * Le droit de l'écran au-dessus des domaines, éprouvé **par l'action** — T9.4.
 *
 * **C'est le premier ticket du chantier qui peut faire la mesure littérale.**
 * T9.3 ne rendait aucun point d'entrée : sa fiche demandait `text/plain` et ses
 * interdits refusaient tout endroit où frapper. T9.4 en crée huit, et ce fichier
 * les frappe — non par HTTP, mais en appelant les fonctions serveur elles-mêmes
 * sous un cookie **réellement scellé** par le sceau du produit, ce qui est plus
 * fort qu'une requête simulée : la signature n'est pas imitée, elle est celle
 * qui tourne en production.
 *
 * **Le décompte en base tranche, jamais le code de retour.** Un refus rend un
 * état comme une réussite (leçon de T6.1), et une redirection ne prouve pas
 * qu'aucune ligne n'a été écrite. Chaque cas lit sa cible **avant** le geste,
 * puis après.
 *
 * **L'étape témoin n'est pas optionnelle.** Sans elle, un décompte inchangé ne
 * distingue pas un refus d'une charge qui n'aurait de toute façon rien écrit :
 * la **même** charge est rejouée sous l'autorité, et elle doit écrire.
 *
 * **Trois identités traversent ce fichier**, et le cookie porte l'union du
 * produit : aucune — un visiteur sans cookie —, une **personne** qui est le
 * responsable du domaine de fixture, et un **super administrateur**. La
 * deuxième est la plus intéressante : c'est la personne la plus habilitée du
 * produit, et elle ne doit pas créer d'entreprise.
 */

import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  asSuperAdmin,
  withoutAnySession,
  type SuperAdminGrant,
} from "@/lib/db/scoped";
import {
  activityTypes,
  approaches,
  domainEvents,
  domainIdentities,
  domains,
  entities,
  events,
  invitations,
  jobs,
  persons,
  projectStatuses,
  skillLevels,
  skills,
  starters,
  superAdmins,
  tools,
} from "@/lib/db/schema";
import { SESSION_COOKIE, sealPrincipal, type Principal } from "@/lib/auth/cookie";
import {
  hashInvitationToken,
  redeemInvitation,
} from "@/lib/auth/invitation";

/* Une fixture écrit hors de toute session — l'échappée nommée de T9.3. */
const outsideAnySession = asSuperAdmin(withoutAnySession("fixture"));

/** Qui la requête prétend être. Le cookie est scellé par le vrai sceau. */
let principal: Principal | null = null;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === SESSION_COOKIE && principal
        ? { name, value: sealPrincipal(principal) }
        : undefined,
  }),
}));

/**
 * `revalidatePath` **enregistre au lieu de ne rien faire** — T12.4.
 *
 * Le mock était muet depuis T9.4, ce qui se défendait tant que l'écran n'avait
 * qu'une adresse : rien à mesurer sur un appel unique et invariable. Depuis que
 * les gestes se font **sur la fiche**, il y en a deux, et la seule chose qui
 * dise que la fiche ne restera pas périmée après un geste est **le relevé des
 * adresses revalidées**.
 *
 * **`vi.hoisted` parce que `vi.mock` est hissé** : la fabrique s'évalue avant
 * les déclarations du module, et un `const` ordinaire y serait lu avant son
 * initialisation.
 */
const { revalidated } = vi.hoisted(() => ({ revalidated: [] as string[] }));

vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => {
    revalidated.push(path);
  },
}));

/**
 * `redirect` lève, comme dans Next — et le message porte la destination.
 *
 * **Une redirection ne prouve rien à elle seule**, et aucun test d'ici ne s'y
 * fie : elle dit qu'on a été renvoyé, pas qu'aucune ligne n'a été écrite.
 */
const REDIRECT = "NEXT_REDIRECT:";

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`${REDIRECT}${to}`);
  },
}));

const {
  addDomainIdentity,
  archiveDomain,
  createDomain,
  deleteDomain,
  designateDomainManager,
  removeDomainIdentity,
  restoreDomain,
  resumeDomain,
  revokeDomainInvitation,
  suspendDomain,
} = await import("./actions");

const suffix = Math.random().toString(36).slice(2, 10);

/* ==========================================================================
   Les charges, telles qu'une soumission les fait
   ========================================================================== */

/**
 * La charge de création — **sept champs depuis T11.4**.
 *
 * **L'adresse suit l'identité par défaut** : c'est la règle d'adresse
 * (arbitrage (11)), et une charge qui la violerait ferait échouer chaque cas
 * pour une raison qui n'est pas la sienne. Le troisième argument sert aux cas
 * qui l'éprouvent, et à eux seuls.
 */
function domainForm(
  name: string,
  identityValue: string,
  managerEmail = `admin.${suffix}@${identityValue}`,
): FormData {
  const data = new FormData();
  data.append("name", name);
  data.append("competenceCenterName", `Centre ${suffix}`);
  data.append("provider", "google");
  data.append("identityValue", identityValue);
  data.append("description", `Ce que fait ${name}.`);
  data.append("managerFullName", `Admin ${suffix}`);
  data.append("managerEmail", managerEmail);
  return data;
}

function identityForm(value: string): FormData {
  const data = new FormData();
  data.append("provider", "google");
  data.append("value", value);
  return data;
}

function managerForm(fullName: string, email: string): FormData {
  const data = new FormData();
  data.append("fullName", fullName);
  data.append("email", email);
  return data;
}

const EMPTY_DOMAIN = {
  values: {
    name: "",
    competenceCenterName: "",
    provider: "google",
    identityValue: "",
    description: "",
    managerFullName: "",
    managerEmail: "",
  },
  errors: {},
};
const EMPTY_IDENTITY = { values: { provider: "google", value: "" }, errors: {} };
const EMPTY_MANAGER = { values: { fullName: "", email: "" }, errors: {} };

/** Ce que `useActionState` passe à une confirmation : rien à saisir. */
function confirm(): [Record<string, never>, FormData] {
  return [{}, new FormData()];
}

/* ==========================================================================
   Les décomptes, lus sans passer par un écran
   ========================================================================== */

const countDomains = async (name: string): Promise<number> =>
  (await db.select().from(domains).where(eq(domains.name, name))).length;

const domainRow = async (id: string) =>
  (await db.select().from(domains).where(eq(domains.id, id)))[0];

const countIdentities = async (domainId: string): Promise<number> =>
  (
    await db
      .select()
      .from(domainIdentities)
      .where(eq(domainIdentities.domainId, domainId))
  ).length;

const countAccounts = async (domainId: string): Promise<number> =>
  (
    await db
      .select()
      .from(persons)
      .where(
        and(eq(persons.domainId, domainId), eq(persons.hasAccess, true)),
      )
  ).length;

/** Les personnes du domaine, **avec ou sans accès** — T11.4 en crée sans. */
const countPersons = async (domainId: string): Promise<number> =>
  (await db.select().from(persons).where(eq(persons.domainId, domainId))).length;

const listInvitations = async (domainId: string) =>
  db.select().from(invitations).where(eq(invitations.domainId, domainId));

/** Les vivantes, à l'expression même de `invitations_pending_unique`. */
const pendingInvitations = async (domainId: string) =>
  (await listInvitations(domainId)).filter(
    (row) => row.acceptedAt === null && row.revokedAt === null,
  );

/**
 * Le jeton, **extrait du lien rendu** : c'est la seule forme sous laquelle il
 * existe: Vision n'en garde que l'empreinte (T11.1), et rien ne le reconstitue.
 */
const tokenOf = (link: string): string => link.split("/invitation/")[1]!;

/* ==========================================================================
   La fixture
   ========================================================================== */

type Fixture = {
  /** Le domaine de fixture, et son responsable — la personne la plus habilitée. */
  domainId: string;
  managerId: string;
  /** Le super administrateur en exercice, et celui qu'on archivera. */
  superAdminId: string;
  archivedSuperAdminId: string;
};

let f: Fixture;

/** Les domaines créés par ce fichier, retenus **dès leur création**. */
const created: string[] = [];

async function seedDomain(label: string): Promise<string> {
  const domain = await outsideAnySession.createDomain({
    name: `__0__test__domaines__${label}__${suffix}`,
    competenceCenterName: `Centre ${label}`,
  });
  created.push(domain.id);
  return domain.id;
}

beforeAll(async () => {
  const domainId = await seedDomain("fixture");

  const [manager] = await db
    .insert(persons)
    .values({
      domainId,
      fullName: `Responsable ${suffix}`,
      email: `responsable.${suffix}@exemple.test`,
      source: "manual",
      kind: "center",
      hasAccess: true,
      domainRole: "domain_manager",
    })
    .returning();

  const { row: admin } = await outsideAnySession.upsertSuperAdmin({
    email: `super.${suffix}@exemple.test`,
    fullName: `Super ${suffix}`,
  });

  const { row: archived } = await outsideAnySession.upsertSuperAdmin({
    email: `super-archive.${suffix}@exemple.test`,
    fullName: `Super archivé ${suffix}`,
  });
  await db
    .update(superAdmins)
    .set({ archivedAt: new Date() })
    .where(eq(superAdmins.id, archived.id));

  f = {
    domainId,
    managerId: manager!.id,
    superAdminId: admin.id,
    archivedSuperAdminId: archived.id,
  };
}, 180_000);

afterAll(async () => {
  /* Enfants d'abord, parents ensuite : les clés `restrict` refusent l'inverse,
     et `events.domain_id` en est une — la cascade de T8.3.
     **Les huit référentiels de T9.5 s'y ajoutent**, et leur ordre est contraint
     lui aussi : les pistes et les types d'activité pointent les outils, les
     personnes pointent les métiers. */
  for (const id of created) {
    for (const table of [
      events,
      /* **Le journal d'administration part avec le reste** (T12.2) :
         `domain_events.domain_id` est `restrict` comme les autres. */
      domainEvents,
      /* **Les invitations avant les personnes** : `invitations.person_id` est
         `restrict`, et une personne invitée ne se supprime pas sans le dire. */
      invitations,
      persons,
      starters,
      activityTypes,
      tools,
      projectStatuses,
      approaches,
      skillLevels,
      skills,
      jobs,
      entities,
      domainIdentities,
    ]) {
      await db.delete(table).where(eq(table.domainId, id));
    }
    await db.delete(domains).where(eq(domains.id, id));
  }

  await db
    .delete(superAdmins)
    .where(eq(superAdmins.id, f.superAdminId));
  await db
    .delete(superAdmins)
    .where(eq(superAdmins.id, f.archivedSuperAdminId));
});

/** Les trois identités de ce fichier, en un mot. */
const asNobody = () => {
  principal = null;
};
const asDomainManager = () => {
  principal = {
    kind: "person",
    personId: f.managerId,
    domainId: f.domainId,
  };
};
const asArchivedSuperAdmin = () => {
  principal = { kind: "super_admin", superAdminId: f.archivedSuperAdminId };
};
const asSuperAdministrator = () => {
  principal = { kind: "super_admin", superAdminId: f.superAdminId };
};

/* ==========================================================================
   Les trois refus du droit — et l'étape témoin qui les rend lisibles
   ========================================================================== */

describe("le droit de créer une entreprise", () => {
  /* Les trois cas partagent leur forme : une charge parfaitement valide, une
     identité qui n'a pas l'autorité, et **la même charge** rejouée sous
     l'autorité. Sans le second temps, on ne mesurerait que l'inertie. */
  const cases = [
    ["aucun cookie", asNobody],
    ["un responsable de domaine", asDomainManager],
    ["un super administrateur archivé", asArchivedSuperAdmin],
  ] as const;

  for (const [label, become] of cases) {
    test(`${label} ne crée aucune entreprise`, async () => {
      const name = `__0__test__domaines__refus-${label.replace(/\s/g, "-")}__${suffix}`;
      const value = `refus-${label.replace(/\s/g, "-")}-${suffix}.example`;

      expect(await countDomains(name)).toBe(0);

      become();
      await expect(
        createDomain(EMPTY_DOMAIN, domainForm(name, value)),
      ).rejects.toThrow(`${REDIRECT}/auth/acces`);

      /* **C'est ce décompte qui tranche**, jamais la levée : une redirection
         vers l'écran d'entrée ne dit rien de ce qui a été écrit. */
      expect(await countDomains(name)).toBe(0);

      /* L'étape témoin : la même charge, sous l'autorité, écrit. */
      asSuperAdministrator();
      const witness = await createDomain(EMPTY_DOMAIN, domainForm(name, value));
      /* **Le lien tient lieu d'`ok` depuis T11.4** : il ne s'affiche qu'une
         fois, et le panneau reste ouvert dessus. */
      expect(witness.link).toContain("/invitation/");
      expect(await countDomains(name)).toBe(1);

      const row = (
        await db.select().from(domains).where(eq(domains.name, name))
      )[0];
      created.push(row!.id);
    });
  }

  test("les trois gestes d'état refusent la même identité, et le témoin écrit", async () => {
    asSuperAdministrator();
    const domainId = await seedDomain("gestes-etat");

    asDomainManager();
    await expect(suspendDomain(domainId, ...confirm())).rejects.toThrow(
      `${REDIRECT}/auth/acces`,
    );
    await expect(archiveDomain(domainId, ...confirm())).rejects.toThrow(
      `${REDIRECT}/auth/acces`,
    );
    await expect(restoreDomain(domainId)).rejects.toThrow(
      `${REDIRECT}/auth/acces`,
    );

    expect(await domainRow(domainId)).toMatchObject({
      status: "active",
      archivedAt: null,
    });

    /* Le témoin, sur les trois gestes : ils portent bien. */
    asSuperAdministrator();
    expect((await suspendDomain(domainId, ...confirm())).ok).toBe(true);
    expect((await domainRow(domainId))?.status).toBe("suspended");

    await resumeDomain(domainId);
    expect((await domainRow(domainId))?.status).toBe("active");

    expect((await archiveDomain(domainId, ...confirm())).ok).toBe(true);
    expect((await domainRow(domainId))?.archivedAt).not.toBeNull();

    await restoreDomain(domainId);
    expect((await domainRow(domainId))?.archivedAt).toBeNull();
  });
});

/* ==========================================================================
   Les trois refus de règle — ceux que l'autorité ne lève pas
   ========================================================================== */

describe("une identité vérifiée ne désigne qu'une entreprise", () => {
  test("un couple déjà pris n'est pas repris, et aucune entreprise ne naît", async () => {
    asSuperAdministrator();
    const value = `deja-pris-${suffix}.example`;

    const first = `__0__test__domaines__premiere__${suffix}`;
    expect(
      (await createDomain(EMPTY_DOMAIN, domainForm(first, value))).link,
    ).toContain("/invitation/");
    const firstRow = (
      await db.select().from(domains).where(eq(domains.name, first))
    )[0];
    created.push(firstRow!.id);

    const second = `__0__test__domaines__seconde__${suffix}`;
    expect(await countDomains(second)).toBe(0);

    const refused = await createDomain(
      EMPTY_DOMAIN,
      domainForm(second, value),
    );

    expect(refused.link).toBeUndefined();
    expect(refused.errors.identityValue).toContain("déjà rattachée");
    /* **La confrontation précède l'écriture** : sans elle, l'entreprise serait
       née puis son identité aurait échoué, laissant un domaine muet. */
    expect(await countDomains(second)).toBe(0);

    /* La saisie revient telle quelle : Vision ne jette jamais en silence ce qui
       a été tapé. */
    expect(refused.values.name).toBe(second);
  });

  test("l'ajout d'un couple déjà pris est refusé, et rien n'est écrit", async () => {
    asSuperAdministrator();
    const domainId = await seedDomain("ajout-refuse");
    const taken = `ajout-refuse-${suffix}.example`;

    expect(
      (await addDomainIdentity(domainId, EMPTY_IDENTITY, identityForm(taken)))
        .ok,
    ).toBe(true);
    expect(await countIdentities(domainId)).toBe(1);

    const other = await seedDomain("ajout-refuse-voisine");
    const before = await countIdentities(other);

    const refused = await addDomainIdentity(
      other,
      EMPTY_IDENTITY,
      identityForm(taken),
    );
    expect(refused.ok).toBeUndefined();
    expect(refused.errors.value).toContain("déjà rattachée");
    expect(await countIdentities(other)).toBe(before);
  });
});

describe("une entreprise garde au moins une identité", () => {
  test("le retrait de la dernière ne retire rien, le retrait d'une autre porte", async () => {
    asSuperAdministrator();
    const domainId = await seedDomain("derniere-identite");

    await addDomainIdentity(
      domainId,
      EMPTY_IDENTITY,
      identityForm(`seule-${suffix}.example`),
    );
    expect(await countIdentities(domainId)).toBe(1);

    const only = (
      await db
        .select()
        .from(domainIdentities)
        .where(eq(domainIdentities.domainId, domainId))
    )[0];

    /* **Le geste est muet** : rien ne lève, rien ne revient. C'est le décompte
       qui dit s'il a porté — et c'est exactement pourquoi l'étape témoin est
       indispensable ici. */
    await removeDomainIdentity(domainId, only!.id);
    expect(await countIdentities(domainId)).toBe(1);

    /* L'étape témoin : une seconde identité posée, le **même** retrait porte. */
    await addDomainIdentity(
      domainId,
      EMPTY_IDENTITY,
      identityForm(`seconde-${suffix}.example`),
    );
    expect(await countIdentities(domainId)).toBe(2);

    await removeDomainIdentity(domainId, only!.id);
    expect(await countIdentities(domainId)).toBe(1);
  });

  test("un responsable de domaine ne retire aucune identité", async () => {
    asSuperAdministrator();
    const domainId = await seedDomain("retrait-sans-droit");
    await addDomainIdentity(
      domainId,
      EMPTY_IDENTITY,
      identityForm(`retrait-a-${suffix}.example`),
    );
    await addDomainIdentity(
      domainId,
      EMPTY_IDENTITY,
      identityForm(`retrait-b-${suffix}.example`),
    );
    const rows = await db
      .select()
      .from(domainIdentities)
      .where(eq(domainIdentities.domainId, domainId));
    expect(rows).toHaveLength(2);

    asDomainManager();
    await expect(removeDomainIdentity(domainId, rows[0]!.id)).rejects.toThrow(
      `${REDIRECT}/auth/acces`,
    );
    expect(await countIdentities(domainId)).toBe(2);
  });
});

describe("le premier responsable ne se désigne qu'une fois", () => {
  /**
   * **La mesure 3 de la fiche**, et son extension.
   *
   * `ALREADY_STAFFED` refusait un second compte ; T11.4 refuse aussi une
   * seconde désignation **tant qu'une invitation attend** — sans quoi deux
   * liens ouvriraient le même premier compte, et n'en révoquer qu'un laisserait
   * l'autre valide. Le seul chemin est de révoquer, puis de redésigner.
   */
  test("une seconde désignation est refusée tant qu'une invitation attend", async () => {
    asSuperAdministrator();
    const domainId = await seedDomain("second-responsable");
    expect(await countPersons(domainId)).toBe(0);

    const first = await designateDomainManager(
      domainId,
      EMPTY_MANAGER,
      managerForm(`Première ${suffix}`, `premiere.${suffix}@acme.test`),
    );
    expect(first.link).toContain("/invitation/");

    /* **L'administrateur naît sans accès** (arbitrage (9)) : une personne, une
       invitation vivante, et aucun compte. */
    expect(await countPersons(domainId)).toBe(1);
    expect(await countAccounts(domainId)).toBe(0);
    expect(await pendingInvitations(domainId)).toHaveLength(1);

    const refused = await designateDomainManager(
      domainId,
      EMPTY_MANAGER,
      managerForm(`Seconde ${suffix}`, `seconde.${suffix}@acme.test`),
    );
    expect(refused.link).toBeUndefined();
    expect(refused.message).toContain("invitation est déjà en attente");

    /* **Le décompte en base tranche** : rien de la seconde n'a été écrit. */
    expect(await countPersons(domainId)).toBe(1);
    expect(await listInvitations(domainId)).toHaveLength(1);

    /* Révoquée, la place se libère — et la ligne reste, comme une trace. */
    await revokeDomainInvitation(domainId);
    expect(await pendingInvitations(domainId)).toHaveLength(0);
    expect(await listInvitations(domainId)).toHaveLength(1);

    const second = await designateDomainManager(
      domainId,
      EMPTY_MANAGER,
      managerForm(`Seconde ${suffix}`, `seconde.${suffix}@acme.test`),
    );
    expect(second.link).toContain("/invitation/");
    expect(await countPersons(domainId)).toBe(2);
    expect(await pendingInvitations(domainId)).toHaveLength(1);
    expect(await listInvitations(domainId)).toHaveLength(2);
  });

  /** Un compte vivant referme le geste pour de bon : la suite se passe dedans. */
  test("un compte vivant refuse la désignation, invitation ou pas", async () => {
    asSuperAdministrator();
    const domainId = await seedDomain("deja-un-compte");

    await db.insert(persons).values({
      domainId,
      fullName: `Compte ${suffix}`,
      email: `compte.${suffix}@acme.test`,
      source: "manual",
      kind: "center",
      hasAccess: true,
      domainRole: "domain_manager",
    });

    const refused = await designateDomainManager(
      domainId,
      EMPTY_MANAGER,
      managerForm(`Seconde ${suffix}`, `seconde2.${suffix}@acme.test`),
    );
    expect(refused.link).toBeUndefined();
    expect(refused.message).toContain("déjà un compte");
    expect(await countPersons(domainId)).toBe(1);
    expect(await listInvitations(domainId)).toHaveLength(0);
  });

  test("un responsable de domaine n'en désigne aucun", async () => {
    asSuperAdministrator();
    const domainId = await seedDomain("responsable-sans-droit");

    asDomainManager();
    await expect(
      designateDomainManager(
        domainId,
        EMPTY_MANAGER,
        managerForm(`Forgée ${suffix}`, `forgee.${suffix}@acme.test`),
      ),
    ).rejects.toThrow(`${REDIRECT}/auth/acces`);
    expect(await countPersons(domainId)).toBe(0);

    /* L'étape témoin : la même charge, sous l'autorité, écrit. */
    asSuperAdministrator();
    const witness = await designateDomainManager(
      domainId,
      EMPTY_MANAGER,
      managerForm(`Forgée ${suffix}`, `forgee.${suffix}@acme.test`),
    );
    expect(witness.link).toContain("/invitation/");
    expect(await countPersons(domainId)).toBe(1);
    expect(await pendingInvitations(domainId)).toHaveLength(1);
  });
});

/* ==========================================================================
   La révocation de l'invitation d'amorçage — T11.4
   ========================================================================== */

describe("l'invitation d'amorçage se révoque, et par le seul chemin qui existe", () => {
  /**
   * **Le droit s'éprouve par l'action**, avec son étape témoin : sans elle, un
   * décompte inchangé ne distinguerait pas un refus d'un geste sans objet.
   */
  test("seul le super administrateur révoque, et rien d'autre ne bouge", async () => {
    asSuperAdministrator();
    const domainId = await seedDomain("revocation-droit");
    await designateDomainManager(
      domainId,
      EMPTY_MANAGER,
      managerForm(`Invitée ${suffix}`, `invitee.${suffix}@acme.test`),
    );
    expect(await pendingInvitations(domainId)).toHaveLength(1);

    asDomainManager();
    await expect(revokeDomainInvitation(domainId)).rejects.toThrow(
      `${REDIRECT}/auth/acces`,
    );
    /* **Le décompte en base tranche**, jamais la levée. */
    expect(await pendingInvitations(domainId)).toHaveLength(1);

    asSuperAdministrator();
    await revokeDomainInvitation(domainId);
    expect(await pendingInvitations(domainId)).toHaveLength(0);

    /* **Rien ne s'efface** (règle 4) : une date de plus sur la ligne, et la
       personne invitée reste référencée. */
    const [row] = await listInvitations(domainId);
    expect(row?.revokedAt).not.toBeNull();
    expect(row?.acceptedAt).toBeNull();
    expect(await countPersons(domainId)).toBe(1);
  });

  /** Une seconde révocation ne récrit pas la date de la première. */
  test("une révocation sans objet n'écrit rien", async () => {
    asSuperAdministrator();
    const domainId = await seedDomain("revocation-sans-objet");

    /* Sans invitation : le geste est sans objet, et muet. */
    await revokeDomainInvitation(domainId);
    expect(await listInvitations(domainId)).toHaveLength(0);

    await designateDomainManager(
      domainId,
      EMPTY_MANAGER,
      managerForm(`Invitée ${suffix}`, `invitee2.${suffix}@acme.test`),
    );
    await revokeDomainInvitation(domainId);
    const first = (await listInvitations(domainId))[0]?.revokedAt;

    await revokeDomainInvitation(domainId);
    expect((await listInvitations(domainId))[0]?.revokedAt?.getTime()).toBe(
      first?.getTime(),
    );
  });

  /**
   * **La frontière de l'écran** : dès qu'un compte vivant existe, la suite se
   * passe à l'intérieur du domaine — c'est `revokeInvitation` de `/equipe`, et
   * son responsable. Le super administrateur amorce, il n'administre pas les
   * invitations d'une entreprise ouverte.
   */
  test("un domaine ouvert ne laisse plus révoquer depuis cet écran", async () => {
    asSuperAdministrator();
    const domainId = await seedDomain("revocation-domaine-ouvert");

    const invited = await db
      .insert(persons)
      .values({
        domainId,
        fullName: `Invitée ${suffix}`,
        email: `invitee3.${suffix}@acme.test`,
        source: "manual",
        kind: "center",
      })
      .returning();

    await db.insert(invitations).values({
      domainId,
      personId: invited[0]!.id,
      email: `invitee3.${suffix}@acme.test`,
      role: "member",
      tokenHash: `hash-domaine-ouvert-${suffix}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await db.insert(persons).values({
      domainId,
      fullName: `Compte ${suffix}`,
      email: `compte-ouvert.${suffix}@acme.test`,
      source: "manual",
      kind: "center",
      hasAccess: true,
      domainRole: "domain_manager",
    });

    await revokeDomainInvitation(domainId);
    expect(await pendingInvitations(domainId)).toHaveLength(1);
  });
});

/* ==========================================================================
   La boucle entière — la seule mesure qui prouve que l'écran sert à quelque chose
   ========================================================================== */

describe("une entreprise créée par l'écran devient joignable", () => {
  /**
   * **Le parcours entier, et c'est la seule mesure qui prouve que C11 sert.**
   *
   * *Super Admin crée un domaine → désigne son administrateur → l'administrateur
   * reçoit une invitation → connexion en SSO → accès à son domaine.* Les cinq
   * maillons se mesurent ici, **en base** et jamais sur un code de retour : la
   * création écrit quatre tables, le lien porte le seul clair du jeton, et
   * `redeemInvitation` — appelée sur des claims forgés, comme le rappel du
   * fournisseur le ferait — pose le couple que la base refuse à moitié.
   */
  test("de la création au compte, en un geste et une acceptation", async () => {
    asSuperAdministrator();

    const name = `__0__test__domaines__boucle__${suffix}`;
    const value = `boucle-${suffix}.example`;
    const email = `admin.${suffix}@${value}`;

    const created_state = await createDomain(
      EMPTY_DOMAIN,
      domainForm(name, value),
    );
    expect(created_state.link).toContain("/invitation/");
    /* **Sans clé d'envoi, rien ne part et rien ne casse** (T11.3) : le lien
       s'affiche, et c'est l'état de cet environnement. */
    expect(created_state.sent).toBe(false);

    const row = (
      await db.select().from(domains).where(eq(domains.name, name))
    )[0];
    created.push(row!.id);
    const domainId = row!.id;

    /* La description descend en base : c'est la seule colonne que T11.4 ajoute. */
    expect(row?.description).toBe(`Ce que fait ${name}.`);

    /* **L'identité est écrite dans la foulée** : c'est elle qui fait que le
       jeton d'un compte de cette entreprise désignera ce domaine (règles
       d'entrée 3 et 5). */
    expect(await countIdentities(domainId)).toBe(1);

    /* **L'administrateur naît sans accès** (arbitrage (9)), et son invitation
       l'attend. `sent_at` est nul : aucun courriel n'est parti. */
    expect(await countPersons(domainId)).toBe(1);
    expect(await countAccounts(domainId)).toBe(0);

    const [invitation] = await pendingInvitations(domainId);
    expect(invitation).toMatchObject({
      email,
      role: "domain_manager",
      sentAt: null,
      acceptedAt: null,
      revokedAt: null,
    });
    /* **Le clair ne descend jamais en base** : seule l'empreinte y est, et le
       lien rendu la produit. */
    expect(invitation?.tokenHash).toBe(
      hashInvitationToken(tokenOf(created_state.link!)),
    );

    /* Et voici ce que la liste dit de cette entreprise : elle est désignée,
       elle n'est pas encore ouverte, et une invitation attend. */
    const grant = {
      kind: "super_admin",
      superAdminId: f.superAdminId,
    } satisfies SuperAdminGrant;

    const listed = async () =>
      (await asSuperAdmin(grant).listDomainsForAdmin()).find(
        (candidate) => candidate.id === domainId,
      );

    expect(await listed()).toMatchObject({
      hasIdentity: true,
      hasAccount: false,
      hasPendingInvitation: true,
    });

    /* **Le SSO passe, et c'est lui qui ouvre l'accès.** Les claims sont ceux
       qu'un fournisseur rend : une adresse **vérifiée**, et le `hd` de
       l'entreprise. Le domaine se réinterroge sur ce `hd`, jamais sur
       l'invitation — *le domaine vient du jeton, et de lui seul*. */
    const outcome = await redeemInvitation(tokenOf(created_state.link!), {
      provider: "google",
      subject: `sub-${suffix}`,
      email,
      enterprise: value,
    });

    expect(outcome.refused).toBeUndefined();
    expect(outcome.granted).toMatchObject({ kind: "person", domainId });

    /* **La mesure qui compte** : le compte porte les deux colonnes ensemble —
       `persons_role_requires_access` refuse l'une sans l'autre —, et
       l'invitation est datée. */
    const account = (
      await db.select().from(persons).where(eq(persons.domainId, domainId))
    )[0];
    expect(account).toMatchObject({
      hasAccess: true,
      domainRole: "domain_manager",
      source: "manual",
      kind: "center",
      email,
    });

    expect((await listInvitations(domainId))[0]?.acceptedAt).not.toBeNull();

    /* L'entreprise est ouverte, et la liste cesse de dire qu'on l'attend. */
    expect(await listed()).toMatchObject({
      hasAccount: true,
      hasPendingInvitation: false,
    });

    /* **Le geste laisse une trace, et son acteur est nul** : un super
       administrateur n'a pas de ligne `persons`. L'écran lit « l'amorçage »,
       ce qui est exactement ce dont il s'agit. */
    const trace = await db
      .select()
      .from(events)
      .where(eq(events.domainId, domainId));
    expect(trace).toHaveLength(1);
    expect(trace[0]).toMatchObject({
      verb: "created",
      targetType: "person",
      targetId: account!.id,
      actorId: null,
    });

    /* La boucle se referme sur `listAccounts` : ce compte peut se connecter, et
       c'est tout l'objet de l'écran. */
    const { listAccounts } = await import("@/lib/auth/session");
    expect((await listAccounts(domainId)).map((one) => one.id)).toEqual([
      account!.id,
    ]);
  });

  /**
   * **La mesure 2 de la fiche** — l'adresse hors du nom de domaine.
   *
   * **Rien n'est écrit** : ni domaine, ni identité, ni personne, ni invitation.
   * *Un refus qui aurait déjà créé le domaine serait le pire des deux*, le geste
   * n'étant pas atomique (dette de T3.6) — d'où la confrontation avant la
   * première écriture.
   */
  test("une adresse hors du nom de domaine est refusée, et rien n'est écrit", async () => {
    asSuperAdministrator();

    const name = `__0__test__domaines__adresse-hors__${suffix}`;
    const value = `adresse-hors-${suffix}.example`;

    expect(await countDomains(name)).toBe(0);

    const refused = await createDomain(
      EMPTY_DOMAIN,
      domainForm(name, value, `admin.${suffix}@gmail.com`),
    );

    expect(refused.link).toBeUndefined();
    expect(refused.errors.managerEmail).toContain(`@${value}`);
    /* **Le décompte en base tranche**, et il porte sur les quatre tables. */
    expect(await countDomains(name)).toBe(0);
    expect(
      await db
        .select()
        .from(domainIdentities)
        .where(eq(domainIdentities.value, value)),
    ).toHaveLength(0);
    expect(
      await db
        .select()
        .from(persons)
        .where(eq(persons.email, `admin.${suffix}@gmail.com`)),
    ).toHaveLength(0);
    expect(
      await db
        .select()
        .from(invitations)
        .where(eq(invitations.email, `admin.${suffix}@gmail.com`)),
    ).toHaveLength(0);

    /* **L'étape témoin** : la même charge, l'adresse rendue à son entreprise,
       écrit les quatre lignes. */
    const witness = await createDomain(EMPTY_DOMAIN, domainForm(name, value));
    expect(witness.link).toContain("/invitation/");

    const row = (
      await db.select().from(domains).where(eq(domains.name, name))
    )[0];
    created.push(row!.id);
    expect(await countIdentities(row!.id)).toBe(1);
    expect(await countPersons(row!.id)).toBe(1);
    expect(await pendingInvitations(row!.id)).toHaveLength(1);
  });

  /**
   * **La règle se refuse au formulaire, pas à la connexion** — et elle porte
   * sur les identités **du domaine** quand la désignation vient après coup.
   */
  test("la redésignation confronte l'adresse aux identités du domaine", async () => {
    asSuperAdministrator();

    const name = `__0__test__domaines__adresse-redesignation__${suffix}`;
    const value = `adresse-redesignation-${suffix}.example`;

    const state = await createDomain(EMPTY_DOMAIN, domainForm(name, value));
    const row = (
      await db.select().from(domains).where(eq(domains.name, name))
    )[0];
    created.push(row!.id);
    const domainId = row!.id;

    expect(state.link).toContain("/invitation/");
    await revokeDomainInvitation(domainId);

    const refused = await designateDomainManager(
      domainId,
      EMPTY_MANAGER,
      managerForm(`Hors domaine ${suffix}`, `hors.${suffix}@gmail.com`),
    );
    expect(refused.link).toBeUndefined();
    expect(refused.errors.email).toContain(`@${value}`);
    expect(await countPersons(domainId)).toBe(1);

    /* L'étape témoin, sur la même charge à l'adresse près. */
    const witness = await designateDomainManager(
      domainId,
      EMPTY_MANAGER,
      managerForm(`Hors domaine ${suffix}`, `admin2.${suffix}@${value}`),
    );
    expect(witness.link).toContain("/invitation/");
    expect(await countPersons(domainId)).toBe(2);
  });
});

/* ==========================================================================
   L'amorçage — T9.5
   ========================================================================== */

/**
 * **Ce que T9.4 laissait vide.** L'écran créait une entreprise sans un métier,
 * sans un statut, sans un type d'activité : elle naissait inutilisable. Ce que
 * `docs/04` §2 demande — *« créer un domaine déclenche l'amorçage de ses
 * référentiels par défaut »* — se mesure ici, **sur le chemin de l'écran** et
 * non sur celui du script.
 *
 * **Le décompte est écrit en clair**, et c'est voulu : `lib/db/bootstrap.test.ts`
 * le lit sur les constantes du module, donc une ligne retirée y resterait
 * cohérente. Ici, elle fait tomber un nombre.
 */
describe("un domaine créé par l'écran naît utilisable", () => {
  /** Les huit référentiels, et rien d'autre : `entities` n'en est pas. */
  const REFERENTIALS = {
    jobs: 6,
    skills: 11,
    skill_levels: 4,
    approaches: 7,
    project_statuses: 4,
    tools: 7,
    activity_types: 25,
    starters: 4,
  } as const;

  const TABLES = {
    jobs,
    skills,
    skill_levels: skillLevels,
    approaches,
    project_statuses: projectStatuses,
    tools,
    activity_types: activityTypes,
    starters,
  };

  const countReferentials = async (
    domainId: string,
  ): Promise<Record<keyof typeof TABLES, number>> => {
    const counts = {} as Record<keyof typeof TABLES, number>;
    for (const [name, table] of Object.entries(TABLES)) {
      counts[name as keyof typeof TABLES] = (
        await db.select().from(table).where(eq(table.domainId, domainId))
      ).length;
    }
    return counts;
  };

  /** Crée une entreprise par l'action, sous l'autorité, et rend son domaine. */
  const createByScreen = async (label: string): Promise<string> => {
    const name = `__0__test__domaines__${label}__${suffix}`;
    asSuperAdministrator();
    const state = await createDomain(
      EMPTY_DOMAIN,
      domainForm(name, `${label}-${suffix}.example`),
    );
    expect(state.link).toContain("/invitation/");

    const row = (
      await db.select().from(domains).where(eq(domains.name, name))
    )[0];
    created.push(row!.id);
    return row!.id;
  };

  test("il porte ses huit référentiels, soixante-huit lignes", async () => {
    const domainId = await createByScreen("amorcage");

    const counts = await countReferentials(domainId);
    expect(counts).toEqual(REFERENTIALS);
    expect(Object.values(counts).reduce((sum, n) => sum + n, 0)).toBe(68);
  });

  /**
   * **Aucune donnée factice, et c'est l'interdit du ticket.** Les entités sont
   * les divisions de l'entreprise ; les personnes, les produits et les projets
   * du jeu de démonstration restent au script. Une entreprise naît avec de quoi
   * saisir, jamais avec de quoi faire semblant.
   */
  /**
   * **Une personne y naît désormais, et une seule** — T11.4. L'entreprise ne
   * peut plus naître sans son administrateur : sans lui, elle serait une ligne
   * que personne ne pourrait ouvrir (règle d'entrée 6). Ce qui n'a pas bougé
   * est le reste : **aucune donnée factice**, et **aucun accès** — l'accès se
   * pose à l'acceptation (arbitrage (9)).
   */
  test("il ne porte ni entité, ni donnée du jeu de démonstration, ni aucun accès", async () => {
    const domainId = await createByScreen("sans-factice");

    expect(
      await db.select().from(entities).where(eq(entities.domainId, domainId)),
    ).toHaveLength(0);
    expect(await countPersons(domainId)).toBe(1);
    expect(await countAccounts(domainId)).toBe(0);
  });

  /** Les outils naissent nommés et sans adresse : elle appartient au client. */
  test("ses outils n'ont aucune adresse", async () => {
    const domainId = await createByScreen("outils");

    const rows = await db
      .select()
      .from(tools)
      .where(eq(tools.domainId, domainId));
    expect(rows).toHaveLength(REFERENTIALS.tools);
    expect(rows.every((row) => row.baseUrl === null)).toBe(true);
  });

  /**
   * **Deux créations successives ne partagent rien**, et c'est la propriété que
   * T8.4 a mesurée sur le script, rejouée ici sur le chemin de l'écran : chaque
   * entreprise porte les siennes, et aucune ligne ne traverse la frontière.
   */
  test("deux créations successives portent chacune les siennes", async () => {
    const one = await createByScreen("premier-amorcage");
    const two = await createByScreen("second-amorcage");

    expect(await countReferentials(one)).toEqual(REFERENTIALS);
    expect(await countReferentials(two)).toEqual(REFERENTIALS);

    const ofOne = await db.select().from(jobs).where(eq(jobs.domainId, one));
    const ofTwo = await db.select().from(jobs).where(eq(jobs.domainId, two));
    const shared = ofOne.filter((row) =>
      ofTwo.some((other) => other.id === row.id),
    );
    expect(shared).toHaveLength(0);
  });

  /**
   * **Le refus n'amorce rien non plus.** Un couple d'identité déjà pris fait
   * échouer la création *avant* toute écriture : aucune entreprise, donc aucun
   * référentiel. L'étape témoin rejoue la même forme sous une identité libre.
   */
  test("une création refusée n'amorce aucun référentiel", async () => {
    const taken = await createByScreen("couple-pris");
    const value = `couple-pris-${suffix}.example`;

    const name = `__0__test__domaines__refus-amorcage__${suffix}`;
    asSuperAdministrator();
    const refused = await createDomain(EMPTY_DOMAIN, domainForm(name, value));
    expect(refused.link).toBeUndefined();
    expect(await countDomains(name)).toBe(0);

    /* Le domaine qui tenait déjà le couple n'a pas gagné de ligne. */
    expect(await countReferentials(taken)).toEqual(REFERENTIALS);
  });
});

/* ==========================================================================
   Le journal de l'administration — T12.2

   **Deux niveaux, deux tables, et elles se lisent ensemble.** `domain_events`
   dit ce qu'on a fait *d'une* entreprise ; `events` dit ce qui s'est passé
   *dedans*. Un geste qui écrirait dans les deux ferait paraître l'administration
   des domaines dans le flux d'accueil d'une entreprise — c'est pourquoi les
   deux décomptes sont pris à chaque fois.
   ========================================================================== */

/**
 * **L'insécable s'écrit en échappement, jamais en caractère** — la leçon de
 * `lib/format.test.ts`, resservie : dans un source comme dans un navigateur,
 * l'insécable et l'espace ordinaire sont indiscernables à l'œil, et une règle
 * qu'on ne peut pas voir saute au premier copier-coller. Le fichier voisin
 * `app/(app)/administration/actions.test.ts` le pose de la même façon.
 */
const NBSP = "\u00A0";

type AdminTrace = { summary: string; superAdminId: string | null };

/** Le journal d'administration d'un domaine, lu **par le client brut**. */
async function adminJournal(domainId: string) {
  return db
    .select({
      id: domainEvents.id,
      summary: domainEvents.summary,
      superAdminId: domainEvents.superAdminId,
    })
    .from(domainEvents)
    .where(eq(domainEvents.domainId, domainId));
}

/** Les lignes d'`events` d'un domaine — celles qui ne doivent pas bouger. */
const countEvents = async (domainId: string): Promise<number> =>
  (await db.select().from(events).where(eq(events.domainId, domainId))).length;

/**
 * Ce qu'un geste vient d'écrire, **dans les deux journaux**.
 *
 * **Le delta se prend par identifiant, jamais par décompte.** Deux lignes
 * écrites dans la même milliseconde rendraient `occurred_at` incapable de les
 * ordonner, et un `slice` sur la longueur retiendrait alors la mauvaise —
 * défaut qui passe au vert le jour où il se trompe.
 */
async function traced(
  domainId: string,
  gesture: () => Promise<unknown>,
): Promise<{ admin: AdminTrace[]; events: number }> {
  const before = new Set((await adminJournal(domainId)).map((row) => row.id));
  const eventsBefore = await countEvents(domainId);

  await gesture();

  const after = await adminJournal(domainId);
  return {
    admin: after
      .filter((row) => !before.has(row.id))
      .map(({ summary, superAdminId }) => ({ summary, superAdminId })),
    events: (await countEvents(domainId)) - eventsBefore,
  };
}

/** Le domaine que l'écran vient de créer, retrouvé par son nom. */
async function createdDomain(name: string): Promise<string> {
  const row = (await db.select().from(domains).where(eq(domains.name, name)))[0];
  created.push(row!.id);
  return row!.id;
}

describe("les neuf gestes laissent chacun leur trace", () => {
  /**
   * **Un seul cas, et il parcourt les neuf.**
   *
   * Les découper en neuf cas aurait demandé neuf domaines jetables et neuf
   * amorçages de référentiels ; surtout, il aurait fallu **fabriquer** l'état
   * que chaque geste exige au lieu de l'atteindre par le geste précédent. Ici
   * l'ordre est celui d'une vie d'entreprise, et chaque étape laisse l'écran
   * dans l'état qui rend la suivante légitime.
   */
  test("une ligne par geste, la phrase mot pour mot, l'acteur nommé", async () => {
    asSuperAdministrator();

    const name = `__0__test__domaines__journal__${suffix}`;
    const identity = `journal-${suffix}.example`;
    const second = `journal-bis-${suffix}.example`;

    /* 1. La création. **La trace est posée en dernier**, après l'amorçage des
       référentiels et l'invitation : l'ordre de T11.4 n'a pas bougé. */
    const creation = await createDomain(
      EMPTY_DOMAIN,
      domainForm(name, identity),
    );
    expect(creation.link).toContain("/invitation/");

    const domainId = await createdDomain(name);
    expect(await adminJournal(domainId)).toMatchObject([
      { summary: `Entreprise créée${NBSP}: ${name}`, superAdminId: f.superAdminId },
    ]);

    /* **La ligne `person` de T11.4 est là, et elle est seule** : le geste écrit
       dans les deux tables, chacune la sienne, et jamais la même chose. */
    expect(await countEvents(domainId)).toBe(1);

    const step = async (gesture: () => Promise<unknown>) =>
      traced(domainId, gesture);

    /* 2. L'ajout d'une identité vérifiée. */
    expect(
      await step(() =>
        addDomainIdentity(domainId, EMPTY_IDENTITY, identityForm(second)),
      ),
    ).toEqual({
      admin: [
        {
          summary: `Identité vérifiée ajoutée${NBSP}: ${second}`,
          superAdminId: f.superAdminId,
        },
      ],
      events: 0,
    });

    /* 3. Le retrait — **la valeur est dans la phrase**, seule trace qui en
       reste : la ligne, elle, n'existe plus. */
    const removed = (
      await db
        .select()
        .from(domainIdentities)
        .where(
          and(
            eq(domainIdentities.domainId, domainId),
            eq(domainIdentities.value, second),
          ),
        )
    )[0];
    expect(
      await step(() => removeDomainIdentity(domainId, removed!.id)),
    ).toEqual({
      admin: [
        {
          summary: `Identité vérifiée retirée${NBSP}: ${second}`,
          superAdminId: f.superAdminId,
        },
      ],
      events: 0,
    });

    /* 4 et 5. La suspension, puis le rétablissement de l'accès. */
    expect(await step(() => suspendDomain(domainId, ...confirm()))).toEqual({
      admin: [{ summary: "Accès suspendu", superAdminId: f.superAdminId }],
      events: 0,
    });
    expect(await step(() => resumeDomain(domainId))).toEqual({
      admin: [{ summary: "Accès rétabli", superAdminId: f.superAdminId }],
      events: 0,
    });

    /* 6. La révocation — **une ligne par geste**, quand la création en avait
       laissé une invitation vivante. */
    expect(await step(() => revokeDomainInvitation(domainId))).toEqual({
      admin: [
        { summary: "Invitation d'amorçage révoquée", superAdminId: f.superAdminId },
      ],
      events: 0,
    });

    /* 7. La redésignation — **le seul chemin où elle est le geste**, et non une
       étape de la création. Elle garde sa ligne `person` dans `events`. */
    const manager = `Nouvelle ${suffix}`;
    expect(
      await step(() =>
        designateDomainManager(
          domainId,
          EMPTY_MANAGER,
          managerForm(manager, `nouvelle.${suffix}@${identity}`),
        ),
      ),
    ).toEqual({
      admin: [
        {
          summary: `Premier responsable désigné${NBSP}: ${manager}`,
          superAdminId: f.superAdminId,
        },
      ],
      events: 1,
    });

    /* 8 et 9. Le rangement, puis le rétablissement. */
    expect(await step(() => archiveDomain(domainId, ...confirm()))).toEqual({
      admin: [{ summary: "Entreprise archivée", superAdminId: f.superAdminId }],
      events: 0,
    });
    expect(await step(() => restoreDomain(domainId))).toEqual({
      admin: [{ summary: "Entreprise rétablie", superAdminId: f.superAdminId }],
      events: 0,
    });

    /* **Le décompte final tranche** : neuf gestes, neuf lignes, et deux lignes
       `events` — celles des deux désignations, que T11.4 écrivait déjà. */
    expect(await adminJournal(domainId)).toHaveLength(9);
    expect(await countEvents(domainId)).toBe(2);
  }, 60_000);
});

describe("un refus ne laisse aucune trace", () => {
  /**
   * **L'étape témoin n'est pas optionnelle.**
   *
   * Sans elle, un journal vide ne distingue pas un refus d'un geste qui
   * n'écrirait de toute façon rien : chaque cas rejoue donc **le même geste**
   * sous les conditions qui le font réussir, et vérifie qu'il écrit alors.
   */
  const silent = async (domainId: string, gesture: () => Promise<unknown>) =>
    (await traced(domainId, gesture)).admin;

  test("un identifiant qui ne désigne aucune entreprise n'écrit rien", async () => {
    asSuperAdministrator();
    const absent = crypto.randomUUID();

    /* `GONE` : la porte `openDomain` rend `null`, et rien derrière elle ne
       tourne. Le journal du **domaine de fixture** est lu, puisque aucun autre
       ne pourrait recevoir la ligne. */
    expect(
      await silent(f.domainId, () => suspendDomain(absent, ...confirm())),
    ).toEqual([]);
    expect(await silent(f.domainId, () => resumeDomain(absent))).toEqual([]);
    expect(
      await silent(f.domainId, () => archiveDomain(absent, ...confirm())),
    ).toEqual([]);
    expect(await silent(f.domainId, () => restoreDomain(absent))).toEqual([]);

    /* Le témoin : le même geste sur une entreprise qui existe écrit. */
    const domainId = await seedDomain("refus-gone-temoin");
    expect(
      await silent(domainId, () => suspendDomain(domainId, ...confirm())),
    ).toEqual([{ summary: "Accès suspendu", superAdminId: f.superAdminId }]);
  });

  test("une identité déjà prise n'écrit rien, une identité libre écrit", async () => {
    asSuperAdministrator();
    const domainId = await seedDomain("refus-identite");
    const other = await seedDomain("refus-identite-voisine");
    const taken = `refus-identite-${suffix}.example`;

    await addDomainIdentity(other, EMPTY_IDENTITY, identityForm(taken));

    /* `TAKEN` : la confrontation précède l'écriture, et le journal la suit. */
    const refused = await traced(domainId, () =>
      addDomainIdentity(domainId, EMPTY_IDENTITY, identityForm(taken)),
    );
    expect(refused.admin).toEqual([]);
    expect(refused.events).toBe(0);

    const free = `refus-identite-libre-${suffix}.example`;
    expect(
      await silent(domainId, () =>
        addDomainIdentity(domainId, EMPTY_IDENTITY, identityForm(free)),
      ),
    ).toEqual([
      {
        summary: `Identité vérifiée ajoutée${NBSP}: ${free}`,
        superAdminId: f.superAdminId,
      },
    ]);
  });

  /**
   * **Le refus « jamais la dernière » est celui qui compte le plus ici.**
   *
   * Il ne rend rien — l'action est muette —, si bien que **seul le journal
   * pourrait mentir** : une trace écrite avant le décompte dirait qu'une
   * identité a été retirée quand la base en porte toujours autant.
   */
  test("le retrait de la dernière identité n'écrit rien, celui d'une autre écrit", async () => {
    asSuperAdministrator();
    const domainId = await seedDomain("refus-derniere");
    const first = `refus-derniere-${suffix}.example`;
    await addDomainIdentity(domainId, EMPTY_IDENTITY, identityForm(first));

    const only = (
      await db
        .select()
        .from(domainIdentities)
        .where(eq(domainIdentities.domainId, domainId))
    )[0];

    expect(
      await silent(domainId, () => removeDomainIdentity(domainId, only!.id)),
    ).toEqual([]);
    expect(await countIdentities(domainId)).toBe(1);

    /* Le témoin : une seconde identité posée, le même geste porte. */
    const second = `refus-derniere-bis-${suffix}.example`;
    await addDomainIdentity(domainId, EMPTY_IDENTITY, identityForm(second));
    expect(
      await silent(domainId, () => removeDomainIdentity(domainId, only!.id)),
    ).toEqual([
      {
        summary: `Identité vérifiée retirée${NBSP}: ${first}`,
        superAdminId: f.superAdminId,
      },
    ]);
  });

  /**
   * **Une entreprise déjà rangée n'écrit rien**, et c'est la mesure de *« rien
   * n'est journalisé qui n'a pas eu lieu »* : l'action rend `{}` puis `{ok:true}`
   * selon le chemin, mais la couche, elle, rend `undefined` — et c'est ce retour
   * que la trace suit.
   */
  test("un second rangement n'écrit rien, le premier écrit", async () => {
    asSuperAdministrator();
    const domainId = await seedDomain("refus-deja-range");

    expect(
      await silent(domainId, () => archiveDomain(domainId, ...confirm())),
    ).toEqual([
      { summary: "Entreprise archivée", superAdminId: f.superAdminId },
    ]);
    expect(
      await silent(domainId, () => archiveDomain(domainId, ...confirm())),
    ).toEqual([]);

    /* Et la bascule de statut, que le rangement fige, n'écrit pas davantage. */
    expect(
      await silent(domainId, () => suspendDomain(domainId, ...confirm())),
    ).toEqual([]);
  });

  test("une révocation sans objet n'écrit rien, une révocation qui porte écrit", async () => {
    asSuperAdministrator();
    const domainId = await seedDomain("refus-revocation");

    /* Aucune invitation vivante : le geste sort sans rien toucher. */
    expect(
      await silent(domainId, () => revokeDomainInvitation(domainId)),
    ).toEqual([]);

    const value = `refus-revocation-${suffix}.example`;
    await addDomainIdentity(domainId, EMPTY_IDENTITY, identityForm(value));
    await designateDomainManager(
      domainId,
      EMPTY_MANAGER,
      managerForm(`Attendue ${suffix}`, `attendue.${suffix}@${value}`),
    );

    expect(
      await silent(domainId, () => revokeDomainInvitation(domainId)),
    ).toEqual([
      { summary: "Invitation d'amorçage révoquée", superAdminId: f.superAdminId },
    ]);
  });

  test("une désignation refusée n'écrit rien, la première écrit", async () => {
    asSuperAdministrator();
    const domainId = await seedDomain("refus-designation");
    const value = `refus-designation-${suffix}.example`;
    await addDomainIdentity(domainId, EMPTY_IDENTITY, identityForm(value));

    const designate = (label: string) =>
      designateDomainManager(
        domainId,
        EMPTY_MANAGER,
        managerForm(`${label} ${suffix}`, `${label}.${suffix}@${value}`),
      );

    /* La première porte, et elle écrit. */
    expect(await silent(domainId, () => designate("premiere"))).toEqual([
      {
        summary: `Premier responsable désigné${NBSP}: premiere ${suffix}`,
        superAdminId: f.superAdminId,
      },
    ]);

    /* `ALREADY_INVITED` : une invitation attend, rien n'est écrit. */
    expect(await silent(domainId, () => designate("seconde"))).toEqual([]);

    /* `ALREADY_STAFFED` : le compte ouvert ferme le chemin pour de bon. */
    await db
      .update(persons)
      .set({ hasAccess: true, domainRole: "domain_manager" })
      .where(eq(persons.domainId, domainId));
    expect(await silent(domainId, () => designate("troisieme"))).toEqual([]);
  });

  /**
   * **`NO_HOST` — le refus qui précède la première écriture.**
   *
   * Sans `AUTH_URL`, le lien n'aurait mené nulle part : *rien n'est
   * enregistré du tout*, et le journal doit dire la même chose que la base.
   */
  test("sans hôte, ni entreprise ni trace", async () => {
    asSuperAdministrator();
    const name = `__0__test__domaines__sans-hote__${suffix}`;
    const value = `sans-hote-${suffix}.example`;

    const host = process.env.AUTH_URL;
    delete process.env.AUTH_URL;
    try {
      const refused = await createDomain(EMPTY_DOMAIN, domainForm(name, value));
      expect(refused.message).toContain("adresse publique");
      expect(await countDomains(name)).toBe(0);
    } finally {
      process.env.AUTH_URL = host;
    }

    /* Le témoin : la **même** charge, l'hôte rendu, écrit l'entreprise et sa
       ligne. */
    const witness = await createDomain(EMPTY_DOMAIN, domainForm(name, value));
    expect(witness.link).toContain("/invitation/");
    const domainId = await createdDomain(name);
    expect(await adminJournal(domainId)).toMatchObject([
      { summary: `Entreprise créée${NBSP}: ${name}`, superAdminId: f.superAdminId },
    ]);
  }, 60_000);
});

describe("le droit s'éprouve par l'action, le journal compris", () => {
  /**
   * **Les neuf points d'entrée, frappés sans autorité.**
   *
   * *Un panneau absent du rendu n'a jamais protégé le point d'entrée HTTP qui
   * l'accompagne* : ce que T9.4 mesurait sur les tables, ce cas le mesure sur le
   * journal. Une trace écrite avant le contrôle du droit serait une fuite d'un
   * genre particulier — elle dirait qu'un geste a eu lieu, et donnerait le nom
   * d'une entreprise à qui n'a pas le droit de la connaître.
   */
  const cases = [
    ["aucun cookie", asNobody],
    ["un responsable de domaine", asDomainManager],
    ["un super administrateur archivé", asArchivedSuperAdmin],
  ] as const;

  for (const [label, become] of cases) {
    test(`${label} n'écrit aucune ligne de journal`, async () => {
      asSuperAdministrator();
      const slug = label.replace(/\s/g, "-");
      const domainId = await seedDomain(`droit-${slug}`);
      const value = `droit-${slug}-${suffix}.example`;
      await addDomainIdentity(domainId, EMPTY_IDENTITY, identityForm(value));

      const identity = (
        await db
          .select()
          .from(domainIdentities)
          .where(eq(domainIdentities.domainId, domainId))
      )[0];

      const before = await adminJournal(domainId);

      become();
      /* Les neuf, sans exception. Chacune redirige — et **la redirection ne
         prouve rien** : c'est le décompte d'après qui tranche. */
      const forbidden = [
        () =>
          createDomain(
            EMPTY_DOMAIN,
            domainForm(`__0__test__domaines__vol-${slug}__${suffix}`, value),
          ),
        () => suspendDomain(domainId, ...confirm()),
        () => resumeDomain(domainId),
        () => archiveDomain(domainId, ...confirm()),
        () => restoreDomain(domainId),
        () =>
          addDomainIdentity(
            domainId,
            EMPTY_IDENTITY,
            identityForm(`vol-${slug}-${suffix}.example`),
          ),
        () => removeDomainIdentity(domainId, identity!.id),
        () =>
          designateDomainManager(
            domainId,
            EMPTY_MANAGER,
            managerForm(`Volé ${suffix}`, `vole.${suffix}@${value}`),
          ),
        () => revokeDomainInvitation(domainId),
      ];

      for (const gesture of forbidden) {
        await expect(gesture()).rejects.toThrow(`${REDIRECT}/auth/acces`);
      }

      expect(await adminJournal(domainId)).toHaveLength(before.length);
      expect(await countEvents(domainId)).toBe(0);

      /* **L'étape témoin**, sur l'un des neuf : la même charge sous l'autorité
         écrit, et l'acteur nommé est celui qui a agi. */
      asSuperAdministrator();
      expect(
        (await traced(domainId, () => suspendDomain(domainId, ...confirm())))
          .admin,
      ).toEqual([{ summary: "Accès suspendu", superAdminId: f.superAdminId }]);
    }, 60_000);
  }
});

describe("rien n'est journalisé qui n'a pas eu lieu", () => {
  /**
   * **Les trois gestes dont la couche seule sait qu'ils n'ont rien touché.**
   *
   * Les refus du bloc précédent sortent par une condition écrite dans l'action :
   * un identifiant inconnu, une identité déjà prise, un compte déjà ouvert.
   * Ceux-ci sont d'une autre espèce — l'action va **jusqu'au bout**, appelle la
   * couche, et c'est le retour de la couche qui dit que rien n'a bougé. Sans ces
   * cas, la condition portée par chaque trace ne serait éprouvée nulle part, et
   * une trace inconditionnelle passerait au vert.
   *
   * *Mesuré le 11/09/2026 en déplaçant une trace avant l'écriture qu'elle
   * raconte : le bloc précédent ne l'a pas vue.*
   */
  const silent = async (domainId: string, gesture: () => Promise<unknown>) =>
    (await traced(domainId, gesture)).admin;

  test("rétablir l'accès d'une entreprise rangée n'écrit rien", async () => {
    asSuperAdministrator();
    const domainId = await seedDomain("sans-objet-acces");

    await suspendDomain(domainId, ...confirm());
    await archiveDomain(domainId, ...confirm());

    /* `setDomainStatus` porte un filtre `is null` sur `archived_at` et rend
       `undefined` : l'action, elle, n'a aucune condition qui l'arrête avant. */
    expect(await silent(domainId, () => resumeDomain(domainId))).toEqual([]);
    expect((await domainRow(domainId))?.status).toBe("suspended");

    /* Le témoin : l'entreprise rétablie, le même geste porte. */
    await restoreDomain(domainId);
    expect(await silent(domainId, () => resumeDomain(domainId))).toEqual([
      { summary: "Accès rétabli", superAdminId: f.superAdminId },
    ]);
  });

  test("rétablir une entreprise qui n'est pas rangée n'écrit rien", async () => {
    asSuperAdministrator();
    const domainId = await seedDomain("sans-objet-retablissement");

    /* `restore` porte un filtre `is not null` et rend `undefined` — c'est la
       leçon de `restoreEntity`, mot pour mot. */
    expect(await silent(domainId, () => restoreDomain(domainId))).toEqual([]);

    await archiveDomain(domainId, ...confirm());
    expect(await silent(domainId, () => restoreDomain(domainId))).toEqual([
      { summary: "Entreprise rétablie", superAdminId: f.superAdminId },
    ]);
  });

  test("retirer une identité d'une autre entreprise n'écrit rien", async () => {
    asSuperAdministrator();
    const domainId = await seedDomain("sans-objet-identite");
    const other = await seedDomain("sans-objet-identite-voisine");

    /* Deux identités : le décompte « jamais la dernière » ne peut pas arrêter le
       geste, et ce qui reste à éprouver est le retour d'`unlink`. */
    for (const rank of [1, 2]) {
      await addDomainIdentity(
        domainId,
        EMPTY_IDENTITY,
        identityForm(`sans-objet-${rank}-${suffix}.example`),
      );
    }
    await addDomainIdentity(
      other,
      EMPTY_IDENTITY,
      identityForm(`sans-objet-voisine-${suffix}.example`),
    );

    const foreign = (
      await db
        .select()
        .from(domainIdentities)
        .where(eq(domainIdentities.domainId, other))
    )[0];

    /* `unlink` est borné au domaine : il rend **zéro**, et la ligne de l'autre
       entreprise ne bouge pas. Une trace inconditionnelle dirait ici qu'on a
       retiré une identité qu'on n'a pas touchée. */
    expect(
      await silent(domainId, () => removeDomainIdentity(domainId, foreign!.id)),
    ).toEqual([]);
    expect(await countIdentities(domainId)).toBe(2);
    expect(await countIdentities(other)).toBe(1);

    /* Le témoin : une identité du domaine, et le geste porte. */
    const own = (
      await db
        .select()
        .from(domainIdentities)
        .where(eq(domainIdentities.domainId, domainId))
    )[0];
    expect(
      await silent(domainId, () => removeDomainIdentity(domainId, own!.id)),
    ).toEqual([
      {
        summary: `Identité vérifiée retirée${NBSP}: ${own!.value}`,
        superAdminId: f.superAdminId,
      },
    ]);
  });
});

describe("les deux adresses se rafraîchissent ensemble", () => {
  /**
   * **La fiche ne reste pas périmée quand la liste se rafraîchit** — T12.4.
   *
   * Depuis que les huit gestes se font **sur la fiche**, c'est elle qui doit
   * montrer ce qui vient d'être fait : sa ligne de journal, son état, ses trois
   * faits. Une action qui ne revaliderait que la liste renverrait sur une fiche
   * d'avant le geste — et le journal d'administration, qui est la réponse à la
   * question de cet écran, serait le dernier à la voir.
   *
   * **Un seul cas, et il parcourt les neuf**, au patron du bloc des traces :
   * l'ordre est celui d'une vie d'entreprise, et chaque étape laisse l'écran
   * dans l'état qui rend la suivante légitime. Les découper aurait demandé neuf
   * domaines jetables et neuf amorçages de référentiels.
   *
   * **Ce que le cas mesure, et ce qu'il ne mesure pas.** Il lit les adresses que
   * l'action **déclare** périmées, pas ce que Next en fait : c'est un contrat
   * d'appel, et c'est tout ce qu'un test hors serveur peut tenir. La boucle
   * réelle — un geste fait sur la fiche, sa ligne relue sur cette même fiche —
   * se mesure par sonde, dans le HTML servi.
   */
  test("chacun des neuf gestes revalide la liste et la fiche, et rien d'autre", async () => {
    asSuperAdministrator();

    const name = `__0__test__domaines__revalidation__${suffix}`;
    const identity = `revalidation-${suffix}.example`;
    const second = `revalidation-bis-${suffix}.example`;

    /* Ce qu'un geste déclare périmé, relevé autour de lui seul. Le tri range
       deux adresses dont l'ordre d'appel n'est pas une propriété. */
    const paths = async (gesture: () => Promise<unknown>) => {
      revalidated.length = 0;
      await gesture();
      return [...revalidated].sort();
    };

    /* 1. La création — **la fiche n'existait pas encore quand le geste a
       commencé**, et l'adresse qu'elle revalide est celle de l'entreprise
       qu'elle vient d'écrire. */
    const creation = await paths(() =>
      createDomain(EMPTY_DOMAIN, domainForm(name, identity)),
    );
    const domainId = await createdDomain(name);
    expect(creation).toEqual(["/domaines", `/domaines/${domainId}`]);

    const both = ["/domaines", `/domaines/${domainId}`];

    /* 2 et 3. L'identité vérifiée, ajoutée puis retirée. */
    expect(
      await paths(() =>
        addDomainIdentity(domainId, EMPTY_IDENTITY, identityForm(second)),
      ),
    ).toEqual(both);

    const removed = (
      await db
        .select()
        .from(domainIdentities)
        .where(
          and(
            eq(domainIdentities.domainId, domainId),
            eq(domainIdentities.value, second),
          ),
        )
    )[0];
    expect(
      await paths(() => removeDomainIdentity(domainId, removed!.id)),
    ).toEqual(both);

    /* 4 et 5. La suspension, puis le rétablissement de l'accès. */
    expect(await paths(() => suspendDomain(domainId, ...confirm()))).toEqual(
      both,
    );
    expect(await paths(() => resumeDomain(domainId))).toEqual(both);

    /* 6 et 7. La révocation de l'invitation d'amorçage, puis la redésignation. */
    expect(await paths(() => revokeDomainInvitation(domainId))).toEqual(both);
    expect(
      await paths(() =>
        designateDomainManager(
          domainId,
          EMPTY_MANAGER,
          managerForm(`Nouvelle ${suffix}`, `revalide.${suffix}@${identity}`),
        ),
      ),
    ).toEqual(both);

    /* 8 et 9. Le rangement, puis le rétablissement. */
    expect(await paths(() => archiveDomain(domainId, ...confirm()))).toEqual(
      both,
    );
    expect(await paths(() => restoreDomain(domainId))).toEqual(both);
  }, 60_000);

  /**
   * **Un refus ne revalide rien**, et c'est la contre-épreuve du cas ci-dessus :
   * sans elle, une revalidation inconditionnelle — posée avant le geste plutôt
   * qu'après — passerait au vert sur les neuf lignes.
   *
   * Les trois refus choisis sortent par trois portes différentes : l'autorité,
   * l'entreprise inconnue, et la forme de l'identifiant.
   */
  test("un geste refusé ne déclare aucune adresse périmée", async () => {
    const domainId = await seedDomain("revalidation-refus");

    /* Sans autorité : `requireSuperAdmin` redirige, et rien n'est appelé. */
    asDomainManager();
    revalidated.length = 0;
    await expect(restoreDomain(domainId)).rejects.toThrow(REDIRECT);
    expect(revalidated).toEqual([]);

    asSuperAdministrator();

    /* Une entreprise qui n'existe pas, et un identifiant qui n'est pas un
       UUID : `openDomain` rend `null` dans les deux cas, et l'action sort avant
       toute écriture comme avant toute revalidation. */
    revalidated.length = 0;
    await restoreDomain("00000000-0000-4000-8000-000000000000");
    await restoreDomain("pas-un-uuid");
    expect(revalidated).toEqual([]);

    /* **L'étape témoin** : la même charge, sur l'entreprise qui existe et sous
       l'autorité, déclare bien ses deux adresses. */
    revalidated.length = 0;
    await archiveDomain(domainId, ...confirm());
    await restoreDomain(domainId);
    expect([...new Set(revalidated)].sort()).toEqual([
      "/domaines",
      `/domaines/${domainId}`,
    ]);
  }, 60_000);
});

/* ==========================================================================
   La suppression d'une entreprise vide — 12/09/2026
   ========================================================================== */

describe("une entreprise vide s'efface, et elle seule", () => {
  /**
   * Les treize tables de l'amorçage, **plus la ligne du domaine**.
   *
   * L'ordre est celui d'`afterAll`, et il n'est pas décoratif : les décomptes
   * se lisent par le client brut, mais une liste qui oublierait une table
   * laisserait passer une purge incomplète.
   */
  const leftovers = async (domainId: string): Promise<string[]> => {
    const found: string[] = [];
    for (const [name, table] of [
      ["events", events],
      ["domain_events", domainEvents],
      ["invitations", invitations],
      ["persons", persons],
      ["starters", starters],
      ["activity_types", activityTypes],
      ["tools", tools],
      ["project_statuses", projectStatuses],
      ["approaches", approaches],
      ["skill_levels", skillLevels],
      ["skills", skills],
      ["jobs", jobs],
      ["entities", entities],
      ["domain_identities", domainIdentities],
    ] as const) {
      const rows = await db
        .select()
        .from(table)
        .where(eq(table.domainId, domainId));
      if (rows.length > 0) found.push(name);
    }
    if ((await db.select().from(domains).where(eq(domains.id, domainId))).length)
      found.push("domains");
    return found;
  };

  /** Une entreprise créée par l'écran : quatre tables, huit référentiels. */
  const openedDomain = async (label: string): Promise<string> => {
    asSuperAdministrator();
    const name = `__0__test__domaines__${label}__${suffix}`;
    await createDomain(
      EMPTY_DOMAIN,
      domainForm(name, `${label}-${suffix}.example`),
    );
    return createdDomain(name);
  };

  /**
   * **Les trois identités, et l'étape témoin.** Sans le second temps, un
   * décompte inchangé ne distinguerait pas un refus d'une charge qui n'aurait de
   * toute façon rien écrit.
   *
   * **Le décompte en base tranche, jamais le code de retour** : les deux
   * premières identités sortent par une redirection (`requireSuperAdmin`), et
   * une redirection ne prouve pas qu'aucune ligne n'a été effacée.
   */
  test("seul un super administrateur en exercice efface une entreprise", async () => {
    const domainId = await openedDomain("suppression-droit");

    const before = await leftovers(domainId);
    expect(before).toContain("domains");

    for (const become of [asNobody, asDomainManager, asArchivedSuperAdmin]) {
      become();
      await expect(deleteDomain(domainId, ...confirm())).rejects.toThrow(
        REDIRECT,
      );
      expect(await leftovers(domainId)).toEqual(before);
    }

    /* L'étape témoin : la **même** charge, sous l'autorité. */
    asSuperAdministrator();
    await expect(deleteDomain(domainId, ...confirm())).rejects.toThrow(
      `${REDIRECT}/domaines`,
    );
    expect(await leftovers(domainId)).toEqual([]);
  }, 60_000);

  /**
   * **Le tour complet**, et c'est le seul cas qui dise que le geste sert : une
   * entreprise créée par l'écran — quatre tables, huit référentiels, une
   * invitation, un journal — ne laisse **rien** derrière elle.
   */
  test("une entreprise amorcée s'efface entièrement, journal compris", async () => {
    const domainId = await openedDomain("suppression-tour");

    expect((await leftovers(domainId)).sort()).toEqual(
      [
        "activity_types",
        "approaches",
        "domain_events",
        "domain_identities",
        "domains",
        "events",
        "invitations",
        "jobs",
        "persons",
        "project_statuses",
        "skill_levels",
        "skills",
        "starters",
        "tools",
      ].sort(),
    );

    await expect(deleteDomain(domainId, ...confirm())).rejects.toThrow(
      `${REDIRECT}/domaines`,
    );

    expect(await leftovers(domainId)).toEqual([]);

    /* **Le journal part avec l'entreprise**, et rien ne le remplace : c'est la
       disparition admise de `deleteProject`. Le geste est donc le seul des dix
       à ne laisser aucune trace, et c'est structurel — `domain_events.domain_id`
       est `not null`. */
    expect(
      (
        await db
          .select()
          .from(domainEvents)
          .where(eq(domainEvents.domainId, domainId))
      ).length,
    ).toBe(0);
  }, 60_000);

  /**
   * **Les deux refus, et ils ne disent pas la même chose.** L'un parle d'une
   * main qui a saisi, l'autre de quelqu'un qui est entré — et chacun nomme le
   * geste qui reste : *archivez-la*.
   */
  test("une entreprise saisie ou habitée refuse, et rien n'est effacé", async () => {
    /* (1) Une entité — la table qu'aucun amorçage n'écrit. */
    const saisie = await openedDomain("suppression-saisie");
    const before = await leftovers(saisie);

    await db
      .insert(entities)
      .values({ domainId: saisie, label: `Division ${suffix}` });

    const refusedContent = await deleteDomain(saisie, ...confirm());
    expect(refusedContent.ok).toBeUndefined();
    expect(refusedContent.message).toContain("données saisies");
    expect(refusedContent.message).toContain("Archivez-la");
    expect((await leftovers(saisie)).sort()).toEqual(
      [...before, "entities"].sort(),
    );

    /* (2) Un compte vivant : l'invitation d'amorçage acceptée. */
    const habitee = await openedDomain("suppression-habitee");
    const invited = (
      await db.select().from(persons).where(eq(persons.domainId, habitee))
    )[0];
    await db
      .update(persons)
      .set({ hasAccess: true, domainRole: "domain_manager" })
      .where(eq(persons.id, invited!.id));

    const refusedAccount = await deleteDomain(habitee, ...confirm());
    expect(refusedAccount.ok).toBeUndefined();
    expect(refusedAccount.message).toContain("Quelqu'un est entré");
    expect(await leftovers(habitee)).toContain("domains");
  }, 60_000);

  /**
   * **Une entreprise inconnue, et une forme qui n'est pas un UUID** : les deux
   * sortent par `openDomain`, avant toute lecture de vacuité — *une colonne
   * `uuid` interrogée avec n'importe quoi rend un 500, pas un 404*.
   */
  test("un identifiant qui ne désigne rien n'efface rien et ne lève pas", async () => {
    asSuperAdministrator();

    for (const id of ["00000000-0000-4000-8000-000000000000", "pas-un-uuid"]) {
      const state = await deleteDomain(id, ...confirm());
      expect(state.message).toBe("Cette entreprise n'existe plus.");
    }
  });

  /**
   * **La suppression ne revalide que la liste**, et c'est le seul geste des dix
   * dans ce cas : revalider la fiche ne ferait que la re-rendre en 404 derrière
   * le panneau (geste de `deleteProject`).
   *
   * **Et un refus ne revalide rien** : sans cette moitié, une revalidation
   * posée avant le geste plutôt qu'après passerait au vert.
   */
  test("la suppression déclare la liste périmée, et elle seule", async () => {
    const refused = await openedDomain("suppression-adresse-refus");
    await db
      .insert(entities)
      .values({ domainId: refused, label: `Division ${suffix}` });

    revalidated.length = 0;
    await deleteDomain(refused, ...confirm());
    expect(revalidated).toEqual([]);

    const domainId = await openedDomain("suppression-adresse");
    revalidated.length = 0;
    await expect(deleteDomain(domainId, ...confirm())).rejects.toThrow(REDIRECT);
    expect(revalidated).toEqual(["/domaines"]);
  }, 60_000);
});
