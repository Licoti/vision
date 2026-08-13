/**
 * Les lectures des écrans de projet — la liste transverse, la page, et depuis
 * T2.6 les deux formulaires.
 *
 * Celles qui joignent passent par `joinedRead` — le seul chemin que la couche
 * d'accès ouvre à une jointure. **Toute table jointe porte `filter(table)`**,
 * y compris à l'intérieur des sous-requêtes `exists` : c'est la condition
 * posée par l'en-tête de `joinedRead`, et un oubli serait une fuite de domaine
 * que rien d'autre ne rattraperait.
 *
 * Celles du formulaire ne joignent pas, et ne passent donc pas par là : elles
 * s'en tiennent à `list`, que la couche filtre d'elle-même. C'est le chemin le
 * plus sûr ; il n'y a aucune raison de le quitter quand il suffit.
 *
 * Ce module n'importe pas `db` : il reçoit un `ScopedDb` déjà lié au domaine
 * courant. Règle 1.
 */

import {
  and,
  asc,
  eq,
  exists,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  sql,
} from "drizzle-orm";

import type { ScopedDb } from "@/lib/db/scoped";
import {
  approaches,
  entities,
  jobs,
  personKind,
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

/* ==========================================================================
   La page projet
   ========================================================================== */

/** Un membre de l'équipe. `kind` distingue le centre de l'entité (docs/04 §2). */
export type ProjectTeamMember = {
  id: string;
  fullName: string;
  kind: (typeof personKind.enumValues)[number];
};

/** L'en-tête d'identité de la page projet (docs/06 §5). */
export type ProjectDetail = {
  id: string;
  name: string;
  objective: string | null;
  /** D6 — commanditaire, texte libre. Souvent nul. */
  sponsor: string | null;
  statusLabel: string;
  statusNature: ProjectStatusNature;
  /** Colonnes `date` : chaînes `YYYY-MM-DD`, formatées par `lib/format`. */
  startedOn: string | null;
  expectedEndOn: string | null;
  /** Le parent, affiché **et cliquable** : un projet ne s'affiche jamais seul. */
  productId: string;
  productName: string;
  entityLabel: string;
  /** Les approches déclarées, dans l'ordre du référentiel du domaine. */
  approachLabels: string[];
  team: ProjectTeamMember[];
};

/**
 * Un projet du domaine, avec son produit, son entité, son statut, ses
 * approches et son équipe.
 *
 * Rend `undefined` sur un identifiant inconnu **comme sur un projet d'un autre
 * domaine** : la distinction n'appartient pas à l'appelant, et l'écran répond
 * 404 dans les deux cas. Un projet archivé est rendu, et un projet dont le
 * produit est archivé aussi — règle 4, une donnée archivée reste lisible. La
 * liste transverse les masque tous deux ; les masquer ici casserait un lien
 * déjà distribué.
 *
 * Trois requêtes plutôt qu'un `json_agg` : c'est le choix déjà motivé plus
 * haut dans ce module — un type qu'aucune vérification ne couvre à la sortie
 * du pilote ne vaut pas l'aller-retour économisé. `is_contributor` n'est pas
 * lu : D9 sépare l'appartenance à l'équipe du droit d'écrire, et cet en-tête
 * affiche une équipe, pas des droits.
 */
export function findProjectDetail(
  scope: ScopedDb,
  id: string,
): Promise<ProjectDetail | undefined> {
  return scope.joinedRead(async (database, { filter }) => {
    const rows = await database
      .select({
        id: projects.id,
        name: projects.name,
        objective: projects.objective,
        sponsor: projects.sponsor,
        statusLabel: projectStatuses.label,
        statusNature: projectStatuses.nature,
        startedOn: projects.startedOn,
        expectedEndOn: projects.expectedEndOn,
        productId: products.id,
        productName: products.name,
        entityLabel: entities.label,
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
      .where(and(eq(projects.id, id), filter(projects)))
      .limit(1);

    const project = rows[0];
    if (!project) return undefined;

    const declaredApproaches = await database
      .select({ label: approaches.label })
      .from(projectApproaches)
      .innerJoin(
        approaches,
        and(eq(approaches.id, projectApproaches.approachId), filter(approaches)),
      )
      .where(
        and(
          filter(projectApproaches),
          eq(projectApproaches.projectId, project.id),
        ),
      )
      .orderBy(asc(approaches.position), asc(approaches.label));

    const team = await database
      .select({
        id: persons.id,
        fullName: persons.fullName,
        kind: persons.kind,
      })
      .from(projectMembers)
      .innerJoin(
        persons,
        and(eq(persons.id, projectMembers.personId), filter(persons)),
      )
      .where(
        and(filter(projectMembers), eq(projectMembers.projectId, project.id)),
      )
      .orderBy(asc(persons.fullName));

    return {
      ...project,
      approachLabels: declaredApproaches.map((row) => row.label),
      team,
    };
  });
}

/**
 * Le rang de l'accompagnement dans l'histoire de son produit — le « 2ᵉ » de
 * « 2ᵉ accompagnement de ce produit » (docs/06 §7).
 *
 * **Il se calcule, il ne se saisit pas** : aucune colonne ne le porte, et il
 * change tout seul le jour où un accompagnement plus ancien est enregistré.
 *
 * L'ordre est l'exact miroir de celui de la page produit — `started_on` puis
 * le nom —, si bien que le rang lu ici et la position lue là-bas ne peuvent
 * pas se contredire. Les accompagnements archivés ne comptent pas, comme ils
 * ne s'affichent pas ; le projet consulté fait exception, un projet archivé
 * restant lisible (règle 4).
 *
 * Rend `null` quand le projet n'a pas de date de début : on ne situe pas dans
 * une chronologie ce qui n'y est pas daté, et la mention disparaît alors de
 * l'écran plutôt que d'annoncer un rang inventé.
 */
export function findAccompanimentRank(
  scope: ScopedDb,
  project: { id: string; productId: string },
): Promise<number | null> {
  return scope.joinedRead(async (database, { filter }) => {
    const siblings = await database
      .select({ id: projects.id })
      .from(projects)
      .where(
        and(
          filter(projects),
          eq(projects.productId, project.productId),
          isNotNull(projects.startedOn),
          or(isNull(projects.archivedAt), eq(projects.id, project.id)),
        ),
      )
      .orderBy(asc(projects.startedOn), asc(projects.name));

    const index = siblings.findIndex((sibling) => sibling.id === project.id);
    return index === -1 ? null : index + 1;
  });
}

/* ==========================================================================
   Le formulaire d'un accompagnement
   ========================================================================== */

/** Un produit de rattachement, avec l'entité qui en découle (D24). */
export type ProjectFormProduct = {
  id: string;
  name: string;
  entityLabel: string;
};

/** Une personne du domaine, telle qu'elle se désigne dans une équipe. */
export type ProjectFormPerson = {
  id: string;
  fullName: string;
  kind: (typeof personKind.enumValues)[number];
};

/** Tout ce que les deux écrans de saisie proposent au choix. */
export type ProjectFormOptions = {
  products: ProjectFormProduct[];
  statuses: FilterOption[];
  jobs: FilterOption[];
  approaches: FilterOption[];
  people: ProjectFormPerson[];
};

/**
 * Les référentiels et les personnes du domaine, pour la création comme pour
 * l'édition.
 *
 * **Aucune jointure** : six lectures scopées, et l'entité de chaque produit
 * rapprochée en mémoire. C'est ce qui permet à cette fonction de ne pas passer
 * par `joinedRead` — elle n'en a pas besoin, et le chemin le plus sûr reste
 * celui que la couche filtre d'elle-même.
 *
 * Les entités sont lues **archivées comprises**, et elles seules : le libellé
 * d'entité est ici descriptif, pas proposé au choix. Un produit rattaché à une
 * entité archivée doit continuer de dire de quelle entité il relève, plutôt
 * que de s'afficher amputé — c'est le contraire du cas d'une valeur qu'on
 * offrirait à la sélection.
 *
 * Les référentiels portent un `position` : c'est l'ordre du domaine, et il
 * prime sur l'alphabet. Le libellé départage.
 */
export async function listProjectFormOptions(
  scope: ScopedDb,
): Promise<ProjectFormOptions> {
  const [
    productRows,
    entityRows,
    statusRows,
    jobRows,
    approachRows,
    personRows,
  ] = await Promise.all([
    scope.list(products, { orderBy: [asc(products.name)] }),
    scope.list(entities, { includeArchived: true }),
    scope.list(projectStatuses, {
      orderBy: [asc(projectStatuses.position), asc(projectStatuses.label)],
    }),
    scope.list(jobs, { orderBy: [asc(jobs.position), asc(jobs.label)] }),
    scope.list(approaches, {
      orderBy: [asc(approaches.position), asc(approaches.label)],
    }),
    scope.list(persons, {
      where: eq(persons.isActive, true),
      orderBy: [asc(persons.fullName)],
    }),
  ]);

  const entityLabels = new Map(entityRows.map((row) => [row.id, row.label]));

  return {
    products: productRows.map((product) => ({
      id: product.id,
      name: product.name,
      entityLabel: entityLabels.get(product.entityId) ?? "entité inconnue",
    })),
    statuses: statusRows.map((row) => ({ id: row.id, label: row.label })),
    jobs: jobRows.map((row) => ({ id: row.id, label: row.label })),
    approaches: approachRows.map((row) => ({ id: row.id, label: row.label })),
    people: personRows.map((row) => ({
      id: row.id,
      fullName: row.fullName,
      kind: row.kind,
    })),
  };
}

/**
 * L'état des liaisons d'un projet, tel que le formulaire le réaffiche.
 *
 * Trois lectures scopées, sans jointure : seuls les identifiants comptent —
 * les libellés sont déjà dans les référentiels chargés à côté.
 */
export async function findProjectLinks(
  scope: ScopedDb,
  projectId: string,
): Promise<{
  jobIds: string[];
  approachIds: string[];
  members: { personId: string; isContributor: boolean }[];
}> {
  const [jobRows, approachRows, memberRows] = await Promise.all([
    scope.list(projectJobs, { where: eq(projectJobs.projectId, projectId) }),
    scope.list(projectApproaches, {
      where: eq(projectApproaches.projectId, projectId),
    }),
    scope.list(projectMembers, {
      where: eq(projectMembers.projectId, projectId),
    }),
  ]);

  return {
    jobIds: jobRows.map((row) => row.jobId),
    approachIds: approachRows.map((row) => row.approachId),
    members: memberRows.map((row) => ({
      personId: row.personId,
      isContributor: row.isContributor,
    })),
  };
}
