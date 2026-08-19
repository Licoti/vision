/**
 * Les tests des lectures de l'écran Équipe — la liste, ses cinq filtres, et les
 * options qu'ils proposent.
 *
 * Ils tournent sur la branche Neon dédiée — `vitest.config.mts` remappe
 * `DATABASE_URL` sur `TEST_DATABASE_URL` — et écrivent réellement : un tri par
 * nom, un `leftJoin` filtré sur le domaine, un `exists` conjonctif et six
 * filtres d'étanchéité ne se vérifient pas sur un faux.
 *
 * Deux domaines sont amorcés, comme dans `lib/db/scoped.test.ts` : sans un
 * second domaine, aucun test d'étanchéité ne prouve quoi que ce soit.
 *
 * **Quatre lignes sont forgées par le client brut**, et c'est délibéré : la
 * couche scopée les refuserait par `assertPreconditions`, or c'est précisément à
 * cela qu'une fuite ressemblerait. Sans elles, retirer un `filter()` d'une
 * jointure ne ferait tomber aucun test — l'`inArray` sur les personnes du
 * domaine masquerait le manque. Chacune est taillée pour n'être écartée que par
 * **un seul** filtre : c'est ce qui rend la mise en défaut concluante, filtre
 * par filtre.
 *
 * **Carla est la personne qui rend la conjonction observable** : elle porte
 * *l'une* des deux compétences d'Alice, jamais les deux, et la porte à un rang
 * plus bas. Sans elle, un `or` à la place des `exists` conjoints rendrait
 * exactement le même résultat et le test ne prouverait rien.
 *
 * Les constats se lisent par identifiant et non par position — sauf le test du
 * tri, qui compare des rangs relatifs. Un défaut d'ordre ne doit pas faire
 * tomber les autres.
 *
 * **T5bis.4 ajoute la fiche**, et avec elle trois tables jointes de plus —
 * `project_members`, `projects`, `project_statuses` —, donc **trois lignes
 * forgées de plus**, sur la même règle : chacune ne franchit la frontière que
 * sur *une* colonne. Sans elles, retirer le `filter()` de l'une de ces trois
 * jointures ne ferait tomber aucun test — la leçon de T5bis.3, où un filtre
 * qu'aucune ligne forgée ne vise n'est pas éprouvé.
 */

import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { db } from "@/lib/db/client";
import { forDomain, superAdmin, type ScopedDb } from "@/lib/db/scoped";
import {
  domains,
  entities,
  jobs,
  personSkills,
  persons,
  products,
  projectMembers,
  projectStatuses,
  projects,
  skillLevels,
  skills,
} from "@/lib/db/schema";

import { findPersonDetail, listTeam, listTeamFilterOptions } from "./team";

/** Enfants d'abord, parents ensuite : `domains` refuse la suppression sinon. */
const teardownOrder = [
  projectMembers,
  projects,
  products,
  entities,
  projectStatuses,
  personSkills,
  persons,
  skillLevels,
  skills,
  jobs,
];

type Fixture = {
  domainId: string;
  scope: ScopedDb;
  /** Trois compétences déclarées, dont deux au même rang : le tri s'y lit. */
  aliceId: string;
  /** Sans métier, sans compétence : le `leftJoin` et l'état vide. */
  brunoId: string;
  /** Une seule des deux compétences d'Alice, et à un rang plus bas. */
  carlaId: string;
  /** Côté entité : la mention, et pas de disponibilité (arbitrage (d)). */
  zoeId: string;
  /** Archivée : absente du référentiel, et de ses options. */
  yvesId: string;
  /** Aucune compétence légitime : c'est sur elle que les fuites sont forgées. */
  damienId: string;
  jobId: string;
  /** Porté par Carla seule : c'est lui qui rend le filtre `metier` observable. */
  researchJobId: string;
  /** Porté par la seule personne archivée : il ne doit paraître nulle part. */
  forgottenJobId: string;
  /** Porté par personne : c'est sur lui qu'une fuite de métier se forge. */
  ghostJobId: string;
  advancedLevelId: string;
  expertLevelId: string;
  uxSkillId: string;
  a11ySkillId: string;
  protoSkillId: string;
  /** Portée par Alice, puis archivée : affichée sur sa ligne, hors des options. */
  archivedSkillId: string;
  /** Portée par la seule personne archivée. */
  forgottenSkillId: string;
  probeLinkSkillId: string;
  probeSkillId: string;
  probeLevelSkillId: string;
  /* --- Ce que la fiche ajoute (T5bis.4) : les accompagnements d'Alice. --- */
  productId: string;
  activeStatusId: string;
  /** Le plus récent : il ouvre la liste. */
  freshProjectId: string;
  /** Sous un produit **archivé** : il reste, la personne l'a mené. */
  underArchivedProjectId: string;
  /** Le plus ancien des datés. */
  oldProjectId: string;
  /** Sans date de début : il ferme la liste (`nulls last`). */
  undatedProjectId: string;
  /** Archivé : hors de la fiche. */
  archivedProjectId: string;
  /** Aucun membre légitime : c'est sur lui que la liaison forgée porte. */
  probeLinkProjectId: string;
};

const suffix = Math.random().toString(36).slice(2, 10);
let a: Fixture;
let b: Fixture;
/** La personne de `a` dont le métier pointe, par forgeage, un métier de `b`. */
let forgedJobPersonId: string;
/** Le projet de `b` dont le statut est de `a` — il n'est écarté que par `filter(projects)`. */
let forgedCrossProjectId: string;
/** Le projet de `a` dont le statut est de `b` — écarté par `filter(projectStatuses)` seul. */
let forgedStatusProjectId: string;

async function seedDomain(label: string): Promise<Fixture> {
  const domain = await superAdmin.createDomain({
    name: `__test__team__${label}__${suffix}`,
    competenceCenterName: `Centre ${label}`,
  });
  const scope = forDomain({ domainId: domain.id });

  const job = await scope.insert(jobs, { label: `Product Design ${label}` });
  const research = await scope.insert(jobs, { label: `UX Research ${label}` });
  const forgottenJob = await scope.insert(jobs, {
    label: `Métier oublié ${label}`,
  });
  const ghostJob = await scope.insert(jobs, { label: `Métier fantôme ${label}` });

  const advanced = await scope.insert(skillLevels, {
    label: `Avancé ${label}`,
    rank: 3,
  });
  const expert = await scope.insert(skillLevels, {
    label: `Expert ${label}`,
    rank: 4,
  });

  const ux = await scope.insert(skills, { label: `UX Design ${label}` });
  const a11y = await scope.insert(skills, { label: `Accessibilité ${label}` });
  const proto = await scope.insert(skills, { label: `Prototypage ${label}` });
  const archivedSkill = await scope.insert(skills, {
    label: `Design System ${label}`,
  });
  const forgottenSkill = await scope.insert(skills, {
    label: `Compétence oubliée ${label}`,
  });

  // Trois compétences qui n'appartiennent à personne : elles ne servent qu'aux
  // lignes forgées, et chacune nomme le filtre qu'elle éprouve.
  const probeLink = await scope.insert(skills, {
    label: `Sonde liaison ${label}`,
  });
  const probeSkill = await scope.insert(skills, {
    label: `Sonde compétence ${label}`,
  });
  const probeLevel = await scope.insert(skills, {
    label: `Sonde niveau ${label}`,
  });

  /* Insérées à rebours de l'alphabet : le tri par nom doit être celui de la
     requête, jamais celui de la saisie. */
  const zoe = await scope.insert(persons, {
    fullName: `Zoé Nguyen ${label}`,
    source: "manual",
    kind: "stakeholder",
  });
  const yves = await scope.insert(persons, {
    fullName: `Yves Ancien ${label}`,
    source: "manual",
    kind: "center",
    jobId: forgottenJob.id,
    availability: "available",
  });
  /* Le métier et la compétence d'Yves ne sont portés que par lui, et il est
     archivé : ni l'un ni l'autre ne doit paraître dans les options. C'est le
     seul test de `isNull(persons.archivedAt)` sur cette requête. */
  await scope.insert(personSkills, {
    personId: yves.id,
    skillId: forgottenSkill.id,
    levelId: expert.id,
  });
  await scope.archive(persons, yves.id);

  const damien = await scope.insert(persons, {
    fullName: `Damien Sonde ${label}`,
    source: "manual",
    kind: "center",
    jobId: job.id,
    availability: "partial",
  });
  const carla = await scope.insert(persons, {
    fullName: `Carla Dubois ${label}`,
    source: "manual",
    kind: "center",
    jobId: research.id,
    availability: "partial",
  });
  const bruno = await scope.insert(persons, {
    fullName: `Bruno Klein ${label}`,
    source: "manual",
    kind: "center",
    availability: "unavailable",
  });
  const alice = await scope.insert(persons, {
    fullName: `Alice Martin ${label}`,
    source: "manual",
    kind: "center",
    jobId: job.id,
    availability: "available",
    // La présentation : lue par la fiche seule, jamais par la liste.
    bio: `Conçoit les parcours de bout en bout ${label}.`,
  });

  /* Deux compétences au rang 4 et une au rang 3, saisies dans le désordre :
     le rang décroissant et le libellé qui départage sont tous deux observables. */
  await scope.insert(personSkills, {
    personId: alice.id,
    skillId: proto.id,
    levelId: advanced.id,
  });
  await scope.insert(personSkills, {
    personId: alice.id,
    skillId: ux.id,
    levelId: expert.id,
  });
  await scope.insert(personSkills, {
    personId: alice.id,
    skillId: a11y.id,
    levelId: expert.id,
  });

  /* Une compétence qu'Alice porte et dont le référentiel a été archivé depuis :
     elle reste sur sa ligne (la personne l'a déclarée) et sort des options (on
     ne la propose plus au choix). Deux règles, une seule ligne. */
  await scope.insert(personSkills, {
    personId: alice.id,
    skillId: archivedSkill.id,
    levelId: advanced.id,
  });
  await scope.archive(skills, archivedSkill.id);

  /* Carla : *une* des deux compétences d'Alice, au rang inférieur. C'est elle
     que la conjonction doit écarter, et le seuil de niveau aussi. */
  await scope.insert(personSkills, {
    personId: carla.id,
    skillId: ux.id,
    levelId: advanced.id,
  });

  /* ------------------------------------------------------------------
     Les accompagnements d'Alice (T5bis.4). Un produit, deux statuts, cinq
     projets : le récent, celui d'un produit archivé, l'ancien, celui sans
     date, et l'archivé. Plus un projet-sonde sans membre légitime.
     ------------------------------------------------------------------ */
  const entity = await scope.insert(entities, { label: `Entité ${label}` });
  const product = await scope.insert(products, {
    name: `Produit ${label}`,
    entityId: entity.id,
  });
  const archivedProduct = await scope.insert(products, {
    name: `Produit rangé ${label}`,
    entityId: entity.id,
  });
  await scope.archive(products, archivedProduct.id);

  const active = await scope.insert(projectStatuses, {
    label: `En cours ${label}`,
    nature: "active",
    position: "2",
  });
  const done = await scope.insert(projectStatuses, {
    label: `Terminé ${label}`,
    nature: "done",
    position: "1",
  });

  const fresh = await scope.insert(projects, {
    name: `Refonte ${label}`,
    productId: product.id,
    statusId: active.id,
    startedOn: "2026-02-01",
    expectedEndOn: "2026-07-31",
  });
  /* Sous un produit archivé : la fiche le garde (arbitrage du ticket), là où
     `listProjects` l'écarterait. Un produit rangé ne fait pas disparaître ce
     que la personne a fait. */
  const underArchived = await scope.insert(projects, {
    name: `Reprise ${label}`,
    productId: archivedProduct.id,
    statusId: active.id,
    startedOn: "2025-05-01",
  });
  const old = await scope.insert(projects, {
    name: `Audit ${label}`,
    productId: product.id,
    statusId: done.id,
    startedOn: "2024-03-01",
    expectedEndOn: "2024-09-30",
  });
  // Sans date : il doit fermer la liste, jamais l'ouvrir (`nulls last`).
  const undated = await scope.insert(projects, {
    name: `Cadrage ${label}`,
    productId: product.id,
    statusId: active.id,
  });
  const archivedProject = await scope.insert(projects, {
    name: `Rangé ${label}`,
    productId: product.id,
    statusId: done.id,
    startedOn: "2023-01-01",
  });
  const probeLinkProject = await scope.insert(projects, {
    name: `Sonde liaison projet ${label}`,
    productId: product.id,
    statusId: active.id,
    startedOn: "2022-01-01",
  });

  for (const projectId of [
    fresh.id,
    underArchived.id,
    old.id,
    undated.id,
    archivedProject.id,
  ]) {
    await scope.insert(projectMembers, { projectId, personId: alice.id });
  }
  await scope.archive(projects, archivedProject.id);

  return {
    domainId: domain.id,
    scope,
    aliceId: alice.id,
    brunoId: bruno.id,
    carlaId: carla.id,
    zoeId: zoe.id,
    yvesId: yves.id,
    damienId: damien.id,
    jobId: job.id,
    researchJobId: research.id,
    forgottenJobId: forgottenJob.id,
    ghostJobId: ghostJob.id,
    advancedLevelId: advanced.id,
    expertLevelId: expert.id,
    uxSkillId: ux.id,
    a11ySkillId: a11y.id,
    protoSkillId: proto.id,
    archivedSkillId: archivedSkill.id,
    forgottenSkillId: forgottenSkill.id,
    probeLinkSkillId: probeLink.id,
    probeSkillId: probeSkill.id,
    probeLevelSkillId: probeLevel.id,
    productId: product.id,
    activeStatusId: active.id,
    freshProjectId: fresh.id,
    underArchivedProjectId: underArchived.id,
    oldProjectId: old.id,
    undatedProjectId: undated.id,
    archivedProjectId: archivedProject.id,
    probeLinkProjectId: probeLinkProject.id,
  };
}

/**
 * Les six lignes que la couche scopée refuserait d'écrire.
 *
 * Chacune ne franchit la frontière que sur **une** colonne : c'est ce qui fait
 * qu'un seul filtre l'écarte, et donc qu'un seul test tombe quand on le retire.
 */
async function forgeLeaks(): Promise<void> {
  await db.insert(personSkills).values([
    // (1) La liaison elle-même est d'un autre domaine — tout le reste est de `a`.
    //     Seul `filter(personSkills)` l'écarte.
    {
      domainId: b.domainId,
      personId: a.damienId,
      skillId: a.probeLinkSkillId,
      levelId: a.advancedLevelId,
    },
    // (2) La compétence est d'un autre domaine. Seul `filter(skills)` l'écarte.
    {
      domainId: a.domainId,
      personId: a.damienId,
      skillId: b.probeSkillId,
      levelId: a.advancedLevelId,
    },
    // (3) Le niveau est d'un autre domaine. Seul `filter(skillLevels)` l'écarte.
    {
      domainId: a.domainId,
      personId: a.damienId,
      skillId: a.probeLevelSkillId,
      levelId: b.expertLevelId,
    },
    // (4) La **personne** est d'un autre domaine — la liaison, la compétence et
    //     le niveau sont de `a`. Seul `filter(persons)` l'écarte, et il n'y a
    //     que les options de filtre pour s'en apercevoir : la liste, elle, est
    //     bornée aux personnes qu'elle vient de lire.
    {
      domainId: a.domainId,
      personId: b.aliceId,
      skillId: a.probeSkillId,
      levelId: a.advancedLevelId,
    },
  ]);

  // (5) Une personne de `a` dont le métier est celui de `b`. Seul `filter(jobs)`
  //     l'écarte — et le `leftJoin` la garde alors sans métier.
  const forged = await db
    .insert(persons)
    .values({
      domainId: a.domainId,
      fullName: `Chloé Forgée ${suffix}`,
      source: "manual",
      kind: "center",
      jobId: b.jobId,
    })
    .returning({ id: persons.id });
  forgedJobPersonId = forged[0]!.id;

  // (6) L'inverse : une personne de `b` dont le métier est celui de `a`. Seul
  //     `filter(persons)` l'écarte des options de métier de `a`.
  await db.insert(persons).values({
    domainId: b.domainId,
    fullName: `Vera Forgée ${suffix}`,
    source: "manual",
    kind: "center",
    jobId: a.ghostJobId,
  });

  /* ------------------------------------------------------------------------
     Les trois jointures de la fiche (T5bis.4). Chacune ne franchit la
     frontière que sur **une** table : c'est ce qui fait qu'un seul filtre
     l'écarte, et donc qu'un seul test tombe quand on le retire.
     ------------------------------------------------------------------------ */

  // (7) La liaison est d'un autre domaine — le projet, la personne et le statut
  //     sont de `a`. Seul `filter(projectMembers)` l'écarte.
  await db.insert(projectMembers).values({
    domainId: b.domainId,
    projectId: a.probeLinkProjectId,
    personId: a.aliceId,
  });

  /* (8) Le **projet** est d'un autre domaine, et il porte un statut de `a` : sans
         ce détail, `filter(projectStatuses)` l'écarterait aussi et le test ne
         désignerait plus un seul filtre. La liaison, elle, est de `a`. Seul
         `filter(projects)` l'écarte. */
  const cross = await db
    .insert(projects)
    .values({
      domainId: b.domainId,
      productId: b.productId,
      statusId: a.activeStatusId,
      name: `Sonde projet croisé ${suffix}`,
    })
    .returning({ id: projects.id });
  forgedCrossProjectId = cross[0]!.id;
  await db.insert(projectMembers).values({
    domainId: a.domainId,
    projectId: forgedCrossProjectId,
    personId: a.aliceId,
  });

  // (9) L'inverse : un projet de `a` dont le **statut** est de `b`. La liaison et
  //     le projet sont de `a` ; seul `filter(projectStatuses)` l'écarte.
  const crossStatus = await db
    .insert(projects)
    .values({
      domainId: a.domainId,
      productId: a.productId,
      statusId: b.activeStatusId,
      name: `Sonde statut ${suffix}`,
    })
    .returning({ id: projects.id });
  forgedStatusProjectId = crossStatus[0]!.id;
  await a.scope.insert(projectMembers, {
    projectId: forgedStatusProjectId,
    personId: a.aliceId,
  });
}

beforeAll(async () => {
  a = await seedDomain("a");
  b = await seedDomain("b");
  /* **Le seul endroit du fichier où les deux domaines ne sont pas
     symétriques** (T5bis.5). `levelScaleMax` est un maximum : deux échelles
     qui plafonnent au même rang rendraient la même valeur qu'on lise le bon
     domaine ou l'autre, et son test d'étanchéité ne prouverait rien. `b` monte
     donc un cran plus haut que `a`. */
  await b.scope.insert(skillLevels, { label: `Maître b`, rank: 5 });
  await forgeLeaks();
}, 120_000);

afterAll(async () => {
  const ids = [a?.domainId, b?.domainId].filter(Boolean) as string[];
  if (ids.length === 0) return;
  for (const table of teardownOrder) {
    await db.delete(table).where(inArray(table.domainId, ids));
  }
  await db.delete(domains).where(inArray(domains.id, ids));
});

/** Le rang d'une personne dans la liste rendue. */
function rankOf(rows: { id: string }[], id: string): number {
  return rows.findIndex((row) => row.id === id);
}

/* ==========================================================================
   La liste elle-même
   ========================================================================== */

describe("listTeam", () => {
  test("les personnes sortent par nom, quel que soit l'ordre de saisie", async () => {
    const rows = await listTeam(a.scope);

    // Des rangs relatifs, et non des positions absolues : ce test ne dit rien
    // du contenu de la liste, seulement de son ordre.
    expect(rankOf(rows, a.aliceId)).toBeLessThan(rankOf(rows, a.brunoId));
    expect(rankOf(rows, a.brunoId)).toBeLessThan(rankOf(rows, a.carlaId));
    expect(rankOf(rows, a.carlaId)).toBeLessThan(rankOf(rows, a.damienId));
    expect(rankOf(rows, a.damienId)).toBeLessThan(rankOf(rows, a.zoeId));
  });

  test("une personne archivée n'est plus dans le référentiel", async () => {
    const rows = await listTeam(a.scope);
    expect(rows.map((row) => row.id)).not.toContain(a.yvesId);
    expect(rows.map((row) => row.id)).toContain(a.aliceId);
  });

  test("le métier remonte, et reste nul pour qui n'en a pas", async () => {
    const rows = await listTeam(a.scope);
    expect(rows.find((row) => row.id === a.aliceId)?.jobLabel).toBe(
      "Product Design a",
    );
    // Le `leftJoin` est là pour lui : une jointure interne l'aurait fait
    // disparaître de la liste.
    expect(rows.find((row) => row.id === a.brunoId)?.jobLabel).toBeNull();
  });

  test("le genre et la disponibilité remontent", async () => {
    const rows = await listTeam(a.scope);

    const alice = rows.find((row) => row.id === a.aliceId);
    expect(alice?.kind).toBe("center");
    expect(alice?.availability).toBe("available");

    expect(rows.find((row) => row.id === a.brunoId)?.availability).toBe(
      "unavailable",
    );
    expect(rows.find((row) => row.id === a.damienId)?.availability).toBe(
      "partial",
    );
  });

  test("un intervenant côté entité n'a pas de disponibilité", async () => {
    const rows = await listTeam(a.scope);
    const zoe = rows.find((row) => row.id === a.zoeId);
    expect(zoe?.kind).toBe("stakeholder");
    expect(zoe?.availability).toBeNull();
  });

  test("les compétences portent leur niveau, par rang décroissant puis libellé", async () => {
    const rows = await listTeam(a.scope);
    const alice = rows.find((row) => row.id === a.aliceId);

    expect(alice?.skills.map((skill) => skill.label)).toEqual([
      "Accessibilité a",
      "UX Design a",
      "Design System a",
      "Prototypage a",
    ]);
    expect(alice?.skills.map((skill) => skill.levelLabel)).toEqual([
      "Expert a",
      "Expert a",
      "Avancé a",
      "Avancé a",
    ]);
    expect(alice?.skills.map((skill) => skill.levelRank)).toEqual([4, 4, 3, 3]);
  });

  test("une personne sans compétence en rend une liste vide", async () => {
    const rows = await listTeam(a.scope);
    expect(rows.find((row) => row.id === a.brunoId)?.skills).toEqual([]);
  });
});

/* ==========================================================================
   Les cinq filtres

   Le cas central est « la conjonction » : c'est celui qui tombe, et lui seul,
   quand on remplace les `exists` conjoints par un `or`.
   ========================================================================== */

describe("listTeam — les filtres", () => {
  /** Les identifiants rendus, dans l'ordre de la requête. */
  async function idsOf(filters: Parameters<typeof listTeam>[1]) {
    const rows = await listTeam(a.scope, filters);
    return rows.map((row) => row.id);
  }

  test("la recherche porte sur le nom", async () => {
    const ids = await idsOf({ search: "Alice" });
    expect(ids).toContain(a.aliceId);
    expect(ids).not.toContain(a.carlaId);
  });

  test("le motif de recherche est échappé", async () => {
    // Sans échappement, `%` serait un joker et ramènerait tout le monde.
    expect(await idsOf({ search: "%" })).toEqual([]);
  });

  test("le métier restreint aux personnes qui le portent", async () => {
    const ids = await idsOf({ jobId: a.researchJobId });
    expect(ids).toEqual([a.carlaId]);
  });

  test("une compétence cochée rend tous ceux qui la portent", async () => {
    const ids = await idsOf({ skillIds: [a.uxSkillId] });
    expect(ids).toContain(a.aliceId);
    expect(ids).toContain(a.carlaId);
    expect(ids).not.toContain(a.brunoId);
  });

  test("deux compétences cochées se cumulent : l'une ET l'autre", async () => {
    const ids = await idsOf({ skillIds: [a.uxSkillId, a.a11ySkillId] });
    expect(ids).toContain(a.aliceId);
    // Carla porte l'UX Design, pas l'accessibilité. Un `or` la garderait.
    expect(ids).not.toContain(a.carlaId);
  });

  test("le niveau posé seul vaut « au moins une compétence à ce rang »", async () => {
    const atLeastFour = await idsOf({ minRank: 4 });
    expect(atLeastFour).toContain(a.aliceId);
    expect(atLeastFour).not.toContain(a.carlaId);

    const atLeastThree = await idsOf({ minRank: 3 });
    expect(atLeastThree).toContain(a.aliceId);
    expect(atLeastThree).toContain(a.carlaId);
  });

  test("le niveau s'applique aux compétences cochées", async () => {
    // Carla porte l'UX Design, mais au rang 3.
    const ids = await idsOf({ skillIds: [a.uxSkillId], minRank: 4 });
    expect(ids).toEqual([a.aliceId]);
  });

  test("la disponibilité restreint aux trois valeurs de l'énuméré", async () => {
    const ids = await idsOf({ availability: "partial" });
    expect(ids).toContain(a.carlaId);
    expect(ids).toContain(a.damienId);
    expect(ids).not.toContain(a.aliceId);
  });

  test("les filtres se cumulent", async () => {
    const ids = await idsOf({
      skillIds: [a.uxSkillId],
      availability: "available",
    });
    expect(ids).toEqual([a.aliceId]);
  });

  test("l'ordre reste le nom sous filtre — jamais le niveau", async () => {
    const ids = await idsOf({ minRank: 3 });
    expect(ids.indexOf(a.aliceId)).toBeLessThan(ids.indexOf(a.carlaId));
  });

  test("une personne archivée ne revient sous aucun filtre", async () => {
    expect(await idsOf({ search: "Yves" })).toEqual([]);
  });

  test("la ligne retenue affiche son profil entier, pas la correspondance", async () => {
    const rows = await listTeam(a.scope, { skillIds: [a.a11ySkillId] });
    const alice = rows.find((row) => row.id === a.aliceId);
    // Quatre compétences déclarées, dont celle qui a filtré : rien n'est
    // retiré, rien n'est marqué.
    expect(alice?.skills).toHaveLength(4);
  });

  test("une compétence d'un autre domaine ne filtre rien et ne fuit rien", async () => {
    const rows = await listTeam(a.scope, { skillIds: [b.uxSkillId] });
    expect(rows).toEqual([]);
  });
});

/* ==========================================================================
   Les options de la barre de filtres
   ========================================================================== */

describe("listTeamFilterOptions", () => {
  test("les métiers portés par une personne vivante, et eux seuls", async () => {
    const options = await listTeamFilterOptions(a.scope);
    const ids = options.jobs.map((job) => job.id);

    expect(ids).toContain(a.jobId);
    expect(ids).toContain(a.researchJobId);
    // Porté par la seule personne archivée : proposer ce filtre serait offrir
    // un chemin vers le vide.
    expect(ids).not.toContain(a.forgottenJobId);
  });

  test("les compétences portées par une personne vivante, et elles seules", async () => {
    const options = await listTeamFilterOptions(a.scope);
    const labels = options.skills.map((skill) => skill.label);

    expect(labels).toContain("UX Design a");
    expect(labels).toContain("Accessibilité a");
    expect(labels).toContain("Prototypage a");

    // Archivée : Alice la porte encore, on ne la propose plus au choix.
    expect(labels).not.toContain("Design System a");
    // Portée par la seule personne archivée.
    expect(labels).not.toContain("Compétence oubliée a");
    // Portées par personne : les trois sondes des lignes forgées.
    expect(labels).not.toContain("Sonde liaison a");
    expect(labels).not.toContain("Sonde niveau a");
  });

  test("l'échelle est proposée entière, par rang croissant", async () => {
    const options = await listTeamFilterOptions(a.scope);

    expect(options.levels.map((level) => level.label)).toEqual([
      "Avancé a",
      "Expert a",
    ]);
    expect(options.levels.map((level) => level.rank)).toEqual([3, 4]);
  });
});

/* ==========================================================================
   L'étanchéité — un test par `filter()`

   Chacun de ces tests tombe quand on retire *son* filtre, et lui seul.
   ========================================================================== */

describe("listTeam — étanchéité", () => {
  /** Les compétences que la liste attribue à la personne-sonde de `a`. */
  async function probeSkillsOfDamien(): Promise<string[]> {
    const rows = await listTeam(a.scope);
    const damien = rows.find((row) => row.id === a.damienId);
    return (damien?.skills ?? []).map((skill) => skill.label);
  }

  test("aucune personne d'un autre domaine — `filter(persons)`", async () => {
    const rows = await listTeam(a.scope);
    const ids = rows.map((row) => row.id);
    expect(ids).not.toContain(b.aliceId);
    expect(ids).not.toContain(b.brunoId);
    expect(ids).not.toContain(b.zoeId);
  });

  test("aucun métier d'un autre domaine — `filter(jobs)`", async () => {
    const rows = await listTeam(a.scope);
    const forged = rows.find((row) => row.id === forgedJobPersonId);
    expect(forged).toBeDefined();
    expect(forged?.jobLabel).toBeNull();
  });

  test("aucune liaison d'un autre domaine — `filter(personSkills)`", async () => {
    expect(await probeSkillsOfDamien()).not.toContain("Sonde liaison a");
  });

  test("aucune compétence d'un autre domaine — `filter(skills)`", async () => {
    expect(await probeSkillsOfDamien()).not.toContain("Sonde compétence b");
  });

  test("aucun niveau d'un autre domaine — `filter(skillLevels)`", async () => {
    expect(await probeSkillsOfDamien()).not.toContain("Sonde niveau a");
  });

  /* Les deux filtres du `exists` conjonctif ont leurs propres cas : celui de la
     seconde lecture ne les couvre pas, la liaison forgée n'étant écartée là-bas
     que parce qu'elle porte sur une personne du domaine. */

  test("le `exists` ignore une liaison d'un autre domaine — `filter(personSkills)`", async () => {
    const rows = await listTeam(a.scope, { skillIds: [a.probeLinkSkillId] });
    expect(rows).toEqual([]);
  });

  test("le `exists` ignore un niveau d'un autre domaine — `filter(skillLevels)`", async () => {
    const rows = await listTeam(a.scope, { skillIds: [a.probeLevelSkillId] });
    expect(rows).toEqual([]);
  });
});

describe("listTeamFilterOptions — étanchéité", () => {
  test("aucun métier d'un autre domaine — `filter(jobs)`", async () => {
    const options = await listTeamFilterOptions(a.scope);
    // Chloé est une personne vivante de `a` dont le métier est celui de `b` :
    // sans `filter(jobs)`, ce métier paraîtrait dans les options de `a`.
    expect(options.jobs.map((job) => job.id)).not.toContain(b.jobId);
  });

  test("aucune compétence d'un autre domaine — `filter(skills)`", async () => {
    const options = await listTeamFilterOptions(a.scope);
    expect(options.skills.map((skill) => skill.label)).not.toContain(
      "Sonde compétence b",
    );
  });

  test("aucun niveau d'un autre domaine", async () => {
    const options = await listTeamFilterOptions(a.scope);
    expect(options.levels.map((level) => level.id)).not.toContain(
      b.expertLevelId,
    );
  });

  test("aucune personne d'un autre domaine ne fait paraître un métier — `filter(persons)`", async () => {
    const options = await listTeamFilterOptions(a.scope);
    // Vera est de `b` et porte un métier de `a` que personne d'autre ne porte.
    expect(options.jobs.map((job) => job.id)).not.toContain(a.ghostJobId);
  });

  test("aucune personne d'un autre domaine ne fait paraître une compétence — `filter(persons)`", async () => {
    const options = await listTeamFilterOptions(a.scope);
    // La liaison (4) est de `a` en tout point, sauf la personne.
    expect(options.skills.map((skill) => skill.label)).not.toContain(
      "Sonde compétence a",
    );
  });
});

/* ==========================================================================
   La fiche — T5bis.4

   Elle ne se lit pas par la liste : trois lectures de plus, dont deux tables
   que `listTeam` ne joint jamais.
   ========================================================================== */

describe("findPersonDetail", () => {
  test("l'identité, le métier, la présentation et la disponibilité", async () => {
    const person = await findPersonDetail(a.scope, a.aliceId);

    expect(person?.fullName).toBe(`Alice Martin a`);
    expect(person?.jobLabel).toBe("Product Design a");
    expect(person?.kind).toBe("center");
    expect(person?.bio).toBe("Conçoit les parcours de bout en bout a.");
    expect(person?.availability).toBe("available");
  });

  test("les compétences sortent par rang décroissant puis libellé", async () => {
    const person = await findPersonDetail(a.scope, a.aliceId);

    // Le même profil, dans le même ordre que sur la ligne de la liste : deux
    // écrans qui montreraient l'un le contraire de l'autre seraient un défaut.
    expect(person?.skills.map((skill) => skill.label)).toEqual([
      "Accessibilité a",
      "UX Design a",
      "Design System a",
      "Prototypage a",
    ]);
    expect(person?.skills.map((skill) => skill.levelRank)).toEqual([4, 4, 3, 3]);
  });

  test("les accompagnements, du plus récent au plus ancien, sans date en dernier", async () => {
    const person = await findPersonDetail(a.scope, a.aliceId);

    expect(person?.projects.map((project) => project.id)).toEqual([
      a.freshProjectId,
      a.underArchivedProjectId,
      a.oldProjectId,
      // Sans date de début : en dernier, jamais en tête.
      a.undatedProjectId,
    ]);
  });

  test("un accompagnement porte son statut et sa période", async () => {
    const person = await findPersonDetail(a.scope, a.aliceId);
    const fresh = person?.projects.find(
      (project) => project.id === a.freshProjectId,
    );

    expect(fresh?.name).toBe("Refonte a");
    expect(fresh?.statusLabel).toBe("En cours a");
    expect(fresh?.statusNature).toBe("active");
    expect(fresh?.startedOn).toBe("2026-02-01");
    expect(fresh?.expectedEndOn).toBe("2026-07-31");
  });

  test("un accompagnement archivé n'est pas dans la fiche", async () => {
    const person = await findPersonDetail(a.scope, a.aliceId);
    expect(person?.projects.map((project) => project.id)).not.toContain(
      a.archivedProjectId,
    );
  });

  test("un accompagnement d'un produit archivé y reste", async () => {
    const person = await findPersonDetail(a.scope, a.aliceId);
    // La personne l'a mené : ranger le produit ne l'efface pas de son parcours.
    expect(person?.projects.map((project) => project.id)).toContain(
      a.underArchivedProjectId,
    );
  });

  test("sans métier, sans présentation, sans compétence et sans accompagnement", async () => {
    const person = await findPersonDetail(a.scope, a.brunoId);

    // Le `leftJoin` est là pour lui : une jointure interne rendrait `null`.
    expect(person?.jobLabel).toBeNull();
    expect(person?.bio).toBeNull();
    expect(person?.skills).toEqual([]);
    expect(person?.projects).toEqual([]);
  });

  test("un intervenant côté entité n'a pas de disponibilité", async () => {
    const person = await findPersonDetail(a.scope, a.zoeId);
    expect(person?.kind).toBe("stakeholder");
    expect(person?.availability).toBeNull();
  });

  test("l'échelle rendue est celle du **référentiel**, pas celle de la personne", async () => {
    /* Alice plafonne à `Expert a` (rang 4), qui est aussi la borne haute de
       l'échelle de `a` : c'est Bruno qui sépare les deux lectures — il ne porte
       **aucune** compétence, et rend pourtant l'échelle entière. Sans quoi le
       radar d'un profil « Intermédiaire partout » se dessinerait plein. */
    expect((await findPersonDetail(a.scope, a.aliceId))?.levelScaleMax).toBe(4);
    expect((await findPersonDetail(a.scope, a.brunoId))?.levelScaleMax).toBe(4);
  });

  test("un identifiant inconnu n'ouvre rien", async () => {
    expect(await findPersonDetail(a.scope, crypto.randomUUID())).toBeNull();
  });

  test("une personne archivée n'ouvre rien", async () => {
    expect(await findPersonDetail(a.scope, a.yvesId)).toBeNull();
  });
});

describe("findPersonDetail — étanchéité", () => {
  test("aucune personne d'un autre domaine — `filter(persons)`", async () => {
    // Elle n'existe pas dans ce domaine ; elle ne « manque » pas.
    expect(await findPersonDetail(a.scope, b.aliceId)).toBeNull();
  });

  test("aucun métier d'un autre domaine — `filter(jobs)`", async () => {
    const person = await findPersonDetail(a.scope, forgedJobPersonId);
    expect(person).not.toBeNull();
    expect(person?.jobLabel).toBeNull();
  });

  test("aucune liaison de compétence d'un autre domaine — `filter(personSkills)`", async () => {
    const person = await findPersonDetail(a.scope, a.damienId);
    expect(person?.skills.map((skill) => skill.label)).not.toContain(
      "Sonde liaison a",
    );
  });

  test("aucune compétence d'un autre domaine — `filter(skills)`", async () => {
    const person = await findPersonDetail(a.scope, a.damienId);
    expect(person?.skills.map((skill) => skill.label)).not.toContain(
      "Sonde compétence b",
    );
  });

  test("aucun niveau d'un autre domaine — `filter(skillLevels)`", async () => {
    const person = await findPersonDetail(a.scope, a.damienId);
    expect(person?.skills.map((skill) => skill.label)).not.toContain(
      "Sonde niveau a",
    );
  });

  test("aucune liaison d'équipe d'un autre domaine — `filter(projectMembers)`", async () => {
    const person = await findPersonDetail(a.scope, a.aliceId);
    expect(person?.projects.map((project) => project.id)).not.toContain(
      a.probeLinkProjectId,
    );
  });

  test("aucun accompagnement d'un autre domaine — `filter(projects)`", async () => {
    const person = await findPersonDetail(a.scope, a.aliceId);
    expect(person?.projects.map((project) => project.id)).not.toContain(
      forgedCrossProjectId,
    );
  });

  test("aucun statut d'un autre domaine — `filter(projectStatuses)`", async () => {
    const person = await findPersonDetail(a.scope, a.aliceId);
    expect(person?.projects.map((project) => project.id)).not.toContain(
      forgedStatusProjectId,
    );
  });

  test("l'échelle est celle du domaine — `filter(skillLevels)` de la **quatrième** lecture", async () => {
    /* `b` porte un rang 5 que `a` n'a pas. Le filtre retiré, la borne haute de
       `a` deviendrait celle de la table entière — ce qui rapporterait les rangs
       déclarés d'Alice à une règle qui n'est pas la sienne.

       **Ce filtre-ci n'est pas celui du test voisin** : le `filter(skillLevels)`
       de la jointure des compétences est un autre appel, sur une autre lecture,
       et retirer l'un ne fait pas tomber le cas de l'autre. */
    expect((await findPersonDetail(a.scope, a.aliceId))?.levelScaleMax).toBe(4);
    expect((await findPersonDetail(b.scope, b.aliceId))?.levelScaleMax).toBe(5);
  });
});
