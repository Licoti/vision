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

---

## Points ouverts refermés

*(archivés depuis `ETAT.md` le 14/08/2026 — ils étaient barrés dans la section « Points ouverts »,
où ils occupaient encore la place. Conservés tels quels : un point refermé documente comment il
l%s été.)*

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

## Faits acquis, versés aux « Rappels de contexte » d'`ETAT.md`

*(ces deux entrées n'étaient plus des points ouverts mais des règles permanentes. `ETAT.md` en garde
une forme courte ; le raisonnement complet est ici.)*

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
