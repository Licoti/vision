"use client";

/**
 * Le panneau qui saisit un résultat — le niveau 1 de `docs/03` §5, et lui seul
 * (D15) : *« le contributeur saisit la valeur et colle le lien vers le
 * rapport. »*
 *
 * **Aucun écran de plus** (`docs/06` §2) : c'est la page du projet, plus un
 * paramètre. La mécanique est celle de T3.2, reprise sans en changer une ligne
 * — le panneau n'est pas un état, c'est une URL. `?resultat=<identifiant
 * d'activité>`, la page reste rendue derrière et porte `inert`, et trois
 * sorties mènent au même endroit : la croix, « Annuler » et le voile.
 *
 * **Jumeau de `resource-panel.tsx`, et volontairement.** Même frontière client
 * — `useActionState` est le seul moyen de faire revenir une saisie refusée avec
 * ses valeurs —, même `FocusTrap` **réutilisé sans modification**, même
 * `autofocus` sur la sortie, mêmes jetons.
 *
 * Il ne reçoit pas la session : un composant client n'a rien à faire d'un
 * contexte de droits. Il reçoit ce qu'il affiche — les outils du référentiel,
 * le nom du projet, le libellé de l'activité — et une action qui ne connaît ni
 * le projet ni l'activité. **C'est le serveur qui décide ce que ce formulaire
 * écrit, jamais un champ caché.**
 *
 * **Le contrat unique de `docs/02` §5, et rien de plus** : un libellé, une
 * valeur, une unité, une date, l'outil, un lien profond. Aucun détail de
 * constat — il vit dans l'outil qui l'a produit, et c'est ce qui garantit que
 * brancher un outil de plus coûte une ligne de configuration.
 *
 * **Aucun appel à l'outil**, ni pour pré-remplir, ni pour vérifier, ni pour
 * lancer une analyse : c'est le niveau 2, après le POC. **Aucun seuil, aucun
 * code couleur de bon ou mauvais score** : Vision reporte une valeur, elle ne
 * la juge pas (D39).
 *
 * **Deux points d'entrée depuis T4bis.6**, comme le panneau de ressource depuis
 * T4bis.5 et celui d'activité depuis T3.4 — et **sans que la clé d'URL change
 * d'un caractère** : `?resultat=<identifiant d'activité>` ouvre la saisie quand
 * l'activité n'a pas de résultat, la correction quand elle en porte un. La
 * valeur désigne la cible du geste, pas le geste ; c'est la donnée qui le
 * décide, et l'écran comme le panneau en héritent.
 *
 * Un seul formulaire pour les deux — mêmes champs, mêmes règles, mêmes refus.
 * Ce qui change tient en trois propriétés — le titre, le libellé du bouton, les
 * valeurs initiales — et le panneau ne sait pas lequel des deux gestes il
 * sert : c'est l'action liée qui le décide, côté serveur.
 */

import { useActionState } from "react";

import { borderOf, CONTROL, FormField } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import {
  EMPTY_RESULT_VALUES,
  type ResultFormState,
  type ResultFormValues,
} from "@/lib/forms/result";
import type { ResultToolOption } from "@/lib/queries/activities";

export function ResultPanel({
  action,
  tools,
  submitLabel = "Enregistrer le résultat",
  initial = EMPTY_RESULT_VALUES,
}: {
  /**
   * L'action serveur, **déjà liée** au projet et à l'activité côté serveur. Le
   * panneau ne connaît ni l'un ni l'autre.
   */
  action: (
    state: ResultFormState,
    formData: FormData,
  ) => Promise<ResultFormState>;
  /**
   * Le référentiel des outils du domaine (`docs/04` §2). Facultatif au choix :
   * `results.tool_id` est nullable, et un résultat peut venir d'un outil que le
   * référentiel ne porte pas encore.
   */
  tools: readonly ResultToolOption[];
  submitLabel?: string;
  /**
   * Les valeurs du résultat corrigé (T4bis.6). C'est l'**état initial** de
   * `useActionState` : un refus le remplace par ce qui a été tapé, si bien que
   * les deux chemins ont rigoureusement la même forme.
   */
  initial?: ResultFormValues;
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
        htmlFor="resultat-libelle"
        note="Ce que l'outil a mesuré : « Score d'audit UX », « Taux de conformité »."
        error={errors.label}
        errorId="resultat-libelle-erreur"
        required
      >
        <input
          id="resultat-libelle"
          name="label"
          type="text"
          defaultValue={values.label}
          autoComplete="off"
          aria-invalid={errors.label ? true : undefined}
          aria-describedby={
            errors.label ? "resultat-libelle-erreur" : undefined
          }
          className={`${CONTROL} ${borderOf(errors.label)}`}
        />
      </FormField>

      {/* `type="text"` et non `type="number"` : ce dernier refuse la
          virgule dans une locale à point, avale les flèches de la molette
          et ne rend rien de lisible à l'assistance quand il est vide. La
          validation qui compte est côté serveur, le formulaire portant
          `noValidate`. `inputMode="decimal"` sert le clavier des mobiles. */}
      <FormField
        label="Valeur"
        htmlFor="resultat-valeur"
        note="Le chiffre reporté de l'outil, virgule acceptée. Facultatif : un constat sans chiffre reste un résultat."
        error={errors.value}
        errorId="resultat-valeur-erreur"
      >
        <input
          id="resultat-valeur"
          name="value"
          type="text"
          inputMode="decimal"
          defaultValue={values.value}
          autoComplete="off"
          aria-invalid={errors.value ? true : undefined}
          aria-describedby={errors.value ? "resultat-valeur-erreur" : undefined}
          className={`${CONTROL} ${borderOf(errors.value)}`}
        />
      </FormField>

      {/* Texte libre : `docs/04` §2 ne pose aucun référentiel d'unités, et
          en inventer un fermerait la porte au prochain outil branché. */}
      <FormField
        label="Unité"
        htmlFor="resultat-unite"
        note="« /100 », « % », « s ». Facultative."
        error={errors.unit}
        errorId="resultat-unite-erreur"
      >
        <input
          id="resultat-unite"
          name="unit"
          type="text"
          defaultValue={values.unit}
          autoComplete="off"
          aria-invalid={errors.unit ? true : undefined}
          aria-describedby={errors.unit ? "resultat-unite-erreur" : undefined}
          className={`${CONTROL} ${borderOf(errors.unit)}`}
        />
      </FormField>

      {/* La date de la **mesure**, pas celle de la saisie : Vision ne
          fabrique aucune date (arbitrage de T3.3, repris ici). Elle peut
          précéder de loin le jour où le résultat est reporté. */}
      <FormField
        label="Date de mesure"
        htmlFor="resultat-date"
        note="Le jour où l'outil a produit cette valeur, qui n'est pas forcément celui de la saisie."
        error={errors.measuredOn}
        errorId="resultat-date-erreur"
        required
      >
        <input
          id="resultat-date"
          name="measuredOn"
          type="date"
          defaultValue={values.measuredOn}
          aria-invalid={errors.measuredOn ? true : undefined}
          aria-describedby={
            errors.measuredOn ? "resultat-date-erreur" : undefined
          }
          className={`${CONTROL} ${borderOf(errors.measuredOn)}`}
        />
      </FormField>

      {/* Le référentiel du domaine (`docs/04` §2) : brancher un outil de
          plus coûte une ligne, pas un module. Facultatif — la colonne est
          nullable, et un résultat peut venir d'un outil que le
          référentiel ne porte pas encore. */}
      <FormField
        label="Outil"
        htmlFor="resultat-outil"
        note="Facultatif. L'outil externe qui a produit cette valeur."
        error={errors.toolId}
        errorId="resultat-outil-erreur"
      >
        {tools.length > 0 ? (
          <select
            id="resultat-outil"
            name="toolId"
            defaultValue={values.toolId}
            aria-invalid={errors.toolId ? true : undefined}
            aria-describedby={
              errors.toolId ? "resultat-outil-erreur" : undefined
            }
            className={`${CONTROL} ${borderOf(errors.toolId)}`}
          >
            <option value="">Aucun</option>
            {tools.map((tool) => (
              <option key={tool.id} value={tool.id}>
                {tool.name}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-content-neutral-dark">
            {"Aucun outil n'est raccordé à ce domaine."}
          </p>
        )}
      </FormField>

      {/* Le lien profond du contrat unique. **Un résultat sans lien est un
          cas normal** (T4.3) : la valeur s'affiche, et aucun lien mort
          n'est rendu. `type="url"` sert le clavier des mobiles ; la
          validation qui compte est côté serveur. */}
      <FormField
        label="Lien vers le rapport"
        htmlFor="resultat-lien"
        note="Facultatif. Le lien profond vers le rapport dans l'outil : c'est lui qui portera le libellé. Vision affiche la synthèse, le détail vit là-bas."
        error={errors.externalUrl}
        errorId="resultat-lien-erreur"
      >
        <input
          id="resultat-lien"
          name="externalUrl"
          type="url"
          inputMode="url"
          defaultValue={values.externalUrl}
          autoComplete="off"
          placeholder="https://"
          aria-invalid={errors.externalUrl ? true : undefined}
          aria-describedby={
            errors.externalUrl ? "resultat-lien-erreur" : undefined
          }
          className={`${CONTROL} ${borderOf(errors.externalUrl)}`}
        />
      </FormField>
    </Panel>
  );
}
