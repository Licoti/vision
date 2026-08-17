"use client";

/**
 * Le panneau qui saisit un indicateur — **le premier écran d'écriture de la page
 * produit depuis T2.5**, et le premier objet de C5 livré avec ses trois gestes
 * (arbitrage (a) de `tickets-C5.md`).
 *
 * **Aucun écran de plus** (`docs/06` §2) : c'est la page du produit, plus un
 * paramètre. La mécanique est celle de T3.2, reprise **sans en changer une
 * ligne** — le panneau n'est pas un état, c'est une URL. `?indicateur=nouvel`
 * crée, `?indicateur=<identifiant>` corrige ; la page reste rendue derrière et
 * porte `inert`, et trois sorties mènent au même endroit : la croix,
 * « Annuler » et le voile, tous trois de simples liens vers la page nue.
 *
 * **Troisième jumeau d'`activity-panel.tsx`**, après celui de la ressource et
 * celui du résultat, et volontairement. Même frontière client —
 * `useActionState` est le seul moyen de faire revenir une saisie refusée avec
 * ses valeurs —, même `FocusTrap` **réutilisé sans modification**, même
 * `autofocus` sur la sortie, mêmes jetons. React 19 améliore progressivement :
 * le formulaire est soumis par le navigateur, l'action s'exécute, et **tout
 * fonctionne sans une ligne de JavaScript**.
 *
 * Il ne reçoit pas la session : un composant client n'a rien à faire d'un
 * contexte de droits. Il reçoit ce qu'il affiche — le nom du produit — et une
 * action qui ne connaît pas l'identifiant du produit. **C'est le serveur qui
 * décide ce que ce formulaire écrit, jamais un champ caché.**
 *
 * **Un seul formulaire pour les deux gestes**, comme le panneau d'activité
 * depuis T3.4 : mêmes champs, mêmes règles, mêmes refus. Ce qui change tient en
 * trois propriétés — le titre, le libellé du bouton, les valeurs initiales — et
 * le panneau ne sait pas lequel des deux gestes il sert : c'est l'action liée
 * qui le décide, côté serveur.
 *
 * **Le sens de lecture ne juge rien.** Il est proposé en toutes lettres parce
 * qu'il dit dans quel sens la série d'une courbe se lit (T5.6) ; aucune couleur,
 * aucun pictogramme, aucun mot appliqué à une valeur ne s'en tire — D39 interdit
 * tout indice calculé par Vision pour qualifier un produit.
 */

import { useActionState } from "react";

import {
  borderOf,
  CONTROL,
  FormField,
} from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import { formatIndicatorDirection } from "@/lib/format";
import {
  EMPTY_INDICATOR_VALUES,
  INDICATOR_DIRECTION_VALUES,
  type IndicatorFormState,
  type IndicatorFormValues,
} from "@/lib/forms/indicator";

export function IndicatorPanel({
  productName,
  closeHref,
  action,
  title = "Ajouter un indicateur",
  submitLabel = "Ajouter l'indicateur",
  initial = EMPTY_INDICATOR_VALUES,
}: {
  productName: string;
  /** La page du produit, sans son paramètre. Les trois sorties y mènent. */
  closeHref: string;
  /**
   * L'action serveur, **déjà liée** au produit côté serveur — et à l'indicateur
   * en correction. Le panneau ne connaît pas ce qu'il écrit.
   */
  action: (
    state: IndicatorFormState,
    formData: FormData,
  ) => Promise<IndicatorFormState>;
  /** « Ajouter un indicateur » en création, « Modifier l'indicateur » sinon. */
  title?: string;
  submitLabel?: string;
  /**
   * Les valeurs de l'indicateur corrigé. C'est l'**état initial** de
   * `useActionState` : un refus le remplace par ce qui a été tapé, si bien que
   * les deux chemins ont rigoureusement la même forme.
   */
  initial?: IndicatorFormValues;
}) {
  const [state, submit, pending] = useActionState(action, {
    values: initial,
    errors: {},
  });

    const values = state.values;
  const errors = state.errors;

  return (
    <Panel
      titleId="panneau-indicateur-titre"
      title={title}
      subtitles={[productName]}
      closeHref={closeHref}
      action={submit}
      pending={pending}
      submitLabel={submitLabel}
      message={state.message}
      errors={errors}
    >
      <FormField
        label="Libellé"
        htmlFor="indicateur-libelle"
        note="Ce que ce produit mesure, et qui se suit d'un accompagnement à l'autre."
        error={errors.label}
        errorId="indicateur-libelle-erreur"
        required
      >
        <input
          id="indicateur-libelle"
          name="label"
          type="text"
          defaultValue={values.label}
          autoComplete="off"
          aria-invalid={errors.label ? true : undefined}
          aria-describedby={
            errors.label ? "indicateur-libelle-erreur" : undefined
          }
          className={`${CONTROL} ${borderOf(errors.label)}`}
        />
      </FormField>

      {/* Texte libre, et aucun référentiel : `indicators.unit` est un
          `text` nullable, et en faire une liste serait l'écran de gestion
          des référentiels que la fiche interdit (D25, C7). */}
      <FormField
        label="Unité"
        htmlFor="indicateur-unite"
        note="Facultative. « % », « s », « /100 » — telle qu'elle s'écrit à côté du chiffre."
        error={errors.unit}
        errorId="indicateur-unite-erreur"
      >
        <input
          id="indicateur-unite"
          name="unit"
          type="text"
          defaultValue={values.unit}
          autoComplete="off"
          aria-invalid={errors.unit ? true : undefined}
          aria-describedby={
            errors.unit ? "indicateur-unite-erreur" : undefined
          }
          className={`${CONTROL} ${borderOf(errors.unit)}`}
        />
      </FormField>

      {/* La liste est **dérivée du schéma**, jamais réécrite à la main, et
          les libellés viennent de `lib/format`, posés en T5.1 : un seul
          endroit les nomme. Aucune valeur par défaut n'est pré-choisie —
          la colonne n'en a pas, et deviner le sens d'une mesure qu'on ne
          connaît pas serait le premier jugement porté par Vision. */}
      <FormField
        label="Sens de lecture"
        htmlFor="indicateur-sens"
        note="Dans quel sens la série se lit. Vision ne qualifie aucune valeur : ni bonne, ni mauvaise."
        error={errors.direction}
        errorId="indicateur-sens-erreur"
        required
      >
        <select
          id="indicateur-sens"
          name="direction"
          defaultValue={values.direction}
          aria-invalid={errors.direction ? true : undefined}
          aria-describedby={
            errors.direction ? "indicateur-sens-erreur" : undefined
          }
          className={`${CONTROL} ${borderOf(errors.direction)}`}
        >
          <option value="">Choisir un sens de lecture</option>
          {INDICATOR_DIRECTION_VALUES.map((direction) => (
            <option key={direction} value={direction}>
              {formatIndicatorDirection(direction)}
            </option>
          ))}
        </select>
      </FormField>

      {/* D'où vient la mesure, en toutes lettres. Vision ne raccorde aucun
          outil ici : c'est une note, pas une liaison — le référentiel
          `tools` sert les résultats (T4.4), et un indicateur n'en dépend
          pas. */}
      <FormField
        label="Source"
        htmlFor="indicateur-source"
        note="Facultative. D'où vient la mesure : « Portail analytics », « Enquête trimestrielle »…"
        error={errors.source}
        errorId="indicateur-source-erreur"
      >
        <input
          id="indicateur-source"
          name="source"
          type="text"
          defaultValue={values.source}
          autoComplete="off"
          aria-invalid={errors.source ? true : undefined}
          aria-describedby={
            errors.source ? "indicateur-source-erreur" : undefined
          }
          className={`${CONTROL} ${borderOf(errors.source)}`}
        />
      </FormField>
    </Panel>
  );
}
