"use client";

/**
 * Le panneau qui écrit un **use case** — le grand scénario d'usage du produit
 * (19/08/2026).
 *
 * **Aucun écran de plus** (`docs/06` §2) : c'est la page du produit, plus un
 * paramètre. `?usecase=nouveau` l'ouvre vide, `?usecase=<identifiant>` sur un
 * use case à corriger, et trois sorties mènent au même endroit : la croix,
 * « Annuler » et le voile.
 *
 * **Un seul formulaire pour les deux gestes**, créer et corriger, et le panneau
 * ne sait pas lequel il sert : ce qui change tient en trois propriétés — le
 * titre, le libellé du bouton, les valeurs initiales —, et c'est l'appelant qui
 * les choisit. La propriété d'`indicator-panel.tsx`, tenue depuis T3.4.
 *
 * **Le rattachement se saisit en cases à cocher, et c'est ce qui le distingue
 * du persona.** Les trois listes du persona avaient dû passer par des zones de
 * texte, faute d'un champ répétable sans JavaScript (la limite du 14/08/2026) ;
 * ici il n'y a rien à répéter — les personae du produit sont **connus**, et une
 * case par persona fonctionne sans une ligne de script. La cinquième discipline
 * est tenue sans contournement.
 *
 * **Le rattachement est facultatif** (arbitrage humain du 19/08/2026) : aucune
 * case cochée est un état valide, et un produit sans persona n'empêche pas
 * d'écrire ses scénarios.
 *
 * Il ne reçoit pas la session : un composant client n'a rien à faire d'un
 * contexte de droits. Il reçoit ce qu'il affiche — la liste des personae — et
 * une action qui ne connaît ni le produit ni le use case qu'elle écrit. **C'est
 * le serveur qui décide ce que ce formulaire écrit, jamais un champ caché**, et
 * c'est lui qui rapproche chaque identifiant reçu des personae du produit : la
 * liste ci-dessous est un confort de saisie, jamais une garantie.
 */

import { useActionState, useId } from "react";

import { borderOf, CONTROL_TEXT, FormField } from "@/components/ui/form-field";
import { BlockNote } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import {
  EMPTY_USE_CASE_VALUES,
  type UseCaseFormState,
  type UseCaseFormValues,
} from "@/lib/forms/use-case";

export function UseCasePanel({
  action,
  personas,
  submitLabel = "Ajouter le use case",
  initial = EMPTY_USE_CASE_VALUES,
}: {
  /**
   * L'action serveur, **déjà liée** au produit — et au use case en correction —
   * côté serveur. Le panneau ne connaît pas ce qu'il écrit.
   */
  action: (
    state: UseCaseFormState,
    formData: FormData,
  ) => Promise<UseCaseFormState>;
  /** Les personae **vivants du produit**, ceux qu'une case peut désigner. */
  personas: readonly { id: string; name: string; role: string | null }[];
  submitLabel?: string;
  /**
   * Le use case en place. C'est l'**état initial** de `useActionState` : un
   * refus le remplace par ce qui a été tapé, si bien que les deux chemins ont
   * rigoureusement la même forme.
   */
  initial?: UseCaseFormValues;
}) {
  const [state, submit, pending] = useActionState(action, {
    values: initial,
    errors: {},
  });

  const prefix = useId();
  const id = (field: string) => `${prefix}-${field}`;
  const errorId = (field: string) => `${prefix}-${field}-erreur`;

  const values = state.values;
  const errors = state.errors;

  /* Les cases cochées au premier rendu : celles de la ligne enregistrée, ou
     celles d'une saisie refusée. Un `Set` plutôt qu'un `includes` par case —
     un produit peut porter huit personae. */
  const attached = new Set(values.personaIds);

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
        label="Titre du use case"
        htmlFor={id("title")}
        note="Le scénario tel qu'on le nomme : « Démarrer, reprendre un projet », « Gérer les droits d'accès »."
        error={errors.title}
        errorId={errorId("title")}
        required
      >
        <input
          id={id("title")}
          name="title"
          type="text"
          defaultValue={values.title}
          autoComplete="off"
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? errorId("title") : undefined}
          className={`${CONTROL_TEXT} ${borderOf(errors.title)}`}
        />
      </FormField>

      <FormField
        label="Description courte"
        htmlFor={id("summary")}
        note="Ce que ce scénario permet, et pourquoi : deux ou trois phrases, du point de vue de qui l'emprunte."
        error={errors.summary}
        errorId={errorId("summary")}
        required
      >
        <textarea
          id={id("summary")}
          name="summary"
          rows={4}
          defaultValue={values.summary}
          aria-invalid={errors.summary ? true : undefined}
          aria-describedby={errors.summary ? errorId("summary") : undefined}
          className={`${CONTROL_TEXT} ${borderOf(errors.summary)}`}
        />
      </FormField>

      {/* Un `fieldset` et non un `FormField` : celui-ci pose un `<label for>`,
          qui ne désignerait qu'une des cases. Un groupe de cases se nomme par sa
          légende, et les classes sont celles de l'intitulé de `FormField`, au
          caractère près — la raison déjà écrite dans `persona-panel.tsx`. */}
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-2xs font-semibold uppercase text-content-neutral-dark">
          Personae associés
        </legend>
        <p className="text-xs text-content-neutral-base">
          Les profils que ce scénario sert. Facultatif — un use case peut
          s&apos;écrire avant qu&apos;on ait décrit ses profils.
        </p>

        {personas.length > 0 ? (
          <div className="mt-1 flex flex-col gap-2">
            {personas.map((persona) => (
              <label
                key={persona.id}
                htmlFor={id(persona.id)}
                className="flex items-start gap-2 text-sm text-content-neutral-darkest"
              >
                <input
                  id={id(persona.id)}
                  type="checkbox"
                  name="personaIds"
                  value={persona.id}
                  defaultChecked={attached.has(persona.id)}
                  aria-describedby={
                    errors.personaIds ? errorId("personaIds") : undefined
                  }
                  className="mt-1 flex-none"
                />
                <span className="min-w-0">
                  <span className="font-semibold">{persona.name}</span>
                  {persona.role ? (
                    <span className="block text-xs text-content-neutral-base">
                      {persona.role}
                    </span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
        ) : (
          /* Le produit n'a encore aucun persona. Ce n'est pas un empêchement —
             le rattachement est facultatif —, et la phrase le dit sans
             reprocher : elle annonce ce que ce groupe portera. */
          <BlockNote className="mt-1">
            Ce produit n&apos;a pas encore de persona. Le rattachement se fera
            depuis ce panneau dès qu&apos;un profil aura été décrit, dans le bloc
            « Personae ».
          </BlockNote>
        )}

        {errors.personaIds ? (
          <p
            id={errorId("personaIds")}
            className="text-xs font-semibold text-content-danger-dark"
          >
            {errors.personaIds}
          </p>
        ) : null}
      </fieldset>
    </Panel>
  );
}
