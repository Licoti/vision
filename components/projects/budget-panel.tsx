"use client";

/**
 * Le panneau qui saisit et corrige le budget d'un accompagnement — D28, tenue.
 *
 * **Aucun écran de plus** (`docs/06` §2) : c'est la page du projet, plus un
 * paramètre. `?budget=saisie`, la page reste rendue derrière et porte `inert`,
 * et trois sorties mènent au même endroit — la croix, « Annuler » et le voile.
 *
 * **Une seule adresse pour les deux gestes, et c'est une propriété de la
 * table.** Un projet porte au plus un budget (`budgets_project_unique`), si
 * bien qu'il n'y a rien à désigner dans la valeur du paramètre : elle ouvre, et
 * c'est tout — la forme d'`archiver`, non celle de `ressource`. `saveProjectBudget`
 * **crée ou corrige la même ligne**, et ce panneau ne sait pas lequel des deux
 * gestes il sert : c'est l'action liée qui le décide, côté serveur.
 *
 * **Aucun champ n'est obligatoire**, et c'est la colonne qui le dit : sur
 * `budgets`, seul `project_id` est `not null`, et il est lié côté serveur. Un
 * formulaire soumis vide efface les cinq colonnes — c'est le **seul chemin de
 * rattrapage** d'un budget saisi par erreur, la table ne portant pas
 * d'`archived_at` et ne se supprimant pas (arbitrage (c) de `tickets-C7.md`).
 *
 * **`unit` ne se saisit pas** : `budget_unit` n'a qu'une valeur, `days`, et la
 * colonne la porte par défaut. Un `<select>` d'une seule option n'offre aucun
 * choix, il occupe une ligne — le jour où l'énuméré en portera une seconde, ce
 * champ arrivera avec elle. L'unité se **lit** en revanche dans le bloc.
 *
 * **Rien ici n'appelle l'outil** (D15) : ni pour vérifier l'adresse tapée, ni
 * pour lire un montant, ni pour deviner un nom. Niveau 1 de `docs/03` §5 — la
 * valeur se saisit, elle ne se demande pas. Vision renvoie vers l'outil, elle
 * ne l'interroge pas.
 *
 * **Aucun reste, aucun pourcentage, aucune jauge** : le panneau saisit deux
 * montants, il n'en dérive rien (D39).
 *
 * Il ne reçoit pas la session : un composant client n'a rien à faire d'un
 * contexte de droits. Il reçoit ce qu'il affiche — les outils du référentiel —
 * et une action qui ne connaît pas l'identifiant du projet. **C'est le serveur
 * qui décide ce que ce formulaire écrit, jamais un champ caché.**
 */

import { useActionState } from "react";

import { borderOf, CONTROL, FormField } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import {
  EMPTY_BUDGET_VALUES,
  type BudgetFormState,
  type BudgetFormValues,
} from "@/lib/forms/budget";
import type { ResultToolOption } from "@/lib/queries/activities";

export function BudgetPanel({
  action,
  tools,
  submitLabel = "Enregistrer le budget",
  initial = EMPTY_BUDGET_VALUES,
}: {
  /**
   * L'action serveur, **déjà liée** au projet côté serveur. Le panneau ne
   * connaît pas l'accompagnement dans lequel il écrit.
   */
  action: (
    state: BudgetFormState,
    formData: FormData,
  ) => Promise<BudgetFormState>;
  /**
   * Le référentiel des outils du domaine (`docs/04` §2). Facultatif au choix :
   * `budgets.tool_id` est nullable, et un budget peut être tenu dans un outil
   * que le référentiel ne porte pas encore.
   */
  tools: readonly ResultToolOption[];
  submitLabel?: string;
  /**
   * Les valeurs du budget corrigé. C'est l'**état initial** de
   * `useActionState` : un refus le remplace par ce qui a été tapé, si bien que
   * les deux chemins ont rigoureusement la même forme.
   */
  initial?: BudgetFormValues;
}) {
  const [state, submit, pending] = useActionState(action, {
    values: initial,
    errors: {},
  });

  const values = state.values;
  const errors = state.errors;

  return (
    <Panel
      action={submit}
      pending={pending}
      submitLabel={submitLabel}
      message={state.message}
      errors={errors}
      ok={state.ok}
    >
      {/* `type="text"` et non `type="number"` : ce dernier refuse la virgule
          dans une locale à point, avale les flèches de la molette et ne rend
          rien de lisible à l'assistance quand il est vide. La validation qui
          compte est côté serveur, le formulaire portant `noValidate`.
          `inputMode="decimal"` sert le clavier des mobiles. */}
      <FormField
        label="Alloué"
        htmlFor="budget-alloue"
        note="L'enveloppe de l'accompagnement, en jours. Facultative."
        error={errors.allocated}
        errorId="budget-alloue-erreur"
      >
        <input
          id="budget-alloue"
          name="allocated"
          type="text"
          inputMode="decimal"
          defaultValue={values.allocated}
          autoComplete="off"
          aria-invalid={errors.allocated ? true : undefined}
          aria-describedby={
            errors.allocated ? "budget-alloue-erreur" : undefined
          }
          className={`${CONTROL} ${borderOf(errors.allocated)}`}
        />
      </FormField>

      {/* Aucun rapport n'est établi avec l'alloué — ni reste, ni pourcentage,
          ni alerte de dépassement (D39). Un consommé supérieur à l'enveloppe
          est un fait que l'outil de gestion connaît avant Vision, et le refuser
          ici empêcherait de reporter la vérité. */}
      <FormField
        label="Consommé"
        htmlFor="budget-consomme"
        note="Ce que l'outil de gestion relevait au jour indiqué. Facultatif."
        error={errors.consumed}
        errorId="budget-consomme-erreur"
      >
        <input
          id="budget-consomme"
          name="consumed"
          type="text"
          inputMode="decimal"
          defaultValue={values.consumed}
          autoComplete="off"
          aria-invalid={errors.consumed ? true : undefined}
          aria-describedby={
            errors.consumed ? "budget-consomme-erreur" : undefined
          }
          className={`${CONTROL} ${borderOf(errors.consumed)}`}
        />
      </FormField>

      {/* La date du **relevé**, pas celle de la saisie : Vision ne fabrique
          aucune date. C'est elle qui rend le consommé lisible — D39 n'autorise
          une valeur reportée d'un outil externe qu'avec sa date. */}
      <FormField
        label="Date de relevé"
        htmlFor="budget-date"
        note="Le jour où l'outil de gestion portait ces montants, qui n'est pas forcément celui de la saisie."
        error={errors.measuredOn}
        errorId="budget-date-erreur"
      >
        <input
          id="budget-date"
          name="measuredOn"
          type="date"
          defaultValue={values.measuredOn}
          aria-invalid={errors.measuredOn ? true : undefined}
          aria-describedby={errors.measuredOn ? "budget-date-erreur" : undefined}
          className={`${CONTROL} ${borderOf(errors.measuredOn)}`}
        />
      </FormField>

      {/* Le référentiel du domaine (`docs/04` §2) : brancher un outil de plus
          coûte une ligne, pas un module. Facultatif — la colonne est nullable. */}
      <FormField
        label="Outil de gestion"
        htmlFor="budget-outil"
        note="Facultatif. L'outil externe où le suivi budgétaire est tenu."
        error={errors.toolId}
        errorId="budget-outil-erreur"
      >
        {tools.length > 0 ? (
          <select
            id="budget-outil"
            name="toolId"
            defaultValue={values.toolId}
            aria-invalid={errors.toolId ? true : undefined}
            aria-describedby={errors.toolId ? "budget-outil-erreur" : undefined}
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
      </FormField>

      {/* Le lien profond, et non la racine de l'outil : c'est lui qui fait de
          Vision un point de départ plutôt qu'un annuaire (`docs/06` §8).
          `type="url"` sert le clavier des mobiles ; la validation qui compte
          est côté serveur. */}
      <FormField
        label="Lien vers le suivi"
        htmlFor="budget-lien"
        note="Facultatif. L'adresse exacte du suivi dans l'outil de gestion : Vision y renvoie, elle ne le reproduit pas."
        error={errors.externalUrl}
        errorId="budget-lien-erreur"
      >
        <input
          id="budget-lien"
          name="externalUrl"
          type="url"
          inputMode="url"
          defaultValue={values.externalUrl}
          autoComplete="off"
          placeholder="https://"
          aria-invalid={errors.externalUrl ? true : undefined}
          aria-describedby={
            errors.externalUrl ? "budget-lien-erreur" : undefined
          }
          className={`${CONTROL} ${borderOf(errors.externalUrl)}`}
        />
      </FormField>
    </Panel>
  );
}
