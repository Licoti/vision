"use client";

/**
 * Le panneau de confirmation — un panneau qui ne saisit rien.
 *
 * **Aucun écran de plus** (`docs/06` §2) : c'est la page qui l'ouvre, plus un
 * paramètre. La mécanique est celle de T3.2, reprise sans en changer une ligne
 * — le panneau n'est pas un état, c'est une URL. La page reste rendue derrière
 * et porte `inert`, et trois sorties mènent au même endroit : la croix,
 * « Annuler » et le voile, tous trois de simples liens vers la page nue.
 *
 * **Jumeau de `resource-panel.tsx`, formulaire de saisie en moins.** Même
 * `FocusTrap` réutilisé sans modification, même voile, même filet gauche, même
 * `autofocus` sur la sortie, mêmes jetons — aucun couple de couleurs n'est neuf
 * par la position, donc aucune mesure de contraste n'est à refaire, et aucun
 * septième substitut n'est inventé (règle 2, `ETAT.md`).
 *
 * **Pourquoi client, alors qu'il n'a pas un champ.** `useActionState` est le
 * seul moyen de faire revenir un refus avec son message — celui de l'arbitrage
 * (e) de `tickets-C4bis.md`, qui doit dire **combien** d'accompagnements vivants
 * s'opposent au rangement. Un refus qui se contenterait de ne rien faire
 * laisserait l'utilisateur devant un panneau muet.
 *
 * Le texte, lui, reste **serveur** : il arrive par `children`, et la composition
 * RSC fait qu'il ne traverse pas la frontière du bundle.
 *
 * **Il ne connaît aucun droit**, comme les trois panneaux de la page projet : il
 * reçoit une action déjà liée côté serveur, et c'est l'action qui décide de ce
 * qu'elle écrit. Un panneau absent du rendu n'a jamais protégé le point d'entrée
 * HTTP qui l'accompagne.
 */

import Link from "next/link";
import { useActionState, type ReactNode } from "react";

import { FocusTrap } from "@/components/ui/focus-trap";

/**
 * Ce qu'une confirmation refusée rend : un message, et rien d'autre. Il n'y a
 * pas de valeurs à préserver — le panneau n'en saisit aucune.
 */
export type ConfirmState = { message?: string };

export function ConfirmPanel({
  title,
  context,
  closeHref,
  action,
  submitLabel,
  pendingLabel,
  children,
}: {
  title: string;
  /** Ce que le panneau ne quitte pas : le nom de l'objet visé, rappelé. */
  context: string;
  /** La page nue, sans son paramètre. Les trois sorties y mènent. */
  closeHref: string;
  /**
   * L'action serveur, **déjà liée** à l'objet côté serveur. Le panneau ne
   * connaît pas ce qu'il archive.
   */
  action: (state: ConfirmState, formData: FormData) => Promise<ConfirmState>;
  submitLabel: string;
  pendingLabel: string;
  /** Ce que le geste retire de la lecture, et ce qu'il laisse. Rendu serveur. */
  children: ReactNode;
}) {
  const [state, submit, pending] = useActionState(action, {});

  const titleId = "panneau-confirmation-titre";

  return (
    <FocusTrap
      closeHref={closeHref}
      className="fixed inset-0 z-40 flex justify-end"
    >
      {/* Le voile ferme au clic, et **ne prend jamais le focus** : la fermeture
          au clavier passe par la croix et par « Annuler », qui portent l'une et
          l'autre un nom. Un lien sans texte, focalisable, serait un arrêt de
          tabulation muet. */}
      <Link
        href={closeHref}
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 bg-surface-neutral-opacity-distinct"
      />

      {/* Le filet gauche porte la séparation, faute d'ombre : `content-neutral-dark`
          donne 3,05:1 côté voile et 8,12:1 côté panneau, mesure de T3.2 reprise
          telle quelle. */}
      <div
        role="dialog"
        aria-labelledby={titleId}
        className="relative flex h-full w-110 max-w-full flex-col border-l border-content-neutral-dark bg-surface-neutral-pale"
      >
        <div className="flex flex-none items-start justify-between gap-4 border-b border-surface-neutral-lighter px-6 py-5">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-md font-semibold text-content-neutral-darkest"
            >
              {title}
            </h2>
            <p className="mt-1 text-xs text-content-neutral-base">{context}</p>
          </div>

          {/* `autoFocus` est rendu dans le HTML servi : à l'ouverture, le focus
              est déjà dans le panneau, et sur la sortie. */}
          <Link
            href={closeHref}
            autoFocus
            aria-label="Fermer le panneau"
            className="flex size-8 flex-none items-center justify-center rounded-lg border border-content-neutral-normal text-sm text-content-neutral-dark"
          >
            <span aria-hidden="true">✕</span>
          </Link>
        </div>

        <form action={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
            {/* Un refus doit s'entendre, et pas seulement se voir. Il n'y a rien
                à réafficher — le panneau ne saisit rien —, mais il y a quelque
                chose à dire, et c'est toute la raison d'être du bloc. */}
            {state.message ? (
              <div
                role="alert"
                className="rounded-lg border border-content-danger-base bg-surface-danger-lightest px-4 py-3 text-sm font-semibold text-content-danger-dark"
              >
                {state.message}
              </div>
            ) : null}

            {children}
          </div>

          <div className="flex flex-none flex-wrap items-center gap-4 border-t border-surface-neutral-lighter px-6 py-4">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-surface-primary-base px-4 py-2 text-sm font-semibold text-content-neutral-pale disabled:opacity-60"
            >
              {pending ? pendingLabel : submitLabel}
            </button>
            <Link
              href={closeHref}
              className="text-sm font-semibold text-content-primary-dark underline"
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </FocusTrap>
  );
}
