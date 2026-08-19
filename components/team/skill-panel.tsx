"use client";

/**
 * Le panneau qui pose une **compétence** sur une personne, ou en corrige le
 * niveau — T5bis.6.
 *
 * **Aucun écran de plus** : c'est la page Équipe, plus un panneau, et sa
 * coquille vit dans `DrawerHost` depuis TD.2. `?maitrise=<identifiant>` reste
 * une **adresse** valide, dont la valeur est polymorphe : celle d'une personne
 * pose, celle d'une ligne de `person_skills` corrige.
 *
 * **Jumeau de `person-panel.tsx`**, à un champ près — et c'est ce champ qui fait
 * la différence entre les deux gestes : en **pose**, la compétence se choisit ;
 * en **correction**, elle est dite en toutes lettres et aucun contrôle ne la
 * porte. La fiche du ticket énumère « ajouter une compétence avec son niveau ;
 * **corriger ce niveau** » : une liaison ne se déplace pas d'une compétence à
 * l'autre. Se tromper de compétence se répare en la retirant puis en la
 * reposant, ce que les deux autres gestes rendent possible.
 *
 * `skillLabel` non nul porte donc le mode, et c'est le serveur qui le décide —
 * jamais un champ caché. Une soumission forgée qui posterait un `skillId` en
 * correction n'obtient rien : `parsePersonSkillForm` reçoit la compétence de la
 * ligne relue et ignore celle du formulaire.
 *
 * **Le niveau est déclaré, jamais mesuré** (garde-fou 1) : ce panneau recueille
 * ce que la personne dit d'elle-même. Aucun champ de commentaire, aucune date de
 * validation, aucun historique — une colonne écrite sans lecteur est une colonne
 * qu'on relit un jour sans savoir pourquoi (leçon de T5.2).
 *
 * **Aucune création de compétence depuis cet écran** : `skills` est un
 * référentiel du domaine, amorcé par script, et son écran de gestion reste dû à
 * C7 (D25). Le `select` propose ce qui existe, et rien d'autre.
 */

import { useActionState } from "react";

import {
  borderOf,
  CONTROL,
  FormField,
} from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import {
  EMPTY_PERSON_SKILL_VALUES,
  type PersonSkillFormState,
  type PersonSkillFormValues,
} from "@/lib/forms/person-skill";

/** Une compétence proposée au choix. */
export type SkillOption = { id: string; label: string };

/**
 * Un échelon proposé au choix. Le `rank` n'est pas affiché — c'est le libellé
 * qui parle, et l'ordre du `select` porte déjà l'échelle.
 */
export type SkillLevelOption = { id: string; label: string };

export function SkillPanel({
  action,
  skills,
  levels,
  skillLabel = null,
  submitLabel = "Ajouter la compétence",
  initial = EMPTY_PERSON_SKILL_VALUES,
}: {
  /** L'action serveur, **déjà liée** à la personne ou à la liaison, côté serveur. */
  action: (
    state: PersonSkillFormState,
    formData: FormData,
  ) => Promise<PersonSkillFormState>;
  /**
   * Les compétences du domaine, déjà ordonnées — vides en correction, où rien ne
   * se choisit.
   */
  skills: readonly SkillOption[];
  /** L'échelle de maîtrise, par rang croissant. */
  levels: readonly SkillLevelOption[];
  /**
   * La compétence de la liaison corrigée, en toutes lettres. `null` en pose :
   * c'est ce qui porte le mode, et il vient du serveur.
   */
  skillLabel?: string | null;
  submitLabel?: string;
  initial?: PersonSkillFormValues;
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
      {skillLabel === null ? (
        <FormField
          label="Compétence"
          htmlFor="maitrise-competence"
          note="Le référentiel du domaine. Une compétence déjà portée par cette personne est refusée."
          error={errors.skillId}
          errorId="maitrise-competence-erreur"
          required
        >
          <select
            id="maitrise-competence"
            name="skillId"
            defaultValue={values.skillId}
            aria-invalid={errors.skillId ? true : undefined}
            aria-describedby={
              errors.skillId ? "maitrise-competence-erreur" : undefined
            }
            className={`${CONTROL} ${borderOf(errors.skillId)}`}
          >
            <option value="">Choisir une compétence</option>
            {skills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.label}
              </option>
            ))}
          </select>
        </FormField>
      ) : (
        /* En correction, la compétence se **lit** et ne se saisit pas. Aucun
           champ caché ne la double : la ligne relue côté serveur la porte, et
           c'est elle qui fait foi. */
        <div className="flex flex-col gap-1.5">
          <p className="text-2xs font-semibold text-content-neutral-dark uppercase">
            Compétence
          </p>
          <p className="text-sm text-content-neutral-darkest">{skillLabel}</p>
          <p className="text-xs text-content-neutral-base">
            Une compétence ne se déplace pas : pour en changer, retirez celle-ci
            et posez l&apos;autre.
          </p>
        </div>
      )}

      {/* L'échelle sort par rang croissant : c'est l'ordre du référentiel, et il
          se lit du plus bas au plus haut. Aucune valeur n'est pré-choisie —
          proposer un niveau par défaut serait déclarer à la place de qui
          déclare (garde-fou 1). */}
      <FormField
        label="Niveau"
        htmlFor="maitrise-niveau"
        note="Le niveau que la personne déclare. Vision ne le mesure pas, ne l'audite pas et ne le fait pas expirer."
        error={errors.levelId}
        errorId="maitrise-niveau-erreur"
        required
      >
        <select
          id="maitrise-niveau"
          name="levelId"
          defaultValue={values.levelId}
          aria-invalid={errors.levelId ? true : undefined}
          aria-describedby={
            errors.levelId ? "maitrise-niveau-erreur" : undefined
          }
          className={`${CONTROL} ${borderOf(errors.levelId)}`}
        >
          <option value="">Choisir un niveau</option>
          {levels.map((level) => (
            <option key={level.id} value={level.id}>
              {level.label}
            </option>
          ))}
        </select>
      </FormField>
    </Panel>
  );
}
