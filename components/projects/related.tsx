/**
 * Le bloc « Projets liés » — les voisins du projet consulté, des deux natures.
 *
 * `docs/06` §5 le pose entre « Indicateurs » et « Budget », et le décrit en une
 * phrase : *« Liens déduits d'abord — même produit en tête —, puis liens
 * déclarés avec leur raison. »* T6.4 a livré la première moitié ; **T6.5 livre
 * la seconde, et le bloc porte enfin ce que le document lui promettait.**
 *
 * **Les deux natures se lisent ensemble et ne se confondent pas**, et c'est ce
 * que les deux intertitres tiennent. Un lien **déduit** est un calcul, refait à
 * chaque affichage, donc toujours vrai, et sa raison est composée par Vision :
 * « Même produit », « Camille Roux et Sofia Marchand en commun ». Un lien
 * **déclaré** est une phrase que quelqu'un a écrite, pour dire ce que le calcul
 * ne peut pas voir — la réutilisation (`docs/02` §7). Sans les nommer, les deux
 * raisons se liraient à l'identique et le lecteur croirait Vision auteur d'une
 * phrase qu'un collègue a tapée.
 *
 * **Chaque ligne dit un fait, jamais un indice.** La force qui ordonne les
 * déduits ne s'écrit nulle part : ni rang, ni pastille de proximité, ni « 3
 * points communs ». C'est la frontière de D39 appliquée à un lien — ce qui se
 * montre est le fait qui rapproche, pas l'indice qui le résume.
 *
 * **Aucun graphe, aucune carte de relations** (`docs/05` §4 : *sans valeur à
 * quinze projets*). Aucun classement, aucun décompte.
 *
 * **Le droit n'entre que par la moitié déclarée.** Les liens déduits ne
 * s'écrivent pas — rien n'est stocké —, et la lecture des deux moitiés est
 * ouverte à tout le domaine (D9), archivé compris. Ce que `canWrite` ferme est
 * la déclaration et le retrait, et le composant ne lit aucun droit : il reçoit
 * des points d'entrée nuls ou non, comme les cinq blocs qui le précèdent.
 *
 * **Le retrait n'est proposé que sur les liens sortants** — arbitrage (g) de
 * `tickets-C6.md` : la lecture est symétrique, l'écriture ne l'est pas. Un lien
 * entrant se lit ici et se retire là-bas. Ce n'est pas ce rendu qui protège :
 * `openLink` refuse le lien **reçu** qui ne part pas de ce projet.
 *
 * Le composant ne lit aucune base : `related` et `declared` sont ce que
 * `listRelatedProjects` et `listDeclaredLinks` ont déjà lu, rapproché et trié.
 */

import type { ReactNode } from "react";
import Link from "next/link";

import { ACTION_LINK } from "@/components/ui/action-link";
import { buttonClass, ButtonIcon, type ButtonVariant } from "@/components/ui/button";
import { DrawerLink } from "@/components/ui/drawer";
import { BlockNote } from "@/components/ui/empty-state";
import { Section, SectionHeader } from "@/components/ui/section";
import { StatusPill } from "@/components/ui/status-pill";
import { formatPeriod } from "@/lib/format";
import { ROUTES } from "@/lib/navigation";
import type { DeclaredLink, RelatedProject } from "@/lib/queries/links";

export function RelatedProjects({
  related,
  declared,
  addHref,
  editHref,
  removeProjectLink,
}: {
  related: RelatedProject[];
  declared: DeclaredLink[];
  /**
   * Le point d'entrée de la déclaration, ou `null` pour qui ne peut pas écrire
   * dans cet accompagnement (D9) — et pour tout le monde s'il est archivé
   * (T4bis.3). Le composant ne lit aucun droit.
   */
  addHref: string | null;
  editHref: ((linkId: string) => string) | null;
  removeProjectLink: ((linkId: string) => Promise<void>) | null;
}) {
  const empty = related.length === 0 && declared.length === 0;

  return (
    <Section id="projets-lies">
      <SectionHeader
        title="Projets liés"
        {...(addHref ? { action: <DeclareLink href={addHref} variant="secondary" /> } : {})}
      />

      {related.length > 0 ? (
        <div className="flex flex-col gap-3">
          {/* L'intertitre n'apparaît que si la liste existe : un titre au-dessus
              de rien annoncerait un vide au lieu de l'éviter. Rang `h3` — il
              vient sous le `h2` du bloc, et la hiérarchie des titres est
              vérifiée en audit (`docs/06` §11). */}
          <ListHeading>Liens déduits</ListHeading>

          {/* Une liste **ordonnée** : l'ordre est l'information — de la règle la
              plus forte à la plus faible —, là où les ressources sont une `ul`
              dont l'ordre n'est qu'un tri d'affichage. C'est la règle du bloc
              « Journal », et la même raison. */}
          <ol role="list" className="flex flex-col gap-3">
            {related.map((project) => (
              <li key={project.id}>
                <LinkedProject
                  href={ROUTES.project(project.id)}
                  name={project.name}
                  statusNature={project.statusNature}
                  statusLabel={project.statusLabel}
                  productName={project.productName}
                  startedOn={project.startedOn}
                  expectedEndOn={project.expectedEndOn}
                  reason={project.reason}
                />
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {declared.length > 0 ? (
        <div className="flex flex-col gap-3">
          <ListHeading>Liens déclarés</ListHeading>

          {/* Une `ul` et non une `ol` : l'ordre n'est ici qu'alphabétique, il ne
              porte rien. Rien ne classe deux liens déclarés — ils ont été
              écrits, pas mesurés. */}
          <ul role="list" className="flex flex-col gap-3">
            {declared.map((link) => (
              <li key={link.id}>
                <LinkedProject
                  href={ROUTES.project(link.projectId)}
                  name={link.name}
                  statusNature={link.statusNature}
                  statusLabel={link.statusLabel}
                  productName={link.productName}
                  startedOn={link.startedOn}
                  expectedEndOn={link.expectedEndOn}
                  reason={link.reason}
                >
                  {/* Les deux gestes ne se rendent que sur un lien **sortant**,
                      et seulement à qui peut écrire ici. Le lien entrant se lit
                      sans se toucher : c'est l'asymétrie assumée de (g), et le
                      lecteur atteint l'autre page d'un clic sur le nom. */}
                  {link.direction === "outgoing" && (editHref || removeProjectLink) ? (
                    <div className="mt-3 flex flex-wrap items-center justify-end gap-4">
                      {editHref ? (
                        <DrawerLink
                          href={editHref(link.id)}
                          request={{ kind: "link", id: link.id }}
                          aria-label={`Modifier le lien vers ${link.name}`}
                          className={ACTION_LINK}
                        >
                          Modifier
                        </DrawerLink>
                      ) : null}
                      {removeProjectLink ? (
                        <form action={removeProjectLink.bind(null, link.id)}>
                          <button
                            type="submit"
                            aria-label={`Retirer le lien vers ${link.name}`}
                            className={ACTION_LINK}
                          >
                            Retirer
                          </button>
                        </form>
                      ) : null}
                    </div>
                  ) : null}
                </LinkedProject>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {empty ? (
        /* L'état vide est un écran à part entière (règle 5) : un projet sans
           voisin est un projet normal. C'est un `BlockNote` et non un
           `EmptyState` — le bloc a déjà son en-tête, donc pas de titre à
           redonner à son quart vide.
           
           **Il porte désormais un geste**, à la différence de T6.4 : la moitié
           déclarée se saisit, et un état vide qui laisserait devant une impasse
           serait un état vide raté. Il ne le porte qu'à qui peut écrire — c'est
           `addHref` qui le dit, jamais ce composant. */
        <div className="flex flex-col items-start gap-4">
          <BlockNote>
            Les accompagnements voisins s&apos;afficheront ici, avec ce qui les
            rapproche : le produit, les personnes, l&apos;entité ou les
            approches. Ces liens-là se déduisent à chaque affichage. Un lien peut
            aussi se déclarer, pour dire ce que le calcul ne voit pas — une
            grille d&apos;entretien réutilisée, une leçon reprise.
          </BlockNote>
          {addHref ? <DeclareLink href={addHref} variant="primary" /> : null}
        </div>
      ) : null}
    </Section>
  );
}

/**
 * L'intertitre d'une des deux moitiés. Un `h3` : il vient sous le `h2` du bloc,
 * et la hiérarchie des titres est vérifiée en audit d'accessibilité
 * (`docs/06` §11).
 *
 * `content-neutral-dark` sur `surface-neutral-pale` — le fond de `Section` —,
 * couple déjà mesuré à 8,12:1 pour la note de `SectionHeader`.
 */
function ListHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase text-content-neutral-dark">
      {children}
    </h3>
  );
}

/**
 * Une ligne du bloc — la même carte pour les deux natures, et c'est voulu : ce
 * qui les distingue est l'intertitre au-dessus et la raison en dessous, jamais
 * la forme. Deux mises en page auraient laissé croire à deux rangs.
 *
 * `children` porte les gestes, que seule la moitié déclarée en a.
 */
function LinkedProject({
  href,
  name,
  statusNature,
  statusLabel,
  productName,
  startedOn,
  expectedEndOn,
  reason,
  children,
}: {
  href: string;
  name: string;
  statusNature: RelatedProject["statusNature"];
  statusLabel: string;
  productName: string;
  startedOn: string | null;
  expectedEndOn: string | null;
  /** `null` sur un lien déclaré sans raison : elle est parfaitement optionnelle. */
  reason: string | null;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-surface-neutral-lighter p-4">
      {/* Un lien **interne** : le voisin est une page de Vision, pas un outil
          externe — donc pas d'`ExternalLink` ni de marque de lien sortant
          (`docs/06` §8). */}
      <Link
        href={href}
        className="text-sm font-semibold text-content-info-base underline"
      >
        {name}
      </Link>

      {/* La situation du voisin, sur une ligne : son statut, son produit, sa
          période. Les libellés sont portés en propre pour l'assistance — hors
          du contexte visuel, « Espace client web · depuis février 2026 » ne dit
          pas lequel des deux est le produit. C'est la règle du bloc
          « Ressources ».

          Le `·` est décoratif et garde la couleur du texte qu'il sépare, même
          règle et même raison qu'en T4bis.5 : les deux côtés ont la même
          graisse et la même taille, et un séparateur plus pâle entre eux
          laisserait lire une seule suite de mots.

          **Aucun couple de couleurs neuf par la position** :
          `content-neutral-base` sur `surface-neutral-pale` — le fond de
          `Section` — est le couple mesuré à 4,98:1 pour la ligne « Type ·
          Activité » d'une ressource. */}
      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-content-neutral-base">
        <StatusPill nature={statusNature} label={statusLabel} />
        <span>
          <span className="sr-only">Produit : </span>
          {productName}
        </span>
        <span aria-hidden="true">·</span>
        <span>
          <span className="sr-only">Période : </span>
          {formatPeriod(startedOn, expectedEndOn)}
        </span>
      </p>

      {/* La raison, sur sa propre ligne : c'est elle qu'on vient lire, et elle
          ne se met pas en concurrence avec la situation. Sur un lien déduit,
          elle est **en toutes lettres** — « Même produit », « Camille Roux et
          Sofia Marchand en commun » — et ne porte jamais de chiffre ; sur un
          lien déclaré, c'est la phrase saisie, telle quelle.

          **Son absence se dit, elle ne se comble pas** : un lien déclaré sans
          raison est un lien valide (`docs/02` §7), et laisser la ligne muette
          ferait croire à une perte. Le ton plus pâle — `content-neutral-base`,
          4,98:1 — la distingue d'une raison écrite sans la cacher. */}
      <p className="mt-1 text-xs text-content-neutral-dark">
        <span className="sr-only">Lien : </span>
        {reason ?? (
          <span className="text-content-neutral-base">Aucune raison donnée</span>
        )}
      </p>

      {children}
    </div>
  );
}

/**
 * L'action d'ouverture du panneau, aux deux emplacements — la forme de
 * `LinkResource` dans `resources.tsx`, et pour la même raison.
 *
 * C'est un lien et non un bouton, parce que c'en est un : il mène à une URL,
 * celle de la page du projet portant `?lien=nouveau`. Il se copie, se partage,
 * s'ouvre dans un onglet — ce qu'un bouton d'ouverture piloté par du JavaScript
 * n'aurait fait dans aucun des trois cas.
 *
 * Le `+` est décoratif : « Déclarer un lien » se lit seul.
 */
function DeclareLink({
  href,
  variant,
}: {
  href: string;
  variant: ButtonVariant;
}) {
  return (
    <DrawerLink
      href={href}
      request={{ kind: "link" }}
      className={buttonClass({ variant })}
    >
      <ButtonIcon>+</ButtonIcon>
      Déclarer un lien
    </DrawerLink>
  );
}
