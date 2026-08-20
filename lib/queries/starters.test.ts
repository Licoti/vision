/**
 * Les tests de la lecture des pistes de démarrage.
 *
 * Ils tournent sur la branche Neon dédiée — `vitest.config.mts` remappe
 * `DATABASE_URL` sur `TEST_DATABASE_URL` — et écrivent réellement : un ordre de
 * référentiel et l'étanchéité d'un domaine ne se vérifient pas sur un faux.
 *
 * **Deux domaines, amorcés différemment**, et c'est la leçon de T5bis.5 : deux
 * domaines nourris à l'identique rendent une fuite indiscernable. Le domaine
 * `a` porte six pistes vivantes, le domaine `b` en porte deux, aux libellés et
 * aux rangs différents — un décompte suffit alors à dire qu'une ligne a
 * traversé.
 *
 * **Une ligne est forgée par le client brut**, et c'est délibéré : la couche
 * scopée la refuserait par `assertPreconditions`, or c'est précisément à cela
 * qu'une fuite ressemblerait. Une piste du domaine `a` pointe l'outil du
 * domaine `b`, et elle ne franchit la frontière que sur cette clé étrangère —
 * tout le reste lui appartient. Sans elle, **le filtre de domaine posé sur
 * `tools` dans la jointure ne serait éprouvé par rien** : la leçon de T5bis.3,
 * resservie.
 *
 * Les constats se lisent par identifiant et non par position — sauf les deux
 * tests d'ordre, qui comparent des rangs relatifs.
 */

import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { db } from "@/lib/db/client";
import { forDomain, superAdmin, type ScopedDb } from "@/lib/db/scoped";
import { domains, starters, tools } from "@/lib/db/schema";

import { findStarter, listStarters, type DomainStarter } from "./starters";

/** Enfants d'abord, parents ensuite : `tools` refuse la suppression sinon. */
const teardownOrder = [starters, tools];

type Fixture = {
  domainId: string;
  scope: ScopedDb;
  /** Vivant, avec adresse : le seul qui donne un lien. */
  toolId: string;
  /** Archivé : la piste se lit encore, sans lien. */
  archivedToolId: string;
  /** Vivant, sans `base_url` : la piste se lit, elle ne mène nulle part. */
  urllessToolId: string;
  /** Rang 1, nommé en fin d'alphabet : l'ordre n'est pas le nom. */
  headId: string;
  /** Rang 2, nommé en début d'alphabet. Aucune plateforme, aucun texte long. */
  methodId: string;
  /** Rang 3 : son outil est archivé. */
  archivedToolStarterId: string;
  /** Rang 4 : son outil n'a pas d'adresse. */
  urllessStarterId: string;
  /** Rang 5, ex æquo, nommé en second dans l'alphabet. */
  bravoId: string;
  /** Rang 5, ex æquo, nommé en premier dans l'alphabet. */
  anoukId: string;
  /** Archivée : absente du bloc. */
  archivedId: string;
};

const suffix = Math.random().toString(36).slice(2, 10);
let a: Fixture;
let b: Fixture;
/** La piste du domaine `a` dont l'outil appartient au domaine `b`. */
let forgedId: string;

async function seedDomain(label: string, extra: number): Promise<Fixture> {
  const domain = await superAdmin.createDomain({
    name: `__test__starters__${label}__${suffix}`,
    competenceCenterName: `Centre ${label}`,
  });
  const scope = forDomain({ domainId: domain.id });

  const tool = await scope.insert(tools, {
    name: `Ergonome ${label}`,
    kind: "audit",
    baseUrl: `https://ergonome-${label}.example.com`,
  });
  const archivedTool = await scope.insert(tools, {
    name: `Plateforme rangée ${label}`,
    kind: "audit",
    baseUrl: `https://rangee-${label}.example.com`,
  });
  await scope.archive(tools, archivedTool.id);
  const urllessTool = await scope.insert(tools, {
    name: `Sans adresse ${label}`,
    kind: "other",
  });

  /* Les rangs vont à rebours de l'alphabet : si la lecture triait par libellé,
     la première déclarée ne serait pas la première rendue, et le test d'ordre
     le dirait. */
  const head = await scope.insert(starters, {
    label: `Zed — rang 1 ${label}`,
    kind: "tool",
    summary: "La piste de tête.",
    guidance: "Le texte long que le panneau sert.",
    position: "1",
    toolId: tool.id,
  });
  const method = await scope.insert(starters, {
    label: `Alpha — rang 2 ${label}`,
    kind: "method",
    summary: "Une manière de faire, sans plateforme derrière.",
    position: "2",
  });
  const archivedToolStarter = await scope.insert(starters, {
    label: `Outil rangé ${label}`,
    kind: "tool",
    summary: "Sa plateforme a été archivée.",
    position: "3",
    toolId: archivedTool.id,
  });
  const urllessStarter = await scope.insert(starters, {
    label: `Adresse absente ${label}`,
    kind: "tool",
    summary: "Sa plateforme n'a pas encore d'adresse.",
    position: "4",
    toolId: urllessTool.id,
  });
  /* Deux ex æquo : sans eux, neutraliser le second critère de tri ne ferait
     tomber aucun test, et `asc(label)` ne serait pas éprouvé. */
  const bravo = await scope.insert(starters, {
    label: `Bravo — ex æquo ${label}`,
    kind: "resource",
    summary: "Deuxième dans l'alphabet.",
    position: "5",
  });
  const anouk = await scope.insert(starters, {
    label: `Anouk — ex æquo ${label}`,
    kind: "resource",
    summary: "Première dans l'alphabet.",
    position: "5",
  });
  const archived = await scope.insert(starters, {
    label: `Rangée ${label}`,
    kind: "tool",
    summary: "Elle a quitté le bloc.",
    position: "6",
    toolId: tool.id,
  });
  await scope.archive(starters, archived.id);

  /* Le second domaine reçoit **moins** de pistes que le premier : c'est ce
     décalage qui rend une fuite lisible à un décompte. */
  for (let index = 0; index < extra; index += 1) {
    await scope.insert(starters, {
      label: `Voisine ${index} ${label}`,
      kind: "method",
      summary: "Une piste du domaine voisin.",
      position: String(10 + index),
    });
  }

  return {
    domainId: domain.id,
    scope,
    toolId: tool.id,
    archivedToolId: archivedTool.id,
    urllessToolId: urllessTool.id,
    headId: head.id,
    methodId: method.id,
    archivedToolStarterId: archivedToolStarter.id,
    urllessStarterId: urllessStarter.id,
    bravoId: bravo.id,
    anoukId: anouk.id,
    archivedId: archived.id,
  };
}

/**
 * La ligne que la couche scopée refuserait d'écrire.
 *
 * Elle appartient au domaine `a` et pointe un outil du domaine `b` : c'est la
 * seule clé par laquelle elle franchit la frontière. Sans elle, retirer
 * `filter(tools)` du `on` de la jointure ne ferait tomber aucun test, et la
 * fuite — le nom **et l'adresse** d'une plateforme d'un autre domaine servis
 * dans le bloc — passerait inaperçue.
 */
async function forgeLeak(): Promise<void> {
  const [row] = await db
    .insert(starters)
    .values({
      domainId: a.domainId,
      toolId: b.toolId,
      label: `Fuite outil ${suffix}`,
      kind: "tool",
      summary: "Une piste du domaine observé, pointant l'outil du voisin.",
      position: "7",
    })
    .returning();
  forgedId = row!.id;
}

beforeAll(async () => {
  a = await seedDomain("a", 0);
  b = await seedDomain("b", 2);
  await forgeLeak();
}, 120_000);

afterAll(async () => {
  const ids = [a?.domainId, b?.domainId].filter(Boolean) as string[];
  if (ids.length === 0) return;
  for (const table of teardownOrder) {
    await db.delete(table).where(inArray(table.domainId, ids));
  }
  await db.delete(domains).where(inArray(domains.id, ids));
});

/** Le rang d'une ligne dans la liste rendue. */
function rankOf(rows: { id: string }[], id: string): number {
  return rows.findIndex((row) => row.id === id);
}

function byId(rows: DomainStarter[], id: string): DomainStarter {
  const row = rows.find((candidate) => candidate.id === id);
  if (!row) throw new Error(`Piste ${id} absente de la liste.`);
  return row;
}

/* ==========================================================================
   La liste du bloc
   ========================================================================== */

describe("listStarters", () => {
  test("rend les pistes vivantes du domaine, et elles seules", async () => {
    const rows = await listStarters(a.scope);
    const ids = rows.map((row) => row.id);

    expect(ids).toEqual(
      expect.arrayContaining([
        a.headId,
        a.methodId,
        a.archivedToolStarterId,
        a.urllessStarterId,
        a.bravoId,
        a.anoukId,
        forgedId,
      ]),
    );
    expect(rows).toHaveLength(7);
  });

  test("écarte une piste archivée", async () => {
    const rows = await listStarters(a.scope);
    expect(rows.map((row) => row.id)).not.toContain(a.archivedId);
  });

  test("ne voit aucune piste de l'autre domaine", async () => {
    const rows = await listStarters(a.scope);
    const ids = rows.map((row) => row.id);

    expect(ids).not.toContain(b.headId);
    expect(ids).not.toContain(b.methodId);
    expect(ids).not.toContain(b.anoukId);
  });

  test("le domaine voisin ne voit aucune piste du premier", async () => {
    const rows = await listStarters(b.scope);
    const ids = rows.map((row) => row.id);

    /* L'énoncé porte sur **toutes** les pistes de `a`, y compris la ligne
       forgée : elle appartient à `a`, donc `b` ne doit pas la voir. */
    expect(ids).not.toContain(a.headId);
    expect(ids).not.toContain(forgedId);
    expect(rows).toHaveLength(8);
  });

  test("ordonne par rang, jamais par libellé", async () => {
    const rows = await listStarters(a.scope);
    /* « Zed » est déclarée au rang 1, « Alpha » au rang 2 : un tri par libellé
       les inverserait. */
    expect(rankOf(rows, a.headId)).toBeLessThan(rankOf(rows, a.methodId));
  });

  test("départage deux rangs égaux par le libellé", async () => {
    const rows = await listStarters(a.scope);
    expect(rankOf(rows, a.anoukId)).toBeLessThan(rankOf(rows, a.bravoId));
  });
});

/* ==========================================================================
   Le lien vers la plateforme
   ========================================================================== */

describe("listStarters — la plateforme", () => {
  test("rend le nom et l'adresse de l'outil raccordé", async () => {
    const rows = await listStarters(a.scope);
    const head = byId(rows, a.headId);

    expect(head.toolName).toBe("Ergonome a");
    expect(head.toolUrl).toBe("https://ergonome-a.example.com");
  });

  test("une piste sans outil n'a ni nom ni adresse", async () => {
    const rows = await listStarters(a.scope);
    const method = byId(rows, a.methodId);

    expect(method.toolName).toBeNull();
    expect(method.toolUrl).toBeNull();
    /* Elle reste une piste : son texte est intact, et son texte long est nul,
       l'état que le panneau doit savoir rendre. */
    expect(method.summary).not.toHaveLength(0);
    expect(method.guidance).toBeNull();
  });

  test("un outil archivé ne se propose plus : la piste reste, le lien tombe", async () => {
    const rows = await listStarters(a.scope);
    const starter = byId(rows, a.archivedToolStarterId);

    expect(starter.toolName).toBeNull();
    expect(starter.toolUrl).toBeNull();
  });

  test("un outil sans adresse rend son nom, et aucun lien", async () => {
    const rows = await listStarters(a.scope);
    const starter = byId(rows, a.urllessStarterId);

    expect(starter.toolName).toBe("Sans adresse a");
    expect(starter.toolUrl).toBeNull();
  });

  test("l'outil d'un autre domaine ne se nomme pas", async () => {
    const rows = await listStarters(a.scope);
    const forged = byId(rows, forgedId);

    /* La piste se lit — elle appartient au domaine — mais le nom et l'adresse
       de la plateforme du voisin ne traversent pas. */
    expect(forged.toolName).toBeNull();
    expect(forged.toolUrl).toBeNull();
  });
});

/* ==========================================================================
   Le rapprochement du panneau
   ========================================================================== */

describe("findStarter", () => {
  test("retrouve la piste demandée dans la liste vivante", async () => {
    const rows = await listStarters(a.scope);
    expect(findStarter(rows, a.headId)?.id).toBe(a.headId);
  });

  test("ne retrouve pas une piste archivée : elle n'est pas dans la liste", async () => {
    const rows = await listStarters(a.scope);
    expect(findStarter(rows, a.archivedId)).toBeUndefined();
  });

  test("ne retrouve pas une piste d'un autre domaine", async () => {
    const rows = await listStarters(a.scope);
    expect(findStarter(rows, b.headId)).toBeUndefined();
  });
});
