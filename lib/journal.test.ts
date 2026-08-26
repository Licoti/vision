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
 * Ils ne couvrent **que les deux formes de ce ticket**. Les quatre noms de
 * T6.2 n'existent pas encore, et un fichier de tests n'est pas une invitation à
 * les inventer.
 */

import { describe, expect, test } from "vitest";

import { objectPhrase, teamPhrase } from "./journal";

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
