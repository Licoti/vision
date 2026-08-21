"use client";

/**
 * La navigation principale — le seul composant client de la coquille.
 *
 * Il l'est pour une seule raison : `usePathname()`, qui désigne l'entrée
 * courante. La frontière client s'arrête ici ; la coquille, les gabarits et
 * les sept pages restent des composants serveur.
 *
 * L'entrée courante porte `aria-current="page"` : elle ne se signale pas
 * qu'à la couleur.
 *
 * **Il reçoit le droit, il ne le lit pas** (21/08/2026). L'entrée
 * « Administration » n'est rendue qu'au responsable de domaine, et c'est la
 * coquille — composant serveur — qui lit la session pour le dire. Un composant
 * client n'a rien à faire d'un contexte de droits : la règle de `Panel` et des
 * seize panneaux.
 *
 * **Ce booléen ne protège rien.** `/administration` rend 404 à qui n'administre
 * pas, et les cinq actions redérivent le droit sur ce qu'elles reçoivent. Une
 * entrée masquée n'est pas un droit — elle épargne un cul-de-sac, rien de plus.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isCurrentEntry, mainNavFor } from "@/lib/navigation";

export function MainNav({ canManageDomain }: { canManageDomain: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigation principale">
      <ul className="flex flex-row flex-wrap gap-1 md:flex-col md:flex-nowrap">
        {mainNavFor(canManageDomain).map((entry) => {
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
