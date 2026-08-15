/**
 * Les lectures liées aux ressources : les documents rattachés à un
 * accompagnement — un lien, un titre, un type, et l'activité qui les a produits
 * (`docs/06` §5).
 *
 * **Vision n'héberge aucun fichier.** Une ressource est un lien vers un
 * document hébergé ailleurs (`docs/02` §5), et ce module ne rend jamais rien
 * d'autre que ce que la ligne porte : aucune requête sortante vers l'URL, ni
 * vérification, ni aperçu, ni titre deviné.
 *
 * La lecture joint, donc elle passe par `joinedRead`. **Toute table jointe
 * porte `filter(table)`**, les deux `leftJoin` compris : c'est la condition
 * posée par l'en-tête de `joinedRead`, et la propriété relevée de T2.2 à T3.1
 * — les filtres de domaine se rattrapent l'un l'autre — ne dispense d'aucun
 * d'eux.
 *
 * Ce module n'importe pas `db` : il reçoit un `ScopedDb` déjà lié au domaine
 * courant. Règle 1.
 */

import { and, asc, desc, eq, isNull } from "drizzle-orm";

import type { ScopedDb } from "@/lib/db/scoped";
import {
  activities,
  activityTypes,
  resourceType,
  resources,
} from "@/lib/db/schema";

/** `powerpoint` · `figma` · … Dérivé du schéma, jamais réécrit à la main. */
export type ResourceType = (typeof resourceType.enumValues)[number];

/** Une entrée du bloc « Ressources » : titre, lien, type, activité. Rien d'autre. */
export type ProjectResource = {
  id: string;
  title: string;
  /** Le lien vers le document hébergé ailleurs. Jamais appelé par Vision. */
  url: string;
  /** Saisi, jamais déduit de l'URL (D21). Formaté par `lib/format`. */
  resourceType: ResourceType;
  /**
   * Le libellé du **type** de l'activité productrice — « Test utilisateur ».
   * `null` quand le rattachement n'est pas renseigné : il est facultatif
   * (`docs/02` §5), et c'est lui qui « transforme une liste de fichiers en
   * récit lisible » quand il est là.
   */
  activityLabel: string | null;
};

/**
 * Les ressources d'un projet, de la plus récemment reliée à la plus ancienne.
 *
 * **L'ordre est tranché ici** — aucun document ne l'écrit, et la fiche de T4.1
 * demande au ticket de le choisir. Une ressource n'a aucune date propre à
 * l'écran : `source_updated_at` existe dans le schéma mais `docs/05` ne la liste
 * pas, donc C4 ne la saisit ni ne l'affiche. `created_at` est la seule date qui
 * existe, et elle répond au geste que C4 installe — on relie une restitution,
 * on la retrouve en tête. `id` départage : un ordre qui varierait d'un
 * affichage à l'autre serait un défaut.
 *
 * **L'activité jointe est filtrée sur son archivage** (T4bis.4), et le
 * raisonnement inverse de T4.1 est retranché plutôt qu'amendé. Il tenait tant
 * que **rien n'archivait une activité** : « on décrit, on ne propose pas », la
 * règle qui fait afficher le libellé d'un type archivé. Le geste de T4bis.4
 * rend ce cas atteignable, et le change de nature — une ressource citerait le
 * libellé d'une activité que la roadmap ne montre plus, donc un rattachement
 * que l'écran ne sait plus expliquer. Un type archivé, lui, reste le type de
 * l'activité : ce sont deux situations différentes, pas une règle qui plie.
 *
 * **La ressource, elle, reste** : le filtre vit dans le `on` de la jointure, pas
 * dans le `where`. Le `leftJoin` rend alors `activityLabel` à `null`, la forme
 * qu'a déjà une ressource sans rattachement — l'écran n'a pas eu à changer.
 *
 * Les ressources archivées sont écartées, comme partout ailleurs. Un projet
 * sans ressource rend un tableau vide : l'état vide appartient à l'écran.
 */
export function listProjectResources(
  scope: ScopedDb,
  projectId: string,
): Promise<ProjectResource[]> {
  return scope.joinedRead(async (database, { filter }) => {
    const rows = await database
      .select({
        id: resources.id,
        title: resources.title,
        url: resources.url,
        resourceType: resources.resourceType,
        activityLabel: activityTypes.label,
      })
      .from(resources)
      /* `activity_id` est nullable — d'où les deux `leftJoin` : une ressource
         sans rattachement doit sortir de la lecture, pas en disparaître. Une
         activité **archivée** coupe la jointure de la même façon (T4bis.4) : la
         ressource sort, son libellé non. Le second `leftJoin` n'a pas de filtre
         d'archivage à porter — un type archivé reste le type de l'activité, et
         la jointure coupée l'emporte de toute façon avec elle. */
      .leftJoin(
        activities,
        and(
          eq(activities.id, resources.activityId),
          filter(activities),
          isNull(activities.archivedAt),
        ),
      )
      .leftJoin(
        activityTypes,
        and(
          eq(activityTypes.id, activities.activityTypeId),
          filter(activityTypes),
        ),
      )
      .where(
        and(
          filter(resources),
          eq(resources.projectId, projectId),
          isNull(resources.archivedAt),
        ),
      )
      .orderBy(desc(resources.createdAt), asc(resources.id));

    return rows;
  });
}

/* ==========================================================================
   L'exception nominative du panneau — T4bis.5
   ========================================================================== */

/**
 * L'activité qu'une ressource porte déjà, de quoi la nommer dans le `select`.
 *
 * Le format est **brut** : `formatActivityPeriod` vit dans `lib/format` et la
 * page compose le libellé, comme elle le fait déjà pour les options tirées de la
 * roadmap. Une lecture ne met pas en forme.
 */
export type KeptResourceActivity = {
  id: string;
  /** Le libellé du type — « Test utilisateur ». */
  typeLabel: string;
  /** Colonnes `date` : chaînes `YYYY-MM-DD`, formatées par `lib/format`. */
  periodStart: string | null;
  periodEnd: string | null;
  isUnscheduled: boolean;
};

/**
 * L'activité **déjà portée** par une ressource que l'on corrige, quel que soit
 * son état — l'exception nominative de T4bis.1, transposée au panneau de
 * ressource.
 *
 * **Aucun filtre sur `archived_at` ni sur `state`, et c'est toute sa raison
 * d'être.** Les options du panneau se dérivent de la roadmap, dont les activités
 * archivées sont absentes et dont le groupe « Annulé » est écarté — « on décrit,
 * on ne propose pas ». Une ressource rattachée à l'une ou à l'autre verrait donc
 * son `select` retomber sur « Aucune », et **la première re-soumission la
 * détacherait en silence** : exactement la perte que T4bis.1 a refermée pour les
 * formulaires de produit et de projet. Cette lecture nomme la valeur portée, et
 * elle seule ; elle n'ouvre la liste à personne d'autre.
 *
 * **`projectId` fait partie de la question, pas de l'habillage** : sans lui,
 * l'exception nommerait l'activité d'un autre accompagnement dès qu'une
 * soumission forgée en glisserait l'identifiant. L'appelant tient déjà le projet
 * de la ressource — le rapprochement se fait donc ici, en SQL, plutôt qu'après
 * coup.
 *
 * Rend `null` quand rien ne correspond : une activité d'un autre projet, d'un
 * autre domaine, ou dont le type appartient à un autre domaine — le `innerJoin`
 * filtré emportant le tout.
 */
export function findResourceActivity(
  scope: ScopedDb,
  projectId: string,
  activityId: string,
): Promise<KeptResourceActivity | null> {
  return scope.joinedRead(async (database, { filter }) => {
    const rows = await database
      .select({
        id: activities.id,
        typeLabel: activityTypes.label,
        periodStart: activities.periodStart,
        periodEnd: activities.periodEnd,
        isUnscheduled: activities.isUnscheduled,
      })
      .from(activities)
      /* `innerJoin` et non `leftJoin` : `activity_type_id` est `not null`, et
         une activité dont le type ne se lit pas dans ce domaine ne se nomme
         pas — la règle de `listProjectResources`, où la jointure coupée retire
         le libellé. Sans nom, pas d'option. */
      .innerJoin(
        activityTypes,
        and(
          eq(activityTypes.id, activities.activityTypeId),
          filter(activityTypes),
        ),
      )
      .where(
        and(
          filter(activities),
          eq(activities.id, activityId),
          eq(activities.projectId, projectId),
        ),
      );

    return rows[0] ?? null;
  });
}
