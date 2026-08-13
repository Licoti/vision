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

import { and, asc, eq, isNull, or, sql } from "drizzle-orm";

import type { ScopedDb } from "@/lib/db/scoped";
import {
  activities,
  activityFamily,
  activityParticipants,
  activityTypes,
  approaches,
  persons,
} from "@/lib/db/schema";
import type { PersonKind } from "@/lib/forms/project";

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

/**
 * Une personne du domaine, telle qu'elle se désigne comme participante — même
 * forme que `ProjectFormPerson` (T2.6), réutilisée pour les participants
 * proposés au choix comme pour ceux déjà liés à une entrée de roadmap (T3.6).
 */
export type ActivityFormPerson = {
  id: string;
  fullName: string;
  kind: PersonKind;
};

export type ActivityFormOptions = {
  activityTypes: ActivityTypeOption[];
  approaches: ApproachOption[];
  /** Facultatif (`docs/03` §4). Aucune création à la volée — c'est T2.6. */
  persons: ActivityFormPerson[];
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
 * **Une exception, et une seule : `keepActivityTypeId`** (T3.4). L'activité que
 * l'on édite peut pointer un type archivé depuis. Il reste alors dans la liste
 * — donc sélectionné — et n'apparaît nulle part ailleurs : le panneau de
 * création ne le propose pas, celui d'une autre activité non plus. La règle
 * n'est pas contredite mais précisée : ce type **est déjà** la valeur de cette
 * activité, on ne l'offre à personne. Le motif est celui de
 * `findAccompanimentRank` — `or(is null, = celui-ci)` —, et c'est le seul
 * endroit du produit où une exception d'archivage est nominative.
 *
 * `position` est l'ordre du domaine et prime sur l'alphabet ; la famille le
 * précède pour le type, son énuméré portant l'ordre de `docs/03` §2. C'est ce
 * tri qui permet au panneau de grouper en un seul passage, sans retrier.
 *
 * `persons` (T3.6) suit le modèle exact de `listProjectFormOptions` : les
 * personnes actives du domaine, triées par nom. Aucune exception d'archivage
 * nominative comme pour le type — un participant archivé depuis disparaîtrait
 * simplement des options, hors du périmètre de ce ticket.
 */
export async function listActivityFormOptions(
  scope: ScopedDb,
  options: { keepActivityTypeId?: string } = {},
): Promise<ActivityFormOptions> {
  const keep = options.keepActivityTypeId;

  const [typeRows, approachRows, personRows] = await Promise.all([
    scope.list(activityTypes, {
      /* Sans exception, c'est la couche qui écarte les archivés. Avec, le
         filtre passe dans le `where` — `includeArchived` ne lève rien de plus
         que ce que la condition ci-dessous rétablit nommément. */
      ...(keep
        ? {
            includeArchived: true,
            where: or(
              isNull(activityTypes.archivedAt),
              eq(activityTypes.id, keep),
            ),
          }
        : {}),
      orderBy: [
        asc(activityTypes.family),
        asc(activityTypes.position),
        asc(activityTypes.label),
      ],
    }),
    scope.list(approaches, {
      orderBy: [asc(approaches.position), asc(approaches.label)],
    }),
    scope.list(persons, {
      where: eq(persons.isActive, true),
      orderBy: [asc(persons.fullName)],
    }),
  ]);

  return {
    activityTypes: typeRows.map((row) => ({
      id: row.id,
      label: row.label,
      family: row.family,
    })),
    approaches: approachRows.map((row) => ({ id: row.id, label: row.label })),
    persons: personRows.map((row) => ({
      id: row.id,
      fullName: row.fullName,
      kind: row.kind,
    })),
  };
}

/**
 * Les identifiants des personnes déjà liées à une activité — le
 * pré-remplissage du panneau en édition (T3.6), sur le modèle de
 * `findProjectDetail` pour l'équipe.
 */
export async function listActivityParticipantIds(
  scope: ScopedDb,
  activityId: string,
): Promise<string[]> {
  const rows = await scope.list(activityParticipants, {
    where: eq(activityParticipants.activityId, activityId),
  });
  return rows.map((row) => row.personId);
}

/**
 * Les cinq groupes de lecture de `docs/03` §6, dans leur ordre.
 *
 * `unscheduled` n'est pas un état du schéma : c'est `planned` porteur de
 * `is_unscheduled` (D14). `cancelled`, lui, en est un — c'est T3.5 qui peuple
 * ce groupe, resté vide depuis T3.1.
 */
export type RoadmapGroupKey =
  | "in_progress"
  | "planned"
  | "unscheduled"
  | "done"
  | "cancelled";

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
  /** Non nul seulement dans le groupe `cancelled` (`activities_cancelled_requires_reason`). */
  cancellationReason: string | null;
  /** Facultatif (`docs/03` §4), triés par nom. Vide la plupart du temps — T3.6. */
  participants: ActivityFormPerson[];
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
  { key: "cancelled", label: "Annulé" },
];

/**
 * Les activités d'un projet, groupées par état et triées.
 *
 * **Le passé se lit à rebours, le présent et l'avenir dans le sens de la
 * marche.** `docs/03` §6 n'impose que « Terminé, du plus récent au plus
 * ancien » ; l'ordre interne des quatre autres groupes est tranché ici :
 *
 * - En cours — période croissante : ce qui a commencé en premier en tête ;
 * - Prévu — période croissante : la prochaine échéance en tête ;
 * - À planifier — sans date par définition, donc l'ordre de déclaration ;
 * - Terminé — période décroissante ;
 * - Annulé (T3.5) — période décroissante, au même titre que Terminé : aucun
 *   ordre n'est imposé par les docs pour ce groupe précis, et un fait
 *   abandonné se lit aussi à rebours.
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
 * Les activités archivées sont écartées, comme partout ailleurs. Un groupe
 * sans activité n'est pas rendu : c'est à l'appelant que revient l'état vide,
 * et il ne le doit qu'au projet entièrement vide.
 */
export function listProjectRoadmap(
  scope: ScopedDb,
  projectId: string,
): Promise<RoadmapGroup[]> {
  return scope.joinedRead(async (database, { filter }) => {
    /* Le sens de la marche — tout sauf le passé. */
    const forward = sql`case
      when ${activities.state} in ('done', 'cancelled') then null
      else coalesce(${activities.periodStart}, ${activities.periodEnd})
    end`;

    /* Le passé, à rebours. Une activité `done` porte toujours une fin de
       période (contrainte `activities_done_requires_period_end`) ; le
       `coalesce` est une ceinture, pas une hypothèse. Une activité `cancelled`
       n'a aucune garantie de ce genre — elle peut avoir été annulée sans
       jamais avoir eu de date (T3.5) — d'où le même `coalesce` côté annulé. */
    const backward = sql`case
      when ${activities.state} in ('done', 'cancelled') then coalesce(${activities.periodEnd}, ${activities.periodStart})
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
        cancellationReason: activities.cancellationReason,
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
        ),
      )
      .orderBy(
        sql`${forward} asc nulls last`,
        sql`${backward} desc nulls last`,
        asc(activities.createdAt),
        asc(activities.id),
      );

    /* Les participants (T3.6) : une deuxième lecture plutôt qu'un troisième
       `leftJoin` sur la requête ci-dessus — une activité peut porter
       plusieurs participants, et les multiplier par une jointure dupliquerait
       la ligne d'activité autant de fois. `activities` est jointe pour
       porter `filter(activities)` sur la table réellement lue, et pour ne
       lire que les participants d'activités non archivées de ce projet —
       chaque table jointe filtrée sur le domaine, la règle du fichier. */
    const participantRows = await database
      .select({
        activityId: activityParticipants.activityId,
        id: persons.id,
        fullName: persons.fullName,
        kind: persons.kind,
      })
      .from(activityParticipants)
      .innerJoin(
        activities,
        and(eq(activities.id, activityParticipants.activityId), filter(activities)),
      )
      .innerJoin(persons, and(eq(persons.id, activityParticipants.personId), filter(persons)))
      .where(
        and(
          filter(activityParticipants),
          eq(activities.projectId, projectId),
          isNull(activities.archivedAt),
        ),
      )
      .orderBy(asc(persons.fullName));

    const participantsByActivity = new Map<string, ActivityFormPerson[]>();
    for (const row of participantRows) {
      const list = participantsByActivity.get(row.activityId) ?? [];
      list.push({ id: row.id, fullName: row.fullName, kind: row.kind });
      participantsByActivity.set(row.activityId, list);
    }

    const byKey = new Map<RoadmapGroupKey, RoadmapActivity[]>();
    for (const row of rows) {
      const key: RoadmapGroupKey =
        row.state === "cancelled"
          ? "cancelled"
          : row.state === "planned"
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
        cancellationReason: row.cancellationReason,
        participants: participantsByActivity.get(row.id) ?? [],
      });
      byKey.set(key, group);
    }

    return GROUPS.flatMap((group) => {
      const found = byKey.get(group.key);
      return found ? [{ ...group, activities: found }] : [];
    });
  });
}
