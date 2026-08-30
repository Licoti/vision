"use client";

/**
 * Le panneau qui saisit un **type d'activité** (T7.4).
 *
 * **Aucun écran de plus** (`docs/06` §2), et la même frontière client que ses
 * quatre voisins : `useActionState` seul, la coquille dans `DrawerHost` (TD.2),
 * et **tout qui fonctionne sans une ligne de JavaScript**.
 *
 * **Trois champs de logique, trois natures de contrôle**, et c'est ce qui l'a
 * sorti du panneau commun : la `family` regroupe le choix du type dans le
 * panneau d'activité, `produces_result` conditionne la saisie d'un résultat
 * (T4.4), `default_tool_id` nomme le lien sortant de la carte de roadmap.
 *
 * **L'outil est facultatif, et sa liste peut être vide.** Un domaine dont aucun
 * outil n'est raccordé rend une phrase plutôt qu'un `<select>` sans option —
 * c'est la forme de `result-panel.tsx`, et c'est la règle 5 appliquée à un
 * champ : une absence se dit.
 *
 * **Il ne reçoit pas la session.** C'est le serveur qui décide ce que ce
 * formulaire écrit, jamais un champ caché.
 */

import { useActionState } from "react";

import { borderOf, CONTROL, FormField } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import { formatActivityFamily } from "@/lib/format";
import {
  ACTIVITY_FAMILIES,
  EMPTY_ACTIVITY_TYPE_VALUES,
  type ActivityTypeFormState,
  type ActivityTypeFormValues,
} from "@/lib/forms/activity-type";
import type { ResultToolOption } from "@/lib/queries/activities";

export function ActivityTypePanel({
  action,
  tools,
  submitLabel,
  initial = EMPTY_ACTIVITY_TYPE_VALUES,
}: {
  action: (
    state: ActivityTypeFormState,
    formData: FormData,
  ) => Promise<ActivityTypeFormState>;
  /**
   * Les outils du domaine, lus par le résolveur avec `listResultToolOptions` —
   * y compris son `keepToolId`, qui garde dans la liste l'outil déjà porté par
   * la ligne qu'on corrige, fût-il archivé.
   */
  tools: readonly ResultToolOption[];
  submitLabel: string;
  initial?: ActivityTypeFormValues;
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
        label="Libellé"
        htmlFor="type-libelle"
        note="Le fait d'accompagnement tel qu'il se nomme dans le centre : « Atelier de cadrage », « Audit d'accessibilité », « Campagne de tests »."
        error={errors.label}
        errorId="type-libelle-erreur"
        required
      >
        <input
          id="type-libelle"
          name="label"
          type="text"
          defaultValue={values.label}
          autoComplete="off"
          aria-invalid={errors.label ? true : undefined}
          aria-describedby={errors.label ? "type-libelle-erreur" : undefined}
          className={`${CONTROL} ${borderOf(errors.label)}`}
        />
      </FormField>

      <FormField
        label="Famille"
        htmlFor="type-famille"
        note="Les six familles de la méthode : elles regroupent les types dans le choix du panneau d'activité. C'est un axe de lecture, jamais une méthodologie imposée."
        error={errors.family}
        errorId="type-famille-erreur"
        required
      >
        <select
          id="type-famille"
          name="family"
          defaultValue={values.family}
          aria-invalid={errors.family ? true : undefined}
          aria-describedby={errors.family ? "type-famille-erreur" : undefined}
          className={`${CONTROL} ${borderOf(errors.family)}`}
        >
          {ACTIVITY_FAMILIES.map((family) => (
            <option key={family} value={family}>
              {formatActivityFamily(family)}
            </option>
          ))}
        </select>
      </FormField>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-2xs font-semibold text-content-neutral-dark uppercase">
          Résultat
        </legend>
        <label
          htmlFor="type-resultat"
          className="flex items-center gap-2 text-sm text-content-neutral-darkest"
        >
          <input
            id="type-resultat"
            name="producesResult"
            type="checkbox"
            defaultChecked={values.producesResult}
            className="accent-surface-primary-base"
          />
          Ce type produit un résultat chiffré
        </label>
        <p className="text-xs text-content-neutral-base">
          {
            "Cochée, une activité de ce type terminée propose la saisie d'un résultat : un chiffre reporté de l'outil, avec sa date et son lien profond. Décocher ne retire aucun résultat déjà saisi."
          }
        </p>
      </fieldset>

      <FormField
        label="Outil par défaut"
        htmlFor="type-outil"
        note="Facultatif. L'outil dans lequel ce type de travail se fait d'habitude : la carte de roadmap le nomme."
        error={errors.defaultToolId}
        errorId="type-outil-erreur"
      >
        {tools.length > 0 ? (
          <select
            id="type-outil"
            name="defaultToolId"
            defaultValue={values.defaultToolId}
            aria-invalid={errors.defaultToolId ? true : undefined}
            aria-describedby={
              errors.defaultToolId ? "type-outil-erreur" : undefined
            }
            className={`${CONTROL} ${borderOf(errors.defaultToolId)}`}
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
            {
              "Aucun outil n'est raccordé à ce domaine. Le référentiel « Outils » en accueille un en une ligne."
            }
          </p>
        )}
      </FormField>

      <FormField
        label="Ordre"
        htmlFor="type-position"
        note="La place de ce type dans sa famille. Les plus petits nombres viennent en premier ; à égalité, l'ordre est alphabétique."
        error={errors.position}
        errorId="type-position-erreur"
        required
      >
        <input
          id="type-position"
          name="position"
          type="text"
          inputMode="decimal"
          defaultValue={values.position}
          autoComplete="off"
          aria-invalid={errors.position ? true : undefined}
          aria-describedby={errors.position ? "type-position-erreur" : undefined}
          className={`${CONTROL} ${borderOf(errors.position)}`}
        />
      </FormField>
    </Panel>
  );
}
