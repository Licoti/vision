/**
 * Les tests de `listRelatedProjects` — les quatre règles de `docs/04` §5.
 *
 * Ils tournent sur la branche Neon dédiée — `vitest.config.mts` remappe
 * `DATABASE_URL` sur `TEST_DATABASE_URL` — et écrivent réellement : quatre
 * règles, une préséance, un seuil et cinq filtres d'étanchéité ne se vérifient
 * pas sur un faux.
 *
 * **Trois domaines**, comme `journal.test.ts` : `a` porte le jeu, `b` fournit
 * les lignes d'un autre domaine, `c` reste **vierge de toute ligne forgée** —
 * lu dans `b`, l'état vide tomberait en même temps qu'une étanchéité, et une
 * chute non isolée ne désigne plus le filtre qu'elle éprouve.
 *
 * **Chaque projet du jeu ne coche qu'une règle**, sauf celui qui les coche
 * toutes et qui éprouve la préséance. C'est la condition pour qu'une règle
 * neutralisée fasse tomber **un** test : un projet rapproché par deux règles
 * survivrait à la neutralisation de la première, et sa chute ne prouverait
 * rien.
 *
 * **Cinq lignes sont forgées par le client brut**, chacune ne franchissant la
 * frontière que sur **une seule** colonne — leçon de T5bis.2 — et chacune
 * portée par **son propre projet cible**, faute de quoi retirer l'un des cinq
 * filtres ferait tomber les cinq tests ensemble.
 *
 * Les constats se lisent par identifiant, jamais par position — sauf le test de
 * l'ordre, qui compare des rangs relatifs.
 */

import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { db } from "@/lib/db/client";
import { forDomain, superAdmin, type ScopedDb } from "@/lib/db/scoped";
import {
  approaches,
  domains,
  entities,
  persons,
  products,
  projectApproaches,
  projectMembers,
  projectStatuses,
  projects,
} from "@/lib/db/schema";

import { listRelatedProjects } from "./links";

/** Enfants d'abord, parents ensuite : `domains` refuse la suppression sinon. */
const teardownOrder = [
  projectApproaches,
  projectMembers,
  projects,
  products,
  entities,
  approaches,
  projectStatuses,
  persons,
];

const NBSP = "\u00A0";
const suffix = Math.random().toString(36).slice(2, 10);

type Fixture = {
  domainId: string;
  scope: ScopedDb;
  /** Le projet dont on lit les voisins. */
  refId: string;
  /** Les entités, produits, approches et personnes, par rôle. */
  entityOneLabel: string;
  approachTwoLabel: string;
  aliceName: string;
  bobName: string;
  aliceId: string;
  bobId: string;
  denisId: string;
  emmaId: string;
  approachThreeId: string;
  productOneId: string;
  statusId: string;
  /** Les voisins attendus, et ceux qui ne doivent jamais l'être. */
  sameProductId: string;
  strongestId: string;
  sharedTwoId: string;
  sharedOneId: string;
  sameEntityId: string;
  sharedApproachId: string;
  strangerId: string;
  lonelyId: string;
  archivedProjectId: string;
  archivedProductProjectId: string;
  /** Les quatre cibles des lignes forgées, une par filtre. */
  leakApproachId: string;
  leakPersonId: string;
  leakApproachLinkId: string;
  leakMemberLinkId: string;
};

let a: Fixture;
let b: Fixture;
let c: Fixture;

/** La cinquième ligne forgée : un projet d'un autre domaine sur le produit de `a`. */
let leakedDomainProjectId: string;

/**
 * Le jeu d'un domaine.
 *
 * Trois entités et cinq produits : `E1` porte le produit du projet consulté
 * **et** un second produit, sans quoi la règle « même entité » n'aurait aucun
 * cas qui ne soit pas déjà « même produit » — le piège que la fixture de
 * développement porte, et que la fiche demande de vérifier avant de croire.
 */
async function seedDomain(label: string): Promise<Fixture> {
  const domain = await superAdmin.createDomain({
    name: `__test__links__${label}__${suffix}`,
    competenceCenterName: `Centre ${label}`,
  });

  const scope = forDomain({ domainId: domain.id });

  const entityOne = await scope.insert(entities, { label: `Banque ${label}` });
  const entityTwo = await scope.insert(entities, { label: `Assurance ${label}` });
  const entityThree = await scope.insert(entities, { label: `Retail ${label}` });
  /* La quatrième n'a qu'un produit et qu'un projet : c'est le seul moyen
     d'avoir un accompagnement **sans aucun voisin**, la règle « même entité »
     rapprochant sinon tout ce qui partage une entité. */
  const entityFour = await scope.insert(entities, { label: `Logistique ${label}` });

  const productOne = await scope.insert(products, {
    name: `Espace client ${label}`,
    entityId: entityOne.id,
  });
  const productTwo = await scope.insert(products, {
    name: `Déclaration ${label}`,
    entityId: entityTwo.id,
  });
  const productThree = await scope.insert(products, {
    name: `Caisse ${label}`,
    entityId: entityThree.id,
  });
  /* Autre produit, **même entité** que celui du projet consulté. */
  const productFour = await scope.insert(products, {
    name: `Agence ${label}`,
    entityId: entityOne.id,
  });
  const productFive = await scope.insert(products, {
    name: `Entrepôt ${label}`,
    entityId: entityFour.id,
  });
  const productArchived = await scope.insert(products, {
    name: `Ancien portail ${label}`,
    entityId: entityOne.id,
  });
  await scope.archive(products, productArchived.id);

  const approachOne = await scope.insert(approaches, {
    label: `Research ${label}`,
    position: "1",
  });
  const approachTwo = await scope.insert(approaches, {
    label: `Audit UX ${label}`,
    position: "2",
  });
  const approachThree = await scope.insert(approaches, {
    label: `Lean ${label}`,
    position: "3",
  });

  const alice = await scope.insert(persons, {
    fullName: `Alice Martin ${label}`,
    source: "manual",
    kind: "center",
  });
  const bob = await scope.insert(persons, {
    fullName: `Bob Durand ${label}`,
    source: "manual",
    kind: "center",
  });
  const chloe = await scope.insert(persons, {
    fullName: `Chloe Nkemelu ${label}`,
    source: "manual",
    kind: "center",
  });
  const denis = await scope.insert(persons, {
    fullName: `Denis Ravel ${label}`,
    source: "manual",
    kind: "center",
  });
  const emma = await scope.insert(persons, {
    fullName: `Emma Silva ${label}`,
    source: "manual",
    kind: "center",
  });

  const status = await scope.insert(projectStatuses, {
    label: `En cours ${label}`,
    nature: "active",
    position: "1",
  });

  async function project(
    name: string,
    productId: string,
  ): Promise<{ id: string }> {
    return scope.insert(projects, {
      name: `${name} ${suffix}`,
      productId,
      statusId: status.id,
      startedOn: "2026-02-01",
    });
  }

  async function team(projectId: string, personIds: string[]): Promise<void> {
    for (const personId of personIds) {
      await scope.insert(projectMembers, { projectId, personId });
    }
  }

  async function declare(
    projectId: string,
    approachIds: string[],
  ): Promise<void> {
    for (const approachId of approachIds) {
      await scope.insert(projectApproaches, { projectId, approachId });
    }
  }

  /* Le projet consulté : produit 1, approches 1 et 2, trois personnes. */
  const ref = await project("Reference", productOne.id);
  await declare(ref.id, [approachOne.id, approachTwo.id]);
  await team(ref.id, [alice.id, bob.id, chloe.id]);

  /* Même produit, et **rien d'autre** : la règle forte, seule. */
  const sameProduct = await project("Bravo", productOne.id);

  /* Les quatre règles à la fois — la préséance a un cas. */
  const strongest = await project("Alpha", productOne.id);
  await declare(strongest.id, [approachOne.id]);
  await team(strongest.id, [alice.id, bob.id]);

  /* Deux personnes en commun, et rien d'autre. */
  const sharedTwo = await project("Charlie", productTwo.id);
  await team(sharedTwo.id, [alice.id, bob.id]);

  /* **Une seule** personne en commun : sous le seuil, donc absent. */
  const sharedOne = await project("Delta", productThree.id);
  await team(sharedOne.id, [alice.id]);

  /* Même entité par un autre produit, et rien d'autre. */
  const sameEntity = await project("Echo", productFour.id);
  await declare(sameEntity.id, [approachThree.id]);

  /* Une approche en commun, et rien d'autre. */
  const sharedApproach = await project("Foxtrot", productTwo.id);
  await declare(sharedApproach.id, [approachTwo.id]);

  /* Rien en commun. */
  const stranger = await project("Golf", productThree.id);
  await team(stranger.id, [denis.id]);

  /* Même produit, mais **archivé**. */
  const archivedProject = await project("Hotel", productOne.id);
  await scope.archive(projects, archivedProject.id);

  /* Vivant, mais sous un **produit archivé** de la même entité. */
  const archivedProductProject = await project("India", productArchived.id);

  /* Seul sous son produit et sous son entité, sans équipe ni approche : aucun
     voisin ne peut le rejoindre par aucune des quatre règles. */
  const lonely = await project("Zoulou", productFive.id);

  /* Les quatre cibles des lignes forgées : aucune n'a de règle légitime. */
  const leakApproach = await project("Juliett", productThree.id);
  const leakPerson = await project("Kilo", productThree.id);
  const leakApproachLink = await project("Lima", productThree.id);
  await declare(leakApproachLink.id, [approachThree.id]);
  const leakMemberLink = await project("Mike", productThree.id);
  await team(leakMemberLink.id, [denis.id, emma.id]);

  return {
    domainId: domain.id,
    scope,
    refId: ref.id,
    entityOneLabel: entityOne.label,
    approachTwoLabel: approachTwo.label,
    aliceName: alice.fullName,
    bobName: bob.fullName,
    aliceId: alice.id,
    bobId: bob.id,
    denisId: denis.id,
    emmaId: emma.id,
    approachThreeId: approachThree.id,
    productOneId: productOne.id,
    statusId: status.id,
    sameProductId: sameProduct.id,
    strongestId: strongest.id,
    sharedTwoId: sharedTwo.id,
    sharedOneId: sharedOne.id,
    sameEntityId: sameEntity.id,
    sharedApproachId: sharedApproach.id,
    strangerId: stranger.id,
    lonelyId: lonely.id,
    archivedProjectId: archivedProject.id,
    archivedProductProjectId: archivedProductProject.id,
    leakApproachId: leakApproach.id,
    leakPersonId: leakPerson.id,
    leakApproachLinkId: leakApproachLink.id,
    leakMemberLinkId: leakMemberLink.id,
  };
}

beforeAll(async () => {
  a = await seedDomain("a");
  b = await seedDomain("b");
  c = await seedDomain("c");

  /* ----- Les cinq lignes forgées, une par filtre, une colonne chacune. ----- */

  /* (1) Un **projet de `b`** sur le produit de `a`. Produit, entité et statut
         sont ceux de `a` : seul `domain_id` franchit la frontière, donc seul
         `filter(projects)` de la requête des candidats l'écarte. */
  const leakedProject = await db
    .insert(projects)
    .values({
      domainId: b.domainId,
      productId: a.productOneId,
      statusId: a.statusId,
      name: `November ${suffix}`,
      startedOn: "2026-02-01",
    })
    .returning({ id: projects.id });
  leakedDomainProjectId = leakedProject[0]!.id;

  /* (2) Deux liaisons **de `a`** vers une approche **de `b`** — sur le projet
         consulté et sur sa cible. Seul `filter(approaches)` de la lecture de
         référence écarte cette approche du jeu ; `filter(projectApproaches)` ne
         voit rien à écarter, les deux liaisons étant de `a`. */
  await db.insert(projectApproaches).values([
    {
      domainId: a.domainId,
      projectId: a.refId,
      approachId: b.approachThreeId,
    },
    {
      domainId: a.domainId,
      projectId: a.leakApproachId,
      approachId: b.approachThreeId,
    },
  ]);

  /* (3) Quatre liaisons **de `a`** vers **deux** personnes de `b` — le seuil
         doit être atteint, sans quoi la fuite ne franchirait pas la règle et le
         test passerait au vert pour la mauvaise raison. Seul `filter(persons)`
         de la lecture de référence les écarte. */
  await db.insert(projectMembers).values([
    { domainId: a.domainId, projectId: a.refId, personId: b.aliceId },
    { domainId: a.domainId, projectId: a.refId, personId: b.bobId },
    { domainId: a.domainId, projectId: a.leakPersonId, personId: b.aliceId },
    { domainId: a.domainId, projectId: a.leakPersonId, personId: b.bobId },
  ]);

  /* (4) Une liaison **de `b`** posée sur le projet consulté de `a`, vers une
         approche de `a` que « Lima » déclare légitimement. Seul
         `filter(projectApproaches)` de la lecture de référence l'écarte. */
  await db.insert(projectApproaches).values({
    domainId: b.domainId,
    projectId: a.refId,
    approachId: a.approachThreeId,
  });

  /* (5) Deux liaisons **de `b`** posées sur le projet consulté de `a`, vers les
         deux personnes que « Mike » porte légitimement. Seul
         `filter(projectMembers)` de la lecture de référence les écarte. */
  await db.insert(projectMembers).values([
    { domainId: b.domainId, projectId: a.refId, personId: a.denisId },
    { domainId: b.domainId, projectId: a.refId, personId: a.emmaId },
  ]);
});

afterAll(async () => {
  const ids = [a?.domainId, b?.domainId, c?.domainId].filter(
    Boolean,
  ) as string[];
  if (ids.length === 0) return;
  for (const table of teardownOrder) {
    await db.delete(table).where(inArray(table.domainId, ids));
  }
  await db.delete(domains).where(inArray(domains.id, ids));
});

/** Le rang d'un voisin dans la liste rendue, `-1` s'il en est absent. */
function rankOf(rows: { id: string }[], id: string): number {
  return rows.findIndex((row) => row.id === id);
}

describe("listRelatedProjects — les quatre règles", () => {
  test("même produit : la raison ne nomme pas ce que la ligne porte déjà", async () => {
    const rows = await listRelatedProjects(a.scope, a.refId);

    // Les deux accompagnements du même produit, le second cochant aussi les
    // trois autres règles : la plus forte l'emporte pour l'un comme pour
    // l'autre.
    expect(rows.find((row) => row.id === a.sameProductId)?.reason).toBe(
      "Même produit",
    );
    expect(rows.find((row) => row.id === a.strongestId)?.reason).toBe(
      "Même produit",
    );
  });

  test("personnes en commun : elles se nomment, elles ne se comptent pas", async () => {
    const rows = await listRelatedProjects(a.scope, a.refId);
    const row = rows.find((entry) => entry.id === a.sharedTwoId);

    expect(row?.rule).toBe("shared_people");
    // Sur le point de code : « et » est celui d'`Intl.ListFormat`, et l'ordre
    // est celui de la lecture de référence — alphabétique, jamais celui que la
    // base a rendu.
    expect(row?.reason).toBe(`${a.aliceName} et ${a.bobName} en commun`);
    // Aucun chiffre nulle part (arbitrage (c), D39).
    expect(row?.reason).not.toMatch(/\d/);
  });

  test("même entité : elle se nomme, par un autre produit", async () => {
    const rows = await listRelatedProjects(a.scope, a.refId);
    const row = rows.find((entry) => entry.id === a.sameEntityId);

    expect(row?.rule).toBe("same_entity");
    expect(row?.reason).toBe(`Même entité${NBSP}: ${a.entityOneLabel}`);
  });

  test("approches communes : elles se nomment", async () => {
    const rows = await listRelatedProjects(a.scope, a.refId);
    const row = rows.find((entry) => entry.id === a.sharedApproachId);

    expect(row?.rule).toBe("shared_approaches");
    expect(row?.reason).toBe(
      `Approches communes${NBSP}: ${a.approachTwoLabel}`,
    );
  });

  test("une seule personne en commun ne rapproche pas — le seuil est de deux", async () => {
    const rows = await listRelatedProjects(a.scope, a.refId);

    expect(rows.map((row) => row.id)).not.toContain(a.sharedOneId);
  });

  test("un projet sans rien en commun n'entre pas", async () => {
    const rows = await listRelatedProjects(a.scope, a.refId);

    expect(rows.map((row) => row.id)).not.toContain(a.strangerId);
  });
});

describe("listRelatedProjects — préséance, ordre et périmètre", () => {
  test("un projet qui coche les quatre règles n'apparaît qu'une fois", async () => {
    const rows = await listRelatedProjects(a.scope, a.refId);

    expect(rows.filter((row) => row.id === a.strongestId)).toHaveLength(1);
  });

  test("la liste va de la règle la plus forte à la plus faible", async () => {
    const rows = await listRelatedProjects(a.scope, a.refId);
    const order = [
      "same_product",
      "shared_people",
      "same_entity",
      "shared_approaches",
    ];
    const ranks = rows.map((row) => order.indexOf(row.rule));

    // Un rang qui reculerait dirait qu'une règle faible est passée devant une
    // forte. Le constat tient quelle que soit la règle qui manque, si bien
    // qu'une règle neutralisée ne fait pas tomber ce test-ci en plus du sien.
    expect(ranks).toEqual([...ranks].sort((left, right) => left - right));
  });

  test("à force égale, le nom départage", async () => {
    const rows = await listRelatedProjects(a.scope, a.refId);

    // « Alpha » avant « Bravo », tous deux sous « même produit ».
    expect(rankOf(rows, a.strongestId)).toBeLessThan(
      rankOf(rows, a.sameProductId),
    );
  });

  test("chaque ligne porte son produit, son statut et sa période", async () => {
    const rows = await listRelatedProjects(a.scope, a.refId);
    const row = rows.find((entry) => entry.id === a.sameProductId);

    expect(row?.productId).toBe(a.productOneId);
    expect(row?.productName).toBe(`Espace client a`);
    expect(row?.statusLabel).toBe(`En cours a`);
    expect(row?.statusNature).toBe("active");
    expect(row?.startedOn).toBe("2026-02-01");
  });

  test("ni le projet archivé, ni celui d'un produit archivé n'apparaissent", async () => {
    const rows = await listRelatedProjects(a.scope, a.refId);
    const ids = rows.map((row) => row.id);

    expect(ids).not.toContain(a.archivedProjectId);
    expect(ids).not.toContain(a.archivedProductProjectId);
  });

  test("le projet consulté n'est pas son propre voisin", async () => {
    const rows = await listRelatedProjects(a.scope, a.refId);

    expect(rows.map((row) => row.id)).not.toContain(a.refId);
  });

  test("un identifiant inconnu rend un tableau vide", async () => {
    const rows = await listRelatedProjects(
      a.scope,
      "00000000-0000-4000-8000-000000000000",
    );

    expect(rows).toEqual([]);
  });

  test("un projet d'un autre domaine rend un tableau vide, comme un inconnu", async () => {
    // La distinction n'appartient pas à l'appelant : l'écran affiche son état
    // vide dans les deux cas.
    const rows = await listRelatedProjects(a.scope, b.refId);

    expect(rows).toEqual([]);
  });

  test("un projet sans voisin rend un tableau vide", async () => {
    // **Dans `c`, le domaine sans aucune ligne forgée** : lu dans `b`, ce
    // constat tomberait avec l'une des cinq étanchéités.
    //
    // « Zoulou » est seul sous son produit **et** sous son entité, sans équipe
    // ni approche : aucune des quatre règles n'a de quoi le rapprocher. L'état
    // vide appartient à l'écran — la lecture rend une liste vide, jamais `null`
    // ni une erreur.
    const rows = await listRelatedProjects(c.scope, c.lonelyId);

    expect(rows).toEqual([]);
  });
});

describe("listRelatedProjects — les cinq étanchéités", () => {
  test("un projet d'un autre domaine ne devient pas un voisin — `filter(projects)`", async () => {
    const rows = await listRelatedProjects(a.scope, a.refId);

    expect(rows.map((row) => row.id)).not.toContain(leakedDomainProjectId);
  });

  test("une approche d'un autre domaine ne rapproche pas — `filter(approaches)`", async () => {
    const rows = await listRelatedProjects(a.scope, a.refId);

    expect(rows.map((row) => row.id)).not.toContain(a.leakApproachId);
  });

  test("des personnes d'un autre domaine ne rapprochent pas — `filter(persons)`", async () => {
    const rows = await listRelatedProjects(a.scope, a.refId);

    expect(rows.map((row) => row.id)).not.toContain(a.leakPersonId);
  });

  test("une liaison d'approche d'un autre domaine ne rapproche pas — `filter(projectApproaches)`", async () => {
    const rows = await listRelatedProjects(a.scope, a.refId);

    expect(rows.map((row) => row.id)).not.toContain(a.leakApproachLinkId);
  });

  test("une liaison d'équipe d'un autre domaine ne rapproche pas — `filter(projectMembers)`", async () => {
    const rows = await listRelatedProjects(a.scope, a.refId);

    expect(rows.map((row) => row.id)).not.toContain(a.leakMemberLinkId);
  });
});
