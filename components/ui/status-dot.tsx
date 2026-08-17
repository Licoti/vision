/**
 * La pastille de statut d'un accompagnement.
 *
 * Elle est colorée par la **nature**, jamais par le libellé : un domaine
 * renomme « En cours », il ne renomme pas `active`. Elle est décorative — le
 * libellé est écrit juste à côté, et la couleur ne porte jamais seule une
 * information (docs/06 §11).
 *
 * La table vivait dans la page produit depuis T2.2, en attendant un second
 * appelant réel. La liste transverse des projets est ce second appelant.
 */

import type { ProjectStatusNature } from "@/lib/queries/projects";

const DOT: Record<ProjectStatusNature, string> = {
  framing: "bg-surface-info-base",
  active: "bg-surface-primary-base",
  paused: "bg-surface-neutral-base",
  done: "bg-surface-success-base",
};

/**
 * La même table, en `bg-*`, pour les barres de la roadmap (`roadmap.tsx`).
 *
 * **Trois littéraux, et c'est structurel** : Tailwind ne voit que les classes
 * écrites en toutes lettres, et `` `bg-${…}` `` ne produirait aucune règle. Ce
 * que TD.1 a changé n'est donc pas le nombre de tables mais leur **voisinage** —
 * la frise redisait la sienne depuis T5.5, dans un autre fichier, où une couleur
 * pouvait bouger d'un côté seul sans que rien ne le montre. Ici, les trois se
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
 * La pastille de statut de la roadmap : un fond teinté, un texte lisible dessus.
 *
 * La maquette n'en dessine que deux — « En cours » et « Terminé ». Les quatre se
 * déduisent de la nature, comme les deux tables au-dessus : un domaine renomme
 * « En cours », il ne renomme pas `active`. Les deux teintes manquantes suivent
 * la même règle que `DOT` — info pour le cadrage, neutre pour la pause.
 *
 * **Les quatre couples sont mesurés** : un texte sur fond teinté est un couple
 * neuf par la position, et le contraste se mesure avant d'être cru.
 * `content-info-dark` sur `surface-info-subtle` 9,17:1 ·
 * `content-primary-dark` sur `surface-primary-lighter` 11,83:1 ·
 * `content-neutral-dark` sur `surface-neutral-lighter` 6,52:1 ·
 * `content-success-dark` sur `surface-success-subtle` 6,42:1.
 *
 * Les trois `Record` sont **exhaustifs à la compilation** : le jour où l'énuméré
 * s'allonge, ce fichier ne compile plus tant qu'on n'a pas complété les trois.
 */
export const STATUS_PILL: Record<ProjectStatusNature, string> = {
  framing: "bg-surface-info-subtle text-content-info-dark",
  active: "bg-surface-primary-lighter text-content-primary-dark",
  paused: "bg-surface-neutral-lighter text-content-neutral-dark",
  done: "bg-surface-success-subtle text-content-success-dark",
};

export function StatusDot({ nature }: { nature: ProjectStatusNature }) {
  return (
    <span
      aria-hidden="true"
      className={`h-2 w-2 flex-none rounded-full ${DOT[nature]}`}
    />
  );
}
