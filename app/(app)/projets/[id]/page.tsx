/**
 * Projet — la page la plus consultée du produit.
 *
 * Route posée par T1.6, sans contenu métier. Le fil d'Ariane porte les trois
 * maillons de la hiérarchie `Produits › Produit › Projet` (docs/06 §7) : un
 * projet ne s'affiche jamais sans son parent. Les deux derniers libellés sont
 * génériques tant qu'aucun nom n'est lisible sans la base ; ils prendront les
 * vrais noms en T2.4.
 */

import { Breadcrumb } from "@/components/shell/breadcrumb";
import { EmptyState } from "@/components/ui/empty-state";
import { Page, PageHeader } from "@/components/ui/page";
import { ROUTES } from "@/lib/navigation";

export const metadata = {
  title: "Projet — Vision",
};

export default function ProjectPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { href: ROUTES.products, label: "Produits" },
          { label: "Produit" },
          { label: "Projet" },
        ]}
      />
      <Page>
        <PageHeader
          title="Projet"
          lead="Où en est cet accompagnement, et qu'a-t-il produit ?"
        />
        <EmptyState
          title="La page projet s'affichera ici"
          description="L'en-tête d'identité — statut, période, objectif, entité, commanditaire, approches et équipe —, puis la roadmap des activités en position dominante, groupées par état. Autour d'elle, les blocs de référence : ressources, indicateurs adoptés, projets liés, budget et journal."
        />
      </Page>
    </>
  );
}
