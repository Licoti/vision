/**
 * Le lien sortant — celui qui quitte Vision.
 *
 * `docs/06` §8 : « un lien qui quitte Vision vers Ergonome, SharePoint ou le
 * portail analytics doit être reconnaissable **avant** le clic ». C'est la
 * traduction visuelle de « centraliser sans remplacer » — Vision assume d'être
 * un point de départ, et ce composant porte cette marque **une fois pour
 * toutes** : le titre d'une ressource (T4.1), puis le lien profond d'un
 * résultat (T4.3), qui le reprend tel quel.
 *
 * **La marque est une forme et un texte, jamais une couleur seule**
 * (`docs/06` §11) : le chevron est lu par l'œil, la mention entre parenthèses
 * par l'assistance. Retirer la couleur au lien ne lui retire ni l'une ni
 * l'autre.
 *
 * **Nouvel onglet** — arbitrage rendu avec l'humain en ouverture de T4.1 :
 * partir consulter un document ne doit pas coûter la page projet, la plus
 * consultée du produit. La mention le dit, plutôt que de le faire découvrir.
 * `rel="noreferrer"` couvre `noopener` dans tous les navigateurs qui portent
 * `target="_blank"` — l'inverse n'est pas vrai.
 *
 * `Link` de Next ne s'applique pas : la cible est hors de l'application, il n'y
 * a rien à précharger ni à router. C'est un `<a>`, et le composant ne porte
 * aucun script.
 */

import type { ReactNode } from "react";

export function ExternalLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className ?? "text-content-info-base underline"}
    >
      {children}
      {/* Collé au texte par une espace insécable : le chevron ne doit pas
          tomber seul en début de ligne, il appartient au lien. */}
      <span aria-hidden="true">{" ↗"}</span>
      <span className="sr-only"> (lien externe, nouvel onglet)</span>
    </a>
  );
}
