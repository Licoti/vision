# Tickets — C3

Un ticket = une session de CLI. Chaque ticket porte un objectif, un périmètre de fichiers, un
critère de validation vérifiable et ses interdits.

**Règle commune à tous les tickets :** ne modifier aucun fichier hors du périmètre annoncé, ne
créer aucune fonctionnalité non listée, mettre à jour `ETAT.md` en fin de ticket.

---

# C3 — Activités et roadmap · **Sonnet**

Le cœur du produit, et le dernier chantier du POC minimal démontrable. `docs/05` §5 lui donne
quatre éléments — types d'activité, cycle de vie, groupe « à planifier », frise du projet — et sa
table §3 quatre gestes : création, édition, changement d'état, groupe « à planifier ».

C'est aussi le chantier où l'ergonomie décide de l'adoption. `docs/06` §9 : *« La saisie d'activité
est le geste critique. Elle doit tenir en moins d'une minute. Si ce geste est lourd, la roadmap se
vide et le produit meurt. »* L'ordre des six tickets en découle : T3.1 pose l'écran où une saisie se
vérifie, T3.2 lève la seule inconnue technique — un panneau latéral sans JavaScript —, et **T3.3
rend le geste testable de bout en bout**.

**Interdits communs aux six tickets.** Résultat d'audit et ressource (C4), indicateur et frise
produit (C5), journal et liens entre projets (C6), roadmap dans la vue d'ensemble (D18), création
d'une activité ailleurs que depuis son projet (D17), sous-activité, dépendance entre activités,
charge, temps passé, pourcentage d'avancement, jauge, badge de retard ou d'alerte, suppression
d'une activité.

## T3.1 — Roadmap du projet, lecture

**Objectif** — La page projet affiche les activités de l'accompagnement, groupées par état, à la
place de l'état vide annoncé par T2.4.

**Périmètre** — `lib/queries/activities.ts` et ses tests, `components/projects/roadmap.tsx`,
`app/(app)/projets/[id]/page.tsx`, `lib/format.ts` si un libellé de période manque.

**Attendu** — Le bloc occupe la position dominante, immédiatement après l'en-tête et avant les
blocs de référence (`docs/06` §5). Quatre groupes, dans l'ordre de lecture de `docs/03` §6 :
**En cours · Prévu · À planifier · Terminé**. « À planifier » est le groupe des activités `planned`
portant `is_unscheduled` (D14) ; « Prévu » celui des `planned` datées. Un groupe sans activité ne
s'affiche pas. Chaque entrée porte son type, son objectif, sa période au mois (D13) et son approche
si elle est renseignée — rien d'autre. Le groupe « Terminé » se lit du plus récent au plus ancien ;
l'ordre interne des trois autres n'est écrit nulle part, le ticket le choisit et le consigne au
journal. Un projet sans activité affiche un état vide qui dit ce que la roadmap contiendra.

**Validation** — Sur « Autonomie des opérations courantes », les cinq activités de la fixture
s'affichent dans cet ordre exact, lu dans le HTML servi : Atelier de priorisation (août 2026) ·
Audit UX (octobre 2026) · Formation *(à planifier)* · Audit d'accessibilité (juin 2026) · Test
utilisateur (mars 2026). Sur « Refonte de l'espace documents », l'état vide s'affiche.

**Interdits** — Aucune écriture, aucune action. Aucun groupe « Annulé » : il arrive avec T3.5, le
ticket qui peut le peupler. Aucun axe temporel, aucune bande, aucun trait de durée.

## T3.2 — Panneau latéral de saisie

**Objectif** — Le panneau de saisie s'ouvre et se ferme depuis la page projet, sans JavaScript et
sans quitter le contexte.

**Périmètre** — `components/projects/activity-panel.tsx`, `app/(app)/projets/[id]/page.tsx`,
`components/projects/roadmap.tsx`, `lib/navigation.ts`.

**Attendu** — Panneau latéral et non page dédiée (D30). Il s'ouvre par un paramètre d'URL sur la
page projet, qui reste rendue derrière lui : le contexte est conservé par construction, sans état
client. L'action « Ajouter une activité » est en **tête** du bloc roadmap, pas en pied (`docs/06`
§5), et reprise dans l'état vide de T3.1. Le panneau porte son titre, le nom du projet, une
fermeture, et le formulaire vide — qui n'enregistre rien à ce stade. L'action et le panneau
n'existent que pour qui peut écrire dans ce projet : responsable de domaine ou contributeur désigné
(D9).

**Validation** — Le panneau s'ouvre depuis les deux points d'entrée et se ferme, JavaScript
désactivé. L'ordre de tabulation est lu dans le rendu. Chez un membre non contributeur, l'action
est absente des deux endroits et l'URL d'ouverture ne rend pas le panneau.

**Interdits** — Aucune écriture en base. Aucun bloc « Activité terminée — ajouter un résultat » :
la maquette le montre, il appartient à C4. Aucune valeur d'ombre inventée — le design system nomme
ses élévations sans les définir : la question se fait remonter au journal, elle ne se comble pas.

## T3.3 — Création d'une activité

**Objectif** — Saisir en moins d'une minute une activité qu'on vient de terminer ou qu'on prévoit,
depuis son projet.

**Périmètre** — `lib/forms/activity.ts` et ses tests, `app/(app)/projets/[id]/actions.ts`,
`components/projects/activity-panel.tsx`, `lib/queries/activities.ts`.

**Attendu** — Deux champs suffisent : le **type**, obligatoire (D16), présenté groupé par famille
(`docs/03` §2), et la **période**, au mois, ou la case « à planifier » qui la remplace (D14).
Facultatifs : l'objectif — une phrase, fortement encouragé — et l'approche, une seule (D12).
**L'état n'est pas saisi : il se déduit de la période** (`docs/06` §9) — période passée, activité
terminée ; période en cours, activité en cours ; période à venir ou sans date, activité prévue. La
correction à la main est le geste de T3.5. Enregistrement sans confirmation intermédiaire. Le droit
se vérifie dans l'action et pas seulement à l'écran. L'écriture recalcule `last_activity_at`
(`docs/04` §3, §6). Une saisie refusée revient dans le panneau avec ses valeurs.

**Validation** — Une activité créée apparaît aussitôt dans le groupe que sa période commande, et la
fraîcheur du projet suit dans la liste transverse ; le parcours est joué sans une ligne de
JavaScript. Les champs récoltés chez un responsable et repostés sous le cookie d'un membre non
contributeur sont refusés, base inchangée. Trois refus éprouvés séparément : type absent, période
absente sans « à planifier », période dont la fin précède le début.

**Interdits** — Aucune création d'activité depuis la vue d'ensemble ou la liste des projets (D17).
Aucun résultat, aucune ressource (C4). Aucun modèle d'activités pré-remplies à la création d'un
projet (`docs/03` §9). Aucun champ de charge ni de durée.

## T3.4 — Édition d'une activité

**Objectif** — Corriger une activité déjà saisie dans le même panneau que celui de sa création.

**Périmètre** — `components/projects/activity-panel.tsx`, `app/(app)/projets/[id]/actions.ts`,
`lib/forms/activity.ts` et ses tests, `components/projects/roadmap.tsx`.

**Attendu** — Chaque entrée de la roadmap ouvre le panneau pré-rempli. Mêmes champs, mêmes règles,
même validation qu'à la création : un seul formulaire, deux points d'entrée. Une activité « à
planifier » qui reçoit une période quitte ce groupe, et une activité datée dont on coche « à
planifier » y entre — les deux sens, `is_unscheduled` et la période restant cohérents. Le droit et
le recalcul de fraîcheur sont ceux de T3.3.

**Validation** — La Formation « à planifier » d'« Autonomie des opérations courantes », datée de
novembre 2026, passe dans le groupe « Prévu » ; ramenée sans date, elle revient dans « À
planifier ». Un type et un objectif modifiés se lisent sur la roadmap. Une re-soumission à
l'identique ne change aucune ligne.

**Interdits** — Aucune suppression, aucun archivage d'activité : `docs/03` §4 ferme la suppression,
et l'annulation de T3.5 en tient lieu. Aucune édition en place hors du panneau. Aucun changement de
projet de rattachement : une activité appartient à un seul projet (`docs/03` §6).

## T3.5 — Cycle de vie : changement d'état et annulation

**Objectif** — Faire avancer une activité dans son cycle de vie en un geste, et annuler celles qui
ne se feront pas.

**Périmètre** — `app/(app)/projets/[id]/actions.ts`, `components/projects/roadmap.tsx`,
`components/projects/activity-panel.tsx`, `lib/forms/activity.ts` et ses tests.

**Attendu** — Les transitions de `docs/03` §4 — prévue → en cours → terminée, et annulée depuis
l'une ou l'autre — se déclenchent depuis l'entrée de roadmap, sans passer par le formulaire complet.
L'annulation exige un **motif court**, elle seule. Le cinquième groupe apparaît : **Annulé**, en
retrait et replié par défaut, l'activité y restant visible — savoir qu'un audit était prévu et a été
abandonné est une information sur le projet. Les règles d'intégrité de `docs/04` §3 sont éprouvées
en base : une activité terminée exige une fin de période, une activité annulée un motif.

**Validation** — Les quatre transitions déplacent l'activité de groupe, lu dans le HTML servi. Une
activité passée en « terminée » sans fin de période est refusée. Une activité annulée reste
affichée dans le groupe replié, avec son motif. Le passage prévue → en cours fait bouger la
fraîcheur du projet dans la liste transverse — la règle de T2.1, qui exclut les activités prévues
du calcul.

**Interdits** — Aucune transition automatique déclenchée par l'horloge : `docs/03` §4 l'autorise
mais la veut modifiable ; un état qui changerait seul entre deux affichages n'est pas éprouvable.
Aucune relance, aucun badge sur une activité en retard. Aucun retour en arrière depuis « annulée »
s'il n'est pas dans le schéma d'états.

## T3.6 — Participants d'une activité

**Objectif** — Déclarer qui a pris part à une activité, parmi les personnes du domaine.

**Périmètre** — `components/projects/activity-panel.tsx`, `lib/forms/activity.ts` et ses tests,
`app/(app)/projets/[id]/actions.ts`, `lib/queries/activities.ts`.

**Attendu** — Champ facultatif du panneau (`docs/03` §4), sur le modèle des membres de projet de
T2.6 : les personnes viennent de la liste existante, la liaison `activity_participants` se crée et
se retire, et le retrait est une vraie suppression de ligne — une présence défaite n'est pas une
donnée métier qu'on range. Les participants s'affichent sur l'entrée de roadmap.

**Validation** — Deux participants ajoutés puis un retiré, relu en base. Une re-soumission à
l'identique ne crée aucun doublon. Une personne d'un autre domaine est refusée par la couche
d'accès, pas par l'écran.

**Interdits** — Aucune création de personne à la volée : c'est le formulaire de projet qui la porte
(T2.6, D19). Aucun rôle, aucune quotité, aucun temps passé par participant. Aucune page personne
(D29).
