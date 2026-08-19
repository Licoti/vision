/**
 * Les lectures de l'écran Équipe : la liste et ses filtres (T5bis.2, T5bis.3),
 * puis la **fiche** d'une personne (T5bis.4).
 *
 * Elles joignent plusieurs tables, elles passent donc par `joinedRead` — le
 * seul chemin que la couche d'accès ouvre à une jointure. **Toute table jointe
 * porte `filter(table)`** : c'est la condition posée par l'en-tête de
 * `joinedRead`, et un oubli serait une fuite de domaine que rien d'autre ne
 * rattraperait. La leçon que T5.5 a resservie : les filtres de domaine se
 * rattrapent.
 *
 * Ce module n'importe pas `db` : il reçoit un `ScopedDb` déjà lié au domaine
 * courant. Règle 1.
 */

import {
  and,
  asc,
  desc,
  eq,
  exists,
  gte,
  ilike,
  inArray,
  isNull,
  sql,
} from "drizzle-orm";

import type { ScopedDb } from "@/lib/db/scoped";
import {
  jobs,
  personAvailability,
  personKind,
  personSkills,
  persons,
  projectMembers,
  projectStatuses,
  projects,
  skillLevels,
  skills,
} from "@/lib/db/schema";
import type { ProjectStatusNature } from "@/lib/queries/projects";

/** Le côté d'où vient la personne — centre de compétence ou entité (docs/04 §2). */
export type PersonKind = (typeof personKind.enumValues)[number];

/**
 * Les trois disponibilités, telles que le schéma les énumère.
 *
 * Exportée d'ici et non du schéma, comme `ProjectStatusNature` l'est de
 * `lib/queries/projects.ts` : la pastille lit le type de la requête qui la
 * nourrit, et non de la table. C'est ce précédent qu'`AvailabilityDot` suit.
 */
export type PersonAvailability = (typeof personAvailability.enumValues)[number];

/**
 * Une compétence portée, avec son niveau.
 *
 * `levelRank` accompagne `levelLabel` parce que c'est lui qui ordonne : le
 * libellé se renomme, le rang non — la règle déjà tenue par la nature d'un
 * statut de projet.
 */
export type TeamSkill = {
  id: string;
  label: string;
  levelLabel: string;
  levelRank: number;
};

/** Une ligne de la liste Équipe — ses quatre colonnes. */
export type TeamMemberRow = {
  id: string;
  fullName: string;
  /** Nul pour qui n'a pas de métier design : une personne hors centre. */
  jobLabel: string | null;
  kind: PersonKind;
  /** Toujours nulle pour un intervenant côté entité (arbitrage (d) de C5bis). */
  availability: PersonAvailability | null;
  skills: TeamSkill[];
};

/**
 * Les cinq filtres de l'écran (T5bis.3). Tous facultatifs, tous cumulatifs.
 *
 * **Aucun d'eux ne touche à l'ordre** : le tri reste le nom, quelle que soit la
 * recherche (garde-fou 3). Un filtre restreint ce qu'on voit, il ne classe pas
 * ce qui reste.
 */
export type TeamFilters = {
  /** Le nom de la personne. Déjà coupé ; une chaîne vide vaut absent. */
  search?: string | undefined;
  jobId?: string | undefined;
  /**
   * **Conjonctif** : la personne porte *toutes* ces compétences, jamais l'une
   * ou l'autre. C'est la question qui fonde le chantier — « de l'UX Research
   * **et** de l'accessibilité ».
   */
  skillIds?: readonly string[] | undefined;
  /** « Au moins ce rang ». S'applique aux compétences cochées ; seul, à n'importe laquelle. */
  minRank?: number | undefined;
  availability?: PersonAvailability | undefined;
};

/**
 * Le motif d'un `like`, échappé.
 *
 * Sans cela, un `%` saisi ramène toute la liste et un `_` devient un joker : la
 * recherche cesserait de dire ce qu'elle affiche. `\` est échappé en premier,
 * faute de quoi il masquerait les échappements suivants.
 *
 * **Jumelle de `likePattern` de `lib/queries/projects.ts`**, et c'est une copie
 * assumée : l'importer de là-bas coupleraient deux modules de lecture qui n'ont
 * rien à voir, et choisir sa destination partagée n'est pas une décision de
 * ticket de filtre (règle 3). L'extraction vers un module neutre est proposée
 * dans `JOURNAL-TECHNIQUE.md`.
 */
function likePattern(search: string): string {
  return `%${search.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

/**
 * Les personnes du domaine, avec leur métier, leur disponibilité et les
 * compétences qu'elles déclarent.
 *
 * **Le tri est le nom, et rien d'autre** (garde-fou 3) : aucun classement, quel
 * que soit ce que porte le profil, et **quel que soit le filtre posé**.
 * L'identifiant départage deux homonymes, sans quoi l'ordre varierait d'un
 * affichage à l'autre — ce qui serait un défaut.
 *
 * Les personnes archivées sont écartées : l'écran est un référentiel. Elles
 * restent affichées dans l'équipe des accompagnements qu'elles ont menés
 * (arbitrage (e)), et c'est une autre lecture.
 *
 * **Deux lectures fixes, jamais une par personne.** Une seule requête ferait
 * tenir le tout en un aller-retour, au prix d'un `leftJoin` qui multiplierait la
 * ligne de personne autant de fois qu'elle porte de compétences — le motif
 * exact déjà tranché pour les membres d'un projet (`listProjects`) et pour les
 * participants d'une activité (`findProjectActivities`). Le nombre de requêtes
 * ne dépend ni du nombre de personnes, ni du nombre de compétences cochées.
 *
 * **Les compétences dont le référentiel a été archivé restent affichées** : seul
 * le filtre de domaine porte sur les tables jointes. La personne a déclaré cette
 * compétence ; la retirer de l'écran ferait disparaître ce que l'écran
 * racontait. `listTeamFilterOptions` écarte en revanche les valeurs archivées
 * des **options de filtre**, ce qui n'est pas le même objet — un filtre
 * n'affiche aucun profil.
 *
 * **La seconde lecture ignore les filtres**, et c'est délibéré : elle remonte
 * *toutes* les compétences des personnes retenues, jamais les seules qui ont
 * filtré. La ligne affiche un profil, pas une correspondance — marquer les
 * compétences cochées serait le surlignage du plus qualifié que la fiche
 * interdit.
 */
export function listTeam(
  scope: ScopedDb,
  filters: TeamFilters = {},
): Promise<TeamMemberRow[]> {
  return scope.joinedRead(async (database, { filter }) => {
    /**
     * « Cette personne porte cette compétence », en un `exists`.
     *
     * **Un `exists` par compétence cochée** : c'est la seule forme qui dise
     * « les deux » sans `group by` ni `having count(*)` — donc sans décompte,
     * que le garde-fou 2 interdit. Une jointure les doublerait ; un `or` dirait
     * l'inverse de ce qu'on demande.
     *
     * Le `innerJoin` sur `skill_levels` est **toujours** posé, même sans seuil :
     * toute table jointe porte son `filter()`, et une liaison dont le niveau
     * serait d'un autre domaine ne prouve aucune compétence.
     *
     * `skillId` absent vaut « n'importe laquelle » : c'est le cas du seuil de
     * niveau posé seul.
     */
    const carries = (skillId: string | undefined) =>
      exists(
        database
          .select({ one: sql`1` })
          .from(personSkills)
          .innerJoin(
            skillLevels,
            and(eq(skillLevels.id, personSkills.levelId), filter(skillLevels)),
          )
          .where(
            and(
              filter(personSkills),
              eq(personSkills.personId, persons.id),
              ...(skillId ? [eq(personSkills.skillId, skillId)] : []),
              ...(filters.minRank !== undefined
                ? [gte(skillLevels.rank, filters.minRank)]
                : []),
            ),
          ),
      );

    const conditions = [filter(persons), isNull(persons.archivedAt)];

    if (filters.search) {
      conditions.push(ilike(persons.fullName, likePattern(filters.search)));
    }
    if (filters.jobId) conditions.push(eq(persons.jobId, filters.jobId));
    if (filters.availability) {
      conditions.push(eq(persons.availability, filters.availability));
    }

    if (filters.skillIds?.length) {
      for (const skillId of filters.skillIds) conditions.push(carries(skillId));
    } else if (filters.minRank !== undefined) {
      conditions.push(carries(undefined));
    }

    // `leftJoin` : `job_id` est facultatif, une personne hors centre n'a pas de
    // métier design (docs/04 §2). Une jointure interne la ferait disparaître.
    const rows = await database
      .select({
        id: persons.id,
        fullName: persons.fullName,
        jobLabel: jobs.label,
        kind: persons.kind,
        availability: persons.availability,
      })
      .from(persons)
      .leftJoin(jobs, and(eq(jobs.id, persons.jobId), filter(jobs)))
      .where(and(...conditions))
      .orderBy(asc(persons.fullName), asc(persons.id));

    if (rows.length === 0) return [];

    const ids = rows.map((row) => row.id);

    /* L'ordre est celui de la fiche de T5bis.4 : rang décroissant, libellé
       départageant. C'est un ordre de lecture **à l'intérieur** d'un profil, et
       jamais un classement entre personnes — le garde-fou 3 porte sur l'ordre
       des personnes, que la requête ci-dessus tient au nom. Deux écrans qui
       montreraient le même profil dans deux ordres seraient un défaut. */
    const skillRows = await database
      .select({
        personId: personSkills.personId,
        id: personSkills.id,
        label: skills.label,
        levelLabel: skillLevels.label,
        levelRank: skillLevels.rank,
      })
      .from(personSkills)
      .innerJoin(skills, and(eq(skills.id, personSkills.skillId), filter(skills)))
      .innerJoin(
        skillLevels,
        and(eq(skillLevels.id, personSkills.levelId), filter(skillLevels)),
      )
      .where(and(filter(personSkills), inArray(personSkills.personId, ids)))
      .orderBy(desc(skillLevels.rank), asc(skills.label));

    const byPerson = new Map<string, TeamSkill[]>();
    for (const row of skillRows) {
      const carried = byPerson.get(row.personId) ?? [];
      carried.push({
        id: row.id,
        label: row.label,
        levelLabel: row.levelLabel,
        levelRank: row.levelRank,
      });
      byPerson.set(row.personId, carried);
    }

    return rows.map((row) => ({
      ...row,
      skills: byPerson.get(row.id) ?? [],
    }));
  });
}

/* ==========================================================================
   Les options de la barre de filtres
   ========================================================================== */

/** Une valeur proposée au filtrage. Jumelle de celle de `projects.ts`. */
export type TeamFilterOption = { id: string; label: string };

/** Un échelon de l'échelle, avec le rang qui porte le seuil. */
export type TeamLevelOption = TeamFilterOption & { rank: number };

/** Les trois listes de la barre de filtres. `dispo` n'en est pas : c'est un énuméré. */
export type TeamFilterOptions = {
  jobs: TeamFilterOption[];
  skills: TeamFilterOption[];
  levels: TeamLevelOption[];
};

/**
 * Ce que la barre de filtres propose au choix.
 *
 * **Métiers et compétences : les seules valeurs qu'une personne vivante porte.**
 * Le référentiel en compte davantage — proposer un filtre qui ne ramène rien
 * serait offrir un chemin vers le vide, la règle posée par la liste des produits
 * et tenue par `listProjectFilterOptions`. Les autres valeurs restent
 * atteignables par l'URL, et l'écran sait alors dire qu'il n'a rien trouvé.
 *
 * **L'échelle, elle, est proposée entière** (non archivée), et la raison est sa
 * sémantique : « au moins ce niveau » est un **seuil**, pas une valeur. Un
 * échelon que personne n'occupe exactement reste un seuil qui a du sens, et une
 * échelle tronquée se lirait comme un référentiel amputé. Elle sort par `rank`
 * croissant : c'est l'ordre de l'échelle, et non celui du domaine.
 *
 * **L'exception d'archivage nominative n'est pas reprise** — `includeArchived`
 * accompagné d'un `or(is null, celles-ci)` protège une valeur qu'une ligne
 * *édite* et qu'il faut garder sélectionnable. Un filtre n'édite rien : il n'a
 * aucune valeur à conserver.
 */
export async function listTeamFilterOptions(
  scope: ScopedDb,
): Promise<TeamFilterOptions> {
  const [joined, levelRows] = await Promise.all([
    scope.joinedRead(async (database, { filter }) => {
      const jobRows = await database
        .selectDistinct({
          id: jobs.id,
          label: jobs.label,
          position: jobs.position,
        })
        .from(jobs)
        .innerJoin(persons, and(eq(persons.jobId, jobs.id), filter(persons)))
        .where(
          and(
            filter(jobs),
            isNull(jobs.archivedAt),
            isNull(persons.archivedAt),
          ),
        )
        .orderBy(asc(jobs.position), asc(jobs.label));

      const skillRows = await database
        .selectDistinct({
          id: skills.id,
          label: skills.label,
          position: skills.position,
        })
        .from(skills)
        .innerJoin(
          personSkills,
          and(eq(personSkills.skillId, skills.id), filter(personSkills)),
        )
        .innerJoin(
          persons,
          and(eq(persons.id, personSkills.personId), filter(persons)),
        )
        // Le niveau est joint sans être lu : une liaison que la liste
        // n'honorerait pas — son niveau venant d'un autre domaine — ne doit pas
        // faire paraître sa compétence dans les options. Les deux requêtes
        // disent alors la même chose de la même ligne.
        .innerJoin(
          skillLevels,
          and(eq(skillLevels.id, personSkills.levelId), filter(skillLevels)),
        )
        .where(
          and(
            filter(skills),
            isNull(skills.archivedAt),
            isNull(persons.archivedAt),
          ),
        )
        .orderBy(asc(skills.position), asc(skills.label));

      return { jobRows, skillRows };
    }),
    // Aucune jointure : la couche filtre d'elle-même le domaine **et**
    // `archived_at`. C'est le chemin le plus sûr, et il suffit ici.
    scope.list(skillLevels, {
      orderBy: [asc(skillLevels.rank), asc(skillLevels.label)],
    }),
  ]);

  const strip = (rows: { id: string; label: string }[]): TeamFilterOption[] =>
    rows.map((row) => ({ id: row.id, label: row.label }));

  return {
    jobs: strip(joined.jobRows),
    skills: strip(joined.skillRows),
    levels: levelRows.map((row) => ({
      id: row.id,
      label: row.label,
      rank: row.rank,
    })),
  };
}

/* ==========================================================================
   La fiche d'une personne — T5bis.4
   ========================================================================== */

/**
 * Un accompagnement auquel la personne a participé.
 *
 * **Aucun rôle, aucun droit** : `is_contributor` n'est pas lu. D9 sépare
 * l'appartenance à l'équipe du droit d'écrire, et la fiche raconte une
 * participation — c'est déjà la règle de `listProjects`.
 */
export type PersonProject = {
  id: string;
  name: string;
  statusLabel: string;
  statusNature: ProjectStatusNature;
  /** `date` en base : une période se dit au jour, jamais en horodatage. */
  startedOn: string | null;
  expectedEndOn: string | null;
};

/** Tout ce que la fiche affiche d'une personne, et rien de plus. */
export type PersonDetail = {
  id: string;
  fullName: string;
  kind: PersonKind;
  /** Nul pour qui n'a pas de métier design : une personne hors centre. */
  jobLabel: string | null;
  /** La courte présentation. Nulle : elle est facultative. */
  bio: string | null;
  /** Toujours nulle pour un intervenant côté entité (arbitrage (d) de C5bis). */
  availability: PersonAvailability | null;
  skills: TeamSkill[];
  projects: PersonProject[];
};

/**
 * La fiche d'une personne : son profil, ses compétences, ses accompagnements.
 *
 * **Trois lectures fixes, jamais une par compétence ni par accompagnement** —
 * la discipline de `listTeam`, et la raison est la même : le nombre de requêtes
 * ne doit dépendre d'aucun décompte.
 *
 * **Une personne archivée ne rend rien** : l'écran Équipe est un référentiel,
 * et la fiche en est le détail. Elle reste affichée dans l'équipe des
 * accompagnements qu'elle a menés (arbitrage (e)), et c'est `findProjectDetail`
 * qui le fait — une autre lecture, sur un autre écran.
 *
 * **Les compétences sortent dans l'ordre de la liste** : rang décroissant, puis
 * libellé. Un ordre de lecture **à l'intérieur** d'un profil, jamais un
 * classement entre personnes (garde-fou 3) — et deux écrans qui montreraient le
 * même profil dans deux ordres seraient un défaut.
 *
 * **Seuls les accompagnements archivés sont écartés.** Ceux d'un produit
 * archivé restent : la personne les a menés, et un produit rangé ne fait pas
 * disparaître ce qu'elle a fait. C'est l'esprit de l'arbitrage (e), et la
 * divergence avec `listProjects` — qui écarte les projets d'un produit archivé
 * parce qu'elle répond à « où en sont nos accompagnements » — est assumée.
 *
 * **Aucun décompte n'est rendu** : ni nombre d'accompagnements, ni nombre de
 * compétences, ni moyenne de niveau. La liste se lit, elle ne se totalise pas
 * (garde-fou 2).
 */
export function findPersonDetail(
  scope: ScopedDb,
  personId: string,
): Promise<PersonDetail | null> {
  return scope.joinedRead(async (database, { filter }) => {
    // `leftJoin` : le métier est facultatif (docs/04 §2). Une jointure interne
    // ferait disparaître la fiche d'une personne hors centre.
    const found = await database
      .select({
        id: persons.id,
        fullName: persons.fullName,
        jobLabel: jobs.label,
        kind: persons.kind,
        bio: persons.bio,
        availability: persons.availability,
      })
      .from(persons)
      .leftJoin(jobs, and(eq(jobs.id, persons.jobId), filter(jobs)))
      .where(
        and(
          filter(persons),
          eq(persons.id, personId),
          isNull(persons.archivedAt),
        ),
      )
      .limit(1);

    const person = found[0];
    if (!person) return null;

    /* Les deux lectures suivantes sont indépendantes : un seul temps d'attente,
       la discipline de la page projet depuis T4.1. */
    const [skillRows, projectRows] = await Promise.all([
      database
        .select({
          id: personSkills.id,
          label: skills.label,
          levelLabel: skillLevels.label,
          levelRank: skillLevels.rank,
        })
        .from(personSkills)
        .innerJoin(
          skills,
          and(eq(skills.id, personSkills.skillId), filter(skills)),
        )
        .innerJoin(
          skillLevels,
          and(eq(skillLevels.id, personSkills.levelId), filter(skillLevels)),
        )
        .where(and(filter(personSkills), eq(personSkills.personId, person.id)))
        .orderBy(desc(skillLevels.rank), asc(skills.label)),

      database
        .select({
          id: projects.id,
          name: projects.name,
          statusLabel: projectStatuses.label,
          statusNature: projectStatuses.nature,
          startedOn: projects.startedOn,
          expectedEndOn: projects.expectedEndOn,
        })
        .from(projectMembers)
        .innerJoin(
          projects,
          and(eq(projects.id, projectMembers.projectId), filter(projects)),
        )
        .innerJoin(
          projectStatuses,
          and(
            eq(projectStatuses.id, projects.statusId),
            filter(projectStatuses),
          ),
        )
        .where(
          and(
            filter(projectMembers),
            eq(projectMembers.personId, person.id),
            isNull(projects.archivedAt),
          ),
        )
        /* Le plus récent d'abord, comme la liste des accompagnements d'un
           produit. Un projet sans date de début vient en dernier plutôt que de
           passer devant tout le monde ; le nom départage, et l'identifiant en
           dernier — un ordre qui varierait d'un affichage à l'autre serait un
           défaut. */
        .orderBy(
          sql`${projects.startedOn} desc nulls last`,
          asc(projects.name),
          asc(projects.id),
        ),
    ]);

    return {
      ...person,
      skills: skillRows,
      projects: projectRows,
    };
  });
}
