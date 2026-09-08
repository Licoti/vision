"use client";

/**
 * Le panneau qui désigne le **premier responsable** d'une entreprise — T9.4.
 *
 * **C'est le geste sans lequel l'écran ne servirait à rien** : une entreprise
 * dont aucune personne ne porte `has_access` n'ouvre aucune session (règle
 * d'entrée 6), et le super administrateur n'entre pas dans les domaines pour le
 * corriger ensuite. Il amorce, une fois ; le responsable désigné prend la suite
 * de l'intérieur.
 *
 * **Aucun choix de rôle.** Ce panneau désigne un **responsable de domaine**, et
 * pas autre chose : un membre sans droit d'écriture ne pourrait ni créer les
 * produits, ni gérer les référentiels, ni désigner qui que ce soit — le domaine
 * resterait inadministrable. Le rôle n'est donc pas un champ, il est le geste.
 *
 * **L'adresse est obligatoire ici alors que la colonne est nullable**, et la
 * note le dit à l'écran : la règle d'entrée 6 rapproche une identité sur
 * l'e-mail au premier passage. D19 sépare *être référencé* de *pouvoir se
 * connecter* ; celle-ci se connecte.
 */

import { useActionState } from "react";

import { borderOf, CONTROL, CONTROL_TEXT, FormField } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import {
  EMPTY_DOMAIN_MANAGER_VALUES,
  type DomainManagerFormState,
} from "@/lib/forms/domain-manager";

export function DomainManagerPanel({
  action,
}: {
  /** L'action serveur, **déjà liée** au domaine. Le panneau ne sait pas lequel. */
  action: (
    state: DomainManagerFormState,
    formData: FormData,
  ) => Promise<DomainManagerFormState>;
}) {
  const [state, submit, pending] = useActionState(action, {
    values: EMPTY_DOMAIN_MANAGER_VALUES,
    errors: {},
  });

  const values = state.values;
  const errors = state.errors;

  return (
    <Panel
      action={submit}
      pending={pending}
      submitLabel="Désigner le responsable"
      message={state.message}
      errors={errors}
      ok={state.ok}
    >
      <FormField
        label="Nom complet"
        htmlFor="responsable-nom"
        note="La personne qui administrera cette entreprise dans Vision : elle crée les produits et les accompagnements, gère les référentiels, et désigne les comptes suivants."
        error={errors.fullName}
        errorId="responsable-nom-erreur"
        required
      >
        <input
          id="responsable-nom"
          name="fullName"
          type="text"
          defaultValue={values.fullName}
          autoComplete="off"
          aria-invalid={errors.fullName ? true : undefined}
          aria-describedby={
            errors.fullName ? "responsable-nom-erreur" : undefined
          }
          className={`${CONTROL} ${borderOf(errors.fullName)}`}
        />
      </FormField>

      <FormField
        label="Adresse e-mail"
        htmlFor="responsable-email"
        note="Celle que le fournisseur d'identité vérifiera. C'est elle qui rapproche le compte de son identité au premier passage : sans elle, l'accès accordé ne servirait à personne."
        error={errors.email}
        errorId="responsable-email-erreur"
        required
      >
        <input
          id="responsable-email"
          name="email"
          type="email"
          inputMode="email"
          placeholder="prenom.nom@acme.com"
          defaultValue={values.email}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={
            errors.email ? "responsable-email-erreur" : undefined
          }
          className={`${CONTROL_TEXT} ${borderOf(errors.email)}`}
        />
      </FormField>
    </Panel>
  );
}
