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
 * La même table, en `fill-*`, pour les bandes de la frise (`timeline.tsx`).
 *
 * **Deux littéraux, et c'est structurel** : Tailwind ne voit que les classes
 * écrites en toutes lettres, et `` `fill-${…}` `` ne produirait aucune règle. Ce
 * que TD.1 change n'est donc pas le nombre de tables mais leur **voisinage** —
 * la frise redisait la sienne depuis T5.5, dans un autre fichier, où une couleur
 * pouvait bouger d'un côté seul sans que rien ne le montre. Ici, les deux se
 * lisent d'un même coup d'œil.
 *
 * Les deux `Record` sont **exhaustifs à la compilation** : le jour où l'énuméré
 * s'allonge, ce fichier ne compile plus tant qu'on n'a pas complété les deux.
 */
export const BAND_FILL: Record<ProjectStatusNature, string> = {
  framing: "fill-surface-info-base",
  active: "fill-surface-primary-base",
  paused: "fill-surface-neutral-base",
  done: "fill-surface-success-base",
};

export function StatusDot({ nature }: { nature: ProjectStatusNature }) {
  return (
    <span
      aria-hidden="true"
      className={`h-2 w-2 flex-none rounded-full ${DOT[nature]}`}
    />
  );
}
