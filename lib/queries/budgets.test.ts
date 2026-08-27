/**
 * Les tests de la lecture du budget d'un accompagnement.
 *
 * Ils tournent sur la branche Neon dédiée — `vitest.config.mts` remappe
 * `DATABASE_URL` sur `TEST_DATABASE_URL` — et écrivent réellement : un
 * `leftJoin` filtré sur le domaine ne se vérifie pas sur un faux.
 *
 * Deux domaines sont amorcés, comme dans `resources.test.ts` : sans un second
 * domaine, aucun test d'étanchéité ne prouve quoi que ce soit. Les écritures de
 * fixture passent par la couche scopée ; les constats passent par la fonction
 * sous test, qui est précisément ce que l'écran appelle.
 *
 * **Le cas qui porte le fichier est le dernier**, et il s'écrit hors de la
 * couche scopée : `filter(tools)` est le **seul** filtre de jointure de ce
 * module, et aucune ligne honnête ne peut le mettre en défaut — la couche
 * refuse d'écrire un budget qui pointerait l'outil d'un autre domaine. Sans une
 * ligne forgée, ce filtre est **infalsifiable**, et un filtre qu'aucune ligne
 * ne vise n'est pas éprouvé.
 */

import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { db } from "@/lib/db/client";
import { forDomain, superAdmin, type ScopedDb } from "@/lib/db/scoped";
import {
  budgets,
  domains,
  entities,
  products,
  projectStatuses,
  projects,
  tools,
} from "@/lib/db/schema";

import { findProjectBudget } from "./budgets";

/** Enfants d'abord, parents ensuite : `domains` refuse la suppression sinon. */
const teardownOrder = [
  budgets,
  projects,
  products,
  tools,
  projectStatuses,
  entities,
];

type Fixture = {
  domainId: string;
  scope: ScopedDb;
  /** Le projet qui porte un budget complet, outil et lien profond compris. */
  fullId: string;
  /** Un projet dont le budget ne porte aucune valeur : cinq colonnes nulles. */
  bareId: string;
  /** Un projet sans aucune ligne de budget : la lecture doit rendre `null`. */
  emptyId: string;
  /** Un second projet peuplé : son budget ne doit pas déborder sur le premier. */
  otherId: string;
  /** Le projet dont le budget pointe un outil **archivé depuis**. */
  archivedToolId: string;
  /** L'outil « Gestion » du domaine — la cible des liaisons forgées. */
  toolId: string;
  toolName: string;
};

const suffix = Math.random().toString(36).slice(2, 10);
let a: Fixture;
let b: Fixture;

/**
 * Cinq projets, deux outils — un vivant, un archivé — et quatre budgets
 * couvrant les formes de la lecture plus le débordement.
 */
async function seedDomain(label: string): Promise<Fixture> {
  const domain = await superAdmin.createDomain({
    name: `__test__budgets__${label}__${suffix}`,
    competenceCenterName: `Centre ${label}`,
  });
  const scope = forDomain({ domainId: domain.id });

  const entity = await scope.insert(entities, { label: `Entité ${label}` });
  const active = await scope.insert(projectStatuses, {
    label: "En cours",
    nature: "active",
  });
  const product = await scope.insert(products, {
    name: `Produit ${label}`,
    entityId: entity.id,
  });

  const project = async (name: string) =>
    scope.insert(projects, {
      name: `${name} ${label}`,
      productId: product.id,
      statusId: active.id,
    });

  const full = await project("Complet");
  const bare = await project("Nu");
  const empty = await project("Sans budget");
  const other = await project("Voisin");
  const onArchivedTool = await project("Outil rangé");

  const tool = await scope.insert(tools, {
    name: `Gestion ${label}`,
    kind: "budget",
    baseUrl: "https://gestion.example.com",
  });

  /* Un outil archivé : son nom doit continuer de s'afficher sur le budget qui
     le pointe — on décrit, on ne propose pas. C'est ce qui sépare la lecture du
     panneau, où l'archivé est écarté sauf exception nominative. */
  const retired = await scope.insert(tools, {
    name: `Ancien portail ${label}`,
    kind: "budget",
  });
  await scope.archive(tools, retired.id);

  await scope.insert(budgets, {
    projectId: full.id,
    allocated: "120",
    consumed: "87.5",
    measuredOn: "2026-08-31",
    toolId: tool.id,
    externalUrl: `https://gestion.example.com/${label}/budget`,
  });

  // Les cinq colonnes de valeur nulles : le cas d'un budget vidé, seul chemin
  // de rattrapage d'une saisie erronée (arbitrage (c)).
  await scope.insert(budgets, { projectId: bare.id });

  await scope.insert(budgets, {
    projectId: other.id,
    allocated: "40",
  });

  await scope.insert(budgets, {
    projectId: onArchivedTool.id,
    allocated: "10",
    toolId: retired.id,
  });

  return {
    domainId: domain.id,
    scope,
    fullId: full.id,
    bareId: bare.id,
    emptyId: empty.id,
    otherId: other.id,
    archivedToolId: onArchivedTool.id,
    toolId: tool.id,
    toolName: tool.name,
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
   Ce que la lecture porte
   ========================================================================== */

describe("findProjectBudget — les champs", () => {
  test("un budget complet porte ses montants, son unité, sa date et son outil", async () => {
    const budget = await findProjectBudget(a.scope, a.fullId);

    expect(budget).toMatchObject({
      // `numeric(18,4)` : le pilote rend des chaînes, jamais des nombres.
      allocated: "120.0000",
      consumed: "87.5000",
      unit: "days",
      measuredOn: "2026-08-31",
      toolId: a.toolId,
      toolName: a.toolName,
      externalUrl: "https://gestion.example.com/a/budget",
    });
  });

  test("un budget sans outil sort quand même, le nom à `null`", async () => {
    // Le `leftJoin` est là pour lui : une jointure interne le ferait disparaître
    // de la lecture au lieu de le rendre sans outil.
    const budget = await findProjectBudget(a.scope, a.otherId);

    expect(budget).not.toBeNull();
    expect(budget?.allocated).toBe("40.0000");
    expect(budget?.toolId).toBeNull();
    expect(budget?.toolName).toBeNull();
  });

  test("le nom d'un outil archivé s'affiche encore", async () => {
    /* L'inverse de ce que fait le panneau, et la distinction est celle de
       `listProjectResources` : on décrit, on ne propose pas. Un outil rangé
       reste l'outil qui a produit ce relevé. */
    const budget = await findProjectBudget(a.scope, a.archivedToolId);

    expect(budget?.toolName).toBe(`Ancien portail a`);
  });

  test("une ligne dont les cinq colonnes sont nulles se lit quand même", async () => {
    /* C'est ce que rend un budget vidé — le seul rattrapage d'une saisie
       erronée. La ligne existe, l'écran dira « Non renseigné » : ce n'est pas
       la même chose qu'un projet sans budget, qui n'a aucune ligne. */
    const budget = await findProjectBudget(a.scope, a.bareId);

    expect(budget).not.toBeNull();
    expect(budget).toMatchObject({
      allocated: null,
      consumed: null,
      measuredOn: null,
      toolId: null,
      toolName: null,
      externalUrl: null,
      // `not null` avec un défaut : elle n'est jamais absente.
      unit: "days",
    });
  });
});

/* ==========================================================================
   Ce que la lecture écarte
   ========================================================================== */

describe("findProjectBudget — le périmètre", () => {
  test("un projet sans budget rend `null`, jamais une erreur", async () => {
    // Règle 5 : l'état vide appartient à l'écran, pas à la lecture.
    expect(await findProjectBudget(a.scope, a.emptyId)).toBeNull();
  });

  test("le budget d'un autre projet du même domaine ne déborde pas", async () => {
    const budget = await findProjectBudget(a.scope, a.fullId);

    expect(budget?.allocated).toBe("120.0000");
    expect((await findProjectBudget(a.scope, a.otherId))?.allocated).toBe(
      "40.0000",
    );
  });
});

/* ==========================================================================
   L'étanchéité
   ========================================================================== */

describe("findProjectBudget — étanchéité du domaine", () => {
  test("le budget d'un projet d'un autre domaine ne se lit pas", async () => {
    expect(await findProjectBudget(b.scope, a.fullId)).toBeNull();
  });

  test("chaque domaine ne lit que son propre outil", async () => {
    const budget = await findProjectBudget(b.scope, b.fullId);

    expect(budget).not.toBeNull();
    expect(budget?.toolName).toBe(b.toolName);
    expect(budget?.toolName).not.toBe(a.toolName);
  });

  /* ------------------------------------------------------------------------
     Le filtre de jointure — éprouvé sur une liaison **forgée**.

     `filter(tools)` est le seul filtre de jointure de ce module, et **rien ne
     le rattrape** : à la différence de `listProjectResources`, où deux
     jointures se couvraient l'une l'autre, il n'y a ici qu'une table jointe.
     Le retirer ne fait pourtant tomber aucun test écrit à partir de données
     légitimes, et pour une raison de fond — la jointure porte sur une **clé
     primaire**, et `assertPreconditions` refuse déjà d'écrire un `tool_id` hors
     domaine. Aucune ligne honnête ne peut faire mentir la jointure.

     Le test ci-dessous écrit donc directement par `db`, hors de la couche
     scopée, exactement ce qu'elle interdit — et il le fait pour prouver que la
     lecture tient quand même. Retirer `filter(tools)` fait tomber ce seul cas,
     et rien d'autre.
     ---------------------------------------------------------------------- */

  test("un budget pointant l'outil d'un autre domaine ne rend aucun nom", async () => {
    const [forged] = await db
      .insert(budgets)
      .values({
        domainId: b.domainId,
        projectId: b.emptyId,
        allocated: "999",
        // La liaison interdite : un outil du domaine `a`.
        toolId: a.toolId,
      })
      .returning();

    const budget = await findProjectBudget(b.scope, b.emptyId);

    // Il se lit — il est bien du domaine `b` — mais son rattachement ne rend
    // rien : `filter(tools)` coupe la jointure.
    expect(budget?.id).toBe(forged?.id);
    expect(budget?.allocated).toBe("999.0000");
    expect(budget?.toolId).toBe(a.toolId);
    expect(budget?.toolName).toBeNull();
    expect(budget?.toolName).not.toBe(a.toolName);
  });
});
