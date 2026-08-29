/**
 * Le bloc « Activité récente » — `docs/06` §3, *« le seul endroit du produit
 * qui donne le sentiment que Vision est vivante »*.
 *
 * **Il ferme l'écran depuis le 29/08/2026, là où il l'ouvrait.** C'est un
 * **écart assumé à l'ordre de `docs/06` §3**, demandé par l'humain, et la
 * mesure le justifie : quinze événements font ≈ 900 px, et l'écran commençait
 * donc par son bloc le plus long — la répartition n'apparaissait qu'après. Le
 * document reste la référence sur *ce que* l'écran porte ; il a cédé sur
 * l'ordre. Aucune décision numérotée n'est rouverte : D33 et D41 tiennent.
 *
 * **Le bloc lui-même n'a pas bougé d'une classe.** Le flux garde sa liste
 * ordonnée, ses trois libellés portés en propre et ses interdits ; ce qui a
 * changé est l'endroit où la page le rend.
 *
 * **Ses lignes sont des événements, jamais des activités**, et c'est ici que
 * le piège de `docs/04` §4 coûte le plus cher. Le bloc porte le nom que
 * `docs/06` §3 lui donne ; ce qu'il liste vient d'`events` — la trace système,
 * « qui a modifié quoi, quand » — et non d'`activities`, qui est le fait
 * d'accompagnement daté : un atelier, un audit, une campagne de tests. Les deux
 * tables n'ont aucun rapport, et le mot « activité » ne descend pas de
 * l'en-tête jusqu'aux lignes.
 *
 * **La différence avec le bloc « Journal » de la page projet tient en deux
 * choses**, et le reste est identique par choix : ce flux traverse tous les
 * accompagnements, donc chaque ligne doit dire **d'où** elle vient ; et il est
 * ouvert, non replié — le journal d'un projet est *« une information de
 * contrôle, pas de compréhension »*, celui-ci est la réponse à la question de
 * l'écran.
 *
 * **Aucun décompte, nulle part.** Ni sur l'en-tête, ni en pied, ni un « voir
 * les suivants ». Compter les événements du domaine serait une mesure
 * d'activité du centre, que `docs/06` §3 refuse nommément sur l'écran que verra
 * un responsable, et que la fiche du ticket interdit. Le plafond est un nombre
 * écrit dans la requête ; il ne s'annonce pas.
 *
 * **Le journal n'est pas un historique** (D22) : chaque ligne dit la phrase
 * figée à l'écriture, son acteur, son origine et sa date. Ni valeur avant, ni
 * valeur après, aucun diff, aucune restauration, **et aucun lien vers l'objet
 * touché** — l'activité corrigée ou la ressource retirée dont une ligne parle
 * n'a pas de page, et un lien qui mène à rien est pire qu'une absence
 * (`docs/06` §9). Le lien de la ligne mène à l'**origine** — le projet ou le
 * produit —, qui, elle, existe toujours.
 *
 * **Aucun droit ne se lit ici, et il n'y en a aucun à lire** : le bloc ne
 * s'écrit pas. La lecture du journal est ouverte à tout le domaine (D9), et le
 * flux est le même pour qui n'écrit nulle part.
 *
 * Le composant ne lit aucune base : `events` est ce que `listRecentEvents` a
 * déjà lu, joint, trié et plafonné — la préséance entre le projet et le produit
 * y est déjà tranchée.
 */

import Link from "next/link";

import { BlockNote } from "@/components/ui/empty-state";
import { Section, SectionHeader } from "@/components/ui/section";
import { formatEventDay } from "@/lib/format";
import { ROUTES } from "@/lib/navigation";
import type { EventOrigin, RecentEvent } from "@/lib/queries/overview";

export function RecentActivity({ events }: { events: RecentEvent[] }) {
  return (
    <Section>
      <SectionHeader
        title="Activité récente"
        note="Les dernières saisies du centre, tous accompagnements confondus."
      />

      {events.length > 0 ? (
        /* Une liste **ordonnée** : l'ordre est l'information — du plus récent
           au plus ancien —, là où les ressources et les pistes sont des `ul`
           dont l'ordre n'est qu'un tri d'affichage. C'est la règle du bloc
           « Journal », et la même raison. */
        <ol role="list" className="flex flex-col gap-3">
          {events.map((event) => (
            <li key={event.id}>
              <p className="text-sm text-content-neutral-darkest">
                {event.summary}
              </p>

              {/* Les trois libellés sont portés en propre pour l'assistance :
                  hors du contexte visuel, « Camille Roux · Refonte du parcours
                  de virement · 27 août 2026 » ne dit pas lequel des trois est
                  l'acteur. C'est la règle du bloc « Ressources », reprise par
                  le bloc « Journal », et le `·` est décoratif comme le sien.

                  Il garde la couleur du texte qu'il sépare, même règle et même
                  raison qu'en T4bis.5 : les trois côtés ont exactement la même
                  taille, et un séparateur plus pâle laisserait lire une seule
                  suite de mots.

                  **Aucun couple de couleurs neuf par la position** :
                  `content-neutral-base` sur `surface-neutral-pale` — le fond de
                  `Section` — est le couple mesuré à 4,98:1 du bloc « Journal »,
                  et `content-neutral-darkest` celui de tout titre de bloc sur
                  cette même surface. */}
              <p className="mt-1 text-xs text-content-neutral-base">
                {/* **Un acteur nul se lit, il ne disparaît pas.** `actor_id`
                    est nullable — une écriture sans personne courante, un
                    acteur effacé — et la jointure filtrée rend le même `null`
                    pour une personne d'un autre domaine. « par l'amorçage » dit
                    ce que la ligne sait, plutôt que de laisser un vide qu'on
                    lirait comme un défaut de rendu. C'est le mot du bloc
                    « Journal », et il ne s'en écarte pas. */}
                <span className="sr-only">Par : </span>
                {event.actorName ?? "l'amorçage"}

                {/* **L'origine n'est rendue que si elle existe.** Elle manque
                    quand l'événement ne porte aucun rattachement, et quand
                    celui qu'il porte a été écarté par le filtre de domaine :
                    dans les deux cas la ligne se lit sans lien, plutôt que de
                    disparaître ou de mener nulle part. */}
                {event.origin ? (
                  <>
                    <span aria-hidden="true">{" · "}</span>
                    <span className="sr-only">Sur : </span>
                    <Origin origin={event.origin} />
                  </>
                ) : null}

                <span aria-hidden="true">{" · "}</span>
                <span className="sr-only">Le : </span>
                {formatEventDay(event.occurredAt)}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        /* **L'état vide est le premier rendu de tout domaine existant** : le
           journal démarre vide, et aucun rattrapage rétroactif n'a été écrit —
           reconstituer des événements depuis `created_at` serait inventer un
           acteur et une phrase que personne n'a produits (découpage de C6).

           C'est un `BlockNote` et non un `EmptyState` : le bloc a déjà son
           en-tête, donc pas de titre à redonner à son quart vide, et il n'a
           **aucun geste** à proposer — on n'écrit pas dans le journal, il se
           remplit des gestes faits ailleurs. C'est l'écart avec les autres
           états vides du produit, et il est dans la nature de l'objet. */
        <BlockNote>
          Les saisies du centre s&apos;afficheront ici, de la plus récente à la
          plus ancienne, avec leur auteur et l&apos;accompagnement ou le produit
          d&apos;où elles viennent. Ce flux se remplit des gestes faits sur les
          autres écrans.
        </BlockNote>
      )}
    </Section>
  );
}

/**
 * L'origine d'une ligne — le projet, ou le produit à défaut.
 *
 * **Un lien interne** : l'origine est une page de Vision, pas un outil externe
 * — donc pas d'`ExternalLink` ni de marque de lien sortant (`docs/06` §8).
 * L'écriture est celle du voisin de « Projets liés » et de la ressource, à la
 * taille près : `content-info-base` souligné sur `surface-neutral-pale`, couple
 * servi dans cette position depuis T4.1. Le soulignement porte la nature du
 * lien sans la couleur — un lien qui ne se distinguerait que par sa teinte
 * serait invisible à qui ne la perçoit pas (`docs/06` §11).
 *
 * **La nature de l'origine n'est pas dite à l'écran**, et c'est un choix : le
 * nom et l'adresse la disent déjà — `/projets/…` ou `/produits/…` —, et une
 * pastille « Produit » sur une ligne de flux ajouterait une taxonomie là où l'on
 * attend une phrase.
 */
function Origin({ origin }: { origin: EventOrigin }) {
  const href =
    origin.kind === "project"
      ? ROUTES.project(origin.id)
      : ROUTES.product(origin.id);

  return (
    <Link
      href={href}
      className="text-xs font-semibold text-content-info-base underline"
    >
      {origin.name}
    </Link>
  );
}
