/**
 * Les lectures de l'écran Produits.
 *
 * Elles joignent, donc elles passent par `joinedRead` — le seul chemin que la
 * couche d'accès ouvre à une jointure. **Toute table jointe porte
 * `filter(table)`** : c'est la condition posée par l'en-tête de `joinedRead`,
 * et un oubli serait une fuite de domaine que rien d'autre ne rattraperait.
 *
 * Ce module n'importe pas `db` : il reçoit un `ScopedDb` déjà lié au domaine
 * courant. Règle 1.
 */

import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";

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
  entityLabel: string;
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
        entityLabel: entities.label,
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
  /** Colonnes `date` : chaînes `YYYY-MM-DD`, formatées par `lib/format`. */
  startedOn: string | null;
  expectedEndOn: string | null;
  team: ProjectMember[];
};

/**
 * Les accompagnements successifs d'un produit, du plus récent au plus ancien
 * (docs/06 §6).
 *
 * **« Le plus récent » se lit sur `started_on`**, la date de l'accompagnement
 * lui-même, et non sur `last_activity_at` : une activité saisie aujourd'hui
 * sur un accompagnement clos en 2024 ne doit pas le faire remonter en tête
 * d'une liste qui raconte une chronologie. Les projets sans date de début
 * ferment la marche, et le nom départage à date égale — un ordre qui varierait
 * d'un affichage à l'autre serait un défaut.
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
    const rows = await database
      .select({
        id: projects.id,
        name: projects.name,
        objective: projects.objective,
        statusLabel: projectStatuses.label,
        statusNature: projectStatuses.nature,
        startedOn: projects.startedOn,
        expectedEndOn: projects.expectedEndOn,
      })
      .from(projects)
      .innerJoin(
        projectStatuses,
        and(
          eq(projectStatuses.id, projects.statusId),
          filter(projectStatuses),
        ),
      )
      .where(
        and(
          filter(projects),
          isNull(projects.archivedAt),
          eq(projects.productId, productId),
        ),
      )
      .orderBy(sql`${projects.startedOn} desc nulls last`, asc(projects.name));

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
