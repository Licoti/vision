/**
 * Les tests du journal des gestes du projet — T6.1.
 *
 * **Le critère se compte en base**, l'écran ne portant encore rien : après
 * chaque geste, une ligne d'`events` et une seule, avec son verbe, son
 * `target_type`, son `target_id`, son acteur et sa phrase. Décompte avant et
 * après, sur les cinq gestes.
 *
 * **Le droit s'éprouve par l'action.** `CLAUDE.md` pose la discipline en toutes
 * lettres : « un panneau absent du rendu n'a jamais protégé le point d'entrée
 * HTTP qui l'accompagne ». Les deux formulaires sont en 404 pour qui n'a pas
 * `manageDomain`, et cela ne prouve rien : les identifiants liés d'une action
 * serveur sont sérialisés en clair dans un champ `$ACTION_…`, réécrivable. Le
 * cas qui compte est donc celui du contributeur — il **écrit** dans
 * l'accompagnement (T3.x) et se voit refuser l'identité : ni le projet, ni
 * l'événement.
 *
 * **Trois modules de Next sont remplacés**, dont `next/navigation` :
 * `createProject` et `updateProject` finissent par `redirect()`, qui **lève**.
 * La levée est **conservée** plutôt que supprimée — un `redirect` muet ferait
 * passer pour une écriture réussie une action qui n'a pas atteint sa dernière
 * ligne, et c'est précisément le `record` qui vit sur cette dernière ligne.
 *
 * Rien d'autre n'est simulé : la base est réelle, les portes sont les vraies,
 * `requireSession` fait son travail entier.
 */

import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import { db } from "@/lib/db/client";
import { forDomain, superAdmin, type ScopedDb } from "@/lib/db/scoped";
import {
  domains,
  entities,
  events,
  persons,
  products,
  projectMembers,
  projectStatuses,
  projects,
} from "@/lib/db/schema";
import { TEAM_FIELD_PREFIX } from "@/lib/forms/project";

/** Qui la requête prétend être. Chaque test la pose avant d'appeler l'action. */
let currentPerson: string | null = null;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "vision_person" && currentPerson
        ? { name, value: currentPerson }
        : undefined,
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const REDIRECT = "NEXT_REDIRECT:";

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`${REDIRECT}${to}`);
  },
}));

const { createProject, updateProject, archiveProject, restoreProject } =
  await import("./actions");

const suffix = Math.random().toString(36).slice(2, 10);

/**
 * L'insécable de `lib/journal.ts`, **en échappement**.
 *
 * Écrit en caractère, il est indiscernable d'une espace ordinaire dans un
 * fichier source : un test qui attendrait la seconde passerait le jour où la
 * règle sauterait, et celui qui la lirait ne saurait pas laquelle il attend.
 */
const NBSP = "\u00A0";

type Fixture = {
  domainId: string;
  scope: ScopedDb;
  managerId: string;
  contributorId: string;
  entityId: string;
  statusId: string;
  productId: string;
  /** L'accompagnement que les corrections visent. */
  projectId: string;
  /** Trois personnes à faire entrer et sortir de l'équipe. */
  camilleId: string;
  leaId: string;
  rudyId: string;
};

let f: Fixture;

beforeAll(async () => {
  const domain = await superAdmin.createDomain({
    name: `__test__journal_projets__${suffix}`,
    competenceCenterName: `Centre ${suffix}`,
  });
  const scope = forDomain({ domainId: domain.id });

  /* `persons_role_requires_access` lie les deux colonnes : un compte porte un
     rôle, une personne sans compte n'en porte pas. Les trois membres d'équipe
     n'ont pas de compte — ils n'ont rien à faire d'un droit, ils sont là pour
     entrer et sortir de l'équipe. */
  const person = (fullName: string, role: "domain_manager" | "member" | null) =>
    scope.insert(persons, {
      fullName,
      source: "manual",
      kind: "center",
      ...(role ? { hasAccess: true, domainRole: role } : { hasAccess: false }),
    });

  const manager = await person(`Responsable ${suffix}`, "domain_manager");
  const contributor = await person(`Contributeur ${suffix}`, "member");
  const camille = await person(`Camille ${suffix}`, null);
  const lea = await person(`Léa ${suffix}`, null);
  const rudy = await person(`Rudy ${suffix}`, null);

  const entity = await scope.insert(entities, { label: `Entité ${suffix}` });
  const status = await scope.insert(projectStatuses, {
    label: `En cours ${suffix}`,
    nature: "active",
  });
  const product = await scope.insert(products, {
    name: `Produit ${suffix}`,
    entityId: entity.id,
  });
  const project = await scope.insert(projects, {
    name: `Ouvert ${suffix}`,
    productId: product.id,
    statusId: status.id,
  });

  /* Contributeur **désigné** de l'accompagnement : il écrit des activités
     (T3.x) et se voit pourtant refuser l'identité du projet. Sans ce droit-là,
     le refus ne prouverait rien — il pourrait n'être qu'un droit qui manque. */
  await scope.insert(projectMembers, {
    projectId: project.id,
    personId: contributor.id,
    isContributor: true,
  });

  f = {
    domainId: domain.id,
    scope,
    managerId: manager.id,
    contributorId: contributor.id,
    entityId: entity.id,
    statusId: status.id,
    productId: product.id,
    projectId: project.id,
    camilleId: camille.id,
    leaId: lea.id,
    rudyId: rudy.id,
  };
}, 180_000);

afterAll(async () => {
  if (!f?.domainId) return;
  const tables = [
    events,
    projectMembers,
    projects,
    projectStatuses,
    products,
    entities,
    persons,
  ];
  for (const table of tables) {
    await db.delete(table).where(eq(table.domainId, f.domainId));
  }
  await db.delete(domains).where(eq(domains.id, f.domainId));
});

/* ==========================================================================
   Ce que la base porte — jamais le chemin pris
   ========================================================================== */

type EventRow = {
  verb: string;
  targetType: string;
  targetId: string | null;
  actorId: string | null;
  projectId: string | null;
  productId: string | null;
  summary: string;
};

/** Toutes les lignes du journal du domaine, de la plus ancienne à la dernière. */
async function journal(): Promise<EventRow[]> {
  return db
    .select({
      verb: events.verb,
      targetType: events.targetType,
      targetId: events.targetId,
      actorId: events.actorId,
      projectId: events.projectId,
      productId: events.productId,
      summary: events.summary,
    })
    .from(events)
    .where(eq(events.domainId, f.domainId))
    .orderBy(events.occurredAt, events.createdAt);
}

/**
 * Les lignes qu'un geste vient d'écrire — le décompte avant, le décompte après.
 *
 * **C'est le critère de la fiche, rendu réutilisable** : « une ligne d'`events`
 * et une seule ». Rendre la tranche plutôt qu'un nombre permet d'exiger le
 * nombre *et* de lire ce qu'elle porte, sans relire la table deux fois.
 */
async function written(gesture: () => Promise<unknown>): Promise<EventRow[]> {
  const before = await journal();
  try {
    await gesture();
  } catch (error) {
    // La redirection de succès lève : c'est elle qui prouve que l'action est
    // allée jusqu'à sa dernière ligne. Toute autre levée est une vraie panne.
    if (!(error instanceof Error) || !error.message.startsWith(REDIRECT)) {
      throw error;
    }
  }
  return (await journal()).slice(before.length);
}

/** Le formulaire tel que le navigateur le soumettrait. */
function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(entries)) data.append(name, value);
  return data;
}

/** Une saisie de projet valide, dont chaque test ne dérange que ce qu'il veut. */
function saisie(overrides: Record<string, string> = {}): FormData {
  return form({
    name: `Refonte du panier ${suffix}`,
    productId: f.productId,
    statusId: f.statusId,
    startedOn: "2026-01-05",
    ...overrides,
  });
}

const EMPTY = { values: {} as never, errors: {} };

/* ==========================================================================
   Les cinq gestes
   ========================================================================== */

describe("createProject", () => {
  test("écrit une ligne, et une seule", async () => {
    currentPerson = f.managerId;

    const lines = await written(() =>
      createProject(EMPTY, saisie({ name: `Créé ${suffix}` })),
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]?.verb).toBe("created");
    expect(lines[0]?.targetType).toBe("project");
    expect(lines[0]?.actorId).toBe(f.managerId);
    expect(lines[0]?.summary).toBe(
      `Accompagnement créé${NBSP}: Créé ${suffix}`,
    );

    // `target_id` désigne bien le projet écrit, et `project_id` le porte aussi.
    const created = lines[0];
    expect(created?.targetId).toBe(created?.projectId);
    // Le produit se déduit du projet : le stocker serait une seconde autorité,
    // fausse le jour où l'accompagnement change de produit (D20).
    expect(created?.productId).toBeNull();
  });

  /**
   * **Une seule ligne, équipe comprise.** La fiche ne pose le diff d'équipe que
   * sur `updateProject` : une création n'a pas d'avant à comparer, et son
   * équipe initiale fait partie du geste « créé ».
   */
  test("lier une équipe à la création n'écrit pas de seconde ligne", async () => {
    currentPerson = f.managerId;

    const lines = await written(() =>
      createProject(
        EMPTY,
        saisie({
          name: `Créé avec équipe ${suffix}`,
          [`${TEAM_FIELD_PREFIX}${f.camilleId}`]: "contributor",
          [`${TEAM_FIELD_PREFIX}${f.leaId}`]: "member",
        }),
      ),
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]?.targetType).toBe("project");
  });
});

describe("updateProject", () => {
  /**
   * **Une ligne pour le geste, jamais une par colonne.** L'équipe est resoumise
   * telle quelle : ce qui bouge est l'identité seule, et le journal n'en dit
   * qu'une chose. Une correction de formulaire qui en écrirait sept rendrait la
   * frise illisible — c'est la propriété que la fiche exige.
   */
  test("écrit une ligne, et fige le nom d'**après** le geste", async () => {
    currentPerson = f.managerId;

    const lines = await written(() =>
      updateProject(
        f.projectId,
        EMPTY,
        saisie({
          name: `Renommé ${suffix}`,
          [`${TEAM_FIELD_PREFIX}${f.contributorId}`]: "contributor",
        }),
      ),
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]?.verb).toBe("updated");
    expect(lines[0]?.targetType).toBe("project");
    expect(lines[0]?.targetId).toBe(f.projectId);
    // Le nom d'avant serait une « valeur avant », que D22 refuse.
    expect(lines[0]?.summary).toBe(
      `Accompagnement modifié${NBSP}: Renommé ${suffix}`,
    );
  });

  test("une équipe qui bouge écrit une seconde ligne, jamais une par personne", async () => {
    currentPerson = f.managerId;

    const lines = await written(() =>
      updateProject(
        f.projectId,
        EMPTY,
        saisie({
          name: `Renommé ${suffix}`,
          [`${TEAM_FIELD_PREFIX}${f.contributorId}`]: "contributor",
          [`${TEAM_FIELD_PREFIX}${f.camilleId}`]: "member",
          [`${TEAM_FIELD_PREFIX}${f.rudyId}`]: "member",
        }),
      ),
    );

    // Deux personnes arrivent : **deux** lignes en tout, pas trois.
    expect(lines).toHaveLength(2);

    const team = lines[1];
    expect(team?.verb).toBe("linked");
    expect(team?.targetType).toBe("member");
    // Un diff qui porte plusieurs personnes n'a pas de cible unique.
    expect(team?.targetId).toBeNull();
    expect(team?.projectId).toBe(f.projectId);
    expect(team?.summary).toContain("Équipe modifiée");
    expect(team?.summary).toContain(`Camille ${suffix}`);
    expect(team?.summary).toContain(`Rudy ${suffix}`);
    expect(team?.summary).toContain("rejoignent l'équipe");
  });

  test("une équipe qui ne bouge pas n'écrit aucune ligne `member`", async () => {
    currentPerson = f.managerId;

    // La même équipe que le test précédent a laissée : rien ne se déplace.
    const lines = await written(() =>
      updateProject(
        f.projectId,
        EMPTY,
        saisie({
          name: `Renommé encore ${suffix}`,
          [`${TEAM_FIELD_PREFIX}${f.contributorId}`]: "contributor",
          [`${TEAM_FIELD_PREFIX}${f.camilleId}`]: "member",
          [`${TEAM_FIELD_PREFIX}${f.rudyId}`]: "member",
        }),
      ),
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]?.targetType).toBe("project");
  });

  test("un départ et un changement de rôle tiennent en une phrase", async () => {
    currentPerson = f.managerId;

    const lines = await written(() =>
      updateProject(
        f.projectId,
        EMPTY,
        saisie({
          name: `Renommé encore ${suffix}`,
          [`${TEAM_FIELD_PREFIX}${f.contributorId}`]: "contributor",
          // Camille passe contributrice, Rudy s'en va.
          [`${TEAM_FIELD_PREFIX}${f.camilleId}`]: "contributor",
        }),
      ),
    );

    expect(lines).toHaveLength(2);
    const team = lines[1];
    expect(team?.summary).toContain(`Rudy ${suffix} la quitte`);
    expect(team?.summary).toContain(`Camille ${suffix} change de rôle`);
    expect(team?.summary).toContain(`${NBSP}; `);
  });
});

describe("archiveProject et restoreProject", () => {
  test("l'archivage écrit `archived`, le rétablissement écrit `updated`", async () => {
    currentPerson = f.managerId;

    const project = await f.scope.insert(projects, {
      name: `À ranger ${suffix}`,
      productId: f.productId,
      statusId: f.statusId,
    });

    const archived = await written(() =>
      archiveProject(project.id, {}, new FormData()),
    );
    expect(archived).toHaveLength(1);
    expect(archived[0]?.verb).toBe("archived");
    expect(archived[0]?.targetType).toBe("project");
    expect(archived[0]?.targetId).toBe(project.id);
    expect(archived[0]?.summary).toBe(
      `Accompagnement archivé${NBSP}: À ranger ${suffix}`,
    );

    const restored = await written(() => restoreProject(project.id));
    expect(restored).toHaveLength(1);
    /* Le verbe est `updated` : l'énuméré n'en porte pas de cinquième pour le
       rétablissement, et c'est la **phrase** qui distingue les deux. */
    expect(restored[0]?.verb).toBe("updated");
    expect(restored[0]?.summary).toBe(
      `Accompagnement rétabli${NBSP}: À ranger ${suffix}`,
    );
  });

  /**
   * **Rien n'est journalisé qui n'a pas eu lieu.** `archive` porte un filtre
   * `is null`, `restore` un filtre `is not null` : le second appel de chaque
   * paire ne touche aucune ligne. Sans ces deux gardes, la frise se remplirait
   * de gestes qui n'ont rien fait.
   */
  test("un geste qui ne touche rien n'écrit rien", async () => {
    currentPerson = f.managerId;

    const project = await f.scope.insert(projects, {
      name: `Déjà rangé ${suffix}`,
      productId: f.productId,
      statusId: f.statusId,
    });
    await archiveProject(project.id, {}, new FormData());

    // Archiver un accompagnement déjà archivé.
    expect(await written(() => archiveProject(project.id, {}, new FormData())))
      .toHaveLength(0);

    // Rétablir un accompagnement vivant.
    await restoreProject(project.id);
    expect(await written(() => restoreProject(project.id))).toHaveLength(0);
  });
});

/* ==========================================================================
   Le droit s'éprouve par l'action
   ========================================================================== */

describe("un contributeur n'écrit ni le projet ni l'événement", () => {
  test("`updateProject` refusé : la ligne n'a pas bougé, le journal non plus", async () => {
    currentPerson = f.contributorId;

    const [before] = await db
      .select({ name: projects.name })
      .from(projects)
      .where(eq(projects.id, f.projectId));

    let state: { message?: string } | undefined;
    const lines = await written(async () => {
      state = await updateProject(
        f.projectId,
        EMPTY,
        saisie({ name: `Forgé ${suffix}` }),
      );
    });

    // L'étape témoin : sans elle, un refus et une panne seraient indiscernables.
    expect(state?.message).toContain("réservées au responsable de domaine");

    expect(lines).toHaveLength(0);
    const [after] = await db
      .select({ name: projects.name })
      .from(projects)
      .where(eq(projects.id, f.projectId));
    expect(after?.name).toBe(before?.name);
  });

  test("`archiveProject` refusé : aucun événement `archived`", async () => {
    currentPerson = f.contributorId;

    const lines = await written(() =>
      archiveProject(f.projectId, {}, new FormData()),
    );
    expect(lines).toHaveLength(0);

    const [row] = await db
      .select({ archivedAt: projects.archivedAt })
      .from(projects)
      .where(eq(projects.id, f.projectId));
    expect(row?.archivedAt).toBeNull();
  });
});
