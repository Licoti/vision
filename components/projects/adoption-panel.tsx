"use client";

/**
 * Le panneau qui adopte un indicateur du produit pour cet accompagnement.
 *
 * **Aucun écran de plus** (`docs/06` §2) : c'est la page du projet, plus un
 * paramètre. La mécanique est celle de T3.2, reprise **sans en changer une
 * ligne** — le panneau n'est pas un état, c'est une URL. `?indicateur=nouvel`
 * adopte, `?indicateur=<identifiant d'adoption>` corrige ; la page reste rendue
 * derrière et porte `inert`, et trois sorties mènent au même endroit : la croix,
 * « Annuler » et le voile, tous trois de simples liens vers la page nue.
 *
 * **La clé est celle de la page produit** (T5.2), et il n'y a pas de confusion
 * possible : ce sont deux pages, jamais la même URL. Sa **valeur** ne désigne
 * pas la même table pour autant — un indicateur là-bas, une adoption ici, parce
 * que c'est l'adoption qu'on corrige et qu'on retire.
 *
 * **Sixième jumeau d'`activity-panel.tsx`**, après la ressource, le résultat,
 * l'indicateur et le relevé, et volontairement. Même frontière client —
 * `useActionState` est le seul moyen de faire revenir une saisie refusée avec
 * ses valeurs —, même `FocusTrap` **réutilisé sans modification**, même
 * `autofocus` sur la sortie, mêmes jetons. React 19 améliore progressivement :
 * le formulaire est soumis par le navigateur, l'action s'exécute, et **tout
 * fonctionne sans une ligne de JavaScript**.
 *
 * Il ne reçoit pas la session : un composant client n'a rien à faire d'un
 * contexte de droits. Il reçoit ce qu'il affiche — le nom du projet, les
 * indicateurs proposés — et une action qui ne connaît ni l'un ni l'autre.
 * **C'est le serveur qui décide ce que ce formulaire écrit, jamais un champ
 * caché.**
 *
 * **Un seul formulaire pour les deux gestes**, comme les cinq panneaux qui le
 * précèdent : mêmes champs, mêmes règles, mêmes refus. Ce qui change tient en
 * trois propriétés — le titre, le libellé du bouton, les valeurs initiales — et
 * le panneau ne sait pas lequel des deux gestes il sert : c'est l'action liée qui
 * le décide, côté serveur.
 *
 * **Aucune création d'indicateur ici** (arbitrage (c) de `tickets-C5.md`) :
 * quand le produit n'en porte aucun à adopter, le panneau le dit et renvoie vers
 * la page du produit, plutôt que d'offrir un `select` sans option.
 *
 * **Aucun cinquième chiffre**, et aucune comparaison entre les trois : la cible
 * est un repère, jamais un état (arbitrage (g), D39). Le panneau n'affiche ni
 * écart, ni progression, ni « cible atteinte ».
 */

import Link from "next/link";
import { useActionState } from "react";

import {
  borderOf,
  CONTROL,
  FormField,
} from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import {
  EMPTY_ADOPTION_VALUES,
  type AdoptionFormState,
  type AdoptionFormValues,
} from "@/lib/forms/adoption";

/** Une option du `select` : ce qu'il faut pour la nommer, rien de plus. */
export type AdoptionIndicatorOption = {
  id: string;
  label: string;
  /** L'unité, quand l'indicateur en porte une : elle nomme ce qu'on va saisir. */
  unit: string | null;
};

/** « Autonomie · % » — l'unité dit ce que les trois valeurs vont mesurer. */
function optionLabel(option: AdoptionIndicatorOption): string {
  return option.unit ? `${option.label} · ${option.unit}` : option.label;
}

export function AdoptionPanel({
  projectName,
  closeHref,
  productHref,
  action,
  indicators,
  title = "Adopter un indicateur",
  submitLabel = "Adopter l'indicateur",
  initial = EMPTY_ADOPTION_VALUES,
}: {
  projectName: string;
  /** La page du projet, sans son paramètre. Les trois sorties y mènent. */
  closeHref: string;
  /** La page du produit — le seul endroit où un indicateur se crée. */
  productHref: string;
  /**
   * L'action serveur, **déjà liée** au projet côté serveur — au projet et à
   * l'adoption en correction. Le panneau ne connaît pas ce qu'il écrit.
   */
  action: (
    state: AdoptionFormState,
    formData: FormData,
  ) => Promise<AdoptionFormState>;
  /**
   * Les indicateurs proposés : les vivants du produit que cet accompagnement
   * n'adopte pas encore, plus celui de l'adoption éditée — l'exception
   * nominative, calculée par la lecture et non par ce composant.
   */
  indicators: readonly AdoptionIndicatorOption[];
  /** « Adopter un indicateur » en saisie, « Modifier l'adoption » sinon. */
  title?: string;
  submitLabel?: string;
  /**
   * Les valeurs de l'adoption corrigée. C'est l'**état initial** de
   * `useActionState` : un refus le remplace par ce qui a été tapé, si bien que
   * les deux chemins ont rigoureusement la même forme.
   */
  initial?: AdoptionFormValues;
}) {
  const [state, submit, pending] = useActionState(action, {
    values: initial,
    errors: {},
  });

    const values = state.values;
  const errors = state.errors;

  return (
    <Panel
      titleId="panneau-adoption-titre"
      title={title}
      subtitles={[projectName]}
      closeHref={closeHref}
      action={submit}
      pending={pending}
      submitLabel={submitLabel}
      message={state.message}
      errors={errors}
    >
      {/* Les indicateurs proposés sont ceux du produit que cet
          accompagnement n'adopte pas encore : l'unicité `(projet,
          indicateur)` est totale en base, et proposer deux fois le même
          mènerait à un refus que rien n'annonçait. L'action revérifie la
          valeur reçue — un `select` n'a jamais protégé un point d'entrée
          HTTP.

          La liste vide n'est pas une erreur : c'est le cas d'un produit
          dont tous les indicateurs sont déjà adoptés, ou qui n'en porte
          aucun. Le repli est celui de `resource-panel.tsx`, avec le
          renvoi que l'arbitrage (c) impose en plus. */}
      <FormField
        label="Indicateur"
        htmlFor="adoption-indicateur"
        note="Un indicateur du produit, que cet accompagnement reprend à son compte."
        error={errors.indicatorId}
        errorId="adoption-indicateur-erreur"
        required
      >
        {indicators.length > 0 ? (
          <select
            id="adoption-indicateur"
            name="indicatorId"
            defaultValue={values.indicatorId}
            aria-invalid={errors.indicatorId ? true : undefined}
            aria-describedby={
              errors.indicatorId ? "adoption-indicateur-erreur" : undefined
            }
            className={`${CONTROL} ${borderOf(errors.indicatorId)}`}
          >
            <option value="">Choisir un indicateur</option>
            {indicators.map((indicator) => (
              <option key={indicator.id} value={indicator.id}>
                {optionLabel(indicator)}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-content-neutral-dark">
            Ce produit ne porte aucun indicateur à adopter. Un indicateur
            se crée sur{" "}
            <Link
              href={productHref}
              className="text-content-info-base underline"
            >
              la page du produit
            </Link>
            .
          </p>
        )}
      </FormField>

      {/* Les trois valeurs sont **facultatives**, et le disent : adopter
          un indicateur sans fixer de cible est un geste normal. Elles sont
          rangées dans l'ordre du temps — d'où l'on part, où l'on va, où
          l'on est arrivé —, qui est aussi celui du bloc.

          `type="text"` et non `type="number"` : le champ numérique refuse
          la virgule française selon la locale du navigateur, et ne rend
          rien de lisible à l'assistance quand il est vide — la raison
          écrite dans `result-panel.tsx`. La validation qui compte est côté
          serveur, le formulaire portant `noValidate`. `inputMode="decimal"`
          sert le clavier des mobiles.

          **L'unité n'est pas ici** : elle appartient à l'indicateur, saisie
          une fois pour toutes en T5.2, et le `select` la rappelle. */}
      <FormField
        label="Valeur de référence"
        htmlFor="adoption-reference"
        note="Facultative. Où en était l'indicateur au démarrage de cet accompagnement."
        error={errors.baselineValue}
        errorId="adoption-reference-erreur"
      >
        <input
          id="adoption-reference"
          name="baselineValue"
          type="text"
          inputMode="decimal"
          defaultValue={values.baselineValue}
          autoComplete="off"
          aria-invalid={errors.baselineValue ? true : undefined}
          aria-describedby={
            errors.baselineValue ? "adoption-reference-erreur" : undefined
          }
          className={`${CONTROL} ${borderOf(errors.baselineValue)}`}
        />
      </FormField>

      <FormField
        label="Cible"
        htmlFor="adoption-cible"
        note="Facultative. La valeur visée — un repère, que Vision n'évalue jamais."
        error={errors.targetValue}
        errorId="adoption-cible-erreur"
      >
        <input
          id="adoption-cible"
          name="targetValue"
          type="text"
          inputMode="decimal"
          defaultValue={values.targetValue}
          autoComplete="off"
          aria-invalid={errors.targetValue ? true : undefined}
          aria-describedby={
            errors.targetValue ? "adoption-cible-erreur" : undefined
          }
          className={`${CONTROL} ${borderOf(errors.targetValue)}`}
        />
      </FormField>

      <FormField
        label="Valeur finale"
        htmlFor="adoption-finale"
        note="Facultative. La valeur constatée à la clôture, si elle est connue."
        error={errors.finalValue}
        errorId="adoption-finale-erreur"
      >
        <input
          id="adoption-finale"
          name="finalValue"
          type="text"
          inputMode="decimal"
          defaultValue={values.finalValue}
          autoComplete="off"
          aria-invalid={errors.finalValue ? true : undefined}
          aria-describedby={
            errors.finalValue ? "adoption-finale-erreur" : undefined
          }
          className={`${CONTROL} ${borderOf(errors.finalValue)}`}
        />
      </FormField>
    </Panel>
  );
}
