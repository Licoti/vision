/**
 * La résolution des panneaux de la page projet — TD.2.
 *
 * **Sans le compte**, et c'est le geste de T6.1 sur `scoped.ts` : la phrase
 * disait « les six » quand ils étaient sept depuis le 20/08/2026, et ils sont
 * huit depuis T6.5. Un nombre dans un commentaire vieillit à chaque ticket ; ce
 * qui se relit ici est la **règle**, que le `switch` tient branche par branche.
 *
 * **Jumeau de `lib/drawers/product.tsx`, et pour les mêmes raisons.** Rien
 * n'est inventé ici : tout vient de `app/(app)/projets/[id]/page.tsx`, où la
 * logique vivait entre le décompte d'exclusivité et le rendu. Elle en sort
 * parce que **deux chemins doivent y passer** — l'URL, qui reste une adresse
 * valide, et le clic, qui ne l'écrit plus.
 *
 * **La discipline des lectures conditionnelles est tenue à la lettre** (T3.3) :
 * les référentiels — types d'activité, approches, personnes, outils,
 * indicateurs adoptables — ne se lisent que si le panneau qui les emploie
 * s'ouvre. La page la plus consultée du produit ne payait pas ces requêtes pour
 * un panneau fermé ; elle ne les paie pas davantage maintenant, et l'ouverture
 * ne paie que les siennes.
 *
 * **Les exceptions nominatives passent intactes** (T4bis.1, T4bis.5, T4bis.6) :
 * la valeur déjà portée par la ligne éditée reste dans sa liste — donc
 * sélectionnée — même archivée depuis. Elles dépendent de la ligne cliquée, et
 * c'est précisément ce qu'un panneau qui se remplirait de données pré-chargées
 * n'aurait pas su faire.
 */

import { ActivityPanel } from "@/components/projects/activity-panel";
import { AdoptionPanel } from "@/components/projects/adoption-panel";
import { BudgetPanel } from "@/components/projects/budget-panel";
import { LinkPanel } from "@/components/projects/link-panel";
import {
  ResourcePanel,
  type ResourceActivityOption,
} from "@/components/projects/resource-panel";
import { ResultPanel } from "@/components/projects/result-panel";
import { StarterDetail } from "@/components/projects/starter-detail";
import { ConfirmPanel } from "@/components/ui/confirm-panel";
import { borderOf, CONTROL, FormField } from "@/components/ui/form-field";
import type { Session } from "@/lib/auth/session";
import {
  activities,
  projectIndicators,
  projectLinks,
  resources,
} from "@/lib/db/schema";
import { toActivityFormValues } from "@/lib/forms/activity";
import { toAdoptionFormValues } from "@/lib/forms/adoption";
import { toBudgetFormValues } from "@/lib/forms/budget";
import { toLinkFormValues } from "@/lib/forms/link";
import { toResourceFormValues } from "@/lib/forms/resource";
import { toResultFormValues } from "@/lib/forms/result";
import { formatActivityPeriod } from "@/lib/format";
import {
  ACTIVITY_PANEL_NEW,
  ACTIVITY_PANEL_PARAM,
  ARCHIVE_PANEL_CONFIRM,
  ARCHIVE_PANEL_PARAM,
  BUDGET_PANEL_ENTRY,
  BUDGET_PANEL_PARAM,
  CANCEL_PANEL_PARAM,
  INDICATOR_PANEL_NEW,
  INDICATOR_PANEL_PARAM,
  LINK_PANEL_NEW,
  LINK_PANEL_PARAM,
  RESOURCE_PANEL_NEW,
  RESOURCE_PANEL_PARAM,
  RESULT_PANEL_PARAM,
  ROUTES,
  STARTER_PANEL_PARAM,
} from "@/lib/navigation";
import type { DrawerContent, ProjectDrawerRequest } from "@/lib/drawers/types";
import {
  listActivityFormOptions,
  listActivityParticipantIds,
  listProjectRoadmap,
  listResultToolOptions,
} from "@/lib/queries/activities";
import type { RoadmapGroup } from "@/lib/queries/activities";
import { findProjectBudget } from "@/lib/queries/budgets";
import { listAdoptableIndicators } from "@/lib/queries/indicators";
import { listLinkableProjects } from "@/lib/queries/links";
import type { ProjectDetail } from "@/lib/queries/projects";
import { findResourceActivity } from "@/lib/queries/resources";
import {
  findStarter,
  listStarters,
  type DomainStarter,
} from "@/lib/queries/starters";
import { isUuid } from "@/lib/uuid";

import { archiveProject } from "@/app/(app)/projets/actions";
import {
  cancelActivity,
  createActivity,
  createAdoption,
  createProjectLink,
  createResource,
  createResult,
  saveProjectBudget,
  updateActivity,
  updateAdoption,
  updateProjectLink,
  updateResource,
  updateResult,
} from "@/app/(app)/projets/[id]/actions";

/**
 * Ce que la résolution a besoin de savoir, et que la page a déjà lu.
 *
 * **La roadmap et rien d'autre** : c'est elle qui décide de la cible d'un
 * résultat et de celle d'une annulation, et c'est d'elle que se dérivent les
 * activités proposées au rattachement d'une ressource — sans aucune lecture
 * neuve, la propriété de T4.4 tenue depuis.
 */
export type ProjectDrawerContext = {
  /**
   * Le droit d'écrire sur cet accompagnement, archivage compris : un seul point
   * de bascule fait tomber ensemble **tous** les panneaux d'écriture (T4bis.3,
   * arbitrage (a)) — le budget de T7.1 compris, sans qu'une condition se soit
   * ajoutée. `starter` est le seul à ne pas le consulter : il lit.
   *
   * **Sans le compte**, comme l'en-tête de ce module : la phrase disait « les
   * six », ils sont sept depuis T7.1.
   */
  canWrite: boolean;
  roadmap: readonly RoadmapGroup[];
  /**
   * Les pistes de démarrage du domaine (20/08/2026) — lues seulement quand le
   * panneau qui les emploie s'ouvre, comme la roadmap.
   */
  starters: readonly DomainStarter[];
};

export async function loadProjectDrawerContext(
  session: Session,
  project: ProjectDetail,
  request: ProjectDrawerRequest,
): Promise<ProjectDrawerContext> {
  const canWrite =
    session.can.writeProject(project.id) && project.archivedAt === null;

  /* La roadmap n'est lue que par ceux qui s'en servent. `archive`, `adoption`
     et `activity` n'en ont rien à faire — la discipline de T3.3, appliquée à
     l'ouverture au lieu de la page. */
  const needsRoadmap =
    request.kind === "result" ||
    request.kind === "cancel" ||
    request.kind === "resource";

  /* Le référentiel des pistes ne se lit que pour le panneau qui l'emploie —
     la même discipline, et une lecture de moins pour les six autres. */
  const needsStarters = request.kind === "starter";

  const [roadmap, starters] = await Promise.all([
    needsRoadmap ? listProjectRoadmap(session.db, project.id) : [],
    needsStarters ? listStarters(session.db) : [],
  ]);

  return { canWrite, roadmap, starters };
}

export async function resolveProjectDrawer(
  session: Session,
  project: ProjectDetail,
  context: ProjectDrawerContext,
  request: ProjectDrawerRequest,
): Promise<DrawerContent | null> {
  switch (request.kind) {
    /* ------------------------------------------------------------------ */
    case "archive": {
      if (!session.can.manageDomain || project.archivedAt !== null) return null;
      return {
        titleId: "panneau-confirmation-titre",
        title: "Archiver cet accompagnement",
        subtitles: [project.name],
        body: (
          <ConfirmPanel
            action={archiveProject.bind(null, project.id)}
            submitLabel="Archiver cet accompagnement"
            pendingLabel="Archivage…"
          >
            <div className="flex flex-col gap-3 text-sm text-content-neutral-dark">
              <p>
                Cet accompagnement disparaît de la liste des projets et de la
                page de son produit. Rien n&apos;est supprimé.
              </p>
              <p>
                Sa page reste lisible par son adresse, avec sa roadmap, ses
                ressources et ses résultats : c&apos;est la mémoire du centre,
                elle ne se perd pas.
              </p>
              <p>
                Plus aucune saisie n&apos;y est possible tant qu&apos;il est
                archivé — ni activité, ni ressource, ni résultat.
              </p>
              <p>
                Le geste se défait : « Rétablir » ramène l&apos;accompagnement.
              </p>
            </div>
          </ConfirmPanel>
        ),
      };
    }

    /* ------------------------------------------------------------------ */
    case "cancel": {
      /* **La cible se lit dans la roadmap déjà chargée** : aucune lecture ne
         s'ajoute, et la même donnée décide du lien dans la carte et de
         l'ouverture du panneau — une demande forgée n'ouvre jamais rien de plus
         que ce que l'écran propose. Les trois groupes retenus sont ceux d'où
         `canTransitionActivity` autorise encore l'annulation. */
      if (!context.canWrite || !isUuid(request.id)) return null;
      const target =
        context.roadmap
          .filter(
            (group) =>
              group.key === "planned" ||
              group.key === "unscheduled" ||
              group.key === "in_progress",
          )
          .flatMap((group) => group.activities)
          .find((entry) => entry.id === request.id) ?? null;
      if (!target) return null;

      return {
        titleId: "panneau-confirmation-titre",
        title: "Annuler cette activité",
        subtitles: [
          `${target.typeLabel} · ${formatActivityPeriod(
            target.periodStart,
            target.periodEnd,
            target.isUnscheduled,
          )}`,
        ],
        body: (
          <ConfirmPanel
            action={cancelActivity.bind(null, target.id)}
            submitLabel="Confirmer l'annulation"
            pendingLabel="Annulation…"
          >
            <div className="flex flex-col gap-3 text-sm text-content-neutral-dark">
              <p>
                Cette activité passe au groupe « Annulé » de la roadmap, replié
                en bas du bloc. Elle reste lisible : annuler dit qu&apos;elle ne
                se fera pas, pas qu&apos;elle n&apos;a jamais été prévue.
              </p>
              <p>
                Le geste ne se défait pas — une activité annulée ne revient à
                aucun état antérieur. Une saisie faite par erreur s&apos;archive
                plutôt qu&apos;elle ne s&apos;annule.
              </p>
            </div>

            {/* Le motif est la seule saisie de ce panneau, et il est
                obligatoire : `activities_cancelled_requires_reason` le pose en
                base, `required` l'empêche côté écran, et l'action le revérifie
                sur ce qu'elle reçoit. */}
            <FormField
              label="Motif"
              htmlFor="motif-annulation"
              note="Ce que la roadmap affichera à la place des gestes de l'activité."
              errorId="motif-annulation-erreur"
              required
            >
              <input
                id="motif-annulation"
                name="cancellationReason"
                type="text"
                required
                className={`${CONTROL} ${borderOf(undefined)}`}
              />
            </FormField>
          </ConfirmPanel>
        ),
      };
    }

    /* ------------------------------------------------------------------ */
    case "result": {
      /* **Aucune lecture en base pour décider de la cible** : elle se cherche
         dans la roadmap, et toutes les conditions de la fiche s'y lisent d'un
         coup. La correction ne demande que l'existence du résultat, là où la
         saisie garde les quatre conditions (arbitrage du 15/08/2026). */
      if (!context.canWrite || !isUuid(request.id)) return null;
      const target =
        context.roadmap
          .flatMap((group) =>
            group.activities.map((entry) => ({ key: group.key, entry })),
          )
          .find(
            ({ key, entry }) =>
              entry.id === request.id &&
              (entry.result !== null ||
                (key === "done" && entry.producesResult)),
          )?.entry ?? null;
      if (!target) return null;

      /* **L'exception nominative de T4bis.6** : l'outil déjà porté par le
         résultat corrigé reste dans la liste — donc sélectionné — et
         n'apparaît nulle part ailleurs. Sans elle, un outil archivé depuis
         retomberait sur « Aucun », et la première re-soumission détacherait le
         résultat de son outil **en silence**. */
      const tools = await listResultToolOptions(
        session.db,
        target.result?.toolId ? { keepToolId: target.result.toolId } : {},
      );

      return {
        titleId: "panneau-resultat-titre",
        title: target.result ? "Corriger le résultat" : "Saisir un résultat",
        subtitles: [
          `${target.typeLabel} · ${formatActivityPeriod(
            target.periodStart,
            target.periodEnd,
            target.isUnscheduled,
          )}`,
          project.name,
        ],
        body: (
          <ResultPanel
            action={
              target.result
                ? updateResult.bind(
                    null,
                    project.id,
                    target.id,
                    target.result.id,
                  )
                : createResult.bind(null, project.id, target.id)
            }
            tools={tools}
            {...(target.result
              ? {
                  submitLabel: "Enregistrer les modifications",
                  initial: toResultFormValues(target.result),
                }
              : {})}
          />
        ),
      };
    }

    /* ------------------------------------------------------------------ */
    case "adoption": {
      if (!context.canWrite) return null;

      /* Aucune condition d'archivage, à la différence de la ressource :
         `project_indicators` n'a pas de colonne `archived_at` — une liaison ne
         s'archive pas, elle se défait (arbitrage (f)). */
      const row =
        request.id && isUuid(request.id)
          ? await session.db.find(projectIndicators, request.id)
          : undefined;
      const adoption = row && row.projectId === project.id ? row : null;
      if (request.id && !adoption) return null;

      /* **L'exception nominative vit dans la requête** : `keepIndicatorId`
         couvre les deux exclusions d'un seul chemin — l'indicateur de
         l'adoption éditée est déjà adopté, et il a pu être archivé. */
      const indicators = await listAdoptableIndicators(
        session.db,
        project.id,
        project.productId,
        adoption ? { keepIndicatorId: adoption.indicatorId } : {},
      );

      return {
        titleId: "panneau-adoption-titre",
        title: adoption ? "Modifier l'adoption" : "Adopter un indicateur",
        subtitles: [project.name],
        body: (
          <AdoptionPanel
            productHref={ROUTES.product(project.productId)}
            action={
              adoption
                ? updateAdoption.bind(null, project.id, adoption.id)
                : createAdoption.bind(null, project.id)
            }
            indicators={indicators}
            {...(adoption
              ? {
                  submitLabel: "Enregistrer les modifications",
                  initial: toAdoptionFormValues(adoption),
                }
              : {})}
          />
        ),
      };
    }

    /* ------------------------------------------------------------------ */
    case "resource": {
      if (!context.canWrite) return null;

      const row =
        request.id && isUuid(request.id)
          ? await session.db.find(resources, request.id)
          : undefined;
      const resource =
        row && row.projectId === project.id && row.archivedAt === null
          ? row
          : null;
      if (request.id && !resource) return null;

      /* **Aucune requête neuve** : les activités proposées se dérivent de la
         roadmap déjà lue. Le groupe « Annulé » est écarté — une activité
         abandonnée n'a rien produit. On décrit, on ne propose pas. */
      const options: ResourceActivityOption[] = context.roadmap
        .filter((group) => group.key !== "cancelled")
        .flatMap((group) =>
          group.activities.map((entry) => ({
            id: entry.id,
            label: `${entry.typeLabel} · ${formatActivityPeriod(
              entry.periodStart,
              entry.periodEnd,
              entry.isUnscheduled,
            )}`,
          })),
        );

      /* **L'exception nominative de T4bis.5**, qui couvre d'un seul chemin les
         deux activités que les options n'ont pas : l'**archivée**, absente de
         la roadmap, et l'**annulée**, que le filtre écarte. Sans elle, le
         `select` retomberait sur « Aucune » et la première re-soumission
         détacherait la ressource **en silence**. */
      const kept =
        resource?.activityId &&
        !options.some((option) => option.id === resource.activityId)
          ? await findResourceActivity(
              session.db,
              project.id,
              resource.activityId,
            )
          : null;

      if (kept) {
        options.push({
          id: kept.id,
          label: `${kept.typeLabel} · ${formatActivityPeriod(
            kept.periodStart,
            kept.periodEnd,
            kept.isUnscheduled,
          )}`,
        });
      }

      return {
        titleId: "panneau-ressource-titre",
        title: resource ? "Modifier la ressource" : "Relier une ressource",
        subtitles: [project.name],
        body: (
          <ResourcePanel
            action={
              resource
                ? updateResource.bind(null, project.id, resource.id)
                : createResource.bind(null, project.id)
            }
            activities={options}
            {...(resource
              ? {
                  submitLabel: "Enregistrer les modifications",
                  initial: toResourceFormValues(resource),
                }
              : {})}
          />
        ),
      };
    }

    /* ------------------------------------------------------------------ */
    case "activity": {
      if (!context.canWrite) return null;

      /* L'activité est confrontée au projet, à l'archivage et à l'annulation :
         la roadmap n'affiche aucune des deux dernières, donc aucun lien n'y
         mène, mais une demande se forge. */
      const row =
        request.id && isUuid(request.id)
          ? await session.db.find(activities, request.id)
          : undefined;
      const activity =
        row &&
        row.projectId === project.id &&
        row.archivedAt === null &&
        row.state !== "cancelled"
          ? row
          : null;
      if (request.id && !activity) return null;

      /* Les référentiels — dont les personnes, depuis T3.6 — ne sont lus que
         si ce panneau s'ouvre. En correction, le type de l'activité éditée est
         conservé **même s'il a été archivé depuis** : décrire et proposer
         n'appellent pas le même filtre (règle de T2.6). Les participants déjà
         liés ne se lisent qu'en correction — une création n'en a aucun. */
      const [options, participantIds] = await Promise.all([
        listActivityFormOptions(
          session.db,
          activity ? { keepActivityTypeId: activity.activityTypeId } : {},
        ),
        activity
          ? listActivityParticipantIds(session.db, activity.id)
          : Promise.resolve<string[]>([]),
      ]);

      return {
        titleId: "panneau-activite-titre",
        title: activity ? "Modifier l'activité" : "Nouvelle activité",
        subtitles: [project.name],
        body: (
          <ActivityPanel
            action={
              activity
                ? updateActivity.bind(null, project.id, activity.id)
                : createActivity.bind(null, project.id)
            }
            activityTypes={options.activityTypes}
            approaches={options.approaches}
            persons={options.persons}
            {...(activity
              ? {
                  submitLabel: "Enregistrer les modifications",
                  initial: toActivityFormValues({
                    ...activity,
                    participantIds,
                  }),
                }
              : {})}
          />
        ),
      };
    }

    /* ------------------------------------------------------------------ */
    case "link": {
      if (!context.canWrite) return null;

      /* Aucune condition d'archivage, comme l'adoption : `project_links` n'a
         pas de colonne `archived_at` — une liaison ne s'archive pas, elle se
         défait (arbitrage (f)).

         **`fromProjectId` et non `toProjectId`** : c'est l'asymétrie de
         l'arbitrage (g). Le lien s'affiche sur les deux pages, il ne se corrige
         que depuis celle d'où il part — et une demande se forge, donc la
         condition vit ici comme elle vit dans `openLink`. */
      const row =
        request.id && isUuid(request.id)
          ? await session.db.find(projectLinks, request.id)
          : undefined;
      const link = row && row.fromProjectId === project.id ? row : null;
      if (request.id && !link) return null;

      /* **L'exception nominative vit dans la requête** : `keepProjectId` couvre
         les deux exclusions d'un seul chemin — la cible du lien édité est déjà
         reliée, et elle a pu être archivée depuis. */
      const linkable = await listLinkableProjects(
        session.db,
        project.id,
        link ? { keepProjectId: link.toProjectId } : {},
      );

      return {
        titleId: "panneau-lien-titre",
        title: link ? "Modifier le lien" : "Déclarer un lien",
        subtitles: [project.name],
        body: (
          <LinkPanel
            action={
              link
                ? updateProjectLink.bind(null, project.id, link.id)
                : createProjectLink.bind(null, project.id)
            }
            projects={linkable}
            {...(link
              ? {
                  submitLabel: "Enregistrer les modifications",
                  initial: toLinkFormValues(link),
                }
              : {})}
          />
        ),
      };
    }

    /* ------------------------------------------------------------------ */
    /* Le budget — T7.1, et la dernière promesse de `docs/06` §5.

       **Une seule branche pour les deux gestes**, là où `resource`, `adoption`
       et `link` en portent deux : un projet a **au plus un** budget
       (`budgets_project_unique`), si bien qu'il n'y a rien à rapprocher de la
       page — la ligne se cherche par le projet, jamais par un identifiant reçu.
       Il n'y a donc pas non plus de demande forgée à écarter ici : ce que la
       valeur d'URL ne porte pas ne se falsifie pas.

       **`canWrite` et rien d'autre** : le droit est `writeProject`, jamais
       `manageDomain` (arbitrage (e) de `tickets-C7.md`) — le budget est une
       propriété de l'**accompagnement**, ce qui le sépare de la vision produit.
       C'est le même point de bascule que les six panneaux d'écriture qui
       précèdent, **et aucune condition ne s'ajoute ici**. */
    case "budget": {
      if (!context.canWrite) return null;

      /* La ligne est lue ici, et non dans le contexte : la discipline des
         lectures conditionnelles de T3.3 vaut pour ce panneau comme pour les
         autres — les huit qui ne l'ouvrent pas ne la paient pas. */
      const budget = await findProjectBudget(session.db, project.id);

      /* **L'exception nominative de T4bis.6**, transposée au budget : l'outil
         déjà porté reste dans la liste — donc sélectionné — même archivé
         depuis. Sans elle, il retomberait sur « Aucun » et la première
         re-soumission détacherait le budget de son outil **en silence**. Une
         saisie n'en passe aucune : elle n'a aucune valeur antérieure à
         préserver. */
      const tools = await listResultToolOptions(
        session.db,
        budget?.toolId ? { keepToolId: budget.toolId } : {},
      );

      return {
        titleId: "panneau-budget-titre",
        title: budget ? "Corriger le budget" : "Saisir le budget",
        subtitles: [project.name],
        body: (
          <BudgetPanel
            action={saveProjectBudget.bind(null, project.id)}
            tools={tools}
            {...(budget
              ? {
                  submitLabel: "Enregistrer les modifications",
                  initial: toBudgetFormValues(budget),
                }
              : {})}
          />
        ),
      };
    }

    /* ------------------------------------------------------------------ */
    /* Le seul panneau en lecture seule (20/08/2026).

       **Aucun droit ne le garde**, et c'est exact : une piste de démarrage est
       un référentiel du domaine, que D9 ouvre à tout le domaine. Ce qui le
       ferme est la seule chose qui puisse le fermer — que la piste demandée
       n'existe pas, ou qu'elle soit archivée : `listStarters` ne rend que les
       vivantes du domaine courant, et `findStarter` cherche là-dedans.

       La forme de l'UUID est vérifiée avant : une valeur fantaisiste ne doit
       pas atteindre la base, où elle rendrait une erreur PostgreSQL plutôt
       qu'une page nue. La règle tenue par toutes les branches qui précèdent. */
    case "starter": {
      if (!isUuid(request.id)) return null;

      const starter = findStarter(context.starters, request.id);
      if (!starter) return null;

      return {
        titleId: "panneau-piste-titre",
        title: starter.label,
        subtitles: [project.name],
        body: <StarterDetail starter={starter} />,
      };
    }
  }
}

/**
 * La traduction des paramètres d'URL en demande — le jumeau de celui de la page
 * produit, et le vocabulaire d'URL de cette page vit ici et nulle part ailleurs.
 */
export function projectRequestFromParams(asked: {
  activite?: string | undefined;
  ressource?: string | undefined;
  resultat?: string | undefined;
  annuler?: string | undefined;
  archiver?: string | undefined;
  indicateur?: string | undefined;
  piste?: string | undefined;
  lien?: string | undefined;
  budget?: string | undefined;
}): ProjectDrawerRequest | null {
  if (asked.archiver === ARCHIVE_PANEL_CONFIRM) return { kind: "archive" };

  /* La forme d'`archiver`, jusqu'à la comparaison : **une seule valeur
     ouvre**, toute autre n'ouvre rien. Aucune sentinelle à distinguer d'un
     identifiant — un projet n'a qu'un budget, il n'y a rien à désigner. */
  if (asked.budget === BUDGET_PANEL_ENTRY) return { kind: "budget" };
  if (asked.annuler !== undefined) return { kind: "cancel", id: asked.annuler };
  if (asked.resultat !== undefined)
    return { kind: "result", id: asked.resultat };

  if (asked.indicateur !== undefined) {
    return asked.indicateur === INDICATOR_PANEL_NEW
      ? { kind: "adoption" }
      : { kind: "adoption", id: asked.indicateur };
  }

  if (asked.ressource !== undefined) {
    return asked.ressource === RESOURCE_PANEL_NEW
      ? { kind: "resource" }
      : { kind: "resource", id: asked.ressource };
  }

  if (asked.activite !== undefined) {
    return asked.activite === ACTIVITY_PANEL_NEW
      ? { kind: "activity" }
      : { kind: "activity", id: asked.activite };
  }

  if (asked.lien !== undefined) {
    return asked.lien === LINK_PANEL_NEW
      ? { kind: "link" }
      : { kind: "link", id: asked.lien };
  }

  /* Aucune sentinelle : la valeur désigne toujours une piste, il n'y a pas de
     cas « nouvelle » à porter. */
  if (asked.piste !== undefined) return { kind: "starter", id: asked.piste };

  return null;
}

/** Les clés d'URL qui ouvrent un panneau **sur la page projet**. */
export const PROJECT_PANEL_PARAMS = [
  ACTIVITY_PANEL_PARAM,
  RESOURCE_PANEL_PARAM,
  RESULT_PANEL_PARAM,
  CANCEL_PANEL_PARAM,
  ARCHIVE_PANEL_PARAM,
  INDICATOR_PANEL_PARAM,
  STARTER_PANEL_PARAM,
  LINK_PANEL_PARAM,
  BUDGET_PANEL_PARAM,
] as const;
