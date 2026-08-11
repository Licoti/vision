# F5 — Périmètre du POC et chantiers

**Produit :** Vision
**Statut :** v0.1 — à valider
**Dépend de :** F1 à F4
**Alimente :** F6 — Architecture de l'information, et le `CLAUDE.md`

Ce document tranche ce que le POC contient et ce qu'il ne contient pas. Il sert de référence
opposable : une demande hors périmètre n'est pas refusée, elle est datée.

---

## 1. Ce que le POC doit prouver

Rappel de F1, section 7. Le POC réussit si les contributeurs y reviennent sans qu'on le leur
demande, si un responsable peut décrire l'activité du centre à partir de Vision seule, si au moins
une réutilisation entre projets a été déclenchée, et si les pages projet restent à jour sans
relance.

Tout ce qui ne sert pas directement à tester ces quatre points est reportable.

---

## 2. La boucle minimale

Un contributeur ouvre Vision, trouve son projet, saisit l'activité qu'il vient de terminer,
attache le lien de sa restitution, et repart. Un responsable ouvre la vue globale et voit
l'activité du centre du mois écoulé.

Cette boucle tient en quatre écrans. Tout le reste du POC gravite autour d'elle.

---

## 3. Périmètre retenu

### Socle

| Élément | Contenu |
|---|---|
| Domaine unique | Un domaine amorcé avec ses référentiels. Pas d'interface d'administration : amorçage par script. |
| Authentification | SSO de l'entreprise. Rôles `domain_manager` et `member`. |
| Annuaire | Import des personnes du centre. Saisie manuelle possible pour les personnes sans compte. |
| Référentiels | Entités, métiers, statuts, types d'activité, approches, outils — en base, modifiables par un responsable de domaine via un écran sommaire. |

### Fonctionnalités

| Fonctionnalité | Périmètre POC |
|---|---|
| Vue globale des projets | Liste avec recherche et filtres entité, métier, approche, statut. Tri par activité récente. |
| Vue des produits | Liste simple avec entité, nombre d'accompagnements, dernière activité. |
| Page produit — socle | Informations du produit, liste des accompagnements successifs avec leur période et leur statut, accès aux projets. |
| Page produit — temps long | Frise juxtaposant les accompagnements et les courbes d'indicateurs. |
| Création et édition de projet | Par un responsable de domaine. Désignation des contributeurs. |
| Page projet | Informations, équipe, roadmap des activités, ressources, indicateurs adoptés, budget, projets liés, journal. |
| Activités | Création, édition, changement d'état, groupe « à planifier ». |
| Résultats d'audit | Saisie déclarative : libellé, valeur, unité, date, lien vers l'outil. |
| Ressources | Lien, titre, type saisi, rattachement facultatif à une activité. |
| Indicateurs | Création au niveau produit, relevés datés, adoption par un projet avec référence et cible. |
| Budget | Saisie de l'alloué et du consommé, avec lien vers l'outil. |
| Liens entre projets | Liens déduits affichés, liens déclarés saisissables. |
| Journal | Frise des événements sur la page projet, flux récent en vue globale. |

---

## 4. Hors périmètre du POC

Chaque exclusion renvoie à sa justification.

| Exclu | Justification |
|---|---|
| Bibliothèque de fiches | Encore en conception. Sera branchée sur les outils d'audit, pas sur Vision. |
| Graphe de relations entre projets | Sans valeur à quinze projets ; les liens déduits suffisent (F1, principe de simplicité). |
| Intégration API des outils d'audit | Niveau déclaratif retenu (D15). Les champs sont prêts. |
| Synchronisation SharePoint des métadonnées | Le lien suffit. La synchronisation demande des autorisations Graph longues à obtenir. |
| Interface d'administration multi-domaine | Un seul domaine au POC. Amorçage par script. |
| Thème par domaine | Un seul design system (F4, section 9). Le front doit néanmoins être théminé par variables dès le départ. |
| Accès des commanditaires côté entité | Décidé en F1 (D2). La page projet est conçue lisible par eux, sans leur être ouverte. |
| Notifications et relances | Contraire au principe « Vision montre le fait, elle ne harcèle pas » (F3, section 8). |
| Exports et rapports | À réévaluer après le POC, en fonction de ce que les responsables demandent réellement. |
| Recherche plein texte avancée | Une recherche sur les noms et objectifs suffit à quinze projets. |
| Application mobile | Usage de bureau. Le web doit rester lisible sur mobile, sans plus. |
| Versionnement, restauration, comparaison | Le journal `events` est une trace, pas un historique (D22). |
| Indicateur transverse à plusieurs produits | Consigné en évolution (F2, section 10). |

---

## 5. Découpage en chantiers

Sept chantiers, séquencés pour qu'un incrément soit démontrable le plus tôt possible. Chaque
chantier est autonome, testable, et se termine par quelque chose de visible.

**C1 — Socle technique.** Projet, base, authentification SSO, modèle de domaine, filtrage
systématique par domaine, amorçage des référentiels, import annuaire. Rien de visible, tout le
reste en dépend. C'est le chantier où le filtrage par domaine doit être testé, pas seulement écrit.

**C2 — Produits et projets.** Tables, création et édition, liste des produits, **page produit dans
sa version socle** — informations et liste des accompagnements —, liste des projets avec filtres,
page projet réduite aux informations et à l'équipe. Premier incrément démontrable. Le produit
étant le parent obligatoire du projet, sa page est un nœud de navigation, pas une fonctionnalité
optionnelle.

**C3 — Activités et roadmap.** Types d'activité, cycle de vie, groupe « à planifier », frise du
projet. C'est le cœur du produit : il mérite d'être livré seul et éprouvé avant la suite.

**C4 — Ressources et résultats.** Rattachement au projet et à l'activité, saisie déclarative des
résultats d'audit, liens vers les outils.

**C5 — Indicateurs et lecture dans le temps.** Indicateurs, relevés datés, adoption par un projet
avec référence et cible, et enrichissement de la page produit par la frise juxtaposant
accompagnements et courbes. C'est le chantier qui répond à la question de l'effet dans le temps.

**C6 — Liens et journal.** Liens déduits, liens déclarés, journal `events`, flux d'activité récente
en vue globale.

**C7 — Finitions.** Budget, écran de gestion des référentiels, états vides, accessibilité,
comportement sur petits écrans.

### Point de bascule

**C1 à C3 constituent le POC minimal démontrable.** Si l'adoption ne prend pas à ce stade, C4 à C7
ne la sauveront pas. C'est le moment naturel pour une première mise entre les mains de l'équipe.

---

## 6. Règles de conduite pour le développement

**Un chantier à la fois, fermé avant d'ouvrir le suivant.** Le modèle de données peut être créé en
une fois ; les fonctionnalités, non.

**Aucune fonctionnalité hors périmètre, même si elle paraît triviale.** Les ajouts « pendant qu'on
y est » sont le mécanisme par lequel un POC devient un produit à moitié fini.

**Le thème passe par des variables dès C1.** Aucune couleur, taille ou espacement écrit en dur
dans un composant, même en attendant le multi-domaine.

**Les états vides sont traités comme des écrans à part entière**, pas comme un cas d'erreur. Au
démarrage, la totalité de Vision sera vide : c'est la première impression du produit.

**Les données factices ne sont pas des données de test.** Le jeu d'amorçage — deux ou trois
projets réalistes, avec de vrais libellés, répartis sur un ou deux produits — sert à la
démonstration et doit être maintenu à jour avec le modèle. Il reste volontairement réduit : les
projets réels le remplaceront vite, et un jeu volumineux donnerait une fausse impression de
maturité.

---

## 7. Ce qu'on observera pendant le POC

Quatre signaux, à relever sans instrumentation particulière :

1. **Le délai de saisie d'une activité.** S'il dépasse une minute en pratique, la roadmap se videra.
2. **La proportion de projets dont la dernière activité date de plus d'un mois.** C'est le
   thermomètre de la fraîcheur.
3. **Les demandes spontanées.** Ce que les gens réclament après deux semaines est plus fiable que
   toute liste de fonctionnalités écrite avant.
4. **Le vocabulaire employé à l'oral.** Si l'équipe dit « projet » et « activité » comme Vision les
   définit, le modèle est juste. Si elle dit autre chose, il faut corriger F2.

---

## 8. Décisions tranchées

| # | Question | Décision |
|---|---|---|
| D25 | La gestion des référentiels a-t-elle un écran au POC ? | **Oui**, sommaire, en C7. |
| D26 | La page produit entre-t-elle dans le POC minimal ? | **Oui, dans sa version socle**, dès C2 : le produit étant le parent obligatoire du projet, sa page est un nœud de navigation. Seule la couche « temps long » — indicateurs et frise — attend C5. |
| D27 | Quel jeu de données au démarrage ? | **Deux ou trois projets factices**, plus la saisie réelle en parallèle dès C2. |
| D28 | Le budget reste-t-il dans le POC ? | **Oui**, en dernier (C7). |
