"use client";

/**
 * Le corps d'un panneau de saisie — le formulaire, l'alerte, le pied.
 *
 * **Un seul exemplaire, après six.** `activity-panel.tsx` (T3.3),
 * `resource-panel.tsx` (T4.2), `result-panel.tsx` (T4.4),
 * `indicator-panel.tsx` (T5.2), `reading-panel.tsx` (T5.3) et
 * `adoption-panel.tsx` (T5.4) portaient la même coquille, vérifiée identique
 * ligne à ligne : seuls le titre, les sous-titres et l'identifiant du titre
 * changeaient d'un panneau à l'autre.
 *
 * **La coquille l'a quitté en TD.2**, et c'est le seul changement de ce
 * fichier. Le voile, le tiroir, l'en-tête, la croix et le piège de focus vivent
 * désormais dans `DrawerHost`, qui les monte **avant** que le serveur ait
 * répondu — c'est là toute la fluidité qu'on cherchait, et elle n'était pas
 * atteignable tant que chaque panneau portait sa propre coquille. Le titre et
 * les sous-titres remontent avec elle, dans le `DrawerContent` que le résolveur
 * compose. Ce qui reste ici est ce qui a besoin du client : le formulaire.
 *
 * **Le panneau n'est plus une URL, c'est un état** — l'invariant de T3.2 se
 * retourne, et il faut le dire franchement. D30 ne bouge pas : il pose
 * « panneau latéral plutôt que page dédiée, **pour la fluidité et la
 * conservation du contexte** », ce que ce ticket sert plutôt qu'il ne contredit.
 * L'URL d'ouverture reste une adresse valide, simplement le clic ne l'écrit
 * plus. React 19 continue d'améliorer progressivement : sans JavaScript, l'URL
 * ouvre, les sorties ferment, et le formulaire s'enregistre.
 *
 * **Ce que le corps ne prend pas en charge, et pourquoi.** Chaque panneau garde
 * son `useActionState` : les types d'état diffèrent d'un formulaire à l'autre,
 * et rendre le corps générique sur eux coûterait plus que la duplication qu'on
 * retire. Il reçoit donc le dispatch, l'attente, le message et les erreurs —
 * jamais l'action serveur elle-même.
 *
 * **Aucun panneau ne reçoit la session** : un composant client n'a rien à faire
 * d'un contexte de droits. C'est le serveur qui décide ce qu'un formulaire
 * écrit, jamais un champ caché.
 */

import { useEffect, type ReactNode } from "react";

import { ACTION_LINK_SM } from "@/components/ui/action-link";
import { Button } from "@/components/ui/button";
import { DrawerClose, useDrawer } from "@/components/ui/drawer";
import { FormAlert } from "@/components/ui/form-field";

export function Panel({
  action,
  pending,
  submitLabel,
  message,
  errors,
  ok,
  children,
}: {
  /** Le dispatch de `useActionState` de l'appelant. */
  action: (formData: FormData) => void;
  pending: boolean;
  submitLabel: string;
  message?: string | undefined;
  errors: Readonly<Record<string, string | undefined>>;
  /**
   * L'écriture a eu lieu : le panneau se referme.
   *
   * **C'est ce qui remplace le `redirect` des actions** (TD.2). La navigation
   * *était* la fermeture ; elle ne peut plus l'être sans re-rendre la page que
   * ce ticket cherche justement à ne plus re-rendre. L'action revalide, rend
   * son succès, et la coquille se referme — « enregistrement sans confirmation
   * intermédiaire » (`docs/06` §9) est tenu à l'identique : ce qui a été saisi
   * paraît aussitôt dans son bloc, et c'est toute la confirmation.
   */
  ok?: boolean | undefined;
  children: ReactNode;
}) {
  const { close } = useDrawer();

  useEffect(() => {
    if (ok) close();
  }, [ok, close]);

  return (
    /* Le formulaire enveloppe le pied : « Enregistrer » vivait hors de lui
       avant T3.2, donc hors de toute soumission. */
    <form action={action} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
        <FormAlert message={message} errors={errors} />
        {children}
      </div>

      <div className="flex flex-none flex-wrap items-center gap-4 border-t border-surface-neutral-lighter px-6 py-4">
        <Button
          type="submit"
          disabled={pending}
        >
          {pending ? "Enregistrement…" : submitLabel}
        </Button>
        <DrawerClose className={ACTION_LINK_SM}>Annuler</DrawerClose>
      </div>
    </form>
  );
}
