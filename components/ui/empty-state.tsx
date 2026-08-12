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
 */

import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-surface-neutral-lighter bg-surface-neutral-pale px-8 py-11 text-center">
      <h2 className="text-lg font-semibold text-content-neutral-darkest">{title}</h2>
      <p className="max-w-160 text-sm leading-175 text-content-neutral-dark">
        {description}
      </p>
      {action}
    </div>
  );
}
