"use client";

/**
 * Le panneau d'un **outil de mesure** — le même pour la saisie et pour la
 * correction.
 *
 * Un seul formulaire pour les deux gestes, comme `IndicatorPanel` : ce qui
 * change est l'action reçue et les valeurs initiales, jamais les champs. La clé
 * d'URL suit la même règle — `?mesure=nouvel` saisit, `?mesure=<identifiant>`
 * corrige.
 *
 * **La liste des outils est reçue, jamais lue ici** : le socle et les panneaux
 * ne touchent pas la base (TD.6). Elle vient du référentiel du domaine, genre
 * « Analytics », et un outil absent s'ajoute en administration — une ligne,
 * jamais un module.
 */

import { useActionState } from "react";

import {
  borderOf,
  CONTROL,
  CONTROL_TEXT,
  FormField,
} from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import { formatTrackingStatus } from "@/lib/format";
import {
  EMPTY_TRACKING_VALUES,
  TRACKING_STATUS_VALUES,
  type TrackingFormState,
  type TrackingFormValues,
} from "@/lib/forms/tracking";

/** Un outil du référentiel, tel que le panneau le propose. */
export type TrackingToolOption = { id: string; name: string };

export function TrackingPanel({
  action,
  submitLabel,
  tools,
  initial = EMPTY_TRACKING_VALUES,
}: {
  action: (
    state: TrackingFormState,
    formData: FormData,
  ) => Promise<TrackingFormState>;
  submitLabel: string;
  /** Les outils de genre « Analytics » du domaine, vivants, déjà triés. */
  tools: readonly TrackingToolOption[];
  initial?: TrackingFormValues;
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
        label="Outil"
        htmlFor="mesure-outil"
        note="Puisé dans le référentiel des outils du domaine, genre « Analytics ». En raccorder un de plus coûte une ligne en administration, jamais un module."
        error={errors.toolId}
        errorId="mesure-outil-erreur"
        required
      >
        <select
          id="mesure-outil"
          name="toolId"
          defaultValue={values.toolId}
          aria-invalid={errors.toolId ? true : undefined}
          aria-describedby={errors.toolId ? "mesure-outil-erreur" : undefined}
          className={`${CONTROL} ${borderOf(errors.toolId)}`}
        >
          {/* L'option vide n'est pas un outil : elle est ce que le panneau
              affiche tant que rien n'est choisi, et le champ est obligatoire. */}
          <option value="">Choisir un outil</option>
          {tools.map((tool) => (
            <option key={tool.id} value={tool.id}>
              {tool.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label="État"
        htmlFor="mesure-etat"
        note="Ce que quelqu'un a constaté : prévu, en place, partiel, arrêté. Vision ne sonde rien et ne déduit rien."
        error={errors.status}
        errorId="mesure-etat-erreur"
        required
      >
        <select
          id="mesure-etat"
          name="status"
          defaultValue={values.status}
          aria-invalid={errors.status ? true : undefined}
          aria-describedby={errors.status ? "mesure-etat-erreur" : undefined}
          className={`${CONTROL} ${borderOf(errors.status)}`}
        >
          <option value="">Choisir un état</option>
          {TRACKING_STATUS_VALUES.map((status) => (
            <option key={status} value={status}>
              {formatTrackingStatus(status)}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label="Périmètre couvert"
        htmlFor="mesure-perimetre"
        note="Facultatif. Ce que l'outil couvre réellement — « site public et espace connecté », « tunnel de souscription seulement ». C'est lui qui donne son sens à « partiel »."
        error={errors.scope}
        errorId="mesure-perimetre-erreur"
      >
        <input
          id="mesure-perimetre"
          name="scope"
          type="text"
          defaultValue={values.scope}
          autoComplete="off"
          aria-invalid={errors.scope ? true : undefined}
          aria-describedby={
            errors.scope ? "mesure-perimetre-erreur" : undefined
          }
          className={`${CONTROL_TEXT} ${borderOf(errors.scope)}`}
        />
      </FormField>

      <FormField
        label="Adresse de la propriété"
        htmlFor="mesure-adresse"
        note="Facultative. Le lien profond vers la propriété dans l'outil. Sans elle, la ligne se lit mais ne mène nulle part."
        error={errors.propertyUrl}
        errorId="mesure-adresse-erreur"
      >
        <input
          id="mesure-adresse"
          name="propertyUrl"
          type="url"
          inputMode="url"
          placeholder="https://"
          defaultValue={values.propertyUrl}
          autoComplete="off"
          aria-invalid={errors.propertyUrl ? true : undefined}
          aria-describedby={
            errors.propertyUrl ? "mesure-adresse-erreur" : undefined
          }
          className={`${CONTROL_TEXT} ${borderOf(errors.propertyUrl)}`}
        />
      </FormField>

      <FormField
        label="Constaté le"
        htmlFor="mesure-constat"
        note="Facultative. La date du dernier contrôle humain — ce qui donne son âge à l'état déclaré."
        error={errors.verifiedOn}
        errorId="mesure-constat-erreur"
      >
        <input
          id="mesure-constat"
          name="verifiedOn"
          type="date"
          defaultValue={values.verifiedOn}
          aria-invalid={errors.verifiedOn ? true : undefined}
          aria-describedby={
            errors.verifiedOn ? "mesure-constat-erreur" : undefined
          }
          className={`${CONTROL} ${borderOf(errors.verifiedOn)}`}
        />
      </FormField>

      <FormField
        label="Précision"
        htmlFor="mesure-precision"
        note="Facultative. Une phrase pour la personne qui reprendra ce dispositif."
        error={errors.note}
        errorId="mesure-precision-erreur"
      >
        <textarea
          id="mesure-precision"
          name="note"
          rows={3}
          defaultValue={values.note}
          aria-invalid={errors.note ? true : undefined}
          aria-describedby={
            errors.note ? "mesure-precision-erreur" : undefined
          }
          className={`${CONTROL_TEXT} ${borderOf(errors.note)}`}
        />
      </FormField>
    </Panel>
  );
}
