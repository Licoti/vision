# F2 — Concepts, hiérarchie et glossaire

**Produit :** Vision
**Statut :** v0.2 — intègre la hiérarchie Domaine / Produit / Projet / Activité et le suivi dans le temps
**Dépend de :** F1 — Cadrage produit
**Alimente :** F3 — Modèle d'accompagnement, F4 — Modèle de données

Ce document fixe le vocabulaire du produit. Chaque terme défini ici doit être employé de la même
manière dans l'interface, dans le code et dans nos échanges. Un concept absent de ce document ne
doit pas apparaître dans une maquette.

---

## 1. La hiérarchie

Vision s'organise en quatre niveaux d'appartenance, du plus large au plus fin. Chaque niveau
contient le suivant, et rien n'existe hors de cette chaîne.

```
Domaine                 l'entreprise cliente — frontière étanche des données
  └── Produit           l'objet durable accompagné, rattaché à une entité
        └── Projet      un accompagnement daté, avec objectif et équipe
              └── Activité   ce qui a été fait, à une date, avec un objectif
                    └── Ressource / Résultat   ce que l'activité laisse
```

**La lecture descendante** répond à « de quoi parle-t-on ? ».
**La lecture ascendante** répond à « qu'est-ce que ça a produit ? », et c'est elle qui donne au
produit sa valeur dans le temps.

### Précision de vocabulaire : domaine et non « tenant »

Le domaine est le **tenant** au sens technique : la frontière d'isolation des données, celle qui
permet d'initialiser une deuxième entreprise sans rien partager.

Le produit n'est pas un tenant. Il est un niveau de regroupement à l'intérieur du domaine, pas
une frontière d'isolation : au sein d'un même domaine, tous les produits et tous les projets sont
visibles par tous les membres (voir F1, section 6). Employer « tenant » pour le niveau 2
conduirait à construire une isolation par produit — contraire à la vue globale, qui est la raison
d'être de Vision.

**Un seul tenant : le domaine.** Les autres niveaux sont des niveaux de rattachement.

---

## 2. Les concepts

Onze concepts, en trois familles.

**Le cadre** — ce qui structure : `Domaine` · `Entité` · `Personne` · `Rôle`
**Le travail** — ce que le centre accompagne : `Produit` · `Projet` · `Approche` · `Activité`
**Les traces** — ce que le travail laisse : `Ressource` · `Résultat` · `Indicateur`

Le **Budget** n'est pas un concept à part : c'est une information de référence du projet, décrite
en section 5 avec les traces parce qu'elle obéit au même contrat — une synthèse macro et un lien.

---

## 3. Le cadre

### Domaine

L'entreprise cliente de Vision. Frontière absolue des données : rien n'est jamais partagé entre
deux domaines, ni les projets, ni les personnes, ni les référentiels.

Le domaine porte ses propres référentiels — entités, métiers, statuts, types d'activités,
approches. Ces listes sont **des données configurables, jamais des valeurs codées en dur**. C'est
la condition pour initialiser un deuxième domaine sans réécrire le produit.

### Entité

Une division de l'entreprise cliente pour laquelle le centre travaille : business unit, filiale,
direction. Elle qualifie les produits et sert d'axe de lecture de la vue globale.

L'entité **commande** le travail, elle ne le réalise pas. Elle ne cloisonne rien.

### Personne

Un membre du centre de compétence, issu de l'annuaire de l'entreprise. Elle porte un métier
principal — Product Design, UX Research, UI Design, Design System, UX Writing, Accessibilité.

Le métier est une propriété de la personne, pas de sa participation à un projet : le suivi des
rôles fonctionnels par projet est hors périmètre (décision D5).

### Rôle

Vision distingue trois rôles d'écriture, plus la lecture ouverte à tous.

| Rôle | Portée | Peut |
|---|---|---|
| Super administrateur | au-dessus des domaines | créer, suspendre, archiver un domaine ; désigner ses responsables |
| Responsable de domaine | un domaine | créer et modifier les produits **et** les projets, désigner les contributeurs d'un projet, gérer les référentiels et les membres |
| Contributeur | les projets où il est désigné | tout modifier dans ces projets : informations, équipe, activités, ressources, indicateurs adoptés |
| Membre | son domaine | lire l'intégralité du domaine |

Deux règles gouvernent ce modèle.

**La lecture est ouverte, l'écriture est nominative.** Tout membre lit tout son domaine, quel que
soit son rôle. Seuls les contributeurs désignés écrivent dans un projet, ce qui garantit qu'une
page projet a toujours des responsables identifiables.

**La création est réservée au responsable de domaine.** Produits et projets sont créés par lui,
puis confiés à des contributeurs. Ce choix rend la décision D9 sans objet : il n'y a pas de
création de produit à la volée, puisque celui qui crée un projet crée déjà les produits.

Point de vigilance à surveiller pendant le POC : à quinze projets et deux ou trois responsables
de domaine, ce passage obligé est sain — il garantit la qualité du référentiel produits. Si le
centre grandit, il deviendra un goulot d'étranglement, et il faudra soit élargir le droit de
création, soit multiplier les responsables de domaine.

---

## 4. Le travail

### Produit

**L'objet durable sur lequel le centre intervient**, rattaché à une entité : « l'espace client »,
« l'intranet du groupe », « le design system ». Il survit aux projets qui le font évoluer.

C'est le niveau où se lit **le temps long**. Un même produit peut être accompagné plusieurs fois,
à plusieurs années d'intervalle, par des équipes différentes et avec des approches différentes.
Chaque accompagnement est un projet distinct ; le produit en est le fil.

Le produit porte donc une page à part entière — c'est une évolution par rapport à la v0.1, où il
n'était qu'un objet de rattachement. Cette page répond à trois questions :

1. Qu'est-ce que le centre a fait sur ce produit, et quand ?
2. Qu'est-ce que ces accompagnements ont produit comme recommandations et livrables ?
3. Est-ce que les indicateurs se sont améliorés depuis ?

Attributs stockés : nom, entité, description courte.

Le statut d'accompagnement — accompagné actuellement, déjà accompagné, jamais accompagné — est
**calculé à partir des projets rattachés, jamais saisi**. Un statut saisi périmerait, ce que le
principe « mieux vaut absent que périmé » interdit.

### Projet

**Un projet est un accompagnement du centre de compétence sur un produit, avec un objectif, une
équipe et une durée bornée.**

Ce qui fait un projet :
- il porte sur un produit — le rattachement est obligatoire (décision D4) ;
- il a un objectif formulable en une phrase ;
- il a une équipe identifiée du centre et un responsable ;
- il a un commanditaire, champ libre au POC (décision D6) ;
- il a un début et une fin attendue, même approximative.

Ce qui n'est pas un projet : une tâche, une demande de quelques heures, un produit, une équipe
permanente. Une sollicitation récurrente et légère sur un même produit forme un projet
« fil de l'eau » à objectif annuel, pas quinze micro-projets.

Le projet est l'unité de rattachement du travail. **Toute activité, ressource et cible
d'indicateur appartient à un projet.**

Attributs : nom, objectif, produit, métiers impliqués, équipe, responsable, commanditaire,
statut, période, date de dernière activité.

Statuts d'amorçage, à titre d'exemples modifiables par le domaine : `Cadrage` → `En cours` →
`Terminé`, avec `En pause` comme état transverse. Ces libellés ne sont pas une énumération : le
statut est un référentiel du domaine, seule sa `nature` est fixe.

**L'archivage n'est pas un statut** mais une propriété distincte : un projet archivé conserve son
dernier statut.

### Approche

La manière dont le centre accompagne : Research, Design Thinking, Lean, Audit UX, Audit
d'accessibilité, Audit d'éco-conception, Mesure des usages.

L'approche est portée **par le projet et par l'activité** (décision D2) : le projet déclare les
approches qu'il mobilise, l'activité peut préciser la sienne. C'est un axe de lecture puissant de
la vue globale — combien de projets en recherche, combien en audit — disponible dès la création
du projet, sans attendre qu'une activité soit saisie.

### Activité

**Une activité est un fait d'accompagnement situé dans le temps.** C'est le concept qui raconte
la vie d'un projet.

Exemples : une campagne de tests utilisateurs, une série d'entretiens, un atelier de cadrage, un
audit d'accessibilité, un benchmark, une restitution.

Une activité porte :
- un **type**, issu du référentiel du domaine ;
- une **approche** de rattachement, optionnelle ;
- un **objectif** propre, en une phrase — ce que cette activité cherchait à obtenir ;
- un **état** : prévue, en cours, terminée, annulée. **Liste fermée, non configurable** — à la
  différence du statut de projet. La logique du produit en dépend directement : seule une activité
  terminée porte un résultat, seule une activité prévue peut être sans date ;
- une **période** ou une date ;
- des **participants**, optionnels ;
- des **ressources** et, le cas échéant, un **résultat**.

**Granularité** (décision D3) : un bloc de travail identifiable, de quelques jours à quelques
semaines. « Campagne de tests — vague 2 », pas « entretien avec M. Dupont ». Trop fin, la
roadmap devient un agenda et personne ne la tient.

L'ensemble des activités d'un projet, ordonné dans le temps, forme sa mini-roadmap
d'accompagnement.

**L'audit est une activité comme les autres.** Sa seule particularité est de produire un résultat
chiffré consultable dans un outil externe. Il n'a aucun statut privilégié dans le modèle.

---

## 5. Les traces

### Ressource

Un document produit ou utilisé, hébergé ailleurs. Vision stocke un lien, un titre, un type et une
date de mise à jour — jamais le fichier.

Une ressource est rattachée à un projet, et facultativement à l'activité qui l'a produite. Ce
second rattachement est ce qui transforme une liste de fichiers en récit lisible.

### Résultat

La synthèse macro de ce qu'un outil externe a produit : score d'audit heuristique, taux de
conformité d'accessibilité, score d'éco-conception, synthèse d'une campagne de tests.

**Contrat unique, valable pour tous les outils** : un libellé, une valeur, une unité, une date,
un lien profond vers l'outil source. Rien de plus. Vision n'affiche jamais le détail des
constats : le détail vit dans l'outil qui l'a produit.

Cette contrainte est délibérée. Elle garantit que brancher un nouvel outil coûte une ligne de
configuration, et que Vision ne dérive jamais vers la reconstruction des outils existants.

### Indicateur

**L'indicateur est porté par le produit, pas par le projet.** C'est le changement le plus
important de cette version, et il découle directement de la question à laquelle Vision doit
savoir répondre : *est-ce que ce que nous avons recommandé a fonctionné ?*

Un indicateur mesure une caractéristique durable du produit — taux de complétion d'un tunnel,
délai moyen de traitement, part d'usage en autonomie, poids moyen d'une page. Il vit plus
longtemps que les projets qui cherchent à le déplacer.

Il porte une **série de relevés** : une valeur, une date, une source. La donnée est mesurée
ailleurs — plateforme analytics, outil métier — et reportée dans Vision au niveau macro.

Un projet **adopte** un indicateur existant du produit, ou en crée un nouveau. En l'adoptant, il
déclare :
- la valeur de référence au démarrage ;
- la cible visée ;
- la valeur constatée à la clôture, si elle est connue.

C'est ce mécanisme qui permet à la page produit d'afficher une courbe sur laquelle les périodes
d'accompagnement sont positionnées.

### Budget

Traité comme une information de référence du projet et non comme un module : une synthèse macro
— alloué, consommé, date de relevé — et un lien profond vers l'outil de gestion existant.

---

## 6. La boucle d'apprentissage

C'est la raison d'être du niveau produit, et la question à laquelle aucun outil du centre ne sait
répondre aujourd'hui.

```
Activité  →  produit un résultat et des recommandations
Projet    →  adopte un indicateur, fixe une cible
Produit   →  conserve la série de relevés dans le temps
             et la frise des accompagnements successifs
```

La page produit juxtapose donc deux frises sur le même axe temporel : les projets et leurs
activités d'un côté, l'évolution des indicateurs de l'autre.

**Principe : Vision juxtapose, elle ne prouve pas.** Le produit n'établit aucun lien de causalité
entre un accompagnement et une évolution d'indicateur, et n'affiche jamais de score d'impact. Il
met les faits côte à côte sur un axe de temps et laisse l'interprétation à l'humain. Toute
fonctionnalité qui prétendrait mesurer l'efficacité du centre serait à la fois fausse et
dangereuse pour l'adoption.

---

## 7. Relations

```
Domaine    1 ─── n Entité
Domaine    1 ─── n Personne
Domaine    1 ─── n Produit

Entité     1 ─── n Produit
Produit    1 ─── n Projet            (plusieurs accompagnements dans le temps)
Produit    1 ─── n Indicateur
Indicateur 1 ─── n Relevé

Projet     n ─── 1 Produit           (rattachement obligatoire)
Projet     n ─── n Personne          (équipe, dont un responsable)
Projet     n ─── n Métier
Projet     n ─── n Approche
Projet     n ─── n Indicateur        (adoption : référence, cible, valeur finale)
Projet     1 ─── n Activité
Projet     1 ─── n Ressource
Projet     0 ─── 1 Budget

Activité   n ─── 0..1 Approche
Activité   1 ─── n Ressource         (optionnel)
Activité   0 ─── 1 Résultat          (optionnel, typiquement les audits)
Activité   n ─── n Personne          (participants, optionnel)
```

### Liens entre projets

**Les liens déduits**, calculés par Vision : même produit — le cas le plus fort —, même entité,
personnes en commun, approches identiques. Gratuits, toujours à jour, ils constituent l'essentiel
de la valeur. Le rattachement obligatoire à un produit garantit qu'un projet n'est jamais isolé.

**Les liens déclarés**, saisis avec une raison en texte libre : « réutilise la grille d'entretien
de X ». Ils expriment ce que le calcul ne peut pas voir, notamment la réutilisation. C'est le
seul cas où l'on demande une saisie qui ne sert pas directement à celui qui la fait : elle doit
donc rester très peu coûteuse et parfaitement optionnelle.

---

## 8. Vocabulaire proscrit

Ces termes ne doivent apparaître nulle part dans Vision, faute de quoi le produit dérive :

- **tâche**, **jalon de planning**, **charge**, **sprint** — c'est de la gestion de projet ;
- **constat**, **critère**, **fiche** — c'est le détail des outils d'audit ;
- **tenant** pour désigner un produit — un seul tenant, le domaine ;
- **score de projet**, **taux de couverture**, **niveau de maturité**, **impact mesuré** —
  Vision décrit, elle n'évalue pas ;
- **document** au sens fichier stocké — on dit **ressource**, et elle vit ailleurs.

---

## 9. Décisions tranchées

| # | Question | Décision |
|---|---|---|
| D1 | Introduit-on le concept de Produit ? | **Oui**, et il est promu : page dédiée, porteur des indicateurs et du temps long. |
| D2 | L'approche est-elle portée par le projet ou l'activité ? | **Les deux.** Le projet déclare, l'activité précise. |
| D3 | Granularité d'une activité ? | **Macro.** Quelques jours à quelques semaines, jamais l'acte unitaire. |
| D4 | Un projet peut-il exister sans produit ? | **Non.** Rattachement obligatoire, conformément à la hiérarchie. |
| D5 | Suit-on le rôle d'une personne sur un projet ? | **Non au POC.** Trop lourd. |
| D6 | Le commanditaire est-il une personne nommée ? | **Non.** Champ libre au POC. |
| D7 | Les activités passées sont-elles obligatoires à la création ? | **Non.** Un projet démarre vide et s'enrichit. |
| D8 | Activité et accompagnement : un niveau ou deux ? | **Un seul niveau.** L'activité est typée et porte son résultat. |
| D9 | Qui crée les produits et les projets ? | **Le responsable de domaine**, qui désigne ensuite les contributeurs du projet. Pas de création à la volée. |
| D10 | Où loger une mission transverse sans produit ? | **Dans un produit de type « Interne »**, rattaché au centre lui-même. Le rattachement obligatoire n'a aucune exception. |
| D11 | Un indicateur peut-il être partagé entre produits ? | **Non au POC.** Un indicateur appartient à un produit. |

---

## 10. Pistes d'évolution écartées du POC

Ces directions sont jugées pertinentes mais délibérément hors périmètre. Elles sont consignées
ici pour que les décisions du POC ne les rendent pas impossibles plus tard.

**Indicateur transverse à plusieurs produits.** Un indicateur d'entreprise — NPS global,
satisfaction globale — bénéficierait à un ensemble de produits plutôt qu'à un seul. Le modèle
doit donc éviter de rendre le rattachement à un produit unique structurellement irréversible :
un indicateur reste un objet à part entière, relié à un produit, et non une propriété de celui-ci.

**Réseau de liens entre produits.** Aujourd'hui les liens se déduisent au niveau des projets. Un
niveau de liaison entre produits ouvrirait la lecture par famille de produits ou par parcours
client.

**Page produit ouverte aux commanditaires.** La lecture par les entités reste fermée au
POC (décision F1-D2), mais la page produit est naturellement le premier candidat à une ouverture.
