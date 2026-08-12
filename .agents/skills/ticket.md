---
description: Exécute un ticket de Vision selon le protocole en huit étapes de CLAUDE.md.
---

<!-- Emplacement : .agents/skills/ticket.md — devient /ticket dans le TUI. -->

Ticket **{{args}}**.

Attache d'abord `@CLAUDE.md`, `@ETAT.md` et `@tickets-C3.md`, puis les documents de `docs/` que la
table de lecture conditionnelle désigne pour ce ticket. Rien de plus.

Applique le protocole de ticket de `CLAUDE.md`, les huit étapes, intégralement.

Rappels sur les trois étapes les plus souvent escamotées :

- **Étape 2.** Le plan et la liste exacte des fichiers sont présentés, et rien n'est écrit avant
  ma validation explicite. Tu ne prépares pas de patch pendant que tu rédiges le plan.
- **Étape 4.** Tu vérifies le critère de validation du ticket et tu **rapportes la vérification**,
  pas ton impression. Ce qui se mesure se mesure : un contraste se calcule, un rendu se lit dans
  le HTML servi, un test se met en défaut avant d'être cru.
- **Étape 8.** Tu proposes le message de commit et tu t'arrêtes. Ni commit, ni vidage de contexte.

Si le ticket te paraît mal découpé, trop large, ou dépendant de quelque chose qui n'existe pas
encore : dis-le avant l'étape 2 et propose un redécoupage. N'absorbe pas le problème en
élargissant le périmètre.
