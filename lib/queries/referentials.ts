/**
 * Les lectures de l'écran **Administration**, pour les huit référentiels qu'il
 * gère hors des entités : métiers, approches, compétences, échelle de maîtrise
 * (T7.3), puis statuts de projet, types d'activité, outils et pistes de
 * démarrage (T7.4).
 *
 * **La lecture est générique, l'écriture ne l'est pas.** Une fonction de lecture
 * paramétrée par la table, mais une fonction d'écriture par table — c'est la
 * fiche de T7.3, et la raison est dans `lib/db/scoped.ts` : une indirection sur
 * l'écriture rendrait `assertPreconditions` illisible et ferait de la couche
 * scopée un endroit où le domaine se **déduit** plutôt qu'il ne se pose. Une
 * lecture n'a pas ce problème : elle ne pose rien, elle filtre.
 *
 * **Les entités n'entrent pas ici**, et ce n'est pas un oubli : elles sont la
 * seule table de ce groupe qui se supprime (arbitrage (g) de `tickets-C7.md`),
 * donc la seule à porter **deux** décomptes — celui qui s'oppose au rangement et
 * celui qui s'oppose à l'effacement. `listEntitiesForAdmin` reste dans
 * `lib/queries/entities.ts` ; l'écran adapte ses lignes à la forme ci-dessous.
 *
 * **Le décompte ne dit que ce qui s'oppose à un geste.** Aucun tri par usage,
 * aucun classement, aucun « le plus employé » : `docs/06` §10 proscrit le
 * classement, et D39 tout indice calculé par Vision pour qualifier un objet. Le
 * tri de chaque référentiel est **exactement** celui de ses lecteurs existants —
 * `position` puis `label` pour trois d'entre eux, `rank` puis `label` pour
 * l'échelle, que `lib/queries/team.ts` et `lib/drawers/team.tsx` ordonnent ainsi.
 *
 * **Toute colonne d'une sous-requête passe par `eq` ou `isNull`, jamais par une
 * interpolation nue.** C'est un piège de Drizzle, et il est silencieux : dans la
 * position de **sélection**, un `${table.colonne}` interpolé tel quel perd sa
 * qualification et sort en `"id"` plutôt qu'en `"skills"."id"`. La requête
 * devient alors ambiguë et PostgreSQL la refuse — donc un 500, et non un
 * mauvais nombre. Les conditions construites (`eq`, `isNull`, `filter`) gardent
 * la leur ; ce sont donc elles qu'on écrit.
 *
 * **Les décomptes sont des sous-requêtes scalaires corrélées**, non des
 * jointures. Une jointure aurait demandé un `count(distinct …)` par source pour
 * survivre à la multiplication des lignes, et deux sources par référentiel en
 * auraient fait une règle à retenir. Une sous-requête compte ce qu'elle compte,
 * et le `filter(table)` s'y lit sur **chacune** de ses tables — la condition
 * posée par l'en-tête de `joinedRead`, dont l'oubli serait une fuite de domaine
 * que rien d'autre ne rattraperait.
 *
 * **Quatre référentiels portent de la logique, et la lecture le rend.** Un
 * statut sans sa `nature`, un type sans sa `family` sont des libellés dont on ne
 * sait pas ce qu'ils commandent — or `docs/04` §1 pose exactement l'inverse :
 * *les libellés changent, la logique non*. `logic` remonte donc cette valeur
 * d'énuméré jusqu'à l'écran, qui la nomme. Ce n'est **pas** un indice calculé
 * (D39) : c'est une colonne saisie, rendue telle quelle.
 *
 * Ce module n'importe pas `db` : il reçoit un `ScopedDb` déjà lié au domaine
 * courant. Règle 1.
 */

import { and, asc, eq, isNull, sql, type SQL } from "drizzle-orm";

import type { PgColumn } from "drizzle-orm/pg-core";

import type { Row, ScopedDb, ScopedTable } from "@/lib/db/scoped";
import {
  activities,
  activityTypes,
  approaches,
  jobs,
  personSkills,
  persons,
  projectApproaches,
  projectJobs,
  projects,
  projectStatuses,
  skillLevels,
  skills,
  starters,
  toolKind,
  tools,
} from "@/lib/db/schema";
import type { Referential } from "@/lib/navigation";
import type { ActivityFamily } from "@/lib/queries/activities";
import type { ProjectStatusNature } from "@/lib/queries/projects";
import type { StarterKind } from "@/lib/queries/starters";

/**
 * Le genre d'un outil raccordé.
 *
 * Il vit ici plutôt que dans un module d'outils qui n'existe pas : `tools` n'a
 * pas de lecture à elle, et c'est cet écran qui la gère. La règle du dossier —
 * chaque module de requête exporte les types d'énuméré qu'il sert — est celle
 * de `ProjectStatusNature`, d'`ActivityFamily` et de `StarterKind`.
 */
export type ToolKind = (typeof toolKind.enumValues)[number];

/** Les huit référentiels que ce module lit. Les entités ont le leur. */
export type ManagedReferential = Exclude<Referential, "entites">;

/** Les huit tables, et rien d'autre. Une union nominative, comme
 *  `DeletableTable` : ce qui les rassemble est une décision, pas une forme.
 *
 *  **Le mot « simple » est tombé en T7.4** : il était juste tant que les quatre
 *  tables partageaient un libellé et un ordre ; une piste de démarrage porte six
 *  champs, et un nom qui ment coûte plus cher qu'un renommage. */
export type ManagedReferentialTable =
  | typeof jobs
  | typeof approaches
  | typeof skills
  | typeof skillLevels
  | typeof projectStatuses
  | typeof activityTypes
  | typeof tools
  | typeof starters;

/**
 * Une ligne de l'une de ces huit tables, telle que `find` la rend.
 *
 * **Écrite en union, et non en `Row<ManagedReferentialTable>`** : les deux
 * disent la même chose au compilateur, mais celle-ci se **rétrécit** par un
 * `in`. C'est ce qui permet au résolveur de panneau de retrouver la table d'une
 * ligne — `"nature" in row` ne peut désigner qu'un statut — sans écrire un seul
 * `as`. Un `as` tiendrait aujourd'hui et mentirait le jour où une neuvième table
 * entrerait.
 */
export type ManagedReferentialRow =
  | Row<typeof jobs>
  | Row<typeof approaches>
  | Row<typeof skills>
  | Row<typeof skillLevels>
  | Row<typeof projectStatuses>
  | Row<typeof activityTypes>
  | Row<typeof tools>
  | Row<typeof starters>;

/**
 * Ce qui référence une ligne de référentiel, **par nature**.
 *
 * Chacun de ces nombres s'oppose à l'archivage : ranger une ligne que des
 * données vivantes portent encore les laisserait à l'écran sans leur filtre —
 * l'argument de `liveProductCount` sur les entités, resservi. Les quatre champs
 * sont toujours présents ; ceux qu'un référentiel ne connaît pas valent zéro, et
 * `USAGE_SOURCES`, sur l'écran, dit lesquels il rend.
 *
 * `products` n'est jamais alimenté ici : il n'existe que pour que l'écran puisse
 * couler les entités dans la même forme sans que `lib/queries/entities.ts` ne
 * bouge.
 */
export type ReferentialUsage = {
  /** Produits vivants — les entités seules, rempli par l'écran. */
  products: number;
  /** Accompagnements vivants qui déclarent la ligne. */
  projects: number;
  /** Personnes vivantes qui la portent. */
  persons: number;
  /** Activités vivantes qui la portent. */
  activities: number;
  /**
   * Types d'activité vivants qui nomment la ligne comme outil par défaut — les
   * outils seuls (T7.4).
   */
  activityTypes: number;
  /**
   * Pistes de démarrage vivantes qui renvoient vers la ligne — les outils
   * seuls (T7.4).
   *
   * **C'est le décompte qui porte l'arbitrage.** Aucune des quatre clés
   * étrangères de `tools` n'est `restrict` : rien en base ne retient un outil.
   * Ce qui s'y oppose est donc une décision, et elle se lit dans
   * `lib/queries/starters.ts` — la jointure y porte `isNull(tools.archivedAt)`,
   * si bien qu'archiver l'outil ferait perdre à la piste son lien profond **en
   * silence**. Un résultat, lui, porte son propre `external_url` : il ne perd
   * rien, et il ne compte pas ici.
   */
  starters: number;
  /**
   * Déclarations de compétence qui citent la ligne — l'échelle de maîtrise
   * seule.
   *
   * **Ce n'est pas un nombre de personnes, et c'est pourquoi il a son champ.**
   * Une personne déclare plusieurs compétences, et souvent au même niveau : sur
   * la base de développement, le rang « Avancé » porte **15 déclarations pour 9
   * personnes**. Le compter dans `persons` faisait dire à l'écran « 15
   * personnes » là où le centre n'en a que dix — mesuré dans le HTML servi le
   * 30/08/2026, et corrigé par ce champ.
   *
   * Ce qui s'oppose au rangement est bien la **déclaration**, pas la personne :
   * `person_skills.level_id` est `restrict`, et c'est chaque ligne de liaison
   * qui retient le niveau.
   */
  declarations: number;
};

/** Rien ne référence la ligne : les deux gestes de rangement s'ouvrent. */
export const NO_USAGE: ReferentialUsage = {
  products: 0,
  projects: 0,
  persons: 0,
  activities: 0,
  activityTypes: 0,
  starters: 0,
  declarations: 0,
};

/** Rien ne s'oppose au rangement de cette ligne. */
export function isUnused(usage: ReferentialUsage): boolean {
  return (
    usage.products === 0 &&
    usage.projects === 0 &&
    usage.persons === 0 &&
    usage.activities === 0 &&
    usage.activityTypes === 0 &&
    usage.starters === 0 &&
    usage.declarations === 0
  );
}

/**
 * Une ligne de l'écran d'administration, tous référentiels confondus.
 *
 * `position` revient en **chaîne** : `numeric(10,2)` est rendu tel quel par le
 * pilote, et l'arrondir en nombre ici perdrait la précision que la colonne
 * garde. Elle vaut `null` pour l'échelle de maîtrise, que `rank` ordonne, et
 * pour les entités, dont aucun écran ne lit la position. `rank` fait
 * l'inverse : renseigné par l'échelle seule.
 */
export type AdminReferentialRow = {
  id: string;
  /** Le libellé de la ligne — **`tools.name` pour les outils**, qui est la
   *  seule des neuf tables à ne pas nommer sa colonne `label`. */
  label: string;
  /** L'ordre saisi. Nul là où il n'a pas de lecteur — et `tools` n'a pas la
   *  colonne : ni au schéma, ni dans `docs/04` §2. */
  position: string | null;
  /** Le rang de l'échelle de maîtrise. Nul pour les sept autres référentiels. */
  rank: number | null;
  /**
   * La logique que la ligne porte, quand elle en porte une (T7.4).
   *
   * Nulle pour les quatre référentiels de T7.3, qui ne portent qu'un libellé et
   * un ordre. Elle remonte **la valeur d'énuméré**, jamais son libellé français :
   * traduire est le rôle de `lib/format.ts`, et une requête qui rendrait déjà des
   * mots aurait posé une seconde autorité sur le vocabulaire.
   */
  logic: ReferentialLogic | null;
  /** Nul tant que la ligne est en service. Les archivées sont **rendues**. */
  archivedAt: Date | null;
  usage: ReferentialUsage;
};

/**
 * Ce qu'un référentiel porte en plus de son libellé, et que le domaine ne
 * renomme pas.
 *
 * **Une union discriminée, jamais une chaîne** : le variant dit quelle table de
 * libellés l'écran doit lire, et le compilateur refuse d'appliquer
 * `formatToolKind` à une famille d'activité. C'est aussi ce qui la rend
 * constructible **sans cast** — chaque `case` de la lecture sélectionne sa
 * colonne d'énuméré, déjà typée par Drizzle, et la range dans son variant.
 */
export type ReferentialLogic =
  | { kind: "nature"; value: ProjectStatusNature }
  | { kind: "family"; value: ActivityFamily }
  | { kind: "toolKind"; value: ToolKind }
  | { kind: "starterKind"; value: StarterKind };

/* ==========================================================================
   Les quatre décomptes, un par référentiel
   ========================================================================== */

/**
 * Les décomptes d'un référentiel, en SQL, prêts à entrer dans un `select`.
 *
 * **Un `switch` qui nomme chaque table en littéral** : c'est ce qui rend la
 * règle relisible ligne à ligne, et ce qui fait que le jour où une clé étrangère
 * change de nature, le geste de la suivre commence ici.
 *
 * Les sous-requêtes sont **corrélées** à la ligne du `select` extérieur : elles
 * citent `jobs.id`, `approaches.id`… Elles ne se lisent donc pas seules, et
 * c'est voulu — ce sont des colonnes, pas des requêtes.
 */
function usageOf(
  referential: ManagedReferential,
  filter: (table: ScopedTable) => SQL,
): {
  projects: SQL<number>;
  persons: SQL<number>;
  activities: SQL<number>;
  activityTypes: SQL<number>;
  starters: SQL<number>;
  declarations: SQL<number>;
} {
  const zero = sql<number>`0::int`;

  switch (referential) {
    case "metiers":
      return {
        /* La liaison `project_jobs` ne porte pas d'`archived_at` — c'est une
           table de liaison : il faut atteindre `projects` pour savoir si
           l'accompagnement vit encore. Le décompte porte donc sur des projets,
           pas sur des lignes de liaison. */
        projects: sql<number>`(
          select count(*)::int
          from ${projectJobs}
          join ${projects} on ${eq(projects.id, projectJobs.projectId)}
          where ${eq(projectJobs.jobId, jobs.id)}
            and ${filter(projectJobs)}
            and ${filter(projects)}
            and ${isNull(projects.archivedAt)}
        )`,
        /* `persons.job_id` est facultative et `set null` : une personne hors
           centre n'a pas de métier design. Seules les vivantes s'y opposent. */
        persons: sql<number>`(
          select count(*)::int
          from ${persons}
          where ${eq(persons.jobId, jobs.id)}
            and ${filter(persons)}
            and ${isNull(persons.archivedAt)}
        )`,
        activities: zero,
        activityTypes: zero,
        starters: zero,
        declarations: zero,
      };

    case "approches":
      return {
        projects: sql<number>`(
          select count(*)::int
          from ${projectApproaches}
          join ${projects} on ${eq(projects.id, projectApproaches.projectId)}
          where ${eq(projectApproaches.approachId, approaches.id)}
            and ${filter(projectApproaches)}
            and ${filter(projects)}
            and ${isNull(projects.archivedAt)}
        )`,
        persons: zero,
        /* D12 — une activité porte au plus une approche, `set null`. */
        activities: sql<number>`(
          select count(*)::int
          from ${activities}
          where ${eq(activities.approachId, approaches.id)}
            and ${filter(activities)}
            and ${isNull(activities.archivedAt)}
        )`,
        activityTypes: zero,
        starters: zero,
        declarations: zero,
      };

    case "competences":
      return {
        projects: zero,
        /* `person_skills` est une table de liaison, sans `archived_at` : c'est
           la personne qu'il faut atteindre pour savoir si la déclaration vit
           encore. L'unicité `(person_id, skill_id)` fait de ce décompte un
           nombre de **personnes**, exactement. */
        persons: sql<number>`(
          select count(*)::int
          from ${personSkills}
          join ${persons} on ${eq(persons.id, personSkills.personId)}
          where ${eq(personSkills.skillId, skills.id)}
            and ${filter(personSkills)}
            and ${filter(persons)}
            and ${isNull(persons.archivedAt)}
        )`,
        activities: zero,
        activityTypes: zero,
        starters: zero,
        declarations: zero,
      };

    case "niveaux":
      return {
        projects: zero,
        persons: zero,
        activities: zero,
        activityTypes: zero,
        starters: zero,
        /* Le même décompte sur l'autre clé — et il compte cette fois des
           **déclarations** : une personne peut porter plusieurs compétences au
           même niveau. Ce qui s'oppose au rangement est l'existence de la
           déclaration, pas celle de la personne, et c'est ce nombre-là que le
           refus doit annoncer — comme la colonne qui le rend. */
        declarations: sql<number>`(
          select count(*)::int
          from ${personSkills}
          join ${persons} on ${eq(persons.id, personSkills.personId)}
          where ${eq(personSkills.levelId, skillLevels.id)}
            and ${filter(personSkills)}
            and ${filter(persons)}
            and ${isNull(persons.archivedAt)}
        )`,
      };

    /* ------------------------------------------------------------------
       T7.4 — les quatre référentiels porteurs de logique
       ------------------------------------------------------------------ */

    case "statuts":
      return {
        /* `projects.status_id` est `not null` et `restrict` : c'est la clé la
           plus tenue des huit, et la base refuserait elle-même l'effacement.
           Le décompte, lui, sert le **rangement**, que rien en base ne
           retient — ranger un statut que des accompagnements vivants portent
           les laisserait dans la liste sans leur filtre. */
        projects: sql<number>`(
          select count(*)::int
          from ${projects}
          where ${eq(projects.statusId, projectStatuses.id)}
            and ${filter(projects)}
            and ${isNull(projects.archivedAt)}
        )`,
        persons: zero,
        activities: zero,
        activityTypes: zero,
        starters: zero,
        declarations: zero,
      };

    case "types":
      return {
        projects: zero,
        persons: zero,
        /* D16 — `activities.activity_type_id` est obligatoire. Une activité
           archivée ne s'y oppose pas : elle a déjà quitté la roadmap. */
        activities: sql<number>`(
          select count(*)::int
          from ${activities}
          where ${eq(activities.activityTypeId, activityTypes.id)}
            and ${filter(activities)}
            and ${isNull(activities.archivedAt)}
        )`,
        activityTypes: zero,
        starters: zero,
        declarations: zero,
      };

    case "outils":
      return {
        projects: zero,
        persons: zero,
        activities: zero,
        /* **Deux sources, et aucune n'est une barrière de base** : les quatre
           clés étrangères qui pointent `tools` sont `set null`. Ce qui s'oppose
           au rangement est donc une décision, et elle porte sur les deux lignes
           de **référentiel** que l'archivage laisserait muettes — le type qui
           nomme l'outil par défaut, la piste qui y renvoie. Les résultats et les
           budgets ne comptent pas : chacun porte son propre `external_url` et ne
           perd rien. */
        activityTypes: sql<number>`(
          select count(*)::int
          from ${activityTypes}
          where ${eq(activityTypes.defaultToolId, tools.id)}
            and ${filter(activityTypes)}
            and ${isNull(activityTypes.archivedAt)}
        )`,
        starters: sql<number>`(
          select count(*)::int
          from ${starters}
          where ${eq(starters.toolId, tools.id)}
            and ${filter(starters)}
            and ${isNull(starters.archivedAt)}
        )`,
        declarations: zero,
      };

    case "pistes":
      /* **Rien ne référence `starters`**, et le dire est le geste juste : une
         piste s'archive toujours, et l'écran n'a aucun décompte à rendre en
         face d'elle. Inventer une opposition symétrique aux sept autres serait
         le garde-fou de confort que la règle 3 interdit. */
      return {
        projects: zero,
        persons: zero,
        activities: zero,
        activityTypes: zero,
        starters: zero,
        declarations: zero,
      };
  }
}

/* ==========================================================================
   Les trois lectures
   ========================================================================== */

/**
 * Les colonnes plates du `select` remontées dans la forme de l'écran.
 *
 * `logic` n'y est pas une colonne : elle est **rangée avant** d'arriver ici,
 * par le `.map()` du `case` qui l'a sélectionnée. C'est ce qui la construit sans
 * cast — la colonne d'énuméré est typée par Drizzle, et le variant se referme
 * sur elle.
 */
type FlatRow = {
  id: string;
  label: string;
  position: string | null;
  rank: number | null;
  logic?: ReferentialLogic | null;
  archivedAt: Date | null;
  projects: number;
  persons: number;
  activities: number;
  activityTypes: number;
  starters: number;
  declarations: number;
};

function toRows(rows: FlatRow[]): AdminReferentialRow[] {
  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    position: row.position,
    rank: row.rank,
    logic: row.logic ?? null,
    archivedAt: row.archivedAt,
    usage: {
      products: 0,
      projects: row.projects,
      persons: row.persons,
      activities: row.activities,
      activityTypes: row.activityTypes,
      starters: row.starters,
      declarations: row.declarations,
    },
  }));
}

/**
 * Le référentiel demandé, **archivés compris**.
 *
 * C'est l'écart que l'écran d'administration porte seul : un écran de gestion
 * doit montrer ce qu'il a rangé, sans quoi le rangement serait une disparition
 * et le rétablissement n'aurait aucun point d'entrée. Les lectures d'usage —
 * `listProjectFormOptions`, `listTeamFormOptions` — gardent leur filtre : une
 * ligne archivée ne qualifie plus rien de neuf.
 */
export function listReferentialForAdmin(
  scope: ScopedDb,
  referential: ManagedReferential,
): Promise<AdminReferentialRow[]> {
  return scope.joinedRead(async (database, { filter }) => {
    const usage = usageOf(referential, filter);
    /* Les deux colonnes qu'un référentiel sur deux n'a pas. Écrites en SQL
       plutôt qu'ajoutées après coup : la forme de la ligne ne dépend alors pas
       de l'ordre dans lequel on la construit. */
    const noPosition = sql<string | null>`null::text`;
    const noRank = sql<number | null>`null::smallint`;

    switch (referential) {
      case "metiers":
        return toRows(
          await database
            .select({
              id: jobs.id,
              label: jobs.label,
              position: jobs.position,
              rank: noRank,
              archivedAt: jobs.archivedAt,
              ...usage,
            })
            .from(jobs)
            .where(filter(jobs))
            .orderBy(asc(jobs.position), asc(jobs.label)),
        );

      case "approches":
        return toRows(
          await database
            .select({
              id: approaches.id,
              label: approaches.label,
              position: approaches.position,
              rank: noRank,
              archivedAt: approaches.archivedAt,
              ...usage,
            })
            .from(approaches)
            .where(filter(approaches))
            .orderBy(asc(approaches.position), asc(approaches.label)),
        );

      case "competences":
        return toRows(
          await database
            .select({
              id: skills.id,
              label: skills.label,
              position: skills.position,
              rank: noRank,
              archivedAt: skills.archivedAt,
              ...usage,
            })
            .from(skills)
            .where(filter(skills))
            .orderBy(asc(skills.position), asc(skills.label)),
        );

      case "niveaux":
        return toRows(
          await database
            .select({
              id: skillLevels.id,
              label: skillLevels.label,
              /* L'échelle ne saisit pas `position` : c'est `rank` qui l'ordonne,
                 ici comme dans les quatre lectures de `lib/queries/team.ts`. Une
                 colonne saisie que rien ne lit est celle qu'on relit un jour
                 sans savoir pourquoi — la leçon de T5.2. */
              position: noPosition,
              rank: skillLevels.rank,
              archivedAt: skillLevels.archivedAt,
              ...usage,
            })
            .from(skillLevels)
            .where(filter(skillLevels))
            .orderBy(asc(skillLevels.rank), asc(skillLevels.label)),
        );

      /* ----------------------------------------------------------------
         T7.4 — les quatre référentiels porteurs de logique

         Chacun `.map()` sa colonne d'énuméré dans son variant **avant**
         `toRows` : la valeur arrive typée de Drizzle, le variant se referme
         dessus, et aucun cast n'est écrit.
         ---------------------------------------------------------------- */

      case "statuts": {
        const rows = await database
          .select({
            id: projectStatuses.id,
            label: projectStatuses.label,
            position: projectStatuses.position,
            rank: noRank,
            nature: projectStatuses.nature,
            archivedAt: projectStatuses.archivedAt,
            ...usage,
          })
          .from(projectStatuses)
          .where(filter(projectStatuses))
          .orderBy(asc(projectStatuses.position), asc(projectStatuses.label));

        return toRows(
          rows.map(({ nature, ...rest }) => ({
            ...rest,
            logic: { kind: "nature" as const, value: nature },
          })),
        );
      }

      case "types": {
        const rows = await database
          .select({
            id: activityTypes.id,
            label: activityTypes.label,
            position: activityTypes.position,
            rank: noRank,
            family: activityTypes.family,
            archivedAt: activityTypes.archivedAt,
            ...usage,
          })
          .from(activityTypes)
          .where(filter(activityTypes))
          .orderBy(asc(activityTypes.position), asc(activityTypes.label));

        return toRows(
          rows.map(({ family, ...rest }) => ({
            ...rest,
            logic: { kind: "family" as const, value: family },
          })),
        );
      }

      case "outils": {
        const rows = await database
          .select({
            /* **`name`, et non `label`** : `tools` est la seule des neuf tables
               à nommer ainsi sa colonne. L'alias la coule dans la forme commune
               ici, une fois, plutôt qu'à chaque endroit qui rend une ligne. */
            id: tools.id,
            label: tools.name,
            /* `tools` **n'a pas de `position`** — ni au schéma, ni dans
               `docs/04` §2 —, et T7.4 n'a pas de migration à dépenser pour lui
               en donner une (arbitrage (a) de `tickets-C7.md`). L'alphabet est
               alors le seul ordre qui ne varie pas d'un affichage à l'autre,
               comme pour `listResultToolOptions`. */
            position: noPosition,
            rank: noRank,
            kind: tools.kind,
            archivedAt: tools.archivedAt,
            ...usage,
          })
          .from(tools)
          .where(filter(tools))
          .orderBy(asc(tools.name));

        return toRows(
          rows.map(({ kind, ...rest }) => ({
            ...rest,
            logic: { kind: "toolKind" as const, value: kind },
          })),
        );
      }

      case "pistes": {
        const rows = await database
          .select({
            id: starters.id,
            label: starters.label,
            position: starters.position,
            rank: noRank,
            kind: starters.kind,
            archivedAt: starters.archivedAt,
            ...usage,
          })
          .from(starters)
          .where(filter(starters))
          .orderBy(asc(starters.position), asc(starters.label));

        return toRows(
          rows.map(({ kind, ...rest }) => ({
            ...rest,
            logic: { kind: "starterKind" as const, value: kind },
          })),
        );
      }
    }
  });
}

/**
 * Ce qui s'oppose au rangement d'**une** ligne.
 *
 * Deux appelants, et ce n'est pas la même chose qu'ils en font : le panneau de
 * confirmation le lit pour **dire** ce qui s'opposera au geste avant qu'on
 * l'exerce, l'action le relit pour **refuser**. C'est la seconde qui protège —
 * arbitrage (j) de `tickets-C7.md`, et la forme de `liveProductCount` sur les
 * entités : un menu retiré n'a jamais protégé le point d'entrée qu'il affichait.
 *
 * La ligne est confrontée au domaine par la lecture scopée elle-même : un
 * identifiant d'un autre domaine ne compte rien, il ne « manque » pas.
 */
export async function countReferentialUsage(
  scope: ScopedDb,
  referential: ManagedReferential,
  rowId: string,
): Promise<ReferentialUsage> {
  return scope.joinedRead(async (database, { filter }) => {
    const usage = usageOf(referential, filter);
    const table = TABLE_OF[referential];

    const rows = await database
      .select(usage)
      .from(table)
      .where(and(eq(table.id, rowId), filter(table)));

    const found = rows[0];
    if (!found) return NO_USAGE;

    return {
      products: 0,
      projects: found.projects,
      persons: found.persons,
      activities: found.activities,
      activityTypes: found.activityTypes,
      starters: found.starters,
      declarations: found.declarations,
    };
  });
}

/**
 * Les libellés déjà pris dans un référentiel — archivés compris.
 *
 * **Les archivés en font partie**, et c'est le cœur du refus de doublon : une
 * ligne rangée sous le nom qu'on retape existe toujours, et en créer une seconde
 * du même nom est exactement ce que le point ouvert d'`ETAT.md` décrit sur
 * l'amorçage par clé naturelle. Le refus propose alors de rétablir, ce qui est
 * le geste juste.
 *
 * `exceptId` écarte la ligne qu'on corrige : sans lui, récrire « UX Design » en
 * « UX Design » se refuserait soi-même. Jumelle de `listEntityLabels`.
 *
 * **La table se passe en argument, elle ne se déduit pas d'un référentiel** :
 * l'appelant est une action, qui nomme déjà sa table en littéral, et lui faire
 * traduire un identifiant de référentiel serait exactement l'indirection que la
 * fiche refuse côté écriture.
 *
 * **La colonne de libellé aussi, depuis T7.4**, et pour une raison qu'on ne peut
 * pas deviner : `tools` nomme la sienne `name`. La déduire demanderait de
 * reconnaître la table ici, c'est-à-dire de refaire l'indirection à un cran plus
 * bas ; l'appelant, lui, écrit déjà `tools` en toutes lettres, et écrire
 * `tools.name` à côté ne lui coûte rien.
 */
export function listReferentialLabels(
  scope: ScopedDb,
  table: ManagedReferentialTable,
  labelColumn: PgColumn,
  options: { exceptId?: string | undefined } = {},
): Promise<{ id: string; label: string; archivedAt: Date | null }[]> {
  return scope.joinedRead(async (database, { filter }) => {
    return database
      .select({
        id: table.id,
        label: labelColumn,
        archivedAt: table.archivedAt,
      })
      .from(table)
      .where(
        and(
          filter(table),
          ...(options.exceptId ? [sql`${table.id} <> ${options.exceptId}`] : []),
        ),
      );
  });
}

/**
 * La table de chaque référentiel — **pour la lecture seulement**.
 *
 * Elle sert le `from` de `countReferentialUsage`, où la table n'a rien à poser :
 * ni domaine, ni acteur, ni estampille. Les **trente-deux** écritures de T7.3 et
 * T7.4 ne l'emploient pas — chacune nomme sa table en littéral, et c'est le prix
 * connu de la règle 1.
 */
const TABLE_OF = {
  metiers: jobs,
  approches: approaches,
  competences: skills,
  niveaux: skillLevels,
  statuts: projectStatuses,
  types: activityTypes,
  outils: tools,
  pistes: starters,
} as const satisfies Record<ManagedReferential, ManagedReferentialTable>;
