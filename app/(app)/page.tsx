/**
 * Vue d'ensemble — le point d'entrée.
 *
 * Route posée par T1.6, sans contenu métier : le ticket interdit toute
 * lecture en base. L'état vide annonce ce que l'écran portera, dans l'ordre
 * fixé par docs/06 §3.
 */

import { EmptyState } from "@/components/ui/empty-state";
import { Page, PageHeader } from "@/components/ui/page";

export const metadata = {
  title: "Vue d'ensemble — Vision",
};

export default function OverviewPage() {
  return (
    <Page>
      <PageHeader
        title="Vue d'ensemble"
        lead="Que se passe-t-il en ce moment dans le centre ?"
      />
      <EmptyState
        title="L'activité du centre s'affichera ici"
        description="Les dernières activités saisies, tous projets confondus, avec leur projet d'origine ; la répartition des accompagnements par statut, par entité et par approche, en chiffres cliquables qui filtrent ; puis les projets sans activité récente, sans alerte ni relance."
      />
    </Page>
  );
}
