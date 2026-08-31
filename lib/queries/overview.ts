/**
 * La vue d'ensemble — le flux d'activité récente, tous accompagnements
 * confondus (`docs/06` §3).
 *
 * **C'est la seconde lecture d'`events`, et la première qui traverse le
 * domaine entier.** `listProjectJournal` lit le journal d'**un** projet, pour
 * retrouver l'origine d'une saisie ; celle-ci lit ce qui vient de se passer
 * dans le centre, sans savoir d'avance où. La différence tient en deux
 * clauses : aucun `eq(events.projectId, …)`, et un plafond.
 *
 * **Ses lignes sont des événements, jamais des activités.** Le bloc s'appelle
 * « Activité récente » parce que `docs/06` §3 le nomme ainsi ; `activities` est
 * une autre table — un fait d'accompagnement daté, un atelier, un audit — et
 * les confondre produirait exactement l'écran incompréhensible que `docs/04`
 * §4 décrit. Le mot ne désigne ici que le bloc, jamais son contenu.
 *
 * **Le journal n'est pas un historique** (D22) : `summary` est figé à
 * l'écriture et cette lecture le rend tel quel — ni valeur avant, ni valeur
 * après, aucun diff, aucune restauration.
 *
 * **Le nom de l'acteur, lui, est courant** (arbitrage (e) de `tickets-C6.md`) :
 * il se lit par la jointure sur `persons`. Ce qui vaut du nom de l'acteur vaut
 * du nom de l'origine — le projet renommé se lit sous son nom d'aujourd'hui,
 * là où la phrase, elle, garde le libellé qu'avait l'objet touché.
 *
 * Ce module n'importe pas `db` : il reçoit un `ScopedDb` déjà lié au domaine
 * courant. Règle 1. La lecture joint, donc elle passe par `joinedRead` —
 * **toute table jointe porte `filter(table)` dans le `on` de son `leftJoin`**,
 * et il y en a trois.
 */

import { and, asc, desc, eq, isNull, lt, ne, or, sql } from "drizzle-orm";

import type { ScopedDb } from "@/lib/db/scoped";
import {
  approaches,
  entities,
  events,
  persons,
  products,
  projectApproaches,
  projectStatuses,
  projects,
} from "@/lib/db/schema";
import type { ProjectStatusNature } from "@/lib/queries/projects";

/**
 * Le plafond du flux — **un nombre écrit, jamais une pagination** (fiche T6.6).
 *
 * Quinze : assez pour que le flux respire sur un domaine actif, assez court
 * pour que le bloc ne repousse pas hors de l'écran les trois autres blocs de
 * `docs/06` §3. C'est aussi l'ordre de grandeur que le document retient pour
 * la liste transverse — *« à quinze puis cinquante projets »*.
 *
 * **Ce n'est pas un décompte**, et rien ne l'affiche : ni « 15 derniers
 * événements », ni « voir plus ». Un flux qui annoncerait sa longueur
 * inviterait à la comparer d'un jour à l'autre, et ce serait la mesure
 * d'activité du centre que la fiche interdit.
 */
export const RECENT_EVENTS_LIMIT = 15;

/**
 * L'origine d'un événement : l'objet de la hiérarchie sur lequel il porte.
 *
 * **Deux natures et pas une de plus**, parce qu'`events` ne porte que deux
 * rattachements : `project_id` et `product_id`. Le second est le cas des
 * relevés d'indicateur, prévu par T6.2 — un relevé mesure le **produit**, dans
 * le temps long, et n'appartient à aucun accompagnement.
 */
export type EventOrigin =
  | { kind: "project"; id: string; name: string }
  | { kind: "product"; id: string; name: string };

/**
 * Une ligne du flux : ce qui a été fait, par qui, sur quoi, quand.
 *
 * **Ni `verb` ni `target_type` ni `target_id`**, comme dans `ProjectEvent` et
 * pour la même raison : la phrase les dit déjà, et les rendre poserait trois
 * colonnes sans lecteur — celles que T5.2 a refusées dans `starters`.
 */
export type RecentEvent = {
  id: string;
  /** La phrase figée à l'écriture (D22, arbitrage (e)). */
  summary: string;
  occurredAt: Date;
  /**
   * Le nom **courant** de l'acteur.
   *
   * `null` dans deux cas que l'écran ne distingue pas : `actor_id` nul — une
   * écriture sans personne courante, l'amorçage ou un acteur effacé — et une
   * personne d'un **autre domaine**, que la jointure filtrée écarte. Dans les
   * deux cas la ligne reste : un événement sans acteur se lit, il ne disparaît
   * pas.
   */
  actorName: string | null;
  /**
   * Le projet, ou à défaut le produit — **nommé et cliquable** à l'écran.
   *
   * `null` quand l'événement ne porte aucun des deux rattachements, ou quand
   * celui qu'il porte a été écarté par le filtre de domaine. La ligne reste,
   * sans lien : un lien qui ne mène à rien est pire qu'une absence
   * (`docs/06` §9).
   */
  origin: EventOrigin | null;
};

/** La forme brute d'une ligne, avant que la préséance ne la referme. */
type Row = {
  id: string;
  summary: string;
  occurredAt: Date;
  actorName: string | null;
  projectId: string | null;
  projectName: string | null;
  productId: string | null;
  productName: string | null;
};

/**
 * La préséance : le projet d'abord, le produit à défaut.
 *
 * **Elle vit ici et nulle part ailleurs**, comme celle des quatre règles de
 * `listRelatedProjects` : un écran qui la referait aurait à connaître le
 * schéma d'`events`, et deux écrans la referaient de deux façons.
 *
 * **Elle se lit sur le nom joint, jamais sur la colonne brute.** C'est ce qui
 * fait qu'un événement pointant le projet d'un autre domaine — forgé, la
 * couche le refuserait — se rend **sans origine** plutôt que de retomber sur
 * son produit : les deux colonnes de la table jointe tombent ensemble, et
 * aucune bascule silencieuse ne se produit.
 */
function originOf(row: Row): EventOrigin | null {
  if (row.projectId && row.projectName) {
    return { kind: "project", id: row.projectId, name: row.projectName };
  }
  if (row.productId && row.productName) {
    return { kind: "product", id: row.productId, name: row.productName };
  }
  return null;
}

/**
 * Les derniers événements du domaine, du plus récent au plus ancien.
 *
 * **Une seule lecture, plafonnée.** Le plafond est une clause `limit`, pas une
 * pagination : la vue d'ensemble dit ce qui vient de se passer, elle n'archive
 * rien — c'est la page projet qui porte le journal complet d'un
 * accompagnement, et lui seul.
 *
 * **Aucun filtre d'archivage, et il n'y en a pas à écrire.** `events` ne porte
 * pas d'`archived_at` (`schema.ts`) : un journal en écriture seule n'a rien à
 * ranger, c'est ce que D22 demande. Les deux jointures de hiérarchie ne
 * portent que `filter()`, sans `alive()` — un accompagnement archivé reste
 * l'origine de son événement, et la règle 4 range la donnée, elle ne la cache
 * pas.
 *
 * **La lecture est ouverte à tout le domaine** (D9) : aucun droit ne se lit
 * ici ni chez l'appelant. Le flux est le même pour qui n'écrit nulle part.
 *
 * `id` départage les instants égaux, comme dans `listProjectJournal` :
 * `occurred_at` porte un `defaultNow()` que deux écritures voisines peuvent
 * partager, et un ordre qui varierait d'un affichage à l'autre serait un
 * défaut — d'autant qu'ici il décide **qui entre sous le plafond**.
 *
 * Un domaine sans événement rend un tableau vide : l'état vide appartient à
 * l'écran. C'est le premier rendu de tous les domaines existants — le journal
 * démarre vide, aucun rattrapage rétroactif n'a été écrit.
 */
export function listRecentEvents(
  scope: ScopedDb,
  limit: number = RECENT_EVENTS_LIMIT,
): Promise<RecentEvent[]> {
  return scope.joinedRead(async (database, { filter }) => {
    const rows = await database
      .select({
        id: events.id,
        summary: events.summary,
        occurredAt: events.occurredAt,
        actorName: persons.fullName,
        /* **Les colonnes de la table jointe, et non `events.projectId`** :
           une jointure coupée par `filter()` rend alors `id` **et** `name` nuls
           ensemble, et `originOf` ne lit qu'une source.

           **Ce n'est pas ce qui protège, et c'est mesuré** : remplacer par
           `events.projectId` laisse les quatorze constats au vert (27/08/2026).
           Ce qui écarte l'origine d'un autre domaine est la conjonction
           `id && name` d'`originOf` — que TypeScript impose de toute façon, le
           nom d'`EventOrigin` n'étant pas nullable. La forme retenue est donc
           une redondance, et elle est gardée pour ce qu'elle rend impossible
           plutôt que pour ce qu'elle corrige : un futur lecteur qui
           relâcherait la conjonction en `if (row.projectId)` n'obtiendrait pas
           d'identifiant étranger, là où la colonne brute lui en donnerait un.
           Une redondance nommée comme telle ne se prend pas pour un garde-fou. */
        projectId: projects.id,
        projectName: projects.name,
        productId: products.id,
        productName: products.name,
      })
      .from(events)
      /* Trois `leftJoin`, et **`filter()` dans le `on`, jamais dans le
         `where`**. Dans le `where`, chacun écarterait la **ligne** au lieu
         d'écarter le **nom** : un événement du domaine courant disparaîtrait
         parce que son acteur, son projet ou son produit a été forgé ailleurs.
         La jointure coupée rend des colonnes nulles, la forme qu'a déjà un
         événement sans acteur ou sans rattachement — l'écran n'a pas à
         connaître la différence. C'est la règle posée par `listProjectJournal`
         pour `persons`, étendue ici aux deux tables de la hiérarchie. */
      .leftJoin(persons, and(eq(persons.id, events.actorId), filter(persons)))
      .leftJoin(
        projects,
        and(eq(projects.id, events.projectId), filter(projects)),
      )
      .leftJoin(
        products,
        and(eq(products.id, events.productId), filter(products)),
      )
      .where(filter(events))
      .orderBy(desc(events.occurredAt), asc(events.id))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      summary: row.summary,
      occurredAt: row.occurredAt,
      actorName: row.actorName,
      origin: originOf(row),
    }));
  });
}

/* ==========================================================================
   La répartition — combien de projets par statut, par entité, par approche
   (T6.7, complétée par T7.2)
   ========================================================================== */

/**
 * Une valeur de référentiel et le nombre de projets qu'elle porte.
 *
 * **Le nombre est un décompte de lignes, jamais un indice.** C'est la frontière
 * de D39 : Vision n'a rien calculé pour qualifier qui que ce soit — elle a
 * compté ce que le filtre de `/projets` rendra. D'où le contrat que le ticket
 * pose et que le test mesure : **suivre le lien rend exactement ce nombre de
 * lignes**. Un décompte qui ne tiendrait pas cette promesse serait un mensonge
 * qu'aucun autre constat ne détecte.
 */
export type DistributionEntry = {
  id: string;
  label: string;
  count: number;
};

/** Un statut porte en plus sa `nature` : c'est ce que la pastille rend. */
export type StatusDistributionEntry = DistributionEntry & {
  nature: ProjectStatusNature;
};

/**
 * **Les trois dimensions de `docs/06` §3**, enfin au complet (T7.2) : par
 * statut, par entité, par approche.
 *
 * L'entité a manqué d'un chantier, et c'était la lettre de la fiche T6.7 :
 * *« un chiffre dont le filtre n'existe pas n'est pas rendu »*. `/projets` ne
 * portait aucune clé d'entité, et rendre le chiffre aurait donné un nombre qui
 * ne mène nulle part. T7.2 pose le filtre d'abord, le chiffre ensuite — dans
 * cet ordre, et c'est le seul qui tienne le contrat.
 *
 * **Il n'y en aura pas de quatrième.** Le métier a gagné son filtre par le même
 * ticket et n'a pas de répartition : `docs/06` §3 en nomme trois, et une
 * quatrième dimension ne s'invente pas depuis la seule existence d'un filtre.
 */
export type ProjectDistribution = {
  statuses: StatusDistributionEntry[];
  entities: DistributionEntry[];
  approaches: DistributionEntry[];
};

/**
 * La forme brute d'une ligne de répartition : le décompte, plus l'archivage du
 * référentiel, que la sortie ne porte pas.
 */
type DistributionRow = DistributionEntry & { archivedAt: Date | null };

/**
 * Une valeur de référentiel se rend si elle est vivante, **ou** si elle porte
 * encore des projets.
 *
 * Les deux moitiés ont chacune leur raison. Une valeur archivée sans projet est
 * du vocabulaire retiré : la montrer rouvrirait un choix que le domaine a
 * fermé. Une valeur archivée qui porte encore des projets est un fait : ces
 * projets existent, ils comptent dans la liste, et la taire ferait de la
 * répartition une lecture **incomplète en silence** — la somme des chiffres
 * cesserait de rendre compte des lignes.
 *
 * Aucune somme n'est affichée, et c'est justement pourquoi la règle compte :
 * personne ne verrait l'écart.
 */
function isRendered(row: DistributionRow): boolean {
  return row.archivedAt === null || row.count > 0;
}

/** L'entrée rendue, une fois l'archivage du référentiel consommé. */
function strip(row: DistributionRow): DistributionEntry {
  return { id: row.id, label: row.label, count: row.count };
}

/**
 * Combien de projets par statut, par entité, et par approche.
 *
 * **Les trois conditions d'archivage sont celles de `listProjects`, à la
 * lettre** — `filter(projects)`, `projects.archived_at is null`,
 * `products.archived_at is null` — et c'est tout ce qui fait tenir le contrat
 * du ticket. Le décompte et la liste ne sont pas deux lectures qui se
 * ressemblent : ce sont deux façons d'écrire la même clause, et la seule preuve
 * qu'elles disent la même chose est de suivre le lien et de compter.
 *
 * **On compte toujours la colonne de la table la plus lointaine de la
 * chaîne**, et c'est la seule règle qui tienne le contrat. Pour le statut et
 * l'approche, la chaîne va `référentiel → projects → products` : on compte
 * `products.id`. Pour l'entité, elle va `entities → products → projects`, en
 * sens inverse : on compte `projects.id`.
 *
 * La différence n'est pas cosmétique. Sur la chaîne des statuts, un projet
 * vivant sous un **produit archivé** franchit le premier `leftJoin` et échoue
 * au second : compter la colonne du projet l'inclurait, quand `listProjects`
 * l'écarte par son `innerJoin products` — le chiffre dirait un de plus que la
 * liste, sans qu'aucune erreur ne se produise. C'est exactement la divergence
 * que la mise en défaut de la fiche cherche, et compter le bout de la chaîne
 * est ce qui l'empêche des deux côtés.
 *
 * **Le référentiel entier, zéros compris**, à rebours de
 * `listProjectFilterOptions` qui n'offre que ce qui ramène quelque chose. Les
 * deux n'ont pas le même objet : l'une propose des chemins, celle-ci **décrit
 * une distribution**. Un statut du domaine absent de la répartition se lit
 * comme un statut qui n'existe pas, et « Aucun projet » est un fait que le
 * domaine a intérêt à voir.
 *
 * **Un projet à deux approches compte dans les deux**, donc la somme des
 * approches dépasse le nombre de projets. Ce n'est pas un défaut : c'est le
 * comportement du filtre, qui retient un projet dès qu'il porte l'approche.
 * Aucune somme n'est d'ailleurs affichée — un total inviterait à en faire un
 * pourcentage, que la fiche interdit nommément.
 *
 * **Trois requêtes, un seul passage.** La forme de `listProjectFilterOptions` :
 * les référentiels sont courts, et trois allers-retours sur un même
 * `joinedRead` coûtent moins qu'un `union` dont le type ne se vérifierait plus
 * à la sortie.
 *
 * L'ordre est celui du domaine — `position` d'abord, le libellé départageant —,
 * jamais celui du décompte : trier par nombre ferait de la répartition un
 * classement, et le rang deviendrait une lecture. `docs/06` §10.
 */
export function listProjectDistribution(
  scope: ScopedDb,
): Promise<ProjectDistribution> {
  return scope.joinedRead(async (database, { filter }) => {
    const statusRows = await database
      .select({
        id: projectStatuses.id,
        label: projectStatuses.label,
        nature: projectStatuses.nature,
        archivedAt: projectStatuses.archivedAt,
        count: sql<number>`count(${products.id})::int`,
      })
      .from(projectStatuses)
      .leftJoin(
        projects,
        and(
          eq(projects.statusId, projectStatuses.id),
          filter(projects),
          isNull(projects.archivedAt),
        ),
      )
      .leftJoin(
        products,
        and(
          eq(products.id, projects.productId),
          filter(products),
          isNull(products.archivedAt),
        ),
      )
      .where(filter(projectStatuses))
      .groupBy(projectStatuses.id)
      .orderBy(asc(projectStatuses.position), asc(projectStatuses.label));

    /* L'entité : la seule chaîne qui parte du référentiel **vers** le projet en
       passant par le produit. Un projet a exactement un produit, donc aucune
       ligne ne se compte deux fois — ce qui n'est pas vrai de l'approche, et la
       différence est dite plus bas. */
    const entityRows = await database
      .select({
        id: entities.id,
        label: entities.label,
        archivedAt: entities.archivedAt,
        count: sql<number>`count(${projects.id})::int`,
      })
      .from(entities)
      .leftJoin(
        products,
        and(
          eq(products.entityId, entities.id),
          filter(products),
          isNull(products.archivedAt),
        ),
      )
      .leftJoin(
        projects,
        and(
          eq(projects.productId, products.id),
          filter(projects),
          isNull(projects.archivedAt),
        ),
      )
      .where(filter(entities))
      .groupBy(entities.id)
      .orderBy(asc(entities.position), asc(entities.label));

    const approachRows = await database
      .select({
        id: approaches.id,
        label: approaches.label,
        archivedAt: approaches.archivedAt,
        count: sql<number>`count(${products.id})::int`,
      })
      .from(approaches)
      /* Trois `leftJoin` en cascade, et **`filter()` sur chacun** : la table de
         liaison est une table du domaine comme les autres, et l'oublier
         laisserait un projet d'ailleurs rattacher une approche d'ici. */
      .leftJoin(
        projectApproaches,
        and(
          eq(projectApproaches.approachId, approaches.id),
          filter(projectApproaches),
        ),
      )
      .leftJoin(
        projects,
        and(
          eq(projects.id, projectApproaches.projectId),
          filter(projects),
          isNull(projects.archivedAt),
        ),
      )
      .leftJoin(
        products,
        and(
          eq(products.id, projects.productId),
          filter(products),
          isNull(products.archivedAt),
        ),
      )
      .where(filter(approaches))
      .groupBy(approaches.id)
      .orderBy(asc(approaches.position), asc(approaches.label));

    return {
      statuses: statusRows.filter(isRendered).map((row) => ({
        ...strip(row),
        nature: row.nature,
      })),
      entities: entityRows.filter(isRendered).map(strip),
      approaches: approachRows.filter(isRendered).map(strip),
    };
  });
}

/* ==========================================================================
   Les projets sans activité récente (T6.7)
   ========================================================================== */

/**
 * Le seuil de fraîcheur : **un mois**, celui de `docs/05` §7.
 *
 * Le document en fait le *thermomètre de la fraîcheur* — *« la proportion de
 * projets dont la dernière activité date de plus d'un mois »*. Vision en retient
 * le seuil et **jamais la proportion** : un taux serait l'indice calculé que
 * D39 interdit, et il qualifierait le centre. La liste dit des projets et une
 * date ; elle ne dit pas quelle part du tout ils font.
 */
export const STALE_AFTER_MONTHS = 1;

/**
 * Le plafond de la liste — **un nombre écrit, jamais annoncé**, la forme de
 * `RECENT_EVENTS_LIMIT`.
 *
 * Dix : `docs/06` §3 veut *« une liste courte, factuelle »*, et une liste
 * courte est celle qu'on lit d'un regard. **La conséquence est nommée** :
 * au-delà de dix projets dormants, les suivants ne sont pas affichés. Le bloc
 * attire le regard sur ce qui s'endort, il ne tient pas l'inventaire de ce qui
 * dort — c'est la page `/projets`, triée par activité récente, qui le fait.
 *
 * **Le plafond porte sur les accompagnements en cours seuls** depuis le
 * 31/08/2026 : les terminés ne le consomment plus, et dix places rendent donc
 * dix projets sur lesquels quelque chose peut encore se faire.
 *
 * **Rien ne l'affiche**, ni « 10 premiers », ni « voir plus » : un bloc qui
 * annoncerait sa longueur inviterait à la comparer d'une semaine à l'autre, et
 * ce serait la mesure d'activité du centre que la fiche interdit.
 */
export const STALE_PROJECTS_LIMIT = 10;

/**
 * L'instant qui sépare le récent du dormant : **un mois avant maintenant**.
 *
 * **Une fonction pure, et c'est ce qui rend le seuil mesurable.** Écrit
 * `now() - interval '1 month'` en SQL, il serait juste et intestable : aucun
 * test ne pourrait placer le même projet d'un côté puis de l'autre de la
 * frontière, et un décalage d'un mois passerait au vert.
 *
 * **Le jour se rabat sur le dernier du mois quand il n'existe pas.** Sans cela,
 * `setUTCMonth` fait déborder le 31 mars sur le 3 mars — JavaScript reporte les
 * jours en trop sur le mois suivant. Un seuil qui avancerait de trois jours
 * quatre fois l'an rendrait « plus d'un mois » faux sans jamais lever
 * d'erreur.
 *
 * **UTC, comme les quatre formateurs de `lib/format.ts`** : le seuil se compare
 * à une colonne `timestamptz`, et l'heure locale du serveur n'a pas à décider
 * de ce qui dort.
 */
export function staleBefore(now: Date = new Date()): Date {
  const day = now.getUTCDate();
  const before = new Date(now);

  // Le premier du mois d'abord : c'est le seul jour qui existe dans tous les
  // mois, donc le seul depuis lequel un recul de mois ne peut pas déborder.
  before.setUTCDate(1);
  before.setUTCMonth(before.getUTCMonth() - STALE_AFTER_MONTHS);

  // Le zéro du mois suivant est le dernier jour du mois courant.
  const lastDay = new Date(
    Date.UTC(before.getUTCFullYear(), before.getUTCMonth() + 1, 0),
  ).getUTCDate();
  before.setUTCDate(Math.min(day, lastDay));

  return before;
}

/**
 * Un accompagnement qui ne bouge plus, tel que le bloc le rend.
 *
 * **Ni statut, ni équipe, ni produit** : le bloc dit un nom et une date, et
 * `docs/06` §3 le veut *« sans alerte ni badge »*. Trois colonnes de plus
 * feraient une seconde liste des projets sur la vue d'ensemble, quand
 * `/projets` existe et porte le tri par fraîcheur.
 */
export type StaleProject = {
  id: string;
  name: string;
  /**
   * `null` quand le projet n'a **jamais** eu d'activité — et il figure alors
   * dans la liste au même titre que les autres. « Aucune activité » est un
   * fait, pas un retard (arbitrage (h) de `tickets-C6.md`).
   */
  lastActivityAt: Date | null;
};

/**
 * Les projets dont la dernière activité est antérieure au seuil, et ceux qui
 * n'en ont jamais eu.
 *
 * **Les mêmes conditions d'archivage que `listProjects`**, et pour la même
 * raison qu'à la répartition : un projet rangé n'est pas un projet qui dort, et
 * un accompagnement sous produit archivé non plus.
 *
 * **Ni les accompagnements terminés** (31/08/2026, hors ticket et à la
 * demande) : la nature `done` de leur statut dit que plus rien n'y sera saisi,
 * et la liste ne relève pas ce qui s'arrête pour de bonnes raisons. C'est une
 * **restriction**, jamais un jugement — le bloc dit toujours un nom et une
 * date, il ne mesure ni ne classe personne. La lecture se fait sur la
 * `nature`, l'énuméré du schéma, jamais sur le libellé : un domaine renomme
 * « Terminé » en « Clôturé » sans que la liste change de contenu.
 *
 * **Le tri est un tri, jamais un classement.** Du plus ancien au plus récent,
 * les « jamais » en tête, le nom départageant à égalité — un ordre qui varierait
 * d'un affichage à l'autre serait un défaut, d'autant qu'ici il décide qui entre
 * sous le plafond. Aucun rang n'est affiché, aucun badge, aucune couleur
 * d'alerte : ce qui se lit est une date, et le lecteur juge.
 *
 * **Le seuil est un argument**, pas un `now()` en SQL — voir `staleBefore`.
 *
 * **La lecture est ouverte à tout le domaine** (D9) : aucun droit ne se lit ici
 * ni chez l'appelant. Un projet qui dort n'est pas une information réservée.
 */
export function listStaleProjects(
  scope: ScopedDb,
  before: Date = staleBefore(),
  limit: number = STALE_PROJECTS_LIMIT,
): Promise<StaleProject[]> {
  return scope.joinedRead(async (database, { filter }) => {
    return database
      .select({
        id: projects.id,
        name: projects.name,
        lastActivityAt: projects.lastActivityAt,
      })
      .from(projects)
      .innerJoin(
        products,
        and(
          eq(products.id, projects.productId),
          filter(products),
          isNull(products.archivedAt),
        ),
      )
      /* Le statut, joint **pour sa seule nature** : rien n'en est sélectionné,
         et le bloc n'en rend rien. La jointure est interne comme celle de
         `listProjects`, et elle porte son `filter()` — un statut d'un autre
         domaine ne décide pas de ce qui dort ici. */
      .innerJoin(
        projectStatuses,
        and(
          eq(projectStatuses.id, projects.statusId),
          filter(projectStatuses),
        ),
      )
      .where(
        and(
          filter(projects),
          isNull(projects.archivedAt),
          /* **Un accompagnement terminé ne dort pas, il est fini** (31/08/2026,
             hors ticket et à la demande). Son absence d'activité n'est pas un
             fait à signaler : c'est la conséquence de son statut, et la lire
             comme un endormissement était le seul contresens que ce bloc
             pouvait produire.

             `ne` sur la **nature**, jamais sur le libellé : la nature est
             l'énuméré du schéma, le libellé se renomme (`schema.ts`). C'est
             l'exclusion de `listTeam` et du décompte de charge, écrite de la
             même façon — et D42 tient : l'archivage n'est pas un statut, et il
             est écarté deux lignes plus haut. */
          ne(projectStatuses.nature, "done"),
          /* `or` ne rend `undefined` que sans condition : il y en a deux. */
          or(
            isNull(projects.lastActivityAt),
            lt(projects.lastActivityAt, before),
          )!,
        ),
      )
      .orderBy(
        sql`${projects.lastActivityAt} asc nulls first`,
        asc(projects.name),
      )
      .limit(limit);
  });
}

/* ==========================================================================
   L'accès direct (T6.7)
   ========================================================================== */

/**
 * Combien de projets et combien de produits — les deux nombres de l'accès
 * direct.
 *
 * **Ce sont des décomptes de lignes, et le lien le prouve** : chacun mène à la
 * liste sans filtre, qui rend exactement ce nombre. C'est le contrat de la
 * répartition, appliqué à l'entrée qui n'en pose aucun — et les deux pages de
 * destination affichent déjà ces mêmes nombres (`formatProjects`,
 * `formatProducts`).
 *
 * **Ce n'est pas la taille du centre.** Un décompte de lignes ne qualifie
 * personne : il dit ce que l'écran suivant contient. La frontière de D39 est
 * ici franche — ce serait un indice si Vision en tirait un rythme, une
 * moyenne ou un taux, et elle n'en tire rien.
 *
 * **Chaque décompte rejoue les jointures de sa liste, et non un `count(*)`
 * nu.** `listProjects` écarte les projets d'un produit archivé par son
 * `innerJoin`, `listProductsWithCounts` écarte les produits dont l'entité n'est
 * pas du domaine : un décompte plus simple que sa liste est un décompte qui
 * finit par en dire plus qu'elle.
 */
export function countProjects(scope: ScopedDb): Promise<number> {
  return scope.joinedRead(async (database, { filter }) => {
    const [row] = await database
      .select({ count: sql<number>`count(*)::int` })
      .from(projects)
      .innerJoin(
        products,
        and(
          eq(products.id, projects.productId),
          filter(products),
          isNull(products.archivedAt),
        ),
      )
      .where(and(filter(projects), isNull(projects.archivedAt)));

    return row?.count ?? 0;
  });
}

/** Le pendant, pour les produits. Voir `countProjects`. */
export function countProducts(scope: ScopedDb): Promise<number> {
  return scope.joinedRead(async (database, { filter }) => {
    const [row] = await database
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .innerJoin(
        entities,
        and(eq(entities.id, products.entityId), filter(entities)),
      )
      .where(and(filter(products), isNull(products.archivedAt)));

    return row?.count ?? 0;
  });
}
