/**
 * Le balayage des domaines résiduels, avant la première ligne de tests — T8.1.
 *
 * **Ce que ce fichier répare.** `resolveDomainId` (`lib/auth/session.ts`) rend
 * **le premier domaine actif par nom**, et `loadCurrentSession` l'appelle sans
 * paramètre : *aucun test ne peut lui en désigner un autre*. Un fichier de
 * tests d'action dont le domaine ne trie pas en tête tourne donc contre le
 * domaine résiduel qu'une exécution interrompue a laissé — la personne de sa
 * fixture est cherchée dans le mauvais domaine, la couche scopée ne la trouve
 * pas, et le repli du stub ouvre une session sur le responsable *de l'autre*.
 * C'est la cause des **63 échecs sur 3 fichiers** relevés le 02/09/2026, et le
 * résidu était `__test__actions__zhl4eg71`, du 02/09 lui aussi.
 *
 * **Pourquoi la garde vit ici et pas dans les fichiers.** Deux fichiers
 * portaient déjà la parade — un nom qui trie en tête, une garde qui échoue en
 * nommant la cause (18/08/2026, puis T7.3) —, trois ne l'avaient pas : c'est
 * exactement cette asymétrie qui a produit le défaut. Et la forme prescrite —
 * retenir `domainId` hors de la fixture pour que l'`afterAll` nettoie même
 * quand le `beforeAll` échoue — **n'aurait pas suffi** : le fichier qui a laissé
 * ce résidu la portait déjà. Son `afterAll` n'a pas été *sauté*, il n'a **jamais
 * été appelé**, le processus ayant été tué. Un nettoyage par fichier ne protège
 * de rien contre une exécution interrompue ; seule une garde au niveau de la
 * suite le fait, et un seul endroit ne s'oublie pas.
 *
 * **Ce n'est pas un `db:reset`, et la différence tient en trois points.**
 * Le balayage est *nominatif* — il ne touche que les domaines dont le nom
 * commence par `__`, la convention de tous les domaines de tests du dépôt, et
 * qu'aucun domaine réel ne porte. Il lit `TEST_DATABASE_URL` **et elle seule** :
 * il ne peut pas atteindre la base de développement, propriété que
 * `vitest.config.mts` s'était déjà donnée. Et il tourne **avant** l'exécution,
 * donc il ne peut pas effacer la trace d'un défaut de celle-ci.
 *
 * **Il nomme ce qu'il efface.** Un balayage muet serait ce que le chantier
 * interdit — « une suite rouge se diagnostique, elle ne se tait pas ». Chaque
 * domaine retiré est écrit sur la sortie ; le cas normal, lui, ne dit rien et
 * coûte un aller-retour.
 *
 * **La règle 1 n'est pas contournée : elle ne porte pas ici.** Ce module est du
 * harnais, pas de l'application — il n'importe pas `lib/db/client`, il ouvre sa
 * propre connexion sur la branche de test, et `domains` est de toute façon la
 * seule table sans `domain_id`. Aucune dépendance neuve : `dotenv` et
 * `@neondatabase/serverless` sont déjà là.
 */

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

/**
 * La convention de nom des domaines de tests, et rien d'autre.
 *
 * Tous les fichiers du dépôt préfixent le leur de `__` — `__test__…` pour la
 * plupart, `__0__test__…` pour les deux qui ont voulu trier en tête. Aucun
 * domaine réel ne commence par un souligné : c'est ce qui fait de ce motif une
 * frontière, et non une approximation.
 */
const RESIDUAL_DOMAIN = "^__";

type DomainRow = { id: string; name: string };

export default async function sweepResidualDomains(): Promise<void> {
  const parsed = config({ path: ".env.local" }).parsed ?? {};
  const testUrl = parsed.TEST_DATABASE_URL ?? process.env.TEST_DATABASE_URL;

  /* La même levée que `vitest.config.mts`, pour la même raison : sans branche
     de test nommée, rien ne tourne — et surtout, rien ne s'efface ailleurs. */
  if (!testUrl) {
    throw new Error(
      "TEST_DATABASE_URL est absente de .env.local : le balayage des domaines " +
        "résiduels ne s'exécute que sur la branche de test, jamais sur " +
        "DATABASE_URL.",
    );
  }

  const sql = neon(testUrl);

  const residual = (await sql`
    select id, name from domains where name ~ ${RESIDUAL_DOMAIN} order by name
  `) as DomainRow[];

  if (residual.length === 0) return;

  const ids = residual.map((domain) => domain.id);

  /* Les tables se lisent au catalogue plutôt que de s'écrire à la main.
     L'ordre de suppression, lui, ne s'écrit pas non plus : on retente jusqu'à
     ce qu'un tour complet ne bute plus sur une clé étrangère — un `restrict`
     ne dit pas « jamais », il dit « pas encore ». Une liste d'ordre serait une
     liste à maintenir à chaque table neuve, et c'est l'oubli qui a déjà coûté
     un domaine résiduel en T6.2, `tools` n'y figurant pas. */
  const scoped = (await sql`
    select table_name from information_schema.columns
    where table_schema = 'public' and column_name = 'domain_id'
  `) as { table_name: string }[];

  let remaining = scoped.map((column) => column.table_name);
  let lastError: unknown = null;

  while (remaining.length > 0) {
    const blocked: string[] = [];

    for (const table of remaining) {
      try {
        await sql.query(
          `delete from "${table}" where domain_id = any($1::uuid[])`,
          [ids],
        );
      } catch (error) {
        lastError = error;
        blocked.push(table);
      }
    }

    /* Aucun progrès sur un tour entier : ce n'est plus un ordre de dépendance,
       c'est un défaut. On lève en le nommant plutôt que de boucler. */
    if (blocked.length === remaining.length) {
      throw new Error(
        "Le balayage des domaines résiduels n'avance plus. Tables bloquées : " +
          blocked.join(", ") +
          `. Dernière erreur : ${String(lastError)}`,
      );
    }

    remaining = blocked;
  }

  await sql.query(`delete from domains where id = any($1::uuid[])`, [ids]);

  console.log(
    `[vitest] ${residual.length} domaine(s) résiduel(s) balayé(s) avant ` +
      `l'exécution : ${residual.map((domain) => domain.name).join(", ")}. ` +
      "Un domaine de tests qui survit à son fichier fait tomber tout fichier " +
      "de tests d'action dont le domaine ne trie pas avant lui (T8.1).",
  );
}
