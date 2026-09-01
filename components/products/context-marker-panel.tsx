"use client";

/**
 * Le panneau d'un **repère de contexte** — le même pour la saisie et pour la
 * correction.
 *
 * Un seul formulaire pour les deux gestes, comme `TrackingPanel` : ce qui change
 * est l'action reçue et les valeurs initiales, jamais les champs. La clé d'URL
 * suit la même règle — `?contexte=nouveau` saisit, `?contexte=<identifiant>`
 * corrige.
 *
 * **C'est le seul geste d'écriture de toute la couche.** Les repères
 * d'accompagnement remontent des activités terminées : rien ne se saisit pour
 * eux, et ce panneau ne les connaît pas. La phrase d'introduction le dit à qui
 * l'ouvre en cherchant à noter un atelier.
 *
 * **La liste des accompagnements est reçue, jamais lue ici** : le socle et les
 * panneaux ne touchent pas la base (TD.6). Et ce n'est pas elle qui protège —
 * l'action revérifie que l'accompagnement choisi appartient bien à ce produit,
 * sur l'identifiant **reçu**.
 */

import { useActionState } from "react";

import {
  borderOf,
  CONTROL,
  CONTROL_TEXT,
  FormField,
} from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import {
  EMPTY_CONTEXT_MARKER_VALUES,
  type ContextMarkerFormState,
  type ContextMarkerFormValues,
} from "@/lib/forms/context-marker";

/** Un accompagnement du produit, tel que le panneau le propose. */
export type ContextMarkerProjectOption = { id: string; name: string };

export function ContextMarkerPanel({
  action,
  submitLabel,
  projects,
  initial = EMPTY_CONTEXT_MARKER_VALUES,
}: {
  action: (
    state: ContextMarkerFormState,
    formData: FormData,
  ) => Promise<ContextMarkerFormState>;
  submitLabel: string;
  /** Les accompagnements vivants de **ce** produit, déjà triés. */
  projects: readonly ContextMarkerProjectOption[];
  initial?: ContextMarkerFormValues;
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
      <p className="text-sm leading-175 text-content-neutral-dark">
        Un fait daté du produit que le centre n&apos;a pas produit : une mise en
        production, une campagne, un changement d&apos;équipe. Les activités des
        accompagnements, elles, remontent toutes seules.
      </p>

      <FormField
        label="Date"
        htmlFor="contexte-date"
        note="Le jour où le fait a eu lieu. L'axe se lit au mois ; le jour se lit sur la fiche."
        error={errors.happenedOn}
        errorId="contexte-date-erreur"
        required
      >
        <input
          id="contexte-date"
          name="happenedOn"
          type="date"
          defaultValue={values.happenedOn}
          aria-invalid={errors.happenedOn ? true : undefined}
          aria-describedby={
            errors.happenedOn ? "contexte-date-erreur" : undefined
          }
          className={`${CONTROL} ${borderOf(errors.happenedOn)}`}
        />
      </FormField>

      <FormField
        label="Intitulé"
        htmlFor="contexte-intitule"
        note="Ce que le fait est, en une ligne — « Mise en production du nouveau tunnel de virement »."
        error={errors.label}
        errorId="contexte-intitule-erreur"
        required
      >
        <input
          id="contexte-intitule"
          name="label"
          type="text"
          defaultValue={values.label}
          autoComplete="off"
          aria-invalid={errors.label ? true : undefined}
          aria-describedby={
            errors.label ? "contexte-intitule-erreur" : undefined
          }
          className={`${CONTROL_TEXT} ${borderOf(errors.label)}`}
        />
      </FormField>

      <FormField
        label="Note"
        htmlFor="contexte-note"
        note="Facultative. Ce qu'il faudra savoir pour relire la courbe dans deux ans."
        error={errors.note}
        errorId="contexte-note-erreur"
      >
        <textarea
          id="contexte-note"
          name="note"
          rows={3}
          defaultValue={values.note}
          aria-invalid={errors.note ? true : undefined}
          aria-describedby={errors.note ? "contexte-note-erreur" : undefined}
          className={`${CONTROL_TEXT} ${borderOf(errors.note)}`}
        />
      </FormField>

      <FormField
        label="Accompagnement lié"
        htmlFor="contexte-accompagnement"
        note="Facultatif, et c'est voulu : une mise en production n'est pas la nôtre. Renseigné, le repère nomme l'accompagnement qui lui sert de contexte."
        error={errors.projectId}
        errorId="contexte-accompagnement-erreur"
      >
        <select
          id="contexte-accompagnement"
          name="projectId"
          defaultValue={values.projectId}
          aria-invalid={errors.projectId ? true : undefined}
          aria-describedby={
            errors.projectId ? "contexte-accompagnement-erreur" : undefined
          }
          className={`${CONTROL} ${borderOf(errors.projectId)}`}
        >
          {/* L'option vide **est** une réponse, à la différence de celle du
              panneau d'un outil : le champ est facultatif, et « aucun » est le
              cas le plus fréquent. */}
          <option value="">Aucun</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </FormField>
    </Panel>
  );
}
