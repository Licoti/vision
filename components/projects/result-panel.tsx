"use client";

/**
 * Le panneau qui saisit un résultat — le niveau 1 de `docs/03` §5, et lui seul
 * (D15) : *« le contributeur saisit la valeur et colle le lien vers le
 * rapport. »*
 *
 * **Aucun écran de plus** (`docs/06` §2) : c'est la page du projet, plus un
 * paramètre. La mécanique est celle de T3.2, reprise sans en changer une ligne
 * — le panneau n'est pas un état, c'est une URL. `?resultat=<identifiant
 * d'activité>`, la page reste rendue derrière et porte `inert`, et trois
 * sorties mènent au même endroit : la croix, « Annuler » et le voile.
 *
 * **Jumeau de `resource-panel.tsx`, et volontairement.** Même frontière client
 * — `useActionState` est le seul moyen de faire revenir une saisie refusée avec
 * ses valeurs —, même `FocusTrap` **réutilisé sans modification**, même
 * `autofocus` sur la sortie, mêmes jetons.
 *
 * Il ne reçoit pas la session : un composant client n'a rien à faire d'un
 * contexte de droits. Il reçoit ce qu'il affiche — les outils du référentiel,
 * le nom du projet, le libellé de l'activité — et une action qui ne connaît ni
 * le projet ni l'activité. **C'est le serveur qui décide ce que ce formulaire
 * écrit, jamais un champ caché.**
 *
 * **Le contrat unique de `docs/02` §5, et rien de plus** : un libellé, une
 * valeur, une unité, une date, l'outil, un lien profond. Aucun détail de
 * constat — il vit dans l'outil qui l'a produit, et c'est ce qui garantit que
 * brancher un outil de plus coûte une ligne de configuration.
 *
 * **Aucun appel à l'outil**, ni pour pré-remplir, ni pour vérifier, ni pour
 * lancer une analyse : c'est le niveau 2, après le POC. **Aucun seuil, aucun
 * code couleur de bon ou mauvais score** : Vision reporte une valeur, elle ne
 * la juge pas (D39).
 *
 * **Aucune correction ici** : C4 n'écrit que la création (arbitrage (a) de
 * `tickets-C4.md`). Ce panneau n'a donc qu'un point d'entrée.
 */

import Link from "next/link";
import { useActionState, type ReactNode } from "react";

import { FocusTrap } from "@/components/ui/focus-trap";
import { EMPTY_RESULT_VALUES, type ResultFormState } from "@/lib/forms/result";
import type { ResultToolOption } from "@/lib/queries/activities";

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

export function ResultPanel({
  projectName,
  activityLabel,
  closeHref,
  action,
  tools,
}: {
  projectName: string;
  /**
   * « Audit UX · septembre 2026 ». Ce panneau écrit sur une activité précise,
   * et ne pas la nommer laisserait la personne la deviner à l'URL.
   */
  activityLabel: string;
  /** La page du projet, sans son paramètre. Les trois sorties y mènent. */
  closeHref: string;
  /**
   * L'action serveur, **déjà liée** au projet et à l'activité côté serveur. Le
   * panneau ne connaît ni l'un ni l'autre.
   */
  action: (
    state: ResultFormState,
    formData: FormData,
  ) => Promise<ResultFormState>;
  /**
   * Le référentiel des outils du domaine (`docs/04` §2). Facultatif au choix :
   * `results.tool_id` est nullable, et un résultat peut venir d'un outil que le
   * référentiel ne porte pas encore.
   */
  tools: readonly ResultToolOption[];
}) {
  const [state, submit, pending] = useActionState(action, {
    values: EMPTY_RESULT_VALUES,
    errors: {},
  });

  const titleId = "panneau-resultat-titre";
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
          8,12:1 côté panneau. C'est ce filet qui porte la séparation, faute
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
              Saisir un résultat
            </h2>
            {/* L'activité **et** le projet : le panneau ne quitte pas son
                contexte, il le rappelle — et il écrit sur une activité, pas sur
                un accompagnement. */}
            <p className="mt-1 text-xs text-content-neutral-base">
              {activityLabel}
            </p>
            <p className="text-xs text-content-neutral-base">{projectName}</p>
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
              htmlFor="resultat-libelle"
              note="Ce que l'outil a mesuré : « Score d'audit UX », « Taux de conformité »."
              error={errors.label}
              errorId="resultat-libelle-erreur"
              required
            >
              <input
                id="resultat-libelle"
                name="label"
                type="text"
                defaultValue={values.label}
                autoComplete="off"
                aria-invalid={errors.label ? true : undefined}
                aria-describedby={
                  errors.label ? "resultat-libelle-erreur" : undefined
                }
                className={`${CONTROL} ${borderOf(errors.label)}`}
              />
            </PanelField>

            {/* `type="text"` et non `type="number"` : ce dernier refuse la
                virgule dans une locale à point, avale les flèches de la molette
                et ne rend rien de lisible à l'assistance quand il est vide. La
                validation qui compte est côté serveur, le formulaire portant
                `noValidate`. `inputMode="decimal"` sert le clavier des mobiles. */}
            <PanelField
              label="Valeur"
              htmlFor="resultat-valeur"
              note="Le chiffre reporté de l'outil, virgule acceptée. Facultatif : un constat sans chiffre reste un résultat."
              error={errors.value}
              errorId="resultat-valeur-erreur"
            >
              <input
                id="resultat-valeur"
                name="value"
                type="text"
                inputMode="decimal"
                defaultValue={values.value}
                autoComplete="off"
                aria-invalid={errors.value ? true : undefined}
                aria-describedby={
                  errors.value ? "resultat-valeur-erreur" : undefined
                }
                className={`${CONTROL} ${borderOf(errors.value)}`}
              />
            </PanelField>

            {/* Texte libre : `docs/04` §2 ne pose aucun référentiel d'unités, et
                en inventer un fermerait la porte au prochain outil branché. */}
            <PanelField
              label="Unité"
              htmlFor="resultat-unite"
              note="« /100 », « % », « s ». Facultative."
              error={errors.unit}
              errorId="resultat-unite-erreur"
            >
              <input
                id="resultat-unite"
                name="unit"
                type="text"
                defaultValue={values.unit}
                autoComplete="off"
                aria-invalid={errors.unit ? true : undefined}
                aria-describedby={
                  errors.unit ? "resultat-unite-erreur" : undefined
                }
                className={`${CONTROL} ${borderOf(errors.unit)}`}
              />
            </PanelField>

            {/* La date de la **mesure**, pas celle de la saisie : Vision ne
                fabrique aucune date (arbitrage de T3.3, repris ici). Elle peut
                précéder de loin le jour où le résultat est reporté. */}
            <PanelField
              label="Date de mesure"
              htmlFor="resultat-date"
              note="Le jour où l'outil a produit cette valeur, qui n'est pas forcément celui de la saisie."
              error={errors.measuredOn}
              errorId="resultat-date-erreur"
              required
            >
              <input
                id="resultat-date"
                name="measuredOn"
                type="date"
                defaultValue={values.measuredOn}
                aria-invalid={errors.measuredOn ? true : undefined}
                aria-describedby={
                  errors.measuredOn ? "resultat-date-erreur" : undefined
                }
                className={`${CONTROL} ${borderOf(errors.measuredOn)}`}
              />
            </PanelField>

            {/* Le référentiel du domaine (`docs/04` §2) : brancher un outil de
                plus coûte une ligne, pas un module. Facultatif — la colonne est
                nullable, et un résultat peut venir d'un outil que le
                référentiel ne porte pas encore. */}
            <PanelField
              label="Outil"
              htmlFor="resultat-outil"
              note="Facultatif. L'outil externe qui a produit cette valeur."
              error={errors.toolId}
              errorId="resultat-outil-erreur"
            >
              {tools.length > 0 ? (
                <select
                  id="resultat-outil"
                  name="toolId"
                  defaultValue={values.toolId}
                  aria-invalid={errors.toolId ? true : undefined}
                  aria-describedby={
                    errors.toolId ? "resultat-outil-erreur" : undefined
                  }
                  className={`${CONTROL} ${borderOf(errors.toolId)}`}
                >
                  <option value="">Aucun</option>
                  {tools.map((tool) => (
                    <option key={tool.id} value={tool.id}>
                      {tool.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-content-neutral-dark">
                  {"Aucun outil n'est raccordé à ce domaine."}
                </p>
              )}
            </PanelField>

            {/* Le lien profond du contrat unique. **Un résultat sans lien est un
                cas normal** (T4.3) : la valeur s'affiche, et aucun lien mort
                n'est rendu. `type="url"` sert le clavier des mobiles ; la
                validation qui compte est côté serveur. */}
            <PanelField
              label="Lien vers le rapport"
              htmlFor="resultat-lien"
              note="Facultatif. Le lien profond vers le rapport dans l'outil : c'est lui qui portera le libellé. Vision affiche la synthèse, le détail vit là-bas."
              error={errors.externalUrl}
              errorId="resultat-lien-erreur"
            >
              <input
                id="resultat-lien"
                name="externalUrl"
                type="url"
                inputMode="url"
                defaultValue={values.externalUrl}
                autoComplete="off"
                placeholder="https://"
                aria-invalid={errors.externalUrl ? true : undefined}
                aria-describedby={
                  errors.externalUrl ? "resultat-lien-erreur" : undefined
                }
                className={`${CONTROL} ${borderOf(errors.externalUrl)}`}
              />
            </PanelField>
          </div>

          {/* Enregistrement sans confirmation intermédiaire (`docs/06` §9) : le
              résultat paraît aussitôt sur son entrée de roadmap, et c'est toute
              la confirmation. */}
          <div className="flex flex-none flex-wrap items-center gap-4 border-t border-surface-neutral-lighter px-6 py-4">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-surface-primary-base px-4 py-2 text-sm font-semibold text-content-neutral-pale disabled:opacity-60"
            >
              {pending ? "Enregistrement…" : "Enregistrer le résultat"}
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
 * `activity-panel.tsx` en T3.3, `resource-panel.tsx` en T4.2, celle-ci en T4.4.
 * Elle est redite plutôt qu'importée parce qu'aucun des trois ne l'exporte et
 * qu'aucun n'appartient au périmètre de ce ticket. La dette est consignée au
 * journal depuis T4.2 ; l'extraction appartient au ticket qui pourra toucher
 * les quatre fichiers ensemble.
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
