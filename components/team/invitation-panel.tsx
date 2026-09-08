"use client";

/**
 * Le panneau d'**invitation** d'une personne — T11.2.
 *
 * **Jumeau d'`access-panel.tsx`**, et le rapprochement est volontaire : même
 * `<Panel>`, même `useActionState`, même champ unique, mêmes mots pour les deux
 * rôles. Ce qui les sépare tient en une phrase — l'un ouvre l'accès maintenant,
 * l'autre le promet à qui viendra le chercher (arbitrage (6) de
 * `tickets-C11.md`). Les deux gestes cohabitent, aucun ne remplace l'autre.
 *
 * **Deux états, un seul composant.** Tant que `state.link` est absent, c'est un
 * formulaire ; dès qu'il paraît, c'est le lien. **Le panneau ne se referme pas
 * sur le succès**, à rebours des quinze autres : `ok` referme (TD.2) et
 * emporterait avec lui la seule occurrence en clair du jeton — Vision n'en garde
 * que l'empreinte (T11.1), et rien ne saurait le reconstituer. Écart nommé au
 * patron de TD.2, consigné au journal technique.
 *
 * **Il ne reçoit pas la session** : un composant client n'a rien à faire d'un
 * contexte de droits. Ce qu'il sait de la personne, il le reçoit — son adresse —,
 * et cela ne sert qu'à **dire** ce que l'action refusera. **Les six garde-fous
 * sont dans l'action** : un panneau absent du rendu n'a jamais protégé le point
 * d'entrée HTTP qui l'accompagne.
 *
 * **Le courriel part quand il peut partir** (T11.3, qui a levé l'interdit de
 * T11.2). Le panneau ne connaît pas le réglage de l'environnement et n'a pas à
 * le connaître : l'action lui dit `sent`, un fait, et il en rend compte. Sans
 * clé d'envoi, l'état est exactement celui de T11.2 — le lien s'affiche et se
 * transmet à la main, sans second chemin de code.
 *
 * **Aucune relance, et le mot n'y est pas** : une invitation part une fois
 * (`docs/03` §8). Réinviter est un geste humain qui révoque d'abord, et il vit
 * sur la fiche, pas ici.
 *
 * **Aucun couple de couleurs neuf par la position** : le lien se rend dans
 * `CONTROL`, le contrôle de saisie du design system, sur le fond de panneau où
 * les seize autres le portent déjà. Rien à remesurer (règle 2).
 */

import { useActionState } from "react";

import { borderOf, CONTROL, FormField } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import {
  EMPTY_INVITATION_VALUES,
  type InvitationFormState,
} from "@/lib/forms/invitation";
import {
  PERSON_ROLE_LABEL,
  PERSON_ROLE_NOTE,
  PERSON_ROLE_VALUES,
} from "@/lib/forms/person";

export function InvitationPanel({
  action,
  email,
  expiryDays,
}: {
  /** L'action serveur, **déjà liée** à la personne côté serveur. */
  action: (
    state: InvitationFormState,
    formData: FormData,
  ) => Promise<InvitationFormState>;
  /**
   * L'adresse de la personne, ou `null`.
   *
   * **Elle n'est pas saisie ici** : elle se corrige dans le profil, et ce
   * panneau ne fait que dire son absence — l'action refuse alors le geste, le
   * lien n'ayant ni destinataire ni valeur à confronter à l'e-mail vérifié.
   */
  email: string | null;
  /** Ce que vaut un lien, dit à qui le crée. La valeur vient du serveur. */
  expiryDays: number;
}) {
  const [state, submit, pending] = useActionState(action, {
    values: EMPTY_INVITATION_VALUES,
    errors: {},
  });

  const values = state.values;
  const errors = state.errors;

  return (
    <Panel
      action={submit}
      pending={pending}
      submitLabel="Créer l'invitation"
      message={state.message}
      errors={errors}
    >
      {state.link ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-content-neutral-darkest">
            {state.sent ? (
              <>
                L&apos;invitation est créée, et un courriel vient de partir vers{" "}
                {email ?? "cette personne"}. Le lien ci-dessous est celui de ce
                message : gardez-le si vous préférez le transmettre vous-même.
              </>
            ) : (
              <>
                L&apos;invitation est créée. Transmettez ce lien à{" "}
                {email ?? "cette personne"}.
              </>
            )}
          </p>

          {/* Un champ plutôt qu'un paragraphe : un lien se sélectionne d'un
              geste, et se copie sans risque d'emporter une espace de mise en
              page. `readOnly` et non `disabled` — un contrôle désactivé ne se
              sélectionne pas, et `disabled:opacity-40` le rendrait illisible.
              Aucun bouton de copie : ce serait du JavaScript pour un geste que
              le navigateur fait déjà, et D30 veut que la page tienne sans. */}
          <FormField
            label="Lien à transmettre"
            htmlFor="invitation-lien"
            note="Il ne sera plus affiché : Vision n'en garde que l'empreinte, jamais le lien lui-même. Le perdre demande de révoquer l'invitation et d'en créer une autre."
            errorId="invitation-lien-erreur"
          >
            <input
              id="invitation-lien"
              readOnly
              value={state.link}
              onFocus={(event) => event.currentTarget.select()}
              className={`${CONTROL} ${borderOf(undefined)}`}
            />
          </FormField>

          <p className="text-xs text-content-neutral-base">
            Le lien vaut {expiryDays} jours. Il ne connecte personne à lui seul :
            la personne devra passer par son fournisseur d&apos;identité, et
            c&apos;est cette vérification-là qui ouvre l&apos;accès.
          </p>
        </div>
      ) : (
        <>
          {/* L'adresse se **lit** et ne se saisit pas : deux formulaires qui
              écriraient la même colonne finiraient par en dire deux choses.
              C'est le bloc d'`access-panel.tsx`, au mot près de sa note. */}
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
                ? "C'est elle que le fournisseur d'identité vérifiera, et c'est à elle que l'acceptation confrontera le lien. La corriger ensuite ne déplacera pas la cible d'un lien déjà transmis."
                : "Renseignez-la dans le profil de cette personne : sans adresse, une invitation n'a ni destinataire, ni rien à confronter à l'identité vérifiée."}
            </p>
          </div>

          {/* Aucune valeur n'est pré-choisie : deviner le rôle de quelqu'un
              serait décider à la place de qui décide. */}
          <FormField
            label="Rôle"
            htmlFor="invitation-role"
            note="Ce que cette personne pourra faire dans ce domaine, une fois l'invitation acceptée. Le rôle est posé à l'acceptation, jamais avant."
            error={errors.role}
            errorId="invitation-role-erreur"
            required
          >
            <select
              id="invitation-role"
              name="role"
              defaultValue={values.role}
              aria-invalid={errors.role ? true : undefined}
              aria-describedby={
                errors.role ? "invitation-role-erreur" : undefined
              }
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

          {/* Ce que chaque rôle donne, **en toutes lettres et sans clic** : les
              mots viennent de `lib/forms/person.ts`, à côté des rôles qu'ils
              expliquent, et ne se recopient pas ici. */}
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

          {/* **Ce que la phrase promet, l'action le tient dans les deux cas.**
              Elle ne dit pas *un courriel partira* — l'envoi n'est pas raccordé
              partout, et une promesse fausse vaudrait le silence qu'elle
              remplace. Elle dit ce qui est vrai des deux côtés, et le panneau
              dira ensuite lequel des deux s'est produit. */}
          <p className="text-xs text-content-neutral-dark">
            Le lien s&apos;affichera ici une seule fois, et vous pourrez le
            transmettre vous-même ; s&apos;il part aussi par courriel, le
            panneau le dira. Aucun accès n&apos;est ouvert tant que la personne
            ne s&apos;est pas connectée.
          </p>
        </>
      )}
    </Panel>
  );
}
