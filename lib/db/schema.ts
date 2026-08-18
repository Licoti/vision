/**
 * Schéma de la base — traduction de docs/04-modele-donnees.md.
 *
 * L'ordre suit celui du document : le cadre (§2), le travail (§3), les
 * traces (§4). Chaque table renvoie à la section dont elle vient.
 *
 * Quatre conventions du §1, appliquées sans exception :
 *   — identifiants UUID ;
 *   — tables au pluriel, colonnes en snake_case ;
 *   — created_at, updated_at, created_by partout ;
 *   — les périodes sont des `date`, jamais des horodatages.
 *
 * Le domain_id est présent sur les 26 tables métier, y compris les tables
 * de liaison que le document ne détaille pas. C'est lui qui permettra à la
 * couche d'accès de T1.3 d'exiger un domaine sur toute requête, sans avoir
 * à remonter par jointure.
 */

import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

/* ==========================================================================
   Listes fermées

   Le document distingue deux sortes de listes. Les référentiels — entités,
   métiers, statuts, types d'activité — sont des données, modifiables par le
   domaine. Les listes ci-dessous sont l'autre sorte : le code raisonne
   dessus, elles ne se configurent pas. Un type énuméré les rend
   infranchissables en base autant qu'à la compilation.
   ========================================================================== */

export const domainStatus = pgEnum("domain_status", ["active", "suspended"]);

export const personSource = pgEnum("person_source", ["directory", "manual"]);

export const personKind = pgEnum("person_kind", ["center", "stakeholder"]);

/**
 * La disponibilité d'une personne du centre.
 *
 * Arbitrage (b) de C5bis — l'échelle de maîtrise doit pouvoir évoluer, elle est
 * donc un référentiel (`skill_levels`) ; la disponibilité est une liste fermée
 * de trois valeurs dont la logique dépendra directement le jour où elle se
 * dérivera des accompagnements. C'est le cas de D43 : un énuméré.
 *
 * Arbitrage (d) — elle est une propriété du centre : la colonne est nullable, et
 * un `CHECK` la refuse à un intervenant côté entité.
 */
export const personAvailability = pgEnum("person_availability", [
  "available",
  "partial",
  "unavailable",
]);

export const domainRole = pgEnum("domain_role", ["domain_manager", "member"]);

export const activityFamily = pgEnum("activity_family", [
  "framing",
  "research",
  "design",
  "evaluation",
  "measurement",
  "transfer",
]);

/** D42 — l'archivage n'est pas un statut : la nature `archived` n'existe pas. */
export const projectStatusNature = pgEnum("project_status_nature", [
  "framing",
  "active",
  "paused",
  "done",
]);

export const toolKind = pgEnum("tool_kind", [
  "audit",
  "analytics",
  "budget",
  "other",
]);

/** `manual` au POC ; `api` le jour où les outils exposeront le leur (D15). */
export const syncMode = pgEnum("sync_mode", ["manual", "api"]);

/** D10 — `internal` porte les missions transverses. */
export const productKind = pgEnum("product_kind", ["product", "internal"]);

/** D43 — liste fermée, non configurable : la logique du produit en dépend. */
export const activityState = pgEnum("activity_state", [
  "planned",
  "in_progress",
  "done",
  "cancelled",
]);

/** D21 — saisi au POC, non déduit de l'URL. */
export const resourceType = pgEnum("resource_type", [
  "powerpoint",
  "word",
  "excel",
  "pdf",
  "figma",
  "sharepoint",
  "link",
]);

/** Sans direction, une courbe d'indicateur ne se lit pas. */
export const indicatorDirection = pgEnum("indicator_direction", [
  "higher_is_better",
  "lower_is_better",
]);

export const budgetUnit = pgEnum("budget_unit", ["days"]);

export const eventVerb = pgEnum("event_verb", [
  "created",
  "updated",
  "state_changed",
  "linked",
  "archived",
]);

export const eventTargetType = pgEnum("event_target_type", [
  "project",
  "activity",
  "resource",
  "result",
  "indicator_reading",
  "member",
]);

/* ==========================================================================
   Colonnes communes
   ========================================================================== */

/**
 * created_by est nullable à dessein : l'amorçage d'un domaine (T1.5) et les
 * écritures système n'ont pas de personne courante. La référence passe par
 * une fonction fléchée, seule façon de pointer `persons` depuis une table
 * déclarée avant elle.
 */
const stamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: uuid("created_by").references((): AnyPgColumn => persons.id, {
    onDelete: "set null",
  }),
};

/** Le rattachement au domaine. Aucune table métier n'y échappe. */
const domainRef = () =>
  uuid("domain_id")
    .notNull()
    .references(() => domains.id, { onDelete: "restrict" });

/* ==========================================================================
   §2 — Le cadre
   ========================================================================== */

/**
 * L'entreprise cliente, et la frontière étanche des données.
 * Seul le super administrateur y écrit — d'où l'absence de created_by, qui
 * pointerait `persons`, elle-même scopée par domaine.
 */
export const domains = pgTable("domains", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  competenceCenterName: text("competence_center_name").notNull(),
  status: domainStatus("status").notNull().default("active"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Division de l'entreprise. Qualifie les produits, ne cloisonne rien. */
export const entities = pgTable(
  "entities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    label: text("label").notNull(),
    position: numeric("position", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...stamps,
  },
  (t) => [index("entities_domain_id_idx").on(t.domainId)],
);

/** Référentiel des métiers : Product Design, UX Research, UI Design… */
export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    label: text("label").notNull(),
    position: numeric("position", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...stamps,
  },
  (t) => [index("jobs_domain_id_idx").on(t.domainId)],
);

/**
 * Référentiel des compétences portées par les personnes du centre.
 *
 * **La forme exacte de `jobs`**, et ce n'est pas une coïncidence : les deux sont
 * des référentiels du domaine, amorcés par script, sans écran de gestion avant
 * C7 (D25). Un métier qualifie une personne ; une compétence dit ce qu'elle sait
 * faire, et plusieurs par personne.
 */
export const skills = pgTable(
  "skills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    label: text("label").notNull(),
    position: numeric("position", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...stamps,
  },
  (t) => [index("skills_domain_id_idx").on(t.domainId)],
);

/**
 * L'échelle de maîtrise — la forme de `jobs`, plus un `rank`.
 *
 * C'est le `rank` qui ordonne l'échelle : il donnera au radar sa seule grandeur
 * et au filtre « au moins ce niveau » son `rank >= n`. Le `label` reste libre —
 * un domaine renomme « Avancé » sans renommer le rang 3.
 *
 * Aucune unicité sur `rank` : le référentiel est amorcé par script, et une
 * contrainte non demandée contraindrait l'écran de gestion dû à C7 (D25).
 */
export const skillLevels = pgTable(
  "skill_levels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    label: text("label").notNull(),
    rank: smallint("rank").notNull(),
    position: numeric("position", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...stamps,
  },
  (t) => [index("skill_levels_domain_id_idx").on(t.domainId)],
);

/** Référentiel des approches : Research, Design Thinking, Lean, Audit UX… */
export const approaches = pgTable(
  "approaches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    label: text("label").notNull(),
    position: numeric("position", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...stamps,
  },
  (t) => [index("approaches_domain_id_idx").on(t.domainId)],
);

/**
 * Outil externe raccordé. Cette table est ce qui rend le raccordement d'un
 * nouvel outil peu coûteux : une ligne, pas un module.
 */
export const tools = pgTable(
  "tools",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    name: text("name").notNull(),
    kind: toolKind("kind").notNull(),
    baseUrl: text("base_url"),
    syncMode: syncMode("sync_mode").notNull().default("manual"),
    /** Vide au POC. Réservé au branchement futur. */
    apiConfig: jsonb("api_config"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...stamps,
  },
  (t) => [index("tools_domain_id_idx").on(t.domainId)],
);

/** Référentiel du domaine, groupé par famille. */
export const activityTypes = pgTable(
  "activity_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    label: text("label").notNull(),
    position: numeric("position", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    family: activityFamily("family").notNull(),
    /** Vrai pour les audits : conditionne la saisie d'un résultat. */
    producesResult: boolean("produces_result").notNull().default(false),
    defaultToolId: uuid("default_tool_id").references(() => tools.id, {
      onDelete: "set null",
    }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...stamps,
  },
  (t) => [
    index("activity_types_domain_id_idx").on(t.domainId),
    index("activity_types_default_tool_id_idx").on(t.defaultToolId),
  ],
);

/**
 * Référentiel du domaine. Le libellé se renomme, la `nature` non : c'est
 * elle qui porte la logique applicative — ce qui compte comme actif, ce qui
 * est terminé.
 */
export const projectStatuses = pgTable(
  "project_statuses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    label: text("label").notNull(),
    position: numeric("position", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    nature: projectStatusNature("nature").notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...stamps,
  },
  (t) => [index("project_statuses_domain_id_idx").on(t.domainId)],
);

/**
 * Membre du centre ou intervenant externe.
 *
 * D19 — être référencé et pouvoir se connecter sont deux choses distinctes.
 * Un chef de projet côté entité est saisi à la main, apparaît dans l'équipe,
 * et n'aura jamais de compte : `source = manual`, `has_access = false`.
 */
export const persons = pgTable(
  "persons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    source: personSource("source").notNull(),
    /** Identifiant annuaire. Nul si `manual`. */
    externalId: text("external_id"),
    fullName: text("full_name").notNull(),
    email: text("email"),
    /** Facultatif : une personne hors centre n'a pas de métier design. */
    jobId: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
    kind: personKind("kind").notNull(),
    /** Courte présentation, saisie. Lue par la fiche de personne (C5bis). */
    bio: text("bio"),
    /**
     * Arbitrage (d) de C5bis — nulle pour un intervenant côté entité, et le
     * `CHECK` ci-dessous le tient : ce n'est pas une convention d'écran.
     *
     * Stockée, quand D40 posait un précédent de calcul pour le statut
     * d'accompagnement d'un produit. La dérivation depuis les accompagnements
     * en cours exigerait de trancher ce qui rend une personne partiellement
     * disponible — un nombre ? une charge ? une période ? — et aucune de ces
     * réponses n'existe dans le modèle. Dette nommée au journal.
     */
    availability: personAvailability("availability"),
    hasAccess: boolean("has_access").notNull().default(false),
    /** Nul si `has_access` est faux. */
    domainRole: domainRole("domain_role"),
    isActive: boolean("is_active").notNull().default(true),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...stamps,
  },
  (t) => [
    index("persons_domain_id_idx").on(t.domainId),
    index("persons_job_id_idx").on(t.jobId),
    unique("persons_domain_external_id_unique").on(t.domainId, t.externalId),
    check(
      "persons_external_id_requires_directory",
      sql`(${t.source} = 'directory') or (${t.externalId} is null)`,
    ),
    check(
      "persons_role_requires_access",
      sql`(${t.hasAccess} and ${t.domainRole} is not null) or (not ${t.hasAccess} and ${t.domainRole} is null)`,
    ),
    /* Arbitrage (d) de C5bis, sur la forme du `CHECK` ci-dessus : la
       disponibilité est une propriété du centre. Un intervenant côté entité
       n'en porte pas, et le refus est en base — pas seulement dans l'action. */
    check(
      "persons_availability_requires_center",
      sql`${t.availability} is null or ${t.kind} = 'center'`,
    ),
  ],
);

/**
 * Les compétences portées par une personne, avec leur niveau.
 *
 * **Table de liaison, donc sans `archived_at`** — et c'est structurel, pas
 * décoratif : son absence range la table dans `LinkTable` (`lib/db/scoped.ts`)
 * et rend `unlink` disponible **à la compilation**, quand `archive` y devient
 * un refus de typage. C'est la propriété éprouvée en T5.4 : retirer une
 * compétence est un retrait, jamais un archivage, et le verbe à l'écran sera
 * « Retirer ».
 *
 * Le niveau est **déclaré** par la personne et recueilli par le responsable de
 * domaine : aucune date de validation, aucun historique de progression, aucun
 * score. Vision ne le mesure pas.
 *
 * L'unicité `(person_id, skill_id)` est ce qui fera d'une compétence déjà
 * portée une erreur de champ, et non une trace serveur.
 */
export const personSkills = pgTable(
  "person_skills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "restrict" }),
    levelId: uuid("level_id")
      .notNull()
      .references(() => skillLevels.id, { onDelete: "restrict" }),
    ...stamps,
  },
  (t) => [
    index("person_skills_domain_id_idx").on(t.domainId),
    index("person_skills_person_id_idx").on(t.personId),
    index("person_skills_skill_id_idx").on(t.skillId),
    unique("person_skills_person_skill_unique").on(t.personId, t.skillId),
  ],
);

/* ==========================================================================
   §3 — Le travail
   ========================================================================== */

/**
 * L'objet durable accompagné.
 *
 * D40 — le statut d'accompagnement (accompagné actuellement, déjà
 * accompagné, jamais accompagné) n'est pas stocké : il se calcule à partir
 * des projets rattachés.
 */
export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    name: text("name").notNull(),
    /** D24 — un produit peut changer d'entité. */
    entityId: uuid("entity_id")
      .notNull()
      .references(() => entities.id, { onDelete: "restrict" }),
    kind: productKind("kind").notNull().default("product"),
    description: text("description"),
    /**
     * La **raison d'être** du produit et la direction qu'il se donne
     * (18/08/2026).
     *
     * **Concept ajouté hors des `docs/`**, comme la North Star l'a été le
     * 17/08/2026 : ni `docs/02` ni `docs/04` ne le nomment. `docs/02` §7 pose
     * bien « la question à laquelle aucun outil du centre ne sait répondre »,
     * mais comme une question, jamais comme une colonne. L'écart est consigné
     * dans `JOURNAL-TECHNIQUE.md`, comme le prévoit la règle 6.
     *
     * **Nullable, et sans longueur maximale** : un produit sans vision est un
     * état normal — l'écran le dit et propose de l'écrire —, et `description`
     * ne plafonne pas davantage. Aucun index : la colonne ne se filtre ni ne
     * se trie, elle se lit sur la page de son produit.
     */
    vision: text("vision"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...stamps,
  },
  (t) => [
    index("products_domain_id_idx").on(t.domainId),
    index("products_entity_id_idx").on(t.entityId),
  ],
);

/** Un accompagnement daté sur un produit. */
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    /** D4 — rattachement obligatoire. D20 — modifiable, cas rare. */
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    /** L'objectif en une phrase. */
    objective: text("objective"),
    /** D6 — commanditaire, texte libre. */
    sponsor: text("sponsor"),
    /** Saisi, jamais déduit. */
    statusId: uuid("status_id")
      .notNull()
      .references(() => projectStatuses.id, { onDelete: "restrict" }),
    startedOn: date("started_on"),
    /** Fin attendue, approximative. */
    expectedEndOn: date("expected_end_on"),
    /**
     * Dénormalisé volontairement (§6) : le recalcul à l'affichage d'une
     * liste serait coûteux et fragile. Remis à jour par la couche
     * d'écriture, jamais à la main.
     */
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
    /** F1-D3 — un projet s'archive, ne se supprime jamais. */
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...stamps,
  },
  (t) => [
    index("projects_domain_id_idx").on(t.domainId),
    index("projects_product_id_idx").on(t.productId),
    index("projects_status_id_idx").on(t.statusId),
    index("projects_last_activity_at_idx").on(t.lastActivityAt),
  ],
);

/** D44 — les métiers déclarés du projet font foi pour le filtrage. */
export const projectJobs = pgTable(
  "project_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "restrict" }),
    ...stamps,
  },
  (t) => [
    index("project_jobs_domain_id_idx").on(t.domainId),
    unique("project_jobs_project_job_unique").on(t.projectId, t.jobId),
  ],
);

/** D2 — plusieurs approches par projet autorisées. */
export const projectApproaches = pgTable(
  "project_approaches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    approachId: uuid("approach_id")
      .notNull()
      .references(() => approaches.id, { onDelete: "restrict" }),
    ...stamps,
  },
  (t) => [
    index("project_approaches_domain_id_idx").on(t.domainId),
    unique("project_approaches_project_approach_unique").on(
      t.projectId,
      t.approachId,
    ),
  ],
);

/**
 * L'équipe du projet.
 *
 * D9 — `is_contributor` matérialise la distinction entre appartenir à
 * l'équipe et avoir le droit d'écrire. La lecture reste ouverte à tout le
 * domaine ; seuls les contributeurs désignés écrivent.
 */
export const projectMembers = pgTable(
  "project_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id, { onDelete: "restrict" }),
    isContributor: boolean("is_contributor").notNull().default(false),
    ...stamps,
  },
  (t) => [
    index("project_members_domain_id_idx").on(t.domainId),
    index("project_members_person_id_idx").on(t.personId),
    unique("project_members_project_person_unique").on(
      t.projectId,
      t.personId,
    ),
  ],
);

/**
 * Un fait d'accompagnement daté : atelier, audit, campagne de tests.
 *
 * D3 — granularité macro, de quelques jours à quelques semaines, jamais
 * l'acte unitaire. D8 — un seul niveau, pas de sous-activité.
 *
 * À ne jamais confondre avec `events`, qui est une trace système.
 */
export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    /** Rattachement projet unique. D17 — une activité se crée depuis son projet. */
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    /** D16 — obligatoire. */
    activityTypeId: uuid("activity_type_id")
      .notNull()
      .references(() => activityTypes.id, { onDelete: "restrict" }),
    /** D12 — une seule approche, facultative. */
    approachId: uuid("approach_id").references(() => approaches.id, {
      onDelete: "set null",
    }),
    /** Facultatif, fortement encouragé. */
    objective: text("objective"),
    state: activityState("state").notNull().default("planned"),
    /** D13 — granularité mois. Null autorisé. */
    periodStart: date("period_start"),
    periodEnd: date("period_end"),
    /** D14 — le groupe « à planifier », pour les activités sans date. */
    isUnscheduled: boolean("is_unscheduled").notNull().default(false),
    cancellationReason: text("cancellation_reason"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...stamps,
  },
  (t) => [
    index("activities_domain_id_idx").on(t.domainId),
    index("activities_project_id_idx").on(t.projectId),
    index("activities_activity_type_id_idx").on(t.activityTypeId),
    index("activities_state_idx").on(t.state),
    /* Les règles d'intégrité du §3, pour celles qui tiennent dans une table. */
    check(
      "activities_done_requires_period_end",
      sql`${t.state} <> 'done' or ${t.periodEnd} is not null`,
    ),
    check(
      "activities_planned_requires_period_or_unscheduled",
      sql`${t.state} <> 'planned' or ${t.isUnscheduled} or ${t.periodStart} is not null`,
    ),
    check(
      "activities_cancelled_requires_reason",
      sql`${t.state} <> 'cancelled' or ${t.cancellationReason} is not null`,
    ),
    check(
      "activities_period_order",
      sql`${t.periodStart} is null or ${t.periodEnd} is null or ${t.periodEnd} >= ${t.periodStart}`,
    ),
  ],
);

export const activityParticipants = pgTable(
  "activity_participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id, { onDelete: "restrict" }),
    ...stamps,
  },
  (t) => [
    index("activity_participants_domain_id_idx").on(t.domainId),
    index("activity_participants_person_id_idx").on(t.personId),
    unique("activity_participants_activity_person_unique").on(
      t.activityId,
      t.personId,
    ),
  ],
);

/* ==========================================================================
   §4 — Les traces
   ========================================================================== */

/** Un lien vers un document hébergé ailleurs. Jamais de fichier stocké. */
export const resources = pgTable(
  "resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    /** Facultatif : rattachement à l'activité productrice. */
    activityId: uuid("activity_id").references(() => activities.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    url: text("url").notNull(),
    resourceType: resourceType("resource_type").notNull(),
    /** Date de mise à jour côté source, si connue. */
    sourceUpdatedAt: timestamp("source_updated_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...stamps,
  },
  (t) => [
    index("resources_domain_id_idx").on(t.domainId),
    index("resources_project_id_idx").on(t.projectId),
    index("resources_activity_id_idx").on(t.activityId),
  ],
);

/**
 * Synthèse chiffrée produite par un outil externe, avec son lien profond.
 *
 * D39 — c'est une valeur reportée, jamais un indice calculé par Vision.
 * external_ref et synced_at ne servent à rien aujourd'hui : ils évitent une
 * migration le jour où l'outil source exposera son API.
 */
export const results = pgTable(
  "results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    /** Un résultat **vivant** pour une activité au plus — voir l'index. */
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    /** Le contrat unique de F2 : un libellé, une valeur, une unité, une date. */
    label: text("label").notNull(),
    value: numeric("value", { precision: 18, scale: 4 }),
    unit: text("unit"),
    measuredOn: date("measured_on").notNull(),
    toolId: uuid("tool_id").references(() => tools.id, {
      onDelete: "set null",
    }),
    /** Le lien profond vers le rapport. */
    externalUrl: text("external_url"),
    /** Identifiant du rapport dans l'outil source. */
    externalRef: text("external_ref"),
    syncMode: syncMode("sync_mode").notNull().default("manual"),
    syncedAt: timestamp("synced_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...stamps,
  },
  (t) => [
    index("results_domain_id_idx").on(t.domainId),
    index("results_tool_id_idx").on(t.toolId),
    /* **Partiel depuis T4bis.6, et le nom ne change pas** — la règle de
       `docs/04` §4 n'est pas changée d'un mot, elle en sort exacte : un
       résultat **vivant** pour une activité au plus.

       Une unicité totale sur `activity_id` faisait qu'un résultat archivé
       occupait toujours la place : le retrait ne libérait pas son activité, et
       la ressaisie levait une violation d'unicité — une exception PostgreSQL,
       donc un 500, là où l'on attend un écran. Piège relevé par T4.3, épousé
       par T4.4, refermé ici. Le nom est conservé parce que le code, le journal
       et les fiches le nomment : PostgreSQL accepte de le réutiliser, la
       contrainte étant retirée avant que l'index ne soit créé. */
    uniqueIndex("results_activity_unique")
      .on(t.activityId)
      .where(sql`${t.archivedAt} is null`),
  ],
);

/** Mesure du produit, suivie dans le temps. D11 — un seul produit au POC. */
export const indicators = pgTable(
  "indicators",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    unit: text("unit"),
    direction: indicatorDirection("direction").notNull(),
    /** Portail analytics, outil métier… */
    source: text("source"),
    /**
     * La **North Star du produit** : l'indicateur mis en avant, celui qui porte
     * l'objectif global tous accompagnements confondus.
     *
     * **Concept ajouté hors ticket le 17/08/2026**, absent de `docs/02` et de
     * `docs/04`. Il vit sur l'indicateur et non en clé sur `products` parce que
     * `docs/02` §10 écrit qu'un indicateur « reste un objet à part entière,
     * relié à un produit, **et non une propriété de celui-ci** » : un drapeau
     * respecte cette lecture, une clé sur le produit l'inverserait.
     *
     * Un produit peut n'en avoir aucune — c'est l'état par défaut, et un état
     * normal, pas un manque.
     */
    isNorthStar: boolean("is_north_star").notNull().default(false),
    /**
     * La cible **du produit** sur cet indicateur — l'objectif global.
     *
     * **Ce n'est pas la cible de `project_indicators`**, qui reste celle d'une
     * adoption : ce qu'un accompagnement donné s'est fixé (`docs/02` §4, « toute
     * cible d'indicateur appartient à un projet »). Les deux coexistent et ne
     * disent pas la même chose ; l'écran doit les nommer distinctement pour
     * qu'on ne les confonde pas. Second lieu de vérité assumé, consigné dans
     * `JOURNAL-TECHNIQUE.md`.
     */
    targetValue: numeric("target_value", { precision: 18, scale: 4 }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...stamps,
  },
  (t) => [
    index("indicators_domain_id_idx").on(t.domainId),
    index("indicators_product_id_idx").on(t.productId),
    /* **Une seule North Star vivante par produit**, et l'unicité est *partielle*
       pour deux raisons distinctes. `is_north_star` d'abord : une unicité totale
       sur `product_id` interdirait au produit d'avoir deux indicateurs.
       `archived_at` ensuite : c'est la leçon de `results_activity_unique`
       (T4bis.6) — un indicateur archivé qui garderait son drapeau occuperait la
       place, et désigner son successeur lèverait une violation d'unicité, donc
       un 500 là où l'on attend un écran. */
    uniqueIndex("indicators_north_star_unique")
      .on(t.productId)
      .where(sql`${t.isNorthStar} and ${t.archivedAt} is null`),
  ],
);

/**
 * Une valeur datée d'un indicateur. D23 — saisie par les contributeurs.
 * `read_on` est obligatoire : un relevé sans date serait inaffichable sur la
 * frise produit.
 */
export const indicatorReadings = pgTable(
  "indicator_readings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    indicatorId: uuid("indicator_id")
      .notNull()
      .references(() => indicators.id, { onDelete: "cascade" }),
    value: numeric("value", { precision: 18, scale: 4 }).notNull(),
    readOn: date("read_on").notNull(),
    sourceNote: text("source_note"),
    /* **Ajoutée par T5.3, et avec le geste qu'elle autorise.** Règle 4 : un
       relevé saisi en double se retire, il ne se supprime pas — et sans cette
       colonne, le retrait n'avait que la suppression pour chemin. Une colonne
       posée sans lecteur est une colonne qu'on relit sans savoir pourquoi ;
       celle-ci arrive le jour où « Archiver » paraît sous chaque relevé.

       **La couche d'accès n'a pas changé d'un caractère** : `hasArchivedAt`
       (`lib/db/scoped.ts`) introspecte le schéma, si bien qu'`archive`,
       `restore` et le filtre des vivants couvrent cette table du jour où la
       colonne existe. C'est la propriété que T1.3 cherchait, éprouvée ici pour
       la première fois. */
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...stamps,
  },
  (t) => [
    index("indicator_readings_domain_id_idx").on(t.domainId),
    index("indicator_readings_indicator_id_idx").on(t.indicatorId),
  ],
);

/**
 * L'adoption d'un indicateur par un projet : référence, cible, valeur finale.
 * C'est la table qui relie l'accompagnement à son effet supposé. Elle ne
 * calcule rien — Vision juxtapose, elle ne prouve pas.
 */
export const projectIndicators = pgTable(
  "project_indicators",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    indicatorId: uuid("indicator_id")
      .notNull()
      .references(() => indicators.id, { onDelete: "cascade" }),
    baselineValue: numeric("baseline_value", { precision: 18, scale: 4 }),
    targetValue: numeric("target_value", { precision: 18, scale: 4 }),
    finalValue: numeric("final_value", { precision: 18, scale: 4 }),
    note: text("note"),
    ...stamps,
  },
  (t) => [
    index("project_indicators_domain_id_idx").on(t.domainId),
    index("project_indicators_indicator_id_idx").on(t.indicatorId),
    unique("project_indicators_project_indicator_unique").on(
      t.projectId,
      t.indicatorId,
    ),
  ],
);

/** Synthèse macro par projet, plus le lien vers l'outil de gestion (D28). */
export const budgets = pgTable(
  "budgets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    allocated: numeric("allocated", { precision: 18, scale: 4 }),
    consumed: numeric("consumed", { precision: 18, scale: 4 }),
    unit: budgetUnit("unit").notNull().default("days"),
    measuredOn: date("measured_on"),
    toolId: uuid("tool_id").references(() => tools.id, {
      onDelete: "set null",
    }),
    externalUrl: text("external_url"),
    ...stamps,
  },
  (t) => [
    index("budgets_domain_id_idx").on(t.domainId),
    index("budgets_tool_id_idx").on(t.toolId),
    unique("budgets_project_unique").on(t.projectId),
  ],
);

/** Lien déclaré entre deux projets, avec sa raison. Orienté, affiché des deux côtés. */
export const projectLinks = pgTable(
  "project_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    fromProjectId: uuid("from_project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    toProjectId: uuid("to_project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    reason: text("reason"),
    ...stamps,
  },
  (t) => [
    index("project_links_domain_id_idx").on(t.domainId),
    index("project_links_to_project_id_idx").on(t.toProjectId),
    unique("project_links_from_to_unique").on(t.fromProjectId, t.toProjectId),
    check("project_links_no_self_link", sql`${t.fromProjectId} <> ${t.toProjectId}`),
  ],
);

/**
 * Le journal — trace système : qui a modifié quoi, quand.
 *
 * D22 — journal léger, en écriture seule. `summary` est figé à l'écriture :
 * ni valeur avant, ni valeur après, aucune restauration possible.
 *
 * Ce n'est pas `activities`. Une activité est un fait d'accompagnement du
 * centre ; un événement est une trace technique. Les confondre produirait
 * une page projet incompréhensible.
 */
export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    /** Nul pour les événements de niveau produit ou domaine. */
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "cascade",
    }),
    actorId: uuid("actor_id").references(() => persons.id, {
      onDelete: "set null",
    }),
    verb: eventVerb("verb").notNull(),
    targetType: eventTargetType("target_type").notNull(),
    targetId: uuid("target_id"),
    /** Phrase lisible, figée à l'écriture. */
    summary: text("summary").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: uuid("created_by").references((): AnyPgColumn => persons.id, {
      onDelete: "set null",
    }),
  },
  (t) => [
    index("events_domain_id_idx").on(t.domainId),
    index("events_project_id_idx").on(t.projectId),
    index("events_product_id_idx").on(t.productId),
    index("events_occurred_at_idx").on(t.occurredAt),
  ],
);
