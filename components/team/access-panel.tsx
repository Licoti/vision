"use client";

/**
 * Le panneau du **compte** d'une personne — T9.6 : lui accorder un accès avec son
 * rôle, ou changer ce rôle.
 *
 * **Aucun écran de plus** : c'est la page Équipe, plus un panneau, et sa coquille
 * vit dans `DrawerHost` depuis TD.2. `?acces=<identifiant>` reste une **adresse**
 * valide, qui rend le même panneau au rendu serveur.
 *
 * **Jumeau de `skill-panel.tsx`**, à ceci près qu'il n'a qu'un champ. Ce n'est pas
 * une pauvreté de formulaire, c'est la nature du geste : `has_access` **ne se
 * saisit pas**, il est posé par l'action, et `persons_role_requires_access`
 * refuse en base *accès sans rôle* comme *rôle sans accès*. Un booléen à cocher
 * aurait fait de ce panneau deux gestes déguisés en un.
 *
 * **Deux rôles, et pas un troisième** : un super administrateur ne vit pas dans
 * `persons` (arbitrage (4) de `tickets-C9.md`). La liste est **dérivée du
 * schéma**, jamais réécrite à la main.
 *
 * **Un formulaire pour deux gestes**, comme partout depuis T3.4 : accorder et
 * changer le rôle écrivent la même chose, et c'est l'action liée qui décide —
 * jamais un champ caché. Ce qui change tient en deux propriétés, le libellé du
 * bouton et la valeur initiale.
 *
 * **Il ne reçoit pas la session** : un composant client n'a rien à faire d'un
 * contexte de droits. Ce qu'il sait de la personne, il le reçoit — son adresse,
 * et si elle est le dernier responsable du domaine —, et les deux ne servent qu'à
 * **dire** ce que l'action refusera. **Les trois garde-fous sont dans l'action** :
 * un panneau absent du rendu n'a jamais protégé le point d'entrée HTTP qui
 * l'accompagne.
 *
 * **Ce panneau n'invite pas, et c'est désormais parce qu'un autre le fait**
 * (T11.2). La phrase qui vivait ici — *« aucune invitation, aucun courriel,
 * aucune relance ; la personne se connectera quand elle se connectera »* —
 * énonçait un interdit de T9.6, levé par décision humaine du 08/09/2026 : la
 * laisser aurait fait d'un commentaire une affirmation fausse, ce qui vaut une
 * ligne de code fausse (leçon de T7.5).
 *
 * **Les deux gestes cohabitent, aucun ne remplace l'autre** (arbitrage (6) de
 * `tickets-C11.md`) : celui-ci ouvre l'accès **maintenant**, et sert quand la
 * personne est là ; `invitePerson` le promet à qui viendra le chercher, et sert
 * quand elle ne l'est pas. Fondre les deux aurait réécrit un geste mesuré hors
 * du périmètre du chantier (règle 3).
 *
 * **Aucune relance pour autant** : une invitation part une fois (`docs/03` §8),
 * et rien ici ne notifie personne.
 */

import { useActionState } from "react";

import { borderOf, CONTROL, FormField } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import {
  EMPTY_PERSON_ACCESS_VALUES,
  PERSON_ROLE_LABEL,
  PERSON_ROLE_NOTE,
  PERSON_ROLE_VALUES,
  type PersonAccessFormState,
  type PersonAccessFormValues,
} from "@/lib/forms/person";

export function AccessPanel({
  action,
  email,
  lastManager,
  submitLabel = "Accorder l'accès",
  initial = EMPTY_PERSON_ACCESS_VALUES,
}: {
  /** L'action serveur, **déjà liée** à la personne côté serveur. */
  action: (
    state: PersonAccessFormState,
    formData: FormData,
  ) => Promise<PersonAccessFormState>;
  /**
   * L'adresse de la personne, ou `null`.
   *
   * **Elle n'est pas saisie ici** : elle se corrige dans le profil, et ce panneau
   * ne fait que dire son absence — l'action refuse alors le geste, la règle
   * d'entrée 6 rapprochant l'identité sur l'e-mail au premier passage.
   */
  email: string | null;
  /**
   * Cette personne est le **dernier responsable** du domaine : son rôle ne peut
   * pas descendre.
   *
   * Dit avant le clic, jamais à sa place : `grantPersonAccess` refait le décompte
   * sur ce qu'elle reçoit.
   */
  lastManager: boolean;
  submitLabel?: string;
  initial?: PersonAccessFormValues;
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
      {/* L'adresse se **lit** et ne se saisit pas : deux formulaires qui
          écriraient la même colonne finiraient par en dire deux choses. Le
          renvoi vers le profil est un mot, pas un lien — un panneau ne se quitte
          pas pour un autre depuis son propre corps. */}
      <div className="flex flex-col gap-1.5">
        <p className="text-2xs font-semibold text-content-neutral-dark uppercase">
          Adresse e-mail
        </p>
        {email ? (
          <p className="text-sm text-content-neutral-darkest">{email}</p>
        ) : (
          <p className="text-sm text-content-neutral-darkest">
            Aucune adresse enregistrée.
          </p>
        )}
        <p className="text-xs text-content-neutral-base">
          {email
            ? "C'est elle que le fournisseur d'identité vérifiera, et elle qui rapproche ce compte de son identité au premier passage."
            : "Renseignez-la dans le profil de cette personne : sans adresse, un accès accordé ne servirait à personne — c'est elle qui rapproche le compte de son identité."}
        </p>
      </div>

      {/* Aucune valeur n'est pré-choisie à l'accord : deviner le rôle de
          quelqu'un serait décider à la place de qui décide. En changement, le
          rôle porté ouvre le contrôle. */}
      <FormField
        label="Rôle"
        htmlFor="acces-role"
        note="Ce que cette personne pourra faire dans ce domaine. Un accès sans rôle est refusé par la base : les deux se posent ensemble."
        error={errors.role}
        errorId="acces-role-erreur"
        required
      >
        <select
          id="acces-role"
          name="role"
          defaultValue={values.role}
          aria-invalid={errors.role ? true : undefined}
          aria-describedby={errors.role ? "acces-role-erreur" : undefined}
          className={`${CONTROL} ${borderOf(errors.role)}`}
        >
          <option value="">Choisir un rôle</option>
          {PERSON_ROLE_VALUES.map((role) => (
            <option key={role} value={role}>
              {PERSON_ROLE_LABEL[role]}
            </option>
          ))}
        </select>
      </FormField>

      {/* Ce que chaque rôle donne, **en toutes lettres et sans clic** : un
          `select` ne peut pas expliquer ses deux valeurs à mesure qu'on les
          survole, et ce choix-là ne se corrige pas d'un coup d'œil. Les mots
          viennent de `lib/forms/person.ts`, à côté des rôles qu'ils
          expliquent. */}
      <ul
        role="list"
        className="flex flex-col gap-2 text-xs text-content-neutral-dark"
      >
        {PERSON_ROLE_VALUES.map((role) => (
          <li key={role}>
            <span className="font-semibold text-content-neutral-darkest">
              {PERSON_ROLE_LABEL[role]}
            </span>{" "}
            — {PERSON_ROLE_NOTE[role]}
          </li>
        ))}
      </ul>

      {lastManager ? (
        <p className="text-xs text-content-neutral-dark">
          C&apos;est le dernier responsable de ce domaine : son rôle ne peut pas
          descendre tant qu&apos;aucun autre n&apos;est désigné. Sans responsable,
          le domaine deviendrait inadministrable, et rien dans Vision ne
          permettrait de le rouvrir.
        </p>
      ) : null}
    </Panel>
  );
}
