/**
 * Les tests de la saisie d'une personne.
 *
 * **Aucune base**, comme les douze fichiers de tests voisins : c'est la
 * contrepartie d'avoir isolé la validation dans un module pur. Ils énoncent la
 * règle plutôt que de l'observer sur une fixture.
 *
 * Deux blocs portent le poids du fichier :
 *   — l'obligation du **nom**, la seule colonne `not null` que ce formulaire
 *     remplisse librement ;
 *   — le **genre**, vérifié parce qu'une soumission forgée porte ce qu'elle veut
 *     et qu'une valeur hors énuméré rendrait un 500.
 *
 * **Le troisième bloc est parti le 28/08/2026** : il éprouvait le refus de la
 * disponibilité sur un intervenant côté entité, et la disponibilité ne se saisit
 * plus — elle se déduit du nombre d'accompagnements vivants
 * (`lib/availability.ts`). Ce que ce bloc protégeait est éprouvé par
 * `lib/queries/team.test.ts`, sur la lecture.
 *
 * Ce qui n'est pas testé ici, et ne doit pas l'être : l'existence du métier dans
 * le domaine — c'est `assertPreconditions` qui la tranche —, le droit d'écrire
 * un profil, et l'archivage de la personne corrigée. Un module pur ne connaît
 * pas de domaine.
 */

import { describe, expect, test } from "vitest";

import {
  EMPTY_PERSON_VALUES,
  parsePersonForm,
  PERSON_KIND_LABEL,
  readPersonForm,
  toPersonFormValues,
  validatePersonForm,
  type PersonFormValues,
} from "./person";

const JOB = "0f9c4c8e-3b1a-4f2d-9c7e-1a2b3c4d5e6f";

/** Une saisie complète et valide, dont chaque test ne change que ce qu'il éprouve. */
function values(overrides: Partial<PersonFormValues> = {}): PersonFormValues {
  return {
    fullName: "Camille Roux",
    jobId: JOB,
    kind: "center",
    bio: "Product designer, accompagne les équipes du cadrage à la mise en service.",
    ...overrides,
  };
}

/** Un `FormData` tel que le panneau le poste. */
function form(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    formData.set(name, value);
  }
  return formData;
}

describe("readPersonForm", () => {
  test("lit les quatre champs, et rogne les blancs", () => {
    const read = readPersonForm(
      form({
        fullName: "  Sofia Marchand  ",
        jobId: `  ${JOB}  `,
        kind: "  center  ",
        bio: "  Chercheuse.  ",
      }),
    );

    expect(read).toEqual({
      fullName: "Sofia Marchand",
      jobId: JOB,
      kind: "center",
      bio: "Chercheuse.",
    });
  });

  test("un champ absent vaut vide, jamais `undefined`", () => {
    expect(readPersonForm(new FormData())).toEqual(EMPTY_PERSON_VALUES);
  });

  test("ne lit aucun champ que le formulaire n'a pas", () => {
    /* Un champ caché ajouté par n'importe qui ne doit pas devenir une colonne
       écrite : `source`, `hasAccess` et `domainRole` appartiennent à
       l'authentification (C7), jamais à cet écran. */
    const read = readPersonForm(
      form({
        fullName: "Marc Tellier",
        kind: "stakeholder",
        source: "directory",
        hasAccess: "true",
        domainRole: "domain_manager",
      }),
    );

    expect(Object.keys(read).sort()).toEqual([
      "bio",
      "fullName",
      "jobId",
      "kind",
    ]);
  });
});

describe("toPersonFormValues", () => {
  test("ramène la ligne aux quatre chaînes, `null` devenant vide", () => {
    expect(
      toPersonFormValues({
        fullName: "Marc Tellier",
        jobId: null,
        kind: "stakeholder",
        bio: null,
      }),
    ).toEqual({
      fullName: "Marc Tellier",
      jobId: "",
      kind: "stakeholder",
      bio: "",
    });
  });
});

describe("validatePersonForm", () => {
  test("une saisie complète ne lève rien", () => {
    expect(validatePersonForm(values())).toEqual({});
  });

  test("le nom est obligatoire", () => {
    expect(validatePersonForm(values({ fullName: "" })).fullName).toBeDefined();
  });

  test("le genre est obligatoire", () => {
    expect(validatePersonForm(values({ kind: "" })).kind).toBeDefined();
  });

  test("un genre hors énuméré est refusé", () => {
    expect(validatePersonForm(values({ kind: "partner" })).kind).toBeDefined();
  });

  test("le métier est facultatif", () => {
    expect(validatePersonForm(values({ jobId: "" })).jobId).toBeUndefined();
  });

  test("un métier qui n'a pas la forme d'un identifiant est refusé", () => {
    expect(
      validatePersonForm(values({ jobId: "n-importe-quoi" })).jobId,
    ).toBeDefined();
  });

  test("la présentation est facultative, et jamais contrainte", () => {
    expect(validatePersonForm(values({ bio: "" })).bio).toBeUndefined();
    expect(validatePersonForm(values({ bio: "x" })).bio).toBeUndefined();
  });

  test("un intervenant côté entité sans métier passe", () => {
    expect(
      validatePersonForm(values({ kind: "stakeholder", jobId: "" })),
    ).toEqual({});
  });
});

describe("parsePersonForm", () => {
  test("rend la ligne prête à écrire", () => {
    const parsed = parsePersonForm(
      form({
        fullName: "Camille Roux",
        jobId: JOB,
        kind: "center",
        bio: "Product designer.",
      }),
    );

    expect(parsed.errors).toEqual({});
    expect(parsed.input).toEqual({
      fullName: "Camille Roux",
      jobId: JOB,
      kind: "center",
      bio: "Product designer.",
    });
  });

  test("les champs vides deviennent `null`, jamais des chaînes vides", () => {
    const parsed = parsePersonForm(
      form({ fullName: "Marc Tellier", kind: "stakeholder" }),
    );

    expect(parsed.input).toEqual({
      fullName: "Marc Tellier",
      jobId: null,
      kind: "stakeholder",
      bio: null,
    });
  });

  test("un intervenant côté entité passe sans métier ni présentation", () => {
    const parsed = parsePersonForm(
      form({ fullName: "Marc Tellier", kind: "stakeholder" }),
    );

    expect(parsed.errors).toEqual({});
    expect(parsed.input?.jobId).toBeNull();
    expect(parsed.input?.bio).toBeNull();
  });

  test("`input` est nul dès qu'une erreur est levée", () => {
    const parsed = parsePersonForm(form({ fullName: "", kind: "center" }));

    expect(parsed.errors.fullName).toBeDefined();
    expect(parsed.input).toBeNull();
  });

  test("la saisie revient telle quelle quand elle est refusée", () => {
    const parsed = parsePersonForm(
      form({ fullName: "", kind: "center", bio: "Une présentation." }),
    );

    expect(parsed.values.bio).toBe("Une présentation.");
  });
});

describe("PERSON_KIND_LABEL", () => {
  test("nomme les deux genres, avec le vocabulaire de la liste", () => {
    expect(PERSON_KIND_LABEL.center).toBe("Membre du centre");
    expect(PERSON_KIND_LABEL.stakeholder).toBe("Intervenant côté entité");
  });
});
