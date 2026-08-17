/**
 * Projet — la page la plus consultée du produit.
 *
 * Sa segmentation obéit à la règle de `docs/06` §5 : **un récit dominant, des
 * blocs de référence autour.** T2.4 pose l'en-tête d'identité, T3.1 branche la
 * roadmap, T4.1 le premier des blocs de référence — « Ressources », en tête du
 * tableau de `docs/06` §5 et jamais avant le récit. Les quatre suivants restent
 * des états vides annoncés, dans leur ordre définitif — un bloc vide est un
 * écran à part entière, pas une page incomplète (règle 5).
 *
 * Le fil d'Ariane porte les trois maillons de la hiérarchie, le produit
 * cliquable : un projet ne s'affiche jamais sans son parent (`docs/06` §7).
 *
 * L'identifiant vient de l'URL : sa forme est vérifiée avant la base, faute de
 * quoi un paramètre fantaisiste ne produit pas un 404 mais une erreur
 * PostgreSQL, donc un 500. Un projet inconnu — ou d'un autre domaine — rend
 * 404 : la seconde réponse ne se distingue pas de la première, et c'est
 * volontaire.
 *
 * **« Modifier cet accompagnement » n'apparaît qu'au responsable de domaine**
 * (F1-D1, D9) : l'action est absente du rendu pour tout autre, pas grisée. Un
 * contributeur désigné écrit dans le projet — activités, ressources — mais ne
 * modifie pas son identité, qui reste au responsable.
 *
 * **Les panneaux sont cette page, plus un paramètre** (D30, T3.2).
 * `?activite=nouvelle` ouvre le panneau d'activité vide, `?activite=<identifiant>`
 * l'ouvre sur une activité à corriger (T3.4) — une seule clé, dont la valeur
 * porte le cas, et un seul formulaire pour les deux gestes. `?ressource=` a pris
 * la même forme en T4bis.5 : `nouvelle` relie, `<identifiant>` corrige.
 * `?resultat=<identifiant d'activité>` ouvre celui de T4.4 — **et sert les deux
 * gestes depuis T4bis.6 sans changer d'un caractère** : la valeur y désigne la
 * cible, jamais le geste, si bien que la même adresse saisit quand l'activité
 * n'a pas de résultat et corrige quand elle en porte un. `?archiver=confirmation`
 * ouvre le panneau de confirmation de T4bis.2, repris tel quel. La page reste rendue derrière eux, et porte alors l'attribut HTML
 * `inert` — c'est l'ordre du DOM qui décide de la tabulation, et `inert` est ce
 * qui empêche d'entrer au clavier dans le contenu masqué par le voile.
 *
 * **Les quatre clés sont mutuellement exclusives, et le sont par une règle unique :
 * plusieurs présentes ensemble n'ouvrent rien** (T4.2). Deux `role="dialog"` ou
 * deux `inert` concurrents ne se rattrapent pas après coup, et aucune préséance
 * n'est inventée entre des gestes de même rang — c'est déjà ce que la page fait
 * de toute valeur d'`?activite=` qu'elle ne reconnaît pas. T4.4 a tenu la règle
 * et changé son écriture : une comparaison binaire ne se généralise pas à trois
 * clés, un décompte oui — **et c'est ce qui a permis à T4bis.3 d'en ajouter une
 * quatrième sans toucher à l'énoncé.** Un seul `panelOpen`, un seul `inert`, un
 * seul panneau monté : la propriété se lit dans le code, elle ne se déduit pas
 * de quatre conditions éparses.
 *
 * **Le droit décide du rendu, pas seulement de l'affichage d'un bouton.** Un
 * membre non contributeur qui tape l'URL d'ouverture obtient la page nue — pas
 * un 404 : la page projet reste lisible par tout le domaine (D9), seul le
 * panneau disparaît.
 *
 * **Un accompagnement archivé garde sa page** (règle 4, F1-D3, T4bis.3) : elle
 * reste servie **entière** — en-tête, roadmap, ressources, résultats —, mention
 * datée en tête, parce qu'un accompagnement rangé est la mémoire du centre. Ce
 * qui disparaît est l'écriture, et elle disparaît d'un seul point de bascule :
 * `canWrite` porte la lecture seule, si bien que les trois panneaux, les gestes
 * de roadmap et l'ajout de ressource tombent ensemble. Ce n'est pas ce rendu qui
 * protège : `openProject` et `openActivity` refusent le projet archivé **reçu**,
 * un panneau absent n'ayant jamais protégé le point d'entrée HTTP qui
 * l'accompagne.
 *
 * Aucune requête directe : tout passe par `session.db`, déjà scopé sur le
 * domaine courant. Règle 1.
 */

import { notFound } from "next/navigation";
import Link from "next/link";

import {
  archiveActivity,
  archiveResource,
  archiveResult,
  cancelActivity,
  createActivity,
  createAdoption,
  createResource,
  createResult,
  removeAdoption,
  transitionActivity,
  updateActivity,
  updateAdoption,
  updateResource,
  updateResult,
} from "./actions";
import { archiveProject, restoreProject } from "../actions";
import { ActivityPanel } from "@/components/projects/activity-panel";
import { AdoptedIndicators } from "@/components/projects/adopted-indicators";
import { AdoptionPanel } from "@/components/projects/adoption-panel";
import {
  ResourcePanel,
  type ResourceActivityOption,
} from "@/components/projects/resource-panel";
import { ResultPanel } from "@/components/projects/result-panel";
import { Resources } from "@/components/projects/resources";
import { Roadmap } from "@/components/projects/roadmap";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmPanel } from "@/components/ui/confirm-panel";
import { Field, FieldRow } from "@/components/ui/field";
import { borderOf, CONTROL, FormField } from "@/components/ui/form-field";
import { Page, PageHeader } from "@/components/ui/page";
import { Section, SectionHeader } from "@/components/ui/section";
import { StatusDot } from "@/components/ui/status-dot";
import { Tag } from "@/components/ui/tag";
import { requireSession } from "@/lib/auth/provider";
import { activities, projectIndicators, resources } from "@/lib/db/schema";
import { toActivityFormValues } from "@/lib/forms/activity";
import { toAdoptionFormValues } from "@/lib/forms/adoption";
import { toResourceFormValues } from "@/lib/forms/resource";
import { toResultFormValues } from "@/lib/forms/result";
import {
  formatActivityPeriod,
  formatMonth,
  formatPeriod,
  formatRank,
} from "@/lib/format";
import {
  ACTIVITY_PANEL_NEW,
  ARCHIVE_PANEL_CONFIRM,
  INDICATOR_PANEL_NEW,
  RESOURCE_PANEL_NEW,
  ROUTES,
} from "@/lib/navigation";
import {
  listActivityFormOptions,
  listActivityParticipantIds,
  listProjectRoadmap,
  listResultToolOptions,
} from "@/lib/queries/activities";
import {
  listAdoptableIndicators,
  listProjectAdoptions,
} from "@/lib/queries/indicators";
import { findAccompanimentRank, findProjectDetail } from "@/lib/queries/projects";
import {
  findResourceActivity,
  listProjectResources,
} from "@/lib/queries/resources";
import { isUuid } from "@/lib/uuid";

export const metadata = {
  title: "Projet — Vision",
};

/**
 * Les blocs de référence **restants**, dans l'ordre de `docs/06` §5 — fréquence
 * d'usage. « Ressources » les précédait ici jusqu'à T4.1 ; il porte désormais
 * son contenu réel et vit dans `components/projects/resources.tsx`, en première
 * case de la grille. « Indicateurs adoptés » l'a suivi en T5.4, en deuxième
 * case : leur état vide **annoncé** est devenu leur état vide réel, écrit dans
 * leur composant.
 */
const REFERENCE_BLOCKS: { title: string; description: string }[] = [
  {
    title: "Projets liés",
    description:
      "Les autres accompagnements de ce produit s'afficheront ici, puis les liens déclarés vers d'autres projets, chacun avec sa raison.",
  },
  {
    title: "Budget",
    description:
      "La synthèse macro — alloué, consommé — s'affichera ici, avec le lien vers l'outil de gestion. Le suivi budgétaire est tenu là-bas ; Vision renvoie vers la source plutôt que d'en reproduire le détail.",
  },
  {
    title: "Journal",
    description:
      "Qui a modifié quoi, et quand. Une information de contrôle, en dernier : elle sert à retrouver l'origine d'une saisie, pas à comprendre l'accompagnement.",
  },
];

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    activite?: string;
    ressource?: string;
    resultat?: string;
    annuler?: string;
    archiver?: string;
    indicateur?: string;
  }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const session = await requireSession();

  const project = await findProjectDetail(session.db, id);
  if (!project) notFound();

  const archived = project.archivedAt !== null;

  /* D9 — responsable de domaine, ou contributeur désigné de ce projet. La
     règle est déjà écrite dans le contexte de session : elle ne se rejoue pas
     ici.

     **La lecture seule d'un accompagnement archivé tient à ce `&&`** (T4bis.3,
     arbitrage (a)) : un seul point de bascule fait tomber ensemble les trois
     panneaux, les six gestes de roadmap et l'ajout de ressource — tous déjà
     gouvernés par un `| null` que cette page fournit. **T4bis.4 en a ajouté un
     sixième sans qu'une condition s'ajoute ici** : c'est exactement la propriété
     que ce `&&` cherchait. Le rendu n'est pas le verrou pour autant : les deux
     portes de `./actions` refusent le projet archivé reçu. */
  const canWrite = session.can.writeProject(project.id) && !archived;
  const { activite, ressource, resultat, annuler, archiver, indicateur } =
    await searchParams;

  /* L'exclusivité, avant tout le reste : plusieurs clés d'ouverture
     concurrentes n'en ouvrent aucune (T4.2). Tout ce qui suit lit `asked`, pas
     les paramètres bruts, si bien qu'aucun chemin ne peut ouvrir deux panneaux
     à la fois — la garantie est dans le code, pas dans la relecture.

     **La règle n'a pas changé, son écriture si** : T4.2 la posait en une
     comparaison binaire, qui ne se généralise pas à trois clés. Un décompte dit
     la même chose pour trois — et T4bis.3 y a ajouté `archiver` sans toucher à
     l'énoncé, ce qui était précisément la propriété cherchée. **T5.4 y ajoute
     `indicateur` de la même façon** : cinq clés, le même énoncé, et c'est la
     seconde fois que la généralisation est payée par un ticket ultérieur. **Le
     menu contextuel des cartes y ajoute `annuler`** sans plus la toucher :
     sixième clé, même énoncé, troisième fois. */
  const keys = { activite, ressource, resultat, annuler, archiver, indicateur };
  const conflict =
    Object.values(keys).filter((value) => value !== undefined).length > 1;
  const asked: Partial<typeof keys> = conflict ? {} : keys;

  /* Une seule clé, dont la **valeur** porte le cas (T3.2) : `nouvelle` crée,
     un identifiant corrige, tout le reste n'ouvre rien. L'activité est
     confrontée au projet, à l'archivage et à l'annulation — la roadmap n'en
     affiche aucune des deux dernières, donc aucun lien n'y mène, mais une URL
     se tape. Une activité annulée s'édite en T3.5, pas ici. */
  const edited =
    canWrite &&
    asked.activite &&
    asked.activite !== ACTIVITY_PANEL_NEW &&
    isUuid(asked.activite)
      ? await session.db.find(activities, asked.activite)
      : undefined;

  const activity =
    edited &&
    edited.projectId === project.id &&
    edited.archivedAt === null &&
    edited.state !== "cancelled"
      ? edited
      : null;

  const activityPanelOpen =
    canWrite && (asked.activite === ACTIVITY_PANEL_NEW || activity !== null);

  /* La ressource corrigée (T4bis.5), sur la forme exacte du bloc ci-dessus :
     une seule clé, dont la **valeur** porte le cas — `nouvelle` relie, un
     identifiant corrige, tout le reste n'ouvre rien. La ressource est
     confrontée au projet et à l'archivage, comme l'activité l'est : le bloc
     n'affiche aucun lien vers une ressource archivée, mais une URL se tape. */
  const editedResource =
    canWrite &&
    asked.ressource &&
    asked.ressource !== RESOURCE_PANEL_NEW &&
    isUuid(asked.ressource)
      ? await session.db.find(resources, asked.ressource)
      : undefined;

  const resource =
    editedResource &&
    editedResource.projectId === project.id &&
    editedResource.archivedAt === null
      ? editedResource
      : null;

  const resourcePanelOpen =
    canWrite && (asked.ressource === RESOURCE_PANEL_NEW || resource !== null);

  /* Quatre lectures indépendantes, un seul aller-retour : les ressources
     rejoignent le rang et la roadmap plutôt que d'attendre leur tour (T4.1), et
     les adoptions les rejoignent à leur tour (T5.4). */
  const [rank, roadmap, projectResources, adoptions] = await Promise.all([
    findAccompanimentRank(session.db, project),
    listProjectRoadmap(session.db, project.id),
    listProjectResources(session.db, project.id),
    listProjectAdoptions(session.db, project.id),
  ]);

  /* L'activité sur laquelle un résultat se saisit ou se corrige (T4.4,
     T4bis.6). **Aucune lecture en base ne s'ajoute pour en décider** : elle se
     cherche dans la roadmap déjà lue pour l'écran, et toutes les conditions de
     la fiche s'y lisent d'un coup — la roadmap est scopée à ce projet et exclut
     déjà les archivées, le groupe `done` donne l'état (« le seul état qui
     autorise le rattachement d'un résultat », `docs/03` §4), `producesResult`
     donne le drapeau du type (`docs/04` §2), et `result` donne ce qui est déjà
     posé.

     **Le point d'entrée ne disparaît plus une fois le résultat saisi : il
     change de geste.** La même donnée décide du lien dans la roadmap et de
     l'ouverture du panneau, si bien qu'une URL tapée à la main n'ouvre jamais
     rien de plus que ce que l'écran propose — c'est la propriété de T4.4, tenue
     à l'identique, et elle vaut maintenant pour deux gestes.

     **La correction ne demande que l'existence du résultat**, là où la saisie
     garde les quatre conditions (arbitrage du 15/08/2026) : une période
     corrigée redérive l'état d'une activité terminée sans toucher à son
     résultat, et exiger `done` ici laisserait ce résultat orphelin. Le geste se
     lit donc dans **toute** la roadmap, la saisie dans le seul groupe
     « Terminé ».

     La forme est vérifiée avant la base, comme pour `?activite=` : une colonne
     `uuid` interrogée avec n'importe quoi rend une erreur PostgreSQL. */
  const resultTarget =
    canWrite && asked.resultat && isUuid(asked.resultat)
      ? (roadmap
          .flatMap((group) =>
            group.activities.map((entry) => ({ key: group.key, entry })),
          )
          .find(
            ({ key, entry }) =>
              entry.id === asked.resultat &&
              (entry.result !== null ||
                (key === "done" && entry.producesResult)),
          )?.entry ?? null)
      : null;

  const resultPanelOpen = resultTarget !== null;

  /* La confirmation d'annulation. Le geste vivait dans l'entrée de roadmap, sous
     un `<details>` qui dépliait son champ « Motif » au milieu des autres gestes ;
     le menu contextuel des cartes l'en a sorti, un champ de saisie n'ayant pas sa
     place dans une entrée de menu.

     **La cible se lit dans la roadmap déjà chargée**, sur la forme exacte de
     `resultTarget` : aucune lecture en base ne s'ajoute, et la même donnée décide
     du lien dans la carte et de l'ouverture du panneau — une URL tapée à la main
     n'ouvre jamais rien de plus que ce que l'écran propose. La roadmap est scopée
     à ce projet et exclut déjà les activités archivées ; les trois groupes
     retenus sont ceux d'où `canTransitionActivity` autorise encore l'annulation.

     La forme est vérifiée avant la base, comme partout. */
  const cancelTarget =
    canWrite && asked.annuler && isUuid(asked.annuler)
      ? (roadmap
          .filter(
            (group) =>
              group.key === "planned" ||
              group.key === "unscheduled" ||
              group.key === "in_progress",
          )
          .flatMap((group) => group.activities)
          .find((entry) => entry.id === asked.annuler) ?? null)
      : null;

  const cancelPanelOpen = cancelTarget !== null;

  /* La confirmation d'archivage (T4bis.3). Le droit décide de tout ce qui suit,
     et l'archivage avec lui : on ne confirme pas l'archivage de ce qui est déjà
     rangé. Un membre qui tape l'URL d'ouverture obtient la page nue — pas un
     404 : la page projet reste lisible par tout le domaine (D9), seul le panneau
     disparaît. **Aucune lecture en base ne s'ajoute pour en décider.** */
  const archivePanelOpen =
    session.can.manageDomain &&
    !archived &&
    asked.archiver === ARCHIVE_PANEL_CONFIRM;

  /* L'adoption corrigée (T5.4), sur la forme exacte de la ressource : une seule
     clé, dont la **valeur** porte le cas — `nouvel` adopte, un identifiant
     corrige, tout le reste n'ouvre rien. La valeur désigne l'**adoption**, pas
     l'indicateur : c'est la ligne de `project_indicators` qu'on corrige, celle
     qui porte la référence, la cible et la valeur finale.

     La forme est vérifiée avant la base, comme partout : une colonne `uuid`
     interrogée avec n'importe quoi rend une erreur PostgreSQL, donc un 500.

     Aucune condition d'archivage ici, à la différence de la ressource :
     `project_indicators` n'a pas de colonne `archived_at` — une liaison ne
     s'archive pas, elle se défait (arbitrage (f)). */
  const editedAdoption =
    canWrite &&
    asked.indicateur &&
    asked.indicateur !== INDICATOR_PANEL_NEW &&
    isUuid(asked.indicateur)
      ? await session.db.find(projectIndicators, asked.indicateur)
      : undefined;

  const adoption =
    editedAdoption && editedAdoption.projectId === project.id
      ? editedAdoption
      : null;

  const adoptionPanelOpen =
    canWrite && (asked.indicateur === INDICATOR_PANEL_NEW || adoption !== null);

  const panelOpen =
    activityPanelOpen ||
    resourcePanelOpen ||
    resultPanelOpen ||
    cancelPanelOpen ||
    archivePanelOpen ||
    adoptionPanelOpen;

  /* Le référentiel des outils n'est lu **que** si le panneau de résultat
     s'ouvre — la discipline de `panelOptions` ci-dessous, posée en T3.3 : la
     page la plus consultée du produit ne paie pas cette requête pour un
     panneau fermé.

     **L'exception nominative de T4bis.6**, l'exception de T4bis.1 transposée au
     troisième panneau : l'outil déjà porté par le résultat corrigé reste dans la
     liste — donc sélectionné — et n'apparaît nulle part ailleurs, ni en saisie
     ni sur un autre résultat. Sans elle, un outil archivé depuis retomberait sur
     « Aucun », et la première re-soumission détacherait le résultat de son outil
     **en silence** : c'est exactement la perte que T4bis.1 a refermée ailleurs.
     Le `select` du panneau n'a rien à savoir de tout cela — il rend ce qu'on lui
     donne. */
  const resultTools = resultPanelOpen
    ? await listResultToolOptions(
        session.db,
        resultTarget?.result?.toolId
          ? { keepToolId: resultTarget.result.toolId }
          : {},
      )
    : [];

  /* Les référentiels — dont les personnes, depuis T3.6 — ne sont lus **que**
     si le panneau s'ouvre : la page la plus consultée du produit ne paie pas
     ces requêtes pour un panneau fermé. Le tri et le filtre d'archivage
     vivent dans `lib/queries` depuis T3.3, avec la raison qui les motive.

     En correction, le type de l'activité éditée est conservé **même s'il a été
     archivé depuis** : il reste sélectionné et n'est proposé nulle part
     ailleurs. Décrire et proposer n'appellent pas le même filtre — la règle de
     T2.6, ici éprouvable pour la première fois.

     Les participants déjà liés (T3.6) ne se lisent qu'en correction — une
     création n'en a encore aucun.

     La condition est `activityPanelOpen` et non `panelOpen` : le panneau de
     ressource (T4.2) n'a que faire des types, des approches et des personnes,
     et ne doit pas les faire lire. */
  const [panelOptions, activityParticipantIds] = activityPanelOpen
    ? await Promise.all([
        listActivityFormOptions(
          session.db,
          activity ? { keepActivityTypeId: activity.activityTypeId } : {},
        ),
        activity
          ? listActivityParticipantIds(session.db, activity.id)
          : Promise.resolve<string[]>([]),
      ])
    : [null, []];

  /* Les activités proposées au rattachement d'une ressource (T4.2).
     **Aucune requête neuve** : elles se dérivent de la roadmap déjà lue pour
     l'écran, dont les archivées sont déjà absentes.

     Le groupe « Annulé » est écarté : une activité abandonnée n'a rien
     produit. On décrit, on ne propose pas — la règle de T3.3, ici appliquée à
     un choix plutôt qu'à un libellé. L'action, elle, continue d'accepter une
     activité annulée reçue : ce qu'on ne propose pas, on ne le refuse pas
     pour autant.

     L'étiquette porte la période autant que le type : deux activités du même
     type sur un même accompagnement sont la norme, pas l'exception. */
  const resourceActivities: ResourceActivityOption[] = resourcePanelOpen
    ? roadmap
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
        )
    : [];

  /* **L'exception nominative du panneau** (T4bis.5), l'exception de T4bis.1
     transposée ici : la valeur déjà portée par la ligne éditée reste dans la
     liste, donc sélectionnée, et n'apparaît nulle part ailleurs — ni en
     création, ni sur une autre ressource.

     Elle couvre d'un seul chemin les deux activités que les options ci-dessus
     n'ont pas : l'**archivée**, absente de la roadmap depuis T4bis.4, et
     l'**annulée**, que le filtre du groupe écarte. Sans elle, le `select`
     retomberait sur « Aucune » et la première re-soumission détacherait la
     ressource **en silence** — une case absente ne revient pas dans le
     `FormData`, et c'est exactement la perte que T4bis.1 a refermée ailleurs.

     La lecture n'a lieu que dans ce cas : panneau ouvert, en correction, sur une
     activité que les options ne portent pas déjà. Un panneau fermé, une création
     ou une activité vivante n'en paient rien — la discipline de `panelOptions`,
     posée en T3.3. L'option est ajoutée **en fin de liste** : elle est
     sélectionnée d'office, et sa place n'a pas à déplacer les autres. */
  const keptActivity =
    resource?.activityId &&
    !resourceActivities.some((option) => option.id === resource.activityId)
      ? await findResourceActivity(
          session.db,
          project.id,
          resource.activityId,
        )
      : null;

  /* Les indicateurs proposés à l'adoption (T5.4). Lus **seulement si le panneau
     s'ouvre** — la discipline de `panelOptions`, posée en T3.3 : la page la plus
     consultée du produit ne paie pas cette requête pour un panneau fermé.

     **L'exception nominative vit dans la requête**, comme celle de
     `listResultToolOptions` et à la différence de celle des activités : la liste
     ne se dérive d'aucune lecture déjà faite, donc rien n'oblige à la corriger
     après coup. `keepIndicatorId` couvre les deux exclusions d'un seul chemin —
     l'indicateur de l'adoption éditée est **déjà adopté**, et il a pu être
     **archivé** avant que l'arbitrage (e) ne l'interdise. Sans elle, le `select`
     s'ouvrirait sans option sélectionnée, et la première re-soumission changerait
     l'indicateur de l'adoption ou la refuserait. */
  const adoptableIndicators = adoptionPanelOpen
    ? await listAdoptableIndicators(
        session.db,
        project.id,
        project.productId,
        adoption ? { keepIndicatorId: adoption.indicatorId } : {},
      )
    : [];

  if (keptActivity) {
    resourceActivities.push({
      id: keptActivity.id,
      label: `${keptActivity.typeLabel} · ${formatActivityPeriod(
        keptActivity.periodStart,
        keptActivity.periodEnd,
        keptActivity.isUnscheduled,
      )}`,
    });
  }

  return (
    <>
      {archivePanelOpen ? (
        /* Le panneau de T4bis.2, repris tel quel — comme T4.3 a repris
           `external-link.tsx` de T4.1. L'action est liée **côté serveur** au
           projet courant : l'identifiant sort de la saisie, et le panneau ne
           connaît pas ce qu'il archive. Ce n'est pas un verrou — Next sérialise
           les arguments liés dans un champ `$ACTION_…`, réécrivable. Le verrou
           est dans l'action, qui interroge `manageDomain` puis rapproche le
           projet reçu du domaine courant. */
        <ConfirmPanel
          title="Archiver cet accompagnement"
          context={project.name}
          closeHref={ROUTES.project(project.id)}
          action={archiveProject.bind(null, project.id)}
          submitLabel="Archiver cet accompagnement"
          pendingLabel="Archivage…"
        >
          {/* Ce que le geste retire, et ce qu'il laisse. Le texte est rendu sur
              le serveur et traverse en `children` : le panneau est client pour
              son seul refus. */}
          <div className="flex flex-col gap-3 text-sm text-content-neutral-dark">
            <p>
              Cet accompagnement disparaît de la liste des projets et de la page
              de son produit. Rien n&apos;est supprimé.
            </p>
            <p>
              Sa page reste lisible par son adresse, avec sa roadmap, ses
              ressources et ses résultats : c&apos;est la mémoire du centre, elle
              ne se perd pas.
            </p>
            <p>
              Plus aucune saisie n&apos;y est possible tant qu&apos;il est
              archivé — ni activité, ni ressource, ni résultat.
            </p>
            <p>Le geste se défait : « Rétablir » ramène l&apos;accompagnement.</p>
          </div>
        </ConfirmPanel>
      ) : null}

      {cancelTarget ? (
        /* Le même panneau que l'archivage, repris tel quel — et c'est ce qui
           rend le geste déplaçable : le `<details>` de l'entrée de roadmap
           n'avait ni endroit pour un message de refus, ni place pour un champ
           dans un menu. `ConfirmPanel` rend ses `children` **à l'intérieur** de
           son formulaire, si bien que le motif y prend sa place sans qu'une
           ligne du composant change.

           L'identifiant de l'activité est lié **côté serveur**. Ce n'est pas un
           verrou — Next le sérialise dans un champ `$ACTION_…` réécrivable ; le
           verrou est dans l'action, qui interroge `writeProject` sur le projet
           retrouvé depuis l'activité reçue, puis vérifie que son état autorise
           encore l'annulation. */
        <ConfirmPanel
          title="Annuler cette activité"
          context={`${cancelTarget.typeLabel} · ${formatActivityPeriod(
            cancelTarget.periodStart,
            cancelTarget.periodEnd,
            cancelTarget.isUnscheduled,
          )}`}
          closeHref={ROUTES.project(project.id)}
          action={cancelActivity.bind(null, cancelTarget.id)}
          submitLabel="Confirmer l'annulation"
          pendingLabel="Annulation…"
        >
          {/* Ce que le geste fait, et ce qu'il ne fait pas. Le texte est rendu
              sur le serveur et traverse en `children`. */}
          <div className="flex flex-col gap-3 text-sm text-content-neutral-dark">
            <p>
              Cette activité passe au groupe « Annulé » de la roadmap, replié en
              bas du bloc. Elle reste lisible : annuler dit qu&apos;elle ne se
              fera pas, pas qu&apos;elle n&apos;a jamais été prévue.
            </p>
            <p>
              Le geste ne se défait pas — une activité annulée ne revient à aucun
              état antérieur. Une saisie faite par erreur s&apos;archive plutôt
              qu&apos;elle ne s&apos;annule.
            </p>
          </div>

          {/* Le motif est la seule saisie de ce panneau, et il est obligatoire :
              `activities_cancelled_requires_reason` le pose en base, `required`
              l'empêche côté écran, et l'action le revérifie sur ce qu'elle
              reçoit. C'est lui que la roadmap affiche ensuite à la place des
              gestes. */}
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
      ) : null}

      {resultTarget ? (
        /* Les identifiants sont liés **côté serveur** — le projet et l'activité
           en saisie, le résultat en plus en correction (T4bis.6) —, comme
           `updateActivity` depuis T3.4 : ils sortent de la saisie, et le panneau
           n'écrit pas ce qu'il ne connaît pas. Ce n'est pas un verrou, Next les
           sérialisant dans un champ `$ACTION_…` réécrivable ; le verrou est dans
           l'action, qui interroge `writeProject` sur le projet reçu, rapproche
           l'activité reçue de ce projet — puis, selon le geste, l'absence d'un
           résultat déjà posé et le type producteur, ou le résultat reçu de
           l'activité reçue. */
        <ResultPanel
          /* La `key` change avec ce que le panneau édite, pour la raison écrite
             sur celle du panneau d'activité : `useActionState` ne relit son état
             initial qu'au montage. */
          key={resultTarget.result?.id ?? resultTarget.id}
          projectName={project.name}
          activityLabel={`${resultTarget.typeLabel} · ${formatActivityPeriod(
            resultTarget.periodStart,
            resultTarget.periodEnd,
            resultTarget.isUnscheduled,
          )}`}
          closeHref={ROUTES.project(project.id)}
          action={
            resultTarget.result
              ? updateResult.bind(
                  null,
                  project.id,
                  resultTarget.id,
                  resultTarget.result.id,
                )
              : createResult.bind(null, project.id, resultTarget.id)
          }
          tools={resultTools}
          {...(resultTarget.result
            ? {
                title: "Corriger le résultat",
                submitLabel: "Enregistrer les modifications",
                initial: toResultFormValues(resultTarget.result),
              }
            : {})}
        />
      ) : null}

      {adoptionPanelOpen ? (
        /* L'action est liée **côté serveur** — au projet courant en adoption, au
           projet et à l'adoption en correction —, comme les cinq panneaux qui
           précèdent : les identifiants sortent de la saisie, et le panneau ne
           connaît ni l'accompagnement ni l'adoption qu'il écrit. Ce n'est pas un
           verrou — Next sérialise les arguments liés dans un champ `$ACTION_…`,
           réécrivable. Le verrou est dans l'action, qui interroge `writeProject`
           sur l'identifiant reçu, rapproche l'adoption reçue de ce projet et
           l'indicateur reçu du **produit** de ce projet (D11). */
        <AdoptionPanel
          /* La `key` change avec ce que le panneau édite, pour la raison écrite
             sur celle du panneau d'activité : `useActionState` ne relit son état
             initial qu'au montage. */
          key={adoption ? adoption.id : INDICATOR_PANEL_NEW}
          projectName={project.name}
          closeHref={ROUTES.project(project.id)}
          productHref={ROUTES.product(project.productId)}
          action={
            adoption
              ? updateAdoption.bind(null, project.id, adoption.id)
              : createAdoption.bind(null, project.id)
          }
          indicators={adoptableIndicators}
          {...(adoption
            ? {
                title: "Modifier l'adoption",
                submitLabel: "Enregistrer les modifications",
                initial: toAdoptionFormValues(adoption),
              }
            : {})}
        />
      ) : null}

      {resourcePanelOpen ? (
        /* L'action est liée **côté serveur** — au projet courant en création, au
           projet et à la ressource en correction (T4bis.5) —, comme celle du
           panneau d'activité : les identifiants sortent de la saisie, et le
           panneau ne connaît ni l'accompagnement ni la ressource qu'il écrit. Ce
           n'est pas un verrou — Next sérialise les arguments liés dans un champ
           `$ACTION_…`, réécrivable. Le verrou est dans l'action, qui interroge
           `writeProject` sur l'identifiant reçu, rapproche la ressource reçue de
           ce projet et l'activité reçue de ce même projet ; un panneau absent du
           rendu n'a jamais protégé le point d'entrée HTTP qui l'accompagne. */
        <ResourcePanel
          /* La `key` change avec ce que le panneau édite, pour la raison écrite
             sur celle du panneau d'activité : `useActionState` ne relit son état
             initial qu'au montage. */
          key={resource ? resource.id : RESOURCE_PANEL_NEW}
          projectName={project.name}
          closeHref={ROUTES.project(project.id)}
          action={
            resource
              ? updateResource.bind(null, project.id, resource.id)
              : createResource.bind(null, project.id)
          }
          activities={resourceActivities}
          {...(resource
            ? {
                title: "Modifier la ressource",
                submitLabel: "Enregistrer les modifications",
                initial: toResourceFormValues(resource),
              }
            : {})}
        />
      ) : null}

      {panelOptions ? (
        /* L'action est liée **côté serveur** — au projet courant en création,
           au projet et à l'activité en correction —, comme `updateProject`
           l'est dans `/projets/[id]/modifier` : les identifiants sortent ainsi
           de la saisie, et le panneau ne connaît ni le projet ni l'activité
           qu'il écrit. Ce n'est pas pour autant un verrou — Next sérialise les
           arguments liés dans un champ `$ACTION_…`, réécrivable. Le verrou est
           dans l'action, qui interroge `writeProject` sur l'identifiant reçu et
           rapproche l'activité reçue de ce projet ; un panneau absent du rendu
           n'a jamais protégé le point d'entrée HTTP qui l'accompagne. */
        <ActivityPanel
          /* La `key` change avec ce que le panneau édite, et c'est ce qui
             garantit un composant neuf : `useActionState` ne relit son état
             initial qu'au montage, si bien qu'un panneau réutilisé d'une
             activité à l'autre afficherait la saisie de la précédente. Le
             chemin n'est pas atteignable aujourd'hui — le contenu est `inert`
             tant que le panneau est ouvert, donc on repasse toujours par la
             page nue —, et c'est exactement pourquoi la garantie doit être
             dans le code plutôt que dans ce raisonnement. */
          key={activity ? activity.id : ACTIVITY_PANEL_NEW}
          projectName={project.name}
          closeHref={ROUTES.project(project.id)}
          action={
            activity
              ? updateActivity.bind(null, project.id, activity.id)
              : createActivity.bind(null, project.id)
          }
          activityTypes={panelOptions.activityTypes}
          approaches={panelOptions.approaches}
          persons={panelOptions.persons}
          {...(activity
            ? {
                title: "Modifier l'activité",
                submitLabel: "Enregistrer les modifications",
                initial: toActivityFormValues({
                  ...activity,
                  participantIds: activityParticipantIds,
                }),
              }
            : {})}
        />
      ) : null}

      {/* `inert` est un attribut HTML, pas un script : le contenu reste lu et
          affiché derrière le voile, mais ne prend plus ni focus ni clic tant
          que le panneau est ouvert. */}
      <div inert={panelOpen}>
        <Breadcrumb
          items={[
            { href: ROUTES.products, label: "Produits" },
            { href: ROUTES.product(project.productId), label: project.productName },
            { label: project.name },
          ]}
        />
        <Page>
          {/* La mention datée, au mois (D13) : c'est une date de rangement, pas
              un horodatage — le jour n'apprendrait rien de plus. Le trio de
              jetons est celui de la page produit, mesuré en T2.4 et repris sans
              qu'un couple neuf apparaisse. */}
          {project.archivedAt ? (
            <p className="rounded-xl border border-surface-neutral-lighter bg-surface-neutral-pale px-7 py-4 text-sm text-content-neutral-dark">
              <span className="font-semibold">Accompagnement archivé</span>
              {` en ${formatMonth(project.archivedAt)}. Il n'apparaît plus dans la liste des projets ni sur la page de son produit, et ne reçoit plus de saisie ; sa page, sa roadmap et ses ressources restent lisibles.`}
            </p>
          ) : null}

          <div className="rounded-xl border border-surface-neutral-lighter bg-surface-neutral-pale px-7 py-6">
            <p className="mb-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="flex items-center gap-2 font-semibold text-content-neutral-dark">
                <StatusDot nature={project.statusNature} />
                {project.statusLabel}
              </span>
              <span aria-hidden="true" className="text-content-neutral-light">
                ·
              </span>
              <span className="text-content-neutral-base">
                {formatPeriod(project.startedOn, project.expectedEndOn)}
              </span>
            </p>

            <PageHeader
              title={project.name}
              {...(project.objective ? { lead: project.objective } : {})}
              action={
                session.can.manageDomain ? (
                  <span className="flex flex-wrap items-center gap-3">
                    {archived ? (
                      /* Un formulaire nu : le rétablissement n'a rien à saisir
                         et rien à confirmer — c'est le geste qui **défait**, et
                         `docs/06` §9 proscrit la confirmation là où elle ne
                         protège rien. */
                      <form action={restoreProject.bind(null, project.id)}>
                        <button
                          type="submit"
                          className="rounded-lg bg-surface-primary-base px-4 py-2 text-sm font-semibold text-content-neutral-pale"
                        >
                          Rétablir cet accompagnement
                        </button>
                      </form>
                    ) : (
                      <>
                        <Link
                          href={ROUTES.projectEdit(project.id)}
                          className="rounded-lg border border-content-neutral-normal px-4 py-2 text-sm font-semibold text-content-neutral-dark"
                        >
                          Modifier cet accompagnement
                        </Link>
                        <Link
                          href={ROUTES.projectArchive(project.id)}
                          className="rounded-lg border border-content-neutral-normal px-4 py-2 text-sm font-semibold text-content-neutral-dark"
                        >
                          Archiver
                        </Link>
                      </>
                    )}
                  </span>
                ) : null
              }
            />

            {/* Le rang **se calcule** (`findAccompanimentRank`), et il mène à la
                page produit : c'est la règle de continuité de docs/06 §7 — la
                maquette, elle, pointait vers l'accompagnement voisin. */}
            {rank !== null ? (
              <p className="mt-3 text-sm">
                <Link
                  href={ROUTES.product(project.productId)}
                  className="text-content-info-base underline"
                >
                  {formatRank(rank)}
                </Link>
              </p>
            ) : null}

            <FieldRow>
              <Field label="Entité">{project.entityLabel}</Field>

              <Field label="Commanditaire">
                {project.sponsor ?? (
                  <span className="text-content-neutral-base">Non renseigné</span>
                )}
              </Field>

              <Field label="Approches">
                {project.approachLabels.length > 0 ? (
                  <span className="flex flex-wrap gap-1.5">
                    {project.approachLabels.map((label) => (
                      <Tag key={label} label={label} />
                    ))}
                  </span>
                ) : (
                  <span className="text-content-neutral-base">
                    Aucune approche déclarée
                  </span>
                )}
              </Field>

              {/* Le nom est écrit en toutes lettres à côté de la pastille, et
                  « côté entité » est du texte : la couleur de la pastille ne
                  porte jamais seule la distinction (docs/06 §11). */}
              <Field label="Équipe">
                {project.team.length > 0 ? (
                  <span className="flex flex-wrap items-center gap-x-5 gap-y-2">
                    {project.team.map((member) => (
                      <span key={member.id} className="flex items-center gap-2">
                        <Avatar name={member.fullName} tone={member.kind} />
                        {member.fullName}
                        {member.kind === "stakeholder" ? (
                          <span className="text-xs text-content-neutral-base">
                            · côté entité
                          </span>
                        ) : null}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="text-content-neutral-base">
                    Aucun membre désigné
                  </span>
                )}
              </Field>
            </FieldRow>
          </div>

          {/* Le récit, en position dominante : il vient avant tout bloc de
              référence (docs/06 §5). L'action d'ouverture du panneau n'existe
              que pour qui peut écrire dans ce projet (D9) : le composant ne
              connaît aucun droit, c'est ici qu'il se lit. */}
          <Roadmap
            groups={roadmap}
            addHref={canWrite ? ROUTES.projectActivityNew(project.id) : null}
            editHref={
              canWrite
                ? (activityId) =>
                    ROUTES.projectActivityEdit(project.id, activityId)
                : null
            }
            resultHref={
              canWrite
                ? (activityId) =>
                    ROUTES.projectResultNew(project.id, activityId)
                : null
            }
            cancelHref={
              canWrite
                ? (activityId) =>
                    ROUTES.projectActivityCancel(project.id, activityId)
                : null
            }
            transitionActivity={canWrite ? transitionActivity : null}
            archiveActivity={canWrite ? archiveActivity : null}
            /* `archiveResult` est liée au projet **côté serveur** ; l'entrée y
               ajoute l'activité et le résultat au rendu. Le même `canWrite` que
               les six autres gestes, **et aucune condition ne s'ajoute ici** —
               c'est la propriété que le `&&` de T4bis.3 cherchait, tenue pour un
               septième geste. */
            archiveResult={
              canWrite ? archiveResult.bind(null, project.id) : null
            }
          />

          {/* Les blocs de référence, « Ressources » en tête (docs/06 §5). */}
          <div className="grid gap-5 md:grid-cols-2">
            {/* Les trois points d'entrée du bloc tombent avec le même
                `canWrite` : le droit d'écrire dans ce projet (D9), et la
                lecture seule d'un accompagnement archivé (T4bis.3). Aucune
                condition ne s'ajoute ici — c'est la propriété que ce `&&`
                cherchait. `archiveResource` est liée au projet **côté
                serveur** ; le bloc y ajoutera la ressource au rendu. */}
            <Resources
              resources={projectResources}
              addHref={canWrite ? ROUTES.projectResourceNew(project.id) : null}
              editHref={
                canWrite
                  ? (resourceId) =>
                      ROUTES.projectResourceEdit(project.id, resourceId)
                  : null
              }
              archiveResource={
                canWrite ? archiveResource.bind(null, project.id) : null
              }
            />

            {/* Deuxième case de la grille, à la place que `docs/06` §5 lui donne
                et sans en changer l'ordre. Les trois points d'entrée tombent
                avec le **même** `canWrite` que ceux de « Ressources » — le droit
                d'écrire dans ce projet (D9) et la lecture seule d'un
                accompagnement archivé (T4bis.3) —, et **aucune condition ne
                s'ajoute ici**. `removeAdoption` est liée au projet côté serveur ;
                le bloc y ajoutera l'adoption au rendu.

                `productHref` n'est pas un droit : c'est le renvoi de
                l'arbitrage (c), et il vaut pour qui lit comme pour qui écrit —
                un indicateur se crée sur la page du produit, jamais ici. */}
            <AdoptedIndicators
              adoptions={adoptions}
              addHref={canWrite ? ROUTES.projectIndicatorNew(project.id) : null}
              editHref={
                canWrite
                  ? (adoptionId) =>
                      ROUTES.projectIndicatorEdit(project.id, adoptionId)
                  : null
              }
              removeAdoption={
                canWrite ? removeAdoption.bind(null, project.id) : null
              }
              productHref={ROUTES.product(project.productId)}
            />

            {REFERENCE_BLOCKS.map((block) => (
              <Section key={block.title}>
                <SectionHeader title={block.title} />
                <p className="text-sm leading-175 text-content-neutral-base">
                  {block.description}
                </p>
              </Section>
            ))}
          </div>
        </Page>
      </div>
    </>
  );
}
