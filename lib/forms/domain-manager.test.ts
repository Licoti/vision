/**
 * Les tests de la désignation du premier responsable — T9.4.
 *
 * **Aucune base.** Ce qui n'est pas testé ici : qu'un domaine porte déjà un
 * compte, et le droit du geste. Les deux sont tranchés par l'action sur ce
 * qu'elle reçoit, et `app/domaines/actions.test.ts` les couvre.
 */

import { describe, expect, test } from "vitest";

import {
  addressDomainRefusal,
  emailMatchesAddressDomain,
  EMPTY_DOMAIN_MANAGER_VALUES,
  isEmailAddress,
  parseDomainManagerForm,
  readDomainManagerForm,
  validateDomainManagerForm,
} from "./domain-manager";

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.append(key, value);
  return data;
}

const COMPLETE = { fullName: "Camille Roux", email: "camille@acme.com" };

/** Les noms de domaine de l'entreprise, tels que l'appelant les dérive. */
const ACME = ["acme.com"] as const;

/** Aucun nom de domaine à confronter — le cas d'Entra ID, dont le `tid` n'en est pas un. */
const NONE: readonly string[] = [];

describe("isEmailAddress", () => {
  test("accepte ce qu'un fournisseur rend", () => {
    expect(isEmailAddress("camille@acme.com")).toBe(true);
    expect(isEmailAddress("camille.roux+vision@acme.co.uk")).toBe(true);
  });

  test("refuse ce qu'aucun fournisseur ne rendra", () => {
    expect(isEmailAddress("camille")).toBe(false);
    expect(isEmailAddress("camille@")).toBe(false);
    expect(isEmailAddress("@acme.com")).toBe(false);
    expect(isEmailAddress("camille@@acme.com")).toBe(false);
    expect(isEmailAddress("camille@acme")).toBe(false);
    expect(isEmailAddress("camille@acme.")).toBe(false);
    expect(isEmailAddress("camille roux@acme.com")).toBe(false);
  });
});

describe("readDomainManagerForm", () => {
  test("lit ses deux champs", () => {
    expect(readDomainManagerForm(form(COMPLETE))).toEqual(COMPLETE);
  });

  /* Du même côté que le rapprochement de la règle d'entrée 6, qui compare en
     `lower(email)` : une adresse saisie en capitales rendrait sinon un compte
     injoignable. */
  test("abaisse la casse de l'adresse", () => {
    expect(
      readDomainManagerForm(form({ ...COMPLETE, email: "Camille@ACME.com" }))
        .email,
    ).toBe("camille@acme.com");
  });

  /* `domain_role` est précisément la colonne qu'un champ caché atteindrait. */
  test("ne lit aucun autre champ, fût-il posté", () => {
    const values = readDomainManagerForm(
      form({ ...COMPLETE, domainRole: "member", hasAccess: "false" }),
    );
    expect(Object.keys(values).sort()).toEqual(["email", "fullName"]);
  });
});

describe("validateDomainManagerForm", () => {
  test("une saisie complète ne porte aucune erreur", () => {
    expect(validateDomainManagerForm(COMPLETE, ACME)).toEqual({});
  });

  test("le nom est obligatoire", () => {
    expect(
      validateDomainManagerForm({ ...COMPLETE, fullName: "" }, ACME).fullName,
    ).toContain("obligatoire");
  });

  /* **L'obligation vient du geste, pas de la colonne** : `persons.email` est
     nullable, mais la règle d'entrée 6 rapproche sur l'e-mail au premier
     passage — sans lui, l'accès accordé ne servirait à personne. */
  test("l'adresse est obligatoire, et la raison est dite", () => {
    expect(validateDomainManagerForm({ ...COMPLETE, email: "" }, ACME).email).toContain(
      "obligatoire",
    );
  });

  test("une adresse mal formée est refusée", () => {
    expect(
      validateDomainManagerForm({ ...COMPLETE, email: "camille@acme" }, ACME).email,
    ).toContain("valide");
  });

  test("l'état vide porte les deux erreurs", () => {
    expect(Object.keys(validateDomainManagerForm(EMPTY_DOMAIN_MANAGER_VALUES, ACME)).sort()).toEqual([
      "email",
      "fullName",
    ]);
  });
});

describe("parseDomainManagerForm", () => {
  test("rend la ligne prête à écrire", () => {
    const { errors, input } = parseDomainManagerForm(form(COMPLETE), ACME);
    expect(errors).toEqual({});
    expect(input).toEqual(COMPLETE);
  });

  test("`input` est nul dès qu'une erreur existe", () => {
    expect(
      parseDomainManagerForm(form({ ...COMPLETE, email: "" }), ACME).input,
    ).toBeNull();
  });

  test("la saisie revient telle quelle avec l'erreur", () => {
    const { values } = parseDomainManagerForm(form({ ...COMPLETE, email: "x" }), ACME);
    expect(values.fullName).toBe("Camille Roux");
  });
});

/* ==========================================================================
   La règle d'adresse — arbitrage (11), T11.4
   ========================================================================== */

describe("emailMatchesAddressDomain", () => {
  test("accepte l'adresse du nom de domaine, quelle que soit la casse", () => {
    expect(emailMatchesAddressDomain("user1@mycompany.com", ["mycompany.com"])).toBe(true);
    expect(emailMatchesAddressDomain("User1@MyCompany.COM", ["mycompany.com"])).toBe(true);
    expect(emailMatchesAddressDomain("user1@mycompany.com", ["MyCompany.com"])).toBe(true);
  });

  /* **Refus strict** : ni un sous-domaine, ni un nom qui se termine pareil. Le
     premier est le piège d'un `endsWith`, le second celui d'un `includes`. */
  test("refuse tout ce qui n'est pas exactement ce nom de domaine", () => {
    expect(emailMatchesAddressDomain("user1@mycompany.fr", ["mycompany.com"])).toBe(false);
    expect(emailMatchesAddressDomain("user1@mail.mycompany.com", ["mycompany.com"])).toBe(false);
    expect(emailMatchesAddressDomain("user1@notmycompany.com", ["mycompany.com"])).toBe(false);
    expect(emailMatchesAddressDomain("user1@gmail.com", ["mycompany.com"])).toBe(false);
  });

  /* Une entreprise peut porter plusieurs identités : l'adresse relève de l'une
     ou de l'autre, et le contournement de la limite de l'arbitrage tient là. */
  test("une entreprise à deux noms de domaine accepte les deux", () => {
    const both = ["mycompany.com", "mycompany.fr"];
    expect(emailMatchesAddressDomain("user1@mycompany.fr", both)).toBe(true);
    expect(emailMatchesAddressDomain("user1@mycompany.com", both)).toBe(true);
    expect(emailMatchesAddressDomain("user1@mycompany.de", both)).toBe(false);
  });

  /* **Le cas d'Entra ID** : un `tid` n'est pas un nom de domaine, il n'y a rien
     à confronter, et refuser ici refuserait toute saisie légitime. */
  test("sans nom de domaine à confronter, elle ne refuse rien", () => {
    expect(emailMatchesAddressDomain("user1@n-importe-quoi.com", NONE)).toBe(true);
  });

  test("une chaîne sans arobase ne relève d'aucun nom de domaine", () => {
    expect(emailMatchesAddressDomain("user1", ["mycompany.com"])).toBe(false);
  });
});

describe("la règle d'adresse dans le formulaire", () => {
  test("une adresse hors du nom de domaine est refusée, et le refus le nomme", () => {
    const errors = validateDomainManagerForm(
      { ...COMPLETE, email: "camille@gmail.com" },
      ACME,
    );
    expect(errors.email).toContain("@acme.com");
    expect(errors.fullName).toBeUndefined();
  });

  /* **Sous Entra ID, la même adresse passe** : la liste est vide, la règle ne
     s'applique pas, et c'est la décision du 08/09/2026. */
  test("sans nom de domaine à confronter, la même adresse passe", () => {
    expect(
      validateDomainManagerForm({ ...COMPLETE, email: "camille@gmail.com" }, NONE)
        .email,
    ).toBeUndefined();
  });

  /* L'ordre compte : une adresse mal formée dit sa faute, pas la seconde. */
  test("une adresse mal formée dit sa forme, jamais le nom de domaine", () => {
    expect(
      validateDomainManagerForm({ ...COMPLETE, email: "camille@acme" }, ACME).email,
    ).toContain("valide");
  });

  test("`parseDomainManagerForm` refuse la ligne, et rend la saisie", () => {
    const { errors, input, values } = parseDomainManagerForm(
      form({ ...COMPLETE, email: "camille@gmail.com" }),
      ACME,
    );
    expect(input).toBeNull();
    expect(errors.email).toBeDefined();
    expect(values.email).toBe("camille@gmail.com");
  });

  /* Le refus dit **les deux** noms de domaine quand l'entreprise en a deux :
     sans cela, il commanderait une correction impossible à deviner. */
  test("le refus nomme chacun des noms de domaine attendus", () => {
    const message = addressDomainRefusal(["mycompany.com", "mycompany.fr"]);
    expect(message).toContain("@mycompany.com");
    expect(message).toContain("@mycompany.fr");
  });
});
