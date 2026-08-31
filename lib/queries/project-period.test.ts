/**
 * **La période d'un accompagnement se déduit de ses activités.**
 *
 * C'est la règle posée le 31/08/2026, quand `projects.started_on` et
 * `projects.expected_end_on` ont été supprimées (migration `0012`). Elle vit
 * dans `lib/queries/project-period.ts`, et cinq lectures la joignent.
 *
 * **Elle s'éprouve à travers `listProductProjects` et `findAccompanimentRank`**,
 * et non sur la sous-requête nue : ce sont ces deux-là que l'écran appelle, et
 * une règle qui ne serait juste que hors de sa jointure ne protégerait rien.
 *
 * Le fichier tourne sur la branche Neon dédiée — `vitest.config.mts` remappe
 * `DATABASE_URL` sur `TEST_DATABASE_URL` — et écrit réellement : un `min` sur
 * un `coalesce` et un `filter` dans une sous-requête ne se vérifient pas sur un
 * faux.
 */

import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { db } from "@/lib/db/client";
import { forDomain, superAdmin, type ScopedDb } from "@/lib/db/scoped";
import {
  activities,
  activityTypes,
  domains,
  entities,
  products,
  projectStatuses,
  projects,
} from "@/lib/db/schema";

import { listProductProjects } from "./products";
import { findAccompanimentRank } from "./projects";

/** Enfants d'abord, parents ensuite : `domains` refuse la suppression sinon. */
const teardownOrder = [
  activities,
  activityTypes,
  projects,
  products,
  projectStatuses,
  entities,
];

type Fixture = {
  domainId: string;
  scope: ScopedDb;
  productId: string;
  statusId: string;
  activityTypeId: string;
  /** Les trois activités de l'exemple, écrites à rebours de leur ordre. */
  threeActivitiesId: string;
  /** Une activité datée, une « à planifier » : la seconde ne pèse pas. */
  unscheduledId: string;
  /** Une activité datée, une annulée bien plus large. */
  cancelledId: string;
  /** Une activité datée, une archivée bien plus large. */
  archivedActivityId: string;
  /** Une seule activité, qui n'a qu'une fin. */
  endOnlyId: string;
  /** Aucune activité du tout (D7). */
  emptyId: string;
  /** Des activités, mais **aucune planifiée** : le cas de D14 à l'échelle du
      projet entier. */
  unplannedId: string;
  /** Celui sur lequel une activité d'un autre domaine sera forgée. */
  forgedId: string;
  /* **Les deux bornes de la chronologie du produit**, hors de portée de toute
     neutralisation : les périodes des six témoins ci-dessus tiennent toutes
     dans l'année 2026, quelle que soit la clause qu'on retire. Sans elles, une
     mise en défaut déplacerait l'extrémité que le rang lit, et ferait tomber
     deux tests au lieu d'un. */
  firstId: string;
  lastId: string;
};

const suffix = Math.random().toString(36).slice(2, 10);
let a: Fixture;
let b: Fixture;

/* Les identifiants de domaine sont retenus **dès la création**, hors de la
   fixture : un `beforeAll` qui échoue après avoir créé son domaine le
   laisserait en place, et ferait tomber le fichier suivant. C'est la forme
   posée par `equipe/actions.test.ts`. */
const createdDomainIds: string[] = [];

async function seedDomain(label: string): Promise<Fixture> {
  const domain = await superAdmin.createDomain({
    name: `__test__period__${label}__${suffix}`,
    competenceCenterName: `Centre ${label}`,
  });
  createdDomainIds.push(domain.id);
  const scope = forDomain({ domainId: domain.id });

  const entity = await scope.insert(entities, {
    label: `Entité ${label}`,
    position: "1",
  });
  const product = await scope.insert(products, {
    name: `Produit ${label}`,
    entityId: entity.id,
  });
  const status = await scope.insert(projectStatuses, {
    label: `En cours ${label}`,
    nature: "active",
    position: "1",
  });
  const activityType = await scope.insert(activityTypes, {
    label: `Atelier ${label}`,
    family: "framing",
  });

  const project = async (name: string) =>
    scope.insert(projects, {
      name: `${name} ${label}`,
      productId: product.id,
      statusId: status.id,
    });

  /** Une activité, dont chaque test ne dérange que ce qu'il veut. */
  const activity = async (
    projectId: string,
    values: {
      periodStart?: string;
      periodEnd?: string;
      state?: "planned" | "in_progress" | "done" | "cancelled";
      isUnscheduled?: boolean;
      cancellationReason?: string;
    },
  ) =>
    scope.insert(activities, {
      projectId,
      activityTypeId: activityType.id,
      state: values.state ?? "planned",
      ...(values.periodStart ? { periodStart: values.periodStart } : {}),
      ...(values.periodEnd ? { periodEnd: values.periodEnd } : {}),
      ...(values.isUnscheduled ? { isUnscheduled: true } : {}),
      ...(values.cancellationReason
        ? { cancellationReason: values.cancellationReason }
        : {}),
    });

  /* --- L'exemple de la demande, écrit à rebours de son ordre -------------- */

  const three = await project("Trois activités");
  await activity(three.id, {
    periodStart: "2026-04-01",
    periodEnd: "2026-06-12",
    state: "done",
  });
  await activity(three.id, { periodStart: "2026-02-01" });
  await activity(three.id, {
    periodStart: "2026-02-15",
    periodEnd: "2026-03-15",
    state: "done",
  });

  /* --- Les quatre cas qui ne doivent pas peser --------------------------- */

  const unscheduled = await project("À planifier");
  await activity(unscheduled.id, {
    periodStart: "2026-05-01",
    periodEnd: "2026-05-31",
    state: "done",
  });
  await activity(unscheduled.id, { isUnscheduled: true });

  const cancelled = await project("Annulée");
  await activity(cancelled.id, {
    periodStart: "2026-05-01",
    periodEnd: "2026-05-31",
    state: "done",
  });
  await activity(cancelled.id, {
    periodStart: "2026-01-01",
    periodEnd: "2026-12-31",
    state: "cancelled",
    cancellationReason: "Reportée sine die",
  });

  const archivedActivity = await project("Archivée");
  await activity(archivedActivity.id, {
    periodStart: "2026-05-01",
    periodEnd: "2026-05-31",
    state: "done",
  });
  const rangee = await activity(archivedActivity.id, {
    periodStart: "2026-01-01",
    periodEnd: "2026-12-31",
    state: "done",
  });
  await scope.archive(activities, rangee.id);

  /* Une activité `done` qui n'a **que** sa fin : le schéma l'autorise —
     `activities_planned_requires_period_or_unscheduled` ne vaut que pour
     `planned` —, et c'est le cas que le `coalesce` existe pour. */
  const endOnly = await project("Fin seule");
  await activity(endOnly.id, { periodEnd: "2026-07-31", state: "done" });

  const empty = await project("Sans activité");

  /* Un accompagnement qui a des activités, mais **aucune planifiée**. Il n'est
     pas le même cas qu'`empty` : sa ligne existe dans le regroupement, avec ses
     deux bornes nulles. Le `leftJoin` ne l'écarte donc de rien, et c'est
     `isNotNull` qui doit lui refuser un rang. */
  const unplanned = await project("Rien de planifié");
  await activity(unplanned.id, { isUnscheduled: true });
  await activity(unplanned.id, { isUnscheduled: true });

  const forged = await project("Sonde de domaine");
  await activity(forged.id, {
    periodStart: "2026-05-01",
    periodEnd: "2026-05-31",
    state: "done",
  });

  /* Les deux bornes de la chronologie : elles n'éprouvent aucune clause, elles
     tiennent les extrémités pendant qu'on retire les autres. */
  const firstProject = await project("Ouverture");
  await activity(firstProject.id, {
    periodStart: "2025-01-01",
    periodEnd: "2025-01-31",
    state: "done",
  });
  const lastProject = await project("Clôture");
  await activity(lastProject.id, {
    periodStart: "2027-12-01",
    periodEnd: "2027-12-31",
    state: "done",
  });

  return {
    domainId: domain.id,
    scope,
    productId: product.id,
    statusId: status.id,
    activityTypeId: activityType.id,
    threeActivitiesId: three.id,
    unscheduledId: unscheduled.id,
    cancelledId: cancelled.id,
    archivedActivityId: archivedActivity.id,
    endOnlyId: endOnly.id,
    emptyId: empty.id,
    unplannedId: unplanned.id,
    forgedId: forged.id,
    firstId: firstProject.id,
    lastId: lastProject.id,
  };
}

beforeAll(async () => {
  a = await seedDomain("a");
  b = await seedDomain("b");

  /* Une activité **de `b`** posée sur un projet **de `a`**. Seul `domain_id`
     franchit la frontière ; sa période déborde des deux côtés celle du projet,
     donc seul le `filter(activities)` **dans la sous-requête** l'en empêche. Le `leftJoin` n'y peut rien : il joint sur le projet, pas sur le
     domaine. Écrite en direct, hors de la couche scopée, qui la refuserait. */
  await db.insert(activities).values({
    domainId: b.domainId,
    projectId: a.forgedId,
    activityTypeId: b.activityTypeId,
    state: "done",
    periodStart: "2026-01-01",
    periodEnd: "2026-12-31",
  });
}, 120_000);

afterAll(async () => {
  if (createdDomainIds.length === 0) return;
  for (const table of teardownOrder) {
    await db.delete(table).where(inArray(table.domainId, createdDomainIds));
  }
  await db.delete(domains).where(inArray(domains.id, createdDomainIds));
});

/** La période telle que la page produit la reçoit, par identifiant de projet. */
async function periodOf(projectId: string) {
  const rows = await listProductProjects(a.scope, a.productId);
  const row = rows.find((entry) => entry.id === projectId);
  return { start: row?.periodStart ?? null, end: row?.periodEnd ?? null };
}

describe("la période se déduit des activités", () => {
  test("le début est la plus petite date, la fin la plus grande", async () => {
    /* L'exemple de la demande, mot pour mot : cadrage au 1er février,
       recherche du 15 février au 15 mars, prototype du 1er avril au 12 juin.
       L'accompagnement court donc du 1er février au 12 juin — et les trois
       activités ont été écrites dans le désordre, pour que ce soit `min` et
       `max` qui répondent et non l'ordre d'insertion. */
    expect(await periodOf(a.threeActivitiesId)).toEqual({
      start: "2026-02-01",
      end: "2026-06-12",
    });
  });

  test("une activité « à planifier » ne déplace aucune borne", async () => {
    /* D14. Ses deux dates sont nulles : `min` et `max` les ignorent, et aucune
       clause n'a eu à être écrite pour elle. C'est cette propriété-là qu'on
       vérifie, pas une ligne de code. */
    expect(await periodOf(a.unscheduledId)).toEqual({
      start: "2026-05-01",
      end: "2026-05-31",
    });
  });

  test("une activité annulée ne déplace aucune borne", async () => {
    // Sa période va de 2020 à 2030 : si elle comptait, elle se verrait.
    expect(await periodOf(a.cancelledId)).toEqual({
      start: "2026-05-01",
      end: "2026-05-31",
    });
  });

  test("une activité archivée ne déplace aucune borne", async () => {
    // Même période de 2020 à 2030, et même conclusion.
    expect(await periodOf(a.archivedActivityId)).toEqual({
      start: "2026-05-01",
      end: "2026-05-31",
    });
  });

  test("une activité qui n'a qu'une fin porte les deux bornes", async () => {
    /* Le `coalesce` dans les deux sens. Sans lui, le début serait nul et la
       fin ne le serait pas — un accompagnement à moitié daté, que la frise ne
       saurait pas placer. */
    expect(await periodOf(a.endOnlyId)).toEqual({
      start: "2026-07-31",
      end: "2026-07-31",
    });
  });

  test("un accompagnement dont rien n'est planifié n'a pas de période", async () => {
    /* Deux activités, toutes deux « à planifier » (D14). C'est le cas que la
       demande nomme : tant qu'aucune date n'est posée, il n'y a pas de période
       à afficher — et surtout aucune à inventer. */
    expect(await periodOf(a.unplannedId)).toEqual({ start: null, end: null });
  });

  test("un accompagnement sans aucune activité n'a pas de période", async () => {
    /* D7 — un projet peut être créé sans aucune activité. Il reste dans la
       liste, sans période : c'est le `leftJoin`, et c'est aussi ce que la frise
       lit pour le ranger parmi les accompagnements sans date. */
    expect(await periodOf(a.emptyId)).toEqual({ start: null, end: null });
  });

  test("une activité d'un autre domaine ne déplace aucune borne", async () => {
    /* Règle 1, **à l'intérieur de la sous-requête**. L'activité forgée court de
       2000 à 2030 sur ce projet : sans `filter(activities)` dans le `where` de
       `projectPeriods`, elle écraserait les deux bornes. Le `leftJoin` ne
       protège rien ici — il joint sur le projet. */
    expect(await periodOf(a.forgedId)).toEqual({
      start: "2026-05-01",
      end: "2026-05-31",
    });
  });
});

describe("l'ordre de la page produit et le rang d'accompagnement", () => {
  test("la liste sort du plus récent au plus ancien, le non daté en dernier", async () => {
    const rows = await listProductProjects(a.scope, a.productId);

    /* **L'ordre se lit sur la suite des débuts, pas sur celle des noms** :
       plusieurs accompagnements partagent le 1er mai 2026, et c'est alors le
       nom qui départage — une comparaison de chaînes accentuées dont le
       résultat appartient à la collation de la base, pas à cette règle. Ce que
       ce test tient est la clause `desc nulls last`, et elle seule. */
    const starts = rows.map((row) => row.periodStart);
    const dated = starts.filter((start): start is string => start !== null);

    expect(dated).toEqual([...dated].sort().reverse());
    expect(starts.slice(dated.length).every((start) => start === null)).toBe(
      true,
    );

    expect(rows[0]?.name).toBe("Clôture a");
    expect(rows.at(-1)?.name).toBe("Sans activité a");
  });

  test("le rang court à l'envers de la liste, sur la même expression", async () => {
    /* **La même expression dérivée des deux côtés**, ce qui rend la
       contradiction impossible plutôt qu'improbable. La liste ouvre par le plus
       récent, le rang compte depuis le plus ancien : le premier de la liste
       porte donc le dernier rang, et le dernier daté porte le premier.

       Les deux nombres se lisent **dans la lecture elle-même** et non dans la
       fixture : ce test dit un miroir, il ne dit aucune date. C'est ce qui le
       laisse debout quand une clause est neutralisée ailleurs — seul le test de
       cette clause doit alors tomber.

       Les accompagnements qui se tiennent à la même date ne sont pas
       interrogés : leur rang dépend du même départage par le nom, et ce n'est
       pas ce qui se vérifie ici. */
    const rows = await listProductProjects(a.scope, a.productId);
    const dated = rows.filter((row) => row.periodStart !== null);

    const rank = (id: string) =>
      findAccompanimentRank(a.scope, { id, productId: a.productId });

    expect(await rank(a.lastId)).toBe(dated.length);
    expect(await rank(a.firstId)).toBe(1);
  });

  test("un accompagnement sans activité datée n'a pas de rang", async () => {
    const rank = (id: string) =>
      findAccompanimentRank(a.scope, { id, productId: a.productId });

    /* **Les deux absences, et elles ne se ressemblent pas.** Celui qui n'a
       aucune activité n'a pas de ligne dans le regroupement — la jointure
       suffit à l'écarter. Celui dont rien n'est planifié en a une, avec ses
       deux bornes nulles : seul `isNotNull(periods.periodStart)` l'écarte, et
       sans lui il ouvrirait la chronologie du produit, `null` venant en tête
       d'un tri ascendant sous PostgreSQL. */
    expect(await rank(a.emptyId)).toBeNull();
    expect(await rank(a.unplannedId)).toBeNull();
  });
});
