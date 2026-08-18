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
  removeAdoption,
  transitionActivity,
} from "./actions";
import { restoreProject } from "../actions";
import { AdoptedIndicators } from "@/components/projects/adopted-indicators";
import { Resources } from "@/components/projects/resources";
import { Roadmap } from "@/components/projects/roadmap";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { DrawerHost, DrawerLink } from "@/components/ui/drawer";
import { Avatar } from "@/components/ui/avatar";
import { Field, FieldRow } from "@/components/ui/field";
import { Page, PageHeader } from "@/components/ui/page";
import { Section, SectionHeader } from "@/components/ui/section";
import { StatusDot } from "@/components/ui/status-dot";
import { Tag } from "@/components/ui/tag";
import { loadProjectDrawer } from "./drawers";
import { requireSession } from "@/lib/auth/provider";
import {
  projectRequestFromParams,
  PROJECT_PANEL_PARAMS,
  resolveProjectDrawer,
} from "@/lib/drawers/project";
import { formatMonth, formatPeriod, formatRank } from "@/lib/format";
import { ROUTES } from "@/lib/navigation";
import { listProjectRoadmap } from "@/lib/queries/activities";
import { listProjectAdoptions } from "@/lib/queries/indicators";
import {
  findAccompanimentRank,
  findProjectDetail,
} from "@/lib/queries/projects";
import { listProjectResources } from "@/lib/queries/resources";
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

  /* **L'URL reste une adresse, elle n'est plus le mécanisme** (TD.2). Coller
     `?activite=nouvelle` ouvre encore le panneau, ici, au rendu serveur ; le
     clic, lui, passe par `DrawerHost` et n'écrit plus rien. Les deux chemins
     traversent ensuite la **même** résolution — `resolveProjectDrawer` —, si
     bien qu'aucune règle de droit ni aucune confrontation ne vit à deux
     endroits.

     L'exclusivité ne vaut donc plus que pour ce chemin-ci : plusieurs clés
     présentes ensemble n'ouvrent **rien** (T4.2, réécrite en décompte par
     T4.4). Côté clic, elle est devenue structurelle — l'état ne porte qu'une
     demande à la fois. */
  const keys = { activite, ressource, resultat, annuler, archiver, indicateur };
  const conflict =
    Object.values(keys).filter((value) => value !== undefined).length > 1;
  const asked: Partial<typeof keys> = conflict ? {} : keys;

  const request = projectRequestFromParams(asked);

  /* Quatre lectures indépendantes, un seul aller-retour : les ressources
     rejoignent le rang et la roadmap plutôt que d'attendre leur tour (T4.1), et
     les adoptions les rejoignent à leur tour (T5.4). */
  const [rank, roadmap, projectResources, adoptions] = await Promise.all([
    findAccompanimentRank(session.db, project),
    listProjectRoadmap(session.db, project.id),
    listProjectResources(session.db, project.id),
    listProjectAdoptions(session.db, project.id),
  ]);

  /* La roadmap est **déjà lue** pour l'écran : la résolution la reçoit plutôt
     que de la relire. C'est `loadProjectDrawerContext` qui paie une lecture, et
     seulement quand le clic ouvre un panneau qui en a besoin. */
  const drawer = request
    ? await resolveProjectDrawer(
        session,
        project,
        { canWrite, roadmap },
        request,
      )
    : null;

  return (
    <DrawerHost
      initial={drawer}
      load={loadProjectDrawer.bind(null, project.id)}
      panelParams={PROJECT_PANEL_PARAMS}
      closeHref={ROUTES.project(project.id)}
    >
      <Breadcrumb
        items={[
          { href: ROUTES.products, label: "Produits" },
          {
            href: ROUTES.product(project.productId),
            label: project.productName,
          },
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
                      <DrawerLink
                        href={ROUTES.projectArchive(project.id)}
                        request={{ kind: "archive" }}
                        className="rounded-lg border border-content-neutral-normal px-4 py-2 text-sm font-semibold text-content-neutral-dark"
                      >
                        Archiver
                      </DrawerLink>
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
              ? (activityId) => ROUTES.projectResultNew(project.id, activityId)
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
          archiveResult={canWrite ? archiveResult.bind(null, project.id) : null}
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
    </DrawerHost>
  );
}
