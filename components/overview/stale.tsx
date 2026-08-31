/**
 * Le bloc « Projets sans activité récente » — `docs/06` §3, qui le veut *« une
 * liste courte, factuelle, sans alerte ni badge »*.
 *
 * **Il ouvre la colonne du récit depuis le 29/08/2026**, le flux ayant pris sa
 * place en pied d'écran. Le bloc n'a pas bougé d'une classe : c'est la page qui
 * l'ordonne, et elle seule.
 *
 * **Il dit une date, il ne juge pas.** C'est l'arbitrage (h) de
 * `tickets-C6.md`, et c'est là que la règle coûte le plus cher : rien n'est
 * plus tentant, sur l'écran d'un responsable, qu'une pastille rouge au-delà de
 * trois mois. Le seuil d'un mois vient de `docs/05` §7, qui en fait le
 * *thermomètre de la fraîcheur* — Vision en retient le seuil et **jamais la
 * proportion** : un taux serait l'indice calculé que D39 interdit.
 *
 * Donc : aucun badge, aucune couleur d'alerte, aucune notification, aucune
 * relance, aucun rang affiché, aucun décompte. Ce qui se lit est un nom et une
 * date, en toutes lettres, et le lecteur juge.
 *
 * **Un projet qui n'a jamais eu d'activité y figure**, au même titre que les
 * autres et sans mention particulière : `last_activity_at` est nul, et « aucune
 * activité » est un fait, pas un retard. C'est souvent un accompagnement qui
 * vient d'être créé — raison de plus pour ne rien en conclure.
 *
 * **Un accompagnement terminé, lui, n'y figure plus** (31/08/2026, hors ticket
 * et à la demande). Son silence n'est pas un endormissement : c'est ce que son
 * statut annonce. Le lire comme un dormant était le seul contresens que ce bloc
 * pouvait produire — la liste dit ce qui **peut** encore bouger et ne bouge
 * pas. L'exclusion vit dans `listStaleProjects`, sur la `nature` du statut ;
 * rien ne se filtre ici, et le bloc n'affiche toujours ni statut ni badge.
 *
 * **La liste est ordonnée, du plus ancien au plus récent** : c'est un tri, pas
 * un classement (interdit de la fiche). Aucun numéro de rang ne se rend, aucune
 * comparaison entre deux lignes n'est proposée ; l'ordre existe parce qu'un
 * plafond doit décider qui entre, et un ordre qui varierait d'un affichage à
 * l'autre serait un défaut.
 *
 * **Aucun droit ne se lit ici** : le bloc ne s'écrit pas, et la lecture est
 * ouverte à tout le domaine (D9). Un projet qui dort n'est l'affaire de
 * personne en particulier.
 *
 * Le composant ne lit aucune base : `projects` vient de `listStaleProjects`,
 * déjà seuillé, trié et plafonné.
 */

import Link from "next/link";

import { BlockNote } from "@/components/ui/empty-state";
import { Section, SectionHeader } from "@/components/ui/section";
import { formatEventDay } from "@/lib/format";
import { ROUTES } from "@/lib/navigation";
import type { StaleProject } from "@/lib/queries/overview";

export function StaleProjects({ projects }: { projects: StaleProject[] }) {
  return (
    <Section>
      <SectionHeader
        title="Projets sans activité récente"
        /* **« en cours » dit l'exclusion sans nommer un statut** (31/08/2026) :
           la note doit rendre compte de ce que la liste ne montre pas, sinon
           l'absence d'un accompagnement terminé se lit comme un défaut. Elle
           reste une phrase de périmètre — ni décompte, ni proportion, ni
           jugement. */
        note="Les accompagnements en cours dont la dernière activité saisie remonte à plus d'un mois."
      />

      {projects.length > 0 ? (
        /* Une liste **ordonnée** : l'ordre est l'information — du plus ancien
           au plus récent —, comme dans le flux voisin et pour la même raison.
           Il ne se lit pas comme un rang : aucune ligne n'affiche sa position,
           et rien ne se compare d'une ligne à l'autre. */
        <ol role="list" className="flex flex-col gap-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={ROUTES.project(project.id)}
                className="text-sm font-semibold text-content-info-base underline"
              >
                {project.name}
              </Link>

              {/* Le libellé est porté en propre pour l'assistance, la règle du
                  bloc voisin : hors du contexte visuel, « aucune activité
                  depuis le 25 juillet 2026 » posé sous un nom de projet ne dit
                  pas de quoi il parle.

                  Aucun couple de couleurs neuf par la position :
                  `content-neutral-base` sur `surface-neutral-pale` est le
                  couple mesuré à 4,98:1 du bloc « Journal », et
                  `content-info-base` souligné celui du flux d'activité. */}
              <p className="mt-1 text-xs text-content-neutral-base">
                {/* **Jamais de badge, jamais de couleur** : la phrase dit le
                    fait, et le mot « aucune » suffit à distinguer le projet qui
                    n'a rien eu de celui qui n'a plus rien depuis une date. Deux
                    formes de phrase, une seule ligne de lecture. */}
                {project.lastActivityAt
                  ? `Aucune activité depuis le ${formatEventDay(project.lastActivityAt)}`
                  : "Aucune activité à ce jour"}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        /* **L'absence est ici la bonne nouvelle, et elle ne s'en félicite
           pas** : l'état vide dit un fait — tout a bougé le mois dernier —,
           sans « bravo » ni couleur de succès. Un état vide ne s'excuse pas et
           ne complimente pas davantage (`empty-state.tsx`).

           C'est un `BlockNote` et non un `EmptyState`, la règle du bloc voisin :
           le bloc a son en-tête, et il n'a **aucun geste** à proposer — on ne
           réveille pas un projet depuis la vue d'ensemble. */
        <BlockNote>
          Tous les accompagnements en cours ont reçu une activité au cours du
          dernier mois. Ceux qui s&apos;endormiraient s&apos;afficheraient ici,
          avec la date de leur dernière activité.
        </BlockNote>
      )}
    </Section>
  );
}
