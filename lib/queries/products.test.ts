/**
 * Les tests des lectures de la page produit.
 *
 * Ils tournent sur la branche Neon dédiée — `vitest.config.mts` remappe
 * `DATABASE_URL` sur `TEST_DATABASE_URL` — et écrivent réellement : un tri
 * `nulls last` et une jointure filtrée ne se vérifient pas sur un faux.
 *
 * Deux domaines sont amorcés, comme dans `lib/db/scoped.test.ts` : sans un
 * second domaine, aucun test d'étanchéité ne prouve quoi que ce soit. Les
 * écritures de fixture passent par la couche scopée ; les constats passent par
 * les fonctions sous test, qui sont précisément ce que l'écran appelle.
 */

import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { db } from "@/lib/db/client";
import { forDomain, superAdmin, type ScopedDb } from "@/lib/db/scoped";
import {
  activities,
  activityTypes,
  domains,
  entities,
  persons,
  products,
  projectMembers,
  projectStatuses,
  projects,
  taggingPlans,
} from "@/lib/db/schema";

import {
  findProductDetail,
  listProductFormOptions,
  listProductProjects,
  listProductsWithCounts,
} from "./products";

/** Enfants d'abord, parents ensuite : `domains` refuse la suppression sinon. */
const teardownOrder = [
  taggingPlans,
  activities,
  activityTypes,
  projectMembers,
  projects,
  products,
  persons,
  projectStatuses,
  entities,
];

type Fixture = {
  domainId: string;
  scope: ScopedDb;
  productId: string;
  /** Un second produit du même domaine : il ne doit jamais déborder. */
  otherProductId: string;
  /** Un produit archivé : lisible par son identifiant, absent de la liste. */
  archivedProductId: string;
  recentProjectId: string;
  oldProjectId: string;
  /** L'entité vivante du domaine : proposée à tout le monde. */
  entityId: string;
  /** L'entité archivée que le produit édité porte : proposée à lui seul. */
  archivedEntityId: string;
  /** Une seconde archivée : conserver l'une ne doit pas rouvrir l'autre. */
  otherArchivedEntityId: string;
};

const suffix = Math.random().toString(36).slice(2, 10);
let a: Fixture;
let b: Fixture;

/**
 * Un domaine avec un produit portant trois accompagnements — un ancien, un
 * récent, un sans date de début — plus un archivé, et un second produit.
 */
async function seedDomain(label: string): Promise<Fixture> {
  const domain = await superAdmin.createDomain({
    name: `__test__queries__${label}__${suffix}`,
    competenceCenterName: `Centre ${label}`,
  });
  const scope = forDomain({ domainId: domain.id });

  const entity = await scope.insert(entities, { label: `Entité ${label}` });

  // Deux entités archivées, et non une seule archivée en cours de test : la
  // fixture reste immobile, et l'exception nominative s'éprouve sur l'une
  // pendant que l'autre doit rester absente.
  const archivedEntity = await scope.insert(entities, {
    label: `Entité archivée ${label}`,
  });
  const otherArchivedEntity = await scope.insert(entities, {
    label: `Autre entité archivée ${label}`,
  });
  await scope.archive(entities, archivedEntity.id);
  await scope.archive(entities, otherArchivedEntity.id);

  const active = await scope.insert(projectStatuses, {
    label: "En cours",
    nature: "active",
  });
  const done = await scope.insert(projectStatuses, {
    label: "Terminé",
    nature: "done",
  });

  const product = await scope.insert(products, {
    name: `Produit ${label}`,
    entityId: entity.id,
    description: `Description ${label}`,
  });
  const otherProduct = await scope.insert(products, {
    name: `Autre produit ${label}`,
    entityId: entity.id,
  });

  // Archivé dans la fixture plutôt qu'en cours de test : ce qui se lit d'un
  // produit rangé — sa date, son absence des listes — ne dépend d'aucun ordre
  // d'exécution.
  const archivedProduct = await scope.insert(products, {
    name: `Produit archivé ${label}`,
    entityId: entity.id,
  });
  await scope.archive(products, archivedProduct.id);

  /* **Les dates ne vivent plus sur le projet** : sa période se déduit des
     périodes de ses activités (31/08/2026). Donner une période à un projet de
     fixture, c'est donc lui donner une activité datée. */
  const activityType = await scope.insert(activityTypes, {
    label: `Atelier ${label}`,
    family: "framing",
  });

  /** Une activité datée, le seul moyen de poser la période d'un projet. */
  async function period(
    projectId: string,
    periodStart: string,
    periodEnd: string | null,
  ) {
    await scope.insert(activities, {
      projectId,
      activityTypeId: activityType.id,
      // `done` exige une fin ; sans fin, l'activité reste `planned`.
      state: periodEnd ? "done" : "planned",
      periodStart,
      ...(periodEnd ? { periodEnd } : {}),
    });
  }

  const old = await scope.insert(projects, {
    name: `Ancien ${label}`,
    productId: product.id,
    statusId: done.id,
  });
  await period(old.id, "2024-03-01", "2024-09-30");

  const recent = await scope.insert(projects, {
    name: `Récent ${label}`,
    productId: product.id,
    statusId: active.id,
  });
  await period(recent.id, "2026-02-01", null);

  await scope.insert(projects, {
    name: `Sans date ${label}`,
    productId: product.id,
    statusId: active.id,
  });
  const archived = await scope.insert(projects, {
    name: `Archivé ${label}`,
    productId: product.id,
    statusId: active.id,
  });
  await period(archived.id, "2027-01-01", null);
  await scope.archive(projects, archived.id);

  // Un projet du second produit : il ne doit apparaître sur aucune liste du
  // premier, pas plus que son équipe.
  const elsewhere = await scope.insert(projects, {
    name: `Ailleurs ${label}`,
    productId: otherProduct.id,
    statusId: active.id,
  });
  await period(elsewhere.id, "2026-06-01", null);

  const alice = await scope.insert(persons, {
    fullName: `Alice ${label}`,
    source: "manual",
    kind: "center",
  });
  const zoe = await scope.insert(persons, {
    fullName: `Zoé ${label}`,
    source: "manual",
    kind: "stakeholder",
  });
  const intruder = await scope.insert(persons, {
    fullName: `Intrus ${label}`,
    source: "manual",
    kind: "center",
  });

  // Zoé est saisie en premier et n'est pas contributrice : le tri par nom et
  // l'absence de distinction des droits (D9) sont tous deux observables.
  await scope.insert(projectMembers, {
    projectId: recent.id,
    personId: zoe.id,
    isContributor: false,
  });
  await scope.insert(projectMembers, {
    projectId: recent.id,
    personId: alice.id,
    isContributor: true,
  });
  await scope.insert(projectMembers, {
    projectId: elsewhere.id,
    personId: intruder.id,
    isContributor: true,
  });

  return {
    domainId: domain.id,
    scope,
    productId: product.id,
    otherProductId: otherProduct.id,
    archivedProductId: archivedProduct.id,
    recentProjectId: recent.id,
    oldProjectId: old.id,
    entityId: entity.id,
    archivedEntityId: archivedEntity.id,
    otherArchivedEntityId: otherArchivedEntity.id,
  };
}

beforeAll(async () => {
  a = await seedDomain("a");
  b = await seedDomain("b");
}, 120_000);

afterAll(async () => {
  const ids = [a?.domainId, b?.domainId].filter(Boolean) as string[];
  if (ids.length === 0) return;
  for (const table of teardownOrder) {
    await db.delete(table).where(inArray(table.domainId, ids));
  }
  await db.delete(domains).where(inArray(domains.id, ids));
});

/* ==========================================================================
   L'en-tête du produit
   ========================================================================== */

describe("findProductDetail", () => {
  test("rend le produit avec le libellé de son entité", async () => {
    const detail = await findProductDetail(a.scope, a.productId);
    expect(detail?.name).toBe("Produit a");
    expect(detail?.entityLabel).toBe("Entité a");
    expect(detail?.description).toBe("Description a");
  });

  test("ne trouve pas le produit d'un autre domaine", async () => {
    expect(await findProductDetail(a.scope, b.productId)).toBeUndefined();
  });

  /* T4bis.2 — la page d'un produit archivé reste servie (règle 4), et c'est
     cette colonne qui lui permet de le dire. Sans elle, l'écran affichait une
     page identique à celle d'un produit vivant. */

  test("un produit vivant n'a pas de date d'archivage", async () => {
    const detail = await findProductDetail(a.scope, a.productId);
    expect(detail?.archivedAt).toBeNull();
  });

  test("un produit archivé reste lisible, et porte sa date", async () => {
    const detail = await findProductDetail(a.scope, a.archivedProductId);
    expect(detail?.name).toBe("Produit archivé a");
    expect(detail?.archivedAt).toBeInstanceOf(Date);
  });

  test("un produit archivé ne figure plus dans la liste", async () => {
    const rows = await listProductsWithCounts(a.scope);
    expect(rows.map((row) => row.id)).not.toContain(a.archivedProductId);
    expect(rows.map((row) => row.id)).toContain(a.productId);
  });

  /* ---------------------------------------------------------------------- */
  /* La cinquième colonne — le plan de taggage (01/09/2026)                  */
  /* ---------------------------------------------------------------------- */

  /**
   * **La jointure gauche ne doit rien casser de ce qui existait.** C'est le
   * risque propre à cette colonne : un `innerJoin` aurait fait disparaître de la
   * liste tous les produits sans plan — précisément ceux que le Web Analyst
   * cherche —, et deux plans vivants sur un produit multiplieraient sa ligne,
   * donc son décompte d'accompagnements. Les deux se mesurent ici.
   */
  describe("le plan de taggage", () => {
    test("rend l'état et la date du plan vivant", async () => {
      const plan = await a.scope.insert(taggingPlans, {
        productId: a.productId,
        url: "https://exemple.test/plan",
        status: "stale",
        updatedOn: "2026-03-03",
        note: null,
      });

      const row = (await listProductsWithCounts(a.scope)).find(
        (candidate) => candidate.id === a.productId,
      );
      expect(row?.taggingPlanStatus).toBe("stale");
      expect(row?.taggingPlanUpdatedOn).toBe("2026-03-03");

      await a.scope.archive(taggingPlans, plan.id);
    });

    /* **`null` sur les deux colonnes, jamais une ligne absente** : la jointure
       est gauche, et un produit sans plan reste dans la liste. */
    test("rend `null` sans faire disparaître le produit", async () => {
      const rows = await listProductsWithCounts(a.scope);
      const row = rows.find((candidate) => candidate.id === a.productId);

      expect(row).toBeDefined();
      expect(row?.taggingPlanStatus).toBeNull();
      expect(row?.taggingPlanUpdatedOn).toBeNull();
    });

    /* Un plan retiré ne doit pas ressusciter dans la colonne : le filtre des
       vivants vaut ici comme dans `findProductTaggingPlan`. */
    test("ignore un plan retiré", async () => {
      const plan = await a.scope.insert(taggingPlans, {
        productId: a.productId,
        url: "https://exemple.test/plan-retire",
        status: "current",
        updatedOn: "2026-01-01",
        note: null,
      });
      await a.scope.archive(taggingPlans, plan.id);

      const row = (await listProductsWithCounts(a.scope)).find(
        (candidate) => candidate.id === a.productId,
      );
      expect(row?.taggingPlanStatus).toBeNull();
    });

    /* **Le décompte d'accompagnements ne bouge pas d'un cran.** C'est le défaut
       qu'une jointure gauche mal groupée introduit en silence, et il ne se voit
       que sur un produit qui a les deux. */
    test("ne fausse pas le décompte d'accompagnements", async () => {
      const before = (await listProductsWithCounts(a.scope)).find(
        (row) => row.id === a.productId,
      )?.projectCount;

      const plan = await a.scope.insert(taggingPlans, {
        productId: a.productId,
        url: "https://exemple.test/plan-compte",
        status: "draft",
        updatedOn: "2026-05-05",
        note: null,
      });

      const after = (await listProductsWithCounts(a.scope)).find(
        (row) => row.id === a.productId,
      )?.projectCount;

      expect(after).toBe(before);

      await a.scope.archive(taggingPlans, plan.id);
    });

    /* L'étanchéité : le plan d'un autre domaine ne remonte pas, quand bien même
       il porterait le même identifiant de produit — ce qui n'arrive pas, mais
       c'est le filtre qui le garantit, pas l'improbabilité. */
    test("ne fait pas remonter le plan d'un autre domaine", async () => {
      const plan = await b.scope.insert(taggingPlans, {
        productId: b.productId,
        url: "https://exemple.test/plan-voisin",
        status: "current",
        updatedOn: "2026-07-07",
        note: null,
      });

      const rows = await listProductsWithCounts(a.scope);
      expect(
        rows.every((row) => row.taggingPlanStatus === null),
      ).toBe(true);

      await b.scope.archive(taggingPlans, plan.id);
    });
  });
});

/* ==========================================================================
   Les accompagnements
   ========================================================================== */

describe("listProductProjects", () => {
  test("les accompagnements sortent du plus récent au plus ancien", async () => {
    const rows = await listProductProjects(a.scope, a.productId);

    // Le projet sans activité datée ferme la marche : `nulls last`.
    expect(rows.map((row) => row.name)).toEqual([
      "Récent a",
      "Ancien a",
      "Sans date a",
    ]);
  });

  test("un projet archivé n'apparaît pas", async () => {
    const rows = await listProductProjects(a.scope, a.productId);
    expect(rows.map((row) => row.name)).not.toContain("Archivé a");
  });

  test("chaque ligne porte son statut, sa nature et sa période", async () => {
    // Recherche par identifiant, et non par position : ce test ne doit rien
    // dire du tri, sans quoi une régression d'ordre en ferait tomber deux.
    const rows = await listProductProjects(a.scope, a.productId);
    const recent = rows.find((row) => row.id === a.recentProjectId);
    const old = rows.find((row) => row.id === a.oldProjectId);

    expect(recent?.statusLabel).toBe("En cours");
    expect(recent?.statusNature).toBe("active");
    /* **Les deux bornes sortent ensemble.** L'activité de « Récent » n'a pas de
       fin ; le `coalesce` de `projectPeriods` rend donc son début des deux
       côtés, et non un début seul suivi d'un `null`. C'est ce qui fait qu'un
       accompagnement ne se lit plus « depuis février 2026 ». */
    expect(recent?.periodStart).toBe("2026-02-01");
    expect(recent?.periodEnd).toBe("2026-02-01");

    expect(old?.statusNature).toBe("done");
    expect(old?.periodStart).toBe("2024-03-01");
    expect(old?.periodEnd).toBe("2024-09-30");
  });

  test("l'équipe rendue est celle du projet, triée par nom", async () => {
    const rows = await listProductProjects(a.scope, a.productId);
    const recent = rows.find((row) => row.id === a.recentProjectId);
    const old = rows.find((row) => row.id === a.oldProjectId);

    // Triée par nom, et non par ordre de saisie : Zoé a été insérée d'abord.
    expect(recent?.team.map((member) => member.fullName)).toEqual([
      "Alice a",
      "Zoé a",
    ]);
    // Le membre du projet de l'autre produit ne déborde pas.
    expect(recent?.team.map((member) => member.fullName)).not.toContain(
      "Intrus a",
    );
    // Un projet sans membre est un projet normal, pas une erreur.
    expect(old?.team).toEqual([]);
  });

  test("un produit d'un autre domaine ne rend aucun accompagnement", async () => {
    expect(await listProductProjects(a.scope, b.productId)).toEqual([]);
  });

  test("l'équipe d'un autre domaine ne fuit jamais", async () => {
    const mine = await listProductProjects(a.scope, a.productId);
    const theirs = await listProductProjects(b.scope, b.productId);

    const names = mine.flatMap((row) =>
      row.team.map((member) => member.fullName),
    );
    expect(names.every((name) => name.endsWith(" a"))).toBe(true);
    expect(theirs.flatMap((row) => row.team.map((m) => m.fullName))).toContain(
      "Alice b",
    );
  });
});

/* ==========================================================================
   Les entités proposées au choix — T4bis.1

   « On propose des lignes vivantes », avec **une exception nominative** :
   l'entité que le produit édité pointe déjà, fût-elle archivée depuis. Sans
   elle, corriger le nom d'un produit obligerait à lui changer d'entité.
   ========================================================================== */

describe("listProductFormOptions — l'entité archivée", () => {
  /** Les identifiants proposés au choix, dans l'ordre rendu. */
  async function optionIds(
    scope: ScopedDb,
    options?: { keepEntityId?: string },
  ): Promise<string[]> {
    const { entities: proposed } = await listProductFormOptions(scope, options);
    return proposed.map((entity) => entity.id);
  }

  test("sans exception, une entité archivée n'est proposée à personne", async () => {
    const ids = await optionIds(a.scope);
    expect(ids).not.toContain(a.archivedEntityId);
    expect(ids).not.toContain(a.otherArchivedEntityId);
    expect(ids).toContain(a.entityId);
  });

  test("l'entité du produit édité reste proposée, archivée comprise", async () => {
    const ids = await optionIds(a.scope, { keepEntityId: a.archivedEntityId });
    expect(ids).toContain(a.archivedEntityId);
  });

  test("l'exception ne retient que celle-là", async () => {
    // Conserver l'une ne doit pas rouvrir la porte à la seconde archivée.
    const ids = await optionIds(a.scope, { keepEntityId: a.archivedEntityId });
    expect(ids).not.toContain(a.otherArchivedEntityId);
  });

  test("une entité vivante conservée ne se dédouble pas", async () => {
    const ids = await optionIds(a.scope, { keepEntityId: a.entityId });
    expect(ids.filter((id) => id === a.entityId)).toHaveLength(1);
  });

  test("l'exception ne traverse pas la frontière de domaine", async () => {
    const ids = await optionIds(b.scope, { keepEntityId: a.archivedEntityId });
    expect(ids).not.toContain(a.archivedEntityId);
    expect(ids).toContain(b.entityId);
  });
});
