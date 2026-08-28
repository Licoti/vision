# Historique des tickets — Vision

Récit détaillé de chaque ticket terminé, et archive des points ouverts refermés.

**Ce fichier n'est pas lu au démarrage d'une session.** `ETAT.md` en porte le résumé en une ligne
par ticket. On vient ici pour reprendre un ticket ancien, comprendre une décision de vérification,
ou retrouver une mesure de contraste.

Les pièges, dettes assumées et désaccords vivent dans `JOURNAL-TECHNIQUE.md`, pas ici.

Créé le 14/08/2026, par déplacement du « Journal des tickets » d'`ETAT.md`, devenu illisible à
78 Ko. Rien n'a été récrit ni résumé au passage : le contenu ci-dessous est celui d'`ETAT.md` au
commit `9afa52f`, à la ligne près.

---

## Journal des tickets — une ligne par ticket

*(replié d'`ETAT.md` le 14/08/2026, geste 1 de la session de découpage de C4bis. Les 22 lignes sont
reprises verbatim : elles y occupaient la place que quatre lignes de chantier occupent désormais.
Elles servent ici de sommaire au récit détaillé qui suit, qui porte chacun de ces 22 tickets.)*

**C1 — Socle technique**

- **T1.1 — 11/08/2026 — initialisation du projet.** Écarts : couleurs d'aires thérapeutiques
  Servier non traduites ; `next dev` bridé pour cesser d'écrire dans `CLAUDE.md`.
- **T1.2 — 12/08/2026 — schéma de la base de données.** Écart : `domain_id` ajouté sur les tables
  de liaison, que `docs/04` ne détaille pas.
- **T1.3 — 12/08/2026 — couche d'accès scopée.** Écart : mise en place de Vitest.
- **T1.4 — 12/08/2026 — contexte de session (stub).** Écarts : le responsable de domaine écrit sur
  tous les projets, arbitrage sur un silence de D9 ; les tests.
- **T1.5 — 12/08/2026 — référentiels et données factices.** Écarts : `tsx` déclaré ; un 25ᵉ type
  d'activité ; trois inventions hors brief.
- **T1.6 — 12/08/2026 — coquille applicative.** Écarts : deux blocs de maquette écartés (carte de
  la personne courante, entrée Administration) ; `/a-propos` laissée vide.

**C2 — Produits et projets**

- **T2.1 — 12/08/2026 — liste des produits.** Écart : débordement sur `lib/db/scoped.ts`, ses tests
  et `scripts/seed.ts` — le prix d'une décision sur un champ dénormalisé.
- **T2.2 — 12/08/2026 — page produit, version socle.** Écarts : fichier de tests ; alias `@/` dans
  `vitest.config.mts` ; motif d'UUID déplacé dans `lib/uuid.ts`.
- **T2.3 — 12/08/2026 — liste transverse des projets.** Écarts : `formatProjects` ;
  `components/ui/status-dot.tsx` ; fichier de tests.
- **T2.4 — 12/08/2026 — page projet, en-tête et équipe.** Écarts : `formatRank` ; `Avatar` extrait
  d'`AvatarGroup` ; `field.tsx` et `tag.tsx` ; fichier de tests.
- **T2.5 — 12/08/2026 — création et édition d'un produit.** Premier écran d'écriture. Écarts :
  `action` sur `PageHeader` ; deux routes dans `ROUTES` ; fichier de tests.
- **T2.6 — 13/08/2026 — création et édition d'un projet.** Clôt C2. Écarts :
  `lib/queries/projects.ts` ; trois entrées dans `ROUTES` ; fichier de tests.

**C3 — Activités et roadmap**

- **T3.1 — 13/08/2026 — roadmap du projet, lecture.** Aucun écart de périmètre.
- **T3.2 — 13/08/2026 — panneau latéral de saisie.** Écart : `components/ui/focus-trap.tsx`, ajouté
  après livraison. Aucun fichier de tests.
- **T3.3 — 13/08/2026 — création d'une activité.** Écarts : `app/(app)/projets/[id]/page.tsx` ;
  deux commentaires devenus faux dans `focus-trap.tsx`.
- **T3.4 — 13/08/2026 — édition d'une activité.** Écarts : `app/(app)/projets/[id]/page.tsx` ;
  `lib/navigation.ts` ; `lib/queries/activities.ts` et son fichier de tests.
- **T3.5 — 13/08/2026 — cycle de vie d'une activité.** Écarts : `app/(app)/projets/[id]/page.tsx` ;
  `lib/queries/activities.ts` et son fichier de tests.
- **T3.6 — 13/08/2026 — participants d'une activité.** Clôt C3, et avec lui le POC minimal
  démontrable. Écarts : `app/(app)/projets/[id]/page.tsx` ; `components/projects/roadmap.tsx`.

**C4 — Ressources et résultats**

- **T4.1 — 13/08/2026 — bloc « Ressources » de la page projet, lecture.** Aucun écart de périmètre.
- **T4.2 — 14/08/2026 — relier une ressource.** Ferme la boucle minimale de `docs/05` §2. Aucun
  écart de périmètre.
- **T4.3 — 14/08/2026 — le résultat sur l'entrée de roadmap.** Écart : `lib/format.test.ts`, qui
  n'existait pas.
- **T4.4 — 14/08/2026 — saisie déclarative d'un résultat.** Clôt C4. Écarts déclarés avant
  écriture : `lib/queries/activities.ts` et ses tests ; `isWebUrl` exporté de `lib/forms/resource.ts`.

**C4bis — Archivage et correction**

*(section ouverte le 14/08/2026, **repliée le 15/08/2026** par la session de découpage de C5 :
`ETAT.md` ne porte plus qu'une ligne de chantier, et ces six lignes sont désormais le seul sommaire
du récit détaillé. Elles y avaient été recopiées au fil de l'eau, ce qui a rendu le repliage sans
geste — rien n'a été récrit ni résumé au passage, et les vérifications que les lignes d'`ETAT.md`
portaient en plus vivent dans le récit ci-dessous, ticket par ticket.)*

- **T4bis.1 — 14/08/2026 — ce qu'un formulaire fait d'une valeur archivée.** Écart déclaré et
  tranché avec l'humain avant écriture : `app/(app)/projets/actions.ts`, un septième fichier.
- **T4bis.2 — 14/08/2026 — archiver un produit, et le rétablir.** Écart déclaré et tranché avant
  écriture : `lib/db/scoped.ts` et ses tests, pour `restore()` et rien d'autre. **Vérifications non
  exécutées** — jouées depuis, en tête de T4bis.3.
- **T4bis.3 — 15/08/2026 — archiver un accompagnement, et la lecture seule qui va avec.** Aucun
  écart de périmètre. Trois arbitrages posés et tranchés avant écriture : `updateProject` refuse le
  projet archivé reçu ; aucun garde-fou au rétablissement sous un produit archivé ; le trou
  `createProject` × produit archivé reste ouvert.
- **T4bis.4 — 15/08/2026 — archiver une activité saisie par erreur.** Aucun écart de périmètre, cinq
  fichiers pour cinq annoncés. Trois arbitrages posés et tranchés avant écriture : geste retiré de
  l'entrée qui porte un résultat et refus muet ; geste présent dans les cinq groupes, « Annulé »
  compris ; libellé « Archiver la saisie ».
- **T4bis.5 — 15/08/2026 — corriger et retirer une ressource.** Aucun écart de périmètre, neuf
  fichiers pour les sept annoncés plus leurs deux tests. Deux arbitrages posés et tranchés avant
  écriture : les libellés « Modifier » et « Archiver », aucun verbe neuf à l'écran ; l'exception
  nominative étendue à l'activité **annulée**, que la fiche ne nommait pas.
- **T4bis.6 — 15/08/2026 — corriger et retirer un résultat, et sa migration.** Aucun écart de
  périmètre, dix fichiers pour les huit annoncés plus leurs deux tests. **Première migration depuis
  T1.2.** Quatre arbitrages posés et tranchés avant écriture : le nom `results_activity_unique`
  conservé malgré le changement de nature ; les libellés « Corriger le résultat » et « Archiver le
  résultat » ; les deux gestes suivent le **résultat** et non le groupe « Terminé » ; la valeur se
  réaffiche rognée de ses zéros décimaux. Clôt C4bis.

**C5 — Indicateurs et lecture dans le temps**

- **T5.1 — 16/08/2026 — le bloc « Indicateurs » de la page produit, en lecture.** Écart de
  périmètre déclaré et tranché avant écriture : `lib/format.ts` et son test, hors des quatre
  fichiers de la fiche, pour les trois formats neufs. Second arbitrage : le bloc en pleine largeur,
  la page produit ne portant aucune grille. Porte en plus le **dû hors périmètre de fichiers** — le
  parcours d'archivage produit, joué pour la première fois depuis T4bis.2.
- **T5.2 — 16/08/2026 — créer, corriger et archiver un indicateur.** Aucun écart de périmètre :
  sept fichiers, dont `lib/queries/indicators.ts` **ouvert et laissé intact**. Trois arbitrages
  tranchés avant écriture : un produit archivé ne reçoit plus de saisie d'indicateur ; la porte lit
  le produit avant d'évaluer le droit ; le fichier de lecture est déclaré sans être touché.
- **T5.3 — 16/08/2026 — saisir, corriger et retirer un relevé, et sa migration.** La seule migration
  de C5, et la première épreuve d'`hasArchivedAt` : la couche d'accès n'a pas changé d'un caractère.
  Deux arbitrages tranchés avant écriture : la date de chaque ligne de série au **mois**, une seule
  règle de date dans tout le bloc ; la série **toujours dépliée**, sans geste d'ouverture. Aucun
  écart de périmètre — huit fichiers, ceux de la fiche.
- **T5.4 — 16/08/2026 — adopter un indicateur depuis l'accompagnement.** Douze fichiers, dont
  **trois hors fiche**, tous déclarés et tranchés avant écriture : `components/products/indicators.tsx`
  et `app/(app)/produits/actions.ts` par arbitrage, `components/projects/adoption-panel.tsx` par
  nécessité — la fiche demande un panneau sans nommer de fichier pour lui. Trois arbitrages : le
  « combien » du refus (e) passe par l'écran et non par un message d'action ; le pluriel du refus (e)
  d'`archiveProduct` se corrige avant d'être recopié ; `project_indicators.note` reste sans écrivain.
  Premier retrait par `unlink` d'un objet que l'écran offre, et premier verbe neuf depuis T3.5.
- **T5.5 — 16/08/2026 — la frise du temps long : l'axe, les accompagnements, les repères.** Quatre
  fichiers, ceux de la fiche, `lib/format.ts` restant fermé faute d'un format qui manque. Quatre
  arbitrages tranchés avant écriture, dont un **écart assumé à la fiche** : `role="group"` au lieu du
  `role="img"` qu'elle demandait, les deux exigences de la fiche s'excluant. Premier SVG du projet,
  rendu sur le serveur et sans `viewBox`.
- **T5.6 — 17/08/2026 — les courbes d'indicateurs sur la même frise.** Clôt C5. **L'axe n'a pas bougé
  d'une ligne** : `timelineScale` recevait une liste de dates depuis T5.5, écrit pour ce jour-là. Une
  seule lecture neuve, celle des cibles. Cinq arbitrages tranchés avant écriture, dont les deux
  bornes de chaque bande écrites — sans repère chiffré, une courbe devient le graphique décoratif que
  D41 refuse — et une seule couleur pour toutes.

**TD — Dette technique** *(hors chantier)*

- **TD.1 — 17/08/2026 — le socle des panneaux, et quatre correctifs de dette.** Ticket **hors
  chantier**, dans la seule fenêtre où les fiches n'interdisent plus rien. **−644 lignes nettes** :
  huit copies du composant de champ, six coquilles de panneau et quatre `ACTION_LINK` deviennent
  trois fichiers de `components/ui/`. Le critère était que rien ne change, et il s'est lu — 26 rendus
  capturés avant et après, à données constantes. Quatre correctifs joints, dont le produit archivé
  refusé par `createProject` **et** par le déplacement d'`updateProject`.

*(les deux lignes ci-dessus repliées d'`ETAT.md` le 17/08/2026, geste 1 de la session de découpage de
C5bis. T5.1 à T5.5 y étaient déjà, versées au balayage de T5.5.)*

*(les vingt-sept lignes ci-dessous repliées d'`ETAT.md` le 25/08/2026, geste 1 de la session de
découpage de C6 : les quatre tickets TD hors chantier — TD.2, TD.3, TD.5 et TD.6, TD.1 ayant sa
ligne plus haut —, les sept tickets de C5bis, et les seize reprises hors ticket du 17 au
21/08/2026. Elles sont reprises **verbatim** — le récit détaillé de
la plupart d'entre elles vit plus bas dans ce fichier, et celles qui n'en ont pas sont ici leur
seule trace, ce qui est la raison de les déplacer plutôt que de les résumer.)*

- **TD.2 — 18/08/2026 — les panneaux s'ouvrent côté client.** Ticket **hors chantier**. L'ouverture
  d'un panneau naviguait : aller-retour serveur, page re-rendue, URL réécrite. Elle est désormais un
  état client — coquille montée avant l'appel, corps renvoyé **rendu** par une fonction serveur, URL
  inchangée. D30 ne bouge pas (il ne parle que de « panneau plutôt que page ») ; c'est l'invariant
  d'implémentation de T3.2 qui se retourne. Les treize URL d'ouverture restent des **adresses**
  valides et traversent la **même** résolution que le clic. Écarts assumés : le Retour navigateur ne
  referme plus, et deux jetons de mouvement sont posés faute que le design system en porte.
- **T5bis.1 — 17/08/2026 — le schéma : compétences, niveaux, profil.** Trois tables, deux colonnes et
  leur `CHECK`, migration **`0004`** — la fiche annonçait `0003`, déjà pris. Écarts : présentations et
  disponibilités **inventées** contre la règle de tête de `seed.ts` ; mise en défaut de la fiche
  corrigée, la sienne ne compilant pas.
- **T5bis.2 — 17/08/2026 — l'entrée « Équipe » et la liste.** Cinquième entrée contre les « quatre »
  de `docs/06` §8, `listTeam` en deux lectures fixes portant cinq `filter()`, la pastille de
  disponibilité. Sa leçon : **une jointure scopée ne se met en défaut que sur une ligne forgée**, et
  forgée sur **une seule** colonne — sinon un autre filtre la rattrape et sa chute ne prouve rien.
- **Menu « … » sur les cartes de roadmap — hors ticket, le 17/08/2026.** Les sept gestes empilés à
  droite d'une entrée passent sous un bouton unique : `indicator-menu.tsx` promu en
  `components/ui/action-menu.tsx`, seul menu de l'application — ce qui **corrige au passage un
  contraste de bordure à 1,33:1** porté par les deux menus North Star. « Annuler » sort en
  `ConfirmPanel` (`?annuler=<id>`), son motif étant obligatoire : `cancelActivity` passe du refus
  muet au `ConfirmState`.
- **« Vision produit » — hors ticket, le 18/08/2026.** Le bloc de tête ne disait que la mesure, il
  porte la question : `products.vision` (migration **0005**), panneau `?vision=modifier` sous
  `manageDomain` — seul geste du bloc hors du droit dérivé —, puis `★ North Star` et « Indicateurs
  associés », chaque carte nommant son accompagnement. Deux écarts consignés. Sa leçon est dans le
  harnais : **`resolveDomainId` rend le premier domaine actif *par nom***, et le fichier de tests
  voisin ne passait que par chance alphabétique.
- **L'ordre et le nom des trois blocs de la page produit — hors ticket, le 18/08/2026.** La frise
  remonte en deuxième position sous « Accompagnements en cours » et s'ouvre sur l'année en cours
  (`defaultWindow`, migration nulle) ; la liste descend en dernière sous « Tous les
  accompagnements » ; le formulaire de fenêtre au mois passe sous `SHOW_MONTH_RANGE`. L'ordre rend à
  `docs/06` §6 la place qu'il réclamait ; le nom et le cadrage restent hors document. Sa leçon :
  **`timelineWindow` borne, il n'écarte pas** — sans repli hors-axe, un produit terminé en 2024
  s'ouvrirait sur une fenêtre d'un seul mois, mesuré à `firstMonth: '2026-02'`.
- **Le bloc « Vision produit » sur `northstar-v2` — hors ticket, le 18/08/2026.** Surtitre en
  capitales et kebab en absolu à la place de `BlockHeader`, barre d'accent en dégradé, vision en 30
  pixels, **North Star dans une carte blanche**, décompte sur l'intertitre du rang 3, pastille de
  cible passée à gauche et crochet d'écart « +14 pts » sur la courbe. Poppins passe aussi en famille
  secondaire, dans `tokens.css` et nulle part ailleurs. Le bloc **quitte le langage d'en-tête
  commun** que le 17/08 lui avait donné : écart assumé, les deux blocs voisins gardent
  `BlockHeader`. Sa leçon : **une carte qui change de fond emporte tout ce qui se peignait du fond
  d'avant** — deux pastilles de cible et l'anneau des points se peignaient en
  `surface-primary-lighter` pour rester lisibles par-dessus les filets, et auraient dessiné trois
  rectangles bleus sur la carte blanche.
- **Le bloc « Personae » — hors ticket, le 18/08/2026.** La page disait pourquoi le produit existe
  et ce qu'il mesure, jamais **pour qui** : `personas` et `persona_traits` (migration **0006**),
  cartes en grille sous « Vision produit », fiche en panneau (`?fiche=<id>`) et saisie en panneau
  (`?persona=nouveau|<id>`) — **deux clés pour un même objet, parce que ce sont deux droits** : la
  fiche se lit par tout le domaine (D9), la saisie suit le droit dérivé des accompagnements. Le
  décompte d'exclusivité passe de cinq clés à sept sans qu'un caractère change. Sa leçon est dans
  le modèle : **les trois zones de texte arrivent en base comme des lignes identifiées**, et le
  `syncTraits` rapproche sur `(kind, label)` plutôt que de remplacer — sans ce diff, un use case
  qui désignera un irritant désignerait une ligne que la correction suivante efface.
- **Le bloc « Use Cases » — hors ticket, le 19/08/2026.** La page disait pourquoi le produit
  existe, ce qu'il mesure et pour qui ; elle ne disait pas **comment il est construit** :
  `use_cases` et `use_case_personas` (migration **0007**), cartes compactes en **ligne défilante**
  sous « Personae », fiche en panneau (`?scenario=<id>`) et saisie en panneau
  (`?usecase=nouveau|<id>`) — **deux clés pour deux droits**, la séparation de `persona`/`fiche`
  reprise sans l'inventer. Le décompte d'exclusivité passe de sept à neuf clés sans qu'un caractère
  change, pour la troisième fois. **Le modèle tient la promesse écrite le 18/08** : rien n'a été
  repris, le rattachement passe par une table de liaison — jamais une colonne — pour qu'une
  fonctionnalité ou un méga-parcours soit demain **une table de plus**, et aucune n'est créée
  aujourd'hui (leçon de T5.2). Sa porte propre est la troisième : **les `personaIds` viennent du
  formulaire, pas d'une liaison serveur**, donc ils se confrontent aux personae vivants du produit
  reçu — et avant toute écriture, faute de transaction. Sa leçon est double, et les deux se
  mesurent : **`react-hooks/rules-of-hooks` prend tout `useX` pour un crochet**, ce qui a fait
  céder la convention de nom du dépôt en deux fichiers ; et **`now()` est le temps de la
  transaction**, si bien qu'un `insertMany` donne le même horodatage à toutes ses lignes et laisse
  l'UUID trancher — les deux use cases de la fixture se lisent dans l'ordre inverse du fichier, et
  deux commentaires ont été corrigés après mesure.
- **T5bis.3 — 18/08/2026 — les filtres de la liste.** Cinq clés dans l'URL, sans une ligne de
  JavaScript : `q`, `metier`, `competence` (répétable), `niveau`, `dispo`. La conjonction est **un
  `exists` par compétence cochée** — la seule forme qui dise « les deux » sans `group by` ni
  `having count(*)`, donc sans le décompte qu'interdit le garde-fou 2 ; mesuré sur la fixture, 3 ∩ 3
  = 1. `listTeamFilterOptions` ne propose que les valeurs qu'une personne vivante porte, sauf
  l'échelle, proposée entière parce que « au moins ce niveau » est un seuil. Trois écarts consignés,
  dont `q` contre la convention française des autres clés. Sa leçon vaut pour tout ticket qui ajoute
  un `filter()` : **un filtre de domaine qu'aucune ligne forgée ne vise n'est pas éprouvé** — le
  retirer ne fait tomber aucun test. Deux lignes forgées de plus (une personne d'un autre domaine
  portant une liaison du domaine, une autre portant un de ses métiers) rendent les **onze**
  neutralisations concluantes, chacune sur son seul test.
- **T5bis.4 — 19/08/2026 — la fiche, en panneau.** `/equipe` devient la **troisième page hôte** :
  `<DrawerHost>`, `lib/drawers/team.tsx`, `loadTeamDrawer`, et une carte dont la ligne entière est
  un `DrawerLink`. `findPersonDetail` rend le profil, les compétences par rang décroissant et les
  accompagnements du plus récent au plus ancien. **Un accompagnement d'un produit archivé y reste**,
  là où `listProjects` l'écarte : divergence assumée, la personne l'a mené. Sa singularité est
  l'adresse de repli — seule des trois pages hôtes, elle **reconduit les cinq filtres** dans
  `closeHref` et dans chaque lien de ligne, parce qu'ici l'URL nue effacerait la recherche que le
  panneau vient de servir (`docs/06` §9). Sa leçon est dans le harnais : **une fonction serveur se
  frappe en `text/plain`, jamais en urlencodé** — la charge est le tableau d'arguments encodé en
  Flight, et l'urlencodé rend un **404** là où TD.1 avait connu un 200 muet ; sans étape témoin, ni
  l'un ni l'autre ne prouve un refus.

- **TD.3 — 19/08/2026 — le bouton et le lien d'action.** Ticket **hors chantier**. Les trois chaînes
  de geste étaient à **vingt-sept** copies et non vingt-quatre : `app/(app)/equipe/page.tsx` en avait
  acquis trois le jour même de l'audit, et il **entre au périmètre** sur arbitrage humain — laissées
  là, `socleLock` les ferait tomber en TD.6. `components/ui/button.tsx` porte `Button` pour les neuf
  `<button>` et `BUTTON_PRIMARY`/`BUTTON_SECONDARY` pour les huit balises qui n'en sont pas ;
  `ACTION_LINK_SM` rejoint `ACTION_LINK`. **Vingt-trois adresses mesurées, vingt-et-une au HTML
  strictement identique**, et les deux écarts sont ceux annoncés : la dérivée de `/dev/session`
  (contraste recalculé, 12,97:1 → **13,65:1**) et les cinq `underline-offset-2` que
  `readings-panel.tsx` perd en cessant de redéfinir `ACTION_LINK`. Sa leçon est dans l'instrument :
  **le HTML servi en développement n'est pas déterministe** — la charge RSC embarquée change
  d'identifiants de rangée à chaque requête —, si bien qu'une comparaison brute mesure le bruit ; le
  DOM seul, `<script>` retirés, l'est. Et il **se met en défaut avant d'être cru** : un `rounded-xl`
  témoin dans la variante a fait bouger **les vingt captures** alors posées — chaque écran porte au
  moins le skip-link, si bien qu'aucune ne pouvait rester muette.

- **TD.5 — 19/08/2026 — le garde-fou de la règle 2 sur les espacements.** Ticket **hors chantier**.
  `spacingScaleLock` ferme le seul trou de la règle 2 — `--spacing` est un **pas**, pas une échelle —
  en trois clauses : multiplicateur fractionnaire hors `0.5`/`1.5`, dimension arbitraire sans jeton,
  épaisseur de bordure brute. **39 valeurs arrondies dans 12 fichiers**, au plus proche et à égalité
  vers le bas, plus `border-l-3` → `border-l-[length:var(--border-width-2)]`, à rendu identique. Trois
  arbitrages rendus avant écriture : aucune exception pour le rythme du bloc « Vision produit », les
  gabarits de grille restent des **points d'arrêt de mise en page** (arbitrage de T1.6), et la clause
  3 est une clause de plus que la fiche — sans elle, la correction rediverge. Sa mise en défaut n'est
  pas un témoin mais **l'inventaire lui-même** : la règle devait tomber sur les 12 fichiers relevés au
  `grep` et sur eux seuls, ce qu'elle a fait à quatre nœuds près — **ESLint signale un nœud, pas une
  occurrence**, et quatre `className` portaient deux classes fautives. Sa leçon est dans la portée du
  sélecteur : **une classe écrite hors d'un attribut `className` échappe aux trois clauses**, mesuré
  par sonde — la même limite attend `socleLock` en TD.6.

- **TD.6 — 19/08/2026 — le garde-fou du socle.** Ticket **hors chantier**, dernier des quatre et le
  seul qui ne retire rien : `socleLock` garde **six signatures** hors de `components/ui/`,
  `uiLayerSeal` scelle le socle contre les requêtes en valeur, les composants métier et les actions,
  et `--max-warnings=0` ferme le script `lint`. Deux arbitrages rendus avant écriture :
  `app/(app)/projets/page.tsx` **entre au périmètre** — ses deux contrôles recopiés faisaient échouer
  la règle, exactement le cas que TD.3 avait tranché sur `equipe/page.tsx` —, et la signature de
  `BlockNote` porte sur les **variantes retirées** par TD.4 et non sur celle qui reste, indiscernable
  de quatre paragraphes qui disent l'inverse d'une absence. **Son piège vaut pour toute règle à
  venir : le format plat d'ESLint écrase la valeur d'une règle, il ne la fusionne pas** — écrit
  naïvement, `socleLock` désactivait les trois clauses de TD.5 partout hors du socle, sans qu'aucun
  message ne le dise ; la reprise de `SPACING_CLAUSES` est mesurée des deux côtés de la frontière.
  Neuf témoins positifs, neuf témoins négatifs **tirés du dépôt vivant**, tous concluants. Deux
  écarts de rendu, sur `/projets` seulement et annoncés d'avance : un attribut `class` réordonné,
  et `w-full` gagné par les deux listes déroulantes de filtre — le rendu que `/equipe` sert déjà.

- **Les indicateurs associés repliés par défaut — hors ticket, le 18/08/2026.** Le rang 3 du bloc
  « Vision produit » devient un `<details>` fermé, dont `BlockDivider` sait être le `<summary>` — la
  question du produit reste seule à l'écran, ses cartes tiennent à un clic. Sa leçon :
  **`display: flex` retire à `<summary>` le triangle natif du navigateur**, ce que le `<details>` de
  la roadmap projet croyait conserver ; la marque de repli se pose donc en `mark`, comme le ★.

- **L'audit de la couche de présentation — hors ticket, le 18/08/2026.** Pas une ligne de code : un
  constat, une doctrine, trois fiches. Il dément la prémisse — **3,9 classes en moyenne par
  `className`**, **zéro** violation de couleur — et chiffre la dette : le **bouton** recopié 24 fois et
  **déjà dérivé**, l'état vide de bloc en **cinq variantes**, `ACTION_LINK` **redivergé** six jours
  après son extraction. Trois niveaux tranchés — composant, constante de classes, rien — `@apply` et la
  taxonomie de l'atomic design écartés, les dossiers ne bougent pas. Sa leçon est celle de T4.2,
  vérifiée cette fois contre le dépôt lui-même : **le coût n'est pas le balisage dupliqué mais les
  choix mesurés qu'il porte** — et un socle qu'on ne voit nulle part ne protège personne.

- **T5bis.5 — 19/08/2026 — le radar des compétences.** Le second dessin du projet, après la frise :
  `lib/queries/radar.ts` pur et testé, un SVG à `viewBox` rendu sur le serveur, et **le texte hors du
  SVG** — les libellés d'axe sont du HTML posé aux coordonnées mêmes des axes, la séparation qui avait
  rendu `path` possible à la courbe d'indicateurs. **Un écart de périmètre, arbitré avant écriture** :
  `lib/queries/team.ts` et son test entrent, faute de quoi `maxRank` n'aurait eu d'autre source que le
  plus haut rang **de la personne** — un profil « Intermédiaire partout » s'y dessinerait plein, soit
  l'indice calculé que D39 interdit. En dessous de trois compétences, aucun radar, et **aucune phrase
  ne le remplace**. Sa leçon est dans le balisage, et rien d'autre ne l'aurait trouvée : **React 19
  traite `<title>` en balise de métadonnée jusque dans un `<svg>`, et deux enfants la vident** —
  `<title>… de {fullName}</title>` rend `<title></title>`, donc un `role="img"` sans nom accessible,
  avec `tsc` et `eslint` au vert. La seconde se mesure : **un test d'étanchéité sur un maximum exige
  deux échelles différentes**, deux domaines amorcés à l'identique rendant la fuite indiscernable.

- **La pastille de statut, seule forme du statut — hors ticket, le 19/08/2026.** La page produit
  dessinait la même donnée de deux façons dans deux blocs consécutifs : pastille pleine dans la
  frise, point de 8 px dans la liste. `StatusDot` et sa table `DOT` disparaissent,
  `components/ui/status-dot.tsx` devient `status-pill.tsx` et porte `StatusPill` ; quatre écrans
  s'y alignent et **perdent le point médian** qui séparait deux suites de texte et n'a plus de rôle
  entre une pastille et une période. Septième clause de `socleLock`. Le périmètre est arbitré :
  `Tag`, `AvailabilityDot`, le sens d'un indicateur et les chips de filtre **ne bougent pas**. Sa
  leçon est dans la mesure : **le diff avant/après du DOM servi est la seule preuve qu'un
  remplacement n'a rien déplacé d'autre** — huit hunks sur quatre adresses, et le bloc de la frise
  **absent du diff**, ce qu'aucune lecture du code n'aurait établi.

- **T5bis.6 — 20/08/2026 — l'écriture : créer une personne, corriger son profil, poser ses
  compétences.** Les six gestes sur les deux objets, et C5bis cesse de livrer un référentiel qu'un
  script seul alimente. **Deux clés de la fiche étaient devenues indisponibles**, le découpage ayant
  précédé T5bis.3 et T5bis.4 : `personne=<uuid>` désigne la fiche en lecture, `competence` est le
  filtre conjonctif répétable. Trois arbitrages rendus avant écriture — `profil` (`nouveau` |
  identifiant) pour la saisie, parce que ce sont **deux droits** et qu'une clé unique aurait fait
  tomber la fiche avec le droit d'écrire ; `maitrise` pour la compétence, sa valeur restant
  polymorphe ; `archiver=<uuid>` plutôt que `=confirmation`, `/equipe` n'ayant pas d'objet de page.
  Un quatrième écart, de périmètre : `person-detail.tsx` entre, le câblage des six gestes vers la
  carte passant par lui (précédent de TD.3). Le décompte d'exclusivité passe **d'une clé à quatre
  sans qu'un caractère change**, pour la quatrième fois. Sa propriété la mieux payée est un
  non-geste : **une compétence ne se déplace pas** — le panneau de correction ne rend aucun contrôle
  de compétence, et `lockedSkillId` ignore ce que le formulaire porterait plutôt que de le refuser,
  la seule forme qui ne puisse pas se tromper. Sa leçon est dans le harnais, et c'est un **troisième
  200 muet** après ceux de TD.1 et de T5bis.4 : `$ACTION_REF_1` est rendu **sans attribut `value`**,
  un extracteur qui l'exige le saute, et Next répond `Failed to find Server Action` — un 500 que
  seule l'étape témoin distingue d'un refus.

- **Le bloc « Démarrage » — hors ticket, le 20/08/2026.** La page disait ce qui **a été fait** ;
  elle ne disait pas ce qu'on **peut** faire. `starters` et `starter_kind` (migration **0008**),
  quatre pistes amorcées, une carte par piste avec son lien sortant et un panneau « en savoir plus »
  (`?piste=<id>`). Quatre arbitrages rendus avant écriture — référentiel neuf plutôt que dérivation
  d'`activity_types`, même liste sur tous les accompagnements, adresses provisoires sur
  `example.com`, carte plus panneau. **Une seule clé d'URL là où Personae et Use Cases en ont deux**,
  et c'est la conséquence exacte de leur règle : la paire « une clé pour lire, une clé pour écrire »
  n'a rien à séparer quand il n'y a pas d'écriture — `starters` est un référentiel, D25 lui donne son
  écran en C7. Le décompte d'exclusivité passe **de six à sept clés sans qu'un caractère change**,
  pour la cinquième fois. Sept écarts consignés, dont l'ordre de `docs/06` §5 : le bloc passe devant
  « Ressources », D31 ne tenant que sur la position dominante de la roadmap. Sa propriété la mieux
  payée est la forme de sa lecture : **`listStarters` ne prend aucun identifiant**, si bien que rien
  n'y regarde le projet et que la jauge de complétion interdite est **non représentable**. Sa leçon
  est dans la mise en défaut : **neutraliser un critère de tri secondaire ne prouve rien en une
  exécution** — l'ordre rendu sans départage est arbitraire mais **stable**, celui de l'insertion,
  et la fixture doit insérer les ex æquo à rebours de l'alphabet pour que la neutralisation morde.
- **La page d'un accompagnement passe à `project-v2` — hors ticket, le 20/08/2026.** La maquette de
  Claude Design transposée, à fonctionnalités et à données constantes : en-tête en carte (statut,
  période et rang sur une ligne, geste principal en bouton primaire, « Archiver » sous un menu),
  **barre d'ancres collante** (`subnav.tsx`), corps à **deux colonnes** avec un rail de 380 px,
  roadmap en **liste à plat filtrée par pastilles**, « Démarrage » en cartes, blocs annoncés en trio.
  `ROADMAP_STATE_PARAM` (`etat`) est la **huitième clé de la page et la première qui n'ouvre rien** :
  hors de `PROJECT_PANEL_PARAMS` et du décompte d'exclusivité, reconduite par `closeHref`.
  `listProjectAdoptions` gagne `is_north_star` — une colonne dans un `select` existant, aucune
  migration. Quatre arbitrages rendus avant écriture, dont **le refus d'étendre la dérogation D39** :
  ni jauge ni « Encore 14 pts », alors que `targetGap` et `axisScale` les rendraient en trois lignes.
  Referme le point ouvert sur `Section`/`Block` — la page projet monte au format produit. Sa leçon :
  **une maquette faite hors du produit dessine ses interdits en toute bonne foi, et les dessine
  bien** ; ce qui permet de trancher n'est pas de relire la règle, c'est que la question se pose
  « étend-on la dérogation ? » plutôt que « peut-on ? ».
- **Le bouton, composant unique à trois rangs — hors ticket, le 21/08/2026.** `buttonClass()`
  rend la chaîne pour toute balise, `Button` couvre les `<button>` et place l'icône, `ButtonIcon`
  porte le glyphe ; `BUTTON_PRIMARY` et `BUTTON_SECONDARY` disparaissent. La doctrine du 18/08 sur
  `@apply` **est maintenue**, pour une raison neuve : c'est aussi ce que la documentation de Tailwind
  déconseille, et la fonction de variantes est le standard qu'ont formalisé `cva` et
  `tailwind-variants`. Aucune ligne de CSS écrite. Trois écritures rentrent au socle **par
  disparition** — les trois coquilles à deux attributs (le point ouvert se referme comme il le
  prescrivait), les deux boutons icône seule, et `disabled:opacity-60` recopié quatre fois. Deux
  écarts assumés à la demande : `tertiary` et les props d'icône de `Button` n'ont **aucun appelant**
  au jour où ils sont écrits. **34 balises bougent, et pas une de plus** : dépouillées de leur
  attribut `class`, elles sont strictement identiques des deux côtés. Sa leçon est dans
  l'instrument : **`tr` mappe caractère à caractère**, si bien que `tr '>' '>\n'` vaut `tr '>' '>'`
  — un comptage plausible et nul, que seul le témoin `rounded-xl` a redressé.

- **La roadmap reprise, la page projet dégraissée — hors ticket, le 21/08/2026.** Six gestes à la
  demande : lignes centrées, kebab en `tertiary` (premier appelant du rang écrit la veille sans
  aucun), « Ajouter une activité » remonté en haut à droite, **`activities.external_url`** avec son
  champ et son lien sortant, filtre de roadmap repassé **côté client**, « Projets liés » et la barre
  d'ancres retirés du rendu. Le bouton n'avait jamais bougé du code : c'est `SectionHeader` qui le
  faisait tomber — `basis-full` sur la note étirait le bloc titre à toute la largeur, `flex-wrap`
  renvoyait l'action dessous. **Un défaut de socle, corrigé pour les cinq blocs à la fois.**
  `activity_types.default_tool_id` trouve son **premier lecteur** : il nomme le lien, « Ouvrir dans
  Ergonome », et c'est ce qui évite de reconnaître un audit à son libellé. Premier fichier de tests
  d'action de `projets/` (7 cas). Deux classes de débogage, `bbb` et `aaaa`, servies dans le HTML
  depuis la veille, retirées. Sa leçon : **un espace de classes fermé rend les classes mortes
  invisibles** — `--color-*: initial` fait qu'aucune règle ne répond à `aaaa`, donc rien ne le
  signale, ni le navigateur, ni `tsc`, ni `eslint`.

- **Administration : le référentiel des entités — hors ticket, le 21/08/2026.** `entities` recevait
  ses lignes de `scripts/seed.ts` et **d'aucune écriture applicative** depuis T1.2. L'écran de D25
  arrive, **avancé de C7 sur un seul référentiel** : lister (archivées comprises), ajouter, corriger,
  archiver, rétablir, et **supprimer** — écart à la règle 4 arbitré par l'humain, borné à une ligne
  que rien ne référence et tenu par quatre choses : `DeletableTable`, la clé étrangère `restrict`, le
  décompte et le panneau. `docs/06` §8 obtient son entrée de navigation, et **l'interdit de lecture
  en base de T1.6 tombe pour la coquille** — la carte de la personne courante, elle, reste dehors
  (règle 3). Deux décomptes par ligne, parce qu'une entité dont tous les produits sont rangés est
  archivable sans être supprimable. Sa leçon est dans un `catch` : **une clé `restrict` rend `23001`
  et non `23503`**, et Drizzle enveloppe l'erreur du pilote dans un `DrizzleQueryError` sans `code` —
  un `catch` sur un code d'erreur est du code que seul le test qui le provoque met en défaut.

- **Un seul bloc d'accompagnements sur la page produit — hors ticket, le 21/08/2026.**
  « Accompagnements en cours » et « Tous les accompagnements » lisaient le même tableau, dans le même
  ordre, vers la même destination de clic : le doublon, assumé depuis T5.5, est refermé. Le second
  disparaît, le premier perd « en cours » de son titre et reçoit ce qui n'existait que là —
  **l'objectif et l'équipe** sur chaque ligne (colonne de 280 à 352 px, filets d'axe suivis),
  une section **« Sans date »** hors du filtre, et l'état vide qui porte le geste (`addHref`, idiome
  de `Personas`). Le filtre d'échelle passe **côté client** : les préréglages étaient des liens vers
  `?de=&a=`, donc une navigation — l'URL changeait, le défilement repartait en haut. Le serveur rend
  désormais **une frise par préréglage** et `ScaleSwitch` monte la bonne, si bien que le calcul reste
  entier dans `lib/queries/timeline.ts` : **960 tests passent sans qu'une ligne de test bouge**, ce
  qui est la preuve que rien n'a changé de place. `de`, `a`, `productRoadmapWindow` et le formulaire
  « De / à » disparaissent avec l'URL qu'ils écrivaient. Sa leçon : **une frise pré-rendue par
  fenêtre coûte une charge RSC, jamais un DOM** — c'est ce qui évite d'embarquer le schéma de la base
  dans le paquet du navigateur pour un `useState`.

- **La page produit : hiérarchie, regroupement, second rang effacé — hors ticket, le 21/08/2026.**
  Quatre gestes dans la foulée du bloc unique d'accompagnements, le même jour. **« Accompagnements »
  remonte** juste sous « Vision produit » — ce qu'on fait sur ce produit se lit avant ce que le
  produit est — et **rend les avatars d'équipe** reçus le matin : trop de place pour ce qu'ils
  disaient. **« Personae » et « Use Cases » fusionnent** en « Utilisateurs et usages », deux rangs à
  intertitre dans une seule carte : la distinction reste entière, le nombre de cartes tombe de
  quatre à trois. Les deux composants perdent leur coquille et deviennent `PersonasRank` /
  `UseCasesRank` ; **leurs états vides passent d'`EmptyState` à `BlockNote`**, ce qui est le critère
  déjà écrit dans `empty-state.tsx` — un rang qui a son intertitre n'a pas de titre à redonner à son
  quart vide — et évite au passage deux `h3` empilés. Les deux « Ajouter » entrent dans **un seul
  menu ⋮** en haut du bloc, au rang **tertiaire**, comme celui de « Vision produit » : c'est le rang
  des gestes de bloc, arbitré ce jour. En en-tête de page, **« Modifier ce produit » et « Archiver »
  entrent dans un kebab `secondary`** — la forme de la page projet —, et « Nouvel accompagnement »
  reste seul visible. Sa leçon : **un menu ne rend ses entrées qu'ouvert**, donc un geste qui n'existe
  que là est invisible au `curl` ; c'est le bouton et son `aria-label` qui se lisent dans le HTML
  servi, et le second chemin — le lien inline du paragraphe d'absence — qui garde le geste
  atteignable sans JavaScript.

- **T5bis.7 — 25/08/2026 — la sélection d'équipe du formulaire de projet, refondue.** Le dernier
  ticket de C5bis, et celui qui fait cesser un doublon : le formulaire **puise** dans le référentiel
  au lieu de le doubler. Chaque ligne porte le métier et la disponibilité à côté du nom — deux
  valeurs **reportées**, jamais un tri ni un rapprochement avec les métiers déclarés (D44) —, et le
  bloc « Ajouter une personne » de T2.6 disparaît (arbitrage (g)), remplacé par un lien vers
  `/equipe?profil=nouveau`. Quatre arbitrages rendus avant écriture, dont **la septième lecture** :
  `jobs` est lu **deux fois**, une fois pour les cases à cocher avec l'exception nominative de
  T4bis.1, une fois `includeArchived` pour les seuls libellés — sans quoi le métier d'une personne
  s'afficherait ou non **selon le projet qu'on est en train de modifier**. C'est le précédent des
  entités, resservi. Referme deux points ouverts d'un coup, et le second sans l'avoir cherché :
  « on n'ajoute qu'une personne par enregistrement », et **`PERSON_KIND_LABEL` en deux exemplaires
  divergents** — l'écran qui portait l'autre vocabulaire n'existe plus, l'arbitrage éditorial n'a
  plus d'objet. Sa propriété la mieux payée est une **non-lecture** : `readProjectForm` ne connaît
  plus `newPersonName`, si bien qu'une soumission forgée ne se heurte à aucun refus — elle n'a nulle
  part où aller. **Mesuré** : POST forgé avec étape témoin, `persons` à 13 avant et après,
  `projects` de 11 à 12.

**C6 — Liens et journal**

*(les sept lignes ci-dessous repliées d'`ETAT.md` le 27/08/2026, geste 1 de la session de découpage
de C7 — la dernière de ce genre, `docs/05` §5 n'ayant pas de huitième chantier. Elles sont reprises
**verbatim**, remises dans l'ordre chronologique comme les blocs qui précèdent : `ETAT.md` les
portait du plus récent au plus ancien. Le récit détaillé des sept vit plus bas dans ce fichier.)*

- **T6.1 — le journal : la couche d'écriture, et les gestes du projet, 26/08/2026.** `record()`
  seizième entrée de `forDomain`, `lib/journal.ts` et ses deux formes de phrase, cinq points d'appel.
  Les cinq gestes frappés sur le **vrai point d'entrée HTTP**, aucune ligne de sonde laissée. Quatre
  mises en défaut, dont **une a corrigé le code**. +27 tests, 986 verts.

- **T6.2 — le journal : activités, ressources, résultats, relevés, 26/08/2026.** Les quatre
  `target_type` restants, **quatorze** points d'appel là où la fiche en annonçait treize, six noms et
  une troisième forme de phrase. Les relevés portent `product_id` et **pas** `project_id`, mesuré en
  base. Quatre gestes frappés sur le **vrai point d'entrée HTTP**, trois états vides lus dans le HTML
  servi, aucune ligne de sonde laissée. Trois mises en défaut isolées. +31 tests, 1017 verts.

- **T6.3 — le bloc « Journal » sur la page projet, 27/08/2026.** `listProjectJournal`, le `<details>`
  fermé en dernier, « Voir le journal » **devenu le `<summary>`** ; `SectionHeader` apprend `as` et
  `mark`. **Deux mises en défaut ont corrigé les tests.** Sonde d'archivage. +11, 1028 verts.

- **T6.4 — les liens déduits, et le bloc « Projets liés », 27/08/2026.** `listRelatedProjects`, les
  quatre règles de `docs/04` §5 **en SQL**, la préséance seule en TS. **Dix neutralisations, dix
  chutes isolées.** Une seule entité en base : deux règles inatteignables, lues sous sonde. +20, 1048.

- **T6.5 — les liens déclarés : relier, dire pourquoi, retirer, 27/08/2026.** `project_links` a un
  lecteur et trois écrivains ; huitième clé d'URL, **cinquième verbe**, quatrième forme de phrase.
  **Vingt-six neutralisations, trois ont corrigé le ticket.** Lu sur les **deux** projets. +53, 1101.

- **T6.6 — le flux d'activité récente en vue d'ensemble, 27/08/2026.** `listRecentEvents`, première
  lecture d'`events` qui traverse le domaine ; la vue d'ensemble perd l'état vide de T1.6. **Huit
  neutralisations, deux ont corrigé le ticket.** Deux origines, trois états vides, lus servis. +14, 1115.

- **T6.7 — la vue d'ensemble entière : répartition, fraîcheur, accès direct, 27/08/2026.** Clôt C6.
  Trois lectures, trois blocs ; les clés de filtre montent dans `lib/navigation.ts`. **Seize
  neutralisations, deux ont corrigé le ticket.** Onze chiffres suivis, onze concordances. +29, 1144.

---

## Journal des tickets — récit détaillé

*(une entrée par ticket terminé, dans l'ordre chronologique)*

- **T1.1 — 11/08/2026 — initialisation du projet.** Next 16.3 · React 19.2 · Tailwind 4.3 ·
  TypeScript strict · Netlify. Les 100 primitives de couleur et les 77 tokens sémantiques du
  design system sont vérifiés un à un contre le document, zéro écart. Deux écarts de périmètre,
  tous deux assumés et consignés au journal technique : les quatre couleurs d'aires thérapeutiques
  Servier ne sont pas traduites, et `next dev` a dû être bridé pour cesser d'écrire dans
  `CLAUDE.md`.
- **T1.2 — 12/08/2026 — schéma de la base de données.** Les 23 tables de `docs/04` en une
  migration, appliquée sur la base Neon. 22 tables portent un `domain_id` non nul avec clé
  étrangère vers `domains` — seule `domains` n'en a pas, par nature. 75 clés étrangères,
  15 types énumérés, 7 contraintes `CHECK`, 76 index. Les rejets ont été éprouvés en base, pas
  seulement déclarés : 7 écritures illégales sur 7 refusées. Écart assumé et consigné : le
  `domain_id` a été ajouté sur les tables de liaison, que le document ne détaille pas.
- **T1.3 — 12/08/2026 — couche d'accès scopée.** `lib/db/scoped.ts` est le seul module qui importe
  `db`, vérifié par `grep`. 15 tests passent sur une branche Neon dédiée. Les tests ne se contentent
  pas de passer : le filtre de domaine a été neutralisé pour voir tomber 9 tests sur 15, et les deux
  règles d'intégrité pour en voir tomber exactement 3. Les trois dettes ouvertes par T1.2 sont
  refermées : résultat sur activité `done`, recalcul de `last_activity_at`, cohérence du `domain_id`
  avec les parents — cette dernière **dérivée des clés étrangères du schéma**, pas d'une liste
  écrite à la main. Écarts de périmètre, tous consignés au journal : la mise en place de Vitest
  (dépendance, `vitest.config.mts`, script `test`, `.env.example`), sans laquelle « tests associés »
  n'a pas de sens.
- **T1.4 — 12/08/2026 — contexte de session (stub).** `lib/auth/session.ts` porte la forme
  définitive — `person`, `domain`, `domainId`, `role`, `can`, et la couche d'accès déjà scopée sur
  le couple domaine/personne, si bien qu'une écriture porte son `created_by` sans que l'appelant y
  pense. La source d'identité est isolée dans `lib/auth/provider.ts`, **le seul fichier que C7
  réécrit** : `session.ts` n'importe rien de Next, le fournisseur appelle le contexte et jamais
  l'inverse. 19 tests s'ajoutent aux 15 de T1.3, et ils ont été mis en défaut avant d'être crus :
  `manageDomain` neutralisé fait tomber exactement les 4 tests du responsable, le filtre
  `is_contributor` inversé exactement les 2 tests du contributeur. La bascule a aussi été observée
  peuplée sur la branche de test, formulaire soumis sans JavaScript. Deux écarts assumés et
  consignés au journal : le responsable de domaine écrit sur tous les projets — arbitrage sur un
  silence de D9 —, et les tests eux-mêmes, que le périmètre du ticket ne mentionnait pas.
- **T1.5 — 12/08/2026 — référentiels et données factices.** `scripts/seed.ts` amorce
  « Groupe Meridian » : 142 lignes sur 20 tables, dont les six référentiels — 5 entités, 6 métiers,
  7 approches, 4 statuts avec leur `nature`, 4 outils, 25 types d'activité en 6 familles — puis les
  données du brief : 2 produits, 3 projets, 12 activités, 2 résultats, 1 ressource, 1 indicateur,
  3 relevés, 1 adoption. **Le critère est tenu et vérifié en base** : la seconde exécution ne crée
  ni ne met à jour aucune ligne, et les comptes relus par la couche scopée correspondent un à un à
  la fixture. Le rapprochement se fait par clé naturelle, pas par identifiant, et les valeurs
  `numeric` sont normalisées avant comparaison — sans quoi le script réécrivait les mêmes lignes à
  chaque passage. `/dev/session` sert désormais sept comptes ; Marc Tellier, sans compte Vision,
  n'y figure pas, et la portée d'écriture d'un contributeur se limite bien à son projet. Écarts
  assumés et consignés : `tsx` déclaré pour pouvoir lancer un `.ts` (il était déjà là en dépendance
  transitive) ; un 25ᵉ type d'activité, « Atelier de priorisation », que le brief nomme et que
  `docs/03` n'a pas ; trois inventions hors brief — un responsable de domaine, les métiers, les
  participants d'activité —, chacune motivée par un critère de validation à venir.
- **T1.6 — 12/08/2026 — coquille applicative.** Six routes en français sous le groupe `(app)`,
  qui porte la coquille et laisse `/dev/session` en dehors : navigation à quatre entrées dans
  l'ordre Vue d'ensemble · Produits · Projets · À propos, fil d'Ariane sur les deux pages de
  détail, et les quatre composants de base — page, section, liste, état vide — posés d'après les
  maquettes. **Le critère est vérifié, pas affirmé** : six routes à 200, une URL inconnue à 404,
  et l'ordre de tabulation lu dans le rendu — lien d'évitement, logo, les quatre entrées dans
  l'ordre, puis le contenu, avec `aria-current="page"` sur l'entrée courante et sur le dernier
  maillon du fil d'Ariane seulement. Le focus visible a été **mesuré** plutôt que constaté : le
  contour `border/focus` du design system tombe à 2,87:1 sur le fond primaire de la barre
  latérale, sous les 3:1 exigés ; il passe au token clair sur ce fond, et là seulement. Deux
  couleurs de texte reprises des maquettes échouaient de même (2,11:1) et ont été relevées d'un
  cran dans la couche sémantique. Aucune lecture en base, vérifié par `grep` : le seul import de
  `lib/` est `lib/navigation`. Écarts assumés et consignés : deux blocs de la maquette écartés
  faute de droit de lire la session — carte de la personne courante et entrée Administration ;
  `/a-propos` laissée vide comme les cinq autres alors que son contenu ne coûterait rien.
- **T2.1 — 12/08/2026 — liste des produits.** Le premier écran vivant de Vision. **Le critère est
  tenu et lu dans le HTML servi**, pas affirmé : « Déclaration de sinistre en ligne · Assurance ·
  1 accompagnement · juin 2026 » et « Espace client web · Banque de détail · 2 accompagnements ·
  août 2026 ». Le ticket a forcé à trancher la fraîcheur, que `ETAT.md` renvoyait à C2 : les
  activités `planned` sortent du calcul de `last_activity_at`, sur l'**état** et jamais sur
  l'horloge — un champ stocké qui dépendrait de `current_date` serait faux le lendemain. Sans quoi
  la colonne affichait octobre 2026 et septembre 2026 sur un écran daté du 12 août. Les deux tests
  ajoutés ont été mis en défaut séparément : la condition `planned` retirée fait tomber le test de
  l'activité prévue et lui seul ; `in_progress` exclu en plus fait tomber celui de l'activité en
  cours et lui seul. La couche gagne `refreshLastActivity`, sans quoi la décision ne s'appliquait
  qu'aux écritures futures ; l'amorçage l'appelle et reste idempotent sur la fixture — vérifié.
  Un défaut trouvé en vérifiant, corrigé : `?entite=` non conforme à un UUID rendait 500, la forme
  est désormais vérifiée avant la base. Écart assumé et consigné : le périmètre déborde sur
  `lib/db/scoped.ts`, ses tests et `scripts/seed.ts` — c'est le prix d'une décision sur un champ
  dénormalisé.
- **T2.2 — 12/08/2026 — page produit, version socle.** **Le critère est tenu et lu dans le HTML
  servi** : sur « Espace client web », « Autonomie des opérations courantes · depuis février 2026 »
  précède « Refonte du parcours de virement · mars 2024 → septembre 2024 ». « Le plus récent » se
  lit sur `started_on`, la date de l'accompagnement, et non sur `last_activity_at` : une activité
  saisie aujourd'hui sur un projet clos en 2024 ne doit pas le faire remonter en tête d'une
  chronologie. Les deux points ouverts que T2.1 renvoyait ici sont refermés : `/produits/{id}` rend
  404 sur un identifiant mal formé comme sur un identifiant inconnu — vérifié, 404 et non 500 — et
  le motif d'UUID vit désormais dans `lib/uuid.ts`, d'où T2.4 le reprendra. Les huit tests ajoutés
  ont été **mis en défaut un à un** : le tri par nom seul fait tomber le test de l'ordre et lui
  seul, les projets archivés réintégrés celui de l'archivage, les filtres de domaine retirés ceux
  de l'étanchéité. Ce faisant, une propriété non écrite est apparue : chaque filtre de domaine
  **seul** est rattrapé par celui de la table jointe voisine — l'étanchéité ne tombe qu'en en
  retirant deux. Le contraste des pastilles d'équipe a été **mesuré** avant d'être cru : le premier
  choix donnait des initiales à 15:1 sur une pastille à 1,04:1 du fond, c'est-à-dire une forme
  invisible ; la palette de la maquette rétablit 7,11:1 des deux côtés. Écarts assumés et
  consignés : le fichier de tests lui-même, l'alias `@/` ajouté à `vitest.config.mts` sans lequel
  il ne s'exécute pas, et le motif d'UUID déplacé hors de `app/(app)/produits/page.tsx`.
- **T2.3 — 12/08/2026 — liste transverse des projets.** **Les trois critères sont tenus et lus
  dans le HTML servi** : les filtres se combinent — entité seule 2 projets, plus le statut 1, plus
  un métier que ce projet ne déclare pas 0 —, le compteur suit à chaque étape, et « Retirer tous
  les filtres » pointe sur `/projets` nu. La recherche trouve par le nom, par l'objectif et par un
  membre. Quatre dimensions plus une recherche ont écarté la forme en pastilles de T2.1, qui en
  aurait produit une vingtaine : un `form method="get"`, sans JavaScript, l'écran restant serveur —
  arbitrage rendu avec l'humain. L'ordre de tabulation est lu dans le rendu : recherche, les quatre
  listes, « Filtrer », puis les lignes. La ligne n'est **pas** cliquable en entier — elle porte deux
  liens, le projet et son produit, et un `<a>` n'en contient pas un autre. Les 22 tests ajoutés ont
  été mis en défaut : `nulls last` ôté fait tomber le tri et lui seul, l'échappement du motif de
  recherche fait tomber le test du joker et lui seul, le produit archivé réintégré en fait tomber
  trois. Ce faisant, la propriété relevée par T2.2 s'est confirmée et amplifiée : ici **quatre**
  filtres de domaine se rattrapent l'un l'autre, et il faut les retirer tous les quatre pour voir
  l'étanchéité tomber. Une affirmation de ma part n'a pas résisté et a été corrigée dans le code
  comme dans le journal : sur un filtre à valeur unique, une jointure ne dupliquerait rien —
  `exists` reste retenu, pour une autre raison. Le contraste des bordures de champ a été **mesuré**
  avant d'être cru : aucun jeton `border-*` du design system n'atteint les 3:1 qu'exige la limite
  d'un composant d'interface ; `content-neutral-normal` est retenu à 3,88:1. Écarts assumés et
  consignés : `formatProjects` dans `lib/format.ts`, la table de couleurs de statut sortie de la
  page produit vers `components/ui/status-dot.tsx`, et le fichier de tests.

- **T2.4 — 12/08/2026 — page projet, en-tête et équipe.** **Le critère est tenu et lu dans le HTML
  servi** : « 2ᵉ accompagnement de ce produit » sur « Autonomie des opérations courantes »,
  « 1er accompagnement de ce produit » sur les deux autres — aucune colonne ne porte ce rang, il se
  déduit de la place du projet dans la chronologie de son produit. Le rang lit le même ordre que la
  page produit, `started_on` puis le nom : **son miroir exact**, si bien que le numéro affiché ici
  et la position affichée là-bas ne peuvent pas se contredire. Trois arbitrages rendus avec
  l'humain avant écriture : le rang s'affiche dès 1 — `docs/06` §7 pose la règle sans condition, la
  maquette le masquait —, il pointe vers la page produit et non vers l'accompagnement voisin, et
  l'équipe s'écrit en toutes lettres à côté des pastilles. Les 13 tests ajoutés ont été **mis en
  défaut un à un** : le filtre d'archivage retiré du calcul de rang fait tomber trois tests, le
  filtre de produit quatre, la garde sur `started_on` un seul, le tri des approches un seul, celui
  de l'équipe un seul. La propriété relevée par T2.2 et T2.3 s'est vérifiée une troisième fois :
  retirer le seul `filter(projects)` de la requête d'identité ne fait **rien** tomber — les trois
  tables jointes se rattrapent, et il faut retirer les quatre filtres pour voir l'étanchéité céder.
  Le contraste a été **mesuré** avant d'être cru : le gris de la maquette pour la pastille d'un
  intervenant côté entité tombe à 2,22:1 sur la carte comme sous ses initiales — une pastille qu'on
  devine ; `surface-neutral-base` la rétablit à 4,98:1 des deux côtés. Écarts assumés et consignés :
  `formatRank` dans `lib/format.ts`, la pastille `Avatar` extraite d'`AvatarGroup`, deux composants
  neufs — `field.tsx`, `tag.tsx` — et le fichier de tests.

- **T2.5 — 12/08/2026 — création et édition d'un produit.** Le premier écran d'écriture de Vision.
  **Le critère est tenu et lu dans le HTML servi** : « Nouveau produit » et « Modifier ce produit »
  apparaissent une fois chez Camille Roux, zéro fois chez Léa Fontaine, et aucune adresse de
  formulaire ne fuit dans son rendu ; les deux routes lui répondent 404. Mais le verrou qui compte
  est ailleurs : les champs d'action ont été récoltés sur la page servie au responsable puis
  **repostés sous le cookie du contributeur** — l'action rend son refus, et la base ne bouge pas.
  Une action serveur est un point d'entrée HTTP, atteignable sans jamais charger la page qui
  l'affichait. Le parcours entier a été joué **sans une ligne de JavaScript**, par soumission
  `multipart` reconstituée : création → 303 vers la page du produit, qui l'affiche avec son entité,
  sa description et « Aucun accompagnement » ; modification du nom, de l'entité et du type →
  reflétée sur les deux écrans et relue en base, `domain_id` et `created_by` posés par la couche
  sans que l'appelant y pense. Les trois refus ont été éprouvés séparément : nom vide, entité
  absente du domaine — refusée par `assertPreconditions`, pas par l'écran —, type hors de
  l'énuméré ; dans les trois cas la saisie revient dans le formulaire. Les 20 tests ajoutés sont
  les premiers du projet à **ne toucher aucune base**, la validation ayant été isolée pour cela, et
  ils ont été mis en défaut un à un : la règle du nom retirée fait tomber 5 tests, celle de la
  forme de l'entité **1 seul**, celle du type 2, le rognage des espaces 2, la description ramenée à
  `null` 2, et `parseProductForm` rendant une ligne malgré les erreurs 2. Un `as` sur le type de
  produit a été retiré avant livraison : vrai ce jour-là, faux le jour où l'énuméré s'allonge. Le
  contraste a été **mesuré** avant d'être cru sur les douze couples du formulaire, et deux
  corrections en sont sorties — le design system n'ayant pas plus de jeton de bordure d'erreur que
  de bordure de contrôle, `content-danger-base` est retenu à 5,19:1, et le filet de la carte de
  type est passé de `surface-neutral-lighter` (1,18:1, une carte qu'on devine) à
  `content-neutral-normal`. Deux mesures fausses de ma part ont été corrigées en vérifiant, toutes
  deux des défauts de lecture du HTML et non du code. Écarts assumés et consignés : `action` sur
  `PageHeader`, deux routes dans `ROUTES`, et le fichier de tests.

- **T2.6 — 13/08/2026 — création et édition d'un projet.** Le ticket qui clôt C2, et le premier
  qui écrit **cinq tables** là où T2.5 en écrivait une. **Le critère est tenu et lu dans le HTML
  servi** : un accompagnement créé sur « Espace client web » apparaît aussitôt sur sa page produit,
  en tête de la chronologie, et dans la liste transverse, dont le compteur passe de 3 à 4 projets ;
  la liste des produits passe de 2 à 3 accompagnements pour ce produit — c'est elle qui a imposé un
  `revalidatePath` de plus, une liste de produits affichant un compte de projets. Le parcours
  entier a été joué **sans une ligne de JavaScript**, par soumissions `multipart` reconstituées :
  création, quatre éditions, et une re-soumission **à l'identique** qui ne crée aucun doublon de
  liaison ni de personne — le diff est idempotent, relu en base. Quatre arbitrages rendus avec
  l'humain avant écriture : l'ajout manuel d'une personne est implémenté — D9 écarte la création à
  la volée d'un **projet**, pas d'une personne, et D19 décrit exactement ce cas ; l'équipe se
  saisit en une valeur par personne plutôt qu'en deux cases, ce qui rend l'état « contributeur sans
  être membre » **inatteignable** au lieu de le rattraper ; la période se saisit au jour et se lit
  au mois, `input type="month"` n'existant pas sous Firefox ; et l'entrée depuis la page produit
  pré-sélectionne le rattachement. Le droit a été éprouvé par l'action et pas par l'écran : champs
  récoltés chez Camille Roux, **repostés sous le cookie de Léa Fontaine** — refus rendu, zéro
  projet et zéro personne créés, contrôlé en base ; les deux routes lui répondent 404 et aucune
  adresse de formulaire ne fuit dans ses trois écrans. Sept refus éprouvés séparément — nom vide,
  produit absent, statut absent, fin antérieure au début, date impossible (`2026-02-31`), métier
  puis personne d'un autre domaine —, et dans les sept cas la saisie revient dans le formulaire.
  Les 45 tests ajoutés ne touchent aucune base et ont été **mis en défaut un à un** : la règle du
  nom retirée fait tomber 5 tests, l'aller-retour de `isIsoDay` 3, `valueOrNull` 2,
  `parseProjectForm` rendant une ligne malgré les erreurs 2, et **un seul** pour chacune des cinq
  autres — l'ordre des dates, le dédoublonnage des cases, la forme du produit, le filtre `none` de
  l'équipe, le rôle du bloc d'ajout. Le contraste a été mesuré sur les neuf couples du formulaire
  et **aucune correction n'en est sortie** — c'était le but : le formulaire ne reprend que des
  couples déjà mesurés en T2.3 et T2.5. Une généricité a été écrite puis retirée avant livraison :
  une fonction commune à `project_jobs` et `project_approaches` ne compilait qu'au prix d'un
  `as never`, et deux fonctions jumelles de quinze lignes valent mieux qu'une affirmation de type.
  Deux points ouverts se referment : le commanditaire est **vu peuplé** pour la première fois, et
  la suppression réelle d'une ligne de liaison est confirmée au premier écran qui retire un membre.
  Écart de périmètre assumé et consigné, contre le plan annoncé : `lib/queries/projects.ts` a été
  touché — les deux écrans font les mêmes six lectures, et les dupliquer aurait installé la
  divergence. Les autres écarts : trois entrées dans `ROUTES`, et le fichier de tests.

- **T3.1 — 13/08/2026 — roadmap du projet, lecture.** Le premier écran de C3, et le bloc dominant
  de la page projet (`docs/06` §5) : l'état vide annoncé par T2.4 laisse la place au récit de
  l'accompagnement. **Le critère est tenu et lu dans le HTML servi**, pas affirmé : sur « Autonomie
  des opérations courantes », les cinq activités sortent dans l'ordre exact de la fiche — Atelier de
  priorisation (août 2026) · Audit UX (octobre 2026) · Formation (À planifier) · Audit
  d'accessibilité (juin 2026) · Test utilisateur (mars 2026) —, sous les quatre intitulés En cours ·
  Prévu · À planifier · Terminé ; et l'état vide s'affiche sur « Refonte de l'espace documents ».
  Les deux autres projets confirment qu'un groupe sans activité ne s'affiche pas : « Refonte du
  parcours de virement » ne rend que « Terminé », ses quatre activités de septembre 2024 à avril
  2024, et « Dématérialisation de la déclaration » n'a pas de groupe « En cours ». Deux arbitrages
  rendus avec l'humain avant écriture : l'ordre interne des groupes — **le passé se lit à rebours,
  le présent et l'avenir dans le sens de la marche**, l'ordre de déclaration pour « À planifier »
  qui n'a aucune date —, et la période d'une activité sans date qui s'écrit « À planifier » plutôt
  que de rester vide. Les 15 tests ajoutés ont été **mis en défaut un à un** : le filtre
  d'annulation retiré fait tomber 3 tests, celui d'archivage 3, le sens du passé inversé 3, celui de
  l'avenir 4, le départage par `created_at` retiré 4. Ce faisant, du code écrit s'est révélé mort et
  a été supprimé : le rang de groupe du `order by`, neutralisé, ne faisait tomber **aucun** test —
  le regroupement se fait en mémoire, et le SQL n'a à garantir que l'ordre à l'intérieur d'un
  groupe. La propriété relevée depuis T2.2 s'est vérifiée une cinquième fois : chaque filtre de
  domaine **seul** est rattrapé par la jointure voisine, et il faut les retirer tous les deux pour
  voir l'étanchéité céder. Le contraste a été **mesuré** sur les huit couples de l'écran et aucune
  correction n'en est sortie — c'était le but, aucun couple n'étant neuf. Une valeur visuelle a été
  écrite puis retirée avant livraison : `tracking-wide` reprenait l'interlettrage de la maquette au
  prix d'un `.025em` venu de Tailwind, que le design system ne définit pas et que la règle 2
  interdit. Aucun écart de périmètre : les cinq fichiers du plan, et le fichier de tests.

- **T3.2 — 13/08/2026 — panneau latéral de saisie.** L'inconnue technique de tout C3, levée : **un
  panneau modal sans une ligne de JavaScript.** La réponse tient en deux mécaniques HTML.
  L'ouverture est une **URL** — `?activite=nouvelle` sur la page projet, qui n'est pas un écran de
  plus mais le même avec un paramètre : il n'y a pas d'état client à conserver, donc le contexte est
  conservé par construction. La tabulation est **l'ordre du DOM** — le panneau est rendu avant le
  contenu, et le contenu porte l'attribut `inert` tant qu'il est ouvert. **Les critères sont tenus
  et lus dans le HTML servi** : le panneau s'ouvre depuis les deux points d'entrée — en tête du bloc
  roadmap sur « Autonomie des opérations courantes », et dans l'état vide sur « Refonte de l'espace
  documents » —, et les **trois** sorties (la croix, « Annuler », le voile) pointent toutes sur la
  page nue, qui ne contient alors ni `role="dialog"` ni attribut `inert`. L'ordre de tabulation a été
  **extrait du rendu et non supposé** : lien d'évitement · logo · les quatre entrées de navigation ·
  la croix · les six contrôles du formulaire · « Annuler », et **rien après** — les cinq éléments
  focalisables de la page sont sous le `inert`, et le voile porte `tabIndex="-1"`. **Un cinquième
  fichier s'est ajouté après livraison, à la demande de l'humain** : le panneau laissait la
  tabulation en sortir, et un cycle fermé n'a aucun équivalent HTML — `tabindex` réordonne, il ne
  boucle pas. La moitié qui ne coûte rien est restée sans script : `autofocus` sur la croix, un
  attribut que React 19 rend bien dans le balisage servi, si bien qu'à l'ouverture le focus est déjà
  dans le panneau et sur la sortie. L'autre moitié est `components/ui/focus-trap.tsx`, un composant
  client de la même forme que `project-form.tsx` depuis T2.5 — le socle marche sans lui, il ferme le
  cycle, ajoute Échap, et pose `aria-modal` **au moment seulement où l'attribut devient vrai**. Le
  tout a été **éprouvé dans Chrome, touches réellement dépêchées** : la 13ᵉ tabulation atteint
  « Annuler », la 14ᵉ revient sur la croix, aucun arrêt ne sort du panneau, Maj+Tab reboucle dans
  l'autre sens, un focus posé de force dans la barre latérale est ramené, et Échap ferme. Puis
  **JavaScript désactivé** : le panneau se rend, `aria-modal` est absent, `inert` est là, la croix
  ferme vraiment, et le focus repose sur « Fermer le panneau » — lu dans l'arbre d'accessibilité,
  faute de pouvoir évaluer quoi que ce soit dans ce mode. Le droit a été
  éprouvé sur **quatre couples personne × projet**, et il fallait bien quatre : Léa Fontaine, témoin
  de refus de T2.5 et T2.6, est contributrice désignée sur les deux projets d'essai — elle testait
  `manageDomain`, pas `writeProject`. Repris avec Inès Kaddour (contributrice sur le premier
  seulement) et Sofia Marchand (sur aucun), ce qui montre ce qu'un seul témoin aurait manqué : le
  droit est **par projet**, la même personne voit l'action sur l'un et pas sur l'autre. Chez qui ne
  peut pas écrire, l'URL d'ouverture rend la page nue — 200 et non 404, la page projet restant
  lisible par tout le domaine (D9). Le contraste a été **mesuré avant d'être cru sur les quatorze
  couples de l'écran, et une correction en est sortie** : le filet retenu partout depuis T2.3,
  `content-neutral-normal`, tombe à **1,46:1 contre le voile** — une limite de panneau qu'on devine ;
  `content-neutral-dark` la rétablit à 3,05:1 côté voile et 8,12:1 côté panneau. C'est ce filet qui
  porte la séparation, l'ombre de la maquette étant interdite — le design system nomme ses élévations
  sans les définir, et ce ticket est exactement le composant que cette dette attendait depuis T1.1.
  Deux arbitrages rendus avec l'humain avant écriture : le formulaire est posé **en entier** dès
  maintenant, ses deux référentiels lus dans la page faute de pouvoir toucher `lib/queries` — T3.3
  les déplacera —, et un **seul** paramètre d'URL dont la valeur porte le cas, que T3.4 réutilisera
  tel quel avec un identifiant d'activité. **Un seul écart de périmètre**, consigné :
  `components/ui/focus-trap.tsx`, le cinquième fichier ci-dessus. Aucun fichier de tests — le premier
  ticket depuis T1.3 à n'en ajouter aucun, le ticket ne posant aucune fonction pure à éprouver.

- **T3.3 — 13/08/2026 — création d'une activité.** Le pivot de C3, et le seul ticket du chantier
  qui portait une logique neuve : **l'état ne se saisit pas, il se déduit de la période.**
  **Le critère est tenu et lu dans le HTML servi**, un cas par groupe sur « Autonomie des opérations
  courantes » : janvier 2026 → « Terminé », 10 août → 15 septembre → « En cours », décembre 2026 →
  « Prévu », case cochée → « À planifier ». La fraîcheur suit dans la liste transverse **et sait ne
  pas suivre** — elle passe d'août à **septembre** 2026 sur l'activité en cours, et les deux
  activités prévues qui suivent, dont une en décembre, ne la déplacent pas : la règle de T2.1,
  vérifiée ici pour la première fois par un écran d'écriture. C'est la liste des **produits** qui a
  imposé un `revalidatePath` de plus, elle aussi porteuse de cette fraîcheur. Le parcours entier a
  été joué **sans une ligne de JavaScript**, de deux façons : par soumissions `multipart`
  reconstituées sans en-tête `Next-Action` — ce sont les champs cachés `$ACTION_…` du balisage servi
  qui portent l'action —, puis **dans Chrome, scripts coupés**, où `aria-modal` absent prouve que
  `FocusTrap` n'a pas tourné : un refus rend le panneau ouvert avec son bandeau, son type
  resélectionné et son objectif réaffiché, et la même saisie corrigée par la case aboutit,
  referme le panneau et paraît dans la roadmap. **Une affirmation de ma part n'a pas résisté à la
  vérification et a été corrigée dans le code** : j'avais écrit que l'identifiant du projet, lié
  côté serveur, « ne transite par aucun champ ». Il transite — Next sérialise l'argument lié dans
  `$ACTION_1:1`, **en clair en développement**. La liaison range l'identifiant hors de la saisie,
  elle ne le protège pas. Le verrou est ailleurs et il tient : `writeProject` est interrogé sur le
  `projectId` **reçu**, et repointer la liaison de son propre panneau vers un projet où l'on n'écrit
  pas est refusé — éprouvé. Le droit l'a été sur le témoin que T3.2 avait appris à choisir : Sofia
  Marchand, contributrice sur « Refonte du parcours de virement » et sur lui seul — l'action lui est
  offerte là-bas et absente ici, et les champs récoltés chez Camille Roux puis **repostés sous son
  cookie** rendent un refus, **zéro ligne créée, contrôlé en base**. **Sept refus éprouvés
  séparément**, et dans les sept cas la saisie revient dans le panneau : type absent, période absente
  sans « à planifier », fin antérieure au début, « à planifier » cochée avec une période, **fin sans
  début**, date impossible (`2026-02-31`), type hors du domaine. Le cinquième est un arbitrage rendu
  en ouverture de ce ticket : une fin seule à venir n'a **aucun état légal**
  (`activities_planned_requires_period_or_unscheduled` exige un début), et dériver `done` pour une
  fin passée aurait fait deux comportements pour une même forme de saisie. Les 36 tests ajoutés ne
  touchent aucune base et ont été **mis en défaut un à un, douze fois** : chaque neutralisation en
  fait tomber entre 1 et 3, jamais zéro — la dérivation `done` neutralisée fait tomber exactement
  « période entièrement passée », « fin à la veille du jour même » et la ligne rendue par
  `parseActivityForm`, et rien d'autre. `today` est un **paramètre** de la dérivation, jamais lu à
  l'horloge : sans quoi ces tests seraient justes ce jour-là et faux le mois suivant. Le contraste a
  été **mesuré avant d'être cru** sur les neuf couples de l'écran et **aucune correction n'en est
  sortie** : le bandeau d'erreur donne 6,13:1, son filet 5,19:1 contre le panneau, le message sous le
  champ 6,90:1. Son fond ne tient que 1,13:1 contre celui du panneau — et n'a pas à tenir davantage :
  c'est son filet qui porte la limite, le même raisonnement qu'en T3.2 pour le voile. Deux arbitrages
  rendus avec l'humain avant écriture : le refus de la fin sans début, et **le panneau qui devient un
  composant client** — la propriété que T3.2 revendiquait tombe, `useActionState` étant le seul moyen
  de faire revenir une saisie refusée avec ses valeurs. Un défaut trouvé en vérifiant, corrigé :
  « Enregistrer » vivait **hors** du `<form>` depuis T3.2, donc hors de toute soumission. Écarts de
  périmètre assumés et consignés, tous deux annoncés avant écriture :
  `app/(app)/projets/[id]/page.tsx` — l'action se lie au projet côté serveur, et la page reprend au
  passage `listActivityFormOptions` — et deux lignes de commentaire devenues fausses dans
  `components/ui/focus-trap.tsx`.

- **T3.4 — 13/08/2026 — édition d'une activité.** Le ticket qui consomme **l'arbitrage (c)** rendu
  d'avance, et le premier de C3 à ne rien ajouter au vocabulaire : mêmes champs, mêmes règles, même
  panneau — un seul formulaire, deux points d'entrée. **Le critère est tenu et lu dans le HTML
  servi**, dans les deux sens : la Formation « à planifier » d'« Autonomie des opérations
  courantes » datée de novembre 2026 quitte son groupe pour « Prévu », **derrière l'Audit UX
  d'octobre** — l'ordre interne de T3.1 se vérifie au passage —, et recochée sans date elle revient.
  Un type et un objectif modifiés se lisent sur la roadmap : « Audit UX » devient « Revue experte »
  avec sa phrase. **La re-soumission à l'identique ne change aucune ligne au sens strict** :
  `updated_at` est relu **à la milliseconde près de part et d'autre** et n'a pas bougé — l'action
  compare les sept colonnes et n'appelle pas `update`. C'était un arbitrage rendu avec l'humain en
  ouverture : le journal de C6 n'aura rien à enregistrer d'une modification qui n'en est pas une.
  **L'arbitrage (c) a été éprouvé sur le vrai chemin, pas seulement en test** : un `state` posé à la
  main en base — ce que fera T3.5 — sur une activité de mars 2026 que la dérivation dirait `done`
  survit à la correction de son seul objectif, et **retombe à `done` dès que la période bouge d'un
  seul jour**. La fraîcheur suit : une fin de période portée au 15 septembre fait passer la liste
  transverse d'août à **septembre 2026**, puis revenir. Le parcours entier a été joué **sans une
  ligne de JavaScript**, par soumissions `multipart` reconstituées sans en-tête `Next-Action` — ce
  sont les champs `$ACTION_…` du balisage servi qui portent l'action. **Nuance à consigner : aucun
  navigateur n'a été piloté cette fois**, faute d'outil dans la session, là où T3.2 et T3.3
  dépêchaient de vraies touches dans Chrome ; le panneau n'ayant pas changé de forme, ce qui restait
  à éprouver était le chemin serveur, et il l'a été. **Le droit a été éprouvé par l'action** : chez
  Sofia Marchand — contributrice sur « Refonte du parcours de virement » et sur lui seul — la
  roadmap ne porte **aucun** lien « Modifier », l'URL d'édition rend la page nue en 200, et les
  champs récoltés chez Camille Roux puis repostés sous son cookie laissent **la ligne inchangée en
  base**. Deux liaisons forgées ont été refusées de la même façon, la ligne relue intacte : une
  activité **d'un autre projet**, et une activité **annulée** — passée telle à la main pour
  l'occasion, la fixture n'en contenant aucune. **Cinq refus de saisie éprouvés séparément** sur le
  chemin d'édition, et dans les cinq cas la saisie revient dans le panneau : case cochée avec une
  période, fin avant début, type effacé, fin sans début, date impossible. **Le type archivé est
  éprouvé pour la première fois du projet** : « Formation » archivé en base, son activité garde son
  option **sélectionnée** — 25 options dans le panneau d'édition, 24 dans celui de création, où il a
  disparu —, et l'objectif se corrige sans qu'on impose un changement de type. Les 17 tests ajoutés
  ont été **mis en défaut six fois**, et deux d'entre eux n'ont pas résisté à l'exercice : la
  neutralisation de la conservation de l'état n'en faisait tomber que deux sur quatre, et celle de
  la case **aucun** — les deux tests concernés comparaient des valeurs que la dérivation rendait
  identiques par hasard. Ils ont été récrits sur des cas discriminants, et le second a mis au jour
  une propriété qui n'était écrite nulle part : **le schéma autorise `is_unscheduled` avec une
  période**, si bien que décocher la case sans toucher aux dates ne change *que* la case — sans ce
  terme dans la comparaison, la case serait restée cochée. Un défaut a été fermé avant livraison
  sans avoir jamais été atteignable : `ActivityPanel` porte une `key`, faute de quoi un panneau
  réutilisé d'une activité à l'autre afficherait la saisie de la précédente — `useActionState` ne
  relit son état initial qu'au montage. Le contraste a été **mesuré** : le seul couple neuf par sa
  position, « Modifier » sur l'entrée de roadmap, donne **15,72:1**, et le lien est souligné.
  Écarts de périmètre, tous quatre annoncés avant écriture : `app/(app)/projets/[id]/page.tsx` —
  elle seule lit `?activite=` —, `lib/navigation.ts`, `lib/queries/activities.ts` et son fichier de
  tests. **La base de développement est revenue exactement à son état d'avant le ticket** : le
  critère de T3.1 s'y relit mot pour mot, et la fraîcheur du projet est de nouveau août 2026.

- **T3.5 — 13/08/2026 — cycle de vie d'une activité.** Le ticket qui ouvre le cinquième groupe que
  T3.1 avait fermé d'avance, et qui referme le cycle de vie de `docs/03` §4. **Les quatre
  transitions sont une table**, pas des `if` épars — `canTransitionActivity`, testée sur les 16
  couples d'états —, si bien qu'« aucun retour en arrière depuis annulée » est vrai **par
  construction** : `done` et `cancelled` n'ont simplement pas de sortie. **Le critère est tenu et
  vérifié sur le chemin réel**, par soumissions `multipart` reconstituées à partir des champs
  `$ACTION_…` du balisage servi, sans en-tête `Next-Action` : une activité prévue passe en cours
  d'un clic — `isUnscheduled` retombe à `false` au passage, sans quoi une activité « à planifier »
  basculée en cours resterait affichée comme telle — puis en cours passe terminée, et la fraîcheur
  du projet suit dans la liste transverse, **relevée d'août à octobre 2026** sur « Autonomie des
  opérations courantes ». Une annulation soumise **sans motif** est refusée, base inchangée — le
  filet derrière le `required` HTML éprouvé, pas seulement déclaré — et soumise avec un motif,
  l'activité rejoint le groupe « Annulé », replié par défaut derrière un `<details>` natif, son
  motif affiché en clair. Une transition forgée sous le cookie d'un membre non contributeur a été
  refusée de la même façon, la ligne relue intacte. **« Marquer terminée » ne collecte aucune
  date** : le bouton ne s'affiche que si une fin de période est déjà écrite, et l'action la refuse
  sinon — Vision ne fabrique toujours aucune date, l'arbitrage du 13/08/2026 tenant jusqu'ici. Les
  20 tests ajoutés couvrent les 16 couples d'états et les deux bornes du motif ; deux tests neufs
  de plus **éprouvent en base** les contraintes `CHECK` `activities_done_requires_period_end` et
  `activities_cancelled_requires_reason`, les premiers du projet à le faire pour ces deux règles.
  **`activity-panel.tsx` n'a pas été modifié** : rien dans les gestes de ce ticket ne traverse le
  panneau complet, contrairement à ce que sa fiche laissait attendre en le plaçant dans le
  périmètre. Écarts de périmètre, tous deux assumés et déjà pressentis par `ETAT.md` avant
  écriture : `app/(app)/projets/[id]/page.tsx`, pour lier les deux actions neuves à `Roadmap`, et
  `lib/queries/activities.ts` et son fichier de tests, pour le cinquième groupe. **La base de
  développement porte quatre écritures de vérification de plus, non revenues en arrière** : une
  activité menée jusqu'à `done`, une autre annulée avec son motif, deux autres passées en cours —
  toutes quatre consignées ci-dessous, règle 4 obligeant à ne rien défaire par une suppression
  déguisée.

- **T3.6 — 13/08/2026 — participants d'une activité.** Le dernier ticket de C3, et **le ticket qui
  clôt C3** — avec lui, C1 à C3 forment le POC minimal démontrable annoncé par `docs/05`. Une
  activité peut désormais porter des participants, sur le modèle exact des membres de projet de
  T2.6 — une liaison qui se crée et se retire, un retrait qui est une vraie suppression de ligne —
  mais réduit à sa forme la plus simple : pas de rôle, pas de quotité, aucune création de personne
  à la volée. **Le critère est tenu et vérifié en base, sur le chemin réel** : deux participants
  ajoutés à la création, l'un retiré et un troisième ajouté en édition — `updated_at` de la ligne
  `activities` relu **inchangé à la milliseconde**, la preuve que les participants se synchronisent
  indépendamment de la période, du type ou de l'objectif — puis une re-soumission strictement
  identique qui ne crée aucun doublon. Le parcours entier a été joué **sans une ligne de
  JavaScript**, par soumissions `multipart` reconstituées à partir des champs `$ACTION_…` du
  balisage servi, sur un serveur de développement d'une session précédente, réutilisé plutôt que
  relancé. **Un choix explicite de la fiche, tenu à la lettre** : contrairement au type et à
  l'approche, l'existence d'un participant dans le domaine n'est vérifiée **nulle part côté
  écran** — c'est `assertPreconditions` de `lib/db/scoped.ts`, déjà là pour toute clé étrangère du
  schéma, qui refuse seule une personne hors domaine, attrapée par `scopeRefusal` comme le reste.
  **Un défaut réel a été trouvé en vérifiant sur ce chemin précis, et corrigé avant livraison** :
  la première version de `syncParticipants` déliait d'abord, ajoutait ensuite ; un ajout forgé hors
  domaine faisait donc échouer la requête **après** qu'un retrait légitime avait déjà eu lieu — le
  seul refus du produit qui n'aurait pas laissé « la ligne relue intacte », contrairement à tout ce
  que T2.5 à T3.5 ont éprouvé. Reproduit puis corrigé en inversant l'ordre : l'ajout passe en
  premier, et `insertMany` vérifie chaque ligne avant d'écrire quoi que ce soit, donc avant qu'aucun
  retrait n'ait pu être exécuté — reproduit une seconde fois après correction, refus rendu, **les
  deux participants existants intacts**. Le droit a été éprouvé par l'action, comme depuis T3.2 :
  chez Sofia Marchand, non-contributrice de ce projet, la même édition est refusée, ligne inchangée.
  Les 8 tests ajoutés à `lib/forms/activity.test.ts` (validation de forme, lecture, restitution) et
  les 9 ajoutés à `lib/queries/activities.test.ts` (options élargies aux personnes, participants
  embarqués sur la roadmap, étanchéité de domaine) ne touchent que ce que T3.6 change ; les 55 et 23
  tests déjà en place n'ont pas bougé. Le rapprochement des participants sur la roadmap **ne
  duplique aucune ligne d'activité** : une deuxième lecture plutôt qu'un troisième `leftJoin` sur la
  requête de `listProjectRoadmap`, pour la même raison qui sépare déjà l'équipe d'un projet de sa
  ligne dans `findProjectDetail`. Écarts de périmètre, tous deux structurels et annoncés avant
  écriture : `app/(app)/projets/[id]/page.tsx` — doit passer la liste des personnes au panneau et,
  en édition, les participants déjà liés — et `components/projects/roadmap.tsx` — l'« Attendu » de
  la fiche exige l'affichage sur l'entrée de roadmap, que seul ce fichier rend. **La base de
  développement est revenue à son état d'avant le ticket** : l'activité de vérification a été
  archivée (règle 4) plutôt que laissée visible, contrairement à T3.3 et T3.5.

- **T4.1 — 13/08/2026 — bloc « Ressources » de la page projet, lecture.** Le premier écran de C4, et
  le premier bloc de référence de la page projet à porter autre chose qu'une phrase d'attente : la
  seconde moitié de la boucle minimale de `docs/05` §2 commence par l'écran qui l'affiche. **Le
  critère est tenu et lu dans le HTML servi**, pas affirmé : sur « Autonomie des opérations
  courantes », « Restitution des tests — vague 2 » sort avec « PowerPoint · Test utilisateur », le
  titre en lien sortant `target="_blank" rel="noreferrer"` marqué d'un chevron `aria-hidden` et d'un
  « (lien externe, nouvel onglet) » en `sr-only` ; sur « Refonte du parcours de virement » et
  « Dématérialisation de la déclaration », l'état vide s'affiche. Le bloc est **le premier des cinq**
  — l'ordre lu dans le rendu est Ressources · Indicateurs adoptés · Projets liés · Budget · Journal —
  et le titre de la ressource **n'apparaît sur aucun autre écran** : zéro occurrence sur les deux
  autres pages projet, sur la liste transverse et sur la liste des produits. Trois arbitrages rendus
  avec l'humain avant écriture : l'ordre d'affichage, que la fiche laisse au ticket — **la plus
  récemment reliée en tête**, `created_at` étant la seule date qu'une ressource porte à l'écran —,
  le nouvel onglet, et le libellé d'une activité archivée qui **reste affiché**, la règle « on
  décrit, on ne propose pas » de T3.3 appliquée pour la première fois à une jointure. Les 11 tests
  ajoutés ont été **mis en défaut neuf fois** : filtre de projet **4** tests, filtre d'archivage
  **2**, le tri **1**, `filter(resources)` **1**, les `leftJoin` passés en `innerJoin` **5**. **Deux
  d'entre eux n'existaient pas au premier jet, et l'exercice les a imposés** : retirer
  `filter(activities)` ou `filter(activityTypes)` ne faisait tomber **aucun** test, la jointure
  portant sur une clé primaire qu'`assertPreconditions` empêche déjà de pointer hors domaine — ces
  deux filtres sont **infalsifiables sur des données légitimes**. Deux tests écrivent donc
  directement par `db`, hors de la couche, ce qu'elle interdit : une ressource du domaine B pointant
  une activité de A, une activité de B pointant un type de A. La propriété relevée depuis T2.2 s'en
  trouve vérifiée une sixième fois et **mesurée** : `filter(activities)` retiré seul ne fait toujours
  rien tomber, son voisin le rattrape ; les deux ensemble font tomber les deux. Le contraste a été
  **mesuré avant d'être cru** sur les quatre couples de l'écran, et **une correction en est sortie** :
  le séparateur « · », écrit en `content-neutral-light` par les trois écrans qui en portent un, tombe
  à 2,22:1 — acceptable entre deux éléments visuellement distincts, illisible ici où les deux côtés
  ont la même graisse ; il prend la couleur du texte qu'il sépare, **4,98:1**, sans introduire de
  couple neuf. Le titre en lien sortant donne 6,41:1 et reste souligné. **Aucun écart de périmètre** :
  les six fichiers de la fiche, et rien d'autre. **La base de développement n'a pas bougé** — le
  ticket ne pose aucune écriture.

- **T4.2 — 14/08/2026 — relier une ressource.** Le geste qui **ferme la boucle minimale** de
  `docs/05` §2, au deuxième ticket sur quatre : un contributeur trouve son projet, saisit son
  activité (C3) et attache le lien de sa restitution (C4). **Le critère est lu dans le HTML servi**,
  et le parcours entier a été joué **sans une ligne de JavaScript** — la vérification n'a employé que
  `curl`, donc aucun moteur de script n'a jamais tourné : le panneau s'ouvre par un GET, le
  formulaire est un `<form method="POST">` dont Next rend les champs `$ACTION_…` dans le balisage, et
  les trois sorties sont trois `<a href>` vers la page nue, relus dans le rendu. « Compte rendu
  d'atelier — T4.2 » posté sous le cookie de Camille Roux rend un **303**, et la ressource paraît
  **en tête** du bloc de « Autonomie des opérations courantes » avec « Word · Test utilisateur » —
  l'ordre tranché par T4.1, éprouvé pour la première fois sur une écriture réelle plutôt que sur une
  fixture. **Le droit a été éprouvé par l'action** : champs et `$ACTION_KEY` récoltés sur la page
  servie à Camille, **repostés sous le cookie de Sofia Marchand** — membre du domaine, absente de
  l'équipe de ce projet — rendent le refus et laissent la base à 2 lignes, comptées avant et après.
  Chez elle, « Relier une ressource » est absent des deux emplacements du bloc et
  `?ressource=nouvelle` rend la page nue, en **200 et non en 404** : la page projet reste lisible par
  tout le domaine (D9). **Quatre refus éprouvés séparément**, chacun par une soumission forgée et
  chacun rendant un message distinct avec la saisie intacte : titre vide, URL vide, type `keynote`
  hors de l'énuméré, et une activité de « Refonte du parcours de virement » postée sur
  « Autonomie » — *« Cette activité n'appartient pas à cet accompagnement. »* Un cinquième s'y est
  ajouté, et **il n'était pas dans la fiche** : `ExternalLink` rend le `href` tel quel, si bien
  qu'une adresse `javascript:` enregistrée s'exécuterait au clic sur le titre. Le schéma se vérifie
  donc à l'écriture — c'est la validation du champ URL, pas une fonctionnalité de plus. **Deux
  arbitrages rendus avec l'humain avant écriture.** (1) **L'exclusivité des deux paramètres, par
  non-ouverture** : `?activite=` et `?ressource=` présentes ensemble n'ouvrent **rien** — une seule
  règle, aucune préséance inventée entre deux gestes de même rang, et c'est déjà ce que la page fait
  de toute valeur d'`?activite=` qu'elle ne reconnaît pas. Lu dans le rendu : zéro `role="dialog"`,
  zéro `inert`, zéro champ de l'un ou l'autre formulaire ; chacune seule en donne exactement un de
  chaque. T4.4 reprend la règle telle quelle. (2) **Le groupe « Annulé » est écarté des activités
  proposées** — une activité abandonnée n'a rien produit —, sans être refusé par l'action : « ce
  qu'on ne propose pas, on continue de l'accepter », la règle de T3.4. Vérifié sur le projet qui
  porte une activité annulée : elle est absente du `select` et présente dans la roadmap, avec son
  motif. Les **34 tests** de `lib/forms/resource.ts` ont été **mis en défaut six fois**, une règle à
  la fois, et chacune fait tomber exactement les siens : titre vide **2**, URL vide **2**, schéma
  non-web **5**, type absent **1**, type hors énuméré **1**, `activityId` non-UUID **1**. La mise en
  défaut du schéma a montré que la règle en contient **deux séparables** : les trois adresses
  relatives restent refusées par `new URL` seul, seules les cinq absolues dépendent du contrôle de
  protocole. Le contraste a été **mesuré** sur les couples neufs par la position : le filet du bouton
  sur la surface du bloc **3,88:1**, son texte **15,72:1**, le bouton plein de l'état vide
  **13,65:1** — aucun jeton neuf, aucun septième substitut. **Aucun écart de périmètre** : les sept
  fichiers de la fiche, et rien d'autre. **La base de développement a gagné une ressource**, celle du
  critère.

- **T4.3 — 14/08/2026 — le résultat sur l'entrée de roadmap.** La table `results` portait deux lignes
  de fixture qu'**aucun écran ne montrait**, alors que `docs/03` §6 et `docs/06` §5 écrivent à
  l'identique que chaque entrée affiche « le cas échéant son résultat avec le lien vers l'outil » —
  la phrase que l'état vide de `Roadmap` promet mot pour mot depuis T3.1. **Le critère est lu dans le
  HTML servi**, extrait par `curl` — donc sans qu'aucun moteur de script n'ait tourné : sur « Refonte
  du parcours de virement », l'Audit UX porte « Résultat : Score d'audit UX · 62/100 · 31 mai 2024 ·
  Ergonome » ; sur « Autonomie des opérations courantes », l'Audit d'accessibilité porte « Taux de
  conformité · 68 % · 30 juin 2026 · Audit d'accessibilité ». **Une ligne de résultat par page, zéro
  sur les trois autres projets**, comptées dans le balisage ; et **aucun lien sortant neuf** — les
  quatre `target="_blank"` des deux pages sont les titres de ressources de T4.1, aucun n'est un
  libellé de résultat. Le cas « un résultat sans lien profond est un cas normal » n'est donc pas
  affirmé : il est ce que la fixture rend. **Trois arbitrages.** (1) **L'ancre est le libellé**,
  tranché avec l'humain contre le nom de l'outil : `label` est `not null`, donc une seule règle et
  aucun repli, et c'est la forme du titre d'une ressource depuis T4.1 — `ExternalLink` repris tel
  quel, non modifié. La branche n'étant pas atteignable sur la fixture, elle a été éprouvée sur une
  **ligne posée à la main** en base de développement puis **retirée**, `external_url` relue à `null`
  avant et après : le balisage rend alors `<a … target="_blank" rel="noreferrer">Score d'audit UX ↗
  <span class="sr-only"> (lien externe, nouvel onglet)</span></a>`. (2) **La date se lit au jour**,
  contre l'habitude de D13 — « 31 mai 2024 », que le critère de la fiche écrit lui-même : une date de
  mesure n'est pas une période d'accompagnement, et D39 autorise la valeur reportée « avec sa date ».
  L'entorse est bornée à ce seul champ, `formatDay` n'ayant aucun autre appelant. (3) **L'unité se
  colle après un `/` et se sépare partout ailleurs d'une insécable** — « 62/100 » et « 68 % », les
  deux formes que le critère met côte à côte. L'insécable a été **vérifiée sur le point de code** dans
  le HTML servi, `0xa0` et non `0x20` : à l'œil, les deux sont indiscernables. **Le rapprochement est
  une troisième lecture**, imposée par la fiche et non une jointure de plus — la requête principale en
  portait déjà deux, et `results` en amenait deux. **Les tests ont été mis en défaut sept fois**, une
  règle à la fois, et chacune fait tomber exactement les siennes : `isNull(results.archivedAt)` **1**,
  `filter(tools)` **1**, `filter(results)` **1**, l'insécable **2**, le formatage du nombre **6**, le
  collage du `/` **1**, le fuseau UTC de `formatDay` **2**. Les trois filtres de la lecture sont
  **infalsifiables sur des données légitimes**, pour la raison relevée par T4.1 — la jointure porte
  sur une clé primaire et `assertPreconditions` refuse déjà d'écrire hors domaine : deux tests
  écrivent donc par `db`, hors de la couche, un `tool_id` et un `activity_id` étrangers. **Une
  contrainte a corrigé une erreur d'écriture des tests** : `results_activity_unique` ne connaît ni le
  domaine ni l'archivage, si bien qu'une activité qui porte déjà un résultat, **fût-il archivé**, en
  refuse un second — la liaison forgée a dû viser une activité vierge. Le contraste a été **mesuré**
  sans qu'aucun couple ne soit neuf par la position, l'entrée de roadmap et `Section` portant la même
  surface : le texte **4,98:1**, l'ancre **6,41:1**. **Un écart de périmètre, déclaré** :
  `lib/format.test.ts`, qui n'existait pas — trois règles muettes qu'aucun test n'aurait pu mettre en
  défaut, et dont les cas limites (décimale, millier, unité absente, premier du mois) ne se lisent sur
  aucun écran. **La base de développement n'a pas bougé** : la seule écriture, celle du lien profond,
  a été défaite.

- **T4.4 — 14/08/2026 — saisie déclarative d'un résultat.** **Clôt C4**, et avec lui la boucle
  complète de `docs/05` §2 : un contributeur trouve son projet, saisit l'activité qu'il vient de
  terminer, attache le lien de sa restitution, et **reporte le chiffre que l'outil a produit**. Le
  niveau 1 de `docs/03` §5, et lui seul (D15) — la valeur se saisit, elle ne se demande à personne.
  Un panneau ouvert par `?resultat=<identifiant d'activité>`, troisième clé de la page projet et la
  première dont la **valeur** désigne la cible du geste plutôt qu'un mot fixe.
  **L'arbitrage d'ouverture : est obligatoire ce que la colonne rend obligatoire.** Rendu avec
  l'humain avant écriture — `label` et `measured_on` sont `not null`, `value`, `unit`, `tool_id` et
  `external_url` ne le sont pas. Ce qui a emporté la décision est la liste des cinq refus de la fiche
  elle-même : ses deux seuls refus d'**absence** portent exactement sur les deux colonnes `not null`,
  et la valeur y est refusée sur sa **forme** — « valeur qui n'est pas un nombre », jamais « valeur
  vide ». `formatResultValue` savait déjà rendre `null` depuis T4.3 : la lecture était prête avant
  que l'écriture n'existe.
  **Le point d'entrée et le panneau lisent la même donnée, et c'est la propriété du ticket.** La
  cible se cherche dans la roadmap **déjà lue** pour l'écran : aucune requête ne s'ajoute pour en
  décider, et les quatre conditions s'y lisent d'un coup — la roadmap est scopée au projet et exclut
  les archivées, le groupe `done` donne l'état, `producesResult` le drapeau du type, `result` ce qui
  est déjà posé. **Conséquence vérifiée** : une URL tapée à la main n'ouvre jamais plus que ce que
  l'écran propose, et le lien ne peut pas survivre au résultat qu'il a servi à écrire.
  **Le critère lu dans le HTML servi, en trois temps sur la même activité.** Le point d'entrée rendu
  sur le seul Audit UX — « Observation terrain » et « Atelier de cadrage », terminées elles aussi
  mais d'un type qui ne produit rien, n'en portent pas, et les deux audits déjà pourvus non plus.
  Après saisie : « Résultat : Score d'audit UX ↗ · Valeur : 74,5/100 · Mesuré le 28 septembre 2026 ·
  Outil : Ergonome », **avec son ancre** — `href` relu à `https://ergonome.invalid/rapports/1187`,
  **la première fois du produit**, les deux résultats de la fixture n'ayant pas d'adresse. Puis le
  point d'entrée disparu de cette entrée.
  **Le droit éprouvé par l'action, pas par l'écran.** Les champs `$ACTION_…` récoltés sur la page
  servie à Camille Roux (responsable de domaine), repostés **sans en-tête `Next-Action`** sous le
  cookie de Sofia Marchand, membre non contributrice de cet accompagnement : refusé, base inchangée.
  Chez elle, l'URL d'ouverture rend la page nue — pas un 404, la page projet restant lisible par tout
  le domaine (D9). **Les deux identifiants liés ont été relus en clair** dans `$ACTION_1:1`, troisième
  confirmation du rappel de contexte d'`ETAT.md`, et c'est en les réécrivant que les refus forgés ont
  été obtenus.
  **Six refus éprouvés séparément**, chacun par sa propre soumission : libellé vide ; valeur qui
  n'est pas un nombre ; date de mesure absente ; **activité non terminée forgée** — la règle de T1.3,
  portée par `assertPreconditions` à travers deux tables, laissée refuser et seulement rendue
  lisible ; seconde saisie sur une activité qui porte déjà un résultat ; et **un sixième que la fiche
  ne listait pas**, un type sans `produces_result` forgé — elle en fait la condition du point
  d'entrée, et un panneau absent du rendu n'a jamais protégé le point d'entrée HTTP qui l'accompagne.
  Une septième soumission a visé une activité d'un autre accompagnement : refusée aussi. **Base
  inchangée après les six**, vérifié avant la saisie réelle.
  **Les tests mis en défaut, huit fois.** Chaque règle de `validateResultForm` neutralisée à son
  tour, et les deux moitiés du contrôle de la valeur séparément — la forme et le plafond de quatorze
  chiffres, qui tombent bien indépendamment. À chaque fois exactement les tests attendus, et rien
  d'autre. La huitième porte sur la lecture : `producesResult` forcé à `false` dans le `select` fait
  tomber le seul test qui l'éprouve.
  **Un détour motivé sur la valeur.** `Number` accepte « 0x10 », « 1e5 » et « Infinity », qu'une
  colonne `numeric` refuse : valider par `Number` puis écrire la chaîne telle quelle aurait rendu un
  500 sur soumission forgée. Le contrôle est donc une **forme**, calée sur ce que la colonne accepte,
  plafond de précision compris. Dans l'autre sens, la **virgule décimale est acceptée et
  normalisée** : `formatResultValue` rend « 74,5 » à l'écran, et refuser en saisie ce que l'écran
  affiche juste à côté aurait été un piège. L'aller-retour a été vérifié — « 74,5 » tapé, « 74.5 » en
  base, « 74,5/100 » rendu.
  **Le contraste n'a pas été mesuré, et la raison est écrite** : aucun couple de couleurs n'est neuf
  par la position. Le panneau reprend les jetons de `resource-panel.tsx` sur la même surface, et le
  lien « Saisir un résultat » reprend `ACTION_LINK` sur `surface-neutral-pale` — exactement le couple
  de « Modifier », sur la même entrée de roadmap.
  **Deux écarts de périmètre, déclarés avant écriture.** `lib/queries/activities.ts` et ses tests :
  `producesResult` remonté par la roadmap — une colonne de plus dans un `select` qui joignait déjà
  `activityTypes`, pas une requête de plus — et `listResultToolOptions`, que lire dans la page aurait
  défait le geste de T3.3. Et `isWebUrl` **exporté** de `lib/forms/resource.ts` plutôt que recopié une
  quatrième fois : ce contrôle n'est pas une politesse de formulaire, `ExternalLink` rendant le `href`
  tel quel sur le libellé du résultat comme sur le titre d'une ressource.
  **Ce qui n'a pas été fait, et pourquoi.** `activity_types.default_tool_id` est semé sur les deux
  types d'audit du brief et aurait présélectionné l'outil en trois lignes. La fiche ne le demandait
  pas — règle 3. Le point part dans `ETAT.md` avec sa destination.

- **T4bis.1 — 14/08/2026 — ce qu'un formulaire fait d'une valeur archivée.** **Premier ticket de
  C4bis**, et le seul du chantier qui n'archive rien : il répare ce que les cinq suivants vont
  révéler. Le motif de T3.4 — `keepActivityTypeId`, jusqu'ici le seul endroit du produit où une
  exception d'archivage soit nominative — devient la règle des deux formulaires, sur six valeurs :
  l'**entité** du produit, et le **produit**, le **statut**, les **métiers**, les **approches** et
  les **personnes** de l'accompagnement.
  **L'écart de périmètre, tranché avec l'humain avant écriture.** La fiche annonçait quatre fichiers
  et un critère que ces quatre fichiers ne pouvaient pas produire : `checkReferences`
  (`app/(app)/projets/actions.ts`) valide métiers, approches et personnes par `list`, qui écarte les
  archivés. La case serait revenue cochée dans le HTML **et la soumission aurait été refusée** — la
  perte silencieuse remplacée par un formulaire qu'on ne peut plus enregistrer. Le choix a été posé
  à l'humain, qui a tranché pour l'extension d'un septième fichier. L'exception y est **nominative**,
  et non un `includeArchived` : seules les liaisons lues par `findProjectLinks` — donc **en base**,
  jamais reçues du formulaire — échappent au filtre. Le produit et le statut n'en ont pas eu besoin,
  `checkReferences` les vérifiant par `find`, qui rend les lignes archivées ; `updateProduct` non
  plus, `assertPreconditions` ignorant `archived_at`.
  **Le point de détail qui justifiait le ticket à lui seul : les personnes cumulent deux
  conditions.** `is_active` s'écrivait dans le `where`, `archived_at` était porté par la couche.
  Lever la seconde obligeait à réécrire la première à côté — sans quoi une personne **désactivée sans
  être archivée** aurait disparu des cases aussi sûrement qu'une archivée. Le cas a son test dédié,
  sur une personne de fixture qui n'est que désactivée.
  **Le critère lu dans le HTML servi, six valeurs archivées à la main** en base de développement
  (jetable, règle du 14/08/2026 ; précédent de T4.3), par SQL brut, **toutes remises à `null` en fin
  de session** — vérifié à zéro ligne restante. Les deux formulaires d'édition les rendent toutes les
  six : trois `<option … selected="">` (entité, produit, statut), deux `<input type="checkbox" …
  checked="">` (métier, approche), et la personne archivée sur son `<select name="team:…">` à
  `<option value="contributor" selected="">`. Les deux formulaires de **création** ne les portent
  **nulle part** — zéro occurrence de chacun des six identifiants dans les deux balisages servis.
  **La re-soumission, comptée en base avant et après**, l'écran ne pouvant pas témoigner de ce qu'il
  n'affiche plus : `project_jobs` 3, `project_approaches` 2, `project_members` 3 avant ; la
  soumission renvoyée à l'identique rend **303 vers la page projet**, pas un formulaire en erreur ;
  3, 2, 3 après, et les trois liaisons archivées relues une à une, présentes. Le formulaire de
  produit de même : 303, entité inchangée.
  **Le droit éprouvé par l'action, trois soumissions séparées.** (1) Un **second** métier archivé,
  que le projet ne porte pas, forgé dans la re-soumission : refusé, « Un métier sélectionné n'existe
  pas dans ce domaine » — c'est la preuve que l'exception est nominative et non une porte ouverte.
  (2) La même soumission sous le cookie d'un membre non responsable : refusée par la garde
  `manageDomain`, inchangée. (3) `createProject` avec ce même identifiant archivé forgé : refusé,
  aucun `keep` n'existant en création. Base inchangée après les trois — cinq projets avant, cinq
  après.
  **Les tests mis en défaut.** Le `or` neutralisé dans les deux fonctions de lecture fait tomber
  **exactement trois tests, tous les trois neufs**, et rien d'autre sur les 370. Ce que ce geste ne
  couvre pas, et qui est dit plutôt que tu : les tests neufs qui **assertent une absence** — « sans
  exception », « l'exception ne retient que celle-là », la frontière de domaine — survivent
  légitimement à la neutralisation, et la tolérance de `checkReferences` n'a **aucun test unitaire**,
  le dépôt n'en portant aucun sur les actions serveur. Elle s'éprouve par la re-soumission comptée
  ci-dessus, et par les trois refus forgés.
  **Le contraste n'a pas été mesuré, et la raison est écrite** : aucun composant, aucune classe,
  aucun jeton ne change. Les six valeurs archivées s'affichent dans les contrôles existants, sur les
  couples déjà mesurés en T2.5 et T2.6.
  **Onze tests neufs**, dans un **quatrième domaine de fixture** pour `projects.test.ts` — et non
  des lignes de plus dans le premier, dont trois tests comptent leurs lignes : c'est déjà la raison
  d'être du domaine `c`. Le domaine `d` porte une valeur archivée de chaque sorte, plus une seconde
  non gardée pour éprouver la nominativité, plus deux personnes désactivées dont une seule est
  gardée.
  **Ce qui n'a pas été fait, et pourquoi.** `/produits/nouveau` garde sa lecture d'entités en ligne :
  la fiche dit que le formulaire de création « ne change pas d'un caractère », et la page n'est pas
  au périmètre — règle 3. La duplication qui en résulte part au journal technique. Et le
  `Promise.all` de la page de modification d'un accompagnement est perdu, l'exception nominative ne
  pouvant pas se construire avant de savoir ce que la ligne porte.

- **T4bis.2 — 14/08/2026 — archiver un produit, et le rétablir.** **Le premier appelant
  d'`archive()`** : la fonction existait dans `lib/db/scoped.ts` depuis T1.3, et `grep -rn '\.archive('`
  sur `app/` ne rendait aucun appelant. Un produit qui n'est plus accompagné s'archive depuis sa
  page, sa page reste lisible (règle 4), et le geste se défait.
  **L'écart de périmètre, déclaré et tranché avant écriture — le second du chantier après T4bis.1.**
  La fiche annonce « Rétablir » dans son objectif, l'arbitrage (b) le pose pour le produit et le
  projet, le critère de validation l'exige — et **aucun chemin n'existait** : `archive()` pose
  `archived_at`, il n'y avait pas de `restore()`, `update()` lève `IntegrityError` dès que
  `archivedAt` figure dans les valeurs, `UpdateValues` l'exclut du typage, et `eslint.config.mjs`
  interdit d'importer `lib/db/client` ailleurs que dans `scoped.ts`. Périmètre étendu à
  `lib/db/scoped.ts` et `lib/db/scoped.test.ts`, **pour `restore()` et rien d'autre**. Neuf fichiers
  au total.
  **`restore()` est le miroir exact d'`archive()`**, au filtre près : `isNotNull(archivedAt)` là où
  l'archivage porte `isNull`, si bien qu'un rétablissement de ligne vivante ne touche rien et rend
  `undefined` — un geste qui prétendrait défaire ce qui n'a pas été fait mentirait à son appelant.
  La branche `activities` du `batch` est reprise telle quelle : l'en-tête du module promet que toute
  écriture d'activité recalcule `last_activity_at`, et **une promesse de couche ne se tient pas
  seulement là où une interface y mène** — l'arbitrage (b) exclut le rétablissement d'activité, donc
  rien n'appelle ce chemin, et il serait faux le jour où quelque chose l'appellerait. L'en-tête du
  module dit désormais qu'`archive` et `restore` sont les **deux seuls** chemins vers `archived_at`.
  **Trois règles vivent dans l'action, pas à l'écran.** (1) `updateProduct` relit le produit par
  l'identifiant **reçu** et refuse s'il est archivé — `/produits/{id}/modifier` rend 404, mais une
  route retirée n'a jamais protégé l'action qu'elle affichait, et les champs récoltés avant
  l'archivage se repostent tels quels ensuite. (2) `archiveProduct` enchaîne `manageDomain` → produit
  du domaine → **compte des accompagnements vivants** par `session.db.count`, qui écarte les archivés
  d'elle-même → `archive()` → revalidations et `redirect` **hors de tout `try`**. (3) `restoreProduct`
  refuse **muettement**, précédent `transitionActivity` de T3.5 : ce geste n'a aucune saisie à rendre.
  Le tronc commun `submit` gagne un refus **nommé** (`{ refused }`) à côté de son `undefined`, sans
  quoi un produit archivé aurait été annoncé « n'existe plus dans ce domaine », qui est faux.
  **`components/ui/confirm-panel.tsx` est le jumeau de `resource-panel.tsx`, formulaire de saisie en
  moins** : même `FocusTrap` réutilisé sans modification, même voile non focalisable, même filet
  gauche `content-neutral-dark`, même croix `autoFocus`, mêmes jetons — **aucun couple de couleurs
  neuf par la position**, donc aucune mesure à refaire et aucun septième substitut inventé. Il est
  client pour une seule raison : `useActionState` est le seul moyen de faire revenir le refus de
  l'arbitrage (e) **avec son compte**. Le texte, lui, arrive en `children` et reste serveur. Il ne
  connaît aucun droit. T4bis.3 le reprend tel quel, comme T4.3 a repris `external-link.tsx`.
  **Le panneau est une URL, pas un état** : `?archiver=confirmation`, une **seule** valeur
  d'ouverture — l'objet visé est celui de la page, rien n'est polymorphe —, la page rendue derrière
  avec `inert`, la fermeture sur `ROUTES.product(id)`. La mécanique de T3.2, sans qu'un caractère
  bouge.
  **Aucune cascade — arbitrage (f).** `listProductProjects` ne change pas d'une ligne : les
  accompagnements gardent leur `archived_at` nul et cessent de s'afficher parce que leur parent ne
  s'affiche plus. C'est ce qui rend le rétablissement écrivable — une cascade rendrait indistinguable
  ce qui a été archivé de ce qui l'a été par ricochet.
  **`ProductDetail` gagne `archivedAt`**, et c'est tout ce que la lecture change : les deux listes
  filtraient déjà `isNull(products.archivedAt)`. Ce qui manquait n'était pas de rendre la ligne — elle
  l'était — mais de **le dire** à l'écran, qui la servait à l'identique dans les deux cas. La mention
  se lit **au mois** (`formatMonth`, D13) : c'est une date de rangement, pas un horodatage, et
  `lib/format.ts` n'entre donc pas au périmètre.
  **Ce qui n'a pas été fait, et pourquoi.** `createProject` n'interdit pas encore, sur soumission
  forgée, de rattacher un accompagnement neuf à un produit archivé — le trou est connu, il n'est pas
  au périmètre de la fiche (règle 3), et il part au journal technique. Aucune ligne dans `events`
  (C6). Aucun archivage de projet, d'activité, de ressource ni de résultat.
  **Ce qui n'a pas été vérifié, et c'est le manque central de ce ticket.** La session n'a obtenu le
  droit de lancer **aucune commande** : ni `tsc --noEmit`, ni `lint`, ni `vitest`, ni `next dev`. Les
  quatre disciplines de l'étape 4 sont donc **à jouer**, et le point ouvert d'`ETAT.md` les énumère
  une à une. Rien de ce qui suit n'est affirmé ici : le critère n'a pas été lu dans le HTML servi, le
  droit n'a pas été éprouvé par l'action, les tests n'ont pas été mis en défaut. Seule la mesure de
  contraste est légitimement absente — aucun couple n'est neuf par la position.

- **T4bis.3 — 15/08/2026 — archiver un accompagnement, et ce qu'un accompagnement archivé
  autorise.** Les manques (2) et (5) ensemble : le geste, et **la règle écrite dans le code** que
  archivé veut dire lecture seule (arbitrage (a)). Les deux sont indissociables — livrer l'archivage
  sans la lecture seule laisserait un projet rangé recevoir des activités par simple re-soumission.
  Sept fichiers, **aucun écart de périmètre**.
  **Deux portes pour cinq écritures, et c'est tout le ticket.** `openProject` couvre la création et
  la correction d'activité, la ressource et le résultat ; `openActivity` couvre la transition et
  l'annulation. Deux lignes ajoutées, une dans chacune, et la règle n'a **qu'une adresse** — une
  règle posée à cinq exemplaires diverge un jour. Le message est commun aux quatre gestes du
  formulaire, là où `refused` est propre à chacun : ce n'est pas le geste qui est réservé, c'est
  l'accompagnement qui est fermé.
  **`canWrite` porte la lecture seule à l'écran, d'un seul `&&`.** Les trois panneaux, les cinq
  gestes de roadmap et l'ajout de ressource tombent ensemble — tous déjà gouvernés par un `| null`
  que la page fournit, si bien qu'**aucun composant n'a eu à changer** : ni `roadmap.tsx`, ni
  `resources.tsx`, ni les trois panneaux. La discipline de T3.6, qui avait mis ces `null` en place
  pour le droit, a servi telle quelle pour l'archivage.
  **La quatrième clé d'ouverture n'a pas fait bouger l'énoncé de l'exclusivité.** T4.4 avait remplacé
  la comparaison binaire de T4.2 par un décompte « en prévision de C5 » ; c'est T4bis.3 qui en a
  profité le premier, `archiver` rejoignant `keys` sans qu'une ligne de la règle change.
  **Trois arbitrages, posés avant écriture et tranchés avec l'humain.** (1) `updateProject` refuse le
  projet archivé **reçu** : la fiche n'énumère que cinq écritures, toutes dans `[id]/actions.ts`,
  mais l'arbitrage (a) dit « aucune écriture », et T4bis.2 avait fait ce contrôle exact sur
  `updateProduct`. Le tronc `submit` gagne le refus **nommé** `{ refused }` que
  `produits/actions.ts` porte déjà — sans lui, un projet archivé aurait été annoncé « n'existe
  plus », qui est faux. (2) Rétablir un accompagnement dont le **produit** est archivé reste permis,
  sans garde-fou : arbitrage (f), et inventer un septième refus en cours de ticket serait rouvrir un
  arbitrage que le chantier ferme. Le point ouvert est consigné. (3) Le trou `createProject` ×
  produit archivé n'est **pas** refermé, bien que le journal de T4bis.2 ait désigné ce ticket comme
  premier candidat : l'interdit de la fiche est explicite, et règle 3.
  **Aucun refus fondé sur ce que l'accompagnement contient**, à la différence du produit. L'arbitrage
  (e) protège une lecture — masquer des accompagnements vivants de deux listes ; la page d'un projet
  archivé, elle, reste servie **entière**, roadmap comprise. Rien ne disparaît, donc rien ne s'oppose
  au rangement. Aucune cascade non plus, et `last_activity_at` n'est pas touché.
  **`ProjectDetail` gagne `archivedAt`**, seule modification de la lecture : les trois listes
  filtraient déjà. La même colonne porte la mention datée **et** la lecture seule — une lecture, deux
  conséquences.
  **Les quatre disciplines, jouées.** Le critère lu dans le HTML servi sur dix-sept points, sous trois
  cookies. Le droit éprouvé par l'action en **expérience contrôlée** : sept charges récoltées sur la
  page servie avant l'archivage — `createActivity`, `updateActivity`, `transitionActivity`,
  `cancelActivity`, `createResource`, `createResult`, `updateProject` —, toutes refusées après, base
  relue **inchangée** (seul `archived_at` diffère), puis **les mêmes charges, non retouchées**,
  toutes acceptées après rétablissement. C'est ce second temps qui fait la preuve : sans lui, un
  refus pouvait venir d'une charge malformée plutôt que de l'archivage. La garde d'`updateProject` a
  été **isolée** du 404 de sa route en neutralisant celui-ci : la page rend alors 200, l'action
  refuse seule, la base ne bouge pas. `archiveProject` et `restoreProject` repostés sous le cookie
  d'un membre : refusés, base inchangée. Tests mis en défaut : retirer `archivedAt` du `select` de
  `findProjectDetail` fait tomber **exactement** les deux tests neufs, 38 des 40 restant verts.
  Contraste : rien à mesurer, aucun couple n'étant neuf par la position — tout est repris de la page
  produit et de l'en-tête projet.
  **Ce que les gardes d'actions ne portent pas :** aucun test unitaire, faute de banc d'essai pour
  les actions serveur dans ce dépôt. C'est la seconde discipline qui les couvre, et elle seule.

- **T4bis.4 — 15/08/2026 — archiver une activité saisie par erreur.** Le manque (3), et la fin de la
  colonne « Archiver » de la matrice pour les objets qui ont une page. Cinq fichiers annoncés, cinq
  touchés : `archiveActivity` dans `app/(app)/projets/[id]/actions.ts`, le geste dans
  `components/projects/roadmap.tsx`, son branchement dans `app/(app)/projets/[id]/page.tsx`, et le
  filtre d'archivage du `leftJoin` de `lib/queries/resources.ts` avec ses tests.
  **L'action tient en douze lignes, parce que `openActivity` en portait déjà quatre contrôles.**
  Écrite en T3.5 pour la transition et l'annulation, étendue en T4bis.3 au projet archivé, elle
  vérifie d'un coup : l'activité existe, elle n'est pas déjà archivée, `writeProject` est interrogé
  sur le projet **de l'activité reçue**, et ce projet n'est pas archivé. La conséquence est que le
  refus d'une activité **d'un autre accompagnement** n'a demandé aucun code : le droit se juge sur le
  projet d'ailleurs, où l'on n'écrit pas. La porte n'a pas été modifiée d'une ligne, seul son en-tête
  nomme son troisième appelant. Reste propre à ce ticket la garde du **résultat vivant** — `count`
  sur `results`, qui écarte les archivés d'elle-même.
  **Trois arbitrages, rendus avant écriture** (raisons au journal technique) : (1) le geste
  **disparaît** de l'entrée qui porte un résultat, et l'action refuse en silence — la mécanique de
  « Saisir un résultat » de T4.4, où la même donnée décide du lien et de l'action ; il réapparaîtra
  de lui-même avec « Retirer le résultat » en T4bis.6 ; (2) il traverse les **cinq** groupes,
  « Annulé » compris — l'archivage n'est pas une transition d'état, il ne fait pas sortir de
  `cancelled`, il sort du récit ; (3) il se lit **« Archiver la saisie »** et non « Archiver », que
  deux lettres sépareraient d'« Annuler » dans la même colonne.
  **Aucun composant n'a eu à changer de nature, et la page pas davantage.** `archiveActivity` est le
  sixième geste gouverné par le `canWrite` de T4bis.3 : il tombe avec les cinq autres sur un
  accompagnement archivé, sans qu'aucune condition s'ajoute — la propriété que ce `&&` cherchait,
  vérifiée pour la première fois.
  **La conséquence de T4.1, retranchée dans le même geste.** `listProjectResources` joignait
  l'activité sans filtrer son archivage : « on décrit, on ne propose pas ». Le raisonnement tenait
  tant que rien n'archivait une activité ; ce ticket le rend faux et le récrit plutôt que de
  l'amender. Le filtre vit dans le `on`, jamais dans le `where` : **la ressource reste**, seul son
  libellé d'activité disparaît, et `activityLabel` retrouve la forme `null` qu'a déjà une ressource
  sans rattachement — l'écran n'a pas eu à changer.
  **Vérifications — les quatre disciplines.** `tsc`, `lint`, `vitest` (380 verts). Lu dans le HTML
  servi, sur « Autonomie des opérations courantes » : l'activité quitte la roadmap, la page reste
  entière ; les deux ressources qui citaient « Test utilisateur » restent avec leur titre, leur lien
  et leur type, **sans la mention « · Activité : Test utilisateur »** ; le geste est absent de
  l'entrée « Audit d'accessibilité », seule à porter un résultat, présent sur les quatre autres ;
  présent sur les deux entrées **annulées** de « Test projet », qui n'offrent pas « Modifier ».
  **La fraîcheur du produit a changé dans `/produits`** — « Espace client web » passe d'« octobre
  2026 » à « août 2026 » quand l'activité d'octobre est archivée, et y revient au rétablissement :
  la preuve du recalcul par la couche, lue et non affirmée, sans qu'une ligne du ticket n'écrive
  `last_activity_at`. Tests mis en défaut : neutraliser `isNull(activities.archivedAt)` fait tomber
  **exactement** le test inversé, et rien d'autre. Contraste : `content-primary-dark` sur
  `surface-neutral-pale`, mesuré à **15,72:1**, et surtout **aucun couple neuf par la position** —
  `ACTION_LINK` est repris tel quel des quatre autres gestes de l'entrée. Le droit éprouvé par
  l'action, quatre refus séparément et base relue à chaque fois : activité portant un résultat ;
  membre non contributeur ; activité d'un autre accompagnement ; accompagnement archivé. Puis le
  constat positif qui ferme le raisonnement : la même charge sous le cookie d'une **contributrice
  désignée non responsable de domaine** archive — le droit est bien `writeProject`, pas
  `manageDomain`.
  **Un faux départ, gardé parce qu'il instruit :** le premier essai du refus « membre non
  contributeur » a **écrit**. Non que la garde ait cédé, mais parce que le cookie désignait une
  personne dont `has_access` est faux : le repli du stub retombe alors sur le responsable de domaine.
  L'essai refait sous une personne à session réelle a tenu. Le cookie du stub ne vaut que pour qui a
  un accès.

### T4bis.5 — corriger et retirer une ressource — 15/08/2026

**Le manque (4), pour sa moitié « ressource ».** La ressource était, avec le résultat, le dernier
objet de Vision sans chemin de correction : T4.2 n'avait écrit que la création, et son arbitrage (a)
renvoyait explicitement ici. Une ressource mal collée ne se réparait par aucun geste et ne se retirait
pas davantage — `resources` n'avait aucun appelant d'`archive()`. Le panneau de T4.2 devient un
panneau à deux gestes, ouvert par `?ressource=<identifiant>` — la forme d'`?activite=` depuis T3.4,
que `lib/navigation.ts` annonçait déjà en toutes lettres —, et chaque entrée du bloc « Ressources »
gagne ses deux points d'entrée. L'autre moitié du manque, le résultat et la migration de
`results_activity_unique`, reste à T4bis.6.

**Neuf fichiers, aucun hors périmètre.** `lib/navigation.ts` (une route, un commentaire récrit),
`lib/forms/resource.ts` (`toResourceFormValues`, jumelle de celle de l'activité),
`lib/queries/resources.ts` (`findResourceActivity`, une lecture et une seule),
`components/projects/resource-panel.tsx` (trois propriétés optionnelles),
`components/projects/resources.tsx` (deux propriétés, une rangée de gestes),
`app/(app)/projets/[id]/actions.ts` (`openResource`, `updateResource`, `archiveResource`),
`app/(app)/projets/[id]/page.tsx`, plus les deux fichiers de tests. `listProjectResources` n'a pas
bougé d'un caractère, et le panneau n'a pas été redit : **quatrième copie de `PanelField` évitée.**

**Une porte, deux gestes — le dessin d'`openActivity` transposé.** `openResource` enchaîne
`openProject` — droit `writeProject` sur le projet **reçu**, appartenance au domaine, lecture seule
d'un accompagnement archivé — puis le second contrôle que la fiche exige : la ressource existe,
relève de **ce** projet, n'est pas archivée. Sans lui, une soumission forgée corrigerait la ressource
d'un autre accompagnement. Les deux actions passent par cette seule ligne ; `updateResource` rend la
saisie refusée, `archiveResource` refuse en silence — il n'a aucune saisie à rendre.

**L'exception nominative, étendue là où la fiche s'arrêtait.** La fiche ne nommait que l'activité
archivée ; l'activité **annulée** est dans le même cas et il est atteignable, les options du panneau
se dérivant de la roadmap moins le groupe « Annulé ». Une règle, un chemin de code :
`findResourceActivity` ne filtre ni sur `archived_at` ni sur `state`, et rapproche du `projectId` en
SQL ; `checkResourceActivity` accepte l'archivée si et seulement si c'est celle déjà portée.
`createResource` n'a pas changé d'un caractère. Lu dans le HTML servi : l'option est ajoutée et
`selected` dans les deux cas, **une seule** option de plus que le panneau de création, qui n'en
propose aucune des deux.

**Les quatre disciplines.** Le critère lu dans le balisage servi : les deux gestes nommés par leur
ressource, les quatre champs pré-remplis et les deux `selected`, la correction visible aussitôt dans
le bloc, l'entrée qui disparaît à l'archivage, l'état vide qui revient sur la dernière, et la page nue
— aucun `role="dialog"` — pour une ressource d'un autre projet, un identifiant inconnu, une valeur qui
n'est pas un UUID, et l'exclusivité éprouvée à quatre clés. Les tests mis en défaut un par un, chacun
faisant tomber **exactement un** test : le rapprochement au projet, le filtre de domaine, le `?? ""`.
Le contraste mesuré — 15,72:1 — sur le seul couple concerné, qui n'était pas neuf par la position. Le
droit éprouvé par l'action, six charges séparées, base comptée avant et après : trois ressources
vivantes sur trois avant, trois sur trois après, la ligne visée portant le même `updated_at` qu'avant
la première charge.

**Ce que la mise en défaut a réellement trouvé.** Retirer `filter(activities)` de
`findResourceActivity` n'a fait tomber **aucun** test : le test « autre domaine » était porté par
`filter(activityTypes)`, les deux filtres se rattrapant l'un l'autre. Plutôt que de déclarer la
discipline passée, un test isolant a été ajouté — une activité du domaine A dont le type appartient au
domaine B, forgée par `db.insert` direct — et la sabotage refaite tombe exactement dessus. **Un test
vert au retrait d'une règle est un test qui ne la couvre pas, même s'il porte son nom.**

### T4bis.6 — corriger et retirer un résultat, et sa migration — 15/08/2026

**L'autre moitié du manque (4), et le seul ticket du chantier qui touche le schéma.** Le résultat
était le dernier objet de Vision sans chemin de correction. Mais là où la ressource ne demandait
qu'un panneau à deux gestes, le résultat exigeait d'abord une **migration** :
`results_activity_unique` portait sur `activity_id` seul et ignorait `archived_at`, si bien qu'un
résultat archivé occupait toujours la place de son activité. Retirer ne libérait rien, et la
ressaisie levait une violation d'unicité — une exception PostgreSQL, donc un 500, là où l'on attend
un écran. T4.3 avait relevé le piège, T4.4 l'avait **épousé** plutôt que contourné.

**Dix fichiers, aucun hors périmètre.** `lib/db/schema.ts` et `drizzle/0001_easy_prowler.sql`,
`lib/forms/result.ts` (`toResultFormValues`), `lib/queries/activities.ts` (`ActivityResult` gagne
`id` et `toolId` ; `listResultToolOptions` gagne `keepToolId`),
`components/projects/result-panel.tsx` (trois propriétés optionnelles),
`components/projects/roadmap.tsx`, `app/(app)/projets/[id]/actions.ts` (`openResult`,
`updateResult`, `archiveResult`), `app/(app)/projets/[id]/page.tsx`, plus les deux fichiers de
tests. **`lib/navigation.ts` n'a pas été touché**, et c'est la propriété du ticket :
`?resultat=<identifiant d'activité>` désigne la **cible**, jamais le geste, si bien que la même
adresse saisit quand l'activité n'a pas de résultat et corrige quand elle en porte un. T4bis.5 avait
dû ajouter une route ; ici la forme posée par T4.4 suffisait déjà, sans en avoir eu l'intention.

**La migration d'abord, et le `includeArchived` avec elle.** L'index devient partiel,
`where archived_at is null`, **sans changer de nom** — quatre commentaires de code, le journal et
deux fiches le nomment. `drizzle-kit` a rendu le `DROP CONSTRAINT` avant le `CREATE UNIQUE INDEX`,
l'ordre qu'il fallait pour réutiliser le nom ; l'ordre a été relu dans le fichier généré avant
d'être appliqué, sur la base de développement **et** sur la branche de test. Dans le même geste, le
`includeArchived: true` de `checkResultActivity` est tombé : écrit par T4.4 pour épouser l'ancienne
contrainte, il aurait interdit la ressaisie que la migration venait d'autoriser. Sa fiche exigeait
qu'ils se relisent ensemble ; c'est le seul endroit du chantier où un ticket défait une ligne écrite
par un ticket antérieur.

**Quatrième porte, un maillon de plus que les trois autres.** `openResult` enchaîne `openProject`
sur le projet **reçu**, rapproche l'activité **reçue** de ce projet, puis le résultat **reçu** de
cette activité. Le troisième contrôle n'est pas redondant : `results` n'a pas de `project_id`, et
sans lui une soumission forgée corrigerait le résultat d'une autre activité du même accompagnement.
Ce qu'`openResult` ne contrôle **pas**, et volontairement : l'état de l'activité. Un résultat ne
s'écrit que sur une activité terminée — `assertPreconditions` en reste la seule autorité — mais
`resolveActivityPeriod` redérive l'état quand la période bouge, et exiger `done` pour corriger
aurait rendu intouchable un résultat que l'écran continue d'afficher.

**Les deux gestes suivent le résultat ; la saisie garde ses quatre conditions.** C'est l'arbitrage le
moins visible du ticket et le plus conséquent. Dans la roadmap comme dans la page, l'expression est
la même à un `||` près : `result !== null || (groupe « done » && producesResult)`. « Archiver le
résultat » et « Archiver la saisie » ne peuvent jamais se trouver côte à côte — l'un ne paraît que si
l'entrée porte un résultat, l'autre que si elle n'en porte pas —, ce qui a évité d'inventer le verbe
que T4bis.4 redoutait.

**Le critère qui n'existait pas avant ce ticket, lu à l'écran.** Sur « Test projet » : la valeur
corrigée de 34 à « 41,5 » — virgule acceptée, normalisée en base — paraît aussitôt sur l'entrée
(« 41,5/100 ») ; retirée, la ligne de résultat disparaît et « Saisir un résultat » **et** « Archiver
la saisie » reparaissent ensemble ; **une seconde saisie sur la même activité est acceptée**, et la
base porte alors deux lignes sur le même `activity_id`, une rangée et une vivante. Le chemin complet
que T4bis.4 annonçait — retirer le résultat, puis archiver la saisie — a été joué jusqu'au bout et
remis en état.

**L'exception nominative, éprouvée des deux côtés.** L'outil « Ergonome » archivé le temps de la
vérification : il reste **sélectionné** dans le panneau du résultat qui le porte, et il est **absent**
du panneau d'un autre résultat — la nominativité se lit dans deux balisages servis, pas dans un
raisonnement. La re-soumission à l'identique du premier panneau est acceptée et laisse `tool_id`
intact : c'est exactement la perte silencieuse que T4bis.1 a refermée ailleurs, et elle n'a pas lieu.

**Le droit éprouvé par l'action, et la preuve faite par différence.** Six charges forgées refusées,
base comptée avant et après, rigoureusement identique : `archiveResult` et `updateResult` sous le
cookie d'un membre non contributeur, `resultId` réécrit vers le résultat d'un autre accompagnement,
`activityId` vers l'activité d'un autre, `projectId` vers un autre projet. Les refus qui **rendent**
un message l'ont affiché — « Ce résultat n'existe plus sur cette activité. » —, et les cinq refus de
T4.4 tiennent en correction, éprouvés séparément, la saisie revenant avec ses valeurs. Le refus du
membre, lui, n'affiche rien : le panneau n'est pas monté pour qui ne peut pas écrire, et une absence
d'alerte ne prouve rien. La preuve retenue est la **différence** — la même charge n'écrit pas sous un
cookie et écrit sous l'autre. Même protocole pour la lecture seule : deux charges récoltées **avant**
l'archivage du projet, refusées après, puis acceptées non retouchées après rétablissement.

**La mise en défaut a porté trois fois.** La contrainte totale rétablie à la main sur la branche de
test fait tomber **le seul** test de ressaisie et rien d'autre — les deux autres tests du bloc
éprouvent la règle qui survit à la migration, ils devaient rester verts. `keepToolId` neutralisée,
puis le filtre de domaine de `tools` neutralisé dans la couche, font tomber le seul test qui les
isole. C'est le trou que T4bis.5 avait découvert **après coup** sur `findResourceActivity` ; ici le
test isolant a été écrit d'avance, et il tient.

- **T5.1 — 16/08/2026 — le bloc « Indicateurs » de la page produit, en lecture.** Les trois tables
  d'indicateurs dorment depuis T1.2 ; ce ticket en ouvre la première lecture, et la page produit dit
  enfin ce que le produit mesure. Six fichiers : `lib/queries/indicators.ts` et son test,
  `components/products/indicators.tsx`, la page produit, plus `lib/format.ts` et son test au titre de
  l'écart déclaré.

**L'agrégat est le seul choix technique du ticket, et il se justifie par ce qu'un `max()` ne donne
pas.** La fiche exige « une seule lecture par écran, jointe, jamais une requête par indicateur »,
avec le dernier relevé **et** le décompte. `count(readings.id)` se pose sans effort ; la date aussi,
par `max(read_on)` ; mais la **valeur** portée par la ligne la plus récente n'est pas la plus grande
des valeurs, et un `max(value)` aurait rendu la bonne réponse sur la série croissante du brief — 54,
63, 71 — en mentant sur toute série décroissante. Retenu :
`(array_agg(<colonne> order by read_on desc, id desc))[1]`, deux fois, dans le même passage que le
décompte. Le `leftJoin` fait le reste : sur zéro ligne jointe, `count` vaut 0 et `array_agg` vaut
`null`, si bien que l'indicateur sans relevé sort **sans un cas particulier dans le code**. Le
`id desc` départage deux relevés du même jour — `read_on` seule ne tranche pas, et un ordre qui
varierait d'un affichage à l'autre serait un défaut.

**Les tests portent quatre pièges que la seule fixture n'aurait pas montrés.** Un indicateur
alphabétiquement **premier** mais archivé — sans le filtre, il ouvre la liste ; une série
**décroissante**, seule à distinguer l'agrégat ordonné d'un `max(value)` ; deux relevés au **même
jour**, dont on éprouve la stabilité d'un appel à l'autre plutôt qu'une valeur qu'un tirage décide ;
un relevé **forgé** écrit hors couche scopée, sans lequel `filter(indicatorReadings)` reste
infalsifiable — la leçon de `resources.test.ts`, la jointure portant sur une clé primaire que la
couche refuse déjà d'écrire de travers. Les libellés de la fixture sont **sans accent**, l'ordre
alphabétique d'un caractère accentué dépendant de la collation de la base : un test d'ordre ne se
fait pas dépendre d'elle.

**La mise en défaut a porté trois fois, et une seule a demandé une explication.** Neutraliser
`filter(indicators)` fait tomber **un** test, celui du produit d'un autre domaine — et pas le
second test d'étanchéité, `eq(productId)` le rattrapant déjà : c'est la propriété relevée de T2.2 à
T3.1, « les filtres se rattrapent l'un l'autre », vérifiée une septième fois. Neutraliser
`filter(indicatorReadings)` fait tomber le seul test de relevé forgé. Neutraliser le filtre
d'archivage en fait tomber **deux** — celui qui nomme l'indicateur archivé et celui de l'ordre, qui
l'attend absent de la tête de liste : c'est le même fait constaté deux fois, et c'est la fixture qui
l'a voulu ainsi.

**Trois formats neufs, et l'écart de périmètre qui les accompagne.** `formatMonth` prend un `Date`,
`parseDay` est privé, et aucune fonction ne rendait le **mois** d'une colonne `date` : sans
`formatDateMonth`, chaque écran refaisait la conversion et avec elle la raison du fuseau explicite.
`formatReadings` écrit zéro en toutes lettres, comme `formatAccompaniments` et `formatProjects`.
`formatIndicatorDirection` porte un `Record` exhaustif à la compilation, comme
`formatResourceType` — et son test épingle l'interdit : aucune des deux formulations ne contient
« bon », « mauvais », « objectif », « cible » ni « atteint ». La direction dit dans quel sens la
courbe se lit, jamais si un chiffre est bon.

**Le critère s'est lu dans le HTML servi, trois fois.** L'indicateur du brief avec « 71 % » — dont
l'espace insécable a été vérifiée sur le point de code, `od -c` —, « juin 2026 » et « 3 relevés » ;
un indicateur ajouté à la main **sans relevé**, qui affiche « Aucun relevé pour l'instant. » et dont
le bloc entier ne contient **aucune** date ; deux produits sans indicateur, qui rendent le paragraphe
d'état vide sous un `h2` unique. Contrastes mesurés sur le fond du bloc : 17,87:1 pour le libellé,
8,12:1 pour le dernier relevé, 4,98:1 pour la ligne de contexte et pour le séparateur `·` — aucun
couple neuf par la position, tous repris de `Section` et de `Resources`, et **aucun septième
substitut** inventé.

**Le dû hors périmètre — le parcours d'archivage produit, joué en entier.** Il attendait depuis
T4bis.2, faute d'une session qui puisse lancer `next dev`. Le protocole de re-soumission de T4bis.3
s'y est transposé tel quel, sur le produit jetable « test » dont l'unique accompagnement a été rangé
d'abord — l'arbitrage (e) l'exigeant. **Ses six points, un par un :** (1) archiver puis rétablir
depuis la page, tous deux acceptés, la page archivée gardant sa mention datée « en août 2026 », son
seul geste « Rétablir », et son bloc « Indicateurs » toujours lu — règle 4 ; (2) `/produits/{id}/
modifier` en **404** sur le produit archivé ; (3) `updateProduct` reposté après archivage, refusé —
et ce refus **isolé**, la route en 404 ne prouvant rien : le `notFound()` de `modifier/page.tsx` a
été neutralisé le temps d'une soumission, la page a rendu 200, l'action a refusé seule par « Ce
produit est archivé : il ne se modifie plus. », la base est restée intacte, et le fichier a été remis
à l'identique — `git diff` vide ; (4) `archiveProduct` sous cookie de membre, refusé par « réservés
au responsable de domaine » ; (5) `restoreProduct` sous le même cookie, refusé en silence, base
comptée avant et après ; (6) le **refus (e) relu deux fois** — « 3 accompagnements non archivés » sur
« Espace client web », « 1 accompagnement non archivé » sur « Déclaration de sinistre en ligne ».

**C'est l'étape qui ferme le raisonnement qui a coûté le plus de soin.** Un refus seul ne prouve
rien : une charge malformée refuse pareil. Chacune des quatre charges a donc été rejouée
**non retouchée** sous l'autre identité ou dans l'autre état — même charge, deux issues. La preuve
tient à cette différence, jamais au refus. Une charge de `restoreProduct` a d'abord été bâtie avec un
`$ACTION_KEY` que le formulaire de rétablissement **ne porte pas** — c'est un formulaire nu, sans
`useActionState` — et elle a donc été refaite avant de compter quoi que ce soit : une charge qui
n'est pas celle de l'écran ne prouve rien non plus.

**Ce que le parcours a trouvé, et que personne n'avait lu.** Le refus (e) au **singulier** dit :
« Ce produit porte encore 1 accompagnement non archivé. Archivez-**le** d'abord : ranger le produit
**les** ferait disparaître des listes sans les ranger. » Le `plural` gouverne le nom et le premier
pronom ; les deux derniers sont écrits en dur au pluriel. Défaut de langue seul, sans conséquence sur
le refus ni sur la base — hors périmètre de fichiers, consigné dans `ETAT.md` avec sa destination.
La base de développement a été **remise dans son état d'avant** : nom du produit, accompagnement
rétabli, indicateur de sonde retiré. La dérive inventoriée dans `ETAT.md` n'a pas augmenté.

- **T5.2 — 16/08/2026 — créer, corriger et archiver un indicateur.** Le premier écran d'écriture de
la page produit depuis T2.5, et le premier objet de C5 livré **avec ses trois gestes** (arbitrage (a)
de `tickets-C5.md`) : un objet livré sans son geste de correction est une dette datée du jour de sa
livraison, et C4bis a coûté six tickets pour rattraper leur absence sur cinq objets.

**Le droit dérivé, et ce qu'il coûte : rien.** L'arbitrage (b) veut `manageDomain`, ou contributeur
désigné d'au moins un accompagnement du produit. À l'écran, aucune requête neuve — `projects` est
déjà lu, et `session.can.writeProject` répond sur chacun ; dans l'action, une lecture scopée
ordinaire des accompagnements du produit **reçu**, dont `list` écarte les archivés d'elle-même, si
bien que l'écran et l'action posent exactement la même question. Le responsable de domaine
court-circuite la condition : sa requête n'a pas lieu.

**Trois arbitrages tranchés avant écriture.** (1) **Un produit archivé ne reçoit plus de saisie
d'indicateur** — la fiche ne le disait pas ; c'est la transposition de T4bis.2, où `updateProduct`
refuse le produit archivé reçu, et de T4bis.3, où un accompagnement archivé est en lecture seule
strictement. Sans elle, le responsable de domaine écrirait des indicateurs sur un produit que plus
aucune liste n'affiche. (2) **La porte lit le produit avant d'évaluer le droit**, l'inverse
d'`openProduct` : `manageDomain` ne dépend d'aucun identifiant et s'énonce avant toute lecture, là
où un droit **dérivé des accompagnements du produit** ne s'énonce pas avant de connaître le produit.
L'ordre ne divulgue rien — la page produit est lisible par tout le domaine (D9). (3)
**`lib/queries/indicators.ts`, nommé par la fiche, n'a rien reçu** : `listProductIndicators` écarte
déjà les archivés, et le panneau en correction lit sa ligne par `session.db.find`, la forme de la
page projet avec `find(activities, …)`. Toucher un fichier pour honorer une liste aurait été l'écrire
sans raison.

**La règle d'exclusivité arrive sur la page produit, et elle y arrive par décompte.** Deux clés
seulement — `archiver` et `indicateur` —, ce qu'une comparaison binaire aurait suffi à porter ; c'est
la forme de la page projet (T4.4, T4bis.3) qui a été reprise, parce qu'elle reste juste quand T5.3
ajoutera `releve`. Un seul `panelOpen`, un seul `inert`, un seul panneau monté.

**Le critère s'est lu dans le HTML servi, geste par geste.** Le panneau s'ouvre vide sur
`?indicateur=nouvel`, `role="dialog"` et `inert` comptés à 1 chacun ; un indicateur créé — « Délai
moyen de traitement d'une réclamation », `s`, « Plus bas vaut mieux » — paraît **aussitôt** dans le
bloc de T5.1, à sa place alphabétique, avec « Aucun relevé pour l'instant. » et **aucune date
inventée** ; corrigé, il s'affiche sous son nouveau libellé, son unité passée à « jours » et sa source
vidée partie à `null` et non en chaîne vide ; archivé par le geste réel, il quitte le bloc et
`archived_at` est posé — rien n'est supprimé. Les deux clés présentes ensemble rendent la **page
nue** : zéro `dialog`, zéro `inert`. `?indicateur=n-importe-quoi` rend 200, jamais un 500, la forme
étant vérifiée avant la base.

**Le droit s'est éprouvé par l'action, jamais par l'écran.** Les charges récoltées sur la page servie
à Camille Roux (responsable de domaine) ont été repostées sous le cookie de **Thomas Lemaire**,
contributeur d'un accompagnement d'un **autre** produit : les trois actions refusent, chacune avec
son message propre — vérifié dans le flux rendu, et non déduit de l'absence d'effet, un 500 refusant
à l'identique —, et la base est restée à trois lignes, libellé inchangé, `archived_at` nul. La contre-
épreuve fait la preuve : **Sofia Marchand**, membre contributrice de « Refonte du parcours de
virement », qui est un accompagnement de ce produit, écrit — sa ligne est en base. Une charge
**forgée** réécrivant le produit lié vers « Déclaration de sinistre en ligne » tout en gardant
l'indicateur d'« Espace client web » est refusée par « Cet indicateur n'existe plus sur ce produit. »
(D11). Sur le produit archivé à la main, la charge récoltée **avant** l'archivage est refusée par
« Ce produit est archivé : il ne reçoit plus de saisie. » — une route retirée n'a jamais protégé
l'action qu'elle affichait. Le piège de T5.1 a resservi : `$ACTION_KEY` n'existe que sur les
formulaires de `useActionState`, et le formulaire nu d'archivage ne le porte pas ; les charges sont
donc récoltées **formulaire par formulaire**, jamais page par page.

**Les tests se sont mis en défaut, deux fois, et rien d'autre n'est tombé.** Neutraliser l'obligation
du libellé fait tomber trois tests — les deux qui l'isolent, et celui qui nomme `label` parmi les
deux erreurs simultanées. Neutraliser la liste fermée du sens de lecture en fait tomber deux, ceux
qui l'isolent. Le module a été relu intact après chaque neutralisation, `git diff` vide.

**Contraste mesuré, et aucun couple neuf.** Huit couples relevés, tous retombant sur des valeurs déjà
consignées : 15,72:1 pour « Modifier », « Archiver » et « + Ajouter un indicateur » en
`content-primary-dark`, 3,88:1 pour la bordure du lien et celle des contrôles, 13,65:1 pour le bouton
plein de l'état vide, 17,87:1 pour le libellé, 4,98:1 pour le décompte, 8,12:1 pour le filet du
panneau. **Aucun septième substitut** inventé — la règle de T2.3, tenue pour un quatrième formulaire.

**Ce que le ticket laisse derrière lui.** Une **quatrième copie de `PanelField`**, redite plutôt
qu'importée pour la raison des trois précédentes, et une seconde copie d'`ACTION_LINK` — la dette est
au journal, l'extraction appartient au ticket qui pourra toucher les fichiers ensemble. Deux
indicateurs archivés dans la base de développement, ajoutés à l'inventaire de dérive d'`ETAT.md` : la
base est jetable, règle du 14/08/2026.

- **T5.3 — 16/08/2026 — saisir, corriger et retirer un relevé, et sa migration.** La série datée sans
laquelle la frise de T5.6 n'a rien à tracer, et le seul ticket de C5 qui touche le schéma.

**La migration d'abord, et elle tient en une ligne.** `ALTER TABLE "indicator_readings" ADD COLUMN
"archived_at" timestamp with time zone` — nullable, sans valeur par défaut, sans toucher une ligne.
Le SQL généré a été relu **avant** exécution, et il ne contient rien d'autre. Sans elle, retirer un
relevé saisi en double n'avait que la suppression pour chemin, que la règle 4 interdit et que la
couche d'accès n'expose pas.

**C'est la première épreuve d'`hasArchivedAt`, et elle réussit sans qu'une ligne change.** `archive`,
`restore` et le filtre des vivants de `lib/db/scoped.ts` introspectent le schéma : le jour où la
colonne existe, la table est couverte. C'est la propriété que T1.3 cherchait, écrite depuis C1 et
jamais vérifiée par un cas réel — un `archiveReading` de quatre lignes en fait la démonstration.

**Le filtre des relevés retirés se pose dans le `on`, à l'emplacement que T5.1 avait écrit
d'avance.** Le module portait la consigne depuis la veille : « le filtre est **dans la jointure** et
non dans le `where`, sans quoi il emporterait l'indicateur avec ses relevés au lieu de n'écarter que
les relevés ». Les trois agrégats l'écartent donc ensemble — un relevé retiré ne compte plus et ne
fournit plus le dernier relevé, du même geste. La lecture de la série, elle, filtre dans son `where`,
et c'est un **second** filtre, distinct : les deux mises en défaut le prouvent séparément.

**Deux lectures, et le regroupement à l'écran.** `listProductReadings` rend la série **plate** et déjà
ordonnée `read_on desc, id desc` — le **même** couple que l'agrégat ordonné de T5.1, et ce n'est pas
une coïncidence à préserver par la relecture : c'est ce qui fait que la première ligne de la série
d'un indicateur **est** le « dernier relevé » affiché au-dessus d'elle. Un test le retient
explicitement, pour tous les indicateurs mesurés à la fois. La jointure est un `innerJoin`, à
l'inverse de celle de T5.1 : elle n'est pas là pour rendre une colonne, elle **est** la question —
elle porte le rattachement au produit et l'archivage de l'indicateur, si bien que les relevés d'un
indicateur archivé sortent avec lui.

**Le décompte d'exclusivité a absorbé une troisième clé sans changer d'énoncé.** `releve` entre dans
l'objet `keys`, et rien d'autre ne bouge : c'est très exactement ce pour quoi T4.4 avait remplacé la
comparaison binaire par un décompte. Sa valeur change de **table** et non de nature — un identifiant
d'indicateur saisit, un identifiant de relevé corrige —, tranché par deux lectures scopées
successives, la forme est vérifiée avant la base, et ce qui n'est ni l'un ni l'autre n'ouvre rien.

**Le critère se lit dans le HTML servi, en quatre temps.** Un relevé saisi à 45,5 % en juillet 2026
paraît **en tête de sa série** et devient le « dernier relevé » du bloc, le décompte passant à
4 ; corrigé sur février 2024, il descend en queue de série et le dernier relevé redevient
« 71 % · juin 2026 » ; retiré, il disparaît de l'écran et **reste en base, marqué archivé** ;
**ressaisi à l'identique, il est accepté** — le critère de T4bis.6, et la seule preuve que la
migration tient. Un indicateur créé sans relevé affiche « Aucun relevé pour l'instant. », « Aucun
relevé », **aucune date nulle part**, et « Ajouter un relevé » juste sous la phrase qui dit
l'absence.

**Le droit s'est éprouvé par l'action, sur des charges non retouchées.** Sous le cookie d'Awa Diallo
— membre du domaine, membre d'un accompagnement de ce produit mais **non contributrice** —, l'écran
sert le bloc et sa série **sans un seul geste**, et la charge de saisie récoltée chez la responsable
est refusée mot pour mot : « La saisie d'un relevé est réservée au responsable de domaine et aux
contributeurs désignés d'un accompagnement de ce produit. » Le retrait, lui, refuse **en silence** :
il a fallu la différence entre deux identités sur la **même** charge pour le prouver — refusée sous
son cookie, la base à quatre relevés vivants ; acceptée sous celui de la responsable, trois. Deux
charges délibérément forgées ont été refusées de leur côté : le relevé de ce produit présenté comme
celui d'un autre (« Ce relevé n'existe plus sur ce produit. ») et la saisie sur un indicateur
inexistant (« Cet indicateur n'existe plus sur ce produit. »), base comptée avant et après chacune.

**Les tests se sont mis en défaut, trois fois, et rien d'autre n'est tombé.** Neutraliser
l'obligation de date fait tomber **deux** tests, les deux qui soumettent une date vide. Neutraliser
le filtre des relevés retirés **dans le `on`** de `listProductIndicators` en fait tomber **quatre**,
tous ceux qui lisent le dernier relevé ou le décompte d'`Autonomie`, le test croisé compris.
Neutraliser celui du `where` de `listProductReadings` en fait tomber **quatre** autres, ceux de la
série — et le test croisé tombe dans les deux cas, ce qui est sa raison d'être. Les deux modules ont
été relus intacts après chaque neutralisation.

**Contraste mesuré, aucun couple neuf par la position.** 8,12:1 pour la valeur d'une ligne de série,
4,98:1 pour son mois, sa source et le `·` qui les sépare, 15,72:1 pour « Ajouter un relevé »,
« Modifier » et « Archiver ». Le filet de retrait de la série est `surface-neutral-lighter`, le
séparateur d'entrées du bloc depuis T5.1 : décoratif, mesuré à 1,24:1 et ne portant aucune
information — la série est déjà imbriquée dans le balisage. **Aucun septième substitut.**

**Un piège de harnais, et il ressemblait à un refus.** Les premières re-soumissions rendaient un 500
et « Failed to find Server Action » : le harnais récoltait les champs cachés par `name="…" value="…"`
et manquait `$ACTION_REF_<n>`, **rendu sans attribut `value`**. C'est exactement le piège consigné en
T4.4, retrouvé faute d'avoir relu le journal avant d'écrire le harnais. Une action introuvable laisse
la base intacte **exactement comme un droit qui refuse** — il a fallu lire le journal du serveur pour
le savoir. Le harnais final récolte formulaire par formulaire (T5.2) et poste tous les champs cachés,
`value` vide comprise.

**Ce que le ticket laisse derrière lui.** Une **cinquième copie de `PanelField`** et une troisième
d'`ACTION_LINK`, redites plutôt qu'importées pour la raison des précédentes ; deux fonctions de
`lib/forms/result.ts` — `isDecimal` et `decimalAsTyped` — **exportées** plutôt que recopiées, la
colonne `numeric(18,4)` étant la même des deux côtés. La base de développement est revenue à son état
d'avant : trois relevés, aucun archivé, trois indicateurs dont deux archivés depuis T5.2. L'inventaire
de dérive d'`ETAT.md` n'a pas grossi.

### T5.4 — adopter un indicateur depuis l'accompagnement — 16/08/2026

**Ce que le ticket livre.** Le deuxième bloc de référence de la page projet (`docs/06` §5), qui
portait depuis T4.1 un état vide **annoncé** dans `REFERENCE_BLOCKS` : « les indicateurs du produit
que cet accompagnement reprend à son compte s'afficheront ici ». La promesse est tenue. Chaque ligne
dit quatre valeurs **reportées** côte à côte — référence, cible, dernière valeur datée, valeur
finale — et pas un cinquième chiffre : aucun écart, aucune progression, aucun badge « cible
atteinte » (arbitrage (g), D39). `project_indicators`, dormante depuis T1.2 et semée par la fixture,
a enfin ses trois gestes.

**Trois arbitrages rendus avant écriture, et posés à l'humain.**

1. **Le « combien » du refus (e) atteint l'écran par le bloc, pas par l'action.** `archiveIndicator`
   est un geste nu — `Promise<void>`, un formulaire sans champ — et n'a **nulle part où afficher un
   message** : une valeur de retour ne serait même pas assignable au type de la prop qui la reçoit
   (`((indicatorId: string) => Promise<void>) | null`). Retenu : `listProductIndicators` rend un
   `adoptionCount`, et le bloc de la page produit remplace « Archiver » par une mention qui dit
   combien. **L'action refuse quand même, en silence** — le droit s'éprouve par l'action, l'écran ne
   fait qu'expliquer. Coût : un fichier hors fiche, `components/products/indicators.tsx`.
2. **Le pluriel du refus (e) d'`archiveProduct` se corrige ici.** `ETAT.md` lui donnait T5.4 pour
   destination — « un défaut se corrige avant d'être recopié » —, mais la fiche n'ouvre pas
   `app/(app)/produits/actions.ts`. Le fichier y entre **pour cette seule phrase**.
3. **`project_indicators.note` reste sans écrivain.** Quatre champs au panneau, pas un cinquième.

**Un écart de périmètre de plus, et il était forcé.** La fiche écrit « le panneau reprend la clé
`?indicateur=` » sans nommer de fichier pour ce panneau. `useActionState` impose un composant client,
et le faire porter par `adopted-indicators.tsx` aurait fait entrer tout le bloc dans le paquet
client, contre la forme de `Resources` et d'`Indicators`. **`components/projects/adoption-panel.tsx`
est donc créé**, comme `indicator-panel.tsx` l'a été en T5.2.

**Le décompte d'adoptions est une sous-requête corrélée, et c'est ce qui protège T5.1 et T5.3.** Un
`leftJoin` sur `project_indicators` aurait multiplié les lignes par le nombre d'adoptions :
`count(readings)` aurait compté chaque relevé autant de fois, et les deux agrégats ordonnés auraient
changé de sens sans changer de résultat sur une fixture à une seule adoption. La sous-requête laisse
la jointure de T5.1 et le filtre de T5.3 **exactement où ils sont**. Un test l'épingle en écrivant une
**seconde** adoption : sans lui, le défaut serait resté invisible.

**Le décompte d'exclusivité passe de quatre clés à cinq sans changer d'énoncé** — la deuxième fois
qu'une généralisation écrite d'avance est payée par un ticket ultérieur, après `archiver` en T4bis.3.
Éprouvé à l'écran : chaque clé seule ouvre son panneau, `indicateur` + `ressource` et `indicateur` +
`archiver` n'ouvrent **rien**.

**Le premier retrait par `unlink` d'un objet que l'écran offre, et un verbe neuf.** `syncParticipants`
utilisait déjà `unlink` depuis T3.6, mais sans point d'entrée nommé. Ici le geste s'écrit à l'écran, et
il ne pouvait pas s'appeler « Archiver » : rien n'est archivé, la ligne est supprimée, et
`project_indicators` n'a pas d'`archived_at` — `LinkTable` l'impose à la compilation. **« Retirer »**
est donc le premier verbe neuf depuis T3.5, et il l'est parce que le geste est neuf. Rien de la
mémoire du centre ne s'y perd : les relevés vivent sur l'indicateur.

**L'exception nominative couvre deux exclusions d'un seul chemin.** L'indicateur porté par l'adoption
éditée est **déjà adopté** — donc écarté de la liste — et il a pu être **archivé** avant que
l'arbitrage (e) ne l'interdise. `keepIndicatorId` le rétablit dans la requête, comme
`listResultToolOptions` le fait pour l'outil depuis T4bis.6. Lu à l'écran : en correction, l'option
est présente **et** `selected`, et la cible se réaffiche « 85 » et non « 85.0000 ».

**Comment le droit a été éprouvé.** Le protocole de T4bis.3, et le harnais de T5.2/T5.3 repris tel
quel — découpage du balisage **par `<form>`**, `$ACTION_REF_<n>` récolté **sans son `value`**, refus
lus dans le **flux RSC**. Sept refus lus littéralement, base comptée avant et après, inchangée :
membre non contributeur, indicateur archivé, indicateur d'un autre produit, seconde adoption du même
indicateur, identifiant fantaisiste, indicateur absent, valeur qui n'est pas un nombre. Puis
l'expérience contrôlée en six temps sur le projet archivé — récolte, témoin accepté, archivage, les
**mêmes charges** refusées et base intacte, rétablissement, les mêmes charges acceptées. Et enfin le
refus (e) par la même méthode : la charge d'archivage qui **écrit** quand l'indicateur est libre est
**refusée** dès qu'il est adopté, l'indicateur restant `archivé=non`.

**Le pluriel refermé, et lu dans ses deux états.** « Ce produit porte encore 1 accompagnement non
archivé. Archivez-**le** d'abord : ranger le produit **le** ferait disparaître des listes sans **le**
ranger. » et sa forme plurielle, toutes deux relues dans le flux. Deux phrases entières plutôt qu'un
suffixe : une phrase à trous ne se relit pas dans ses deux états, et c'est ainsi que le défaut avait
vécu de T4bis.2 à T5.1.

**Ce que le ticket laisse derrière lui.** Une **sixième copie de `PanelField`** et une quatrième
d'`ACTION_LINK` — à six copies, la dette cesse d'être bornée par la phrase qui la reportait. Un
séparateur d'abord posé à `content-neutral-light` (2,22:1) puis ramené à la couleur du texte, ses deux
côtés ayant la même graisse : la règle de T4bis.5, retrouvée à la mesure et non à la relecture. La base
de développement garde une adoption au **même contenu mais à l'identifiant neuf**, `unlink` ne rendant
pas sa ligne.

### T5.5 — la frise du temps long : l'axe, les accompagnements, les repères — 16/08/2026

**Ce que le ticket livre.** La couche que D26 réservait à C5, et que `docs/06` §6 place « au-dessus de
la liste, sans la déplacer » : un axe temporel commun au **mois** (D13), deux couches dessus et pas une
de plus — une bande par accompagnement daté, un repère par activité porteuse d'un résultat. La liste
des accompagnements n'a pas bougé d'une ligne et devient l'équivalent textuel de la frise. Le bloc
« Indicateurs » de T5.1 reste sous elle. Trois sections, dans l'ordre annoncé depuis T5.1 : frise,
accompagnements, indicateurs.

**Le premier dessin du projet, et il tient sans `viewBox`.** Le réflexe aurait été
`viewBox="0 0 720 H"` : à la largeur réelle de la page — 1 112 px de contenu sous `max-w-310` —, le
facteur d'échelle vaut 1,54, et un `text-xs` de 12 px se serait affiché à 18,5 px, plus gros que les
titres de section qui l'entourent. Retenu : **aucun `viewBox`**. Les abscisses sont des pourcentages
(`x="62.1622%"`), les ordonnées des pixels, et le texte de la frise a exactement la taille du reste de
la page à toute largeur d'écran. C'est aussi ce qui rend le critère lisible : `left + width` se relit
en pour cent dans le balisage servi, sans conversion.

**Quatre arbitrages rendus avant écriture, et posés à l'humain.**

1. **`role="group"`, et non le `role="img"` de la fiche.** La fiche demandait les deux : un
   `role="img"` **et** des bandes focusables menant à leur page projet. Les deux s'excluent — le
   contenu d'un `role="img"` est retiré de l'arbre d'accessibilité, et un `<a href>` qui y reste
   focalisable est un défaut WCAG 4.1.2, dans un produit dont le centre fait métier d'audits
   d'accessibilité. Retenu : `role="group"` porteur de l'`aria-label`, bandes focusables et nommées.
   Écart d'un mot, consigné au journal.
2. **Une seule lecture neuve.** Les bandes sont les accompagnements que `listProductProjects` rend
   **déjà** pour la liste juste en dessous : la page les passe au composant. Seuls les repères
   demandent `listProductMilestones`. C'est la discipline de l'arbitrage (b) de C5 — « aucune requête
   neuve » — tenue une seconde fois.
3. **Un repère se pose sur `results.measured_on`**, et non sur la période de son activité. La colonne
   est **non nulle en base** : aucun repère n'est écarté faute de date, là où une activité peut
   n'avoir aucune période — et `docs/03` §7 interdit de positionner arbitrairement ce qui n'a pas de
   date. C'est en outre la valeur que D39 autorise à reporter « avec sa date ».
4. **Une période ouverte court jusqu'à la borne de l'axe**, et sa période reste écrite « depuis
   février 2026 » à côté d'elle. Ce n'est pas une fin inventée : c'est l'axe qui l'arrête. Lu dans le
   balisage servi — `x="62.1622%"` + `width="37.8378%"` = 100 % exactement, jamais 100,0001.

**L'échelle est pure, et reçoit une liste de dates.** `timelineScale` ne prend ni projets ni repères
mais `(string | null)[]` : c'est ce qui permettra à T5.6 d'y verser les dates de relevé sans qu'un
calcul de borne change d'un caractère — la troisième fois qu'une généralisation s'écrit d'avance dans
C5, après le décompte d'exclusivité et l'emplacement du filtre d'archivage. Les indices de mois se
lisent **sur la chaîne** (`day.slice(0,4)`, `day.slice(5,7)`) et jamais par un `Date` : c'est
exactement le fuseau que `lib/format.ts` documente depuis T2.2, et une position n'a besoin d'aucun
objet temps.

**« Du premier début connu au dernier terme connu » ne pouvait pas se lire à la lettre.** Sur la
fixture, le dernier *terme* d'accompagnement est septembre 2024 — l'accompagnement en cours depuis
février 2026 n'a pas de fin — et le résultat le plus récent est mesuré en juin 2026. Une borne haute
posée sur les seules fins aurait laissé les deux hors de l'axe. Les bornes sont donc le min et le max
de **toutes** les dates connues des couches affichées, et la fiche se lit ainsi.

**Comment le critère a été relevé.** Dans le HTML servi, jamais affirmé. Sur « Espace client web » :
trois bandes et deux repères comptés un par un, l'axe de mars 2024 à mars 2027 — 37 mois, donc
2,7027 % par mois —, les trois graduations d'année à 27,027 / 59,4595 / 91,8919 % (10, 22 et 34 mois),
la bande terminée à 0 % sur 18,9189 % (7 mois, bornes comprises), la bande ouverte à 62,1622 % +
37,8378 % = 100 %, et les deux repères au **milieu** de leur mois — 6,7568 % pour mai 2024,
74,3243 % pour juin 2026. Puis un produit à un seul accompagnement, un produit dont la fenêtre tient
en **un seul mois** (bande pleine largeur, repère à 50 %), un produit **sans aucun accompagnement** et
un produit dont l'unique accompagnement **n'a aucune date** : deux états vides au texte distinct.
Enfin un produit **archivé** portant un accompagnement daté — page servie entière, frise comprise
(règle 4) — et la page lue sous le cookie d'une **membre non contributrice** : frise complète, trois
bandes, deux repères, **aucun geste d'écriture** (D9).

**Cinq neutralisations jouées, et chacune a dit quelque chose.** La borne haute figée fait tomber
**9 tests d'échelle et rien d'autre** ; chacun des trois filtres d'archivage retiré seul fait tomber
son propre test **et celui de l'ordre**, qui énumère la liste attendue. Le cinquième a mis au jour
autre chose : retirer `filter(results)` seul ne fait tomber **aucun test**, ni `filter(activities)`
seul — les quatre filtres de domaine se rattrapent l'un l'autre, comme `lib/queries/activities.ts`
l'écrit depuis T2.2. C'est leur retrait **ensemble** qui fait tomber le test d'étanchéité, seul.

**Contrastes mesurés, neuf couples, tous neufs par la position.** Les quatre remplissages de bande sur
`surface-neutral-pale` — 13,65:1 (`active`), 6,41:1 (`framing`), 4,98:1 (`paused`), 4,53:1 (`done`) —,
le filet d'axe et ses graduations à **3,88:1** (`content-neutral-normal`, le substitut de bordure de
contrôle en vigueur depuis T2.3), le repère à **4,43:1** (`surface-secondary-dark`), le contour de
focus à 4,76:1, et les deux textes à 17,87:1 et 4,98:1. Seuil de 3:1 pour une limite de composant,
4,5:1 pour un texte : tenus. **Aucun septième substitut inventé.**

**Ce que le ticket laisse derrière lui.** Une table `nature → couleur` **redite** en `fill-*` plutôt
qu'importée de `status-dot.tsx`, qui porte des `bg-*` et ne les exporte pas — la dette d'`ACTION_LINK`
sous une autre forme. Le contour de focus sur un `<a>` SVG n'a pas été **observé dans un navigateur** :
la règle `*:focus-visible` et l'ancre focalisable sont lues dans le CSS et le HTML servis, ce qui n'est
pas la même chose que de l'avoir vu. Et la base de développement est rendue telle qu'elle était : les
trois produits de sonde et leurs accompagnements ont été retirés après lecture.

---

### T5.6 — les courbes d'indicateurs sur la même frise — 17/08/2026

**Ce que le ticket livre.** La troisième couche de `docs/03` §7, et la clôture de C5 : une bande de
courbe par indicateur portant au moins un relevé, empilée sous les repères, sur l'axe temporel de
T5.5. Un point par relevé, un segment entre deux relevés consécutifs, un relevé isolé qui reste un
point. La cible s'affiche en repère horizontal tireté, avec sa valeur écrite. Les indicateurs sans
relevé sont **nommés sous la frise**, jamais posés à aujourd'hui. C'est la juxtaposition qui répond
« en donnant à lire, pas en concluant » : aucun écart, aucune tendance, aucun lissage, aucune
annotation de causalité.

**L'axe n'a pas bougé d'une ligne, et c'était écrit d'avance.** `timelineScale` recevait `(string |
null)[]` depuis T5.5 précisément pour ce jour : les dates de relevé se versent dans la liste, un
`...readings.map(r => r.readOn)` et rien d'autre. C'est la **quatrième** généralisation de C5 payée
au ticket suivant, après le décompte d'exclusivité, l'emplacement du filtre d'archivage et la liste
de dates elle-même.

**Une seule lecture neuve pour toute la couche.** Les courbes se tracent sur `listProductIndicators`
et `listProductReadings`, que la page lit **déjà** pour le bloc de T5.1 — la page les passe au
composant. Seules les cibles demandent `listProductTargets`, cinquième lecture du `Promise.all`.

**Le piège du dessin : `polyline` et `path` n'acceptent pas de pourcentage.** Leur `points` et leur
`d` ne prennent que des nombres — un `17.5676%` y est ignoré, et la courbe se dessinerait dans le
coin haut-gauche. La frise n'ayant pas de `viewBox` (choix de T5.5, pour que son texte garde la
taille du reste de la page), un segment est donc une `<line x1="…%" x2="…%">`, qui, elle, accepte les
pourcentages comme le filet de l'axe. Consigné au journal.

**Cinq arbitrages rendus avant écriture, et posés à l'humain.**

1. **Les fonctions pures d'échelle verticale vivent dans `lib/queries/timeline.ts`**, à côté de
   `monthBand` et de `monthMark`, et non dans `lib/queries/indicators.ts` que la fiche nommait :
   séparer la moitié d'un dessin d'avec l'autre ferait chercher la position verticale dans un module
   de lecture. Écart d'un fichier au périmètre, comme `adoption-panel.tsx` en T5.4.
2. **Un repère horizontal par adoption portant une cible**, et l'accompagnement nommé dès qu'une
   bande en porte plusieurs. Retenir « la cible du plus récent » aurait été un choix fait par
   Vision ; juxtaposer n'en fait aucun.
3. **Les deux bornes de chaque bande sont écrites.** Sans repère chiffré, l'échelle verticale d'une
   bande est invisible et la courbe s'approche du graphique décoratif que `docs/06` §10 interdit et
   que D41 refuse pour celle-ci. Ce sont des **valeurs reportées** — la plus basse et la plus haute
   de ce que la bande porte —, jamais un indice calculé (D39).
4. **Une seule couleur pour toutes les courbes** (`content-primary-dark`). L'arbitrage (d) donne à
   chaque indicateur **sa** bande : rien n'a besoin d'être distingué par la couleur, et une palette
   catégorielle absente du design system aurait été le septième substitut que la règle 2 interdit.
5. **La frise s'affiche dès qu'une couche est situable.** L'état vide de T5.5 tombait sur
   `bands.length === 0` ; il tombe désormais sur `bands.length === 0 && curves.length === 0`. Sans
   ce changement, un produit sans accompagnement daté mais portant des relevés aurait affiché « il
   n'y a rien à situer sur un axe » — une phrase fausse.

**La cible entre dans l'échelle de la bande, et cela se lit.** Hors des bornes, son trait ne se
verrait pas. Sur la fixture, l'échelle va donc de 54 à **85** — la cible — et non de 54 à 71 : le
dernier relevé se pose à 265,68 px et non au plafond de la bande. Deux valeurs reportées côte à
côte, jamais soustraites.

**Comment le critère a été relevé.** Dans le HTML servi, jamais affirmé. Sur « Espace client web »,
axe de mars 2024 à mars 2027 — **37 mois, la même fenêtre que les bandes**, les relevés n'ayant pas
déplacé les bornes : trois `<circle>` à 17,5676 / 33,7838 / 74,3243 % (septembre 2024, mars 2025,
juin 2026, au milieu de leur mois) et **deux** `<line>` de segment, ordonnées 292 / 278,0645 /
265,6774 recalculées à la main sur `plotBottom - offset × 48` ; le trait de cible à 244, soit le
plafond exact de la bande, et son texte « Cible 85 % ». Puis un indicateur **sans relevé** ajouté à
la main : nommé sous la frise, aucune bande — et un indicateur à **un seul relevé** : un `<circle>`
à mi-hauteur, **zéro** segment, ses deux bornes écrites « 12,5 s ». Enfin un produit **archivé sans
aucun accompagnement mais portant deux relevés** : frise servie entière, « aucun accompagnement daté
… 1 courbe d'indicateur » dans l'`aria-label`, **aucun geste d'écriture** — l'arbitrage (5) et la
règle 4 dans le même rendu. Un produit nu rend l'état vide, sans `<svg>`. Les trois sondes ont été
retirées après lecture.

**Le droit, éprouvé par ce qu'il y avait à éprouver.** Ce ticket **n'ouvre aucun point d'entrée** :
rien à reposter, et le rapporter autrement serait feindre une épreuve. Ce qui a été joué : la page
lue sous le cookie de deux membres **non contributeurs** — frise et courbes complètes, `0` geste
d'écriture (D9) — et le produit archivé ci-dessus.

**Quatre neutralisations, et la quatrième a resservi la leçon de T4bis.5.** `valueOffset` rendu
constant fait tomber **4 tests de position et rien d'autre** — les deux tests dont l'attente *est* 50
restent verts, ce qui est la bonne réponse et non un manque. `isNull(projects.archivedAt)` retiré fait
tomber le seul test de l'adoption sur accompagnement archivé ; `isNotNull(targetValue)` retiré fait
tomber les deux tests qui reposent sur l'absence de cible. Mais `filter(projects)` retiré ne faisait
tomber **aucun test** : les deux lectures croisées d'étanchéité restaient vertes, une adoption du
domaine `a` ne pointant jamais, en fonctionnement normal, vers un accompagnement du domaine `b`. Le
test qui l'isole a donc été écrit — une ligne forgée par `db.insert`, seule capable de l'éprouver —,
puis la neutralisation rejouée : il tombe, et lui seul.

**Contrastes mesurés, quatre couples neufs par la position.** Trait et points de courbe à
**15,72:1** (`content-primary-dark`), trait de cible et graduations de borne à **3,88:1**
(`content-neutral-normal`, le substitut de bordure de contrôle en vigueur depuis T2.3), textes de
cible et de bornes à **4,98:1**, libellé de bande à **17,87:1**. Seuil de 3:1 pour une limite de
composant, 4,5:1 pour un texte : tenus. Courbe contre trait de cible : 4,05:1, et le **tireté** les
distingue de toute façon — la couleur ne porte pas seule. **Aucun septième substitut inventé.**

**Ce que le ticket laisse derrière lui.** Une bande plate — un seul relevé, ou deux relevés égaux —
écrit **deux fois la même borne**, en haut et en bas : c'est exact, et redondant. Le regroupement des
relevés par indicateur est **redit** dans `timeline.tsx` alors qu'`indicators.tsx` en porte un depuis
T5.3, sous une autre forme et pour un autre tri : troisième dette de recopie du chantier, après
`ACTION_LINK` et la table `nature → couleur`.

---

### TD.1 — le socle des panneaux, et quatre correctifs de dette — 17/08/2026

**Pourquoi un ticket hors chantier.** C5 est clos, C6 n'est pas découpé : c'est la seule fenêtre où
un ticket peut ouvrir ensemble des fichiers que les fiches de chantier interdisaient de toucher.
`JOURNAL-TECHNIQUE.md` portait la même phrase quatre fois, de T4.2 à T5.6 — « le ticket qui pourra
ouvrir les fichiers concernés ensemble extrait, ou la dette cesse d'être bornée par la phrase qui la
reporte » —, et T5.4 était allé plus loin : « la dette n'est plus bornée par une phrase, et il faut
le dire ainsi ». Elle ne l'était plus. Périmètre arrêté avec l'humain avant écriture.

**Ce que le ticket livre.** Trois fichiers de socle, et huit fichiers qui cessent de se répéter.
`components/ui/form-field.tsx` remplace **huit copies** du même composant de champ — six
`PanelField` et deux `FormField` — et porte aussi `CONTROL`, `CONTROL_TEXT`, `borderOf` et
`FormAlert`, tous à huit exemplaires. `components/ui/panel.tsx` remplace **six coquilles** de
panneau, vérifiées identiques ligne à ligne : `FocusTrap`, voile, `role="dialog"`, en-tête, croix
`autoFocus`, bandeau `role="alert"`, `<form>` enveloppant, pied à deux gestes.
`components/ui/action-link.ts` remplace **quatre** `ACTION_LINK`. Bilan : **−2 181 / +1 205** lignes
sur les fichiers suivis, 332 dans les trois fichiers neufs, soit **−644 lignes nettes**.

**Le critère central était que rien ne change, et il a été lu.** Les 26 écrans et rendus de panneaux
ont été capturés servis avant modification, puis rejoués : les 12 rendus de panneaux dans leurs deux
modes, les deux panneaux de confirmation, les deux formulaires pleine page, les listes, la page
produit avec sa frise et son bloc d'indicateurs, la page projet, `/dev/session`. **Différences, à
données constantes : 18 espaces finaux dans un attribut `class`, et les 2 jetons de couleur de
`/dev/session`.** Rien d'autre. Les 18 viennent d'`activity-panel.tsx` et de `project-form.tsx`, les
deux seuls à interpoler `${className ?? ""}` : leurs champs sans `className` servaient
`class="flex flex-col gap-1.5 "`.

**Une donnée concurrente a d'abord faussé l'instrument, et c'est une leçon.** La comparaison finale
montrait un diff volumineux sur six écrans. Vérification faite en base : un indicateur « test » et
son relevé de 30 % avaient été créés **quatre minutes plus tôt**, depuis le navigateur, par la
personne courante — activité humaine concurrente dans la base de développement. Le diff a été refait
à données constantes, par `git stash` du travail, capture, `git stash pop`. **À retenir : une
comparaison avant/après sur une base partagée n'est un instrument que si les données n'ont pas bougé
entre les deux mesures ; sinon elle mesure la base, pas le code.**

**Correctif 1 — un produit archivé n'accueille plus d'accompagnement.** Trou ouvert par T4bis.2,
reporté par T4bis.3 dont la fiche portait l'interdit, destination écrite dans `ETAT.md` : « le
prochain ticket qui ouvre `app/(app)/projets/actions.ts` sans que sa fiche l'en empêche ». La règle
est posée dans `checkReferences`, **la porte que les deux actions traversent**, ce qui referme du
même geste le trou jumeau que le journal ne consignait pas : `updateProject` déplaçant un
accompagnement **vers** un produit rangé. L'exception est **nominative**, sur le modèle exact de
T4bis.1 — le produit que l'accompagnement porte déjà est toléré, sans quoi un accompagnement resté
sous un produit rangé deviendrait immodifiable. `submit` lit la ligne éditée **une fois** et la passe
à `write` : `updateProject` cesse de la relire.

**Le droit a été éprouvé par l'action, en six temps.** (1) Charge de `createProject` récoltée sur
`/projets/nouveau` servie, `$ACTION_REF_1` **sans `value`** compris. (2) **Témoin** : la même charge
sur un produit vivant écrit — 6 puis 7 projets. (3) Même charge, produit archivé substitué : refus
**nommé** lu dans le flux, base à 7. (4) `updateProject` : renommage sans changer de produit accepté,
déplacement vers le produit archivé refusé, et le nom resté celui du renommage — l'écriture entière
bloquée, pas à moitié. (5) **Exception nominative** : l'accompagnement déjà sous le produit rangé se
renomme toujours. (6) Règle neutralisée, **même charge** : acceptée, 8 projets, un accompagnement
invisible partout — exactement le défaut que T4bis.2 décrivait. Rétablie : refusée de nouveau.

**Un troisième visage du même piège de harnais.** T4.4 puis T5.3 avaient payé le `$ACTION_REF_<n>`
sans `value` — charge incomplète, 500, base intacte. Ici le harnais postait en
`application/x-www-form-urlencoded` là où React rend `encType="multipart/form-data"` : Next ne
reconnaît pas l'invocation, **ré-rend la page nue et répond 200 sans le moindre message**. Trois
formes, une seule conclusion : la base est intacte dans les trois cas, et dans les trois cas ce n'est
pas un refus. **C'est l'étape témoin qui les distingue, et rien d'autre** — sans elle, ce ticket
aurait conclu que la règle tenait alors que l'action ne s'exécutait pas.

**Correctif 2 — le niveau de titre d'`EmptyState`.** Défaut relevé en T2.4, présent depuis T2.2 :
le composant rendait un `h2`, `SectionHeader` aussi, et deux appels imbriquaient donc un `h2` sous un
`h2`. `level?: 2 | 3` à 2 par défaut ; les sept appels de premier niveau ne changent pas d'un
caractère, les deux imbriqués passent `level={3}`. Lu dans le HTML servi sur les deux : « Roadmap des
activités » `h2` → « Aucune activité pour l'instant » `h3`, et « Accompagnements » `h2` → « Aucun
accompagnement pour l'instant » `h3`. Mis en défaut : `level` neutralisé, les deux `h3` redeviennent
`h2`. **Les trois blocs qui avaient contourné le composant par un `<p>` — `resources.tsx`,
`indicators.tsx`, `timeline.tsx` — n'y sont pas ramenés** : leur raison de fond n'était pas le `h2`
mais le cadre tireté à `px-8 py-11` dans une demi-largeur de grille, et pour `timeline.tsx` **deux
phrases distinctes** là où `EmptyState` n'a qu'un `description`. Leurs commentaires sont récrits,
puisqu'ils invoquaient un doublon qui n'existe plus.

**Correctif 3 — le contraste de `/dev/session`.** T1.6 avait mesuré `content-neutral-light` à
2,11:1 et l'avait laissé là, « à corriger si elle survit au stub » ; elle y a survécu cinq chantiers.
Cinq textes, non trois : le surtitre, deux mentions secondaires, le libellé d'un droit refusé, et la
pastille « non ». Mesures refaites avant d'être crues — 2,11:1 confirmé, `content-neutral-base` à
**4,73:1**. **La pastille fait exception** : son fond est un voile de 8 % (`#e5e5e6`), pas le fond de
page, où `-base` retombe à 4,02:1 ; retenu `content-neutral-dark`, **6,56:1**, symétrique du 6,87:1
de la pastille « oui ». Deux des cinq se lisent sous une responsable de domaine, les trois autres
sous un cookie de simple membre — relu ainsi, zéro `content-neutral-light` subsiste. Le cinquième,
le courriel, ne se rend nulle part : la fixture n'en porte aucun (T1.5).

**Correctif 4 — les petites recopies, et les avertissements.** La table `nature → couleur` de T5.5
est **co-localisée** : `status-dot.tsx` exporte `BAND_FILL` en `fill-*` à côté de son `DOT` en
`bg-*`. Deux littéraux subsistent — Tailwind ne voit que les classes écrites en toutes lettres —,
mais ils sont voisins, et une couleur ne peut plus bouger d'un côté seul sans que ça se voie.
`groupByIndicator` quitte `indicators.tsx` pour `lib/queries/indicators.ts`, où `curvesOf` le
consomme et **inverse une copie** au lieu de refiltrer la liste entière par indicateur.
`/produits/nouveau` passe par `listProductFormOptions`, refermant la dette de T4bis.1. Et
`eslint.config.mjs` reconnaît le souligné comme intentionnel : les quatre avertissements de
`useActionState` disparaissent — un avertissement permanent est un avertissement neuf qu'on ne verra
pas.

**La règle eslint s'est payée dans la minute.** Elle a débusqué un import mort — `ProjectStatusNature`
dans `timeline.tsx`, devenu inutile avec `BAND_FILL` — que `tsc` laissait passer, `noUnusedLocals`
étant désactivé. C'est le premier avertissement neuf qu'un journal saturé aurait masqué.

**Le regroupement a reçu ses tests, contre le plan.** Le plan annonçait de mettre `groupByIndicator`
en défaut ; il n'avait **aucun test** — il vivait dans un composant, où `vitest` ne va pas. Quatre
tests écrits : l'accumulation, la conservation de l'ordre, la table vide, et l'identité distincte des
séries — ce dernier justifiant la copie qu'inverse `curvesOf`. Deux mises en défaut jouées :
l'accumulation écrasée, puis l'ordre inversé ; deux tests tombent à chaque fois, exactement ceux qui
portent la règle. **568 tests verts sur 17 fichiers**, contre 564 avant.

**Ce que le ticket laisse derrière lui.** La règle du correctif 1 n'est couverte par **aucun test** :
elle vit dans `app/`, que `vitest` ne couvre pas, et seule la discipline de re-soumission l'éprouve —
la dette de banc d'essai pour les actions serveur, inscrite en T4bis.3, n'est ni élargie ni refermée.
Les sondes du ticket — deux produits, deux accompagnements, cinq lignes écrites par le harnais — sont
**archivées, jamais supprimées** : le typage de `unlink` refuse une table qui porte `archived_at`,
et c'est la règle 4 tenue par le compilateur.

---

### T5bis.1 — le schéma : compétences, niveaux, profil — 17/08/2026

**Ce que le ticket livre.** Trois tables et deux colonnes, rien de visible — le rôle qu'avait T1.2
pour C1. `skills` et `skill_levels` sont deux référentiels du domaine ; `person_skills` est la
liaison qui dit qui porte quoi, et à quel niveau. Sur `persons`, `bio` et `availability`, cette
dernière tenue par un `CHECK` neuf. L'amorçage pose les onze compétences, les quatre niveaux, sept
présentations, sept disponibilités et **vingt-six** compétences portées.

**La propriété qui décide de tout le chantier tient à une colonne absente.** `person_skills` ne
porte pas d'`archived_at`, et ce n'est pas une économie : c'est ce qui la range dans `LinkTable`
(`lib/db/scoped.ts`) et rend `unlink` disponible **à la compilation**, quand `archive` y devient une
erreur de typage. T5bis.6 écrira « Retirer » et non « Archiver » parce que le compilateur ne lui
laissera pas le choix. La mise en défaut l'a prouvée dans le bon sens : ajouter `archived_at` à la
table fait refuser par `tsc` les **trois** appels à `scope.unlink(personSkills, …)`, dont celui du
bloc de garde-fous de typage.

**Deux écarts à la fiche, tous deux tranchés avant écriture.** Le premier est arithmétique : la
fiche annonce `drizzle/0003_*.sql`, mais la North Star a consommé ce numéro hors ticket le matin
même ; la migration est `0004_lethal_millenium_guard.sql`. Le second porte sur la **mise en
défaut** : la fiche demande de « retirer `domainRef()` de `person_skills` », geste qui ne compile
pas — sans `domainId`, la table cesse d'être une `ScopedTable` et le fichier entier casse. La
variante retenue retire le `.references()` de `skillId`, ce qui prive `parentChecksOf` de la clé et
isole exactement le mécanisme testé.

**Le point de vigilance annoncé au plan ne s'est pas réalisé.** L'ajout d'un `CHECK` sur une table
**existante** était un chemin que le dépôt n'avait jamais emprunté — drizzle-kit ne l'avait émis
qu'à l'intérieur d'un `CREATE TABLE`. Il est bien généré, en dernière instruction du fichier :
`ALTER TABLE "persons" ADD CONSTRAINT "persons_availability_requires_center" CHECK (…)`. Aucune
ligne n'a été écrite à la main dans un fichier généré.

**Une fixture construite, et qui ne doit pas être « nettoyée ».** Trois propriétés de la répartition
des compétences sont des instruments de vérification pour les tickets suivants, pas des choix
esthétiques. Inès Kaddour n'a que **deux** compétences : c'est elle qui éprouvera l'absence de radar
en T5bis.5, où trois axes sont le minimum d'un polygone. Léa Fontaine porte **User Research et
Accessibilité**, quand Sofia et Awa n'ont que la première et Inès et Yanis que la seconde : sans ce
jeu, le critère conjonctif de T5bis.3 se lirait sur un résultat vide, qui ne prouve rien. Et les
**trois** valeurs de disponibilité sont représentées, sans quoi la pastille de T5bis.2 n'aurait que
deux de ses trois couleurs à montrer et à mesurer.

**Vérification — deux disciplines sur quatre sont sans objet, et il fallait le dire.** Le ticket ne
rend aucun écran : le critère ne se lit pas dans le HTML servi mais dans le SQL généré, lu avant
d'être appliqué, et dans la sortie des commandes. Aucun couple de couleurs neuf, donc aucun
contraste à mesurer. Aucune action serveur, donc aucun point d'entrée à éprouver. Les affirmer
vertes aurait été plus grave que de les déclarer sans objet.

Ce qui restait a été éprouvé. `db:generate` puis `db:migrate` sur la base de développement **et sur
la branche de test** — sans cette seconde application, les cas neufs échouent. `db:seed` joué deux
fois : la première crée 11 compétences, 4 niveaux et 26 liaisons et **met à jour** les sept
personnes du centre (les deux colonnes neuves), la seconde affiche « Rien à faire : le domaine était
déjà à jour », décomptes identiques avant et après — 11 / 4 / 26. `npm test` : 639 cas verts,
`tsc --noEmit` propre, `lint` sans erreur (deux avertissements hérités, hors périmètre).

**Trois mises en défaut, chacune isolant un mécanisme.** Retirer le `.references()` de
`person_skills.skillId` fait tomber « une compétence d'un autre domaine est refusée », **et ce cas
seul** — 1 échec sur 29. `ALTER TABLE persons DROP CONSTRAINT persons_availability_requires_center`
sur la seule branche de test fait tomber « un intervenant côté entité ne porte pas de
disponibilité », **et ce cas seul** ; la contrainte a été remise et la suite est revenue à 29 verts.
Ajouter `archived_at` à `person_skills` fait refuser `unlink` par `tsc`.

**Ce que la mise en défaut a changé au code.** Les trois clés étrangères de `person_skills` étaient
d'abord vérifiées dans **un seul** cas de test à trois assertions. Neutraliser l'une d'elles faisait
alors tomber le même test que neutraliser les deux autres : la mise en défaut ne désignait plus
rien. Le cas a été scindé en trois avant d'être cru. **Un test qui ne distingue pas ce qu'il prouve
n'est pas un test, c'est une case cochée.**

**Sondes.** Deux fichiers temporaires — un décompte par `scope.count()` et une bascule du `CHECK`
sur la branche de test — écrits dans `scripts/`, joués, puis **supprimés** avant le commit.

---

### T5bis.3 — les filtres de la liste Équipe — 18/08/2026

**Ce que le ticket livre.** Cinq clés dans l'URL, un `form method="get"`, pas une ligne de
JavaScript : `q` (le nom), `metier`, `competence` (répétable et **conjonctif**), `niveau` (« au
moins ce niveau ») et `dispo`. `listTeam` reçoit un second paramètre ; `listTeamFilterOptions` naît
à côté d'elle et dit ce que la barre propose au choix. La liste elle-même n'a pas changé d'une
ligne.

**Le cœur du ticket est un `exists` par compétence cochée.** C'est la seule forme qui dise « l'une
**et** l'autre » sans `group by` ni `having count(*)` — donc sans le décompte que le garde-fou 2
interdit. Une jointure doublerait les lignes ; un `or` répondrait à la question inverse. Le seuil de
niveau s'y glisse comme une condition de plus, ce qui lui donne gratuitement sa double sémantique :
posé avec des compétences il les qualifie, posé seul il vaut « porte au moins une compétence à ce
rang ». La fixture de T5bis.1 avait été semée pour ce cas précis, et elle a tenu : **Léa Fontaine
est la seule à porter User Research et Accessibilité**, quand trois personnes portent l'une et trois
autres l'autre — 3 ∩ 3 = 1, lu dans le HTML servi.

**Ce que la seconde lecture ne fait pas.** Elle remonte **toutes** les compétences des personnes
retenues, jamais les seules qui ont filtré. Une ligne affiche un profil, pas une correspondance :
marquer les compétences cochées serait le surlignage du plus qualifié que la fiche interdit, et
c'est le genre d'aide qu'on ajoute sans y penser. Un test le tient — quatre compétences affichées
sous un filtre qui n'en nomme qu'une.

**Les options ne proposent pas de chemin vers le vide, sauf l'échelle, et c'est raisonné.** Métier
et compétence ne remontent que ce qu'une personne vivante porte, la règle de
`listProjectFilterOptions`. L'échelle est proposée entière parce que « au moins ce niveau » est un
**seuil** et non une valeur : un échelon que personne n'occupe exactement reste un seuil qui a du
sens. La requête d'options de compétence joint `skill_levels` **sans le lire**, pour la seule raison
qu'une liaison que la liste n'honore pas — son niveau venant d'un autre domaine — ne doit pas faire
paraître sa compétence dans les cases à cocher.

**Vérification — trois disciplines sur quatre ont un objet, la quatrième se mesure quand même.** Le
critère se lit dans le HTML servi : la conjonction et son sur-ensemble strict, le seuil appliqué aux
compétences cochées puis posé seul, le cumul des cinq clés, l'échappement de `%` qui ne ramène
personne, les `checked` et les `selected` qui redisent l'état de l'URL, les deux états vides et leur
sortie. Une compétence d'un **autre domaine** — un second domaine créé en base pour l'occasion — ne
filtre rien, ne fuit pas son libellé, et **ne relâche pas** le filtre légitime avec lequel elle est
cumulée. Un paramètre qui n'est pas un UUID rend un 200 et un écran, jamais un 500. Le contraste n'a
introduit aucun couple neuf par la position, et les trois de la barre ont été remesurés — 7,72:1,
16,98:1, et le filet de contrôle à 3,88:1 / 3,69:1 selon le voisin. **Le droit s'éprouve par
l'action, et ici l'action n'existe pas** : le HTML servi porte un `<form>` en `method="get"`, zéro
champ `$ACTION_…` et zéro `"use server"` dans le périmètre — l'absence de point d'entrée en écriture
est un constat, pas un sous-entendu.

**Onze mises en défaut, onze comptes exacts.** Un pilote a joué chaque neutralisation puis relevé
les tests tombés : `or` à la place des `exists` conjoints en fait tomber **un**, celui de la
conjonction ; le retrait du `gte` en fait tomber **deux**, ceux qui isolent le seuil ; et chacun des
neuf `filter()` fait tomber **son** cas d'étanchéité, jamais celui d'un autre.

**Ce que la mise en défaut a changé au code — ou plutôt aux lignes forgées.** Huit `filter()` neufs
sont entrés dans le module, et les quatre lignes forgées de T5bis.2 n'en couvraient que la moitié :
retirer `filter(persons)` de l'une ou l'autre requête d'options ne faisait tomber **aucun** test.
Deux forgeages ont été ajoutés, chacun ne franchissant la frontière que sur **une** colonne — une
liaison de `a` en tout point sauf la personne, et une personne de `b` portant un métier de `a` que
personne d'autre ne porte. **Un filtre de domaine qu'aucune ligne forgée ne vise n'est pas éprouvé**
— il est seulement écrit.

**Écarts.** Trois fichiers hors périmètre, tous arbitrés avant écriture : `formatPersons` dans
`lib/format.ts` (la ligne de synthèse), l'`export` d'`AVAILABILITY_LABEL` dans
`availability-dot.tsx` (le `select` de disponibilité dit les mêmes trois mots que la pastille), et
la clé `q` retenue contre la convention française des quatre autres — la fiche l'écrit deux fois.
`likePattern` est en revanche **recopié** dans `team.ts` plutôt qu'importé de `projects.ts` : lui
choisir un module neutre appartient à TD.

**Sondes.** Un second domaine et une compétence créés en base de développement pour éprouver le cas
« d'un autre domaine », puis **supprimés** — une fixture locale n'est pas de la donnée métier. Son
nom commençait par `Zzz` délibérément : `resolveDomainId` rend le premier domaine actif **par nom**,
et un nom en tête aurait fait basculer tout l'écran sur la sonde. Le script de mesure et le pilote
de mise en défaut ont été retirés avant le commit.

---

### T5bis.4 — la fiche d'une personne, en panneau — 19/08/2026

**Ce que le ticket livre.** `/equipe` devient la **troisième page hôte** de panneaux : son contenu
s'enveloppe dans `<DrawerHost>`, `app/(app)/equipe/drawers.tsx` porte `loadTeamDrawer`, et
`lib/drawers/team.tsx` résout la seule demande de la page, `{ kind: "personDetail", id }`. La ligne
entière de la liste devient un `DrawerLink`. `findPersonDetail` rend, en trois lectures fixes,
l'identité et le profil, les compétences par rang décroissant puis libellé, et les accompagnements
du plus récent au plus ancien. Il n'y a **aucune route `/equipe/[id]`** : D29 tient.

**Le code était écrit, la vérification ne l'était pas.** Les neuf fichiers existaient au début de la
session, sans qu'aucune des quatre disciplines ait été jouée. C'est ce que cette session a fait, et
c'est tout ce qu'elle a fait — hors quatre corrections de forme.

**Une divergence assumée avec `listProjects`.** Un accompagnement porté par un **produit archivé**
reste dans la fiche, là où la liste transverse l'écarte. Les deux répondent à deux questions : « où
en sont nos accompagnements » écarte ce qui est rangé ; « qu'a fait cette personne » ne peut pas
effacer ce qu'elle a mené. C'est l'esprit de l'arbitrage (e), et un test le nomme.

**La seule chose que cette page hôte fait autrement, c'est l'adresse de repli.** Les deux premières
ferment sur leur URL nue, qui n'efface rien ; ici elle effacerait la recherche que le panneau vient
de servir. `teamHref` reconduit donc les cinq filtres dans `closeHref` comme dans chaque lien de
ligne — **à partir des valeurs déjà confrontées au domaine**, jamais des paramètres reçus.

**Vérification.** *Par l'adresse :* `/equipe?personne=<uuid>` porte le panneau dans le HTML servi —
un `role="dialog"`, un `aria-labelledby="panneau-personne-titre"`, la page derrière en `inert`, et
les deux sorties en `<a href>` vers l'adresse filtrée. Un UUID inconnu, une valeur non-UUID, une
valeur vide, une chaîne d'injection, une personne archivée et une personne d'un autre domaine
rendent chacun **200 sans panneau** — jamais un 500, `isUuid` tranchant avant la base. *Par
l'action :* `loadTeamDrawer` est un point d'entrée HTTP à part entière, frappé sous l'identité d'un
simple membre après une **étape témoin** qui rend 7 756 octets ; **onze charges forgées rendent 70
octets**, corps `1:null` — dont quatre `kind` d'autres pages, `personaDetail` compris. *Mise en
défaut :* **treize neutralisations, treize fois le compte exact**, chacune ne faisant tomber que les
tests qu'elle vise. *Contraste :* les trois couples de texte du panneau mesurés à 8,12:1, 4,98:1 et
17,87:1 ; le filet des cartes à 1,24:1, qui est la dette de design system récrite dans `ETAT.md`.

**Ce qui n'a pas pu être fait.** Le chemin du **clic** n'a pas été parcouru : aucun navigateur
pilotable dans la session. Le point est ouvert dans `ETAT.md`, borné par le fait que les cinq
propriétés en attente appartiennent à `DrawerHost`, éprouvé par TD.2 et inchangé depuis.

**Sondes.** Un second domaine, une personne étrangère et l'archivage temporaire de Yanis Bertin,
pour éprouver les deux refus qui n'avaient aucune matière en base. Yanis est rétabli et la liste a
retrouvé ses neuf lignes ; la personne-sonde est archivée et les deux domaines-sonde **suspendus et
archivés**, leur suppression ayant été refusée par le bac à sable. Ils sont inertes — un domaine
suspendu n'est jamais rendu par `resolveDomainId` —, et leur nom vient après « Groupe Meridian »
dans l'alphabet, délibérément.

---

### TD.5 — le garde-fou de la règle 2 sur les espacements — 19/08/2026

**Pourquoi ce ticket, et ce qu'il ferme.** Troisième des quatre tickets tirés de l'audit du
18/08/2026, et le seul dont le critère n'est pas un diff HTML vide. La règle 2 est **structurelle**
pour les couleurs, les tailles, les graisses, les interlignes et les rayons — `globals.css` efface les
namespaces Tailwind, `bg-blue-500` ne compile pas — mais `--spacing: var(--number-4)` est un **pas**,
pas une échelle : Tailwind en dérive n'importe quel multiplicateur. C'était le seul trou du
dispositif, et il est refermé par une règle plutôt que par un nettoyage.

**L'inventaire remesuré, et l'écart avec la fiche.** La fiche annonce « une soixantaine de valeurs
hors échelle » ; le compte exact est **39 occurrences fautives dans 12 fichiers**, les 42 autres
classes fractionnaires (`0.5` et `1.5`) retombant exactement sur `--number-2` et `--number-6`. La
fiche comptait les deux ensembles. `indicators.tsx` en avait par ailleurs gagné **six depuis
l'audit** — `h-4.5`, `h-42.5`, `mt-8.5`, `mb-6.5`, `h-0.75`, `gap-2.25` —, ce qui est la
démonstration du ticket : une dette de présentation non surveillée croît entre l'audit et sa
correction. `lib/**` était propre.

**Trois arbitrages rendus avant écriture.**

1. **Aucune exception pour le bloc « Vision produit »**, dont le journal du 18/08 défendait le rythme
   16/30-26/14/34-16 comme conforme parce qu'obtenu « en multiples du pas de 4 pixels ». Un multiple
   **fractionnaire** du pas n'est pas une valeur de l'échelle : le §4 ne nomme ni 30, ni 26, ni 34. Le
   bloc passe à 16/28-24/12/32-16.
2. **Les deux gabarits de grille restent hors règle** — `minmax(300px,1fr)` et `grid-cols-[20rem_1fr]`
   sont des points d'arrêt de mise en page, arbitrage du journal de T1.6 que la fiche reprend déjà
   pour `flex-[1.4]`. Écrit dans la **portée du motif**, pas dans un `ignores`.
3. **Une troisième clause de plus que la fiche**, sur les épaisseurs de bordure brutes : sans elle,
   `border-l-3` serait corrigé une fois et libre de rediverger — ce qu'`ACTION_LINK` a fait six jours
   après TD.1.

Et une convention d'arrondi, unique et rapportable : **au plus proche, à égalité vers le bas.** Seuls
9 px (→ 8) et 11 px (→ 12) ne sont pas des égalités.

**Ce que le ticket livre.** `spacingScaleLock` dans `eslint.config.mjs`, sur le patron de
`dbClientLock` — un objet nommé, un commentaire qui dit la règle qu'il sert, un message qui renvoie à
`CLAUDE.md` —, en `no-restricted-syntax`, trois clauses × deux sélecteurs. Puis **39 arrondis dans 12
fichiers** et `border-l-3` → `border-l-[length:var(--border-width-2)]`, à rendu strictement identique
(`--border-width-2` vaut 3px). Le commentaire d'`indicators.tsx:799` suit sa valeur : « 170 px de
haut » devient « 168 px ».

**La mise en défaut, et ce qu'elle a appris.** L'instrument n'est pas un témoin mais **l'inventaire**,
établi au `grep` avant que la règle n'existe : elle devait tomber sur ces 12 fichiers et sur eux
seuls. Elle l'a fait — **36 erreurs pour 40 occurrences**, et l'écart de quatre est une propriété
d'ESLint, qui signale un **nœud** et non une occurrence ; quatre `className` portaient deux classes
fautives. Les trois témoins classiques ont suivi : `gap-2.5` dans un fichier propre (37, sur lui
seul, retiré → 36), `w-[300px]` pour la clause 2 qui n'a aucun appelant au dépôt, `border-2` en
littéral pour la clause 3 dont le seul appelant réel vit dans un gabarit de chaîne — les deux
sélecteurs sont donc éprouvés chacun par un cas réel. Six témoins négatifs, tous posés dans un
`className` réel, n'ont rien déclenché.

**Vérification — 28 adresses, 367 paires de lignes, zéro inexpliquée.** Harnais de TD.3 et TD.4
repris : DOM seul, tout `<script>` neutralisé, **déterminisme prouvé sur deux captures successives
avant la mesure et deux après**, base immobile (aucune écriture, aucune sonde). Le diff n'est pas
vide et ne devait pas l'être : **408 rendus modifiés**, dont 152 `gap-2.5`, 27 `size-2.5` et 24
`border-l-3`. Chaque ligne « avant » redonne **exactement** la ligne « après » quand on lui applique
les 23 substitutions annoncées — vérifié mécaniquement, pas à l'œil. Aucun réordonnancement de
classe, aucun changement de structure. `/dev/session` ne bouge pas d'un caractère, seule des 28 : elle
vit hors du groupe `(app)`, donc sans barre latérale.

**Deux branches ont changé sans que leur rendu soit vu**, et c'est dit plutôt que supposé : les deux
`px-2.5` de la fenêtre libre au mois (`SHOW_MONTH_RANGE = false`) et la pastille de jalon
(`h-2.5 w-2.5`), qu'aucun produit de la fixture n'atteint.

`npm run lint` à **zéro erreur et zéro avertissement**, `npx tsc --noEmit` propre, **773 tests sur 23
fichiers verts sans qu'un fichier de test soit touché**. 13 fichiers modifiés, aucun fichier neuf.

---

### TD.4 — l'état vide dans un bloc, et le bandeau d'archivage — 19/08/2026

**Pourquoi ce ticket maintenant, et l'ordre enfreint.** La fiche prescrit TD.5 avant TD.4, pour que
le garde-fou des espacements précède l'élargissement de la surface. TD.4 a été pris en premier sur
demande. Conséquence unique et bornée, tenue : **aucune marge hors échelle n'a été créée**, les trois
qui existaient (`mt-3.5`, `mt-4`, `mt-2`) sont passées telles quelles au point d'appel, et TD.5 les
arrondira là où elles étaient déjà.

**Trois arbitrages tranchés avant écriture, comme la fiche l'exigeait.** (1) La note de
`SectionHeader` **se rend** — la page projet gagne une ligne, et l'unique avertissement permanent du
dépôt disparaît. (2) `components/team/` **entre au périmètre** : trois copies neuves y avaient été
écrites par T5bis.3 et T5bis.4 le jour même, exactement comme `equipe/page.tsx` en TD.3, et le motif
n'est pas esthétique — `socleLock` s'applique hors de `components/ui/**`, et les y laisser ferait
échouer TD.6, dont le critère est de finir à zéro. (3) `BlockNote` a **une taille unique**.

**Le tableau (a) de la fiche était faux sur cinq de ses quinze lignes, et c'est le résultat le plus
transportable du ticket.** L'audit avait groupé par **chaîne CSS**, pas par **intention** :
`projects/roadmap.tsx:410/568/576/598` sont le résultat, l'objectif, les participants et le motif
d'annulation d'une carte — des lignes **présentes quand la donnée existe**, l'exact inverse d'une
absence ; `products/roadmap.tsx:573` est l'avis « 1 accompagnement est masqué hors de cette période »,
lu tel quel dans le HTML servi. Les convertir aurait fait passer cinq lignes de métadonnées pour des
états vides et changé leur rendu sans raison. *Une factorisation se décide sur ce que le code veut
dire, jamais sur ce qu'il porte comme classes — et un audit qui `grep` ne sait pas faire la
différence.*

**Trois sites que le même `grep` avait manqués, pour la raison symétrique.** `indicators.tsx:444`,
`products/roadmap.tsx:390` et `:566` sont de vraies absences que leur préfixe de classe
(`mt-3.5`, une marge, un `border-t`) soustrayait à la recherche exacte. Les deux derniers sont dans
un fichier que le ticket déclarait hors périmètre — ils y sont entrés parce que leur conversion est
**à diff nul** et que les laisser aurait rendu TD.6 impossible à finir à zéro. Écart au plan, assumé
et rapporté. Bilan réel : **16 points d'appel dans 9 fichiers**, contre les 15 annoncés dont 5 faux
positifs.

**Le jeton s'est choisi à la mesure, et la mesure était déjà écrite dans le dépôt.**
`content-neutral-base` et `content-neutral-dark` passent tous deux sur les deux tonalités où ce
paragraphe se rend — 4,79:1 et 7,82:1 sur `surface-primary-lightest`, 4,98:1 et 8,12:1 sur
`surface-neutral-pale`. Le départage est le critère de la fiche, « celui qui passe **partout** » :
`-base` tombe à **3,75:1** sur `surface-primary-lighter`, `-dark` tient à 6,11:1. Le calcul reproduit
au centième les chiffres que `block.tsx` cite depuis le 17/08, ce qui valait contrôle de
l'instrument — et `products/roadmap.tsx:390` portait déjà, en commentaire, **le même raisonnement et
les mêmes trois ratios**. La décision avait donc déjà été prise une fois, dans un fichier, par
quelqu'un qui ne pouvait pas l'imposer aux autres. C'est très exactement ce qu'un socle sert à faire.

**Une décision de composant, contraire à celle de TD.3 et pour la même raison.** `className` se
compose en **préfixe** dans `BlockNote`, là où `Button` le compose en suffixe. TD.3 avait lu ses neuf
points d'appel et vu `className` écrit en dernier ; TD.4 a lu les siens et vu la marge écrite en
**tête**. Même méthode, données opposées, conclusion opposée — et le gain se mesure : les trois points
d'appel qui portent une marge, plus le `border-t` de `roadmap.tsx:566`, rendent un attribut `class`
**identique au caractère près**. Un suffixe les aurait tous réordonnés pour rien.

**Vérification — 25 adresses, instrument reconstruit, mis en défaut, et remis.** Le harnais de TD.3
a été refait : capture des 25 adresses avec tout `<script>` neutralisé, déterminisme prouvé sur deux
captures successives **avant** toute mesure, puis avant/après à base immobile — aucune écriture,
aucune sonde, les fixtures de TD.1 ont suffi. **Le témoin :** une classe `TEMOIN-TD4` posée dans
`BLOCK_NOTE` a bougé **exactement les 14 adresses** qui portent un `BlockNote`, **zéro ligne sans le
témoin**, et les 11 autres n'ont pas bougé ; retiré, retour **exact** à l'état mesuré.

**Les écarts, tous annoncés avant d'être vus, et le compte tombe juste.** 45 lignes ajoutées, 39
retirées : **34 rendus** passent de `-base` à `-dark`, **5 rendus** du `text-md` au `text-sm`
(`indicators.tsx:378`), et **6 rendus** gagnent la note « Le récit de l'accompagnement, au mois. ».
Aucune ligne inexpliquée, aucun réordonnancement de classe, aucun changement de structure. **Le
bandeau d'archivage donne un diff strictement vide** sur les trois pages archivées, comme la fiche
l'annonçait.

**Cinq branches n'ont pas pu être lues, et c'est dit plutôt que supposé.** Le relevé absent d'une
North Star, sa cible absente, la carte d'indicateur sans relevé, le panneau de relevés vide et la
personne sans équipe n'existent dans aucune donnée du domaine — les deux indicateurs vivants portent
relevés et cible, le seul sans relevé est archivé. Leur code a changé comme celui des autres ; leur
rendu n'a pas été vu. Le point est ouvert dans `ETAT.md` comme un trou de jeu d'essai, pas comme une
dette de code.

**`npm run lint` finit à zéro pour la première fois du projet** — c'est le ticket qui a retiré
l'unique avertissement permanent du dépôt, et TD.6 (c) n'attend plus rien. `npx tsc --noEmit` propre,
**773 tests sur 23 fichiers verts sans qu'un fichier de test soit touché**.

---

### TD.3 — le bouton et le lien d'action — 19/08/2026

**Pourquoi ce ticket, et pourquoi maintenant.** Premier des quatre tickets tirés de l'audit de la
couche de présentation du 18/08/2026. Il vient en tête parce qu'il **crée les logements** que
`socleLock` gardera en TD.6 : on ne garde pas une signature qui n'a pas de remplaçant à offrir. Sa
dette est celle que l'audit a chiffrée — `docs/design/design-system.md` §10 nomme une quarantaine de
composants, `components/ui/` en portait dix-sept, et **pas de bouton**.

**Le périmètre a changé avant d'écrire, et c'est un arbitrage.** La fiche annonce 11 / 4 / 9 copies,
soit 24 ; le dépôt en portait **27**. Les trois de plus sont dans `app/(app)/equipe/page.tsx`, écrites
par T5bis.2 et T5bis.3 **le jour même de l'audit**, et le fichier ne figurait pas au périmètre — alors
qu'il est l'un des six écrans sur lesquels la fiche mesure le diff. Décision humaine prise avant
écriture : **le fichier entre**. Le motif n'est pas l'esthétique, c'est TD.6 — `socleLock` s'applique
hors de `components/ui/**`, et trois copies laissées là feraient échouer `npm run lint` au ticket
suivant, sur un ticket dont le critère est justement de finir à zéro. La règle 3 est enfreinte d'un
fichier, sciemment.

**Ce que le ticket livre.** `components/ui/button.tsx` porte les deux niveaux que la doctrine du
18/08 a nommés : `Button` pour les **neuf** `<button>`, `BUTTON_PRIMARY` et `BUTTON_SECONDARY` pour
les **huit** points d'appel qui n'en sont pas — trois `<Link>` primaires, deux `<Link>` et deux
`<DrawerLink>` secondaires, et le skip-link. `ACTION_LINK_SM` rejoint `ACTION_LINK` dans
`action-link.ts`, à onze appels. `readings-panel.tsx` cesse de redéfinir `ACTION_LINK` et importe
celui du socle. Bilan : **15 fichiers modifiés, 1 fichier neuf**, et plus **aucune** occurrence des
trois chaînes hors du socle — vérifié par `grep`.

**Trois décisions de composant, chacune imposée par une mesure et non par un goût.**

- **`disabled:opacity-60` reste au point d'appel**, hors de la variante. Quatre des neuf boutons le
  portent, cinq non : dans la variante, il serait apparu sur douze rendus.
- **Le ternaire plutôt que `${className ?? ""}`**, la forme dont TD.1 avait mesuré le coût — dix-huit
  espaces finaux dans un attribut `class` servi.
- **`{...props}` précède `className`**, et l'ordre n'est pas indifférent : React rend les attributs
  dans l'ordre des props, les neuf points d'appel portaient tous `className` en dernier, et l'inverser
  aurait remonté `class` devant `type`. Lu dans le HTML servi — `<button type="submit" class="…">` —,
  pas supposé.

**L'instrument a dû être construit avant d'être employé, et c'est la leçon transportable.** La
première mesure a montré la même adresse rendant **94 604 puis 94 713 octets à code inchangé**. La
cause n'est pas la base : c'est la **charge RSC embarquée dans le HTML**, dont les identifiants de
rangée (`ec:I[…]`, `f5:I[…]`) et le nonce `self.__next_r` changent à chaque requête en développement.
Une comparaison brute mesure ce bruit, pas le code. Le DOM seul — tout `<script>` remplacé par un
jeton — est **déterministe, vérifié sur deux captures successives identiques au caractère près**.
C'est sur lui que le critère se lit. *Sans cette étape, un diff de plusieurs centaines de lignes
aurait masqué les deux vrais écarts, ou pire, les aurait fait passer pour du bruit.*

**Et l'instrument s'est mis en défaut avant d'être cru.** Un `rounded-xl` témoin posé dans la
variante primaire a fait bouger **les vingt captures alors mesurées** — aucune ne pouvait rester
muette, chaque écran portant au moins le skip-link. Témoin retiré, retour exact à l'état attendu.

**Vérification — vingt-trois adresses, vingt-et-une strictement identiques.** Les six écrans de la
fiche, les deux `nouveau`, les deux `modifier`, `/dev/session`, deux états vides filtrés, l'état vide
de `/equipe`, quatre corps de panneaux atteints par leur **URL d'ouverture** — qui reste une adresse
valide depuis TD.2 —, et **deux fiches archivées**, seul endroit où les deux boutons « Rétablir » se
rendent. Ces deux dernières et l'état vide filtré de `/produits` ont été mesurées par `git stash`,
la base immobile entre les deux temps. `npx tsc --noEmit` propre, `npm run lint` à son unique
avertissement d'avant, **773 tests sur 23 fichiers verts sans qu'un fichier de test soit touché**.

**Les deux écarts, tous deux annoncés avant d'être vus.**

- `app/dev/session/page.tsx:112` portait une copie **dérivée** — `rounded-sm` et
  `text-surface-neutral-lightest`. Elle rentre dans le rang. **Contraste mesuré des deux couples**,
  et non repris de mémoire : `#f7f7f8` sur `#24226a` donnait **12,97:1**, `#fdfdfd` sur `#24226a`
  donne **13,65:1**. Les deux passent ; la correction améliore.
- `components/products/readings-panel.tsx` perd `underline-offset-2` sur **cinq** éléments — trois
  gestes, dont deux répétés par relevé. C'est ce que la fiche appelait « une divergence se referme au
  passage » sans la ranger dans ses écarts : il y en avait **deux**, pas un.

**Aucune sonde, aucune écriture en base.** Les deux fiches archivées nécessaires à la mesure
existaient déjà — ce sont les sondes de TD.1 et de tickets antérieurs, archivées et jamais
supprimées. La règle 4 a rendu ce ticket gratuit en données.

---


### TD.6 — le garde-fou du socle — 19/08/2026

**Pourquoi ce ticket, et pourquoi en dernier.** Dernier des quatre tickets tirés de l'audit de la
couche de présentation. Il est le seul qui **ne retire rien** : TD.3, TD.4 et TD.5 ont refermé
quarante-trois copies, celui-ci empêche la quarante-quatrième. Sans lui, les trois précédents sont un
nettoyage, et la démonstration du contraire est faite dans ce dépôt — `ACTION_LINK`, extrait en TD.1
« un seul exemplaire, après quatre », a redivergé six jours plus tard dans un fichier qui importait
déjà `components/ui/`. Il vient en dernier par nécessité : il garde des signatures que TD.3 et TD.4
créent, et son point (c) dépendait de l'arbitrage de TD.4 sur la prop `note`.

**Le piège que la fiche ne voyait pas, et qui aurait annulé TD.5 en silence.** Le format plat
d'ESLint **écrase** la valeur d'une règle, il ne la fusionne pas. `spacingScaleLock` posait
`no-restricted-syntax` sur `**/*.tsx` ; un `socleLock` posant la même règle sur le même ensemble
aurait **désactivé les trois clauses de TD.5 partout hors de `components/ui/`**, sans qu'aucun
message ne le dise — une règle écrite la veille, perdue le lendemain, et perdue précisément là où
elle sert. La parade tient en trois gestes dans le fichier : les clauses de TD.5 sortent dans un
`SPACING_CLAUSES` nommé ; `socleLock` porte `["error", ...SPACING_CLAUSES, ...SOCLE_CLAUSES]` ;
`spacingScaleLock` se restreint à `components/ui/**/*.tsx`, le seul ensemble que `socleLock` ignore.
`spacingRule` devient `classNameRule`, les deux blocs s'en servant désormais. **La non-régression se
mesure** (voir plus bas) : c'est la seule manière de savoir qu'on n'a pas laissé le trou.

**Deux arbitrages rendus avant écriture.**

- **Le périmètre s'ouvre à `app/(app)/projets/page.tsx`**, comme celui de TD.3 s'était ouvert à
  `equipe/page.tsx`, et pour la même raison exactement. Ses lignes 305 et 381 portaient des copies à
  la main de `CONTROL_TEXT` et de `CONTROL` — la recherche et les listes déroulantes du bandeau de
  filtres —, que TD.1 n'avait pas ouvertes parce qu'elles n'étaient pas à son périmètre. Laissées là,
  `socleLock` les faisait tomber et `npm run lint` ne finissait pas à zéro. Le contrôle de saisie
  était la signature la plus recopiée du dépôt (huit copies en TD.1) : la laisser sans garde-fou pour
  préserver un périmètre aurait vidé le ticket de son objet.
- **La signature de `BlockNote` porte sur les variantes retirées, pas sur celle qui reste.**
  `text-sm leading-175 text-content-neutral-dark` est porté légitimement par **quatre** paragraphes
  qui disent l'inverse d'une absence — une bio, un résumé de persona, la note de vision, l'écart
  chiffré —, dont un (`person-card.tsx:39`) voisin immédiat d'un vrai `<BlockNote>` dans le même
  ternaire. Un motif calqué sur elle aurait fait quatre faux positifs dans un ticket dont le critère
  est de finir à zéro. Le motif retenu porte sur les trois écritures que TD.4 a fait disparaître : il
  garde la **divergence**, qui est le défaut que l'audit a nommé, et non la duplication. La limite est
  réelle et se rapporte — une copie à l'identique de la chaîne retenue passe.

**Les six signatures, et leurs déclenchements mesurés hors `components/ui/`.**

| Signature | Motif | Au dépôt | Renvoie vers |
|---|---|---|---|
| bouton primaire | `bg-surface-primary-base.*px-4.*py-2` | 0 | `Button` / `BUTTON_PRIMARY` |
| bouton secondaire | `border-content-neutral-normal.*px-4.*py-2` | 0 | `BUTTON_SECONDARY` |
| lien-action `xs`/`sm` | `font-semibold.*text-content-primary-dark.*underline` | 0 | `ACTION_LINK` / `ACTION_LINK_SM` |
| contrôle de saisie | `rounded-lg\sborder.*bg-surface-neutral-pale.*px-3.*py-2` | **2** | `CONTROL` / `CONTROL_TEXT` |
| état vide dans un bloc | les 3 variantes retirées par TD.4 | 0 | `BlockNote` |
| bandeau d'archivage | `bg-surface-neutral-pale.*px-7.*py-4` | 0 | `ArchivedNotice` |

**Aucun motif ne porte d'espace littéral.** `\s` est employé partout : la grammaire d'esquery ne
garantit pas qu'un espace traverse l'analyse d'un sélecteur d'attribut, et les trois motifs de TD.5
n'en portaient aucun — la question n'avait donc jamais été posée. Elle l'est ici, où quatre motifs
sur six en auraient voulu un.

**La mise en défaut, dans les deux sens, signature par signature.** Neuf témoins positifs, neuf
témoins négatifs proches, dans deux fichiers jetables retirés après mesure. **Chaque témoin positif
fait tomber exactement une erreur, celle de sa signature ; chaque témoin négatif n'en fait tomber
aucune.** Les témoins négatifs ne sont pas inventés : ce sont des écritures **vivantes du dépôt** —
`text-content-primary-dark underline` sans `font-semibold` (`projets/page.tsx:199`),
`bg-surface-neutral-pale px-7 py-6` (`projets/[id]/page.tsx:246`), les quatre non-absences en
`-neutral-dark` et les cinq de roadmap en `text-xs -base`. Un témoin négatif que le dépôt ne porte
pas ne prouve rien sur le dépôt.

**Le leurre de fond a été rejoué.** La copie *dérivée* de `/dev/session` — `rounded-sm`,
`text-surface-neutral-lightest` — tombe sous le motif lâche, alors qu'une regex calquée sur la chaîne
exacte l'aurait manquée. C'est la mesure de la sonde du 18/08/2026, refaite sur la règle réelle :
**le motif porte sur ce qui fait la signature — le fond, le rythme —, jamais sur la chaîne entière.**

**La non-régression de TD.5, mesurée des deux côtés de la frontière.** Un `gap-2.5` témoin tombe
**hors** de `components/ui/` — preuve que `SPACING_CLAUSES` a bien été repris dans `socleLock` — et
tombe **dans** `components/ui/` — preuve que `spacingScaleLock` couvre encore le socle. Et un bouton
primaire écrit **dans** `components/ui/` ne tombe pas : le socle garde le droit de se définir
lui-même, faute de quoi la règle serait désactivée au premier usage.

**(b) `uiLayerSeal`.** Le greffon `@typescript-eslint` est enregistré globalement par
`eslint-config-next/typescript` — vérifié en énumérant le config plat avant d'écrire, plutôt qu'en
espérant. Aucune dépendance ajoutée. Éprouvé en quatre gestes : un import de valeur depuis
`@/lib/queries/projects` est refusé, le **même en `import type` est accepté**, un composant métier est
refusé, une action serveur est refusée.

**(c) `--max-warnings=0`.** Mesuré avant d'écrire : 123 fichiers lintés, 0 erreur, **0
avertissement**. L'unique avertissement permanent du dépôt était la prop `note` morte de
`section.tsx`, que TD.4 a refermée en la rendant. Le point dépendait de lui ; il ne dépendait plus de
rien.

**Les deux écarts de rendu, annoncés d'avance et lus dans le HTML servi.** Sur `/projets`, et nulle
part ailleurs. Les 124 attributs `class` de l'écran sont comparés un à un : **six lignes changent,
trois attributs, et le DOM hors `class` est identique au caractère près.**

- La recherche passe à `` `${CONTROL_TEXT} ${borderOf(undefined)}` `` : **mêmes neuf classes, ordre
  différent** — `border-content-neutral-normal` passe en fin de chaîne. Rendu inchangé, largeur et
  couleur de bordure étant deux propriétés distinctes que l'ordre ne départage pas.
- Les **deux** listes déroulantes rendues passent à `` `${CONTROL} ${borderOf(undefined)}` `` et
  **gagnent `w-full`** : elles s'étirent à la largeur de leur `Field`. C'est déjà ce que `/equipe`
  sert depuis T5bis.3. Écart réel, et le seul du ticket.

**Le harnais s'est mis en défaut avant d'être cru, comme en TD.3.** Le déterminisme est prouvé sur
deux captures successives avant la mesure ; les deux captures « avant » — celle du début et celle
refaite par `git stash` **après** l'exécution des 773 tests — sont identiques, ce qui établit que la
base n'a pas bougé. Puis un `rounded-xl` témoin posé dans le skip-link d'`app/(app)/layout.tsx` fait
bouger **les huit** captures : les sept silences sont donc des silences, pas une panne d'instrument.

**Vérification.** `npm run lint` finit à zéro sur le dépôt entier, avertissements compris.
`npx tsc --noEmit` propre. **23 fichiers de test, 773 tests verts sans modification.** Diff du HTML
servi vide sur sept des huit adresses mesurées, et portant sur `/projets` les deux seuls écarts
annoncés. Aucune écriture en base, aucune sonde.

**Ce que le ticket ne fait pas, et qu'il ne faut pas croire acquis.** La règle garde les signatures
qu'elle connaît : un composant inventé demain avec une chaîne neuve ne sera pas rattrapé. C'est un
**cliquet sur la duplication constatée**, pas une preuve de cohérence. Trois limites mesurées sont
consignées au journal, dont la plus coûteuse : **un geste dont les classes sont réparties sur deux
attributs `className` échappe à tous les motifs.**

---

### T5bis.5 — le radar des compétences — 19/08/2026

**Ce que le ticket livre.** Le second dessin du projet, après la frise. `lib/queries/radar.ts` porte
`axisPoints(count, radius)` et `polygonPoints(ranks, maxRank, radius)`, **pures et testées** comme
`timelineScale` depuis T5.5 ; `components/team/skill-radar.tsx` les place dans un SVG à `viewBox`,
rendu sur le serveur, sans dépendance ni JavaScript ; `PersonCard` le monte au-dessus de sa liste,
qu'il ne modifie pas d'un caractère. Le premier axe pointe vers le haut, les suivants tournent dans
le sens horaire, et **les axes sont les seules compétences que la personne déclare** — la
superposition et la comparaison visuelle sont structurellement impossibles (garde-fou 5).

**Le repère est celui du `viewBox`, et c'est ce qui vide le composant.** Boîte carrée de côté
`2 × radius`, centre `(radius, radius)`, ordonnées vers le bas : les fonctions rendent des
coordonnées prêtes à poser, et il n'y a **aucune trigonométrie** dans le fichier de rendu.
`RADIUS = 50` dans un `viewBox` de 100 n'est pas un nombre arbitraire — les coordonnées **sont**
alors les pourcentages dont les libellés se placent, si bien qu'aucune conversion ne vit entre le
repère du SVG et celui du HTML posé dessus.

**Un écart de périmètre, arbitré avant écriture.** La fiche nomme `maxRank` sans en donner la
source, et rien de ce que `PersonCard` reçoit ne la porte. `lib/queries/team.ts` et son test entrent
donc au périmètre : `findPersonDetail` remonte `levelScaleMax`, le `max(rank)` de `skill_levels` **du
domaine**, en quatrième lecture fixe du `Promise.all` existant. `person-detail.tsx` et
`lib/drawers/team.tsx` ne bougent pas. L'option qui restait dans le périmètre — rapporter les rangs
au plus haut rang *de la personne* — a été écartée : un profil « Intermédiaire partout » y
dessinerait un polygone plein, soit l'indice calculé que D39 interdit.

**Le seuil de trois axes vit dans l'écran, pas dans la géométrie**, et **aucune phrase ne remplace
le dessin absent** : une déclaration à deux compétences n'est pas une saisie incomplète. C'est le
cas de l'indicateur sans relevé de T5.1, et la règle 5 lue à l'endroit.

**Vérification.** *Dans le HTML servi, `<script>` retirés* — la personne à **quatre** compétences
porte un `svg role="img"` nommé, quatre `<line>` d'axe, le contour, le profil et quatre libellés ;
celle à **cinq** en porte cinq ; celle à **deux** n'en porte **aucun**, et sa liste enchaîne
directement sur ses accompagnements ; `/equipe` sans panneau n'a **aucune trace de radar**
(garde-fou 4). *Écran contre test :* les deux attributs `points` de la personne à cinq compétences
sont comparés **caractère par caractère** à ce qu'`axisPoints` et `polygonPoints` rendent en
console — le seul contrôle qui relie l'écran au test. *Mise en défaut :* décaler l'origine d'un
quart de tour fait tomber **les six cas qui épinglent une orientation, et eux seuls** — les quatre
qui n'en épinglent aucune restent verts ; retirer le `filter(skillLevels)` de la **quatrième**
lecture en fait tomber deux, retirer celui de la **jointure** en fait tomber un autre, et les
53 restants tiennent dans les deux états. *Contraste :* ce qui porte l'information passe largement —
tracé à **15,72:1** sur le fond du tiroir et **11,83:1** sur son propre remplissage, libellés à
**8,12:1** —, et ce qui ne porte rien reste sous 3:1 et se consigne : remplissage à **1,33:1**,
toile à **2,22:1**, qui est le plafond déjà chiffré des `surface-neutral-*`. *Droit :* aucun `case`,
aucune action, aucun `can`, aucun point d'entrée neuf ; les trois chemins de refus rejoués rendent
200 sans `role="dialog"` ni radar. `npx tsc --noEmit` propre, `npm run lint` à zéro avertissement,
**26 fichiers de test, 833 tests verts**.

**La leçon, et rien d'autre ne l'aurait trouvée.** **React 19 traite `<title>` en balise de
métadonnée jusque dans un `<svg>`, et deux enfants la vident.** La forme JSX naturelle —
`<title>Radar des compétences déclarées de {fullName}</title>` — rend `<title></title>` dans le HTML
servi : un `role="img"` **sans nom accessible**, ce qu'une absence de `<title>` n'aurait pas
produit. `tsc` et `eslint` passaient tous les deux, et l'avertissement exact dormait dans le journal
de développement. Seule la lecture du HTML servi l'a trouvé ; la forme correcte est le gabarit.

**Sondes.** Aucune. Aucune écriture en base, aucune ligne forgée hors du fichier de test — dont la
seule dissymétrie neuve est un rang 5 donné au second domaine, sans quoi un test d'étanchéité sur un
**maximum** passerait au vert dans les deux états.

---


### T5bis.6 — l'écriture : créer une personne, corriger son profil, poser ses compétences — 20/08/2026

**Ce que le ticket livre.** Les six gestes sur les deux objets : créer une personne, corriger son
profil, l'archiver ; poser une compétence avec son niveau, corriger ce niveau, la **retirer**. Le
patron en trois couches tenu depuis T3.3, sans dépendance neuve — deux modules de validation
**purs** (`lib/forms/person.ts`, `lib/forms/person-skill.ts`, 35 cas), deux panneaux clients à
`useActionState` (`person-panel.tsx`, `skill-panel.tsx`), six actions serveur avec leurs trois portes
(`app/(app)/equipe/actions.ts`). Sans lui, C5bis livrerait un référentiel qu'un script seul alimente,
et T5bis.7 ne pourrait pas retirer la création d'une personne du formulaire de projet.

**Trois arbitrages rendus avant écriture, et deux tiennent à ce que la fiche est plus vieille que la
page.** `tickets-C5bis.md` a été écrit au découpage, avant que T5bis.3 ne pose les cinq filtres et
que T5bis.4 ne pose la fiche. Deux des formes qu'il demande étaient devenues indisponibles.

1. **`profil` et non `personne`.** La fiche veut « `personne=nouvelle` crée et `personne=<uuid>`
   corrige, la forme d'`indicateur` ». Mais `personne=<uuid>` **est** la fiche en lecture depuis
   T5bis.4. Ce ne sont pas deux gestes de même rang, ce sont deux **droits** — la fiche se lit par
   tout le domaine (D9), la saisie demande `manageDomain` —, et une clé unique aurait fait tomber la
   fiche avec le droit d'écrire : un simple membre n'aurait plus pu consulter un profil. C'est la
   séparation que la page produit tient déjà deux fois, `persona`/`fiche` puis `usecase`/`scenario`.
2. **`maitrise` et non `competence`**, et c'est la collision la plus coûteuse. `competence` est la
   clé du **filtre conjonctif répétable** depuis T5bis.3. En faire une clé de panneau l'aurait fait
   entrer dans `TEAM_PANEL_PARAMS` et dans le décompte d'exclusivité — **les deux mécanismes que
   T5bis.4 a écrits pour en tenir les filtres dehors**. Fermer un panneau aurait défait la recherche ;
   poser un filtre aurait fermé la fiche. La valeur, elle, reste polymorphe comme la fiche le
   demande.
3. **`archiver=<uuid>` et non `=confirmation`.** Les deux pages de détail n'ont rien à désigner,
   l'objet visé étant celui de la page ; `/equipe` n'a pas d'objet de page. C'est la forme de
   `CANCEL_PANEL_PARAM`. Le couple `ConfirmPanel` + `ARCHIVE_PANEL_PARAM` est bien repris tel quel ;
   seule la valeur change de nature.

**Un quatrième écart, de périmètre.** `components/team/person-detail.tsx` entre : `PersonDetail` rend
`PersonCard`, et les six gestes ne peuvent atteindre la carte sans transiter par lui. Câblage de
propriétés — la fiche n'en lit aucun —, sur le précédent d'`equipe/page.tsx` en TD.3.

**Le décompte d'exclusivité passe d'une clé à quatre sans qu'un caractère change**, pour la quatrième
fois depuis T5.2. Les cinq clés de filtre n'y entrent toujours pas, et cette propriété-là **se
mesure** : `?personne=<uuid>&competence=<uuid>` rend la fiche ouverte *et* le filtre appliqué.

**La propriété la mieux payée du ticket est un non-geste.** La fiche énumère « ajouter une compétence
avec son niveau ; **corriger ce niveau** ». Le panneau de correction ne rend donc **aucun contrôle de
compétence**, et `parsePersonSkillForm` reçoit la compétence de la ligne relue côté serveur —
`lockedSkillId`, qui gagne toujours sur ce que le `FormData` porterait. Trois conséquences, et la
troisième est la vraie raison : l'unicité n'a rien à arbitrer sur ce chemin ; aucun champ caché ne
double la compétence ; et une soumission forgée n'obtient rien parce que la valeur reçue est
**ignorée** plutôt que crue — la seule forme qui ne puisse pas se tromper. Se tromper de compétence
se répare en la retirant puis en la reposant.

**Retirer est un `unlink`, et c'est le typage qui l'impose.** `person_skills` n'a pas d'`archived_at`,
ce qui la range dans `LinkTable` et fait d'`archive` un refus de compilation (T5bis.1). Le verbe à
l'écran suit la table : « Retirer », jamais « Archiver » — la règle de T5.4.

**Vérification.** *Dans le HTML servi* — les quatre panneaux rendent chacun le leur
(`panneau-profil-titre`, `panneau-maitrise-titre`, `panneau-confirmation-titre`,
`panneau-personne-titre`), la page reste rendue derrière et porte `inert`, et **la polymorphie de
`maitrise` se lit sur une même page** : la fiche de Camille Roux porte `maitrise=<son uuid>` pour la
pose et quatre `maitrise=<uuid de liaison>` pour les corrections. Le panneau de correction n'a
**aucun** `name="skillId"`, dit sa compétence en toutes lettres, et pré-sélectionne « Avancé ». Une
personne **créée** paraît aussitôt dans la liste avec son métier et sa disponibilité ; **corrigée**,
elle s'y affiche autrement — « Partiellement disponible » → « Indisponible ». Une compétence **déjà
portée** rend le message sous le champ, la base ne bouge pas, et le journal du serveur reste muet.
La fiche d'un intervenant côté entité ne porte **aucun** geste de compétence, et garde les deux du
profil. `?profil=n-importe-quoi`, `?archiver=confirmation` et deux clés ensemble n'ouvrent rien.

*Arbitrage (e), vérifié et non affirmé :* une personne archivée disparaît de `/equipe` — 0 occurrence
— et **reste dans l'équipe de son accompagnement** — 1 occurrence sur la page projet.

*Mise en défaut :* trois témoins, tous concluants et tous bornés. Neutraliser l'obligation du nom fait
tomber **2** cas — celui qui la nomme, et celui qui épingle la propriété `input ⇔ !errors` en s'en
servant comme source d'erreur ; neutraliser le refus du `stakeholder` en fait tomber **1**, le sien ;
neutraliser `lockedSkillId` en fait tomber **2**, les deux qui l'isolent. Les autres tiennent.

*Le droit s'éprouve par l'action.* Les **six** points d'entrée sont capturés sous le responsable de
domaine puis rejoués **en multipart** sous un simple membre : six 200, et **la base ne bouge pas** —
10 personnes et 27 liaisons avant comme après, profil de la sonde intact. Chacun est **précédé de son
étape témoin** sous le responsable, qui écrit : nom modifié, liaison ajoutée, niveau changé, liaison
retirée, personne archivée. Cinq charges forgées refusées, base comptée : une personne d'un autre
domaine, une compétence d'un autre domaine, un niveau d'un autre domaine, une compétence posée sur un
intervenant côté entité, une personne déjà archivée.

*Et `loadTeamDrawer` compte pour un septième.* Frappé en `text/plain` avec sa charge Flight : les
trois `kind` d'écriture demandés par un simple membre rendent **`null`** — 70 octets, la charge du
rien — quand les mêmes sous le responsable rendent leur panneau (1 322, 1 833, 1 443 octets), et
l'étape témoin est `personDetail` sous le responsable, à 15 177 octets. **Huit charges forgées
refusées**, dont `{"kind":"archive"}` **sans identifiant** — la forme exacte de la page produit, que
`archive` devenu clé commune aux trois pages rendait atteignable.

*Contraste :* aucun couple n'est neuf par la position, et les six ont été **remesurés** sur
`surface-neutral-pale` (`#fdfdfd`), le fond du tiroir — 15,72:1 · 17,87:1 · 8,12:1 · 4,98:1 ·
3,88:1 pour le filet (limite 3:1) · 13,65:1 pour le bouton primaire. Aucun jeton neuf, aucun septième
substitut. `npx tsc --noEmit` propre, `npm run lint` à zéro avertissement, **28 fichiers de test,
868 tests verts**.

**La leçon, et elle est dans le harnais.** TD.1 avait appris qu'un harnais urlencodé là où React rend
du multipart obtient un **200 muet** ; T5bis.4 qu'une fonction serveur frappée en urlencodé rend un
**404**. Celui-ci en trouve un **troisième** : `$ACTION_REF_1` est rendu **sans attribut `value`**, un
extracteur qui exige `value="…"` le saute silencieusement, et Next répond
`Failed to find Server Action` — **un 500**, indiscernable d'un refus pour qui ne lit pas le journal
du serveur. Sans étape témoin, les six refus mesurés auraient tous été des 500 pris pour des refus.
La règle qui en sort : **la première mesure d'un harnais doit être un succès, jamais un refus.**

**Sondes.** Quatre personnes créées puis **archivées** (règle 4 — les sondes s'archivent, elles ne se
suppriment pas, le typage d'`unlink` refusant une table à `archived_at`) ; une compétence et un niveau
posés dans un domaine-sonde de T5bis.4, archivés de même ; une liaison `project_members`
**supprimée**, une table de lien se retirant. `/equipe` et la page projet vérifiées rendues à leur
état : 0 sonde visible, 9 personnes vivantes et 27 liaisons, comme avant le ticket.

---


## Points ouverts refermés

*(archivés depuis `ETAT.md` le 14/08/2026 — ils étaient barrés dans la section « Points ouverts »,
où ils occupaient encore la place. Conservés tels quels : un point refermé documente comment il
l%s été.)*

- ~~**Le bloc « Projets liés » est retiré du rendu.**~~ **Refermé le 27/08/2026 par T6.4.** Le point
  était né d'une demande du 21/08/2026 : la rangée des blocs annoncés passait de trois cartes à
  deux, et « Projets liés » disparaissait — masqué, pas livré. `project_links` était au modèle
  depuis T1.2 et **les quatre règles de lien déduit étaient écrites depuis `docs/04` §5** : ce qui
  disparaissait était l'annonce, pas la destination. Le bloc revient avec son contenu réel, entre
  « Démarrage » et « Budget », et il n'entre pas dans la rangée — un bloc qui porte son contenu
  n'annonce plus rien. `project_links` reste au modèle **sans lecteur** jusqu'à T6.5 : ce ticket-ci
  ne livre que le déduit.

- ~~**« Voir le journal » est dessiné sans être un lien.**~~ **Refermé le 27/08/2026 par T6.3, à
  l'endroit exact où il avait été posé.** Le point disait une dette d'interface arbitrée le
  20/08/2026 : la maquette `project-v2` dessinait trois gestes sans route, deux avaient été retirés,
  et le troisième était rendu en `<span>` dans un `<p>` — ni focalisable, ni annoncé comme un lien,
  portant « — à venir » en `sr-only`. L'arbitrage tenait sur une promesse : *C6 livre le journal, et
  le point d'entrée est déjà à sa place.* Il l'était : « Voir le journal » est devenu le `<summary>`
  du bloc, sans changer de place dans la page. `pending` a disparu de `REFERENCE_BLOCKS` avec son
  seul appelant, et la rangée des blocs annoncés a perdu sa grille en même temps que sa seconde
  carte.

- ~~**`lib/format.ts` écrit son insécable en caractère.**~~ **Refermé le 27/08/2026 par T6.3**, la
  moitié mécanique d'un point qui en portait deux. U+00A0 vivait en caractère dans
  `formatResultValue` depuis T4.3, quand `lib/journal.ts` l'écrit `"\u00A0"` sous le nom `NBSP`
  depuis T6.1 : deux écritures d'une seule règle, dont l'une invisible à l'œil dans un source comme
  dans un navigateur. Le remplacement était sûr parce que `lib/format.test.ts` éprouvait déjà la
  propriété **sur le point de code** — un test qui aurait attendu l'espace ordinaire serait passé le
  jour où la règle aurait sauté. L'autre moitié du point, `PERSON_KIND_LABEL`, reste ouverte dans
  `ETAT.md` : elle demande un vocabulaire tranché, pas un déplacement.

- ~~**On n'ajoute qu'une personne par enregistrement.**~~ **Refermé le 25/08/2026 par T5bis.7.** Le
  point ne s'est pas levé, il a perdu son objet : l'arbitrage (g) de C5bis a sorti la création d'une
  personne du formulaire de projet, et une limite sur un bloc qui n'existe plus ne limite rien. La
  raison d'origine — un champ répétable exige le JavaScript que la cinquième discipline interdisait —
  n'a jamais été contredite ; elle est devenue sans emploi. `/equipe` crée une personne avec son
  métier, sa disponibilité et ses compétences, autant de fois qu'on veut.

- ~~**`PERSON_KIND_LABEL` existe en deux exemplaires, et ils ne disent pas la même chose.**~~
  **Refermé le 25/08/2026 par T5bis.7, sans que l'arbitrage éditorial ait eu à être rendu.** Le point
  demandait de trancher un vocabulaire : « Côté centre de compétence » / « Côté entité »
  (`lib/forms/project.ts`) contre « Membre du centre » / « Intervenant côté entité »
  (`lib/forms/person.ts`). Le premier est parti **avec l'écran qui l'affichait** — le `select`
  « Rattachement » du bloc d'ajout —, et il ne reste qu'une version. Ce qui subsiste n'est plus un
  vocabulaire mais un rangement : ces libellés vivraient mieux dans `lib/format.ts`, où sont ceux des
  autres énumérés. Le point ouvert récrit dans `ETAT.md` ne dit plus que cela.

- ~~**Le bouton primaire et le secondaire s'écrivent aussi en deux attributs, hors de portée de
  `socleLock`.**~~ **Refermé le 21/08/2026, hors ticket.** Trois composants de
  `components/projects/` — `AddActivity`, `LinkResource`, `AdoptIndicator` — portaient la forme du
  bouton dans une coquille et recevaient la couleur de leurs six points de montage, si bien que
  **chaque motif de `socleLock` ne voyait qu'un attribut à la fois**. Le point prescrivait sa propre
  réponse : « faire de ces trois coquilles des `Button`, ce qui les ferait rentrer sous la règle par
  disparition ». C'est ce qui a été fait, à ceci près que le remplaçant n'est pas `BUTTON_PRIMARY` —
  qui n'existe plus — mais `buttonClass({ variant })`, les trois coquilles rendant un `<DrawerLink>`
  et non un `<button>`. **Une clause de plus** garde désormais leur forme, celle qui ne nomme aucune
  couleur et n'avait donc aucun gardien ; elle a été mise en défaut sur un nœud et un seul.

- ~~**Le socle couvre vingt et un des quarante composants du design system.**~~ **Refermé le
  19/08/2026 par TD.6.** Les logements créés par TD.3 et TD.4 — `Button` / `BUTTON_PRIMARY` /
  `BUTTON_SECONDARY`, `ACTION_LINK_SM`, `BlockNote`, `ArchivedNotice` — sont désormais **gardés** :
  `socleLock` interdit de les récrire à la main hors de `components/ui/`, et `uiLayerSeal` scelle la
  couche contre les requêtes en valeur, les composants métier et les actions serveur. Les deux
  corrections que le point annonçait ont été faites : la liste de signatures de la fiche était fausse
  sur deux points, et la signature « état vide dans un bloc » **ne pouvait pas** être la chaîne
  retenue — elle porte donc sur les trois variantes que TD.4 a retirées. Ce qui reste ouvert n'est
  plus la couverture du socle mais deux angles morts nommés, versés aux points ouverts d'`ETAT.md` :
  le bouton écrit en deux attributs, et `components/shell/` hors du scellement.

- ~~**La règle 2 n'est pas surveillée sur les espacements.**~~ **Refermé le 19/08/2026 par TD.5.**
  `--spacing` était un pas et non une échelle, et Tailwind en dérivait n'importe quel multiplicateur.
  Le relevé du point disait « une soixantaine de valeurs hors `--number-*` » ; le compte exact était
  **39 occurrences fautives dans 12 fichiers**, le reste des classes fractionnaires (`0.5` et `1.5`)
  étant conforme. `spacingScaleLock` interdit désormais le multiplicateur fractionnaire hors échelle,
  la dimension arbitraire qui ne pointe aucun jeton, et l'épaisseur de bordure brute — cette dernière
  clause étant une de plus que la fiche n'en prescrivait, sans quoi `border-l-3` aurait été corrigé
  sans être gardé. **Ce qui reste ouvert n'est pas le trou mais sa bordure** : une chaîne de classes
  rangée dans une constante échappe aux trois clauses, mesuré par sonde, et les `.ts` ne sont pas
  surveillés — consigné dans `JOURNAL-TECHNIQUE.md`, à reprendre avec `socleLock` en TD.6.

- ~~**`SectionHeader` déclare une note et ne la rend jamais.**~~ **Refermé le 19/08/2026 par TD.4**,
  sur arbitrage humain rendu avant écriture : **la note se rend**. La prop était déclarée depuis T2.3
  et affichée nulle part ; `roadmap.tsx:171` lui passait « Le récit de l'accompagnement, au mois. »,
  phrase qui n'était **dans aucun HTML servi** et que `docs/06` §5 corrobore pourtant — « c'est le
  récit du projet ». Elle se lit désormais sur six rendus. **Elle a pris `basis-full` plutôt qu'un
  conteneur autour du titre** : l'en-tête est déjà une boîte `flex-wrap`, et l'envelopper aurait
  donné un `<div>` de plus aux trois appelants qui ne passent pas de note — un écart de rendu sur des
  écrans que le ticket ne visait pas. **Ce point valait plus que sa ligne** : il est la démonstration
  que le dépôt s'est faite contre lui-même du principe de TD.6 (c). L'unique avertissement permanent
  du dépôt était un **vrai défaut**, resté lisible et non lu à côté des quatre faux positifs que
  `underscoreIsIntentional` avait été écrite pour taire. `npm run lint` finit à zéro depuis.

- ~~**`createProject` accepte encore un produit archivé.**~~ **Refermé le 17/08/2026 par TD.1**, à
  qui `ETAT.md` l'assignait — « le prochain ticket qui ouvre `app/(app)/projets/actions.ts` sans que
  sa fiche l'en empêche ; C7 au plus tard ». Le point avait traversé T4bis.2, qui l'avait ouvert, et
  T4bis.3, dont la fiche portait l'interdit de le refermer. Ce que le ticket a trouvé en le
  refermant : **le trou avait un jumeau** que le journal ne consignait pas — `updateProject`
  déplaçant un accompagnement **vers** un produit rangé, aussi invisible et par le même chemin. Les
  deux tombent ensemble parce que la règle est posée dans `checkReferences`, la porte que les deux
  actions traversent, et non dans chacune d'elles. **Et il fallait une exception** : l'accompagnement
  déjà sous un produit rangé — état que le point ouvert sur le rétablissement décrit — deviendrait
  sinon immodifiable ; elle est nominative, sur le modèle de T4bis.1. Éprouvé par l'action en six
  temps, dont l'étape témoin et la neutralisation de la règle sous la même charge. Reste dû : la règle
  n'est couverte par aucun test, `vitest` ne couvrant pas `app/`.

- ~~**La lecture des entités est dupliquée entre deux écrans.**~~ **Refermé le 17/08/2026 par TD.1.**
  T4bis.1 avait posé `listProductFormOptions` pour `/produits/[id]/modifier` et laissé
  `/produits/nouveau` avec son `list(entities, …)` en ligne — la fiche disant que le formulaire de
  création « ne change pas d'un caractère », et la page n'étant pas à son périmètre. Les deux tris
  avaient été alignés à la main sur `asc(entities.label)` « pour que la duplication ne devienne pas
  une divergence » ; ils n'ont plus à l'être. L'écran de création n'a pas d'exception nominative à
  demander : rien n'y est encore rattaché, donc aucune entité archivée n'a à être tolérée.

- ~~**Le refus (e) d'`archiveProduct` reste au pluriel dans sa dernière phrase.**~~ **Refermé le
  16/08/2026 par T5.4**, à qui `ETAT.md` l'avait assigné. Le point posait une tension que le ticket a
  dû trancher : la fiche T5.4 n'ouvre **pas** `app/(app)/produits/actions.ts` — elle le cite comme
  modèle à recopier —, si bien que la règle 3 et la destination écrite se contredisaient. Arbitrage
  posé à l'humain avant écriture, tranché : le fichier entre au périmètre **pour cette seule phrase**,
  parce qu'un défaut se corrige avant d'être recopié. La correction n'est pas un rapiéçage : le
  `plural` disparaît au profit de **deux phrases entières** choisies par le décompte, et le refus (e)
  d'`archiveIndicator` naît directement sous cette forme. Les deux états relus dans le flux, sur un
  produit à un accompagnement et sur un produit à trois. **La leçon vaut au-delà de la phrase** :
  une chaîne à trous ne se relit pas dans ses deux états, et c'est ce qui a laissé le défaut vivre de
  T4bis.2 à T5.1 sans que quatre sessions le voient.

- ~~**Le parcours d'archivage d'un produit n'a jamais été joué à l'écran.**~~ **Refermé le
  16/08/2026 par T5.1**, à qui la session de découpage de C5 l'avait assigné comme dû hors périmètre
  de fichiers. Ses six points ont été joués et rapportés — archiver et rétablir depuis la page,
  `/produits/{id}/modifier` en 404, `updateProduct` reposté après archivage et refusé **garde
  isolée**, `archiveProduct` et `restoreProduct` sous cookie de membre, et le refus (e) relu au
  singulier comme au pluriel. Le détail est dans le récit de T5.1 ci-dessus. **Le point ne se referme
  pas les mains vides** : le singulier du refus (e) laisse un pronom pluriel en fin de phrase, ce
  qu'aucune lecture d'écran n'avait montré, et qui devient un point ouvert à part entière. Ce que
  T4bis.2 devait au parcours est payé ; ce que le parcours a trouvé est écrit.

- ~~**C4bis est livré en entier, et la matrice « corriger / archiver » est pleine.**~~ **Refermé le
  15/08/2026 par la session de découpage de C5, geste 2.** Les six manques sont refermés par six
  tickets, sous les six arbitrages rendus avant écriture. Quatre portes gouvernent désormais les
  écritures de la page projet — `openProject`, `openActivity`, `openResource`, `openResult` — et le
  même `canWrite` fait tomber sept gestes ensemble. T4bis.6 a porté la seule migration du chantier :
  « retirer puis ressaisir » est un chemin réel, pour le résultat comme pour l'activité qui le
  portait. **Ce que le point promettait est tenu** : les six lignes de ticket ont quitté `ETAT.md`
  pour la ligne de chantier unique, et le fichier est repassé de 256 à 219 lignes, sous le seuil de
  250 que le protocole lui fixe.

- ~~**`CLAUDE.md` et `AGENTS.md` ont été modifiés par Claude le 14/08/2026, sur instruction
  explicite, en trois fois.**~~ **Refermé le 14/08/2026 par la session de découpage de C4bis, geste
  0 : l'humain a relu les trois lots et les a confirmés en l'état.** Les trois lots étaient (1) trois
  collages dont le texte avait été validé — la ligne `HISTORIQUE-TICKETS.md` dans la table « Où
  écrire quoi », les disciplines de vérification à l'étape 4, et le passage de trois à quatre
  fichiers ouverts dans `AGENTS.md` ; (2) le mécanisme anti-embonpoint — étape 5 augmentée (une ligne
  par ticket, un point ouvert se récrit, seuil de 250 lignes) et la section neuve **« Session de
  découpage »**, six gestes, qui n'existait nulle part alors que deux sessions de ce type avaient
  déjà eu lieu ; (3) le **retrait de la cinquième discipline** — « le parcours se joue sans une ligne
  de JavaScript » —, qui rendait le lot (1) caduc sur ce point.
  **Conséquence tenue :** l'étape 4 compte **quatre** disciplines, et **aucune fiche de
  `tickets-C4bis.md` n'exige le parcours sans JavaScript.** Les six tickets du chantier ont été
  découpés sur cette base. **Ces modifications restent des exceptions à la règle 7 et ne valent pas
  précédent** : `CLAUDE.md` s'écrit par l'humain.

- ~~**Trois paramètres d'ouverture sur la page projet, dont deux posés.**~~ **Refermé par T4.4**,
  qui a posé le troisième — `?resultat=`, après `?activite=` en T3.2 et `?ressource=` en T4.2. Le
  point pariait que T4.4 « ajoute sa clé à `asked` et n'écrit aucune condition neuve » : **la règle
  n'a pas changé, son écriture si.** L'exclusivité de T4.2 était une comparaison binaire — `activite
  !== undefined && ressource !== undefined` —, qui ne se généralise pas à trois clés. Elle est
  devenue un décompte sur les clés définies, qui dit la même chose pour trois et restera juste quand
  C5 ajoutera la sienne. Éprouvé sur les sept combinaisons : chaque clé seule ouvre son panneau,
  chacune des trois paires et le triplet n'ouvrent **rien** — zéro `role="dialog"`, zéro `inert`.
  À retenir : **un point ouvert qui promet « aucune condition neuve » promet sur la règle, pas sur
  le code.**

- ~~**Le commanditaire est vide sur toute la fixture.**~~ **Refermé par T2.6**, par l'écran et non
  par l'amorçage : le formulaire saisit `sponsor` (D6, texte libre), et le projet créé en
  vérification affiche « Hélène Vasseur » dans son en-tête. `scripts/seed.ts` n'est pas touché —
  les trois projets du brief n'ont toujours pas de commanditaire, et le brief n'en nomme aucun.

- ~~**Le panneau de saisie affiche un « Enregistrer » inactif entre T3.2 et T3.3.**~~ **Refermé par
  T3.3**, et le ticket a trouvé au passage que le bouton vivait **hors** du `<form>` depuis T3.2 —
  donc hors de toute soumission, quand bien même il aurait été actif. Le formulaire enveloppe
  désormais le pied. Le cycle de tabulation compte un arrêt de plus, **éprouvé dans Chrome, touches
  réellement dépêchées** : la 13ᵉ tabulation atteint « Enregistrer », la 14ᵉ « Annuler », la 15ᵉ
  revient sur la croix. Les champs `date` prennent trois tabulations chacun — segments jour, mois,
  année du contrôle natif, comme en T2.6.
- ~~**Le formulaire du panneau est posé, sa validation ne l'est pas.**~~ **Refermé par T3.3**, avec
  **sept** refus là où la fiche en nommait trois : les trois du critère, le quatrième de
  l'arbitrage (b), un cinquième tranché en ouverture de ticket (fin sans début), plus la date
  impossible et le type hors du domaine. Noter que la case ne masque toujours pas la période, comme
  le fait la maquette : sans JavaScript un champ ne disparaît pas, et c'est la note sous la case qui
  énonce la règle — et le refus qui la fait respecter.

- ~~**Trois arbitrages rendus d'avance pour T3.3, T3.4 et T3.5 — 13/08/2026.**~~ **Les trois sont
  consommés.** Ils ne sont dans aucun document, ils ont été tranchés avec l'humain hors ticket.
  **(a) et (b) l'ont été par T3.3**, sans écart : la table de dérivation est écrite telle quelle
  dans `deriveActivityState`, et le refus (b) est le quatrième des sept. **(c) l'a été par T3.4**,
  sans écart non plus et sans colonne ajoutée : `resolveActivityPeriod` compare la période soumise à
  celle de la ligne — **normalisée des deux côtés**, `""` et `null` étant la même absence — et rend
  la ligne existante telle quelle si rien n'a bougé, la dérivation sinon. La prédiction de T3.3 s'est
  vérifiée : T3.4 n'a eu qu'à décider **s'il appelle** la dérivation, sans en réécrire une ligne.
  **Ce que T3.4 a découvert et que l'arbitrage ne disait pas** : la comparaison doit porter sur
  `is_unscheduled` **aussi**, le schéma n'interdisant pas la case avec une période — sans ce terme,
  décocher la case sans toucher aux dates n'aurait rien changé du tout.

  **a. Dérivation période → état. Vision ne fabrique aucune date.** « À planifier » cochée sans
  date → `planned` + `is_unscheduled`. Deux bornes saisies → `planned`, `in_progress` ou `done`
  selon que la période est à venir, couvre aujourd'hui, ou est passée. **Début seul, sans fin →
  `in_progress`, quelle que soit son ancienneté**, et `period_end` reste nul. Conséquence assumée :
  une activité commencée en mars 2024 sans fin reste « en cours » indéfiniment, et T3.5 est le seul
  chemin pour la clore. Propriété qui en découle et qui vaut d'être connue : `done` n'est dérivé que
  d'une période dont la fin est **saisie**, si bien que
  `activities_done_requires_period_end` ne peut pas être violée par la dérivation ;
  `activities_planned_requires_period_or_unscheduled` tient de même. Les deux contraintes tiennent
  **par construction**. Attention à la phrase de la fiche de T3.3 — « une fin de période à venir, au
  31 du mois en cours » : elle décrit le cas où **les deux bornes sont saisies** dans le mois
  courant, ce n'est pas une règle de complétion.

  **b. « À planifier » cochée avec une période saisie : refus.** Quatrième refus, en plus des trois
  que nomme la validation, et la saisie revient dans le panneau avec ses deux valeurs. Vision ne
  jette jamais en silence ce qui a été tapé — la raison même qui a fait rendre « Enregistrer »
  inactif en T3.2.

  **c. Précédence T3.4 / T3.5 : l'état n'est redérivé que si la période a bougé.** T3.4 compare la
  période et `is_unscheduled` soumis à la ligne existante. Inchangés, l'état est laissé tel quel — la
  correction manuelle de T3.5 survit à l'édition d'un objectif, d'un type ou d'une approche.
  Modifiés, l'état est redérivé : déplacer une période est une intention sur l'état. Aucune colonne
  à ajouter, aucune migration. **Sans cet arbitrage, T3.4 déferait silencieusement T3.5**, et le
  défaut ne se serait vu qu'en T3.5 — donc en reprise de T3.4.
- ~~**Une activité annulée est invisible entre T3.1 et T3.5.**~~ **Fermé par T3.5** : le cinquième
  groupe — « Annulé », replié par défaut derrière un `<details>` natif — est ouvert, et
  `listProjectRoadmap` ne retire plus `cancelled` de sa lecture. **Le choix laissé ouvert par T3.4
  sur le lien « Modifier » d'une entrée annulée est tranché : il est retiré pour ce groupe.** Le
  motif s'affiche à sa place, sous l'objectif — une activité annulée reste lisible, elle ne se
  corrige plus.

- ~~**Rien n'empêche techniquement un import direct de `lib/db/client`.**~~ **Fermé avant C3** :
  `eslint.config.mjs` porte désormais `no-restricted-imports` sur `lib/db/client`, exception faite
  de `lib/db/scoped.ts` et des fichiers `*.test.ts` — vérifié en réintroduisant temporairement
  l'import dans `lib/queries/products.ts`, qui fait échouer `npm run lint`.
- ~~**Les tables de liaison se suppriment pour de bon.**~~ **Confirmé par T2.6**, l'écran annoncé :
  retirer un membre, un métier ou une approche d'un projet appelle `unlink`, une vraie suppression
  de ligne, et c'est le comportement voulu — une désignation défaite n'est pas une donnée métier
  qu'on range, c'est un lien qui n'existe plus. La règle 4 tient parce que le typage réserve
  `unlink` aux tables sans `archived_at`.

---

- ~~**`Section` et `Block` cohabitent, et les deux pages de détail divergent.**~~ **Refermé le
  20/08/2026 par la reprise de `project-v2`.** Le point posait la question comme **éditoriale** — la
  page projet doit-elle monter au format produit, ou les deux formats disent-ils deux rangs de bloc
  différents ? — et notait que les deux composants étaient techniquement interchangeables. La
  maquette y répond : `Section` passe du rayon `xl` au rayon `2xl` et de `px-6 py-5` à `px-7 py-6`,
  et les deux pages portent désormais des cartes de même rang. **Les deux composants restent
  distincts**, et sur ce qui les sépare vraiment : `Block` est un chapitre — rayon `3xl`, `gap-5` —,
  `Section` une carte de contenu. Le geste n'a touché que la page projet, `Section` et
  `SectionHeader` n'ayant aucun autre appelant dans le dépôt.

- ~~**Le groupe « Annulé » de la roadmap projet se replie sans marque visible.**~~ **Sans objet
  depuis le 20/08/2026** : le `<details>` a disparu avec le passage de la roadmap en liste à plat, et
  avec lui le `<summary>` en `flex` dont le triangle natif manquait. Ce qui reste — le groupe n'est
  plus replié du tout — est un point ouvert **neuf**, versé à `ETAT.md`, et il ne porte plus sur une
  marque mais sur le repli lui-même.

## Faits acquis, versés aux « Rappels de contexte » d'`ETAT.md`

*(ces deux entrées n'étaient plus des points ouverts mais des règles permanentes. `ETAT.md` en garde
une forme courte ; le raisonnement complet est ici.)*

- **C4bis a été intercalé sans décaler les autres chantiers**, et C5 est clos depuis le 17/08/2026.
  C5, C6 et C7 gardent le sens que `docs/05` leur donne, « C7 » étant écrit dans D25, D28 et D37 que
  la règle 6 interdit de rouvrir. C5 : six tickets, sept arbitrages rendus avant écriture, dans
  `tickets-C5.md` ; sa leçon reprise de C4bis — **chaque objet arrive avec ses trois gestes, créer,
  corriger, ranger, dans le ticket qui l'introduit** — a tenu sur ses six fiches. *(Versé depuis
  `ETAT.md` le 17/08/2026 par TD.1, au titre du seuil de 250 lignes : deux notes de chantier devenues
  des faits datés.)*

- **Le panneau de saisie n'est plus un composant serveur.** T3.2 en faisait une propriété — « rien
  ici n'a d'état, et c'est tout le propos ». T3.3 l'a retournée : faire revenir une saisie refusée
  avec ses valeurs demande `useActionState`, donc `"use client"`, et il n'y avait pas de troisième
  voie — une action qui redirigerait en réencodant la saisie dans l'URL aurait été pire à tous
  égards. Le panneau prend donc la forme de `project-form.tsx` depuis T2.5 : amélioration
  progressive, socle qui tient sans script. **Ce qui n'a pas bougé** : l'ouverture reste une URL, les
  trois sorties restent des liens, `inert` et `autofocus` restent des attributs HTML, et `FocusTrap`
  reste le seul endroit où du JavaScript est indispensable. Ce qui a bougé est la **frontière** du
  bundle client, pas la nature du socle. L'alternative écartée avec l'humain — extraire un
  `activity-form.tsx` et garder le panneau serveur — coupait en deux un composant que T3.4, T3.5 et
  T3.6 toucheront tous les trois.

- **Un argument lié à une action serveur n'est pas un secret.** Découvert en vérifiant T3.3, et à
  garder en tête pour tout ticket d'écriture à venir : `createActivity.bind(null, project.id)` fait
  sortir l'identifiant de la saisie, mais Next le sérialise dans un champ `$ACTION_1:1` du balisage,
  **en clair en développement** — et une requête soumise peut le réécrire, ce qui a été fait pour le
  voir. La conséquence est une règle, pas une inquiétude : **une action ne doit jamais tirer une
  autorisation de la valeur qu'on lui a liée.** `createActivity` interroge `writeProject` sur le
  `projectId` **reçu**, si bien que repointer la liaison vers un projet où l'on n'écrit pas est
  refusé comme le reste. La même vigilance vaut pour `updateProduct` et `updateProject` de C2, qui
  lient déjà un identifiant — tous deux exigent `manageDomain`, un droit qui ne dépend d'aucun
  identifiant, donc rien à reprendre. À revoir le jour où une action liera une valeur **dont dépend**
  un droit.
  **T3.4 est ce jour-là, et la règle a tenu.** `updateActivity` lie **deux** valeurs, et la seconde —
  l'identifiant de l'activité — désigne la ligne écrite : elle a été relue en clair dans le champ
  `$ACTION_1:1` du balisage servi, à côté du projet. La parade n'est pas de la cacher mais de ne
  jamais lui faire confiance : l'action rapproche l'activité **reçue** du projet **reçu**, et refuse
  si elle n'en relève pas, si elle est archivée ou si elle est annulée. Les deux premiers cas ont été
  forgés et refusés, la ligne relue intacte en base ; le troisième a demandé de rendre une activité
  annulée à la main, la fixture n'en portant aucune.

*(deux entrées de plus, versées ici au balayage d'`ETAT.md` de T5.5 : elles n'étaient plus des
rappels utiles à une session, mais des faits datés.)*

- **La cinquième discipline de vérification a été retirée le 14/08/2026, et le retrait est
  confirmé.** L'étape 4 du protocole en compte **quatre**. Aucune fiche de C4bis n'a exigé que le
  parcours se joue sans une ligne de JavaScript, aucune de C5 non plus — la frise de T5.5 s'en passe
  parce que sa fiche l'interdit nommément, pas parce qu'une discipline générale l'imposerait.

- **Modèle par ticket.** Le plan écrit disait Opus pour C1, Sonnet à partir de C2 ; en pratique C2,
  T3.1, T3.2 et tout C4 sauf T4.1 et T4.2 ont été menés sur Opus, T4.1 sur Antigravity, et C4bis
  comme C5 sur Opus. **Le levier n'est pas le modèle mais les quatre disciplines de vérification** —
  c'est cette phrase que `ETAT.md` garde, le relevé restant ici.

---

## Hors ticket — menu « … » sur les cartes de roadmap, 17/08/2026

**La demande.** Les cartes de la roadmap des activités devaient porter un bouton « … » à leur
extrémité droite, ouvrant un menu qui réunit les gestes jusque-là posés en toutes lettres à côté
d'elles. Le bouton devait être un composant réutilisable à l'échelle de l'application — 32×32, fond
blanc, bordure de 1px en `#24226a`, rayon de 8px, trois points verticaux centrés.

**Écart de périmètre, assumé et daté.** Le chantier en cours est C5bis — Équipe, et
`components/projects/roadmap.tsx` n'appartient au périmètre d'aucune de ses sept fiches. Le travail
est donc hors ticket, comme celui de la page produit le même jour.

**Ce que la lecture a changé au plan.** Le composant existait : `indicator-menu.tsx`, écrit la
veille pour le bloc North Star, portait déjà `Échap` avec retour du focus, le clic extérieur en
`pointerdown`, `aria-haspopup` / `aria-expanded` / `aria-controls` / `role="menu"`, et l'absence
délibérée de prop `className` qu'un correctif de positionnement avait imposée. Il a été promu en
`components/ui/action-menu.tsx` et son unique appelant suivi. Écrire un second menu aurait laissé
deux boutons « … » aux mesures différentes dans la même application.

**Quatre décisions prises avant d'écrire.** Promouvoir plutôt que doubler. Appliquer les nouvelles
mesures **aux trois emplacements**, y compris les deux menus North Star déjà en place. Sortir
« Annuler » vers un panneau plutôt que replier son champ dans le menu. Accepter la régression sans
JavaScript et la consigner.

**Ce que l'implémentation a appris.** Trois choses qui n'étaient pas dans le plan. La bordure
demandée **corrige un contraste de 1,33:1 à 13,65:1** — l'ancienne était sous le seuil de 3:1 de
WCAG 1.4.11 depuis la veille, sur les deux menus North Star ; la demande n'était pas cosmétique.
`ConfirmPanel`, dont l'en-tête se décrit comme « un panneau qui ne saisit rien », rend ses
`children` à l'intérieur de son formulaire et a donc accueilli le champ « Motif » sans qu'une de ses
lignes change — aucune sixième coquille. Et `cancelActivity` a dû cesser de refuser en silence : sa
note le justifiait par l'absence d'écran, et le geste venait d'en recevoir un.

**Vérification.** Le HTML servi porte un `<button aria-haspopup="menu" aria-expanded="false">` par
carte, aux classes `h-8 w-8 rounded-lg border border-border-primary-base`, et **aucun** `role="menu"`,
`role="menuitem"` ni champ `$ACTION_` de roadmap — les entrées ne vivent que dans la charge RSC, ce
qui est la régression sans JavaScript, lue plutôt qu'affirmée. Trois sessions sans droit d'écriture
ne reçoivent aucun bouton. Le droit a été éprouvé par l'action : quatre POST multipart forgés sur
`cancelActivity` — motif vide, activité `done` d'un autre projet, identifiant inexistant, session
sans `writeProject` — rendent chacun un message et n'écrivent rien, la roadmap relue après coup ne
montrant ni groupe « Annulé » ni motif forgé. Le chemin nominal a été joué une fois sur la base de
développement : 303, panneau refermé, groupe « Annulé » replié portant son motif. Le contraste a été
mesuré, pas supposé. La mise en défaut de `validateCancellationReason` fait tomber **un** test et
rien d'autre — après une première exécution trompeuse dont dix échecs venaient du réseau.

---

## Hors ticket — le bloc « Use Cases », 19/08/2026

**La demande.** Un bloc « Use Cases » sur la page produit, sous « Personae » : des cartes
compactes sur **une seule ligne**, défilable horizontalement quand il y en a beaucoup, chacune
ouvrant un panneau de détail. Un use case porte un titre, une description courte et des personae
associés. Il constitue le niveau de lecture du milieu — **Personae → Use Cases → Features** — et sa
structure doit rester assez souple pour recevoir un jour des **méga-parcours** traversant plusieurs
produits.

**Ce qui existait déjà pour lui.** Le ticket n'a rien eu à inventer sur le modèle : trois fichiers
du 18/08/2026 le nommaient et avaient tranché en sa faveur. `lib/db/schema.ts` posait qu'un persona
porte « un identifiant stable […] qu'un parcours, un use case ou une fonctionnalité pourra désigner
le jour où ces objets existeront, **sans reprise de données** » ; `persona_traits` existait pour que
« rattacher un use case à l'irritant qu'il adresse » ne l'impose pas non plus ; et `syncTraits`
faisait un **diff** plutôt qu'un remplacement, pour que l'identifiant d'un trait survive à une
correction. La promesse a été tenue : aucune ligne existante n'a bougé.

**Trois arbitrages rendus avant écriture.** (1) L'intitulé reste **« Use Cases »**, en anglais, avec
la clé d'URL `usecase` — écart assumé à « interface en français ». (2) Le rattachement d'un persona
est **facultatif** : le bloc est utilisable avant qu'un profil ait été décrit. (3) Deux use cases
entrent dans la fixture — mais **sans rattachement**, `scripts/seed.ts` ne semant aucun persona, ce
qui a été signalé avant d'écrire plutôt que découvert après.

**Le modèle — migration `0007`.** `use_cases` (titre, `summary` **`not null`** à la différence de
`personas.summary`, `archived_at`, cascade sur le produit) et `use_case_personas`, table de liaison
**sans `archived_at`** — donc une `LinkTable`, donc `unlink` disponible **à la compilation**.
**C'est la table de liaison qui porte la souplesse demandée** : un use case sert de zéro à plusieurs
profils et un profil traverse plusieurs scénarios, ce qu'une colonne aurait interdit. Le jour où un
use case devra désigner une fonctionnalité, un irritant précis ou une étape de méga-parcours, ce
sera **une table de plus**. Aucune n'est créée aujourd'hui — la leçon de T5.2, celle-là même que le
commentaire de `personas` invoquait, et qui a dû être récrit puisqu'il affirmait « aucune table de
liaison n'est créée aujourd'hui ».

**Aucune colonne de rang**, et c'est la même leçon : une colonne `position` sans geste qui l'écrive
est une colonne qu'on relit un jour sans savoir pourquoi. L'ordre est `created_at` puis `id`.

**Les lectures.** `listProductUseCases` fait **deux `list` et aucune jointure** — la forme de
`lib/queries/personas.ts` —, et rend `personaIds` **sans les noms** : la page a déjà lu ses personae
pour le bloc voisin, et le bloc les rapproche par `personasOf`. Aucun bloc n'ajoute une lecture par
objet, la discipline de la page depuis T5.5. Conséquence, assumée : **un persona archivé disparaît
des use cases qui le désignaient**, sans qu'une ligne de liaison ne bouge (règle 4).

**Deux clés d'URL, parce que ce sont deux droits** — la séparation que `persona` et `fiche`
tenaient déjà. `?usecase=nouveau|<id>` écrit, sous le droit dérivé des accompagnements ;
`?scenario=<id>` lit, par tout le domaine (D9). Le décompte d'exclusivité passe de sept à neuf clés
**sans qu'un caractère de sa logique change** — la propriété pour laquelle il avait été écrit en
décompte le 17/08/2026, vérifiée pour la troisième fois.

**Une porte de plus que le groupe persona, et c'est le cœur du ticket.** Les identifiants de
personae n'arrivent pas par une liaison côté serveur mais par le **formulaire** : ils sont saisis,
donc réécrivables. `attachablePersonas` les confronte aux personae **vivants du produit reçu**,
relus dans l'action, **avant la moindre écriture** — la règle de T3.6, faute de transaction : un
rattachement refusé ne doit pas laisser un use case à demi écrit.

**La ligne défilante n'est pas une variation de style.** Une grille grandit vers le bas, et douze
scénarios auraient repoussé les accompagnements hors de l'écran ; la ligne garde au bloc une hauteur
constante. Le défilement au clavier est acquis **sans attribut** — chaque carte est un lien, donc
la tabulation amène la suivante dans le champ. Un retrait négatif compense quatre pixels de marge
intérieure, sans quoi `overflow-x` non visible fait calculer `overflow-y` en `auto` et **rogne le
liseré de focus** de chaque carte.

**Les quatre disciplines.**

- **Le critère se lit dans le HTML servi.** Les cinq `<h2>` de bloc sortent dans l'ordre voulu —
  Vision produit, Personae, **Use Cases**, Accompagnements en cours, Tous les accompagnements —, les
  deux cartes de la fixture avec leur titre, leur description et le conteneur `overflow-x-auto`.
  **Sept adresses mesurées** : la fiche et les deux formes de saisie s'ouvrent (`role="dialog"`,
  titre attendu) ; deux clés ensemble n'ouvrent **rien** ; l'identifiant d'un produit passé en
  `?scenario=` et une valeur fantaisiste rendent la page nue en **200**, jamais un 404 ni un 500.
- **Les tests se mettent en défaut.** 14 tests de lecture, 18 de saisie, 12 d'action. Cinq
  neutralisations, chacune tombant sur ses seuls tests : le filtre de produit (3), le filtre de
  domaine de `list` (6, dont les deux lignes forgées), `attachablePersonas` (2), l'obligation de la
  description (3), la confrontation du use case à son produit (2). Suite complète : **821 tests**.
- **Le contraste se mesure.** Le relevé est un **constat de reprise, vérifié et non affirmé** :
  l'inventaire des jetons de couleur des trois composants neufs est **rigoureusement identique** à
  celui des trois composants de persona — `border-surface-neutral-lighter`,
  `text-content-neutral-{base,dark,darkest}`, `text-content-danger-dark` —, sur les mêmes fonds
  (`surface-neutral-pale` pour le bloc comme pour le tiroir). **Aucun couple de couleurs neuf par la
  position**, donc rien à mesurer que `ETAT.md` §c ne consigne déjà.
- **Le droit s'éprouve par l'action.** Six sondes **HTTP**, en `multipart/form-data` — l'encodage
  que le formulaire déclare, la leçon de TD.1 —, avec **étape témoin** : le responsable de domaine
  écrit (2 → 3 lignes), ce qui prouve que le harnais atteint l'action. Puis les refus, mesurés **en
  base et non sur le code de réponse**, tous à 200 : un membre non contributeur sur ce produit, le
  même avec le `productId` **lié réécrit** vers un produit dont il n'est contributeur de rien, un
  `personaIds` désignant le persona d'un autre produit, une description vide. Une septième sonde a
  **écrit**, et l'analyse a montré que le code avait raison et la sonde tort — voir
  `JOURNAL-TECHNIQUE.md`.

**Ce que le ticket ne fait pas** : aucune table de méga-parcours, aucune de fonctionnalité, aucun
lien vers les activités, aucune colonne de rang, aucun écran hors de la page produit.

---

## Hors ticket — la pastille de statut, seule forme du statut, 19/08/2026

**La demande.** Que tous les tags de statut — « En cours », « Terminé » — aient le style de ceux du
bloc « Accompagnements en cours » de la page produit.

**Le constat qui la justifie.** La page produit affichait `statusLabel` de **deux façons dans deux
blocs consécutifs** : pastille pleine teintée par la nature dans la frise
(`components/products/roadmap.tsx`), point de 8 px suivi du mot dans « Tous les accompagnements »
(`app/(app)/produits/[id]/page.tsx`). Le second dessin était repris à l'identique par trois autres
écrans — la liste transverse `/projets`, l'en-tête de la page projet, la fiche personne en panneau.
La pastille est la seule des deux formes que la maquette dessine
(`docs/design/maquettes/blocs/roadmap/Roadmap.dc.html:107`) et la seule dont les quatre contrastes
étaient consignés.

**Le périmètre, arbitré avec l'humain avant écriture.** Les statuts d'accompagnement **seuls**. Le
dépôt porte cinq autres grammaires de pastille — la puce `Tag` (approches, « Principal »,
compétences), le sens d'un indicateur, `AvailabilityDot`, les chips de filtre de `/produits`, les
badges de droit de `/dev/session`. Aucune ne bouge (règle 3). Deux autres arbitrages : `StatusDot`
**se retire** plutôt que de rester sans appelant, et l'extraction **reçoit sa clause `socleLock`**,
comme chacune de celles de TD.3 à TD.6.

**Le socle.** `components/ui/status-dot.tsx` → `components/ui/status-pill.tsx`. `DOT` et `StatusDot`
disparaissent ; `BAND_BG` ne bouge pas ; `STATUS_PILL` devient `PILL`, **non exporté** — une table
de couleurs exportée est une pastille qu'on récrit, et son seul consommateur est désormais le
composant qui la porte. `flex-none` passe de l'appelant au composant : c'est ce qui garde le HTML de
la frise identique, et il est inerte partout où le parent n'est pas un conteneur flex. Les deux
`Record` restent exhaustifs à la compilation, ce qui justifie l'`import type` que `uiLayerSeal`
autorise nommément.

**Les cinq appelants.** La frise passe à `<StatusPill>` sans autre changement. Les quatre autres
perdent le point médian `·` : il séparait deux suites de texte, il ne sépare plus rien entre une
pastille et une période, et la forme de référence ne l'a jamais porté. `/projets` garde son
`sr-only` « Statut : », posé **hors** de la pastille, et sa colonne garde `flex items-center` pour
que la pastille reste un élément flex — un `<span>` en ligne aurait rendu son `py-0.5` inopérant.

**La vérification, en quatre disciplines.** Le HTML servi a été relevé sur les quatre adresses,
`<script>` retirés (méthode de TD.3), **avant et après** par `git stash` : huit hunks, tous sur
l'élément de statut, et **le bloc de la frise absent du diff**. La clause a été mise en défaut par
quatre témoins — la chaîne recopiée tombe en littéral *et* en gabarit, les trois écritures voisines
qui ne sont pas des pastilles restent muettes — et le piège de TD.6 remesuré : les trois clauses de
TD.5 tombent toujours hors du socle. Les contrastes ont été recalculés et **aucun couple n'est neuf
par la position** : les quatre hôtes sont tous en `surface-neutral-pale`, le fond même de la frise.
Le droit n'était pas en cause : aucun point d'entrée, aucune action, aucun `can`.

**Le résultat.** `npm run lint` (`--max-warnings=0`), `npx tsc --noEmit` et les **821 tests** passent.

---

## Hors ticket — le bloc « Démarrage », 20/08/2026

**La demande.** La page d'un accompagnement raconte ce qui **a été fait** — roadmap, ressources,
indicateurs adoptés — et ne dit nulle part ce qu'on **peut** faire. Un designer qui ouvre un
accompagnement neuf n'a aucun point de départ : ni la liste des plateformes raccordées au domaine,
ni la moindre piste. Le bloc « Démarrage » pose une boîte à outils — « voici ce que tu peux
envisager » — et un accès direct à la plateforme, dans un nouvel onglet, pour que l'accompagnement
reste ouvert dans Vision.

**Quatre arbitrages rendus avant écriture**, tous par l'humain le 20/08/2026. (1) **Un référentiel
neuf, `starters`**, plutôt qu'une dérivation d'`activity_types.default_tool_id` ou de `tools` : la
demande réclame explicitement d'accueillir demain « d'autres outils, méthodes, ressources ou
recommandations », et ni un type d'activité ni un outil n'a de place pour une phrase de conseil ni
pour une piste sans plateforme. (2) **La même liste sur tous les accompagnements** — aucun filtrage
par approche, aucune marque « déjà engagée » : la seconde aurait été la jauge de complétion que
`docs/06` §10 proscrit. (3) **Des adresses provisoires** sur `tools.base_url`, faute que le brief en
donne. (4) **Carte plus panneau**, le motif de Personae et de Use Cases : la carte porte l'essentiel
et le lien, le panneau porte le texte long.

**Le modèle, migration `0008`.** Une table et un énuméré. `starters` porte un libellé, un `summary`
non nul — la phrase de la carte —, un `guidance` nullable — le texte long du panneau —, une nature
(`tool` · `method` · `resource`), un `tool_id` facultatif, un rang et un `archived_at`. **Ce qu'elle
ne porte pas est le plus argumenté** : ni `project_id` ni `product_id`, parce que c'est un
référentiel du domaine ; **aucune colonne d'URL propre**, l'adresse ayant une seule source,
`tools.base_url`, sans quoi deux sources pour un même lien divergeraient ; et **aucun
`activity_type_id`**, que personne ne lirait aujourd'hui — la leçon de T5.2, le geste « planifier
cette activité depuis une piste » n'étant pas demandé (règle 3). La `position`, elle, a son écrivain
— l'amorçage —, ce qui la distingue de la colonne de rang que le journal du 19/08 proscrit.

**La lecture.** `listStarters(scope)` ne prend **aucun identifiant** : c'est la première lecture du
dépôt dans ce cas, et c'est la traduction directe de l'arbitrage (2). Une seule requête en
`joinedRead`, `filter(starters)` dans le `where` et `filter(tools)` dans le `on` — la règle absolue
du fichier. Le `on` porte en plus `isNull(tools.archivedAt)`, et **c'est la règle « décrire ≠
proposer » qui le décide** : la roadmap *décrit* et nomme l'outil d'un résultat ancien, ce bloc
*propose* et ne renvoie pas vers une plateforme rangée. Une piste dont l'outil est archivé se lit
donc encore, sans lien — le texte de la piste reste vrai quand la plateforme ne l'est plus.

**Les écrans.** `components/projects/starters.tsx` est en première case de la grille, avant
« Ressources », et **c'est l'écart le plus visible du lot** : `docs/06` §5 donne une liste close de
blocs de référence ordonnée par fréquence de consultation, où « Démarrage » ne figure pas. La
roadmap garde sa position dominante — D31 tient sur l'essentiel —, c'est l'ordre interne des blocs
de référence qui cède, un point de départ qui se lirait en cinquième position n'en étant plus un.
`starter-detail.tsx` est le corps du panneau : composant **serveur**, en lecture seule, sur le
modèle d'`UseCaseDetail` — pas de `Panel`, dont le corps enveloppe ses `children` dans un `<form>`.

**Le bloc est le seul de la page à ne recevoir aucun droit, et le seul dont le point d'entrée ne
soit jamais nul.** Les six autres panneaux tombent avec `canWrite` ; celui-ci n'a rien à faire
tomber — une piste se lit par tout le domaine (D9), et son référentiel a son écran de gestion en C7
(D25). C'est aussi pourquoi il n'y a **qu'une clé d'URL** là où Personae et Use Cases en ont deux :
la paire « une clé pour lire, une clé pour écrire » n'a rien à séparer quand il n'y a pas d'écriture.
Le décompte d'exclusivité passe **de six à sept clés sans qu'un caractère change**, pour la
cinquième fois.

**La fixture reçoit trois écritures, toutes signalées d'avance.** Les adresses des outils sont
posées sur `example.com`, le domaine réservé à la documentation — la seule forme plausible dans sa
structure et prouvablement provisoire, incapable d'atteindre un tiers réel par accident. L'outil
« Audit d'accessibilité » est renommé **« Everyone »**, du nom de la plateforme, avec la conséquence
déjà documentée d'un rapprochement par clé naturelle. Et **quatre pistes** sont semées, dont la
quatrième — « Entretiens utilisateurs », une méthode sans outil ni texte long — est une invention
assumée qui paie deux fois : elle prouve que le référentiel accueille autre chose qu'un outil, et
elle est la seule ligne qui **rende visibles les deux états vides du panneau**.

**La vérification, en quatre disciplines.** Le HTML servi donne les sept `<h2>` dans l'ordre voulu —
`Roadmap`, puis `Démarrage`, puis `Ressources` —, quatre `<li>`, trois `<a target="_blank"
rel="noreferrer">` avec leur chevron et leur mention `sr-only`, et la quatrième ligne sans aucun lien
sortant. Cinq adresses mesurées : `?piste=<id>` ouvre le dialogue au bon titre — **l'étape témoin** —,
et un UUID inconnu, une valeur fantaisiste, un identifiant de projet et la conjonction
`?piste=…&ressource=nouvelle` rendent tous **la page nue en 200**, jamais un 404 ni un 500. La
troisième branche du panneau — un outil raccordé sans adresse — a été servie par **sonde scopée**,
la fixture ne l'atteignant pas, puis rétablie. Les **six filtres** de `listStarters` ont été
neutralisés un à un : chacun fait tomber exactement les tests attendus et rien d'autre, et le
départage par libellé a été mesuré **trois fois** parce qu'un ordre sans départage est arbitraire.
Les contrastes ont été recalculés : le plus bas couple de texte est à **4,98:1**, et les trois
couples non textuels sous 3:1 sont ceux, déjà consignés, qu'aucun jeton du design system ne relève.
Le droit, enfin, n'a **aucune action à éprouver** — ce qui s'énonce plutôt que de se sauter : le
bloc et le panneau ont été servis sous deux identités, un responsable de domaine et un membre sans
droit d'écriture ici, et **leur DOM est identique au caractère près**, alors que le reste de la page
diffère bien entre les deux.

**Le résultat.** `npm run lint` (`--max-warnings=0`), `npx tsc --noEmit`, `npm run build` et les
**882 tests** passent.


---

## La page d'un accompagnement passe à `project-v2` — hors ticket, le 20/08/2026

**Demande.** Reprendre la maquette `docs/design/maquettes/blocs/project-v2` — HTML et CSS bruts
produits par Claude Design — et la **transposer** dans la page projet : disposition, hiérarchie des
blocs, style visuel, composants neufs, et adaptation des composants existants au nouveau langage.
Pas s'en inspirer : la rendre, à fonctionnalités et à données constantes.

**Quatre arbitrages rendus avant écriture**, sur les quatre points où la maquette croisait une règle
non négociable ou une donnée existante. Ils sont détaillés dans `JOURNAL-TECHNIQUE.md` ; en un mot :
la **jauge North Star et l'écart chiffré sont refusés** (D39, la dérogation du 17/08 ne s'étend
pas) ; la **liste à plat filtrée l'emporte** sur les cinq groupes de `docs/03` §6 ; **quatre des cinq
gestes inventés** par la maquette disparaissent, « Voir le journal » restant dessiné sans lien ;
l'**équipe passe en pile d'avatars**, les noms restant lus.

**Cinq gestes de forme.**

1. **L'en-tête devient une carte.** Statut, période et rang sur une seule ligne — « En cours ·
   depuis février 2026 · 2ᵉ accompagnement de ce produit », le rang menant toujours à la page
   produit (`docs/06` §7). Le geste principal passe en **bouton primaire** (« Modifier »),
   « Archiver » descend sous un menu « … » : corriger l'identité d'un accompagnement est courant,
   le ranger ne l'est pas, et les deux étaient au même rang.
2. **Une barre d'ancres collante** (`components/projects/subnav.tsx`) annonce les quatre blocs qui
   portent un `id`. Sans entrée active, et la raison est consignée.
3. **Le corps passe à deux colonnes** — le récit à gauche, « Indicateurs adoptés » puis
   « Ressources » dans un rail de 380 px à droite, sous `xl` seulement. La roadmap garde sa
   position dominante (`docs/06` §5, D31) et les deux blocs chiffrés cessent d'exiger qu'on fasse
   défiler le récit entier.
4. **La roadmap devient une liste à plat**, précédée de pastilles de filtre à décompte. Chaque
   entrée porte son point coloré, sa `StatusPill` en toutes lettres, ses participants en pile
   d'avatars et sa période à droite.
5. **« Démarrage » passe en cartes** (deux colonnes), et les trois blocs annoncés en **trio d'une
   rangée**.

**Le filtre passe par l'URL, sans une ligne de JavaScript** — le patron de la frise produit, et non
le `onclick` de la maquette. `ROADMAP_STATE_PARAM` (`etat`) est la **huitième clé** de la page et la
première qui n'ouvre rien : elle n'entre ni dans `PROJECT_PANEL_PARAMS` ni dans le décompte
d'exclusivité, si bien que fermer un panneau ne défait pas le filtre et que poser un filtre ne ferme
aucun panneau. `closeHref` la reconduit, comme `/equipe` reconduit ses cinq filtres (T5bis.4).

**Une colonne de plus dans un `select` existant, et pas une requête de plus.**
`listProjectAdoptions` remonte `indicators.is_north_star` et trie `desc` dessus avant l'alphabet :
c'est ce qui met l'objectif du produit en tête du rail. **L'ordre reste entièrement en SQL** — la
discipline de `listProjectRoadmap`. Aucune migration.

**Aucune donnée perdue, et c'est le point qu'il fallait tenir.** La maquette montre deux valeurs
d'indicateur là où le bloc en portait quatre : « Référence » et « Valeur finale » restent, en `dl`
sous la grande valeur, faute de quoi elles n'auraient plus eu **aucun écran**. L'objectif,
l'approche, le résultat et le motif d'annulation restent sur l'entrée de roadmap. Les noms de
l'équipe et des participants restent, en texte de remplacement.

**Ce que la reprise referme.** Le point ouvert d'`ETAT.md` sur la cohabitation de `Section` et de
`Block` : la question y était posée comme **éditoriale** — « la page projet doit-elle monter au
format produit ? » —, et la maquette y répond. `Section` passe au rayon `2xl` et à `px-7 py-6`, et
les deux pages portent désormais des cartes de même rang. `Section` reste distincte de `Block` par
ce qu'elle est : une carte de contenu, non un chapitre.

**Vérification — quatre disciplines, toutes tenues.**

- **Le critère se lit dans le HTML servi.** Cinq pages de projet capturées, plus les quatre états du
  filtre. Les quatre `id` d'ancre sont là, la carte North Star sort avec son `★`, sa valeur en
  `text-3xl` et sa mention « Cible 85 % » — **sans barre ni phrase d'écart** —, la carte
  complémentaire avec son `Tag`, l'équipe avec ses cinq pastilles, son « 5 personnes » et son
  `sr-only` portant « Marc Tellier · côté entité ».
- **Les tests se mettent en défaut.** La propriété neuve — `etat` hors du décompte d'exclusivité —
  a été **mise en défaut avant d'être crue** : versée dans `keys`,
  `?etat=done&activite=nouvelle` cesse d'ouvrir le panneau ; le témoin retiré, il rouvre. Les 882
  tests des 29 fichiers passent, avant comme après.
- **Le contraste se mesure.** Onze couples neufs par la position, mesurés par un instrument calibré
  sur cinq valeurs déjà consignées au dépôt. **Dix passent, un échoue** —
  `content-neutral-normal` sur `surface-neutral-pale` à 3,88:1 — et il a été corrigé avant d'être
  servi. Les cinq couples de la carte North Star sur `surface-primary-lightest` : 8,21:1 · 17,21:1 ·
  7,82:1 · 15,14:1 · 4,79:1.
- **Le droit s'éprouve par l'action.** Cinq identités servies sur la même adresse : le responsable
  de domaine obtient « Modifier » et le menu d'en-tête, le contributeur désigné écrit dans les blocs
  **sans** menu d'en-tête — il ne modifie pas l'identité de l'accompagnement (D9) —, et trois
  lecteurs n'obtiennent **aucun** point d'entrée. Les pastilles de filtre restent pour tous : un
  filtre est une lecture, ouverte à tout le domaine. L'accompagnement archivé a été éprouvé par
  **témoin** — `archived` forcé à `true` : « Rétablir » paraît, les deux menus et les trois « + »
  tombent ensemble, la roadmap reste lisible.

**Sa leçon est dans le refus.** Une maquette faite hors du produit ne connaît pas ses interdits :
`project-v2` dessine, en toute bonne foi, la jauge de complétion et l'indice calculé que quatre
textes de Vision refusent nommément — et elle les dessine bien, ce qui est le vrai danger. Ce qui a
permis de trancher n'est pas d'avoir relu D39 : c'est que le calcul **existait déjà**, testé, sous
`targetGap` et `axisScale`, du travail du 17/08. La question posée n'était donc jamais « peut-on ? »
mais « étend-on la dérogation ? » — et posée ainsi, elle se répond.

---

## Le bouton, composant unique à trois rangs — hors ticket, le 21/08/2026

**La demande, et ce qu'elle rouvrait.** Changer la nature d'un bouton demandait de connaître et de
recomposer des chaînes de classes. La demande était de faire du bouton un composant à part entière,
avec ses variantes nommées et la possibilité d'y poser une icône à gauche, à droite, ou seule.

Elle rouvrait explicitement la doctrine du 18/08/2026 : **`@apply` et `@layer components` avaient
été écartés**. L'arbitrage a été rendu avant écriture, et il **maintient la décision** — pour une
raison neuve qui n'était pas celle du journal. La documentation de Tailwind déconseille elle-même
`@apply` pour abstraire un composant et dirige vers l'extraction d'un composant ; le standard
qu'ont formalisé `cva` et `tailwind-variants` est une **fonction de variantes** qui rend la chaîne,
plus un composant qui l'appelle. La demande — « ne plus avoir à connaître les classes » — est
satisfaite par cette forme, et le dépôt en avait déjà le précédent avec `borderOf()` de
`form-field.tsx`. Aucune ligne de CSS n'a été écrite ; `app/globals.css` et `app/tokens.css` ne
bougent pas.

**Ce que le socle porte désormais.** `buttonClass({ variant, iconOnly })` rend la chaîne pour
**toute** balise ; `Button` couvre les `<button>` et place l'icône ; `ButtonIcon` est le glyphe que
les balises composant leurs propres enfants appellent à la main. `BUTTON_PRIMARY` et
`BUTTON_SECONDARY` disparaissent — une constante par combinaison en aurait fait six.

**Le critère de choix est celui d'`action-link.ts`, retourné d'un cran.** Il disait « un composant
quand l'élément rendu est fixe, une constante quand c'est la balise qui varie » ; il devient « une
**fonction** quand la balise varie **et** que la mise en forme a des paramètres ». Treize points
d'appel de l'application portent un bouton sur un `<Link>`, un `<DrawerLink>` ou un `<a>` — dont le
skip-link. Aucun `as`, aucun `render` : la polymorphie reste ce que ce dépôt refuse.

**Les trois rangs ont le même gabarit, et c'est le point.** Chacun porte un `border` d'un pixel,
transparent pour le primaire et le tertiaire, si bien qu'un rang se substitue à un autre **sans
qu'un pixel de mise en page bouge**. C'est ce que la maquette dessine déjà
(`fiche-accompagnement.css:90`, `border: 1px solid transparent`).

**Trois écritures rentrent au socle par disparition.**

- **Les trois coquilles à deux attributs** — `AddActivity`, `LinkResource`, `AdoptIndicator` —
  portaient la forme et recevaient la couleur de leurs six points de montage. Elles passent à
  `variant`, et **le point ouvert d'`ETAT.md` se referme comme il le prescrivait lui-même** : par
  disparition, la règle ne pouvant pas voir deux attributs à la fois.
- **Les deux boutons icône seule** — le kebab d'`action-menu.tsx` et la croix de `drawer.tsx` —
  avaient le même calibre de 32 px et deux écritures différentes. Ils passent tous deux à
  `buttonClass({ variant: "secondary", iconOnly: true })`.
- **`disabled:opacity-60`**, recopié aux quatre pieds de formulaire, entre dans les trois chaînes de
  variante : un état qui dépend du rang n'a rien à faire chez celui qui pose le rang.

**Le garde-fou suit.** Les deux clauses bouton de `socleLock` nommaient `BUTTON_PRIMARY` et
`BUTTON_SECONDARY`, qui n'existent plus — un message qui nomme un export mort est un défaut. Elles
désignent `buttonClass`, et **une clause de plus** garde la forme des coquilles supprimées, celle
qui ne nomme aucune couleur et n'avait donc aucun gardien.

**Vérification — quatre disciplines, toutes tenues.**

- **Le critère se lit dans le HTML servi.** Onze adresses capturées avant et après par `git stash`,
  `<script>` retirés (leçon de TD.3), la base immobile entre les deux mesures (leçon de TD.1).
  **Trente-quatre balises bougent, et pas une de plus** : dépouillées de leur attribut `class`,
  elles sont **strictement identiques** des deux côtés — zéro ligne de différence. **Six écritures
  distinctes en amont deviennent quatre en aval**, ce qui est la mesure même du regroupement. La
  croix du tiroir a été mesurée à part, sur `?archiver=confirmation` : même résultat.
- **La règle se met en défaut avant d'être crue.** Un `rounded-xl` témoin dans `BASE` fait bouger
  **les onze captures**, sur exactement les trente-quatre mêmes balises — chaque écran porte au
  moins le skip-link. La clause ESLint neuve tombe sur une réécriture témoin de la coquille
  supprimée, **sur un nœud et un seul**, et le lint redevient vert au rétablissement. Le typage se
  met en défaut aussi : les quatre formes légitimes de `Button` compilent, et un bouton icône seule
  sans `label` produit **une** erreur.
- **Le contraste se mesure.** Sept couples, dont quatre neufs par la position — les trois survols et
  le fond du secondaire. Aucun texte sous 4,5:1 (le plus bas est à 6,52:1), aucun filet sous 3:1
  (3,88:1). La table est dans l'en-tête de `components/ui/button.tsx`.
- **Le droit ne bouge pas.** Aucune action serveur, aucune requête, aucun droit n'entre au
  périmètre : **882 tests, 29 fichiers, verts et non modifiés**.

**Sa leçon est dans l'instrument, et elle a failli coûter la mesure.** Le premier comptage des
balises modifiées donnait **deux lignes par adresse**, chiffre rassurant et faux : il venait d'un
`tr '>' '>\n'` — et `tr` mappe caractère à caractère, si bien qu'un ensemble d'arrivée plus long est
tronqué. La commande valait `tr '>' '>'`, c'est-à-dire rien du tout, et le diff portait sur le HTML
d'une seule ligne. **Un instrument qui rend un résultat plausible n'est pas pour autant calibré** :
c'est le témoin `rounded-xl` qui l'a redressé, en montrant que les onze adresses bougeaient là où le
comptage n'en voyait presque rien.

---

## Administration — le référentiel des entités — hors ticket, le 21/08/2026

**La demande.** « Il faudrait pouvoir gérer (supprimer / ajouter / modifier) les entités, qu'on voit
notamment sur la page des produits. »

**Ce qui manquait, et depuis quand.** `entities` existe depuis T1.2 et n'a **jamais reçu une seule
écriture applicative** : `scripts/seed.ts` la pose, et plus rien ne la touche. Elle est pourtant
lue partout — colonne et filtre de `/produits`, `select` des deux formulaires de produit, colonne
de la liste transverse des projets. Renommer une division de l'entreprise, en ajouter une après une
réorganisation ou ranger une ligne créée en double demandait une session psql.

C'est l'écran promis par **D25** et l'entrée **Administration** de `docs/06` §8, absente de
`MAIN_NAV` depuis T1.6 faute du droit de lire la session. Le ticket **avance C7 sur un seul
référentiel** ; les six autres portent des colonnes propres — `family`, `nature`, `rank`,
`produces_result` — donc d'autres formulaires, et restent à découper.

### Les trois arbitrages, rendus avant écriture

**(a) « Supprimer » existe, et c'est un écart à la règle 4** — arbitré par l'humain, seul à écrire
`CLAUDE.md`, et consigné au journal technique. Il est borné à une ligne de référentiel que **rien**
ne référence : ce n'est pas la donnée métier que la règle protège, c'est un doublon d'amorçage.
L'archivage reste le geste normal.

**(b) L'archivage se refuse tant qu'un produit vivant porte l'entité**, avec le décompte dans le
message — l'arbitrage (e) de C4bis transposé. Sans lui, le filtre disparaîtrait de `/produits` en y
laissant ses produits.

**(c) Aucun droit neuf.** `manageDomain` seul ; `SessionRights` garde ses quatre membres, comme
l'arbitrage (c) de C5bis l'exige.

### Ce qui a été écrit

**Neuf fichiers créés.** `lib/forms/entity.ts` et son test (un champ, `sameEntityLabel` en prime) ;
`lib/queries/entities.ts` et son test (`listEntitiesForAdmin`, `listEntityLabels`) ;
`app/(app)/administration/` — la page, les cinq actions, leur test, le point d'entrée des panneaux ;
`lib/drawers/admin.tsx` ; `components/admin/entity-panel.tsx`.

**Six fichiers modifiés.** `lib/db/scoped.ts` reçoit `deleteRow` et le type `DeletableTable` ;
`lib/drawers/types.ts` son quatrième jumeau ; `lib/navigation.ts` la route, trois clés et
`mainNavFor` ; `components/shell/main-nav.tsx` et `app/(app)/layout.tsx` l'entrée conditionnelle ;
`lib/format.ts` reçoit `formatProducts`. **Aucune migration** : `entities` avait déjà tout.

**Cinq gestes, et leurs conditions.** Ajouter et corriger sous `manageDomain` ; archiver si aucun
produit **vivant** ; rétablir sans confirmation (la forme de `restoreProduct`) ; supprimer si
**aucun** produit, archivés compris. La colonne « Produits » porte les deux décomptes — « 1 produit
· 2 archivés » — parce que ce sont deux règles distinctes, et qu'une entité dont tous les produits
sont rangés est archivable sans être supprimable.

### Trois choses valent d'être retenues

**Le piège du jour est dans un `catch`.** Le premier `deleteRow` attrapait `23503` — la violation de
clé étrangère ordinaire — et laissait tout passer : une clé déclarée **`restrict`** est tenue par un
déclencheur distinct, qui rend **`23001`**. Le code n'était pas non plus là où on le cherchait :
Drizzle enveloppe l'erreur du pilote dans un `DrizzleQueryError` sans `code`, et il faut descendre
la chaîne des `cause`. **Un `catch` sur un code d'erreur est du code qui ne s'exécute jamais en
développement normal, et dont la fausseté ne se voit qu'au test qui le provoque.**

**Le décompte parle, la base décide.** La démonstration est dans la mise en défaut : décompte total
neutralisé, les deux tests de refus tombent sur le **message** et non sur la donnée — la clé
étrangère a pris le relais, les entités sont intactes. Une garde qui ne vit que dans l'appelant est
une garde qu'un prochain appelant oubliera.

**Le rejeu forgé est ce qui prouve la porte.** Le champ `$ACTION_1:1` servi portait
`["<entité libre>",{}]` ; réécrit vers une entité chargée, Next l'a accepté et l'action a refusé sur
ce qu'elle avait **reçu** — « 3 produits portent encore cette entité ». Les identifiants liés
rangent hors de la saisie ; ils ne protègent pas.

### Les quatre disciplines

- **Le critère se lit dans le HTML servi.** 200 au responsable, **404** au membre ; l'entrée de
  navigation présente pour l'un et absente pour l'autre dans le HTML de `/produits` ; les six
  adresses de panneau ouvrant chacune un `role="dialog"`, une valeur inconnue n'en ouvrant aucun, et
  **deux clés ensemble n'ouvrant rien**. Une entité archivée se lit « Archivée en août 2026 » et
  quitte le `select` du formulaire de produit.
- **Le droit s'éprouve par l'action.** `createEntity` et `deleteEntity` capturées puis rejouées en
  `multipart/form-data` sous le cookie d'un membre : refus, base immobile — **avec étape témoin**
  sous le responsable dans les deux cas, sans laquelle « rien n'a bougé » ne prouverait rien.
- **Les tests se mettent en défaut.** Neuf neutralisations, chacune faisant tomber ce qu'elle
  devait. La porte partagée en fait tomber six et non quatre : les deux surnuméraires tombent parce
  que la neutralisation a **laissé un membre écrire** sur une fixture partagée — corroboration, et
  non bruit.
- **Le contraste se mesure.** Quatre couples sur `surface-neutral-pale`, de 4,98:1 à 17,87:1. Aucun
  n'est neuf par la position ; mesurés quand même.

**960 tests, 33 fichiers, verts.** `lint --max-warnings=0` et `tsc --noEmit` sans une ligne.

---

## T5bis.7 — La sélection d'équipe du formulaire de projet, refondue — 25/08/2026

**Le dernier ticket de C5bis**, et celui qui fait cesser un doublon vieux de T2.6 : le formulaire
d'accompagnement **doublait** le référentiel des personnes au lieu d'y puiser. Il portait un bloc
« Ajouter une personne » qui écrivait dans `persons` — une par enregistrement, sans métier, sans
disponibilité, sans compétence — et une liste d'équipe qui ne disait que des noms.

### Ce que le ticket a fait

**La ligne d'équipe porte désormais le métier et la disponibilité**, à côté du nom et de la mention
« côté entité » déjà présente. Deux valeurs **reportées** du référentiel, jamais un tri, jamais un
décompte, jamais un rapprochement avec les métiers déclarés du projet : D44 pose que les deux peuvent
diverger, et un écran qui signalerait l'écart rouvrirait la décision. Aucun niveau de compétence
n'entre dans le formulaire — choisir une équipe n'est pas comparer des personnes.

**Le bloc « Ajouter une personne » disparaît** (arbitrage (g) de C5bis). Cinq noms partent avec lui :
`newPersonName`, `newPersonKind`, `newPersonRole`, `NewPersonInput` et `addManualPerson`. À leur
place, un lien `ACTION_LINK_SM` vers `/equipe?profil=nouveau`, qui ouvre le panneau de création au
rendu serveur, sous le même droit `manageDomain` que ce formulaire.

`syncMembers`, `project_members` et le contrat d'équipe n'ont pas changé d'une ligne. Aucune
migration.

### Quatre arbitrages rendus avant écriture

**(1) `jobs` est lu deux fois, et c'est la seule forme qui tienne.** La lecture proposée aux cases à
cocher porte l'exception nominative de T4bis.1 : elle écarte les métiers archivés, sauf ceux que le
projet édité porte déjà. Y prendre le **libellé** du métier d'une personne aurait fait dépendre
l'affichage d'un profil du projet qu'on est en train de modifier — le même écran, deux rendus. La
seconde lecture est `includeArchived: true` et ne propose rien : c'est **exactement** le précédent
des entités, écrit dans le docblock de cette fonction depuis T2.6. Sept lectures scopées, toujours
aucune jointure.

**(2) Les deux exports devenus morts sont retirés.** `PERSON_KIND_LABEL` et `isPersonKind` n'avaient
plus d'appelant ; le type `PersonKind` reste, `lib/queries/activities.ts` l'importe pour ses
participants. Effet voulu : il ne reste qu'un `PERSON_KIND_LABEL` dans le dépôt, et le point ouvert
des deux exemplaires divergents se referme **sans qu'un arbitrage éditorial ait à être rendu**.

**(3) Le lien pointe le panneau, pas la page.** `ROUTES.teamPersonNew` plutôt que `ROUTES.team` : le
geste demandé est « créer une personne », et l'adresse qui le porte existe depuis T5bis.6. Elle quitte
la page et perd la saisie en cours — comme le fait déjà le « Créer un produit » de l'état vide, et
c'est consigné plutôt que corrigé par un `target="_blank"` que le dépôt réserve aux outils externes.

**(4) Le nom accessible du `select` ne change pas.** Le `<label>` garde le nom seul ; le métier et la
disponibilité sont un rang frère, relié par `aria-describedby`. Un `<label>` qui les aurait avalés
ferait annoncer un profil entier là où l'on demande « quel rôle pour cette personne ? ».
`AvailabilityDot` est réemployé tel quel — il rend la pastille **et** le mot.

### Ce qui vaut d'être retenu

**Une non-lecture vaut mieux qu'un refus.** Le critère du ticket demandait qu'un POST forgé portant
encore `newPersonName` ne crée aucune personne. Il n'y a pas de garde qui le refuse : `readProjectForm`
ne lit plus ce champ, `ProjectFormValues` n'a plus de clé où le mettre, `ProjectInput` est passé de
cinq clés à quatre. Un refus se raisonne, se contourne et se teste ; **une clé qui n'existe pas n'a
nulle part où aller**. Le cas de test qui le prouve est celui de la liste exhaustive des clés, où les
trois champs retirés sont désormais postés en champs forgés.

**Un test de libellé archivé ne mord que sur le bon `keep`.** Le premier jet éprouvait la septième
lecture avec le `keep` complet de la fixture — qui garde le métier **et** la personne. Les deux
façons d'écrire la carte des libellés y rendaient le même résultat, et la mise en défaut ne tombait
pas. Le seul appel qui distingue est celui qui rappelle **la personne sans son métier**.

### Les quatre disciplines

- **Le critère se lit dans le HTML servi.** `/projets/nouveau` et `/projets/<id>/modifier`,
  `<script>` retirés : **zéro** occurrence de `newPerson` (dans le DOM comme dans la charge RSC), le
  lien `profil=nouveau` présent une fois, et les dix lignes d'équipe portant chacune son métier et,
  pour une personne du centre, le mot entier de sa disponibilité. Les deux intervenants côté entité
  portent « · côté entité », « Métier non renseigné » et **aucune** disponibilité. Le `<label>` nomme
  le `select` du seul nom, l'`aria-describedby` pointe le rang du profil, la pastille est
  `aria-hidden`.
- **Le droit s'éprouve par l'action.** POST forgé en `multipart/form-data` sur `createProject`, les
  quatre champs `$ACTION_*` recopiés du balisage — `$ACTION_REF_1` **posté vide**, faute de quoi Next
  rend un 500 « Failed to find Server Action » qu'on prendrait pour un refus (T4.4, T5.3, T5bis.6).
  **Étape témoin d'abord** : une soumission sans les champs forgés rend 303 et crée l'accompagnement.
  Puis la forgée, avec `newPersonName`, `newPersonKind`, `newPersonRole` : 303 elle aussi, et
  **`persons` immobile à 13** — `projects` passe de 11 à 12. Les deux accompagnements de sonde ont
  été archivés, et la liaison posée pour servir la branche « personne archivée déjà portée » retirée.
- **Les tests se mettent en défaut.** Quatre neutralisations, chacune sur ce qu'elle devait :
  la carte des libellés pointée sur `jobRows` fait tomber le seul cas du métier archivé ;
  `availability: null` en dur fait tomber le seul cas de la personne du centre ; `newPersonName`
  relu dans `readProjectForm` fait tomber les deux cas qui portent sur les clés lues, et eux seuls ;
  une cinquième clé rendue à `ProjectInput` fait tomber le seul cas de `parseProjectForm`.
- **Le contraste se mesure.** Deux couples de texte sur `surface-neutral-pale`, le fond exact du bloc
  d'équipe : `content-neutral-base` **4,98:1**, `content-neutral-dark` **8,12:1**. Les trois couleurs
  de pastille d'`AvailabilityDot` sont déjà mesurées **sur ce même fond** depuis T5bis.2 — aucun
  couple n'est neuf par la position, aucun jeton n'est ajouté, aucun septième substitut n'est inventé.

**959 tests, 33 fichiers, verts.** `lint --max-warnings=0` et `tsc --noEmit` sans une ligne. Le
décompte perd un test et c'est voulu : quatre cas retirés avec le bloc d'ajout, trois cas neufs sur
le métier et la disponibilité.

---

## T6.1 — Le journal : la couche d'écriture, et les gestes du projet — 26/08/2026

**Ce que le ticket pose.** `record()` devient la seizième entrée de `forDomain` — `insert(events, …)`
avec `actor_id` posé depuis le contexte, sans une précondition neuve : les quatre clés étrangères
d'`events` étaient déjà dérivées par `parentChecksOf`. `lib/journal.ts` (neuf) compose les phrases,
pur et testé. Cinq points d'appel dans `app/(app)/projets/actions.ts`. Rien de visible, comme T1.2.

**Deux formes de phrase, pas cinq.** `objectPhrase(kind, deed, label)` porte les quatre gestes du
projet, `teamPhrase(moves)` la composition d'équipe. Le participe s'accorde sur une table qui donne
le nom français et son genre, et **les deux genres ont un appelant dans ce ticket** — « Accompagnement
créé », « Équipe modifiée ». La phrase d'équipe est **conjuguée, jamais accordée** : `persons` ne
porte aucun genre, et « ajoutée » comme « ajouté » misgenderait une personne sur deux. Les noms se
groupent par mouvement — « Camille Roux et Rudy Zourane rejoignent l'équipe » —, jamais une clause par
personne.

**Quatre arbitrages d'écriture.** `target_id` nul sur la ligne d'équipe (un diff de plusieurs
personnes n'a pas de cible unique) ; `product_id` nul sur les cinq gestes (le produit se joint depuis
le projet, et D20 le rend mouvant) ; le nom figé d'`updateProject` est celui **d'après** le geste (le
précédent serait une « valeur avant », que D22 refuse) ; `createProject` n'écrit qu'une ligne, équipe
comprise.

### Les quatre disciplines

- **Le critère se compte en base** — l'écran ne porte rien. Les cinq gestes frappés sur le **vrai
  point d'entrée HTTP** du serveur de développement, décompte avant et après :
  `created`/`project`/cible = le projet créé · `updated`/`project` · `linked`/`member`/cible **nulle**,
  phrase « Équipe modifiée : Awa Diallo rejoint l'équipe ; Yanis Bertin la quitte ; Sofia Marchand
  change de rôle » — **une ligne pour trois mouvements** · `archived`/`project` · `updated`/`project`
  portant « Accompagnement rétabli ». `product_id` nul partout, acteur juste partout. **Aucune ligne
  de sonde ne reste** : le projet créé effacé, l'équipe rendue à ses quatre contributeurs, le journal
  ramené à zéro.
- **Le droit s'éprouve par l'action.** Trois frappes par geste — témoin négatif, forge, témoin
  positif. Le forgé sous une identité sans `manageDomain` n'écrit **ni le projet ni l'événement**, à
  chaque fois. **Et le code HTTP ne le dit jamais** : `archiveProject` rend **200** au membre refusé
  comme au responsable qui archive. Le rétablissement, frappé en `text/plain` selon la règle, rend
  **404 en urlencodé avec le bon identifiant** — soit exactement ce que rend un identifiant inconnu.
- **Les tests se mettent en défaut.** Quatre neutralisations, chacune sur ce qu'elle devait :
  `record` court-circuitant `insert` fait tomber les **trois** cas d'étanchéité, et eux seuls ;
  retirer le `.references()` d'`events.projectId` en fait tomber **un** (la variante de T5bis.1, qui
  ne casse pas la compilation) ; le `null` de `teamPhrase` retiré fait tomber le seul cas pur ; la
  garde d'`updateProject` retirée fait tomber les deux cas où l'équipe ne bouge pas. **La troisième a
  corrigé le code** : elle a montré que la règle vivait à deux endroits, contre ce qu'un commentaire
  affirmait.
- **Le contraste ne se mesure pas** : ce ticket ne rend aucun pixel.

**986 tests, 35 fichiers, verts.** `lint --max-warnings=0` et `tsc --noEmit` sans une ligne. **+27
tests** : 11 pour `lib/journal.ts`, 10 pour les cinq gestes, 6 pour `record` dans la couche.

**Le commentaire faux de `scoped.ts` refermé, autrement que prévu.** Il disait « les 22 », la fiche
annonçait 25, **elles sont 30**. Le compte a été **retiré** plutôt que corrigé une troisième fois.

---

## T6.3 — Le bloc « Journal » sur la page projet — 27/08/2026

**Ce que le ticket ouvre.** La première lecture d'`events`. La table est au schéma depuis T1.2, T6.1
et T6.2 lui ont donné ses quatorze points d'écriture, et **personne ne la lisait**.
`listProjectJournal(scope, projectId)` par `joinedRead` : les événements du projet, du plus récent au
plus ancien, le nom de l'acteur joint sur `persons`. Le bloc est un `<details>` **fermé**, en dernier
de la colonne de gauche — `docs/06` §5 : *une information de contrôle, pas de compréhension.*

**Le point ouvert se referme exactement là où il avait été posé.** « Voir le journal » était dessiné
depuis le 20/08/2026 **sans être un lien** — un `<span>` dans un `<p>`, ni focalisable ni annoncé,
portant « — à venir » en `sr-only`. Il est devenu le `<summary>` du bloc. L'affordance qui ne
répondait pas répond, et `pending` disparaît de `REFERENCE_BLOCKS` avec son seul appelant : une
capacité sans appelant est celle que le ticket suivant emploierait de travers.

**Quatre arbitrages tranchés avant écriture.** (1) La date se lit **au jour, en UTC** — seconde
entorse bornée au mois de D13, de la même nature que celle de `formatDay` : un événement est un fait
daté ponctuel, et le mois retirerait au bloc sa raison d'être. (2) Le formatage vit dans
`lib/format.ts`, qui **referme au passage la dette de l'insécable** écrit en caractère depuis T4.3 ;
`PERSON_KIND_LABEL` reste ouvert, un vocabulaire restant à trancher. (3) `SectionHeader` apprend `as`
et `mark`, comme `BlockDivider` le 18/08 — plutôt que de recopier dans `components/projects/` une
signature de socle qu'**aucun motif de `socleLock` ne rattrape**. (4) La rangée des blocs annoncés
perd sa grille : une carte dans une grille de deux laisserait une moitié de vide, ce que le tour
précédent refusait déjà pour deux cartes dans une grille de trois.

**Ce que la lecture ne rend pas, et c'est délibéré.** Ni `verb`, ni `target_type`, ni `target_id` :
la phrase figée les dit déjà, et les interdits de la fiche écartent tout lien vers l'objet touché —
la page n'affiche plus l'activité archivée ni la ressource retirée dont une ligne peut parler. Les
rendre aurait posé trois colonnes sans lecteur, celles que T5.2 a refusées dans `starters`. **Aucun
décompte non plus**, ni sur le `<summary>` ni ailleurs : c'est l'écart assumé avec « Indicateurs
associés », qui en porte un — compter les événements d'un projet serait une mesure d'activité par
projet, que `docs/06` §10 refuse.

**Deux mises en défaut ont corrigé les tests, pas le code.** La première neutralisation —
`filter(events)` retiré — **n'a fait tomber aucun test** : la ligne forgée censée l'éprouver portait
*aussi* le projet de l'autre domaine, si bien qu'`eq(events.projectId, …)` l'écartait avant que le
filtre de domaine ait à la voir. C'est la leçon de T5bis.3 resservie — *un filtre qu'aucune ligne
forgée ne vise n'est pas éprouvé*. Réécrite pour ne franchir la frontière que sur `domain_id`, elle
tombe seule. La troisième — `eq(events.projectId, …)` retiré — faisait tomber **deux** tests :
l'état vide se lisait sur un projet de `b`, un domaine qui porte une ligne forgée. Un **troisième
domaine sans aucun événement** l'a rendue isolée. Sans ces deux corrections, deux des trois
étanchéités étaient des tests qui ne mesuraient pas ce qu'ils annonçaient.

**Le HTML servi, mesuré.** Le journal démarre vide sur les **cinq** projets de la fixture — vérifié
un par un, c'est le premier rendu de tous. La sonde a donc archivé puis rétabli un accompagnement par
le **vrai point d'entrée HTTP**, en rejouant le formulaire servi en multipart : le chemin sans
JavaScript. Elle a rendu, dans l'ordre, le bloc en dernier après « Budget », un `<details>` **sans
`open`** dont les deux entrées sont **dans le document**, l'ordre du plus récent au plus ancien, le
nom de l'acteur joint, et le journal d'un projet **archivé** — la lecture est ouverte à tout le
domaine (D9). Sous une identité **sans aucun droit d'écriture**, les deux entrées se lisent à
l'identique et aucun geste n'apparaît. La donnée métier est revenue exactement où elle était :
bandeau d'archivage parti, « Modifier » revenu.

**L'étape témoin a fait son travail.** La même action de rétablissement, frappée en **urlencodé**,
rend **200 et 68 209 octets** — la page entière — et **n'écrit rien** : le projet est resté archivé.
Sans ce témoin, le 200 du multipart qui a réussi et le 200 de l'urlencodé qui n'a rien fait auraient
été indiscernables.

**Contraste mesuré, pas affirmé.** Les trois jetons du bloc sur `surface-neutral-pale` :
`content-neutral-darkest` **17,87:1**, `content-neutral-dark` **8,12:1**, `content-neutral-base`
**4,98:1**. Aucun couple neuf par la position, et les deux derniers retrouvent au centième les
valeurs que le dépôt annonçait déjà — ce qui vaut contrôle de la méthode.

**Le droit ne s'éprouve pas par l'action ici, et c'est dit plutôt que simulé.** T6.3 n'ajoute aucune
action serveur ni aucun point d'entrée HTTP : il n'y a rien à frapper. Ce que le ticket devait tenir
— le bloc se lit sans droit d'écriture, et sur un accompagnement archivé — se lit dans le HTML servi.

**+11 tests, 1028 verts** (8 sur `listProjectJournal`, 3 sur `formatEventDay`). `npm run lint`
(`--max-warnings=0`), `npm run test` et `tsc` au vert.

---

## T6.2 — Le journal : activités, ressources, résultats, relevés — 26/08/2026

**Ce que le ticket branche.** Les quatre `event_target_type` restants — `activity`, `resource`,
`result`, `indicator_reading` — et le journal cesse d'être partiel. **Quatorze points d'appel**, là où
la fiche en annonçait treize : cinq sur l'activité, trois sur la ressource, trois sur le résultat,
trois sur le relevé. Aucun mécanisme neuf, aucune migration, aucun écran, aucune lecture.

**Six noms et une troisième forme de phrase.** `JournalKind` passe de deux à six, chaque nom arrivant
avec le geste qui l'écrit — « Activité », « Ressource » (féminins), « Résultat », « Relevé »
(masculins) : les deux genres ont un appelant parmi les quatre neufs, comme T6.1 l'avait établi sur
deux. `statePhrase(state, label, reason?)` porte les deux gestes de cycle de vie sous le **gabarit
d'`objectPhrase`**, l'état à la place du participe : « Activité en cours : Audit UX », « Activité
terminée : Audit UX », « Activité annulée : Audit UX — Reporté à 2027 ». `JournalState` est un
`Extract` sur les trois états **réellement atteignables** : jamais `planned`, que rien ne fait
atteindre.

**Quatre arbitrages tranchés avant écriture.** Le libellé figé d'une activité est celui de son
**type**, seul (une activité n'a pas de nom ; la période aurait figé une valeur, que D22 refuse) ; la
phrase d'état reprend le gabarit existant plutôt qu'une formulation littérale plus lourde ;
`updateActivity` journalise dès que **la ligne ou les participants** ont bougé — la condition qui
décidait déjà de `refresh` —, pour qu'un participant ajouté ne reste pas sans trace ; et trois des
cinq états vides jamais rendus se joignent à ce ticket, ceux que les relevés atteignent.

**Une seule lecture ajoutée au fichier.** `checkReferences` lisait déjà la ligne du type et la
jetait : elle la rend, et les deux gestes de formulaire ne relisent rien. `openActivity` ajoute un
`find` — la seule lecture neuve —, après ses trois refus : on ne lit un libellé qu'une fois établi
qu'on a le droit d'y toucher.

**Le seul cas du dépôt où un événement n'a pas de projet.** Les trois gestes du relevé posent
`product_id` et laissent `project_id` **nul**, ce que `docs/04` §4 prévoit. Conséquence voulue et
écrite dans le code : un relevé n'apparaît pas dans la frise de la page projet (T6.3), il apparaît
dans le flux global (T6.6). **Aucun écran ne dira jamais cette propriété** — seul le décompte en base
la porte, et c'est un test.

### Les quatre disciplines

- **Le critère se compte en base**, geste par geste, sur la vraie base et les vraies portes : une
  ligne et une seule, le bon verbe, le bon `target_type`, le bon `target_id`, l'acteur, la phrase au
  caractère près — insécable compris, éprouvé sur son point de code.
- **Le droit s'éprouve par l'action.** Quatre gestes frappés sur le **vrai point d'entrée HTTP** du
  serveur de développement, chacun encadré de son étape témoin. `createReading` forgé sous une
  identité sans droit rend **200** et 280 octets, le même sous le responsable **200** et 65 222 ;
  `archiveReading` et `transitionActivity` forgés rendent **200** et **78 octets** — et la même charge
  de 78 octets sort d'une transition légitime **déjà faite**, qui n'est pas un refus. Trois
  situations, un seul code : seul le décompte en base les sépare. **Aucune ligne de sonde ne reste** —
  activité et relevé de sonde effacés, cinq relevés rétablis, journal ramené à zéro.
- **Les tests se mettent en défaut.** Trois neutralisations, trois chutes isolées : retirer le
  `record` de `transitionActivity` fait tomber son seul cas ; forcer le journal d'`updateActivity`
  fait tomber le seul cas « re-soumission à l'identique » ; retirer le `productId` de `createReading`
  fait tomber le seul cas « `project_id` nul, `product_id` posé ».
- **Le contraste ne se mesure pas** : ce ticket ne rend aucun pixel.

**1017 tests, 35 fichiers, verts.** `lint --max-warnings=0` et `tsc --noEmit` sans une ligne. **+31
tests** : 8 pour `lib/journal.ts`, 17 pour les onze gestes de la page projet, 6 pour les trois du
relevé.

**Trois états vides lus pour la première fois**, en archivant les cinq relevés du domaine par la
couche scopée — jamais par l'action, qui aurait écrit des lignes à retirer ensuite —, puis en
rétablissant : « Aucun relevé pour l'instant : cette mesure n'est pas encore située dans le temps »,
« Aucun relevé », « Aucun relevé pour l'instant. Un indicateur sans relevé n'est pas situé sur l'axe
du temps. » Les deux autres repartent vers T6.6.

**Deux comptes faux relevés, un seul corrigeable.** La fiche annonçait treize points d'appel pour
quatorze — quatrième chiffre de la même famille que « les 22 » de `scoped.ts` et « les 26 » de
`schema.ts`. Et le point ouvert sur `if (!f?.domainId) return` annonçait trois fichiers pour quatre,
en affirmant qu'un cinquième était corrigé alors qu'il ne l'était pas. **Une correction consignée
n'est pas une correction faite.**

---

## T6.4 — Les liens déduits, et le retour du bloc « Projets liés » — 27/08/2026

**Ce que le ticket ouvre.** Un projet ne disait pas ses voisins, alors que quatre règles de
rapprochement sont écrites depuis `docs/04` §5 et que le rattachement obligatoire à un produit
garantit qu'aucun accompagnement n'est isolé. `listRelatedProjects(scope, projectId)` par
`joinedRead` les branche toutes les quatre : même produit, personnes en commun (≥ 2), même entité,
approches communes. **Rien n'est stocké** — ce sont des requêtes exécutées à l'affichage, ce qui
garantit qu'elles sont toujours vraies.

**Un projet n'apparaît qu'une fois, sous sa règle la plus forte.** La force ordonne la liste, elle
ne se lit nulle part : ni rang, ni pastille de proximité, ni « 3 points communs ». C'est D39
appliquée à un lien — ce qui se montre est le **fait** qui rapproche, pas l'indice qui le résume.
Les quatre raisons s'écrivent « Même produit », « Camille Roux et Sofia Marchand en commun », « Même
entité : Digital Factory », « Approches communes : Audit UX ». **Aucune ne porte de chiffre**, et un
test l'exige par une expression régulière plutôt que par une relecture.

**Trois arbitrages tranchés avant écriture.** (1) Les quatre prédicats s'écrivent **en SQL**, seuil
« ≥ 2 » compris — `exists … group by … having count(*) >= 2` —, la préséance seule restant en
TypeScript : la lecture dit ce qu'elle cherche plutôt que de ramener le domaine entier pour trier
ensuite. (2) Les formulations sont **différenciées par règle**, la plus forte ne nommant pas le
produit que la ligne porte déjà. (3) La fixture ne pouvant pas éprouver les quatre règles, le HTML
servi se lit **sous sonde jetable**, sans toucher à `scripts/seed.ts` (règle 3).

**Le module a une frontière, et c'est ce qui rend ses filtres mesurables.** Les personnes et les
approches du projet consulté sont lues **une fois**, par des jointures filtrées sur `persons` et sur
`approaches` ; tout le reste ne compare plus que des identifiants déjà confrontés au domaine. Les
deux lectures qui suivent ne joignent donc **ni `persons` ni `approaches`**. Sans cette forme, un
second `filter()` sur les mêmes tables rattraperait la fuite que le premier laisserait passer, et
aucune mise en défaut ne saurait plus dire lequel des deux protège.

**Dix neutralisations, dix chutes isolées.** Les quatre règles (prédicat SQL **et** branche de
préséance, le prix nommé de l'arbitrage), le seuil de deux personnes (ses deux écritures), puis les
cinq `filter()` : `projects` sur la requête des candidats, `persons`, `approaches`,
`projectMembers` et `projectApproaches` sur les lectures de référence. Chacune fait tomber **un**
test et rien d'autre. Cela a demandé que **chaque projet du jeu ne coche qu'une règle** — un projet
rapproché par deux règles survit à la neutralisation de la première, et sa chute ne prouve rien — et
que **chaque ligne forgée ait sa propre cible** : cinq fuites qui viseraient le même projet feraient
tomber les cinq tests ensemble.

**Une chute impossible, et elle est nommée.** Neutraliser la règle « même produit » ne fait
*disparaître* aucune ligne : un produit n'a qu'une entité, donc tout voisin de même produit est
**aussi** de même entité. Ce qui tombe est sa **raison**, pas sa présence. C'est pourquoi le test de
préséance constate l'**unicité** — « n'apparaît qu'une fois » — et non le libellé gagnant : sinon
une seule neutralisation aurait fait tomber deux tests.

**Le HTML servi, mesuré — et la fixture vérifiée avant d'être crue.** La base de développement a
dérivé : ses cinq produits vivent tous sous **une seule entité**, si bien que « même entité »
rapproche tout et que « approches communes », plus faible, ne peut jamais surgir. Deux règles sur
quatre étaient donc inatteignables, et deux autres — dont « personnes en commun », plafonnée à
**une** personne partagée entre produits différents. Une sonde scopée a posé une seconde entité, un
produit et trois accompagnements ; les **quatre raisons** ont été lues au point de code sur
`/projets/8cd98cb8…`, l'insécable compris (`Même entité\xa0: Digital Factory`) ; l'**état vide** a
été lu sur un accompagnement seul sous son entité ; et l'archivage des deux sondes d'équipe a fait
**disparaître** la raison « en commun » du HTML servi, les trois autres tenant. **Aucune ligne de
sonde ne reste** — trois projets, deux produits, deux entités retirés, décompte à zéro vérifié en
base, script supprimé.

**Le contraste, mesuré.** Trois couples sur `surface-neutral-pale` : `content-info-base` 6,41:1 (le
lien), `content-neutral-base` 4,98:1 (statut, produit, période), `content-neutral-dark` 8,12:1 (la
raison). Aucun couple neuf **par la position** : la carte à filet est celle de `resources.tsx`, et
`StatusPill` porte son propre fond, déjà mesuré dans son en-tête. Le filet à 1,24:1 est la dette de
design system déjà consignée, à une position qui existait.

**Le droit s'éprouve par l'action — sans objet, et c'est dit plutôt qu'affirmé rempli.** Ce ticket
n'ajoute **aucun point d'entrée HTTP**, aucune action serveur, aucun panneau : il n'y a rien à
frapper en `text/plain`. Le bloc ne reçoit aucun droit et n'en attend aucun — c'est le second de la
page projet, avec « Journal », que `canWrite` ne touche pas.

**1048 tests, 37 fichiers, verts.** `lint --max-warnings=0` et `tsc --noEmit` sans une ligne. **+20
tests**, tous dans `lib/queries/links.test.ts`.

---

## T6.5 — Les liens déclarés : relier, dire pourquoi, retirer — 27/08/2026

**Ce que le ticket ferme.** `project_links` était au schéma depuis T1.2 et **n'avait jamais reçu une
ligne**. T6.4 avait livré la moitié déduite du bloc « Projets liés » en annonçant que la table
« reste au modèle sans lecteur jusqu'à T6.5 » ; elle a désormais **un lecteur et trois écrivains**.
`docs/06` §5 décrivait le bloc en une phrase — *« Liens déduits d'abord, puis liens déclarés avec
leur raison »* — et le bloc la porte enfin entière.

**Deux lectures, trois écritures, un panneau.** `listDeclaredLinks` lit **dans les deux sens** par
une seule requête, l'autre projet se désignant par un `case` dans le `on` de la jointure ;
`listLinkableProjects` propose ce qui reste reliable. `createProjectLink`, `updateProjectLink` et
`removeProjectLink` écrivent, ce dernier par **`unlink`** — `LinkTable` le dit à la compilation,
`archive` ne compilerait pas sur cette table. Le panneau est le plus court du produit : **deux
champs, dont un facultatif**, parce que `docs/02` §7 veut que relier reste *très peu coûteux* et que
cela se lit d'abord dans le nombre de champs.

**Quatre arbitrages rendus avant écriture.** (1) `?lien=<identifiant>` **rouvre le panneau en
correction** — la fiche posait la clé « `nouveau` | identifiant » sans nommer la destination du
second cas, et c'est ce que veut dire toute clé polymorphe du dépôt depuis T3.4 ; le prix est une
troisième action que la fiche ne nommait pas. (2) Le périmètre s'étend à `lib/forms/link.ts` et
`lib/journal.ts` **avec leurs tests** : la fiche exigeait une phrase de journal neuve sans inclure
le module qui porte la règle *une fonction par forme de phrase*. (3) Le retrait n'est permis que
depuis le projet **source**, lettre de l'arbitrage (g). (4) Le **réciproque** reste proposé : la
contrainte d'unicité porte sur un couple orienté, et inventer un cinquième refus aurait été une
règle hors périmètre.

**Le cinquième verbe, et la seule phrase dont le nom ne soit pas celui de son `target_type`.**
`linked` s'écrit dans les trois gestes ; l'énuméré n'a pas d'`unlinked`, donc le retrait porte le
même verbe et c'est la **phrase** qui distingue — « Lien retiré : Dématérialisation de la
déclaration ». `event_target_type` n'a pas de valeur `link` (arbitrage (b), et en ajouter une
demanderait une migration que le chantier s'interdit) : la colonne dit `project`, `target_id`
désigne l'accompagnement visé, et la phrase dit « Lien ». Les deux sont vrais ; c'est la phrase qui
se lit.

**Le décompte d'exclusivité passe de sept clés à huit sans qu'un caractère de sa logique change** —
la sixième fois, et c'est la propriété pour laquelle T4.4 l'avait écrit en décompte plutôt qu'en
comparaison.

### Les quatre disciplines

- **Le critère se lit dans le HTML servi, sur les deux projets.** Sur celui d'où le lien part : la
  ligne, sa raison, **« Modifier » et « Retirer »**. Sur celui qu'il vise : la même ligne, la même
  raison, **et aucun geste** — alors que le lecteur est responsable de domaine et écrit donc sur les
  deux. L'asymétrie de (g) se lit là, et nulle part ailleurs. Le réciproque déclaré sans raison rend
  **« Aucune raison donnée »** ; l'état vide du bloc et son bouton primaire ont été lus sous sonde,
  la base de développement n'ayant qu'une entité — « même entité » y rapproche tout, et aucun
  accompagnement n'y est sans voisin. Sans droit : ni entrée de bloc, ni geste, et `?lien=nouveau`
  **n'ouvre rien** tout en servant la page entière.
- **Le droit s'éprouve par l'action.** Quatre frappes sur le **vrai point d'entrée HTTP**, en
  `text/plain` avec charge Flight, chacune encadrée de son étape témoin. `createProjectLink` forgée
  sous une identité sans droit rend **200 et 300 octets** avec son message ; la même sous le
  responsable rend **200 et 61 383**. `removeProjectLink` frappée **depuis le projet cible** rend
  **200 et 78 octets** — refus muet — et depuis la source **200 et 60 801**. **Trois situations, un
  seul code** : seul le décompte en base les sépare. **Aucune ligne de sonde ne reste** — une
  liaison, trois événements `linked`, une entité, un produit et un accompagnement de sonde effacés,
  base ramenée à ses cinq accompagnements vivants et à ses deux événements d'avant.
- **Les tests se mettent en défaut. Vingt-six neutralisations, et trois ont corrigé le ticket.**
  (a) Le constat « le projet cible ne corrige pas le lien » tombait sur le **droit** et non sur le
  sens : le contributeur n'écrivait pas sur la cible, et le test serait passé au vert sans rien
  prouver de l'asymétrie. Le droit lui a été accordé des deux côtés. (b) `filter(projects)` de la
  jointure symétrique **ne faisait tomber aucun test** : la ligne forgée visait un projet ordinaire
  de l'autre domaine, que `filter(products)` écartait déjà — exactement le piège que l'en-tête du
  module nomme. Elle vise désormais le projet dont **seul `domain_id`** franchit la frontière.
  (c) Un commentaire affirmait que le nom du projet visé devait se lire **avant** `unlink`, « sans
  quoi la liaison n'existe plus pour désigner sa cible » : c'est faux — la ligne est déjà en main et
  `unlink` ne cascade sur rien. Les deux ordres passent les mêmes tests ; le commentaire a été
  récrit. **Une propriété qu'aucun test ne défend n'est pas une propriété.**
- **Le contraste se mesure.** Trois couples de texte : `content-neutral-dark` **8,12:1** (l'intertitre
  « Liens déclarés »), `content-neutral-base` **4,98:1** (« Aucune raison donnée »),
  `content-primary-dark` **15,72:1** (« Modifier », « Retirer »). Aucun couple neuf **par la
  position** : la carte à filet est celle de T6.4. Le filet à **1,24:1** est la dette de design
  system déjà consignée, à une position qui existait.

**1101 tests, 38 fichiers, verts.** `lint --max-warnings=0` et `tsc --noEmit` sans une ligne. **+53
tests** : 19 pour les deux lectures, 17 pour les trois actions, 11 pour `lib/forms/link.ts`, 6 pour
`linkPhrase`.

**Le seul module de saisie sans test l'aurait été.** `lib/forms/link.ts` serait entré comme le
quinzième de `lib/forms/` et le premier sans `.test.ts` voisin — l'absence se voyait à l'`ls`. Il a
son fichier, et ses cinq neutralisations.

---

## T6.6 — Le flux d'activité récente en vue d'ensemble — 27/08/2026

**Ce que le ticket ferme.** La vue d'ensemble était un **état vide depuis T1.6** : point d'entrée de
l'application, elle annonçait ses quatre blocs au lieu d'en porter un. `docs/06` §3 la veut *« le
seul endroit du produit qui donne le sentiment que Vision est vivante »* ; T6.6 livre le bloc qui le
fait, et le seul des quatre qui **dépende** du journal (arbitrage (d)). T6.7 livre les trois autres.

**Une lecture, un composant, une page.** `listRecentEvents(scope, limit)` est la **seconde** lecture
d'`events` et la première qui traverse le domaine — `listProjectJournal` s'arrête à un
accompagnement. Elle joint trois tables, chacune avec `filter()` dans le `on` de son `leftJoin` :
`persons` pour l'acteur, `projects` et `products` pour l'**origine**, que la requête tranche
elle-même — le projet d'abord, le produit à défaut, cas des relevés d'indicateur que T6.2 a prévu.
`RecentActivity` rend une `<ol>` de la forme du bloc « Journal », chaque ligne portant sa phrase
figée, son acteur, son origine **cliquable** et sa date. La page devient `async` et perd son
`EmptyState` d'annonce.

**Le plafond est un nombre écrit : quinze.** Pas de pagination, pas de « voir plus », **et aucun
décompte** — compter les événements du domaine serait la mesure d'activité du centre que `docs/06`
§3 refuse sur l'écran que verra un responsable.

**Le mot « activité » ne descend pas de l'en-tête aux lignes.** Le bloc s'appelle « Activité
récente » parce que `docs/06` §3 le nomme ainsi ; ses lignes sont des **événements**. C'est ici que
le piège de `docs/04` §4 coûtait le plus cher, et les trois en-têtes du ticket le disent chacun une
fois.

**Ce que la vérification a donné.**

- **Le critère se lit dans le HTML servi.** Les **deux** origines y sont, ce qui est le seul moyen de
  prouver les deux branches de la préséance : `href="/projets/28b79f40…"` sur les deux événements de
  projet que T6.3 avait laissés en base, et `href="/produits/93d634e9…"` sur un événement de relevé
  — obtenu en corrigeant un relevé de 32 à 33 par le **vrai point d'entrée HTTP**, multipart rejoué
  depuis le formulaire servi, sans une ligne de JavaScript. Acteurs, dates et libellés `sr-only`
  lus au point de code. **Le décompte en base a tranché à chaque geste** : `events` 2 → 3 → 4,
  relevé 32 → 33 → **32 rétabli**.
- **Trois états vides lus, dont deux qu'`ETAT.md` traînait depuis T6.2.** Celui du flux a demandé un
  **domaine à lui**, la base de développement portant des événements qu'on ne peut pas retirer : un
  domaine nommé pour venir **avant** « Groupe Meridian », `resolveDomainId` rendant le premier
  domaine actif par nom. Sa personne unique n'étant dans aucune équipe, il a refermé au passage
  « Cette personne n'est encore dans l'équipe d'aucun accompagnement. » Le troisième, « Aucune cible
  de produit », a demandé son propre geste sur le domaine réel — cible retirée, lue, rétablie à 85.
  **La sonde est supprimée, non archivée**, et la base ne porte plus qu'un domaine.
- **Les tests se mettent en défaut. Huit neutralisations, et deux ont corrigé le ticket.**
  (a) Inverser la préséance de `originOf` laissait les **treize** constats au vert : aucun point
  d'écriture ne pose les deux rattachements à la fois, donc la branche perdante n'était jamais
  atteinte. Un cinquième événement légitime les porte désormais ensemble. (b) La ligne forgée du
  domaine voisin, datée après tout le jeu, **volait la chute du plafond** : sans filtre de domaine
  elle entrait dans les deux lignes rendues. Redatée au milieu, elle ne perturbe plus rien. Les
  quatre `filter()` tombent ensuite chacun sur **un** constat, `.limit()` sur un, et la préséance sur
  un. Une chute reste double et ne peut pas ne pas l'être : ce qui rend un domaine vide **est** le
  filtre de domaine, faute d'une seconde clause comme celle qui sauvait `journal.test.ts`.
- **Un commentaire affirmait une protection que la mesure a démentie.** Sélectionner `projects.id`
  plutôt qu'`events.projectId` ne protège de rien — la conjonction `id && name` d'`originOf` le fait
  déjà, et TypeScript l'impose. La forme est gardée comme **redondance nommée**, le commentaire
  récrit. **Une propriété qu'aucun test ne défend n'est pas une propriété** — la leçon de T6.5,
  resservie sur un autre commentaire.
- **Le contraste se mesure, et un couple servi depuis T4.1 ne l'avait jamais été.**
  `content-info-base` sur `surface-neutral-pale` — le lien d'origine — donne **6,41:1**. Les trois
  autres du bloc : `content-neutral-darkest` **17,87:1**, `content-neutral-base` **4,98:1** (la
  valeur déjà consignée, ce qui valide la méthode), `content-neutral-dark` **8,12:1**. Aucun couple
  neuf par la position ; le quatrième a été mesuré quand même.
- **Le droit s'éprouve par l'action — et il n'y en a aucun.** Rien ne s'écrit sur cet écran, la
  lecture du journal est ouverte à tout le domaine (D9). Ce qui s'est vérifié est la propriété
  inverse : le bloc servi à un **membre** sans droit de domaine, contributeur d'un seul
  accompagnement qui n'est pas celui dont les événements paraissent, est **identique à l'octet** —
  2 263 de part et d'autre — à celui servi au responsable de domaine.

**1115 tests, 39 fichiers, verts.** `lint --max-warnings=0` et `tsc --noEmit` sans une ligne. **+14
tests**, tous sur `listRecentEvents` : l'ordre, la traversée des accompagnements, les deux origines,
la préséance, la phrase, l'acteur, l'acteur nul, le plafond, l'état vide, et les **quatre**
étanchéités.

**Un dossier neuf creuse un trou dans le scellement, et ne le comble pas.** `components/overview/`
est le quatrième dossier métier ; `uiLayerSeal` n'en nomme que trois. `eslint.config.mjs` était hors
du périmètre de la fiche (règle 3), et le point ouvert d'`ETAT.md` a été **récrit** pour le dire
plutôt que d'être élargi en silence.

---

## T6.7 — La vue d'ensemble entière : répartition, fraîcheur, accès direct — 27/08/2026

**Ce que le ticket ferme.** T6.6 avait livré le premier des quatre blocs de `docs/06` §3 — le seul
qui **dépende** du journal. T6.7 livre les trois autres et **clôt C6** : la répartition, les projets
sans activité récente, l'accès direct. L'arbitrage (d) du découpage l'exigeait — *laisser l'écran à
moitié vide après l'avoir ouvert coûterait plus qu'il ne protège.* Aucun des trois ne demandait de
table neuve : ils lisent `projects`, `products` et les deux référentiels tels qu'ils existent depuis
T2.3.

**Trois lectures dans `lib/queries/overview.ts`.** `listProjectDistribution` compte les projets par
statut et par approche, chacune en `leftJoin` depuis le **référentiel** — c'est ce qui rend un zéro.
`listStaleProjects` retient `last_activity_at` antérieur au seuil, **et les nuls avec**.
`countProjects` / `countProducts` donnent les deux nombres de l'accès direct. Les trois rejouent, à
la lettre, les conditions de la liste qu'elles annoncent.

**Le contrat du ticket tient en une phrase : suivre le lien rend exactement ce nombre de lignes.**
D'où le choix qui décide de tout — **on compte `products.id`, jamais `projects.id`**. Un projet
vivant sous un **produit archivé** franchit le premier `leftJoin` et échoue au second : compter la
colonne du projet l'inclurait, quand `listProjects` l'écarte par son `innerJoin`. Le chiffre dirait
un de plus que la liste, sans qu'aucune erreur ne se produise.

**Cinq arbitrages, rendus avant d'écrire.**

- **La répartition par entité n'est pas rendue.** `/projets` porte trois clés depuis T2.3 —
  `recherche`, `approche`, `statut` — et **aucune d'entité**. La fiche tranchait d'avance : *un
  chiffre dont le filtre n'existe pas n'est pas rendu*. Poser la clé aurait été une fonctionnalité
  sur un autre écran (règle 3). Point ouvert, destination C7.
- **Les zéros se rendent**, tout le référentiel non archivé — l'écart assumé avec
  `listProjectFilterOptions`, qui n'offre que ce qui ramène quelque chose. L'une propose des
  chemins, l'autre **décrit une distribution**. `formatProjects(0)` écrit « Aucun projet ».
- **Une valeur de référentiel archivée se rend si et seulement si elle porte encore des projets.**
  Archivée et vide, c'est du vocabulaire retiré. Archivée et porteuse, ses projets comptent dans la
  liste : la taire ferait de la répartition une lecture **incomplète en silence**, et comme aucune
  somme n'est affichée, personne ne verrait l'écart.
- **L'accès direct porte ses décomptes**, et le plafond des dormants est **dix**, écrit et jamais
  annoncé — la forme de `RECENT_EVENTS_LIMIT`.
- **Les clés de filtre montent dans `lib/navigation.ts`.** Elles étaient un `const PARAM` non
  exporté de `app/(app)/projets/page.tsx` : légitime tant qu'un seul écran les écrivait. Avec un
  second lecteur, une clé qui vit à deux endroits n'en est plus une — le jour où `statut` devient
  `etat`, la vue d'ensemble sert des liens qui ne filtrent plus rien, **sans qu'aucun test ni le
  compilateur ne le dise**. Deux fichiers hors du périmètre de la fiche, sans changement de
  comportement.

**Ce que la vérification a donné.**

- **Le critère se lit dans le HTML servi, et il se suit.** Les quatre blocs sont dans le document,
  dans l'ordre de `docs/06` §3. **Onze chiffres rendus, onze suivis, onze concordances** — dont
  **deux à zéro** (« Cadrage », « Audit d'éco-conception »), lues « Aucun projet » et servant zéro
  ligne. Le bloc des dormants rend trois projets, la date en toutes lettres, le « jamais » en tête ;
  aucune occurrence de badge, d'alerte ou de pourcentage. L'accès direct annonce « 3 produits » et
  « 5 projets », et sert 3 et 5 lignes.
- **Une valeur hors fixture ne rend pas zéro, et c'est T2.3 qui le décide.** `/projets?statut=`
  suivi d'un UUID forgé sert **les cinq** projets : `find` est scopé, ne trouve rien, et le filtre
  est **ignoré** plutôt qu'appliqué à vide — *inventer un libellé à partir d'un paramètre serait
  donner du crédit à ce qu'on n'a pas lu.* La vue d'ensemble ne rend aucun chiffre pour une telle
  valeur ; il n'y a donc rien à faire diverger.
- **Le référentiel archivé a demandé une sonde, la base de développement n'en portant aucun.**
  « Terminé » archivé reste rendu, à 1 projet, et son lien sert **1** ligne — `find` ne filtrant pas
  l'archivage, la clé résout encore. « Cadrage » archivé, à zéro, **disparaît**. Les deux moitiés de
  la règle lues dans le HTML servi, puis les deux statuts rétablis, `archived_at` remis à `null`
  **mesuré en retour**. La sonde est supprimée, non archivée.
- **Les tests se mettent en défaut. Seize neutralisations, et deux ont corrigé le ticket.**
  (a) Trois neutralisations de la fraîcheur faisaient tomber le constat du **plafond** en plus du
  leur : l'archivé et les deux projets forgés étaient sans activité, donc entraient **en tête** de
  liste et chassaient les lignes attendues. Datés à soixante jours — dormants, mais après le projet
  endormi —, chacun ne fait plus tomber que son constat. (b) `filter(entities)` du décompte des
  produits **n'avait aucune chute** : rien dans la fixture ne portait un produit dont l'entité soit
  d'ailleurs. Une ligne forgée l'a donné. Les treize autres tombent chacune sur son constat.
- **Un constat est global par construction, et c'est voulu.** La concordance « le chiffre est le
  nombre de lignes » tombe à **chaque** divergence — c'est exactement le cas que la fiche désigne
  pour les filtres d'archivage. L'isolement se mesure donc parmi les constats **ciblés**, et chacun
  vise un `filter()` sur une valeur de référentiel qui ne sert qu'à lui : deux statuts et une
  approche n'existent dans la fixture que pour porter une ligne forgée.
- **Le contraste se mesure, et aucun couple n'est neuf par la position.** Les quatre du ticket, sur
  `surface-neutral-pale` : `content-neutral-darkest` **17,87:1**, `content-neutral-dark` **8,12:1**,
  `content-info-base` **6,41:1**, `content-neutral-base` **4,98:1** — les quatre valeurs de T6.6, ce
  qui valide la méthode. `StatusPill` entre pour la première fois **dans un lien** ; ses quatre
  couples sont ceux mesurés dans `status-pill.tsx`, la surface d'accueil est celle de `List`.
- **Le droit s'éprouve par l'action — et il n'y en a aucune.** Rien ne s'écrit sur cet écran, aucun
  point d'entrée HTTP n'est ajouté, et les quatre lectures sont ouvertes à tout le domaine (D9). Ce
  qui s'est vérifié est la propriété inverse : le `<main>` servi à Awa Diallo, sans droit de
  domaine, est **identique à l'octet** à celui servi à Camille Roux, responsable. La seule différence
  de la page est l'entrée « Administration » de la barre latérale, qui appartient au layout.

**1144 tests, 39 fichiers, verts.** `lint --max-warnings=0` et `tsc --noEmit` sans une ligne. **+29
tests** : douze sur la répartition — les deux concordances, le zéro, la double approche, les deux
moitiés de la règle d'archivage, l'ordre du référentiel, les cinq étanchéités —, dix sur la
fraîcheur, trois sur `staleBefore`, quatre sur les décomptes.

**`staleBefore` est pure, et son rabattement de jour n'est pas décoratif.** `setUTCMonth` reporte
les jours en trop sur le mois suivant : le 31 mars reculé d'un mois donnerait le 3 mars. Le seuil
avancerait de trois jours quatre fois l'an, sans jamais lever d'erreur. Le premier du mois d'abord,
le recul ensuite, le jour rabattu sur le dernier du mois visé — et un test le tient.

---

## T7.1 — Le budget : le dernier bloc de la page projet — 28/08/2026

**Ce que le ticket ferme.** D28 — *le budget reste dans le POC, en dernier*. `budgets` était au
schéma depuis la migration `0000` et **n'avait jamais reçu une ligne** : c'était le seul des cinq
blocs de référence de `docs/06` §5 qui n'existait pas. T4.1 avait livré « Ressources », T5.4
« Indicateurs adoptés », T6.3 « Journal », T6.4 et T6.5 « Projets liés » ; il restait celui-ci, seul
survivant de la rangée des cartes annoncées. **`REFERENCE_BLOCKS` disparaît avec lui** — un tableau
vide et une boucle dessus sont une annonce que plus personne ne lit.

**Neuf fichiers, dont six neufs.** `lib/forms/budget.ts` et son test, `lib/queries/budgets.ts` et
son test, `components/projects/budget.tsx` et `components/projects/budget-panel.tsx` ;
`lib/navigation.ts`, `lib/drawers/types.ts`, `lib/drawers/project.tsx`,
`app/(app)/projets/[id]/actions.ts` et son test, `app/(app)/projets/[id]/page.tsx`.
**`app/(app)/projets/[id]/drawers.tsx` était au périmètre et n'a pas bougé** : le point d'entrée
serveur des panneaux passe déjà par `asProjectRequest` et `resolveProjectDrawer`, et la neuvième
demande y entre sans qu'une ligne change — c'est la propriété que TD.2 cherchait.

**Un geste, pas trois — et c'est la table qui le décide.** `budgets_project_unique` fait qu'un
projet porte **au plus un** budget. Il n'y a donc rien à désigner : la clé d'URL `budget` prend une
**seule valeur d'ouverture**, `saisie` — la forme d'`archiver`, non celle de `ressource` —, la
demande `{ kind: "budget" }` ne porte pas d'`id`, la branche cherche la ligne **par le projet**, et
`saveProjectBudget` crée ou corrige la même ligne. Là où la ressource, l'adoption et le lien
demandaient une porte de plus pour rapprocher la cible de la page, `openProject` suffit — il n'y a
pas de cible reçue à falsifier.

**Le décompte d'exclusivité passe de huit clés à neuf sans qu'un caractère de sa logique change.**
Septième fois, et la dernière : la page projet n'a plus de bloc à ouvrir. C'est la propriété pour
laquelle T4.4 l'avait écrit en décompte plutôt qu'en comparaison.

**Quatre arbitrages, dont deux rendus par la fiche et deux par le ticket.**

- **Le budget ne se retire pas** (arbitrage (c) de `tickets-C7.md`). `budgets` n'a pas d'`archived_at`
  et n'en reçoit pas — ce serait une seconde migration —, et `unlink` ne s'applique pas, l'exception
  de C6 étant argumentée sur une **table de liaison**. Le rattrapage d'une saisie erronée est donc
  la **correction** : les cinq colonnes de valeur sont nullables, et un formulaire soumis vide les
  remet toutes à `null`. C'est pourquoi rien n'est obligatoire dans ce formulaire — refuser la
  soumission vide aurait fermé le seul chemin qui défait.
- **Aucune ligne de journal** (arbitrage (d)). `budget` n'est pas l'un des six `event_target_type`,
  et l'ouvrir pour un seul objet demanderait une migration d'énuméré quand six autres écrivent déjà
  sans trace. Le point ouvert d'`ETAT.md` se récrit avec un **septième** nom.
- **`unit` ne se saisit pas, mais se lit.** `budget_unit` n'a qu'une valeur, `days`, et la colonne
  la porte par défaut : un `<select>` d'une seule option n'offre aucun choix, il occupe une ligne.
  Elle se lit en revanche dans le bloc — « 140 » sans unité ne dit rien. Le jour où l'énuméré
  s'ouvrira, le champ arrivera avec la valeur.
- **La validation vit dans `lib/forms/`**, hors des sept fichiers de la fiche. Le dossier existe
  pour que la règle s'éprouve **sans branche Neon** ; l'inliner dans `actions.ts` — 2 394 lignes —
  l'aurait rendue testable seulement contre une base réelle, et aurait forcé le panneau client à
  importer ses types depuis un fichier `"use server"`. Écart consigné au journal technique.

**Ce que le bloc n'affiche pas.** Aucun reste à consommer, aucun pourcentage, aucune jauge, aucune
barre de progression, aucun signe de dépassement. « 44 % consommé » serait exactement l'indice
**calculé par Vision** que D39 interdit ; « 140 jours » et « 61,5 jours » sont deux valeurs
**reportées**, juxtaposées avec leur date. Le test `un consommé supérieur à l'alloué est écrit sans
discuter` fige la règle : un dépassement est un fait que l'outil de gestion connaît avant Vision, et
le refuser empêcherait de reporter la vérité.

**Ce que la vérification a donné.**

- **Le critère se lit dans le HTML servi, et l'ordre s'y lit aussi.** La colonne du récit rend
  `Roadmap des activités · Démarrage · Projets liés · **Budget** · Journal` : le `<details>` du
  journal suit immédiatement `</section>` du budget — la place exacte de `docs/06` §5, *dans sa
  colonne*, la règle posée le 20/08/2026 pour la page à deux colonnes.
- **L'état vide est un écran à part entière** (règle 5) : il explique ce que le bloc contiendra et
  porte « Saisir le budget » en bouton primaire. L'état **renseigné** rend « 140 jours », « 61,5
  jours » — virgule française et **espace insécable mesurée à l'octet, `c2 a0`** —, « 20 août
  2026 », et le nom de l'outil portant le lien sortant avec son `↗` et son
  « (lien externe, nouvel onglet) ». L'état **partiel** rend « Non renseigné » et « Non renseignée »
  au féminin pour la date. Zéro occurrence de `%`, `reste`, `dépass`, `jauge` ou `progress` dans le
  balisage du bloc.
- **Le droit décide du rendu comme de l'ouverture.** Servi à Sofia Marchand, membre du domaine mais
  **non contributrice** du projet : le bloc est là, le geste n'y est pas, et `?budget=saisie` ne
  monte **aucun** panneau. Servi à Thomas Lemaire, contributeur : les deux sont là.
- **Le droit s'éprouve par l'action, et l'étape témoin est ce qui rend le reste lisible.** Le
  formulaire a été rejoué à la main, en multipart, avec les champs `$ACTION_…` du balisage servi —
  où l'identifiant du projet se lit **en clair**, comme le rappel de contexte l'annonce. *Témoin* :
  sous Thomas, `BUDGETS=0` → `BUDGETS=1`, la ligne portant `140.0000 / 61.5000 / 2026-08-20`.
  *Forge* : la même charge sous Sofia, valeurs `999999`, rend **HTTP 200** — le code ne dit jamais
  ce qui a été écrit — avec le refus dans la réponse, et la ligne reste **intacte à 140.0000**.
  Sans le témoin, le 200 du refus et le 200 du succès étaient indiscernables.
- **Trois mises en défaut, trois comptes exacts.** Retirer `filter(tools)` de la jointure fait
  tomber **le seul** test de la ligne forgée, avec le message qui nomme la fuite : *expected
  'Gestion a' to be null* — un budget du domaine `b` affichant le nom d'un outil du domaine `a`.
  Neutraliser `writeProject` dans `openProject` fait tomber **huit** tests, dont celui du budget :
  le cas de droit n'est donc pas vide de sens. Poser un `record()` dans `saveProjectBudget` fait
  tomber **un seul** test, celui de l'absence de journal — sans lui, cette absence ne se
  distinguerait pas d'un oubli, et elle ne se lit dans aucun écran.
- **Le contraste ne se mesure pas, et le dire est le constat.** Aucun couple n'est neuf **par la
  position** : le bloc est une `Section`, donc `bg-surface-neutral-pale`, exactement le fond de la
  carte d'en-tête d'où `Field` vient et des quatre autres blocs de la page. `Field`, `ACTION_LINK`,
  `ExternalLink`, `BlockNote` et le bouton primaire y sont tous déjà mesurés. Inventer une mesure
  pour un couple inchangé aurait été l'affirmer plutôt que la constater.
- **Le compte.** `tsc`, `npm run lint` (`--max-warnings=0`) et `npm run test` au vert : 41 fichiers,
  **1 189 tests**, dont **45 neufs** — 22 pour le formulaire, 9 pour la lecture, 14 pour l'action.

**Quatre chiffres faux retirés en chemin, et aucun corrigé.** L'ajout d'une neuvième clé rendait
faux « les vingt et une constantes » de `lib/navigation.ts`, « les huit panneaux » de
`lib/drawers/types.ts`, « les six panneaux d'écriture » de `lib/drawers/project.tsx`, « les quatre
clés » de `page.tsx` — plus « sept écritures » d'`actions.ts`, déjà faux avant ce ticket. Le geste
du dépôt depuis T6.1 est de **retirer** le nombre, jamais de le mettre à jour : un nombre dans un
commentaire vieillit à chaque ticket. Cinquième famille du même défaut, et celle-là est refermée.

---

## T7.2 — Entité et métier : les deux filtres manquants, et la répartition par entité — 28/08/2026

**Le ticket qui referme une dette de deux chantiers, et dans le seul ordre qui la refermait.**
`docs/06` §4 demande quatre filtres sur la liste transverse depuis toujours ; il y en avait deux
depuis T2.3. La conséquence n'était pas dans cet écran mais dans le suivant : `docs/06` §3 demande
trois dimensions de répartition, T6.7 n'en a livré que deux, et son refus était argumenté —
*« un chiffre dont le filtre n'existe pas n'est pas rendu »*. Poser le chiffre sans le filtre aurait
donné un nombre qui ne mène nulle part ; poser le filtre depuis T6.7 aurait été une fonctionnalité
hors ticket. **Il fallait deux tickets, dans cet ordre**, et c'est le second.

### Ce qui a été écrit

- **`lib/navigation.ts`** — `PROJECT_FILTER_PARAM` passe de deux clés à quatre : `entity: "entite"`
  et `job: "metier"` rejoignent `approche` et `statut`, **dixième et onzième clés d'URL** du produit.
  `ROUTES.projectsByEntity` prend la forme exacte de `projectsByStatus`. Aucune `projectsByJob` en
  regard : rien hors de la liste n'écrit ce filtre, et une route sans appelant est celle qu'on relit
  un jour sans savoir pourquoi.
- **`lib/queries/projects.ts`** — `ProjectFilters` gagne `entityId` et `jobId`. **L'entité ne joint
  rien de neuf** : `products` est déjà en `innerJoin` avec son `filter()`, et l'entité se lit sur sa
  colonne — la meilleure façon de ne pas oublier un `filter()` est de ne pas ajouter de jointure. Le
  métier passe par un `exists` sur `projectJobs`, **copie conforme** de celui des approches, pour la
  raison qui l'avait fait choisir en T2.3 : le jour où le filtre acceptera plusieurs valeurs, une
  jointure doublerait les lignes et celui-ci non. `ProjectFilterOptions` passe à quatre listes, les
  deux neuves bâties comme les deux anciennes — `selectDistinct` sur les seules valeurs portées par
  un projet vivant d'un produit vivant.
- **`app/(app)/projets/page.tsx`** — deux paramètres de plus, confrontés au domaine par
  `session.db.find` dans le `Promise.all` existant, deux `<select>` de plus **dans l'ordre du
  document** (entité, métier, approche, statut), deux lignes de plus aux filtres appliqués. Le
  composant `Select` s'est réemployé sans une ligne de changement : il se masque seul quand sa liste
  est vide.
- **`lib/queries/overview.ts`** — `ProjectDistribution` gagne `entities`, et une troisième requête
  sur la chaîne `entities → products → projects`. `isRendered` et `strip` se sont réemployés tels
  quels : une entité archivée sans projet ne se rend pas, une entité archivée **porteuse** se rend.
- **`components/overview/distribution.tsx`** — la dimension « Par entité », entre statut et
  approche, l'ordre de `docs/06` §3.

### Ce qui a été vérifié, et comment

- **Le contrat, mesuré dans le HTML servi, sur les trois dimensions.** Chaque chiffre du bloc a été
  suivi jusqu'à `/projets`, et les lignes de la liste comptées dans la réponse — jamais le compteur
  que la page affiche pour elle-même, qui est la même affirmation dite deux fois. **Seize valeurs,
  dont sept à zéro** : statut 4 valeurs (2 à zéro), **entité 5 valeurs (4 à zéro)**, approche 7
  valeurs (1 à zéro). Aucune divergence. La fiche en demandait trois dont une à zéro.
- **Sept neutralisations, sept chutes, et l'isolement mesuré.** Retirer `isNull(products.archivedAt)`
  puis `isNull(projects.archivedAt)` du décompte par entité fait tomber **le seul** constat de
  contrat — la divergence exacte que la fiche cherchait. Retirer `filter(entities)` fait tomber son
  seul constat ciblé. Retirer `filter(products)` ou `filter(projects)` de la chaîne fait tomber le
  sien **et** le contrat, qui est global par construction — jamais celui de l'autre. Neutraliser le
  filtre d'entité puis celui de métier fait tomber deux jeux **disjoints**, hors du constat de
  combinaison, qui les assert tous les quatre par définition.
- **Un constat partagé a été scindé pour cela.** La première rédaction mettait entité et métier dans
  le même test d'étanchéité : il tombait sous l'une comme sous l'autre neutralisation, et une chute
  non isolée ne désigne plus le filtre qu'elle éprouve. Deux tests, une frontière chacun.
- **Le contraste se mesure, même quand la réponse est « rien de neuf ».** Aucun couple n'est neuf
  **par la position** — le libellé d'entité reprend celui d'approche, dans le même bloc et sur le
  même fond. Mesuré tout de même, sur `surface-neutral-pale` `#fdfdfd` : `content-neutral-darkest`
  **17,87:1**, `content-info-base` **6,41:1**, `content-neutral-dark` **8,12:1**. Les trois passent
  4,5:1.
- **Le droit ne s'éprouve pas, et le dire est le constat.** Le ticket n'ouvre **aucun point d'entrée
  d'écriture** : deux filtres de lecture et un décompte, tous ouverts à tout le domaine (D9). Il n'y
  a pas d'action à forger. Inventer une sonde de droit ici aurait été mimer la discipline, pas
  l'appliquer.
- **Un identifiant qui ne désigne rien reste ignoré, jamais affiché.** Mesuré sur
  `?entite=00000000-…` : la liste complète est servie, « Entité » n'apparaît pas dans les filtres
  appliqués, et les trois occurrences de l'UUID dans la réponse sont toutes dans la charge Flight du
  routeur — aucune dans un `<option>`, aucune dans le corps de liste.
- **Le compte.** `tsc`, `npm run lint` (`--max-warnings=0`), `npm run build` et `npm run test` au
  vert : 41 fichiers, **1 207 tests**, dont **18 neufs** — 10 pour les filtres et leurs options, 8
  pour la répartition par entité.

### Le point ouvert que ce ticket referme

- **La liste transverse n'avait que deux filtres sur les quatre de `docs/06` §4** — `approche` et
  `statut` depuis T2.3, ni entité ni métier ; et la répartition par entité n'était pas rendue en
  conséquence. **Refermé aux deux bouts** : les quatre filtres existent, la troisième dimension est
  rendue, et le contrat entre le chiffre et la liste est mesuré.

### Le point ouvert qu'il laisse

- **Deux colonnes de `docs/06` §4 manquent encore aux lignes** — l'entité et les métiers, sur les
  sept que le document énumère. T7.2 a posé leurs **filtres**, pas leurs **colonnes** : son
  « Attendu » ne les nommait pas, et la règle 3 tranche. Aucun ticket de C7 n'ouvre cet écran pour du
  contenu — T7.9 s'interdit nommément de rouvrir T7.2. → **C8.**


---

## Hors ticket — deux blocs masqués sur la page projet, 28/08/2026

**La demande.** Deux blocs de la colonne du récit ne servent pas le MVP tel qu'il se démontre.
« Projets liés » n'apporte pas de valeur au stade actuel. « Démarrage » en apporte, mais **au projet
neuf seulement** : il dit ce qu'on *peut* faire, et la question ne se pose plus une fois
l'accompagnement ouvert. Il doit revenir plus tard par le geste d'ajout d'une activité — annoncé,
donc pas fait (règle 3).

**Deux arbitrages rendus avant écriture**, tous deux par l'humain. **(1)** Le critère de
« Démarrage » est *la roadmap est vide*, **sans exception d'état** : distinguer ce qui a « vraiment
commencé » aurait été l'indice calculé par Vision que D39 interdit. **(2)** Le masquage de « Projets
liés » retire le rendu **et ses deux lectures**, rien d'autre — le précédent exact de la barre
d'ancres du 21/08 : *rien n'est supprimé, le bloc revient d'une dizaine de lignes.*

**Le geste, trois fichiers.** Dans `app/(app)/projets/[id]/page.tsx` : trois imports en moins, le
bloc `<RelatedProjects>` retiré, et un `hasActivity` — `roadmap.some((group) =>
group.activities.length > 0)` — qui garde `<Starters>`. Le décompte porte sur les **activités** et
non sur les groupes : `listProjectRoadmap` n'en rend aujourd'hui aucun de vide, mais un critère
adossé à cette propriété se casserait le jour où elle changerait. Les en-têtes de `related.tsx` et de
`starters.tsx` disent chacun leur nouvelle situation — un fichier sans appelant est un fichier qu'on
relit un jour sans savoir pourquoi.

**Le vol de lectures repasse de neuf à sept.** `listRelatedProjects` en emportait **quatre** — les
liens déduits ne sont rien de stocké (T6.4) — et `listDeclaredLinks` une cinquième. Cinq requêtes par
affichage qu'un bloc invisible n'a aucune raison de payer. `listStarters` reste, elle : `starters`
alimente aussi la résolution du panneau, et `?piste=` doit continuer d'ouvrir sur un projet peuplé —
c'est le point d'entrée que la suite réemploiera.

**La vérification, en quatre disciplines.**

- **Le critère se lit dans le HTML servi**, avec son étape témoin : les sept projets vivants du
  domaine et un projet archivé sans activité, mesurés **avant** le geste — tous à sept `<section>`,
  `id="demarrage"` et `id="projets-lies"` présents. Après : le projet sans activité rend **six**
  sections — `Roadmap · Démarrage · Budget · Journal` à gauche —, les projets peuplés en rendent
  **cinq**, sans « Démarrage ». Aucun `id="projets-lies"` nulle part.
- **Les deux nuances du critère, par sonde avec rétablissement.** Sur un projet portant une activité
  *terminée* et une *annulée*, archiver la terminée laisse « Démarrage » **absent** — l'annulée
  compte, arbitrage (1) mesuré ; archiver l'annulée à son tour le fait **revenir** — une activité
  archivée ne compte pas. Base rétablie à l'identique, `archived_at` relu ligne à ligne.
- **La règle se met en défaut**, faute de test à neutraliser : aucun test du dépôt ne rend cette
  page. `hasActivity` forcé à `false` fait réapparaître **exactement** le bloc — un `<h2>`, un
  `id="demarrage"`, quatre mentions d'outil, huit liens `piste=` — et rien d'autre ; `projets-lies`
  reste à zéro, les deux gestes sont donc indépendants. Rétabli, le balisage est identique au
  caractère près, scripts de développement Next exclus.
- **Le contraste** n'a rien de neuf à mesurer, et c'est dit plutôt que sauté : aucune couleur n'est
  ajoutée, aucun couple ne change de position, les blocs restants gardent leur fond.
- **Le droit s'éprouve par l'action.** `?lien=nouveau` ouvre encore le panneau à Camille Roux et rend
  la page nue à Sofia Marchand, non contributrice — **le masquage n'a rien protégé et ne le prétend
  pas**. `?piste=` ouvre pour les deux (D9). `?lien=nouveau&piste=<id>` n'ouvre rien en 200 : le
  décompte d'exclusivité **reste à neuf clés**, sans qu'un caractère change.

**Le résultat.** `npm run lint` (`--max-warnings=0`), `npx tsc --noEmit`, `npm run build` et les
**1 207 tests** passent. Aucune migration, aucune suppression, aucun test touché.

---

## Hors ticket — suppression définitive et disponibilité déduite, 28/08/2026

**La demande.** Trois gestes, demandés et livrés le même jour, **hors ticket et à la demande de
l'humain** : supprimer définitivement un accompagnement (avec mise en garde), supprimer une personne
de la page Équipe, et **déduire** la disponibilité du nombre d'accompagnements — `0` → disponible,
`1` ou `2` → partiellement, `3` et plus → indisponible.

**La base a été corrigée le jour même.** La première version comptait les accompagnements *vivants* —
tout ce qui n'est pas archivé. L'humain l'a repris : *« un accompagnement indiqué Terminé, et pas
d'autre accompagnement → disponible »*. La nature `done` sort du décompte ; les autres restent,
`paused` comprise — une pause n'est pas une fin.

**Ce qu'elle coûte en décisions.** Quatre écarts documentaires, tous rendus par l'humain, tous
consignés au journal technique : `F1-D3` (« un projet s'archive, ne se supprime jamais ») et la
règle 4 sur `projects` ; la règle 4 sur `persons` ; l'arbitrage (g) de C7, qui bornait la suppression
aux entités et se disait *rouvrable par l'humain, jamais par un ticket* — c'est exactement ce qui
s'est passé ; et D39, la disponibilité déduite étant un indice calculé pour qualifier une personne.
Ce dernier écart était **annoncé** : l'arbitrage (b) de C5bis posait la disponibilité comme *« une
liste fermée de trois valeurs dont la logique dépendra directement le jour où elle se dérivera des
accompagnements »*, et le commentaire de la colonne nommait la dette en attente d'un seuil. Le seuil
est humain, et c'est un nombre.

### Ce qui a été fait

**`DeletableTable` passe d'une table à trois**, et son commentaire est **récrit** plutôt
qu'augmenté : l'argument du 21/08 — *« `deleteRow` n'efface qu'une ligne que rien ne référence »* —
est faux pour `projects`. Les trois n'ont pas la même barrière : `entities` et `persons` sont tenues
par des clés `restrict`, `projects` n'est tenue par rien. Ses dix clés étrangères sont `cascade`.

**Supprimer un accompagnement** — `deleteProject`, sur la porte `manageDomain` d'`archiveProject`,
offerte sur un projet vivant **comme** archivé. Le panneau compte ce qu'il emporte
(`countProjectContents` : activités, ressources, résultats, lignes de journal), nomme les six
cascades qu'il ne compte pas, et propose la sortie : « Archiver conserve tout cela, et se défait. »
**Seule action de panneau qui redirige encore** depuis TD.2, faute de page derrière elle. **Aucune
ligne de journal** : `events.project_id` est `cascade`, une trace écrite juste avant serait effacée
par l'instruction suivante — huitième objet de la famille.

**Supprimer une personne** — `deletePerson`, sur `openPersonForDelete`, qui laisse passer une
personne **archivée** (ranger puis effacer est le chemin naturel) là où `openPerson` la refuse. Le
décompte parle — appartenances d'équipe et participations d'activité —, les deux clés `restrict`
décident. Le panneau dit les trois choses qui comptent : le geste ne se défait pas, ses compétences
partent avec elle, et **ce qu'elle a créé reste sans son nom** (`created_by` et `events.actor_id`
sont `set null`).

**La disponibilité déduite** — `lib/availability.ts`, module neuf, une seule autorité pour le
**seuil** : les trois valeurs, les bornes, et la règle. Ce qui entre dans le décompte — ni archivé,
ni terminé — est en revanche posé par **trois lectures de formes différentes** : sous-requête
corrélée dans `listTeam`, regroupement dans `listProjectFormOptions`, filtrage en mémoire dans
`findPersonDetail`. Le compilateur ne les oblige à rien ; ce sont trois témoins de test qui tiennent
l'accord, un par lecture. Il existe parce que **deux** modules de lecture en ont
besoin — `lib/queries/team.ts` et `lib/queries/projects.ts`, qui sert la sélection d'équipe d'un
formulaire — et que le second dépendrait du premier, lequel type-importe déjà le second. `listTeam`
gagne une **troisième lecture fixe** (une sous-requête corrélée, jamais une requête par personne) ;
son filtre `dispo` compare la même sous-requête aux mêmes bornes ; `findPersonDetail` **ne gagne
aucune requête** — elle lit déjà les accompagnements, et `statusNature` suffit à en retirer les
terminés. Migration `0010` : la colonne, son `CHECK` et l'énuméré tombent ensemble.

**La fiche peut lister un accompagnement et dire « Disponible »**, et rien n'a eu à changer pour
cela : chaque ligne de cette liste porte déjà sa pastille de statut. La liste raconte un parcours, la
pastille mesure une charge.

### Ce que la vérification a donné

**Le critère lu dans le HTML servi.** Les pastilles de `/equipe` coïncident personne par personne
avec un décompte calculé séparément en SQL — mesuré avant et après la correction de la base, et
**quatre lignes changent de mot**. Le cas nommé par l'humain se lit entier sur une fiche : Camille
Roux porte « Disponible », et la même fiche liste « Refonte du parcours de virement » avec sa
pastille **Terminé**. Un intervenant côté entité n'en porte aucune. Le panneau de suppression d'un accompagnement annonce **3 activités,
3 ressources, 2 résultats, aucune ligne de journal** : les quatre sont exacts. Ceux des personnes
annoncent **1 / 4 / 3** et **1 / 3 / 4** : exacts tous les six. « Supprimer définitivement » est
servi sur un projet vivant **et** archivé. Le panneau de profil ne sert plus que quatre champs.

**Le HTML servi a trouvé un défaut que rien d'autre n'a vu.** `countProjectContents` tenait d'abord
ses décomptes en `sql` brut : Drizzle n'y qualifie pas les colonnes comme le fait le constructeur de
requêtes, la jointure des résultats est sortie avec un `id` **ambigu**, et le panneau a rendu
**500** — après un `tsc`, un ESLint et 1 226 tests verts. Refait avec la couche.

**Les tests mis en défaut, sept fois.** Seuil `1–2` → `1–1` : trois tests tombent, ceux du seuil.
`isNull(projects.archivedAt)` retiré : deux tombent. `nature <> 'done'` retiré des deux lectures de
`team.ts` : trois tombent ; retiré de `findPersonDetail` **seule** : un seul — celui qui lit la liste
et la pastille ensemble ; retiré de `listProjectFormOptions` **seule** : son témoin propre, et lui
seul. Refus du décompte de `deletePerson` neutralisé : **un seul** tombait d'abord — le second
passait parce que la clé `restrict` refusait à sa place avec un message contenant le même mot.
L'assertion a été resserrée sur « équipe », qui n'appartient qu'au décompte, et les deux tombent.
Porte `manageDomain` de `deleteProject` neutralisée : le test du droit tombe.

**Le contraste vérifié plutôt que mesuré**, et le diff le montre : deux chaînes de classes ajoutées,
toutes deux déjà servies dans le panneau de suppression d'entité dont les nouveaux sont les jumeaux ;
`MENU_ITEM_DANGER` déjà dans ce menu, `ACTION_LINK` déjà cinq fois dans cette carte. Aucun couple
neuf par la position.

**Le droit éprouvé par l'action.** Le contributeur **désigné** — celui qui écrit des activités dans
cet accompagnement — se voit refuser la suppression, et sept tables inchangées le prouvent.
`app/(app)/equipe/actions.test.ts` est **créé** : l'écran portait six actions d'écriture depuis
C5bis sans qu'aucune soit interrogée par son point d'entrée. Son `afterAll` ne dépend pas de la
réussite du `beforeAll` — le point ouvert des trois fichiers fautifs ne gagne pas un quatrième nom.

**Le résultat.** `npx tsc --noEmit`, `npm run lint` (`--max-warnings=0`), `npm run build` et les
**1 227 tests** passent. Une migration (`0010`, première destructive depuis `0001`), appliquée à la branche de test ;
**la base de développement reste à migrer par l'humain**.
