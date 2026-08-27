/**
 * Les lectures liées au budget : la synthèse macro d'un accompagnement — alloué,
 * consommé, unité, date de relevé — et le lien profond vers l'outil de gestion
 * qui la tient (`docs/02` §5, `docs/06` §5).
 *
 * **Vision ne suit aucun budget.** Le détail des dépenses, l'historique des
 * engagements et les arbitrages vivent dans l'outil de gestion ; ce module ne
 * rend jamais rien d'autre que ce que la ligne porte, et **rien ne s'en
 * déduit** : ni reste à consommer, ni pourcentage, ni dépassement. Un chiffre
 * calculé par Vision pour qualifier un accompagnement est ce que D39 interdit ;
 * un chiffre reporté d'un outil externe avec sa date est ce qu'elle autorise.
 * Ce module ne rend que le second.
 *
 * **Un projet porte au plus un budget** : `budgets_project_unique` l'impose, et
 * la lecture rend donc une ligne ou `null`, jamais une liste.
 *
 * La lecture joint, donc elle passe par `joinedRead`. **Toute table jointe
 * porte `filter(table)`**, le `leftJoin` compris : c'est la condition posée par
 * l'en-tête de `joinedRead`, et la propriété relevée de T2.2 à T4.1 — les
 * filtres de domaine se rattrapent l'un l'autre — ne dispense d'aucun d'eux.
 * Ici, elle ne rattrape rien : `tools` est la **seule** table jointe, si bien
 * que son filtre est le seul rempart, et c'est ce que la mise en défaut de
 * T7.1 mesure sur une ligne forgée.
 *
 * Ce module n'importe pas `db` : il reçoit un `ScopedDb` déjà lié au domaine
 * courant. Règle 1.
 */

import { and, eq } from "drizzle-orm";

import type { ScopedDb } from "@/lib/db/scoped";
import { budgetUnit, budgets, tools } from "@/lib/db/schema";

/**
 * `days` au POC, et rien d'autre. Dérivé du schéma, jamais réécrit à la main —
 * la règle de `ResourceType` : le jour où l'énuméré s'ouvre, le `Record` du
 * bloc cesse de compiler plutôt que de rendre une unité muette.
 */
export type BudgetUnit = (typeof budgetUnit.enumValues)[number];

/** Le bloc « Budget » : quatre valeurs reportées, et le lien vers leur source. */
export type ProjectBudget = {
  id: string;
  /**
   * L'enveloppe et sa consommation. Colonnes `numeric(18,4)` : le pilote les
   * rend en **chaînes** — « 120.0000 » —, comme `results.value` et les trois
   * valeurs d'adoption. Mises en forme par `lib/format`, jamais ici.
   */
  allocated: string | null;
  consumed: string | null;
  /**
   * L'unité des deux montants. `not null` avec un défaut : elle ne se saisit
   * pas au POC — l'énuméré n'a qu'une valeur — mais elle se **lit**, « 120 »
   * sans unité ne disant rien.
   */
  unit: BudgetUnit;
  /** Le jour du relevé. Colonne `date` : chaîne `YYYY-MM-DD`, ou `null`. */
  measuredOn: string | null;
  /**
   * L'outil de gestion. Retenu **en plus de son nom** parce que le panneau en a
   * besoin : c'est lui qui nomme l'exception de `listResultToolOptions` quand
   * l'outil a été archivé depuis la saisie.
   */
  toolId: string | null;
  /**
   * Le nom de l'outil, joint sur `tools`. `null` quand `tool_id` l'est — le
   * rattachement est facultatif — **et quand la jointure est coupée**, ce que
   * seul un domaine étranger peut provoquer.
   */
  toolName: string | null;
  /** Le lien profond vers le suivi. Nul est un cas normal, comme sur un résultat. */
  externalUrl: string | null;
};

/**
 * Le budget d'un accompagnement, ou `null` s'il n'en porte pas.
 *
 * **`null` est un état vide, jamais une erreur** (règle 5) : un accompagnement
 * sans budget est un accompagnement normal, et c'est l'écran qui porte la
 * phrase et le geste qui la remplit.
 *
 * **Aucun filtre d'archivage nulle part**, et pour deux raisons distinctes.
 * `budgets` n'a pas de colonne `archived_at` — un budget se corrige, il ne se
 * retire pas (arbitrage (c) de `tickets-C7.md`) —, donc il n'y a rien à
 * filtrer. `tools` en a une, et le filtre serait **faux** : un outil archivé
 * depuis reste l'outil qui a produit ce relevé. C'est la règle du second
 * `leftJoin` de `listProjectResources` — on décrit, on ne propose pas —, et
 * elle se sépare nettement de ce que le **panneau** propose au choix, où
 * l'archivé est écarté sauf exception nominative.
 *
 * `leftJoin` et non `innerJoin` : `tool_id` est nullable, et un budget sans
 * outil doit sortir de la lecture, pas en disparaître.
 *
 * `limit(1)` dit ce que la contrainte garantit déjà : une lecture qui rendrait
 * deux lignes ne saurait pas laquelle est le budget.
 */
export function findProjectBudget(
  scope: ScopedDb,
  projectId: string,
): Promise<ProjectBudget | null> {
  return scope.joinedRead(async (database, { filter }) => {
    const rows = await database
      .select({
        id: budgets.id,
        allocated: budgets.allocated,
        consumed: budgets.consumed,
        unit: budgets.unit,
        measuredOn: budgets.measuredOn,
        toolId: budgets.toolId,
        toolName: tools.name,
        externalUrl: budgets.externalUrl,
      })
      .from(budgets)
      /* **Le seul filtre de jointure de ce module, et rien ne le rattrape.**
         Sans lui, un budget du domaine courant pointant l'outil d'un autre
         domaine afficherait le nom de cet outil — la fuite se lirait sur
         l'écran le plus consulté du produit. Aucune ligne honnête ne peut le
         mettre en défaut : la couche scopée refuse d'écrire ce rattachement.
         C'est pourquoi le test l'éprouve sur une ligne **forgée**. */
      .leftJoin(
        tools,
        and(eq(tools.id, budgets.toolId), filter(tools)),
      )
      .where(and(filter(budgets), eq(budgets.projectId, projectId)))
      .limit(1);

    return rows[0] ?? null;
  });
}
