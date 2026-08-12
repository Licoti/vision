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
    include: ["lib/**/*.test.ts"],
    environment: "node",
    env: { ...parsed, DATABASE_URL: testUrl },
    // Les tests partagent une base réelle : pas d'exécution concurrente.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
