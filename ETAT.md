# ETAT — Vision

Fichier de contexte de session. Mis à jour par Claude en fin de chaque ticket.

**Dernière mise à jour :** 27/08/2026, T6.4. Balayé au découpage de C6, seul moment où il l'est.
**Chantier en cours :** **C6 — Liens et journal**, sept tickets dans `tickets-C6.md`.
**Ticket suivant :** **T6.5 — les liens déclarés : relier, dire pourquoi, retirer.**

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
| C6 — Liens et journal | T6.1 → T6.7 | **en cours** — T6.1 → T6.4 faits |
| C7 — Finitions, budget, SSO | à découper | à faire |

---

## Journal des tickets

*(une ligne par **chantier clos**, et une par ticket du chantier en cours. Le récit détaillé vit
dans `HISTORIQUE-TICKETS.md` ; les pièges et dettes dans `JOURNAL-TECHNIQUE.md`.)*

- **T6.4 — les liens déduits, et le bloc « Projets liés », 27/08/2026.** `listRelatedProjects`, les
  quatre règles de `docs/04` §5 **en SQL**, la préséance seule en TS. **Dix neutralisations, dix
  chutes isolées.** Une seule entité en base : deux règles inatteignables, lues sous sonde. +20, 1048.

- **T6.3 — le bloc « Journal » sur la page projet, 27/08/2026.** `listProjectJournal`, le `<details>`
  fermé en dernier, « Voir le journal » **devenu le `<summary>`** ; `SectionHeader` apprend `as` et
  `mark`. **Deux mises en défaut ont corrigé les tests.** Sonde d'archivage. +11, 1028 verts.

- **T6.2 — le journal : activités, ressources, résultats, relevés, 26/08/2026.** Les quatre
  `target_type` restants, **quatorze** points d'appel là où la fiche en annonçait treize, six noms et
  une troisième forme de phrase. Les relevés portent `product_id` et **pas** `project_id`, mesuré en
  base. Quatre gestes frappés sur le **vrai point d'entrée HTTP**, trois états vides lus dans le HTML
  servi, aucune ligne de sonde laissée. Trois mises en défaut isolées. +31 tests, 1017 verts.

- **T6.1 — le journal : la couche d'écriture, et les gestes du projet, 26/08/2026.** `record()`
  seizième entrée de `forDomain`, `lib/journal.ts` et ses deux formes de phrase, cinq points d'appel.
  Les cinq gestes frappés sur le **vrai point d'entrée HTTP**, aucune ligne de sonde laissée. Quatre
  mises en défaut, dont **une a corrigé le code**. +27 tests, 986 verts.

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
- **C4bis — Archivage et correction — T4bis.1 → T4bis.6, du 14 au 15/08/2026.** Six manques refermés
  sous six arbitrages : la matrice « corriger / archiver » est pleine, et un seul `canWrite` fait
  tomber sept gestes ensemble. Porte l'unicité partielle du résultat, qui fait de « retirer puis
  ressaisir » un chemin réel.
- **C5 — Indicateurs et lecture dans le temps — T5.1 → T5.6, du 16 au 17/08/2026.** Le bloc en
  lecture, les gestes de l'indicateur et du relevé, l'adoption, les deux couches de la frise du temps
  long. **Tout a depuis été refait hors ticket** (17/08), et neuf dérogations documentaires en sont
  consignées au journal technique.
- **TD — Dette technique et couche de présentation — TD.1 → TD.6, du 17 au 19/08/2026.** Six tickets
  **hors chantier** : le socle des panneaux (**−644 lignes nettes**), l'ouverture des panneaux côté
  client, le bouton et le lien d'action, puis les garde-fous ESLint — `spacingScaleLock`,
  `socleLock`, `uiLayerSeal`, `--max-warnings=0`.
- **C5bis — Équipe — T5bis.1 → T5bis.7, du 17 au 25/08/2026.** Le chantier que `docs/05` §5 n'avait
  pas prévu, intercalé sans décaler C6 ni C7 : trois tables, l'entrée « Équipe », les cinq filtres
  d'URL, la fiche en panneau, le radar, les six gestes d'écriture, et la sélection d'équipe du
  formulaire de projet qui **puise** enfin dans le référentiel. Dérogation bornée par six garde-fous.
- **Reprise d'interface hors ticket — seize gestes, du 17 au 21/08/2026.** Menu « … » de la roadmap,
  « Vision produit » puis sa reprise `northstar-v2`, « Personae », « Use Cases » et « Démarrage »
  (migrations 0005 à 0008), page projet en `project-v2`, bouton à trois rangs, roadmap reprise,
  entités en `/administration`, hiérarchie de la page produit.

---

## Points ouverts

*(un point, une destination. Un point sans destination est un point qu'on n'a pas tranché. Un point
qui se referme part dans `HISTORIQUE-TICKETS.md` — il ne reste pas barré ici. Chacun garde son fait
et sa destination ; le détail vit dans `JOURNAL-TECHNIQUE.md`.)*

### a. À trancher — sinon les tickets suivants héritent du problème

- **Les secrets Neon n'ont jamais été tournés.** Deux chaînes de connexion ont transité en clair dans
  la conversation le 12/08/2026. Elles ne sont que dans `.env.local`, hors dépôt, mais restent
  valides. **Reporté au découpage de C6 : rien dans les sept fiches n'en dépend.** → **action
  humaine.**
- **Rétablir un accompagnement sous un produit archivé le laisse invisible.** Aucune liste ne
  l'affiche, les deux jointures écartant les projets d'un produit archivé : le geste paraît ne rien
  faire. Aucun garde-fou (arbitrage (f) de C4bis) ; rien n'est perdu. **T6.1 a ouvert `restoreProject`
  sans le poser** — ce serait une règle métier neuve dans un ticket de trace. → **C7 au plus tard.**
- **Le chemin du clic de `/equipe` n'a pas été parcouru au navigateur.** Celui de l'**adresse** est lu
  dans le HTML servi ; celui du **clic** ne l'est pas. Les cinq propriétés en attente sont celles de
  `DrawerHost`, éprouvées par TD.2 sur les deux autres pages hôtes. → **action humaine, un clic.**

### b. Assignés à un ticket

- **Une piste de démarrage ne mène pas à l'activité qu'elle suggère.** `starters` ne porte
  **volontairement aucun `activity_type_id`** — une colonne sans lecteur est celle qu'on relit un jour
  sans savoir pourquoi (T5.2). Le geste coûterait une colonne et trois lignes ; à joindre au point
  voisin. → **ticket propre, C7 au plus tard.**
- **L'outil par défaut d'un type d'activité ne présélectionne rien.** Moitié refermée le
  21/08/2026 : `default_tool_id` **nomme** désormais le lien sortant d'une activité. Reste que le
  panneau de résultat (T4.4) ne présélectionne pas cet outil. → **ticket propre, C7 au plus tard.**
- **`project_indicators.note` n'a ni écrivain ni lecteur.** La colonne existe depuis T1.2 ; le panneau
  d'adoption saisit quatre champs, pas un cinquième (16/08/2026, règle 3). Le geste manquant est **une
  phrase sur le pourquoi d'une cible**. → **C7 au plus tard ; ou jamais, si personne ne la réclame.**
- **La coquille de navigation reste focalisable derrière le voile, sans JavaScript.** La page porte
  `inert`, la barre latérale vit dans le layout ; **l'obstacle a disparu en TD.2**, l'ouverture étant
  un état client. À joindre au **rebranchement des deux blocs manquants de la barre latérale** —
  personne courante et Administration. → **ticket barre latérale, C7 ou plus tôt.**
- **La barre d'ancres de la page projet est retirée du rendu.** Point **suspendu, pas refermé** :
  `subnav.tsx` reste sans appelant, les `id` de section et le `scroll-mt-19` restent posés, inertes.
  La question de l'entrée active se reposera telle quelle. → **ticket barre latérale.**
- **Deux colonnes saisies ne s'affichent nulle part** : `products.kind` (D10), lu par aucun écran ;
  `persons.kind` sur les deux lectures de projet, qui affichent tous les membres à l'identique.
  → **ticket propre, C7.**
- **Le filtre de la roadmap ne se partage plus par son adresse.** Repassé côté client à la demande :
  il ne se copie plus, ne survit plus au rechargement, n'existe plus sans JavaScript. Une adresse
  reviendrait par `history.replaceState`, **sans** rendre le clic navigant. → **C7 ; ou jamais.**
- **Le groupe « Annulé » n'est plus replié par défaut.** La roadmap en liste à plat l'a fait
  disparaître avec les quatre autres intertitres. `docs/03` §6 demande « en retrait, replié par
  défaut » : le retrait tient, le repli non. → **ticket propre, C7 au plus tard.**
- **Le contenu rédigé d'`/a-propos` reste à écrire.** La page a son en-tête et son état vide ; son
  contenu ne demande aucune lecture en base. → **ticket propre, C7 au plus tard.**
- **Corriger une personne du centre en intervenant côté entité lui laisse ses compétences.**
  `parsePersonForm` efface la disponibilité — le `CHECK` l'exige — mais rien d'équivalent n'existe
  pour `person_skills` : les liaisons restent affichées et **illisibles en écriture**. Aucune donnée
  perdue. → **ticket propre, C7 au plus tard.**
- **`lib/format.ts` porte une dette, et non plus deux** — T6.3 a refermé l'insécable.
  `PERSON_KIND_LABEL` vit dans `lib/forms/person.ts` : un déplacement, **plus un vocabulaire à
  trancher depuis T5bis.7**, et c'est lui qui l'a laissé ouvert. → **ce ticket-là.**
- **L'en-tête de `schema.ts` dit « les 26 tables métier », elles sont 30.** Chiffre faux d'une famille
  qui en compte quatre — `scoped.ts` disait 22, la fiche de C6 annonçait 25 puis « treize points
  d'appel » pour quatorze. T6.1 a **retiré** le compte plutôt que de le corriger ; le même geste
  attend ici. → **au prochain ticket qui l'ouvre.**
- **Trois fichiers de tests d'action nettoient encore sur `if (!f?.domainId) return`** — un
  `beforeAll` qui échoue après avoir créé son domaine le laisse en place, et il fait tomber le
  fichier suivant. **Ils étaient quatre, pas trois, et `projets/actions.test.ts` n'était pas corrigé
  malgré ce qui était écrit ici** (T6.2, qui a refermé les deux de son périmètre). Restent
  `projets/actions.test.ts`, `produits/actions.test.ts`, `administration/actions.test.ts`.
  → **au prochain ticket qui ouvre l'un d'eux.**
- **`uiLayerSeal` ne scelle pas `components/shell/`.** Rien n'empêcherait `components/ui/` d'importer
  `breadcrumb.tsx` ou `main-nav.tsx`. La propriété est vraie aujourd'hui : un trou dans le scellement,
  pas une régression, qui se comble en une ligne. → **au prochain ticket qui ouvre `eslint.config.mjs`.**
- **Les deux use cases de la fixture n'ont aucun persona rattaché.** `scripts/seed.ts` n'en sème
  aucun. Le rattachement est facultatif et le lien a été éprouvé par sonde scopée : ce qui manque est
  un **jeu d'essai**. → **au prochain ticket qui sème des personae.**
- **Deux états vides ne se lisent dans aucun HTML servi** : la **cible** absente d'une North Star et
  la personne dans aucune équipe. **Les trois autres sont refermés par T6.2**, lus après archivage
  des cinq relevés du domaine puis rétablis. Ces deux-ci ne s'atteignent par aucun geste de relevé —
  ils tiennent à `project_indicators` et à `project_members`. → **T6.6**, même sonde ; sinon C7.
- **Deux capacités du bouton n'ont aucun appelant, et c'est une entorse assumée.** Le rang `tertiary`
  et les props d'icône de `Button` enfreignent l'en-tête de `button.tsx` — objet même de la demande,
  **éprouvés par sonde**. Premier appelant naturel : le « Annuler » des quatre pieds de formulaire.
  → **au prochain ticket qui ouvre un pied de formulaire.**
- **`disabled:opacity-60` est servi sur onze balises qui ne peuvent pas être désactivées** — les
  `<a>`, `<Link>` et `<DrawerLink>` qui portent un bouton, contre une seule source pour l'état
  désactivé. → **sans échéance.**

### c. Dettes assumées, sans échéance

- **La page produit porte deux langages d'en-tête.** « Vision produit » a pris le surtitre en
  capitales et le kebab en absolu de `northstar-v2` ; les blocs voisins gardent `BlockHeader`, sur
  demande. Au second bloc qui reprend le surtitre, `Eyebrow` quitte `indicators.tsx` pour
  `components/ui/block.tsx`. → **arbitrage humain, pas un ticket.**
- **Une carte ne se détache d'aucun fond, et c'est le design system qui manque.** Trois positions :
  la North Star (1,04:1, sa bordure la sauve à 1,33:1), les cartes de personae (1,05:1, le filet à
  1,17:1), le panneau de T5bis.4 (1,24:1). Le plus franc des `surface-neutral-*` plafonne à 2,22:1,
  sous la limite de 3:1. **Tous les couples de texte passent 4,5:1.** → **arbitrage humain, sinon C7.**
- **Sans JavaScript, les gestes d'une carte de roadmap ne sont plus atteignables.** Le menu « … »
  décide de son ouverture, seule exception arbitrée à D30 : les **quatre actions serveur** n'ont aucun
  repli, leurs formulaires vivant dans la charge RSC. Refermer demanderait un `<details>` natif — qui
  perdrait `Échap`, le clic extérieur et `role="menu"` — ou une URL par geste. → **sans échéance.**
- **La base de développement a dérivé de la fixture, et c'est acté. Elle est jetable** — la règle 4
  protège la donnée métier, pas une fixture locale. Un critère passé ne s'y relit donc pas
  nécessairement, et **une comparaison avant/après n'y vaut que si rien n'a bougé entre les deux
  mesures**. Pas de `db:reset`. → **sans échéance ; un ticket d'outillage si le besoin devient réel.**
- **Le design system a huit manques, et aucun n'a été inventé.** Trois élévations et deux gradients
  nommés sans valeur ; aucun jeton de bordure de contrôle, de bordure d'erreur, d'interlettrage, de
  voile au-delà de 40 %, de séparateur, de mouvement (`--duration-drawer` et `--easing-drawer` sont
  dans `app/tokens.css` faute de mieux) ; **`--number-*` s'arrête à 100 px** quand dix-neuf valeurs
  légitimes vivent au-delà. **Six substituts mesurés** dans `form-field.tsx` et `panel.tsx` —
  `content-neutral-normal` 3,88:1, `content-danger-base` 5,19:1, `content-neutral-dark` 3,05:1,
  `content-neutral-base` 4,98:1. **Aucun septième ne s'invente.** → **à faire remonter au design
  system.**
- **Deux gabarits de grille portent une dimension en dur, et c'est un arbitrage.**
  `indicators.tsx:495` et `:585` disent à quelle largeur une carte cesse de tenir : un **point d'arrêt
  de mise en page**, pas une valeur de thème (T1.6), hors de la clause 2 de `spacingScaleLock` par
  construction. → **à reposer si le design system s'enrichit d'une grille.**
- **La création d'un projet n'est pas atomique, et ne peut pas l'être.** `neon-http` n'a pas de
  transaction interactive — la couche n'a que `batch`. La parade est de tout confronter au domaine
  **avant** d'écrire et d'ordonner les ajouts avant les retraits (T3.6). Reste ouvert : une écriture
  qui réussirait puis dont la suivante échouerait — **dont la ligne de journal d'un geste**.
  → **le jour où la couche exposera une transaction.**
- **La fixture est incomplète sur les ressources et les résultats.** Les deux résultats factices
  n'ont pas de lien profond, trois des quatre ressources du brief ne sont pas semées, et
  **`tools.base_url` porte trois adresses provisoires sur `example.com`** pour que « Démarrage »
  ouvre quelque chose. → **sans échéance, ou l'humain fournit les adresses.**
- **L'amorçage rapproche par clé naturelle, donc un renommage recrée — et c'est arrivé.** La clé des
  activités, étendue à `projet · type · période`, atténue sans éliminer : un renommage a laissé deux
  lignes en base de développement, l'ancienne orpheline — sans conséquence en production, où
  l'amorçage ne tourne pas. **Refermé pour les entités seules.** → **les six restants, C7.**
- **Les filtres ne survivent pas à un aller-retour par la navigation principale.** `docs/06` §9 les
  veut conservés ; le retour navigateur les restitue, un clic sur « Projets » repart à zéro.
  Mémoriser l'URL de retour demanderait un état de session. → **si l'usage le réclame.**
- **La liste transverse n'est ni paginée ni plafonnée.** `docs/06` §4 la projette « à quinze puis
  cinquante projets », ce qu'une page rend sans effort. Au-delà, un plafond avant une pagination.
  → **si l'usage le réclame.**
- **Une activité `in_progress` porte une fin de période à venir.** La fraîcheur retient
  `max(coalesce(period_end, period_start))` : pour un atelier en cours en août, c'est le 31 août. Au
  mois, l'affichage reste juste. → **le jour où une période d'activité se dira au jour.**

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
- **Le domaine courant est le premier domaine actif trouvé en base**, rendu **par nom** : pas de
  variable d'environnement, `docs/05` §3 posant un domaine unique. Le jour où un second existe, le
  choix revient au fournisseur d'identité.
- **`/dev/session` est une route de développement**, rendue 404 en production, reliée à aucune
  navigation. Elle disparaîtra avec le stub en C7.
- **L'authentification est un stub jusqu'en C7**, mais le contexte de session a sa forme finale.
  `lib/auth/provider.ts` est le seul fichier que C7 réécrit.
- **Les maquettes `docs/design/maquettes/` sont une référence visuelle**, jamais branchées.
- **Une fonction serveur se frappe en `text/plain`**, jamais en urlencodé : la charge est le tableau
  d'arguments encodé en Flight. **Le code HTTP ne dit jamais ce qui a été écrit** — T6.1 a mesuré un
  archivage refusé qui rend **200**, comme celui qui réussit, et une action frappée en urlencodé avec
  le **bon** identifiant qui rend **404**, comme un identifiant inconnu. Trois « 200 muets » avant
  elle, faute d'étape témoin : TD.1, T5bis.4, T5bis.6. **Seul le décompte en base tranche.**
- **Le levier n'est pas le modèle mais les quatre disciplines de vérification** — le relevé des
  modèles employés ticket par ticket est dans `HISTORIQUE-TICKETS.md`.
