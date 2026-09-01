# ETAT — Vision

Fichier de contexte de session. Mis à jour par Claude en fin de chaque ticket.

**Dernière mise à jour :** 01/09/2026, après les repères sur l'axe de la North Star.
Dernier balayage : découpage de C7. **Le fichier dépasse les 250 lignes de la règle 5 — 553 au
31/08/2026, 642 après le mode de planification, 660 après le dispositif de mesure** ; le balayage
appartient à la session de découpage de C8. **674 après les repères.**
**Chantier en cours :** **C7 — Finitions**, dix tickets, découpés dans `tickets-C7.md`. **Dernier
chantier du POC** — `docs/05` §5 n'en a pas de huitième.
**Ticket suivant :** **T7.7 — Accessibilité : clavier, focus, contraste, titres.**
**À vérifier par l'humain :** `npm run db:migrate` a tourné sur la base de développement le
01/09/2026 pour appliquer la `0013`, et a **rattrapé au passage la `0010` et la `0012`** — dont la
seconde est destructive. Le point ouvert qui les attendait est refermé, sa condition de perte étant
réputée vide (`HISTORIQUE-TICKETS.md`). Le geste n'avait pas été redemandé.

---

## Avancement

| Chantier | Tickets | État |
|---|---|---|
| C1 — Socle technique | T1.1 → T1.6 | **terminé** |
| C2 — Produits et projets | T2.1 → T2.6 | **terminé** |
| C3 — Activités et roadmap | T3.1 → T3.6 | **terminé** |
| C4 — Ressources et résultats | T4.1 → T4.4 | **terminé** |
| C4bis — Archivage et correction | T4bis.1 → T4bis.6 | **terminé** |
| C5 — Indicateurs et lecture dans le temps | T5.1 → T5.6 | **terminé** |
| TD — Dette technique et couche de présentation | TD.1 → TD.6 | **terminé** |
| C5bis — Équipe | T5bis.1 → T5bis.7 | **terminé** |
| C6 — Liens et journal | T6.1 → T6.7 | **terminé** |
| C7 — Finitions | T7.1 → T7.10 | **en cours** — T7.1 → T7.6 livrés |
| C8 — après le POC | **à découper** | à faire |

---

## Journal des tickets

*(une ligne par **chantier clos**, et une par ticket du chantier en cours. Le récit détaillé vit
dans `HISTORIQUE-TICKETS.md` ; les pièges et dettes dans `JOURNAL-TECHNIQUE.md`.)*

- **C1 — Socle technique — T1.1 → T1.6, du 11 au 12/08/2026.** Projet, schéma, couche d'accès
  scopée, contexte de session, référentiels, coquille applicative. Rien de visible, tout le reste en
  dépend.
- **C2 — Produits et projets — T2.1 → T2.6, du 12 au 13/08/2026.** Les quatre écrans de lecture et
  les deux formulaires. Premier incrément démontrable.
- **C3 — Activités et roadmap — T3.1 → T3.6, le 13/08/2026.** Roadmap, panneau latéral, création,
  correction, cycle de vie, participants. Clôt le POC minimal démontrable.
- **C4 — Ressources et résultats — T4.1 → T4.4, du 13 au 14/08/2026.** Le bloc « Ressources », le
  geste qui relie, le résultat sur l'entrée de roadmap, sa saisie déclarative. Ferme la boucle
  minimale de `docs/05` §2.
- **C4bis — Archivage et correction — T4bis.1 → T4bis.6, du 14 au 15/08/2026.** La matrice
  « corriger / archiver » est pleine, un seul `canWrite` fait tomber sept gestes ensemble, et
  l'unicité **partielle** du résultat fait de « retirer puis ressaisir » un chemin réel.
- **C5 — Indicateurs et lecture dans le temps — T5.1 → T5.6, du 16 au 17/08/2026.** L'indicateur, le
  relevé, l'adoption, les deux couches de la frise du temps long. **Tout a depuis été refait hors
  ticket** (17/08), et neuf dérogations documentaires en sont consignées au journal technique.
- **TD — Dette technique et couche de présentation — TD.1 → TD.6, du 17 au 19/08/2026.** Six tickets
  **hors chantier** : le socle des panneaux (**−644 lignes nettes**), leur ouverture côté client, le
  bouton, puis les garde-fous ESLint — `spacingScaleLock`, `socleLock`, `uiLayerSeal`,
  `--max-warnings=0`.
- **C5bis — Équipe — T5bis.1 → T5bis.7, du 17 au 25/08/2026.** Le chantier que `docs/05` §5 n'avait
  pas prévu, intercalé sans décaler C6 ni C7 : trois tables, l'entrée « Équipe », cinq filtres d'URL,
  la fiche en panneau, le radar, six gestes d'écriture, et la sélection d'équipe qui **puise** enfin
  dans le référentiel.
- **C6 — Liens et journal — T6.1 → T6.7, du 26 au 27/08/2026.** `events` reçoit sa première ligne
  après six chantiers au schéma : `record()` seizième entrée de `forDomain`, cinq verbes, six
  `target_type`, dix-neuf points d'appel. Puis le bloc « Journal », les quatre règles de lien déduit
  **en SQL**, les liens déclarés, et la vue d'ensemble entière. **Aucune migration**, comme annoncé.
- **T7.1 — le budget, le 28/08/2026.** `budgets` reçoit sa première ligne après sept chantiers au
  schéma : **plus aucun bloc de `docs/06` §5 n'est une annonce**, `REFERENCE_BLOCKS` disparaît avec
  le dernier. Neuvième clé d'URL, décompte d'exclusivité inchangé pour la **septième** fois. Ni
  migration ni ligne de journal (arbitrage (d)) ; 45 tests neufs.
- **T7.2 — entité et métier, le 28/08/2026.** Les quatre filtres de `docs/06` §4 et les trois
  dimensions de sa répartition : le filtre d'abord, le chiffre ensuite — l'ordre qu'imposait T6.7.
  **Contrat mesuré sur seize valeurs, dont sept à zéro** — suivre le lien rend le nombre annoncé.
  Ni migration ni journal ; 18 tests neufs, sept neutralisations.
- **Suppression définitive et disponibilité déduite — hors ticket, 28/08/2026.** Quatre écarts
  rendus par l'humain : `F1-D3` et la règle 4 sur `projects`, la règle 4 sur `persons`, l'arbitrage
  (g) de C7, et D39. `DeletableTable` passe d'une table à trois, **et les trois n'ont pas la même
  barrière** — `projects` n'en a aucune. La disponibilité quitte la base pour `lib/availability.ts`
  (migration `0010`, première destructive depuis `0001`), et sa base est **corrigée le jour même** :
  un accompagnement **terminé** ne pèse plus. 23 tests neufs, sept neutralisations, et un **500
  trouvé par le HTML servi** que ni `tsc`, ni ESLint, ni 1 226 tests n'avaient vu.
- **Reprise d'interface hors ticket — vingt-quatre gestes, du 17 au 28/08/2026.** Menu « … » de la
  roadmap, « Vision produit » et sa reprise `northstar-v2`, « Personae », « Use Cases »,
  « Démarrage » (migrations 0005 à 0008), page projet en `project-v2`, bouton à trois rangs, entités
  en `/administration`, hiérarchie de la page produit, puis, le 28/08, **deux blocs de la page
  projet qui s'effacent** : « Projets liés » entièrement, « Démarrage » dès la première activité.
- **Page produit — reprise d'ergonomie, hors ticket, 28/08/2026.** Sept gestes tirés d'un diagnostic
  d'écran : une **ligne de faits** en tête (décompte + étendue couverte, `formatCoverage`),
  **l'écart d'en-tête du 18/08 refermé** — `BlockHeader` partout, vision à 24 px, le rythme rendu au
  `gap-5` —, **« Indicateurs » sorti du repli** en bloc à part entière, la frise **resserrée de 352
  à 264 px** avec sa période passée sur le tracé, la fenêtre **« Tout » à l'ouverture** (l'horloge
  n'est plus lue), les **use cases en grille**, et les gestes d'ajout en **boutons d'en-tête**.
  Ni migration ni journal ; 6 tests neufs, deux neutralisations. **La barre d'ancres a été refusée**
  — la page reste sans repère de position, dette au journal technique.
- **La sélection d'une personne devient une recherche — hors ticket, 29/08/2026.** L'équipe du
  formulaire de projet et les participants du panneau d'activité cessent de rendre le référentiel
  entier : `Picker` (socle, neuf) et une règle pure dans `lib/forms/picker.ts`. **Amélioration
  progressive mesurée, pas affirmée** — le `<form>` servi de `/projets/nouveau` est identique avant
  et après, 21 042 octets contre 21 042, et le panneau d'activité n'a qu'une ligne d'écart. Un
  interdit de fiche de T5bis.7 levé sur demande, D32 tenue. Ni migration, ni requête, ni action, ni
  droit ; 21 tests neufs, cinq neutralisations, et **une couverture annoncée qui n'existait pas** —
  le `team:` forgé hors domaine — écrite plutôt qu'affirmée.
- **Page projet — reprise d'ergonomie, direction B, hors ticket, 28/08/2026.** Huit gestes tirés du
  canevas de maquettes qui a porté le diagnostic (douze frictions) et trois directions : **la fiche
  d'identité passe à droite, tout le récit à gauche**. L'en-tête perd sa carte pour un `PageHeader`
  nu, `identity.tsx` reçoit les six champs et le rang « Budget », `Budget` cesse d'être un bloc
  (**deuxième écart à la liste close de `docs/06` §5**), le journal sort de son `<details>`, et
  **l'ordre du rail se corrige** — il rendait les indicateurs avant les ressources sous un
  commentaire qui affirmait le contraire. Ni migration, ni lecture, ni action, ni droit : le diff ne
  déplace que du rendu. **Aucun test neuf — et c'est une révision** : la ligne de faits prévue au
  plan est tombée sur un interdit documenté de `lib/format.ts`. 1 233 tests, inchangés.
- **Formulaire de projet — reprise d'ergonomie, direction A, hors ticket, 29/08/2026.** Sept gestes
  tirés d'un canevas de maquettes (douze frictions, trois directions) : les neuf champs à plat
  passent en **quatre `Section`**, dont le titre de 20 px ne se confond plus avec un intitulé de
  champ de 10 px — c'était le défaut, et il tombe **sans qu'un libellé de champ bouge** ; les trois
  champs obligatoires le disent enfin (`required`, écrit depuis TD.1 et jamais passé) ; les cases des
  deux référentiels deviennent des pastilles de 44 px dont l'état coché est en `has-checked:`, donc
  en CSS et non calculé au rendu ; le pied prend le filet de `panel.tsx` et « Annuler » passe au rang
  secondaire ; `objective` et `sponsor` reçoivent l'`aria-invalid` que sept champs sur neuf avaient.
  Ni migration, ni requête, ni action, ni droit — **aucun `name` ni aucune valeur ne bouge**, et
  l'ordre de tabulation de T2.6 est servi à l'identique. **Aucun test neuf, et c'est délibéré** : le
  contrat de saisie est inchangé, les 1 254 tests existants le prouvent. Le refus a été **frappé en
  HTTP sans JavaScript**, et son rendu lu dans le HTML servi.
- **Vue d'ensemble — reprise d'ergonomie, direction B, hors ticket, 29/08/2026.** Cinq gestes tirés
  d'un canevas de maquettes (douze frictions, trois directions) : **la répartition passe dans un rail
  de 320 px**, le récit garde la colonne de lecture, et le flux **ferme** l'écran là où il l'ouvrait.
  La mesure a mené la reprise — retirer « Accès direct » ne rendait que 235 px sur ≈ 2 830, la
  hauteur étant portée par les deux listes : **la largeur était le seul levier**, et le chiffre de la
  répartition, séparé de son libellé de **1 104 px**, est passé devant lui. Les deux décomptes
  d'« Accès direct » remontent en ligne de faits — `PageHeader.facts`, écrite le 28/08 et **sans
  aucun appelant dans le dépôt**. **Deux écarts à `docs/06` §3**, assumés : l'ordre des blocs, et le
  quatrième qui n'est plus rendu. **La surface de survol prévue au plan a été retirée sur mesure** —
  1,05:1, invisible. Ni migration, ni requête, ni action, ni droit ; **aucun test neuf, et c'est une
  révision** : le diff ne déplace que du rendu. **Le contrat des seize chiffres a été éprouvé lien
  par lien**, et la sonde mise en défaut avant d'être crue. 1 254 tests, inchangés.
- **Une seule cible par indicateur, portée par le produit — hors ticket, 29/08/2026.** Le second lieu
  de vérité assumé le 17/08/2026 est **refermé** : `project_indicators.target_value` et `final_value`
  sont supprimées (migration `0011`, avec reprise des cibles d'adoption vers l'indicateur quand
  toutes s'accordent), la cible vit sur `indicators` et se saisit sur la page produit, et toute
  adoption la lit — `productTargetValue`, une ligne de `select` qui change de table dans une jointure
  déjà là, **aucune requête de plus**. Le panneau d'adoption tombe de quatre champs à deux ;
  `baseline_value` reste, seule des trois à dire ce que le produit ne dit pas. La courbe perd les
  traits d'adoption et le dédoublonnage que le 17/08 avait dû ajouter. **Écart assumé à `docs/02` §4
  et §5 et à `docs/04` §3**, consigné ; aucune décision de `docs/07` n'est rouverte. Trois tests
  neufs, **deux mises en défaut** (la cible neutralisée fait tomber deux tests et rien d'autre ; la
  lecture nominative rétablie en fait tomber quatre, tous de `readAdoptionForm`), et **le droit
  éprouvé par un POST forgé** portant les deux champs supprimés : la ligne écrite ne porte que sa
  référence. 1 257 tests.
- **T7.3 — l'administration devient multi-référentielle, le 30/08/2026.** L'écran passe **d'un
  référentiel sur neuf à cinq** : une clé `referentiel` choisit la table, `entite` cède la place à
  `ligne`, et **aucune adresse servie depuis le 21/08 ne casse** — l'absence de clé vaut « entités »,
  et une valeur inconnue y retombe. La lecture est générique et l'écriture ne l'est pas : **une
  requête paramétrée par la table, seize actions qui nomment la leur**. Le décompte d'opposition est
  **recompté par l'action**, jamais seulement annoncé. Deux défauts trouvés par les disciplines et
  non par les tests : les sous-requêtes corrélées **perdaient leur qualification de table** dans la
  position de sélection de Drizzle — un 500, pas un mauvais nombre —, et la colonne de l'échelle
  **disait « 15 personnes » là où le centre en compte dix**, le décompte étant des déclarations ; le
  second a été **lu dans le HTML servi**, et il a coûté un champ de plus à `ReferentialUsage`. Ni
  migration ni journal (arbitrages (a) et (d)) ; **64 tests neufs**, six neutralisations, et le droit
  frappé en HTTP sans JavaScript — dont un rétablissement refusé qui rend **200**, comme celui qui
  réussit.
- **T7.4 — les quatre référentiels porteurs de logique, le 30/08/2026.** L'écran passe de **cinq
  référentiels sur neuf à neuf sur neuf**, et **D25 est tenue entière** — sans une clé d'URL de plus,
  sans une route de plus. Ce qui sépare ces quatre-là est la **logique** : la `nature` d'un statut et
  la `family` d'un type se rétrécissent sur leur énuméré **avant** l'écriture, si bien qu'une valeur
  forgée à `archived` (D42) n'atteint jamais la base. Quatre modules de formulaire, quatre panneaux,
  **et le socle de T7.3 inchangé** — l'étendre d'un drapeau par colonne en aurait fait la phrase à
  trous que le dépôt refuse depuis T5.1. Deux écarts au tableau de la fiche, imposés par le schéma :
  `tools` **n'a pas de `position`** et nomme son libellé `name`. Un type qui **s'effondre** en
  chemin — `find` sur une union de huit tables ne rend que leurs colonnes communes —, et la sortie
  n'a pas été un `as` mais une lecture par table plus un `in`. Ni migration, ni dépendance, ni
  journal ; **81 tests neufs** (1 321 → 1 402), neuf neutralisations et **neuf chutes isolées** — dont trois
  cascades trouvées et corrigées avant d'être crues. Le contrat des décomptes **mesuré en SQL hors de
  la lecture du ticket**, et les quatre états vides **nommés comme non vus rendus**.
- **T7.5 — la coquille : la carte de la personne courante, et la barre d'ancres, le 30/08/2026.**
  Les **deux** blocs que T1.6 avait écartés sont désormais rendus, et la barre d'ancres retrouve son
  appelant après **dix jours**. Ce que ces dix jours ont appris tient dans le geste : `subnav.tsx`
  portait **quatre ancres en dur**, et **trois de ses quatre cibles ont changé de statut sans qu'une
  ligne du composant bouge** — la liste se construit donc dans `page.tsx`, depuis `hasActivity`, la
  variable même qui décide du bloc « Démarrage ». **La sonde a été mise en défaut avant le code, et
  c'est elle qui était fausse** : elle a répondu « aucune barre » sur les cinq accompagnements, le
  motif cherchant une apostrophe que React sert en `&#x27;` — cinq faux négatifs concordants ne
  valent pas une confirmation. Contrat vérifié ensuite ancre par ancre, la quatrième **vue rendue**
  par neutralisation de `hasActivity`, et l'`id` de « Ressources » retiré fait tomber **son ancre
  seule**. La carte n'a **ni fond ni pastille**, et les deux refus sont mesurés (1,03:1 pour le
  voile de la maquette, 1,92:1 pour l'avatar) ; ses deux couples de texte donnent 13,65:1 et 7,82:1.
  **Cinq énoncés faux corrigés là où la fiche en nommait trois**, dont un **servi dans le HTML** —
  écart d'une ligne à « commentaires seuls », assumé. Ni migration, ni requête, ni action, ni droit ;
  **aucun test neuf, et c'est le régime des reprises de rendu** — 1 402 tests, inchangés.
- **T7.6 — petits écrans, le 30/08/2026.** Le produit n'avait jamais été mesuré hors du bureau, et
  la mesure a nommé le défaut avant le code : **19 formes de page sur 31 en défaut à 375 px**, 6 à
  768, aucune à 1440 — et sur `/administration`, **26 boutons « Options de… » de 270 à 382 px hors de
  la carte qui les rogne**, c'est-à-dire *modifier*, *archiver* et *rétablir* présents dans le HTML
  et inatteignables à l'écran. Les colonnes des quatre listes cèdent sous `xl`, les gouttières sous
  `md`, la frise défile **dans son conteneur** (720 px de tracé dans 390) et deux planchers cessent
  de s'imposer quand ils dépassent la place. **Le repli du socle n'atteignait pas `/equipe`** : un
  `DrawerLink` en `flex` s'interpose entre `ListRow` et ses colonnes, si bien que la chaîne est
  exportée (`LIST_ROW_FLEX`) plutôt que recopiée. **Trois fichiers du périmètre n'ont rien reçu** —
  `page.tsx`, `panel.tsx`, `drawer.tsx` —, le tiroir rendant déjà 375 px dans une fenêtre de 375 ;
  deux fichiers hors périmètre ont été touchés, la coquille et la frise. **Sonde mise en défaut par
  remisage du ticket entier**, une neutralisation partielle ayant fait croire l'administration saine.
  Le HTML servi est identique à toute largeur — **1 385 nœuds, aucune différence** —, et le dépôt ne
  porte qu'**un seul** `hidden` responsive, sur un bandeau `aria-hidden`. Ni migration, ni requête,
  ni action, ni droit ; **1 402 tests, inchangés**.
- **Le journal de la fiche accompagnement est de nouveau replié — hors ticket, 29/08/2026.** Demande
  de l'humain : c'est une partie secondaire, dont le détail n'a pas à se lire au premier niveau. Le
  `<details>` retiré le 28/08 est rétabli dans la forme de T6.3 — `SectionHeader as="summary"` et sa
  `mark`, socle inchangé —, la `note` du 28/08 restant sur le `<summary>`, où elle justifie le repli
  avant qu'on ouvre. **L'écart à `docs/06` §5 consigné le 28/08 est refermé**, et son entrée récrite
  sur place : « son contenu tient en quatre lignes » mesurait un journal vide, or `events` est la
  seule table de la page sans borne haute. Un seul fichier touché, aucun test ne portait sur le
  repli. Vérifié dans le HTML servi : `<details>` **sans `open`**, et le `<ol>` des événements
  présent dans le document malgré le repli. 1 257 tests, inchangés.
- **La barre d'ancres de la page accompagnement est retirée — hors ticket, 31/08/2026.** Demande de
  l'humain, **au lendemain de T7.5 qui l'avait ramenée au rendu** : la page se lit d'une traite, et
  le sommaire n'y gagnait pas sa place. Le geste est celui des retraits du 28/08 — **on retire
  l'appelant, on ne supprime rien** : `subnav.tsx` reste entier et sans appelant, comme
  `related.tsx`, et une ligne le remet au rendu. **Les `id` de section ne bougent pas** —
  `#activites`, `#ressources`, `#indicateurs`, `#demarrage` restent des cibles de fragment qu'on
  partage, avec le `scroll-mt-19` de `Section` et le `scroll-behavior: smooth` qui les servent ;
  trois choses inertes, cette fois **choisies et nommées** au journal technique. Aucun écart
  documentaire : `docs/06` ne prescrit nulle part de barre de sous-navigation, elle venait de la
  maquette. Un seul fichier de rendu touché, trois commentaires ailleurs, aucun test ne portait sur
  la barre. **Sonde mise en défaut par le couple avant/après** : `aria-label="Sections` — sans
  l'apostrophe, que React sert `&#x27;` — rend **1 sur les sept accompagnements avant, 0 après**, et
  le HTML servi ne diffère que des **treize lignes du `<nav>`**. La branche « sans activité »,
  forcée par neutralisation de `hasActivity`, rend son `id="demarrage"` sans barre. 1 402 tests,
  inchangés.
- **Vue d'ensemble : les terminés sortent des dormants, le flux se replie à dix — hors ticket,
  31/08/2026.** Deux demandes de l'humain sur le même écran. **(1)** Un accompagnement dont le
  statut est de nature `done` ne remonte plus dans « Projets sans activité récente » : son silence
  n'est pas un endormissement, c'est ce que son statut annonce. La clause vit dans
  `listStaleProjects`, sur la **nature** et jamais sur le libellé, avec la jointure filtrée qu'elle
  exige — l'exclusion de `listTeam`, écrite de la même façon. **(2)** « Activité récente » ne pose
  d'emblée que ses **dix** lignes les plus récentes ; les suivantes attendent dans un `<details>`
  que « Voir plus » ouvre. **Ce n'est pas une pagination** — les quinze événements sont dans le
  document servi —, et **le libellé ne porte aucun nombre** : ce que la fiche T6.6 interdit est le
  décompte, et il n'est pas écrit. Deux commentaires du dépôt disaient « ni voir plus » ; ils sont
  récrits, l'écart est au journal. **Trois tests neufs** (1 402 → 1 405), **deux neutralisations,
  deux chutes isolées**. Critère lu dans le HTML servi : les dormants passent de **4 à 2** — les
  deux terminés, et eux seuls, quittent la liste — et le flux rend **10 + 5** lignes avec
  `start="11"`, le repli disparaissant quand il ne cache rien. **Un écart trouvé et non corrigé** :
  `countProjects` et la répartition par entité ne rejouent pas la jointure de statut de
  `listProjects`.
- **Équipe — reprise d'ergonomie, direction B, hors ticket, 31/08/2026.** Sept gestes tirés d'un
  canevas de maquettes (**dix-sept frictions**, trois directions) sur le dernier écran jamais repris,
  et **le seul écran majeur conçu sans maquette de référence** : les cinq filtres passent dans un
  rail collant de 320 px, les onze cases de 16 px deviennent des pastilles de **47 px** mesurées —
  puis, à la demande, des pastilles **sans case visible** puis au calibre `xs`, ce qui fait tomber le
  rail de 988 à **814 px** et lui retire la hauteur de la page —,
  `PageHeader.facts` trouve son appelant, le métier descend sous le nom avec « côté entité » — la
  formulation exacte de `PersonDetailHeader` —, et la colonne des compétences se borne à deux
  étiquettes — au calibre `xs` que `Tag` reçoit ce jour-là, **27 px de haut ramenés à 23** —, et le
  retrait des filtres rejoint le pied du rail, avec les contrôles qu'il vide. **Un énoncé faux
  corrigé en chemin** : le « plancher de 44 px » n'est écrit ni dans `docs/06` §11 ni dans aucune
  fiche — c'est WCAG 2.5.5, niveau **AAA**, quand le seuil **AA** est 24 px.
  `CHECKBOX_CHIP` est **extraite du formulaire de projet, qui avait écrit sa propre
  condition d'extraction**, et son `<form>` servi est **identique à l'octet près** — 28 043 contre
  28 043, même `sha1`. Le résultat est mesuré au pixel : l'amplitude de hauteur de ligne tombe de
  **61 → 163 px à 72 → 84**, huit lignes sur dix à 84, et la liste raccourcit de 335 px. **Deux
  défauts trouvés par le rendu et non par le HTML servi** — « +N » orphelin sur un troisième rang,
  chevron orphelin sous `xl` —, et **un troisième par la mesure** : le chevron à 2,22:1, sous le
  seuil de 3:1 d'un composant, rétabli à 4,98. Sonde mise en défaut. Ni migration, ni action, ni
  droit ; **aucun test neuf, régime des reprises de rendu** — 1 405 tests, inchangés. **Un écart sur
  un interdit écrit** : « +3 » est un décompte de compétences sur une ligne.
- **La période d'un accompagnement se déduit de ses activités — hors ticket, 31/08/2026.** Demande
  de l'humain : la double saisie est fermée, `projects.started_on` et `expected_end_on` supprimées
  (migration `0012`), et **une seule source de vérité reste, les activités**. La règle vit une fois
  — `min(coalesce(period_start, period_end))` / `max(coalesce(period_end, period_start))` sur les
  activités ni archivées ni annulées — et **cinq lectures la joignent**, en sous-requête groupée et
  non corrélée : le 500 de T7.3 disait où était le piège. **Le geste a été mesuré avant d'être
  écrit** : sur les **sept** accompagnements de la base, **un seul** portait une période qui
  s'accordait avec ses propres activités. Les `planned` comptent ici quand `last_activity_at` les
  exclut, et les deux ont raison — l'une dit l'étendue, l'autre la fraîcheur. Deux formulaires
  perdent leur section « Période » ; deux branches de `formatPeriod` deviennent inatteignables et
  restent écrites. **Cinq neutralisations, cinq chutes isolées**, après **une cascade trouvée et
  refermée** — la fixture a reçu deux bornes de chronologie hors de portée, et le test de rang ne lit
  plus de date mais un miroir. Droit **frappé en HTTP sans JavaScript** avec les deux champs forgés :
  303, et les colonnes inchangées, `updated_at` faisant l'étape témoin. Onze tests neufs, sept
  retirés (1 405 → 1 409). **Trois écarts documentaires**, aucune décision rouverte — `docs/07` n'a
  jamais tranché ces deux colonnes.
- **Le mode de planification d'une activité — hors ticket, 31/08/2026.** Demande de l'humain, dans
  la foulée : puisque les activités portent seules les dates, leur saisie devait se comprendre sans
  hésitation. La case « à planifier » et les deux champs cohabitaient à l'écran ; **trois modes
  exclusifs** les remplacent — à planifier · période · date précise —, et les champs apparaissent
  sous l'option choisie. **Le masquage est en CSS pur** (`hidden group-has-checked:flex`), donc le
  panneau **ne gagne aucun état React** : ce fichier affirmait depuis T3.3 que « sans JavaScript, un
  champ ne disparaît pas », et l'énoncé est retourné — `:has()` était déjà employé deux fichiers plus
  loin. **La variante a été cherchée dans la feuille servie** : une variante qui ne compile pas ne
  rend aucune erreur, elle rend un champ toujours visible. **Deux refus deviennent impossibles** au
  lieu d'être assouplis, et le principe qui les fondait est déplacé, pas abandonné. Une date précise
  est une **période d'un jour** — ni migration ni colonne —, le mode se **déduit** à la réouverture,
  et elle **se lit au jour** : troisième entorse bornée à D13, avec l'argument que `lib/format.ts`
  écrit déjà deux fois. Deux activités du même mois se lisent différemment sur le même écran.
  **Cinq neutralisations, cinq chutes maîtrisées**, et **un test qui passait pour la mauvaise raison
  trouvé par l'une d'elles**. Droit frappé en HTTP sans JavaScript **trois fois**, `updated_at` en
  étape témoin ; six couples mesurés, aucune teinte de sélection. **25 tests neufs** (1 409 → 1 434),
  dont le premier `describe` de `formatActivityPeriod`.
- **Le dispositif de mesure — hors ticket, 01/09/2026.** Demande de l'humain, précédée d'une session
  de design : les Web Analysts ne pouvaient savoir quels produits portent un tracking ni un plan de
  taggage sans ouvrir chaque fiche. **Deux tables neuves** — `product_trackings`, `tagging_plans` —,
  migration `0013` additive, et **pas une colonne touchée sur les tables existantes** : le
  `short_label` de `tools` a été retiré de la proposition avec la colonne « Outils » de la liste,
  faute de lecteur. **Aucun bloc de plus** : le dispositif entre en **rang nommé** au pied du bloc
  « Indicateurs », qui était plat, et l'architecture d'information tient en trois tailles distinctes
  — 20 px le bloc, 12 px capitales le rang, 10 px capitales les légendes. Seule la **note** du bloc
  s'élargit ; son en-tête, son bouton et sa grille ne bougent pas. **Une seule colonne** sur la liste
  des produits, « Plan de taggage », et **aucun filtre** — l'arbitrage de la session. **Tous les
  états sont déclarés, aucun n'est calculé** : c'est ce qui rend « À revoir » compatible avec les
  interdits d'interface, là où un écart de dates aurait produit un badge de retard. Deux clés d'URL
  de plus (dix et onze), **décompte d'exclusivité inchangé pour la huitième fois**. Le socle gagne
  `TonePill` et un ton `warning` — 7,64:1 mesuré —, et `BlockDivider` un `action`. **Quatorze
  neutralisations, quatorze chutes exactes** ; droit éprouvé par les cinq actions, sur un membre non
  contributeur et sur un produit archivé. **90 tests neufs** (1 434 → 1 524).
- **Les repères sur l'axe de la North Star — hors ticket, 01/09/2026.** Les accompagnements réalisés
  paraissent sur la courbe : **six marques de 8 px sur sa ligne du bas**, et **pas un pixel de
  hauteur en plus** — la liste, la fiche et la saisie vivent derrière deux entrées du menu du bloc,
  dans trois panneaux. `listProductMilestones` s'élargit à **toutes** les activités terminées et
  devient `listAccompanimentMarkers` : c'est la **jointure gauche** sur `results` qui porte la
  décision. `context_markers` est la table neuve (migration **0014**, l'arbitrage (a) de C7 rompu une
  seconde fois), et la ligne morte de la frise — `SHOW_MILESTONES`, éteinte depuis le 17/08 — est
  **supprimée** plutôt que doublée. Trois clés d'URL de plus (douze, treize et quatorze), **décompte
  d'exclusivité inchangé pour la neuvième fois**. **Onze neutralisations, onze chutes exactes** ;
  droit éprouvé par les trois actions, dont la soumission forgée qui rattache un accompagnement d'un
  autre produit. **58 tests neufs** (1 524 → 1 582).

---

## Points ouverts

*(un point, une destination. Un point sans destination est un point qu'on n'a pas tranché. Un point
qui se referme part dans `HISTORIQUE-TICKETS.md` — il ne reste pas barré ici. Chacun garde son fait
et sa destination ; le détail vit dans `JOURNAL-TECHNIQUE.md`.)*

### a. À trancher — sinon les tickets suivants héritent du problème

- **Cinq points ont perdu leur chantier quand C7 s'est découpé, et C8 les reprend** : le **SSO**
  (D37), les **sept objets non journalisés** promis à C7 par la fiche de C6, les **six clés
  naturelles** de l'amorçage, la **carte qui ne se détache d'aucun fond** et le **filtre de roadmap
  dans l'URL**. `docs/05` §5 s'arrête à sept chantiers : **C8 est hors POC et reste entièrement à
  découper.** → **session de découpage de C8.**

- **Les secrets Neon n'ont jamais été tournés.** Deux chaînes ont transité en clair le 12/08/2026.
  Hors dépôt — `.env.local` seul —, mais valides. **Reportées deux fois** : au découpage de C6, puis
  à celui de C7, qui n'en dépendaient ni l'un ni l'autre. → **action humaine.**
- **Le SSO Entra ID est sorti de C7**, faute d'inscription d'application — décision humaine du
  27/08/2026, **écart à D37** consigné au journal technique. Le stub reste, `/dev/session` reste, et
  `lib/auth/provider.ts` attend toujours son seul réécrivain. Ce qui manque n'est pas du code : un
  tenant, un client, un secret, une URI de redirection. → **action humaine, puis C8.**

### b. Assignés à un ticket

- **Un test de `lib/queries/activities.test.ts` est intermittent, et sa cause est inconnue.**
  « Sans exception, un type archivé n'est proposé à personne » a échoué **une fois sur six**
  exécutions de la suite le 31/08/2026 ; il passe seul, et la suite entière repasse à 1 405/1 405.
  L'hypothèse d'une ligne restée archivée par une exécution interrompue a été **vérifiée et
  écartée** : le `beforeAll` crée un domaine neuf et les lectures sont scopées. Voisin, sans être
  le même, du point sur les deux fichiers de tests d'action qui nettoient sur
  `if (!f?.domainId) return`. → **au prochain qui ouvre ce fichier, sinon C8.**
- **« +N » sur une ligne d'`/equipe` est un décompte de compétences, et T5bis.2 l'interdit.** Posé
  le 31/08/2026 par la reprise de direction B, et **rendu visible sur les planches du canevas avant
  d'être écrit**. La fiche du ticket dit : « Aucun décompte de compétences sur une ligne, aucun
  niveau agrégé, aucun tri autre que le nom (garde-fous 2 et 3). » Ce que l'interdit visait est un
  nombre qui **qualifie** une personne ; « +3 » est une marque de troncature, la parenté du « Voir
  plus » de la vue d'ensemble. Mais deux lignes portant « +3 » et « +1 » se comparent, et c'est le
  geste que le garde-fou 2 existe pour empêcher. Le remplaçant coûte une ligne : une marque non
  chiffrée — « … » ou « et plus » — qui dit la suite sans la compter. → **arbitrage humain.**
- **`countProjects` et la répartition par entité ne rejouent pas la jointure de statut de leur
  liste.** Trouvé le 31/08/2026 par une ligne forgée : un projet du domaine posé sur un statut d'un
  autre domaine est écarté par `listProjects` — jointure interne filtrée — mais **compté** par les
  deux lectures ci-dessus, qui s'arrêtent au produit. Le contrat écrit dans `overview.ts` — *« chaque
  décompte rejoue les jointures de sa liste »* — est donc faux d'une jointure, et les deux constats
  d'égalité du test ne tiennent aujourd'hui que parce qu'aucune ligne de ce genre n'existe. Sans
  conséquence sur une base saine : c'est une étanchéité de second rang, pas une fuite entre domaines.
  → **C8.**
- **Deux colonnes de `docs/06` §4 manquent aux lignes de la liste transverse** — l'entité et les
  métiers, sur les sept énumérées. T7.2 a posé leurs **filtres**, pas leurs colonnes : son
  « Attendu » ne les nommait pas. Aucun ticket de C7 n'ouvre cet écran, T7.9 se l'interdit.
  → **C8.**
- **Deux comportements n'ont jamais été parcourus au navigateur.** Le **clic** de `/equipe` —
  l'adresse est lue dans le HTML servi, le clic non ; les cinq propriétés en attente sont celles de
  `DrawerHost`, éprouvées par TD.2 sur les deux autres pages hôtes. Et, depuis le 29/08, le **mode
  enrichi de `Picker`** : son repli est lu dans le HTML servi, son mode enrichi n'est éprouvé que
  par une **sonde de rendu serveur**. Restent à faire au clavier — la bascule au montage, `↓`/`↑`,
  `Entrée` qui retient sans soumettre, `Échap` qui ferme la liste **sans** fermer le tiroir, le clic
  extérieur, « Retirer ». → **T7.7.**
- **La cible de clic d'un repère fait 24 px, sous les 44 px d'usage tactile.** La marque visible en
  fait 8, posée sur la ligne du bas du tracé. L'agrandir **n'ajoute aucune hauteur** — la cible
  déborde déjà du tracé sans le pousser —, mais deux repères de mois voisins se recouvriraient : à
  vingt-deux mois d'axe sur 670 px, un mois vaut trente pixels. Poser un attribut ou une dimension
  d'accessibilité est le geste de T7.7, pas celui d'un ticket de fonctionnalité. → **T7.7.**
- **La frise du produit défile désormais dans son conteneur, et ce conteneur n'est pas atteignable
  au clavier.** T7.6 lui a donné `overflow-x-auto` — 720 px de tracé dans 390 à 768 px — sans
  `tabindex="0"` ni `role`/`aria-label` : poser un attribut d'accessibilité est le geste de T7.7, pas
  celui d'un ticket de mise en page, et les deux tickets se suivent. À la souris et au doigt le
  défilement fonctionne ; **au clavier seul, la fin de l'axe est hors d'atteinte**. C'est le seul
  conteneur défilant du dépôt. → **T7.7.**
- **La coquille de navigation reste focalisable derrière le voile, sans JavaScript.** La page porte
  `inert`, la barre latérale vit dans le layout, et **l'obstacle technique a disparu en TD.2** : ce
  qui reste est un parcours clavier à faire. → **T7.7.**
- **La liste close de `docs/06` §5 porte trois écarts, tous du 28/08/2026, hors ticket et à la
  demande.** « Projets liés » n'est plus rendu ; « Démarrage » ne l'est que sur un accompagnement
  sans activité ; et **« Budget » a cessé d'être un bloc** pour devenir un rang de la fiche
  d'identité. Cinq blocs énumérés, **trois rendus et un en rang**. Rien n'est supprimé : composants,
  requêtes, panneaux `?lien=`/`?piste=`/`?budget=` et actions restent entiers et testés, et
  « Projets liés » revient d'une dizaine de lignes. Ce qui reste à faire est **le point d'entrée
  annoncé de « Démarrage » — le geste d'ajout d'une activité**. → **C8.**
- **La liste de `docs/06` §3 porte deux écarts, du 29/08/2026, hors ticket et à la demande.**
  L'ordre des blocs, que le document dit non neutre, est changé : « Activité récente » **ferme**
  l'écran au lieu de l'ouvrir. Et **« Accès direct » n'est plus rendu** — quatre blocs énumérés,
  **trois rendus**. Rien n'est perdu : `countProjects` et `countProducts` gardent un lecteur dans la
  ligne de faits d'en-tête, avec leurs tests ; seul `shortcuts.tsx` est supprimé, et il ne portait
  que du rendu. Ce qui reste à trancher est **si le document suit ou si l'écart tient** — `docs/06`
  §3 est figé, et lui seul dit encore que le flux vient en premier. → **arbitrage humain, sinon C8.**
- **Deux frictions de l'écran d'accueil sont diagnostiquées et non refermées.** Les deux listes se
  rendent **ligne pour ligne de la même façon** — même `ol`, même `text-sm` puis
  `text-xs content-neutral-base` — et leurs titres partagent le mot « activité » pour deux objets
  sans rapport, `events` d'un côté, `activities` de l'autre (le piège de `docs/04` §4). Les refermer demanderait
  de changer soit la grammaire de ligne du flux, que `feed.tsx` argumente sur quinze lignes, soit
  deux titres qui viennent mot pour mot de `docs/06` §3. Aucune reprise d'ergonomie n'a ce droit
  seule. → **arbitrage humain.**
- **`/produits` n'affiche aucun compteur, là où `/projets` en affiche un.** Mesuré le 29/08/2026 en
  suivant les liens de la vue d'ensemble : `app/(app)/projets/page.tsx:184` rend
  `formatProjects(rows.length)`, la liste des produits ne rend rien d'équivalent — et le commentaire
  de `shortcuts.tsx`, supprimé le même jour, **affirmait le contraire**. La ligne de faits annonce
  donc « 5 produits » vers un écran qui rend bien cinq lignes mais ne dit pas son nombre. → **C8.**
- **La page projet ne consomme toujours pas la prop `facts` de `PageHeader`**, et ce n'est plus un
  oubli : le seul fait qu'on y écrirait est un décompte d'activités, que `lib/format.ts` interdit
  noir sur blanc hors du panneau de suppression — « nulle part ailleurs, et surtout pas sur un écran
  de lecture », la mesure d'activité de D39. Rouvrir demanderait de trancher **quel fait un
  accompagnement peut porter en tête**, ce qu'aucun document ne dit. → **arbitrage humain.**
- **Les quatre états vides de T7.4 n'ont pas été vus rendus.** Statuts, types d'activité, outils,
  pistes : la base de développement porte des lignes dans **les neuf** référentiels, et aucun chemin
  n'y mène sans supprimer de la donnée. Leurs textes sont écrits et leur code est celui de T7.3, lu
  dans le HTML servi le 30/08/2026 ; ce qui manque est la **lecture** — « un état vide qu'on n'a pas
  vu rendu n'a pas été vérifié ». → **T7.8**, qui revoit tous les états vides.
- **Le contenu rédigé d'`/a-propos` reste à écrire.** La page a son en-tête et son état vide ; son
  contenu ne demande aucune lecture en base (D36). → **T7.8.**
- **Deux colonnes saisies ne s'affichent nulle part** : `products.kind` (D10), lu par aucun écran ;
  `persons.kind` sur les deux lectures de projet, qui affichent tous les membres à l'identique.
  → **T7.9.**
- **`project_indicators.note` n'a ni écrivain ni lecteur.** Colonne posée en T1.2 ; le panneau
  d'adoption saisit deux champs depuis le 29/08/2026, pas un troisième. Ce qui manque n'est plus
  « une phrase sur le pourquoi d'une cible » — la cible a quitté l'adoption — mais **une phrase sur
  le pourquoi de cette adoption** : ce que cet accompagnement va chercher sur cet indicateur.
  → **T7.9.**
- **Corriger une personne du centre en intervenant côté entité lui laisse ses compétences.**
  `parsePersonForm` efface la disponibilité — le `CHECK` l'exige — mais rien d'équivalent n'existe
  pour `person_skills` : les liaisons restent affichées et **illisibles en écriture**. Aucune donnée
  perdue. → **T7.9.**
- **Quatre libellés vivent hors de `lib/format.ts`** : `PERSON_KIND_LABEL` (`lib/forms/person.ts`) —
  un déplacement **plus un vocabulaire à trancher**, T5bis.7 ayant refermé la duplication et pas les
  mots —, `BUDGET_UNIT_LABEL` (`components/projects/budget.tsx`), hors périmètre de T7.1,
  `AVAILABILITY_LABEL` (`components/team/availability-dot.tsx`) par la même raison, et depuis T7.5
  `ROLE_LABEL` (`components/shell/current-person.tsx`). **Le quatrième n'est pas une duplication** :
  `/dev/session` porte les deux mêmes rôles **en minuscules**, parce qu'il les glisse dans une
  phrase, quand la carte les pose seuls — ce sont deux libellés, et les replier demande de trancher
  lequel gagne. T7.4 en avait refermé un : `REFERENTIAL_NOUN` est allé dans `lib/format.ts`, et
  `FAMILY_LABEL` a **quitté** `components/projects/activity-panel.tsx` pour y devenir
  `formatActivityFamily`. → **T7.9.**
- **Une piste de démarrage ne mène pas à l'activité qu'elle suggère.** `starters` ne porte
  **volontairement aucun `activity_type_id`** — une colonne sans lecteur est celle qu'on relit un jour
  sans savoir pourquoi (T5.2). Le geste coûte une colonne, une migration et trois lignes. → **T7.10.**
- **L'outil par défaut d'un type d'activité ne présélectionne rien.** `default_tool_id` **nomme** le
  lien sortant depuis le 21/08/2026 ; il ne choisit encore rien dans le panneau de résultat (T4.4).
  → **T7.10.**
- **Le groupe « Annulé » n'est plus replié par défaut.** La roadmap en liste à plat l'a fait
  disparaître avec les quatre autres intertitres. `docs/03` §6 demande « en retrait, replié par
  défaut » : le retrait tient, le repli non. → **T7.10.**
- **Rétablir un accompagnement sous un produit archivé le laisse invisible.** Les lectures écartent
  les projets d'un produit archivé — six depuis T6.7 —, donc le geste paraît ne rien faire. Aucun
  garde-fou (arbitrage (f) de C4bis) ; rien n'est perdu. → **T7.10.**
- **Onze objets écrivent sans laisser de trace au journal** : persona, use case, indicateur,
  personne, entité, vision produit, le budget de T7.1, l'outil de mesure et le plan de taggage
  (01/09), le **repère de contexte** (01/09), et la **suppression d'un accompagnement** (28/08). Ce
  dernier est d'une autre nature : `events.project_id` étant `cascade`, une trace écrite juste avant
  serait effacée par l'instruction suivante — il n'y a pas de ligne à écrire, il y a une disparition à
  admettre. Les six `event_target_type` restent une liste fermée sans migration (arbitrage (b) de C6,
  (d) de C7), et chaque hors-ticket qui ajoute une table de référence du produit allonge cette liste
  d'un nom. → **C8.**
- **`lib/auth/session.ts:10` promet encore que « C7 change de source d'identité ».** Cinquième
  énoncé de la famille que la sortie du SSO a rendu faux ; T7.5 en a corrigé quatre, tous dans son
  périmètre — les trois de la fiche, plus `provider.ts:47`. Celui-ci est hors périmètre (règle 3).
  La ligne 4 du même fichier **cite** D37 et reste juste à ce titre. → **au prochain ticket qui
  ouvre `lib/auth/session.ts`, sinon C8 avec le SSO.**
- **L'en-tête de `schema.ts` dit « les 26 tables métier », elles sont 30.** Cinquième chiffre faux
  d'une même famille — `scoped.ts`, la fiche de C6 deux fois, et `drawers/project.tsx` (« les six
  panneaux » pour huit, **retiré** par T6.5). Le geste est de retirer. → **T7.10, qui l'ouvre.**
- **Deux fichiers de tests d'action nettoient encore sur `if (!f?.domainId) return`** — un
  `beforeAll` qui échoue après avoir créé son domaine le laisse en place, et fait tomber le fichier
  suivant. Restent `projets/` et `produits/` ; `equipe/actions.test.ts` (28/08) et
  `administration/actions.test.ts` (T7.3) retiennent leur `domainId` **dès la création du domaine**,
  hors de la fixture — c'est la forme à reprendre. → **au prochain.**
- **`uiLayerSeal` ne scelle ni `components/shell/` ni `components/overview/`, et la destination
  « au prochain qui l'ouvre » a échoué.** Le dossier a été ouvert le 29/08/2026 par la reprise de la
  vue d'ensemble — trois fichiers touchés, un supprimé — et **le sceau n'a pas été posé** : la
  reprise ne déplaçait que du rendu, et poser une règle ESLint y aurait été un geste hors périmètre
  (règle 3). Le trou compte désormais **trois** fichiers et non quatre. Une destination qui désigne
  un événement plutôt qu'un ticket ne se déclenche pas : celle-ci en reçoit une. → **C8.**
- **`listResultToolOptions` sert trois panneaux, et son nom n'en dit qu'un.** Le panneau de résultat
  a été son premier appelant (T4.4) ; ceux du type d'activité et de la piste s'y sont ajoutés le
  30/08/2026, avec le même `keepToolId`. La lecture est exactement la bonne — c'est le nom qui ment.
  Le renommer demande d'ouvrir `lib/queries/activities.ts`, hors du périmètre de T7.4. → **au
  prochain ticket qui ouvre `lib/queries/activities.ts`.**
- **Rien en base ne retient un outil, et son refus d'archivage n'a aucun filet.** Les **quatre** clés
  étrangères qui pointent `tools` sont `set null` — `activity_types.default_tool_id`,
  `starters.tool_id`, `results.tool_id`, `budgets.tool_id` —, à la différence des huit autres
  référentiels, dont l'archivage bute sur un `restrict`. Ce qui s'y oppose est donc **écrit dans
  l'action seule** (`refusalOfToolUsage`, arbitrage du 30/08/2026 : types et pistes vivants, jamais
  les résultats ni les budgets, qui portent leur propre `external_url`). Sa seule garde est le test
  qui le vise. → **sans échéance ; à reposer si une clé change de nature.**
- **Les deux use cases de la fixture n'ont aucun persona rattaché.** `scripts/seed.ts` n'en sème
  aucun. Le rattachement est facultatif et le lien a été éprouvé par sonde scopée : ce qui manque est
  un **jeu d'essai**. → **au prochain ticket qui sème des personae.**
- **La carte radio est écrite deux fois, aux mêmes classes** — le « Type » de produit
  (`product-form.tsx:132-160`) et la « Planification » d'une activité (31/08/2026). `checkbox-chip.ts`
  écrit sa propre condition d'extraction — « une constante et non un composant », pour « deux
  appelants qui n'ont en commun que leur forme » — et elle est désormais remplie. L'extraire impose
  de mesurer que le `<form>` servi du formulaire de produit reste identique à l'octet, le geste exact
  du 31/08 pour `CHECKBOX_CHIP`. La constante vit en attendant dans `activity-panel.tsx`, sous le nom
  `PLANNING_CARD`. → **au prochain ticket qui ouvre `product-form.tsx`.**
- **`sameReferentialLabel` et `sameEntityLabel` disent la même règle deux fois**, et l'entité est
  la seule des neuf lignes de référentiel dont le formulaire **ne saisit pas** sa `position` alors
  que la colonne existe — `entities.position` n'ayant aucun lecteur. (`tools` n'en saisit pas non
  plus, mais elle **n'a pas la colonne** : ce n'est pas le même fait.) Les replier demande d'ouvrir
  `lib/forms/entity.ts`, que ni T7.3 ni T7.4 n'ouvraient. → **au prochain ticket qui ouvre
  `lib/forms/entity.ts`.**
- **Les props d'icône de `Button` n'ont toujours aucun appelant.** Elles enfreignent l'en-tête de
  `button.tsx` — objet même de la demande, **éprouvées par sonde**. Le rang `tertiary` a trouvé le
  sien le 21/08 (le kebab de roadmap) ; l'icône attend encore. → **au prochain ticket qui pose un
  geste porteur d'icône.**
- **Un pied de formulaire sur quatre a son « Annuler » au rang secondaire.** Celui du formulaire de
  projet (29/08). Les trois autres — `product-form.tsx` et les deux pieds de `panel.tsx` et
  `confirm-panel.tsx` — gardent le lien souligné `ACTION_LINK_SM`, et **la divergence est réelle** :
  le même geste porte deux rangs selon l'écran. → **au prochain ticket qui ouvre un pied de
  formulaire.**
- **`disabled:opacity-60` est servi sur douze balises qui ne peuvent pas être désactivées** — les
  `<a>`, `<Link>` et `<DrawerLink>` qui portent un bouton, contre une seule source pour l'état
  désactivé. La douzième est le « Annuler » du formulaire de projet (29/08). → **sans échéance.**
- **Le formulaire de projet dit « (obligatoire) », celui de produit non.** `FormField` porte la prop
  depuis TD.1 ; seul le premier des deux formulaires pleine page la passe, depuis le 29/08. La
  reprise était bornée à un écran, et l'écart est donc **ouvert, pas assumé**. → **au prochain ticket
  qui ouvre `product-form.tsx`.**
- **Le bloc des personnes retenues n'a pas d'état vide.** `Picker` ne rend rien quand personne n'est
  retenu (`kept.length > 0 ? … : null`), et depuis que la section « Équipe » est une carte titrée,
  l'absence se voit sans se dire — ce que la règle 5 refuse. Le geste est dans le socle et touche
  **les deux appelants**, dont les participants du panneau d'activité. → **au prochain ticket qui
  ouvre `picker.tsx`.**

### c. Dettes assumées, sans échéance

- **La page produit porte deux langages d'en-tête.** « Vision produit » a pris le surtitre en
  capitales et le kebab en absolu de `northstar-v2` ; ses voisins gardent `BlockHeader`, sur demande.
  Au second bloc à surtitre, `Eyebrow` quitte `indicators.tsx` pour `block.tsx`.
  → **arbitrage humain.**
- **Une carte ne se détache d'aucun fond, et c'est le design system qui manque.** Quatre positions :
  la North Star (1,04:1, sa bordure la sauve à 1,33:1), les cartes de personae (1,05:1, le filet à
  1,17:1), le panneau de T5bis.4 (1,24:1), et depuis le 29/08/2026 **la surface de survol d'une
  ligne de répartition** — `surface-neutral-lightest` sur le fond de carte, **1,05:1**, prévue au
  plan de la reprise et **retirée sur mesure**. Le plus franc des `surface-neutral-*` plafonne à
  2,22:1, sous 3:1. **Tous les couples de texte passent 4,5:1.** Le manque ne coûtait qu'un contour
  de carte ; il coûte désormais **un état d'interaction**, ce qui est une autre affaire.
  **T7.5 l'a rencontré une cinquième fois sur le fond primaire de la barre latérale et n'a rien
  posé** — le voile de la maquette y mesure 1,03:1, et le seul fond perceptible est celui de
  l'entrée de navigation courante : la carte de la personne courante se détache par l'espace, et la
  position n'entre donc pas au décompte. T7.7 le mesure sans le refermer.
  → **design system, sinon C8.**
- **Le design system a huit manques, et aucun n'a été inventé.** Trois élévations et deux gradients
  nommés sans valeur ; aucun jeton de bordure de contrôle, de bordure d'erreur, d'interlettrage, de
  voile au-delà de 40 %, de séparateur, de mouvement (`--duration-drawer`, `--easing-drawer` sont
  dans `app/tokens.css` faute de mieux) ; **`--number-*` s'arrête à 100 px** pour dix-neuf valeurs
  légitimes au-delà. **Six substituts mesurés**, de 3,05:1 à 5,19:1. → **design system.**
- **Le filtre de la roadmap ne se partage plus par son adresse.** Repassé côté client à la demande :
  il ne se copie plus, ne survit plus au rechargement, n'existe plus sans JavaScript. Une adresse
  reviendrait par `history.replaceState`, **sans** rendre le clic navigant. L'arbitrage du 21/08 est
  humain ; le rouvrir demanderait la même main. → **arbitrage humain, sinon C8.**
- **Sans JavaScript, les gestes d'une carte de roadmap ne sont plus atteignables.** Le menu « … »
  décide de son ouverture, seule exception arbitrée à D30 : les **quatre actions serveur** n'ont aucun
  repli. Refermer demanderait un `<details>` natif — qui perdrait `Échap`, le clic extérieur et
  `role="menu"` — ou une URL par geste. → **sans échéance.**
- **La base de développement a dérivé de la fixture, et c'est acté. Elle est jetable** — la règle 4
  protège la donnée métier, pas une fixture locale. Un critère passé ne s'y relit pas nécessairement,
  et **une comparaison avant/après n'y vaut que si rien n'a bougé entre les deux mesures**. Pas de
  `db:reset`. → **sans échéance ; outillage si le besoin devient réel.**
- **L'amorçage rapproche par clé naturelle, donc un renommage recrée — et c'est arrivé.** La clé des
  activités, étendue à `projet · type · période`, atténue sans éliminer : un renommage a laissé deux
  lignes en base de développement, l'ancienne orpheline — sans conséquence en production, où
  l'amorçage ne tourne pas. **Refermé pour les entités seules.** → **C8.**
- **Les points d'arrêt de mise en page sont posés à la main, écran par écran, et c'est un
  arbitrage.** Un point d'arrêt n'est pas une valeur de thème (T1.6) : il est hors de la clause 2 de
  `spacingScaleLock`, et les deux gabarits de grille d'`indicators.tsx` le disaient déjà. **T7.6 a
  fait passer le dépôt de 29 à 62 utilitaires responsives**, sur deux paliers seulement — `md` pour
  les gouttières et les planchers, `xl` pour les colonnes de liste — mais chaque écran redit le sien,
  et rien n'empêche un écran neuf d'en choisir un troisième.
  → **à reposer avec une grille au design system.**
- **La création d'un projet n'est pas atomique, et ne peut pas l'être.** `neon-http` n'a pas de
  transaction interactive — la couche n'a que `batch`. La parade est de tout confronter au domaine
  **avant** d'écrire et d'ordonner les ajouts avant les retraits (T3.6). Reste ouvert : une écriture
  qui réussit puis dont la suivante échoue. → **le jour où la couche exposera une transaction.**
- **La fixture est incomplète sur les ressources et les résultats.** Les deux résultats factices
  n'ont pas de lien profond, trois des quatre ressources du brief ne sont pas semées, et
  **`tools.base_url` porte trois adresses provisoires sur `example.com`**. → **sans échéance, ou
  l'humain fournit les adresses.**
- **Les filtres ne survivent pas à un aller-retour par la navigation principale.** `docs/06` §9 les
  veut conservés ; le retour navigateur les restitue, un clic sur « Projets » repart à zéro.
  → **si l'usage le réclame.**
- **Le référentiel des personnes reste servi en entier dans les deux formulaires.** `Picker` en
  replie l'**affichage**, pas le poids : le rapprochement se fait en mémoire sur ce qui est déjà
  dans la page, ce qui rend la suggestion instantanée et évite d'inventer la première route API du
  dépôt. Au-delà de quelques centaines de personnes, c'est la page qu'il faudra traiter.
  → **si l'usage le réclame.**
- **La liste transverse n'est ni paginée ni plafonnée.** `docs/06` §4 la projette « à quinze puis
  cinquante projets », ce qu'une page rend sans effort. Au-delà, un plafond avant une pagination.
  → **si l'usage le réclame.**
- **Deux règles de période voisines vivent à deux endroits, et rien ne tient leur accord.**
  `lastActivityExpression` (`lib/db/scoped.ts`) et `projectPeriods` (`lib/queries/project-period.ts`)
  lisent les mêmes lignes avec les mêmes exclusions — ni archivée, ni annulée — **et divergent sur un
  point voulu** : la seconde compte les activités `planned`, la première les écarte (T2.1). L'une dit
  l'étendue, l'autre la fraîcheur, et elles ont raison chacune de son côté ; mais ni la base ni le
  compilateur n'obligent la prochaine lecture de période à choisir sciemment. Deux témoins de test
  tiennent l'accord, un par règle. → **sans échéance ; à reposer si une troisième lecture de période
  apparaît.**
- **Une activité `in_progress` porte une fin de période à venir.** La fraîcheur retient
  `max(coalesce(period_end, period_start))` : pour un atelier en cours en août, c'est le 31 août ;
  au mois, l'affichage reste juste. → **le jour où une période se dira au jour.**

---

## Rappels de contexte

- **Un argument lié à une action serveur n'est pas un secret.** `bind(null, project.id)` sort
  l'identifiant de la saisie, mais Next le sérialise dans un champ `$ACTION_…`, **en clair en
  développement**, et une soumission peut le réécrire. **Règle : une action ne tire jamais une
  autorisation de la valeur qu'on lui a liée** — elle interroge le droit sur la valeur **reçue**.
  **Le droit s'éprouve par l'action, jamais par l'écran.**
- **Le panneau s'ouvre côté client depuis TD.2, et son corps reste rendu sur le serveur.** Une
  fonction `"use server"` renvoie un `ReactNode` : droits, actions et lectures conditionnelles y
  restent. Les URL d'ouverture passent par la **même** résolution que le clic — aucune règle de droit
  ne vit à deux endroits.
- **La disponibilité est déduite, et sa base vit à trois endroits.** `0` accompagnement **en
  cours** → disponible, `1`–`2` → partiellement, `3` et plus → indisponible (`lib/availability.ts`,
  28/08/2026). « En cours » veut dire **ni archivé, ni terminé** ; `paused` compte encore. Le seuil
  est écrit une fois, mais **les exclusions sont réécrites par chacune des trois lectures**, sous
  trois formes différentes — sous-requête corrélée, regroupement, filtrage en mémoire —, et le
  compilateur ne les oblige à rien. Trois témoins de test tiennent l'accord, un par lecture.
- **L'arbitrage (d) de C5bis n'a plus de gardien en base.** Le `CHECK`
  `persons_availability_requires_center` est tombé avec la colonne : « un intervenant côté entité ne
  porte pas de disponibilité » n'est plus tenu que par les trois mêmes lectures, chacune par un
  `kind === "center"`. Une quatrième qui l'oublierait inventerait une disponibilité, et rien ne
  l'arrêterait.
- **Trois tables se suppriment, et elles n'ont pas la même barrière.** `entities` et `persons` sont
  retenues par des clés `restrict` ; **`projects` n'est retenue par rien** — ses dix clés étrangères
  sont `cascade`, et son panneau de confirmation est le seul garde-fou du geste. Ajouter une
  quatrième table à `DeletableTable` est un arbitrage humain, jamais une décision de ticket.
- **Le domaine courant est le premier domaine actif trouvé en base**, rendu **par nom** : pas de
  variable d'environnement, `docs/05` §3 posant un domaine unique. Le jour où un second existe, le
  choix revient au fournisseur d'identité.
- **L'authentification est un stub sans échéance** depuis que le SSO est sorti de C7 (27/08/2026),
  mais le contexte de session a sa forme finale. `lib/auth/provider.ts` reste le seul fichier que le
  SSO réécrira, et **`/dev/session` reste** : c'est le seul endroit où l'on change de personne
  courante. Elle est rendue 404 en production et reliée à aucune navigation.
- **Les maquettes `docs/design/maquettes/` sont une référence visuelle**, jamais branchées.
- **Une fonction serveur se frappe en `text/plain`**, jamais en urlencodé : la charge est le tableau
  d'arguments encodé en Flight. **Le code HTTP ne dit jamais ce qui a été écrit** — T6.1 a mesuré un
  archivage refusé qui rend **200**, comme celui qui réussit, et une action frappée en urlencodé avec
  le **bon** identifiant qui rend **404**, comme un identifiant inconnu. Trois « 200 muets » avant
  elle, faute d'étape témoin : TD.1, T5bis.4, T5bis.6. **Seul le décompte en base tranche.**
- **Le levier n'est pas le modèle mais les quatre disciplines de vérification** — le relevé par
  ticket est dans `HISTORIQUE-TICKETS.md`.
