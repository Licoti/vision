/**
 * La **carte d'identité d'une personne**, dans sa fiche — T5bis.4, et ses gestes
 * depuis T5bis.6.
 *
 * Ce que la ligne de la liste résume en quatre colonnes, elle le dit ici en
 * entier : la présentation, la disponibilité, et les compétences avec leur
 * niveau, une par ligne.
 *
 * **Composant serveur**, comme `PersonaDetail` : aucun état, aucun droit, aucun
 * `<form>` de saisie. Il est rendu par la fonction serveur du panneau, ce qui lui
 * laisse la frontière du bundle du bon côté — c'est ce qui a permis à T5bis.5 d'y
 * poser un radar sans embarquer une ligne de JavaScript.
 *
 * **Il ne connaît aucun droit** (T5bis.6) : il reçoit six points d'entrée, et
 * `null` retire le geste. C'est `lib/drawers/team.tsx` qui les dérive de
 * `manageDomain` et du genre de la personne, et ce sont les **actions** qui
 * protègent — un geste absent du rendu n'a jamais protégé le point d'entrée HTTP
 * qui l'accompagne.
 *
 * **Il n'existe pas pour être réutilisé par la liste** : le garde-fou 4 interdit
 * deux radars côte à côte sur un même écran, et c'est ici — un profil, un écran
 * — que le dessin de T5bis.5 a sa place. La liste garde ses étiquettes.
 *
 * **La valeur se lit toujours en toutes lettres** (garde-fou 6) : chaque
 * compétence porte son niveau écrit, et c'est ce texte qui porte
 * l'information — le dessin l'accompagne, il ne la remplace pas.
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
import { SkillRadar } from "@/components/team/skill-radar";
import { ACTION_LINK } from "@/components/ui/action-link";
import { DrawerLink } from "@/components/ui/drawer";
import { BlockNote } from "@/components/ui/empty-state";
import type { PersonDetail, TeamSkill } from "@/lib/queries/team";

export function PersonCard({
  person,
  editHref,
  archiveHref,
  addSkillHref,
  editSkillHref,
  removeSkill,
}: {
  person: PersonDetail;
  /** `null` retire le geste — le composant ne connaît aucun droit. */
  editHref: string | null;
  archiveHref: string | null;
  /** Nul pour un intervenant côté entité : arbitrage (d) de C5bis. */
  addSkillHref: string | null;
  editSkillHref: ((personSkillId: string) => string) | null;
  removeSkill: ((personSkillId: string) => Promise<void>) | null;
}) {
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

        {/* Le dessin **au-dessus** de la liste, pleine largeur, et non à côté
            d'elle : le tiroir fait 440 px, ce qui laisse un peu plus de 350 px
            ici — deux colonnes y écraseraient le radar et ses libellés
            ensemble. Il ne se rend pas en dessous de trois compétences, et rien
            ne remplace alors sa place : la liste tient seule l'écran. */}
        <SkillRadar
          fullName={person.fullName}
          skills={person.skills}
          levelScaleMax={person.levelScaleMax}
        />

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
              <Skill
                key={skill.id}
                skill={skill}
                fullName={person.fullName}
                editSkillHref={editSkillHref}
                removeSkill={removeSkill}
              />
            ))}
          </ul>
        ) : (
          /* Une phrase, pas un `EmptyState` : un état vide dans un panneau n'a
             pas de titre à porter, le panneau en a déjà un. Et ce n'est pas une
             erreur — une personne peut n'avoir rien déclaré. */
          <BlockNote>Aucune compétence déclarée pour l&apos;instant.</BlockNote>
        )}

        {addSkillHref ? (
          <p className="mt-1">
            <DrawerLink
              href={addSkillHref}
              request={{ kind: "skill", id: person.id }}
              aria-label={`Ajouter une compétence à ${person.fullName}`}
              className={ACTION_LINK}
            >
              Ajouter une compétence
            </DrawerLink>
          </p>
        ) : null}
      </div>

      {/* Un `div` et non un `span` : `<form>` est du contenu de flux, et un
          élément de phrasé ne l'accepte pas — le balisage servi serait réécrit
          par le navigateur. La règle de `readings-panel.tsx`. */}
      {editHref || archiveHref ? (
        <div className="flex flex-wrap items-center gap-4 border-t border-surface-neutral-lighter pt-4">
          {editHref ? (
            <DrawerLink
              href={editHref}
              request={{ kind: "person", id: person.id }}
              aria-label={`Modifier le profil de ${person.fullName}`}
              className={ACTION_LINK}
            >
              Modifier le profil
            </DrawerLink>
          ) : null}
          {archiveHref ? (
            /* **Avec confirmation**, à la différence d'un persona ou d'un relevé
               (arbitrage (c) de `tickets-C4bis.md`) : le geste retire de la
               lecture tout un profil, et il ne se défait pas depuis cet écran —
               le rétablissement existe pour les deux objets qui ont une page, et
               une personne n'en a pas (arbitrage (b)). D'où un `DrawerLink` vers
               un `ConfirmPanel`, et non un formulaire nu. « Archiver » est le mot
               de l'arbitrage (d), jamais « Supprimer » : rien n'est supprimé
               (règle 4). */
            <DrawerLink
              href={archiveHref}
              request={{ kind: "archive", id: person.id }}
              aria-label={`Archiver ${person.fullName}`}
              className={ACTION_LINK}
            >
              Archiver cette personne
            </DrawerLink>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/**
 * Une compétence déclarée : son libellé, son niveau **en toutes lettres**, et
 * ses deux gestes.
 *
 * **« Retirer » et non « Archiver »**, et ce n'est pas une nuance de style :
 * `person_skills` est une table de liaison, sans `archived_at`, ce qui range le
 * geste sous `unlink` **à la compilation** (T5bis.1). C'est la règle posée par
 * l'adoption d'un indicateur en T5.4, et le verbe suit la table.
 *
 * Les `aria-label` nomment leur cible : « Modifier » seul ne dit pas laquelle,
 * et une fiche en porte jusqu'à cinq.
 */
function Skill({
  skill,
  fullName,
  editSkillHref,
  removeSkill,
}: {
  skill: TeamSkill;
  /** Pour nommer les gestes, et eux seuls. */
  fullName: string;
  editSkillHref: ((personSkillId: string) => string) | null;
  removeSkill: ((personSkillId: string) => Promise<void>) | null;
}) {
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <span className="flex flex-wrap items-baseline gap-2">
        <span className="min-w-0">{skill.label}</span>
        <span aria-hidden="true" className="text-content-neutral-light">
          ·
        </span>
        <span className="text-content-neutral-base">{skill.levelLabel}</span>
      </span>

      {/* Un `div` et non un `span` : `<form>` est du contenu de flux, et un
          élément de phrasé ne l'accepte pas — le balisage servi serait réécrit
          par le navigateur, et l'hydratation divergerait. Un `<li>`, lui,
          accepte le flux. La règle de `readings-panel.tsx`. */}
      {editSkillHref || removeSkill ? (
        <div className="flex flex-wrap items-center gap-4">
          {editSkillHref ? (
            <DrawerLink
              href={editSkillHref(skill.id)}
              request={{ kind: "skill", id: skill.id }}
              aria-label={`Modifier le niveau de ${skill.label} pour ${fullName}`}
              className={ACTION_LINK}
            >
              Modifier
            </DrawerLink>
          ) : null}
          {removeSkill ? (
            /* Un formulaire nu : ni confirmation (arbitrage (c) de
               `tickets-C4bis.md` — une compétence se repose), ni motif. */
            <form action={removeSkill.bind(null, skill.id)}>
              <button
                type="submit"
                aria-label={`Retirer la compétence ${skill.label} de ${fullName}`}
                className={ACTION_LINK}
              >
                Retirer
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
