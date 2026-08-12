/**
 * À propos — note interne, atteinte par la navigation.
 *
 * Route posée par T1.6. Le contenu rédigé — ce qu'est Vision, le vocabulaire,
 * ce qu'elle ne fait pas, l'état daté — ne coûterait aucune lecture en base,
 * mais le périmètre du ticket dit « routes vides » et la règle 3 interdit
 * l'ajout « pendant que j'y suis ». Il est consigné en point ouvert.
 */

import { EmptyState } from "@/components/ui/empty-state";
import { Page, PageHeader } from "@/components/ui/page";

export const metadata = {
  title: "À propos — Vision",
};

export default function AboutPage() {
  return (
    <Page>
      <PageHeader
        overline="Note interne"
        title="À propos de Vision"
        lead="Qu'est-ce que Vision, et qu'est-ce que ce n'est pas ?"
      />
      <EmptyState
        title="La note s'affichera ici"
        description="Ce qu'est Vision et à quoi elle sert, le vocabulaire expliqué en quelques lignes, ce qu'elle ne fait pas, et l'état actuel daté — ce qui existe, ce qui viendra."
      />
    </Page>
  );
}
