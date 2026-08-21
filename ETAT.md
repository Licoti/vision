# ETAT — Vision

Fichier de contexte de session. Mis à jour par Claude en fin de chaque ticket.

**Dernière mise à jour :** 21/08/2026 — le bouton devient un composant à trois rangs, hors
ticket.
**Chantier en cours :** C5bis — Équipe : référentiel des personnes et des compétences
**Ticket suivant :** **T5bis.7** — la sélection d'équipe du formulaire de projet, refondue
(`tickets-C5bis.md`).

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
| TD — Dette technique | TD.1, TD.2 | **terminé** |
| TD — Couche de présentation | TD.3 → TD.6 | **terminé** |
| C5bis — Équipe | T5bis.1 → T5bis.7 | **en cours** — T5bis.6 terminé |
| C6 — Liens et journal | à découper | à faire |
| C7 — Finitions, budget, SSO | à découper | à faire |

**Point de bascule atteint :** C1 à C3 constituent le POC minimal démontrable ; C4 y ajoute la
boucle complète de `docs/05` §2 — saisir, attacher le lien, reporter le résultat.

---

## Journal des tickets

*(une ligne par **chantier clos**, depuis le repliage du 14/08/2026. Les lignes de ticket et le récit
détaillé vivent dans `HISTORIQUE-TICKETS.md` ; les pièges et dettes dans `JOURNAL-TECHNIQUE.md`.)*

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
- **C4bis — Archivage et correction — T4bis.1 → T4bis.6, du 14 au 15/08/2026.** Le chantier que
  `docs/05` §5 n'avait pas prévu, intercalé sans décaler les autres. Six manques refermés sous six
  arbitrages : la matrice « corriger / archiver » est pleine, quatre portes gouvernent les écritures
  de la page projet, et un seul `canWrite` fait tomber sept gestes ensemble. Porte la seule migration
  du chantier — l'unicité partielle du résultat, qui fait de « retirer puis ressaisir » un chemin
  réel.
- **C5 — Indicateurs et lecture dans le temps — T5.1 → T5.6, du 16 au 17/08/2026.** Le bloc en
  lecture, les trois gestes de l'indicateur, ceux du relevé et sa migration, l'adoption depuis
  l'accompagnement, puis les deux couches de la frise du temps long. Le chantier qui répond à la
  question de l'effet dans le temps. Sa propriété la plus payante n'est pas un écran :
  **`timelineScale` recevait une liste de dates depuis T5.5**, si bien que T5.6 y a versé les relevés
  sans qu'un calcul de borne change. **Tout a depuis été refait hors ticket** (17/08/2026) :
  `roadmap.tsx` en HTML filtré par l'URL ; les courbes fusionnées dans `indicators.tsx` avec une
  **North Star** (migration 0003) ; la page réordonnée. `timeline.tsx` et `indicator-curves.tsx`
  n'existent plus. **Neuf dérogations documentaires sont consignées dans `JOURNAL-TECHNIQUE.md`**,
  dont D39 enfreinte sciemment et `docs/06` §6. Récit complet dans `HISTORIQUE-TICKETS.md`.
- **TD — Dette technique — TD.1, le 17/08/2026.** Ticket **hors chantier**, dans la seule fenêtre où
  les fiches n'interdisent plus rien. Huit copies du composant de champ, six coquilles de panneau et
  quatre `ACTION_LINK` deviennent trois fichiers de `components/ui/` : **−644 lignes nettes**, à HTML
  constant sur 26 rendus capturés. Quatre correctifs joints. Sa leçon la plus transportable n'est pas
  dans le code : **un harnais qui poste en urlencoded là où React rend du multipart obtient un 200
  muet**, indiscernable d'un refus sans étape témoin.
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

---

## Points ouverts

*(un point, une destination. Un point qui n'a pas de destination est un point qu'on n'a pas tranché.
Un point qui se referme part dans `HISTORIQUE-TICKETS.md` — il ne reste pas barré ici.)*

### a. À trancher — sinon les tickets suivants héritent du problème

- **Les secrets Neon n'ont jamais été tournés.** Deux chaînes de connexion ont transité en clair
  dans la conversation le 12/08/2026 — la base de développement, puis la branche de test. Elles ne
  sont que dans `.env.local`, hors dépôt, mais restent valides. **Reporté au découpage de C5bis, et
  la raison est qu'il ne dépend pas de nous** : rien dans les sept fiches ne change selon que les
  chaînes sont tournées ou non. → **action humaine.**

- **Rétablir un accompagnement sous un produit archivé le laisse invisible.** L'arbitrage (e)
  n'autorise l'archivage d'un produit que si tous ses accompagnements sont archivés : « produit rangé,
  accompagnements rangés » est donc l'état courant. En rétablir un depuis sa page donne un projet
  vivant qu'aucune liste n'affiche, les deux jointures écartant les projets d'un produit archivé — le
  geste paraît ne rien faire. Arbitrage du 15/08/2026, tranché avant écriture : **aucun garde-fou**,
  l'arbitrage (f) posant qu'il n'y a pas de cascade et le chantier interdisant d'en ouvrir un
  septième en cours de ticket. Rien n'est perdu ; le geste est trompeur.
  → **ticket propre, C7 au plus tard** — vérifié aux découpages de C5 puis de C5bis : aucune de leurs
  fiches n'ouvre `archiveProject` ni `restoreProject`. T5bis.6 archive une **personne**, ce qui ne
  cascade sur rien (arbitrage (e)) et laisse ce point où il est.

- **Le chemin du clic de `/equipe` n'a pas été parcouru au navigateur.** T5bis.4 demandait deux
  vérifications séparées, et une seule a pu être faite : le chemin de l'**adresse** est lu dans le
  HTML servi, le chemin du **clic** ne l'est pas — aucun navigateur pilotable n'était disponible
  dans la session du 19/08/2026. Les cinq propriétés en attente sont celles de `DrawerHost` et non
  de ce ticket — coquille présente avant le corps, une seule requête réseau, URL immobile,
  défilement conservé, focus qui entre sur la croix et revient au déclencheur —, et **TD.2 les a
  toutes éprouvées** le 18/08/2026 sur les deux premières pages hôtes ; `components/ui/drawer.tsx`
  n'a pas changé d'une ligne depuis. Ce qui reste à confirmer est donc que `/equipe` s'y branche
  comme les deux autres, ce qu'un clic sur une ligne suffit à voir. → **action humaine, un clic.**


### b. Assignés à un ticket

- **Une piste de démarrage ne mène pas à l'activité qu'elle suggère.** Le bloc du 20/08/2026 renvoie
  vers la plateforme et vers son propre texte ; il ne propose pas d'ouvrir le panneau d'activité
  pré-réglé sur le type correspondant — « Audit UX » la piste et « Audit UX » le type d'activité sont
  deux objets que rien ne relie. Le geste n'était pas demandé (règle 3), et `starters` ne porte
  **volontairement aucun `activity_type_id`** : une colonne sans lecteur est celle qu'on relit un
  jour sans savoir pourquoi (leçon de T5.2). Le jour où le geste est voulu, c'est une colonne de plus
  et trois lignes dans le composant. À joindre alors au point voisin sur
  `activity_types.default_tool_id`, qui attend le même panneau. → **ticket propre, C7 au plus tard.**
- **`project_indicators.note` n'a ni écrivain ni lecteur.** La colonne existe depuis T1.2, `docs/04`
  §3 la décrit « texte court », et le panneau d'adoption de T5.4 ne la saisit pas : sa fiche énumère
  ce qu'une ligne du bloc dit et n'en parle nulle part. Arbitrage tranché avant écriture le
  16/08/2026 : **quatre champs, pas un cinquième**, règle 3 et leçon de T5.2 — une colonne écrite
  sans lecteur est une colonne qu'on relit un jour sans savoir pourquoi. Le geste manquant est donc
  **une phrase sur le pourquoi d'une cible**, et il se juge à l'usage, pas au schéma.
  → **ticket propre, C7 au plus tard ; ou jamais, si personne ne la réclame.**
- **L'outil par défaut d'un type d'activité ne présélectionne rien.** `activity_types.default_tool_id`
  existe depuis T1.2, `docs/04` §2 le dit « habituellement associé », et la fixture le pose sur les
  deux types d'audit du brief. Le panneau de T4.4 ne l'a pas lu — la fiche ne le demandait pas,
  règle 3. Trois lignes suffiraient, et la colonne n'a **aucun lecteur**. → **ticket propre, C7 au
  plus tard** (destination posée le 14/08/2026, confirmée au découpage de C5 : aucune de ses six
  fiches n'ouvre `activity-panel.tsx`).
- **La coquille de navigation reste focalisable derrière le voile, sans JavaScript.** La page porte
  `inert` quand un panneau est ouvert, mais la barre latérale vit dans `app/(app)/layout.tsx`. Avec
  JavaScript, `FocusTrap` la met hors d'atteinte et `aria-modal` la retire de l'arbre
  d'accessibilité ; sans JavaScript, le cycle de tabulation passe par elle.
  **L'obstacle a changé de nature en TD.2** : ce n'était pas un choix mais une impossibilité — un
  layout Next ne reçoit pas les `searchParams`, et l'ouverture était un `searchParam`. Elle est
  maintenant un **état client**, que rien n'empêche de remonter dans le layout : `DrawerHost` y
  poserait `inert` sur la barre comme sur le contenu. Ce n'est plus une limite, c'est un ticket —
  laissé de côté par la règle 3, TD.2 ne visant pas la coquille applicative.
  À joindre au **rebranchement des deux blocs manquants de la barre latérale** — carte de la personne
  courante et entrée Administration, écartés en T1.6 faute de droit de lire la session. L'obstacle a
  disparu : les écrans lisent la session depuis T2.1 et `can.manageDomain` depuis T2.5. Ce qui manque
  n'est plus un droit, c'est un ticket. → **ticket barre latérale, C7 ou plus tôt.**
- **Deux colonnes saisies ne s'affichent nulle part** — moitié refermée par T5bis.2, dont la liste
  Équipe porte la mention « côté entité ». Restent `products.kind` (D10), saisi depuis T2.5 et lu par
  aucun écran ; et `persons.kind` sur les deux lectures de projet — `listProductProjects` et la liste
  transverse — qui affichent tous les membres à l'identique faute de remonter la colonne.
  → **ticket propre, C7** (destination du 14/08/2026, confirmée aux découpages de C5 et de C5bis).
- **« Voir le journal » est dessiné sans être un lien.** La reprise de `project-v2` (20/08/2026)
  garde ce seul point d'entrée des cinq gestes que la maquette invente : c'est un `<span>` dans un
  `<p>`, ni focalisable ni annoncé comme un lien, portant « — à venir » en `sr-only`. Dette
  d'interface **assumée et bornée** — un libellé qui ressemble à un geste et n'en est pas un —,
  arbitrée avec l'humain. Elle se referme d'un `href` le jour où le journal a son écran.
  → **C6.**
- **Le groupe « Annulé » n'est plus replié par défaut.** La roadmap en liste à plat (20/08/2026) l'a
  fait disparaître avec les quatre autres intertitres : une activité annulée est désormais une
  entrée comme les autres, atteignable par sa pastille de filtre. `docs/03` §6 demande « en retrait,
  replié par défaut » ; le retrait tient — ton neutre, pastille grise, dernier de l'ordre — mais le
  repli, non. **Ce point remplace celui du `<summary>` sans marque visible**, qui portait sur un
  `<details>` qui n'existe plus. → **ticket propre, C7 au plus tard.**
- **La barre d'ancres de la page projet n'a pas d'entrée active.** Elle demanderait un observateur
  d'intersection, donc un composant client, pour une information décorative (20/08/2026). Le jour où
  un second écran veut une barre d'ancres, la question se repose une fois pour les deux.
  → **ticket barre latérale, C7 ou plus tôt** — même famille de coquille.
- **Le contenu rédigé d'`/a-propos` reste à écrire.** La page a son en-tête et son état vide. Son
  contenu — ce qu'est Vision, le vocabulaire, ce qu'elle ne fait pas, l'état daté — ne demande
  aucune lecture en base. → **ticket propre, C7 au plus tard.**
- **On n'ajoute qu'une personne par enregistrement.** Le bloc d'ajout de T2.6 crée une personne, et
  pour en ajouter deux il faut enregistrer puis rouvrir le formulaire. La limite est écrite dans
  l'écran, et **sa raison a disparu le 14/08** : le champ répétable exigeait le JavaScript que la
  cinquième discipline interdisait. Le découpage de C5bis la referme autrement qu'en la levant :
  l'arbitrage (g) sort la création d'une personne du formulaire de projet, et une limite sur un bloc
  qui n'existe plus n'a plus d'objet. → **T5bis.7.**

- **Corriger une personne du centre en intervenant côté entité lui laisse ses compétences.**
  `parsePersonForm` efface la disponibilité quand le genre devient `stakeholder` — sans ce `null`
  explicite, le `CHECK` `persons_availability_requires_center` refuserait l'écriture. Rien
  d'équivalent n'existe pour `person_skills`, qui ne porte aucune contrainte sur le genre de sa
  personne : les liaisons restent affichées, et deviennent **illisibles en écriture** —
  `openPersonForSkill` refuse d'y toucher, l'écran cesse d'en proposer les gestes. Refuser le
  changement de genre ou retirer les liaisons en cascade sont deux gestes que la fiche de T5bis.6 ne
  demandait pas (règle 3), et le second serait une cascade, que l'arbitrage (f) de C4bis écarte.
  Aucune donnée n'est perdue ; l'état est incohérent avec l'arbitrage (d), qu'il n'a pas les moyens
  de tenir. → **ticket propre, C7 au plus tard.**
- **`PERSON_KIND_LABEL` existe en deux exemplaires, et ils ne disent pas la même chose.** Le point
  était « une constante mal placée » ; il est **récrit le 20/08/2026** après mesure, et c'est autre
  chose. `lib/forms/project.ts:28` dit « Côté centre de compétence » / « Côté entité » ;
  `lib/forms/person.ts:64` dit « Membre du centre » / « Intervenant côté entité ». Les réunir dans
  `lib/format.ts` — où vivent `formatIndicatorDirection`, `formatResourceType` et désormais
  `formatStarterKind` — n'est donc **pas un déplacement, c'est trancher un vocabulaire** : deux
  écrans changeraient de mots. Le bloc « Démarrage » a ouvert `lib/format.ts` et n'a pas fait ce
  geste, qui n'est pas technique. → **arbitrage éditorial, puis un ticket propre, C7 au plus tard.**
- **`uiLayerSeal` ne scelle pas `components/shell/`.** Les trois groupes interdits sont ceux que la
  fiche de TD.6 énumère ; la coquille applicative — `breadcrumb.tsx`, `main-nav.tsx` — n'y est pas,
  et rien n'empêcherait `components/ui/` de l'importer. La propriété est vraie aujourd'hui, donc ce
  n'est pas une régression : c'est un trou dans le scellement, et il se comble en une ligne.
  → **au prochain ticket qui ouvre `eslint.config.mjs`.**
- **Les deux use cases de la fixture n'ont aucun persona rattaché.** `scripts/seed.ts` ne sème
  aucun persona — la table n'y figure pas depuis le bloc du 18/08/2026 —, si bien que le
  rattachement d'un use case n'est pas amorçable. Ce n'est pas un défaut : le rattachement est
  facultatif (arbitrage du 19/08/2026), et le lien a été éprouvé à la main par sonde scopée. Ce qui
  manque est un **jeu d'essai**, pas du code. Semer des personae aurait ouvert le bloc voisin
  (règle 3). → **au prochain ticket qui sème des personae, y joindre deux rattachements.**
- **Cinq états vides ne se lisent dans aucun HTML servi, faute de données qui les atteignent.**
  Relevé en mesurant TD.4 : le relevé absent d'une North Star et sa cible absente
  (`indicators.tsx`), la carte d'indicateur sans relevé, le panneau « Gérer les relevés » vide, et la
  personne qui n'est dans aucune équipe (`person-detail.tsx`). Les deux indicateurs vivants du
  domaine portent des relevés et une cible ; le seul indicateur sans relevé est archivé, et la seule
  personne sans équipe n'entre pas dans la liste Équipe. **Le code de ces cinq branches a changé
  comme les autres, mais leur rendu n'a pas été vu** — ce n'est pas une dette de code, c'est un trou
  de jeu d'essai. **La sonde assumée a désormais son précédent** (20/08/2026) : le bloc « Démarrage »
  a servi sa troisième branche de panneau en pointant une piste vers l'outil sans adresse, l'a lue,
  puis a rétabli la ligne et supprimé le script — aucune ligne de sonde ne reste, la sonde ayant
  modifié une ligne existante au lieu d'en créer une. → **à couvrir par la fixture, ou par une sonde
  de cette forme, au prochain ticket qui écrit en base.**

- **Deux capacités du bouton n'ont aucun appelant, et c'est une entorse assumée.** L'en-tête de
  `components/ui/button.tsx` pose depuis TD.3 qu'« un composant de socle qui porte une variante sans
  appelant est une variante que le suivant emploiera de travers ». Le rang `tertiary` et les props
  `icon` / `iconSide` / `label` de `Button` l'enfreignent : **zéro point d'appel** au 21/08/2026. Ils
  sont l'objet même de la demande — trois rangs, une icône plaçable — et les livrer sans eux aurait
  été livrer autre chose. Les deux sont **éprouvés par sonde** : le tertiaire lu dans le HTML servi,
  les quatre formes de `Button` passées à `tsc`. Le premier appelant naturel du tertiaire est le
  « Annuler » des quatre pieds de formulaire, aujourd'hui en `ACTION_LINK_SM` — hors périmètre ce
  jour-là. → **au prochain ticket qui ouvre un pied de formulaire.**

- **`disabled:opacity-60` est servi sur onze balises qui ne peuvent pas être désactivées.** Il vit
  dans les trois chaînes de variante, donc aussi sur les `<a>`, `<Link>` et `<DrawerLink>` qui
  portent un bouton — où `&:disabled` ne s'appliquera jamais. L'alternative était de le laisser au
  point d'appel, ce que ce travail vient précisément de retirer : il y était recopié quatre fois.
  Le coût est de vingt-trois caractères par balise dans le HTML servi ; le bénéfice est une seule
  source pour l'état désactivé. → **sans échéance.**

### c. Dettes assumées, sans échéance

- **La page produit porte deux langages d'en-tête.** « Vision produit » a pris le surtitre en
  capitales et le kebab en absolu de `northstar-v2` (18/08/2026) ; « Accompagnements en cours » et
  « Tous les accompagnements » gardent `BlockHeader` — titre de plein rang, note dessous, action à
  droite. C'est l'unification du 17/08 défaite pour un bloc sur trois, sur demande et en
  connaissance de cause. Le jour où un second bloc reprend le surtitre, `Eyebrow` quitte
  `indicators.tsx` pour `components/ui/block.tsx`. → **arbitrage humain, pas un ticket.**

- **Une carte ne se détache d'aucun fond, et c'est le design system qui manque.** Trois positions,
  un seul manque. La North Star d'abord : la maquette sépare la carte (`#ffffff`) du bloc
  (`#eef2fb`) à 1,12:1, nos jetons donnent 1,04:1, et **c'est la bordure qui la rend lisible** —
  1,33:1 contre l'intérieur, 1,28:1 contre le bloc. Les cartes de personae ensuite (18/08/2026), qui
  posent le même problème sur la tonalité neutre : **aucun fond disponible ne les détache** —
  `surface-neutral-lightest` sur `surface-neutral-pale` donne 1,05:1 —, si bien qu'elles n'en
  portent aucun et que **le filet seul fait la carte**, à 1,17:1. **Le panneau enfin** (T5bis.4,
  19/08/2026) : sur `surface-neutral-pale` (`#fdfdfd`), le fond du tiroir, le filet
  `surface-neutral-lighter` mesure **1,24:1** — la même situation, à sa troisième position, et le
  fond le plus franc que le panneau pourrait porter n'y changerait rien. C'est le couple de
  `Section`, de `Block` et d'`EmptyState` : rien de neuf n'a été introduit, et rien de plus sombre
  n'existe — le plus franc des `surface-neutral-*` plafonne à 2,22:1, toujours sous la limite de
  3:1. Aucun jeton ne porte le bleu intermédiaire non plus : `midnight-150` (`#e4ecf8`) est une
  primitive que la couche sémantique §2.1 n'utilise nulle part. Le combler serait ajouter des jetons
  au design system, hors du périmètre d'une reprise de bloc comme d'une fiche. **Tous les couples de
  texte, eux, sont mesurés au-dessus de 4,5:1** — le plus bas, dans le panneau de T5bis.4, est à
  4,98:1. → **arbitrage humain, sinon C7.**

- **Sans JavaScript, les gestes d'une carte de roadmap ne sont plus atteignables.** Le menu « … »
  décide lui-même de son ouverture (`useState`), seule exception arbitrée à D30 — élargie le
  17/08/2026 du bloc North Star aux cartes d'activité, où elle coûte plus cher : là, chaque geste
  gardait son URL ; ici « Modifier », « Saisir un résultat » et « Annuler l'activité » en ont une, mais
  les **quatre actions serveur** — les deux « Marquer », les deux « Archiver » — n'ont aucun repli,
  leurs formulaires n'étant pas dans le HTML servi mais seulement dans la charge RSC. Refermer le
  point demanderait un menu `<details>` natif — qui perdrait `Échap`, le clic extérieur et
  `role="menu"` — ou une URL par geste. Ni l'un ni l'autre ne se décide en cours de travail. Même
  endroit, même famille : `role="menuitem"` est porté par un bouton qu'un `<form>` sépare de son
  `role="menu"`, dette reprise d'`indicators.tsx` plutôt que d'inventer une seconde manière de
  soumettre. → **sans échéance.**

- **La base de développement a dérivé de la fixture, et c'est acté.** **Règle du 14/08/2026 : elle
  est jetable** — la règle 4 protège la donnée métier, pas une fixture locale. Trois conséquences :
  un critère de ticket passé ne s'y relit pas nécessairement (T2.1 à T2.4 se lisaient sur
  « 2 accompagnements », il y en a 4) et ce n'est pas un défaut ; c'est ce qui autorise à y écrire à
  la main pour éprouver un critère ; et **une comparaison avant/après n'y est un instrument que si
  les données n'ont pas bougé entre les deux mesures** — TD.1 a vu un indicateur créé au navigateur
  pendant sa capture, et a dû la refaire par `git stash`. La dérive au 17/08/2026 tient en une
  phrase : tout ce qu'aucun `db:seed` ne connaît, essentiellement des lignes de sonde et des
  archivages de tickets passés, TD.1 comprise — dont les sondes sont **archivées et non supprimées**,
  le typage d'`unlink` refusant une table à `archived_at`. Il n'existe **pas de `db:reset`**,
  `db:seed` ignorant ce qu'il n'a pas semé. → **sans échéance ; un ticket d'outillage si le besoin
  devient réel.**
- **Le design system a huit manques, et aucun n'a été inventé.** (1) Les trois **élévations** et les
  deux **gradients** sont nommés sans valeur. (2) Aucun jeton de **bordure de contrôle** : le plus
  sombre des `border-*` ne dépasse pas 1,2:1 là où la limite d'un composant se mesure à 3:1.
  (3) Aucun jeton de **bordure d'erreur**. (4) Aucun jeton d'**interlettrage** : les capitales des
  maquettes portent `.04em`, rendues sans. (5) Aucune **surface de voile** au-delà de 40 % — un
  voile qui porterait seul la séparation d'un panneau laisse sa surface à 2,66:1, mesuré.
  (6) Aucun jeton de **séparateur**. (7) Aucun jeton de **mouvement** — ni durée, ni courbe : il n'y
  avait rien à animer avant TD.2. `--duration-drawer` et `--easing-drawer` sont posés dans
  `app/tokens.css`, à la place des autres et non dans un composant, avec leur repli
  `prefers-reduced-motion`. Le manque est réel, le contournement est nommé.
  **Substituts en vigueur, tous mesurés**, et **désormais à un seul endroit** : TD.1 les a réunis dans
  `components/ui/form-field.tsx` et `components/ui/panel.tsx` — `content-neutral-normal` (3,88:1) pour
  une bordure de contrôle, `content-danger-base` (5,19:1) pour un champ en erreur,
  `content-neutral-dark` (3,05:1 contre le voile) pour le filet du panneau, `content-neutral-base`
  (4,98:1) pour un séparateur. **Règle : aucun septième substitut ne s'invente** ; elle tient depuis
  T2.3 et il n'y a plus qu'un fichier où l'enfreindre. **(8) L'échelle `--number-*` s'arrête à
  100 px**, relevé en mesurant TD.5 : le pas de 4 px se prolonge sans jeton nommé, et **dix-neuf
  valeurs légitimes vivent au-delà**, de `w-28` (112 px) à `max-w-310` (1 240 px) — toutes les
  largeurs de colonne, de panneau et de gouttière de l'application. Le pas est tenu, la liste ne va
  pas jusque-là ; `spacingScaleLock` surveille donc le **pas**, pas l'appartenance à la liste. → **à faire remonter à qui maintient le design
  system.**

- **Deux gabarits de grille portent une dimension en dur, et c'est un arbitrage, pas un oubli.**
  `indicators.tsx:495` (`minmax(300px,1fr)`) et `:585` (`grid-cols-[20rem_1fr]`) disent à quelle
  largeur une carte cesse de tenir — un **point d'arrêt de mise en page**, pas une valeur de thème
  (arbitrage du journal de T1.6, que la fiche de TD.5 reprend déjà pour `flex-[1.4]`). Ils sont donc
  hors de la clause 2 de `spacingScaleLock` **par construction** : elle ne porte que sur les
  utilitaires de dimension, jamais sur `grid-cols-` ni sur `flex-`. **Le pas, lui, les atteindrait** —
  300 px et 320 px valent 75 et 80 fois 4 px —, mais aucun jeton **nommé** ne va si loin (manque (8)
  ci-dessus), et surtout la question n'est pas là : ce qu'on écrit ici n'est pas un espacement, c'est
  la largeur sous laquelle une carte cesse de tenir. → **à reposer si le design system s'enrichit
  d'une grille.**
- **La création d'un projet n'est pas atomique, et ne peut pas l'être.** `neon-http` n'a pas de
  transaction interactive — la couche n'a que `batch`. La parade est de tout confronter au domaine
  **avant** d'écrire, et d'ordonner les ajouts avant les retraits (T3.6). Reste non refermé : une
  **création** dont l'activité s'écrirait puis dont les participants échoueraient laisserait
  l'activité sans eux. → **le jour où la couche exposera une transaction.**
- **La fixture est incomplète sur les ressources et les résultats.** Les deux résultats factices
  n'ont pas de lien profond, le brief §7 n'en donnant aucun. Trois des quatre ressources du brief ne
  sont pas semées : « Grille d'entretien », « Maquettes v3 » et « Rapport d'audit d'accessibilité »
  attendent une ancre que le brief ne fournit pas. Même silence sur les courriels des personnes.
  **`tools.base_url` sort de cette liste le 20/08/2026 et entre dans une autre** : trois adresses y
  sont posées, sur le domaine réservé `example.com`, pour que le bloc « Démarrage » ouvre quelque
  chose. Elles sont **provisoires par construction** et se remplacent par une ligne de `scripts/seed.ts`
  le jour où les vraies sont connues. → **sans échéance, ou l'humain fournit les adresses.**
- **L'amorçage rapproche par clé naturelle, donc un renommage recrée — et c'est arrivé.** Renommer
  « Espace client web » puis relancer `db:seed` crée un second produit sous l'ancien nom. La clé des
  activités a été étendue à `projet · type · période` avant C3, ce qui atténue sans éliminer : deux
  activités du même type sur le même projet **dans le même mois** collisionneraient encore. Le
  20/08/2026, le bloc « Démarrage » a renommé l'outil « Audit d'accessibilité » en **« Everyone »** :
  la base de développement porte désormais les deux lignes — la neuve, que le type d'activité et le
  résultat semés référencent ; l'ancienne, orpheline et non archivée. Le cas n'est donc plus
  théorique, et il reste sans conséquence en production, où l'amorçage ne tourne pas.
  → **écran de gestion des référentiels (D25, C7).**
- **Les filtres ne survivent pas à un aller-retour par la navigation principale.** `docs/06` §9 les
  veut conservés. Ils vivent dans l'URL, donc le retour navigateur les restitue ; un clic sur
  « Projets » dans la barre latérale repart à zéro. Mémoriser l'URL de retour demanderait un état de
  session. → **si l'usage le réclame.**
- **La liste transverse n'est ni paginée ni plafonnée.** `docs/06` §4 la projette « à quinze puis
  cinquante projets », ce qu'une page rend sans effort. Au-delà, un plafond avant une pagination : la
  comparaison ligne à ligne est le but de l'écran. → **si l'usage le réclame.**
- **Une activité `in_progress` porte une fin de période à venir.** La fraîcheur retient
  `max(coalesce(period_end, period_start))` : pour un atelier en cours en août, c'est le 31 août. Au
  mois, l'affichage reste juste. Ce qui déclenchera reste une **période d'activité** au jour. → **ce
  jour-là.**

---

## Rappels de contexte

- **Un argument lié à une action serveur n'est pas un secret.** `bind(null, project.id)` fait sortir
  l'identifiant de la saisie, mais Next le sérialise dans un champ `$ACTION_…` du balisage, **en
  clair en développement**, et une soumission peut le réécrire. **Règle : une action ne tire jamais
  une autorisation de la valeur qu'on lui a liée.** Elle interroge le droit sur la valeur **reçue**.
  Éprouvée en T3.3, T3.4 et T4.2, où le `projectId` lié à `createResource` s'est lu en clair dans le
  champ `$ACTION_13:1` du balisage servi. Vaut pour les six tickets de C4bis, dont c'est le critère
  central : **le droit s'éprouve par l'action, jamais par l'écran.**
- **Le panneau s'ouvre côté client depuis TD.2, et son corps reste rendu sur le serveur.** Une
  fonction `"use server"` renvoie un `ReactNode` : les droits se dérivent sur le serveur, les actions
  s'y lient, les lectures conditionnelles y restent, et `readings-panel.tsx` comme
  `persona-detail.tsx` demeurent des composants serveur. Ce qui a bougé est le **mécanisme
  d'ouverture**, pas la nature du contenu. Les URL d'ouverture restent des adresses valides et
  passent par la même résolution que le clic — `lib/drawers/{product,project}.tsx` —, si bien
  qu'aucune règle de droit ne vit à deux endroits ; éprouvé en frappant la fonction serveur sous
  quatre identités.
- **Le domaine courant est le premier domaine actif trouvé en base.** Pas de variable
  d'environnement : `docs/05` §3 pose un domaine unique. Le jour où un second existe, le choix
  revient au fournisseur d'identité.
- **`/dev/session` est une route de développement**, rendue 404 en production, reliée à aucune
  navigation. Elle disparaîtra avec le stub en C7.
- **L'authentification est un stub jusqu'en C7**, mais le contexte de session a sa forme finale.
  `lib/auth/provider.ts` est le seul fichier que C7 réécrit.
- **Les maquettes `docs/design/maquettes/` sont une référence visuelle**, jamais branchées.
- **Le levier n'est pas le modèle mais les quatre disciplines de vérification** — le relevé des
  modèles employés ticket par ticket est dans `HISTORIQUE-TICKETS.md`.
