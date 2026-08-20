/**
 * Le détail d'une **piste de démarrage**, en panneau latéral — ce que la carte
 * résume (20/08/2026).
 *
 * **Ce n'est pas un panneau de saisie**, et il ne ressemble donc pas aux six
 * panneaux de formulaire de cette page : aucun `useActionState`, aucun bouton
 * d'envoi. C'est une **lecture**, et il reste rendu sur le serveur — comme
 * `UseCaseDetail` et `PersonaDetail`. Il ne réutilise pas `Panel` pour cette
 * raison exacte : le corps de TD.1 enveloppe ses `children` dans un `<form>` et
 * exige un dispatch, une attente et un libellé d'envoi.
 *
 * **Il ne porte aucun geste, et c'est le seul panneau du dépôt dans ce cas.**
 * Les autres panneaux de lecture — la fiche d'un persona, celle d'une personne
 * — laissent tomber leurs gestes à `null` quand le droit manque ; ici il n'y a
 * rien à faire tomber : `starters` est un référentiel du domaine, et D25 donne
 * son écran de gestion à C7.
 *
 * **Le lien sortant est le même qu'en carte**, et il est ici la seule action :
 * `ExternalLink` porte le nouvel onglet et son marquage (`docs/06` §8). Il
 * pointe la **racine** de l'outil, jamais une adresse construite avec
 * l'identifiant du projet — ce serait le « niveau 2, lancement délégué » que
 * `docs/03` §5 et D15 rangent après le POC.
 */

import { BlockNote } from "@/components/ui/empty-state";
import { ExternalLink } from "@/components/ui/external-link";
import { Tag } from "@/components/ui/tag";
import { formatStarterKind } from "@/lib/format";
import type { DomainStarter } from "@/lib/queries/starters";

export function StarterDetail({ starter }: { starter: DomainStarter }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
      <div className="flex flex-wrap items-center gap-2">
        <Tag label={formatStarterKind(starter.kind)} />
      </div>

      <p className="text-sm leading-175 text-content-neutral-dark">
        {starter.summary}
      </p>

      <section className="flex flex-col gap-2">
        <h3 className="text-2xs font-semibold uppercase text-content-neutral-dark">
          Quand l&apos;envisager
        </h3>

        {starter.guidance ? (
          /* Le texte long **en entier** : c'est toute la raison d'être de ce
             panneau, la carte n'en portant pas une ligne. */
          <p className="text-sm leading-175 text-content-neutral-dark">
            {starter.guidance}
          </p>
        ) : (
          /* Une phrase, pas un `EmptyState` : un état vide dans un panneau n'a
             pas de titre à porter, le panneau en a déjà un. La règle de
             `UseCaseDetail`.

             Elle ne reproche rien — une piste sans texte long reste une piste
             —, elle dit ce que ce texte porterait. */
          <BlockNote>
            Rien n&apos;est encore écrit sur le moment d&apos;y recourir. La
            piste tient dans la phrase ci-dessus.
          </BlockNote>
        )}
      </section>

      <section className="flex flex-col gap-2 border-t border-surface-neutral-lighter pt-4">
        <h3 className="text-2xs font-semibold uppercase text-content-neutral-dark">
          Où aller
        </h3>

        {/* Trois états, et ils se disent chacun en une phrase : la plateforme
            avec son adresse, la plateforme sans adresse, et l'absence de
            plateforme. Aucun n'est une erreur. */}
        {starter.toolName ? (
          starter.toolUrl ? (
            <p className="text-sm">
              <ExternalLink
                href={starter.toolUrl}
                className="font-medium text-content-info-base underline"
              >
                {starter.toolName}
              </ExternalLink>
            </p>
          ) : (
            <BlockNote>
              {starter.toolName} est raccordé au domaine, sans adresse
              renseignée pour l&apos;instant.
            </BlockNote>
          )
        ) : (
          <BlockNote>
            Aucune plateforme derrière cette piste — elle se mène avec les
            personnes de l&apos;accompagnement.
          </BlockNote>
        )}
      </section>
    </div>
  );
}
