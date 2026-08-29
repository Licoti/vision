/**
 * Le bloc « Journal » — le dernier bloc de référence de la page projet.
 *
 * `docs/06` §5 le pose en dernier et **replié** : *« c'est une information de
 * contrôle, pas de compréhension »*. Il sert à retrouver l'origine d'une
 * saisie, jamais à comprendre l'accompagnement — celui-ci se lit dans la
 * roadmap, en position dominante.
 *
 * **Le repli a été retiré le 28/08/2026, puis rétabli le 29** sur demande, et
 * l'aller-retour vaut d'être lu : l'argument du 28 — « son contenu tient en
 * quatre lignes, et un chevron de 10 px est un prix de découverte plus cher que
 * ce qu'il cache » — mesurait le coût du repli sur un journal **vide ou presque**.
 * Il ne le reste pas : chaque correction, chaque archivage y ajoute une ligne, et
 * c'est le bloc de la page dont la hauteur croît sans borne. `docs/06` §5 avait
 * donc raison de bout en bout, et le code lui revient. L'écart consigné le 28/08
 * dans `JOURNAL-TECHNIQUE.md` est refermé.
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
      {/* `group` porte le retournement du chevron : il vit sur le `<details>`,
          seule balise dont `group-open` puisse lire l'état.

          **Aucun `open`** : c'est l'absence de l'attribut qui replie, et le
          replié est l'état servi — le critère se lit donc dans le HTML, sans
          navigateur. `<details>` rend son contenu dans le document même fermé,
          à la différence d'un menu : le journal reste dans l'arbre, trouvable
          par la recherche du navigateur, et son repli ne le retire de rien. */}
      <details className="group">
        {/* **La note reste sur le `<summary>`** (29/08/2026), et c'est elle qui
            justifie le repli à qui le rencontre : « une information de
            contrôle, pas de compréhension » se lit **avant** d'ouvrir, ce qui
            est exactement le moment où l'on décide de ne pas ouvrir. Elle
            n'existait pas quand T6.3 a posé le repli ; elle le sert mieux
            qu'elle ne servait le bloc déplié. */}
        <SectionHeader
          /* Le chevron **remplace le triangle natif**, que `flex` retire à
             `<summary>` : il tourne d'un quart de tour à l'ouverture. Il est
             décoratif — `<summary>` expose déjà l'état à l'assistance, et la
             couleur ne porte jamais seule (`docs/06` §11). Repris
             d'`indicators.tsx`, où il a la même charge. */
          mark={
            <span className="inline-block text-2xs leading-none transition-transform group-open:rotate-90">
              ▶
            </span>
          }
          title="Journal"
          note="Qui a modifié quoi, et quand. Une information de contrôle, pas de compréhension."
          as="summary"
        />

        {/* **`mt-4` et non le `gap-4` de `Section`** : le `<details>` est
            désormais l'unique enfant du bloc, et une gouttière ne s'applique
            qu'entre frères. Sans lui, le contenu déplié collerait au
            `<summary>`. C'est la forme de T6.3, reprise telle quelle. */}
        {events.length > 0 ? (
          /* Une liste **ordonnée** : l'ordre est l'information — du plus récent
             au plus ancien —, là où les ressources et les pistes sont des `ul`
             dont l'ordre n'est qu'un tri d'affichage. */
          <ol role="list" className="mt-4 flex flex-col gap-3">
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
          <BlockNote className="mt-4">
            Aucune écriture n&apos;a encore été tracée sur cet accompagnement.
            Les corrections, archivages et rétablissements viendront s&apos;y
            inscrire, avec leur auteur et leur date.
          </BlockNote>
        )}
      </details>
    </Section>
  );
}
