# ETAT — Vision

Fichier de contexte de session. Mis à jour par Claude en fin de chaque ticket.

**Dernière mise à jour :** 28/08/2026, après la suppression définitive et la disponibilité déduite,
livrées hors ticket. Dernier balayage : découpage de C7. **Le fichier dépasse les 250 lignes de la
règle 5** — le balayage appartient à la session de découpage de C8.
**Chantier en cours :** **C7 — Finitions**, dix tickets, découpés dans `tickets-C7.md`. **Dernier
chantier du POC** — `docs/05` §5 n'en a pas de huitième.
**Ticket suivant :** **T7.3 — Administration : l'écran devient multi-référentiel, et les quatre
référentiels simples** (D25, `docs/06` §2).

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
| C7 — Finitions | T7.1 → T7.10 | **en cours** — T7.1, T7.2 livrés |
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
- **Reprise d'interface hors ticket — dix-sept gestes, du 17 au 28/08/2026.** Menu « … » de la
  roadmap, « Vision produit » et sa reprise `northstar-v2`, « Personae », « Use Cases »,
  « Démarrage » (migrations 0005 à 0008), page projet en `project-v2`, bouton à trois rangs, entités
  en `/administration`, hiérarchie de la page produit — puis, le 28/08, **deux blocs de la page
  projet qui s'effacent** : « Projets liés » entièrement, « Démarrage » dès la première activité.

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

- **La base de développement n'a pas reçu la migration `0010`.** Elle est appliquée à la branche de
  test ; la commande a été refusée à l'agent sur la base de développement. Sans conséquence
  d'exécution — plus rien n'écrit `persons.availability`, et le `CHECK` survivant accepte le `null` —,
  mais schéma et base divergent tant que `npm run db:migrate` n'a pas tourné. → **action humaine.**
- **Les secrets Neon n'ont jamais été tournés.** Deux chaînes ont transité en clair le 12/08/2026.
  Hors dépôt — `.env.local` seul —, mais valides. **Reportées deux fois** : au découpage de C6, puis
  à celui de C7, qui n'en dépendaient ni l'un ni l'autre. → **action humaine.**
- **Le SSO Entra ID est sorti de C7**, faute d'inscription d'application — décision humaine du
  27/08/2026, **écart à D37** consigné au journal technique. Le stub reste, `/dev/session` reste, et
  `lib/auth/provider.ts` attend toujours son seul réécrivain. Ce qui manque n'est pas du code : un
  tenant, un client, un secret, une URI de redirection. → **action humaine, puis C8.**

### b. Assignés à un ticket

- **Deux colonnes de `docs/06` §4 manquent aux lignes de la liste transverse** — l'entité et les
  métiers, sur les sept énumérées. T7.2 a posé leurs **filtres**, pas leurs colonnes : son
  « Attendu » ne les nommait pas. Aucun ticket de C7 n'ouvre cet écran, T7.9 se l'interdit.
  → **C8.**
- **Le clic de `/equipe` n'a jamais été parcouru au navigateur.** Celui de l'**adresse** est lu dans
  le HTML servi ; celui du **clic** ne l'est pas. Les cinq propriétés en attente sont celles de
  `DrawerHost`, éprouvées par TD.2 sur les deux autres pages hôtes. → **T7.7.**
- **La coquille de navigation reste focalisable derrière le voile, sans JavaScript.** La page porte
  `inert`, la barre latérale vit dans le layout, et **l'obstacle technique a disparu en TD.2** : ce
  qui reste est un parcours clavier à faire. → **T7.7.**
- **La barre d'ancres de la page projet n'est pas rendue.** `subnav.tsx` est sans appelant, ses `id`
  de section et son `scroll-mt-19` restent posés et inertes depuis le 20/08/2026, et la question de
  l'entrée active — que seul le défilement désigne — se reposera telle quelle. **Elle a désormais
  deux cibles de moins** : `projets-lies` a disparu du rendu, `demarrage` n'y est que sur un projet
  sans activité — une barre d'ancres se construit donc à partir de ce qui est rendu, jamais d'une
  liste figée. → **T7.5.**
- **Deux blocs de la page projet ont été masqués le 28/08/2026, hors ticket et à la demande.**
  « Projets liés » n'est plus rendu — **écart à la liste close de `docs/06` §5**, cinq blocs
  énumérés pour quatre rendus —, et « Démarrage » ne l'est que sur un accompagnement sans activité.
  Rien n'est supprimé : composants, requêtes, panneaux `?lien=`/`?piste=` et actions restent entiers
  et testés, et le premier revient d'une dizaine de lignes. Ce qui reste à faire est **le point
  d'entrée annoncé de « Démarrage » — le geste d'ajout d'une activité**. → **C8.**
- **La carte de la personne courante manque à la barre latérale.** Second bloc écarté par T1.6 ; le
  premier, l'entrée Administration, a été livré le 21/08/2026. → **T7.5.**
- **Le contenu rédigé d'`/a-propos` reste à écrire.** La page a son en-tête et son état vide ; son
  contenu ne demande aucune lecture en base (D36). → **T7.8.**
- **Deux colonnes saisies ne s'affichent nulle part** : `products.kind` (D10), lu par aucun écran ;
  `persons.kind` sur les deux lectures de projet, qui affichent tous les membres à l'identique.
  → **T7.9.**
- **`project_indicators.note` n'a ni écrivain ni lecteur.** Colonne posée en T1.2 ; le panneau
  d'adoption saisit quatre champs, pas un cinquième. Ce qui manque est **une phrase sur le pourquoi
  d'une cible** (`docs/04` §3). → **T7.9.**
- **Corriger une personne du centre en intervenant côté entité lui laisse ses compétences.**
  `parsePersonForm` efface la disponibilité — le `CHECK` l'exige — mais rien d'équivalent n'existe
  pour `person_skills` : les liaisons restent affichées et **illisibles en écriture**. Aucune donnée
  perdue. → **T7.9.**
- **Deux libellés vivent hors de `lib/format.ts`** : `PERSON_KIND_LABEL` (`lib/forms/person.ts`) —
  un déplacement **plus un vocabulaire à trancher**, T5bis.7 ayant refermé la duplication et pas les
  mots — et `BUDGET_UNIT_LABEL` (`components/projects/budget.tsx`), hors périmètre de T7.1.
  `AVAILABILITY_LABEL` reste dans `components/team/availability-dot.tsx` par la même raison, et il en
  est le troisième cas. → **T7.9.**
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
- **Huit objets écrivent sans laisser de trace au journal** : persona, use case, indicateur,
  personne, entité, vision produit, le budget de T7.1, et la **suppression d'un accompagnement**
  (28/08). Ce dernier est d'une autre nature : `events.project_id` étant `cascade`, une trace écrite
  juste avant serait effacée par l'instruction suivante — il n'y a pas de ligne à écrire, il y a une
  disparition à admettre. Les six `event_target_type` restent une liste fermée sans migration
  (arbitrage (b) de C6, (d) de C7). → **C8.**
- **L'en-tête de `schema.ts` dit « les 26 tables métier », elles sont 30.** Cinquième chiffre faux
  d'une même famille — `scoped.ts`, la fiche de C6 deux fois, et `drawers/project.tsx` (« les six
  panneaux » pour huit, **retiré** par T6.5). Le geste est de retirer. → **T7.10, qui l'ouvre.**
- **Trois fichiers de tests d'action nettoient encore sur `if (!f?.domainId) return`** — un
  `beforeAll` qui échoue après avoir créé son domaine le laisse en place, et fait tomber le fichier
  suivant. Restent `projets/`, `produits/` et `administration/actions.test.ts` ; le quatrième,
  `equipe/actions.test.ts` (28/08), retient son `domainId` **dès la création du domaine**, hors de la
  fixture — c'est la forme à reprendre. → **au prochain.**
- **`uiLayerSeal` ne scelle ni `components/shell/` ni `components/overview/`.** Il nomme trois
  dossiers métier ; il y en a **cinq**, et le second trou compte quatre fichiers (T6.6, T6.7).
  `eslint.config.mjs` est hors périmètre à chaque fois. → **au prochain qui l'ouvre.**
- **Les deux use cases de la fixture n'ont aucun persona rattaché.** `scripts/seed.ts` n'en sème
  aucun. Le rattachement est facultatif et le lien a été éprouvé par sonde scopée : ce qui manque est
  un **jeu d'essai**. → **au prochain ticket qui sème des personae.**
- **Deux capacités du bouton n'ont aucun appelant, et c'est une entorse assumée.** Le rang `tertiary`
  et les props d'icône de `Button` enfreignent l'en-tête de `button.tsx` — objet même de la demande,
  **éprouvés par sonde**. Premier appelant naturel : le « Annuler » des quatre pieds de formulaire.
  → **au prochain ticket qui ouvre un pied de formulaire.**
- **`disabled:opacity-60` est servi sur onze balises qui ne peuvent pas être désactivées** — les
  `<a>`, `<Link>` et `<DrawerLink>` qui portent un bouton, contre une seule source pour l'état
  désactivé. → **sans échéance.**

### c. Dettes assumées, sans échéance

- **La page produit porte deux langages d'en-tête.** « Vision produit » a pris le surtitre en
  capitales et le kebab en absolu de `northstar-v2` ; ses voisins gardent `BlockHeader`, sur demande.
  Au second bloc à surtitre, `Eyebrow` quitte `indicators.tsx` pour `block.tsx`.
  → **arbitrage humain.**
- **Une carte ne se détache d'aucun fond, et c'est le design system qui manque.** Trois positions :
  la North Star (1,04:1, sa bordure la sauve à 1,33:1), les cartes de personae (1,05:1, le filet à
  1,17:1), le panneau de T5bis.4 (1,24:1). Le plus franc des `surface-neutral-*` plafonne à 2,22:1,
  sous 3:1. **Tous les couples de texte passent 4,5:1.** T7.7 le mesure sans le refermer.
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
- **Deux gabarits de grille portent une dimension en dur, et c'est un arbitrage.**
  `indicators.tsx:495` et `:585` disent à quelle largeur une carte cesse de tenir : un **point
  d'arrêt de mise en page**, pas une valeur de thème (T1.6), hors de la clause 2 de
  `spacingScaleLock`. T7.6 en posera d'autres. → **à reposer avec une grille au design system.**
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
- **La liste transverse n'est ni paginée ni plafonnée.** `docs/06` §4 la projette « à quinze puis
  cinquante projets », ce qu'une page rend sans effort. Au-delà, un plafond avant une pagination.
  → **si l'usage le réclame.**
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
