/**
 * Produits — la liste, chemin canonique de la navigation.
 *
 * Route posée par T1.6, sans contenu métier. La liste elle-même est le
 * ticket T2.1.
 */

import { EmptyState } from "@/components/ui/empty-state";
import { Page, PageHeader } from "@/components/ui/page";

export const metadata = {
  title: "Produits — Vision",
};

export default function ProductsPage() {
  return (
    <Page>
      <PageHeader
        title="Produits"
        lead="Sur quels objets le centre intervient-il, et pour quelles entités ?"
      />
      <EmptyState
        title="La liste des produits s'affichera ici"
        description="Les objets accompagnés par le centre — pas le catalogue de l'entreprise. Chaque ligne portera le nom du produit, son entité, son nombre d'accompagnements et la date de sa dernière activité."
      />
    </Page>
  );
}
