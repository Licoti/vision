# F6 — Architecture de l'information

**Produit :** Vision
**Statut :** v0.1 — à valider
**Dépend de :** F1 à F5
**Alimente :** `brief-design.md` (extrait resserré pour Claude Design) et les chantiers C2 à C7

Ce document définit les écrans, leur hiérarchie, leur contenu et les patterns d'interaction. Il ne
décrit ni couleurs, ni typographies, ni composants : ces choix relèvent du design system.

---

## 1. Les deux axes de lecture

Vision se parcourt de deux manières, et toute l'architecture en découle.

**L'axe produit** répond à *que fait-on sur cet objet, et depuis quand ?* Il porte le temps long,
les accompagnements successifs, les indicateurs.

**L'axe projet** répond à *où en est cet accompagnement, et qu'a-t-il produit ?* Il porte
l'activité, les ressources, l'équipe.

Ces deux axes se croisent partout : depuis un produit on descend vers ses projets, depuis un
projet on remonte vers son produit et ses accompagnements voisins. Le fil d'Ariane
`Produit › Projet` est présent sur toute page projet — c'est ce qui empêche un projet d'être vécu
comme un objet isolé.

La vue d'ensemble n'est pas un troisième axe : c'est le point d'entrée qui distribue vers les deux
autres.

### Un chemin canonique, un chemin transverse

**Le chemin canonique est hiérarchique** : `Produits › Produit › Projet › Activités › Outil externe`.
Il reflète le modèle de F2 et fait autorité. La page produit est le conteneur : elle liste ses
accompagnements successifs, et c'est par elle qu'on descend vers un projet.

**Le chemin transverse est la liste des projets.** Il existe parce que deux besoins réels ne
peuvent pas passer par la hiérarchie : un responsable pose des questions qui traversent les
produits — tous les projets en cours d'une entité, tous ceux mobilisant l'accessibilité ce
trimestre — et un contributeur cherche son projet sans forcément se rappeler le nom du produit.

Le rapport entre les deux est celui d'une arborescence et d'une recherche : la première structure,
la seconde raccourcit. Ce sont deux accès au même arbre, jamais deux mondes parallèles. La
section 7 fixe les règles qui garantissent cette continuité.

---

## 2. Carte des écrans

```
Vue d'ensemble                    point d'entrée, activité du centre
│
├── Produits                      liste — chemin canonique
│   └── Produit                   accompagnements successifs et temps long
│       ├── création / édition
│       └── Projet                page centrale de l'accompagnement
│           ├── création / édition
│           └── activité          création / édition en panneau latéral
│                                 └── lien sortant vers l'outil
│
├── Projets                       liste transverse, filtrable — raccourci vers le même arbre
│
└── Administration                référentiels du domaine (responsable de domaine)
```

Six écrans, dont deux formulaires et un panneau. C'est le plancher : chaque écran supplémentaire
doit être justifié par une question à laquelle aucun autre ne répond.

### Question directrice de chaque écran

| Écran | Question à laquelle il répond |
|---|---|
| Vue d'ensemble | Que se passe-t-il en ce moment dans le centre ? |
| Produits | Sur quels objets le centre intervient-il, et pour quelles entités ? |
| Produit | Qu'avons-nous fait sur ce produit dans le temps, et qu'est-ce que ça a donné ? |
| Projet | Où en est cet accompagnement, et qu'a-t-il produit ? |
| Projets | Quels accompagnements existent en ce moment, tous produits confondus ? |
| Administration | Comment adapter le vocabulaire du domaine ? |

Cette colonne est la discipline centrale du document. Un bloc qui ne sert pas la question de son
écran n'a rien à y faire, même s'il est intéressant.

---

## 3. Vue d'ensemble

Elle ne cherche pas à tout montrer. Elle répond à « que se passe-t-il en ce moment », dans cet
ordre :

1. **L'activité récente** — les dernières activités saisies et les changements notables, tous
   projets confondus, avec leur projet d'origine. C'est le seul endroit du produit qui donne le
   sentiment que Vision est vivante.
2. **Une lecture de la répartition** — combien de projets par statut, par entité, par approche.
   Sous forme de chiffres et de filtres cliquables, pas de graphiques décoratifs.
3. **Les projets sans activité récente** — une liste courte, factuelle, sans alerte ni badge.
4. **Un accès direct** aux projets et produits.

Ce qu'on n'y met pas : aucun score global, aucune jauge de complétude, aucun indicateur de
performance du centre. La raison est écrite en F1 — Vision décrit, elle n'évalue pas — et cette
règle vaut particulièrement sur l'écran que verra un responsable.

---

## 4. Liste des projets — accès transverse

Une liste dense, pas une grille de cartes. À quinze puis cinquante projets, la comparaison
visuelle ligne à ligne l'emporte sur l'esthétique des vignettes.

Cet écran ne remplace pas la hiérarchie : il la traverse. **Le produit de rattachement est donc
affiché sur chaque ligne et cliquable**, pour que la structure reste lisible depuis le raccourci.

**Filtres :** entité, métier, approche, statut. Combinables, avec un compteur de résultats et un
retrait en un geste.
**Tri par défaut :** activité la plus récente en premier.
**Recherche :** sur le nom, l'objectif et les noms des membres.

**Chaque ligne porte :** nom du projet, produit de rattachement, entité, statut, métiers, équipe,
date de dernière activité. Rien d'autre. Pas de roadmap répliquée (décision D18), pas de
résultat d'audit.

---

## 5. Page projet

C'est la page la plus consultée du produit. Sa segmentation obéit à une règle : **un récit
dominant, des blocs de référence autour.**

### En-tête — identité

Nom, fil d'Ariane `Produit › Projet`, statut, période, objectif en une phrase, entité,
commanditaire, approches mobilisées, équipe avec ses contributeurs. Tout ce qui permet de
comprendre le projet sans faire défiler.

### Corps — l'accompagnement

**La roadmap des activités occupe la position dominante.** C'est le récit du projet et la raison
d'être de Vision : elle vient immédiatement après l'en-tête, avant tout bloc de référence.

Organisation reprise de F3 : en cours, puis prévu, puis à planifier, puis terminé, puis annulé
replié. Chaque activité affiche son type, son objectif, sa période, son approche, et le cas
échéant son résultat avec le lien vers l'outil.

L'action « ajouter une activité » est présente en haut de ce bloc, pas reléguée en pied de page.

### Blocs de référence

Dans cet ordre, correspondant à leur fréquence de consultation :

| Bloc | Contenu |
|---|---|
| Ressources | Liens vers les documents, avec leur type et l'activité qui les a produits |
| Indicateurs | Indicateurs du produit adoptés par ce projet : référence, cible, dernière valeur |
| Projets liés | Liens déduits d'abord — même produit en tête —, puis liens déclarés avec leur raison |
| Budget | Alloué, consommé, lien vers l'outil de gestion |
| Journal | Frise repliée par défaut : qui a fait quoi, quand |

Le journal est en dernier et replié : c'est une information de contrôle, pas de compréhension.

### Ce que la page projet ne contient pas

Aucun score de projet, aucun pourcentage d'avancement, aucun détail de constat d'audit, aucune
liste de tâches. Les blocs vides restent affichés avec une invitation à agir — un projet sans
ressource est un projet normal, pas une page incomplète.

---

## 6. Page produit

### Socle — dès C2

Nom, entité, description, et la **liste des accompagnements successifs** : chaque projet avec sa
période, son statut, son équipe, son objectif. Ordonnée du plus récent au plus ancien.

C'est déjà utile sans aucun indicateur : elle répond à « qui est intervenu sur ce produit, et
quand ». C'est aussi le passage obligé de la navigation, puisqu'un projet ne peut pas exister sans
produit.

### Temps long — en C5

Au-dessus de la liste, une frise unique sur un axe temporel commun :

- les périodes d'accompagnement, en bandes ;
- les activités porteuses d'un résultat, en repères ;
- les courbes d'indicateurs, construites à partir des relevés datés.

**Aucune annotation de causalité, aucun calcul d'écart, aucune flèche d'impact.** La frise
juxtapose ; la lecture appartient à celui qui connaît le contexte. Si la tentation d'ajouter un
« +12 % depuis l'accompagnement » se présente, la réponse est non — c'est le point de bascule où
Vision cesserait d'être un outil de mémoire pour devenir un outil de justification.

---

## 7. Continuité entre produit et projet

Quatre règles garantissent que le raccourci transverse ne fasse jamais oublier la hiérarchie.

**Le produit est toujours visible depuis un projet.** Fil d'Ariane en tête de page, et mention du
produit sur chaque ligne de la liste transverse. Un projet ne s'affiche jamais sans son parent.

**Le rang de l'accompagnement est affiché.** En en-tête de projet, une mention du type
« 3ᵉ accompagnement de ce produit », cliquable vers la page produit. C'est ce détail qui fait
comprendre au premier coup d'œil que le produit a une histoire plus longue que le projet consulté.

**La descente est toujours possible.** Depuis la page produit, chaque accompagnement mène à sa
page projet ; depuis la page projet, chaque activité mène à son résultat et à son outil externe.
La chaîne `Produit › Projet › Activité › Outil` ne comporte aucune rupture.

**La remontée est toujours possible.** Depuis une activité, on retrouve son projet ; depuis un
projet, son produit ; depuis un produit, la liste et l'entité. Aucun écran n'est un cul-de-sac.

La page personne, un temps envisagée pour répondre à « qui travaille sur quoi », est écartée du
POC (décision D29) : les filtres par métier et la recherche par nom sur la liste transverse y
répondent suffisamment.

---

## 8. Navigation

**Navigation principale, quatre entrées, dans cet ordre :** Vue d'ensemble, Produits, Projets, et
l'accès à l'administration réservé aux responsables de domaine. L'ordre n'est pas neutre :
Produits précède Projets parce que c'est le chemin canonique.

**Fil d'Ariane systématique** sur les pages de détail : `Produits › Espace client › Refonte 2026`.
C'est lui qui matérialise la hiérarchie de F2 dans l'interface.

**Pas de recherche globale au POC.** Chaque liste porte sa propre recherche. Une recherche
transverse suppose une pertinence inter-objets qui ne se justifie pas à cette échelle.

**Les liens sortants sont explicitement marqués.** Un lien qui quitte Vision vers Ergonome,
SharePoint ou le portail analytics doit être reconnaissable avant le clic. C'est la traduction
visuelle du principe « centraliser sans remplacer » : Vision assume d'être un point de départ.

---

## 9. Patterns d'interaction

**La saisie d'activité est le geste critique.** Elle doit tenir en moins d'une minute. Panneau
latéral plutôt que page dédiée, champs obligatoires réduits au type et à la période, état
pré-rempli selon la date, enregistrement sans confirmation intermédiaire. Si ce geste est lourd,
la roadmap se vide et le produit meurt — c'est le seul endroit où l'ergonomie décide de
l'adoption.

**Édition en place pour les champs simples**, formulaire complet uniquement pour la création.

**Les états vides sont des écrans à part entière.** Au démarrage, tout Vision sera vide : c'est la
première impression du produit. Chaque état vide explique ce que le bloc contiendra et propose
l'action correspondante.

**La fraîcheur est affichée, jamais reprochée.** Une date de dernière activité, en gris, sans
badge d'alerte, sans couleur d'avertissement, sans relance.

**Les filtres sont conservés** pendant la session lorsqu'on entre dans un projet et qu'on revient.

**Densité maîtrisée.** Vision est un outil de travail consulté rapidement : listes lisibles,
typographie sobre, peu d'ornement. La hiérarchie se fait par l'espacement et le poids
typographique, pas par la couleur.

---

## 10. Ce qui ne doit apparaître nulle part

Repris de F1, F2 et F3, et rappelé ici parce que c'est un document d'interface :

- score de projet, note, niveau de maturité, taux de couverture ;
- pourcentage d'avancement, jauge de complétion ;
- badge d'alerte ou de retard, notification, relance ;
- diagramme de Gantt, dépendances entre activités ;
- classement de projets, de personnes ou d'entités ;
- graphique décoratif sans lecture actionnable.

---

## 11. Socle transverse

**Thème par variables.** Aucune valeur visuelle en dur dans un composant : chaque domaine devra
pouvoir porter sa charte (F4, section 9).

**Accessibilité.** Le centre de compétence réalise des audits d'accessibilité ; un produit non
accessible serait intenable. Navigation clavier complète, focus visible, contrastes conformes,
hiérarchie de titres cohérente, libellés explicites.

**Écrans.** Conception pour le bureau, lisible sur tablette et mobile sans être optimisée pour
eux. Aucune fonctionnalité réservée à un format.

**Langue.** Français, avec le vocabulaire exact de F2. Les termes proscrits de F2 section 8 ne
doivent apparaître dans aucun libellé d'interface.

---

## 12. Décisions tranchées

| # | Question | Décision |
|---|---|---|
| D29 | La page personne entre-t-elle dans le POC ? | **Non.** Un écran de moins ; les filtres par métier et la recherche par nom suffisent. |
| D30 | Saisie d'activité en panneau ou en page ? | **Panneau latéral**, pour la fluidité et la conservation du contexte. |
| D31 | La roadmap passe-t-elle avant les informations ? | **Non.** En-tête d'identité, puis roadmap, puis blocs de référence. |
| D32 | Faut-il une recherche globale ? | **Non au POC.** Une recherche par liste. |
| D33 | La vue d'ensemble affiche-t-elle des graphiques ? | **Non.** Des chiffres cliquables qui appliquent un filtre. |
| D34 | Faut-il conserver une liste de projets à côté de la hiérarchie produit ? | **Oui**, en accès transverse assumé, avec les règles de continuité de la section 7. Sans elle, aucune question transverse ne trouve de réponse. |
