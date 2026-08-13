/**
 * Les lectures liées aux activités : la roadmap d'un accompagnement — le récit
 * du projet, et la raison d'être de Vision (`docs/06` §5) — et les deux
 * référentiels que le panneau de saisie propose.
 *
 * La première joint, donc elle passe par `joinedRead`. **Toute table jointe porte
 * `filter(table)`**, le `leftJoin` sur les approches compris : c'est la
 * condition posée par l'en-tête de `joinedRead`, et la propriété relevée par
 * T2.2 à T2.4 — les filtres de domaine se rattrapent l'un l'autre — ne
 * dispense d'aucun d'eux.
 *
 * Ce module n'importe pas `db` : il reçoit un `ScopedDb` déjà lié au domaine
 * courant. Règle 1.
 */

import { and, asc, eq, isNull, ne, sql } from "drizzle-orm";

import type { ScopedDb } from "@/lib/db/scoped";
import {
  activities,
  activityFamily,
  activityTypes,
  approaches,
} from "@/lib/db/schema";

/** `framing` · `research` · … Dérivé du schéma, jamais réécrit à la main. */
export type ActivityFamily = (typeof activityFamily.enumValues)[number];

/** Un type d'activité proposé au choix : le référentiel du domaine (D16). */
export type ActivityTypeOption = {
  id: string;
  label: string;
  family: ActivityFamily;
};

/** Une approche proposée au choix. D12 — une seule par activité. */
export type ApproachOption = { id: string; label: string };

export type ActivityFormOptions = {
  activityTypes: ActivityTypeOption[];
  approaches: ApproachOption[];
};

/**
 * Les deux référentiels que le panneau de saisie propose.
 *
 * T3.2 les lisait dans la page, faute de pouvoir toucher `lib/queries` : le
 * déplacement était annoncé pour ce ticket, et le voici.
 *
 * `list` écarte déjà les lignes archivées, et c'est la nuance qui compte :
 * **on propose des lignes vivantes** là où `listProjectRoadmap` décrit avec
 * les libellés archivés compris. Décrire et proposer n'appellent pas le même
 * filtre — la même règle qu'en T2.6 pour les entités et les produits.
 *
 * `position` est l'ordre du domaine et prime sur l'alphabet ; la famille le
 * précède pour le type, son énuméré portant l'ordre de `docs/03` §2. C'est ce
 * tri qui permet au panneau de grouper en un seul passage, sans retrier.
 */
export async function listActivityFormOptions(
  scope: ScopedDb,
): Promise<ActivityFormOptions> {
  const [typeRows, approachRows] = await Promise.all([
    scope.list(activityTypes, {
      orderBy: [
        asc(activityTypes.family),
        asc(activityTypes.position),
        asc(activityTypes.label),
      ],
    }),
    scope.list(approaches, {
      orderBy: [asc(approaches.position), asc(approaches.label)],
    }),
  ]);

  return {
    activityTypes: typeRows.map((row) => ({
      id: row.id,
      label: row.label,
      family: row.family,
    })),
    approaches: approachRows.map((row) => ({ id: row.id, label: row.label })),
  };
}

/**
 * Les quatre groupes de lecture de `docs/03` §6, dans leur ordre.
 *
 * `unscheduled` n'est pas un état du schéma : c'est `planned` porteur de
 * `is_unscheduled` (D14). Le cinquième groupe — annulé — n'existe pas ici :
 * il arrive avec T3.5, le ticket qui peut le peupler.
 */
export type RoadmapGroupKey = "in_progress" | "planned" | "unscheduled" | "done";

/** Une entrée de roadmap : type, objectif, période, approche. Rien d'autre. */
export type RoadmapActivity = {
  id: string;
  /** Le libellé du type, **archivé compris** : on décrit, on ne propose pas. */
  typeLabel: string;
  objective: string | null;
  /** Colonnes `date` : chaînes `YYYY-MM-DD`, formatées par `lib/format`. */
  periodStart: string | null;
  periodEnd: string | null;
  isUnscheduled: boolean;
  /** D12 — une seule approche, facultative. */
  approachLabel: string | null;
};

export type RoadmapGroup = {
  key: RoadmapGroupKey;
  label: string;
  activities: RoadmapActivity[];
};

/** L'ordre de lecture de `docs/03` §6, et les libellés de l'interface. */
const GROUPS: { key: RoadmapGroupKey; label: string }[] = [
  { key: "in_progress", label: "En cours" },
  { key: "planned", label: "Prévu" },
  { key: "unscheduled", label: "À planifier" },
  { key: "done", label: "Terminé" },
];

/**
 * Les activités d'un projet, groupées par état et triées.
 *
 * **Le passé se lit à rebours, le présent et l'avenir dans le sens de la
 * marche.** `docs/03` §6 n'impose que « Terminé, du plus récent au plus
 * ancien » ; l'ordre interne des trois autres groupes est tranché ici :
 *
 * - En cours — période croissante : ce qui a commencé en premier en tête ;
 * - Prévu — période croissante : la prochaine échéance en tête ;
 * - À planifier — sans date par définition, donc l'ordre de déclaration ;
 * - Terminé — période décroissante.
 *
 * Le tri est **entièrement en SQL**, en deux expressions `case` — une par sens
 * de lecture — plutôt qu'en mémoire : l'ordre est alors la propriété de la
 * requête, et un test qui l'éprouve éprouve ce que l'écran reçoit. `created_at`
 * puis `id` départagent : un ordre qui varierait d'un affichage à l'autre
 * serait un défaut, et un départage par libellé se réorganiserait le jour où un
 * domaine renomme un type.
 *
 * **Aucun rang de groupe dans le `order by`.** Il en portait un ; il a été
 * retiré après l'avoir neutralisé sans faire tomber un seul test. Le
 * regroupement se fait en mémoire et l'ordre des groupes vient de `GROUPS` : ce
 * que le SQL doit garantir est l'ordre **à l'intérieur** de chaque groupe, et
 * les deux clés de période y suffisent, un état donné n'en activant jamais
 * qu'une. Un rang laissé là aurait fait croire le contraire au lecteur.
 *
 * Les activités annulées sont écartées faute de groupe pour les recevoir, les
 * archivées comme partout ailleurs. Un groupe sans activité n'est pas rendu :
 * c'est à l'appelant que revient l'état vide, et il ne le doit qu'au projet
 * entièrement vide.
 */
export function listProjectRoadmap(
  scope: ScopedDb,
  projectId: string,
): Promise<RoadmapGroup[]> {
  return scope.joinedRead(async (database, { filter }) => {
    /* Le sens de la marche — tout sauf le passé. */
    const forward = sql`case
      when ${activities.state} = 'done' then null
      else coalesce(${activities.periodStart}, ${activities.periodEnd})
    end`;

    /* Le passé, à rebours. Une activité `done` porte toujours une fin de
       période (contrainte `activities_done_requires_period_end`) ; le
       `coalesce` est une ceinture, pas une hypothèse. */
    const backward = sql`case
      when ${activities.state} = 'done' then coalesce(${activities.periodEnd}, ${activities.periodStart})
      else null
    end`;

    const rows = await database
      .select({
        id: activities.id,
        state: activities.state,
        typeLabel: activityTypes.label,
        objective: activities.objective,
        periodStart: activities.periodStart,
        periodEnd: activities.periodEnd,
        isUnscheduled: activities.isUnscheduled,
        approachLabel: approaches.label,
      })
      .from(activities)
      .innerJoin(
        activityTypes,
        and(
          eq(activityTypes.id, activities.activityTypeId),
          filter(activityTypes),
        ),
      )
      .leftJoin(
        approaches,
        and(eq(approaches.id, activities.approachId), filter(approaches)),
      )
      .where(
        and(
          filter(activities),
          eq(activities.projectId, projectId),
          isNull(activities.archivedAt),
          ne(activities.state, "cancelled"),
        ),
      )
      .orderBy(
        sql`${forward} asc nulls last`,
        sql`${backward} desc nulls last`,
        asc(activities.createdAt),
        asc(activities.id),
      );

    const byKey = new Map<RoadmapGroupKey, RoadmapActivity[]>();
    for (const row of rows) {
      const key: RoadmapGroupKey =
        row.state === "planned"
          ? row.isUnscheduled
            ? "unscheduled"
            : "planned"
          : row.state === "in_progress"
            ? "in_progress"
            : "done";

      const group = byKey.get(key) ?? [];
      group.push({
        id: row.id,
        typeLabel: row.typeLabel,
        objective: row.objective,
        periodStart: row.periodStart,
        periodEnd: row.periodEnd,
        isUnscheduled: row.isUnscheduled,
        approachLabel: row.approachLabel,
      });
      byKey.set(key, group);
    }

    return GROUPS.flatMap((group) => {
      const found = byKey.get(group.key);
      return found ? [{ ...group, activities: found }] : [];
    });
  });
}
