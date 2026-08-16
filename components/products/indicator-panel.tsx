"use client";

/**
 * Le panneau qui saisit un indicateur — **le premier écran d'écriture de la page
 * produit depuis T2.5**, et le premier objet de C5 livré avec ses trois gestes
 * (arbitrage (a) de `tickets-C5.md`).
 *
 * **Aucun écran de plus** (`docs/06` §2) : c'est la page du produit, plus un
 * paramètre. La mécanique est celle de T3.2, reprise **sans en changer une
 * ligne** — le panneau n'est pas un état, c'est une URL. `?indicateur=nouvel`
 * crée, `?indicateur=<identifiant>` corrige ; la page reste rendue derrière et
 * porte `inert`, et trois sorties mènent au même endroit : la croix,
 * « Annuler » et le voile, tous trois de simples liens vers la page nue.
 *
 * **Troisième jumeau d'`activity-panel.tsx`**, après celui de la ressource et
 * celui du résultat, et volontairement. Même frontière client —
 * `useActionState` est le seul moyen de faire revenir une saisie refusée avec
 * ses valeurs —, même `FocusTrap` **réutilisé sans modification**, même
 * `autofocus` sur la sortie, mêmes jetons. React 19 améliore progressivement :
 * le formulaire est soumis par le navigateur, l'action s'exécute, et **tout
 * fonctionne sans une ligne de JavaScript**.
 *
 * Il ne reçoit pas la session : un composant client n'a rien à faire d'un
 * contexte de droits. Il reçoit ce qu'il affiche — le nom du produit — et une
 * action qui ne connaît pas l'identifiant du produit. **C'est le serveur qui
 * décide ce que ce formulaire écrit, jamais un champ caché.**
 *
 * **Un seul formulaire pour les deux gestes**, comme le panneau d'activité
 * depuis T3.4 : mêmes champs, mêmes règles, mêmes refus. Ce qui change tient en
 * trois propriétés — le titre, le libellé du bouton, les valeurs initiales — et
 * le panneau ne sait pas lequel des deux gestes il sert : c'est l'action liée
 * qui le décide, côté serveur.
 *
 * **Le sens de lecture ne juge rien.** Il est proposé en toutes lettres parce
 * qu'il dit dans quel sens la série d'une courbe se lit (T5.6) ; aucune couleur,
 * aucun pictogramme, aucun mot appliqué à une valeur ne s'en tire — D39 interdit
 * tout indice calculé par Vision pour qualifier un produit.
 */

import Link from "next/link";
import { useActionState, type ReactNode } from "react";

import { FocusTrap } from "@/components/ui/focus-trap";
import { formatIndicatorDirection } from "@/lib/format";
import {
  EMPTY_INDICATOR_VALUES,
  INDICATOR_DIRECTION_VALUES,
  type IndicatorFormState,
  type IndicatorFormValues,
} from "@/lib/forms/indicator";

/**
 * Le filet des contrôles, plus sombre que celui des blocs.
 *
 * La raison est mesurée depuis T2.3 et reprise à chaque formulaire : la bordure
 * d'un champ est la limite d'un composant d'interface, elle se mesure à 3:1, et
 * aucun jeton `border-*` du design system ne l'atteint sur ce fond.
 * `content-neutral-normal` y arrive à 3,88:1. **Aucun septième substitut n'est
 * inventé** — la règle posée en T2.3 et jamais enfreinte depuis.
 */
const CONTROL =
  "w-full rounded-lg border bg-surface-neutral-pale px-3 py-2 text-sm text-content-neutral-darkest";

/** Rouge en erreur, gris sinon. Le message, lui, ne dépend jamais de la couleur. */
function borderOf(error: string | undefined): string {
  return error ? "border-content-danger-base" : "border-content-neutral-normal";
}

export function IndicatorPanel({
  productName,
  closeHref,
  action,
  title = "Ajouter un indicateur",
  submitLabel = "Ajouter l'indicateur",
  initial = EMPTY_INDICATOR_VALUES,
}: {
  productName: string;
  /** La page du produit, sans son paramètre. Les trois sorties y mènent. */
  closeHref: string;
  /**
   * L'action serveur, **déjà liée** au produit côté serveur — et à l'indicateur
   * en correction. Le panneau ne connaît pas ce qu'il écrit.
   */
  action: (
    state: IndicatorFormState,
    formData: FormData,
  ) => Promise<IndicatorFormState>;
  /** « Ajouter un indicateur » en création, « Modifier l'indicateur » sinon. */
  title?: string;
  submitLabel?: string;
  /**
   * Les valeurs de l'indicateur corrigé. C'est l'**état initial** de
   * `useActionState` : un refus le remplace par ce qui a été tapé, si bien que
   * les deux chemins ont rigoureusement la même forme.
   */
  initial?: IndicatorFormValues;
}) {
  const [state, submit, pending] = useActionState(action, {
    values: initial,
    errors: {},
  });

  const titleId = "panneau-indicateur-titre";
  const values = state.values;
  const errors = state.errors;
  const failed = Object.keys(errors).length > 0 || Boolean(state.message);

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

      {/* Le filet gauche est plus sombre que celui des contrôles, et la mesure
          est celle de T3.2 : `content-neutral-dark` donne 3,05:1 côté voile et
          8,12:1 côté panneau, là où `content-neutral-normal` tomberait à 1,46:1
          contre le voile. C'est ce filet qui porte la séparation, faute
          d'ombre — le design system nomme ses élévations sans les définir, et
          l'inventer est interdit (règle 2). */}
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
            {/* Le nom du produit : le panneau ne quitte pas son contexte, il le
                rappelle. */}
            <p className="mt-1 text-xs text-content-neutral-base">
              {productName}
            </p>
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

        <form action={submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
            {/* Une soumission refusée doit s'entendre, et pas seulement se
                voir. Vision ne jette jamais en silence ce qui a été tapé : les
                valeurs sont réaffichées telles quelles. */}
            {failed ? (
              <div
                role="alert"
                className="flex flex-col gap-2 rounded-lg border border-content-danger-base bg-surface-danger-lightest px-4 py-3 text-sm text-content-danger-dark"
              >
                <p className="font-semibold">
                  {state.message ?? "La saisie n'a pas pu être enregistrée."}
                </p>
                {Object.keys(errors).length > 0 ? (
                  <ul className="flex list-disc flex-col gap-1 pl-5">
                    {Object.entries(errors).map(([field, message]) => (
                      <li key={field}>{message}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            <PanelField
              label="Libellé"
              htmlFor="indicateur-libelle"
              note="Ce que ce produit mesure, et qui se suit d'un accompagnement à l'autre."
              error={errors.label}
              errorId="indicateur-libelle-erreur"
              required
            >
              <input
                id="indicateur-libelle"
                name="label"
                type="text"
                defaultValue={values.label}
                autoComplete="off"
                aria-invalid={errors.label ? true : undefined}
                aria-describedby={
                  errors.label ? "indicateur-libelle-erreur" : undefined
                }
                className={`${CONTROL} ${borderOf(errors.label)}`}
              />
            </PanelField>

            {/* Texte libre, et aucun référentiel : `indicators.unit` est un
                `text` nullable, et en faire une liste serait l'écran de gestion
                des référentiels que la fiche interdit (D25, C7). */}
            <PanelField
              label="Unité"
              htmlFor="indicateur-unite"
              note="Facultative. « % », « s », « /100 » — telle qu'elle s'écrit à côté du chiffre."
              error={errors.unit}
              errorId="indicateur-unite-erreur"
            >
              <input
                id="indicateur-unite"
                name="unit"
                type="text"
                defaultValue={values.unit}
                autoComplete="off"
                aria-invalid={errors.unit ? true : undefined}
                aria-describedby={
                  errors.unit ? "indicateur-unite-erreur" : undefined
                }
                className={`${CONTROL} ${borderOf(errors.unit)}`}
              />
            </PanelField>

            {/* La liste est **dérivée du schéma**, jamais réécrite à la main, et
                les libellés viennent de `lib/format`, posés en T5.1 : un seul
                endroit les nomme. Aucune valeur par défaut n'est pré-choisie —
                la colonne n'en a pas, et deviner le sens d'une mesure qu'on ne
                connaît pas serait le premier jugement porté par Vision. */}
            <PanelField
              label="Sens de lecture"
              htmlFor="indicateur-sens"
              note="Dans quel sens la série se lit. Vision ne qualifie aucune valeur : ni bonne, ni mauvaise."
              error={errors.direction}
              errorId="indicateur-sens-erreur"
              required
            >
              <select
                id="indicateur-sens"
                name="direction"
                defaultValue={values.direction}
                aria-invalid={errors.direction ? true : undefined}
                aria-describedby={
                  errors.direction ? "indicateur-sens-erreur" : undefined
                }
                className={`${CONTROL} ${borderOf(errors.direction)}`}
              >
                <option value="">Choisir un sens de lecture</option>
                {INDICATOR_DIRECTION_VALUES.map((direction) => (
                  <option key={direction} value={direction}>
                    {formatIndicatorDirection(direction)}
                  </option>
                ))}
              </select>
            </PanelField>

            {/* D'où vient la mesure, en toutes lettres. Vision ne raccorde aucun
                outil ici : c'est une note, pas une liaison — le référentiel
                `tools` sert les résultats (T4.4), et un indicateur n'en dépend
                pas. */}
            <PanelField
              label="Source"
              htmlFor="indicateur-source"
              note="Facultative. D'où vient la mesure : « Portail analytics », « Enquête trimestrielle »…"
              error={errors.source}
              errorId="indicateur-source-erreur"
            >
              <input
                id="indicateur-source"
                name="source"
                type="text"
                defaultValue={values.source}
                autoComplete="off"
                aria-invalid={errors.source ? true : undefined}
                aria-describedby={
                  errors.source ? "indicateur-source-erreur" : undefined
                }
                className={`${CONTROL} ${borderOf(errors.source)}`}
              />
            </PanelField>
          </div>

          {/* Enregistrement sans confirmation intermédiaire (`docs/06` §9) :
              l'indicateur paraît aussitôt dans son bloc, et c'est toute la
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

/**
 * Un champ du panneau : son intitulé, sa note, son contrôle, son message.
 *
 * **Quatrième copie du même composant** — `project-form.tsx` en T2.5,
 * `activity-panel.tsx` en T3.3, `resource-panel.tsx` en T4.2, celle-ci en T5.2.
 * Elle est redite plutôt qu'importée parce qu'aucun des trois ne l'exporte et
 * qu'ils n'appartiennent pas au périmètre de ce ticket. La dette est consignée
 * au journal ; l'extraction appartient au ticket qui pourra toucher les quatre
 * fichiers ensemble.
 *
 * L'intitulé est un `<label for>` — jamais un `placeholder` en guise de nom : il
 * disparaîtrait à la première frappe, et l'assistance ne le lit pas.
 */
function PanelField({
  label,
  htmlFor,
  note,
  error,
  errorId,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  note?: string;
  error?: string | undefined;
  errorId: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-2xs font-semibold text-content-neutral-dark uppercase"
      >
        {label}
        {/* « obligatoire » est écrit, pas seulement marqué d'une étoile : un
            symbole coloré ne porte jamais seul une information. */}
        {required ? (
          <span className="font-normal text-content-neutral-base">
            {" (obligatoire)"}
          </span>
        ) : null}
      </label>
      {note ? <p className="text-xs text-content-neutral-base">{note}</p> : null}
      {children}
      {error ? (
        <p
          id={errorId}
          className="text-xs font-semibold text-content-danger-dark"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
