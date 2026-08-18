"use client";

/**
 * Le panneau qui écrit la **vision produit** — la raison d'être du produit et
 * la direction qu'il se donne (18/08/2026).
 *
 * **Aucun écran de plus** (`docs/06` §2) : c'est la page du produit, plus un
 * paramètre. La mécanique est celle de T3.2, reprise sans en changer une ligne
 * — le panneau n'est pas un état, c'est une URL. `?vision=modifier` l'ouvre ;
 * la page reste rendue derrière et porte `inert`, et trois sorties mènent au
 * même endroit : la croix, « Annuler » et le voile, tous trois de simples liens
 * vers la page nue.
 *
 * **Le plus court des panneaux de Vision : un champ.** C'est le calque
 * d'`indicator-panel.tsx`, dépouillé de tout le reste — même frontière client
 * (`useActionState` est le seul moyen de faire revenir une saisie refusée avec
 * sa valeur), même `Panel`, mêmes jetons. React 19 améliore progressivement :
 * le formulaire est soumis par le navigateur, l'action s'exécute, et **tout
 * fonctionne sans une ligne de JavaScript**.
 *
 * **Un seul formulaire pour les deux gestes**, écrire et récrire, et le panneau
 * ne sait pas lequel il sert : ce qui change tient en trois propriétés — le
 * titre, le libellé du bouton, la valeur initiale —, et c'est l'appelant qui
 * les choisit sur l'état de la colonne. Il n'y a pas deux lignes à distinguer,
 * seulement une colonne nullable.
 *
 * **Le champ vidé retire la vision**, et la note le dit en toutes lettres :
 * sans elle, on effacerait sans le savoir. Ce n'est pas la suppression que la
 * règle 4 proscrit — c'est la correction d'un champ de texte, et le geste se
 * rejoue.
 *
 * Il ne reçoit pas la session : un composant client n'a rien à faire d'un
 * contexte de droits. Il reçoit ce qu'il affiche — le nom du produit — et une
 * action qui ne connaît pas l'identifiant du produit. **C'est le serveur qui
 * décide ce que ce formulaire écrit, jamais un champ caché.**
 */

import { useActionState } from "react";

import { borderOf, CONTROL_TEXT, FormField } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import {
  EMPTY_VISION_VALUES,
  type VisionFormState,
  type VisionFormValues,
} from "@/lib/forms/vision";

export function VisionPanel({
  action,
  submitLabel = "Ajouter la vision",
  initial = EMPTY_VISION_VALUES,
}: {
  /**
   * L'action serveur, **déjà liée** au produit côté serveur. Le panneau ne
   * connaît pas ce qu'il écrit.
   */
  action: (
    state: VisionFormState,
    formData: FormData,
  ) => Promise<VisionFormState>;
  submitLabel?: string;
  /**
   * La vision en place. C'est l'**état initial** de `useActionState` : un refus
   * le remplace par ce qui a été tapé, si bien que les deux chemins ont
   * rigoureusement la même forme.
   */
  initial?: VisionFormValues;
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
      {/* `rows={4}` et non les 3 du champ description : la vision porte le
          pourquoi **et** la direction, ce que trois lignes serrent. Aucun
          maximum n'est imposé — la note l'annonce, et `lib/forms/vision.ts`
          dit pourquoi il n'y en a pas. */}
      <FormField
        label="Vision produit"
        htmlFor="vision-texte"
        note="Pourquoi ce produit existe, et où il veut aller. Vider le champ retire la vision."
        error={errors.vision}
        errorId="vision-texte-erreur"
      >
        <textarea
          id="vision-texte"
          name="vision"
          rows={4}
          defaultValue={values.vision}
          aria-invalid={errors.vision ? true : undefined}
          aria-describedby={errors.vision ? "vision-texte-erreur" : undefined}
          className={`${CONTROL_TEXT} ${borderOf(errors.vision)}`}
        />
      </FormField>
    </Panel>
  );
}
