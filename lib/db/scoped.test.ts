/**
 * Les tests de la couche d'accès scopée.
 *
 * Ils tournent sur une branche Neon dédiée — `vitest.config.ts` remappe
 * `DATABASE_URL` sur `TEST_DATABASE_URL` — et écrivent réellement en base :
 * une isolation qui n'a pas été éprouvée contre PostgreSQL n'est pas éprouvée.
 *
 * **Pourquoi ce fichier importe `db` directement.** C'est la seule exception à
 * la règle 1, et elle est nécessaire : un test qui observerait la base à
 * travers la couche qu'il teste ne prouverait rien. Si le filtre de domaine
 * était rompu, l'outil de vérification le serait aussi, et le test passerait.
 * Les constats se font donc par le client brut ; seules les écritures sous
 * test passent par la couche.
 */

import { and, eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { db } from "./client";
import {
  DomainScopeError,
  IntegrityError,
  forDomain,
  superAdmin,
  type ScopedDb,
  type ScopedTable,
} from "./scoped";
import {
  activities,
  activityParticipants,
  activityTypes,
  approaches,
  budgets,
  domains,
  entities,
  events,
  indicatorReadings,
  indicators,
  jobs,
  persons,
  products,
  projectApproaches,
  projectIndicators,
  projectJobs,
  projectLinks,
  projectMembers,
  projectStatuses,
  projects,
  resources,
  results,
  tools,
} from "./schema";

/* ==========================================================================
   Deux domaines de test
   ========================================================================== */

/** Enfants d'abord, parents ensuite : `domains` refuse la suppression sinon. */
const teardownOrder: ScopedTable[] = [
  events,
  projectLinks,
  budgets,
  projectIndicators,
  indicatorReadings,
  indicators,
  results,
  resources,
  activityParticipants,
  activities,
  projectMembers,
  projectApproaches,
  projectJobs,
  projects,
  products,
  persons,
  projectStatuses,
  activityTypes,
  tools,
  approaches,
  jobs,
  entities,
];

type Fixture = {
  domainId: string;
  scope: ScopedDb;
  entityId: string;
  statusId: string;
  activityTypeId: string;
  productId: string;
  projectId: string;
};

const suffix = Math.random().toString(36).slice(2, 10);
let a: Fixture;
let b: Fixture;

async function seedDomain(label: string): Promise<Fixture> {
  const domain = await superAdmin.createDomain({
    name: `__test__${label}__${suffix}`,
    competenceCenterName: `Centre ${label}`,
  });
  const scope = forDomain({ domainId: domain.id });

  const entity = await scope.insert(entities, { label: `Entité ${label}` });
  const status = await scope.insert(projectStatuses, {
    label: "En cours",
    nature: "active",
  });
  const activityType = await scope.insert(activityTypes, {
    label: "Atelier",
    family: "design",
  });
  const product = await scope.insert(products, {
    name: `Produit ${label}`,
    entityId: entity.id,
  });
  const project = await scope.insert(projects, {
    name: `Projet ${label}`,
    productId: product.id,
    statusId: status.id,
  });

  return {
    domainId: domain.id,
    scope,
    entityId: entity.id,
    statusId: status.id,
    activityTypeId: activityType.id,
    productId: product.id,
    projectId: project.id,
  };
}

beforeAll(async () => {
  a = await seedDomain("a");
  b = await seedDomain("b");
});

afterAll(async () => {
  const ids = [a?.domainId, b?.domainId].filter(Boolean) as string[];
  if (ids.length === 0) return;
  for (const table of teardownOrder) {
    await db.delete(table).where(inArray(table.domainId, ids));
  }
  await db.delete(domains).where(inArray(domains.id, ids));
});

/* ==========================================================================
   La frontière
   ========================================================================== */

describe("la frontière de domaine", () => {
  test("une lecture ne voit jamais les lignes d'un autre domaine", async () => {
    const rows = await a.scope.list(projects);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe(a.projectId);
    expect(rows.some((row) => row.id === b.projectId)).toBe(false);

    expect(await a.scope.find(projects, b.projectId)).toBeUndefined();
    expect(await a.scope.count(projects)).toBe(1);
  });

  test("une lecture jointe filtrée ne franchit pas la frontière", async () => {
    const rows = await a.scope.joinedRead((database, scope) =>
      database
        .select({ project: projects.name, product: products.name })
        .from(projects)
        .innerJoin(
          products,
          and(eq(products.id, projects.productId), scope.filter(products)),
        )
        .where(scope.filter(projects)),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.product).toContain("Produit a");

    const foreign = await a.scope.joinedRead((database, scope) =>
      database
        .select({ id: projects.id })
        .from(projects)
        .where(scope.filter(projects)),
    );
    expect(foreign.map((row) => row.id)).not.toContain(b.projectId);
  });

  test("une écriture ne touche pas une ligne d'un autre domaine", async () => {
    const before = await db
      .select()
      .from(projects)
      .where(eq(projects.id, b.projectId));

    const updated = await a.scope.update(projects, b.projectId, {
      name: "Renommé depuis A",
    });
    expect(updated).toBeUndefined();

    const after = await db
      .select()
      .from(projects)
      .where(eq(projects.id, b.projectId));
    expect(after[0]?.name).toBe(before[0]?.name);
    expect(after[0]?.updatedAt).toEqual(before[0]?.updatedAt);
  });

  test("un archivage ne franchit pas la frontière", async () => {
    const archived = await a.scope.archive(projects, b.projectId);
    expect(archived).toBeUndefined();

    const row = await db
      .select()
      .from(projects)
      .where(eq(projects.id, b.projectId));
    expect(row[0]?.archivedAt).toBeNull();
  });

  test("`domainId` ne se force pas à l'écriture", async () => {
    await expect(
      // Le typage l'interdit déjà ; le cast vérifie le garde-fou d'exécution,
      // seul rempart si la valeur vient d'un formulaire ou d'un appel JS.
      a.scope.insert(products, {
        name: "Produit intrus",
        entityId: a.entityId,
        domainId: b.domainId,
      } as never),
    ).rejects.toThrow(DomainScopeError);
  });
});

/* ==========================================================================
   Cohérence des parents — ce que la base ne vérifie pas
   ========================================================================== */

describe("la cohérence des parents", () => {
  test("un parent d'un autre domaine est refusé", async () => {
    await expect(
      a.scope.insert(projects, {
        name: "Projet mal rattaché",
        productId: b.productId,
        statusId: a.statusId,
      }),
    ).rejects.toThrow(DomainScopeError);

    // La base l'aurait accepté : la clé étrangère ignore le domaine.
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.productId, b.productId));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.domainId).toBe(b.domainId);
  });

  test("le garde-fou laisse passer le cas normal", async () => {
    const project = await a.scope.insert(projects, {
      name: "Projet bien rattaché",
      productId: a.productId,
      statusId: a.statusId,
    });
    expect(project.domainId).toBe(a.domainId);
    expect(project.lastActivityAt).toBeNull();
  });
});

/* ==========================================================================
   Les deux règles d'intégrité laissées par T1.2
   ========================================================================== */

describe("un résultat ne se rattache qu'à une activité terminée", () => {
  test("une activité non terminée est refusée", async () => {
    const planned = await a.scope.insert(activities, {
      projectId: a.projectId,
      activityTypeId: a.activityTypeId,
      state: "planned",
      periodStart: "2026-04-01",
    });

    await expect(
      a.scope.insert(results, {
        activityId: planned.id,
        label: "Taux de conformité",
        value: "82.0000",
        measuredOn: "2026-04-15",
      }),
    ).rejects.toThrow(IntegrityError);
  });

  test("une activité terminée est acceptée", async () => {
    const done = await a.scope.insert(activities, {
      projectId: a.projectId,
      activityTypeId: a.activityTypeId,
      state: "done",
      periodStart: "2026-02-01",
      periodEnd: "2026-02-20",
    });

    const result = await a.scope.insert(results, {
      activityId: done.id,
      label: "Taux de conformité",
      value: "82.0000",
      measuredOn: "2026-02-25",
    });
    expect(result.domainId).toBe(a.domainId);
  });
});

describe("`last_activity_at` est tenu par la couche d'écriture", () => {
  test("nul à la création, renseigné puis recalculé", async () => {
    const project = await a.scope.insert(projects, {
      name: "Projet suivi",
      productId: a.productId,
      statusId: a.statusId,
    });
    expect(project.lastActivityAt).toBeNull();

    const activity = await a.scope.insert(activities, {
      projectId: project.id,
      activityTypeId: a.activityTypeId,
      state: "done",
      periodStart: "2026-03-10",
      periodEnd: "2026-03-20",
    });

    const afterInsert = await a.scope.find(projects, project.id);
    expect(afterInsert?.lastActivityAt).not.toBeNull();
    expect(afterInsert?.lastActivityAt?.toISOString().slice(0, 10)).toBe(
      "2026-03-20",
    );

    await a.scope.update(activities, activity.id, { periodEnd: "2026-05-04" });
    const afterUpdate = await a.scope.find(projects, project.id);
    expect(afterUpdate?.lastActivityAt?.toISOString().slice(0, 10)).toBe(
      "2026-05-04",
    );

    // Une activité archivée sort du calcul : le projet redevient sans date.
    await a.scope.archive(activities, activity.id);
    const afterArchive = await a.scope.find(projects, project.id);
    expect(afterArchive?.lastActivityAt).toBeNull();
  });

  /**
   * T2.1 — la fraîcheur dit « depuis quand ça n'a pas bougé » (docs/03 §8).
   * Une activité prévue n'a pas eu lieu : elle ne peut pas dater le dernier
   * mouvement du projet, et surtout pas le poser dans le futur.
   */
  test("une activité prévue ne déplace pas la date", async () => {
    const project = await a.scope.insert(projects, {
      name: "Projet à l'arrêt",
      productId: a.productId,
      statusId: a.statusId,
    });

    await a.scope.insert(activities, {
      projectId: project.id,
      activityTypeId: a.activityTypeId,
      state: "done",
      periodStart: "2026-01-05",
      periodEnd: "2026-01-30",
    });
    await a.scope.insert(activities, {
      projectId: project.id,
      activityTypeId: a.activityTypeId,
      state: "planned",
      periodStart: "2027-06-01",
      periodEnd: "2027-06-30",
    });

    const after = await a.scope.find(projects, project.id);
    expect(after?.lastActivityAt?.toISOString().slice(0, 10)).toBe("2026-01-30");
  });

  test("une activité en cours déplace la date, elle a commencé", async () => {
    const project = await a.scope.insert(projects, {
      name: "Projet en mouvement",
      productId: a.productId,
      statusId: a.statusId,
    });

    await a.scope.insert(activities, {
      projectId: project.id,
      activityTypeId: a.activityTypeId,
      state: "done",
      periodStart: "2026-01-05",
      periodEnd: "2026-01-30",
    });
    await a.scope.insert(activities, {
      projectId: project.id,
      activityTypeId: a.activityTypeId,
      state: "in_progress",
      periodStart: "2026-04-01",
      periodEnd: "2026-04-30",
    });

    const after = await a.scope.find(projects, project.id);
    expect(after?.lastActivityAt?.toISOString().slice(0, 10)).toBe("2026-04-30");
  });

  /**
   * Le rafraîchissement rejoue la définition sur des lignes déjà écrites.
   * Sans lui, un changement de définition ne rattraperait jamais l'existant :
   * la valeur est posée à l'écriture, et une écriture passée ne se refait pas.
   */
  test("`refreshLastActivity` rejoue le calcul sur l'existant", async () => {
    const project = await a.scope.insert(projects, {
      name: "Projet à rafraîchir",
      productId: a.productId,
      statusId: a.statusId,
    });
    await a.scope.insert(activities, {
      projectId: project.id,
      activityTypeId: a.activityTypeId,
      state: "done",
      periodStart: "2026-02-01",
      periodEnd: "2026-02-28",
    });

    // Une valeur fausse posée par le client brut, hors de la couche : c'est
    // l'état qu'aurait laissé une ancienne définition.
    await db
      .update(projects)
      .set({ lastActivityAt: new Date("2030-01-01T00:00:00Z") })
      .where(eq(projects.id, project.id));

    const count = await a.scope.refreshLastActivity([project.id]);
    expect(count).toBe(1);

    const after = await a.scope.find(projects, project.id);
    expect(after?.lastActivityAt?.toISOString().slice(0, 10)).toBe("2026-02-28");
  });
});

/* ==========================================================================
   Archivage plutôt que suppression
   ========================================================================== */

describe("l'archivage", () => {
  test("pose `archived_at`, sans supprimer la ligne", async () => {
    const entity = await a.scope.insert(entities, { label: "Entité à ranger" });

    const archived = await a.scope.archive(entities, entity.id);
    expect(archived?.archivedAt).toBeInstanceOf(Date);

    const visible = await a.scope.list(entities);
    expect(visible.map((row) => row.id)).not.toContain(entity.id);

    const all = await a.scope.list(entities, { includeArchived: true });
    expect(all.map((row) => row.id)).toContain(entity.id);

    const row = await db
      .select()
      .from(entities)
      .where(eq(entities.id, entity.id));
    expect(row).toHaveLength(1);
  });

  test("`archivedAt` est refusé dans un `update`", async () => {
    await expect(
      a.scope.update(projects, a.projectId, {
        archivedAt: new Date(),
      } as never),
    ).rejects.toThrow(IntegrityError);
  });

  test("`unlink` défait une liaison, et n'existe que pour elles", async () => {
    const job = await a.scope.insert(jobs, { label: "Product Design" });
    const link = await a.scope.insert(projectJobs, {
      projectId: a.projectId,
      jobId: job.id,
    });

    expect(await b.scope.unlink(projectJobs, link.id)).toBe(0);
    expect(await a.scope.unlink(projectJobs, link.id)).toBe(1);
    expect(await a.scope.find(projectJobs, link.id)).toBeUndefined();
  });
});

/* ==========================================================================
   Contraintes de typage — vérifiées par `tsc --noEmit`, jamais exécutées
   ========================================================================== */

describe("les garde-fous de typage", () => {
  test("`unlink` refuse une table archivable, `archive` une table de liaison", () => {
    const jamaisAppele = async (scope: ScopedDb) => {
      // @ts-expect-error `entities` porte `archived_at` : elle s'archive, elle ne se supprime pas.
      await scope.unlink(entities, "…");
      // @ts-expect-error `project_jobs` n'a pas `archived_at` : rien à archiver.
      await scope.archive(projectJobs, "…");
      // @ts-expect-error `domains` n'a pas de `domain_id` : elle n'est pas scopable.
      await scope.list(domains);
      // @ts-expect-error `domainId` n'appartient pas à l'appelant.
      await scope.insert(entities, { label: "x", domainId: "…" });
    };
    expect(typeof jamaisAppele).toBe("function");
  });
});

/* ==========================================================================
   Le seul chemin non scopé
   ========================================================================== */

describe("superAdmin", () => {
  test("ne donne accès qu'aux domaines", async () => {
    const found = await superAdmin.findDomain(a.domainId);
    expect(found?.name).toContain("__test__a__");

    const all = await superAdmin.listDomains();
    const names = all.map((domain) => domain.name);
    expect(names).toContain(`__test__a__${suffix}`);
    expect(names).toContain(`__test__b__${suffix}`);

    // Rien d'autre que `createDomain`, `findDomain`, `listDomains`.
    expect(Object.keys(superAdmin).sort()).toEqual([
      "createDomain",
      "findDomain",
      "listDomains",
    ]);
  });
});
