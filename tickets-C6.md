# Tickets — C6

Un ticket = une session de CLI. Chaque ticket porte un objectif, un périmètre de fichiers, un
critère de validation vérifiable et ses interdits.

**Règle commune à tous les tickets :** ne modifier aucun fichier hors du périmètre annoncé, ne
créer aucune fonctionnalité non listée, mettre à jour `ETAT.md` en fin de ticket.

---

# C6 — Liens et journal

**Le sixième chantier de `docs/05` §5, à son rang et avec son contenu** : *liens déduits, liens
déclarés, journal `events`, flux d'activité récente en vue globale.* Ni C4bis ni C5bis ne l'ont
décalé.

**Ce qui le fonde tient en trois constats.** Un projet ne dit pas ses voisins, alors que le
rattachement obligatoire à un produit garantit qu'il n'est jamais isolé et que quatre règles de
rapprochement sont écrites depuis `docs/04` §5. Aucune écriture ne laisse de trace : `events` est au
schéma depuis T1.2 et n'a **jamais reçu une ligne**, si bien que la question « qui a saisi ça, et
quand ? » n'a aucune réponse. Et la vue d'ensemble, point d'entrée de l'application, est un **état
vide** depuis T1.6 — elle annonce ce qu'elle portera au lieu de le porter.

C6 remplit une matrice de trois objets et de leurs gestes :

| Objet | Écrire | Lire sur le projet | Lire en vue globale |
|---|---|---|---|
| Journal `events` | T6.1, T6.2 | T6.3 | T6.6 |
| Lien déduit | — (jamais stocké) | T6.4 | — |
| Lien déclaré `project_links` | T6.5 | T6.4, T6.5 | — |

**Aucune migration n'est attendue.** `events`, `project_links`, les énumérés `event_verb` et
`event_target_type`, l'index sur `occurred_at` : tout est dans `0000`. Le chantier branche ce qui
existe. **Une migration qui s'imposerait est un signal d'arrêt**, pas une étape — elle voudrait dire
que le chantier a débordé de son périmètre.

**L'ordre des sept tickets va de l'écriture à la lecture, puis aux liens, puis à la vue
d'ensemble** — le rythme de C2, C3 et C5. Le journal s'écrit avant de se lire, faute de quoi le
premier écran se validerait sur une table vide et ne prouverait rien.

---

## Ce dont le journal part : vide, sur des écritures déjà faites

Le découpage de C4bis l'a acté et il ne se rouvre pas : *ouvrir le journal à moitié poserait une
seconde autorité sur une table que personne n'a branchée.* C5, C5bis et seize reprises hors ticket
ont écrit depuis, sans laisser de trace. **Conséquence à connaître avant T6.3 :** le journal démarre
vide sur tous les projets existants, son état vide est le premier rendu de tous, et **aucun
rattrapage rétroactif n'est écrit** — reconstituer des événements à partir de `created_at` serait
inventer un acteur et une phrase que personne n'a produits.

---

## Huit arbitrages rendus avant écriture, à ne pas rouvrir en cours de ticket

**(a) Le journal s'écrit par `scope.record()`, appelé par l'action.** L'écriture passe par la couche
scopée — règle 1 tenue, `domain_id`, `actor_id` et `created_by` posés par elle, jamais par
l'appelant —, mais **la décision de journaliser et la phrase appartiennent à l'action**, seule à
connaître le vocabulaire : « Statut passé à *Terminé* » et non « Projet modifié ». C'est un écart à
la lettre de `docs/04` §4, qui écrit « alimenté par la couche d'accès » : l'écriture y reste, c'est
le **déclenchement** qui n'y est pas. Consigné dans `JOURNAL-TECHNIQUE.md`.

Le prix de cet arbitrage est nommé : **un geste qui oublie d'appeler `record` ne laisse pas de
trace, et rien ne le signale.** L'alternative — journaliser dans `insert`/`update`/`archive` — ne
l'aurait pas, mais elle aurait composé `summary` depuis une table de libellés par table, sans savoir
ce que le geste voulait dire. On préfère une phrase juste qu'on peut oublier à une phrase creuse
qu'on ne peut pas.

**(b) Les six `event_target_type`, sans migration.** `project`, `activity`, `resource`, `result`,
`indicator_reading`, `member`. Le journal reste ce que `docs/04` §4 en fait : la trace des objets de
l'accompagnement, celle qui nourrit la frise de la page projet. **Persona, use case, indicateur,
personne, entité et vision produit ne sont pas journalisés** — leurs écritures existent, elles ne
laissent pas de trace, et c'est un point ouvert pour C7, pas un manque de ce chantier.

**(c) Les quatre règles de lien déduit** de `docs/04` §5, ordonnées par force : même produit,
personnes en commun (≥ 2), même entité, approches communes. **La raison s'écrit en toutes lettres** —
« même produit », « Camille et Rudy en commun » — et **jamais en chiffre** : pas de force affichée,
pas de score de proximité, pas de « 3 points communs ». La force ordonne la liste ; elle ne se lit
pas. C'est la frontière de D39 appliquée à un lien : ce qui se montre est le **fait** qui rapproche,
pas l'indice qui le résume.

**(d) La vue d'ensemble est livrée entière**, ses quatre blocs de `docs/06` §3. `docs/05` §5 ne
nomme que le flux récent parce que c'est le seul bloc qui **dépend** du journal ; les trois autres ne
demandent aucune table neuve et lisent ce qui existe depuis T2.3. Laisser l'écran à moitié vide
après l'avoir ouvert coûterait plus qu'il ne protège. T6.6 porte le flux, T6.7 les trois autres.

**(e) `summary` fige le libellé de l'objet, jamais le nom de l'acteur.** L'acteur se lit par
`actor_id` et son nom est **courant** : une personne renommée l'est partout dans le journal, ce qui
est juste — c'est la même personne. Ce qui se fige est ce qui disparaîtrait autrement : le nom d'une
activité corrigée depuis, le titre d'une ressource retirée. `docs/04` §4 le dit en une phrase — *ni
valeur avant, ni valeur après* —, et la phrase figée n'est pas une valeur avant : c'est la
désignation de ce qui a été touché.

**(f) Le nommage évite une collision déjà posée.** `findProjectLinks()` existe dans
`lib/queries/projects.ts` et désigne les **liaisons du formulaire** — métiers, approches, membres.
Les lectures de C6 s'appellent `listRelatedProjects` (déduits) et `listDeclaredLinks` (déclarés) ;
le composant est `RelatedProjects`. **Aucun renommage de l'existant** (règle 3) : c'est un ticket de
liens, pas un ticket de vocabulaire.

**(g) Un lien déclaré se saisit et se retire depuis le projet d'où l'on agit.** Il est orienté —
`from_project_id` est le projet courant — et **affiché des deux côtés**, en lecture. Le droit exigé
est `canWrite` sur le projet courant, **jamais sur les deux** : une règle de droit qui traverserait
deux projets serait la première du dépôt, et D9 ne la porte pas. Conséquence assumée : un
contributeur d'un seul des deux projets peut poser un lien qui s'affiche sur l'autre.

**(h) « Projets sans activité récente » : le seuil est d'un mois**, celui que `docs/05` §7 retient
comme thermomètre de la fraîcheur — *la proportion de projets dont la dernière activité date de plus
d'un mois*. Il s'écrit **en toutes lettres** — « aucune activité depuis le 25/07 » —, sans badge,
sans couleur d'alerte, sans relance, sans tri par retard. `docs/06` §3 demande « une liste courte,
factuelle, sans alerte ni badge » : la liste dit une date, elle ne juge pas.

---

## Interdits communs aux sept tickets

**Le journal n'est pas un historique** (D22) : ni valeur avant, ni valeur après, aucun diff affiché,
aucune restauration, aucune comparaison de versions, aucun « rétablir cette version ».

**`activities` n'est jamais `events`.** À l'écran on dit **journal** et **événement** ; le mot
« activité » reste au fait d'accompagnement. Les confondre produirait la page projet incompréhensible
que `docs/04` §4 décrit — et le risque est maximal en T6.6, où un flux d'« activité récente » lit
une table qui n'est pas `activities`.

**Aucun graphique sur la vue d'ensemble** (D33) : des chiffres cliquables qui filtrent. La
répartition par statut, entité et approche **est demandée par D33** — ce n'est pas l'indice calculé
que D39 interdit, et l'arbitrage ne se rouvre pas en cours de ticket.

Aucun badge d'alerte ou de retard, aucune notification, aucune relance, aucun classement de projets,
aucune jauge, aucun pourcentage, aucun score du centre.

**Aucune suppression de donnée métier** (règle 4). La seule exception est **`unlink` sur
`project_links`** — table de liaison sans `archived_at`, donc `LinkTable` à la compilation, comme
`person_skills` et `project_indicators`. La couche n'expose pas de `delete` générique et ce chantier
ne lui en ajoute pas.

Aucune migration (voir plus haut). Aucune dépendance neuve. Aucune recherche globale (D32). Aucune
valeur visuelle en dur (règle 2) : les huit manques du design system et leurs six substituts mesurés
sont consignés dans `ETAT.md`, et **aucun septième ne s'invente**.

---

## T6.1 — Le journal : la couche d'écriture, et les gestes du projet

**Objectif** — Poser `scope.record()` et le vocabulaire des phrases, puis journaliser les quatre
gestes du projet et la composition de son équipe. Rien de visible, comme T1.2.

**Périmètre** — `lib/db/scoped.ts` et `lib/db/scoped.test.ts` ; `lib/journal.ts` (neuf) et son
test ; `app/(app)/projets/actions.ts` et son test.

**Attendu** — `record(entry)` devient la **seizième** entrée rendue par `forDomain`. Elle n'est pas
une écriture de plus : **c'est `insert(events, …)` avec `actor_id` posé depuis le contexte**, ce qui
lui donne gratuitement les trois préconditions de la couche — `assertNoForcedDomain`, et
`assertPreconditions` qui confronte `project_id`, `product_id` et `actor_id` au domaine, les clés
étrangères d'`events` étant déjà dérivées par `parentChecksOf`. **Aucune précondition neuve n'est
écrite** ; si l'une manquait, ce serait le signe que `record` a pris un chemin qu'`insert` n'a pas.

`lib/journal.ts` est **pur et testé** — il compose les phrases et ne touche pas la base. Une
fonction par forme de phrase, pas une par point d'appel : c'est ce qui empêche deux gestes voisins de
dire la même chose de deux manières.

Points d'appel, dans `app/(app)/projets/actions.ts` :

| Geste | Verbe | `target_type` |
|---|---|---|
| `createProject` | `created` | `project` |
| `updateProject` | `updated` | `project` |
| `updateProject`, diff d'équipe | `linked` | `member` |
| `archiveProject` | `archived` | `project` |
| `restoreProject` | `updated` | `project` |

**Une seule ligne par geste**, y compris quand `updateProject` touche le projet et son équipe : le
journal est une trace de geste, pas de colonne — sans quoi une correction de formulaire écrirait
sept lignes et la frise deviendrait illisible. Le diff d'équipe fait exception parce qu'il porte un
**autre objet** (`member`) : une ligne pour le projet, une pour l'équipe si elle a bougé, jamais une
par personne.

Le commentaire faux de `lib/db/scoped.ts` — « Les 22 sauf `domains` », quand il y en a 25 — se
corrige ici : c'est l'occasion que `JOURNAL-TECHNIQUE.md` lui promettait depuis T5bis.1.

**Validation** — **Le critère se compte en base**, l'écran ne portant encore rien : après chaque
geste, une ligne d'`events` et une seule, avec son verbe, son `target_type`, son `target_id`, son
acteur et sa phrase. Décompte avant et après, sur les cinq gestes.

**Mise en défaut** : neutraliser le `domainId` posé par `record` fait tomber exactement les cas
d'étanchéité neufs de `scoped.test.ts`, et rien d'autre. **L'étanchéité se mesure sur une ligne
forgée, et sur une seule colonne** (leçon de T5bis.2) : un `project_id` d'un autre domaine doit lever
`DomainScopeError` — si `record` ne le fait pas, c'est qu'il court-circuite `assertPreconditions`.

**Le droit s'éprouve par l'action** : un POST forgé sur `updateProject` sous une identité sans droit
n'écrit **ni le projet ni l'événement**. Étape témoin obligatoire — une fonction serveur se frappe en
`text/plain`, jamais en urlencodé (leçon de T5bis.4), faute de quoi le 404 est indiscernable d'un
refus.

**Interdits** — Aucune lecture d'`events`, aucun écran, aucune route (T6.3). Aucun journal
automatique dans `insert`/`update`/`archive` (arbitrage (a)). Aucune colonne neuve, aucun verbe hors
des cinq de l'énuméré, aucun `target_type` hors des six. **Aucun garde-fou métier sur
`restoreProject`** : le point ouvert sur le rétablissement sous un produit archivé garde sa
destination C7 (règle 3).

---

## T6.2 — Le journal : activités, ressources, résultats, relevés

**Objectif** — Les quatre `target_type` restants, et le journal cesse d'être partiel.

**Périmètre** — `app/(app)/projets/[id]/actions.ts` et son test ;
`app/(app)/produits/[id]/actions.ts` et son test ; `lib/journal.ts` et son test.

**Attendu** — Treize points d'appel, aucun mécanisme neuf :

- **`activity`** — `createActivity`, `updateActivity`, `transitionActivity` et `cancelActivity`
  (verbe **`state_changed`**, la phrase nommant l'état atteint et, pour l'annulation, son motif
  obligatoire), `archiveActivity`.
- **`resource`** et **`result`** — les trois gestes de chacun : créer, corriger, archiver.
- **`indicator_reading`** — `createReading`, `updateReading`, `archiveReading`. **Ils vivent sur la
  page produit**, donc `project_id` est **nul** et `product_id` porté : exactement le cas que
  `docs/04` §4 prévoit par « nul pour les événements de niveau produit ». La conséquence se lit
  d'avance et elle est voulue : **un relevé n'apparaît pas dans la frise de la page projet**, il
  apparaît dans le flux global de T6.6.

**Une modification qui n'en est pas une n'écrit rien.** `updateActivity` sait déjà reconnaître une
soumission sans changement — c'est le cas que T3.4 a fermé, et le journal technique l'annonçait :
*le journal de C6 n'aura rien à enregistrer d'une modification qui n'en est pas une.* La propriété se
vérifie, elle ne se suppose pas.

**Validation** — En base, geste par geste, les treize points d'appel : une ligne, une seule, le bon
verbe, le bon `target_type`, le bon `target_id`. Pour les relevés, vérifier **en base** que
`project_id` est nul et `product_id` posé — aucun écran ne le dira.

**Mise en défaut** : retirer l'appel de `transitionActivity` fait tomber son seul cas, et rien
d'autre. Et la soumission sans changement d'`updateActivity` n'écrit **aucun** événement, mesuré par
décompte avant et après.

**Interdits** — Aucun écran, aucune lecture. Aucun événement sur les objets hors des six
`target_type` (arbitrage (b)) : ni persona, ni use case, ni indicateur, ni personne, ni entité, ni
vision produit — même si le fichier ouvert les contient. Aucun rattrapage des écritures passées.

---

## T6.3 — Le bloc « Journal » sur la page projet

**Objectif** — Le dernier bloc de `docs/06` §5, replié par défaut : *une information de contrôle,
pas de compréhension.*

**Périmètre** — `lib/queries/journal.ts` (neuf) et son test ; `components/projects/journal.tsx`
(neuf) ; `app/(app)/projets/[id]/page.tsx`.

**Attendu** — `listProjectJournal(scope, projectId)` par `joinedRead` : les événements du projet, du
plus récent au plus ancien, avec le **nom de l'acteur** joint sur `persons` — chaque table jointe
porte `scope.filter()`, sans exception. Un événement sans acteur (`actor_id` nul, le cas des lignes
semées) se lit « par l'amorçage » plutôt que de disparaître.

Le bloc est un `<details>` **fermé**, en dernier. La mécanique est celle des « Indicateurs
associés » : `display: flex` retire à `<summary>` son triangle natif, donc la marque de repli se pose
en `mark`. **« Voir le journal », dessiné sans être un lien depuis le 20/08/2026, devient le
`<summary>`** — le point ouvert se referme exactement là où il avait été posé, et l'affordance qui ne
répondait pas répond.

L'état vide est un écran à part entière (règle 5), et il est **atteignable dès le premier rendu** :
le journal démarre vide sur tous les projets existants.

`REFERENCE_BLOCKS` perd son entrée « Journal » et sa seule `pending` : la rangée des blocs annoncés
passe de deux cartes à une, « Budget », qui reste annoncée jusqu'à C7 (D28).

**Validation** — Le critère se lit dans le HTML servi : le bloc est en dernier, son `<details>` est
fermé, ses entrées sont **dans le document** — un `<details>` fermé rend son contenu, à la différence
d'un menu, et c'est ce qui permet de le mesurer sans navigateur. Un projet sans événement porte son
état vide. Le journal d'un projet archivé se lit (lecture ouverte à tout le domaine, D9).

**Mise en défaut** : retirer le `filter()` de la jointure sur `persons` fait tomber le seul cas
d'étanchéité, mesuré sur **une ligne forgée** — une personne d'un autre domaine portant un événement
du domaine courant.

**Interdits** — Aucune pagination, aucun filtre, aucun tri à choisir. **Aucun décompte
d'événements** — ni sur le `<summary>`, ni ailleurs : ce serait une mesure d'activité par projet, que
`docs/06` §10 refuse. Aucun diff, aucune valeur avant. Aucune écriture depuis ce bloc. Aucun lien
vers un objet que l'écran n'affiche plus.

---

## T6.4 — Les liens déduits, et le retour du bloc « Projets liés »

**Objectif** — Rendre au projet ses voisins, sans qu'on ait rien saisi.

**Périmètre** — `lib/queries/links.ts` (neuf) et son test ; `components/projects/related.tsx`
(neuf) ; `app/(app)/projets/[id]/page.tsx`.

**Attendu** — `listRelatedProjects(scope, projectId)` par `joinedRead`, **les quatre règles de
`docs/04` §5, ordonnées par force** :

| Règle | Force | Ce qui se lit |
|---|---|---|
| Même produit | forte | « même produit » |
| Personnes en commun (≥ 2) | moyenne | les personnes, nommées |
| Même entité | faible | l'entité, nommée |
| Approches communes | faible | les approches, nommées |

**Rien n'est stocké** — ce sont des requêtes exécutées à l'affichage, ce qui garantit qu'elles sont
toujours vraies. À quinze projets, le coût est négligeable ; le dire ici évite qu'un ticket futur
« optimise » en dénormalisant.

**Un projet n'apparaît qu'une fois, sous sa règle la plus forte.** Chaque ligne porte son projet, son
produit, son statut, sa période et sa raison en toutes lettres. Les projets archivés sont écartés,
comme dans les deux listes existantes. Le bloc **revient au rendu avec son contenu réel**, à la place
que `docs/06` §5 lui donne — après « Indicateurs », avant « Budget ». Il n'entre pas dans la rangée
des blocs annoncés, que T6.3 a déjà ramenée à la seule carte « Budget » : un bloc qui porte son
contenu n'annonce plus rien.

**Validation** — Le HTML servi porte les quatre raisons — **et la fixture se vérifie avant d'être
crue** : si aucune ligne ne déclenche « approches communes », la règle n'est pas éprouvée, et la
retirer ne ferait tomber aucun test. C'est la leçon de T5bis.3, resservie : *un filtre qu'aucune
ligne forgée ne vise n'est pas éprouvé.*

**Mise en défaut** : neutraliser chaque règle fait tomber son seul cas, et rien d'autre — quatre
neutralisations, quatre chutes isolées. L'étanchéité se mesure sur une ligne forgée d'un autre
domaine, sur **une seule** colonne à la fois.

**Interdits** — Aucun graphe, aucune carte de relations (`docs/05` §4 : *sans valeur à quinze
projets*). **Aucun score, aucune force chiffrée, aucun décompte nu** — « 2 personnes en commun » se
dit « Camille et Rudy en commun » (arbitrage (c)). Aucun classement. Aucune saisie (T6.5). Aucune
règle inventée hors des quatre, et aucune règle retirée.

---

## T6.5 — Les liens déclarés : relier, dire pourquoi, retirer

**Objectif** — Ce que le calcul ne peut pas voir, et notamment la réutilisation. `docs/02` §7 le
dit sans détour : *c'est le seul cas où l'on demande une saisie qui ne sert pas directement à celui
qui la fait ; elle doit donc rester très peu coûteuse et parfaitement optionnelle.*

**Périmètre** — `lib/navigation.ts` ; `lib/drawers/project.tsx` ; `app/(app)/projets/[id]/drawers.tsx` ;
`components/projects/link-panel.tsx` (neuf) ; `app/(app)/projets/[id]/actions.ts` et son test ;
`lib/queries/links.ts` et son test ; `components/projects/related.tsx`.

**Attendu** — **Une clé d'URL, `lien`** (`nouveau` | identifiant) : **une seule, parce qu'il n'y a
qu'un droit.** La paire « une clé pour lire, une clé pour écrire » de `persona`/`fiche` n'a rien à
séparer ici — un lien déclaré se lit dans le bloc, il n'a pas de fiche. Le décompte d'exclusivité de
la page passe de **sept à huit clés sans qu'un caractère de sa logique change** : la sixième fois, et
c'est la propriété pour laquelle T4.4 l'avait écrit en décompte plutôt qu'en comparaison.

`createProjectLink` **confronte le projet cible au domaine avant d'écrire** — il n'y a pas de
transaction interactive (`neon-http`), donc tout se vérifie avant. Trois refus, et l'ordre compte :
le projet cible hors domaine (`DomainScopeError`, rendu par la couche), l'auto-lien, le doublon. Le
`CHECK` `project_links_no_self_link` et l'`unique` `(from, to)` sont les **secondes** barrières, pas
les premières : une contrainte qui rend un 500 là où on attend un message n'a rien protégé.

`removeProjectLink` passe par **`unlink`** — `project_links` ne porte pas d'`archived_at`, donc le
typage l'y autorise et refuserait toute table archivable. La `reason` reste **nullable** : un lien
sans raison est un lien valide.

Les liens déclarés s'affichent **après** les déduits, dans le même bloc, avec leur raison, et **des
deux côtés** — la lecture est symétrique, l'écriture ne l'est pas (arbitrage (g)).

**Validation** — Le HTML servi, **sur les deux projets** : celui d'où le lien part et celui vers
lequel il pointe. Le geste de retrait n'est rendu que sur le projet où l'on a le droit d'écrire.

**Le droit s'éprouve par l'action** : un POST forgé sous une identité sans droit sur le projet
courant est refusé, avec étape témoin, en `text/plain`. Un `to_project_id` d'un autre domaine lève
`DomainScopeError`, mesuré sur une ligne forgée. Un projet archivé n'est pas proposé à la saisie et
**est refusé s'il est forgé** — l'écran n'a jamais protégé le point d'entrée.

**L'événement `linked` est écrit** — c'est le cinquième verbe de l'énuméré, et le seul que T6.1 et
T6.2 n'ont pas posé sur son objet propre. Retirer un lien écrit une ligne aussi : le verbe reste
`linked`, la phrase dit le retrait.

**Interdits** — Aucune raison obligatoire. Aucun lien vers un projet archivé, ni proposé, ni accepté.
Aucune cascade au retrait : `unlink` retire la ligne de liaison, rien d'autre. Aucun lien créé
automatiquement à partir d'une règle déduite — les deux natures ne se confondent pas. Aucune
suggestion de projet à relier fondée sur un calcul de proximité.

---

## T6.6 — Le flux d'activité récente en vue d'ensemble

**Objectif** — *Le seul endroit du produit qui donne le sentiment que Vision est vivante*
(`docs/06` §3). La vue d'ensemble perd l'état vide qu'elle porte depuis T1.6.

**Périmètre** — `lib/queries/overview.ts` (neuf) et son test ; `components/overview/feed.tsx`
(neuf) ; `app/(app)/page.tsx`.

**Attendu** — `listRecentEvents(scope, limit)` : les dernières lignes d'`events` du domaine, tous
projets confondus, ordonnées par `occurred_at` décroissant — **l'index existe depuis `0000`** —, avec
l'acteur, et **le projet d'origine cliquable**. Quand `project_id` est nul, c'est le **produit** qui
est nommé et cliquable : le cas des relevés, prévu par T6.2.

Une seule lecture, **plafonnée** — le plafond est un nombre écrit, pas une pagination.

**Validation** — Le HTML servi porte le flux, ses liens et ses dates. **Le journal démarre vide** :
sans écriture préalable, le critère se validerait sur une absence. Il faut donc des événements — par
la fixture, ou par une **sonde de la forme du bloc « Démarrage »** (20/08/2026) : agir sur une ligne
existante, lire le rendu, rétablir, sans qu'aucune ligne de sonde ne reste. Le point ouvert sur les
cinq états vides jamais rendus se joint ici s'il peut l'être sans sortir du périmètre.

**Mise en défaut** : retirer le `filter()` de la lecture fait tomber le cas d'étanchéité, mesuré sur
un événement forgé dans un autre domaine.

**Interdits** — Aucun graphique (D33). Aucune pagination, aucun filtre, aucune recherche. Aucun
décompte présenté comme une mesure d'activité du centre. Aucun événement d'un autre domaine. **Aucun
mot « activité » pour désigner une ligne du flux** — c'est ici que le piège de `docs/04` §4 coûte le
plus cher : le bloc s'appelle « Activité récente » parce que `docs/06` §3 le nomme ainsi, et ses
lignes sont des **événements**.

---

## T6.7 — La vue d'ensemble entière : répartition, fraîcheur, accès direct

**Objectif** — Les trois blocs restants de `docs/06` §3, et l'écran répond enfin à sa question :
*que se passe-t-il en ce moment dans le centre ?*

**Périmètre** — `lib/queries/overview.ts` et son test ; `components/overview/` ;
`app/(app)/page.tsx`.

**Attendu** — Trois blocs, dans l'ordre de `docs/06` §3, sous le flux de T6.6 :

- **La répartition** — combien de projets par statut, par entité, par approche. **Des chiffres
  cliquables qui mènent à `/projets` avec le filtre posé** : les clés de filtre existent depuis T2.3,
  et **rien ne s'invente** — un chiffre dont le filtre n'existe pas n'est pas rendu.
- **Les projets sans activité récente** — `last_activity_at` antérieur à un mois (arbitrage (h)),
  liste courte, la date écrite en toutes lettres. Un projet qui n'a **jamais** eu d'activité y figure
  aussi : `last_activity_at` est nul, et « aucune activité » est un fait, pas un retard.
- **L'accès direct** aux projets et aux produits.

**Validation** — Le HTML servi : chaque chiffre est un lien dont l'adresse porte le filtre, et
**suivre le lien rend exactement ce nombre de lignes**. C'est le seul critère qui prouve que le
décompte et la liste lisent la même chose — un décompte juste sur un filtre qui ne l'est pas est un
mensonge que rien d'autre ne détecte. À mesurer sur **trois** valeurs au moins, dont une à zéro et
une qui n'existe pas dans la fixture.

**Mise en défaut** : neutraliser le filtre d'archivage du décompte fait diverger le chiffre et la
liste, et fait tomber le cas.

**Interdits** — Aucun graphique, aucune jauge, aucun badge de retard, aucune alerte, aucune relance,
aucun tri par ancienneté présenté comme un classement. **Aucun indicateur de performance du centre** :
`docs/06` §3 le dit de l'écran que verra un responsable, et c'est là que la règle coûte le plus cher.
Aucun score global, aucun taux, aucun pourcentage — pas même « 3 projets sur 12 ».

---

## Vérification, à chaque ticket

Les quatre disciplines du protocole, sans rappel :

1. **Le critère se lit dans le HTML servi**, jamais il ne s'affirme — `curl` sur l'adresse,
   `<script>` retirés, le HTML de développement n'étant pas déterministe (leçon de TD.3).
2. **Les tests se mettent en défaut** avant d'être crus : neutraliser la règle, voir tomber
   exactement les tests attendus, et rien d'autre.
3. **Le contraste se mesure** sur tout couple de couleurs neuf par la position.
4. **Le droit s'éprouve par l'action**, jamais par l'écran, avec étape témoin.

En fin de chantier : `npm run lint` (`--max-warnings=0`), `npm run test` et `tsc` au vert.
