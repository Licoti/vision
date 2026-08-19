/**
 * Les tests de la saisie d'un use case.
 *
 * **Aucune base**, comme les onze fichiers de tests voisins : c'est la
 * contrepartie d'avoir isolé la validation dans un module pur. Ils énoncent la
 * règle plutôt que de l'observer sur une fixture.
 *
 * Trois blocs portent le poids du fichier :
 *   — l'obligation du **titre** et de la **description**, les deux colonnes
 *     `not null` que ce formulaire écrit — et la seconde est ce qui distingue
 *     un use case d'un persona, dont le résumé est facultatif ;
 *   — la lecture d'un **groupe de cases à cocher**, qui n'a pas d'équivalent
 *     dans les onze modules voisins : `getAll` et non `get`, et un
 *     dédoublonnage qui n'est pas décoratif — un navigateur n'envoie jamais deux
 *     fois la même case, mais une soumission forgée le peut, et l'unicité de
 *     `use_case_personas` rendrait alors une erreur PostgreSQL, donc un 500 ;
 *   — la **forme** des identifiants reçus, vérifiée avant la base, pour la
 *     raison que tout le dépôt tient : une colonne `uuid` interrogée avec
 *     n'importe quoi rend un 500 là où l'on attend un message de champ.
 *
 * Ce qui n'est pas testé ici, et ne doit pas l'être : l'existence du produit
 * dans le domaine, le droit d'y écrire, l'appartenance du use case au produit,
 * et **l'appartenance des personae reçus à ce produit**. Cette dernière est la
 * porte centrale du groupe d'actions, et c'est là qu'elle s'éprouve — un module
 * pur ne connaît pas les personae d'un produit.
 */

import { describe, expect, test } from "vitest";

import {
  EMPTY_USE_CASE_VALUES,
  parseUseCaseForm,
  readUseCaseForm,
  toUseCaseFormValues,
  validateUseCaseForm,
  type UseCaseFormValues,
} from "./use-case";

const ALICE = "0f9c4c8e-3b1a-4f2d-9c7e-1a2b3c4d5e6f";
const BRUNO = "9a8b7c6d-5e4f-4a3b-8c9d-0e1f2a3b4c5d";

/** Une saisie complète et valide, dont chaque test ne change que ce qu'il éprouve. */
function values(overrides: Partial<UseCaseFormValues> = {}): UseCaseFormValues {
  return {
    title: "Démarrer, reprendre un projet",
    summary:
      "Créer ou retrouver un environnement de travail prêt à l'emploi, afin de commencer l'analyse rapidement.",
    personaIds: [ALICE],
    ...overrides,
  };
}

/** Un `FormData` tel que le panneau le poste : une entrée par case cochée. */
function form(
  fields: Record<string, string | string[]>,
): FormData {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      for (const entry of value) formData.append(name, entry);
    } else {
      formData.set(name, value);
    }
  }
  return formData;
}

describe("readUseCaseForm", () => {
  test("lit les trois champs, et rogne les blancs", () => {
    const read = readUseCaseForm(
      form({
        title: "  Gérer les droits d'accès  ",
        summary: "  Donner et configurer les accès.  ",
        personaIds: [ALICE, BRUNO],
      }),
    );

    expect(read.title).toBe("Gérer les droits d'accès");
    expect(read.summary).toBe("Donner et configurer les accès.");
    expect(read.personaIds).toEqual([ALICE, BRUNO]);
  });

  test("un champ absent vaut vide, jamais `undefined`", () => {
    expect(readUseCaseForm(new FormData())).toEqual(EMPTY_USE_CASE_VALUES);
  });

  test("aucune case cochée rend une liste vide, qui est un état valide", () => {
    const read = readUseCaseForm(form({ title: "T", summary: "S" }));
    expect(read.personaIds).toEqual([]);
    expect(validateUseCaseForm(read)).toEqual({});
  });

  /* Le cas que `get` aurait manqué : un groupe de cases poste **une entrée par
     case**, sous le même nom. Sans `getAll`, seule la première serait lue. */
  test("lit toutes les cases cochées, pas seulement la première", () => {
    expect(
      readUseCaseForm(form({ personaIds: [ALICE, BRUNO] })).personaIds,
    ).toHaveLength(2);
  });

  test("dédoublonne les identifiants, en gardant l'ordre reçu", () => {
    expect(
      readUseCaseForm(form({ personaIds: [BRUNO, ALICE, BRUNO] })).personaIds,
    ).toEqual([BRUNO, ALICE]);
  });

  test("écarte les entrées vides d'un groupe de cases", () => {
    expect(
      readUseCaseForm(form({ personaIds: [ALICE, "   ", ""] })).personaIds,
    ).toEqual([ALICE]);
  });

  /* L'action ne construit jamais sa ligne par étalement du `FormData` : un
     champ caché ajouté par n'importe qui deviendrait une colonne écrite. */
  test("ignore un champ que le formulaire ne déclare pas", () => {
    const read = readUseCaseForm(
      form({ title: "T", summary: "S", productId: "autre-produit" }),
    );
    expect(read).toEqual({ title: "T", summary: "S", personaIds: [] });
  });
});

describe("validateUseCaseForm", () => {
  test("une saisie complète ne porte aucune erreur", () => {
    expect(validateUseCaseForm(values())).toEqual({});
  });

  test("le titre est obligatoire", () => {
    expect(validateUseCaseForm(values({ title: "" })).title).toBeDefined();
  });

  /* Ce qui distingue un use case d'un persona : sa description est un minimum,
     pas un complément. */
  test("la description est obligatoire", () => {
    expect(validateUseCaseForm(values({ summary: "" })).summary).toBeDefined();
  });

  test("le rattachement, lui, est facultatif", () => {
    expect(validateUseCaseForm(values({ personaIds: [] }))).toEqual({});
  });

  test("un identifiant qui n'en est pas un est refusé avant la base", () => {
    expect(
      validateUseCaseForm(values({ personaIds: ["pas-un-identifiant"] }))
        .personaIds,
    ).toBeDefined();
  });

  test("un seul identifiant fautif parmi plusieurs suffit à refuser", () => {
    expect(
      validateUseCaseForm(values({ personaIds: [ALICE, "1; drop table"] }))
        .personaIds,
    ).toBeDefined();
  });
});

describe("toUseCaseFormValues", () => {
  test("ramène la ligne et ses rattachements aux trois champs du formulaire", () => {
    expect(
      toUseCaseFormValues(
        { title: "Démarrer", summary: "Retrouver son environnement." },
        [ALICE, BRUNO],
      ),
    ).toEqual({
      title: "Démarrer",
      summary: "Retrouver son environnement.",
      personaIds: [ALICE, BRUNO],
    });
  });

  test("un use case sans rattachement rend une liste vide", () => {
    expect(
      toUseCaseFormValues({ title: "T", summary: "S" }, []).personaIds,
    ).toEqual([]);
  });
});

describe("parseUseCaseForm", () => {
  /* La propriété posée en T2.5 : `input` est non nul **si et seulement si**
     `errors` est vide. C'est ce qui évite d'affirmer par un `as` un type que la
     validation venait de prouver. */
  test("rend les lignes prêtes à écrire quand la saisie est valide", () => {
    const parsed = parseUseCaseForm(
      form({
        title: "Démarrer, reprendre un projet",
        summary: "Retrouver un environnement prêt à l'emploi.",
        personaIds: [ALICE, BRUNO],
      }),
    );

    expect(parsed.errors).toEqual({});
    expect(parsed.input).not.toBeNull();
    expect(parsed.input?.useCase).toEqual({
      title: "Démarrer, reprendre un projet",
      summary: "Retrouver un environnement prêt à l'emploi.",
    });
    expect(parsed.input?.personaIds).toEqual([ALICE, BRUNO]);
  });

  test("ne rend aucune ligne dès qu'une erreur est posée", () => {
    const parsed = parseUseCaseForm(form({ title: "", summary: "S" }));
    expect(parsed.input).toBeNull();
    expect(parsed.errors.title).toBeDefined();
  });

  test("rend la saisie telle qu'elle a été tapée, même refusée", () => {
    const parsed = parseUseCaseForm(
      form({ title: "  Démarrer  ", summary: "" }),
    );
    expect(parsed.values.title).toBe("Démarrer");
    expect(parsed.input).toBeNull();
  });
});
