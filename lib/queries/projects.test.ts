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
  listProjectFormOptions,
  listProjects,
  type ProjectFormKeep,
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
  /** La seconde entité : sans elle, le filtre d'entité n'écarterait rien. */
  secondEntityId: string;
  doneStatusId: string;
  activeStatusId: string;
  researchJobId: string;
  /** Le métier du projet `Ancien` — il donne sa seconde option au filtre. */
  contentJobId: string;
  /** Déclaré par le seul projet archivé : jamais proposé au filtrage. */
  orphanJobId: string;
  approachId: string;
  orphanApproachId: string;
};

const suffix = Math.random().toString(36).slice(2, 10);
let a: Fixture;
let b: Fixture;

/**
 * Un domaine complet : **deux entités**, deux statuts, **trois métiers dont un
 * orphelin**, deux approches dont une orpheline, un produit vivant par entité
 * et un produit archivé, et six projets — un frais, un ancien, un sans
 * activité, un archivé, un rattaché au produit archivé, et le voisin de la
 * seconde entité.
 *
 * **Les deux référentiels de T7.2 ont leur `position` à contre-alphabet**, la
 * règle déjà tenue par les approches du domaine `c` : sans cela, l'ordre du
 * domaine et celui du dictionnaire coïncideraient, et le tri se validerait sur
 * rien.
 */
async function seedDomain(label: string): Promise<Fixture> {
  const domain = await superAdmin.createDomain({
    name: `__test__projects__${label}__${suffix}`,
    competenceCenterName: `Centre ${label}`,
  });
  const scope = forDomain({ domainId: domain.id });

  const entity = await scope.insert(entities, {
    label: `Entité ${label}`,
    position: "2",
  });
  /* La seconde entité, en position **1** alors qu'elle passe **après** la
     première dans l'alphabet : l'ordre du domaine prime sur celui du
     dictionnaire, et c'est ce désaccord qui rend le tri mesurable. */
  const secondEntity = await scope.insert(entities, {
    label: `Zone voisine ${label}`,
    position: "1",
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

  /* Le référentiel des métiers du domaine. Le formulaire de projet les propose
     depuis T2.6 ; **la liste transverse les filtre depuis T7.2** — les métiers
     **déclarés du projet**, jamais ceux que son équipe porte (D44).

     `position` à contre-alphabet ici aussi : « UX Research » ferme le
     dictionnaire et ouvre le référentiel. */
  const research = await scope.insert(jobs, {
    label: `UX Research ${label}`,
    position: "1",
  });
  const content = await scope.insert(jobs, {
    label: `Content Design ${label}`,
    position: "2",
  });
  /* Le métier que seul le projet **archivé** déclare : il ne doit pas être
     proposé au filtrage. Le pendant exact de l'approche orpheline. */
  const orphanJob = await scope.insert(jobs, {
    label: `Métier orphelin ${label}`,
    position: "3",
  });

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
  /* Le produit de la seconde entité : c'est lui qui donne au filtre d'entité
     quelque chose à écarter. Un projet n'a pas d'entité à lui — il la tient de
     son produit —, donc le filtre ne se mesure que par un second produit. */
  const secondProduct = await scope.insert(products, {
    name: `Produit voisin ${label}`,
    entityId: secondEntity.id,
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
  /* Le voisin, sous la seconde entité. Sa fraîcheur est la plus ancienne du
     domaine : il se range juste avant « Muet », qui n'en a aucune. */
  await scope.insert(projects, {
    name: `Voisin ${label}`,
    productId: secondProduct.id,
    statusId: active.id,
    lastActivityAt: new Date("2022-01-31T00:00:00Z"),
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

  await scope.insert(projectApproaches, {
    projectId: fresh.id,
    approachId: approach.id,
  });

  // Le projet archivé déclare l'approche orpheline : elle ne doit pas être
  // proposée au filtrage.
  await scope.insert(projectApproaches, {
    projectId: archivedProject.id,
    approachId: orphanApproach.id,
  });

  await scope.insert(projectJobs, { projectId: fresh.id, jobId: research.id });
  await scope.insert(projectJobs, { projectId: old.id, jobId: content.id });

  // Et le métier orphelin sur le seul projet archivé, comme l'approche.
  await scope.insert(projectJobs, {
    projectId: archivedProject.id,
    jobId: orphanJob.id,
  });

  return {
    domainId: domain.id,
    scope,
    entityId: entity.id,
    secondEntityId: secondEntity.id,
    activeStatusId: active.id,
    doneStatusId: done.id,
    researchJobId: research.id,
    contentJobId: content.id,
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

/* ==========================================================================
   La fixture du formulaire — T4bis.1

   Un quatrième domaine, et non des lignes de plus dans le premier : trois
   tests de la liste transverse comptent leurs lignes, et c'est déjà la raison
   pour laquelle le domaine `c` existe. Celui-ci porte une valeur archivée de
   chaque sorte, plus une seconde non gardée pour éprouver que l'exception est
   nominative.
   ========================================================================== */

type FormFixture = {
  domainId: string;
  scope: ScopedDb;
  /** Ce que la ligne éditée porte : le `keep` complet de la page. */
  keep: ProjectFormKeep;
  liveProductId: string;
  archivedProductId: string;
  liveStatusId: string;
  archivedStatusId: string;
  liveJobId: string;
  archivedJobId: string;
  /** Archivé et **non gardé** : il doit rester absent. */
  otherArchivedJobId: string;
  liveApproachId: string;
  archivedApproachId: string;
  livePersonId: string;
  archivedPersonId: string;
  /** Désactivée sans être archivée : la seconde moitié du cas des personnes. */
  inactivePersonId: string;
  /** Désactivée, non gardée : elle doit rester absente. */
  otherInactivePersonId: string;
  /** Côté entité : ni métier design, ni disponibilité (arbitrage (d)). */
  stakeholderPersonId: string;
};

let d: FormFixture;

async function seedFormDomain(): Promise<FormFixture> {
  const domain = await superAdmin.createDomain({
    name: `__test__form__${suffix}`,
    competenceCenterName: "Centre d",
  });
  const scope = forDomain({ domainId: domain.id });

  const entity = await scope.insert(entities, { label: "Entité d" });

  const liveProduct = await scope.insert(products, {
    name: "Produit vivant d",
    entityId: entity.id,
  });
  const archivedProduct = await scope.insert(products, {
    name: "Produit archivé d",
    entityId: entity.id,
  });

  const liveStatus = await scope.insert(projectStatuses, {
    label: "Statut vivant d",
    nature: "active",
    position: "1",
  });
  const archivedStatus = await scope.insert(projectStatuses, {
    label: "Statut archivé d",
    nature: "active",
    position: "2",
  });
  /* Un statut **terminé** : c'est lui qui fait de `livePerson` le témoin de la
     seconde exclusion du décompte de disponibilité (28/08/2026). */
  const doneStatus = await scope.insert(projectStatuses, {
    label: "Statut terminé d",
    nature: "done",
    position: "3",
  });

  const liveJob = await scope.insert(jobs, { label: "Métier vivant d" });
  const archivedJob = await scope.insert(jobs, { label: "Métier archivé d" });
  const otherArchivedJob = await scope.insert(jobs, {
    label: "Autre métier archivé d",
  });

  const liveApproach = await scope.insert(approaches, {
    label: "Approche vivante d",
  });
  const archivedApproach = await scope.insert(approaches, {
    label: "Approche archivée d",
  });

  /* Le métier entre dans la fixture en T5bis.7 : le formulaire l'affiche à côté
     de chaque nom, et une colonne qui n'est jamais peuplée par la fixture est
     une colonne dont le test ne dit rien.

     **La disponibilité, elle, ne s'y sème plus** (28/08/2026) : elle se déduit
     du nombre d'accompagnements **en cours** — ni archivés, ni terminés. Ce sont
     donc les équipes des projets `edited` et `finished`, plus bas, qui la
     produisent. */
  const livePerson = await scope.insert(persons, {
    fullName: "Personne vivante d",
    source: "manual",
    kind: "center",
    jobId: liveJob.id,
  });
  /* Sur le métier **qui sera archivé** : c'est cette ligne qui éprouve la
     septième lecture de `listProjectFormOptions`. Rappelée par `keep`, elle
     doit continuer de dire de quel métier elle relève — un libellé pris dans
     la liste proposée au choix la laisserait muette. */
  const archivedPerson = await scope.insert(persons, {
    fullName: "Personne archivée d",
    source: "manual",
    kind: "center",
    jobId: archivedJob.id,
  });
  /* Un intervenant côté entité : la dérivation ne lui donne pas de
     disponibilité (arbitrage (d) de C5bis, tenu par la lecture depuis que le
     `CHECK` est tombé), et `docs/04` §2 ne lui donne pas de métier design. Les
     deux valeurs nulles sont sa propriété, pas un oubli. */
  const stakeholderPerson = await scope.insert(persons, {
    fullName: "Personne côté entité d",
    source: "manual",
    kind: "stakeholder",
  });
  // Désactivée sans être archivée : `is_active` et `archived_at` sont deux
  // conditions distinctes, et l'exception doit lever les deux.
  const inactivePerson = await scope.insert(persons, {
    fullName: "Personne désactivée d",
    source: "manual",
    kind: "center",
    isActive: false,
  });
  const otherInactivePerson = await scope.insert(persons, {
    fullName: "Autre personne désactivée d",
    source: "manual",
    kind: "center",
    isActive: false,
  });

  // Le projet édité pointe le produit et le statut qui seront archivés, et lie
  // le métier, l'approche et les deux personnes qui le seront aussi.
  const edited = await scope.insert(projects, {
    name: "Édité d",
    productId: archivedProduct.id,
    statusId: archivedStatus.id,
  });
  await scope.insert(projectJobs, {
    projectId: edited.id,
    jobId: archivedJob.id,
  });
  await scope.insert(projectApproaches, {
    projectId: edited.id,
    approachId: archivedApproach.id,
  });
  await scope.insert(projectMembers, {
    projectId: edited.id,
    personId: archivedPerson.id,
    isContributor: false,
  });
  await scope.insert(projectMembers, {
    projectId: edited.id,
    personId: inactivePerson.id,
    isContributor: false,
  });

  /* **Le témoin de la nature `done`, sur cette lecture-ci.** Le décompte de
     `listProjectFormOptions` est une **autre requête** que celui de `listTeam` —
     un regroupement contre une sous-requête corrélée —, et rien dans le
     compilateur ne les oblige à poser les mêmes exclusions. `livePerson` est
     membre d'un seul accompagnement, terminé : elle doit rester « disponible »,
     et elle basculerait à « partiellement » si l'exclusion tombait ici seule. */
  const finished = await scope.insert(projects, {
    name: "Terminé d",
    productId: liveProduct.id,
    statusId: doneStatus.id,
  });
  await scope.insert(projectMembers, {
    projectId: finished.id,
    personId: livePerson.id,
    isContributor: false,
  });

  // L'archivage vient **après** l'insertion : la couche refuserait le contraire
  // sur le produit et le statut, dont elle vérifie l'appartenance au domaine.
  await scope.archive(products, archivedProduct.id);
  await scope.archive(projectStatuses, archivedStatus.id);
  await scope.archive(jobs, archivedJob.id);
  await scope.archive(jobs, otherArchivedJob.id);
  await scope.archive(approaches, archivedApproach.id);
  await scope.archive(persons, archivedPerson.id);

  return {
    domainId: domain.id,
    scope,
    keep: {
      productId: archivedProduct.id,
      statusId: archivedStatus.id,
      jobIds: [archivedJob.id],
      approachIds: [archivedApproach.id],
      personIds: [archivedPerson.id, inactivePerson.id],
    },
    liveProductId: liveProduct.id,
    archivedProductId: archivedProduct.id,
    liveStatusId: liveStatus.id,
    archivedStatusId: archivedStatus.id,
    liveJobId: liveJob.id,
    archivedJobId: archivedJob.id,
    otherArchivedJobId: otherArchivedJob.id,
    liveApproachId: liveApproach.id,
    archivedApproachId: archivedApproach.id,
    livePersonId: livePerson.id,
    archivedPersonId: archivedPerson.id,
    inactivePersonId: inactivePerson.id,
    otherInactivePersonId: otherInactivePerson.id,
    stakeholderPersonId: stakeholderPerson.id,
  };
}

beforeAll(async () => {
  a = await seedDomain("a");
  b = await seedDomain("b");
  c = await seedDetailDomain();
  d = await seedFormDomain();
}, 240_000);

afterAll(async () => {
  const ids = [a?.domainId, b?.domainId, c?.domainId, d?.domainId].filter(
    Boolean,
  ) as string[];
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
      "Voisin a",
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

  test("chaque ligne porte son produit, son statut, son équipe et sa fraîcheur", async () => {
    // Recherche par nom et non par position : ce test ne doit rien dire du
    // tri, sans quoi une régression d'ordre en ferait tomber deux.
    const rows = await listProjects(a.scope);
    const fresh = rows.find((row) => row.name === "Frais a");

    expect(fresh?.productName).toBe("Produit a");
    expect(fresh?.statusLabel).toBe("En cours");
    expect(fresh?.statusNature).toBe("active");
    expect(fresh?.team.map((member) => member.fullName)).toEqual([
      "Inès Kaddour a",
    ]);
    expect(fresh?.lastActivityAt?.toISOString()).toBe(
      "2026-08-31T00:00:00.000Z",
    );
  });

  test("un projet sans équipe reste une ligne normale", async () => {
    const rows = await listProjects(a.scope);
    const mute = rows.find((row) => row.name === "Muet a");

    expect(mute?.team).toEqual([]);
    expect(mute?.lastActivityAt).toBeNull();
  });
});

/* ==========================================================================
   Les filtres
   ========================================================================== */

describe("listProjects — filtres", () => {
  test("le filtre de statut retient les projets de ce statut", async () => {
    const rows = await listProjects(a.scope, { statusId: a.doneStatusId });
    expect(names(rows)).toEqual(["Ancien a"]);
  });

  test("le filtre d'approche retient le projet qui la déclare", async () => {
    const rows = await listProjects(a.scope, { approachId: a.approachId });
    expect(names(rows)).toEqual(["Frais a"]);
  });

  test("les filtres se combinent, chacun restreignant le précédent", async () => {
    const active = await listProjects(a.scope, { statusId: a.activeStatusId });
    expect(active).toHaveLength(4);

    const andApproach = await listProjects(a.scope, {
      statusId: a.activeStatusId,
      approachId: a.approachId,
    });
    expect(names(andApproach)).toEqual(["Frais a"]);

    // Une troisième dimension qui ne recoupe pas : la combinaison se vide.
    const andSearch = await listProjects(a.scope, {
      statusId: a.activeStatusId,
      approachId: a.approachId,
      search: "Ancien",
    });
    expect(andSearch).toEqual([]);
  });

  test("le filtre d'entité retient les projets de son entité, et elle seule", async () => {
    // Un projet n'a pas d'entité à lui : il la tient de son produit, et c'est
    // `products.entity_id` que le filtre traverse.
    expect(names(await listProjects(a.scope, { entityId: a.secondEntityId })))
      .toEqual(["Voisin a"]);

    // L'autre entité rend tout le reste — et pas le voisin.
    const first = await listProjects(a.scope, { entityId: a.entityId });
    expect(names(first)).toEqual([
      "Frais a",
      "Ancien a",
      "Taux 100 % a",
      "Muet a",
    ]);
  });

  test("le filtre de métier retient le projet qui le déclare", async () => {
    // D44 : les métiers **déclarés du projet** font foi. `Frais a` déclare
    // « UX Research » ; son équipe, elle, n'a jamais été consultée pour cela.
    expect(names(await listProjects(a.scope, { jobId: a.researchJobId })))
      .toEqual(["Frais a"]);
    expect(names(await listProjects(a.scope, { jobId: a.contentJobId })))
      .toEqual(["Ancien a"]);
  });

  test("le métier du seul projet archivé ne ramène rien", async () => {
    // La liaison existe, mais son projet est rangé : le filtre ne le
    // ressuscite pas.
    expect(await listProjects(a.scope, { jobId: a.orphanJobId })).toEqual([]);
  });

  test("les quatre filtres se combinent", async () => {
    // `Frais a` est le seul à porter les quatre à la fois.
    const all = await listProjects(a.scope, {
      entityId: a.entityId,
      jobId: a.researchJobId,
      approachId: a.approachId,
      statusId: a.activeStatusId,
    });
    expect(names(all)).toEqual(["Frais a"]);

    // Une seule dimension qui ne recoupe pas suffit à vider la combinaison —
    // le voisin est bien de la seconde entité, mais il ne déclare aucun métier.
    const crossed = await listProjects(a.scope, {
      entityId: a.secondEntityId,
      jobId: a.researchJobId,
    });
    expect(crossed).toEqual([]);
  });

  test("un filtre ne laisse pas passer une valeur d'un autre domaine", async () => {
    const rows = await listProjects(a.scope, { approachId: b.approachId });
    expect(rows).toEqual([]);
  });

  /* Les deux frontières de T7.2, **une par test** : un constat partagé
     tomberait sous l'une comme sous l'autre neutralisation, et une chute non
     isolée ne désigne plus le filtre qu'elle éprouve. */

  test("le filtre d'entité ne laisse pas passer une entité d'un autre domaine", async () => {
    // L'entité de `b` ne désigne aucun produit d'ici — `products` porte son
    // `filter()` dans le `on` de sa jointure.
    expect(await listProjects(a.scope, { entityId: b.entityId })).toEqual([]);
    expect(await listProjects(a.scope, { entityId: b.secondEntityId })).toEqual(
      [],
    );
  });

  test("le filtre de métier ne laisse pas passer un métier d'un autre domaine", async () => {
    // Le métier de `b` ne trouve aucune liaison d'ici — `filter(projectJobs)`
    // est dans le `where` de l'`exists`.
    expect(await listProjects(a.scope, { jobId: b.researchJobId })).toEqual([]);
    expect(await listProjects(a.scope, { jobId: b.contentJobId })).toEqual([]);
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

    // Les statuts suivent le `position` du domaine, pas l'alphabet.
    expect(options.statuses.map((option) => option.label)).toEqual([
      "Terminé",
      "En cours",
    ]);
    expect(options.approaches.map((option) => option.label)).toEqual([
      "Research a",
    ]);
  });

  test("l'approche du seul projet archivé n'est pas proposée", async () => {
    const options = await listProjectFilterOptions(a.scope);

    expect(options.approaches.map((option) => option.id)).not.toContain(
      a.orphanApproachId,
    );
  });

  test("les deux entités qui portent un projet vivant sont proposées", async () => {
    const options = await listProjectFilterOptions(a.scope);

    // L'ordre est celui du domaine — `position` d'abord —, et il contredit ici
    // le dictionnaire : « Zone voisine » est en position 1.
    expect(options.entities.map((option) => option.label)).toEqual([
      "Zone voisine a",
      "Entité a",
    ]);
  });

  test("les deux métiers déclarés par un projet vivant sont proposés", async () => {
    const options = await listProjectFilterOptions(a.scope);

    // `position` de nouveau contre l'alphabet : « UX Research » est en 1.
    expect(options.jobs.map((option) => option.label)).toEqual([
      "UX Research a",
      "Content Design a",
    ]);
  });

  test("le métier du seul projet archivé n'est pas proposé", async () => {
    const options = await listProjectFilterOptions(a.scope);

    // Le pendant exact de l'approche orpheline : offrir ce filtre serait
    // offrir un chemin vers le vide.
    expect(options.jobs.map((option) => option.id)).not.toContain(a.orphanJobId);
  });

  test("aucune option ne mène à une liste vide", async () => {
    // Le contrat des quatre listes, et le seul qui les couvre toutes : ce qui
    // est proposé ramène au moins une ligne.
    const options = await listProjectFilterOptions(a.scope);

    for (const option of options.entities) {
      expect(
        (await listProjects(a.scope, { entityId: option.id })).length,
      ).toBeGreaterThan(0);
    }
    for (const option of options.jobs) {
      expect(
        (await listProjects(a.scope, { jobId: option.id })).length,
      ).toBeGreaterThan(0);
    }

    expect(options.entities.length).toBeGreaterThan(0);
    expect(options.jobs.length).toBeGreaterThan(0);
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
    expect(all.map((option) => option.id)).not.toContain(b.approachId);
    expect(all.map((option) => option.id)).not.toContain(b.entityId);
    expect(all.map((option) => option.id)).not.toContain(b.researchJobId);
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

  /* T4bis.3 — la page d'un accompagnement archivé reste servie (règle 4,
     F1-D3), et c'est cette colonne qui lui permet de le **dire** : sans elle,
     l'écran servait une page rigoureusement identique à celle d'un
     accompagnement vivant, panneaux de saisie compris. */

  test("un accompagnement vivant n'a pas de date d'archivage", async () => {
    const project = await findProjectDetail(c.scope, c.secondId);
    expect(project?.archivedAt).toBeNull();
  });

  test("un accompagnement archivé porte sa date", async () => {
    const project = await findProjectDetail(c.scope, c.archivedId);
    expect(project?.archivedAt).toBeInstanceOf(Date);
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

/* ==========================================================================
   Les valeurs proposées au formulaire — T4bis.1

   « On propose des lignes vivantes », avec **une exception nominative** : les
   cinq valeurs que la ligne éditée porte déjà, fussent-elles archivées depuis.
   Sans elle, corriger l'objectif d'un accompagnement lui ferait perdre son
   rattachement, son statut, ses métiers, ses approches et son équipe — et pour
   les trois listes à cocher, **sans que rien ne s'affiche** : une case absente
   du rendu ne revient pas dans le `FormData`, et les diffs de `syncMembers`
   concluent au retrait.
   ========================================================================== */

describe("listProjectFormOptions — les valeurs archivées", () => {
  /** Les cinq listes réduites à leurs identifiants, dans l'ordre rendu. */
  async function optionIds(scope: ScopedDb, keep?: ProjectFormKeep) {
    const options = await listProjectFormOptions(scope, keep);
    return {
      products: options.products.map((row) => row.id),
      statuses: options.statuses.map((row) => row.id),
      jobs: options.jobs.map((row) => row.id),
      approaches: options.approaches.map((row) => row.id),
      people: options.people.map((row) => row.id),
    };
  }

  test("sans exception, aucune valeur archivée n'est proposée", async () => {
    const ids = await optionIds(d.scope);

    expect(ids.products).not.toContain(d.archivedProductId);
    expect(ids.statuses).not.toContain(d.archivedStatusId);
    expect(ids.jobs).not.toContain(d.archivedJobId);
    expect(ids.approaches).not.toContain(d.archivedApproachId);
    expect(ids.people).not.toContain(d.archivedPersonId);
    // Ni la personne désactivée : c'est l'autre moitié de la condition.
    expect(ids.people).not.toContain(d.inactivePersonId);

    // Les vivantes, elles, sont bien là — sans quoi le test ne dirait rien.
    expect(ids.products).toContain(d.liveProductId);
    expect(ids.statuses).toContain(d.liveStatusId);
    expect(ids.jobs).toContain(d.liveJobId);
    expect(ids.approaches).toContain(d.liveApproachId);
    expect(ids.people).toContain(d.livePersonId);
  });

  test("les cinq valeurs de la ligne éditée reviennent, une fois chacune", async () => {
    const ids = await optionIds(d.scope, d.keep);

    expect(ids.products).toContain(d.archivedProductId);
    expect(ids.statuses).toContain(d.archivedStatusId);
    expect(ids.jobs).toContain(d.archivedJobId);
    expect(ids.approaches).toContain(d.archivedApproachId);
    expect(ids.people).toContain(d.archivedPersonId);

    // Une valeur vivante conservée ne doit pas se dédoubler.
    const live = await optionIds(d.scope, {
      productId: d.liveProductId,
      statusId: d.liveStatusId,
      jobIds: [d.liveJobId],
      approachIds: [d.liveApproachId],
      personIds: [d.livePersonId],
    });
    expect(live.products.filter((id) => id === d.liveProductId)).toHaveLength(1);
    expect(live.jobs.filter((id) => id === d.liveJobId)).toHaveLength(1);
    expect(live.people.filter((id) => id === d.livePersonId)).toHaveLength(1);
  });

  test("l'exception est nominative : elle n'ouvre pas la liste aux archivés", async () => {
    const ids = await optionIds(d.scope, d.keep);

    // Un second métier archivé, que la ligne éditée ne porte pas.
    expect(ids.jobs).not.toContain(d.otherArchivedJobId);
    // Et une seconde personne désactivée, qu'elle ne porte pas non plus.
    expect(ids.people).not.toContain(d.otherInactivePersonId);
  });

  test("la personne cumule les deux conditions, et l'exception les lève toutes deux", async () => {
    // « Personne désactivée d » n'est pas archivée : seule `is_active` la
    // masque. Si l'exception ne levait que `archived_at`, elle resterait
    // absente des cases et son appartenance à l'équipe serait perdue.
    const ids = await optionIds(d.scope, { personIds: [d.inactivePersonId] });

    expect(ids.people).toContain(d.inactivePersonId);
    expect(ids.people).not.toContain(d.archivedPersonId);
    expect(ids.people).not.toContain(d.otherInactivePersonId);
  });

  test("l'exception ne traverse pas la frontière de domaine", async () => {
    const ids = await optionIds(a.scope, d.keep);

    expect(ids.products).not.toContain(d.archivedProductId);
    expect(ids.statuses).not.toContain(d.archivedStatusId);
    expect(ids.jobs).not.toContain(d.archivedJobId);
    expect(ids.approaches).not.toContain(d.archivedApproachId);
    expect(ids.people).not.toContain(d.archivedPersonId);
    // Le domaine `a` continue de proposer les siennes.
    expect(ids.jobs).toContain(a.researchJobId);
  });

  test("sans `keep`, le formulaire de création reste ce qu'il était", async () => {
    // Le garde-fou : aucune des cinq listes ne bouge quand l'appelant ne
    // fournit rien, et une liste vide n'est pas une exception.
    const bare = await optionIds(d.scope);
    const empty = await optionIds(d.scope, {
      jobIds: [],
      approachIds: [],
      personIds: [],
    });

    expect(empty).toEqual(bare);
  });
});

/* ==========================================================================
   Le métier et la disponibilité d'une personne — T5bis.7

   Le formulaire **puise** dans le référentiel au lieu de le doubler : chaque
   ligne dit de quel métier relève la personne et si elle est disponible. Ce
   sont deux valeurs **reportées**, jamais un tri ni un rapprochement avec les
   métiers déclarés du projet (D44, garde-fous 2 et 3).
   ========================================================================== */

describe("listProjectFormOptions — le métier et la disponibilité", () => {
  /** La personne cherchée dans la liste rendue, ou `undefined`. */
  async function personIn(keep: ProjectFormKeep | undefined, id: string) {
    const options = await listProjectFormOptions(d.scope, keep);
    return options.people.find((person) => person.id === id);
  }

  test("un accompagnement terminé ne pèse pas : la personne reste disponible", async () => {
    const person = await personIn(undefined, d.livePersonId);

    expect(person?.jobLabel).toBe("Métier vivant d");
    /* **Une appartenance, sur un accompagnement terminé, donc disponible** — et
       rien n'a été semé pour le dire : c'est la dérivation du 28/08/2026,
       éprouvée ici sur le formulaire qui la sert au moment de choisir une
       équipe. Sans l'exclusion de la nature `done`, elle rendrait
       « partiellement disponible ». */
    expect(person?.availability).toBe("available");
  });

  /* Le témoin de la précédente : sans lui, une dérivation qui rendrait
     « disponible » à tout le monde passerait pour juste. `inactivePerson` est
     membre du projet `edited`, qui est vivant — un seul, donc partiellement
     disponible. */
  test("un accompagnement vivant fait passer à partiellement disponible", async () => {
    const person = await personIn(d.keep, d.inactivePersonId);

    expect(person?.availability).toBe("partial");
  });

  test("un intervenant côté entité n'a ni l'un ni l'autre", async () => {
    const person = await personIn(undefined, d.stakeholderPersonId);

    /* Deux nuls qui sont une propriété, pas une donnée manquante : `docs/04` §2
       pour le métier, l'arbitrage (d) de C5bis pour la disponibilité — que la
       **lecture** tient désormais seule, le `CHECK` étant tombé avec la
       colonne. */
    expect(person?.jobLabel).toBeNull();
    expect(person?.availability).toBeNull();
  });

  test("un métier archivé se dit encore sur la personne qui le porte", async () => {
    /* La propriété qu'achète la septième lecture, et **le seul appel qui
       distingue les deux façons d'écrire cette carte** : le `keep` rappelle la
       personne, jamais son métier. La liste proposée au choix n'a donc aucune
       raison de rétablir `archivedJob`, et un libellé qu'on y prendrait serait
       nul. Il vient d'une lecture qui ne propose rien.

       `d.keep` ne convient pas ici : il garde le métier **et** la personne,
       si bien que les deux écritures rendraient le même libellé et que la mise
       en défaut ne mordrait pas. */
    const options = await listProjectFormOptions(d.scope, {
      personIds: [d.archivedPersonId],
    });
    const person = options.people.find((row) => row.id === d.archivedPersonId);

    expect(person?.jobLabel).toBe("Métier archivé d");
    // Le métier reste hors des valeurs **proposées**, et c'est ce qui donne au
    // cas sa force : la carte des libellés ne s'aligne pas sur la liste.
    expect(options.jobs.map((row) => row.id)).not.toContain(d.archivedJobId);
  });
});
