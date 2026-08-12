/**
 * Produit — la page de détail, conteneur des accompagnements successifs.
 *
 * Route posée par T1.6, sans contenu métier : le nom du produit suppose une
 * lecture en base, que le ticket interdit. Le dernier maillon du fil d'Ariane
 * porte donc le libellé générique de l'écran ; il prendra le nom du produit
 * en T2.2, avec le reste de la page.
 */

import { Breadcrumb } from "@/components/shell/breadcrumb";
import { EmptyState } from "@/components/ui/empty-state";
import { Page, PageHeader } from "@/components/ui/page";
import { ROUTES } from "@/lib/navigation";

export const metadata = {
  title: "Produit — Vision",
};

export default function ProductPage() {
  return (
    <>
      <Breadcrumb
        items={[{ href: ROUTES.products, label: "Produits" }, { label: "Produit" }]}
      />
      <Page>
        <PageHeader
          title="Produit"
          lead="Qu'avons-nous fait sur ce produit dans le temps, et qu'est-ce que ça a donné ?"
        />
        <EmptyState
          title="La page produit s'affichera ici"
          description="Le nom, l'entité et la description, puis la liste des accompagnements successifs, du plus récent au plus ancien, chacun avec sa période, son statut, son objectif et son équipe. La frise du temps long viendra ensuite."
        />
      </Page>
    </>
  );
}
