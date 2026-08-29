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
 * **Deux champs, et pas un de plus** : l'indicateur, la valeur de référence.
 * `project_id` ne se lit pas ici — il est lié côté serveur. **`note` non plus** :
 * la colonne existe (`docs/04` §3), aucune fiche ne l'ouvre, et une colonne
 * écrite qu'aucun écran ne relit est une colonne qu'on relit un jour sans savoir
 * pourquoi (règle 3, leçon de T5.2).
 *
 * **La cible n'est plus un champ de ce formulaire** (29/08/2026). Elle appartient
 * à l'indicateur — donc au produit —, et s'y saisit une fois pour toutes ; tout
 * accompagnement qui adopte l'indicateur reprend celle-là. C'est ce qui fait
 * qu'il n'existe qu'une cible par indicateur, là où deux colonnes en portaient
 * deux et pouvaient diverger. `final_value` disparaît avec elle, sans
 * remplaçante : ce qu'un indicateur vaut à la clôture d'un accompagnement se lit
 * sur sa série de relevés, qui est datée. Écart assumé à `docs/02` §5 et
 * `docs/04` §3, consigné dans `JOURNAL-TECHNIQUE.md`.
 *
 * C'est aussi ce module qui **tient le point d'entrée HTTP**, et non le panneau :
 * `readAdoptionForm` nomme ses champs un par un, si bien qu'un `targetValue`
 * glissé dans une requête forgée n'est lu par personne. Retirer un champ d'un
 * formulaire n'a jamais protégé une colonne — c'est la lecture nominative qui le
 * fait, et la colonne supprimée qui l'achève.
 *
 * **Une seule obligation, et c'est le rattachement.** `project_indicators` ne
 * rend `not null` que ses deux clés étrangères : `baseline_value` est nullable.
 * Adopter un indicateur sans rien renseigner d'autre est un geste normal — une
 * adoption nue dit déjà quelque chose : cet accompagnement regarde cet
 * indicateur.
 *
 * **Le contrôle décimal n'est pas réécrit ici** : `isDecimal`, `normalizeDecimal`
 * et `decimalAsTyped` vivent dans `lib/forms/result.ts` et y sont éprouvés. La
 * colonne est le **même** `numeric(18,4)` que `results.value` et
 * `indicator_readings.value`, et deux copies d'une règle de validation divergent
 * le jour où l'une des précisions bouge. L'import croisé est la règle du dossier,
 * posée en T5.3 : ce qui se recopie ici, ce sont les libellés et les messages ;
 * ce qui s'importe, ce sont les règles.
 *
 * **La référence n'est comparée à rien.** Ni à la cible du produit, ni au dernier
 * relevé : ce serait juger un chiffre reporté, et `direction` n'est pas davantage
 * un arbitre — elle oriente la lecture d'une courbe, elle ne qualifie pas une
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

/** Deux chaînes, jamais un objet métier. */
export type AdoptionFormValues = {
  /** L'indicateur adopté. Obligatoire — c'est le rattachement même. */
  indicatorId: string;
  /** La valeur au démarrage. Facultative — la colonne est nullable. */
  baselineValue: string;
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
  /**
   * L'écriture a eu lieu : le panneau se referme (TD.2).
   *
   * **C'est ce qui remplace le `redirect` de l'action.** La navigation *était*
   * la fermeture ; elle ne peut plus l'être sans re-rendre la page que TD.2
   * cherche justement à ne plus re-rendre. `revalidatePath` reste, et sa
   * réponse porte l'arbre réactualisé : ce qui a été saisi paraît dans son
   * bloc, et c'est toute la confirmation (`docs/06` §9).
   */
  ok?: boolean;
};

export const EMPTY_ADOPTION_VALUES: AdoptionFormValues = {
  indicatorId: "",
  baselineValue: "",
};

/**
 * L'adoption déjà enregistrée, ramenée aux deux chaînes du formulaire — le
 * pré-remplissage du panneau en correction.
 *
 * Jumeau de `toResultFormValues` (T4bis.6), `toIndicatorFormValues` (T5.2) et
 * `toReadingFormValues` (T5.3) : le panneau reçoit des **valeurs de
 * formulaire**, jamais une ligne de base. C'est ce qui laisse un refus les
 * remplacer sans que rien ne change de forme entre les deux chemins.
 *
 * La référence passe par `decimalAsTyped` : la colonne rend « 54.0000 », et le
 * poser tel quel dans le champ serait une invitation à retaper une valeur que
 * personne n'a écrite ainsi. `null` devient `""` : le formulaire ne connaît que
 * des chaînes, et l'absence s'y écrit vide.
 *
 * La forme du paramètre est celle de `ProjectAdoption`
 * (`lib/queries/indicators.ts`), déjà lue pour l'écran : la correction n'ajoute
 * **aucune lecture en base**. `productTargetValue` n'y est pas repris — c'est une
 * valeur du produit, que ce formulaire affiche peut-être un jour mais n'écrit
 * jamais.
 */
export function toAdoptionFormValues(row: {
  indicatorId: string;
  baselineValue: string | null;
}): AdoptionFormValues {
  return {
    indicatorId: row.indicatorId,
    baselineValue:
      row.baselineValue === null ? "" : decimalAsTyped(row.baselineValue),
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
  };
}

/* ==========================================================================
   La validation
   ========================================================================== */

/**
 * Le message d'une valeur qui n'est pas un nombre. La phrase est celle qui
 * servait les trois colonnes avant le 29/08/2026 ; elle en sert une, sans
 * changer d'un mot — c'est la même règle, et la même précision de colonne.
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

  /* Facultative — la colonne est nullable. Saisie, elle doit être un nombre :
     le patron de `results.value`, et non celui de `reading.value` qui est
     obligatoire. Elle n'est comparée à rien, ni à la cible du produit ni au
     dernier relevé : un écart calculé serait l'indice que D39 interdit. */
  if (values.baselineValue && !isDecimal(values.baselineValue)) {
    errors.baselineValue = NOT_A_NUMBER;
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
 * transmis par un champ. `note` non plus — aucune fiche ne l'ouvre.
 */
export type AdoptionRowInput = {
  indicatorId: string;
  /** `null` quand rien n'est saisi : la colonne est nullable. */
  baselineValue: string | null;
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
 * La valeur part **normalisée** — point décimal, comme la colonne l'attend — et
 * non telle qu'elle a été tapée. Les valeurs rendues au
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
    },
  };
}
