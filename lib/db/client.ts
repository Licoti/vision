/**
 * Connexion à la base Neon.
 *
 * ⚠️ À partir de T1.3, **seul `lib/db/scoped.ts` importe ce module**.
 * La règle 1 du CLAUDE.md est sans exception : aucune requête sans
 * `domainId`. Un import de `db` depuis un composant, une route ou un script
 * est un défaut, même si la requête fonctionne.
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL est absente. Copier .env.example en .env.local et renseigner la chaîne Neon.",
  );
}

export const db = drizzle(neon(connectionString), { schema });

export type Database = typeof db;
