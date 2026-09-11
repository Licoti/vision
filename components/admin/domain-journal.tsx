/**
 * Le bloc « Journal de l'administration » — ce qu'on a fait **d'une** entreprise
 * cliente (T12.3).
 *
 * **C'est la seconde moitié de la question de l'écran.** La fiche répond à *« où
 * en est cette entreprise, et qu'a-t-on fait sur elle ? »* ; les trois premiers
 * blocs disent *où elle en est*, celui-ci dit *ce qu'on lui a fait*. Sans lui,
 * l'écran ne se justifierait pas au regard de `docs/06` §2 — la liste dit déjà
 * presque tout le reste.
 *
 * **Ses lignes viennent de `domain_events`, jamais d'`events`** (T12.1). Les
 * deux journaux ne se mélangent pas : celui-ci porte ce qui est écrit
 * *au-dessus* d'un domaine — créer, suspendre, archiver, désigner —, et il ne
 * descend pas dans le flux d'accueil de l'entreprise (arbitrage (3) de
 * `tickets-C12.md`). C'est aussi pourquoi **aucun écran du produit ne le lit**.
 *
 * **Ouvert, non replié**, et c'est l'écart avec le bloc « Journal » de la page
 * projet : le journal d'un accompagnement est *« une information de contrôle,
 * pas de compréhension »* (`docs/06` §5) et se replie pour cette raison ;
 * celui-ci **est la réponse à la question de l'écran**, comme le flux de la vue
 * d'ensemble. Rien à ouvrir pour le lire.
 *
 * **La ligne est celle du flux de la vue d'ensemble, l'origine en moins.** Là-bas
 * chaque ligne doit dire *d'où* elle vient, le flux traversant tous les
 * accompagnements ; ici toutes les lignes ont la même origine — l'entreprise que
 * la fiche nomme —, et la répéter à chaque ligne ferait un bloc qui redit trente
 * fois son propre titre.
 *
 * **Aucun décompte, nulle part.** Ni sur l'en-tête, ni en pied. Compter les
 * gestes faits sur une entreprise serait exactement l'indice calculé que D39
 * refuse — et il qualifierait une entreprise, ce que les interdits communs de
 * C12 proscrivent nommément. **Le plafond est un nombre écrit dans la couche**
 * (`DOMAIN_EVENTS_LIMIT`) ; il ne s'annonce pas.
 *
 * **Le journal n'est pas un historique** (D22) : chaque ligne dit la phrase
 * figée à l'écriture, son acteur et sa date. Ni valeur avant, ni valeur après,
 * aucun diff, aucune restauration — **et aucun lien vers l'objet touché** : une
 * identité vérifiée retirée n'a pas de page, et un lien qui mène à rien est pire
 * qu'une absence (`docs/06` §9).
 *
 * **Aucun droit ne se lit ici, et il n'y en a aucun à lire** : le bloc ne
 * s'écrit pas, et la page qui le rend a déjà prouvé l'autorité avant de lire.
 *
 * Le composant **ne lit aucune base** : `events` est ce que `listDomainEvents` a
 * déjà lu, joint, trié et plafonné.
 */

import { BlockNote } from "@/components/ui/empty-state";
import { Section, SectionHeader } from "@/components/ui/section";
import type { DomainEventRow } from "@/lib/db/scoped";
import { formatEventDay } from "@/lib/format";

export function DomainJournal({ events }: { events: DomainEventRow[] }) {
  return (
    <Section>
      <SectionHeader
        title="Journal de l'administration"
        note="Ce qui a été fait de cette entreprise, du plus récent au plus ancien."
      />

      {events.length > 0 ? (
        /* Une liste **ordonnée** : l'ordre est l'information — du plus récent au
           plus ancien —, là où les identités vérifiées sont un `ul` dont l'ordre
           n'est qu'un tri d'affichage. C'est la règle du bloc « Journal » et du
           flux de la vue d'ensemble, et la même raison. */
        <ol role="list" className="flex flex-col gap-3">
          {events.map((event) => (
            <li key={event.id}>
              {/* **`break-words`** : une phrase de journal porte des noms
                  saisis — celui d'une entreprise, celui d'une identité
                  vérifiée — dont aucun ne promet un espace où couper. T7.6 ne
                  repassera pas sur cet écran. */}
              <p className="break-words text-sm text-content-neutral-darkest">
                {event.summary}
              </p>

              {/* Les deux libellés sont portés en propre pour l'assistance :
                  hors du contexte visuel, « Camille Roux · 11 septembre 2026 »
                  ne dit pas lequel des deux est l'acteur. C'est la règle du bloc
                  « Ressources », reprise par le bloc « Journal » et par le flux
                  de la vue d'ensemble, et le `·` est décoratif comme le sien —
                  il garde la couleur du texte qu'il sépare, les deux côtés ayant
                  exactement la même taille.

                  **Aucun couple de couleurs neuf par la position** :
                  `content-neutral-base` sur `surface-neutral-pale` — le fond de
                  `Section` — est le couple du flux de la vue d'ensemble et du
                  bloc « Journal », et `content-neutral-darkest` celui de leur
                  phrase. */}
              <p className="mt-1 text-xs text-content-neutral-base">
                {/* **Un acteur nul se lit, il ne disparaît pas**, et ici il dit
                    quelque chose de précis : `super_admin_id` est nul quand
                    l'écriture vient de **l'intérieur** du domaine — la
                    correction des informations par son responsable (T12.2). Le
                    nom de cette personne ne paraît pas, et ce n'est pas une
                    perte de donnée : le nommer obligerait à lire une ligne
                    `persons` d'en haut, ce que cet écran refuse (arbitrage (b)
                    de `tickets-C12.md`). */}
                <span className="sr-only">Par : </span>
                {event.actorName ?? "depuis le domaine"}

                <span aria-hidden="true">{" · "}</span>
                <span className="sr-only">Le : </span>
                {formatEventDay(event.occurredAt)}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        /* **L'état vide est le premier rendu de toute entreprise créée avant
           C12** : le journal démarre vide, et aucun rattrapage rétroactif n'a
           été écrit — reconstituer des gestes depuis `created_at` serait
           inventer une phrase et une autorité que personne n'a produites. C'est
           le raisonnement de C6, resservi un niveau plus haut.

           **Celui-ci s'atteint par un jeu de données**, à la différence des
           quatre que T7.8 a dû déclarer inatteignables : toute entreprise
           antérieure au 11/09/2026 le rend.

           C'est un `BlockNote` et non un `EmptyState` : le bloc a déjà son
           en-tête, donc pas de titre à redonner à son quart vide, et il n'a
           **aucun geste** à proposer — on n'écrit pas dans un journal, il se
           remplit des gestes faits ailleurs. */
        <BlockNote>
          Les gestes faits sur cette entreprise s&apos;afficheront ici, du plus
          récent au plus ancien, avec leur auteur et leur date. Une entreprise
          créée avant la mise en place de ce journal n&apos;en porte aucun.
        </BlockNote>
      )}
    </Section>
  );
}
