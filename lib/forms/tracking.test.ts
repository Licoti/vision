/**
 * Les tests de la saisie d'un **outil de mesure**.
 *
 * **Aucune base**, comme ceux de l'indicateur, du relevé et du produit : c'est
 * la contrepartie d'avoir isolé la validation dans un module pur. Ils énoncent
 * la règle plutôt que de l'observer sur une fixture.
 *
 * Quatre blocs portent le poids du fichier, et chacun garde une porte d'entrée
 * distincte vers un 500 :
 *
 *   — l'**outil** doit être un UUID, faute de quoi une colonne `uuid`
 *     interrogée avec n'importe quoi rend une erreur PostgreSQL ;
 *   — l'**état** doit appartenir à l'énuméré, pour la même raison — et le
 *     `select` ne prouve rien, une soumission forgée porte ce qu'elle veut ;
 *   — l'**adresse**, si elle est saisie, doit être une adresse web ;
 *   — la **date de constat**, si elle est saisie, doit être un jour réel — le
 *     31 février passe l'expression régulière, pas `isIsoDay`.
 *
 * Ce qui n'est pas testé ici, et ne doit pas l'être : l'existence de l'outil
 * dans le domaine, l'unicité de sa déclaration sur le produit, le droit
 * d'écrire. C'est tranché par l'action, par l'index partiel et par
 * `lib/db/scoped.ts` derrière elle.
 */

import { describe, expect, test } from "vitest";

import {
  EMPTY_TRACKING_VALUES,
  isTrackingStatus,
  parseTrackingForm,
  readTrackingForm,
  toTrackingFormValues,
  TRACKING_STATUS_VALUES,
  validateTrackingForm,
  type TrackingFormValues,
} from "./tracking";

const TOOL = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

/** Une saisie complète et valide, dont chaque test ne change que ce qu'il éprouve. */
function values(overrides: Partial<TrackingFormValues> = {}): TrackingFormValues {
  return {
    toolId: TOOL,
    status: "active",
    scope: "Site public et espace connecté",
    propertyUrl: "https://analytics.example.com/p/42",
    verifiedOn: "2026-06-12",
    note: "Posé lors de la refonte.",
    ...overrides,
  };
}

function formOf(overrides: Partial<TrackingFormValues> = {}): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values(overrides))) {
    data.set(key, value);
  }
  return data;
}

/* ==========================================================================
   La lecture
   ========================================================================== */

describe("readTrackingForm", () => {
  test("lit les six champs et les rogne", () => {
    const data = formOf();
    data.set("scope", "  Tunnel de souscription  ");
    data.set("note", "  À revoir  ");

    expect(readTrackingForm(data)).toEqual(
      values({ scope: "Tunnel de souscription", note: "À revoir" }),
    );
  });

  test("rend des chaînes vides quand le formulaire ne porte rien", () => {
    expect(readTrackingForm(new FormData())).toEqual(EMPTY_TRACKING_VALUES);
  });
});

/* ==========================================================================
   L'outil — obligatoire, et un UUID
   ========================================================================== */

describe("validateTrackingForm · l'outil", () => {
  test("refuse une saisie sans outil", () => {
    expect(validateTrackingForm(values({ toolId: "" })).toolId).toBe(
      "L'outil de mesure est obligatoire.",
    );
  });

  /* **La forme avant la base.** Sans ce contrôle, « bonjour » atteindrait une
     colonne `uuid` et rendrait un 500 là où l'on attend un message de champ. */
  test("refuse un identifiant qui n'est pas un UUID", () => {
    expect(validateTrackingForm(values({ toolId: "bonjour" })).toolId).toBe(
      "Cet outil n'existe pas.",
    );
  });

  test("accepte un UUID bien formé sans rien savoir de son existence", () => {
    expect(validateTrackingForm(values()).toolId).toBeUndefined();
  });
});

/* ==========================================================================
   L'état — obligatoire, et dans la liste fermée
   ========================================================================== */

describe("validateTrackingForm · l'état", () => {
  test("refuse une saisie sans état", () => {
    expect(validateTrackingForm(values({ status: "" })).status).toBe(
      "L'état du dispositif est obligatoire.",
    );
  });

  /* Le `select` ne propose que les quatre valeurs de l'énuméré ; une soumission
     forgée porte ce qu'elle veut, et une valeur hors énuméré rendrait une erreur
     PostgreSQL. */
  test("refuse un état hors de l'énuméré", () => {
    expect(validateTrackingForm(values({ status: "excellent" })).status).toBe(
      "Cet état n'existe pas.",
    );
  });

  test("accepte les quatre états, et eux seuls", () => {
    for (const status of TRACKING_STATUS_VALUES) {
      expect(validateTrackingForm(values({ status })).status).toBeUndefined();
    }
    expect([...TRACKING_STATUS_VALUES]).toEqual([
      "planned",
      "active",
      "partial",
      "stopped",
    ]);
  });

  test("isTrackingStatus rétrécit sur les quatre valeurs", () => {
    expect(isTrackingStatus("partial")).toBe(true);
    expect(isTrackingStatus("Partial")).toBe(false);
    expect(isTrackingStatus("")).toBe(false);
  });
});

/* ==========================================================================
   L'adresse de la propriété — facultative, mais une adresse
   ========================================================================== */

describe("validateTrackingForm · l'adresse", () => {
  test("accepte une saisie sans adresse : la colonne est nullable", () => {
    expect(
      validateTrackingForm(values({ propertyUrl: "" })).propertyUrl,
    ).toBeUndefined();
  });

  test("refuse une adresse qui n'en est pas une", () => {
    expect(
      validateTrackingForm(values({ propertyUrl: "analytics.example.com" }))
        .propertyUrl,
    ).toBe("L'adresse de la propriété doit commencer par http:// ou https://.");
  });

  /* Le protocole compte : un `javascript:` accepté ici deviendrait un lien
     cliquable dans le rang. C'est la règle d'`isWebUrl`, éprouvée à son second
     appelant. */
  test("refuse un protocole qui n'est ni http ni https", () => {
    expect(
      validateTrackingForm(values({ propertyUrl: "ftp://example.com" }))
        .propertyUrl,
    ).toBeDefined();
  });
});

/* ==========================================================================
   La date de constat — facultative, mais un jour réel
   ========================================================================== */

describe("validateTrackingForm · la date de constat", () => {
  test("accepte une saisie sans date : la colonne est nullable", () => {
    expect(
      validateTrackingForm(values({ verifiedOn: "" })).verifiedOn,
    ).toBeUndefined();
  });

  /* Le 31 février passe l'expression régulière et pas le calendrier : c'est
     exactement ce qu'`isIsoDay` ajoute, et la raison pour laquelle il est
     réutilisé plutôt que réécrit. */
  test("refuse un jour qui n'existe pas au calendrier", () => {
    expect(
      validateTrackingForm(values({ verifiedOn: "2026-02-31" })).verifiedOn,
    ).toBe("Cette date de constat n'existe pas.");
  });

  test("refuse une date qui n'est pas au format du jour", () => {
    expect(
      validateTrackingForm(values({ verifiedOn: "12/06/2026" })).verifiedOn,
    ).toBeDefined();
  });
});

/* ==========================================================================
   Le périmètre et la précision — deux textes libres
   ========================================================================== */

describe("validateTrackingForm · les textes libres", () => {
  /* Leur imposer une forme serait inventer un référentiel (D25, C7). Le
     périmètre reste facultatif alors qu'il donne son sens à « partiel » : un
     champ obligatoire qu'on remplit au hasard vaut moins qu'un champ vide. */
  test("n'exige ni périmètre ni précision", () => {
    const errors = validateTrackingForm(values({ scope: "", note: "" }));
    expect(errors.scope).toBeUndefined();
    expect(errors.note).toBeUndefined();
  });

  test("n'exige rien d'un périmètre déclaré partiel", () => {
    expect(
      validateTrackingForm(values({ status: "partial", scope: "" })),
    ).toEqual({});
  });
});

/* ==========================================================================
   L'aller-retour, et la ligne à écrire
   ========================================================================== */

describe("toTrackingFormValues", () => {
  test("rend les nuls en chaînes vides", () => {
    expect(
      toTrackingFormValues({
        toolId: TOOL,
        status: "stopped",
        scope: null,
        propertyUrl: null,
        verifiedOn: null,
        note: null,
      }),
    ).toEqual({
      toolId: TOOL,
      status: "stopped",
      scope: "",
      propertyUrl: "",
      verifiedOn: "",
      note: "",
    });
  });
});

describe("parseTrackingForm", () => {
  test("rend la ligne à écrire quand tout est valide", () => {
    const { errors, input } = parseTrackingForm(formOf());

    expect(errors).toEqual({});
    expect(input).toEqual({
      toolId: TOOL,
      status: "active",
      scope: "Site public et espace connecté",
      propertyUrl: "https://analytics.example.com/p/42",
      verifiedOn: "2026-06-12",
      note: "Posé lors de la refonte.",
    });
  });

  test("rend les facultatifs vides en `null`, jamais en chaîne vide", () => {
    const { input } = parseTrackingForm(
      formOf({ scope: "", propertyUrl: "", verifiedOn: "", note: "" }),
    );

    expect(input).toEqual({
      toolId: TOOL,
      status: "active",
      scope: null,
      propertyUrl: null,
      verifiedOn: null,
      note: null,
    });
  });

  /* La propriété posée en T2.5 et tenue depuis : `input` est non nul **si et
     seulement si** `errors` est vide. */
  test("ne rend aucune ligne dès qu'une erreur est levée", () => {
    const { errors, input } = parseTrackingForm(formOf({ status: "" }));

    expect(Object.keys(errors)).toHaveLength(1);
    expect(input).toBeNull();
  });

  test("ne rend aucune ligne quand l'outil n'est pas un UUID", () => {
    expect(parseTrackingForm(formOf({ toolId: "42" })).input).toBeNull();
  });
});
