/**
 * Les tests de la saisie de la vision produit.
 *
 * **Aucune base**, comme pour les six autres modules de `lib/forms/` : la
 * validation est isolée dans un module pur, et ces tests énoncent la règle
 * plutôt que de l'observer.
 *
 * Ce qui n'est pas testé ici, et ne doit pas l'être : le droit d'écrire la
 * vision. Il est tranché par l'action (`app/(app)/produits/actions.ts`), sur
 * l'identifiant reçu, et ses propres tests le couvrent.
 */

import { describe, expect, test } from "vitest";

import {
  EMPTY_VISION_VALUES,
  parseVisionForm,
  readVisionForm,
  toVisionFormValues,
  validateVisionForm,
  visionOrNull,
} from "./vision";

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.append(key, value);
  return data;
}

describe("readVisionForm", () => {
  test("lit le seul champ du formulaire", () => {
    const values = readVisionForm(
      form({ vision: "Devenir le point d'entrée unique des démarches." }),
    );

    expect(values).toEqual({
      vision: "Devenir le point d'entrée unique des démarches.",
    });
  });

  test("rogne les espaces de bord", () => {
    expect(readVisionForm(form({ vision: "  Une direction.  " }))).toEqual({
      vision: "Une direction.",
    });
  });

  test("une chaîne d'espaces vaut « vide »", () => {
    expect(readVisionForm(form({ vision: "   " }))).toEqual({ vision: "" });
  });

  test("un champ absent vaut « vide », et non `undefined`", () => {
    expect(readVisionForm(form({}))).toEqual(EMPTY_VISION_VALUES);
  });

  test("un champ qui n'est pas une chaîne vaut « vide »", () => {
    const data = new FormData();
    data.append("vision", new Blob(["Une direction."]), "vision.txt");

    expect(readVisionForm(data)).toEqual({ vision: "" });
  });

  test("les champs que ce formulaire ne connaît pas ne ressortent pas", () => {
    const values = readVisionForm(
      form({ vision: "Une direction.", name: "Espace client", id: "42" }),
    );

    expect(values).toEqual({ vision: "Une direction." });
  });
});

describe("validateVisionForm", () => {
  /* Voir l'en-tête du module : l'absence d'erreur est une décision, et un test
     la tient — le jour où une règle apparaît, c'est ce test qui tombe. */
  test("un champ vide n'est pas une erreur : la vision est facultative", () => {
    expect(validateVisionForm({ vision: "" })).toEqual({});
  });

  test("aucune longueur maximale", () => {
    expect(validateVisionForm({ vision: "x".repeat(5_000) })).toEqual({});
  });
});

describe("visionOrNull", () => {
  test("une vision écrite passe telle quelle", () => {
    expect(visionOrNull("Une direction.")).toBe("Une direction.");
  });

  test("un champ vide devient `null`, jamais une chaîne vide", () => {
    expect(visionOrNull("")).toBeNull();
  });
});

describe("toVisionFormValues", () => {
  test("relit la ligne pour la rouvrir en correction", () => {
    expect(toVisionFormValues({ vision: "Une direction." })).toEqual({
      vision: "Une direction.",
    });
  });

  test("une colonne nulle rouvre un champ vide, pas « null »", () => {
    expect(toVisionFormValues({ vision: null })).toEqual(EMPTY_VISION_VALUES);
  });
});

describe("parseVisionForm", () => {
  test("rend la ligne prête à écrire", () => {
    const { values, errors, input } = parseVisionForm(
      form({ vision: "  Une direction.  " }),
    );

    expect(values).toEqual({ vision: "Une direction." });
    expect(errors).toEqual({});
    expect(input).toEqual({ vision: "Une direction." });
  });

  /* Le geste qui **retire** la vision : un champ vidé, et non un bouton à
     part. C'est ce que la note du panneau annonce. */
  test("un champ vidé rend `null` : la vision se retire en la vidant", () => {
    const { errors, input } = parseVisionForm(form({ vision: "   " }));

    expect(errors).toEqual({});
    expect(input).toEqual({ vision: null });
  });

  test("l'aller-retour d'une ligne relue ne change rien", () => {
    const initial = toVisionFormValues({ vision: "Une direction." });
    const { input } = parseVisionForm(form(initial));

    expect(input).toEqual({ vision: "Une direction." });
  });
});
