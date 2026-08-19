/**
 * La résolution des quatre panneaux de la page Équipe — T5bis.4, puis T5bis.6.
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
 * **Une lecture, trois écritures.** `personDetail` ne passe par aucun droit
 * (D9) : la fiche se lit par tout le domaine, comme la liste qui la porte, et ce
 * sont ses **six gestes** qui tombent avec `manageDomain`, chacun à `null`. Les
 * trois autres panneaux, eux, ne s'ouvrent qu'à qui peut écrire (arbitrage (c)).
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

import { PersonPanel } from "@/components/team/person-panel";
import {
  PersonDetail,
  PersonDetailHeader,
} from "@/components/team/person-detail";
import { SkillPanel } from "@/components/team/skill-panel";
import { ConfirmPanel } from "@/components/ui/confirm-panel";
import type { Session } from "@/lib/auth/session";
import { jobs, personSkills, persons, skillLevels, skills } from "@/lib/db/schema";
import type { DrawerContent, TeamDrawerRequest } from "@/lib/drawers/types";
import { toPersonFormValues } from "@/lib/forms/person";
import { toPersonSkillFormValues } from "@/lib/forms/person-skill";
import {
  ARCHIVE_PANEL_PARAM,
  PERSON_FORM_NEW,
  PERSON_FORM_PARAM,
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
  removePersonSkill,
  updatePerson,
  updatePersonSkill,
} from "@/app/(app)/equipe/actions";

import { asc, eq, isNull, or } from "drizzle-orm";

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
            addSkillHref={canCarry ? ROUTES.teamSkillNew(person.id) : null}
            editSkillHref={canCarry ? ROUTES.teamSkillEdit : null}
            removeSkill={canCarry ? removePersonSkill : null}
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
  archiver?: string | undefined;
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

  if (asked.archiver !== undefined) {
    return { kind: "archive", id: asked.archiver };
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
  ARCHIVE_PANEL_PARAM,
] as const;
