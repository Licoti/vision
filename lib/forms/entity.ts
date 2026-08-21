/**
 * La saisie d'une **entité** : lecture du formulaire, et validation.
 *
 * **Ni base, ni Next, ni React**, comme les quatorze modules voisins de ce
 * dossier. C'est ce qui rend la règle énonçable et vérifiable seule, sans
 * branche Neon ni fixture.
 *
 * **Un seul champ, et c'est la table qui le dit.** `entities` porte `label`,
 * `position` et `archived_at` : la première se saisit, la deuxième n'est lue
 * par aucun écran de Vision — tous les tris se font sur `label` —, et la
 * troisième n'appartient qu'à `archive()` et `restore()`. Exposer `position`
 * ferait de cet écran un ordonnanceur, ce qu'aucun ticket ne demande.
 *
 * **Ce module ne valide que la forme** : un libellé non vide. Il ne dit rien de
 * l'unicité du libellé dans le domaine — cette question demande de lire la
 * base, elle appartient donc à l'action. Revérifier ici poserait une seconde
 * autorité, qui divergerait un jour de la première : c'est la règle tenue par
 * `lib/forms/person.ts` pour l'appartenance d'un métier au domaine.
 */

/** Ce que la personne a saisi, tel quel — une chaîne, jamais un objet métier. */
export type EntityFormValues = {
  /** « Banque de détail ». Obligatoire — `not null`. */
  label: string;
};

export type EntityFormErrors = Partial<Record<keyof EntityFormValues, string>>;

/**
 * L'état que `useActionState` fait circuler entre le panneau et l'action.
 * Il porte les valeurs autant que les erreurs : une saisie refusée revient dans
 * le panneau avec ce qui a été tapé, jamais vidée.
 */
export type EntityFormState = {
  values: EntityFormValues;
  errors: EntityFormErrors;
  /** Un empêchement qui n'appartient à aucun champ : un droit, une ligne rangée. */
  message?: string;
  /** L'écriture a eu lieu : le panneau se referme (TD.2). */
  ok?: boolean;
};

export const EMPTY_ENTITY_VALUES: EntityFormValues = { label: "" };

/**
 * La ligne déjà enregistrée, ramenée à la seule chaîne du formulaire — le
 * pré-remplissage du panneau en correction.
 */
export function toEntityFormValues(row: { label: string }): EntityFormValues {
  return { label: row.label };
}

/** Le champ, lu et rogné. Absent ou d'un type inattendu, il vaut « vide ». */
function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Le seul champ de ce formulaire, et pas un de plus.
 *
 * L'action ne construit jamais sa ligne par étalement d'un `FormData` : un
 * champ caché ajouté par n'importe qui deviendrait une colonne écrite — et
 * `position` est précisément la colonne qu'un tel champ atteindrait.
 */
export function readEntityForm(formData: FormData): EntityFormValues {
  return { label: field(formData, "label") };
}

/* ==========================================================================
   La validation
   ========================================================================== */

export function validateEntityForm(values: EntityFormValues): EntityFormErrors {
  const errors: EntityFormErrors = {};

  if (!values.label) {
    errors.label = "Le nom de l'entité est obligatoire.";
  }

  /* Aucune longueur maximale : `entities.label` est un `text` sans contrainte,
     et en inventer une ici serait une règle produit que ni `docs/02` ni
     `docs/04` ne portent — la règle de `lib/forms/vision.ts`. */

  return errors;
}

/* ==========================================================================
   De la saisie à la ligne
   ========================================================================== */

/**
 * La seule colonne d'`entities` que ce formulaire écrit.
 *
 * `position` n'y figure pas : elle garde sa valeur par défaut à la création et
 * ne bouge jamais ensuite. `domain_id`, `created_by` et les estampilles sont
 * posés par `lib/db/scoped.ts`, l'appelant n'y pense pas.
 */
export type EntityRowInput = {
  label: string;
};

/**
 * Lit le formulaire, le valide, et rend la ligne prête à écrire.
 *
 * `input` est non nul **si et seulement si** `errors` est vide : la propriété
 * posée en T2.5 et tenue par les quatorze modules de ce dossier. Elle
 * s'obtient ici sans re-narrowing — il n'y a ni énuméré ni identifiant à
 * rétrécir —, mais la forme du retour ne change pas pour autant : c'est elle
 * que l'action lit, et elle ne doit pas bouger le jour où un second champ
 * apparaît.
 */
export function parseEntityForm(formData: FormData): {
  values: EntityFormValues;
  errors: EntityFormErrors;
  input: EntityRowInput | null;
} {
  const values = readEntityForm(formData);
  const errors = validateEntityForm(values);

  if (Object.keys(errors).length > 0) {
    return { values, errors, input: null };
  }

  return { values, errors, input: { label: values.label } };
}

/**
 * Deux libellés désignent-ils la même entité ?
 *
 * **La casse et les espaces de bord ne distinguent pas** : « Assurance » et
 * « assurance » sont la même division de l'entreprise, et le second n'est
 * qu'une faute de frappe du premier. C'est la comparaison qu'emploie l'action
 * pour refuser un doublon — le point ouvert d'`ETAT.md` sur l'amorçage, où un
 * renommage a créé une seconde ligne sous l'ancien nom.
 *
 * Elle vit ici plutôt que dans l'action parce que c'est une règle de **forme**,
 * énonçable et testable sans base. L'action fournit les libellés, ce module dit
 * s'ils se confondent.
 *
 * `localeCompare` avec `sensitivity: "base"` plutôt qu'un `toLowerCase()` : il
 * range aussi « Réseau » et « Reseau » ensemble, ce qu'un abaissement de casse
 * ne fait pas, et une entité saisie sans accent est le cas suivant du même
 * point ouvert.
 */
export function sameEntityLabel(one: string, other: string): boolean {
  return (
    one.trim().localeCompare(other.trim(), "fr", { sensitivity: "base" }) === 0
  );
}
