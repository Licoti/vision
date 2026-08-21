/**
 * Les tests de la saisie d'une entité.
 *
 * **Aucune base**, comme pour les quatorze autres modules de `lib/forms/` : la
 * validation est isolée dans un module pur, et ces tests énoncent la règle
 * plutôt que de l'observer.
 *
 * Ce qui n'est pas testé ici, et ne doit pas l'être : le droit d'écrire une
 * entité, l'appartenance au domaine et l'unicité du libellé **en base**. Les
 * trois sont tranchés par l'action, sur l'identifiant reçu, et
 * `app/(app)/administration/actions.test.ts` les couvre. Ce module ne connaît
 * que du texte.
 */

import { describe, expect, test } from "vitest";

import {
  EMPTY_ENTITY_VALUES,
  parseEntityForm,
  readEntityForm,
  sameEntityLabel,
  toEntityFormValues,
  validateEntityForm,
} from "./entity";

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.append(key, value);
  return data;
}

describe("readEntityForm", () => {
  test("lit le seul champ du formulaire", () => {
    expect(readEntityForm(form({ label: "Banque de détail" }))).toEqual({
      label: "Banque de détail",
    });
  });

  test("rogne les espaces de bord", () => {
    expect(readEntityForm(form({ label: "  Assurance  " }))).toEqual({
      label: "Assurance",
    });
  });

  test("une chaîne d'espaces vaut « vide »", () => {
    expect(readEntityForm(form({ label: "   " }))).toEqual({ label: "" });
  });

  test("un champ absent vaut « vide », et non `undefined`", () => {
    expect(readEntityForm(form({}))).toEqual(EMPTY_ENTITY_VALUES);
  });

  test("un champ qui n'est pas une chaîne vaut « vide »", () => {
    const data = new FormData();
    data.append("label", new Blob(["Assurance"]), "entite.txt");

    expect(readEntityForm(data)).toEqual({ label: "" });
  });

  test("ne lit aucun autre champ, fût-il posté", () => {
    /* `position` est une colonne de la table, et un champ caché la porterait
       jusqu'à l'écriture si le formulaire se lisait par étalement. */
    const values = readEntityForm(
      form({ label: "Corporate", position: "42", domainId: "forgé" }),
    );

    expect(values).toEqual({ label: "Corporate" });
    expect(Object.keys(values)).toEqual(["label"]);
  });
});

describe("toEntityFormValues", () => {
  test("ramène la ligne au seul champ du formulaire", () => {
    expect(toEntityFormValues({ label: "Digital Factory" })).toEqual({
      label: "Digital Factory",
    });
  });
});

describe("validateEntityForm", () => {
  test("un libellé renseigné ne rend aucune erreur", () => {
    expect(validateEntityForm({ label: "RH & Interne" })).toEqual({});
  });

  test("le libellé est obligatoire", () => {
    expect(validateEntityForm({ label: "" })).toEqual({
      label: "Le nom de l'entité est obligatoire.",
    });
  });

  test("aucune longueur maximale n'est imposée", () => {
    expect(validateEntityForm({ label: "A".repeat(500) })).toEqual({});
  });
});

describe("parseEntityForm", () => {
  test("rend la ligne prête à écrire quand la saisie tient", () => {
    const parsed = parseEntityForm(form({ label: "  Assurance  " }));

    expect(parsed.errors).toEqual({});
    expect(parsed.input).toEqual({ label: "Assurance" });
    expect(parsed.values).toEqual({ label: "Assurance" });
  });

  test("`input` est nul dès qu'une erreur est posée", () => {
    const parsed = parseEntityForm(form({ label: "  " }));

    expect(parsed.input).toBeNull();
    expect(parsed.errors.label).toBe("Le nom de l'entité est obligatoire.");
    /* La saisie revient telle quelle : Vision ne jette jamais en silence ce qui
       a été tapé. */
    expect(parsed.values).toEqual({ label: "" });
  });

  test("`input` ne porte que `label` — jamais une colonne de plus", () => {
    const parsed = parseEntityForm(form({ label: "Corporate", position: "9" }));

    expect(parsed.input).not.toBeNull();
    expect(Object.keys(parsed.input ?? {})).toEqual(["label"]);
  });
});

describe("sameEntityLabel", () => {
  test("deux libellés identiques se confondent", () => {
    expect(sameEntityLabel("Assurance", "Assurance")).toBe(true);
  });

  test("la casse ne distingue pas", () => {
    expect(sameEntityLabel("Assurance", "assurance")).toBe(true);
  });

  test("les espaces de bord ne distinguent pas", () => {
    expect(sameEntityLabel("  Assurance ", "Assurance")).toBe(true);
  });

  test("l'accent ne distingue pas", () => {
    /* Le cas suivant du point ouvert d'`ETAT.md` : « Banque de détail » saisie
       « Banque de detail » créerait une seconde ligne pour la même division. */
    expect(sameEntityLabel("Banque de détail", "Banque de detail")).toBe(true);
  });

  test("deux libellés différents ne se confondent pas", () => {
    expect(sameEntityLabel("Assurance", "Assurances")).toBe(false);
    expect(sameEntityLabel("Corporate", "Digital Factory")).toBe(false);
  });
});
