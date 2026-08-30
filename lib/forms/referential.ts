/**
 * La saisie d'une **ligne de référentiel** : lecture du formulaire, et
 * validation (T7.3).
 *
 * **Ni base, ni Next, ni React**, comme les seize modules voisins de ce dossier.
 * C'est ce qui rend la règle énonçable et vérifiable seule, sans branche Neon ni
 * fixture.
 *
 * **Un module pour quatre tables, à rebours de l'écriture.** `lib/forms/` décrit
 * une **forme**, et les quatre référentiels simples ont la même : un libellé, un
 * ordre, plus un rang pour l'échelle de maîtrise. C'est l'écriture que la fiche
 * de T7.3 refuse de rendre générique, pas la lecture d'un `FormData` — celle-ci
 * ne pose aucun domaine, ne touche aucune table et ne décide d'aucun droit.
 *
 * **Les quatre référentiels porteurs de logique n'entrent pas ici** (T7.4), et
 * c'est la même règle appliquée à l'envers : ils n'ont pas cette forme. Une
 * piste de démarrage porte six champs, un type d'activité une case et deux
 * énumérés. Étendre `ReferentialShape` à douze drapeaux aurait fait de ce module
 * et de son panneau la « phrase à trous » que le dépôt refuse depuis T5.1 — une
 * forme qu'on ne peut plus relire dans aucun de ses états. Ils ont donc chacun
 * leur module, et ils **réemploient** d'ici ce qui est vraiment commun :
 * `referentialField`, `validatePosition`, `toPositionValue`,
 * `sameReferentialLabel`.
 *
 * **`lib/forms/entity.ts` reste à part**, et ce n'est pas une distraction : les
 * entités ne saisissent pas leur `position` — aucun écran ne la lit —, si bien
 * que leur formulaire n'a qu'un champ. Les replier ensemble aurait demandé
 * d'ouvrir un fichier hors du périmètre du ticket pour y retirer un champ que
 * personne ne demande.
 *
 * **La forme du référentiel ne se déduit pas de la ligne, elle se déclare.**
 * `ReferentialShape` dit quels champs le formulaire porte ; l'appelant le sait,
 * parce qu'il a nommé sa table. Deviner ici demanderait de connaître les tables,
 * ce que ce dossier s'interdit.
 *
 * **Ce module ne valide que la forme** : un libellé non vide, un nombre dans les
 * bornes de sa colonne. Il ne dit rien de l'unicité du libellé dans le domaine —
 * cette question demande de lire la base, elle appartient donc à l'action.
 * Revérifier ici poserait une seconde autorité, qui divergerait un jour de la
 * première : la règle tenue par `lib/forms/person.ts` pour l'appartenance d'un
 * métier au domaine.
 */

/** Ce que la personne a saisi, tel quel — des chaînes, jamais un objet métier. */
export type ReferentialFormValues = {
  /** « UX Research ». Obligatoire — `not null`. */
  label: string;
  /** L'ordre d'affichage, en toutes lettres. Vide là où il ne se saisit pas. */
  position: string;
  /** Le rang de l'échelle de maîtrise. Vide pour les trois autres. */
  rank: string;
};

export type ReferentialFormErrors = Partial<
  Record<keyof ReferentialFormValues, string>
>;

/**
 * L'état que `useActionState` fait circuler entre le panneau et l'action.
 * Il porte les valeurs autant que les erreurs : une saisie refusée revient dans
 * le panneau avec ce qui a été tapé, jamais vidée.
 */
export type ReferentialFormState = {
  values: ReferentialFormValues;
  errors: ReferentialFormErrors;
  /** Un empêchement qui n'appartient à aucun champ : un droit, une ligne rangée. */
  message?: string;
  /** L'écriture a eu lieu : le panneau se referme (TD.2). */
  ok?: boolean;
};

/**
 * Les champs que le formulaire porte, au-delà du libellé.
 *
 * **Aucun référentiel ne porte les deux**, et c'est une propriété du schéma
 * lue plutôt qu'une règle inventée : `jobs`, `approaches` et `skills` sont
 * ordonnés par `position` dans les onze lectures qui les servent ;
 * `skill_levels` l'est par `rank` dans les quatre qui le servent, et sa
 * `position` n'a aucun lecteur. Saisir un champ que rien ne lit est ce que
 * l'arbitrage (i) de `tickets-C7.md` refuse — la leçon de T5.2, resservie.
 */
export type ReferentialShape = { position: boolean; rank: boolean };

export const ORDERED_BY_POSITION: ReferentialShape = {
  position: true,
  rank: false,
};

export const ORDERED_BY_RANK: ReferentialShape = {
  position: false,
  rank: true,
};

export const EMPTY_REFERENTIAL_VALUES: ReferentialFormValues = {
  label: "",
  position: "0",
  rank: "",
};

/**
 * La ligne déjà enregistrée, ramenée aux chaînes du formulaire — le
 * pré-remplissage du panneau en correction.
 *
 * `position` revient de la base en `numeric` — donc en chaîne, « 30.00 » — et
 * elle est rendue telle quelle : la reformater ferait dire au champ autre chose
 * que ce qui est écrit en base, et une correction qui ne touche pas ce champ
 * réécrirait pourtant sa valeur.
 */
export function toReferentialFormValues(row: {
  label: string;
  position?: string | null;
  rank?: number | null;
}): ReferentialFormValues {
  return {
    label: row.label,
    position: row.position ?? "",
    rank: row.rank === null || row.rank === undefined ? "" : String(row.rank),
  };
}

/**
 * Un champ, lu et rogné. Absent ou d'un type inattendu, il vaut « vide ».
 *
 * **Exportée en T7.4**, comme les deux règles d'ordre : les quatre modules des
 * référentiels porteurs de logique lisent leurs champs de la même façon, et une
 * cinquième copie de ces trois lignes n'aurait rien dit de plus.
 */
export function referentialField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Les trois champs de ce formulaire, et pas un de plus.
 *
 * L'action ne construit jamais sa ligne par étalement d'un `FormData` : un champ
 * caché ajouté par n'importe qui deviendrait une colonne écrite — et
 * `archived_at` est précisément la colonne qu'un tel champ atteindrait.
 */
export function readReferentialForm(formData: FormData): ReferentialFormValues {
  return {
    label: referentialField(formData, "label"),
    position: referentialField(formData, "position"),
    rank: referentialField(formData, "rank"),
  };
}

/* ==========================================================================
   La validation
   ========================================================================== */

/**
 * La borne haute de `numeric(10, 2)` : dix chiffres dont deux décimales.
 *
 * Elle est ici pour que le refus se dise en français, dans le champ, plutôt
 * qu'en `numeric field overflow` — c'est-à-dire en 500. La règle du dépôt depuis
 * l'unicité de libellé des entités : ce que la base sait refuser, l'action le
 * refuse d'abord, et mieux.
 */
const POSITION_MAX = 99_999_999.99;

/** Les bornes du `smallint` de `skill_levels.rank`, même raison. */
const RANK_MIN = 1;
const RANK_MAX = 32_767;

/** « 12 », « 12.5 », « 12,5 » — et rien d'autre. */
const NUMBER = /^\d+(?:[.,]\d{1,2})?$/;

/**
 * La règle de l'ordre, énoncée une fois pour les **sept** référentiels qui en
 * portent un.
 *
 * **Exportée en T7.4**, où quatre modules de formulaire de plus en ont eu
 * besoin — un statut, un type d'activité et une piste ont chacun leur
 * `position`, dans un `numeric(10, 2)` identique. Une seconde écriture de ces
 * trois refus aurait divergé le jour où l'un d'eux changerait, et c'est celle
 * qu'on aurait oublié de corriger qui aurait laissé passer un 500.
 *
 * Elle rend `undefined` quand la valeur passe — la forme d'`isWebUrl`, à ceci
 * près qu'elle porte aussi la phrase du refus : trois messages français ne se
 * recopient pas mieux qu'un booléen.
 */
export function validatePosition(value: string): string | undefined {
  if (!value) return "La position est obligatoire.";
  if (!NUMBER.test(value)) {
    return "La position est un nombre positif, avec deux décimales au plus.";
  }
  if (toNumber(value) > POSITION_MAX) {
    return "La position ne peut pas dépasser 99 999 999,99.";
  }
  return undefined;
}

/**
 * La saisie rendue à PostgreSQL : la virgule française devient un point.
 *
 * La colonne est un `numeric`, pas un texte localisé — et « 12,5 » y entrerait
 * en erreur de syntaxe, donc en 500. Jumelle de `validatePosition`, exportée
 * pour la même raison.
 */
export function toPositionValue(value: string): string {
  return value.replace(",", ".");
}

export function validateReferentialForm(
  values: ReferentialFormValues,
  shape: ReferentialShape,
): ReferentialFormErrors {
  const errors: ReferentialFormErrors = {};

  if (!values.label) {
    errors.label = "Le libellé est obligatoire.";
  }

  /* Aucune longueur maximale : la colonne est un `text` sans contrainte, et en
     inventer une ici serait une règle produit que ni `docs/02` ni `docs/04` ne
     portent — la règle de `lib/forms/vision.ts`. */

  if (shape.position) {
    const refusal = validatePosition(values.position);
    if (refusal) errors.position = refusal;
  }

  if (shape.rank) {
    if (!values.rank) {
      errors.rank = "Le rang est obligatoire.";
    } else if (!/^\d+$/.test(values.rank)) {
      errors.rank = "Le rang est un nombre entier.";
    } else {
      const rank = Number(values.rank);
      if (rank < RANK_MIN || rank > RANK_MAX) {
        errors.rank = "Le rang est compris entre 1 et 32 767.";
      }
    }
  }

  /* **Aucune unicité sur le rang**, et c'est le schéma qui le dit : « une
     contrainte non demandée contraindrait l'écran de gestion dû à C7 ». Deux
     niveaux au même rang se trient ensuite par libellé, ce que
     `listReferentialForAdmin` fait déjà. */

  return errors;
}

/** « 12,5 » et « 12.5 » désignent le même ordre : la virgule est française. */
function toNumber(value: string): number {
  return Number(value.replace(",", "."));
}

/* ==========================================================================
   De la saisie à la ligne
   ========================================================================== */

/**
 * Les colonnes que ce formulaire écrit, et pas une de plus.
 *
 * `archived_at` n'appartient qu'à `archive()` et `restore()` ; `domain_id`,
 * `created_by` et les estampilles sont posés par `lib/db/scoped.ts`, l'appelant
 * n'y pense pas. Les deux champs facultatifs sont **absents** plutôt que nuls
 * quand le référentiel ne les porte pas : une colonne qu'on n'écrit pas garde sa
 * valeur, et `position` est `not null`.
 */
export type ReferentialRowInput = {
  label: string;
  position?: string;
  rank?: number;
};

/**
 * Lit le formulaire, le valide, et rend la ligne prête à écrire.
 *
 * `input` est non nul **si et seulement si** `errors` est vide : la propriété
 * posée en T2.5 et tenue par les seize modules de ce dossier.
 */
export function parseReferentialForm(
  formData: FormData,
  shape: ReferentialShape,
): {
  values: ReferentialFormValues;
  errors: ReferentialFormErrors;
  input: ReferentialRowInput | null;
} {
  const values = readReferentialForm(formData);
  const errors = validateReferentialForm(values, shape);

  if (Object.keys(errors).length > 0) {
    return { values, errors, input: null };
  }

  return {
    values,
    errors,
    input: {
      label: values.label,
      ...(shape.position ? { position: toPositionValue(values.position) } : {}),
      ...(shape.rank ? { rank: Number(values.rank) } : {}),
    },
  };
}

/**
 * Deux libellés désignent-ils la même ligne de référentiel ?
 *
 * **La casse et les accents ne distinguent pas** : « UX Design » et « ux
 * design » sont le même métier, et le second n'est qu'une faute de frappe du
 * premier. C'est la comparaison qu'emploient les huit actions de création et de
 * correction pour refuser un doublon — le point ouvert d'`ETAT.md` sur
 * l'amorçage, où un renommage a créé une seconde ligne sous l'ancien nom.
 *
 * Elle vit ici plutôt que dans l'action parce que c'est une règle de **forme**,
 * énonçable et testable sans base. L'action fournit les libellés, ce module dit
 * s'ils se confondent.
 *
 * `localeCompare` avec `sensitivity: "base"` plutôt qu'un `toLowerCase()` : il
 * range aussi « Accessibilité » et « Accessibilite » ensemble, ce qu'un
 * abaissement de casse ne fait pas.
 *
 * **Jumelle de `sameEntityLabel`** (`lib/forms/entity.ts`), à replier avec elle
 * le jour où ce fichier-là s'ouvrira : le périmètre de T7.3 ne l'ouvre pas.
 */
export function sameReferentialLabel(one: string, other: string): boolean {
  return (
    one.trim().localeCompare(other.trim(), "fr", { sensitivity: "base" }) === 0
  );
}
