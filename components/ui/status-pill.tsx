/**
 * La pastille de statut d'un accompagnement, et le fond des barres de la frise.
 *
 * Elle est colorée par la **nature**, jamais par le libellé : un domaine
 * renomme « En cours », il ne renomme pas `active`. Le libellé est écrit dans
 * la pastille elle-même, si bien que la couleur ne porte jamais seule une
 * information (`docs/06` §11).
 *
 * **Une seule forme pour le statut, partout.** Le point de 8 px qui vivait ici
 * sous le nom de `StatusDot` disait la même chose dans un autre dessin, et la
 * page produit affichait les deux dans deux blocs consécutifs. La pastille est
 * celle que la maquette dessine ; c'est elle qui reste.
 */

import type { ProjectStatusNature } from "@/lib/queries/projects";

/**
 * La table des fonds de barre de la roadmap (`components/products/roadmap.tsx`).
 *
 * **Deux littéraux, et c'est structurel** : Tailwind ne voit que les classes
 * écrites en toutes lettres, et `` `bg-${…}` `` ne produirait aucune règle. Ce
 * que TD.1 a changé n'est donc pas le nombre de tables mais leur **voisinage** —
 * la frise redisait la sienne depuis T5.5, dans un autre fichier, où une couleur
 * pouvait bouger d'un côté seul sans que rien ne le montre. Ici, les deux se
 * lisent d'un même coup d'œil.
 *
 * Elle était en `fill-*` tant que la frise était un SVG. La maquette de la
 * roadmap dessine ses barres en HTML : une barre est un `<div>`, donc un fond.
 *
 * La barre est **décorative** — le statut est écrit en toutes lettres dans la
 * pastille juste à côté (`docs/06` §11).
 */
export const BAND_BG: Record<ProjectStatusNature, string> = {
  framing: "bg-surface-info-base",
  active: "bg-surface-primary-base",
  paused: "bg-surface-neutral-base",
  done: "bg-surface-success-base",
};

/**
 * Les quatre tons de la pastille : un fond teinté, un texte lisible dessus.
 *
 * La maquette n'en dessine que deux — « En cours » et « Terminé ». Les quatre se
 * déduisent de la nature, comme la table au-dessus : un domaine renomme
 * « En cours », il ne renomme pas `active`. Les deux teintes manquantes suivent
 * la même règle — info pour le cadrage, neutre pour la pause.
 *
 * **Les quatre couples sont mesurés** : un texte sur fond teinté est un couple
 * neuf par la position, et le contraste se mesure avant d'être cru.
 * `content-info-dark` sur `surface-info-subtle` 9,17:1 ·
 * `content-primary-dark` sur `surface-primary-lighter` 11,83:1 ·
 * `content-neutral-dark` sur `surface-neutral-lighter` 6,52:1 ·
 * `content-success-dark` sur `surface-success-subtle` 6,42:1.
 *
 * Elle ne s'exporte pas : son seul consommateur est le composant ci-dessous, et
 * une table exportée est une pastille qu'on récrit. `socleLock` garde la
 * signature, celle-ci en garde les couleurs.
 *
 * Les deux `Record` sont **exhaustifs à la compilation** : le jour où l'énuméré
 * s'allonge, ce fichier ne compile plus tant qu'on n'a pas complété les deux.
 */
const PILL: Record<ProjectStatusNature, string> = {
  framing: "bg-surface-info-subtle text-content-info-dark",
  active: "bg-surface-primary-lighter text-content-primary-dark",
  paused: "bg-surface-neutral-lighter text-content-neutral-dark",
  done: "bg-surface-success-subtle text-content-success-dark",
};

/**
 * Un `<span>`, pas un lien : rien ne filtre par statut depuis les cinq écrans
 * qui la rendent, et un faux bouton coûterait un arrêt de tabulation pour rien.
 *
 * `flex-none` est porté par le composant et non par l'appelant : c'est ce qui
 * empêche la colonne de 280 px de la frise de la comprimer, et il est inerte
 * partout où le parent n'est pas un conteneur flex.
 */
export function StatusPill({
  nature,
  label,
}: {
  nature: ProjectStatusNature;
  label: string;
}) {
  return (
    <span
      className={`flex-none rounded-full px-3 py-0.5 text-xs font-semibold ${PILL[nature]}`}
    >
      {label}
    </span>
  );
}
