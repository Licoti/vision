"use client";

/**
 * Le panneau qui saisit une **personne** — le premier écran d'écriture de la
 * page Équipe, et celui qui referme le point ouvert de T2.6 : une personne se
 * crée ici, et T5bis.7 a retiré le bloc « Ajouter une personne » du formulaire
 * de projet (arbitrage (g)).
 *
 * **Aucun écran de plus** (`docs/06` §2) : c'est la page Équipe, plus un
 * panneau. Depuis TD.2, la coquille — voile, tiroir, en-tête, croix, piège de
 * focus — vit dans `DrawerHost` et se monte **avant** tout aller-retour ; ce
 * fichier ne porte que le corps du formulaire. `?profil=nouveau` et
 * `?profil=<identifiant>` restent des **adresses** valides, qui rendent le même
 * panneau au rendu serveur.
 *
 * **Jumeau d'`indicator-panel.tsx`**, et volontairement : même frontière client
 * — `useActionState` est le seul moyen de faire revenir une saisie refusée avec
 * ses valeurs —, même `Panel`, mêmes jetons. React 19 améliore progressivement :
 * le formulaire est soumis par le navigateur, l'action s'exécute, et **tout
 * fonctionne sans une ligne de JavaScript**.
 *
 * **Un seul formulaire pour les deux gestes**, comme partout depuis T3.4 : mêmes
 * champs, mêmes règles, mêmes refus. Ce qui change tient en trois propriétés —
 * le titre, le libellé du bouton, les valeurs initiales — et le panneau ne sait
 * pas lequel des deux gestes il sert : c'est l'action liée qui le décide, côté
 * serveur.
 *
 * **Il ne reçoit pas la session** : un composant client n'a rien à faire d'un
 * contexte de droits. Il reçoit ce qu'il affiche — la liste des métiers — et une
 * action qui ne connaît pas l'identifiant de la personne. **C'est le serveur qui
 * décide ce que ce formulaire écrit, jamais un champ caché.**
 *
 * **Quatre champs, et pas un de plus** : ni compte, ni rôle de domaine, ni accès.
 * Être référencé et pouvoir se connecter restent deux choses distinctes (D19), et
 * l'authentification est reprise par C7. Ni score, ni date de validation, ni
 * historique de progression : Vision ne mesure pas une personne (garde-fous 1
 * et 2).
 *
 * **Le `select` de disponibilité est parti le 28/08/2026**, avec la colonne qui
 * le recevait : la valeur se déduit désormais du nombre d'accompagnements
 * vivants (`lib/availability.ts`). Ce panneau n'a donc plus la difficulté qu'il
 * décrivait — un `select` proposé à tous et refusé aux uns, faute de pouvoir
 * disparaître sans JavaScript quand le genre change.
 */

import { useActionState } from "react";

import {
  borderOf,
  CONTROL,
  CONTROL_TEXT,
  FormField,
} from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import {
  EMPTY_PERSON_VALUES,
  PERSON_KIND_LABEL,
  PERSON_KIND_VALUES,
  type PersonFormState,
  type PersonFormValues,
} from "@/lib/forms/person";

/** Un métier proposé au choix. Jumelle de `TeamFilterOption`, sans son module. */
export type PersonJobOption = { id: string; label: string };

export function PersonPanel({
  action,
  jobs,
  submitLabel = "Ajouter la personne",
  initial = EMPTY_PERSON_VALUES,
}: {
  /**
   * L'action serveur, **déjà liée** à la personne côté serveur en correction.
   * Le panneau ne connaît pas ce qu'il écrit.
   */
  action: (
    state: PersonFormState,
    formData: FormData,
  ) => Promise<PersonFormState>;
  /**
   * Les métiers du domaine, déjà ordonnés. Le métier archivé que la personne
   * porte déjà y figure — l'exception d'archivage nominative de T4bis.1 —, et
   * n'est proposé à personne d'autre.
   */
  jobs: readonly PersonJobOption[];
  submitLabel?: string;
  /**
   * Les valeurs du profil corrigé. C'est l'**état initial** de
   * `useActionState` : un refus le remplace par ce qui a été tapé, si bien que
   * les deux chemins ont rigoureusement la même forme.
   */
  initial?: PersonFormValues;
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
        htmlFor="personne-nom"
        note="Le nom sous lequel cette personne apparaît dans les équipes."
        error={errors.fullName}
        errorId="personne-nom-erreur"
        required
      >
        <input
          id="personne-nom"
          name="fullName"
          type="text"
          defaultValue={values.fullName}
          autoComplete="off"
          aria-invalid={errors.fullName ? true : undefined}
          aria-describedby={errors.fullName ? "personne-nom-erreur" : undefined}
          className={`${CONTROL} ${borderOf(errors.fullName)}`}
        />
      </FormField>

      {/* **Le genre avant le métier**, et l'ordre porte une règle : c'est lui qui
          décide si la disponibilité a un sens, et une personne hors centre n'a
          pas de métier design (`docs/04` §2). La liste est **dérivée du
          schéma**, jamais réécrite à la main. Aucune valeur n'est pré-choisie :
          la colonne n'a pas de défaut, et deviner d'où vient quelqu'un serait
          décider à sa place. */}
      <FormField
        label="Genre"
        htmlFor="personne-genre"
        note="D'où vient cette personne. Un intervenant côté entité n'a ni métier design, ni disponibilité."
        error={errors.kind}
        errorId="personne-genre-erreur"
        required
      >
        <select
          id="personne-genre"
          name="kind"
          defaultValue={values.kind}
          aria-invalid={errors.kind ? true : undefined}
          aria-describedby={errors.kind ? "personne-genre-erreur" : undefined}
          className={`${CONTROL} ${borderOf(errors.kind)}`}
        >
          <option value="">Choisir</option>
          {PERSON_KIND_VALUES.map((kind) => (
            <option key={kind} value={kind}>
              {PERSON_KIND_LABEL[kind]}
            </option>
          ))}
        </select>
      </FormField>

      {/* Le référentiel du domaine, amorcé par script : aucun métier ne se crée
          ni ne se modifie depuis cet écran (D25, C7). L'option vide n'est pas un
          défaut de saisie — `persons.job_id` est nullable, et une personne hors
          centre n'en porte pas. */}
      <FormField
        label="Métier"
        htmlFor="personne-metier"
        note="Facultatif. Le métier design de cette personne, tel que le référentiel du domaine le nomme."
        error={errors.jobId}
        errorId="personne-metier-erreur"
      >
        <select
          id="personne-metier"
          name="jobId"
          defaultValue={values.jobId}
          aria-invalid={errors.jobId ? true : undefined}
          aria-describedby={errors.jobId ? "personne-metier-erreur" : undefined}
          className={`${CONTROL} ${borderOf(errors.jobId)}`}
        >
          <option value="">Aucun</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label="Présentation"
        htmlFor="personne-presentation"
        note="Facultative. Une ou deux phrases : ce que cette personne fait, et comment elle intervient."
        error={errors.bio}
        errorId="personne-presentation-erreur"
      >
        <textarea
          id="personne-presentation"
          name="bio"
          rows={3}
          defaultValue={values.bio}
          aria-invalid={errors.bio ? true : undefined}
          aria-describedby={
            errors.bio ? "personne-presentation-erreur" : undefined
          }
          className={`${CONTROL_TEXT} ${borderOf(errors.bio)}`}
        />
      </FormField>
    </Panel>
  );
}
