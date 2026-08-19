/**
 * La **carte d'identité d'une personne**, dans sa fiche — T5bis.4.
 *
 * Ce que la ligne de la liste résume en quatre colonnes, elle le dit ici en
 * entier : la présentation, la disponibilité, et les compétences avec leur
 * niveau, une par ligne.
 *
 * **Composant serveur**, comme `PersonaDetail` : aucun état, aucun droit, aucun
 * `<form>`. Il est rendu par la fonction serveur du panneau, ce qui lui laisse
 * la frontière du bundle du bon côté — c'est ce qui permettra à T5bis.5 d'y
 * poser un radar sans embarquer une ligne de JavaScript.
 *
 * **Il n'existe pas pour être réutilisé par la liste** : le garde-fou 4 interdit
 * deux radars côte à côte sur un même écran, et c'est ici — un profil, un écran
 * — que le dessin de T5bis.5 aura sa place. La liste garde ses étiquettes.
 *
 * **La valeur se lit toujours en toutes lettres** (garde-fou 6) : chaque
 * compétence porte son niveau écrit, et c'est ce texte qui portera
 * l'information le jour où le dessin l'accompagnera.
 *
 * **Rien n'est calculé d'une ligne à l'autre** : ni décompte de compétences, ni
 * moyenne de niveau, ni indice de profil. On affiche ce que la personne
 * déclare (garde-fous 1 et 2).
 *
 * **Aucun fond, le filet fait la carte** : sur `surface-neutral-pale`, celui du
 * panneau, aucun jeton ne donne une surface qui s'en détache — la dette est
 * consignée, et aucun septième substitut ne s'invente (règle 2). Le filet est
 * celui de `Section`, d'`EmptyState` et des cartes de personae.
 */

import { AvailabilityDot } from "@/components/team/availability-dot";
import { BlockNote } from "@/components/ui/empty-state";
import type { PersonDetail } from "@/lib/queries/team";

export function PersonCard({ person }: { person: PersonDetail }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-surface-neutral-lighter p-4">
      {person.bio ? (
        <p className="text-sm leading-175 text-content-neutral-dark">
          {person.bio}
        </p>
      ) : (
        <BlockNote>Aucune présentation saisie pour l&apos;instant.</BlockNote>
      )}

      {/* Un intervenant côté entité n'a pas de disponibilité : c'est une
          propriété du centre, et la ligne disparaît plutôt que d'inventer une
          valeur absente (arbitrage (d)). */}
      {person.availability ? (
        <p className="flex items-center gap-2 text-sm text-content-neutral-darkest">
          <span className="text-content-neutral-base">Disponibilité :</span>
          <AvailabilityDot availability={person.availability} />
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <h3 className="text-2xs font-semibold text-content-neutral-dark uppercase">
          Compétences déclarées
        </h3>

        {person.skills.length > 0 ? (
          /* Une **liste**, et non des étiquettes : la fiche a la place de dire
             chaque niveau en toutes lettres, là où la ligne de la liste devait
             les tenir en une colonne. C'est le balisage qui rend le profil
             lisible à la voix autant qu'à l'œil — la règle de `PersonaDetail`. */
          <ul
            role="list"
            className="flex flex-col gap-1.5 text-sm text-content-neutral-darkest"
          >
            {person.skills.map((skill) => (
              <li key={skill.id} className="flex flex-wrap items-baseline gap-2">
                <span className="min-w-0">{skill.label}</span>
                <span aria-hidden="true" className="text-content-neutral-light">
                  ·
                </span>
                <span className="text-content-neutral-base">
                  {skill.levelLabel}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          /* Une phrase, pas un `EmptyState` : un état vide dans un panneau n'a
             pas de titre à porter, le panneau en a déjà un. Et ce n'est pas une
             erreur — une personne peut n'avoir rien déclaré. */
          <BlockNote>Aucune compétence déclarée pour l&apos;instant.</BlockNote>
        )}
      </div>
    </section>
  );
}
