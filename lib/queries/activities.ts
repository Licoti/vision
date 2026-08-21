/**
 * Les lectures liées aux activités : la roadmap d'un accompagnement — le récit
 * du projet, et la raison d'être de Vision (`docs/06` §5) — et les référentiels
 * que ses panneaux de saisie proposent : types, approches et personnes pour
 * celui de l'activité, outils pour celui du résultat (T4.4).
 *
 * La première joint, donc elle passe par `joinedRead`. **Toute table jointe porte
 * `filter(table)`**, les `leftJoin` sur les approches et sur les outils
 * compris : c'est la condition posée par l'en-tête de `joinedRead`, et la
 * propriété relevée par T2.2 à T2.4 — les filtres de domaine se rattrapent
 * l'un l'autre — ne dispense d'aucun d'eux.
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
  results,
  tools,
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

/** Un outil proposé au choix : le référentiel du domaine (`docs/04` §2). */
export type ResultToolOption = { id: string; name: string };

/**
 * Les outils que le panneau de résultat propose (T4.4).
 *
 * `list` écarte déjà les lignes archivées : **on propose des lignes vivantes**,
 * là où `listProjectRoadmap` décrit avec les outils archivés compris — c'est
 * elle qui rend le nom d'un résultat déjà posé. Décrire et proposer n'appellent
 * pas le même filtre, la règle de T2.6.
 *
 * **Une exception, et une seule : `keepToolId`** (T4bis.6). L'en-tête renvoyait
 * la question à C4bis en toutes lettres — C4 n'écrivait aucune correction
 * (arbitrage (a) de `tickets-C4.md`), donc aucun panneau ne s'ouvrait sur une
 * ligne existante dont l'outil aurait pu être archivé depuis. La correction
 * existe désormais, et le motif est **rigoureusement celui de
 * `keepActivityTypeId`** : l'outil déjà porté par le résultat édité reste dans
 * la liste — donc sélectionné — et n'apparaît nulle part ailleurs. L'exception
 * est **nominative** : elle n'ouvre la porte à aucun autre archivé, et la
 * saisie n'en passe aucun, une création n'ayant pas de valeur antérieure à
 * préserver.
 *
 * Tri par nom : `tools` ne porte pas de `position`, à la différence des types
 * et des approches — l'alphabet est alors le seul ordre qui ne varie pas d'un
 * affichage à l'autre.
 */
export async function listResultToolOptions(
  scope: ScopedDb,
  options: { keepToolId?: string } = {},
): Promise<ResultToolOption[]> {
  const keep = options.keepToolId;

  const rows = await scope.list(tools, {
    /* Sans exception, c'est la couche qui écarte les archivés. Avec, le filtre
       passe dans le `where` — `includeArchived` ne lève rien de plus que ce que
       la condition ci-dessous rétablit nommément. */
    ...(keep
      ? {
          includeArchived: true,
          where: or(isNull(tools.archivedAt), eq(tools.id, keep)),
        }
      : {}),
    orderBy: [asc(tools.name)],
  });
  return rows.map((row) => ({ id: row.id, name: row.name }));
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

/**
 * Le résultat d'une activité — **le contrat unique** de `docs/02` §5, et rien
 * de plus : un libellé, une valeur, une unité, une date, le nom de l'outil, un
 * lien profond. Vision n'affiche jamais le détail des constats : il vit dans
 * l'outil qui l'a produit.
 *
 * C'est une valeur **reportée**, jamais un indice calculé par Vision (D39).
 */
export type ActivityResult = {
  /**
   * L'identifiant de la ligne — **ce que T4bis.6 ajoute**. Sans lui, les deux
   * gestes de correction n'auraient rien à lier côté serveur : ils ne peuvent
   * pas se contenter de l'activité, `results` n'ayant pas de `project_id` et le
   * résultat reçu devant être rapproché de l'activité reçue.
   */
  id: string;
  label: string;
  /**
   * `numeric(18,4)` : le pilote rend la chaîne brute — « 62.0000 » et non 62.
   * Le formatage appartient à `lib/format`, pas à la lecture.
   */
  value: string | null;
  unit: string | null;
  /** Colonne `date` : chaîne `YYYY-MM-DD`, formatée par `lib/format`. */
  measuredOn: string;
  /** `tool_id` est nullable (`on delete set null`). */
  toolName: string | null;
  /**
   * L'identifiant de l'outil — **ce que T4bis.6 ajoute**, à côté du nom que la
   * lecture rendait déjà. Le nom sert l'écran, l'identifiant sert le panneau :
   * c'est lui qui resélectionne l'outil en correction, et qui porte l'exception
   * nominative de `listResultToolOptions` quand il a été archivé depuis.
   */
  toolId: string | null;
  /** Le lien profond. Nul pour les deux résultats de la fixture — cas normal. */
  externalUrl: string | null;
};

/** Une entrée de roadmap : type, objectif, période, approche. Rien d'autre. */
export type RoadmapActivity = {
  id: string;
  /** Le libellé du type, **archivé compris** : on décrit, on ne propose pas. */
  typeLabel: string;
  /**
   * Le drapeau du **type**, pas de l'activité — `docs/04` §2 : « vrai pour les
   * audits, conditionne la saisie d'un résultat ». C'est lui qui décide, avec
   * l'état terminé et l'absence de résultat, si l'entrée porte le point
   * d'entrée de T4.4.
   *
   * Il vient de `activityTypes`, **déjà jointe** pour le libellé : une colonne
   * de plus dans un `select` existant, pas une requête de plus.
   */
  producesResult: boolean;
  objective: string | null;
  /** Colonnes `date` : chaînes `YYYY-MM-DD`, formatées par `lib/format`. */
  periodStart: string | null;
  periodEnd: string | null;
  isUnscheduled: boolean;
  /** D12 — une seule approche, facultative. */
  approachLabel: string | null;
  /** Non nul seulement dans le groupe `cancelled` (`activities_cancelled_requires_reason`). */
  cancellationReason: string | null;
  /**
   * Le lien vers l'outil où le travail se fait (21/08/2026), saisi sur
   * l'activité. **Distinct de `result.externalUrl`**, qui pointe le rapport
   * d'une mesure et n'existe qu'une fois l'activité terminée : celui-ci vaut
   * dès qu'elle est prévue.
   */
  externalUrl: string | null;
  /**
   * Le nom de l'outil **habituellement associé au type** — `Ergonome` sur un
   * audit UX, `Everyone` sur un audit d'accessibilité (`docs/04` §2). Il ne
   * sert qu'à **nommer** le lien ci-dessus : « Ouvrir dans Ergonome ».
   *
   * Il vient de `activity_types.default_tool_id`, colonne posée en T1.2 et qui
   * **n'avait aucun lecteur** jusqu'ici. C'est ce qui évite de reconnaître un
   * audit à son libellé : un libellé de référentiel se renomme, une clé
   * étrangère non.
   *
   * Nul est un cas normal — la plupart des types n'ont pas d'outil, et un
   * outil d'un autre domaine ou archivé ne se nomme pas non plus.
   */
  defaultToolName: string | null;
  /** Facultatif (`docs/03` §4), triés par nom. Vide la plupart du temps — T3.6. */
  participants: ActivityFormPerson[];
  /**
   * Le résultat, s'il y en a un — T4.3. Un **vivant** au plus
   * (`results_activity_unique`, partiel depuis T4bis.6), et rattaché à une
   * activité terminée, seul état qui l'autorise (`docs/03` §4). La lecture
   * n'impose pas ce dernier point, elle en hérite : `assertPreconditions` le
   * refuse à l'écriture, et une période corrigée peut redériver l'état d'une
   * activité qui porte déjà son résultat.
   */
  result: ActivityResult | null;
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
        producesResult: activityTypes.producesResult,
        objective: activities.objective,
        periodStart: activities.periodStart,
        periodEnd: activities.periodEnd,
        isUnscheduled: activities.isUnscheduled,
        approachLabel: approaches.label,
        cancellationReason: activities.cancellationReason,
        externalUrl: activities.externalUrl,
        /* Le nom de l'outil du **type**, pas d'un résultat : deux colonnes
           d'outil coexistent désormais dans cette lecture, et elles ne disent
           pas la même chose. Celle-ci nomme l'espace de travail, celle de
           `resultRows` nomme la source d'une mesure. */
        defaultToolName: tools.name,
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
      /* `filter(tools)` n'est pas une précaution de style : c'est la règle du
         fichier, et la même que celle que la jointure des résultats documente
         plus bas — un `default_tool_id` pointant l'outil d'un autre domaine
         n'en rendrait pas le nom. `activityTypes` est déjà jointe pour le
         libellé, donc rien ne s'ajoute qu'une table de référentiel. */
      .leftJoin(
        tools,
        and(eq(tools.id, activityTypes.defaultToolId), filter(tools)),
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

    /* Les résultats (T4.3) : **une troisième lecture, pas une jointure de
       plus**. La requête principale en porte déjà deux, et `results` en
       amènerait deux — la table et son outil — pour un champ que la plupart des
       activités n'ont pas. La fiche du ticket tranche pour la seconde lecture,
       « pour la raison qui sépare déjà les participants de leur activité ».

       `activities` est jointe pour porter `filter(activities)` sur la table
       réellement lue, et pour ne lire que les résultats d'activités non
       archivées de ce projet ; `tools` l'est pour le seul nom. Chaque table
       jointe filtrée sur le domaine, la règle du fichier — `tools` comprise :
       sans elle, un `tool_id` pointant l'outil d'un autre domaine en rendrait
       le nom.

       Aucune condition sur l'état de l'activité : `assertPreconditions` refuse
       déjà d'écrire un résultat ailleurs que sur une activité terminée (T1.3).
       La lecture décrit ce que la base porte, elle ne repose pas une règle
       d'écriture. */
    const resultRows = await database
      .select({
        activityId: results.activityId,
        id: results.id,
        label: results.label,
        value: results.value,
        unit: results.unit,
        measuredOn: results.measuredOn,
        toolName: tools.name,
        /* `results.toolId`, et non `tools.id` : la jointure est filtrée sur le
           domaine, et un `tool_id` pointant l'outil d'un autre domaine rendrait
           `null` des deux côtés — le panneau perdrait alors la valeur qu'il
           doit resélectionner. La colonne dit ce que la ligne porte ; la
           jointure dit ce qu'on a le droit d'en nommer. */
        toolId: results.toolId,
        externalUrl: results.externalUrl,
      })
      .from(results)
      .innerJoin(
        activities,
        and(eq(activities.id, results.activityId), filter(activities)),
      )
      .leftJoin(tools, and(eq(tools.id, results.toolId), filter(tools)))
      .where(
        and(
          filter(results),
          eq(activities.projectId, projectId),
          isNull(activities.archivedAt),
          isNull(results.archivedAt),
        ),
      );

    /* Un résultat **vivant** par activité au plus — `results_activity_unique`,
       partiel depuis T4bis.6 —, donc une valeur et non une liste,
       contrairement aux participants. Le `where` ci-dessus écarte les archivés,
       si bien que la contrainte et la lecture disent exactement la même chose. */
    const resultByActivity = new Map<string, ActivityResult>();
    for (const row of resultRows) {
      resultByActivity.set(row.activityId, {
        id: row.id,
        label: row.label,
        value: row.value,
        unit: row.unit,
        measuredOn: row.measuredOn,
        toolName: row.toolName,
        toolId: row.toolId,
        externalUrl: row.externalUrl,
      });
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
        producesResult: row.producesResult,
        objective: row.objective,
        periodStart: row.periodStart,
        periodEnd: row.periodEnd,
        isUnscheduled: row.isUnscheduled,
        approachLabel: row.approachLabel,
        cancellationReason: row.cancellationReason,
        externalUrl: row.externalUrl,
        defaultToolName: row.defaultToolName,
        participants: participantsByActivity.get(row.id) ?? [],
        result: resultByActivity.get(row.id) ?? null,
      });
      byKey.set(key, group);
    }

    return GROUPS.flatMap((group) => {
      const found = byKey.get(group.key);
      return found ? [{ ...group, activities: found }] : [];
    });
  });
}
