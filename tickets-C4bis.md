# Tickets — C4bis

Un ticket = une session de CLI. Chaque ticket porte un objectif, un périmètre de fichiers, un
critère de validation vérifiable et ses interdits.

**Règle commune à tous les tickets :** ne modifier aucun fichier hors du périmètre annoncé, ne
créer aucune fonctionnalité non listée, mettre à jour `ETAT.md` en fin de ticket.

---

# C4bis — Archivage et correction

**Le chantier que `docs/05` §5 n'a pas prévu.** Ses sept chantiers distribuent la création et
l'édition — jamais le rangement. Il s'intercale entre C4 et C5 **sans décaler les autres** : « C7 »
est écrit dans D25, D28 et D37, que la règle 6 interdit de rouvrir. C5, C6 et C7 gardent le sens que
`docs/05` leur donne, et les tickets de C4bis s'appellent T4bis.1, T4bis.2…

**Le constat qui le fonde tient en une commande.** `archive()` existe dans `lib/db/scoped.ts`
depuis T1.3 ; `grep -rn '\.archive('` sur `app/`, `components/`, `lib/` et `scripts/` ne rend
**aucun appelant**. Le mot `delete` ne figure pas dans l'API de la couche — règle 4, la donnée métier
ne se supprime pas —, mais le seul geste qui la remplace n'a jamais été branché. Aucun objet de
Vision ne se range par l'interface.

C4bis referme la matrice « corriger / archiver » :

| Objet | Corriger | Archiver |
|---|---|---|
| Produit | T2.5 | **manque (1)** |
| Projet | T2.6 | **manque (2)** |
| Activité | T3.4 | **manque (3)** |
| Ressource | **manque (4)** | **manque (4)** |
| Résultat | **manque (4)** | **manque (4)** |

Deux questions traversent la matrice : **un projet archivé est-il en lecture seule** — manque (5) —,
et **que fait un formulaire d'une valeur archivée depuis** — manque (6).

**L'ordre des six tickets descend la hiérarchie**, le formulaire d'abord : `Produit › Projet ›
Activité › Ressource / Résultat`. Le formulaire vient en tête parce qu'il est **ce qu'un archivage
casse** — jusqu'à T4bis.1, archiver un produit fait perdre son rattachement à l'accompagnement qui
le porte, et le ticket qui archive n'a pas à réparer ce qu'il révèle.

## Six arbitrages rendus avant écriture, à ne pas rouvrir en cours de ticket

**(a) Un accompagnement archivé est en lecture seule, strictement.** Rien dans `docs/` ne le dit :
`docs/04` §1 pose l'archivage, F1-D3 pose qu'un projet s'archive et ne se supprime jamais, D42 pose
qu'il n'est pas un statut — aucun des trois ne dit ce qu'il autorise. Depuis T1.4, un contributeur
désigné garde son droit d'écriture sur un projet archivé, ce qui vide le geste de son sens. Tranché :
**aucune écriture sur un projet archivé**, les trois panneaux disparaissent du rendu et les cinq
actions refusent le projet reçu. Seul le rétablissement reste ouvert au responsable de domaine. Ni
troisième niveau de droit, ni exception : D9 en pose deux, le chantier n'en invente pas un.

**(b) Le rétablissement existe pour le produit et le projet, et pour eux seuls.** Ce sont les deux
objets dont la page reste servie après archivage : elle porte le retour. L'activité, la ressource et
le résultat n'ont pas de page — ils **se ressaisissent** en moins d'une minute (`docs/05` §7,
signal 1) plutôt qu'ils ne se rétablissent. L'asymétrie est assumée : inventer un écran des éléments
archivés pour trois objets qui se retapent serait un septième écran (`docs/06` §2) pour un geste rare.

**(c) Archiver un produit ou un accompagnement passe par une confirmation ; les trois autres, non.**
La confirmation est un **panneau**, pas un écran — la mécanique de T3.2, un paramètre d'URL, `inert`
sur la page derrière, `focus-trap.tsx` repris sans être modifié. Elle se justifie là où le geste
retire de la lecture tout un ensemble : un produit et ses accompagnements, un accompagnement et sa
roadmap. Retirer une ressource mal collée est au contraire le geste qu'on veut rapide, et
`docs/06` §9 proscrit la confirmation intermédiaire partout où elle ne protège rien.

**(d) Le mot de l'interface est « Archiver ».** C'est celui de `docs/04` §1 et de D42 — jamais
« Ranger », jamais « Supprimer », que la règle 4 interdit de laisser entendre. Le retour se dit
**« Rétablir »** : aucun document ne le nomme, le choix est consigné au journal technique.

**(e) Un produit qui porte encore un accompagnement non archivé ne s'archive pas.** Le refus dit
combien. L'autoriser masquerait des accompagnements **vivants** des deux listes : `listProjects` et
`listProductsWithCounts` écartent déjà, par jointure, les projets d'un produit archivé
(`lib/queries/projects.ts:126`, `lib/queries/products.ts:78`). Ranger un parent dont les enfants
vivent n'est pas ranger, c'est faire disparaître.

**(f) Aucune cascade, jamais.** Archiver un produit ne touche pas ses projets ; archiver un projet ne
touche pas ses activités. Les lignes filles gardent leur `archived_at` nul et cessent de s'afficher
parce que leur parent ne s'affiche plus. Une cascade rendrait le rétablissement impossible à écrire :
on ne saurait plus distinguer ce qui a été archivé de ce qui l'a été par ricochet.

## Interdits communs aux six tickets

Indicateur, relevé, adoption et frise du temps long (C5). Journal `events` et liens entre projets
(C6) — **l'archivage est pourtant l'un des verbes d'`events`** (`docs/04` §4), et c'est C6 qui
l'écrira, pas ce chantier. Budget, écran de gestion des référentiels, SSO (C7).

Aucune suppression de donnée métier, jamais : la couche n'expose pas de `delete` et ce chantier ne
lui en ajoute pas (règle 4). Aucun archivage de domaine ni de référentiel — c'est l'écran de D25, en
C7. Aucun compte d'éléments archivés sur un écran, aucun filtre « archivés » sur une liste :
`docs/06` §4 pose quatre filtres et n'en liste pas un cinquième. Aucune valeur visuelle en dur
(règle 2) : les six manques du design system et leurs substituts mesurés sont consignés dans
`ETAT.md`, et **aucun septième ne s'invente**.

---

## T4bis.1 — Ce qu'un formulaire fait d'une valeur archivée

**Objectif** — Aucune saisie ne perd une valeur parce qu'elle a été archivée depuis. Les formulaires
de produit et de projet s'alignent sur l'**exception nominative** que `listActivityFormOptions` porte
depuis T3.4 — `keepActivityTypeId`, aujourd'hui le seul endroit du produit où elle existe
(`lib/queries/activities.ts:74`).

**Périmètre** — `lib/queries/projects.ts` et ses tests ; `lib/queries/products.ts` et ses tests ;
`app/(app)/projets/[id]/modifier/page.tsx` ; `app/(app)/produits/[id]/modifier/page.tsx`.

**Attendu** — Le motif de T3.4, généralisé : `includeArchived: true` accompagné d'un
`or(isNull(archivedAt), inArray(id, keep))`. **Décrire et proposer n'appellent pas le même filtre** —
la valeur déjà portée par la ligne éditée reste dans la liste, donc sélectionnée, et n'apparaît nulle
part ailleurs : ni dans le formulaire de création, ni dans celui d'une autre ligne. Six valeurs sont
concernées : l'**entité** du produit, et le **produit**, le **statut**, les **métiers**, les
**approches** et les **personnes** de l'accompagnement.

**Les listes à cocher pèsent plus lourd que les `select`, et c'est la raison d'être du ticket.** Un
`select` amputé se voit : la ligne éditée exige un nouveau choix. Une case absente du rendu ne revient
pas dans le `FormData`, et `syncMembers` comme les deux autres diffs concluent que la liaison a été
retirée : **la perte est silencieuse, à la première re-soumission.** Les personnes cumulent les deux
conditions — `is_active` **et** `archived_at` —, la lecture actuelle ne filtrant que la première.

Les entités du formulaire de produit descendent de la page vers `lib/queries/products.ts` : c'est là
que vivent les options de formulaire depuis T2.6, et une exception nominative n'a pas à s'écrire dans
un composant de page. Le formulaire de **création** ne reçoit aucun `keep` et ne change pas d'un
caractère.

**Validation** — Une entité, un produit, un statut, un métier, une approche et une personne archivés
**à la main dans la base de développement** — jetable, règle du 14/08/2026 ; le précédent est la
ligne posée puis retirée de T4.3. Lu dans le HTML servi : les deux formulaires d'édition les affichent
encore, sélectionnés ; les deux formulaires de création ne les proposent nulle part. Une re-soumission
à l'identique du formulaire de projet laisse `project_jobs`, `project_approaches` et `project_members`
inchangés — **compté en base avant et après**, l'écran ne pouvant pas témoigner de ce qu'il n'affiche
plus. Tests mis en défaut : neutraliser le `or` fait tomber exactement les tests neufs, et rien
d'autre.

**Interdits** — Aucun archivage depuis l'interface : c'est T4bis.2 et la suite. Aucune modification du
panneau d'activité — T3.4 est déjà juste, et le rouvrir serait réécrire ce qui sert de modèle. Aucun
écran de gestion des référentiels (D25, C7). Aucune option proposée qui ne soit pas déjà la valeur de
la ligne éditée : l'exception est **nominative**, elle n'ouvre pas la liste aux archivés.

## T4bis.2 — Archiver un produit, et le rétablir

**Objectif** — Le premier appelant d'`archive()`. Un produit qui n'est plus accompagné s'archive, sa
page reste lisible (règle 4), et le geste se défait.

**Périmètre** — `app/(app)/produits/actions.ts` ; `app/(app)/produits/[id]/page.tsx` ;
`app/(app)/produits/[id]/modifier/page.tsx` ; `lib/queries/products.ts` et ses tests ;
`components/ui/confirm-panel.tsx` (neuf) ; `lib/navigation.ts`.

**Attendu** — Droit `manageDomain` (F1-D1, D9), **vérifié dans l'action** et pas seulement à l'écran :
une action serveur est un point d'entrée HTTP à part entière, et un bouton masqué n'est pas un droit.
Le point d'entrée est sur la page produit, à côté de « Modifier » ; il ouvre un panneau de
confirmation par paramètre d'URL — arbitrage (c). Le panneau dit ce qui disparaît des listes et ce
qui reste lisible ; il ne demande aucune saisie.

Un produit portant un accompagnement non archivé est refusé, **avec son compte** — arbitrage (e). La
page d'un produit archivé porte la mention datée, perd « Modifier » et « Nouvel accompagnement », et
gagne « Rétablir » pour le responsable de domaine.

**`/produits/{id}/modifier` d'un produit archivé rend 404** : c'est le manque (1) du point ouvert,
`find` rendant les lignes archivées — délibérément, une donnée archivée restant lisible — sans que
rien n'en tire les conséquences à l'écran. `updateProduct` refuse le produit archivé **reçu**, la
route interdite ne protégeant pas l'action qu'elle affichait.

`components/ui/confirm-panel.tsx` porte la confirmation une fois pour toutes : T4bis.3 le reprend tel
quel, comme T4.3 a repris `external-link.tsx` de T4.1.

**Validation** — Lu dans le HTML servi : le produit quitte `/produits`, sa page reste servie avec sa
mention datée, ses deux actions d'écriture ont disparu, `/produits/{id}/modifier` rend 404. **Le droit
s'éprouve par l'action, trois fois séparément** : les champs d'`updateProduct` récoltés avant
l'archivage et repostés après sont refusés, base inchangée ; `archiveProduct` reposté sous le cookie
d'un membre est refusé, base inchangée ; `restoreProduct` de même. L'archivage d'un produit portant un
accompagnement vivant est refusé, et le message dit combien. « Rétablir » ramène le produit dans la
liste, et « Modifier » y revient avec lui.

**Interdits** — Aucune suppression, jamais (règle 4). Aucune cascade sur les projets — arbitrage (f).
Aucun compte de produits archivés sur un écran. Aucun archivage de projet, d'activité, de ressource ni
de résultat : chacun a son ticket, et la règle 3 vaut aussi entre deux tickets du même chantier.
Aucune ligne dans `events` (C6).

## T4bis.3 — Archiver un accompagnement, et ce qu'un accompagnement archivé autorise

**Objectif** — Les manques (2) et (5) ensemble : archiver un accompagnement, et **écrire dans le code**
que archivé veut dire lecture seule — arbitrage (a). Les deux sont indissociables : livrer l'archivage
sans la lecture seule laisserait un projet rangé recevoir des activités.

**Périmètre** — `app/(app)/projets/actions.ts` ; `app/(app)/projets/[id]/actions.ts` ;
`app/(app)/projets/[id]/page.tsx` ; `app/(app)/projets/[id]/modifier/page.tsx` ;
`lib/queries/projects.ts` et ses tests ; `lib/navigation.ts`.

**Attendu** — Le panneau de confirmation de T4bis.2, repris tel quel. Droit `manageDomain` pour
archiver et rétablir : c'est l'identité de l'accompagnement qui change de place, pas son contenu —
le partage de T2.6, où le contributeur saisit et le responsable modifie.

**Deux portes pour cinq écritures.** `openProject` couvre la création et la correction d'activité, la
ressource et le résultat ; `openActivity` couvre la transition et l'annulation. Toutes deux exigent
désormais un projet non archivé. **C'est le seul endroit où la lecture seule s'écrit** — une règle
posée à cinq exemplaires diverge un jour, et ces deux fonctions existent précisément pour qu'elle n'ait
qu'une adresse. Les trois panneaux disparaissent du rendu, et les gestes de roadmap avec eux.

La page reste servie avec sa mention datée : un accompagnement archivé est **la mémoire du centre**
(F1-D3), il se lit entier — en-tête, roadmap, ressources, résultats. `/projets/{id}/modifier` rend
404, comme la page de modification d'un produit archivé.

Aucune cascade — arbitrage (f) : les activités gardent leur `archived_at` nul et cessent de s'afficher
parce que leur projet ne s'affiche plus. `last_activity_at` n'est pas touché : c'est la date du dernier
fait d'accompagnement, et archiver le projet n'efface pas ce qui a eu lieu.

**Validation** — Lu dans le HTML servi : le projet quitte `/projets` et la page de son produit, sa page
reste servie avec sa mention, les trois panneaux et les gestes de roadmap ont disparu,
`/projets/{id}/modifier` rend 404. **Le critère central est ailleurs — le droit s'éprouve par
l'action, cinq fois séparément** : les champs de `createActivity`, `updateActivity`,
`transitionActivity`, `createResource` et `createResult` récoltés avant l'archivage et repostés après
sont **tous** refusés, base inchangée. Un panneau absent du rendu n'a jamais protégé le point d'entrée
HTTP qui l'accompagne. « Rétablir » rouvre l'écriture au contributeur désigné, éprouvé sur une
sixième soumission.

**Interdits** — Aucun statut « archivé » : D42 est formel, l'archivage n'est pas un statut et le projet
conserve le sien. Aucun troisième niveau de droit — D9 en pose deux. Aucune cascade. Aucun filtre
« archivés » sur la liste transverse. Aucun archivage de produit — T4bis.2 l'a livré, ce ticket ne le
rouvre pas.

## T4bis.4 — Archiver une activité saisie par erreur

**Objectif** — Le manque (3). L'annulation de T3.5 dit « cette activité **ne se fera pas** » et reste
au récit, dans le cinquième groupe de la roadmap. L'archivage dit « cette activité **n'aurait pas dû
être saisie** » et l'en sort. Deux gestes, deux sens ; `docs/03` §4 ne connaît que le premier, et une
activité saisie par erreur n'a aujourd'hui aucun chemin.

**Périmètre** — `app/(app)/projets/[id]/actions.ts` ; `components/projects/roadmap.tsx` ;
`lib/queries/resources.ts` et ses tests ; `app/(app)/projets/[id]/page.tsx`.

**Attendu** — Droit `writeProject` (D9), comme la saisie : ce qu'on a le droit d'écrire, on a le droit
de le retirer. Le geste part de l'entrée de roadmap, à côté de « Corriger », **sans confirmation** —
arbitrage (c) — et sans motif : l'annulation en demande un parce qu'elle raconte quelque chose, une
saisie erronée n'a rien à dire.

Une activité qui porte un résultat vivant est **refusée** : le résultat se retire d'abord (T4bis.6),
sans quoi il resterait accroché à une activité sortie du récit — et `results_activity_unique` ignorant
`archived_at`, il continuerait d'y bloquer toute ressaisie.

**`last_activity_at` n'est pas recalculé par ce ticket.** `lib/db/scoped.ts:553` le fait déjà dans le
`batch` de l'archivage d'une activité — l'un des trois gestes que la couche porte seule. Le ticket
**le vérifie**, il ne le réécrit pas : poser une seconde autorité sur un champ dérivé est exactement ce
que `docs/04` §6 interdit.

Il retranche enfin la **conséquence connue de T4.1** : `listProjectResources` joint l'activité sans
filtrer son archivage (`lib/queries/resources.ts:88`), si bien qu'une ressource continuerait d'afficher
le libellé d'une activité que la roadmap ne montre plus. Le raisonnement de T4.1 était juste tant que
rien n'archivait une activité ; ce ticket le rend faux, et le corrige dans le même geste.

**Validation** — Lu dans le HTML servi : l'activité quitte la roadmap, la page du projet reste entière,
et la ressource qui la citait n'affiche plus son libellé — la ressource, elle, reste. Quand l'activité
archivée était la plus récente à avoir eu lieu, **la fraîcheur du produit a changé dans `/produits`** :
c'est la preuve du recalcul, lue à l'écran et non affirmée. L'archivage d'une activité portant un
résultat est refusé. Le droit s'éprouve par l'action : `archiveActivity` reposté sous le cookie d'un
membre non contributeur est refusé, base inchangée ; reposté sur une activité d'un autre
accompagnement, de même.

**Interdits** — Aucun rétablissement d'activité — arbitrage (b). Aucun groupe « archivées » dans la
roadmap : une activité archivée n'est plus au récit, l'afficher en retrait serait l'annulation de T3.5
sous un autre nom. Aucune confusion avec cette dernière : les deux gestes coexistent, aucun ne remplace
l'autre, et l'écran doit les distinguer par ses libellés. Aucun archivage en lot.

## T4bis.5 — Corriger et retirer une ressource

**Objectif** — La moitié du manque (4). La ressource est, avec le résultat, **le premier objet de
Vision sans chemin de correction** — arbitrage (a) de `tickets-C4.md`, qui renvoyait explicitement
ici : « le verbe manque, donc le ticket n'existe pas ».

**Périmètre** — `lib/forms/resource.ts` et ses tests ; `components/projects/resource-panel.tsx` ;
`app/(app)/projets/[id]/actions.ts` ; `components/projects/resources.tsx` ;
`app/(app)/projets/[id]/page.tsx` ; `lib/queries/resources.ts` et ses tests ; `lib/navigation.ts`.

**Attendu** — `?ressource=<identifiant>` ouvre le panneau de T4.2 pré-rempli : **une clé, dont la
valeur porte le cas** — exactement la forme d'`?activite=` depuis T3.4, et ce que `lib/navigation.ts`
annonçait en toutes lettres (« une seule valeur d'ouverture, C4 n'écrivant aucune correction »). Un
seul formulaire pour les deux gestes, comme le panneau d'activité. La règle d'exclusivité des trois
clés ne bouge pas : le décompte de T4.4 la porte déjà pour trois.

Le rattachement à une activité **archivée depuis** reste sélectionné sans être proposé — l'exception
nominative de T4bis.1, transposée au panneau : les options se dérivent de la roadmap, dont les
archivées sont absentes.

Le retrait est un geste simple sur l'entrée du bloc — arbitrage (c). Droit `writeProject`, vérifié
**dans les deux actions** sur le projet reçu, et la ressource reçue rapprochée de ce projet : sans ce
second contrôle, une soumission forgée corrigerait la ressource d'un autre accompagnement.

**Validation** — Lu dans le HTML servi : un titre corrigé s'affiche aussitôt dans le bloc, une
ressource retirée en disparaît, et le bloc retrouve son état vide quand c'était la dernière. Les quatre
refus de T4.2 tiennent en correction, **éprouvés séparément** — titre vide, URL vide, type hors de
l'énuméré, activité relevant d'un autre projet. Une ressource d'un autre accompagnement forgée dans la
soumission est refusée. Les deux actions repostées sous le cookie d'un membre non contributeur sont
refusées, base inchangée. Une saisie refusée revient dans le panneau avec ses valeurs.

**Interdits** — Aucun téléversement, aucun stockage, aucun aperçu (règle du produit, `docs/02` §5).
Aucune requête sortante vers l'URL saisie, ni vérification, ni titre deviné. Aucune déduction du type
depuis l'URL (D21). Aucune saisie de `source_updated_at` : la colonne existe, `docs/05` ne la liste
pas. Aucun rétablissement — arbitrage (b). Aucun recalcul de `last_activity_at` : corriger une
ressource n'est pas une activité. Aucune correction depuis la vue d'ensemble ni la liste transverse —
toujours depuis son projet, D17 transposée.

## T4bis.6 — Corriger et retirer un résultat

**Objectif** — L'autre moitié du manque (4), et **le seul ticket du chantier qui touche le schéma**.

**Périmètre** — `lib/db/schema.ts` et une migration `drizzle/0001_*.sql` ; `lib/forms/result.ts` et
ses tests ; `components/projects/result-panel.tsx` ; `app/(app)/projets/[id]/actions.ts` ;
`components/projects/roadmap.tsx` ; `app/(app)/projets/[id]/page.tsx` ; `lib/queries/activities.ts` et
ses tests.

**Attendu** — **La migration d'abord, le reste ensuite.** `results_activity_unique` porte sur
`activity_id` seul et ignore `archived_at` (`lib/db/schema.ts:635`) : c'est le piège relevé par T4.3 et
confirmé par T4.4. Retirer un résultat ne libère donc pas son activité, et la ressaisie serait refusée
par PostgreSQL — non par un message, mais par une exception, donc un 500. La contrainte devient un
index unique **partiel**, `where archived_at is null` : **la première migration depuis T1.2.** La règle
de `docs/04` §4 n'en est pas changée d'un mot — un résultat **vivant** pour une activité au plus.

**Conséquence directe, à traiter dans le même geste** : le `includeArchived: true` de
`checkResultActivity` (`app/(app)/projets/[id]/actions.ts:738`) devient faux. T4.4 l'a écrit pour
épouser l'ancienne contrainte plutôt que la contourner — le commentaire qui l'accompagne le dit et
nomme ce ticket. Une fois l'index partiel posé, ce contrôle interdirait la ressaisie que la migration
vient d'autoriser. Il se relit **avec** la migration, pas après.

Pour le reste : `?resultat=<identifiant d'activité>` ouvre le panneau sur le résultat existant quand il
y en a un, et le point d'entrée de la roadmap devient « Corriger le résultat » — la même clé, le même
panneau, un formulaire pour deux gestes. `listResultToolOptions` reçoit son exception nominative :
c'est la question que son en-tête renvoie explicitement à C4bis (`lib/queries/activities.ts:153`), un
outil archivé depuis devant rester sélectionné. Le retrait est un geste simple sur l'entrée de roadmap.
Droit `writeProject`, vérifié dans les deux actions sur le projet reçu, l'activité reçue rapprochée de
ce projet, et le résultat reçu de cette activité.

**Validation** — Lu dans le HTML servi : un résultat corrigé s'affiche aussitôt sur son entrée de
roadmap avec sa nouvelle valeur ; retiré, la ligne de résultat disparaît et « Ajouter un résultat »
réapparaît sur l'entrée. **Puis le critère qui n'existait pas avant ce ticket : une seconde saisie
après retrait est acceptée** — ce que la contrainte d'origine interdisait, et la seule preuve que la
migration tient. Les cinq refus de T4.4 tiennent en correction, éprouvés séparément — libellé vide,
valeur qui n'est pas un nombre, date absente, activité non terminée forgée, résultat relevant d'une
autre activité. Tests mis en défaut : rétablir la contrainte totale fait tomber exactement les tests de
ressaisie, et rien d'autre. Les deux actions repostées sous le cookie d'un membre non contributeur sont
refusées, base inchangée.

**Interdits** — Aucun indice calculé par Vision, aucune comparaison entre deux résultats, aucune
évolution, aucun seuil ni code couleur de bon ou mauvais score (D39) : Vision reporte une valeur, elle
ne la juge pas. Aucun détail de constat — il vit dans l'outil qui l'a produit. Aucune saisie
d'`external_ref` ni de `synced_at`. Aucun appel à l'outil externe, aucun pré-remplissage depuis lui
(D15, niveau 1). Aucun rétablissement — arbitrage (b). Aucun second résultat vivant sur une même
activité : la règle survit à la migration, elle en sort seulement exacte. Aucun résultat sur une
activité non terminée — `lib/db/scoped.ts` reste la seule autorité sur cette règle, on la laisse
refuser.
