# Tickets — C1 et C2

Un ticket = une session de CLI. Chaque ticket porte un objectif, un périmètre de fichiers, un
critère de validation vérifiable et ses interdits.

**Règle commune à tous les tickets :** ne modifier aucun fichier hors du périmètre annoncé, ne
créer aucune fonctionnalité non listée, mettre à jour `ETAT.md` en fin de ticket.

---

# C1 — Socle technique · **Opus**

Chantier où une erreur se paie sur toute la vie du produit.

## T1.1 — Initialisation du projet

**Objectif** — Un projet Next.js + TypeScript + Tailwind qui démarre, déployable sur Netlify, avec
les variables de thème issues du design system.

**Périmètre** — Configuration, `app/layout.tsx`, feuille de styles globale, `netlify.toml`.

**Attendu** — Les tokens du `docs/design/design-system.md` sont traduits en variables CSS. Aucune
valeur brute nulle part. Une page d'accueil vide qui prouve que la chaîne fonctionne.

**Validation** — `npm run dev` démarre ; la page affiche un texte utilisant les variables de thème ;
le build passe.

**Interdits** — Aucun composant d'interface, aucune page métier.

## T1.2 — Base de données et schéma

**Objectif** — Le schéma complet de `docs/04-modele-donnees.md` en une migration.

**Périmètre** — Connexion Neon, configuration Drizzle, `lib/db/schema.ts`, migration initiale.

**Attendu** — Toutes les tables, y compris celles qui ne serviront qu'en C5 et C6. Le schéma se
crée en une fois ; les fonctionnalités arrivent progressivement.

**Validation** — La migration s'applique sur une base Neon vierge ; les contraintes de clés
étrangères et les `domain_id` sont présents partout.

**Interdits** — Aucune requête applicative, aucun écran.

## T1.3 — Couche d'accès scopée

**Objectif** — Rendre structurellement impossible une requête sans domaine.

**Périmètre** — `lib/db/scoped.ts`, tests associés.

**Attendu** — Toute lecture et écriture passe par une fonction exigeant un `domainId`. Des tests
vérifient qu'une requête portant un mauvais domaine ne retourne rien.

**Validation** — Les tests passent, y compris un test de fuite inter-domaines avec deux domaines
de test.

**Interdits** — Aucun contournement « temporaire » pour l'amorçage. Le script d'amorçage utilise
la même couche.

## T1.4 — Contexte de session (stub)

**Objectif** — Un utilisateur courant disponible partout, sous la forme définitive.

**Périmètre** — `lib/auth/session.ts`, sélecteur de personne en développement.

**Attendu** — Le contexte expose `person`, `domainId`, `role`, et les droits d'écriture. Un
sélecteur permet de basculer entre un responsable de domaine, un contributeur et un simple membre.
Le remplacement par Entra ID en C7 ne doit toucher que le fournisseur.

**Validation** — Le basculement d'utilisateur change les droits observables.

**Interdits** — Aucun appel à Entra ID, aucune page de connexion.

## T1.5 — Référentiels et données factices

**Objectif** — Un domaine amorcé, exploitable pour la démonstration.

**Périmètre** — `scripts/seed.ts`.

**Attendu** — Entités, métiers, statuts avec leur `nature`, types d'activité avec leur famille,
approches, outils. Puis les données factices du `brief-design.md` — deux produits, trois projets,
leurs activités, un indicateur et ses trois relevés.

**Validation** — Le script est rejouable sans doublon ; les données correspondent au brief.

**Interdits** — Aucune donnée inventée hors du brief.

## T1.6 — Coquille applicative

**Objectif** — La navigation et les gabarits, sans contenu métier.

**Périmètre** — Layout, navigation principale, fil d'Ariane, routes vides des six écrans.

**Attendu** — Ordre de navigation : Vue d'ensemble · Produits · Projets · À propos. Fil d'Ariane
fonctionnel. Les composants de base — page, section, liste, état vide — sont posés d'après les
maquettes.

**Validation** — Chaque route répond ; la navigation clavier fonctionne ; le focus est visible.

**Interdits** — Aucune lecture en base.

---

# C2 — Produits et projets · **Sonnet**

Premier incrément démontrable.

## T2.1 — Liste des produits
Nom, entité, nombre d'accompagnements, dernière activité. Filtrage par entité. État vide traité.
**Validation** — Les deux produits factices s'affichent avec leur compte exact.

## T2.2 — Page produit, version socle
En-tête produit, puis liste des accompagnements successifs du plus récent au plus ancien : période,
statut, objectif, équipe. **Aucun indicateur, aucune frise** — c'est C5.
**Validation** — Les deux projets de l'espace client apparaissent dans le bon ordre.

## T2.3 — Liste transverse des projets
Liste dense, filtres entité, métier, approche, statut, recherche sur nom, objectif et membres.
Produit de rattachement affiché et cliquable. Tri par activité récente.
**Validation** — Les filtres se combinent ; le compteur est juste ; le retrait des filtres est en
un geste.

## T2.4 — Page projet, en-tête et équipe
Identité, fil d'Ariane, statut, période, objectif, entité, commanditaire, approches, équipe, et la
mention cliquable « 2ᵉ accompagnement de ce produit ». Les autres blocs restent des états vides
annoncés.
**Validation** — Le rang d'accompagnement est calculé, non saisi.

## T2.5 — Création et édition d'un produit
Réservée au responsable de domaine. Nom, entité, description, type `product` ou `internal`.
**Validation** — Un contributeur ne voit pas l'action.

## T2.6 — Création et édition d'un projet
Réservée au responsable de domaine. Produit obligatoire, nom, objectif, entité déduite du produit,
métiers, approches, statut, période, commanditaire, désignation des contributeurs. Les personnes
viennent de la liste existante, avec ajout manuel possible.
**Validation** — Un projet créé apparaît immédiatement sur sa page produit et dans la liste
transverse.
