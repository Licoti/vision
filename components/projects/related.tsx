/**
 * Le bloc « Projets liés » — les voisins du projet consulté.
 *
 * `docs/06` §5 le pose entre « Indicateurs » et « Budget », et le décrit en une
 * phrase : *« Liens déduits d'abord — même produit en tête —, puis liens
 * déclarés avec leur raison. »* Ce bloc porte la première moitié ; la seconde
 * est la matière de T6.5.
 *
 * **Il revient au rendu, et il revient avec son contenu.** Il en était sorti le
 * 21/08/2026, à la demande, faute d'avoir quoi que ce soit à montrer : la
 * rangée des blocs annoncés était passée à deux cartes, puis à une seule quand
 * T6.3 a livré le journal. Ce qui avait disparu était l'annonce, pas la
 * destination — et un bloc qui porte son contenu n'annonce plus rien.
 *
 * **Chaque ligne dit un fait, jamais un indice.** La force qui ordonne la liste
 * ne s'écrit nulle part : ni rang, ni pastille de proximité, ni « 3 points
 * communs ». « 2 personnes en commun » se dit « Camille Roux et Sofia Marchand
 * en commun ». C'est la frontière de D39 appliquée à un lien — ce qui se montre
 * est le fait qui rapproche, pas l'indice qui le résume.
 *
 * **Aucun graphe, aucune carte de relations** (`docs/05` §4 : *sans valeur à
 * quinze projets*). Aucun classement, aucun décompte, aucune saisie.
 *
 * **Aucun droit ne lui est passé, et il n'y en a aucun à passer** : le bloc ne
 * s'écrit pas — rien n'est stocké, les liens se déduisent à l'affichage. C'est
 * le second bloc de cette page, avec « Journal », que `canWrite` ne touche pas.
 * La lecture est ouverte à tout le domaine (D9), et un accompagnement archivé
 * garde ses voisins comme il garde sa roadmap.
 *
 * Le composant ne lit aucune base : `related` est ce que `listRelatedProjects`
 * a déjà lu, rapproché et trié.
 */

import Link from "next/link";

import { BlockNote } from "@/components/ui/empty-state";
import { Section, SectionHeader } from "@/components/ui/section";
import { StatusPill } from "@/components/ui/status-pill";
import { formatPeriod } from "@/lib/format";
import { ROUTES } from "@/lib/navigation";
import type { RelatedProject } from "@/lib/queries/links";

export function RelatedProjects({ related }: { related: RelatedProject[] }) {
  return (
    <Section id="projets-lies">
      <SectionHeader title="Projets liés" />

      {related.length > 0 ? (
        /* Une liste **ordonnée** : l'ordre est l'information — de la règle la
           plus forte à la plus faible —, là où les ressources sont une `ul`
           dont l'ordre n'est qu'un tri d'affichage. C'est la règle du bloc
           « Journal », et la même raison. */
        <ol role="list" className="flex flex-col gap-3">
          {related.map((project) => (
            <li
              key={project.id}
              className="rounded-xl border border-surface-neutral-lighter p-4"
            >
              {/* Un lien **interne** : le voisin est une page de Vision, pas un
                  outil externe — donc pas d'`ExternalLink` ni de marque de lien
                  sortant (`docs/06` §8). */}
              <Link
                href={ROUTES.project(project.id)}
                className="text-sm font-semibold text-content-info-base underline"
              >
                {project.name}
              </Link>

              {/* La situation du voisin, sur une ligne : son statut, son
                  produit, sa période. Les libellés sont portés en propre pour
                  l'assistance — hors du contexte visuel, « Espace client web ·
                  depuis février 2026 » ne dit pas lequel des deux est le
                  produit. C'est la règle du bloc « Ressources ».

                  Le `·` est décoratif et garde la couleur du texte qu'il
                  sépare, même règle et même raison qu'en T4bis.5 : les deux
                  côtés ont la même graisse et la même taille, et un séparateur
                  plus pâle entre eux laisserait lire une seule suite de mots.

                  **Aucun couple de couleurs neuf par la position** :
                  `content-neutral-base` sur `surface-neutral-pale` — le fond de
                  `Section` — est le couple mesuré à 4,98:1 pour la ligne
                  « Type · Activité » d'une ressource. */}
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-content-neutral-base">
                <StatusPill
                  nature={project.statusNature}
                  label={project.statusLabel}
                />
                <span>
                  <span className="sr-only">Produit : </span>
                  {project.productName}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <span className="sr-only">Période : </span>
                  {formatPeriod(project.startedOn, project.expectedEndOn)}
                </span>
              </p>

              {/* La raison, sur sa propre ligne : c'est elle qu'on vient lire,
                  et elle ne se met pas en concurrence avec la situation. Elle
                  est **en toutes lettres** — « Même produit », « Camille Roux
                  et Sofia Marchand en commun » — et ne porte jamais de
                  chiffre. */}
              <p className="mt-1 text-xs text-content-neutral-dark">
                <span className="sr-only">Lien : </span>
                {project.reason}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        /* L'état vide est un écran à part entière (règle 5) : un projet sans
           voisin est un projet normal. C'est un `BlockNote` et non un
           `EmptyState` — le bloc a déjà son en-tête, donc pas de titre à
           redonner à son quart vide, et il n'a **aucun geste à proposer** :
           on ne saisit pas un lien déduit, on le constate.

           La phrase est **celle qui annonçait le bloc** dans
           `REFERENCE_BLOCKS` jusqu'au 21/08/2026, ramenée à ce que le bloc
           porte réellement : l'annonce devient l'attente, rien ne s'invente. */
        <BlockNote>
          Les accompagnements voisins s&apos;afficheront ici, avec ce qui les
          rapproche : le produit, les personnes, l&apos;entité ou les approches.
          Rien ne se saisit — ces liens se déduisent à chaque affichage.
        </BlockNote>
      )}
    </Section>
  );
}
