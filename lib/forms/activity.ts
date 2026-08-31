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
 * ## Le mode de planification décide, et il est un champ
 *
 * Depuis le 31/08/2026, la période se saisit en **trois modes exclusifs** — à
 * planifier, période, date précise —, choisis dans le panneau par un groupe de
 * boutons radio. Le mode n'est pas une déduction : c'est `planning`, un champ
 * du formulaire, rétréci sur son énuméré avant tout le reste.
 *
 * **Deux refus ont disparu avec lui**, et ils n'ont pas été assouplis : ils
 * sont devenus impossibles. « Une activité à planifier n'a pas de période » et
 * « une fin de période sans début n'est pas une période » arbitraient une
 * saisie où la case et les deux dates étaient visibles ensemble, donc où
 * l'intention était ambiguë. Un mode choisi ne l'est plus.
 *
 * **Rien de ce qui a été tapé n'est jeté.** Un refus revient avec les trois
 * champs de dates tels quels, dans tous les modes ; ce que le mode écarte, il
 * l'écarte au moment de **composer la ligne**, jamais au moment de relire la
 * saisie. C'est le principe du 13/08/2026, déplacé et non abandonné.
 *
 * **Une date précise est une période d'un jour** — `period_start` et
 * `period_end` sur la même date. Aucune colonne ne dit le mode : il se déduit
 * de la ligne à la réouverture (`toActivityFormValues`), et l'inférence est
 * totale. Le mode est une notion de saisie, pas une donnée.
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
 * - `planned` n'est dérivé que d'un **début saisi** ou du mode « à planifier »,
 *   donc `activities_planned_requires_period_or_unscheduled` ne peut pas l'être
 *   non plus.
 *
 * Les deux contraintes `CHECK` du schéma tiennent **par construction**, jamais
 * par un rattrapage. Les trois modes le préservent : « date précise » pose la
 * même date aux deux bornes, « période » exige son début, et « à planifier » ne
 * pose ni l'une ni l'autre. Une fin seule n'a plus de chemin par où entrer.
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
import { isWebUrl } from "@/lib/forms/resource";
import { isUuid } from "@/lib/uuid";

/** `planned` · `in_progress` · `done` · `cancelled`. Dérivé du schéma (D43). */
export type ActivityState = (typeof activityState.enumValues)[number];

/* ==========================================================================
   Ce que la personne a saisi
   ========================================================================== */

/**
 * Les trois façons de planifier une activité, exclusives par construction.
 *
 * `unscheduled` est D14 — le groupe « à planifier », et non un cinquième état.
 * `day` est une période d'un jour : une restitution, un atelier ponctuel.
 * `period` est tout le reste, avec sa fin facultative (`docs/03` §4 n'exige
 * qu'un début pour une activité en cours).
 */
export const ACTIVITY_PLANNINGS = ["unscheduled", "period", "day"] as const;

export type ActivityPlanning = (typeof ACTIVITY_PLANNINGS)[number];

/** Des chaînes, et un mode. Jamais un état, jamais un objet métier. */
export type ActivityFormValues = {
  activityTypeId: string;
  /**
   * Le mode choisi. `""` n'est pas un quatrième mode : c'est l'absence de
   * choix, ou une valeur forgée que `readActivityForm` a refusé de reconnaître.
   * La validation la refuse ; aucune ligne ne se compose sans mode.
   */
  planning: ActivityPlanning | "";
  /** Colonnes `date` : `YYYY-MM-DD`, telles que les rend `input type="date"`. */
  periodStart: string;
  periodEnd: string;
  /**
   * La date du mode « date précise ». **Un troisième nom de champ**, et non
   * `periodStart` réemployé : deux `<input>` de même `name` ne se départagent
   * pas dans un `FormData`, et des noms séparés font que basculer d'un mode à
   * l'autre ne détruit pas ce qui a été tapé dans l'autre.
   */
  periodDay: string;
  approachId: string;
  objective: string;
  /**
   * Le lien vers l'outil où le travail se fait (21/08/2026) — Ergonome,
   * Everyone. Facultatif, et **offert à tous les types** : le champ ne
   * disparaît pas selon le type choisi, pour la raison que le panneau écrit
   * déjà à propos de la case « à planifier » — sans JavaScript, un champ ne
   * disparaît pas.
   */
  externalUrl: string;
  /** Facultatif (`docs/03` §4). Personnes déjà référencées dans le domaine — T3.6. */
  participantIds: string[];
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

export const EMPTY_ACTIVITY_VALUES: ActivityFormValues = {
  activityTypeId: "",
  /* « Période » à l'ouverture : c'est le mode de la plupart des activités —
     un atelier, un audit, une campagne de tests s'étendent. */
  planning: "period",
  periodStart: "",
  periodEnd: "",
  periodDay: "",
  approachId: "",
  objective: "",
  externalUrl: "",
  participantIds: [],
};

/**
 * Le mode d'une ligne déjà en base — **déduit, jamais stocké.**
 *
 * Aucune colonne ne porte le mode, et il n'en faut pas une : les trois cas se
 * lisent sur les colonnes qui existent, et l'inférence est **totale**.
 *
 * ```
 * is_unscheduled                       → « à planifier »
 * period_start = period_end, non nuls  → « date précise »
 * tout le reste                        → « période »
 * ```
 *
 * Une ligne qui ne porte **qu'une fin** existe dans le schéma — seuls `planned`
 * et `done` sont contraints — sans que ce formulaire ait jamais pu la produire.
 * Elle se rouvre en « période » avec un début vide, et sa correction exigera
 * désormais ce début. C'est un resserrement, pas une perte : rien n'est effacé
 * tant qu'on n'enregistre pas.
 */
function inferPlanning(row: {
  isUnscheduled: boolean;
  periodStart: string | null;
  periodEnd: string | null;
}): ActivityPlanning {
  if (row.isUnscheduled) return "unscheduled";
  if (row.periodStart && row.periodStart === row.periodEnd) return "day";
  return "period";
}

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
  externalUrl: string | null;
  /** Le seul champ de ce formulaire qui ne vient pas d'une colonne
   *  d'`activities` : l'appelant le lit à côté, dans `activity_participants`. */
  participantIds: string[];
}): ActivityFormValues {
  const planning = inferPlanning(row);

  return {
    activityTypeId: row.activityTypeId,
    planning,
    /* Chaque mode ne reprend que **ses** champs. Sans cette séparation, une
       activité d'un jour rouverte porterait sa date dans les trois, et la
       moindre bascule de mode la propagerait là où elle n'a rien à faire. */
    periodStart: planning === "period" ? (row.periodStart ?? "") : "",
    periodEnd: planning === "period" ? (row.periodEnd ?? "") : "",
    periodDay: planning === "day" ? (row.periodStart ?? "") : "",
    approachId: row.approachId ?? "",
    objective: row.objective ?? "",
    externalUrl: row.externalUrl ?? "",
    participantIds: row.participantIds,
  };
}

/** Le champ, lu et rogné. Absent ou d'un type inattendu, il vaut « vide ». */
function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Les valeurs cochées d'un champ multiple, rognées et dédoublonnées.
 *
 * Jumeau du `fields()` privé de `lib/forms/project.ts` — dupliqué plutôt
 * qu'importé, même raisonnement que `field()` ci-dessus : deux fonctions de
 * cinq lignes valent mieux qu'un couplage entre deux modules pour si peu.
 * Le dédoublonnage compte ici aussi : `activity_participants` porte une
 * contrainte d'unicité sur le couple activité/personne.
 */
function fields(formData: FormData, name: string): string[] {
  const values = formData
    .getAll(name)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
  return [...new Set(values)];
}

/**
 * Le mode posté, **rétréci sur son énuméré avant tout le reste** (le geste de
 * T7.4, où la `nature` d'un statut et la `family` d'un type se resserrent avant
 * l'écriture).
 *
 * Une valeur forgée ne devient pas un mode : elle devient `""`, et la
 * validation la refuse. Aucune ligne ne se compose sur un mode inconnu, et le
 * refus se lit comme un message de champ plutôt que comme une exception.
 */
function readPlanning(formData: FormData): ActivityPlanning | "" {
  const value = formData.get("planning");
  return ACTIVITY_PLANNINGS.find((planning) => planning === value) ?? "";
}

/**
 * Les champs du ticket, et eux seuls.
 *
 * L'action ne construit jamais sa ligne par étalement d'un `FormData` : un
 * champ caché ajouté par n'importe qui deviendrait une colonne écrite. `state`,
 * `projectId` et `cancellationReason` ne se lisent nulle part ici — le premier
 * se dérive, le deuxième est lié côté serveur, le troisième appartient à T3.5.
 *
 * **Les trois champs de dates sont lus dans tous les modes**, et c'est
 * délibéré : le panneau les sert tous les trois — deux sont masqués par le
 * CSS, pas retirés du document —, et une saisie refusée doit revenir avec ce
 * qui a été tapé dans chacun. Le mode décide de ce qui part en base, pas de ce
 * qui se relit.
 */
export function readActivityForm(formData: FormData): ActivityFormValues {
  return {
    activityTypeId: field(formData, "activityTypeId"),
    planning: readPlanning(formData),
    periodStart: field(formData, "periodStart"),
    periodEnd: field(formData, "periodEnd"),
    periodDay: field(formData, "periodDay"),
    approachId: field(formData, "approachId"),
    objective: field(formData, "objective"),
    externalUrl: field(formData, "externalUrl"),
    participantIds: fields(formData, "participantIds"),
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

  /* **Chaque mode ne se valide que sur ses champs.** Les deux autres sont
     servis, donc postés, et ils peuvent porter n'importe quoi : les valider
     refuserait une saisie sur un champ que la personne ne voit pas.

     Deux règles ont disparu ici le 31/08/2026, et elles n'ont pas été
     assouplies — elles sont devenues impossibles. « La case et la période
     s'excluent » arbitrait une saisie où les deux étaient visibles ensemble ;
     « une fin sans début n'est pas une période » n'a plus de forme de saisie
     où se produire, le mode « période » exigeant son début. */
  if (!values.planning) {
    // Aucun mode : le champ n'a pas été servi, ou sa valeur a été forgée.
    errors.planning = "Choisir un mode de planification.";
  } else if (values.planning === "period") {
    if (!values.periodStart) {
      // La saisie minimale de `docs/03` §4 : un type et une période. « À
      // planifier » est la seule façon de se passer de la seconde (D14).
      errors.periodStart = "La date de début est obligatoire.";
    } else if (!isIsoDay(values.periodStart)) {
      errors.periodStart = "Cette date de début n'existe pas.";
    }

    // La fin reste facultative : `docs/03` §4 n'exige qu'un début pour une
    // activité en cours, et l'exiger forcerait à inventer une date.
    if (values.periodEnd && !isIsoDay(values.periodEnd)) {
      errors.periodEnd = "Cette date de fin n'existe pas.";
    }

    // Comparaison de chaînes — deux dates `YYYY-MM-DD` s'ordonnent
    // lexicographiquement comme elles s'ordonnent dans le temps. Le schéma
    // porte `activities_period_order`, mais un `CHECK` violé est une exception
    // et non un message de champ : la règle est donc ici **aussi**, et c'est
    // elle qui parle à la personne.
    if (
      !errors.periodStart &&
      !errors.periodEnd &&
      values.periodStart &&
      values.periodEnd &&
      values.periodEnd < values.periodStart
    ) {
      errors.periodEnd = "La fin de période ne peut pas précéder son début.";
    }
  } else if (values.planning === "day") {
    if (!values.periodDay) {
      errors.periodDay = "La date est obligatoire.";
    } else if (!isIsoDay(values.periodDay)) {
      errors.periodDay = "Cette date n'existe pas.";
    }
  }

  // Le lien vers l'outil (21/08/2026) — facultatif, et refusé s'il n'est pas un
  // lien web. `isWebUrl` vient de `lib/forms/resource.ts`, comme
  // `lib/forms/result.ts` l'importe déjà pour la même colonne d'un autre objet :
  // une seule définition de « ce qu'est une adresse acceptable », et un seul
  // message à traduire le jour venu.
  if (values.externalUrl && !isWebUrl(values.externalUrl)) {
    errors.externalUrl =
      "Cette adresse n'est pas un lien web : elle doit commencer par http:// ou https://.";
  }

  // Forme seulement, comme le reste de ce bloc : l'existence d'un participant
  // dans le domaine n'est pas vérifiée ici. C'est un choix de la fiche —
  // `lib/db/scoped.ts` la refuse déjà à l'écriture, et une seconde autorité
  // divergerait un jour de la première.
  if (values.participantIds.some((id) => !isUuid(id))) {
    errors.participantIds = "Un participant sélectionné n'est pas reconnu.";
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
 * **Le mode fournit les deux bornes, la règle d'état ne le connaît pas.**
 *
 * ```
 * « à planifier »  → (null, null)
 * « date précise » → (la date, la date)     une période d'un jour
 * « période »      → (début, fin ou null)
 * ```
 *
 * ```
 * les deux bornes à null      → planned
 * début + fin, fin < today    → done
 * début + fin, début > today  → planned
 * début + fin, sinon          → in_progress  la période couvre aujourd'hui
 * début seul                  → in_progress  period_end reste null
 * ```
 *
 * Une date précise passée donne donc `done`, une date précise à venir
 * `planned` : la même règle, sur une période dont les deux bornes coïncident.
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
 * fin. Le mode « date précise » **n'est pas ce chemin** : c'est une période
 * d'un jour, qui n'a jamais eu de fin manquante.
 *
 * La fonction suppose une saisie déjà validée : elle n'est appelée que par
 * `parseActivityForm`, après que les erreurs ont été comptées.
 */
export function deriveActivityState(
  values: ActivityFormValues,
  today: string,
): DerivedPeriod {
  if (values.planning === "unscheduled") {
    return {
      state: "planned",
      periodStart: null,
      periodEnd: null,
      isUnscheduled: true,
    };
  }

  /* Une date précise est une période d'un jour : la même date aux deux bornes.
     Rien en base ne dit « précise » — et rien n'a à le dire, l'inférence de
     `toActivityFormValues` retrouvant le mode sur ces deux colonnes seules. */
  const day = values.planning === "day" ? valueOrNull(values.periodDay) : null;

  const periodStart = day ?? valueOrNull(values.periodStart);
  const periodEnd = day ?? valueOrNull(values.periodEnd);

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
  externalUrl: string | null;
};

/**
 * Une activité déjà en base, telle que l'édition la compare : sa période, son
 * état, et les trois colonnes que le formulaire peut changer.
 */
export type ActivityCurrentRow = ActivityCurrent & {
  activityTypeId: string;
  approachId: string | null;
  objective: string | null;
  externalUrl: string | null;
};

/**
 * La ligne calculée est-elle celle qui est déjà en base ?
 *
 * Une re-soumission à l'identique ne doit **rien** écrire : ni `updated_at`
 * repoussé, ni recalcul de fraîcheur, ni ligne dans le journal de C6 pour une
 * modification qui n'en est pas une. Huit colonnes, toutes celles que ce
 * formulaire écrit — la huitième est le lien vers l'outil, arrivé le
 * 21/08/2026 — les comparer est plus honnête que de laisser la base
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
    input.isUnscheduled === current.isUnscheduled &&
    input.externalUrl === current.externalUrl
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
  /**
   * Les personnes cochées, formellement valides — l'existence dans le
   * domaine appartient à `lib/db/scoped.ts`, pas à ce module (T3.6). Toujours
   * rendu ; l'appelant ne l'utilise que si `input` est non nul.
   */
  participantIds: string[];
} {
  const values = readActivityForm(formData);
  const errors = validateActivityForm(values);

  if (Object.keys(errors).length > 0) {
    return { values, errors, input: null, participantIds: values.participantIds };
  }

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
      externalUrl: valueOrNull(values.externalUrl),
    },
    participantIds: values.participantIds,
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
