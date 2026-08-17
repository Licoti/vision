/**
 * Les tests de la lecture de l'écran Équipe.
 *
 * Ils tournent sur la branche Neon dédiée — `vitest.config.mts` remappe
 * `DATABASE_URL` sur `TEST_DATABASE_URL` — et écrivent réellement : un tri par
 * nom, un `leftJoin` filtré sur le domaine et quatre filtres d'étanchéité ne se
 * vérifient pas sur un faux.
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
 * Les constats se lisent par identifiant et non par position — sauf le test du
 * tri, qui compare des rangs relatifs. Un défaut d'ordre ne doit pas faire
 * tomber les autres.
 */

import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { db } from "@/lib/db/client";
import { forDomain, superAdmin, type ScopedDb } from "@/lib/db/scoped";
import {
  domains,
  jobs,
  personSkills,
  persons,
  skillLevels,
  skills,
} from "@/lib/db/schema";

import { listTeam } from "./team";

/** Enfants d'abord, parents ensuite : `domains` refuse la suppression sinon. */
const teardownOrder = [personSkills, persons, skillLevels, skills, jobs];

type Fixture = {
  domainId: string;
  scope: ScopedDb;
  /** Trois compétences déclarées, dont deux au même rang : le tri s'y lit. */
  aliceId: string;
  /** Sans métier, sans compétence : le `leftJoin` et l'état vide. */
  brunoId: string;
  /** Côté entité : la mention, et pas de disponibilité (arbitrage (d)). */
  zoeId: string;
  /** Archivée : absente du référentiel. */
  yvesId: string;
  /** Aucune compétence légitime : c'est sur elle que les fuites sont forgées. */
  damienId: string;
  jobId: string;
  advancedLevelId: string;
  expertLevelId: string;
  probeLinkSkillId: string;
  probeSkillId: string;
  probeLevelSkillId: string;
};

const suffix = Math.random().toString(36).slice(2, 10);
let a: Fixture;
let b: Fixture;
/** La personne de `a` dont le métier pointe, par forgeage, un métier de `b`. */
let forgedJobPersonId: string;

async function seedDomain(label: string): Promise<Fixture> {
  const domain = await superAdmin.createDomain({
    name: `__test__team__${label}__${suffix}`,
    competenceCenterName: `Centre ${label}`,
  });
  const scope = forDomain({ domainId: domain.id });

  const job = await scope.insert(jobs, { label: `Product Design ${label}` });

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
    availability: "available",
  });
  await scope.archive(persons, yves.id);
  const damien = await scope.insert(persons, {
    fullName: `Damien Sonde ${label}`,
    source: "manual",
    kind: "center",
    jobId: job.id,
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

  return {
    domainId: domain.id,
    scope,
    aliceId: alice.id,
    brunoId: bruno.id,
    zoeId: zoe.id,
    yvesId: yves.id,
    damienId: damien.id,
    jobId: job.id,
    advancedLevelId: advanced.id,
    expertLevelId: expert.id,
    probeLinkSkillId: probeLink.id,
    probeSkillId: probeSkill.id,
    probeLevelSkillId: probeLevel.id,
  };
}

/**
 * Les quatre lignes que la couche scopée refuserait d'écrire.
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
  ]);

  // (4) Une personne de `a` dont le métier est celui de `b`. Seul `filter(jobs)`
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
}

beforeAll(async () => {
  a = await seedDomain("a");
  b = await seedDomain("b");
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
    expect(rankOf(rows, a.brunoId)).toBeLessThan(rankOf(rows, a.damienId));
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
      "Prototypage a",
    ]);
    expect(alice?.skills.map((skill) => skill.levelLabel)).toEqual([
      "Expert a",
      "Expert a",
      "Avancé a",
    ]);
    expect(alice?.skills.map((skill) => skill.levelRank)).toEqual([4, 4, 3]);
  });

  test("une personne sans compétence en rend une liste vide", async () => {
    const rows = await listTeam(a.scope);
    expect(rows.find((row) => row.id === a.brunoId)?.skills).toEqual([]);
  });
});

/* ==========================================================================
   L'étanchéité — un test par `filter()`

   Chacun de ces cinq tests tombe quand on retire *son* filtre, et lui seul.
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
});
