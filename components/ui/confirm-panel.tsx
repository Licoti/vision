"use client";

/**
 * Le panneau de confirmation — un panneau qui ne saisit rien.
 *
 * **Aucun écran de plus** (`docs/06` §2) : c'est la page qui l'ouvre, plus un
 * panneau. La page reste rendue derrière et porte `inert`, et trois sorties
 * mènent au même endroit : la croix, « Annuler » et le voile.
 *
 * **Sa coquille l'a quitté en TD.2**, comme celle de `panel.tsx` et pour la
 * même raison : `DrawerHost` la monte avant que le serveur ait répondu. Ce qui
 * reste ici est le formulaire de confirmation, et le titre remonte dans le
 * `DrawerContent` que le résolveur compose.
 *
 * **Jumeau de `panel.tsx`, champs de saisie en moins.** Mêmes jetons, même
 * pied — aucun couple de couleurs n'est neuf par la position, donc aucune
 * mesure de contraste n'est à refaire, et aucun septième substitut n'est
 * inventé (règle 2, `ETAT.md`).
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

import { useActionState, useEffect, type ReactNode } from "react";

import { ACTION_LINK_SM } from "@/components/ui/action-link";
import { Button } from "@/components/ui/button";
import { DrawerClose, useDrawer } from "@/components/ui/drawer";

/**
 * Ce qu'une confirmation refusée rend : un message, et rien d'autre. Il n'y a
 * pas de valeurs à préserver — le panneau n'en saisit aucune.
 */
export type ConfirmState = { message?: string; ok?: boolean };

export function ConfirmPanel({
  action,
  submitLabel,
  pendingLabel,
  children,
}: {
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
  const { close } = useDrawer();

  /* Le geste a eu lieu : le panneau se referme. C'est ce qui remplace le
     `redirect` de l'action (TD.2) — voir la note d'`ok` dans `panel.tsx`. */
  useEffect(() => {
    if (state.ok) close();
  }, [state.ok, close]);

  return (
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
        <Button
          type="submit"
          disabled={pending}
          className="disabled:opacity-60"
        >
          {pending ? pendingLabel : submitLabel}
        </Button>
        <DrawerClose className={ACTION_LINK_SM}>Annuler</DrawerClose>
      </div>
    </form>
  );
}
