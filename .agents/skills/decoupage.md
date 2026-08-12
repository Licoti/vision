---
description: Découpe un chantier en tickets. Session dédiée, aucun code écrit.
---

<!-- Emplacement : .agents/skills/decoupage.md — devient /decoupage dans le TUI. -->

Session de découpage du chantier **{{args}}**. **Aucun code n'est écrit dans cette session.**

Attache : `@CLAUDE.md`, `@ETAT.md`, `@tickets-C1-C2.md`, `@docs/05-perimetre.md`,
`@docs/03-accompagnement.md`, `@docs/06-architecture-info.md`.

Lis aussi la forme réelle du code livré en C1 et C2 avant de découper — composants de base, couche
d'accès `lib/db/scoped.ts`, pages existantes. Les frontières de tickets doivent épouser le code qui
existe, pas un code imaginé.

Produis `tickets-{{args}}.md` en reprenant **exactement** le format de `tickets-C1-C2.md` : pour
chaque ticket, un identifiant, un objectif en une phrase, un périmètre de fichiers, un attendu, un
critère de validation vérifiable, et des interdits.

Contraintes :

- Des tickets de trente à soixante minutes.
- Chacun se termine par quelque chose de vérifiable, mesurable de préférence.
- L'ordre doit permettre d'éprouver le geste de saisie d'activité le plus tôt possible.
- Les points ouverts d'`ETAT.md` qui désignent ce chantier doivent être rattachés à un ticket
  précis, ou explicitement renvoyés plus loin. Aucun ne reste orphelin.

**Le découpage ne crée aucun périmètre.** Tu redistribues ce que `docs/05-perimetre.md` liste pour
ce chantier, rien de plus. Si tu penses qu'un élément manque, tu l'écris dans
`JOURNAL-TECHNIQUE.md` au lieu de l'ajouter aux tickets.

Présente-moi la liste des tickets et leur ordre **avant** d'écrire le fichier.
