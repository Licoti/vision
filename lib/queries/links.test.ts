/**
 * Les tests des liens — les quatre règles **déduites** de `docs/04` §5 (T6.4),
 * et les liens **déclarés** de `project_links` (T6.5).
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
 * **Les liens déclarés arrivent avec deux lignes forgées de plus** (T6.5),
 * portées par `project_links` et posées dans `beforeAll` plutôt que dans
 * `seedDomain` : `b` et `c` restent sans aucune liaison déclarée, ce qui donne
 * à l'état vide un domaine où le lire sans qu'une étanchéité tombe avec lui.
 *
 * Les constats se lisent par identifiant, jamais par position — sauf les tests
 * d'ordre, qui comparent des rangs relatifs.
 */

import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { db } from "@/lib/db/client";
import { forDomain, superAdmin, type ScopedDb } from "@/lib/db/scoped";
import {
  activities,
  activityTypes,
  approaches,
  domains,
  entities,
  persons,
  products,
  projectApproaches,
  projectLinks,
  projectMembers,
  projectStatuses,
  projects,
} from "@/lib/db/schema";

import {
  listDeclaredLinks,
  listLinkableProjects,
  listRelatedProjects,
} from "./links";

/** Enfants d'abord, parents ensuite : `domains` refuse la suppression sinon. */
const teardownOrder = [
  activities,
  activityTypes,
  projectLinks,
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
  strangerName: string;
  lonelyId: string;
  lonelyName: string;
  /** La cible de la liaison déclarée forgée d'un autre domaine (T6.5). */
  leakLinkTargetId: string;
  /** La cible du lien sortant **sans raison** (T6.5). */
  plainTargetId: string;
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

/* ----- Les liens **déclarés** du domaine `a` — T6.5. -----

   Trois liaisons légitimes, et deux forgées. Elles vivent hors de `seedDomain`
   pour que `b` et `c` n'en portent aucune : c'est ce qui donne à l'état vide un
   domaine où se lire sans qu'une étanchéité tombe avec lui. */

/** `ref → Golf`, avec sa raison. Le seul lien que le projet consulté retire. */
let declaredOutId: string;
/** `Zoulou → ref`, avec sa raison : c'est le sens qu'il éprouve, pas la nullité. */
let declaredInId: string;
/** `ref → Papa`, **sans raison** : un lien sans raison est un lien valide. */
let declaredPlainId: string;
/** `Delta → Golf` : deux projets qui ne sont pas celui qu'on consulte. */
let declaredElsewhereId: string;

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

  /* Le nom sort avec l'identifiant depuis T6.5 : les constats sur les liens
     déclarés lisent le nom rendu par la lecture, et le recomposer au point
     d'appel serait un second endroit qui décide du suffixe. */
  /* **Les dates ne vivent plus sur le projet** : sa période se déduit des
     périodes de ses activités (31/08/2026). Chaque projet de cette fixture
     reçoit donc une activité datée, et tous la même — ce que ces tests lisent
     est une colonne rendue, pas un ordre. */
  const activityType = await scope.insert(activityTypes, {
    label: `Atelier ${suffix}`,
    family: "framing",
  });

  async function project(
    name: string,
    productId: string,
  ): Promise<{ id: string; name: string }> {
    const row = await scope.insert(projects, {
      name: `${name} ${suffix}`,
      productId,
      statusId: status.id,
    });
    await scope.insert(activities, {
      projectId: row.id,
      activityTypeId: activityType.id,
      state: "planned",
      periodStart: "2026-02-01",
    });
    return row;
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

  /* La cible de la liaison **déclarée** forgée (T6.5). Aucune règle déduite ne
     l'atteint : il ne doit sa présence dans les constats qu'à `project_links`. */
  const leakLinkTarget = await project("Oscar", productThree.id);

  /* La cible d'un second lien sortant, **sans raison**. Elle existe pour que la
     nullité de `reason` se mesure sur un lien **sortant** : portée par le lien
     entrant, elle serait tombée avec lui à la moindre neutralisation du `or`
     symétrique, et deux constats seraient tombés pour une seule règle. */
  const plainTarget = await project("Papa", productThree.id);

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
    strangerName: stranger.name,
    lonelyId: lonely.id,
    lonelyName: lonely.name,
    leakLinkTargetId: leakLinkTarget.id,
    plainTargetId: plainTarget.id,
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

  /* ----- Les liens déclarés de `a`, par la couche scopée — T6.5. -----

     Leurs deux extrémités sont des projets **qu'aucune règle déduite ne
     rapproche du projet consulté** : « Golf » n'a rien en commun avec lui,
     « Zoulou » est seul sous son produit et son entité. Sans cela, un même
     accompagnement figurerait dans les deux moitiés du bloc et un constat sur
     l'une pourrait passer au vert grâce à l'autre. */
  declaredOutId = (
    await a.scope.insert(projectLinks, {
      fromProjectId: a.refId,
      toProjectId: a.strangerId,
      reason: "Réutilise la grille d'entretien",
    })
  ).id;

  declaredInId = (
    await a.scope.insert(projectLinks, {
      fromProjectId: a.lonelyId,
      toProjectId: a.refId,
      reason: "Déclaré depuis l'autre bout",
    })
  ).id;

  declaredPlainId = (
    await a.scope.insert(projectLinks, {
      fromProjectId: a.refId,
      toProjectId: a.plainTargetId,
    })
  ).id;

  declaredElsewhereId = (
    await a.scope.insert(projectLinks, {
      fromProjectId: a.sharedOneId,
      toProjectId: a.strangerId,
      reason: "Sans rapport avec le projet consulté",
    })
  ).id;

  /* (6) Une liaison **de `b`** posée sur le projet consulté de `a`, vers un
         projet de `a` que rien d'autre ne relie. Seul `filter(projectLinks)`
         l'écarte — et il l'écarte **deux fois** : de la lecture symétrique, où
         la ligne n'a rien à faire, et du `not exists` des propositions, où sa
         présence retirerait « Oscar » de la liste. */
  await db.insert(projectLinks).values({
    domainId: b.domainId,
    fromProjectId: a.refId,
    toProjectId: a.leakLinkTargetId,
  });

  /* (7) Une liaison **de `a`**, légitime par son domaine, vers le projet forgé
         de la ligne (1) — celui dont le produit et le statut sont ceux de `a`
         et dont **seul `domain_id`** franchit la frontière.

         **Viser un projet ordinaire de `b` n'aurait rien éprouvé** : son
         produit étant de `b`, `filter(products)` l'écartait déjà, et retirer
         `filter(projects)` n'aurait fait tomber aucun test — mesuré. C'est
         exactement le piège que l'en-tête du module nomme : un second filtre
         plus bas rattrape la fuite que le premier laisse passer, et aucune mise
         en défaut ne sait plus lequel des deux protège. */
  await db.insert(projectLinks).values({
    domainId: a.domainId,
    fromProjectId: a.refId,
    toProjectId: leakedDomainProjectId,
  });
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
    expect(row?.periodStart).toBe("2026-02-01");
    expect(row?.periodEnd).toBe("2026-02-01");
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

/* ==========================================================================
   Les liens **déclarés** — T6.5
   ========================================================================== */

describe("listDeclaredLinks — la lecture est symétrique", () => {
  test("le lien sortant paraît, avec sa raison et son sens", async () => {
    const rows = await listDeclaredLinks(a.scope, a.refId);
    const row = rows.find((entry) => entry.id === declaredOutId);

    expect(row?.direction).toBe("outgoing");
    // La ligne donne à lire l'**autre** projet, jamais celui qu'on consulte.
    expect(row?.projectId).toBe(a.strangerId);
    expect(row?.name).toBe(a.strangerName);
    expect(row?.reason).toBe("Réutilise la grille d'entretien");
  });

  test("le lien entrant paraît aussi, et son sens le dit", async () => {
    const rows = await listDeclaredLinks(a.scope, a.refId);
    const row = rows.find((entry) => entry.id === declaredInId);

    // C'est toute la propriété de l'arbitrage (g) : les deux pages portent la
    // ligne, une seule la retire. Sans ce constat, un lien déclaré depuis
    // l'autre côté serait invisible ici et personne ne saurait qu'il existe.
    expect(row?.direction).toBe("incoming");
    expect(row?.projectId).toBe(a.lonelyId);
    expect(row?.name).toBe(a.lonelyName);
  });

  test("une raison absente sort `null`, jamais une chaîne vide", async () => {
    const rows = await listDeclaredLinks(a.scope, a.refId);

    // `docs/02` §7 veut la saisie « parfaitement optionnelle » : l'écran doit
    // pouvoir distinguer « rien n'a été dit » de « on a dit rien ».
    //
    // Le constat porte sur un lien **sortant** : posé sur l'entrant, il serait
    // tombé avec lui dès qu'on aurait neutralisé la lecture symétrique.
    expect(
      rows.find((entry) => entry.id === declaredPlainId)?.reason,
    ).toBeNull();
  });

  test("chaque ligne porte son produit, son statut et sa période", async () => {
    const rows = await listDeclaredLinks(a.scope, a.refId);
    const row = rows.find((entry) => entry.id === declaredOutId);

    expect(row?.productName).toBe("Caisse a");
    expect(row?.statusLabel).toBe("En cours a");
    expect(row?.statusNature).toBe("active");
    expect(row?.periodStart).toBe("2026-02-01");
    expect(row?.periodEnd).toBe("2026-02-01");
  });

  test("un lien entre deux autres projets n'entre pas", async () => {
    const rows = await listDeclaredLinks(a.scope, a.refId);

    expect(rows.map((row) => row.id)).not.toContain(declaredElsewhereId);
  });

  test("le nom ordonne la liste", async () => {
    const rows = await listDeclaredLinks(a.scope, a.refId);

    // « Golf » avant « Papa » : l'ordre ne dit rien de plus que l'alphabet —
    // rien ne classe deux liens déclarés, ils ont été écrits, pas mesurés.
    //
    // Deux liens **de même sens**, à dessein : comparer un sortant à un entrant
    // aurait fait tomber ce constat avec la lecture symétrique.
    expect(rankOf(rows, declaredOutId)).toBeLessThan(
      rankOf(rows, declaredPlainId),
    );
  });

  test("un projet sans lien déclaré rend un tableau vide", async () => {
    // **Dans `c`, le domaine sans aucune liaison déclarée** : lu dans `a`, ce
    // constat tomberait avec l'une des deux étanchéités.
    const rows = await listDeclaredLinks(c.scope, c.lonelyId);

    expect(rows).toEqual([]);
  });

  test("un projet d'un autre domaine rend un tableau vide, comme un inconnu", async () => {
    expect(await listDeclaredLinks(a.scope, b.refId)).toEqual([]);
    expect(
      await listDeclaredLinks(a.scope, "00000000-0000-4000-8000-000000000000"),
    ).toEqual([]);
  });
});

describe("listDeclaredLinks — les deux étanchéités", () => {
  test("une liaison d'un autre domaine ne se lit pas — `filter(projectLinks)`", async () => {
    const rows = await listDeclaredLinks(a.scope, a.refId);

    expect(rows.map((row) => row.projectId)).not.toContain(a.leakLinkTargetId);
  });

  test("un projet d'un autre domaine ne paraît pas au bout d'une liaison — `filter(projects)`", async () => {
    const rows = await listDeclaredLinks(a.scope, a.refId);

    // La liaison est du bon domaine ; c'est sa **cible** qui n'y est pas. Sans
    // le filtre de la jointure, le nom et le statut d'un accompagnement
    // d'ailleurs paraîtraient dans ce bloc.
    expect(rows.map((row) => row.projectId)).not.toContain(
      leakedDomainProjectId,
    );
  });
});

describe("listLinkableProjects — ce que le panneau propose", () => {
  test("le projet consulté ne se propose pas à lui-même", async () => {
    const rows = await listLinkableProjects(a.scope, a.refId);

    // Le `CHECK` `project_links_no_self_link` reste la seconde barrière : il
    // n'est jamais atteint parce que l'écran ne propose rien qui y mène.
    expect(rows.map((row) => row.id)).not.toContain(a.refId);
  });

  test("un projet déjà relié depuis celui-ci ne se propose plus", async () => {
    const rows = await listLinkableProjects(a.scope, a.refId);

    expect(rows.map((row) => row.id)).not.toContain(a.strangerId);
  });

  test("le réciproque, lui, se propose — ce n'est pas un doublon", async () => {
    const rows = await listLinkableProjects(a.scope, a.refId);

    // `Zoulou → ref` existe ; `ref → Zoulou` n'existe pas.
    // `project_links_from_to_unique` porte sur un couple **orienté**, et deux
    // déclarations opposées sont deux faits distincts, chacun avec sa raison.
    // Refuser celle-ci serait un cinquième refus que la fiche ne porte pas.
    expect(rows.map((row) => row.id)).toContain(a.lonelyId);
  });

  test("ni le projet archivé, ni celui d'un produit archivé ne se proposent", async () => {
    const rows = await listLinkableProjects(a.scope, a.refId);
    const ids = rows.map((row) => row.id);

    // Interdit de la fiche : *ni proposé, ni accepté*. La seconde moitié se
    // mesure sur l'action, pas ici — l'écran n'a jamais protégé un point
    // d'entrée HTTP.
    expect(ids).not.toContain(a.archivedProjectId);
    expect(ids).not.toContain(a.archivedProductProjectId);
  });

  test("une liaison d'un autre domaine ne retire rien des propositions — `filter(projectLinks)`", async () => {
    const rows = await listLinkableProjects(a.scope, a.refId);

    // Sans le filtre du `not exists`, la liaison forgée de `b` ferait
    // disparaître « Oscar » de la liste : une fuite qui **retire** au lieu
    // d'ajouter, et qu'aucun constat sur la lecture symétrique n'attraperait.
    expect(rows.map((row) => row.id)).toContain(a.leakLinkTargetId);
  });

  test("aucun projet d'un autre domaine ne se propose — `filter(projects)`", async () => {
    const rows = await listLinkableProjects(a.scope, a.refId);

    expect(rows.map((row) => row.id)).not.toContain(leakedDomainProjectId);
    expect(rows.map((row) => row.id)).not.toContain(b.lonelyId);
  });

  test("le libellé nomme le projet et son produit", async () => {
    const rows = await listLinkableProjects(a.scope, a.refId);
    const row = rows.find((entry) => entry.id === a.sameProductId);

    expect(row?.label).toBe(`Bravo ${suffix} · Espace client a`);
  });

  test("le produit ordonne, puis le projet", async () => {
    const rows = await listLinkableProjects(a.scope, a.refId);

    // « Agence a » avant « Espace client a » : c'est le produit qui groupe la
    // liste, et le nom du projet qui départage à l'intérieur.
    expect(rankOf(rows, a.sameEntityId)).toBeLessThan(
      rankOf(rows, a.sameProductId),
    );
  });

  test("`keepProjectId` ramène la cible du lien qu'on corrige, et elle seule", async () => {
    const base = await listLinkableProjects(a.scope, a.refId);
    const kept = await listLinkableProjects(a.scope, a.refId, {
      keepProjectId: a.strangerId,
    });

    expect(kept.map((row) => row.id)).toContain(a.strangerId);

    /* **L'exception est nominative, et c'est ce constat-ci qui le dit** : la
       liste avec l'exception, privée du seul nom qu'on a cité, est exactement
       la liste sans elle. Une exception qui rouvrirait la porte à un second
       projet — un archivé, un autre déjà relié — ferait diverger les deux.

       Comparer les **deux** listes plutôt que d'énumérer ce qui doit rester
       dehors est aussi ce qui garde la chute isolée : les autres exclusions ont
       leurs propres constats, et neutraliser l'une d'elles déplace les deux
       listes de la même manière — l'écart, lui, ne bouge pas. */
    expect(kept.filter((row) => row.id !== a.strangerId)).toEqual(
      base.filter((row) => row.id !== a.strangerId),
    );
  });
});
