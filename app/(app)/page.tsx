/**
 * Vue d'ensemble — le point d'entrée.
 *
 * **Elle a été relue entière le 29/08/2026**, dernier écran de lecture
 * principal à ne pas l'avoir été. Elle s'était construite en deux temps — T6.6
 * pour le flux, T6.7 pour les trois autres blocs — et chaque bloc était juste
 * localement : c'est l'écran, pas ses parties, qui portait le défaut. Quatre
 * cartes de poids strictement identique, empilées sur ≈ 2 830 px, dans une
 * colonne de 1 104 px dont aucune ne se servait.
 *
 * **Deux écarts à `docs/06` §3, demandés par l'humain et assumés comme tels.**
 * Le document énumère quatre blocs dans un ordre qu'il dit non neutre — le
 * flux, la répartition, les dormants, l'accès direct. Le flux **ferme**
 * désormais l'écran, et **« Accès direct » n'est plus rendu**. C'est le même
 * rang d'écart que les trois que porte déjà `ETAT.md` sur la liste close de
 * `docs/06` §5. Aucune décision numérotée n'est rouverte : **D33 tient** — pas
 * un graphique sur cet écran, des chiffres cliquables qui filtrent — et D39
 * avec elle.
 *
 * **La largeur est le seul levier qui restait, et c'est pourquoi il y a une
 * grille.** Retirer « Accès direct » ne rend que ≈ 235 px sur 2 830 : la
 * hauteur est portée par les deux listes, dont les plafonds sont écrits dans la
 * requête et **ne s'annoncent pas** (`RECENT_EVENTS_LIMIT`,
 * `STALE_PROJECTS_LIMIT`). La répartition part donc dans un rail de 320 px, où
 * son chiffre touche son libellé, et le récit garde une colonne de lecture.
 *
 * **L'ordre du DOM est [répartition, dormants, flux]**, et il est retourné à
 * l'écran par deux `col-start` explicites — la grammaire de la page projet, et
 * pour la même raison : l'ordre du DOM reste l'ordre de lecture dans les deux
 * mises en page, donc l'ordre de tabulation aussi. **Le flux est dernier des
 * deux côtés**, en pile comme en grille. Ce que ce choix coûte est écrit : sous
 * le point d'arrêt, la répartition repasse **au-dessus** du récit.
 *
 * **Les deux décomptes d'« Accès direct » ont remonté en ligne de faits.**
 * `PageHeader` porte `facts` depuis le 28/08/2026 et **n'avait aucun appelant
 * dans tout le dépôt** ; `countProjects` et `countProducts` gardent donc leur
 * lecteur. Ce sont des **décomptes de lignes** qu'un lien va vérifier, jamais
 * des indices calculés : c'est l'argument que `shortcuts.tsx` portait déjà, et
 * il ne dépend pas de l'endroit où le nombre s'écrit (frontière de D39).
 *
 * **Aucun score, aucune jauge, aucun indicateur de performance du centre.**
 * `docs/06` §3 le dit de l'écran que verra un responsable, et c'est là que la
 * règle coûte le plus cher : *Vision décrit, elle n'évalue pas* (F1).
 *
 * **Cinq lectures, un seul aller-retour perçu** : elles ne dépendent pas les
 * unes des autres, donc `Promise.all`. Le mesurer autrement ferait attendre le
 * décompte le plus court derrière la lecture la plus longue.
 *
 * **Aucune action, et il n'y en a aucune à poser** : rien ne s'écrit sur cet
 * écran. Les cinq lectures sont ouvertes à tout le domaine (D9), et aucun droit
 * ne se lit ici — la reprise n'en a introduit aucun.
 *
 * Aucune requête directe : tout passe par `session.db`, déjà scopé sur le
 * domaine courant. Règle 1.
 */

import { Distribution } from "@/components/overview/distribution";
import { RecentActivity } from "@/components/overview/feed";
import { StaleProjects } from "@/components/overview/stale";
import { Page, PageHeader } from "@/components/ui/page";
import { requireSession } from "@/lib/auth/provider";
import { formatAccompaniments, formatProducts } from "@/lib/format";
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
        /* Les projets d'abord, les produits ensuite — l'inverse de l'ordre de
           `MAIN_NAV`, et c'est délibéré : ce n'est pas une navigation, c'est ce
           que l'écran sait de son objet. Tout ce qui suit compte des
           accompagnements ; le produit n'apparaît qu'en origine d'une ligne de
           flux. Le point médian est le séparateur de la ligne de faits de la
           page produit, et il n'y en a pas deux. */
        facts={`${formatAccompaniments(projectCount)} · ${formatProducts(productCount)}`}
      />

      {/* Le gabarit de la page projet, repris tel quel : `1fr 320px` au-delà du
          point d'arrêt, une seule colonne en deçà. Un **point d'arrêt de mise
          en page** n'est pas une valeur de thème — l'arbitrage du journal de
          T1.6, hors de la clause 2 de `spacingScaleLock`. */}
      <div className="grid items-start gap-5 xl:grid-cols-[1fr_320px]">
        {/* Le rail. Premier du DOM, donc premier en pile : c'est la
            contrepartie assumée de la direction retenue — sous le point
            d'arrêt, la répartition repasse au-dessus du récit. Elle reste le
            moins haut des trois blocs, et le flux reste dernier. */}
        <div className="flex min-w-0 flex-col gap-5 xl:col-start-2 xl:row-start-1">
          <Distribution distribution={distribution} />
        </div>

        {/* Le récit. Les dormants ouvrent, le flux ferme — dernier de la
            colonne et dernier du DOM, ce que la demande voulait. */}
        <div className="flex min-w-0 flex-col gap-5 xl:col-start-1 xl:row-start-1">
          <StaleProjects projects={stale} />
          <RecentActivity events={events} />
        </div>
      </div>
    </Page>
  );
}
