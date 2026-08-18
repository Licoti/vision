/**
 * La saisie de la **vision produit** : lecture du formulaire, et validation.
 *
 * **Ni base, ni Next, ni React**, comme `lib/forms/product.ts` dont ce module
 * est le jumeau minimal : un seul champ, un seul geste — écrire ou récrire la
 * raison d'être d'un produit.
 *
 * **Aucune longueur maximale.** `products.description` n'en a pas, et en
 * inventer une ici serait une règle produit que rien ne porte : ni `docs/02`,
 * ni `docs/04`, ni le brief. Une vision de trois lignes et une vision de trois
 * mots sont l'une et l'autre des visions.
 *
 * **Un champ vidé retire la vision** — la colonne repasse à `null`, et l'écran
 * revient à son état vide. Ce n'est pas la suppression de donnée métier que la
 * règle 4 proscrit : c'est la correction d'un champ de texte, exactement comme
 * `description`, et le geste se rejoue à l'identique. La note du champ le dit,
 * faute de quoi on effacerait sans le savoir.
 *
 * **La validation ne rend aucune erreur, et c'est un constat, pas un oubli.**
 * Il n'y a rien à valider qu'un `trim` ne tranche déjà : le champ est
 * facultatif, sans forme imposée et sans référentiel. La fonction existe
 * quand même — elle est le point où une règle s'écrirait le jour où il y en a
 * une, et son absence dans le module se lirait comme un manque plutôt que
 * comme une décision.
 */

/** Ce que la personne a saisi, tel quel — une chaîne, jamais un objet. */
export type VisionFormValues = {
  vision: string;
};

export type VisionFormErrors = Partial<Record<keyof VisionFormValues, string>>;

/**
 * L'état que `useActionState` fait circuler entre le panneau et l'action.
 *
 * Il porte les valeurs autant que les erreurs : sans elles, une vision de dix
 * lignes disparaîtrait au premier refus. `errors` reste vide en pratique — le
 * champ n'a pas de règle de forme —, mais le type existe parce que `Panel`
 * prend `errors` en prop : un état de formulaire sans sa carte d'erreurs ne se
 * branche pas.
 */
export type VisionFormState = {
  values: VisionFormValues;
  errors: VisionFormErrors;
  /** Un empêchement qui n'appartient à aucun champ : un droit, un archivage. */
  message?: string;
};

export const EMPTY_VISION_VALUES: VisionFormValues = { vision: "" };

export const EMPTY_VISION_FORM: VisionFormState = {
  values: EMPTY_VISION_VALUES,
  errors: {},
};

/** Le champ, lu et rogné. Absent ou d'un type inattendu, il vaut « vide ». */
function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Le seul champ de ce formulaire, et pas un de plus.
 *
 * L'action ne construit jamais sa ligne par étalement d'un `FormData` : un
 * champ caché ajouté par n'importe qui deviendrait une colonne écrite — la
 * règle de `readProductForm`.
 */
export function readVisionForm(formData: FormData): VisionFormValues {
  return { vision: field(formData, "vision") };
}

/** La ligne telle qu'elle se relit : `null` plutôt que `""`. */
export function toVisionFormValues(row: {
  vision: string | null;
}): VisionFormValues {
  return { vision: row.vision ?? "" };
}

/** Voir l'en-tête : rien à valider qu'un `trim` ne tranche déjà. */
export function validateVisionForm(_values: VisionFormValues): VisionFormErrors {
  return {};
}

/**
 * La vision telle qu'elle part en base : `null` plutôt que `""`.
 *
 * Le jumeau de `descriptionOrNull`, et pour la même raison : un champ non
 * renseigné n'est pas une chaîne vide. La page teste `product.vision` pour
 * décider de son état vide ; une chaîne vide y passerait pour une vision et
 * rendrait un paragraphe blanc.
 */
export function visionOrNull(vision: string): string | null {
  return vision || null;
}

/* ==========================================================================
   De la saisie à la ligne
   ========================================================================== */

/** La seule colonne de `products` que ce formulaire écrit. */
export type VisionInput = {
  vision: string | null;
};

/**
 * Lit le formulaire, le valide, et rend la ligne prête à écrire.
 *
 * `input` est non nul **si et seulement si** `errors` est vide — la propriété
 * de `parseProductForm`, tenue ici bien qu'`errors` soit toujours vide : c'est
 * la forme que l'action lit, et elle ne doit pas changer le jour où une règle
 * apparaît.
 */
export function parseVisionForm(formData: FormData): {
  values: VisionFormValues;
  errors: VisionFormErrors;
  input: VisionInput | null;
} {
  const values = readVisionForm(formData);
  const errors = validateVisionForm(values);

  if (Object.keys(errors).length > 0) {
    return { values, errors, input: null };
  }

  return { values, errors, input: { vision: visionOrNull(values.vision) } };
}
