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

/**
 * Règle 2 du CLAUDE.md : aucune valeur visuelle en dur. Les couleurs, les
 * tailles de texte, les graisses, les interlignes et les rayons sont protégés
 * **structurellement** — `app/globals.css` efface les namespaces Tailwind
 * (`--color-*: initial`, `--text-*`, `--radius-*`, `--shadow-*`), si bien que
 * `bg-blue-500` ne compile pas. Les espacements, eux, échappaient au
 * dispositif : `--spacing: var(--number-4)` est un **pas**, pas une échelle,
 * et Tailwind en dérive n'importe quel multiplicateur (TD.5).
 *
 * Deux sélecteurs par clause, parce qu'un `className` s'écrit de deux façons —
 * un littéral et un gabarit de chaîne — et que les deux sont employés ici.
 *
 * Ce que la règle ne vise pas, et pourquoi : un **point d'arrêt de mise en
 * page** n'est pas une valeur de thème (arbitrage du journal de T1.6). Les
 * ratios `flex-[1.4]` et les gabarits `grid-cols-[20rem_1fr]` restent donc
 * hors de la clause 2, qui ne porte que sur les utilitaires de dimension.
 */
const SPACING_UTILITIES =
  "min-w|min-h|max-w|max-h|inset-x|inset-y|space-x|space-y|translate-x|translate-y|gap-x|gap-y|size|gap|px|py|pt|pb|pl|pr|mx|my|mt|mb|ml|mr|top|right|bottom|left|inset|w|h|p|m";

/* Un multiplicateur fractionnaire autre que `0.5` et `1.5`, seuls intercalaires
   de l'échelle (`--number-2` et `--number-6`). */
const FRACTIONAL_STEP = String.raw`-(?!(?:0|1)\.5(?![\d.]))\d+\.\d+`;

/* Une valeur arbitraire de dimension qui ne pointe aucun jeton. */
const RAW_DIMENSION = String.raw`(?:^|[\s:])-?(?:${SPACING_UTILITIES})-\[(?![^\]]*var\()[^\]]*\d`;

/* Une épaisseur de bordure brute : Tailwind dérive `border-3` d'un nombre, pas
   d'un jeton (`globals.css`, en-tête des styles de base). `border-t-0` reste
   légitime — c'est une absence de bordure, pas une épaisseur. */
const RAW_BORDER_WIDTH = String.raw`(?:^|[\s:])-?border(?:-[trblxyse])?-[1-9]`;

const CLASS_NAME_LITERAL = 'JSXAttribute[name.name="className"] Literal';
const CLASS_NAME_TEMPLATE =
  'JSXAttribute[name.name="className"] TemplateElement';

const spacingRule = (pattern, message) => [
  { selector: `${CLASS_NAME_LITERAL}[value=/${pattern}/]`, message },
  { selector: `${CLASS_NAME_TEMPLATE}[value.raw=/${pattern}/]`, message },
];

const spacingScaleLock = {
  files: ["**/*.tsx"],
  rules: {
    "no-restricted-syntax": [
      "error",
      ...spacingRule(
        FRACTIONAL_STEP,
        "Espacement hors échelle : le pas du design system est de 4px, avec 2 et 6 en intercalaires (`0.5` et `1.5`). Employer un multiplicateur entier (règle 2, CLAUDE.md).",
      ),
      ...spacingRule(
        RAW_DIMENSION,
        "Dimension en dur : une valeur arbitraire doit pointer un jeton, `[length:var(--number-N)]` (règle 2, CLAUDE.md).",
      ),
      ...spacingRule(
        RAW_BORDER_WIDTH,
        "Épaisseur de bordure brute : écrire `border` (1px) ou `border-[length:var(--border-width-N)]` (règle 2, CLAUDE.md).",
      ),
    ],
  },
};

const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "docs/**"] },
  ...coreWebVitals,
  ...typescript,
  dbClientLock,
  underscoreIsIntentional,
  spacingScaleLock,
];

export default eslintConfig;
