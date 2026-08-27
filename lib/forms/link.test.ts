/**
 * Les tests de la saisie d'un lien déclaré — T6.5.
 *
 * **Aucune base**, comme pour les quatorze autres modules de `lib/forms/` : la
 * validation est isolée dans un module pur, et ces tests énoncent la règle
 * plutôt que de l'observer.
 *
 * Ce qui n'est **pas** testé ici, et ne doit pas l'être : l'existence de
 * l'accompagnement visé, son domaine, son archivage, l'auto-lien et le doublon.
 * Ces cinq questions appartiennent au domaine, donc à l'action et à
 * `lib/db/scoped.ts` — les rejouer ici poserait une seconde autorité, qui
 * divergerait un jour de la première. `app/(app)/projets/[id]/actions.test.ts`
 * les couvre, sur la vraie base et les vraies portes.
 *
 * **Le module est le plus petit du dossier, et ce n'est pas un accident** :
 * `docs/02` §7 veut que relier reste *très peu coûteux*, ce qui se lit d'abord
 * dans le nombre de champs.
 */

import { describe, expect, test } from "vitest";

import {
  EMPTY_LINK_VALUES,
  parseLinkForm,
  readLinkForm,
  toLinkFormValues,
  validateLinkForm,
} from "./link";

const UUID = "6b707afd-5191-4a41-8247-7c8d18d8b707";

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.append(key, value);
  return data;
}

describe("readLinkForm — les deux champs du ticket, et pas un de plus", () => {
  test("les deux champs se lisent et se rognent", () => {
    expect(
      readLinkForm(form({ toProjectId: ` ${UUID} `, reason: "  Parce que  " })),
    ).toEqual({ toProjectId: UUID, reason: "Parce que" });
  });

  test("un champ absent vaut « vide », jamais `undefined`", () => {
    expect(readLinkForm(form({}))).toEqual(EMPTY_LINK_VALUES);
  });

  /**
   * L'action ne construit jamais sa ligne par étalement d'un `FormData` : un
   * champ caché ajouté par n'importe qui deviendrait une colonne écrite.
   * `fromProjectId` est lié côté serveur — il n'entre pas par la saisie.
   */
  test("un champ étranger n'entre pas dans les valeurs", () => {
    const values = readLinkForm(
      form({ toProjectId: UUID, reason: "", fromProjectId: "forgé", id: "forgé" }),
    );
    expect(values).toEqual({ toProjectId: UUID, reason: "" });
  });
});

describe("validateLinkForm", () => {
  test("l'accompagnement visé est obligatoire", () => {
    expect(validateLinkForm({ toProjectId: "", reason: "" }).toProjectId).toBe(
      "L'accompagnement à relier est obligatoire.",
    );
  });

  /**
   * La forme se vérifie avant la base : une colonne `uuid` interrogée avec
   * n'importe quoi rend une erreur PostgreSQL, donc un 500, là où l'on attend un
   * message de champ.
   */
  test("une valeur qui n'est pas un identifiant est refusée avant la base", () => {
    expect(
      validateLinkForm({ toProjectId: "pas-un-uuid", reason: "" }).toProjectId,
    ).toBe("Cet accompagnement n'est pas reconnu.");
  });

  /**
   * **Aucune raison obligatoire** — interdit de la fiche, et `docs/02` §7 dit
   * pourquoi : la saisie doit rester « parfaitement optionnelle ». Une règle de
   * longueur minimale rendrait le geste coûteux, et un geste coûteux ne se fait
   * pas.
   */
  test("la raison n'est jamais obligatoire, ni bornée", () => {
    expect(validateLinkForm({ toProjectId: UUID, reason: "" })).toEqual({});
    expect(validateLinkForm({ toProjectId: UUID, reason: "x" })).toEqual({});
    expect(
      validateLinkForm({ toProjectId: UUID, reason: "x".repeat(5000) }),
    ).toEqual({});
  });
});

describe("parseLinkForm", () => {
  /**
   * La propriété posée en T2.5 : `input` est non nul **si et seulement si**
   * `errors` est vide.
   */
  test("une saisie valide rend la ligne prête à écrire", () => {
    const { errors, input } = parseLinkForm(
      form({ toProjectId: UUID, reason: "Réutilise la grille" }),
    );
    expect(errors).toEqual({});
    expect(input).toEqual({ toProjectId: UUID, reason: "Réutilise la grille" });
  });

  test("une saisie refusée ne rend aucune ligne, et garde ce qui a été tapé", () => {
    const { values, errors, input } = parseLinkForm(form({ reason: "Orpheline" }));
    expect(input).toBeNull();
    expect(errors.toProjectId).toBeTruthy();
    // Vision ne jette jamais en silence ce qui a été tapé.
    expect(values.reason).toBe("Orpheline");
  });

  /**
   * **Une raison vide part à `null`, jamais à `""`.** La colonne est nullable
   * pour cela, et l'écran distingue « rien n'a été dit » de « on a dit rien » :
   * c'est lui qui affiche « Aucune raison donnée ».
   */
  test("une raison vide — ou faite d'espaces — part à `null`", () => {
    expect(parseLinkForm(form({ toProjectId: UUID, reason: "" })).input).toEqual({
      toProjectId: UUID,
      reason: null,
    });
    expect(
      parseLinkForm(form({ toProjectId: UUID, reason: "   " })).input,
    ).toEqual({ toProjectId: UUID, reason: null });
  });
});

describe("toLinkFormValues — le pré-remplissage de la correction", () => {
  test("la ligne enregistrée revient aux deux chaînes du formulaire", () => {
    expect(
      toLinkFormValues({ toProjectId: UUID, reason: "Réutilise la grille" }),
    ).toEqual({ toProjectId: UUID, reason: "Réutilise la grille" });
  });

  /** La colonne est nullable, le `textarea` ne l'est pas. */
  test("une raison nulle devient une chaîne vide", () => {
    expect(toLinkFormValues({ toProjectId: UUID, reason: null })).toEqual({
      toProjectId: UUID,
      reason: "",
    });
  });
});
