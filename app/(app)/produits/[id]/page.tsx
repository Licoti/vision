/**
 * Produit — la page de détail, conteneur des accompagnements successifs.
 *
 * Elle répond à « qu'avons-nous fait sur ce produit dans le temps » : un
 * en-tête d'identité, puis, depuis T5.5, la **frise du temps long** — les
 * accompagnements en bandes, les activités porteuses d'un résultat en repères
 * et, depuis T5.6, une courbe par indicateur, sur un axe commun (docs/06 §6,
 * D26, D41) —, puis les accompagnements du plus récent au plus ancien, que la
 * frise n'a **pas déplacés** et qui restent son équivalent textuel, et depuis
 * T5.1 le bloc « Indicateurs » — ce que le produit mesure — **sous** cette
 * liste, chaque indicateur portant sa série datée depuis T5.3.
 *
 * **La juxtaposition de `docs/03` §7 est complète, et elle ne conclut rien** :
 * les relevés se lisent sur le même axe que les accompagnements qui les
 * entourent, sans qu'un écart, une flèche de causalité ou un « +12 % depuis
 * l'accompagnement » ne s'écrive nulle part.
 *
 * L'identifiant vient de l'URL : sa forme est vérifiée avant la base, faute de
 * quoi un paramètre fantaisiste ne produit pas un 404 mais une erreur
 * PostgreSQL, donc un 500. Un produit inconnu — ou d'un autre domaine — rend
 * 404 : la seconde réponse ne se distingue pas de la première, et c'est
 * volontaire.
 *
 * **L'en-tête porte une ligne de faits** depuis le 28/08/2026 : le décompte
 * des accompagnements, qui vivait dans le surtitre à côté de l'entité, et
 * l'**étendue couverte** — de quand à quand ce produit a été accompagné. Deux
 * faits datés, tirés de ce que la page a déjà lu, et rien de plus : nommer
 * l'accompagnement *en cours* a été écarté le même jour, plusieurs pouvant
 * l'être à la fois et aucun document ne donnant la règle qui en désignerait un.
 *
 * **« Modifier ce produit », « Archiver » et « Nouvel accompagnement »
 * n'apparaissent qu'au responsable de domaine** (F1-D1, D9) : les actions sont
 * absentes du rendu pour tout autre, pas grisées. **Les deux premières vivent
 * dans un menu ⋮ depuis le 21/08/2026** — trois boutons alignés donnaient trois
 * gestes de même poids, et un seul est celui qu'on vient faire.
 *
 * **Un produit archivé garde sa page** (règle 4, T4bis.2) : elle reste servie
 * entière, mention datée en tête, et ce sont ses actions d'écriture qui
 * disparaissent — « Modifier » et « Nouvel accompagnement », l'état vide
 * compris, **et les trois gestes du bloc « Indicateurs » depuis T5.2**. Seul
 * « Rétablir » s'y ajoute, pour le responsable de domaine. Ce n'est pas ce rendu
 * qui protège : `updateProduct` refuse le produit archivé **reçu**, et
 * `openProductWrite` fait de même pour les indicateurs — une route retirée n'a
 * jamais protégé l'action qu'elle affichait.
 *
 * **Les panneaux sont cette page, plus un paramètre** (D30, T3.2, repris de la
 * page projet) : `?archiver=confirmation` ouvre la confirmation d'archivage
 * (T4bis.2) — une seule valeur d'ouverture, l'objet visé étant celui de la page.
 * `?indicateur=nouvel` ouvre le panneau d'indicateur vide et
 * `?indicateur=<identifiant>` l'ouvre sur un indicateur à corriger (T5.2) : une
 * seule clé, dont la **valeur** porte le cas, et un seul formulaire pour les
 * deux gestes. `?releve=<identifiant>` ouvre le panneau de relevé (T5.3), et sa
 * valeur change de **table** plutôt que de nature : un identifiant
 * d'**indicateur** saisit un relevé sur cet indicateur, un identifiant de
 * **relevé** le corrige. `?vision=modifier` ouvre le panneau de la vision
 * produit (18/08/2026) — une seule valeur d'ouverture, l'objet visé étant celui
 * de la page, et **le seul panneau de cet écran qui demande `manageDomain`**
 * plutôt que le droit dérivé des accompagnements. La page reste rendue derrière
 * eux, et porte alors l'attribut HTML `inert`.
 *
 * **Les clés sont mutuellement exclusives, et le sont par une règle unique :
 * plusieurs présentes ensemble n'ouvrent rien** — la règle de la page projet
 * depuis T4.2, reprise ici sous sa forme par **décompte** (T4.4, T4bis.3). Deux
 * `role="dialog"` ou deux `inert` concurrents ne se rattrapent pas après coup, et
 * aucune préséance ne s'invente entre deux gestes de même rang. Un seul
 * `panelOpen`, un seul `inert`, un seul panneau monté : la propriété se lit dans
 * le code, elle ne se déduit pas de trois conditions éparses — et l'énoncé n'a
 * pas eu à changer quand T5.3 a ajouté sa clé, ni quand la vision a ajouté la
 * sienne le 18/08/2026 : ce pour quoi il avait été écrit en décompte.
 *
 * **La vision produit ne suit pas ce droit** (18/08/2026) : elle demande
 * `manageDomain`, comme les quatre autres colonnes de `products` (F1-D1, D9).
 * La raison d'être d'un produit n'appartient pas à qui intervient dessus sur un
 * trimestre. Les deux points d'entrée du bloc de tête tombent donc séparément,
 * et le bloc ne sait rien d'autre de ces deux règles.
 *
 * **Le droit d'écrire un indicateur se dérive des accompagnements du produit**
 * (arbitrage (b) de `tickets-C5.md`) : `manageDomain`, ou contributeur désigné
 * d'au moins un accompagnement de ce produit. **Aucune requête neuve** — la page
 * lit déjà ses accompagnements, et `session.can.writeProject` répond sur chacun.
 * Un membre non contributeur qui tape l'URL d'ouverture obtient la page nue —
 * pas un 404 : la page produit reste lisible par tout le domaine (D9), seul le
 * panneau disparaît. Et ce n'est pas ce rendu qui protège : les actions
 * redérivent le droit sur l'identifiant **reçu**.
 *
 * Aucune requête directe : tout passe par `session.db`, déjà scopé sur le
 * domaine courant. Règle 1.
 */

import Link from "next/link";
import { notFound } from "next/navigation";

import { archiveIndicator, setNorthStar } from "./actions";
import { restoreProduct } from "../actions";
import { Audience } from "@/components/products/audience";
import { Indicators } from "@/components/products/indicators";
import { Roadmap } from "@/components/products/roadmap";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import {
  ActionMenu,
  MENU_ITEM,
  MENU_ITEM_DANGER,
} from "@/components/ui/action-menu";
import { Button, buttonClass } from "@/components/ui/button";
import { DrawerHost, DrawerLink } from "@/components/ui/drawer";
import { ArchivedNotice } from "@/components/ui/archived-notice";
import { Page, PageHeader } from "@/components/ui/page";
import { loadProductDrawer } from "./drawers";
import { requireSession } from "@/lib/auth/provider";
import {
  productRequestFromParams,
  PRODUCT_PANEL_PARAMS,
  resolveProductDrawer,
} from "@/lib/drawers/product";
import { formatAccompaniments, formatCoverage } from "@/lib/format";
import { ROUTES } from "@/lib/navigation";
import {
  listProductAdoptions,
  listProductIndicators,
  listProductReadings,
} from "@/lib/queries/indicators";
import { listProductPersonas } from "@/lib/queries/personas";
import { listProductUseCases } from "@/lib/queries/use-cases";
import { findProductDetail, listProductProjects } from "@/lib/queries/products";
import { listProductMilestones } from "@/lib/queries/timeline";
import { isUuid } from "@/lib/uuid";

export const metadata = {
  title: "Produit — Vision",
};

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    archiver?: string;
    indicateur?: string;
    releve?: string;
    /** L'indicateur dont on déplie la série — panneau « Gérer les relevés ». */
    releves?: string;
    /**
     * Le panneau de la vision produit (18/08/2026). **Une seule valeur
     * d'ouverture, `modifier`** : l'objet visé est le produit de la page, et
     * écrire ou récrire une colonne nullable ne fait pas deux gestes à
     * distinguer dans l'URL.
     */
    vision?: string;
    /**
     * Le panneau de **saisie d'un persona** (18/08/2026). Une seule clé, dont
     * la **valeur** porte le cas — la forme d'`indicateur` : `nouveau` ouvre le
     * panneau vide, un identifiant l'ouvre sur la ligne à corriger.
     */
    persona?: string;
    /**
     * La **fiche** d'un persona, en lecture (18/08/2026). Sa valeur est
     * toujours un identifiant. **Deux clés pour un même objet**, parce que ce
     * sont deux droits différents : la fiche se lit par tout le domaine (D9),
     * la saisie demande le droit d'écrire.
     */
    fiche?: string;
    /**
     * Le panneau de **saisie d'un use case** (19/08/2026). Une seule clé, dont
     * la **valeur** porte le cas — la forme de `persona` : `nouveau` ouvre le
     * panneau vide, un identifiant l'ouvre sur la ligne à corriger.
     *
     * **La seule clé de la page en anglais**, et c'est le prix de l'intitulé
     * « Use Cases » arbitré le 19/08/2026 : traduire l'adresse d'un bloc que
     * l'écran nomme en anglais aurait donné deux vocabulaires pour un objet.
     */
    usecase?: string;
    /**
     * La **fiche** d'un use case, en lecture (19/08/2026). Sa valeur est
     * toujours un identifiant. **Deux clés pour un même objet**, parce que ce
     * sont deux droits différents — la séparation que `persona` et `fiche`
     * tiennent déjà.
     */
    scenario?: string;
  }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const session = await requireSession();

  const product = await findProductDetail(session.db, id);
  if (!product) notFound();

  /* Cinq lectures indépendantes, un seul temps d'attente — la discipline de
     T4.1 sur la page projet. Aucune ne dépend du droit : la roadmap, les
     courbes, le bloc « Indicateurs » et la série de chaque indicateur se lisent
     par tout le domaine (D9), sur un produit vivant comme archivé (règle 4).

     La série arrive **plate**, une seule requête pour tout le bloc : le
     regroupement par indicateur appartient au composant, et une lecture par
     indicateur serait exactement ce que T5.1 s'est interdit.

     **Aucun bloc n'ajoute une lecture par objet** : les barres de la roadmap
     sont les accompagnements que `listProductProjects` rend déjà pour la liste
     (T5.5), et les courbes sont les indicateurs et les relevés que les deux
     lectures du bloc rendent déjà (T5.6). Seuls les repères de la roadmap et
     les cibles des courbes demandent une lecture neuve — une chacun. */
  const [
    projects,
    productIndicators,
    productReadings,
    milestones,
    adoptions,
    productPersonas,
    productUseCases,
  ] = await Promise.all([
    listProductProjects(session.db, product.id),
    listProductIndicators(session.db, product.id),
    listProductReadings(session.db, product.id),
    listProductMilestones(session.db, product.id),
    listProductAdoptions(session.db, product.id),
    listProductPersonas(session.db, product.id),
    listProductUseCases(session.db, product.id),
  ]);

  const archived = product.archivedAt !== null;

  /* Le droit d'écrire un indicateur, **dérivé des accompagnements du produit**
     (arbitrage (b) de `tickets-C5.md`) : `manageDomain`, ou contributeur désigné
     d'au moins un accompagnement. Aucune requête neuve — `projects` vient d'être
     lu pour l'écran, et `listProductProjects` en écarte déjà les archivés, si
     bien que ce sont bien les accompagnements **vivants** qui ouvrent le droit.

     **Un produit archivé est en lecture seule** (arbitrage du 16/08/2026), la
     transposition de T4bis.2 et de T4bis.3 : un seul `&&` fait tomber ensemble
     le panneau et les trois gestes du bloc. Ce n'est pas ce rendu qui protège —
     `openProductWrite` refuse le produit archivé **reçu**. */
  const canWriteIndicators =
    !archived &&
    (session.can.manageDomain ||
      projects.some((project) => session.can.writeProject(project.id)));

  /* **L'étendue couverte par le produit**, écrite en tête depuis le 28/08/2026.
     Aucune lecture neuve : ce sont les dates des accompagnements que la page
     vient de lire pour la frise, et `formatCoverage` ne fait que retrouver
     leurs deux bornes. Un produit dont aucun accompagnement n'est daté n'a rien
     à écrire, et la ligne se réduit alors au décompte.

     **L'accompagnement en cours n'y figure pas**, et c'est une décision du
     28/08/2026 : plusieurs peuvent l'être à la fois, et le nommer au singulier
     demanderait une règle de choix qu'aucun document ne donne. Le bloc
     « Accompagnements » les porte tous, avec leur statut écrit. */
  const coverage = formatCoverage(
    projects.flatMap((project) => [project.startedOn, project.expectedEndOn]),
  );

  const {
    archiver,
    indicateur,
    releve,
    releves,
    vision,
    persona,
    fiche,
    usecase,
    scenario,
  } = await searchParams;

  /* **L'URL reste une adresse, elle n'est plus le mécanisme** (TD.2). Coller
     `?fiche=<id>` ouvre encore le panneau, ici, au rendu serveur ; le clic, lui,
     passe par `DrawerHost` et n'écrit plus rien. Les deux chemins traversent
     ensuite la **même** résolution — `resolveProductDrawer` —, si bien qu'aucune
     règle de droit ni aucune confrontation ne vit à deux endroits.

     L'exclusivité ne vaut donc plus que pour ce chemin-ci : plusieurs clés
     présentes ensemble n'ouvrent **rien**. Côté clic, elle est devenue
     structurelle — l'état ne porte qu'une demande à la fois, et deux
     `role="dialog"` concurrents ne sont plus représentables.

     **La fenêtre de la roadmap n'est plus une clé d'URL** (21/08/2026) : elle
     n'a donc plus à être tenue hors du décompte, et filtrer ne ferme plus un
     panneau ouvert — c'est un `useState`, pas une navigation. */
  const keys = {
    archiver,
    indicateur,
    releve,
    releves,
    vision,
    persona,
    fiche,
    usecase,
    scenario,
  };
  const conflict =
    Object.values(keys).filter((value) => value !== undefined).length > 1;
  const asked: Partial<typeof keys> = conflict ? {} : keys;

  const request = productRequestFromParams(asked);

  /* Les collections que la page a **déjà lues** pour son écran : la résolution
     n'en relit aucune. C'est `loadProductDrawerContext` qui paie une lecture,
     et seulement quand le clic ouvre un panneau qui en a besoin. */
  const drawer = request
    ? await resolveProductDrawer(
        session,
        product,
        {
          canWrite: canWriteIndicators,
          indicators: productIndicators,
          readings: productReadings,
          personas: productPersonas,
          useCases: productUseCases,
        },
        request,
      )
    : null;

  return (
    <DrawerHost
      initial={drawer}
      load={loadProductDrawer.bind(null, product.id)}
      panelParams={PRODUCT_PANEL_PARAMS}
      closeHref={ROUTES.product(product.id)}
    >
      <Breadcrumb
        items={[
          { href: ROUTES.products, label: "Produits" },
          { label: product.name },
        ]}
      />
      <Page>
        {product.archivedAt ? (
          <ArchivedNotice
            label="Produit archivé"
            archivedAt={product.archivedAt}
            sentence="Il n'apparaît plus dans la liste des produits ; sa page et ses accompagnements passés restent lisibles."
          />
        ) : null}

        <PageHeader
          overline={product.entityLabel}
          title={product.name}
          {...(product.description ? { lead: product.description } : {})}
          /* Le décompte a quitté le surtitre pour la ligne de faits, où il
             peut s'accompagner de l'étendue couverte sans faire une ligne de
             capitales de trois segments. */
          facts={
            coverage
              ? `${formatAccompaniments(projects.length)} · ${coverage}`
              : formatAccompaniments(projects.length)
          }
          action={
            session.can.manageDomain ? (
              <span className="flex flex-wrap items-center gap-3">
                {archived ? (
                  /* Un formulaire nu : le rétablissement n'a rien à saisir et
                       rien à confirmer — c'est le geste qui **défait**, et
                       `docs/06` §9 proscrit la confirmation là où elle ne
                       protège rien. */
                  <form action={restoreProduct.bind(null, product.id)}>
                    <Button type="submit">Rétablir ce produit</Button>
                  </form>
                ) : (
                  <>
                    <NewProjectLink productId={product.id} />
                    {/* **Les deux gestes de second rang passent au menu**
                        (21/08/2026) : trois boutons alignés donnaient trois
                        gestes de même poids, alors qu'un seul est celui qu'on
                        vient faire. La forme est celle de l'en-tête de la page
                        projet — rang `secondary` ici, le tertiaire étant celui
                        des gestes **de bloc**, et « Archiver » en
                        `MENU_ITEM_DANGER` parce qu'il retire de la vue.

                        Ce n'est pas ce menu qui protège : `updateProduct` et
                        l'archivage redérivent le droit sur le produit
                        **reçu**. */}
                    <ActionMenu label={`Options du produit ${product.name}`}>
                      <Link
                        href={ROUTES.productEdit(product.id)}
                        role="menuitem"
                        className={MENU_ITEM}
                      >
                        Modifier ce produit
                      </Link>
                      <DrawerLink
                        href={ROUTES.productArchive(product.id)}
                        request={{ kind: "archive" }}
                        role="menuitem"
                        className={MENU_ITEM_DANGER}
                      >
                        Archiver ce produit
                      </DrawerLink>
                    </ActionMenu>
                  </>
                )}
              </span>
            ) : null
          }
        />

        {/* **Les deux premiers blocs de la page** — « Vision produit » et
              « Indicateurs ». Un seul composant les rend, dans un fragment :
              ils partagent les mêmes tableaux et les mêmes droits, et les
              séparer en deux appels aurait fait passer six props deux fois.
              `Page` les espace de son `gap-6` comme deux blocs quelconques.

              La vision porte la raison d'être du produit et la North Star la
              mesure, et c'est ce qu'on lit d'abord. Les blocs sont en pleine
              largeur — la page produit ne porte aucune grille de blocs de
              référence, à la différence de la page projet.

              **Le second bloc était un `<details>` replié au pied du premier**
              jusqu'au 28/08/2026 : trois indicateurs et leur point d'entrée
              d'écriture disparaissaient derrière un chevron de 10 px. Aucune
              lecture n'a changé — ce sont les mêmes tableaux, séparés par le
              même `filter`.

              Les points d'entrée tombent tous avec le même `canWriteIndicators` :
              le droit dérivé (arbitrage (b)) et la lecture seule d'un produit
              archivé. `setNorthStar` les rejoint sans qu'une condition s'écrive
              — c'est la propriété que ce `&&` cherchait. Les actions sont liées
              au produit **côté serveur** ; le bloc y ajoute l'indicateur au
              rendu, et chacune redérive le droit sur l'identifiant reçu. */}
        <Indicators
          vision={product.vision}
          /* **Pas `canWriteIndicators`** : la vision est une propriété du
               produit, pas de ses accompagnements. Un contributeur désigné
               écrit les indicateurs de ce bloc et pas sa vision — les deux
               points d'entrée tombent séparément, et c'est la seule chose que
               le bloc sait de ces deux droits. */
          visionHref={
            session.can.manageDomain && !archived
              ? ROUTES.productVision(product.id)
              : null
          }
          indicators={productIndicators}
          readings={productReadings}
          adoptions={adoptions}
          addHref={
            canWriteIndicators ? ROUTES.productIndicatorNew(product.id) : null
          }
          editHref={
            canWriteIndicators
              ? (indicatorId) =>
                  ROUTES.productIndicatorEdit(product.id, indicatorId)
              : null
          }
          archiveIndicator={
            canWriteIndicators ? archiveIndicator.bind(null, product.id) : null
          }
          addReadingHref={
            canWriteIndicators
              ? (indicatorId) =>
                  ROUTES.productReadingNew(product.id, indicatorId)
              : null
          }
          /* La série se lit par tout le domaine (D9), comme le bloc : ce
               point d'entrée n'est pas conditionné par le droit d'écrire. */
          readingsHref={(indicatorId) =>
            ROUTES.productReadings(product.id, indicatorId)
          }
          setNorthStar={
            canWriteIndicators ? setNorthStar.bind(null, product.id) : null
          }
        />
        {/* **Le troisième bloc de la page** — le deuxième jusqu'à ce que
              « Indicateurs » quitte le repli du premier, le 28/08/2026 —, et il
              a **remonté de deux rangs** le 21/08/2026 : ce qu'on fait sur ce
              produit se lit avant ce que le produit est. C'est aussi le seul à porter les
              accompagnements — « Tous les accompagnements », qui le suivait,
              lisait le même tableau dans le même ordre vers la même destination
              de clic, et ce qui n'existait que là est versé dedans : l'objectif
              sur chaque ligne, les accompagnements sans date, et l'état vide qui
              porte le geste. **Les avatars d'équipe en sont repartis le jour
              même** — trop de place pour ce qu'ils disaient.

              Il ne connaît aucun droit pour ce qu'il montre — il se lit par
              tout le domaine (D9), sur un produit vivant comme archivé — et
              n'ouvre qu'un point d'entrée d'écriture, celui de son état vide.

              **Sa fenêtre n'est plus dans l'URL** : filtrer était une
              navigation, ce qui remontait en haut de la page et changeait
              l'adresse. C'est désormais un `useState` dans `ScaleSwitch`, et
              les frises qu'il monte sont rendues ici, sur le serveur. */}
        <Roadmap
          projects={projects}
          milestones={milestones}
          /* **Le seul point d'entrée d'écriture du bloc**, celui de son état
               vide, et il tombe avec les deux mêmes conditions que « Nouvel
               accompagnement » de l'en-tête (F1-D1, D9, règle 4). Ce n'est pas
               ce rendu qui protège : le formulaire de création redérive le
               droit sur le produit reçu. */
          addHref={
            session.can.manageDomain && !archived
              ? ROUTES.projectNewForProduct(product.id)
              : null
          }
        />

        {/* **Le dernier bloc de la page**, né le 21/08/2026 de la fusion de
              « Personae » et de « Use Cases ». Les deux répondaient à la même
              question sous deux titres — pour qui ce produit est conçu, et ce
              qu'on vient y faire —, et deux cartes de pleine largeur posées
              l'une sous l'autre repoussaient les accompagnements hors de
              l'écran. La distinction reste entière à l'intérieur : deux rangs,
              deux intertitres, deux dessins.

              Il **ne demande aucune lecture neuve** : ce sont les deux mêmes
              collections qu'avant, et les personae y servent deux fois — les
              cartes du premier rang, et les pastilles du second, qui reçoit les
              identifiants et leur rend des noms. Aucune lecture par carte, la
              discipline de la page depuis T5.5.

              Le bloc se lit par tout le domaine (D9) — d'où les deux liens de
              fiche, jamais nuls. Ses deux points d'entrée d'écriture tombent
              avec `canWriteIndicators` : **le même droit que les indicateurs**,
              dérivé des accompagnements du produit, et la lecture seule d'un
              produit archivé avec lui. Ce n'est pas ce rendu qui protège — les
              actions redérivent le droit sur les identifiants reçus. */}
        <Audience
          personas={productPersonas}
          useCases={productUseCases}
          personaHref={(personaId) =>
            ROUTES.productPersona(product.id, personaId)
          }
          useCaseHref={(useCaseId) =>
            ROUTES.productUseCase(product.id, useCaseId)
          }
          addPersonaHref={
            canWriteIndicators ? ROUTES.productPersonaNew(product.id) : null
          }
          addUseCaseHref={
            canWriteIndicators ? ROUTES.productUseCaseNew(product.id) : null
          }
        />

      </Page>
    </DrawerHost>
  );
}

/**
 * L'action de création d'un accompagnement, le produit déjà désigné.
 *
 * C'est le chemin canonique : un accompagnement se crée depuis le produit
 * qu'il accompagne, et le rattachement — obligatoire (D4) — n'a alors pas à
 * être redemandé. Rendue par l'appelant, et lui seul, sous condition de droit
 * **et de vie du produit** : ce composant n'en connaît aucun des deux.
 */
function NewProjectLink({ productId }: { productId: string }) {
  return (
    <Link
      href={ROUTES.projectNewForProduct(productId)}
      className={buttonClass()}
    >
      Nouvel accompagnement
    </Link>
  );
}
