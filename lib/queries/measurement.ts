/**
 * Ce qui collecte la donnée d'un produit : ses **outils de mesure** et son
 * **plan de taggage**.
 *
 * Deux lectures, un seul module — elles se rendent toujours ensemble, dans le
 * même rang du bloc « Indicateurs », et les séparer aurait fait deux fichiers
 * dont aucun ne se lit seul.
 *
 * **Aucune synthèse.** Ce module ne rend ni « état global du tracking », ni
 * décompte d'outils manquants, ni comparaison de dates : les lignes sortent
 * telles qu'elles ont été déclarées, et la lecture appartient à qui les lit. Un
 * indice calculé ici serait un interdit d'interface arrivé par la porte de
 * derrière.
 *
 * Règle 1 : tout passe par `ScopedDb`, jamais par `db` directement.
 */

import { and, asc, eq, isNull } from "drizzle-orm";

import type { ScopedDb } from "@/lib/db/scoped";
import {
  productTrackings,
  taggingPlanStatus,
  taggingPlans,
  tools,
  trackingStatus,
} from "@/lib/db/schema";

/**
 * Les énumérés que ce module sert, exportés d'ici — la convention du dépôt,
 * celle de `ToolKind`, de `ProjectStatusNature` et d'`ActivityFamily`.
 */
export type TrackingStatus = (typeof trackingStatus.enumValues)[number];
export type TaggingPlanStatus = (typeof taggingPlanStatus.enumValues)[number];

/**
 * Un outil de mesure tel que l'écran le lit : la ligne du produit, plus le nom
 * de l'outil que le référentiel lui donne.
 *
 * **`toolName` vient de `tools`, jamais d'une copie** : un domaine qui renomme
 * « Portail analytics » en « GA4 » le renomme partout d'un coup, et une
 * dénormalisation aurait laissé l'ancien nom sur les lignes déjà écrites.
 */
export type ProductTracking = {
  id: string;
  toolId: string;
  toolName: string;
  status: TrackingStatus;
  scope: string | null;
  propertyUrl: string | null;
  /** `YYYY-MM-DD` — le pilote rend les colonnes `date` en chaîne. */
  verifiedOn: string | null;
  note: string | null;
};

export type ProductTaggingPlan = {
  id: string;
  url: string;
  status: TaggingPlanStatus;
  /** `YYYY-MM-DD` — la date du **document**, jamais celle de la ligne. */
  updatedOn: string;
  note: string | null;
};

/**
 * Les outils vivants d'un produit, dans l'ordre du nom de l'outil.
 *
 * **Le tri est ici et non à l'écran** : un composant qui retrierait un tableau
 * déjà trié ferait dépendre l'ordre de deux endroits (la leçon de
 * `listProductIndicators`). L'identifiant départage les homonymes, pour que deux
 * rendus successifs ne s'échangent jamais deux lignes.
 *
 * **Aucun tri par état**, et c'est délibéré : ranger « partiel » avant « en
 * place » serait poser un ordre de gravité que Vision n'a pas à porter.
 */
export function listProductTrackings(
  scope: ScopedDb,
  productId: string,
): Promise<ProductTracking[]> {
  return scope.joinedRead(async (database, { filter }) => {
    return database
      .select({
        id: productTrackings.id,
        toolId: productTrackings.toolId,
        toolName: tools.name,
        status: productTrackings.status,
        scope: productTrackings.scope,
        propertyUrl: productTrackings.propertyUrl,
        verifiedOn: productTrackings.verifiedOn,
        note: productTrackings.note,
      })
      .from(productTrackings)
      /* `innerJoin` et non `leftJoin` : la clé étrangère est `not null` et
         `on delete restrict`, donc l'outil existe toujours. Une jointure gauche
         laisserait croire le contraire et obligerait l'écran à traiter un cas
         que la base interdit. */
      .innerJoin(tools, and(eq(tools.id, productTrackings.toolId), filter(tools)))
      .where(
        and(
          filter(productTrackings),
          eq(productTrackings.productId, productId),
          isNull(productTrackings.archivedAt),
        ),
      )
      .orderBy(asc(tools.name), asc(productTrackings.id));
  });
}

/**
 * Le plan de taggage vivant d'un produit, ou `null`.
 *
 * **Un seul, et la base le garantit** : `tagging_plans_product_unique` est une
 * unicité partielle sur les vivants. `[0] ?? null` n'est donc pas un choix
 * arbitraire entre plusieurs lignes — il n'y en a jamais deux. La `limit(1)`
 * dit la même chose au planificateur.
 *
 * `null` est un **état normal**, pas un manque : l'écran le dit et propose de
 * l'écrire (règle 5).
 */
export function findProductTaggingPlan(
  scope: ScopedDb,
  productId: string,
): Promise<ProductTaggingPlan | null> {
  return scope.joinedRead(async (database, { filter }) => {
    const rows = await database
      .select({
        id: taggingPlans.id,
        url: taggingPlans.url,
        status: taggingPlans.status,
        updatedOn: taggingPlans.updatedOn,
        note: taggingPlans.note,
      })
      .from(taggingPlans)
      .where(
        and(
          filter(taggingPlans),
          eq(taggingPlans.productId, productId),
          isNull(taggingPlans.archivedAt),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  });
}

/** Un outil du référentiel, tel que le panneau de saisie le propose. */
export type AnalyticsTool = { id: string; name: string };

/**
 * Les outils de genre **`analytics`** du domaine, vivants, par ordre de nom.
 *
 * **Le genre filtre, il ne classe pas.** `docs/04` §2 pose `analytics` comme ce
 * qui « alimente un relevé d'indicateur » ; c'est exactement la famille dont un
 * dispositif de mesure se compose, et proposer les outils d'audit ou de budget
 * dans ce panneau ferait déclarer Ergonome comme dispositif de tracking.
 *
 * **Les archivés sont exclus de la proposition, jamais des lignes déjà
 * écrites** : `on delete restrict` garde l'outil, et `listProductTrackings` le
 * rend quel que soit son archivage. Ce qu'on ne propose plus, on continue de
 * l'afficher — la règle de `checkResultActivity` sur les types d'activité.
 */
export function listAnalyticsTools(scope: ScopedDb): Promise<AnalyticsTool[]> {
  return scope.joinedRead(async (database, { filter }) => {
    return database
      .select({ id: tools.id, name: tools.name })
      .from(tools)
      .where(
        and(filter(tools), eq(tools.kind, "analytics"), isNull(tools.archivedAt)),
      )
      .orderBy(asc(tools.name), asc(tools.id));
  });
}
