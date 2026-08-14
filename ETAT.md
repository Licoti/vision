# ETAT — Vision

Fichier de contexte de session. Mis à jour par Claude en fin de chaque ticket.

**Dernière mise à jour :** 14/08/2026 — T4bis.1 livré.
**Chantier en cours :** C4bis — archivage et correction, six tickets, un livré
**Geste suivant :** T4bis.2 — archiver un produit, et le rétablir

---

## Avancement

| Chantier | Tickets | État |
|---|---|---|
| C1 — Socle technique | T1.1 → T1.6 | **terminé** |
| C2 — Produits et projets | T2.1 → T2.6 | **terminé** |
| C3 — Activités et roadmap | T3.1 → T3.6 | **terminé** |
| C4 — Ressources et résultats | T4.1 → T4.4 | **terminé** |
| C4bis — Archivage et correction | T4bis.1 → T4bis.6 | **en cours**, T4bis.1 livré |
| C5 — Indicateurs et temps long | à découper | à faire |
| C6 — Liens et journal | à découper | à faire |
| C7 — Finitions, budget, SSO | à découper | à faire |

**Point de bascule atteint :** C1 à C3 constituent le POC minimal démontrable ; C4 y ajoute la
boucle complète de `docs/05` §2 — saisir, attacher le lien, reporter le résultat.

**Sur C4bis.** `docs/05` §5 pose sept chantiers et n'a jamais prévu l'archivage ni la correction :
le cadrage distribue la création et l'édition, jamais le rangement. Le chantier s'intercale **sans
décaler les autres** — « C7 » est écrit dans D25, D28 et D37, que la règle 6 interdit de rouvrir.
C5, C6 et C7 gardent le sens que `docs/05` leur donne.

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

---

## Points ouverts

*(un point, une destination. Un point qui n'a pas de destination est un point qu'on n'a pas tranché.
Un point qui se referme part dans `HISTORIQUE-TICKETS.md` — il ne reste pas barré ici.)*

### a. À trancher — sinon les tickets suivants héritent du problème

- **Les secrets Neon n'ont jamais été tournés.** Deux chaînes de connexion ont transité en clair
  dans la conversation le 12/08/2026 — la base de développement, puis la branche de test. Elles ne
  sont que dans `.env.local`, hors dépôt, mais restent valides. → **action humaine.**

### b. Assignés à un ticket

- **C4bis est découpé, et son premier ticket est livré.** Les six manques — archivage du produit, du
  projet, de l'activité, correction de la ressource et du résultat, lecture seule d'un projet
  archivé, valeur archivée dans un formulaire — sont distribués en six tickets, avec les six
  arbitrages rendus avant écriture (lecture seule stricte, rétablissement limité au produit et au
  projet, confirmation pour ces deux-là seulement, vocabulaire « Archiver / Rétablir », refus
  d'archiver un produit portant un accompagnement vivant, aucune cascade). **T4bis.1 a refermé le
  manque (6)** : les six valeurs des deux formulaires portent désormais l'exception nominative de
  T3.4, et rien n'archive encore depuis l'interface. → **`tickets-C4bis.md`, reprendre à T4bis.2.**
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

- **La base de développement a dérivé de la fixture, et c'est acté.** Inventaire au 14/08/2026 :
  un accompagnement de plus — « Refonte de l'espace documents » sur « Espace client web », créé en
  vérification de T2.6, avec un commanditaire renseigné et une personne `source = manual` (Nadia
  Berthier) ; cinq activités archivées depuis T3.3 ; quatre transitions non revenues en arrière depuis
  T3.5 ; une ressource de plus depuis T4.2 et un résultat de plus depuis T4.4 ; un « Test projet » et
  un produit « test » d'une session antérieure. La dérive a servi T4.4 : elle avait déjà mis un
  Audit UX en « terminée » sans résultat, soit le cas exact que la fixture ne porte pas.
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
