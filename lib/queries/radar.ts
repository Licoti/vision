/**
 * La géométrie du **radar des compétences** — T5bis.5.
 *
 * **Un module pur** : ni base, ni Next, ni React. Il ne lit rien, il place. Il
 * vit néanmoins dans `lib/queries/` — le périmètre de la fiche — sur le
 * précédent exact de la section « L'échelle » de `lib/queries/timeline.ts` : les
 * positions se calculent **là où elles s'éprouvent par un test**, et un
 * cosinus égrené au milieu d'un JSX ne s'éprouve pas. C'est la seule raison
 * d'être de ce fichier, et l'invariant que la fiche pose en toutes lettres —
 * **aucune trigonométrie dans le composant**.
 *
 * **Ce module ne calcule aucun indice** (D39, garde-fou 2). Il ne rend ni aire,
 * ni moyenne, ni total, ni pourcentage de profil : une position n'est pas un
 * indice, pas plus ici que sur la frise — elle situe un rang **déclaré** entre
 * le centre et le bord, et c'est le lecteur qui regarde. La valeur, elle, reste
 * écrite en toutes lettres à côté du dessin (garde-fou 6).
 *
 * **L'échelle du rayon est celle du référentiel du domaine**, jamais celle de la
 * personne : `maxRank` arrive du plus haut rang de `skill_levels`. Le rapporter
 * au plus haut rang *de la personne* dessinerait un polygone plein pour un
 * profil « Intermédiaire partout » — une normalisation calculée par Vision, et
 * un dessin qui ment.
 *
 * **Le repère est celui du `viewBox`, et c'est délibéré** : boîte carrée de côté
 * `2 × radius`, origine en haut à gauche, centre en `(radius, radius)`, ordonnées
 * comptées vers le bas. Le composant reçoit donc des coordonnées prêtes à poser,
 * sans un décalage à faire. C'est l'arbitrage (f) de `tickets-C5bis.md` : la
 * frise s'est privée de `viewBox` parce que ses abscisses étaient des
 * pourcentages d'une largeur inconnue ; un radar est un carré de taille fixe,
 * ses coordonnées sont des nombres.
 */

/** Un sommet, dans le repère du `viewBox`. */
export type RadarPoint = { x: number; y: number };

/**
 * Quatre décimales, la règle de `timeline.ts` : le HTML servi doit être
 * **stable d'un rendu à l'autre** pour se relire et se tester. Un tiers non
 * arrondi rendrait dix-sept chiffres dans l'attribut `points`, et la moindre
 * différence de plateforme se lirait dans le balisage.
 *
 * Le zéro négatif est ramené au zéro : `Math.round` le conserve, et un
 * « -0 » écrit dans un attribut serait un défaut de lecture pour rien.
 */
function round(value: number): number {
  const rounded = Math.round(value * 10_000) / 10_000;
  return rounded === 0 ? 0 : rounded;
}

/**
 * Le point d'un axe sur le bord du carré, et sa direction.
 *
 * **Le premier axe pointe vers le haut, les suivants tournent dans le sens
 * horaire.** C'est le signe du cosinus qui le produit : le SVG compte ses
 * ordonnées vers le bas, donc « vers le haut » se retranche du centre.
 */
function pointAt(angle: number, radius: number, ratio: number): RadarPoint {
  return {
    x: round(radius + ratio * radius * Math.sin(angle)),
    y: round(radius - ratio * radius * Math.cos(angle)),
  };
}

/**
 * Les extrémités des axes — la toile, sur laquelle le profil se pose.
 *
 * `count` est le nombre de compétences **que la personne déclare** (garde-fou
 * 5) : les axes changent donc d'une personne à l'autre, ce qui rend la
 * superposition et la comparaison visuelle structurellement impossibles. Ce
 * n'est pas une précaution d'affichage, c'est la propriété qui borne la
 * dérogation.
 *
 * Rend `[]` pour un compte nul ou négatif. Le **seuil de trois axes**
 * n'appartient pas à cette fonction : trois est le minimum d'un polygone, et
 * c'est l'écran qui décide de ne rien dessiner — un état, pas une géométrie.
 */
export function axisPoints(count: number, radius: number): RadarPoint[] {
  if (count <= 0) return [];

  const points: RadarPoint[] = [];
  for (let index = 0; index < count; index += 1) {
    points.push(pointAt((index * 2 * Math.PI) / count, radius, 1));
  }
  return points;
}

/**
 * Les sommets du profil : un rang déclaré par axe, dans l'ordre des axes.
 *
 * Le rayon est proportionnel — `rank / maxRank` —, si bien qu'un rang plein
 * touche l'axe et qu'un rang nul tombe au centre. **Tout rang hors échelle est
 * ramené dedans** : rien ne déborde de la toile, comme rien ne déborde de l'axe
 * de la frise (`clampIndex`).
 *
 * **Une échelle vide met tout au centre** plutôt que de diviser par zéro — la
 * parade de `valueOffset`, et le seul cas où le dessin ne dit rien : un domaine
 * dont le référentiel de niveaux serait vide n'a aucun rang à situer.
 *
 * `ranks` doit être **dans l'ordre des axes** : c'est l'appelant qui tient
 * l'ordre de la fiche — rang décroissant puis libellé, celui de
 * `findPersonDetail` —, et le désaccorder ferait dessiner un profil qui n'est
 * celui de personne.
 */
export function polygonPoints(
  ranks: readonly number[],
  maxRank: number,
  radius: number,
): RadarPoint[] {
  const count = ranks.length;
  if (count <= 0) return [];

  return ranks.map((rank, index) => {
    const ratio =
      maxRank <= 0 ? 0 : Math.min(Math.max(rank, 0), maxRank) / maxRank;
    return pointAt((index * 2 * Math.PI) / count, radius, ratio);
  });
}
