"use client";

/**
 * Le panneau de saisie d'activité — D30, et le geste critique du produit.
 *
 * `docs/06` §9 : la saisie d'activité doit tenir en moins d'une minute, en
 * panneau latéral plutôt qu'en page dédiée. T3.2 a levé la question qui
 * conditionnait tout le chantier — **ouvrir et fermer un panneau sans une ligne
 * de JavaScript** — et T3.3 lui donne son action.
 *
 * La réponse de T3.2 tient en une phrase, et elle n'a pas bougé : le panneau
 * n'est pas un état, c'est une URL. `?activite=nouvelle` sur la page du projet,
 * et la page reste rendue derrière lui — le contexte est conservé par
 * construction, pas par un `useState` qu'il faudrait sauvegarder. Trois sorties
 * mènent au même endroit : la croix, « Annuler » et le voile, tous trois de
 * simples liens vers la page nue.
 *
 * **Ce fichier était un composant serveur, et ne l'est plus.** T3.2 en faisait
 * une propriété — « rien ici n'a d'état, et c'est tout le propos ». La fiche de
 * T3.3 exige qu'« une saisie refusée revienne dans le panneau avec ses
 * valeurs », ce qui demande `useActionState`, donc une frontière client. Le
 * panneau prend donc la forme exacte de `project-form.tsx` depuis T2.5 : un
 * composant client dont l'action serveur est **déjà liée**, et que React 19
 * améliore progressivement — le formulaire est soumis par le navigateur,
 * l'action s'exécute, et **tout fonctionne sans une ligne de JavaScript**. Ce
 * que le hook ajoute quand JavaScript est là : la saisie survit à un refus sans
 * recharger la page.
 *
 * Il ne reçoit pas la session : un composant client n'a rien à faire d'un
 * contexte de droits. Il reçoit ce qu'il affiche — les deux référentiels, le
 * nom du projet — et une action qui ne connaît ni le domaine ni l'identifiant
 * du projet. **C'est le serveur qui décide ce que ce formulaire écrit, jamais
 * un champ caché.**
 *
 * **Le focus entre dans le panneau par `autofocus`, un attribut HTML** — React
 * le rend bien dans le balisage servi, vérifié — et il se pose sur la
 * fermeture : la première chose atteinte au clavier est la sortie. Le contenu
 * de la page, lui, porte `inert` : la tabulation ne visite jamais ce que le
 * voile masque.
 *
 * **Le cycle de tabulation, en revanche, demande du JavaScript** : `tabindex`
 * réordonne les arrêts, il n'en fait pas une boucle. `FocusTrap` le referme
 * quand le script est là, et **`aria-modal` n'est posé que par lui** — annoncer
 * que l'extérieur est hors d'atteinte serait faux tant que rien ne l'empêche.
 *
 * **Un seul formulaire, deux points d'entrée** (T3.4). Corriger une activité
 * ouvre ce panneau-ci, pré-rempli : mêmes champs, mêmes règles, même
 * validation. Ce qui change tient en trois props d'affichage — le titre,
 * l'intitulé du bouton, la saisie de départ — et **rien dans le comportement**.
 * Le panneau ne sait pas s'il crée ou s'il corrige : c'est l'action qui le
 * sait, et elle est liée côté serveur.
 *
 * **L'état ne se saisit pas, il se déduit de la période** (`docs/06` §9). Le
 * panneau ne porte donc aucun choix d'état : la règle vit dans
 * `lib/forms/activity.ts`, et la correction à la main est le geste de T3.5. En
 * correction, cette dérivation n'a lieu **que si la période a bougé** — même
 * fichier, même raison.
 *
 * **Aucune ombre.** Le design system nomme ses élévations sans leur donner de
 * valeur (`docs/design/design-system.md` §8) ; la séparation vient du voile et
 * d'un filet, deux jetons du thème.
 */

import Link from "next/link";
import { useActionState, type ReactNode } from "react";

import { FocusTrap } from "@/components/ui/focus-trap";
import {
  EMPTY_ACTIVITY_VALUES,
  type ActivityFormState,
  type ActivityFormValues,
} from "@/lib/forms/activity";
import type {
  ActivityFamily,
  ActivityTypeOption,
  ApproachOption,
} from "@/lib/queries/activities";

/**
 * Les six familles de `docs/03` §2, dans l'ordre de l'énuméré du schéma.
 *
 * La famille est un **regroupement d'affichage** et rien d'autre : elle donne
 * au choix du type un axe de lecture, elle n'impose aucune méthodologie.
 */
const FAMILY_LABEL: Record<ActivityFamily, string> = {
  framing: "Cadrage",
  research: "Recherche",
  design: "Conception",
  evaluation: "Évaluation",
  measurement: "Mesure",
  transfer: "Transmission",
};

/**
 * Le filet des contrôles, plus sombre que celui des blocs.
 *
 * La raison est mesurée depuis T2.3 et reprise en T2.5 et T2.6 : la bordure
 * d'un champ est la limite d'un composant d'interface, elle se mesure à 3:1, et
 * aucun jeton `border-*` du design system ne l'atteint sur ce fond.
 * `content-neutral-normal` y arrive à 3,88:1.
 */
const CONTROL =
  "w-full rounded-lg border bg-surface-neutral-pale px-3 py-2 text-sm text-content-neutral-darkest";

/**
 * Le filet du champ : rouge en erreur, gris sinon.
 *
 * Les deux mêmes jetons qu'en T2.5 et T2.6, sans en inventer un troisième — le
 * design system n'a pas plus de jeton `border-danger-*` que de jeton de bordure
 * de contrôle, point ouvert depuis T2.3. **Le message d'erreur ne dépend jamais
 * de cette couleur** : il est écrit sous le champ, et repris dans le bandeau.
 */
function borderOf(error: string | undefined): string {
  return error ? "border-content-danger-base" : "border-content-neutral-normal";
}

export function ActivityPanel({
  projectName,
  closeHref,
  action,
  activityTypes,
  approaches,
  title = "Nouvelle activité",
  submitLabel = "Enregistrer",
  initial = EMPTY_ACTIVITY_VALUES,
}: {
  projectName: string;
  /** La page du projet, sans son paramètre. Les trois sorties y mènent. */
  closeHref: string;
  /**
   * L'action serveur, **déjà liée** côté serveur : au projet en création, au
   * projet **et** à l'activité en correction. Le panneau ne connaît ni l'un ni
   * l'autre — il ne sait même pas lequel des deux gestes il sert.
   */
  action: (
    state: ActivityFormState,
    formData: FormData,
  ) => Promise<ActivityFormState>;
  activityTypes: readonly ActivityTypeOption[];
  approaches: readonly ApproachOption[];
  /** « Nouvelle activité », ou le type de celle qu'on corrige. */
  title?: string;
  submitLabel?: string;
  /**
   * La saisie de départ — vide en création, la ligne existante en correction
   * (T3.4). C'est l'**état initial** de `useActionState` : un refus le remplace
   * par ce qui vient d'être tapé, et le pré-remplissage ne réapparaît jamais
   * par-dessus une saisie en cours.
   */
  initial?: ActivityFormValues;
}) {
  const [state, submit, pending] = useActionState(action, {
    values: initial,
    errors: {},
  });

  const titleId = "panneau-activite-titre";
  const values = state.values;
  const errors = state.errors;
  const failed = Object.keys(errors).length > 0 || Boolean(state.message);

  /* Le référentiel arrive déjà trié par famille : les regrouper ne demande
     donc qu'un passage, et l'ordre des `optgroup` est celui du référentiel du
     domaine, pas celui de cette table de libellés. */
  const families = activityTypes.reduce<
    { family: ActivityFamily; types: ActivityTypeOption[] }[]
  >((groups, type) => {
    const last = groups.at(-1);
    if (last?.family === type.family) last.types.push(type);
    else groups.push({ family: type.family, types: [type] });
    return groups;
  }, []);

  return (
    <FocusTrap
      closeHref={closeHref}
      className="fixed inset-0 z-40 flex justify-end"
    >
      {/* Le voile ferme au clic, et **ne prend jamais le focus** : la fermeture
          au clavier passe par la croix et par « Annuler », qui portent l'une
          et l'autre un nom. Un lien sans texte, focalisable, serait un arrêt
          de tabulation muet. */}
      <Link
        href={closeHref}
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 bg-surface-neutral-opacity-distinct"
      />

      {/* Le filet gauche est **plus sombre que celui des contrôles**, et il a
          été mesuré avant d'être cru : `content-neutral-normal` — le choix
          retenu partout depuis T2.3 — tombe à 1,46:1 contre le voile,
          c'est-à-dire une limite de panneau qu'on devine. `content-neutral-dark`
          donne 3,05:1 côté voile et 8,12:1 côté panneau. C'est ce filet qui
          porte la séparation, faute d'ombre : le design system nomme ses
          élévations sans les définir, et l'inventer est interdit. */}
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
            {/* Le nom du projet : le panneau ne quitte pas son contexte, il
                le rappelle. */}
            <p className="mt-1 text-xs text-content-neutral-base">
              {projectName}
            </p>
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
            depuis T3.2, donc hors de toute soumission. */}
        <form
          action={submit}
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
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

            {/* D16 — le type est le seul champ vraiment obligatoire, et il vient
                du référentiel du domaine : jamais une liste codée en dur
                (`docs/03` §2). */}
            <PanelField
              label="Type d'activité"
              htmlFor="activite-type"
              error={errors.activityTypeId}
              errorId="activite-type-erreur"
              required
            >
              {activityTypes.length > 0 ? (
                <select
                  id="activite-type"
                  name="activityTypeId"
                  defaultValue={values.activityTypeId}
                  aria-invalid={errors.activityTypeId ? true : undefined}
                  aria-describedby={
                    errors.activityTypeId ? "activite-type-erreur" : undefined
                  }
                  className={`${CONTROL} ${borderOf(errors.activityTypeId)}`}
                >
                  <option value="">Choisir un type</option>
                  {families.map((group) => (
                    <optgroup
                      key={group.family}
                      label={FAMILY_LABEL[group.family]}
                    >
                      {group.types.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-content-neutral-dark">
                  {"Aucun type d'activité au référentiel du domaine."}
                </p>
              )}
            </PanelField>

            {/* D14 — « à planifier » n'est pas un état du schéma : c'est une
                activité prévue qui n'a pas encore de date. La case et la période
                se répondent, et le dire en toutes lettres est ce qui remplace le
                masquage au clic de la maquette : sans JavaScript, un champ ne
                disparaît pas. Les deux ensemble sont **refusées**, la saisie
                revenant avec ses valeurs — plutôt que d'en jeter une des deux. */}
            <fieldset className="flex flex-col gap-2.5">
              <legend className="text-2xs font-semibold text-content-neutral-dark uppercase">
                Période
                <span className="font-normal text-content-neutral-base">
                  {" (obligatoire)"}
                </span>
              </legend>
              <label
                htmlFor="activite-unscheduled"
                className="flex items-center gap-2 text-sm text-content-neutral-darkest"
              >
                <input
                  id="activite-unscheduled"
                  name="isUnscheduled"
                  type="checkbox"
                  defaultChecked={values.isUnscheduled}
                  aria-invalid={errors.isUnscheduled ? true : undefined}
                  aria-describedby={
                    errors.isUnscheduled
                      ? "activite-unscheduled-erreur"
                      : undefined
                  }
                  className="accent-surface-primary-base"
                />
                À planifier, sans date
              </label>
              <p className="text-xs text-content-neutral-base">
                {"Cochée, elle remplace la période : l'activité rejoint le groupe « à planifier » de la roadmap. La période se saisit au jour et se lit au mois."}
              </p>
              {errors.isUnscheduled ? (
                <p
                  id="activite-unscheduled-erreur"
                  className="text-xs font-semibold text-content-danger-dark"
                >
                  {errors.isUnscheduled}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-4">
                <PanelField
                  label="Début"
                  htmlFor="activite-debut"
                  error={errors.periodStart}
                  errorId="activite-debut-erreur"
                  className="flex-1"
                >
                  <input
                    id="activite-debut"
                    name="periodStart"
                    type="date"
                    defaultValue={values.periodStart}
                    aria-invalid={errors.periodStart ? true : undefined}
                    aria-describedby={
                      errors.periodStart ? "activite-debut-erreur" : undefined
                    }
                    className={`${CONTROL} ${borderOf(errors.periodStart)}`}
                  />
                </PanelField>

                <PanelField
                  label="Fin"
                  htmlFor="activite-fin"
                  error={errors.periodEnd}
                  errorId="activite-fin-erreur"
                  className="flex-1"
                >
                  <input
                    id="activite-fin"
                    name="periodEnd"
                    type="date"
                    defaultValue={values.periodEnd}
                    aria-invalid={errors.periodEnd ? true : undefined}
                    aria-describedby={
                      errors.periodEnd ? "activite-fin-erreur" : undefined
                    }
                    className={`${CONTROL} ${borderOf(errors.periodEnd)}`}
                  />
                </PanelField>
              </div>

              {/* L'état n'est pas un champ : il se déduit de ce qui précède
                  (`docs/06` §9). Le dire évite qu'on le cherche. */}
              <p className="text-xs text-content-neutral-base">
                {"L'état ne se saisit pas : une période passée donne une activité terminée, une période en cours une activité en cours, une période à venir ou sans date une activité prévue."}
              </p>
            </fieldset>

            {/* D12 — approche et type sont deux axes distincts, et une activité
                n'en porte qu'une. */}
            <PanelField
              label="Approche"
              htmlFor="activite-approche"
              note="Facultative. Une seule par activité."
              error={errors.approachId}
              errorId="activite-approche-erreur"
            >
              {approaches.length > 0 ? (
                <select
                  id="activite-approche"
                  name="approachId"
                  defaultValue={values.approachId}
                  aria-invalid={errors.approachId ? true : undefined}
                  aria-describedby={
                    errors.approachId ? "activite-approche-erreur" : undefined
                  }
                  className={`${CONTROL} ${borderOf(errors.approachId)}`}
                >
                  <option value="">Aucune</option>
                  {approaches.map((approach) => (
                    <option key={approach.id} value={approach.id}>
                      {approach.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-content-neutral-dark">
                  Aucune approche au référentiel du domaine.
                </p>
              )}
            </PanelField>

            <PanelField
              label="Objectif"
              htmlFor="activite-objectif"
              note="Facultatif, et fortement encouragé. Une phrase qui dit ce que cette activité cherche à obtenir."
              error={errors.objective}
              errorId="activite-objectif-erreur"
            >
              <input
                id="activite-objectif"
                name="objective"
                type="text"
                defaultValue={values.objective}
                autoComplete="off"
                className={`${CONTROL} ${borderOf(errors.objective)}`}
              />
            </PanelField>
          </div>

          {/* Enregistrement sans confirmation intermédiaire (`docs/06` §9) :
              l'activité paraît aussitôt dans la roadmap, et c'est toute la
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
 * Jumeau du `FormField` de `project-form.tsx`, et redit ici plutôt
 * qu'importé : deux composants de quinze lignes de balisage, dont les intitulés
 * n'ont ni la même taille ni le même poids — le panneau est dense, la page ne
 * l'est pas. Dette assumée, consignée au journal.
 *
 * L'intitulé est un `<label for>` — jamais un `placeholder` en guise de nom :
 * il disparaîtrait à la première frappe, et l'assistance ne le lit pas.
 */
function PanelField({
  label,
  htmlFor,
  note,
  error,
  errorId,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  note?: string;
  error?: string | undefined;
  errorId: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
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
