"use client";

/**
 * Le panneau qui **ajoute** une identité vérifiée à une entreprise — T9.4.
 *
 * **Jumeau du bloc d'identité de `domain-panel.tsx`**, et volontairement : la
 * règle de forme est écrite une seule fois, dans `lib/forms/domain.ts`, et les
 * deux panneaux la partagent. Ce qui change ici est qu'il n'y a rien d'autre à
 * saisir — le domaine est déjà désigné, côté serveur, par l'action liée.
 *
 * **Pourquoi ce geste existe.** Une entreprise peut porter plusieurs identités —
 * une filiale, un second nom de domaine, une migration d'un fournisseur à
 * l'autre —, et l'arbitrage (3) de `tickets-C9.md` a créé la table pour cela :
 * *« sans migration à chaque fois »*. Une table justifiée par là qui ne
 * s'écrirait qu'une fois, à la création, aurait laissé les trois cas sans issue.
 */

import { useActionState } from "react";

import { borderOf, CONTROL, CONTROL_TEXT, FormField } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import { formatIdentityProvider } from "@/lib/format";
import {
  EMPTY_DOMAIN_IDENTITY_VALUES,
  IDENTITY_CLAIM,
  IDENTITY_PROVIDERS,
  isIdentityProvider,
  type DomainIdentityFormState,
} from "@/lib/forms/domain";

export function DomainIdentityPanel({
  action,
}: {
  /** L'action serveur, **déjà liée** au domaine. Le panneau ne sait pas lequel. */
  action: (
    state: DomainIdentityFormState,
    formData: FormData,
  ) => Promise<DomainIdentityFormState>;
}) {
  const [state, submit, pending] = useActionState(action, {
    values: EMPTY_DOMAIN_IDENTITY_VALUES,
    errors: {},
  });

  const values = state.values;
  const errors = state.errors;

  const claim = isIdentityProvider(values.provider)
    ? IDENTITY_CLAIM[values.provider]
    : IDENTITY_CLAIM.google;

  return (
    <Panel
      action={submit}
      pending={pending}
      submitLabel="Ajouter l'identité"
      message={state.message}
      errors={errors}
      ok={state.ok}
    >
      <FormField
        label="Fournisseur d'identité"
        htmlFor="identite-fournisseur"
        error={errors.provider}
        errorId="identite-fournisseur-erreur"
        required
      >
        <select
          id="identite-fournisseur"
          name="provider"
          defaultValue={values.provider}
          aria-invalid={errors.provider ? true : undefined}
          aria-describedby={
            errors.provider ? "identite-fournisseur-erreur" : undefined
          }
          className={`${CONTROL} ${borderOf(errors.provider)}`}
        >
          {IDENTITY_PROVIDERS.map((provider) => (
            <option key={provider} value={provider}>
              {formatIdentityProvider(provider)}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label="Identité vérifiée"
        htmlFor="identite-valeur"
        note={`La valeur que le fournisseur rend dans le claim « ${claim} ». Une même identité ne peut désigner qu'une seule entreprise : si elle est déjà rattachée ailleurs, l'ajout est refusé.`}
        error={errors.value}
        errorId="identite-valeur-erreur"
        required
      >
        <input
          id="identite-valeur"
          name="value"
          type="text"
          placeholder="acme.com"
          defaultValue={values.value}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={errors.value ? true : undefined}
          aria-describedby={
            errors.value ? "identite-valeur-erreur" : undefined
          }
          className={`${CONTROL_TEXT} ${borderOf(errors.value)}`}
        />
      </FormField>
    </Panel>
  );
}
