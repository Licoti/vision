# ETAT — Vision

Fichier de contexte de session. Mis à jour par Claude en fin de chaque ticket.

**Dernière mise à jour :** T1.2 terminé
**Chantier en cours :** C1 — Socle technique
**Ticket en cours :** aucun — prochain à lancer : T1.3 (couche d'accès scopée)

---

## Avancement

| Chantier | Tickets | État |
|---|---|---|
| C1 — Socle technique | T1.1 → T1.6 | en cours — T1.1, T1.2 faits |
| C2 — Produits et projets | T2.1 → T2.6 | à faire |
| C3 — Activités et roadmap | à découper | à faire |
| C4 — Ressources et résultats | à découper | à faire |
| C5 — Indicateurs et temps long | à découper | à faire |
| C6 — Liens et journal | à découper | à faire |
| C7 — Finitions, budget, SSO | à découper | à faire |

**Point de bascule :** C1 à C3 constituent le POC minimal démontrable.

---

## Journal des tickets

*(une ligne par ticket terminé : identifiant, date, écarts éventuels)*

- **T1.1 — 11/08/2026 — initialisation du projet.** Next 16.3 · React 19.2 · Tailwind 4.3 ·
  TypeScript strict · Netlify. Les 100 primitives de couleur et les 77 tokens sémantiques du
  design system sont vérifiés un à un contre le document, zéro écart. Deux écarts de périmètre,
  tous deux assumés et consignés au journal technique : les quatre couleurs d'aires thérapeutiques
  Servier ne sont pas traduites, et `next dev` a dû être bridé pour cesser d'écrire dans
  `CLAUDE.md`.
- **T1.2 — 12/08/2026 — schéma de la base de données.** Les 23 tables de `docs/04` en une
  migration, appliquée sur la base Neon. 22 tables portent un `domain_id` non nul avec clé
  étrangère vers `domains` — seule `domains` n'en a pas, par nature. 75 clés étrangères,
  15 types énumérés, 7 contraintes `CHECK`, 76 index. Les rejets ont été éprouvés en base, pas
  seulement déclarés : 7 écritures illégales sur 7 refusées. Écart assumé et consigné : le
  `domain_id` a été ajouté sur les tables de liaison, que le document ne détaille pas.

---

## Points ouverts

- **Pas de tokens d'élévation ni de gradient.** Le design system les nomme sans leur donner de
  valeur. Rien n'a été inventé. La question se posera au premier composant qui porte une ombre —
  panneau latéral (C3) ou modale.
- **Couleur du corps de texte.** Les maquettes utilisent `#33333b` (greyscale-800) pour le texte
  courant ; aucun token sémantique du §2.4 ne pointe cette nuance. À trancher en T1.6.
- **Deux règles d'intégrité restent à la charge du code.** Un résultat ne doit se rattacher qu'à
  une activité `done`, et toute écriture d'activité doit recalculer `projects.last_activity_at`.
  Ni l'une ni l'autre ne tient dans une contrainte de table. **À traiter en T1.3**, dans la couche
  d'écriture — c'est le seul endroit qui peut encore les garantir.
- **Le secret Neon a transité en clair dans la conversation** du 12/08/2026. Il n'est que dans
  `.env.local`, hors dépôt, mais à faire tourner si ce transcript quitte le poste.

---

## Rappels de contexte

- Modèle : **Opus pour C1**, Sonnet à partir de C2.
- L'authentification est un stub jusqu'en C7, mais le contexte de session a sa forme finale.
- Les maquettes `docs/design/maquettes/` sont une référence visuelle, jamais branchées.
