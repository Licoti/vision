"use client";

/**
 * Le panneau qui relie une ressource — le geste qui ferme la boucle minimale de
 * `docs/05` §2 : *« … attache le lien de sa restitution, et repart. »*
 *
 * **Aucun écran de plus** (`docs/06` §2, qui pose six écrans comme un plancher
 * et exige qu'un septième réponde à une question à laquelle aucun autre ne
 * répond) : c'est la page du projet, plus un paramètre. La mécanique est celle
 * de T3.2, reprise sans en changer une ligne — le panneau n'est pas un état,
 * c'est une URL. `?ressource=nouvelle`, la page reste rendue derrière et porte
 * `inert`, et trois sorties mènent au même endroit : la croix, « Annuler » et le
 * voile, tous trois de simples liens vers la page nue.
 *
 * **Jumeau d'`activity-panel.tsx`, et volontairement.** Même frontière client —
 * `useActionState` est le seul moyen de faire revenir une saisie refusée avec
 * ses valeurs —, même `FocusTrap` **réutilisé sans modification**, même
 * `autofocus` sur la sortie, mêmes jetons. React 19 améliore progressivement :
 * le formulaire est soumis par le navigateur, l'action s'exécute, et **tout
 * fonctionne sans une ligne de JavaScript**.
 *
 * Il ne reçoit pas la session : un composant client n'a rien à faire d'un
 * contexte de droits. Il reçoit ce qu'il affiche — les activités proposées au
 * rattachement, le nom du projet — et une action qui ne connaît pas
 * l'identifiant du projet. **C'est le serveur qui décide ce que ce formulaire
 * écrit, jamais un champ caché.**
 *
 * **Vision n'héberge aucun fichier** (`docs/02` §5) : le panneau saisit un lien
 * et rien d'autre. Aucun téléversement, aucun aperçu, aucune requête vers
 * l'adresse tapée — ni pour la vérifier, ni pour en deviner le titre ou le type
 * (D21).
 *
 * **Deux points d'entrée depuis T4bis.5**, comme celui de l'activité depuis
 * T3.4 : `?ressource=nouvelle` relie, `?ressource=<identifiant>` corrige. Un
 * seul formulaire pour les deux gestes — mêmes champs, mêmes règles, mêmes
 * refus. Ce qui change tient en trois propriétés — le titre, le libellé du
 * bouton, les valeurs initiales — et le panneau ne sait pas lequel des deux
 * gestes il sert : c'est l'action liée qui le décide, côté serveur.
 */

import Link from "next/link";
import { useActionState, type ReactNode } from "react";

import { FocusTrap } from "@/components/ui/focus-trap";
import { formatResourceType } from "@/lib/format";
import {
  EMPTY_RESOURCE_VALUES,
  RESOURCE_TYPE_VALUES,
  type ResourceFormState,
  type ResourceFormValues,
} from "@/lib/forms/resource";

/**
 * Une activité proposée au rattachement : son identifiant, et de quoi la
 * reconnaître dans une liste — « Test utilisateur · mars 2026 ». Le libellé est
 * composé par la page, qui a déjà lu la roadmap.
 */
export type ResourceActivityOption = { id: string; label: string };

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

export function ResourcePanel({
  projectName,
  closeHref,
  action,
  activities,
  title = "Relier une ressource",
  submitLabel = "Relier la ressource",
  initial = EMPTY_RESOURCE_VALUES,
}: {
  projectName: string;
  /** La page du projet, sans son paramètre. Les trois sorties y mènent. */
  closeHref: string;
  /**
   * L'action serveur, **déjà liée** au projet côté serveur. Le panneau ne
   * connaît pas l'accompagnement dans lequel il écrit.
   */
  action: (
    state: ResourceFormState,
    formData: FormData,
  ) => Promise<ResourceFormState>;
  /**
   * Les activités de **ce** projet, facultatives au rattachement (`docs/02`
   * §5). Vide est un cas normal : un projet peut n'avoir aucune activité.
   */
  activities: readonly ResourceActivityOption[];
  /** « Relier une ressource » en création, « Modifier la ressource » sinon. */
  title?: string;
  submitLabel?: string;
  /**
   * Les valeurs de la ressource corrigée (T4bis.5). C'est l'**état initial** de
   * `useActionState` : un refus le remplace par ce qui a été tapé, si bien que
   * les deux chemins ont rigoureusement la même forme.
   */
  initial?: ResourceFormValues;
}) {
  const [state, submit, pending] = useActionState(action, {
    values: initial,
    errors: {},
  });

  const titleId = "panneau-ressource-titre";
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

            <PanelField
              label="Titre"
              htmlFor="ressource-titre"
              note="Le nom sous lequel ce document se retrouve. C'est lui qui portera le lien."
              error={errors.title}
              errorId="ressource-titre-erreur"
              required
            >
              <input
                id="ressource-titre"
                name="title"
                type="text"
                defaultValue={values.title}
                autoComplete="off"
                aria-invalid={errors.title ? true : undefined}
                aria-describedby={
                  errors.title ? "ressource-titre-erreur" : undefined
                }
                className={`${CONTROL} ${borderOf(errors.title)}`}
              />
            </PanelField>

            {/* Vision n'héberge aucun fichier : ce champ est le produit tout
                entier de ce panneau. `type="url"` sert le clavier des mobiles ;
                la validation qui compte est côté serveur, le formulaire portant
                `noValidate`. */}
            <PanelField
              label="Adresse du document"
              htmlFor="ressource-url"
              note="Le lien vers le document, là où il est hébergé. Vision ne stocke aucun fichier : elle renvoie vers l'outil qui le porte."
              error={errors.url}
              errorId="ressource-url-erreur"
              required
            >
              <input
                id="ressource-url"
                name="url"
                type="url"
                inputMode="url"
                defaultValue={values.url}
                autoComplete="off"
                placeholder="https://"
                aria-invalid={errors.url ? true : undefined}
                aria-describedby={errors.url ? "ressource-url-erreur" : undefined}
                className={`${CONTROL} ${borderOf(errors.url)}`}
              />
            </PanelField>

            {/* D21 — saisi, et jamais deviné depuis l'adresse. Les libellés
                viennent de `lib/format`, posés une fois pour toutes en T4.1 ;
                l'ordre est celui de l'énuméré du schéma. */}
            <PanelField
              label="Type"
              htmlFor="ressource-type"
              error={errors.resourceType}
              errorId="ressource-type-erreur"
              required
            >
              <select
                id="ressource-type"
                name="resourceType"
                defaultValue={values.resourceType}
                aria-invalid={errors.resourceType ? true : undefined}
                aria-describedby={
                  errors.resourceType ? "ressource-type-erreur" : undefined
                }
                className={`${CONTROL} ${borderOf(errors.resourceType)}`}
              >
                <option value="">Choisir un type</option>
                {RESOURCE_TYPE_VALUES.map((type) => (
                  <option key={type} value={type}>
                    {formatResourceType(type)}
                  </option>
                ))}
              </select>
            </PanelField>

            {/* « Ce second rattachement est ce qui transforme une liste de
                fichiers en récit lisible » (`docs/02` §5) — facultatif, et
                fortement utile. Les activités proposées sont celles de ce
                projet, et elles seules : l'action revérifie la valeur reçue. */}
            <PanelField
              label="Activité"
              htmlFor="ressource-activite"
              note="Facultative. L'activité qui a produit ce document : c'est elle qui transforme une liste de liens en récit lisible."
              error={errors.activityId}
              errorId="ressource-activite-erreur"
            >
              {activities.length > 0 ? (
                <select
                  id="ressource-activite"
                  name="activityId"
                  defaultValue={values.activityId}
                  aria-invalid={errors.activityId ? true : undefined}
                  aria-describedby={
                    errors.activityId ? "ressource-activite-erreur" : undefined
                  }
                  className={`${CONTROL} ${borderOf(errors.activityId)}`}
                >
                  <option value="">Aucune</option>
                  {activities.map((activity) => (
                    <option key={activity.id} value={activity.id}>
                      {activity.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-content-neutral-dark">
                  {"Aucune activité à rattacher dans cet accompagnement."}
                </p>
              )}
            </PanelField>
          </div>

          {/* Enregistrement sans confirmation intermédiaire (`docs/06` §9) : la
              ressource paraît aussitôt dans son bloc, et c'est toute la
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
 * **Troisième copie du même composant** — `project-form.tsx` en T2.5,
 * `activity-panel.tsx` en T3.3, celle-ci en T4.2. Elle est redite plutôt
 * qu'importée parce qu'`activity-panel.tsx` ne l'exporte pas et n'appartient pas
 * au périmètre de ce ticket. La dette est consignée au journal ; l'extraction
 * appartient au ticket qui pourra toucher les trois fichiers ensemble.
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
