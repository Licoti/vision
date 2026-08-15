/**
 * Les tests de la saisie d'une ressource.
 *
 * **Aucune base**, comme ceux du produit, du projet et de l'activité : c'est la
 * contrepartie d'avoir isolé la validation dans un module pur. Ils énoncent la
 * règle plutôt que de l'observer sur une fixture.
 *
 * Le cœur du fichier est la table des adresses. Elle est éprouvée **schéma par
 * schéma** plutôt que sur un seul contre-exemple, parce que ce contrôle n'est
 * pas une politesse de formulaire : `ExternalLink` rend le `href` tel quel, et
 * une adresse `javascript:` enregistrée s'exécuterait au clic.
 *
 * Ce qui n'est pas testé ici, et ne doit pas l'être : l'existence de l'activité
 * dans le domaine et son appartenance au projet. C'est tranché par l'action, et
 * par `lib/db/scoped.ts` derrière elle.
 */

import { describe, expect, test } from "vitest";

import { resourceType } from "@/lib/db/schema";

import {
  EMPTY_RESOURCE_VALUES,
  RESOURCE_TYPE_VALUES,
  isResourceType,
  parseResourceForm,
  readResourceForm,
  toResourceFormValues,
  validateResourceForm,
  type ResourceFormValues,
} from "./resource";

const ACTIVITY = "3f2504e0-4f89-11d3-9a0c-0305e82c3311";

/** Une saisie complète et valide, dont chaque test ne change que ce qu'il éprouve. */
function values(overrides: Partial<ResourceFormValues> = {}): ResourceFormValues {
  return {
    title: "Restitution des tests — vague 2",
    url: "https://exemple.invalid/restitution.pptx",
    resourceType: "powerpoint",
    activityId: "",
    ...overrides,
  };
}

/** Le `FormData` correspondant, pour les tests qui passent par la lecture. */
function formOf(overrides: Partial<ResourceFormValues> = {}): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values(overrides))) {
    data.set(key, value);
  }
  return data;
}

/* ==========================================================================
   La lecture
   ========================================================================== */

describe("readResourceForm", () => {
  test("lit les quatre champs, et les rogne", () => {
    const data = new FormData();
    data.set("title", "  Grille d'entretien  ");
    data.set("url", "  https://exemple.invalid/grille  ");
    data.set("resourceType", " pdf ");
    data.set("activityId", `  ${ACTIVITY}  `);

    expect(readResourceForm(data)).toEqual({
      title: "Grille d'entretien",
      url: "https://exemple.invalid/grille",
      resourceType: "pdf",
      activityId: ACTIVITY,
    });
  });

  test("un formulaire vide rend les valeurs vides, jamais `undefined`", () => {
    expect(readResourceForm(new FormData())).toEqual(EMPTY_RESOURCE_VALUES);
  });

  test("les champs hors du ticket ne sont pas lus", () => {
    // Un champ caché ajouté par n'importe qui ne doit pas devenir une colonne
    // écrite : la lecture est nommée, jamais un étalement du `FormData`.
    const data = formOf();
    data.set("projectId", "3f2504e0-4f89-11d3-9a0c-0305e82c3399");
    data.set("sourceUpdatedAt", "2026-08-14T00:00:00Z");
    data.set("domainId", "3f2504e0-4f89-11d3-9a0c-0305e82c3398");

    expect(Object.keys(readResourceForm(data)).sort()).toEqual([
      "activityId",
      "resourceType",
      "title",
      "url",
    ]);
  });
});

/* ==========================================================================
   Le titre
   ========================================================================== */

describe("validateResourceForm — le titre", () => {
  test("un titre vide est refusé", () => {
    expect(validateResourceForm(values({ title: "" })).title).toBe(
      "Le titre de la ressource est obligatoire.",
    );
  });

  test("un titre fait d'espaces est refusé comme un titre vide", () => {
    // Le rognage a lieu à la lecture : la validation ne voit jamais « " " ».
    expect(readResourceForm(formOf({ title: "   " })).title).toBe("");
  });

  test("un titre renseigné passe", () => {
    expect(validateResourceForm(values()).title).toBeUndefined();
  });
});

/* ==========================================================================
   L'adresse — le contrôle qui protège le rendu, pas seulement la saisie
   ========================================================================== */

describe("validateResourceForm — l'adresse", () => {
  test("une adresse vide est refusée", () => {
    expect(validateResourceForm(values({ url: "" })).url).toBe(
      "L'adresse du document est obligatoire.",
    );
  });

  const accepted = [
    "https://exemple.invalid/restitution.pptx",
    "http://exemple.invalid/rapport",
    "https://exemple.invalid",
    "https://exemple.invalid/dossier/fichier.pdf?v=2#page=3",
    "HTTPS://EXEMPLE.INVALID/MAJUSCULES",
  ];

  test.each(accepted)("« %s » est un lien web", (url) => {
    expect(validateResourceForm(values({ url })).url).toBeUndefined();
  });

  const refused = [
    // Le cas qui motive tout ce bloc : un `href` exécutable.
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    // Absolus, mais pas des liens web.
    "ftp://exemple.invalid/rapport.pdf",
    "file:///Users/moi/rapport.pdf",
    // Relatifs : pas de schéma, donc rien qui quitte Vision.
    "/rapport.pdf",
    "exemple.invalid/rapport",
    "trois mots",
  ];

  test.each(refused)("« %s » n'est pas un lien web", (url) => {
    expect(validateResourceForm(values({ url })).url).toBe(
      "Cette adresse n'est pas un lien web : elle doit commencer par http:// ou https://.",
    );
  });

  test("une adresse absente n'est jamais qualifiée de mal formée", () => {
    // Deux refus distincts, et le message doit dire lequel : « obligatoire »
    // n'est pas « mal formée ».
    expect(validateResourceForm(values({ url: "" })).url).not.toContain("http://");
  });
});

/* ==========================================================================
   Le type — saisi, jamais déduit de l'URL (D21)
   ========================================================================== */

describe("validateResourceForm — le type", () => {
  test("les sept valeurs du schéma sont acceptées", () => {
    // La liste vient de l'énuméré, pas d'une copie : le jour où il s'allonge,
    // ce test couvre la nouvelle valeur sans qu'on y pense.
    expect(RESOURCE_TYPE_VALUES).toEqual(resourceType.enumValues);

    for (const type of RESOURCE_TYPE_VALUES) {
      expect(
        validateResourceForm(values({ resourceType: type })).resourceType,
      ).toBeUndefined();
    }
  });

  test("un type absent est refusé", () => {
    expect(
      validateResourceForm(values({ resourceType: "" })).resourceType,
    ).toBe("Le type de la ressource est obligatoire.");
  });

  test("un type hors de l'énuméré est refusé", () => {
    expect(
      validateResourceForm(values({ resourceType: "keynote" })).resourceType,
    ).toBe("Ce type de ressource n'existe pas.");
  });

  test("le type n'est jamais deviné depuis l'adresse (D21)", () => {
    // Une URL qui « dit » son format ne dispense pas de choisir : la saisie
    // reste refusée tant que le champ est vide.
    const guessable = values({
      url: "https://exemple.invalid/rapport.pdf",
      resourceType: "",
    });

    expect(validateResourceForm(guessable).resourceType).toBeDefined();
    expect(parseResourceForm(formOf(guessable)).input).toBeNull();
  });

  test("isResourceType ne reconnaît que l'énuméré", () => {
    expect(isResourceType("figma")).toBe(true);
    expect(isResourceType("Figma")).toBe(false);
    expect(isResourceType("")).toBe(false);
  });
});

/* ==========================================================================
   Le rattachement — facultatif
   ========================================================================== */

describe("validateResourceForm — l'activité", () => {
  test("aucune activité est un cas normal, pas une erreur", () => {
    expect(validateResourceForm(values({ activityId: "" })).activityId).toBeUndefined();
  });

  test("un identifiant d'activité valide passe", () => {
    expect(
      validateResourceForm(values({ activityId: ACTIVITY })).activityId,
    ).toBeUndefined();
  });

  test("un identifiant qui n'en est pas un est refusé avant la base", () => {
    // Sans ce refus, la colonne `uuid` serait interrogée avec n'importe quoi :
    // une erreur PostgreSQL, donc un 500, là où l'on attend un message.
    expect(
      validateResourceForm(values({ activityId: "nouvelle" })).activityId,
    ).toBe("Cette activité n'est pas reconnue.");
  });
});

/* ==========================================================================
   La ligne à écrire
   ========================================================================== */

describe("parseResourceForm", () => {
  test("une saisie valide rend les quatre colonnes, et pas une de plus", () => {
    const { errors, input } = parseResourceForm(
      formOf({ activityId: ACTIVITY }),
    );

    expect(errors).toEqual({});
    expect(input).toEqual({
      title: "Restitution des tests — vague 2",
      url: "https://exemple.invalid/restitution.pptx",
      resourceType: "powerpoint",
      activityId: ACTIVITY,
    });
  });

  test("un rattachement vide part en base à `null`, jamais en chaîne vide", () => {
    // La colonne est nullable pour cette raison, et la lecture de T4.1 teste
    // `activityLabel` pour choisir ce qu'elle affiche.
    expect(parseResourceForm(formOf()).input?.activityId).toBeNull();
  });

  test("`input` est nul dès qu'une erreur est posée", () => {
    const refused = parseResourceForm(formOf({ title: "", url: "" }));

    expect(refused.input).toBeNull();
    expect(Object.keys(refused.errors).sort()).toEqual(["title", "url"]);
  });

  test("les valeurs reviennent telles qu'elles ont été tapées", () => {
    // Vision ne jette jamais en silence ce qui a été tapé : le panneau les
    // réaffiche, y compris celles qu'elle refuse.
    const { values: returned } = parseResourceForm(
      formOf({ url: "pas une adresse" }),
    );

    expect(returned.url).toBe("pas une adresse");
    expect(returned.title).toBe("Restitution des tests — vague 2");
  });

  test("le tour complet d'une correction à l'identique rend la ligne de départ", () => {
    /* **Le critère du ticket, énoncé sans base** : une ressource ouverte en
       correction et re-soumise sans qu'on y touche doit rendre exactement ce
       qui était enregistré — rattachement compris. C'est la perte silencieuse
       que T4bis.1 a refermée pour les formulaires de produit et de projet, ici
       éprouvée sur le chemin `ligne → panneau → action`. */
    const row = {
      title: "Rapport d'audit d'accessibilité",
      url: "https://exemple.invalid/audit-a11y.pdf",
      resourceType: "pdf" as const,
      activityId: ACTIVITY,
    };

    const data = new FormData();
    for (const [key, value] of Object.entries(toResourceFormValues(row))) {
      data.set(key, value);
    }

    expect(parseResourceForm(data).input).toEqual(row);
  });

  test("`input` non nul si et seulement si `errors` est vide", () => {
    const cases = [
      formOf(),
      formOf({ title: "" }),
      formOf({ url: "javascript:alert(1)" }),
      formOf({ resourceType: "keynote" }),
      formOf({ activityId: "pas-un-uuid" }),
      new FormData(),
    ];

    for (const data of cases) {
      const { errors, input } = parseResourceForm(data);
      expect(input === null).toBe(Object.keys(errors).length > 0);
    }
  });
});

/* ==========================================================================
   De la ligne au panneau — T4bis.5
   ========================================================================== */

describe("toResourceFormValues", () => {
  test("une ligne complète rend ses quatre valeurs", () => {
    expect(
      toResourceFormValues({
        title: "Maquettes v3",
        url: "https://exemple.invalid/maquettes-v3",
        resourceType: "figma",
        activityId: ACTIVITY,
      }),
    ).toEqual({
      title: "Maquettes v3",
      url: "https://exemple.invalid/maquettes-v3",
      resourceType: "figma",
      activityId: ACTIVITY,
    });
  });

  test("un rattachement absent rend la valeur de l'option « Aucune »", () => {
    // `activity_id` est nullable — le rattachement est facultatif (`docs/02`
    // §5). `null` n'est pas une valeur de `select` : c'est `""` qui l'est.
    const returned = toResourceFormValues({
      title: "Grille d'entretien",
      url: "https://exemple.invalid/grille",
      resourceType: "word",
      activityId: null,
    });

    expect(returned.activityId).toBe("");
  });
});
