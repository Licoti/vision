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

import { and, asc, desc, eq, isNotNull, isNull, or, sql } from "drizzle-orm";

import type { ScopedDb } from "@/lib/db/scoped";
import {
  indicatorDirection,
  indicatorReadings,
  indicators,
  projectIndicators,
  projects,
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
  /**
   * Le nombre d'accompagnements qui **adoptent** cet indicateur (T5.4).
   *
   * Il ne décrit pas l'indicateur, il gouverne un geste : au-dessus de zéro,
   * l'arbitrage (e) refuse l'archivage, et le bloc dit combien plutôt que
   * d'offrir un « Archiver » qui paraîtrait ne rien faire. Ce n'est ni un
   * score ni un indice (D39) — c'est un décompte de lignes, comme celui des
   * accompagnements d'un produit depuis T2.2.
   */
  adoptionCount: number;
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
 * **Les relevés archivés sont écartés dans le `on` de la jointure, et c'est là
 * que ça compte** (T5.3). T5.1 avait posé l'emplacement d'avance, faute de
 * colonne : le filtre est **dans la jointure** et non dans le `where`, sans quoi
 * il emporterait l'indicateur avec ses relevés au lieu de n'écarter que les
 * relevés. Les trois agrégats l'écartent donc ensemble — un relevé retiré ne
 * compte plus, et ne fournit plus le dernier relevé, du même geste.
 *
 * **Le décompte des adoptions est une sous-requête corrélée, et non une seconde
 * jointure** (T5.4). Un `leftJoin` sur `project_indicators` multiplierait les
 * lignes par le nombre d'adoptions : `count(readings)` compterait chaque relevé
 * autant de fois, et les deux agrégats ordonnés changeraient de sens sans
 * changer de résultat. La sous-requête laisse la jointure de T5.1 et le filtre
 * de T5.3 **exactement où ils sont**, et leurs tests avec eux. Elle porte sa
 * propre condition de domaine : `filter` ne s'applique qu'aux tables de la
 * lecture, et un oubli serait une fuite.
 *
 * Les indicateurs archivés sont écartés. Un produit sans indicateur rend un
 * tableau vide : l'état vide appartient à l'écran (règle 5).
 */
export function listProductIndicators(
  scope: ScopedDb,
  productId: string,
): Promise<ProductIndicator[]> {
  return scope.joinedRead(async (database, { filter, domainId }) => {
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
        adoptionCount: sql<number>`(select count(*) from ${projectIndicators} where ${projectIndicators.indicatorId} = ${indicators.id} and ${projectIndicators.domainId} = ${domainId})::int`,
      })
      .from(indicators)
      .leftJoin(
        indicatorReadings,
        and(
          eq(indicatorReadings.indicatorId, indicators.id),
          filter(indicatorReadings),
          isNull(indicatorReadings.archivedAt),
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

/* ==========================================================================
   La série datée — T5.3
   ========================================================================== */

/** Une ligne de la série d'un indicateur : sa valeur, sa date, sa note. */
export type ProductReading = {
  id: string;
  /** L'indicateur auquel cette ligne appartient — la clé du regroupement. */
  indicatorId: string;
  /**
   * La valeur relevée, brute — « 71.0000 ». `numeric(18,4)` revient en chaîne
   * du pilote, et la mise en forme appartient à l'écran, jamais à la lecture.
   */
  value: string;
  /** « YYYY-MM-DD » — colonne `date`. Obligatoire en base comme au formulaire. */
  readOn: string;
  /** « Relevé trimestriel »… Nulle tant qu'elle n'est pas renseignée. */
  sourceNote: string | null;
};

/**
 * Tous les relevés vivants des indicateurs vivants d'un produit, du plus récent
 * au plus ancien.
 *
 * **Une lecture plate, et le regroupement à l'écran** : une requête par
 * indicateur serait exactement ce que T5.1 s'est interdit, et le composant tient
 * la série de chaque indicateur d'un seul parcours du tableau reçu. Deux
 * lectures pour tout le bloc, quel que soit le nombre d'indicateurs.
 *
 * **Le tri est le même couple que l'agrégat ordonné de `listProductIndicators`**
 * — `read_on desc, id desc`, et ce n'est pas une coïncidence à préserver par la
 * relecture : c'est ce qui fait que la **première ligne de la série est, par
 * construction, le « dernier relevé »** affiché juste au-dessus dans le même
 * bloc. Deux tris différents feraient mentir l'un des deux, et le jour où deux
 * relevés partagent une date, `id desc` est la seule chose qui les départage de
 * façon stable d'un affichage à l'autre.
 *
 * **`innerJoin` et non `leftJoin`, à l'inverse de la lecture ci-dessus** : un
 * relevé dont l'indicateur ne se lit pas dans ce domaine ne s'affiche pas —
 * la règle de `findResourceActivity`. Ici la jointure n'est pas là pour rendre
 * une colonne, elle **est** la question : elle porte le rattachement au produit
 * et l'archivage de l'indicateur, si bien qu'un relevé d'indicateur archivé sort
 * de la lecture en même temps que son indicateur sort du bloc.
 *
 * Trois filtres, trois raisons : `filter` sur chaque table jointe (la condition
 * de `joinedRead`, et un oubli serait une fuite), l'archivage de l'indicateur,
 * l'archivage du relevé. Un produit sans relevé rend un tableau vide.
 */
export function listProductReadings(
  scope: ScopedDb,
  productId: string,
): Promise<ProductReading[]> {
  return scope.joinedRead(async (database, { filter }) => {
    return database
      .select({
        id: indicatorReadings.id,
        indicatorId: indicatorReadings.indicatorId,
        value: indicatorReadings.value,
        readOn: indicatorReadings.readOn,
        sourceNote: indicatorReadings.sourceNote,
      })
      .from(indicatorReadings)
      .innerJoin(
        indicators,
        and(
          eq(indicators.id, indicatorReadings.indicatorId),
          filter(indicators),
          eq(indicators.productId, productId),
          isNull(indicators.archivedAt),
        ),
      )
      .where(
        and(
          filter(indicatorReadings),
          isNull(indicatorReadings.archivedAt),
        ),
      )
      .orderBy(desc(indicatorReadings.readOn), desc(indicatorReadings.id));
  });
}

/* ==========================================================================
   L'adoption — T5.4

   `project_indicators` relie l'accompagnement à son effet supposé (`docs/04`
   §3). **Elle ne calcule rien** : ce module rend quatre valeurs reportées côte
   à côte — référence, cible, valeur finale, et le dernier relevé daté — et
   jamais leur écart, leur progression ou leur atteinte (arbitrage (g), D39).
   ========================================================================== */

/** Une entrée du bloc « Indicateurs adoptés » de la page projet. */
/**
 * La série de chaque indicateur, en une passe.
 *
 * Elle vit ici, **à côté de la lecture qui produit ces relevés**, et non dans
 * l'écran qui les affiche : `indicators.tsx` la portait depuis T5.3 et
 * `timeline.tsx` en refaisait une autre dans `curvesOf` (T5.6) — un `filter` par
 * indicateur, donc un parcours de la liste entière autant de fois qu'il y a
 * d'indicateurs. Une seule passe, un seul appelant à corriger le jour où
 * l'ordre change.
 *
 * `readings` arrive **plat et déjà ordonné** — une lecture par écran, jamais une
 * par indicateur (la règle de T5.1). Le regroupement conserve l'ordre reçu, si
 * bien que chaque série sort triée sans qu'un second tri s'écrive ailleurs : une
 * lecture trie, un composant affiche. La frise, qui lit du plus ancien au plus
 * récent, **inverse une copie** plutôt que de demander un autre ordre.
 */
export function groupByIndicator(
  readings: readonly ProductReading[],
): Map<string, ProductReading[]> {
  const grouped = new Map<string, ProductReading[]>();
  for (const reading of readings) {
    const series = grouped.get(reading.indicatorId);
    if (series) series.push(reading);
    else grouped.set(reading.indicatorId, [reading]);
  }
  return grouped;
}

export type ProjectAdoption = {
  /**
   * L'identifiant de l'**adoption**, pas de l'indicateur : c'est elle que la
   * page corrige et retire, et c'est elle que porte la valeur de `?indicateur=`
   * sur cet écran.
   */
  id: string;
  /** L'indicateur adopté — ce que le panneau garde sélectionné en correction. */
  indicatorId: string;
  label: string;
  /** L'unité de l'**indicateur** : les quatre chiffres la partagent. */
  unit: string | null;
  /** Brutes — « 85.0000 ». La mise en forme appartient à l'écran. */
  baselineValue: string | null;
  targetValue: string | null;
  finalValue: string | null;
  /** La valeur du dernier relevé vivant, ou `null` : l'écran le dit. */
  lastValue: string | null;
  /** « YYYY-MM-DD », et jamais posée à aujourd'hui (`docs/03` §7). */
  lastReadOn: string | null;
};

/**
 * Les indicateurs qu'un accompagnement a adoptés, par libellé.
 *
 * **Le patron de `listProductIndicators`, à la table de départ près** : une
 * seule lecture jointe, le dernier relevé par l'agrégat ordonné
 * `(array_agg(… order by read_on desc, id desc))[1]`, et le filtre des relevés
 * retirés **dans le `on`** — l'emplacement que T5.3 a justifié, et pour la même
 * raison ici : posé dans le `where`, il emporterait l'adoption avec ses relevés
 * retirés au lieu de n'écarter que ceux-ci.
 *
 * `innerJoin` sur `indicators` : la jointure **est** la question. Elle porte le
 * libellé, l'unité, et l'archivage de l'indicateur — une adoption dont
 * l'indicateur est rangé sort du bloc en même temps que l'indicateur sort de la
 * page produit. Le cas ne se crée plus depuis que l'arbitrage (e) refuse
 * d'archiver un indicateur adopté ; il reste atteignable sur des lignes
 * antérieures, et la cohérence entre les deux écrans prime.
 *
 * Le groupement se fait sur les deux clés primaires : celle de l'adoption pour
 * ses trois valeurs, celle de l'indicateur pour son libellé et son unité — la
 * dépendance fonctionnelle ne traverse pas une jointure.
 *
 * Un accompagnement sans adoption rend un tableau vide : l'état vide appartient
 * à l'écran (règle 5).
 */
export function listProjectAdoptions(
  scope: ScopedDb,
  projectId: string,
): Promise<ProjectAdoption[]> {
  return scope.joinedRead(async (database, { filter }) => {
    return database
      .select({
        id: projectIndicators.id,
        indicatorId: projectIndicators.indicatorId,
        label: indicators.label,
        unit: indicators.unit,
        baselineValue: projectIndicators.baselineValue,
        targetValue: projectIndicators.targetValue,
        finalValue: projectIndicators.finalValue,
        lastValue: sql<string | null>`(array_agg(${indicatorReadings.value} order by ${indicatorReadings.readOn} desc, ${indicatorReadings.id} desc))[1]`,
        lastReadOn: sql<string | null>`(array_agg(${indicatorReadings.readOn} order by ${indicatorReadings.readOn} desc, ${indicatorReadings.id} desc))[1]`,
      })
      .from(projectIndicators)
      .innerJoin(
        indicators,
        and(
          eq(indicators.id, projectIndicators.indicatorId),
          filter(indicators),
          isNull(indicators.archivedAt),
        ),
      )
      .leftJoin(
        indicatorReadings,
        and(
          eq(indicatorReadings.indicatorId, indicators.id),
          filter(indicatorReadings),
          isNull(indicatorReadings.archivedAt),
        ),
      )
      .where(
        and(
          filter(projectIndicators),
          eq(projectIndicators.projectId, projectId),
        ),
      )
      .groupBy(projectIndicators.id, indicators.id)
      .orderBy(asc(indicators.label), asc(projectIndicators.id));
  });
}

/** Une option du panneau d'adoption : ce qu'il faut pour la nommer, rien de plus. */
export type AdoptableIndicator = {
  id: string;
  label: string;
  unit: string | null;
};

/**
 * Les indicateurs qu'un accompagnement **peut encore adopter** : les vivants de
 * son produit, moins ceux qu'il adopte déjà.
 *
 * L'exclusion des déjà-adoptés n'est pas un confort d'affichage : l'unicité
 * `(projet, indicateur)` est **totale** en base, et proposer une seconde fois
 * le même indicateur mènerait à une violation d'unicité — un 500 là où l'on
 * attend un message. L'action la devance de toute façon ; la liste ne la
 * propose pas.
 *
 * **`keepIndicatorId` est l'exception nominative** (T4bis.1, T4bis.5, T4bis.6),
 * et elle en couvre deux d'un seul chemin : l'indicateur porté par l'adoption
 * éditée est **déjà adopté** — donc exclu par la condition ci-dessus — et il a
 * pu être **archivé** avant que l'arbitrage (e) ne l'interdise. Sans elle, le
 * `select` du panneau s'ouvrirait sans option sélectionnée, et la première
 * re-soumission changerait l'indicateur de l'adoption ou la refuserait — la
 * perte exacte que T4bis.1 a refermée ailleurs. Elle est **nominative** : elle
 * ne rétablit que la valeur déjà portée par la ligne éditée, et jamais une
 * autre. La création ne passe rien.
 *
 * La condition de domaine de la sous-requête est écrite en propre : `filter` ne
 * s'applique qu'aux tables de la lecture.
 */
export function listAdoptableIndicators(
  scope: ScopedDb,
  projectId: string,
  productId: string,
  options: { keepIndicatorId?: string } = {},
): Promise<AdoptableIndicator[]> {
  const keep = options.keepIndicatorId;

  return scope.joinedRead(async (database, { filter, domainId }) => {
    const free = sql`not exists (select 1 from ${projectIndicators} where ${projectIndicators.indicatorId} = ${indicators.id} and ${projectIndicators.projectId} = ${projectId} and ${projectIndicators.domainId} = ${domainId})`;
    const alive = isNull(indicators.archivedAt);
    const kept = keep ? eq(indicators.id, keep) : null;

    return database
      .select({
        id: indicators.id,
        label: indicators.label,
        unit: indicators.unit,
      })
      .from(indicators)
      .where(
        and(
          filter(indicators),
          eq(indicators.productId, productId),
          kept ? or(alive, kept) : alive,
          kept ? or(free, kept) : free,
        ),
      )
      .orderBy(asc(indicators.label), asc(indicators.id));
  });
}

/* ==========================================================================
   Les cibles — T5.6

   La cible d'une bande de courbe. Elle appartient à une **adoption**, jamais au
   produit : c'est un accompagnement qui se donne un repère, et la même mesure
   peut en porter deux si deux accompagnements l'ont adoptée.

   **La cible est un repère, jamais un état** (arbitrage (g), D39) : ce module
   rend la valeur saisie, brute, avec l'accompagnement qui la porte. Ni écart au
   dernier relevé, ni « atteinte », ni pourcentage de progression — `docs/03` §7
   nomme le « +12 % depuis l'accompagnement » comme le point de bascule.
   ========================================================================== */

/** Une cible portée par une adoption : de quoi tracer un repère et le nommer. */
export type IndicatorTarget = {
  /** L'indicateur visé — la clé du regroupement par bande. */
  indicatorId: string;
  projectId: string;
  /**
   * Le nom de l'accompagnement. Une bande peut porter deux cibles ; sans lui,
   * rien ne dirait laquelle vient d'où.
   */
  projectName: string;
  /** Brute — « 85.0000 ». La mise en forme appartient à l'écran. */
  targetValue: string;
};

/**
 * Les cibles que les accompagnements **vivants** d'un produit se sont données.
 *
 * **Une seule lecture pour toute la couche**, quel que soit le nombre
 * d'indicateurs : la frise ne descend pas indicateur par indicateur — la règle
 * de T5.1, tenue par les quatre lectures de cette page.
 *
 * `innerJoin` sur `projects` : la jointure **est** la question. Elle porte le
 * rattachement au produit, le nom de l'accompagnement, et son archivage. **Les
 * accompagnements archivés sont écartés parce que la frise les écarte déjà** —
 * `listProductProjects` pour les bandes, `listProductMilestones` pour les
 * repères : une cible sans bande sous laquelle se lire serait un repère
 * orphelin sur un axe qui ne porte plus son accompagnement.
 *
 * **Aucune jointure sur `indicators`**, et c'est délibéré : le composant range
 * chaque cible sous la bande de son indicateur, et une cible dont l'indicateur
 * ne se lit pas — archivé, ou d'un autre produit — n'a aucune bande où se poser.
 * Elle est ignorée à l'écran sans qu'une seconde jointure la filtre ici.
 *
 * `isNotNull(targetValue)` plutôt qu'un tri des nulles à l'écran : une adoption
 * sans cible n'a pas de repère à tracer, et la lecture rend ce qui se dessine.
 *
 * Le tri est par nom d'accompagnement, `id` départageant deux homonymes : un
 * ordre qui varierait d'un affichage à l'autre serait un défaut — la règle de
 * tri de `listProjectResources`.
 */
export function listProductTargets(
  scope: ScopedDb,
  productId: string,
): Promise<IndicatorTarget[]> {
  return scope.joinedRead(async (database, { filter }) => {
    return database
      .select({
        indicatorId: projectIndicators.indicatorId,
        projectId: projects.id,
        projectName: projects.name,
        /* La colonne est `numeric` **nullable** : le `isNotNull` du `where` la
           rend non nulle en fait, et ce `sql` le dit au type — sans quoi
           l'écran porterait un `string | null` qu'il ne peut plus rencontrer. */
        targetValue: sql<string>`${projectIndicators.targetValue}`,
      })
      .from(projectIndicators)
      .innerJoin(
        projects,
        and(
          eq(projects.id, projectIndicators.projectId),
          filter(projects),
          eq(projects.productId, productId),
          isNull(projects.archivedAt),
        ),
      )
      .where(
        and(
          filter(projectIndicators),
          isNotNull(projectIndicators.targetValue),
        ),
      )
      .orderBy(asc(projects.name), asc(projectIndicators.id));
  });
}
