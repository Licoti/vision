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
  activities,
  activityTypes,
  budgets,
  domains,
  entities,
  events,
  persons,
  products,
  projectMembers,
  projectStatuses,
  projects,
  resources,
  results,
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

const {
  createProject,
  updateProject,
  archiveProject,
  restoreProject,
  deleteProject,
} = await import("./actions");

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
  activityTypeId: string;
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
  /* Un type d'activité, pour peupler l'accompagnement que la suppression
     effacera : sans contenu, une cascade ne prouve rien. */
  const activityType = await scope.insert(activityTypes, {
    label: `Audit ${suffix}`,
    family: "evaluation",
    producesResult: true,
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
    activityTypeId: activityType.id,
    camilleId: camille.id,
    leaId: lea.id,
    rudyId: rudy.id,
  };
}, 180_000);

afterAll(async () => {
  if (!f?.domainId) return;
  const tables = [
    events,
    results,
    resources,
    budgets,
    activities,
    activityTypes,
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

  /**
   * **Le droit s'éprouve par l'action, jamais par l'écran** — et ce cas
   * n'était couvert par aucun test avant le 29/08/2026, où le formulaire a
   * cessé de rendre le référentiel entier (`components/ui/picker.tsx`).
   *
   * Une ligne absente du rendu ne protège rien : le champ `team:<uuid>` est
   * ouvert par construction, une soumission forgée en pose ce qu'elle veut, et
   * c'est `checkReferences` — pas le formulaire — qui confronte chaque
   * identifiant au domaine. **Seul le décompte en base tranche** : un message
   * de refus se lirait aussi bien sur une écriture réussie.
   */
  test("un `team:` forgé sur une personne étrangère au domaine n'écrit rien", async () => {
    currentPerson = f.managerId;

    const membersOf = async () =>
      (
        await db
          .select({ id: projectMembers.id })
          .from(projectMembers)
          .where(eq(projectMembers.projectId, f.projectId))
      ).length;

    const before = await membersOf();

    const lines = await written(async () => {
      const state = await updateProject(
        f.projectId,
        EMPTY,
        saisie({
          name: `Forgé équipe ${suffix}`,
          [`${TEAM_FIELD_PREFIX}${f.contributorId}`]: "contributor",
          // Un UUID que ce domaine ne porte pas — la couche d'accès étant
          // scopée, une personne d'un autre domaine se comporte à l'identique.
          [`${TEAM_FIELD_PREFIX}00000000-0000-4000-8000-000000000000`]:
            "contributor",
        }),
      );

      // L'étape témoin : sans elle, un refus et une panne seraient
      // indiscernables — les trois « 200 muets » du rappel de contexte.
      expect(state.errors.team).toContain("n'existe pas dans ce domaine");
    });

    expect(lines).toHaveLength(0);
    expect(await membersOf()).toBe(before);
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
   La suppression définitive — 28/08/2026

   **Le geste n'écrit aucune ligne de journal, il en efface.** C'est ce qui le
   sort du sujet de ce fichier tout en le laissant à sa place : la seule façon
   de l'éprouver est de **compter en base**, avant et après — et le journal du
   projet est l'une des tables comptées.

   `F1-D3` et la règle 4 sont écartées par arbitrage humain daté ; ce qui se
   vérifie ici est que l'écart fait exactement ce qu'il annonce, et rien de plus
   — l'accompagnement voisin ne bouge pas.
   ========================================================================== */

describe("deleteProject", () => {
  /**
   * Un accompagnement **plein** : équipe, activité terminée, ressource,
   * résultat, budget, et deux lignes de journal.
   *
   * Sans contenu, une cascade ne prouve rien — elle passerait aussi bien sur
   * une table vide.
   */
  async function seedFullProject(name: string) {
    const project = await f.scope.insert(projects, {
      name: `${name} ${suffix}`,
      productId: f.productId,
      statusId: f.statusId,
    });

    await f.scope.insert(projectMembers, {
      projectId: project.id,
      personId: f.camilleId,
      isContributor: false,
    });

    /* `activities_done_requires_period_end` exige la fin de période sur une
       activité terminée — et `done` est ce qu'exige la couche pour y rattacher
       un résultat. */
    const activity = await f.scope.insert(activities, {
      projectId: project.id,
      activityTypeId: f.activityTypeId,
      state: "done",
      periodStart: "2026-01-01",
      periodEnd: "2026-01-31",
    });

    await f.scope.insert(resources, {
      projectId: project.id,
      activityId: activity.id,
      title: `Rapport ${name} ${suffix}`,
      url: "https://example.com/rapport",
      resourceType: "pdf",
    });

    await f.scope.insert(results, {
      activityId: activity.id,
      label: `Conformité ${name}`,
      value: "72.0000",
      unit: "%",
      measuredOn: "2026-01-31",
    });

    await f.scope.insert(budgets, {
      projectId: project.id,
      allocated: "40.0000",
      consumed: "12.0000",
    });

    // Deux lignes de journal, écrites par les gestes ordinaires du projet.
    await f.scope.record({
      projectId: project.id,
      verb: "created",
      targetType: "project",
      targetId: project.id,
      summary: `Accompagnement créé${NBSP}: ${name} ${suffix}`,
    });
    await f.scope.record({
      projectId: project.id,
      verb: "updated",
      targetType: "project",
      targetId: project.id,
      summary: `Accompagnement modifié${NBSP}: ${name} ${suffix}`,
    });

    return { projectId: project.id, activityId: activity.id };
  }

  /** Ce que la base porte encore de cet accompagnement, table par table. */
  async function contentsOf(projectId: string, activityId: string) {
    const count = async (rows: Promise<{ id: string }[]>) =>
      (await rows).length;

    return {
      projects: await count(
        db.select({ id: projects.id }).from(projects).where(eq(projects.id, projectId)),
      ),
      members: await count(
        db
          .select({ id: projectMembers.id })
          .from(projectMembers)
          .where(eq(projectMembers.projectId, projectId)),
      ),
      activities: await count(
        db
          .select({ id: activities.id })
          .from(activities)
          .where(eq(activities.projectId, projectId)),
      ),
      resources: await count(
        db
          .select({ id: resources.id })
          .from(resources)
          .where(eq(resources.projectId, projectId)),
      ),
      results: await count(
        db.select({ id: results.id }).from(results).where(eq(results.activityId, activityId)),
      ),
      budgets: await count(
        db.select({ id: budgets.id }).from(budgets).where(eq(budgets.projectId, projectId)),
      ),
      events: await count(
        db.select({ id: events.id }).from(events).where(eq(events.projectId, projectId)),
      ),
    };
  }

  /**
   * Le geste réussit en **levant** : `deleteProject` finit par `redirect`, la
   * page qu'elle laissait derrière elle n'existant plus. Un appel qui rendrait
   * un état sans lever serait un refus, et le test doit pouvoir les distinguer.
   */
  async function deleted(projectId: string): Promise<"redirected" | unknown> {
    try {
      return await deleteProject(projectId, {}, new FormData());
    } catch (error) {
      if (error instanceof Error && error.message.startsWith(REDIRECT)) {
        return "redirected";
      }
      throw error;
    }
  }

  test("efface l'accompagnement et tout ce qui pend à lui", async () => {
    currentPerson = f.managerId;
    const { projectId, activityId } = await seedFullProject("À effacer");

    // Le témoin : sans lui, un décompte à zéro après coup ne dirait pas si le
    // contenu a jamais existé.
    expect(await contentsOf(projectId, activityId)).toEqual({
      projects: 1,
      members: 1,
      activities: 1,
      resources: 1,
      results: 1,
      budgets: 1,
      events: 2,
    });

    expect(await deleted(projectId)).toBe("redirected");

    expect(await contentsOf(projectId, activityId)).toEqual({
      projects: 0,
      members: 0,
      activities: 0,
      resources: 0,
      results: 0,
      budgets: 0,
      events: 0,
    });
  });

  test("l'accompagnement voisin ne bouge pas", async () => {
    currentPerson = f.managerId;
    const neighbour = await seedFullProject("Voisin épargné");
    const doomed = await seedFullProject("Effacé à côté");

    await deleted(doomed.projectId);

    expect(
      await contentsOf(neighbour.projectId, neighbour.activityId),
    ).toEqual({
      projects: 1,
      members: 1,
      activities: 1,
      resources: 1,
      results: 1,
      budgets: 1,
      events: 2,
    });
  });

  /* Le geste est offert sur les deux états — choix de l'humain du 28/08/2026 :
     ranger puis effacer est le chemin naturel, et l'interdire obligerait à
     rétablir avant de supprimer. */
  test("un accompagnement archivé se supprime aussi", async () => {
    currentPerson = f.managerId;
    const { projectId, activityId } = await seedFullProject("Rangé puis effacé");
    await archiveProject(projectId, {}, new FormData());

    expect(await deleted(projectId)).toBe("redirected");
    expect((await contentsOf(projectId, activityId)).projects).toBe(0);
  });

  /**
   * **Le droit s'éprouve par l'action, et le décompte en base tranche.** Le
   * contributeur **écrit** dans cet accompagnement (T3.x) : son refus ici ne
   * peut donc pas être un droit qui manque partout. Et il n'y a pas de code
   * HTTP à lire — l'action rend un état, la base dit la vérité.
   */
  test("un contributeur désigné ne peut pas supprimer", async () => {
    currentPerson = f.managerId;
    const { projectId, activityId } = await seedFullProject("Défendu");

    currentPerson = f.contributorId;
    const state = await deleted(projectId);

    expect(state).not.toBe("redirected");
    expect((state as { message?: string }).message).toBeDefined();
    expect(await contentsOf(projectId, activityId)).toEqual({
      projects: 1,
      members: 1,
      activities: 1,
      resources: 1,
      results: 1,
      budgets: 1,
      events: 2,
    });
  });

  /* La couche est scopée : un accompagnement d'un autre domaine n'existe pas,
     il ne « manque » pas. C'est `openProjectAsManager` qui le dit, et rien ne
     doit être effacé. */
  test("un identifiant inconnu n'efface rien", async () => {
    currentPerson = f.managerId;
    const { projectId, activityId } = await seedFullProject("Hors de portée");

    const state = await deleted("00000000-0000-4000-8000-000000000000");
    expect(state).not.toBe("redirected");
    expect((await contentsOf(projectId, activityId)).projects).toBe(1);
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
