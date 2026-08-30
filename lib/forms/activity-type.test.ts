/**
 * Les tests de la saisie d'un **type d'activité** (T7.4).
 *
 * Aucune base. **Trois sujets**, et chacun a coûté une décision : la `family`,
 * rétrécie sur l'énuméré ; la **case à cocher**, dont l'absence vaut « faux »
 * parce que le navigateur ne l'envoie pas ; et le `default_tool_id` vide, qui
 * doit sortir **`null`** et non `""` — une chaîne vide dans une colonne `uuid`
 * rend un 500, pas un refus.
 */

import { describe, expect, test } from "vitest";

import {
  ACTIVITY_FAMILIES,
  isActivityFamily,
  parseActivityTypeForm,
  readActivityTypeForm,
  toActivityTypeFormValues,
  validateActivityTypeForm,
} from "./activity-type";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.append(name, value);
  return data;
}

const TOOL = "3f1c2b7e-0a4d-4c9e-8b21-5d6e7f809a12";
const VALID = { label: "Audit", position: "20", family: "evaluation" };
const VALUES = {
  label: "Audit",
  position: "20",
  family: "evaluation",
  producesResult: false,
  defaultToolId: "",
};

describe("la case à cocher — l'absence vaut « faux »", () => {
  test("une case non cochée n'est pas envoyée, et le type ne produit rien", () => {
    /* Le navigateur n'envoie pas une case décochée : la lecture teste donc la
       présence du champ, jamais sa valeur. */
    expect(readActivityTypeForm(form(VALID)).producesResult).toBe(false);
  });

  test("une case cochée arrive sous n'importe quelle valeur", () => {
    expect(
      readActivityTypeForm(form({ ...VALID, producesResult: "on" }))
        .producesResult,
    ).toBe(true);
    expect(
      readActivityTypeForm(form({ ...VALID, producesResult: "true" }))
        .producesResult,
    ).toBe(true);
  });
});

describe("la famille — rétrécie sur l'énuméré", () => {
  test("les six familles de `docs/03` §2 passent, dans l'ordre du schéma", () => {
    expect([...ACTIVITY_FAMILIES]).toEqual([
      "framing",
      "research",
      "design",
      "evaluation",
      "measurement",
      "transfer",
    ]);
    for (const family of ACTIVITY_FAMILIES) {
      expect(isActivityFamily(family)).toBe(true);
    }
  });

  test("une valeur forgée est refusée sur le champ, jamais écrite", () => {
    const { errors, input } = parseActivityTypeForm(
      form({ ...VALID, family: "atelier" }),
    );
    expect(errors.family).toBe("Cette famille d'activité n'existe pas.");
    expect(input).toBeNull();
  });
});

describe("l'outil par défaut — facultatif, et jamais une chaîne vide", () => {
  test("vide, il sort `null` : la colonne est un `uuid` nullable", () => {
    const { errors, input } = parseActivityTypeForm(form(VALID));
    expect(errors).toEqual({});
    expect(input?.defaultToolId).toBeNull();
  });

  test("renseigné, il sort tel quel", () => {
    const { input } = parseActivityTypeForm(
      form({ ...VALID, defaultToolId: TOOL }),
    );
    expect(input?.defaultToolId).toBe(TOOL);
  });

  test("la **forme** est vérifiée avant la base, jamais l'appartenance", () => {
    /* Un identifiant qui n'en est pas un rendrait une erreur PostgreSQL, donc
       un 500. Qu'il appartienne au domaine est la question d'`assertPreconditions`,
       et la reposer ici serait une seconde autorité. */
    const { errors, input } = parseActivityTypeForm(
      form({ ...VALID, defaultToolId: "pas-un-uuid" }),
    );
    expect(errors.defaultToolId).toBe("Cet outil n'est pas reconnu.");
    expect(input).toBeNull();
  });
});

describe("parseActivityTypeForm — la ligne prête à écrire", () => {
  test("une saisie complète rend ses cinq colonnes, et pas une de plus", () => {
    const { input } = parseActivityTypeForm(
      form({ ...VALID, producesResult: "on", defaultToolId: TOOL }),
    );
    expect(input).toEqual({
      label: "Audit",
      position: "20",
      family: "evaluation",
      producesResult: true,
      defaultToolId: TOOL,
    });
  });

  test("un libellé vide est refusé, et la position garde la règle du socle", () => {
    expect(validateActivityTypeForm({ ...VALUES, label: "" }).label).toBe(
      "Le libellé est obligatoire.",
    );
    expect(
      validateActivityTypeForm({ ...VALUES, position: "-3" }).position,
    ).toBe("La position est un nombre positif, avec deux décimales au plus.");
  });

  test("la saisie revient telle quelle quand elle est refusée", () => {
    const { values } = parseActivityTypeForm(
      form({ ...VALID, family: "atelier", producesResult: "on" }),
    );
    expect(values.label).toBe("Audit");
    expect(values.producesResult).toBe(true);
  });
});

describe("le pré-remplissage", () => {
  test("un outil absent revient en chaîne vide, jamais en « null »", () => {
    expect(
      toActivityTypeFormValues({
        label: "Atelier",
        position: "10.00",
        family: "design",
        producesResult: false,
        defaultToolId: null,
      }),
    ).toEqual({
      label: "Atelier",
      position: "10.00",
      family: "design",
      producesResult: false,
      defaultToolId: "",
    });
  });
});
