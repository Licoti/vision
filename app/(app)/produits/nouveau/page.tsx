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
import { buttonClass } from "@/components/ui/button";
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
             chercher (règle 5).

             **Le geste qui le remplit, et non le demi-tour** (T7.8). Il
             proposait « Revenir aux produits », d'où l'on venait : sur un
             domaine neuf — que `bootstrapReferentials` sème **sans aucune
             entité**, son en-tête l'écrit —, le chemin vers le premier produit
             se refermait donc sur lui-même. `docs/06` §9 veut qu'un état vide
             propose l'action correspondante ; c'est ici l'ajout d'une entité.

             **Le droit est acquis avant d'être proposé** : cette page rend 404
             sans `manageDomain`, et `/administration` exige le même droit. Un
             état vide qui proposerait un geste hors de portée serait un
             cul-de-sac de plus.

             **`buttonClass()` et non `ACTION_LINK_SM`** : c'est le rang des
             états vides qui portent un vrai geste — équipe, administration,
             entreprises, les deux roadmaps. Le lien discret était le rang du
             demi-tour, et le demi-tour n'est pas perdu pour autant : le fil
             d'Ariane porte « Produits ».

             **Un `<Link>` nu suffit** : le panneau d'ajout se résout des
             paramètres d'URL, côté serveur, au rendu de `/administration`. */
          <EmptyState
            title="Aucune entité dans ce domaine"
            description="Un produit se rattache toujours à une entité de l'entreprise. Le référentiel des entités est vide : il doit être alimenté avant qu'un produit puisse être créé."
            action={
              <Link
                href={ROUTES.adminRowNew("entites")}
                className={buttonClass()}
              >
                Ajouter une entité
              </Link>
            }
          />
        )}
      </Page>
    </>
  );
}
