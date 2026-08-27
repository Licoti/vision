"use client";

/**
 * Le panneau du **lien déclaré** — relier, dire pourquoi, retirer.
 *
 * `docs/02` §7 le pose sans détour : *« c'est le seul cas où l'on demande une
 * saisie qui ne sert pas directement à celui qui la fait ; elle doit donc
 * rester très peu coûteuse et parfaitement optionnelle. »* **Deux champs, dont
 * un facultatif**, et c'est le plus court formulaire du produit : le coût d'un
 * geste se lit dans le nombre de champs avant de se lire à l'écran.
 *
 * **Aucun écran de plus** (`docs/06` §2) : c'est la page du projet, plus un
 * paramètre. La mécanique est celle de T3.2, reprise sans en changer une ligne
 * — `?lien=nouveau`, la page reste rendue derrière et porte `inert`, et les
 * trois sorties mènent au même endroit.
 *
 * **Jumeau de `resource-panel.tsx`, et volontairement.** Même frontière client
 * — `useActionState` est le seul moyen de faire revenir une saisie refusée avec
 * ses valeurs —, mêmes jetons, même `Panel`. React 19 améliore progressivement :
 * le formulaire est soumis par le navigateur, l'action s'exécute, et **tout
 * fonctionne sans une ligne de JavaScript**.
 *
 * Il ne reçoit pas la session : un composant client n'a rien à faire d'un
 * contexte de droits. Il reçoit ce qu'il affiche — les accompagnements
 * proposés — et une action qui ne connaît pas l'identifiant du projet d'où le
 * lien part. **C'est le serveur qui décide ce que ce formulaire écrit, jamais
 * un champ caché.**
 *
 * **Deux points d'entrée**, comme le panneau de ressource depuis T4bis.5 :
 * `?lien=nouveau` déclare, `?lien=<identifiant>` corrige. Un seul formulaire
 * pour les deux gestes — mêmes champs, mêmes règles, mêmes refus. Ce qui change
 * tient en trois propriétés — le titre, le libellé du bouton, les valeurs
 * initiales — et le panneau ne sait pas lequel des deux gestes il sert : c'est
 * l'action liée qui le décide, côté serveur.
 *
 * **Aucune suggestion de projet à relier fondée sur un calcul de proximité**
 * (interdit de la fiche). La liste est alphabétique par produit : elle décrit
 * ce qui existe, elle ne recommande rien. Les rapprochements calculés vivent
 * dans le bloc « Projets liés », sous leur nature à eux, et les deux natures ne
 * se confondent pas.
 */

import { useActionState } from "react";

import { borderOf, CONTROL, CONTROL_TEXT, FormField } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import {
  EMPTY_LINK_VALUES,
  type LinkFormState,
  type LinkFormValues,
} from "@/lib/forms/link";
import type { LinkableProject } from "@/lib/queries/links";

export function LinkPanel({
  action,
  projects,
  submitLabel = "Déclarer le lien",
  initial = EMPTY_LINK_VALUES,
}: {
  /**
   * L'action serveur, **déjà liée** au projet côté serveur. Le panneau ne
   * connaît pas l'accompagnement d'où le lien part.
   */
  action: (state: LinkFormState, formData: FormData) => Promise<LinkFormState>;
  /**
   * Les accompagnements proposés. Vide est un cas normal : un domaine qui n'a
   * qu'un projet n'a rien à relier, et un projet dont tous les voisins sont
   * déjà reliés non plus.
   */
  projects: readonly LinkableProject[];
  submitLabel?: string;
  /**
   * Les valeurs du lien corrigé. C'est l'**état initial** de `useActionState` :
   * un refus le remplace par ce qui a été tapé, si bien que les deux chemins
   * ont rigoureusement la même forme.
   */
  initial?: LinkFormValues;
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
      {/* Les accompagnements proposés sont ceux du domaine, vivants, non déjà
          reliés depuis celui-ci, et jamais celui-ci : l'action revérifie la
          valeur reçue, une par une. */}
      <FormField
        label="Accompagnement à relier"
        htmlFor="lien-projet"
        note="L'accompagnement que celui-ci rejoint. Le lien s'affichera sur les deux pages."
        error={errors.toProjectId}
        errorId="lien-projet-erreur"
        required
      >
        {projects.length > 0 ? (
          <select
            id="lien-projet"
            name="toProjectId"
            defaultValue={values.toProjectId}
            aria-invalid={errors.toProjectId ? true : undefined}
            aria-describedby={
              errors.toProjectId ? "lien-projet-erreur" : undefined
            }
            className={`${CONTROL} ${borderOf(errors.toProjectId)}`}
          >
            <option value="">Choisir un accompagnement</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.label}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-content-neutral-dark">
            {
              "Aucun autre accompagnement à relier : ceux de ce domaine le sont déjà, ou il n'y en a pas d'autre."
            }
          </p>
        )}
      </FormField>

      {/* **Facultative, et le champ le dit deux fois** — pas d'astérisque, et
          la note l'écrit en toutes lettres. `docs/02` §7 veut cette saisie
          « parfaitement optionnelle » : un lien sans raison est un lien
          valide, et la colonne est nullable pour cela. */}
      <FormField
        label="Pourquoi ce lien"
        htmlFor="lien-raison"
        note="Facultative. Ce que le calcul ne peut pas voir : « réutilise la grille d'entretien de X »."
        error={errors.reason}
        errorId="lien-raison-erreur"
      >
        <textarea
          id="lien-raison"
          name="reason"
          rows={3}
          defaultValue={values.reason}
          aria-invalid={errors.reason ? true : undefined}
          aria-describedby={errors.reason ? "lien-raison-erreur" : undefined}
          className={`${CONTROL_TEXT} ${borderOf(errors.reason)}`}
        />
      </FormField>
    </Panel>
  );
}
