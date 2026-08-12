# Journal technique

Pièges rencontrés, contournements, dettes assumées, désaccords avec une décision.
Une entrée par ligne, préfixée de l'identifiant du ticket.

**T1.1 — `next dev` écrit dans `CLAUDE.md`.** Next 16 ajoute de lui-même un bloc
`nextjs-agent-rules` en fin de `CLAUDE.md` à chaque démarrage du serveur de développement. C'est
une violation directe de la règle 7. Le fichier a été restauré et `agentRules: false` posé dans
`next.config.ts`. **À savoir pour toute montée de version de Next** : si le drapeau change de nom,
le bloc reviendra silencieusement.

**T1.1 — Couleurs d'aires thérapeutiques écartées.** Les familles burgundy, lime, lavender et teal
du §1.9 du design system ne sont pas traduites : elles qualifient des aires thérapeutiques Servier,
sans usage identifiable dans Vision. Purple est conservée, elle porte `content/visited`. Décision
prise en session avec l'humain ; à rouvrir si un usage apparaît.

**T1.1 — `border-width/2` vaut 3px dans le design system.** Le §6 donne `border-width/0: 0`,
`/1: 1px`, `/2: 3px`, `/4: 4px`. La valeur de `/2` est très probablement une coquille pour 2px,
mais le document fait autorité sur les valeurs visuelles : traduit tel quel, sans correction.

**T1.1 — Élévations et gradients non traduits.** Les §8 et §9 nomment trois élévations
(`resting`, `raised`, `floating`) et deux gradients Servier, sans donner aucune valeur. Rien n'a
été inventé, et le namespace `--shadow-*` de Tailwind est effacé plutôt que meublé. Le premier
composant qui a besoin d'une ombre — le panneau latéral de C3, probablement — devra faire remonter
la question plutôt que d'écrire une ombre à la main.

**T1.1 — Les raccourcis des maquettes ne sont pas reproduits.** `vision.html` déclare une
quinzaine de variables courtes (`--c-primary`, `--c-ink`, `--c-line`…). Elles sont un
sous-ensemble de la couche sémantique et n'ont pas été reprises : `design-system.md` fait autorité,
et deux vocabulaires concurrents se seraient mélangés dans le code.

**T1.1 — Divergence maquette / design system sur les bordures et le corps de texte.** Les
maquettes bordent les cartes en `#ebebf0` (greyscale-150) alors que `border/default` vaut `#f7f7f8`
(greyscale-100), et écrivent le corps de texte en `#33333b` (greyscale-800), nuance qu'aucun token
sémantique du §2.4 ne désigne. Aucun arbitrage n'a été rendu en T1.1, qui ne pose aucun composant.
À trancher en T1.6, au moment où les gabarits arrivent.

**T1.1 — Effacement des échelles Tailwind, choix structurant.** Les namespaces `--color-*`,
`--text-*`, `--font-*`, `--font-weight-*`, `--leading-*`, `--radius-*` et `--shadow-*` sont remis à
`initial` dans `globals.css` avant d'être repeuplés depuis les tokens. Conséquence voulue :
`bg-blue-500`, `text-base` ou `shadow-lg` n'existent plus. La règle 2 devient structurelle, mais
tout copier-coller depuis la documentation de Tailwind échouera — c'est le prix, et il est assumé.

**T1.1 — Collision de noms entre tokens et namespaces Tailwind.** Traduire `font-family/Primary`
en `--font-primary` produisait `--font-primary: var(--font-primary)` dans le bloc `@theme`, donc
une variable circulaire et silencieuse. Les familles sont nommées `--font-family-primary` et les
graisses exposées sous les noms usuels (`font-semibold`) plutôt que sous leur nombre. **Règle à
retenir : un token ne doit jamais porter le nom exact d'un namespace de thème Tailwind.**

**T1.2 — `domain_id` ajouté là où le document ne le liste pas.** `docs/04` ne mentionne pas de
`domain_id` sur `project_members`, `project_jobs`, `project_approaches`, `activity_participants`,
`indicator_readings`, `project_indicators`, `budgets` ni `project_links`. La colonne y a été
ajoutée, non nulle et avec clé étrangère. Sans elle, la couche d'accès de T1.3 devrait remonter au
domaine par jointure sur la table parente pour ces huit tables, et le filtrage deviendrait une
règle à géométrie variable. Le critère de validation du ticket demandait d'ailleurs des `domain_id`
« présents partout ». **Corollaire pour T1.3 : le `domain_id` d'une liaison doit être vérifié
cohérent avec celui de son parent à l'écriture** — la base ne l'impose pas.

**T1.2 — `domains` ne porte pas de `created_by`.** La convention du §1 veut ce champ sur chaque
table, mais il référencerait `persons`, elle-même scopée par domaine : un domaine serait créé par
une personne qui ne peut exister qu'après lui. Seul le super administrateur écrit dans cette
table, et il n'a pas de ligne `persons`. Le champ est omis, `created_at` et `updated_at` restent.

**T1.2 — Deux règles d'intégrité ne tiennent pas dans une contrainte de table.** « Un résultat ne
se rattache qu'à une activité `done` » traverse deux tables ; le recalcul de
`projects.last_activity_at` est un effet d'écriture. Aucun déclencheur n'a été posé — un
déclencheur est du code métier caché dans la base, invisible à la relecture du dépôt. Les deux
règles reviennent donc à la couche d'écriture de T1.3, où elles seront testables. **Tant qu'elles
n'y sont pas, rien ne les garantit.**

**T1.2 — Les contraintes ont été éprouvées, pas seulement déclarées.** Sept écritures illégales
ont été tentées sur la vraie base — domaine inexistant, activité terminée sans date de fin,
activité annulée sans motif, état hors liste, nature `archived` proscrite par D42, personne sans
accès mais avec un rôle, projet lié à lui-même. Les sept ont été refusées. Un `CHECK` mal écrit
passe la génération de migration sans broncher : le vérifier en base est le seul contrôle qui vaut.

**T1.2 — `numeric` revient en `string` côté TypeScript.** Drizzle mappe `numeric` sur `string`
pour ne pas perdre de précision. Les valeurs de `results`, `indicator_readings`,
`project_indicators` et `budgets` sont donc des chaînes à la lecture. À convertir explicitement au
moment de l'affichage, en C4 et C5 — pas de `Number()` disséminé dans les composants.

**T1.2 — `position` est un `numeric`, non un entier.** Les référentiels s'ordonnent par `position`
et seront réordonnables depuis l'écran de gestion de C7. Un décimal permet d'insérer entre deux
lignes sans réécrire toute la colonne.

**T1.2 — Le secret Neon a transité en clair dans la conversation.** La chaîne de connexion a été
collée dans le fil de discussion du 12/08/2026, puis déposée dans `.env.local`, que `.gitignore`
couvre — vérifié par `git check-ignore`. Elle n'est pas dans le dépôt, mais elle est dans un
transcript. **À faire tourner sur Neon si ce transcript sort du poste.**

**T1.1 — Épaisseurs de bordure sans utilitaire.** Tailwind 4 dérive `border-2` d'un nombre brut et
non d'un token ; `border-2` vaudrait donc 2px là où le design system dit 3px. Seul `border` (1px)
coïncide avec un token. Les autres épaisseurs s'écrivent
`border-[length:var(--border-width-2)]`. Verbeux, mais juste. Une famille d'`@utility` réglerait
la question — hors périmètre de T1.1.