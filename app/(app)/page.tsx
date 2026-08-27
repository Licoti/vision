/**
 * Vue d'ensemble — le point d'entrée.
 *
 * **Elle porte enfin quelque chose.** T1.6 avait posé la route sans contenu
 * métier — le ticket s'interdisait toute lecture en base — et l'écran annonçait
 * ses quatre blocs dans un état vide. T6.6 livre le premier, celui qui
 * **dépend** du journal (arbitrage (d) de `tickets-C6.md`) ; T6.7 livre les
 * trois autres, dans l'ordre de `docs/06` §3 : la répartition, les projets sans
 * activité récente, l'accès direct.
 *
 * **L'état vide d'annonce a disparu avec le premier bloc.** Il disait ce que
 * l'écran porterait ; ce que porte le bloc, c'est le bloc qui le dit — et son
 * propre état vide, tant que le journal du domaine est vide. Annoncer trois
 * blocs qu'on n'a pas encore serait redire à un ticket près ce que T1.6 disait
 * faute de mieux.
 *
 * **Aucune action, et il n'y en a aucune à poser** : rien ne s'écrit sur cet
 * écran. La lecture du journal est ouverte à tout le domaine (D9), et aucun
 * droit ne se lit ici.
 *
 * Aucune requête directe : tout passe par `session.db`, déjà scopé sur le
 * domaine courant. Règle 1.
 */

import { RecentActivity } from "@/components/overview/feed";
import { Page, PageHeader } from "@/components/ui/page";
import { requireSession } from "@/lib/auth/provider";
import { listRecentEvents } from "@/lib/queries/overview";

export const metadata = {
  title: "Vue d'ensemble — Vision",
};

export default async function OverviewPage() {
  const session = await requireSession();
  const events = await listRecentEvents(session.db);

  return (
    <Page>
      <PageHeader
        title="Vue d'ensemble"
        lead="Que se passe-t-il en ce moment dans le centre ?"
      />
      <RecentActivity events={events} />
    </Page>
  );
}
