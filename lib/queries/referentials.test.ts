/**
 * Les tests de la lecture générique des **huit** référentiels que gère l'écran
 * d'administration hors des entités — quatre en T7.3, quatre en T7.4.
 *
 * Ils tournent sur la branche Neon dédiée — `vitest.config.mts` remappe
 * `DATABASE_URL` sur `TEST_DATABASE_URL` — et écrivent réellement : quatre
 * sous-requêtes corrélées et un référentiel qui montre ses lignes archivées ne
 * se vérifient pas sur un faux.
 *
 * **Deux domaines sont amorcés**, comme partout dans ce dossier : sans un
 * second domaine, aucun test d'étanchéité ne prouve quoi que ce soit — et
 * chaque décompte porte **deux ou trois** `filter()`, dont un seul se met en
 * défaut sur une ligne forgée d'un autre domaine.
 *
 * **Ce qui est éprouvé n'est pas « le nombre est juste »**, mais *ce que le
 * nombre écarte* : un accompagnement archivé, une personne archivée, une
 * activité archivée, une ligne d'un autre domaine. Un décompte qu'aucune ligne
 * forgée ne vise n'est pas éprouvé.
 *
 * **T7.4 ajoute deux sujets.** La **logique** que chaque ligne porte — la nature
 * d'un statut, la famille d'un type, le genre d'un outil ou d'une piste —, qui
 * doit remonter jusqu'à l'écran ; et l'**opposition d'un outil**, qui n'est
 * retenue par aucune clé `restrict` et repose donc entièrement sur ce qui est
 * écrit ici. Le cas d'étanchéité qui la vise est une **piste du domaine courant
 * pointant l'outil d'un autre domaine** — une ligne que la base accepte, que
 * `assertPreconditions` refuserait à l'écriture, et qu'il a donc fallu forger.
 */

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { db } from "@/lib/db/client";
import { forDomain, superAdmin, type ScopedDb } from "@/lib/db/scoped";
import {
  activities,
  activityTypes,
  approaches,
  domains,
  entities,
  jobs,
  personSkills,
  persons,
  products,
  projectApproaches,
  projectJobs,
  projects,
  projectStatuses,
  skillLevels,
  skills,
  starters,
  tools,
} from "@/lib/db/schema";

import { countReferentialUsage, listReferentialForAdmin } from "./referentials";

/** Enfants d'abord, parents ensuite : les clés `restrict` refusent l'inverse. */
const teardownOrder = [
  personSkills,
  activities,
  projectApproaches,
  projectJobs,
  projects,
  products,
  persons,
  starters,
  activityTypes,
  tools,
  projectStatuses,
  skillLevels,
  skills,
  approaches,
  jobs,
  entities,
];

type Fixture = {
  domainId: string;
  scope: ScopedDb;
  /** Un projet vivant et une personne vivante le portent. */
  loadedJobId: string;
  /** Une personne **archivée** seule le porte : rien ne s'oppose. */
  archivedHolderJobId: string;
  /** Rien ne le porte. */
  freeJobId: string;
  /** Archivé dans la fixture : il doit rester listé. */
  archivedJobId: string;

  /** Un projet vivant et une activité vivante la portent. */
  loadedApproachId: string;
  /** Une activité **archivée** seule la porte. */
  archivedActivityApproachId: string;
  freeApproachId: string;

  /** Deux personnes vivantes la déclarent. */
  loadedSkillId: string;
  freeSkillId: string;

  /** Trois déclarations le citent — dont deux d'une même personne. */
  loadedLevelId: string;
  freeLevelId: string;

  /* --- T7.4 -------------------------------------------------------------- */

  /** Un accompagnement vivant et un rangé le portent : seul le vivant compte. */
  loadedStatusId: string;
  /** Rien ne le porte. */
  freeStatusId: string;

  /** Deux activités vivantes et une archivée le portent. */
  loadedTypeId: string;
  freeTypeId: string;

  /** Un type vivant **et** une piste vivante le nomment. */
  loadedToolId: string;
  /** Un type archivé et une piste archivée seuls le nomment : rien ne s'oppose. */
  rangedHoldersToolId: string;
  /** Rien ne le nomme. */
  freeToolId: string;

  /** Rien ne référence une piste : les deux sont à zéro partout. */
  toolStarterId: string;
  methodStarterId: string;
};

const suffix = Math.random().toString(36).slice(2, 10);
let a: Fixture;
let b: Fixture;

async function seedDomain(label: string): Promise<Fixture> {
  const domain = await superAdmin.createDomain({
    name: `__test__referentials__${label}__${suffix}`,
    competenceCenterName: `Centre ${label}`,
  });
  const scope = forDomain({ domainId: domain.id });

  /* Les libellés sont préfixés par une lettre, et les positions par un rang :
     le tri se lit alors sur la liste rendue sans dépendre du nom du domaine. */
  const job = (name: string, position: string) =>
    scope.insert(jobs, { label: `${name} ${label}`, position });
  const loadedJob = await job("A chargé", "10");
  const archivedHolderJob = await job("B tenu par archivée", "20");
  const freeJob = await job("C libre", "30");
  const archivedJob = await job("D archivé", "40");
  await scope.archive(jobs, archivedJob.id);

  const approach = (name: string, position: string) =>
    scope.insert(approaches, { label: `${name} ${label}`, position });
  const loadedApproach = await approach("A chargée", "10");
  const archivedActivityApproach = await approach("B activité rangée", "20");
  const freeApproach = await approach("C libre", "30");

  const loadedSkill = await scope.insert(skills, {
    label: `A chargée ${label}`,
    position: "10",
  });
  const freeSkill = await scope.insert(skills, {
    label: `B libre ${label}`,
    position: "20",
  });

  /* Les rangs sont posés à l'envers de l'ordre alphabétique : c'est ainsi que
     l'on voit que le tri de l'échelle suit `rank` et non le libellé. */
  const loadedLevel = await scope.insert(skillLevels, {
    label: `Z chargé ${label}`,
    rank: 1,
    position: "99",
  });
  const freeLevel = await scope.insert(skillLevels, {
    label: `A libre ${label}`,
    rank: 2,
    position: "1",
  });

  /* Le décor minimal d'un accompagnement : une entité, un produit, un statut. */
  const entity = await scope.insert(entities, { label: `Entité ${label}` });
  const product = await scope.insert(products, {
    name: `Produit ${label}`,
    entityId: entity.id,
  });
  /* Les quatre référentiels de T7.4. Les positions et les libellés sont posés
     comme ceux des quatre premiers : le tri se lit sur la liste rendue. */
  const status = await scope.insert(projectStatuses, {
    label: `A en cours ${label}`,
    nature: "active",
    position: "10",
  });
  const freeStatus = await scope.insert(projectStatuses, {
    label: `B libre ${label}`,
    nature: "paused",
    position: "20",
  });

  /* Trois outils, et ce qui les sépare est **ce qui les nomme** : le premier
     est nommé par un type et une piste vivants, le deuxième par un type et une
     piste **archivés** — sans lui, le filtre sur `archived_at` des deux
     sous-requêtes ne serait visé par rien —, le troisième par personne. */
  const tool = (name: string) =>
    scope.insert(tools, { name: `${name} ${label}`, kind: "audit" });
  const loadedTool = await tool("A chargé");
  const rangedHoldersTool = await tool("B tenu par rangés");
  const freeTool = await tool("C libre");

  const type = await scope.insert(activityTypes, {
    label: `A atelier ${label}`,
    family: "design",
    position: "10",
    defaultToolId: loadedTool.id,
  });
  const freeType = await scope.insert(activityTypes, {
    label: `B libre ${label}`,
    family: "research",
    position: "20",
  });
  const rangedType = await scope.insert(activityTypes, {
    label: `C rangé ${label}`,
    family: "evaluation",
    position: "30",
    defaultToolId: rangedHoldersTool.id,
  });
  await scope.archive(activityTypes, rangedType.id);

  const toolStarter = await scope.insert(starters, {
    label: `A vers un outil ${label}`,
    summary: "Ouvrir la plateforme et lancer la campagne.",
    kind: "tool",
    toolId: loadedTool.id,
    position: "10",
  });
  const methodStarter = await scope.insert(starters, {
    label: `B méthode ${label}`,
    summary: "Une manière de faire qu'aucun outil ne porte.",
    guidance: "Le texte long du panneau.",
    kind: "method",
    position: "20",
  });
  const rangedStarter = await scope.insert(starters, {
    label: `C rangée ${label}`,
    summary: "Rangée dans la fixture.",
    kind: "resource",
    toolId: rangedHoldersTool.id,
    position: "30",
  });
  await scope.archive(starters, rangedStarter.id);

  const project = async (name: string) =>
    scope.insert(projects, {
      name: `${name} ${label}`,
      productId: product.id,
      statusId: status.id,
    });
  const liveProject = await project("Accompagnement vivant");
  const rangedProject = await project("Accompagnement rangé");
  await scope.archive(projects, rangedProject.id);

  /* Le métier chargé est déclaré par les **deux** accompagnements : seul le
     vivant doit compter. Sans la seconde ligne, le filtre sur `archived_at` ne
     serait visé par rien. */
  for (const target of [liveProject, rangedProject]) {
    await scope.insert(projectJobs, {
      projectId: target.id,
      jobId: loadedJob.id,
    });
    await scope.insert(projectApproaches, {
      projectId: target.id,
      approachId: loadedApproach.id,
    });
  }

  const person = async (name: string, jobId?: string) =>
    scope.insert(persons, {
      fullName: `${name} ${label}`,
      source: "manual",
      kind: "center",
      ...(jobId ? { jobId } : {}),
    });
  const holder = await person("Porteuse", loadedJob.id);
  const secondHolder = await person("Seconde porteuse", loadedJob.id);
  /* Une personne archivée qui porte un métier : elle ne s'y oppose pas. */
  const rangedHolder = await person("Rangée", archivedHolderJob.id);
  await scope.archive(persons, rangedHolder.id);

  /* Une seule des deux porteuses vivantes garde le métier chargé : le décompte
     de personnes doit dire 2, et celui du métier « tenu par archivée » 0. */
  await scope.update(persons, secondHolder.id, { jobId: loadedJob.id });

  await scope.insert(personSkills, {
    personId: holder.id,
    skillId: loadedSkill.id,
    levelId: loadedLevel.id,
  });
  await scope.insert(personSkills, {
    personId: secondHolder.id,
    skillId: loadedSkill.id,
    levelId: loadedLevel.id,
  });
  /* La seconde déclaration de la **même** personne au même niveau : c'est elle
     qui sépare « nombre de personnes » de « nombre de déclarations ». */
  await scope.insert(personSkills, {
    personId: holder.id,
    skillId: freeSkill.id,
    levelId: loadedLevel.id,
  });
  /* Une déclaration portée par une personne archivée : elle ne compte pas. */
  await scope.insert(personSkills, {
    personId: rangedHolder.id,
    skillId: freeSkill.id,
    levelId: freeLevel.id,
  });

  const activity = async (approachId: string, archived: boolean) => {
    const row = await scope.insert(activities, {
      projectId: liveProject.id,
      activityTypeId: type.id,
      approachId,
      /* `activities_planned_requires_period_or_unscheduled` : une activité
         planifiée porte une période ou se dit « à planifier » (D14). */
      isUnscheduled: true,
    });
    if (archived) await scope.archive(activities, row.id);
    return row;
  };
  await activity(loadedApproach.id, false);
  await activity(loadedApproach.id, true);
  await activity(archivedActivityApproach.id, true);

  return {
    domainId: domain.id,
    scope,
    loadedJobId: loadedJob.id,
    archivedHolderJobId: archivedHolderJob.id,
    freeJobId: freeJob.id,
    archivedJobId: archivedJob.id,
    loadedApproachId: loadedApproach.id,
    archivedActivityApproachId: archivedActivityApproach.id,
    freeApproachId: freeApproach.id,
    loadedSkillId: loadedSkill.id,
    freeSkillId: freeSkill.id,
    loadedLevelId: loadedLevel.id,
    freeLevelId: freeLevel.id,

    loadedStatusId: status.id,
    freeStatusId: freeStatus.id,
    loadedTypeId: type.id,
    freeTypeId: freeType.id,
    loadedToolId: loadedTool.id,
    rangedHoldersToolId: rangedHoldersTool.id,
    freeToolId: freeTool.id,
    toolStarterId: toolStarter.id,
    methodStarterId: methodStarter.id,
  };
}

beforeAll(async () => {
  a = await seedDomain("a");
  b = await seedDomain("b");
}, 180_000);

afterAll(async () => {
  const ids = [a?.domainId, b?.domainId].filter(Boolean) as string[];
  if (ids.length === 0) return;
  for (const table of teardownOrder) {
    await db.delete(table).where(inArray(table.domainId, ids));
  }
  await db.delete(domains).where(inArray(domains.id, ids));
});

/* ==========================================================================
   Ce que la liste rend
   ========================================================================== */

describe("listReferentialForAdmin — l'ordre et l'archivage", () => {
  test("les métiers viennent par position, archivé compris", async () => {
    const rows = await listReferentialForAdmin(a.scope, "metiers");

    expect(rows.map((row) => row.id)).toEqual([
      a.loadedJobId,
      a.archivedHolderJobId,
      a.freeJobId,
      a.archivedJobId,
    ]);
  });

  test("l'archivage se lit sur la ligne, il ne l'écarte pas", async () => {
    const rows = await listReferentialForAdmin(a.scope, "metiers");

    expect(
      rows.find((row) => row.id === a.archivedJobId)?.archivedAt,
    ).toBeInstanceOf(Date);
    expect(rows.find((row) => row.id === a.freeJobId)?.archivedAt).toBeNull();
  });

  test("l'échelle vient par rang, jamais par libellé", async () => {
    /* La fixture pose les rangs à l'envers de l'alphabet : « Z chargé » est
       rang 1, « A libre » rang 2. Un tri par libellé les rendrait à l'envers. */
    const rows = await listReferentialForAdmin(a.scope, "niveaux");

    expect(rows.map((row) => row.id)).toEqual([a.loadedLevelId, a.freeLevelId]);
    expect(rows.map((row) => row.rank)).toEqual([1, 2]);
  });

  test("chaque référentiel ne porte que la clé qui l'ordonne", async () => {
    const [job] = await listReferentialForAdmin(a.scope, "metiers");
    expect(job?.position).toBe("10.00");
    expect(job?.rank).toBeNull();

    const [level] = await listReferentialForAdmin(a.scope, "niveaux");
    /* `skill_levels.position` existe en base et vaut 99 dans la fixture : la
       lecture ne la remonte pas, parce qu'aucun écran ne la lit. */
    expect(level?.position).toBeNull();
    expect(level?.rank).toBe(1);
  });

  test("aucune ligne d'un autre domaine n'entre", async () => {
    const rows = await listReferentialForAdmin(a.scope, "metiers");
    const foreign = [
      b.loadedJobId,
      b.freeJobId,
      b.archivedJobId,
      b.archivedHolderJobId,
    ];

    expect(rows.some((row) => foreign.includes(row.id))).toBe(false);
  });
});

/* ==========================================================================
   Ce que le décompte compte, et ce qu'il écarte
   ========================================================================== */

describe("le décompte des métiers", () => {
  test("un accompagnement vivant et deux personnes vivantes s'y opposent", async () => {
    const rows = await listReferentialForAdmin(a.scope, "metiers");
    const loaded = rows.find((row) => row.id === a.loadedJobId);

    /* Deux accompagnements le déclarent, dont un archivé : le décompte dit 1. */
    expect(loaded?.usage.projects).toBe(1);
    expect(loaded?.usage.persons).toBe(2);
    expect(loaded?.usage.activities).toBe(0);
  });

  test("une personne archivée ne s'oppose à rien", async () => {
    const rows = await listReferentialForAdmin(a.scope, "metiers");
    const held = rows.find((row) => row.id === a.archivedHolderJobId);

    expect(held?.usage.persons).toBe(0);
    expect(held?.usage.projects).toBe(0);
  });

  test("un métier que rien ne porte est à zéro partout", async () => {
    const rows = await listReferentialForAdmin(a.scope, "metiers");
    const free = rows.find((row) => row.id === a.freeJobId);

    expect(free?.usage).toEqual({
      products: 0,
      projects: 0,
      persons: 0,
      activities: 0,
      activityTypes: 0,
      starters: 0,
      declarations: 0,
    });
  });
});

describe("le décompte des approches", () => {
  test("un accompagnement vivant et une activité vivante s'y opposent", async () => {
    const rows = await listReferentialForAdmin(a.scope, "approches");
    const loaded = rows.find((row) => row.id === a.loadedApproachId);

    expect(loaded?.usage.projects).toBe(1);
    /* Deux activités la portent, dont une archivée. */
    expect(loaded?.usage.activities).toBe(1);
    expect(loaded?.usage.persons).toBe(0);
  });

  test("une activité archivée ne s'oppose à rien", async () => {
    const rows = await listReferentialForAdmin(a.scope, "approches");
    const ranged = rows.find(
      (row) => row.id === a.archivedActivityApproachId,
    );

    expect(ranged?.usage.activities).toBe(0);
  });
});

describe("le décompte des compétences et des niveaux", () => {
  test("une compétence compte les personnes vivantes qui la déclarent", async () => {
    const rows = await listReferentialForAdmin(a.scope, "competences");
    const loaded = rows.find((row) => row.id === a.loadedSkillId);
    const free = rows.find((row) => row.id === a.freeSkillId);

    expect(loaded?.usage.persons).toBe(2);
    /* La compétence « libre » est déclarée par une personne vivante et par une
       personne archivée : seule la première compte. */
    expect(free?.usage.persons).toBe(1);
  });

  test("un niveau compte les déclarations, non les personnes", async () => {
    /* Trois déclarations le citent, dont **deux de la même personne** : un
       `count(distinct person_id)` dirait 2, et il aurait tort — ce qui s'oppose
       au rangement est la déclaration.

       **Et le décompte a son propre champ**, ce qui est la correction du
       30/08/2026 : rangé dans `persons`, il faisait dire « 3 personnes » à un
       écran qui n'en connaissait que deux. Le champ dit ce que le nombre
       compte, et `persons` reste à zéro. */
    const rows = await listReferentialForAdmin(a.scope, "niveaux");
    const loaded = rows.find((row) => row.id === a.loadedLevelId);

    expect(loaded?.usage.declarations).toBe(3);
    expect(loaded?.usage.persons).toBe(0);
  });

  test("une déclaration portée par une personne archivée ne compte pas", async () => {
    const rows = await listReferentialForAdmin(a.scope, "niveaux");
    const free = rows.find((row) => row.id === a.freeLevelId);

    expect(free?.usage.declarations).toBe(0);
  });
});

/* ==========================================================================
   `countReferentialUsage` — le décompte d'une seule ligne
   ========================================================================== */

describe("countReferentialUsage", () => {
  test("il rend ce que la liste rend, sur les quatre référentiels", async () => {
    const cases = [
      ["metiers", a.loadedJobId],
      ["approches", a.loadedApproachId],
      ["competences", a.loadedSkillId],
      ["niveaux", a.loadedLevelId],
    ] as const;

    for (const [referential, id] of cases) {
      const rows = await listReferentialForAdmin(a.scope, referential);
      const listed = rows.find((row) => row.id === id);
      const counted = await countReferentialUsage(a.scope, referential, id);

      expect(counted).toEqual(listed?.usage);
    }
  });

  test("une ligne d'un autre domaine ne compte rien", async () => {
    /* Le décompte de `b` est non nul ; lu depuis `a`, la ligne n'existe pas —
       elle ne « manque » pas, elle ne compte rien. C'est le `filter()` du
       `from`, et sans cette ligne forgée il ne serait visé par rien. */
    const fromB = await countReferentialUsage(
      b.scope,
      "metiers",
      b.loadedJobId,
    );
    expect(fromB.persons).toBe(2);

    const fromA = await countReferentialUsage(
      a.scope,
      "metiers",
      b.loadedJobId,
    );
    expect(fromA).toEqual({
      products: 0,
      projects: 0,
      persons: 0,
      activities: 0,
      activityTypes: 0,
      starters: 0,
      declarations: 0,
    });
  });

  test("un identifiant inconnu ne compte rien", async () => {
    const counted = await countReferentialUsage(
      a.scope,
      "competences",
      "00000000-0000-4000-8000-000000000000",
    );
    expect(counted.persons).toBe(0);
  });
});

/* ==========================================================================
   T7.4 — les quatre référentiels porteurs de logique
   ========================================================================== */

describe("listReferentialForAdmin — les quatre référentiels de T7.4", () => {
  test("les statuts viennent par position, et portent leur nature", async () => {
    const rows = await listReferentialForAdmin(a.scope, "statuts");

    expect(rows.map((row) => row.id)).toEqual([
      a.loadedStatusId,
      a.freeStatusId,
    ]);
    expect(rows.map((row) => row.logic)).toEqual([
      { kind: "nature", value: "active" },
      { kind: "nature", value: "paused" },
    ]);
  });

  test("les types portent leur famille, archivé compris", async () => {
    const rows = await listReferentialForAdmin(a.scope, "types");

    /* Le troisième est archivé dans la fixture : il **reste listé**, cet écran
       étant le seul de l'application à montrer ce qu'il a rangé. */
    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.logic)).toEqual([
      { kind: "family", value: "design" },
      { kind: "family", value: "research" },
      { kind: "family", value: "evaluation" },
    ]);
    expect(rows[2]?.archivedAt).toBeInstanceOf(Date);
  });

  test("les outils viennent par nom, sans position — la colonne n'existe pas", async () => {
    const rows = await listReferentialForAdmin(a.scope, "outils");

    expect(rows.map((row) => row.id)).toEqual([
      a.loadedToolId,
      a.rangedHoldersToolId,
      a.freeToolId,
    ]);
    /* Ni `position` ni `rank` : `tools` ne porte aucune des deux, et la lecture
       les rend nulles plutôt que d'inventer un ordre que rien n'écrit. */
    expect(rows.every((row) => row.position === null)).toBe(true);
    expect(rows.every((row) => row.rank === null)).toBe(true);
    expect(rows[0]?.logic).toEqual({ kind: "toolKind", value: "audit" });
  });

  test("un outil est nommé par sa colonne `name`, coulée en `label`", async () => {
    const rows = await listReferentialForAdmin(a.scope, "outils");

    /* La seule des neuf tables à ne pas nommer sa colonne `label` : l'alias de
       la lecture est ce qui laisse la ligne d'écran avoir une seule forme. */
    expect(rows[0]?.label).toBe("A chargé a");
  });

  test("les pistes viennent par position, et portent leur genre", async () => {
    const rows = await listReferentialForAdmin(a.scope, "pistes");

    expect(rows.map((row) => row.id.slice(0, 0).concat(row.label))).toEqual([
      "A vers un outil a",
      "B méthode a",
      "C rangée a",
    ]);
    expect(rows.map((row) => row.logic)).toEqual([
      { kind: "starterKind", value: "tool" },
      { kind: "starterKind", value: "method" },
      { kind: "starterKind", value: "resource" },
    ]);
  });

  test("les quatre référentiels de T7.3 ne portent aucune logique", async () => {
    for (const referential of [
      "metiers",
      "approches",
      "competences",
      "niveaux",
    ] as const) {
      const rows = await listReferentialForAdmin(a.scope, referential);
      expect(rows.every((row) => row.logic === null)).toBe(true);
    }
  });

  test("aucune ligne d'un autre domaine n'entre", async () => {
    for (const referential of ["statuts", "types", "outils", "pistes"] as const) {
      const rows = await listReferentialForAdmin(a.scope, referential);
      const fromB = await listReferentialForAdmin(b.scope, referential);
      const shared = rows.filter((row) =>
        fromB.some((other) => other.id === row.id),
      );
      expect(shared).toEqual([]);
    }
  });
});

describe("le décompte des statuts", () => {
  test("un accompagnement vivant s'y oppose, un accompagnement rangé non", async () => {
    const rows = await listReferentialForAdmin(a.scope, "statuts");

    /* La fixture porte deux accompagnements sur ce statut, dont un archivé :
       sans le second, le filtre sur `archived_at` ne serait visé par rien. */
    expect(rows.find((row) => row.id === a.loadedStatusId)?.usage.projects).toBe(
      1,
    );
    expect(rows.find((row) => row.id === a.freeStatusId)?.usage.projects).toBe(
      0,
    );
  });
});

describe("le décompte des types d'activité", () => {
  test("une activité vivante s'y oppose, une activité archivée non", async () => {
    const rows = await listReferentialForAdmin(a.scope, "types");

    /* Trois activités portent ce type dans la fixture — une vivante, deux
       archivées. Le décompte doit dire 1. */
    expect(rows.find((row) => row.id === a.loadedTypeId)?.usage.activities).toBe(
      1,
    );
    expect(rows.find((row) => row.id === a.freeTypeId)?.usage.activities).toBe(
      0,
    );
  });
});

describe("le décompte des outils — l'arbitrage, éprouvé", () => {
  test("un type vivant et une piste vivante s'y opposent", async () => {
    const rows = await listReferentialForAdmin(a.scope, "outils");
    const loaded = rows.find((row) => row.id === a.loadedToolId);

    expect(loaded?.usage.activityTypes).toBe(1);
    expect(loaded?.usage.starters).toBe(1);
  });

  test("un type archivé et une piste archivée ne s'opposent à rien", async () => {
    const rows = await listReferentialForAdmin(a.scope, "outils");
    const ranged = rows.find((row) => row.id === a.rangedHoldersToolId);

    /* Les deux lignes qui le nomment existent, et sont rangées : c'est le seul
       cas qui met en défaut les deux `isNull(archived_at)` de ce décompte. */
    expect(ranged?.usage.activityTypes).toBe(0);
    expect(ranged?.usage.starters).toBe(0);
  });

  test("un outil que rien ne nomme est à zéro partout", async () => {
    const rows = await listReferentialForAdmin(a.scope, "outils");

    expect(rows.find((row) => row.id === a.freeToolId)?.usage).toEqual({
      products: 0,
      projects: 0,
      persons: 0,
      activities: 0,
      activityTypes: 0,
      starters: 0,
      declarations: 0,
    });
  });

  test("**une piste forgée hors domaine ne compte rien**", async () => {
    /* La ligne que la couche scopée refuserait d'écrire : une piste du domaine
       `a` qui pointe l'outil libre du domaine `b`. Sans elle, le `filter()` de
       la sous-requête des pistes ne serait visé par rien — le décompte serait
       faux et tous les autres cas passeraient quand même. */
    const forged = await a.scope.insert(starters, {
      label: `Z forgée ${a.domainId.slice(0, 4)}`,
      summary: "Elle pointe l'outil d'un autre domaine.",
      kind: "tool",
      position: "99",
    });
    await db
      .update(starters)
      .set({ toolId: b.freeToolId })
      .where(eq(starters.id, forged.id));

    const counted = await countReferentialUsage(
      b.scope,
      "outils",
      b.freeToolId,
    );
    expect(counted.starters).toBe(0);

    await db.delete(starters).where(eq(starters.id, forged.id));
  });
});

describe("le décompte des pistes — rien ne les référence", () => {
  test("les deux pistes vivantes sont à zéro partout", async () => {
    const rows = await listReferentialForAdmin(a.scope, "pistes");

    for (const id of [a.toolStarterId, a.methodStarterId]) {
      expect(rows.find((row) => row.id === id)?.usage).toEqual({
        products: 0,
        projects: 0,
        persons: 0,
        activities: 0,
        activityTypes: 0,
        starters: 0,
        declarations: 0,
      });
    }
  });
});

describe("countReferentialUsage — les quatre référentiels de T7.4", () => {
  test("il rend ce que la liste rend", async () => {
    for (const [referential, id] of [
      ["statuts", a.loadedStatusId],
      ["types", a.loadedTypeId],
      ["outils", a.loadedToolId],
      ["pistes", a.toolStarterId],
    ] as const) {
      const rows = await listReferentialForAdmin(a.scope, referential);
      const listed = rows.find((row) => row.id === id)?.usage;
      const counted = await countReferentialUsage(a.scope, referential, id);
      expect(counted).toEqual(listed);
    }
  });

  test("une ligne d'un autre domaine ne compte rien", async () => {
    /* Le décompte de `b` est non nul ; lu depuis `a`, la ligne n'existe pas. */
    expect(
      (await countReferentialUsage(b.scope, "outils", b.loadedToolId)).starters,
    ).toBe(1);
    expect(
      (await countReferentialUsage(a.scope, "outils", b.loadedToolId)).starters,
    ).toBe(0);
  });
});
