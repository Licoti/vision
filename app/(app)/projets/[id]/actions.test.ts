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
 * **T6.5 y ajoute les trois gestes du lien déclaré** — déclarer, corriger,
 * retirer —, et deux propriétés que rien d'autre ne mesure : le **cinquième
 * verbe** de l'énuméré, `linked`, écrit dans les deux sens ; et l'**asymétrie
 * de l'arbitrage (g)**, qui veut que la lecture soit symétrique et l'écriture
 * non. Cette seconde-là ne se lit dans aucun écran — un geste absent du rendu
 * n'a jamais protégé le point d'entrée qui l'accompagne —, seul le décompte en
 * base la porte.
 *
 * **Un second domaine arrive avec eux**, et il n'a qu'un usage : `project_links`
 * est la première table du fichier dont une colonne pointe un projet, si bien
 * qu'un `to_project_id` d'ailleurs est un cas réel. Il éprouve les deux
 * barrières — celle de l'action, qui rend un message de champ, et celle de la
 * couche, qui lève `DomainScopeError` et qu'aucun chemin d'écran n'atteint.
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

import { and, eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import { db } from "@/lib/db/client";
import {
  DomainScopeError,
  forDomain,
  superAdmin,
  type ScopedDb,
} from "@/lib/db/scoped";
import {
  activities,
  activityTypes,
  budgets,
  domains,
  entities,
  events,
  persons,
  products,
  projectLinks,
  projectMembers,
  projectStatuses,
  projects,
  resources,
  results,
  tools,
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
  saveProjectBudget,
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
  createProjectLink,
  updateProjectLink,
  removeProjectLink,
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
  /** Un second accompagnement **ouvert** du même domaine : la cible d'un lien. */
  neighbourId: string;
  neighbourName: string;
  /** Le nom de l'accompagnement archivé, que le journal figerait s'il l'acceptait. */
  archivedProjectName: string;
  /** Un accompagnement d'un **autre domaine** — la seule ligne d'ailleurs du fichier. */
  foreignProjectId: string;
  /** L'outil de gestion vivant du domaine — la cible normale d'un budget (T7.1). */
  toolId: string;
  /** Le même, archivé : ce que l'action refuse hors exception nominative. */
  archivedToolId: string;
  /** Un outil d'un **autre domaine** : ce que l'action refuse par message de champ. */
  foreignToolId: string;
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

/**
 * Le **second** domaine — T6.5, et il n'a qu'un usage.
 *
 * `project_links.to_project_id` est la première colonne de ce fichier qui
 * pointe un projet : un identifiant d'ailleurs y est un cas réel, pas une
 * hypothèse. Il est retenu hors de la fixture pour la raison qui vaut au
 * premier — un `beforeAll` qui échoue après l'avoir créé le laisserait en base,
 * et un domaine résiduel fait tomber le fichier suivant.
 */
let createdOtherDomainId: string | null = null;

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

  /* Le voisin : un second accompagnement **ouvert**, sur le même produit, et
     dont le contributeur est **aussi** contributeur.

     **Ce dernier point n'est pas un détail, il est la condition du constat.**
     L'asymétrie de l'arbitrage (g) veut que le lien ne se corrige et ne se
     retire que depuis le projet **source**. Si l'acteur n'avait pas le droit
     d'écrire sur la cible, les deux tests qui l'éprouvent tomberaient sur le
     droit — mesuré : ils rendaient « réservée au responsable de domaine » — et
     passeraient au vert sans rien prouver de l'asymétrie. Le droit accordé des
     deux côtés est ce qui ne laisse tomber que ce qu'on veut mesurer. */
  const neighbour = await scope.insert(projects, {
    name: `Voisin ${suffix}`,
    productId: product.id,
    statusId: status.id,
  });
  await scope.insert(projectMembers, {
    projectId: neighbour.id,
    personId: contributor.id,
    isContributor: true,
  });

  /* Les outils de gestion — T7.1. Le vivant est la cible normale d'un budget ;
     l'archivé éprouve le refus, et l'exception nominative qui le rattrape. */
  const tool = await scope.insert(tools, {
    name: `Gestion ${suffix}`,
    kind: "budget",
    baseUrl: "https://gestion.example.com",
  });
  const retiredTool = await scope.insert(tools, {
    name: `Ancien portail ${suffix}`,
    kind: "budget",
  });
  await scope.archive(tools, retiredTool.id);

  /* Un accompagnement d'un **autre domaine**, créé par sa propre couche
     scopée : rien ici ne contourne la règle 1, pas même pour forger. */
  const otherDomain = await superAdmin.createDomain({
    name: `__test__projet_actions_ailleurs__${suffix}`,
    competenceCenterName: `Centre ailleurs ${suffix}`,
  });
  createdOtherDomainId = otherDomain.id;
  const otherScope = forDomain({ domainId: otherDomain.id });
  const otherEntity = await otherScope.insert(entities, {
    label: `Entité ailleurs ${suffix}`,
  });
  const otherStatus = await otherScope.insert(projectStatuses, {
    label: `En cours ailleurs ${suffix}`,
    nature: "active",
  });
  const otherProduct = await otherScope.insert(products, {
    name: `Produit ailleurs ${suffix}`,
    entityId: otherEntity.id,
  });
  const foreignProject = await otherScope.insert(projects, {
    name: `Ailleurs ${suffix}`,
    productId: otherProduct.id,
    statusId: otherStatus.id,
  });
  /* Un outil d'ailleurs : `budgets.tool_id` est la seconde colonne du fichier à
     pointer une table scopée, et un identifiant d'un autre domaine y est un cas
     réel — pas une hypothèse. Il éprouve les deux barrières, celle de l'action
     et celle de la couche. */
  const foreignTool = await otherScope.insert(tools, {
    name: `Gestion ailleurs ${suffix}`,
    kind: "budget",
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
    neighbourId: neighbour.id,
    neighbourName: neighbour.name,
    archivedProjectName: archivedProject.name,
    foreignProjectId: foreignProject.id,
    toolId: tool.id,
    archivedToolId: retiredTool.id,
    foreignToolId: foreignTool.id,
  };
}, 180_000);

afterAll(async () => {
  /* `events` en tête, `project_links` avant `projects` : leurs clés étrangères
     cascadent, mais le nettoyage ne s'en remet pas à une cascade — ce qui est
     écrit explicitement se relit. */
  const tables = [
    events,
    results,
    resources,
    activities,
    projectLinks,
    budgets,
    projectMembers,
    projects,
    projectStatuses,
    products,
    activityTypes,
    tools,
    entities,
    persons,
  ];

  /* Les deux domaines se nettoient du même geste, et le second **avant** le
     premier : `project_links` peut porter une ligne de l'un qui vise l'autre,
     et `projects` refuserait la suppression tant qu'elle tient. */
  const ids = [createdOtherDomainId, createdDomainId].filter(
    (id): id is string => id !== null,
  );
  if (ids.length === 0) return;

  for (const domainId of ids) {
    for (const table of tables) {
      await db.delete(table).where(eq(table.domainId, domainId));
    }
  }
  await db.delete(domains).where(inArray(domains.id, ids));
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

/* ==========================================================================
   Les liens déclarés — T6.5

   **Le cinquième verbe de l'énuméré**, `linked`, et le seul que T6.1 et T6.2
   n'avaient pas posé sur son objet propre. Il s'écrit dans les deux sens : la
   phrase distingue ce que la colonne ne distingue pas.

   **L'asymétrie de l'arbitrage (g) se mesure ici, et nulle part ailleurs.** La
   lecture est symétrique — les deux pages portent la ligne (`listDeclaredLinks`)
   —, l'écriture ne l'est pas : seul le projet **source** corrige et retire. Un
   bouton absent du rendu n'a jamais protégé le point d'entrée HTTP, et c'est
   `openLink` qui le tient.
   ========================================================================== */

/** Les liaisons déclarées du domaine, telles que la base les porte. */
async function declaredRows(): Promise<
  { id: string; fromProjectId: string; toProjectId: string; reason: string | null }[]
> {
  return db
    .select({
      id: projectLinks.id,
      fromProjectId: projectLinks.fromProjectId,
      toProjectId: projectLinks.toProjectId,
      reason: projectLinks.reason,
    })
    .from(projectLinks)
    .where(eq(projectLinks.domainId, f.domainId));
}

/** Les liaisons posées par un test, retirées avant le suivant. */
async function clearLinks(): Promise<void> {
  await db.delete(projectLinks).where(eq(projectLinks.domainId, f.domainId));
}

/** Une liaison posée **par la couche**, sans passer par l'action qu'on éprouve. */
async function declare(
  fromProjectId: string,
  toProjectId: string,
  reason?: string,
): Promise<string> {
  const row = await f.scope.insert(projectLinks, {
    fromProjectId,
    toProjectId,
    ...(reason ? { reason } : {}),
  });
  return row.id;
}

describe("createProjectLink — déclarer un lien", () => {
  test("un contributeur déclare le lien, et le journal le dit", async () => {
    await clearLinks();
    currentPerson = f.contributorId;

    const lines = await written(async () => {
      await createProjectLink(
        f.projectId,
        EMPTY,
        form({
          toProjectId: f.neighbourId,
          reason: "Réutilise la grille d'entretien",
        }),
      );
    });

    const rows = await declaredRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.fromProjectId).toBe(f.projectId);
    expect(rows[0]?.toProjectId).toBe(f.neighbourId);
    expect(rows[0]?.reason).toBe("Réutilise la grille d'entretien");

    // Une ligne, et une seule. `target_type` dit `project` — les six sont figés
    // par l'arbitrage (b), et `link` n'en est pas — et `target_id` désigne
    // l'accompagnement visé : c'est lui que le geste a touché.
    expect(lines).toHaveLength(1);
    expect(lines[0]?.verb).toBe("linked");
    expect(lines[0]?.targetType).toBe("project");
    expect(lines[0]?.targetId).toBe(f.neighbourId);
    expect(lines[0]?.projectId).toBe(f.projectId);
    expect(lines[0]?.actorId).toBe(f.contributorId);
    expect(lines[0]?.summary).toBe(
      `Lien déclaré${NBSP}: ${f.neighbourName}${NBSP}— Réutilise la grille d'entretien`,
    );
  });

  test("une raison absente part à `null`, et c'est un cas normal", async () => {
    await clearLinks();
    currentPerson = f.contributorId;

    const lines = await written(async () => {
      await createProjectLink(
        f.projectId,
        EMPTY,
        form({ toProjectId: f.neighbourId, reason: "   " }),
      );
    });

    // `docs/02` §7 : la saisie doit rester « parfaitement optionnelle ». Une
    // raison faite d'espaces n'est pas une raison — et la phrase ne compose
    // alors aucune incise vide.
    expect((await declaredRows())[0]?.reason).toBeNull();
    expect(lines[0]?.summary).toBe(`Lien déclaré${NBSP}: ${f.neighbourName}`);
    expect(lines[0]?.summary).not.toContain("—");
  });

  test("l'auto-lien est refusé, et le `CHECK` n'est jamais atteint", async () => {
    await clearLinks();
    currentPerson = f.contributorId;

    let state: { errors?: { toProjectId?: string } } | undefined;
    const lines = await written(async () => {
      state = await createProjectLink(
        f.projectId,
        EMPTY,
        form({ toProjectId: f.projectId, reason: "Boucle" }),
      );
    });

    // Un message de champ, pas une violation de contrainte : ce qui se refuse
    // doit se lire, pas se planter. `project_links_no_self_link` reste la
    // seconde barrière — elle n'a rien à rattraper.
    expect(state?.errors?.toProjectId).toContain("lui-même");
    expect(await declaredRows()).toHaveLength(0);
    expect(lines).toHaveLength(0);
  });

  test("le doublon est refusé, et l'`unique` n'est jamais atteint", async () => {
    await clearLinks();
    await declare(f.projectId, f.neighbourId, "Le premier");
    currentPerson = f.contributorId;

    let state: { errors?: { toProjectId?: string } } | undefined;
    const lines = await written(async () => {
      state = await createProjectLink(
        f.projectId,
        EMPTY,
        form({ toProjectId: f.neighbourId, reason: "Le second" }),
      );
    });

    expect(state?.errors?.toProjectId).toContain("déjà déclaré");
    // La première ligne est intacte : un refus ne récrit rien.
    const rows = await declaredRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.reason).toBe("Le premier");
    expect(lines).toHaveLength(0);
  });

  test("le réciproque n'est pas un doublon : les deux sens coexistent", async () => {
    await clearLinks();
    await declare(f.neighbourId, f.projectId, "Depuis l'autre côté");
    currentPerson = f.contributorId;

    await createProjectLink(
      f.projectId,
      EMPTY,
      form({ toProjectId: f.neighbourId, reason: "Depuis celui-ci" }),
    );

    // `project_links_from_to_unique` porte sur un couple **orienté**. Deux
    // déclarations opposées sont deux faits distincts, chacun avec sa raison —
    // et refuser la seconde serait un cinquième refus que la fiche ne porte pas.
    const rows = await declaredRows();
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.reason).sort()).toEqual([
      "Depuis celui-ci",
      "Depuis l'autre côté",
    ]);
  });

  test("un accompagnement d'un autre domaine est refusé", async () => {
    await clearLinks();
    currentPerson = f.contributorId;

    let state: { errors?: { toProjectId?: string } } | undefined;
    const lines = await written(async () => {
      state = await createProjectLink(
        f.projectId,
        EMPTY,
        form({ toProjectId: f.foreignProjectId, reason: "Forgé" }),
      );
    });

    // La couche ne distingue pas « inconnu » d'« ailleurs », et l'écran non
    // plus : c'est le même message, et c'est voulu.
    expect(state?.errors?.toProjectId).toContain("n'existe pas dans ce domaine");
    expect(await declaredRows()).toHaveLength(0);
    expect(lines).toHaveLength(0);
  });

  test("un accompagnement archivé est refusé, même forgé", async () => {
    await clearLinks();
    currentPerson = f.contributorId;

    let state: { errors?: { toProjectId?: string } } | undefined;
    const lines = await written(async () => {
      state = await createProjectLink(
        f.projectId,
        EMPTY,
        form({ toProjectId: f.archivedProjectId, reason: "Forgé" }),
      );
    });

    // `listLinkableProjects` ne le propose pas ; ce constat-ci dit que
    // l'absence du `select` n'est pas ce qui protège.
    expect(state?.errors?.toProjectId).toContain("archivé");
    expect(await declaredRows()).toHaveLength(0);
    expect(lines).toHaveLength(0);
  });

  test("un membre non contributeur ne déclare rien", async () => {
    await clearLinks();
    currentPerson = f.outsiderId;

    let state: { message?: string } | undefined;
    const lines = await written(async () => {
      state = await createProjectLink(
        f.projectId,
        EMPTY,
        form({ toProjectId: f.neighbourId, reason: "Forgé" }),
      );
    });

    // L'étape témoin : sans elle, un refus et une panne seraient indiscernables.
    expect(state?.message).toContain("réservée au responsable de domaine");
    expect(await declaredRows()).toHaveLength(0);
    expect(lines).toHaveLength(0);
  });

  test("un accompagnement archivé ne déclare pas de lien", async () => {
    await clearLinks();
    currentPerson = f.contributorId;

    let state: { message?: string } | undefined;
    const lines = await written(async () => {
      state = await createProjectLink(
        f.archivedProjectId,
        EMPTY,
        form({ toProjectId: f.neighbourId, reason: "Forgé" }),
      );
    });

    // Le droit est là — le contributeur l'est des deux projets. Ce qui tombe
    // est l'archivage de la source, et c'est `openProject` qui le tient.
    expect(state?.message).toContain("archivé");
    expect(await declaredRows()).toHaveLength(0);
    expect(lines).toHaveLength(0);
  });
});

describe("la seconde barrière : la couche refuse ce que l'action a déjà écarté", () => {
  /**
   * `checkLinkTarget` rend un message de champ avant d'écrire, si bien que
   * `DomainScopeError` n'est **jamais** levée par le chemin de l'écran. Ce
   * constat mesure la barrière que l'action rend inatteignable : sans lui,
   * retirer le contrôle de l'action ferait rendre un 500 au lieu d'un message,
   * et rien ne dirait laquelle des deux protège.
   */
  test("`insert` refuse un `to_project_id` d'un autre domaine", async () => {
    await expect(
      f.scope.insert(projectLinks, {
        fromProjectId: f.projectId,
        toProjectId: f.foreignProjectId,
      }),
    ).rejects.toBeInstanceOf(DomainScopeError);

    expect(await declaredRows()).toHaveLength(0);
  });
});

describe("updateProjectLink — corriger la raison", () => {
  test("un contributeur corrige, et le journal fige la phrase d'après", async () => {
    await clearLinks();
    const linkId = await declare(f.projectId, f.neighbourId, "Première raison");
    currentPerson = f.contributorId;

    const lines = await written(async () => {
      await updateProjectLink(
        f.projectId,
        linkId,
        EMPTY,
        form({ toProjectId: f.neighbourId, reason: "Raison corrigée" }),
      );
    });

    expect((await declaredRows())[0]?.reason).toBe("Raison corrigée");

    // Le libellé figé est celui d'**après** le geste : écrire celui d'avant
    // serait une « valeur avant », que D22 refuse.
    expect(lines).toHaveLength(1);
    expect(lines[0]?.verb).toBe("linked");
    expect(lines[0]?.summary).toBe(
      `Lien modifié${NBSP}: ${f.neighbourName}${NBSP}— Raison corrigée`,
    );
  });

  test("le projet **cible** ne corrige pas le lien — l'écriture n'est pas symétrique", async () => {
    await clearLinks();
    const linkId = await declare(f.projectId, f.neighbourId, "Intacte");
    currentPerson = f.contributorId;

    let state: { message?: string } | undefined;
    const lines = await written(async () => {
      state = await updateProjectLink(
        f.neighbourId,
        linkId,
        EMPTY,
        form({ toProjectId: f.projectId, reason: "Depuis l'autre bout" }),
      );
    });

    // L'arbitrage (g), mesuré : la ligne s'affiche des deux côtés, elle ne se
    // corrige que depuis celui d'où elle part. Aucun écran ne dit cette
    // propriété — seule la base la porte.
    expect(state?.message).toContain("déclaré depuis cet accompagnement");
    expect((await declaredRows())[0]?.reason).toBe("Intacte");
    expect(lines).toHaveLength(0);
  });

  test("un membre non contributeur ne corrige rien", async () => {
    await clearLinks();
    const linkId = await declare(f.projectId, f.neighbourId, "Intacte");
    currentPerson = f.outsiderId;

    let state: { message?: string } | undefined;
    const lines = await written(async () => {
      state = await updateProjectLink(
        f.projectId,
        linkId,
        EMPTY,
        form({ toProjectId: f.neighbourId, reason: "Forgée" }),
      );
    });

    expect(state?.message).toContain("réservée au responsable de domaine");
    expect((await declaredRows())[0]?.reason).toBe("Intacte");
    expect(lines).toHaveLength(0);
  });
});

describe("removeProjectLink — retirer un lien", () => {
  test("la liaison disparaît, et le verbe reste `linked`", async () => {
    await clearLinks();
    const linkId = await declare(f.projectId, f.neighbourId, "À retirer");
    currentPerson = f.contributorId;

    const lines = await written(async () => {
      await removeProjectLink(f.projectId, linkId);
    });

    // `unlink`, pas `archive` : `project_links` n'a pas d'`archived_at`, et
    // `LinkTable` le dit à la compilation. Aucune cascade — la ligne de
    // liaison, rien d'autre.
    expect(await declaredRows()).toHaveLength(0);

    // L'énuméré n'a pas d'`unlinked` : le verbe reste `linked`, la phrase dit
    // le retrait. Et elle ne redit pas la raison — « Ressource archivée : X »
    // ne redonne pas l'adresse du document.
    expect(lines).toHaveLength(1);
    expect(lines[0]?.verb).toBe("linked");
    expect(lines[0]?.targetId).toBe(f.neighbourId);
    expect(lines[0]?.summary).toBe(`Lien retiré${NBSP}: ${f.neighbourName}`);
    expect(lines[0]?.summary).not.toContain("À retirer");
  });

  test("les deux accompagnements restent — aucune cascade", async () => {
    await clearLinks();
    const linkId = await declare(f.projectId, f.neighbourId);
    currentPerson = f.contributorId;

    await removeProjectLink(f.projectId, linkId);

    const alive = await db
      .select({ id: projects.id })
      .from(projects)
      .where(
        and(
          eq(projects.domainId, f.domainId),
          inArray(projects.id, [f.projectId, f.neighbourId]),
        ),
      );
    expect(alive).toHaveLength(2);
  });

  test("le projet **cible** ne retire pas le lien — l'écriture n'est pas symétrique", async () => {
    await clearLinks();
    const linkId = await declare(f.projectId, f.neighbourId, "Intacte");
    currentPerson = f.contributorId;

    const lines = await written(async () => {
      await removeProjectLink(f.neighbourId, linkId);
    });

    // Le geste n'est pas rendu de ce côté-là, et ce n'est pas ce rendu qui
    // protège : le point d'entrée refuse le lien **reçu** qui ne part pas de ce
    // projet. Le refus est muet — ce geste n'a aucune saisie à rendre.
    //
    // Le contributeur écrit dans **les deux** accompagnements : ce qui refuse
    // n'est donc pas le droit, c'est le sens de la liaison.
    expect(await declaredRows()).toHaveLength(1);
    expect(lines).toHaveLength(0);
  });

  test("un membre non contributeur ne retire rien, en silence", async () => {
    await clearLinks();
    const linkId = await declare(f.projectId, f.neighbourId, "Intacte");
    currentPerson = f.outsiderId;

    const lines = await written(async () => {
      await removeProjectLink(f.projectId, linkId);
    });

    expect(await declaredRows()).toHaveLength(1);
    expect(lines).toHaveLength(0);
  });

  test("un identifiant de liaison inconnu ne retire rien", async () => {
    await clearLinks();
    await declare(f.projectId, f.neighbourId, "Intacte");
    currentPerson = f.contributorId;

    const lines = await written(async () => {
      await removeProjectLink(
        f.projectId,
        "00000000-0000-4000-8000-000000000000",
      );
    });

    expect(await declaredRows()).toHaveLength(1);
    expect(lines).toHaveLength(0);
  });
});

/* ==========================================================================
   Le budget — T7.1

   **Le droit s'éprouve par l'action, jamais par l'écran.** Le bloc ne rend son
   geste qu'à qui porte `writeProject` sur cet accompagnement, et cela ne prouve
   rien : `saveProjectBudget` est un point d'entrée HTTP à part entière, dont
   l'identifiant lié est sérialisé en clair dans un champ `$ACTION_…`.

   **Ce qui est mesuré est la base, jamais le chemin pris.** Un refus se lit à ce
   qu'aucune ligne n'a bougé ; une écriture, à ce que la colonne porte la valeur
   attendue. `ok` et `message` sont des indices, la table est la preuve — le code
   HTTP ne dit jamais ce qui a été écrit.

   **Une propriété que rien d'autre ne mesure** : l'absence de ligne de journal
   (arbitrage (d)). Elle ne se lit dans aucun écran — le bloc « Journal » ne
   montre pas ce qui n'y est pas —, et seul le décompte en base la porte.
   ========================================================================== */

/** La ligne de budget d'un projet, telle que la base la porte. */
async function budgetRow(projectId: string): Promise<{
  id: string;
  allocated: string | null;
  consumed: string | null;
  unit: string;
  measuredOn: string | null;
  toolId: string | null;
  externalUrl: string | null;
} | null> {
  const rows = await db
    .select({
      id: budgets.id,
      allocated: budgets.allocated,
      consumed: budgets.consumed,
      unit: budgets.unit,
      measuredOn: budgets.measuredOn,
      toolId: budgets.toolId,
      externalUrl: budgets.externalUrl,
    })
    .from(budgets)
    .where(
      and(eq(budgets.domainId, f.domainId), eq(budgets.projectId, projectId)),
    );
  return rows[0] ?? null;
}

/** Le décompte des budgets du domaine — l'étape témoin de chaque geste. */
async function budgetCount(): Promise<number> {
  return (
    await db.select({ id: budgets.id }).from(budgets).where(eq(budgets.domainId, f.domainId))
  ).length;
}

/** Les budgets posés par un test, retirés avant le suivant. */
async function clearBudgets(): Promise<void> {
  await db.delete(budgets).where(eq(budgets.domainId, f.domainId));
}

/** Une saisie de budget valide, dont chaque test ne dérange qu'un champ. */
function budgetForm(overrides: Record<string, string> = {}): FormData {
  return form({
    allocated: "120",
    consumed: "87,5",
    measuredOn: "2026-08-31",
    toolId: f.toolId,
    externalUrl: "https://gestion.example.com/refonte/budget",
    ...overrides,
  });
}

describe("saveProjectBudget — saisir et corriger la même ligne", () => {
  test("un contributeur saisit le budget, et la ligne porte ses cinq colonnes", async () => {
    await clearBudgets();
    currentPerson = f.contributorId;

    const before = await budgetCount();
    const state = await saveProjectBudget(f.projectId, EMPTY, budgetForm());

    expect(state.ok).toBe(true);
    expect(await budgetCount()).toBe(before + 1);

    const row = await budgetRow(f.projectId);
    expect(row).toMatchObject({
      // La virgule tapée part en point décimal, comme la colonne l'attend.
      allocated: "120.0000",
      consumed: "87.5000",
      measuredOn: "2026-08-31",
      toolId: f.toolId,
      externalUrl: "https://gestion.example.com/refonte/budget",
      // `not null` avec un défaut : elle ne se saisit pas et n'est jamais absente.
      unit: "days",
    });
  });

  test("la seconde soumission corrige la même ligne, elle n'en crée pas une seconde", async () => {
    /* C'est la propriété que `budgets_project_unique` impose et que la fiche
       demande : un seul geste, un seul formulaire, une seule adresse. Sans le
       décompte, un `insert` de plus rendrait le même `ok` — le code HTTP ne dit
       jamais ce qui a été écrit. */
    await clearBudgets();
    currentPerson = f.contributorId;

    await saveProjectBudget(f.projectId, EMPTY, budgetForm());
    const first = await budgetRow(f.projectId);

    const state = await saveProjectBudget(
      f.projectId,
      EMPTY,
      budgetForm({ consumed: "95", externalUrl: "" }),
    );

    expect(state.ok).toBe(true);
    expect(await budgetCount()).toBe(1);

    const row = await budgetRow(f.projectId);
    // La même ligne, pas une nouvelle.
    expect(row?.id).toBe(first?.id);
    expect(row?.consumed).toBe("95.0000");
    // Un champ vidé efface la colonne : c'est le rattrapage d'une saisie erronée.
    expect(row?.externalUrl).toBeNull();
    expect(row?.allocated).toBe("120.0000");
  });

  test("une soumission vide remet les cinq colonnes à `null`, et la ligne reste", async () => {
    /* `budgets` ne porte pas d'`archived_at` et ne se supprime pas
       (arbitrage (c)) : vider le formulaire est **le seul** chemin qui défait un
       budget saisi par erreur. Le refuser fermerait ce rattrapage. */
    await clearBudgets();
    currentPerson = f.contributorId;

    await saveProjectBudget(f.projectId, EMPTY, budgetForm());
    const state = await saveProjectBudget(f.projectId, EMPTY, form({}));

    expect(state.ok).toBe(true);
    expect(await budgetCount()).toBe(1);
    expect(await budgetRow(f.projectId)).toMatchObject({
      allocated: null,
      consumed: null,
      measuredOn: null,
      toolId: null,
      externalUrl: null,
    });
  });

  test("le geste n'écrit aucune ligne de journal", async () => {
    /* Arbitrage (d) : `budget` n'est pas l'un des six `event_target_type`, et
       l'ouvrir pour un seul objet demanderait une migration d'énuméré. Cette
       absence ne se lit dans aucun écran — seul le décompte la porte, et sans ce
       test elle ne se distinguerait pas d'un oubli. */
    await clearBudgets();
    currentPerson = f.contributorId;

    const lines = await written(async () => {
      await saveProjectBudget(f.projectId, EMPTY, budgetForm());
    });

    expect(await budgetRow(f.projectId)).not.toBeNull();
    expect(lines).toHaveLength(0);
  });
});

describe("saveProjectBudget — le droit s'éprouve par l'action", () => {
  test("un membre non contributeur n'écrit rien, malgré un projet valide", async () => {
    await clearBudgets();
    currentPerson = f.outsiderId;

    const before = await budgetCount();
    const state = await saveProjectBudget(f.projectId, EMPTY, budgetForm());

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("réservée au responsable de domaine");
    // L'étape témoin : rien n'a bougé en base, et c'est la seule preuve.
    expect(await budgetCount()).toBe(before);
    expect(await budgetRow(f.projectId)).toBeNull();
    // La saisie revient telle quelle : Vision ne jette jamais en silence.
    expect(state.values.allocated).toBe("120");
  });

  test("un accompagnement archivé ne reçoit pas de budget, même d'un contributeur", async () => {
    /* Ce qui tombe ici n'est pas le droit — le contributeur l'est des deux
       accompagnements — mais l'archivage, seconde porte d'`openProject`. */
    await clearBudgets();
    currentPerson = f.contributorId;

    const before = await budgetCount();
    const state = await saveProjectBudget(
      f.archivedProjectId,
      EMPTY,
      budgetForm(),
    );

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("archivé");
    expect(await budgetCount()).toBe(before);
    expect(await budgetRow(f.archivedProjectId)).toBeNull();
  });

  test("un contributeur n'écrit pas sur un projet d'un autre domaine", async () => {
    /* `writeProject` porte sur une **désignation**, pas sur une appartenance de
       domaine : c'est le `find` d'`openProject` qui ferme ce cas. */
    currentPerson = f.contributorId;

    const state = await saveProjectBudget(
      f.foreignProjectId,
      EMPTY,
      budgetForm(),
    );

    expect(state.ok).toBeUndefined();
    expect(state.message).toBeDefined();
  });
});

describe("saveProjectBudget — l'outil reçu est confronté au domaine", () => {
  test("un outil d'un autre domaine rend un message de champ, et n'écrit rien", async () => {
    /* Un message de champ, pas une exception : `assertPreconditions` reste le
       second filet, pas le premier — ce qui se refuse doit se lire, pas se
       planter. */
    await clearBudgets();
    currentPerson = f.contributorId;

    const before = await budgetCount();
    const state = await saveProjectBudget(
      f.projectId,
      EMPTY,
      budgetForm({ toolId: f.foreignToolId }),
    );

    expect(state.ok).toBeUndefined();
    expect(state.errors.toolId).toContain("n'existe pas dans ce domaine");
    expect(await budgetCount()).toBe(before);
  });

  test("un outil archivé est refusé à la saisie", async () => {
    // Le panneau ne le propose pas, et rien ne justifie de l'accepter par
    // requête : la règle de `checkAdoptionIndicator`, resservie.
    await clearBudgets();
    currentPerson = f.contributorId;

    const state = await saveProjectBudget(
      f.projectId,
      EMPTY,
      budgetForm({ toolId: f.archivedToolId }),
    );

    expect(state.errors.toolId).toContain("n'existe pas dans ce domaine");
    expect(await budgetCount()).toBe(0);
  });

  test("l'outil déjà porté reste acceptable même archivé depuis — l'exception nominative", async () => {
    /* Sans elle, un budget dont l'outil a été archivé après coup ne se
       corrigerait plus sans changer d'outil : le panneau le rend sélectionné,
       et l'action le refuserait. L'exception est **nominative** — elle
       n'accepte que la valeur déjà portée par la ligne. */
    await clearBudgets();
    // La ligne est posée par la couche, avec l'outil archivé : c'est l'état
    // qu'un archivage postérieur à la saisie produit.
    await f.scope.insert(budgets, {
      projectId: f.projectId,
      allocated: "10",
      toolId: f.archivedToolId,
    });
    currentPerson = f.contributorId;

    const state = await saveProjectBudget(
      f.projectId,
      EMPTY,
      budgetForm({ toolId: f.archivedToolId, allocated: "42" }),
    );

    expect(state.ok).toBe(true);
    const row = await budgetRow(f.projectId);
    expect(row?.allocated).toBe("42.0000");
    expect(row?.toolId).toBe(f.archivedToolId);
  });

  test("une saisie sans outil est acceptée : la colonne est nullable", async () => {
    await clearBudgets();
    currentPerson = f.contributorId;

    const state = await saveProjectBudget(
      f.projectId,
      EMPTY,
      budgetForm({ toolId: "" }),
    );

    expect(state.ok).toBe(true);
    expect((await budgetRow(f.projectId))?.toolId).toBeNull();
  });
});

describe("saveProjectBudget — un refus de forme n'écrit rien", () => {
  test("un montant qui n'est pas un nombre est refusé avant la base", async () => {
    /* Sans ce contrôle, la chaîne atteindrait une colonne `numeric` et
       rendrait une erreur PostgreSQL — un 500 — là où l'on attend un message
       de champ. */
    await clearBudgets();
    currentPerson = f.contributorId;

    const state = await saveProjectBudget(
      f.projectId,
      EMPTY,
      budgetForm({ allocated: "beaucoup" }),
    );

    expect(state.ok).toBeUndefined();
    expect(state.errors.allocated).toContain("nombre");
    expect(await budgetCount()).toBe(0);
  });

  test("une adresse qui n'est pas un lien web est refusée", async () => {
    // Le bloc rend ce lien par `ExternalLink`, qui pose le `href` tel quel :
    // une adresse `javascript:` enregistrée s'exécuterait au clic.
    await clearBudgets();
    currentPerson = f.contributorId;

    const state = await saveProjectBudget(
      f.projectId,
      EMPTY,
      budgetForm({ externalUrl: "javascript:alert(1)" }),
    );

    expect(state.errors.externalUrl).toContain("lien web");
    expect(await budgetCount()).toBe(0);
  });

  test("un consommé supérieur à l'alloué est écrit sans discuter", async () => {
    /* D39 : un dépassement est un fait que l'outil de gestion connaît avant
       Vision. Le refuser — ou l'annoter — serait l'indice **calculé** que le
       produit s'interdit. */
    await clearBudgets();
    currentPerson = f.contributorId;

    const state = await saveProjectBudget(
      f.projectId,
      EMPTY,
      budgetForm({ allocated: "10", consumed: "9999" }),
    );

    expect(state.ok).toBe(true);
    expect((await budgetRow(f.projectId))?.consumed).toBe("9999.0000");
  });
});
