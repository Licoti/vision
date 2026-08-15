# ETAT — Vision

Fichier de contexte de session. Mis à jour par Claude en fin de chaque ticket.

**Dernière mise à jour :** 15/08/2026 — T4bis.6 livré, quatre disciplines jouées. C4bis est terminé.
**Chantier en cours :** aucun — C4bis clos, ses six tickets livrés
**Ticket suivant :** session de découpage de C5 — indicateurs et temps long

---

## Avancement

| Chantier | Tickets | État |
|---|---|---|
| C1 — Socle technique | T1.1 → T1.6 | **terminé** |
| C2 — Produits et projets | T2.1 → T2.6 | **terminé** |
| C3 — Activités et roadmap | T3.1 → T3.6 | **terminé** |
| C4 — Ressources et résultats | T4.1 → T4.4 | **terminé** |
| C4bis — Archivage et correction | T4bis.1 → T4bis.6 | **terminé** |
| C5 — Indicateurs et temps long | à découper | à faire |
| C6 — Liens et journal | à découper | à faire |
| C7 — Finitions, budget, SSO | à découper | à faire |

**Point de bascule atteint :** C1 à C3 constituent le POC minimal démontrable ; C4 y ajoute la
boucle complète de `docs/05` §2 — saisir, attacher le lien, reporter le résultat.

**Sur C4bis, désormais clos.** `docs/05` §5 n'avait prévu ni l'archivage ni la correction ; le
chantier s'est intercalé **sans décaler les autres** — C5, C6 et C7 gardent le sens que `docs/05`
leur donne, « C7 » étant écrit dans D25, D28 et D37 que la règle 6 interdit de rouvrir.

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

**C4bis — en cours** *(une ligne par ticket jusqu'au repliage du chantier)*

- **T4bis.1 — 14/08/2026 — ce qu'un formulaire fait d'une valeur archivée.** Écart déclaré et
  tranché avec l'humain avant écriture : `app/(app)/projets/actions.ts`, sans quoi le critère de
  re-soumission de la fiche ne pouvait pas se lire.
- **T4bis.2 — 14/08/2026 — archiver un produit, et le rétablir.** Écart déclaré et tranché avant
  écriture : `lib/db/scoped.ts` et ses tests, pour `restore()` et rien d'autre — sans lui,
  « Rétablir » n'avait aucun chemin. Ses vérifications, non exécutées le jour même, ont été jouées
  en tête de T4bis.3 pour ce qui est mécanisable.
- **T4bis.3 — 15/08/2026 — archiver un accompagnement, et la lecture seule qui va avec.** Aucun
  écart de périmètre. Trois arbitrages tranchés avant écriture : `updateProject` refuse le projet
  archivé reçu ; aucun garde-fou au rétablissement sous un produit archivé ; le trou `createProject`
  reste ouvert. Les quatre disciplines jouées, dont sept charges repostées refusées puis, les mêmes
  non retouchées, acceptées après rétablissement.
- **T4bis.4 — 15/08/2026 — archiver une activité saisie par erreur.** Aucun écart de périmètre, cinq
  fichiers pour cinq annoncés. Trois arbitrages tranchés avant écriture : le geste **disparaît** de
  l'entrée qui porte un résultat et l'action refuse en silence ; il traverse les **cinq** groupes,
  « Annulé » compris ; il se lit « Archiver la saisie », pour ne pas se confondre avec « Annuler ».
  `openActivity` a porté les quatre contrôles sans être modifiée. Les quatre disciplines jouées, dont
  la fraîcheur du produit lue changer dans `/produits` — octobre puis août 2026 — et quatre refus
  éprouvés séparément.
- **T4bis.5 — 15/08/2026 — corriger et retirer une ressource.** Aucun écart de périmètre, neuf
  fichiers pour les sept annoncés plus leurs deux tests. Deux arbitrages tranchés avant écriture :
  l'écran dit « Modifier » et « Archiver », aucun verbe neuf ; l'exception nominative couvre
  l'activité **annulée** autant que l'archivée, sans quoi une re-soumission détachait la ressource en
  silence. Les quatre disciplines jouées, dont six charges repostées refusées base comptée avant et
  après, et le tour complet à l'identique relu en base — `activity_id` inchangé. **La mise en défaut
  a servi** : retirer `filter(activities)` de `findResourceActivity` ne faisait tomber aucun test, les
  deux filtres de domaine se rattrapant ; un test isolant a été ajouté avant de croire la discipline.
- **T4bis.6 — 15/08/2026 — corriger et retirer un résultat, et sa migration.** Aucun écart de
  périmètre, dix fichiers pour les huit annoncés plus leurs deux tests. **Première migration depuis
  T1.2** : `results_activity_unique` devient un index **partiel**, `where archived_at is null`, sans
  changer de nom ; `drizzle-kit` a rendu le `DROP CONSTRAINT` avant le `CREATE UNIQUE INDEX`, l'ordre
  qu'il fallait. Quatre arbitrages tranchés avant écriture : nom d'index conservé ; « Corriger le
  résultat » et « Archiver le résultat » à l'écran ; les deux gestes suivent **le résultat**, non le
  groupe « Terminé » qu'une période corrigée peut quitter ; « 62.0000 » se retape « 62 ». Le
  `includeArchived` de `checkResultActivity` s'est relu avec la migration, comme la fiche l'exigeait.
  Quatre disciplines jouées, dont **la ressaisie après retrait lue à l'écran** — le critère qui
  n'existait pas avant ce ticket —, six charges forgées refusées base comptée, et deux charges
  récoltées **avant** archivage du projet refusées après puis acceptées non retouchées après
  rétablissement. **Mise en défaut portée trois fois** : contrainte totale rétablie, `keepToolId`
  neutralisée, filtre de domaine de `tools` neutralisé — chacune fait tomber le seul test qui l'isole.

---

## Points ouverts

*(un point, une destination. Un point qui n'a pas de destination est un point qu'on n'a pas tranché.
Un point qui se referme part dans `HISTORIQUE-TICKETS.md` — il ne reste pas barré ici.)*

### a. À trancher — sinon les tickets suivants héritent du problème

- **Les secrets Neon n'ont jamais été tournés.** Deux chaînes de connexion ont transité en clair
  dans la conversation le 12/08/2026 — la base de développement, puis la branche de test. Elles ne
  sont que dans `.env.local`, hors dépôt, mais restent valides. → **action humaine.**

- **Le parcours d'archivage d'un produit n'a jamais été joué à l'écran.** T4bis.3 a lancé les
  commandes que T4bis.2 n'avait pas pu lancer — `tsc`, `lint`, `vitest` (379 verts), `next dev` — et
  a mis en défaut le `select` de `findProjectDetail`. Ce qu'aucune commande ne joue reste dû, et ne
  concerne que le **produit** : le parcours archiver / rétablir depuis sa page, `/produits/{id}/modifier`
  en 404, `updateProduct` reposté après archivage, `archiveProduct` et `restoreProduct` sous le cookie
  d'un membre, et surtout le **refus (e) dont le message doit dire combien** — le seul de C4bis qui
  n'ait aucun équivalent côté projet. Le protocole de re-soumission de T4bis.3 s'y transpose tel quel
  (`JOURNAL-TECHNIQUE.md`). → **à jouer à la première session qui ouvre `produits/`.**

- **Rétablir un accompagnement sous un produit archivé le laisse invisible.** L'arbitrage (e)
  n'autorise l'archivage d'un produit que si tous ses accompagnements sont archivés : « produit rangé,
  accompagnements rangés » est donc l'état courant. En rétablir un depuis sa page donne un projet
  vivant qu'aucune liste n'affiche, les deux jointures écartant les projets d'un produit archivé — le
  geste paraît ne rien faire. Arbitrage du 15/08/2026, tranché avant écriture : **aucun garde-fou**,
  l'arbitrage (f) posant qu'il n'y a pas de cascade et le chantier interdisant d'en ouvrir un
  septième en cours de ticket. Rien n'est perdu ; le geste est trompeur.
  → **ticket propre, C7 au plus tard** — aucun ticket de C4bis, C5 ni C6 ne touche ce couple.

### b. Assignés à un ticket

- **C4bis est livré en entier, et la matrice « corriger / archiver » est pleine.** Les six manques
  sont refermés par six tickets, sous les six arbitrages rendus avant écriture. Quatre portes
  gouvernent désormais les écritures de la page projet — `openProject`, `openActivity`,
  `openResource`, `openResult` — et le même `canWrite` fait tomber sept gestes ensemble. T4bis.6 a
  porté la seule migration du chantier : « retirer puis ressaisir » est un chemin réel, pour le
  résultat comme pour l'activité qui le portait.
  → **repliage dû à la session de découpage de C5** : les six lignes de ticket ci-dessus partent
  alors dans `HISTORIQUE-TICKETS.md`, ce point sort d'ici, et **ETAT.md repasse sous 250 lignes** —
  il les dépasse depuis ce ticket, et seul le repliage peut le corriger (règle du protocole).
- **`createProject` accepte encore un produit archivé.** Le formulaire ne le propose plus et la page
  produit n'y mène plus, mais l'action ne relit pas l'`archived_at` du produit **reçu** : une
  soumission forgée rattacherait un accompagnement neuf à un produit rangé, invisible partout. Relevé
  par T4bis.2, non refermé par T4bis.3 malgré le fichier ouvert — sa fiche porte l'interdit « ce
  ticket ne rouvre pas T4bis.2 », règle 3, arbitrage tranché le 15/08/2026.
  → **le prochain ticket qui ouvre `app/(app)/projets/actions.ts` sans que sa fiche l'en empêche ;
  C7 au plus tard.**
- **L'outil par défaut d'un type d'activité ne présélectionne rien.** `activity_types.default_tool_id`
  existe depuis T1.2, `docs/04` §2 le dit « habituellement associé », et la fixture le pose sur les
  deux types d'audit du brief. Le panneau de T4.4 ne l'a pas lu — la fiche ne le demandait pas,
  règle 3. Trois lignes suffiraient, et la colonne n'a **aucun lecteur**. → **ticket propre, C7 au
  plus tard** (destination posée le 14/08/2026 : aucun ticket de C4bis, C5 ni C6 ne touche ce
  panneau).
- **La coquille de navigation reste focalisable derrière le voile, sans JavaScript.** La page projet
  porte `inert` quand un panneau est ouvert, mais la barre latérale vit dans `app/(app)/layout.tsx`,
  et un layout Next ne reçoit pas les `searchParams`. Avec JavaScript, `FocusTrap` la met hors
  d'atteinte et `aria-modal` la retire de l'arbre d'accessibilité ; sans JavaScript, le cycle de
  tabulation passe par elle. Les panneaux de la page reprenant `FocusTrap` tel quel, la couverture
  partielle est la même pour tous — arbitrage du 14/08/2026, tenu.
  À joindre au **rebranchement des deux blocs manquants de la barre latérale** — carte de la personne
  courante et entrée Administration, écartés en T1.6 faute de droit de lire la session. L'obstacle a
  disparu : les écrans lisent la session depuis T2.1 et `can.manageDomain` depuis T2.5. Ce qui manque
  n'est plus un droit, c'est un ticket. → **ticket barre latérale, C7 ou plus tôt.**
- **Deux colonnes saisies ne s'affichent nulle part.** (1) `products.kind` — « Produit accompagné » ou
  « Mission transverse » (D10) — se saisit depuis T2.5 et ne se voit sur aucun écran de lecture.
  (2) `persons.kind` : un intervenant côté entité est marqué sur la page projet depuis T2.4 et dans
  le formulaire depuis T2.6 — pastille grise **et** mention « côté entité » —, mais la page produit et
  la liste transverse affichent tous les membres à l'identique, leurs lectures ne remontant pas la
  colonne. Aucun ticket de C4bis, C5 ni C6 ne touche ces listes. → **ticket propre, C7** (destination
  posée le 14/08/2026).
- **Le contenu rédigé d'`/a-propos` reste à écrire.** La page a son en-tête et son état vide. Son
  contenu — ce qu'est Vision, le vocabulaire, ce qu'elle ne fait pas, l'état daté — ne demande
  aucune lecture en base. → **ticket propre, C7 au plus tard.**
- **On n'ajoute qu'une personne par enregistrement.** Le bloc d'ajout de T2.6 crée une personne, et
  pour en ajouter deux il faut enregistrer puis rouvrir le formulaire. La limite est écrite dans
  l'écran, et **sa raison a disparu le 14/08** : le champ répétable exigeait le JavaScript que la
  cinquième discipline interdisait. Elle est levable. → **administration des personnes (D25, C7).**

### c. Dettes assumées, sans échéance

- **La base de développement a dérivé de la fixture, et c'est acté.** Inventaire au 15/08/2026 :
  un accompagnement de plus — « Refonte de l'espace documents » sur « Espace client web », créé en
  vérification de T2.6, avec un commanditaire renseigné et une personne `source = manual` (Nadia
  Berthier) ; six activités archivées depuis T3.3 ; quatre transitions non revenues en arrière depuis
  T3.5 ; deux ressources de plus depuis T4.2 ; un « Test projet » et un produit « test » d'une session
  antérieure, dont l'audit porte depuis T4bis.6 **deux résultats, un rangé et un vivant** — l'état que
  seule l'unicité partielle autorise. La dérive a servi T4.4 : elle avait déjà mis un Audit UX en
  « terminée » sans résultat, soit le cas exact que la fixture ne porte pas.
  **Règle posée le 14/08/2026 : la base de développement est jetable.** La règle 4 protège la donnée
  métier, pas une fixture locale. Conséquence : un critère de ticket passé ne s'y relit pas
  nécessairement — T2.1 à T2.4 se lisaient sur « 2 accompagnements », il y en a 3 — et ce n'est pas un
  défaut. C'est aussi ce qui autorise T4bis.1 à archiver des lignes à la main pour éprouver son
  critère. Il n'existe **pas de `db:reset`**, `db:seed` ignorant ce qu'il n'a pas semé. → **sans
  échéance ; un ticket d'outillage si le besoin devient réel.**
- **Le design system a six manques, et aucun n'a été inventé.** (1) Les trois **élévations** et les
  deux **gradients** sont nommés sans valeur. (2) Aucun jeton de **bordure de contrôle** : le plus
  sombre des `border-*` ne dépasse pas 1,2:1 là où la limite d'un composant se mesure à 3:1.
  (3) Aucun jeton de **bordure d'erreur**. (4) Aucun jeton d'**interlettrage** : les capitales des
  maquettes portent `.04em`, rendues sans. (5) Aucune **surface de voile** au-delà de 40 % — un
  voile qui porterait seul la séparation d'un panneau laisse sa surface à 2,66:1, mesuré.
  (6) Aucun jeton de **séparateur**.
  **Substituts en vigueur, tous mesurés :** `content-neutral-normal` (3,88:1) pour une bordure de
  contrôle, `content-danger-base` (5,19:1) pour un champ en erreur, `content-neutral-dark` (3,05:1
  contre le voile) pour le filet du panneau latéral, `content-neutral-base` (4,98:1) pour un
  séparateur entre deux textes de même graisse. **Règle : tout nouveau formulaire reprend ces choix
  sans en inventer un septième.** Elle tient depuis T2.3 et n'a pas été enfreinte.
  → **à faire remonter à qui maintient le design system.**
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
- **Le panneau de saisie est un composant client depuis T3.3.** `useActionState` est le seul moyen
  de faire revenir une saisie refusée avec ses valeurs. Ce qui n'a pas bougé : l'ouverture reste une
  URL, les sorties restent des liens, `inert` et `autofocus` restent des attributs HTML. C'est la
  frontière du bundle qui a bougé, pas la nature du socle.
- **La cinquième discipline de vérification a été retirée le 14/08/2026**, et le retrait est
  confirmé : l'étape 4 du protocole en compte **quatre**. Aucune fiche de C4bis n'exige que le
  parcours se joue sans une ligne de JavaScript.
- **Le domaine courant est le premier domaine actif trouvé en base.** Pas de variable
  d'environnement : `docs/05` §3 pose un domaine unique. Le jour où un second existe, le choix
  revient au fournisseur d'identité.
- **`/dev/session` est une route de développement**, rendue 404 en production, reliée à aucune
  navigation. Elle disparaîtra avec le stub en C7.
- **L'authentification est un stub jusqu'en C7**, mais le contexte de session a sa forme finale.
  `lib/auth/provider.ts` est le seul fichier que C7 réécrit.
- **Les maquettes `docs/design/maquettes/` sont une référence visuelle**, jamais branchées.
- **Modèle par ticket.** Le plan écrit disait Opus pour C1, Sonnet à partir de C2 ; en pratique C2,
  T3.1, T3.2 et tout C4 sauf T4.1 et T4.2 ont été menés sur Opus, T4.1 sur Antigravity. **Le levier
  n'est pas le modèle mais les quatre disciplines de vérification.**
