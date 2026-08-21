"use client";

/**
 * Le panneau qui saisit une **entité** — le seul écran d'écriture du
 * référentiel, et celui qui referme le point ouvert de l'amorçage : renommer
 * une entité se fait ici, plutôt qu'en relançant `db:seed` sous un nouveau nom.
 *
 * **Aucun écran de plus** (`docs/06` §2) : c'est la page Administration, plus
 * un panneau. La coquille — voile, tiroir, en-tête, croix, piège de focus — vit
 * dans `DrawerHost` et se monte **avant** tout aller-retour (TD.2) ; ce fichier
 * ne porte que le corps du formulaire. `?entite=nouvelle` et
 * `?entite=<identifiant>` restent des **adresses** valides, qui rendent le même
 * panneau au rendu serveur.
 *
 * **Jumeau de `person-panel.tsx`**, et volontairement : même frontière client —
 * `useActionState` est le seul moyen de faire revenir une saisie refusée avec
 * ses valeurs —, même `Panel`, mêmes jetons. React 19 améliore
 * progressivement : le formulaire est soumis par le navigateur, l'action
 * s'exécute, et **tout fonctionne sans une ligne de JavaScript**.
 *
 * **Un seul formulaire pour les deux gestes**, comme partout depuis T3.4 : mêmes
 * champs, mêmes règles, mêmes refus. Ce qui change tient en trois propriétés —
 * le titre, le libellé du bouton, les valeurs initiales — et le panneau ne sait
 * pas lequel des deux gestes il sert : c'est l'action liée qui le décide, côté
 * serveur.
 *
 * **Un champ, et pas un de plus.** `position` est une colonne d'`entities` que
 * ce panneau n'expose pas : aucun écran de Vision ne la lit, et l'ouvrir ici
 * ferait de la gestion du référentiel un ordonnancement. `archived_at`
 * n'appartient qu'aux deux gestes de rangement, jamais à un champ.
 *
 * **Il ne reçoit pas la session** : un composant client n'a rien à faire d'un
 * contexte de droits. **C'est le serveur qui décide ce que ce formulaire écrit,
 * jamais un champ caché.**
 */

import { useActionState } from "react";

import { borderOf, CONTROL, FormField } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import {
  EMPTY_ENTITY_VALUES,
  type EntityFormState,
  type EntityFormValues,
} from "@/lib/forms/entity";

export function EntityPanel({
  action,
  submitLabel = "Ajouter l'entité",
  initial = EMPTY_ENTITY_VALUES,
}: {
  /**
   * L'action serveur, **déjà liée** à l'entité côté serveur en correction. Le
   * panneau ne connaît pas ce qu'il écrit.
   */
  action: (
    state: EntityFormState,
    formData: FormData,
  ) => Promise<EntityFormState>;
  submitLabel?: string;
  /**
   * Les valeurs de l'entité corrigée. C'est l'**état initial** de
   * `useActionState` : un refus le remplace par ce qui a été tapé, si bien que
   * les deux chemins ont rigoureusement la même forme.
   */
  initial?: EntityFormValues;
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
        label="Nom"
        htmlFor="entite-nom"
        note="La division de l'entreprise, telle qu'elle se nomme chez le client. C'est ce nom qui qualifie les produits et qui filtre leur liste."
        error={errors.label}
        errorId="entite-nom-erreur"
        required
      >
        <input
          id="entite-nom"
          name="label"
          type="text"
          defaultValue={values.label}
          autoComplete="off"
          aria-invalid={errors.label ? true : undefined}
          aria-describedby={errors.label ? "entite-nom-erreur" : undefined}
          className={`${CONTROL} ${borderOf(errors.label)}`}
        />
      </FormField>
    </Panel>
  );
}
