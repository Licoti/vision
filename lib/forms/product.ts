/**
 * La saisie d'un produit : lecture du formulaire, et validation.
 *
 * **Ni base, ni Next, ni React.** C'est ce qui rend la règle énonçable et
 * vérifiable seule — les tests de ce module ne touchent aucune branche Neon,
 * là où tout le reste de `lib/` en a besoin. Le même choix qu'en T1.4 pour
 * `rightsFor`.
 *
 * Ce module ne valide **que la forme** : un nom non vide, un identifiant qui
 * ressemble à un identifiant, un type qui appartient à l'énuméré. Il ne dit
 * rien de l'existence de l'entité, et il ne doit rien en dire : cette question
 * appartient au domaine, donc à `lib/db/scoped.ts`, qui la tranche déjà à
 * l'écriture (`assertPreconditions`). Revérifier ici serait poser une seconde
 * autorité, qui divergerait un jour de la première.
 */

import { productKind } from "@/lib/db/schema";
import { isUuid } from "@/lib/uuid";

/** `product` · `internal`. Dérivé du schéma, jamais réécrit à la main. */
export type ProductKind = (typeof productKind.enumValues)[number];

/**
 * D10 — les missions transverses vont dans un produit de type `internal`.
 * Le libellé le dit en toutes lettres : « internal » n'a aucun sens pour qui
 * saisit, et l'interface est en français.
 */
export const PRODUCT_KIND_LABEL: Record<ProductKind, string> = {
  product: "Produit accompagné",
  internal: "Mission transverse",
};

/** Ce que la personne a saisi, tel quel — des chaînes, jamais des objets. */
export type ProductFormValues = {
  name: string;
  entityId: string;
  kind: string;
  description: string;
};

export type ProductFormErrors = Partial<
  Record<keyof ProductFormValues, string>
>;

/**
 * L'état que `useActionState` fait circuler entre le formulaire et l'action.
 *
 * Il porte les valeurs autant que les erreurs : sans elles, une description de
 * dix lignes disparaîtrait au premier nom oublié.
 */
export type ProductFormState = {
  values: ProductFormValues;
  errors: ProductFormErrors;
  /** Un empêchement qui n'appartient à aucun champ : un droit, une panne. */
  message?: string;
};

export const EMPTY_PRODUCT_VALUES: ProductFormValues = {
  name: "",
  entityId: "",
  kind: "product",
  description: "",
};

export const EMPTY_PRODUCT_FORM: ProductFormState = {
  values: EMPTY_PRODUCT_VALUES,
  errors: {},
};

/** Le champ, lu et rogné. Absent ou d'un type inattendu, il vaut « vide ». */
function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Les quatre champs du ticket, et eux seuls.
 *
 * L'action ne construit jamais sa ligne par étalement d'un `FormData` : un
 * champ caché ajouté par n'importe qui deviendrait une colonne écrite.
 */
export function readProductForm(formData: FormData): ProductFormValues {
  return {
    name: field(formData, "name"),
    entityId: field(formData, "entityId"),
    kind: field(formData, "kind") || "product",
    description: field(formData, "description"),
  };
}

export function validateProductForm(
  values: ProductFormValues,
): ProductFormErrors {
  const errors: ProductFormErrors = {};

  if (!values.name) {
    errors.name = "Le nom est obligatoire.";
  }

  // La forme est vérifiée avant la base, pour la raison exposée dans
  // `lib/uuid.ts` : une colonne `uuid` interrogée avec n'importe quoi rend une
  // erreur PostgreSQL, donc un 500, là où l'on attend un message de champ.
  if (!values.entityId) {
    errors.entityId = "L'entité de rattachement est obligatoire.";
  } else if (!isUuid(values.entityId)) {
    errors.entityId = "Cette entité n'est pas reconnue.";
  }

  if (!isProductKind(values.kind)) {
    errors.kind = "Ce type de produit n'existe pas.";
  }

  return errors;
}

export function isProductKind(value: string): value is ProductKind {
  return (productKind.enumValues as readonly string[]).includes(value);
}

/**
 * La description telle qu'elle part en base : `null` plutôt que `""`.
 *
 * Un champ non renseigné n'est pas une chaîne vide — la colonne est nullable
 * pour cette raison, et la page produit teste `product.description` pour
 * décider d'afficher son chapeau. Une chaîne vide y passerait pour une
 * description et rendrait un paragraphe blanc.
 */
export function descriptionOrNull(description: string): string | null {
  return description || null;
}

/* ==========================================================================
   De la saisie à la ligne
   ========================================================================== */

/** Les quatre colonnes de `products` que ce formulaire écrit, et pas une de plus. */
export type ProductInput = {
  name: string;
  entityId: string;
  kind: ProductKind;
  description: string | null;
};

/**
 * Lit le formulaire, le valide, et rend la ligne prête à écrire.
 *
 * `input` est non nul **si et seulement si** `errors` est vide : c'est ce qui
 * évite à l'action d'affirmer par un `as` un type que la validation venait
 * déjà de prouver. Un `as` tiendrait aujourd'hui et mentirait le jour où une
 * troisième valeur entrerait dans l'énuméré.
 */
export function parseProductForm(formData: FormData): {
  values: ProductFormValues;
  errors: ProductFormErrors;
  input: ProductInput | null;
} {
  const values = readProductForm(formData);
  const errors = validateProductForm(values);

  if (Object.keys(errors).length > 0 || !isProductKind(values.kind)) {
    return { values, errors, input: null };
  }

  return {
    values,
    errors,
    input: {
      name: values.name,
      entityId: values.entityId,
      kind: values.kind,
      description: descriptionOrNull(values.description),
    },
  };
}
