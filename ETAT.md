# ETAT — Vision

Fichier de contexte de session. Mis à jour par Claude en fin de chaque ticket.

**Dernière mise à jour :** T3.3 terminé — une activité se saisit, et son état se déduit de sa période
**Chantier en cours :** C3 — activités et roadmap
**Ticket en cours :** aucun — prochain ticket : **T3.4 — Édition d'une activité**

---

## Avancement

| Chantier | Tickets | État |
|---|---|---|
| C1 — Socle technique | T1.1 → T1.6 | **terminé** |
| C2 — Produits et projets | T2.1 → T2.6 | **terminé** |
| C3 — Activités et roadmap | T3.1 → T3.6 | **en cours** — T3.1, T3.2, T3.3 faits |
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

---

## Points ouverts

- **Pas de tokens d'élévation ni de gradient.** Le design system les nomme sans leur donner de
  valeur. Rien n'a été inventé. **T3.2 est le composant que cette dette attendait**, et la question
  est désormais posée plutôt que théorique : le panneau latéral se sépare du fond par un voile et un
  filet, l'ombre de la maquette (`-8px 0 32px rgba(21,21,27,.16)`) n'étant pas inventable. Le voile
  seul ne suffisait pas — mesuré, il laisse la surface du panneau à 2,66:1 de lui —, et c'est le
  filet qui a dû être relevé d'un cran pour tenir les 3:1. **À faire remonter à qui maintient le
  design system**, avec les jetons de bordure et d'interlettrage déjà demandés.
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
  listes. **T2.6 rejoint la page projet** : son formulaire écrit « · côté entité » à côté du nom,
  le texte ne dépendant jamais de la couleur. Deux écrans sur quatre le disent désormais.
- ~~**Le commanditaire est vide sur toute la fixture.**~~ **Refermé par T2.6**, par l'écran et non
  par l'amorçage : le formulaire saisit `sponsor` (D6, texte libre), et le projet créé en
  vérification affiche « Hélène Vasseur » dans son en-tête. `scripts/seed.ts` n'est pas touché —
  les trois projets du brief n'ont toujours pas de commanditaire, et le brief n'en nomme aucun.
- **Le design system n'a ni jeton de bordure de contrôle, ni jeton de bordure d'erreur.** Le plus
  sombre des `border-*`, `border-default`, ne dépasse pas 1,2:1 sur le fond de page, là où la
  limite d'un composant d'interface se mesure à 3:1 ; et aucun `border-danger-*` n'existe. T2.3 a
  retenu `content-neutral-normal` (3,88:1 mesuré) pour les champs de sa barre de filtres, T2.5 a
  repris ce choix pour les quatre contrôles du formulaire de produit et y a ajouté
  `content-danger-base` (5,19:1 mesuré) pour un champ en erreur — deux jetons de contenu employés
  comme bordures. T2.6 a repris ces deux mêmes choix sans en inventer un troisième, et c'était le
  but : ses neuf couples de couleurs sont tous des couples déjà mesurés. À faire remonter à qui
  maintient le design system ; d'ici là, tout nouveau formulaire reprend ces deux choix.
  **T3.1 ajoute un troisième manque à la même liste : il n'existe aucun jeton d'interlettrage.**
  Les intitulés en capitales des maquettes portent `letter-spacing: .04em` ; `app/tokens.css` n'a
  rien de tel, et `tracking-wide` de Tailwind ferait entrer une valeur hors thème. Les capitales
  sont donc rendues sans interlettrage, comme le bandeau de colonnes de `ListHeader` depuis T1.6.
  **T3.2 en ajoute un quatrième, et il tient au voile de modale** : la couche sémantique n'expose
  que cinq surfaces à opacité, la plus dense à 40 % (`surface-neutral-opacity-distinct`, exactement
  la valeur de la maquette). Un voile qui porterait **seul** la séparation du panneau demanderait
  plus — mesuré, celui-ci laisse le panneau à 2,66:1 de lui. Le panneau s'en sort par son filet, à
  `content-neutral-dark` : c'est le seul endroit du produit où un filet est plus sombre que celui
  des contrôles, et il ne le doit qu'à ce manque.
  **T3.3 n'ajoute rien à cette liste, et c'était le but** : le premier formulaire du panneau reprend
  `content-neutral-normal` pour ses contrôles et `content-danger-base` pour un champ en erreur, sans
  en inventer un troisième — les neuf couples de l'écran ont été mesurés et aucune correction n'en
  est sortie.

- **La coquille de navigation reste focalisable derrière le voile, sans JavaScript.** Le contenu de
  la page projet porte `inert` quand le panneau est ouvert, mais la barre latérale vit dans
  `app/(app)/layout.tsx` — hors du périmètre de T3.2 — et un layout Next ne reçoit pas les
  `searchParams` : la page ne peut pas la rendre inerte. Avec JavaScript, `FocusTrap` la met hors
  d'atteinte au clavier et `aria-modal` la retire de l'arbre d'accessibilité, donc le cas ne se
  produit pas. Sans JavaScript, sortir du panneau par le bas ramène au lien d'évitement, au logo puis
  aux quatre entrées de navigation avant de revenir sur la croix : le cycle existe, il passe par la
  coquille. Le tenir vraiment demanderait que le layout connaisse l'état du panneau — à reprendre si
  une seconde modale arrive, ou avec le ticket qui rebranche les deux blocs manquants de la barre
  latérale.
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
- **La base de développement porte cinq activités archivées de plus depuis T3.3.** Les cinq saisies
  de vérification ont été **archivées et non supprimées** (règle 4) une fois les critères lus : la
  roadmap les écarte, si bien que le critère de T3.1 se relit mot pour mot sur « Autonomie des
  opérations courantes » — cinq activités, dans l'ordre exact — et que la fraîcheur du projet est
  revenue à août 2026. L'archivage a confirmé au passage une propriété que T3.3 n'avait pas à
  éprouver : `archive` recalcule `last_activity_at` comme l'insertion, et la valeur est bien
  redescendue de septembre à août. `npm run db:seed` ne les retirera pas — l'amorçage ignore ce
  qu'il n'a pas semé. Noter aussi qu'un « Test projet » et un produit « test », d'une session
  antérieure et étrangers à ce ticket, traînent dans cette base.
- **Rien n'archive une activité dans l'interface.** T3.3 a dû passer par la couche d'accès pour
  ranger ses saisies de vérification. Ce n'est pas un manque du ticket — `docs/03` §4 ferme la
  suppression, et **l'annulation de T3.5 en tient lieu** pour une activité qui ne se fera pas. Mais
  l'annulation n'est pas l'archivage : elle demande un motif et laisse l'activité visible. Une
  activité saisie **par erreur** n'a donc aucun chemin. À joindre au ticket d'archivage déjà
  attendu en C7 pour le produit et le projet.

- **Trois arbitrages rendus d'avance pour T3.3, T3.4 et T3.5 — 13/08/2026.** Ils ne sont dans aucun
  document, ils ont été tranchés avec l'humain hors ticket, et ils sont à consommer tels quels.
  **(a) et (b) ont été consommés par T3.3**, sans écart : la table de dérivation est écrite telle
  quelle dans `deriveActivityState`, et le refus (b) est le quatrième des sept. **(c) attend T3.4**,
  et reste à lire avant d'écrire une ligne de ce ticket. T3.3 lui laisse le terrain net : la
  dérivation est une fonction pure qui reçoit la période et le jour, donc T3.4 n'aura qu'à décider
  **s'il l'appelle**, jamais à la réécrire.

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
- **Une activité annulée est invisible entre T3.1 et T3.5.** La roadmap de T3.1 écarte l'état
  `cancelled` de sa lecture, sa fiche lui interdisant le cinquième groupe : c'est T3.5 qui l'ouvre,
  parce que c'est lui qui peut le peupler. La donnée est en base et n'est pas perdue — elle n'est
  pas affichée. Sans conséquence aujourd'hui, la fixture ne contenant aucune activité annulée et
  aucun écran ne pouvant en produire. **Le jour venu, T3.5 retire le `ne(state, 'cancelled')` de
  `listProjectRoadmap` et ajoute une cinquième entrée à `GROUPS` — rien d'autre.**
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
  aujourd'hui le formulaire d'un produit archivé. **T2.6 met le projet dans le même cas** :
  `/projets/{id}/modifier` ouvrirait celui d'un projet archivé, et sa fiche ne mentionnait pas
  davantage l'archivage — arbitrage rendu avec l'humain, périmètre tenu.

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
  **T2.6 étend le cas au produit** : un projet rattaché à un produit archivé verrait son
  rattachement absent des options. Noter la nuance retenue au passage — dans le même formulaire,
  les entités servant à **décrire** un produit sont lues archivées comprises, parce qu'on ne
  choisit pas une entité, on la lit. Décrire et proposer n'appellent pas le même filtre.

- **La création d'un projet n'est pas atomique, et ne peut pas l'être.** `neon-http` n'a pas de
  transaction interactive — la couche n'a que `batch`. Le formulaire écrit `persons`, `projects`
  puis trois tables de liaison : une écriture refusée en cours de route laisserait les précédentes.
  La parade de T2.6 est de tout confronter au domaine **avant** d'écrire, si bien que la fenêtre
  résiduelle se limite à une ligne supprimée entre la vérification et l'écriture. Acceptable au
  POC. À reprendre le jour où la couche exposera une transaction — ou plus tôt, si un formulaire
  plus large arrive en C3. **T3.3 ne rouvre pas la question** : la saisie d'une activité écrit **une
  seule table**, et le recalcul de `last_activity_at` part dans le même `batch` que l'insertion,
  donc dans la même transaction. C'est **T3.6** qui la rouvrira, lui qui écrira
  `activity_participants` à côté d'`activities`.

- **On n'ajoute qu'une personne par enregistrement.** Sans JavaScript, un champ répétable n'existe
  pas : le bloc d'ajout de T2.6 crée une personne, et pour en ajouter deux il faut enregistrer puis
  rouvrir le formulaire. La limite est écrite dans l'écran. Elle tombera avec l'écran
  d'administration des personnes (D25, C7).
- **Une activité `in_progress` porte une fin de période à venir.** La fraîcheur retient
  `max(coalesce(period_end, period_start))` : pour l'atelier en cours du mois d'août, c'est le
  31 août. Au mois, l'affichage dit « août 2026 » et reste juste. Le jour où une date au jour
  s'affiche quelque part, la question se repose.
- ~~**Rien n'empêche techniquement un import direct de `lib/db/client`.**~~ **Fermé avant C3** :
  `eslint.config.mjs` porte désormais `no-restricted-imports` sur `lib/db/client`, exception faite
  de `lib/db/scoped.ts` et des fichiers `*.test.ts` — vérifié en réintroduisant temporairement
  l'import dans `lib/queries/products.ts`, qui fait échouer `npm run lint`.
- ~~**Les tables de liaison se suppriment pour de bon.**~~ **Confirmé par T2.6**, l'écran annoncé :
  retirer un membre, un métier ou une approche d'un projet appelle `unlink`, une vraie suppression
  de ligne, et c'est le comportement voulu — une désignation défaite n'est pas une donnée métier
  qu'on range, c'est un lien qui n'existe plus. La règle 4 tient parce que le typage réserve
  `unlink` aux tables sans `archived_at`.
- **Un projet archivé est-il en lecture seule ?** Rien ne le dit dans `docs/`. T1.4 n'a pas
  tranché : un contributeur désigné d'un projet archivé garde son droit d'écriture. À régler avec
  le ticket d'archivage ci-dessus, et non plus « en C2 » : T2.5 n'a pas archivé, et T2.6 ne
  l'a pas archivé non plus — sa fiche ne le mentionnait pas davantage. À régler avec le ticket
  d'archivage, en C7 au plus tard.
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
- **Renommer un produit ou un référentiel dans l'interface le fera recréer au prochain amorçage —
  et la même famille de piège touche désormais les activités.** L'amorçage rapproche par clé
  naturelle : le libellé pour les référentiels et pour `products`, que `scripts/seed.ts` reconnaît
  par `row.name`. **T2.5 rend ce piège atteignable** : renommer « Espace client web » puis relancer
  `npm run db:seed` recrée un second produit sous l'ancien nom, et modifier sa description ou son
  entité sans le renommer les remet à la valeur du fichier. **Avant C3**, la clé des activités —
  `projet · type · période` depuis lors, `projet · type` seul avant — a été étendue en prévision :
  C3 rend normal un second Audit UX sur un projet qui dure, ce que la fixture ne fait jamais mais
  qu'un contributeur fera. Sans la période, une activité réelle et une ligne de fixture sous la même
  clé se seraient réconciliées en une seule à l'amorçage suivant, l'une écrasant l'autre. La période
  atténue le risque, elle ne l'élimine pas : deux activités réelles du même type sur le même projet
  **dans le même mois** collisionneraient encore. Sans conséquence en production, où l'amorçage ne
  tourne pas ; à garder en tête sur la base de développement, et à revoir avec l'écran de gestion
  des référentiels (D25, C7).

- **La base de développement porte un accompagnement de plus depuis T2.6.** « Refonte de l'espace
  documents », sur « Espace client web », créé en vérification et **conservé** : il porte trois
  choses que la fixture n'avait pas — un commanditaire renseigné, une personne `source = manual`
  créée depuis l'interface (Nadia Berthier), et un troisième accompagnement sur ce produit. Il a
  été ramené par le formulaire à son produit et à son équipe d'origine après les essais de
  changement de produit. **Conséquence à connaître** : les critères de T2.1 à T2.4 se lisaient sur
  « 2 accompagnements » pour ce produit ; ils s'y liraient désormais sur 3. `npm run db:seed` ne le
  retirera pas — l'amorçage ignore ce qu'il n'a pas semé.
- **Deux secrets Neon ont transité en clair dans la conversation**, les 12/08/2026 — la base de
  développement, puis la branche de test. Ils ne sont que dans `.env.local`, hors dépôt, mais à
  faire tourner si ces transcripts quittent le poste.

---

## Rappels de contexte

- Modèle : **Opus pour C1**, Sonnet à partir de C2 — ce que disent aussi les en-têtes de
  `tickets-C1-C2.md` et de `tickets-C3.md`. **En pratique, C2 puis T3.1 et T3.2 ont été menés avec
  Opus** : un sur-provisionnement par rapport au plan écrit, pas un rattrapage. Arbitrage du
  13/08/2026 pour la suite de C3 : **T3.3 sur Opus** — c'est le seul ticket restant qui porte une
  logique neuve, la dérivation de l'état, et le pivot que l'en-tête de C3 désigne lui-même ;
  **T3.4, T3.5 et T3.6 sur Sonnet**, ils rejouent des motifs posés en C2 et leurs dettes arrivent
  toutes avec leur remède écrit. T3.6 est T2.6 transposé. Le levier n'est pas le modèle mais les
  cinq disciplines de vérification de l'étape 4 : tant qu'elles ne sont pas écrites dans
  `CLAUDE.md`, un ticket peut être correct **et** non vérifié.
- L'authentification est un stub jusqu'en C7, mais le contexte de session a sa forme finale.
- Les maquettes `docs/design/maquettes/` sont une référence visuelle, jamais branchées.
