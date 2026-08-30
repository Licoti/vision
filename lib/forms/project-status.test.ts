/**
 * Les tests de la saisie d'un **statut de projet** (T7.4).
 *
 * Aucune base : ce module ne valide qu'une forme. Ce qui demande la base —
 * l'unicité du libellé, ce qui s'oppose au rangement — vit dans l'action et
 * s'éprouve dans `app/(app)/administration/actions.test.ts`.
 *
 * **Le sujet est la `nature`**, et c'est la mise en défaut que la fiche de T7.4
 * réclame : *retirer la contrainte d'énuméré doit faire tomber un test ; si rien
 * ne tombe, c'est que la nature n'était pas éprouvée*. Les cas ci-dessous la
 * visent par des valeurs forgées — dont **`archived`**, que D42 a retirée du
 * référentiel et qu'un `<select>` réécrit pourrait reposter.
 */

import { describe, expect, test } from "vitest";

import {
  EMPTY_PROJECT_STATUS_VALUES,
  isProjectStatusNature,
  parseProjectStatusForm,
  PROJECT_STATUS_NATURES,
  readProjectStatusForm,
  toProjectStatusFormValues,
  validateProjectStatusForm,
} from "./project-status";

/** Une soumission, telle que le navigateur la fait. */
function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.append(name, value);
  return data;
}

const VALID = { label: "En cours", position: "20", nature: "active" };

describe("readProjectStatusForm — ce que le formulaire laisse entrer", () => {
  test("les trois champs, rognés", () => {
    expect(
      readProjectStatusForm(
        form({ label: "  En cours  ", position: " 20 ", nature: " active " }),
      ),
    ).toEqual({ label: "En cours", position: "20", nature: "active" });
  });

  test("un champ absent vaut « vide », il ne fait pas tomber la lecture", () => {
    expect(readProjectStatusForm(form({}))).toEqual({
      label: "",
      position: "",
      nature: "",
    });
  });

  test("un quatrième champ n'entre pas", () => {
    /* `archived_at` est précisément la colonne qu'un champ caché atteindrait :
       la lecture nomme ses trois champs, et rien d'autre ne passe. */
    const read = readProjectStatusForm(
      form({ ...VALID, archivedAt: "2020-01-01" }),
    );
    expect(Object.keys(read).sort()).toEqual(["label", "nature", "position"]);
  });
});

describe("la nature — rétrécie sur l'énuméré, et nulle part ailleurs", () => {
  test("les quatre valeurs du schéma passent", () => {
    expect([...PROJECT_STATUS_NATURES]).toEqual([
      "framing",
      "active",
      "paused",
      "done",
    ]);
    for (const nature of PROJECT_STATUS_NATURES) {
      expect(isProjectStatusNature(nature)).toBe(true);
    }
  });

  test("**D42 — `archived` n'est pas une nature**, et le refus le tient", () => {
    expect(isProjectStatusNature("archived")).toBe(false);

    const { errors, input } = parseProjectStatusForm(
      form({ ...VALID, nature: "archived" }),
    );
    expect(errors.nature).toBe("Cette nature de statut n'existe pas.");
    expect(input).toBeNull();
  });

  test("une valeur fantaisiste est refusée sur le champ, jamais écrite", () => {
    const { errors, input } = parseProjectStatusForm(
      form({ ...VALID, nature: "banane" }),
    );
    expect(errors.nature).toBe("Cette nature de statut n'existe pas.");
    expect(input).toBeNull();
  });

  test("une nature vide est refusée comme une nature inconnue", () => {
    expect(validateProjectStatusForm({ ...VALID, nature: "" }).nature).toBe(
      "Cette nature de statut n'existe pas.",
    );
  });
});

describe("le libellé et l'ordre", () => {
  test("un libellé vide est refusé", () => {
    expect(validateProjectStatusForm({ ...VALID, label: "" }).label).toBe(
      "Le libellé est obligatoire.",
    );
  });

  test("la position garde la règle du socle, bornes comprises", () => {
    expect(
      validateProjectStatusForm({ ...VALID, position: "" }).position,
    ).toBe("La position est obligatoire.");
    expect(
      validateProjectStatusForm({ ...VALID, position: "trois" }).position,
    ).toBe("La position est un nombre positif, avec deux décimales au plus.");
    expect(
      validateProjectStatusForm({ ...VALID, position: "100000000" }).position,
    ).toBe("La position ne peut pas dépasser 99 999 999,99.");
  });

  test("la virgule française est rendue à PostgreSQL en point", () => {
    const { input } = parseProjectStatusForm(
      form({ ...VALID, position: "12,5" }),
    );
    expect(input?.position).toBe("12.5");
  });
});

describe("parseProjectStatusForm — la ligne prête à écrire", () => {
  test("une saisie valide rend ses trois colonnes, et pas une de plus", () => {
    const { errors, input } = parseProjectStatusForm(form(VALID));
    expect(errors).toEqual({});
    expect(input).toEqual({
      label: "En cours",
      position: "20",
      nature: "active",
    });
  });

  test("`input` est nul si et seulement si `errors` ne l'est pas", () => {
    const refused = parseProjectStatusForm(form({ ...VALID, label: "" }));
    expect(refused.input).toBeNull();
    expect(Object.keys(refused.errors)).not.toHaveLength(0);
  });

  test("la saisie revient telle quelle quand elle est refusée", () => {
    const { values } = parseProjectStatusForm(
      form({ label: "Brouillon", position: "abc", nature: "active" }),
    );
    expect(values.label).toBe("Brouillon");
    expect(values.position).toBe("abc");
  });
});

describe("le pré-remplissage", () => {
  test("la position revient de la base telle quelle, sans reformatage", () => {
    expect(
      toProjectStatusFormValues({
        label: "En pause",
        position: "30.00",
        nature: "paused",
      }),
    ).toEqual({ label: "En pause", position: "30.00", nature: "paused" });
  });

  test("le panneau vide ouvre sur la première nature de l'énuméré", () => {
    expect(EMPTY_PROJECT_STATUS_VALUES.nature).toBe("framing");
    expect(isProjectStatusNature(EMPTY_PROJECT_STATUS_VALUES.nature)).toBe(true);
  });
});
