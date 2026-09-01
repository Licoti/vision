/**
 * Les tests de la saisie du **plan de taggage**.
 *
 * **Aucune base**, comme son jumeau `tracking.test.ts`.
 *
 * Trois champs, trois obligations, et la troisième est celle qui porte la
 * demande : `updatedOn` est la date du **document**, celle que la liste des
 * produits affiche et sur laquelle un Web Analyst juge qu'un plan a vieilli. Un
 * plan sans elle y paraîtrait sans âge.
 *
 * **Ce que ces tests garantissent aussi par leur absence** : aucun n'éprouve un
 * lien entre `updatedOn` et `status`. C'est délibéré, et c'est la règle du
 * dispositif — « à revoir » est déclaré par une personne, jamais déduit d'un
 * écart de dates. Le jour où un test naîtrait ici pour vérifier qu'un plan de
 * plus de douze mois bascule tout seul, c'est que l'interdit d'interface aurait
 * cédé.
 */

import { describe, expect, test } from "vitest";

import {
  EMPTY_TAGGING_PLAN_VALUES,
  isTaggingPlanStatus,
  parseTaggingPlanForm,
  readTaggingPlanForm,
  TAGGING_PLAN_STATUS_VALUES,
  toTaggingPlanFormValues,
  validateTaggingPlanForm,
  type TaggingPlanFormValues,
} from "./tagging-plan";

function values(
  overrides: Partial<TaggingPlanFormValues> = {},
): TaggingPlanFormValues {
  return {
    url: "https://sharepoint.example.com/plan-taggage",
    status: "stale",
    updatedOn: "2026-03-03",
    note: "Le tunnel refondu en juin n'y figure pas encore.",
    ...overrides,
  };
}

function formOf(overrides: Partial<TaggingPlanFormValues> = {}): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values(overrides))) {
    data.set(key, value);
  }
  return data;
}

/* ==========================================================================
   La lecture
   ========================================================================== */

describe("readTaggingPlanForm", () => {
  test("lit les quatre champs et les rogne", () => {
    const data = formOf();
    data.set("note", "  À reprendre  ");

    expect(readTaggingPlanForm(data)).toEqual(values({ note: "À reprendre" }));
  });

  test("rend des chaînes vides quand le formulaire ne porte rien", () => {
    expect(readTaggingPlanForm(new FormData())).toEqual(
      EMPTY_TAGGING_PLAN_VALUES,
    );
  });
});

/* ==========================================================================
   L'adresse — obligatoire, et une adresse
   ========================================================================== */

describe("validateTaggingPlanForm · l'adresse", () => {
  /* **Un plan sans adresse n'est pas un plan** : la ligne dirait qu'il existe
     sans permettre d'y accéder, l'inverse exact du service rendu. */
  test("refuse une saisie sans adresse", () => {
    expect(validateTaggingPlanForm(values({ url: "" })).url).toBe(
      "L'adresse du plan de taggage est obligatoire.",
    );
  });

  test("refuse une adresse qui n'en est pas une", () => {
    expect(
      validateTaggingPlanForm(values({ url: "sharepoint/plan" })).url,
    ).toBe("L'adresse du plan doit commencer par http:// ou https://.");
  });

  test("refuse un protocole qui n'est ni http ni https", () => {
    expect(
      validateTaggingPlanForm(values({ url: "file:///plan.xlsx" })).url,
    ).toBeDefined();
  });
});

/* ==========================================================================
   L'état — obligatoire, et dans la liste fermée
   ========================================================================== */

describe("validateTaggingPlanForm · l'état", () => {
  test("refuse une saisie sans état", () => {
    expect(validateTaggingPlanForm(values({ status: "" })).status).toBe(
      "L'état du plan est obligatoire.",
    );
  });

  test("refuse un état hors de l'énuméré", () => {
    expect(validateTaggingPlanForm(values({ status: "obsolete" })).status).toBe(
      "Cet état n'existe pas.",
    );
  });

  test("accepte les trois états, et eux seuls", () => {
    for (const status of TAGGING_PLAN_STATUS_VALUES) {
      expect(
        validateTaggingPlanForm(values({ status })).status,
      ).toBeUndefined();
    }
    expect([...TAGGING_PLAN_STATUS_VALUES]).toEqual([
      "draft",
      "current",
      "stale",
    ]);
  });

  test("isTaggingPlanStatus rétrécit sur les trois valeurs", () => {
    expect(isTaggingPlanStatus("stale")).toBe(true);
    expect(isTaggingPlanStatus("stalled")).toBe(false);
  });
});

/* ==========================================================================
   La date du document — obligatoire, et un jour réel
   ========================================================================== */

describe("validateTaggingPlanForm · la date", () => {
  /* **Obligatoire, contrairement à `verifiedOn` du dispositif** : c'est *la*
     date que la liste des produits affiche. */
  test("refuse une saisie sans date de mise à jour", () => {
    expect(validateTaggingPlanForm(values({ updatedOn: "" })).updatedOn).toBe(
      "La date de mise à jour du plan est obligatoire.",
    );
  });

  test("refuse un jour qui n'existe pas au calendrier", () => {
    expect(
      validateTaggingPlanForm(values({ updatedOn: "2026-04-31" })).updatedOn,
    ).toBe("Cette date de mise à jour n'existe pas.");
  });

  /* **Aucune borne haute, et c'est délibéré.** Un plan daté du mois prochain est
     une coquille de saisie, pas une règle métier : refuser le futur demanderait
     à ce module pur de connaître « aujourd'hui », donc de rendre un résultat qui
     change selon le jour où on l'exécute. */
  test("accepte une date future : ce module ne connaît pas aujourd'hui", () => {
    expect(
      validateTaggingPlanForm(values({ updatedOn: "2099-01-01" })).updatedOn,
    ).toBeUndefined();
  });

  /* **La règle qui ne doit jamais naître.** Un plan très ancien reste
     parfaitement valide, et son état reste celui qu'une personne a déclaré : ici
     « à jour », malgré 2019. Le jour où ce test tomberait, c'est qu'un calcul
     d'obsolescence se serait glissé dans la validation — l'interdit d'interface
     que le dispositif entier tient. */
  test("n'infère aucun état d'une date ancienne", () => {
    expect(
      validateTaggingPlanForm(
        values({ status: "current", updatedOn: "2019-01-04" }),
      ),
    ).toEqual({});
  });
});

/* ==========================================================================
   L'aller-retour, et la ligne à écrire
   ========================================================================== */

describe("toTaggingPlanFormValues", () => {
  test("rend la note nulle en chaîne vide, et garde la date telle quelle", () => {
    expect(
      toTaggingPlanFormValues({
        url: "https://exemple.test/plan",
        status: "draft",
        updatedOn: "2026-08-01",
        note: null,
      }),
    ).toEqual({
      url: "https://exemple.test/plan",
      status: "draft",
      updatedOn: "2026-08-01",
      note: "",
    });
  });
});

describe("parseTaggingPlanForm", () => {
  test("rend la ligne à écrire quand tout est valide", () => {
    const { errors, input } = parseTaggingPlanForm(formOf());

    expect(errors).toEqual({});
    expect(input).toEqual({
      url: "https://sharepoint.example.com/plan-taggage",
      status: "stale",
      updatedOn: "2026-03-03",
      note: "Le tunnel refondu en juin n'y figure pas encore.",
    });
  });

  test("rend la précision vide en `null`, jamais en chaîne vide", () => {
    expect(parseTaggingPlanForm(formOf({ note: "" })).input).toEqual({
      url: "https://sharepoint.example.com/plan-taggage",
      status: "stale",
      updatedOn: "2026-03-03",
      note: null,
    });
  });

  test("ne rend aucune ligne dès qu'une erreur est levée", () => {
    const { errors, input } = parseTaggingPlanForm(formOf({ url: "" }));

    expect(Object.keys(errors)).toHaveLength(1);
    expect(input).toBeNull();
  });

  test("lève les trois erreurs ensemble sur un formulaire vide", () => {
    const { errors, input } = parseTaggingPlanForm(new FormData());

    expect(Object.keys(errors).sort()).toEqual(["status", "updatedOn", "url"]);
    expect(input).toBeNull();
  });
});
