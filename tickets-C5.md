# Tickets — C5

Un ticket = une session de CLI. Chaque ticket porte un objectif, un périmètre de fichiers, un
critère de validation vérifiable et ses interdits.

**Règle commune à tous les tickets :** ne modifier aucun fichier hors du périmètre annoncé, ne
créer aucune fonctionnalité non listée, mettre à jour `ETAT.md` en fin de ticket.

---

# C5 — Indicateurs et lecture dans le temps

**Le chantier qui répond à la question de l'effet dans le temps.** `docs/05` §5 lui donne trois
lignes — « Indicateurs, relevés datés, adoption par un projet avec référence et cible, et
enrichissement de la page produit par la frise juxtaposant accompagnements et courbes » — et D26 lui
réserve explicitement la couche « temps long » de la page produit, dont C2 n'a livré que le socle.

**Le constat qui le fonde tient en une lecture du schéma.** Les trois tables existent depuis T1.2 :
`indicators` (avec `archived_at`), `indicator_readings` (sans), `project_indicators` (table de
liaison, sans). La fixture porte déjà un indicateur du brief §7, ses trois relevés et son adoption
par le second accompagnement (`scripts/seed.ts:480`). **Aucun écran ne les lit.** `lib/db/scoped.ts`
les couvre sans une ligne de plus : `hasArchivedAt` s'introspecte, `unlink` existe pour les liaisons.

C5 remplit une matrice de quatre objets et trois gestes :

| Objet | Lire | Écrire | Ranger |
|---|---|---|---|
| Indicateur | T5.1 | T5.2 | T5.2, refus (e) en T5.4 |
| Relevé | T5.1, T5.3 | T5.3 | T5.3, après migration |
| Adoption | T5.4 | T5.4 | T5.4, par `unlink` |
| Frise du temps long | T5.5, T5.6 | — | — |

**L'ordre des six tickets va de la lecture à l'écriture, puis au temps long** — le rythme de C2 et
de C3. La frise vient en dernier parce qu'elle est ce que les trois premiers rendent lisible : sans
relevé daté, elle n'a rien à tracer.

## Sept arbitrages rendus avant écriture, à ne pas rouvrir en cours de ticket

**(a) Chaque objet arrive avec ses trois gestes — créer, corriger, ranger — dans le ticket qui
l'introduit.** C4bis a coûté six tickets pour rattraper leur absence sur les cinq objets de C2 à C4 ;
C5 ne rouvre pas ce trou. Un objet livré sans son geste de correction est une dette datée du jour de
sa livraison.

**(b) Le droit d'écrire un indicateur se dérive des accompagnements du produit.** `manageDomain`, ou
contributeur désigné d'au moins un accompagnement de ce produit : c'est la lettre de D23 — « les
contributeurs du projet saisissent les indicateurs » — sur un objet qui, lui, appartient au produit
(D1, D11). **Aucune requête neuve** : la page produit lit déjà ses accompagnements
(`listProductProjects`), et `session.can.writeProject` répond sur chacun. L'action, elle, redérive le
droit sur l'identifiant **reçu** : un droit lu au rendu n'a jamais protégé un point d'entrée HTTP.
Ni troisième niveau de droit, ni exception — D9 en pose deux, le chantier n'en invente pas un.

**(c) Un seul lieu de création d'un indicateur : la page produit.** `docs/02` §5 écrit qu'un projet
« adopte un indicateur existant du produit, ou en crée un nouveau ». Le panneau d'adoption de T5.4 ne
propose que les indicateurs déjà portés par le produit, et renvoie vers sa page quand il n'y en a
aucun. Un quatrième formulaire recopierait les choix mesurés du design system que trois copies de
`PanelField` portent déjà — et c'est ainsi qu'un septième substitut s'invente. Écart à `docs/02`
consigné dans `JOURNAL-TECHNIQUE.md`, pas dans une décision rouverte.

**(d) Une bande de courbe par indicateur, jamais deux unités sur un même axe vertical.** Superposer
un pourcentage et des secondes fabriquerait une comparaison que personne n'a demandée, et un second
axe la rendrait illisible. Chaque indicateur porte sa bande, sur l'axe temporel commun de T5.5 — c'est
lui qui est partagé, jamais l'échelle des valeurs.

**(e) Un indicateur encore adopté par un accompagnement ne s'archive pas ; le refus dit combien.**
Transposition exacte de l'arbitrage (e) de C4bis : ranger un objet dont les liaisons vivent n'est pas
ranger, c'est faire disparaître une adoption d'un écran qui continue de l'afficher. Le refus est
ajouté par **T5.4**, qui crée les adoptions — T5.2 n'a rien à refuser, aucune adoption n'existant
encore par l'interface.

**(f) Le relevé se corrige et se retire ; l'adoption se retire par `unlink`.** Deux gestes de retrait,
deux mécaniques, et la raison est dans le schéma. Un relevé est une **donnée** : la règle 4 lui doit
un `archived_at`, que `indicator_readings` n'a pas — d'où la migration de T5.3, la deuxième du projet
après T4bis.6. Une adoption est une **liaison** : sa suppression de ligne est l'arbitrage de fait de
T1.2, celui des membres de projet, et `LinkTable` l'exprime à la compilation.

**(g) La cible est un repère, jamais un état.** Ni « atteinte », ni écart au dernier relevé, ni
pourcentage de progression, ni code couleur de bon ou mauvais chiffre. D39 pose la frontière : est
interdit tout indice **calculé par Vision** ; est autorisée la valeur reportée avec sa date. Une cible
saisie à la main et un relevé daté sont deux valeurs reportées — leur différence serait un indice.
`docs/03` §7 nomme le « +12 % depuis l'accompagnement » comme le point de bascule où Vision cesserait
d'être un outil de mémoire pour devenir un outil de justification.

## Interdits communs aux six tickets

Journal `events` et liens entre projets (C6). Budget, écran de gestion des référentiels, SSO (C7).
Aucun graphique sur la vue d'ensemble (D33) : la frise vit sur la page produit, et nulle part
ailleurs. Aucun indicateur transverse à plusieurs produits (D11, `docs/05` §4) — un indicateur
appartient à un produit, la table le dit déjà.

Aucune bibliothèque de graphiques, aucune dépendance neuve, **aucun JavaScript pour la frise** : elle
est rendue sur le serveur, en SVG. Le panneau de saisie reste le composant client de T3.2, pour son
seul refus.

Aucune suppression de donnée métier (règle 4) : la couche n'expose pas de `delete` et ce chantier ne
lui en ajoute pas. Aucune valeur visuelle en dur (règle 2) : les six manques du design system et leurs
substituts mesurés sont consignés dans `ETAT.md`, et **aucun septième ne s'invente**. Aucun score,
aucune jauge, aucun pourcentage d'avancement, aucun badge d'alerte (`docs/06` §10).

---

## T5.1 — Le bloc « Indicateurs » de la page produit, en lecture

**Objectif** — La page produit dit enfin ce que le produit mesure. Lecture seule, sur le rythme de
T3.1 : on lit avant d'écrire, et le bloc se juge sur ce qu'il rend avant qu'un panneau ne s'y ajoute.

**Périmètre** — `lib/queries/indicators.ts` (neuf) et ses tests ; `components/products/indicators.tsx`
(neuf) ; `app/(app)/produits/[id]/page.tsx`.

**Attendu** — `listProductIndicators` rend, pour un produit : libellé, unité, direction, source, le
**dernier relevé** — sa valeur et sa date — et le nombre de relevés. Les indicateurs archivés sont
écartés ; le tri est par libellé. Une seule lecture par écran, jointe, jamais une requête par
indicateur.

La valeur passe par `formatResultValue` (`lib/format.ts:218`), qui existe depuis T4.3 : la colonne est
un `numeric(18,4)` que le pilote rend « 71.0000 », et l'unité se colle ou se sépare selon sa forme. La
date se lit **au mois** (D13), par `formatMonth`. **Un indicateur sans relevé le dit** et n'est jamais
posé à aujourd'hui — `docs/03` §7 l'exige en toutes lettres.

Le bloc porte sa section entière, en-tête compris, comme `Resources` depuis T4.1. Son état vide est un
paragraphe et non un `EmptyState` : il occupe une demi-largeur de grille, et `EmptyState` porte un `h2`
qui ferait doublon sous celui de la section. Il se place **sous la liste des accompagnements** : la
frise de T5.5 viendra au-dessus d'elle, ce bloc reste en dessous.

**Dû, hors périmètre de fichiers** — le parcours d'archivage d'un produit, jamais joué à l'écran depuis
T4bis.2 (point ouvert d'`ETAT.md`, destination posée à ce ticket) : archiver puis rétablir depuis la
page, `/produits/{id}/modifier` en 404 sur un produit archivé, `updateProduct` reposté après archivage,
`archiveProduct` et `restoreProduct` sous le cookie d'un membre, et surtout le **refus (e) dont le
message doit dire combien**. Le protocole de re-soumission de T4bis.3 s'y transpose tel quel
(`JOURNAL-TECHNIQUE.md`). Ce parcours ne modifie aucun fichier : il se joue, et se rapporte.

**Validation** — Lu dans le HTML servi, sur la page du produit « Espace client web » : l'indicateur de
la fixture, sa dernière valeur « 71 % » et « juin 2026 », son nombre de relevés. Un indicateur ajouté à
la main **sans aucun relevé** — base de développement jetable, règle du 14/08/2026 — s'affiche avec sa
mention d'absence et **aucune date**. Un produit sans indicateur rend l'état vide. Tests mis en défaut :
neutraliser le filtre d'archivage, puis celui de domaine, fait tomber exactement les tests qui les
isolent, et rien d'autre. Le parcours d'archivage produit joué et rapporté, ses six points un par un.

**Interdits** — Aucune écriture : ni panneau, ni action, ni point d'entrée (T5.2, T5.3). Aucune courbe,
aucune frise (T5.5, T5.6). Aucune adoption affichée ici — elle appartient à la page projet (T5.4).
Aucun écart calculé entre un relevé et une cible, aucune évolution entre deux relevés, aucune flèche
de tendance (arbitrage (g), D39). **Aucun jugement tiré de `direction`** : elle oriente la lecture
d'une courbe, elle ne qualifie pas une valeur — ni couleur, ni mot, ni pictogramme de bon ou mauvais
sens.

## T5.2 — Créer, corriger et archiver un indicateur

**Objectif** — Le premier écran d'écriture de la page produit depuis T2.5, et le premier objet que C5
introduit **avec ses trois gestes** (arbitrage (a)).

**Périmètre** — `lib/forms/indicator.ts` et ses tests ; `components/products/indicator-panel.tsx` ;
`app/(app)/produits/[id]/actions.ts` (neuf) ; `app/(app)/produits/[id]/page.tsx` ;
`components/products/indicators.tsx` ; `lib/navigation.ts` ; `lib/queries/indicators.ts` et ses tests.

**Attendu** — Le panneau de T3.2 repris **sans être modifié**, et sa mécanique avec lui : une URL,
pas un état ; la page rendue derrière, portant `inert` ; les sorties en liens ; `FocusTrap` tel quel.
Une seule clé, dont la **valeur** porte le cas — `?indicateur=nouvel` crée, `?indicateur=<uuid>`
corrige, toute autre valeur n'ouvre rien.

**La page produit prend la règle d'exclusivité par décompte** de la page projet : `archiver` et
`indicateur` présentes ensemble n'ouvrent **rien**. Deux `role="dialog"` ou deux `inert` concurrents
ne se rattrapent pas après coup, et aucune préséance ne s'invente entre deux gestes de même rang. La
forme est celle de `app/(app)/projets/[id]/page.tsx:209` — un `keys`, un `conflict`, un `asked` que
tout le reste de la page lit ; elle reste juste quand T5.3 ajoute `releve`.

Quatre champs : **libellé** (obligatoire), **unité**, **direction** (obligatoire, liste fermée dérivée
du schéma — jamais réécrite à la main), **source**. Le formulaire sert la création et la correction,
comme le panneau d'activité depuis T3.4.

Une porte `openIndicator`, sur le modèle d'`openProduct` (`app/(app)/produits/actions.ts:187`) : le
droit dérivé de l'arbitrage (b), puis l'indicateur **reçu** rapproché du produit reçu, lui-même
rapproché du domaine courant. L'archivage est un geste simple, sans panneau de confirmation :
l'arbitrage (c) de C4bis la réserve au geste qui retire de la lecture tout un ensemble, et un
indicateur sans relevé se retape.

**Validation** — Lu dans le HTML servi : le panneau s'ouvre vide, un indicateur créé apparaît aussitôt
dans le bloc de T5.1, corrigé il s'y affiche avec son nouveau libellé, archivé il en disparaît. Les
deux clés présentes ensemble rendent la page nue. **Le droit s'éprouve par l'action, jamais par
l'écran** : les trois actions repostées sous le cookie d'un membre non contributeur d'aucun
accompagnement de ce produit sont refusées, base comptée avant et après ; une charge forgée désignant
un indicateur d'un autre produit est refusée ; un contributeur d'un accompagnement de ce produit, lui,
est accepté. Tests mis en défaut : neutraliser l'obligation du libellé, puis la liste fermée de
direction, fait tomber exactement les tests qui les isolent. Contraste mesuré sur tout couple neuf par
la position.

**Interdits** — Aucun relevé (T5.3), aucune adoption (T5.4), aucune courbe (T5.6). Aucun rétablissement
d'un indicateur archivé : arbitrage (b) de C4bis — le rétablissement existe pour les deux objets qui
ont une page, et un indicateur n'en a pas. Aucun écran de gestion des référentiels (D25, C7) : un
indicateur n'est pas un référentiel, il appartient à un produit. Aucune option proposée qui ne soit pas
déjà la valeur de la ligne éditée. Aucun `default_tool_id` ni pré-sélection depuis un outil — le point
ouvert du panneau d'activité reste où il est.

## T5.3 — Saisir, corriger et retirer un relevé, et sa migration

**Objectif** — La série datée sans laquelle la frise de T5.6 n'a rien à tracer. **Le seul ticket du
chantier qui touche le schéma.**

**Périmètre** — `lib/db/schema.ts` et une migration `drizzle/0002_*.sql` ; `lib/forms/reading.ts` et
ses tests ; `components/products/reading-panel.tsx` ; `app/(app)/produits/[id]/actions.ts` ;
`app/(app)/produits/[id]/page.tsx` ; `components/products/indicators.tsx` ;
`lib/queries/indicators.ts` et ses tests ; `lib/navigation.ts`.

**Attendu** — **La migration d'abord, le reste ensuite.** `indicator_readings` ne porte pas
`archived_at` (`lib/db/schema.ts:681`) : sans elle, retirer un relevé saisi en double n'aurait que la
suppression pour chemin, que la règle 4 interdit. La colonne s'ajoute, nullable, sans toucher une
ligne. **La couche d'accès ne change pas d'un caractère** : `hasArchivedAt` introspecte le schéma, si
bien que `archive`, `restore` et le filtre des vivants couvrent la table du jour où la colonne existe.
C'est la propriété que T1.3 cherchait, éprouvée pour la première fois.

Une clé `?releve=`, dont la **valeur** porte le cas comme partout ailleurs : l'identifiant d'un
**indicateur** ouvre la saisie d'un relevé sur cet indicateur, celui d'un **relevé** ouvre sa
correction. Deux lectures scopées successives tranchent — un UUID d'`indicators` n'est pas un UUID
d'`indicator_readings`, et ce qui n'est ni l'un ni l'autre n'ouvre rien. La forme est vérifiée avant la
base (`isUuid`), faute de quoi un paramètre fantaisiste rend une erreur PostgreSQL, donc un 500.

Deux champs, et pas un de plus : **valeur** (obligatoire, décimale, virgule française acceptée) et
**date de relevé** (obligatoire), plus la **note de source** facultative. `read_on` est obligatoire
dans la base comme dans le formulaire : « un relevé sans date n'est pas persisté : il serait
inaffichable sur la frise produit » (`docs/04` §3). **Aucune valeur par défaut pour la date** — ni
aujourd'hui, ni le mois courant : un relevé se rapporte, il ne se date pas au moment de la saisie.

La série se lit sous son indicateur, dans le bloc de T5.1, du plus récent au plus ancien, chaque ligne
portant sa valeur formatée, sa date et ses deux gestes. Le retrait est un geste simple, sans
confirmation (arbitrage (c) de C4bis). Le droit est celui de T5.2, par la même porte.

**Validation** — Le SQL généré relu **avant** exécution : un `ALTER TABLE … ADD COLUMN archived_at`,
nullable, sans valeur par défaut, et rien d'autre. Puis, lu dans le HTML servi : un relevé saisi
apparaît en tête de la série et devient le « dernier relevé » du bloc ; corrigé sur sa date, il change
de place dans la série ; retiré, il disparaît et le dernier relevé redevient le précédent. **La
ressaisie après retrait lue à l'écran** — le critère de T4bis.6, et la seule preuve que la migration
tient. Charges forgées refusées, base comptée avant et après : relevé d'un indicateur d'un autre
produit, indicateur inexistant, membre non contributeur. Mise en défaut : neutraliser l'obligation de
date, puis le filtre des relevés archivés, fait tomber exactement les tests qui les isolent.

**Interdits** — Aucune adoption (T5.4), aucune courbe (T5.6). Aucun `delete`. **Aucun recalcul de
`last_activity_at`** : un relevé n'est pas un fait d'accompagnement, et appeler `refresh()` ferait
croire le contraire à qui lit le fichier — la leçon de T4.2. Aucun rétablissement d'un relevé retiré :
il se retape, comme l'activité et la ressource (arbitrage (b) de C4bis). Aucune moyenne, aucun cumul,
aucune agrégation de la série : on la liste, on ne la résume pas. Aucune saisie en lot, aucun import.

## T5.4 — Adopter un indicateur depuis l'accompagnement

**Objectif** — Le deuxième bloc de référence de la page projet (`docs/06` §5) : « les indicateurs du
produit adoptés par ce projet : référence, cible, dernière valeur ». C'est la table qui relie
l'accompagnement à son effet supposé, et **elle ne calcule rien** — Vision juxtapose, elle ne prouve
pas.

**Périmètre** — `components/projects/adopted-indicators.tsx` (neuf) ; `app/(app)/projets/[id]/page.tsx` ;
`app/(app)/projets/[id]/actions.ts` ; `lib/forms/adoption.ts` et ses tests ;
`lib/queries/indicators.ts` et ses tests ; `lib/navigation.ts` ; `app/(app)/produits/[id]/actions.ts`
pour le seul refus de l'arbitrage (e).

**Attendu** — Le bloc remplace l'état vide annoncé qu'il porte depuis T4.1 dans `REFERENCE_BLOCKS`
(`app/(app)/projets/[id]/page.tsx:141`), à sa place et sans en changer : deuxième case de la grille,
après « Ressources ». Chaque ligne dit le libellé de l'indicateur, sa **référence**, sa **cible**, sa
**dernière valeur** datée, et la **valeur finale** quand elle est renseignée. Quatre chiffres reportés,
côte à côte.

Le panneau reprend la clé `?indicateur=` — la même que la page produit, sur un autre écran, sans
confusion possible : ce sont deux pages, jamais la même URL. La règle d'exclusivité de la page projet
passe de quatre clés à cinq **sans changer d'énoncé**, le décompte étant déjà écrit pour cela. Le
panneau propose les indicateurs **vivants du produit non encore adoptés** par cet accompagnement, plus
l'**exception nominative** en correction (T4bis.1, T4bis.5, T4bis.6) : l'indicateur déjà porté par
l'adoption éditée reste dans la liste, donc sélectionné, et n'apparaît nulle part ailleurs. Sans elle,
la première re-soumission détacherait l'adoption **en silence**.

Le retrait de l'adoption passe par `unlink` (arbitrage (f)) : `project_indicators` est une table de
liaison, `LinkTable` l'impose à la compilation. Sans confirmation — c'est un geste qu'on veut rapide,
et il ne retire rien de la mémoire du centre : les relevés vivent sur l'indicateur, pas sur l'adoption.

Le droit reste le **`canWrite` unique** de la page (T4bis.3) : le droit d'écrire dans ce projet et la
lecture seule d'un accompagnement archivé tombent ensemble, et **aucune condition ne s'ajoute ici**.
Les actions, elles, interrogent `openProject` sur le projet reçu, puis rapprochent l'indicateur reçu du
**produit de ce projet** — un indicateur d'un autre produit n'est pas adoptable, D11 posant qu'il
appartient à un seul.

**`archiveIndicator` prend enfin son refus** (arbitrage (e)) : un indicateur encore adopté ne s'archive
pas, et le message dit combien — la forme exacte du refus (e) d'`archiveProduct`
(`app/(app)/produits/actions.ts:245`).

**Validation** — Lu dans le HTML servi : l'adoption de la fixture affiche sa cible « 85 % » et sa
dernière valeur « 71 % » de juin 2026 ; une adoption créée apparaît aussitôt, corrigée elle affiche ses
nouvelles valeurs, retirée elle disparaît. `project_indicators` **compté en base avant et après** :
l'écran ne peut pas témoigner de ce qu'il n'affiche plus. L'unicité `(projet, indicateur)` éprouvée par
une seconde adoption du même indicateur — refusée par un message, jamais par une exception. Refus
éprouvés séparément par l'action : projet archivé, indicateur d'un autre produit, indicateur archivé,
membre non contributeur — base comptée. L'archivage d'un indicateur adopté refusé, **son message
relu**, puis accepté une fois l'adoption retirée. Mise en défaut : neutraliser l'exception nominative
fait tomber exactement le test qui l'isole ; s'il n'en tombe aucun, le test manque et s'écrit avant
qu'on croie la discipline — la leçon de T4bis.5.

**Interdits** — Aucune création d'indicateur depuis ce panneau (arbitrage (c)) : quand le produit n'en
porte aucun, le bloc renvoie vers sa page. **Aucun cinquième chiffre** : quatre valeurs reportées côte
à côte, jamais un écart, un pourcentage de progression, une barre de remplissage ou un badge « cible
atteinte » (arbitrage (g), D39, `docs/06` §10). Aucune courbe dans ce bloc — elle vit sur la page
produit (D41). Aucun relevé saisi depuis la page projet : les relevés appartiennent à l'indicateur,
donc au produit (T5.3). Aucune adoption automatique, aucune suggestion, aucune reprise de l'adoption
d'un accompagnement précédent.

## T5.5 — La frise du temps long : l'axe, les accompagnements, les repères

**Objectif** — La couche que D26 réservait à C5. Au-dessus de la liste des accompagnements, **sans la
déplacer** (`docs/06` §6) : la liste reste ce qu'elle est depuis T2.2, et devient l'équivalent textuel
de la frise.

**Périmètre** — `lib/queries/timeline.ts` (neuf) et ses tests ; `components/products/timeline.tsx`
(neuf) ; `app/(app)/produits/[id]/page.tsx` ; `lib/format.ts` et ses tests si l'échelle de mois demande
un format qui n'existe pas.

**Attendu** — Un axe temporel commun **par mois** (D13), du premier début connu au dernier terme connu,
bornes comprises. Deux couches dessus, et pas une de plus :

1. **une bande par accompagnement**, portant son libellé en toutes lettres, sa période et son statut ;
2. **un repère par activité porteuse d'un résultat** — « les activités marquantes positionnées sur
   l'axe », `docs/03` §7. Une activité sans résultat n'y figure pas ; la roadmap du projet reste le
   seul endroit où elle se lit.

SVG rendu **sur le serveur** : aucune dépendance, aucun JavaScript, aucune mesure de viewport. Les
positions se calculent en pourcentage de la fenêtre temporelle, dans une fonction pure et testée,
jamais dans le composant. Aucune valeur visuelle hors jetons (règle 2), aucun septième substitut.

**La couleur ne porte jamais seule** (`docs/06` §11) : le libellé et la période de chaque bande sont
écrits, le statut est en toutes lettres, et un repère porte son `<title>`. La frise a un `role="img"` et
un `aria-label` qui dit ce qu'elle montre ; le lecteur d'écran trouve le détail dans la liste juste en
dessous. Chaque bande mène à sa page projet — la règle de descente de `docs/06` §7.

Un produit **sans accompagnement daté** n'a pas de frise et le dit : un état vide est un écran à part
entière (règle 5), jamais un axe vide.

**Validation** — Lu dans le HTML servi : bandes et repères comptés un par un sur « Espace client web » ;
un accompagnement **sans date de fin** rendu sans bande qui déborde l'axe ; un produit à un seul
accompagnement ; un produit sans aucun, en état vide. Navigation clavier complète : chaque bande prend
le focus, le focus est visible, et l'ordre suit la lecture. Contraste mesuré sur **chaque couple neuf
par la position** — 3:1 pour une limite de composant, 4,5:1 pour un texte. Tests mis en défaut :
neutraliser le calcul de borne fait tomber exactement les tests d'échelle, et rien d'autre.

**Interdits** — **Aucun diagramme de Gantt** : ni dépendance entre activités, ni jalon de planification,
ni chemin critique, ni pourcentage d'avancement sur une bande (`docs/06` §10, `docs/03` §6). Aucune
courbe (T5.6). Aucune bibliothèque de graphiques, aucun `canvas`, aucun JavaScript. Aucun défilement
horizontal sans borne, aucun zoom, aucun réglage de période : l'axe se déduit des données. Aucun
graphique décoratif — la frise porte une lecture ou elle ne s'affiche pas (D41, `docs/06` §10). Aucune
annotation de causalité entre une bande et un repère.

## T5.6 — Les courbes d'indicateurs sur la même frise

**Objectif** — La juxtaposition de `docs/03` §7, et le geste qui clôt C5 : les relevés lus sur le même
axe temporel que les accompagnements qui les entourent. « C'est cette juxtaposition qui répond à la
question *est-ce que ce que nous avons recommandé a fonctionné ?* Elle y répond en donnant à lire, pas
en concluant. »

**Périmètre** — `components/products/timeline.tsx` ; `lib/queries/indicators.ts` et ses tests ;
`app/(app)/produits/[id]/page.tsx`.

**Attendu** — Une **bande de courbe par indicateur** (arbitrage (d)), empilée sous les accompagnements,
sur l'axe temporel de T5.5 : c'est le temps qui est partagé, jamais l'échelle des valeurs. Un point par
relevé, un segment entre deux relevés consécutifs, et un relevé isolé qui reste un point. L'échelle
verticale d'une bande se déduit de ses propres relevés, et de la cible quand une adoption en porte une.

La **cible** s'affiche en repère horizontal, avec sa valeur écrite (arbitrage (g)) : un trait et un
chiffre, jamais un état, jamais une zone colorée « atteint / non atteint ». Un indicateur **sans
relevé** est signalé sous la frise, nommé, et **jamais positionné à aujourd'hui** — `docs/03` §7 pose
la règle et dit pourquoi.

Le libellé de l'indicateur et son unité sont posés sur sa bande : la couleur ne porte jamais seule
l'identité d'une courbe. L'équivalent textuel est la série déjà lisible dans le bloc de T5.1, sous la
liste — rien n'est ajouté pour cela.

**Validation** — Lu dans le HTML servi : les trois relevés de la fixture — 54 en septembre 2024, 63 en
mars 2025, 71 en juin 2026 — dans l'ordre des dates, sur la même fenêtre temporelle que les bandes
d'accompagnement ; la cible « 85 % » de l'adoption en repère. Un indicateur **sans relevé** signalé
sous la frise, sans point. Un indicateur à **un seul relevé** : un point, aucun segment. Contraste
mesuré des traits et des points sur le fond de la frise. Tests mis en défaut : neutraliser le calcul de
position verticale fait tomber exactement les tests d'échelle, et rien d'autre.

**Interdits** — Aucun calcul d'écart, aucune flèche de causalité, aucune annotation « +12 % depuis
l'accompagnement » : `docs/03` §7 la nomme comme le point de bascule où Vision cesserait d'être un outil
de mémoire. Aucune moyenne, aucune tendance, aucune projection, aucun lissage — le segment entre deux
relevés joint deux faits, il n'en invente pas un troisième. **Aucun second axe vertical partagé entre
deux unités** (arbitrage (d)). Aucune zone colorée de bon ou mauvais côté de la cible, aucun jugement
tiré de `direction`. Aucune interaction : ni infobulle au survol, ni sélection, ni filtre de période —
la frise se lit, elle ne se manipule pas.
