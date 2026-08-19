/**
 * Les tests de la saisie d'une personne.
 *
 * **Aucune base**, comme les douze fichiers de tests voisins : c'est la
 * contrepartie d'avoir isolé la validation dans un module pur. Ils énoncent la
 * règle plutôt que de l'observer sur une fixture.
 *
 * Trois blocs portent le poids du fichier :
 *   — l'obligation du **nom**, la seule colonne `not null` que ce formulaire
 *     remplisse librement ;
 *   — les deux **énumérés**, vérifiés parce qu'une soumission forgée porte ce
 *     qu'elle veut et qu'une valeur hors énuméré rendrait un 500 ;
 *   — le **refus de la disponibilité sur un intervenant côté entité**
 *     (arbitrage (d) de C5bis), qui est la règle propre à ce formulaire : le
 *     `CHECK` `persons_availability_requires_center` la tient en base, et
 *     l'y laisser seul rendrait un 500 là où l'on attend un message de champ.
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
    availability: "partial",
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
  test("lit les cinq champs, et rogne les blancs", () => {
    const read = readPersonForm(
      form({
        fullName: "  Sofia Marchand  ",
        jobId: `  ${JOB}  `,
        kind: "  center  ",
        bio: "  Chercheuse.  ",
        availability: "  available  ",
      }),
    );

    expect(read).toEqual({
      fullName: "Sofia Marchand",
      jobId: JOB,
      kind: "center",
      bio: "Chercheuse.",
      availability: "available",
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
      "availability",
      "bio",
      "fullName",
      "jobId",
      "kind",
    ]);
  });
});

describe("toPersonFormValues", () => {
  test("ramène la ligne aux cinq chaînes, `null` devenant vide", () => {
    expect(
      toPersonFormValues({
        fullName: "Marc Tellier",
        jobId: null,
        kind: "stakeholder",
        bio: null,
        availability: null,
      }),
    ).toEqual({
      fullName: "Marc Tellier",
      jobId: "",
      kind: "stakeholder",
      bio: "",
      availability: "",
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

  test("la disponibilité est facultative", () => {
    expect(
      validatePersonForm(values({ availability: "" })).availability,
    ).toBeUndefined();
  });

  test("une disponibilité hors énuméré est refusée", () => {
    expect(
      validatePersonForm(values({ availability: "peut-etre" })).availability,
    ).toBeDefined();
  });

  /* Arbitrage (d) de C5bis : la disponibilité est une propriété du centre. Le
     `CHECK` la tient en base ; ce cas est ce qui la rend lisible à l'écran. */
  test("un intervenant côté entité ne porte pas de disponibilité", () => {
    expect(
      validatePersonForm(
        values({ kind: "stakeholder", availability: "available" }),
      ).availability,
    ).toBeDefined();
  });

  test("un intervenant côté entité sans disponibilité passe", () => {
    expect(
      validatePersonForm(
        values({ kind: "stakeholder", availability: "", jobId: "" }),
      ),
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
        availability: "partial",
      }),
    );

    expect(parsed.errors).toEqual({});
    expect(parsed.input).toEqual({
      fullName: "Camille Roux",
      jobId: JOB,
      kind: "center",
      bio: "Product designer.",
      availability: "partial",
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
      availability: null,
    });
  });

  /* La disponibilité tombe avec le genre, et c'est ce `null` explicite qui
     **efface** celle d'une personne passant du centre à l'entité : sans lui, la
     correction laisserait la colonne en place et le `CHECK` refuserait
     l'écriture. La validation ayant déjà refusé une disponibilité saisie sur un
     `stakeholder`, ce cas ne s'atteint qu'en corrigeant le genre seul. */
  test("le genre `stakeholder` efface la disponibilité", () => {
    const parsed = parsePersonForm(
      form({ fullName: "Marc Tellier", kind: "stakeholder", availability: "" }),
    );

    expect(parsed.errors).toEqual({});
    expect(parsed.input?.availability).toBeNull();
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
