/**
 * Les tests des deux formatages posés par T4.3 — `formatDay` et
 * `formatResultValue` —, des trois de T5.1, puis de `formatProducts`
 * (21/08/2026).
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
  formatActivityPeriod,
  formatComplementaryIndicators,
  formatCoverage,
  formatDateMonth,
  formatDay,
  formatEventDay,
  formatIndicatorDirection,
  formatMonthTick,
  formatPeriodShort,
  formatProducts,
  formatReadings,
  formatResultValue,
  formatTaggingPlanStatus,
  formatTrackingStatus,
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

describe("formatEventDay", () => {
  test("rend le jour d'un horodatage, pas celui d'une colonne `date`", () => {
    // `events.occurred_at` arrive en `Date` : c'est toute la raison de cette
    // seconde porte sur le même formateur (T6.3).
    expect(formatEventDay(new Date("2026-08-27T14:32:00Z"))).toBe(
      "27 août 2026",
    );
  });

  test("le même formateur, donc le même fuseau", () => {
    // Le piège du fuseau, à sa forme la plus serrée : un horodatage de fin de
    // journée. Sans `timeZone: "UTC"`, un serveur à l'ouest rendrait
    // « 31 décembre 2025 » d'un instant qui est le 1er janvier.
    expect(formatEventDay(new Date("2026-01-01T00:30:00Z"))).toBe(
      "1 janvier 2026",
    );
  });

  test("l'heure ne paraît jamais", () => {
    // Deux instants du même jour rendent la même chaîne : c'est l'arbitrage
    // (1) du ticket, et non un effet de bord du formateur.
    expect(formatEventDay(new Date("2026-08-27T01:00:00Z"))).toBe(
      formatEventDay(new Date("2026-08-27T23:00:00Z")),
    );
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

describe("formatMonthTick", () => {
  test("rend le mois abrégé et le millésime à deux chiffres", () => {
    /* La graduation vit dans la largeur d'une tranche d'axe : « septembre 2026 »
       écrit huit fois de suite se chevauche là où « sept. '26 » tient. */
    expect(formatMonthTick("2026-09")).toBe("sept. '26");
    expect(formatMonthTick("2024-03")).toBe("mars '24");
  });

  test("reçoit « YYYY-MM », et non une colonne `date`", () => {
    // Une graduation situe un mois ; elle ne date aucun fait, donc pas de jour.
    expect(formatMonthTick("2025-01")).toBe("janv. '25");
  });

  test("un janvier ne recule pas sur l'année précédente", () => {
    /* Le piège du fuseau, en pire qu'ailleurs : la fonction force le jour au
       premier, donc **toute** graduation reculerait sans `timeZone: "UTC"` —
       et « janv. '26 » deviendrait « déc. '25 ». */
    expect(formatMonthTick("2026-01")).toBe("janv. '26");
  });
});

describe("formatActivityPeriod", () => {
  test("« à planifier » passe avant toute lecture de date", () => {
    // D14 — et le drapeau est regardé en premier : une ligne qui porterait à
    // la fois la case et des dates dirait « À planifier », jamais les deux.
    expect(formatActivityPeriod(null, null, true)).toBe("À planifier");
    expect(formatActivityPeriod("2026-06-12", "2026-06-12", true)).toBe(
      "À planifier",
    );
  });

  test("deux bornes du même jour se lisent au jour", () => {
    /* La troisième entorse bornée au mois de D13 (31/08/2026), et sa raison
       est celle que le module écrit déjà deux fois : un fait daté ponctuel
       n'est pas une période. Une restitution du 12 juin perdrait son sens en
       « juin 2026 ». */
    expect(formatActivityPeriod("2026-06-12", "2026-06-12", false)).toBe(
      "12 juin 2026",
    );
  });

  test("le jour passe **avant** le repli au mois, qui l'écraserait", () => {
    // Les deux bornes d'un même jour tombent aussi dans le même mois : sans
    // l'ordre des branches, « 12 juin 2026 » se lirait « juin 2026 ».
    expect(formatActivityPeriod("2026-06-12", "2026-06-12", false)).not.toBe(
      "juin 2026",
    );
  });

  test("une période d'un mois entier garde son mois", () => {
    /* La frontière : ce que `docs/03` §6 refuse est la précision **fabriquée**.
       Du 1er au 31 août n'est pas une date précise, et rien ne la fait passer
       pour telle. */
    expect(formatActivityPeriod("2026-08-01", "2026-08-31", false)).toBe(
      "août 2026",
    );
  });

  test("deux mois distincts se lisent en fourchette", () => {
    expect(formatActivityPeriod("2026-03-02", "2026-05-31", false)).toBe(
      "mars 2026 → mai 2026",
    );
  });

  test("un début seul se lit au mois", () => {
    expect(formatActivityPeriod("2026-08-03", null, false)).toBe("août 2026");
  });

  test("une fin seule se lit au mois", () => {
    // Le schéma l'autorise — seuls `planned` et `done` sont contraints.
    expect(formatActivityPeriod(null, "2026-08-31", false)).toBe("août 2026");
  });

  test("aucune date et aucun « à planifier » dit l'absence", () => {
    expect(formatActivityPeriod(null, null, false)).toBe(
      "Période non renseignée",
    );
  });

  test("un premier du mois ne recule pas d'un mois", () => {
    // Le piège du fuseau, sur les deux branches : au jour comme au mois.
    expect(formatActivityPeriod("2026-01-01", "2026-01-01", false)).toBe(
      "1 janvier 2026",
    );
    expect(formatActivityPeriod("2026-01-01", "2026-03-31", false)).toBe(
      "janvier 2026 → mars 2026",
    );
  });
});

describe("formatPeriodShort", () => {
  test("abrège le mois et garde le millésime entier", () => {
    /* « septembre 2024 » poussait la période sous la pastille de statut dans la
       colonne de 280 px de la roadmap. Le mois s'abrège, l'année non : une
       période se lit seule, là où une graduation se lit dans son voisinage. */
    expect(formatPeriodShort("2024-03-01", "2024-09-30")).toBe(
      "mars 2024 → sept. 2024",
    );
  });

  test("les quatre cas de `formatPeriod`, à l'identique", () => {
    // Une période ouverte se dit « depuis » : un accompagnement en cours n'a
    // pas une fin manquante, il n'en a pas encore.
    expect(formatPeriodShort("2026-02-01", null)).toBe("depuis févr. 2026");
    expect(formatPeriodShort(null, "2024-09-30")).toBe("jusqu'à sept. 2024");
    expect(formatPeriodShort(null, null)).toBe("Période non renseignée");
  });

  test("un premier du mois ne recule pas d'un mois", () => {
    // Le piège du fuseau, celui de `MONTH` : sans `timeZone: "UTC"`, un serveur
    // à l'ouest rendrait « déc. 2025 ».
    expect(formatPeriodShort("2026-01-01", "2026-01-31")).toBe(
      "janv. 2026 → janv. 2026",
    );
  });
});

describe("formatCoverage", () => {
  test("les deux bornes de l'ensemble, dans l'ordre", () => {
    /* Les dates arrivent dans le désordre de la page — les accompagnements sont
       rendus du plus récent au plus ancien, et chacun donne deux dates. */
    expect(
      formatCoverage(["2026-03-31", "2025-01-01", "2026-06-30", "2025-09-01"]),
    ).toBe("janv. 2025 → juin 2026");
  });

  test("les dates absentes n'étendent rien", () => {
    // Un accompagnement sans date ne compte pas : il n'a rien à situer.
    expect(formatCoverage([null, "2025-05-01", null, "2025-07-31"])).toBe(
      "mai 2025 → juil. 2025",
    );
  });

  test("un seul mois se dit une seule fois", () => {
    /* Deux jours du même mois donnent la même borne mise en forme :
       « mars 2025 → mars 2025 » se lirait comme une erreur. */
    expect(formatCoverage(["2025-03-01", "2025-03-31"])).toBe("mars 2025");
  });

  test("une seule date connue se suffit", () => {
    expect(formatCoverage([null, "2025-03-12"])).toBe("mars 2025");
  });

  test("aucune date connue ne rend rien à écrire", () => {
    // `null`, et non une phrase d'absence : la page n'écrit alors pas la ligne.
    expect(formatCoverage([])).toBeNull();
    expect(formatCoverage([null, null])).toBeNull();
  });

  test("un premier du mois ne recule pas d'un mois", () => {
    // Le piège du fuseau, celui de `formatPeriodShort` : sans `timeZone: "UTC"`,
    // un serveur à l'ouest rendrait « déc. 2025 ».
    expect(formatCoverage(["2026-01-01", "2026-12-31"])).toBe(
      "janv. 2026 → déc. 2026",
    );
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

describe("formatComplementaryIndicators", () => {
  test("zéro s'écrit en toutes lettres", () => {
    // Une North Star sans indicateur autour d'elle n'est pas un produit en
    // défaut : « 0 indicateur » se lirait comme un manque à combler.
    expect(formatComplementaryIndicators(0)).toBe(
      "Aucun indicateur complémentaire",
    );
  });

  test("un indicateur reste au singulier", () => {
    expect(formatComplementaryIndicators(1)).toBe("1 indicateur complémentaire");
  });

  test("au-delà, les deux mots prennent le pluriel", () => {
    // Le piège de cette fonction, et la raison de ce test : l'adjectif
    // s'accorde avec le nom, et un `s` posé sur le seul nom rendrait
    // « 3 indicateurs complémentaire ».
    expect(formatComplementaryIndicators(3)).toBe(
      "3 indicateurs complémentaires",
    );
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

describe("formatProducts", () => {
  test("zéro s'écrit en toutes lettres", () => {
    // Sur l'écran Administration, zéro est l'état le plus intéressant : c'est
    // celui où archiver et supprimer s'ouvrent tous les deux.
    expect(formatProducts(0)).toBe("Aucun produit");
  });

  test("un produit reste au singulier", () => {
    expect(formatProducts(1)).toBe("1 produit");
  });

  test("au-delà, le pluriel", () => {
    expect(formatProducts(4)).toBe("4 produits");
  });
});

/* ==========================================================================
   Les états du dispositif de mesure (01/09/2026)
   ========================================================================== */

describe("formatTrackingStatus", () => {
  test("les quatre états portent leur libellé français", () => {
    expect(formatTrackingStatus("planned")).toBe("Prévu");
    expect(formatTrackingStatus("active")).toBe("En place");
    expect(formatTrackingStatus("partial")).toBe("Partiel");
    expect(formatTrackingStatus("stopped")).toBe("Arrêté");
  });

  /* **Aucun libellé ne juge**, comme les deux sens de lecture d'un indicateur :
     « Partiel » dit ce que l'outil couvre, jamais que le produit serait mal
     mesuré. Le jour où « Incomplet », « Insuffisant » ou « À corriger »
     entrerait ici, Vision se mettrait à évaluer — ce qu'elle ne fait pas. */
  test("aucun libellé ne porte de jugement", () => {
    const all = [
      formatTrackingStatus("planned"),
      formatTrackingStatus("active"),
      formatTrackingStatus("partial"),
      formatTrackingStatus("stopped"),
    ].join(" ");

    expect(all).not.toMatch(/insuffisant|incomplet|manquant|mauvais|corriger/iu);
  });
});

describe("formatTaggingPlanStatus", () => {
  test("les trois états portent leur libellé français", () => {
    expect(formatTaggingPlanStatus("draft")).toBe("En cours d'écriture");
    expect(formatTaggingPlanStatus("current")).toBe("À jour");
    expect(formatTaggingPlanStatus("stale")).toBe("À revoir");
  });

  /* **« À revoir » et non « Obsolète » ni « En retard ».** La nuance porte tout
     le dispositif : l'état est déclaré par une personne, et un libellé de retard
     ferait croire que Vision l'a calculé — ce que les interdits d'interface
     refusent. Le mot dit ce qu'il y a à faire, pas un verdict sur le passé. */
  test("aucun libellé ne dit le retard", () => {
    const all = [
      formatTaggingPlanStatus("draft"),
      formatTaggingPlanStatus("current"),
      formatTaggingPlanStatus("stale"),
    ].join(" ");

    expect(all).not.toMatch(/retard|obsolète|périmé|expiré|ancien/iu);
  });
});
