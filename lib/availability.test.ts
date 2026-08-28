/**
 * Les tests de la règle de disponibilité — 28/08/2026.
 *
 * **Aucune base**, comme les treize fichiers de tests de `lib/forms/` : la
 * règle est un module pur, et c'est ce qui permet d'énoncer le seuil plutôt que
 * de l'observer sur une fixture. Les tests de `lib/queries/team.ts` éprouvent
 * l'autre moitié — que le décompte SQL rende bien le nombre attendu, et que le
 * filtre lise les mêmes bornes.
 *
 * **Ce fichier est celui qui tombe quand on déplace le seuil.** C'est sa raison
 * d'être : un seuil arbitré par l'humain doit avoir un endroit où il se lit en
 * clair, et un endroit où il se casse.
 */

import { describe, expect, test } from "vitest";

import {
  availabilityFromProjects,
  PERSON_AVAILABILITY_VALUES,
} from "./availability";

describe("availabilityFromProjects", () => {
  test("aucun accompagnement : disponible", () => {
    expect(availabilityFromProjects(0)).toBe("available");
  });

  /* Les deux bornes de « partiellement », et ce sont elles qui portent le
     seuil : `1` est la première valeur qui quitte « disponible », `2` la
     dernière avant « indisponible ». */
  test("un ou deux accompagnements : partiellement disponible", () => {
    expect(availabilityFromProjects(1)).toBe("partial");
    expect(availabilityFromProjects(2)).toBe("partial");
  });

  test("trois accompagnements et au-delà : indisponible", () => {
    expect(availabilityFromProjects(3)).toBe("unavailable");
    expect(availabilityFromProjects(4)).toBe("unavailable");
    expect(availabilityFromProjects(40)).toBe("unavailable");
  });

  /* La plage la plus haute est **ouverte**, et rien ne doit sortir des trois
     valeurs : un quatrième mot serait un mot que ni la pastille ni le filtre ne
     savent dire. */
  test("aucun décompte ne sort des trois valeurs", () => {
    for (let count = 0; count <= 50; count += 1) {
      expect(PERSON_AVAILABILITY_VALUES).toContain(
        availabilityFromProjects(count),
      );
    }
  });
});
