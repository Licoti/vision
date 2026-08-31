/**
 * La **fiche d'une personne**, en panneau latéral — T5bis.4.
 *
 * Elle répond à « qui est cette personne, que sait-elle faire, et sur quoi
 * est-elle intervenue ? » **sans écran de plus** : D29 écarte la page personne
 * du POC, et l'arbitrage (a) de `tickets-C5bis.md` la remplace par ce panneau,
 * ouvert depuis la ligne de la liste. La page reste rendue derrière, et porte
 * `inert`.
 *
 * **Ce n'est pas un panneau de saisie**, et il ne ressemble donc pas aux dix
 * autres : aucun formulaire, aucun `useActionState`, aucun bouton d'envoi. C'est
 * une **lecture**, et elle reste rendue sur le serveur — comme
 * `readings-panel.tsx` et `persona-detail.tsx`, les deux seuls autres panneaux
 * dans ce cas. `Panel` n'est pas réemployé pour cette raison exacte : son corps
 * enveloppe ses `children` dans un `<form>` et exige un dispatch, une attente et
 * un libellé d'envoi.
 *
 * **Sa coquille ne lui appartient pas** (TD.2) : le voile, le tiroir, la croix
 * et le piège de focus vivent dans `DrawerHost`, qui est client et porte donc la
 * fermeture. C'est ce partage qui laisse ce fichier serveur.
 *
 * **Elle porte son en-tête**, comme la fiche d'un persona et pour la même
 * raison : le portrait et la mention « côté entité » à côté du nom ne se disent
 * pas en deux lignes de texte. `DrawerContent.header` existe pour cela.
 *
 * **Elle se lit par tout le domaine** (D9), comme la liste qui la porte : son
 * ouverture ne passe par aucun droit. Ce sont ses **six gestes** qui tombent
 * avec lui, chacun à `null` — la règle de `PersonaDetail`. Ils vivent dans la
 * carte, qui porte l'identité et les compétences ; cette fiche ne fait que les
 * transmettre, et ne décide de rien.
 *
 * **Rien n'est calculé, rien n'est totalisé** : ni nombre d'accompagnements, ni
 * moyenne de niveau, ni indice de profil. Une fiche décrit une personne, elle ne
 * l'évalue pas (garde-fous 1 et 2, D39).
 */

import Link from "next/link";

import { PersonCard } from "@/components/team/person-card";
import { Avatar } from "@/components/ui/avatar";
import { BlockNote } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { formatPeriod } from "@/lib/format";
import { ROUTES } from "@/lib/navigation";
import type { PersonDetail as PersonDetailRow } from "@/lib/queries/team";

/**
 * L'en-tête de la fiche, que la coquille rend à la place du couple
 * titre / sous-titres. Il porte lui-même le `<h2>` que `aria-labelledby`
 * désigne.
 */
export function PersonDetailHeader({ person }: { person: PersonDetailRow }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      {/* Le `tone` distingue le centre de l'entité accompagnée, exactement comme
          sur la ligne de la liste : la fiche ressemble à ce qu'elle détaille. */}
      <Avatar
        name={person.fullName}
        tone={person.kind}
        className="h-12 w-12 text-xs"
      />
      <div className="flex min-w-0 flex-col gap-1">
        <h2
          id="panneau-personne-titre"
          className="text-md font-semibold text-content-neutral-darkest"
        >
          {person.fullName}
        </h2>
        {/* La même mention que la ligne de la liste et que la page projet depuis
            T2.4 — un seul vocabulaire pour une seule colonne. */}
        <p className="text-xs text-content-neutral-base">
          {person.jobLabel ?? "Métier non renseigné"}
          {person.kind === "stakeholder" ? " · côté entité" : ""}
        </p>
      </div>
    </div>
  );
}

export function PersonDetail({
  person,
  editHref,
  archiveHref,
  deleteHref,
  addSkillHref,
  editSkillHref,
  removeSkill,
}: {
  person: PersonDetailRow;
  /**
   * Les points d'entrée de T5bis.6, plus la suppression du 28/08/2026, dérivés
   * du droit par `lib/drawers/team.tsx` — `null` retire le geste. Ils traversent
   * cette fiche sans qu'elle les lise : c'est la carte qui les porte, et ce sont
   * les actions qui protègent.
   *
   * **Sans le compte** : la phrase disait « les six », ils sont sept. Un nombre
   * dans un commentaire vieillit à chaque ticket.
   */
  editHref: string | null;
  archiveHref: string | null;
  deleteHref: string | null;
  addSkillHref: string | null;
  editSkillHref: ((personSkillId: string) => string) | null;
  removeSkill: ((personSkillId: string) => Promise<void>) | null;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
      <PersonCard
        person={person}
        editHref={editHref}
        archiveHref={archiveHref}
        deleteHref={deleteHref}
        addSkillHref={addSkillHref}
        editSkillHref={editSkillHref}
        removeSkill={removeSkill}
      />

      <section className="flex flex-col gap-2">
        {/* **Aucun décompte dans l'intitulé**, et cette règle tient encore —
            mais elle a changé de raison le 28/08/2026. Elle disait : « un nombre
            d'accompagnements présenté comme une mesure d'activité de la personne
            serait l'indice calculé que D39 interdit. » Ce nombre est désormais
            **calculé**, et il produit la disponibilité que la carte ci-dessus
            affiche — l'écart à D39 est arbitré par l'humain et consigné.

            Ce qui reste tenu : la valeur se dit en **trois mots**, jamais en un
            chiffre, et rien ne trie ni ne classe les personnes par elle
            (garde-fous 2 et 3). Un nombre nu au-dessus de cette liste
            franchirait la ligne que la pastille ne franchit pas. */}
        <h3 className="text-2xs font-semibold text-content-neutral-dark uppercase">
          Accompagnements
        </h3>

        {person.projects.length > 0 ? (
          <ul role="list" className="flex flex-col gap-1.5">
            {person.projects.map((project) => (
              <li key={project.id} className="min-w-0">
                {/* Un lien de sortie du panneau : il **navigue** pour de bon,
                    et n'est donc pas un `DrawerLink` — la fiche renvoie vers
                    l'accompagnement, elle ne l'ouvre pas dans un second
                    tiroir. La descente reste sans rupture (`docs/06` §7). */}
                <Link
                  href={ROUTES.project(project.id)}
                  className="flex min-w-0 flex-col gap-1 rounded-xl border border-surface-neutral-lighter px-4 py-3"
                >
                  <span className="flex flex-wrap items-center gap-2 text-xs">
                    <StatusPill
                      nature={project.statusNature}
                      label={project.statusLabel}
                    />
                    <span className="text-content-neutral-base">
                      {formatPeriod(project.periodStart, project.periodEnd)}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-content-neutral-darkest">
                    {project.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          /* Une phrase, pas un `EmptyState` : la règle de `PersonaDetail` et de
             `readings-panel.tsx` — un état vide dans un panneau n'a pas de titre
             à porter, le panneau en a déjà un. Ce n'est pas un défaut de saisie,
             c'est un état normal du référentiel (règle 5). */
          <BlockNote>
            Cette personne n&apos;est encore dans l&apos;équipe d&apos;aucun
            accompagnement.
          </BlockNote>
        )}
      </section>
    </div>
  );
}
