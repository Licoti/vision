/**
 * La section — le bloc de référence des pages de détail : une surface posée
 * sur le fond de la page, un filet, un rayon.
 *
 * `SectionHeader` accepte une action à droite du titre, parce que la maquette
 * la place là et non en pied de bloc : « ajouter une activité » doit être
 * visible sans avoir à parcourir le contenu (docs/06 §5).
 *
 * Le titre est un `h2` : la hiérarchie des titres est vérifiée en audit
 * d'accessibilité, et le centre en fait métier (docs/06 §11).
 */

import type { ReactNode } from "react";

export function Section({ children }: { children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-surface-neutral-lighter bg-surface-neutral-pale px-6 py-5">
      {children}
    </section>
  );
}

export function SectionHeader({
  title,
  note,
  action,
}: {
  title: string;
  note?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-md font-semibold text-content-neutral-darkest">{title}</h2>
        {note ? <span className="text-xs text-content-neutral-base">{note}</span> : null}
      </div>
      {action}
    </div>
  );
}
