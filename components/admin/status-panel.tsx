"use client";

/**
 * Le panneau qui saisit un **statut de projet** (T7.4).
 *
 * **Aucun écran de plus** (`docs/06` §2) : c'est la page Administration, plus un
 * panneau. La coquille — voile, tiroir, en-tête, croix, piège de focus — vit
 * dans `DrawerHost` et se monte **avant** tout aller-retour (TD.2) ; ce fichier
 * ne porte que le corps du formulaire. `?referentiel=statuts&ligne=nouvelle` et
 * `?referentiel=statuts&ligne=<identifiant>` restent des **adresses** valides,
 * qui rendent le même panneau au rendu serveur.
 *
 * **Jumeau de `referential-panel.tsx`**, et volontairement : même frontière
 * client — `useActionState` est le seul moyen de faire revenir une saisie
 * refusée avec ses valeurs —, même `Panel`, mêmes jetons. React 19 améliore
 * progressivement : le formulaire est soumis par le navigateur, l'action
 * s'exécute, et **tout fonctionne sans une ligne de JavaScript**.
 *
 * **Le libellé se renomme, la nature se choisit** (`docs/04` §1). C'est tout ce
 * qui sépare ce panneau du panneau commun, et c'est assez : la nature porte la
 * logique — ce qui compte comme actif, ce qui est terminé —, et le `<select>` ne
 * propose que les quatre valeurs de l'énuméré. **D42 tient par construction** :
 * `archived` n'y est pas, l'archivage étant porté par `archived_at` seul.
 *
 * **Il ne reçoit pas la session** : un composant client n'a rien à faire d'un
 * contexte de droits. **C'est le serveur qui décide ce que ce formulaire écrit,
 * jamais un champ caché.**
 */

import { useActionState } from "react";

import { borderOf, CONTROL, FormField } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import { formatProjectStatusNature } from "@/lib/format";
import {
  EMPTY_PROJECT_STATUS_VALUES,
  PROJECT_STATUS_NATURES,
  type ProjectStatusFormState,
  type ProjectStatusFormValues,
} from "@/lib/forms/project-status";

export function StatusPanel({
  action,
  submitLabel,
  initial = EMPTY_PROJECT_STATUS_VALUES,
}: {
  /**
   * L'action serveur, **déjà liée** à la ligne côté serveur en correction. Le
   * panneau ne connaît ni la table qu'il écrit, ni le geste qu'il sert.
   */
  action: (
    state: ProjectStatusFormState,
    formData: FormData,
  ) => Promise<ProjectStatusFormState>;
  submitLabel: string;
  /**
   * Les valeurs de la ligne corrigée. C'est l'**état initial** de
   * `useActionState` : un refus le remplace par ce qui a été tapé, si bien que
   * les deux chemins ont rigoureusement la même forme.
   */
  initial?: ProjectStatusFormValues;
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
        htmlFor="statut-libelle"
        note="Le statut tel que le domaine le dit : « En cadrage », « En cours », « En pause », « Terminé ». Il se renomme librement — c'est la nature, en dessous, qui porte la logique."
        error={errors.label}
        errorId="statut-libelle-erreur"
        required
      >
        <input
          id="statut-libelle"
          name="label"
          type="text"
          defaultValue={values.label}
          autoComplete="off"
          aria-invalid={errors.label ? true : undefined}
          aria-describedby={errors.label ? "statut-libelle-erreur" : undefined}
          className={`${CONTROL} ${borderOf(errors.label)}`}
        />
      </FormField>

      <FormField
        label="Nature"
        htmlFor="statut-nature"
        note="Ce que le code en déduit : un accompagnement « En cours » compte comme actif, un « Terminé » ne pèse plus sur la disponibilité. Renommer le libellé ne change rien ; changer la nature change la lecture des écrans."
        error={errors.nature}
        errorId="statut-nature-erreur"
        required
      >
        <select
          id="statut-nature"
          name="nature"
          defaultValue={values.nature}
          aria-invalid={errors.nature ? true : undefined}
          aria-describedby={errors.nature ? "statut-nature-erreur" : undefined}
          className={`${CONTROL} ${borderOf(errors.nature)}`}
        >
          {PROJECT_STATUS_NATURES.map((nature) => (
            <option key={nature} value={nature}>
              {formatProjectStatusNature(nature)}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label="Ordre"
        htmlFor="statut-position"
        note="La place de ce statut dans les listes et les formulaires. Les plus petits nombres viennent en premier ; à égalité, l'ordre est alphabétique."
        error={errors.position}
        errorId="statut-position-erreur"
        required
      >
        <input
          id="statut-position"
          name="position"
          /* `inputMode` plutôt que `type="number"` : la virgule française y est
             acceptée, et l'action la rend à PostgreSQL en point. Un
             `type="number"` refuserait « 12,5 » selon la locale du navigateur,
             ce qui ferait varier le formulaire d'un poste à l'autre. */
          type="text"
          inputMode="decimal"
          defaultValue={values.position}
          autoComplete="off"
          aria-invalid={errors.position ? true : undefined}
          aria-describedby={
            errors.position ? "statut-position-erreur" : undefined
          }
          className={`${CONTROL} ${borderOf(errors.position)}`}
        />
      </FormField>
    </Panel>
  );
}
