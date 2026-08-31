/**
 * La période d'un accompagnement — **déduite de ses activités, jamais saisie.**
 *
 * Jusqu'à la migration `0012`, `projects` portait deux colonnes de dates
 * remplies à la main. Rien ne les accordait aux périodes des activités : ni un
 * `CHECK`, ni une validation de formulaire, ni une lecture. Un accompagnement
 * pouvait donc annoncer sur la frise produit une période que son propre
 * planning contredisait — et c'était le cas dans la fixture.
 *
 * La règle tient en deux lignes de SQL, et elle est écrite **ici seulement** :
 * les cinq lectures qui affichent une période joignent cette sous-requête.
 *
 * ```
 * début = min(coalesce(period_start, period_end))
 * fin   = max(coalesce(period_end,   period_start))
 * ```
 *
 * Quatre points, tous délibérés.
 *
 * **`coalesce` dans les deux sens.** La base autorise une activité `done` ou
 * `in_progress` qui n'a qu'une fin : seul
 * `activities_planned_requires_period_or_unscheduled` exige un début, et pour
 * l'état `planned` seulement. Une borne ne doit pas disparaître parce qu'elle
 * est du mauvais côté.
 *
 * **Les activités `planned` comptent**, à la différence de `last_activity_at`
 * (`lib/db/scoped.ts`, tranché en T2.1). Les deux champs ne disent pas la même
 * chose : `last_activity_at` dit *depuis quand ça n'a pas bougé* — une activité
 * qui n'a pas eu lieu n'y entre pas —, la période dit *de quand à quand ça
 * s'étend*, et ce qui vient en fait partie. Un audit prévu en octobre allonge
 * la période et ne rafraîchit rien.
 *
 * **Les activités « à planifier » (D14) sortent d'elles-mêmes** : leurs deux
 * dates sont nulles, `min` et `max` les ignorent. Aucune clause à écrire pour
 * elles — c'est la propriété qu'on vérifie, pas le code qu'on lit.
 *
 * **Archivées et annulées ne pèsent pas** (arbitrage humain du 31/08/2026),
 * comme pour `last_activity_at`. Une activité annulée a été prévue à une date ;
 * elle n'accompagne plus rien.
 *
 * **Une sous-requête groupée jointe, et non une sous-requête corrélée.** T7.3 a
 * trouvé un 500 exactement là : dans la position de sélection de Drizzle, une
 * sous-requête corrélée perd la qualification de ses tables. Le modèle corrélé
 * de `lastActivityExpression` ne vaut que dans un `UPDATE`, où il n'y a qu'une
 * table. Ici le `leftJoin` évite le piège, et le `null` qu'il rend pour un
 * projet sans activité datée est exactement la réponse attendue (D7).
 */

import { and, isNull, ne, sql } from "drizzle-orm";

import type { ScopedDb } from "@/lib/db/scoped";
import { activities } from "@/lib/db/schema";

/* Les deux arguments que `joinedRead` donne à sa lecture, **dérivés de
   `ScopedDb` et non importés**. `lib/db/client` est scellé par ESLint —
   `no-restricted-imports`, « seul `lib/db/scoped.ts` l'importe » (règle 1) —,
   et le contourner par un `import type` en respecterait la lettre contre son
   intention. Les tirer de la signature vaut mieux qu'un import de plus : ils ne
   peuvent pas diverger de ce que la couche passe réellement. */
type JoinedRead = Parameters<ScopedDb["joinedRead"]>[0];
type Database = Parameters<JoinedRead>[0];
type Filter = Parameters<JoinedRead>[1]["filter"];

/**
 * La sous-requête à joindre, à nommer une fois par lecture.
 *
 * Elle reçoit le `filter` de `joinedRead` : **la règle 1 tient à l'intérieur de
 * la sous-requête**, et pas seulement autour. Sans lui, une activité d'un autre
 * domaine posée sur le projet déplacerait ses bornes — ce que le `leftJoin` seul
 * ne rattraperait jamais.
 */
export function projectPeriods(database: Database, filter: Filter) {
  return database
    .select({
      projectId: activities.projectId,
      periodStart: sql<
        string | null
      >`min(coalesce(${activities.periodStart}, ${activities.periodEnd}))`.as(
        "period_start",
      ),
      periodEnd: sql<
        string | null
      >`max(coalesce(${activities.periodEnd}, ${activities.periodStart}))`.as(
        "period_end",
      ),
    })
    .from(activities)
    .where(
      and(
        filter(activities),
        isNull(activities.archivedAt),
        ne(activities.state, "cancelled"),
      ),
    )
    .groupBy(activities.projectId)
    .as("project_periods");
}
