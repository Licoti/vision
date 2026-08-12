# AGENTS — Vision

Fichier lu automatiquement par Antigravity CLI à chaque tour. **Il ne remplace pas `CLAUDE.md`.**

---

## Première action de toute session

Lis `@CLAUDE.md` **en entier**, avant toute autre chose, puis `@ETAT.md`.

`CLAUDE.md` est la source de vérité du projet : produit, vocabulaire, règles non négociables,
interdits d'interface, stack et conventions, lecture conditionnelle, protocole de ticket, où
écrire quoi. Ce fichier-ci ne fait qu'adapter ce protocole au harnais Antigravity.

**En cas de contradiction, `CLAUDE.md` l'emporte.** Si tu en trouves une, elle va dans
`JOURNAL-TECHNIQUE.md`.

---

## Ce que ce fichier ajoute

### Lire = attacher

La table de lecture conditionnelle de `CLAUDE.md` désigne les documents à lire. Ici, « lire »
signifie **attacher explicitement avec `@`**. Pas de lecture large de `docs/`, pas d'exploration
de répertoire : un document que la table ne désigne pas pour ce ticket n'entre pas dans la
fenêtre.

### Plan mode

L'étape 2 du protocole s'applique intégralement même sans mode dédié. Concrètement :

- Tu présentes le plan et la liste exacte des fichiers à créer ou modifier, en texte.
- Tu **n'appelles aucun outil d'écriture** avant ma réponse. Pas de fichier ouvert en écriture,
  pas de patch préparé « pour aller plus vite ».
- Tu ne considères jamais l'absence de réponse, ni une approbation d'outil, comme une validation
  de plan. La validation est une phrase de ma part.

### Sous-agents

Tu peux lancer des sous-agents à fenêtre isolée. Trois règles :

- Un sous-agent **lit et explore**. Il n'écrit pas dans le code applicatif.
- Un sous-agent hérite du périmètre de fichiers du ticket courant.
- Si le travail à déléguer déborde de ce périmètre, c'est que le ticket est mal découpé.
  Tu le consignes, tu n'élargis pas.

### Droits d'écriture

La règle 7 de `CLAUDE.md` — ne jamais écrire dans `CLAUDE.md` — vaut aussi pour `AGENTS.md`,
`.agents/` et `docs/`.

Hors code applicatif, trois fichiers seulement te sont ouverts : `ETAT.md` (étape 5),
`JOURNAL-TECHNIQUE.md` (étape 6), et `tickets-C3.md` — ce dernier en session de découpage
uniquement.

Aucun outil, aucun processus lancé par toi ne doit écrire dans `CLAUDE.md`. Si tu constates qu'un
outil de développement le modifie, tu t'arrêtes et tu le signales.

### Piqûre de rappel

Trois règles que `CLAUDE.md` détaille et qu'un harnais neuf enfreint sans bruit :

1. Aucune requête sans `domainId` — tout passe par `lib/db/scoped.ts`.
2. Aucune valeur visuelle en dur — variables de thème uniquement.
3. Aucune fonctionnalité hors du périmètre du ticket, même triviale.

Les sept règles complètes et les interdits d'interface sont dans `CLAUDE.md`. Va les lire, ne te
fie pas à ce résumé.

---

## Écarts d'outillage

C1 et C2 ont été menés sous Claude Code. C3 est mené sous Antigravity à titre d'essai.

Si une règle de `CLAUDE.md` se révèle inapplicable ou ambiguë dans ce harnais, **ne l'improvise
pas** : consigne l'écart dans `JOURNAL-TECHNIQUE.md`, sous une section « Écarts d'outillage »,
avec le ticket concerné et ce que tu as fait à la place. Ces notes décideront si C4 revient sous
Claude Code.
