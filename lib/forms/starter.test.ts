/**
 * Les tests de la saisie d'une **piste de démarrage** (T7.4).
 *
 * Aucune base. **Six champs, et trois règles qui ne se devinent pas** :
 * `summary` est obligatoire quand `guidance` ne l'est pas — le schéma le dit,
 * la carte en dépend ; les deux champs facultatifs sortent **`null`** et non
 * `""` ; et le genre est rétréci sur l'énuméré.
 *
 * **Ce que ce module n'écrit pas est aussi un sujet** : aucune adresse — elle
 * vit sur `tools.base_url`, et une seule fois — et aucun `activity_type_id`,
 * qui est T7.10 avec sa migration.
 */

import { describe, expect, test } from "vitest";

import {
  isStarterKind,
  parseStarterForm,
  readStarterForm,
  STARTER_KINDS,
  toStarterFormValues,
  validateStarterForm,
} from "./starter";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.append(name, value);
  return data;
}

const TOOL = "3f1c2b7e-0a4d-4c9e-8b21-5d6e7f809a12";
const VALID = {
  label: "Lancer un audit",
  summary: "Ouvrir la plateforme et lancer la campagne.",
  guidance: "",
  kind: "tool",
  toolId: "",
  position: "10",
};

describe("readStarterForm — six champs, et pas un de plus", () => {
  test("les six champs, rognés", () => {
    expect(
      readStarterForm(form({ ...VALID, label: "  Lancer un audit  " })).label,
    ).toBe("Lancer un audit");
  });

  test("aucune adresse, aucun type d'activité n'entrent", () => {
    /* L'adresse vit sur `tools.base_url` ; `activity_type_id` est T7.10, avec
       sa migration. Un champ caché ne doit atteindre ni l'une ni l'autre. */
    const read = readStarterForm(
      form({ ...VALID, baseUrl: "https://x.example", activityTypeId: TOOL }),
    );
    expect(Object.keys(read).sort()).toEqual([
      "guidance",
      "kind",
      "label",
      "position",
      "summary",
      "toolId",
    ]);
  });
});

describe("la phrase de carte est obligatoire, le texte long ne l'est pas", () => {
  test("sans `summary`, la saisie est refusée sur son champ", () => {
    const { errors, input } = parseStarterForm(form({ ...VALID, summary: " " }));
    expect(errors.summary).toBe("La phrase de présentation est obligatoire.");
    expect(input).toBeNull();
  });

  test("sans `guidance`, elle passe — et sort `null`", () => {
    const { errors, input } = parseStarterForm(form(VALID));
    expect(errors).toEqual({});
    expect(input?.guidance).toBeNull();
  });

  test("vider `guidance` la retire plutôt que d'écrire une chaîne vide", () => {
    /* `starter-detail.tsx` teste `guidance` pour déplier son texte long : une
       chaîne vide y rendrait un paragraphe blanc. */
    expect(
      parseStarterForm(form({ ...VALID, guidance: "   " })).input?.guidance,
    ).toBeNull();
  });
});

describe("le genre — rétréci sur l'énuméré", () => {
  test("les trois valeurs du schéma passent", () => {
    expect([...STARTER_KINDS]).toEqual(["tool", "method", "resource"]);
    for (const kind of STARTER_KINDS) expect(isStarterKind(kind)).toBe(true);
  });

  test("une valeur forgée est refusée sur le champ, jamais écrite", () => {
    const { errors, input } = parseStarterForm(
      form({ ...VALID, kind: "gabarit" }),
    );
    expect(errors.kind).toBe("Cette nature de piste n'existe pas.");
    expect(input).toBeNull();
  });
});

describe("l'outil — facultatif, et jamais une chaîne vide", () => {
  test("une méthode n'a pas d'outil, et c'est un état normal", () => {
    expect(
      parseStarterForm(form({ ...VALID, kind: "method" })).input?.toolId,
    ).toBeNull();
  });

  test("la forme est vérifiée avant la base", () => {
    const { errors, input } = parseStarterForm(
      form({ ...VALID, toolId: "pas-un-uuid" }),
    );
    expect(errors.toolId).toBe("Cet outil n'est pas reconnu.");
    expect(input).toBeNull();
  });
});

describe("parseStarterForm — la ligne prête à écrire", () => {
  test("une saisie complète rend ses six colonnes", () => {
    const { input } = parseStarterForm(
      form({
        ...VALID,
        guidance: "Le texte long.",
        toolId: TOOL,
        position: "12,5",
      }),
    );
    expect(input).toEqual({
      label: "Lancer un audit",
      summary: "Ouvrir la plateforme et lancer la campagne.",
      guidance: "Le texte long.",
      kind: "tool",
      toolId: TOOL,
      /* La virgule française est rendue à PostgreSQL en point. */
      position: "12.5",
    });
  });

  test("un libellé vide est refusé, et la position garde la règle du socle", () => {
    expect(validateStarterForm({ ...VALID, label: "" }).label).toBe(
      "Le libellé est obligatoire.",
    );
    expect(validateStarterForm({ ...VALID, position: "" }).position).toBe(
      "La position est obligatoire.",
    );
  });

  test("la saisie revient telle quelle quand elle est refusée", () => {
    const { values } = parseStarterForm(form({ ...VALID, kind: "gabarit" }));
    expect(values.label).toBe("Lancer un audit");
    expect(values.summary).toBe("Ouvrir la plateforme et lancer la campagne.");
  });
});

describe("le pré-remplissage", () => {
  test("les deux champs nuls reviennent en chaîne vide", () => {
    expect(
      toStarterFormValues({
        label: "Méthode",
        summary: "Une manière de faire.",
        guidance: null,
        kind: "method",
        toolId: null,
        position: "20.00",
      }),
    ).toEqual({
      label: "Méthode",
      summary: "Une manière de faire.",
      guidance: "",
      kind: "method",
      toolId: "",
      position: "20.00",
    });
  });
});
