"use client";

/**
 * Le panneau qui saisit une **piste de démarrage** (T7.4).
 *
 * **Aucun écran de plus** (`docs/06` §2), même frontière client que ses quatre
 * voisins, et **tout qui fonctionne sans une ligne de JavaScript**.
 *
 * **Six champs — le plus fourni de l'écran**, et c'est ce qui a définitivement
 * écarté l'idée d'un panneau générique : la moitié n'existe sur aucun autre
 * référentiel. Une piste porte la phrase de sa carte, le texte long de son
 * panneau, son genre et l'outil vers lequel elle renvoie.
 *
 * **Aucune adresse ici** : elle vit sur `tools.base_url`, et une seule fois.
 * Deux sources pour un même lien divergeraient le jour où l'une des deux
 * changerait. Une piste sans outil — une méthode — n'a donc pas de lien, ce qui
 * est un état normal, et la carte le dit en une phrase.
 *
 * **Aucun type d'activité** : c'est T7.10, avec sa migration.
 *
 * **Il ne reçoit pas la session.** C'est le serveur qui décide ce que ce
 * formulaire écrit, jamais un champ caché.
 */

import { useActionState } from "react";

import {
  borderOf,
  CONTROL,
  CONTROL_TEXT,
  FormField,
} from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import { formatStarterKind } from "@/lib/format";
import {
  EMPTY_STARTER_VALUES,
  STARTER_KINDS,
  type StarterFormState,
  type StarterFormValues,
} from "@/lib/forms/starter";
import type { ResultToolOption } from "@/lib/queries/activities";

export function StarterPanel({
  action,
  tools,
  submitLabel,
  initial = EMPTY_STARTER_VALUES,
}: {
  action: (
    state: StarterFormState,
    formData: FormData,
  ) => Promise<StarterFormState>;
  /** Les outils du domaine — même lecture que le panneau de type d'activité. */
  tools: readonly ResultToolOption[];
  submitLabel: string;
  initial?: StarterFormValues;
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
        htmlFor="piste-libelle"
        note="Le titre de la carte : « Lancer un audit d'accessibilité », « Cadrer avec l'équipe produit »."
        error={errors.label}
        errorId="piste-libelle-erreur"
        required
      >
        <input
          id="piste-libelle"
          name="label"
          type="text"
          defaultValue={values.label}
          autoComplete="off"
          aria-invalid={errors.label ? true : undefined}
          aria-describedby={errors.label ? "piste-libelle-erreur" : undefined}
          className={`${CONTROL} ${borderOf(errors.label)}`}
        />
      </FormField>

      <FormField
        label="Phrase de présentation"
        htmlFor="piste-resume"
        note="Ce que la piste permet, en une ligne. C'est ce que la carte rend sous son titre — sans elle, la carte serait un titre nu."
        error={errors.summary}
        errorId="piste-resume-erreur"
        required
      >
        <textarea
          id="piste-resume"
          name="summary"
          rows={2}
          defaultValue={values.summary}
          aria-invalid={errors.summary ? true : undefined}
          aria-describedby={errors.summary ? "piste-resume-erreur" : undefined}
          className={`${CONTROL_TEXT} ${borderOf(errors.summary)}`}
        />
      </FormField>

      <FormField
        label="Comment s'y prendre"
        htmlFor="piste-conduite"
        note="Facultatif. Le texte long que le panneau de la piste déplie. Vider le champ le retire."
        error={errors.guidance}
        errorId="piste-conduite-erreur"
      >
        <textarea
          id="piste-conduite"
          name="guidance"
          rows={5}
          defaultValue={values.guidance}
          aria-invalid={errors.guidance ? true : undefined}
          aria-describedby={
            errors.guidance ? "piste-conduite-erreur" : undefined
          }
          className={`${CONTROL_TEXT} ${borderOf(errors.guidance)}`}
        />
      </FormField>

      <FormField
        label="Nature"
        htmlFor="piste-nature"
        note="De quoi la piste est faite : un outil raccordé, une manière de faire qu'aucun outil ne porte, un document de référence. Ce n'est pas un rang — aucune ne vaut mieux qu'une autre."
        error={errors.kind}
        errorId="piste-nature-erreur"
        required
      >
        <select
          id="piste-nature"
          name="kind"
          defaultValue={values.kind}
          aria-invalid={errors.kind ? true : undefined}
          aria-describedby={errors.kind ? "piste-nature-erreur" : undefined}
          className={`${CONTROL} ${borderOf(errors.kind)}`}
        >
          {STARTER_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {formatStarterKind(kind)}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label="Outil"
        htmlFor="piste-outil"
        note="Facultatif. La plateforme vers laquelle la piste renvoie ; son adresse est celle de l'outil, jamais une seconde saisie. Une méthode n'en a pas."
        error={errors.toolId}
        errorId="piste-outil-erreur"
      >
        {tools.length > 0 ? (
          <select
            id="piste-outil"
            name="toolId"
            defaultValue={values.toolId}
            aria-invalid={errors.toolId ? true : undefined}
            aria-describedby={errors.toolId ? "piste-outil-erreur" : undefined}
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
            {
              "Aucun outil n'est raccordé à ce domaine. Le référentiel « Outils » en accueille un en une ligne."
            }
          </p>
        )}
      </FormField>

      <FormField
        label="Ordre"
        htmlFor="piste-position"
        note="La place de cette piste dans le bloc « Démarrage ». Les plus petits nombres viennent en premier ; à égalité, l'ordre est alphabétique."
        error={errors.position}
        errorId="piste-position-erreur"
        required
      >
        <input
          id="piste-position"
          name="position"
          type="text"
          inputMode="decimal"
          defaultValue={values.position}
          autoComplete="off"
          aria-invalid={errors.position ? true : undefined}
          aria-describedby={
            errors.position ? "piste-position-erreur" : undefined
          }
          className={`${CONTROL} ${borderOf(errors.position)}`}
        />
      </FormField>
    </Panel>
  );
}
