/**
 * Le bloc « Démarrage » — ce qu'un designer peut envisager pour ouvrir cet
 * accompagnement (20/08/2026).
 *
 * **Une invitation, jamais une prescription.** La page dit ce qui a été fait —
 * roadmap, ressources, indicateurs — et ne disait nulle part ce qu'on **peut**
 * faire. Ce bloc pose une boîte à outils : « voici ce que tu peux envisager »,
 * et un accès direct à la plateforme quand une piste paraît pertinente. Aucune
 * piste n'est recommandée plutôt qu'une autre, aucune n'est marquée comme faite
 * ou à faire : ce serait la jauge de complétion que `docs/06` §10 proscrit, et
 * l'indice calculé par Vision que D39 interdit.
 *
 * **La liste est la même sur tous les accompagnements** — c'est un référentiel
 * du domaine (arbitrage du 20/08/2026). Rien ici ne regarde le projet, donc
 * rien ne peut lui reprocher ce qu'il n'a pas fait.
 *
 * **Le bloc ne se rend plus que sur un accompagnement sans activité**
 * (28/08/2026, hors ticket et à la demande) : il dit ce qu'on **peut** faire, et
 * la question ne se pose plus une fois l'accompagnement ouvert. **La condition
 * vit dans la page, pas ici** — c'est ce qui permet à la phrase du dessus de
 * rester vraie : le composant ne connaît toujours rien du projet, il ne sait
 * même pas qu'il a une raison de disparaître. Ce qui s'efface est le bloc,
 * jamais la piste : `?piste=<id>` ouvre encore son panneau, et c'est par là que
 * le geste d'ajout d'une activité viendra le rouvrir.
 *
 * **Le bloc se place avant « Ressources », et c'est un écart assumé.**
 * `docs/06` §5 donne une liste close de blocs de référence, ordonnée par
 * fréquence de consultation, où « Démarrage » ne figure pas. La roadmap garde
 * sa position dominante — D31 tient sur l'essentiel —, c'est l'ordre **interne**
 * des blocs de référence qui cède : un point de départ qui se lirait en
 * cinquième position n'en serait plus un. Consigné dans `JOURNAL-TECHNIQUE.md`.
 *
 * **Le nom de l'outil est un lien sortant marqué** (`ExternalLink`,
 * `docs/06` §8) : chevron, mention pour l'assistance, nouvel onglet — partir
 * consulter Ergonome ne doit pas coûter l'accompagnement ouvert. Il pointe la
 * **racine** de l'outil, jamais une adresse construite avec l'identifiant du
 * projet : ce serait le « niveau 2 — lancement délégué » que `docs/03` §5 et
 * D15 rangent après le POC.
 *
 * **Le composant ne reçoit aucun droit, et il n'en a pas à connaître** — c'est
 * le seul bloc de cette page dans ce cas. Il n'y a rien à écrire ici : une
 * piste se lit par tout le domaine (D9), et son référentiel a son écran de
 * gestion en C7 (D25).
 *
 * **Le bloc passe en cartes** (20/08/2026, maquette `project-v2`) : une grille
 * de deux colonnes au lieu d'une liste de lignes. C'est la forme qui dit ce
 * qu'il est — une boîte à outils où l'on choisit, non une suite d'éléments à
 * parcourir dans l'ordre. Aucune carte n'est mise en avant, aucune n'est
 * marquée comme faite : ce serait la jauge de complétion que `docs/06` §10
 * proscrit.
 *
 * L'état vide est un paragraphe et non un `EmptyState` : la règle écrite en
 * tête de `resources.tsx`.
 *
 * Le composant ne lit aucune base : `starters` est ce que `listStarters` a déjà
 * lu, filtré et trié.
 */

import { ACTION_LINK } from "@/components/ui/action-link";
import { DrawerLink } from "@/components/ui/drawer";
import { BlockNote } from "@/components/ui/empty-state";
import { ExternalLink } from "@/components/ui/external-link";
import { Section, SectionHeader } from "@/components/ui/section";
import { Tag } from "@/components/ui/tag";
import { formatStarterKind } from "@/lib/format";
import type { DomainStarter } from "@/lib/queries/starters";

export function Starters({
  starters,
  detailHref,
}: {
  starters: DomainStarter[];
  /**
   * L'ouverture du panneau sur une piste. **Jamais nul** : la lecture est
   * ouverte à tout le domaine (D9), et ce bloc ne porte aucun geste d'écriture
   * dont le droit pourrait manquer.
   */
  detailHref: (starterId: string) => string;
}) {
  return (
    <Section id="demarrage">
      <SectionHeader
        title="Démarrage"
        note="Des pistes pour ouvrir cet accompagnement. Rien n'est imposé."
      />

      {starters.length > 0 ? (
        /* Deux colonnes au-delà du pli étroit, une en dessous. La maquette
           écrit `repeat(auto-fill, minmax(280px, 1fr))` ; le point d'arrêt le
           rend sans valeur arbitraire, et la colonne de gauche de cette page
           n'en porte jamais plus de deux à sa largeur utile. */
        <ul role="list" className="grid gap-3 sm:grid-cols-2">
          {starters.map((starter) => (
            <li
              key={starter.id}
              className="flex h-full flex-col rounded-xl border border-surface-neutral-lighter p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-content-neutral-darkest">
                  {starter.label}
                </span>
                {/* La nature est une **étiquette, jamais un rang** : rien ne
                    trie les pistes par elle, et le référentiel les mélange. */}
                <Tag label={formatStarterKind(starter.kind)} />
              </div>

              <p className="mt-2 mb-3 flex-1 text-xs leading-175 text-content-neutral-base">
                {starter.summary}
              </p>

              <div className="flex flex-wrap items-center gap-4">
                {/* Le nom accessible porte le libellé de la piste : « En savoir
                    plus » répété quatre fois dans une liste de liens ne dit pas
                    sur quoi. Le mot reste écrit à l'écran — l'`aria-label`
                    complète, il ne remplace pas. La règle de `resources.tsx`. */}
                <DrawerLink
                  href={detailHref(starter.id)}
                  request={{ kind: "starter", id: starter.id }}
                  aria-label={`En savoir plus sur la piste ${starter.label}`}
                  className={ACTION_LINK}
                >
                  En savoir plus
                </DrawerLink>

                {/* Le lien n'existe que si l'outil en a un. Une piste sans
                    plateforme — une méthode —, ou dont la plateforme n'a pas
                    encore d'adresse, rend sa carte sans lien : c'est un état
                    normal, pas une erreur (règle 5). */}
                {starter.toolName && starter.toolUrl ? (
                  <ExternalLink
                    href={starter.toolUrl}
                    className="text-xs font-medium text-content-info-base underline"
                  >
                    {starter.toolName}
                  </ExternalLink>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <BlockNote>
          Les pistes de démarrage du domaine s&apos;afficheront ici, avec un
          accès direct à la plateforme concernée. Elles se posent au référentiel,
          une par ligne.
        </BlockNote>
      )}
    </Section>
  );
}
