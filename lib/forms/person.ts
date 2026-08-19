/**
 * La saisie d'une **personne** : lecture du formulaire, et validation.
 *
 * **Ni base, ni Next, ni React**, comme les douze modules qui le précèdent dans
 * ce dossier. C'est ce qui rend la règle énonçable et vérifiable seule, sans
 * branche Neon ni fixture.
 *
 * Ce module ne valide **que la forme** : un nom non vide, un genre qui
 * appartient à son énuméré, une disponibilité qui appartient au sien, un métier
 * qui ressemble à un identifiant. Il ne dit rien de l'existence du métier dans
 * le domaine, ni du droit d'écrire un profil : ces questions appartiennent au
 * domaine, donc à l'action et à `lib/db/scoped.ts`. Revérifier ici poserait une
 * seconde autorité, qui divergerait un jour de la première.
 *
 * **Cinq champs, et pas un de plus.** `source`, `has_access`, `domain_role` et
 * `is_active` ne se saisissent pas : la première est posée à la création
 * (`manual`, D19), les trois autres appartiennent à l'authentification, que C7
 * reprendra. Les écrire ici ferait de cet écran une console de comptes, ce
 * qu'il n'est pas.
 *
 * **La disponibilité est refusée à un intervenant côté entité** — arbitrage (d)
 * de C5bis. Ce n'est pas une redondance avec le `CHECK`
 * `persons_availability_requires_center` : sans ce contrôle, la contrainte
 * rendrait une erreur PostgreSQL — un 500 — là où l'on attend un message de
 * champ. La base tient la règle, ce module la rend lisible.
 *
 * **Aucun champ de score, de date de validation ni d'historique** : Vision ne
 * mesure pas une personne (garde-fous 1 et 2, D39).
 */

import { personAvailability, personKind } from "@/lib/db/schema";
import { valueOrNull } from "@/lib/forms/project";

/**
 * `center` · `stakeholder`. Dérivé du schéma, jamais réécrit à la main — la
 * règle d'`IndicatorDirectionValue`.
 *
 * Jumeau assumé de `PersonKind` (`lib/queries/team.ts`) : ce dossier ne dépend
 * pas de `lib/queries`, qui traîne un `ScopedDb` dont un module de formulaire
 * n'a que faire. Les deux dérivent du **même** énuméré : elles ne peuvent pas
 * diverger.
 */
export type PersonKindValue = (typeof personKind.enumValues)[number];

/** `available` · `partial` · `unavailable`. Même règle, même jumelage. */
export type PersonAvailabilityValue =
  (typeof personAvailability.enumValues)[number];

/** Les deux genres, dans l'ordre du schéma — celui que le `select` propose. */
export const PERSON_KIND_VALUES: readonly PersonKindValue[] =
  personKind.enumValues;

/** Les trois disponibilités, dans l'ordre du schéma. */
export const PERSON_AVAILABILITY_VALUES: readonly PersonAvailabilityValue[] =
  personAvailability.enumValues;

/**
 * Les deux mots du genre, tels que l'écran les propose.
 *
 * Ils vivent ici et non dans `lib/format.ts`, hors du périmètre du ticket. Le
 * vocabulaire est celui que la liste et la fiche emploient depuis T5bis.2 —
 * « côté entité » —, et non un troisième.
 */
export const PERSON_KIND_LABEL: Record<PersonKindValue, string> = {
  center: "Membre du centre",
  stakeholder: "Intervenant côté entité",
};

export function isPersonKind(value: string): value is PersonKindValue {
  return (personKind.enumValues as readonly string[]).includes(value);
}

export function isPersonAvailability(
  value: string,
): value is PersonAvailabilityValue {
  return (personAvailability.enumValues as readonly string[]).includes(value);
}

/* ==========================================================================
   Ce que la personne a saisi
   ========================================================================== */

/** Cinq chaînes, jamais un objet métier. */
export type PersonFormValues = {
  /** « Camille Roux ». Obligatoire — `not null`. */
  fullName: string;
  /** Facultatif : une personne hors centre n'a pas de métier design. */
  jobId: string;
  /** Obligatoire — `not null`, et sans valeur par défaut dans le schéma. */
  kind: string;
  /** La courte présentation. Facultative — la colonne est nullable. */
  bio: string;
  /** Facultative, et refusée à un intervenant côté entité (arbitrage (d)). */
  availability: string;
};

export type PersonFormErrors = Partial<Record<keyof PersonFormValues, string>>;

/**
 * L'état que `useActionState` fait circuler entre le panneau et l'action.
 * Il porte les valeurs autant que les erreurs : une saisie refusée revient dans
 * le panneau avec ce qui a été tapé, jamais vidée.
 */
export type PersonFormState = {
  values: PersonFormValues;
  errors: PersonFormErrors;
  /** Un empêchement qui n'appartient à aucun champ : un droit, une ligne rangée. */
  message?: string;
  /** L'écriture a eu lieu : le panneau se referme (TD.2). */
  ok?: boolean;
};

export const EMPTY_PERSON_VALUES: PersonFormValues = {
  fullName: "",
  jobId: "",
  kind: "",
  bio: "",
  availability: "",
};

/**
 * La ligne déjà enregistrée, ramenée aux cinq chaînes du formulaire — le
 * pré-remplissage du panneau en correction.
 *
 * `null` devient `""` : le formulaire ne connaît que des chaînes, et l'absence
 * s'y écrit vide. La règle de `toIndicatorFormValues`.
 */
export function toPersonFormValues(row: {
  fullName: string;
  jobId: string | null;
  kind: PersonKindValue;
  bio: string | null;
  availability: PersonAvailabilityValue | null;
}): PersonFormValues {
  return {
    fullName: row.fullName,
    jobId: row.jobId ?? "",
    kind: row.kind,
    bio: row.bio ?? "",
    availability: row.availability ?? "",
  };
}

/** Le champ, lu et rogné. Absent ou d'un type inattendu, il vaut « vide ». */
function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Les cinq champs du ticket, et eux seuls.
 *
 * L'action ne construit jamais sa ligne par étalement d'un `FormData` : un champ
 * caché ajouté par n'importe qui deviendrait une colonne écrite.
 */
export function readPersonForm(formData: FormData): PersonFormValues {
  return {
    fullName: field(formData, "fullName"),
    jobId: field(formData, "jobId"),
    kind: field(formData, "kind"),
    bio: field(formData, "bio"),
    availability: field(formData, "availability"),
  };
}

/**
 * La forme d'un identifiant, **recopiée plutôt qu'importée**, et c'est un choix.
 *
 * `lib/uuid.ts` est le module des points d'entrée serveur : l'importer ferait
 * entrer dans ce dossier une dépendance qui n'y a rien à faire, et les douze
 * modules voisins tiennent pour règle de ne rien connaître d'autre que du
 * texte. Le motif n'est pas un contrôle de domaine — celui-là vit dans
 * `assertPreconditions`, et il n'est écrit qu'une fois.
 */
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* ==========================================================================
   La validation
   ========================================================================== */

export function validatePersonForm(values: PersonFormValues): PersonFormErrors {
  const errors: PersonFormErrors = {};

  if (!values.fullName) {
    errors.fullName = "Le nom de la personne est obligatoire.";
  }

  /* La liste est fermée, et le second contrôle n'est pas décoratif : le `select`
     ne propose que les deux valeurs de l'énuméré, mais une soumission forgée
     porte ce qu'elle veut, et une valeur hors énuméré rendrait une erreur
     PostgreSQL — un 500 — là où l'on attend un message de champ. */
  if (!values.kind) {
    errors.kind = "Le genre de la personne est obligatoire.";
  } else if (!isPersonKind(values.kind)) {
    errors.kind = "Ce genre de personne n'existe pas.";
  }

  /* Le métier est facultatif ; ce qui ne l'est pas, c'est que ce qui arrive
     **ressemble** à un identifiant. Son appartenance au domaine est une autre
     question, que la couche d'accès tranche à l'écriture. */
  if (values.jobId && !UUID.test(values.jobId)) {
    errors.jobId =
      "Ce métier n'est pas désigné correctement : la saisie n'a pas été enregistrée.";
  }

  /* La disponibilité est facultative, et **elle appartient au centre**
     (arbitrage (d) de C5bis). Le `CHECK` `persons_availability_requires_center`
     dit la même chose en base ; l'y laisser seul rendrait un 500 là où l'on
     attend un message de champ. */
  if (values.availability) {
    if (!isPersonAvailability(values.availability)) {
      errors.availability = "Cette disponibilité n'existe pas.";
    } else if (values.kind !== "center") {
      errors.availability =
        "La disponibilité est une propriété du centre de compétence : un intervenant côté entité n'en porte pas.";
    }
  }

  // `bio` n'est pas validée : un texte libre, nullable en base. Lui imposer une
  // forme serait décider à la place de qui écrit.

  return errors;
}

/* ==========================================================================
   De la saisie aux lignes
   ========================================================================== */

/**
 * Les colonnes de `persons` que ce formulaire écrit, et pas une de plus.
 *
 * `source`, `has_access`, `domain_role` et `is_active` n'y figurent pas : la
 * première est posée par la création, les trois autres appartiennent à
 * l'authentification (C7).
 */
export type PersonRowInput = {
  fullName: string;
  /** `null` quand rien n'est choisi : une personne hors centre n'a pas de métier. */
  jobId: string | null;
  kind: PersonKindValue;
  /** `null` quand rien n'est saisi : la présentation est facultative. */
  bio: string | null;
  /** `null` pour un intervenant côté entité, toujours (arbitrage (d)). */
  availability: PersonAvailabilityValue | null;
};

/**
 * Lit le formulaire, le valide, et rend la ligne prête à écrire.
 *
 * `input` est non nul **si et seulement si** `errors` est vide : la propriété
 * posée en T2.5, qui évite d'affirmer par un `as` un type que la validation
 * venait de prouver. Un `as` tiendrait aujourd'hui et mentirait le jour où une
 * troisième valeur entrerait dans l'un des deux énumérés.
 *
 * Les deux énumérés sont donc **renarrowés** ici plutôt qu'affirmés — la forme
 * exacte de `parseIndicatorForm`. Les rattrapages qui suivent sont
 * inatteignables, `validatePersonForm` ayant déjà posé l'erreur, et ils coûtent
 * quatre lignes : c'est ce qui garantit la propriété ci-dessus **par
 * construction**, plutôt que par la lecture croisée de deux fonctions.
 */
export function parsePersonForm(formData: FormData): {
  values: PersonFormValues;
  errors: PersonFormErrors;
  input: PersonRowInput | null;
} {
  const values = readPersonForm(formData);
  const errors = validatePersonForm(values);

  const kind = isPersonKind(values.kind) ? values.kind : null;
  if (!kind && !errors.kind) errors.kind = "Ce genre de personne n'existe pas.";

  const availability = isPersonAvailability(values.availability)
    ? values.availability
    : null;
  if (values.availability && !availability && !errors.availability) {
    errors.availability = "Cette disponibilité n'existe pas.";
  }

  if (!kind || Object.keys(errors).length > 0) {
    return { values, errors, input: null };
  }

  return {
    values,
    errors,
    input: {
      fullName: values.fullName,
      jobId: valueOrNull(values.jobId),
      kind,
      bio: valueOrNull(values.bio),
      /* La disponibilité tombe avec le genre : un intervenant côté entité n'en
         porte pas, et la validation a déjà refusé qu'on en saisisse une. Le
         `null` explicite est ce qui **efface** celle d'une personne qui passe du
         centre à l'entité — sans lui, la correction laisserait la colonne en
         place et le `CHECK` refuserait l'écriture. */
      availability: kind === "center" ? availability : null,
    },
  };
}
