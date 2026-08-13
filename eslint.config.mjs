import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

/**
 * Règle 1 du CLAUDE.md : aucune requête sans `domainId`. `lib/db/scoped.ts`
 * est le seul module applicatif autorisé à importer `lib/db/client` — les
 * fichiers de test l'importent aussi, pour vérifier la couche scopée par le
 * client brut (voir l'en-tête de `lib/db/scoped.test.ts`).
 */
const dbClientLock = {
  files: ["**/*.{ts,tsx}"],
  ignores: ["lib/db/scoped.ts", "**/*.test.{ts,tsx}"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["**/db/client", "**/db/client.ts", "@/lib/db/client"],
            message:
              "Seul lib/db/scoped.ts importe lib/db/client (règle 1, CLAUDE.md).",
          },
        ],
      },
    ],
  },
};

const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "docs/**"] },
  ...coreWebVitals,
  ...typescript,
  dbClientLock,
];

export default eslintConfig;
