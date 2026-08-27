/**
 * Vue d'ensemble — le point d'entrée.
 *
 * **Elle est entière.** T1.6 avait posé la route sans contenu métier — le
 * ticket s'interdisait toute lecture en base — et l'écran annonçait ses quatre
 * blocs dans un état vide. T6.6 a livré le premier, celui qui **dépend** du
 * journal ; T6.7 livre les trois autres, dans l'ordre de `docs/06` §3 : la
 * répartition, les projets sans activité récente, l'accès direct. C'est
 * l'arbitrage (d) de `tickets-C6.md` : *laisser l'écran à moitié vide après
 * l'avoir ouvert coûterait plus qu'il ne protège.*
 *
 * **Les trois derniers ne dépendent d'aucune table neuve** : ils lisent
 * `projects`, `products` et les deux référentiels, tels qu'ils existent depuis
 * T2.3. Seul le flux avait besoin du journal, et c'est pourquoi `docs/05` §5 ne
 * nommait que lui.
 *
 * **L'ordre des quatre blocs est celui du document, et il n'est pas neutre** :
 * ce qui vient de se passer, puis la forme de l'ensemble, puis ce qui s'endort,
 * puis où aller. La question de l'écran se referme à la dernière ligne.
 *
 * **Aucun score, aucune jauge, aucun indicateur de performance du centre.**
 * `docs/06` §3 le dit de l'écran que verra un responsable, et c'est là que la
 * règle coûte le plus cher : *Vision décrit, elle n'évalue pas* (F1). Les
 * nombres rendus ici sont tous des **décomptes de lignes** qu'un lien va
 * vérifier, jamais des indices calculés (frontière de D39).
 *
 * **Quatre lectures, un seul aller-retour perçu** : elles ne dépendent pas les
 * unes des autres, donc `Promise.all`. Le mesurer autrement ferait attendre le
 * décompte le plus court derrière la lecture la plus longue.
 *
 * **Aucune action, et il n'y en a aucune à poser** : rien ne s'écrit sur cet
 * écran. Les quatre lectures sont ouvertes à tout le domaine (D9), et aucun
 * droit ne se lit ici.
 *
 * Aucune requête directe : tout passe par `session.db`, déjà scopé sur le
 * domaine courant. Règle 1.
 */

import { Distribution } from "@/components/overview/distribution";
import { RecentActivity } from "@/components/overview/feed";
import { Shortcuts } from "@/components/overview/shortcuts";
import { StaleProjects } from "@/components/overview/stale";
import { Page, PageHeader } from "@/components/ui/page";
import { requireSession } from "@/lib/auth/provider";
import {
  countProducts,
  countProjects,
  listProjectDistribution,
  listRecentEvents,
  listStaleProjects,
} from "@/lib/queries/overview";

export const metadata = {
  title: "Vue d'ensemble — Vision",
};

export default async function OverviewPage() {
  const session = await requireSession();

  const [events, distribution, stale, projectCount, productCount] =
    await Promise.all([
      listRecentEvents(session.db),
      listProjectDistribution(session.db),
      listStaleProjects(session.db),
      countProjects(session.db),
      countProducts(session.db),
    ]);

  return (
    <Page>
      <PageHeader
        title="Vue d'ensemble"
        lead="Que se passe-t-il en ce moment dans le centre ?"
      />
      <RecentActivity events={events} />
      <Distribution distribution={distribution} />
      <StaleProjects projects={stale} />
      <Shortcuts projectCount={projectCount} productCount={productCount} />
    </Page>
  );
}
