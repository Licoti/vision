/**
 * Les tests de la saisie d'une personne.
 *
 * **Aucune base**, comme les douze fichiers de tests voisins : c'est la
 * contrepartie d'avoir isolé la validation dans un module pur. Ils énoncent la
 * règle plutôt que de l'observer sur une fixture.
 *
 * Trois blocs portent le poids du fichier :
 *   — l'obligation du **nom**, la seule colonne `not null` que ce formulaire
 *     remplisse librement ;
 *   — le **genre**, vérifié parce qu'une soumission forgée porte ce qu'elle veut
 *     et qu'une valeur hors énuméré rendrait un 500 ;
 *   — l'**e-mail** depuis T9.6, dont toute la difficulté tient en un mot :
 *     *facultatif tant qu'aucun accès n'est accordé, obligatoire au moment où
 *     l'accès l'est*. La bascule n'est pas dans le formulaire, elle lui est
 *     **passée** — un champ ne décide pas de sa propre obligation.
 *
 * **Le formulaire d'accès a son bloc à lui**, en bas : un rôle, et deux refus qui
 * ne se ressemblent pas — l'absence, et le mot qui n'est pas un rôle.
 *
 * **Le troisième bloc est parti le 28/08/2026** : il éprouvait le refus de la
 * disponibilité sur un intervenant côté entité, et la disponibilité ne se saisit
 * plus — elle se déduit du nombre d'accompagnements vivants
 * (`lib/availability.ts`). Ce que ce bloc protégeait est éprouvé par
 * `lib/queries/team.test.ts`, sur la lecture.
 *
 * Ce qui n'est pas testé ici, et ne doit pas l'être : l'existence du métier dans
 * le domaine — c'est `assertPreconditions` qui la tranche —, le droit d'écrire
 * un profil, et l'archivage de la personne corrigée. Un module pur ne connaît
 * pas de domaine.
 */

import { describe, expect, test } from "vitest";

import {
  EMPTY_PERSON_ACCESS_VALUES,
  EMPTY_PERSON_VALUES,
  parsePersonAccessForm,
  parsePersonForm,
  PERSON_KIND_LABEL,
  PERSON_ROLE_LABEL,
  PERSON_ROLE_VALUES,
  readPersonAccessForm,
  readPersonForm,
  toPersonAccessFormValues,
  toPersonFormValues,
  validatePersonAccessForm,
  validatePersonForm,
  type PersonFormValues,
} from "./person";

const JOB = "0f9c4c8e-3b1a-4f2d-9c7e-1a2b3c4d5e6f";

/** Une saisie complète et valide, dont chaque test ne change que ce qu'il éprouve. */
function values(overrides: Partial<PersonFormValues> = {}): PersonFormValues {
  return {
    fullName: "Camille Roux",
    email: "camille.roux@acme.com",
    jobId: JOB,
    kind: "center",
    bio: "Product designer, accompagne les équipes du cadrage à la mise en service.",
    ...overrides,
  };
}

/** Un `FormData` tel que le panneau le poste. */
function form(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    formData.set(name, value);
  }
  return formData;
}

describe("readPersonForm", () => {
  test("lit les cinq champs, et rogne les blancs", () => {
    const read = readPersonForm(
      form({
        fullName: "  Sofia Marchand  ",
        email: "  sofia.marchand@acme.com  ",
        jobId: `  ${JOB}  `,
        kind: "  center  ",
        bio: "  Chercheuse.  ",
      }),
    );

    expect(read).toEqual({
      fullName: "Sofia Marchand",
      email: "sofia.marchand@acme.com",
      jobId: JOB,
      kind: "center",
      bio: "Chercheuse.",
    });
  });

  test("l'adresse est abaissée : une saisie en capitales reste joignable", () => {
    /* Le rapprochement de la règle d'entrée 6 compare en `lower()` des deux
       côtés (`lib/auth/entry.ts`) ; ranger la valeur du même côté est ce qui
       rend la comparaison indifférente à ce qui a été tapé. */
    expect(
      readPersonForm(form({ email: "Sofia.Marchand@ACME.com" })).email,
    ).toBe("sofia.marchand@acme.com");
  });

  test("un champ absent vaut vide, jamais `undefined`", () => {
    expect(readPersonForm(new FormData())).toEqual(EMPTY_PERSON_VALUES);
  });

  test("ne lit aucun champ que le formulaire n'a pas", () => {
    /* Un champ caché ajouté par n'importe qui ne doit pas devenir une colonne
       écrite : `source` est posée par la création, et `hasAccess` comme
       `domainRole` **ne s'écrivent que par le formulaire d'accès** (T9.6) — le
       geste est explicite et séparé, et ce test est ce qui l'empêche de se
       glisser ici. */
    const read = readPersonForm(
      form({
        fullName: "Marc Tellier",
        kind: "stakeholder",
        source: "directory",
        hasAccess: "true",
        domainRole: "domain_manager",
      }),
    );

    expect(Object.keys(read).sort()).toEqual([
      "bio",
      "email",
      "fullName",
      "jobId",
      "kind",
    ]);
  });
});

describe("toPersonFormValues", () => {
  test("ramène la ligne aux cinq chaînes, `null` devenant vide", () => {
    expect(
      toPersonFormValues({
        fullName: "Marc Tellier",
        email: null,
        jobId: null,
        kind: "stakeholder",
        bio: null,
      }),
    ).toEqual({
      fullName: "Marc Tellier",
      email: "",
      jobId: "",
      kind: "stakeholder",
      bio: "",
    });
  });
});

describe("validatePersonForm", () => {
  test("une saisie complète ne lève rien", () => {
    expect(validatePersonForm(values())).toEqual({});
  });

  test("le nom est obligatoire", () => {
    expect(validatePersonForm(values({ fullName: "" })).fullName).toBeDefined();
  });

  test("le genre est obligatoire", () => {
    expect(validatePersonForm(values({ kind: "" })).kind).toBeDefined();
  });

  test("un genre hors énuméré est refusé", () => {
    expect(validatePersonForm(values({ kind: "partner" })).kind).toBeDefined();
  });

  test("le métier est facultatif", () => {
    expect(validatePersonForm(values({ jobId: "" })).jobId).toBeUndefined();
  });

  test("un métier qui n'a pas la forme d'un identifiant est refusé", () => {
    expect(
      validatePersonForm(values({ jobId: "n-importe-quoi" })).jobId,
    ).toBeDefined();
  });

  test("la présentation est facultative, et jamais contrainte", () => {
    expect(validatePersonForm(values({ bio: "" })).bio).toBeUndefined();
    expect(validatePersonForm(values({ bio: "x" })).bio).toBeUndefined();
  });

  test("un intervenant côté entité sans métier passe", () => {
    expect(
      validatePersonForm(values({ kind: "stakeholder", jobId: "" })),
    ).toEqual({});
  });

  /* ---- l'e-mail, T9.6 ------------------------------------------------- */

  test("l'adresse est facultative sans accès : D19 sépare référencé de connecté", () => {
    expect(validatePersonForm(values({ email: "" })).email).toBeUndefined();
    /* Le drapeau absent et le drapeau faux disent la même chose : l'obligation
       ne s'invente pas d'un appel qui l'a passée sous silence. */
    expect(validatePersonForm(values({ email: "" }), {}).email).toBeUndefined();
    expect(
      validatePersonForm(values({ email: "" }), { emailRequired: false }).email,
    ).toBeUndefined();
  });

  test("l'adresse devient obligatoire quand la personne a un accès", () => {
    expect(
      validatePersonForm(values({ email: "" }), { emailRequired: true }).email,
    ).toBeDefined();
  });

  test("une adresse qui n'en est pas une est refusée, accès ou non", () => {
    /* La règle de forme est celle de `isEmailAddress`, réemployée depuis
       `lib/forms/domain-manager.ts` : ce qui est écarté est ce qu'aucun
       fournisseur ne rendra jamais. */
    for (const email of ["camille", "camille@", "@acme.com", "a@b", "a@@b.com"]) {
      expect(validatePersonForm(values({ email })).email).toBeDefined();
    }
  });

  test("une adresse permissive passe : le fournisseur est la seule autorité", () => {
    for (const email of [
      "camille+vision@acme.co.uk",
      "c.roux@sous.domaine.acme.com",
    ]) {
      expect(validatePersonForm(values({ email })).email).toBeUndefined();
    }
  });
});

describe("parsePersonForm", () => {
  test("rend la ligne prête à écrire", () => {
    const parsed = parsePersonForm(
      form({
        fullName: "Camille Roux",
        email: "camille.roux@acme.com",
        jobId: JOB,
        kind: "center",
        bio: "Product designer.",
      }),
    );

    expect(parsed.errors).toEqual({});
    expect(parsed.input).toEqual({
      fullName: "Camille Roux",
      email: "camille.roux@acme.com",
      jobId: JOB,
      kind: "center",
      bio: "Product designer.",
    });
  });

  test("les champs vides deviennent `null`, jamais des chaînes vides", () => {
    const parsed = parsePersonForm(
      form({ fullName: "Marc Tellier", kind: "stakeholder" }),
    );

    expect(parsed.input).toEqual({
      fullName: "Marc Tellier",
      email: null,
      jobId: null,
      kind: "stakeholder",
      bio: null,
    });
  });

  test("un intervenant côté entité passe sans métier ni présentation", () => {
    const parsed = parsePersonForm(
      form({ fullName: "Marc Tellier", kind: "stakeholder" }),
    );

    expect(parsed.errors).toEqual({});
    expect(parsed.input?.jobId).toBeNull();
    expect(parsed.input?.bio).toBeNull();
  });

  test("`input` est nul dès qu'une erreur est levée", () => {
    const parsed = parsePersonForm(form({ fullName: "", kind: "center" }));

    expect(parsed.errors.fullName).toBeDefined();
    expect(parsed.input).toBeNull();
  });

  test("la saisie revient telle quelle quand elle est refusée", () => {
    const parsed = parsePersonForm(
      form({ fullName: "", kind: "center", bio: "Une présentation." }),
    );

    expect(parsed.values.bio).toBe("Une présentation.");
  });

  test("l'obligation d'adresse traverse jusqu'à `input`", () => {
    const parsed = parsePersonForm(
      form({ fullName: "Camille Roux", kind: "center" }),
      { emailRequired: true },
    );

    expect(parsed.errors.email).toBeDefined();
    expect(parsed.input).toBeNull();
  });
});

describe("PERSON_KIND_LABEL", () => {
  test("nomme les deux genres, avec le vocabulaire de la liste", () => {
    expect(PERSON_KIND_LABEL.center).toBe("Membre du centre");
    expect(PERSON_KIND_LABEL.stakeholder).toBe("Intervenant côté entité");
  });
});

/* ==========================================================================
   Le formulaire d'accès — T9.6
   ========================================================================== */

describe("readPersonAccessForm", () => {
  test("ne lit que le rôle", () => {
    /* **`hasAccess` n'est pas un champ**, et c'est tout le sujet : il est posé
       par l'action. Un champ caché n'atteint donc rien — pas même la moitié du
       couple que la base refuse de voir seule. */
    const read = readPersonAccessForm(
      form({ role: "  member  ", hasAccess: "true", isActive: "false" }),
    );

    expect(read).toEqual({ role: "member" });
  });

  test("un champ absent vaut vide, jamais `undefined`", () => {
    expect(readPersonAccessForm(new FormData())).toEqual(
      EMPTY_PERSON_ACCESS_VALUES,
    );
  });
});

describe("toPersonAccessFormValues", () => {
  test("ouvre le panneau sur le rôle porté", () => {
    expect(toPersonAccessFormValues({ domainRole: "domain_manager" })).toEqual({
      role: "domain_manager",
    });
  });

  test("aucun rôle porté : la chaîne vide, comme partout dans ce dossier", () => {
    expect(toPersonAccessFormValues({ domainRole: null })).toEqual({ role: "" });
  });
});

describe("validatePersonAccessForm", () => {
  test("les deux rôles de l'énuméré passent, et eux seuls", () => {
    for (const role of PERSON_ROLE_VALUES) {
      expect(validatePersonAccessForm({ role })).toEqual({});
    }
  });

  test("le rôle est obligatoire : un accès sans rôle est refusé par la base", () => {
    expect(validatePersonAccessForm({ role: "" }).role).toBeDefined();
  });

  test("un rôle hors énuméré est refusé plutôt que de rendre un 500", () => {
    /* Le `select` n'en propose que deux, mais une soumission forgée porte ce
       qu'elle veut — y compris `super_admin`, qui n'est pas un rôle de domaine
       et ne peut pas en être un (arbitrage (4) de `tickets-C9.md`). */
    for (const role of ["super_admin", "admin", "owner", "MEMBER"]) {
      expect(validatePersonAccessForm({ role }).role).toBeDefined();
    }
  });
});

describe("parsePersonAccessForm", () => {
  test("rend le rôle prêt à écrire", () => {
    const parsed = parsePersonAccessForm(form({ role: "domain_manager" }));

    expect(parsed.errors).toEqual({});
    expect(parsed.input).toEqual({ role: "domain_manager" });
  });

  test("`input` est nul dès qu'une erreur est levée", () => {
    const parsed = parsePersonAccessForm(form({ role: "owner" }));

    expect(parsed.errors.role).toBeDefined();
    expect(parsed.input).toBeNull();
  });

  test("la saisie revient telle quelle quand elle est refusée", () => {
    expect(parsePersonAccessForm(form({ role: "owner" })).values.role).toBe(
      "owner",
    );
  });
});

describe("PERSON_ROLE_LABEL", () => {
  test("nomme les deux rôles avec les mots du bandeau de session", () => {
    expect(PERSON_ROLE_LABEL.domain_manager).toBe("Responsable de domaine");
    expect(PERSON_ROLE_LABEL.member).toBe("Membre");
  });

  test("deux rôles, et pas un troisième", () => {
    /* Un super administrateur ne vit pas dans `persons` : `persons.domain_id` est
       obligatoire, et ce qui est au-dessus des domaines ne se scope pas. Ce test
       tombe le jour où l'énuméré gagne une valeur — et c'est ce qu'on veut. */
    expect(PERSON_ROLE_VALUES).toEqual(["domain_manager", "member"]);
  });
});
