"use client";

/**
 * Le panneau qui écrit un **persona** — le profil pour lequel on conçoit
 * (18/08/2026).
 *
 * **Aucun écran de plus** (`docs/06` §2) : c'est la page du produit, plus un
 * paramètre. La mécanique est celle de T3.2, reprise sans en changer une ligne
 * — le panneau n'est pas un état, c'est une URL. `?persona=nouveau` l'ouvre
 * vide, `?persona=<identifiant>` sur un persona à corriger, et trois sorties
 * mènent au même endroit : la croix, « Annuler » et le voile.
 *
 * **Un seul formulaire pour les deux gestes**, créer et corriger, et le panneau
 * ne sait pas lequel il sert : ce qui change tient en trois propriétés — le
 * titre, le libellé du bouton, les valeurs initiales —, et c'est l'appelant qui
 * les choisit. C'est la propriété d'`indicator-panel.tsx`, tenue depuis T3.4.
 *
 * **Les trois listes sont des zones de texte, une ligne = un élément**, et la
 * note de chaque champ le dit. Le champ répétable reste interdit — il exigerait
 * le JavaScript que la cinquième discipline refuse (la limite du 14/08/2026) —,
 * et ce n'est pas une perte : `lib/forms/persona.ts` découpe les lignes, si
 * bien que ce qui arrive en base est **structuré** malgré une saisie en texte.
 * Un irritant est une ligne de `persona_traits`, avec son identifiant propre.
 *
 * **Le rang est un groupe de boutons radio, jamais une case à cocher** : deux
 * états nommés, tous deux écrits en toutes lettres. « Principal » coché ou non
 * laisserait deviner ce que « non coché » veut dire.
 *
 * Il ne reçoit pas la session : un composant client n'a rien à faire d'un
 * contexte de droits. Il reçoit ce qu'il affiche — le nom du produit — et une
 * action qui ne connaît ni le produit ni le persona qu'elle écrit. **C'est le
 * serveur qui décide ce que ce formulaire écrit, jamais un champ caché.**
 */

import { useActionState, useId } from "react";

import { borderOf, CONTROL_TEXT, FormField } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import {
  EMPTY_PERSONA_VALUES,
  type PersonaFormState,
  type PersonaFormValues,
} from "@/lib/forms/persona";

/** Les intitulés du rang, écrits une fois. La couleur ne porte jamais seule. */
const KIND_LABELS = [
  {
    value: "primary",
    label: "Persona principal",
    note: "Un profil que ce produit sert en premier.",
  },
  {
    value: "secondary",
    label: "Persona secondaire",
    note: "Un profil concerné, sans être au centre.",
  },
] as const;

export function PersonaPanel({
  productName,
  closeHref,
  action,
  title = "Ajouter un persona",
  submitLabel = "Ajouter le persona",
  initial = EMPTY_PERSONA_VALUES,
}: {
  productName: string;
  /** La page du produit, sans son paramètre. Les trois sorties y mènent. */
  closeHref: string;
  /**
   * L'action serveur, **déjà liée** au produit — et au persona en correction —
   * côté serveur. Le panneau ne connaît pas ce qu'il écrit.
   */
  action: (
    state: PersonaFormState,
    formData: FormData,
  ) => Promise<PersonaFormState>;
  /** « Ajouter… » en création, « Modifier… » en correction. */
  title?: string;
  submitLabel?: string;
  /**
   * Le persona en place. C'est l'**état initial** de `useActionState` : un refus
   * le remplace par ce qui a été tapé, si bien que les deux chemins ont
   * rigoureusement la même forme.
   */
  initial?: PersonaFormValues;
}) {
  const [state, submit, pending] = useActionState(action, {
    values: initial,
    errors: {},
  });

  /* Deux panneaux ne coexistent jamais, mais huit identifiants écrits en dur
     rendraient le fichier fragile au copier-coller : `useId` est la règle des
     deux formulaires pleine page, reprise ici parce que le formulaire est long. */
  const prefix = useId();
  const id = (field: string) => `${prefix}-${field}`;
  const errorId = (field: string) => `${prefix}-${field}-erreur`;

  const values = state.values;
  const errors = state.errors;

  return (
    <Panel
      titleId={`${prefix}-titre`}
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
        label="Nom du persona"
        htmlFor={id("name")}
        note="Le profil tel qu'on le nomme entre nous : « Chargé de clientèle », « Client pressé »."
        error={errors.name}
        errorId={errorId("name")}
        required
      >
        <input
          id={id("name")}
          name="name"
          type="text"
          defaultValue={values.name}
          autoComplete="off"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? errorId("name") : undefined}
          className={`${CONTROL_TEXT} ${borderOf(errors.name)}`}
        />
      </FormField>

      <FormField
        label="Rôle ou contexte"
        htmlFor={id("role")}
        note="D'où il parle : son poste, son service, sa situation d'usage."
        error={errors.role}
        errorId={errorId("role")}
      >
        <input
          id={id("role")}
          name="role"
          type="text"
          defaultValue={values.role}
          autoComplete="off"
          aria-invalid={errors.role ? true : undefined}
          aria-describedby={errors.role ? errorId("role") : undefined}
          className={`${CONTROL_TEXT} ${borderOf(errors.role)}`}
        />
      </FormField>

      <FormField
        label="Description courte"
        htmlFor={id("summary")}
        note="Deux ou trois phrases : qui il est, ce qu'il fait de ce produit."
        error={errors.summary}
        errorId={errorId("summary")}
      >
        <textarea
          id={id("summary")}
          name="summary"
          rows={3}
          defaultValue={values.summary}
          aria-invalid={errors.summary ? true : undefined}
          aria-describedby={errors.summary ? errorId("summary") : undefined}
          className={`${CONTROL_TEXT} ${borderOf(errors.summary)}`}
        />
      </FormField>

      <FormField
        label="Adresse de l'image"
        htmlFor={id("imageUrl")}
        note="Le lien vers la photo ou l'illustration, là où elle est hébergée. Vision ne stocke aucun fichier. Sans adresse, les initiales s'affichent."
        error={errors.imageUrl}
        errorId={errorId("imageUrl")}
      >
        <input
          id={id("imageUrl")}
          name="imageUrl"
          type="url"
          inputMode="url"
          placeholder="https://"
          defaultValue={values.imageUrl}
          autoComplete="off"
          aria-invalid={errors.imageUrl ? true : undefined}
          aria-describedby={errors.imageUrl ? errorId("imageUrl") : undefined}
          className={`${CONTROL_TEXT} ${borderOf(errors.imageUrl)}`}
        />
      </FormField>

      {/* Un `fieldset` et non un `FormField` : celui-ci pose un `<label for>`,
          qui ne désignerait qu'un des deux boutons. Un groupe de radios se
          nomme par sa légende, et les classes sont celles de l'intitulé de
          `FormField`, au caractère près. */}
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-2xs font-semibold uppercase text-content-neutral-dark">
          Rang du persona
        </legend>
        <p className="text-xs text-content-neutral-base">
          Ce qui distingue les profils que ce produit sert en premier.
        </p>
        <div className="mt-1 flex flex-col gap-2">
          {KIND_LABELS.map((option) => (
            <label
              key={option.value}
              htmlFor={id(option.value)}
              className="flex items-start gap-2.5 text-sm text-content-neutral-darkest"
            >
              <input
                id={id(option.value)}
                type="radio"
                name="kind"
                value={option.value}
                defaultChecked={values.kind === option.value}
                aria-describedby={errors.kind ? errorId("kind") : undefined}
                className="mt-1 flex-none"
              />
              <span className="min-w-0">
                <span className="font-semibold">{option.label}</span>
                <span className="block text-xs text-content-neutral-base">
                  {option.note}
                </span>
              </span>
            </label>
          ))}
        </div>
        {errors.kind ? (
          <p
            id={errorId("kind")}
            className="text-xs font-semibold text-content-danger-dark"
          >
            {errors.kind}
          </p>
        ) : null}
      </fieldset>

      <FormField
        label="Objectifs"
        htmlFor={id("goals")}
        note="Ce qu'il cherche à faire. Un objectif par ligne."
        error={errors.goals}
        errorId={errorId("goals")}
      >
        <textarea
          id={id("goals")}
          name="goals"
          rows={4}
          defaultValue={values.goals}
          aria-invalid={errors.goals ? true : undefined}
          aria-describedby={errors.goals ? errorId("goals") : undefined}
          className={`${CONTROL_TEXT} ${borderOf(errors.goals)}`}
        />
      </FormField>

      <FormField
        label="Irritants"
        htmlFor={id("pains")}
        note="Ce qui le bloque ou le ralentit aujourd'hui. Un irritant par ligne."
        error={errors.pains}
        errorId={errorId("pains")}
      >
        <textarea
          id={id("pains")}
          name="pains"
          rows={4}
          defaultValue={values.pains}
          aria-invalid={errors.pains ? true : undefined}
          aria-describedby={errors.pains ? errorId("pains") : undefined}
          className={`${CONTROL_TEXT} ${borderOf(errors.pains)}`}
        />
      </FormField>

      <FormField
        label="Attentes"
        htmlFor={id("expectations")}
        note="Ce qu'il attend du produit, sans préjuger de la solution. Une attente par ligne."
        error={errors.expectations}
        errorId={errorId("expectations")}
      >
        <textarea
          id={id("expectations")}
          name="expectations"
          rows={4}
          defaultValue={values.expectations}
          aria-invalid={errors.expectations ? true : undefined}
          aria-describedby={
            errors.expectations ? errorId("expectations") : undefined
          }
          className={`${CONTROL_TEXT} ${borderOf(errors.expectations)}`}
        />
      </FormField>
    </Panel>
  );
}
