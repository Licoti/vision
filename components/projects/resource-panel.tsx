"use client";

/**
 * Le panneau qui relie une ressource — le geste qui ferme la boucle minimale de
 * `docs/05` §2 : *« … attache le lien de sa restitution, et repart. »*
 *
 * **Aucun écran de plus** (`docs/06` §2, qui pose six écrans comme un plancher
 * et exige qu'un septième réponde à une question à laquelle aucun autre ne
 * répond) : c'est la page du projet, plus un paramètre. La mécanique est celle
 * de T3.2, reprise sans en changer une ligne — le panneau n'est pas un état,
 * c'est une URL. `?ressource=nouvelle`, la page reste rendue derrière et porte
 * `inert`, et trois sorties mènent au même endroit : la croix, « Annuler » et le
 * voile, tous trois de simples liens vers la page nue.
 *
 * **Jumeau d'`activity-panel.tsx`, et volontairement.** Même frontière client —
 * `useActionState` est le seul moyen de faire revenir une saisie refusée avec
 * ses valeurs —, même `FocusTrap` **réutilisé sans modification**, même
 * `autofocus` sur la sortie, mêmes jetons. React 19 améliore progressivement :
 * le formulaire est soumis par le navigateur, l'action s'exécute, et **tout
 * fonctionne sans une ligne de JavaScript**.
 *
 * Il ne reçoit pas la session : un composant client n'a rien à faire d'un
 * contexte de droits. Il reçoit ce qu'il affiche — les activités proposées au
 * rattachement, le nom du projet — et une action qui ne connaît pas
 * l'identifiant du projet. **C'est le serveur qui décide ce que ce formulaire
 * écrit, jamais un champ caché.**
 *
 * **Vision n'héberge aucun fichier** (`docs/02` §5) : le panneau saisit un lien
 * et rien d'autre. Aucun téléversement, aucun aperçu, aucune requête vers
 * l'adresse tapée — ni pour la vérifier, ni pour en deviner le titre ou le type
 * (D21).
 *
 * **Deux points d'entrée depuis T4bis.5**, comme celui de l'activité depuis
 * T3.4 : `?ressource=nouvelle` relie, `?ressource=<identifiant>` corrige. Un
 * seul formulaire pour les deux gestes — mêmes champs, mêmes règles, mêmes
 * refus. Ce qui change tient en trois propriétés — le titre, le libellé du
 * bouton, les valeurs initiales — et le panneau ne sait pas lequel des deux
 * gestes il sert : c'est l'action liée qui le décide, côté serveur.
 */

import { useActionState } from "react";

import { borderOf, CONTROL, FormField } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import { formatResourceType } from "@/lib/format";
import {
  EMPTY_RESOURCE_VALUES,
  RESOURCE_TYPE_VALUES,
  type ResourceFormState,
  type ResourceFormValues,
} from "@/lib/forms/resource";

/**
 * Une activité proposée au rattachement : son identifiant, et de quoi la
 * reconnaître dans une liste — « Test utilisateur · mars 2026 ». Le libellé est
 * composé par la page, qui a déjà lu la roadmap.
 */
export type ResourceActivityOption = { id: string; label: string };

export function ResourcePanel({
  action,
  activities,
  submitLabel = "Relier la ressource",
  initial = EMPTY_RESOURCE_VALUES,
}: {
  /**
   * L'action serveur, **déjà liée** au projet côté serveur. Le panneau ne
   * connaît pas l'accompagnement dans lequel il écrit.
   */
  action: (
    state: ResourceFormState,
    formData: FormData,
  ) => Promise<ResourceFormState>;
  /**
   * Les activités de **ce** projet, facultatives au rattachement (`docs/02`
   * §5). Vide est un cas normal : un projet peut n'avoir aucune activité.
   */
  activities: readonly ResourceActivityOption[];
  submitLabel?: string;
  /**
   * Les valeurs de la ressource corrigée (T4bis.5). C'est l'**état initial** de
   * `useActionState` : un refus le remplace par ce qui a été tapé, si bien que
   * les deux chemins ont rigoureusement la même forme.
   */
  initial?: ResourceFormValues;
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
        label="Titre"
        htmlFor="ressource-titre"
        note="Le nom sous lequel ce document se retrouve. C'est lui qui portera le lien."
        error={errors.title}
        errorId="ressource-titre-erreur"
        required
      >
        <input
          id="ressource-titre"
          name="title"
          type="text"
          defaultValue={values.title}
          autoComplete="off"
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? "ressource-titre-erreur" : undefined}
          className={`${CONTROL} ${borderOf(errors.title)}`}
        />
      </FormField>

      {/* Vision n'héberge aucun fichier : ce champ est le produit tout
          entier de ce panneau. `type="url"` sert le clavier des mobiles ;
          la validation qui compte est côté serveur, le formulaire portant
          `noValidate`. */}
      <FormField
        label="Adresse du document"
        htmlFor="ressource-url"
        note="Le lien vers le document, là où il est hébergé. Vision ne stocke aucun fichier : elle renvoie vers l'outil qui le porte."
        error={errors.url}
        errorId="ressource-url-erreur"
        required
      >
        <input
          id="ressource-url"
          name="url"
          type="url"
          inputMode="url"
          defaultValue={values.url}
          autoComplete="off"
          placeholder="https://"
          aria-invalid={errors.url ? true : undefined}
          aria-describedby={errors.url ? "ressource-url-erreur" : undefined}
          className={`${CONTROL} ${borderOf(errors.url)}`}
        />
      </FormField>

      {/* D21 — saisi, et jamais deviné depuis l'adresse. Les libellés
          viennent de `lib/format`, posés une fois pour toutes en T4.1 ;
          l'ordre est celui de l'énuméré du schéma. */}
      <FormField
        label="Type"
        htmlFor="ressource-type"
        error={errors.resourceType}
        errorId="ressource-type-erreur"
        required
      >
        <select
          id="ressource-type"
          name="resourceType"
          defaultValue={values.resourceType}
          aria-invalid={errors.resourceType ? true : undefined}
          aria-describedby={
            errors.resourceType ? "ressource-type-erreur" : undefined
          }
          className={`${CONTROL} ${borderOf(errors.resourceType)}`}
        >
          <option value="">Choisir un type</option>
          {RESOURCE_TYPE_VALUES.map((type) => (
            <option key={type} value={type}>
              {formatResourceType(type)}
            </option>
          ))}
        </select>
      </FormField>

      {/* « Ce second rattachement est ce qui transforme une liste de
          fichiers en récit lisible » (`docs/02` §5) — facultatif, et
          fortement utile. Les activités proposées sont celles de ce
          projet, et elles seules : l'action revérifie la valeur reçue. */}
      <FormField
        label="Activité"
        htmlFor="ressource-activite"
        note="Facultative. L'activité qui a produit ce document : c'est elle qui transforme une liste de liens en récit lisible."
        error={errors.activityId}
        errorId="ressource-activite-erreur"
      >
        {activities.length > 0 ? (
          <select
            id="ressource-activite"
            name="activityId"
            defaultValue={values.activityId}
            aria-invalid={errors.activityId ? true : undefined}
            aria-describedby={
              errors.activityId ? "ressource-activite-erreur" : undefined
            }
            className={`${CONTROL} ${borderOf(errors.activityId)}`}
          >
            <option value="">Aucune</option>
            {activities.map((activity) => (
              <option key={activity.id} value={activity.id}>
                {activity.label}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-content-neutral-dark">
            {"Aucune activité à rattacher dans cet accompagnement."}
          </p>
        )}
      </FormField>
    </Panel>
  );
}
