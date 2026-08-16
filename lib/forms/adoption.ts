/**
 * L'adoption d'un indicateur par un accompagnement : lecture du formulaire, et
 * validation.
 *
 * **Ni base, ni Next, ni React**, comme les sept modules qui le précèdent dans
 * ce dossier. C'est ce qui rend la règle énonçable et vérifiable seule, sans
 * branche Neon ni fixture.
 *
 * Ce module ne valide **que la forme** : un identifiant qui a la forme d'un
 * identifiant, des valeurs qui sont des nombres. Il ne dit rien de l'indicateur
 * désigné — appartient-il au produit de cet accompagnement (D11) ? est-il
 * archivé ? cet accompagnement l'adopte-t-il déjà ? Ces questions appartiennent
 * au domaine, donc à l'action et à `lib/db/scoped.ts`. Revérifier ici poserait
 * une seconde autorité, qui divergerait un jour de la première.
 *
 * **Quatre champs, et pas un de plus** (fiche T5.4) : l'indicateur, la valeur de
 * référence, la cible, la valeur finale. `project_id` ne se lit pas ici — il est
 * lié côté serveur. **`note` non plus** : la colonne existe (`docs/04` §3), la
 * fiche ne l'ouvre pas, et une colonne écrite qu'aucun écran ne relit est une
 * colonne qu'on relit un jour sans savoir pourquoi (règle 3, leçon de T5.2).
 *
 * **Une seule obligation, et c'est le rattachement.** `project_indicators` ne
 * rend `not null` que ses deux clés étrangères : `baseline_value`,
 * `target_value` et `final_value` sont nullables, toutes les trois. Adopter un
 * indicateur sans fixer de cible est un geste normal — « le projet déclare la
 * cible visée » (`docs/02` §5) est ce qu'il *peut* déclarer, pas ce qu'il doit.
 * Une adoption nue dit déjà quelque chose : cet accompagnement regarde cet
 * indicateur.
 *
 * **Le contrôle décimal n'est pas réécrit ici** : `isDecimal`, `normalizeDecimal`
 * et `decimalAsTyped` vivent dans `lib/forms/result.ts` et y sont éprouvés. Les
 * trois colonnes sont le **même** `numeric(18,4)` que `results.value` et
 * `indicator_readings.value`, et trois copies d'une règle de validation
 * divergent le jour où l'une des précisions bouge. L'import croisé est la règle
 * du dossier, posée en T5.3 : ce qui se recopie ici, ce sont les libellés et les
 * messages ; ce qui s'importe, ce sont les règles.
 *
 * **Aucune des trois valeurs n'est comparée aux autres.** Ni « la cible doit
 * dépasser la référence », ni « la valeur finale doit être atteinte » : ce
 * serait juger un chiffre reporté, et `direction` n'est pas davantage un
 * arbitre — elle oriente la lecture d'une courbe, elle ne qualifie pas une
 * valeur (arbitrage (g), D39).
 */

import { isUuid } from "@/lib/uuid";

import { valueOrNull } from "@/lib/forms/project";
import {
  decimalAsTyped,
  isDecimal,
  normalizeDecimal,
} from "@/lib/forms/result";

/* ==========================================================================
   Ce que la personne a saisi
   ========================================================================== */

/** Quatre chaînes, jamais un objet métier. */
export type AdoptionFormValues = {
  /** L'indicateur adopté. Obligatoire — c'est le rattachement même. */
  indicatorId: string;
  /** La valeur au démarrage. Facultative — la colonne est nullable. */
  baselineValue: string;
  /** La cible visée. Facultative, et c'est un **repère**, jamais un état. */
  targetValue: string;
  /** La valeur constatée à la clôture, « si elle est connue » (`docs/02` §5). */
  finalValue: string;
};

export type AdoptionFormErrors = Partial<
  Record<keyof AdoptionFormValues, string>
>;

/**
 * L'état que `useActionState` fait circuler entre le panneau et l'action.
 * Il porte les valeurs autant que les erreurs : une saisie refusée revient dans
 * le panneau avec ce qui a été tapé, jamais vidée.
 */
export type AdoptionFormState = {
  values: AdoptionFormValues;
  errors: AdoptionFormErrors;
  /** Un empêchement qui n'appartient à aucun champ : un droit, une ligne rangée. */
  message?: string;
};

export const EMPTY_ADOPTION_VALUES: AdoptionFormValues = {
  indicatorId: "",
  baselineValue: "",
  targetValue: "",
  finalValue: "",
};

/**
 * L'adoption déjà enregistrée, ramenée aux quatre chaînes du formulaire — le
 * pré-remplissage du panneau en correction.
 *
 * Jumeau de `toResultFormValues` (T4bis.6), `toIndicatorFormValues` (T5.2) et
 * `toReadingFormValues` (T5.3) : le panneau reçoit des **valeurs de
 * formulaire**, jamais une ligne de base. C'est ce qui laisse un refus les
 * remplacer sans que rien ne change de forme entre les deux chemins.
 *
 * Les trois valeurs passent par `decimalAsTyped` : la colonne rend « 85.0000 »,
 * et le poser tel quel dans le champ serait une invitation à retaper une valeur
 * que personne n'a écrite ainsi. `null` devient `""` : le formulaire ne connaît
 * que des chaînes, et l'absence s'y écrit vide.
 *
 * La forme du paramètre est celle de `ProjectAdoption`
 * (`lib/queries/indicators.ts`), déjà lue pour l'écran : la correction n'ajoute
 * **aucune lecture en base**.
 */
export function toAdoptionFormValues(row: {
  indicatorId: string;
  baselineValue: string | null;
  targetValue: string | null;
  finalValue: string | null;
}): AdoptionFormValues {
  return {
    indicatorId: row.indicatorId,
    baselineValue: row.baselineValue === null ? "" : decimalAsTyped(row.baselineValue),
    targetValue: row.targetValue === null ? "" : decimalAsTyped(row.targetValue),
    finalValue: row.finalValue === null ? "" : decimalAsTyped(row.finalValue),
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
 * caché ajouté par n'importe qui deviendrait une colonne écrite. `projectId` ne
 * se lit pas ici — il est lié côté serveur.
 */
export function readAdoptionForm(formData: FormData): AdoptionFormValues {
  return {
    indicatorId: field(formData, "indicatorId"),
    baselineValue: field(formData, "baselineValue"),
    targetValue: field(formData, "targetValue"),
    finalValue: field(formData, "finalValue"),
  };
}

/* ==========================================================================
   La validation
   ========================================================================== */

/**
 * Le message d'une valeur qui n'est pas un nombre — **une phrase, trois
 * champs**. Les trois colonnes ont la même règle ; leur donner trois messages
 * différents laisserait croire à trois règles.
 */
const NOT_A_NUMBER =
  "La valeur doit être un nombre : 71, 68,5 — sans séparateur de milliers.";

export function validateAdoptionForm(
  values: AdoptionFormValues,
): AdoptionFormErrors {
  const errors: AdoptionFormErrors = {};

  /* La seule obligation du formulaire : sans indicateur, il n'y a pas
     d'adoption. La forme est vérifiée après la présence, faute de quoi un champ
     vide rendrait deux messages — et elle l'est parce que la colonne est un
     `uuid` : une chaîne quelconque y produirait une erreur PostgreSQL, donc un
     500, là où l'on attend un message de champ. L'action, elle, ira demander à
     la base si cet identifiant désigne un indicateur de ce produit : la forme
     n'est pas l'existence. */
  if (!values.indicatorId) {
    errors.indicatorId = "L'indicateur à adopter est obligatoire.";
  } else if (!isUuid(values.indicatorId)) {
    errors.indicatorId = "Cet indicateur n'existe pas sur ce produit.";
  }

  /* Facultatives, toutes les trois — les colonnes sont nullables. Saisies,
     elles doivent être des nombres : le patron de `results.value`, et non celui
     de `reading.value` qui est obligatoire. Aucune n'est comparée aux deux
     autres : un écart calculé serait l'indice que D39 interdit. */
  if (values.baselineValue && !isDecimal(values.baselineValue)) {
    errors.baselineValue = NOT_A_NUMBER;
  }
  if (values.targetValue && !isDecimal(values.targetValue)) {
    errors.targetValue = NOT_A_NUMBER;
  }
  if (values.finalValue && !isDecimal(values.finalValue)) {
    errors.finalValue = NOT_A_NUMBER;
  }

  return errors;
}

/* ==========================================================================
   De la saisie aux lignes
   ========================================================================== */

/**
 * Les colonnes de `project_indicators` que ce formulaire écrit, et pas une de
 * plus.
 *
 * `projectId` n'y figure pas : il est lié côté serveur par l'action, jamais
 * transmis par un champ. `note` non plus — la fiche ne l'ouvre pas.
 */
export type AdoptionRowInput = {
  indicatorId: string;
  /** `null` quand rien n'est saisi : les trois colonnes sont nullables. */
  baselineValue: string | null;
  targetValue: string | null;
  finalValue: string | null;
};

/** Point décimal pour la colonne, ou `null` quand le champ est vide. */
function decimalOrNull(value: string): string | null {
  const kept = valueOrNull(value);
  return kept === null ? null : normalizeDecimal(kept);
}

/**
 * Lit le formulaire, le valide, et rend la ligne prête à écrire.
 *
 * `input` est non nul **si et seulement si** `errors` est vide : la propriété
 * posée en T2.5, tenue depuis.
 *
 * Les valeurs partent **normalisées** — point décimal, comme les colonnes
 * l'attendent — et non telles qu'elles ont été tapées. Les valeurs rendues au
 * panneau en cas de refus restent, elles, celles de la personne : `values` et
 * `input` ne servent pas le même propos.
 */
export function parseAdoptionForm(formData: FormData): {
  values: AdoptionFormValues;
  errors: AdoptionFormErrors;
  input: AdoptionRowInput | null;
} {
  const values = readAdoptionForm(formData);
  const errors = validateAdoptionForm(values);

  if (Object.keys(errors).length > 0) {
    return { values, errors, input: null };
  }

  return {
    values,
    errors,
    input: {
      indicatorId: values.indicatorId,
      baselineValue: decimalOrNull(values.baselineValue),
      targetValue: decimalOrNull(values.targetValue),
      finalValue: decimalOrNull(values.finalValue),
    },
  };
}
