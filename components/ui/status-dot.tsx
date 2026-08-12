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

export function StatusDot({ nature }: { nature: ProjectStatusNature }) {
  return (
    <span
      aria-hidden="true"
      className={`h-2 w-2 flex-none rounded-full ${DOT[nature]}`}
    />
  );
}
