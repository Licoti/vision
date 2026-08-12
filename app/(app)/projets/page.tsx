/**
 * Projets — la liste transverse, raccourci vers le même arbre.
 *
 * Route posée par T1.6, sans contenu métier. La liste, ses filtres et sa
 * recherche sont le ticket T2.3.
 */

import { EmptyState } from "@/components/ui/empty-state";
import { Page, PageHeader } from "@/components/ui/page";

export const metadata = {
  title: "Projets — Vision",
};

export default function ProjectsPage() {
  return (
    <Page>
      <PageHeader
        title="Projets"
        lead="Quels accompagnements existent en ce moment, tous produits confondus ?"
      />
      <EmptyState
        title="La liste des projets s'affichera ici"
        description="Une liste dense, faite pour la comparaison ligne à ligne : nom, produit de rattachement cliquable, entité, statut, métiers, équipe et date de dernière activité. Les filtres entité, métier, approche et statut se combineront à une recherche sur le nom, l'objectif et les membres."
      />
    </Page>
  );
}
