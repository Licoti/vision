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

import { and, asc, desc, eq, isNull, or, sql } from "drizzle-orm";

import type { ScopedDb } from "@/lib/db/scoped";
import { valueScale, type ValueScale } from "@/lib/queries/timeline";
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
  /**
   * L'indicateur est-il la **North Star** du produit ? (hors ticket, 17/08/2026)
   *
   * Un produit en porte au plus une vivante — l'index unique partiel
   * `indicators_north_star_unique` le garantit en base, pas seulement à l'écran.
   * Aucune n'est un état normal, pas un manque.
   */
  isNorthStar: boolean;
  /**
   * La cible de cet indicateur, brute — « 85.0000 ». **Et la seule** : depuis le
   * 29/08/2026, `project_indicators` n'en porte plus. Un accompagnement qui
   * adopte l'indicateur reprend celle-ci, il ne s'en donne pas une autre.
   */
  targetValue: string | null;
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
        isNorthStar: indicators.isNorthStar,
        targetValue: indicators.targetValue,
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
      /* **La North Star d'abord**, puis l'ordre alphabétique de T5.1 inchangé.
         Le tri est ici et non à l'écran : un composant qui retrierait un tableau
         déjà trié ferait dépendre l'ordre de deux endroits, et `desc` sur un
         booléen met `true` en tête en PostgreSQL. */
      .orderBy(
        desc(indicators.isNorthStar),
        asc(indicators.label),
        asc(indicators.id),
      );
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

/* ==========================================================================
   L'écart à la cible — hors ticket, 17/08/2026

   ⚠ **Cette fonction calcule ce que le projet interdit, et c'est délibéré.**
   Elle soustrait une cible saisie d'un relevé daté, ce que quatre textes
   refusent en propres termes :

     · D39 (`docs/07`) — « est interdit tout indice **calculé par Vision** » ;
     · `docs/06` §6 — « aucun calcul d'écart […] c'est le point de bascule où
       Vision cesserait d'être un outil de mémoire pour devenir un outil de
       justification » ;
     · arbitrage (g) de `tickets-C5.md` — « Ni "atteinte", ni écart au dernier
       relevé […] leur différence serait un indice » ;
     · `docs/design/brief-design.md` §4.3, dans les mêmes termes.

   Arbitré par l'humain le 17/08/2026, consigné dans `JOURNAL-TECHNIQUE.md`
   comme le prévoit la règle 6 du `CLAUDE.md`. Les quatre textes restent en
   vigueur et disent le contraire de ce code : quiconque les relit trouvera la
   divergence, et c'est ici qu'elle s'explique.

   Elle vit en `lib/` et non dans un JSX pour la raison de tout ce module : un
   calcul s'éprouve par un test.
   ========================================================================== */

/** Où en est le dernier relevé par rapport à la cible du produit. */
export type TargetGap = {
  /** La cible est-elle atteinte, au sens de `direction` ? */
  reached: boolean;
  /**
   * La distance qui reste, **en valeur absolue** et jamais signée : le sens est
   * porté par `reached`, pas par un signe que le lecteur devrait interpréter.
   * Vaut 0 quand la cible est exactement atteinte.
   */
  distance: number;
};

/**
 * L'écart entre le dernier relevé et la cible du produit, **selon le sens de
 * lecture de l'indicateur**.
 *
 * C'est le point où la maquette se trompait : elle fait `target - current` et
 * annonce « Encore X pts », ce qui se lit à l'envers d'un indicateur
 * `lower_is_better` — un taux d'abandon à 8 % pour une cible à 5 % n'a pas
 * « atteint » sa cible parce que 8 dépasse 5. L'atteinte se juge donc sur
 * `direction`, jamais sur le seul signe de la différence.
 *
 * Rend `null` quand il n'y a rien à comparer : pas de cible, pas de relevé, ou
 * l'une des deux valeurs illisible. L'écran n'affiche alors aucune phrase — une
 * comparaison sans ses deux termes ne s'invente pas.
 */
export function targetGap(
  target: string | null,
  lastValue: string | null,
  direction: IndicatorDirection,
): TargetGap | null {
  const goal = toFiniteNumber(target);
  const current = toFiniteNumber(lastValue);
  if (goal === null || current === null) return null;

  const reached =
    direction === "higher_is_better" ? current >= goal : current <= goal;

  return { reached, distance: Math.abs(goal - current) };
}

/**
 * Ce qu'une valeur `numeric(18,4)` vaut en nombre, ou `null` si elle ne vaut
 * rien. `Number("")` valant 0, la chaîne vide est écartée avant tout — une
 * valeur absente n'est pas une valeur nulle. Le jumeau de `toNumber` dans
 * `lib/queries/timeline.ts`, qui sert les échelles verticales.
 */
function toFiniteNumber(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/* ==========================================================================
   L'échelle verticale du bloc North Star — hors ticket, 17/08/2026

   **Une seule échelle pour la jauge et pour la courbe**, si bien que les deux se
   lisent ensemble : la jauge est la projection du dernier point sur l'axe du
   tracé, et non un second système de coordonnées à réconcilier de l'œil.
   ========================================================================== */

/**
 * Le plafond que l'**unité** déclare, quand elle en déclare un.
 *
 * `indicators.unit` est un texte libre — il n'existe aucun référentiel d'unités,
 * et en inventer un serait l'écran de gestion des référentiels que D25 renvoie à
 * C7. Mais deux formes d'unité **portent leur maximum dans leur écriture**, et
 * s'en priver donnait le défaut du 17/08/2026 : une jauge dont la piste
 * s'arrêtait à la cible, la cible étant la plus haute valeur connue.
 *
 *   · « % » — un pourcentage plafonne à 100 ;
 *   · « /100 », « /5 », « /20 » — une note sur N plafonne à N.
 *
 * Tout le reste — « jours », « s », « €» — n'a **aucun plafond naturel**, et on
 * n'en invente pas : `null`, et l'échelle se borne alors sur les données.
 *
 * Ce n'est pas un référentiel : c'est la lecture d'une notation que la personne
 * a elle-même écrite. Une unité inconnue ne provoque rien.
 */
export function unitCeiling(unit: string | null | undefined): number | null {
  if (!unit) return null;
  const trimmed = unit.trim();

  if (trimmed === "%") return 100;

  /* « /100 » et ses variantes. La virgule décimale est acceptée : c'est la
     notation française, et `normalizeDecimal` la tolère partout ailleurs. */
  const fraction = /^\/\s*(\d+(?:[.,]\d+)?)$/u.exec(trimmed);
  if (!fraction?.[1]) return null;

  const ceiling = Number(fraction[1].replace(",", "."));
  return Number.isFinite(ceiling) && ceiling > 0 ? ceiling : null;
}

/**
 * L'échelle qui **part de zéro** quand elle le peut, et monte au plafond de
 * l'unité quand celle-ci en déclare un.
 *
 * `valueScale` borne au plus petit et au plus grand des relevés : la courbe
 * remplit sa boîte, mais une progression de 54 à 60 % y ressemble à une envolée
 * — l'œil lit une pente qui n'existe pas à cette échelle. Partir de zéro rend
 * l'amplitude vraie : six points se voient comme six points.
 *
 * **Le plafond de l'unité règle le défaut de la jauge** : sans lui, une cible à
 * 85 % plus haute que tous les relevés devenait le maximum de l'échelle, et son
 * marqueur se collait au bout de la piste — la jauge « s'arrêtait à 85 % ».
 * Avec lui, la piste va jusqu'à 100 et la cible se lit là où elle est.
 *
 * **Le plafond ne rogne jamais une donnée** : `Math.max` le confronte au plus
 * haut relevé, si bien qu'un 120 % saisi par erreur reste visible au lieu d'être
 * écrêté hors de la boîte. Une échelle qui cache une valeur ment davantage
 * qu'une échelle trop haute.
 *
 * **Le zéro n'est pas toujours possible**, et c'est le seul autre cas
 * particulier : une mesure qui descend sous zéro — un solde, une variation —
 * n'a pas de plancher naturel à zéro, et l'y forcer sortirait ses relevés de la
 * boîte. On retombe alors sur `valueScale`, plafond d'unité compris : une
 * grandeur signée n'est pas un pourcentage.
 *
 * Rend `null` quand rien n'est exploitable : il n'y a alors pas d'axe, et
 * l'état vide appartient à l'écran (règle 5).
 */
export function axisScale(
  values: readonly (string | number | null | undefined)[],
  unit?: string | null,
): ValueScale | null {
  const bounds = valueScale(values);
  if (!bounds) return null;
  if (bounds.min < 0) return bounds;

  const ceiling = unitCeiling(unit);

  return {
    min: 0,
    max: ceiling === null ? bounds.max : Math.max(ceiling, bounds.max),
  };
}

/* ==========================================================================
   Le tracé d'une courbe — hors ticket, 17/08/2026

   **La contrainte « pas de `viewBox`, donc pas de `path` » ne vaut plus ici**, et
   la maquette montre pourquoi. La frise n'avait pas de `viewBox` parce que son
   texte aurait été mis à l'échelle avec le dessin ; d'où l'interdiction de
   `polyline` et de `path`, dont les attributs n'acceptent pas de pourcentage, et
   une `<line>` par segment (T5.6, consigné).

   Le bloc fusionné ne met **aucun texte dans le SVG** : les points, les valeurs
   et les graduations sont des éléments HTML posés en pourcentage par-dessus. Le
   `viewBox` redevient donc sans danger, et avec lui le `path` — à condition de
   `preserveAspectRatio="none"` pour que le tracé remplisse sa boîte, et de
   `vector-effect="non-scaling-stroke"` pour que le trait garde son épaisseur
   malgré l'étirement.
   ========================================================================== */

/** Un point du tracé, en pourcentage des deux côtés de sa boîte. */
export type CurvePoint = {
  /** De 0 à 100, depuis la gauche. */
  x: number;
  /** De 0 à 100, depuis le **bas** — le sens de lecture d'une courbe. */
  y: number;
};

/**
 * L'attribut `d` d'un tracé, dans un `viewBox="0 0 100 100"`.
 *
 * Les ordonnées sont **retournées ici** : `y` arrive compté depuis le bas, le
 * SVG compte le sien depuis le haut. Le retournement vit dans cette fonction et
 * pas dans l'appelant, pour qu'il n'ait à se faire qu'une fois et qu'un test le
 * tienne.
 *
 * **Un point isolé rend un segment nul** (`M x,y L x,y`) plutôt qu'une chaîne
 * vide : un `path` sans `d` valide est ignoré par le navigateur, et le point
 * seul disparaîtrait au lieu de se marquer. Deux relevés du même mois y donnent
 * deux points superposés, ce qui est ce qu'ils disent.
 *
 * Aucune courbe de Bézier, aucun lissage : le segment joint deux faits, il n'en
 * invente pas un troisième.
 */
export function curvePath(points: readonly CurvePoint[]): string {
  if (points.length === 0) return "";

  const at = (point: CurvePoint) =>
    `${round4(point.x)},${round4(100 - point.y)}`;

  if (points.length === 1) {
    const only = points[0] as CurvePoint;
    return `M${at(only)} L${at(only)}`;
  }

  return `M${points.map(at).join(" L")}`;
}

/**
 * Quatre décimales : le HTML servi doit être **stable d'un rendu à l'autre**
 * pour se relire et se tester. La règle de `round` dans `lib/queries/timeline`.
 */
function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
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
  /**
   * La North Star **du produit** (migration 0003), telle que l'adoption la
   * reçoit — jamais une North Star « du projet », qui n'existe pas : l'index
   * unique partiel en garantit une au plus par produit, et un accompagnement
   * qui l'adopte adopte celle-là.
   *
   * Elle ne change **rien** au contenu de la ligne — les quatre valeurs
   * reportées restent les mêmes —, elle décide de sa **place** et de son
   * dessin : la maquette `project-v2` met l'objectif du produit dans un
   * encadré de tête et les autres en cartes dessous. Une colonne de plus dans
   * un `select` existant, pas une requête de plus.
   */
  isNorthStar: boolean;
  /** Brute — « 54.0000 ». La mise en forme appartient à l'écran. */
  baselineValue: string | null;
  /**
   * La cible **de l'indicateur**, et non de l'adoption — celle-ci n'en porte
   * plus depuis le 29/08/2026. Le nom le dit : l'écran la sert en lecture, le
   * panneau d'adoption ne l'écrit pas, et elle se corrige sur la page produit.
   *
   * Deux accompagnements qui adoptent le même indicateur lisent donc la même
   * valeur, ce qui est toute la propriété qu'on cherchait.
   */
  productTargetValue: string | null;
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
 * sa référence, celle de l'indicateur pour son libellé, son unité et sa cible —
 * la dépendance fonctionnelle ne traverse pas une jointure.
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
        isNorthStar: indicators.isNorthStar,
        baselineValue: projectIndicators.baselineValue,
        /* **La cible vient de la table jointe**, et c'est tout le changement du
           29/08/2026 : une ligne de `select` qui change de table, aucune requête
           de plus. L'`innerJoin` ci-dessous portait déjà le libellé, l'unité et
           le drapeau North Star. */
        productTargetValue: indicators.targetValue,
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
      /* **La North Star en tête, puis l'alphabet.** `desc` sur un booléen met
         `true` devant en PostgreSQL, et l'ordre reste **entièrement en SQL** —
         la discipline de `listProjectRoadmap` : un tri fait en mémoire par
         l'écran est un tri qu'aucun test de lecture n'éprouve. Le départage par
         libellé puis par identifiant ne bouge pas. */
      .orderBy(
        desc(indicators.isNorthStar),
        asc(indicators.label),
        asc(projectIndicators.id),
      );
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
   Les adoptions d'un produit — T5.6, élargi hors ticket le 17/08/2026

   Quels accompagnements ont repris à leur compte chaque indicateur du produit,
   et avec quelle valeur de référence. Une même mesure peut en porter deux si
   deux accompagnements l'ont adoptée.

   **Cette lecture remplace `listProductTargets`**, qui ne rendait que les
   adoptions porteuses d'une cible. Le bloc fusionné a besoin des autres : il
   écrit sous chaque indicateur les accompagnements qui l'ont adopté, et c'est
   désormais tout ce qu'il en tire.

   **Elle ne porte plus de cible** (29/08/2026). Il n'y en a qu'une, sur
   l'indicateur, et la courbe n'a donc plus qu'un trait à tracer — le
   dédoublonnage que le 17/08/2026 avait dû ajouter n'a plus d'objet.
   ========================================================================== */

/** Quel accompagnement a adopté quel indicateur du produit. */
export type ProductAdoption = {
  /** L'indicateur visé — la clé du regroupement par indicateur. */
  indicatorId: string;
  projectId: string;
  /**
   * Le nom de l'accompagnement. Un indicateur peut porter deux adoptions ; sans
   * lui, rien ne dirait laquelle vient d'où.
   */
  projectName: string;
  /** Brute — « 54.0000 ». La mise en forme appartient à l'écran. */
  baselineValue: string | null;
};

/**
 * Les adoptions des accompagnements **vivants** d'un produit.
 *
 * **Une seule lecture pour toute la couche**, quel que soit le nombre
 * d'indicateurs : le bloc ne descend pas indicateur par indicateur — la règle de
 * T5.1, tenue par les lectures de cette page.
 *
 * `innerJoin` sur `projects` : la jointure **est** la question. Elle porte le
 * rattachement au produit, le nom de l'accompagnement, et son archivage. **Les
 * accompagnements archivés sont écartés parce que la roadmap les écarte déjà** —
 * `listProductProjects` pour les barres, `listAccompanimentMarkers` pour les
 * repères : une adoption sans accompagnement sous lequel se lire serait un nom
 * orphelin.
 *
 * **Aucune jointure sur `indicators`**, et c'est délibéré : le composant range
 * chaque adoption sous son indicateur, et une adoption dont l'indicateur ne se
 * lit pas — archivé, ou d'un autre produit — n'a nulle part où se poser. Elle
 * est ignorée à l'écran sans qu'une seconde jointure la filtre ici.
 *
 * Le tri est par nom d'accompagnement, `id` départageant deux homonymes : un
 * ordre qui varierait d'un affichage à l'autre serait un défaut — la règle de
 * tri de `listProjectResources`.
 */
export function listProductAdoptions(
  scope: ScopedDb,
  productId: string,
): Promise<ProductAdoption[]> {
  return scope.joinedRead(async (database, { filter }) => {
    return database
      .select({
        indicatorId: projectIndicators.indicatorId,
        projectId: projects.id,
        projectName: projects.name,
        baselineValue: projectIndicators.baselineValue,
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
      .where(filter(projectIndicators))
      .orderBy(asc(projects.name), asc(projectIndicators.id));
  });
}
