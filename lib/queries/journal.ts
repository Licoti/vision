/**
 * La lecture du journal — les événements d'un accompagnement, du plus récent au
 * plus ancien (`docs/06` §5).
 *
 * **C'est la première lecture d'`events`.** La table est au schéma depuis T1.2 ;
 * T6.1 et T6.2 lui ont donné ses quatorze points d'écriture, et personne ne la
 * lisait. Ce module ne fait que rendre visible ce qui s'y écrit — il n'écrit
 * rien, ne compose aucune phrase (c'est `lib/journal.ts`, côté écriture) et
 * n'invente aucune ligne.
 *
 * **Le journal n'est pas un historique** (D22) : ni valeur avant, ni valeur
 * après, aucun diff, aucune restauration. `summary` est figé à l'écriture, et
 * cette lecture le rend tel quel.
 *
 * **Le nom de l'acteur, lui, est courant** (arbitrage (e) de `tickets-C6.md`) :
 * il se lit par la jointure sur `persons`, jamais dans la phrase figée. Une
 * personne renommée l'est partout dans le journal, ce qui est juste — c'est la
 * même personne. Et une personne **archivée** reste l'auteur de son geste : la
 * jointure ne porte aucun filtre d'archivage, seulement celui du domaine.
 *
 * La lecture joint, donc elle passe par `joinedRead`. **La table jointe porte
 * `filter(persons)`**, dans le `on` de son `leftJoin` : c'est la condition posée
 * par l'en-tête de `joinedRead`, et le seul filtre qui empêche le nom d'une
 * personne d'un autre domaine de paraître sur un événement du domaine courant.
 *
 * Ce module n'importe pas `db` : il reçoit un `ScopedDb` déjà lié au domaine
 * courant. Règle 1.
 */

import { and, asc, desc, eq } from "drizzle-orm";

import type { ScopedDb } from "@/lib/db/scoped";
import { events, persons } from "@/lib/db/schema";

/**
 * Une entrée du bloc « Journal » : ce qui a été fait, par qui, quand.
 *
 * **Ni `verb` ni `target_type` ni `target_id`**, et c'est un choix. La phrase
 * les dit déjà — « Activité terminée : Audit UX » porte son verbe et son objet
 * —, et les interdits de la fiche écartent tout lien vers l'objet touché : un
 * `target_id` rendu ici serait la colonne sans lecteur que T5.2 a refusée dans
 * `starters`.
 */
export type ProjectEvent = {
  id: string;
  /** La phrase figée à l'écriture (D22, arbitrage (e)). */
  summary: string;
  occurredAt: Date;
  /**
   * Le nom **courant** de l'acteur.
   *
   * `null` dans deux cas que l'écran ne distingue pas : `actor_id` nul — une
   * écriture sans personne courante, l'amorçage ou un acteur effacé, la clé
   * étrangère étant `on delete set null` — et une personne d'un **autre
   * domaine**, que la jointure filtrée écarte. Dans les deux cas la ligne
   * reste : un événement sans acteur se lit, il ne disparaît pas.
   */
  actorName: string | null;
};

/**
 * Les événements d'un projet, du plus récent au plus ancien.
 *
 * **Aucun filtre d'archivage**, et il n'y en a pas à écrire : `events` ne porte
 * pas d'`archived_at` (`schema.ts`). Un journal en écriture seule n'a rien à
 * ranger — c'est ce que D22 demande.
 *
 * **Aucune borne, aucune pagination** (interdits de la fiche). Le plafond est
 * l'affaire du flux global de T6.6, qui lit tous projets confondus ; ici la
 * liste est celle d'un seul accompagnement.
 *
 * `id` départage les instants égaux, comme dans `listProjectResources` : un
 * ordre qui varierait d'un affichage à l'autre serait un défaut, et
 * `occurred_at` porte un `defaultNow()` que deux écritures voisines peuvent
 * partager.
 *
 * **La lecture est ouverte à tout le domaine** (D9) : aucun droit ne se lit ici
 * ni chez l'appelant, et le journal d'un accompagnement archivé se lit comme
 * celui d'un autre — la règle 4 range, elle ne cache pas.
 *
 * Un projet sans événement rend un tableau vide : l'état vide appartient à
 * l'écran, et il est le premier rendu de tous les projets existants — le
 * journal démarre vide, aucun rattrapage rétroactif n'a été écrit.
 */
export function listProjectJournal(
  scope: ScopedDb,
  projectId: string,
): Promise<ProjectEvent[]> {
  return scope.joinedRead(async (database, { filter }) => {
    const rows = await database
      .select({
        id: events.id,
        summary: events.summary,
        occurredAt: events.occurredAt,
        actorName: persons.fullName,
      })
      .from(events)
      /* `leftJoin` parce qu'`actor_id` est nullable : un événement sans acteur
         doit sortir de la lecture, pas en disparaître — c'est la forme des deux
         `leftJoin` de `listProjectResources`, et la même raison.

         **`filter(persons)` vit dans le `on`, jamais dans le `where`** : dans le
         `where`, il écarterait la **ligne** au lieu d'écarter le **nom**, et un
         événement du domaine courant disparaîtrait parce que son acteur a été
         forgé ailleurs. La jointure coupée rend `actorName` à `null`, la forme
         qu'a déjà un événement sans acteur — l'écran n'a pas à connaître la
         différence. */
      .leftJoin(
        persons,
        and(eq(persons.id, events.actorId), filter(persons)),
      )
      .where(and(filter(events), eq(events.projectId, projectId)))
      .orderBy(desc(events.occurredAt), asc(events.id));

    return rows;
  });
}
