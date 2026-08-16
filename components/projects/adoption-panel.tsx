"use client";

/**
 * Le panneau qui adopte un indicateur du produit pour cet accompagnement.
 *
 * **Aucun écran de plus** (`docs/06` §2) : c'est la page du projet, plus un
 * paramètre. La mécanique est celle de T3.2, reprise **sans en changer une
 * ligne** — le panneau n'est pas un état, c'est une URL. `?indicateur=nouvel`
 * adopte, `?indicateur=<identifiant d'adoption>` corrige ; la page reste rendue
 * derrière et porte `inert`, et trois sorties mènent au même endroit : la croix,
 * « Annuler » et le voile, tous trois de simples liens vers la page nue.
 *
 * **La clé est celle de la page produit** (T5.2), et il n'y a pas de confusion
 * possible : ce sont deux pages, jamais la même URL. Sa **valeur** ne désigne
 * pas la même table pour autant — un indicateur là-bas, une adoption ici, parce
 * que c'est l'adoption qu'on corrige et qu'on retire.
 *
 * **Sixième jumeau d'`activity-panel.tsx`**, après la ressource, le résultat,
 * l'indicateur et le relevé, et volontairement. Même frontière client —
 * `useActionState` est le seul moyen de faire revenir une saisie refusée avec
 * ses valeurs —, même `FocusTrap` **réutilisé sans modification**, même
 * `autofocus` sur la sortie, mêmes jetons. React 19 améliore progressivement :
 * le formulaire est soumis par le navigateur, l'action s'exécute, et **tout
 * fonctionne sans une ligne de JavaScript**.
 *
 * Il ne reçoit pas la session : un composant client n'a rien à faire d'un
 * contexte de droits. Il reçoit ce qu'il affiche — le nom du projet, les
 * indicateurs proposés — et une action qui ne connaît ni l'un ni l'autre.
 * **C'est le serveur qui décide ce que ce formulaire écrit, jamais un champ
 * caché.**
 *
 * **Un seul formulaire pour les deux gestes**, comme les cinq panneaux qui le
 * précèdent : mêmes champs, mêmes règles, mêmes refus. Ce qui change tient en
 * trois propriétés — le titre, le libellé du bouton, les valeurs initiales — et
 * le panneau ne sait pas lequel des deux gestes il sert : c'est l'action liée qui
 * le décide, côté serveur.
 *
 * **Aucune création d'indicateur ici** (arbitrage (c) de `tickets-C5.md`) :
 * quand le produit n'en porte aucun à adopter, le panneau le dit et renvoie vers
 * la page du produit, plutôt que d'offrir un `select` sans option.
 *
 * **Aucun cinquième chiffre**, et aucune comparaison entre les trois : la cible
 * est un repère, jamais un état (arbitrage (g), D39). Le panneau n'affiche ni
 * écart, ni progression, ni « cible atteinte ».
 */

import Link from "next/link";
import { useActionState, type ReactNode } from "react";

import { FocusTrap } from "@/components/ui/focus-trap";
import {
  EMPTY_ADOPTION_VALUES,
  type AdoptionFormState,
  type AdoptionFormValues,
} from "@/lib/forms/adoption";

/** Une option du `select` : ce qu'il faut pour la nommer, rien de plus. */
export type AdoptionIndicatorOption = {
  id: string;
  label: string;
  /** L'unité, quand l'indicateur en porte une : elle nomme ce qu'on va saisir. */
  unit: string | null;
};

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

/** « Autonomie · % » — l'unité dit ce que les trois valeurs vont mesurer. */
function optionLabel(option: AdoptionIndicatorOption): string {
  return option.unit ? `${option.label} · ${option.unit}` : option.label;
}

export function AdoptionPanel({
  projectName,
  closeHref,
  productHref,
  action,
  indicators,
  title = "Adopter un indicateur",
  submitLabel = "Adopter l'indicateur",
  initial = EMPTY_ADOPTION_VALUES,
}: {
  projectName: string;
  /** La page du projet, sans son paramètre. Les trois sorties y mènent. */
  closeHref: string;
  /** La page du produit — le seul endroit où un indicateur se crée. */
  productHref: string;
  /**
   * L'action serveur, **déjà liée** au projet côté serveur — au projet et à
   * l'adoption en correction. Le panneau ne connaît pas ce qu'il écrit.
   */
  action: (
    state: AdoptionFormState,
    formData: FormData,
  ) => Promise<AdoptionFormState>;
  /**
   * Les indicateurs proposés : les vivants du produit que cet accompagnement
   * n'adopte pas encore, plus celui de l'adoption éditée — l'exception
   * nominative, calculée par la lecture et non par ce composant.
   */
  indicators: readonly AdoptionIndicatorOption[];
  /** « Adopter un indicateur » en saisie, « Modifier l'adoption » sinon. */
  title?: string;
  submitLabel?: string;
  /**
   * Les valeurs de l'adoption corrigée. C'est l'**état initial** de
   * `useActionState` : un refus le remplace par ce qui a été tapé, si bien que
   * les deux chemins ont rigoureusement la même forme.
   */
  initial?: AdoptionFormValues;
}) {
  const [state, submit, pending] = useActionState(action, {
    values: initial,
    errors: {},
  });

  const titleId = "panneau-adoption-titre";
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
            {/* Le nom du projet : le panneau ne quitte pas son contexte, il le
                rappelle. */}
            <p className="mt-1 text-xs text-content-neutral-base">
              {projectName}
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

            {/* Les indicateurs proposés sont ceux du produit que cet
                accompagnement n'adopte pas encore : l'unicité `(projet,
                indicateur)` est totale en base, et proposer deux fois le même
                mènerait à un refus que rien n'annonçait. L'action revérifie la
                valeur reçue — un `select` n'a jamais protégé un point d'entrée
                HTTP.

                La liste vide n'est pas une erreur : c'est le cas d'un produit
                dont tous les indicateurs sont déjà adoptés, ou qui n'en porte
                aucun. Le repli est celui de `resource-panel.tsx`, avec le
                renvoi que l'arbitrage (c) impose en plus. */}
            <PanelField
              label="Indicateur"
              htmlFor="adoption-indicateur"
              note="Un indicateur du produit, que cet accompagnement reprend à son compte."
              error={errors.indicatorId}
              errorId="adoption-indicateur-erreur"
              required
            >
              {indicators.length > 0 ? (
                <select
                  id="adoption-indicateur"
                  name="indicatorId"
                  defaultValue={values.indicatorId}
                  aria-invalid={errors.indicatorId ? true : undefined}
                  aria-describedby={
                    errors.indicatorId ? "adoption-indicateur-erreur" : undefined
                  }
                  className={`${CONTROL} ${borderOf(errors.indicatorId)}`}
                >
                  <option value="">Choisir un indicateur</option>
                  {indicators.map((indicator) => (
                    <option key={indicator.id} value={indicator.id}>
                      {optionLabel(indicator)}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-content-neutral-dark">
                  Ce produit ne porte aucun indicateur à adopter. Un indicateur
                  se crée sur{" "}
                  <Link
                    href={productHref}
                    className="text-content-info-base underline"
                  >
                    la page du produit
                  </Link>
                  .
                </p>
              )}
            </PanelField>

            {/* Les trois valeurs sont **facultatives**, et le disent : adopter
                un indicateur sans fixer de cible est un geste normal. Elles sont
                rangées dans l'ordre du temps — d'où l'on part, où l'on va, où
                l'on est arrivé —, qui est aussi celui du bloc.

                `type="text"` et non `type="number"` : le champ numérique refuse
                la virgule française selon la locale du navigateur, et ne rend
                rien de lisible à l'assistance quand il est vide — la raison
                écrite dans `result-panel.tsx`. La validation qui compte est côté
                serveur, le formulaire portant `noValidate`. `inputMode="decimal"`
                sert le clavier des mobiles.

                **L'unité n'est pas ici** : elle appartient à l'indicateur, saisie
                une fois pour toutes en T5.2, et le `select` la rappelle. */}
            <PanelField
              label="Valeur de référence"
              htmlFor="adoption-reference"
              note="Facultative. Où en était l'indicateur au démarrage de cet accompagnement."
              error={errors.baselineValue}
              errorId="adoption-reference-erreur"
            >
              <input
                id="adoption-reference"
                name="baselineValue"
                type="text"
                inputMode="decimal"
                defaultValue={values.baselineValue}
                autoComplete="off"
                aria-invalid={errors.baselineValue ? true : undefined}
                aria-describedby={
                  errors.baselineValue ? "adoption-reference-erreur" : undefined
                }
                className={`${CONTROL} ${borderOf(errors.baselineValue)}`}
              />
            </PanelField>

            <PanelField
              label="Cible"
              htmlFor="adoption-cible"
              note="Facultative. La valeur visée — un repère, que Vision n'évalue jamais."
              error={errors.targetValue}
              errorId="adoption-cible-erreur"
            >
              <input
                id="adoption-cible"
                name="targetValue"
                type="text"
                inputMode="decimal"
                defaultValue={values.targetValue}
                autoComplete="off"
                aria-invalid={errors.targetValue ? true : undefined}
                aria-describedby={
                  errors.targetValue ? "adoption-cible-erreur" : undefined
                }
                className={`${CONTROL} ${borderOf(errors.targetValue)}`}
              />
            </PanelField>

            <PanelField
              label="Valeur finale"
              htmlFor="adoption-finale"
              note="Facultative. La valeur constatée à la clôture, si elle est connue."
              error={errors.finalValue}
              errorId="adoption-finale-erreur"
            >
              <input
                id="adoption-finale"
                name="finalValue"
                type="text"
                inputMode="decimal"
                defaultValue={values.finalValue}
                autoComplete="off"
                aria-invalid={errors.finalValue ? true : undefined}
                aria-describedby={
                  errors.finalValue ? "adoption-finale-erreur" : undefined
                }
                className={`${CONTROL} ${borderOf(errors.finalValue)}`}
              />
            </PanelField>
          </div>

          {/* Enregistrement sans confirmation intermédiaire (`docs/06` §9) :
              l'adoption paraît aussitôt dans son bloc, et c'est toute la
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
 * **Sixième copie du même composant** — `project-form.tsx` en T2.5,
 * `activity-panel.tsx` en T3.3, `resource-panel.tsx` en T4.2,
 * `indicator-panel.tsx` en T5.2, `reading-panel.tsx` en T5.3, celle-ci en T5.4.
 * Elle est redite plutôt qu'importée parce qu'aucun des cinq ne l'exporte et
 * qu'ils n'appartiennent pas au périmètre de ce ticket. À six copies, le ticket
 * d'extraction ne se repousse plus par cette phrase : il se pose, ou la dette
 * cesse d'être bornée. Consigné au journal.
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
