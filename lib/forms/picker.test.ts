/**
 * Les tests du rapprochement d'une saisie et d'une liste d'options.
 *
 * **Aucune base**, comme pour les dix-huit autres modules de `lib/forms/` : la
 * règle est isolée dans un module pur, et ces tests l'énoncent plutôt que de
 * l'observer à l'écran.
 *
 * Ce qui n'est pas testé ici, et ne peut pas l'être : le clavier, l'ouverture
 * de la liste, le repli sans JavaScript. Ils vivent dans `components/ui/` et le
 * dépôt n'a aucun outil pour éprouver un composant client — ils se mesurent au
 * navigateur et dans le HTML servi, pas ici.
 */

import { describe, expect, test } from "vitest";

import {
  matchOptions,
  normalizeQuery,
  PICKER_LIMIT,
  type PickerOption,
} from "./picker";

const PEOPLE: readonly PickerOption[] = [
  { id: "1", label: "Camille Roux", hint: "Product Design" },
  { id: "2", label: "Léa Martin", hint: "UI Design" },
  { id: "3", label: "Marc Dubois", hint: "UX Research" },
  { id: "4", label: "Théo Benoît", hint: "UX Research" },
  { id: "5", label: "Inès Da Silva" },
  /* Sans diacritique, et c'est le seul moyen d'éprouver la normalisation **de
     la saisie** : une option accentuée cherchée avec son accent passerait la
     mise en minuscules seule, et le test ne prouverait rien. */
  { id: "6", label: "Chloe Petit", hint: "Design Thinking" },
];

const NONE: ReadonlySet<string> = new Set();

/** Les identifiants retenus, dans l'ordre où le composant les afficherait. */
function ids(options: readonly PickerOption[]): string[] {
  return options.map((option) => option.id);
}

describe("normalizeQuery", () => {
  test("passe en minuscules", () => {
    expect(normalizeQuery("MARTIN")).toBe("martin");
  });

  test("retire les diacritiques", () => {
    expect(normalizeQuery("Léa Benoît")).toBe("lea benoit");
  });

  test("rogne les espaces de bord", () => {
    expect(normalizeQuery("  marc  ")).toBe("marc");
  });

  test("laisse les espaces intérieurs", () => {
    expect(normalizeQuery("Da Silva")).toBe("da silva");
  });
});

describe("matchOptions", () => {
  test("une saisie vide ne propose rien", () => {
    expect(matchOptions(PEOPLE, "", NONE)).toEqual({ shown: [], total: 0 });
  });

  test("une saisie d'espaces seuls ne propose rien", () => {
    expect(matchOptions(PEOPLE, "   ", NONE)).toEqual({ shown: [], total: 0 });
  });

  test("rapproche par le début du nom", () => {
    expect(ids(matchOptions(PEOPLE, "Marc", NONE).shown)).toEqual(["3"]);
  });

  test("rapproche par le milieu du nom", () => {
    expect(ids(matchOptions(PEOPLE, "rtin", NONE).shown)).toEqual(["2"]);
  });

  test("ignore la casse", () => {
    expect(ids(matchOptions(PEOPLE, "cAMiLLe", NONE).shown)).toEqual(["1"]);
  });

  test("ignore les diacritiques de la liste", () => {
    expect(ids(matchOptions(PEOPLE, "lea", NONE).shown)).toEqual(["2"]);
  });

  test("ignore les diacritiques des deux côtés à la fois", () => {
    expect(ids(matchOptions(PEOPLE, "benoit", NONE).shown)).toEqual(["4"]);
  });

  test("ignore les diacritiques de la saisie", () => {
    expect(ids(matchOptions(PEOPLE, "Chloé", NONE).shown)).toEqual(["6"]);
  });

  test("rapproche aussi par l'indice", () => {
    expect(ids(matchOptions(PEOPLE, "UX Research", NONE).shown)).toEqual([
      "3",
      "4",
    ]);
  });

  test("une option sans indice reste trouvable par son seul nom", () => {
    expect(ids(matchOptions(PEOPLE, "Silva", NONE).shown)).toEqual(["5"]);
  });

  test("écarte ce qui est déjà retenu", () => {
    const chosen = new Set(["3"]);
    expect(ids(matchOptions(PEOPLE, "UX Research", chosen).shown)).toEqual([
      "4",
    ]);
  });

  test("ne rapproche rien qui ne corresponde", () => {
    expect(matchOptions(PEOPLE, "zzz", NONE)).toEqual({ shown: [], total: 0 });
  });

  test("conserve l'ordre reçu, sans classer", () => {
    expect(ids(matchOptions(PEOPLE, "a", NONE).shown)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
    ]);
  });

  test("plafonne l'affichage et dit le compte entier", () => {
    const many: PickerOption[] = Array.from({ length: 12 }, (_, index) => ({
      id: String(index),
      label: `Personne ${index}`,
    }));
    const matches = matchOptions(many, "Personne", NONE, 5);
    expect(matches.shown).toHaveLength(5);
    expect(matches.total).toBe(12);
  });

  test("le plafond par défaut est celui du composant", () => {
    const many: PickerOption[] = Array.from({ length: 20 }, (_, index) => ({
      id: String(index),
      label: `Personne ${index}`,
    }));
    const matches = matchOptions(many, "Personne", NONE);
    expect(matches.shown).toHaveLength(PICKER_LIMIT);
    expect(matches.total).toBe(20);
  });

  test("le compte entier ne compte pas les retenues", () => {
    const chosen = new Set(["3", "4"]);
    expect(matchOptions(PEOPLE, "UX Research", chosen).total).toBe(0);
  });
});
