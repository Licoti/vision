/**
 * Les tests de la saisie d'un relevé.
 *
 * **Aucune base**, comme ceux des six modules qui précèdent : c'est la
 * contrepartie d'avoir isolé la validation dans un module pur. Ils énoncent la
 * règle plutôt que de l'observer sur une fixture.
 *
 * Deux propriétés portent le poids du fichier. **Les deux obligations**, parce
 * que ce sont elles que la mise en défaut du ticket neutralise : la valeur et la
 * date sont `not null` en base, et `docs/04` §3 dit pourquoi pour la seconde —
 * « un relevé sans date n'est pas persisté : il serait inaffichable sur la frise
 * produit ». Et le **tour exact** `toReadingFormValues` → `parseReadingForm` :
 * ce qu'on réaffiche en correction doit se re-soumettre à l'identique sans rien
 * changer en base, sans quoi rouvrir un panneau et enregistrer déplacerait la
 * valeur.
 *
 * Le contrôle décimal lui-même n'est **pas re-testé ici** : il vit dans
 * `lib/forms/result.ts`, où `result.test.ts` l'éprouve forme par forme. Ce qui
 * est éprouvé ici est qu'il est bien **appelé**, et sur le bon champ — deux
 * formes suffisent pour cela, une acceptée et une refusée.
 *
 * Ce qui n'est pas testé ici, et ne doit pas l'être : l'existence de
 * l'indicateur, son rattachement au produit, le droit d'écrire. C'est tranché
 * par l'action, et par `lib/db/scoped.ts` derrière elle.
 */

import { describe, expect, test } from "vitest";

import {
  EMPTY_READING_VALUES,
  parseReadingForm,
  readReadingForm,
  toReadingFormValues,
  validateReadingForm,
  type ReadingFormValues,
} from "./reading";

/** Une saisie complète et valide, dont chaque test ne change que ce qu'il éprouve. */
function values(overrides: Partial<ReadingFormValues> = {}): ReadingFormValues {
  return {
    value: "71",
    readOn: "2026-06-01",
    sourceNote: "Portail analytics",
    ...overrides,
  };
}

/** Le `FormData` correspondant, pour les tests qui passent par la lecture. */
function formOf(overrides: Partial<ReadingFormValues> = {}): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values(overrides))) {
    data.set(key, value);
  }
  return data;
}

/* ==========================================================================
   La lecture
   ========================================================================== */

describe("readReadingForm", () => {
  test("les trois champs sont lus, et rognés", () => {
    const data = new FormData();
    data.set("value", "  71  ");
    data.set("readOn", " 2026-06-01 ");
    data.set("sourceNote", "  Portail analytics ");

    expect(readReadingForm(data)).toEqual({
      value: "71",
      readOn: "2026-06-01",
      sourceNote: "Portail analytics",
    });
  });

  test("un formulaire vide rend les trois chaînes vides", () => {
    expect(readReadingForm(new FormData())).toEqual(EMPTY_READING_VALUES);
  });

  test("un champ qui n'est pas du texte vaut « vide »", () => {
    const data = formOf();
    data.set("value", new File([], "valeur.txt"));

    expect(readReadingForm(data).value).toBe("");
  });

  test("un champ étranger au ticket n'entre pas dans la saisie", () => {
    /* La règle du dossier : l'action ne construit jamais sa ligne par étalement
       d'un `FormData`. `indicator_id` est lié côté serveur, et `archived_at` ne
       se pose que par `archive()` — ni l'un ni l'autre n'a de champ. */
    const data = formOf();
    data.set("indicatorId", "0e5f2d1c-0000-4000-8000-000000000000");
    data.set("archivedAt", "2026-06-01T00:00:00Z");

    expect(Object.keys(readReadingForm(data)).sort()).toEqual([
      "readOn",
      "sourceNote",
      "value",
    ]);
  });
});

/* ==========================================================================
   La valeur — obligatoire, à la différence de celle d'un résultat
   ========================================================================== */

describe("validateReadingForm — la valeur", () => {
  test("une valeur absente est refusée", () => {
    expect(validateReadingForm(values({ value: "" })).value).toBe(
      "La valeur du relevé est obligatoire.",
    );
  });

  test("une valeur qui n'est pas un nombre est refusée", () => {
    // Le contrôle est une **forme**, pas un `Number` : « 1e5 » passerait
    // `Number` et ferait lever la colonne `numeric`, donc un 500.
    expect(validateReadingForm(values({ value: "1e5" })).value).toBe(
      "La valeur doit être un nombre : 71, 68,5 — sans séparateur de milliers.",
    );
  });

  test("la virgule française est acceptée", () => {
    expect(validateReadingForm(values({ value: "68,5" })).value).toBeUndefined();
  });

  test("une valeur absente ne rend qu'un message, jamais deux", () => {
    // Le second contrôle est en `else if` : un champ vide n'est pas aussi « pas
    // un nombre », et l'écran ne dit pas deux fois la même chose.
    const errors = validateReadingForm(values({ value: "" }));

    expect(errors.value).toBe("La valeur du relevé est obligatoire.");
    expect(Object.keys(errors)).toEqual(["value"]);
  });
});

/* ==========================================================================
   La date — `docs/04` §3, et la mise en défaut du ticket
   ========================================================================== */

describe("validateReadingForm — la date de relevé", () => {
  test("une date absente est refusée", () => {
    expect(validateReadingForm(values({ readOn: "" })).readOn).toBe(
      "La date du relevé est obligatoire.",
    );
  });

  test("une date qui n'existe pas est refusée", () => {
    // Le 31 février passe la forme `YYYY-MM-DD` et n'existe pas : `isIsoDay`
    // vérifie le tour complet, pas seulement le motif.
    expect(validateReadingForm(values({ readOn: "2026-02-31" })).readOn).toBe(
      "Cette date de relevé n'existe pas.",
    );
  });

  test("une date mal formée est refusée", () => {
    expect(validateReadingForm(values({ readOn: "01/06/2026" })).readOn).toBe(
      "Cette date de relevé n'existe pas.",
    );
  });

  test("une date passée comme une date à venir sont acceptées", () => {
    /* Rien ici ne compare à l'horloge, et c'est voulu : un relevé se **rapporte**
       — il peut l'être longtemps après la mesure —, et la seule règle que la
       fiche pose est qu'il ne se date pas d'office au jour de la saisie. */
    expect(
      validateReadingForm(values({ readOn: "2024-09-01" })).readOn,
    ).toBeUndefined();
    expect(
      validateReadingForm(values({ readOn: "2030-01-01" })).readOn,
    ).toBeUndefined();
  });
});

/* ==========================================================================
   La note de source — facultative, et jamais contrainte
   ========================================================================== */

describe("validateReadingForm — la note de source", () => {
  test("une note absente n'est pas une erreur", () => {
    const errors = validateReadingForm(values({ sourceNote: "" }));

    expect(errors.sourceNote).toBeUndefined();
    expect(Object.keys(errors)).toEqual([]);
  });

  test("aucune forme ne lui est imposée", () => {
    // Un texte libre : lui imposer une forme serait inventer un référentiel
    // (D25, C7).
    expect(
      validateReadingForm(values({ sourceNote: "Enquête T2 — panel interne" }))
        .sourceNote,
    ).toBeUndefined();
  });
});

/* ==========================================================================
   De la saisie à la ligne
   ========================================================================== */

describe("parseReadingForm", () => {
  test("une saisie valide rend la ligne, et aucune erreur", () => {
    const { errors, input } = parseReadingForm(formOf());

    expect(errors).toEqual({});
    expect(input).toEqual({
      value: "71",
      readOn: "2026-06-01",
      sourceNote: "Portail analytics",
    });
  });

  test("la valeur part normalisée, la saisie revient telle quelle", () => {
    // La colonne veut un point ; la personne a tapé une virgule. `values` sert
    // le panneau, `input` sert la base : les deux ne servent pas le même propos.
    const { values: kept, input } = parseReadingForm(formOf({ value: "68,5" }));

    expect(kept.value).toBe("68,5");
    expect(input?.value).toBe("68.5");
  });

  test("une note vide devient `null`", () => {
    expect(parseReadingForm(formOf({ sourceNote: "" })).input?.sourceNote).toBe(
      null,
    );
  });

  test("une saisie refusée ne rend aucune ligne, et garde ce qui a été tapé", () => {
    const { values: kept, errors, input } = parseReadingForm(
      formOf({ readOn: "" }),
    );

    expect(input).toBe(null);
    expect(errors.readOn).toBe("La date du relevé est obligatoire.");
    // Vision ne jette jamais en silence ce qui a été tapé.
    expect(kept.value).toBe("71");
    expect(kept.sourceNote).toBe("Portail analytics");
  });

  test("`input` est non nul si et seulement si `errors` est vide", () => {
    const cases: Partial<ReadingFormValues>[] = [
      {},
      { value: "" },
      { readOn: "" },
      { value: "abc" },
      { readOn: "2026-13-01" },
      { value: "", readOn: "" },
    ];

    for (const override of cases) {
      const { errors, input } = parseReadingForm(formOf(override));
      expect(Object.keys(errors).length === 0).toBe(input !== null);
    }
  });
});

/* ==========================================================================
   De la ligne à la saisie — le tour exact
   ========================================================================== */

describe("toReadingFormValues", () => {
  test("la valeur se retape telle qu'on l'écrit, pas telle que la colonne la rend", () => {
    // `numeric(18,4)` rend « 71.0000 » : le poser dans le champ serait une
    // invitation à retaper une valeur que personne n'a écrite ainsi.
    expect(
      toReadingFormValues({
        value: "71.0000",
        readOn: "2026-06-01",
        sourceNote: null,
      }),
    ).toEqual({ value: "71", readOn: "2026-06-01", sourceNote: "" });
  });

  test("une décimale réelle survit au rognage", () => {
    expect(
      toReadingFormValues({
        value: "68.5000",
        readOn: "2026-06-01",
        sourceNote: "Portail analytics",
      }),
    ).toEqual({
      value: "68.5",
      readOn: "2026-06-01",
      sourceNote: "Portail analytics",
    });
  });

  test("le tour est exact : ce qui est réaffiché réécrit la même valeur", () => {
    /* La propriété qui compte pour la correction : rouvrir le panneau sur un
       relevé et enregistrer sans rien toucher ne doit **rien** déplacer en base.
       Sans le rognage, le champ porterait « 71.0000 » — encore juste ; sans le
       point conservé, il porterait « 71,0 » et le tour ne fermerait plus. */
    for (const stored of ["71.0000", "68.5000", "0.0000", "1234.5678"]) {
      const shown = toReadingFormValues({
        value: stored,
        readOn: "2026-06-01",
        sourceNote: null,
      });

      const { errors, input } = parseReadingForm(
        formOf({ ...shown, sourceNote: "" }),
      );

      expect(errors).toEqual({});
      expect(Number(input?.value)).toBe(Number(stored));
    }
  });
});
