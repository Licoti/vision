/**
 * Le bloc « Ressources » — le premier des blocs de référence de la page projet.
 *
 * `docs/06` §5 le place en tête du tableau des blocs, après la roadmap et
 * jamais avant : le récit domine, les références l'entourent. Il porte
 * **la section entière**, son en-tête compris — la forme de `Roadmap` depuis
 * T3.1. T4.2 tient la promesse écrite ici par T4.1 : « Relier une ressource »
 * est en tête du bloc *et* dans l'état vide, les deux emplacements vivent ici,
 * et la page n'a pas à connaître ce détail. En **tête**, jamais en pied
 * (`docs/06` §5).
 *
 * `addHref` à `null` retire les deux : l'action n'existe que pour qui peut
 * écrire dans ce projet (D9). Le composant, lui, ne connaît aucun droit — c'est
 * l'appelant qui les lit, la règle de `Roadmap` et de `PageHeader`.
 *
 * Chaque entrée dit trois choses et pas une de plus : son titre, son type en
 * toutes lettres, et l'activité qui l'a produite quand le rattachement est
 * renseigné — « ce second rattachement est ce qui transforme une liste de
 * fichiers en récit lisible » (`docs/02` §5).
 *
 * Le titre est un lien sortant marqué (`ExternalLink`, `docs/06` §8) : Vision
 * n'héberge aucun fichier, elle renvoie vers l'outil qui le porte. **Aucune
 * vignette, aucun aperçu, aucune icône de format** — la maquette place un carré
 * de 34 px portant les initiales du format ; il demanderait une valeur visuelle
 * que le design system ne nomme pas (règle 2), et la fiche de T4.1 l'écarte.
 *
 * L'état vide est un paragraphe et non un `EmptyState` : le bloc occupe une
 * demi-largeur de la grille, et `EmptyState` porte un `h2` qui ferait doublon
 * sous celui de la section. Il dit ce que le bloc contiendra — un projet sans
 * ressource est un projet normal, pas une page incomplète (`docs/06` §5).
 *
 * Le composant ne lit aucune base : `resources` est ce que
 * `listProjectResources` a déjà lu, filtré et trié.
 */

import Link from "next/link";

import { ExternalLink } from "@/components/ui/external-link";
import { Section, SectionHeader } from "@/components/ui/section";
import { formatResourceType } from "@/lib/format";
import type { ProjectResource } from "@/lib/queries/resources";

export function Resources({
  resources,
  addHref,
}: {
  resources: ProjectResource[];
  /** L'ouverture du panneau, ou `null` pour qui ne peut pas écrire (D9). */
  addHref: string | null;
}) {
  return (
    <Section>
      <SectionHeader
        title="Ressources"
        {...(addHref
          ? {
              action: (
                <LinkResource
                  href={addHref}
                  className="border border-content-neutral-normal bg-surface-neutral-pale text-content-primary-dark"
                />
              ),
            }
          : {})}
      />

      {resources.length > 0 ? (
        <ul role="list" className="flex flex-col">
          {resources.map((resource) => (
            <li
              key={resource.id}
              className="border-t border-surface-neutral-lighter py-3 first:border-t-0 first:pt-0 last:pb-0"
            >
              <ExternalLink
                href={resource.url}
                className="text-sm font-medium text-content-info-base underline"
              >
                {resource.title}
              </ExternalLink>

              {/* Les libellés sont portés en propre pour l'assistance : hors du
                  contexte visuel, « PowerPoint · Test utilisateur » ne dit pas
                  lequel des deux est le type. Le `·` est décoratif — la même
                  règle que sur la liste transverse depuis T2.3.

                  Il garde en revanche la couleur du texte qu'il sépare, là où
                  les trois écrans précédents l'écrivent en
                  `content-neutral-light` : ici les deux côtés ont exactement la
                  même graisse et la même taille, et un séparateur mesuré à
                  2,22:1 entre eux laisserait lire « PowerPoint Test
                  utilisateur ». Aucun couple neuf n'est introduit — c'est celui
                  du texte, à 4,98:1. */}
              <p className="mt-1 text-xs text-content-neutral-base">
                <span className="sr-only">Type : </span>
                {formatResourceType(resource.resourceType)}
                {resource.activityLabel ? (
                  <>
                    <span aria-hidden="true">{" · "}</span>
                    <span className="sr-only">Activité : </span>
                    {resource.activityLabel}
                  </>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-start gap-4">
          <p className="text-sm leading-175 text-content-neutral-base">
            Les liens vers les documents de l&apos;accompagnement
            s&apos;afficheront ici, avec leur type et l&apos;activité qui les a
            produits. Vision n&apos;héberge aucun fichier : elle renvoie vers
            l&apos;outil qui le porte.
          </p>
          {addHref ? (
            <LinkResource
              href={addHref}
              className="bg-surface-primary-base text-content-neutral-pale"
            />
          ) : null}
        </div>
      )}
    </Section>
  );
}

/**
 * L'action d'ouverture du panneau, aux deux emplacements — la forme
 * d'`AddActivity` dans `roadmap.tsx`, et pour la même raison.
 *
 * C'est un lien et non un bouton, parce que c'en est un : il mène à une URL,
 * celle de la page du projet portant `?ressource=nouvelle`. Il se copie, se
 * partage, s'ouvre dans un onglet — ce qu'un bouton d'ouverture piloté par du
 * JavaScript n'aurait fait dans aucun des trois cas.
 *
 * Le `+` est décoratif : « Relier une ressource » se lit seul.
 */
function LinkResource({
  href,
  className,
}: {
  href: string;
  className: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${className}`}
    >
      <span aria-hidden="true">+</span>
      Relier une ressource
    </Link>
  );
}
