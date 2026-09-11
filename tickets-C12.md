# Tickets — C12

Un ticket = une session de CLI. Chaque ticket porte un objectif, un périmètre de fichiers, un
critère de validation vérifiable et ses interdits.

**Règle commune à tous les tickets :** ne modifier aucun fichier hors du périmètre annoncé, ne
créer aucune fonctionnalité non listée, mettre à jour `ETAT.md` en fin de ticket.

---

# C12 — Le détail d'une entreprise, et le journal de son administration

**Le chantier qui donne un objet à ce que C9 avait laissé en liste.** T9.4 a posé l'écran au-dessus
des domaines — *« qui sont les entreprises clientes, et laquelle peut ouvrir une session ? »* — et
s'est arrêté là : une liste, six panneaux, et **trois booléens d'existence** pour tout ce qu'elle
sait dire d'une entreprise (`AdminDomainRow`). T11.4 lui a ajouté un troisième fait. Personne ne
peut demander à Vision *où en est cette entreprise, et qu'a-t-on fait sur elle*.

**Et rien de ce qui s'y fait ne laisse de trace.** Les **neuf gestes** de `app/domaines/actions.ts`
— créer, suspendre, rétablir l'accès, archiver, rétablir, ajouter et retirer une identité vérifiée,
désigner le premier responsable, révoquer son invitation — écrivent sans que rien ne le dise.
**Ce n'est pas un oubli d'appel, c'est le schéma**, sur trois points que `ETAT.md` nomme depuis
T9.4 : `events.actor_id` référence `persons`, et un super administrateur n'a **aucune ligne
`persons`** (arbitrage (4) de C9) · `record()` vit dans la fermeture de `forDomain(scope)` et pose
`actorId` depuis le contexte · `event_target_type` porte seize valeurs et **aucune ne dit
« domaine »**.

**C12 pose la table qui manque, les dix traces, la fiche qui les lit, et le déménagement des gestes
sur cette fiche. Rien d'autre.**

**Ce chantier n'est pas écrit par `docs/05` §5**, qui s'arrête à sept chantiers et donne à C7 le
dernier rang. **C'est le second chantier tiré des seuls points ouverts**, après C8 — et comme C8,
il se découpe par `grep '→ \*\*C12' ETAT.md` plutôt que par un document de fondation. Ce que
`docs/05` §5 dit du contenu, les points ouverts le disent ici.

**Il passe devant les deux derniers tickets de C7**, décision humaine du 11/09/2026 — **quatrième
écart à `docs/05` §6**, *« un chantier à la fois, fermé avant d'ouvrir le suivant »*, après ceux des
découpages de C8, de C9 et de C11. Consigné au journal technique, et le travail continue (règle 6).

**Deux conséquences en découlent, et elles sont portées par les fiches.** **T7.6 — les petits écrans
— est dépensé** depuis le 30/08/2026 et **T7.7 — l'accessibilité — depuis le 10/09/2026** : les
deux balayages sont passés, et aucun ne repassera. **La fiche neuve se fait donc responsive et
accessible à la main**, comme la page publique d'invitation en T11.2, plutôt qu'en comptant sur un
ticket qui ne reviendra pas. **T7.10, en revanche, viendra après** : c'est le second des deux
balayages de clôture, et il verra la fiche.

**C10 reste aux macro-parcours**, non découpé.

---

## Quatre arbitrages rendus le 11/09/2026, à ne pas rouvrir en cours de ticket

Ils répondent aux quatre points ouverts qui portaient la destination de ce chantier — les trois du
groupe « À trancher », et celui qui attendait « la prochaine session de découpage ».

**(1) Les six panneaux déménagent sur la fiche.** La liste garde *« Ajouter une entreprise »* — le
seul geste qui ne vise aucune ligne —, ses trois faits d'accessibilité et le lien vers chaque
fiche ; **l'`ActionMenu` de la ligne disparaît**. La raison n'est pas un rangement : un geste qui
vise une entreprise se fait là où cette entreprise est nommée, et un écran qui agit sans pouvoir
montrer sur quoi il agit est ce que T9.4 avait dû accepter faute de fiche.

**Effet second, et il est nommé parce qu'il referme un point ouvert** : un panneau s'ouvre par une
ancre (`DrawerLink` rend un `<a href>`) et les trois gestes muets sont des formulaires nus — donc
**les huit gestes redeviennent atteignables sans JavaScript**, là où `ActionMenu` n'est pas dans le
HTML servi. **La troisième exception à D30 se referme sur cet écran** (`ETAT.md`, T11.4 : *« arbitrage
humain, puis le ticket qui rouvre `lib/drawers/domains.tsx` »*). Elle ne se referme **que** sur cet
écran : les deux autres exceptions — la carte de roadmap, le lien d'invitation — ne sont pas
touchées.

**(2) Une table hors produit, `domain_events`** — sur le modèle de `domain_identities` et de
`super_admins`, ce que le point ouvert décrivait. **Portant `id` et `domain_id`, elle est un
`ScopedTable`** : `forDomain().insert`, `assertNoForcedDomain` et `parentChecksOf` la couvrent
**sans une ligne de couche neuve**, et `asSuperAdmin(grant)` la lit comme il lit les identités
vérifiées. **`events` n'est pas touchée** : ni valeur d'énuméré neuve, ni colonne neuve, et **le flux
de la vue d'ensemble ne change pas d'une ligne** — ce qui est écrit *au-dessus* d'un domaine ne
descend pas dedans.

**Une migration, `0019`, et pas une seconde** : une migration hors d'elle est un signal d'arrêt, pas
une étape. **C'est un écart à `docs/04` §4**, qui décrit `events` comme le journal et n'en connaît
pas d'autre. `docs/` est figé (règle 6) : l'écart se consigne dans `JOURNAL-TECHNIQUE.md`, il ne se
corrige pas dans le document.

**Pourquoi pas `events`.** L'y faire entrer demandait **trois gestes**, pas un : un
`event_target_type` de plus — migration d'énuméré **sur une table du produit, pour un objet qui n'en
est pas** —, un acteur qu'aucune colonne ne sait nommer, et l'acceptation que ces lignes paraissent
dans le flux du domaine, ce qui préemptait l'arbitrage (3).

**(3) Le journal se lit d'en haut seul.** La fiche du super administrateur le lit ; **aucun écran du
produit ne le lit**. Trois raisons, et la première est la plus forte : la suspension et l'archivage
**ferment la session** de tout le domaine — un journal lu de l'intérieur ne montrerait jamais les
deux gestes qui comptent le plus. Ensuite, le nom d'un super administrateur, dont l'adresse est
**hors entreprise cliente** par construction (règle d'entrée 2), n'a pas à paraître dans un domaine.
Enfin, un bloc, un droit et un état vide se paient, et *« un responsable voit-il qu'on a touché à
son entreprise ? »* est une question que l'usage tranchera mieux qu'un ticket.

**Rien n'est forclos** : la table porte `domain_id`, donc cette lecture reste possible **sans
migration**. Le point se récrit dans `ETAT.md` avec sa destination, il ne se referme pas.

**(4) Le sixième nom seul.** `updateOwnDomain` (T11.5) — la correction des informations du domaine
par son responsable — **écrit dans `domain_events`** : c'est une écriture *dans* le domaine sur la
ligne qui le nomme, un seul point d'appel, et c'est **le même obstacle** que ce chantier lève. **Le
point « Le journal reste incomplet » perd donc son sixième nom.** Les cinq autres familles — le
produit, l'adoption d'indicateur, la compétence portée, les huit référentiels autres que l'entité
(trente-deux gestes), les trois gestes de l'invitation — **restent dehors avec leur destination** :
elles demandent un élargissement d'`event_target_type` **dans** le produit et une quarantaine de
points d'appel. Deux sujets sous un seul nom auraient fait un chantier qu'on ne sait pas terminer.

---

## Deux arbitrages de conséquence, rendus avec leur raison

Ils touchent la forme de la table. Ils se contredisent **au découpage**, jamais en cours de ticket.

**(a) Ni `verb`, ni `target_type`, ni `target_id` — et c'est un écart à la lettre du point ouvert**,
qui écrivait *« l'acteur, le domaine, le verbe, la phrase figée et l'horodatage »*. La raison est
mesurable : **`events.verb` et `events.target_type` n'ont aucun lecteur**. `ProjectEvent` les écarte
en toutes lettres (`lib/queries/journal.ts`) — *« Ni `verb` ni `target_type` ni `target_id`, et c'est
un choix : la phrase les dit déjà »* —, et le flux de la vue d'ensemble ne les lit pas davantage.
**T7.9 est précisément le ticket des colonnes saisies qu'aucun écran ne lit** : en poser deux neuves
la veille de son passage serait ajouter à sa charge ce qu'on vient de décider. Quatre colonnes
utiles, **toutes lues par T12.3**.

**(b) Un seul acteur, `super_admin_id`, et sa nullité dit *« depuis le domaine »*.** Écrire aussi un
`actor_id → persons` obligerait, pour le nommer, à **lire une ligne `persons` d'en haut** — ce que
`app/domaines/page.tsx:44` refuse en toutes lettres : *« il n'accède à aucune donnée d'un domaine :
ni produit, ni accompagnement, ni personne — seulement l'existence d'un compte. Il administre des
entreprises, il ne les traverse pas »* — ou à laisser une colonne sans lecteur, ce que (a) vient de
refuser. La fiche dit donc *« depuis le domaine »* sans nommer personne, et c'est exactement ce
qu'un écran d'en haut a le droit de savoir. **Le jour où le journal se lira depuis le domaine, la
colonne s'ajoutera avec son lecteur.**

---

## Interdits communs aux tickets du chantier

**Ils valent pour les quatre.**

**Aucune donnée métier d'un domaine**, sur aucun des deux écrans : ni produit, ni accompagnement, ni
personne, ni indicateur — **seulement l'existence d'un compte**. C'est la frontière que
`app/domaines/page.tsx:44` écrit et que `AdminDomainRow` porte : *« deux booléens, et pas deux
décomptes »*.

**Aucun décompte, aucun classement, aucune jauge, aucun badge, aucune fraîcheur** (D39, `docs/06`
§10). Ni « douze gestes », ni « dernière intervention il y a trois mois », ni tri par activité :
**ranger des entreprises par activité serait exactement le classement que `docs/06` §10 proscrit**.

**Aucune migration hors de `0019`** (arbitrage 2). **Aucune écriture dans `events`**, aucun
`event_target_type` neuf, aucun sixième `event_verb`, **aucune colonne neuve sur `events`**.

**Aucune suppression, aucun archivage de trace** : le journal est en écriture seule (D22). Une ligne
de `domain_events` ne s'efface pas, ne se corrige pas et ne s'archive pas — la table n'entre ni dans
`DeletableTable` ni dans les tables archivables, et **le typage le refuse**.

**Aucun pouvoir neuf au super administrateur.** L'arbitrage (10) de C11 tient : il ne renomme pas
une entreprise, il ne touche ni `status` ni `archived_at` par un chemin neuf, et **la fiche ne
propose rien qu'il ne pouvait déjà faire**. C12 journalise et affiche ce qui existe.

**Aucune lecture du journal depuis l'intérieur du domaine** (arbitrage 3) : ni bloc sur
`/administration`, ni ligne dans le flux de l'accueil, ni `lib/queries/` neuf côté produit.

**Aucune dépendance neuve** — le dépôt reste à six paquets de production.

**Aucune valeur visuelle en dur** (règle 2), **aucun neuvième jeton de design system inventé**. La
fiche est **responsive et accessible dès l'écriture**, T7.6 et T7.7 étant dépensés.

**Aucun secret, aucun jeton en clair** dans une phrase de journal — l'invitation n'y met que son
existence, jamais son lien (T11.1 : *le clair ne descend jamais en base*).

**Aucune décision de `docs/07` rouverte** — D22, D30, D39 tiennent —, ni les six arbitrages de C9,
ni les onze de C11. Un désaccord se consigne dans `JOURNAL-TECHNIQUE.md`, et le travail continue
(règle 6).

---

## T12.1 — La table, et rien qu'elle

**Objectif** — Donner sa table à la trace des gestes d'administration, avec ses garanties, **avant
qu'aucun geste ne l'écrive et qu'aucun écran ne la lise**.

**Périmètre** — `lib/db/schema.ts` · `drizzle/0019_*.sql` (`npm run db:generate`) ·
`lib/db/scoped.ts` · `lib/db/scoped.test.ts`.

**Attendu** — Deux gestes.

**1. La table `domain_events`.** `id` · `domain_id` (`restrict`, comme toute table qui pointe
`domains`) · `super_admin_id` → `super_admins`, **nullable**, `on delete set null` au patron
d'`events.actor_id` · `summary`, la phrase **figée à l'écriture** (D22) · `occurred_at`, que
`defaultNow()` pose et qu'une soumission n'a pas à forger · `created_at` et `updated_at`.

**Sans `archived_at`**, comme `domain_identities`, `person_skills` et `invitations` : la table entre
dans `LinkTable`, et **`archive` y devient un refus de typage**. **Sans `verb` ni cible** — arbitrage
(a) ci-dessus. **Sans `created_by`**, qui pointerait `persons` : c'est la raison pour laquelle
`domains` et `super_admins` n'en ont pas, et elle vaut ici.

Un index **`(domain_id, occurred_at desc)`** : c'est la forme exacte de la seule lecture, et un
index qui ne sert pas une lecture écrite est un index qu'on garde par habitude.

**2. `asSuperAdmin(grant).listDomainEvents(domainId)`**, au rang de `listDomainIdentities` :
**l'autorité relue avant la lecture** — `assertAuthority()`, donc un grant forgé ne vaut rien —, le
filtre de domaine, l'ordre décroissant. **Le nom de l'acteur est courant**, lu par jointure sur
`super_admins` et jamais recopié dans la phrase (arbitrage (e) de C6) : un super administrateur
renommé l'est partout dans le journal, ce qui est juste — c'est la même personne. **Un
`super_admin_id` nul n'écarte pas la ligne** : elle dira *« depuis le domaine »*, et une lecture qui
filtre en silence rend un journal **incomplet sans le dire**.

**Elle vit du côté fermé, et c'est le critère de T9.4** : elle ne tourne pas pendant la connexion,
et elle dit ce qu'on a fait d'une entreprise.

**Validation** — **Ce ticket ne rend aucun écran** : il déroge au premier point du protocole et le
dit, comme T9.1, T9.3 et T11.1. Son critère se mesure **en base**.

1. `domain_id` forcé à l'écriture : **refusé** — `assertNoForcedDomain`, hérité et **mesuré ici**,
   jamais supposé hérité.
2. Un `super_admin_id` qui ne désigne aucune ligne : **refusé par la clé étrangère**, et **le nom de
   la contrainte se lit dans l'assertion** — jamais un `toThrow()` nu, qui passerait pour n'importe
   quelle levée et cesserait alors de dire ce qu'il prétend (leçon de T11.1). Le nom vit dans la
   **cause**, `drizzle` enveloppant la levée du pilote.
3. `archive(domainEvents, …)` et `deleteRow(domainEvents, …)` sont des **refus de typage**, relus
   dans le test des garde-fous — l'idiome de `LinkTable` et de `DeletableTable`, resservi.
4. `listDomainEvents` rend les lignes du **seul** domaine demandé — deux domaines de fixture, le
   décompte lu sur les deux —, **du plus récent au plus ancien**, et **rend la ligne dont l'acteur
   est nul**.
5. **Sans autorité vivante, elle lève** `SuperAdminRequiredError` : un `superAdminId` qui ne désigne
   rien, et une ligne **archivée entre-temps**, ne passent pas.

**Mise en défaut** — `assertAuthority` neutralisée fait tomber **la seule** mesure 5 ; le filtre de
domaine retiré fait tomber **la seule** mesure 4. Le sceau nominatif de `superAdmin` doit tomber si
une clé s'ajoute du côté ouvert sans décision. **Les index et les contraintes ne se neutralisent pas
sans une écriture en base** (`drop index`) : le substitut est le nom, assérté, qui ne peut venir que
d'elle.

**Interdits** — **Aucun écran, aucun panneau, aucun geste, aucune écriture hors des tests.** La
table existe, rien ne l'écrit encore. **Aucune lecture ajoutée du côté ouvert de `superAdmin`** : ce
journal ne tourne pas pendant la connexion. Voir les interdits communs.

---

## T12.2 — Les dix gestes laissent leur trace

**Objectif** — Que les **neuf** gestes de `app/domaines/actions.ts` **et** la correction des
informations du domaine par son responsable écrivent une ligne, **chacun la sienne**.

**Périmètre** — `lib/journal.ts` (+ test) · `app/domaines/actions.ts` (+ `actions.test.ts`) ·
`app/(app)/administration/actions.ts` et son test (le seul appelant d'`updateOwnDomain`).

**Attendu** — Trois gestes.

**1. Une septième forme de phrase dans `lib/journal.ts`**, pure comme les six autres — **le module
ne touche pas la base et n'importe pas le schéma**, et c'est ce qui lui permet de se tester sans
base. **Un vocabulaire clos des dix gestes**, et pas une fonction par point d'appel : entreprise
créée · accès suspendu · accès rétabli · entreprise archivée · entreprise rétablie · identité
vérifiée ajoutée · identité vérifiée retirée · premier responsable désigné · invitation d'amorçage
révoquée · informations corrigées. **C'est la discipline de `DEEDS` et de `STATES`** : le seul moyen
que deux gestes voisins divergent serait de changer la table.

**Ces phrases-ci ne passent pas par `objectPhrase`**, et ce n'est pas un oubli : ses quatre
participes disent *ce qui est arrivé à un objet*, quand « Accès suspendu » et « Premier responsable
désigné » disent **un geste** — c'est la raison qui a fait naître `accessPhrase` en T9.6.

**2. Les neuf appels, au succès seul.** Ce qui n'a rien touché n'écrit rien : c'est la leçon de
`restoreEntity`, dont le `restore` porte un filtre `is not null` et rend `undefined` — *« rien n'est
journalisé qui n'a pas eu lieu »*. Donc : `archiveDomain` n'écrit pas sur une ligne déjà rangée ·
`setDomainStatus` n'écrit pas sur une ligne archivée · `removeDomainIdentity` n'écrit jamais quand
le refus *« jamais la dernière »* a joué · `revokeDomainInvitation` écrit **une ligne par geste**,
jamais une par invitation révoquée · `createDomain` écrit **après** l'amorçage des référentiels,
l'ordre de T11.4 ne changeant pas.

**L'écriture passe par `forDomain({ domainId }).insert(domainEvents, …)`** — la porte que les neuf
gestes traversent déjà pour `domain_identities`, `persons` et `invitations` — **et jamais par
`record()`**, qui pose un acteur depuis un contexte que le super administrateur n'a pas.

**3. Le dixième appel, `updateOwnDomain`**, avec **`super_admin_id` nul** : la trace dit *depuis le
domaine* et **ne nomme personne** (arbitrage (b)). **Le point « Le journal reste incomplet » perd
son sixième nom** ; son décompte se récrit dans `ETAT.md` plutôt que de recevoir un addendum.

**Validation** — Quatre mesures, et la deuxième est celle qui distingue un journal d'un compteur.

1. **Le décompte en base tranche** : chacun des dix gestes écrit **exactement une** ligne, et **la
   phrase s'y lit mot pour mot**. Le code HTTP ne dit jamais ce qui a été écrit — T6.1 puis T11.2
   ont mesuré des refus qui rendent **200** comme les succès.
2. **Un refus n'écrit rien.** Les six refus de l'écran — `GONE`, `TAKEN`, `ALREADY_STAFFED`,
   `ALREADY_INVITED`, `NO_HOST`, *« jamais la dernière identité »* — laissent le journal **vide**,
   et **l'étape témoin n'est pas optionnelle** : le même geste, sous les conditions qui le font
   réussir, écrit.
3. **Le droit s'éprouve par l'action**, en `text/plain`, jamais par l'écran : les dix points
   d'entrée frappés **sans autorité** n'écrivent aucune ligne — et `updateOwnDomain` frappé par un
   `member` de même, la mesure de T11.5 rejouée avec le journal en plus.
4. **`events` n'a pas bougé.** La désignation du premier responsable **garde sa ligne `person`** à
   l'intérieur du domaine (T11.4), et **aucune ligne `events` neuve n'apparaît** pour aucun des dix
   gestes. **Deux niveaux, deux tables, mesurés ensemble** — un geste qui écrirait dans les deux
   ferait paraître l'administration des domaines dans le flux d'un domaine.

**Mise en défaut** — Chaque appel retiré fait tomber **sa seule** mesure. L'appel déplacé **avant**
l'écriture qu'il raconte fait tomber **la mesure 2, et rien d'autre** — c'est la mesure de *« rien
n'est journalisé qui n'a pas eu lieu »*.

**Interdits** — **Aucun écran** : le journal s'écrit, rien ne le lit encore (c'est T12.3). C'est la
**seconde dérogation du chantier** au premier point du protocole, et elle se dit ici plutôt que de
se découvrir. **Aucun geste neuf, aucun refus neuf, aucun message d'interface récrit** : ce ticket
ajoute une trace, il ne touche pas une règle. Voir les interdits communs.

---

## T12.3 — La fiche d'une entreprise

**Objectif** — Rassembler ce qui vit en tiroirs — l'identité de l'entreprise, ses identités
vérifiées, son état d'accès — **et ce qu'on lui a fait**. **Une lecture, et rien qu'une lecture.**

**La question à laquelle aucun autre écran ne répond** — *« où en est cette entreprise, et qu'a-t-on
fait sur elle ? »*. `docs/06` §2 exige cette justification de tout écran au-delà des six : la liste
répond *« laquelle peut ouvrir une session ? »*, et **trois booléens ne disent pas une entreprise**.

**Périmètre** — `app/domaines/[id]/page.tsx` (créé) · `app/domaines/page.tsx` (la ligne devient un
lien) · `lib/navigation.ts` (la route) · `lib/db/scoped.ts` (+ test) · `components/admin/domain-journal.tsx`.

**Attendu** — Quatre gestes.

**1. La route `/domaines/[id]`, hors du groupe `(app)`** comme sa liste, `app/auth/` et
`app/invitation/` : **ni coquille, ni navigation, ni carte de personne courante** — un super
administrateur n'a ni domaine ni ligne `persons`, `getSession()` rend `null` pour lui, et la barre
latérale suppose un domaine. `requireSuperAdmin()` **avant toute lecture**, et **elle redirige**,
comme la liste : on atteint cet écran sans session du tout, et l'écran d'entrée est la réponse
utile. Un identifiant **d'une autre forme** ou **qui ne désigne rien** rend `notFound()` — la forme
se vérifie **avant la base**, une colonne `uuid` interrogée avec n'importe quoi rendant un 500 et
non un 404.

**2. `AdminDomainRow` gagne `description` et `created_at`** — **deux colonnes dans un `select` déjà
écrit, aucune lecture neuve** : `openDomain` de `lib/drawers/domains.tsx` filtre déjà
`listDomainsForAdmin()` par identifiant et sert de porte aux cinq panneaux ciblés. Une septième
fonction dans `asSuperAdmin` pour lire une ligne qu'une lecture rend déjà serait la duplication que
T9.4 a évitée. **Les trois faits d'accessibilité ne bougent pas** : deux `exists` et un troisième,
jamais un décompte — *ce que la couche ne rend pas ne peut pas devenir un indice*.

**3. Trois blocs de lecture, et rien de plus.** L'identité — nom, centre de compétence, description,
état, date de création. Les identités vérifiées — **la liste**, pas le panneau (c'est T12.4). L'état
d'accès — les **trois faits** que la liste porte déjà, dans les mots qu'elle emploie : *aucune
identité*, *aucun compte*, *invitation en attente*. Un `h1`, et **un fil d'Ariane vers la liste** :
*aucun écran n'est un cul-de-sac* (`docs/06` §7), et T7.8 a trouvé deux demi-tours là où il fallait
un geste.

**4. Le bloc « Journal de l'administration »**, du plus récent au plus ancien. Chaque ligne porte
**sa phrase figée**, **son acteur** — le nom courant du super administrateur, ou *« depuis le
domaine »* — et **sa date**, par `formatEventDay` réemployée. **Ouvert, non replié** : le journal
d'un accompagnement est *« une information de contrôle, pas de compréhension »* (`docs/06` §5) et se
replie pour cette raison ; **celui-ci est la réponse à la question de l'écran**, comme le flux de la
vue d'ensemble. Un **plafond**, écrit **une fois**, au patron de ce flux — la hauteur de ce bloc
croît sans borne à chaque geste. **Aucun décompte**, ni sur l'en-tête, ni en pied.

Et **un état vide**, écran à part entière (règle 5) : une entreprise créée avant C12 n'a aucune
ligne. **Celui-ci s'atteint par un jeu de données**, à la différence des quatre que T7.8 a dû
déclarer inatteignables.

**Validation** — Cinq mesures.

1. **Lu dans le HTML servi**, `<script>` retirés : la fiche porte le nom, le centre de compétence,
   la description, les identités vérifiées, les trois faits, et **les phrases de son journal**.
2. **Le droit s'éprouve par l'action** : sans autorité, la fiche **ne rend rien** et redirige ; avec
   l'autorité, elle rend. Un identifiant qui ne désigne rien, et un identifiant qui n'est pas un
   UUID, rendent **404** — et le second **n'atteint pas la base**.
3. **Aucune donnée métier ne paraît.** Sur une entreprise dont la fixture porte produits,
   accompagnements, personnes et indicateurs, **aucun de ces libellés n'est dans le HTML servi** —
   mesuré, pas supposé. C'est la frontière de `page.tsx:44`, rendue opposable.
4. **L'état vide du journal se voit rendu**, sur une entreprise sans ligne — *vu rendu*, pas déclaré
   bon (discipline de T7.8).
5. **Le contraste se mesure** sur tout couple de couleurs neuf par la position, et **la fiche se
   relit à 375 px** : T7.6 et T7.7 ne repasseront pas.

**Mise en défaut** — Le plafond retiré fait tomber sa seule mesure ; le filtre de domaine de
`listDomainEvents` retiré doit faire paraître sur la fiche une phrase d'une autre entreprise, et
faire tomber la mesure 1 **et** la mesure 3.

**Interdits** — **Aucun geste, aucun panneau, aucune action** : c'est T12.4, et un ticket de lecture
qui s'autoriserait une écriture ne serait plus mesurable. **Aucun graphique** — ni frise, ni courbe :
la seule courbe attendue du produit est celle des indicateurs d'un produit (D41). **Aucun
`ActionMenu`.** Voir les interdits communs.

---

## T12.4 — Les gestes déménagent, et redeviennent atteignables

**Objectif** — Que les six panneaux et les trois formulaires nus vivent **sur la fiche de
l'entreprise qu'ils visent**, et que la liste redevienne une liste.

**Périmètre** — `app/domaines/[id]/page.tsx` · `app/domaines/page.tsx` · `lib/drawers/domains.tsx` ·
`app/domaines/drawers.tsx` · `lib/navigation.ts` · `app/domaines/actions.ts` (les seules
`revalidatePath`) et son test.

**Attendu** — Quatre gestes.

**1. Les cinq panneaux ciblés sur la fiche** — identités vérifiées, ajout d'identité, désignation du
premier responsable, suspension, archivage — **et les trois formulaires nus** : rétablir
l'entreprise, rétablir l'accès, révoquer l'invitation. **`resolveDomainDrawer` ne bouge pas** :
c'est **l'hôte** qui change, et les deux chemins d'ouverture — le clic par `DrawerHost` et l'adresse
collée au rendu serveur — traversent la **même** résolution (TD.2). Le `closeHref` d'un panneau de
fiche est **la fiche**, jamais la liste.

**2. Les clés gardent leur identifiant**, et c'est un choix : la résolution **confronte ce qu'elle
reçoit**, et le retirer demanderait une seconde forme de `DomainDrawerRequest` — donc une règle à
deux endroits. **En contrepartie, la fiche refuse une clé qui ne désigne pas son objet** : sur la
fiche de A, `?identites=<B>` n'ouvre **rien**. C'est le geste de l'exclusivité, déjà écrit en
décompte sur cinq pages, appliqué à l'appartenance.

**3. La liste redevient une liste.** Elle garde *« Ajouter une entreprise »* — le seul geste qui ne
vise aucune ligne, et il paraît à deux endroits, l'en-tête et l'état vide —, ses trois faits
d'accessibilité, et **le lien vers chaque fiche**. **L'`ActionMenu` disparaît de cet écran.**

**4. `revalidate()` vise la fiche et la liste.** Les deux adresses portent les mêmes faits, et l'une
ne doit pas rester périmée quand l'autre se rafraîchit. **Elle ne touche aucune autre adresse** :
cet écran administre des entreprises, il ne les traverse pas.

**Validation** — Quatre mesures, et la première referme un point ouvert.

1. **Lu dans le HTML servi**, `<script>` retirés : **chacun des huit gestes** est atteignable depuis
   la fiche — une ancre, ou un bouton de formulaire —, et **aucun n'exige JavaScript**. **Mesure
   témoin** : le même relevé sur `/domaines` **avant** le ticket n'en portait aucun, `ActionMenu`
   n'étant pas dans le HTML servi. **C'est la fermeture de la troisième exception à D30** sur cet
   écran, et **elle se mesure, elle ne s'affirme pas**.
2. Les six panneaux s'ouvrent **par l'adresse collée** sur la fiche ; **deux clés ensemble n'ouvrent
   rien** (le décompte, repris), et **une clé qui désigne une autre entreprise n'ouvre rien**.
3. **Le droit s'éprouve par l'action** : les neuf points d'entrée frappés sans autorité n'écrivent
   rien, et **les mesures de T12.2 rejouées après déménagement restent vertes**. Un panneau déplacé
   n'a jamais protégé ni ouvert quoi que ce soit — c'est la discipline, retournée dans l'autre sens.
4. **La boucle entière** : un geste fait **depuis la fiche**, sa ligne de journal **lue sur cette
   même fiche**, sans passer par la liste. **C'est la seule mesure qui dit que C12 a servi.**

**Mise en défaut** — Chaque geste retiré de la fiche fait tomber **sa seule** ligne de la mesure 1 ;
le contrôle d'appartenance de la clé retiré fait tomber **la seule** seconde moitié de la mesure 2 ;
le `revalidatePath` de la fiche retiré fait tomber **la seule** mesure 4.

**Interdits** — **Aucun geste neuf, aucun pouvoir neuf** : arbitrage (10) de C11, et le super
administrateur ne renomme toujours pas une entreprise. **Aucun `ActionMenu` sur la fiche** — ce
serait rouvrir l'exception qu'on vient de refermer. **Aucune confirmation là où elle ne protège
rien** (`docs/06` §9) : les trois gestes qui **défont** restent des formulaires nus. **Aucune
correction des trois panneaux de confirmation** hors de leur `closeHref`. Voir les interdits communs.

---

## Ce que C12 ne fait pas, et ce sont des décisions

**Le journal lu depuis l'intérieur du domaine** — arbitrage (3). Reporté **avec sa raison**, et rien
n'est forclos : la table porte `domain_id`.

**Les cinq autres familles qui écrivent sans trace** — arbitrage (4). Elles gardent leur
destination : un élargissement d'`event_target_type` **dans** le produit, et une quarantaine de
points d'appel.

**Le renommage d'une entreprise par le super administrateur** — arbitrage (10) de C11. Trois champs
descriptifs, et ils se corrigent **depuis l'intérieur**, par `manageDomain`.

**L'atomicité de l'amorçage** — dette de T3.6, inchangée : `neon-http` n'a pas de transaction
interactive, et **C12 ajoute une écriture de plus à un geste qui n'en couvre aucune**. La ligne de
journal vient **en dernier** pour cette raison : une panne perd la trace, jamais le geste.

**Le RLS** — D38, inchangée, et sa destination n'a pas bougé.

---

## Vérification, à chaque ticket

Les quatre disciplines du protocole, sans rappel : **le critère se lit dans le HTML servi** — T12.1
et T12.2 dérogent et le disent · **les tests se mettent en défaut** avant d'être crus, et **rien
d'autre ne doit tomber avec eux** · **le contraste se mesure** sur tout couple neuf par la position
· **le droit s'éprouve par l'action**, en `text/plain`, avec étape témoin.

Et les deux disciplines propres à ce terrain : **le décompte en base tranche, jamais le code HTTP** —
une fonction serveur se frappe en `text/plain`, et T6.1 comme T11.2 ont mesuré des refus qui rendent
200 · et **une trace ne se lit pas dans le code qui l'écrit** : une ligne de journal se compte en
base, et sa phrase se lit **dans le HTML servi** de la fiche.

**En fin de chantier** : `npm run lint` (`--max-warnings=0`), `npm run test` et `tsc` au vert. **Le
vert de référence est 1 962 tests sur 69 fichiers** (T7.8), et c'est à celui-là que chaque ticket
compare le sien — jamais à un souvenir.
