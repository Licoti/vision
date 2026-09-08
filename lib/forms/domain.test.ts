/**
 * Les tests de la saisie d'une entreprise cliente et de ses identités — T9.4.
 *
 * **Aucune base**, comme pour les vingt autres modules de `lib/forms/`.
 *
 * Ce qui n'est pas testé ici, et ne doit pas l'être : l'autorité d'écrire au
 * dessus des domaines, et le fait qu'un couple (fournisseur, valeur) soit déjà
 * pris. Le premier est tranché par `requireSuperAdmin`, le second par la base ;
 * `app/domaines/actions.test.ts` les couvre tous deux. Ce module ne connaît que
 * du texte.
 */

import { describe, expect, test } from "vitest";

import {
  addressDomainsOf,
  EMPTY_DOMAIN_VALUES,
  EMPTY_OWN_DOMAIN_VALUES,
  parseOwnDomainForm,
  readOwnDomainForm,
  toOwnDomainFormValues,
  validateOwnDomainForm,
  IDENTITY_PROVIDERS,
  isIdentityProvider,
  normalizeIdentityValue,
  parseDomainForm,
  parseDomainIdentityForm,
  readDomainForm,
  readDomainIdentityForm,
  validateDomainForm,
} from "./domain";

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.append(key, value);
  return data;
}

const COMPLETE = {
  name: "Acme",
  competenceCenterName: "Studio Design",
  provider: "google",
  identityValue: "acme.com",
  description: "L'entreprise qui fournit tout au coyote.",
  managerFullName: "Camille Roux",
  managerEmail: "camille@acme.com",
};

describe("normalizeIdentityValue", () => {
  /* **La mesure qui compte.** Sans elle, `ACME.COM` et `acme.com` seraient deux
     couples distincts pour `domain_identities_provider_value_unique`, et la même
     entreprise ouvrirait sur deux domaines Vision — l'étanchéité que la
     contrainte existe pour tenir. */
  test("abaisse la casse : deux graphies ne font pas deux entreprises", () => {
    expect(normalizeIdentityValue("ACME.COM")).toBe("acme.com");
    expect(normalizeIdentityValue("Acme.Com")).toBe("acme.com");
  });

  test("rogne les espaces de bord", () => {
    expect(normalizeIdentityValue("  acme.com  ")).toBe("acme.com");
  });
});

describe("isIdentityProvider", () => {
  test("reconnaît les deux fournisseurs du schéma", () => {
    expect(isIdentityProvider("google")).toBe(true);
    expect(isIdentityProvider("microsoft")).toBe(true);
  });

  test("refuse tout autre nom", () => {
    expect(isIdentityProvider("okta")).toBe(false);
    expect(isIdentityProvider("")).toBe(false);
  });

  test("les deux fournisseurs sont offerts, Google en tête", () => {
    expect(IDENTITY_PROVIDERS).toEqual(["google", "microsoft"]);
  });
});

describe("readDomainForm", () => {
  test("lit les sept champs, et normalise l'identité au passage", () => {
    expect(
      readDomainForm(form({ ...COMPLETE, identityValue: "  ACME.com " })),
    ).toEqual({ ...COMPLETE, identityValue: "acme.com" });
  });

  test("un champ absent vaut vide", () => {
    expect(readDomainForm(form({}))).toEqual({
      name: "",
      competenceCenterName: "",
      provider: "",
      identityValue: "",
      description: "",
      managerFullName: "",
      managerEmail: "",
    });
  });

  /* Du même côté que le rapprochement de la règle d'entrée 6 et que la règle
     d'adresse : une saisie en capitales ne doit rendre un compte ni
     injoignable, ni refusé à tort. */
  test("abaisse la casse de l'adresse de l'administrateur", () => {
    expect(
      readDomainForm(form({ ...COMPLETE, managerEmail: "Camille@ACME.com" }))
        .managerEmail,
    ).toBe("camille@acme.com");
  });

  /* Un champ caché ajouté par n'importe qui deviendrait une colonne écrite —
     et `status` décide qui peut ouvrir une session. */
  test("ne lit aucun autre champ, fût-il posté", () => {
    const values = readDomainForm(
      form({ ...COMPLETE, status: "suspended", archivedAt: "2026-01-01" }),
    );
    expect(Object.keys(values).sort()).toEqual([
      "competenceCenterName",
      "description",
      "identityValue",
      "managerEmail",
      "managerFullName",
      "name",
      "provider",
    ]);
  });
});

describe("validateDomainForm", () => {
  test("une saisie complète ne porte aucune erreur", () => {
    expect(validateDomainForm(COMPLETE)).toEqual({});
  });

  test("le nom de l'entreprise est obligatoire", () => {
    expect(validateDomainForm({ ...COMPLETE, name: "" }).name).toContain(
      "obligatoire",
    );
  });

  test("le libellé du centre est obligatoire", () => {
    expect(
      validateDomainForm({ ...COMPLETE, competenceCenterName: "" })
        .competenceCenterName,
    ).toContain("obligatoire");
  });

  /* **C'est la règle qui fait qu'un domaine créé est atteignable** : sans
     identité, ni `hd` ni `tid` ne le désigne (règles d'entrée 3 et 5). */
  test("l'identité vérifiée est obligatoire", () => {
    expect(
      validateDomainForm({ ...COMPLETE, identityValue: "" }).identityValue,
    ).toContain("obligatoire");
  });

  test("une identité qui porte une espace est refusée", () => {
    expect(
      validateDomainForm({ ...COMPLETE, identityValue: "acme corp" })
        .identityValue,
    ).toContain("espace");
  });

  test("un fournisseur forgé est refusé", () => {
    expect(
      validateDomainForm({ ...COMPLETE, provider: "okta" }).provider,
    ).toContain("n'existe pas");
  });

  test("l'état vide porte cinq erreurs, et la description n'en est pas", () => {
    const errors = validateDomainForm(EMPTY_DOMAIN_VALUES);
    expect(Object.keys(errors).sort()).toEqual([
      "competenceCenterName",
      "identityValue",
      "managerEmail",
      "managerFullName",
      "name",
    ]);
  });

  /* ------------------------------------------------------------------------
     L'administrateur, saisi dans le même formulaire — T11.4
     ------------------------------------------------------------------------ */

  test("la description est facultative, et elle seule", () => {
    expect(validateDomainForm({ ...COMPLETE, description: "" })).toEqual({});
  });

  test("le nom de l'administrateur est obligatoire", () => {
    expect(
      validateDomainForm({ ...COMPLETE, managerFullName: "" }).managerFullName,
    ).toContain("obligatoire");
  });

  test("son adresse est obligatoire", () => {
    expect(
      validateDomainForm({ ...COMPLETE, managerEmail: "" }).managerEmail,
    ).toContain("obligatoire");
  });

  /* **La règle d'adresse, confrontée à l'identité du même formulaire** — c'est
     l'arbitrage (11), et c'est la mesure 2 de la fiche, en amont de l'action. */
  test("une adresse hors du nom de domaine saisi est refusée", () => {
    expect(
      validateDomainForm({ ...COMPLETE, managerEmail: "camille@gmail.com" })
        .managerEmail,
    ).toContain("@acme.com");
  });

  test("elle suit l'identité saisie, jamais une valeur figée", () => {
    expect(
      validateDomainForm({
        ...COMPLETE,
        identityValue: "autre.example",
        managerEmail: "camille@autre.example",
      }),
    ).toEqual({});
  });

  /* **Le `tid` d'Entra n'est pas un nom de domaine** : il n'y a rien à
     confronter, et la règle ne s'applique pas (décision du 08/09/2026). */
  test("sous Microsoft, l'adresse n'est pas confrontée au locataire", () => {
    expect(
      validateDomainForm({
        ...COMPLETE,
        provider: "microsoft",
        identityValue: "9188040d-6c67-4c5b-b112-36a304b66dad",
        managerEmail: "camille@acme.com",
      }),
    ).toEqual({});
  });

  /* Une identité fautive ne dit qu'une faute : refuser l'adresse en plus
     commanderait une correction que la première rend inutile. */
  test("une identité vide ne fait pas refuser l'adresse par surcroît", () => {
    const errors = validateDomainForm({ ...COMPLETE, identityValue: "" });
    expect(errors.identityValue).toBeDefined();
    expect(errors.managerEmail).toBeUndefined();
  });
});

describe("parseDomainForm", () => {
  test("rend la ligne prête à écrire quand tout est saisi", () => {
    const { errors, input } = parseDomainForm(form(COMPLETE));
    expect(errors).toEqual({});
    expect(input).toEqual({
      name: "Acme",
      competenceCenterName: "Studio Design",
      description: "L'entreprise qui fournit tout au coyote.",
      provider: "google",
      identityValue: "acme.com",
      manager: { fullName: "Camille Roux", email: "camille@acme.com" },
    });
  });

  test("`input` est nul dès qu'une erreur existe", () => {
    expect(parseDomainForm(form({ ...COMPLETE, name: "" })).input).toBeNull();
  });

  /* Le rétrécissement **prouve** le type au compilateur : un `as` tiendrait
     aujourd'hui et mentirait le jour où l'énuméré changerait. */
  test("un fournisseur forgé ne produit aucune ligne", () => {
    expect(
      parseDomainForm(form({ ...COMPLETE, provider: "okta" })).input,
    ).toBeNull();
  });

  test("la saisie revient telle quelle avec l'erreur", () => {
    const { values } = parseDomainForm(form({ ...COMPLETE, name: "" }));
    expect(values.competenceCenterName).toBe("Studio Design");
  });

  /* **Nulle plutôt que vide** : une description non saisie n'est pas une phrase
     vide, et la colonne est `null`able. */
  test("une description non saisie descend nulle en base", () => {
    const { input } = parseDomainForm(form({ ...COMPLETE, description: "" }));
    expect(input?.description).toBeNull();
  });
});

/* ==========================================================================
   Les noms de domaine dont une adresse peut relever — T11.4
   ========================================================================== */

describe("addressDomainsOf", () => {
  /* **Un `hd` est un nom de domaine ; un `tid` ne l'est pas.** Ce test est le
     seul endroit qui dit pourquoi la règle d'adresse ne s'applique pas sous
     Entra ID : aucune adresse réelle ne porte un identifiant de locataire. */
  test("ne retient que les identités Google", () => {
    expect(
      addressDomainsOf([
        { provider: "google", value: "acme.com" },
        { provider: "microsoft", value: "9188040d-6c67-4c5b-b112-36a304b66dad" },
      ]),
    ).toEqual(["acme.com"]);
  });

  test("une entreprise à deux identités Google rend les deux", () => {
    expect(
      addressDomainsOf([
        { provider: "google", value: "acme.com" },
        { provider: "google", value: "acme.fr" },
      ]),
    ).toEqual(["acme.com", "acme.fr"]);
  });

  test("sans identité Google, il n'y a rien à confronter", () => {
    expect(addressDomainsOf([])).toEqual([]);
    expect(
      addressDomainsOf([{ provider: "microsoft", value: "un-tid" }]),
    ).toEqual([]);
  });
});

describe("le formulaire d'une identité seule", () => {
  test("lit ses deux champs, normalisés", () => {
    expect(
      readDomainIdentityForm(form({ provider: "microsoft", value: " ABC-123 " })),
    ).toEqual({ provider: "microsoft", value: "abc-123" });
  });

  test("rend la ligne prête à écrire", () => {
    const { input } = parseDomainIdentityForm(
      form({ provider: "microsoft", value: "ABC-123" }),
    );
    expect(input).toEqual({ provider: "microsoft", value: "abc-123" });
  });

  test("porte la même règle que la création — une identité vide est refusée", () => {
    const { errors, input } = parseDomainIdentityForm(
      form({ provider: "google", value: "" }),
    );
    expect(errors.value).toContain("obligatoire");
    expect(input).toBeNull();
  });
});

/* ==========================================================================
   Le formulaire du domaine vu par son administrateur — T11.5
   ========================================================================== */

describe("le formulaire du domaine courant", () => {
  test("lit ses trois champs, rognés — et pas un de plus", () => {
    const values = readOwnDomainForm(
      form({
        name: "  Acme  ",
        competenceCenterName: " Studio Design ",
        description: " Ce que fait Acme. ",
        /* **La colonne que la charge forgée viserait.** Elle n'est pas lue :
           la fonction nomme ses trois champs, elle n'étale pas un `FormData`. */
        status: "suspended",
        archivedAt: "2026-09-08",
      }),
    );

    expect(values).toEqual({
      name: "Acme",
      competenceCenterName: "Studio Design",
      description: "Ce que fait Acme.",
    });
  });

  test("les deux noms sont obligatoires, et la description ne l'est pas", () => {
    const errors = validateOwnDomainForm(EMPTY_OWN_DOMAIN_VALUES);

    expect(errors.name).toContain("obligatoire");
    expect(errors.competenceCenterName).toContain("obligatoire");
    expect(errors.description).toBeUndefined();
    expect(Object.keys(errors)).toHaveLength(2);
  });

  /**
   * **Les deux phrases viennent de la création, et c'est le but de
   * l'extraction** : `validateNaming` les tient pour les deux formulaires, et
   * deux copies divergeraient un jour.
   */
  test("le refus est mot pour mot celui de la création", () => {
    const atCreation = validateDomainForm({
      ...EMPTY_DOMAIN_VALUES,
      provider: "google",
      identityValue: "acme.com",
    });
    const here = validateOwnDomainForm(EMPTY_OWN_DOMAIN_VALUES);

    expect(here.name).toBe(atCreation.name);
    expect(here.competenceCenterName).toBe(atCreation.competenceCenterName);
  });

  test("rend les trois colonnes prêtes à écrire", () => {
    const { errors, input } = parseOwnDomainForm(
      form({
        name: "Acme",
        competenceCenterName: "Studio Design",
        description: "Ce que fait Acme.",
      }),
    );

    expect(errors).toEqual({});
    expect(input).toEqual({
      name: "Acme",
      competenceCenterName: "Studio Design",
      description: "Ce que fait Acme.",
    });
  });

  test("une description effacée descend nulle, jamais une phrase vide", () => {
    const { input } = parseOwnDomainForm(
      form({ name: "Acme", competenceCenterName: "Studio", description: "" }),
    );
    expect(input?.description).toBeNull();
  });

  test("une saisie refusée ne rend aucune ligne — l'invariant de T2.5", () => {
    const { values, errors, input } = parseOwnDomainForm(
      form({ name: "", competenceCenterName: "Studio", description: "" }),
    );

    expect(input).toBeNull();
    expect(errors.name).toBeDefined();
    /* La saisie revient telle quelle : le panneau la réaffiche. */
    expect(values.competenceCenterName).toBe("Studio");
  });

  test("la ligne enregistrée se ramène aux trois chaînes du panneau", () => {
    expect(
      toOwnDomainFormValues({
        name: "Acme",
        competenceCenterName: "Studio Design",
        description: null,
      }),
    ).toEqual({
      name: "Acme",
      competenceCenterName: "Studio Design",
      description: "",
    });
  });
});
