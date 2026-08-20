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
 * L'état vide est un paragraphe et non un `EmptyState` : le bloc occupe une
 * demi-largeur de la grille, où le cadre tireté d'`EmptyState` ne tient pas —
 * la règle écrite en tête de `resources.tsx`.
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
    <Section>
      <SectionHeader
        title="Démarrage"
        note="Des pistes pour ouvrir cet accompagnement. Rien n'est imposé."
      />

      {starters.length > 0 ? (
        <ul role="list" className="flex flex-col">
          {starters.map((starter) => (
            <li
              key={starter.id}
              className="border-t border-surface-neutral-lighter py-3 first:border-t-0 first:pt-0 last:pb-0"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-content-neutral-darkest">
                  {starter.label}
                </span>
                {/* La nature est une **étiquette, jamais un rang** : rien ne
                    trie les pistes par elle, et le référentiel les mélange. */}
                <Tag label={formatStarterKind(starter.kind)} />
              </div>

              <p className="mt-1 text-xs text-content-neutral-base">
                {starter.summary}
              </p>

              <div className="mt-1.5 flex flex-wrap items-center gap-4">
                {/* Le lien n'existe que si l'outil en a un. Une piste sans
                    plateforme — une méthode —, ou dont la plateforme n'a pas
                    encore d'adresse, rend sa ligne sans lien : c'est un état
                    normal, pas une erreur (règle 5). */}
                {starter.toolName && starter.toolUrl ? (
                  <ExternalLink
                    href={starter.toolUrl}
                    className="text-xs font-medium text-content-info-base underline"
                  >
                    {starter.toolName}
                  </ExternalLink>
                ) : null}

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
