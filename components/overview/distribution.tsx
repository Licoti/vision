/**
 * Le bloc « Répartition » — `docs/06` §3 : *« combien de projets par statut,
 * par entité, par approche. Sous forme de chiffres et de filtres cliquables,
 * pas de graphiques décoratifs. »*
 *
 * **Il vit dans le rail depuis la reprise du 29/08/2026**, et ce n'est pas un
 * déplacement de confort : c'est ce qui referme la friction centrale de
 * l'écran. Posé pleine largeur, `justify-between` séparait « Cadrage » de
 * « 3 projets » de **1 104 px** — 1240 de `max-w-310`, moins les 80 de `px-10`
 * sur `main`, moins les 56 de `px-7` sur `Section`. Le rail de 320 px ramène
 * cet écart à la largeur d'une ligne, et le chiffre passe **devant** son
 * libellé, comme le fait la maquette de `docs/design/maquettes/vision.html`.
 *
 * **Aucun graphique, et c'est D33 qui le dit** : ce bloc n'a ni barre, ni
 * secteur, ni jauge. Un histogramme dirait la même chose en moins précis et en
 * moins cliquable — et sur cet écran, la comparaison visuelle des hauteurs
 * deviendrait vite la mesure du centre que `docs/06` §3 refuse. Ce qui se rend
 * est le nombre lui-même, porté par le lien qui va le vérifier.
 *
 * **Chaque chiffre est un lien, et le lien est le contrat.** Suivre
 * `/projets?statut=…` doit rendre exactement le nombre de lignes annoncé — c'est
 * ce que le décompte promet, et la seule preuve qu'il ne ment pas. La clé du
 * filtre vient de `lib/navigation.ts` et non d'ici : le chiffre et la liste
 * partagent une **seule** source, faute de quoi un renommage de clé laisserait
 * le bloc servir des liens qui ne filtrent plus rien.
 *
 * **Les trois dimensions du document depuis T7.2** — statut, entité, approche —
 * et dans son ordre. L'entité a manqué le temps d'un chantier, parce que la
 * fiche T6.7 avait tranché qu'*« un chiffre dont le filtre n'existe pas n'est
 * pas rendu »* : `/projets` n'avait aucune clé d'entité, et un chiffre sans son
 * lien est un nombre qui ne se vérifie pas. T7.2 a posé le filtre d'abord.
 *
 * **Il n'y a pas de quatrième dimension, et le métier n'en fera pas une.** Il a
 * gagné son filtre par le même ticket ; `docs/06` §3 nomme trois répartitions,
 * et une quatrième ne s'invente pas depuis la seule existence d'un filtre.
 *
 * **Un zéro se rend, et il s'écrit en toutes lettres.** « Aucun projet » est un
 * fait du domaine — un statut de son référentiel que personne n'emploie — et le
 * taire ferait lire la répartition comme si ce statut n'existait pas. Le lien
 * reste : `/projets` sait dire qu'il n'a rien trouvé, et c'est un écran à part
 * entière (règle 5).
 *
 * **Aucun total, aucune somme, aucun pourcentage** — pas même « 3 projets sur
 * 12 » (interdit de la fiche). Un projet portant deux approches compte dans les
 * deux : la somme des approches dépasse le nombre de projets, ce qui est le
 * comportement du filtre et n'a aucune raison d'être affiché.
 *
 * **Aucun droit ne se lit ici**, et il n'y en a aucun à lire : le bloc ne
 * s'écrit pas, et la lecture est ouverte à tout le domaine (D9).
 *
 * Le composant ne lit aucune base : les décomptes viennent de
 * `listProjectDistribution`, déjà comptés, filtrés et ordonnés.
 */

import Link from "next/link";
import type { ReactNode } from "react";

import { BlockNote } from "@/components/ui/empty-state";
import { Section, SectionHeader } from "@/components/ui/section";
import { StatusPill } from "@/components/ui/status-pill";
import { formatProjects } from "@/lib/format";
import { ROUTES } from "@/lib/navigation";
import type { ProjectDistribution } from "@/lib/queries/overview";

export function Distribution({
  distribution,
}: {
  distribution: ProjectDistribution;
}) {
  const { statuses, entities, approaches } = distribution;
  const hasAny =
    statuses.length > 0 || entities.length > 0 || approaches.length > 0;

  return (
    <Section>
      <SectionHeader
        title="Répartition"
        /* **La note ne redit plus les trois dimensions** (29/08/2026) : elle
           énumérait « par statut, par entité et par approche » juste au-dessus
           des trois `h3` qui portent ces mots-là. C'est le défaut que la
           reprise de la page projet a nommé — la note dit ce que le bloc est,
           elle ne récite pas son contenu — et il coûtait quatre lignes dans un
           rail de 320 px. Ce qui reste est ce que la note seule sait dire :
           que ces nombres sont des liens. */
        note="Chaque nombre ouvre la liste correspondante."
      />

      {hasAny ? (
        <div className="flex flex-col gap-5">
          {statuses.length > 0 ? (
            <Dimension title="Par statut">
              {statuses.map((entry) => (
                <Entry
                  key={entry.id}
                  href={ROUTES.projectsByStatus(entry.id)}
                  count={entry.count}
                >
                  {/* La pastille est celle de la liste transverse et de la
                      roadmap : le statut se lit partout de la même façon, et sa
                      nature porte la couleur. Aucun couple de couleurs neuf par
                      la position — `List` pose déjà la pastille sur
                      `surface-neutral-pale`, le fond de `Section`. */}
                  <StatusPill nature={entry.nature} label={entry.label} />
                </Entry>
              ))}
            </Dimension>
          ) : null}

          {entities.length > 0 ? (
            <Dimension title="Par entité">
              {entities.map((entry) => (
                <Entry
                  key={entry.id}
                  href={ROUTES.projectsByEntity(entry.id)}
                  count={entry.count}
                >
                  {/* Le libellé d'une entité se rend comme celui d'une
                      approche, dans le même bloc et sur le même fond : aucun
                      couple de couleurs neuf par la position, donc aucune
                      mesure de contraste à refaire. */}
                  <span className="text-sm font-semibold text-content-neutral-darkest">
                    {entry.label}
                  </span>
                </Entry>
              ))}
            </Dimension>
          ) : null}

          {approaches.length > 0 ? (
            <Dimension title="Par approche">
              {approaches.map((entry) => (
                <Entry
                  key={entry.id}
                  href={ROUTES.projectsByApproach(entry.id)}
                  count={entry.count}
                >
                  <span className="text-sm font-semibold text-content-neutral-darkest">
                    {entry.label}
                  </span>
                </Entry>
              ))}
            </Dimension>
          ) : null}
        </div>
      ) : (
        /* **Le référentiel vide, et non la liste vide** : ce bloc ne dépend pas
           des projets mais des statuts, des entités et des approches du
           domaine. Un domaine qui n'en porte aucun n'a rien à répartir — et
           T1.5 en sème.

           C'est un `BlockNote` et non un `EmptyState`, la règle du bloc voisin :
           le bloc a son en-tête, et il n'a **aucun geste** à proposer — un
           référentiel se tient en Administration, pas ici. */
        <BlockNote>
          Les statuts, les entités et les approches du domaine
          s&apos;afficheront ici, avec le nombre d&apos;accompagnements que
          chacun porte.
        </BlockNote>
      )}
    </Section>
  );
}

/**
 * Une dimension de la répartition — « Par statut », « Par entité », « Par
 * approche ».
 *
 * Le titre est un `h3` : il vient **sous** le `h2` de `SectionHeader`, et un
 * `h2` de plus en ferait un frère de ce qui le contient. La hiérarchie des
 * titres est vérifiée en audit d'accessibilité, et le centre en fait métier
 * (`docs/06` §11).
 *
 * Une `ul` et non une `ol` : l'ordre est celui du référentiel du domaine — sa
 * `position` —, un tri d'affichage et non une information. C'est l'inverse du
 * flux d'activité récente, dont l'ordre *est* le propos.
 */
function Dimension({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-2xs font-semibold text-content-neutral-dark uppercase">
        {title}
      </h3>
      <ul role="list" className="flex flex-col">
        {children}
      </ul>
    </div>
  );
}

/**
 * Un chiffre cliquable : le décompte à gauche, le libellé à sa droite, la ligne
 * entière étant la cible du clic.
 *
 * **Le chiffre est passé devant le 29/08/2026, et ce n'est pas une préférence
 * de dessin.** `justify-between` posait le décompte au bord opposé de la carte
 * — 1 104 px pleine largeur — et l'œil devait traverser un vide pour apparier
 * « Cadrage » et « 3 projets ». Le vide était en outre **cliquable sans rien
 * qui le signale** : la cible faisait toute la ligne, le soulignement une
 * fraction. En rapprochant les deux, l'inversion referme les deux défauts d'un
 * seul geste — il ne reste de cliquable hors du texte que la fin de ligne.
 *
 * **Aucune surface de survol n'a été posée, et c'est une mesure qui l'a
 * décidé.** `surface-neutral-lightest` sur le fond de carte donne **1,05:1**,
 * et le plus franc des `surface-neutral-*` plafonne à **2,22:1** : un état de
 * survol qu'on ne voit pas est pire qu'aucun. C'est le point ouvert d'`ETAT.md`
 * — *une carte ne se détache d'aucun fond* — rencontré une fois de plus, et
 * aucun neuvième substitut ne s'invente. Le clavier, lui, est servi :
 * `*:focus-visible` pose son contour dans `globals.css`.
 *
 * **La colonne du nombre est un minimum, pas une largeur.** `min-w-24` aligne
 * les libellés sur une même verticale tant que le décompte tient dedans, et
 * cède quand « Aucun projet » dépasse — plutôt que de tronquer le seul cas que
 * `formatProjects` écrit en toutes lettres.
 *
 * **Le nombre porte le lien, et pas seulement le libellé** : la fiche demande
 * *des chiffres cliquables qui filtrent*, et un chiffre qu'il faudrait viser à
 * côté de sa cible serait une affordance qui ne répond pas — le défaut que T6.3
 * a refermé sur « Voir le journal ».
 *
 * **Le soulignement porte la nature du lien sans la couleur** : un lien qui ne
 * se distinguerait que par sa teinte serait invisible à qui ne la perçoit pas
 * (`docs/06` §11). `content-info-base` souligné sur `surface-neutral-pale` est
 * le couple servi dans cette position depuis T4.1, repris par le flux voisin —
 * et l'inversion ne le change pas : elle déplace le mot, pas ses couleurs.
 *
 * **Zéro s'écrit « Aucun projet »**, par `formatProjects` — la fonction du
 * compteur de la liste transverse, celle-là même que le lien va rendre. Deux
 * façons d'écrire le même nombre finiraient par en dire deux choses.
 */
function Entry({
  href,
  count,
  children,
}: {
  href: string;
  count: number;
  children: ReactNode;
}) {
  return (
    /* Le filet sépare, il n'encadre pas : il se pose sur la ligne — seule à
       connaître son rang — et non sur le lien, qui est toujours le premier
       enfant du sien. */
    <li className="border-t border-surface-neutral-lighter first:border-t-0">
      {/* `items-baseline` et non `items-center` : dans 320 px, les deux plus
          longs libellés d'approche passent à la ligne, et le nombre doit rester
          aligné sur leur **première** ligne. La pastille de statut s'y range
          par la ligne de base de son propre texte, donc à la hauteur du
          nombre. */}
      <Link href={href} className="flex items-baseline gap-3 py-2">
        <span className="min-w-24 flex-none text-right text-sm font-semibold text-content-info-base underline">
          {formatProjects(count)}
        </span>
        {children}
      </Link>
    </li>
  );
}
