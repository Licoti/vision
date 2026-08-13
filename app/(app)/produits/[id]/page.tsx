/**
 * Produit — la page de détail, conteneur des accompagnements successifs.
 *
 * Elle répond à « qu'avons-nous fait sur ce produit dans le temps » : un
 * en-tête d'identité, puis les accompagnements du plus récent au plus ancien
 * (docs/06 §6). La frise du temps long viendra **au-dessus** de cette liste en
 * C5, sans la déplacer — aucun indicateur, aucune courbe ici.
 *
 * L'identifiant vient de l'URL : sa forme est vérifiée avant la base, faute de
 * quoi un paramètre fantaisiste ne produit pas un 404 mais une erreur
 * PostgreSQL, donc un 500. Un produit inconnu — ou d'un autre domaine — rend
 * 404 : la seconde réponse ne se distingue pas de la première, et c'est
 * volontaire.
 *
 * **« Modifier ce produit » et « Nouvel accompagnement » n'apparaissent qu'au
 * responsable de domaine** (F1-D1, D9) : les actions sont absentes du rendu
 * pour tout autre, pas grisées.
 *
 * Aucune requête directe : tout passe par `session.db`, déjà scopé sur le
 * domaine courant. Règle 1.
 */

import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/shell/breadcrumb";
import { AvatarGroup } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { List, ListRow } from "@/components/ui/list";
import { Page, PageHeader } from "@/components/ui/page";
import { SectionHeader } from "@/components/ui/section";
import { StatusDot } from "@/components/ui/status-dot";
import { requireSession } from "@/lib/auth/provider";
import { formatAccompaniments, formatPeriod } from "@/lib/format";
import { ROUTES } from "@/lib/navigation";
import { findProductDetail, listProductProjects } from "@/lib/queries/products";
import { isUuid } from "@/lib/uuid";

export const metadata = {
  title: "Produit — Vision",
};

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const session = await requireSession();

  const product = await findProductDetail(session.db, id);
  if (!product) notFound();

  const projects = await listProductProjects(session.db, product.id);

  return (
    <>
      <Breadcrumb
        items={[
          { href: ROUTES.products, label: "Produits" },
          { label: product.name },
        ]}
      />
      <Page>
        <PageHeader
          overline={`${product.entityLabel} · ${formatAccompaniments(projects.length)}`}
          title={product.name}
          {...(product.description ? { lead: product.description } : {})}
          action={
            session.can.manageDomain ? (
              <span className="flex flex-wrap items-center gap-3">
                <Link
                  href={ROUTES.productEdit(product.id)}
                  className="rounded-lg border border-content-neutral-normal px-4 py-2 text-sm font-semibold text-content-neutral-dark"
                >
                  Modifier ce produit
                </Link>
                <NewProjectLink productId={product.id} />
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
                      <span aria-hidden="true" className="text-content-neutral-light">
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
              {...(session.can.manageDomain
                ? { action: <NewProjectLink productId={product.id} /> }
                : {})}
            />
          )}
        </section>
      </Page>
    </>
  );
}

/**
 * L'action de création d'un accompagnement, le produit déjà désigné.
 *
 * C'est le chemin canonique : un accompagnement se crée depuis le produit
 * qu'il accompagne, et le rattachement — obligatoire (D4) — n'a alors pas à
 * être redemandé. Rendue par l'appelant, et lui seul, sous condition de droit :
 * ce composant n'en connaît aucun.
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
