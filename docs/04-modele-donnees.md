# F4 — Modèle de données

**Produit :** Vision
**Statut :** v0.1 — à valider
**Dépend de :** F2 — Concepts et glossaire, F3 — Modèle d'accompagnement
**Alimente :** F5 — Périmètre du POC, et les chantiers de développement
**Ne sera pas transmis à Claude Design.**

Ce document décrit les objets persistés, leurs champs et les règles qui les gouvernent. Il ne
prescrit ni base de données, ni framework, ni ORM : ces choix relèvent de l'implémentation.

---

## 1. Principes structurants

**Le domaine est la frontière absolue.** Toute table métier porte un `domain_id`. Aucune requête
applicative ne s'exécute sans filtre de domaine. Ce filtrage doit être garanti au niveau le plus
bas possible — politique de sécurité en base ou couche d'accès unique — et non laissé à la
discipline de chaque requête.

**Les référentiels sont des données.** Entités, métiers, statuts, types d'activité, approches,
outils : autant de tables rattachées à un domaine, alimentées à sa création. Aucune de ces listes
n'est une énumération figée dans le code.

**Les libellés changent, la logique non.** Un référentiel dont le code a besoin pour raisonner
porte un champ `nature`, choisi dans un ensemble fixe et court. Le libellé est modifiable par le
domaine, la nature ne l'est pas. Sans cette séparation, renommer « En cours » en « Actif »
casserait le produit.

**Rien ne se supprime.** Archivage systématique via `archived_at`. Un projet terminé, une activité
annulée, un produit abandonné restent la mémoire du centre.

**Le modèle prévoit l'API dès maintenant.** Les résultats d'audit sont saisis à la main au POC
(D15), mais leurs champs de provenance et de synchronisation existent dès la première version.
Les ajouter plus tard imposerait une reprise de données.

**Conventions.** Identifiants UUID. Tables au pluriel, champs en `snake_case`. Chaque table porte
`created_at`, `updated_at`, `created_by`. Les dates de période sont stockées en date, jamais en
horodatage.

---

## 2. Le cadre

### `domains`
| Champ | Type | Note |
|---|---|---|
| id | uuid | |
| name | texte | nom de l'entreprise cliente |
| competence_center_name | texte | libellé affiché du centre |
| status | texte | `active` · `suspended` |
| archived_at | date-heure | |

Seul le super administrateur écrit dans cette table. Créer un domaine déclenche l'amorçage de ses
référentiels par défaut.

### `persons`
| Champ | Type | Note |
|---|---|---|
| id | uuid | |
| domain_id | uuid | |
| source | texte | `directory` (annuaire) · `manual` (saisi à la main) |
| external_id | texte | identifiant annuaire, null si `manual` |
| full_name, email | texte | synchronisés si `directory`, saisis si `manual` |
| job_id | uuid → `jobs` | facultatif — une personne hors centre n'a pas de métier design |
| kind | texte | `center` (membre du centre) · `stakeholder` (côté entité) |
| has_access | booléen | peut se connecter à Vision |
| domain_role | texte | `domain_manager` · `member` — nul si `has_access` est faux |
| is_active | booléen | désactivation sans suppression |

**Être référencé et pouvoir se connecter sont deux choses distinctes** (décision D19). Une équipe
projet peut contenir un chef de projet côté entité ou un membre d'équipe qui n'aura jamais de
compte Vision : il est saisi à la main, il apparaît dans l'équipe, il ne se connecte pas.

Deux garde-fous, pour éviter que la saisie libre ne dégrade l'annuaire :
- la recherche dans l'annuaire est proposée en premier, la saisie manuelle en repli explicite ;
- une personne `manual` peut être rattachée plus tard à un compte annuaire sans perdre ses
  rattachements de projet.

### `entities`, `jobs`, `approaches`
Référentiels simples du domaine : `id`, `domain_id`, `label`, `position`, `archived_at`.

### `activity_types`
| Champ | Type | Note |
|---|---|---|
| id, domain_id, label, position | | |
| family | texte | `framing` · `research` · `design` · `evaluation` · `measurement` · `transfer` |
| produces_result | booléen | vrai pour les audits — conditionne la saisie d'un résultat |
| default_tool_id | uuid → `tools` | outil habituellement associé, facultatif |

### `project_statuses`
| Champ | Type | Note |
|---|---|---|
| id, domain_id, label, position | | |
| nature | texte | `framing` · `active` · `paused` · `done` |

La `nature` porte toute la logique applicative : ce qui compte comme actif, ce qui est terminé.

**L'archivage n'est pas un statut.** Il est porté exclusivement par `projects.archived_at`. Un
projet archivé conserve son dernier statut — « Terminé » ou « En pause » —, information qui serait
perdue si l'archivage l'écrasait. Une seule source de vérité pour un seul fait.

### `tools`
| Champ | Type | Note |
|---|---|---|
| id, domain_id, name | | Ergonome, audit d'accessibilité, portail analytics, outil budget |
| kind | texte | `audit` · `analytics` · `budget` · `other` |
| base_url | texte | racine du lien profond |
| sync_mode | texte | `manual` · `api` — `manual` au POC |
| api_config | json | vide au POC, réservé au branchement futur |

Cette table est ce qui rend le raccordement d'un nouvel outil peu coûteux : brancher l'audit
d'éco-conception consiste à ajouter une ligne, pas à écrire un module.

---

## 3. Le travail

### `products`
| Champ | Type | Note |
|---|---|---|
| id, domain_id | uuid | |
| name | texte | |
| entity_id | uuid → `entities` | |
| kind | texte | `product` · `internal` — `internal` porte les missions transverses (D10) |
| description | texte court | |
| archived_at | date-heure | |

Le statut d'accompagnement — accompagné actuellement, déjà accompagné, jamais accompagné — n'est
pas stocké : il se calcule à partir des projets rattachés.

### `projects`
| Champ | Type | Note |
|---|---|---|
| id, domain_id | uuid | |
| product_id | uuid → `products` | **obligatoire** (D4) |
| name, objective | texte | objectif en une phrase |
| sponsor | texte libre | commanditaire (D6) |
| status_id | uuid → `project_statuses` | saisi, jamais déduit |
| started_on, expected_end_on | date | fin attendue approximative |
| last_activity_at | date-heure | **dénormalisé**, recalculé à chaque écriture liée |
| archived_at | date-heure | |

Tables de liaison : `project_jobs`, `project_approaches`, et `project_members`
(`project_id`, `person_id`, `is_contributor`). Le drapeau `is_contributor` matérialise la décision
D9 : appartenir à l'équipe et avoir le droit d'écrire sont deux choses distinctes.

### `activities`
| Champ | Type | Note |
|---|---|---|
| id, domain_id, project_id | uuid | rattachement projet unique |
| activity_type_id | uuid → `activity_types` | **obligatoire** (D16) |
| approach_id | uuid → `approaches` | facultatif, cardinalité 1 (D12) |
| objective | texte court | facultatif, fortement encouragé |
| state | texte | `planned` · `in_progress` · `done` · `cancelled` |
| period_start, period_end | date | granularité mois (D13), null autorisé |
| is_unscheduled | booléen | groupe « à planifier » (D14) |
| cancellation_reason | texte court | |

Table de liaison `activity_participants` (`activity_id`, `person_id`).

Règles d'intégrité :
- une activité `done` exige une `period_end` ;
- une activité `planned` exige une période **ou** `is_unscheduled = vrai` ;
- un résultat ne se rattache qu'à une activité `done` ;
- l'écriture d'une activité recalcule `projects.last_activity_at`.

---

## 4. Les traces

### `resources`
| Champ | Type | Note |
|---|---|---|
| id, domain_id, project_id | uuid | |
| activity_id | uuid | facultatif — rattachement à l'activité productrice |
| title, url | texte | jamais de fichier stocké |
| resource_type | texte | **saisi** au POC : `powerpoint` · `word` · `excel` · `pdf` · `figma` · `sharepoint` · `link` |
| source_updated_at | date-heure | date de mise à jour côté source, si connue |

### `results`
| Champ | Type | Note |
|---|---|---|
| id, domain_id, activity_id | uuid | un résultat pour une activité au plus |
| label, value, unit | texte / décimal / texte | contrat unique de F2 |
| measured_on | date | |
| tool_id | uuid → `tools` | |
| external_url | texte | lien profond vers le rapport |
| external_ref | texte | identifiant du rapport dans l'outil source |
| sync_mode, synced_at | texte / date-heure | `manual` au POC, `api` à terme |

`external_ref` et `synced_at` ne servent à rien aujourd'hui. Ils évitent une migration le jour où
Ergonome exposera son API.

### `indicators` — portés par le produit
| Champ | Type | Note |
|---|---|---|
| id, domain_id, product_id | uuid | |
| label, unit | texte | |
| direction | texte | `higher_is_better` · `lower_is_better` — indispensable pour lire une courbe |
| source | texte | portail analytics, outil métier |

### `indicator_readings`
`id`, `indicator_id`, `value`, `read_on` (date obligatoire), `source_note`, `created_by`.

Un relevé sans date n'est pas persisté : il serait inaffichable sur la frise produit (F3).

### `project_indicators` — l'adoption
| Champ | Type | Note |
|---|---|---|
| project_id, indicator_id | uuid | |
| baseline_value, target_value, final_value | décimal | valeur de départ, cible, valeur à la clôture |
| note | texte court | |

C'est cette table qui relie l'accompagnement à son effet supposé. Elle ne calcule rien : *Vision
juxtapose, elle ne prouve pas.*

### `budgets`
`project_id` (unique), `allocated`, `consumed`, `unit` (`days` au POC), `measured_on`,
`tool_id`, `external_url`.

### `project_links` — liens déclarés
`from_project_id`, `to_project_id`, `reason` (texte court), `created_by`. Lien orienté mais
affiché des deux côtés.

### `events` — le journal
| Champ | Type | Note |
|---|---|---|
| id, domain_id | uuid | |
| project_id | uuid | null pour les événements de niveau produit ou domaine |
| product_id | uuid | facultatif |
| actor_id | uuid → `persons` | |
| verb | texte | `created` · `updated` · `state_changed` · `linked` · `archived` |
| target_type, target_id | texte / uuid | `project` · `activity` · `resource` · `result` · `indicator_reading` · `member` |
| summary | texte court | phrase lisible, figée à l'écriture |
| occurred_at | date-heure | |

Journal léger, en écriture seule, alimenté par la couche d'accès. Il sert à afficher une frise du
type « qui a fait quoi et quand » sur la page projet, et à nourrir un flux d'activité récente dans
la vue globale.

**Attention au vocabulaire.** `activities` et `events` désignent deux choses radicalement
différentes : une **activité** est un fait d'accompagnement du centre — un atelier, un audit — ;
un **événement** est une trace système — quelqu'un a modifié quelque chose. En français, on dit
**activité** et **journal**. Les confondre dans le code ou dans l'interface produirait une page
projet incompréhensible.

Ce que le journal n'est pas : un historique complet permettant de restaurer un état antérieur.
`summary` est figé à l'écriture, on ne stocke ni valeur avant, ni valeur après.

---

## 5. Les liens déduits

Ils ne sont pas stockés. Ce sont des requêtes, exécutées à l'affichage, ordonnées par force :

| Règle | Force |
|---|---|
| Même produit | forte — accompagnements successifs du même objet |
| Personnes en commun (≥ 2) | moyenne |
| Même entité | faible |
| Approches communes | faible |

Ne rien stocker garantit que ces liens sont toujours vrais. À l'échelle du POC — quinze projets —
le coût de calcul est négligeable.

---

## 6. Points de vigilance pour l'implémentation

**Le filtrage par domaine ne doit pas être facultatif.** C'est la seule faille qui, en
multi-domaine, causerait une fuite de données entre entreprises. Une couche d'accès unique, testée,
vaut mieux qu'une convention respectée par habitude.

**`last_activity_at` est dénormalisé volontairement.** Le recalcul systématique à l'affichage
d'une liste serait coûteux et fragile. Le champ doit être remis à jour par la couche d'écriture,
jamais à la main.

**L'amorçage d'un domaine est un chantier à part entière.** Créer un domaine implique de créer ses
entités, métiers, statuts, types d'activité, approches et outils. Tant que ce chantier n'est pas
fait, le multi-domaine reste théorique.

**La synchronisation annuaire est en lecture seule.** Vision ne crée jamais de personne : elle
importe et désactive.

---

## 7. Ce qui n'existe pas dans le modèle

Tâches, dépendances, charges, temps passé, sous-activités, modèles de projet, constats d'audit,
fiches, notifications. Chacune de ces absences découle d'une décision documentée en F1, F2 ou F3.

L'historique se limite au journal `events` décrit plus haut : une trace lisible, pas un
versionnement. Restaurer un état antérieur, comparer deux versions ou reconstituer un champ
modifié restent hors périmètre.

---

## 8. Décisions tranchées

| # | Question | Décision |
|---|---|---|
| D19 | Une personne peut-elle figurer dans une équipe sans compte Vision ? | **Oui.** Une personne référencée n'est pas nécessairement un utilisateur : `source = manual`, `has_access = faux`. L'annuaire reste proposé en premier. |
| D20 | Un projet peut-il changer de produit ? | **Oui**, par un responsable de domaine. Cas rare, mais corrigeable. |
| D21 | Le type de ressource est-il saisi ou déduit ? | **Saisi** au POC. La déduction depuis l'URL viendra plus tard. |
| D22 | Conserve-t-on un journal des modifications ? | **Oui**, un journal léger `events`, affiché en frise sur la page projet. Pas de versionnement. |
| D23 | Qui saisit les indicateurs ? | **Les contributeurs du projet**, comme le reste. |
| D24 | Un produit peut-il changer d'entité ? | **Oui.** Cas rare, mais les réorganisations existent. |

---

## 9. Réservé aux évolutions

**Un thème par domaine.** À terme, chaque domaine doit pouvoir porter sa propre charte graphique.
Aucune table n'est nécessaire au POC, mais deux règles s'imposent dès maintenant côté
implémentation : les valeurs visuelles — couleurs, typographies, rayons, espacements — passent
exclusivement par des variables de thème, et aucune valeur brute n'est écrite dans un composant.
Un thème deviendra alors un enregistrement rattaché au domaine, sans refonte du front.

**Indicateur transverse à plusieurs produits** (voir F2, section 10). L'indicateur est déjà un
objet à part entière : le passage à un rattachement multiple se fera par une table de liaison,
sans déplacer les relevés.

**Synchronisation des résultats d'audit par API.** Les champs sont déjà là (`external_ref`,
`sync_mode`, `synced_at`) ; le chantier consistera à écrire les connecteurs, pas à migrer.

**Rattachement d'une personne saisie à la main à un compte annuaire**, le jour où elle en obtient
un — sans perdre ses rattachements de projet.
