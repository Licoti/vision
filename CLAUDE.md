# CLAUDE.md — Vision

Fichier lu à chaque session. Court par conception. Les détails vivent dans `docs/`.

---

## Le produit

Vision est une plateforme interne qui documente **comment un centre de compétence design accompagne
les produits d'une entreprise, dans le temps**.

Hiérarchie : `Domaine › Produit › Projet › Activité › Ressource / Résultat`
Un résultat porte toujours un lien profond vers l'outil externe qui l'a produit.

**Ce que Vision n'est pas** : un gestionnaire de projet, un espace de stockage de fichiers, un
outil d'audit, une plateforme d'analytics, un outil d'évaluation des personnes. Elle affiche une
synthèse et renvoie vers l'outil source.

---

## Vocabulaire — à respecter dans le code et dans l'interface

| Concept | Table | Définition |
|---|---|---|
| Domaine | `domains` | L'entreprise cliente. Frontière étanche des données. Le seul tenant. |
| Entité | `entities` | Division de l'entreprise. Qualifie les produits, ne cloisonne rien. |
| Personne | `persons` | Membre du centre ou intervenant externe. Peut exister sans compte. |
| Métier | `jobs` | Référentiel : Product Design, UX Research, UI Design… |
| Approche | `approaches` | Méthodologie : Research, Design Thinking, Lean, Audit UX… |
| Produit | `products` | L'objet durable accompagné. Rattaché à une entité. |
| Projet | `projects` | Un accompagnement daté sur un produit. Rattachement obligatoire. |
| Activité | `activities` | Un fait d'accompagnement daté : atelier, audit, campagne de tests. |
| Type d'activité | `activity_types` | Référentiel du domaine, groupé par famille. |
| Statut de projet | `project_statuses` | Référentiel du domaine, porteur d'un champ `nature`. |
| Résultat | `results` | Synthèse chiffrée produite par un outil externe + lien profond. |
| Ressource | `resources` | Un lien vers un document hébergé ailleurs. Jamais de fichier stocké. |
| Indicateur | `indicators` | Mesure du **produit**, suivie dans le temps. |
| Relevé | `indicator_readings` | Une valeur datée d'un indicateur. |
| Adoption | `project_indicators` | Un projet adopte un indicateur : référence, cible, valeur finale. |
| Budget | `budgets` | Synthèse macro par projet + lien vers l'outil de gestion. |
| Lien déclaré | `project_links` | Lien entre deux projets, avec sa raison. |
| Journal | `events` | Trace système : qui a modifié quoi, quand. |
| Outil | `tools` | Outil externe raccordé : Ergonome, accessibilité, analytics, budget. |

**Piège à ne jamais confondre** : `activities` = accompagnement métier (un atelier).
`events` = trace technique (quelqu'un a modifié un champ). Deux objets sans rapport.

Interface en français, code et base en anglais.

---

## Règles non négociables

1. **Aucune requête sans `domainId`.** Tout passe par la couche d'accès de `lib/db/scoped.ts`.
   Une requête directe hors de cette couche est un défaut, même si elle fonctionne.
2. **Aucune valeur visuelle en dur.** Couleurs, tailles, espacements, rayons : variables de thème
   uniquement. Chaque domaine devra pouvoir porter sa charte.
3. **Aucune fonctionnalité hors du périmètre du ticket en cours.** Pas d'ajout « pendant que j'y
   suis », même trivial.
4. **Aucune donnée métier ne se supprime.** Archivage par `archived_at`. Cela vaut aussi pour un
   domaine, qui se suspend ou s'archive.
5. **Les états vides sont des écrans à part entière**, jamais un cas d'erreur.
6. **Ne jamais rouvrir une décision de `docs/07-decisions.md`.** Un désaccord se consigne dans
   `JOURNAL-TECHNIQUE.md`, et le travail continue.
7. **Ne jamais écrire dans `CLAUDE.md`.**

## Interdits d'interface

Score de projet, note, niveau de maturité, taux de couverture, jauge de complétion, pourcentage
d'avancement, badge d'alerte ou de retard, notification, relance, diagramme de Gantt, dépendances
entre activités, classement de projets ou de personnes, graphique décoratif, détail des constats
d'audit, liste de tâches.

**Frontière entre chiffre autorisé et chiffre interdit :** est interdit tout indice **calculé par
Vision** pour qualifier un projet, une personne ou une entité. Est autorisée toute valeur
**reportée d'un outil externe** avec sa date et son lien — un taux de conformité d'accessibilité,
un score d'audit, un relevé d'indicateur.

**Graphiques :** interdits sur la vue d'ensemble, où l'on affiche des chiffres cliquables qui
filtrent. La courbe d'indicateurs de la page produit est en revanche attendue : elle porte une
lecture, elle ne décore pas.

Ces exclusions ne sont pas des simplifications de POC. Vision décrit une activité, elle n'évalue
personne.

---

## Stack et conventions

- Next.js (App Router) + TypeScript · Tailwind · Drizzle · PostgreSQL (Neon) · déploiement Netlify
- Tables au pluriel, `snake_case`. Identifiants UUID. `created_at`, `updated_at`, `created_by`
  partout. Périodes en `date`, jamais en horodatage.
- Authentification : **stub au POC** — sélecteur de personne courante. Le contexte de session a
  déjà sa forme finale ; Entra ID le remplacera en C7. Ne pas contourner ce contexte.
- Les maquettes de `docs/design/maquettes/` sont une **référence visuelle**, pas une base de code.
  Ne pas les brancher, ne pas les modifier.
- Références de décisions : `F1-D1` à `F1-D4` pour le cadrage, `D1` à `D41` pour la série continue
  des documents 02 à 07.

---

## Avant de coder — lecture conditionnelle

| Si le ticket touche à… | Lire d'abord |
|---|---|
| le schéma, une table, une relation | `docs/04-modele-donnees.md` |
| un écran, une navigation, un bloc | `docs/06-architecture-info.md` |
| les activités, la roadmap, les états | `docs/03-accompagnement.md` |
| un libellé, un nom de concept | `docs/02-concepts.md` |
| une question de périmètre | `docs/05-perimetre.md` |
| « pourquoi cette contrainte ? » | `docs/07-decisions.md` |

---

## Protocole de ticket

À appliquer intégralement dès qu'un ticket est annoncé, sans qu'on ait à le rappeler.

1. Lire `ETAT.md`, la fiche du ticket dans `tickets-*.md`, et les documents indiqués par la
   lecture conditionnelle ci-dessus.
2. **Plan mode.** Présenter le plan et la liste exacte des fichiers à créer ou modifier.
   N'écrire aucun fichier avant validation explicite.
3. Implémenter, strictement dans le périmètre annoncé.
4. Vérifier le critère de validation du ticket et le rapporter.
5. Mettre à jour `ETAT.md` : ticket terminé, écarts éventuels, ticket suivant.
6. Ajouter à `JOURNAL-TECHNIQUE.md` tout piège rencontré, contournement, dette assumée,
   incohérence documentaire ou désaccord avec une décision.
7. Proposer le message de commit, préfixé de l'identifiant : `T2.3 — liste des projets`.
8. S'arrêter là. Le commit et le vidage de contexte sont faits par l'humain.

## Où écrire quoi

| Fichier | Contenu | Qui écrit |
|---|---|---|
| `CLAUDE.md` | Règles stables du projet | L'humain uniquement |
| `ETAT.md` | Avancement, ticket courant, points ouverts | Claude, étape 5 |
| `JOURNAL-TECHNIQUE.md` | Pièges, contournements, dettes, désaccords | Claude, étape 6 |
| `docs/` | Fondations produit | Figé |
