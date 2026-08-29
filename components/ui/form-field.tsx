/**
 * Le champ de saisie, le bandeau de refus, et les classes d'un contrôle.
 *
 * **Un seul exemplaire, après huit.** Le même composant a été recopié dans
 * `project-form.tsx` (T2.5), `activity-panel.tsx` (T3.3), `resource-panel.tsx`
 * (T4.2), `result-panel.tsx` (T4.4), `indicator-panel.tsx` (T5.2),
 * `reading-panel.tsx` (T5.3), `adoption-panel.tsx` (T5.4) et
 * `product-form.tsx` — chaque ticket ajoutant le sien parce qu'aucun des
 * précédents ne l'exportait et qu'aucun n'était à son périmètre. Le journal
 * reportait l'extraction « au ticket qui pourra ouvrir les fichiers ensemble » ;
 * c'est TD.1, et il les ouvre tous les huit.
 *
 * Ne pas confondre avec `components/ui/field.tsx` : celui-là porte le couple
 * `<dt>`/`<dd>` de l'en-tête d'identité, qui **affiche** une valeur. Celui-ci en
 * **saisit** une.
 *
 * L'intitulé est un `<label for>` — jamais un `placeholder` en guise de nom : il
 * disparaîtrait à la première frappe, et l'assistance ne le lit pas.
 */

import type { ReactNode } from "react";

/**
 * Le filet des contrôles, plus sombre que celui des blocs.
 *
 * La raison est mesurée depuis T2.3 : la bordure d'un champ est la limite d'un
 * composant d'interface, le WCAG 1.4.11 y exige 3:1, et **aucun jeton `border-*`
 * du design system ne l'atteint** sur ce fond — le plus sombre plafonne à
 * 1,2:1. `content-neutral-normal` y arrive à 3,88:1, mesuré sur
 * `surface-neutral-pale`. C'est un jeton de contenu employé comme bordure : la
 * règle 2 est tenue, la sémantique du design system l'est moins, et il lui
 * manque un jeton de bordure de contrôle.
 *
 * **Aucun substitut de plus n'est inventé** — la règle posée en T2.3, jamais
 * enfreinte depuis, et que ce fichier rend désormais structurelle : il n'y a
 * plus qu'un endroit où l'enfreindre.
 */
export const CONTROL =
  "w-full rounded-lg border bg-surface-neutral-pale px-3 py-2 text-sm text-content-neutral-darkest";

/**
 * Le même contrôle, quand il porte un texte d'invite.
 *
 * Les deux formulaires pleine page en ont besoin, les six panneaux non. La
 * classe est **ajoutée en suffixe** plutôt qu'écrite à part : l'attribut servi
 * reste au caractère près celui que T2.5 avait posé.
 */
export const CONTROL_TEXT = `${CONTROL} placeholder:text-content-neutral-base`;

/** Rouge en erreur, gris sinon. Le message, lui, ne dépend jamais de la couleur. */
export function borderOf(error: string | undefined): string {
  return error ? "border-content-danger-base" : "border-content-neutral-normal";
}

/**
 * Le bandeau d'une soumission refusée.
 *
 * Une soumission refusée doit s'**entendre**, et pas seulement se voir : d'où le
 * `role="alert"`. Vision ne jette jamais en silence ce qui a été tapé — les
 * valeurs sont réaffichées telles quelles par l'appelant, ce bandeau ne dit que
 * pourquoi.
 *
 * Il rend `null` quand il n'y a ni message ni erreur : la condition qui vivait
 * dans un `failed` chez les huit appelants vit ici, une fois.
 */
export function FormAlert({
  message,
  errors,
}: {
  message?: string | undefined;
  errors: Readonly<Record<string, string | undefined>>;
}) {
  const listed = Object.entries(errors);
  if (listed.length === 0 && !message) return null;

  return (
    <div
      role="alert"
      className="flex flex-col gap-2 rounded-lg border border-content-danger-base bg-surface-danger-lightest px-4 py-3 text-sm text-content-danger-dark"
    >
      <p className="font-semibold">
        {message ?? "La saisie n'a pas pu être enregistrée."}
      </p>
      {listed.length > 0 ? (
        <ul className="flex list-disc flex-col gap-1 pl-5">
          {listed.map(([field, text]) => (
            <li key={field}>{text}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Un champ : son intitulé, sa note, son contrôle, son message.
 *
 * `required` n'était passé que par les panneaux, et la phrase qui vivait ici
 * — « jamais par les deux formulaires pleine page » — a cessé d'être vraie le
 * 29/08/2026 : la reprise d'ergonomie du formulaire de projet le passe sur ses
 * trois champs obligatoires, qui ne le disaient nulle part. `product-form.tsx`
 * ne l'a pas suivi ; l'écart est ouvert dans `ETAT.md`, il n'est pas assumé.
 */
export function FormField({
  label,
  htmlFor,
  note,
  error,
  errorId,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  note?: string;
  error?: string | undefined;
  errorId: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={
        className ? `flex flex-col gap-1.5 ${className}` : "flex flex-col gap-1.5"
      }
    >
      <label
        htmlFor={htmlFor}
        className="text-2xs font-semibold text-content-neutral-dark uppercase"
      >
        {label}
        {/* « obligatoire » est écrit, pas seulement marqué d'une étoile : un
            symbole coloré ne porte jamais seul une information. */}
        {required ? (
          <span className="font-normal text-content-neutral-base">
            {" (obligatoire)"}
          </span>
        ) : null}
      </label>
      {note ? <p className="text-xs text-content-neutral-base">{note}</p> : null}
      {children}
      {error ? (
        <p
          id={errorId}
          className="text-xs font-semibold text-content-danger-dark"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
