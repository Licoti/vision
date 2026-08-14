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
 * **Les panneaux de saisie sont cette page, plus un paramètre** (D30, T3.2).
 * `?activite=nouvelle` ouvre le panneau d'activité vide, `?activite=<identifiant>`
 * l'ouvre sur une activité à corriger (T3.4) — une seule clé, dont la valeur
 * porte le cas, et un seul formulaire pour les deux gestes. `?ressource=nouvelle`
 * ouvre celui de T4.2, et `?resultat=<identifiant d'activité>` celui de T4.4.
 * La page reste rendue derrière eux, et porte alors l'attribut HTML `inert` —
 * c'est l'ordre du DOM qui décide de la tabulation, et `inert` est ce qui
 * empêche d'entrer au clavier dans le contenu masqué par le voile.
 *
 * **Les trois clés sont mutuellement exclusives, et le sont par une règle unique :
 * plusieurs présentes ensemble n'ouvrent rien** (T4.2). Deux `role="dialog"` ou
 * deux `inert` concurrents ne se rattrapent pas après coup, et aucune préséance
 * n'est inventée entre des gestes de même rang — c'est déjà ce que la page fait
 * de toute valeur d'`?activite=` qu'elle ne reconnaît pas. T4.4 a tenu la règle
 * et changé son écriture : une comparaison binaire ne se généralise pas à trois
 * clés, un décompte oui. Un seul `panelOpen`, un seul `inert`, un seul panneau
 * monté : la propriété se lit dans le code, elle ne se déduit pas de trois
 * conditions éparses.
 *
 * **Le droit décide du rendu, pas seulement de l'affichage d'un bouton.** Un
 * membre non contributeur qui tape l'URL d'ouverture obtient la page nue — pas
 * un 404 : la page projet reste lisible par tout le domaine (D9), seul le
 * panneau disparaît.
 *
 * Aucune requête directe : tout passe par `session.db`, déjà scopé sur le
 * domaine courant. Règle 1.
 */

import { notFound } from "next/navigation";
import Link from "next/link";

import {
  cancelActivity,
  createActivity,
  createResource,
  createResult,
  transitionActivity,
  updateActivity,
} from "./actions";
import { ActivityPanel } from "@/components/projects/activity-panel";
import {
  ResourcePanel,
  type ResourceActivityOption,
} from "@/components/projects/resource-panel";
import { ResultPanel } from "@/components/projects/result-panel";
import { Resources } from "@/components/projects/resources";
import { Roadmap } from "@/components/projects/roadmap";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { Avatar } from "@/components/ui/avatar";
import { Field, FieldRow } from "@/components/ui/field";
import { Page, PageHeader } from "@/components/ui/page";
import { Section, SectionHeader } from "@/components/ui/section";
import { StatusDot } from "@/components/ui/status-dot";
import { Tag } from "@/components/ui/tag";
import { requireSession } from "@/lib/auth/provider";
import { activities } from "@/lib/db/schema";
import { toActivityFormValues } from "@/lib/forms/activity";
import { formatActivityPeriod, formatPeriod, formatRank } from "@/lib/format";
import {
  ACTIVITY_PANEL_NEW,
  RESOURCE_PANEL_NEW,
  ROUTES,
} from "@/lib/navigation";
import {
  listActivityFormOptions,
  listActivityParticipantIds,
  listProjectRoadmap,
  listResultToolOptions,
} from "@/lib/queries/activities";
import { findAccompanimentRank, findProjectDetail } from "@/lib/queries/projects";
import { listProjectResources } from "@/lib/queries/resources";
import { isUuid } from "@/lib/uuid";

export const metadata = {
  title: "Projet — Vision",
};

/**
 * Les blocs de référence **restants**, dans l'ordre de `docs/06` §5 — fréquence
 * d'usage. « Ressources » les précédait ici jusqu'à T4.1 ; il porte désormais
 * son contenu réel et vit dans `components/projects/resources.tsx`, en première
 * case de la grille.
 */
const REFERENCE_BLOCKS: { title: string; description: string }[] = [
  {
    title: "Indicateurs adoptés",
    description:
      "Les indicateurs du produit que cet accompagnement reprend à son compte s'afficheront ici, avec leur valeur de référence, la cible fixée et le dernier relevé.",
  },
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
  }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const session = await requireSession();

  const project = await findProjectDetail(session.db, id);
  if (!project) notFound();

  /* D9 — responsable de domaine, ou contributeur désigné de ce projet. La
     règle est déjà écrite dans le contexte de session : elle ne se rejoue pas
     ici. */
  const canWrite = session.can.writeProject(project.id);
  const { activite, ressource, resultat } = await searchParams;

  /* L'exclusivité, avant tout le reste : plusieurs clés d'ouverture
     concurrentes n'en ouvrent aucune (T4.2). Tout ce qui suit lit `asked`, pas
     les paramètres bruts, si bien qu'aucun chemin ne peut ouvrir deux panneaux
     à la fois — la garantie est dans le code, pas dans la relecture.

     **La règle n'a pas changé, son écriture si** : T4.2 la posait en une
     comparaison binaire, qui ne se généralise pas à trois clés. Un décompte dit
     la même chose pour trois, et restera juste quand C5 ajoutera la sienne. */
  const keys = { activite, ressource, resultat };
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

  /* C4 n'écrit aucune correction de ressource (arbitrage (a)) : une seule
     valeur ouvre, toute autre n'ouvre rien. Aucune lecture en base n'est
     nécessaire pour en décider — le panneau ne pré-remplit rien. */
  const resourcePanelOpen = canWrite && asked.ressource === RESOURCE_PANEL_NEW;

  /* Trois lectures indépendantes, un seul aller-retour : les ressources
     rejoignent le rang et la roadmap plutôt que d'attendre leur tour (T4.1). */
  const [rank, roadmap, resources] = await Promise.all([
    findAccompanimentRank(session.db, project),
    listProjectRoadmap(session.db, project.id),
    listProjectResources(session.db, project.id),
  ]);

  /* L'activité sur laquelle un résultat se saisit (T4.4). **Aucune lecture en
     base ne s'ajoute pour en décider** : elle se cherche dans la roadmap déjà
     lue pour l'écran, et les quatre conditions de la fiche s'y lisent d'un
     coup — la roadmap est scopée à ce projet et exclut déjà les archivées, le
     groupe `done` donne l'état (« le seul état qui autorise le rattachement
     d'un résultat », `docs/03` §4), `producesResult` donne le drapeau du type
     (`docs/04` §2), et `result` donne ce qui est déjà posé.

     **C'est ce qui fait disparaître le point d'entrée une fois le résultat
     saisi** : la même donnée décide du lien dans la roadmap et de l'ouverture
     du panneau, si bien que l'un ne peut pas survivre à l'autre. Une URL tapée
     à la main n'ouvre donc rien de plus que ce que l'écran propose.

     La forme est vérifiée avant la base, comme pour `?activite=` : une colonne
     `uuid` interrogée avec n'importe quoi rend une erreur PostgreSQL. */
  const resultTarget =
    canWrite && asked.resultat && isUuid(asked.resultat)
      ? (roadmap
          .find((group) => group.key === "done")
          ?.activities.find(
            (entry) =>
              entry.id === asked.resultat &&
              entry.producesResult &&
              entry.result === null,
          ) ?? null)
      : null;

  const resultPanelOpen = resultTarget !== null;

  const panelOpen = activityPanelOpen || resourcePanelOpen || resultPanelOpen;

  /* Le référentiel des outils n'est lu **que** si le panneau de résultat
     s'ouvre — la discipline de `panelOptions` ci-dessous, posée en T3.3 : la
     page la plus consultée du produit ne paie pas cette requête pour un
     panneau fermé. */
  const resultTools = resultPanelOpen
    ? await listResultToolOptions(session.db)
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

  return (
    <>
      {resultTarget ? (
        /* Deux identifiants liés **côté serveur** — le projet et l'activité —,
           comme `updateActivity` depuis T3.4 : ils sortent de la saisie, et le
           panneau n'écrit pas ce qu'il ne connaît pas. Ce n'est pas un verrou,
           Next les sérialisant dans un champ `$ACTION_…` réécrivable ; le
           verrou est dans l'action, qui interroge `writeProject` sur le projet
           reçu et rapproche l'activité reçue de ce projet, de son type
           producteur et de l'absence d'un résultat déjà posé. */
        <ResultPanel
          projectName={project.name}
          activityLabel={`${resultTarget.typeLabel} · ${formatActivityPeriod(
            resultTarget.periodStart,
            resultTarget.periodEnd,
            resultTarget.isUnscheduled,
          )}`}
          closeHref={ROUTES.project(project.id)}
          action={createResult.bind(null, project.id, resultTarget.id)}
          tools={resultTools}
        />
      ) : null}

      {resourcePanelOpen ? (
        /* L'action est liée **côté serveur** au projet courant, comme celle du
           panneau d'activité : l'identifiant sort de la saisie, et le panneau
           ne connaît pas l'accompagnement qu'il écrit. Ce n'est pas un verrou —
           Next sérialise les arguments liés dans un champ `$ACTION_…`,
           réécrivable. Le verrou est dans l'action, qui interroge `writeProject`
           sur l'identifiant reçu et rapproche l'activité reçue de ce projet ;
           un panneau absent du rendu n'a jamais protégé le point d'entrée HTTP
           qui l'accompagne. */
        <ResourcePanel
          projectName={project.name}
          closeHref={ROUTES.project(project.id)}
          action={createResource.bind(null, project.id)}
          activities={resourceActivities}
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
                  <Link
                    href={ROUTES.projectEdit(project.id)}
                    className="rounded-lg border border-content-neutral-normal px-4 py-2 text-sm font-semibold text-content-neutral-dark"
                  >
                    Modifier cet accompagnement
                  </Link>
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
            transitionActivity={canWrite ? transitionActivity : null}
            cancelActivity={canWrite ? cancelActivity : null}
          />

          {/* Les blocs de référence, « Ressources » en tête (docs/06 §5). */}
          <div className="grid gap-5 md:grid-cols-2">
            <Resources
              resources={resources}
              addHref={canWrite ? ROUTES.projectResourceNew(project.id) : null}
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
