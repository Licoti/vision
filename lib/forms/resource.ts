/**
 * La saisie d'une ressource : lecture du formulaire, et validation.
 *
 * **Ni base, ni Next, ni React**, comme les trois modules qui le précèdent dans
 * ce dossier. C'est ce qui rend la règle énonçable et vérifiable seule, sans
 * branche Neon ni fixture.
 *
 * Ce module ne valide **que la forme** : un titre non vide, une adresse qui est
 * un lien web, un type qui appartient à son énuméré, un identifiant d'activité
 * qui ressemble à un identifiant. Il ne dit rien de l'existence de l'activité
 * dans le domaine ni de son appartenance à ce projet : cette question appartient
 * au domaine, donc à l'action et à `lib/db/scoped.ts`. Revérifier ici poserait
 * une seconde autorité, qui divergerait un jour de la première.
 *
 * **Vision n'héberge aucun fichier** (`docs/02` §5) : ce qui se saisit est un
 * lien, un titre, un type. Rien ici n'appelle l'adresse — ni vérification, ni
 * aperçu, ni titre deviné (interdit de la fiche T4.2). L'analyse ci-dessous est
 * celle d'une chaîne de caractères, et elle ne quitte pas le processus.
 *
 * **Le type est saisi, jamais déduit de l'URL** (D21).
 */

import { resourceType } from "@/lib/db/schema";
import { valueOrNull } from "@/lib/forms/project";
import { isUuid } from "@/lib/uuid";

/** `powerpoint` · `figma` · … Dérivé du schéma, jamais réécrit à la main. */
export type ResourceTypeValue = (typeof resourceType.enumValues)[number];

/**
 * Les sept valeurs de l'énuméré, dans l'ordre du schéma — celui que le `select`
 * du panneau propose. Les libellés, eux, vivent dans `lib/format.ts` depuis
 * T4.1 : un seul endroit les nomme.
 */
export const RESOURCE_TYPE_VALUES: readonly ResourceTypeValue[] =
  resourceType.enumValues;

export function isResourceType(value: string): value is ResourceTypeValue {
  return (resourceType.enumValues as readonly string[]).includes(value);
}

/* ==========================================================================
   Ce que la personne a saisi
   ========================================================================== */

/** Quatre chaînes, jamais un objet métier. */
export type ResourceFormValues = {
  title: string;
  /** L'adresse du document hébergé ailleurs. Jamais appelée par Vision. */
  url: string;
  /** Saisi, jamais déduit de l'URL (D21). Vide tant que rien n'est choisi. */
  resourceType: string;
  /** Facultatif (`docs/02` §5) : l'activité qui a produit le document. */
  activityId: string;
};

export type ResourceFormErrors = Partial<
  Record<keyof ResourceFormValues, string>
>;

/**
 * L'état que `useActionState` fait circuler entre le panneau et l'action.
 * Il porte les valeurs autant que les erreurs : une saisie refusée revient dans
 * le panneau avec ce qui a été tapé, jamais vidée.
 */
export type ResourceFormState = {
  values: ResourceFormValues;
  errors: ResourceFormErrors;
  /** Un empêchement qui n'appartient à aucun champ : un droit, une panne. */
  message?: string;
};

export const EMPTY_RESOURCE_VALUES: ResourceFormValues = {
  title: "",
  url: "",
  resourceType: "",
  activityId: "",
};

/**
 * La ligne déjà enregistrée, ramenée aux quatre chaînes du formulaire — le
 * pré-remplissage du panneau en correction (T4bis.5).
 *
 * Jumeau de `toActivityFormValues` (`lib/forms/activity.ts`, T3.4), et pour la
 * même raison : le panneau reçoit des **valeurs de formulaire**, jamais une
 * ligne de base. C'est ce qui laisse un refus les remplacer sans que rien ne
 * change de forme entre les deux chemins.
 *
 * `activityId` nul devient `""` : le rattachement est facultatif (`docs/02` §5),
 * et c'est la valeur de l'option « Aucune » du `select`.
 */
export function toResourceFormValues(row: {
  title: string;
  url: string;
  resourceType: ResourceTypeValue;
  activityId: string | null;
}): ResourceFormValues {
  return {
    title: row.title,
    url: row.url,
    resourceType: row.resourceType,
    activityId: row.activityId ?? "",
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
 * caché ajouté par n'importe qui deviendrait une colonne écrite. `projectId`
 * ne se lit pas ici — il est lié côté serveur ; `sourceUpdatedAt` non plus — la
 * colonne existe, `docs/05` ne la liste pas, et la fiche l'interdit.
 */
export function readResourceForm(formData: FormData): ResourceFormValues {
  return {
    title: field(formData, "title"),
    url: field(formData, "url"),
    resourceType: field(formData, "resourceType"),
    activityId: field(formData, "activityId"),
  };
}

/* ==========================================================================
   L'adresse

   Le seul contrôle de ce module qui ne se contente pas de regarder une forme,
   et il n'est pas décoratif : `ExternalLink` rend le `href` **tel quel**, si
   bien qu'une adresse `javascript:` enregistrée ici s'exécuterait au clic sur
   le titre de la ressource. Le schéma se vérifie donc à l'écriture, seul
   endroit où l'on décide encore de ce qui entre.

   `new URL` rejette du même geste ce qui n'est pas absolu : « exemple.fr » et
   « /rapport.pdf » n'ont pas de schéma, donc pas de cible hors de Vision — et
   une ressource est par définition un document hébergé ailleurs.

   **Exportée depuis T4.4**, où le lien profond d'un résultat court exactement
   le même risque : `Result` le rend lui aussi par `ExternalLink`. Une quatrième
   copie d'un contrôle de sécurité vaut moins qu'un `export` — deux copies
   divergent un jour, et c'est celle qu'on a oublié de corriger qui laisse
   passer.
   ========================================================================== */

export function isWebUrl(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  return parsed.protocol === "http:" || parsed.protocol === "https:";
}

/* ==========================================================================
   La validation
   ========================================================================== */

export function validateResourceForm(
  values: ResourceFormValues,
): ResourceFormErrors {
  const errors: ResourceFormErrors = {};

  if (!values.title) {
    errors.title = "Le titre de la ressource est obligatoire.";
  }

  if (!values.url) {
    errors.url = "L'adresse du document est obligatoire.";
  } else if (!isWebUrl(values.url)) {
    errors.url =
      "Cette adresse n'est pas un lien web : elle doit commencer par http:// ou https://.";
  }

  if (!values.resourceType) {
    errors.resourceType = "Le type de la ressource est obligatoire.";
  } else if (!isResourceType(values.resourceType)) {
    errors.resourceType = "Ce type de ressource n'existe pas.";
  }

  // La forme est vérifiée avant la base, pour la raison exposée dans
  // `lib/uuid.ts` : une colonne `uuid` interrogée avec n'importe quoi rend une
  // erreur PostgreSQL, donc un 500, là où l'on attend un message de champ.
  if (values.activityId && !isUuid(values.activityId)) {
    errors.activityId = "Cette activité n'est pas reconnue.";
  }

  return errors;
}

/* ==========================================================================
   De la saisie aux lignes
   ========================================================================== */

/**
 * Les colonnes de `resources` que ce formulaire écrit, et pas une de plus.
 *
 * `projectId` n'y figure pas : il est lié côté serveur par l'action, jamais
 * transmis par un champ. `sourceUpdatedAt` non plus — hors périmètre de C4.
 */
export type ResourceRowInput = {
  title: string;
  url: string;
  resourceType: ResourceTypeValue;
  /** `null` quand le rattachement n'est pas renseigné : il est facultatif. */
  activityId: string | null;
};

/**
 * Lit le formulaire, le valide, et rend la ligne prête à écrire.
 *
 * `input` est non nul **si et seulement si** `errors` est vide : la propriété
 * posée en T2.5, qui évite d'affirmer par un `as` un type que la validation
 * venait de prouver. Un `as` tiendrait aujourd'hui et mentirait le jour où une
 * huitième valeur entrerait dans l'énuméré.
 *
 * Le type est donc **renarrowé** ici plutôt qu'affirmé. Le rattrapage qui suit
 * est inatteignable — `validateResourceForm` a déjà posé l'erreur — et il
 * coûte deux lignes : c'est ce qui garantit la propriété ci-dessus **par
 * construction**, plutôt que par la lecture croisée de deux fonctions.
 */
export function parseResourceForm(formData: FormData): {
  values: ResourceFormValues;
  errors: ResourceFormErrors;
  input: ResourceRowInput | null;
} {
  const values = readResourceForm(formData);
  const errors = validateResourceForm(values);

  const type = isResourceType(values.resourceType) ? values.resourceType : null;
  if (!type && !errors.resourceType) {
    errors.resourceType = "Ce type de ressource n'existe pas.";
  }

  if (!type || Object.keys(errors).length > 0) {
    return { values, errors, input: null };
  }

  return {
    values,
    errors,
    input: {
      title: values.title,
      url: values.url,
      resourceType: type,
      activityId: valueOrNull(values.activityId),
    },
  };
}
