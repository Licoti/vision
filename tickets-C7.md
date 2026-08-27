# Tickets — C7

Un ticket = une session de CLI. Chaque ticket porte un objectif, un périmètre de fichiers, un
critère de validation vérifiable et ses interdits.

**Règle commune à tous les tickets :** ne modifier aucun fichier hors du périmètre annoncé, ne
créer aucune fonctionnalité non listée, mettre à jour `ETAT.md` en fin de ticket.

---

# C7 — Finitions

**Le septième et dernier chantier de `docs/05` §5, à son rang et avec son contenu** : *budget,
écran de gestion des référentiels, états vides, accessibilité, comportement sur petits écrans.*
Complété par D28 — le budget en dernier —, D25 — l'écran sommaire des référentiels — et D36 — la
note « À propos » rédigée.

**C'est le dernier chantier du POC.** Ce qui n'y entre pas n'a plus de chantier où entrer : les onze
points ouverts d'`ETAT.md` qui portaient une destination C7 sans appartenir au périmètre nommé y
entrent donc, décision prise en ouverture de la session de découpage.

**Ce qui le fonde tient en trois constats.** Le budget est la **dernière promesse non tenue de la
page projet** : `budgets` est au schéma depuis `0000`, n'a jamais reçu une ligne, et le bloc s'annonce
en carte de référence — c'est le seul bloc de `docs/06` §5 qui n'existe pas. **Huit référentiels sur
neuf n'ont pas d'écran** : l'administration livrée hors ticket le 21/08/2026 ne gère que les entités,
alors que `schema.ts` promet explicitement cet écran à `skill_levels` et `lib/navigation.ts` à
`starters`. Et **l'application n'a jamais été éprouvée hors du bureau** : seize utilitaires
responsives dans tout le dépôt, et aucun parcours clavier mesuré ailleurs que sur un panneau, quand
`docs/06` §11 rappelle que *le centre réalise des audits d'accessibilité — un produit non accessible
serait intenable*.

C7 referme une matrice de trois manques et de leurs échéances :

| Manque | Le contenu | La forme | Les finitions |
|---|---|---|---|
| La page projet | T7.1 (budget) | T7.5 (barre d'ancres) | T7.9, T7.10 |
| L'administration | T7.3, T7.4 | T7.6, T7.7 | — |
| Le produit entier | T7.2 (filtres) | T7.6, T7.7, T7.8 | — |

**L'ordre des dix tickets va du contenu qui manque vers la forme qui le sert** : le budget et les
filtres d'abord, les référentiels ensuite, la coquille et les deux balayages après, les finitions en
dernier. Les deux balayages viennent **après** les écrans neufs, faute de quoi ils passeraient sur un
produit qu'un ticket suivant changerait.

---

## Ce que C7 ne fait pas, et c'est une décision de l'humain

**Le SSO Entra ID sort du chantier.** D37 le posait en C7 — *le SSO est reporté en C7, mais pas la
notion d'utilisateur courant* —, et la décision de l'en sortir a été prise en ouverture de la session
de découpage, l'inscription d'application n'existant pas. **C'est un écart à une décision de
`docs/07`** : il se consigne dans `JOURNAL-TECHNIQUE.md` (règle 6) et le travail continue.

Conséquences à connaître avant le premier ticket :

- **le stub reste**, `lib/auth/provider.ts` n'est pas réécrit, `SESSION_COOKIE` ne disparaît pas ;
- **`/dev/session` reste** — c'est toujours le seul endroit où l'on change de personne courante, et
  T7.5 ne lui prend pas ce rôle ;
- **trois commentaires du code promettent C7** et deviennent faux : l'en-tête de
  `lib/auth/provider.ts` (« C'est le seul fichier que C7 réécrit »), celui de `SESSION_COOKIE` (« Il
  disparaîtra avec lui en C7 ») et celui d'`app/dev/session/page.tsx` (« jusqu'en C7 », « le rôle
  que le SSO tiendra en C7 »). **Ils se corrigent en T7.5**, seul ticket dont le sujet touche
  l'identité de la personne courante — un commentaire faux vaut une ligne de code fausse, et cinq
  chiffres faux d'une même famille sont déjà au journal ;
- **aucune dépendance neuve n'est requise** par le chantier, le SSO étant la seule pièce qui en
  demandait une.

---

## Dix arbitrages rendus avant écriture, à ne pas rouvrir en cours de ticket

**(a) Une seule migration est attendue de tout le chantier** — `starters.activity_type_id`, en T7.10.
C'est l'inverse de C6, qui n'en attendait aucune, et la règle est la même : **une migration
supplémentaire est un signal d'arrêt**, pas une étape. Elle voudrait dire que le ticket a débordé de
son périmètre.

**(b) Aucune dépendance neuve.** Le SSO étant sorti, plus rien dans C7 n'en demande une. Le dépôt
reste à cinq dépendances de production.

**(c) Le budget se saisit et se corrige ; il ne se retire pas.** `budgets` ne porte pas d'`archived_at`
et le chantier ne lui en ajoute pas : ce serait une seconde migration, et l'unique
`budgets_project_unique` n'est **pas partiel** — « retirer puis ressaisir » y buterait, à la
différence du résultat, dont l'unicité partielle de C4bis fait un chemin réel. Un budget saisi par
erreur se **corrige**, toutes ses colonnes de valeur étant nullables. `unlink` n'est pas employé :
l'exception de C6 était argumentée sur une **table de liaison**, et `budgets` n'en est pas une.

**(d) Le budget n'est pas journalisé.** `budget` n'est pas l'un des six `event_target_type`, et
l'ajouter demanderait une migration d'énuméré pour un seul objet, quand persona, use case,
indicateur, personne, entité et vision produit n'en ont pas — c'est l'arbitrage (b) de
`tickets-C6.md`, tenu. Le point ouvert que ce dernier annonçait — *six objets écrivent sans laisser
de trace* — se récrit avec un **septième** nom ; il ne se referme pas à moitié.

**(e) Le droit du budget est `writeProject`**, jamais `manageDomain`. Le budget est une propriété de
l'**accompagnement** — c'est ce qui le sépare de la vision produit, qui est une propriété du produit
et a pris `manageDomain` pour cette raison le 18/08/2026. C'est le droit des ressources, des
résultats et des adoptions (D9, D23), et inventer un troisième niveau pour lui serait ce que D9
refuse.

**(f) L'administration reste un seul écran.** `docs/06` §2 pose *six écrans, dont deux formulaires et
un panneau — c'est le plancher* : neuf référentiels ne font pas neuf routes. Une clé **`referentiel`**
choisit la table ; **absente, elle vaut « entités »**, si bien qu'aucun lien déjà servi ne casse.
`ENTITY_FORM_PARAM` (`entite`) **cède la place à `ligne`**, générique, de valeur
`nouvelle` | identifiant : neuf clés de formulaire auraient fait neuf fois la même chose, et une clé
par table est exactement ce que la page produit a évité en réemployant `indicateur` sur deux écrans.
C'est un renommage d'URL, donc **dans** le périmètre du ticket qui rend l'écran multi-référentiel —
pas un « pendant que j'y suis » (règle 3). `referentiel` est un **sélecteur, pas une clé
d'ouverture** : il reste hors du décompte d'exclusivité, comme `de` et `a` sur la page produit.

**(g) La suppression reste bornée aux entités.** `DeletableTable = typeof entities` est *une union
nominative, jamais un prédicat structurel* : les huit référentiels de C7 s'**archivent** et se
rétablissent, ils ne s'effacent pas. L'argument qui a porté l'exception du 21/08 — une entité fautive
bloque toute création de produit, et rien ne la référence — ne se généralise pas : un métier ou une
approche fautifs s'archivent sans rien bloquer. Point rouvrable par l'humain, jamais par un ticket.

**(h) `position` se saisit comme un nombre**, jamais par glisser-déposer. Ce serait un mécanisme
d'interaction neuf, du JavaScript, et un état à tenir — pour un écran que D25 veut **sommaire**. Un
champ numérique dit la même chose et se lit sans souris.

**(i) `tools.sync_mode` et `tools.api_config` ne se saisissent pas.** D15 pose `manual` au POC et
`api_config` vide, réservé au branchement futur. Un champ qui n'a pas de lecteur est celui qu'on
relit un jour sans savoir pourquoi — la leçon de T5.2, resservie.

**(j) Un changement de référentiel ne rétroagit jamais.** Basculer `produces_result` ne retire aucun
résultat déjà saisi ; changer une `nature` ne recalcule aucune roadmap ; renommer un libellé ne
touche aucune ligne qui le référence. Ce qui se **refuse**, en revanche, est l'archivage d'une ligne
encore référencée par une donnée vivante — la forme de `liveProductCount` sur les entités,
**recomptée par l'action** et pas seulement annoncée par l'écran, un menu retiré n'ayant jamais
protégé le point d'entrée qu'il affichait.

---

## Interdits communs aux dix tickets

**Aucun indice calculé** (D39), et le risque est maximal sur l'écran d'administration : aucun tri par
usage, aucun classement de référentiels, aucun « le plus employé ». Le décompte ne dit que ce qui
**s'oppose à un geste** — c'est la règle que la page Administration porte déjà en toutes lettres.

**Aucune valeur visuelle en dur** (règle 2). Les **huit manques du design system** et leurs six
substituts mesurés sont consignés dans `ETAT.md`, et **aucun neuvième ne s'invente** — y compris en
T7.7, où la tentation sera la plus forte, le point ouvert sur les cartes qui ne se détachent d'aucun
fond ne pouvant pas se refermer sans un jeton que le design system ne porte pas.

**Aucune suppression de donnée métier** (règle 4), voir l'arbitrage (g). **Aucune migration** hors de
celle de (a). **Aucune dépendance neuve** (b). **Aucune recherche globale** (D32). **Aucun graphique
sur la vue d'ensemble** (D33). **Aucun badge d'alerte ou de retard, aucune notification, aucune
relance, aucun classement de projets ou de personnes, aucune jauge, aucun pourcentage.**

**`activities` n'est jamais `events`.** La règle de C6 ne s'éteint pas avec lui : à l'écran on dit
**journal** et **événement**, et le mot « activité » reste au fait d'accompagnement.

**Les maquettes de `docs/design/maquettes/` sont une référence visuelle**, jamais branchées, jamais
modifiées — la règle vaut d'autant plus pour T7.5, T7.6 et T7.7, qui sont les tickets de la forme.

---

## T7.1 — Le budget : le dernier bloc de la page projet

**Objectif** — D28, tenue. `docs/06` §5 donne cinq blocs de référence à la page projet ; quatre
existent. La rangée des blocs annoncés disparaît avec celui-ci : il n'en restait qu'un.

**Périmètre** — `lib/queries/budgets.ts` (neuf) et son test ; `components/projects/budget.tsx` et
`components/projects/budget-panel.tsx` (neufs) ; `lib/navigation.ts` ; `lib/drawers/project.tsx` ;
`app/(app)/projets/[id]/drawers.tsx` ; `app/(app)/projets/[id]/actions.ts` et son test ;
`app/(app)/projets/[id]/page.tsx`.

**Attendu** — `findProjectBudget(scope, projectId)` par `joinedRead` : la ligne unique du projet, le
nom de l'outil joint sur `tools`, **chaque table jointe portant `scope.filter()`, sans exception**.
Le bloc se rend à la place que `docs/06` §5 lui donne — après « Projets liés », avant « Journal » —
et porte l'alloué, le consommé, l'unité, la date de relevé, et le **lien profond marqué comme
sortant** (`docs/06` §8 : *un lien qui quitte Vision doit être reconnaissable avant le clic*).

**Une neuvième clé d'URL, `budget`**, de valeur `saisie` : **une seule valeur d'ouverture**, l'objet
visé étant celui de la page — c'est la forme d'`archiver`, et non celle de `ressource`, parce qu'il
n'y a rien à désigner. Un projet porte au plus un budget, `budgets_project_unique` l'impose, et
`saveProjectBudget` **crée ou corrige la même ligne** : un seul geste, un seul formulaire, une seule
adresse. **Le décompte d'exclusivité de la page passe de huit clés à neuf sans qu'un caractère de sa
logique change** — la septième fois.

`REFERENCE_BLOCKS` et son `map` disparaissent de `page.tsx` : le tableau est vide, et une boucle sur
un tableau vide est une annonce que plus personne ne lit.

**Validation** — **Le critère se lit dans le HTML servi** : le bloc est à sa place dans l'ordre de
`docs/06` §5, son **état vide est rendu** sur un projet sans budget avec le geste qui le remplit
(règle 5), le lien sortant porte sa marque, et le geste de saisie n'est rendu qu'à qui a `canWrite`.

**Le droit s'éprouve par l'action, jamais par l'écran** : un POST forgé sur `saveProjectBudget`, en
**`text/plain`** et sous une identité sans `writeProject` sur ce projet, n'écrit rien. **Décompte en
base avant et après, avec étape témoin** — le code HTTP ne dit jamais ce qui a été écrit, et trois
« 200 muets » ont déjà été payés faute d'étape témoin.

**Mise en défaut** — Retirer le `filter()` de la jointure sur `tools` fait tomber le seul cas
d'étanchéité, mesuré sur **une ligne forgée** — un outil d'un autre domaine référencé par un budget
du domaine courant — et sur **une seule colonne** à la fois.

**Interdits** — Aucun retrait de budget (arbitrage (c)). Aucune ligne de journal (arbitrage (d)).
Aucun `archived_at`, aucune migration. **Aucun reste à consommer, aucun pourcentage de consommation,
aucune jauge, aucune barre de progression** — `docs/02` §5 dit *une synthèse macro et un lien*, et
« 60 % consommé » serait exactement l'indice calculé que D39 interdit. Aucun détail de dépense, aucun
historique de budget : le suivi est tenu dans l'outil, Vision renvoie vers la source.

---

## T7.2 — Entité et métier : les deux filtres manquants, et la répartition par entité

**Objectif** — `docs/06` §4 demande quatre filtres sur la liste transverse — entité, métier,
approche, statut — et il y en a deux depuis T2.3. Et le chiffre par entité de la vue d'ensemble
attend un filtre pour exister : la fiche T6.7 tranchait d'avance qu'*un chiffre dont le filtre
n'existe pas n'est pas rendu*.

**Périmètre** — `lib/navigation.ts` ; `lib/queries/projects.ts` et son test ;
`app/(app)/projets/page.tsx` ; `lib/queries/overview.ts` et son test ;
`components/overview/distribution.tsx`.

**Attendu** — `PROJECT_FILTER_PARAM` gagne `entity: "entite"` et `job: "metier"`, montées dans
`lib/navigation.ts` pour la raison exacte qui y a monté les deux premières en T6.7 : **elles ont deux
lecteurs**, et une clé qui vit à deux endroits n'en est plus une.

Le filtre d'entité passe par `projects → products.entity_id` — un projet n'a pas d'entité à lui, il
la tient de son produit, et c'est déjà ce que la liste **affiche** sur chaque ligne. Le filtre de
métier passe par `project_jobs` : **D44, les métiers déclarés du projet font foi** pour le filtrage
et l'affichage, et ceux de l'équipe sont informatifs. `listProjectFilterOptions` rend les deux
listes neuves, bâties comme les deux existantes — `selectDistinct` sur les seules valeurs portées par
un projet vivant d'un produit vivant, pour qu'aucune option ne mène à une liste vide.

`entite` est **déjà** le filtre de `/produits`, et ce n'est pas un conflit : ce sont deux pages,
jamais la même URL — la règle qui laisse `indicateur` vivre sur deux pages et `archiver` sur trois.
Ce qui interdirait le réemploi serait deux sens sur un **même** écran.

La répartition de la vue d'ensemble gagne son bloc par entité, en chiffres cliquables (D33), et
`ROUTES` sa fonction `projectsByEntity`, sur la forme de `projectsByStatus`.

**Validation** — **Le critère de T6.7, resservi, et c'est le seul qui prouve quoi que ce soit** :
chaque chiffre est un lien dont l'adresse porte le filtre, et **suivre le lien rend exactement ce
nombre de lignes**. Un décompte juste sur un filtre qui ne l'est pas est un mensonge que rien d'autre
ne détecte. À mesurer sur **trois** valeurs au moins, dont une à zéro. Chaque paramètre est confronté
au domaine avant d'être cru, comme les deux existants, et le libellé du filtre appliqué se lit **en
base**, jamais du paramètre.

**Mise en défaut** — Neutraliser le filtre d'archivage du décompte par entité fait diverger le
chiffre et la liste, et fait tomber le cas. Chaque filtre neuf, neutralisé, fait tomber ses seuls cas
et rien d'autre — deux neutralisations, deux chutes isolées.

**Interdits** — Aucune recherche par entité ou par métier hors de la liste (D32). **Aucun classement
d'entités** (`docs/06` §10) : les options s'ordonnent par nom ou par `position`, jamais par nombre de
projets. **Aucun filtre sur `persons.job_id`** — ce serait le métier de l'équipe, que D44 dit
informatif et explicitement divergent. Aucune répartition par métier sur la vue d'ensemble :
`docs/06` §3 en nomme trois — statut, entité, approche —, et la quatrième ne s'invente pas.

---

## T7.3 — Administration : l'écran devient multi-référentiel, et les quatre référentiels simples

**Objectif** — D25, seconde moitié. L'écran livré le 21/08/2026 gère **un** référentiel sur neuf ; il
en gère cinq à la fin de ce ticket. Métiers, approches, compétences, échelle de maîtrise.

**Périmètre** — `lib/navigation.ts` ; `lib/queries/referentials.ts` (neuf) et son test ;
`lib/forms/referential.ts` (neuf) et son test ; `lib/drawers/admin.tsx` ; `components/admin/` ;
`app/(app)/administration/page.tsx`, `actions.ts` et son test, `drawers.tsx`.

**Attendu** — La clé **`referentiel`** et la clé **`ligne`** de l'arbitrage (f), et une barre de
choix de référentiel en tête d'écran — cinq entrées, des liens, aucun état client. Une valeur de
`referentiel` inconnue **retombe sur les entités**, comme un identifiant fantaisiste n'ouvre aucun
panneau : la forme est vérifiée avant la base, partout.

Les quatre tables partagent la forme d'`entities` — libellé, `position`, archivage, rétablissement —
plus le `rank` de `skill_levels`, que son schéma laisse **sans unicité**, délibérément, *une
contrainte non demandée contraindrait l'écran de gestion dû à C7*.

**La lecture est générique, l'écriture ne l'est pas.** Une fonction de lecture paramétrée par la
table, mais **une fonction d'écriture par table** : une indirection sur l'écriture rendrait
`assertPreconditions` illisible et ferait de la couche scopée un endroit où le domaine se déduit
plutôt qu'il ne se pose. C'est le prix connu de la règle 1.

Le décompte de ce qui **s'oppose** à l'archivage se calcule par table, et il est le seul décompte
rendu : projets et personnes pour un métier, projets et activités pour une approche, `person_skills`
pour une compétence comme pour un niveau.

**Validation** — **Le critère se lit dans le HTML servi**, référentiel par référentiel : la liste,
son état vide avec le geste qui le remplit, les lignes **archivées visibles** — cet écran reste le
seul de l'application à les montrer, sans quoi l'archivage serait une disparition —, et le décompte
qui s'oppose à un geste.

**Le droit s'éprouve par l'action** : chacune des actions neuves, frappée en **`text/plain`** sous
une identité sans `manageDomain`, n'écrit rien. Décompte en base, **étape témoin obligatoire**.

**Mise en défaut** — Retirer le `notFound()` de la page ne doit faire tomber **aucun** test de droit :
s'il en tombe un, c'est que les tests éprouvaient l'écran et non l'action, et *un panneau absent du
rendu n'a jamais protégé le point d'entrée HTTP qui l'accompagne*. Neutraliser le décompte
d'opposition fait tomber son seul cas, par table — quatre neutralisations, quatre chutes isolées.

**Interdits** — Aucune suppression hors des entités (arbitrage (g)). Aucun glisser-déposer (h). Aucun
tri par usage, aucun classement (D39, `docs/06` §10). **Aucun renommage de l'existant hors de
`entite` → `ligne`**, qui est le sujet même du ticket (règle 3). Aucun des quatre référentiels
porteurs de logique — c'est T7.4, et les prendre ici ferait un ticket de deux.

---

## T7.4 — Administration : les quatre référentiels porteurs de logique

**Objectif** — Statuts de projet, types d'activité, outils, pistes de démarrage. L'écran promis par
D25 est alors complet, et les neuf référentiels du domaine ont un point d'entrée.

**Périmètre** — celui de T7.3, **sans `lib/navigation.ts`** : les deux clés existent, et une clé qui
n'a rien à changer ne s'ouvre pas.

**Attendu** — Quatre formulaires, quatre jeux de colonnes :

| Référentiel | Ce qui se saisit en plus du libellé et de la position |
|---|---|
| `project_statuses` | `nature` — `framing` · `active` · `paused` · `done` |
| `activity_types` | `family`, `produces_result`, `default_tool_id` |
| `tools` | `kind`, `base_url` |
| `starters` | `summary`, `guidance`, `kind`, `tool_id` |

**`docs/04` §1, appliqué à la lettre** : *les libellés changent, la logique non*. Le libellé se
renomme librement ; la `nature` et la `family` se choisissent dans leur énuméré et nulle part
ailleurs. **La nature `archived` ne revient pas** — D42 l'a retirée du référentiel, l'archivage étant
porté exclusivement par `archived_at`.

`tools.base_url` est la racine du lien profond, et **une seule source** : `starters` n'en porte pas,
son schéma le dit, et ce ticket ne lui en donne pas.

**Validation** — Le HTML servi pour les quatre référentiels. **Le geste qui compte se mesure en
base** : archiver un statut encore porté par un projet vivant est **refusé par l'action**, pas
seulement absent du menu — décompte avant et après, étape témoin, `text/plain`. Renommer un statut ne
change aucune roadmap et ne déplace aucun projet (arbitrage (j)), mesuré avant/après.

**Mise en défaut** — Neutraliser le refus d'archivage d'un statut référencé fait tomber son seul cas.
Retirer la contrainte d'énuméré sur `nature` **doit** faire tomber un test : si rien ne tombe, c'est
que la `nature` n'était pas éprouvée — *un filtre qu'aucune ligne forgée ne vise n'est pas éprouvé*.

**Interdits** — Aucune saisie de `sync_mode` ni d'`api_config` (arbitrage (i)). Aucune rétroaction
(j). **Aucun appel sortant vers un outil**, ni pour vérifier une `base_url`, ni pour la sonder, ni
pour en deviner le nom : Vision renvoie vers l'outil, elle ne l'interroge pas (D15). Aucune
`activity_type_id` sur `starters` — c'est T7.10, avec sa migration. Aucune suppression (g).

---

## T7.5 — La coquille : la carte de la personne courante, et la barre d'ancres

**Objectif** — Deux blocs dessinés dans les maquettes, retirés du rendu, et promis depuis. T1.6 avait
écarté la carte de la personne courante ; le 20/08/2026 avait suspendu la barre d'ancres de la page
projet, en laissant ses `id` de section et son `scroll-mt-19` posés et inertes.

**Périmètre** — `app/(app)/layout.tsx` ; `components/shell/` ; `components/projects/subnav.tsx` ;
`app/(app)/projets/[id]/page.tsx` ; `lib/auth/provider.ts` et `app/dev/session/page.tsx`
(**commentaires seuls**).

**Attendu** — La carte en pied de barre latérale : la personne courante, son rôle, son domaine, lus
**tels quels** dans le contexte de session et jamais recalculés. Aucune écriture, **aucun sélecteur
de personne** — c'est `/dev/session` qui bascule, et il reste : le SSO est hors chantier, et lui
prendre ce rôle ferait de la coquille un outil de développement.

La barre d'ancres revient au rendu : `subnav.tsx` retrouve son appelant, les `id` de section et le
`scroll-mt-19` retrouvent leur emploi. **La question de l'entrée active se repose telle quelle** —
aucune entrée n'est marquée, l'entrée courante d'une barre d'ancres étant celle que le défilement
désigne, et l'écart reste consigné. Les entrées suivent les blocs **réellement rendus** de la page :
le bloc « Budget » de T7.1 en fait désormais partie.

**Ce ticket porte la conséquence de la sortie du SSO.** Les trois commentaires qui promettent C7 —
l'en-tête de `lib/auth/provider.ts`, celui de `SESSION_COOKIE`, celui d'`app/dev/session/page.tsx` —
se corrigent ici, le stub n'ayant plus d'échéance nommée.

**Validation** — **Le critère se lit dans le HTML servi** : la carte porte le nom et le rôle rendus
par le contexte ; la barre d'ancres porte ses entrées, et **chacune vise un `id` présent dans le
document**. Un lien d'ancre qui ne vise rien est le défaut que ce ticket doit exclure, et il ne se
voit pas à l'œil — c'est le seul critère qui le détecte. La carte se rend aussi **sans session
établie**, la coquille enveloppant des écrans qui n'en ont pas.

**Mise en défaut** — Retirer un `id` de section fait tomber le cas de son ancre, et lui seul.

**Interdits** — Aucun sélecteur de personne dans la coquille. Aucune entrée d'ancre marquée active.
Aucune écriture depuis la barre latérale. **Aucune réécriture de `lib/auth/provider.ts` au-delà de
ses commentaires** — le SSO est hors chantier, et ce fichier est celui qu'il réécrira. Aucun
composant client neuf : `MainNav` reste le seul de la coquille.

---

## T7.6 — Petits écrans

**Objectif** — `docs/06` §11 : *conception pour le bureau, lisible sur tablette et mobile sans être
optimisée pour eux. **Aucune fonctionnalité réservée à un format.*** Seize utilitaires responsives
existent dans tout le dépôt, tous arrivés par hasard.

**Périmètre** — les gabarits de `components/ui/` — `page.tsx`, `list.tsx`, `section.tsx`,
`block.tsx`, `panel.tsx`, `drawer.tsx` — et les écrans qui portent des largeurs fixes :
`app/(app)/projets/page.tsx`, `app/(app)/produits/page.tsx`, `app/(app)/equipe/page.tsx`,
`app/(app)/administration/page.tsx`, `components/products/indicators.tsx`,
`components/projects/roadmap.tsx`.

**Attendu** — Les colonnes fixes des quatre listes — `w-44`, `w-40`, `w-12` et leurs voisines — cèdent
sous un point d'arrêt ; les panneaux latéraux prennent la largeur pleine ; la frise et la roadmap
défilent **dans leur propre conteneur** plutôt que de pousser la page entière.

**Aucune fonctionnalité ne disparaît à aucune largeur.** C'est la phrase du document, et c'est le
critère : un geste retiré sous un point d'arrêt est une fonctionnalité réservée à un format.

**Validation** — **Le HTML servi est le même à toute largeur**, et c'est ce qui doit se prouver :
aucun bloc conditionné par un format côté serveur, aucune classe qui retire un geste plutôt que de le
replier. La mise en page se mesure au navigateur, sur trois largeurs, et **c'est la seule discipline
de ce ticket qui ne se lit pas dans le HTML** : elle se rapporte comme telle, sans être confondue
avec une mesure.

**Interdits** — Aucun composant client neuf, **aucun observateur de largeur** : les points d'arrêt
sont des utilitaires CSS, et un `useEffect` sur la taille de la fenêtre serait un état de plus pour
une information que le navigateur porte déjà. Aucun geste retiré sur petit écran. Aucune valeur en
dur hors d'un **point d'arrêt de mise en page** — la catégorie qu'`ETAT.md` porte déjà, arbitrée deux
fois, hors de la clause 2 de `spacingScaleLock` par construction.

---

## T7.7 — Accessibilité : clavier, focus, contraste, titres

**Objectif** — `docs/06` §11 : *le centre de compétence réalise des audits d'accessibilité ; un
produit non accessible serait intenable.* Navigation clavier complète, focus visible, contrastes
conformes, hiérarchie de titres cohérente, libellés explicites.

**Périmètre** — potentiellement tout écran, mais **aucun changement de structure** : ce ticket pose
des attributs, des libellés et des jetons existants. Il ne redessine rien — la mise en page est T7.6,
et un ticket qui fait les deux ne prouve ni l'une ni l'autre.

**Attendu** — Quatre parcours, quatre relevés.

**Le clavier.** Chaque page traversée à la tabulation, chaque panneau ouvert et fermé, `Échap` et le
clic extérieur éprouvés. **Le chemin du clic de `/equipe`, jamais parcouru au navigateur, l'est
ici** : le point ouvert lui donne cette destination, et les cinq propriétés en attente sont celles de
`DrawerHost`, déjà éprouvées par TD.2 sur les deux autres pages hôtes.

**Le focus.** Visible partout, et **mesuré à 3:1 sur son fond** : la barre latérale a déjà dû déroger
au contour par défaut, mesuré à 2,87:1, et chaque fond sombre neuf posera la même question.

**La hiérarchie de titres.** Un `h1` par page, aucun niveau sauté — et le `<summary>` du journal, qui
est un titre sans en porter la balise, reste ce qu'il est.

**Les libellés.** Chaque contrôle nommé, chaque `<nav>` distinct nommé — il y en a jusqu'à trois sur
la page projet —, chaque lien sortant reconnaissable avant le clic (`docs/06` §8).

**Le contraste se mesure, il ne s'affirme jamais.** Tout couple neuf par la position est mesuré et
son chiffre rapporté. Le point ouvert *« une carte ne se détache d'aucun fond »* — trois positions à
1,04:1, 1,05:1 et 1,24:1 quand la limite est 3:1 — **se mesure ici et ne se referme pas** : le plus
franc des `surface-neutral-*` plafonne à 2,22:1, et **aucun neuvième jeton ne s'invente**. Le ticket
le remonte au design system avec ses trois mesures, et le point garde sa destination.

**Validation** — Le relevé des quatre parcours, page par page, avec ce qui a été corrigé et ce qui ne
peut pas l'être. Les corrections d'attribut **se lisent dans le HTML servi**. Le parcours clavier se
rapporte comme une mesure au navigateur, jamais comme une lecture de code.

**Interdits** — **Aucun jeton de thème inventé** — les huit manques du design system sont connus et
nommés, aucun neuvième ne s'ajoute. Aucune restructuration d'écran. Aucun composant client neuf.
Aucun `aria-*` posé sur un élément dont le rôle natif suffit : un `role="button"` sur un `<button>`
est du bruit qui finira par mentir.

---

## T7.8 — Les états vides, et la note « À propos »

**Objectif** — Règle 5 et `docs/06` §9 : *au démarrage, la totalité de Vision sera vide — c'est la
première impression du produit.* Et D36, jamais tenue : `/a-propos` porte son en-tête et un état vide
qui annonce son propre contenu depuis T1.6.

**Périmètre** — `app/(app)/a-propos/page.tsx` ; les appels d'`EmptyState` du dépôt, pour revue ;
`components/ui/empty-state.tsx` si un manque s'y trouve.

**Attendu** — Le contenu rédigé de la note : **ce qu'est Vision**, le vocabulaire de `docs/02` en
quelques lignes, **ce qu'elle ne fait pas** — l'interdit de `CLAUDE.md` énoncé à celui qui s'en sert,
pas à celui qui la code —, et l'état actuel daté. **Ton factuel, jamais promotionnel** (D36). Aucune
lecture en base : la page n'en a besoin d'aucune, et lui en donner une la rendrait faillible.

Et une revue des états vides : chacun **explique ce que le bloc contiendra et propose le geste qui le
remplit**. C'est ce second point qui manque le plus souvent, et il **tombe avec le droit** — un état
vide qui propose un geste à qui ne peut pas l'accomplir est un cul-de-sac de plus.

**Validation** — Le HTML servi d'`/a-propos`. Pour les états vides, la **liste de ceux qui ont
changé** et pourquoi ; ceux qu'aucun jeu de données n'atteint sont **nommés comme tels** plutôt que
déclarés bons — un état vide qu'on n'a pas vu rendu n'a pas été vérifié.

**Interdits** — Aucun contenu promotionnel, aucune feuille de route, aucune promesse datée dans la
note : elle décrit ce qui existe. **Aucun terme proscrit de `docs/02` §8.** Aucune lecture en base sur
`/a-propos`. Aucun geste proposé dans un état vide sans le droit qui va avec. Aucun état vide
transformé en écran d'erreur — c'est exactement ce que la règle 5 refuse.

---

## T7.9 — Les colonnes saisies qu'aucun écran ne lit

**Objectif** — Quatre colonnes se saisissent et ne se lisent nulle part ; une cinquième ne se saisit
ni ne se lit. Toutes tournent autour d'une même question : **la nature d'un objet**.

**Périmètre** — `lib/format.ts` et son test ; `lib/forms/person.ts` et son test ;
`lib/forms/adoption.ts` et son test ; `components/projects/adoption-panel.tsx` ;
`components/projects/adopted-indicators.tsx` ; `components/team/person-panel.tsx` ;
`app/(app)/projets/[id]/page.tsx` ; `app/(app)/projets/[id]/modifier/page.tsx` ;
`app/(app)/produits/page.tsx` et `app/(app)/produits/[id]/page.tsx` ;
`app/(app)/equipe/actions.ts` et son test.

**Attendu** — **`products.kind`** (D10 : `internal` porte les missions transverses, *aucune exception
au rattachement*) se lit sur la liste et sur la page produit. **`persons.kind`** se lit sur les deux
lectures d'équipe du projet, qui affichent aujourd'hui membres du centre et intervenants côté entité
à l'identique. **`PERSON_KIND_LABEL` quitte `lib/forms/person.ts` pour `lib/format.ts`** — et **le
vocabulaire se tranche à cette occasion**, point laissé ouvert par T5bis.7, qui l'avait refermé pour
la duplication et pas pour les mots. **`project_indicators.note`** gagne son champ dans le panneau
d'adoption et son rendu dans le bloc : *une phrase sur le pourquoi d'une cible*, `docs/04` §3.

**Et la correction qui va avec, parce qu'elle porte sur la même colonne.** Passer une personne du
centre en intervenant côté entité efface sa disponibilité — le `CHECK` l'exige, `parsePersonForm` le
fait — mais **lui laisse ses compétences**, qui restent affichées et deviennent illisibles en
écriture. `person_skills` suit la disponibilité. Aucune donnée n'est perdue ailleurs.

**Validation** — **Le critère se lit dans le HTML servi**, pour les quatre lectures neuves — dont
celle de la note, sur une adoption qui en porte une et sur une qui n'en porte pas. **Le geste de
bascule se mesure en base** : décompte de `person_skills` avant et après, sur une personne qui en
porte au moins deux. **Le droit s'éprouve par l'action** sur les deux écritures touchées, en
`text/plain`, avec étape témoin.

**Mise en défaut** — Retirer l'effacement de `person_skills` fait tomber son seul cas, et rien
d'autre. Retirer la lecture de `note` fait tomber le sien.

**Interdits** — **Aucun filtre par nature**, ni de produit ni de personne : ce serait T7.2 rouverte,
et `docs/06` §4 n'en demande pas. Aucune donnée perdue au-delà des liaisons que le `CHECK` rend
illisibles. **Aucun décompte de compétences par personne** — ce serait la mesure de personne que
`docs/06` §10 refuse. Aucune migration : les cinq colonnes existent toutes.

---

## T7.10 — Les gestes qui n'atteignent pas leur cible

**Objectif** — Quatre gestes qui existent et ne mènent pas où ils promettent. C'est le dernier ticket
du dernier chantier : il porte la seule migration de C7.

**Périmètre** — `lib/db/schema.ts` et une **migration** ; `scripts/seed.ts` ;
`lib/queries/starters.ts` et son test ; `components/projects/starter-detail.tsx` ;
`components/projects/result-panel.tsx` ; `lib/queries/activities.ts` et son test ;
`components/projects/roadmap.tsx` et `components/projects/roadmap-filter.tsx` ;
`app/(app)/projets/actions.ts` et son test.

**Attendu** — Quatre gestes, dans cet ordre :

**La piste de démarrage mène à l'activité qu'elle suggère.** `starters.activity_type_id` — la seule
migration du chantier (arbitrage (a)), **nullable** —, et le panneau de piste ouvre `?activite=nouvelle`
avec son type. Le schéma disait *le jour où une piste devra ouvrir le panneau d'activité sur son
type, ce sera une colonne de plus* : ce jour est celui-ci.

**L'outil par défaut d'un type d'activité présélectionne** dans le panneau de résultat. La moitié
restante d'un point ouvert depuis le 21/08 : `default_tool_id` **nomme** déjà le lien sortant, il ne
choisit encore rien.

**Le groupe « Annulé » est replié par défaut.** `docs/03` §6 demande *en retrait, replié par
défaut* : le retrait tient, le repli a disparu avec les intertitres quand la roadmap est passée en
liste à plat.

**Rétablir un accompagnement sous un produit archivé est refusé, avec sa raison.** Le point tranché
en ouverture de la session de découpage : six lectures écartent les projets d'un produit archivé, si
bien que le geste **paraît ne rien faire** — et un geste qui paraît ne rien faire est celui qu'on
refait.

**Validation** — **Le critère se lit dans le HTML servi** pour les trois premiers : l'adresse rendue
par la piste porte le type, le `<select>` du panneau de résultat porte le bon `selected`, le groupe
« Annulé » est replié au premier rendu. **Le quatrième se mesure en base** : `restoreProject` sur un
projet dont le produit est archivé n'écrit rien — décompte avant et après, frappé en **`text/plain`**
avec étape témoin, *le code HTTP ne disant jamais ce qui a été écrit*.

**Mise en défaut** — Le garde-fou neutralisé fait tomber son seul cas. La présélection retirée fait
tomber le sien. **Une piste sans type doit rester ouvrable** : c'est le cas que la migration ne doit
pas casser, `activity_type_id` étant nullable, et il se vérifie plutôt qu'il ne se suppose.

**Interdits** — **Aucune seconde migration.** Aucun retour du filtre de roadmap dans l'URL —
l'arbitrage du 21/08 est humain, le point reste reporté et ne se rouvre pas ici. Aucun rattrapage des
`starters` existants au-delà de `seed.ts`. **Aucune cascade au refus de rétablissement** : le geste
est refusé et le dit, le produit ne se rétablit pas tout seul. Aucun garde-fou symétrique inventé sur
un autre geste (règle 3).

---

## Vérification, à chaque ticket

Les quatre disciplines du protocole, sans rappel :

1. **Le critère se lit dans le HTML servi**, jamais il ne s'affirme — `curl` sur l'adresse,
   `<script>` retirés, le HTML de développement n'étant pas déterministe (leçon de TD.3).
2. **Les tests se mettent en défaut** avant d'être crus : neutraliser la règle, voir tomber
   exactement les tests attendus, et rien d'autre.
3. **Le contraste se mesure** sur tout couple de couleurs neuf par la position.
4. **Le droit s'éprouve par l'action**, jamais par l'écran, avec étape témoin, en `text/plain`.

**Deux tickets dérogent, et le disent** : T7.6 et T7.7 portent une part qui se mesure au navigateur
et non dans le HTML servi — la mise en page sous trois largeurs, et le parcours clavier. Cette part
se rapporte **comme une mesure au navigateur**, jamais confondue avec une lecture de rendu.

En fin de chantier : `npm run lint` (`--max-warnings=0`), `npm run test` et `tsc` au vert. **Et le
POC est complet** — `docs/05` §5 n'a pas de huitième chantier.
