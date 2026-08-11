# Brief design — Vision

Document autonome destiné à une passe de conception unique. Il contient tout le nécessaire et rien
de plus : ni modèle de données, ni historique de décisions.

Un `design-system.md` est fourni séparément et fait autorité sur les couleurs, typographies,
composants et espacements.

---

## 1. Ce qu'est Vision

Vision est une plateforme interne d'entreprise. Elle documente **comment un centre de compétence
design accompagne les produits de l'entreprise, dans le temps**.

Le centre regroupe des designers, chercheurs et experts qui interviennent sur des produits qui ne
leur appartiennent pas. Leur travail se disperse aujourd'hui dans les outils des autres :
livrables dans SharePoint, audits dans leurs plateformes, mesures dans l'analytics. Vision relie
tout ça à un produit, à un projet et à un moment.

**Vision ne remplace aucun outil.** Elle affiche une synthèse et renvoie vers l'outil source. Elle
n'est ni un gestionnaire de projet, ni un espace de stockage, ni un outil d'évaluation.

### Ce qui est fermé, ce qui vous appartient

Ce brief mêle des décisions produit arrêtées et des propositions ergonomiques. La distinction
compte : sur les secondes, votre jugement prime sur ce qui est écrit ici.

**Fermé — ne pas rouvrir :**
le vocabulaire de la section 3 · la hiérarchie `Produit › Projet › Activité` et le fil d'Ariane ·
les sept écrans et leur question directrice · la liste des interdits de la section 6 ·
la position dominante de la roadmap sur la page projet · l'absence de toute causalité affichée sur
la frise produit · la granularité au mois · le fait que Vision renvoie vers les outils externes au
lieu d'en reproduire le contenu.

**Ouvert — votre jugement :**
la forme des listes et des regroupements · la composition et l'ordre des blocs de référence ·
la façon de présenter la répartition chiffrée · la forme du panneau de saisie, tant que le geste
tient en moins d'une minute · la construction de la frise produit · le traitement des états
vides · la densité et le rythme visuel · la navigation secondaire · l'ensemble du langage visuel.

Si un choix ergonomique différent de celui décrit ici sert mieux la question de l'écran, prenez-le
et signalez-le brièvement.

---

## 2. Utilisateurs

**Le contributeur** — designer, chercheur. Il intervient sur plusieurs projets. Il vient chercher
le contexte d'un projet, et saisir ce qu'il vient de faire. C'est lui qui alimente Vision : si la
saisie est lourde, le produit se vide.

**Le responsable du centre** — il pilote l'activité et rend des comptes. Il vient comprendre ce
qui se passe, repérer les projets à l'arrêt, montrer ce que le centre apporte.

Contexte : environ 15 projets, 20 personnes, une seule entreprise. Usage de bureau. Français.

---

## 3. Vocabulaire — à respecter exactement

| Terme | Définition |
|---|---|
| **Produit** | L'objet durable accompagné : « Espace client web ». Rattaché à une entité. Il survit aux projets. |
| **Projet** | Un accompagnement du centre sur un produit, avec un objectif, une équipe, une période. Un produit peut être accompagné plusieurs fois, à des années d'écart. |
| **Activité** | Un fait d'accompagnement daté : un atelier, une campagne de tests, un audit. C'est le récit du projet. |
| **Approche** | La méthodologie mobilisée : Research, Design Thinking, Lean, Audit UX, Audit d'accessibilité, Audit d'éco-conception, Mesure des usages. Un projet peut en mobiliser plusieurs. |
| **Résultat** | Ce qu'une activité a produit dans un outil externe : un score, un taux. Toujours accompagné d'un lien vers l'outil. |
| **Ressource** | Un document hébergé ailleurs. Vision n'affiche qu'un lien. |
| **Indicateur** | Une mesure du produit suivie dans le temps, avec des relevés datés. Un projet l'adopte en fixant une cible. |
| **Entité** | Une division de l'entreprise : Banque de détail, Assurance, Corporate… |

**Hiérarchie :** `Produit › Projet › Activité › lien vers l'outil externe`

---

## 4. Les écrans

Sept écrans. Chacun répond à une question et une seule.

| Écran | Question |
|---|---|
| Vue d'ensemble | Que se passe-t-il en ce moment dans le centre ? |
| Produits | Sur quels objets le centre intervient-il, et pour quelles entités ? |
| Produit | Qu'avons-nous fait sur ce produit dans le temps, et qu'est-ce que ça a donné ? |
| Projet | Où en est cet accompagnement, et qu'a-t-il produit ? |
| Projets | Quels accompagnements existent en ce moment, tous produits confondus ? |
| Nouvelle activité (panneau) | Comment enregistrer ce que je viens de faire, en moins d'une minute ? |
| À propos | Qu'est-ce que Vision, et qu'est-ce que ce n'est pas ? |

Navigation principale, dans cet ordre : **Vue d'ensemble · Produits · Projets · À propos**, plus
un accès administration discret. Fil d'Ariane systématique sur les pages de détail :
`Produits › Espace client web › Autonomie des opérations courantes`.

### 4.1 Vue d'ensemble

Point d'entrée. Dans cet ordre :

1. **L'activité récente** — les dernières activités saisies, tous projets confondus, avec leur
   projet d'origine. C'est ce qui donne le sentiment que Vision est vivante.
2. **La répartition** — nombre de projets par statut, par entité, par approche. Ces chiffres
   doivent être **cliquables et appliquer un filtre** : c'est leur seule raison d'être. Leur forme
   vous appartient, à condition qu'aucune représentation ne soit purement décorative.
3. **Les projets sans activité récente** — liste courte, factuelle, sans alerte ni badge.

### 4.2 Produits

Liste des produits accompagnés par le centre — pas le catalogue de l'entreprise. Groupés ou
filtrables par entité. Chaque ligne : nom, entité, nombre d'accompagnements, date de dernière
activité.

### 4.3 Produit

**Le socle**, à concevoir en priorité : nom, entité, description courte, puis **la liste des
accompagnements successifs**, du plus récent au plus ancien — chaque projet avec sa période, son
statut, son objectif, son équipe.

**La couche temps long**, au-dessus de la liste : une frise sur un axe temporel unique, portant
les périodes d'accompagnement en bandes, les activités porteuses d'un résultat en repères, et les
courbes d'indicateurs construites à partir des relevés datés.

C'est l'écran signature du produit : il répond à « est-ce que ce que nous avons recommandé a
fonctionné ? » **en donnant à lire, jamais en concluant.** Aucune flèche de causalité, aucun
calcul d'écart, aucune mention de type « +12 % depuis l'accompagnement ».

### 4.4 Projet

L'écran le plus consulté. Un récit dominant, des blocs de référence autour.

**En-tête — identité.** Nom, fil d'Ariane, statut, période, objectif en une phrase, entité,
commanditaire, approches mobilisées, équipe. Plus une mention cliquable *« 2ᵉ accompagnement de ce
produit »*. Tout doit se comprendre sans faire défiler.

**Corps — la roadmap des activités**, immédiatement après l'en-tête et avant tout bloc de
référence. C'est le cœur du produit.

- Axe temporel au **mois**, jamais au jour.
- Groupées par état, dans cet ordre : **en cours · prévu · à planifier · terminé · annulé**
  (annulé replié).
- Chaque activité : type, objectif en une ligne, période, approche, et le cas échéant son
  résultat avec le lien vers l'outil.
- L'action « ajouter une activité » est en haut du bloc, pas en pied de page.
- **Surtout pas un diagramme de Gantt.** Pas de dépendances, pas de pourcentage d'avancement.

**Blocs de référence :** Ressources · Indicateurs adoptés · Projets liés · Budget · Journal.
L'ordre proposé suit la fréquence de consultation, et le journal vient en dernier, replié : c'est
une information de contrôle, pas de compréhension. Un autre regroupement est recevable s'il sert
mieux la lecture.

### 4.5 Projets

Accès transverse à la hiérarchie. L'écran sert la **comparaison ligne à ligne** : à quinze puis
cinquante projets, on balaie et on compare plus qu'on ne contemple. Une liste dense y répond bien,
mais la forme reste la vôtre si elle sert cet usage.

Filtres combinables : entité, métier, approche, statut. Tri par activité récente. Recherche sur
nom, objectif et membres.

Chaque ligne : nom, **produit de rattachement cliquable**, entité, statut, métiers, équipe, date
de dernière activité. Rien d'autre.

### 4.6 Nouvelle activité

**Le geste critique du produit.** Deux exigences, dans cet ordre : il tient en **moins d'une
minute**, et il ne fait **pas perdre le contexte de la roadmap**. Un panneau latéral y répond
bien, mais toute forme qui tient ces deux exigences convient.

Champs obligatoires : type et période (au mois) — ou la case « à planifier ». Facultatifs :
approche, objectif en une phrase, participants, et pour une activité terminée, un résultat
(libellé, valeur, unité, date, lien vers l'outil).

Enregistrement direct, sans étape de confirmation.

### 4.7 À propos

Page interne, derrière l'authentification, atteinte par la navigation — jamais une page d'accueil
qu'on traverse.

Contenu : ce qu'est Vision, à quoi elle sert, le vocabulaire expliqué en quelques lignes, ce
qu'elle ne fait pas, et l'état actuel daté (ce qui existe, ce qui viendra).

**Ton : note interne, pas page produit.** Factuel, neutre, sans emphase, sans promesse. Aucune
formule du type « la plateforme qui transforme ». C'est l'écran le plus libre du produit : bon
endroit pour poser la direction visuelle d'ensemble.

---

## 5. Principes d'interface

**Densité maîtrisée.** Outil de travail consulté rapidement. Listes lisibles, typographie sobre,
peu d'ornement. La hiérarchie passe par l'espacement et le poids typographique, pas par la couleur.

**Les états vides sont des écrans à part entière.** Au démarrage tout sera vide : c'est la première
impression du produit. Chaque bloc vide explique ce qu'il contiendra et propose l'action.

**La fraîcheur est affichée, jamais reprochée.** Une date de dernière activité en gris. Pas de
badge d'alerte, pas de couleur d'avertissement.

**Les liens sortants sont reconnaissables avant le clic.** Vision assume d'être un point de départ
vers Ergonome, SharePoint ou le portail analytics.

**Réduire la friction d'édition.** Corriger un champ ne devrait pas imposer d'ouvrir un formulaire
complet ; l'édition en place est une réponse possible parmi d'autres.

**Accessibilité exigeante.** Le centre réalise des audits d'accessibilité : navigation clavier
complète, focus visible, contrastes conformes, hiérarchie de titres cohérente.

**Thème par variables.** Aucune valeur visuelle en dur : chaque entreprise cliente devra pouvoir
porter sa charte.

---

## 6. Interdits

À ne concevoir sous aucune forme :

- score de projet, note, niveau de maturité, taux de couverture, jauge de complétude ;
- pourcentage d'avancement ;
- badge d'alerte, de retard, notification, relance ;
- diagramme de Gantt, dépendances entre activités ;
- classement de projets, de personnes ou d'entités ;
- graphique décoratif sans lecture actionnable ;
- détail des constats d'audit — ils vivent dans les outils externes ;
- liste de tâches.

Ces exclusions ne sont pas des simplifications de POC : Vision décrit une activité, elle
n'évalue personne.

---

## 7. Données d'exemple

À utiliser telles quelles dans les maquettes.

**Entreprise :** Groupe Meridian — Centre de compétence Design & Produit
**Entités :** Banque de détail · Assurance · Corporate · Digital Factory · RH & Interne

### Produit — Espace client web (Banque de détail)
Deux accompagnements, à deux ans d'écart. C'est le produit à utiliser pour montrer le temps long.

**Projet 1 — Refonte du parcours de virement** · terminé · mars → septembre 2024
Objectif : réduire les abandons en cours de virement.
Approches : Research, Audit UX. Équipe : Camille Roux, Sofia Marchand, Yanis Bertin.
Activités : *Entretiens utilisateurs* (avril 2024, terminée) · *Audit UX* (mai 2024, terminée,
résultat 62/100, lien Ergonome) · *Atelier de co-conception* (juin 2024, terminée) ·
*Restitution* (septembre 2024, terminée).

**Projet 2 — Autonomie des opérations courantes** · en cours · depuis février 2026
Objectif : permettre les opérations courantes sans contact avec le support.
Approches : Research, Audit d'accessibilité, Mesure des usages. Équipe : Camille Roux,
Inès Kaddour, Léa Fontaine, plus Marc Tellier (chef de projet côté entité, sans compte Vision).
Activités : *Campagne de tests — vague 2* (mars 2026, terminée, restitution liée) ·
*Audit d'accessibilité* (juin 2026, terminée, résultat 68 % de conformité, lien vers l'outil) ·
*Atelier de priorisation* (août 2026, en cours) · *Audit UX* (octobre 2026, prévue) ·
*Formation des équipes produit* (à planifier).

**Indicateur du produit :** « Part des virements réalisés sans contact support »
Relevés : 54 % (sept. 2024) · 63 % (mars 2025) · 71 % (juin 2026). Cible du projet 2 : 85 %.

### Produit — Déclaration de sinistre en ligne (Assurance)
**Projet — Dématérialisation de la déclaration** · en cours · depuis mai 2026
Objectif : permettre une déclaration complète sans passer par un conseiller.
Approches : Design Thinking, Audit UX. Équipe : Thomas Lemaire, Awa Diallo.
Activités : *Atelier de cadrage* (mai 2026, terminée) · *Observation en agence* (juin 2026,
terminée) · *Audit UX* (septembre 2026, prévue).

**Ressources d'exemple :** « Restitution des tests — vague 2 » (PowerPoint) · « Grille
d'entretien » (Word) · « Maquettes v3 » (Figma) · « Rapport d'audit d'accessibilité » (PDF).

---

## 8. Attendus de cette passe

1. La **structure et la hiérarchie de l'information** de chaque écran.
2. Une **direction visuelle** cohérente avec le `design-system.md`.
3. Le traitement des **états vides**, sur au moins la page projet et la page produit.
4. Le **panneau de nouvelle activité**, geste le plus important du produit.
5. La **frise de la page produit**, écran signature.

Priorité si l'ensemble ne peut être traité : **page projet, puis page produit, puis panneau
d'activité.** Ce sont les trois écrans dont dépend l'adoption.
