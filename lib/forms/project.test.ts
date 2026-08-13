/**
 * Les tests de la saisie d'un projet.
 *
 * **Aucune base**, comme ceux du produit : c'est la contrepartie d'avoir isolé
 * la validation dans un module pur. Ils énoncent la règle plutôt que de
 * l'observer sur une fixture.
 *
 * Ce qui n'est pas testé ici, et ne doit pas l'être : l'existence du produit,
 * du statut, d'un métier ou d'une personne dans le domaine. C'est tranché par
 * `lib/db/scoped.ts` à l'écriture, et par l'action avant elle.
 */

import { describe, expect, test } from "vitest";

import {
  EMPTY_PROJECT_VALUES,
  isIsoDay,
  isPersonKind,
  isTeamRole,
  parseProjectForm,
  readProjectForm,
  teamFieldName,
  validateProjectForm,
  valueOrNull,
  type ProjectFormValues,
} from "./project";

const PRODUCT = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";
const STATUS = "3f2504e0-4f89-11d3-9a0c-0305e82c3302";
const JOB = "3f2504e0-4f89-11d3-9a0c-0305e82c3303";
const APPROACH = "3f2504e0-4f89-11d3-9a0c-0305e82c3304";
const PERSON = "3f2504e0-4f89-11d3-9a0c-0305e82c3305";
const OTHER_PERSON = "3f2504e0-4f89-11d3-9a0c-0305e82c3306";

/** Des valeurs valides, dont chaque test ne dérange qu'un champ. */
function valid(overrides: Partial<ProjectFormValues> = {}): ProjectFormValues {
  return {
    productId: PRODUCT,
    name: "Refonte du parcours de virement",
    objective: "Réduire l'abandon en cours de saisie.",
    sponsor: "Marc Tellier",
    statusId: STATUS,
    startedOn: "2026-03-01",
    expectedEndOn: "2026-09-30",
    jobIds: [JOB],
    approachIds: [APPROACH],
    team: { [PERSON]: "contributor", [OTHER_PERSON]: "none" },
    newPersonName: "",
    newPersonKind: "stakeholder",
    newPersonRole: "member",
    ...overrides,
  };
}

function form(
  entries: Record<string, string | string[]>,
): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    if (Array.isArray(value)) {
      for (const one of value) data.append(key, one);
    } else {
      data.append(key, value);
    }
  }
  return data;
}

/** La saisie minimale que le formulaire accepte. */
function minimal(): FormData {
  return form({ productId: PRODUCT, name: "Un accompagnement", statusId: STATUS });
}

describe("readProjectForm", () => {
  test("lit les champs du ticket", () => {
    const values = readProjectForm(
      form({
        productId: PRODUCT,
        name: "Refonte",
        objective: "Réduire l'abandon.",
        sponsor: "Marc Tellier",
        statusId: STATUS,
        startedOn: "2026-03-01",
        expectedEndOn: "2026-09-30",
        jobIds: [JOB],
        approachIds: [APPROACH],
        [teamFieldName(PERSON)]: "member",
      }),
    );

    expect(values.productId).toBe(PRODUCT);
    expect(values.name).toBe("Refonte");
    expect(values.objective).toBe("Réduire l'abandon.");
    expect(values.sponsor).toBe("Marc Tellier");
    expect(values.statusId).toBe(STATUS);
    expect(values.startedOn).toBe("2026-03-01");
    expect(values.expectedEndOn).toBe("2026-09-30");
    expect(values.jobIds).toEqual([JOB]);
    expect(values.approachIds).toEqual([APPROACH]);
    expect(values.team).toEqual({ [PERSON]: "member" });
  });

  test("rogne les espaces de chaque champ", () => {
    const values = readProjectForm(
      form({ name: "  Refonte  ", sponsor: "  Marc Tellier  " }),
    );

    expect(values.name).toBe("Refonte");
    expect(values.sponsor).toBe("Marc Tellier");
  });

  test("un formulaire vide rend les valeurs vides, rôles d'ajout compris", () => {
    expect(readProjectForm(new FormData())).toEqual(EMPTY_PROJECT_VALUES);
  });

  test("ne lit rien d'autre que les champs du ticket", () => {
    // Un champ caché ajouté par n'importe qui ne doit pas devenir une colonne.
    const values = readProjectForm(
      form({
        name: "Refonte",
        domainId: "un-autre-domaine",
        id: "forcé",
        lastActivityAt: "2026-01-01",
      }),
    );

    expect(Object.keys(values).sort()).toEqual([
      "approachIds",
      "expectedEndOn",
      "jobIds",
      "name",
      "newPersonKind",
      "newPersonName",
      "newPersonRole",
      "objective",
      "productId",
      "sponsor",
      "startedOn",
      "statusId",
      "team",
    ]);
  });

  test("dédoublonne les métiers et les approches", () => {
    // `project_jobs` porte une contrainte d'unicité : deux cases de même
    // valeur feraient échouer l'écriture entière.
    const values = readProjectForm(
      form({ jobIds: [JOB, JOB], approachIds: [APPROACH, APPROACH] }),
    );

    expect(values.jobIds).toEqual([JOB]);
    expect(values.approachIds).toEqual([APPROACH]);
  });

  test("retient les personnes hors équipe telles quelles", () => {
    // Elles doivent revenir dans le formulaire après un refus, sur leur
    // valeur choisie — « Pas dans l'équipe » est une réponse, pas un silence.
    const values = readProjectForm(
      form({ [teamFieldName(PERSON)]: "none" }),
    );

    expect(values.team).toEqual({ [PERSON]: "none" });
  });
});

describe("validateProjectForm", () => {
  test("accepte une saisie complète", () => {
    expect(validateProjectForm(valid())).toEqual({});
  });

  test("accepte la saisie minimale : produit, nom, statut", () => {
    expect(validateProjectForm(readProjectForm(minimal()))).toEqual({});
  });

  test("refuse un produit absent", () => {
    expect(validateProjectForm(valid({ productId: "" })).productId).toBeDefined();
  });

  test("refuse un produit qui n'a pas la forme d'un identifiant", () => {
    expect(
      validateProjectForm(valid({ productId: "n-importe-quoi" })).productId,
    ).toBeDefined();
  });

  test("refuse un nom vide", () => {
    expect(validateProjectForm(valid({ name: "" })).name).toBeDefined();
  });

  test("refuse un nom qui n'est que des espaces", () => {
    const values = readProjectForm(form({ productId: PRODUCT, name: "   ", statusId: STATUS }));
    expect(validateProjectForm(values).name).toBeDefined();
  });

  test("refuse un statut absent", () => {
    expect(validateProjectForm(valid({ statusId: "" })).statusId).toBeDefined();
  });

  test("refuse un statut qui n'a pas la forme d'un identifiant", () => {
    expect(validateProjectForm(valid({ statusId: "aucun" })).statusId).toBeDefined();
  });

  test("accepte une période absente : elle est facultative", () => {
    expect(
      validateProjectForm(valid({ startedOn: "", expectedEndOn: "" })),
    ).toEqual({});
  });

  test("accepte une période ouverte, sans fin attendue", () => {
    expect(validateProjectForm(valid({ expectedEndOn: "" }))).toEqual({});
  });

  test("refuse une date qui n'existe pas", () => {
    // Le motif seul l'accepterait ; PostgreSQL, non.
    expect(
      validateProjectForm(valid({ startedOn: "2026-02-31" })).startedOn,
    ).toBeDefined();
  });

  test("refuse une date mal formée", () => {
    expect(
      validateProjectForm(valid({ startedOn: "01/03/2026" })).startedOn,
    ).toBeDefined();
  });

  test("refuse une fin antérieure au début", () => {
    expect(
      validateProjectForm(
        valid({ startedOn: "2026-09-30", expectedEndOn: "2026-03-01" }),
      ).expectedEndOn,
    ).toBeDefined();
  });

  test("accepte une fin le jour même du début", () => {
    expect(
      validateProjectForm(
        valid({ startedOn: "2026-03-01", expectedEndOn: "2026-03-01" }),
      ),
    ).toEqual({});
  });

  test("ne compare pas deux dates dont l'une est déjà refusée", () => {
    // Sinon le message d'ordre masquerait celui de la date impossible.
    const errors = validateProjectForm(
      valid({ startedOn: "2026-02-31", expectedEndOn: "2026-01-01" }),
    );

    expect(errors.startedOn).toBeDefined();
    expect(errors.expectedEndOn).toBeUndefined();
  });

  test("refuse un métier qui n'a pas la forme d'un identifiant", () => {
    expect(validateProjectForm(valid({ jobIds: [JOB, "ux"] })).jobIds).toBeDefined();
  });

  test("refuse une approche qui n'a pas la forme d'un identifiant", () => {
    expect(
      validateProjectForm(valid({ approachIds: ["lean"] })).approachIds,
    ).toBeDefined();
  });

  test("accepte l'absence de métier et d'approche", () => {
    expect(validateProjectForm(valid({ jobIds: [], approachIds: [] }))).toEqual({});
  });

  test("refuse une personne d'équipe qui n'a pas la forme d'un identifiant", () => {
    expect(validateProjectForm(valid({ team: { camille: "member" } })).team).toBeDefined();
  });

  test("refuse un rôle d'équipe hors de l'énuméré", () => {
    expect(
      validateProjectForm(valid({ team: { [PERSON]: "chef" } })).team,
    ).toBeDefined();
  });

  test("ignore le bloc d'ajout tant qu'aucun nom n'est saisi", () => {
    expect(
      validateProjectForm(
        valid({ newPersonName: "", newPersonKind: "inconnu", newPersonRole: "chef" }),
      ).newPerson,
    ).toBeUndefined();
  });

  test("refuse un rattachement hors de l'énuméré sur une personne ajoutée", () => {
    expect(
      validateProjectForm(
        valid({ newPersonName: "Marc Tellier", newPersonKind: "externe" }),
      ).newPerson,
    ).toBeDefined();
  });

  test("refuse d'ajouter une personne hors de l'équipe", () => {
    // Ajouter quelqu'un et ne pas l'y mettre n'a pas de sens : le seul chemin
    // vers `persons` passe par une désignation.
    expect(
      validateProjectForm(
        valid({ newPersonName: "Marc Tellier", newPersonRole: "none" }),
      ).newPerson,
    ).toBeDefined();
  });

  test("signale chaque champ fautif séparément", () => {
    const errors = validateProjectForm(
      valid({
        productId: "",
        name: "",
        statusId: "",
        startedOn: "2026-13-01",
        jobIds: ["ux"],
      }),
    );

    expect(Object.keys(errors).sort()).toEqual([
      "jobIds",
      "name",
      "productId",
      "startedOn",
      "statusId",
    ]);
  });
});

describe("isIsoDay", () => {
  test("accepte une date qui existe", () => {
    expect(isIsoDay("2026-03-01")).toBe(true);
    expect(isIsoDay("2024-02-29")).toBe(true);
  });

  test("refuse une date qui n'existe pas", () => {
    expect(isIsoDay("2026-02-31")).toBe(false);
    expect(isIsoDay("2025-02-29")).toBe(false);
    expect(isIsoDay("2026-13-01")).toBe(false);
  });

  test("refuse une date mal formée", () => {
    expect(isIsoDay("2026-3-1")).toBe(false);
    expect(isIsoDay("mars 2026")).toBe(false);
    expect(isIsoDay("")).toBe(false);
  });
});

describe("isTeamRole et isPersonKind", () => {
  test("les rôles d'équipe sont les trois valeurs de l'écran", () => {
    expect(isTeamRole("none")).toBe(true);
    expect(isTeamRole("member")).toBe(true);
    expect(isTeamRole("contributor")).toBe(true);
    expect(isTeamRole("Member")).toBe(false);
    expect(isTeamRole("")).toBe(false);
  });

  test("les rattachements suivent l'énuméré du schéma", () => {
    expect(isPersonKind("center")).toBe(true);
    expect(isPersonKind("stakeholder")).toBe(true);
    expect(isPersonKind("externe")).toBe(false);
  });
});

describe("parseProjectForm", () => {
  test("rend les lignes prêtes à écrire quand la saisie tient", () => {
    const { errors, input } = parseProjectForm(
      form({
        productId: PRODUCT,
        name: "Refonte",
        objective: "Réduire l'abandon.",
        sponsor: "Marc Tellier",
        statusId: STATUS,
        startedOn: "2026-03-01",
        expectedEndOn: "2026-09-30",
        jobIds: [JOB],
        approachIds: [APPROACH],
        [teamFieldName(PERSON)]: "contributor",
      }),
    );

    expect(errors).toEqual({});
    expect(input?.row).toEqual({
      productId: PRODUCT,
      name: "Refonte",
      objective: "Réduire l'abandon.",
      sponsor: "Marc Tellier",
      statusId: STATUS,
      startedOn: "2026-03-01",
      expectedEndOn: "2026-09-30",
    });
    expect(input?.jobIds).toEqual([JOB]);
    expect(input?.approachIds).toEqual([APPROACH]);
    expect(input?.members).toEqual([{ personId: PERSON, isContributor: true }]);
    expect(input?.newPerson).toBeNull();
  });

  test("la ligne ne porte que les colonnes du ticket", () => {
    const { input } = parseProjectForm(minimal());

    expect(Object.keys(input?.row ?? {}).sort()).toEqual([
      "expectedEndOn",
      "name",
      "objective",
      "productId",
      "sponsor",
      "startedOn",
      "statusId",
    ]);
  });

  test("un objectif, un commanditaire et une période vides deviennent `null`", () => {
    const { input } = parseProjectForm(minimal());

    expect(input?.row.objective).toBeNull();
    expect(input?.row.sponsor).toBeNull();
    expect(input?.row.startedOn).toBeNull();
    expect(input?.row.expectedEndOn).toBeNull();
  });

  test("une personne hors équipe ne produit aucune désignation", () => {
    const { input } = parseProjectForm(
      form({
        productId: PRODUCT,
        name: "Refonte",
        statusId: STATUS,
        [teamFieldName(PERSON)]: "none",
        [teamFieldName(OTHER_PERSON)]: "member",
      }),
    );

    expect(input?.members).toEqual([
      { personId: OTHER_PERSON, isContributor: false },
    ]);
  });

  test("membre et contributeur se distinguent (D9)", () => {
    const { input } = parseProjectForm(
      form({
        productId: PRODUCT,
        name: "Refonte",
        statusId: STATUS,
        [teamFieldName(PERSON)]: "member",
        [teamFieldName(OTHER_PERSON)]: "contributor",
      }),
    );

    expect(input?.members).toEqual([
      { personId: PERSON, isContributor: false },
      { personId: OTHER_PERSON, isContributor: true },
    ]);
  });

  test("la personne ajoutée à la main sort du bloc d'ajout", () => {
    const { input } = parseProjectForm(
      form({
        productId: PRODUCT,
        name: "Refonte",
        statusId: STATUS,
        newPersonName: "  Marc Tellier  ",
        newPersonKind: "stakeholder",
        newPersonRole: "contributor",
      }),
    );

    expect(input?.newPerson).toEqual({
      fullName: "Marc Tellier",
      kind: "stakeholder",
      isContributor: true,
    });
  });

  test("`input` est nul dès qu'une erreur est signalée", () => {
    const { errors, input } = parseProjectForm(
      form({ productId: PRODUCT, statusId: STATUS }),
    );

    expect(errors.name).toBeDefined();
    expect(input).toBeNull();
  });

  test("les valeurs saisies survivent au refus", () => {
    // C'est ce qui empêche une équipe de dix personnes d'être à ressaisir au
    // premier nom oublié.
    const { values, input } = parseProjectForm(
      form({
        productId: PRODUCT,
        name: "",
        statusId: STATUS,
        objective: "Réduire l'abandon.",
        jobIds: [JOB],
        [teamFieldName(PERSON)]: "contributor",
      }),
    );

    expect(input).toBeNull();
    expect(values.objective).toBe("Réduire l'abandon.");
    expect(values.jobIds).toEqual([JOB]);
    expect(values.team).toEqual({ [PERSON]: "contributor" });
  });
});

describe("valueOrNull", () => {
  test("un champ vide part en base à `null`, jamais en chaîne vide", () => {
    expect(valueOrNull("")).toBeNull();
  });

  test("un champ saisi part tel quel", () => {
    expect(valueOrNull("Marc Tellier")).toBe("Marc Tellier");
  });
});
