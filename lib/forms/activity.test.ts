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
  deriveActivityState,
  parseActivityForm,
  readActivityForm,
  validateActivityForm,
  type ActivityFormValues,
} from "./activity";

const TYPE = "3f2504e0-4f89-11d3-9a0c-0305e82c3311";
const APPROACH = "3f2504e0-4f89-11d3-9a0c-0305e82c3312";

/** Le jour de référence de tous les tests de dérivation. */
const TODAY = "2026-08-13";

/** Des valeurs valides, dont chaque test ne dérange qu'un champ. */
function valid(overrides: Partial<ActivityFormValues> = {}): ActivityFormValues {
  return {
    activityTypeId: TYPE,
    isUnscheduled: false,
    periodStart: "2026-08-03",
    periodEnd: "2026-08-31",
    approachId: APPROACH,
    objective: "Prioriser les chantiers du second semestre.",
    ...overrides,
  };
}

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.append(key, value);
  return data;
}

/** La saisie minimale que le panneau accepte : un type et une période. */
function minimal(): FormData {
  return form({
    activityTypeId: TYPE,
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
        isUnscheduled: "on",
        periodStart: "2026-08-03",
        periodEnd: "2026-08-31",
        approachId: APPROACH,
        objective: "Prioriser les chantiers.",
      }),
    );

    expect(values).toEqual({
      activityTypeId: TYPE,
      isUnscheduled: true,
      periodStart: "2026-08-03",
      periodEnd: "2026-08-31",
      approachId: APPROACH,
      objective: "Prioriser les chantiers.",
    });
  });

  test("une case absente vaut « non cochée » : son absence est sa valeur", () => {
    expect(readActivityForm(minimal()).isUnscheduled).toBe(false);
  });

  test("rogne les espaces autour des valeurs", () => {
    const values = readActivityForm(
      form({ activityTypeId: `  ${TYPE}  `, objective: "  Un objectif  " }),
    );
    expect(values.activityTypeId).toBe(TYPE);
    expect(values.objective).toBe("Un objectif");
  });

  test("un champ absent vaut la chaîne vide", () => {
    expect(readActivityForm(new FormData())).toEqual(EMPTY_ACTIVITY_VALUES);
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

  test("le type est obligatoire (D16)", () => {
    const errors = validateActivityForm(valid({ activityTypeId: "" }));
    expect(errors.activityTypeId).toBeDefined();
  });

  test("un type qui n'a pas la forme d'un identifiant est refusé", () => {
    const errors = validateActivityForm(valid({ activityTypeId: "atelier" }));
    expect(errors.activityTypeId).toBeDefined();
  });

  test("une période absente sans « à planifier » est refusée", () => {
    const errors = validateActivityForm(
      valid({ periodStart: "", periodEnd: "" }),
    );
    expect(errors.periodStart).toBeDefined();
  });

  test("une fin antérieure au début est refusée", () => {
    const errors = validateActivityForm(
      valid({ periodStart: "2026-08-31", periodEnd: "2026-08-03" }),
    );
    expect(errors.periodEnd).toBeDefined();
  });

  test("« à planifier » cochée avec une période est refusée", () => {
    const errors = validateActivityForm(valid({ isUnscheduled: true }));
    expect(errors.isUnscheduled).toBeDefined();
  });

  test("« à planifier » cochée avec un seul début est refusée aussi", () => {
    const errors = validateActivityForm(
      valid({ isUnscheduled: true, periodEnd: "" }),
    );
    expect(errors.isUnscheduled).toBeDefined();
  });

  test("une fin sans début est refusée", () => {
    const errors = validateActivityForm(valid({ periodStart: "" }));
    expect(errors.periodEnd).toBeDefined();
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

  test("« à planifier » seule est acceptée", () => {
    const errors = validateActivityForm(
      valid({ isUnscheduled: true, periodStart: "", periodEnd: "" }),
    );
    expect(errors).toEqual({});
  });

  test("un début seul est accepté", () => {
    const errors = validateActivityForm(valid({ periodEnd: "" }));
    expect(errors).toEqual({});
  });

  test("l'approche et l'objectif sont facultatifs", () => {
    const errors = validateActivityForm(
      valid({ approachId: "", objective: "" }),
    );
    expect(errors).toEqual({});
  });
});

/* ==========================================================================
   La dérivation — le cœur du ticket
   ========================================================================== */

describe("deriveActivityState", () => {
  test("« à planifier » donne une activité prévue, sans aucune date", () => {
    expect(
      deriveActivityState(
        valid({ isUnscheduled: true, periodStart: "", periodEnd: "" }),
        TODAY,
      ),
    ).toEqual({
      state: "planned",
      periodStart: null,
      periodEnd: null,
      isUnscheduled: true,
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
        periodStart: "2026-03-02",
        periodEnd: "2026-03-31",
        approachId: APPROACH,
        objective: "Vérifier la compréhension du parcours.",
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

  test("« à planifier » écrit une activité prévue sans date", () => {
    const { input } = parseActivityForm(
      form({ activityTypeId: TYPE, isUnscheduled: "on" }),
      TODAY,
    );
    expect(input).toMatchObject({
      state: "planned",
      periodStart: null,
      periodEnd: null,
      isUnscheduled: true,
    });
  });
});
