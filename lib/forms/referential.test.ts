/**
 * Les tests de la saisie d'une **ligne de référentiel** (T7.3).
 *
 * Aucune base : ce module ne valide qu'une forme, et c'est ce qui le rend
 * énonçable seul. Ce qui demande la base — l'unicité du libellé dans le
 * domaine — vit dans l'action et s'éprouve dans
 * `app/(app)/administration/actions.test.ts`.
 *
 * **Les deux bornes sont le sujet**, et elles ne sont pas de l'ergonomie : sans
 * elles, `numeric(10, 2)` et `smallint` rendraient un 500 là où l'on attend un
 * refus en français. Un test qui ne les visait pas ne prouverait rien de ce
 * fichier.
 */

import { describe, expect, test } from "vitest";

import {
  EMPTY_REFERENTIAL_VALUES,
  ORDERED_BY_POSITION,
  ORDERED_BY_RANK,
  parseReferentialForm,
  readReferentialForm,
  sameReferentialLabel,
  toReferentialFormValues,
  validateReferentialForm,
} from "./referential";

/** Une soumission, telle que le navigateur la fait. */
function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.append(name, value);
  return data;
}

describe("readReferentialForm — ce que le formulaire laisse entrer", () => {
  test("les trois champs, rognés", () => {
    expect(
      readReferentialForm(
        form({ label: "  UX Research  ", position: " 30 ", rank: " 2 " }),
      ),
    ).toEqual({ label: "UX Research", position: "30", rank: "2" });
  });

  test("un champ absent vaut vide, jamais `undefined`", () => {
    expect(readReferentialForm(form({}))).toEqual({
      label: "",
      position: "",
      rank: "",
    });
  });

  test("un champ hors de la liste n'entre pas", () => {
    /* La garde qui compte : l'action ne construit jamais sa ligne par étalement
       d'un `FormData`, et `archived_at` est la colonne qu'un champ caché
       atteindrait. */
    const values = readReferentialForm(
      form({ label: "Métier", archivedAt: "2020-01-01", domainId: "forgé" }),
    );
    expect(Object.keys(values).sort()).toEqual(["label", "position", "rank"]);
  });
});

describe("validateReferentialForm — le libellé", () => {
  test("il est obligatoire", () => {
    const errors = validateReferentialForm(
      { label: "", position: "0", rank: "" },
      ORDERED_BY_POSITION,
    );
    expect(errors.label).toBe("Le libellé est obligatoire.");
  });

  test("aucune longueur maximale n'est inventée", () => {
    const errors = validateReferentialForm(
      { label: "x".repeat(5_000), position: "0", rank: "" },
      ORDERED_BY_POSITION,
    );
    expect(errors.label).toBeUndefined();
  });
});

describe("validateReferentialForm — l'ordre", () => {
  const shape = ORDERED_BY_POSITION;

  test("un entier passe", () => {
    expect(
      validateReferentialForm(
        { label: "Métier", position: "30", rank: "" },
        shape,
      ).position,
    ).toBeUndefined();
  });

  test("deux décimales passent, au point comme à la virgule", () => {
    for (const position of ["12.50", "12,50"]) {
      expect(
        validateReferentialForm({ label: "Métier", position, rank: "" }, shape)
          .position,
      ).toBeUndefined();
    }
  });

  test("trois décimales sont refusées : la colonne n'en garde que deux", () => {
    expect(
      validateReferentialForm(
        { label: "Métier", position: "12.501", rank: "" },
        shape,
      ).position,
    ).toBeDefined();
  });

  test("un texte est refusé", () => {
    expect(
      validateReferentialForm(
        { label: "Métier", position: "premier", rank: "" },
        shape,
      ).position,
    ).toBeDefined();
  });

  test("un nombre négatif est refusé", () => {
    expect(
      validateReferentialForm(
        { label: "Métier", position: "-1", rank: "" },
        shape,
      ).position,
    ).toBeDefined();
  });

  test("la borne de `numeric(10, 2)` est refusée ici, pas par la base", () => {
    /* Sans ce refus, PostgreSQL rend `numeric field overflow` — donc un 500,
       là où l'écran attend une phrase dans le champ. */
    expect(
      validateReferentialForm(
        { label: "Métier", position: "100000000", rank: "" },
        shape,
      ).position,
    ).toBe("La position ne peut pas dépasser 99 999 999,99.");

    expect(
      validateReferentialForm(
        { label: "Métier", position: "99999999.99", rank: "" },
        shape,
      ).position,
    ).toBeUndefined();
  });

  test("elle est obligatoire là où elle se saisit", () => {
    expect(
      validateReferentialForm(
        { label: "Métier", position: "", rank: "" },
        shape,
      ).position,
    ).toBe("La position est obligatoire.");
  });

  test("elle n'est jamais reprochée à l'échelle de maîtrise", () => {
    /* L'échelle ne la saisit pas : `rank` l'ordonne, et
       `skill_levels.position` n'a aucun lecteur. */
    expect(
      validateReferentialForm(
        { label: "Avancé", position: "", rank: "3" },
        ORDERED_BY_RANK,
      ).position,
    ).toBeUndefined();
  });
});

describe("validateReferentialForm — le rang", () => {
  const shape = ORDERED_BY_RANK;

  test("un entier positif passe", () => {
    expect(
      validateReferentialForm({ label: "Avancé", position: "", rank: "3" }, shape)
        .rank,
    ).toBeUndefined();
  });

  test("il est obligatoire", () => {
    expect(
      validateReferentialForm({ label: "Avancé", position: "", rank: "" }, shape)
        .rank,
    ).toBe("Le rang est obligatoire.");
  });

  test("un décimal est refusé", () => {
    expect(
      validateReferentialForm(
        { label: "Avancé", position: "", rank: "2.5" },
        shape,
      ).rank,
    ).toBe("Le rang est un nombre entier.");
  });

  test("zéro et la borne du `smallint` sont refusés ici, pas par la base", () => {
    for (const rank of ["0", "32768"]) {
      expect(
        validateReferentialForm({ label: "Avancé", position: "", rank }, shape)
          .rank,
      ).toBe("Le rang est compris entre 1 et 32 767.");
    }
    expect(
      validateReferentialForm(
        { label: "Avancé", position: "", rank: "32767" },
        shape,
      ).rank,
    ).toBeUndefined();
  });

  test("aucune unicité n'est éprouvée ici : le schéma s'en interdit une", () => {
    /* « Une contrainte non demandée contraindrait l'écran de gestion dû à C7 » :
       deux niveaux au même rang se trient ensuite par libellé. */
    const errors = validateReferentialForm(
      { label: "Confirmé", position: "", rank: "3" },
      shape,
    );
    expect(errors).toEqual({});
  });

  test("il n'est jamais reproché aux trois autres référentiels", () => {
    expect(
      validateReferentialForm(
        { label: "Métier", position: "10", rank: "" },
        ORDERED_BY_POSITION,
      ).rank,
    ).toBeUndefined();
  });
});

describe("parseReferentialForm — de la saisie à la ligne", () => {
  test("`input` est non nul si et seulement si `errors` est vide", () => {
    const refused = parseReferentialForm(
      form({ label: "", position: "0" }),
      ORDERED_BY_POSITION,
    );
    expect(refused.input).toBeNull();
    expect(Object.keys(refused.errors).length).toBeGreaterThan(0);

    const accepted = parseReferentialForm(
      form({ label: "UX Research", position: "30" }),
      ORDERED_BY_POSITION,
    );
    expect(accepted.input).not.toBeNull();
    expect(accepted.errors).toEqual({});
  });

  test("la virgule française est rendue à PostgreSQL en point", () => {
    const parsed = parseReferentialForm(
      form({ label: "UX Research", position: "12,5" }),
      ORDERED_BY_POSITION,
    );
    expect(parsed.input?.position).toBe("12.5");
  });

  test("la ligne ne porte que ce que son référentiel saisit", () => {
    const withPosition = parseReferentialForm(
      form({ label: "UX Research", position: "30", rank: "9" }),
      ORDERED_BY_POSITION,
    );
    /* `rank` a beau être posté, il n'entre pas : une colonne qu'on n'écrit pas
       garde sa valeur, et `jobs` n'en a pas. */
    expect(withPosition.input).toEqual({ label: "UX Research", position: "30" });

    const withRank = parseReferentialForm(
      form({ label: "Avancé", position: "77", rank: "3" }),
      ORDERED_BY_RANK,
    );
    expect(withRank.input).toEqual({ label: "Avancé", rank: 3 });
  });

  test("la saisie revient toujours, y compris refusée", () => {
    const parsed = parseReferentialForm(
      form({ label: "  ", position: "premier" }),
      ORDERED_BY_POSITION,
    );
    expect(parsed.values).toEqual({
      label: "",
      position: "premier",
      rank: "",
    });
  });
});

describe("toReferentialFormValues — le pré-remplissage", () => {
  test("la position revient telle que la base l'écrit", () => {
    expect(
      toReferentialFormValues({ label: "UX Research", position: "30.00" }),
    ).toEqual({ label: "UX Research", position: "30.00", rank: "" });
  });

  test("le rang revient en chaîne, et le nul en vide", () => {
    expect(
      toReferentialFormValues({ label: "Avancé", position: null, rank: 3 }),
    ).toEqual({ label: "Avancé", position: "", rank: "3" });
  });

  test("les valeurs vides sont celles d'un panneau de création", () => {
    expect(EMPTY_REFERENTIAL_VALUES).toEqual({
      label: "",
      position: "0",
      rank: "",
    });
  });
});

describe("sameReferentialLabel — ce qui fait un doublon", () => {
  test("la casse ne distingue pas", () => {
    expect(sameReferentialLabel("UX Design", "ux design")).toBe(true);
  });

  test("l'accent ne distingue pas", () => {
    /* Le cas que `toLowerCase()` aurait laissé passer. */
    expect(sameReferentialLabel("Accessibilité", "Accessibilite")).toBe(true);
  });

  test("les espaces de bord ne distinguent pas", () => {
    expect(sameReferentialLabel("  Lean ", "Lean")).toBe(true);
  });

  test("deux libellés différents restent différents", () => {
    expect(sameReferentialLabel("UX Design", "UI Design")).toBe(false);
  });
});
