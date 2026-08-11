# ETAT — Vision

Fichier de contexte de session. Mis à jour par Claude en fin de chaque ticket.

**Dernière mise à jour :** T1.1 terminé
**Chantier en cours :** C1 — Socle technique
**Ticket en cours :** aucun — prochain à lancer : T1.2 (base de données et schéma)

---

## Avancement

| Chantier | Tickets | État |
|---|---|---|
| C1 — Socle technique | T1.1 → T1.6 | en cours — T1.1 fait |
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

---

## Points ouverts

- **Pas de tokens d'élévation ni de gradient.** Le design system les nomme sans leur donner de
  valeur. Rien n'a été inventé. La question se posera au premier composant qui porte une ombre —
  panneau latéral (C3) ou modale.
- **Couleur du corps de texte.** Les maquettes utilisent `#33333b` (greyscale-800) pour le texte
  courant ; aucun token sémantique du §2.4 ne pointe cette nuance. À trancher en T1.6.

---

## Rappels de contexte

- Modèle : **Opus pour C1**, Sonnet à partir de C2.
- L'authentification est un stub jusqu'en C7, mais le contexte de session a sa forme finale.
- Les maquettes `docs/design/maquettes/` sont une référence visuelle, jamais branchées.
