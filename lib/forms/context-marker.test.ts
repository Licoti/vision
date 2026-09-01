/**
 * Les tests du formulaire d'un **repère de contexte**.
 *
 * **Aucune base**, comme ceux des deux formulaires du dispositif de mesure :
 * c'est la contrepartie d'avoir isolé la validation dans un module pur. Ils
 * énoncent la règle plutôt que de l'observer sur une fixture.
 *
 * Ce qui n'est **pas** testé ici, et ne doit pas l'être : l'existence du produit
 * dans le domaine, le droit d'y écrire, et surtout l'appartenance de
 * l'accompagnement choisi à **ce** produit. Les trois sont tranchés par
 * l'action, et par `lib/db/scoped.ts` derrière elle. Ce module ne connaît que
 * la forme.
 */

import { describe, expect, test } from "vitest";

import {
  EMPTY_CONTEXT_MARKER_VALUES,
  parseContextMarkerForm,
  readContextMarkerForm,
  toContextMarkerFormValues,
  validateContextMarkerForm,
  type ContextMarkerFormValues,
} from "./context-marker";

const PROJECT_ID = "8f7d3a2e-1c4b-4a6d-9e0f-2b5c8d1a3e7f";

/** Une saisie complète et valide, dont chaque test ne change que ce qu'il éprouve. */
function values(
  overrides: Partial<ContextMarkerFormValues> = {},
): ContextMarkerFormValues {
  return {
    happenedOn: "2026-05-02",
    label: "Mise en production du nouveau tunnel",
    note: "Sur l'ensemble du parc.",
    projectId: PROJECT_ID,
    ...overrides,
  };
}

/** Le `FormData` correspondant, pour les tests qui passent par la lecture. */
function formOf(overrides: Partial<ContextMarkerFormValues> = {}): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(values(overrides))) {
    data.set(name, value);
  }
  return data;
}

describe("readContextMarkerForm — la lecture", () => {
  test("les quatre champs sont lus et rognés", () => {
    const data = formOf({ label: "  Refonte technique  " });

    expect(readContextMarkerForm(data).label).toBe("Refonte technique");
  });

  test("un champ absent vaut vide, jamais `undefined`", () => {
    expect(readContextMarkerForm(new FormData())).toEqual(
      EMPTY_CONTEXT_MARKER_VALUES,
    );
  });
});

describe("validateContextMarkerForm — la date", () => {
  test("une saisie complète ne rend aucune erreur", () => {
    expect(validateContextMarkerForm(values())).toEqual({});
  });

  test("la date est obligatoire", () => {
    /* C'est elle qui pose le repère sur l'axe : `docs/03` §7 interdit de
       positionner arbitrairement ce qui n'a pas de date. */
    expect(
      validateContextMarkerForm(values({ happenedOn: "" })).happenedOn,
    ).toBeDefined();
  });

  test("une date qui n'existe pas est refusée", () => {
    /* `isIsoDay` repasse par `Date` : la seule expression régulière laisserait
       passer le 31 février. */
    expect(
      validateContextMarkerForm(values({ happenedOn: "2026-02-31" })).happenedOn,
    ).toBeDefined();
  });

  test("une date malformée est refusée", () => {
    expect(
      validateContextMarkerForm(values({ happenedOn: "02/05/2026" })).happenedOn,
    ).toBeDefined();
  });
});

describe("validateContextMarkerForm — l'intitulé", () => {
  test("l'intitulé est obligatoire", () => {
    /* Un repère sans intitulé serait une marque muette sur l'axe, et la couleur
       ne porte jamais seule (`docs/06` §11). */
    expect(validateContextMarkerForm(values({ label: "" })).label).toBeDefined();
  });

  test("un intitulé d'espaces vaut un intitulé vide", () => {
    /* Le rognage a lieu à la lecture ; ce test tient la règle du côté de la
       validation, pour un appelant qui construirait ses valeurs autrement. */
    expect(
      validateContextMarkerForm(readContextMarkerForm(formOf({ label: "   " })))
        .label,
    ).toBeDefined();
  });
});

describe("validateContextMarkerForm — l'accompagnement", () => {
  test("vide est valide : le rattachement est facultatif", () => {
    /* Le cas normal, et c'est voulu : une mise en production n'est pas la
       nôtre. */
    expect(validateContextMarkerForm(values({ projectId: "" }))).toEqual({});
  });

  test("un identifiant qui n'a pas la forme d'un UUID est refusé", () => {
    /* Interroger une colonne `uuid` avec autre chose est une erreur PostgreSQL,
       donc un 500 là où l'on attend un message de champ. */
    expect(
      validateContextMarkerForm(values({ projectId: "pas-un-uuid" })).projectId,
    ).toBeDefined();
  });
});

describe("validateContextMarkerForm — la note", () => {
  test("la note n'est jamais validée", () => {
    /* Un texte libre, nullable en base. Lui imposer une forme serait inventer
       un référentiel (D25). */
    expect(
      validateContextMarkerForm(values({ note: "n'importe quoi <>&" })).note,
    ).toBeUndefined();
  });
});

describe("parseContextMarkerForm — la ligne prête à écrire", () => {
  test("une saisie valide rend son `input`", () => {
    const { errors, input } = parseContextMarkerForm(formOf());

    expect(errors).toEqual({});
    expect(input).toEqual({
      happenedOn: "2026-05-02",
      label: "Mise en production du nouveau tunnel",
      note: "Sur l'ensemble du parc.",
      projectId: PROJECT_ID,
    });
  });

  test("les deux champs facultatifs vides deviennent `null`", () => {
    /* Les colonnes sont nullables : une chaîne vide y serait une valeur, et se
       relirait comme une note écrite puis effacée. */
    const { input } = parseContextMarkerForm(formOf({ note: "", projectId: "" }));

    expect(input).toMatchObject({ note: null, projectId: null });
  });

  test("une saisie invalide ne rend aucun `input`", () => {
    /* La propriété posée en T2.5 : `input` est non nul **si et seulement si**
       `errors` est vide. */
    const { errors, input } = parseContextMarkerForm(formOf({ label: "" }));

    expect(Object.keys(errors).length).toBeGreaterThan(0);
    expect(input).toBeNull();
  });

  test("un champ que le formulaire ne connaît pas est ignoré", () => {
    /* La règle du dépôt : l'action ne construit jamais sa ligne par étalement
       d'un `FormData`. Un champ caché ajouté par n'importe qui deviendrait
       sinon une colonne écrite — `productId` en tête, que l'action tient de
       l'URL et non du formulaire. */
    const data = formOf();
    data.set("productId", "8f7d3a2e-1c4b-4a6d-9e0f-000000000000");
    data.set("archivedAt", "2026-01-01");

    const { input } = parseContextMarkerForm(data);

    expect(input).not.toHaveProperty("productId");
    expect(input).not.toHaveProperty("archivedAt");
  });
});

describe("toContextMarkerFormValues — le sens du retour", () => {
  test("une ligne se retourne en valeurs de formulaire", () => {
    expect(
      toContextMarkerFormValues({
        happenedOn: "2025-06-15",
        label: "Refonte technique",
        note: "Sans incidence sur le parcours.",
        projectId: PROJECT_ID,
      }),
    ).toEqual({
      happenedOn: "2025-06-15",
      label: "Refonte technique",
      note: "Sans incidence sur le parcours.",
      projectId: PROJECT_ID,
    });
  });

  test("les deux colonnes nulles deviennent des chaînes vides", () => {
    /* Un `<input>` ne sait pas afficher `null` : le formulaire ne manipule que
       des chaînes, et c'est ici que la conversion a lieu. */
    expect(
      toContextMarkerFormValues({
        happenedOn: "2025-06-15",
        label: "Refonte technique",
        note: null,
        projectId: null,
      }),
    ).toMatchObject({ note: "", projectId: "" });
  });
});
