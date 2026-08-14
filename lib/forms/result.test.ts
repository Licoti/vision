/**
 * Les tests de la saisie d'un résultat.
 *
 * **Aucune base**, comme ceux du produit, du projet, de l'activité et de la
 * ressource : c'est la contrepartie d'avoir isolé la validation dans un module
 * pur. Ils énoncent la règle plutôt que de l'observer sur une fixture.
 *
 * Deux blocs portent le poids du fichier. La **valeur**, éprouvée forme par
 * forme, parce que ce qui la valide n'est pas `Number` mais une forme : `Number`
 * accepte « 0x10 » et « 1e5 », qu'une colonne `numeric` refuse — les valider
 * puis les écrire rendrait un 500 sur soumission forgée. Et le **lien profond**,
 * pour la raison qui motive déjà la table des adresses de `resource.test.ts` :
 * `ExternalLink` rend le `href` tel quel, et une adresse `javascript:`
 * enregistrée s'exécuterait au clic sur le libellé du résultat.
 *
 * Ce qui n'est pas testé ici, et ne doit pas l'être : l'existence de l'outil
 * dans le domaine, l'état de l'activité visée, l'unicité du résultat. C'est
 * tranché par l'action, et par `lib/db/scoped.ts` derrière elle.
 */

import { describe, expect, test } from "vitest";

import {
  EMPTY_RESULT_VALUES,
  normalizeDecimal,
  parseResultForm,
  readResultForm,
  validateResultForm,
  type ResultFormValues,
} from "./result";

const TOOL = "3f2504e0-4f89-11d3-9a0c-0305e82c3311";

/** Une saisie complète et valide, dont chaque test ne change que ce qu'il éprouve. */
function values(overrides: Partial<ResultFormValues> = {}): ResultFormValues {
  return {
    label: "Score d'audit UX",
    value: "62",
    unit: "/100",
    measuredOn: "2024-05-31",
    toolId: TOOL,
    externalUrl: "https://exemple.invalid/rapports/62",
    ...overrides,
  };
}

/** Le `FormData` correspondant, pour les tests qui passent par la lecture. */
function formOf(overrides: Partial<ResultFormValues> = {}): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values(overrides))) {
    data.set(key, value);
  }
  return data;
}

/* ==========================================================================
   La lecture
   ========================================================================== */

describe("readResultForm", () => {
  test("lit les six champs, et les rogne", () => {
    const data = new FormData();
    data.set("label", "  Taux de conformité  ");
    data.set("value", "  68  ");
    data.set("unit", "  %  ");
    data.set("measuredOn", "  2026-06-30  ");
    data.set("toolId", `  ${TOOL}  `);
    data.set("externalUrl", "  https://exemple.invalid/a11y  ");

    expect(readResultForm(data)).toEqual({
      label: "Taux de conformité",
      value: "68",
      unit: "%",
      measuredOn: "2026-06-30",
      toolId: TOOL,
      externalUrl: "https://exemple.invalid/a11y",
    });
  });

  test("un formulaire vide rend les valeurs vides, jamais `undefined`", () => {
    expect(readResultForm(new FormData())).toEqual(EMPTY_RESULT_VALUES);
  });

  test("les champs hors du ticket ne sont pas lus", () => {
    // Un champ caché ajouté par n'importe qui ne doit pas devenir une colonne
    // écrite : la lecture est nommée, jamais un étalement du `FormData`.
    // `activityId` est lié côté serveur ; `externalRef`, `syncMode` et
    // `syncedAt` existent pour éviter une migration le jour de l'API et ne
    // portent aucun geste au POC.
    const data = formOf();
    data.set("activityId", "3f2504e0-4f89-11d3-9a0c-0305e82c3399");
    data.set("externalRef", "RAP-2024-118");
    data.set("syncMode", "api");
    data.set("syncedAt", "2026-08-14T00:00:00Z");
    data.set("domainId", "3f2504e0-4f89-11d3-9a0c-0305e82c3398");

    expect(Object.keys(readResultForm(data)).sort()).toEqual([
      "externalUrl",
      "label",
      "measuredOn",
      "toolId",
      "unit",
      "value",
    ]);
  });
});

/* ==========================================================================
   Le libellé — `not null`, donc obligatoire
   ========================================================================== */

describe("validateResultForm — le libellé", () => {
  test("un libellé vide est refusé", () => {
    expect(validateResultForm(values({ label: "" })).label).toBe(
      "Le libellé du résultat est obligatoire.",
    );
  });

  test("un libellé fait d'espaces est refusé comme un libellé vide", () => {
    // Le rognage a lieu à la lecture : la validation ne voit jamais « " " ».
    expect(readResultForm(formOf({ label: "   " })).label).toBe("");
  });

  test("un libellé renseigné passe", () => {
    expect(validateResultForm(values()).label).toBeUndefined();
  });
});

/* ==========================================================================
   La valeur — facultative, mais un nombre si elle est là

   Ce que ce bloc protège : la colonne est `numeric(18, 4)`, et PostgreSQL lève
   sur ce qu'il ne sait pas lire. Un contrôle par `Number` aurait laissé passer
   « 0x10 » et « 1e5 » — d'où une forme, et non une conversion.
   ========================================================================== */

describe("validateResultForm — la valeur", () => {
  test("une valeur absente passe : la colonne est nullable", () => {
    // Arbitrage du 14/08/2026 : obligatoire là où la colonne l'est, et elle ne
    // l'est pas. Un audit peut porter un constat sans chiffre, et T4.3 sait
    // déjà l'afficher — `formatResultValue` rend `null`.
    expect(validateResultForm(values({ value: "" })).value).toBeUndefined();
  });

  const accepted = [
    "62",
    "0",
    "68,5",
    "68.5",
    "-3",
    "-0,25",
    ",5",
    ".5",
    "1234,5678",
    // Quatorze chiffres avant la virgule : la précision de la colonne moins son
    // échelle, donc la dernière valeur qu'elle accepte.
    "99999999999999",
  ];

  test.each(accepted)("« %s » est un nombre", (value) => {
    expect(validateResultForm(values({ value })).value).toBeUndefined();
  });

  const refused = [
    // Ce que `Number` accepte et que `numeric` refuse : le cœur du bloc.
    "0x10",
    "1e5",
    "Infinity",
    "-Infinity",
    // Séparateurs de milliers : ambigus entre les langues.
    "1 234",
    "1,234.5",
    "1.234,5",
    // Quinze chiffres avant la virgule : au-delà de `numeric(18, 4)`.
    "999999999999999",
    // Le reste.
    "soixante-deux",
    "62 %",
    "62/100",
    "--3",
    "-",
    ",",
  ];

  test.each(refused)("« %s » n'est pas un nombre", (value) => {
    expect(validateResultForm(values({ value })).value).toBe(
      "La valeur doit être un nombre : 62, 68,5 — sans séparateur de milliers.",
    );
  });

  test("la virgule est normalisée en point pour la colonne", () => {
    expect(normalizeDecimal("68,5")).toBe("68.5");
    expect(normalizeDecimal("68.5")).toBe("68.5");
    expect(normalizeDecimal("62")).toBe("62");
  });

  test("la valeur écrite porte le point, celle rendue au panneau la virgule", () => {
    // Deux propos distincts : `input` va dans la colonne, `values` revient à la
    // personne, qui doit retrouver ce qu'elle a tapé.
    const { input, values: returned } = parseResultForm(formOf({ value: "68,5" }));

    expect(input?.value).toBe("68.5");
    expect(returned.value).toBe("68,5");
  });
});

/* ==========================================================================
   La date de mesure — `not null`, donc obligatoire
   ========================================================================== */

describe("validateResultForm — la date de mesure", () => {
  test("une date absente est refusée", () => {
    expect(validateResultForm(values({ measuredOn: "" })).measuredOn).toBe(
      "La date de mesure est obligatoire.",
    );
  });

  test("une date qui n'existe pas est refusée", () => {
    expect(
      validateResultForm(values({ measuredOn: "2026-02-30" })).measuredOn,
    ).toBe("Cette date de mesure n'existe pas.");
  });

  test("une date absente n'est jamais qualifiée d'inexistante", () => {
    // Deux refus distincts, et le message doit dire lequel.
    expect(validateResultForm(values({ measuredOn: "" })).measuredOn).not.toContain(
      "n'existe pas",
    );
  });

  test("une date valide passe, y compris un 29 février bissextile", () => {
    expect(validateResultForm(values()).measuredOn).toBeUndefined();
    expect(
      validateResultForm(values({ measuredOn: "2024-02-29" })).measuredOn,
    ).toBeUndefined();
  });

  test("une date de mesure passée est acceptée sans réserve", () => {
    // Vision reporte la date de la **mesure**, pas celle de la saisie : elle
    // peut précéder de loin le jour où le résultat est reporté.
    expect(
      validateResultForm(values({ measuredOn: "2019-01-15" })).measuredOn,
    ).toBeUndefined();
  });
});

/* ==========================================================================
   L'outil — facultatif, sa forme seulement
   ========================================================================== */

describe("validateResultForm — l'outil", () => {
  test("un outil absent passe : la colonne est nullable", () => {
    expect(validateResultForm(values({ toolId: "" })).toolId).toBeUndefined();
  });

  test("un identifiant qui n'en est pas un est refusé", () => {
    // La forme avant la base : une colonne `uuid` interrogée avec n'importe
    // quoi rend une erreur PostgreSQL, donc un 500.
    expect(validateResultForm(values({ toolId: "Ergonome" })).toolId).toBe(
      "Cet outil n'est pas reconnu.",
    );
  });

  test("l'existence de l'outil dans le domaine n'est pas tranchée ici", () => {
    // Un UUID bien formé mais inconnu passe la validation : c'est l'action qui
    // le confronte au domaine. Deux autorités sur une même règle divergent.
    expect(
      validateResultForm(
        values({ toolId: "00000000-0000-4000-8000-000000000000" }),
      ).toolId,
    ).toBeUndefined();
  });
});

/* ==========================================================================
   Le lien profond — le contrôle qui protège le rendu, pas seulement la saisie
   ========================================================================== */

describe("validateResultForm — le lien", () => {
  test("un lien absent passe : T4.3 en fait un cas normal", () => {
    // Les deux résultats de la fixture sont exactement ce cas : la valeur
    // s'affiche, et aucun lien mort n'est rendu.
    expect(
      validateResultForm(values({ externalUrl: "" })).externalUrl,
    ).toBeUndefined();
  });

  const accepted = [
    "https://exemple.invalid/rapports/62",
    "http://exemple.invalid/rapport",
    "https://exemple.invalid/audit?id=118#constat-4",
  ];

  test.each(accepted)("« %s » est un lien web", (externalUrl) => {
    expect(
      validateResultForm(values({ externalUrl })).externalUrl,
    ).toBeUndefined();
  });

  const refused = [
    // Le cas qui motive tout ce bloc : un `href` exécutable, rendu tel quel
    // par `ExternalLink` sur le libellé du résultat.
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "ftp://exemple.invalid/rapport.pdf",
    "/rapport.pdf",
    "exemple.invalid/rapport",
  ];

  test.each(refused)("« %s » n'est pas un lien web", (externalUrl) => {
    expect(validateResultForm(values({ externalUrl })).externalUrl).toBe(
      "Cette adresse n'est pas un lien web : elle doit commencer par http:// ou https://.",
    );
  });
});

/* ==========================================================================
   De la saisie aux lignes
   ========================================================================== */

describe("parseResultForm", () => {
  test("une saisie complète rend la ligne à écrire", () => {
    const { errors, input } = parseResultForm(formOf());

    expect(errors).toEqual({});
    expect(input).toEqual({
      label: "Score d'audit UX",
      value: "62",
      unit: "/100",
      measuredOn: "2024-05-31",
      toolId: TOOL,
      externalUrl: "https://exemple.invalid/rapports/62",
    });
  });

  test("les quatre champs facultatifs vides deviennent `null`, jamais « »", () => {
    // `""` dans une colonne `text` nullable serait une valeur, pas une absence :
    // `Result` afficherait alors une part vide avec son séparateur.
    const { input } = parseResultForm(
      formOf({ value: "", unit: "", toolId: "", externalUrl: "" }),
    );

    expect(input).toEqual({
      label: "Score d'audit UX",
      value: null,
      unit: null,
      measuredOn: "2024-05-31",
      toolId: null,
      externalUrl: null,
    });
  });

  test("`input` est nul dès qu'une erreur est posée", () => {
    // La propriété de T2.5 : `input` non nul **si et seulement si** `errors`
    // est vide. Elle évite d'affirmer par un `as` ce que la validation venait
    // de prouver.
    const { errors, input } = parseResultForm(formOf({ label: "" }));

    expect(Object.keys(errors)).toEqual(["label"]);
    expect(input).toBeNull();
  });

  test("une saisie refusée revient avec ses valeurs, jamais vidée", () => {
    // Vision ne jette jamais en silence ce qui a été tapé.
    const { values: returned } = parseResultForm(
      formOf({ label: "", value: "68,5", unit: "%" }),
    );

    expect(returned.value).toBe("68,5");
    expect(returned.unit).toBe("%");
  });

  test("plusieurs refus se cumulent plutôt que de s'arrêter au premier", () => {
    const { errors } = parseResultForm(
      formOf({ label: "", value: "0x10", measuredOn: "", externalUrl: "ftp://x/y" }),
    );

    expect(Object.keys(errors).sort()).toEqual([
      "externalUrl",
      "label",
      "measuredOn",
      "value",
    ]);
  });

  test("la ligne ne porte que les six colonnes du ticket", () => {
    // Ni `activityId`, lié côté serveur, ni `externalRef` / `syncMode` /
    // `syncedAt`, interdits par la fiche.
    const { input } = parseResultForm(formOf());

    expect(Object.keys(input ?? {}).sort()).toEqual([
      "externalUrl",
      "label",
      "measuredOn",
      "toolId",
      "unit",
      "value",
    ]);
  });
});
