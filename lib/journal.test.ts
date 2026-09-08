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
 * Ils couvrent **les cinq formes et les seize noms**. Les quatre noms de T6.2
 * sont arrivés avec les gestes qui les écrivent, la troisième forme —
 * `statePhrase` — avec les deux seuls gestes qui font *atteindre un état*, la
 * quatrième — `linkPhrase` — avec les trois gestes du lien déclaré (T6.5), et
 * les **dix noms de T8.3** avec les vingt-sept points d'appel qui les écrivent.
 *
 * **Le constat qui vaut pour les seize, et pas seulement pour les dix neufs** :
 * seize noms doivent produire seize phrases distinctes. Un nom qui doublerait
 * un autre rendrait une frise mêlée illisible sans qu'aucun test d'action ne
 * s'en aperçoive — chacun ne regarde que sa propre ligne.
 */

import { describe, expect, test } from "vitest";

import {
  linkPhrase,
  accessPhrase,
  northStarPhrase,
  objectPhrase,
  statePhrase,
  teamPhrase,
} from "./journal";

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
   * **Le nom de l'objet distingue les seize**, et c'est ce qui rend une frise
   * mêlée lisible : « Activité créée » et « Ressource créée » ne se lisent pas
   * l'une pour l'autre, quand bien même le libellé serait le même.
   *
   * **La liste est écrite en toutes lettres, jamais dérivée de `NOUNS`** : un
   * constat qui parcourrait la table qu'il éprouve passerait quel que soit son
   * contenu. C'est elle qui doit tomber le jour où un dix-septième nom entre
   * sans qu'on ait vérifié qu'il ne double personne.
   */
  test("les seize noms produisent seize phrases distinctes", () => {
    const phrases = new Set(
      (
        [
          "project",
          "member",
          "activity",
          "resource",
          "result",
          "indicator_reading",
          "persona",
          "use_case",
          "indicator",
          "person",
          "entity",
          "product_vision",
          "budget",
          "tracking",
          "tagging_plan",
          "context_marker",
        ] as const
      ).map((kind) => objectPhrase(kind, "updated", "X")),
    );
    expect(phrases.size).toBe(16);
  });
});

/* ==========================================================================
   Les dix noms de T8.3
   ========================================================================== */

describe("objectPhrase — les dix objets de T8.3", () => {
  /**
   * **Chaque libellé est celui de l'écran**, et c'est ce que ce constat éprouve
   * — pas l'accord, que le suivant regarde. « Use case » est le titre du bloc
   * de la page produit, « Vision produit » celui du bloc de tête, « Outil de
   * mesure » le mot des messages de refus. Un journal qui nommerait les objets
   * autrement que l'écran obligerait à traduire.
   */
  test("les dix libellés sont ceux de l'interface", () => {
    expect(objectPhrase("persona", "created", "Le pressé")).toBe(
      `Persona créé${NBSP}: Le pressé`,
    );
    expect(objectPhrase("use_case", "created", "Payer en trois fois")).toBe(
      `Use case créé${NBSP}: Payer en trois fois`,
    );
    expect(objectPhrase("indicator", "created", "Autonomie")).toBe(
      `Indicateur créé${NBSP}: Autonomie`,
    );
    expect(objectPhrase("budget", "created", "Refonte du panier")).toBe(
      `Budget créé${NBSP}: Refonte du panier`,
    );
    expect(objectPhrase("tracking", "created", "Matomo")).toBe(
      `Outil de mesure créé${NBSP}: Matomo`,
    );
    expect(objectPhrase("tagging_plan", "created", "Espace client")).toBe(
      `Plan de taggage créé${NBSP}: Espace client`,
    );
    expect(objectPhrase("context_marker", "created", "Refonte du SI")).toBe(
      `Repère de contexte créé${NBSP}: Refonte du SI`,
    );
  });

  /**
   * **Les trois noms féminins ont un appelant**, sans quoi la mécanique
   * d'accord serait à la merci du premier qui s'en servirait — la propriété que
   * T6.1 avait établie sur deux noms et T6.2 sur quatre.
   */
  test("les trois féminins portent leur `e`", () => {
    expect(objectPhrase("person", "created", "Camille Roux")).toBe(
      `Personne créée${NBSP}: Camille Roux`,
    );
    expect(objectPhrase("entity", "archived", "Retail")).toBe(
      `Entité archivée${NBSP}: Retail`,
    );
    expect(objectPhrase("product_vision", "updated", "Espace client")).toBe(
      `Vision produit modifiée${NBSP}: Espace client`,
    );
  });

  /**
   * `restored` n'a eu qu'un appelant de C6 à T8.3 — `restoreProject`.
   * `restoreEntity` est le second, et il est le seul des dix objets neufs à
   * rétablir : un persona, un use case ou un outil de mesure archivés se
   * **ressaisissent** (arbitrage (b) de `tickets-C4bis.md`).
   */
  test("l'entité rétablie ne se confond pas avec l'entité modifiée", () => {
    expect(objectPhrase("entity", "restored", "Retail")).toBe(
      `Entité rétablie${NBSP}: Retail`,
    );
    expect(objectPhrase("entity", "restored", "Retail")).not.toBe(
      objectPhrase("entity", "updated", "Retail"),
    );
  });

  test("les quatre gestes de chaque objet neuf ne se confondent pas", () => {
    for (const kind of [
      "persona",
      "use_case",
      "indicator",
      "person",
      "entity",
      "product_vision",
      "budget",
      "tracking",
      "tagging_plan",
      "context_marker",
    ] as const) {
      const phrases = new Set([
        objectPhrase(kind, "created", "X"),
        objectPhrase(kind, "updated", "X"),
        objectPhrase(kind, "archived", "X"),
        objectPhrase(kind, "restored", "X"),
      ]);
      expect(phrases.size).toBe(4);
    }
  });

  /**
   * L'insécable se mesure **sur son point de code**, jamais à l'œil : U+00A0 et
   * l'espace ordinaire sont indiscernables dans un source comme dans un
   * navigateur. La règle vaut pour les dix noms neufs comme pour les six aînés.
   */
  test("les dix noms portent l'insécable devant les deux-points", () => {
    for (const kind of [
      "persona",
      "use_case",
      "indicator",
      "person",
      "entity",
      "product_vision",
      "budget",
      "tracking",
      "tagging_plan",
      "context_marker",
    ] as const) {
      const phrase = objectPhrase(kind, "created", "X");
      expect(phrase).toContain(`${NBSP}: X`);
      expect(phrase).not.toContain(" : X");
    }
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

/* ==========================================================================
   La cinquième forme — T8.3
   ========================================================================== */

describe("northStarPhrase — la North Star qu'un produit se donne", () => {
  test("les deux participes, accordés au féminin de « North Star »", () => {
    expect(northStarPhrase("designated", "Autonomie")).toBe(
      `North Star désignée${NBSP}: Autonomie`,
    );
    expect(northStarPhrase("removed", "Autonomie")).toBe(
      `North Star retirée${NBSP}: Autonomie`,
    );
  });

  test("l'espace devant les deux-points est insécable", () => {
    expect(northStarPhrase("designated", "Autonomie")).toContain(
      `${NBSP}: Autonomie`,
    );
    expect(northStarPhrase("designated", "Autonomie")).not.toContain(
      " : Autonomie",
    );
  });

  /**
   * **La désignation et le retrait ne se confondent pas**, et c'est tout ce que
   * la frise a pour les distinguer : la colonne, elle, porte le **même** verbe
   * `state_changed` et le **même** `target_type` `indicator` dans les deux cas.
   */
  test("désigner et retirer ne disent pas la même chose", () => {
    expect(northStarPhrase("designated", "X")).not.toBe(
      northStarPhrase("removed", "X"),
    );
  });

  /**
   * **La cinquième forme ne double aucune des quatre.** « North Star désignée »
   * n'est ni « Indicateur modifié » ni « Activité terminée » : c'est la raison
   * même de son existence — `objectPhrase("indicator", "updated", …)` aurait
   * rendu un renommage d'indicateur indiscernable d'une désignation.
   */
  test("elle ne se confond avec aucun geste de correction d'indicateur", () => {
    const phrases = new Set([
      northStarPhrase("designated", "Autonomie"),
      northStarPhrase("removed", "Autonomie"),
      objectPhrase("indicator", "created", "Autonomie"),
      objectPhrase("indicator", "updated", "Autonomie"),
      objectPhrase("indicator", "archived", "Autonomie"),
    ]);
    expect(phrases.size).toBe(5);
  });

  test("le libellé est recopié tel quel, jamais retouché", () => {
    expect(northStarPhrase("removed", "Taux : 2026")).toBe(
      `North Star retirée${NBSP}: Taux : 2026`,
    );
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

/* ==========================================================================
   La quatrième forme — le lien déclaré (T6.5)
   ========================================================================== */

describe("linkPhrase — ce qu'un geste a fait d'un lien déclaré", () => {
  test("les trois participes, au masculin de « Lien »", () => {
    expect(linkPhrase("declared", "Refonte du panier")).toBe(
      `Lien déclaré${NBSP}: Refonte du panier`,
    );
    expect(linkPhrase("updated", "Refonte du panier")).toBe(
      `Lien modifié${NBSP}: Refonte du panier`,
    );
    expect(linkPhrase("removed", "Refonte du panier")).toBe(
      `Lien retiré${NBSP}: Refonte du panier`,
    );
  });

  /**
   * L'insécable se mesure sur son point de code, jamais à l'œil : U+00A0 et
   * l'espace ordinaire sont indiscernables dans un source comme dans un
   * navigateur. Les deux assertions jumelles disent ce que la chaîne est, et ce
   * qu'elle n'est pas.
   */
  test("le deux-points porte son insécable", () => {
    const phrase = linkPhrase("declared", "Refonte du panier");
    expect(phrase.charCodeAt(phrase.indexOf(":") - 1)).toBe(0xa0);
    expect(phrase).not.toContain("déclaré :");
  });

  /**
   * La raison est **ce que le geste voulait dire**, comme le motif d'annulation
   * de `statePhrase` : ce n'est pas une « valeur avant » que D22 refuse.
   */
  test("la raison s'ajoute en incise, insécable compris", () => {
    const phrase = linkPhrase(
      "declared",
      "Refonte du panier",
      "réutilise la grille d'entretien",
    );
    expect(phrase).toBe(
      `Lien déclaré${NBSP}: Refonte du panier${NBSP}— réutilise la grille d'entretien`,
    );
    expect(phrase.charCodeAt(phrase.indexOf("—") - 1)).toBe(0xa0);
    expect(phrase).not.toContain("panier —");
  });

  /**
   * **Une raison absente ne compose aucune clause vide.** `docs/02` §7 veut la
   * saisie « parfaitement optionnelle » : la moitié des liens n'en portera pas,
   * et « Lien déclaré : X — » serait la phrase qu'on relit sans comprendre.
   */
  test("sans raison, aucune incise — ni pour `null`, ni pour le vide", () => {
    expect(linkPhrase("declared", "Refonte du panier", null)).toBe(
      `Lien déclaré${NBSP}: Refonte du panier`,
    );
    expect(linkPhrase("declared", "Refonte du panier", "")).not.toContain("—");
    expect(linkPhrase("declared", "Refonte du panier")).not.toContain("—");
  });

  /**
   * **Le retrait ne redit pas la raison, et c'est la règle d'`archiveResource`**
   * : « Ressource archivée : <titre> » ne redonne pas l'adresse du document. La
   * phrase désigne ce qui a été touché, elle ne restitue pas son contenu.
   */
  test("le retrait ne porte que la désignation", () => {
    expect(linkPhrase("removed", "Refonte du panier")).not.toContain("—");
  });
});

describe("accessPhrase — le compte d'une personne", () => {
  test("les deux participes, accordés au masculin d'« Accès »", () => {
    expect(accessPhrase("granted", "Camille Roux", "domain_manager")).toBe(
      `Accès accordé${NBSP}: Camille Roux${NBSP}— responsable de domaine`,
    );
    expect(accessPhrase("granted", "Camille Roux", "member")).toBe(
      `Accès accordé${NBSP}: Camille Roux${NBSP}— membre`,
    );
    expect(accessPhrase("revoked", "Camille Roux")).toBe(
      `Accès retiré${NBSP}: Camille Roux`,
    );
  });

  test("les deux espaces sont insécables, devant les deux-points comme devant le tiret", () => {
    const phrase = accessPhrase("granted", "Camille Roux", "member");
    expect(phrase).toContain(`${NBSP}: Camille Roux`);
    expect(phrase).toContain(`${NBSP}— membre`);
    expect(phrase).not.toContain(" : ");
    expect(phrase).not.toContain(" — ");
  });

  /**
   * **Le rôle n'accompagne que l'accord.** Au retrait, la ligne n'en porte plus :
   * le dire serait raconter ce qui n'est plus là. C'est la dissymétrie de
   * `statePhrase`, dont le motif ne vient qu'avec l'annulation.
   */
  test("le retrait ne nomme aucun rôle, même si on lui en passe un", () => {
    expect(accessPhrase("revoked", "Camille Roux")).not.toContain("responsable");
    expect(accessPhrase("revoked", "Camille Roux")).not.toContain("membre");
  });

  test("accorder et retirer ne disent pas la même chose", () => {
    /* La colonne porte le **même** verbe `state_changed` et le **même**
       `target_type` `person` dans les deux cas : la phrase est tout ce que la
       frise a pour les distinguer. */
    expect(accessPhrase("granted", "X", "member")).not.toBe(
      accessPhrase("revoked", "X"),
    );
  });

  /**
   * **La sixième forme ne double aucune des cinq.** « Accès accordé » n'est pas
   * « Personne modifiée » : c'est la raison même de son existence —
   * `objectPhrase("person", "updated", …)` aurait rendu l'ouverture d'un compte
   * indiscernable d'un changement de nom, et accorder un accès est un fait plus
   * lourd.
   */
  test("elle ne se confond avec aucun geste de profil", () => {
    const phrases = new Set([
      accessPhrase("granted", "Camille Roux", "domain_manager"),
      accessPhrase("granted", "Camille Roux", "member"),
      accessPhrase("revoked", "Camille Roux"),
      objectPhrase("person", "created", "Camille Roux"),
      objectPhrase("person", "updated", "Camille Roux"),
      objectPhrase("person", "archived", "Camille Roux"),
    ]);
    expect(phrases.size).toBe(6);
  });

  /**
   * **Le nom ne s'accorde sur aucun genre**, et c'est déjà la règle de
   * `teamPhrase` et d'`objectPhrase` : `persons` n'en porte pas, et il n'en
   * portera pas. « Accordé » s'accorde avec « Accès », le mot, jamais avec qui
   * le reçoit.
   */
  test("aucun accord sur la personne", () => {
    expect(accessPhrase("granted", "Sofia Marchand", "member")).toBe(
      `Accès accordé${NBSP}: Sofia Marchand${NBSP}— membre`,
    );
  });
});
