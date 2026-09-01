/**
 * Le formulaire d'un **outil de mesure posé sur un produit**.
 *
 * Ce module ne valide **que la forme** : un identifiant qui est un UUID, un état
 * qui appartient à l'énuméré, une adresse qui est une adresse web, une date qui
 * est un jour. Il ne sait rien du domaine courant, rien des droits, rien de ce
 * que le référentiel contient — c'est l'action qui l'apprend, et la base qui le
 * garantit. Le patron de `lib/forms/indicator.ts`, suivi sans écart.
 *
 * **Cinq champs, et l'un n'est pas là** : l'état est déclaré, jamais mesuré, si
 * bien qu'aucun champ ne demande « depuis quand » ni « à quelle fréquence ».
 * Vision ne sonde rien ; elle recueille ce qu'une personne a constaté, et
 * `verifiedOn` date ce constat — pas la collecte.
 *
 * **`toolId` est obligatoire, `status` aussi ; les trois autres sont
 * facultatifs**, et leurs colonnes sont nullables en base. Le périmètre est
 * facultatif alors qu'il donne son sens à « partiel » : l'imposer ferait mentir
 * la saisie de qui ne le connaît pas encore, et un champ obligatoire qu'on
 * remplit au hasard vaut moins qu'un champ vide.
 */

import { trackingStatus } from "@/lib/db/schema";
import { isIsoDay, valueOrNull } from "@/lib/forms/project";
import { isWebUrl } from "@/lib/forms/resource";
import { isUuid } from "@/lib/uuid";

export type TrackingStatusValue = (typeof trackingStatus.enumValues)[number];

export const TRACKING_STATUS_VALUES: readonly TrackingStatusValue[] =
  trackingStatus.enumValues;

export function isTrackingStatus(value: string): value is TrackingStatusValue {
  return (trackingStatus.enumValues as readonly string[]).includes(value);
}

/* ==========================================================================
   Ce que la personne a saisi
   ========================================================================== */

export type TrackingFormValues = {
  /** L'outil du référentiel. Obligatoire — `not null`, et une clé étrangère. */
  toolId: string;
  /** Obligatoire — `not null`, et sans valeur par défaut dans le schéma. */
  status: string;
  /** « Site public et espace connecté ». Facultatif — la colonne est nullable. */
  scope: string;
  /** L'adresse de la propriété dans l'outil. Facultative. */
  propertyUrl: string;
  /** La date du dernier constat, `YYYY-MM-DD`. Facultative. */
  verifiedOn: string;
  /** Une phrase pour qui reprendra. Facultative. */
  note: string;
};

export type TrackingFormErrors = Partial<
  Record<keyof TrackingFormValues, string>
>;

export type TrackingFormState = {
  values: TrackingFormValues;
  errors: TrackingFormErrors;
  /** Un empêchement qui n'appartient à aucun champ : un droit, une ligne rangée. */
  message?: string;
  /** Le succès, sur lequel le panneau se referme (TD.2). */
  ok?: boolean;
};

export const EMPTY_TRACKING_VALUES: TrackingFormValues = {
  toolId: "",
  status: "",
  scope: "",
  propertyUrl: "",
  verifiedOn: "",
  note: "",
};

export function toTrackingFormValues(row: {
  toolId: string;
  status: TrackingStatusValue;
  scope: string | null;
  propertyUrl: string | null;
  verifiedOn: string | null;
  note: string | null;
}): TrackingFormValues {
  return {
    toolId: row.toolId,
    status: row.status,
    scope: row.scope ?? "",
    propertyUrl: row.propertyUrl ?? "",
    verifiedOn: row.verifiedOn ?? "",
    note: row.note ?? "",
  };
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function readTrackingForm(formData: FormData): TrackingFormValues {
  return {
    toolId: field(formData, "toolId"),
    status: field(formData, "status"),
    scope: field(formData, "scope"),
    propertyUrl: field(formData, "propertyUrl"),
    verifiedOn: field(formData, "verifiedOn"),
    note: field(formData, "note"),
  };
}

/* ==========================================================================
   La validation
   ========================================================================== */

export function validateTrackingForm(
  values: TrackingFormValues,
): TrackingFormErrors {
  const errors: TrackingFormErrors = {};

  /* **La forme avant la base**, la règle du dépôt : une colonne `uuid`
     interrogée avec « bonjour » rend une erreur PostgreSQL, donc un 500, là où
     l'on attend un message de champ. Que cet outil existe, et qu'il appartienne
     à ce domaine, la couche d'accès le dira — pas ce module. */
  if (!values.toolId) {
    errors.toolId = "L'outil de mesure est obligatoire.";
  } else if (!isUuid(values.toolId)) {
    errors.toolId = "Cet outil n'existe pas.";
  }

  /* La liste est fermée, et le second contrôle n'est pas décoratif : le `select`
     ne propose que les quatre valeurs de l'énuméré, mais une soumission forgée
     porte ce qu'elle veut, et une valeur hors énuméré rendrait une erreur
     PostgreSQL — un 500 — là où l'on attend un message de champ. La leçon de
     `validateIndicatorForm`, mot pour mot. */
  if (!values.status) {
    errors.status = "L'état du dispositif est obligatoire.";
  } else if (!isTrackingStatus(values.status)) {
    errors.status = "Cet état n'existe pas.";
  }

  // `scope` et `note` ne sont pas validés : deux textes libres, nullables en
  // base. Leur imposer une forme serait inventer un référentiel (D25, C7).

  /* Facultative, mais saisie, elle doit mener quelque part : `isWebUrl` est
     celui de `resources`, et pour la même raison — un lien qui n'est pas un lien
     est un lien mort qu'on ne découvre qu'au clic. */
  if (values.propertyUrl && !isWebUrl(values.propertyUrl)) {
    errors.propertyUrl =
      "L'adresse de la propriété doit commencer par http:// ou https://.";
  }

  /* Facultative, mais saisie, elle doit être un jour réel : `isIsoDay` refuse le
     31 février, que la seule expression régulière laisserait passer. */
  if (values.verifiedOn && !isIsoDay(values.verifiedOn)) {
    errors.verifiedOn = "Cette date de constat n'existe pas.";
  }

  return errors;
}

/**
 * Ce qui s'écrit en base — `productId` mis à part, que l'action tient de l'URL
 * et non d'un champ. `archivedAt` non plus : `update` le refuse, et la couche ne
 * le pose que par `archive`.
 */
export type TrackingRowInput = {
  toolId: string;
  status: TrackingStatusValue;
  /** `null` quand rien n'est saisi : les colonnes sont nullables. */
  scope: string | null;
  propertyUrl: string | null;
  verifiedOn: string | null;
  note: string | null;
};

/**
 * Lit le formulaire, le valide, et rend la ligne prête à écrire.
 *
 * `input` est non nul **si et seulement si** `errors` est vide : la propriété
 * posée en T2.5, tenue depuis.
 */
export function parseTrackingForm(formData: FormData): {
  values: TrackingFormValues;
  errors: TrackingFormErrors;
  input: TrackingRowInput | null;
} {
  const values = readTrackingForm(formData);
  const errors = validateTrackingForm(values);

  if (Object.keys(errors).length > 0) {
    return { values, errors, input: null };
  }

  return {
    values,
    errors,
    input: {
      toolId: values.toolId,
      /* Le rétrécissement est acquis : `validateTrackingForm` vient de refuser
         tout ce qui n'appartient pas à l'énuméré, et `errors` est vide. */
      status: values.status as TrackingStatusValue,
      scope: valueOrNull(values.scope),
      propertyUrl: valueOrNull(values.propertyUrl),
      verifiedOn: valueOrNull(values.verifiedOn),
      note: valueOrNull(values.note),
    },
  };
}
