/**
 * Les tests de `lib/db/scoped.ts` écrivent et suppriment en base réelle.
 * Ils tournent donc sur une branche Neon dédiée, jamais sur la base de
 * développement qui portera l'amorçage de T1.5.
 *
 * `DATABASE_URL` est remappée sur `TEST_DATABASE_URL` pour l'environnement des
 * tests : `lib/db/client.ts` se connecte à la branche de test sans être
 * modifié, et une exécution de tests ne *peut pas* atteindre la base de
 * développement.
 */

import { fileURLToPath } from "node:url";

import { config } from "dotenv";
import { defineConfig } from "vitest/config";

const parsed = config({ path: ".env.local" }).parsed ?? {};

const testUrl = parsed.TEST_DATABASE_URL ?? process.env.TEST_DATABASE_URL;

if (!testUrl) {
  throw new Error(
    "TEST_DATABASE_URL est absente de .env.local. Créer une branche Neon " +
      "dédiée aux tests et y appliquer la migration :\n" +
      '  DATABASE_URL="$TEST_DATABASE_URL" npm run db:migrate\n' +
      "Aucun test n'est sauté en silence : sans cette variable, rien ne tourne.",
  );
}

export default defineConfig({
  // Le chemin `@/…` de `tsconfig.json`. Les modules de `lib/queries` l'emploient
  // pour importer la couche d'accès ; sans cette ligne, ils sont typables mais
  // pas exécutables sous Vitest. Aucune dépendance ajoutée pour si peu.
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    /* **La garde des domaines résiduels — T8.1, 04/09/2026.**

       `resolveDomainId` (`lib/auth/session.ts`) rend **le premier domaine actif
       par nom**, et `loadCurrentSession` l'appelle sans paramètre : aucun test
       ne peut lui en désigner un autre. Un domaine de tests qui survit à son
       fichier fait donc tomber **tout** fichier de tests d'action dont le
       domaine ne trie pas avant lui — 63 échecs sur 3 fichiers, relevés le
       02/09/2026 et reproduits à l'identique par une ligne forgée.

       La parade ne pouvait pas vivre dans les fichiers : sur les six fichiers
       de tests d'action, **deux** la portaient et **quatre** ne l'avaient pas —
       et c'est cette asymétrie même qui a produit le défaut. Elle ne pouvait pas
       non plus tenir au seul nettoyage par fichier : un processus tué n'appelle
       aucun `afterAll`. Elle vit donc ici, une fois, avant la première ligne de
       tests. */
    globalSetup: ["./vitest.global-setup.ts"],

    /* `app/**` s'ajoute le 17/08/2026, avec le premier fichier de tests
       d'**action serveur** du projet. La discipline du `CLAUDE.md` — « le droit
       s'éprouve par l'action, jamais par l'écran » — demandait jusque-là de
       croire sur parole les portes d'`actions.ts`, faute d'un chemin pour les
       interroger : elles vivent dans `app/`, que cette ligne n'atteignait pas.
       Le motif reste borné aux fichiers de test ; aucun composant n'entre. */
    include: ["lib/**/*.test.ts", "app/**/*.test.ts"],
    environment: "node",
    env: { ...parsed, DATABASE_URL: testUrl },
    // Les tests partagent une base réelle : pas d'exécution concurrente.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
