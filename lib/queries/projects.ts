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
  ne,
  or,
  sql,
} from "drizzle-orm";

import {
  availabilityFromProjects,
  type PersonAvailability,
} from "@/lib/availability";
import type { ScopedDb } from "@/lib/db/scoped";
import {
  activities,
  approaches,
  entities,
  events,
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
  resources,
  results,
} from "@/lib/db/schema";

/** Les quatre natures de statut, telles que le schéma les énumère. */
export type ProjectStatusNature = (typeof projectStatusNature.enumValues)[number];

/** Un membre d'équipe, tel qu'il s'affiche : un nom. */
export type ProjectRowMember = { id: string; fullName: string };

/** Une ligne de la liste transverse — ses cinq colonnes. */
export type ProjectRow = {
  id: string;
  name: string;
  /** Le rattachement, affiché **et cliquable** : la hiérarchie reste lisible. */
  productId: string;
  productName: string;
  statusLabel: string;
  statusNature: ProjectStatusNature;
  team: ProjectRowMember[];
  lastActivityAt: Date | null;
};

/**
 * Les filtres combinables de l'écran. Tous facultatifs, tous cumulatifs.
 *
 * **Les quatre de `docs/06` §4 depuis T7.2** — entité, métier, approche,
 * statut —, plus la recherche, que le document tient à part.
 */
export type ProjectFilters = {
  /**
   * L'entité, **tenue du produit** : un projet n'en porte pas.
   * `products.entity_id` est le seul chemin, et c'est déjà celui que la ligne
   * affiche quand elle rend son produit de rattachement.
   */
  entityId?: string | undefined;
  /**
   * Le métier **déclaré du projet** (D44), jamais celui de l'équipe. Les deux
   * peuvent diverger — un projet peut mobiliser un métier que personne de son
   * équipe ne porte —, et c'est le déclaré qui fait foi pour le filtrage.
   */
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
 * Les projets archivés sont exclus, et ceux d'un produit archivé avec eux : un
 * accompagnement rangé n'est plus un accompagnement affiché.
 *
 * L'approche passe par `exists`. Sur un filtre à valeur unique une jointure
 * ferait le même résultat — la vérification a été faite, elle ne duplique rien.
 * `exists` est retenu parce qu'il ne touche pas à la forme du jeu de résultats :
 * le jour où le filtre acceptera plusieurs valeurs, la jointure se mettrait à
 * doubler les lignes et celui-ci non. **Le métier reprend cette forme à la
 * lettre** (T7.2) : c'est la même liaison n-à-n, et elle appelle la même
 * précaution.
 *
 * **L'entité, elle, ne joint rien de neuf** : `products` est déjà en
 * `innerJoin`, avec son `filter()`, et l'entité se lit sur sa colonne. Il n'y a
 * donc aucun `filter()` de plus à ne pas oublier — la meilleure façon de ne pas
 * manquer une jointure est de ne pas en ajouter.
 *
 * L'équipe est lue en une requête supplémentaire plutôt qu'agrégée en SQL : un
 * `json_agg` ferait tenir le tout en un aller-retour, au prix d'un type que rien
 * ne vérifie à la sortie du pilote. `is_contributor` n'est pas retenu — D9 sépare
 * l'appartenance à l'équipe du droit d'écrire, et cette liste affiche une équipe,
 * pas des droits.
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

    if (filters.statusId) conditions.push(eq(projects.statusId, filters.statusId));

    /* L'entité se lit sur le produit, déjà joint et déjà filtré. La valeur est
       confrontée au domaine par l'écran avant d'arriver ici — et une entité
       d'ailleurs ne désignerait de toute façon aucun produit d'ici, `products`
       portant son `filter()` dans le `on` de sa jointure. */
    if (filters.entityId) {
      conditions.push(eq(products.entityId, filters.entityId));
    }

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

    const teams = new Map<string, ProjectRowMember[]>();
    for (const member of members) {
      const team = teams.get(member.projectId) ?? [];
      team.push({ id: member.id, fullName: member.fullName });
      teams.set(member.projectId, team);
    }

    return rows.map((row) => ({
      ...row,
      team: teams.get(row.id) ?? [],
    }));
  });
}

/** Une valeur proposée au filtrage. */
export type FilterOption = { id: string; label: string };

/**
 * Les **quatre** listes de la barre de filtres depuis T7.2 — l'ordre de
 * `docs/06` §4 : entité, métier, approche, statut.
 */
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

    /* L'entité passe par le produit : c'est le seul chemin d'un projet vers
       elle, et il traverse donc deux jointures là où le statut n'en traverse
       qu'une. */
    const entityRows = await database
      .selectDistinct({
        id: entities.id,
        label: entities.label,
        position: entities.position,
      })
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

    /* Le métier passe par sa table de liaison, la forme exacte de l'approche —
       **`filter()` sur chacune des trois jointures**, la table de liaison étant
       une table du domaine comme les autres. D44 : ce sont les métiers
       **déclarés du projet**, jamais ceux que son équipe porte. */
    const jobRows = await database
      .selectDistinct({
        id: jobs.id,
        label: jobs.label,
        position: jobs.position,
      })
      .from(jobs)
      .innerJoin(
        projectJobs,
        and(eq(projectJobs.jobId, jobs.id), filter(projectJobs)),
      )
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
  /**
   * Nul tant que l'accompagnement est vivant (T4bis.3). La ligne était déjà
   * rendue archivée ou non — cet en-tête n'a jamais filtré `archived_at` ; ce
   * qui manquait était de **le dire** à l'écran, qui la servait à l'identique
   * dans les deux cas. C'est aussi ce qui commande la lecture seule du rendu.
   */
  archivedAt: Date | null;
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
 * `archived_at` sort désormais du `select` (T4bis.3) : la page n'avait aucun
 * moyen de dire ce qu'elle servait déjà. C'est la même colonne qui porte la
 * mention datée et la lecture seule de l'écran — une seule lecture, deux
 * conséquences, plutôt qu'un second aller-retour pour la seconde.
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
        archivedAt: projects.archivedAt,
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

/**
 * Une personne du domaine, telle qu'elle se désigne dans une équipe.
 *
 * **Le métier et la disponibilité y sont depuis T5bis.7**, et pour une raison
 * qui n'est pas décorative : le formulaire ne crée plus de personne
 * (arbitrage (g) de C5bis), il **puise** dans le référentiel — le choix se fait
 * donc en connaissance de cause, sans quitter l'écran. Ni l'un ni l'autre n'est
 * un critère de tri ni un rapprochement avec les métiers déclarés du projet :
 * D44 pose que les deux peuvent diverger.
 */
export type ProjectFormPerson = {
  id: string;
  fullName: string;
  kind: (typeof personKind.enumValues)[number];
  /** Nul : une personne hors centre n'a pas de métier design (`docs/04` §2). */
  jobLabel: string | null;
  /**
   * Nulle pour un intervenant côté entité — arbitrage (d) de C5bis.
   *
   * **Déduite depuis le 28/08/2026** (`lib/availability.ts`) : elle ne se lit
   * plus dans une colonne, elle se compte — les accompagnements ni archivés ni
   * terminés. C'est la même règle que sur la page Équipe, et c'est ce qui compte
   * ici : deux écrans qui diraient deux disponibilités de la même personne
   * seraient un défaut.
   */
  availability: PersonAvailability | null;
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
 * Ce que la ligne éditée porte déjà, et qui reste donc proposé — T4bis.1.
 *
 * Cinq entrées, toutes facultatives : le formulaire de **création** n'en
 * fournit aucune et n'obtient aucune exception.
 */
export type ProjectFormKeep = {
  productId?: string;
  statusId?: string;
  jobIds?: readonly string[];
  approachIds?: readonly string[];
  personIds?: readonly string[];
};

/**
 * Les référentiels et les personnes du domaine, pour la création comme pour
 * l'édition.
 *
 * **Aucune jointure** : sept lectures scopées, l'entité de chaque produit et le
 * métier de chaque personne rapprochés en mémoire. C'est ce qui permet à cette
 * fonction de ne pas passer par `joinedRead` — elle n'en a pas besoin, et le
 * chemin le plus sûr reste celui que la couche filtre d'elle-même.
 *
 * **Deux référentiels sont lus archivés compris, et ce sont les deux qui
 * décrivent au lieu de proposer** : les entités, et — depuis T5bis.7 — les
 * métiers, dans une lecture **qui n'est pas celle des cases à cocher**. Un
 * produit rattaché à une entité archivée doit continuer de dire de quelle entité
 * il relève ; une personne dont le métier a été archivé doit continuer de dire
 * lequel. C'est le contraire du cas d'une valeur qu'on offrirait à la sélection,
 * et c'est pourquoi `jobs` est lu **deux fois** : la liste proposée garde son
 * exception nominative, la carte des libellés n'en a pas besoin.
 *
 * **Les cinq valeurs proposées, elles, reçoivent une exception nominative**
 * (T4bis.1) : celles que la ligne éditée porte déjà restent dans leur liste —
 * donc sélectionnées — quand bien même elles auraient été archivées depuis, et
 * n'apparaissent nulle part ailleurs. Le motif est celui de
 * `keepActivityTypeId` (`lib/queries/activities.ts`, T3.4), généralisé ici :
 * `includeArchived: true` accompagné d'un `or(is null, celles-ci)`. La règle
 * n'est pas contredite mais précisée — ces valeurs **sont déjà** celles de ce
 * projet, on ne les offre à personne.
 *
 * **Les personnes cumulent deux conditions**, et c'est ce qui les distingue des
 * quatre autres : `is_active` s'écrit dans le `where`, `archived_at` est porté
 * par la couche. Lever la seconde oblige à réécrire la première à côté, faute
 * de quoi l'exception ne rattraperait qu'une moitié du cas — une personne
 * désactivée disparaîtrait des cases à cocher aussi sûrement qu'une archivée,
 * et `syncMembers` conclurait au retrait à la première re-soumission.
 *
 * Les référentiels portent un `position` : c'est l'ordre du domaine, et il
 * prime sur l'alphabet. Le libellé départage.
 */
export async function listProjectFormOptions(
  scope: ScopedDb,
  keep: ProjectFormKeep = {},
): Promise<ProjectFormOptions> {
  /* Une liste d'identifiants vide n'est pas une exception : sans ce garde-fou,
     `inArray(col, [])` se glisserait dans le `where` pour ne rien y rétablir,
     au prix d'un `includeArchived` levé pour rien. */
  const keptJobs = keep.jobIds?.length ? keep.jobIds : undefined;
  const keptApproaches = keep.approachIds?.length ? keep.approachIds : undefined;
  const keptPersons = keep.personIds?.length ? keep.personIds : undefined;

  const [
    productRows,
    entityRows,
    statusRows,
    jobRows,
    jobLabelRows,
    approachRows,
    personRows,
    loadRows,
  ] = await Promise.all([
    scope.list(products, {
      ...(keep.productId
        ? {
            includeArchived: true,
            where: or(
              isNull(products.archivedAt),
              eq(products.id, keep.productId),
            ),
          }
        : {}),
      orderBy: [asc(products.name)],
    }),
    scope.list(entities, { includeArchived: true }),
    scope.list(projectStatuses, {
      ...(keep.statusId
        ? {
            includeArchived: true,
            where: or(
              isNull(projectStatuses.archivedAt),
              eq(projectStatuses.id, keep.statusId),
            ),
          }
        : {}),
      orderBy: [asc(projectStatuses.position), asc(projectStatuses.label)],
    }),
    scope.list(jobs, {
      ...(keptJobs
        ? {
            includeArchived: true,
            where: or(isNull(jobs.archivedAt), inArray(jobs.id, keptJobs)),
          }
        : {}),
      orderBy: [asc(jobs.position), asc(jobs.label)],
    }),
    /* La seconde lecture de `jobs`, **et elle ne propose rien** : elle nomme le
       métier des personnes, comme `entities` nomme celui des produits. Sans
       elle, le libellé viendrait de la liste ci-dessus — donc d'une liste
       filtrée par l'exception nominative de T4bis.1 —, et le métier d'une
       personne s'afficherait ou non selon le projet qu'on est en train de
       modifier. */
    scope.list(jobs, { includeArchived: true }),
    scope.list(approaches, {
      ...(keptApproaches
        ? {
            includeArchived: true,
            where: or(
              isNull(approaches.archivedAt),
              inArray(approaches.id, keptApproaches),
            ),
          }
        : {}),
      orderBy: [asc(approaches.position), asc(approaches.label)],
    }),
    scope.list(persons, {
      ...(keptPersons
        ? {
            includeArchived: true,
            where: or(
              and(eq(persons.isActive, true), isNull(persons.archivedAt)),
              inArray(persons.id, keptPersons),
            ),
          }
        : { where: eq(persons.isActive, true) }),
      orderBy: [asc(persons.fullName)],
    }),
    /* **La huitième lecture, et elle est fixe** (28/08/2026) : le nombre
       d'accompagnements **en cours** par personne, en un seul regroupement pour
       tout le domaine. Jamais une requête par personne — la discipline de
       `listTeam` et de `findProjectActivities`.

       Elle ne se restreint pas aux personnes retenues ci-dessus : les deux
       lectures partent ensemble, donc leurs identifiants ne sont pas encore
       connus, et un domaine a moins de membres que d'accompagnements. Ce qui
       n'est pas retenu ne sera simplement pas lu dans la carte.

       **Les deux exclusions sont celles de `listTeam`** — ni archivé, ni
       terminé —, et c'est la seule chose que les deux lectures doivent dire à
       l'identique. Elles ne partagent pas leur SQL : ce sont deux formes
       (sous-requête corrélée là-bas, regroupement ici), et c'est un témoin de
       test qui tient l'accord, pas le compilateur.

       `filter()` est posé sur les trois tables jointes, comme partout dans
       `joinedRead` : un membre, un accompagnement ou un statut d'un autre
       domaine ne prouve aucune charge. */
    scope.joinedRead((database, { filter }) =>
      database
        .select({
          personId: projectMembers.personId,
          total: sql<number>`count(*)::int`,
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
            isNull(projects.archivedAt),
            ne(projectStatuses.nature, "done"),
          ),
        )
        .groupBy(projectMembers.personId),
    ),
  ]);

  const entityLabels = new Map(entityRows.map((row) => [row.id, row.label]));
  const jobLabels = new Map(jobLabelRows.map((row) => [row.id, row.label]));
  /* Absente de la carte : zéro accompagnement en cours. `groupBy` ne rend pas
     de ligne pour qui n'en a aucun — ni pour qui n'en a que des terminés —, et
     c'est justement le cas « Disponible ». */
  const projectLoad = new Map(loadRows.map((row) => [row.personId, row.total]));

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
      jobLabel: row.jobId ? (jobLabels.get(row.jobId) ?? null) : null,
      /* Arbitrage (d) de C5bis, tenu par la lecture depuis que le `CHECK` est
         tombé avec la colonne : un intervenant côté entité ne porte pas de
         disponibilité. */
      availability:
        row.kind === "center"
          ? availabilityFromProjects(projectLoad.get(row.id) ?? 0)
          : null,
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

/* ==========================================================================
   Ce qu'une suppression emporte — 28/08/2026
   ========================================================================== */

/**
 * Ce que la suppression d'un accompagnement effacerait avec lui.
 *
 * **Quatre nombres, et ils ne décident de rien.** Ils sont lus pour être
 * **dits** — c'est la règle de `liveProductCount` sur les entités —, à ceci près
 * qu'ici, à la différence des entités, **rien d'autre ne décide non plus** : les
 * dix clés étrangères qui pointent `projects.id` sont `on delete cascade`, et
 * aucune n'opposera de refus. Le panneau de confirmation est le seul garde-fou
 * de ce geste, et ce décompte est ce qu'il annonce. Voir `DeletableTable`
 * (`lib/db/scoped.ts`).
 *
 * **Quatre, et pas dix.** Les six autres cascades — métiers, approches, équipe,
 * adoptions d'indicateurs, budget, liens déclarés — se nomment dans la phrase
 * du panneau sans se compter : « trois approches » n'aide personne à décider,
 * quand « douze activités » le fait. On compte ce qui pèse.
 *
 * **Les archivés comptent** (`includeArchived`) : c'est la totalité qui part, et
 * annoncer un nombre plus petit que la réalité serait le contraire d'une mise en
 * garde. Les résultats se comptent par leur activité — `results` n'a pas de
 * `project_id` —, et `events` n'a pas d'`archived_at` : sa ligne est une trace,
 * elle ne se range pas.
 *
 * Quatre lectures qui partent ensemble : le nombre d'allers-retours ne dépend
 * pas du nombre de lignes comptées, et ce panneau ne s'ouvre qu'une fois.
 */
export type ProjectContents = {
  activities: number;
  resources: number;
  results: number;
  events: number;
};

export function countProjectContents(
  scope: ScopedDb,
  projectId: string,
): Promise<ProjectContents> {
  return scope.joinedRead(async (database, { filter }) => {
    /* **Quatre lectures et non une**, et c'est une correction du 28/08/2026 :
       la version d'origine tenait les quatre décomptes en sous-requêtes
       scalaires écrites à la main, et PostgreSQL l'a refusée — un `sql` brut ne
       qualifie pas ses colonnes comme le fait le constructeur de requêtes, si
       bien que le `id` de la jointure des résultats devenait ambigu. Le défaut
       s'est lu dans le HTML servi, en 500 sur le panneau.

       La forme d'ici ne s'écrit plus en SQL : trois `count` de la couche, plus
       une jointure pour les résultats — `results` n'ayant pas de `project_id`.
       Elles partent ensemble, donc un seul temps d'attente, et ce panneau ne
       s'ouvre qu'une fois, sur une confirmation. */
    const [activityRows, resourceRows, resultRows, eventRows] =
      await Promise.all([
        scope.count(activities, {
          where: eq(activities.projectId, projectId),
          includeArchived: true,
        }),
        scope.count(resources, {
          where: eq(resources.projectId, projectId),
          includeArchived: true,
        }),
        database
          .select({ id: results.id })
          .from(results)
          .innerJoin(
            activities,
            and(eq(activities.id, results.activityId), filter(activities)),
          )
          .where(and(filter(results), eq(activities.projectId, projectId))),
        scope.count(events, { where: eq(events.projectId, projectId) }),
      ]);

    return {
      activities: activityRows,
      resources: resourceRows,
      results: resultRows.length,
      events: eventRows,
    };
  });
}
