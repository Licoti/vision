/**
 * Nouvel accompagnement.
 *
 * F1-D1 et D9 : réservé au responsable de domaine. La route rend **404** pour
 * qui n'a pas ce droit, et non 403 — annoncer l'existence d'un écran qu'on
 * refuse d'ouvrir n'apprend rien d'utile à qui le demande. Le verrou qui
 * compte reste celui de l'action serveur : une route interdite ne protège pas
 * l'écriture qu'elle affichait.
 *
 * Le formulaire est complet, comme le veut `docs/06` §9 pour une création.
 *
 * `?produit=` pré-sélectionne le rattachement quand on arrive depuis une page
 * produit. Sa forme est vérifiée avant la base, puis la valeur est confrontée
 * au domaine avant d'être crue — un paramètre est saisi par n'importe qui, et
 * `find` est scopé : le produit d'un autre domaine n'existe pas, il ne
 * « manque » pas.
 *
 * Aucune requête directe : tout passe par `session.db`. Règle 1.
 */

import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectForm } from "@/components/projects/project-form";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { ACTION_LINK_SM } from "@/components/ui/action-link";
import { EmptyState } from "@/components/ui/empty-state";
import { Page, PageHeader } from "@/components/ui/page";
import { requireSession } from "@/lib/auth/provider";
import { products } from "@/lib/db/schema";
import { EMPTY_PROJECT_VALUES } from "@/lib/forms/project";
import { ROUTES } from "@/lib/navigation";
import { listProjectFormOptions } from "@/lib/queries/projects";
import { isUuid } from "@/lib/uuid";

import { createProject } from "../actions";

export const metadata = {
  title: "Nouvel accompagnement — Vision",
};

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ produit?: string }>;
}) {
  const session = await requireSession();
  if (!session.can.manageDomain) notFound();

  const { produit } = await searchParams;
  const requested = produit && isUuid(produit) ? produit : undefined;
  const suggested = requested
    ? await session.db.find(products, requested)
    : undefined;

  const options = await listProjectFormOptions(session.db);

  /* Un accompagnement se rattache obligatoirement à un produit (D4) et porte
     un statut non nul. Sans l'un des deux, le formulaire serait un écran qu'on
     ne peut pas soumettre : l'état vide dit pourquoi, plutôt que de laisser
     chercher (règle 5). */
  const missing =
    options.products.length === 0
      ? {
          title: "Aucun produit dans ce domaine",
          description:
            "Un accompagnement porte toujours sur un produit. Il faut donc qu'un produit existe avant qu'un accompagnement puisse être créé.",
          href: ROUTES.productNew,
          label: "Créer un produit",
        }
      : options.statuses.length === 0
        ? {
            title: "Aucun statut d'accompagnement dans ce domaine",
            description:
              "Un accompagnement porte toujours un statut — en cours, terminé, en pause. Le référentiel des statuts est vide : il doit être alimenté avant qu'un accompagnement puisse être créé.",
            href: ROUTES.projects,
            label: "Revenir aux accompagnements",
          }
        : null;

  return (
    <>
      <Breadcrumb
        items={[
          { href: ROUTES.projects, label: "Accompagnements" },
          { label: "Nouvel accompagnement" },
        ]}
      />
      <Page>
        <PageHeader
          title="Nouvel accompagnement"
          lead="Un accompagnement est une intervention datée du centre sur un produit. Il porte ensuite ses activités, ses ressources et ses résultats."
        />

        {missing ? (
          <EmptyState
            title={missing.title}
            description={missing.description}
            action={
              <Link
                href={missing.href}
                className={ACTION_LINK_SM}
              >
                {missing.label}
              </Link>
            }
          />
        ) : (
          <ProjectForm
            action={createProject}
            products={options.products}
            statuses={options.statuses}
            jobs={options.jobs}
            approaches={options.approaches}
            people={options.people}
            initial={{
              ...EMPTY_PROJECT_VALUES,
              productId: suggested?.id ?? "",
            }}
            submitLabel="Créer l'accompagnement"
            cancelHref={
              suggested ? ROUTES.product(suggested.id) : ROUTES.projects
            }
          />
        )}
      </Page>
    </>
  );
}
