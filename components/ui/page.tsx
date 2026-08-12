/**
 * Le gabarit de page : rythme vertical, et en-tête d'écran.
 *
 * `PageHeader` porte trois choses au plus — un surtitre facultatif, le titre
 * de l'écran, et le chapeau qui dit à quelle question cet écran répond
 * (docs/06 §2). C'est la discipline centrale du document : un écran qui ne
 * sait pas énoncer sa question n'a pas de raison d'exister.
 *
 * La hiérarchie passe par l'espacement et le poids typographique, pas par la
 * couleur (docs/06 §9).
 */

import type { ReactNode } from "react";

export function Page({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-6">{children}</div>;
}

export function PageHeader({
  overline,
  title,
  lead,
}: {
  overline?: string;
  title: string;
  lead?: string;
}) {
  return (
    <header className="flex flex-col gap-2">
      {overline ? (
        <p className="text-xs font-semibold text-content-neutral-base uppercase">
          {overline}
        </p>
      ) : null}
      <h1 className="text-3xl font-bold text-content-neutral-darkest">{title}</h1>
      {lead ? (
        <p className="max-w-180 text-md leading-200 text-content-neutral-dark">{lead}</p>
      ) : null}
    </header>
  );
}
