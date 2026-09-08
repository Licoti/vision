"use client";

/**
 * Le panneau qui saisit une **entreprise cliente** — T9.4.
 *
 * **Il écrit dans deux tables, et c'est visible dans ses champs.** Le nom et le
 * libellé du centre font la ligne `domains` ; le fournisseur et la valeur
 * vérifiée font sa première `domain_identities`. Les séparer en deux gestes
 * aurait laissé naître des entreprises que **rien ne désigne** : sans identité,
 * ni `hd` ni `tid` ne mène à ce domaine, et aucun compte ne peut l'ouvrir
 * (règles d'entrée 3 et 5 de `tickets-C9.md`).
 *
 * **Aucun champ de statut.** `domains.status` décide qui peut ouvrir une
 * session ; il se pose par un geste nommé, confirmé, et jamais par un champ —
 * *« c'est le serveur qui décide ce qu'un formulaire écrit, jamais un champ
 * caché »*.
 *
 * **Il ne reçoit pas d'autorité** : un composant client n'a rien à faire d'une
 * preuve. L'action redérive `requireSuperAdmin()` sur ce qu'elle reçoit, et la
 * couche relit la ligne avant d'écrire.
 */

import { useActionState } from "react";

import { borderOf, CONTROL, CONTROL_TEXT, FormField } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import { formatIdentityProvider } from "@/lib/format";
import {
  EMPTY_DOMAIN_VALUES,
  IDENTITY_CLAIM,
  IDENTITY_PROVIDERS,
  isIdentityProvider,
  type DomainFormState,
} from "@/lib/forms/domain";

export function DomainPanel({
  action,
}: {
  action: (
    state: DomainFormState,
    formData: FormData,
  ) => Promise<DomainFormState>;
}) {
  const [state, submit, pending] = useActionState(action, {
    values: EMPTY_DOMAIN_VALUES,
    errors: {},
  });

  const values = state.values;
  const errors = state.errors;

  /* Le nom du claim suit le fournisseur choisi, et il est **écrit** : « la
     valeur vérifiée » ne dit pas où la trouver, `hd` et `tid` si. Le rendu part
     de la valeur revenue de l'action, jamais d'un état client — sans
     JavaScript, la note reste juste. */
  const claim = isIdentityProvider(values.provider)
    ? IDENTITY_CLAIM[values.provider]
    : IDENTITY_CLAIM.google;

  return (
    <Panel
      action={submit}
      pending={pending}
      submitLabel="Créer l'entreprise"
      message={state.message}
      errors={errors}
      ok={state.ok}
    >
      <FormField
        label="Nom de l'entreprise"
        htmlFor="domaine-nom"
        note="L'entreprise cliente telle qu'elle se nomme. C'est la frontière étanche des données : rien de ce qui est saisi dans un domaine n'est lisible depuis un autre."
        error={errors.name}
        errorId="domaine-nom-erreur"
        required
      >
        <input
          id="domaine-nom"
          name="name"
          type="text"
          defaultValue={values.name}
          autoComplete="off"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "domaine-nom-erreur" : undefined}
          className={`${CONTROL} ${borderOf(errors.name)}`}
        />
      </FormField>

      <FormField
        label="Libellé du centre de compétence"
        htmlFor="domaine-centre"
        note="Le nom sous lequel le centre de compétence design se présente chez ce client. Il s'affiche dans la coquille de l'application."
        error={errors.competenceCenterName}
        errorId="domaine-centre-erreur"
        required
      >
        <input
          id="domaine-centre"
          name="competenceCenterName"
          type="text"
          defaultValue={values.competenceCenterName}
          autoComplete="off"
          aria-invalid={errors.competenceCenterName ? true : undefined}
          aria-describedby={
            errors.competenceCenterName ? "domaine-centre-erreur" : undefined
          }
          className={`${CONTROL} ${borderOf(errors.competenceCenterName)}`}
        />
      </FormField>

      <FormField
        label="Fournisseur d'identité"
        htmlFor="domaine-fournisseur"
        note="Celui qui vérifiera l'appartenance d'un compte à cette entreprise. Une entreprise peut en porter plusieurs : les suivants s'ajoutent après la création."
        error={errors.provider}
        errorId="domaine-fournisseur-erreur"
        required
      >
        <select
          id="domaine-fournisseur"
          name="provider"
          defaultValue={values.provider}
          aria-invalid={errors.provider ? true : undefined}
          aria-describedby={
            errors.provider ? "domaine-fournisseur-erreur" : undefined
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
        htmlFor="domaine-identite"
        note={`La valeur que le fournisseur rend dans le claim « ${claim} » — jamais le domaine d'une adresse e-mail, qui peut être un alias. C'est elle, et elle seule, qui rattache un compte à cette entreprise.`}
        error={errors.identityValue}
        errorId="domaine-identite-erreur"
        required
      >
        <input
          id="domaine-identite"
          name="identityValue"
          type="text"
          placeholder="acme.com"
          defaultValue={values.identityValue}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={errors.identityValue ? true : undefined}
          aria-describedby={
            errors.identityValue ? "domaine-identite-erreur" : undefined
          }
          className={`${CONTROL_TEXT} ${borderOf(errors.identityValue)}`}
        />
      </FormField>
    </Panel>
  );
}
