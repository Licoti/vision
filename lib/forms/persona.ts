/**
 * La saisie d'un **persona** : lecture du formulaire, et validation.
 *
 * **Ni base, ni Next, ni React**, comme les dix modules qui le précèdent dans ce
 * dossier. C'est ce qui rend la règle énonçable et vérifiable seule, sans
 * branche Neon ni fixture.
 *
 * Ce module ne valide **que la forme** : un nom non vide, un rang qui appartient
 * à son énuméré, une adresse d'image qui est un lien web. Il ne dit rien du
 * produit qui porte le persona, ni du droit d'y écrire — ces questions
 * appartiennent au domaine, donc à l'action et à `lib/db/scoped.ts`.
 *
 * **Il écrit deux tables, et c'est sa seule singularité.** `parsePersonaForm`
 * rend une ligne de `personas` **et** la liste de ses traits, parce que les
 * deux sortent du même formulaire : les trois zones de texte « Objectifs »,
 * « Irritants » et « Attentes » sont saisies comme du texte et arrivent en base
 * comme des lignes identifiées. C'est tout l'enjeu du modèle — un irritant
 * qu'un use case pourra désigner demain, pas une phrase dans un paragraphe.
 *
 * **Une ligne = un élément, et le champ répétable reste interdit.** La limite
 * posée le 14/08/2026 tient : un champ qui se duplique au clic exige le
 * JavaScript que la cinquième discipline refuse. Une zone de texte, elle,
 * fonctionne sans une ligne de script, et le découpage se fait ici.
 *
 * **Le dédoublonnage vit ici plutôt qu'en base**, et c'est un choix : une
 * contrainte d'unicité sur `(persona_id, kind, label)` imposerait de retirer
 * avant d'ajouter, à rebours de la règle de T3.6 — les ajouts passent avant les
 * retraits, faute de transaction interactive.
 */

import { personaKind, personaTraitKind } from "@/lib/db/schema";
import { valueOrNull } from "@/lib/forms/project";
import { isWebUrl } from "@/lib/forms/resource";

/**
 * `primary` · `secondary`. Dérivé du schéma, jamais réécrit à la main — la
 * règle d'`IndicatorDirectionValue`.
 */
export type PersonaKindValue = (typeof personaKind.enumValues)[number];

/** `goal` · `pain` · `expectation`, dans l'ordre du schéma. */
export type PersonaTraitKindValue =
  (typeof personaTraitKind.enumValues)[number];

/** Les deux rangs, dans l'ordre du schéma — celui que le panneau propose. */
export const PERSONA_KIND_VALUES: readonly PersonaKindValue[] =
  personaKind.enumValues;

/** Les trois familles, dans l'ordre où le panneau et le détail les rendent. */
export const PERSONA_TRAIT_KIND_VALUES: readonly PersonaTraitKindValue[] =
  personaTraitKind.enumValues;

export function isPersonaKind(value: string): value is PersonaKindValue {
  return (personaKind.enumValues as readonly string[]).includes(value);
}

/* ==========================================================================
   Ce que la personne a saisi
   ========================================================================== */

/** Huit chaînes, jamais un objet métier. */
export type PersonaFormValues = {
  /** « Chargé de clientèle ». Obligatoire — `not null`. */
  name: string;
  /** Le rôle ou le contexte. Facultatif — la colonne est nullable. */
  role: string;
  /** La description courte. Facultative — la colonne est nullable. */
  summary: string;
  /** L'adresse de l'image, hébergée ailleurs. Facultative. */
  imageUrl: string;
  /** `primary` ou `secondary`. Le panneau propose deux boutons radio. */
  kind: string;
  /** Les trois zones de texte : **une ligne = un élément**. */
  goals: string;
  pains: string;
  expectations: string;
};

export type PersonaFormErrors = Partial<Record<keyof PersonaFormValues, string>>;

/**
 * L'état que `useActionState` fait circuler entre le panneau et l'action.
 * Il porte les valeurs autant que les erreurs : une saisie refusée revient dans
 * le panneau avec ce qui a été tapé — et huit champs dont trois listes, c'est
 * précisément ce qu'on ne veut pas retaper.
 */
export type PersonaFormState = {
  values: PersonaFormValues;
  errors: PersonaFormErrors;
  /** Un empêchement qui n'appartient à aucun champ : un droit, une ligne rangée. */
  message?: string;
  /**
   * L'écriture a eu lieu : le panneau se referme (TD.2).
   *
   * **C'est ce qui remplace le `redirect` de l'action.** La navigation *était*
   * la fermeture ; elle ne peut plus l'être sans re-rendre la page que TD.2
   * cherche justement à ne plus re-rendre. `revalidatePath` reste, et sa
   * réponse porte l'arbre réactualisé : ce qui a été saisi paraît dans son
   * bloc, et c'est toute la confirmation (`docs/06` §9).
   */
  ok?: boolean;
};

export const EMPTY_PERSONA_VALUES: PersonaFormValues = {
  name: "",
  role: "",
  summary: "",
  imageUrl: "",
  /* Le défaut de la colonne, et le défaut de l'écran : un persona de plus est
     secondaire jusqu'à ce qu'on le désigne autrement. */
  kind: "secondary",
  goals: "",
  pains: "",
  expectations: "",
};

/* ==========================================================================
   Le découpage des trois zones
   ========================================================================== */

/**
 * Une zone de texte, ramenée à ses éléments : une ligne = un élément.
 *
 * Les lignes vides disparaissent — un retour chariot de trop n'est pas un
 * objectif —, les doublons exacts aussi, et l'ordre de saisie est conservé :
 * c'est lui qui devient `position`, faute d'ordre naturel entre deux irritants.
 *
 * Le retour chariot de Windows (`\r\n`) est traité comme le retour simple :
 * un navigateur poste l'un ou l'autre selon la plateforme, et un `\r` resté en
 * fin de libellé se lirait dans l'écran.
 */
export function readLines(value: string): string[] {
  const kept: string[] = [];
  const seen = new Set<string>();

  for (const raw of value.split("\n")) {
    const line = raw.trim();
    if (!line || seen.has(line)) continue;
    seen.add(line);
    kept.push(line);
  }

  return kept;
}

/* ==========================================================================
   La lecture du formulaire
   ========================================================================== */

/**
 * Le champ, lu et rogné. Absent ou d'un type inattendu, il vaut « vide ».
 *
 * Les trois zones de texte passent par la même fonction : `trim` retire les
 * blancs de tête et de queue de la zone entière, `readLines` ceux de chaque
 * ligne. Les deux sont nécessaires et ne font pas le même travail.
 */
function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Les huit champs du formulaire, et pas un de plus.
 *
 * L'action ne construit jamais sa ligne par étalement d'un `FormData` : un champ
 * caché ajouté par n'importe qui deviendrait une colonne écrite. `productId` ne
 * se lit pas ici — il est lié côté serveur.
 */
export function readPersonaForm(formData: FormData): PersonaFormValues {
  return {
    name: field(formData, "name"),
    role: field(formData, "role"),
    summary: field(formData, "summary"),
    imageUrl: field(formData, "imageUrl"),
    kind: field(formData, "kind"),
    goals: field(formData, "goals"),
    pains: field(formData, "pains"),
    expectations: field(formData, "expectations"),
  };
}

/**
 * La ligne enregistrée et ses traits, ramenés aux huit chaînes du formulaire —
 * le pré-remplissage du panneau en correction.
 *
 * Les traits arrivent **déjà triés** par famille puis par position
 * (`lib/queries/personas.ts`) ; aucun tri ne se rejoue ici. Ce qui se rejoue,
 * c'est le regroupement : trois listes deviennent trois zones de texte, et la
 * personne relit exactement ce qu'elle avait tapé.
 */
export function toPersonaFormValues(
  row: {
    name: string;
    role: string | null;
    summary: string | null;
    imageUrl: string | null;
    kind: PersonaKindValue;
  },
  traits: readonly { kind: PersonaTraitKindValue; label: string }[],
): PersonaFormValues {
  const linesOf = (kind: PersonaTraitKindValue): string =>
    traits
      .filter((trait) => trait.kind === kind)
      .map((trait) => trait.label)
      .join("\n");

  return {
    name: row.name,
    role: row.role ?? "",
    summary: row.summary ?? "",
    imageUrl: row.imageUrl ?? "",
    kind: row.kind,
    goals: linesOf("goal"),
    pains: linesOf("pain"),
    expectations: linesOf("expectation"),
  };
}

/* ==========================================================================
   La validation
   ========================================================================== */

export function validatePersonaForm(
  values: PersonaFormValues,
): PersonaFormErrors {
  const errors: PersonaFormErrors = {};

  if (!values.name) {
    errors.name = "Le nom du persona est obligatoire.";
  }

  /* La liste est fermée, et le second contrôle n'est pas décoratif : les deux
     boutons radio ne portent que les valeurs de l'énuméré, mais une soumission
     forgée porte ce qu'elle veut, et une valeur hors énuméré rendrait une
     erreur PostgreSQL — un 500 — là où l'on attend un message de champ. */
  if (!values.kind) {
    errors.kind = "Le rang du persona est obligatoire.";
  } else if (!isPersonaKind(values.kind)) {
    errors.kind = "Ce rang de persona n'existe pas.";
  }

  /* L'image est facultative — la colonne est nullable —, mais saisie, c'est un
     lien web : Vision n'héberge aucun fichier, et le contrôle est **le même**
     que celui d'une ressource, importé plutôt que recopié. Une seconde copie
     d'un contrôle de sécurité diverge un jour, et c'est celle qu'on a oublié de
     corriger qui laisse passer (la règle de T4.4). */
  if (values.imageUrl && !isWebUrl(values.imageUrl)) {
    errors.imageUrl =
      "Cette adresse n'est pas un lien web : elle doit commencer par http:// ou https://.";
  }

  /* `role`, `summary` et les trois zones ne sont pas validés : des textes
     libres, nullables ou vides en base. Une longueur maximale serait une règle
     produit que rien ne porte — la règle de `lib/forms/vision.ts`. */

  return errors;
}

/* ==========================================================================
   De la saisie aux lignes
   ========================================================================== */

/** Les colonnes de `personas` que ce formulaire écrit, et pas une de plus. */
export type PersonaRowInput = {
  name: string;
  role: string | null;
  summary: string | null;
  imageUrl: string | null;
  kind: PersonaKindValue;
};

/** Un trait, tel qu'il part en base — `persona_id` est posé par l'action. */
export type PersonaTraitInput = {
  kind: PersonaTraitKindValue;
  label: string;
  position: number;
};

export type PersonaInput = {
  persona: PersonaRowInput;
  /** Les trois familles à la suite, chacune numérotée à partir de zéro. */
  traits: PersonaTraitInput[];
};

/**
 * Lit le formulaire, le valide, et rend les lignes prêtes à écrire.
 *
 * `input` est non nul **si et seulement si** `errors` est vide : la propriété
 * posée en T2.5, qui évite d'affirmer par un `as` un type que la validation
 * venait de prouver. Le rang est donc **renarrowé** ici plutôt qu'affirmé — la
 * forme exacte de `parseIndicatorForm`. Le rattrapage qui suit est
 * inatteignable, `validatePersonaForm` ayant déjà posé l'erreur, et il coûte
 * deux lignes : c'est ce qui garantit la propriété **par construction**.
 *
 * **`position` repart de zéro dans chaque famille**, et non sur la liste
 * entière : c'est un rang dans sa liste, celui qu'un écran restitue. Deux
 * familles qui partageraient une numérotation ne se liraient plus séparément.
 */
export function parsePersonaForm(formData: FormData): {
  values: PersonaFormValues;
  errors: PersonaFormErrors;
  input: PersonaInput | null;
} {
  const values = readPersonaForm(formData);
  const errors = validatePersonaForm(values);

  const kind = isPersonaKind(values.kind) ? values.kind : null;
  if (!kind && !errors.kind) {
    errors.kind = "Ce rang de persona n'existe pas.";
  }

  if (!kind || Object.keys(errors).length > 0) {
    return { values, errors, input: null };
  }

  const traits: PersonaTraitInput[] = [];
  const sources: readonly [PersonaTraitKindValue, string][] = [
    ["goal", values.goals],
    ["pain", values.pains],
    ["expectation", values.expectations],
  ];

  for (const [traitKind, raw] of sources) {
    readLines(raw).forEach((label, position) => {
      traits.push({ kind: traitKind, label, position });
    });
  }

  return {
    values,
    errors,
    input: {
      persona: {
        name: values.name,
        role: valueOrNull(values.role),
        summary: valueOrNull(values.summary),
        imageUrl: valueOrNull(values.imageUrl),
        kind,
      },
      traits,
    },
  };
}
