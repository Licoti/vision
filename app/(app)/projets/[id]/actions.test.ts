/**
 * Les tests de `createActivity` et `updateActivity` — **le droit s'éprouve par
 * l'action** (21/08/2026).
 *
 * `CLAUDE.md` pose la discipline en toutes lettres : « un panneau absent du
 * rendu n'a jamais protégé le point d'entrée HTTP qui l'accompagne ». Le
 * panneau de saisie d'activité ne se monte que pour qui peut écrire dans
 * l'accompagnement, et cela ne prouve rien : les identifiants liés d'une action
 * serveur sont sérialisés en clair dans un champ `$ACTION_…`, réécrivable.
 *
 * **Premier fichier de tests d'action de `projets/`**, et il arrive avec la
 * colonne `activities.external_url` — un champ de plus sur un point d'entrée
 * qui existait déjà. C'est précisément ce que ces tests éprouvent : le champ
 * neuf n'ouvre aucune porte, il passe par `openProject` comme les sept autres.
 *
 * **T6.2 y ajoute les onze gestes du journal** — cinq sur l'activité, trois sur
 * la ressource, trois sur le résultat. Le critère de la fiche **se compte en
 * base**, l'écran ne portant encore rien : après chaque geste, une ligne
 * d'`events` et une seule, avec son verbe, son `target_type`, son `target_id`,
 * son acteur et sa phrase. `written()` prend le décompte avant et rend la
 * tranche écrite — exiger le nombre *et* lire ce qu'il porte, sans relire la
 * table deux fois.
 *
 * **Ce qui est mesuré est la base, jamais le chemin pris.** Un refus se lit à
 * ce qu'aucune ligne n'a bougé ; une écriture, à ce que la colonne porte la
 * valeur attendue. `ok` et `message` sont des indices, la table est la preuve.
 *
 * Deux modules de Next sont remplacés, et deux seulement : `next/headers`, dont
 * le cookie désigne la personne courante au POC, et `next/cache`, dont la
 * revalidation n'a aucun sens hors d'un rendu. Rien d'autre — la base est
 * réelle, les portes sont les vraies, `requireSession` fait son travail entier.
 * Aucun `next/navigation` : ces deux actions ne redirigent pas (TD.2).
 */

import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import { db } from "@/lib/db/client";
import { forDomain, superAdmin, type ScopedDb } from "@/lib/db/scoped";
import {
  activities,
  activityTypes,
  domains,
  entities,
  events,
  persons,
  products,
  projectMembers,
  projectStatuses,
  projects,
  resources,
  results,
} from "@/lib/db/schema";

/** Qui la requête prétend être. Chaque test la pose avant d'appeler l'action. */
let currentPerson: string | null = null;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "vision_person" && currentPerson
        ? { name, value: currentPerson }
        : undefined,
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const {
  createActivity,
  updateActivity,
  transitionActivity,
  cancelActivity,
  archiveActivity,
  createResource,
  updateResource,
  archiveResource,
  createResult,
  updateResult,
  archiveResult,
} = await import("./actions");

const suffix = Math.random().toString(36).slice(2, 10);

const LINK = "https://ergonome.example.com/audits/eprouve";

/**
 * L'insécable de `lib/journal.ts`, **en échappement**.
 *
 * Écrit en caractère, il est indiscernable d'une espace ordinaire dans un
 * fichier source : un test qui attendrait la seconde passerait le jour où la
 * règle sauterait, et celui qui la lirait ne saurait pas laquelle il attend.
 */
const NBSP = "\u00A0";

type Fixture = {
  domainId: string;
  scope: ScopedDb;
  contributorId: string;
  outsiderId: string;
  projectId: string;
  archivedProjectId: string;
  typeId: string;
  /** Le libellé du type, celui que le journal fige — T6.2. */
  typeLabel: string;
  /** Une activité vivante du projet ouvert, pour éprouver la correction. */
  activityId: string;
};

let f: Fixture;

/**
 * Le domaine créé, **retenu hors de la fixture** — T6.2.
 *
 * `afterAll` nettoyait sur `if (!f?.domainId) return` : quand `beforeAll`
 * échoue **après** la création du domaine, `f` reste indéfinie, le nettoyage se
 * saute, et le domaine résiduel fait tomber le fichier suivant par la
 * résolution « premier domaine actif **par nom** » (`resolveDomainId`). La
 * variable est posée à la ligne d'après la création : entre les deux, rien ne
 * peut échouer.
 */
let createdDomainId: string | null = null;

beforeAll(async () => {
  const domain = await superAdmin.createDomain({
    name: `__test__projet_actions__${suffix}`,
    competenceCenterName: `Centre ${suffix}`,
  });
  createdDomainId = domain.id;
  const scope = forDomain({ domainId: domain.id });

  const person = (fullName: string) =>
    scope.insert(persons, {
      fullName,
      source: "manual",
      kind: "center",
      hasAccess: true,
      domainRole: "member",
    });

  const contributor = await person(`Contributeur ${suffix}`);
  const outsider = await person(`Membre ${suffix}`);

  const entity = await scope.insert(entities, { label: `Entité ${suffix}` });
  const status = await scope.insert(projectStatuses, {
    label: `En cours ${suffix}`,
    nature: "active",
  });
  const product = await scope.insert(products, {
    name: `Produit ${suffix}`,
    entityId: entity.id,
  });

  const project = await scope.insert(projects, {
    name: `Ouvert ${suffix}`,
    productId: product.id,
    statusId: status.id,
  });
  const archivedProject = await scope.insert(projects, {
    name: `Rangé ${suffix}`,
    productId: product.id,
    statusId: status.id,
  });

  /* Contributeur des **deux** accompagnements : ce qui fait tomber l'écriture
     sur le second est son archivage, et lui seul — pas un droit qui manque. */
  for (const target of [project, archivedProject]) {
    await scope.insert(projectMembers, {
      projectId: target.id,
      personId: contributor.id,
      isContributor: true,
    });
  }
  await scope.archive(projects, archivedProject.id);

  const type = await scope.insert(activityTypes, {
    label: `Audit UX ${suffix}`,
    family: "evaluation",
    producesResult: true,
  });

  const activity = await scope.insert(activities, {
    projectId: project.id,
    activityTypeId: type.id,
    state: "planned",
    periodStart: "2026-10-01",
    periodEnd: "2026-10-31",
  });

  f = {
    domainId: domain.id,
    scope,
    contributorId: contributor.id,
    outsiderId: outsider.id,
    projectId: project.id,
    archivedProjectId: archivedProject.id,
    typeId: type.id,
    typeLabel: type.label,
    activityId: activity.id,
  };
}, 180_000);

afterAll(async () => {
  if (!createdDomainId) return;
  /* `events` en tête : ses clés étrangères cascadent, mais le nettoyage ne s'en
     remet pas à une cascade — ce qui est écrit explicitement se relit. */
  const tables = [
    events,
    results,
    resources,
    activities,
    projectMembers,
    projects,
    projectStatuses,
    products,
    activityTypes,
    entities,
    persons,
  ];
  for (const table of tables) {
    await db.delete(table).where(eq(table.domainId, createdDomainId));
  }
  await db.delete(domains).where(eq(domains.id, createdDomainId));
});

/* ==========================================================================
   Le journal — ce que la base porte, jamais le chemin pris (T6.2)
   ========================================================================== */

type EventRow = {
  verb: string;
  targetType: string;
  targetId: string | null;
  actorId: string | null;
  projectId: string | null;
  productId: string | null;
  summary: string;
};

/** Toutes les lignes du journal du domaine, de la plus ancienne à la dernière. */
async function journal(): Promise<EventRow[]> {
  return db
    .select({
      verb: events.verb,
      targetType: events.targetType,
      targetId: events.targetId,
      actorId: events.actorId,
      projectId: events.projectId,
      productId: events.productId,
      summary: events.summary,
    })
    .from(events)
    .where(eq(events.domainId, f.domainId))
    .orderBy(events.occurredAt, events.createdAt);
}

/**
 * Les lignes qu'un geste vient d'écrire — le décompte avant, le décompte après.
 *
 * **C'est le critère de la fiche, rendu réutilisable** : « une ligne d'`events`
 * et une seule ». Aucune branche de redirection, à la différence de
 * `projets/actions.test.ts` : aucune de ces onze actions ne redirige (TD.2).
 */
async function written(gesture: () => Promise<unknown>): Promise<EventRow[]> {
  const before = await journal();
  await gesture();
  return (await journal()).slice(before.length);
}

/** Le formulaire tel que le panneau le soumettrait. */
function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(entries)) data.append(name, value);
  return data;
}

/** Une saisie valide, dont chaque test ne dérange qu'un champ. */
function saisie(overrides: Record<string, string> = {}): FormData {
  return form({
    activityTypeId: f.typeId,
    periodStart: "2026-11-01",
    periodEnd: "2026-11-30",
    externalUrl: LINK,
    ...overrides,
  });
}

/** Ce que la base porte, sans passer par une lecture d'écran. */
async function linksOf(projectId: string): Promise<(string | null)[]> {
  const rows = await db
    .select({ externalUrl: activities.externalUrl })
    .from(activities)
    .where(
      and(
        eq(activities.domainId, f.domainId),
        eq(activities.projectId, projectId),
      ),
    );
  return rows.map((row) => row.externalUrl);
}

/** Les activités créées par un test, retirées avant le suivant. */
async function clear(): Promise<void> {
  await db
    .delete(activities)
    .where(
      and(
        eq(activities.domainId, f.domainId),
        eq(activities.periodStart, "2026-11-01"),
      ),
    );
}

describe("createActivity — le lien vers l'outil, écrit", () => {
  test("un contributeur écrit le lien sur l'accompagnement ouvert", async () => {
    currentPerson = f.contributorId;
    const state = await createActivity(f.projectId, { values: {} as never, errors: {} }, saisie());

    expect(state.message).toBeUndefined();
    expect(state.ok).toBe(true);
    expect(await linksOf(f.projectId)).toContain(LINK);
    await clear();
  });

  test("un lien absent part à `null`, et c'est un cas normal", async () => {
    currentPerson = f.contributorId;
    await createActivity(
      f.projectId,
      { values: {} as never, errors: {} },
      saisie({ externalUrl: "" }),
    );

    const rows = await db
      .select({ externalUrl: activities.externalUrl })
      .from(activities)
      .where(
        and(
          eq(activities.domainId, f.domainId),
          eq(activities.periodStart, "2026-11-01"),
        ),
      );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.externalUrl).toBeNull();
    await clear();
  });

  test("un lien qui n'est pas un lien web est refusé, et rien n'est écrit", async () => {
    currentPerson = f.contributorId;
    const state = await createActivity(
      f.projectId,
      { values: {} as never, errors: {} },
      saisie({ externalUrl: "ergonome.example.com" }),
    );

    expect(state.ok).toBeUndefined();
    expect(state.errors.externalUrl).toBe(
      "Cette adresse n'est pas un lien web : elle doit commencer par http:// ou https://.",
    );
    // La saisie revient, elle n'est jamais jetée.
    expect(state.values.externalUrl).toBe("ergonome.example.com");
    expect(await linksOf(f.projectId)).not.toContain("ergonome.example.com");
    await clear();
  });
});

describe("createActivity — le champ neuf n'ouvre aucune porte", () => {
  test("un membre non contributeur n'écrit rien, malgré un projet valide", async () => {
    currentPerson = f.outsiderId;
    const before = await linksOf(f.projectId);

    const state = await createActivity(f.projectId, { values: {} as never, errors: {} }, saisie());

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("réservée au responsable de domaine");
    expect(await linksOf(f.projectId)).toEqual(before);
  });

  test("un accompagnement archivé ne reçoit pas le lien, même d'un contributeur", async () => {
    currentPerson = f.contributorId;
    const before = await linksOf(f.archivedProjectId);

    const state = await createActivity(
      f.archivedProjectId,
      { values: {} as never, errors: {} },
      saisie(),
    );

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("archivé");
    expect(await linksOf(f.archivedProjectId)).toEqual(before);
  });

  /* **Aucun test « sans cookie »**, et l'absence est motivée : le stub
     d'authentification retombe délibérément sur la première personne du domaine
     quand le cookie manque (`lib/auth/provider.ts`, « tolérance propre au
     stub »). Une requête sans cookie n'est donc pas anonyme au POC, elle est
     quelqu'un — et éprouver cela reviendrait à figer en test un confort de
     développement qu'Entra ID retirera en C7. Ce que ce fichier éprouve est le
     droit **par personne**, qui ne bouge pas d'une source d'identité à l'autre.
     Écrit le 21/08/2026 après avoir vu le test correspondant échouer : la
     tolérance était documentée, elle n'était pas comprise. */
});

describe("updateActivity — la correction du lien", () => {
  test("un contributeur pose puis retire le lien d'une activité existante", async () => {
    currentPerson = f.contributorId;

    const posed = await updateActivity(
      f.projectId,
      f.activityId,
      { values: {} as never, errors: {} },
      form({
        activityTypeId: f.typeId,
        periodStart: "2026-10-01",
        periodEnd: "2026-10-31",
        externalUrl: LINK,
      }),
    );
    expect(posed.ok).toBe(true);

    const [afterPose] = await db
      .select({ externalUrl: activities.externalUrl })
      .from(activities)
      .where(eq(activities.id, f.activityId));
    expect(afterPose?.externalUrl).toBe(LINK);

    /* Le retrait est ce que la **huitième** colonne d'`activityRowUnchanged`
       rend possible : sans elle, rien d'autre n'ayant bougé, l'écriture serait
       sautée en silence et le lien resterait. */
    const removed = await updateActivity(
      f.projectId,
      f.activityId,
      { values: {} as never, errors: {} },
      form({
        activityTypeId: f.typeId,
        periodStart: "2026-10-01",
        periodEnd: "2026-10-31",
        externalUrl: "",
      }),
    );
    expect(removed.ok).toBe(true);

    const [afterRemove] = await db
      .select({ externalUrl: activities.externalUrl })
      .from(activities)
      .where(eq(activities.id, f.activityId));
    expect(afterRemove?.externalUrl).toBeNull();
  });

  test("un membre non contributeur ne corrige pas le lien", async () => {
    currentPerson = f.outsiderId;

    const state = await updateActivity(
      f.projectId,
      f.activityId,
      { values: {} as never, errors: {} },
      form({
        activityTypeId: f.typeId,
        periodStart: "2026-10-01",
        periodEnd: "2026-10-31",
        externalUrl: "https://exemple.invalid/force",
      }),
    );

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("réservée au responsable de domaine");

    const [row] = await db
      .select({ externalUrl: activities.externalUrl })
      .from(activities)
      .where(eq(activities.id, f.activityId));
    expect(row?.externalUrl).toBeNull();
  });
});

/* ==========================================================================
   Le journal — les onze points d'appel de T6.2

   **Une ligne, une seule, le bon verbe, le bon `target_type`, le bon
   `target_id`.** Chaque geste part d'une ligne à lui : la fixture est partagée,
   et un test qui se reposerait sur l'état laissé par le précédent mesurerait
   l'ordre d'exécution plutôt que la règle.
   ========================================================================== */

const EMPTY = { values: {} as never, errors: {} };

/** Une activité neuve, à l'état voulu — chaque geste de cycle de vie a la sienne. */
async function freshActivity(
  overrides: Record<string, unknown> = {},
): Promise<{ id: string }> {
  return f.scope.insert(activities, {
    projectId: f.projectId,
    activityTypeId: f.typeId,
    state: "planned",
    periodStart: "2026-12-01",
    periodEnd: "2026-12-31",
    ...overrides,
  });
}

/** Une ressource neuve, reliée au projet ouvert. */
async function freshResource(title: string): Promise<{ id: string }> {
  return f.scope.insert(resources, {
    projectId: f.projectId,
    title,
    url: "https://exemple.invalid/doc",
    resourceType: "pdf",
  });
}

/** Un résultat neuf sur une activité terminée — la seule qui en accepte un. */
async function freshResult(
  label: string,
): Promise<{ activityId: string; resultId: string }> {
  const activity = await freshActivity({ state: "done" });
  const result = await f.scope.insert(results, {
    activityId: activity.id,
    label,
    value: "62",
    measuredOn: "2026-05-31",
  });
  return { activityId: activity.id, resultId: result.id };
}

describe("le journal de l'activité — cinq gestes", () => {
  test("`createActivity` écrit une ligne, et une seule", async () => {
    currentPerson = f.contributorId;

    const lines = await written(() =>
      createActivity(f.projectId, EMPTY, saisie()),
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]?.verb).toBe("created");
    expect(lines[0]?.targetType).toBe("activity");
    expect(lines[0]?.actorId).toBe(f.contributorId);
    expect(lines[0]?.projectId).toBe(f.projectId);
    // Le produit se déduit du projet : le figer serait faux le jour où
    // l'accompagnement change de produit (D20).
    expect(lines[0]?.productId).toBeNull();
    expect(lines[0]?.summary).toBe(`Activité créée${NBSP}: ${f.typeLabel}`);

    // `target_id` désigne bien la ligne écrite, pas le projet.
    const [row] = await db
      .select({ id: activities.id })
      .from(activities)
      .where(
        and(
          eq(activities.domainId, f.domainId),
          eq(activities.periodStart, "2026-11-01"),
        ),
      );
    expect(lines[0]?.targetId).toBe(row?.id);

    await clear();
  });

  test("`updateActivity` écrit `updated` quand la ligne bouge", async () => {
    currentPerson = f.contributorId;
    const activity = await freshActivity();

    const lines = await written(() =>
      updateActivity(
        f.projectId,
        activity.id,
        EMPTY,
        form({
          activityTypeId: f.typeId,
          periodStart: "2026-12-01",
          periodEnd: "2027-01-31",
        }),
      ),
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]?.verb).toBe("updated");
    expect(lines[0]?.targetType).toBe("activity");
    expect(lines[0]?.targetId).toBe(activity.id);
    expect(lines[0]?.summary).toBe(`Activité modifiée${NBSP}: ${f.typeLabel}`);
  });

  /**
   * **Une modification qui n'en est pas une n'écrit rien.** C'est le cas que
   * T3.4 avait fermé et que le journal technique annonçait ; la propriété se
   * vérifie, elle ne se suppose pas.
   */
  test("une re-soumission à l'identique n'écrit aucune ligne", async () => {
    currentPerson = f.contributorId;
    const activity = await freshActivity();
    const identique = () =>
      form({
        activityTypeId: f.typeId,
        periodStart: "2026-12-01",
        periodEnd: "2026-12-31",
      });

    // La première soumission ne change rien non plus : la ligne est déjà celle-là.
    const lines = await written(() =>
      updateActivity(f.projectId, activity.id, EMPTY, identique()),
    );

    expect(lines).toHaveLength(0);
  });

  /**
   * **Un participant ajouté est un changement**, même si aucune date ne bouge :
   * c'est la condition qui décide déjà de `refresh`, et le journal la reprend
   * telle quelle plutôt que d'en inventer une seconde.
   */
  test("un participant ajouté seul écrit quand même la ligne", async () => {
    currentPerson = f.contributorId;
    const activity = await freshActivity();

    const lines = await written(() =>
      updateActivity(
        f.projectId,
        activity.id,
        EMPTY,
        form({
          activityTypeId: f.typeId,
          periodStart: "2026-12-01",
          periodEnd: "2026-12-31",
          participantIds: f.contributorId,
        }),
      ),
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]?.verb).toBe("updated");
    // **Jamais `member`** : ce `target_type` est l'équipe du **projet** (T6.1),
    // et l'étendre aux participants d'une activité serait une règle neuve.
    expect(lines[0]?.targetType).toBe("activity");
  });

  test("`transitionActivity` écrit `state_changed`, et la phrase nomme l'état", async () => {
    currentPerson = f.contributorId;
    const activity = await freshActivity();

    const started = await written(() =>
      transitionActivity(activity.id, "in_progress"),
    );
    expect(started).toHaveLength(1);
    expect(started[0]?.verb).toBe("state_changed");
    expect(started[0]?.targetType).toBe("activity");
    expect(started[0]?.targetId).toBe(activity.id);
    expect(started[0]?.summary).toBe(`Activité en cours${NBSP}: ${f.typeLabel}`);

    const finished = await written(() => transitionActivity(activity.id, "done"));
    expect(finished).toHaveLength(1);
    expect(finished[0]?.summary).toBe(
      `Activité terminée${NBSP}: ${f.typeLabel}`,
    );
  });

  /**
   * **Rien n'est journalisé qui n'a pas eu lieu.** `canTransitionActivity`
   * écarte la transition impossible bien avant l'écriture, et le journal
   * n'ajoute aucune garde : il hérite de celle-là.
   */
  test("une transition impossible n'écrit rien", async () => {
    currentPerson = f.contributorId;
    const activity = await freshActivity({ state: "done" });

    expect(
      await written(() => transitionActivity(activity.id, "in_progress")),
    ).toHaveLength(0);
  });

  test("`cancelActivity` écrit `state_changed`, motif compris", async () => {
    currentPerson = f.contributorId;
    const activity = await freshActivity();

    const lines = await written(() =>
      cancelActivity(
        activity.id,
        {},
        form({ cancellationReason: "Reporté à 2027" }),
      ),
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]?.verb).toBe("state_changed");
    expect(lines[0]?.summary).toBe(
      `Activité annulée${NBSP}: ${f.typeLabel}${NBSP}— Reporté à 2027`,
    );
  });

  test("`archiveActivity` écrit `archived`", async () => {
    currentPerson = f.contributorId;
    const activity = await freshActivity();

    const lines = await written(() => archiveActivity(activity.id));

    expect(lines).toHaveLength(1);
    expect(lines[0]?.verb).toBe("archived");
    expect(lines[0]?.targetType).toBe("activity");
    expect(lines[0]?.targetId).toBe(activity.id);
    expect(lines[0]?.summary).toBe(`Activité archivée${NBSP}: ${f.typeLabel}`);
  });

  /**
   * Un résultat vivant s'oppose au rangement (T4bis.4). Le geste ne fait rien —
   * le journal non plus.
   */
  test("un archivage refusé par un résultat vivant n'écrit rien", async () => {
    currentPerson = f.contributorId;
    const { activityId } = await freshResult(`Bloquant ${suffix}`);

    expect(await written(() => archiveActivity(activityId))).toHaveLength(0);
  });
});

describe("le journal de la ressource — trois gestes", () => {
  test("`createResource` écrit `created`, et la phrase porte le titre", async () => {
    currentPerson = f.contributorId;

    const lines = await written(() =>
      createResource(
        f.projectId,
        { values: {} as never, errors: {} },
        form({
          title: `Compte rendu ${suffix}`,
          url: "https://exemple.invalid/cr",
          resourceType: "pdf",
        }),
      ),
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]?.verb).toBe("created");
    expect(lines[0]?.targetType).toBe("resource");
    expect(lines[0]?.projectId).toBe(f.projectId);
    expect(lines[0]?.summary).toBe(
      `Ressource créée${NBSP}: Compte rendu ${suffix}`,
    );

    const [row] = await db
      .select({ id: resources.id })
      .from(resources)
      .where(
        and(
          eq(resources.domainId, f.domainId),
          eq(resources.title, `Compte rendu ${suffix}`),
        ),
      );
    expect(lines[0]?.targetId).toBe(row?.id);
  });

  /**
   * **Le titre figé est celui d'après le geste** : celui d'avant serait une
   * « valeur avant », que D22 refuse.
   */
  test("`updateResource` fige le titre d'**après** la correction", async () => {
    currentPerson = f.contributorId;
    const resource = await freshResource(`Avant ${suffix}`);

    const lines = await written(() =>
      updateResource(
        f.projectId,
        resource.id,
        { values: {} as never, errors: {} },
        form({
          title: `Après ${suffix}`,
          url: "https://exemple.invalid/doc",
          resourceType: "pdf",
        }),
      ),
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]?.verb).toBe("updated");
    expect(lines[0]?.targetId).toBe(resource.id);
    expect(lines[0]?.summary).toBe(`Ressource modifiée${NBSP}: Après ${suffix}`);
    expect(lines[0]?.summary).not.toContain("Avant");
  });

  test("`archiveResource` écrit `archived`", async () => {
    currentPerson = f.contributorId;
    const resource = await freshResource(`À ranger ${suffix}`);

    const lines = await written(() =>
      archiveResource(f.projectId, resource.id),
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]?.verb).toBe("archived");
    expect(lines[0]?.targetType).toBe("resource");
    expect(lines[0]?.targetId).toBe(resource.id);
    expect(lines[0]?.summary).toBe(
      `Ressource archivée${NBSP}: À ranger ${suffix}`,
    );
  });
});

describe("le journal du résultat — trois gestes", () => {
  /**
   * `results` n'a **pas** de `project_id` — un résultat pend à son activité —,
   * mais l'événement en porte un : sans lui, le résultat n'apparaîtrait dans la
   * frise d'aucune page projet (T6.3).
   */
  test("`createResult` écrit `created`, et l'événement porte le projet", async () => {
    currentPerson = f.contributorId;
    const activity = await freshActivity({ state: "done" });

    const lines = await written(() =>
      createResult(
        f.projectId,
        activity.id,
        { values: {} as never, errors: {} },
        form({
          label: `Score d'audit ${suffix}`,
          value: "62",
          measuredOn: "2026-05-31",
        }),
      ),
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]?.verb).toBe("created");
    expect(lines[0]?.targetType).toBe("result");
    expect(lines[0]?.projectId).toBe(f.projectId);
    expect(lines[0]?.summary).toBe(
      `Résultat créé${NBSP}: Score d'audit ${suffix}`,
    );

    const [row] = await db
      .select({ id: results.id })
      .from(results)
      .where(eq(results.activityId, activity.id));
    expect(lines[0]?.targetId).toBe(row?.id);
  });

  test("`updateResult` fige le libellé d'**après** la correction", async () => {
    currentPerson = f.contributorId;
    const { activityId, resultId } = await freshResult(`Avant ${suffix}`);

    const lines = await written(() =>
      updateResult(
        f.projectId,
        activityId,
        resultId,
        { values: {} as never, errors: {} },
        form({
          label: `Après ${suffix}`,
          value: "70",
          measuredOn: "2026-05-31",
        }),
      ),
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]?.verb).toBe("updated");
    expect(lines[0]?.targetId).toBe(resultId);
    expect(lines[0]?.summary).toBe(`Résultat modifié${NBSP}: Après ${suffix}`);
  });

  test("`archiveResult` écrit `archived`", async () => {
    currentPerson = f.contributorId;
    const { activityId, resultId } = await freshResult(`À ranger ${suffix}`);

    const lines = await written(() =>
      archiveResult(f.projectId, activityId, resultId),
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]?.verb).toBe("archived");
    expect(lines[0]?.targetType).toBe("result");
    expect(lines[0]?.targetId).toBe(resultId);
    expect(lines[0]?.summary).toBe(
      `Résultat archivé${NBSP}: À ranger ${suffix}`,
    );
  });
});

/* ==========================================================================
   Le droit s'éprouve par l'action, jamais par l'écran
   ========================================================================== */

describe("un refus n'écrit ni la ligne métier ni l'événement", () => {
  test("un membre non contributeur ne relie pas de ressource", async () => {
    currentPerson = f.outsiderId;

    let state: { message?: string } | undefined;
    const lines = await written(async () => {
      state = await createResource(
        f.projectId,
        { values: {} as never, errors: {} },
        form({
          title: `Forgée ${suffix}`,
          url: "https://exemple.invalid/forge",
          resourceType: "pdf",
        }),
      );
    });

    // L'étape témoin : sans elle, un refus et une panne seraient indiscernables.
    expect(state?.message).toContain("réservé au responsable de domaine");

    expect(lines).toHaveLength(0);
    const forged = await db
      .select({ id: resources.id })
      .from(resources)
      .where(
        and(
          eq(resources.domainId, f.domainId),
          eq(resources.title, `Forgée ${suffix}`),
        ),
      );
    expect(forged).toHaveLength(0);
  });

  test("un accompagnement archivé ne reçoit ni saisie ni événement", async () => {
    currentPerson = f.contributorId;

    let state: { message?: string } | undefined;
    const lines = await written(async () => {
      state = await createActivity(f.archivedProjectId, EMPTY, saisie());
    });

    expect(state?.message).toContain("archivé");
    expect(lines).toHaveLength(0);
  });
});
