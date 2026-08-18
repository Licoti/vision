/**
 * Les tests de la saisie d'un persona.
 *
 * **Aucune base**, comme les dix fichiers de tests voisins : c'est la
 * contrepartie d'avoir isolé la validation dans un module pur. Ils énoncent la
 * règle plutôt que de l'observer sur une fixture.
 *
 * Trois blocs portent le poids du fichier :
 *   — l'obligation du **nom**, seule colonne `not null` que le formulaire écrit ;
 *   — la **liste fermée** du rang, qui n'est pas décorative : les deux boutons
 *     radio ne portent que les valeurs de l'énuméré, mais une soumission forgée
 *     porte ce qu'elle veut, et une valeur hors énuméré rendrait une erreur
 *     PostgreSQL — un 500 — là où l'on attend un message de champ ;
 *   — le **découpage des trois zones**, qui est la traduction du texte saisi en
 *     lignes identifiées, et donc la promesse tenue du modèle.
 *
 * Ce qui n'est pas testé ici, et ne doit pas l'être : l'existence du produit
 * dans le domaine, le droit d'y écrire, l'appartenance du persona au produit.
 * C'est tranché par l'action, et par `lib/db/scoped.ts` derrière elle.
 */

import { describe, expect, test } from "vitest";

import {
  EMPTY_PERSONA_VALUES,
  PERSONA_KIND_VALUES,
  PERSONA_TRAIT_KIND_VALUES,
  isPersonaKind,
  parsePersonaForm,
  readLines,
  readPersonaForm,
  toPersonaFormValues,
  validatePersonaForm,
  type PersonaFormValues,
} from "./persona";

/** Une saisie complète et valide, dont chaque test ne change que ce qu'il éprouve. */
function values(overrides: Partial<PersonaFormValues> = {}): PersonaFormValues {
  return {
    name: "Chargé de clientèle",
    role: "Réseau d'agences",
    summary: "Il ouvre vingt dossiers par jour et n'a pas deux minutes.",
    imageUrl: "https://exemple.fr/portrait.jpg",
    kind: "primary",
    goals: "Ouvrir un dossier en moins de cinq minutes",
    pains: "Ressaisir les mêmes informations trois fois",
    expectations: "Retrouver un dossier sans appeler le support",
    ...overrides,
  };
}

/** Le `FormData` correspondant, pour les tests qui passent par la lecture. */
function formOf(overrides: Partial<PersonaFormValues> = {}): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values(overrides))) {
    data.set(key, value);
  }
  return data;
}

/* ==========================================================================
   La lecture
   ========================================================================== */

describe("readPersonaForm", () => {
  test("lit les huit champs et les rogne", () => {
    const data = formOf({ name: "  Chargé  ", role: "  Réseau " });

    expect(readPersonaForm(data)).toEqual(
      values({ name: "Chargé", role: "Réseau" }),
    );
  });

  test("un champ absent vaut vide, jamais indéfini", () => {
    expect(readPersonaForm(new FormData())).toEqual({
      ...EMPTY_PERSONA_VALUES,
      /* `EMPTY_PERSONA_VALUES` pose le rang par défaut de l'écran ; un
         formulaire vide, lui, n'a rien posé du tout. La différence est
         volontaire : c'est la validation qui refusera, pas la lecture qui
         inventera. */
      kind: "",
    });
  });

  test("un champ d'un type inattendu vaut vide", () => {
    const data = new FormData();
    data.set("name", new Blob(["portrait"]));

    expect(readPersonaForm(data).name).toBe("");
  });
});

/* ==========================================================================
   Le découpage des trois zones — une ligne = un élément
   ========================================================================== */

describe("readLines", () => {
  test("une ligne par élément, dans l'ordre de saisie", () => {
    expect(readLines("Ouvrir un dossier\nRetrouver un client\nÉditer un devis")).toEqual([
      "Ouvrir un dossier",
      "Retrouver un client",
      "Éditer un devis",
    ]);
  });

  test("les lignes vides disparaissent — un retour de trop n'est pas un objectif", () => {
    expect(readLines("Premier\n\n\nSecond\n")).toEqual(["Premier", "Second"]);
  });

  test("chaque ligne est rognée", () => {
    expect(readLines("  Premier  \n\tSecond\t")).toEqual(["Premier", "Second"]);
  });

  test("le retour chariot de Windows ne reste pas en fin de libellé", () => {
    expect(readLines("Premier\r\nSecond")).toEqual(["Premier", "Second"]);
  });

  test("un doublon exact n'est retenu qu'une fois", () => {
    expect(readLines("Premier\nSecond\nPremier")).toEqual(["Premier", "Second"]);
  });

  test("une zone vide ne rend aucun élément", () => {
    expect(readLines("")).toEqual([]);
    expect(readLines("   \n  \n")).toEqual([]);
  });
});

/* ==========================================================================
   La validation
   ========================================================================== */

describe("validatePersonaForm", () => {
  test("une saisie complète ne rend aucune erreur", () => {
    expect(validatePersonaForm(values())).toEqual({});
  });

  test("le nom est obligatoire", () => {
    expect(validatePersonaForm(values({ name: "" })).name).toBe(
      "Le nom du persona est obligatoire.",
    );
  });

  test("le rang est obligatoire", () => {
    expect(validatePersonaForm(values({ kind: "" })).kind).toBe(
      "Le rang du persona est obligatoire.",
    );
  });

  test("un rang hors de l'énuméré est refusé, pas transmis à la base", () => {
    expect(validatePersonaForm(values({ kind: "principal" })).kind).toBe(
      "Ce rang de persona n'existe pas.",
    );
  });

  test("les deux rangs de l'énuméré passent", () => {
    for (const kind of PERSONA_KIND_VALUES) {
      expect(validatePersonaForm(values({ kind }))).toEqual({});
    }
  });

  test("l'image est facultative", () => {
    expect(validatePersonaForm(values({ imageUrl: "" }))).toEqual({});
  });

  test("une image qui n'est pas un lien web est refusée", () => {
    for (const imageUrl of [
      "portrait.jpg",
      "/images/portrait.jpg",
      "exemple.fr/portrait.jpg",
      "javascript:alert(1)",
      "data:image/png;base64,iVBORw0KGgo=",
      "file:///Users/moi/portrait.jpg",
    ]) {
      expect(validatePersonaForm(values({ imageUrl })).imageUrl).toBe(
        "Cette adresse n'est pas un lien web : elle doit commencer par http:// ou https://.",
      );
    }
  });

  test("http et https passent l'un comme l'autre", () => {
    expect(
      validatePersonaForm(values({ imageUrl: "http://exemple.fr/p.png" })),
    ).toEqual({});
    expect(
      validatePersonaForm(values({ imageUrl: "https://exemple.fr/p.png" })),
    ).toEqual({});
  });

  test("le rôle, la description et les trois zones n'ont aucune forme imposée", () => {
    expect(
      validatePersonaForm(
        values({
          role: "",
          summary: "",
          goals: "",
          pains: "",
          expectations: "",
        }),
      ),
    ).toEqual({});
  });
});

/* ==========================================================================
   De la saisie aux lignes
   ========================================================================== */

describe("parsePersonaForm", () => {
  test("rend la ligne et ses traits quand tout est valide", () => {
    const { errors, input } = parsePersonaForm(
      formOf({
        goals: "Ouvrir vite\nRetrouver un dossier",
        pains: "Ressaisir",
        expectations: "",
      }),
    );

    expect(errors).toEqual({});
    expect(input).toEqual({
      persona: {
        name: "Chargé de clientèle",
        role: "Réseau d'agences",
        summary: "Il ouvre vingt dossiers par jour et n'a pas deux minutes.",
        imageUrl: "https://exemple.fr/portrait.jpg",
        kind: "primary",
      },
      traits: [
        { kind: "goal", label: "Ouvrir vite", position: 0 },
        { kind: "goal", label: "Retrouver un dossier", position: 1 },
        { kind: "pain", label: "Ressaisir", position: 0 },
      ],
    });
  });

  test("la position repart de zéro dans chaque famille", () => {
    const { input } = parsePersonaForm(
      formOf({ goals: "G1\nG2", pains: "P1\nP2", expectations: "A1" }),
    );

    expect(input?.traits.map((trait) => [trait.kind, trait.position])).toEqual([
      ["goal", 0],
      ["goal", 1],
      ["pain", 0],
      ["pain", 1],
      ["expectation", 0],
    ]);
  });

  test("les trois familles sortent dans l'ordre du schéma", () => {
    const { input } = parsePersonaForm(
      formOf({ goals: "G", pains: "P", expectations: "A" }),
    );

    expect(input?.traits.map((trait) => trait.kind)).toEqual([
      ...PERSONA_TRAIT_KIND_VALUES,
    ]);
  });

  test("un persona sans aucun trait est un persona valide", () => {
    const { errors, input } = parsePersonaForm(
      formOf({ goals: "", pains: "", expectations: "" }),
    );

    expect(errors).toEqual({});
    expect(input?.traits).toEqual([]);
  });

  test("les champs facultatifs vides deviennent nuls, jamais des chaînes vides", () => {
    const { input } = parsePersonaForm(
      formOf({ role: "", summary: "", imageUrl: "" }),
    );

    expect(input?.persona.role).toBeNull();
    expect(input?.persona.summary).toBeNull();
    expect(input?.persona.imageUrl).toBeNull();
  });

  test("`input` est nul dès qu'une erreur est posée", () => {
    for (const overrides of [{ name: "" }, { kind: "" }, { kind: "x" }, { imageUrl: "abc" }]) {
      const { errors, input } = parsePersonaForm(formOf(overrides));
      expect(Object.keys(errors).length).toBeGreaterThan(0);
      expect(input).toBeNull();
    }
  });

  test("les valeurs saisies reviennent même quand la saisie est refusée", () => {
    const { values: returned } = parsePersonaForm(formOf({ name: "" }));

    expect(returned.summary).toBe(
      "Il ouvre vingt dossiers par jour et n'a pas deux minutes.",
    );
    expect(returned.goals).toBe("Ouvrir un dossier en moins de cinq minutes");
  });
});

/* ==========================================================================
   Le chemin inverse — la ligne relue dans le formulaire
   ========================================================================== */

describe("toPersonaFormValues", () => {
  test("regroupe les traits en trois zones, dans l'ordre reçu", () => {
    const relu = toPersonaFormValues(
      {
        name: "Chargé de clientèle",
        role: null,
        summary: null,
        imageUrl: null,
        kind: "secondary",
      },
      [
        { kind: "goal", label: "Ouvrir vite" },
        { kind: "goal", label: "Retrouver un dossier" },
        { kind: "expectation", label: "Ne pas appeler le support" },
      ],
    );

    expect(relu).toEqual({
      name: "Chargé de clientèle",
      role: "",
      summary: "",
      imageUrl: "",
      kind: "secondary",
      goals: "Ouvrir vite\nRetrouver un dossier",
      pains: "",
      expectations: "Ne pas appeler le support",
    });
  });

  test("le tour complet ne perd rien — relu, resaisi, identique", () => {
    const first = parsePersonaForm(formOf({ goals: "G1\nG2", pains: "P1" }));
    const relu = toPersonaFormValues(first.input!.persona, first.input!.traits);
    const second = parsePersonaForm(formOf(relu));

    expect(second.input).toEqual(first.input);
  });
});

/* ==========================================================================
   La garde de l'énuméré
   ========================================================================== */

describe("isPersonaKind", () => {
  test("reconnaît les deux valeurs du schéma et rien d'autre", () => {
    expect(isPersonaKind("primary")).toBe(true);
    expect(isPersonaKind("secondary")).toBe(true);
    expect(isPersonaKind("principal")).toBe(false);
    expect(isPersonaKind("")).toBe(false);
  });
});
