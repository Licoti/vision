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
 * **relevé** le corrige. La page reste rendue derrière eux, et porte alors
 * l'attribut HTML `inert`.
 *
 * **Les trois clés sont mutuellement exclusives, et le sont par une règle unique :
 * plusieurs présentes ensemble n'ouvrent rien** — la règle de la page projet
 * depuis T4.2, reprise ici sous sa forme par **décompte** (T4.4, T4bis.3). Deux
 * `role="dialog"` ou deux `inert` concurrents ne se rattrapent pas après coup, et
 * aucune préséance ne s'invente entre deux gestes de même rang. Un seul
 * `panelOpen`, un seul `inert`, un seul panneau monté : la propriété se lit dans
 * le code, elle ne se déduit pas de trois conditions éparses — et l'énoncé n'a
 * pas eu à changer quand T5.3 a ajouté sa clé, ce pour quoi il avait été écrit
 * en décompte.
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

import {
  archiveIndicator,
  archiveReading,
  createIndicator,
  createReading,
  setNorthStar,
  updateIndicator,
  updateReading,
} from "./actions";
import { archiveProduct, restoreProduct } from "../actions";
import { IndicatorPanel } from "@/components/products/indicator-panel";
import { Indicators } from "@/components/products/indicators";
import { ReadingPanel } from "@/components/products/reading-panel";
import { ReadingsPanel } from "@/components/products/readings-panel";
import { Roadmap } from "@/components/products/roadmap";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { AvatarGroup } from "@/components/ui/avatar";
import { ConfirmPanel } from "@/components/ui/confirm-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { List, ListRow } from "@/components/ui/list";
import { Page, PageHeader } from "@/components/ui/page";
import { SectionHeader } from "@/components/ui/section";
import { StatusDot } from "@/components/ui/status-dot";
import { requireSession } from "@/lib/auth/provider";
import { indicatorReadings, indicators } from "@/lib/db/schema";
import { toIndicatorFormValues } from "@/lib/forms/indicator";
import { toReadingFormValues } from "@/lib/forms/reading";
import { formatAccompaniments, formatMonth, formatPeriod } from "@/lib/format";
import {
  ARCHIVE_PANEL_CONFIRM,
  INDICATOR_PANEL_NEW,
  ROUTES,
} from "@/lib/navigation";
import {
  listProductAdoptions,
  listProductIndicators,
  listProductReadings,
} from "@/lib/queries/indicators";
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
  const [projects, productIndicators, productReadings, milestones, adoptions] =
    await Promise.all([
      listProductProjects(session.db, product.id),
      listProductIndicators(session.db, product.id),
      listProductReadings(session.db, product.id),
      listProductMilestones(session.db, product.id),
      listProductAdoptions(session.db, product.id),
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

  const { archiver, indicateur, releve, releves, de, a } = await searchParams;

  /* L'exclusivité, avant tout le reste : plusieurs clés d'ouverture
     concurrentes n'en ouvrent aucune. Tout ce qui suit lit `asked`, pas les
     paramètres bruts, si bien qu'aucun chemin ne peut ouvrir deux panneaux à la
     fois — la garantie est dans le code, pas dans la relecture.

     La forme est celle de la page projet (T4.4, T4bis.3) : un **décompte**, et
     non une comparaison binaire. T5.3 y a ajouté `releve` sans que l'énoncé
     change d'un caractère — c'est très exactement ce pour quoi il avait été
     écrit ainsi.

     **`de` et `a` n'y entrent pas**, et le décompte reste donc sur trois clés :
     ce ne sont pas des clés d'ouverture. Une fenêtre de roadmap ne dispute
     l'écran à aucun panneau — elle ne pose ni `role="dialog"` ni `inert` —, et
     les faire compter fermerait un panneau chaque fois que la roadmap est
     filtrée. */
  const keys = { archiver, indicateur, releve, releves };
  const conflict =
    Object.values(keys).filter((value) => value !== undefined).length > 1;
  const asked: Partial<typeof keys> = conflict ? {} : keys;

  /* Le droit décide de tout ce qui suit, et l'archivage avec lui : on ne
     confirme pas l'archivage de ce qui est déjà rangé. Un membre qui tape
     l'URL d'ouverture obtient la page nue — pas un 404 : la page produit reste
     lisible par tout le domaine (D9), seul le panneau disparaît. */
  const archivePanelOpen =
    session.can.manageDomain &&
    !archived &&
    asked.archiver === ARCHIVE_PANEL_CONFIRM;

  /* Une seule clé, dont la **valeur** porte le cas (T3.2, T4bis.5) : `nouvel`
     crée, un identifiant corrige, tout le reste n'ouvre rien. L'indicateur est
     confronté au produit et à l'archivage — le bloc n'affiche aucun lien vers un
     indicateur archivé, mais une URL se tape.

     La forme est vérifiée avant la base, comme pour l'identifiant de la page :
     une colonne `uuid` interrogée avec n'importe quoi rend une erreur
     PostgreSQL, donc un 500, là où l'on attend une page nue. */
  const editedIndicator =
    canWriteIndicators &&
    asked.indicateur &&
    asked.indicateur !== INDICATOR_PANEL_NEW &&
    isUuid(asked.indicateur)
      ? await session.db.find(indicators, asked.indicateur)
      : undefined;

  const indicator =
    editedIndicator &&
    editedIndicator.productId === product.id &&
    editedIndicator.archivedAt === null
      ? editedIndicator
      : null;

  const indicatorPanelOpen =
    canWriteIndicators &&
    (asked.indicateur === INDICATOR_PANEL_NEW || indicator !== null);

  /* La clé de T5.3, dont la valeur change de **table** et non de nature :
     l'identifiant d'un indicateur saisit un relevé, celui d'un relevé le
     corrige. Deux lectures scopées successives tranchent — un UUID d'`indicators`
     n'est pas un UUID d'`indicator_readings` —, et ce qui n'est ni l'un ni
     l'autre n'ouvre rien.

     La forme est vérifiée avant la base, comme partout ailleurs sur cette page :
     une colonne `uuid` interrogée avec n'importe quoi rend une erreur
     PostgreSQL, donc un 500, là où l'on attend une page nue. */
  const readingTarget =
    canWriteIndicators && asked.releve && isUuid(asked.releve)
      ? asked.releve
      : null;

  /* L'indicateur d'abord : c'est le cas courant, et le seul qu'un lien de
     l'écran atteint. Il doit être vivant et appartenir à **ce** produit — le
     bloc ne montre aucun indicateur archivé, mais une URL se tape. */
  const readingIndicator = readingTarget
    ? await session.db.find(indicators, readingTarget)
    : undefined;

  const newReadingFor =
    readingIndicator &&
    readingIndicator.productId === product.id &&
    readingIndicator.archivedAt === null
      ? readingIndicator
      : null;

  /* Le relevé ensuite, et sa chaîne remontée jusqu'au produit — relevé,
     indicateur, produit : la même que remonte `openReading` dans l'action, et
     pour la même raison. Un relevé retiré, ou porté par un indicateur archivé ou
     rattaché à un autre produit, n'ouvre rien. */
  const editedReading =
    readingTarget && !newReadingFor
      ? await session.db.find(indicatorReadings, readingTarget)
      : undefined;

  const editedReadingIndicator =
    editedReading && editedReading.archivedAt === null
      ? await session.db.find(indicators, editedReading.indicatorId)
      : undefined;

  const readingPanel = newReadingFor
    ? { indicator: newReadingFor, reading: null }
    : editedReading &&
        editedReadingIndicator &&
        editedReadingIndicator.productId === product.id &&
        editedReadingIndicator.archivedAt === null
      ? { indicator: editedReadingIndicator, reading: editedReading }
      : null;

  /* La septième clé, et la plus simple : sa valeur est **toujours** un
     identifiant d'indicateur, jamais polymorphe. La forme est vérifiée avant la
     base, comme partout sur cette page — une colonne `uuid` interrogée avec
     n'importe quoi rend une erreur PostgreSQL, donc un 500, là où l'on attend
     une page nue.

     **Elle ne dépend d'aucun droit** : lire la série d'un indicateur se fait par
     tout le domaine (D9), comme le bloc lui-même. Ce sont les gestes *dans* le
     panneau qui tombent avec `canWriteIndicators`. */
  const readingsTarget =
    asked.releves && isUuid(asked.releves) ? asked.releves : null;

  const readingsIndicatorRow = readingsTarget
    ? await session.db.find(indicators, readingsTarget)
    : undefined;

  const readingsIndicator =
    readingsIndicatorRow &&
    readingsIndicatorRow.productId === product.id &&
    readingsIndicatorRow.archivedAt === null
      ? productIndicators.find((row) => row.id === readingsIndicatorRow.id)
      : undefined;

  const panelOpen =
    archivePanelOpen ||
    indicatorPanelOpen ||
    readingPanel !== null ||
    readingsIndicator !== undefined;

  return (
    <>
      {archivePanelOpen ? (
        /* L'action est liée **côté serveur** au produit courant : l'identifiant
           sort de la saisie, et le panneau ne connaît pas ce qu'il archive. Ce
           n'est pas un verrou — Next sérialise les arguments liés dans un champ
           `$ACTION_…`, réécrivable. Le verrou est dans l'action, qui interroge
           `manageDomain` puis rapproche le produit reçu du domaine courant. */
        <ConfirmPanel
          title="Archiver ce produit"
          context={product.name}
          closeHref={ROUTES.product(product.id)}
          action={archiveProduct.bind(null, product.id)}
          submitLabel="Archiver ce produit"
          pendingLabel="Archivage…"
        >
          {/* Ce que le geste retire, et ce qu'il laisse. Le texte est rendu sur
              le serveur et traverse en `children` : le panneau est client pour
              son seul refus. */}
          <div className="flex flex-col gap-3 text-sm text-content-neutral-dark">
            <p>
              Ce produit disparaît de la liste des produits et des écrans qui la
              reprennent. Rien n&apos;est supprimé.
            </p>
            <p>
              Sa page reste lisible par son adresse, avec ses accompagnements
              passés : c&apos;est la mémoire du centre, elle ne se perd pas.
            </p>
            <p>Le geste se défait : « Rétablir » ramène le produit.</p>
          </div>
        </ConfirmPanel>
      ) : null}

      {indicatorPanelOpen ? (
        /* L'action est liée **côté serveur** — au produit courant en création,
           au produit et à l'indicateur en correction (la forme d'`updateResource`
           depuis T4bis.5) : les identifiants sortent de la saisie, et le panneau
           ne connaît ni le produit ni l'indicateur qu'il écrit. Ce n'est pas un
           verrou — Next sérialise les arguments liés dans un champ `$ACTION_…`,
           réécrivable. Le verrou est dans l'action, qui dérive le droit sur le
           produit **reçu** puis rapproche l'indicateur **reçu** de ce produit ;
           un panneau absent du rendu n'a jamais protégé le point d'entrée HTTP
           qui l'accompagne. */
        <IndicatorPanel
          /* La `key` change avec ce que le panneau édite, pour la raison écrite
             sur celle du panneau d'activité : `useActionState` ne relit son état
             initial qu'au montage. */
          key={indicator ? indicator.id : INDICATOR_PANEL_NEW}
          productName={product.name}
          closeHref={ROUTES.product(product.id)}
          action={
            indicator
              ? updateIndicator.bind(null, product.id, indicator.id)
              : createIndicator.bind(null, product.id)
          }
          {...(indicator
            ? {
                title: "Modifier l'indicateur",
                submitLabel: "Enregistrer les modifications",
                initial: toIndicatorFormValues(indicator),
              }
            : {})}
        />
      ) : null}

      {readingPanel ? (
        /* Les identifiants sont liés **côté serveur** — au produit et à
           l'indicateur en saisie, au produit et au relevé en correction : le
           panneau ne connaît ni l'un ni l'autre. Ce n'est pas un verrou, Next
           les sérialisant en clair dans un champ `$ACTION_…`. Le verrou est dans
           l'action : `createReading` passe par `openIndicator`, `updateReading`
           par `openReading`, et les deux s'arrêtent au même `openProductWrite`
           sur le produit **reçu**. */
        <ReadingPanel
          /* La `key` change avec ce que le panneau édite — et distingue la
             saisie d'un indicateur de celle d'un autre : `useActionState` ne
             relit son état initial qu'au montage. */
          key={
            readingPanel.reading
              ? readingPanel.reading.id
              : `nouveau-${readingPanel.indicator.id}`
          }
          productName={product.name}
          indicatorLabel={readingPanel.indicator.label}
          closeHref={ROUTES.product(product.id)}
          action={
            readingPanel.reading
              ? updateReading.bind(null, product.id, readingPanel.reading.id)
              : createReading.bind(null, product.id, readingPanel.indicator.id)
          }
          {...(readingPanel.reading
            ? {
                title: "Modifier le relevé",
                submitLabel: "Enregistrer les modifications",
                initial: toReadingFormValues(readingPanel.reading),
              }
            : {})}
        />
      ) : null}

      {/* Le panneau de série (hors ticket, 17/08/2026) : il **se lit par tout le
          domaine**, à la différence des six autres, et c'est pourquoi son
          ouverture ne passe pas par `canWriteIndicators`. Ce sont ses trois
          gestes qui tombent avec le droit, chacun à `null`. */}
      {readingsIndicator ? (
        <ReadingsPanel
          productName={product.name}
          indicator={readingsIndicator}
          readings={productReadings.filter(
            (reading) => reading.indicatorId === readingsIndicator.id,
          )}
          closeHref={ROUTES.product(product.id)}
          addReadingHref={
            canWriteIndicators
              ? ROUTES.productReadingNew(product.id, readingsIndicator.id)
              : null
          }
          editReadingHref={
            canWriteIndicators
              ? (readingId) =>
                  ROUTES.productReadingEdit(product.id, readingId)
              : null
          }
          archiveReading={
            canWriteIndicators ? archiveReading.bind(null, product.id) : null
          }
        />
      ) : null}

      {/* `inert` est un attribut HTML, pas un script : le contenu reste lu et
          affiché derrière le voile, mais ne prend plus ni focus ni clic tant
          que le panneau est ouvert. */}
      <div inert={panelOpen}>
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
                      <Link
                        href={ROUTES.productArchive(product.id)}
                        className="rounded-lg border border-content-neutral-normal px-4 py-2 text-sm font-semibold text-content-neutral-dark"
                      >
                        Archiver
                      </Link>
                      <NewProjectLink productId={product.id} />
                    </>
                  )}
                </span>
              ) : null
            }
          />

          {/* **Le premier bloc de la page** depuis le 17/08/2026 : la North
              Star porte l'objectif du produit, et c'est ce qu'on lit d'abord.
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
              canWriteIndicators
                ? archiveIndicator.bind(null, product.id)
                : null
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
          <section className="flex flex-col gap-4">
            <SectionHeader
              title="Accompagnements"
              note="Du plus récent au plus ancien."
            />

            {projects.length > 0 ? (
              <List label="Accompagnements de ce produit">
                {projects.map((project) => (
                  <ListRow key={project.id} href={ROUTES.project(project.id)}>
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
          </section>

          {/* **La roadmap ferme la page** (demande du 17/08/2026), alors que
              `docs/06` §6 la veut « au-dessus de la liste, sans la déplacer ».
              L'écart à la documentation est assumé et consigné : la North Star
              ouvre désormais l'écran, parce qu'elle porte la question à laquelle
              le produit répond ; la roadmap détaille le comment, et le détail
              vient après. La liste reste l'équivalent textuel de la roadmap,
              juste au-dessus d'elle.

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

        </Page>
      </div>
    </>
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
