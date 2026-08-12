# ETAT — Vision

Fichier de contexte de session. Mis à jour par Claude en fin de chaque ticket.

**Dernière mise à jour :** T1.5 terminé
**Chantier en cours :** C1 — Socle technique
**Ticket en cours :** aucun — prochain à lancer : T1.6 (coquille applicative)

---

## Avancement

| Chantier | Tickets | État |
|---|---|---|
| C1 — Socle technique | T1.1 → T1.6 | en cours — T1.1 à T1.5 faits |
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
- **T1.3 — 12/08/2026 — couche d'accès scopée.** `lib/db/scoped.ts` est le seul module qui importe
  `db`, vérifié par `grep`. 15 tests passent sur une branche Neon dédiée. Les tests ne se contentent
  pas de passer : le filtre de domaine a été neutralisé pour voir tomber 9 tests sur 15, et les deux
  règles d'intégrité pour en voir tomber exactement 3. Les trois dettes ouvertes par T1.2 sont
  refermées : résultat sur activité `done`, recalcul de `last_activity_at`, cohérence du `domain_id`
  avec les parents — cette dernière **dérivée des clés étrangères du schéma**, pas d'une liste
  écrite à la main. Écarts de périmètre, tous consignés au journal : la mise en place de Vitest
  (dépendance, `vitest.config.mts`, script `test`, `.env.example`), sans laquelle « tests associés »
  n'a pas de sens.
- **T1.4 — 12/08/2026 — contexte de session (stub).** `lib/auth/session.ts` porte la forme
  définitive — `person`, `domain`, `domainId`, `role`, `can`, et la couche d'accès déjà scopée sur
  le couple domaine/personne, si bien qu'une écriture porte son `created_by` sans que l'appelant y
  pense. La source d'identité est isolée dans `lib/auth/provider.ts`, **le seul fichier que C7
  réécrit** : `session.ts` n'importe rien de Next, le fournisseur appelle le contexte et jamais
  l'inverse. 19 tests s'ajoutent aux 15 de T1.3, et ils ont été mis en défaut avant d'être crus :
  `manageDomain` neutralisé fait tomber exactement les 4 tests du responsable, le filtre
  `is_contributor` inversé exactement les 2 tests du contributeur. La bascule a aussi été observée
  peuplée sur la branche de test, formulaire soumis sans JavaScript. Deux écarts assumés et
  consignés au journal : le responsable de domaine écrit sur tous les projets — arbitrage sur un
  silence de D9 —, et les tests eux-mêmes, que le périmètre du ticket ne mentionnait pas.
- **T1.5 — 12/08/2026 — référentiels et données factices.** `scripts/seed.ts` amorce
  « Groupe Meridian » : 142 lignes sur 20 tables, dont les six référentiels — 5 entités, 6 métiers,
  7 approches, 4 statuts avec leur `nature`, 4 outils, 25 types d'activité en 6 familles — puis les
  données du brief : 2 produits, 3 projets, 12 activités, 2 résultats, 1 ressource, 1 indicateur,
  3 relevés, 1 adoption. **Le critère est tenu et vérifié en base** : la seconde exécution ne crée
  ni ne met à jour aucune ligne, et les comptes relus par la couche scopée correspondent un à un à
  la fixture. Le rapprochement se fait par clé naturelle, pas par identifiant, et les valeurs
  `numeric` sont normalisées avant comparaison — sans quoi le script réécrivait les mêmes lignes à
  chaque passage. `/dev/session` sert désormais sept comptes ; Marc Tellier, sans compte Vision,
  n'y figure pas, et la portée d'écriture d'un contributeur se limite bien à son projet. Écarts
  assumés et consignés : `tsx` déclaré pour pouvoir lancer un `.ts` (il était déjà là en dépendance
  transitive) ; un 25ᵉ type d'activité, « Atelier de priorisation », que le brief nomme et que
  `docs/03` n'a pas ; trois inventions hors brief — un responsable de domaine, les métiers, les
  participants d'activité —, chacune motivée par un critère de validation à venir.

---

## Points ouverts

- **Pas de tokens d'élévation ni de gradient.** Le design system les nomme sans leur donner de
  valeur. Rien n'a été inventé. La question se posera au premier composant qui porte une ombre —
  panneau latéral (C3) ou modale.
- **Couleur du corps de texte.** Les maquettes utilisent `#33333b` (greyscale-800) pour le texte
  courant ; aucun token sémantique du §2.4 ne pointe cette nuance. À trancher en T1.6.
- **`last_activity_at` compte les activités prévues, et se pose donc dans le futur.** T1.3 avait
  retenu `max(coalesce(period_end, period_start))` sur les activités non archivées et non annulées,
  faute de définition dans `docs/04` §6. T1.5 rend l'effet visible : deux projets sur trois portent
  une date à venir, celle d'un audit **prévu**. `docs/03` §8 veut pourtant que ce champ dise
  « depuis quand un projet n'a pas bougé ». Ce n'est plus une interprétation à confirmer mais un
  écart constaté. **À trancher en C2**, avec le tri « par activité récente » de T2.3.
- **Rien n'empêche techniquement un import direct de `lib/db/client`.** Le verrou ESLint a été
  écarté du périmètre de T1.3. La règle 1 tient aujourd'hui par la convention, l'en-tête de
  `client.ts` et un `grep`. À reposer si un import sauvage apparaît.
- **Les tables de liaison se suppriment pour de bon.** Elles ne portent pas d'`archived_at` : la
  couche expose `unlink`, une vraie suppression, réservée à elles par le typage. C'est une
  conséquence de T1.2, pas un choix de T1.3. À confirmer au premier écran qui retire un membre
  d'un projet.
- **Un projet archivé est-il en lecture seule ?** Rien ne le dit dans `docs/`. T1.4 n'a pas
  tranché : un contributeur désigné d'un projet archivé garde son droit d'écriture. À régler en C2,
  avec l'écran qui archive.
- **Le domaine courant est le premier domaine actif trouvé en base.** Pas de variable
  d'environnement : `docs/05` §3 pose un domaine unique. Le jour où un second domaine existe, le
  choix devient un vrai choix et revient au fournisseur d'identité.
- **`/dev/session` est une route de développement**, rendue 404 en production. Elle disparaîtra
  avec le stub en C7. Elle n'est reliée à aucune navigation : T1.6 n'a pas à la référencer.
- **Les deux résultats factices n'ont pas de lien profond.** Le brief §7 les annonce « lien
  Ergonome » et « lien vers l'outil » sans donner d'adresse, et rien n'a été inventé. C4 devra
  traiter le résultat sans lien comme un cas normal, ou l'humain fournira les adresses. Même
  silence sur `tools.base_url` et sur les courriels des personnes.
- **Trois des quatre ressources du brief ne sont pas semées.** Seule « Restitution des tests —
  vague 2 » a un rattachement donné. « Grille d'entretien », « Maquettes v3 » et « Rapport d'audit
  d'accessibilité » attendent une ancre — projet, activité, URL — que le brief ne fournit pas.
- **Renommer un référentiel dans l'interface fera recréer la ligne au prochain amorçage.**
  L'amorçage rapproche par clé naturelle, et le libellé est cette clé. Sans conséquence tant que
  l'écran de gestion des référentiels n'existe pas ; à revoir quand il arrivera.
- **Deux secrets Neon ont transité en clair dans la conversation**, les 12/08/2026 — la base de
  développement, puis la branche de test. Ils ne sont que dans `.env.local`, hors dépôt, mais à
  faire tourner si ces transcripts quittent le poste.

---

## Rappels de contexte

- Modèle : **Opus pour C1**, Sonnet à partir de C2.
- L'authentification est un stub jusqu'en C7, mais le contexte de session a sa forme finale.
- Les maquettes `docs/design/maquettes/` sont une référence visuelle, jamais branchées.
