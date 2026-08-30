"use client";

/**
 * Le panneau qui saisit une **ligne de référentiel** — métier, approche,
 * compétence, niveau de maîtrise (T7.3).
 *
 * **Aucun écran de plus** (`docs/06` §2) : c'est la page Administration, plus un
 * panneau. La coquille — voile, tiroir, en-tête, croix, piège de focus — vit
 * dans `DrawerHost` et se monte **avant** tout aller-retour (TD.2) ; ce fichier
 * ne porte que le corps du formulaire. `?referentiel=metiers&ligne=nouvelle` et
 * `?referentiel=metiers&ligne=<identifiant>` restent des **adresses** valides,
 * qui rendent le même panneau au rendu serveur.
 *
 * **Jumeau d'`entity-panel.tsx`**, et volontairement : même frontière client —
 * `useActionState` est le seul moyen de faire revenir une saisie refusée avec
 * ses valeurs —, même `Panel`, mêmes jetons. React 19 améliore progressivement :
 * le formulaire est soumis par le navigateur, l'action s'exécute, et **tout
 * fonctionne sans une ligne de JavaScript**.
 *
 * **Un seul formulaire pour huit gestes** : quatre référentiels, créer et
 * corriger. Ce qui change tient en cinq propriétés — le vocabulaire, le libellé
 * du bouton, les valeurs initiales, la présence de l'ordre et celle du rang — et
 * le panneau ne sait pas lequel des gestes il sert : c'est l'action liée qui le
 * décide, côté serveur.
 *
 * **Aucun référentiel ne porte les deux champs d'ordre.** `position` ordonne les
 * métiers, les approches et les compétences dans toutes les lectures qui les
 * servent ; `rank` ordonne l'échelle de maîtrise dans les siennes, et
 * `skill_levels.position` n'a aucun lecteur — la saisir ici en ferait un champ
 * qu'on relit un jour sans savoir pourquoi (arbitrage (i) de `tickets-C7.md`).
 *
 * **Il ne reçoit pas la session** : un composant client n'a rien à faire d'un
 * contexte de droits. **C'est le serveur qui décide ce que ce formulaire écrit,
 * jamais un champ caché.**
 */

import { useActionState } from "react";

import { borderOf, CONTROL, FormField } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import {
  EMPTY_REFERENTIAL_VALUES,
  type ReferentialFormState,
  type ReferentialFormValues,
  type ReferentialShape,
} from "@/lib/forms/referential";

export function ReferentialPanel({
  action,
  shape,
  labelNote,
  submitLabel,
  initial = EMPTY_REFERENTIAL_VALUES,
}: {
  /**
   * L'action serveur, **déjà liée** à la ligne côté serveur en correction. Le
   * panneau ne connaît ni la table qu'il écrit, ni le référentiel qu'il sert.
   */
  action: (
    state: ReferentialFormState,
    formData: FormData,
  ) => Promise<ReferentialFormState>;
  /** Lequel des deux champs d'ordre ce référentiel porte. */
  shape: ReferentialShape;
  /** Ce que ce libellé qualifie — la phrase change avec le référentiel. */
  labelNote: string;
  submitLabel: string;
  /**
   * Les valeurs de la ligne corrigée. C'est l'**état initial** de
   * `useActionState` : un refus le remplace par ce qui a été tapé, si bien que
   * les deux chemins ont rigoureusement la même forme.
   */
  initial?: ReferentialFormValues;
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
        htmlFor="ligne-libelle"
        note={labelNote}
        error={errors.label}
        errorId="ligne-libelle-erreur"
        required
      >
        <input
          id="ligne-libelle"
          name="label"
          type="text"
          defaultValue={values.label}
          autoComplete="off"
          aria-invalid={errors.label ? true : undefined}
          aria-describedby={errors.label ? "ligne-libelle-erreur" : undefined}
          className={`${CONTROL} ${borderOf(errors.label)}`}
        />
      </FormField>

      {shape.position ? (
        <FormField
          label="Ordre"
          htmlFor="ligne-position"
          note="La place de cette ligne dans les listes et les formulaires. Les plus petits nombres viennent en premier ; à égalité, l'ordre est alphabétique."
          error={errors.position}
          errorId="ligne-position-erreur"
          required
        >
          <input
            id="ligne-position"
            name="position"
            /* `inputMode` plutôt que `type="number"` : la virgule française y
               est acceptée, et l'action la rend à PostgreSQL en point. Un
               `type="number"` refuserait « 12,5 » selon la locale du
               navigateur, ce qui ferait varier le formulaire d'un poste à
               l'autre. */
            type="text"
            inputMode="decimal"
            defaultValue={values.position}
            autoComplete="off"
            aria-invalid={errors.position ? true : undefined}
            aria-describedby={
              errors.position ? "ligne-position-erreur" : undefined
            }
            className={`${CONTROL} ${borderOf(errors.position)}`}
          />
        </FormField>
      ) : null}

      {shape.rank ? (
        <FormField
          label="Rang"
          htmlFor="ligne-rang"
          note="La graduation de l'échelle : 1 pour le premier niveau, et ainsi de suite. C'est le rang qui ordonne l'échelle et que le radar de l'équipe lit — le libellé, lui, se renomme librement."
          error={errors.rank}
          errorId="ligne-rang-erreur"
          required
        >
          <input
            id="ligne-rang"
            name="rank"
            type="text"
            inputMode="numeric"
            defaultValue={values.rank}
            autoComplete="off"
            aria-invalid={errors.rank ? true : undefined}
            aria-describedby={errors.rank ? "ligne-rang-erreur" : undefined}
            className={`${CONTROL} ${borderOf(errors.rank)}`}
          />
        </FormField>
      ) : null}
    </Panel>
  );
}
