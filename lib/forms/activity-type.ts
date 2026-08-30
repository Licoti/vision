/**
 * La saisie d'un **type d'activité** : lecture du formulaire, et validation
 * (T7.4).
 *
 * **Ni base, ni Next, ni React.** Jumeau de `lib/forms/project-status.ts`, et
 * pour la même raison : ce référentiel porte de la logique — une `family` qui
 * regroupe, un `produces_result` qui conditionne la saisie d'un résultat (T4.4),
 * un `default_tool_id` qui nommera le lien sortant.
 *
 * **Trois champs et trois natures de contrôle**, ce qui est précisément ce qui
 * l'a sorti du panneau commun : un énuméré rétréci, une case à cocher, un
 * identifiant facultatif.
 *
 * **`default_tool_id` n'est pas confronté au domaine ici**, et ce n'est pas un
 * oubli : `assertPreconditions` (`lib/db/scoped.ts`) le fait à l'écriture, à
 * partir de la configuration des clés étrangères. Revérifier ici poserait une
 * seconde autorité, qui divergerait un jour de la première — la règle que
 * `lib/forms/product.ts` tient depuis T2.5. Ce module ne vérifie que la
 * **forme** de l'identifiant, et pour la raison exposée dans `lib/uuid.ts` :
 * une colonne `uuid` interrogée avec n'importe quoi rend un 500.
 */

import { activityFamily } from "@/lib/db/schema";
import {
  referentialField,
  toPositionValue,
  validatePosition,
} from "@/lib/forms/referential";
import { isUuid } from "@/lib/uuid";

/** Les six familles de `docs/03` §2. Dérivé du schéma, jamais réécrit. */
export type ActivityFamilyValue = (typeof activityFamily.enumValues)[number];

/** L'ordre du `<select>` est celui de l'énuméré : il suit le cours du travail. */
export const ACTIVITY_FAMILIES: readonly ActivityFamilyValue[] =
  activityFamily.enumValues;

/** Ce que la personne a saisi, tel quel — des chaînes, jamais un objet métier. */
export type ActivityTypeFormValues = {
  label: string;
  position: string;
  family: string;
  /** Une case : cochée ou non, jamais une chaîne à interpréter. */
  producesResult: boolean;
  /** Vide quand aucun outil n'est choisi — la colonne est nullable. */
  defaultToolId: string;
};

export type ActivityTypeFormErrors = Partial<
  Record<keyof ActivityTypeFormValues, string>
>;

export type ActivityTypeFormState = {
  values: ActivityTypeFormValues;
  errors: ActivityTypeFormErrors;
  message?: string;
  ok?: boolean;
};

export const EMPTY_ACTIVITY_TYPE_VALUES: ActivityTypeFormValues = {
  label: "",
  position: "0",
  family: "framing",
  producesResult: false,
  defaultToolId: "",
};

export function toActivityTypeFormValues(row: {
  label: string;
  position: string;
  family: ActivityFamilyValue;
  producesResult: boolean;
  defaultToolId: string | null;
}): ActivityTypeFormValues {
  return {
    label: row.label,
    position: row.position,
    family: row.family,
    producesResult: row.producesResult,
    defaultToolId: row.defaultToolId ?? "",
  };
}

/**
 * Les cinq champs de ce formulaire, et pas un de plus.
 *
 * Une case non cochée **n'est pas envoyée** par le navigateur : son absence vaut
 * « faux », et c'est la lecture qu'`activity.ts` fait déjà d'`isUnscheduled`.
 */
export function readActivityTypeForm(
  formData: FormData,
): ActivityTypeFormValues {
  return {
    label: referentialField(formData, "label"),
    position: referentialField(formData, "position"),
    family: referentialField(formData, "family"),
    producesResult: formData.get("producesResult") !== null,
    defaultToolId: referentialField(formData, "defaultToolId"),
  };
}

export function isActivityFamily(value: string): value is ActivityFamilyValue {
  return (activityFamily.enumValues as readonly string[]).includes(value);
}

export function validateActivityTypeForm(
  values: ActivityTypeFormValues,
): ActivityTypeFormErrors {
  const errors: ActivityTypeFormErrors = {};

  if (!values.label) {
    errors.label = "Le libellé est obligatoire.";
  }

  const position = validatePosition(values.position);
  if (position) errors.position = position;

  if (!isActivityFamily(values.family)) {
    errors.family = "Cette famille d'activité n'existe pas.";
  }

  // Facultatif : un type d'activité n'a pas forcément d'outil habituel.
  if (values.defaultToolId && !isUuid(values.defaultToolId)) {
    errors.defaultToolId = "Cet outil n'est pas reconnu.";
  }

  return errors;
}

/* ==========================================================================
   De la saisie à la ligne
   ========================================================================== */

/**
 * Les colonnes que ce formulaire écrit, et pas une de plus.
 *
 * `defaultToolId` est **`null` quand rien n'est choisi**, jamais `""` : la
 * colonne est un `uuid` nullable, et une chaîne vide y rendrait un 500.
 */
export type ActivityTypeInput = {
  label: string;
  position: string;
  family: ActivityFamilyValue;
  producesResult: boolean;
  defaultToolId: string | null;
};

export function parseActivityTypeForm(formData: FormData): {
  values: ActivityTypeFormValues;
  errors: ActivityTypeFormErrors;
  input: ActivityTypeInput | null;
} {
  const values = readActivityTypeForm(formData);
  const errors = validateActivityTypeForm(values);

  if (Object.keys(errors).length > 0 || !isActivityFamily(values.family)) {
    return { values, errors, input: null };
  }

  return {
    values,
    errors,
    input: {
      label: values.label,
      position: toPositionValue(values.position),
      family: values.family,
      producesResult: values.producesResult,
      defaultToolId: values.defaultToolId || null,
    },
  };
}
