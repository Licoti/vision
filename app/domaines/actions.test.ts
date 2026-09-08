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
  domainIdentities,
  domains,
  entities,
  events,
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

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

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
  designateDomainManager,
  removeDomainIdentity,
  restoreDomain,
  resumeDomain,
  suspendDomain,
} = await import("./actions");

const suffix = Math.random().toString(36).slice(2, 10);

/* ==========================================================================
   Les charges, telles qu'une soumission les fait
   ========================================================================== */

function domainForm(name: string, identityValue: string): FormData {
  const data = new FormData();
  data.append("name", name);
  data.append("competenceCenterName", `Centre ${suffix}`);
  data.append("provider", "google");
  data.append("identityValue", identityValue);
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
      expect(witness.ok).toBe(true);
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
    expect((await createDomain(EMPTY_DOMAIN, domainForm(first, value))).ok).toBe(
      true,
    );
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

    expect(refused.ok).toBeUndefined();
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
  test("un second est refusé, et aucun compte n'est écrit", async () => {
    asSuperAdministrator();
    const domainId = await seedDomain("second-responsable");
    expect(await countAccounts(domainId)).toBe(0);

    const first = await designateDomainManager(
      domainId,
      EMPTY_MANAGER,
      managerForm(`Première ${suffix}`, `premiere.${suffix}@acme.test`),
    );
    expect(first.ok).toBe(true);
    expect(await countAccounts(domainId)).toBe(1);

    const refused = await designateDomainManager(
      domainId,
      EMPTY_MANAGER,
      managerForm(`Seconde ${suffix}`, `seconde.${suffix}@acme.test`),
    );
    expect(refused.ok).toBeUndefined();
    expect(refused.message).toContain("déjà un compte");
    expect(await countAccounts(domainId)).toBe(1);
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
    expect(await countAccounts(domainId)).toBe(0);

    /* L'étape témoin : la même charge, sous l'autorité, écrit. */
    asSuperAdministrator();
    const witness = await designateDomainManager(
      domainId,
      EMPTY_MANAGER,
      managerForm(`Forgée ${suffix}`, `forgee.${suffix}@acme.test`),
    );
    expect(witness.ok).toBe(true);
    expect(await countAccounts(domainId)).toBe(1);
  });
});

/* ==========================================================================
   La boucle entière — la seule mesure qui prouve que l'écran sert à quelque chose
   ========================================================================== */

describe("une entreprise créée par l'écran devient joignable", () => {
  test("de la création au compte, en trois gestes et sans script", async () => {
    asSuperAdministrator();

    const name = `__0__test__domaines__boucle__${suffix}`;
    const value = `boucle-${suffix}.example`;

    expect((await createDomain(EMPTY_DOMAIN, domainForm(name, value))).ok).toBe(
      true,
    );
    const row = (
      await db.select().from(domains).where(eq(domains.name, name))
    )[0];
    created.push(row!.id);
    const domainId = row!.id;

    /* **L'identité est écrite dans la foulée** : c'est elle qui fait que le
       jeton d'un compte de cette entreprise désignera ce domaine (règles
       d'entrée 3 et 5). */
    expect(await countIdentities(domainId)).toBe(1);

    /* Et voici ce que la liste dit d'une entreprise neuve : elle est désignée,
       elle n'est pas encore ouverte. */
    const before = (await asSuperAdmin({
      kind: "super_admin",
      superAdminId: f.superAdminId,
    } satisfies SuperAdminGrant).listDomainsForAdmin()).find(
      (candidate) => candidate.id === domainId,
    );
    expect(before).toMatchObject({ hasIdentity: true, hasAccount: false });

    expect(
      (
        await designateDomainManager(
          domainId,
          EMPTY_MANAGER,
          managerForm(`Camille ${suffix}`, `camille.${suffix}@acme.test`),
        )
      ).ok,
    ).toBe(true);

    /* **La mesure qui compte** : le compte posé porte les deux colonnes
       ensemble — `persons_role_requires_access` refuse l'une sans l'autre —,
       et l'entreprise devient joignable. */
    const account = (
      await db.select().from(persons).where(eq(persons.domainId, domainId))
    )[0];
    expect(account).toMatchObject({
      hasAccess: true,
      domainRole: "domain_manager",
      source: "manual",
      kind: "center",
      email: `camille.${suffix}@acme.test`,
    });

    const after = (await asSuperAdmin({
      kind: "super_admin",
      superAdminId: f.superAdminId,
    } satisfies SuperAdminGrant).listDomainsForAdmin()).find(
      (candidate) => candidate.id === domainId,
    );
    expect(after?.hasAccount).toBe(true);

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

    /* La boucle se referme sur `listAccounts` : ce compte pourrait se
       connecter, et c'est tout l'objet de l'écran. */
    const { listAccounts } = await import("@/lib/auth/session");
    expect((await listAccounts(domainId)).map((one) => one.id)).toEqual([
      account!.id,
    ]);
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
    expect(state.ok).toBe(true);

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
  test("il ne porte ni entité, ni personne, ni aucune donnée du jeu de démonstration", async () => {
    const domainId = await createByScreen("sans-factice");

    expect(
      await db.select().from(entities).where(eq(entities.domainId, domainId)),
    ).toHaveLength(0);
    expect(
      await db.select().from(persons).where(eq(persons.domainId, domainId)),
    ).toHaveLength(0);
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
    expect(refused.ok).toBeUndefined();
    expect(await countDomains(name)).toBe(0);

    /* Le domaine qui tenait déjà le couple n'a pas gagné de ligne. */
    expect(await countReferentials(taken)).toEqual(REFERENTIALS);
  });
});
