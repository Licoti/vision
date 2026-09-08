/**
 * Les tests du formulaire d'invitation — T11.2.
 *
 * **Aucune base.** Ce qui n'est pas testé ici : les six refus du geste — le
 * droit, l'adresse absente, la jumelle, le dernier responsable, l'accès déjà
 * ouvert, l'invitation déjà en attente. Tous demandent de lire la base, et
 * `app/(app)/equipe/actions.test.ts` les couvre un à un.
 */

import { describe, expect, test } from "vitest";

import { domainRole } from "@/lib/db/schema";

import {
  EMPTY_INVITATION_VALUES,
  isInvitationRole,
  parseInvitationForm,
  readInvitationForm,
  validateInvitationForm,
} from "./invitation";

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.append(key, value);
  return data;
}

describe("les rôles viennent du schéma", () => {
  test("les deux valeurs de l'énuméré, et pas une troisième", () => {
    expect(isInvitationRole("domain_manager")).toBe(true);
    expect(isInvitationRole("member")).toBe(true);
    expect(isInvitationRole("super_admin")).toBe(false);
    expect(isInvitationRole("")).toBe(false);
  });

  /* **Le décompte se lit en clair, pas sur la source.** `isInvitationRole`
     dérive de `domainRole.enumValues` : un test qui compterait
     `domainRole.enumValues.length` resterait cohérent si un troisième rôle
     s'ajoutait, donc muet. Celui-ci tombe — c'est l'asymétrie mesurée en T9.5,
     et l'interdit commun de C11 est *aucun troisième rôle*. */
  test("il y en a deux, écrit en clair", () => {
    expect(domainRole.enumValues).toEqual(["domain_manager", "member"]);
  });
});

describe("la lecture ne prend que le champ qu'elle nomme", () => {
  test("le rôle, découpé", () => {
    expect(readInvitationForm(form({ role: "  member  " }))).toEqual({
      role: "member",
    });
  });

  /* **Le refus de l'étalement de `FormData`, mesuré.** `email` est précisément
     la colonne qu'un champ caché atteindrait, quand elle doit venir de la ligne
     relue : elle est copiée, jamais saisie. */
  test("un champ que le formulaire ne déclare pas n'entre pas", () => {
    const values = readInvitationForm(
      form({ role: "member", email: "forge@ailleurs.com", personId: "…" }),
    );

    expect(values).toEqual({ role: "member" });
    expect(Object.keys(values)).toEqual(["role"]);
  });

  test("un champ absent vaut la valeur vide", () => {
    expect(readInvitationForm(new FormData())).toEqual(EMPTY_INVITATION_VALUES);
  });
});

describe("la validation, et son double contrôle", () => {
  test("un rôle manquant est une erreur de champ", () => {
    expect(validateInvitationForm({ role: "" }).role).toBeDefined();
  });

  /* Le second contrôle n'est pas décoratif : le `select` ne propose que deux
     valeurs, mais une soumission forgée porte ce qu'elle veut. Sans lui, la
     valeur descendrait jusqu'à PostgreSQL et rendrait un 500 là où l'on attend
     un message de champ. */
  test("un rôle hors énuméré est une erreur de champ, jamais une levée", () => {
    expect(validateInvitationForm({ role: "super_admin" }).role).toBeDefined();
  });

  test("les deux rôles passent", () => {
    expect(validateInvitationForm({ role: "member" })).toEqual({});
    expect(validateInvitationForm({ role: "domain_manager" })).toEqual({});
  });
});

describe("l'invariant du parse", () => {
  test("`input` est non nul, et `errors` vide", () => {
    const parsed = parseInvitationForm(form({ role: "domain_manager" }));

    expect(parsed.errors).toEqual({});
    expect(parsed.input).toEqual({ role: "domain_manager" });
    expect(parsed.values).toEqual({ role: "domain_manager" });
  });

  test("`input` est nul dès qu'une erreur existe", () => {
    for (const role of ["", "super_admin", "Membre"]) {
      const parsed = parseInvitationForm(form({ role }));

      expect(parsed.input).toBeNull();
      expect(Object.keys(parsed.errors).length).toBeGreaterThan(0);
      /* Les valeurs repartent telles qu'elles ont été saisies : un formulaire
         qui se vide sur une erreur fait retaper ce qui était juste. */
      expect(parsed.values.role).toBe(role);
    }
  });
});
