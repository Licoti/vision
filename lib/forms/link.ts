/**
 * La saisie d'un lien déclaré : lecture du formulaire, et validation.
 *
 * **Ni base, ni Next, ni React**, comme les modules qui le précèdent dans ce
 * dossier. C'est ce qui rend la règle énonçable et vérifiable seule, sans
 * branche Neon ni fixture.
 *
 * Ce module ne valide **que la forme** : un accompagnement visé qui ressemble à
 * un identifiant, et une raison qui n'est jamais obligatoire. Il ne dit rien de
 * l'existence de ce projet dans le domaine, de son archivage, de l'auto-lien ni
 * du doublon : ces quatre questions appartiennent au domaine, donc à l'action et
 * à `lib/db/scoped.ts`. Les rejouer ici poserait une seconde autorité, qui
 * divergerait un jour de la première.
 *
 * **La raison n'est jamais obligatoire** (interdit de la fiche T6.5), et
 * `docs/02` §7 dit pourquoi : *« c'est le seul cas où l'on demande une saisie
 * qui ne sert pas directement à celui qui la fait ; elle doit donc rester très
 * peu coûteuse et parfaitement optionnelle. »* Une raison exigée rendrait le
 * geste coûteux, et un geste coûteux ne se fait pas.
 *
 * **Le plus petit des sept modules de saisie**, et ce n'est pas un accident :
 * deux champs, dont un facultatif. La fiche demande que relier soit *très peu
 * coûteux* — cela se lit dans le nombre de champs avant de se lire à l'écran.
 */

import { valueOrNull } from "@/lib/forms/project";
import { isUuid } from "@/lib/uuid";

/* ==========================================================================
   Ce que la personne a saisi
   ========================================================================== */

/** Deux chaînes, jamais un objet métier. */
export type LinkFormValues = {
  /** L'accompagnement visé. `from_project_id` n'est pas ici : il est lié côté serveur. */
  toProjectId: string;
  /** Pourquoi ce lien. Vide est un cas normal, pas un oubli. */
  reason: string;
};

export type LinkFormErrors = Partial<Record<keyof LinkFormValues, string>>;

/**
 * L'état que `useActionState` fait circuler entre le panneau et l'action.
 * Il porte les valeurs autant que les erreurs : une saisie refusée revient dans
 * le panneau avec ce qui a été tapé, jamais vidée.
 */
export type LinkFormState = {
  values: LinkFormValues;
  errors: LinkFormErrors;
  /** Un empêchement qui n'appartient à aucun champ : un droit, une ligne disparue. */
  message?: string;
  /** L'écriture a eu lieu : le panneau se referme (TD.2). */
  ok?: boolean;
};

export const EMPTY_LINK_VALUES: LinkFormValues = {
  toProjectId: "",
  reason: "",
};

/**
 * La ligne déjà enregistrée, ramenée aux deux chaînes du formulaire — le
 * pré-remplissage du panneau en correction.
 *
 * Jumeau de `toResourceFormValues` (T4bis.5), et pour la même raison : le
 * panneau reçoit des **valeurs de formulaire**, jamais une ligne de base. C'est
 * ce qui laisse un refus les remplacer sans que rien ne change de forme entre
 * les deux chemins.
 *
 * `reason` nulle devient `""` : la colonne est nullable, le `textarea` ne l'est
 * pas.
 */
export function toLinkFormValues(row: {
  toProjectId: string;
  reason: string | null;
}): LinkFormValues {
  return {
    toProjectId: row.toProjectId,
    reason: row.reason ?? "",
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
 * caché ajouté par n'importe qui deviendrait une colonne écrite.
 * `fromProjectId` ne se lit pas ici — il est lié côté serveur.
 */
export function readLinkForm(formData: FormData): LinkFormValues {
  return {
    toProjectId: field(formData, "toProjectId"),
    reason: field(formData, "reason"),
  };
}

/* ==========================================================================
   La validation
   ========================================================================== */

export function validateLinkForm(values: LinkFormValues): LinkFormErrors {
  const errors: LinkFormErrors = {};

  if (!values.toProjectId) {
    errors.toProjectId = "L'accompagnement à relier est obligatoire.";
  } else if (!isUuid(values.toProjectId)) {
    // La forme est vérifiée avant la base, pour la raison exposée dans
    // `lib/uuid.ts` : une colonne `uuid` interrogée avec n'importe quoi rend une
    // erreur PostgreSQL, donc un 500, là où l'on attend un message de champ.
    errors.toProjectId = "Cet accompagnement n'est pas reconnu.";
  }

  /* **Aucun contrôle sur la raison, et c'est la règle** : ni longueur minimale,
     ni obligation. Ce qui n'est pas saisi part à `null` plus bas. */

  return errors;
}

/* ==========================================================================
   De la saisie aux lignes
   ========================================================================== */

/**
 * Les colonnes de `project_links` que ce formulaire écrit, et pas une de plus.
 *
 * `fromProjectId` n'y figure pas : il est lié côté serveur par l'action, jamais
 * transmis par un champ.
 */
export type LinkRowInput = {
  toProjectId: string;
  /** `null` quand rien n'est saisi : un lien sans raison est un lien valide. */
  reason: string | null;
};

/**
 * Lit le formulaire, le valide, et rend la ligne prête à écrire.
 *
 * `input` est non nul **si et seulement si** `errors` est vide : la propriété
 * posée en T2.5.
 */
export function parseLinkForm(formData: FormData): {
  values: LinkFormValues;
  errors: LinkFormErrors;
  input: LinkRowInput | null;
} {
  const values = readLinkForm(formData);
  const errors = validateLinkForm(values);

  if (Object.keys(errors).length > 0) {
    return { values, errors, input: null };
  }

  return {
    values,
    errors,
    input: {
      toProjectId: values.toProjectId,
      reason: valueOrNull(values.reason),
    },
  };
}
