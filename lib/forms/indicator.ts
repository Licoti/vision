/**
 * La saisie d'un indicateur : lecture du formulaire, et validation.
 *
 * **Ni base, ni Next, ni React**, comme les cinq modules qui le précèdent dans
 * ce dossier. C'est ce qui rend la règle énonçable et vérifiable seule, sans
 * branche Neon ni fixture.
 *
 * Ce module ne valide **que la forme** : un libellé non vide, un sens de lecture
 * qui appartient à son énuméré. Il ne dit rien du produit qui porte
 * l'indicateur, ni du droit d'y écrire : ces questions appartiennent au domaine,
 * donc à l'action et à `lib/db/scoped.ts`. Revérifier ici poserait une seconde
 * autorité, qui divergerait un jour de la première.
 *
 * **Cinq champs depuis le 17/08/2026** : libellé, unité, sens de lecture,
 * source, et la **cible du produit**. `product_id` ne se lit pas ici — il est
 * lié côté serveur ; `archived_at` non plus — il ne se pose que par `archive()` ;
 * `is_north_star` non plus — la désignation est un **geste à part**, pas un
 * champ de formulaire : elle doit éteindre la North Star précédente dans le même
 * mouvement, ce qu'une case à cocher au milieu d'un formulaire ne dirait pas.
 *
 * **La cible saisie ici est celle du produit**, l'objectif global — jamais celle
 * d'une adoption, qui vit sur `project_indicators` et se saisit dans le panneau
 * d'adoption de la page projet (`lib/forms/adoption.ts`). Deux cibles, deux
 * formulaires, deux sens.
 *
 * **L'unité est un texte libre, et c'est le schéma qui le dit** :
 * `indicators.unit` est un `text` nullable, il n'existe aucun référentiel
 * d'unités, et en inventer un serait l'écran de gestion des référentiels que la
 * fiche interdit (D25, C7). La règle est celle de `results.unit` depuis T4.4.
 *
 * **Le sens de lecture n'est pas un jugement**, et rien ici n'en tire un : il dit
 * dans quel sens la série d'une courbe se lit (T5.6), jamais si un chiffre est
 * bon — D39 interdit tout indice calculé par Vision pour qualifier un produit.
 */

import { indicatorDirection } from "@/lib/db/schema";
import { valueOrNull } from "@/lib/forms/project";
import {
  decimalAsTyped,
  isDecimal,
  normalizeDecimal,
} from "@/lib/forms/result";

/**
 * `higher_is_better` · `lower_is_better`. Dérivé du schéma, jamais réécrit à la
 * main — la règle de `ResourceTypeValue`.
 *
 * Jumeau assumé d'`IndicatorDirection` (`lib/queries/indicators.ts`), comme
 * `ResourceTypeValue` l'est de `ResourceType` : ce dossier ne dépend pas de
 * `lib/queries`, qui traîne un `ScopedDb` dont un module de formulaire n'a que
 * faire. Les deux dérivent du **même** énuméré : elles ne peuvent pas diverger.
 */
export type IndicatorDirectionValue =
  (typeof indicatorDirection.enumValues)[number];

/**
 * Les deux valeurs de l'énuméré, dans l'ordre du schéma — celui que le `select`
 * du panneau propose. Les libellés, eux, vivent dans `lib/format.ts` depuis
 * T5.1 : un seul endroit les nomme.
 */
export const INDICATOR_DIRECTION_VALUES: readonly IndicatorDirectionValue[] =
  indicatorDirection.enumValues;

export function isIndicatorDirection(
  value: string,
): value is IndicatorDirectionValue {
  return (indicatorDirection.enumValues as readonly string[]).includes(value);
}

/* ==========================================================================
   Ce que la personne a saisi
   ========================================================================== */

/** Quatre chaînes, jamais un objet métier. */
export type IndicatorFormValues = {
  /** « Autonomie des utilisateurs ». Obligatoire — `not null`. */
  label: string;
  /** « % », « s », « /100 ». Texte libre : aucun référentiel d'unités. */
  unit: string;
  /** Obligatoire — `not null`, et sans valeur par défaut dans le schéma. */
  direction: string;
  /** « Portail analytics ». Facultative — la colonne est nullable. */
  source: string;
  /**
   * La cible du produit — « 85 ». Facultative : un indicateur peut n'en porter
   * aucune, et c'est un état normal.
   */
  targetValue: string;
};

export type IndicatorFormErrors = Partial<
  Record<keyof IndicatorFormValues, string>
>;

/**
 * L'état que `useActionState` fait circuler entre le panneau et l'action.
 * Il porte les valeurs autant que les erreurs : une saisie refusée revient dans
 * le panneau avec ce qui a été tapé, jamais vidée.
 */
export type IndicatorFormState = {
  values: IndicatorFormValues;
  errors: IndicatorFormErrors;
  /** Un empêchement qui n'appartient à aucun champ : un droit, une ligne rangée. */
  message?: string;
};

export const EMPTY_INDICATOR_VALUES: IndicatorFormValues = {
  label: "",
  unit: "",
  direction: "",
  source: "",
  targetValue: "",
};

/**
 * La ligne déjà enregistrée, ramenée aux quatre chaînes du formulaire — le
 * pré-remplissage du panneau en correction.
 *
 * Jumeau de `toResourceFormValues` (T4bis.5) et de `toResultFormValues`
 * (T4bis.6), et pour la même raison : le panneau reçoit des **valeurs de
 * formulaire**, jamais une ligne de base. C'est ce qui laisse un refus les
 * remplacer sans que rien ne change de forme entre les deux chemins.
 *
 * `null` devient `""` : le formulaire ne connaît que des chaînes, et l'absence
 * s'y écrit vide.
 */
export function toIndicatorFormValues(row: {
  label: string;
  unit: string | null;
  direction: IndicatorDirectionValue;
  source: string | null;
  targetValue: string | null;
}): IndicatorFormValues {
  return {
    label: row.label,
    unit: row.unit ?? "",
    direction: row.direction,
    source: row.source ?? "",
    /* La colonne rend « 85.0000 » ; `decimalAsTyped` rend « 85 », c'est-à-dire
       ce que la personne avait tapé. La règle de `toAdoptionFormValues`. */
    targetValue:
      row.targetValue === null ? "" : decimalAsTyped(row.targetValue),
  };
}

/** Le champ, lu et rogné. Absent ou d'un type inattendu, il vaut « vide ». */
function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Les champs du ticket, et eux seuls.
 *
 * L'action ne construit jamais sa ligne par étalement d'un `FormData` : un champ
 * caché ajouté par n'importe qui deviendrait une colonne écrite. `productId` ne
 * se lit pas ici — il est lié côté serveur.
 */
export function readIndicatorForm(formData: FormData): IndicatorFormValues {
  return {
    label: field(formData, "label"),
    unit: field(formData, "unit"),
    direction: field(formData, "direction"),
    source: field(formData, "source"),
    targetValue: field(formData, "targetValue"),
  };
}

/* ==========================================================================
   La validation
   ========================================================================== */

export function validateIndicatorForm(
  values: IndicatorFormValues,
): IndicatorFormErrors {
  const errors: IndicatorFormErrors = {};

  if (!values.label) {
    errors.label = "Le libellé de l'indicateur est obligatoire.";
  }

  /* La liste est fermée, et le second contrôle n'est pas décoratif : le `select`
     ne propose que les deux valeurs de l'énuméré, mais une soumission forgée
     porte ce qu'elle veut, et une valeur hors énuméré rendrait une erreur
     PostgreSQL — un 500 — là où l'on attend un message de champ. */
  if (!values.direction) {
    errors.direction = "Le sens de lecture est obligatoire.";
  } else if (!isIndicatorDirection(values.direction)) {
    errors.direction = "Ce sens de lecture n'existe pas.";
  }

  // `unit` et `source` ne sont pas validées : deux textes libres, nullables en
  // base. Leur imposer une forme serait inventer un référentiel (D25, C7).

  /* La cible est facultative — la colonne est nullable —, mais saisie, elle doit
     être un nombre : le patron de `results.value` et des trois valeurs de
     l'adoption. Elle n'est comparée à rien ici : la comparaison au dernier
     relevé appartient à `targetGap`, et elle est arbitrée à part. */
  if (values.targetValue && !isDecimal(values.targetValue)) {
    errors.targetValue = "La cible doit être un nombre.";
  }

  return errors;
}

/* ==========================================================================
   De la saisie aux lignes
   ========================================================================== */

/**
 * Les colonnes d'`indicators` que ce formulaire écrit, et pas une de plus.
 *
 * `productId` n'y figure pas : il est lié côté serveur par l'action, jamais
 * transmis par un champ.
 */
export type IndicatorRowInput = {
  label: string;
  /** `null` quand rien n'est saisi : un indicateur peut n'avoir aucune unité. */
  unit: string | null;
  direction: IndicatorDirectionValue;
  /** `null` quand rien n'est saisi : la colonne est nullable. */
  source: string | null;
  /** `null` quand rien n'est saisi : un indicateur peut n'avoir aucune cible. */
  targetValue: string | null;
};

/**
 * Lit le formulaire, le valide, et rend la ligne prête à écrire.
 *
 * `input` est non nul **si et seulement si** `errors` est vide : la propriété
 * posée en T2.5, qui évite d'affirmer par un `as` un type que la validation
 * venait de prouver. Un `as` tiendrait aujourd'hui et mentirait le jour où une
 * troisième valeur entrerait dans l'énuméré.
 *
 * Le sens de lecture est donc **renarrowé** ici plutôt qu'affirmé — la forme
 * exacte de `parseResourceForm`. Le rattrapage qui suit est inatteignable,
 * `validateIndicatorForm` ayant déjà posé l'erreur, et il coûte deux lignes :
 * c'est ce qui garantit la propriété ci-dessus **par construction**, plutôt que
 * par la lecture croisée de deux fonctions.
 */
export function parseIndicatorForm(formData: FormData): {
  values: IndicatorFormValues;
  errors: IndicatorFormErrors;
  input: IndicatorRowInput | null;
} {
  const values = readIndicatorForm(formData);
  const errors = validateIndicatorForm(values);

  const direction = isIndicatorDirection(values.direction)
    ? values.direction
    : null;
  if (!direction && !errors.direction) {
    errors.direction = "Ce sens de lecture n'existe pas.";
  }

  if (!direction || Object.keys(errors).length > 0) {
    return { values, errors, input: null };
  }

  return {
    values,
    errors,
    input: {
      label: values.label,
      unit: valueOrNull(values.unit),
      direction,
      source: valueOrNull(values.source),
      targetValue: decimalOrNull(values.targetValue),
    },
  };
}

/** Point décimal pour la colonne, ou `null` quand le champ est vide. */
function decimalOrNull(value: string): string | null {
  const kept = valueOrNull(value);
  return kept === null ? null : normalizeDecimal(kept);
}
