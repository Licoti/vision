/**
 * Les tests de `listRecentEvents` — le flux d'activité récente de la vue
 * d'ensemble.
 *
 * Ils tournent sur la branche Neon dédiée — `vitest.config.mts` remappe
 * `DATABASE_URL` sur `TEST_DATABASE_URL` — et écrivent réellement : un tri par
 * horodatage, un plafond, trois `leftJoin` filtrés et quatre filtres
 * d'étanchéité ne se vérifient pas sur un faux.
 *
 * **Trois domaines**, comme `journal.test.ts` et `links.test.ts` : `a` porte le
 * jeu, `b` fournit les lignes d'un autre domaine, `c` reste **vierge de tout
 * événement** — lu dans `b`, l'état vide tomberait en même temps qu'une
 * étanchéité, et une chute non isolée ne désigne plus le filtre qu'elle
 * éprouve.
 *
 * **Les événements légitimes s'écrivent par le vrai `scope.record()`**, jamais
 * par le client brut : une lecture doit lire ce que l'écriture écrit, et un
 * insert forgé ferait passer le test le jour où `record` changerait de forme.
 * C'est aussi ce qui donne gratuitement le cas de l'acteur nul — un scope sans
 * `actorId` en pose un (`scoped.ts`).
 *
 * **Les instants sont ensuite forcés distincts par le client brut**, et c'est
 * une nécessité de mesure : `occurred_at` n'est pas dans `JournalEntry` — la
 * couche le pose par `defaultNow()` — et deux `record()` voisins peuvent
 * partager la microseconde. Le tri **et le plafond** se valideraient alors sur
 * des horodatages égaux, c'est-à-dire sur rien.
 *
 * **Quatre lignes forgées, une par `filter()`**, et chacune ne franchit la
 * frontière que sur **une seule** colonne — leçon de T5bis.2. Elles sont en
 * outre taillées **contre l'ordre des filtres** : une ligne qu'un filtre en
 * amont écarte n'éprouve pas celui qu'elle vise, et la mise en défaut passe au
 * vert en désignant le mauvais coupable (leçon de T6.3). C'est la condition
 * pour qu'un `filter()` retiré fasse tomber **un** test et pas trois.
 *
 * **Chaque test lit sur son propre domaine ou sur son propre plafond**, et les
 * constats se lisent par identifiant, jamais par position — sauf le tri et le
 * plafond, qui comparent des rangs relatifs. Un défaut d'ordre ne doit pas
 * faire tomber les autres.
 *
 * **La valeur de `RECENT_EVENTS_LIMIT` n'est pas testée, et c'est délibéré.**
 * Ce qui se teste est la **clause** — un plafond explicite borne la lecture et
 * retient les plus récents. Un test qui relirait le nombre par défaut ne ferait
 * que répéter la constante, et pour être falsifiable il faudrait un quatrième
 * domaine de seize événements dont la chute doublerait celle du test ci-dessus.
 * Une chute non isolée ne désigne plus la clause qu'elle éprouve. Le nombre,
 * lui, se lit dans le HTML servi.
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

import { listRecentEvents } from "./overview";

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
  projectId: string;
  projectName: string;
  /** Un **second** projet du même domaine : le flux doit le traverser. */
  otherProjectId: string;
  otherProjectName: string;
  productId: string;
  productName: string;
  aliceId: string;
};

const suffix = Math.random().toString(36).slice(2, 10);
let a: Fixture;
let b: Fixture;
/**
 * Le troisième domaine, et il n'a qu'un emploi : **aucun événement n'y est
 * écrit**, ni légitime ni forgé. Sans lui, l'état vide se lirait sur un domaine
 * qui porte des lignes forgées, et il tomberait avec l'étanchéité de domaine.
 */
let c: Fixture;

/* Les événements légitimes de `a`, du plus ancien au plus récent. */
let oldestId: string;
let secondProjectId: string;
let readingId: string;
let anonymousId: string;
let bothId: string;
let newestId: string;

/* Les quatre lignes forgées, nommées par le filtre qu'elles éprouvent. */
let leakedDomainEventId: string;
let leakedActorEventId: string;
let leakedProjectEventId: string;
let leakedProductEventId: string;

async function seedDomain(label: string): Promise<Fixture> {
  const domain = await superAdmin.createDomain({
    name: `__test__overview__${label}__${suffix}`,
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
  const productName = `Produit ${label}`;
  const product = await scope.insert(products, {
    name: productName,
    entityId: entity.id,
  });
  const status = await scope.insert(projectStatuses, {
    label: `En cours ${label}`,
    nature: "active",
    position: "1",
  });

  const projectName = `Refonte ${label}`;
  const project = await scope.insert(projects, {
    name: projectName,
    productId: product.id,
    statusId: status.id,
    startedOn: "2026-02-01",
  });
  const otherProjectName = `Audit ${label}`;
  const other = await scope.insert(projects, {
    name: otherProjectName,
    productId: product.id,
    statusId: status.id,
    startedOn: "2026-03-01",
  });

  return {
    domainId: domain.id,
    scope,
    anonymous: bootstrap,
    projectId: project.id,
    projectName,
    otherProjectId: other.id,
    otherProjectName,
    productId: product.id,
    productName,
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
    summary: `Accompagnement créé : ${a.projectName}`,
  });

  /* Sur le **second** projet du domaine : c'est lui qui prouve que le flux
     traverse les accompagnements, là où `listProjectJournal` s'arrête à un. */
  const second = await a.scope.record({
    projectId: a.otherProjectId,
    verb: "state_changed",
    targetType: "activity",
    targetId: a.otherProjectId,
    summary: `Activité terminée : Audit UX`,
  });

  /* Le seul qui porte `product_id` **et pas** `project_id` : c'est la forme
     qu'écrit un relevé d'indicateur (T6.2), et le seul chemin vers l'origine
     « produit ». Sans lui, la seconde branche de `originOf` serait morte. */
  const reading = await a.scope.record({
    productId: a.productId,
    verb: "created",
    targetType: "indicator_reading",
    targetId: a.productId,
    summary: `Relevé saisi : Taux de conversion`,
  });

  /* Le seul qui porte les **deux** rattachements, et il n'existe que pour la
     préséance. Aucun des quatorze points d'écriture n'en produit — les gestes
     de projet posent `project_id`, le relevé pose `product_id` —, mais
     `JournalEntry` les accepte tous deux et le schéma les déclare tous deux
     nullables. Sans cette ligne, `originOf` prétendrait trancher un cas que
     rien n'atteint : mesuré le 27/08/2026, inverser la préséance laissait les
     treize constats au vert. Une règle qu'aucune ligne ne vise n'est pas
     éprouvée. */
  const both = await a.scope.record({
    projectId: a.projectId,
    productId: a.productId,
    verb: "created",
    targetType: "result",
    summary: `Résultat saisi : Audit d'accessibilité`,
  });

  /* Le seul écrit **sans acteur** : `anonymous` n'en porte pas, donc `record`
     pose `actor_id` à nul — le cas des écritures d'amorçage. */
  const anonymous = await a.anonymous.record({
    projectId: a.projectId,
    verb: "archived",
    targetType: "resource",
    targetId: a.projectId,
    summary: `Ressource archivée : Restitution`,
  });

  const newest = await a.scope.record({
    projectId: a.projectId,
    verb: "updated",
    targetType: "project",
    targetId: a.projectId,
    summary: `Accompagnement corrigé : ${a.projectName}`,
  });

  oldestId = oldest.id;
  secondProjectId = second.id;
  readingId = reading.id;
  bothId = both.id;
  anonymousId = anonymous.id;
  newestId = newest.id;

  /* Saisis dans l'ordre, datés à rebours : le tri doit être celui de la
     requête, jamais celui de l'écriture. */
  await occurAt(oldestId, "2026-01-05T09:00:00Z");
  await occurAt(secondProjectId, "2026-03-10T09:00:00Z");
  await occurAt(readingId, "2026-05-20T09:00:00Z");
  await occurAt(bothId, "2026-06-01T09:00:00Z");
  await occurAt(anonymousId, "2026-07-02T09:00:00Z");
  await occurAt(newestId, "2026-08-27T09:00:00Z");

  /* ----- Les quatre lignes forgées. ----------------------------------------

     Chacune est taillée **contre l'ordre des filtres** : elle ne franchit la
     frontière que sur la colonne qu'elle vise, et aucune autre clause ne
     l'écarte en amont. Sans cette précaution, retirer le filtre visé ne ferait
     tomber aucun test (leçon de T6.3).
     --------------------------------------------------------------------- */

  /* (1) L'événement est d'un **autre domaine**, et rien d'autre ne le trahit :
         projet de `a`, acteur nul, produit nul. Seul `filter(events)` l'écarte.

         **Daté au milieu du jeu, et non en tête** : mesuré le 27/08/2026, une
         date postérieure à tous les autres le faisait entrer dans les deux
         lignes du test de plafond dès que `filter(events)` était retiré, si
         bien que la mise en défaut faisait tomber ce test **en plus** du sien.
         La chute n'était pas fausse, elle était non isolée — et une chute non
         isolée ne désigne plus le filtre qu'elle éprouve. Rien n'est perdu : la
         lecture par défaut plafonne à quinze pour huit lignes, donc une fuite
         se verrait quelle que soit sa date, et le constat la cherche par
         identifiant et non par position. */
  const leakedDomain = await db
    .insert(events)
    .values({
      domainId: b.domainId,
      projectId: a.projectId,
      verb: "created",
      targetType: "project",
      summary: `Fuite de domaine ${suffix}`,
      occurredAt: new Date("2026-04-20T09:00:00Z"),
    })
    .returning({ id: events.id });
  leakedDomainEventId = leakedDomain[0]!.id;

  /* (2) L'événement est de `a`, sur le projet de `a` — seul son **acteur** est
         d'un autre domaine. Seul `filter(persons)` l'écarte, et il n'écarte que
         le **nom** : la ligne, elle, reste rendue. C'est la propriété que le
         `on` tient et que le `where` casserait. */
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
         d'un autre domaine. Seul `filter(projects)` l'écarte, et il n'écarte
         que l'**origine** : la ligne reste, sans lien.

         `product_id` est nul, et c'est délibéré : avec le produit de `a`, la
         préséance serait retombée dessus et la ligne aurait porté une origine
         malgré le filtre. Le constat n'aurait plus rien mesuré. */
  const leakedProject = await db
    .insert(events)
    .values({
      domainId: a.domainId,
      projectId: b.projectId,
      actorId: a.aliceId,
      verb: "created",
      targetType: "activity",
      summary: `Fuite de projet ${suffix}`,
      occurredAt: new Date("2026-04-01T09:00:00Z"),
    })
    .returning({ id: events.id });
  leakedProjectEventId = leakedProject[0]!.id;

  /* (4) L'événement est de `a`, son acteur est de `a`, son projet est **nul** —
         seul son **produit** est d'un autre domaine. C'est la forme d'un relevé,
         et seul `filter(products)` l'écarte. Le projet nul est ce qui rend le
         constat concluant : avec le projet de `a`, la préséance l'aurait nommé
         en premier et `filter(products)` n'aurait plus rien eu à protéger. */
  const leakedProduct = await db
    .insert(events)
    .values({
      domainId: a.domainId,
      productId: b.productId,
      actorId: a.aliceId,
      verb: "created",
      targetType: "indicator_reading",
      summary: `Fuite de produit ${suffix}`,
      occurredAt: new Date("2026-02-14T09:00:00Z"),
    })
    .returning({ id: events.id });
  leakedProductEventId = leakedProduct[0]!.id;
});

afterAll(async () => {
  /* Aucun `if (!f?.domainId) return` : un `beforeAll` qui échoue après avoir
     créé son domaine le laisserait en place, et ferait tomber le fichier
     suivant. C'est le défaut que trois fichiers d'action portent encore
     (`ETAT.md`) ; il ne se réintroduit pas ici. */
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

describe("listRecentEvents", () => {
  test("rend les événements du domaine, du plus récent au plus ancien", async () => {
    const rows = await listRecentEvents(a.scope);

    expect(rankOf(rows, newestId)).toBeLessThan(rankOf(rows, anonymousId));
    expect(rankOf(rows, anonymousId)).toBeLessThan(rankOf(rows, readingId));
    expect(rankOf(rows, readingId)).toBeLessThan(rankOf(rows, secondProjectId));
    expect(rankOf(rows, secondProjectId)).toBeLessThan(rankOf(rows, oldestId));
  });

  test("le flux traverse les accompagnements du domaine", async () => {
    const rows = await listRecentEvents(a.scope);
    const ids = rows.map((row) => row.id);

    // C'est ce qui le sépare de `listProjectJournal` : deux projets, un seul
    // flux. Une clause `eq(events.projectId, …)` réintroduite ferait tomber
    // ce constat, et lui seul.
    expect(ids).toContain(oldestId);
    expect(ids).toContain(secondProjectId);
  });

  test("l'origine d'un événement de projet est le projet, nommé", async () => {
    const rows = await listRecentEvents(a.scope);
    const row = rows.find((entry) => entry.id === oldestId);

    expect(row?.origin).toEqual({
      kind: "project",
      id: a.projectId,
      name: a.projectName,
    });
  });

  test("l'origine d'un événement sans projet est le produit, nommé", async () => {
    const rows = await listRecentEvents(a.scope);
    const row = rows.find((entry) => entry.id === readingId);

    // Le cas des relevés (T6.2) : `product_id` porté, `project_id` nul. C'est
    // la seconde branche de la préséance, et le seul chemin qui l'atteint.
    expect(row?.origin).toEqual({
      kind: "product",
      id: a.productId,
      name: a.productName,
    });
  });

  test("le projet l'emporte sur le produit quand les deux sont portés", async () => {
    const rows = await listRecentEvents(a.scope);
    const row = rows.find((entry) => entry.id === bothId);

    // La préséance de `originOf`, et le seul constat qui la vise. L'écran ne
    // nomme qu'une origine : c'est l'accompagnement qui la porte, le produit
    // n'étant le recours que lorsqu'il n'y a pas d'accompagnement.
    expect(row?.origin).toEqual({
      kind: "project",
      id: a.projectId,
      name: a.projectName,
    });
  });

  test("la phrase est rendue telle qu'elle a été figée à l'écriture", async () => {
    const rows = await listRecentEvents(a.scope);
    const row = rows.find((entry) => entry.id === secondProjectId);

    // Sur le point de code, jamais à l'œil : l'insécable de `lib/journal.ts` et
    // l'espace ordinaire sont indiscernables dans un source.
    expect(row?.summary).toBe("Activité terminée : Audit UX");
  });

  test("le nom de l'acteur est joint, et il est courant", async () => {
    const rows = await listRecentEvents(a.scope);
    const row = rows.find((entry) => entry.id === oldestId);

    expect(row?.actorName).toBe(`Alice Martin a`);
  });

  test("un événement sans acteur reste rendu, sans nom", async () => {
    const rows = await listRecentEvents(a.scope);
    const row = rows.find((entry) => entry.id === anonymousId);

    // La ligne existe — c'est tout ce que la lecture garantit. La phrase
    // « par l'amorçage » appartient à l'écran, pas à la requête.
    expect(row).toBeDefined();
    expect(row?.actorName).toBeNull();
  });

  test("le plafond borne la lecture, et il retient les plus récents", async () => {
    const rows = await listRecentEvents(a.scope, 2);

    // Deux constats en un seul test, et c'est voulu : un plafond qui rendrait
    // le bon nombre de mauvaises lignes ne serait pas un plafond. Les deux
    // plus récents de `a` sont `newest` (27/08) et l'anonyme (02/07).
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.id)).toEqual([newestId, anonymousId]);
  });

  test("un domaine sans événement rend un tableau vide", async () => {
    // L'état vide appartient à l'écran : la lecture rend une liste vide, jamais
    // `null` ni une erreur. C'est le premier rendu de tous les domaines
    // existants — le journal démarre vide.
    //
    // **Dans `c`, le domaine vierge de toute ligne forgée** : lu dans `b`, ce
    // test tomberait avec l'étanchéité de domaine.
    const rows = await listRecentEvents(c.scope);

    expect(rows).toEqual([]);
  });

  /* ------------------------------------------------------------------------
     Les quatre étanchéités. Chacune vise **un seul** filtre : retirer ce filtre
     doit faire tomber ce test-ci, et lui seul.
     ------------------------------------------------------------------------ */

  test("un événement d'un autre domaine n'entre pas — `filter(events)`", async () => {
    const rows = await listRecentEvents(a.scope);

    expect(rows.map((row) => row.id)).not.toContain(leakedDomainEventId);
  });

  test("un acteur d'un autre domaine ne se nomme pas — `filter(persons)`", async () => {
    const rows = await listRecentEvents(a.scope);
    const row = rows.find((entry) => entry.id === leakedActorEventId);

    // La ligne **reste** : le filtre vit dans le `on` de la jointure, pas dans
    // le `where`. C'est le nom qui tombe, jamais l'événement.
    expect(row).toBeDefined();
    expect(row?.actorName).toBeNull();
  });

  test("un projet d'un autre domaine ne se nomme pas — `filter(projects)`", async () => {
    const rows = await listRecentEvents(a.scope);
    const row = rows.find((entry) => entry.id === leakedProjectEventId);

    // Même propriété que pour l'acteur : la ligne reste, l'origine tombe. Un
    // lien vers le projet d'un autre domaine serait la fuite ; une ligne sans
    // lien n'en est pas une.
    expect(row).toBeDefined();
    expect(row?.origin).toBeNull();
  });

  test("un produit d'un autre domaine ne se nomme pas — `filter(products)`", async () => {
    const rows = await listRecentEvents(a.scope);
    const row = rows.find((entry) => entry.id === leakedProductEventId);

    expect(row).toBeDefined();
    expect(row?.origin).toBeNull();
  });
});
