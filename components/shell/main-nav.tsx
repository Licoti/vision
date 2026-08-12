"use client";

/**
 * La navigation principale — le seul composant client de la coquille.
 *
 * Il l'est pour une seule raison : `usePathname()`, qui désigne l'entrée
 * courante. La frontière client s'arrête ici ; la coquille, les gabarits et
 * les six pages restent des composants serveur.
 *
 * L'entrée courante porte `aria-current="page"` : elle ne se signale pas
 * qu'à la couleur.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isCurrentEntry, MAIN_NAV } from "@/lib/navigation";

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigation principale">
      <ul className="flex flex-row flex-wrap gap-1 md:flex-col md:flex-nowrap">
        {MAIN_NAV.map((entry) => {
          const current = isCurrentEntry(entry, pathname);
          return (
            <li key={entry.href}>
              <Link
                href={entry.href}
                aria-current={current ? "page" : undefined}
                className={[
                  "block rounded-lg px-4 py-2 text-sm",
                  /* Le contour de focus par défaut est `border/focus` (#196de3) :
                     mesuré à 2,87:1 sur le fond primaire de la barre latérale,
                     sous les 3:1 exigés d'un indicateur de focus. Sur ce fond, et
                     là seulement, il passe au token clair — 13,7:1. */
                  "focus-visible:outline-content-neutral-pale",
                  current
                    ? "bg-surface-primary-normal font-semibold text-content-neutral-pale"
                    : "font-medium text-surface-primary-soft",
                ].join(" ")}
              >
                {entry.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
