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
 *
 * Depuis TD.6, le script `lint` porte `--max-warnings=0` : ce qui reste en
 * `warn` ici ne survit plus à un `npm run lint`. C'est voulu — la sévérité dit
 * la nature du défaut, le seuil dit qu'on ne le laisse pas s'installer.
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

/* ==========================================================================
   Les deux garde-fous d'attribut `className`

   Ils partagent un mécanisme — un sélecteur esquery portant une expression
   régulière sur la valeur du nœud — et une limite : **une classe écrite hors
   d'un attribut `className` leur échappe**, mesuré par sonde en TD.5.

   Deux sélecteurs par motif, parce qu'un `className` s'écrit de deux façons —
   un littéral et un gabarit de chaîne — et que les deux sont employés ici.

   **Aucun motif ne porte d'espace littéral** : `\s` est employé partout, la
   grammaire d'esquery ne garantissant pas qu'un espace traverse l'analyse d'un
   sélecteur d'attribut.
   ========================================================================== */

const CLASS_NAME_LITERAL = 'JSXAttribute[name.name="className"] Literal';
const CLASS_NAME_TEMPLATE =
  'JSXAttribute[name.name="className"] TemplateElement';

const classNameRule = (pattern, message) => [
  { selector: `${CLASS_NAME_LITERAL}[value=/${pattern}/]`, message },
  { selector: `${CLASS_NAME_TEMPLATE}[value.raw=/${pattern}/]`, message },
];

/**
 * Règle 2 du CLAUDE.md : aucune valeur visuelle en dur. Les couleurs, les
 * tailles de texte, les graisses, les interlignes et les rayons sont protégés
 * **structurellement** — `app/globals.css` efface les namespaces Tailwind
 * (`--color-*: initial`, `--text-*`, `--radius-*`, `--shadow-*`), si bien que
 * `bg-blue-500` ne compile pas. Les espacements, eux, échappaient au
 * dispositif : `--spacing: var(--number-4)` est un **pas**, pas une échelle,
 * et Tailwind en dérive n'importe quel multiplicateur (TD.5).
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

const SPACING_CLAUSES = [
  ...classNameRule(
    FRACTIONAL_STEP,
    "Espacement hors échelle : le pas du design system est de 4px, avec 2 et 6 en intercalaires (`0.5` et `1.5`). Employer un multiplicateur entier (règle 2, CLAUDE.md).",
  ),
  ...classNameRule(
    RAW_DIMENSION,
    "Dimension en dur : une valeur arbitraire doit pointer un jeton, `[length:var(--number-N)]` (règle 2, CLAUDE.md).",
  ),
  ...classNameRule(
    RAW_BORDER_WIDTH,
    "Épaisseur de bordure brute : écrire `border` (1px) ou `border-[length:var(--border-width-N)]` (règle 2, CLAUDE.md).",
  ),
];

/**
 * Le garde-fou des espacements, **sur le socle uniquement**.
 *
 * `socleLock` ci-dessous ignore `components/ui/` — il faut donc que les clauses
 * de TD.5 y restent portées par un bloc à lui. Partout ailleurs, c'est
 * `socleLock` qui les porte, et **la raison est structurelle** : le format plat
 * d'ESLint **écrase** la valeur d'une règle, il ne la fusionne pas. Deux blocs
 * qui posent `no-restricted-syntax` sur le même fichier ne s'additionnent pas,
 * le dernier gagne. Sans la reprise de `SPACING_CLAUSES` dans `socleLock`, les
 * trois clauses de TD.5 disparaîtraient de tout le dépôt sauf du socle, en
 * silence.
 */
const spacingScaleLock = {
  files: ["components/ui/**/*.tsx"],
  rules: {
    "no-restricted-syntax": ["error", ...SPACING_CLAUSES],
  },
};

/* ==========================================================================
   TD.6 (a) — la signature d'un composant du socle ne se récrit pas à la main
   ========================================================================== */

/**
 * Ce que TD.3, TD.4 et TD.5 ont retiré, ce bloc l'empêche de revenir.
 *
 * **Le motif porte sur ce qui fait la signature — le fond, le rythme —, jamais
 * sur la chaîne entière.** La sonde du 18/08/2026 l'a mesuré : sur le seul
 * bouton primaire, un motif lâche a rattrapé **douze** écritures, dont la copie
 * *dérivée* de `/dev/session` qu'une regex calquée sur la chaîne exacte aurait
 * manquée — et c'était précisément celle qu'il fallait attraper.
 *
 * **Le message nomme le remplaçant, jamais seulement l'interdit** — patron de
 * `dbClientLock` ci-dessus. Un message qui dit « interdit » sans dire « écris
 * ceci » fait chercher, et qui cherche recopie.
 *
 * **`components/ui/**` est ignoré** : c'est là que ces chaînes vivent
 * légitimement, et une règle qui interdirait au socle de se définir lui-même
 * serait une règle qu'on désactive au premier usage.
 *
 * **Ce que ce bloc ne garde pas, et qu'il ne faut pas croire acquis.** Il garde
 * les signatures qu'il connaît : un composant inventé demain avec une chaîne
 * neuve ne sera pas rattrapé. C'est un **cliquet sur la duplication
 * constatée**, pas une preuve de cohérence.
 */
const SOCLE_CLAUSES = [
  ...classNameRule(
    String.raw`bg-surface-primary-base.*px-4.*py-2`,
    "Bouton primaire recopié : employer `Button` de `components/ui/button.tsx`, ou `BUTTON_PRIMARY` quand la balise n'est pas un `<button>` (TD.3).",
  ),
  ...classNameRule(
    String.raw`border-content-neutral-normal.*px-4.*py-2`,
    'Bouton secondaire recopié : employer `<Button variant="secondary">` de `components/ui/button.tsx`, ou `BUTTON_SECONDARY` quand la balise n\'est pas un `<button>` (TD.3).',
  ),
  ...classNameRule(
    String.raw`font-semibold.*text-content-primary-dark.*underline`,
    "Lien d'action recopié : employer `ACTION_LINK` (`xs`) ou `ACTION_LINK_SM` (`sm`) de `components/ui/action-link.ts` (TD.1, TD.3).",
  ),
  ...classNameRule(
    String.raw`rounded-lg\sborder.*bg-surface-neutral-pale.*px-3.*py-2`,
    "Contrôle de saisie recopié : employer `CONTROL` — ou `CONTROL_TEXT` s'il porte un texte d'invite — de `components/ui/form-field.tsx`, avec `borderOf()` pour la couleur du filet (TD.1).",
  ),
  /* Les trois écritures que TD.4 a fait disparaître, et non celle qu'il a
     retenue : `text-sm leading-175 text-content-neutral-dark` reste porté
     légitimement par quatre paragraphes qui disent l'inverse d'une absence —
     une bio, un résumé de persona, la note de vision, l'écart chiffré. Ce qui
     les distingue est l'intention, et ESLint ne la lit pas. Ce motif garde donc
     la **divergence**, qui est le défaut que l'audit a nommé, et non la
     duplication. `text-xs leading-175 text-content-neutral-base` reste hors du
     motif : ce sont les cinq non-absences de roadmap que TD.4 a écartées. */
  ...classNameRule(
    String.raw`text-sm\sleading-175\stext-content-neutral-base|text-md\sleading-175\stext-content-neutral-dark|mt-2\stext-xs\stext-content-neutral-base`,
    "État vide dans un bloc, dans une variante que TD.4 a retirée : employer `BlockNote` de `components/ui/empty-state.tsx`, dont le jeton est `content-neutral-dark` — le seul qui passe sur les deux tonalités de bloc (règle 5).",
  ),
  ...classNameRule(
    String.raw`bg-surface-neutral-pale.*px-7.*py-4`,
    "Bandeau d'archivage recopié : employer `ArchivedNotice` de `components/ui/archived-notice.tsx` (TD.4).",
  ),
];

const socleLock = {
  files: ["**/*.tsx"],
  ignores: ["components/ui/**"],
  rules: {
    "no-restricted-syntax": ["error", ...SPACING_CLAUSES, ...SOCLE_CLAUSES],
  },
};

/* ==========================================================================
   TD.6 (b) — l'étanchéité de `components/ui/`
   ========================================================================== */

/**
 * Le socle n'importe aucun composant métier, aucune requête en valeur, aucune
 * action. **La propriété était vraie et rien ne la retenait** — or c'est elle
 * qui fait tenir la couche, davantage que le nom des dossiers, et c'est
 * l'argument sur lequel la doctrine de l'audit a écarté la taxonomie de
 * l'atomic design. Une frontière qu'on dit vérifiable doit être vérifiée.
 *
 * `allowTypeImports` sur les requêtes, et l'unique usage légitime le justifie :
 * `status-dot.tsx` importe `ProjectStatusNature` pour rendre ses trois `Record`
 * **exhaustifs à la compilation**. C'est un bénéfice, pas une entorse — le
 * retirer coûterait la garantie.
 *
 * Le greffon `@typescript-eslint` est enregistré globalement par
 * `eslint-config-next/typescript` : aucune dépendance n'est ajoutée.
 */
const uiLayerSeal = {
  files: ["components/ui/**/*.{ts,tsx}"],
  rules: {
    "@typescript-eslint/no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@/lib/queries/*"],
            allowTypeImports: true,
            message:
              "Le socle ne lit pas la base : une requête ne s'importe ici qu'en `import type` (TD.6).",
          },
          {
            group: [
              "@/components/products/*",
              "@/components/projects/*",
              "@/components/team/*",
            ],
            message:
              "Le socle ne connaît aucun composant métier : la dépendance va du métier vers `components/ui/`, jamais l'inverse (TD.6).",
          },
          {
            group: ["@/app/*"],
            message:
              "Une action serveur n'entre pas dans le socle : elle se passe en prop depuis l'appelant (TD.6).",
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
  underscoreIsIntentional,
  spacingScaleLock,
  socleLock,
  uiLayerSeal,
];

export default eslintConfig;
