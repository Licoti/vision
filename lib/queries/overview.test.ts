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
  approaches,
  domains,
  entities,
  events,
  persons,
  products,
  projectApproaches,
  projectStatuses,
  projects,
} from "@/lib/db/schema";
import { listProductsWithCounts } from "@/lib/queries/products";
import { listProjects } from "@/lib/queries/projects";

import {
  countProducts,
  countProjects,
  listProjectDistribution,
  listRecentEvents,
  listStaleProjects,
  staleBefore,
} from "./overview";

/** Enfants d'abord, parents ensuite : `domains` refuse la suppression sinon. */
const teardownOrder = [
  events,
  projectApproaches,
  projects,
  products,
  entities,
  projectStatuses,
  approaches,
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
  /** Le statut du domaine, cible des lignes forgées de T6.7. */
  statusId: string;
  /** Son entité, pour ce que T6.7 sème de produits en plus. */
  entityId: string;
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

/* ---------------------------------------------------------------------------
   Ce que T6.7 sème en plus, **dans `a` seulement**.

   Hors de `seedDomain`, et c'est délibéré : semé là, `c` cesserait d'être le
   domaine dont on peut affirmer qu'il ne porte rien, et les constats de T6.6 se
   mettraient à dépendre d'un jeu qui ne les concerne pas. Le jeu de T6.7 est
   donc posé sur `a`, et `b` ne reçoit que ce qu'une ligne forgée exige.
   ------------------------------------------------------------------------- */

/* Les statuts — le référentiel et ses cas de bord. */
let emptyStatusId: string;
let archivedEmptyStatusId: string;
let archivedUsedStatusId: string;

/* Les entités — la troisième dimension, ouverte par T7.2. */
let emptyEntityId: string;
let archivedEmptyEntityId: string;
let archivedUsedEntityId: string;
let keptEntityProjectId: string;

/* Les approches — dont une qui n'a que sa ligne de liaison forgée. */
let usedApproachId: string;
let sharedApproachId: string;
let emptyApproachId: string;
let leakedLinkApproachId: string;

/* Les projets qui ne doivent compter nulle part. */
let archivedProjectId: string;
let orphanProjectId: string;
let archivedProductId: string;

/* Les projets de la fraîcheur. */
let sleepyProjectId: string;
let freshProjectId: string;
let keptProjectId: string;
/* Le statut terminé et son projet — l'exclusion du 31/08/2026. */
let doneStatusId: string;
let doneProjectId: string;

/* Les lignes forgées de T6.7, nommées par le filtre qu'elles éprouvent. */
let leakedDomainProjectId: string;
let leakedProductProjectId: string;
let leakedEntityProductId: string;

/** L'instant du semis : ce qui est « frais » l'est par rapport à lui. */
const SEEDED_AT = new Date();

/**
 * La dernière activité du projet endormi : **quatre-vingt-dix jours avant le
 * semis**, et non une date écrite.
 *
 * Une date fixe ferait dépendre le constat du jour où le test tourne — juste
 * en août 2026, faux avant juillet 2026. Le seuil se mesure par rapport à un
 * instant, donc la donnée se pose par rapport au même instant.
 */
const SLEEPY_AT = new Date(SEEDED_AT.getTime() - 90 * 24 * 60 * 60 * 1000);

/**
 * La dernière activité des projets qui **ne doivent jamais figurer** —
 * l'archivé et les deux forgés. Soixante jours : dormants comme les autres, mais
 * **postérieurs** au projet endormi.
 *
 * **C'est ce qui isole le constat du plafond**, et c'est une chute mesurée le
 * 27/08/2026 : laissés sans activité, ces trois-là entraient en tête de liste —
 * les projets sans activité ouvrent la marche — et chassaient du plafond de deux
 * les lignes attendues. Retirer `filter(projects)` faisait alors tomber le
 * plafond **en plus** de l'étanchéité qu'il visait. Une chute non isolée ne
 * désigne plus le filtre qu'elle éprouve (leçon de T6.3).
 */
const STALE_TAIL_AT = new Date(SEEDED_AT.getTime() - 60 * 24 * 60 * 60 * 1000);

/** Les deux statuts qui ne portent qu'une ligne forgée, un filtre chacun. */
let leakedDomainStatusId: string;
let leakedProductStatusId: string;

/** L'approche de `b`, et son seul emploi : `filter(approaches)`. */
let otherDomainApproachId: string;

/**
 * Les deux entités qui ne portent qu'une ligne forgée, **un filtre chacune**.
 *
 * C'est la condition de l'isolement, celle qu'un statut par fuite tient déjà
 * plus haut : sur une entité commune, les deux fuites produiraient le même
 * écart de décompte et retirer l'un ou l'autre `filter()` ferait tomber les
 * deux constats.
 */
let leakedProductEntityId: string;
let leakedProjectEntityId: string;

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
  });
  const otherProjectName = `Audit ${label}`;
  const other = await scope.insert(projects, {
    name: otherProjectName,
    productId: product.id,
    statusId: status.id,
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
    statusId: status.id,
    entityId: entity.id,
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

  /* ======================================================================
     T6.7 — le jeu de la répartition, de la fraîcheur et des décomptes.

     Il tient en trois familles : les valeurs de référentiel et leurs cas de
     bord, les projets qui ne doivent compter nulle part, et les projets dont
     la fraîcheur décide.
     ====================================================================== */

  /* ----- Les statuts. -------------------------------------------------- */

  /* Le zéro : un statut du référentiel que personne n'emploie. C'est le cas
     que `listProjectFilterOptions` refuse d'offrir et que la répartition doit
     rendre — un statut du domaine absent de la lecture se lirait comme un
     statut qui n'existe pas. */
  const emptyStatus = await a.scope.insert(projectStatuses, {
    label: `Idée ${suffix}`,
    nature: "framing",
    position: "2",
  });
  emptyStatusId = emptyStatus.id;

  /* Le vocabulaire retiré : archivé et sans projet, il ne se rend pas. */
  const archivedEmptyStatus = await a.scope.insert(projectStatuses, {
    label: `Statut retiré ${suffix}`,
    nature: "paused",
    position: "3",
  });
  archivedEmptyStatusId = archivedEmptyStatus.id;
  await a.scope.archive(projectStatuses, archivedEmptyStatusId);

  /* L'autre moitié de la règle : archivé **mais porteur**, il se rend — sans
     quoi ses projets compteraient dans la liste et dans aucun chiffre. */
  const archivedUsedStatus = await a.scope.insert(projectStatuses, {
    label: `Statut retiré en usage ${suffix}`,
    nature: "done",
    position: "4",
  });
  archivedUsedStatusId = archivedUsedStatus.id;

  const kept = await a.scope.insert(projects, {
    name: `Projet au statut retiré ${suffix}`,
    productId: a.productId,
    statusId: archivedUsedStatusId,
    lastActivityAt: SEEDED_AT,
  });
  keptProjectId = kept.id;
  await a.scope.archive(projectStatuses, archivedUsedStatusId);

  /* ----- Les entités (T7.2). --------------------------------------------

     Les trois mêmes cas de bord que les statuts, et pour la même raison : la
     règle `isRendered` ne se prouve que sur une valeur archivée **vide** et une
     valeur archivée **porteuse**. L'entité d'amorçage, elle, est en position 0
     et porte déjà les produits du domaine.
     -------------------------------------------------------------------- */

  /* Le zéro : une entité du référentiel qui ne porte aucun produit. */
  const emptyEntity = await a.scope.insert(entities, {
    label: `Entité sans produit ${suffix}`,
    position: "1",
  });
  emptyEntityId = emptyEntity.id;

  /* Le vocabulaire retiré : archivée et vide, elle ne se rend pas. */
  const archivedEmptyEntity = await a.scope.insert(entities, {
    label: `Entité retirée ${suffix}`,
    position: "2",
  });
  archivedEmptyEntityId = archivedEmptyEntity.id;
  await a.scope.archive(entities, archivedEmptyEntityId);

  /* L'autre moitié de la règle : archivée **mais porteuse**. Ses projets
     comptent dans la liste transverse ; la taire ferait de la répartition une
     lecture incomplète en silence, et aucune somme n'est affichée pour que
     quiconque s'en aperçoive. */
  const archivedUsedEntity = await a.scope.insert(entities, {
    label: `Entité retirée en usage ${suffix}`,
    position: "3",
  });
  archivedUsedEntityId = archivedUsedEntity.id;

  const keptEntityProduct = await a.scope.insert(products, {
    name: `Produit sous entité retirée ${suffix}`,
    entityId: archivedUsedEntityId,
  });
  /* **Daté de l'instant du semis**, jamais laissé nul : une activité nulle le
     ferait entrer en **tête** de `listStaleProjects` — les projets sans
     activité ouvrent la marche — et il chasserait du plafond les deux lignes
     que le constat attend. C'est la chute mesurée le 27/08/2026, évitée. */
  const keptEntityProject = await a.scope.insert(projects, {
    name: `Projet sous entité retirée ${suffix}`,
    productId: keptEntityProduct.id,
    statusId: a.statusId,
    lastActivityAt: SEEDED_AT,
  });
  keptEntityProjectId = keptEntityProject.id;
  await a.scope.archive(entities, archivedUsedEntityId);

  /* ----- Les approches. ------------------------------------------------ */

  const usedApproach = await a.scope.insert(approaches, {
    label: `Research ${suffix}`,
    position: "1",
  });
  usedApproachId = usedApproach.id;

  /* La seconde approche du **même** projet : c'est elle qui montre qu'un projet
     compte dans deux dimensions à la fois, et donc que la somme des approches
     n'est pas le nombre de projets. Aucune somme n'est d'ailleurs affichée. */
  const sharedApproach = await a.scope.insert(approaches, {
    label: `Lean ${suffix}`,
    position: "2",
  });
  sharedApproachId = sharedApproach.id;

  const emptyApproach = await a.scope.insert(approaches, {
    label: `Audit UX ${suffix}`,
    position: "3",
  });
  emptyApproachId = emptyApproach.id;

  /* Une approche à elle seule pour la ligne de liaison forgée : posée sur
     `emptyApproach`, la fuite ferait tomber le constat du zéro **en plus** du
     sien, et une chute non isolée ne désigne plus le filtre qu'elle éprouve. */
  const leakedLinkApproach = await a.scope.insert(approaches, {
    label: `Approche à liaison forgée ${suffix}`,
    position: "4",
  });
  leakedLinkApproachId = leakedLinkApproach.id;

  await a.scope.insert(projectApproaches, {
    projectId: a.projectId,
    approachId: usedApproachId,
  });
  await a.scope.insert(projectApproaches, {
    projectId: a.otherProjectId,
    approachId: usedApproachId,
  });
  await a.scope.insert(projectApproaches, {
    projectId: a.projectId,
    approachId: sharedApproachId,
  });

  /* ----- Les projets qui ne comptent nulle part. ------------------------ */

  const archivedProject = await a.scope.insert(projects, {
    name: `Accompagnement rangé ${suffix}`,
    productId: a.productId,
    statusId: a.statusId,
    lastActivityAt: STALE_TAIL_AT,
  });
  archivedProjectId = archivedProject.id;
  await a.scope.archive(projects, archivedProjectId);

  /* Le projet **vivant sous un produit archivé** : c'est le seul cas que
     `count(projects.id)` compterait et que `count(products.id)` écarte, et
     c'est la divergence exacte que la fiche demande de mettre en défaut. */
  const archivedProduct = await a.scope.insert(products, {
    name: `Produit rangé ${suffix}`,
    entityId: a.entityId,
  });
  archivedProductId = archivedProduct.id;

  const orphan = await a.scope.insert(projects, {
    name: `Accompagnement sous produit rangé ${suffix}`,
    productId: archivedProductId,
    statusId: a.statusId,
    lastActivityAt: SLEEPY_AT,
  });
  orphanProjectId = orphan.id;
  await a.scope.insert(projectApproaches, {
    projectId: orphanProjectId,
    approachId: usedApproachId,
  });
  await a.scope.archive(products, archivedProductId);

  /* ----- La fraîcheur. -------------------------------------------------- */

  /* Le même projet des deux côtés de la frontière : c'est le seul montage où
     un seuil décalé d'un mois fait tomber un constat. Deux projets, l'un
     ancien l'autre récent, se laisseraient traverser par un mauvais seuil. */
  const sleepy = await a.scope.insert(projects, {
    name: `Accompagnement endormi ${suffix}`,
    productId: a.productId,
    statusId: a.statusId,
    lastActivityAt: SLEEPY_AT,
  });
  sleepyProjectId = sleepy.id;

  /* Le témoin du seuil **par défaut** : daté de l'instant du semis, il est
     hors du mois écoulé quelle que soit la date à laquelle le test tourne. */
  const fresh = await a.scope.insert(projects, {
    name: `Accompagnement frais ${suffix}`,
    productId: a.productId,
    statusId: a.statusId,
    lastActivityAt: SEEDED_AT,
  });
  freshProjectId = fresh.id;

  /* **Le terminé qui dormirait sans sa nature** : sa dernière activité est
     ancienne, son produit est vivant, il n'est pas archivé — la seule chose qui
     l'écarte est la nature `done` de son statut. C'est la condition pour que le
     `ne()` retiré fasse tomber **ce** constat et lui seul.

     Le statut est **neuf et non archivé** : `archivedUsedStatusId` porte déjà
     la nature `done`, mais il est archivé et son projet est frais — s'en servir
     mêlerait trois causes d'exclusion à celle qu'on éprouve.

     `STALE_TAIL_AT` et non l'absence d'activité, la règle des témoins qui ne
     doivent jamais figurer : sans activité, il ouvrirait la marche et chasserait
     du plafond de deux les lignes attendues. */
  const doneStatus = await a.scope.insert(projectStatuses, {
    label: `Terminé ${suffix}`,
    nature: "done",
    position: "7",
  });
  doneStatusId = doneStatus.id;

  const done = await a.scope.insert(projects, {
    name: `Accompagnement terminé ${suffix}`,
    productId: a.productId,
    statusId: doneStatusId,
    lastActivityAt: STALE_TAIL_AT,
  });
  doneProjectId = done.id;

  /* `c` n'a que ses deux projets d'amorçage, sans activité : datés de
     l'instant du semis, ils font de lui le domaine dont **aucun** projet ne
     dort. Sans cela, l'état vide de la fraîcheur n'aurait nulle part où se
     lire — un projet sans activité en est un qui dort. */
  await db
    .update(projects)
    .set({ lastActivityAt: SEEDED_AT })
    .where(eq(projects.domainId, c.domainId));

  /* ----- Les lignes forgées de T6.7. -----------------------------------

     Chacune ne franchit la frontière que sur **une** colonne, et aucune autre
     clause ne l'écarte en amont.
     ------------------------------------------------------------------- */

  /* **Un statut par ligne forgée**, et c'est la condition de l'isolement : sur
     le statut commun, les deux fuites produiraient le même écart de décompte,
     et retirer l'un ou l'autre filtre ferait tomber les deux constats. Une
     chute non isolée ne désigne plus le filtre qu'elle éprouve (leçon de
     T6.3). */
  const leakedDomainStatus = await a.scope.insert(projectStatuses, {
    label: `Statut à projet forgé par le domaine ${suffix}`,
    nature: "active",
    position: "5",
  });
  leakedDomainStatusId = leakedDomainStatus.id;

  const leakedProductStatus = await a.scope.insert(projectStatuses, {
    label: `Statut à projet forgé par le produit ${suffix}`,
    nature: "active",
    position: "6",
  });
  leakedProductStatusId = leakedProductStatus.id;

  /* L'approche de `b` : sans elle, `filter(approaches)` n'aurait rien à
     écarter et son retrait passerait au vert. */
  const otherDomainApproach = await b.scope.insert(approaches, {
    label: `Approche de b ${suffix}`,
    position: "1",
  });
  otherDomainApproachId = otherDomainApproach.id;

  /* (5) Le projet est d'un **autre domaine** — son produit et son statut sont
         ceux de `a`, il est vivant, son produit l'est aussi. Seul
         `filter(projects)` l'écarte, dans la répartition comme dans la
         fraîcheur comme dans le décompte. */
  const leakedDomainProject = await db
    .insert(projects)
    .values({
      domainId: b.domainId,
      name: `Fuite de projet par le domaine ${suffix}`,
      productId: a.productId,
      statusId: leakedDomainStatusId,
      lastActivityAt: STALE_TAIL_AT,
    })
    .returning({ id: projects.id });
  leakedDomainProjectId = leakedDomainProject[0]!.id;

  /* (6) Le projet est de `a`, vivant, sur un statut de `a` — seul son
         **produit** est d'un autre domaine. Seul `filter(products)` l'écarte.
         C'est aussi ce qui distingue le décompte de sa liste : `listProjects`
         l'écarte par son `innerJoin`, le décompte doit faire de même. */
  const leakedProductProject = await db
    .insert(projects)
    .values({
      domainId: a.domainId,
      name: `Fuite de projet par le produit ${suffix}`,
      productId: b.productId,
      statusId: leakedProductStatusId,
      lastActivityAt: STALE_TAIL_AT,
    })
    .returning({ id: projects.id });
  leakedProductProjectId = leakedProductProject[0]!.id;

  /* (7) La **liaison** est d'un autre domaine, ses deux extrémités sont de
         `a` : le projet de `a`, l'approche de `a`. Seul
         `filter(projectApproaches)` l'écarte — la table de liaison est une
         table du domaine comme les autres. */
  await db.insert(projectApproaches).values({
    domainId: b.domainId,
    projectId: a.projectId,
    approachId: leakedLinkApproachId,
  });

  /* (8) Le produit est de `a` et vivant — seule son **entité** est d'un autre
         domaine. Seul `filter(entities)` l'écarte, et c'est la jointure que
         `listProductsWithCounts` porte : un décompte plus simple que sa liste
         est un décompte qui finit par en dire plus qu'elle. Sans cette ligne,
         la clause n'aurait rien à écarter et son retrait passerait au vert
         (mesuré le 27/08/2026). */
  const leakedEntityProduct = await db
    .insert(products)
    .values({
      domainId: a.domainId,
      name: `Fuite de produit par l'entité ${suffix}`,
      entityId: b.entityId,
    })
    .returning({ id: products.id });
  leakedEntityProductId = leakedEntityProduct[0]!.id;

  /* (9) La chaîne de l'entité est `entities → products → projects`, donc elle
         porte **deux** `filter()` à éprouver, et chacun demande son montage.

         Ici, le **produit** est d'un autre domaine et le projet qu'il porte est
         de `a` : seul `filter(products)` écarte la ligne. Retirer
         `filter(projects)` ne change rien — le produit reste dehors, et la
         chaîne est coupée en amont. La chute est donc isolée. */
  const leakedProductEntity = await a.scope.insert(entities, {
    label: `Entité à produit forgé ${suffix}`,
    position: "4",
  });
  leakedProductEntityId = leakedProductEntity.id;

  const forgedProduct = await db
    .insert(products)
    .values({
      domainId: b.domainId,
      name: `Produit forgé sous entité de a ${suffix}`,
      entityId: leakedProductEntityId,
    })
    .returning({ id: products.id });

  await db.insert(projects).values({
    domainId: a.domainId,
    name: `Projet de a sous produit forgé ${suffix}`,
    productId: forgedProduct[0]!.id,
    statusId: leakedProductStatusId,
    lastActivityAt: STALE_TAIL_AT,
  });

  /* (10) L'inverse : le **produit** est de `a` et vivant, seul le **projet**
          est d'ailleurs. Seul `filter(projects)` écarte la ligne, et retirer
          `filter(products)` ne change rien.

          Les deux forgés sont datés `STALE_TAIL_AT`, comme leurs aînés : si un
          filtre tombait, ils entreraient dans la fraîcheur **après** les
          projets sans activité, sans déplacer le plafond. */
  const leakedProjectEntity = await a.scope.insert(entities, {
    label: `Entité à projet forgé ${suffix}`,
    position: "5",
  });
  leakedProjectEntityId = leakedProjectEntity.id;

  const cleanProduct = await a.scope.insert(products, {
    name: `Produit de a sous entité à projet forgé ${suffix}`,
    entityId: leakedProjectEntityId,
  });

  await db.insert(projects).values({
    domainId: b.domainId,
    name: `Projet forgé sous produit de a ${suffix}`,
    productId: cleanProduct.id,
    statusId: leakedDomainStatusId,
    lastActivityAt: STALE_TAIL_AT,
  });
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

/* ==========================================================================
   T6.7 — la répartition, la fraîcheur, les décomptes

   **Un constat traverse les trois : le chiffre et la liste disent la même
   chose.** C'est le seul qui prouve qu'un décompte ne ment pas — un décompte
   juste sur un filtre qui ne l'est pas est un mensonge que rien d'autre ne
   détecte (fiche T6.7). Il est **global par construction** : toute divergence
   le fait tomber, et c'est précisément le cas que la fiche désigne pour les
   filtres d'archivage. L'isolement se mesure donc parmi les constats **ciblés**,
   chacun visant un `filter()` et un seul.
   ========================================================================== */

/** L'entrée d'une dimension, cherchée par identifiant et jamais par position. */
function entryFor<T extends { id: string }>(
  entries: T[],
  id: string,
): T | undefined {
  return entries.find((entry) => entry.id === id);
}

describe("listProjectDistribution", () => {
  test("le décompte de chaque statut est le nombre de lignes que son filtre rend", async () => {
    const { statuses } = await listProjectDistribution(a.scope);

    // **Le constat central du ticket.** Il ne compare pas à un nombre écrit
    // ici — un nombre écrit à la main ne dirait que ce que l'auteur croyait —
    // mais à ce que `/accompagnements?statut=…` rendra vraiment.
    for (const entry of statuses) {
      const rows = await listProjects(a.scope, { statusId: entry.id });
      expect(entry.count).toBe(rows.length);
    }

    // Et la lecture n'est pas vide, sans quoi la boucle ci-dessus passerait
    // sur un tableau sans rien mesurer.
    expect(statuses.length).toBeGreaterThan(0);
  });

  test("le décompte de chaque approche est le nombre de lignes que son filtre rend", async () => {
    const { approaches: rows } = await listProjectDistribution(a.scope);

    for (const entry of rows) {
      const projectRows = await listProjects(a.scope, { approachId: entry.id });
      expect(entry.count).toBe(projectRows.length);
    }

    expect(rows.length).toBeGreaterThan(0);
  });

  test("une valeur de référentiel sans projet rend zéro, et elle est rendue", async () => {
    const { statuses, approaches: rows } = await listProjectDistribution(
      a.scope,
    );

    // C'est l'écart assumé avec `listProjectFilterOptions`, qui n'offre que ce
    // qui ramène quelque chose : la répartition **décrit une distribution**,
    // elle ne propose pas des chemins. Un statut du domaine absent de la
    // lecture se lirait comme un statut qui n'existe pas.
    expect(entryFor(statuses, emptyStatusId)?.count).toBe(0);
    expect(entryFor(rows, emptyApproachId)?.count).toBe(0);
  });

  test("un projet à deux approches compte dans les deux", async () => {
    const { approaches: rows } = await listProjectDistribution(a.scope);

    // La somme des approches dépasse donc le nombre de projets, et c'est le
    // comportement du filtre. Aucune somme n'est affichée : un total
    // inviterait à en faire un pourcentage, que la fiche interdit.
    expect(entryFor(rows, usedApproachId)?.count).toBe(2);
    expect(entryFor(rows, sharedApproachId)?.count).toBe(1);
  });

  /* ------------------------------------------------------------------------
     L'entité — la dimension que T7.2 ouvre, et le seul constat qui prouve
     quoi que ce soit : **suivre le lien rend exactement ce nombre de lignes.**
     ------------------------------------------------------------------------ */

  test("le décompte de chaque entité est le nombre de lignes que son filtre rend", async () => {
    const { entities: rows } = await listProjectDistribution(a.scope);

    // Le contrat du ticket. Il ne compare à aucun nombre écrit ici — un nombre
    // écrit à la main ne dirait que ce que l'auteur croyait — mais à ce que
    // `/accompagnements?entite=…` rendra vraiment. Un décompte juste sur un filtre qui
    // ne l'est pas est un mensonge que rien d'autre ne détecte.
    for (const entry of rows) {
      const projectRows = await listProjects(a.scope, { entityId: entry.id });
      expect(entry.count).toBe(projectRows.length);
    }

    // La fiche demande **trois** valeurs au moins, dont une à zéro : la boucle
    // ci-dessus ne dirait rien sur un tableau court.
    expect(rows.length).toBeGreaterThanOrEqual(3);
    expect(rows.some((entry) => entry.count === 0)).toBe(true);
    expect(rows.some((entry) => entry.count > 0)).toBe(true);
  });

  test("une entité sans aucun produit rend zéro, et elle est rendue", async () => {
    const { entities: rows } = await listProjectDistribution(a.scope);

    // Le `leftJoin` de la chaîne, et non un `innerJoin` : une entité qui ne
    // porte rien reste une entité du domaine.
    expect(entryFor(rows, emptyEntityId)?.count).toBe(0);
  });

  test("une entité archivée sans projet n'est pas rendue", async () => {
    const { entities: rows } = await listProjectDistribution(a.scope);

    expect(entryFor(rows, archivedEmptyEntityId)).toBeUndefined();
  });

  test("une entité archivée qui porte des projets est rendue", async () => {
    const { entities: rows } = await listProjectDistribution(a.scope);

    expect(entryFor(rows, archivedUsedEntityId)?.count).toBe(1);

    // Et c'est bien **ce** projet-là que le chiffre compte.
    const projectRows = await listProjects(a.scope, {
      entityId: archivedUsedEntityId,
    });
    expect(projectRows.map((row) => row.id)).toEqual([keptEntityProjectId]);
  });

  test("l'ordre des entités est celui du référentiel, jamais celui du décompte", async () => {
    const { entities: rows } = await listProjectDistribution(a.scope);
    const ranks = rows.map((entry) => entry.id);

    // L'entité d'amorçage est en position 0 et porte des projets ; celle sans
    // produit est en 1 et n'en porte aucun. Trier par nombre les inverserait.
    expect(ranks.indexOf(a.entityId)).toBeLessThan(ranks.indexOf(emptyEntityId));
    expect(ranks.indexOf(emptyEntityId)).toBeLessThan(
      ranks.indexOf(archivedUsedEntityId),
    );
  });

  test("une entité d'un autre domaine n'entre pas — `filter(entities)`", async () => {
    const { entities: rows } = await listProjectDistribution(a.scope);

    expect(rows.map((entry) => entry.id)).not.toContain(b.entityId);
  });

  test("un produit d'un autre domaine ne rattache rien — `filter(products)`", async () => {
    const { entities: rows } = await listProjectDistribution(a.scope);

    // Le projet qu'il porte est pourtant de `a` : c'est le produit, et lui
    // seul, qui coupe la chaîne. Retirer `filter(projects)` ne rend pas ce
    // décompte non nul.
    expect(entryFor(rows, leakedProductEntityId)?.count).toBe(0);
  });

  test("un projet d'un autre domaine ne se compte pas — `filter(projects)`", async () => {
    const { entities: rows } = await listProjectDistribution(a.scope);

    // L'inverse du précédent : le produit est de `a` et vivant, seul le projet
    // est d'ailleurs.
    expect(entryFor(rows, leakedProjectEntityId)?.count).toBe(0);
  });

  test("une valeur de référentiel archivée sans projet n'est pas rendue", async () => {
    const { statuses } = await listProjectDistribution(a.scope);

    // Du vocabulaire retiré : le montrer rouvrirait un choix que le domaine a
    // fermé.
    expect(entryFor(statuses, archivedEmptyStatusId)).toBeUndefined();
  });

  test("une valeur de référentiel archivée qui porte des projets est rendue", async () => {
    const { statuses } = await listProjectDistribution(a.scope);

    // L'autre moitié de la règle, et la plus importante : ces projets comptent
    // dans la liste transverse. Taire leur statut ferait de la répartition une
    // lecture **incomplète en silence** — et comme aucune somme n'est
    // affichée, personne ne verrait l'écart.
    expect(entryFor(statuses, archivedUsedStatusId)?.count).toBe(1);

    // Et c'est bien **ce** projet-là que le chiffre compte : un décompte juste
    // sur les mauvaises lignes ne serait pas un décompte.
    const rows = await listProjects(a.scope, { statusId: archivedUsedStatusId });
    expect(rows.map((row) => row.id)).toEqual([keptProjectId]);
  });

  test("l'ordre est celui du référentiel du domaine, jamais celui du décompte", async () => {
    const { statuses } = await listProjectDistribution(a.scope);
    const ranks = statuses.map((entry) => entry.id);

    // `position` d'abord — trier par nombre ferait de la répartition un
    // classement, et le rang deviendrait une lecture (`docs/06` §10). Le
    // statut d'amorçage est en position 1, le statut vide en 2 : le second
    // porte pourtant zéro projet et reste après le premier.
    expect(ranks.indexOf(a.statusId)).toBeLessThan(ranks.indexOf(emptyStatusId));
    expect(ranks.indexOf(emptyStatusId)).toBeLessThan(
      ranks.indexOf(archivedUsedStatusId),
    );
  });

  /* ------------------------------------------------------------------------
     Les étanchéités de la répartition. Chacune vise **un seul** `filter()`,
     sur une valeur de référentiel qui ne sert qu'à elle.

     **Sans le compte** : il disait « quatre » pour cinq, et T7.2 en ajoute
     trois — un nombre dans un commentaire vieillit à chaque ticket, et c'est
     le geste de T6.1 sur `scoped.ts`, resservi ici.
     ------------------------------------------------------------------------ */

  test("un statut d'un autre domaine n'entre pas — `filter(projectStatuses)`", async () => {
    const { statuses } = await listProjectDistribution(a.scope);

    expect(statuses.map((entry) => entry.id)).not.toContain(b.statusId);
  });

  test("une approche d'un autre domaine n'entre pas — `filter(approaches)`", async () => {
    const { approaches: rows } = await listProjectDistribution(a.scope);

    expect(rows.map((entry) => entry.id)).not.toContain(otherDomainApproachId);
  });

  test("un projet d'un autre domaine ne se compte pas — `filter(projects)`", async () => {
    const { statuses } = await listProjectDistribution(a.scope);

    // Le statut n'existe que pour cette ligne forgée : son décompte est zéro,
    // et il ne peut le cesser que si `filter(projects)` disparaît.
    expect(entryFor(statuses, leakedDomainStatusId)?.count).toBe(0);
  });

  test("un projet sous un produit d'un autre domaine ne se compte pas — `filter(products)`", async () => {
    const { statuses } = await listProjectDistribution(a.scope);

    expect(entryFor(statuses, leakedProductStatusId)?.count).toBe(0);
  });

  test("une liaison d'un autre domaine ne rattache rien — `filter(projectApproaches)`", async () => {
    const { approaches: rows } = await listProjectDistribution(a.scope);

    // Les deux extrémités de la liaison sont de `a` : seule la ligne de
    // liaison est d'ailleurs. Une table de liaison est une table du domaine
    // comme les autres, et l'oublier laisserait un projet d'ailleurs rattacher
    // une approche d'ici.
    expect(entryFor(rows, leakedLinkApproachId)?.count).toBe(0);
  });
});

describe("listStaleProjects", () => {
  test("le seuil sépare, et le même projet passe d'un côté puis de l'autre", async () => {
    const day = 24 * 60 * 60 * 1000;

    const before = await listStaleProjects(
      a.scope,
      new Date(SLEEPY_AT.getTime() - day),
    );
    const after = await listStaleProjects(
      a.scope,
      new Date(SLEEPY_AT.getTime() + day),
    );

    // **Un seul projet des deux côtés**, et c'est le seul montage où un seuil
    // décalé fait tomber un constat : deux projets, l'un ancien l'autre
    // récent, se laisseraient traverser par un mauvais seuil.
    expect(before.map((row) => row.id)).not.toContain(sleepyProjectId);
    expect(after.map((row) => row.id)).toContain(sleepyProjectId);
  });

  test("un projet sans aucune activité y figure", async () => {
    const rows = await listStaleProjects(a.scope);
    const row = entryFor(rows, a.projectId);

    // « Aucune activité » est un fait, pas un retard (arbitrage (h)). La
    // requête rend `null` ; la phrase appartient à l'écran.
    expect(row).toBeDefined();
    expect(row?.lastActivityAt).toBeNull();
  });

  test("un projet dont l'activité est récente n'y figure pas", async () => {
    const rows = await listStaleProjects(a.scope);

    // Le seuil par défaut, celui que la page emploie. Le témoin est daté de
    // l'instant du semis : il est dans le mois écoulé quel que soit le jour où
    // le test tourne.
    expect(rows.map((row) => row.id)).not.toContain(freshProjectId);
  });

  test("les projets sans activité viennent en tête, puis du plus ancien au plus récent", async () => {
    const rows = await listStaleProjects(a.scope);
    const ranks = rows.map((row) => row.id);

    // Un tri, jamais un classement : aucun rang ne se rend, rien ne se compare
    // d'une ligne à l'autre. L'ordre existe parce qu'un plafond doit décider
    // qui entre.
    expect(ranks.indexOf(a.otherProjectId)).toBeLessThan(
      ranks.indexOf(a.projectId),
    );
    expect(ranks.indexOf(a.projectId)).toBeLessThan(
      ranks.indexOf(sleepyProjectId),
    );
  });

  test("le plafond borne la liste, et il retient les plus anciens", async () => {
    const rows = await listStaleProjects(a.scope, staleBefore(), 2);

    // Deux constats en un, comme au plafond du flux : un plafond qui rendrait
    // le bon nombre de mauvaises lignes ne serait pas un plafond.
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.id)).toEqual([a.otherProjectId, a.projectId]);
  });

  test("un projet archivé n'y figure pas", async () => {
    const rows = await listStaleProjects(a.scope);

    // Un accompagnement rangé n'est pas un accompagnement qui dort.
    expect(rows.map((row) => row.id)).not.toContain(archivedProjectId);
  });

  test("un projet sous un produit archivé n'y figure pas", async () => {
    const rows = await listStaleProjects(a.scope);

    // Il est pourtant vivant, et sa dernière activité est bien ancienne : seul
    // `isNull(products.archivedAt)` l'écarte. C'est la condition de
    // `listProjects`, tenue à la lettre.
    expect(rows.map((row) => row.id)).not.toContain(orphanProjectId);
  });

  test("un domaine dont rien ne dort rend un tableau vide", async () => {
    // L'état vide appartient à l'écran. Dans `c`, dont les deux projets ont
    // reçu l'instant du semis pour dernière activité.
    const rows = await listStaleProjects(c.scope);

    expect(rows).toEqual([]);
  });

  test("un projet d'un autre domaine n'y figure pas — `filter(projects)`", async () => {
    const rows = await listStaleProjects(a.scope);

    expect(rows.map((row) => row.id)).not.toContain(leakedDomainProjectId);
  });

  test("un projet sous un produit d'un autre domaine n'y figure pas — `filter(products)`", async () => {
    const rows = await listStaleProjects(a.scope);

    expect(rows.map((row) => row.id)).not.toContain(leakedProductProjectId);
  });

  test("un accompagnement terminé n'y figure pas", async () => {
    const rows = await listStaleProjects(a.scope);

    // Il dormirait sans sa nature : dernière activité ancienne, produit
    // vivant, pas archivé. Un accompagnement terminé n'est pas un
    // accompagnement qui s'endort (31/08/2026).
    expect(rows.map((row) => row.id)).not.toContain(doneProjectId);
  });

  test("un accompagnement en cours à la même date, lui, y figure", async () => {
    const rows = await listStaleProjects(a.scope);

    // L'autre moitié de la règle, et c'est elle qui prouve que l'exclusion
    // porte sur la **nature** et non sur la date : `sleepyProjectId` est plus
    // ancien encore, et il entre. Sans ce constat, un `ne()` devenu `eq()` —
    // ou une clause qui viderait la liste — passerait au vert.
    expect(rows.map((row) => row.id)).toContain(sleepyProjectId);
  });

  test("un projet dont le statut est d'un autre domaine n'y figure pas — `filter(projectStatuses)`", async () => {
    /* **La seule ligne forgée du fichier qui vive dans son test**, et la
       raison est mesurée : un projet de `a` posé sur un statut de `b` est
       écarté par la fraîcheur et par `listProjects`, mais **compté** par
       `countProjects` et par la répartition par entité, qui ne rejouent pas la
       jointure de statut de leur liste. Laissée dans le semis, elle faisait
       tomber deux constats voisins qui n'éprouvent pas ce filtre-ci — une
       chute non isolée ne désigne plus le filtre qu'elle vise (leçon de T6.3).
       L'écart des deux décomptes est consigné dans `JOURNAL-TECHNIQUE.md`.

       Sa nature est `active`, celle du statut d'amorçage de `b` : `done`
       l'écarterait en amont, et le `filter()` visé passerait au vert une fois
       retiré. */
    const forged = await db
      .insert(projects)
      .values({
        domainId: a.domainId,
        name: `Fuite de projet par le statut ${suffix}`,
        productId: a.productId,
        statusId: b.statusId,
        lastActivityAt: STALE_TAIL_AT,
      })
      .returning({ id: projects.id });
    const forgedId = forged[0]!.id;

    try {
      const rows = await listStaleProjects(a.scope);

      // Le projet est de `a`, son produit aussi, sa nature est `active` :
      // seule la jointure filtrée l'écarte. C'est la clause qu'ajoute la
      // restriction de nature, et elle porte son `filter()` comme toute table
      // jointe.
      expect(rows.map((row) => row.id)).not.toContain(forgedId);
    } finally {
      // `finally` : un constat qui tombe ne doit pas laisser la ligne derrière
      // lui, sans quoi la chute suivante serait celle du voisin.
      await db.delete(projects).where(eq(projects.id, forgedId));
    }
  });
});

describe("staleBefore", () => {
  test("recule d'un mois, à la seconde près", async () => {
    expect(staleBefore(new Date("2026-08-27T09:30:15Z")).toISOString()).toBe(
      "2026-07-27T09:30:15.000Z",
    );
  });

  test("rabat sur le dernier jour quand le jour n'existe pas dans le mois visé", async () => {
    // Sans le rabattement, `setUTCMonth` reporte les jours en trop sur le mois
    // suivant : le 31 mars deviendrait le 3 mars, et « plus d'un mois »
    // avancerait de trois jours sans jamais lever d'erreur.
    expect(staleBefore(new Date("2026-03-31T09:00:00Z")).toISOString()).toBe(
      "2026-02-28T09:00:00.000Z",
    );
  });

  test("traverse le changement d'année", async () => {
    expect(staleBefore(new Date("2026-01-15T00:00:00Z")).toISOString()).toBe(
      "2025-12-15T00:00:00.000Z",
    );
  });
});

describe("countProjects / countProducts", () => {
  test("le décompte des projets est le nombre de lignes de la liste transverse", async () => {
    // Le contrat de la répartition, appliqué à l'entrée qui ne pose aucun
    // filtre : suivre le lien rend exactement ce nombre.
    const rows = await listProjects(a.scope);

    expect(await countProjects(a.scope)).toBe(rows.length);
    expect(rows.length).toBeGreaterThan(0);
  });

  test("le décompte des produits est le nombre de lignes de la liste des produits", async () => {
    const rows = await listProductsWithCounts(a.scope);

    expect(await countProducts(a.scope)).toBe(rows.length);
    expect(rows.length).toBeGreaterThan(0);
  });

  test("un produit dont l'entité est d'un autre domaine ne se compte pas — `filter(entities)`", async () => {
    // Le produit est de `a` et vivant : seule son entité est d'ailleurs. C'est
    // la jointure de `listProductsWithCounts`, et le décompte la rejoue —
    // sans quoi le chiffre dirait un de plus que la liste.
    const rows = await listProductsWithCounts(a.scope);

    expect(rows.map((row) => row.id)).not.toContain(leakedEntityProductId);
    expect(await countProducts(a.scope)).toBe(rows.length);
  });

  test("les décomptes n'ont pas d'autre domaine que le leur", async () => {
    // `c` porte exactement ce que `seedDomain` sème : deux projets, un produit.
    // Une fuite de domaine s'y verrait immédiatement.
    expect(await countProjects(c.scope)).toBe(2);
    expect(await countProducts(c.scope)).toBe(1);
  });
});
