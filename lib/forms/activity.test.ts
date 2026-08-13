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

  test("en correction, l'état survit à une modification hors période", () => {
    const { input } = parseActivityForm(
      form({
        activityTypeId: TYPE,
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
      }),
    ).toEqual({
      activityTypeId: TYPE,
      isUnscheduled: true,
      periodStart: "",
      periodEnd: "",
      approachId: "",
      objective: "",
    });
  });

  test("l'aller-retour avec `readActivityForm` conserve la saisie", () => {
    const values = toActivityFormValues({
      activityTypeId: TYPE,
      isUnscheduled: false,
      periodStart: "2026-08-03",
      periodEnd: "2026-08-31",
      approachId: APPROACH,
      objective: "Prioriser les chantiers du second semestre.",
    });

    // Ce que le panneau rendrait de ces valeurs, relu comme une soumission :
    // la case absente quand elle n'est pas cochée, comme le fait le navigateur.
    const resubmitted = readActivityForm(
      form({
        activityTypeId: values.activityTypeId,
        periodStart: values.periodStart,
        periodEnd: values.periodEnd,
        approachId: values.approachId,
        objective: values.objective,
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

  test("la case décochée seule est un mouvement de période", () => {
    /* Le schéma n'interdit pas `is_unscheduled` **avec** une période — le
       formulaire le refuse (T3.3), la contrainte
       `activities_planned_requires_period_or_unscheduled` s'en accommode. Une
       telle ligne existe donc potentiellement en base, et décocher sa case
       sans toucher aux dates ne change **que** la case. Sans ce terme dans la
       comparaison, la ligne existante serait rendue telle quelle : la case
       resterait cochée alors qu'on vient de la décocher. */
    const resolved = resolveActivityPeriod(
      valid({
        isUnscheduled: false,
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
      valid({ isUnscheduled: true, periodStart: "", periodEnd: "" }),
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
      ...overrides,
    };
  }

  test("la re-soumission à l'identique est reconnue", () => {
    expect(activityRowUnchanged(calculated(), existing)).toBe(true);
  });

  test("chacune des sept colonnes suffit à faire une modification", () => {
    const changes: Partial<ActivityRowInput>[] = [
      { activityTypeId: "3f2504e0-4f89-11d3-9a0c-0305e82c3313" },
      { approachId: null },
      { objective: "Un objectif corrigé." },
      { state: "done" },
      { periodStart: "2026-08-04" },
      { periodEnd: null },
      { isUnscheduled: true },
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
