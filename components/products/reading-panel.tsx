"use client";

/**
 * Le panneau qui saisit un relevé — la série datée sans laquelle la frise de
 * T5.6 n'a rien à tracer.
 *
 * **Aucun écran de plus** (`docs/06` §2) : c'est la page du produit, plus un
 * paramètre. La mécanique est celle de T3.2, reprise **sans en changer une
 * ligne** — le panneau n'est pas un état, c'est une URL.
 * `?releve=<identifiant d'indicateur>` saisit, `?releve=<identifiant de relevé>`
 * corrige ; la page reste rendue derrière et porte `inert`, et trois sorties
 * mènent au même endroit : la croix, « Annuler » et le voile, tous trois de
 * simples liens vers la page nue.
 *
 * **Quatrième jumeau d'`activity-panel.tsx`**, après la ressource, le résultat
 * et l'indicateur, et volontairement. Même frontière client — `useActionState`
 * est le seul moyen de faire revenir une saisie refusée avec ses valeurs —, même
 * `FocusTrap` **réutilisé sans modification**, même `autofocus` sur la sortie,
 * mêmes jetons. React 19 améliore progressivement : le formulaire est soumis par
 * le navigateur, l'action s'exécute, et **tout fonctionne sans une ligne de
 * JavaScript**.
 *
 * Il ne reçoit pas la session : un composant client n'a rien à faire d'un
 * contexte de droits. Il reçoit ce qu'il affiche — le nom du produit, le libellé
 * de l'indicateur — et une action qui ne connaît ni l'un ni l'autre. **C'est le
 * serveur qui décide ce que ce formulaire écrit, jamais un champ caché.**
 *
 * **Un seul formulaire pour les deux gestes**, comme les trois panneaux qui le
 * précèdent : mêmes champs, mêmes règles, mêmes refus. Ce qui change tient en
 * trois propriétés — le titre, le libellé du bouton, les valeurs initiales — et
 * le panneau ne sait pas lequel des deux gestes il sert : c'est l'action liée qui
 * le décide, côté serveur.
 *
 * **Aucune date par défaut**, et c'est la règle centrale de ce panneau : ni
 * aujourd'hui, ni le mois courant. Un relevé se **rapporte**, il ne se date pas
 * au moment de la saisie — `docs/03` §7 refuse qu'une mesure soit « positionnée
 * arbitrairement à aujourd'hui », et un champ pré-rempli est exactement la façon
 * dont cela arriverait sans que personne ne l'ait décidé.
 */

import Link from "next/link";
import { useActionState, type ReactNode } from "react";

import { FocusTrap } from "@/components/ui/focus-trap";
import {
  EMPTY_READING_VALUES,
  type ReadingFormState,
  type ReadingFormValues,
} from "@/lib/forms/reading";

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

export function ReadingPanel({
  productName,
  indicatorLabel,
  closeHref,
  action,
  title = "Ajouter un relevé",
  submitLabel = "Ajouter le relevé",
  initial = EMPTY_READING_VALUES,
}: {
  productName: string;
  /** L'indicateur mesuré. Le panneau ne quitte pas son contexte, il le rappelle. */
  indicatorLabel: string;
  /** La page du produit, sans son paramètre. Les trois sorties y mènent. */
  closeHref: string;
  /**
   * L'action serveur, **déjà liée** au produit et à l'indicateur côté serveur —
   * au produit et au relevé en correction. Le panneau ne connaît pas ce qu'il
   * écrit.
   */
  action: (
    state: ReadingFormState,
    formData: FormData,
  ) => Promise<ReadingFormState>;
  /** « Ajouter un relevé » en saisie, « Modifier le relevé » sinon. */
  title?: string;
  submitLabel?: string;
  /**
   * Les valeurs du relevé corrigé. C'est l'**état initial** de `useActionState` :
   * un refus le remplace par ce qui a été tapé, si bien que les deux chemins ont
   * rigoureusement la même forme.
   */
  initial?: ReadingFormValues;
}) {
  const [state, submit, pending] = useActionState(action, {
    values: initial,
    errors: {},
  });

  const titleId = "panneau-releve-titre";
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
            {/* Le produit **et** l'indicateur : un relevé n'existe pas hors de
                l'indicateur qu'il mesure, et le panneau doit dire lequel. */}
            <p className="mt-1 text-xs text-content-neutral-base">
              {`${productName} · ${indicatorLabel}`}
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

            {/* `type="text"` et non `type="number"` : le champ numérique refuse
                la virgule française selon la locale du navigateur, et ne rend
                rien de lisible à l'assistance quand il est vide — la raison
                écrite dans `result-panel.tsx`. La validation qui compte est côté
                serveur, le formulaire portant `noValidate`. `inputMode="decimal"`
                sert le clavier des mobiles.

                **L'unité n'est pas ici** : elle appartient à l'indicateur, saisie
                une fois pour toutes en T5.2, et la redemander à chaque relevé
                autoriserait une série dont les lignes ne se comparent plus. */}
            <PanelField
              label="Valeur"
              htmlFor="releve-valeur"
              note="Le chiffre relevé, virgule acceptée. L'unité est celle de l'indicateur."
              error={errors.value}
              errorId="releve-valeur-erreur"
              required
            >
              <input
                id="releve-valeur"
                name="value"
                type="text"
                inputMode="decimal"
                defaultValue={values.value}
                autoComplete="off"
                aria-invalid={errors.value ? true : undefined}
                aria-describedby={
                  errors.value ? "releve-valeur-erreur" : undefined
                }
                className={`${CONTROL} ${borderOf(errors.value)}`}
              />
            </PanelField>

            {/* **Aucune valeur par défaut**, et c'est délibéré : `defaultValue`
                ne porte que ce qui a été saisi ou ce qui est corrigé. Ni
                aujourd'hui, ni le mois courant — un relevé se rapporte, il ne se
                date pas au moment de la saisie (`docs/03` §7). */}
            <PanelField
              label="Date du relevé"
              htmlFor="releve-date"
              note="Quand la mesure a été faite, et non quand elle est saisie."
              error={errors.readOn}
              errorId="releve-date-erreur"
              required
            >
              <input
                id="releve-date"
                name="readOn"
                type="date"
                defaultValue={values.readOn}
                aria-invalid={errors.readOn ? true : undefined}
                aria-describedby={
                  errors.readOn ? "releve-date-erreur" : undefined
                }
                className={`${CONTROL} ${borderOf(errors.readOn)}`}
              />
            </PanelField>

            {/* D'où vient cette mesure-là, quand elle ne vient pas de la source
                habituelle de l'indicateur. Une note, jamais une liaison : le
                référentiel `tools` sert les résultats (T4.4), et un relevé n'en
                dépend pas. */}
            <PanelField
              label="Note de source"
              htmlFor="releve-source"
              note="Facultative. D'où vient cette mesure : « Export du 12 juin », « Panel interne »…"
              error={errors.sourceNote}
              errorId="releve-source-erreur"
            >
              <input
                id="releve-source"
                name="sourceNote"
                type="text"
                defaultValue={values.sourceNote}
                autoComplete="off"
                aria-invalid={errors.sourceNote ? true : undefined}
                aria-describedby={
                  errors.sourceNote ? "releve-source-erreur" : undefined
                }
                className={`${CONTROL} ${borderOf(errors.sourceNote)}`}
              />
            </PanelField>
          </div>

          {/* Enregistrement sans confirmation intermédiaire (`docs/06` §9) : le
              relevé paraît aussitôt en tête de sa série, et c'est toute la
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
 * **Cinquième copie du même composant** — `project-form.tsx` en T2.5,
 * `activity-panel.tsx` en T3.3, `resource-panel.tsx` en T4.2,
 * `indicator-panel.tsx` en T5.2, celle-ci en T5.3. Elle est redite plutôt
 * qu'importée parce qu'aucun des quatre ne l'exporte et qu'ils n'appartiennent
 * pas au périmètre de ce ticket. La dette est consignée au journal ;
 * l'extraction appartient au ticket qui pourra toucher les cinq fichiers
 * ensemble.
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
