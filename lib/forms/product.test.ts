/**
 * Les tests de la saisie d'un produit.
 *
 * **Aucune base.** C'est la contrepartie d'avoir isolé la validation dans un
 * module pur : ces tests tournent sans branche Neon, sans amorçage et sans
 * fixture, et ils énoncent la règle plutôt que de l'observer.
 *
 * Ce qui n'est pas testé ici, et ne doit pas l'être : l'existence de l'entité
 * dans le domaine. Elle est tranchée par `lib/db/scoped.ts` à l'écriture, et
 * ses propres tests la couvrent depuis T1.3.
 */

import { describe, expect, test } from "vitest";

import {
  EMPTY_PRODUCT_VALUES,
  descriptionOrNull,
  isProductKind,
  parseProductForm,
  readProductForm,
  validateProductForm,
  type ProductFormValues,
} from "./product";

const ENTITY = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";

/** Des valeurs valides, dont chaque test ne dérange qu'un champ. */
function valid(overrides: Partial<ProductFormValues> = {}): ProductFormValues {
  return {
    name: "Espace client web",
    entityId: ENTITY,
    kind: "product",
    description: "Le portail des clients particuliers.",
    ...overrides,
  };
}

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.append(key, value);
  return data;
}

describe("readProductForm", () => {
  test("lit les quatre champs du ticket", () => {
    const values = readProductForm(
      form({
        name: "Espace client web",
        entityId: ENTITY,
        kind: "internal",
        description: "Le portail.",
      }),
    );

    expect(values).toEqual({
      name: "Espace client web",
      entityId: ENTITY,
      kind: "internal",
      description: "Le portail.",
    });
  });

  test("rogne les espaces de chaque champ", () => {
    const values = readProductForm(
      form({ name: "  Espace client  ", description: "  Le portail.  " }),
    );

    expect(values.name).toBe("Espace client");
    expect(values.description).toBe("Le portail.");
  });

  test("un champ absent vaut vide, et le type retombe sur `product`", () => {
    expect(readProductForm(new FormData())).toEqual(EMPTY_PRODUCT_VALUES);
  });

  test("ne lit rien d'autre que les quatre champs", () => {
    // Un champ caché ajouté par n'importe qui ne doit pas devenir une colonne.
    const values = readProductForm(
      form({ name: "Produit", domainId: "un-autre-domaine", id: "forcé" }),
    );

    expect(Object.keys(values).sort()).toEqual([
      "description",
      "entityId",
      "kind",
      "name",
    ]);
  });
});

describe("validateProductForm", () => {
  test("accepte une saisie complète", () => {
    expect(validateProductForm(valid())).toEqual({});
  });

  test("accepte une description vide : elle est facultative", () => {
    expect(validateProductForm(valid({ description: "" }))).toEqual({});
  });

  test("refuse un nom vide", () => {
    expect(validateProductForm(valid({ name: "" })).name).toBeDefined();
  });

  test("refuse un nom qui n'est que des espaces", () => {
    // `readProductForm` rogne : « ␣␣␣ » arrive ici en chaîne vide.
    const values = readProductForm(form({ name: "   ", entityId: ENTITY }));
    expect(validateProductForm(values).name).toBeDefined();
  });

  test("refuse une entité absente", () => {
    expect(validateProductForm(valid({ entityId: "" })).entityId).toBeDefined();
  });

  test("refuse une entité qui n'a pas la forme d'un identifiant", () => {
    expect(
      validateProductForm(valid({ entityId: "n-importe-quoi" })).entityId,
    ).toBeDefined();
  });

  test("refuse un type hors de l'énuméré", () => {
    expect(validateProductForm(valid({ kind: "service" })).kind).toBeDefined();
  });

  test("accepte les deux types du schéma, et eux seuls", () => {
    expect(validateProductForm(valid({ kind: "product" }))).toEqual({});
    expect(validateProductForm(valid({ kind: "internal" }))).toEqual({});
  });

  test("signale chaque champ fautif séparément", () => {
    const errors = validateProductForm({
      name: "",
      entityId: "",
      kind: "service",
      description: "",
    });

    expect(Object.keys(errors).sort()).toEqual(["entityId", "kind", "name"]);
  });
});

describe("isProductKind", () => {
  test("suit l'énuméré du schéma", () => {
    expect(isProductKind("product")).toBe(true);
    expect(isProductKind("internal")).toBe(true);
    expect(isProductKind("Product")).toBe(false);
    expect(isProductKind("")).toBe(false);
  });
});

describe("parseProductForm", () => {
  test("rend la ligne prête à écrire quand la saisie tient", () => {
    const { errors, input } = parseProductForm(
      form({
        name: "Espace client web",
        entityId: ENTITY,
        kind: "internal",
        description: "Le portail.",
      }),
    );

    expect(errors).toEqual({});
    expect(input).toEqual({
      name: "Espace client web",
      entityId: ENTITY,
      kind: "internal",
      description: "Le portail.",
    });
  });

  test("une description vide devient `null` dans la ligne", () => {
    const { input } = parseProductForm(form({ name: "Produit", entityId: ENTITY }));
    expect(input?.description).toBeNull();
  });

  test("`input` est nul dès qu'une erreur est signalée", () => {
    const { errors, input } = parseProductForm(form({ entityId: ENTITY }));

    expect(errors.name).toBeDefined();
    expect(input).toBeNull();
  });

  test("les valeurs saisies survivent au refus", () => {
    // C'est ce qui empêche une description de dix lignes de disparaître au
    // premier nom oublié.
    const { values, input } = parseProductForm(
      form({ name: "", entityId: ENTITY, description: "Le portail." }),
    );

    expect(input).toBeNull();
    expect(values.description).toBe("Le portail.");
    expect(values.entityId).toBe(ENTITY);
  });
});

describe("descriptionOrNull", () => {
  test("une description vide part en base à `null`, jamais en chaîne vide", () => {
    expect(descriptionOrNull("")).toBeNull();
  });

  test("une description saisie part telle quelle", () => {
    expect(descriptionOrNull("Le portail.")).toBe("Le portail.");
  });
});
