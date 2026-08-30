/**
 * La saisie d'un **statut de projet** : lecture du formulaire, et validation
 * (T7.4).
 *
 * **Ni base, ni Next, ni React**, comme les dix-sept modules voisins de ce
 * dossier. C'est ce qui rend la règle énonçable et vérifiable seule, sans
 * branche Neon ni fixture.
 *
 * **Un module à lui, et non un drapeau de plus sur `referential.ts`.** Un statut
 * porte une `nature`, et c'est exactement ce qui le sépare des quatre
 * référentiels simples : `docs/04` §1 dit *les libellés changent, la logique
 * non*, et la logique est ici. Étendre `ReferentialShape` d'un drapeau par champ
 * aurait fait du panneau commun une forme qu'on ne peut plus relire dans aucun
 * de ses états — la « phrase à trous » que le dépôt refuse depuis T5.1.
 *
 * **Ce qui est vraiment commun est réemployé, pas recopié** :
 * `referentialField`, `validatePosition`, `toPositionValue` viennent de
 * `lib/forms/referential.ts`, et l'unicité du libellé se tranche dans l'action,
 * qui seule peut lire la base.
 *
 * **La nature ne se renomme pas, elle se choisit.** Elle est rétrécie ici sur
 * l'énuméré du schéma, et **D42 tient par construction** : `archived` n'est pas
 * dans l'énuméré, l'archivage étant porté exclusivement par `archived_at`. Une
 * valeur forgée — un `<select>` réécrit, un `FormData` reposté — est refusée sur
 * le champ, jamais écrite.
 */

import { projectStatusNature } from "@/lib/db/schema";
import {
  referentialField,
  toPositionValue,
  validatePosition,
} from "@/lib/forms/referential";

/** `framing` · `active` · `paused` · `done`. Dérivé du schéma, jamais réécrit. */
export type ProjectStatusNatureValue =
  (typeof projectStatusNature.enumValues)[number];

/** L'ordre du `<select>` est celui de l'énuméré : un cycle de vie se lit. */
export const PROJECT_STATUS_NATURES: readonly ProjectStatusNatureValue[] =
  projectStatusNature.enumValues;

/** Ce que la personne a saisi, tel quel — des chaînes, jamais un objet métier. */
export type ProjectStatusFormValues = {
  /** « En cours ». Obligatoire — `not null`. */
  label: string;
  /** L'ordre d'affichage, en toutes lettres. */
  position: string;
  /** La valeur d'énuméré, non traduite. */
  nature: string;
};

export type ProjectStatusFormErrors = Partial<
  Record<keyof ProjectStatusFormValues, string>
>;

/**
 * L'état que `useActionState` fait circuler entre le panneau et l'action.
 * Il porte les valeurs autant que les erreurs : une saisie refusée revient dans
 * le panneau avec ce qui a été tapé, jamais vidée.
 */
export type ProjectStatusFormState = {
  values: ProjectStatusFormValues;
  errors: ProjectStatusFormErrors;
  /** Un empêchement qui n'appartient à aucun champ : un droit, une ligne rangée. */
  message?: string;
  /** L'écriture a eu lieu : le panneau se referme (TD.2). */
  ok?: boolean;
};

export const EMPTY_PROJECT_STATUS_VALUES: ProjectStatusFormValues = {
  label: "",
  position: "0",
  nature: "framing",
};

/** La ligne enregistrée, ramenée aux chaînes du formulaire.
 *
 *  `position` revient de la base en `numeric` — donc en chaîne, « 30.00 » — et
 *  elle est rendue telle quelle : la reformater ferait dire au champ autre chose
 *  que ce qui est écrit en base. */
export function toProjectStatusFormValues(row: {
  label: string;
  position: string;
  nature: ProjectStatusNatureValue;
}): ProjectStatusFormValues {
  return { label: row.label, position: row.position, nature: row.nature };
}

/**
 * Les trois champs de ce formulaire, et pas un de plus.
 *
 * L'action ne construit jamais sa ligne par étalement d'un `FormData` : un champ
 * caché ajouté par n'importe qui deviendrait une colonne écrite — et
 * `archived_at` est précisément la colonne qu'un tel champ atteindrait.
 */
export function readProjectStatusForm(
  formData: FormData,
): ProjectStatusFormValues {
  return {
    label: referentialField(formData, "label"),
    position: referentialField(formData, "position"),
    nature: referentialField(formData, "nature"),
  };
}

export function isProjectStatusNature(
  value: string,
): value is ProjectStatusNatureValue {
  return (projectStatusNature.enumValues as readonly string[]).includes(value);
}

export function validateProjectStatusForm(
  values: ProjectStatusFormValues,
): ProjectStatusFormErrors {
  const errors: ProjectStatusFormErrors = {};

  if (!values.label) {
    errors.label = "Le libellé est obligatoire.";
  }

  const position = validatePosition(values.position);
  if (position) errors.position = position;

  if (!isProjectStatusNature(values.nature)) {
    errors.nature = "Cette nature de statut n'existe pas.";
  }

  return errors;
}

/* ==========================================================================
   De la saisie à la ligne
   ========================================================================== */

/** Les colonnes que ce formulaire écrit, et pas une de plus. */
export type ProjectStatusInput = {
  label: string;
  position: string;
  nature: ProjectStatusNatureValue;
};

/**
 * Lit le formulaire, le valide, et rend la ligne prête à écrire.
 *
 * `input` est non nul **si et seulement si** `errors` est vide : la propriété
 * posée en T2.5 et tenue par les dix-sept modules de ce dossier. Le second
 * membre du `if` n'est pas une ceinture — c'est lui qui **prouve** au
 * compilateur le type de `nature`, là où un `as` tiendrait aujourd'hui et
 * mentirait le jour où l'énuméré changerait.
 */
export function parseProjectStatusForm(formData: FormData): {
  values: ProjectStatusFormValues;
  errors: ProjectStatusFormErrors;
  input: ProjectStatusInput | null;
} {
  const values = readProjectStatusForm(formData);
  const errors = validateProjectStatusForm(values);

  if (Object.keys(errors).length > 0 || !isProjectStatusNature(values.nature)) {
    return { values, errors, input: null };
  }

  return {
    values,
    errors,
    input: {
      label: values.label,
      position: toPositionValue(values.position),
      nature: values.nature,
    },
  };
}
