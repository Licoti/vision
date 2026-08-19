# ETAT — Vision

Fichier de contexte de session. Mis à jour par Claude en fin de chaque ticket.

**Dernière mise à jour :** 19/08/2026 — T5bis.4 terminé : la fiche d'une personne, en panneau sur
la page Équipe.
**Chantier en cours :** C5bis — Équipe : référentiel des personnes et des compétences
**Ticket suivant :** **T5bis.5** — le radar des compétences (`tickets-C5bis.md`). **TD.3 est
disponible et ne dépend de rien** (`tickets-TD.md`) : l'ordre entre les deux revient à l'humain.

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
| TD — Couche de présentation | TD.3 → TD.6 | **découpé**, non entamé (`tickets-TD.md`) |
| C5bis — Équipe | T5bis.1 → T5bis.7 | **en cours** — T5bis.4 terminé |
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

- **`SectionHeader` déclare une note et ne la rend jamais.** `components/ui/section.tsx:26` accepte
  une prop `note` qu'aucune ligne n'affiche ; `components/projects/roadmap.tsx:171` lui passe « Le
  récit de l'accompagnement, au mois. », et **cette phrase n'est dans aucun HTML servi**. TypeScript
  se tait, la prop étant déclarée — mais **`npm run lint` le signale depuis toujours**, en unique
  avertissement permanent du dépôt. Deux issues, et le choix est éditorial : **rendre la note**, ce qui
  change le HTML et aligne le composant sur `BlockHeader` ; ou **retirer la prop**, ce qui perd la
  phrase volontairement et fait tomber l'appel à la compilation. → **arbitrage humain avant TD.4.**

### b. Assignés à un ticket

- **Le groupe « Annulé » de la roadmap projet se replie sans marque visible.** Son `<summary>` est
  en `flex`, ce qui retire à `<summary>` le triangle natif du navigateur — le commentaire de
  `components/projects/roadmap.tsx` affirme l'inverse, et c'est lui qui est faux. Rien n'annonce donc
  qu'il y a là quelque chose à déplier. Le rang « Indicateurs associés » a été doté d'un chevron en
  `mark` le 18/08/2026 ; le même geste, cinq lignes, referme celui-ci. Hors périmètre ce jour-là
  (règle 3). → **ticket propre, C7 au plus tard.**
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
- **`Section` et `Block` cohabitent, et les deux pages de détail divergent.** La mise en cohérence
  de la page produit (hors ticket, 17/08/2026) a sorti la coquille et l'en-tête de ses trois blocs
  dans `components/ui/block.tsx` — rayon `3xl`, titre `xl`, note dessous, `gap-5` —, format que les
  maquettes de `docs/design/maquettes/blocs/` donnent aux blocs de cette page. La page projet garde
  `Section` — rayon `xl`, titre `md` — pour ses blocs de référence de `docs/06` §5. Deux blocs de
  même nature n'ont donc pas la même forme selon la page qui les porte. Écart **assumé et borné** :
  la demande portait sur la page produit, et élargir aurait touché des écrans qu'elle ne visait pas
  (règle 3). Ce qui reste à trancher n'est pas technique — les deux composants sont interchangeables
  — mais éditorial : la page projet doit-elle monter au format produit, ou les deux formats
  disent-ils deux rangs de bloc différents ? → **ticket propre, C7 au plus tard.**
- **Le contenu rédigé d'`/a-propos` reste à écrire.** La page a son en-tête et son état vide. Son
  contenu — ce qu'est Vision, le vocabulaire, ce qu'elle ne fait pas, l'état daté — ne demande
  aucune lecture en base. → **ticket propre, C7 au plus tard.**
- **On n'ajoute qu'une personne par enregistrement.** Le bloc d'ajout de T2.6 crée une personne, et
  pour en ajouter deux il faut enregistrer puis rouvrir le formulaire. La limite est écrite dans
  l'écran, et **sa raison a disparu le 14/08** : le champ répétable exigeait le JavaScript que la
  cinquième discipline interdisait. Le découpage de C5bis la referme autrement qu'en la levant :
  l'arbitrage (g) sort la création d'une personne du formulaire de projet, et une limite sur un bloc
  qui n'existe plus n'a plus d'objet. → **T5bis.7.**

- **Le socle couvre dix-sept des quarante composants du design system.** Détail et mesures dans
  `JOURNAL-TECHNIQUE.md` (18/08/2026) : le **bouton** absent et ses trois chaînes recopiées **24
  fois** — dont une dérivée, `app/dev/session/page.tsx:112` —, l'**état vide dans un bloc** en **cinq
  variantes**, le **bandeau d'archivage** dupliqué entre les deux pages de détail, et
  `readings-panel.tsx:42` **redivergé** d'`ACTION_LINK`. La doctrine est tranchée : ce qui manque
  n'est plus une décision, c'est du travail.
  → **TD.3 à TD.6 (`tickets-TD.md`), dans l'ordre TD.3 · TD.5 · TD.4 · TD.6.** TD.6 est le seul qui
  ne retire rien : il **empêche la copie suivante**, faute de quoi les trois autres ne sont qu'un
  nettoyage — `ACTION_LINK`, extrait en TD.1, a redivergé six jours plus tard.
- **La règle 2 n'est pas surveillée sur les espacements.** `--spacing` est un pas et non une échelle :
  Tailwind en dérive n'importe quel multiplicateur, et **une soixantaine de valeurs hors `--number-*`**
  se sont accumulées (`gap-2.5`, `px-2.25`, `mt-3.5`, `top-7.5`…), plus deux dimensions en dur dans
  `indicators.tsx` et un `border-l-3`. Les couleurs, elles, sont structurellement protégées et n'ont
  **aucune** violation. → **TD.5.**

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
- **Le design system a six manques, et aucun n'a été inventé.** (1) Les trois **élévations** et les
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
  T2.3 et il n'y a plus qu'un fichier où l'enfreindre. → **à faire remonter à qui maintient le design
  system.**
- **La création d'un projet n'est pas atomique, et ne peut pas l'être.** `neon-http` n'a pas de
  transaction interactive — la couche n'a que `batch`. La parade est de tout confronter au domaine
  **avant** d'écrire, et d'ordonner les ajouts avant les retraits (T3.6). Reste non refermé : une
  **création** dont l'activité s'écrirait puis dont les participants échoueraient laisserait
  l'activité sans eux. → **le jour où la couche exposera une transaction.**
- **La fixture est incomplète sur les ressources et les résultats.** Les deux résultats factices
  n'ont pas de lien profond, le brief §7 n'en donnant aucun. Trois des quatre ressources du brief ne
  sont pas semées : « Grille d'entretien », « Maquettes v3 » et « Rapport d'audit d'accessibilité »
  attendent une ancre que le brief ne fournit pas. Même silence sur `tools.base_url` et sur les
  courriels des personnes. → **sans échéance, ou l'humain fournit les adresses.**
- **L'amorçage rapproche par clé naturelle, donc un renommage recrée.** Renommer « Espace client
  web » puis relancer `db:seed` crée un second produit sous l'ancien nom. La clé des activités a été
  étendue à `projet · type · période` avant C3, ce qui atténue sans éliminer : deux activités du même
  type sur le même projet **dans le même mois** collisionneraient encore. Sans conséquence en
  production, où l'amorçage ne tourne pas. → **écran de gestion des référentiels (D25, C7).**
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
