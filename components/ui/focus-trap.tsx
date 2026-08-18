"use client";

/**
 * Le piège de focus d'un panneau modal.
 *
 * L'ordre de lecture de ce fichier compte : ce qui suit n'est pas ce qui fait
 * marcher le panneau ouvert **par son URL**. Celui-là se ferme par trois liens,
 * son contenu de page porte `inert`, et le focus entre dedans par l'attribut
 * HTML `autofocus` — tout cela tient sans une ligne de JavaScript, et continue
 * de tenir si celui-ci ne s'exécute pas.
 *
 * Ce que ce composant ajoute, et qui n'a **aucun équivalent HTML** : la
 * tabulation reboucle à l'intérieur du panneau. `tabindex` réordonne les
 * arrêts, il n'en fait pas un cycle — après le dernier, le focus sort dans la
 * barre du navigateur, revient en haut du document et traverse la coquille de
 * navigation, qui est pourtant derrière le voile. Fermer ce cycle demande
 * d'écouter la touche, il n'y a pas d'autre voie.
 *
 * **`Échap` ferme par rappel depuis TD.2, et non plus par navigation.** Il
 * poussait `closeHref` dans le routeur ; il appelle désormais la fermeture de
 * `DrawerHost`, qui est la même sortie que la croix, « Annuler » et le voile.
 * L'import de `next/navigation` disparaît avec elle : ce composant ne navigue
 * plus.
 *
 * Ses enfants restent rendus **sur le serveur** — ils sont passés en
 * `children`, et la composition RSC fait que le référentiel lu en base ne
 * traverse jamais la frontière du client.
 *
 * `aria-modal` est posé **ici et pas dans le balisage servi**, pour une raison
 * de véracité : il annonce à l'assistance que l'extérieur du dialogue est hors
 * d'atteinte. C'est faux tant que rien ne piège le focus, et vrai à partir du
 * moment où ce composant s'exécute. L'attribut apparaît donc exactement quand
 * il devient vrai.
 */

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Ce qui prend le focus au clavier. La forme négative des `:not([disabled])`
 * est volontaire : « Enregistrer » est inactif le temps d'une soumission en
 * cours depuis T3.3, et un cycle qui s'arrêterait dessus serait un cul-de-sac.
 */
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function FocusTrap({
  onEscape,
  className,
  children,
}: {
  /** Ce que fait la touche Échap : la même sortie que les trois visibles. */
  onEscape: () => void;
  className?: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = root.current;
    if (!container) return;

    /* Le dialogue devient vraiment modal au moment où ce composant tourne. */
    const dialog = container.querySelector('[role="dialog"]');
    dialog?.setAttribute("aria-modal", "true");

    /* Relu à chaque touche plutôt que mémorisé : les arrêts de tabulation d'un
       formulaire changent — un champ désactivé, un bloc conditionnel — et une
       liste figée à l'ouverture aurait vieilli sans prévenir. */
    function stops(): HTMLElement[] {
      return Array.from(
        container!.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((node) => node.tabIndex !== -1 && node.getClientRects().length > 0);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onEscape();
        return;
      }
      if (event.key !== "Tab") return;

      const items = stops();
      if (items.length === 0) return;

      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement;
      const inside = active instanceof Node && container!.contains(active);

      /* Trois cas seulement, et le troisième est celui qu'on oublie : le focus
         parti ailleurs — un clic dans la barre latérale, derrière le voile —
         est ramené dans le panneau plutôt que laissé à errer. */
      if (!inside) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      dialog?.removeAttribute("aria-modal");
    };
  }, [onEscape]);

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
