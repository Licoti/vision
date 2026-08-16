/**
 * La saisie d'un relevé : lecture du formulaire, et validation.
 *
 * **Ni base, ni Next, ni React**, comme les six modules qui le précèdent dans ce
 * dossier. C'est ce qui rend la règle énonçable et vérifiable seule, sans branche
 * Neon ni fixture.
 *
 * Ce module ne valide **que la forme** : une valeur qui est un nombre, une date
 * qui existe. Il ne dit rien de l'indicateur qui porte le relevé, ni du produit,
 * ni du droit d'y écrire : ces questions appartiennent au domaine, donc à
 * l'action et à `lib/db/scoped.ts`. Revérifier ici poserait une seconde autorité,
 * qui divergerait un jour de la première.
 *
 * **Trois champs, et pas un de plus** (fiche T5.3) : la valeur, la date de
 * relevé, la note de source. `indicator_id` ne se lit pas ici — il est lié côté
 * serveur ; `archived_at` non plus — il ne se pose que par `archive()`.
 *
 * **Ce qui est obligatoire l'est parce que la colonne l'est.** `value` et
 * `read_on` sont `not null`, `source_note` ne l'est pas — et c'est une
 * différence avec le résultat, dont la valeur est facultative : « un audit peut
 * porter un constat sans chiffre », un relevé sans chiffre n'est rien. Pour la
 * date, `docs/04` §3 l'écrit en toutes lettres : « un relevé sans date n'est pas
 * persisté : il serait inaffichable sur la frise produit ».
 *
 * **Aucune valeur par défaut pour la date** — ni aujourd'hui, ni le mois
 * courant. Un relevé se **rapporte**, il ne se date pas au moment de la saisie :
 * dater d'office la mesure du jour où on la tape ferait mentir la frise de T5.6
 * sur la seule chose qu'elle sait faire, poser une valeur dans le temps.
 *
 * **Le contrôle décimal n'est pas réécrit ici** : `isDecimal` et
 * `decimalAsTyped` vivent dans `lib/forms/result.ts` et y sont éprouvés.
 * `indicator_readings.value` est le **même** `numeric(18,4)` que `results.value`,
 * et deux copies d'une règle de validation divergent un jour. L'import croisé
 * est la règle du dossier : `result.ts` lit déjà `isWebUrl` de `resource.ts` et
 * `isIsoDay` de `project.ts`.
 */

import { isIsoDay, valueOrNull } from "@/lib/forms/project";
import {
  decimalAsTyped,
  isDecimal,
  normalizeDecimal,
} from "@/lib/forms/result";

/* ==========================================================================
   Ce que la personne a saisi
   ========================================================================== */

/** Trois chaînes, jamais un objet métier. */
export type ReadingFormValues = {
  /** Le chiffre relevé. Obligatoire — `not null`, à la différence du résultat. */
  value: string;
  /** La date du relevé, `YYYY-MM-DD`. Obligatoire — `not null` (`docs/04` §3). */
  readOn: string;
  /** « Relevé trimestriel »… Facultative — la colonne est nullable. */
  sourceNote: string;
};

export type ReadingFormErrors = Partial<Record<keyof ReadingFormValues, string>>;

/**
 * L'état que `useActionState` fait circuler entre le panneau et l'action.
 * Il porte les valeurs autant que les erreurs : une saisie refusée revient dans
 * le panneau avec ce qui a été tapé, jamais vidée.
 */
export type ReadingFormState = {
  values: ReadingFormValues;
  errors: ReadingFormErrors;
  /** Un empêchement qui n'appartient à aucun champ : un droit, une ligne rangée. */
  message?: string;
};

export const EMPTY_READING_VALUES: ReadingFormValues = {
  value: "",
  readOn: "",
  sourceNote: "",
};

/**
 * La ligne déjà enregistrée, ramenée aux trois chaînes du formulaire — le
 * pré-remplissage du panneau en correction.
 *
 * Jumeau de `toResultFormValues` (T4bis.6) et de `toIndicatorFormValues`
 * (T5.2) : le panneau reçoit des **valeurs de formulaire**, jamais une ligne de
 * base. C'est ce qui laisse un refus les remplacer sans que rien ne change de
 * forme entre les deux chemins.
 *
 * La valeur passe par `decimalAsTyped` : la colonne rend « 71.0000 », et le
 * poser tel quel dans le champ serait une invitation à retaper une valeur que
 * personne n'a écrite ainsi. `null` devient `""` : le formulaire ne connaît que
 * des chaînes, et l'absence s'y écrit vide.
 */
export function toReadingFormValues(row: {
  value: string;
  readOn: string;
  sourceNote: string | null;
}): ReadingFormValues {
  return {
    value: decimalAsTyped(row.value),
    readOn: row.readOn,
    sourceNote: row.sourceNote ?? "",
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
 * caché ajouté par n'importe qui deviendrait une colonne écrite. `indicatorId`
 * ne se lit pas ici — il est lié côté serveur.
 */
export function readReadingForm(formData: FormData): ReadingFormValues {
  return {
    value: field(formData, "value"),
    readOn: field(formData, "readOn"),
    sourceNote: field(formData, "sourceNote"),
  };
}

/* ==========================================================================
   La validation
   ========================================================================== */

export function validateReadingForm(
  values: ReadingFormValues,
): ReadingFormErrors {
  const errors: ReadingFormErrors = {};

  /* Obligatoire, à la différence de `results.value` : la colonne est `not null`,
     et un relevé sans chiffre ne relève rien. Le second contrôle n'est pas
     décoratif — la colonne est `numeric`, et une chaîne quelconque y produirait
     une erreur PostgreSQL, donc un 500, là où l'on attend un message de champ. */
  if (!values.value) {
    errors.value = "La valeur du relevé est obligatoire.";
  } else if (!isDecimal(values.value)) {
    errors.value =
      "La valeur doit être un nombre : 71, 68,5 — sans séparateur de milliers.";
  }

  /* `docs/04` §3 : « un relevé sans date n'est pas persisté : il serait
     inaffichable sur la frise produit ». La forme est vérifiée après la
     présence, faute de quoi un champ vide rendrait deux messages. */
  if (!values.readOn) {
    errors.readOn = "La date du relevé est obligatoire.";
  } else if (!isIsoDay(values.readOn)) {
    errors.readOn = "Cette date de relevé n'existe pas.";
  }

  // `sourceNote` n'est pas validée : un texte libre, nullable en base. Lui
  // imposer une forme serait inventer un référentiel (D25, C7).

  return errors;
}

/* ==========================================================================
   De la saisie aux lignes
   ========================================================================== */

/**
 * Les colonnes d'`indicator_readings` que ce formulaire écrit, et pas une de
 * plus.
 *
 * `indicatorId` n'y figure pas : il est lié côté serveur par l'action, jamais
 * transmis par un champ. `archivedAt` non plus — `update` le refuse, et la
 * couche ne le pose que par `archive`.
 */
export type ReadingRowInput = {
  value: string;
  readOn: string;
  /** `null` quand rien n'est saisi : la colonne est nullable. */
  sourceNote: string | null;
};

/**
 * Lit le formulaire, le valide, et rend la ligne prête à écrire.
 *
 * `input` est non nul **si et seulement si** `errors` est vide : la propriété
 * posée en T2.5, tenue depuis.
 *
 * La valeur part **normalisée** — point décimal, comme la colonne l'attend — et
 * non telle qu'elle a été tapée. Les valeurs rendues au panneau en cas de refus
 * restent, elles, celles de la personne : `values` et `input` ne servent pas le
 * même propos.
 */
export function parseReadingForm(formData: FormData): {
  values: ReadingFormValues;
  errors: ReadingFormErrors;
  input: ReadingRowInput | null;
} {
  const values = readReadingForm(formData);
  const errors = validateReadingForm(values);

  if (Object.keys(errors).length > 0) {
    return { values, errors, input: null };
  }

  return {
    values,
    errors,
    input: {
      value: normalizeDecimal(values.value),
      readOn: values.readOn,
      sourceNote: valueOrNull(values.sourceNote),
    },
  };
}
