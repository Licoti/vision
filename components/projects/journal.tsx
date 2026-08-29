/**
 * Le bloc « Journal » — le dernier bloc de référence de la page projet.
 *
 * `docs/06` §5 le pose en dernier et **replié** : *« c'est une information de
 * contrôle, pas de compréhension »*. Il sert à retrouver l'origine d'une
 * saisie, jamais à comprendre l'accompagnement — celui-ci se lit dans la
 * roadmap, en position dominante.
 *
 * **C'est un `<details>` natif, sans une ligne de JavaScript**, comme le rang
 * « Indicateurs associés » de la page produit et le groupe « Annulé » de la
 * roadmap. Il rend son contenu dans le document même fermé, à la différence
 * d'un menu — et c'est ce qui permet de mesurer le critère du ticket sur le
 * HTML servi, sans navigateur.
 *
 * **Le `<summary>` est « Journal », et il referme une dette.** Le point d'entrée
 * « Voir le journal » était dessiné ici depuis le 20/08/2026 **sans être un
 * lien** — un `<span>` dans un `<p>`, ni focalisable ni annoncé, portant
 * « — à venir » en `sr-only`. L'affordance qui ne répondait pas répond, et elle
 * répond exactement là où elle avait été posée.
 *
 * **Aucun décompte, ni sur le `<summary>` ni ailleurs.** C'est l'écart avec
 * « Indicateurs associés », qui en porte un : compter les événements d'un projet
 * serait une **mesure d'activité par projet**, que `docs/06` §10 refuse et que
 * la fiche du ticket interdit nommément. Savoir combien d'indicateurs sont
 * repliés donne envie de les déplier ; savoir combien de fois un projet a été
 * touché classerait les projets entre eux.
 *
 * **Le journal n'est pas un historique** (D22) : chaque ligne dit la phrase
 * figée à l'écriture, son acteur et sa date. Ni valeur avant, ni valeur après,
 * aucun diff, aucune restauration, **et aucun lien vers l'objet touché** — la
 * page n'affiche plus l'activité archivée ni la ressource retirée dont une
 * ligne peut parler, et un lien qui mène à rien est pire qu'une absence
 * (`docs/06` §9).
 *
 * **Aucun droit ne se lit ici, et il n'y en a aucun à lire** : le bloc ne
 * s'écrit pas. La lecture est ouverte à tout le domaine (D9), sur un
 * accompagnement archivé comme sur un autre.
 *
 * Le composant ne lit aucune base : `events` est ce que `listProjectJournal` a
 * déjà lu, joint et trié.
 */

import { BlockNote } from "@/components/ui/empty-state";
import { Section, SectionHeader } from "@/components/ui/section";
import { formatEventDay } from "@/lib/format";
import type { ProjectEvent } from "@/lib/queries/journal";

export function Journal({ events }: { events: ProjectEvent[] }) {
  return (
    <Section>
      {/* **Le bloc n'est plus replié** (28/08/2026). Il l'était depuis T6.3, par
          un `<details>` dont ce `SectionHeader` était le `<summary>` et un
          chevron de 10 px la marque de repli — la forme que `docs/06` §5 décrit
          (« frise repliée par défaut »).

          C'est le geste que la page produit a fait le même jour, et pour la
          même raison : **son contenu tient en quatre lignes**, et un chevron de
          10 px est un prix de découverte plus cher que ce qu'il cache. La règle
          d'or reste tenue autrement — le journal est **en dernier**, et sa place
          dit qu'il est une information de contrôle avant que son contenu ne le
          dise.

          Écart à `docs/06` §5 sur le repli seul, consigné dans
          `JOURNAL-TECHNIQUE.md`. */}
      <SectionHeader
        title="Journal"
        note="Qui a modifié quoi, et quand. Une information de contrôle, pas de compréhension."
      />

      {events.length > 0 ? (
        /* Une liste **ordonnée** : l'ordre est l'information — du plus récent
           au plus ancien —, là où les ressources et les pistes sont des `ul`
           dont l'ordre n'est qu'un tri d'affichage. */
        <ol role="list" className="flex flex-col gap-3">
          {events.map((event) => (
            <li key={event.id}>
              <p className="text-sm text-content-neutral-darkest">
                {event.summary}
              </p>

              {/* Les deux libellés sont portés en propre pour l'assistance :
                  hors du contexte visuel, « Camille Roux · 27 août 2026 » ne
                  dit pas lequel des deux est l'acteur. C'est la règle du bloc
                  « Ressources », et le `·` est décoratif comme le sien.

                  Il garde la couleur du texte qu'il sépare, même règle et même
                  raison qu'en T4bis.5 : les deux côtés ont exactement la même
                  graisse et la même taille, et un séparateur plus pâle entre
                  eux laisserait lire « Camille Roux 27 août 2026 ».

                  **Aucun couple de couleurs neuf par la position** :
                  `content-neutral-base` sur `surface-neutral-pale` — le fond
                  de `Section` — est le couple mesuré à 4,98:1 pour la ligne
                  « Type · Activité » d'une ressource, et
                  `content-neutral-darkest` est celui de tout titre de bloc sur
                  cette même surface. */}
              <p className="mt-1 text-xs text-content-neutral-base">
                <span className="sr-only">Par : </span>
                {/* **Un acteur nul se lit, il ne disparaît pas.** `actor_id`
                    est nullable — une écriture sans personne courante, un
                    acteur effacé — et la jointure filtrée rend le même `null`
                    pour une personne d'un autre domaine. « par l'amorçage »
                    dit ce que la ligne sait, plutôt que de laisser un vide
                    qu'on lirait comme un défaut de rendu. */}
                {event.actorName ?? "l'amorçage"}
                <span aria-hidden="true">{" · "}</span>
                <span className="sr-only">Le : </span>
                {formatEventDay(event.occurredAt)}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        /* **L'état vide est le premier rendu de tous les projets existants** :
           le journal démarre vide, et aucun rattrapage rétroactif n'a été
           écrit — reconstituer des événements depuis `created_at` serait
           inventer un acteur et une phrase que personne n'a produits
           (découpage de C6).

           C'est un `BlockNote` et non un `EmptyState` : le bloc a déjà son
           en-tête, donc pas de titre à redonner à son quart vide, et il n'a
           aucun geste à proposer — on n'écrit pas dans le journal.

           **La phrase a changé le 28/08/2026, parce que sa jumelle est
           remontée.** Elle était celle qui annonçait le bloc dans
           `REFERENCE_BLOCKS` — « qui a modifié quoi, et quand » —, et cette
           phrase-là est devenue la `note` de l'en-tête, où elle dit à quoi le
           bloc répond. La redire trente pixels plus bas aurait fait deux fois
           la même. Ce qui reste ici dit l'**attente** : ce qui viendra s'y
           inscrire, et rien qui ne soit déjà vrai du modèle. */
        <BlockNote>
          Aucune écriture n&apos;a encore été tracée sur cet accompagnement.
          Les corrections, archivages et rétablissements viendront s&apos;y
          inscrire, avec leur auteur et leur date.
        </BlockNote>
      )}
    </Section>
  );
}
