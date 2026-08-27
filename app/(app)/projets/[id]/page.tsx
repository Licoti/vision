/**
 * Projet — la page la plus consultée du produit.
 *
 * Sa segmentation obéit à la règle de `docs/06` §5 : **un récit dominant, des
 * blocs de référence autour.** T2.4 pose l'en-tête d'identité, T3.1 branche la
 * roadmap, T4.1 le premier des blocs de référence — « Ressources », en tête du
 * tableau de `docs/06` §5 et jamais avant le récit. Les trois derniers restent
 * des états vides annoncés, dans leur ordre définitif — un bloc vide est un
 * écran à part entière, pas une page incomplète (règle 5).
 *
 * **Elle passe à `docs/design/maquettes/blocs/project-v2` le 20/08/2026**, hors
 * ticket, et c'est le plus large changement de forme qu'un écran de Vision ait
 * reçu. Cinq gestes, aucune donnée perdue :
 *
 *   1. l'en-tête devient une **carte**, statut, période et rang sur une ligne,
 *      le geste principal en bouton primaire et « Archiver » sous un menu ;
 *   2. une **barre d'ancres collante** annonce les quatre blocs qui en portent ;
 *   3. le corps passe à **deux colonnes** — le récit à gauche, les deux blocs
 *      chiffrés dans un rail de 380 px à droite ;
 *   4. la roadmap devient **une liste à plat filtrée par pastilles**, ses cinq
 *      intertitres de groupe cédant à la pastille de statut de chaque entrée ;
 *   5. « Démarrage » passe en **cartes**, et les trois blocs annoncés en **trio**
 *      d'une rangée.
 *
 * **Trois écarts sont assumés, et tous trois arbitrés avant écriture** :
 * l'ordre en groupes de `docs/03` §6 (point 4), la jauge North Star et l'écart
 * chiffré de la maquette **refusés** (D39, voir `adopted-indicators.tsx`), et
 * les cinq gestes que la maquette dessine sans qu'ils existent — quatre retirés,
 * un dessiné sans lien. Consignés dans `JOURNAL-TECHNIQUE.md`. **Le cinquième
 * est branché depuis T6.3** : « Voir le journal » est devenu le `<summary>` du
 * bloc « Journal », et il ne reste des cinq que les quatre retraits.
 *
 * **Le cadre de `Section` monte au format de la page produit** par le même
 * geste : c'est ce qui **referme le point ouvert d'`ETAT.md`** sur la
 * cohabitation de `Section` et de `Block`.
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
 * **`?etat=` n'est pas de cette famille** (20/08/2026) : c'est le filtre de la
 * roadmap, il n'ouvre aucun panneau et n'entre donc ni dans le décompte
 * d'exclusivité ni dans `PROJECT_PANEL_PARAMS`. Fermer un panneau ne défait pas
 * le filtre, poser un filtre ne ferme aucun panneau — la distinction que
 * `?de=`/`?a=` tiennent sur la page produit.
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
import { Journal } from "@/components/projects/journal";
import { RelatedProjects } from "@/components/projects/related";
import { Starters } from "@/components/projects/starters";
import { Roadmap } from "@/components/projects/roadmap";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { ActionMenu, MENU_ITEM_DANGER } from "@/components/ui/action-menu";
import { Button, buttonClass } from "@/components/ui/button";
import { DrawerHost, DrawerLink } from "@/components/ui/drawer";
import { ArchivedNotice } from "@/components/ui/archived-notice";
import { AvatarGroup } from "@/components/ui/avatar";
import { BlockNote } from "@/components/ui/empty-state";
import { Field, FieldRow } from "@/components/ui/field";
import { Page, PageHeader } from "@/components/ui/page";
import { Section, SectionHeader } from "@/components/ui/section";
import { StatusPill } from "@/components/ui/status-pill";
import { Tag } from "@/components/ui/tag";
import { loadProjectDrawer } from "./drawers";
import { requireSession } from "@/lib/auth/provider";
import {
  projectRequestFromParams,
  PROJECT_PANEL_PARAMS,
  resolveProjectDrawer,
} from "@/lib/drawers/project";
import { formatPeriod, formatRank } from "@/lib/format";
import { ROUTES } from "@/lib/navigation";
import { listProjectRoadmap } from "@/lib/queries/activities";
import { listProjectAdoptions } from "@/lib/queries/indicators";
import { listProjectJournal } from "@/lib/queries/journal";
import { listRelatedProjects } from "@/lib/queries/links";
import {
  findAccompanimentRank,
  findProjectDetail,
} from "@/lib/queries/projects";
import { listProjectResources } from "@/lib/queries/resources";
import { listStarters } from "@/lib/queries/starters";
import { isUuid } from "@/lib/uuid";

export const metadata = {
  title: "Projet — Vision",
};

/**
 * Les trois blocs **annoncés** de `docs/06` §5, dans son ordre — fréquence de
 * consultation. « Ressources » et « Indicateurs adoptés » les précédaient ici
 * jusqu'à T4.1 et T5.4 ; ils portent désormais leur contenu réel, vivent dans
 * leurs composants et ont rejoint le rail droit.
 *
 * **Ils passent en rangée** (20/08/2026, maquette `project-v2`) : des cartes
 * courtes côte à côte, sous le bloc « Démarrage ». Un bloc vide est un écran à
 * part entière (règle 5) ; des blocs vides empilés à pleine largeur donnaient à
 * la page un tiers d'attente pour un tiers de contenu.
 *
 * **« Projets liés » en est sorti le 21/08/2026**, à la demande — masqué, pas
 * livré : ce qui disparaissait était l'annonce, pas la destination. La rangée
 * passait de trois cartes à deux. **La promesse est tenue par T6.4** : le bloc
 * est revenu au rendu avec ses liens déduits, il se rend au-dessus de cette
 * liste-ci, et il n'y entre pas — un bloc qui porte son contenu n'annonce plus
 * rien. `project_links` reste au modèle sans lecteur jusqu'à T6.5.
 *
 * **« Journal » en sort à son tour, et par l'inverse : il est livré** (T6.3).
 * Il portait le seul « geste » dessiné de la rangée — « Voir le journal »,
 * arbitré le 20/08/2026 en `<span>` plutôt qu'en `<a>` sans `href`, parce
 * qu'une affordance qui ne répond pas est pire qu'une absence (`docs/06` §9).
 * La promesse d'alors était que C6 livre le journal et que le point d'entrée
 * soit déjà à sa place : il est devenu le `<summary>` de
 * `components/projects/journal.tsx`. **`pending` disparaît avec lui** — il
 * n'avait que cet appelant, et une capacité sans appelant est celle que le
 * ticket suivant emploierait de travers.
 *
 * **Il en reste un, et la rangée n'en est plus une.** Une seule carte dans une
 * grille de deux laisserait une moitié de vide, exactement ce que le tour
 * précédent refusait pour deux cartes dans une grille de trois : « Budget » se
 * rend donc seul, sur toute la largeur de la colonne. Il reste annoncé jusqu'à
 * C7 (D28).
 */
const REFERENCE_BLOCKS: {
  title: string;
  description: string;
}[] = [
  {
    title: "Budget",
    description:
      "La synthèse macro — alloué, consommé — s'affichera ici, avec le lien vers l'outil de gestion. Le suivi budgétaire est tenu là-bas ; Vision renvoie vers la source plutôt que d'en reproduire le détail.",
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
    piste?: string;
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
  const {
    activite,
    ressource,
    resultat,
    annuler,
    archiver,
    indicateur,
    piste,
  } = await searchParams;

  /* **L'URL reste une adresse, elle n'est plus le mécanisme** (TD.2). Coller
     `?activite=nouvelle` ouvre encore le panneau, ici, au rendu serveur ; le
     clic, lui, passe par `DrawerHost` et n'écrit plus rien. Les deux chemins
     traversent ensuite la **même** résolution — `resolveProjectDrawer` —, si
     bien qu'aucune règle de droit ni aucune confrontation ne vit à deux
     endroits.

     L'exclusivité ne vaut donc plus que pour ce chemin-ci : plusieurs clés
     présentes ensemble n'ouvrent **rien** (T4.2, réécrite en décompte par
     T4.4). Côté clic, elle est devenue structurelle — l'état ne porte qu'une
     demande à la fois.

     **Le décompte passe de six à sept clés sans qu'un caractère de sa logique
     change** (20/08/2026, `piste`) : c'est la propriété pour laquelle T4.4
     l'avait écrit en décompte plutôt qu'en comparaison, vérifiée pour la
     cinquième fois. */
  const keys = {
    activite,
    ressource,
    resultat,
    annuler,
    archiver,
    indicateur,
    piste,
  };
  const conflict =
    Object.values(keys).filter((value) => value !== undefined).length > 1;
  const asked: Partial<typeof keys> = conflict ? {} : keys;

  const request = projectRequestFromParams(asked);

  /* Six lectures indépendantes, un seul aller-retour : les ressources
     rejoignent le rang et la roadmap plutôt que d'attendre leur tour (T4.1),
     les adoptions les rejoignent à leur tour (T5.4), les pistes de démarrage
     ensuite (20/08/2026), et le journal en dernier (T6.3). Les pistes ne
     prennent pas d'identifiant : c'est un référentiel du domaine, le même sur
     tous les accompagnements.

     **Ni le journal ni les voisins n'attendent un droit** : leur lecture est
     ouverte à tout le domaine (D9), archivé compris, et ils partent donc dans
     le même vol que les cinq autres plutôt que derrière un `canWrite`. Les
     liens déduits sont **quatre requêtes de plus** (T6.4) et rien de stocké :
     c'est ce qui garantit qu'ils sont toujours vrais, et le coût est celui que
     `docs/04` §5 accepte à quinze projets. */
  const [
    rank,
    roadmap,
    projectResources,
    adoptions,
    starters,
    journal,
    related,
  ] = await Promise.all([
    findAccompanimentRank(session.db, project),
    listProjectRoadmap(session.db, project.id),
    listProjectResources(session.db, project.id),
    listProjectAdoptions(session.db, project.id),
    listStarters(session.db),
    listProjectJournal(session.db, project.id),
    listRelatedProjects(session.db, project.id),
  ]);

  /* La roadmap et les pistes sont **déjà lues** pour l'écran : la résolution
     les reçoit plutôt que de les relire. C'est `loadProjectDrawerContext` qui
     paie une lecture, et seulement quand le clic ouvre un panneau qui en a
     besoin. */
  const drawer = request
    ? await resolveProjectDrawer(
        session,
        project,
        { canWrite, roadmap, starters },
        request,
      )
    : null;

  return (
    <DrawerHost
      initial={drawer}
      load={loadProjectDrawer.bind(null, project.id)}
      panelParams={PROJECT_PANEL_PARAMS}
      /* **La fermeture est l'adresse nue depuis le 21/08/2026** : elle
         reconduisait le filtre de roadmap, qui a quitté l'URL pour l'état
         client de `roadmap-filter.tsx`. Il n'y a plus rien à reconduire, et
         c'est la propriété que ce déplacement cherchait — une seule source pour
         le filtre, jamais deux qui divergent au premier clic. */
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
        {project.archivedAt ? (
          <ArchivedNotice
            label="Accompagnement archivé"
            archivedAt={project.archivedAt}
            sentence="Il n'apparaît plus dans la liste des projets ni sur la page de son produit, et ne reçoit plus de saisie ; sa page, sa roadmap et ses ressources restent lisibles."
          />
        ) : null}

        {/* L'en-tête d'identité, dans la carte que dessine
            `docs/design/maquettes/blocs/project-v2` : le statut et la situation
            sur une ligne, le nom, l'objectif, les gestes à droite — puis, sous
            un filet, les quatre champs qui permettent de comprendre le projet
            sans faire défiler (`docs/06` §5). */}
        <div className="rounded-2xl border border-surface-neutral-lighter bg-surface-neutral-pale px-8 py-7">
          {/* **La période et le rang tiennent sur la ligne du statut**
              (20/08/2026) : « depuis février 2026 · 2ᵉ accompagnement de ce
              produit ». Le rang menait déjà à la page produit — c'est la règle
              de continuité de `docs/06` §7, et la maquette, elle, pointait vers
              l'accompagnement voisin. Il descendait sous l'objectif ; la
              maquette le remonte, où il se lit comme ce qu'il est : une
              situation, non un contenu.

              Le `·` est décoratif et sépare deux suites de texte de même
              graisse : il garde donc leur couleur, la règle de T4bis.5. */}
          <p className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs text-content-neutral-base">
            <StatusPill
              nature={project.statusNature}
              label={project.statusLabel}
            />
            <span>{formatPeriod(project.startedOn, project.expectedEndOn)}</span>
            {rank !== null ? (
              <>
                <span aria-hidden="true">·</span>
                <Link
                  href={ROUTES.product(project.productId)}
                  className="text-content-info-base underline"
                >
                  {formatRank(rank)}
                </Link>
              </>
            ) : null}
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
                       protège rien. Aucun menu à côté : c'est le seul geste
                       qu'un accompagnement archivé offre encore. */
                    <form action={restoreProject.bind(null, project.id)}>
                      <Button type="submit">
                        Rétablir cet accompagnement
                      </Button>
                    </form>
                  ) : (
                    <>
                      {/* **Le geste principal passe au bouton primaire**, et
                          « Archiver » sous un menu « … » : c'est la hiérarchie
                          que la maquette dessine, et elle dit vrai — corriger
                          l'identité d'un accompagnement est courant, le ranger
                          ne l'est pas. Les deux étaient au même rang. */}
                      <Link
                        href={ROUTES.projectEdit(project.id)}
                        className={buttonClass()}
                      >
                        Modifier
                      </Link>
                      {/* Le menu ne porte **que** les gestes qui existent. La
                          maquette y range aussi « Dupliquer » et « Exporter
                          (PDF) » : aucun des deux n'est une fonctionnalité de
                          Vision, et les dessiner serait en promettre deux
                          (règle 3). */}
                      <ActionMenu
                        label={`Options de l'accompagnement ${project.name}`}
                      >
                        <DrawerLink
                          href={ROUTES.projectArchive(project.id)}
                          request={{ kind: "archive" }}
                          role="menuitem"
                          className={MENU_ITEM_DANGER}
                        >
                          Archiver cet accompagnement
                        </DrawerLink>
                      </ActionMenu>
                    </>
                  )}
                </span>
              ) : null
            }
          />

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

            {/* **L'équipe passe en pile d'avatars et décompte** (20/08/2026,
                maquette `project-v2`), là où les noms s'écrivaient en toutes
                lettres. Ils ne disparaissent pas : `AvatarGroup` les porte en
                texte de remplacement, mention « côté entité » comprise, et la
                teinte de chaque pastille la redit à l'œil. La couleur ne porte
                donc pas seule (`docs/06` §11) — elle double une information que
                l'assistance reçoit en toutes lettres. Arbitré le 20/08/2026. */}
            <Field label="Équipe">
              {project.team.length > 0 ? (
                <AvatarGroup
                  size="md"
                  count={`${project.team.length} ${
                    project.team.length > 1 ? "personnes" : "personne"
                  }`}
                  names={project.team.map((member) => ({
                    fullName: member.fullName,
                    tone: member.kind === "stakeholder" ? "stakeholder" : "center",
                    ...(member.kind === "stakeholder"
                      ? { note: "côté entité" }
                      : {}),
                  }))}
                />
              ) : (
                <span className="text-content-neutral-base">
                  Aucun membre désigné
                </span>
              )}
            </Field>
          </FieldRow>
        </div>

        {/* **La barre d'ancres a été retirée le 21/08/2026**, à la demande.
            Elle vivait ici depuis la veille, d'après la maquette `project-v2`.
            Elle ne laisse aucune dette : `components/projects/subnav.tsx` reste
            en place, sans appelant, et revient d'une ligne. Les `id` des
            sections restent posés — un ancrage qui ne coûte rien et qu'aucune
            barre ne vise plus, `scroll-mt-19` compris, que le commentaire de
            `Section` annonce déjà inerte en l'absence d'ancre. */}
        {/* **Deux colonnes** (maquette `project-v2`) : le récit à gauche, les
            blocs de référence chiffrés dans un rail de 380 px à droite. La
            roadmap garde donc sa position dominante — `docs/06` §5 et D31 — et
            « Ressources » puis « Indicateurs adoptés » restent lisibles sans
            faire défiler le récit entier, ce qu'une pile ne permettait pas.
            L'ordre du document est tenu **à l'intérieur du rail**.

            Le gabarit est un **point d'arrêt de mise en page**, hors de la
            règle des espacements (arbitrage du journal de T1.6). Sous `xl`, une
            seule colonne : un rail de 380 px sur une largeur utile de 700 px
            écraserait le récit. */}
        <div className="grid items-start gap-5 xl:grid-cols-[1fr_380px]">
          <div className="flex min-w-0 flex-col gap-5">
            {/* Le récit, en position dominante : il vient avant tout bloc de
                référence (`docs/06` §5). L'action d'ouverture du panneau
                n'existe que pour qui peut écrire dans ce projet (D9) : le
                composant ne connaît aucun droit, c'est ici qu'il se lit.

                **Le filtre par état n'arrive plus d'ici** (21/08/2026) : il
                vit dans l'état client de `roadmap-filter.tsx`, et cette page
                n'a plus ni `state` ni `stateHref` à fabriquer. */}
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
              /* `archiveResult` est liée au projet **côté serveur** ; l'entrée
                 y ajoute l'activité et le résultat au rendu. Le même `canWrite`
                 que les six autres gestes, **et aucune condition ne s'ajoute
                 ici**. */
              archiveResult={
                canWrite ? archiveResult.bind(null, project.id) : null
              }
            />

            {/* Le seul bloc de cette page qui ne reçoive aucun droit, et le
                seul dont le point d'entrée ne soit jamais nul : une piste se lit
                par tout le domaine (D9), et son référentiel a son écran de
                gestion en C7 (D25). Il n'y a rien ici que `canWrite` puisse
                fermer. */}
            <Starters
              starters={starters}
              detailHref={(starterId) =>
                ROUTES.projectStarter(project.id, starterId)
              }
            />

            {/* **« Projets liés » revient au rendu, avec son contenu**
                (T6.4). `docs/06` §5 le place entre « Indicateurs » et
                « Budget » ; il se rend donc juste avant la carte annoncée qui
                reste, et **il n'entre pas dans la rangée** — un bloc qui porte
                son contenu n'annonce plus rien.

                Dans la colonne du récit, et non dans le rail : le rail porte
                les blocs de **chiffres reportés**, et une raison en toutes
                lettres — « Camille Roux et Sofia Marchand en commun » — ne se
                lit pas sur 380 px.

                Aucun droit ne lui est passé, et il n'y en a aucun à passer :
                rien ne s'y saisit, et la saisie d'un lien **déclaré** est la
                matière de T6.5. */}
            <RelatedProjects related={related} />

            {/* Le bloc annoncé, **au singulier depuis T6.3**. La grille a
                disparu avec le second : une carte dans une grille de deux
                laisserait une moitié de vide, ce que le tour précédent refusait
                déjà pour deux cartes dans une grille de trois. Le `map` reste —
                c'est lui qui rend le retour de « Projets liés » et l'arrivée de
                « Budget » sans qu'une balise bouge. */}
            {REFERENCE_BLOCKS.map((block) => (
              <Section key={block.title}>
                <SectionHeader title={block.title} />
                <BlockNote>{block.description}</BlockNote>
              </Section>
            ))}

            {/* **Le journal en dernier** (`docs/06` §5) : c'est une information
                de contrôle, pas de compréhension, et sa place dans le document
                le dit avant que son contenu ne le dise.

                Aucun droit ne lui est passé, et il n'y en a aucun à passer : le
                bloc ne s'écrit pas, sa lecture est ouverte à tout le domaine
                (D9), et un accompagnement archivé garde son journal comme il
                garde sa roadmap (règle 4, T4bis.3). C'est le seul bloc de cette
                page que `canWrite` ne touche pas. */}
            <Journal events={journal} />
          </div>

          {/* Le rail droit. Les deux blocs qui portent des chiffres reportés,
              dans l'ordre de `docs/06` §5 : les indicateurs, puis les
              ressources.

              Les points d'entrée de chacun tombent avec le **même** `canWrite`
              que ceux de la roadmap — le droit d'écrire dans ce projet (D9) et
              la lecture seule d'un accompagnement archivé (T4bis.3) —, et
              **aucune condition ne s'ajoute ici**. C'est la propriété que ce
              `&&` cherchait, tenue pour un dixième geste.

              `productHref` n'est pas un droit : c'est le renvoi de l'arbitrage
              (c), et il vaut pour qui lit comme pour qui écrit — un indicateur
              se crée sur la page du produit, jamais ici. */}
          <div className="flex min-w-0 flex-col gap-5">
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
          </div>
        </div>
      </Page>
    </DrawerHost>
  );
}
