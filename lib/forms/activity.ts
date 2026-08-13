/**
 * La saisie d'une activité : lecture du formulaire, validation, et **la seule
 * logique neuve de C3** — la dérivation de l'état à partir de la période.
 *
 * **Ni base, ni Next, ni React**, comme `lib/forms/product.ts` et
 * `lib/forms/project.ts`. C'est ce qui rend la règle énonçable et vérifiable
 * seule, sans branche Neon ni fixture — et la dérivation, plus que toute autre
 * règle du produit, avait besoin de l'être.
 *
 * Ce module ne valide **que la forme** : un type présent, des identifiants qui
 * ressemblent à des identifiants, des dates qui existent, une période qui se
 * tient. Il ne dit rien de l'existence du type ou de l'approche dans le
 * domaine : cette question appartient au domaine, donc à `lib/db/scoped.ts`.
 *
 * ## L'état ne se saisit pas
 *
 * `docs/06` §9 : « état pré-rempli selon la date ». Le formulaire ne porte donc
 * aucun choix d'état, et la correction à la main est le geste de T3.5.
 *
 * **Vision ne fabrique aucune date** (arbitrage du 13/08/2026). Une borne
 * absente le reste : elle n'est jamais complétée au 1er ou au 31 du mois pour
 * faire tenir une règle. Deux propriétés en découlent, et ce sont elles qui
 * portent le ticket :
 *
 * - `done` n'est dérivé que d'une période dont la **fin est saisie**, donc
 *   `activities_done_requires_period_end` ne peut pas être violée ;
 * - `planned` n'est dérivé que d'un **début saisi** ou de la case « à
 *   planifier », donc `activities_planned_requires_period_or_unscheduled` ne
 *   peut pas l'être non plus.
 *
 * Les deux contraintes `CHECK` du schéma tiennent **par construction**, jamais
 * par un rattrapage. C'est aussi pourquoi une fin de période sans début est
 * refusée plutôt que dérivée : une fin seule à venir n'a pas d'état légal.
 *
 * ## L'édition ne redérive pas toujours — T3.4
 *
 * Arbitrage du 13/08/2026, point (c), rendu d'avance pour ce ticket :
 * **l'état n'est redérivé que si la période a bougé.** Corriger un objectif, un
 * type ou une approche ne dit rien de l'état ; déplacer une période, si. Sans
 * cette règle, T3.4 déferait en silence la correction manuelle de T3.5, et le
 * défaut ne se verrait qu'en T3.5 — donc en reprise de T3.4.
 *
 * Les deux propriétés ci-dessus survivent à l'édition, et il vaut de dire
 * pourquoi : une période inchangée garde l'état **qui était déjà en base avec
 * elle**, donc une combinaison que les `CHECK` ont déjà acceptée ; une période
 * modifiée repasse entièrement par la dérivation. Aucun chemin ne fabrique un
 * couple neuf.
 */

import { activityState } from "@/lib/db/schema";
import { isIsoDay, valueOrNull } from "@/lib/forms/project";
import { isUuid } from "@/lib/uuid";

/** `planned` · `in_progress` · `done` · `cancelled`. Dérivé du schéma (D43). */
export type ActivityState = (typeof activityState.enumValues)[number];

/* ==========================================================================
   Ce que la personne a saisi
   ========================================================================== */

/** Des chaînes, et une case. Jamais un état, jamais un objet métier. */
export type ActivityFormValues = {
  activityTypeId: string;
  /** D14 — la case qui remplace la période, et non un cinquième état. */
  isUnscheduled: boolean;
  /** Colonnes `date` : `YYYY-MM-DD`, telles que les rend `input type="date"`. */
  periodStart: string;
  periodEnd: string;
  approachId: string;
  objective: string;
};

export type ActivityFormErrors = Partial<
  Record<keyof ActivityFormValues, string>
>;

/**
 * L'état que `useActionState` fait circuler entre le panneau et l'action.
 * Il porte les valeurs autant que les erreurs : une saisie refusée revient
 * dans le panneau avec ce qui a été tapé, jamais vidée.
 */
export type ActivityFormState = {
  values: ActivityFormValues;
  errors: ActivityFormErrors;
  /** Un empêchement qui n'appartient à aucun champ : un droit, une panne. */
  message?: string;
};

export const EMPTY_ACTIVITY_VALUES: ActivityFormValues = {
  activityTypeId: "",
  isUnscheduled: false,
  periodStart: "",
  periodEnd: "",
  approachId: "",
  objective: "",
};

/**
 * La ligne existante, remise en champs de formulaire — le pré-remplissage de
 * T3.4.
 *
 * Le trajet inverse de `readActivityForm`, et il n'en prend que ce que le
 * formulaire porte : `state` n'y figure pas, puisqu'il ne se saisit pas. Les
 * colonnes nulles redeviennent des chaînes vides, la forme que rendent les
 * contrôles HTML — sans quoi un `defaultValue` recevrait `null` et React
 * rendrait le champ non contrôlé pour de mauvaises raisons.
 */
export function toActivityFormValues(row: {
  activityTypeId: string;
  isUnscheduled: boolean;
  periodStart: string | null;
  periodEnd: string | null;
  approachId: string | null;
  objective: string | null;
}): ActivityFormValues {
  return {
    activityTypeId: row.activityTypeId,
    isUnscheduled: row.isUnscheduled,
    periodStart: row.periodStart ?? "",
    periodEnd: row.periodEnd ?? "",
    approachId: row.approachId ?? "",
    objective: row.objective ?? "",
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
 * L'action ne construit jamais sa ligne par étalement d'un `FormData` : un
 * champ caché ajouté par n'importe qui deviendrait une colonne écrite. `state`,
 * `projectId` et `cancellationReason` ne se lisent nulle part ici — le premier
 * se dérive, le deuxième est lié côté serveur, le troisième appartient à T3.5.
 *
 * Une case non cochée n'est pas envoyée par le navigateur : son absence **est**
 * sa valeur, et c'est pourquoi elle se lit en présence et non en contenu.
 */
export function readActivityForm(formData: FormData): ActivityFormValues {
  return {
    activityTypeId: field(formData, "activityTypeId"),
    isUnscheduled: formData.get("isUnscheduled") !== null,
    periodStart: field(formData, "periodStart"),
    periodEnd: field(formData, "periodEnd"),
    approachId: field(formData, "approachId"),
    objective: field(formData, "objective"),
  };
}

/* ==========================================================================
   La validation
   ========================================================================== */

export function validateActivityForm(
  values: ActivityFormValues,
): ActivityFormErrors {
  const errors: ActivityFormErrors = {};

  // La forme est vérifiée avant la base, pour la raison exposée dans
  // `lib/uuid.ts` : une colonne `uuid` interrogée avec n'importe quoi rend une
  // erreur PostgreSQL, donc un 500, là où l'on attend un message de champ.
  if (!values.activityTypeId) {
    // D16 — le type est le seul champ vraiment obligatoire.
    errors.activityTypeId = "Le type d'activité est obligatoire.";
  } else if (!isUuid(values.activityTypeId)) {
    errors.activityTypeId = "Ce type d'activité n'est pas reconnu.";
  }

  if (values.approachId && !isUuid(values.approachId)) {
    errors.approachId = "Cette approche n'est pas reconnue.";
  }

  if (values.periodStart && !isIsoDay(values.periodStart)) {
    errors.periodStart = "Cette date de début n'existe pas.";
  }

  if (values.periodEnd && !isIsoDay(values.periodEnd)) {
    errors.periodEnd = "Cette date de fin n'existe pas.";
  }

  const hasPeriod = Boolean(values.periodStart || values.periodEnd);

  // Arbitrage du 13/08/2026 : la case et la période s'excluent, et le conflit
  // se refuse plutôt que de trancher en silence. Vision ne jette jamais ce qui
  // a été tapé — c'est la raison même qui a fait rendre « Enregistrer » inactif
  // en T3.2 plutôt que de lui faire recharger la page.
  if (values.isUnscheduled && hasPeriod) {
    errors.isUnscheduled =
      "Une activité « à planifier » n'a pas de période : décocher la case, ou effacer les dates.";
  } else if (!values.isUnscheduled && !hasPeriod) {
    // La saisie minimale de `docs/03` §4 : un type et une période. « À
    // planifier » est la seule façon de se passer de la seconde (D14).
    errors.periodStart =
      "La période est obligatoire, ou la case « à planifier » si la date n'est pas connue.";
  }

  // Une fin sans début n'est pas une période. Le refus est **uniforme** : une
  // fin seule passée pourrait donner `done`, mais une fin seule à venir n'a
  // aucun état légal — `activities_planned_requires_period_or_unscheduled`
  // exige un début. Deux comportements pour une même forme de saisie seraient
  // impossibles à énoncer dans la note du champ.
  if (!errors.isUnscheduled && values.periodEnd && !values.periodStart) {
    errors.periodEnd =
      "Une fin de période sans début n'est pas une période : saisir aussi la date de début.";
  }

  // Comparaison de chaînes — deux dates `YYYY-MM-DD` s'ordonnent
  // lexicographiquement comme elles s'ordonnent dans le temps. Le schéma porte
  // `activities_period_order`, mais un `CHECK` violé est une exception et non
  // un message de champ : la règle est donc ici **aussi**, et c'est elle qui
  // parle à la personne.
  if (
    !errors.periodStart &&
    !errors.periodEnd &&
    values.periodStart &&
    values.periodEnd &&
    values.periodEnd < values.periodStart
  ) {
    errors.periodEnd = "La fin de période ne peut pas précéder son début.";
  }

  return errors;
}

/* ==========================================================================
   La dérivation — `docs/06` §9, « état pré-rempli selon la date »
   ========================================================================== */

/** La période et l'état, tels qu'ils partent en base. */
export type DerivedPeriod = {
  state: ActivityState;
  periodStart: string | null;
  periodEnd: string | null;
  isUnscheduled: boolean;
};

/**
 * L'état d'une activité, déduit de sa période.
 *
 * ```
 * « à planifier »            → planned      les deux bornes à null
 * début + fin, fin < today   → done
 * début + fin, début > today → planned
 * début + fin, sinon         → in_progress  la période couvre aujourd'hui
 * début seul                 → in_progress  period_end reste null
 * ```
 *
 * **`today` est un paramètre, jamais `new Date()` lu ici.** Une fonction pure
 * qui lirait l'horloge ne s'éprouverait pas : ses tests seraient justes le jour
 * où on les écrit et faux le mois suivant. L'action lui passe la date réelle,
 * et c'est le seul endroit du chemin où l'horloge est consultée.
 *
 * **Un début seul donne `in_progress`, quelle que soit son ancienneté.** Une
 * activité commencée en mars 2024 sans fin reste donc « en cours »
 * indéfiniment : conséquence assumée de l'arbitrage, et T3.5 est le seul
 * chemin pour la clore. La déduire terminée demanderait d'inventer sa date de
 * fin.
 *
 * La fonction suppose une saisie déjà validée : elle n'est appelée que par
 * `parseActivityForm`, après que les erreurs ont été comptées.
 */
export function deriveActivityState(
  values: ActivityFormValues,
  today: string,
): DerivedPeriod {
  if (values.isUnscheduled) {
    return {
      state: "planned",
      periodStart: null,
      periodEnd: null,
      isUnscheduled: true,
    };
  }

  const periodStart = valueOrNull(values.periodStart);
  const periodEnd = valueOrNull(values.periodEnd);

  const state: ActivityState = !periodEnd
    ? "in_progress"
    : periodEnd < today
      ? "done"
      : periodStart && periodStart > today
        ? "planned"
        : "in_progress";

  return { state, periodStart, periodEnd, isUnscheduled: false };
}

/**
 * La période et l'état d'une activité déjà en base, tels que l'édition doit
 * les comparer. `DerivedPeriod` a exactement cette forme : c'est ce qui permet
 * à `resolveActivityPeriod` de rendre l'un ou l'autre sans les distinguer.
 */
export type ActivityCurrent = DerivedPeriod;

/**
 * La période soumise, telle qu'elle part en base — **et l'état seulement si
 * la période a bougé.**
 *
 * L'arbitrage (c) du 13/08/2026, et la seule chose que T3.4 ajoute à la règle
 * de T3.3 : `current` à `null` — une création — dérive comme avant ; `current`
 * fourni et période identique rend la ligne existante **telle quelle**, état
 * compris, si bien que la correction manuelle de T3.5 survit à l'édition d'un
 * objectif, d'un type ou d'une approche.
 *
 * La comparaison est faite sur les valeurs **normalisées** : `""` et `null`
 * sont la même absence, et une activité « à planifier » réenregistrée sans
 * toucher à ses dates ne doit pas passer pour modifiée. C'est aussi pourquoi
 * elle porte sur les trois champs à la fois — la case fait partie de la
 * période, elle en tient lieu (D14).
 */
export function resolveActivityPeriod(
  values: ActivityFormValues,
  today: string,
  current: ActivityCurrent | null,
): DerivedPeriod {
  const derived = deriveActivityState(values, today);
  if (!current) return derived;

  const unmoved =
    derived.isUnscheduled === current.isUnscheduled &&
    derived.periodStart === current.periodStart &&
    derived.periodEnd === current.periodEnd;

  return unmoved ? current : derived;
}

/* ==========================================================================
   De la saisie aux lignes
   ========================================================================== */

/**
 * Les colonnes d'`activities` que ce formulaire écrit, et pas une de plus.
 *
 * `projectId` n'y figure pas : il est lié côté serveur par l'action, jamais
 * transmis par un champ. `cancellationReason` non plus — il appartient à T3.5.
 */
export type ActivityRowInput = {
  activityTypeId: string;
  approachId: string | null;
  objective: string | null;
  state: ActivityState;
  periodStart: string | null;
  periodEnd: string | null;
  isUnscheduled: boolean;
};

/**
 * Une activité déjà en base, telle que l'édition la compare : sa période, son
 * état, et les trois colonnes que le formulaire peut changer.
 */
export type ActivityCurrentRow = ActivityCurrent & {
  activityTypeId: string;
  approachId: string | null;
  objective: string | null;
};

/**
 * La ligne calculée est-elle celle qui est déjà en base ?
 *
 * Une re-soumission à l'identique ne doit **rien** écrire : ni `updated_at`
 * repoussé, ni recalcul de fraîcheur, ni ligne dans le journal de C6 pour une
 * modification qui n'en est pas une. Sept colonnes, toutes celles que ce
 * formulaire écrit — les comparer est plus honnête que de laisser la base
 * absorber une écriture vide.
 */
export function activityRowUnchanged(
  input: ActivityRowInput,
  current: ActivityCurrentRow,
): boolean {
  return (
    input.activityTypeId === current.activityTypeId &&
    input.approachId === current.approachId &&
    input.objective === current.objective &&
    input.state === current.state &&
    input.periodStart === current.periodStart &&
    input.periodEnd === current.periodEnd &&
    input.isUnscheduled === current.isUnscheduled
  );
}

/**
 * Lit le formulaire, le valide, résout l'état, et rend la ligne à écrire.
 *
 * `input` est non nul **si et seulement si** `errors` est vide : la propriété
 * posée en T2.5, qui évite d'affirmer par un `as` un type que la validation
 * venait de prouver.
 *
 * `current` est absent à la création et fourni à l'édition : c'est le seul
 * paramètre qui distingue les deux gestes, et il ne change que le sort de
 * l'état (arbitrage (c) — cf. `resolveActivityPeriod`). Le formulaire, sa
 * lecture et sa validation sont les mêmes des deux côtés.
 */
export function parseActivityForm(
  formData: FormData,
  today: string,
  current: ActivityCurrent | null = null,
): {
  values: ActivityFormValues;
  errors: ActivityFormErrors;
  input: ActivityRowInput | null;
} {
  const values = readActivityForm(formData);
  const errors = validateActivityForm(values);

  if (Object.keys(errors).length > 0) return { values, errors, input: null };

  const period = resolveActivityPeriod(values, today, current);

  return {
    values,
    errors,
    input: {
      activityTypeId: values.activityTypeId,
      approachId: valueOrNull(values.approachId),
      objective: valueOrNull(values.objective),
      state: period.state,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      isUnscheduled: period.isUnscheduled,
    },
  };
}

/* ==========================================================================
   Le cycle de vie — T3.5

   Ce que la dérivation ci-dessus ne fait pas : elle ne fait jamais reculer un
   état ni le faire sortir d'une période inchangée. Le cycle de vie, lui, est
   la correction volontaire — « Marquer en cours », « Marquer terminée »,
   annuler — déclenchée depuis la roadmap, sans repasser par ce formulaire.
   ========================================================================== */

/**
 * Les quatre flèches du diagramme de `docs/03` §4, et aucune de plus.
 *
 * Une table plutôt que des `if` épars : « aucun retour en arrière depuis
 * annulée » (interdit de la fiche) est vrai **par construction** — `cancelled`
 * et `done` n'ont simplement pas de sortie — et non par une discipline de
 * relecture qui s'oublierait un jour.
 */
const ACTIVITY_TRANSITIONS: Record<ActivityState, readonly ActivityState[]> = {
  planned: ["in_progress", "cancelled"],
  in_progress: ["done", "cancelled"],
  done: [],
  cancelled: [],
};

/** Cette transition existe-t-elle dans le schéma d'états de `docs/03` §4 ? */
export function canTransitionActivity(
  from: ActivityState,
  to: ActivityState,
): boolean {
  return ACTIVITY_TRANSITIONS[from].includes(to);
}

/**
 * Le motif d'annulation, lu et rogné — même forme que `field()` ci-dessus,
 * pour un formulaire qui n'a que ce seul champ.
 */
export function readCancellationReason(formData: FormData): string {
  return field(formData, "cancellationReason");
}

/**
 * `activities_cancelled_requires_reason` en message de champ, avant que la
 * base n'ait à le refuser. Le champ est `required` en HTML — ce filet ne
 * protège que la requête forgée, pas l'usage normal.
 */
export function validateCancellationReason(reason: string): string | undefined {
  if (!reason) return "Le motif est obligatoire pour annuler une activité.";
  return undefined;
}
