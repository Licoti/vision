/**
 * La liste dense — pas une grille de vignettes.
 *
 * docs/06 §4 tranche : à quinze puis cinquante projets, on balaie et on
 * compare ligne à ligne. La comparaison visuelle l'emporte sur l'esthétique
 * des cartes, et la forme s'y plie.
 *
 * Le bandeau de colonnes est un `ListHeader` et non un `<thead>` : ces listes
 * portent des lignes cliquables et des contenus composés, pas des données
 * tabulaires au sens strict. Chaque ligne peut mener quelque part — la
 * descente `Produit › Projet › Activité` ne comporte aucune rupture
 * (docs/06 §7).
 */

import Link from "next/link";
import type { ReactNode } from "react";

export function List({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      role="list"
      aria-label={label}
      className="overflow-hidden rounded-xl border border-surface-neutral-lighter bg-surface-neutral-pale"
    >
      {children}
    </div>
  );
}

/** Le bandeau de colonnes, en capitales. Décoratif pour l'assistance : les
 *  lignes portent elles-mêmes leurs libellés. */
export function ListHeader({ children }: { children: ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className="flex gap-4 bg-surface-neutral-lightest px-5 py-3 text-2xs font-semibold text-content-neutral-base uppercase"
    >
      {children}
    </div>
  );
}

/** Une ligne. Avec `href`, la ligne entière est la cible du clic. */
export function ListRow({ href, children }: { href?: string; children: ReactNode }) {
  const shared =
    "flex items-center gap-4 border-t border-surface-neutral-lighter px-5 py-4 text-sm text-content-neutral-dark";

  return (
    <div role="listitem">
      {href ? (
        <Link href={href} className={shared}>
          {children}
        </Link>
      ) : (
        <div className={shared}>{children}</div>
      )}
    </div>
  );
}
