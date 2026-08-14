/**
 * Modifier un produit — le miroir de `/produits/nouveau`, pré-rempli.
 *
 * Même garde de droit, même formulaire, même action ; seule change la
 * fonction d'écriture, **liée à l'identifiant côté serveur**. L'identifiant ne
 * transite donc par aucun champ caché : il ne peut pas être remplacé par celui
 * d'un autre produit dans la requête soumise.
 *
 * `docs/06` §9 demande une « édition en place pour les champs simples ». Une
 * page dédiée est retenue, d'après l'arborescence de `docs/06` §2 qui pose
 * « création / édition » en un nœud sous Produit — désaccord consigné au
 * journal technique, pas rejoué ici.
 *
 * L'identifiant vient de l'URL : sa forme est vérifiée avant la base, faute de
 * quoi un paramètre fantaisiste rendrait 500 et non 404. Un produit inconnu —
 * ou d'un autre domaine — rend 404, sans que les deux cas se distinguent.
 *
 * Aucune requête directe : tout passe par `session.db`. Règle 1.
 */

import { notFound } from "next/navigation";

import { ProductForm } from "@/components/products/product-form";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { Page, PageHeader } from "@/components/ui/page";
import { requireSession } from "@/lib/auth/provider";
import { products } from "@/lib/db/schema";
import { ROUTES } from "@/lib/navigation";
import { listProductFormOptions } from "@/lib/queries/products";
import { isUuid } from "@/lib/uuid";

import { updateProduct } from "../../actions";

export const metadata = {
  title: "Modifier un produit — Vision",
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const session = await requireSession();
  if (!session.can.manageDomain) notFound();

  // `find` rend la ligne entière — `entityId` et `kind` compris, que
  // `findProductDetail` ne remonte pas : elle sert un en-tête, pas un
  // formulaire, et elle n'a pas à changer pour ce ticket.
  const product = await session.db.find(products, id);
  if (!product) notFound();

  /* Un produit archivé n'a plus de formulaire (T4bis.2). `find` rend les lignes
     archivées — délibérément, une donnée archivée restant lisible —, et rien
     n'en tirait les conséquences ici. **Ce n'est pas cette route qui protège** :
     les champs récoltés avant l'archivage se repostent tels quels ensuite, et
     c'est `updateProduct` qui les refuse, sur l'identifiant reçu. */
  if (product.archivedAt) notFound();

  // L'entité que ce produit porte déjà reste proposée, fût-elle archivée
  // depuis (T4bis.1) : sans cette exception nominative, le `select` s'ouvrirait
  // amputé et la première correction du nom changerait aussi le rattachement.
  const options = await listProductFormOptions(session.db, {
    keepEntityId: product.entityId,
  });

  return (
    <>
      <Breadcrumb
        items={[
          { href: ROUTES.products, label: "Produits" },
          { href: ROUTES.product(product.id), label: product.name },
          { label: "Modifier" },
        ]}
      />
      <Page>
        <PageHeader
          overline="Modifier"
          title={product.name}
          lead="Les accompagnements de ce produit ne sont pas touchés : seule son identité change."
        />

        <ProductForm
          action={updateProduct.bind(null, product.id)}
          entities={options.entities}
          initial={{
            name: product.name,
            entityId: product.entityId,
            kind: product.kind,
            description: product.description ?? "",
          }}
          submitLabel="Enregistrer les modifications"
          cancelHref={ROUTES.product(product.id)}
        />
      </Page>
    </>
  );
}
