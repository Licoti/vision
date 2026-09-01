/**
 * Le formulaire du **plan de taggage** d'un produit.
 *
 * Ce module ne valide **que la forme**, comme `lib/forms/tracking.ts` à côté :
 * une adresse qui est une adresse web, un état qui appartient à l'énuméré, un
 * jour qui existe.
 *
 * **Trois champs obligatoires, et le troisième est le cœur de la demande** :
 * `updatedOn` est la date portée par le **document**, celle qui permet de dire
 * qu'un plan a vieilli. Elle n'a **aucune valeur par défaut** — ni aujourd'hui,
 * ni le mois courant : dater d'office le plan du jour où on remplit sa fiche
 * ferait mentir la seule information que la liste des produits affiche. C'est
 * l'arbitrage de `reading.readOn` (T5.3), et pour la même raison.
 *
 * **`status` n'est pas déduit de `updatedOn`.** La tentation était écrite dans
 * la demande — « les plans qui nécessitent une mise à jour » —, et un « plus de
 * douze mois donc à revoir » aurait été un badge de retard, c'est-à-dire un
 * interdit d'interface. C'est une personne qui constate, et l'écran l'affiche.
 */

import { taggingPlanStatus } from "@/lib/db/schema";
import { isIsoDay, valueOrNull } from "@/lib/forms/project";
import { isWebUrl } from "@/lib/forms/resource";

export type TaggingPlanStatusValue =
  (typeof taggingPlanStatus.enumValues)[number];

export const TAGGING_PLAN_STATUS_VALUES: readonly TaggingPlanStatusValue[] =
  taggingPlanStatus.enumValues;

export function isTaggingPlanStatus(
  value: string,
): value is TaggingPlanStatusValue {
  return (taggingPlanStatus.enumValues as readonly string[]).includes(value);
}

/* ==========================================================================
   Ce que la personne a saisi
   ========================================================================== */

export type TaggingPlanFormValues = {
  /** L'adresse du document, hébergé ailleurs. Obligatoire — `not null`. */
  url: string;
  /** Obligatoire — `not null`, et sans valeur par défaut dans le schéma. */
  status: string;
  /** La date de mise à jour du document, `YYYY-MM-DD`. Obligatoire. */
  updatedOn: string;
  /** Ce qui manque au plan, quand quelqu'un le sait. Facultative. */
  note: string;
};

export type TaggingPlanFormErrors = Partial<
  Record<keyof TaggingPlanFormValues, string>
>;

export type TaggingPlanFormState = {
  values: TaggingPlanFormValues;
  errors: TaggingPlanFormErrors;
  /** Un empêchement qui n'appartient à aucun champ : un droit, une ligne rangée. */
  message?: string;
  /** Le succès, sur lequel le panneau se referme (TD.2). */
  ok?: boolean;
};

export const EMPTY_TAGGING_PLAN_VALUES: TaggingPlanFormValues = {
  url: "",
  status: "",
  updatedOn: "",
  note: "",
};

export function toTaggingPlanFormValues(row: {
  url: string;
  status: TaggingPlanStatusValue;
  updatedOn: string;
  note: string | null;
}): TaggingPlanFormValues {
  return {
    url: row.url,
    status: row.status,
    updatedOn: row.updatedOn,
    note: row.note ?? "",
  };
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function readTaggingPlanForm(formData: FormData): TaggingPlanFormValues {
  return {
    url: field(formData, "url"),
    status: field(formData, "status"),
    updatedOn: field(formData, "updatedOn"),
    note: field(formData, "note"),
  };
}

/* ==========================================================================
   La validation
   ========================================================================== */

export function validateTaggingPlanForm(
  values: TaggingPlanFormValues,
): TaggingPlanFormErrors {
  const errors: TaggingPlanFormErrors = {};

  /* **Un plan sans adresse n'est pas un plan** : la ligne dirait qu'il existe
     sans permettre d'y accéder, ce qui est exactement l'inverse du service
     rendu. `isWebUrl` est celui de `resources`, et Vision ne stocke jamais le
     document — seulement où il vit. */
  if (!values.url) {
    errors.url = "L'adresse du plan de taggage est obligatoire.";
  } else if (!isWebUrl(values.url)) {
    errors.url = "L'adresse du plan doit commencer par http:// ou https://.";
  }

  /* La liste est fermée, et le second contrôle n'est pas décoratif : une
     soumission forgée porte ce qu'elle veut, et une valeur hors énuméré rendrait
     un 500 là où l'on attend un message de champ. */
  if (!values.status) {
    errors.status = "L'état du plan est obligatoire.";
  } else if (!isTaggingPlanStatus(values.status)) {
    errors.status = "Cet état n'existe pas.";
  }

  /* Obligatoire, contrairement à `verifiedOn` du dispositif : c'est **la** date
     que la liste des produits affiche, et un plan sans elle y paraîtrait comme
     un plan sans âge — ce que personne ne saurait interpréter. */
  if (!values.updatedOn) {
    errors.updatedOn = "La date de mise à jour du plan est obligatoire.";
  } else if (!isIsoDay(values.updatedOn)) {
    errors.updatedOn = "Cette date de mise à jour n'existe pas.";
  }

  // `note` n'est pas validée : un texte libre, nullable en base.

  return errors;
}

/**
 * Ce qui s'écrit en base — `productId` mis à part, que l'action tient de l'URL
 * et non d'un champ.
 */
export type TaggingPlanRowInput = {
  url: string;
  status: TaggingPlanStatusValue;
  updatedOn: string;
  /** `null` quand rien n'est saisi : la colonne est nullable. */
  note: string | null;
};

/**
 * Lit le formulaire, le valide, et rend la ligne prête à écrire.
 *
 * `input` est non nul **si et seulement si** `errors` est vide.
 */
export function parseTaggingPlanForm(formData: FormData): {
  values: TaggingPlanFormValues;
  errors: TaggingPlanFormErrors;
  input: TaggingPlanRowInput | null;
} {
  const values = readTaggingPlanForm(formData);
  const errors = validateTaggingPlanForm(values);

  if (Object.keys(errors).length > 0) {
    return { values, errors, input: null };
  }

  return {
    values,
    errors,
    input: {
      url: values.url,
      /* Le rétrécissement est acquis : la validation vient de refuser tout ce
         qui n'appartient pas à l'énuméré, et `errors` est vide. */
      status: values.status as TaggingPlanStatusValue,
      updatedOn: values.updatedOn,
      note: valueOrNull(values.note),
    },
  };
}
