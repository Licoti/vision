"use client";

/**
 * Le panneau qui saisit un **outil raccordé** (T7.4).
 *
 * **Aucun écran de plus** (`docs/06` §2), même frontière client que ses quatre
 * voisins, et **tout qui fonctionne sans une ligne de JavaScript**.
 *
 * **Deux champs seulement, et pas de position** : `tools` ne porte pas la
 * colonne, ni au schéma ni dans `docs/04` §2, et lui en donner une aurait coûté
 * la migration que l'arbitrage (a) réserve à T7.10. La liste s'ordonne par nom.
 *
 * **`sync_mode` et `api_config` ne se saisissent pas** (arbitrage (i)) : D15
 * pose `manual` au POC et `api_config` vide, réservé au branchement futur. Un
 * champ qui n'a pas de lecteur est celui qu'on relit un jour sans savoir
 * pourquoi.
 *
 * **Vision ne visite jamais l'adresse.** Ni pour la vérifier, ni pour la sonder,
 * ni pour en deviner le nom : elle renvoie vers l'outil, elle ne l'interroge pas
 * (D15). Ce qui est contrôlé est le **schéma** de l'URL, et ce contrôle-là n'est
 * pas décoratif — la carte d'une piste rend cette adresse dans un
 * `ExternalLink`, qui pose le `href` tel quel.
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
import { formatToolKind } from "@/lib/format";
import {
  EMPTY_TOOL_VALUES,
  TOOL_KINDS,
  type ToolFormState,
  type ToolFormValues,
} from "@/lib/forms/tool";

export function ToolPanel({
  action,
  submitLabel,
  initial = EMPTY_TOOL_VALUES,
}: {
  action: (
    state: ToolFormState,
    formData: FormData,
  ) => Promise<ToolFormState>;
  submitLabel: string;
  initial?: ToolFormValues;
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
      {/* La colonne s'appelle `name` — la seule des neuf tables de cet écran
          dans ce cas —, et le champ porte donc ce nom-là. */}
      <FormField
        label="Nom"
        htmlFor="outil-nom"
        note="L'outil tel qu'il se nomme : « Ergonome », « Portail analytics », « Outil de gestion ». Raccorder un outil coûte une ligne, jamais un module."
        error={errors.name}
        errorId="outil-nom-erreur"
        required
      >
        <input
          id="outil-nom"
          name="name"
          type="text"
          defaultValue={values.name}
          autoComplete="off"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "outil-nom-erreur" : undefined}
          className={`${CONTROL} ${borderOf(errors.name)}`}
        />
      </FormField>

      <FormField
        label="Genre"
        htmlFor="outil-genre"
        note="Ce que l'outil produit : un audit produit un résultat chiffré, un portail analytics alimente un relevé d'indicateur, un outil de budget porte la synthèse d'un accompagnement."
        error={errors.kind}
        errorId="outil-genre-erreur"
        required
      >
        <select
          id="outil-genre"
          name="kind"
          defaultValue={values.kind}
          aria-invalid={errors.kind ? true : undefined}
          aria-describedby={errors.kind ? "outil-genre-erreur" : undefined}
          className={`${CONTROL} ${borderOf(errors.kind)}`}
        >
          {TOOL_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {formatToolKind(kind)}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label="Adresse"
        htmlFor="outil-adresse"
        note="Facultative. La racine du lien profond, vers laquelle les pistes de démarrage renvoient. Sans elle, une piste se lit mais ne mène nulle part."
        error={errors.baseUrl}
        errorId="outil-adresse-erreur"
      >
        <input
          id="outil-adresse"
          name="baseUrl"
          type="url"
          inputMode="url"
          placeholder="https://"
          defaultValue={values.baseUrl}
          autoComplete="off"
          aria-invalid={errors.baseUrl ? true : undefined}
          aria-describedby={
            errors.baseUrl ? "outil-adresse-erreur" : undefined
          }
          className={`${CONTROL_TEXT} ${borderOf(errors.baseUrl)}`}
        />
      </FormField>
    </Panel>
  );
}
