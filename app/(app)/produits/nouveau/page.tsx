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
 * Aucune requête directe : les entités passent par `listProductFormOptions`,
 * qui les lit à travers la couche scopée sur le domaine courant, et qui écarte
 * seule les entités archivées. Règle 1.
 *
 * **La lecture est partagée avec `/produits/[id]/modifier` depuis TD.1.** T4bis.1
 * avait posé `listProductFormOptions` pour l'écran de modification et laissé
 * celui-ci avec son `list(entities, …)` en ligne — sa fiche disant que le
 * formulaire de création « ne change pas d'un caractère », et la page n'étant pas
 * à son périmètre. Les deux tris étaient alignés à la main sur `entities.label`
 * pour que la duplication ne devienne pas une divergence ; ils n'ont plus à
 * l'être. Cet écran n'a pas d'exception nominative à demander : rien n'est encore
 * rattaché, donc aucune entité archivée n'a à être tolérée.
 */

import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/shell/breadcrumb";
import { ProductForm } from "@/components/products/product-form";
import { ACTION_LINK_SM } from "@/components/ui/action-link";
import { EmptyState } from "@/components/ui/empty-state";
import { Page, PageHeader } from "@/components/ui/page";
import { requireSession } from "@/lib/auth/provider";
import { ROUTES } from "@/lib/navigation";
import { listProductFormOptions } from "@/lib/queries/products";

import { createProduct } from "../actions";

export const metadata = {
  title: "Nouveau produit — Vision",
};

export default async function NewProductPage() {
  const session = await requireSession();
  if (!session.can.manageDomain) notFound();

  const { entities: options } = await listProductFormOptions(session.db);

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
            entities={options}
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
                className={ACTION_LINK_SM}
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
