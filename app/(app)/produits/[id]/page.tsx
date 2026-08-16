/**
 * Produit — la page de détail, conteneur des accompagnements successifs.
 *
 * Elle répond à « qu'avons-nous fait sur ce produit dans le temps » : un
 * en-tête d'identité, puis les accompagnements du plus récent au plus ancien
 * (docs/06 §6), et depuis T5.1 le bloc « Indicateurs » — ce que le produit
 * mesure — **sous** cette liste. La frise du temps long viendra **au-dessus**
 * d'elle en T5.5, sans la déplacer, et les courbes en T5.6 : aucune ici.
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
 * entière, mention datée en tête, et ce sont ses deux actions d'écriture qui
 * disparaissent — « Modifier » et « Nouvel accompagnement », l'état vide
 * compris. Seul « Rétablir » s'y ajoute, pour le responsable de domaine. Ce
 * n'est pas ce rendu qui protège : `updateProduct` refuse le produit archivé
 * **reçu**, une route retirée n'ayant jamais protégé l'action qu'elle affichait.
 *
 * **Le panneau de confirmation est cette page, plus un paramètre** (D30, T3.2,
 * repris de la page projet) : `?archiver=confirmation` l'ouvre, la page reste
 * rendue derrière et porte alors l'attribut HTML `inert`. Toute autre valeur
 * n'ouvre rien — une seule valeur d'ouverture, l'objet visé étant celui de la
 * page.
 *
 * Aucune requête directe : tout passe par `session.db`, déjà scopé sur le
 * domaine courant. Règle 1.
 */

import Link from "next/link";
import { notFound } from "next/navigation";

import { archiveProduct, restoreProduct } from "../actions";
import { Indicators } from "@/components/products/indicators";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { AvatarGroup } from "@/components/ui/avatar";
import { ConfirmPanel } from "@/components/ui/confirm-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { List, ListRow } from "@/components/ui/list";
import { Page, PageHeader } from "@/components/ui/page";
import { SectionHeader } from "@/components/ui/section";
import { StatusDot } from "@/components/ui/status-dot";
import { requireSession } from "@/lib/auth/provider";
import { formatAccompaniments, formatMonth, formatPeriod } from "@/lib/format";
import { ARCHIVE_PANEL_CONFIRM, ROUTES } from "@/lib/navigation";
import { listProductIndicators } from "@/lib/queries/indicators";
import { findProductDetail, listProductProjects } from "@/lib/queries/products";
import { isUuid } from "@/lib/uuid";

export const metadata = {
  title: "Produit — Vision",
};

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ archiver?: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const session = await requireSession();

  const product = await findProductDetail(session.db, id);
  if (!product) notFound();

  /* Deux lectures indépendantes, un seul temps d'attente — la discipline de
     T4.1 sur la page projet. Ni l'une ni l'autre ne dépend du droit : le bloc
     « Indicateurs » se lit par tout le domaine (D9), sur un produit vivant
     comme archivé (règle 4). */
  const [projects, productIndicators] = await Promise.all([
    listProductProjects(session.db, product.id),
    listProductIndicators(session.db, product.id),
  ]);

  const archived = product.archivedAt !== null;
  /* Le droit décide de tout ce qui suit, et l'archivage avec lui : on ne
     confirme pas l'archivage de ce qui est déjà rangé. Un membre qui tape
     l'URL d'ouverture obtient la page nue — pas un 404 : la page produit reste
     lisible par tout le domaine (D9), seul le panneau disparaît. */
  const { archiver } = await searchParams;
  const panelOpen =
    session.can.manageDomain && !archived && archiver === ARCHIVE_PANEL_CONFIRM;

  return (
    <>
      {panelOpen ? (
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
                title="Aucun accompagnement pour l'instant"
                description="Les accompagnements de ce produit s'afficheront ici, du plus récent au plus ancien, chacun avec sa période, son statut, son objectif et son équipe."
                {...(session.can.manageDomain && !archived
                  ? { action: <NewProjectLink productId={product.id} /> }
                  : {})}
              />
            )}
          </section>

          {/* Sous la liste, jamais au-dessus : la frise de T5.5 prendra la
              place au-dessus d'elle, sans la déplacer (docs/06 §6). Le bloc est
              en pleine largeur, comme la liste — la page produit ne porte
              aucune grille de blocs de référence, à la différence de la page
              projet. */}
          <Indicators indicators={productIndicators} />
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
