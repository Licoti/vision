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

/* La disponibilité n'est plus un énuméré de base, et c'est le sens de la
   migration `0010` (28/08/2026) : le jour annoncé par l'arbitrage (b) de C5bis
   — « une liste fermée de trois valeurs dont la logique dépendra directement le
   jour où elle **se dérivera des accompagnements** » — est arrivé. La colonne,
   son `CHECK` et le type `person_availability` sont tombés ensemble ; les trois
   valeurs vivent désormais dans `lib/queries/team.ts`, avec la règle qui les
   produit. Une valeur déduite n'a pas de colonne : la stocker serait se donner
   deux autorités sur un même mot. */

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

/**
 * La nature d'une piste de démarrage.
 *
 * C'est l'axe d'extension du bloc « Démarrage » : `tool` renvoie vers une
 * plateforme raccordée, `method` propose une manière de faire qu'aucun outil ne
 * porte, `resource` désignera un document de référence. Les trois valeurs
 * existent parce que le bloc en affiche l'étiquette ; aucune n'attend un
 * lecteur futur.
 */
export const starterKind = pgEnum("starter_kind", [
  "tool",
  "method",
  "resource",
]);

/** D10 — `internal` porte les missions transverses. */
export const productKind = pgEnum("product_kind", ["product", "internal"]);

/**
 * Le rang d'un persona d'un produit — **principal** ou **secondaire**.
 *
 * Concept ajouté hors des `docs/` (18/08/2026), comme la North Star et la
 * vision avant lui : ni `docs/02` ni `docs/04` ne nomment le persona. L'écart
 * est consigné dans `JOURNAL-TECHNIQUE.md`, comme le prévoit la règle 6.
 *
 * Ce n'est **ni un score ni un classement** (D39) : deux valeurs saisies à la
 * main, qui disent quels profils portent le produit. Rien ne les calcule, rien
 * ne les ordonne au-delà de « les principaux d'abord », et un produit peut en
 * porter autant de principaux qu'il veut — aucune unicité ne s'y oppose.
 */
export const personaKind = pgEnum("persona_kind", ["primary", "secondary"]);

/**
 * La famille d'un trait de persona : un **objectif**, un **irritant**, une
 * **attente**.
 *
 * C'est cette liste qui fait des trois zones de texte du panneau un contenu
 * **structuré** : un irritant est une ligne de `persona_traits`, avec son
 * identifiant propre, et non une phrase noyée dans un paragraphe. C'est la
 * condition pour qu'un parcours ou un use case puisse un jour désigner
 * « l'irritant que cet écran adresse » sans reprise de données.
 */
export const personaTraitKind = pgEnum("persona_trait_kind", [
  "goal",
  "pain",
  "expectation",
]);

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

/**
 * Une **piste de démarrage** : ce qu'un designer peut envisager pour ouvrir un
 * accompagnement.
 *
 * Référentiel du domaine, comme `tools` et `activity_types` — pas de
 * `project_id` ni de `product_id` : la boîte à outils est la même sur tous les
 * accompagnements, et c'est ce qui en fait une **invitation** plutôt qu'une
 * prescription. Ajouter une piste coûte une ligne, jamais un module.
 *
 * **L'adresse n'est pas ici.** Elle vit sur `tools.base_url`, et une seule
 * fois : deux sources pour un même lien divergeraient le jour où l'une des deux
 * changerait. Une piste sans outil — une méthode — n'a donc pas de lien, ce qui
 * est un état normal.
 *
 * **Ce que la table ne porte pas, et pourquoi** : aucun `activity_type_id`,
 * parce que personne ne le lirait aujourd'hui (leçon de T5.2) — le jour où une
 * piste devra ouvrir le panneau d'activité sur son type, ce sera une colonne de
 * plus. Aucune URL construite avec le contexte du projet non plus : ce serait le
 * « niveau 2 — lancement délégué » que `docs/03` §5 et D15 rangent après le POC.
 */
export const starters = pgTable(
  "starters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    label: text("label").notNull(),
    /** La phrase de la carte : ce que la piste permet, en une ligne. */
    summary: text("summary").notNull(),
    /** Le texte long du panneau. Nul tant que personne ne l'a écrit. */
    guidance: text("guidance"),
    kind: starterKind("kind").notNull(),
    /** L'outil vers lequel la piste renvoie, quand il y en a un. */
    toolId: uuid("tool_id").references(() => tools.id, {
      onDelete: "set null",
    }),
    position: numeric("position", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...stamps,
  },
  (t) => [
    index("starters_domain_id_idx").on(t.domainId),
    index("starters_tool_id_idx").on(t.toolId),
  ],
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
    /* `availability` a été retirée le 28/08/2026 (migration `0010`) : la
       question que son commentaire laissait ouverte — « un nombre ? une charge ?
       une période ? » — a été tranchée par l'humain, et c'est **un nombre**,
       celui des accompagnements vivants. La valeur se déduit à la lecture
       (`lib/queries/team.ts`), sur le précédent de D40, qui calcule déjà le
       statut d'accompagnement d'un produit plutôt que de le stocker. */
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
    /* `persons_availability_requires_center` est tombé avec la colonne
       (28/08/2026). L'arbitrage (d) de C5bis tient toujours — la disponibilité
       est une propriété du centre —, mais **il n'a plus de gardien en base** :
       c'est la dérivation de `lib/queries/team.ts` qui rend `null` pour un
       intervenant côté entité. Perte de garantie nommée au journal technique. */
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

/**
 * Un **persona** du produit : l'archétype d'utilisateur pour qui on conçoit.
 *
 * **Concept ajouté hors des `docs/`** (18/08/2026), comme `products.vision` et
 * `indicators.is_north_star` avant lui. Le bloc de tête de la page produit dit
 * *pourquoi* le produit existe et *ce qu'il mesure* ; il ne disait nulle part
 * **pour qui**. L'écart au modèle documenté est consigné dans
 * `JOURNAL-TECHNIQUE.md` (règle 6).
 *
 * **Piège de nom, à ne jamais confondre** — la paire `activities` / `events` de
 * `CLAUDE.md` a désormais une sœur : `persons` est une **personne réelle**,
 * membre du centre ou intervenant côté entité, qui peut porter un compte et
 * figurer dans une équipe. `personas` est un **archétype d'utilisateur du
 * produit**, qui n'existe pas et ne se connecte à rien. Deux tables sans aucun
 * rapport, dont les noms ne diffèrent que d'une lettre.
 *
 * **Un référentiel, pas un contenu éditorial.** La ligne porte un identifiant
 * stable, et c'est sa raison d'être : le 19/08/2026, `use_case_personas` l'a
 * désignée pour la première fois — sans reprise de données, ce que cette phrase
 * annonçait. **C'est la seule table de liaison qui pointe ici**, et les autres
 * ne s'écrivent pas d'avance : une fonctionnalité, une étape de méga-parcours
 * ou le rattachement d'un `persona_traits` à un use case seront des tables de
 * plus, le jour où un écran les lira. Une table sans écrivain ni lecteur est
 * une table qu'on relit un jour sans savoir pourquoi (la leçon de T5.2).
 *
 * `on delete cascade` sur le produit, comme `indicators` : un persona n'existe
 * pas hors du produit qu'il décrit. La cascade ne se déclenche jamais en usage
 * — rien ne supprime un produit (règle 4).
 */
export const personas = pgTable(
  "personas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** Le rôle ou le contexte : « Responsable d'agence », « Client pressé ». */
    role: text("role"),
    /** La description courte, celle que le panneau de détail porte sous le nom. */
    summary: text("summary"),
    /**
     * L'adresse de l'image, **hébergée ailleurs**.
     *
     * Vision ne stocke aucun fichier (`docs/02`) : c'est un lien, comme
     * `resources.url`, et la même règle de forme le valide — `http:` ou
     * `https:`. Nulle, l'écran retombe sur la pastille d'initiales.
     */
    imageUrl: text("image_url"),
    kind: personaKind("kind").notNull().default("secondary"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...stamps,
  },
  (t) => [
    index("personas_domain_id_idx").on(t.domainId),
    index("personas_product_id_idx").on(t.productId),
  ],
);

/**
 * Un **trait** de persona : un objectif, un irritant ou une attente.
 *
 * Une ligne par élément, et c'est tout l'enjeu du modèle : la saisie se fait
 * par trois zones de texte — une ligne = un élément —, mais ce qui arrive en
 * base est une liste d'objets identifiés, pas trois paragraphes. Sans cette
 * table, « rattacher un use case à l'irritant qu'il adresse » imposerait
 * demain une reprise de données.
 *
 * **Aucun `archived_at`, délibérément.** C'est une `LinkTable` au sens de
 * `lib/db/scoped.ts`, ce qui rend `unlink` disponible **à la compilation** :
 * une ligne d'objectif est une ligne d'une zone de texte, qu'on récrit et
 * qu'on retire, pas une donnée métier qu'on archive. C'est la règle de
 * `project_jobs` et d'`activity_participants`, et la même que suit la vision
 * produit — corriger un champ de texte n'est pas la suppression que la règle 4
 * proscrit.
 *
 * **Aucune contrainte d'unicité sur `(persona_id, kind, label)`**, et c'est un
 * choix : elle imposerait de retirer avant d'ajouter, à rebours de la règle de
 * T3.6 — les ajouts passent avant les retraits, faute de transaction. Le
 * dédoublonnage se fait donc à la saisie (`lib/forms/persona.ts`), là où il se
 * lit.
 */
export const personaTraits = pgTable(
  "persona_traits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    personaId: uuid("persona_id")
      .notNull()
      .references(() => personas.id, { onDelete: "cascade" }),
    kind: personaTraitKind("kind").notNull(),
    label: text("label").notNull(),
    /**
     * Le rang dans sa famille, 0-indexé — l'ordre de saisie.
     *
     * Un objectif n'a pas d'ordre naturel, et le trier par libellé ferait
     * varier l'affichage à chaque correction. Le rang est donc celui des
     * lignes de la zone de texte, tel qu'il a été tapé.
     */
    position: smallint("position").notNull(),
    ...stamps,
  },
  (t) => [
    index("persona_traits_domain_id_idx").on(t.domainId),
    index("persona_traits_persona_id_idx").on(t.personaId),
  ],
);

/**
 * Un **use case** du produit : le grand scénario d'usage qui en structure la
 * lecture (19/08/2026).
 *
 * **Concept ajouté hors des `docs/`**, comme `products.vision`,
 * `indicators.is_north_star` et `personas` avant lui. L'écart au modèle
 * documenté est consigné dans `JOURNAL-TECHNIQUE.md` (règle 6), et son
 * intitulé d'interface reste **« Use Cases »**, en anglais, contre la règle
 * « interface en français » de `CLAUDE.md` — arbitrage humain du 19/08/2026,
 * consigné au même endroit.
 *
 * **Le niveau de lecture du milieu.** La page produit disait pourquoi le
 * produit existe, ce qu'il mesure et pour qui il est conçu ; elle ne disait
 * pas **comment il est construit**. Un use case regroupe ce qui sert un même
 * objectif : `personas` → `use_cases` → fonctionnalités, dont seuls les deux
 * premiers rangs existent aujourd'hui.
 *
 * **`summary` est `not null`**, à la différence de `personas.summary` : la
 * demande pose le titre *et* la description courte comme le minimum d'un use
 * case. Le rattachement d'un persona, lui, est **facultatif** (arbitrage
 * humain du 19/08/2026) — un produit peut porter ses scénarios avant d'avoir
 * décrit ses profils.
 *
 * **Aucune colonne de rang, et c'est un choix.** L'ordre d'affichage est celui
 * de l'écriture (`created_at`, puis `id` pour départager) : **stable**, lisible
 * dans la lecture, et sans écran pour le réordonner. Une colonne `position` sans
 * geste qui l'écrive serait la colonne qu'on relit un jour sans savoir pourquoi
 * (la leçon de T5.2) ; elle viendra avec le réordonnancement, ou avec les
 * méga-parcours qui séquenceront des use cases de plusieurs produits. **Sa
 * limite est mesurée et notée dans `listProductUseCases`** : un lot d'écriture
 * partage un horodatage, et l'ordre y est alors celui des identifiants.
 *
 * `on delete cascade` sur le produit, comme `personas` et `indicators` : un use
 * case n'existe pas hors du produit qu'il décrit. La cascade ne se déclenche
 * jamais en usage — rien ne supprime un produit (règle 4).
 */
export const useCases = pgTable(
  "use_cases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    /** « Démarrer, reprendre un projet ». */
    title: text("title").notNull(),
    /** Ce que le scénario permet, et pourquoi. Obligatoire (voir l'en-tête). */
    summary: text("summary").notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...stamps,
  },
  (t) => [
    index("use_cases_domain_id_idx").on(t.domainId),
    index("use_cases_product_id_idx").on(t.productId),
  ],
);

/**
 * Le rattachement d'un **persona** à un **use case** — « pour qui ce scénario
 * existe ».
 *
 * **Une table de liaison, jamais une colonne**, et c'est ici que vit la
 * souplesse demandée. Un use case sert de zéro à plusieurs profils, un profil
 * traverse plusieurs scénarios : une colonne aurait figé le rapport à un seul
 * sens et interdit le second. Le jour où un use case devra désigner une
 * fonctionnalité, un irritant précis de `persona_traits` — dont l'identifiant
 * est stable par construction, c'est la raison d'être du diff de `syncTraits` —
 * ou une étape de méga-parcours, ce sera **une table de plus**, sans qu'une
 * ligne existante bouge.
 *
 * **Aucun `archived_at`, délibérément.** C'est une `LinkTable` au sens de
 * `lib/db/scoped.ts`, ce qui rend `unlink` disponible **à la compilation** :
 * décocher une case n'est pas la suppression de donnée métier que la règle 4
 * proscrit — c'est la correction d'un champ, la règle de `persona_traits`, de
 * `project_jobs` et d'`activity_participants`.
 *
 * L'unicité est portée par la base ici, à la différence de `persona_traits` :
 * une case à cocher ne se coche pas deux fois, et le couple est un
 * **identifiant**, pas un libellé qu'on récrit. Le dédoublonnage de la saisie
 * (`lib/forms/use-case.ts`) la double sans la remplacer.
 */
export const useCasePersonas = pgTable(
  "use_case_personas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: domainRef(),
    useCaseId: uuid("use_case_id")
      .notNull()
      .references(() => useCases.id, { onDelete: "cascade" }),
    personaId: uuid("persona_id")
      .notNull()
      .references(() => personas.id, { onDelete: "cascade" }),
    ...stamps,
  },
  (t) => [
    index("use_case_personas_domain_id_idx").on(t.domainId),
    index("use_case_personas_use_case_id_idx").on(t.useCaseId),
    index("use_case_personas_persona_id_idx").on(t.personaId),
    unique("use_case_personas_use_case_persona_unique").on(
      t.useCaseId,
      t.personaId,
    ),
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
    /**
     * Le lien vers l'outil où le travail se fait — Ergonome pour un audit UX,
     * Everyone pour un audit d'accessibilité (21/08/2026).
     *
     * **À ne pas confondre avec `results.external_url`**, qui pointe le
     * *rapport* d'un résultat et n'existe donc qu'une fois l'activité terminée.
     * Celui-ci pointe l'*espace de travail*, et vaut dès qu'une activité est
     * prévue : c'est précisément le trou que la page laissait — un audit à
     * venir ne menait nulle part.
     *
     * **Saisie à la main, jamais construite.** C'est le niveau 1 déclaratif de
     * `docs/03` §5. Une adresse fabriquée à partir du contexte du projet serait
     * le niveau 2, « lancement délégué », que D15 range après le POC.
     */
    externalUrl: text("external_url"),
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
     * La cible de cet indicateur — **et la seule**.
     *
     * Elle vivait en double jusqu'au 29/08/2026 : ici l'objectif du produit, sur
     * `project_indicators.target_value` ce qu'un accompagnement s'était fixé. Le
     * second lieu de vérité que `JOURNAL-TECHNIQUE.md` assumait au 17/08/2026 est
     * refermé — la colonne d'adoption a été supprimée (migration `0011`), et un
     * accompagnement qui adopte l'indicateur reprend cette cible-ci sans pouvoir
     * la contredire.
     *
     * **C'est un écart à `docs/02` §4**, qui écrit « toute cible d'indicateur
     * appartient à un projet », et à `docs/04` §3, qui porte `target_value` sur
     * l'adoption. Aucune décision de `docs/07` ne place la cible ; l'écart est
     * consigné dans `JOURNAL-TECHNIQUE.md`.
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
 * L'adoption d'un indicateur par un projet : le rattachement, et sa valeur de
 * référence. C'est la table qui relie l'accompagnement à son effet supposé. Elle
 * ne calcule rien — Vision juxtapose, elle ne prouve pas.
 *
 * **`target_value` et `final_value` l'ont quittée le 29/08/2026** (migration
 * `0011`). La cible est celle de l'indicateur, et une seule : deux lieux pour
 * une même valeur, c'est une divergence qui attend son heure. `baseline_value`
 * reste, elle : « où en était l'indicateur au démarrage de **cet**
 * accompagnement » ne se dit nulle part ailleurs, et ne peut pas contredire une
 * cible. Écart à `docs/02` §5 et `docs/04` §3, consigné dans
 * `JOURNAL-TECHNIQUE.md`.
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
