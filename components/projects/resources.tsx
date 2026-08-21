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
 * l'appelant qui les lit, la règle de `Roadmap` et de `PageHeader`. `editHref`
 * et `archiveResource` (T4bis.5) suivent la même règle pour les deux gestes de
 * chaque entrée : chez qui ne peut pas écrire — et sur un accompagnement
 * archivé —, le bloc se lit et ne se corrige nulle part.
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
 * **Chaque entrée est une carte** depuis la reprise de
 * `docs/design/maquettes/blocs/project-v2` (20/08/2026) — un filet, un rayon —
 * là où le bloc empilait des lignes séparées d'un trait. Le bloc a quitté le
 * corps de la page pour le **rail droit**, où une carte se lit mieux qu'une
 * ligne : la colonne est étroite, et un titre long y court sur deux lignes sans
 * qu'un trait dise où finit une ressource et où commence la suivante.
 *
 * L'état vide est un paragraphe et non un `EmptyState` : le bloc occupe une
 * colonne étroite, où le cadre tireté d'`EmptyState` et son
 * `px-8 py-11` ne tiennent pas. Le motif d'origine était aussi son `h2`, qui
 * faisait doublon sous celui de la section ; ce n'en est plus un — `EmptyState`
 * prend un `level` depuis TD.1 —, et le premier motif suffit. Il dit ce que le
 * bloc contiendra : un projet sans ressource est un projet normal, pas une page
 * incomplète (`docs/06` §5).
 *
 * Le composant ne lit aucune base : `resources` est ce que
 * `listProjectResources` a déjà lu, filtré et trié.
 */

import { DrawerLink } from "@/components/ui/drawer";

import { ACTION_LINK } from "@/components/ui/action-link";
import { BlockNote } from "@/components/ui/empty-state";
import { ExternalLink } from "@/components/ui/external-link";
import { Section, SectionHeader } from "@/components/ui/section";
import { formatResourceType } from "@/lib/format";
import type { ProjectResource } from "@/lib/queries/resources";

export function Resources({
  resources,
  addHref,
  editHref,
  archiveResource,
}: {
  resources: ProjectResource[];
  /** L'ouverture du panneau, ou `null` pour qui ne peut pas écrire (D9). */
  addHref: string | null;
  /**
   * L'ouverture du panneau sur une ressource donnée (T4bis.5), ou `null` pour
   * qui ne peut pas écrire — la même règle que `addHref`, et le composant ne lit
   * toujours aucun droit.
   */
  editHref: ((resourceId: string) => string) | null;
  /**
   * Le retrait d'une ressource (T4bis.5) — l'action serveur **déjà liée au
   * projet** côté serveur, à lier à la ressource au moment du rendu. Même règle
   * de droit que les deux précédentes.
   */
  archiveResource: ((resourceId: string) => Promise<void>) | null;
}) {
  return (
    <Section id="ressources">
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
        <ul role="list" className="flex flex-col gap-3">
          {resources.map((resource) => (
            <li
              key={resource.id}
              className="rounded-xl border border-surface-neutral-lighter p-4"
            >
              <ExternalLink
                href={resource.url}
                className="text-sm font-semibold text-content-info-base underline"
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

              {/* Les deux gestes de T4bis.5, sous la ligne de description et
                  jamais à droite du titre : le bloc vit dans un rail de 380 px,
                  et une colonne d'actions y écraserait le titre.

                  Le nom accessible porte le titre de la ressource, comme celui
                  de « Modifier » dans la roadmap : « Modifier » répété dix fois
                  dans une liste de liens ne dit pas laquelle. Le mot reste
                  écrit à l'écran — l'`aria-label` complète, il ne remplace pas.

                  « Archiver » est un formulaire nu : ni confirmation
                  (arbitrage (c) de `tickets-C4bis.md` — elle ne protégerait
                  rien ici, et `docs/06` §9 la proscrit là où elle ne protège
                  pas), ni motif. Le mot est celui de l'arbitrage (d), jamais
                  « Supprimer » : rien n'est supprimé (règle 4). */}
              {/* Un `div` et non un `p` : `<form>` est du contenu de flux, et
                  un paragraphe n'accepte que du phrasé — le balisage servi
                  serait réécrit par le navigateur, et l'hydratation
                  divergerait. */}
              {editHref || archiveResource ? (
                <div className="mt-3 flex flex-wrap items-center justify-end gap-4">
                  {editHref ? (
                    <DrawerLink
                      href={editHref(resource.id)}
                      request={{ kind: "resource", id: resource.id }}
                      aria-label={`Modifier la ressource ${resource.title}`}
                      className={ACTION_LINK}
                    >
                      Modifier
                    </DrawerLink>
                  ) : null}
                  {archiveResource ? (
                    <form action={archiveResource.bind(null, resource.id)}>
                      <button
                        type="submit"
                        aria-label={`Archiver la ressource ${resource.title}`}
                        className={ACTION_LINK}
                      >
                        Archiver
                      </button>
                    </form>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-start gap-4">
          <BlockNote>
            Les liens vers les documents de l&apos;accompagnement
            s&apos;afficheront ici, avec leur type et l&apos;activité qui les a
            produits. Vision n&apos;héberge aucun fichier : elle renvoie vers
            l&apos;outil qui le porte.
          </BlockNote>
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
    <DrawerLink
      href={href}
      request={{ kind: "resource" }}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${className}`}
    >
      <span aria-hidden="true">+</span>
      Relier une ressource
    </DrawerLink>
  );
}
