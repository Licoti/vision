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
  EMPTY_DOMAIN_VALUES,
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
  test("lit les quatre champs, et normalise l'identité au passage", () => {
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
    });
  });

  /* Un champ caché ajouté par n'importe qui deviendrait une colonne écrite —
     et `status` décide qui peut ouvrir une session. */
  test("ne lit aucun autre champ, fût-il posté", () => {
    const values = readDomainForm(
      form({ ...COMPLETE, status: "suspended", archivedAt: "2026-01-01" }),
    );
    expect(Object.keys(values).sort()).toEqual([
      "competenceCenterName",
      "identityValue",
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

  test("l'état vide porte les deux erreurs de nom et celle de l'identité", () => {
    const errors = validateDomainForm(EMPTY_DOMAIN_VALUES);
    expect(Object.keys(errors).sort()).toEqual([
      "competenceCenterName",
      "identityValue",
      "name",
    ]);
  });
});

describe("parseDomainForm", () => {
  test("rend la ligne prête à écrire quand tout est saisi", () => {
    const { errors, input } = parseDomainForm(form(COMPLETE));
    expect(errors).toEqual({});
    expect(input).toEqual({
      name: "Acme",
      competenceCenterName: "Studio Design",
      provider: "google",
      identityValue: "acme.com",
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
