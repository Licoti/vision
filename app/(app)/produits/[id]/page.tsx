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
 * **« Modifier ce produit », « Archiver » et « Nouvel accompagnement »
 * n'apparaissent qu'au responsable de domaine** (F1-D1, D9) : les actions sont
 * absentes du rendu pour tout autre, pas grisées.
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
import { Indicators } from "@/components/products/indicators";
import { Personas } from "@/components/products/personas";
import { Roadmap } from "@/components/products/roadmap";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { DrawerHost, DrawerLink } from "@/components/ui/drawer";
import { AvatarGroup } from "@/components/ui/avatar";
import { Block, BlockHeader } from "@/components/ui/block";
import { EmptyState } from "@/components/ui/empty-state";
import { List, ListRow } from "@/components/ui/list";
import { Page, PageHeader } from "@/components/ui/page";
import { StatusDot } from "@/components/ui/status-dot";
import { loadProductDrawer } from "./drawers";
import { requireSession } from "@/lib/auth/provider";
import {
  productRequestFromParams,
  PRODUCT_PANEL_PARAMS,
  resolveProductDrawer,
} from "@/lib/drawers/product";
import { formatAccompaniments, formatMonth, formatPeriod } from "@/lib/format";
import { ROUTES } from "@/lib/navigation";
import {
  listProductAdoptions,
  listProductIndicators,
  listProductReadings,
} from "@/lib/queries/indicators";
import { listProductPersonas } from "@/lib/queries/personas";
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
     * Les deux bornes de la fenêtre de la roadmap. **Elles ne rejoignent pas le
     * décompte d'exclusivité** des trois clés au-dessus : elles n'ouvrent aucun
     * panneau, et leur absence est l'état sans filtre plutôt qu'une fermeture.
     */
    de?: string;
    a?: string;
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
  ] = await Promise.all([
    listProductProjects(session.db, product.id),
    listProductIndicators(session.db, product.id),
    listProductReadings(session.db, product.id),
    listProductMilestones(session.db, product.id),
    listProductAdoptions(session.db, product.id),
    listProductPersonas(session.db, product.id),
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

  const {
    archiver,
    indicateur,
    releve,
    releves,
    vision,
    persona,
    fiche,
    de,
    a,
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

     **`de` et `a` n'y entrent pas**, et le décompte les ignore comme avant : ce
     ne sont pas des clés d'ouverture, et les faire compter fermerait un panneau
     chaque fois que la roadmap est filtrée. */
  const keys = {
    archiver,
    indicateur,
    releve,
    releves,
    vision,
    persona,
    fiche,
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
        {/* La mention datée, au mois (D13) : c'est une date de rangement, pas
              un horodatage — le jour n'apprendrait rien de plus. Le trio de
              jetons est celui de l'en-tête de la page projet, mesuré en T2.4 et
              repris sans qu'un couple neuf apparaisse. */}
        {product.archivedAt ? (
          <p className="rounded-xl border border-surface-neutral-lighter bg-surface-neutral-pale px-7 py-4 text-sm text-content-neutral-dark">
            <span className="font-semibold">Produit archivé</span>
            {` en ${formatMonth(product.archivedAt)}. Il n'apparaît plus dans la liste des produits ; sa page et ses accompagnements passés restent lisibles.`}
          </p>
        ) : null}

        <PageHeader
          overline={`${product.entityLabel} · ${formatAccompaniments(projects.length)}`}
          title={product.name}
          {...(product.description ? { lead: product.description } : {})}
          action={
            session.can.manageDomain ? (
              <span className="flex flex-wrap items-center gap-3">
                {archived ? (
                  /* Un formulaire nu : le rétablissement n'a rien à saisir et
                       rien à confirmer — c'est le geste qui **défait**, et
                       `docs/06` §9 proscrit la confirmation là où elle ne
                       protège rien. */
                  <form action={restoreProduct.bind(null, product.id)}>
                    <button
                      type="submit"
                      className="rounded-lg bg-surface-primary-base px-4 py-2 text-sm font-semibold text-content-neutral-pale"
                    >
                      Rétablir ce produit
                    </button>
                  </form>
                ) : (
                  <>
                    <Link
                      href={ROUTES.productEdit(product.id)}
                      className="rounded-lg border border-content-neutral-normal px-4 py-2 text-sm font-semibold text-content-neutral-dark"
                    >
                      Modifier ce produit
                    </Link>
                    <DrawerLink
                      href={ROUTES.productArchive(product.id)}
                      request={{ kind: "archive" }}
                      className="rounded-lg border border-content-neutral-normal px-4 py-2 text-sm font-semibold text-content-neutral-dark"
                    >
                      Archiver
                    </DrawerLink>
                    <NewProjectLink productId={product.id} />
                  </>
                )}
              </span>
            ) : null
          }
        />

        {/* **Le premier bloc de la page** depuis le 17/08/2026, et **« Vision
              produit » depuis le 18/08/2026** : la vision porte la raison
              d'être du produit et la North Star la mesure, et c'est ce qu'on
              lit d'abord.
              Le bloc est en pleine largeur, comme la liste — la page produit ne
              porte aucune grille de blocs de référence, à la différence de la
              page projet.

              **Un seul bloc** : les courbes de T5.6 y ont été fusionnées, avec
              la North Star en tête. Il reçoit les mêmes tableaux qu'avant —
              aucune lecture de plus —, plus les adoptions, qui remplacent les
              seules cibles.

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
        {/* **Le troisième bloc de la page** (18/08/2026) : « Vision produit »
              dit pourquoi ce produit existe et ce qu'il mesure, celui-ci dit
              **pour qui**. Il vient juste après, avant les accompagnements :
              c'est la question qu'on se pose en concevant, pas ce qu'on a fait.

              Le bloc se lit par tout le domaine (D9) — d'où le lien de fiche,
              jamais nul. Son seul point d'entrée d'écriture tombe avec
              `canWriteIndicators` : **le même droit que les indicateurs**,
              dérivé des accompagnements du produit, et la lecture seule d'un
              produit archivé avec lui. Ce n'est pas ce rendu qui protège — les
              trois actions redérivent le droit sur les identifiants reçus. */}
        <Personas
          personas={productPersonas}
          detailHref={(personaId) =>
            ROUTES.productPersona(product.id, personaId)
          }
          addHref={
            canWriteIndicators ? ROUTES.productPersonaNew(product.id) : null
          }
        />

        {/* **Le deuxième bloc de la page** (18/08/2026), sous le nom
              « Accompagnements en cours ». Il ferme la position qu'il occupait
              la veille et retrouve celle de `docs/06` §6 — « au-dessus de la
              liste des accompagnements, sans la déplacer ». L'écart qui reste
              au document n'est plus l'ordre mais **le nom et la fenêtre** :
              le bloc s'ouvre sur l'année en cours, janvier à décembre, et la
              liste ci-dessous porte l'histoire entière.

              Elle ne connaît aucun droit — elle se lit par tout le domaine (D9),
              sur un produit vivant comme archivé — et n'ouvre aucun point
              d'entrée d'écriture. `de` et `a` sont des paramètres de **lecture**,
              et `timelineWindow` est la seule porte par où ils entrent. */}
        <Roadmap
          productId={product.id}
          projects={projects}
          milestones={milestones}
          from={de}
          to={a}
        />

        {/* **Le dernier bloc de la page** (18/08/2026), sous le nom « Tous
              les accompagnements » : le bloc au-dessus cadre l'année en cours,
              celui-ci porte l'histoire entière, du plus récent au plus ancien.
              C'est ce couple qui répond à la question de l'écran — ce qu'on
              fait en ce moment, et ce qu'on a fait.

              **Sa liste est à fond perdu** : la carte est celle du bloc, et
              une liste qui gardait la sienne faisait une carte dans une carte.
              Il ne reste que les lignes, leurs filets et leur rythme — ceux
              des lignes de la frise juste au-dessus, ce qui était le but.

              L'état vide garde son `EmptyState`, à la différence des deux
              autres blocs qui rendent un paragraphe : c'est le seul des trois
              qui porte un **geste**, et `EmptyState` est ce qui le place
              (règle 5). */}
        <Block>
          <BlockHeader
            title="Tous les accompagnements"
            note="Les accompagnements de ce produit, du plus récent au plus ancien."
          />

          {projects.length > 0 ? (
            <List flush label="Tous les accompagnements de ce produit">
              {projects.map((project) => (
                <ListRow
                  key={project.id}
                  flush
                  href={ROUTES.project(project.id)}
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="flex items-center gap-2 font-semibold text-content-neutral-dark">
                        <StatusDot nature={project.statusNature} />
                        {project.statusLabel}
                      </span>
                      <span
                        aria-hidden="true"
                        className="text-content-neutral-light"
                      >
                        ·
                      </span>
                      <span className="text-content-neutral-base">
                        {formatPeriod(project.startedOn, project.expectedEndOn)}
                      </span>
                    </span>

                    <span className="text-md font-semibold text-content-neutral-darkest">
                      {project.name}
                    </span>

                    {project.objective ? (
                      <span className="max-w-160 text-sm text-content-neutral-base">
                        {project.objective}
                      </span>
                    ) : null}
                  </div>

                  <AvatarGroup
                    names={project.team.map((member) => member.fullName)}
                  />
                </ListRow>
              ))}
            </List>
          ) : (
            <EmptyState
              level={3}
              title="Aucun accompagnement pour l'instant"
              description="Les accompagnements de ce produit s'afficheront ici, du plus récent au plus ancien, chacun avec sa période, son statut, son objectif et son équipe."
              {...(session.can.manageDomain && !archived
                ? { action: <NewProjectLink productId={product.id} /> }
                : {})}
            />
          )}
        </Block>
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
      className="rounded-lg bg-surface-primary-base px-4 py-2 text-sm font-semibold text-content-neutral-pale"
    >
      Nouvel accompagnement
    </Link>
  );
}
