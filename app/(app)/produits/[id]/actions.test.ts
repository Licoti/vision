/**
 * Les tests de `setNorthStar` — **le droit s'éprouve par l'action**.
 *
 * `CLAUDE.md` pose la discipline en toutes lettres : « un panneau absent du
 * rendu n'a jamais protégé le point d'entrée HTTP qui l'accompagne ». Le menu
 * « … » qui porte ce geste ne s'affiche que pour qui a le droit, et cela ne
 * prouve rien : les identifiants liés d'une action serveur sont sérialisés en
 * clair dans un champ `$ACTION_…`, réécrivable. Ce fichier interroge donc
 * l'action elle-même, avec les identifiants qu'une soumission forgée porterait.
 *
 * **Premier fichier de tests d'action du projet**, et il arrive avec le premier
 * point d'entrée d'écriture ouvert hors ticket. Les cinq actions de T5.2 et
 * T5.3 n'en ont pas ; elles partagent pourtant les mêmes portes
 * (`openProductWrite`, `openIndicator`), si bien que ce qui est éprouvé ici
 * vaut pour elles — mais il aura fallu une action neuve pour l'écrire.
 *
 * **Trois modules de Next sont remplacés**, et seulement trois : `next/headers`,
 * dont le cookie désigne la personne courante au POC ; `next/cache`, dont la
 * revalidation n'a aucun sens hors d'un rendu ; et `next/navigation` depuis le
 * 18/08/2026, `redirect` levant une exception que seul un rendu sait attraper —
 * les trois actions de persona redirigent, là où `setNorthStar` ne redirige pas.
 * Rien d'autre n'est simulé — la base est réelle, les portes sont les vraies, et
 * `requireSession` fait son travail entier.
 *
 * **Une levée de `redirect` est le constat qu'une écriture a eu lieu**, et son
 * absence celui d'un refus : une action qui rend un état n'a rien écrit. Les
 * deux mesures se prennent quand même en base, jamais sur la seule promesse du
 * chemin pris.
 *
 * **T6.2 y ajoute les trois gestes du relevé**, les seuls événements de niveau
 * produit du dépôt. Le critère se compte en base — une ligne, une seule —, et
 * l'un de ses points **ne se lira jamais nulle part ailleurs** : `project_id`
 * nul et `product_id` posé. Aucun écran ne le dira.
 */

import { and, eq, isNull } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import { db } from "@/lib/db/client";
import { forDomain, superAdmin, type ScopedDb } from "@/lib/db/scoped";
import {
  domains,
  entities,
  events,
  indicatorReadings,
  indicators,
  personaTraits,
  personas,
  persons,
  productTrackings,
  products,
  projectMembers,
  projectStatuses,
  projects,
  taggingPlans,
  tools,
  useCasePersonas,
  useCases,
} from "@/lib/db/schema";
import { EMPTY_PERSONA_VALUES } from "@/lib/forms/persona";
import { EMPTY_TAGGING_PLAN_VALUES } from "@/lib/forms/tagging-plan";
import { EMPTY_TRACKING_VALUES } from "@/lib/forms/tracking";
import { EMPTY_USE_CASE_VALUES } from "@/lib/forms/use-case";

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

/**
 * **Le constat qu'une écriture a eu lieu est `ok`, et non plus une levée**
 * (TD.2).
 *
 * Les actions de panneau redirigeaient vers la page nue : la navigation *était*
 * la fermeture, et sa levée le signe qu'on était allé au bout. Le panneau se
 * fermant désormais côté client, elles rendent leur succès — le signe change de
 * nature, pas de fonction. Son absence reste le constat d'un refus, et
 * `message` dit lequel.
 *
 * Le mock de `next/navigation` reste en place : les deux formulaires de page
 * pleine — création et modification d'un produit — continuent de rediriger, et
 * `produits/actions.test.ts` continue de le lire ainsi.
 */
async function expectWritten<T extends { ok?: boolean; message?: string }>(
  action: Promise<T>,
): Promise<T> {
  const state = await action;
  expect(state.message).toBeUndefined();
  expect(state.ok).toBe(true);
  return state;
}

const REDIRECT = "NEXT_REDIRECT:";

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`${REDIRECT}${to}`);
  },
}));

const {
  archivePersona,
  archiveReading,
  archiveTaggingPlan,
  archiveTracking,
  archiveUseCase,
  createPersona,
  createReading,
  createTracking,
  createUseCase,
  saveTaggingPlan,
  setNorthStar,
  updatePersona,
  updateReading,
  updateTracking,
  updateUseCase,
} = await import("./actions");

const suffix = Math.random().toString(36).slice(2, 10);

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
  managerId: string;
  outsiderId: string;
  contributorId: string;
  productId: string;
  otherProductId: string;
  archivedProductId: string;
  indicatorId: string;
  siblingId: string;
  otherProductIndicatorId: string;
  archivedIndicatorId: string;
  /* --- Le dispositif de mesure (01/09/2026) ------------------------------- */
  /** Un outil de genre analytics, à déclarer. */
  toolId: string;
  /** Un second, pour éprouver l'unicité sans toucher au premier. */
  otherToolId: string;
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
    name: `__test__actions__${suffix}`,
    competenceCenterName: `Centre ${suffix}`,
  });
  createdDomainId = domain.id;
  const scope = forDomain({ domainId: domain.id });

  const person = (fullName: string, domainRole: "domain_manager" | "member") =>
    scope.insert(persons, {
      fullName,
      source: "manual",
      kind: "center",
      hasAccess: true,
      domainRole,
    });

  const manager = await person(`Responsable ${suffix}`, "domain_manager");
  const outsider = await person(`Membre ${suffix}`, "member");
  const contributor = await person(`Contributeur ${suffix}`, "member");

  const entity = await scope.insert(entities, { label: `Entité ${suffix}` });
  const status = await scope.insert(projectStatuses, {
    label: `En cours ${suffix}`,
    nature: "active",
  });

  const product = await scope.insert(products, {
    name: `Produit ${suffix}`,
    entityId: entity.id,
  });
  const otherProduct = await scope.insert(products, {
    name: `Voisin ${suffix}`,
    entityId: entity.id,
  });
  const archivedProduct = await scope.insert(products, {
    name: `Rangé ${suffix}`,
    entityId: entity.id,
  });
  await scope.archive(products, archivedProduct.id);

  /* Un accompagnement dont `contributor` est contributeur : c'est ce qui lui
     ouvre le droit d'écrire les indicateurs du produit (arbitrage (b)). */
  const project = await scope.insert(projects, {
    name: `Accompagnement ${suffix}`,
    productId: product.id,
    statusId: status.id,
  });
  await scope.insert(projectMembers, {
    projectId: project.id,
    personId: contributor.id,
    isContributor: true,
  });

  const indicator = await scope.insert(indicators, {
    productId: product.id,
    label: `Autonomie ${suffix}`,
    direction: "higher_is_better",
  });
  const sibling = await scope.insert(indicators, {
    productId: product.id,
    label: `Délai ${suffix}`,
    direction: "lower_is_better",
  });
  const otherProductIndicator = await scope.insert(indicators, {
    productId: otherProduct.id,
    label: `Voisin ${suffix}`,
    direction: "higher_is_better",
  });
  const archivedIndicator = await scope.insert(indicators, {
    productId: product.id,
    label: `Rangé ${suffix}`,
    direction: "higher_is_better",
  });
  await scope.archive(indicators, archivedIndicator.id);

  /* Deux outils de genre analytics : le référentiel dans lequel un dispositif
     puise (01/09/2026). */
  const tool = await scope.insert(tools, {
    name: `Analytics ${suffix}`,
    kind: "analytics",
    baseUrl: null,
  });
  const otherTool = await scope.insert(tools, {
    name: `Clarity ${suffix}`,
    kind: "analytics",
    baseUrl: null,
  });

  f = {
    domainId: domain.id,
    scope,
    managerId: manager.id,
    outsiderId: outsider.id,
    contributorId: contributor.id,
    productId: product.id,
    otherProductId: otherProduct.id,
    archivedProductId: archivedProduct.id,
    indicatorId: indicator.id,
    siblingId: sibling.id,
    otherProductIndicatorId: otherProductIndicator.id,
    archivedIndicatorId: archivedIndicator.id,
    toolId: tool.id,
    otherToolId: otherTool.id,
  };
}, 180_000);

afterAll(async () => {
  if (!createdDomainId) return;
  /* `events` et `indicator_readings` en tête depuis T6.2 : les deux tables que
     ce ticket écrit, et que ce nettoyage ne connaissait pas. */
  const tables = [
    events,
    productTrackings,
    taggingPlans,
    indicatorReadings,
    useCasePersonas,
    useCases,
    personaTraits,
    personas,
    projectMembers,
    indicators,
    projects,
    projectStatuses,
    products,
    entities,
    persons,
    /* `tools` en dernier, et après `product_trackings` qui le référence : la
       règle « enfants d'abord, parents ensuite » du fichier, étendue à la table
       que le dispositif de mesure a fait entrer ici (01/09/2026). Sans elle, la
       suppression du domaine viole le `RESTRICT` de `tools_domain_id_…`, et le
       domaine résiduel fait tomber le fichier suivant. */
    tools,
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

/** Les lignes qu'un geste vient d'écrire — le décompte avant, le décompte après. */
async function written(gesture: () => Promise<unknown>): Promise<EventRow[]> {
  const before = await journal();
  await gesture();
  return (await journal()).slice(before.length);
}

/** Le drapeau tel qu'il est en base, sans passer par une lecture d'écran. */
async function northStarOf(productId: string): Promise<string | null> {
  const rows = await db
    .select({ id: indicators.id })
    .from(indicators)
    .where(
      and(
        eq(indicators.productId, productId),
        eq(indicators.isNorthStar, true),
        isNull(indicators.archivedAt),
      ),
    );
  return rows[0]?.id ?? null;
}

/** Remet le produit à zéro entre deux tests : la fixture est partagée. */
async function clear(): Promise<void> {
  await db
    .update(indicators)
    .set({ isNorthStar: false })
    .where(eq(indicators.domainId, f.domainId));
}

describe("setNorthStar — ce que le geste écrit", () => {
  test("le responsable de domaine désigne, et la base le porte", async () => {
    currentPerson = f.managerId;
    try {
      await setNorthStar(f.productId, f.indicatorId);
      expect(await northStarOf(f.productId)).toBe(f.indicatorId);
    } finally {
      await clear();
    }
  });

  test("désigner en éteint une autre — **jamais deux**", async () => {
    /* L'index unique partiel refuserait la seconde ; c'est l'ordre de l'action
       — éteindre d'abord, allumer ensuite — qui fait que le geste passe. */
    currentPerson = f.managerId;
    try {
      await setNorthStar(f.productId, f.indicatorId);
      await setNorthStar(f.productId, f.siblingId);

      expect(await northStarOf(f.productId)).toBe(f.siblingId);
    } finally {
      await clear();
    }
  });

  test("`null` retire la désignation sans en poser d'autre", async () => {
    currentPerson = f.managerId;
    try {
      await setNorthStar(f.productId, f.indicatorId);
      await setNorthStar(f.productId, null);

      expect(await northStarOf(f.productId)).toBeNull();
    } finally {
      await clear();
    }
  });

  test("redésigner la North Star en place la laisse en place", async () => {
    /* **Ce test ne tient pas le `continue`, et il faut le dire** : la mise en
       défaut du 17/08/2026 montre que le retirer ne fait tomber aucun test —
       sans lui, l'action écrit `false` puis `true` sur la même ligne, et l'état
       final est identique. Le `continue` est une économie d'écriture, pas une
       garantie de correction. Ce que ce test tient réellement : redésigner deux
       fois ne perd pas la désignation. */
    currentPerson = f.managerId;
    try {
      await setNorthStar(f.productId, f.indicatorId);
      await setNorthStar(f.productId, f.indicatorId);

      expect(await northStarOf(f.productId)).toBe(f.indicatorId);
    } finally {
      await clear();
    }
  });
});

describe("setNorthStar — ce que le geste refuse", () => {
  test("un membre sans accompagnement n'écrit rien", async () => {
    /* Le droit dérivé de l'arbitrage (b) : ni `manageDomain`, ni contributeur
       d'un accompagnement de ce produit. Le menu ne s'affiche pas pour lui —
       et ce n'est pas ce qui le protège. */
    currentPerson = f.outsiderId;
    try {
      await setNorthStar(f.productId, f.indicatorId);
      expect(await northStarOf(f.productId)).toBeNull();
    } finally {
      await clear();
    }
  });

  test("un contributeur d'un accompagnement du produit écrit", async () => {
    // Le pendant du refus ci-dessus : sans lui, le test précédent passerait
    // aussi sur une action qui refuse tout le monde.
    currentPerson = f.contributorId;
    try {
      await setNorthStar(f.productId, f.indicatorId);
      expect(await northStarOf(f.productId)).toBe(f.indicatorId);
    } finally {
      await clear();
    }
  });

  test("un indicateur d'un **autre produit** n'est pas désignable", async () => {
    /* La soumission forgée que le rendu ne peut pas empêcher : les deux
       identifiants voyagent en clair dans le champ `$ACTION_…`. */
    currentPerson = f.managerId;
    try {
      await setNorthStar(f.productId, f.otherProductIndicatorId);

      expect(await northStarOf(f.productId)).toBeNull();
      expect(await northStarOf(f.otherProductId)).toBeNull();
    } finally {
      await clear();
    }
  });

  test("un indicateur **archivé** n'est pas désignable", async () => {
    currentPerson = f.managerId;
    try {
      await setNorthStar(f.productId, f.archivedIndicatorId);
      expect(await northStarOf(f.productId)).toBeNull();
    } finally {
      await clear();
    }
  });

  test("un produit **archivé** est en lecture seule", async () => {
    /* La règle 4 et la transposition de T4bis.2 : `openProductWrite` refuse le
       produit archivé **reçu**, avant même de regarder l'indicateur. */
    currentPerson = f.managerId;
    const stray = await f.scope.insert(indicators, {
      productId: f.archivedProductId,
      label: `Sur rangé ${suffix}`,
      direction: "higher_is_better",
    });

    try {
      await setNorthStar(f.archivedProductId, stray.id);
      expect(await northStarOf(f.archivedProductId)).toBeNull();
    } finally {
      await clear();
    }
  });

  test("sans cookie, le stub **accorde** une identité — propriété du POC", async () => {
    /* **Ce test a démenti deux premisses avant de dire vrai**, et c'est pour
       cela qu'il reste : je l'avais d'abord écrit « `requireSession` refuse »,
       puis « le domaine protège ». Les deux étaient faux.

       Ce que fait le stub, lu dans le code après coup : `resolveDomainId`
       (`lib/auth/session.ts`) rend **le premier domaine actif** de l'instance,
       et `resolveAccount` y choisit un compte quand le cookie est absent. Sans
       cookie, on est donc quelqu'un — potentiellement le responsable du
       domaine —, et l'écriture passe.

       Ce n'est **pas un défaut de cette action** : c'est le sélecteur de
       personne du POC (T1.4, D37), qui « ne authentifie personne — il désigne,
       en développement, qui l'on prétend être ». C7 remplacera
       `lib/auth/provider.ts` par Entra ID, et **ce test tombera** : c'est
       précisément ce qu'on veut de lui. Il épingle la propriété pour que le
       jour où elle change, quelqu'un le voie.

       Le geste est éprouvé sur un produit du domaine de repli, sans quoi le
       test dirait la règle 1 et non la propriété d'authentification. */
    currentPerson = null;
    try {
      await setNorthStar(f.productId, f.indicatorId);

      const written = await northStarOf(f.productId);
      expect(written).toBe(f.indicatorId);
    } finally {
      await clear();
    }
  });
});

/* ==========================================================================
   Les personae — 18/08/2026

   **Le droit s'éprouve par l'action, jamais par l'écran.** Le bloc retire son
   « Ajouter un persona » à qui n'a pas le droit d'écrire, et la fiche retire ses
   deux gestes : cela ne prouve rien. Les identifiants liés d'une action serveur
   sont sérialisés en clair dans un champ `$ACTION_…`, réécrivable — c'est donc
   l'action qu'on interroge ici, avec les identifiants qu'une soumission forgée
   porterait.

   Les trois actions partagent la porte des indicateurs (`openProductWrite`), et
   deux d'entre elles une porte propre (`openPersona`). Ce qui est éprouvé ici
   vaut donc pour les cinq actions d'indicateur et de relevé — mais l'inverse
   n'est pas vrai : `openPersona` est neuve, et c'est elle qui rapproche le
   persona **reçu** du produit **reçu**.

   Deux mesures par refus, et pas une : **la ligne n'est pas écrite** en base, et
   l'action **rend son refus** plutôt que de rediriger. Une action refusée qui
   rendrait un état sans message serait indiscernable d'une action qui a écrit.
   ========================================================================== */

/** Le `FormData` d'un persona valide, dont chaque test ne change que le sien. */
function personaForm(overrides: Record<string, string> = {}): FormData {
  const data = new FormData();
  const values: Record<string, string> = {
    name: `Chargé de clientèle ${suffix}`,
    role: "Réseau d'agences",
    summary: "Vingt dossiers par jour, pas deux minutes.",
    imageUrl: "",
    kind: "secondary",
    goals: "Ouvrir un dossier vite\nRetrouver un client",
    pains: "Ressaisir trois fois",
    expectations: "",
    ...overrides,
  };
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

/** L'état vide qu'`useActionState` passe en premier argument. */
const NO_STATE = { values: EMPTY_PERSONA_VALUES, errors: {} };

/** Les personae d'un produit, lus **en base** et non par un écran. */
async function personasOf(productId: string) {
  return db
    .select({ id: personas.id, name: personas.name, kind: personas.kind })
    .from(personas)
    .where(
      and(eq(personas.productId, productId), isNull(personas.archivedAt)),
    );
}

/** Les traits d'un persona, lus en base, par famille puis par position. */
async function traitsOf(personaId: string) {
  const rows = await db
    .select({
      id: personaTraits.id,
      kind: personaTraits.kind,
      label: personaTraits.label,
      position: personaTraits.position,
    })
    .from(personaTraits)
    .where(eq(personaTraits.personaId, personaId));
  return rows.sort((left, right) =>
    left.kind === right.kind
      ? left.position - right.position
      : left.kind.localeCompare(right.kind),
  );
}

/** Écrit un persona par le chemin normal, et rend son identifiant. */
async function givenPersona(overrides: Record<string, string> = {}) {
  currentPerson = f.managerId;
  await expectWritten(
    createPersona(f.productId, NO_STATE, personaForm(overrides)),
  );
  const rows = await personasOf(f.productId);
  return rows[rows.length - 1]!.id;
}

/** Remet le produit à zéro entre deux tests : la fixture est partagée. */
async function clearPersonas(): Promise<void> {
  await db.delete(personaTraits).where(eq(personaTraits.domainId, f.domainId));
  await db.delete(personas).where(eq(personas.domainId, f.domainId));
}

describe("createPersona — ce que le geste écrit", () => {
  test("le responsable de domaine écrit la ligne et ses traits", async () => {
    try {
      const personaId = await givenPersona();

      expect(await personasOf(f.productId)).toHaveLength(1);
      expect(await traitsOf(personaId)).toEqual([
        {
          id: expect.any(String),
          kind: "goal",
          label: "Ouvrir un dossier vite",
          position: 0,
        },
        {
          id: expect.any(String),
          kind: "goal",
          label: "Retrouver un client",
          position: 1,
        },
        {
          id: expect.any(String),
          kind: "pain",
          label: "Ressaisir trois fois",
          position: 0,
        },
      ]);
    } finally {
      await clearPersonas();
    }
  });

  test("un contributeur désigné écrit aussi — c'est le droit dérivé", async () => {
    /* L'arbitrage (b) de `tickets-C5.md`, transposé : un persona sort du travail
       d'accompagnement, et son droit est celui des indicateurs. */
    currentPerson = f.contributorId;
    try {
      await expectWritten(
        createPersona(f.productId, NO_STATE, personaForm()),
      );

      expect(await personasOf(f.productId)).toHaveLength(1);
    } finally {
      await clearPersonas();
    }
  });

  test("un persona sans aucun trait est un persona valide", async () => {
    try {
      const personaId = await givenPersona({
        goals: "",
        pains: "",
        expectations: "",
      });

      expect(await traitsOf(personaId)).toEqual([]);
    } finally {
      await clearPersonas();
    }
  });
});

describe("createPersona — ce que le geste refuse", () => {
  test("un membre sans accompagnement n'écrit rien", async () => {
    currentPerson = f.outsiderId;
    try {
      const state = await createPersona(
        f.productId,
        NO_STATE,
        personaForm(),
      );

      expect(state.message).toMatch(/réservée au responsable de domaine/);
      expect(await personasOf(f.productId)).toEqual([]);
    } finally {
      await clearPersonas();
    }
  });

  test("un produit archivé ne reçoit plus de saisie", async () => {
    currentPerson = f.managerId;
    try {
      const state = await createPersona(
        f.archivedProductId,
        NO_STATE,
        personaForm(),
      );

      expect(state.message).toMatch(/archivé/);
      expect(await personasOf(f.archivedProductId)).toEqual([]);
    } finally {
      await clearPersonas();
    }
  });

  test("une saisie sans nom rend ses erreurs, et n'écrit rien", async () => {
    currentPerson = f.managerId;
    try {
      const state = await createPersona(
        f.productId,
        NO_STATE,
        personaForm({ name: "" }),
      );

      expect(state.errors.name).toBeDefined();
      // La saisie revient telle quelle : Vision ne jette jamais en silence.
      expect(state.values.goals).toBe("Ouvrir un dossier vite\nRetrouver un client");
      expect(await personasOf(f.productId)).toEqual([]);
    } finally {
      await clearPersonas();
    }
  });
});

describe("updatePersona — la porte `openPersona`", () => {
  test("les traits gardent leur identifiant quand leur libellé ne change pas", async () => {
    /* **La propriété qui justifie le diff plutôt que le remplacement** : un
       parcours ou un use case pourra désigner un irritant sans qu'une
       correction du persona ne l'efface. */
    try {
      const personaId = await givenPersona();
      const before = await traitsOf(personaId);

      currentPerson = f.managerId;
      await expectWritten(
        updatePersona(
          f.productId,
          personaId,
          NO_STATE,
          /* L'ordre des deux objectifs s'inverse, le second irritant apparaît,
             et l'attente reste vide : trois cas dans une soumission. */
          personaForm({
            goals: "Retrouver un client\nOuvrir un dossier vite",
            pains: "Ressaisir trois fois\nAttendre la validation",
          }),
        ),
      );

      const after = await traitsOf(personaId);
      const idOf = (rows: typeof after, label: string) =>
        rows.find((row) => row.label === label)?.id;

      // Les trois lignes d'origine sont les mêmes lignes.
      for (const label of [
        "Ouvrir un dossier vite",
        "Retrouver un client",
        "Ressaisir trois fois",
      ]) {
        expect(idOf(after, label)).toBe(idOf(before, label));
      }

      // Et le rang a suivi l'ordre de saisie.
      expect(
        after.find((row) => row.label === "Retrouver un client")?.position,
      ).toBe(0);
      expect(after).toHaveLength(4);
    } finally {
      await clearPersonas();
    }
  });

  test("un trait retiré de la zone de texte disparaît", async () => {
    try {
      const personaId = await givenPersona();

      currentPerson = f.managerId;
      await expectWritten(
        updatePersona(
          f.productId,
          personaId,
          NO_STATE,
          personaForm({ goals: "Ouvrir un dossier vite", pains: "" }),
        ),
      );

      expect((await traitsOf(personaId)).map((row) => row.label)).toEqual([
        "Ouvrir un dossier vite",
      ]);
    } finally {
      await clearPersonas();
    }
  });

  test("le persona d'un autre produit ne se corrige pas depuis celui-ci", async () => {
    /* La soumission forgée que `bind` n'empêche pas : le `productId` lié est
       celui du produit ouvert, le `personaId` celui d'un persona voisin. */
    try {
      const personaId = await givenPersona();

      currentPerson = f.managerId;
      const state = await updatePersona(
        f.otherProductId,
        personaId,
        NO_STATE,
        personaForm({ name: `Forgé ${suffix}` }),
      );

      expect(state.message).toBe("Ce persona n'existe plus sur ce produit.");
      expect((await personasOf(f.productId))[0]?.name).toBe(
        `Chargé de clientèle ${suffix}`,
      );
    } finally {
      await clearPersonas();
    }
  });

  test("un membre sans accompagnement ne corrige rien", async () => {
    try {
      const personaId = await givenPersona();

      currentPerson = f.outsiderId;
      const state = await updatePersona(
        f.productId,
        personaId,
        NO_STATE,
        personaForm({ name: `Forgé ${suffix}` }),
      );

      expect(state.message).toMatch(/réservée au responsable de domaine/);
      expect((await personasOf(f.productId))[0]?.name).toBe(
        `Chargé de clientèle ${suffix}`,
      );
    } finally {
      await clearPersonas();
    }
  });
});

describe("archivePersona — le rangement", () => {
  test("le persona quitte le bloc, ses traits restent avec lui", async () => {
    try {
      const personaId = await givenPersona();

      currentPerson = f.managerId;
      await archivePersona(f.productId, personaId);

      expect(await personasOf(f.productId)).toEqual([]);
      // Règle 4 : rien n'est supprimé. La fiche redeviendrait entière.
      expect(await traitsOf(personaId)).toHaveLength(3);
    } finally {
      await clearPersonas();
    }
  });

  test("un membre sans accompagnement ne range rien — et le refus est muet", async () => {
    try {
      const personaId = await givenPersona();

      currentPerson = f.outsiderId;
      await expect(
        archivePersona(f.productId, personaId),
      ).resolves.toBeUndefined();

      expect(await personasOf(f.productId)).toHaveLength(1);
    } finally {
      await clearPersonas();
    }
  });

  test("le persona d'un autre produit ne se range pas depuis celui-ci", async () => {
    try {
      const personaId = await givenPersona();

      currentPerson = f.managerId;
      await archivePersona(f.otherProductId, personaId);

      expect(await personasOf(f.productId)).toHaveLength(1);
    } finally {
      await clearPersonas();
    }
  });
});

/* ==========================================================================
   Les trois gestes du use case — le droit s'éprouve par l'action

   Mêmes portes que le groupe persona — `openProductWrite` puis `openUseCase` —,
   et **une de plus qui n'a pas d'équivalent** : `attachablePersonas`, qui
   confronte les identifiants **saisis** aux personae vivants du produit reçu.

   C'est celle-là qui compte le plus, et pour une raison de nature : les
   identifiants d'un persona n'arrivent pas par une liaison côté serveur mais
   par le **formulaire**. Les cases à cocher du panneau sont rendues sur une page
   servie à quelqu'un d'autre ; une soumission poste ce qu'elle veut sous le nom
   `personaIds`. Sans cette porte, un use case afficherait le profil d'un autre
   produit — un profil que le bloc « Personae » de la même page ne montre pas.

   Deux mesures par refus, et pas une : **la ligne n'est pas écrite** en base, et
   l'action **rend son refus**. Une action refusée qui rendrait un état sans
   message serait indiscernable d'une action qui a écrit.
   ========================================================================== */

/**
 * Le `FormData` d'un use case valide, dont chaque test ne change que le sien.
 *
 * **`formForUseCase` et non `useCaseForm`**, et `liveUseCasesOf` et non
 * `useCasesOf` : `react-hooks/rules-of-hooks` reconnaît un crochet React à
 * `use` suivi d'une majuscule, et refuse alors tout appel depuis une fonction
 * qui n'est ni un composant ni un crochet. La règle a mordu **deux fois** dans
 * ce ticket — ici, et sur `refuseUseCase` dans `actions.ts`. La convention
 * vaut donc pour tout le dépôt : **un helper dont l'objet s'appelle `useX` met
 * le verbe devant.**
 */
function formForUseCase(overrides: Record<string, string | string[]> = {}): FormData {
  const data = new FormData();
  const values: Record<string, string | string[]> = {
    title: `Démarrer un projet ${suffix}`,
    summary: "Retrouver un environnement de travail prêt à l'emploi.",
    ...overrides,
  };
  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) {
      for (const entry of value) data.append(key, entry);
    } else {
      data.set(key, value);
    }
  }
  return data;
}

/** L'état vide qu'`useActionState` passe en premier argument. */
const NO_USE_CASE_STATE = { values: EMPTY_USE_CASE_VALUES, errors: {} };

/** Les use cases d'un produit, lus **en base** et non par un écran. */
async function liveUseCasesOf(productId: string) {
  return db
    .select({
      id: useCases.id,
      title: useCases.title,
      summary: useCases.summary,
    })
    .from(useCases)
    .where(
      and(eq(useCases.productId, productId), isNull(useCases.archivedAt)),
    );
}

/** Les rattachements d'un use case, lus en base. */
async function attachedTo(useCaseId: string): Promise<string[]> {
  const rows = await db
    .select({ personaId: useCasePersonas.personaId })
    .from(useCasePersonas)
    .where(eq(useCasePersonas.useCaseId, useCaseId));
  return rows.map((row) => row.personaId).sort();
}

/** Écrit un use case par le chemin normal, et rend son identifiant. */
async function givenUseCase(
  overrides: Record<string, string | string[]> = {},
): Promise<string> {
  currentPerson = f.managerId;
  await expectWritten(
    createUseCase(f.productId, NO_USE_CASE_STATE, formForUseCase(overrides)),
  );
  const rows = await liveUseCasesOf(f.productId);
  return rows[rows.length - 1]!.id;
}

/** Un persona vivant sur le produit visé, écrit par le chemin normal. */
async function givenPersonaOn(productId: string): Promise<string> {
  const created = await f.scope.insert(personas, {
    productId,
    name: `Profil ${Math.random().toString(36).slice(2, 8)}`,
    kind: "secondary",
  });
  return created.id;
}

/** Remet le produit à zéro entre deux tests : la fixture est partagée. */
async function clearUseCases(): Promise<void> {
  await db
    .delete(useCasePersonas)
    .where(eq(useCasePersonas.domainId, f.domainId));
  await db.delete(useCases).where(eq(useCases.domainId, f.domainId));
  await db.delete(personas).where(eq(personas.domainId, f.domainId));
}

describe("createUseCase — ce que le geste écrit", () => {
  test("le responsable de domaine écrit la ligne", async () => {
    try {
      const useCaseId = await givenUseCase();
      const rows = await liveUseCasesOf(f.productId);

      expect(rows).toHaveLength(1);
      expect(rows[0]!.id).toBe(useCaseId);
      expect(rows[0]!.summary).toBe(
        "Retrouver un environnement de travail prêt à l'emploi.",
      );
      expect(await attachedTo(useCaseId)).toEqual([]);
    } finally {
      await clearUseCases();
    }
  });

  test("un contributeur désigné écrit aussi — c'est le droit dérivé", async () => {
    try {
      currentPerson = f.contributorId;
      await expectWritten(
        createUseCase(f.productId, NO_USE_CASE_STATE, formForUseCase()),
      );
      expect(await liveUseCasesOf(f.productId)).toHaveLength(1);
    } finally {
      await clearUseCases();
    }
  });

  test("les personae cochés sont rattachés", async () => {
    try {
      const alice = await givenPersonaOn(f.productId);
      const bruno = await givenPersonaOn(f.productId);
      const useCaseId = await givenUseCase({ personaIds: [alice, bruno] });

      expect(await attachedTo(useCaseId)).toEqual([alice, bruno].sort());
    } finally {
      await clearUseCases();
    }
  });
});

describe("createUseCase — ce que le geste refuse", () => {
  test("un membre sans accompagnement n'écrit rien", async () => {
    try {
      currentPerson = f.outsiderId;
      const state = await createUseCase(
        f.productId,
        NO_USE_CASE_STATE,
        formForUseCase(),
      );

      expect(state.message).toBeDefined();
      expect(state.ok).toBeUndefined();
      expect(await liveUseCasesOf(f.productId)).toHaveLength(0);
    } finally {
      await clearUseCases();
    }
  });

  test("un produit archivé ne reçoit plus de saisie", async () => {
    try {
      currentPerson = f.managerId;
      const state = await createUseCase(
        f.archivedProductId,
        NO_USE_CASE_STATE,
        formForUseCase(),
      );

      expect(state.message).toContain("archivé");
      expect(await liveUseCasesOf(f.archivedProductId)).toHaveLength(0);
    } finally {
      await clearUseCases();
    }
  });

  test("une saisie sans description rend ses erreurs, et n'écrit rien", async () => {
    try {
      currentPerson = f.managerId;
      const state = await createUseCase(
        f.productId,
        NO_USE_CASE_STATE,
        formForUseCase({ summary: "" }),
      );

      expect(state.errors.summary).toBeDefined();
      expect(state.ok).toBeUndefined();
      expect(await liveUseCasesOf(f.productId)).toHaveLength(0);
    } finally {
      await clearUseCases();
    }
  });

  /* **La porte propre à ce groupe.** Le persona existe, il est vivant, il
     appartient au domaine — et il est sur un **autre produit**. Rien dans le
     panneau ne l'aurait proposé ; une soumission forgée le poste. */
  test("le persona d'un autre produit ne se rattache pas", async () => {
    try {
      const intrus = await givenPersonaOn(f.otherProductId);
      currentPerson = f.managerId;

      const state = await createUseCase(
        f.productId,
        NO_USE_CASE_STATE,
        formForUseCase({ personaIds: [intrus] }),
      );

      expect(state.message).toBeDefined();
      expect(state.ok).toBeUndefined();
      /* **Aucune ligne à demi écrite** : le refus tombe avant l'insertion du
         use case, ce que la règle de T3.6 demandait — tout confronter au
         domaine avant d'écrire, faute de transaction. */
      expect(await liveUseCasesOf(f.productId)).toHaveLength(0);
    } finally {
      await clearUseCases();
    }
  });

  test("un persona archivé ne se rattache pas non plus", async () => {
    try {
      const range = await givenPersonaOn(f.productId);
      await f.scope.archive(personas, range);
      currentPerson = f.managerId;

      const state = await createUseCase(
        f.productId,
        NO_USE_CASE_STATE,
        formForUseCase({ personaIds: [range] }),
      );

      expect(state.message).toBeDefined();
      expect(await liveUseCasesOf(f.productId)).toHaveLength(0);
    } finally {
      await clearUseCases();
    }
  });
});

describe("updateUseCase — la porte `openUseCase`", () => {
  test("le rattachement se corrige par différence, et le reste ne bouge pas", async () => {
    try {
      const alice = await givenPersonaOn(f.productId);
      const bruno = await givenPersonaOn(f.productId);
      const useCaseId = await givenUseCase({ personaIds: [alice] });

      currentPerson = f.managerId;
      await expectWritten(
        updateUseCase(
          f.productId,
          useCaseId,
          NO_USE_CASE_STATE,
          formForUseCase({ personaIds: [alice, bruno] }),
        ),
      );

      expect(await attachedTo(useCaseId)).toEqual([alice, bruno].sort());
    } finally {
      await clearUseCases();
    }
  });

  /* Le diff plutôt que le remplacement : **l'identifiant d'un rattachement
     survit** à une correction qui ne le touche pas. C'est ce qui permettra à un
     méga-parcours de désigner un lien sans qu'il s'efface à la correction
     suivante — la raison pour laquelle `syncTraits` avait été écrit ainsi. */
  test("un rattachement conservé garde son identifiant", async () => {
    try {
      const alice = await givenPersonaOn(f.productId);
      const useCaseId = await givenUseCase({ personaIds: [alice] });

      const before = await db
        .select({ id: useCasePersonas.id })
        .from(useCasePersonas)
        .where(eq(useCasePersonas.useCaseId, useCaseId));

      currentPerson = f.managerId;
      await expectWritten(
        updateUseCase(
          f.productId,
          useCaseId,
          NO_USE_CASE_STATE,
          formForUseCase({ title: "Un autre titre", personaIds: [alice] }),
        ),
      );

      const after = await db
        .select({ id: useCasePersonas.id })
        .from(useCasePersonas)
        .where(eq(useCasePersonas.useCaseId, useCaseId));

      expect(after).toEqual(before);
    } finally {
      await clearUseCases();
    }
  });

  test("une case décochée retire le rattachement", async () => {
    try {
      const alice = await givenPersonaOn(f.productId);
      const useCaseId = await givenUseCase({ personaIds: [alice] });

      currentPerson = f.managerId;
      await expectWritten(
        updateUseCase(
          f.productId,
          useCaseId,
          NO_USE_CASE_STATE,
          formForUseCase(),
        ),
      );

      expect(await attachedTo(useCaseId)).toEqual([]);
    } finally {
      await clearUseCases();
    }
  });

  test("le use case d'un autre produit ne se corrige pas depuis celui-ci", async () => {
    try {
      currentPerson = f.managerId;
      await expectWritten(
        createUseCase(
          f.otherProductId,
          NO_USE_CASE_STATE,
          formForUseCase({ title: `Voisin ${suffix}` }),
        ),
      );
      const voisin = (await liveUseCasesOf(f.otherProductId))[0]!;

      const state = await updateUseCase(
        f.productId,
        voisin.id,
        NO_USE_CASE_STATE,
        formForUseCase({ title: "Détourné" }),
      );

      expect(state.message).toBeDefined();
      expect((await liveUseCasesOf(f.otherProductId))[0]!.title).toBe(voisin.title);
    } finally {
      await clearUseCases();
    }
  });

  test("un membre sans accompagnement ne corrige rien", async () => {
    try {
      const useCaseId = await givenUseCase();

      currentPerson = f.outsiderId;
      const state = await updateUseCase(
        f.productId,
        useCaseId,
        NO_USE_CASE_STATE,
        formForUseCase({ title: "Détourné" }),
      );

      expect(state.message).toBeDefined();
      expect((await liveUseCasesOf(f.productId))[0]!.title).toContain("Démarrer");
    } finally {
      await clearUseCases();
    }
  });
});

describe("archiveUseCase — le rangement", () => {
  test("le use case quitte le bloc, ses rattachements restent avec lui", async () => {
    try {
      const alice = await givenPersonaOn(f.productId);
      const useCaseId = await givenUseCase({ personaIds: [alice] });

      currentPerson = f.managerId;
      await archiveUseCase(f.productId, useCaseId);

      expect(await liveUseCasesOf(f.productId)).toHaveLength(0);
      /* Règle 4 : rien n'est supprimé. Archiver le parent ne cascade sur rien
         (arbitrage (f)), et la fiche redeviendrait entière si un écran la
         rétablissait. */
      expect(await attachedTo(useCaseId)).toEqual([alice]);
    } finally {
      await clearUseCases();
    }
  });

  test("un membre sans accompagnement ne range rien — et le refus est muet", async () => {
    try {
      const useCaseId = await givenUseCase();

      currentPerson = f.outsiderId;
      await expect(
        archiveUseCase(f.productId, useCaseId),
      ).resolves.toBeUndefined();

      expect(await liveUseCasesOf(f.productId)).toHaveLength(1);
    } finally {
      await clearUseCases();
    }
  });

  test("le use case d'un autre produit ne se range pas depuis celui-ci", async () => {
    try {
      currentPerson = f.managerId;
      await expectWritten(
        createUseCase(
          f.otherProductId,
          NO_USE_CASE_STATE,
          formForUseCase({ title: `Voisin ${suffix}` }),
        ),
      );
      const voisin = (await liveUseCasesOf(f.otherProductId))[0]!;

      await archiveUseCase(f.productId, voisin.id);

      expect(await liveUseCasesOf(f.otherProductId)).toHaveLength(1);
    } finally {
      await clearUseCases();
    }
  });
});

/* ==========================================================================
   Le journal du relevé — trois gestes, et le seul cas de niveau produit

   **Ils vivent sur la page produit**, donc `project_id` est nul et `product_id`
   porté : exactement le cas que `docs/04` §4 prévoit par « nul pour les
   événements de niveau produit ». La conséquence se lit d'avance et elle est
   voulue — un relevé n'apparaît pas dans la frise de la page projet (T6.3), il
   apparaît dans le flux global (T6.6).
   ========================================================================== */

const EMPTY_READING = { values: {} as never, errors: {} };

/** Le formulaire de relevé tel que le panneau le soumettrait. */
function readingForm(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(entries)) data.append(name, value);
  return data;
}

/** Un relevé neuf sur l'indicateur de la fixture. */
async function freshReading(readOn: string): Promise<{ id: string }> {
  return f.scope.insert(indicatorReadings, {
    indicatorId: f.indicatorId,
    value: "62",
    readOn,
  });
}

describe("createReading — ce que le journal porte", () => {
  test("une ligne, et une seule, avec son verbe et sa phrase", async () => {
    currentPerson = f.managerId;

    const lines = await written(() =>
      createReading(
        f.productId,
        f.indicatorId,
        EMPTY_READING,
        readingForm({ value: "62", readOn: "2026-05-31" }),
      ),
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]?.verb).toBe("created");
    expect(lines[0]?.targetType).toBe("indicator_reading");
    expect(lines[0]?.actorId).toBe(f.managerId);
    // La phrase nomme l'**indicateur** : un relevé n'a pas de nom propre, et
    // « Relevé créé : 62 » ne désignerait rien.
    expect(lines[0]?.summary).toBe(`Relevé créé${NBSP}: Autonomie ${suffix}`);

    const [row] = await db
      .select({ id: indicatorReadings.id })
      .from(indicatorReadings)
      .where(
        and(
          eq(indicatorReadings.indicatorId, f.indicatorId),
          eq(indicatorReadings.readOn, "2026-05-31"),
        ),
      );
    expect(lines[0]?.targetId).toBe(row?.id);
  });

  /**
   * **Le cas qu'aucun écran ne dira jamais**, et le seul du dépôt : un
   * événement sans projet. Y poser arbitrairement l'un des accompagnements du
   * produit serait un mensonge que la frise de T6.3 afficherait fidèlement.
   */
  test("`project_id` est nul, `product_id` est posé", async () => {
    currentPerson = f.managerId;

    const lines = await written(() =>
      createReading(
        f.productId,
        f.indicatorId,
        EMPTY_READING,
        readingForm({ value: "70", readOn: "2026-06-30" }),
      ),
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]?.projectId).toBeNull();
    expect(lines[0]?.productId).toBe(f.productId);
  });
});

describe("updateReading et archiveReading", () => {
  test("la correction écrit `updated`, sans jamais porter la valeur", async () => {
    currentPerson = f.managerId;
    const reading = await freshReading("2026-07-31");

    const lines = await written(() =>
      updateReading(
        f.productId,
        reading.id,
        EMPTY_READING,
        readingForm({ value: "88", readOn: "2026-08-31" }),
      ),
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]?.verb).toBe("updated");
    expect(lines[0]?.targetType).toBe("indicator_reading");
    expect(lines[0]?.targetId).toBe(reading.id);
    expect(lines[0]?.summary).toBe(`Relevé modifié${NBSP}: Autonomie ${suffix}`);
    /* Ni la valeur d'avant ni celle d'après : le journal n'est pas un
       historique (D22), et la phrase désigne ce qui a été touché. */
    expect(lines[0]?.summary).not.toContain("88");
    expect(lines[0]?.summary).not.toContain("62");
  });

  test("le rangement écrit `archived`", async () => {
    currentPerson = f.managerId;
    const reading = await freshReading("2026-09-30");

    const lines = await written(() => archiveReading(f.productId, reading.id));

    expect(lines).toHaveLength(1);
    expect(lines[0]?.verb).toBe("archived");
    expect(lines[0]?.targetType).toBe("indicator_reading");
    expect(lines[0]?.targetId).toBe(reading.id);
    expect(lines[0]?.projectId).toBeNull();
    expect(lines[0]?.productId).toBe(f.productId);
    expect(lines[0]?.summary).toBe(`Relevé archivé${NBSP}: Autonomie ${suffix}`);
  });
});

/* ==========================================================================
   Le droit s'éprouve par l'action, jamais par l'écran
   ========================================================================== */

describe("un refus n'écrit ni le relevé ni l'événement", () => {
  test("un membre sans accompagnement n'écrit rien", async () => {
    currentPerson = f.outsiderId;

    let state: { message?: string } | undefined;
    const lines = await written(async () => {
      state = await createReading(
        f.productId,
        f.indicatorId,
        EMPTY_READING,
        readingForm({ value: "99", readOn: "2026-10-31" }),
      );
    });

    // L'étape témoin : sans elle, un refus et une panne seraient indiscernables.
    expect(state?.message).toContain("réservée au responsable de domaine");

    expect(lines).toHaveLength(0);
    const forged = await db
      .select({ id: indicatorReadings.id })
      .from(indicatorReadings)
      .where(
        and(
          eq(indicatorReadings.indicatorId, f.indicatorId),
          eq(indicatorReadings.readOn, "2026-10-31"),
        ),
      );
    expect(forged).toHaveLength(0);
  });

  /**
   * **Le relevé d'un indicateur d'un autre produit ne se corrige pas depuis
   * celui-ci** — `openReading` remonte la chaîne. Le refus est muet ; seul le
   * décompte le dit.
   */
  test("un relevé d'un autre produit n'est ni corrigé ni journalisé", async () => {
    currentPerson = f.managerId;
    const stranger = await f.scope.insert(indicatorReadings, {
      indicatorId: f.otherProductIndicatorId,
      value: "12",
      readOn: "2026-11-30",
    });

    const lines = await written(() =>
      updateReading(
        f.productId,
        stranger.id,
        EMPTY_READING,
        readingForm({ value: "1000", readOn: "2026-11-30" }),
      ),
    );

    expect(lines).toHaveLength(0);
    const [row] = await db
      .select({ value: indicatorReadings.value })
      .from(indicatorReadings)
      .where(eq(indicatorReadings.id, stranger.id));
    expect(row?.value).toBe("12.0000");
  });
});

/* ==========================================================================
   Le dispositif de mesure — le droit s'éprouve par l'action (01/09/2026)

   **Le rang perd son ⋮ pour qui n'a pas le droit, et cela ne prouve rien.** Les
   identifiants liés d'une action serveur sont sérialisés en clair dans un champ
   `$ACTION_…`, réécrivable : ce fichier interroge donc les cinq actions
   elles-mêmes, avec les identifiants qu'une soumission forgée porterait.

   Les cinq passent par `openProductWrite`, la porte des indicateurs — l'arbitrage
   retenu en session. Ce qui est éprouvé ici vaut donc pour elles autant que pour
   les gestes de T5.2, et le mesure sur des actions neuves.
   ========================================================================== */

const EMPTY_TRACKING = { values: EMPTY_TRACKING_VALUES, errors: {} };
const EMPTY_PLAN = { values: EMPTY_TAGGING_PLAN_VALUES, errors: {} };

function trackingForm(overrides: Record<string, string> = {}): FormData {
  const data = new FormData();
  data.set("toolId", f.toolId);
  data.set("status", "active");
  data.set("scope", "");
  data.set("propertyUrl", "");
  data.set("verifiedOn", "");
  data.set("note", "");
  for (const [key, value] of Object.entries(overrides)) data.set(key, value);
  return data;
}

function planForm(overrides: Record<string, string> = {}): FormData {
  const data = new FormData();
  data.set("url", "https://exemple.test/plan");
  data.set("status", "current");
  data.set("updatedOn", "2026-06-01");
  data.set("note", "");
  for (const [key, value] of Object.entries(overrides)) data.set(key, value);
  return data;
}

/** Les lignes vivantes du dispositif d'un produit, lues en base sans passer par l'écran. */
async function trackingsOf(productId: string) {
  return f.scope.list(productTrackings, {
    where: eq(productTrackings.productId, productId),
  });
}

async function plansOf(productId: string) {
  return f.scope.list(taggingPlans, {
    where: eq(taggingPlans.productId, productId),
  });
}

describe("createTracking — le droit", () => {
  test("un membre non contributeur est refusé, et rien n'est écrit", async () => {
    currentPerson = f.outsiderId;

    const state = await createTracking(f.productId, EMPTY_TRACKING, trackingForm());

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("réservée au responsable de domaine");
    expect(await trackingsOf(f.productId)).toHaveLength(0);
  });

  /* Le droit **dérivé des accompagnements** : le contributeur n'est ni
     responsable de domaine, ni propriétaire de quoi que ce soit — il est
     désigné sur un accompagnement de ce produit, et cela suffit. */
  test("un contributeur désigné écrit", async () => {
    currentPerson = f.contributorId;

    const state = await createTracking(f.productId, EMPTY_TRACKING, trackingForm());

    expect(state.ok).toBe(true);
    expect(await trackingsOf(f.productId)).toHaveLength(1);
  });

  /* **Un produit archivé ne reçoit plus de saisie**, et ce n'est pas le rendu
     qui le refuse : `openProductWrite` refuse le produit archivé **reçu**. */
  test("un produit archivé refuse la saisie, même au responsable", async () => {
    currentPerson = f.managerId;

    const state = await createTracking(
      f.archivedProductId,
      EMPTY_TRACKING,
      trackingForm(),
    );

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("archivé");
    expect(await trackingsOf(f.archivedProductId)).toHaveLength(0);
  });

  /* Le contrôle d'unicité, en message de champ plutôt qu'en violation d'index. */
  test("le même outil déclaré deux fois est refusé sur le champ", async () => {
    currentPerson = f.managerId;

    const state = await createTracking(f.productId, EMPTY_TRACKING, trackingForm());

    expect(state.ok).toBeUndefined();
    expect(state.errors.toolId).toContain("déjà déclaré");
    expect(await trackingsOf(f.productId)).toHaveLength(1);
  });

  test("un autre outil s'ajoute sans difficulté", async () => {
    currentPerson = f.managerId;

    const state = await createTracking(
      f.productId,
      EMPTY_TRACKING,
      trackingForm({ toolId: f.otherToolId }),
    );

    expect(state.ok).toBe(true);
    expect(await trackingsOf(f.productId)).toHaveLength(2);
  });
});

describe("updateTracking — le droit et l'appartenance", () => {
  test("un membre non contributeur est refusé", async () => {
    const [row] = await trackingsOf(f.productId);
    currentPerson = f.outsiderId;

    const state = await updateTracking(
      f.productId,
      row!.id,
      EMPTY_TRACKING,
      trackingForm({ status: "stopped" }),
    );

    expect(state.ok).toBeUndefined();
    const [after] = await trackingsOf(f.productId);
    expect(after!.status).toBe("active");
  });

  /* **L'appartenance se vérifie sur l'identifiant reçu** : une ligne valide du
     bon domaine, mais d'un autre produit, ne s'écrit pas depuis cette page. */
  test("une ligne d'un autre produit est refusée", async () => {
    currentPerson = f.managerId;
    const [row] = await trackingsOf(f.productId);

    const state = await updateTracking(
      f.otherProductId,
      row!.id,
      EMPTY_TRACKING,
      trackingForm({ status: "stopped" }),
    );

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("n'existe plus sur ce produit");
  });

  /* **La ligne courante est exceptée du contrôle d'unicité** : corriger le
     périmètre sans changer d'outil ne doit pas se heurter à sa propre
     déclaration. */
  test("corriger sans changer d'outil ne bute pas sur l'unicité", async () => {
    currentPerson = f.managerId;
    const [row] = await trackingsOf(f.productId);

    const state = await updateTracking(
      f.productId,
      row!.id,
      EMPTY_TRACKING,
      trackingForm({ scope: "Site public" }),
    );

    expect(state.errors.toolId).toBeUndefined();
    expect(state.ok).toBe(true);
  });

  test("reprendre l'outil d'une autre ligne est refusé", async () => {
    currentPerson = f.managerId;
    /* **La ligne est désignée par son outil, jamais par sa position** : `list`
       ne promet aucun ordre, et un `[0]` ferait dépendre le test de ce que la
       base rend ce jour-là. C'est bien la ligne du premier outil qu'on tente de
       faire basculer sur le second. */
    const rows = await trackingsOf(f.productId);
    const row = rows.find((candidate) => candidate.toolId === f.toolId);

    const state = await updateTracking(
      f.productId,
      row!.id,
      EMPTY_TRACKING,
      trackingForm({ toolId: f.otherToolId }),
    );

    expect(state.ok).toBeUndefined();
    expect(state.errors.toolId).toContain("déjà déclaré");
  });
});

describe("archiveTracking — le retrait", () => {
  /* **Les lignes se désignent par leur outil, jamais par leur position** :
     `list` ne promet aucun ordre, et les trois tests qui suivent s'enchaînent —
     un `[0]` en ferait dépendre l'issue de ce que la base rend ce jour-là. */
  const firstTool = async () => {
    const rows = await trackingsOf(f.productId);
    return rows.find((row) => row.toolId === f.toolId)!;
  };

  test("un membre non contributeur ne retire rien", async () => {
    const row = await firstTool();
    currentPerson = f.outsiderId;

    await archiveTracking(f.productId, row.id);

    expect(await trackingsOf(f.productId)).toHaveLength(2);
  });

  /* **Archivage, jamais suppression** (règle 4) : la ligne quitte la lecture,
     elle ne quitte pas la base. */
  test("le responsable retire, et la ligne reste en base", async () => {
    const row = await firstTool();
    currentPerson = f.managerId;

    await archiveTracking(f.productId, row.id);

    expect(await trackingsOf(f.productId)).toHaveLength(1);
    const [kept] = await db
      .select({ archivedAt: productTrackings.archivedAt })
      .from(productTrackings)
      .where(eq(productTrackings.id, row.id));
    expect(kept?.archivedAt).not.toBeNull();
  });

  /* Ce que l'unicité **partielle** autorise, et qu'une unicité totale
     interdirait — la leçon de T4bis.6, éprouvée par l'action. */
  test("l'outil retiré se redéclare aussitôt", async () => {
    currentPerson = f.managerId;

    const state = await createTracking(f.productId, EMPTY_TRACKING, trackingForm());

    expect(state.ok).toBe(true);
  });
});

describe("saveTaggingPlan — un seul geste pour deux moments", () => {
  test("un membre non contributeur est refusé, et rien n'est écrit", async () => {
    currentPerson = f.outsiderId;

    const state = await saveTaggingPlan(f.productId, EMPTY_PLAN, planForm());

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("réservée au responsable de domaine");
    expect(await plansOf(f.productId)).toHaveLength(0);
  });

  test("un produit archivé refuse la saisie", async () => {
    currentPerson = f.managerId;

    const state = await saveTaggingPlan(
      f.archivedProductId,
      EMPTY_PLAN,
      planForm(),
    );

    expect(state.ok).toBeUndefined();
    expect(await plansOf(f.archivedProductId)).toHaveLength(0);
  });

  test("le premier appel insère", async () => {
    currentPerson = f.contributorId;

    const state = await saveTaggingPlan(f.productId, EMPTY_PLAN, planForm());

    expect(state.ok).toBe(true);
    expect(await plansOf(f.productId)).toHaveLength(1);
  });

  /* **Le second appel corrige, il n'insère pas** : c'est ce que l'unicité
     partielle dit, et ce qui fait de « renseigner » et « corriger » un seul
     geste. Sans cette branche, la seconde saisie lèverait une violation d'index. */
  test("le second appel corrige la même ligne", async () => {
    currentPerson = f.managerId;

    const state = await saveTaggingPlan(
      f.productId,
      EMPTY_PLAN,
      planForm({ status: "stale", updatedOn: "2026-03-03" }),
    );

    expect(state.ok).toBe(true);
    const rows = await plansOf(f.productId);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe("stale");
    expect(rows[0]?.updatedOn).toBe("2026-03-03");
  });

  test("une adresse qui n'en est pas une est refusée sur le champ", async () => {
    currentPerson = f.managerId;

    const state = await saveTaggingPlan(
      f.productId,
      EMPTY_PLAN,
      planForm({ url: "sharepoint/plan" }),
    );

    expect(state.ok).toBeUndefined();
    expect(state.errors.url).toBeDefined();
  });
});

describe("archiveTaggingPlan — le retrait", () => {
  test("un membre non contributeur ne retire rien", async () => {
    currentPerson = f.outsiderId;

    await archiveTaggingPlan(f.productId);

    expect(await plansOf(f.productId)).toHaveLength(1);
  });

  test("le responsable retire, et un nouveau plan peut être déclaré", async () => {
    currentPerson = f.managerId;

    await archiveTaggingPlan(f.productId);
    expect(await plansOf(f.productId)).toHaveLength(0);

    const state = await saveTaggingPlan(f.productId, EMPTY_PLAN, planForm());
    expect(state.ok).toBe(true);
    expect(await plansOf(f.productId)).toHaveLength(1);
  });
});
