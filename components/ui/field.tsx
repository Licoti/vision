/**
 * Le champ d'identité — un intitulé, une valeur — et la rangée qui les aligne.
 *
 * C'est la forme du bas de l'en-tête de la page projet dans les maquettes :
 * Entité, Commanditaire, Approches, Équipe, côte à côte sous un filet.
 *
 * L'intitulé est un `<dt>`, la valeur un `<dd>` : quatre couples nom/valeur
 * sont une liste de définitions, et l'écrire ainsi donne à l'assistance le
 * rattachement que la seule mise en page suggère à l'œil (docs/06 §11). Un
 * champ sans valeur ne se masque pas — « Non renseigné » est une information,
 * un trou n'en est pas une.
 */

import type { ReactNode } from "react";

export function FieldRow({ children }: { children: ReactNode }) {
  return (
    <dl className="mt-5 flex flex-wrap gap-x-10 gap-y-6 border-t border-surface-neutral-lighter pt-5">
      {children}
    </dl>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <dt className="text-2xs font-semibold text-content-neutral-base uppercase">
        {label}
      </dt>
      <dd className="text-sm text-content-neutral-dark">{children}</dd>
    </div>
  );
}
