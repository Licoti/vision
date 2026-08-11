# F3 — Modèle d'accompagnement

**Produit :** Vision
**Statut :** v0.1 — à valider
**Dépend de :** F1 — Cadrage produit, F2 — Concepts et glossaire
**Alimente :** F4 — Modèle de données, F6 — Architecture de l'information

Ce document définit la manière dont Vision représente ce que le centre de compétence fait
réellement sur un projet, et comment cette représentation se lit dans le temps. C'est le cœur du
produit : tout le reste — vue globale, page produit, liens entre projets — en découle.

---

## 1. Le principe

**Une activité, un fait, une date.** Un seul niveau, pas d'imbrication (décision D8). Ce qui a été
fait est une activité typée ; ce qu'elle a produit est une ressource ou un résultat.

Trois règles encadrent tout ce document.

**Décrire, pas planifier.** Vision enregistre ce qui a eu lieu et signale ce qui est prévu. Elle
ne gère ni dépendances, ni charges, ni pourcentages d'avancement. Chaque fois qu'une
fonctionnalité rendrait Vision utile pour *piloter* un projet, elle est hors périmètre.

**Le coût de saisie décide.** Une activité doit pouvoir être créée en moins de trente secondes.
Ce qui n'est pas saisissable en trente secondes ne sera pas saisi, et la roadmap sera fausse.

**L'absence est une information.** Un projet sans activité récente n'est pas un échec de saisie à
signaler par un badge d'alerte : c'est un fait, qui se lit dans la date de dernière activité.

---

## 2. Le référentiel des types d'activité

Le type est une **donnée du domaine**, configurable, jamais une liste codée en dur. Ce qui suit
est le référentiel de départ proposé, organisé en six familles.

| Famille | Types d'activité |
|---|---|
| Cadrage | Atelier de cadrage · Benchmark · Analyse de l'existant · Entretien commanditaire |
| Recherche | Entretiens utilisateurs · Test utilisateur · Questionnaire · Observation terrain · Analyse de verbatims |
| Conception | Atelier de co-conception · Sprint de conception · Maquettage · Revue de conception |
| Évaluation | Audit UX · Audit d'accessibilité · Audit d'éco-conception · Revue experte |
| Mesure | Définition d'indicateurs · Analyse des usages · Restitution de mesure |
| Transmission | Restitution · Formation · Documentation · Passation |

La famille est un simple regroupement d'affichage. Elle donne à la vue globale un axe de lecture
lisible — « ce trimestre, le centre a fait surtout de la recherche et de l'évaluation » — sans
imposer de méthodologie.

**Le référentiel doit rester court.** Une liste de quarante types produit de la saisie approximative
et des statistiques inexploitables. Vingt à vingt-cinq types constituent un bon plafond ; au-delà,
le signe est qu'on cherche à décrire l'acte plutôt que le bloc de travail.

---

## 3. Approche et type : deux axes distincts

L'**approche** décrit la manière d'accompagner : Research, Design Thinking, Lean, Audit UX, Audit
d'accessibilité, Audit d'éco-conception, Mesure des usages.

Le **type** décrit l'acte : un atelier, un test, un audit.

Les deux sont indépendants. Un atelier peut relever du Design Thinking comme du Lean ; des
entretiens peuvent relever de la Research comme d'un cadrage. C'est pourquoi Vision ne déduit
jamais l'approche du type — elle laisse le contributeur qualifier son intention.

Le projet déclare les approches qu'il mobilise dès sa création ; l'activité peut préciser la
sienne, sans obligation (décision D2). Cette dissociation permet à la vue globale d'être
renseignée immédiatement, avant qu'aucune activité n'existe.

---

## 4. Cycle de vie d'une activité

```
        ┌──────────┐      ┌───────────┐      ┌───────────┐
        │  Prévue  │ ───► │ En cours  │ ───► │ Terminée  │
        └────┬─────┘      └─────┬─────┘      └───────────┘
             │                  │
             └──────────────────┴──────────► Annulée
```

**Prévue.** L'activité est envisagée. Elle n'exige qu'un type et une période approximative — un
mois suffit. C'est l'état qui donne sa valeur à la roadmap : sans lui, Vision ne dit que le passé.

**En cours.** L'activité a démarré. La transition peut être implicite quand la date de début est
atteinte, mais elle reste modifiable à la main.

**Terminée.** L'activité a eu lieu. C'est le seul état qui autorise le rattachement d'un résultat.
Une activité terminée sans ressource ni résultat reste légitime : un atelier peut n'avoir produit
qu'une décision.

**Annulée.** L'activité ne se fera pas. Elle reste visible dans l'historique, en retrait. On ne
supprime pas une activité annulée : savoir qu'un audit était prévu et a été abandonné est une
information sur le projet.

### Saisie minimale

| État | Champs obligatoires | Champs facultatifs |
|---|---|---|
| Prévue | type, période estimée (mois) | approche, objectif, participants |
| En cours | type, date de début | approche, objectif, participants, ressources |
| Terminée | type, date de fin | tout le reste, dont résultat et ressources |
| Annulée | type, motif court | — |

Le champ **objectif** de l'activité — une phrase sur ce qu'elle cherchait à obtenir — est
facultatif mais fortement encouragé : c'est lui qui rend la roadmap lisible par quelqu'un
d'extérieur au projet, et qui alimentera plus tard la lecture d'impact au niveau produit.

---

## 5. Les activités outillées

Certains types d'activité — les audits, principalement — produisent un **résultat** chiffré dans
un outil externe. Vision applique alors le contrat unique défini en F2 : libellé, valeur, unité,
date, lien profond. Jamais le détail des constats.

Trois niveaux d'intégration sont possibles, et **le POC s'en tient au premier** :

| Niveau | Fonctionnement | Statut |
|---|---|---|
| 1 — Déclaratif | Le contributeur saisit la valeur et colle le lien vers le rapport. | **POC** |
| 2 — Lancement délégué | Vision propose un bouton qui ouvre l'outil pré-rempli du contexte projet. | Après le POC |
| 3 — Synchronisé | L'outil renvoie son résultat à Vision par API, sans saisie. | Cible à terme |

Ce séquencement est important pour les chantiers Claude Code : le niveau 1 rend Vision
utilisable dès le premier jour, indépendamment de la maturité des outils d'audit, dont deux sont
encore en conception. La bibliothèque de fiches reste débranchée à ce stade.

---

## 6. La mini-roadmap du projet

C'est la représentation du temps qui fait ou défait ce produit. Le piège est le diagramme de
Gantt : il suppose une précision de planification que le centre n'a pas, et il tire Vision vers
la gestion de projet, explicitement exclue.

### Ce que la roadmap représente

Une **frise chronologique par mois**, sur laquelle chaque activité occupe sa période. Les
activités sont regroupées visuellement par état, dans cet ordre de lecture :

1. **En cours** — ce qui se passe maintenant, en tête ;
2. **Prévu** — ce qui vient, avec la période estimée ;
3. **Terminé** — l'historique, du plus récent au plus ancien ;
4. **Annulé** — en retrait, replié par défaut.

Chaque entrée affiche : type, objectif en une ligne, période, approche si renseignée, et le cas
échéant le résultat avec son lien vers l'outil.

### Choix de représentation

**L'unité est le mois.** Personne ne saura dire qu'un atelier était prévu le 14. Une granularité
au jour crée une fausse précision et une charge de saisie inutile.

**Une activité sans date certaine reste possible**, dans un groupe « à planifier ». Forcer une
date inventée dégrade la donnée plus que de l'assumer absente.

**Pas de dépendances entre activités**, pas de pourcentage d'avancement, pas de charge, pas de
récurrence automatique. Ce sont les quatre portes d'entrée de la gestion de projet.

**Une activité appartient à un seul projet.** Un atelier commun à deux projets est saisi deux
fois, et le rapprochement se fait par un lien déclaré entre les projets. La duplication est ici
préférable au partage : elle évite un objet transverse coûteux pour un cas rare.

---

## 7. La lecture au niveau produit

La page produit superpose deux frises sur le même axe temporel.

```
Produit : Espace client
─────────────────────────────────────────────────────────────►  temps
Accompagnements  ▓▓▓▓ Projet A (2024)        ▓▓▓▓▓▓ Projet B (2026)
Activités             ● ● ●   ●                    ●  ● ●
Indicateur       ──────────╮                  ╭────────────
« autonomie »              ╰──────────────────╯
```

Trois éléments, et rien de plus :

1. **La frise des projets** — chaque accompagnement, sa période, son statut, son équipe.
2. **Les activités marquantes** positionnées sur l'axe — celles qui portent un résultat.
3. **Les courbes d'indicateurs**, construites à partir des relevés successifs.

C'est cette juxtaposition qui répond à la question « est-ce que ce que nous avons recommandé a
fonctionné ? ». Elle y répond en donnant à lire, pas en concluant.

**Rappel du principe de F2 : Vision juxtapose, elle ne prouve pas.** Aucun calcul d'impact, aucune
flèche de causalité, aucun score d'efficacité. La page met les faits côte à côte ; l'interprétation
appartient à celui qui connaît le contexte.

### Conséquence sur les indicateurs

Pour que cette lecture ait un sens, un relevé d'indicateur doit toujours porter une **date** et une
**source**. Un indicateur sans date de relevé n'est pas affichable sur la frise et doit être
signalé comme tel plutôt que positionné arbitrairement à aujourd'hui.

Le rythme de relevé est libre et manuel au POC. Trois à quatre relevés par an suffisent à rendre
une courbe lisible ; l'enjeu n'est pas la fréquence mais la continuité entre deux projets.

---

## 8. La fraîcheur

La **date de dernière activité** d'un projet est calculée, jamais saisie : c'est la date la plus
récente parmi ses activités et modifications.

Elle sert à deux choses, et à rien d'autre :

- afficher, sur la liste des projets, depuis quand un projet n'a pas bougé ;
- distinguer un projet « En cours » réellement actif d'un projet « En cours » oublié.

**Aucune relance automatique, aucun badge d'alerte, aucun rappel par courriel au POC.** Vision
montre le fait ; c'est au responsable du centre d'en tirer les conséquences. Un produit qui
harcèle ses contributeurs perd ses contributeurs.

Le statut du projet reste **saisi explicitement** et n'est jamais déduit des activités. Un projet
peut légitimement être en cours sans activité récente.

---

## 9. Ce que le modèle ne fait pas

| Exclu | Raison |
|---|---|
| Dépendances entre activités | Gestion de projet |
| Charge, temps passé, coût par activité | Staffing et suivi des temps, hors périmètre (F1) |
| Pourcentage d'avancement | Fausse précision, et incite à la mise à jour cosmétique |
| Sous-activités | Contredit la granularité macro (décision D3) |
| Activités récurrentes automatiques | Génère du bruit et des activités vides |
| Détail des constats d'audit | Vit dans les outils dédiés (F2) |
| Modèles de projet type | Prescriptif : le centre n'impose pas un parcours d'accompagnement |

Ce dernier point mérite d'être tenu fermement. Proposer un « modèle d'accompagnement standard »
à la création d'un projet reviendrait à réintroduire par la porte la logique de complétude
écartée avec la jauge d'audits.

---

## 10. Décisions tranchées

| # | Question | Décision |
|---|---|---|
| D12 | Une activité peut-elle porter plusieurs approches ? | **Une seule**, facultative, au POC. |
| D13 | Unité de temps de la roadmap ? | **Le mois.** |
| D14 | Faut-il un état « à planifier » sans date ? | **Oui**, en groupe distinct. |
| D15 | Les résultats d'audit sont-ils saisis à la main au POC ? | **Oui**, niveau 1 déclaratif, en attendant les API d'Ergonome, de l'audit d'accessibilité et des outils suivants. Le modèle de données doit prévoir le branchement automatique dès maintenant (voir F4). |
| D16 | Le type d'activité est-il obligatoire ? | **Oui**, avec la période. |
| D17 | Peut-on créer une activité depuis la vue globale ? | **Non.** Toujours depuis le projet. |
| D18 | Affiche-t-on la roadmap dans la vue globale ? | **Non au POC.** La frise reste contextuelle au projet. Une remontée au niveau produit reste envisagée pour une vision d'ensemble ultérieure. |
