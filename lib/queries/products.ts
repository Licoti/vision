/**
 * Les lectures de l'écran Produits, et depuis T4bis.1 celles de son formulaire.
 *
 * Celles qui joignent passent par `joinedRead` — le seul chemin que la couche
 * d'accès ouvre à une jointure. **Toute table jointe porte `filter(table)`** :
 * c'est la condition posée par l'en-tête de `joinedRead`, et un oubli serait
 * une fuite de domaine que rien d'autre ne rattraperait.
 *
 * Celle du formulaire ne joint pas, et ne passe donc pas par là : elle s'en
 * tient à `list`, que la couche filtre d'elle-même. C'est le chemin le plus
 * sûr ; il n'y a aucune raison de le quitter quand il suffit — la règle posée
 * par `lib/queries/projects.ts`, dont ce module reprend la découpe.
 *
 * Ce module n'importe pas `db` : il reçoit un `ScopedDb` déjà lié au domaine
 * courant. Règle 1.
 */

import { and, asc, eq, inArray, isNull, or, sql } from "drizzle-orm";

import type { ScopedDb } from "@/lib/db/scoped";
import {
  entities,
  persons,
  products,
  projectMembers,
  projectStatusNature,
  projectStatuses,
  projects,
} from "@/lib/db/schema";
import { projectPeriods } from "@/lib/queries/project-period";

/** Une ligne de la liste : les quatre colonnes du ticket, et de quoi lier. */
export type ProductRow = {
  id: string;
  name: string;
  entityId: string;
  entityLabel: string;
  /** Nombre d'accompagnements vivants. Un produit peut n'en avoir aucun. */
  projectCount: number;
  /** La plus récente des fraîcheurs de ses projets. Nulle si rien n'a bougé. */
  lastActivityAt: Date | null;
};

/**
 * Les produits accompagnés du domaine, avec leur entité, leur nombre
 * d'accompagnements et leur dernière activité.
 *
 * Le tri est alphabétique : le ticket n'en impose aucun, et « par activité
 * récente » appartient à la liste transverse des projets (docs/06 §4).
 *
 * Les produits archivés sont exclus, et les projets archivés ne comptent pas :
 * un accompagnement rangé n'est plus un accompagnement affiché.
 */
export function listProductsWithCounts(
  scope: ScopedDb,
  options: { entityId?: string | undefined } = {},
): Promise<ProductRow[]> {
  return scope.joinedRead(async (database, { filter }) => {
    const rows = await database
      .select({
        id: products.id,
        name: products.name,
        entityId: entities.id,
        entityLabel: entities.label,
        projectCount: sql<number>`count(${projects.id})::int`,
        lastActivityAt: sql<Date | null>`max(${projects.lastActivityAt})`,
      })
      .from(products)
      .innerJoin(
        entities,
        and(eq(entities.id, products.entityId), filter(entities)),
      )
      .leftJoin(
        projects,
        and(
          eq(projects.productId, products.id),
          filter(projects),
          isNull(projects.archivedAt),
        ),
      )
      .where(
        and(
          filter(products),
          isNull(products.archivedAt),
          ...(options.entityId ? [eq(products.entityId, options.entityId)] : []),
        ),
      )
      .groupBy(products.id, entities.id)
      .orderBy(asc(products.name));

    return rows.map((row) => ({
      ...row,
      // `max()` d'une colonne `timestamptz` revient en chaîne selon le pilote :
      // la conversion se fait ici, une fois, plutôt que dans chaque appelant.
      lastActivityAt: row.lastActivityAt ? new Date(row.lastActivityAt) : null,
    }));
  });
}

/** Une entité proposée au filtrage. */
export type ProductEntity = { id: string; label: string };

/**
 * Les entités qui portent au moins un produit vivant.
 *
 * Le référentiel complet en compterait davantage : proposer un filtre qui ne
 * ramène rien serait offrir un chemin vers le vide. Les entités sans produit
 * restent atteignables par l'URL, et l'écran sait le dire.
 */
export function listProductEntities(scope: ScopedDb): Promise<ProductEntity[]> {
  return scope.joinedRead(async (database, { filter }) => {
    return database
      .selectDistinct({ id: entities.id, label: entities.label })
      .from(entities)
      .innerJoin(
        products,
        and(
          eq(products.entityId, entities.id),
          filter(products),
          isNull(products.archivedAt),
        ),
      )
      .where(and(filter(entities), isNull(entities.archivedAt)))
      .orderBy(asc(entities.label));
  });
}

/* ==========================================================================
   La page produit
   ========================================================================== */

/** L'en-tête de la page produit : ce qui identifie le produit. */
export type ProductDetail = {
  id: string;
  name: string;
  description: string | null;
  /**
   * La raison d'être du produit et la direction qu'il se donne (18/08/2026).
   *
   * Nulle tant qu'elle n'est pas écrite — c'est un état normal, et le bloc de
   * tête de la page produit le dit plutôt que de laisser un blanc. Le concept
   * est ajouté hors des `docs/` : voir `JOURNAL-TECHNIQUE.md`.
   */
  vision: string | null;
  entityLabel: string;
  /**
   * Nul tant que le produit est vivant (T4bis.2). La ligne était déjà rendue
   * archivée ou non ; ce qui manquait était de **le dire** à l'écran, qui la
   * servait à l'identique dans les deux cas.
   */
  archivedAt: Date | null;
};

/**
 * Un produit du domaine, avec son entité.
 *
 * Rend `undefined` sur un identifiant inconnu **comme sur un produit d'un
 * autre domaine** : la distinction n'appartient pas à l'appelant, et l'écran
 * répond 404 dans les deux cas. Un produit archivé est rendu — règle 4, une
 * donnée archivée reste lisible.
 */
export function findProductDetail(
  scope: ScopedDb,
  id: string,
): Promise<ProductDetail | undefined> {
  return scope.joinedRead(async (database, { filter }) => {
    const rows = await database
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        vision: products.vision,
        entityLabel: entities.label,
        archivedAt: products.archivedAt,
      })
      .from(products)
      .innerJoin(
        entities,
        and(eq(entities.id, products.entityId), filter(entities)),
      )
      .where(and(eq(products.id, id), filter(products)))
      .limit(1);

    return rows[0];
  });
}

/** Un membre d'équipe, tel qu'il s'affiche : un nom. */
export type ProjectMember = { id: string; fullName: string };

/** Un accompagnement, sur la page de son produit. */
export type ProductProject = {
  id: string;
  name: string;
  objective: string | null;
  statusLabel: string;
  statusNature: (typeof projectStatusNature.enumValues)[number];
  /**
   * La période **déduite de ses activités** (`lib/queries/project-period.ts`),
   * jamais saisie. Colonnes `date` : chaînes `YYYY-MM-DD`, formatées par
   * `lib/format`. Les deux bornes sont présentes ensemble, ou absentes
   * ensemble — un accompagnement sans activité datée n'a pas de période.
   */
  periodStart: string | null;
  periodEnd: string | null;
  team: ProjectMember[];
};

/**
 * Les accompagnements successifs d'un produit, du plus récent au plus ancien
 * (docs/06 §6).
 *
 * **« Le plus récent » se lit sur le début de la période**, celle de
 * l'accompagnement lui-même, et non sur `last_activity_at` : une activité
 * saisie aujourd'hui sur un accompagnement clos en 2024 ne doit pas le faire
 * remonter en tête d'une liste qui raconte une chronologie. L'opposition tient
 * toujours depuis que la période est déduite des activités — les deux valeurs
 * se lisent sur les mêmes lignes, l'une prend la plus petite date et l'autre la
 * plus récente, et elles ne rangent pas dans le même ordre. Les projets sans
 * activité datée ferment la marche, et le nom départage à date égale — un ordre
 * qui varierait d'un affichage à l'autre serait un défaut.
 *
 * Les projets archivés sont exclus, comme dans le compte de la liste des
 * produits : un accompagnement rangé n'est plus un accompagnement affiché.
 *
 * L'équipe est lue en une seconde requête plutôt qu'agrégée en SQL : un
 * `json_agg` ferait tenir le tout en un aller-retour, au prix d'un type que
 * rien ne vérifie à la sortie du pilote. `is_contributor` n'est pas retenu —
 * D9 sépare l'appartenance à l'équipe du droit d'écrire, et cette page affiche
 * une équipe, pas des droits.
 */
export function listProductProjects(
  scope: ScopedDb,
  productId: string,
): Promise<ProductProject[]> {
  return scope.joinedRead(async (database, { filter }) => {
    const periods = projectPeriods(database, filter);
    const rows = await database
      .select({
        id: projects.id,
        name: projects.name,
        objective: projects.objective,
        statusLabel: projectStatuses.label,
        statusNature: projectStatuses.nature,
        periodStart: periods.periodStart,
        periodEnd: periods.periodEnd,
      })
      .from(projects)
      .innerJoin(
        projectStatuses,
        and(
          eq(projectStatuses.id, projects.statusId),
          filter(projectStatuses),
        ),
      )
      /* `leftJoin` et non `innerJoin` : un accompagnement sans activité datée
         reste dans la liste, sans période (D7). */
      .leftJoin(periods, eq(periods.projectId, projects.id))
      .where(
        and(
          filter(projects),
          isNull(projects.archivedAt),
          eq(projects.productId, productId),
        ),
      )
      .orderBy(sql`${periods.periodStart} desc nulls last`, asc(projects.name));

    if (rows.length === 0) return [];

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
      .where(
        and(
          filter(projectMembers),
          inArray(
            projectMembers.projectId,
            rows.map((row) => row.id),
          ),
        ),
      )
      .orderBy(asc(persons.fullName));

    const teams = new Map<string, ProjectMember[]>();
    for (const member of members) {
      const team = teams.get(member.projectId) ?? [];
      team.push({ id: member.id, fullName: member.fullName });
      teams.set(member.projectId, team);
    }

    return rows.map((row) => ({ ...row, team: teams.get(row.id) ?? [] }));
  });
}

/* ==========================================================================
   Le formulaire d'un produit
   ========================================================================== */

/** Tout ce que les deux écrans de saisie d'un produit proposent au choix. */
export type ProductFormOptions = { entities: ProductEntity[] };

/**
 * Les entités du domaine, pour la création comme pour l'édition.
 *
 * **Aucune jointure** : une lecture scopée, et rien d'autre. C'est ce qui
 * permet à cette fonction de ne pas passer par `joinedRead`.
 *
 * `list` écarte déjà les lignes archivées, et c'est la nuance qui compte : **on
 * propose des lignes vivantes** là où `findProductDetail` décrit avec les
 * entités archivées comprises. Décrire et proposer n'appellent pas le même
 * filtre — la règle de T2.6.
 *
 * **Une exception, et une seule : `keepEntityId`** (T4bis.1). Le produit que
 * l'on édite peut pointer une entité archivée depuis. Elle reste alors dans la
 * liste — donc sélectionnée — et n'apparaît nulle part ailleurs : le formulaire
 * de création ne la propose pas, celui d'un autre produit non plus. La règle
 * n'est pas contredite mais précisée : cette entité **est déjà** la valeur de
 * ce produit, on ne l'offre à personne. Le motif est celui de
 * `keepActivityTypeId` (`lib/queries/activities.ts`, T3.4), dont ce ticket fait
 * la règle des deux formulaires plutôt qu'un cas isolé.
 *
 * Tri par libellé : `entities` porte un `position`, mais le formulaire de
 * produit lit par l'alphabet depuis T2.5, et les deux écrans de saisie ne
 * doivent pas diverger d'ordre pour un ticket qui ne parle pas de tri.
 */
export async function listProductFormOptions(
  scope: ScopedDb,
  options: { keepEntityId?: string } = {},
): Promise<ProductFormOptions> {
  const keep = options.keepEntityId;

  const rows = await scope.list(entities, {
    /* Sans exception, c'est la couche qui écarte les archivées. Avec, le
       filtre passe dans le `where` — `includeArchived` ne lève rien de plus
       que ce que la condition ci-dessous rétablit nommément. */
    ...(keep
      ? {
          includeArchived: true,
          where: or(isNull(entities.archivedAt), eq(entities.id, keep)),
        }
      : {}),
    orderBy: [asc(entities.label)],
  });

  return { entities: rows.map((row) => ({ id: row.id, label: row.label })) };
}
