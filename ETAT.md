# ETAT — Vision

Fichier de contexte de session. Mis à jour par Claude en fin de chaque ticket.

**Dernière mise à jour :** 16/08/2026 — T5.4 livré : adopter un indicateur depuis l'accompagnement.
**Chantier en cours :** C5 — indicateurs et lecture dans le temps, quatre tickets sur six livrés
**Ticket suivant :** T5.5 — la frise du temps long : l'axe, les accompagnements, les repères

---

## Avancement

| Chantier | Tickets | État |
|---|---|---|
| C1 — Socle technique | T1.1 → T1.6 | **terminé** |
| C2 — Produits et projets | T2.1 → T2.6 | **terminé** |
| C3 — Activités et roadmap | T3.1 → T3.6 | **terminé** |
| C4 — Ressources et résultats | T4.1 → T4.4 | **terminé** |
| C4bis — Archivage et correction | T4bis.1 → T4bis.6 | **terminé** |
| C5 — Indicateurs et lecture dans le temps | T5.1 → T5.6 | **en cours** — T5.1 → T5.4 livrés |
| C6 — Liens et journal | à découper | à faire |
| C7 — Finitions, budget, SSO | à découper | à faire |

**Point de bascule atteint :** C1 à C3 constituent le POC minimal démontrable ; C4 y ajoute la
boucle complète de `docs/05` §2 — saisir, attacher le lien, reporter le résultat.

**Sur C4bis, désormais clos.** `docs/05` §5 n'avait prévu ni l'archivage ni la correction ; le
chantier s'est intercalé **sans décaler les autres** — C5, C6 et C7 gardent le sens que `docs/05`
leur donne, « C7 » étant écrit dans D25, D28 et D37 que la règle 6 interdit de rouvrir.

**Sur C5, ouvert le 15/08/2026.** Six tickets, sept arbitrages rendus avant écriture, dans
`tickets-C5.md`. Sa leçon reprise de C4bis : **chaque objet arrive avec ses trois gestes — créer,
corriger, ranger — dans le ticket qui l'introduit.**

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

**C5 — en cours** *(une ligne par ticket jusqu'au repliage du chantier)*

- **T5.1 — le bloc « Indicateurs » de la page produit, en lecture, le 16/08/2026.** Première
  lecture des trois tables dormantes depuis T1.2 : `listProductIndicators` rend en **une** requête
  jointe le dernier relevé, sa date et le décompte — l'agrégat ordonné `(array_agg(… order by
  read_on desc, id desc))[1]`, qu'un `max()` n'aurait pas donné. Le parcours d'archivage produit,
  dû depuis T4bis.2, a été joué : ses six points tiennent, et il a mis en défaut le **pluriel du
  refus (e)**.
- **T5.2 — créer, corriger et archiver un indicateur, le 16/08/2026.** Premier écran d'écriture de
  la page produit depuis T2.5, premier objet de C5 livré **avec ses trois gestes**. Le droit de
  l'arbitrage (b) se dérive des accompagnements sans une requête neuve, et se redérive sur
  l'identifiant **reçu** par `openProductWrite` — la porte lit le produit **avant** le droit,
  l'inverse d'`openProduct`, un droit dérivé ne s'énonçant pas avant ce dont il dérive. La page
  prend la règle d'exclusivité **par décompte** de la page projet, juste d'avance pour T5.3.
- **T5.3 — saisir, corriger et retirer un relevé, et sa migration, le 16/08/2026.** La seule
  migration de C5, et la **première épreuve d'`hasArchivedAt`** : `archived_at` ajoutée à
  `indicator_readings`, et `archive`, `restore` et le filtre des vivants couvrent la table sans
  qu'une ligne de `lib/db/scoped.ts` change — la propriété que T1.3 cherchait. Le filtre des
  relevés retirés se pose **dans le `on`** de la jointure, à l'emplacement que T5.1 avait écrit
  d'avance. Le décompte d'exclusivité de T5.2 a absorbé une troisième clé sans changer d'énoncé,
  et les six points d'entrée du bloc tombent avec le même `canWriteIndicators`.
- **T5.4 — adopter un indicateur depuis l'accompagnement, le 16/08/2026.** Le deuxième bloc de
  référence de la page projet, et le **premier retrait par `unlink`** d'un objet que l'écran offre :
  une adoption est une liaison, `LinkTable` l'impose à la compilation, et le verbe à l'écran est
  « Retirer », jamais « Archiver ». Le décompte d'exclusivité passe de quatre clés à cinq sans
  changer d'énoncé — la deuxième fois qu'une généralisation écrite d'avance est payée. **Trois
  arbitrages tranchés avant écriture** : le « combien » du refus (e) atteint l'écran par le bloc
  produit (`adoptionCount`) et non par un message d'action, un geste nu n'ayant nulle part où en
  afficher un ; le pluriel du refus (e) d'`archiveProduct`, dû depuis T5.1, est corrigé avant d'être
  recopié ; `project_indicators.note` reste sans écrivain. Un fichier hors fiche, `adoption-panel.tsx`,
  la fiche demandant un panneau sans nommer où le mettre.

---

## Points ouverts

*(un point, une destination. Un point qui n'a pas de destination est un point qu'on n'a pas tranché.
Un point qui se referme part dans `HISTORIQUE-TICKETS.md` — il ne reste pas barré ici.)*

### a. À trancher — sinon les tickets suivants héritent du problème

- **Les secrets Neon n'ont jamais été tournés.** Deux chaînes de connexion ont transité en clair
  dans la conversation le 12/08/2026 — la base de développement, puis la branche de test. Elles ne
  sont que dans `.env.local`, hors dépôt, mais restent valides. → **action humaine.**

- **Rétablir un accompagnement sous un produit archivé le laisse invisible.** L'arbitrage (e)
  n'autorise l'archivage d'un produit que si tous ses accompagnements sont archivés : « produit rangé,
  accompagnements rangés » est donc l'état courant. En rétablir un depuis sa page donne un projet
  vivant qu'aucune liste n'affiche, les deux jointures écartant les projets d'un produit archivé — le
  geste paraît ne rien faire. Arbitrage du 15/08/2026, tranché avant écriture : **aucun garde-fou**,
  l'arbitrage (f) posant qu'il n'y a pas de cascade et le chantier interdisant d'en ouvrir un
  septième en cours de ticket. Rien n'est perdu ; le geste est trompeur.
  → **ticket propre, C7 au plus tard** — vérifié au découpage de C5 : aucune de ses six fiches
  n'ouvre `archiveProject` ni `restoreProject`.

### b. Assignés à un ticket

- **`project_indicators.note` n'a ni écrivain ni lecteur.** La colonne existe depuis T1.2, `docs/04`
  §3 la décrit « texte court », et le panneau d'adoption de T5.4 ne la saisit pas : sa fiche énumère
  ce qu'une ligne du bloc dit — libellé, référence, cible, dernière valeur, valeur finale — et n'en
  parle nulle part. Arbitrage tranché avant écriture le 16/08/2026 : **quatre champs, pas un
  cinquième**, règle 3 et leçon de T5.2 — une colonne écrite sans lecteur est une colonne qu'on relit
  un jour sans savoir pourquoi. Le geste manquant est donc **une phrase sur le pourquoi d'une
  cible**, et il se juge à l'usage, pas au schéma. → **ticket propre, C7 au plus tard ; ou jamais, si
  personne ne la réclame.**
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
  plus tard** (destination posée le 14/08/2026, confirmée au découpage de C5 : aucune de ses six
  fiches n'ouvre `activity-panel.tsx`).
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
  colonne. → **ticket propre, C7** (destination posée le 14/08/2026, confirmée au découpage de C5 :
  T5.1 et T5.5 ouvrent la page produit sans rouvrir `listProductProjects` ni la liste transverse).
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
  seule l'unicité partielle autorise ; deux indicateurs archivés depuis T5.2, dont un saisi sous le
  cookie d'une contributrice ; l'**adoption de la fixture porte un identifiant neuf** depuis T5.4 —
  retirée puis réadoptée pour éprouver le refus (e), avec les mêmes valeurs, `unlink` ne rendant pas
  sa ligne. La dérive a servi T4.4 : elle avait déjà mis un Audit UX en
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
