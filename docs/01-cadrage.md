# F1 — Cadrage produit

**Produit :** Vision
**Statut :** v0.1 — à valider
**Portée :** POC sur un domaine, architecture pensée multi-domaines

---

## 1. La thèse

Un centre de compétence design accompagne des projets qui ne lui appartiennent pas. Son travail
se disperse dans les outils des autres : les livrables partent dans SharePoint, les audits dans
leurs plateformes, les mesures dans l'analytics, le budget dans l'outil de gestion. Le centre
produit donc en permanence de la valeur qu'il ne sait plus montrer, ni retrouver, ni réutiliser.

**Vision documente l'accompagnement du centre de compétence, projet par projet, dans le temps.**

C'est la phrase de référence. Vision n'est pas un annuaire de projets auquel on aurait greffé des
outils : c'est le récit de ce que le centre fait, pour qui, avec quelles approches, et ce que ça
a produit. Les audits ne sont qu'une forme d'accompagnement parmi d'autres.

---

## 2. Le problème

Trois symptômes, observés dans le fonctionnement actuel.

**L'activité du centre est invisible.** Personne ne peut répondre rapidement à « sur quoi
travaillons-nous en ce moment, pour quelles entités, avec quels métiers ». L'information existe,
mais elle est répartie entre les têtes, les fils de discussion et des fichiers de suivi partiels.
Conséquence directe : le centre a du mal à démontrer sa valeur et à arbitrer ses priorités.

**Le contexte d'un projet est dispersé.** Rejoindre un projet en cours, ou y revenir après
plusieurs mois, suppose de reconstituer le contexte à la main : quel objectif, qui est impliqué,
qu'est-ce qui a déjà été fait, où sont les livrables, quels résultats ont été obtenus.

**Le travail n'est pas réutilisé.** Une grille d'entretien, un audit, une restitution de tests
pourraient servir à trois autres projets. Faute de visibilité, ils sont refaits ou ignorés.

### Ce qui n'est pas le problème

Le centre ne manque pas d'outils. Il ne manque pas non plus de méthode. Il manque un endroit qui
relie les deux à un projet et à un moment. Toute fonctionnalité qui reconstruit un outil existant
s'éloigne du problème.

---

## 3. Les utilisateurs

### Le contributeur — designer, chercheur, expert

Il intervient sur plusieurs projets, parfois pour plusieurs entités, parfois sur plusieurs métiers.

Ce qu'il cherche à faire :
- retrouver le contexte d'un projet sans solliciter quelqu'un ;
- savoir ce qui a déjà été fait sur ce projet avant lui ;
- rendre visible ce qu'il vient de produire, sans double saisie ;
- trouver un travail réutilisable ailleurs dans le centre.

C'est lui qui alimente Vision. **S'il n'y trouve pas son intérêt, la vue globale sera fausse.**
C'est la contrainte de conception la plus forte du produit.

### Le responsable de centre de compétence

Il pilote l'ensemble de l'activité et rend des comptes.

Ce qu'il cherche à faire :
- comprendre l'activité en cours en quelques minutes ;
- voir la répartition par entité, métier, statut ;
- repérer les projets à l'arrêt ou en difficulté ;
- montrer ce que le centre apporte, avec des faits ;
- identifier les redondances entre projets.

### L'interlocuteur côté entité — commanditaire, product owner

Il n'utilise pas Vision au quotidien. Il y vient pour comprendre ce que le centre fait sur son
projet et ce qui est prévu ensuite. Il doit pouvoir lire la page projet sans formation.

### Le nouvel arrivant

Cas d'usage secondaire mais révélateur : si quelqu'un qui arrive dans le centre peut comprendre
son activité en parcourant Vision pendant vingt minutes, le produit fonctionne.

---

## 4. Ce que Vision n'est pas

Ces non-objectifs ont autant de valeur que les objectifs. Ils sont opposables aux demandes
d'évolution futures.

| Vision n'est pas | Parce que |
|---|---|
| Un outil de gestion de projet | Pas de tâches, pas de planning détaillé, pas d'affectation. Les équipes ont déjà leurs outils. |
| Une gestion documentaire | Les fichiers restent dans SharePoint. Vision garde le lien et le contexte. |
| Un outil d'audit | Les audits se font dans leurs outils dédiés. Vision affiche le résultat global et y renvoie. |
| Une plateforme d'analytics | La mesure se fait ailleurs. Vision porte l'objectif et sa progression, au niveau macro. |
| Un outil de pilotage budgétaire | Le budget est géré dans l'outil existant. Vision en affiche une synthèse et y renvoie. |
| Un outil de staffing ou de suivi des temps | Hors périmètre, y compris à long terme. |
| Un outil d'évaluation des équipes | Vision décrit une activité, elle ne note personne. |

Ce dernier point mérite d'être explicite dans le produit : rien dans Vision ne doit pouvoir être
lu comme un classement des projets ou des personnes. C'est une condition d'adoption.

---

## 5. Principes directeurs

**Centraliser sans remplacer.** Chaque fois qu'une fonctionnalité recouvre un outil existant, la
bonne réponse est une synthèse et un lien profond.

**Le projet est l'unité de sens.** Toute information a un projet de rattachement. Ce qui n'a pas
de projet n'a pas sa place dans Vision.

**La donnée doit être un sous-produit de l'usage.** Ce qui alimente la vue globale doit résulter
d'une action déjà utile au contributeur. La saisie qui ne sert qu'au reporting est le mécanisme
par lequel ce type de produit meurt.

**Une vue globale n'a de valeur que si elle est vraie.** Mieux vaut une information absente
qu'une information périmée. La fraîcheur est un élément d'interface, pas un détail technique.

**Décrire, pas prescrire.** Vision ne pousse pas les équipes vers un accompagnement type. Un
projet sans audit est un projet normal. Aucun indicateur de complétude, aucun score de conformité
méthodologique.

**Rendre le réutilisable visible.** Quand deux projets se ressemblent, Vision doit le montrer
plutôt que d'attendre que quelqu'un le déclare.

**Multi-domaines dès l'origine.** Le POC tourne sur un seul domaine, mais aucune donnée
métier n'existe hors d'un domaine, et aucun référentiel n'est codé en dur.

**Rester simple pour le POC.** Chaque fonctionnalité doit se justifier à quinze projets, pas à
deux cents.

---

## 6. Contexte et contraintes

- **Périmètre du POC :** un centre de compétence, environ 15 projets et 20 personnes.
- **Visibilité :** tous les projets sont visibles par tous les membres du domaine. Pas de
  cloisonnement entre entités à ce stade. L'entité est un axe de filtrage, pas un mur.
- **Écosystème :** environnement Microsoft. Authentification par le SSO de l'entreprise,
  annuaire des personnes issu du système existant, ressources hébergées dans SharePoint.
- **Outils à connecter :** outil d'audit heuristique (existant), audit d'accessibilité (en
  conception), audit d'éco-conception (à venir), portail analytics (en conception), outil de
  budget par projet (existant).
- **Démarrage :** amorçage avec des projets fictifs, puis saisie progressive des projets réels.

---

## 7. Ce que le POC doit démontrer

Le POC sert à décider s'il faut continuer. Il réussit si, après quelques semaines d'usage réel :

1. les contributeurs y reviennent sans qu'on le leur demande ;
2. un responsable peut décrire l'activité du centre à partir de Vision, sans document annexe ;
3. au moins un cas de réutilisation entre projets a été déclenché par Vision ;
4. les pages projet restent à jour sans relance systématique.

Le quatrième critère est le plus discriminant. C'est celui qui distingue un produit vivant d'un
répertoire abandonné.

---

## 8. Décisions à valider

Les décisions de ce document sont préfixées `F1-` pour ne pas entrer en collision avec la série
continue `D1` à `D41` des documents F2 à F6.

| # | Question | Décision |
|---|---|---|
| F1-D1 | Quels droits de création au POC ? | **Réservés au responsable de domaine**, qui crée produits et projets puis désigne les contributeurs. Cette décision remplace la version initiale de ce document, qui ouvrait la création à tous ; elle est détaillée en F2 §3 et D9. |
| F1-D2 | Le commanditaire côté entité a-t-il accès à Vision ? | Non au POC. La page projet est conçue lisible par lui, sans lui ouvrir l'accès. |
| F1-D3 | Un projet peut-il être archivé ou supprimé ? | Archivé, jamais supprimé. Un projet terminé reste consultable : c'est la mémoire du centre. |
| F1-D4 | Le critère de succès n°3 est-il mesurable au POC ? | À l'usage, par entretien. Pas d'instrumentation dans le produit. |
