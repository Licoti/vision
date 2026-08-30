/**
 * Les tests de la saisie d'un **outil raccordé** (T7.4).
 *
 * Aucune base, et **aucun appel sortant** : ce module regarde une chaîne, il ne
 * visite rien (D15).
 *
 * **Le sujet est l'adresse**, et ce n'est pas de l'ergonomie : `base_url` est
 * rendue par `ExternalLink` sur la carte d'une piste, qui pose le `href` tel
 * quel. Une adresse `javascript:` enregistrée ici s'exécuterait au clic — le
 * contrôle est donc de sécurité, et c'est le cinquième réemploi d'`isWebUrl`.
 *
 * **Le second est la colonne `name`** : `tools` est la seule des neuf tables de
 * l'écran d'administration à ne pas nommer son libellé `label`, et le champ le
 * dit.
 */

import { describe, expect, test } from "vitest";

import {
  isToolKind,
  parseToolForm,
  readToolForm,
  TOOL_KINDS,
  toToolFormValues,
  validateToolForm,
} from "./tool";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.append(name, value);
  return data;
}

const VALID = { name: "Ergonome", kind: "audit", baseUrl: "" };

describe("readToolForm — la colonne s'appelle `name`", () => {
  test("les trois champs, rognés", () => {
    expect(
      readToolForm(
        form({
          name: "  Ergonome  ",
          kind: " audit ",
          baseUrl: " https://ergonome.example.com ",
        }),
      ),
    ).toEqual({
      name: "Ergonome",
      kind: "audit",
      baseUrl: "https://ergonome.example.com",
    });
  });

  test("aucun quatrième champ n'entre — `sync_mode` en tête", () => {
    /* Arbitrage (i) de `tickets-C7.md` : `sync_mode` et `api_config` ne se
       saisissent pas. Un champ caché ne doit pas les atteindre. */
    const read = readToolForm(form({ ...VALID, syncMode: "api" }));
    expect(Object.keys(read).sort()).toEqual(["baseUrl", "kind", "name"]);
  });
});

describe("le genre — rétréci sur l'énuméré", () => {
  test("les quatre valeurs du schéma passent", () => {
    expect([...TOOL_KINDS]).toEqual(["audit", "analytics", "budget", "other"]);
    for (const kind of TOOL_KINDS) expect(isToolKind(kind)).toBe(true);
  });

  test("une valeur forgée est refusée sur le champ, jamais écrite", () => {
    const { errors, input } = parseToolForm(form({ ...VALID, kind: "figma" }));
    expect(errors.kind).toBe("Ce genre d'outil n'existe pas.");
    expect(input).toBeNull();
  });
});

describe("l'adresse — un contrôle de sécurité, pas une politesse", () => {
  test("une adresse `javascript:` est refusée", () => {
    /* `ExternalLink` rend le `href` tel quel : c'est ici, à l'écriture, qu'on
       décide encore de ce qui entre. */
    const { errors, input } = parseToolForm(
      form({ ...VALID, baseUrl: "javascript:alert(1)" }),
    );
    expect(errors.baseUrl).toBe(
      "Cette adresse n'est pas un lien web : elle doit commencer par http:// ou https://.",
    );
    expect(input).toBeNull();
  });

  test("une adresse relative ou sans schéma est refusée", () => {
    for (const baseUrl of ["exemple.fr", "/rapport.pdf"]) {
      expect(validateToolForm({ ...VALID, baseUrl }).baseUrl).toBeDefined();
    }
  });

  test("http et https passent, et rien d'autre", () => {
    for (const baseUrl of [
      "http://outil.example.com",
      "https://outil.example.com/rapports",
    ]) {
      expect(validateToolForm({ ...VALID, baseUrl }).baseUrl).toBeUndefined();
    }
  });

  test("vide, elle sort `null` : une piste dit alors « sans adresse »", () => {
    const { errors, input } = parseToolForm(form(VALID));
    expect(errors).toEqual({});
    expect(input?.baseUrl).toBeNull();
  });
});

describe("parseToolForm — la ligne prête à écrire", () => {
  test("une saisie valide rend ses trois colonnes, et pas une de plus", () => {
    const { input } = parseToolForm(
      form({ ...VALID, baseUrl: "https://ergonome.example.com" }),
    );
    expect(input).toEqual({
      name: "Ergonome",
      kind: "audit",
      baseUrl: "https://ergonome.example.com",
    });
  });

  test("un nom vide est refusé sur son champ", () => {
    const { errors, input } = parseToolForm(form({ ...VALID, name: "   " }));
    expect(errors.name).toBe("Le nom de l'outil est obligatoire.");
    expect(input).toBeNull();
  });

  test("la saisie revient telle quelle quand elle est refusée", () => {
    const { values } = parseToolForm(
      form({ name: "Ergonome", kind: "figma", baseUrl: "https://x.example" }),
    );
    expect(values.name).toBe("Ergonome");
    expect(values.baseUrl).toBe("https://x.example");
  });
});

describe("le pré-remplissage", () => {
  test("une adresse absente revient en chaîne vide", () => {
    expect(
      toToolFormValues({ name: "Portail", kind: "analytics", baseUrl: null }),
    ).toEqual({ name: "Portail", kind: "analytics", baseUrl: "" });
  });
});
