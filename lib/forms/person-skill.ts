/**
 * La saisie d'une **compétence portée** : lecture du formulaire, et validation.
 *
 * **Ni base, ni Next, ni React**, comme les treize modules qui le précèdent dans
 * ce dossier.
 *
 * **Deux champs, et le second seul se corrige.** La fiche du ticket énumère les
 * gestes : « ajouter une compétence avec son niveau ; **corriger ce niveau** ».
 * Une liaison ne se déplace donc pas d'une compétence à l'autre — et c'est ce
 * que `lockedSkillId` tient : en correction, la compétence vient de la ligne
 * relue côté serveur, le formulaire n'en poste aucune, et l'unicité
 * `person_skills_person_skill_unique` n'a rien à arbitrer sur ce chemin. Se
 * tromper de compétence se répare en la retirant puis en la reposant, ce que les
 * deux autres gestes rendent possible.
 *
 * Ce module ne dit rien de la personne qui porte la compétence, ni de son genre,
 * ni du droit d'écrire : `openPersonSkill` tranche les trois, et le refus de
 * l'intervenant côté entité (arbitrage (d)) est **dans l'action**, jamais dans
 * le rendu.
 *
 * **Aucun champ de commentaire, aucune date de validation** (interdits de la
 * fiche, leçon de T5.2) : une colonne écrite sans lecteur est une colonne qu'on
 * relit un jour sans savoir pourquoi.
 */

/* ==========================================================================
   Ce que la personne a saisi
   ========================================================================== */

/** Deux chaînes, jamais un objet métier. */
export type PersonSkillFormValues = {
  /** La compétence du référentiel. Obligatoire — `not null`. */
  skillId: string;
  /** L'échelon déclaré. Obligatoire — `not null`. */
  levelId: string;
};

export type PersonSkillFormErrors = Partial<
  Record<keyof PersonSkillFormValues, string>
>;

/** L'état que `useActionState` fait circuler entre le panneau et l'action. */
export type PersonSkillFormState = {
  values: PersonSkillFormValues;
  errors: PersonSkillFormErrors;
  /** Un empêchement qui n'appartient à aucun champ : un droit, une ligne rangée. */
  message?: string;
  /** L'écriture a eu lieu : le panneau se referme (TD.2). */
  ok?: boolean;
};

export const EMPTY_PERSON_SKILL_VALUES: PersonSkillFormValues = {
  skillId: "",
  levelId: "",
};

/**
 * La liaison déjà enregistrée, ramenée aux deux chaînes du formulaire — le
 * pré-remplissage du panneau en correction.
 */
export function toPersonSkillFormValues(row: {
  skillId: string;
  levelId: string;
}): PersonSkillFormValues {
  return { skillId: row.skillId, levelId: row.levelId };
}

/** Le champ, lu et rogné. Absent ou d'un type inattendu, il vaut « vide ». */
function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Les deux champs du ticket, et eux seuls.
 *
 * `lockedSkillId` est la compétence de la liaison en correction : elle **gagne
 * toujours** sur ce que le formulaire porterait. Le panneau ne rend d'ailleurs
 * aucun contrôle de compétence dans ce cas, mais une soumission forgée en
 * poste ce qu'elle veut — et c'est bien pourquoi la valeur reçue est ignorée
 * plutôt que crue.
 *
 * `personId` ne se lit pas ici : il est lié côté serveur.
 */
export function readPersonSkillForm(
  formData: FormData,
  lockedSkillId?: string | undefined,
): PersonSkillFormValues {
  return {
    skillId: lockedSkillId ?? field(formData, "skillId"),
    levelId: field(formData, "levelId"),
  };
}

/**
 * La forme d'un identifiant, **recopiée plutôt qu'importée** — la raison est
 * dans l'en-tête de `lib/forms/use-case.ts`, et elle n'a pas changé.
 */
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* ==========================================================================
   La validation
   ========================================================================== */

export function validatePersonSkillForm(
  values: PersonSkillFormValues,
): PersonSkillFormErrors {
  const errors: PersonSkillFormErrors = {};

  /* Les deux colonnes sont `not null`, et les deux sont des `uuid` : la forme se
     vérifie avant la base, faute de quoi une valeur fantaisiste rendrait une
     erreur PostgreSQL — un 500 — là où l'on attend un message de champ. */
  if (!values.skillId) {
    errors.skillId = "La compétence est obligatoire.";
  } else if (!UUID.test(values.skillId)) {
    errors.skillId =
      "Cette compétence n'est pas désignée correctement : la saisie n'a pas été enregistrée.";
  }

  if (!values.levelId) {
    errors.levelId = "Le niveau est obligatoire.";
  } else if (!UUID.test(values.levelId)) {
    errors.levelId =
      "Ce niveau n'est pas désigné correctement : la saisie n'a pas été enregistrée.";
  }

  return errors;
}

/* ==========================================================================
   De la saisie aux lignes
   ========================================================================== */

/**
 * Les colonnes de `person_skills` que ce formulaire écrit, et pas une de plus.
 *
 * `personId` n'y figure pas : il est lié côté serveur par l'action, jamais
 * transmis par un champ.
 */
export type PersonSkillRowInput = {
  skillId: string;
  levelId: string;
};

/**
 * Lit le formulaire, le valide, et rend la ligne prête à écrire.
 *
 * `input` est non nul **si et seulement si** `errors` est vide — la propriété
 * posée en T2.5. Aucun renarrowing n'est nécessaire ici : les deux champs sont
 * des chaînes, et c'est leur **forme** qui est éprouvée, pas leur type.
 */
export function parsePersonSkillForm(
  formData: FormData,
  lockedSkillId?: string | undefined,
): {
  values: PersonSkillFormValues;
  errors: PersonSkillFormErrors;
  input: PersonSkillRowInput | null;
} {
  const values = readPersonSkillForm(formData, lockedSkillId);
  const errors = validatePersonSkillForm(values);

  if (Object.keys(errors).length > 0) {
    return { values, errors, input: null };
  }

  return {
    values,
    errors,
    input: { skillId: values.skillId, levelId: values.levelId },
  };
}
