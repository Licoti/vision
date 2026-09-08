/**
 * Les tests de la désignation du premier responsable — T9.4.
 *
 * **Aucune base.** Ce qui n'est pas testé ici : qu'un domaine porte déjà un
 * compte, et le droit du geste. Les deux sont tranchés par l'action sur ce
 * qu'elle reçoit, et `app/domaines/actions.test.ts` les couvre.
 */

import { describe, expect, test } from "vitest";

import {
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
    expect(validateDomainManagerForm(COMPLETE)).toEqual({});
  });

  test("le nom est obligatoire", () => {
    expect(
      validateDomainManagerForm({ ...COMPLETE, fullName: "" }).fullName,
    ).toContain("obligatoire");
  });

  /* **L'obligation vient du geste, pas de la colonne** : `persons.email` est
     nullable, mais la règle d'entrée 6 rapproche sur l'e-mail au premier
     passage — sans lui, l'accès accordé ne servirait à personne. */
  test("l'adresse est obligatoire, et la raison est dite", () => {
    expect(validateDomainManagerForm({ ...COMPLETE, email: "" }).email).toContain(
      "obligatoire",
    );
  });

  test("une adresse mal formée est refusée", () => {
    expect(
      validateDomainManagerForm({ ...COMPLETE, email: "camille@acme" }).email,
    ).toContain("valide");
  });

  test("l'état vide porte les deux erreurs", () => {
    expect(Object.keys(validateDomainManagerForm(EMPTY_DOMAIN_MANAGER_VALUES)).sort()).toEqual([
      "email",
      "fullName",
    ]);
  });
});

describe("parseDomainManagerForm", () => {
  test("rend la ligne prête à écrire", () => {
    const { errors, input } = parseDomainManagerForm(form(COMPLETE));
    expect(errors).toEqual({});
    expect(input).toEqual(COMPLETE);
  });

  test("`input` est nul dès qu'une erreur existe", () => {
    expect(
      parseDomainManagerForm(form({ ...COMPLETE, email: "" })).input,
    ).toBeNull();
  });

  test("la saisie revient telle quelle avec l'erreur", () => {
    const { values } = parseDomainManagerForm(form({ ...COMPLETE, email: "x" }));
    expect(values.fullName).toBe("Camille Roux");
  });
});
