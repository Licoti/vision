"use client";

/**
 * La coquille d'un panneau de saisie — le voile, le tiroir, l'en-tête, le pied.
 *
 * **Un seul exemplaire, après six.** `activity-panel.tsx` (T3.3),
 * `resource-panel.tsx` (T4.2), `result-panel.tsx` (T4.4),
 * `indicator-panel.tsx` (T5.2), `reading-panel.tsx` (T5.3) et
 * `adoption-panel.tsx` (T5.4) portaient la même coquille, vérifiée identique
 * ligne à ligne : seuls le titre, les sous-titres et l'identifiant du titre
 * changeaient d'un panneau à l'autre.
 *
 * **Le panneau n'est pas un état, c'est une URL** (T3.2, tenu depuis) :
 * l'ouverture est un paramètre de recherche, la page reste rendue derrière et
 * porte `inert`, et les trois sorties — la croix, « Annuler », le voile — sont
 * de simples liens vers la page nue. React 19 améliore progressivement : le
 * formulaire est soumis par le navigateur, l'action s'exécute, et **tout
 * fonctionne sans une ligne de JavaScript**.
 *
 * **Ce que la coquille ne prend pas en charge, et pourquoi.** Chaque panneau
 * garde son `useActionState` : les types d'état diffèrent d'un formulaire à
 * l'autre, et rendre la coquille générique sur eux coûterait plus que la
 * duplication qu'on retire. Elle reçoit donc le dispatch, l'attente, le message
 * et les erreurs — jamais l'action serveur elle-même.
 *
 * **Aucun panneau ne reçoit la session** : un composant client n'a rien à faire
 * d'un contexte de droits. C'est le serveur qui décide ce qu'un formulaire
 * écrit, jamais un champ caché.
 */

import Link from "next/link";
import type { ReactNode } from "react";

import { FocusTrap } from "@/components/ui/focus-trap";
import { FormAlert } from "@/components/ui/form-field";

export function Panel({
  titleId,
  title,
  subtitles,
  closeHref,
  action,
  pending,
  submitLabel,
  message,
  errors,
  children,
}: {
  /** L'identifiant du titre, que `aria-labelledby` du dialogue désigne. */
  titleId: string;
  title: string;
  /**
   * Ce qui rappelle le contexte sous le titre : le nom du produit, celui de
   * l'accompagnement, l'activité rattachée. Le panneau ne quitte pas son
   * contexte, il le rappelle. Le premier porte l'écart au titre, les suivants
   * non — c'est la forme de `result-panel.tsx`, seul à en avoir deux.
   */
  subtitles: readonly string[];
  /** La page nue, sans son paramètre. Les trois sorties y mènent. */
  closeHref: string;
  /** Le dispatch de `useActionState` de l'appelant. */
  action: (formData: FormData) => void;
  pending: boolean;
  submitLabel: string;
  message?: string | undefined;
  errors: Readonly<Record<string, string | undefined>>;
  children: ReactNode;
}) {
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

      {/* Le filet gauche est **plus sombre que celui des contrôles**, et il a été
          mesuré avant d'être cru (T3.2) : `content-neutral-normal` — le choix
          retenu partout depuis T2.3 — tombe à 1,46:1 contre le voile,
          c'est-à-dire une limite de panneau qu'on devine. `content-neutral-dark`
          donne 3,05:1 côté voile et 8,12:1 côté panneau. C'est ce filet qui
          porte la séparation, faute d'ombre : le design system nomme ses
          élévations sans les définir, et l'inventer est interdit (règle 2). */}
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
            {subtitles.map((subtitle, index) => (
              <p
                key={subtitle}
                className={
                  index === 0
                    ? "mt-1 text-xs text-content-neutral-base"
                    : "text-xs text-content-neutral-base"
                }
              >
                {subtitle}
              </p>
            ))}
          </div>

          {/* `autoFocus` est rendu dans le HTML servi : à l'ouverture, le focus
              est déjà dans le panneau, et sur la sortie. C'est la moitié du
              comportement modal qui ne coûte aucun script. */}
          <Link
            href={closeHref}
            autoFocus
            aria-label="Fermer le panneau"
            className="flex size-8 flex-none items-center justify-center rounded-lg border border-content-neutral-normal text-sm text-content-neutral-dark"
          >
            <span aria-hidden="true">✕</span>
          </Link>
        </div>

        {/* Le formulaire enveloppe le pied : « Enregistrer » vivait hors de lui
            avant T3.2, donc hors de toute soumission. */}
        <form action={action} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
            <FormAlert message={message} errors={errors} />
            {children}
          </div>

          {/* Enregistrement sans confirmation intermédiaire (`docs/06` §9) : ce
              qui a été saisi paraît aussitôt dans son bloc, et c'est toute la
              confirmation. */}
          <div className="flex flex-none flex-wrap items-center gap-4 border-t border-surface-neutral-lighter px-6 py-4">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-surface-primary-base px-4 py-2 text-sm font-semibold text-content-neutral-pale disabled:opacity-60"
            >
              {pending ? "Enregistrement…" : submitLabel}
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
