/**
 * Les tests du budget d'un accompagnement.
 *
 * **Aucune base**, comme ceux des douze modules qui précèdent : c'est la
 * contrepartie d'avoir isolé la validation dans un module pur, et la raison
 * pour laquelle ce module existe. Ils énoncent la règle plutôt que de
 * l'observer sur une fixture.
 *
 * Trois propriétés portent le poids du fichier. **L'absence totale
 * d'obligation** — seul `project_id` est `not null` sur `budgets`, et il ne se
 * saisit pas : un formulaire vide est une saisie valide, et c'est le seul
 * chemin qui **défait** un budget saisi par erreur, la table n'ayant ni
 * archivage ni suppression (arbitrage (c)). **Les cinq colonnes qui repassent à
 * `null`** quand on vide un champ : sans cela, un montant entré par erreur
 * resterait pour toujours. Et le **tour exact** `toBudgetFormValues` →
 * `parseBudgetForm` : ce qu'on réaffiche en correction doit se re-soumettre à
 * l'identique sans rien changer en base, sans quoi rouvrir un panneau et
 * enregistrer déplacerait les deux montants.
 *
 * Le contrôle décimal lui-même n'est **pas re-testé ici** : il vit dans
 * `lib/forms/result.ts`, où `result.test.ts` l'éprouve forme par forme. Ce qui
 * est éprouvé ici est qu'il est bien **appelé, et sur les deux champs** — deux
 * formes suffisent pour cela, une acceptée et une refusée. Même règle pour
 * `isIsoDay` et `isWebUrl`.
 *
 * Ce qui n'est pas testé ici, et ne doit pas l'être : l'existence de l'outil
 * dans le domaine, son archivage, l'unicité `(projet)`, le droit d'écrire.
 * C'est tranché par l'action, et par `lib/db/scoped.ts` derrière elle.
 */

import { describe, expect, test } from "vitest";

import {
  EMPTY_BUDGET_VALUES,
  parseBudgetForm,
  readBudgetForm,
  toBudgetFormValues,
  validateBudgetForm,
  type BudgetFormValues,
} from "./budget";

/** Un identifiant de la bonne forme — la validation n'en demande pas plus. */
const TOOL = "8c7b6a5d-4e3f-4a2b-9c8d-7e6f5a4b3c2d";

const DEEP_LINK = "https://gestion.example.com/projets/refonte-2026/budget";

/** Une saisie complète et valide, dont chaque test ne change que ce qu'il éprouve. */
function values(overrides: Partial<BudgetFormValues> = {}): BudgetFormValues {
  return {
    allocated: "120",
    consumed: "87,5",
    measuredOn: "2026-08-31",
    toolId: TOOL,
    externalUrl: DEEP_LINK,
    ...overrides,
  };
}

/** Le `FormData` correspondant, pour les tests qui passent par la lecture. */
function formOf(overrides: Partial<BudgetFormValues> = {}): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values(overrides))) {
    data.set(key, value);
  }
  return data;
}

/* ==========================================================================
   La lecture
   ========================================================================== */

describe("readBudgetForm", () => {
  test("les cinq champs sont lus et rognés", () => {
    const data = new FormData();
    data.set("allocated", "  120  ");
    data.set("consumed", "  87,5 ");
    data.set("measuredOn", " 2026-08-31 ");
    data.set("toolId", ` ${TOOL} `);
    data.set("externalUrl", `  ${DEEP_LINK}  `);

    expect(readBudgetForm(data)).toEqual(values());
  });

  test("un champ absent vaut vide, jamais `undefined`", () => {
    expect(readBudgetForm(new FormData())).toEqual(EMPTY_BUDGET_VALUES);
  });

  test("`unit` ne se lit pas, même soumise", () => {
    /* L'énuméré `budget_unit` n'a qu'une valeur et la colonne porte son défaut :
       le panneau ne l'offre pas, et un champ ajouté par n'importe qui ne doit
       pas devenir une colonne écrite. La lecture nomme ses champs, elle
       n'étale pas le `FormData`. */
    const data = formOf();
    data.set("unit", "euros");

    expect(readBudgetForm(data)).not.toHaveProperty("unit");
  });

  test("`projectId` ne se lit pas non plus : il est lié côté serveur", () => {
    const data = formOf();
    data.set("projectId", "8c7b6a5d-4e3f-4a2b-9c8d-000000000000");

    expect(readBudgetForm(data)).not.toHaveProperty("projectId");
  });
});

/* ==========================================================================
   Aucune obligation — c'est la colonne qui décide
   ========================================================================== */

describe("validateBudgetForm — rien n'est obligatoire", () => {
  test("un formulaire entièrement vide ne rend aucune erreur", () => {
    // Seul `project_id` est `not null` sur `budgets`, et il ne se saisit pas.
    expect(validateBudgetForm(EMPTY_BUDGET_VALUES)).toEqual({});
  });

  test("un budget alloué sans relevé ni outil est une saisie normale", () => {
    expect(
      validateBudgetForm({
        ...EMPTY_BUDGET_VALUES,
        allocated: "120",
      }),
    ).toEqual({});
  });

  test("une saisie complète ne rend aucune erreur", () => {
    expect(validateBudgetForm(values())).toEqual({});
  });
});

/* ==========================================================================
   Les quatre contrôles de forme
   ========================================================================== */

describe("validateBudgetForm — les montants", () => {
  test("la virgule est acceptée sur les deux champs", () => {
    expect(
      validateBudgetForm(values({ allocated: "120,25", consumed: "87,5" })),
    ).toEqual({});
  });

  test("un montant qui n'est pas un nombre est refusé, champ par champ", () => {
    expect(validateBudgetForm(values({ allocated: "beaucoup" }))).toEqual({
      allocated: expect.stringContaining("nombre"),
    });
    expect(validateBudgetForm(values({ consumed: "1e5" }))).toEqual({
      consumed: expect.stringContaining("nombre"),
    });
  });

  test("les deux montants ne sont jamais comparés l'un à l'autre", () => {
    /* D39 : un reste, un pourcentage ou un « dépassement » seraient l'indice
       **calculé par Vision** que le produit s'interdit. Un consommé supérieur à
       l'alloué est un fait que l'outil de gestion connaît avant elle, et le
       refuser ici empêcherait de reporter la vérité. */
    expect(
      validateBudgetForm(values({ allocated: "10", consumed: "9999" })),
    ).toEqual({});
  });
});

describe("validateBudgetForm — la date, l'outil, l'adresse", () => {
  test("une date qui n'existe pas est refusée", () => {
    expect(validateBudgetForm(values({ measuredOn: "2026-02-30" }))).toEqual({
      measuredOn: expect.stringContaining("n'existe pas"),
    });
  });

  test("un identifiant d'outil qui n'en a pas la forme est refusé", () => {
    // La forme avant la base : une colonne `uuid` interrogée avec n'importe
    // quoi rend une erreur PostgreSQL, donc un 500, là où l'on attend un
    // message de champ.
    expect(validateBudgetForm(values({ toolId: "ergonome" }))).toEqual({
      toolId: expect.stringContaining("reconnu"),
    });
  });

  test("une adresse qui n'est pas un lien web est refusée", () => {
    /* Le bloc rend ce lien par `ExternalLink`, qui pose le `href` tel quel :
       une adresse `javascript:` enregistrée s'exécuterait au clic. L'écriture
       est le seul endroit où l'on décide encore de ce qui entre. */
    for (const hostile of [
      "javascript:alert(1)",
      "gestion.example.com/budget",
      "/budget",
    ]) {
      expect(validateBudgetForm(values({ externalUrl: hostile }))).toEqual({
        externalUrl: expect.stringContaining("lien web"),
      });
    }
  });

  test("plusieurs champs fautifs rendent plusieurs messages", () => {
    expect(
      validateBudgetForm(
        values({ allocated: "beaucoup", measuredOn: "hier", toolId: "x" }),
      ),
    ).toEqual({
      allocated: expect.any(String),
      measuredOn: expect.any(String),
      toolId: expect.any(String),
    });
  });
});

/* ==========================================================================
   De la saisie à la ligne
   ========================================================================== */

describe("parseBudgetForm", () => {
  test("`input` est non nul si et seulement si `errors` est vide", () => {
    const accepted = parseBudgetForm(formOf());
    expect(accepted.errors).toEqual({});
    expect(accepted.input).not.toBeNull();

    const refused = parseBudgetForm(formOf({ allocated: "beaucoup" }));
    expect(Object.keys(refused.errors)).toHaveLength(1);
    expect(refused.input).toBeNull();
  });

  test("les montants partent normalisés, la saisie revient telle qu'elle a été tapée", () => {
    const { values: typed, input } = parseBudgetForm(formOf());

    // Le point pour la colonne…
    expect(input?.allocated).toBe("120");
    expect(input?.consumed).toBe("87.5");
    // …la virgule pour la personne : `values` et `input` ne servent pas le même
    // propos, et un refus doit rendre ce qui a été écrit.
    expect(typed.consumed).toBe("87,5");
  });

  test("un formulaire vide rend une ligne dont les cinq colonnes sont nulles", () => {
    /* C'est le geste qui **défait** un budget saisi par erreur : `budgets` ne
       porte pas d'`archived_at` et ne se supprime pas (arbitrage (c)), si bien
       que vider les champs est le seul chemin de rattrapage. */
    const { errors, input } = parseBudgetForm(new FormData());

    expect(errors).toEqual({});
    expect(input).toEqual({
      allocated: null,
      consumed: null,
      measuredOn: null,
      toolId: null,
      externalUrl: null,
    });
  });

  test("un champ vidé seul repasse à `null` sans toucher les autres", () => {
    const { input } = parseBudgetForm(formOf({ consumed: "", toolId: "" }));

    expect(input).toEqual({
      allocated: "120",
      consumed: null,
      measuredOn: "2026-08-31",
      toolId: null,
      externalUrl: DEEP_LINK,
    });
  });

  test("la ligne ne porte ni `projectId` ni `unit`", () => {
    const { input } = parseBudgetForm(formOf());

    expect(input).not.toHaveProperty("projectId");
    expect(input).not.toHaveProperty("unit");
  });
});

/* ==========================================================================
   Le tour exact — ce qu'on réaffiche se re-soumet à l'identique
   ========================================================================== */

describe("toBudgetFormValues", () => {
  test("les montants se retapent tels qu'on les écrit, jamais « 120.0000 »", () => {
    expect(
      toBudgetFormValues({
        allocated: "120.0000",
        consumed: "87.5000",
        measuredOn: "2026-08-31",
        toolId: TOOL,
        externalUrl: DEEP_LINK,
      }),
    ).toEqual({
      allocated: "120",
      consumed: "87.5",
      measuredOn: "2026-08-31",
      toolId: TOOL,
      externalUrl: DEEP_LINK,
    });
  });

  test("une ligne toute nulle rend les cinq chaînes vides", () => {
    expect(
      toBudgetFormValues({
        allocated: null,
        consumed: null,
        measuredOn: null,
        toolId: null,
        externalUrl: null,
      }),
    ).toEqual(EMPTY_BUDGET_VALUES);
  });

  test("le tour est exact : réaffiché puis re-soumis, rien ne bouge", () => {
    /* Sans cette propriété, rouvrir le panneau d'un budget et enregistrer sans
       rien changer déplacerait les deux montants en base. */
    const shown = toBudgetFormValues({
      allocated: "120.0000",
      consumed: "87.5000",
      measuredOn: "2026-08-31",
      toolId: TOOL,
      externalUrl: DEEP_LINK,
    });

    const data = new FormData();
    for (const [key, value] of Object.entries(shown)) data.set(key, value);

    const { errors, input } = parseBudgetForm(data);
    expect(errors).toEqual({});
    expect(input).toEqual({
      allocated: "120",
      consumed: "87.5",
      measuredOn: "2026-08-31",
      toolId: TOOL,
      externalUrl: DEEP_LINK,
    });
  });
});
