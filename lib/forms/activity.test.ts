/**
 * Les tests de la saisie d'une activité.
 *
 * **Aucune base**, comme ceux du produit et du projet : c'est la contrepartie
 * d'avoir isolé la validation et la dérivation dans un module pur. Ils énoncent
 * la règle plutôt que de l'observer sur une fixture.
 *
 * Le cœur du fichier est la table de dérivation. Elle est éprouvée **borne à
 * borne** — la veille, le jour même, le lendemain — parce qu'une règle de date
 * ne se trompe jamais au milieu d'un intervalle : elle se trompe d'un jour.
 * `today` étant un paramètre, ces tests diront la même chose dans six mois.
 *
 * Ce qui n'est pas testé ici, et ne doit pas l'être : l'existence du type ou de
 * l'approche dans le domaine. C'est tranché par `lib/db/scoped.ts` à
 * l'écriture, et par l'action avant elle.
 */

import { describe, expect, test } from "vitest";

import {
  EMPTY_ACTIVITY_VALUES,
  activityRowUnchanged,
  canTransitionActivity,
  deriveActivityState,
  parseActivityForm,
  readActivityForm,
  readCancellationReason,
  resolveActivityPeriod,
  toActivityFormValues,
  validateActivityForm,
  validateCancellationReason,
  type ActivityCurrent,
  type ActivityFormValues,
  type ActivityRowInput,
  type ActivityState,
} from "./activity";

const TYPE = "3f2504e0-4f89-11d3-9a0c-0305e82c3311";
const APPROACH = "3f2504e0-4f89-11d3-9a0c-0305e82c3312";
const PERSON_A = "3f2504e0-4f89-11d3-9a0c-0305e82c3321";
const PERSON_B = "3f2504e0-4f89-11d3-9a0c-0305e82c3322";

/** Le jour de référence de tous les tests de dérivation. */
const TODAY = "2026-08-13";

/** Des valeurs valides, dont chaque test ne dérange qu'un champ. */
function valid(overrides: Partial<ActivityFormValues> = {}): ActivityFormValues {
  return {
    activityTypeId: TYPE,
    planning: "period",
    periodStart: "2026-08-03",
    periodEnd: "2026-08-31",
    periodDay: "",
    approachId: APPROACH,
    objective: "Prioriser les chantiers du second semestre.",
    externalUrl: "",
    participantIds: [],
    ...overrides,
  };
}

function form(entries: Record<string, string | string[]>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    for (const one of Array.isArray(value) ? value : [value]) {
      data.append(key, one);
    }
  }
  return data;
}

/** La saisie minimale que le panneau accepte : un type et une période. */
function minimal(): FormData {
  return form({
    activityTypeId: TYPE,
    planning: "period",
    periodStart: "2026-08-03",
    periodEnd: "2026-08-31",
  });
}

/* ==========================================================================
   Lecture
   ========================================================================== */

describe("readActivityForm", () => {
  test("lit les champs du ticket", () => {
    const values = readActivityForm(
      form({
        activityTypeId: TYPE,
        planning: "period",
        periodStart: "2026-08-03",
        periodEnd: "2026-08-31",
        periodDay: "2026-06-12",
        approachId: APPROACH,
        objective: "Prioriser les chantiers.",
        externalUrl: "https://ergonome.example.com/audits/42",
        participantIds: [PERSON_A, PERSON_B],
      }),
    );

    /* **Les trois champs de dates sont lus, quel que soit le mode.** Le panneau
       les sert tous les trois — deux sont masqués par le CSS, pas retirés du
       document —, et une saisie refusée doit revenir avec ce qui a été tapé
       dans chacun. Le mode décide de ce qui part en base, pas de ce qui se
       relit. */
    expect(values).toEqual({
      activityTypeId: TYPE,
      planning: "period",
      periodStart: "2026-08-03",
      periodEnd: "2026-08-31",
      periodDay: "2026-06-12",
      approachId: APPROACH,
      objective: "Prioriser les chantiers.",
      externalUrl: "https://ergonome.example.com/audits/42",
      participantIds: [PERSON_A, PERSON_B],
    });
  });

  test("les participants cochés se dédoublonnent (T3.6)", () => {
    const values = readActivityForm(
      form({
        activityTypeId: TYPE,
        periodStart: "2026-08-03",
        participantIds: [PERSON_A, PERSON_B, PERSON_A],
      }),
    );
    expect(values.participantIds).toEqual([PERSON_A, PERSON_B]);
  });

  test("aucun participant coché vaut un tableau vide", () => {
    expect(readActivityForm(minimal()).participantIds).toEqual([]);
  });

  test("les trois modes se lisent tels quels", () => {
    for (const planning of ["unscheduled", "period", "day"]) {
      expect(readActivityForm(form({ planning })).planning).toBe(planning);
    }
  });

  test("un mode forgé ne devient pas un mode", () => {
    /* Le rétrécissement sur l'énuméré **avant** l'écriture — le geste de T7.4,
       où la `nature` d'un statut et la `family` d'un type se resserrent de la
       même façon. Une valeur inconnue ne traverse pas la lecture : elle devient
       l'absence de choix, que la validation refuse. */
    for (const forged of ["day ", "DAY", "sabot", "isUnscheduled", "on", ""]) {
      expect(readActivityForm(form({ planning: forged })).planning).toBe("");
    }
  });

  test("un mode absent vaut l'absence de choix, jamais un mode par défaut", () => {
    expect(readActivityForm(form({ activityTypeId: TYPE })).planning).toBe("");
  });

  test("rogne les espaces autour des valeurs", () => {
    const values = readActivityForm(
      form({ activityTypeId: `  ${TYPE}  `, objective: "  Un objectif  " }),
    );
    expect(values.activityTypeId).toBe(TYPE);
    expect(values.objective).toBe("Un objectif");
  });

  test("un champ absent vaut la chaîne vide", () => {
    /* **Sauf le mode, et la divergence est le propos.** `EMPTY_ACTIVITY_VALUES`
       est l'état d'ouverture du panneau, où « Période » est coché d'avance ; un
       `FormData` vide n'est le formulaire de personne — c'est une soumission
       forgée ou tronquée, et elle n'a pas de mode. */
    expect(readActivityForm(new FormData())).toEqual({
      ...EMPTY_ACTIVITY_VALUES,
      planning: "",
    });
  });

  test("ne lit ni l'état, ni le projet, ni le motif d'annulation", () => {
    const values: Record<string, unknown> = readActivityForm(
      form({
        activityTypeId: TYPE,
        periodStart: "2026-08-03",
        state: "done",
        projectId: "3f2504e0-4f89-11d3-9a0c-0305e82c3399",
        cancellationReason: "Annulée par la bande",
      }),
    );

    expect(values.state).toBeUndefined();
    expect(values.projectId).toBeUndefined();
    expect(values.cancellationReason).toBeUndefined();
  });
});

/* ==========================================================================
   Les refus — un par un
   ========================================================================== */

describe("validateActivityForm", () => {
  test("une saisie complète ne produit aucune erreur", () => {
    expect(validateActivityForm(valid())).toEqual({});
  });

  /* Le lien vers l'outil (21/08/2026). La règle est celle de
     `results.external_url` et de `resources.url`, par le même `isWebUrl` :
     facultatif, mais un lien web s'il est là. */
  test("le lien vers l'outil est facultatif", () => {
    expect(validateActivityForm(valid({ externalUrl: "" })).externalUrl).toBe(
      undefined,
    );
  });

  test("un lien vers l'outil bien formé passe", () => {
    expect(
      validateActivityForm(
        valid({ externalUrl: "https://ergonome.example.com/audits/42" }),
      ).externalUrl,
    ).toBe(undefined);
  });

  test("un lien vers l'outil qui n'est pas un lien web est refusé", () => {
    for (const value of [
      "ergonome.example.com",
      "javascript:alert(1)",
      "ftp://ergonome.example.com",
      "Ergonome",
    ]) {
      expect(
        validateActivityForm(valid({ externalUrl: value })).externalUrl,
      ).toBe(
        "Cette adresse n'est pas un lien web : elle doit commencer par http:// ou https://.",
      );
    }
  });

  test("le type est obligatoire (D16)", () => {
    const errors = validateActivityForm(valid({ activityTypeId: "" }));
    expect(errors.activityTypeId).toBeDefined();
  });

  test("un type qui n'a pas la forme d'un identifiant est refusé", () => {
    const errors = validateActivityForm(valid({ activityTypeId: "atelier" }));
    expect(errors.activityTypeId).toBeDefined();
  });

  test("le mode de planification est obligatoire", () => {
    // Un mode vide n'arrive que d'une soumission forgée ou tronquée : le
    // panneau en sert toujours un coché.
    expect(validateActivityForm(valid({ planning: "" })).planning).toBeDefined();
  });

  test("en mode « période », un début absent est refusé", () => {
    const errors = validateActivityForm(
      valid({ periodStart: "", periodEnd: "" }),
    );
    expect(errors.periodStart).toBeDefined();
  });

  test("en mode « date précise », une date absente est refusée", () => {
    const errors = validateActivityForm(valid({ planning: "day" }));
    expect(errors.periodDay).toBeDefined();
  });

  test("en mode « date précise », une date qui n'existe pas est refusée", () => {
    const errors = validateActivityForm(
      valid({ planning: "day", periodDay: "2026-02-31" }),
    );
    expect(errors.periodDay).toBeDefined();
  });

  test("une date précise bien formée passe", () => {
    expect(
      validateActivityForm(valid({ planning: "day", periodDay: "2026-06-12" })),
    ).toEqual({});
  });

  test("une fin antérieure au début est refusée", () => {
    const errors = validateActivityForm(
      valid({ periodStart: "2026-08-31", periodEnd: "2026-08-03" }),
    );
    expect(errors.periodEnd).toBeDefined();
  });

  /* **Deux refus ont disparu le 31/08/2026, et ils n'ont pas été assouplis.**
     « À planifier cochée avec une période » et « une fin sans début » sont
     devenus des saisies impossibles : le mode est exclusif, et « période »
     exige son début. Ce qui les remplace est le test ci-dessous — chaque mode
     ne se valide que sur ses champs, et ce que les autres portent ne le
     concerne pas. */
  test("un mode ne se valide que sur ses champs", () => {
    // Le panneau sert les trois blocs de champs, donc les poste tous les
    // trois. Une date aberrante dans un champ que le mode n'emploie pas ne
    // doit refuser aucune saisie.
    expect(
      validateActivityForm(
        valid({ planning: "unscheduled", periodStart: "2026-02-31" }),
      ),
    ).toEqual({});

    expect(
      validateActivityForm(
        valid({ planning: "day", periodDay: "2026-06-12", periodEnd: "pas une date" }),
      ),
    ).toEqual({});

    expect(
      validateActivityForm(valid({ periodDay: "2026-02-31" })),
    ).toEqual({});
  });

  test("une date qui n'existe pas est refusée", () => {
    const errors = validateActivityForm(
      valid({ periodStart: "2026-02-31", periodEnd: "" }),
    );
    expect(errors.periodStart).toBeDefined();
  });

  test("une approche qui n'a pas la forme d'un identifiant est refusée", () => {
    const errors = validateActivityForm(valid({ approachId: "research" }));
    expect(errors.approachId).toBeDefined();
  });

  test("« à planifier » est acceptée sans aucune date", () => {
    const errors = validateActivityForm(
      valid({ planning: "unscheduled", periodStart: "", periodEnd: "" }),
    );
    expect(errors).toEqual({});
  });

  test("un début seul est accepté : la fin reste facultative", () => {
    // `docs/03` §4 n'exige qu'une date de début d'une activité en cours.
    const errors = validateActivityForm(valid({ periodEnd: "" }));
    expect(errors).toEqual({});
  });

  test("l'approche et l'objectif sont facultatifs", () => {
    const errors = validateActivityForm(
      valid({ approachId: "", objective: "" }),
    );
    expect(errors).toEqual({});
  });

  test("les participants sont facultatifs (T3.6)", () => {
    const errors = validateActivityForm(valid({ participantIds: [] }));
    expect(errors).toEqual({});
  });

  test("un participant qui n'a pas la forme d'un identifiant est refusé", () => {
    const errors = validateActivityForm(
      valid({ participantIds: [PERSON_A, "camille-roux"] }),
    );
    expect(errors.participantIds).toBeDefined();
  });

  test("l'existence d'un participant dans le domaine n'est pas vérifiée ici", () => {
    // C'est le choix explicite de la fiche : `lib/db/scoped.ts` la refuse à
    // l'écriture, pas ce module. Deux identifiants bien formés suffisent.
    const errors = validateActivityForm(
      valid({ participantIds: [PERSON_A, PERSON_B] }),
    );
    expect(errors.participantIds).toBeUndefined();
  });
});

/* ==========================================================================
   La dérivation — le cœur du ticket
   ========================================================================== */

describe("deriveActivityState", () => {
  test("« à planifier » donne une activité prévue, sans aucune date", () => {
    expect(
      deriveActivityState(
        valid({ planning: "unscheduled", periodStart: "", periodEnd: "" }),
        TODAY,
      ),
    ).toEqual({
      state: "planned",
      periodStart: null,
      periodEnd: null,
      isUnscheduled: true,
    });
  });

  test("« à planifier » ignore les dates que le panneau a postées", () => {
    /* Les trois blocs de champs sont servis, donc postés. Le mode décide seul
       de ce qui part en base — et rien n'est jeté du formulaire : les valeurs
       reviennent intactes dans `values`, seule la **ligne** les ignore. */
    expect(
      deriveActivityState(valid({ planning: "unscheduled" }), TODAY),
    ).toEqual({
      state: "planned",
      periodStart: null,
      periodEnd: null,
      isUnscheduled: true,
    });
  });

  test("une date précise pose la même date aux deux bornes", () => {
    /* Rien en base ne dit « précise » : c'est une période d'un jour, et c'est
       ce qu'elle est. L'inférence de `toActivityFormValues` la retrouve sur ces
       deux colonnes seules. */
    expect(
      deriveActivityState(
        valid({ planning: "day", periodDay: "2026-06-12" }),
        TODAY,
      ),
    ).toEqual({
      state: "done",
      periodStart: "2026-06-12",
      periodEnd: "2026-06-12",
      isUnscheduled: false,
    });
  });

  test("une date précise à venir donne une activité prévue", () => {
    // La même règle d'état, sur une période dont les deux bornes coïncident.
    expect(
      deriveActivityState(
        valid({ planning: "day", periodDay: "2026-12-25" }),
        TODAY,
      ).state,
    ).toBe("planned");
  });

  test("une date précise au jour même donne une activité en cours", () => {
    /* **Les deux bornes sont constatées avec l'état, et c'est nécessaire.**
       Sans elles, ce test passait encore une fois la branche `day` retirée :
       la période de repli de `valid()` couvre elle aussi le jour de référence,
       et il concluait donc juste pour la mauvaise raison. */
    expect(
      deriveActivityState(valid({ planning: "day", periodDay: TODAY }), TODAY),
    ).toEqual({
      state: "in_progress",
      periodStart: TODAY,
      periodEnd: TODAY,
      isUnscheduled: false,
    });
  });

  test("une période entièrement passée donne une activité terminée", () => {
    const derived = deriveActivityState(
      valid({ periodStart: "2026-03-01", periodEnd: "2026-05-31" }),
      TODAY,
    );
    expect(derived.state).toBe("done");
    expect(derived.periodEnd).toBe("2026-05-31");
  });

  test("une fin à la veille du jour même donne une activité terminée", () => {
    const derived = deriveActivityState(
      valid({ periodStart: "2026-08-01", periodEnd: "2026-08-12" }),
      TODAY,
    );
    expect(derived.state).toBe("done");
  });

  test("une fin au jour même donne une activité en cours", () => {
    const derived = deriveActivityState(
      valid({ periodStart: "2026-08-01", periodEnd: TODAY }),
      TODAY,
    );
    expect(derived.state).toBe("in_progress");
  });

  test("une période qui couvre aujourd'hui donne une activité en cours", () => {
    const derived = deriveActivityState(
      valid({ periodStart: "2026-08-03", periodEnd: "2026-08-31" }),
      TODAY,
    );
    expect(derived.state).toBe("in_progress");
  });

  test("un début au jour même donne une activité en cours", () => {
    const derived = deriveActivityState(
      valid({ periodStart: TODAY, periodEnd: "2026-08-31" }),
      TODAY,
    );
    expect(derived.state).toBe("in_progress");
  });

  test("un début au lendemain donne une activité prévue", () => {
    const derived = deriveActivityState(
      valid({ periodStart: "2026-08-14", periodEnd: "2026-08-31" }),
      TODAY,
    );
    expect(derived.state).toBe("planned");
  });

  test("une période entièrement à venir donne une activité prévue", () => {
    const derived = deriveActivityState(
      valid({ periodStart: "2026-10-01", periodEnd: "2026-10-31" }),
      TODAY,
    );
    expect(derived.state).toBe("planned");
  });

  test("un début seul donne une activité en cours, sans fin de période", () => {
    const derived = deriveActivityState(valid({ periodEnd: "" }), TODAY);
    expect(derived.state).toBe("in_progress");
    expect(derived.periodEnd).toBeNull();
  });

  test("un début seul ancien reste en cours : Vision n'invente pas sa fin", () => {
    const derived = deriveActivityState(
      valid({ periodStart: "2024-03-01", periodEnd: "" }),
      TODAY,
    );
    expect(derived.state).toBe("in_progress");
    expect(derived.periodEnd).toBeNull();
  });

  test("un début seul à venir reste en cours : c'est l'arbitrage retenu", () => {
    const derived = deriveActivityState(
      valid({ periodStart: "2027-01-04", periodEnd: "" }),
      TODAY,
    );
    expect(derived.state).toBe("in_progress");
  });

  /* Les deux contraintes `CHECK` du schéma, énoncées comme propriétés de la
     dérivation : elles tiennent par construction, et ces deux tests sont ce
     qui le vérifie. */
  test("`done` n'est jamais dérivé sans fin de période", () => {
    for (const period of [
      { periodStart: "2020-01-01", periodEnd: "" },
      { periodStart: TODAY, periodEnd: "" },
      { periodStart: "2030-01-01", periodEnd: "" },
    ]) {
      const derived = deriveActivityState(valid(period), TODAY);
      expect(derived.state === "done" && derived.periodEnd === null).toBe(false);
    }
  });

  test("`planned` n'est jamais dérivé sans début ni « à planifier »", () => {
    for (const period of [
      { periodStart: "2030-01-01", periodEnd: "2030-02-01" },
      { periodStart: "2020-01-01", periodEnd: "2020-02-01" },
      { periodStart: TODAY, periodEnd: TODAY },
    ]) {
      const derived = deriveActivityState(valid(period), TODAY);
      if (derived.state !== "planned") continue;
      expect(derived.periodStart !== null || derived.isUnscheduled).toBe(true);
    }
  });
});

/* ==========================================================================
   Le tout ensemble
   ========================================================================== */

describe("parseActivityForm", () => {
  test("rend la ligne à écrire quand la saisie est valide", () => {
    const { errors, input } = parseActivityForm(
      form({
        activityTypeId: TYPE,
        planning: "period",
        periodStart: "2026-03-02",
        periodEnd: "2026-03-31",
        approachId: APPROACH,
        objective: "Vérifier la compréhension du parcours.",
        externalUrl: "https://ergonome.example.com/audits/42",
      }),
      TODAY,
    );

    expect(errors).toEqual({});
    expect(input).toEqual({
      activityTypeId: TYPE,
      approachId: APPROACH,
      objective: "Vérifier la compréhension du parcours.",
      state: "done",
      periodStart: "2026-03-02",
      periodEnd: "2026-03-31",
      isUnscheduled: false,
      externalUrl: "https://ergonome.example.com/audits/42",
    });
  });

  test("ne rend aucune ligne dès qu'une erreur existe", () => {
    const { errors, input } = parseActivityForm(
      form({ periodStart: "2026-08-03" }),
      TODAY,
    );
    expect(Object.keys(errors).length).toBeGreaterThan(0);
    expect(input).toBeNull();
  });

  test("un lien vers l'outil vide part à `null`", () => {
    expect(parseActivityForm(minimal(), TODAY).input?.externalUrl).toBeNull();
  });

  test("une approche et un objectif vides partent à `null`", () => {
    const { input } = parseActivityForm(minimal(), TODAY);
    expect(input?.approachId).toBeNull();
    expect(input?.objective).toBeNull();
  });

  test("rend toujours la saisie, refusée comprise", () => {
    const { values } = parseActivityForm(
      form({ activityTypeId: "", objective: "Un objectif qu'on ne jette pas." }),
      TODAY,
    );
    expect(values.objective).toBe("Un objectif qu'on ne jette pas.");
  });

  test("rend les participants cochés à côté de la ligne (T3.6)", () => {
    const { input, participantIds } = parseActivityForm(
      form({
        activityTypeId: TYPE,
        planning: "period",
        periodStart: "2026-08-03",
        periodEnd: "2026-08-31",
        participantIds: [PERSON_A, PERSON_B],
      }),
      TODAY,
    );
    expect(input).not.toBeNull();
    expect(participantIds).toEqual([PERSON_A, PERSON_B]);
    // Les participants ne sont pas une colonne d'`activities` : `input` reste
    // exactement les sept colonnes de la ligne, pas une de plus.
    expect(input).not.toHaveProperty("participantIds");
  });

  test("rend aussi les participants quand la saisie est refusée", () => {
    const { input, participantIds } = parseActivityForm(
      form({ activityTypeId: "", participantIds: [PERSON_A] }),
      TODAY,
    );
    expect(input).toBeNull();
    expect(participantIds).toEqual([PERSON_A]);
  });

  test("« à planifier » écrit une activité prévue sans date", () => {
    const { input } = parseActivityForm(
      form({ activityTypeId: TYPE, planning: "unscheduled" }),
      TODAY,
    );
    expect(input).toMatchObject({
      state: "planned",
      periodStart: null,
      periodEnd: null,
      isUnscheduled: true,
    });
  });

  test("« date précise » écrit la même date aux deux bornes", () => {
    const { input } = parseActivityForm(
      form({ activityTypeId: TYPE, planning: "day", periodDay: "2026-06-12" }),
      TODAY,
    );
    expect(input).toMatchObject({
      state: "done",
      periodStart: "2026-06-12",
      periodEnd: "2026-06-12",
      isUnscheduled: false,
    });
  });

  test("le mode décide seul, et les champs des autres modes ne partent pas", () => {
    /* Le panneau sert les trois blocs de champs, donc les poste tous les trois.
       C'est le mode qui tranche — et rien n'est jeté du formulaire : `values`
       revient avec ce qui a été tapé partout, seule la **ligne** l'ignore. */
    const { input, values } = parseActivityForm(
      form({
        activityTypeId: TYPE,
        planning: "day",
        periodDay: "2026-06-12",
        periodStart: "2026-03-02",
        periodEnd: "2026-03-31",
      }),
      TODAY,
    );

    expect(input).toMatchObject({
      periodStart: "2026-06-12",
      periodEnd: "2026-06-12",
    });
    expect(values.periodStart).toBe("2026-03-02");
    expect(values.periodEnd).toBe("2026-03-31");
  });

  test("un mode forgé ne produit aucune ligne", () => {
    const { errors, input } = parseActivityForm(
      form({
        activityTypeId: TYPE,
        planning: "sabot",
        periodStart: "2026-03-02",
      }),
      TODAY,
    );
    expect(errors.planning).toBeDefined();
    expect(input).toBeNull();
  });

  test("en correction, l'état survit à une modification hors période", () => {
    const { input } = parseActivityForm(
      form({
        activityTypeId: TYPE,
        planning: "period",
        periodStart: "2026-03-02",
        periodEnd: "2026-03-31",
        objective: "Un objectif corrigé.",
      }),
      TODAY,
      // Une période entièrement passée : la dérivation dirait `done`. L'état
      // en base dit `in_progress` — la main de T3.5 —, et il reste.
      {
        state: "in_progress",
        periodStart: "2026-03-02",
        periodEnd: "2026-03-31",
        isUnscheduled: false,
      },
    );

    expect(input).toMatchObject({
      state: "in_progress",
      objective: "Un objectif corrigé.",
    });
  });

  test("en correction, une période déplacée redérive l'état", () => {
    const { input } = parseActivityForm(
      form({
        activityTypeId: TYPE,
        planning: "period",
        periodStart: "2026-12-01",
        periodEnd: "2026-12-31",
      }),
      TODAY,
      {
        state: "in_progress",
        periodStart: "2026-03-02",
        periodEnd: "2026-03-31",
        isUnscheduled: false,
      },
    );

    expect(input).toMatchObject({ state: "planned" });
  });
});

/* ==========================================================================
   L'édition — T3.4

   Arbitrage (c) du 13/08/2026 : **l'état n'est redérivé que si la période a
   bougé.** Sans lui, l'édition d'un objectif déferait la correction manuelle
   de T3.5 — et le défaut ne se verrait qu'en T3.5.
   ========================================================================== */

/** La ligne en base d'une activité en cours, datée du mois d'août. */
function current(
  overrides: Partial<ActivityCurrent> = {},
): ActivityCurrent {
  return {
    state: "in_progress",
    periodStart: "2026-08-03",
    periodEnd: "2026-08-31",
    isUnscheduled: false,
    ...overrides,
  };
}

/** Une ligne d'`activities` telle que la correction la relit. */
function row(
  overrides: Partial<{
    isUnscheduled: boolean;
    periodStart: string | null;
    periodEnd: string | null;
  }> = {},
) {
  return {
    activityTypeId: TYPE,
    isUnscheduled: false,
    periodStart: null as string | null,
    periodEnd: null as string | null,
    approachId: null,
    objective: null,
    externalUrl: null,
    participantIds: [] as string[],
    ...overrides,
  };
}

describe("toActivityFormValues", () => {
  test("les colonnes nulles redeviennent des chaînes vides", () => {
    expect(
      toActivityFormValues({
        activityTypeId: TYPE,
        isUnscheduled: true,
        periodStart: null,
        periodEnd: null,
        approachId: null,
        objective: null,
        externalUrl: null,
        participantIds: [],
      }),
    ).toEqual({
      activityTypeId: TYPE,
      planning: "unscheduled",
      periodStart: "",
      periodEnd: "",
      periodDay: "",
      approachId: "",
      objective: "",
      externalUrl: "",
      participantIds: [],
    });
  });

  /* **Le mode est déduit, jamais stocké**, et l'inférence est totale : les
     trois cas se lisent sur les colonnes qui existent. */
  test("une ligne « à planifier » se rouvre en « à planifier »", () => {
    const values = toActivityFormValues(row({ isUnscheduled: true }));
    expect(values.planning).toBe("unscheduled");
    expect([values.periodStart, values.periodEnd, values.periodDay]).toEqual([
      "",
      "",
      "",
    ]);
  });

  test("deux bornes égales se rouvrent en « date précise »", () => {
    const values = toActivityFormValues(
      row({ periodStart: "2026-06-12", periodEnd: "2026-06-12" }),
    );
    expect(values.planning).toBe("day");
    expect(values.periodDay).toBe("2026-06-12");
    // Chaque mode ne reprend que ses champs : sans cela, la moindre bascule
    // propagerait la date là où elle n'a rien à faire.
    expect([values.periodStart, values.periodEnd]).toEqual(["", ""]);
  });

  test("deux bornes distinctes se rouvrent en « période »", () => {
    const values = toActivityFormValues(
      row({ periodStart: "2026-08-03", periodEnd: "2026-08-31" }),
    );
    expect(values.planning).toBe("period");
    expect(values.periodDay).toBe("");
  });

  test("un début seul se rouvre en « période », fin vide", () => {
    const values = toActivityFormValues(row({ periodStart: "2026-08-03" }));
    expect(values.planning).toBe("period");
    expect(values.periodEnd).toBe("");
  });

  test("une fin seule se rouvre en « période », début vide", () => {
    /* Le schéma l'autorise — seuls `planned` et `done` sont contraints — sans
       que ce formulaire ait jamais pu la produire. Sa correction exigera
       désormais un début : un resserrement, pas une perte. Rien n'est effacé
       tant qu'on n'enregistre pas. */
    const values = toActivityFormValues(row({ periodEnd: "2026-08-31" }));
    expect(values.planning).toBe("period");
    expect(values.periodStart).toBe("");
    expect(values.periodEnd).toBe("2026-08-31");
  });

  test("les participants sont restitués tels quels (T3.6)", () => {
    expect(
      toActivityFormValues({
        activityTypeId: TYPE,
        isUnscheduled: false,
        periodStart: "2026-08-03",
        periodEnd: "2026-08-31",
        approachId: null,
        objective: null,
        externalUrl: null,
        participantIds: [PERSON_A, PERSON_B],
      }).participantIds,
    ).toEqual([PERSON_A, PERSON_B]);
  });

  test("l'aller-retour avec `readActivityForm` conserve la saisie", () => {
    const values = toActivityFormValues({
      activityTypeId: TYPE,
      isUnscheduled: false,
      periodStart: "2026-08-03",
      periodEnd: "2026-08-31",
      approachId: APPROACH,
      objective: "Prioriser les chantiers du second semestre.",
      externalUrl: "https://ergonome.example.com/audits/42",
      participantIds: [PERSON_A, PERSON_B],
    });

    // Ce que le panneau rendrait de ces valeurs, relu comme une soumission :
    // le mode coché part avec le formulaire, et les trois champs de dates
    // aussi — deux sont masqués par le CSS, pas retirés du document.
    const resubmitted = readActivityForm(
      form({
        activityTypeId: values.activityTypeId,
        planning: values.planning,
        periodStart: values.periodStart,
        periodEnd: values.periodEnd,
        periodDay: values.periodDay,
        approachId: values.approachId,
        objective: values.objective,
        externalUrl: values.externalUrl,
        participantIds: values.participantIds,
      }),
    );

    expect(resubmitted).toEqual(values);
  });
});

describe("resolveActivityPeriod", () => {
  test("sans ligne existante, c'est la dérivation de T3.3", () => {
    const values = valid({ periodStart: "2026-03-02", periodEnd: "2026-03-31" });
    expect(resolveActivityPeriod(values, TODAY, null)).toEqual(
      deriveActivityState(values, TODAY),
    );
  });

  test("période inchangée : l'état de la ligne est conservé", () => {
    const resolved = resolveActivityPeriod(
      valid({ periodStart: "2026-03-02", periodEnd: "2026-03-31" }),
      TODAY,
      current({ state: "in_progress", periodStart: "2026-03-02", periodEnd: "2026-03-31" }),
    );

    // La dérivation dirait `done` — la période est passée. Elle n'est pas
    // appelée : la période n'a pas bougé.
    expect(resolved.state).toBe("in_progress");
  });

  test("période déplacée : l'état est redérivé", () => {
    const resolved = resolveActivityPeriod(
      valid({ periodStart: "2026-03-02", periodEnd: "2026-03-31" }),
      TODAY,
      current({ state: "planned", periodStart: "2026-12-01", periodEnd: "2026-12-31" }),
    );
    expect(resolved.state).toBe("done");
  });

  test("quitter « à planifier » pour une période est un mouvement de période", () => {
    /* Le schéma n'interdit pas `is_unscheduled` **avec** une période — le
       formulaire ne peut plus la produire depuis que le mode est exclusif
       (31/08/2026), la contrainte
       `activities_planned_requires_period_or_unscheduled` s'en accommode. Une
       telle ligne existe donc potentiellement en base, et décocher sa case
       sans toucher aux dates ne change **que** la case. Sans ce terme dans la
       comparaison, la ligne existante serait rendue telle quelle : la case
       resterait cochée alors qu'on vient de la décocher. */
    const resolved = resolveActivityPeriod(
      valid({
        planning: "period",
        periodStart: "2026-12-01",
        periodEnd: "2026-12-31",
      }),
      TODAY,
      current({
        state: "planned",
        periodStart: "2026-12-01",
        periodEnd: "2026-12-31",
        isUnscheduled: true,
      }),
    );

    expect(resolved).toEqual({
      state: "planned",
      periodStart: "2026-12-01",
      periodEnd: "2026-12-31",
      isUnscheduled: false,
    });
  });

  test("« à planifier » réenregistrée telle quelle rend la ligne existante", () => {
    const existing = current({
      state: "planned",
      periodStart: null,
      periodEnd: null,
      isUnscheduled: true,
    });
    const resolved = resolveActivityPeriod(
      valid({ planning: "unscheduled", periodStart: "", periodEnd: "" }),
      TODAY,
      existing,
    );

    // La dérivation rendrait ici la même chose, à ceci près qu'elle la
    // **refabriquerait** : c'est l'identité qui distingue les deux chemins, et
    // c'est elle qui porte l'arbitrage — la ligne n'est pas recalculée.
    expect(resolved).toBe(existing);
  });

  test("une borne absente et une borne vide sont la même absence", () => {
    // `""` côté formulaire, `null` côté base. Sans normalisation, la période
    // passerait pour déplacée à chaque réenregistrement — et l'état d'une
    // activité prévue sans fin, que T3.5 aurait posé à la main, retomberait
    // sur `in_progress` que la dérivation donne à un début seul.
    const existing = current({
      state: "planned",
      periodStart: "2026-12-01",
      periodEnd: null,
    });
    const resolved = resolveActivityPeriod(
      valid({ periodStart: "2026-12-01", periodEnd: "" }),
      TODAY,
      existing,
    );

    expect(resolved).toBe(existing);
    expect(resolved.state).toBe("planned");
  });
});

describe("activityRowUnchanged", () => {
  /** La ligne en base, et la ligne calculée qui lui correspond exactement. */
  const existing = {
    ...current(),
    activityTypeId: TYPE,
    approachId: APPROACH,
    objective: "Prioriser les chantiers du second semestre.",
    externalUrl: "https://ergonome.example.com/audits/42",
  };

  function calculated(overrides: Partial<ActivityRowInput> = {}) {
    return {
      activityTypeId: existing.activityTypeId,
      approachId: existing.approachId,
      objective: existing.objective,
      state: existing.state,
      periodStart: existing.periodStart,
      periodEnd: existing.periodEnd,
      isUnscheduled: existing.isUnscheduled,
      externalUrl: existing.externalUrl,
      ...overrides,
    };
  }

  test("la re-soumission à l'identique est reconnue", () => {
    expect(activityRowUnchanged(calculated(), existing)).toBe(true);
  });

  test("chacune des huit colonnes suffit à faire une modification", () => {
    const changes: Partial<ActivityRowInput>[] = [
      { activityTypeId: "3f2504e0-4f89-11d3-9a0c-0305e82c3313" },
      { approachId: null },
      { objective: "Un objectif corrigé." },
      { state: "done" },
      { periodStart: "2026-08-04" },
      { periodEnd: null },
      { isUnscheduled: true },
      // La huitième, arrivée le 21/08/2026 : corriger le seul lien vers
      // l'outil est une modification, et sans cette comparaison l'écriture
      // serait silencieusement sautée.
      { externalUrl: null },
    ];

    for (const change of changes) {
      expect(activityRowUnchanged(calculated(change), existing)).toBe(false);
    }
  });
});

/* ==========================================================================
   Le cycle de vie — T3.5
   ========================================================================== */

describe("canTransitionActivity", () => {
  const STATES: ActivityState[] = ["planned", "in_progress", "done", "cancelled"];

  /** Les quatre flèches du diagramme de `docs/03` §4, et aucune de plus. */
  const LEGAL: [ActivityState, ActivityState][] = [
    ["planned", "in_progress"],
    ["in_progress", "done"],
    ["planned", "cancelled"],
    ["in_progress", "cancelled"],
  ];

  test("les quatre transitions du diagramme sont autorisées", () => {
    for (const [from, to] of LEGAL) {
      expect(canTransitionActivity(from, to)).toBe(true);
    }
  });

  test("les douze autres couples sont refusés", () => {
    for (const from of STATES) {
      for (const to of STATES) {
        const legal = LEGAL.some(([f, t]) => f === from && t === to);
        if (!legal) expect(canTransitionActivity(from, to)).toBe(false);
      }
    }
  });

  test("aucun retour en arrière depuis « annulée » ou « terminée »", () => {
    for (const to of STATES) {
      expect(canTransitionActivity("cancelled", to)).toBe(false);
      expect(canTransitionActivity("done", to)).toBe(false);
    }
  });
});

describe("readCancellationReason", () => {
  test("le motif est rogné", () => {
    expect(
      readCancellationReason(form({ cancellationReason: "  Budget retiré.  " })),
    ).toBe("Budget retiré.");
  });

  test("absent du formulaire, il vaut une chaîne vide", () => {
    expect(readCancellationReason(form({}))).toBe("");
  });
});

describe("validateCancellationReason", () => {
  test("un motif vide est refusé", () => {
    expect(validateCancellationReason("")).toBe(
      "Le motif est obligatoire pour annuler une activité.",
    );
  });

  test("un motif renseigné est accepté", () => {
    expect(validateCancellationReason("Le commanditaire a annulé.")).toBeUndefined();
  });
});
