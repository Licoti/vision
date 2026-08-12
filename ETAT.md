# ETAT — Vision

Fichier de contexte de session. Mis à jour par Claude en fin de chaque ticket.

**Dernière mise à jour :** T2.5 terminé
**Chantier en cours :** C2 — Produits et projets
**Ticket en cours :** aucun — prochain à lancer : T2.6 (création et édition d'un projet)

---

## Avancement

| Chantier | Tickets | État |
|---|---|---|
| C1 — Socle technique | T1.1 → T1.6 | **terminé** |
| C2 — Produits et projets | T2.1 → T2.6 | en cours — T2.1 à T2.5 faits |
| C3 — Activités et roadmap | à découper | à faire |
| C4 — Ressources et résultats | à découper | à faire |
| C5 — Indicateurs et temps long | à découper | à faire |
| C6 — Liens et journal | à découper | à faire |
| C7 — Finitions, budget, SSO | à découper | à faire |

**Point de bascule :** C1 à C3 constituent le POC minimal démontrable.

---

## Journal des tickets

*(une ligne par ticket terminé : identifiant, date, écarts éventuels)*

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

---

## Points ouverts

- **Pas de tokens d'élévation ni de gradient.** Le design system les nomme sans leur donner de
  valeur. Rien n'a été inventé. La question se posera au premier composant qui porte une ombre —
  panneau latéral (C3) ou modale.
- **Le contenu rédigé d'`/a-propos` reste à écrire.** La page a son en-tête et son état vide comme
  les cinq autres. Son contenu — ce qu'est Vision, le vocabulaire, ce qu'elle ne fait pas, l'état
  daté — ne demande aucune lecture en base : il aurait pu tenir dans T1.6, et n'y a pas tenu parce
  que le périmètre disait « routes vides ». À porter par un ticket, au plus tard en C7.
- **Deux blocs de la barre latérale attendent toujours d'être rebranchés.** La carte de la personne
  courante et l'entrée Administration sont dans les maquettes ; T1.6 s'interdisait toute lecture en
  base. L'obstacle a disparu — les écrans lisent la session depuis T2.1, et T2.5 lit
  `can.manageDomain` pour masquer ses actions, exactement ce dont l'entrée Administration a besoin.
  Ce qui manque n'est plus un droit mais un ticket : la coquille est hors du périmètre de tous ceux
  de C2. À porter par le ticket de l'écran Administration (D25, C7), ou plus tôt.
- **Un intervenant côté entité ne se distingue pas sur deux écrans sur trois.** La page projet le
  marque depuis T2.4 — pastille grise **et** mention « côté entité », le texte ne dépendant jamais
  de la couleur. La page produit et la liste transverse continuent d'afficher tous les membres à
  l'identique : leurs lectures ne remontent pas `persons.kind`, et le faire aurait débordé du
  ticket — arbitrage rendu avec l'humain. À reprendre au premier ticket qui touche à ces deux
  listes.
- **Le commanditaire est vide sur toute la fixture.** `docs/06` §5 l'attend dans l'en-tête, T2.4
  l'affiche, et il affiche « Non renseigné » sur les trois projets : le brief ne nomme aucun
  commanditaire et l'amorçage laisse `sponsor` nul. La maquette, elle, montre « Marc Tellier
  (entité) ». Le champ n'a donc jamais été vu peuplé. À trancher avec T2.6, l'écran qui le saisit,
  ou par un commanditaire fourni pour l'amorçage.
- **Le design system n'a ni jeton de bordure de contrôle, ni jeton de bordure d'erreur.** Le plus
  sombre des `border-*`, `border-default`, ne dépasse pas 1,2:1 sur le fond de page, là où la
  limite d'un composant d'interface se mesure à 3:1 ; et aucun `border-danger-*` n'existe. T2.3 a
  retenu `content-neutral-normal` (3,88:1 mesuré) pour les champs de sa barre de filtres, T2.5 a
  repris ce choix pour les quatre contrôles du formulaire de produit et y a ajouté
  `content-danger-base` (5,19:1 mesuré) pour un champ en erreur — deux jetons de contenu employés
  comme bordures. À faire remonter à qui maintient le design system ; d'ici là, tout nouveau
  formulaire reprend ces deux choix.
- **Les filtres ne survivent pas à un aller-retour par la navigation principale.** `docs/06` §9
  demande qu'ils soient conservés quand on entre dans un projet et qu'on revient. Ils vivent dans
  l'URL, donc le retour navigateur les restitue ; un clic sur « Projets » dans la barre latérale
  repart à zéro. Mémoriser l'URL de retour demanderait un état de session — hors périmètre de
  T2.3. À trancher si l'usage le réclame.
- **La liste transverse n'est ni paginée ni plafonnée.** `docs/06` §4 la projette « à quinze puis
  cinquante projets », ce qu'une page rend sans effort. La question se posera au-delà, et elle
  appellera un plafond avant une pagination : la comparaison ligne à ligne est le but de l'écran.
- **Un produit archivé s'affiche comme un produit vivant, et aucun écran ne l'archive.** T2.5 ne
  l'a pas fait : sa fiche ne nomme que quatre champs, et la règle 3 interdit l'ajout — arbitrage
  rendu avec l'humain. Il n'existe donc toujours aucun chemin d'archivage dans l'interface, et la
  fixture ne contient aucune ligne archivée. **Ce point n'a plus de ticket désigné** : il appelle
  désormais un ticket à lui, en C7 au plus tard, qui traitera l'archivage d'un produit et d'un
  projet ensemble — le geste, sa confirmation, et l'affichage d'une ligne archivée là où elle
  reste lisible. Noter que `find` rend les lignes archivées : `/produits/{id}/modifier` ouvrirait
  aujourd'hui le formulaire d'un produit archivé.

- **Le type d'un produit ne se voit sur aucun écran de lecture.** T2.5 saisit `kind` — « Produit
  accompagné » ou « Mission transverse » (D10) — mais la liste des produits, la page produit et la
  liste transverse affichent les deux à l'identique. Aucun des trois écrans n'a de colonne pour
  lui, et en ajouter une aurait débordé de T2.5 comme des tickets qui les ont posés. À reprendre
  au premier ticket qui touche à ces listes, ou à laisser tel quel si le type n'a d'usage qu'au
  rattachement.

- **Une entité archivée disparaîtrait du formulaire d'édition d'un produit.** La liste des entités
  proposées écarte les lignes archivées. Si le produit modifié pointait une entité archivée, sa
  valeur ne figurerait dans aucune option et le formulaire exigerait un nouveau choix plutôt que
  de conserver en douce un rattachement archivé. Le comportement est défendable mais **n'a pas été
  éprouvé** : aucun écran n'archive une entité (D25, C7) et l'amorçage n'en archive aucune.
- **Une activité `in_progress` porte une fin de période à venir.** La fraîcheur retient
  `max(coalesce(period_end, period_start))` : pour l'atelier en cours du mois d'août, c'est le
  31 août. Au mois, l'affichage dit « août 2026 » et reste juste. Le jour où une date au jour
  s'affiche quelque part, la question se repose.
- **Rien n'empêche techniquement un import direct de `lib/db/client`.** Le verrou ESLint a été
  écarté du périmètre de T1.3. La règle 1 tient aujourd'hui par la convention, l'en-tête de
  `client.ts` et un `grep`. À reposer si un import sauvage apparaît.
- **Les tables de liaison se suppriment pour de bon.** Elles ne portent pas d'`archived_at` : la
  couche expose `unlink`, une vraie suppression, réservée à elles par le typage. C'est une
  conséquence de T1.2, pas un choix de T1.3. À confirmer au premier écran qui retire un membre
  d'un projet.
- **Un projet archivé est-il en lecture seule ?** Rien ne le dit dans `docs/`. T1.4 n'a pas
  tranché : un contributeur désigné d'un projet archivé garde son droit d'écriture. À régler avec
  le ticket d'archivage ci-dessus, et non plus « en C2 » : T2.5 n'a pas archivé, et T2.6 ne
  l'archivera pas non plus — sa fiche ne le mentionne pas davantage.
- **Le domaine courant est le premier domaine actif trouvé en base.** Pas de variable
  d'environnement : `docs/05` §3 pose un domaine unique. Le jour où un second domaine existe, le
  choix devient un vrai choix et revient au fournisseur d'identité.
- **`/dev/session` est une route de développement**, rendue 404 en production. Elle disparaîtra
  avec le stub en C7. Elle n'est reliée à aucune navigation : T1.6 n'a pas à la référencer.
- **Les deux résultats factices n'ont pas de lien profond.** Le brief §7 les annonce « lien
  Ergonome » et « lien vers l'outil » sans donner d'adresse, et rien n'a été inventé. C4 devra
  traiter le résultat sans lien comme un cas normal, ou l'humain fournira les adresses. Même
  silence sur `tools.base_url` et sur les courriels des personnes.
- **Trois des quatre ressources du brief ne sont pas semées.** Seule « Restitution des tests —
  vague 2 » a un rattachement donné. « Grille d'entretien », « Maquettes v3 » et « Rapport d'audit
  d'accessibilité » attendent une ancre — projet, activité, URL — que le brief ne fournit pas.
- **Renommer un produit ou un référentiel dans l'interface le fera recréer au prochain amorçage.**
  L'amorçage rapproche par clé naturelle, et le libellé est cette clé — pour les référentiels comme
  pour `products`, que `scripts/seed.ts` reconnaît par `row.name`. **T2.5 rend ce piège
  atteignable** : renommer « Espace client web » puis relancer `npm run db:seed` recrée un second
  produit sous l'ancien nom, et modifier sa description ou son entité sans le renommer les remet à
  la valeur du fichier. Sans conséquence en production, où l'amorçage ne tourne pas ; à garder en
  tête sur la base de développement, et à revoir avec l'écran de gestion des référentiels (D25, C7).
- **Deux secrets Neon ont transité en clair dans la conversation**, les 12/08/2026 — la base de
  développement, puis la branche de test. Ils ne sont que dans `.env.local`, hors dépôt, mais à
  faire tourner si ces transcripts quittent le poste.

---

## Rappels de contexte

- Modèle : **Opus pour C1**, Sonnet à partir de C2.
- L'authentification est un stub jusqu'en C7, mais le contexte de session a sa forme finale.
- Les maquettes `docs/design/maquettes/` sont une référence visuelle, jamais branchées.
