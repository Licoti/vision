/**
 * La saisie d'une **piste de démarrage** : lecture du formulaire, et validation
 * (T7.4).
 *
 * **Ni base, ni Next, ni React**, comme les dix-neuf modules voisins.
 *
 * **C'est le formulaire le plus fourni de l'écran** — six champs —, et c'est ce
 * qui a définitivement écarté l'idée d'un panneau générique : la moitié de ces
 * champs n'existe sur aucun autre référentiel. Une piste porte une phrase de
 * carte, un texte long de panneau, un genre et un outil.
 *
 * **`summary` est obligatoire, `guidance` ne l'est pas**, et le schéma le dit :
 * la première est `not null` — c'est la phrase que la carte rend, une carte sans
 * elle serait un titre nu —, la seconde est nullable, « nulle tant que personne
 * ne l'a écrit ».
 *
 * **Aucune adresse ici.** `starters` n'en porte pas : elle vit sur
 * `tools.base_url`, et une seule fois. Deux sources pour un même lien
 * divergeraient le jour où l'une des deux changerait. Une piste sans outil — une
 * méthode — n'a donc pas de lien, ce qui est un état normal.
 *
 * **Aucun `activity_type_id`.** C'est T7.10, avec sa migration : la colonne
 * n'existe pas, et un champ qui n'a pas de colonne serait une saisie jetée.
 */

import { starterKind } from "@/lib/db/schema";
import {
  referentialField,
  toPositionValue,
  validatePosition,
} from "@/lib/forms/referential";
import { isUuid } from "@/lib/uuid";

/** `tool` · `method` · `resource`. Dérivé du schéma. */
export type StarterKindValue = (typeof starterKind.enumValues)[number];

/** L'ordre du `<select>` est celui de l'énuméré. **Ce n'est pas un rang** : les
 *  trois valeurs disent de quoi la piste est faite, pas laquelle vaut mieux. */
export const STARTER_KINDS: readonly StarterKindValue[] = starterKind.enumValues;

/** Ce que la personne a saisi, tel quel — des chaînes, jamais un objet métier. */
export type StarterFormValues = {
  label: string;
  /** La phrase de la carte : ce que la piste permet, en une ligne. Obligatoire. */
  summary: string;
  /** Le texte long du panneau. Facultatif. */
  guidance: string;
  /** La valeur d'énuméré, non traduite. */
  kind: string;
  /** Vide quand la piste ne renvoie vers aucun outil — une méthode. */
  toolId: string;
  position: string;
};

export type StarterFormErrors = Partial<Record<keyof StarterFormValues, string>>;

export type StarterFormState = {
  values: StarterFormValues;
  errors: StarterFormErrors;
  message?: string;
  ok?: boolean;
};

export const EMPTY_STARTER_VALUES: StarterFormValues = {
  label: "",
  summary: "",
  guidance: "",
  kind: "tool",
  toolId: "",
  position: "0",
};

export function toStarterFormValues(row: {
  label: string;
  summary: string;
  guidance: string | null;
  kind: StarterKindValue;
  toolId: string | null;
  position: string;
}): StarterFormValues {
  return {
    label: row.label,
    summary: row.summary,
    guidance: row.guidance ?? "",
    kind: row.kind,
    toolId: row.toolId ?? "",
    position: row.position,
  };
}

/**
 * Les six champs de ce formulaire, et pas un de plus.
 *
 * L'action ne construit jamais sa ligne par étalement d'un `FormData` : un champ
 * caché ajouté par n'importe qui deviendrait une colonne écrite — et
 * `archived_at` est précisément la colonne qu'un tel champ atteindrait.
 */
export function readStarterForm(formData: FormData): StarterFormValues {
  return {
    label: referentialField(formData, "label"),
    summary: referentialField(formData, "summary"),
    guidance: referentialField(formData, "guidance"),
    kind: referentialField(formData, "kind"),
    toolId: referentialField(formData, "toolId"),
    position: referentialField(formData, "position"),
  };
}

export function isStarterKind(value: string): value is StarterKindValue {
  return (starterKind.enumValues as readonly string[]).includes(value);
}

export function validateStarterForm(
  values: StarterFormValues,
): StarterFormErrors {
  const errors: StarterFormErrors = {};

  if (!values.label) {
    errors.label = "Le libellé est obligatoire.";
  }

  if (!values.summary) {
    errors.summary = "La phrase de présentation est obligatoire.";
  }

  /* Aucune longueur maximale : les deux colonnes sont des `text` sans
     contrainte, et en inventer une ici serait une règle produit que ni
     `docs/02` ni `docs/04` ne portent — la règle de `lib/forms/vision.ts`. */

  if (!isStarterKind(values.kind)) {
    errors.kind = "Cette nature de piste n'existe pas.";
  }

  // La forme est vérifiée avant la base (`lib/uuid.ts`) ; l'appartenance au
  // domaine l'est à l'écriture, par `assertPreconditions`.
  if (values.toolId && !isUuid(values.toolId)) {
    errors.toolId = "Cet outil n'est pas reconnu.";
  }

  const position = validatePosition(values.position);
  if (position) errors.position = position;

  return errors;
}

/* ==========================================================================
   De la saisie à la ligne
   ========================================================================== */

/**
 * Les colonnes que ce formulaire écrit, et pas une de plus.
 *
 * `guidance` et `toolId` sont **`null` quand rien n'est saisi**, jamais `""` :
 * `starter-detail.tsx` teste `guidance` pour décider d'afficher son texte long,
 * et une chaîne vide y rendrait un paragraphe blanc ; `toolId` est un `uuid`,
 * qu'une chaîne vide ferait tomber en 500.
 */
export type StarterInput = {
  label: string;
  summary: string;
  guidance: string | null;
  kind: StarterKindValue;
  toolId: string | null;
  position: string;
};

export function parseStarterForm(formData: FormData): {
  values: StarterFormValues;
  errors: StarterFormErrors;
  input: StarterInput | null;
} {
  const values = readStarterForm(formData);
  const errors = validateStarterForm(values);

  if (Object.keys(errors).length > 0 || !isStarterKind(values.kind)) {
    return { values, errors, input: null };
  }

  return {
    values,
    errors,
    input: {
      label: values.label,
      summary: values.summary,
      guidance: values.guidance || null,
      kind: values.kind,
      toolId: values.toolId || null,
      position: toPositionValue(values.position),
    },
  };
}
