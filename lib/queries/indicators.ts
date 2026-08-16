/**
 * Les lectures liées aux indicateurs : ce qu'un **produit** mesure, et depuis
 * quand (`docs/06` §6, D11 — un indicateur appartient à un produit, et à un
 * seul).
 *
 * **Vision ne calcule aucun indice.** Ce module rend ce que les lignes portent :
 * un libellé, une unité, un sens de lecture, une source, la dernière valeur
 * relevée et sa date, et le nombre de relevés. Aucun écart, aucune évolution,
 * aucune moyenne — D39 pose la frontière, et un chiffre calculé par Vision pour
 * qualifier un produit la franchirait.
 *
 * **Les valeurs sortent brutes.** `numeric(18,4)` revient en chaîne du pilote
 * — « 71.0000 » —, et une colonne `date` en « YYYY-MM-DD ». La mise en forme
 * appartient à `lib/format` et à l'écran : une lecture ne met pas en forme,
 * la règle écrite dans `lib/queries/resources.ts`.
 *
 * La lecture joint, donc elle passe par `joinedRead`, et **la table jointe porte
 * `filter(table)`** : c'est la condition posée par l'en-tête de `joinedRead`, et
 * un oubli serait une fuite que rien d'autre ne rattraperait.
 *
 * Ce module n'importe pas `db` : il reçoit un `ScopedDb` déjà lié au domaine
 * courant. Règle 1.
 */

import { and, asc, eq, isNull, sql } from "drizzle-orm";

import type { ScopedDb } from "@/lib/db/scoped";
import {
  indicatorDirection,
  indicatorReadings,
  indicators,
} from "@/lib/db/schema";

/**
 * `higher_is_better` · `lower_is_better`. Dérivé du schéma, jamais réécrit à la
 * main — la règle de `ResourceType`.
 *
 * C'est le **sens de lecture d'une courbe**, jamais un jugement porté sur une
 * valeur : rien dans ce module ni dans ses appelants n'en tire une couleur, un
 * mot ou un pictogramme de bon ou mauvais chiffre.
 */
export type IndicatorDirection = (typeof indicatorDirection.enumValues)[number];

/** Une entrée du bloc « Indicateurs » de la page produit. */
export type ProductIndicator = {
  id: string;
  label: string;
  /** « % », « s », « /100 »… Nulle : un indicateur peut n'en porter aucune. */
  unit: string | null;
  direction: IndicatorDirection;
  /** « Portail analytics »… Nulle tant qu'elle n'est pas renseignée. */
  source: string | null;
  /**
   * La valeur du **dernier relevé**, brute — « 71.0000 ». `null` quand
   * l'indicateur n'a aucun relevé : l'écran le dit, il ne l'invente pas.
   */
  lastValue: string | null;
  /**
   * La date du dernier relevé, en « YYYY-MM-DD » — colonne `date`. `null` avec
   * la valeur, et jamais posée à aujourd'hui : « un indicateur sans date de
   * relevé n'est pas affichable sur la frise et doit être signalé comme tel
   * plutôt que positionné arbitrairement à aujourd'hui » (`docs/03` §7).
   */
  lastReadOn: string | null;
  /** Le nombre de relevés. Zéro est une réponse, pas un manque. */
  readingCount: number;
};

/**
 * Les indicateurs vivants d'un produit, par libellé, avec leur dernier relevé
 * et leur décompte.
 *
 * **Une seule lecture par écran, jamais une requête par indicateur.** Les trois
 * valeurs qui dépendent des relevés sont des agrégats sur une jointure unique —
 * le patron de `listProductsWithCounts`, à un détail près : le dernier relevé ne
 * s'obtient pas par un `max()`, puisqu'on veut la **valeur** portée par la ligne
 * la plus récente et non la plus grande des valeurs.
 *
 * `(array_agg(<colonne> order by read_on desc, id desc))[1]` la donne dans le
 * même passage que le décompte. `id desc` départage deux relevés du même jour :
 * un ordre qui varierait d'un affichage à l'autre serait un défaut, et la
 * colonne `date` seule ne tranche pas — la règle de tri de
 * `listProjectResources`, transposée à un agrégat.
 *
 * **Le `leftJoin` est là pour l'indicateur sans relevé** : une jointure interne
 * le ferait disparaître de la lecture au lieu de le rendre à zéro. Sur zéro
 * ligne jointe, `count` vaut 0 et `array_agg` vaut `null` — les trois champs
 * tombent juste sans un cas particulier dans le code.
 *
 * **Aucun filtre d'archivage sur les relevés, et c'est daté** :
 * `indicator_readings` ne porte pas `archived_at` (`lib/db/schema.ts:681`).
 * T5.3 ajoute la colonne par migration ; le jour où elle existe, un
 * `isNull(indicatorReadings.archivedAt)` s'ajoute **ici**, dans le `on` de la
 * jointure, pour que les trois agrégats l'écartent ensemble.
 *
 * Les indicateurs archivés sont écartés. Un produit sans indicateur rend un
 * tableau vide : l'état vide appartient à l'écran (règle 5).
 */
export function listProductIndicators(
  scope: ScopedDb,
  productId: string,
): Promise<ProductIndicator[]> {
  return scope.joinedRead(async (database, { filter }) => {
    return database
      .select({
        id: indicators.id,
        label: indicators.label,
        unit: indicators.unit,
        direction: indicators.direction,
        source: indicators.source,
        readingCount: sql<number>`count(${indicatorReadings.id})::int`,
        lastValue: sql<string | null>`(array_agg(${indicatorReadings.value} order by ${indicatorReadings.readOn} desc, ${indicatorReadings.id} desc))[1]`,
        lastReadOn: sql<string | null>`(array_agg(${indicatorReadings.readOn} order by ${indicatorReadings.readOn} desc, ${indicatorReadings.id} desc))[1]`,
      })
      .from(indicators)
      .leftJoin(
        indicatorReadings,
        and(
          eq(indicatorReadings.indicatorId, indicators.id),
          filter(indicatorReadings),
        ),
      )
      .where(
        and(
          filter(indicators),
          eq(indicators.productId, productId),
          isNull(indicators.archivedAt),
        ),
      )
      // La clé primaire suffit à PostgreSQL pour les autres colonnes du groupe.
      .groupBy(indicators.id)
      .orderBy(asc(indicators.label), asc(indicators.id));
  });
}
