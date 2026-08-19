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
 */

import { and, eq, isNull } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import { db } from "@/lib/db/client";
import { forDomain, superAdmin, type ScopedDb } from "@/lib/db/scoped";
import {
  domains,
  entities,
  indicators,
  personaTraits,
  personas,
  persons,
  products,
  projectMembers,
  projectStatuses,
  projects,
  useCasePersonas,
  useCases,
} from "@/lib/db/schema";
import { EMPTY_PERSONA_VALUES } from "@/lib/forms/persona";
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
  archiveUseCase,
  createPersona,
  createUseCase,
  setNorthStar,
  updatePersona,
  updateUseCase,
} = await import("./actions");

const suffix = Math.random().toString(36).slice(2, 10);

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
};

let f: Fixture;

beforeAll(async () => {
  const domain = await superAdmin.createDomain({
    name: `__test__actions__${suffix}`,
    competenceCenterName: `Centre ${suffix}`,
  });
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
  };
}, 180_000);

afterAll(async () => {
  if (!f?.domainId) return;
  const tables = [
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
  ];
  for (const table of tables) {
    await db.delete(table).where(eq(table.domainId, f.domainId));
  }
  await db.delete(domains).where(eq(domains.id, f.domainId));
});

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
