/**
 * Nouveau produit — le premier écran de saisie de Vision.
 *
 * F1-D1 et D9 : réservé au responsable de domaine. La route rend **404** pour
 * qui n'a pas ce droit, et non 403 — annoncer l'existence d'un écran qu'on
 * refuse d'ouvrir n'apprend rien d'utile à qui le demande. Le verrou qui
 * compte reste celui de l'action serveur : une route interdite ne protège pas
 * l'écriture qu'elle affichait.
 *
 * Le formulaire est complet, comme le veut `docs/06` §9 pour une création.
 *
 * Aucune requête directe : les entités passent par `session.db`, déjà scopé
 * sur le domaine courant, et qui écarte seul les entités archivées. Règle 1.
 */

import { asc } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/shell/breadcrumb";
import { ProductForm } from "@/components/products/product-form";
import { EmptyState } from "@/components/ui/empty-state";
import { Page, PageHeader } from "@/components/ui/page";
import { requireSession } from "@/lib/auth/provider";
import { entities } from "@/lib/db/schema";
import { ROUTES } from "@/lib/navigation";

import { createProduct } from "../actions";

export const metadata = {
  title: "Nouveau produit — Vision",
};

export default async function NewProductPage() {
  const session = await requireSession();
  if (!session.can.manageDomain) notFound();

  const options = await session.db.list(entities, {
    orderBy: [asc(entities.label)],
  });

  return (
    <>
      <Breadcrumb
        items={[
          { href: ROUTES.products, label: "Produits" },
          { label: "Nouveau produit" },
        ]}
      />
      <Page>
        <PageHeader
          title="Nouveau produit"
          lead="Un produit est l'objet durable que le centre accompagne. Il porte ensuite ses accompagnements successifs."
        />

        {options.length > 0 ? (
          <ProductForm
            action={createProduct}
            entities={options.map((entity) => ({
              id: entity.id,
              label: entity.label,
            }))}
            submitLabel="Créer le produit"
            cancelHref={ROUTES.products}
          />
        ) : (
          /* Un produit se rattache obligatoirement à une entité : sans
             référentiel, le formulaire serait un écran qu'on ne peut pas
             soumettre. L'état vide dit pourquoi, plutôt que de laisser
             chercher (règle 5). */
          <EmptyState
            title="Aucune entité dans ce domaine"
            description="Un produit se rattache toujours à une entité de l'entreprise. Le référentiel des entités est vide : il doit être alimenté avant qu'un produit puisse être créé."
            action={
              <Link
                href={ROUTES.products}
                className="text-sm font-semibold text-content-primary-dark underline"
              >
                Revenir aux produits
              </Link>
            }
          />
        )}
      </Page>
    </>
  );
}
