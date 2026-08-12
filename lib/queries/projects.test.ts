/**
 * Les tests des lectures de la liste transverse des projets.
 *
 * Ils tournent sur la branche Neon dédiée — `vitest.config.mts` remappe
 * `DATABASE_URL` sur `TEST_DATABASE_URL` — et écrivent réellement : un `exists`
 * filtré, un `nulls last` et un motif de `like` échappé ne se vérifient pas sur
 * un faux.
 *
 * Deux domaines sont amorcés, comme dans `products.test.ts` : sans un second
 * domaine, aucun test d'étanchéité ne prouve quoi que ce soit. Les écritures de
 * fixture passent par la couche scopée ; les constats passent par les fonctions
 * sous test, qui sont précisément ce que l'écran appelle.
 */

import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { db } from "@/lib/db/client";
import { forDomain, superAdmin, type ScopedDb } from "@/lib/db/scoped";
import {
  approaches,
  domains,
  entities,
  jobs,
  persons,
  products,
  projectApproaches,
  projectJobs,
  projectMembers,
  projectStatuses,
  projects,
} from "@/lib/db/schema";

import {
  findAccompanimentRank,
  findProjectDetail,
  listProjectFilterOptions,
  listProjects,
} from "./projects";

/** Enfants d'abord, parents ensuite : `domains` refuse la suppression sinon. */
const teardownOrder = [
  projectJobs,
  projectApproaches,
  projectMembers,
  projects,
  products,
  persons,
  jobs,
  approaches,
  projectStatuses,
  entities,
];

type Fixture = {
  domainId: string;
  scope: ScopedDb;
  entityId: string;
  /** Une entité sans aucun produit : elle ne doit être proposée nulle part. */
  emptyEntityId: string;
  doneStatusId: string;
  activeStatusId: string;
  researchJobId: string;
  interfaceJobId: string;
  /** Un métier du référentiel qu'aucun projet ne déclare. */
  orphanJobId: string;
  approachId: string;
  orphanApproachId: string;
};

const suffix = Math.random().toString(36).slice(2, 10);
let a: Fixture;
let b: Fixture;

/**
 * Un domaine complet : deux entités dont une vide, deux statuts, trois métiers
 * dont un orphelin, deux approches dont une orpheline, un produit vivant et un
 * produit archivé, et cinq projets — un frais, un ancien, un sans activité, un
 * archivé, un rattaché au produit archivé.
 */
async function seedDomain(label: string): Promise<Fixture> {
  const domain = await superAdmin.createDomain({
    name: `__test__projects__${label}__${suffix}`,
    competenceCenterName: `Centre ${label}`,
  });
  const scope = forDomain({ domainId: domain.id });

  const entity = await scope.insert(entities, { label: `Entité ${label}` });
  const emptyEntity = await scope.insert(entities, {
    label: `Entité vide ${label}`,
  });

  const active = await scope.insert(projectStatuses, {
    label: "En cours",
    nature: "active",
    position: "2",
  });
  const done = await scope.insert(projectStatuses, {
    label: "Terminé",
    nature: "done",
    position: "1",
  });

  // `position` inversé par rapport à l'alphabet : c'est l'ordre du domaine qui
  // doit sortir des options, pas celui du dictionnaire.
  const research = await scope.insert(jobs, {
    label: `UX Research ${label}`,
    position: "2",
  });
  const ui = await scope.insert(jobs, {
    label: `UI Design ${label}`,
    position: "1",
  });
  const orphanJob = await scope.insert(jobs, { label: `Métier orphelin ${label}` });

  const approach = await scope.insert(approaches, { label: `Research ${label}` });
  const orphanApproach = await scope.insert(approaches, {
    label: `Approche orpheline ${label}`,
  });

  const product = await scope.insert(products, {
    name: `Produit ${label}`,
    entityId: entity.id,
  });
  const archivedProduct = await scope.insert(products, {
    name: `Produit archivé ${label}`,
    entityId: entity.id,
  });

  const fresh = await scope.insert(projects, {
    name: `Frais ${label}`,
    productId: product.id,
    statusId: active.id,
    objective: "Réduire les abandons en cours de virement.",
    lastActivityAt: new Date("2026-08-31T00:00:00Z"),
  });
  const old = await scope.insert(projects, {
    name: `Ancien ${label}`,
    productId: product.id,
    statusId: done.id,
    lastActivityAt: new Date("2024-05-31T00:00:00Z"),
  });
  // Un `%` littéral dans le nom : sans échappement du motif, la recherche
  // « % » ramènerait toute la liste au lieu de cette seule ligne.
  await scope.insert(projects, {
    name: `Taux 100 % ${label}`,
    productId: product.id,
    statusId: active.id,
    lastActivityAt: new Date("2023-01-31T00:00:00Z"),
  });
  await scope.insert(projects, {
    name: `Muet ${label}`,
    productId: product.id,
    statusId: active.id,
  });

  const archivedProject = await scope.insert(projects, {
    name: `Archivé ${label}`,
    productId: product.id,
    statusId: active.id,
    lastActivityAt: new Date("2027-01-31T00:00:00Z"),
  });
  await scope.archive(projects, archivedProject.id);

  // Vivant, mais sur un produit rangé : il ne doit pas s'afficher davantage.
  await scope.insert(projects, {
    name: `Chez le produit archivé ${label}`,
    productId: archivedProduct.id,
    statusId: active.id,
    lastActivityAt: new Date("2027-02-28T00:00:00Z"),
  });
  await scope.archive(products, archivedProduct.id);

  const kaddour = await scope.insert(persons, {
    fullName: `Inès Kaddour ${label}`,
    source: "manual",
    kind: "center",
  });
  const zoe = await scope.insert(persons, {
    fullName: `Zoé Aubert ${label}`,
    source: "manual",
    kind: "stakeholder",
  });

  await scope.insert(projectMembers, {
    projectId: fresh.id,
    personId: kaddour.id,
    isContributor: true,
  });
  await scope.insert(projectMembers, {
    projectId: old.id,
    personId: zoe.id,
    isContributor: false,
  });

  // Deux métiers sur le projet frais, un seul sur l'ancien : de quoi observer
  // qu'un projet qui déclare deux métiers ne sort qu'une fois.
  await scope.insert(projectJobs, { projectId: fresh.id, jobId: research.id });
  await scope.insert(projectJobs, { projectId: fresh.id, jobId: ui.id });
  await scope.insert(projectJobs, { projectId: old.id, jobId: research.id });

  await scope.insert(projectApproaches, {
    projectId: fresh.id,
    approachId: approach.id,
  });

  // Le projet archivé déclare le métier orphelin et l'approche orpheline :
  // ni l'un ni l'autre ne doit être proposé au filtrage.
  await scope.insert(projectJobs, {
    projectId: archivedProject.id,
    jobId: orphanJob.id,
  });
  await scope.insert(projectApproaches, {
    projectId: archivedProject.id,
    approachId: orphanApproach.id,
  });

  return {
    domainId: domain.id,
    scope,
    entityId: entity.id,
    emptyEntityId: emptyEntity.id,
    activeStatusId: active.id,
    doneStatusId: done.id,
    researchJobId: research.id,
    interfaceJobId: ui.id,
    orphanJobId: orphanJob.id,
    approachId: approach.id,
    orphanApproachId: orphanApproach.id,
  };
}

/* ==========================================================================
   La fixture de la page projet

   Un troisième domaine, et non deux projets de plus dans le premier : les
   tests de la liste transverse comptent leurs lignes, et un accompagnement
   ajouté chez eux ferait tomber trois tests qui n'ont rien à voir avec T2.4.
   ========================================================================== */

type DetailFixture = {
  domainId: string;
  scope: ScopedDb;
  /** Le produit qui porte une histoire : trois accompagnements datés. */
  productId: string;
  activeStatusId: string;
  /** Un second produit : ses accompagnements ne comptent pas dans le rang. */
  otherProductId: string;
  firstId: string;
  /** Celui dont on lit le rang. Le plus récent des trois. */
  secondId: string;
  /** Daté entre les deux, mais archivé : il ne compte pas. */
  archivedId: string;
  /** Sans date de début : il ne se situe dans aucune chronologie. */
  undatedId: string;
};

let c: DetailFixture;

async function seedDetailDomain(): Promise<DetailFixture> {
  const domain = await superAdmin.createDomain({
    name: `__test__detail__${suffix}`,
    competenceCenterName: "Centre c",
  });
  const scope = forDomain({ domainId: domain.id });

  const entity = await scope.insert(entities, { label: "Banque de détail c" });
  const active = await scope.insert(projectStatuses, {
    label: "En cours",
    nature: "active",
    position: "2",
  });
  const done = await scope.insert(projectStatuses, {
    label: "Terminé",
    nature: "done",
    position: "1",
  });

  // `position` inversé par rapport à l'alphabet : les approches doivent sortir
  // dans l'ordre du domaine, pas dans celui du dictionnaire.
  const research = await scope.insert(approaches, {
    label: "Research c",
    position: "1",
  });
  const audit = await scope.insert(approaches, {
    label: "Audit UX c",
    position: "2",
  });

  const product = await scope.insert(products, {
    name: "Espace client c",
    entityId: entity.id,
  });
  const otherProduct = await scope.insert(products, {
    name: "Autre produit c",
    entityId: entity.id,
  });

  const first = await scope.insert(projects, {
    name: "Premier c",
    productId: product.id,
    statusId: done.id,
    startedOn: "2024-03-01",
    expectedEndOn: "2024-09-30",
  });
  const second = await scope.insert(projects, {
    name: "Second c",
    productId: product.id,
    statusId: active.id,
    objective: "Permettre les opérations courantes sans contact.",
    sponsor: "Direction des opérations c",
    startedOn: "2026-02-01",
  });
  const archived = await scope.insert(projects, {
    name: "Archivé c",
    productId: product.id,
    statusId: active.id,
    startedOn: "2025-01-01",
  });
  await scope.archive(projects, archived.id);
  const undated = await scope.insert(projects, {
    name: "Sans date c",
    productId: product.id,
    statusId: active.id,
  });

  // Plus ancien que tous les autres, mais chez un autre produit : le rang de
  // « Second c » ne doit pas s'en apercevoir.
  await scope.insert(projects, {
    name: "Voisin c",
    productId: otherProduct.id,
    statusId: active.id,
    startedOn: "2020-01-01",
  });

  await scope.insert(projectApproaches, {
    projectId: second.id,
    approachId: research.id,
  });
  await scope.insert(projectApproaches, {
    projectId: second.id,
    approachId: audit.id,
  });

  const roux = await scope.insert(persons, {
    fullName: "Camille Roux c",
    source: "manual",
    kind: "center",
  });
  const tellier = await scope.insert(persons, {
    fullName: "Marc Tellier c",
    source: "manual",
    kind: "stakeholder",
  });
  const diallo = await scope.insert(persons, {
    fullName: "Awa Diallo c",
    source: "manual",
    kind: "center",
  });

  // Insérés dans le désordre : c'est la requête qui doit trier, pas la saisie.
  await scope.insert(projectMembers, {
    projectId: second.id,
    personId: tellier.id,
    isContributor: false,
  });
  await scope.insert(projectMembers, {
    projectId: second.id,
    personId: roux.id,
    isContributor: true,
  });
  await scope.insert(projectMembers, {
    projectId: second.id,
    personId: diallo.id,
    isContributor: true,
  });

  return {
    domainId: domain.id,
    scope,
    productId: product.id,
    activeStatusId: active.id,
    otherProductId: otherProduct.id,
    firstId: first.id,
    secondId: second.id,
    archivedId: archived.id,
    undatedId: undated.id,
  };
}

beforeAll(async () => {
  a = await seedDomain("a");
  b = await seedDomain("b");
  c = await seedDetailDomain();
}, 180_000);

afterAll(async () => {
  const ids = [a?.domainId, b?.domainId, c?.domainId].filter(Boolean) as string[];
  if (ids.length === 0) return;
  for (const table of teardownOrder) {
    await db.delete(table).where(inArray(table.domainId, ids));
  }
  await db.delete(domains).where(inArray(domains.id, ids));
});

/** Les noms retenus, dans l'ordre rendu. */
const names = (rows: { name: string }[]) => rows.map((row) => row.name);

/* ==========================================================================
   L'ordre et le périmètre
   ========================================================================== */

describe("listProjects — ordre et périmètre", () => {
  test("le tri suit l'activité récente, les projets sans activité en dernier", async () => {
    const rows = await listProjects(a.scope);

    expect(names(rows)).toEqual([
      "Frais a",
      "Ancien a",
      "Taux 100 % a",
      "Muet a",
    ]);
  });

  test("ni le projet archivé, ni celui d'un produit archivé n'apparaissent", async () => {
    const rows = await listProjects(a.scope);

    // Tous deux ont la fraîcheur la plus récente : s'ils passaient, ils
    // seraient en tête, pas cachés au fond.
    expect(names(rows)).not.toContain("Archivé a");
    expect(names(rows)).not.toContain("Chez le produit archivé a");
  });

  test("aucun projet d'un autre domaine ne franchit la frontière", async () => {
    const rows = await listProjects(a.scope);
    expect(names(rows).some((name) => name.endsWith(" b"))).toBe(false);

    const others = await listProjects(b.scope);
    expect(names(others).some((name) => name.endsWith(" a"))).toBe(false);
  });

  test("chaque ligne porte son produit, son entité, son statut et ses métiers", async () => {
    // Recherche par nom et non par position : ce test ne doit rien dire du
    // tri, sans quoi une régression d'ordre en ferait tomber deux.
    const rows = await listProjects(a.scope);
    const fresh = rows.find((row) => row.name === "Frais a");

    expect(fresh?.productName).toBe("Produit a");
    expect(fresh?.entityLabel).toBe("Entité a");
    expect(fresh?.statusLabel).toBe("En cours");
    expect(fresh?.statusNature).toBe("active");
    // L'ordre des métiers suit le `position` du domaine, pas l'alphabet.
    expect(fresh?.jobLabels).toEqual(["UI Design a", "UX Research a"]);
    expect(fresh?.team.map((member) => member.fullName)).toEqual([
      "Inès Kaddour a",
    ]);
    expect(fresh?.lastActivityAt?.toISOString()).toBe(
      "2026-08-31T00:00:00.000Z",
    );
  });

  test("un projet sans équipe ni métier reste une ligne normale", async () => {
    const rows = await listProjects(a.scope);
    const mute = rows.find((row) => row.name === "Muet a");

    expect(mute?.team).toEqual([]);
    expect(mute?.jobLabels).toEqual([]);
    expect(mute?.lastActivityAt).toBeNull();
  });
});

/* ==========================================================================
   Les filtres
   ========================================================================== */

describe("listProjects — filtres", () => {
  test("le filtre d'entité retient les projets de ses produits", async () => {
    const rows = await listProjects(a.scope, { entityId: a.entityId });
    expect(rows).toHaveLength(4);

    const empty = await listProjects(a.scope, { entityId: a.emptyEntityId });
    expect(empty).toEqual([]);
  });

  test("le filtre de statut retient les projets de ce statut", async () => {
    const rows = await listProjects(a.scope, { statusId: a.doneStatusId });
    expect(names(rows)).toEqual(["Ancien a"]);
  });

  test("le filtre de métier retient les projets qui le déclarent, une fois chacun", async () => {
    // « Frais a » déclare deux métiers : il ne doit sortir qu'une ligne.
    const research = await listProjects(a.scope, { jobId: a.researchJobId });
    expect(names(research)).toEqual(["Frais a", "Ancien a"]);

    const ui = await listProjects(a.scope, { jobId: a.interfaceJobId });
    expect(names(ui)).toEqual(["Frais a"]);
  });

  test("le filtre d'approche retient le projet qui la déclare", async () => {
    const rows = await listProjects(a.scope, { approachId: a.approachId });
    expect(names(rows)).toEqual(["Frais a"]);
  });

  test("les filtres se combinent, chacun restreignant le précédent", async () => {
    const research = await listProjects(a.scope, { jobId: a.researchJobId });
    expect(research).toHaveLength(2);

    const andActive = await listProjects(a.scope, {
      jobId: a.researchJobId,
      statusId: a.activeStatusId,
    });
    expect(names(andActive)).toEqual(["Frais a"]);

    // Une troisième dimension qui ne recoupe pas : la combinaison se vide.
    const andOther = await listProjects(a.scope, {
      jobId: a.researchJobId,
      statusId: a.activeStatusId,
      approachId: a.orphanApproachId,
    });
    expect(andOther).toEqual([]);
  });

  test("un filtre ne laisse pas passer une valeur d'un autre domaine", async () => {
    const rows = await listProjects(a.scope, { jobId: b.researchJobId });
    expect(rows).toEqual([]);
  });
});

/* ==========================================================================
   La recherche
   ========================================================================== */

describe("listProjects — recherche", () => {
  test("elle porte sur le nom, sur l'objectif et sur les membres", async () => {
    expect(names(await listProjects(a.scope, { search: "Ancien" }))).toEqual([
      "Ancien a",
    ]);
    expect(names(await listProjects(a.scope, { search: "abandons" }))).toEqual([
      "Frais a",
    ]);
    expect(names(await listProjects(a.scope, { search: "Kaddour" }))).toEqual([
      "Frais a",
    ]);
  });

  test("elle ignore la casse et les fragments", async () => {
    expect(names(await listProjects(a.scope, { search: "kaddour" }))).toEqual([
      "Frais a",
    ]);
  });

  test("elle ne cherche pas les membres d'un autre domaine", async () => {
    // Le nom existe dans les deux domaines, à un suffixe près.
    const rows = await listProjects(a.scope, { search: "Inès Kaddour b" });
    expect(rows).toEqual([]);
  });

  test("un joker saisi est un caractère, pas un joker", async () => {
    // Sans échappement, « % » ramènerait les quatre lignes du domaine.
    expect(names(await listProjects(a.scope, { search: "%" }))).toEqual([
      "Taux 100 % a",
    ]);
    // Et « _ » remplacerait n'importe quel caractère : « Muet a » y passerait.
    expect(await listProjects(a.scope, { search: "_" })).toEqual([]);
  });

  test("un projet sans objectif ne fait pas disparaître les autres", async () => {
    // `ilike` sur une colonne nulle rend `null`, pas `false` : le `or` doit
    // continuer de retenir les lignes trouvées par le nom.
    expect(names(await listProjects(a.scope, { search: "Muet" }))).toEqual([
      "Muet a",
    ]);
  });
});

/* ==========================================================================
   Les options de filtrage
   ========================================================================== */

describe("listProjectFilterOptions", () => {
  test("elle ne propose que ce qui porte au moins un projet vivant", async () => {
    const options = await listProjectFilterOptions(a.scope);

    expect(options.entities.map((option) => option.label)).toEqual([
      "Entité a",
    ]);
    // Les statuts et métiers suivent le `position` du domaine, pas l'alphabet.
    expect(options.statuses.map((option) => option.label)).toEqual([
      "Terminé",
      "En cours",
    ]);
    expect(options.jobs.map((option) => option.label)).toEqual([
      "UI Design a",
      "UX Research a",
    ]);
    expect(options.approaches.map((option) => option.label)).toEqual([
      "Research a",
    ]);
  });

  test("le métier et l'approche du seul projet archivé ne sont pas proposés", async () => {
    const options = await listProjectFilterOptions(a.scope);

    expect(options.jobs.map((option) => option.id)).not.toContain(a.orphanJobId);
    expect(options.approaches.map((option) => option.id)).not.toContain(
      a.orphanApproachId,
    );
  });

  test("aucune option ne vient d'un autre domaine", async () => {
    const options = await listProjectFilterOptions(a.scope);
    const all = [
      ...options.entities,
      ...options.jobs,
      ...options.approaches,
      ...options.statuses,
    ];

    expect(all.some((option) => option.label.endsWith(" b"))).toBe(false);
    expect(all.map((option) => option.id)).not.toContain(b.entityId);
  });
});

/* ==========================================================================
   L'en-tête de la page projet
   ========================================================================== */

describe("findProjectDetail", () => {
  test("il porte l'identité, le produit, l'entité, le statut et la période", async () => {
    const project = await findProjectDetail(c.scope, c.secondId);

    expect(project?.name).toBe("Second c");
    expect(project?.objective).toBe(
      "Permettre les opérations courantes sans contact.",
    );
    expect(project?.sponsor).toBe("Direction des opérations c");
    expect(project?.productId).toBe(c.productId);
    expect(project?.productName).toBe("Espace client c");
    expect(project?.entityLabel).toBe("Banque de détail c");
    expect(project?.statusLabel).toBe("En cours");
    expect(project?.statusNature).toBe("active");
    expect(project?.startedOn).toBe("2026-02-01");
    expect(project?.expectedEndOn).toBeNull();
  });

  test("les approches sortent dans l'ordre du référentiel, pas dans celui de l'alphabet", async () => {
    const project = await findProjectDetail(c.scope, c.secondId);
    // `position` inversé par rapport à l'alphabet : trié par le libellé,
    // « Audit UX c » passerait devant.
    expect(project?.approachLabels).toEqual(["Research c", "Audit UX c"]);
  });

  test("l'équipe est alphabétique et chaque membre porte son côté", async () => {
    const project = await findProjectDetail(c.scope, c.secondId);

    expect(project?.team.map((member) => member.fullName)).toEqual([
      "Awa Diallo c",
      "Camille Roux c",
      "Marc Tellier c",
    ]);
    expect(project?.team.map((member) => member.kind)).toEqual([
      "center",
      "center",
      "stakeholder",
    ]);
  });

  test("un projet sans équipe ni approche reste un projet normal", async () => {
    const project = await findProjectDetail(c.scope, c.undatedId);

    expect(project?.name).toBe("Sans date c");
    expect(project?.team).toEqual([]);
    expect(project?.approachLabels).toEqual([]);
    expect(project?.sponsor).toBeNull();
    expect(project?.startedOn).toBeNull();
  });

  test("un projet archivé reste lisible", async () => {
    // Règle 4 : archivé n'est pas supprimé. La liste transverse le masque, la
    // page de détail le rend — sans quoi un lien déjà distribué casserait.
    const project = await findProjectDetail(c.scope, c.archivedId);
    expect(project?.name).toBe("Archivé c");
  });

  test("un identifiant inconnu ne rend rien", async () => {
    const project = await findProjectDetail(
      c.scope,
      "00000000-0000-4000-8000-000000000000",
    );
    expect(project).toBeUndefined();
  });

  test("un projet d'un autre domaine ne rend rien non plus", async () => {
    // L'écran ne distingue pas les deux cas : il répond 404 dans les deux.
    expect(await findProjectDetail(a.scope, c.secondId)).toBeUndefined();
    expect(await findProjectDetail(c.scope, a.entityId)).toBeUndefined();
  });
});

/* ==========================================================================
   Le rang d'accompagnement — le critère de validation de T2.4

   Il est **calculé, jamais saisi** : aucune colonne ne le porte, et le seul
   enregistrement d'un accompagnement plus ancien le décale.
   ========================================================================== */

describe("findAccompanimentRank", () => {
  const rankOf = (id: string) =>
    findAccompanimentRank(c.scope, { id, productId: c.productId });

  test("le plus ancien est le premier, le plus récent le second", async () => {
    expect(await rankOf(c.firstId)).toBe(1);
    expect(await rankOf(c.secondId)).toBe(2);
  });

  test("un accompagnement archivé ne compte pas", async () => {
    // « Archivé c » est daté de 2025, entre les deux : s'il comptait,
    // « Second c » serait troisième.
    expect(await rankOf(c.secondId)).toBe(2);
  });

  test("un accompagnement d'un autre produit ne compte pas", async () => {
    // « Voisin c » est daté de 2020, plus ancien que tous les autres.
    expect(await rankOf(c.firstId)).toBe(1);
  });

  test("un projet sans date de début n'a pas de rang", async () => {
    expect(await rankOf(c.undatedId)).toBeNull();
  });

  test("aucun rang ne se calcule depuis un autre domaine", async () => {
    const leaked = await findAccompanimentRank(a.scope, {
      id: c.secondId,
      productId: c.productId,
    });
    expect(leaked).toBeNull();
  });

  test("un accompagnement intercalé décale le rang, sans une écriture sur le projet", async () => {
    // Le cœur du critère. « Second c » n'est pas touché : c'est l'histoire du
    // produit qui change, et le rang la suit.
    const before = await rankOf(c.secondId);
    expect(before).toBe(2);

    const inserted = await c.scope.insert(projects, {
      name: "Intercalé c",
      productId: c.productId,
      statusId: c.activeStatusId,
      startedOn: "2025-06-01",
    });

    expect(await rankOf(c.secondId)).toBe(3);
    expect(await rankOf(inserted.id)).toBe(2);

    // L'état de la fixture est rendu comme il a été trouvé — et l'archivage
    // du nouveau venu remet « Second c » deuxième, ce qui redit d'un autre
    // angle qu'un accompagnement rangé ne compte plus.
    await c.scope.archive(projects, inserted.id);
    expect(await rankOf(c.secondId)).toBe(2);
  });
});
