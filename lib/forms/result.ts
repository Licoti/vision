/**
 * La saisie d'un résultat : lecture du formulaire, et validation.
 *
 * **Ni base, ni Next, ni React**, comme les quatre modules qui le précèdent
 * dans ce dossier. C'est ce qui rend la règle énonçable et vérifiable seule,
 * sans branche Neon ni fixture.
 *
 * Ce module ne valide **que la forme** : un libellé non vide, une date qui
 * existe, une valeur qui est un nombre quand elle est saisie, un identifiant
 * d'outil qui ressemble à un identifiant, une adresse qui est un lien web. Il
 * ne dit rien de l'existence de l'outil dans le domaine, ni de l'état de
 * l'activité visée : ces questions appartiennent au domaine, donc à l'action et
 * à `lib/db/scoped.ts`. Revérifier ici poserait une seconde autorité, qui
 * divergerait un jour de la première.
 *
 * **Le contrat unique de `docs/02` §5**, et rien de plus : un libellé, une
 * valeur, une unité, une date, un lien profond — plus l'outil qui l'a produit.
 * Vision n'enregistre jamais le détail des constats : il vit dans l'outil.
 *
 * **Ce qui est obligatoire l'est parce que la colonne l'est** (arbitrage du
 * 14/08/2026) : `label` et `measured_on` sont `not null`, `value`, `unit`,
 * `tool_id` et `external_url` ne le sont pas. Un audit peut porter un constat
 * sans chiffre, et `formatResultValue` rend déjà `null` dans ce cas depuis
 * T4.3 — la lecture savait faire avant que l'écriture n'existe.
 *
 * **Niveau 1 de `docs/03` §5, et lui seul** (D15) : la valeur se saisit, elle
 * ne se demande pas à l'outil. Rien ici n'appelle l'adresse — ni vérification,
 * ni aperçu, ni pré-remplissage. L'analyse ci-dessous est celle d'une chaîne de
 * caractères, et elle ne quitte pas le processus.
 */

import { isWebUrl } from "@/lib/forms/resource";
import { isIsoDay, valueOrNull } from "@/lib/forms/project";
import { isUuid } from "@/lib/uuid";

/* ==========================================================================
   Ce que la personne a saisi
   ========================================================================== */

/** Six chaînes, jamais un objet métier. */
export type ResultFormValues = {
  /** « Score d'audit UX », « Taux de conformité ». Obligatoire — `not null`. */
  label: string;
  /** Le chiffre reporté. Facultatif, mais un nombre s'il est là. */
  value: string;
  /** « /100 », « % », « s ». Texte libre : aucun référentiel d'unités. */
  unit: string;
  /** La date de la mesure, `YYYY-MM-DD`. Obligatoire — `not null`. */
  measuredOn: string;
  /** L'outil du référentiel qui a produit la valeur. Facultatif. */
  toolId: string;
  /** Le lien profond vers le rapport. Facultatif — T4.3 en fait un cas normal. */
  externalUrl: string;
};

export type ResultFormErrors = Partial<Record<keyof ResultFormValues, string>>;

/**
 * L'état que `useActionState` fait circuler entre le panneau et l'action.
 * Il porte les valeurs autant que les erreurs : une saisie refusée revient dans
 * le panneau avec ce qui a été tapé, jamais vidée.
 */
export type ResultFormState = {
  values: ResultFormValues;
  errors: ResultFormErrors;
  /** Un empêchement qui n'appartient à aucun champ : un droit, un état. */
  message?: string;
};

export const EMPTY_RESULT_VALUES: ResultFormValues = {
  label: "",
  value: "",
  unit: "",
  measuredOn: "",
  toolId: "",
  externalUrl: "",
};

/* ==========================================================================
   De la ligne à la saisie — T4bis.6

   Le chemin inverse de `parseResultForm`, et le jumeau de
   `toResourceFormValues` : un seul panneau sert la saisie et la correction, et
   la correction a besoin de la ligne existante sous forme de six chaînes.
   ========================================================================== */

/**
 * La valeur telle qu'elle se **retape**, et non telle que la colonne la rend.
 *
 * `numeric(18, 4)` rend « 62.0000 » au pilote, jamais « 62 » : posé tel quel
 * dans le champ, ce serait une invitation à retaper une valeur que personne n'a
 * écrite ainsi. Les zéros décimaux non significatifs sont donc rognés, et le
 * point décimal disparaît avec eux quand il ne sépare plus rien.
 *
 * **Le point est conservé, jamais changé en virgule** : ce module ne connaît
 * aucune locale — c'est `lib/format.ts` qui la porte, et l'importer ici pour un
 * champ de formulaire mettrait une règle d'affichage dans un module qui n'en a
 * pas. La virgule reste acceptée en saisie, elle n'est pas produite.
 *
 * **Le tour est exact** : ce qui est réaffiché passe `validateResultForm` sans
 * modification et réécrit la même valeur — la propriété qui fait qu'une
 * re-soumission à l'identique ne change rien, et qu'un test éprouve.
 *
 * **Exportée depuis T5.3**, pour `lib/forms/reading.ts` : `indicator_readings.value`
 * est le **même** `numeric(18,4)`, et le pilote lui rend « 71.0000 » de la même
 * façon. Recopier ces sept lignes aurait posé une seconde règle de réaffichage,
 * qui divergerait un jour de celle-ci — le danger que l'en-tête de ce module
 * nomme déjà pour la validation.
 */
export function decimalAsTyped(value: string): string {
  if (!value.includes(".")) return value;
  return value.replace(/\.?0+$/, "") || "0";
}

/**
 * La ligne lue, rendue au panneau. `null` devient `""` : le formulaire ne
 * connaît que des chaînes, et l'absence s'y écrit vide.
 *
 * La forme du paramètre est celle d'`ActivityResult` (`lib/queries/activities.ts`),
 * ce que la roadmap a déjà lu pour l'écran : la correction n'ajoute **aucune
 * lecture en base**.
 */
export function toResultFormValues(row: {
  label: string;
  value: string | null;
  unit: string | null;
  measuredOn: string;
  toolId: string | null;
  externalUrl: string | null;
}): ResultFormValues {
  return {
    label: row.label,
    value: row.value === null ? "" : decimalAsTyped(row.value),
    unit: row.unit ?? "",
    measuredOn: row.measuredOn,
    toolId: row.toolId ?? "",
    externalUrl: row.externalUrl ?? "",
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
 * caché ajouté par n'importe qui deviendrait une colonne écrite. `activityId`
 * ne se lit pas ici — il est lié côté serveur ; `externalRef`, `syncMode` et
 * `syncedAt` non plus — ces colonnes existent pour éviter une migration le jour
 * de l'API, elles ne portent aucun geste au POC, et la fiche les interdit.
 */
export function readResultForm(formData: FormData): ResultFormValues {
  return {
    label: field(formData, "label"),
    value: field(formData, "value"),
    unit: field(formData, "unit"),
    measuredOn: field(formData, "measuredOn"),
    toolId: field(formData, "toolId"),
    externalUrl: field(formData, "externalUrl"),
  };
}

/* ==========================================================================
   Le nombre

   `results.value` est un `numeric(18,4)`, et PostgreSQL veut un point décimal.
   **La virgule est pourtant acceptée**, et normalisée ici : `formatResultValue`
   rend « 62,5 » à l'écran depuis T4.3, et refuser en saisie ce que l'écran
   affiche juste à côté serait un piège tendu à la personne qui recopie ce
   qu'elle voit.

   Une seule virgule vaut séparateur décimal. Aucun séparateur de milliers
   n'est toléré : « 1 234 » et « 1,234 » sont ambigus entre les langues, et une
   valeur d'audit n'en a pas besoin.

   **Le contrôle est une forme, pas un `Number`**, et le détour est motivé :
   `Number` accepte « 0x10 », « 1e5 » et « Infinity », qu'une colonne `numeric`
   refuse. Valider par `Number` puis écrire la chaîne telle quelle aurait donc
   rendu une erreur PostgreSQL — un 500 — sur une soumission forgée, là où l'on
   attend un message de champ. Ce qui est accepté ici est **exactement** ce que
   la colonne accepte.

   `numeric(18, 4)` : quatre décimales, donc quatorze chiffres avant la virgule.
   Au-delà, PostgreSQL lève plutôt qu'il n'arrondit — la partie entière se
   compte donc ici. Les décimales, elles, sont arrondies par la colonne et n'ont
   rien à refuser.
   ========================================================================== */

/** Signe, partie entière, séparateur décimal — rien d'autre. */
const DECIMAL_FORM = /^-?(?:\d+|\d*[.,]\d+)$/;

/** `18 - 4` : la précision de la colonne, moins son échelle. */
const MAX_INTEGER_DIGITS = 14;

export function normalizeDecimal(value: string): string {
  return value.replace(",", ".");
}

/**
 * **Exportée depuis T5.3**, pour `lib/forms/reading.ts`. Ce que cette fonction
 * accepte est **exactement** ce qu'une colonne `numeric(18,4)` accepte, et
 * `indicator_readings.value` en est une, à l'identique de `results.value`. Une
 * copie aurait posé la seconde autorité que l'en-tête de ce module refuse : le
 * jour où la précision d'une des deux colonnes bougerait, une seule des deux
 * copies le saurait.
 */
export function isDecimal(value: string): boolean {
  if (!DECIMAL_FORM.test(value)) return false;

  const [integer = ""] = normalizeDecimal(value).replace("-", "").split(".");
  return integer.length <= MAX_INTEGER_DIGITS;
}

/* ==========================================================================
   La validation
   ========================================================================== */

export function validateResultForm(values: ResultFormValues): ResultFormErrors {
  const errors: ResultFormErrors = {};

  if (!values.label) {
    errors.label = "Le libellé du résultat est obligatoire.";
  }

  // Facultative — la colonne est nullable, et un constat sans chiffre reste un
  // résultat. Saisie, elle doit être un nombre : la colonne est `numeric`, et
  // une chaîne quelconque y produirait une erreur PostgreSQL, donc un 500, là
  // où l'on attend un message de champ.
  if (values.value && !isDecimal(values.value)) {
    errors.value =
      "La valeur doit être un nombre : 62, 68,5 — sans séparateur de milliers.";
  }

  if (!values.measuredOn) {
    errors.measuredOn = "La date de mesure est obligatoire.";
  } else if (!isIsoDay(values.measuredOn)) {
    errors.measuredOn = "Cette date de mesure n'existe pas.";
  }

  // La forme est vérifiée avant la base, pour la raison exposée dans
  // `lib/uuid.ts` : une colonne `uuid` interrogée avec n'importe quoi rend une
  // erreur PostgreSQL, donc un 500, là où l'on attend un message de champ.
  if (values.toolId && !isUuid(values.toolId)) {
    errors.toolId = "Cet outil n'est pas reconnu.";
  }

  // Le même contrôle que pour l'adresse d'une ressource, et pour la même
  // raison : `Result` rend ce lien par `ExternalLink`, qui pose le `href` tel
  // quel. Une adresse `javascript:` enregistrée s'exécuterait au clic sur le
  // libellé du résultat. L'écriture est le seul endroit où l'on décide encore
  // de ce qui entre.
  if (values.externalUrl && !isWebUrl(values.externalUrl)) {
    errors.externalUrl =
      "Cette adresse n'est pas un lien web : elle doit commencer par http:// ou https://.";
  }

  return errors;
}

/* ==========================================================================
   De la saisie aux lignes
   ========================================================================== */

/**
 * Les colonnes de `results` que ce formulaire écrit, et pas une de plus.
 *
 * `activityId` n'y figure pas : il est lié côté serveur par l'action, jamais
 * transmis par un champ. `externalRef`, `syncMode` et `syncedAt` non plus —
 * hors périmètre du POC.
 */
export type ResultRowInput = {
  label: string;
  /** `null` quand rien n'est saisi : la colonne est nullable. */
  value: string | null;
  unit: string | null;
  measuredOn: string;
  toolId: string | null;
  externalUrl: string | null;
};

/**
 * Lit le formulaire, le valide, et rend la ligne prête à écrire.
 *
 * `input` est non nul **si et seulement si** `errors` est vide : la propriété
 * posée en T2.5, qui évite d'affirmer par un `as` un type que la validation
 * venait de prouver.
 *
 * La valeur part **normalisée** — point décimal, comme la colonne l'attend — et
 * non telle qu'elle a été tapée. Les valeurs rendues au panneau en cas de refus
 * restent, elles, celles de la personne : `values` et `input` ne servent pas le
 * même propos.
 */
export function parseResultForm(formData: FormData): {
  values: ResultFormValues;
  errors: ResultFormErrors;
  input: ResultRowInput | null;
} {
  const values = readResultForm(formData);
  const errors = validateResultForm(values);

  if (Object.keys(errors).length > 0) {
    return { values, errors, input: null };
  }

  return {
    values,
    errors,
    input: {
      label: values.label,
      value: values.value ? normalizeDecimal(values.value) : null,
      unit: valueOrNull(values.unit),
      measuredOn: values.measuredOn,
      toolId: valueOrNull(values.toolId),
      externalUrl: valueOrNull(values.externalUrl),
    },
  };
}
