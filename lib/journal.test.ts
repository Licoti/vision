/**
 * Les tests du vocabulaire du journal — T6.1.
 *
 * Aucune base : ces fonctions sont pures. Ce qui s'éprouve ici est la **phrase**,
 * et elle se mesure au caractère : `summary` est figé à l'écriture (D22), si
 * bien qu'une forme qui changerait plus tard ne réécrirait jamais les lignes
 * déjà posées. Un journal qui dirait les mêmes gestes de deux manières selon la
 * date serait illisible en frise.
 *
 * **L'insécable s'éprouve sur son point de code**, jamais à l'œil : U+00A0 et
 * l'espace ordinaire sont indiscernables dans un fichier source comme dans un
 * navigateur, et un test qui attendrait la seconde passerait le jour où la
 * règle sauterait. D'où les deux assertions jumelles — ce que la chaîne est, et
 * ce qu'elle n'est pas (leçon de `lib/format.test.ts`).
 *
 * Ils couvrent **les trois formes et les six noms**. Les quatre noms de T6.2
 * sont arrivés avec les gestes qui les écrivent, et la troisième forme —
 * `statePhrase` — avec les deux seuls gestes qui font *atteindre un état*.
 */

import { describe, expect, test } from "vitest";

import { objectPhrase, statePhrase, teamPhrase } from "./journal";

const NBSP = "\u00A0";

describe("objectPhrase — un objet nommé, et ce qui lui est arrivé", () => {
  test("les quatre gestes de l'accompagnement, au masculin", () => {
    expect(objectPhrase("project", "created", "Refonte du panier")).toBe(
      `Accompagnement créé${NBSP}: Refonte du panier`,
    );
    expect(objectPhrase("project", "updated", "Refonte du panier")).toBe(
      `Accompagnement modifié${NBSP}: Refonte du panier`,
    );
    expect(objectPhrase("project", "archived", "Refonte du panier")).toBe(
      `Accompagnement archivé${NBSP}: Refonte du panier`,
    );
    expect(objectPhrase("project", "restored", "Refonte du panier")).toBe(
      `Accompagnement rétabli${NBSP}: Refonte du panier`,
    );
  });

  /**
   * `restored` n'est pas un verbe de l'énuméré : `restoreProject` écrit
   * `updated`. Si les deux phrases se confondaient, la frise ne distinguerait
   * plus une correction d'un rétablissement — et la colonne, elle, ne les
   * distingue pas.
   */
  test("« modifié » et « rétabli » ne se confondent pas", () => {
    expect(objectPhrase("project", "restored", "X")).not.toBe(
      objectPhrase("project", "updated", "X"),
    );
  });

  test("le libellé est recopié tel quel, jamais retouché", () => {
    // Un nom qui porte lui-même un deux-points ne casse pas la phrase : le
    // séparateur se reconnaît à son insécable, pas à sa position.
    expect(objectPhrase("project", "created", "Panier : refonte 2026")).toBe(
      `Accompagnement créé${NBSP}: Panier : refonte 2026`,
    );
  });

  test("l'espace devant les deux-points est insécable", () => {
    const phrase = objectPhrase("project", "created", "Refonte du panier");

    expect(phrase.charCodeAt(phrase.indexOf(":") - 1)).toBe(0xa0);
    // Ce que la chaîne **n'est pas** : sans cette assertion, une espace
    // ordinaire passerait, elle est indiscernable de la bonne.
    expect(phrase).not.toContain("créé :");
  });
});

describe("objectPhrase — les quatre objets de T6.2", () => {
  /**
   * **Les deux genres ont un appelant parmi les quatre noms neufs**, sans quoi
   * la moitié de la mécanique d'accord serait à la merci du premier qui s'en
   * servirait — la propriété que T6.1 avait établie sur deux noms.
   */
  test("les deux genres, sur les quatre noms", () => {
    expect(objectPhrase("activity", "created", "Audit UX")).toBe(
      `Activité créée${NBSP}: Audit UX`,
    );
    expect(objectPhrase("resource", "updated", "Compte rendu")).toBe(
      `Ressource modifiée${NBSP}: Compte rendu`,
    );
    expect(objectPhrase("result", "created", "Score d'audit")).toBe(
      `Résultat créé${NBSP}: Score d'audit`,
    );
    expect(objectPhrase("indicator_reading", "archived", "Autonomie")).toBe(
      `Relevé archivé${NBSP}: Autonomie`,
    );
  });

  test("les trois gestes de chaque objet ne se confondent pas", () => {
    for (const kind of ["activity", "resource", "result", "indicator_reading"] as const) {
      const phrases = new Set([
        objectPhrase(kind, "created", "X"),
        objectPhrase(kind, "updated", "X"),
        objectPhrase(kind, "archived", "X"),
      ]);
      expect(phrases.size).toBe(3);
    }
  });

  /**
   * **Le nom de l'objet distingue les six**, et c'est ce qui rend une frise
   * mêlée lisible : « Activité créée » et « Ressource créée » ne se lisent pas
   * l'une pour l'autre, quand bien même le libellé serait le même.
   */
  test("les six noms produisent six phrases distinctes", () => {
    const phrases = new Set(
      (
        [
          "project",
          "member",
          "activity",
          "resource",
          "result",
          "indicator_reading",
        ] as const
      ).map((kind) => objectPhrase(kind, "updated", "X")),
    );
    expect(phrases.size).toBe(6);
  });
});

describe("statePhrase — l'état qu'une activité vient d'atteindre", () => {
  test("les trois états, accordés au féminin d'« Activité »", () => {
    expect(statePhrase("in_progress", "Audit UX")).toBe(
      `Activité en cours${NBSP}: Audit UX`,
    );
    expect(statePhrase("done", "Audit UX")).toBe(
      `Activité terminée${NBSP}: Audit UX`,
    );
    expect(statePhrase("cancelled", "Audit UX")).toBe(
      `Activité annulée${NBSP}: Audit UX`,
    );
  });

  test("le motif d'annulation entre dans la phrase", () => {
    expect(statePhrase("cancelled", "Audit UX", "Reporté à 2027")).toBe(
      `Activité annulée${NBSP}: Audit UX${NBSP}— Reporté à 2027`,
    );
  });

  /**
   * **Un motif absent ne laisse pas de tiret nu.** Les deux transitions de
   * `transitionActivity` n'en ont aucun ; une phrase finissant par « — »
   * paraîtrait tronquée en frise.
   */
  test("sans motif, aucun tiret", () => {
    expect(statePhrase("done", "Audit UX")).not.toContain("—");
    expect(statePhrase("cancelled", "Audit UX", null)).not.toContain("—");
    expect(statePhrase("cancelled", "Audit UX", "")).not.toContain("—");
  });

  test("les deux insécables : devant les deux-points, devant le tiret", () => {
    const phrase = statePhrase("cancelled", "Audit UX", "Reporté");

    expect(phrase.charCodeAt(phrase.indexOf(":") - 1)).toBe(0xa0);
    expect(phrase.charCodeAt(phrase.indexOf("—") - 1)).toBe(0xa0);
    // Ce que la chaîne **n'est pas** : une espace ordinaire est indiscernable
    // de la bonne, et passerait le jour où la règle sauterait.
    expect(phrase).not.toContain("annulée :");
    expect(phrase).not.toContain("UX —");
  });

  /**
   * **Un état atteint n'est pas une correction de saisie.** `transitionActivity`
   * et `updateActivity` écrivent sur le même objet, sous deux verbes de
   * l'énuméré : si leurs phrases se confondaient, la frise ne dirait plus
   * lequel des deux gestes a eu lieu.
   */
  test("« Activité terminée » ne se confond avec aucun geste de correction", () => {
    const states = ["in_progress", "done", "cancelled"] as const;
    const deeds = ["created", "updated", "archived"] as const;

    for (const state of states) {
      for (const deed of deeds) {
        expect(statePhrase(state, "X")).not.toBe(
          objectPhrase("activity", deed, "X"),
        );
      }
    }
  });
});

describe("teamPhrase — ce qui a bougé dans l'équipe", () => {
  const NOTHING = { arrived: [], left: [], rerolled: [] };

  test("« Équipe » est féminine, et le participe s'accorde", () => {
    expect(teamPhrase({ ...NOTHING, arrived: ["Camille Roux"] })).toContain(
      "Équipe modifiée",
    );
  });

  test("les trois mouvements au singulier", () => {
    expect(teamPhrase({ ...NOTHING, arrived: ["Camille Roux"] })).toBe(
      `Équipe modifiée${NBSP}: Camille Roux rejoint l'équipe`,
    );
    expect(teamPhrase({ ...NOTHING, left: ["Léa Martin"] })).toBe(
      `Équipe modifiée${NBSP}: Léa Martin la quitte`,
    );
    expect(teamPhrase({ ...NOTHING, rerolled: ["Rudy Zourane"] })).toBe(
      `Équipe modifiée${NBSP}: Rudy Zourane change de rôle`,
    );
  });

  test("les trois mouvements au pluriel — les noms se groupent", () => {
    expect(
      teamPhrase({ ...NOTHING, arrived: ["Camille Roux", "Rudy Zourane"] }),
    ).toBe(
      `Équipe modifiée${NBSP}: Camille Roux et Rudy Zourane rejoignent l'équipe`,
    );
    expect(teamPhrase({ ...NOTHING, left: ["Léa Martin", "Paul Dubois"] })).toBe(
      `Équipe modifiée${NBSP}: Léa Martin et Paul Dubois la quittent`,
    );
    expect(
      teamPhrase({ ...NOTHING, rerolled: ["A", "B", "C"] }),
    ).toBe(`Équipe modifiée${NBSP}: A, B et C changent de rôle`);
  });

  /**
   * **Une ligne, jamais une par personne.** C'est la propriété que la fiche
   * exige, et elle se lit ici : cinq personnes, une phrase.
   */
  test("les trois mouvements ensemble tiennent en une phrase", () => {
    expect(
      teamPhrase({
        arrived: ["Camille Roux", "Rudy Zourane"],
        left: ["Léa Martin"],
        rerolled: ["Paul Dubois", "Sofia Neri"],
      }),
    ).toBe(
      `Équipe modifiée${NBSP}: Camille Roux et Rudy Zourane rejoignent l'équipe${NBSP}; ` +
        `Léa Martin la quitte${NBSP}; Paul Dubois et Sofia Neri changent de rôle`,
    );
  });

  test("un mouvement absent ne laisse pas de clause vide", () => {
    const phrase = teamPhrase({ ...NOTHING, arrived: ["Camille Roux"] });
    expect(phrase).not.toContain(";");
    expect(phrase?.endsWith("l'équipe")).toBe(true);
  });

  test("le point-virgule porte lui aussi son insécable", () => {
    const phrase = teamPhrase({
      ...NOTHING,
      arrived: ["Camille Roux"],
      left: ["Léa Martin"],
    });
    expect(phrase).not.toBeNull();
    expect(phrase?.charCodeAt(phrase.indexOf(";") - 1)).toBe(0xa0);
    expect(phrase).not.toContain("équipe ;");
  });

  /**
   * La règle « une équipe qui n'a pas changé n'écrit rien » vit ici, à un seul
   * endroit. Sans ce `null`, chaque appelant referait la garde — et le premier
   * qui l'oublierait écrirait « Équipe modifiée : » suivi de rien.
   */
  test("rien n'a bougé : aucune phrase", () => {
    expect(teamPhrase(NOTHING)).toBeNull();
  });
});
