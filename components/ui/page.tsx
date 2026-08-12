/**
 * Le gabarit de page : rythme vertical, et en-tête d'écran.
 *
 * `PageHeader` porte trois choses au plus — un surtitre facultatif, le titre
 * de l'écran, et le chapeau qui dit à quelle question cet écran répond
 * (docs/06 §2). C'est la discipline centrale du document : un écran qui ne
 * sait pas énoncer sa question n'a pas de raison d'exister.
 *
 * Il accepte en outre une action, à droite du titre — exactement comme
 * `SectionHeader` en accepte une depuis T1.6, et au même endroit : l'action
 * d'un écran doit être visible sans avoir à parcourir son contenu. Elle est
 * facultative, et le reste : la plupart des écrans de Vision se lisent.
 *
 * **Ce composant ne connaît aucun droit.** L'appelant décide s'il passe une
 * action ; c'est là que se lit `can.manageDomain`, et c'est le seul endroit
 * cohérent — un composant de socle qui trancherait un droit le trancherait
 * pour tous les écrans à la fois.
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
  action,
}: {
  overline?: string;
  title: string;
  lead?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-2">
        {overline ? (
          <p className="text-xs font-semibold text-content-neutral-base uppercase">
            {overline}
          </p>
        ) : null}
        <h1 className="text-3xl font-bold text-content-neutral-darkest">{title}</h1>
        {lead ? (
          <p className="max-w-180 text-md leading-200 text-content-neutral-dark">
            {lead}
          </p>
        ) : null}
      </div>
      {action}
    </header>
  );
}
