/**
 * Le fil d'Ariane — `Produits › Espace client web › Refonte 2026`.
 *
 * Il matérialise la hiérarchie `Produit › Projet` de docs/04 dans l'interface
 * (docs/06 §7) : un projet ne s'affiche jamais sans son parent. Sa présence
 * sur toute page de détail est ce qui empêche un projet d'être vécu comme un
 * objet isolé.
 *
 * Le dernier maillon est la page courante : il porte `aria-current="page"` et
 * n'est pas un lien — un lien vers soi-même n'est une destination pour
 * personne, et il coûte un arrêt de tabulation inutile.
 *
 * Le séparateur est décoratif : `aria-hidden`, pour qu'une synthèse vocale
 * lise les libellés et non une suite de chevrons.
 */

import Link from "next/link";

import type { NavEntry } from "@/lib/navigation";

/** Un maillon : sans `href`, c'est la page courante. */
export type Crumb = NavEntry | { readonly label: string; readonly href?: undefined };

export function Breadcrumb({ items }: { items: readonly Crumb[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="mb-4">
      <ol className="flex flex-wrap items-center gap-2 text-xs">
        {items.map((item, index) => {
          /* `aria-current` désigne la page, donc le dernier maillon et lui
             seul. Un maillon intermédiaire peut être sans lien — un parent
             dont le nom n'est pas encore lisible — sans devenir pour autant
             la page courante. */
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-2">
              {index > 0 ? (
                <span aria-hidden="true" className="text-content-neutral-light">
                  ›
                </span>
              ) : null}
              {item.href ? (
                <Link href={item.href} className="text-content-neutral-base underline">
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={
                    isLast ? "text-content-neutral-dark" : "text-content-neutral-base"
                  }
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
