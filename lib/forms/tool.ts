/**
 * La saisie d'un **outil raccordé** : lecture du formulaire, et validation
 * (T7.4).
 *
 * **Ni base, ni Next, ni React**, comme les dix-huit modules voisins.
 *
 * **Deux écarts au reste de la famille, et le schéma les impose tous les deux.**
 * `tools` nomme sa colonne de libellé **`name`** et non `label` — c'est la seule
 * des neuf tables de l'écran dans ce cas. Et elle **ne porte pas de
 * `position`** : ni au schéma, ni dans `docs/04` §2. Lui en donner une aurait
 * demandé une migration, que l'arbitrage (a) de `tickets-C7.md` réserve à T7.10.
 * La liste s'ordonne donc par nom, comme `listResultToolOptions` le fait déjà.
 *
 * **`base_url` est validée, et ce n'est pas décoratif.** L'adresse est rendue
 * par `ExternalLink` sur la carte d'une piste de démarrage
 * (`components/projects/starter-detail.tsx`), qui pose le `href` **tel quel** :
 * une adresse `javascript:` enregistrée ici s'exécuterait au clic. `isWebUrl`
 * vient de `lib/forms/resource.ts`, et c'est son cinquième réemploi — jamais une
 * sixième copie, « deux copies divergent un jour, et c'est celle qu'on a oublié
 * de corriger qui laisse passer ».
 *
 * **`sync_mode` et `api_config` ne se saisissent pas** (arbitrage (i) de
 * `tickets-C7.md`) : D15 pose `manual` au POC et `api_config` vide, réservé au
 * branchement futur. Un champ qui n'a pas de lecteur est celui qu'on relit un
 * jour sans savoir pourquoi — la leçon de T5.2.
 *
 * **Aucun appel sortant**, ni pour vérifier une adresse, ni pour la sonder, ni
 * pour en deviner le nom : Vision renvoie vers l'outil, elle ne l'interroge pas
 * (D15). Ce module regarde une chaîne, il ne visite rien.
 */

import { toolKind } from "@/lib/db/schema";
import { referentialField } from "@/lib/forms/referential";
import { isWebUrl } from "@/lib/forms/resource";

/** `audit` · `analytics` · `budget` · `other`. Dérivé du schéma. */
export type ToolKindValue = (typeof toolKind.enumValues)[number];

/** L'ordre du `<select>` est celui de l'énuméré ; « Autre » ferme la marche. */
export const TOOL_KINDS: readonly ToolKindValue[] = toolKind.enumValues;

/** Ce que la personne a saisi, tel quel — des chaînes, jamais un objet métier. */
export type ToolFormValues = {
  /** « Ergonome ». Obligatoire — `not null`. La colonne s'appelle `name`. */
  name: string;
  /** La valeur d'énuméré, non traduite. */
  kind: string;
  /** La racine du lien profond. Facultative : la colonne est nullable. */
  baseUrl: string;
};

export type ToolFormErrors = Partial<Record<keyof ToolFormValues, string>>;

export type ToolFormState = {
  values: ToolFormValues;
  errors: ToolFormErrors;
  /** Un empêchement qui n'appartient à aucun champ : un droit, une ligne rangée. */
  message?: string;
  /** L'écriture a eu lieu : le panneau se referme (TD.2). */
  ok?: boolean;
};

export const EMPTY_TOOL_VALUES: ToolFormValues = {
  name: "",
  kind: "audit",
  baseUrl: "",
};

export function toToolFormValues(row: {
  name: string;
  kind: ToolKindValue;
  baseUrl: string | null;
}): ToolFormValues {
  return { name: row.name, kind: row.kind, baseUrl: row.baseUrl ?? "" };
}

/**
 * Les trois champs de ce formulaire, et pas un de plus.
 *
 * L'action ne construit jamais sa ligne par étalement d'un `FormData` : un champ
 * caché ajouté par n'importe qui deviendrait une colonne écrite — et `sync_mode`
 * est précisément la colonne qu'un tel champ atteindrait, celle que l'arbitrage
 * (i) laisse hors de la saisie.
 */
export function readToolForm(formData: FormData): ToolFormValues {
  return {
    name: referentialField(formData, "name"),
    kind: referentialField(formData, "kind"),
    baseUrl: referentialField(formData, "baseUrl"),
  };
}

export function isToolKind(value: string): value is ToolKindValue {
  return (toolKind.enumValues as readonly string[]).includes(value);
}

export function validateToolForm(values: ToolFormValues): ToolFormErrors {
  const errors: ToolFormErrors = {};

  if (!values.name) {
    errors.name = "Le nom de l'outil est obligatoire.";
  }

  if (!isToolKind(values.kind)) {
    errors.kind = "Ce genre d'outil n'existe pas.";
  }

  /* Facultative — un outil peut être nommé avant que son adresse soit connue,
     et la carte d'une piste dit alors « raccordé au domaine, sans adresse
     renseignée ». Renseignée, elle doit être un lien web. */
  if (values.baseUrl && !isWebUrl(values.baseUrl)) {
    errors.baseUrl =
      "Cette adresse n'est pas un lien web : elle doit commencer par http:// ou https://.";
  }

  return errors;
}

/* ==========================================================================
   De la saisie à la ligne
   ========================================================================== */

/**
 * Les colonnes que ce formulaire écrit, et pas une de plus.
 *
 * `baseUrl` est **`null` quand rien n'est saisi**, jamais `""` : la colonne est
 * nullable pour cette raison, et `listStarters` teste `toolUrl` pour décider
 * d'afficher un lien ou une phrase. Une chaîne vide y passerait pour une adresse
 * et rendrait un lien vers nulle part.
 */
export type ToolInput = {
  name: string;
  kind: ToolKindValue;
  baseUrl: string | null;
};

/**
 * Lit le formulaire, le valide, et rend la ligne prête à écrire.
 *
 * `input` est non nul **si et seulement si** `errors` est vide : la propriété
 * posée en T2.5. Le second membre du `if` **prouve** au compilateur le type de
 * `kind`, là où un `as` tiendrait aujourd'hui et mentirait le jour où l'énuméré
 * changerait.
 */
export function parseToolForm(formData: FormData): {
  values: ToolFormValues;
  errors: ToolFormErrors;
  input: ToolInput | null;
} {
  const values = readToolForm(formData);
  const errors = validateToolForm(values);

  if (Object.keys(errors).length > 0 || !isToolKind(values.kind)) {
    return { values, errors, input: null };
  }

  return {
    values,
    errors,
    input: {
      name: values.name,
      kind: values.kind,
      baseUrl: values.baseUrl || null,
    },
  };
}
