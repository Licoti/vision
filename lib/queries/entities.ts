/**
 * Les lectures de l'écran **Administration** — le référentiel des entités.
 *
 * Une seule lecture, et elle joint : elle passe donc par `joinedRead`, le seul
 * chemin que la couche d'accès ouvre à une jointure. **Toute table jointe porte
 * `filter(table)`** — c'est la condition posée par l'en-tête de `joinedRead`, et
 * un oubli serait une fuite de domaine que rien d'autre ne rattraperait.
 *
 * Ce module n'importe pas `db` : il reçoit un `ScopedDb` déjà lié au domaine
 * courant. Règle 1.
 */

import { and, asc, eq, sql } from "drizzle-orm";

import type { ScopedDb } from "@/lib/db/scoped";
import { entities, products } from "@/lib/db/schema";

/**
 * Une ligne de l'écran d'administration : l'entité, et ce qui s'oppose à ses
 * deux gestes de rangement.
 *
 * **Deux décomptes et non un**, parce que ce sont deux règles distinctes.
 * `liveProductCount` s'oppose à l'**archivage** : ranger une entité que des
 * produits vivants portent les laisserait à l'écran sans leur filtre.
 * `totalProductCount` s'oppose à la **suppression** : la clé étrangère
 * `products.entity_id` est déclarée `on delete restrict`, un produit archivé
 * suffit donc à retenir la ligne. N'en garder qu'un ferait dire à l'écran une
 * condition qu'il ne tient pas.
 */
export type AdminEntityRow = {
  id: string;
  label: string;
  /** Nombre de produits **vivants** rattachés. S'oppose à l'archivage. */
  liveProductCount: number;
  /** Nombre de produits rattachés, archivés compris. S'oppose à la suppression. */
  totalProductCount: number;
  /** Nul tant que l'entité est vivante. */
  archivedAt: Date | null;
};

/**
 * Le référentiel des entités du domaine, **archivées comprises**.
 *
 * C'est l'écart avec les huit autres lectures du dépôt, et il est délibéré : un
 * écran de gestion doit montrer ce qu'il a rangé, sans quoi le rangement serait
 * une disparition et le rétablissement n'aurait aucun point d'entrée. Les
 * lectures d'usage — `listProductEntities`, `listProductFormOptions` — gardent
 * leur filtre : une entité archivée ne qualifie plus rien de neuf.
 *
 * Le tri est alphabétique, comme partout ailleurs. `entities.position` existe en
 * base et n'est lue par aucun écran ; l'exposer ici ferait de cet écran un
 * ordonnanceur, ce qu'aucun ticket ne demande.
 *
 * **La jointure est une seule et porte deux agrégats** : compter deux fois
 * demanderait deux allers-retours pour une même ligne, et le `filter(products)`
 * y serait à écrire deux fois plutôt qu'une.
 */
export function listEntitiesForAdmin(
  scope: ScopedDb,
): Promise<AdminEntityRow[]> {
  return scope.joinedRead(async (database, { filter }) => {
    return database
      .select({
        id: entities.id,
        label: entities.label,
        /* Le `leftJoin` ne filtre pas les produits archivés : c'est le décompte
           total. Le décompte vivant se prend sur la même jointure par un
           agrégat conditionnel — `count` ignore les `null`. */
        liveProductCount: sql<number>`count(${products.id}) filter (where ${products.archivedAt} is null)::int`,
        totalProductCount: sql<number>`count(${products.id})::int`,
        archivedAt: entities.archivedAt,
      })
      .from(entities)
      .leftJoin(
        products,
        and(eq(products.entityId, entities.id), filter(products)),
      )
      .where(filter(entities))
      .groupBy(entities.id)
      .orderBy(asc(entities.label));
  });
}

/**
 * Les libellés déjà pris dans le domaine — archivés compris.
 *
 * **Les archivés en font partie**, et c'est le cœur du refus de doublon : une
 * entité rangée sous le nom qu'on retape existe toujours, et en créer une
 * seconde du même nom est exactement ce que le point ouvert d'`ETAT.md` décrit
 * — l'amorçage qui recrée sous l'ancien nom. L'écran propose alors de la
 * rétablir plutôt que d'en poser une jumelle.
 *
 * `exceptId` écarte la ligne qu'on est en train de corriger : sans lui, récrire
 * « Assurance » en « Assurance » se refuserait elle-même.
 */
export function listEntityLabels(
  scope: ScopedDb,
  options: { exceptId?: string | undefined } = {},
): Promise<{ id: string; label: string; archivedAt: Date | null }[]> {
  return scope.joinedRead(async (database, { filter }) => {
    return database
      .select({
        id: entities.id,
        label: entities.label,
        archivedAt: entities.archivedAt,
      })
      .from(entities)
      .where(
        and(
          filter(entities),
          ...(options.exceptId
            ? [sql`${entities.id} <> ${options.exceptId}`]
            : []),
        ),
      );
  });
}
