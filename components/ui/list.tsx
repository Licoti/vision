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
 *
 * **`flush` retire la carte, jamais les lignes** (17/08/2026) : une liste posée
 * dans un `Block` de la page produit n'a pas à porter sa propre surface, son
 * filet et son rayon — une carte dans une carte est le défaut visuel que la
 * cohérence des trois blocs corrigeait. Il ne reste alors que les lignes, leurs
 * filets de séparation et leur rythme vertical, exactement ceux des lignes de
 * la roadmap juste en dessous. Il **se passe aux deux** — la liste pour la
 * surface, la ligne pour le retrait horizontal —, faute d'un contexte : ce
 * module est rendu sur le serveur, et `createContext` demanderait un
 * `"use client"` que rien d'autre ici ne justifie. Le défaut est `false`, si
 * bien qu'aucun autre appelant ne bouge.
 */

import Link from "next/link";
import type { ReactNode } from "react";

export function List({
  label,
  flush = false,
  children,
}: {
  label: string;
  /** `true` quand la liste est posée dans un bloc qui porte déjà la carte. */
  flush?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      role="list"
      aria-label={label}
      className={
        flush
          ? undefined
          : "overflow-hidden rounded-xl border border-surface-neutral-lighter bg-surface-neutral-pale"
      }
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
export function ListRow({
  href,
  flush = false,
  children,
}: {
  href?: string;
  /** `true` dans une liste `flush` : la ligne s'aligne sur le padding du bloc. */
  flush?: boolean;
  children: ReactNode;
}) {
  const shared = [
    "flex items-center gap-4 border-t border-surface-neutral-lighter py-4 text-sm text-content-neutral-dark",
    flush ? "" : "px-5",
  ]
    .filter(Boolean)
    .join(" ");

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
