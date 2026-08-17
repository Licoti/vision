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

/**
 * Un paramètre inutilisé nommé `_…` est **imposé par une signature**, pas oublié.
 *
 * Les actions de confirmation reçoivent `(_previous, _formData)` parce que
 * `useActionState` les appelle ainsi : l'action n'a rien à saisir, mais elle ne
 * peut pas déclarer moins d'arguments que le crochet n'en passe avant celui qui
 * l'intéresse. Quatre avertissements permanents en découlaient depuis T4bis.2 —
 * et un avertissement permanent est un avertissement qu'on cesse de lire, donc
 * un avertissement neuf qu'on ne verra pas. Le souligné dit l'intention ; cette
 * règle le fait reconnaître (TD.1).
 */
const underscoreIsIntentional = {
  files: ["**/*.{ts,tsx}"],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
  },
};

const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "docs/**"] },
  ...coreWebVitals,
  ...typescript,
  dbClientLock,
  underscoreIsIntentional,
];

export default eslintConfig;
