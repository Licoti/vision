# ETAT — Vision

Fichier de contexte de session. Mis à jour par Claude en fin de chaque ticket.

**Dernière mise à jour :** 14/08/2026 — T4.2. Le fichier tient sous le seuil de 250 lignes posé par
le protocole ; le mécanisme d'entretien du 14/08/2026 a envoyé le récit détaillé dans
`HISTORIQUE-TICKETS.md`. **Un chantier a été ajouté au découpage** — C4bis, archivage et correction,
qui s'exécute entre C4 et C5.
**Chantier en cours :** C4 — ressources et résultats, 2 tickets sur 4 terminés
**Ticket suivant :** T4.3 — le résultat sur l'entrée de roadmap, lecture

---

## Avancement

| Chantier | Tickets | État |
|---|---|---|
| C1 — Socle technique | T1.1 → T1.6 | **terminé** |
| C2 — Produits et projets | T2.1 → T2.6 | **terminé** |
| C3 — Activités et roadmap | T3.1 → T3.6 | **terminé** |
| C4 — Ressources et résultats | T4.1 → T4.4 | **T4.1 et T4.2 terminés**, T4.3 → T4.4 à faire |
| C4bis — Archivage et correction | à découper | à faire — décidé le 14/08/2026 |
| C5 — Indicateurs et temps long | à découper | à faire |
| C6 — Liens et journal | à découper | à faire |
| C7 — Finitions, budget, SSO | à découper | à faire |

**Point de bascule atteint :** C1 à C3 constituent le POC minimal démontrable, et les trois sont
terminés.

**Sur C4bis.** `docs/05` §5 pose sept chantiers et n'a jamais prévu l'archivage ni la correction :
le cadrage distribue la création et l'édition, jamais le rangement. Le chantier ajouté s'intercale
donc **sans décaler les autres** — « C7 » est écrit dans D25, D28 et D37, que la règle 6 interdit de
rouvrir. C5, C6 et C7 gardent ainsi exactement le sens que `docs/05` leur donne. Ses tickets
s'appellent T4bis.1, T4bis.2… **Il se découpe à la clôture de C4**, en session de découpage.

---

## Journal des tickets

*(une ligne par ticket : identifiant, date, titre, écarts de périmètre. **Rien d'autre.** Le récit va
dans `HISTORIQUE-TICKETS.md`, les pièges et dettes dans `JOURNAL-TECHNIQUE.md`.)*

**Repliage dû à la clôture de C4.** C1, C2 et C3 sont clos et occupent encore 18 lignes. À la
session de découpage de C4bis — geste 1 du protocole —, les quatre chantiers clos se replient en
quatre lignes et leurs tickets partent dans `HISTORIQUE-TICKETS.md`. Reporté le 14/08/2026 : le
geste s'éprouve sur C4 fraîchement clos plutôt que sur trois chantiers anciens.

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
- **T4.1 — 13/08/2026 — bloc « Ressources » de la page projet, lecture.** Aucun écart de périmètre.
- **T4.2 — 14/08/2026 — relier une ressource.** Ferme la boucle minimale de `docs/05` §2. Aucun
  écart de périmètre.

---

## Points ouverts

*(un point, une destination. Un point qui n'a pas de destination est un point qu'on n'a pas tranché.
Un point qui se referme part dans `HISTORIQUE-TICKETS.md` — il ne reste pas barré ici.)*

### a. À trancher — sinon les tickets suivants héritent du problème

- **Les secrets Neon n'ont jamais été tournés.** Deux chaînes de connexion ont transité en clair
  dans la conversation le 12/08/2026 — la base de développement, puis la branche de test. Elles ne
  sont que dans `.env.local`, hors dépôt, mais restent valides. → **action humaine.**
- **`CLAUDE.md` et `AGENTS.md` ont été modifiés par Claude le 14/08/2026, sur instruction
  explicite, en deux fois.** D'abord trois collages dont l'humain avait validé le texte : la ligne
  `HISTORIQUE-TICKETS.md` dans la table « Où écrire quoi », les cinq disciplines de vérification à
  l'étape 4 du protocole, et le passage de trois à quatre fichiers ouverts dans `AGENTS.md`. Puis le
  mécanisme anti-embonpoint : l'étape 5 augmentée (une ligne par ticket, un point ouvert se récrit,
  seuil de 250 lignes) et la section neuve **« Session de découpage »** — six gestes, de 0
  (trancher les points « À trancher ») à 5 (plan mode avant d'écrire le fichier de tickets) —, qui
  n'existait nulle part alors que deux sessions de ce type ont déjà eu lieu.
  **Ce sont des exceptions à la règle 7**,
  consignées au journal, et **elles ne valent pas précédent** : hors instruction explicite portant
  sur un texte validé, ces deux fichiers restent fermés.
  → **à relire, et à confirmer ou annuler (`git checkout CLAUDE.md AGENTS.md`).**

### b. Assignés à un ticket

- **C4bis — archivage et correction : six manques en constituent la matière.** Le chantier doit
  couvrir, ensemble : (1) l'archivage d'un **produit** — aucun écran ne l'archive, et `find` rend
  les lignes archivées, si bien que `/produits/{id}/modifier` ouvrirait le formulaire d'un produit
  archivé ; (2) l'archivage d'un **projet**, dans le même cas depuis T2.6 ; (3) l'archivage d'une
  **activité** — l'annulation de T3.5 en tient lieu pour une activité qui ne se fera pas, mais pas
  pour une activité saisie **par erreur**, qui n'a aucun chemin ; (4) la **correction** d'une
  ressource et d'un résultat, que C4 n'écrit pas — arbitrage (a) de `tickets-C4.md`, ce sont les
  premiers objets de Vision sans chemin de correction ; (5) **un projet archivé est-il en lecture
  seule ?** Rien ne le dit dans `docs/`, et un contributeur désigné y garde son droit d'écriture
  depuis T1.4 ; (6) le sort d'une **ligne archivée dans un formulaire** — une entité ou un produit
  archivé disparaîtrait des options et exigerait un nouveau choix, là où `listActivityFormOptions`
  porte depuis T3.4 une exception nominative qui conserve la valeur. Le comportement de T3.4 est le
  bon ; les formulaires de produit et de projet sont à aligner dessus.
  **Conséquence connue de T4.1** : une ressource rattachée à une activité archivée continue
  d'afficher son libellé, que la roadmap ne montre plus — non atteignable par l'interface tant que
  rien n'archive une activité, et à retrancher avec le même ticket.
  → **C4bis, à découper à la clôture de C4.**
- **Trois paramètres d'ouverture sur la page projet, dont deux posés.** `?activite=` depuis T3.2,
  `?ressource=` depuis T4.2, `?resultat=` en T4.4. **La règle d'exclusivité est écrite et éprouvée** :
  deux clés présentes ensemble n'ouvrent **rien** — aucune préséance entre gestes de même rang, et
  c'est déjà ce que la page fait d'une valeur d'`?activite=` qu'elle ne reconnaît pas. Elle tient par
  une **valeur** et non par une discipline : `conflict` puis `asked` en tête de la page, que tout le
  reste lit à la place des paramètres bruts. **T4.4 ajoute sa clé à `asked` et n'écrit aucune
  condition neuve** — trois conditions qui s'excluent tiendraient encore, et cesseraient de tenir à la
  quatrième. → **T4.4**.
- **La coquille de navigation reste focalisable derrière le voile, sans JavaScript.** La page projet
  porte `inert` quand un panneau est ouvert, mais la barre latérale vit dans `app/(app)/layout.tsx`,
  et un layout Next ne reçoit pas les `searchParams`. Avec JavaScript, `FocusTrap` la met hors
  d'atteinte et `aria-modal` la retire de l'arbre d'accessibilité ; sans JavaScript, le cycle de
  tabulation passe par elle. **La seconde modale est arrivée avec T4.2, et n'a rien changé** : la
  fiche ne portait pas `layout.tsx`, le défaut ne se voit que scripts coupés, et le panneau de
  ressource reprend `FocusTrap` tel quel — donc exactement la même couverture partielle, ni aggravée
  ni refermée. Arbitrage du 14/08/2026, tenu. À joindre au **rebranchement des deux blocs manquants
  de la barre latérale** —
  carte de la personne courante et entrée Administration, dans les maquettes, écartés en T1.6 faute
  de droit de lire la session. L'obstacle a disparu : les écrans lisent la session depuis T2.1 et
  `can.manageDomain` depuis T2.5. Ce qui manque n'est plus un droit, c'est un ticket.
  → **ticket barre latérale, C7 ou plus tôt.**
- **Deux colonnes saisies ne s'affichent nulle part.** (1) `products.kind` — « Produit accompagné » ou
  « Mission transverse » (D10) — se saisit depuis T2.5 et ne se voit sur aucun écran de lecture.
  (2) `persons.kind` : un intervenant côté entité est marqué sur la page projet depuis T2.4 et dans
  le formulaire depuis T2.6 — pastille grise **et** mention « côté entité », le texte ne dépendant
  jamais de la couleur — mais la page produit et la liste transverse affichent tous les membres à
  l'identique, leurs lectures ne remontant pas la colonne. **Attention** : la formule « à reprendre
  au premier ticket qui touche ces listes » n'est pas une destination — aucun ticket de C4, C5 ou C6
  ne les touche. → **ticket propre, à découper.**
- **Le contenu rédigé d'`/a-propos` reste à écrire.** La page a son en-tête et son état vide. Son
  contenu — ce qu'est Vision, le vocabulaire, ce qu'elle ne fait pas, l'état daté — ne demande
  aucune lecture en base. → **ticket propre, C7 au plus tard.**
- **On n'ajoute qu'une personne par enregistrement.** Sans JavaScript, un champ répétable n'existe
  pas : le bloc d'ajout de T2.6 crée une personne, et pour en ajouter deux il faut enregistrer puis
  rouvrir le formulaire. La limite est écrite dans l'écran. → **écran d'administration des
  personnes (D25, C7).**

### c. Dettes assumées, sans échéance

- **La base de développement a dérivé de la fixture, et c'est acté.** Inventaire au 14/08/2026 :
  un accompagnement de plus — « Refonte de l'espace documents » sur « Espace client web », créé en
  vérification de T2.6, avec un commanditaire renseigné et une personne `source = manual` (Nadia
  Berthier) ; cinq activités archivées depuis T3.3 ; quatre transitions non revenues en arrière
  depuis T3.5 ; une ressource de plus depuis T4.2 — « Compte rendu d'atelier — T4.2 » sur
  « Autonomie des opérations courantes », le critère du ticket, et **sans chemin d'archivage** jusqu'à
  C4bis ; un « Test projet » et un produit « test » d'une session antérieure.
  **Règle posée le 14/08/2026 : la base de développement est jetable.** La règle 4 protège la donnée
  métier, pas une fixture locale. Conséquences à connaître : les critères de T2.1 à T2.4 se lisaient
  sur « 2 accompagnements » pour ce produit et s'y liraient sur 3 ; un critère de ticket passé ne
  s'y relit pas nécessairement, et ce n'est pas un défaut. Il n'existe **pas de `db:reset`** —
  `db:seed` ignore ce qu'il n'a pas semé. → **sans échéance ; un ticket d'outillage si le besoin
  devient réel.**
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
  n'ont pas de lien profond, le brief §7 n'en donnant aucun — la fiche T4.3 en fait explicitement un
  cas normal, donc rien ne bloque C4. Trois des quatre ressources du brief ne sont pas semées :
  « Grille d'entretien », « Maquettes v3 » et « Rapport d'audit d'accessibilité » attendent une ancre
  que le brief ne fournit pas. Même silence sur `tools.base_url` et sur les courriels des personnes.
  → **sans échéance, ou l'humain fournit les adresses.**
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
  mois, l'affichage reste juste. → **le jour où une date au jour s'affiche quelque part.**

---

## Rappels de contexte

- **Un argument lié à une action serveur n'est pas un secret.** `bind(null, project.id)` fait sortir
  l'identifiant de la saisie, mais Next le sérialise dans un champ `$ACTION_…` du balisage, **en
  clair en développement**, et une soumission peut le réécrire. **Règle : une action ne tire jamais
  une autorisation de la valeur qu'on lui a liée.** Elle interroge le droit sur la valeur **reçue**.
  Éprouvée en T3.3 puis en T3.4, où deux valeurs sont liées dont l'une désigne la ligne écrite, et
  **relue une troisième fois en T4.2** : le `projectId` lié à `createResource` s'est lu en clair dans
  le champ `$ACTION_13:1` du balisage servi. Vaut pour T4.4, dernier ticket d'écriture du chantier.
- **Le panneau de saisie est un composant client depuis T3.3.** `useActionState` est le seul moyen
  de faire revenir une saisie refusée avec ses valeurs. Ce qui n'a pas bougé : l'ouverture reste une
  URL, les trois sorties restent des liens, `inert` et `autofocus` restent des attributs HTML. C'est
  la frontière du bundle qui a bougé, pas la nature du socle — qui tient toujours sans script.
- **Le domaine courant est le premier domaine actif trouvé en base.** Pas de variable
  d'environnement : `docs/05` §3 pose un domaine unique. Le jour où un second existe, le choix
  revient au fournisseur d'identité.
- **`/dev/session` est une route de développement**, rendue 404 en production, reliée à aucune
  navigation. Elle disparaîtra avec le stub en C7.
- **L'authentification est un stub jusqu'en C7**, mais le contexte de session a sa forme finale.
  `lib/auth/provider.ts` est le seul fichier que C7 réécrit.
- **Les maquettes `docs/design/maquettes/` sont une référence visuelle**, jamais branchées.
- **Modèle par ticket.** Le plan écrit disait Opus pour C1, Sonnet à partir de C2 ; en pratique C2,
  T3.1 et T3.2 ont été menés sur Opus. Arbitrage du 13/08/2026 pour C4 : **T4.1 et T4.3 sur Opus 4.6
  Thinking (Antigravity)** — deux lectures qui rejouent T3.1 et T3.6 sans décision neuve ; **T4.2 sur
  Sonnet 5 (Claude Code)** — le seul point non rejoué, deux panneaux sur une même page ; **T4.4 sur
  Opus 5 (Claude Code)** — le pivot du chantier et son seul ticket à logique neuve. **Le levier n'est
  pas le modèle mais les cinq disciplines de vérification** — voir le point ouvert (a) ci-dessus.
