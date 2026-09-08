/**
 * La **carte d'identité d'une personne**, dans sa fiche — T5bis.4, et ses gestes
 * depuis T5bis.6.
 *
 * Ce que la ligne de la liste résume en quatre colonnes, elle le dit ici en
 * entier : la présentation, la disponibilité, et les compétences avec leur
 * niveau, une par ligne.
 *
 * **La disponibilité est déduite depuis le 28/08/2026** — du nombre
 * d'accompagnements vivants, ceux-là mêmes que la fiche liste plus bas. Elle
 * n'est plus une saisie du profil : la ligne « Disponibilité » et la liste
 * « Accompagnements » disent donc la même chose, de deux façons.
 *
 * **Composant serveur**, comme `PersonaDetail` : aucun état, aucun droit, aucun
 * `<form>` de saisie. Il est rendu par la fonction serveur du panneau, ce qui lui
 * laisse la frontière du bundle du bon côté — c'est ce qui a permis à T5bis.5 d'y
 * poser un radar sans embarquer une ligne de JavaScript.
 *
 * **Le compte se lit ici depuis T9.6**, et c'est le seul endroit du produit hors
 * de `/dev/session` : *qui peut se connecter, et avec quel rôle*. **C'est un
 * fait, pas une mesure** — un rôle est ce qu'on a donné à quelqu'un, jamais ce
 * que Vision aurait calculé de lui (D39). Le bloc n'existe pas pour un
 * intervenant côté entité : `docs/05` §4 exclut *« l'accès des commanditaires
 * côté entité »* (D2), et **l'action le refuse aussi** — c'est elle qui protège.
 *
 * **Il ne connaît aucun droit** (T5bis.6) : il reçoit ses points d'entrée, et
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
import { formatEventDay } from "@/lib/format";
import { PERSON_ROLE_LABEL } from "@/lib/forms/person";
import type { PersonDetail, TeamSkill } from "@/lib/queries/team";

/**
 * L'invitation vivante d'une personne, telle que la fiche la dit — T11.2.
 *
 * **Trois champs, et pas un décompte.** L'écran énonce *un fait*, comme
 * `/domaines` énonce *aucune identité* et *aucun compte* : une invitation est en
 * attente, elle vaut jusqu'à telle date, pour tel rôle. **Aucun badge, aucune
 * jauge, aucune relance** — l'interdit commun de C11, et D39 pour le reste.
 *
 * `role` est une chaîne et non `PersonRoleValue` : la ligne vient de la base, et
 * ce composant ne la rétrécit pas — c'est `PERSON_ROLE_LABEL` qui décide s'il
 * sait la dire.
 */
export type PendingInvitation = {
  id: string;
  expiresAt: Date;
  role: string;
};

export function PersonCard({
  person,
  editHref,
  archiveHref,
  deleteHref,
  addSkillHref,
  editSkillHref,
  removeSkill,
  accessHref,
  revokeAccess,
  lastManager,
  inviteHref,
  pendingInvitation,
  revokeInvitation,
}: {
  person: PersonDetail;
  /** `null` retire le geste — le composant ne connaît aucun droit. */
  editHref: string | null;
  archiveHref: string | null;
  deleteHref: string | null;
  /** Nul pour un intervenant côté entité : arbitrage (d) de C5bis. */
  addSkillHref: string | null;
  editSkillHref: ((personSkillId: string) => string) | null;
  removeSkill: ((personSkillId: string) => Promise<void>) | null;
  /**
   * Le panneau du compte (T9.6) — accorder l'accès, ou changer le rôle. Nul pour
   * un intervenant côté entité, et nul sans le droit d'écrire.
   */
  accessHref: string | null;
  /**
   * Le retrait de l'accès, **déjà lié** à la personne côté serveur. Nul quand la
   * personne n'a pas d'accès, et nul quand elle est le **dernier responsable** du
   * domaine.
   *
   * **Son absence n'est pas la protection** : `revokePersonAccess` refait le
   * décompte sur l'identifiant qu'elle reçoit — un bouton absent du rendu n'a
   * jamais protégé le point d'entrée HTTP qui l'accompagne. C'est le partage de
   * `removeDomainIdentity` (T9.4), à la lettre.
   */
  revokeAccess: (() => Promise<void>) | null;
  /** Dit pourquoi le retrait n'est pas proposé, plutôt que de laisser un vide. */
  lastManager: boolean;
  /**
   * Le panneau d'**invitation** (T11.2). Nul pour un intervenant côté entité,
   * nul sans le droit d'écrire, **et nul quand le geste serait sans objet** —
   * un accès déjà ouvert, une invitation déjà en attente. Les deux derniers
   * sont **aussi** des refus de l'action : ce qui protège est elle.
   */
  inviteHref: string | null;
  /** Le fait, quand il existe : *une invitation est en attente*. */
  pendingInvitation: PendingInvitation | null;
  /**
   * La révocation, **déjà liée** à l'invitation côté serveur. Nulle sans
   * invitation vivante, et son absence n'est pas la protection :
   * `revokeInvitation` relit la ligne qu'elle reçoit.
   */
  revokeInvitation: (() => Promise<void>) | null;
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

      {/* **Le compte, et il ne paraît que pour le centre** : un intervenant côté
          entité ne reçoit jamais d'accès (`docs/05` §4, D2), et une ligne
          « aucun accès » sur sa fiche laisserait croire qu'il pourrait en
          recevoir un.

          **Aucun jeton neuf, aucun couple neuf par la position** : la ligne du
          rôle a la forme exacte de celle de la disponibilité, juste au-dessus —
          `content-neutral-base` pour l'intitulé, `content-neutral-darkest` pour
          la valeur, sur le même fond. Il n'y a donc rien à remesurer (règle 2, et
          la leçon de T5.4 : c'est la position qui décide du jeton). */}
      {person.kind === "center" ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-2xs font-semibold text-content-neutral-dark uppercase">
            Accès à Vision
          </h3>

          <p className="flex flex-wrap items-baseline gap-2 text-sm text-content-neutral-darkest">
            <span className="text-content-neutral-base">Rôle :</span>
            <span>
              {person.hasAccess && person.domainRole
                ? PERSON_ROLE_LABEL[person.domainRole]
                : "Aucun accès — cette personne ne peut pas se connecter"}
            </span>
          </p>

          {/* L'adresse **est** le compte : c'est elle que le fournisseur
              d'identité vérifie, et elle qui rapproche la connexion de cette
              ligne au premier passage. Son absence se dit ici, avant qu'un geste
              soit tenté. */}
          {person.email ? (
            <p className="text-sm text-content-neutral-dark">{person.email}</p>
          ) : (
            <BlockNote>
              Aucune adresse e-mail : un accès ne peut pas être accordé tant
              qu&apos;elle manque.
            </BlockNote>
          )}

          {person.hasAccess && lastManager ? (
            <BlockNote>
              Dernier responsable de ce domaine : son accès ne peut pas être
              retiré, ni son rôle abaissé — sans responsable, le domaine
              deviendrait inadministrable.
            </BlockNote>
          ) : null}

          {/* **Le fait, et rien de plus** (T11.2) : une invitation est en
              attente, elle vaut jusqu'à cette date, pour ce rôle. Ni badge, ni
              décompte, ni relance — l'interdit commun de C11, et D39.

              **Aucun jeton neuf, aucun couple neuf par la position** : la ligne
              a la forme exacte de celle du rôle, juste au-dessus, sur le même
              fond — `content-neutral-base` pour l'intitulé,
              `content-neutral-darkest` pour la valeur. Il n'y a donc rien à
              remesurer (règle 2, et la leçon de T5.4 : c'est la position qui
              décide du jeton).

              **Le lien n'y est pas, et ne peut pas y être** : Vision n'en garde
              que l'empreinte (T11.1). Il s'affiche une fois, dans le panneau qui
              le crée. */}
          {pendingInvitation ? (
            <p className="flex flex-wrap items-baseline gap-2 text-sm text-content-neutral-darkest">
              <span className="text-content-neutral-base">Invitation :</span>
              <span>
                en attente pour le rôle
                {" "}
                {PERSON_ROLE_LABEL[
                  pendingInvitation.role as keyof typeof PERSON_ROLE_LABEL
                ] ?? pendingInvitation.role}
                , jusqu&apos;au {formatEventDay(pendingInvitation.expiresAt)}
              </span>
            </p>
          ) : null}

          {/* Un `div` et non un `p` : `<form>` est du contenu de flux, et un
              élément de phrasé ne l'accepte pas — le balisage servi serait
              réécrit par le navigateur. La règle de `readings-panel.tsx`. */}
          {accessHref || revokeAccess || inviteHref || revokeInvitation ? (
            <div className="mt-1 flex flex-wrap items-center gap-4">
              {inviteHref ? (
                <DrawerLink
                  href={inviteHref}
                  request={{ kind: "invite", id: person.id }}
                  aria-label={`Inviter ${person.fullName}`}
                  className={ACTION_LINK}
                >
                  Inviter
                </DrawerLink>
              ) : null}
              {revokeInvitation ? (
                /* Un formulaire nu : ni confirmation ni motif — c'est le partage
                   du retrait d'accès (arbitrage (c) de `tickets-C4bis.md`). Rien
                   ne disparaît, la ligne reste en base avec sa date, et
                   l'invitation **se refait**. Le mot est « Révoquer », jamais
                   « Supprimer » : c'est ce que la règle 4 dit du geste, et ce
                   que la base fait. */
                <form action={revokeInvitation}>
                  <button
                    type="submit"
                    aria-label={`Révoquer l'invitation de ${person.fullName}`}
                    className={ACTION_LINK}
                  >
                    Révoquer l&apos;invitation
                  </button>
                </form>
              ) : null}
              {accessHref ? (
                <DrawerLink
                  href={accessHref}
                  request={{ kind: "access", id: person.id }}
                  aria-label={
                    person.hasAccess
                      ? `Modifier le rôle de ${person.fullName}`
                      : `Accorder un accès à ${person.fullName}`
                  }
                  className={ACTION_LINK}
                >
                  {person.hasAccess
                    ? "Modifier le rôle"
                    : "Accorder l'accès"}
                </DrawerLink>
              ) : null}
              {revokeAccess ? (
                /* Un formulaire nu : ni confirmation ni motif — c'est le partage
                   du retrait d'une compétence (arbitrage (c) de
                   `tickets-C4bis.md`). Rien ne disparaît, et l'accès se
                   réaccorde ; « Retirer » est le mot, jamais « Archiver ». */
                <form action={revokeAccess}>
                  <button
                    type="submit"
                    aria-label={`Retirer l'accès de ${person.fullName}`}
                    className={ACTION_LINK}
                  >
                    Retirer l&apos;accès
                  </button>
                </form>
              ) : null}
            </div>
          ) : null}
        </div>
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
      {editHref || archiveHref || deleteHref ? (
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
          {deleteHref ? (
            /* **Le troisième geste, et il ne range pas** (28/08/2026) : il
               efface, et il ne se défait pas. C'est pourquoi il a sa propre
               entrée à côté d'« Archiver » plutôt qu'une variante de celle-ci —
               deux gestes aux conséquences opposées ne se proposent pas sous un
               même mot. Le panneau dit ce qui part avec la personne et ce qui
               reste sans son nom.

               Aucun jeton neuf : `ACTION_LINK` est déjà servi deux fois dans
               cette même carte, donc aucun couple de couleurs n'est neuf par la
               position, et aucune mesure de contraste n'est à refaire. */
            <DrawerLink
              href={deleteHref}
              request={{ kind: "delete", id: person.id }}
              aria-label={`Supprimer définitivement ${person.fullName}`}
              className={ACTION_LINK}
            >
              Supprimer définitivement
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
