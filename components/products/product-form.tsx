"use client";

/**
 * Le formulaire d'un produit — création et modification, le même.
 *
 * **Second composant client du projet**, après `MainNav`, et pour une seule
 * raison : `useActionState`. React 19 l'améliore progressivement — l'action
 * est une action serveur, le formulaire est soumis par le navigateur, et tout
 * fonctionne sans JavaScript. Ce que le hook apporte quand JavaScript est là :
 * les valeurs déjà saisies survivent à une erreur de validation. Sans lui, une
 * description de dix lignes disparaîtrait au premier nom oublié.
 *
 * Il ne reçoit pas la session : un composant client n'a rien à faire d'un
 * contexte de droits. Il reçoit ce qu'il affiche — les entités, les valeurs
 * initiales — et une action **déjà liée**, dont il ne connaît ni le domaine ni
 * l'identifiant du produit. C'est le serveur qui décide ce que ce formulaire
 * écrit, jamais un champ caché.
 *
 * Le filet des contrôles est plus sombre que celui des blocs, pour la raison
 * mesurée en T2.3 : la bordure d'un champ est la limite d'un composant
 * d'interface, elle se mesure à 3:1, et aucun jeton `border-*` du design
 * system ne l'atteint sur ce fond.
 */

import Link from "next/link";
import { useActionState, useId, type ReactNode } from "react";

import {
  EMPTY_PRODUCT_VALUES,
  PRODUCT_KIND_LABEL,
  type ProductFormState,
  type ProductFormValues,
} from "@/lib/forms/product";

/** Une entité de rattachement, telle qu'elle se choisit. */
export type ProductFormEntity = { id: string; label: string };

/** Ce que le type de produit veut dire, en une phrase (D10). */
const KIND_HINT: Record<keyof typeof PRODUCT_KIND_LABEL, string> = {
  product: "Un objet durable de l'entreprise, accompagné dans le temps.",
  internal: "Une mission transverse, qui ne porte pas sur un produit précis.",
};

const CONTROL =
  "w-full rounded-lg border bg-surface-neutral-pale px-3 py-2 text-sm text-content-neutral-darkest placeholder:text-content-neutral-base";

export function ProductForm({
  action,
  entities,
  initial = EMPTY_PRODUCT_VALUES,
  submitLabel,
  cancelHref,
}: {
  action: (
    state: ProductFormState,
    formData: FormData,
  ) => Promise<ProductFormState>;
  entities: readonly ProductFormEntity[];
  initial?: ProductFormValues;
  submitLabel: string;
  /** Où l'on retourne sans rien écrire : la liste, ou la page du produit. */
  cancelHref: string;
}) {
  const [state, submit, pending] = useActionState(action, {
    values: initial,
    errors: {},
  });

  const prefix = useId();
  const id = (field: string) => `${prefix}-${field}`;
  const errorId = (field: string) => `${prefix}-${field}-erreur`;

  /* Ce que le formulaire réaffiche : la dernière saisie refusée, ou les
     valeurs d'origine au premier rendu. */
  const values = state.values;
  const errors = state.errors;
  const failed = Object.keys(errors).length > 0 || Boolean(state.message);

  return (
    <form action={submit} className="flex max-w-160 flex-col gap-6" noValidate>
      {/* Une soumission refusée doit s'entendre, et pas seulement se voir. */}
      {failed ? (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-lg border border-content-danger-base bg-surface-danger-lightest px-4 py-3 text-sm text-content-danger-dark"
        >
          <p className="font-semibold">
            {state.message ?? "La saisie n'a pas pu être enregistrée."}
          </p>
          {Object.keys(errors).length > 0 ? (
            <ul className="flex list-disc flex-col gap-1 pl-5">
              {Object.entries(errors).map(([field, message]) => (
                <li key={field}>{message}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <FormField
        label="Nom du produit"
        htmlFor={id("name")}
        error={errors.name}
        errorId={errorId("name")}
      >
        <input
          id={id("name")}
          name="name"
          type="text"
          defaultValue={values.name}
          autoComplete="off"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? errorId("name") : undefined}
          className={`${CONTROL} ${borderOf(errors.name)}`}
        />
      </FormField>

      <FormField
        label="Entité de rattachement"
        htmlFor={id("entityId")}
        error={errors.entityId}
        errorId={errorId("entityId")}
        note="Un produit peut changer d'entité par la suite."
      >
        <select
          id={id("entityId")}
          name="entityId"
          defaultValue={values.entityId}
          aria-invalid={errors.entityId ? true : undefined}
          aria-describedby={errors.entityId ? errorId("entityId") : undefined}
          className={`${CONTROL} ${borderOf(errors.entityId)}`}
        >
          <option value="">Choisir une entité</option>
          {entities.map((entity) => (
            <option key={entity.id} value={entity.id}>
              {entity.label}
            </option>
          ))}
        </select>
      </FormField>

      {/* Deux valeurs fermées se lisent mieux dépliées qu'en liste : le choix
          se fait sur ce que chacune veut dire, pas sur son seul libellé. */}
      <fieldset className="flex flex-col gap-3">
        <legend className="text-2xs font-semibold text-content-neutral-dark uppercase">
          Type
        </legend>
        {Object.entries(PRODUCT_KIND_LABEL).map(([kind, label]) => (
          <label
            key={kind}
            htmlFor={id(`kind-${kind}`)}
            className="flex items-start gap-3 rounded-lg border border-content-neutral-normal bg-surface-neutral-pale px-4 py-3"
          >
            <input
              id={id(`kind-${kind}`)}
              name="kind"
              type="radio"
              value={kind}
              defaultChecked={values.kind === kind}
              className="mt-1 accent-surface-primary-base"
            />
            <span className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-content-neutral-darkest">
                {label}
              </span>
              <span className="text-xs text-content-neutral-dark">
                {KIND_HINT[kind as keyof typeof KIND_HINT]}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      <FormField
        label="Description"
        htmlFor={id("description")}
        error={errors.description}
        errorId={errorId("description")}
        note="Facultative. Une phrase qui dit ce qu'est ce produit."
      >
        <textarea
          id={id("description")}
          name="description"
          rows={3}
          defaultValue={values.description}
          className={`${CONTROL} ${borderOf(errors.description)}`}
        />
      </FormField>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-surface-primary-base px-4 py-2 text-sm font-semibold text-content-neutral-pale disabled:opacity-60"
        >
          {pending ? "Enregistrement…" : submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="text-sm font-semibold text-content-primary-dark underline"
        >
          Annuler
        </Link>
      </div>
    </form>
  );
}

/**
 * Le filet du champ : rouge en erreur, gris sinon.
 *
 * Le design system n'a pas de jeton `border-danger-*` — comme il n'a pas de
 * jeton de bordure de contrôle, point ouvert depuis T2.3. Un jeton de contenu
 * est donc employé comme bordure, ici comme là-bas : `content-danger-base`,
 * mesuré à 5,19:1 sur le fond du champ. **Le message d'erreur ne dépend jamais
 * de cette couleur** — il est écrit sous le champ, et repris dans le bandeau.
 */
function borderOf(error: string | undefined): string {
  return error ? "border-content-danger-base" : "border-content-neutral-normal";
}

/**
 * Un champ, son intitulé, sa note et son message.
 *
 * L'intitulé est un `<label for>` — jamais un `placeholder` en guise de nom :
 * il disparaîtrait à la première frappe, et l'assistance ne le lit pas.
 */
function FormField({
  label,
  htmlFor,
  note,
  error,
  errorId,
  children,
}: {
  label: string;
  htmlFor: string;
  note?: string;
  error?: string | undefined;
  errorId: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-2xs font-semibold text-content-neutral-dark uppercase"
      >
        {label}
      </label>
      {note ? (
        <p className="text-xs text-content-neutral-base">{note}</p>
      ) : null}
      {children}
      {error ? (
        <p id={errorId} className="text-xs font-semibold text-content-danger-dark">
          {error}
        </p>
      ) : null}
    </div>
  );
}
