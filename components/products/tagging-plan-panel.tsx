"use client";

/**
 * Le panneau du **plan de taggage** — un seul, pour renseigner comme pour
 * corriger.
 *
 * Ce n'est pas une commodité d'écriture : `tagging_plans_product_unique` fait
 * qu'un produit a au plus un plan vivant, si bien que « en déclarer un » et
 * « corriger celui-là » sont la même écriture vue à deux moments. Une seule
 * action derrière — `saveTaggingPlan` —, et une seule valeur d'ouverture,
 * `?plan=modifier`, l'objet visé étant celui de la page. La forme de la vision
 * produit, pour la même raison.
 */

import { useActionState } from "react";

import {
  borderOf,
  CONTROL,
  CONTROL_TEXT,
  FormField,
} from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import { formatTaggingPlanStatus } from "@/lib/format";
import {
  EMPTY_TAGGING_PLAN_VALUES,
  TAGGING_PLAN_STATUS_VALUES,
  type TaggingPlanFormState,
  type TaggingPlanFormValues,
} from "@/lib/forms/tagging-plan";

export function TaggingPlanPanel({
  action,
  submitLabel,
  initial = EMPTY_TAGGING_PLAN_VALUES,
}: {
  action: (
    state: TaggingPlanFormState,
    formData: FormData,
  ) => Promise<TaggingPlanFormState>;
  submitLabel: string;
  initial?: TaggingPlanFormValues;
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
      <FormField
        label="Adresse du plan"
        htmlFor="plan-adresse"
        note="Le lien vers le document, hébergé ailleurs — SharePoint, Confluence, un tableur. Vision ne stocke jamais de fichier : elle renvoie vers l'outil source."
        error={errors.url}
        errorId="plan-adresse-erreur"
        required
      >
        <input
          id="plan-adresse"
          name="url"
          type="url"
          inputMode="url"
          placeholder="https://"
          defaultValue={values.url}
          autoComplete="off"
          aria-invalid={errors.url ? true : undefined}
          aria-describedby={errors.url ? "plan-adresse-erreur" : undefined}
          className={`${CONTROL_TEXT} ${borderOf(errors.url)}`}
        />
      </FormField>

      <FormField
        label="État"
        htmlFor="plan-etat"
        note="Ce que quelqu'un a constaté : en cours d'écriture, à jour, à revoir. C'est une personne qui dit qu'un plan a décroché du produit, jamais un calcul de Vision."
        error={errors.status}
        errorId="plan-etat-erreur"
        required
      >
        <select
          id="plan-etat"
          name="status"
          defaultValue={values.status}
          aria-invalid={errors.status ? true : undefined}
          aria-describedby={errors.status ? "plan-etat-erreur" : undefined}
          className={`${CONTROL} ${borderOf(errors.status)}`}
        >
          <option value="">Choisir un état</option>
          {TAGGING_PLAN_STATUS_VALUES.map((status) => (
            <option key={status} value={status}>
              {formatTaggingPlanStatus(status)}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label="Mis à jour le"
        htmlFor="plan-date"
        note="La date portée par le document lui-même, et non celle de cette saisie. C'est ce fait-là que la liste des produits affiche."
        error={errors.updatedOn}
        errorId="plan-date-erreur"
        required
      >
        <input
          id="plan-date"
          name="updatedOn"
          type="date"
          defaultValue={values.updatedOn}
          aria-invalid={errors.updatedOn ? true : undefined}
          aria-describedby={errors.updatedOn ? "plan-date-erreur" : undefined}
          className={`${CONTROL} ${borderOf(errors.updatedOn)}`}
        />
      </FormField>

      <FormField
        label="Précision"
        htmlFor="plan-precision"
        note="Facultative. Ce qui manque au plan, quand quelqu'un le sait — « le tunnel refondu en juin n'y figure pas encore »."
        error={errors.note}
        errorId="plan-precision-erreur"
      >
        <textarea
          id="plan-precision"
          name="note"
          rows={3}
          defaultValue={values.note}
          aria-invalid={errors.note ? true : undefined}
          aria-describedby={errors.note ? "plan-precision-erreur" : undefined}
          className={`${CONTROL_TEXT} ${borderOf(errors.note)}`}
        />
      </FormField>
    </Panel>
  );
}
