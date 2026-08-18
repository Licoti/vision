"use client";

/**
 * Le panneau qui saisit un relevé — la série datée sans laquelle la frise de
 * T5.6 n'a rien à tracer.
 *
 * **Aucun écran de plus** (`docs/06` §2) : c'est la page du produit, plus un
 * paramètre. La mécanique est celle de T3.2, reprise **sans en changer une
 * ligne** — le panneau n'est pas un état, c'est une URL.
 * `?releve=<identifiant d'indicateur>` saisit, `?releve=<identifiant de relevé>`
 * corrige ; la page reste rendue derrière et porte `inert`, et trois sorties
 * mènent au même endroit : la croix, « Annuler » et le voile, tous trois de
 * simples liens vers la page nue.
 *
 * **Quatrième jumeau d'`activity-panel.tsx`**, après la ressource, le résultat
 * et l'indicateur, et volontairement. Même frontière client — `useActionState`
 * est le seul moyen de faire revenir une saisie refusée avec ses valeurs —, même
 * `FocusTrap` **réutilisé sans modification**, même `autofocus` sur la sortie,
 * mêmes jetons. React 19 améliore progressivement : le formulaire est soumis par
 * le navigateur, l'action s'exécute, et **tout fonctionne sans une ligne de
 * JavaScript**.
 *
 * Il ne reçoit pas la session : un composant client n'a rien à faire d'un
 * contexte de droits. Il reçoit ce qu'il affiche — le nom du produit, le libellé
 * de l'indicateur — et une action qui ne connaît ni l'un ni l'autre. **C'est le
 * serveur qui décide ce que ce formulaire écrit, jamais un champ caché.**
 *
 * **Un seul formulaire pour les deux gestes**, comme les trois panneaux qui le
 * précèdent : mêmes champs, mêmes règles, mêmes refus. Ce qui change tient en
 * trois propriétés — le titre, le libellé du bouton, les valeurs initiales — et
 * le panneau ne sait pas lequel des deux gestes il sert : c'est l'action liée qui
 * le décide, côté serveur.
 *
 * **Aucune date par défaut**, et c'est la règle centrale de ce panneau : ni
 * aujourd'hui, ni le mois courant. Un relevé se **rapporte**, il ne se date pas
 * au moment de la saisie — `docs/03` §7 refuse qu'une mesure soit « positionnée
 * arbitrairement à aujourd'hui », et un champ pré-rempli est exactement la façon
 * dont cela arriverait sans que personne ne l'ait décidé.
 */

import { useActionState } from "react";

import { borderOf, CONTROL, FormField } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import {
  EMPTY_READING_VALUES,
  type ReadingFormState,
  type ReadingFormValues,
} from "@/lib/forms/reading";

export function ReadingPanel({
  action,
  submitLabel = "Ajouter le relevé",
  initial = EMPTY_READING_VALUES,
}: {
  /**
   * L'action serveur, **déjà liée** au produit et à l'indicateur côté serveur —
   * au produit et au relevé en correction. Le panneau ne connaît pas ce qu'il
   * écrit.
   */
  action: (
    state: ReadingFormState,
    formData: FormData,
  ) => Promise<ReadingFormState>;
  submitLabel?: string;
  /**
   * Les valeurs du relevé corrigé. C'est l'**état initial** de `useActionState` :
   * un refus le remplace par ce qui a été tapé, si bien que les deux chemins ont
   * rigoureusement la même forme.
   */
  initial?: ReadingFormValues;
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
      {/* `type="text"` et non `type="number"` : le champ numérique refuse
          la virgule française selon la locale du navigateur, et ne rend
          rien de lisible à l'assistance quand il est vide — la raison
          écrite dans `result-panel.tsx`. La validation qui compte est côté
          serveur, le formulaire portant `noValidate`. `inputMode="decimal"`
          sert le clavier des mobiles.

          **L'unité n'est pas ici** : elle appartient à l'indicateur, saisie
          une fois pour toutes en T5.2, et la redemander à chaque relevé
          autoriserait une série dont les lignes ne se comparent plus. */}
      <FormField
        label="Valeur"
        htmlFor="releve-valeur"
        note="Le chiffre relevé, virgule acceptée. L'unité est celle de l'indicateur."
        error={errors.value}
        errorId="releve-valeur-erreur"
        required
      >
        <input
          id="releve-valeur"
          name="value"
          type="text"
          inputMode="decimal"
          defaultValue={values.value}
          autoComplete="off"
          aria-invalid={errors.value ? true : undefined}
          aria-describedby={errors.value ? "releve-valeur-erreur" : undefined}
          className={`${CONTROL} ${borderOf(errors.value)}`}
        />
      </FormField>

      {/* **Aucune valeur par défaut**, et c'est délibéré : `defaultValue`
          ne porte que ce qui a été saisi ou ce qui est corrigé. Ni
          aujourd'hui, ni le mois courant — un relevé se rapporte, il ne se
          date pas au moment de la saisie (`docs/03` §7). */}
      <FormField
        label="Date du relevé"
        htmlFor="releve-date"
        note="Quand la mesure a été faite, et non quand elle est saisie."
        error={errors.readOn}
        errorId="releve-date-erreur"
        required
      >
        <input
          id="releve-date"
          name="readOn"
          type="date"
          defaultValue={values.readOn}
          aria-invalid={errors.readOn ? true : undefined}
          aria-describedby={errors.readOn ? "releve-date-erreur" : undefined}
          className={`${CONTROL} ${borderOf(errors.readOn)}`}
        />
      </FormField>

      {/* D'où vient cette mesure-là, quand elle ne vient pas de la source
          habituelle de l'indicateur. Une note, jamais une liaison : le
          référentiel `tools` sert les résultats (T4.4), et un relevé n'en
          dépend pas. */}
      <FormField
        label="Note de source"
        htmlFor="releve-source"
        note="Facultative. D'où vient cette mesure : « Export du 12 juin », « Panel interne »…"
        error={errors.sourceNote}
        errorId="releve-source-erreur"
      >
        <input
          id="releve-source"
          name="sourceNote"
          type="text"
          defaultValue={values.sourceNote}
          autoComplete="off"
          aria-invalid={errors.sourceNote ? true : undefined}
          aria-describedby={
            errors.sourceNote ? "releve-source-erreur" : undefined
          }
          className={`${CONTROL} ${borderOf(errors.sourceNote)}`}
        />
      </FormField>
    </Panel>
  );
}
