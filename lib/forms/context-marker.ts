/**
 * Le formulaire d'un **repère de contexte** — un fait daté du produit que le
 * centre n'a pas produit.
 *
 * Ce module ne valide **que la forme**, comme les deux du dispositif de mesure
 * à côté : un jour qui existe, un intitulé qui n'est pas vide, un identifiant
 * qui a la forme d'un UUID.
 *
 * **Il ne sait rien des repères d'accompagnement, et c'est voulu.** Ceux-là
 * remontent tout seuls des activités terminées (`listAccompanimentMarkers`) :
 * rien ne se saisit pour eux, donc rien ne se valide. Ce formulaire ne porte
 * que ce qu'aucune activité ne porte.
 *
 * **`happenedOn` n'a aucune valeur par défaut** — ni aujourd'hui, ni le mois
 * courant. Dater d'office un fait du jour où on le note ferait mentir la seule
 * information que le repère apporte, et poserait la marque au mauvais endroit
 * sur l'axe. C'est l'arbitrage de `reading.readOn` (T5.3) et de
 * `taggingPlan.updatedOn`, pour la même raison.
 *
 * **`projectId` est facultatif, et la forme est tout ce qui se vérifie ici.**
 * Que l'accompagnement appartienne bien à **ce** produit est une question de
 * données, pas de forme : elle se tranche dans l'action, sur l'identifiant
 * reçu. Un `<select>` bien peuplé n'a jamais protégé personne.
 */

import { isIsoDay, valueOrNull } from "@/lib/forms/project";
import { isUuid } from "@/lib/uuid";

/* ==========================================================================
   Ce que la personne a saisi
   ========================================================================== */

export type ContextMarkerFormValues = {
  /** Le jour du fait, `YYYY-MM-DD`. Obligatoire — `not null`, sans défaut. */
  happenedOn: string;
  /** Ce que le fait est, en une ligne. Obligatoire — `not null`. */
  label: string;
  /** Ce qu'il faut savoir pour relire la courbe plus tard. Facultative. */
  note: string;
  /** L'accompagnement de contexte. **Vide est la réponse normale.** */
  projectId: string;
};

export type ContextMarkerFormErrors = Partial<
  Record<keyof ContextMarkerFormValues, string>
>;

export type ContextMarkerFormState = {
  values: ContextMarkerFormValues;
  errors: ContextMarkerFormErrors;
  /** Un empêchement qui n'appartient à aucun champ : un droit, une ligne rangée. */
  message?: string;
  /** Le succès, sur lequel le panneau se referme (TD.2). */
  ok?: boolean;
};

export const EMPTY_CONTEXT_MARKER_VALUES: ContextMarkerFormValues = {
  happenedOn: "",
  label: "",
  note: "",
  projectId: "",
};

export function toContextMarkerFormValues(row: {
  happenedOn: string;
  label: string;
  note: string | null;
  projectId: string | null;
}): ContextMarkerFormValues {
  return {
    happenedOn: row.happenedOn,
    label: row.label,
    note: row.note ?? "",
    projectId: row.projectId ?? "",
  };
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function readContextMarkerForm(
  formData: FormData,
): ContextMarkerFormValues {
  return {
    happenedOn: field(formData, "happenedOn"),
    label: field(formData, "label"),
    note: field(formData, "note"),
    projectId: field(formData, "projectId"),
  };
}

/* ==========================================================================
   La validation
   ========================================================================== */

export function validateContextMarkerForm(
  values: ContextMarkerFormValues,
): ContextMarkerFormErrors {
  const errors: ContextMarkerFormErrors = {};

  /* **Sans date, pas de repère** : c'est la date qui le pose sur l'axe, et un
     fait qu'on ne saurait pas situer n'aurait rien à y faire. `docs/03` §7
     interdit de positionner arbitrairement ce qui n'a pas de date. */
  if (!values.happenedOn) {
    errors.happenedOn = "La date du repère est obligatoire.";
  } else if (!isIsoDay(values.happenedOn)) {
    errors.happenedOn = "Cette date n'existe pas.";
  }

  /* Un repère sans intitulé serait une marque muette sur l'axe : la couleur ne
     porte jamais seule (`docs/06` §11), et c'est ce mot-là qui la double. */
  if (!values.label) {
    errors.label = "L'intitulé du repère est obligatoire.";
  }

  // `note` n'est pas validée : un texte libre, nullable en base.

  /* Vide est valide — le rattachement est facultatif. Renseigné, il doit avoir
     la forme d'un UUID : interroger une colonne `uuid` avec autre chose est une
     erreur PostgreSQL, donc un 500 là où l'on attend un message de champ. */
  if (values.projectId && !isUuid(values.projectId)) {
    errors.projectId = "Cet accompagnement n'existe pas.";
  }

  return errors;
}

/**
 * Ce qui s'écrit en base — `productId` mis à part, que l'action tient de l'URL
 * et non d'un champ.
 */
export type ContextMarkerRowInput = {
  happenedOn: string;
  label: string;
  /** `null` quand rien n'est saisi : les deux colonnes sont nullables. */
  note: string | null;
  projectId: string | null;
};

/**
 * Lit le formulaire, le valide, et rend la ligne prête à écrire.
 *
 * `input` est non nul **si et seulement si** `errors` est vide.
 */
export function parseContextMarkerForm(formData: FormData): {
  values: ContextMarkerFormValues;
  errors: ContextMarkerFormErrors;
  input: ContextMarkerRowInput | null;
} {
  const values = readContextMarkerForm(formData);
  const errors = validateContextMarkerForm(values);

  if (Object.keys(errors).length > 0) {
    return { values, errors, input: null };
  }

  return {
    values,
    errors,
    input: {
      happenedOn: values.happenedOn,
      label: values.label,
      note: valueOrNull(values.note),
      projectId: valueOrNull(values.projectId),
    },
  };
}
