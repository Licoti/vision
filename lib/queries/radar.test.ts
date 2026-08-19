/**
 * Les tests de la géométrie du radar (T5bis.5).
 *
 * **Purs, sans base et sans amorçage** — à la différence de `timeline.test.ts`,
 * qui mêle deux natures parce que son module lit aussi. Celui-ci ne lit rien :
 * il n'y a pas de domaine à cloisonner, donc pas de second domaine à amorcer, et
 * un test d'étanchéité y serait un test qui ne prouve rien.
 *
 * **Ce que ces cas épinglent** : l'origine en haut, le sens horaire, le rang
 * plein qui touche l'axe, le rang nul qui tombe au centre, et le fait que
 * **rien ne déborde**. Décaler l'origine d'un quart de tour doit les faire
 * tomber, eux et rien d'autre.
 */

import { describe, expect, test } from "vitest";

import { axisPoints, polygonPoints, type RadarPoint } from "./radar";

/* Cinquante : le rayon du dessin, dans un `viewBox` de cent. Les coordonnées
   sont alors **aussi** les pourcentages dont le composant place ses libellés,
   ce qui est tout l'intérêt de ce nombre-là. */
const RADIUS = 50;

describe("axisPoints — la toile", () => {
  test("quatre axes tombent sur les quatre points cardinaux du carré", () => {
    /* Le cas le plus lisible du sens de rotation : haut, **droite**, bas,
       gauche. Un sens antihoraire donnerait haut, gauche, bas, droite. */
    expect(axisPoints(4, RADIUS)).toEqual<RadarPoint[]>([
      { x: 50, y: 0 },
      { x: 100, y: 50 },
      { x: 50, y: 100 },
      { x: 0, y: 50 },
    ]);
  });

  test("trois axes : le premier en haut, les deux autres à 120° dans le sens horaire", () => {
    expect(axisPoints(3, RADIUS)).toEqual<RadarPoint[]>([
      { x: 50, y: 0 },
      { x: 93.3013, y: 75 },
      { x: 6.6987, y: 75 },
    ]);
  });

  test("six axes : l'hexagone, pointe en haut", () => {
    expect(axisPoints(6, RADIUS)).toEqual<RadarPoint[]>([
      { x: 50, y: 0 },
      { x: 93.3013, y: 25 },
      { x: 93.3013, y: 75 },
      { x: 50, y: 100 },
      { x: 6.6987, y: 75 },
      { x: 6.6987, y: 25 },
    ]);
  });

  test("un compte nul ou négatif ne rend aucun axe", () => {
    /* Pas une erreur : le seuil de trois appartient à l'écran, et une toile
       vide se demande sans conséquence. */
    expect(axisPoints(0, RADIUS)).toEqual([]);
    expect(axisPoints(-1, RADIUS)).toEqual([]);
  });

  test("le rayon met à l'échelle, il ne déforme pas", () => {
    // Doubler le rayon double l'écart au centre, sur les deux coordonnées.
    expect(axisPoints(3, 100)).toEqual<RadarPoint[]>([
      { x: 100, y: 0 },
      { x: 186.6025, y: 150 },
      { x: 13.3975, y: 150 },
    ]);
  });
});

describe("polygonPoints — le profil", () => {
  test("un rang plein sur chaque axe redessine exactement la toile", () => {
    /* La propriété qui relie les deux fonctions : le contour extérieur du
       dessin **est** `axisPoints`, et un profil au maximum s'y superpose. */
    expect(polygonPoints([4, 4, 4, 4], 4, RADIUS)).toEqual(
      axisPoints(4, RADIUS),
    );
  });

  test("trois rangs inégaux se posent chacun sur son axe", () => {
    /* « Intermédiaire, Expert, Avancé » sur l'échelle de quatre niveaux de la
       fixture : la moitié du rayon vers le haut, le rayon entier vers le bas à
       droite, les trois quarts vers le bas à gauche. */
    expect(polygonPoints([2, 4, 3], 4, RADIUS)).toEqual<RadarPoint[]>([
      { x: 50, y: 25 },
      { x: 93.3013, y: 75 },
      { x: 17.524, y: 68.75 },
    ]);
  });

  test("rien ne déborde de la toile, et rien ne passe derrière le centre", () => {
    /* Un rang au-delà de l'échelle est ramené sur l'axe ; un rang négatif — que
       rien n'interdit à un référentiel mal saisi — tombe au centre plutôt que
       de dessiner un sommet à l'opposé de son axe. */
    expect(polygonPoints([9, -1, 2], 4, RADIUS)).toEqual<RadarPoint[]>([
      { x: 50, y: 0 },
      { x: 50, y: 50 },
      { x: 28.3494, y: 62.5 },
    ]);
  });

  test("une échelle vide met tous les sommets au centre", () => {
    // Pas de division par zéro : la parade de `valueOffset`.
    expect(polygonPoints([1, 2, 3], 0, RADIUS)).toEqual<RadarPoint[]>([
      { x: 50, y: 50 },
      { x: 50, y: 50 },
      { x: 50, y: 50 },
    ]);
  });

  test("aucun rang ne rend aucun sommet", () => {
    expect(polygonPoints([], 4, RADIUS)).toEqual([]);
  });
});
