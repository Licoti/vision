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
 * Aucune requête directe : tout passe par `session.db`, déjà scopé sur le
 * domaine courant. Règle 1.
 */

import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/shell/breadcrumb";
import { AvatarGroup } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { List, ListRow } from "@/components/ui/list";
import { Page, PageHeader } from "@/components/ui/page";
import { SectionHeader } from "@/components/ui/section";
import { requireSession } from "@/lib/auth/provider";
import { formatAccompaniments, formatPeriod } from "@/lib/format";
import { ROUTES } from "@/lib/navigation";
import {
  findProductDetail,
  listProductProjects,
  type ProductProject,
} from "@/lib/queries/products";
import { isUuid } from "@/lib/uuid";

export const metadata = {
  title: "Produit — Vision",
};

/**
 * La pastille de statut est colorée par la **nature**, jamais par le libellé :
 * un domaine renomme « En cours », il ne renomme pas `active`. Elle est
 * décorative — le libellé est écrit juste à côté, et la couleur ne porte
 * jamais seule une information.
 *
 * La table reste locale à cet écran. T2.4 en aura le même besoin : c'est là,
 * avec deux appelants réels, que la forme partagée s'écrira.
 */
const STATUS_DOT: Record<ProductProject["statusNature"], string> = {
  framing: "bg-surface-info-base",
  active: "bg-surface-primary-base",
  paused: "bg-surface-neutral-base",
  done: "bg-surface-success-base",
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
                        <span
                          aria-hidden="true"
                          className={`h-2 w-2 flex-none rounded-full ${STATUS_DOT[project.statusNature]}`}
                        />
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
            />
          )}
        </section>
      </Page>
    </>
  );
}
