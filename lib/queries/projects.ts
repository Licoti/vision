/**
 * Les lectures de la liste transverse des projets.
 *
 * Elles joignent, donc elles passent par `joinedRead` — le seul chemin que la
 * couche d'accès ouvre à une jointure. **Toute table jointe porte
 * `filter(table)`**, y compris à l'intérieur des sous-requêtes `exists` :
 * c'est la condition posée par l'en-tête de `joinedRead`, et un oubli serait
 * une fuite de domaine que rien d'autre ne rattraperait.
 *
 * Ce module n'importe pas `db` : il reçoit un `ScopedDb` déjà lié au domaine
 * courant. Règle 1.
 */

import { and, asc, eq, exists, ilike, inArray, isNull, or, sql } from "drizzle-orm";

import type { ScopedDb } from "@/lib/db/scoped";
import {
  approaches,
  entities,
  jobs,
  persons,
  products,
  projectApproaches,
  projectJobs,
  projectMembers,
  projectStatusNature,
  projectStatuses,
  projects,
} from "@/lib/db/schema";

/** Les quatre natures de statut, telles que le schéma les énumère. */
export type ProjectStatusNature = (typeof projectStatusNature.enumValues)[number];

/** Un membre d'équipe, tel qu'il s'affiche : un nom. */
export type ProjectRowMember = { id: string; fullName: string };

/** Une ligne de la liste transverse — les sept colonnes de docs/06 §4. */
export type ProjectRow = {
  id: string;
  name: string;
  /** Le rattachement, affiché **et cliquable** : la hiérarchie reste lisible. */
  productId: string;
  productName: string;
  entityLabel: string;
  statusLabel: string;
  statusNature: ProjectStatusNature;
  /** Les métiers **déclarés** du projet (D44), pas ceux déduits de l'équipe. */
  jobLabels: string[];
  team: ProjectRowMember[];
  lastActivityAt: Date | null;
};

/** Les filtres combinables de l'écran. Tous facultatifs, tous cumulatifs. */
export type ProjectFilters = {
  entityId?: string | undefined;
  jobId?: string | undefined;
  approachId?: string | undefined;
  statusId?: string | undefined;
  /** Le texte saisi, déjà coupé. Vide vaut absent. */
  search?: string | undefined;
};

/**
 * Le motif d'un `like`, échappé.
 *
 * Sans cela, un `%` saisi ramène toute la liste et un `_` devient un joker :
 * la recherche cesserait de dire ce qu'elle affiche. `\` est échappé en
 * premier, faute de quoi il masquerait les échappements suivants.
 */
function likePattern(search: string): string {
  return `%${search.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

/**
 * Les projets du domaine, tous produits confondus, filtrés et triés.
 *
 * **Le tri est celui de l'activité récente** (docs/06 §4) : `last_activity_at`
 * décroissant, les projets sans activité fermant la marche, le nom départageant
 * à fraîcheur égale — un ordre qui varierait d'un affichage à l'autre serait un
 * défaut. Il diffère volontairement de celui de la page produit, qui trie sur
 * `started_on` parce qu'elle raconte une chronologie d'accompagnements ; ici on
 * cherche ce qui a bougé.
 *
 * Un projet n'a pas d'entité propre : elle vient de son produit (D-produit,
 * `docs/02` — l'entité qualifie les produits). Les projets archivés sont exclus,
 * et ceux d'un produit archivé avec eux : un accompagnement rangé n'est plus un
 * accompagnement affiché.
 *
 * Métiers et approches passent par `exists`. Sur un filtre à valeur unique une
 * jointure ferait le même résultat — la vérification a été faite, elle ne
 * duplique rien. `exists` est retenu parce qu'il ne touche pas à la forme du
 * jeu de résultats : le jour où le filtre acceptera plusieurs valeurs, la
 * jointure se mettrait à doubler les lignes et celui-ci non.
 *
 * Équipe et métiers sont lus en deux requêtes supplémentaires plutôt qu'agrégés
 * en SQL : un `json_agg` ferait tenir le tout en un aller-retour, au prix d'un
 * type que rien ne vérifie à la sortie du pilote. `is_contributor` n'est pas
 * retenu — D9 sépare l'appartenance à l'équipe du droit d'écrire, et cette
 * liste affiche une équipe, pas des droits.
 */
export function listProjects(
  scope: ScopedDb,
  filters: ProjectFilters = {},
): Promise<ProjectRow[]> {
  return scope.joinedRead(async (database, { filter }) => {
    const conditions = [
      filter(projects),
      isNull(projects.archivedAt),
      isNull(products.archivedAt),
    ];

    if (filters.entityId) conditions.push(eq(products.entityId, filters.entityId));
    if (filters.statusId) conditions.push(eq(projects.statusId, filters.statusId));

    if (filters.jobId) {
      conditions.push(
        exists(
          database
            .select({ one: sql`1` })
            .from(projectJobs)
            .where(
              and(
                filter(projectJobs),
                eq(projectJobs.projectId, projects.id),
                eq(projectJobs.jobId, filters.jobId),
              ),
            ),
        ),
      );
    }

    if (filters.approachId) {
      conditions.push(
        exists(
          database
            .select({ one: sql`1` })
            .from(projectApproaches)
            .where(
              and(
                filter(projectApproaches),
                eq(projectApproaches.projectId, projects.id),
                eq(projectApproaches.approachId, filters.approachId),
              ),
            ),
        ),
      );
    }

    if (filters.search) {
      const pattern = likePattern(filters.search);
      const onMember = exists(
        database
          .select({ one: sql`1` })
          .from(projectMembers)
          .innerJoin(
            persons,
            and(eq(persons.id, projectMembers.personId), filter(persons)),
          )
          .where(
            and(
              filter(projectMembers),
              eq(projectMembers.projectId, projects.id),
              ilike(persons.fullName, pattern),
            ),
          ),
      );

      // `or` ne rend `undefined` que sans condition : il y en a trois.
      conditions.push(
        or(
          ilike(projects.name, pattern),
          ilike(projects.objective, pattern),
          onMember,
        )!,
      );
    }

    const rows = await database
      .select({
        id: projects.id,
        name: projects.name,
        productId: products.id,
        productName: products.name,
        entityLabel: entities.label,
        statusLabel: projectStatuses.label,
        statusNature: projectStatuses.nature,
        lastActivityAt: projects.lastActivityAt,
      })
      .from(projects)
      .innerJoin(
        products,
        and(eq(products.id, projects.productId), filter(products)),
      )
      .innerJoin(
        entities,
        and(eq(entities.id, products.entityId), filter(entities)),
      )
      .innerJoin(
        projectStatuses,
        and(eq(projectStatuses.id, projects.statusId), filter(projectStatuses)),
      )
      .where(and(...conditions))
      .orderBy(sql`${projects.lastActivityAt} desc nulls last`, asc(projects.name));

    if (rows.length === 0) return [];

    const ids = rows.map((row) => row.id);

    const members = await database
      .select({
        projectId: projectMembers.projectId,
        id: persons.id,
        fullName: persons.fullName,
      })
      .from(projectMembers)
      .innerJoin(
        persons,
        and(eq(persons.id, projectMembers.personId), filter(persons)),
      )
      .where(and(filter(projectMembers), inArray(projectMembers.projectId, ids)))
      .orderBy(asc(persons.fullName));

    const declaredJobs = await database
      .select({ projectId: projectJobs.projectId, label: jobs.label })
      .from(projectJobs)
      .innerJoin(jobs, and(eq(jobs.id, projectJobs.jobId), filter(jobs)))
      .where(and(filter(projectJobs), inArray(projectJobs.projectId, ids)))
      .orderBy(asc(jobs.position), asc(jobs.label));

    const teams = new Map<string, ProjectRowMember[]>();
    for (const member of members) {
      const team = teams.get(member.projectId) ?? [];
      team.push({ id: member.id, fullName: member.fullName });
      teams.set(member.projectId, team);
    }

    const jobLabels = new Map<string, string[]>();
    for (const row of declaredJobs) {
      const labels = jobLabels.get(row.projectId) ?? [];
      labels.push(row.label);
      jobLabels.set(row.projectId, labels);
    }

    return rows.map((row) => ({
      ...row,
      jobLabels: jobLabels.get(row.id) ?? [],
      team: teams.get(row.id) ?? [],
    }));
  });
}

/** Une valeur proposée au filtrage. */
export type FilterOption = { id: string; label: string };

/** Les quatre listes de la barre de filtres. */
export type ProjectFilterOptions = {
  entities: FilterOption[];
  jobs: FilterOption[];
  approaches: FilterOption[];
  statuses: FilterOption[];
};

/**
 * Les valeurs qui portent **au moins un projet vivant**.
 *
 * Le référentiel complet en compterait davantage : proposer un filtre qui ne
 * ramène rien serait offrir un chemin vers le vide — c'est la règle posée par
 * la liste des produits. Les autres valeurs restent atteignables par l'URL, et
 * l'écran sait alors dire qu'il n'a rien trouvé.
 *
 * Les référentiels portent un `position` : c'est l'ordre du domaine, et il
 * prime sur l'alphabet. Le libellé départage.
 */
export function listProjectFilterOptions(
  scope: ScopedDb,
): Promise<ProjectFilterOptions> {
  return scope.joinedRead(async (database, { filter }) => {
    /** Un projet vivant, rattaché à un produit vivant. */
    const liveProject = and(
      filter(projects),
      isNull(projects.archivedAt),
      isNull(products.archivedAt),
    );

    const entityRows = await database
      .selectDistinct({ id: entities.id, label: entities.label, position: entities.position })
      .from(entities)
      .innerJoin(
        products,
        and(eq(products.entityId, entities.id), filter(products)),
      )
      .innerJoin(
        projects,
        and(eq(projects.productId, products.id), filter(projects)),
      )
      .where(and(filter(entities), liveProject))
      .orderBy(asc(entities.position), asc(entities.label));

    const statusRows = await database
      .selectDistinct({
        id: projectStatuses.id,
        label: projectStatuses.label,
        position: projectStatuses.position,
      })
      .from(projectStatuses)
      .innerJoin(
        projects,
        and(eq(projects.statusId, projectStatuses.id), filter(projects)),
      )
      .innerJoin(
        products,
        and(eq(products.id, projects.productId), filter(products)),
      )
      .where(and(filter(projectStatuses), liveProject))
      .orderBy(asc(projectStatuses.position), asc(projectStatuses.label));

    const jobRows = await database
      .selectDistinct({ id: jobs.id, label: jobs.label, position: jobs.position })
      .from(jobs)
      .innerJoin(projectJobs, and(eq(projectJobs.jobId, jobs.id), filter(projectJobs)))
      .innerJoin(
        projects,
        and(eq(projects.id, projectJobs.projectId), filter(projects)),
      )
      .innerJoin(
        products,
        and(eq(products.id, projects.productId), filter(products)),
      )
      .where(and(filter(jobs), liveProject))
      .orderBy(asc(jobs.position), asc(jobs.label));

    const approachRows = await database
      .selectDistinct({
        id: approaches.id,
        label: approaches.label,
        position: approaches.position,
      })
      .from(approaches)
      .innerJoin(
        projectApproaches,
        and(eq(projectApproaches.approachId, approaches.id), filter(projectApproaches)),
      )
      .innerJoin(
        projects,
        and(eq(projects.id, projectApproaches.projectId), filter(projects)),
      )
      .innerJoin(
        products,
        and(eq(products.id, projects.productId), filter(products)),
      )
      .where(and(filter(approaches), liveProject))
      .orderBy(asc(approaches.position), asc(approaches.label));

    const strip = (rows: { id: string; label: string }[]): FilterOption[] =>
      rows.map((row) => ({ id: row.id, label: row.label }));

    return {
      entities: strip(entityRows),
      jobs: strip(jobRows),
      approaches: strip(approachRows),
      statuses: strip(statusRows),
    };
  });
}
