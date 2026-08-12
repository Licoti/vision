import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js lit .env.local tout seul ; drizzle-kit tourne hors de Next.
config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL est absente. Copier .env.example en .env.local et renseigner la chaîne Neon.",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: connectionString },
  strict: true,
  verbose: true,
});
