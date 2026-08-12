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

import { and, asc, eq, isNull, sql } from "drizzle-orm";

import type { ScopedDb } from "@/lib/db/scoped";
import { entities, products, projects } from "@/lib/db/schema";

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
