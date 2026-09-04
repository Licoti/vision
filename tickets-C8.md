# Tickets — C8

Un ticket = une session de CLI. Chaque ticket porte un objectif, un périmètre de fichiers, un
critère de validation vérifiable et ses interdits.

**Règle commune à tous les tickets :** ne modifier aucun fichier hors du périmètre annoncé, ne
créer aucune fonctionnalité non listée, mettre à jour `ETAT.md` en fin de ticket.

---

# C8 — Dette

**Le premier chantier que `docs/05` §5 n'a pas écrit.** Le document s'arrête à sept chantiers, et
C7 était annoncé comme le dernier du POC — en toutes lettres dans `tickets-C7.md`. C8 n'a donc
aucun contenu prescrit : **il se tire entièrement des points ouverts d'`ETAT.md` qui portent sa
destination**, et de ceux que le découpage de C7 avait laissés orphelins.

**C7 est mis en pause, il n'est pas clos.** T7.7 → T7.10 restent écrits dans `tickets-C7.md` et
seront repris après C8 — décision humaine du 04/09/2026. Conséquence directe sur le périmètre :
**les huit points ouverts assignés à ces quatre tickets n'entrent pas dans C8** — accessibilité,
états vides, note « À propos », colonnes saisies non lues, gestes qui n'atteignent pas leur cible.
Ils gardent leur ticket. C'est un écart à `docs/05` §6 — *« un chantier à la fois, fermé avant
d'ouvrir le suivant »* — consigné dans `JOURNAL-TECHNIQUE.md` (règle 6), et la ligne de
`tickets-C7.md` qui dit *« et le POC est complet »* reste vraie le jour où C7 se referme, pas
avant.

**Ce qui le fonde tient en trois constats.** **La suite de tests est rouge** — 63 échecs sur 3
fichiers, relevés sur `HEAD` intact le 02/09/2026 —, et tant qu'elle dure, aucun critère de
validation du dépôt ne vaut : « les tests passent » ne veut plus rien dire. **Onze objets écrivent
sans laisser de trace au journal**, et la liste s'allonge d'un nom à chaque hors-ticket qui ajoute
une table — l'arbitrage qui refusait une migration d'énuméré *pour un seul objet* ne tient plus à
onze. Et **deux garde-fous du dépôt ne gardent pas ce qu'ils annoncent** : le sceau du socle laisse
trois dossiers métier hors de sa clause, l'amorçage recrée sur un renommage.

**L'ordre des cinq tickets va de ce qui bloque vers ce qui attend.** La remise au vert d'abord, sans
quoi rien ne se vérifie ; les trois tickets de contenu ensuite ; l'arbitrage des adresses en dernier.
**Aucun ticket de C8 n'est bloqué sur autre chose que le précédent** — c'est ce qui le sépare d'un
chantier qui attendrait une main extérieure.

| Manque | Le blocage | Le contenu | L'arbitrage |
|---|---|---|---|
| La vérification | T8.1 | — | — |
| Les lectures | — | T8.2, T8.3 | — |
| Le dépôt | — | T8.4 | T8.5 |

---

## Ce que C8 ne fait pas, et ce sont des décisions

**Le SSO et l'administration multi-domaine sortent du chantier, et forment C9.** Décision humaine
du 04/09/2026, prise après le découpage. C8 avait d'abord porté le SSO en dernier ticket, avec sa
condition d'ouverture en tête de fiche ; **la condition ne s'est pas levée, et un second sujet est
venu s'y adosser** — l'écran d'administration au-dessus des domaines, celui qui crée une entreprise,
la suspend et désigne ses responsables (`docs/02` §3, rôle *Super administrateur*).

**Les deux tiennent ensemble, et c'est la raison du chantier commun.** `lib/auth/session.ts` retient
aujourd'hui **le premier domaine actif trouvé en base** : tant que l'authentification est un stub,
rien ne peut dire *« cette personne appartient à cette entreprise »*, et un sélecteur d'entreprise
sans fournisseur d'identité serait une liste déroulante que n'importe qui change — **l'inverse de
l'étanchéité qu'il prétendrait servir**. L'étanchéité elle-même n'est pas en cause : elle tient
depuis C1 par la règle 1 et `lib/db/scoped.ts`, `domains` étant la seule table sans `domain_id`.

C9 devra donc porter, dans cet ordre : le **SSO** (D37) · le **rôle de super administrateur, qui
n'existe pas en base** — `domain_role` ne porte que `domain_manager` et `member` — et **l'arbitrage
de modèle qui va avec** : `persons.domain_id` est obligatoire, donc **un super administrateur ne
peut pas être une ligne de `persons`** telle qu'elle est · l'**écran** de création, de suspension et
d'archivage d'un domaine (`domains.status` porte déjà `active` / `suspended`, `archived_at` existe,
et `superAdmin` de `scoped.ts` offre déjà trois fonctions **sans aucune authentification**) ·
l'**amorçage des référentiels d'un domaine neuf**, aujourd'hui tenu par `scripts/seed.ts` · et le
**RLS que D38 rattache explicitement au SSO**.

**Deux choses relèvent de l'humain avant qu'un ticket s'écrive** : lever l'exclusion de `docs/05` §4
— *« interface d'administration multi-domaine : un seul domaine au POC »* —, et trancher où vit un
super administrateur. `docs/` est figé ; ni l'une ni l'autre n'est une décision de ticket.

**Les macro-parcours sortent du chantier eux aussi**, et passent en **C10**. Décision humaine du
04/09/2026. L'entrée de menu et l'écran vide restent tels quels — le commentaire
d'`app/(app)/macro-parcours/page.tsx` les annonce déjà correctement, et sans mentir. Ce qui reste à
trancher : ce qu'un macro-parcours relie — produits et *use cases* —, et **« macro-parcours » contre
le « Réseau de liens entre produits » de `docs/02` §10**, qui décrit la même direction sous un autre
nom. Le concept devra entrer dans `docs/02` §2, qui n'en compte que onze, et `docs/` est figé : là
encore, une écriture humaine.

**Deux points que C8 ne peut pas refermer, et leur raison.**

- **La carte qui ne se détache d'aucun fond** demande un jeton que le design system ne porte pas.
  Quatre positions mesurées, de 1,04:1 à 1,24:1, quand le seuil d'un composant est 3:1 — et le plus
  franc des `surface-neutral-*` plafonne à **2,22:1**. Le dépôt tient huit manques du design system
  sans en avoir inventé un seul ; **le neuvième ne s'invente pas ici non plus.** Destination
  → **design system**.
- **Le filtre de roadmap dans l'URL** a été repassé côté client sur arbitrage humain le 21/08/2026.
  Le rouvrir demande la même main. Destination → **arbitrage humain**.

**Un recouvrement corrigé plutôt que découpé.** Le point *« le point d'entrée annoncé de
Démarrage — le geste d'ajout d'une activité »* portait la destination C8 ; c'est **déjà le premier
geste de T7.10** — *« la piste de démarrage mène à l'activité qu'elle suggère »*, `?activite=nouvelle`
ouvert avec son type. Sa destination était périmée, elle est récrite → **T7.10**.

---

## Cinq arbitrages rendus avant écriture, à ne pas rouvrir en cours de ticket

**(a) Une seule migration est attendue de tout le chantier** — l'élargissement de l'énuméré
`event_target_type`, en T8.3. C'est la règle de C7, resservie : **une migration supplémentaire est
un signal d'arrêt**, pas une étape. Elle voudrait dire que le ticket a débordé de son périmètre.

**(b) Aucune dépendance neuve.** Le SSO était la seule pièce qui en demandait une, et il est sorti
du chantier : le dépôt reste à cinq dépendances de production, comme depuis C1.

**(c) T8.1 est bloquant.** Aucun autre ticket ne s'ouvre tant que la suite est rouge. La référence
qu'il relève — nombre de tests, état de `lint` et de `tsc` — sert de base à tous les suivants, et
**chaque ticket de C8 compare son vert à celui-là**, jamais à un souvenir.

**(d) C8 ne rend aucun écran neuf, et aucune route neuve.** Cinq tickets, zéro adresse ajoutée.
C'est ce qui sépare un chantier de dette d'un chantier de fonctionnalité, et ce qui rend son critère
lisible : **rien de neuf ne s'observe, tout ce qui existe se remesure.**

**(e) `docs/` reste figé.** Aucun ticket ne modifie un document de fondation, et aucune décision de
`docs/07` ne se rouvre (règle 6). Un écart se consigne dans `JOURNAL-TECHNIQUE.md` et le travail
continue.

---

## Interdits communs aux cinq tickets

**Aucun indice calculé** (D39). C8 touche des décomptes — celui de `/produits`, ceux de la vue
d'ensemble —, et la frontière ne bouge pas d'un pouce : **un nombre de lignes de liste est un fait,
un nombre qui qualifie un projet, une personne ou une entité est interdit.**

**Aucune valeur visuelle en dur** (règle 2), et **aucun neuvième jeton de design system inventé** —
voir plus haut, c'est la règle que huit manques ont tenue sans exception.

**Aucune suppression de donnée métier** (règle 4). **Aucune migration** hors de celle de (a).
**Aucune dépendance neuve** (b). **Aucune recherche globale** (D32). **Aucun graphique sur
la vue d'ensemble** (D33). **Aucun badge d'alerte ou de retard, aucune notification, aucune
relance, aucun classement, aucune jauge, aucun pourcentage.**

**`activities` n'est jamais `events`.** La règle de C6 ne s'éteint pas, et T8.3 est précisément le
ticket où elle se paie : à l'écran on dit **journal** et **événement**, et le mot « activité » reste
au fait d'accompagnement.

**Aucun test supprimé, aucun `skip`, aucun `only` pour obtenir du vert.** C'est l'interdit propre à
ce chantier, et il vaut au-delà de T8.1 : une suite rouge se diagnostique, elle ne se tait pas.

---

## T8.1 — La suite de tests repasse au vert, et la cause est nommée

**Rien ne s'ouvre avant ce ticket** (arbitrage (c)).

**Objectif** — 63 échecs sur 3 fichiers — `app/(app)/accompagnements/actions.test.ts`,
`app/(app)/accompagnements/[id]/actions.test.ts`, `app/(app)/equipe/actions.test.ts` — sur 1 582,
relevés sur `HEAD` intact avant la session du 02/09/2026 : **la session ne les a pas causés**. La
cause n'a jamais été cherchée. La piste première est **l'état de migration de la branche de test** :
`ETAT.md` ne connaissait que la `0013` quand la `0014` existe au dépôt depuis le 01/09.

**Périmètre** — `drizzle/` et `drizzle.config.ts` **en lecture** ; `vitest.config.mts` ; les trois
fichiers de tests en échec ; `lib/queries/activities.test.ts` ; **le code de production seulement
si le diagnostic l'exige, et le ticket dit alors pourquoi.**

**Attendu** — **Le diagnostic avant la correction, et écrit** : quelle est la cause des 63, et
pourquoi elle frappe ces trois fichiers et pas les vingt autres. Un vert obtenu sans cette phrase
n'est pas un diagnostic.

Puis deux dettes structurelles que ce ticket est **le seul à pouvoir refermer**, parce qu'il ouvre
ces fichiers :

- **les deux fichiers de tests d'action qui nettoient sur `if (!f?.domainId) return`** —
  `accompagnements/` et `produits/`. Un `beforeAll` qui échoue après avoir créé son domaine le
  laisse en place et fait tomber le fichier suivant : **c'est exactement la forme d'une cascade de
  63.** La forme à reprendre existe déjà — `equipe/actions.test.ts` (28/08) et
  `administration/actions.test.ts` (T7.3) retiennent leur `domainId` **dès la création du domaine**,
  hors de la fixture ;
- **le test intermittent de `lib/queries/activities.test.ts`** — *« sans exception, un type archivé
  n'est proposé à personne »*, échoué **une fois sur six** exécutions le 31/08/2026, passant seul.
  L'hypothèse d'une ligne restée archivée par une exécution interrompue a été **vérifiée et
  écartée** : le `beforeAll` crée un domaine neuf et les lectures sont scopées.

**Validation** — `npm run test` au vert, **et le relevé écrit de la nouvelle référence** : le nombre
de tests, qui sert de base à tout le chantier. `npm run lint` (`--max-warnings=0`) et `tsc` relevés
au même moment, pour que C8 parte d'un état connu sur les trois — **une seule des trois disciplines
au vert ne dit rien des deux autres.**

**Mise en défaut** — **La cause identifiée, remise en place, doit refaire tomber exactement les 63,
et rien d'autre.** C'est le seul geste qui prouve qu'elle a été trouvée plutôt que contournée : un
vert obtenu sans cette contre-épreuve n'est pas une correction, c'est une disparition. Si la remise
en place fait tomber un nombre différent, **la cause n'est pas celle-là**, et le ticket le dit.

**Interdits** — **Aucun test supprimé, aucun `skip`, aucun `only`.** Aucune correction de code de
production que le diagnostic ne rend pas nécessaire (règle 3) — un test rouge peut avoir raison.
Aucune migration. **Aucun `db:reset`** : la base de développement est jetable et acté, la base de
test ne l'est pas, et effacer la trace d'un défaut est le contraire d'un diagnostic.

---

## T8.2 — Les listes et leurs décomptes : ce que le contrat promettait

**Objectif** — Trois manques sur les deux écrans de liste et la vue d'ensemble, tous mesurés,
aucun deviné.

**Périmètre** — `lib/queries/overview.ts` et son test ; `lib/queries/projects.ts` et son test ;
`app/(app)/accompagnements/page.tsx` ; `app/(app)/produits/page.tsx` ;
`components/overview/distribution.tsx`.

**Attendu** — Trois gestes :

**1. `countProjects` et la répartition par entité rejouent la jointure de statut de
`listProjects`.** Le contrat est écrit en toutes lettres dans `lib/queries/overview.ts` — *« chaque
décompte rejoue les jointures de sa liste »* — et il est **faux d'une jointure** : un projet du
domaine posé sur un statut d'un **autre** domaine est écarté par la liste, dont la jointure interne
est filtrée, et **compté** par les deux décomptes, qui s'arrêtent au produit. Trouvé le 31/08/2026
par une ligne forgée. C'est une étanchéité de second rang, sans conséquence sur une base saine —
et **un contrat faux se corrige, il ne se laisse pas** : les deux constats d'égalité du test
existant ne tiennent aujourd'hui que parce qu'aucune ligne de ce genre n'existe.

**2. La liste transverse retrouve ses deux colonnes manquantes** — l'entité et les métiers, sur les
sept qu'énumère `docs/06` §4. T7.2 a posé leurs **filtres**, pas leurs colonnes : son « Attendu »
ne les nommait pas, et aucun ticket de C7 n'ouvre plus cet écran. L'entité se lit par
`projects → products.entity_id` — un accompagnement n'a pas d'entité à lui, il la tient de son
produit, et c'est déjà la jointure du filtre de T7.2. **D44 s'applique aux métiers : les métiers
déclarés de l'accompagnement font foi**, ceux de l'équipe sont informatifs et peuvent diverger.

**3. `/produits` affiche son décompte**, comme `/accompagnements` le fait avec
`formatAccompaniments(rows.length)`. La ligne de faits de la vue d'ensemble annonce « 5 produits »
vers un écran qui rend bien cinq lignes et ne dit pas son nombre — mesuré le 29/08/2026 en suivant
les liens, et un commentaire supprimé le même jour **affirmait le contraire**.

**Validation** — **Le critère se lit dans le HTML servi** pour les deux colonnes et le décompte :
les colonnes portent la valeur de la base, jamais celle du paramètre, et le décompte est le nombre
de lignes réellement rendues.

**Pour la jointure, le critère se mesure en base sur une ligne forgée** — un accompagnement du
domaine posé sur un statut d'un autre domaine — et **le chiffre doit s'accorder avec le nombre de
lignes que la liste rend**. Les deux constats d'égalité du test existant **doivent tomber avant
d'être crus** : un test qui passe parce que le cas n'existe pas n'a rien éprouvé.

**Mise en défaut** — La jointure neuve retirée fait tomber son seul cas, sur la ligne forgée. Chaque
colonne neuve retirée fait tomber la sienne. **Trois neutralisations, trois chutes isolées** — et
une cascade se cherche avant d'être crue, T7.4 en ayant trouvé trois.

**Interdits** — **Aucun filtre neuf** : T7.2 a posé les quatre de `docs/06` §4, et un cinquième
serait ce que le document ne demande pas. **Aucun tri par nombre, aucun classement d'entités**
(`docs/06` §10). **Aucun décompte qui qualifie** un accompagnement ou une entité (D39). Aucun
élargissement de la liste transverse au-delà des sept colonnes du document. Aucune pagination ni
plafond — la dette est assumée et sans échéance. Aucune migration.

---

## T8.3 — Onze objets entrent au journal

**C'est le ticket le plus lourd du chantier, et il porte sa seule migration.**

**Objectif** — `events` a reçu sa première ligne en C6, après six chantiers au schéma, avec **six**
`event_target_type`. **Onze objets écrivent encore sans laisser de trace** : persona, use case,
indicateur, personne, entité, vision produit, le budget de T7.1, le dispositif de mesure et le plan
de taggage (01/09), le repère de contexte (01/09) — et la suppression d'un accompagnement (28/08),
qui est d'une autre nature.

L'arbitrage (b) de C6 et (d) de C7 refusaient la migration d'énuméré **pour un seul objet** : *« ce
serait une migration pour un seul nom, quand cinq autres n'en ont pas »*. **À onze, c'est l'argument
qui bascule** — et chaque hors-ticket qui ajoute une table de référence du produit allonge la liste
d'un nom de plus. Le point ne se referme pas à moitié : il se referme entier ou il reste.

**Périmètre** — `lib/db/schema.ts` et **une migration** (élargissement de l'énuméré
`event_target_type`) ; `lib/db/scoped.ts` et son test ; `lib/format.ts` et son test — les libellés
d'objet du journal ; `app/(app)/produits/[id]/actions.ts`, `app/(app)/produits/actions.ts`,
`app/(app)/equipe/actions.ts`, `app/(app)/accompagnements/[id]/actions.ts` et leurs tests ;
`components/projects/journal.tsx` ; `components/overview/feed.tsx`.

**Attendu** — Un `event_target_type` par objet, **les cinq verbes existants réemployés sans qu'un
sixième s'invente**, et un appel à `record()` à chaque point d'écriture — la forme de T6.1 et T6.2,
resservie sans rien changer. **La phrase du journal appartient à qui connaît l'objet**, comme
`app/(app)/accompagnements/actions.ts` l'écrit déjà en toutes lettres : `record()` écrit, l'appelant
formule.

**Et un arbitrage qui ne produit aucune ligne de code, mais qui se consigne.** La **suppression d'un
accompagnement** (28/08) n'est pas un douzième appel oublié : `events.project_id` étant `cascade`,
une trace écrite juste avant serait **effacée par l'instruction suivante**. Il n'y a pas de ligne à
écrire, **il y a une disparition à admettre** — et à écrire dans le commentaire du geste, plutôt que
de la laisser se redécouvrir une troisième fois.

**Un point récupéré au passage, parce que ce ticket ouvre le fichier** : l'en-tête de `schema.ts`
annonce *« les 26 tables métier »*, elles sont **33**. C'est le cinquième chiffre faux d'une même
famille — `scoped.ts`, la fiche de C6 deux fois, `drawers/project.tsx`. **Le geste est de retirer le
chiffre**, pas de le corriger : un compte écrit dans une prose est un compte qui redeviendra faux.
Le point était destiné à T7.10 ; C8 passe avant, il se referme ici.

**Validation** — **Le critère se lit dans le HTML servi** : chaque objet neuf, écrit puis relu
**dans le bloc « Journal » de la page d'accompagnement et dans le flux de la vue d'ensemble**, avec
son libellé français — et sans que le mot « activité » désigne autre chose qu'un fait
d'accompagnement.

**Le geste se mesure en base** : décompte d'`events` **avant et après chaque écriture**, avec étape
témoin — *le code HTTP ne dit jamais ce qui a été écrit*, et trois « 200 muets » ont déjà été payés
faute d'étape témoin. **Le droit s'éprouve par l'action** : une écriture refusée n'écrit **ni la
donnée ni sa ligne de journal**, et c'est le cas que la mesure doit viser, pas seulement celui qui
réussit.

**Mise en défaut** — Chaque appel à `record()` neutralisé fait tomber **son seul** cas : **onze
neutralisations, onze chutes isolées**. C'est le contrôle que T7.4 a fait passer à neuf, et qui y a
trouvé **trois cascades** avant qu'on les croie.

**Interdits** — **Aucun sixième verbe.** Aucune seconde migration (arbitrage (a)). **Aucune trace
sur une lecture** : `events` journalise l'écriture, jamais la consultation — ce serait de
l'analytics d'usage, que `CLAUDE.md` exclut du produit. Aucun versionnement, aucune restauration,
aucune comparaison (D22 : *le journal est une trace, pas un historique*). **Aucun décompte
d'événements rendu à l'écran** — l'interdit de T6.6 tient. Aucune ligne écrite pour la suppression
d'un accompagnement. Aucun élargissement du journal à un objet qui n'est pas dans la liste des onze
(règle 3).

---

## T8.4 — Les garde-fous du dépôt : le sceau, et l'amorçage qui recrée

**Objectif** — Deux règles qui devaient tenir toutes seules et ne tiennent pas. Leur destination
commune était *« au prochain ticket qui ouvre le fichier »*, et **elle a déjà échoué une fois** : le
dossier a été ouvert le 29/08/2026 par la reprise de la vue d'ensemble — trois fichiers touchés, un
supprimé — et le sceau n'a pas été posé, poser une règle ESLint y ayant été un geste hors périmètre
(règle 3). **Une destination qui désigne un événement plutôt qu'un ticket ne se déclenche pas :**
celle-ci reçoit un ticket.

**Périmètre** — `eslint.config.mjs` ; `scripts/seed.ts`.

**Attendu** — Deux gestes :

**1. `uiLayerSeal` scelle tous les dossiers métier.** Sa clause anti-remontée nomme aujourd'hui
`@/components/products/*`, `@/components/projects/*` et `@/components/team/*` — et laisse
**`shell/`, `overview/` et `admin/`** hors du sceau : trois dossiers dont le socle pourrait importer
sans qu'ESLint bronche, alors que la règle affirme que *« la dépendance va du métier vers
`components/ui/`, jamais l'inverse »*. Le geste est d'**ajouter les trois manquants à la clause
existante**, pas de récrire la règle : les deux autres clauses — la couche de requêtes, les actions
serveur — ne bougent pas.

**2. L'amorçage cesse de recréer sur un renommage.** `scripts/seed.ts` rapproche par **clé
naturelle**, si bien qu'un libellé changé sème une ligne neuve et laisse l'ancienne orpheline —
**et c'est arrivé**, en base de développement, où deux lignes ont subsisté. La clé des activités,
étendue à `projet · type · période`, atténue sans éliminer. Le point est **refermé pour les entités
seules** ; six clés naturelles restent. Sans conséquence en production, où l'amorçage ne tourne
pas : c'est la fixture de démonstration qui dérive, et `docs/05` §6 la veut **maintenue à jour avec
le modèle**.

**Un point récupéré au passage, parce que ce ticket ouvre `seed.ts`** : les deux use cases de la
fixture n'ont **aucun persona rattaché**. Le rattachement est facultatif et le lien a été éprouvé
par sonde scopée : ce qui manque est un **jeu d'essai**. Sa destination est *« au prochain ticket
qui sème des personae »* — c'est celui-ci.

**Validation** — **Les deux règles se mettent en défaut, et c'est tout ce qui les prouve.**

Pour le sceau : un import interdit ajouté **temporairement** dans `components/ui/` doit faire
échouer `npm run lint`, **dossier par dossier, sur les trois neufs**. Une règle ESLint qu'aucune
violation n'a jamais fait tomber n'est pas une règle, c'est une intention — et les trois motifs
anti-recopie du dépôt ont été mis en défaut de cette façon le 01/09.

Pour l'amorçage : **renommer une ligne d'un référentiel puis relancer l'amorçage ne doit plus créer
de doublon** — décompte en base avant et après, **sur chacune des six clés**, et non sur une seule
que l'on généraliserait.

**Interdits** — **Aucune règle ESLint neuve** : le sceau existant s'étend, il ne se remplace pas, et
aucun autre dossier ne reçoit de sceau qu'il n'avait pas. **Aucun changement de donnée dans la
fixture** au-delà des personae et de ce que le rapprochement exige — `docs/05` §6 la veut
**volontairement réduite**, un jeu volumineux donnant une fausse impression de maturité. Aucune
suppression de ligne en base par le script (règle 4) : le rapprochement corrige, il n'efface pas.
**Aucun `db:reset`, aucun outillage de remise à zéro** — la dette de la base dérivée est assumée et
sans échéance, ce ticket ne l'ouvre pas. Aucune migration.

---

## T8.5 — Les adresses de `/projets` : réexaminer plutôt que reconduire

**Objectif** — Deux redirections 308 tiennent `/projets` en vie dans `next.config.ts` depuis le
renommage du 02/09/2026. Le point ouvert les pose exactement ainsi : *« elles sont du code mort le
jour où plus personne ne détient d'ancienne adresse, et rien ne dira ce jour-là »*. **Ce ticket est
un arbitrage avant d'être du code**, et il se rend avec sa raison écrite — reconduire sans
réexaminer serait précisément ce que le point refuse.

**Périmètre** — `next.config.ts` ; les composants de la page d'accompagnement qui portent un `id`
de section.

**Attendu** — Deux gestes :

**1. Trancher les deux redirections**, et écrire la décision dans le commentaire qui les porte
déjà. Soit elles restent, **avec la condition de leur retrait nommée** — une date, ou un fait
observable —, soit elles tombent. **Une redirection sans condition de fin est une dette qui ne se
remboursera jamais**, faute de signal : c'est le fait même que le point relève.

**2. Le fragment n'est pas couvert, et il ne l'a jamais été.** Les 308 portent la **route**, pas
l'**ancre** : `#projets-lies` est devenu `#accompagnements-lies` sans filet. Le bloc « Projets
liés » étant masqué depuis le 28/08/2026, **le risque est faible, pas nul** — et le geste est de le
**dire dans le commentaire**, ou de rendre l'ancien `id` atteignable. Jamais les deux à moitié.

**Validation** — **Le critère se mesure en HTTP**, jamais dans le code de configuration :
`/projets`, `/projets/<uuid>` et `/projets?statut=<valeur>` rendent le code attendu **et l'adresse
de destination exacte, chaîne de requête comprise**. C'est ce que le commentaire affirme aujourd'hui
de la main de Next, et cela n'a été mesuré qu'une fois. **Si les redirections tombent, le critère
est un 404 mesuré**, pas supposé — un retrait s'éprouve comme un ajout.

**Mise en défaut** — Une redirection retirée fait tomber son seul cas. **Les deux formes — la racine
et le chemin profond — se vérifient séparément**, parce que ce sont deux règles et non une : la
première ne couvre pas `/projets/<uuid>`, et la seconde ne couvre pas `/projets`.

**Interdits** — **Aucune troisième redirection**, aucun élargissement à d'autres anciennes adresses
(règle 3). **Aucune réouverture du renommage de D35** : la décision a été rouverte par l'humain le
02/09, et elle est tranchée. Aucun renommage d'`id` de section au-delà de ce que le geste 2 exige —
les `id` de la page d'accompagnement sont des cibles de fragment qu'on partage, choisies et nommées
au journal technique le 31/08.


## Vérification, à chaque ticket

Les quatre disciplines du protocole, sans rappel :

1. **Le critère se lit dans le HTML servi**, jamais il ne s'affirme — `curl` sur l'adresse,
   `<script>` retirés, le HTML de développement n'étant pas déterministe (leçon de TD.3).
2. **Les tests se mettent en défaut** avant d'être crus : neutraliser la règle, voir tomber
   exactement les tests attendus, et rien d'autre.
3. **Le contraste se mesure** sur tout couple de couleurs neuf par la position.
4. **Le droit s'éprouve par l'action**, jamais par l'écran, avec étape témoin, en `text/plain`.

**Deux tickets dérogent au premier point, et le disent.** T8.1 ne rend aucun écran : son critère est
la suite de tests elle-même, et sa contre-épreuve. T8.5 ne se lit pas dans le HTML mais **dans le
code de réponse HTTP et l'en-tête `Location`** — ce qui est une mesure, pas une lecture de code.

**Et une discipline propre à ce chantier** : chaque ticket compare son vert à **la référence relevée
par T8.1**, jamais à un souvenir ni à un chiffre d'`ETAT.md`. Une suite qui a été rouge une fois se
relève avant d'être crue.

En fin de chantier : `npm run lint` (`--max-warnings=0`), `npm run test` et `tsc` au vert, **et C7
reprend là où il s'était arrêté** — T7.7, accessibilité. C9 vient après lui, et **il ne se découpe
pas avant que l'inscription d'application Entra ID existe** : c'est la même condition qu'un ticket
portait, remontée au chantier.
