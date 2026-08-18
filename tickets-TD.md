# Tickets — TD (dette technique, hors chantier)

Un ticket = une session de CLI. Chaque ticket porte un objectif, un périmètre de fichiers, un
critère de validation vérifiable et ses interdits.

**Règle commune à tous les tickets :** ne modifier aucun fichier hors du périmètre annoncé, ne
créer aucune fonctionnalité non listée, mettre à jour `ETAT.md` en fin de ticket.

---

# TD — la dette de la couche de présentation

**Ces tickets sont hors chantier**, comme TD.1 et TD.2 avant eux (tous deux terminés, récit dans
`HISTORIQUE-TICKETS.md`). Ils ne se tirent pas de `docs/05` §5 : ils se tirent d'un audit de la
couche de présentation demandé le 18/08/2026, dont le constat est consigné dans
`JOURNAL-TECHNIQUE.md`.

**Ce que l'audit a écarté, et qu'aucun de ces tickets ne fera.** La question posée était de savoir
s'il fallait descendre le style dans le CSS (`@apply`, `@layer components`) et adopter la taxonomie
de l'atomic design. Les deux sont refusées, argumentées au journal. **Aucun fichier ne se renomme,
aucun dossier ne se crée, aucune règle CSS de composant ne s'écrit.**

**Ce que l'audit a retenu :** la dette n'est pas une dette de technique, c'est une dette de
**couverture d'inventaire**. `docs/design/design-system.md` §10 nomme une quarantaine de composants ;
`components/ui/` en porte dix-sept, et pas de bouton.

## L'ordre, et pourquoi il n'est pas celui des numéros

**TD.3, puis TD.5, puis TD.4, puis TD.6.** TD.5 pose le garde-fou des espacements avant que TD.4
n'élargisse la surface : une règle qui arrive après le fichier qu'elle aurait dû surveiller ne prouve
rien sur lui. TD.4 vient après parce qu'il est le seul à demander un arbitrage humain. **TD.6 vient
en dernier par nécessité** : il garde des signatures que TD.3 et TD.4 créent — on ne garde pas ce qui
n'existe pas encore —, et son point (c) exige que TD.4 ait tranché.

**TD.3, TD.4 et TD.5 retirent des copies. TD.6 empêche la suivante.** Sans lui, les trois premiers
sont un nettoyage dont la démonstration du contraire est déjà faite : `ACTION_LINK` a été extrait en
TD.1 — « un seul exemplaire, après quatre » — et il a **redivergé six jours plus tard**, dans un
fichier qui importait déjà `components/ui/`.

## Le critère commun, et la raison qui l'impose

**Il n'existe aucun test de présentation.** `vitest.config.mts` restreint volontairement
(`include: ["lib/**/*.test.ts", "app/**/*.test.ts"]`, `environment: "node"`, « aucun composant
n'entre »), et le dépôt n'a ni jsdom, ni snapshot, ni e2e. Les vingt-trois fichiers de test portent
sur `lib/` et sur les actions serveur — le droit s'éprouve par l'action, jamais par l'écran.

Le critère de chaque ticket est donc celui de TD.1 : **le diff du HTML servi est vide**, mesuré
avant/après par `git stash` sur six écrans — `/`, `/produits`, `/produits/[id]`, `/projets`,
`/projets/[id]`, `/equipe` —, **sauf les écarts nommés dans la fiche**, qui se rapportent un par un.

**Et la base ne bouge pas entre les deux mesures.** C'est la leçon de TD.1, qui a vu un indicateur
créé au navigateur pendant sa capture et a dû tout refaire : une comparaison avant/après n'est un
instrument que si les données n'ont pas changé.

---

## TD.3 — Le bouton et le lien d'action

**Objectif** — Fermer les vingt-quatre copies des trois chaînes de geste de l'application. C'est le
geste de TD.1 sur le champ de saisie et sur la coquille de panneau, appliqué à ce qui restait : le
bouton, que le socle n'a jamais porté.

**Périmètre** — `components/ui/button.tsx` (neuf) ; `components/ui/action-link.ts` ;
`components/products/readings-panel.tsx` ; puis les appelants, et rien qu'eux :
`app/(app)/layout.tsx`, `app/(app)/produits/page.tsx`, `app/(app)/produits/nouveau/page.tsx`,
`app/(app)/produits/[id]/page.tsx`, `app/(app)/projets/page.tsx`,
`app/(app)/projets/nouveau/page.tsx`, `app/(app)/projets/[id]/page.tsx`, `app/dev/session/page.tsx`,
`components/ui/panel.tsx`, `components/ui/confirm-panel.tsx`, `components/products/product-form.tsx`,
`components/projects/project-form.tsx`.

**Le constat, chiffré**

| Rôle | Copies | Chaîne |
|---|---|---|
| Bouton primaire | **11** | `rounded-lg bg-surface-primary-base px-4 py-2 text-sm font-semibold text-content-neutral-pale` |
| Bouton secondaire | **4** | `rounded-lg border border-content-neutral-normal px-4 py-2 text-sm font-semibold text-content-neutral-dark` |
| Lien-action `sm` | **9** | `text-sm font-semibold text-content-primary-dark underline` |

**Attendu** — Deux niveaux, et le critère de choix entre eux est celui que `action-link.ts`
documente déjà : **un composant quand l'élément rendu est fixe, une constante quand c'est la balise
qui varie.**

`components/ui/button.tsx` porte donc les deux :

- `Button`, pour les `<button>` — sur le patron de `Block` : un `const VARIANT = { primary,
  secondary } as const`, une interpolation dans un gabarit de chaîne. **Pas de `cva`, pas de `cn`,
  pas de `tailwind-merge`** : le dépôt n'a aucune dépendance d'interface, et la composition manuelle
  y est viable **parce que** `--color-*: initial` ferme l'espace de classes. Ce n'est pas une
  préférence, c'est la conséquence d'une décision antérieure.
- `BUTTON_PRIMARY` et `BUTTON_SECONDARY`, constantes exportées, pour les cas où le geste n'est pas
  un `<button>`. Ils sont trois : le `<Link>` de `produits/[id]/page.tsx:320`, le `<DrawerLink>` de
  `:326`, et leurs jumeaux de `projets/[id]/page.tsx:281` et `:287` — **le même bouton secondaire
  sur trois balises différentes, côte à côte dans le même `<span>`**. Un composant en imposerait une.
  Le skip-link d'`app/(app)/layout.tsx:29` relève du même niveau : il est le bouton primaire **plus**
  `sr-only` et quatre utilitaires de focus.

`ACTION_LINK_SM` rejoint `ACTION_LINK` dans `components/ui/action-link.ts`. La variante `xs` a été
factorisée en TD.1 (« un seul exemplaire, après quatre ») ; la variante `sm` n'a jamais eu droit au
même traitement et elle est à neuf.

**Et une divergence se referme au passage.** `components/products/readings-panel.tsx:42` redéfinit
localement un `ACTION_LINK` qui **diverge** de celui du socle — il ajoute `underline-offset-2`. Le
fichier importe déjà `@/components/ui/drawer` : l'import est sans coût. C'est exactement le défaut
que l'en-tête d'`action-link.ts` prétend avoir corrigé, revenu par une autre porte, et c'est la
démonstration que le socle ne suffit pas si personne ne sait qu'il existe.

**Validation** — Le diff du HTML servi est **vide** sur les six écrans, plus `/produits/nouveau`,
`/projets/nouveau` et les deux `modifier`. `npm run lint` et `npx tsc --noEmit` passent. Les
vingt-trois fichiers de test restent verts **sans modification** — si l'un bouge, c'est qu'on a
débordé.

**L'unique écart, assumé et rapporté** — `app/dev/session/page.tsx:112` porte une copie **dérivée**
du bouton primaire : `rounded-sm` au lieu de `rounded-lg`, et `text-surface-neutral-lightest` au lieu
de `text-content-neutral-pale`. Son rendu **changera**, et c'est la correction d'une dérive, pas un
effet de bord. Route de développement, rendue 404 en production, reliée à aucune navigation. **Le
contraste du couple corrigé se mesure** avant d'être cru — `content-neutral-pale` sur
`surface-primary-base` — même s'il est déjà en vigueur sur les dix autres copies.

**Interdits** — **Aucune variante neuve.** Pas de `size`, pas de `danger`, pas de `ghost` : aucun
appelant n'en a, et un composant de socle qui porte une variante sans appelant est une variante que
le suivant emploiera de travers. Aucun jeton nouveau. **Aucun huitième substitut au design system** —
la règle tient depuis T2.3 et n'a jamais été enfreinte. Ne pas toucher au menu « … »
(`action-menu.tsx`), dont `MENU_ITEM` et `MENU_ITEM_DANGER` sont déjà factorisés. Ne pas toucher aux
formulaires eux-mêmes : seul l'attribut `className` du bouton change.

---

## TD.5 — Le garde-fou de la règle 2 sur les espacements

**Objectif** — Refermer le seul trou de la règle 2. Les couleurs, les tailles de texte, les graisses,
les interlignes et les rayons sont **structurellement** protégés : `app/globals.css` efface les
namespaces Tailwind (`--color-*: initial`, `--text-*`, `--radius-*`, `--shadow-*`), si bien que
`bg-blue-500` ne compile pas. L'audit a cherché les violations de couleur sur vingt-deux teintes et
onze niveaux : **il n'y en a aucune.**

Les espacements, eux, échappent au dispositif. `--spacing: var(--number-4)` (`globals.css:173`) est
un **pas**, pas une échelle : Tailwind en dérive n'importe quel multiplicateur, y compris
fractionnaire, et la liste `--number-*` du §4 ne contraint rien.

**Périmètre** — `eslint.config.mjs` ; puis les fichiers en infraction, et rien qu'eux.

**Le constat, chiffré** — **Une soixantaine de valeurs hors échelle** se sont déjà accumulées :

| Classe | Valeur | Au §4 du design system |
|---|---|---|
| `gap-2.5` (×12), `px-2.5`, `h-2.5`, `w-2.5` | 10px | **absent** |
| `px-2.25` (×2) | 9px | **absent** |
| `mt-3.5` (×2), `gap-3.5`, `p-3.5` | 14px | **absent** |
| `top-7.5` | 30px | **absent** |
| `w-2.75` | 11px | **absent** |
| `w-5.5` | 22px | **absent** |
| `gap-1.5`, `py-1.5`, `mt-1.5`, `px-1.5` | 6px | présent (`--number-6`) |
| `gap-0.5`, `py-0.5`, `w-0.5`, `left-0.5` | 2px | présent (`--number-2`) |

Les deux dernières lignes sont **conformes** : `0.5` et `1.5` retombent exactement sur les deux
intercalaires que `tokens.css:310` nomme. Toutes les autres sont des valeurs que le design system
n'a pas.

Trois écarts isolés s'y ajoutent, d'une autre nature :

- `components/products/indicators.tsx:494` — `grid-cols-[repeat(auto-fill,minmax(300px,1fr))]`,
  **300px en dur** ;
- `components/products/indicators.tsx:586` — `grid-cols-[20rem_1fr]`, **20rem en dur** ;
- `components/projects/roadmap.tsx:556` — `border-l-3`, là où `globals.css:201` prescrit
  `border-l-[length:var(--border-width-2)]`, Tailwind 4 dérivant `border-3` d'un nombre brut et non
  d'un jeton.

**Attendu** — Une règle dans `eslint.config.mjs`, **sur le patron exact de `dbClientLock`** qui
verrouille déjà la règle 1 dans ce même fichier : un objet nommé, un commentaire qui dit la règle
qu'il sert, et un message d'erreur qui renvoie à `CLAUDE.md`. La règle interdit, dans un littéral
d'attribut `className` :

1. tout multiplicateur fractionnaire autre que `0.5` et `1.5` ;
2. toute valeur arbitraire de dimension (`[300px]`, `[20rem]`) qui ne pointe pas un `var(--…)`.

Les valeurs arbitraires qui **pointent un jeton** restent autorisées — c'est le motif que
`globals.css:201` prescrit, et `drawer.tsx:310` comme `indicators.tsx:831` l'emploient correctement.
Les ratios de mise en page (`flex-[1.4]`, `flex-[1.2]`, `flex-[1.6]`) ne sont pas des valeurs
visuelles et restent hors de la règle : **un point d'arrêt de mise en page n'est pas une valeur de
thème**, arbitrage déjà posé au journal de T1.6.

Les fichiers en infraction sont mis en conformité **par arrondi au pas de l'échelle**, et chaque
arrondi se rapporte.

**Validation** — **La règle se met en défaut avant d'être crue** : introduire un `gap-2.5` témoin
dans un fichier propre, voir l'erreur tomber sur lui, et **sur lui seul** ; puis le retirer.
`npm run lint` passe sur le dépôt entier. Le diff du HTML servi n'est **pas** vide ici — les arrondis
déplacent des pixels —, et c'est le seul ticket des trois dans ce cas : chaque écart se lit dans le
diff et se rapporte, aucun ne se découvre après coup.

**Interdits** — **Ne pas inventer de jeton pour combler un arrondi.** Si aucune valeur de l'échelle
ne convient à un endroit précis, c'est un **huitième manque du design system** : il se consigne dans
`ETAT.md` avec les sept autres, et il se fait remonter à qui maintient le document. Ne pas toucher à
`tokens.css` ni à `globals.css` : le trou est dans la surveillance, pas dans les jetons. Ne pas
étendre la règle aux couleurs — elles n'en ont pas besoin, et une règle redondante est une règle
qu'on désactive.

---

## TD.4 — L'état vide dans un bloc, et le bandeau d'archivage

**Objectif** — Deux extractions mécaniques, et un défaut réel découvert par l'audit. La partie
éditoriale — `Section` contre `Block` — **n'est pas dans ce ticket** et reste où `ETAT.md` l'a mise.

**Périmètre** — `components/ui/empty-state.tsx` ; `components/ui/archived-notice.tsx` (neuf) ;
`components/ui/section.tsx` ; puis les appelants listés ci-dessous, et rien qu'eux.

### (a) L'état vide dans un bloc

**Ne pas confondre avec `EmptyState`**, qui est l'état vide **d'écran** — bordure tiretée, titre de
rang 2 ou 3 — et qui est factorisé depuis longtemps, avec seize appelants. Il s'agit ici du
**paragraphe d'absence posé dans un bloc déjà rempli par ailleurs** : « aucune ressource reliée pour
l'instant », « aucun relevé ».

Il est écrit une quinzaine de fois, en **cinq variantes qui ont divergé** :

| Classes | Où |
|---|---|
| `text-sm leading-175 text-content-neutral-base` | `persona-detail.tsx:212`, `readings-panel.tsx:89`, `resources.tsx:174`, `adopted-indicators.tsx:181`, `projets/[id]/page.tsx:450` |
| `text-sm leading-175 text-content-neutral-dark` | `indicators.tsx:522`, `:606`, `:629` |
| `text-md leading-175 text-content-neutral-dark` | `indicators.tsx:378` |
| `mt-2 text-xs text-content-neutral-base` | `indicators.tsx:1138` |
| `text-xs leading-175 text-content-neutral-base` | `products/roadmap.tsx:573`, `projects/roadmap.tsx:410`, `:568`, `:576`, `:598` |

C'est la divergence la plus nette du dépôt : `base` contre `dark`, trois tailles, avec ou sans marge,
pour une seule intention. **La règle 5 dit qu'un état vide est un écran à part entière, jamais un cas
d'erreur** — cinq façons de l'écrire est la manière la plus discrète de le traiter comme un reste.

**Attendu** — Un `BlockNote` dans `components/ui/empty-state.tsx`, à côté d'`EmptyState` et non dans
un fichier neuf : les deux disent la même chose à deux rangs, et les séparer ferait chercher le
second à qui a trouvé le premier.

**La variante retenue se choisit au contraste mesuré, jamais au vote.** `content-neutral-base` et
`content-neutral-dark` ne se valent pas selon le fond : c'est une mesure qui a imposé `-dark` à
`BlockHeader` (`block.tsx:72` — `-base` tombe à 3,75:1 sur `surface-primary-lighter`, sous la limite
du texte courant). Or trois de ces quinze paragraphes vivent dans le bloc « Vision produit », dont la
tonalité est `primary`. **Mesurer les deux jetons sur les deux tonalités avant de trancher**, et
retenir celui qui passe partout — c'est la règle qui a déjà décidé une fois.

**L'écart de rendu est donc attendu, et c'est le seul** : les fichiers qui portaient l'autre variante
changeront. Chacun se rapporte, avec sa mesure.

### (b) Le bandeau d'archivage

`app/(app)/produits/[id]/page.tsx:292` et `app/(app)/projets/[id]/page.tsx:240` portent le **même
bandeau à la classe près** — dix classes identiques, même structure, et **le même commentaire
au-dessus**, chacun renvoyant à l'autre. Seuls varient le libellé en gras et la phrase.

→ `ArchivedNotice` dans `components/ui/`, qui reçoit le libellé, la date et la phrase. **Diff HTML
strictement vide** : c'est l'extraction la plus sûre des trois tickets.

### (c) La note perdue de `SectionHeader` — à trancher avant d'écrire

L'audit a trouvé un défaut réel, et il se lit dans le HTML servi :

> **`components/ui/section.tsx:26` déclare une prop `note` et ne la rend jamais.**
> `components/projects/roadmap.tsx:171` lui passe « Le récit de l'accompagnement, au mois. »
> Cette phrase n'est dans aucun HTML servi, et TypeScript ne dit rien puisque la prop est déclarée.

Deux issues, et **c'est un arbitrage humain, pas un choix technique** :

- **rendre la note** — le HTML change, la page projet gagne une ligne sous « Roadmap des activités »,
  et le comportement rejoint celui de `BlockHeader`, dont la note est toujours sous le titre ;
- **retirer la prop** — le HTML ne change pas, la phrase est perdue volontairement, et l'appel de
  `roadmap.tsx:171` cesse de compiler, ce qui rend la perte visible.

**À trancher avant écriture.** Ne pas choisir en cours de ticket : ce qu'on écrit là est une phrase
d'interface, elle relève de qui écrit l'interface.

**Validation** — Diff du HTML servi **vide** sur (b) et sur les fichiers de (a) qui portaient déjà la
variante retenue ; **rapporté écart par écart, avec la mesure de contraste**, sur les autres.
`npm run lint`, `npx tsc --noEmit`, et les vingt-trois tests verts sans modification. **Le contraste
se mesure** sur tout couple neuf par la position — c'est-à-dire sur les deux tonalités de bloc.

**Interdits** — **Ne pas fusionner `Section` et `Block`.** L'écart est consigné en `ETAT.md`, sa
destination est C7, et il est éditorial : « la page projet doit-elle monter au format produit, ou les
deux formats disent-ils deux rangs de bloc différents ? » ne se tranche pas dans un ticket de
factorisation. **Ne pas toucher au bloc « Vision produit »**, qui porte un langage d'en-tête assumé
comme divergent depuis le 18/08/2026 (`ETAT.md`, section c). Ne pas toucher à `EmptyState` lui-même.
Aucun jeton nouveau, aucun substitut nouveau.

---

## TD.6 — Le garde-fou du socle

**Objectif** — Faire des trois tickets précédents un **acquis** plutôt qu'un nettoyage. Ils retirent
des copies ; celui-ci empêche la douzième d'être écrite demain. C'est le seul des quatre dont le
critère de validation est **qu'il ne change rien à l'écran**.

**Périmètre** — `eslint.config.mjs` ; le script `lint` de `package.json`. **Rien d'autre** : aucun
composant, aucun jeton, aucune route.

### (a) `socleLock` — la signature d'un composant du socle ne se récrit pas à la main

**Le mécanisme a été éprouvé le 18/08/2026 avant d'être prescrit**, par une sonde jetable, et ce sont
ses mesures qui suivent — pas une hypothèse. `no-restricted-syntax` accepte un sélecteur esquery
portant une expression régulière sur la valeur du nœud. Deux sélecteurs par signature, parce qu'un
`className` s'écrit de deux façons :

```
JSXAttribute[name.name="className"] > Literal[value=/…/]
JSXAttribute[name.name="className"] TemplateElement[value.raw=/…/]
```

**Ce que la sonde a mesuré**, sur la seule signature du bouton primaire, motif
`bg-surface-primary-base[^"]*px-4[^"]*py-2` :

- **12 déclenchements** sur `app/**` et `components/**` : les **11 copies exactes**, plus celle de
  `app/dev/session/page.tsx:112`. C'est le motif **lâche** qui rattrape la dérivée — une regex
  calquée sur la chaîne exacte l'aurait manquée, et c'était précisément celle qu'il fallait attraper.
  **Règle : le motif porte sur ce qui fait la signature — le fond, le rythme —, jamais sur la chaîne
  entière.**
- **Témoin négatif concluant** : deux leurres proches — `bg-surface-neutral-pale px-4 py-2` et
  `bg-surface-primary-base px-3 py-1` — n'ont **pas** déclenché. Le gabarit de chaîne, lui, a bien
  déclenché : les deux sélecteurs sont donc l'un et l'autre nécessaires.

**Signatures à garder — et seulement celles qui ont un logement dans le socle après TD.3 et TD.4 :**

| Signature | Message renvoie vers |
|---|---|
| bouton primaire | `Button` / `BUTTON_PRIMARY` |
| bouton secondaire | `BUTTON_SECONDARY` |
| lien-action `xs` et `sm` | `ACTION_LINK` / `ACTION_LINK_SM` |
| contrôle de saisie | `CONTROL` / `CONTROL_TEXT` |
| état vide dans un bloc | `BlockNote` |
| bandeau d'archivage | `ArchivedNotice` |

**`ignores: ["components/ui/**"]`** : c'est là que ces chaînes vivent légitimement, et une règle qui
interdirait au socle de se définir lui-même serait une règle qu'on désactive au premier usage.

**Le message nomme le remplaçant, jamais seulement l'interdit.** `dbClientLock` en donne le patron
dans ce même fichier : « Seul `lib/db/scoped.ts` importe `lib/db/client` (règle 1, `CLAUDE.md`) ». Un
message qui dit « interdit » sans dire « écris ceci » fait chercher, et qui cherche recopie.

### (b) `uiLayerSeal` — l'étanchéité de `components/ui/`

**La propriété est vraie aujourd'hui**, vérifiée le 18/08/2026 : le socle n'importe aucun composant
métier, aucune requête en valeur, aucune action ; et il n'existe aucun import croisé entre
`components/products/` et `components/projects/`. **Rien ne la retient.** Or c'est elle qui fait
tenir la couche — davantage que le nom des dossiers, et c'est l'argument sur lequel la doctrine a
écarté la taxonomie de l'atomic design. Une frontière qu'on dit vérifiable doit être vérifiée.

`@typescript-eslint/no-restricted-imports` (déjà résolvable : le greffon est présent via
`eslint-config-next`), appliqué à `components/ui/**`, avec **`allowTypeImports: true`** :

- `@/lib/queries/*` — interdit **en valeur**, autorisé **en type**. L'unique usage légitime est
  `components/ui/status-dot.tsx:13`, qui importe `ProjectStatusNature` pour rendre
  `STATUS_PILL: Record<ProjectStatusNature, string>` **exhaustif à la compilation** : c'est un
  bénéfice, pas une entorse, et le retirer coûterait la garantie.
- `@/components/{products,projects,team}/*` — interdit, sans exception.
- `@/app/*` — interdit : une action serveur n'entre pas dans le socle.

### (c) `npm run lint` finit à zéro

`--max-warnings=0` sur le script `lint`. La raison est au journal du 18/08/2026, et le dépôt vient
d'en faire la démonstration contre lui-même : **l'unique avertissement du dépôt est un vrai défaut** —
la prop `note` morte de `section.tsx`, présente depuis T2.3 et lue par personne, restée à côté des
quatre faux positifs que `underscoreIsIntentional` avait été écrite pour taire. Un avertissement
permanent est un avertissement qu'on cesse de lire.

**Ce point dépend de TD.4**, qui décide du sort de la prop. Il ne s'écrit pas avant.

**Validation**

- **La règle se met en défaut dans les deux sens, et les deux mesures se rapportent.** Pour chaque
  signature gardée : poser un témoin dans un fichier propre, voir tomber **cette** signature et elle
  seule ; puis poser un témoin **proche mais légitime**, vérifier qu'il ne tombe pas. La première
  mesure prouve que la règle mord, la seconde qu'elle ne mord pas trop — sans les deux, on ne sait
  rien. Les témoins sont retirés après mesure.
- Pour (b) : ajouter dans un fichier de `components/ui/` un import de valeur depuis
  `@/lib/queries/projects`, le voir refusé ; le repasser en `import type`, le voir accepté.
- `npm run lint` finit à **zéro**, avertissements compris, sur le dépôt entier.
- `npx tsc --noEmit` propre. Les 23 fichiers de test **verts sans modification**.
- **Diff HTML strictement vide** sur les six écrans : ce ticket ne touche aucun rendu.

**Ce que ce ticket ne fait pas, et qu'il ne faut pas croire acquis** — La règle garde **les
signatures qu'elle connaît**. Un composant inventé demain avec une chaîne neuve ne sera pas rattrapé :
c'est un **cliquet sur la duplication constatée**, pas une preuve de cohérence. Ce qui montrerait
l'inventaire d'un coup d'œil est la page de catalogue `/dev/design`, notée au journal **sans ticket** :
ouvrir une route est une décision d'architecture, pas une factorisation, et elle ne se prend pas au
détour d'un garde-fou.

**Interdits** — **Ne pas garder une signature sans logement.** Card, Table, Tabs, Callout n'existent
pas dans le socle et n'ont pas à y entrer ici (règle 3) : une règle qui interdit sans offrir est une
règle qu'on désactive. **Ne pas étendre `socleLock` aux couleurs** — elles sont déjà structurellement
protégées par `--color-*: initial`, et une règle redondante est une règle qu'on cesse de lire. Ne pas
toucher à `tokens.css`, `globals.css`, ni à un composant. Ne pas créer `/dev/design`. **Ne pas ajouter
de dépendance** : tout le mécanisme tient dans ESLint et le greffon déjà présent.
