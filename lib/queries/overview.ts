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

import { and, asc, desc, eq } from "drizzle-orm";

import type { ScopedDb } from "@/lib/db/scoped";
import { events, persons, products, projects } from "@/lib/db/schema";

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
