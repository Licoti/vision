/**
 * L'état vide — un écran à part entière, jamais un cas d'erreur (règle 5).
 *
 * Au démarrage, tout Vision sera vide : c'est la première impression du
 * produit (docs/06 §9). Un état vide dit donc deux choses et pas une de
 * moins : ce que le bloc contiendra, et le geste qui l'y met. Il ne s'excuse
 * pas, il ne reproche rien, il n'affiche ni alerte ni couleur
 * d'avertissement.
 *
 * Le trait tireté vient des maquettes : il distingue l'attente d'un contenu
 * d'un bloc plein, sans jamais ressembler à une erreur.
 *
 * **`level` existe parce qu'un titre a un rang, et que le rang dépend de
 * l'appelant** (TD.1, défaut relevé en T2.4 et présent depuis T2.2). Un état
 * vide qui remplit un écran est un `h2` sous le `h1` de `PageHeader` ; le même
 * état vide **dans une `Section`** est contenu par le `h2` de `SectionHeader`,
 * et l'écrire `h2` à son tour en faisait un frère de ce qui le contient. La
 * hiérarchie des titres est vérifiée en audit d'accessibilité, et le centre en
 * fait métier (`docs/06` §11).
 */

import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  level = 2,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  /** 2 quand l'état vide est l'écran, 3 quand il est dans une `Section`. */
  level?: 2 | 3;
}) {
  const Heading = level === 3 ? "h3" : "h2";

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-surface-neutral-lighter bg-surface-neutral-pale px-8 py-11 text-center">
      <Heading className="text-lg font-semibold text-content-neutral-darkest">
        {title}
      </Heading>
      <p className="max-w-160 text-sm leading-175 text-content-neutral-dark">
        {description}
      </p>
      {action}
    </div>
  );
}
