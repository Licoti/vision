/**
 * Les tests de `listProjectJournal` — la première lecture d'`events`.
 *
 * Ils tournent sur la branche Neon dédiée — `vitest.config.mts` remappe
 * `DATABASE_URL` sur `TEST_DATABASE_URL` — et écrivent réellement : un tri par
 * horodatage, un `leftJoin` filtré sur le domaine et trois filtres d'étanchéité
 * ne se vérifient pas sur un faux.
 *
 * Deux domaines sont amorcés, comme dans `lib/db/scoped.test.ts` : sans un
 * second domaine, aucun test d'étanchéité ne prouve quoi que ce soit.
 *
 * **Les événements légitimes s'écrivent par le vrai `scope.record()`**, jamais
 * par le client brut : une lecture doit lire ce que l'écriture écrit, et un
 * insert forgé ferait passer le test le jour où `record` changerait de forme.
 * C'est aussi ce qui donne gratuitement le cas de l'acteur nul — un scope sans
 * `actorId` en pose un (`scoped.ts`), sans qu'aucune ligne se forge.
 *
 * **Les instants sont ensuite forcés distincts par le client brut**, et c'est
 * une nécessité de mesure, pas un raccourci : `occurred_at` n'est pas dans
 * `JournalEntry` — la couche le pose par `defaultNow()` — et deux `record()`
 * voisins peuvent partager la microseconde. Le tri se validerait alors sur des
 * horodatages égaux, c'est-à-dire sur rien.
 *
 * **Trois lignes sont forgées par le client brut**, et c'est délibéré : la
 * couche scopée les refuserait par `assertPreconditions`, or c'est précisément à
 * cela qu'une fuite ressemblerait. Chacune ne franchit la frontière que sur
 * **une seule** colonne — leçon de T5bis.2 —, ce qui rend la mise en défaut
 * concluante filtre par filtre : c'est la condition pour qu'un `filter()` retiré
 * fasse tomber **un** test et pas trois (leçon de T5bis.3).
 *
 * Les constats se lisent par identifiant, jamais par position — sauf le test du
 * tri, qui compare des rangs relatifs. Un défaut d'ordre ne doit pas faire
 * tomber les autres.
 */

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { db } from "@/lib/db/client";
import { forDomain, superAdmin, type ScopedDb } from "@/lib/db/scoped";
import {
  domains,
  entities,
  events,
  persons,
  products,
  projectStatuses,
  projects,
} from "@/lib/db/schema";

import { listProjectJournal } from "./journal";

/** Enfants d'abord, parents ensuite : `domains` refuse la suppression sinon. */
const teardownOrder = [
  events,
  projects,
  products,
  entities,
  projectStatuses,
  persons,
];

type Fixture = {
  domainId: string;
  /** Le scope de l'écriture : il porte un acteur, comme une action réelle. */
  scope: ScopedDb;
  /** Le même domaine, **sans acteur** : c'est lui qui pose `actor_id` nul. */
  anonymous: ScopedDb;
  /** Le projet dont on lit le journal. */
  projectId: string;
  /** Un second projet du même domaine : son journal ne doit pas déborder. */
  otherProjectId: string;
  /** L'acteur des événements légitimes. */
  aliceId: string;
};

const suffix = Math.random().toString(36).slice(2, 10);
let a: Fixture;
let b: Fixture;
/**
 * Un troisième domaine, et il n'a qu'un emploi : **aucun événement n'y est
 * écrit**, ni légitime ni forgé.
 *
 * Sans lui, l'état vide se lisait sur un projet de `b` — un domaine qui porte
 * une ligne forgée —, si bien que retirer `eq(events.projectId, …)` faisait
 * tomber **deux** tests au lieu d'un : l'étanchéité de projet et l'état vide.
 * Une chute non isolée ne désigne plus le filtre qu'elle éprouve. Mesuré le
 * 27/08/2026.
 */
let c: Fixture;

/* Les trois lignes forgées, nommées par le filtre qu'elles éprouvent. */
let leakedDomainEventId: string;
let leakedActorEventId: string;
let otherProjectEventId: string;

/* Les événements légitimes de `a`, du plus ancien au plus récent. */
let oldestId: string;
let middleId: string;
let newestId: string;

async function seedDomain(label: string): Promise<Fixture> {
  const domain = await superAdmin.createDomain({
    name: `__test__journal__${label}__${suffix}`,
    competenceCenterName: `Centre ${label}`,
  });

  const bootstrap = forDomain({ domainId: domain.id });

  const alice = await bootstrap.insert(persons, {
    fullName: `Alice Martin ${label}`,
    source: "manual",
    kind: "center",
  });

  /* Le scope d'écriture porte son acteur, comme le fait `requireSession` :
     c'est lui qui pose `actor_id`, jamais l'appelant de `record`. */
  const scope = forDomain({ domainId: domain.id, actorId: alice.id });

  const entity = await scope.insert(entities, { label: `Entité ${label}` });
  const product = await scope.insert(products, {
    name: `Produit ${label}`,
    entityId: entity.id,
  });
  const status = await scope.insert(projectStatuses, {
    label: `En cours ${label}`,
    nature: "active",
    position: "1",
  });

  const project = await scope.insert(projects, {
    name: `Refonte ${label}`,
    productId: product.id,
    statusId: status.id,
  });
  const other = await scope.insert(projects, {
    name: `Audit ${label}`,
    productId: product.id,
    statusId: status.id,
  });

  return {
    domainId: domain.id,
    scope,
    anonymous: bootstrap,
    projectId: project.id,
    otherProjectId: other.id,
    aliceId: alice.id,
  };
}

/**
 * Force l'instant d'un événement, pour que le tri ait quelque chose à trier.
 *
 * Le client brut, parce que `update` de la couche scopée refuse `occurredAt`
 * autant qu'`insert` : la colonne n'est pas dans `JournalEntry`, et c'est juste
 * — un geste ne choisit pas quand il a eu lieu. Le test, lui, doit le choisir.
 */
async function occurAt(eventId: string, iso: string): Promise<void> {
  await db
    .update(events)
    .set({ occurredAt: new Date(iso) })
    .where(eq(events.id, eventId));
}

beforeAll(async () => {
  a = await seedDomain("a");
  b = await seedDomain("b");
  c = await seedDomain("c");

  /* ----- Les événements légitimes, par le vrai chemin d'écriture. ----- */

  const oldest = await a.scope.record({
    projectId: a.projectId,
    verb: "created",
    targetType: "project",
    targetId: a.projectId,
    summary: `Accompagnement créé : Refonte a`,
  });
  const middle = await a.scope.record({
    projectId: a.projectId,
    verb: "state_changed",
    targetType: "activity",
    targetId: a.projectId,
    summary: `Activité terminée : Audit UX`,
  });
  /* Le seul écrit **sans acteur** : `anonymous` n'en porte pas, donc `record`
     pose `actor_id` à nul — le cas des écritures système, qui doit se lire
     « par l'amorçage » plutôt que de disparaître. */
  const newest = await a.anonymous.record({
    projectId: a.projectId,
    verb: "archived",
    targetType: "resource",
    targetId: a.projectId,
    summary: `Ressource archivée : Restitution`,
  });

  oldestId = oldest.id;
  middleId = middle.id;
  newestId = newest.id;

  /* Saisis dans l'ordre, datés à rebours : le tri doit être celui de la
     requête, jamais celui de l'écriture. */
  await occurAt(oldestId, "2026-01-05T09:00:00Z");
  await occurAt(middleId, "2026-04-12T09:00:00Z");
  await occurAt(newestId, "2026-08-27T09:00:00Z");

  /* ----- Les trois lignes forgées. ----- */

  /* (1) L'événement est d'un **autre domaine** — et il pointe le projet de `a`,
         sans acteur. C'est ce qui le rend concluant : posé sur le projet de `b`,
         il aurait été écarté par `eq(events.projectId, …)` **avant** que
         `filter(events)` ait à le voir, et retirer ce filtre n'aurait fait
         tomber aucun test. Mesuré le 27/08/2026 : la première écriture de cette
         ligne portait `b.projectId`, et la mise en défaut est passée au vert.
         C'est la leçon de T5bis.3, resservie — *un filtre qu'aucune ligne forgée
         ne vise n'est pas éprouvé.*

         L'acteur est nul, et pas celui de `b` : avec lui, `filter(persons)`
         l'aurait rattrapé aussi, et la ligne aurait éprouvé deux filtres au lieu
         d'un. Seul `filter(events)` l'écarte. */
  const leakedDomain = await db
    .insert(events)
    .values({
      domainId: b.domainId,
      projectId: a.projectId,
      verb: "created",
      targetType: "project",
      summary: `Fuite de domaine ${suffix}`,
      occurredAt: new Date("2026-09-01T09:00:00Z"),
    })
    .returning({ id: events.id });
  leakedDomainEventId = leakedDomain[0]!.id;

  /* (2) L'événement est de `a`, sur le projet de `a` — seul son **acteur** est
         d'un autre domaine. Seul `filter(persons)` de la jointure l'écarte, et
         il n'écarte que le **nom** : la ligne, elle, reste rendue. C'est la
         propriété que le `on` tient et que le `where` casserait. */
  const leakedActor = await db
    .insert(events)
    .values({
      domainId: a.domainId,
      projectId: a.projectId,
      actorId: b.aliceId,
      verb: "updated",
      targetType: "project",
      summary: `Fuite d'acteur ${suffix}`,
      occurredAt: new Date("2026-06-15T09:00:00Z"),
    })
    .returning({ id: events.id });
  leakedActorEventId = leakedActor[0]!.id;

  /* (3) L'événement est de `a`, son acteur est de `a` — seul son **projet** est
         l'autre projet du même domaine. Ni `filter(events)` ni `filter(persons)`
         ne l'écartent : seul `eq(events.projectId, projectId)` le fait. Il est
         daté après tous les autres, pour qu'un débordement se voie en tête de
         liste plutôt qu'en queue. */
  const otherProject = await db
    .insert(events)
    .values({
      domainId: a.domainId,
      projectId: a.otherProjectId,
      actorId: a.aliceId,
      verb: "created",
      targetType: "activity",
      summary: `Débordement de projet ${suffix}`,
      occurredAt: new Date("2026-10-01T09:00:00Z"),
    })
    .returning({ id: events.id });
  otherProjectEventId = otherProject[0]!.id;
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

/** Le rang d'un événement dans la liste rendue. */
function rankOf(rows: { id: string }[], id: string): number {
  return rows.findIndex((row) => row.id === id);
}

describe("listProjectJournal", () => {
  test("rend les événements du projet, du plus récent au plus ancien", async () => {
    const rows = await listProjectJournal(a.scope, a.projectId);

    expect(rankOf(rows, newestId)).toBeLessThan(rankOf(rows, middleId));
    expect(rankOf(rows, middleId)).toBeLessThan(rankOf(rows, oldestId));
  });

  test("la phrase est rendue telle qu'elle a été figée à l'écriture", async () => {
    const rows = await listProjectJournal(a.scope, a.projectId);
    const row = rows.find((entry) => entry.id === middleId);

    // Sur le point de code, jamais à l'œil : l'insécable de `lib/journal.ts` et
    // l'espace ordinaire sont indiscernables dans un source.
    expect(row?.summary).toBe("Activité terminée : Audit UX");
  });

  test("le nom de l'acteur est joint, et il est courant", async () => {
    const rows = await listProjectJournal(a.scope, a.projectId);
    const row = rows.find((entry) => entry.id === oldestId);

    expect(row?.actorName).toBe(`Alice Martin a`);
  });

  test("un événement sans acteur reste rendu, sans nom", async () => {
    const rows = await listProjectJournal(a.scope, a.projectId);
    const row = rows.find((entry) => entry.id === newestId);

    // La ligne existe — c'est tout ce que la lecture garantit. La phrase
    // « par l'amorçage » appartient à l'écran, pas à la requête.
    expect(row).toBeDefined();
    expect(row?.actorName).toBeNull();
  });

  test("un projet sans événement rend un tableau vide", async () => {
    // L'état vide appartient à l'écran : la lecture rend une liste vide, jamais
    // `null` ni une erreur. C'est le premier rendu de tous les projets
    // existants — le journal démarre vide.
    //
    // **Dans `c`, le domaine sans aucun événement** : voir sa déclaration. Lu
    // dans `b`, ce test tombait avec l'étanchéité de projet.
    const rows = await listProjectJournal(c.scope, c.otherProjectId);

    expect(rows).toEqual([]);
  });

  /* ------------------------------------------------------------------------
     Les trois étanchéités. Chacune vise **un seul** filtre : retirer ce filtre
     doit faire tomber ce test-ci, et lui seul.
     ------------------------------------------------------------------------ */

  test("un événement d'un autre domaine n'entre pas — `filter(events)`", async () => {
    const rows = await listProjectJournal(a.scope, a.projectId);

    expect(rows.map((row) => row.id)).not.toContain(leakedDomainEventId);
  });

  test("un acteur d'un autre domaine ne se nomme pas — `filter(persons)`", async () => {
    const rows = await listProjectJournal(a.scope, a.projectId);
    const row = rows.find((entry) => entry.id === leakedActorEventId);

    // La ligne **reste** : le filtre vit dans le `on` de la jointure, pas dans
    // le `where`. C'est le nom qui tombe, jamais l'événement.
    expect(row).toBeDefined();
    expect(row?.actorName).toBeNull();
  });

  test("un événement d'un autre projet du même domaine n'entre pas — `eq(projectId)`", async () => {
    const rows = await listProjectJournal(a.scope, a.projectId);

    expect(rows.map((row) => row.id)).not.toContain(otherProjectEventId);
  });
});
