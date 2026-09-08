"use client";

/**
 * Le panneau qui corrige **les trois champs descriptifs du domaine courant** —
 * T11.5, et le dernier maillon du parcours d'entrée de C11.
 *
 * *« Gérer les informations de son domaine »*, et **exactement cela** : le nom
 * de l'entreprise, le libellé du centre de compétence, la description. Ni
 * l'identité vérifiée, ni le statut, ni l'archivage — **la raison n'est pas
 * hiérarchique, elle est d'étanchéité** (arbitrage (10) de `tickets-C11.md`) :
 * une identité vérifiée dit *quelle entreprise ouvre ce domaine*, et c'est la
 * frontière elle-même. Ce qui n'est pas ici n'y est pas par typage —
 * `OwnDomainValues` refuse les autres colonnes à la compilation —, jamais par
 * l'absence d'un champ à l'écran.
 *
 * **Jumeau de `referential-panel.tsx`**, et volontairement : même frontière
 * client — `useActionState` est le seul moyen de faire revenir une saisie
 * refusée avec ses valeurs —, même `Panel`, mêmes jetons. React 19 améliore
 * progressivement : le formulaire est soumis par le navigateur, l'action
 * s'exécute, et **tout fonctionne sans une ligne de JavaScript**.
 *
 * **Aucun geste de création ici**, à la différence des dix autres panneaux de
 * cet écran : il n'y a qu'un domaine, celui de la session, et il existe déjà.
 * Le panneau ne reçoit donc aucun identifiant — il n'a rien à désigner.
 *
 * **Il ne reçoit pas la session** : un composant client n'a rien à faire d'un
 * contexte de droits. **C'est le serveur qui décide ce que ce formulaire
 * écrit**, jamais un champ caché.
 */

import { useActionState } from "react";

import { borderOf, CONTROL, FormField } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import {
  EMPTY_OWN_DOMAIN_VALUES,
  type OwnDomainFormState,
  type OwnDomainFormValues,
} from "@/lib/forms/domain";

export function OwnDomainPanel({
  action,
  initial = EMPTY_OWN_DOMAIN_VALUES,
}: {
  /** L'action serveur. Elle dérive sa cible de la session, jamais d'un argument lié. */
  action: (
    state: OwnDomainFormState,
    formData: FormData,
  ) => Promise<OwnDomainFormState>;
  /**
   * Les valeurs du domaine tel qu'il est. C'est l'**état initial** de
   * `useActionState` : un refus le remplace par ce qui a été tapé, si bien que
   * les deux chemins ont rigoureusement la même forme.
   */
  initial?: OwnDomainFormValues;
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
      submitLabel="Enregistrer les modifications"
      message={state.message}
      errors={errors}
      ok={state.ok}
    >
      <FormField
        label="Nom de l'entreprise"
        htmlFor="ce-domaine-nom"
        note="Le nom sous lequel cette entreprise se désigne. Il paraît dans la barre latérale, sous le nom de la personne connectée."
        error={errors.name}
        errorId="ce-domaine-nom-erreur"
        required
      >
        <input
          id="ce-domaine-nom"
          name="name"
          type="text"
          defaultValue={values.name}
          autoComplete="off"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "ce-domaine-nom-erreur" : undefined}
          className={`${CONTROL} ${borderOf(errors.name)}`}
        />
      </FormField>

      <FormField
        label="Centre de compétence"
        htmlFor="ce-domaine-centre"
        note="Le nom de l'équipe design qui accompagne les produits de cette entreprise — « Studio Design », « Pôle UX »."
        error={errors.competenceCenterName}
        errorId="ce-domaine-centre-erreur"
        required
      >
        <input
          id="ce-domaine-centre"
          name="competenceCenterName"
          type="text"
          defaultValue={values.competenceCenterName}
          autoComplete="off"
          aria-invalid={errors.competenceCenterName ? true : undefined}
          aria-describedby={
            errors.competenceCenterName ? "ce-domaine-centre-erreur" : undefined
          }
          className={`${CONTROL} ${borderOf(errors.competenceCenterName)}`}
        />
      </FormField>

      <FormField
        label="Description"
        htmlFor="ce-domaine-description"
        note="Ce que fait cette entreprise, en une phrase. Facultative."
        error={errors.description}
        errorId="ce-domaine-description-erreur"
      >
        <textarea
          id="ce-domaine-description"
          name="description"
          rows={3}
          defaultValue={values.description}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={
            errors.description ? "ce-domaine-description-erreur" : undefined
          }
          className={`${CONTROL} ${borderOf(errors.description)} resize-y`}
        />
      </FormField>
    </Panel>
  );
}
