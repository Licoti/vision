/**
 * Projet — la page la plus consultée du produit.
 *
 * Sa segmentation obéit à la règle de `docs/06` §5 : **un récit dominant, des
 * blocs de référence autour.** T2.4 pose l'en-tête d'identité, T3.1 branche la
 * roadmap, T4.1 le premier des blocs de référence — « Ressources », en tête du
 * tableau de `docs/06` §5 et jamais avant le récit. **Les cinq portent leur
 * contenu depuis T7.1**, qui livre le dernier, « Budget » (D28) : plus aucun
 * bloc de ce tableau n'est une annonce.
 *
 * **Deux blocs se sont effacés le 28/08/2026, hors ticket et à la demande**, et
 * les deux gestes ne sont pas de même nature :
 *
 *   - **« Projets liés » n'est plus rendu du tout.** Le bloc n'apporte pas de
 *     valeur au stade où le produit se démontre, et ses cinq requêtes se payaient
 *     à chaque affichage. **C'est un écart à `docs/06` §5** — dont la liste de
 *     blocs de référence est close —, consigné au journal technique. Rien n'est
 *     supprimé : le composant reste sans appelant, comme `subnav.tsx` depuis le
 *     21/08, et le bloc revient d'une dizaine de lignes.
 *   - **« Démarrage » n'est rendu que sur un accompagnement sans activité.** Il
 *     dit ce qu'on **peut** faire, et la question ne se pose plus une fois
 *     l'accompagnement ouvert. Le référentiel, lui, reste lu et son panneau reste
 *     ouvrable : c'est par `?piste=` que le geste d'ajout d'une activité viendra
 *     le rouvrir.
 *
 * **Aucun des deux n'est une protection**, et c'est la distinction qui compte :
 * `?lien=` et `?piste=` ouvrent encore, un rendu absent n'ayant jamais gardé le
 * point d'entrée HTTP qui l'accompagne.
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
 * ouvre le panneau de confirmation de T4bis.2, repris tel quel. `?lien=nouveau`
 * ouvre celui de T6.5, et `?lien=<identifiant de liaison>` le rouvre sur la
 * raison à corriger — la forme d'`?ressource=`, jusqu'au nom de la clé.
 * `?budget=saisie` ouvre le dernier (T7.1), et il reprend la forme d'`archiver`
 * plutôt que celle de `ressource` : **une seule valeur d'ouverture**, parce
 * qu'il n'y a rien à désigner — `budgets_project_unique` fait qu'un projet
 * porte au plus un budget, et une seule action le crée ou le corrige. La page
 * reste rendue derrière eux, et porte alors l'attribut HTML
 * `inert` — c'est l'ordre du DOM qui décide de la tabulation, et `inert` est ce
 * qui empêche d'entrer au clavier dans le contenu masqué par le voile.
 *
 * **`?etat=` n'est pas de cette famille** (20/08/2026) : c'est le filtre de la
 * roadmap, il n'ouvre aucun panneau et n'entre donc ni dans le décompte
 * d'exclusivité ni dans `PROJECT_PANEL_PARAMS`. Fermer un panneau ne défait pas
 * le filtre, poser un filtre ne ferme aucun panneau — la distinction que
 * `?de=`/`?a=` tiennent sur la page produit.
 *
 * **Les clés sont mutuellement exclusives, et le sont par une règle unique :
 * plusieurs présentes ensemble n'ouvrent rien** (T4.2). **Sans le compte** : la
 * phrase disait « les quatre », elles sont neuf depuis T7.1 — un nombre dans un
 * commentaire vieillit à chaque ticket, et le geste du dépôt est de le retirer
 * (T6.1). Deux `role="dialog"` ou
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
import { Budget } from "@/components/projects/budget";
import { Resources } from "@/components/projects/resources";
import { Journal } from "@/components/projects/journal";
import { Starters } from "@/components/projects/starters";
import { Roadmap } from "@/components/projects/roadmap";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { ActionMenu, MENU_ITEM_DANGER } from "@/components/ui/action-menu";
import { Button, buttonClass } from "@/components/ui/button";
import { DrawerHost, DrawerLink } from "@/components/ui/drawer";
import { ArchivedNotice } from "@/components/ui/archived-notice";
import { AvatarGroup } from "@/components/ui/avatar";
import { Field, FieldRow } from "@/components/ui/field";
import { Page, PageHeader } from "@/components/ui/page";
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
import { findProjectBudget } from "@/lib/queries/budgets";
import { listProjectAdoptions } from "@/lib/queries/indicators";
import { listProjectJournal } from "@/lib/queries/journal";
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
    lien?: string;
    budget?: string;
    supprimer?: string;
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
    lien,
    budget: budgetParam,
    supprimer,
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

     **Le décompte passe de neuf à dix clés sans qu'un caractère de sa logique
     change** (28/08/2026, `supprimer`) : c'est la propriété pour laquelle T4.4
     l'avait écrit en décompte plutôt qu'en comparaison, vérifiée pour la
     **huitième** fois. T7.1 l'annonçait dernière — « la page projet n'ayant plus
     de bloc à ouvrir » —, et elle l'était pour les blocs : `supprimer` n'en
     ouvre aucun, c'est une confirmation. */
  const keys = {
    activite,
    ressource,
    resultat,
    annuler,
    archiver,
    indicateur,
    piste,
    lien,
    budget: budgetParam,
    supprimer,
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

     **Ni le journal ni le budget n'attendent un droit** : leur lecture est
     ouverte à tout le domaine (D9), archivé compris, et ils partent donc dans
     le même vol que les cinq autres plutôt que derrière un `canWrite`. Le
     **budget** l'a rejoint en dernier (T7.1) : c'est une lecture de plus dans
     le même aller-retour, pas un tour de plus, et elle est ouverte à tout le
     domaine comme les autres — un accompagnement se lit entier, seul le geste
     tombe avec le droit.

     **Le vol est repassé de neuf lectures à sept le 28/08/2026**, « Projets
     liés » ayant quitté le rendu : `listRelatedProjects` en emportait
     **quatre** — les liens déduits ne sont rien de stocké (T6.4) — et
     `listDeclaredLinks` une cinquième. Cinq requêtes par affichage qu'un bloc
     invisible n'a aucune raison de payer. Les deux fonctions restent entières
     et testées dans `lib/queries/links.ts` ; ce sont leurs appels qui s'en
     vont. */
  const [
    rank,
    roadmap,
    projectResources,
    adoptions,
    starters,
    journal,
    budget,
  ] = await Promise.all([
    findAccompanimentRank(session.db, project),
    listProjectRoadmap(session.db, project.id),
    listProjectResources(session.db, project.id),
    listProjectAdoptions(session.db, project.id),
    listStarters(session.db),
    listProjectJournal(session.db, project.id),
    findProjectBudget(session.db, project.id),
  ]);

  /* **« Démarrage » ne se rend que sur un accompagnement sans activité**
     (28/08/2026, à la demande). Le bloc dit ce qu'on **peut** faire, et la
     question ne se pose plus une fois l'accompagnement ouvert : sa raison
     d'être est le projet neuf, dont la page ne dit rien du possible.

     **Aucun état ne fait exception** — « annulé » et « à planifier » comptent
     comme les autres : le critère est *la roadmap est vide*, et non un jugement
     sur ce qui a vraiment commencé, qui serait l'indice calculé par Vision que
     D39 interdit. Une activité **archivée** ne compte pas : elle a quitté la
     roadmap, et le projet redevient un projet qu'on ouvre.

     Le décompte porte sur les **activités**, non sur les groupes.
     `listProjectRoadmap` ne rend aujourd'hui aucun groupe vide, mais un critère
     adossé à cette propriété se casserait le jour où elle changerait. */
  const hasActivity = roadmap.some((group) => group.activities.length > 0);

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
                       protège rien.

                       **Un menu à côté depuis le 28/08/2026** : la phrase disait
                       « c'est le seul geste qu'un accompagnement archivé offre
                       encore », et elle est devenue fausse. Ranger puis effacer
                       est le chemin naturel, et l'interdire ici obligerait à
                       rétablir avant de supprimer. */
                    <>
                      <form action={restoreProject.bind(null, project.id)}>
                        <Button type="submit">
                          Rétablir cet accompagnement
                        </Button>
                      </form>
                      <ActionMenu
                        label={`Options de l'accompagnement ${project.name}`}
                      >
                        <DrawerLink
                          href={ROUTES.projectDelete(project.id)}
                          request={{ kind: "delete" }}
                          role="menuitem"
                          className={MENU_ITEM_DANGER}
                        >
                          Supprimer définitivement
                        </DrawerLink>
                      </ActionMenu>
                    </>
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
                        {/* **Sous « Archiver », et non à sa place** : les deux
                            gestes ont des conséquences opposées — l'un range et
                            se défait, l'autre efface et ne se défait pas —, et
                            l'ordre dit lequel est le chemin par défaut. Le
                            panneau compte ce que la suppression emporte avant de
                            la proposer.

                            Aucun jeton neuf : `MENU_ITEM_DANGER` est servi juste
                            au-dessus, dans le même menu et sur le même fond. */}
                        <DrawerLink
                          href={ROUTES.projectDelete(project.id)}
                          request={{ kind: "delete" }}
                          role="menuitem"
                          className={MENU_ITEM_DANGER}
                        >
                          Supprimer définitivement
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
                fermer.

                **Il ne se rend plus que sur un accompagnement sans activité**
                (28/08/2026) — la condition est `hasActivity`, plus haut. Ce
                qui disparaît est le **bloc**, jamais la piste : `?piste=<id>`
                ouvre encore son panneau sur un projet peuplé, `listStarters`
                reste dans le vol pour l'alimenter, et c'est par là que le geste
                d'ajout d'une activité viendra le rouvrir. Le composant, lui, ne
                connaît toujours rien du projet — la condition vit ici. */}
            {hasActivity ? null : (
              <Starters
                starters={starters}
                detailHref={(starterId) =>
                  ROUTES.projectStarter(project.id, starterId)
                }
              />
            )}

            {/* **« Projets liés » a été masqué le 28/08/2026**, à la demande :
                le bloc n'apporte pas de valeur au stade où le produit se
                démontre. Il vivait ici depuis T6.4 pour ses liens déduits et
                T6.5 pour ses liens déclarés.

                **C'est un écart à `docs/06` §5**, dont la liste de blocs de
                référence est close : elle en énumère cinq, la page en rend
                quatre. Consigné dans `JOURNAL-TECHNIQUE.md`.

                **Il ne laisse aucune dette, et revient d'une dizaine de
                lignes** — le geste de la barre d'ancres, retirée le
                21/08/2026. `components/projects/related.tsx` reste en place
                sans appelant, `listRelatedProjects` et `listDeclaredLinks`
                restent entières et testées, le panneau `?lien=` reste résolu et
                les trois actions d'écriture gardent leurs portes. **Le masquage
                n'est donc pas une protection et ne prétend pas en être une** :
                `?lien=nouveau` ouvre encore le panneau à qui porte `canWrite`,
                et c'est `openLink` qui décide, pas ce rendu. La clé reste dans
                `keys` : le décompte d'exclusivité reste à neuf. */}

            {/* **Le dernier bloc de `docs/06` §5, et il porte enfin son
                contenu** (T7.1, D28). Il était le seul qui restait annoncé, et
                la rangée des blocs annoncés disparaît avec lui : `REFERENCE_BLOCKS`
                et son `map` s'en vont, un tableau vide et une boucle dessus
                étant une annonce que plus personne ne lit.

                À sa place exacte — après « Projets liés », avant « Journal » ;
                le premier ayant été masqué le 28/08/2026, il suit désormais la
                roadmap, sans que son rang dans `docs/06` §5 ait bougé.
                Dans la colonne du récit et non dans le rail : il porte quatre
                couples nom/valeur et un lien sortant en rangée, qui ne tiennent
                pas sur 380 px.

                Le point d'entrée tombe avec le **même** `canWrite` que les onze
                gestes qui précèdent — le droit d'écrire dans ce projet (D9,
                arbitrage (e) : `writeProject`, jamais `manageDomain`) et la
                lecture seule d'un accompagnement archivé (T4bis.3) —, et
                **aucune condition ne s'ajoute ici**. C'est la propriété que ce
                `&&` cherchait, tenue pour un douzième geste. */}
            <Budget
              budget={budget}
              editHref={canWrite ? ROUTES.projectBudget(project.id) : null}
            />

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
