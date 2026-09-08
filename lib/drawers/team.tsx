/**
 * La résolution des panneaux de la page Équipe — T5bis.4, T5bis.6, puis la
 * suppression du 28/08/2026.
 *
 * **Sans le compte**, et c'est le geste de T6.1 sur `scoped.ts` : la phrase
 * disait « les quatre », ils sont cinq. Un nombre dans un commentaire vieillit à
 * chaque ticket ; ce qui se relit ici est la règle.
 *
 * **Deux chemins, une seule résolution.** L'URL reste une adresse valide —
 * coller `?personne=<identifiant>` ouvre encore la fiche, au rendu serveur — et
 * le clic passe par `DrawerHost`, qui n'écrit plus l'adresse (TD.2). Les faire
 * diverger mettrait une règle de droit à deux endroits, et c'est exactement ce
 * qu'une refonte de mécanisme ne doit pas produire.
 *
 * **Les disciplines tenues, sans exception.** La forme de l'UUID se vérifie
 * **avant** la base — une colonne `uuid` interrogée avec n'importe quoi rend une
 * erreur PostgreSQL, donc un 500, là où l'on attend la page nue. La cible est
 * ensuite confrontée au domaine et à son archivage par la lecture scopée
 * elle-même : une personne d'un autre domaine n'existe pas, elle ne « manque »
 * pas.
 *
 * **Le compte est arrivé en T9.6** — `access`, sixième clé de cette page. Il
 * s'ouvre aux **mêmes** conditions que la compétence : `manageDomain`, une
 * personne vivante, et le **centre** — `docs/05` §4 exclut *« l'accès des
 * commanditaires côté entité »* (D2). Les trois conditions sont refaites par
 * l'action, qui seule protège.
 *
 * **Une lecture, le reste en écriture.** `personDetail` ne passe par aucun droit
 * (D9) : la fiche se lit par tout le domaine, comme la liste qui la porte, et ce
 * sont ses gestes qui tombent avec `manageDomain`, chacun à `null`. Les autres
 * panneaux ne s'ouvrent qu'à qui peut écrire (arbitrage (c)).
 * Ce n'est pas ce rendu qui protège : les six actions redérivent le droit sur
 * l'identifiant **reçu** (`app/(app)/equipe/actions.ts`).
 *
 * **Pas de contexte à charger.** La page produit passe à sa résolution les
 * collections qu'elle a déjà lues ; `/equipe` n'a pas d'objet de page, et ses
 * lectures ne sont donc payées que lorsqu'un panneau s'ouvre.
 *
 * **L'exception d'archivage nominative** (T4bis.1) est reprise sur les trois
 * référentiels proposés au choix : `includeArchived: true` accompagné d'un
 * `or(is null, celle-ci)`. Un métier, une compétence ou un niveau archivé que la
 * ligne éditée porte **déjà** reste sélectionnable, et n'est proposé à personne
 * d'autre. C'est le contraire du cas des filtres, où T5bis.3 l'écarte : un
 * filtre n'édite rien, il n'a aucune valeur à conserver.
 */

import { AccessPanel } from "@/components/team/access-panel";
import { InvitationPanel } from "@/components/team/invitation-panel";
import { PersonPanel } from "@/components/team/person-panel";
import {
  PersonDetail,
  PersonDetailHeader,
} from "@/components/team/person-detail";
import { SkillPanel } from "@/components/team/skill-panel";
import { ConfirmPanel } from "@/components/ui/confirm-panel";
import type { Session } from "@/lib/auth/session";
import {
  activityParticipants,
  invitations,
  jobs,
  personSkills,
  persons,
  projectMembers,
  skillLevels,
  skills,
} from "@/lib/db/schema";
import type { DrawerContent, TeamDrawerRequest } from "@/lib/drawers/types";
import { formatAccompaniments, formatActivities } from "@/lib/format";
import { INVITATION_TTL_DAYS } from "@/lib/auth/invitation";
import {
  toPersonAccessFormValues,
  toPersonFormValues,
} from "@/lib/forms/person";
import { toPersonSkillFormValues } from "@/lib/forms/person-skill";
import {
  ARCHIVE_PANEL_PARAM,
  DELETE_PANEL_PARAM,
  PERSON_ACCESS_PARAM,
  PERSON_FORM_NEW,
  PERSON_FORM_PARAM,
  PERSON_INVITE_PARAM,
  PERSON_PANEL_PARAM,
  ROUTES,
  SKILL_PANEL_PARAM,
} from "@/lib/navigation";
import { findPersonDetail } from "@/lib/queries/team";
import { isUuid } from "@/lib/uuid";

import {
  archivePerson,
  createPerson,
  createPersonSkill,
  deletePerson,
  grantPersonAccess,
  invitePerson,
  removePersonSkill,
  revokeInvitation,
  revokePersonAccess,
  updatePerson,
  updatePersonSkill,
} from "@/app/(app)/equipe/actions";

import { and, asc, eq, isNull, ne, or } from "drizzle-orm";

/**
 * Ce qui s'oppose à la suppression d'une personne, dit avant le geste — ou
 * `null` quand rien ne s'y oppose.
 *
 * **Sa jumelle vit dans l'action** (`refusalOfAnyTrace`), et les deux phrases
 * sont **délibérément distinctes** : celle-ci prévient — « le geste sera
 * refusé » —, l'autre refuse — « une personne qui a accompagné ne s'efface
 * pas ». C'est le partage que `deleteEntity` et son panneau tiennent déjà
 * depuis le 21/08/2026 : le décompte se formate au même endroit
 * (`lib/format.ts`), la phrase appartient à qui la dit.
 *
 * Ce panneau ne décide de rien : l'action recompte, et les deux clés étrangères
 * `restrict` tranchent en dernier.
 */
function opposingTrace(
  members: number,
  participations: number,
): string | null {
  const parts: string[] = [];
  if (members > 0) {
    parts.push(
      `${formatAccompaniments(members)} ${members > 1 ? "la comptent dans leur équipe" : "la compte dans son équipe"}`,
    );
  }
  if (participations > 0) {
    parts.push(
      `${formatActivities(participations)} ${participations > 1 ? "la comptent" : "la compte"} parmi ses participants`,
    );
  }
  if (parts.length === 0) return null;
  return `${parts.join(" et ")} : le geste sera refusé.`;
}

/**
 * Cette personne est-elle le **dernier responsable** du domaine ? — T9.6.
 *
 * **La question de l'écran, jamais celle du droit.** Elle décide de ce qui se
 * rend — le bouton de retrait, la phrase qui dit pourquoi il n'est pas là — et
 * elle ne protège rien : `grantPersonAccess` et `revokePersonAccess` refont le
 * décompte sur l'identifiant qu'elles reçoivent. C'est le partage exact de
 * `removeDomainIdentity` (T9.4), et de `opposingTrace` juste au-dessus : le
 * panneau prévient, l'action refuse.
 *
 * **Le décompte porte sur les autres**, et les archivées n'y sont pas : c'est
 * l'écriture jumelle d'`otherDomainManagers` (`app/(app)/equipe/actions.ts`), à
 * qui appartient le raisonnement.
 */
async function isLastDomainManager(
  session: Session,
  person: { id: string; hasAccess: boolean; domainRole: string | null },
): Promise<boolean> {
  if (!person.hasAccess || person.domainRole !== "domain_manager") return false;

  const others = await session.db.count(persons, {
    where: and(
      eq(persons.hasAccess, true),
      eq(persons.domainRole, "domain_manager"),
      ne(persons.id, person.id),
    ),
  });
  return others === 0;
}

/**
 * L'invitation **vivante** d'une personne, s'il y en a une — T11.2.
 *
 * **La condition est celle de l'index partiel**, mot pour mot : ni acceptée, ni
 * révoquée. Les deux écrire ici plutôt que d'inventer un `status` est le choix
 * de T11.1 — *quatre horodatages, et aucun statut* —, et le prix est que la
 * condition se relit à chaque lecture. Elle est écrite deux fois : ici, et dans
 * `invitePerson`, qui refuse sur le même décompte.
 *
 * **Une invitation périmée reste vivante au sens de l'index** : le lien est
 * mort, la ligne retient toujours la place. C'est ce que la fiche doit dire, et
 * c'est le geste de révocation qui la libère.
 *
 * **Elle ne protège rien** : `invitePerson` refait le décompte, et
 * `revokeInvitation` relit la ligne qu'elle reçoit. Le panneau prévient,
 * l'action refuse — le partage d'`isLastDomainManager`.
 */
async function pendingInvitationOf(
  session: Session,
  personId: string,
): Promise<{ id: string; expiresAt: Date; role: string } | null> {
  const rows = await session.db.list(invitations, {
    where: and(
      eq(invitations.personId, personId),
      isNull(invitations.acceptedAt),
      isNull(invitations.revokedAt),
    ),
    limit: 1,
  });

  const row = rows[0];
  return row
    ? { id: row.id, expiresAt: row.expiresAt, role: row.role }
    : null;
}

export async function resolveTeamDrawer(
  session: Session,
  request: TeamDrawerRequest,
): Promise<DrawerContent | null> {
  switch (request.kind) {
    /* ------------------------------------------------------------------ */
    case "personDetail": {
      if (!isUuid(request.id)) return null;

      /* La lecture porte elle-même les trois refus de la fiche : un
         identifiant inconnu, une personne d'un autre domaine et une personne
         archivée rendent `null`, et l'écran est alors la page nue — jamais un
         404 : la liste reste lisible, seul le panneau disparaît. */
      const person = await findPersonDetail(session.db, request.id);
      if (!person) return null;

      /* **Le droit ne garde pas la fiche, il garde ses gestes** (D9) — la règle
         de `personaDetail` sur la page produit. Les trois entrées de compétence
         tombent en outre pour un intervenant côté entité : les compétences sont
         une propriété du centre (arbitrage (d)), et le refus est **aussi** dans
         l'action, qui seule protège. */
      const canWrite = session.can.manageDomain;
      const canCarry = canWrite && person.kind === "center";

      /* **Le compte, aux mêmes conditions que la compétence** : les deux sont des
         propriétés du centre — l'une par l'arbitrage (d) de C5bis, l'autre par
         `docs/05` §4 et D2 —, et les deux refus vivent **aussi** dans l'action.

         Le retrait ne se propose ni sans accès à retirer, ni sur le dernier
         responsable : le décompte est payé **seulement** quand il peut changer
         quelque chose, c'est-à-dire quand le geste serait rendu. */
      const lastManager = canCarry
        ? await isLastDomainManager(session, person)
        : false;
      const canRevoke = canCarry && person.hasAccess && !lastManager;

      /* **L'invitation, aux mêmes conditions que le compte** : elle n'a de sens
         que pour un membre du centre, et elle n'est lue que lorsqu'elle peut
         changer quelque chose. Elle se lit **même sans le droit d'écrire** pour
         qui a `canCarry`, parce que le fait — *une invitation est en attente* —
         appartient à la fiche autant que le rôle : sans lui, un domaine
         correctement amorcé se lirait comme un domaine sans compte. */
      const pendingInvitation = canCarry
        ? await pendingInvitationOf(session, person.id)
        : null;

      return {
        titleId: "panneau-personne-titre",
        title: person.fullName,
        /* Le couple titre / sous-titres n'est pas rendu — l'en-tête ci-dessous
           le remplace —, mais le titre reste porté : c'est lui que la coquille
           emploierait si l'en-tête venait à tomber, et c'est le contrat du
           type. */
        subtitles: [],
        header: <PersonDetailHeader person={person} />,
        body: (
          <PersonDetail
            person={person}
            editHref={canWrite ? ROUTES.teamPersonEdit(person.id) : null}
            archiveHref={canWrite ? ROUTES.teamPersonArchive(person.id) : null}
            deleteHref={canWrite ? ROUTES.teamPersonDelete(person.id) : null}
            addSkillHref={canCarry ? ROUTES.teamSkillNew(person.id) : null}
            editSkillHref={canCarry ? ROUTES.teamSkillEdit : null}
            removeSkill={canCarry ? removePersonSkill : null}
            accessHref={canCarry ? ROUTES.teamPersonAccess(person.id) : null}
            /* **Lié côté serveur**, comme les quatre confirmations de cette
               page : l'identifiant sort de la saisie. Ce n'est pas un verrou —
               Next sérialise les arguments liés dans un champ `$ACTION_…`,
               réécrivable. Le verrou est dans l'action. */
            revokeAccess={
              canRevoke ? revokePersonAccess.bind(null, person.id) : null
            }
            lastManager={lastManager}
            /* **Inviter ne se propose pas à qui a déjà un accès** : il n'y a
               rien à ouvrir, et l'action le refuse de son côté. Ni à qui porte
               déjà une invitation vivante — c'est le sixième refus, dit avant
               le clic plutôt qu'après. */
            inviteHref={
              canCarry && !person.hasAccess && !pendingInvitation
                ? ROUTES.teamPersonInvite(person.id)
                : null
            }
            pendingInvitation={pendingInvitation}
            /* Lié côté serveur, comme les cinq autres gestes de cette fiche. */
            revokeInvitation={
              canCarry && pendingInvitation
                ? revokeInvitation.bind(null, pendingInvitation.id)
                : null
            }
          />
        ),
      };
    }

    /* ------------------------------------------------------------------ */
    case "person": {
      /* Le droit d'abord : il ne dépend d'aucun identifiant, et s'énonce donc
         avant la moindre lecture — l'ordre de la porte des actions. Qui ne peut
         pas écrire obtient la page nue, pas un 404 : la liste reste lisible par
         tout le domaine (D9), seul le panneau disparaît. */
      if (!session.can.manageDomain) return null;

      /* La forme est vérifiée avant la base. La personne est ensuite confrontée
         au domaine et à l'archivage — la liste n'affiche aucun lien vers une
         personne archivée, mais une demande se forge. */
      const row =
        request.id && isUuid(request.id)
          ? await session.db.find(persons, request.id)
          : undefined;
      const person = row && row.archivedAt === null ? row : null;

      if (request.id && !person) return null;

      /* Le référentiel des métiers, avec l'exception nominative : celui que la
         personne porte déjà reste sélectionnable même archivé. */
      const keptJob = person?.jobId ?? undefined;
      const jobRows = await session.db.list(jobs, {
        ...(keptJob
          ? {
              includeArchived: true,
              where: or(isNull(jobs.archivedAt), eq(jobs.id, keptJob)),
            }
          : {}),
        orderBy: [asc(jobs.position), asc(jobs.label)],
      });

      return {
        titleId: "panneau-profil-titre",
        title: person ? "Modifier le profil" : "Ajouter une personne",
        subtitles: person ? [person.fullName] : [],
        body: (
          <PersonPanel
            action={
              person ? updatePerson.bind(null, person.id) : createPerson
            }
            jobs={jobRows.map((job) => ({ id: job.id, label: job.label }))}
            /* **La bascule vient de la ligne relue, jamais du formulaire**
               (T9.6) : une personne qui a un accès ne peut pas perdre son
               adresse, sans quoi son compte deviendrait injoignable — la règle
               d'entrée 6 rapproche sur l'e-mail. À la création, personne n'a
               d'accès : `false` par défaut. */
            {...(person?.hasAccess ? { emailRequired: true } : {})}
            {...(person
              ? {
                  submitLabel: "Enregistrer les modifications",
                  initial: toPersonFormValues(person),
                }
              : {})}
          />
        ),
      };
    }

    /* ------------------------------------------------------------------ */
    case "skill": {
      if (!session.can.manageDomain || !isUuid(request.id)) return null;

      /* La valeur change de **table** et non de nature : l'identifiant d'une
         personne pose une compétence, celui d'une liaison en corrige le niveau.
         Deux lectures scopées successives tranchent, et ce qui n'est ni l'un ni
         l'autre n'ouvre rien. La personne d'abord : c'est le cas courant. */
      const personRow = await session.db.find(persons, request.id);
      const carrier = personRow && personRow.archivedAt === null ? personRow : null;

      /* La liaison ensuite, et sa chaîne remontée jusqu'à sa personne — la même
         que remonte `openPersonSkill` dans l'action, et pour la même raison. */
      const link = carrier
        ? undefined
        : await session.db.find(personSkills, request.id);
      const linkPerson = link
        ? await session.db.find(persons, link.personId)
        : undefined;

      const panel = carrier
        ? { person: carrier, link: null }
        : link && linkPerson && linkPerson.archivedAt === null
          ? { person: linkPerson, link }
          : null;

      /* Arbitrage (d) : les compétences sont une propriété du centre. Le panneau
         est absent pour un intervenant côté entité — et l'action le refuse de
         son côté, ce qui est le seul contrôle qui protège. */
      if (!panel || panel.person.kind !== "center") return null;

      const held = panel.link;

      /* Les deux référentiels, avec l'exception nominative sur ce que la liaison
         porte déjà. En pose, `skills` est proposé entier (non archivé) ; en
         correction, il n'est pas lu du tout — rien ne s'y choisit. */
      const [skillRows, levelRows, heldSkill] = await Promise.all([
        held
          ? []
          : session.db.list(skills, {
              orderBy: [asc(skills.position), asc(skills.label)],
            }),
        session.db.list(skillLevels, {
          ...(held
            ? {
                includeArchived: true,
                where: or(
                  isNull(skillLevels.archivedAt),
                  eq(skillLevels.id, held.levelId),
                ),
              }
            : {}),
          orderBy: [asc(skillLevels.rank), asc(skillLevels.label)],
        }),
        held ? session.db.find(skills, held.skillId) : undefined,
      ]);

      /* Une liaison dont la compétence a quitté le domaine n'est pas
         corrigeable : on ne saurait pas dire de quoi l'on parle. */
      if (held && !heldSkill) return null;

      return {
        titleId: "panneau-maitrise-titre",
        title: held ? "Modifier le niveau" : "Ajouter une compétence",
        subtitles: [panel.person.fullName],
        body: (
          <SkillPanel
            action={
              held
                ? updatePersonSkill.bind(null, held.id)
                : createPersonSkill.bind(null, panel.person.id)
            }
            skills={skillRows.map((skill) => ({
              id: skill.id,
              label: skill.label,
            }))}
            levels={levelRows.map((level) => ({
              id: level.id,
              label: level.label,
            }))}
            {...(held && heldSkill
              ? {
                  skillLabel: heldSkill.label,
                  submitLabel: "Enregistrer les modifications",
                  initial: toPersonSkillFormValues(held),
                }
              : {})}
          />
        ),
      };
    }

    /* ------------------------------------------------------------------ */
    case "access": {
      /* Le droit d'abord — il ne dépend d'aucun identifiant —, puis la forme de
         l'UUID **avant** la base : une colonne `uuid` interrogée avec n'importe
         quoi rend une erreur PostgreSQL, donc un 500, là où l'on attend la page
         nue. */
      if (!session.can.manageDomain || !isUuid(request.id)) return null;

      /* La personne est confrontée au domaine et à son archivage : une ligne
         rangée ne reçoit pas d'accès (garde-fou 3), et c'est **aussi** le refus
         d'`openPerson` dans l'action — le seul contrôle qui protège. */
      const row = await session.db.find(persons, request.id);
      const person = row && row.archivedAt === null ? row : null;

      /* Un intervenant côté entité ne reçoit jamais d'accès (`docs/05` §4, D2) :
         le panneau n'existe pas pour lui, et `openPersonForAccess` le refuse de
         son côté. */
      if (!person || person.kind !== "center") return null;

      const lastManager = await isLastDomainManager(session, person);

      return {
        titleId: "panneau-acces-titre",
        title: person.hasAccess ? "Modifier le rôle" : "Accorder l'accès",
        subtitles: [person.fullName],
        body: (
          <AccessPanel
            action={grantPersonAccess.bind(null, person.id)}
            email={person.email}
            lastManager={lastManager}
            {...(person.hasAccess
              ? {
                  submitLabel: "Enregistrer le rôle",
                  initial: toPersonAccessFormValues(person),
                }
              : {})}
          />
        ),
      };
    }

    /* ------------------------------------------------------------------ */
    case "invite": {
      /* **L'ordre d'`access`, à la lettre** : le droit d'abord, il ne dépend
         d'aucun identifiant ; puis la forme de l'UUID **avant** la base, une
         colonne `uuid` interrogée avec n'importe quoi rendant une erreur
         PostgreSQL, donc un 500, là où l'on attend la page nue. */
      if (!session.can.manageDomain || !isUuid(request.id)) return null;

      const row = await session.db.find(persons, request.id);
      const person = row && row.archivedAt === null ? row : null;

      /* Un intervenant côté entité ne reçoit jamais d'accès (`docs/05` §4, D2),
         donc jamais d'invitation : le panneau n'existe pas pour lui, et
         `openPersonForAccess` le refuse de son côté. */
      if (!person || person.kind !== "center") return null;

      /* **Les deux refus qui rendent le geste sans objet ferment le panneau**,
         plutôt que d'ouvrir un formulaire dont la soumission dirait non. Les
         deux vivent **aussi** dans l'action, qui seule protège. */
      if (person.hasAccess) return null;
      if (await pendingInvitationOf(session, person.id)) return null;

      return {
        titleId: "panneau-invitation-titre",
        title: "Inviter",
        subtitles: [person.fullName],
        body: (
          <InvitationPanel
            action={invitePerson.bind(null, person.id)}
            email={person.email}
            expiryDays={INVITATION_TTL_DAYS}
          />
        ),
      };
    }

    /* ------------------------------------------------------------------ */
    case "archive": {
      /* On ne confirme pas l'archivage de ce qui est déjà rangé. Qui n'a pas le
         droit obtient la page nue — pas un 404 : la liste reste lisible par tout
         le domaine (D9), seul le panneau disparaît. */
      if (!session.can.manageDomain || !isUuid(request.id)) return null;

      const row = await session.db.find(persons, request.id);
      if (!row || row.archivedAt !== null) return null;

      return {
        titleId: "panneau-confirmation-titre",
        title: "Archiver cette personne",
        subtitles: [row.fullName],
        /* L'action est liée **côté serveur** à la personne courante :
           l'identifiant sort de la saisie. Ce n'est pas un verrou — Next
           sérialise les arguments liés dans un champ `$ACTION_…`, réécrivable.
           Le verrou est dans l'action, qui interroge `manageDomain` puis
           rapproche la personne reçue du domaine courant. */
        body: (
          <ConfirmPanel
            action={archivePerson.bind(null, row.id)}
            submitLabel="Archiver cette personne"
            pendingLabel="Archivage…"
          >
            <div className="flex flex-col gap-3 text-sm text-content-neutral-dark">
              <p>
                Cette personne disparaît du référentiel Équipe et des personnes
                proposées à l&apos;équipe d&apos;un accompagnement. Rien
                n&apos;est supprimé.
              </p>
              <p>
                Elle reste affichée dans l&apos;équipe des accompagnements
                qu&apos;elle a menés, avec ses compétences : c&apos;est la
                mémoire du centre, elle ne se perd pas.
              </p>
              <p>
                Le geste ne se défait pas depuis cet écran — il n&apos;y a pas de
                page personne.
              </p>
            </div>
          </ConfirmPanel>
        ),
      };
    }

    /* ------------------------------------------------------------------ */
    case "delete": {
      /* **L'archivage n'est pas regardé**, à la différence du cas ci-dessus :
         ranger puis effacer est le chemin naturel, et exiger un rétablissement
         avant la suppression serait un détour sans raison. C'est la règle
         d'`openPersonForDelete`, dans l'action — et c'est l'action qui protège.

         Qui n'a pas le droit obtient la page nue : la liste reste lisible par
         tout le domaine (D9), seul le panneau disparaît. */
      if (!session.can.manageDomain || !isUuid(request.id)) return null;

      const row = await session.db.find(persons, request.id);
      if (!row) return null;

      /* Les deux décomptes sont **lus ici pour être dits** : le panneau annonce
         ce qui s'oppose au geste avant qu'on l'exerce, plutôt que de le refuser
         après coup. Ils ne décident de rien — `deletePerson` recompte sur ce
         qu'elle reçoit, et les deux clés `restrict` tranchent en dernier. */
      const [members, participations, carried] = await Promise.all([
        session.db.count(projectMembers, {
          where: eq(projectMembers.personId, row.id),
        }),
        session.db.count(activityParticipants, {
          where: eq(activityParticipants.personId, row.id),
        }),
        session.db.count(personSkills, {
          where: eq(personSkills.personId, row.id),
        }),
      ]);

      const opposition = opposingTrace(members, participations);

      return {
        titleId: "panneau-confirmation-titre",
        title: "Supprimer cette personne",
        subtitles: [row.fullName],
        body: (
          <ConfirmPanel
            action={deletePerson.bind(null, row.id)}
            submitLabel="Supprimer définitivement"
            pendingLabel="Suppression…"
          >
            <div className="flex flex-col gap-3 text-sm text-content-neutral-dark">
              <p className="font-semibold">
                Ce geste ne se défait pas. La ligne est effacée de la base, elle
                n&apos;est pas rangée.
              </p>
              <p>
                Il n&apos;existe que pour une personne créée par erreur — un
                doublon, une faute de frappe corrigée en créant une seconde
                ligne. Une personne qui a accompagné s&apos;archive.
              </p>

              {/* La conséquence la moins visible, et la plus surprenante : elle
                  s'écrit. Ce que la personne a créé ne disparaît pas — son nom
                  s'en retire. */}
              <p>
                Ce qu&apos;elle a créé reste, sans son nom : les lignes du
                journal gardent leur phrase et perdent leur auteur.
              </p>

              {carried > 0 ? (
                <p>
                  {carried > 1
                    ? `Ses ${carried} compétences déclarées sont effacées avec elle.`
                    : "Sa compétence déclarée est effacée avec elle."}
                </p>
              ) : null}

              {opposition ? (
                <p className="font-semibold">{opposition}</p>
              ) : (
                <p>Rien ne la référence : le geste passera.</p>
              )}
            </div>
          </ConfirmPanel>
        ),
      };
    }
  }
}

/**
 * La traduction des paramètres d'URL en demande — le chemin qui reste ouvert.
 *
 * **Le vocabulaire d'URL vit ici et nulle part ailleurs.** Chaque clé garde le
 * sens que `lib/navigation.ts` lui donne : `personne` est **toujours** un
 * identifiant — la fiche, en lecture ; `profil` porte le cas dans sa valeur,
 * `nouveau` créant et un identifiant corrigeant ; `maitrise` désigne toujours
 * une cible, dont la table change ; `archiver` désigne la personne à ranger,
 * `/equipe` n'ayant pas d'objet de page. Une valeur qui ne désigne rien n'ouvre
 * rien — c'est `isUuid`, dans la résolution, qui le tranche.
 *
 * **`competence` n'est pas ici, et c'est tout le sujet** : c'est une clé de
 * **filtre** depuis T5bis.3, répétable, dont la valeur est un identifiant de
 * `skills`. Le panneau de compétence a donc pris `maitrise` — la note de
 * `SKILL_PANEL_PARAM` dit pourquoi.
 */
export function teamRequestFromParams(asked: {
  personne?: string | undefined;
  profil?: string | undefined;
  maitrise?: string | undefined;
  acces?: string | undefined;
  inviter?: string | undefined;
  archiver?: string | undefined;
  supprimer?: string | undefined;
}): TeamDrawerRequest | null {
  if (asked.personne !== undefined) {
    return { kind: "personDetail", id: asked.personne };
  }

  if (asked.profil !== undefined) {
    return asked.profil === PERSON_FORM_NEW
      ? { kind: "person" }
      : { kind: "person", id: asked.profil };
  }

  if (asked.maitrise !== undefined) {
    return { kind: "skill", id: asked.maitrise };
  }

  /* `acces` désigne **toujours** une personne : accorder l'accès et changer le
     rôle sont le même geste sur la même cible, et il n'y a donc pas de valeur
     d'ouverture fixe à distinguer d'un identifiant. */
  if (asked.acces !== undefined) {
    return { kind: "access", id: asked.acces };
  }

  /* `inviter` désigne **toujours** une personne, comme `acces` : on invite
     quelqu'un, jamais une invitation. La révocation n'a pas de clé — c'est un
     formulaire nu sur la fiche, la forme du retrait d'accès. */
  if (asked.inviter !== undefined) {
    return { kind: "invite", id: asked.inviter };
  }

  if (asked.archiver !== undefined) {
    return { kind: "archive", id: asked.archiver };
  }

  /* `supprimer` désigne la personne à effacer, comme `archiver` désigne celle à
     ranger : `/equipe` n'a pas d'objet de page. Sur la page projet, la même clé
     porte une valeur fixe — la page y a un objet. */
  if (asked.supprimer !== undefined) {
    return { kind: "delete", id: asked.supprimer };
  }

  return null;
}

/**
 * Les clés d'URL qui ouvrent un panneau **sur la page Équipe**.
 *
 * **Les cinq clés de filtre n'y sont pas**, et c'est tout leur sens : `q`,
 * `metier`, `competence`, `niveau` et `dispo` n'ouvrent rien, et les balayer à
 * la fermeture d'un panneau défairait la recherche qui l'a produite. C'est la
 * distinction que `de` et `a` tiennent déjà sur la page produit — et c'est la
 * raison pour laquelle le panneau de compétence n'a pas pu prendre `competence`.
 */
export const TEAM_PANEL_PARAMS = [
  PERSON_PANEL_PARAM,
  PERSON_FORM_PARAM,
  SKILL_PANEL_PARAM,
  PERSON_ACCESS_PARAM,
  PERSON_INVITE_PARAM,
  ARCHIVE_PANEL_PARAM,
  DELETE_PANEL_PARAM,
] as const;
