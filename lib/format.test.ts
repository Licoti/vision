/**
 * Les tests des deux formatages posés par T4.3 — `formatDay` et
 * `formatResultValue` —, puis des trois de T5.1.
 *
 * **Écart de périmètre déclaré** : la fiche du ticket ne nomme que
 * `lib/format.ts`, qui n'avait aucun fichier de tests. Le ticket y ajoute trois
 * règles muettes — les zéros de `numeric(18,4)`, l'espace insécable devant
 * l'unité, la date au jour — qu'aucun autre test ne pourrait mettre en défaut :
 * lues dans le HTML servi, elles ne s'éprouvent que sur les deux résultats de
 * la fixture, et aucun cas limite ne l'est.
 *
 * Ils ne couvrent **que les fonctions des tickets qui les ont écrits**. Le reste
 * du fichier — les périodes, les initiales, les compteurs de projets — n'est du
 * périmètre d'aucun des deux, et un fichier de tests n'est pas une invitation à
 * le déborder.
 *
 * Aucune base : ces fonctions sont pures.
 *
 * **L'insécable s'éprouve sur le point de code**, jamais à l'œil : U+00A0 et
 * l'espace ordinaire sont indiscernables dans un fichier source comme dans un
 * navigateur, et un test qui attendrait la seconde passerait le jour où la
 * règle sauterait. D'où le test qui vérifie ce que la chaîne **n'est pas**.
 */

import { describe, expect, test } from "vitest";

import {
  formatDateMonth,
  formatDay,
  formatIndicatorDirection,
  formatReadings,
  formatResultValue,
} from "./format";

describe("formatDay", () => {
  test("rend le jour, le mois en toutes lettres et l'année", () => {
    expect(formatDay("2024-05-31")).toBe("31 mai 2024");
    expect(formatDay("2026-06-30")).toBe("30 juin 2026");
  });

  test("un premier du mois ne recule pas d'un jour", () => {
    // Le piège du fuseau, en plus serré qu'au mois : sans `timeZone: "UTC"`,
    // un serveur à l'ouest rendrait « 31 décembre 2025 ».
    expect(formatDay("2026-01-01")).toBe("1 janvier 2026");
  });
});

describe("formatResultValue — le chiffre", () => {
  test("les zéros de queue de `numeric(18,4)` tombent", () => {
    // C'est le cas de toute la table : le pilote rend « 62.0000 », et « 62 »
    // est ce que le lecteur attend d'un score.
    expect(formatResultValue("62.0000", null)).toBe("62");
    expect(formatResultValue("68.0000", null)).toBe("68");
  });

  test("une décimale réelle survit, avec la virgule française", () => {
    expect(formatResultValue("0.1250", null)).toBe("0,125");
  });

  test("les milliers se groupent", () => {
    // Le séparateur de groupe est celui d'`Intl` pour le français, pas le
    // nôtre : on éprouve qu'il y en a un, pas lequel.
    expect(formatResultValue("1234.5000", null)).toMatch(/^1\s234,5$/u);
  });

  test("une chaîne illisible est rendue telle quelle, jamais en « NaN »", () => {
    expect(formatResultValue("indisponible", null)).toBe("indisponible");
  });

  test("une valeur absente ne rend rien — l'appelant retire la part", () => {
    expect(formatResultValue(null, "%")).toBeNull();
    expect(formatResultValue(null, null)).toBeNull();
  });
});

describe("formatResultValue — l'unité", () => {
  test("une unité qui commence par `/` se colle : c'est une fraction", () => {
    expect(formatResultValue("62.0000", "/100")).toBe("62/100");
  });

  test("toute autre unité est précédée d'une espace insécable", () => {
    expect(formatResultValue("68.0000", "%")).toBe("68 %");
    expect(formatResultValue("12.0000", "s")).toBe("12 s");
  });

  test("l'espace n'est jamais ordinaire", () => {
    // La règle se mesure sur le point de code, pas à l'œil : les deux espaces
    // sont indiscernables dans un fichier source comme dans un navigateur.
    expect(formatResultValue("68.0000", "%")).not.toBe("68 %");
    expect(formatResultValue("68.0000", "%")).not.toContain(" ");
  });

  test("une unité vide ne laisse pas d'espace en suspens", () => {
    expect(formatResultValue("62.0000", "")).toBe("62");
    expect(formatResultValue("62.0000", null)).toBe("62");
  });
});

/* ==========================================================================
   Les trois formatages de T5.1
   ========================================================================== */

describe("formatDateMonth", () => {
  test("rend le mois en toutes lettres et l'année, jamais le jour", () => {
    // La date d'un relevé se lit au mois (D13), là où `formatDay` garde le
    // jour d'une date de mesure de résultat.
    expect(formatDateMonth("2026-06-01")).toBe("juin 2026");
    expect(formatDateMonth("2024-09-15")).toBe("septembre 2024");
  });

  test("un premier du mois ne recule pas d'un mois", () => {
    // Le piège du fuseau : sans `timeZone: "UTC"`, un serveur à l'ouest
    // rendrait « décembre 2025 ». Les trois relevés de la fixture tombent tous
    // un premier du mois — c'est le cas nominal, pas un cas limite.
    expect(formatDateMonth("2026-01-01")).toBe("janvier 2026");
  });
});

describe("formatReadings", () => {
  test("zéro s'écrit en toutes lettres", () => {
    // Un indicateur sans relevé n'est pas un indicateur en défaut : « 0 relevé »
    // se lirait comme un manque.
    expect(formatReadings(0)).toBe("Aucun relevé");
  });

  test("un relevé reste au singulier", () => {
    expect(formatReadings(1)).toBe("1 relevé");
  });

  test("au-delà, le pluriel", () => {
    expect(formatReadings(3)).toBe("3 relevés");
  });
});

describe("formatIndicatorDirection", () => {
  test("les deux sens de lecture sont écrits en toutes lettres", () => {
    expect(formatIndicatorDirection("higher_is_better")).toBe(
      "Plus haut vaut mieux",
    );
    expect(formatIndicatorDirection("lower_is_better")).toBe(
      "Plus bas vaut mieux",
    );
  });

  test("aucune formulation ne qualifie une valeur", () => {
    /* La garde de l'interdit de la fiche, et de D39 : la direction dit dans
       quel sens la courbe se lit, jamais si un chiffre est bon. Un « objectif »,
       une « cible » ou un « bon » ici feraient de Vision un outil
       d'évaluation. */
    const both = [
      formatIndicatorDirection("higher_is_better"),
      formatIndicatorDirection("lower_is_better"),
    ].join(" ");

    expect(both).not.toMatch(/bon|mauvais|objectif|cible|atteint/iu);
  });
});
