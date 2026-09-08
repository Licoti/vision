/**
 * L'amorçage d'un domaine neuf, mesuré **en base** — T9.5.
 *
 * **Le ticket ne rend aucun écran, et son critère est un décompte.** C'est la
 * même dérogation au premier point du protocole que T9.1 et T9.3 : il n'y a
 * rien à lire dans un HTML servi, il y a des lignes à compter.
 *
 * **Les constats se font par le client brut**, comme dans `scoped.test.ts` et
 * pour la même raison : observer un amorçage à travers la portée qu'il utilise
 * ne prouverait pas qu'il a écrit dans le bon domaine. Ici la portée est même
 * l'objet du test — l'étanchéité de deux domaines amorcés côte à côte.
 */

import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import {
  ACTIVITY_TYPES,
  APPROACHES,
  JOBS,
  SKILLS,
  SKILL_LEVELS,
  STARTERS,
  STATUSES,
  TOOLS,
  bootstrapReferentials,
} from "./bootstrap";
import { db } from "./client";
import { createReconciler } from "./reconcile";
import {
  activityTypes,
  approaches,
  domains,
  entities,
  jobs,
  projectStatuses,
  skillLevels,
  skills,
  starters,
  tools,
} from "./schema";
import { asSuperAdmin, forDomain, withoutAnySession } from "./scoped";

const outsideAnySession = asSuperAdmin(withoutAnySession("fixture"));

const suffix = Math.random().toString(36).slice(2, 10);

/**
 * Le décompte attendu, **écrit à côté de sa source**.
 *
 * Les huit longueurs sont lues sur les constantes du module : une ligne retirée
 * de `bootstrap.ts` ne fait donc pas passer ce fichier en silence — elle fait
 * tomber `total`, que le chemin de l'écran compare à un nombre écrit en clair
 * dans `app/domaines/actions.test.ts`.
 */
const EXPECTED = {
  jobs: JOBS.length,
  skills: SKILLS.length,
  skill_levels: SKILL_LEVELS.length,
  approaches: APPROACHES.length,
  project_statuses: STATUSES.length,
  tools: TOOLS.length,
  activity_types: ACTIVITY_TYPES.length,
  starters: STARTERS.length,
};

const TABLES = {
  jobs,
  skills,
  skill_levels: skillLevels,
  approaches,
  project_statuses: projectStatuses,
  tools,
  activity_types: activityTypes,
  starters,
};

/** L'ordre d'effacement : ce qui pointe part avant ce qui est pointé. */
const teardownOrder = [
  starters,
  activityTypes,
  tools,
  projectStatuses,
  approaches,
  skillLevels,
  skills,
  jobs,
  entities,
];

const created: string[] = [];

async function newDomain(label: string): Promise<string> {
  const domain = await outsideAnySession.createDomain({
    name: `__test__bootstrap__${label}__${suffix}`,
    competenceCenterName: `Centre ${label}`,
  });
  created.push(domain.id);
  return domain.id;
}

/** Ce que porte un domaine, table par table, lu par le client brut. */
async function countAll(
  domainId: string,
): Promise<Record<keyof typeof TABLES, number>> {
  const counts = {} as Record<keyof typeof TABLES, number>;
  for (const [name, table] of Object.entries(TABLES)) {
    const rows = await db
      .select({ id: table.id })
      .from(table)
      .where(inArray(table.domainId, [domainId]));
    counts[name as keyof typeof TABLES] = rows.length;
  }
  return counts;
}

let first: string;

beforeAll(async () => {
  first = await newDomain("premier");
  await bootstrapReferentials(
    forDomain({ domainId: first }),
    createReconciler(),
  );
});

afterAll(async () => {
  if (created.length === 0) return;
  for (const table of teardownOrder) {
    await db.delete(table).where(inArray(table.domainId, created));
  }
  await db.delete(domains).where(inArray(domains.id, created));
});

/* ==========================================================================
   Le décompte
   ========================================================================== */

describe("les huit référentiels d'un domaine neuf", () => {
  test("chacun porte exactement ce que le module déclare", async () => {
    expect(await countAll(first)).toEqual(EXPECTED);
  });

  test("le total est de soixante-huit lignes", async () => {
    const counts = await countAll(first);
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
    expect(total).toBe(68);
  });

  /**
   * **Le neuvième référentiel n'est pas amorcé, et c'est l'arbitrage de T9.5.**
   * Les entités sont les divisions de l'entreprise : les semer serait inventer
   * son organigramme. L'écran qui les attend porte déjà son état vide.
   */
  test("aucune entité — elles appartiennent à l'entreprise, pas au référentiel", async () => {
    const rows = await db
      .select({ id: entities.id })
      .from(entities)
      .where(inArray(entities.domainId, [first]));
    expect(rows).toHaveLength(0);
  });
});

/* ==========================================================================
   Ce que l'amorçage rattache
   ========================================================================== */

describe("les rattachements résolus par l'index", () => {
  test("« Audit UX » porte Ergonome en outil par défaut", async () => {
    const rows = await db
      .select({ label: activityTypes.label, toolId: activityTypes.defaultToolId })
      .from(activityTypes)
      .where(inArray(activityTypes.domainId, [first]));

    const ergonome = await db
      .select({ id: tools.id, name: tools.name })
      .from(tools)
      .where(inArray(tools.domainId, [first]));

    const audit = rows.find((row) => row.label === "Audit UX");
    const outil = ergonome.find((row) => row.name === "Ergonome");
    expect(audit?.toolId).toBe(outil?.id);
  });

  test("la piste « Audit d'accessibilité » porte Everyone, et la méthode n'a aucun outil", async () => {
    const pistes = await db
      .select({ label: starters.label, kind: starters.kind, toolId: starters.toolId })
      .from(starters)
      .where(inArray(starters.domainId, [first]));

    const everyone = await db
      .select({ id: tools.id, name: tools.name })
      .from(tools)
      .where(inArray(tools.domainId, [first]));

    const piste = pistes.find((row) => row.label === "Audit d'accessibilité");
    expect(piste?.toolId).toBe(everyone.find((row) => row.name === "Everyone")?.id);

    const methode = pistes.find((row) => row.label === "Entretiens utilisateurs");
    expect(methode?.kind).toBe("method");
    expect(methode?.toolId).toBeNull();
  });
});

/* ==========================================================================
   Les adresses d'outil
   ========================================================================== */

describe("les outils naissent sans adresse", () => {
  test("aucune `base_url` par défaut", async () => {
    const rows = await db
      .select({ name: tools.name, baseUrl: tools.baseUrl })
      .from(tools)
      .where(inArray(tools.domainId, [first]));

    expect(rows).toHaveLength(TOOLS.length);
    expect(rows.every((row) => row.baseUrl === null)).toBe(true);
  });

  /** L'option, et elle seule, pose une adresse — c'est ce que fait le script. */
  test("`toolBaseUrls` les pose, sans toucher aux autres", async () => {
    const domainId = await newDomain("adresses");
    await bootstrapReferentials(
      forDomain({ domainId }),
      createReconciler(),
      { toolBaseUrls: { Ergonome: "https://ergonome.example.com" } },
    );

    const rows = await db
      .select({ name: tools.name, baseUrl: tools.baseUrl })
      .from(tools)
      .where(inArray(tools.domainId, [domainId]));

    expect(rows.find((row) => row.name === "Ergonome")?.baseUrl).toBe(
      "https://ergonome.example.com",
    );
    expect(rows.filter((row) => row.baseUrl === null)).toHaveLength(
      TOOLS.length - 1,
    );
  });
});

/* ==========================================================================
   Rejouable
   ========================================================================== */

describe("un second amorçage ne double rien", () => {
  test("les décomptes ne bougent pas, et le compte rendu ne dit qu'« inchangé »", async () => {
    const before = await countAll(first);

    const reconciler = createReconciler();
    await bootstrapReferentials(forDomain({ domainId: first }), reconciler);

    expect(await countAll(first)).toEqual(before);

    /* **Le décompte de lignes ne suffit pas** : un amorçage qui réécrirait
       chaque ligne à chaque passage rendrait les mêmes chiffres. Le compte
       rendu tranche — rien de créé, rien de mis à jour, rien de renommé. */
    for (const tally of reconciler.tallies.values()) {
      expect(tally.created).toBe(0);
      expect(tally.updated).toBe(0);
      expect(tally.renamed).toBe(0);
    }
    expect(reconciler.renames).toEqual([]);
  });
});

/* ==========================================================================
   L'étanchéité
   ========================================================================== */

describe("deux domaines amorcés côte à côte", () => {
  test("le second porte les siennes, et le premier n'en gagne aucune", async () => {
    const before = await countAll(first);

    const second = await newDomain("second");
    await bootstrapReferentials(
      forDomain({ domainId: second }),
      createReconciler(),
    );

    expect(await countAll(second)).toEqual(EXPECTED);
    expect(await countAll(first)).toEqual(before);
  });
});
