/**
 * Les tests de la saisie d'un indicateur.
 *
 * **Aucune base**, comme ceux du produit, du projet, de l'activité, de la
 * ressource et du résultat : c'est la contrepartie d'avoir isolé la validation
 * dans un module pur. Ils énoncent la règle plutôt que de l'observer sur une
 * fixture.
 *
 * Deux blocs portent le poids du fichier, et ce sont les deux règles de la
 * fiche T5.2 — l'obligation du **libellé**, et la **liste fermée** du sens de
 * lecture. Le second n'est pas décoratif : le `select` du panneau ne propose que
 * les deux valeurs de l'énuméré, mais une soumission forgée porte ce qu'elle
 * veut, et une valeur hors énuméré rendrait une erreur PostgreSQL — un 500 — là
 * où l'on attend un message de champ.
 *
 * Ce qui n'est pas testé ici, et ne doit pas l'être : l'existence du produit
 * dans le domaine, le droit d'y écrire, l'appartenance de l'indicateur au
 * produit. C'est tranché par l'action, et par `lib/db/scoped.ts` derrière elle.
 */

import { describe, expect, test } from "vitest";

import {
  EMPTY_INDICATOR_VALUES,
  INDICATOR_DIRECTION_VALUES,
  isIndicatorDirection,
  parseIndicatorForm,
  readIndicatorForm,
  toIndicatorFormValues,
  validateIndicatorForm,
  type IndicatorFormValues,
} from "./indicator";

/** Une saisie complète et valide, dont chaque test ne change que ce qu'il éprouve. */
function values(overrides: Partial<IndicatorFormValues> = {}): IndicatorFormValues {
  return {
    label: "Autonomie des utilisateurs",
    unit: "%",
    direction: "higher_is_better",
    source: "Portail analytics",
    ...overrides,
  };
}

/** Le `FormData` correspondant, pour les tests qui passent par la lecture. */
function formOf(overrides: Partial<IndicatorFormValues> = {}): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values(overrides))) {
    data.set(key, value);
  }
  return data;
}

/* ==========================================================================
   La lecture
   ========================================================================== */

describe("readIndicatorForm", () => {
  test("lit les quatre champs et les rogne", () => {
    const data = formOf({ label: "  Autonomie  ", source: "  Analytics " });

    expect(readIndicatorForm(data)).toEqual({
      label: "Autonomie",
      unit: "%",
      direction: "higher_is_better",
      source: "Analytics",
    });
  });

  test("un champ absent vaut vide, jamais `undefined`", () => {
    expect(readIndicatorForm(new FormData())).toEqual(EMPTY_INDICATOR_VALUES);
  });

  test("un champ que le formulaire ne connaît pas est ignoré", () => {
    /* La règle des cinq modules qui précèdent : l'action ne construit jamais sa
       ligne par étalement d'un `FormData`. Un champ caché ajouté par n'importe
       qui deviendrait sinon une colonne écrite — `productId` en tête, qui est
       lié côté serveur. */
    const data = formOf();
    data.set("productId", "3f2504e0-4f89-11d3-9a0c-0305e82c3311");
    data.set("archivedAt", "2026-01-01");

    expect(Object.keys(readIndicatorForm(data)).sort()).toEqual([
      "direction",
      "label",
      "source",
      "unit",
    ]);
  });
});

/* ==========================================================================
   Le libellé — obligatoire
   ========================================================================== */

describe("validateIndicatorForm — le libellé", () => {
  test("un libellé vide est refusé", () => {
    expect(validateIndicatorForm(values({ label: "" })).label).toBe(
      "Le libellé de l'indicateur est obligatoire.",
    );
  });

  test("un libellé fait d'espaces est refusé comme un libellé vide", () => {
    // Le rognage a lieu à la lecture : c'est le passage par `FormData` qui
    // éprouve la chaîne d'espaces, pas la validation seule.
    const { errors, input } = parseIndicatorForm(formOf({ label: "   " }));

    expect(errors.label).toBe("Le libellé de l'indicateur est obligatoire.");
    expect(input).toBeNull();
  });

  test("un libellé renseigné passe", () => {
    expect(validateIndicatorForm(values()).label).toBeUndefined();
  });
});

/* ==========================================================================
   Le sens de lecture — liste fermée, dérivée du schéma
   ========================================================================== */

describe("validateIndicatorForm — le sens de lecture", () => {
  test("les deux valeurs de l'énuméré sont acceptées", () => {
    // La liste vient du schéma : ce test s'allonge tout seul le jour où
    // l'énuméré s'allonge, et c'est le propos.
    expect(INDICATOR_DIRECTION_VALUES.length).toBeGreaterThan(0);
    for (const direction of INDICATOR_DIRECTION_VALUES) {
      expect(validateIndicatorForm(values({ direction })).direction).toBeUndefined();
    }
  });

  test("un sens de lecture vide est refusé comme obligatoire", () => {
    expect(validateIndicatorForm(values({ direction: "" })).direction).toBe(
      "Le sens de lecture est obligatoire.",
    );
  });

  test("un sens de lecture hors énuméré est refusé, jamais écrit", () => {
    /* Le refus qui protège la colonne : `indicators.direction` est un énuméré
       PostgreSQL, et une valeur inconnue y produirait une erreur — un 500 — là
       où l'on attend un message de champ. */
    const { errors, input } = parseIndicatorForm(
      formOf({ direction: "peu_importe" }),
    );

    expect(errors.direction).toBe("Ce sens de lecture n'existe pas.");
    expect(input).toBeNull();
  });

  test("`isIndicatorDirection` ne dit vrai que des valeurs du schéma", () => {
    expect(isIndicatorDirection("higher_is_better")).toBe(true);
    expect(isIndicatorDirection("HIGHER_IS_BETTER")).toBe(false);
    expect(isIndicatorDirection("")).toBe(false);
  });
});

/* ==========================================================================
   Les deux textes libres

   `unit` et `source` n'ont **aucune** validation, et c'est une décision : leur
   imposer une forme serait inventer un référentiel d'unités que le schéma ne
   porte pas (D25, C7).
   ========================================================================== */

describe("validateIndicatorForm — l'unité et la source", () => {
  test("une unité et une source vides ne sont pas des erreurs", () => {
    expect(validateIndicatorForm(values({ unit: "", source: "" }))).toEqual({});
  });

  test("une unité d'une forme quelconque est acceptée", () => {
    for (const unit of ["%", "s", "/100", "points", "€ / mois"]) {
      expect(validateIndicatorForm(values({ unit }))).toEqual({});
    }
  });
});

/* ==========================================================================
   De la saisie à la ligne
   ========================================================================== */

describe("parseIndicatorForm", () => {
  test("une saisie valide rend les quatre colonnes, et pas une de plus", () => {
    const { errors, input } = parseIndicatorForm(formOf());

    expect(errors).toEqual({});
    expect(input).toEqual({
      label: "Autonomie des utilisateurs",
      unit: "%",
      direction: "higher_is_better",
      source: "Portail analytics",
    });
  });

  test("une unité et une source vides partent à `null`, jamais en chaîne vide", () => {
    /* Les colonnes sont nullables pour cette raison, et l'écran teste leur
       nullité : une chaîne vide passerait pour une unité et afficherait un
       blanc collé à la valeur. */
    const { input } = parseIndicatorForm(formOf({ unit: "", source: "" }));

    expect(input).toMatchObject({ unit: null, source: null });
  });

  test("`input` est nul dès qu'une erreur est posée", () => {
    // La propriété de T2.5 : `input` non nul **si et seulement si** `errors` est
    // vide. C'est ce qui évite d'affirmer par un `as` ce que la validation
    // venait de prouver.
    const { errors, input } = parseIndicatorForm(
      formOf({ label: "", direction: "" }),
    );

    expect(Object.keys(errors).sort()).toEqual(["direction", "label"]);
    expect(input).toBeNull();
  });
});

/* ==========================================================================
   De la ligne à la saisie — le pré-remplissage de la correction
   ========================================================================== */

describe("toIndicatorFormValues", () => {
  test("les colonnes nulles deviennent des chaînes vides", () => {
    expect(
      toIndicatorFormValues({
        label: "Autonomie",
        unit: null,
        direction: "lower_is_better",
        source: null,
      }),
    ).toEqual({
      label: "Autonomie",
      unit: "",
      direction: "lower_is_better",
      source: "",
    });
  });

  test("le tour est exact : ce qui est réaffiché se réenregistre à l'identique", () => {
    /* La propriété éprouvée en T4bis.6, et la seule qui compte pour un panneau
       qui sert les deux gestes : une re-soumission sans modification doit
       réécrire exactement la même ligne. */
    const row = {
      label: "Temps de traitement",
      unit: "s",
      direction: "lower_is_better" as const,
      source: null,
    };

    const data = new FormData();
    for (const [key, value] of Object.entries(toIndicatorFormValues(row))) {
      data.set(key, value);
    }

    expect(parseIndicatorForm(data).input).toEqual(row);
  });
});
