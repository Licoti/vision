/**
 * Le budget d'un accompagnement : lecture du formulaire, et validation.
 *
 * **Ni base, ni Next, ni React**, comme les douze modules qui le précèdent dans
 * ce dossier. C'est ce qui rend la règle énonçable et vérifiable seule, sans
 * branche Neon ni fixture — et c'est la raison pour laquelle ce fichier existe
 * alors que la fiche de T7.1 ne le nomme pas : la validation d'un budget est
 * une règle de forme, et une règle de forme qui vivrait dans `actions.ts` ne
 * s'éprouverait que contre une base réelle.
 *
 * Ce module ne valide **que la forme** : des montants qui sont des nombres, une
 * date qui existe, un identifiant d'outil qui ressemble à un identifiant, une
 * adresse qui est un lien web. Il ne dit rien de l'existence de l'outil dans le
 * domaine, ni du droit d'écrire sur cet accompagnement : ces questions
 * appartiennent au domaine, donc à l'action et à `lib/db/scoped.ts`. Revérifier
 * ici poserait une seconde autorité, qui divergerait un jour de la première.
 *
 * **Le contrat unique de `docs/02` §5**, et rien de plus : *une synthèse macro
 * — alloué, consommé, date de relevé — et un lien profond vers l'outil de
 * gestion existant.* Vision n'enregistre aucun détail de dépense et aucun
 * historique : le suivi est tenu dans l'outil, elle renvoie vers la source.
 *
 * **Aucun champ n'est obligatoire, et c'est la colonne qui le dit** : sur
 * `budgets`, seul `project_id` est `not null` — et il ne se saisit pas, il est
 * lié côté serveur. `allocated`, `consumed`, `measured_on`, `tool_id` et
 * `external_url` sont toutes nullables. C'est ce qui fait de la **correction**
 * le chemin de rattrapage d'un budget saisi par erreur (arbitrage (c) de
 * `tickets-C7.md`) : `budgets` ne porte pas d'`archived_at`, et
 * `budgets_project_unique` n'est **pas** partiel — « retirer puis ressaisir »
 * y buterait, à la différence du résultat, dont l'unicité partielle de C4bis
 * fait un chemin réel.
 *
 * **`unit` ne se saisit pas.** `budget_unit` n'a qu'une valeur, `days`, et la
 * colonne est `not null` avec ce défaut : un `<select>` d'une seule option
 * n'offre aucun choix, il occupe une ligne. Le jour où l'énuméré en portera une
 * seconde, ce champ arrivera avec elle. Elle se **lit** en revanche dans le
 * bloc, où « 120 » sans unité ne dit rien.
 *
 * **Le contrôle décimal n'est pas réécrit ici** : `isDecimal`, `normalizeDecimal`
 * et `decimalAsTyped` vivent dans `lib/forms/result.ts` et y sont éprouvés. Les
 * deux colonnes sont le **même** `numeric(18,4)` que `results.value`,
 * `indicator_readings.value` et les trois valeurs d'adoption, et quatre copies
 * d'une règle de validation divergent le jour où l'une des précisions bouge.
 * L'import croisé est la règle du dossier, posée en T5.3 : ce qui se recopie
 * ici, ce sont les libellés et les messages ; ce qui s'importe, ce sont les
 * règles.
 *
 * **Aucun des deux montants n'est comparé à l'autre.** Ni « le consommé ne
 * dépasse pas l'alloué », ni reste à consommer, ni pourcentage : ce serait
 * l'indice **calculé par Vision** que D39 interdit, et la fiche de T7.1 le
 * nomme en toutes lettres.
 */

import { isUuid } from "@/lib/uuid";

import { isIsoDay, valueOrNull } from "@/lib/forms/project";
import { isWebUrl } from "@/lib/forms/resource";
import {
  decimalAsTyped,
  isDecimal,
  normalizeDecimal,
} from "@/lib/forms/result";

/* ==========================================================================
   Ce que la personne a saisi
   ========================================================================== */

/** Cinq chaînes, jamais un objet métier. */
export type BudgetFormValues = {
  /** L'enveloppe. Facultative — la colonne est nullable. */
  allocated: string;
  /** Ce qui a été consommé au jour du relevé. Facultatif, même raison. */
  consumed: string;
  /** Le jour du relevé, `YYYY-MM-DD`. Facultatif. */
  measuredOn: string;
  /** L'outil de gestion, dans le référentiel du domaine. Facultatif. */
  toolId: string;
  /** Le lien profond vers le suivi, dans cet outil. Facultatif. */
  externalUrl: string;
};

export type BudgetFormErrors = Partial<Record<keyof BudgetFormValues, string>>;

/**
 * L'état que `useActionState` fait circuler entre le panneau et l'action.
 * Il porte les valeurs autant que les erreurs : une saisie refusée revient dans
 * le panneau avec ce qui a été tapé, jamais vidée.
 */
export type BudgetFormState = {
  values: BudgetFormValues;
  errors: BudgetFormErrors;
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

export const EMPTY_BUDGET_VALUES: BudgetFormValues = {
  allocated: "",
  consumed: "",
  measuredOn: "",
  toolId: "",
  externalUrl: "",
};

/**
 * Le budget déjà enregistré, ramené aux cinq chaînes du formulaire — le
 * pré-remplissage du panneau en correction.
 *
 * Jumeau de `toResultFormValues` (T4bis.6), `toAdoptionFormValues` (T5.4) et
 * `toLinkFormValues` (T6.5) : le panneau reçoit des **valeurs de formulaire**,
 * jamais une ligne de base. C'est ce qui laisse un refus les remplacer sans que
 * rien ne change de forme entre les deux chemins.
 *
 * Les deux montants passent par `decimalAsTyped` : la colonne rend « 120.0000 »,
 * et le poser tel quel dans le champ serait une invitation à retaper une valeur
 * que personne n'a écrite ainsi. `null` devient `""` : le formulaire ne connaît
 * que des chaînes, et l'absence s'y écrit vide.
 *
 * **La forme du paramètre est celle de `ProjectBudget`** (`lib/queries/budgets.ts`),
 * déjà lue par le panneau : la correction n'ajoute aucune lecture de plus.
 * `unit` n'y figure pas — le formulaire ne la saisit pas.
 */
export function toBudgetFormValues(row: {
  allocated: string | null;
  consumed: string | null;
  measuredOn: string | null;
  toolId: string | null;
  externalUrl: string | null;
}): BudgetFormValues {
  return {
    allocated: row.allocated === null ? "" : decimalAsTyped(row.allocated),
    consumed: row.consumed === null ? "" : decimalAsTyped(row.consumed),
    measuredOn: row.measuredOn ?? "",
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
 * caché ajouté par n'importe qui deviendrait une colonne écrite. `projectId` ne
 * se lit pas ici — il est lié côté serveur ; `unit` non plus — elle garde son
 * défaut `days`, faute d'un second membre à l'énuméré.
 */
export function readBudgetForm(formData: FormData): BudgetFormValues {
  return {
    allocated: field(formData, "allocated"),
    consumed: field(formData, "consumed"),
    measuredOn: field(formData, "measuredOn"),
    toolId: field(formData, "toolId"),
    externalUrl: field(formData, "externalUrl"),
  };
}

/* ==========================================================================
   La validation
   ========================================================================== */

/**
 * Le message d'un montant qui n'est pas un nombre — **une phrase, deux
 * champs**. Les deux colonnes ont la même règle ; leur donner deux messages
 * différents laisserait croire à deux règles. C'est la forme de `NOT_A_NUMBER`
 * dans `lib/forms/adoption.ts`, resservie pour la même raison.
 */
const NOT_A_NUMBER =
  "Le montant doit être un nombre : 120, 87,5 — sans séparateur de milliers.";

export function validateBudgetForm(values: BudgetFormValues): BudgetFormErrors {
  const errors: BudgetFormErrors = {};

  /* Facultatifs tous les deux — les colonnes sont nullables. Saisis, ils
     doivent être des nombres : la colonne est un `numeric`, et une chaîne
     quelconque y produirait une erreur PostgreSQL, donc un 500, là où l'on
     attend un message de champ.

     **Aucun des deux n'est comparé à l'autre** : « consommé au-delà de
     l'alloué » serait un jugement porté par Vision sur des chiffres qu'elle n'a
     pas produits, et un dépassement est un fait que l'outil de gestion connaît
     avant elle. */
  if (values.allocated && !isDecimal(values.allocated)) {
    errors.allocated = NOT_A_NUMBER;
  }
  if (values.consumed && !isDecimal(values.consumed)) {
    errors.consumed = NOT_A_NUMBER;
  }

  /* La date du **relevé**, pas celle de la saisie : Vision ne fabrique aucune
     date (arbitrage de T3.3, tenu depuis). D39 n'autorise une valeur reportée
     d'un outil externe qu'**avec sa date** ; celle-ci reste pourtant
     facultative, la colonne l'étant — un budget alloué sans relevé est un cas
     normal, et c'est le consommé qui appelle une date. */
  if (values.measuredOn && !isIsoDay(values.measuredOn)) {
    errors.measuredOn = "Cette date de relevé n'existe pas.";
  }

  // La forme est vérifiée avant la base, pour la raison exposée dans
  // `lib/uuid.ts` : une colonne `uuid` interrogée avec n'importe quoi rend une
  // erreur PostgreSQL, donc un 500, là où l'on attend un message de champ.
  if (values.toolId && !isUuid(values.toolId)) {
    errors.toolId = "Cet outil n'est pas reconnu.";
  }

  // Le même contrôle que pour l'adresse d'une ressource et le lien profond d'un
  // résultat, et pour la même raison : le bloc rend ce lien par `ExternalLink`,
  // qui pose le `href` tel quel. Une adresse `javascript:` enregistrée
  // s'exécuterait au clic. L'écriture est le seul endroit où l'on décide encore
  // de ce qui entre.
  if (values.externalUrl && !isWebUrl(values.externalUrl)) {
    errors.externalUrl =
      "Cette adresse n'est pas un lien web : elle doit commencer par http:// ou https://.";
  }

  return errors;
}

/* ==========================================================================
   De la saisie à la ligne
   ========================================================================== */

/**
 * Les colonnes de `budgets` que ce formulaire écrit, et pas une de plus.
 *
 * `projectId` n'y figure pas : il est lié côté serveur par l'action, jamais
 * transmis par un champ. `unit` non plus — elle garde son défaut.
 *
 * **Les cinq sont `| null`, et c'est ce qui fait la correction.** Vider un champ
 * doit effacer la colonne, non la laisser en place : sans quoi un montant saisi
 * par erreur ne se retirerait jamais, `budgets` n'ayant ni archivage ni
 * suppression (arbitrage (c)).
 */
export type BudgetRowInput = {
  allocated: string | null;
  consumed: string | null;
  measuredOn: string | null;
  toolId: string | null;
  externalUrl: string | null;
};

/** Point décimal pour la colonne, ou `null` quand le champ est vide. */
function decimalOrNull(value: string): string | null {
  const kept = valueOrNull(value);
  return kept === null ? null : normalizeDecimal(kept);
}

/**
 * Lit le formulaire, le valide, et rend la ligne prête à écrire.
 *
 * `input` est non nul **si et seulement si** `errors` est vide : la propriété
 * posée en T2.5, tenue depuis.
 *
 * Les montants partent **normalisés** — point décimal, comme la colonne
 * l'attend — et non tels qu'ils ont été tapés. Les valeurs rendues au panneau en
 * cas de refus restent, elles, celles de la personne : `values` et `input` ne
 * servent pas le même propos.
 *
 * **Un formulaire entièrement vide est une saisie valide**, et c'est voulu : la
 * ligne existe alors avec ses cinq colonnes nulles, et le bloc dit « Non
 * renseigné » quatre fois. C'est aussi le seul chemin qui **défait** une saisie
 * faite par erreur, puisque le budget ne se retire pas.
 */
export function parseBudgetForm(formData: FormData): {
  values: BudgetFormValues;
  errors: BudgetFormErrors;
  input: BudgetRowInput | null;
} {
  const values = readBudgetForm(formData);
  const errors = validateBudgetForm(values);

  if (Object.keys(errors).length > 0) {
    return { values, errors, input: null };
  }

  return {
    values,
    errors,
    input: {
      allocated: decimalOrNull(values.allocated),
      consumed: decimalOrNull(values.consumed),
      measuredOn: valueOrNull(values.measuredOn),
      toolId: valueOrNull(values.toolId),
      externalUrl: valueOrNull(values.externalUrl),
    },
  };
}
