/**
 * Les tests de l'adoption d'un indicateur par un accompagnement.
 *
 * **Aucune base**, comme ceux des sept modules qui précèdent : c'est la
 * contrepartie d'avoir isolé la validation dans un module pur. Ils énoncent la
 * règle plutôt que de l'observer sur une fixture.
 *
 * Trois propriétés portent le poids du fichier. **L'obligation unique** — sans
 * indicateur il n'y a pas d'adoption —, et c'est elle que la mise en défaut du
 * ticket neutralise. **Les trois facultatives**, parce que c'est la différence
 * avec le relevé : `baseline_value`, `target_value` et `final_value` sont
 * nullables, et une adoption nue est une adoption normale. Et le **tour exact**
 * `toAdoptionFormValues` → `parseAdoptionForm` : ce qu'on réaffiche en
 * correction doit se re-soumettre à l'identique sans rien changer en base, sans
 * quoi rouvrir un panneau et enregistrer déplacerait les trois valeurs.
 *
 * Le contrôle décimal lui-même n'est **pas re-testé ici** : il vit dans
 * `lib/forms/result.ts`, où `result.test.ts` l'éprouve forme par forme. Ce qui
 * est éprouvé ici est qu'il est bien **appelé, et sur les trois champs** — deux
 * formes suffisent pour cela, une acceptée et une refusée.
 *
 * Ce qui n'est pas testé ici, et ne doit pas l'être : l'existence de
 * l'indicateur, son appartenance au produit de cet accompagnement (D11), son
 * archivage, l'unicité `(projet, indicateur)`, le droit d'écrire. C'est tranché
 * par l'action, et par `lib/db/scoped.ts` derrière elle.
 */

import { describe, expect, test } from "vitest";

import {
  EMPTY_ADOPTION_VALUES,
  parseAdoptionForm,
  readAdoptionForm,
  toAdoptionFormValues,
  validateAdoptionForm,
  type AdoptionFormValues,
} from "./adoption";

/** Un identifiant de la bonne forme — la validation n'en demande pas plus. */
const INDICATOR = "3f2a1b4c-5d6e-4f7a-8b9c-0d1e2f3a4b5c";

/** Une saisie complète et valide, dont chaque test ne change que ce qu'il éprouve. */
function values(
  overrides: Partial<AdoptionFormValues> = {},
): AdoptionFormValues {
  return {
    indicatorId: INDICATOR,
    baselineValue: "54",
    targetValue: "85",
    finalValue: "71",
    ...overrides,
  };
}

/** Le `FormData` correspondant, pour les tests qui passent par la lecture. */
function formOf(overrides: Partial<AdoptionFormValues> = {}): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values(overrides))) {
    data.set(key, value);
  }
  return data;
}

/* ==========================================================================
   La lecture
   ========================================================================== */

describe("readAdoptionForm", () => {
  test("les quatre champs sont lus et rognés", () => {
    const data = formOf();
    data.set("indicatorId", `  ${INDICATOR}  `);
    data.set("targetValue", "  85  ");

    expect(readAdoptionForm(data)).toEqual({
      indicatorId: INDICATOR,
      baselineValue: "54",
      targetValue: "85",
      finalValue: "71",
    });
  });

  test("un formulaire vide rend les valeurs vides", () => {
    expect(readAdoptionForm(new FormData())).toEqual(EMPTY_ADOPTION_VALUES);
  });

  test("un champ qui n'est pas du texte vaut « vide »", () => {
    const data = formOf();
    data.set("targetValue", new File([], "piege.txt"));

    expect(readAdoptionForm(data).targetValue).toBe("");
  });

  test("un champ étranger est ignoré", () => {
    /* La ligne ne se construit jamais par étalement du `FormData` : un champ
       caché ajouté par n'importe qui deviendrait une colonne écrite. `note` est
       ici le champ étranger le plus tentant — la colonne existe, ce ticket ne
       l'ouvre pas. */
    const data = formOf();
    data.set("note", "Cible négociée en comité");
    data.set("projectId", "un-autre-accompagnement");

    expect(Object.keys(readAdoptionForm(data)).sort()).toEqual([
      "baselineValue",
      "finalValue",
      "indicatorId",
      "targetValue",
    ]);
  });
});

/* ==========================================================================
   La validation — l'obligation unique
   ========================================================================== */

describe("validateAdoptionForm — l'indicateur", () => {
  test("une saisie complète ne rend aucune erreur", () => {
    expect(validateAdoptionForm(values())).toEqual({});
  });

  test("l'indicateur est obligatoire", () => {
    expect(validateAdoptionForm(values({ indicatorId: "" })).indicatorId).toBe(
      "L'indicateur à adopter est obligatoire.",
    );
  });

  test("un identifiant qui n'en est pas un est refusé par un message", () => {
    /* La colonne est un `uuid` : sans ce contrôle, une valeur fantaisiste
       produirait une erreur PostgreSQL, donc un 500, là où l'on attend un
       message de champ. */
    expect(
      validateAdoptionForm(values({ indicatorId: "nouvel" })).indicatorId,
    ).toBe("Cet indicateur n'existe pas sur ce produit.");
  });

  test("un indicateur absent ne rend qu'un message, jamais deux", () => {
    // Éprouve l'`else if` : la forme se vérifie après la présence.
    expect(validateAdoptionForm(values({ indicatorId: "" }))).toEqual({
      indicatorId: "L'indicateur à adopter est obligatoire.",
    });
  });
});

/* ==========================================================================
   La validation — les trois valeurs, toutes facultatives
   ========================================================================== */

describe("validateAdoptionForm — les trois valeurs", () => {
  test("une adoption sans aucune valeur est valide", () => {
    /* **La différence avec le relevé.** Les trois colonnes sont nullables :
       adopter un indicateur sans fixer de cible est un geste normal — une
       adoption nue dit déjà que cet accompagnement regarde cet indicateur. */
    expect(
      validateAdoptionForm(
        values({ baselineValue: "", targetValue: "", finalValue: "" }),
      ),
    ).toEqual({});
  });

  test("chacune des trois est refusée quand elle n'est pas un nombre", () => {
    /* Le contrôle décimal est éprouvé forme par forme dans `result.test.ts` :
       ce qui se vérifie ici est qu'il est **appelé sur les trois champs**, et
       qu'aucun n'a été oublié. */
    const message =
      "La valeur doit être un nombre : 71, 68,5 — sans séparateur de milliers.";

    expect(
      validateAdoptionForm(values({ baselineValue: "beaucoup" })).baselineValue,
    ).toBe(message);
    expect(
      validateAdoptionForm(values({ targetValue: "beaucoup" })).targetValue,
    ).toBe(message);
    expect(
      validateAdoptionForm(values({ finalValue: "beaucoup" })).finalValue,
    ).toBe(message);
  });

  test("la virgule française est acceptée sur les trois", () => {
    expect(
      validateAdoptionForm(
        values({
          baselineValue: "54,5",
          targetValue: "85,25",
          finalValue: "71,75",
        }),
      ),
    ).toEqual({});
  });

  test("aucune valeur n'est comparée aux deux autres", () => {
    /* Une cible **en deçà** de la référence, et une valeur finale au-delà de la
       cible : deux formes qu'un outil de justification refuserait. Vision
       juxtapose, elle ne prouve pas — et `direction` n'arbitre rien (arbitrage
       (g), D39). */
    expect(
      validateAdoptionForm(
        values({ baselineValue: "85", targetValue: "54", finalValue: "999" }),
      ),
    ).toEqual({});
  });
});

/* ==========================================================================
   De la saisie à la ligne
   ========================================================================== */

describe("parseAdoptionForm", () => {
  test("`input` est non nul si et seulement si `errors` est vide", () => {
    const cases: Partial<AdoptionFormValues>[] = [
      {},
      { indicatorId: "" },
      { indicatorId: "nouvel" },
      { baselineValue: "beaucoup" },
      { targetValue: "beaucoup" },
      { finalValue: "beaucoup" },
      { baselineValue: "", targetValue: "", finalValue: "" },
    ];

    for (const override of cases) {
      const { errors, input } = parseAdoptionForm(formOf(override));
      expect(Object.keys(errors).length === 0).toBe(input !== null);
    }
  });

  test("la ligne porte les quatre colonnes, et pas une de plus", () => {
    const { input } = parseAdoptionForm(formOf());

    expect(input).toEqual({
      indicatorId: INDICATOR,
      baselineValue: "54",
      targetValue: "85",
      finalValue: "71",
    });
  });

  test("les valeurs vides deviennent `null`, jamais zéro", () => {
    /* « Non renseignée » et « 0 » ne disent pas la même chose : la colonne est
       nullable, et un zéro écrit serait une valeur reportée que personne n'a
       relevée. */
    const { input } = parseAdoptionForm(
      formOf({ baselineValue: "", targetValue: "85", finalValue: "" }),
    );

    expect(input).toMatchObject({
      baselineValue: null,
      targetValue: "85",
      finalValue: null,
    });
  });

  test("la virgule part en point, les valeurs rendues restent celles tapées", () => {
    const { values: kept, input } = parseAdoptionForm(
      formOf({ baselineValue: "54,5", targetValue: "85,25" }),
    );

    expect(input).toMatchObject({ baselineValue: "54.5", targetValue: "85.25" });
    // Ce qui reviendrait au panneau en cas de refus : ce que la personne a tapé.
    expect(kept.baselineValue).toBe("54,5");
  });
});

/* ==========================================================================
   Le tour exact — réafficher, re-soumettre, ne rien déplacer
   ========================================================================== */

describe("toAdoptionFormValues", () => {
  test("les trois valeurs de la colonne se réaffichent sans leurs zéros", () => {
    expect(
      toAdoptionFormValues({
        indicatorId: INDICATOR,
        baselineValue: "54.0000",
        targetValue: "85.0000",
        finalValue: "71.5000",
      }),
    ).toEqual({
      indicatorId: INDICATOR,
      baselineValue: "54",
      targetValue: "85",
      finalValue: "71.5",
    });
  });

  test("les valeurs nulles se réaffichent vides", () => {
    expect(
      toAdoptionFormValues({
        indicatorId: INDICATOR,
        baselineValue: null,
        targetValue: null,
        finalValue: null,
      }),
    ).toEqual({
      indicatorId: INDICATOR,
      baselineValue: "",
      targetValue: "",
      finalValue: "",
    });
  });

  test("le tour est exact : réafficher puis re-soumettre ne déplace rien", () => {
    /* **La propriété qui compte** : ouvrir la correction, ne rien changer,
       enregistrer — la ligne écrite doit être identique à celle qu'on a lue.
       Sans elle, rouvrir un panneau et cliquer suffirait à déplacer trois
       chiffres reportés. */
    const row = {
      indicatorId: INDICATOR,
      baselineValue: "54.0000",
      targetValue: "85.0000",
      finalValue: null,
    };

    const shown = toAdoptionFormValues(row);
    const data = new FormData();
    for (const [key, value] of Object.entries(shown)) data.set(key, value);

    const { errors, input } = parseAdoptionForm(data);

    expect(errors).toEqual({});
    expect(input).toEqual({
      indicatorId: row.indicatorId,
      baselineValue: "54",
      targetValue: "85",
      finalValue: null,
    });
  });
});
