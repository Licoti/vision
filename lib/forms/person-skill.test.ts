/**
 * Les tests de la saisie d'une compétence portée.
 *
 * **Aucune base**, comme les treize fichiers de tests voisins.
 *
 * Deux blocs portent le poids du fichier :
 *   — l'obligation des **deux** identifiants, les deux colonnes `not null` que
 *     cette liaison écrit, et la vérification de leur **forme** avant la base —
 *     une colonne `uuid` interrogée avec n'importe quoi rend un 500 là où l'on
 *     attend un message de champ ;
 *   — le **verrouillage de la compétence en correction** : `lockedSkillId`
 *     gagne toujours sur ce que le `FormData` porterait. C'est la règle propre à
 *     ce module — une liaison ne se déplace pas d'une compétence à l'autre, et
 *     une soumission forgée ne peut donc pas la déplacer non plus.
 *
 * Ce qui n'est pas testé ici, et ne doit pas l'être : l'existence de la
 * compétence et du niveau dans le domaine, le droit d'écrire, le genre de la
 * personne qui les porte — arbitrage (d), tranché par `openPersonSkill` —, et
 * l'unicité `(person_id, skill_id)`, que l'action pré-contrôle. Un module pur ne
 * connaît pas de domaine.
 */

import { describe, expect, test } from "vitest";

import {
  EMPTY_PERSON_SKILL_VALUES,
  parsePersonSkillForm,
  readPersonSkillForm,
  toPersonSkillFormValues,
  validatePersonSkillForm,
} from "./person-skill";

const SKILL = "0f9c4c8e-3b1a-4f2d-9c7e-1a2b3c4d5e6f";
const OTHER_SKILL = "9a8b7c6d-5e4f-4a3b-8c9d-0e1f2a3b4c5d";
const LEVEL = "1b2c3d4e-5f6a-4b7c-8d9e-0f1a2b3c4d5e";

function form(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    formData.set(name, value);
  }
  return formData;
}

describe("readPersonSkillForm", () => {
  test("lit les deux champs, et rogne les blancs", () => {
    expect(
      readPersonSkillForm(form({ skillId: `  ${SKILL}  `, levelId: `  ${LEVEL}  ` })),
    ).toEqual({ skillId: SKILL, levelId: LEVEL });
  });

  test("un champ absent vaut vide, jamais `undefined`", () => {
    expect(readPersonSkillForm(new FormData())).toEqual(
      EMPTY_PERSON_SKILL_VALUES,
    );
  });

  /* Le panneau ne rend aucun contrôle de compétence en correction, mais une
     soumission forgée en poste ce qu'elle veut : la valeur reçue est ignorée
     plutôt que crue. */
  test("en correction, la compétence verrouillée gagne sur le formulaire", () => {
    expect(
      readPersonSkillForm(
        form({ skillId: OTHER_SKILL, levelId: LEVEL }),
        SKILL,
      ).skillId,
    ).toBe(SKILL);
  });

  test("la compétence verrouillée s'applique même sans champ posté", () => {
    expect(
      readPersonSkillForm(form({ levelId: LEVEL }), SKILL).skillId,
    ).toBe(SKILL);
  });
});

describe("toPersonSkillFormValues", () => {
  test("ramène la liaison aux deux chaînes du formulaire", () => {
    expect(toPersonSkillFormValues({ skillId: SKILL, levelId: LEVEL })).toEqual({
      skillId: SKILL,
      levelId: LEVEL,
    });
  });
});

describe("validatePersonSkillForm", () => {
  test("une saisie complète ne lève rien", () => {
    expect(
      validatePersonSkillForm({ skillId: SKILL, levelId: LEVEL }),
    ).toEqual({});
  });

  test("la compétence est obligatoire", () => {
    expect(
      validatePersonSkillForm({ skillId: "", levelId: LEVEL }).skillId,
    ).toBeDefined();
  });

  test("le niveau est obligatoire", () => {
    expect(
      validatePersonSkillForm({ skillId: SKILL, levelId: "" }).levelId,
    ).toBeDefined();
  });

  test("une compétence qui n'a pas la forme d'un identifiant est refusée", () => {
    expect(
      validatePersonSkillForm({ skillId: "expert", levelId: LEVEL }).skillId,
    ).toBeDefined();
  });

  test("un niveau qui n'a pas la forme d'un identifiant est refusé", () => {
    expect(
      validatePersonSkillForm({ skillId: SKILL, levelId: "3" }).levelId,
    ).toBeDefined();
  });
});

describe("parsePersonSkillForm", () => {
  test("rend la ligne prête à écrire", () => {
    const parsed = parsePersonSkillForm(
      form({ skillId: SKILL, levelId: LEVEL }),
    );

    expect(parsed.errors).toEqual({});
    expect(parsed.input).toEqual({ skillId: SKILL, levelId: LEVEL });
  });

  test("en correction, la ligne porte la compétence verrouillée", () => {
    const parsed = parsePersonSkillForm(
      form({ skillId: OTHER_SKILL, levelId: LEVEL }),
      SKILL,
    );

    expect(parsed.input).toEqual({ skillId: SKILL, levelId: LEVEL });
  });

  test("`input` est nul dès qu'une erreur est levée", () => {
    const parsed = parsePersonSkillForm(form({ skillId: SKILL, levelId: "" }));

    expect(parsed.errors.levelId).toBeDefined();
    expect(parsed.input).toBeNull();
  });

  test("la saisie revient telle quelle quand elle est refusée", () => {
    const parsed = parsePersonSkillForm(form({ skillId: SKILL, levelId: "" }));

    expect(parsed.values.skillId).toBe(SKILL);
  });
});
