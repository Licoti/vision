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

**T1.3 — `Omit` derrière un alias générique perd des colonnes, en silence.**
`type InsertValues<T> = Omit<InferInsertModel<T>, "domainId" | …>` compile sans broncher, puis
rejette à l'usage des colonnes qui existent : `state`, `periodEnd`, `value`. TypeScript laisse
`Omit` non résolu tant que `T` est un paramètre, et l'instanciation ne le réveille pas. La même
expression écrite avec `typeof activities` en dur fonctionne — c'est ce qui rend le piège coûteux à
diagnostiquer. La couche utilise donc un type mappé, `X extends infer M ? { [P in keyof M as …] }`,
qui force la résolution et reste homomorphe, donc conserve les propriétés facultatives.
**Ne pas « simplifier » en `Omit`** : le code repasserait, les appels non.

**T1.3 — `neon-http` n'a pas de transaction interactive.** `db.transaction()` lève
« No transactions support in neon-http driver ». Les écritures à deux instructions — insertion
d'activité puis recalcul de `last_activity_at` — passent par `db.batch([…])`, que Neon exécute
côté serveur en une transaction unique. Conséquence pratique : un lot se construit **avant** de
partir, il ne peut donc pas dépendre du résultat de sa première instruction. C'est ce qui explique
la lecture préalable quand une activité change de projet : sans elle, l'ancien projet ne serait
jamais recalculé.

**T1.3 — Les vérifications de parent sont dérivées du schéma, pas écrites à la main.**
`getTableConfig(table).foreignKeys` donne les clés étrangères ; celles qui pointent une table
scopée deviennent une vérification d'appartenance au domaine. Une table ajoutée plus tard est
couverte sans qu'on y pense — c'est le seul moyen d'éviter une liste qui se désynchronise en
silence. **Dépendance à surveiller** : `getTableConfig` est une API publique de `drizzle-orm`, mais
son objet de retour n'est pas contractuel. Si une montée de version le change, les vérifications
disparaîtront **sans erreur de compilation** — seuls les tests le diront.

**T1.3 — Coût assumé : un aller-retour de plus par écriture.** Chaque insertion ou modification
qui porte une clé étrangère déclenche un `batch` de vérification avant d'écrire. À l'échelle du POC
— quinze projets — c'est négligeable. À l'échelle d'un amorçage massif, ce ne le serait pas.

**T1.3 — `last_activity_at` : une interprétation, faute de définition.** `docs/04` §6 confie le
champ à la couche d'écriture sans dire ce qu'il contient. Retenu : la date du dernier fait
d'accompagnement, `max(coalesce(period_end, period_start))` sur les activités non archivées et non
annulées. L'autre lecture possible — l'horodatage de la dernière modification — a été écartée :
c'est le rôle d'`events`, et la confondre ici rendrait le tri des listes de projets illisible.
Un projet qui n'a que des activités à planifier reste sans date. **Désaccord possible, à trancher
en C2** quand les listes trieront réellement.

**T1.3 — Le fichier de tests importe `db` directement, et c'est nécessaire.** Un test qui
observerait la base à travers la couche qu'il teste ne prouverait rien : si le filtre de domaine
était rompu, l'instrument de mesure le serait aussi et le test passerait. Les constats se font donc
par le client brut ; seules les écritures sous test passent par la couche. C'est la seule exception
à la règle 1, et elle est bornée à ce fichier.

**T1.3 — Les tests ont été mis en défaut avant d'être crus.** Quinze tests au vert ne prouvent rien
tant qu'on n'a pas vu le rouge. Le filtre de domaine a été remplacé par un `true or …` : 9 tests
sur 15 sont tombés. La règle du résultat et le recalcul de `last_activity_at` ont été neutralisés
à leur tour : exactement les 3 tests concernés sont tombés. **À refaire à chaque modification de la
couche** — c'est le seul contrôle qui distingue un test d'une décoration.

**T1.3 — `superAdmin` est le seul chemin non scopé, et il est nommé pour ça.** `domains` n'a pas de
`domain_id` : rien ne peut la scoper. Plutôt qu'un contournement glissé dans l'amorçage — que le
ticket interdisait explicitement — trois fonctions groupées sous un nom qui se voit en relecture.
Aucune donnée métier n'est joignable par ce chemin : un domaine créé là ne se lit ensuite que par
`forDomain`. Un test vérifie que l'objet n'expose rien d'autre.

**T1.3 — Vitest, et le périmètre qu'il a fallu déborder.** Le ticket dit « tests associés » ; il
n'existait aucun lanceur. Quatre fichiers hors de `lib/db/` en découlent : la dépendance et le
script `test` dans `package.json`, `vitest.config.mts`, et la ligne `TEST_DATABASE_URL` de
`.env.example`. L'extension `.mts` n'est pas cosmétique : en `.ts`, Vite charge la configuration en
CommonJS et avertit que ce mode disparaîtra.

**T1.3 — La base de test est remappée, pas choisie.** `vitest.config.mts` écrase `DATABASE_URL`
avec `TEST_DATABASE_URL` dans l'environnement des tests. `lib/db/client.ts` n'est pas modifié et
n'a rien à savoir : une exécution de tests ne *peut pas* atteindre la base de développement. La
configuration lève si la variable manque — aucun test n'est sauté en silence.

**T1.3 — Le secret de la branche de test a transité en clair dans la conversation**, comme celui
de T1.2. Il n'est que dans `.env.local`, couvert par `.gitignore`. **À faire tourner sur Neon si ce
transcript sort du poste.**

**T1.4 — Désaccord avec la lettre de D9 : le responsable de domaine écrit partout.** D9 dit
« seuls les contributeurs désignés écrivent dans un projet ». Lu au pied de la lettre, un
responsable de domaine qui crée un projet ne peut pas y saisir une activité tant qu'il ne s'est pas
désigné contributeur de son propre projet. `canWriteProject` fait donc du rôle un sur-ensemble :
`role === "domain_manager" || contributorProjectIds.has(projectId)`. **Arbitrage rendu par
l'humain en ouverture du ticket**, D9 n'étant pas explicite sur ce cas. Ce n'est pas une
réouverture de décision : c'est le comblement d'un silence, et il tient en une ligne de
`rightsFor` si l'on veut revenir dessus.

**T1.4 — « Contributeur » est un profil, pas un rôle.** Le ticket demande de basculer entre
« un responsable de domaine, un contributeur et un simple membre ». `persons.domain_role` n'a que
deux valeurs, `domain_manager` et `member` : le contributeur est un `member` qui porte
`project_members.is_contributor` sur au moins un projet. Le sélecteur affiche donc deux rôles et
trois comportements. **Piège de vocabulaire à ne pas reproduire dans les écrans de C2** : ne jamais
écrire « rôle : contributeur ».

**T1.4 — Le fournisseur appelle le contexte, jamais l'inverse.** `session.ts` n'importe rien de
Next ; `provider.ts` importe `next/headers` et `session.ts`. La dépendance est dans ce sens pour
deux raisons : les tests chargent le contexte sans traîner `next/headers`, dont l'import hors
requête est fragile sous Vitest ; et C7 remplace un seul fichier. **Ne pas inverser** — un import
de `provider.ts` depuis `session.ts` rendrait le contexte intestable et le SSO invasif.

**T1.4 — Une identité fournie et inéligible est refusée, jamais remplacée.** `loadSession` rend
`null` si le `personId` désigne quelqu'un d'archivé, d'inactif, sans `has_access`, ou d'un autre
domaine. Le repli sur une personne par défaut n'a lieu qu'en l'absence totale d'identité. La
tolérance au cookie périmé — fréquente en développement, après un ré-amorçage — vit dans
`provider.ts`, c'est-à-dire dans le fichier que C7 jette. **Si elle remontait dans `session.ts`,
un jeton Entra ID nommant une personne sans accès ouvrirait une session sur quelqu'un d'autre.**

**T1.4 — Le domaine courant est trouvé, pas configuré.** `resolveDomainId` prend le premier
domaine actif et non archivé, par nom (`docs/05` §3 — « domaine unique »). Une variable
d'environnement aurait été un réglage de plus à tenir à jour pour une valeur que la base connaît.
**À reposer le jour où un second domaine existe** : le choix deviendra alors un vrai choix, et il
appartiendra au fournisseur.

**T1.4 — Un contributeur d'un projet archivé garde son droit d'écriture.** `contributorProjectIds`
ne filtre pas les projets archivés : `project_members` ne porte pas d'`archived_at` et la question
« un projet archivé est-il en lecture seule ? » n'est tranchée nulle part dans `docs/`. Le contexte
ne l'invente pas. **À trancher en C2**, avec l'écran qui archive un projet.

**T1.4 — Les tests ont été mis en défaut avant d'être crus**, comme en T1.3. `manageDomain` forcé
à `false` : 4 tests tombent, exactement les quatre qui parlent du responsable. Le filtre
`is_contributor` inversé : 2 tests tombent, ceux qui distinguent le projet désigné de l'autre.
Sans cette contre-épreuve, 19 tests au vert n'auraient rien prouvé.

**T1.4 — Écart de périmètre : les tests.** Le ticket ne les mentionne pas, contrairement à T1.3.
Ils ont été écrits — décision prise avec l'humain — parce que la base de développement est vide
jusqu'à T1.5 : sans eux, le critère « le basculement change les droits observables » n'aurait pu
être ni démontré ni infirmé pendant le ticket. Aucun fichier de configuration n'a été touché,
`vitest.config.mts` capte déjà `lib/**/*.test.ts`.

**T1.4 — La bascule a été observée peuplée, sur la branche de test.** La base de développement
étant vide, un domaine sonde a été amorcé sur la branche Neon **de test**, `/dev/session` servi
avec `DATABASE_URL` remappée, et les trois profils lus dans le HTML rendu : le responsable écrit
sur tous les projets, le contributeur sur le seul projet où `is_contributor` est vrai — pas sur
celui où il n'est que membre d'équipe —, le simple membre sur aucun. La soumission du formulaire
sans JavaScript pose bien le cookie. La sonde a été supprimée, la base de développement n'a jamais
été touchée. **Aucune donnée factice n'entre dans le dépôt : c'est T1.5.**

**T1.5 — Écart de périmètre : `tsx`, sans quoi le script n'est pas exécutable.** Le ticket ne
prévoit que `scripts/seed.ts`, mais rien dans le dépôt ne sait lancer un `.ts` hors de Next et de
Vitest. Node 24 retire les types tout seul, et échoue quand même : `lib/db/scoped.ts` importe
`./client` sans extension, la résolution ESM lève `ERR_MODULE_NOT_FOUND` (essayé). `tsx` était déjà
présent dans `node_modules` en dépendance transitive de `drizzle-kit` : le déclarer n'a rien
téléchargé. Deux lignes dans `package.json` — la dépendance et le script `db:seed`. Même nature
d'écart qu'en T1.3 avec Vitest.

**T1.5 — Pas d'`await` de premier niveau dans un script.** `package.json` ne porte pas
`"type": "module"` : `tsx` compile `scripts/seed.ts` en CommonJS et esbuild refuse alors le
`await` de premier niveau. D'où la forme `seed().then(…, …)` en pied de fichier plutôt qu'un
`await seed()`. **À savoir pour tout futur script** ; le jour où l'un d'eux a besoin d'un `await`
de premier niveau, c'est l'extension `.mts` qu'il faudra, comme pour `vitest.config.mts`.

**T1.5 — La rejouabilité tient à une clé naturelle, pas à un identifiant.** Les UUID sont tirés au
hasard : un script qui insère sans rapprocher doublerait tout à la seconde exécution. Chaque table
est donc lue une fois et indexée par une clé stable — `label` pour les référentiels, `name` pour
les produits et les projets, `full_name` pour les personnes, le couple d'identifiants pour les
liaisons, `(project_id, activity_type_id)` pour les activités. **Conséquence à connaître : renommer
un référentiel dans l'interface fera recréer la ligne au prochain amorçage.** Acceptable pour un
script de développement, à revoir si l'amorçage devient un chantier de production (`docs/04` §6).
La fixture est contrôlée au démarrage : deux clés identiques lèvent au lieu de s'écraser en silence.

**T1.5 — `numeric` revient cadré, et cassait la rejouabilité.** PostgreSQL rend `"62.0000"` pour
un `"62"` écrit. Comparé tel quel, chaque champ chiffré paraissait avoir dérivé et le script
réécrivait les mêmes lignes indéfiniment. La comparaison normalise donc les valeurs numériques
avant de conclure — c'est tout l'objet de `sameValue`. Sans elle, « rejouable sans doublon » aurait
été vrai et « sans écriture inutile » faux.

**T1.5 — La rejouabilité a été mise en défaut avant d'être crue**, comme les tests de T1.3 et T1.4.
Deux exécutions au vert ne prouvent que la moitié : elles montrent qu'on ne duplique pas, pas qu'on
rattrape. L'objectif d'un projet et la valeur d'un résultat ont donc été faussés en base, puis
l'amorçage relancé : exactement deux lignes remises à jour, les valeurs du brief relues telles
quelles, et l'exécution suivante de nouveau silencieuse. Sans cette manipulation, la branche de
mise à jour n'aurait jamais tourné.

**T1.5 — Les champs que le brief ne donne pas restent nuls.** Courriels des personnes, `base_url`
des outils, `external_url` des résultats, description des produits, commanditaire, valeur de
référence de l'indicateur : le brief ne les fournit pas, rien n'est inventé. **Une seule exception,
imposée par le schéma** : `resources.url` est non nul, la ressource porte donc un lien en
`exemple.invalid` — domaine réservé par la RFC 2606, visiblement factice, et qui ne pointera jamais
ailleurs par accident. Arbitrage rendu avec l'humain en ouverture du ticket. **Conséquence pour
C4 :** les deux résultats sont sans lien profond, alors que le brief §7 les annonce « lien
Ergonome » et « lien vers l'outil ». L'écran devra traiter le résultat sans lien comme un cas
normal — ce qu'il doit savoir faire de toute façon —, ou l'humain fournira les adresses.

**T1.5 — « Atelier de priorisation » est ajouté au référentiel.** Le brief §7 nomme cette activité ;
les 24 types de `docs/03` §2 ne la portent pas. Plutôt que de la loger sous « Atelier de
co-conception » avec son vrai nom relégué dans l'objectif — la roadmap aurait alors affiché autre
chose que le brief —, un 25ᵉ type a été créé en famille Conception. `docs/03` présente sa liste
comme « le référentiel de départ **proposé** », et `docs/04` §1 pose que les référentiels sont des
données du domaine. Arbitrage rendu avec l'humain.

**T1.5 — Trois inventions assumées, toutes visibles à l'écran.** Le brief est muet, le produit ne
l'est pas :
— **Camille Roux est responsable de domaine**, les six autres membres du centre sont `member`.
  Le brief ne désigne personne ; elle est la seule présente sur les deux accompagnements du produit
  vitrine. Sans un responsable **et** un contributeur qui ne l'est pas, la bascule de T1.4 n'a rien
  à montrer et la validation de T2.5 — « un contributeur ne voit pas l'action » — rien à vérifier.
— **Les métiers sont attribués** — un par membre du centre —, et `project_jobs` en est **dérivé**
  par union sur l'équipe, jamais écrit à la main. Sans eux, le filtre « métier » de T2.3, qui est
  au périmètre du POC (`docs/05` §3), n'aurait rien à filtrer. Arbitrage rendu avec l'humain.
— **Les participants d'une activité sont les membres du centre de son équipe projet.** Le brief ne
  détaille pas la présence activité par activité. Inférence la plus plate possible ; à corriger dès
  qu'une donnée réelle existe.

**T1.5 — `last_activity_at` est dans le futur sur deux projets, et c'est la définition qui parle.**
La fixture donne 2026-10-31 sur « Autonomie des opérations courantes » et 2026-09-30 sur
« Dématérialisation de la déclaration » : dans les deux cas un **audit UX prévu**, pas un fait
accompli. La définition retenue en T1.3 — `max(coalesce(period_end, period_start))` sur les
activités non archivées et non annulées — ne distingue pas le prévu du fait. `docs/03` §8 veut
pourtant que ce champ dise « depuis quand un projet n'a pas bougé ». **Rien n'est corrigé ici** :
la couche d'accès est hors du périmètre de ce ticket. Le point ouvert d'`ETAT.md` sur
`last_activity_at` est donc requalifié : ce n'est plus une interprétation à confirmer, c'est un
écart observé, à trancher en C2 avec le tri « par activité récente ».

**T1.5 — Personne, dans la fixture, n'a de compte annuaire.** Les huit personnes sont en
`source: manual`, `external_id` nul. Il n'y a pas d'annuaire au POC et fabriquer des identifiants
aurait été inventer. La contrainte `persons_external_id_requires_directory` l'autorise —
elle n'interdit qu'un `external_id` sans annuaire, jamais l'inverse. **À reprendre en C7** : l'import
Entra ID devra rattacher ces lignes à des comptes annuaire sans leur faire perdre leurs
rattachements de projet (`docs/04` §2, D19).

**T1.5 — L'amorçage n'écrit aucun `created_by`.** `forDomain({ actorId: null })` : il n'y a pas de
personne courante quand la première personne n'existe pas encore. Toutes les lignes semées portent
donc `created_by` nul, ce que `schema.ts` prévoyait explicitement. **Conséquence pour C6 :** le
journal `events` ne pourra rien attribuer sur ces lignes ; il n'y a d'ailleurs aucun événement semé,
le brief n'en fournit pas et le ticket ne les demande pas.

**T1.5 — Rien n'a été semé hors de l'énumération du ticket.** Ni budget, ni lien déclaré, ni
événement, et une seule ressource sur les quatre du brief §7 — « Restitution des tests — vague 2 »,
la seule que le brief rattache à une activité. Les trois autres n'ont pas d'ancrage donné :
les inventer aurait été plus coûteux à défaire qu'à écrire. Arbitrage rendu avec l'humain.
**T1.6 — Le contour de focus du design system échoue sur le fond primaire.** `border/focus`
(`#196de3`) sur `surface/primary/base` (`#24226a`) donne **2,87:1**, sous les 3:1 qu'exige un
indicateur de focus (WCAG 2.2, SC 1.4.11). Le critère de validation du ticket demande un focus
visible : les liens de la barre latérale prennent donc `content/neutral/pale` comme couleur de
contour — 13,7:1 — **sur ce fond et là seulement**, par une utilitaire de la couche `utilities`,
sans toucher à la règle globale de `globals.css`. À reprendre le jour où un second composant sera
posé sur fond primaire : la bonne réponse est peut-être un token de focus clair dans le design
system, qui n'en a pas.

**T1.6 — Deux couleurs de texte des maquettes échouent au contraste.** `content/neutral/light`
(`#acacb2`) sur le fond de page (`#f7f7f8`) donne **2,11:1**, très en dessous des 4,5:1 exigés d'un
texte. Les maquettes l'emploient pour les surtitres, les bandeaux de colonnes et les mentions
secondaires. Les gabarits utilisent `content/neutral/base` (`#6e6e74`, **4,73:1**) à la place, en
restant dans la couche sémantique. `content/neutral/light` n'est conservé que sur le séparateur
`›` du fil d'Ariane, qui est décoratif et `aria-hidden`. **`app/dev/session/page.tsx` porte encore
l'ancienne nuance sur son surtitre** : route de développement, hors périmètre du ticket, à corriger
si elle survit au stub.

**T1.6 — Arbitrage rendu sur le corps de texte et les bordures**, question laissée ouverte par
T1.1. Le corps de texte prend `content/neutral/dark` (`#4e4e54`, 7,7:1 sur le fond de page) et non
le `#33333b` des maquettes, qu'aucun token sémantique ne désigne : rien n'est inventé dans la
couche sémantique. Même raisonnement pour les filets : `border/default` vaut `#f7f7f8`,
c'est-à-dire exactement le fond de page — une carte bordée ainsi n'a pas de bord. Les cartes,
listes et états vides sont donc bordés de `surface/neutral/lighter` (`#e4e4ea`), un token de
surface employé comme bordure. C'est un écart au vocabulaire du design system, pas à ses valeurs ;
la vraie réponse serait un token `border/neutral`, qu'il n'a pas.

**T1.6 — Les cartes ne sont pas blanches.** Les maquettes posent `#ffffff` sur un fond `#f7f7f8`.
Aucun token sémantique ne pointe `greyscale/0` : la surface la plus claire disponible est
`surface/neutral/pale` (`#fdfdfd`), retenue pour les cartes. L'écart est d'un point de luminance,
invisible à l'œil ; il est noté parce qu'il se répétera sur chaque bloc de C2 à C7.

**T1.6 — Le groupe de routes `(app)` existe pour tenir `/dev/session` hors de la coquille.** La
coquille ne peut pas vivre dans `app/layout.tsx`, qui s'applique à tout, y compris au sélecteur de
personne courante — un outil de développement n'a pas à hériter de la navigation du produit. Les
six écrans vivent donc sous `app/(app)/`, et la racine ne garde que `<html>`, `<body>` et la
police. **Conséquence pour C7** : quand le stub disparaîtra, `app/dev/` disparaîtra avec lui et le
groupe pourra être aplati — ou pas, il ne coûte rien.

**T1.6 — Les points d'arrêt responsifs ne viennent d'aucun token.** La barre latérale bascule en
bandeau horizontal sous `md`, le point d'arrêt par défaut de Tailwind. Le design system ne définit
aucune grille ni aucun point d'arrêt, et le namespace `--breakpoint-*` n'a donc pas été effacé dans
`globals.css` comme l'ont été les couleurs et les tailles. La règle 2 vise les valeurs visuelles ;
un point d'arrêt de mise en page n'en est pas une. À reposer si le design system s'enrichit d'une
grille.

**T1.6 — Les composants `List`, `Section` et l'action des états vides ne servent encore à rien.**
Le ticket demande que les composants de base soient posés, et les six routes n'affichent aucune
donnée : `List`, `ListHeader`, `ListRow`, `Section`, `SectionHeader` et la prop `action` de
`EmptyState` sont donc écrits sans appelant. C'est une dette assumée et courte — T2.1 et T2.2 les
consomment. Si leur forme se révèle fausse à l'usage, elle se corrige là, pas ici.

**T2.1 — `last_activity_at` redéfini : les activités prévues sortent du calcul.** T1.3 retenait
toutes les activités non archivées et non annulées, faute de définition dans `docs/04` §6.
Conséquence rendue visible par le premier écran qui affiche le champ : deux produits sur deux
dataient leur « dernière activité » d'octobre et septembre 2026, sur un écran du 12 août 2026.
`docs/03` §8 veut que ce champ dise « depuis quand un projet n'a pas bougé » — une activité
prévue n'a pas eu lieu. La condition porte sur l'**état** (`state <> 'planned'`) et jamais sur
l'horloge : un champ stocké dont la valeur dépendrait de `current_date` serait faux le lendemain
de son calcul, et aucun recalcul ne le rattraperait. Arbitrage rendu avec l'humain à l'ouverture
du ticket.

**T2.1 — `refreshLastActivity`, sans quoi la décision précédente ne valait rien.** Le recalcul
existait depuis T1.3 mais n'était atteignable que par une écriture d'activité : il aurait fallu
écrire pour corriger. Une base amorcée avant T2.1 aurait gardé l'ancienne définition pour
toujours. **Leçon générale, pas propre à ce champ** : tout champ dénormalisé a besoin d'un moyen
de rejouer sa définition, sinon la définition n'est qu'une intention. `updated_at` n'est
délibérément pas touché — rafraîchir un champ dérivé n'est pas une modification métier, et le
journal de C6 n'a rien à en dire.

**T2.1 — L'amorçage rafraîchit la fraîcheur, et cela ne rompt pas son idempotence.** L'appel est
inconditionnel à chaque exécution, mais il ne touche aucune ligne de fixture : le compte rendu
affiche toujours « Rien à faire : le domaine était déjà à jour ». Le critère de T1.5 porte sur la
fixture, pas sur les champs qu'elle fait dériver. Vérifié en relançant `npm run db:seed` deux
fois.

**T2.1 — Un paramètre d'URL non conforme à un UUID rendait 500.** `?entite=n-importe-quoi`
n'était pas une recherche infructueuse mais une erreur PostgreSQL (`invalid input syntax for type
uuid`) remontée en page d'erreur. Trouvé en vérifiant le ticket, pas prévu au plan. La forme est
vérifiée avant la base, dans l'écran. **`/produits/[id]` et `/projets/[id]` ont le même défaut en
puissance** : ils ne lisent encore rien, mais T2.2 et T2.4 devront poser la même garde, et le 404
qui va avec un identifiant inconnu.

**T2.1 — `max()` sur `timestamptz` ne revient pas typé.** Drizzle rend la valeur telle que le
pilote la fournit — une chaîne, là où `select` d'une colonne rend un `Date`. La conversion est
faite une fois dans `lib/queries/products.ts` plutôt que dans chaque appelant, et le type de
retour annonce un `Date | null`. À savoir pour toute autre agrégation de dates en C3 et C5.

**T2.1 — Le tri de la liste des produits est alphabétique, faute de consigne.** Le ticket n'en
impose aucun et `docs/06` §4 ne parle de « tri par activité récente » que pour la liste transverse
des projets. À reprendre si l'usage montre autre chose.

**T2.1 — Les filtres d'entité ne proposent que les entités qui portent un produit.** Le
référentiel en compte cinq, deux seulement sont proposées : un filtre qui ne ramène rien est un
chemin vers le vide. Les trois autres restent atteignables par l'URL, et l'écran sait alors le
dire — c'est le second état vide du ticket, celui qu'aucun clic ne produit. Arbitrage rendu avec
l'humain.

**T2.1 — Les filtres sont locaux à l'écran, volontairement.** T2.3 devra combiner quatre filtres
et une recherche : la forme partagée s'écrira là, avec ses vraies contraintes. La poser ici
reviendrait à écrire T2.3 par avance, ce qu'interdit la règle 3.

**T2.2 — Les colonnes `date` ne reviennent pas en `Date`.** `started_on` et `expected_end_on`
arrivent en chaîne `YYYY-MM-DD` : le pilote rend le type PostgreSQL tel quel, là où `timestamptz`
donne un `Date`. `formatMonth` attendait un `Date` ; la conversion est faite une fois dans
`lib/format.ts` (`parseDay`, lecture en UTC comme le formateur), et le type de `ProductProject`
annonce des chaînes, sans mentir. À rapprocher du piège inverse relevé en T2.1 sur `max()` : dans
les deux cas, c'est le pilote qui décide, pas le schéma.

**T2.2 — L'ordre des accompagnements se lit sur `started_on`, pas sur `last_activity_at`.** Les
deux critères donnent le même résultat sur la fixture, et ce n'est pas une raison de les
confondre : une activité saisie aujourd'hui sur un accompagnement clos en 2024 le ferait remonter
en tête d'une liste qui raconte une chronologie. `nulls last` est explicite — PostgreSQL place les
nuls **en tête** d'un tri descendant, ce que `desc()` de Drizzle ne corrige pas —, et le nom
départage à date égale : un ordre qui varierait d'un affichage à l'autre serait un défaut, pas un
détail.

**T2.2 — Chaque filtre de domaine seul est rattrapé par celui de la table jointe voisine.**
Découvert en mettant les nouveaux tests en défaut : retirer `filter(products)` de
`findProductDetail` ne fait fuir aucune ligne, parce que la jointure sur `entities` porte encore
le sien — un produit d'un autre domaine ne trouve pas d'entité à joindre. Il faut retirer **les
deux** pour voir tomber le test. Ce n'est pas une invitation à en écrire un seul : c'est la
démonstration que la consigne de `joinedRead` — toute table jointe porte son filtre — produit une
défense en profondeur, et qu'un test d'étanchéité qui passe ne prouve donc pas que le filtre qu'on
regarde est celui qui travaille.

**T2.2 — Vitest ne résolvait pas l'alias `@/`.** `lib/queries/products.ts` importe la couche
d'accès par `@/lib/db/scoped` : typable, mais pas exécutable sous Vitest, qui ignore les `paths` du
`tsconfig.json`. Les tests des chantiers précédents ne l'avaient jamais rencontré, tous voisins de
leurs imports. Corrigé par un `resolve.alias` de six lignes dans `vitest.config.mts`, plutôt que
par la dépendance `vite-tsconfig-paths` : une dépendance de plus pour une ligne de configuration
serait un mauvais change.

**T2.2 — Une pastille d'avatar peut être parfaitement lisible et pourtant invisible.** Le premier
choix — initiales `content-primary-dark` sur `surface-primary-lightest` — donnait un texte à
15,14:1, chiffre rassurant et hors sujet : la pastille elle-même ne se détachait du fond de la
ligne qu'à **1,04:1**. Deux pastilles superposées se lisaient alors comme un seul mot, « CRIK ».
La palette de la maquette (fond `surface-primary-light`, initiales `content-neutral-pale`) rétablit
7,11:1 sur les deux rapports. **Leçon générale** : sur une forme superposée, le contraste du texte
et celui de la forme sont deux mesures distinctes, et la seconde s'oublie plus facilement.

**T2.2 — `SectionHeader` est employé sans `Section`.** Le bloc « Accompagnements » est une `List`,
qui porte déjà sa surface et son filet ; l'imbriquer dans une `Section` aurait posé deux fois le
même fond. Le titre et sa note passent donc par `SectionHeader` dans un `<section>` nu. Si le cas
se répète en C3, c'est la forme de `Section` qu'il faudra revoir — pas cet appel.

**T2.2 — Une personne archivée reste dans l'équipe des accompagnements passés.** `listProductProjects`
ne filtre pas `persons.archived_at` : qui a participé y a participé, et effacer un nom d'un projet
terminé réécrirait l'histoire du produit. La conséquence est qu'une personne partie reste visible
dans Vision — conforme à la règle 4, à confirmer au premier écran qui archive une personne.

**T2.3 — Il faut retirer les quatre filtres de domaine pour voir l'étanchéité tomber.** T2.2 avait
relevé que chaque filtre est rattrapé par celui de la table jointe voisine ; sur `listProjects`,
la chaîne compte quatre maillons — `projects`, `products`, `entities`, `project_statuses` — et
**chacun seul suffit à sceller le domaine**. Vérifié en escalade : un retiré, rien ne tombe ; deux,
rien ; trois, rien ; les quatre, cinq tests tombent d'un coup. La raison n'est pas la chance, c'est
T1.2 et T1.3 : les jointures portent sur des clés étrangères, et la couche garantit la cohérence
du `domain_id` avec les parents. **Conséquence à retenir** : sur ces requêtes, aucun test ne peut
prouver qu'un filtre donné travaille. Les écrire tous reste la consigne de `joinedRead` ; il faut
seulement savoir que la vérification se fait à la lecture du code, pas à l'exécution des tests.

**T2.3 — Les filtres de domaine des sous-requêtes `exists` sont, eux, entièrement redondants.**
Même cause, cas plus net : retirer `filter(projectJobs)` de l'`exists` du filtre métier, ou
`filter(persons)` de celui de la recherche par membre, ne fait tomber aucun test — et ne peut pas
en faire tomber, puisque la sous-requête est déjà accrochée à `projects.id`, lui-même scopé. Ils
sont écrits quand même : la consigne de `joinedRead` ne se négocie pas table par table.

**T2.3 — `exists` plutôt qu'une jointure, mais pas pour la raison qu'on croit.** J'avais écrit
qu'une jointure sur `project_jobs` doublerait les lignes d'un projet déclarant deux métiers. C'est
faux tant que le filtre porte **une seule** valeur : la jointure est alors contrainte à une ligne.
Le commentaire du code et le nom du test ont été corrigés. `exists` reste le bon choix, pour une
autre raison — il ne touche pas à la forme du jeu de résultats, donc il restera juste le jour où
le filtre acceptera plusieurs valeurs, là où la jointure se mettrait à mentir.

**T2.3 — Le motif d'un `like` doit être échappé, et ça se voit.** Sans échappement de `\`, `%` et
`_`, une recherche sur « % » ramène la liste entière et « _ » devient un joker : la recherche
cesse de dire ce qu'elle affiche. `likePattern` échappe `\` en premier, faute de quoi il masquerait
les échappements suivants. La fixture porte un projet nommé « Taux 100 % » exprès : le test exige
que « % » rende **cette ligne et elle seule**, ce qui distingue l'échappement d'une simple absence
de résultat. Mutation vérifiée : échappement retiré, ce test tombe et lui seul.

**T2.3 — Aucun jeton `border-*` n'atteint 3:1 sur le fond de page.** Le plus sombre,
`border-default`, vaut `greyscale-100`. Or la bordure d'un champ de formulaire est la limite d'un
composant d'interface : le WCAG 1.4.11 y exige 3:1, pas le 4,5:1 du texte ni rien du tout. Les
filets des blocs (`surface-neutral-lighter`) sont décoratifs et ne sont pas concernés ; ceux des
champs le sont. Retenu `content-neutral-normal` (`greyscale-400`, **3,88:1** mesuré sur
`surface-neutral-pale`), un jeton de contenu employé comme bordure — la règle 2 est tenue, la
sémantique du design system l'est moins. À signaler à qui maintient le design system : il manque
un jeton de bordure de contrôle.

**T2.3 — Le formulaire GET laisse des paramètres vides dans l'URL.** Soumettre sans rien choisir
produit `?recherche=&entite=&metier=&approche=&statut=`. C'est inélégant et sans conséquence : la
forme de chaque paramètre est vérifiée avant la base, une chaîne vide n'est pas un UUID, et le
compteur comme le lien de retrait se comportent comme sur `/projets` nu — vérifié. Les nettoyer
demanderait du JavaScript client, ce que cet écran n'a pas.

**T2.3 — La ligne de la liste transverse n'est pas cliquable en entier.** Les autres listes font
de la ligne un `Link` ; celle-ci porte **deux** liens, le projet et son produit de rattachement
que `docs/06` §4 exige cliquable, et un `<a>` ne peut pas en contenir un autre. `ListRow` est donc
appelé sans `href` — le composant le prévoyait déjà. C'est aussi ce que fait la maquette.

**T2.3 — La conservation des filtres au retour depuis un projet n'est pas traitée.** `docs/06` §9
la demande. Les filtres vivant dans l'URL, le retour navigateur les restitue, ce qui couvre le
geste courant ; un clic sur « Projets » dans la navigation principale, lui, repart à zéro. Aller
plus loin demanderait de mémoriser l'URL de retour, donc un état de session — hors périmètre du
ticket. À reposer si l'usage le réclame.

**T2.3 — Écarts de périmètre.** Trois, tous assumés : `lib/format.ts` gagne `formatProjects`, sans
quoi le compteur exigé par la validation n'a pas de forme ; `app/(app)/produits/[id]/page.tsx` perd
sa table de couleurs de statut au profit de `components/ui/status-dot.tsx` — `ETAT.md` la destinait
à T2.4, « avec deux appelants réels », et T2.3 est ce second appelant, arbitrage rendu avec
l'humain ; et le fichier `lib/queries/projects.test.ts`, que le ticket ne mentionne pas, comme à
chaque ticket depuis T1.3.

**T2.4 — Le rang d'accompagnement est le miroir de l'ordre de la page produit.** Le critère du
ticket dit « calculé, non saisi » ; il ne dit pas sur quoi. Deux ordres coexistent déjà dans le
code : la liste transverse trie sur `last_activity_at`, la page produit sur `started_on`. Le rang
lit le second — et volontairement le même que celui de la page produit, `started_on` puis le nom :
un accompagnement affiché troisième là-bas ne peut pas s'annoncer deuxième ici. `findAccompanimentRank`
prend donc la liste ordonnée des frères et rend `indexOf + 1`, plutôt qu'un `count(*)` de ce qui
précède : la même expression de tri sert au rang et à l'affichage, et une divergence future serait
visible d'un coup d'œil.

**T2.4 — Un accompagnement sans date de début n'a pas de rang du tout.** Le classer supposerait de
décider s'il ouvre ou ferme la chronologie ; les deux réponses sont arbitraires. La requête écarte
donc `started_on is null` et la mention disparaît de l'écran, plutôt que d'annoncer un « 1er » que
rien ne fonde. Mutation vérifiée : la garde retirée, ce test tombe et lui seul.

**T2.4 — Désaccord avec la maquette : la mention de rang pointe vers le produit, pas vers le projet
voisin.** `docs/06` §7 écrit « une mention du type "3ᵉ accompagnement de ce produit", cliquable vers
la page produit » ; la maquette, elle, ouvre l'accompagnement précédent. Le document l'emporte — le
CLAUDE.md pose les maquettes en référence visuelle. Arbitrage rendu avec l'humain, comme celui
d'afficher la mention **dès le rang 1**, que la maquette masquait : la règle de `docs/06` est sans
condition, et sur un produit à un seul accompagnement la mention reste un chemin vers le parent.

**T2.4 — Le gris de la maquette pour un intervenant côté entité est invisible.** `--c-light`
(`greyscale-300`) donne **2,22:1** pour la pastille sur la carte **et** 2,22:1 pour ses initiales
dessus : ni la forme ni les lettres ne tiennent. Même piège qu'en T2.2, autre bout de l'échelle.
Retenu `surface-neutral-base` (`greyscale-500`), mesuré à **4,98:1** des deux côtés ; la pastille
`center` reste à 7,11:1. Et la couleur ne porte de toute façon pas seule la distinction : « côté
entité » est écrit à côté du nom (`docs/06` §11).

**T2.4 — La puce d'approche est décorative, et c'est ce qui l'autorise à être pâle.** Son fond
(`surface-primary-lightest`) ne se détache de la carte qu'à **1,04:1**, son filet à **1,33:1** —
les valeurs mêmes qui avaient fait rejeter une pastille d'avatar en T2.2. La différence n'est pas
de degré : la pastille remplaçait le nom, la puce entoure un mot lisible, mesuré à **6,84:1**. Le
3:1 du WCAG 1.4.11 vise ce qu'il faut savoir viser ou distinguer, pas un cerne autour d'un texte.
Les jetons de la maquette sont donc conservés tels quels.

**T2.4 — Le `filter(projects)` de la requête d'identité ne fait tomber aucun test, une troisième
fois.** T2.2 l'avait relevé sur deux tables jointes, T2.3 sur quatre ; ici la chaîne
`projects → products → entities → project_statuses` se rattrape de la même façon, et il faut
retirer les **quatre** filtres pour que le test d'étanchéité cède. Rien de nouveau sur le fond —
les jointures portent sur des clés étrangères et T1.3 garantit la cohérence du `domain_id` avec
les parents. À retenir : sur `findAccompanimentRank`, qui ne joint rien, le filtre est au contraire
seul à sceller le domaine — son retrait fait tomber un test, et un seul.

**T2.4 — Le commanditaire n'a jamais été vu peuplé.** `sponsor` est nul sur les trois projets de
l'amorçage : le brief ne nomme aucun commanditaire, et la maquette en invente un (« Marc Tellier
(entité) ») que rien ne justifie de semer. Le champ affiche donc « Non renseigné » partout — un
état vide est une information, pas un trou à masquer. Reporté en point ouvert d'`ETAT.md`.

**T2.4 — Le journal du projet n'est pas repliable.** `docs/06` §5 le veut « frise repliée par
défaut ». Il est ici un bloc vide annoncé : replier ce qui ne contient rien n'a pas de sens, et le
mécanisme — un `<details>`, sans JavaScript — appartient au ticket qui affichera des événements.

**T2.4 — Le titre d'un état vide est un `h2` frère de celui de sa section.** `EmptyState` porte un
`h2` depuis T1.6, si bien que « Roadmap des activités » et « Aucune activité pour l'instant » sont
au même niveau alors que le second est contenu dans le premier. Le défaut existe depuis T2.2 sur la
page produit ; il n'est pas corrigé ici — changer le niveau de titre d'un composant partagé déborde
du ticket. À reprendre quand un écran imbriquera plus profond ; le centre fait métier de
l'accessibilité, ce détail se verra.

**T2.4 — Écarts de périmètre.** Quatre, tous assumés : `formatRank` dans `lib/format.ts`, sans quoi
la forme française du rang se dupliquerait dans l'écran ; la pastille `Avatar` extraite
d'`AvatarGroup`, pour que la page projet et les deux listes ne divergent pas sur la même forme — le
rendu des deux listes est inchangé, elles ne passent pas de `tone` ; deux composants neufs,
`components/ui/field.tsx` et `components/ui/tag.tsx`, que l'en-tête d'identité appelle quatre et
trois fois ; et `lib/queries/projects.test.ts`, comme à chaque ticket depuis T1.3.

---

**T2.5 — Le droit se vérifie deux fois, et la seconde est la seule qui compte.** Les deux
formulaires rendent 404 pour qui n'est pas responsable de domaine ; l'action serveur revérifie
`can.manageDomain` avant d'écrire. La seconde n'est pas une ceinture de plus : **une action
serveur est un point d'entrée HTTP à part entière**, atteignable sans jamais charger la page qui
l'affichait. Vérifié en récoltant les champs d'action sur la page servie au responsable, puis en
postant la même charge sous le cookie d'un contributeur — l'action rend son message de refus et
aucune ligne n'est écrite, contrôlé en base. Un bouton masqué n'est pas un droit ; le refus l'est.

**T2.5 — 404 plutôt que 403 sur les deux formulaires.** Annoncer l'existence d'un écran qu'on
refuse d'ouvrir n'apprend rien d'utile à qui le demande. C'est aussi ce que font déjà
`/produits/{id}` et `/projets/{id}` sur un identifiant d'un autre domaine depuis T2.2 : la page
inexistante et la page interdite se répondent pareil. Aucune décision de `docs/07` ne le posait ;
si l'usage réclame un jour un écran « vous n'avez pas ce droit », il se posera ici.

**T2.5 — Un `as` sur le type de produit a été retiré avant d'être livré.** L'action écrivait
`kind: values.kind as "product" | "internal"`, la validation venant de prouver l'appartenance à
l'énuméré. L'affirmation était vraie ce jour-là et aurait menti le jour où une troisième valeur
entre dans `product_kind` : le `as` ne suit pas le schéma, il l'affirme. `parseProductForm` rend
désormais soit des erreurs, soit une ligne **typée** — `input` est non nul si et seulement si
`errors` est vide —, et l'action n'a plus rien à affirmer. Deux tests tiennent cette équivalence.

**T2.5 — Le type de produit n'apparaît sur aucun écran de lecture.** Le formulaire écrit `kind`,
mais la liste des produits, la page produit et la liste transverse affichent une mission
transverse (`internal`) exactement comme un produit. Aucun des trois écrans n'a de colonne pour
elle, et en ajouter une déborderait de T2.5 comme des tickets qui les ont posés. D10 pose le type
pour que les missions transverses aient un rattachement, pas nécessairement pour qu'il se voie.
Reporté en point ouvert d'`ETAT.md`.

**T2.5 — Désaccord avec `docs/06` §9 : l'édition n'est pas en place.** Le document dit « édition
en place pour les champs simples, formulaire complet uniquement pour la création ». Une page
dédiée `/produits/{id}/modifier` est retenue, sur trois motifs : l'arborescence de `docs/06` §2
pose « création / édition » en **un seul nœud** sous Produit ; deux des quatre champs sont des
listes de choix, ce que « champ simple » décrit mal ; et sans JavaScript, l'édition en place
deviendrait un second état de la page produit, donc deux rendus à tenir pour un écran qui en a
déjà un. Arbitrage rendu avec l'humain avant écriture. La règle 6 ne s'applique pas — §9 est un
pattern d'interaction, pas une décision de `docs/07` — mais le désaccord se consigne quand même.

**T2.5 — Le formulaire est le second composant client du projet, et il fonctionne sans
JavaScript.** `useActionState` impose la frontière client ; React 19 améliore progressivement une
action serveur passée à `<form action>`. **Vérifié, pas supposé** : la page servie porte les
champs `$ACTION_REF_1`, `$ACTION_1:0`, `$ACTION_1:1` et `$ACTION_KEY`, et une soumission
`multipart` reconstituée à la main — sans exécuter une ligne de JavaScript — rend un 303 vers la
page du produit créé. Ce que le hook apporte quand JavaScript est là : les valeurs refusées
reviennent dans le formulaire. Sans lui, une description de dix lignes disparaîtrait au premier
nom oublié — constaté sur le rendu, la description survit au refus.

**T2.5 — L'identifiant du produit modifié ne transite pas par le formulaire.** `updateProduct` est
liée par `.bind(null, product.id)` côté serveur. Un champ caché aurait marché et se serait
remplacé par celui d'un autre produit dans la requête soumise ; la liaison, non. Le droit aurait
rattrapé un contributeur, pas un responsable de domaine visant la mauvaise ligne.

**T2.5 — Le design system n'a pas plus de jeton de bordure d'erreur que de bordure de contrôle.**
Aucun `border-danger-*` n'existe. Le champ en erreur reprend donc un jeton de contenu comme
bordure, exactement comme T2.3 l'a fait pour le champ ordinaire : `content-danger-base`, **mesuré**
à 5,19:1 sur le fond du champ. Les autres mesures du formulaire : bordure de champ
`content-neutral-normal` 3,88:1, message de champ `content-danger-dark` 6,55:1 sur le fond de page,
texte du bandeau 6,13:1 sur `surface-danger-lightest`, bordure du bandeau 4,93:1, note de champ
`content-neutral-base` 4,73:1. **Le message d'erreur ne dépend jamais de la couleur** : il est
écrit sous le champ, repris dans un bandeau `role="alert"`, et le champ porte `aria-invalid` et
`aria-describedby`.

**T2.5 — Le filet de la carte de type est passé à `content-neutral-normal`, mesuré.** Le premier
choix reprenait `surface-neutral-lighter`, le jeton des blocs — 1,18:1 sur le fond de page, c'est-
à-dire une carte qu'on devine. Or cette carte est la cible de clic d'un bouton radio, pas un bloc
de lecture. Les quatre contrôles du formulaire partagent donc un seul jeton de bordure.

**T2.5 — Deux mesures fausses de ma part, corrigées en vérifiant.** J'ai d'abord lu « la
description n'est pas conservée » et « aucun type n'est coché » dans le HTML servi : les deux
étaient des défauts de mes expressions de lecture, pas du code. La première capturait la balise
`<meta name="description">` de l'en-tête avant d'atteindre le `<textarea>` ; la seconde exigeait
`value` avant `checked`, quand React émet l'inverse. Les deux comportements sont corrects, et
revérifiés sur des motifs ancrés à `<textarea>` et `<input type="radio">`. Conséquence à retenir :
un motif qui n'est pas ancré à la balise visée mesure autre chose que ce qu'on croit.

**T2.5 — Le produit créé pendant la vérification a été retiré de la base de développement.** Il
polluait la fixture de T1.5, sur laquelle se lisent les critères de T2.1 à T2.4. La couche scopée
n'expose aucune suppression de produit — règle 4 — : le retrait s'est fait par un script jetable
important `db` directement, hors de tout code livré. Résidu de vérification, pas donnée métier.

**T2.5 — Une entité archivée disparaîtrait silencieusement du formulaire d'édition.** La liste des
entités écarte les lignes archivées, comme le veut la couche. Si le produit modifié pointait une
entité archivée, sa valeur ne serait dans aucune option : le formulaire retomberait sur « Choisir
une entité » et exigerait un nouveau choix. Le comportement est défendable — on ne conserve pas en
douce un rattachement archivé — mais il n'a pas été éprouvé : aucun écran n'archive une entité, et
l'amorçage n'en archive aucune. Reporté en point ouvert d'`ETAT.md`.

**T2.5 — L'archivage d'un produit reste hors périmètre.** `ETAT.md` désignait T2.5 comme « l'écran
qui archive » sur deux points ouverts. La fiche du ticket ne mentionne que quatre champs, et la
règle 3 interdit l'ajout. Arbitrage rendu avec l'humain : le périmètre est tenu, et les deux points
ouverts sont reformulés pour ne plus désigner un ticket qui ne les traitera pas.

**T2.5 — Écarts de périmètre.** Trois, tous assumés : `PageHeader` gagne un `action`, calqué sur
celui que `SectionHeader` porte depuis T1.6 — sans lui, l'action d'écran se placerait où la
maquette ne la prévoit pas, et les deux en-têtes divergeraient sur la même forme ; `ROUTES` gagne
`productNew` et `productEdit`, le module tenant toutes les adresses depuis T1.6 ; et
`lib/forms/product.test.ts`, comme à chaque ticket depuis T1.3 — à ceci près qu'il est le premier
fichier de tests du projet à ne toucher aucune base, la validation ayant été isolée pour cela.

---

**T2.6 — D9 dit « pas de création à la volée », la fiche dit « ajout manuel possible ».** La
contradiction est apparente : D9 énonce que **le responsable de domaine crée produits et projets,
puis désigne les contributeurs** — la création à la volée qu'il écarte est celle d'un produit ou
d'un projet par qui n'a pas ce droit, pas celle d'une personne. D19 tranche l'autre moitié : « une
personne peut être référencée sans compte : `source = manual`, `has_access = false` ». Le
formulaire crée donc des lignes `persons`, et c'est exactement le cas que D19 décrit — le chef de
projet côté entité qui figure dans l'équipe et n'aura jamais de compte. Arbitrage rendu avec
l'humain avant écriture. Sans lui, l'équipe d'un accompagnement neuf se serait limitée aux huit
personnes de l'amorçage : **aucun autre écran n'en ajoute** avant l'administration (D25, C7).

**T2.6 — L'équipe se saisit en une valeur par personne, pas en deux cases.** `project_members`
porte `is_contributor`, ce qui appelait naturellement une case « membre » et une case
« contributeur ». Retenu à la place : un `select` à trois valeurs — « Pas dans l'équipe » /
« Membre » / « Contributeur ». La raison n'est pas esthétique : deux cases autorisent l'état
« contributeur sans être membre », qui n'existe pas en base et qu'il aurait fallu rattraper à la
validation. Une seule valeur rend l'état incohérent **inatteignable** plutôt que corrigé.
Arbitrage rendu avec l'humain. D9 s'y lit en toutes lettres : appartenir à l'équipe et pouvoir y
écrire sont deux choses distinctes, et le formulaire le dit sous le bloc.

**T2.6 — Cinq tables écrites, aucune transaction : la parade est de vérifier avant d'écrire.**
`neon-http` n'a pas de transaction interactive — `lib/db/scoped.ts` le note depuis T1.3, il n'a que
`batch`. Un formulaire qui écrit `persons`, `projects`, `project_jobs`, `project_approaches` et
`project_members` ne peut donc pas être atomique : une référence refusée à la troisième écriture
laisserait les deux premières en base. `checkReferences` confronte donc **tout** au domaine avant
la moindre écriture — produit, statut, métiers, approches, personnes —, si bien
qu'`assertPreconditions` devient un second filet et non le premier. La fenêtre résiduelle n'est pas
nulle : une ligne supprimée entre la vérification et l'écriture la rouvrirait. Elle est jugée
acceptable au POC, et elle se refermera le jour où la couche exposera une transaction. **Le second
filet est branché** : un `DomainScopeError` remonte en message de formulaire, pas en page d'erreur.

**T2.6 — L'édition d'un projet est un diff, pas un `update`.** Trois tables de liaison rendent
l'écriture asymétrique : ce qui a disparu se délie (`unlink`), ce qui apparaît se lie
(`insertMany`), et un membre qui change de rôle voit sa ligne **modifiée**, pas refaite — refaire
la ligne perdrait son `created_at` et son `created_by` pour un changement de booléen. `unlink` est
une vraie suppression, ce que la règle 4 tolère précisément parce que le typage la réserve aux
tables sans `archived_at` : le point ouvert de T1.3 — « à confirmer au premier écran qui retire un
membre d'un projet » — est refermé ici, et dans le sens prévu.

**T2.6 — `syncJobs` et `syncApproaches` sont deux fonctions jumelles, délibérément.** Une fonction
générique sur `project_jobs` et `project_approaches` a été écrite puis retirée : les deux tables
ont la même forme mais pas la même colonne, et Drizzle ne réduit pas un `T` non résolu — la version
générique ne compilait qu'au prix d'un `as never` sur les lignes insérées. Deux fonctions de
quinze lignes valent mieux qu'une affirmation de type, pour la raison exposée en T2.5 à propos
du `as` sur `kind`.

**T2.6 — La période se saisit au jour et se lit au mois.** D13 pose la lecture au mois, et
`formatPeriod` la tient partout. `input type="month"` aurait fait coïncider saisie et affichage,
mais Firefox ne l'implémente pas et retombe sur un champ texte libre, qu'il aurait fallu valider à
la main. Deux `input type="date"` sont retenus : contrôle natif partout, et la colonne est en
`date` — la valeur y va telle quelle. On saisit donc plus fin qu'on n'affiche, et c'est assumé.
Arbitrage rendu avec l'humain.

**T2.6 — L'ordre des deux dates est une règle de formulaire, que la base ne porte pas.** Aucun
`CHECK` de `projects` n'interdit une fin antérieure au début — vérifié dans `schema.ts`. La règle
vit donc dans `lib/forms/project.ts` et nulle part ailleurs, ce qui veut dire qu'une écriture par
un autre chemin y échapperait. Elle compare deux chaînes `YYYY-MM-DD`, qui s'ordonnent
lexicographiquement comme elles s'ordonnent dans le temps. Elle ne s'applique pas quand l'une des
deux dates est déjà refusée, sans quoi son message masquerait celui de la date impossible — un test
tient cette précédence.

**T2.6 — Une date bien formée n'est pas une date qui existe.** `2026-02-31` satisfait le motif
`\d{4}-\d{2}-\d{2}` et PostgreSQL le refuse : ce serait une exception là où l'on attend un message
de champ, le même piège que celui de `lib/uuid.ts` pour les identifiants. `isIsoDay` fait donc
l'aller-retour par `Date` et compare la chaîne rendue à celle reçue — seul moyen de voir que le
31 février s'est déplacé au 3 mars. Vérifié en HTTP : la date impossible revient en message de
champ, pas en 500.

**T2.6 — Les cases à cocher sont dédoublonnées à la lecture du formulaire.** `project_jobs` et
`project_approaches` portent une contrainte d'unicité sur le couple projet/valeur. Deux cases de
même valeur — qu'un formulaire reconstitué à la main produit sans peine — feraient échouer
l'insertion **entière**, donc un projet créé sans ses métiers. Le `Set` est dans `fields()`, au
plus près de la lecture.

**T2.6 — L'entité est écrite dans le libellé de chaque produit, faute de pouvoir la suivre sans
JavaScript.** `docs/06` et la fiche demandent une entité « déduite du produit ». La montrer dans un
champ à part supposerait de réagir au changement du `select`, donc un état client, donc un écran
qui ne fonctionne plus sans JavaScript. Chaque option porte donc « Produit — Entité », et une note
dit d'où l'entité vient. Le compromis est visible : l'entité se lit dans une liste déroulante
plutôt que sous elle.

**T2.6 — Les entités du libellé sont lues **archivées comprises**, et elles seules.** Partout
ailleurs la couche écarte les lignes archivées, et c'est ce qu'il faut pour une valeur proposée au
choix. Ici l'entité n'est pas choisie : elle décrit un produit qui, lui, est proposé. Un produit
rattaché à une entité archivée doit continuer de dire de quelle entité il relève plutôt que de
s'afficher amputé. C'est l'inverse du cas relevé par T2.5 sur le formulaire de produit, et pour la
raison qui les distingue : proposer ou décrire.

**T2.6 — Une seule personne ajoutée par enregistrement.** Sans JavaScript, un champ répétable
n'existe pas : le bloc d'ajout porte un nom, un rattachement et un rôle, et il en crée une. Pour en
ajouter deux, on enregistre puis on rouvre le formulaire. La limite est dite dans l'écran, pas
seulement ici. Elle tombera avec l'écran d'administration des personnes (D25, C7).

**T2.6 — Le formulaire est le troisième composant client du projet, et il fonctionne sans une
ligne de JavaScript.** **Vérifié, pas supposé** : le parcours complet — création, puis quatre
éditions dont un changement de produit — a été joué par soumissions `multipart` reconstituées à
partir des champs `$ACTION_REF_1`, `$ACTION_1:0`, `$ACTION_1:1` et `$ACTION_KEY` que la page sert.
Une re-soumission **à l'identique** du formulaire d'édition, sérialisé comme un navigateur le
ferait, ne crée aucun doublon de liaison ni de personne — le diff est idempotent, relu en base.

**T2.6 — Un contributeur ne franchit ni la route ni l'action.** Les deux routes rendent 404 pour
Léa Fontaine, et aucune adresse de formulaire ne figure dans le rendu de ses trois écrans —
`/projets`, la page projet, la page produit. Le verrou qui compte reste le second : les champs
d'action récoltés sur la page servie à Camille Roux, **repostés sous le cookie de Léa**, rendent le
refus, et la base ne bouge pas — zéro projet, zéro personne créés, contrôlé en base. La réponse
HTTP est un 404, la page qui rend l'action étant elle-même interdite ; le message de refus, lui,
vient bien de l'action.

**T2.6 — Le rang d'accompagnement et les compteurs suivent un changement de produit.** Déplacer le
projet d'essai de « Espace client web » vers « Déclaration de sinistre en ligne » (D20) fait passer
le premier de 3 à 2 accompagnements et le second de 1 à 2, sur la page produit **comme** dans la
liste des produits, et le fil d'Ariane de la page projet suit. C'est ce que coûte le
`revalidatePath` sur l'**ancien** produit, lu avant l'écriture : sans lui, l'ancienne page produit
continuerait d'afficher un accompagnement parti ailleurs.

**T2.6 — Contraste mesuré avant d'être cru, sur les neuf couples du formulaire.** Aucune correction
n'en est sortie, pour une raison qui mérite d'être dite : le formulaire ne reprend que des couples
déjà mesurés en T2.3 et T2.5, et c'était le but. Les mesures, relevées à nouveau : bordure de
contrôle `content-neutral-normal` 3,88:1 sur `surface-neutral-pale` et 3,95:1 sur le fond de page,
bordure d'erreur `content-danger-base` 5,19:1, nom d'une personne `content-neutral-darkest`
17,87:1, mention « côté entité » `content-neutral-dark` 8,12:1, notes `content-neutral-base`
5,07:1, pastille de case `surface-primary-base` 13,65:1. À noter : le `select` d'équipe a le même
fond que le bloc qui le porte — c'est sa **bordure** qui le délimite, et c'est elle qu'il fallait
mesurer à 3:1. L'ordre de tabulation est lu dans le rendu et suit l'ordre visuel, sans un seul
`tabindex` : produit, nom, objectif, statut, les deux dates, commanditaire, les six métiers, les
sept approches, les neuf personnes, le bloc d'ajout, puis « Créer » et « Annuler ».

**T2.6 — Le commanditaire est vu peuplé pour la première fois.** Le point ouvert d'`ETAT.md` le
notait vide sur toute la fixture depuis T2.4, et renvoyait l'arbitrage à ce ticket. Il est tranché
par l'écran plutôt que par l'amorçage : le formulaire le saisit (D6, texte libre), et un projet
créé en vérification affiche « Hélène Vasseur » dans son en-tête. `scripts/seed.ts` n'est pas
touché — les trois projets du brief n'ont toujours pas de commanditaire, et le brief n'en nomme
aucun.

**T2.6 — Le projet d'essai est resté dans la base de développement, remis en état cohérent.**
T2.5 avait retiré le sien par un script jetable ; celui-ci est conservé, parce qu'il porte trois
choses que la fixture n'avait pas — un commanditaire renseigné, une personne `source = manual`
créée depuis l'interface, et un troisième accompagnement sur « Espace client web ». Il a été
ramené par le formulaire lui-même à son produit et à son équipe d'origine après les essais de
changement de produit. **Conséquence à connaître** : les critères de T2.1 à T2.4 se lisaient sur
« 2 accompagnements » pour ce produit ; ils s'y liraient désormais sur 3. Un `npm run db:seed` ne
le retirera pas — l'amorçage rapproche par clé naturelle et ignore ce qu'il n'a pas semé.

**T2.6 — Écart de périmètre : `lib/queries/projects.ts` a été touché, contre le plan annoncé.**
Le plan le déclarait explicitement non touché, au motif qu'aucune jointure n'était nécessaire. Le
motif tient — `listProjectFormOptions` et `findProjectLinks` n'appellent pas `joinedRead` et s'en
tiennent à `list` —, mais la conclusion ne tenait pas : les deux écrans de saisie font les **mêmes**
six lectures, et les laisser se dupliquer dans deux fichiers de route revenait à installer la
divergence. Elles vivent donc dans le module des lectures de projet, dont l'en-tête dit désormais
que toutes ne joignent pas. Les autres écarts : `ROUTES` gagne `projectNew`, `projectNewForProduct`
et `projectEdit` ; et `lib/forms/project.test.ts`, comme à chaque ticket depuis T1.3 — quarante-
cinq tests qui ne touchent aucune base, le second fichier du projet dans ce cas après celui de T2.5.

**C3 (découpage) — `docs/03` §6 décrit deux écrans à deux lignes d'intervalle.** Le paragraphe
ouvre sur « une frise chronologique par mois, sur laquelle chaque activité occupe sa période », puis
enchaîne sur « les activités sont regroupées visuellement par état, dans cet ordre de lecture ». Un
axe temporel où chaque activité occupe sa période et une liste groupée par état ne sont pas la même
représentation, et la seconde perd la position dans le temps. La maquette tranche pour les groupes,
et le découpage la suit — un axe à bandes de durée est la porte d'entrée du Gantt, que `docs/06` §10
interdit nommément. **Désaccord potentiel avec l'intention de `docs/03`, à faire confirmer** : si la
frise au sens propre est attendue sur la page projet, elle demande un ticket, pas un ajout dans
T3.1.

**C3 (découpage) — l'ordre interne des groupes de la roadmap n'est écrit que pour un groupe sur
cinq.** `docs/03` §6 dit « Terminé — l'historique, du plus récent au plus ancien » et ne dit rien
d'En cours, de Prévu, d'À planifier ni d'Annulé. Aucune liste ne se rend sans un ordre : T3.1 devra
en choisir un et le consigner ici. Il n'a pas été fixé dans la fiche du ticket, pour ne pas faire
passer un choix d'implémentation pour une règle du produit.

**C3 (découpage) — aucun chemin d'archivage ni de suppression d'activité n'est ouvert.** `docs/03`
§4 ferme la suppression — « on ne supprime pas une activité annulée : savoir qu'un audit était prévu
et a été abandonné est une information sur le projet » — et l'annulation motivée de T3.5 en tient
lieu. Une activité saisie par erreur n'a donc pas d'issue autre que l'annulation, ce qui est un
motif d'annulation faux. Le cas rejoint le point ouvert d'`ETAT.md` sur l'archivage du produit et du
projet, et se traitera avec lui — en C7 au plus tard, pas dans C3.

**C3 (découpage) — le panneau latéral est le premier composant qui demande une ombre.** Annoncé dès
le journal de T1.1 : le design system nomme trois élévations — `resting`, `raised`, `floating` —
sans leur donner de valeur, et le namespace `--shadow-*` de Tailwind est effacé plutôt que meublé.
T3.2 fait remonter la question à qui maintient le design system ; sa fiche lui interdit d'écrire une
valeur à la main. À défaut de réponse, un panneau se délimite par une bordure, qui a déjà ses jetons
mesurés depuis T2.3.

**C3 (découpage) — le bloc « Activité terminée — ajouter un résultat » de la maquette du panneau
n'est pas dans C3.** `docs/design/maquettes/vision.html` place dans le panneau de saisie d'activité
un libellé, une valeur, une unité et un lien vers l'outil. C'est le résultat déclaratif de `docs/03`
§5, que `docs/05` §5 range en C4. Il est nommé en interdit dans T3.2, T3.3 et T3.4 précisément
parce que la maquette le met sous les yeux du ticket qui écrit le panneau. Conséquence à connaître
pour C4 : le panneau devra rouvrir, et non être recopié.

**Avant C3 — verrou ESLint posé sur `lib/db/client`.** Écarté du périmètre de T1.3, qui ne tenait
la règle 1 que par convention, l'en-tête de `client.ts` et un `grep`. `eslint.config.mjs` porte
désormais `no-restricted-imports`, avec deux exceptions : `lib/db/scoped.ts`, seul module
applicatif autorisé, et tout fichier `*.test.ts` — quatre en profitent aujourd'hui
(`scoped.test.ts`, `session.test.ts`, `products.test.ts`, `projects.test.ts`), qui vérifient la
couche scopée par le client brut, exactement la justification déjà écrite en tête de
`scoped.test.ts`. Éprouvé, pas seulement déclaré : un import temporaire de `db` depuis
`lib/queries/products.ts` fait échouer `npm run lint`, retiré ensuite.

**Avant C3 — la clé d'amorçage des activités s'étend à la période.** `projet · type` suffisait tant
que la fixture ne répétait jamais un type sur un même projet, ce qui est vrai aujourd'hui mais que
C3 rend faux dans l'usage — un second Audit UX sur un projet qui dure est un cas normal, pas une
erreur de saisie. Sans la période dans la clé, une telle activité réelle se serait réconciliée avec
la ligne de fixture voisine au prochain `npm run db:seed`, l'une écrasant l'autre silencieusement —
le même mécanisme que le piège déjà documenté pour le renommage d'un produit, plus facile à
déclencher ici. La clé devient `projet · type · période` (`unscheduled` en son absence) ;
`results` et `resources` ne portant que `projet · type` dans leurs fixtures, la période de
l'activité correspondante est retrouvée par recherche dans `ACTIVITIES` plutôt que dupliquée dans
chaque fixture. **Le risque est atténué, pas éliminé** : deux activités réelles du même type sur le
même projet dans le même mois collisionneraient encore — assumé, comme pour le renommage d'un
produit, faute d'écran d'administration des référentiels (D25, C7). Rejoué : `npm run db:seed` reste
sans écriture sur les 12 activités, 33 participants, 2 résultats et 1 ressource existants.

**T3.1 — L'ordre interne des groupes : le passé se lit à rebours, le reste dans le sens de la
marche.** Le point ouvert laissé par le découpage de C3 se referme ici. `docs/03` §6 n'impose que
« Terminé, du plus récent au plus ancien » ; les trois autres groupes sont tranchés avec l'humain
avant écriture. **En cours** et **Prévu** se lisent par période croissante — ce qui a commencé en
premier en tête, puis la prochaine échéance —, **Terminé** par période décroissante, et **À
planifier**, qui n'a par définition aucune date, dans l'ordre de déclaration (`created_at`). Un
départage par libellé de type a été écarté : il se réorganiserait le jour où un domaine renomme un
type, alors que l'ordre affiché doit être stable d'un affichage à l'autre. L'option « tout à
rebours », plus courte à écrire, a été écartée aussi : elle mettrait l'échéance la plus lointaine en
tête de « Prévu ».

**T3.1 — Le rang de groupe a été écrit dans le `order by`, puis retiré : il ne portait rien.** La
requête triait d'abord sur un `case` donnant son rang à chacun des quatre groupes. Neutralisé pour
vérification, il n'a **fait tomber aucun test** — et c'est correct : le regroupement se fait en
mémoire et l'ordre des groupes vient de la constante `GROUPS`. Ce que le SQL doit garantir est
l'ordre **à l'intérieur** de chaque groupe, et les deux clés de période y suffisent, un état donné
n'en activant jamais qu'une. Le rang a été supprimé plutôt que laissé : du code qu'on croit
structurant et qui ne l'est pas est pire qu'absent. Noter au passage que les `nulls last` des deux
clés sont, eux, explicites sans être porteurs — PostgreSQL trie déjà `nulls last` en `asc`, et pour
la clé décroissante les valeurs nulles ne rencontrent jamais les autres, puisqu'elles vivent dans
des groupes distincts. Ils sont conservés comme documentation de l'intention, pas comme garde-fou.

**T3.1 — Les activités annulées sont écartées de la lecture, faute de groupe pour les recevoir.**
Elles sont en base, la fiche de T3.1 interdit le groupe « Annulé », et T3.5 est le ticket qui peut
le peupler. Une activité `cancelled` disparaît donc de l'écran entre T3.1 et T3.5 — sans
conséquence sur la fixture, qui n'en contient aucune, mais c'est une donnée métier temporairement
invisible et non une donnée perdue. Le jour où T3.5 ouvre le cinquième groupe, il retire le
`ne(state, 'cancelled')` et rien d'autre.

**T3.1 — La période d'une activité « à planifier » s'écrit « À planifier », et non rien.**
Arbitrage rendu avec l'humain. C'est redondant avec l'intitulé du groupe, et c'est voulu : l'entrée
reste autoporteuse si on la lit seule — ce que fera le panneau d'édition de T3.4 —, et elle reprend
le vocabulaire de D14 plutôt que d'en inventer un. `formatActivityPeriod` porte les quatre cas, dont
« Période non renseignée » : le schéma ne contraint la période ni d'une activité `in_progress` ni
d'une activité `cancelled`, et une entrée sans date doit dire l'absence plutôt que laisser un blanc.

**T3.1 — `formatPeriod` ne convenait pas à une activité : le mois se replie.** La période d'un
accompagnement s'étale par nature — « mars 2024 → septembre 2024 » —, celle d'une activité tient le
plus souvent dans un seul mois, du 1er au 31 août. `formatPeriod` aurait affiché
« août 2026 → août 2026 ». `formatActivityPeriod` replie donc les deux bornes quand elles tombent
dans le même mois. Les deux fonctions se ressemblent et ne fusionnent pas : ce qu'elles décrivent
n'a pas la même granularité d'usage.

**T3.1 — Cinquième vérification de la propriété relevée depuis T2.2 : les filtres de domaine se
rattrapent l'un l'autre.** Retirer `filter(activities)` **seul** ne fait tomber aucun test ; retirer
`filter(activityTypes)` **seul** non plus. Il faut retirer les deux pour voir l'étanchéité céder —
le test de la roadmap lue depuis un autre domaine tombe alors, et lui seul. La cause est la même
qu'en T2.2, T2.3 et T2.4 : la jointure interne sur le référentiel du domaine courant ne ramène
aucune ligne pour une activité étrangère. Le `filter` du `leftJoin` sur les approches, lui, n'est
**éprouvable par aucun test** : `assertPreconditions` garantit qu'une activité ne pointe jamais une
approche d'un autre domaine, si bien qu'il ne peut pas y avoir de fuite à observer. Il est écrit
quand même — c'est la condition posée par l'en-tête de `joinedRead`, et une défense en profondeur
ne se juge pas à ce qu'elle attrape aujourd'hui.

**T3.1 — Le libellé d'un type d'activité archivé continue de s'afficher.** Même nuance qu'en T2.6
pour les entités et les produits : décrire et proposer au choix n'appellent pas le même filtre. La
roadmap **décrit** ce qui a eu lieu, donc elle joint `activity_types` sans écarter les lignes
archivées ; T3.4, qui **propose** un type à la sélection, aura à les écarter — sauf pour celui que
l'activité éditée pointe déjà, sa fiche le dit. Éprouvé ici pour la première fois, `activity_types`
étant le premier référentiel dont un ticket archive une ligne dans ses tests.

**T3.1 — L'interlettrage de la maquette n'a pas été repris : le design system n'en a pas.** Les
intitulés de groupe de `vision.html` portent `letter-spacing: .04em`. `tracking-wide` de Tailwind
aurait fait entrer `.025em` — une valeur visuelle venue d'ailleurs que du thème, ce qu'interdit la
règle 2, et `app/tokens.css` ne définit aucun jeton d'interlettrage. Les capitales sont donc rendues
sans, comme le bandeau de colonnes de `ListHeader` depuis T1.6, qui remplit exactement le même rôle.
**À faire remonter à qui maintient le design system**, avec les deux jetons de bordure déjà
demandés depuis T2.3.

**T3.1 — Contraste mesuré avant d'être cru, sur les huit couples de l'écran. Aucune correction n'en
est sortie — c'était le but.** Intitulé et compteur de groupe sur le fond de page : 5,07:1. Type
d'activité sur la carte : 17,87:1. Objectif et période sur la carte : 4,98:1. Puce d'approche,
texte sur son fond : 6,84:1 ; sur la carte : 7,11:1. Le filet de la carte tombe à 1,27:1 sur le fond
de page, et c'est retenu tel quel pour la raison déjà écrite en tête de `tag.tsx` : la limite à 3:1
vaut pour un composant qu'il faut savoir viser, pas pour un cerne posé autour d'un texte lisible —
et l'entrée de roadmap n'est cliquable ni en T3.1 ni nulle part avant T3.4. Tous ces couples étaient
déjà en service depuis T1.6 à T2.4 ; l'écran n'en a introduit aucun.

**T3.1 — Le composant porte la section entière, en-tête compris, et la page n'en garde rien.**
`components/projects/roadmap.tsx` rend le `SectionHeader` aussi bien que les groupes et l'état vide.
Le motif est T3.2 : « Ajouter une activité » doit apparaître **en tête du bloc** (`docs/06` §5) *et*
dans l'état vide, et les deux emplacements vivent alors dans un seul fichier. La page projet ne
connaît plus de la roadmap que son nom.

**T3.1 — Écarts de périmètre.** Aucun, au sens strict : les cinq fichiers touchés sont ceux du plan
annoncé — `lib/queries/activities.ts`, ses tests, `components/projects/roadmap.tsx`,
`app/(app)/projets/[id]/page.tsx` et `lib/format.ts`, ce dernier explicitement prévu par la fiche
« si un libellé de période manque ». Le fichier de tests reste, comme à chaque ticket depuis T1.3,
un ajout que le périmètre ne nomme pas dans ces termes.

**T3.2 — Un panneau modal sans JavaScript : la réponse est `?activite=` plus `inert`.** C'était
l'inconnue technique de tout C3, et elle se résout en deux mécaniques HTML, aucune ligne de script.
L'**ouverture** est une URL : le panneau n'est pas un état de la page projet, c'est une variante de
cette page — donc rien à sauvegarder, rien à restaurer, et le contexte conservé par construction
plutôt que par un effort. La **tabulation** est l'ordre du DOM : le panneau est rendu **avant** le
contenu, et le contenu porte l'attribut `inert` tant qu'il est ouvert. Trois sorties — la croix,
« Annuler », le voile — mènent au même `href`, la page nue. Bénéfice non recherché de l'URL : le
panneau ouvert se copie, se partage et s'ouvre dans un onglet, ce qu'un bouton piloté par du
JavaScript n'aurait fait dans aucun des trois cas.

**T3.2 — `aria-modal` n'est posé que par le script, parce qu'il n'est vrai qu'à partir de là.**
L'attribut annonce à l'assistance que l'extérieur du dialogue est hors d'atteinte : c'est faux tant
que rien ne piège le focus, et vrai dès que `FocusTrap` s'exécute. Il est donc **absent du balisage
servi** et ajouté au montage — vérifié dans les deux sens. `role="dialog"` + `aria-labelledby`
nomment le panneau dans tous les cas, et `inert` produit l'effet réel sur le contenu de page. Le
voile, lui, est un `<a>` `aria-hidden` **et** `tabIndex={-1}` : une cible de fermeture à la souris,
jamais un arrêt de tabulation muet.

**T3.2 — Le cycle de tabulation n'a pas d'équivalent HTML, et c'est la seule chose du panneau qui
ait demandé du JavaScript.** `tabindex` réordonne les arrêts ; il n'en fait pas une boucle. Après le
dernier élément, le focus sort dans la barre du navigateur, revient en haut du document et traverse
le lien d'évitement, le logo et les quatre entrées de navigation — **qui sont derrière le voile et
restent focalisables**. Rendre la coquille inerte depuis la page est impossible : elle vit dans
`app/(app)/layout.tsx`, et un layout Next ne reçoit pas les `searchParams`. `components/ui/focus-trap.tsx`
ferme donc le cycle, ajoute Échap, et ramène dans le panneau un focus parti ailleurs. **La moitié du
comportement modal, elle, ne coûte rien** : `autofocus` sur la croix est un attribut HTML que React 19
rend bien dans le balisage servi — vérifié — si bien qu'à l'ouverture le focus est déjà dans le
panneau, et sur la sortie. Même forme que `project-form.tsx` depuis T2.5 : un composant client dont
le seul rôle est le confort, posé sur un socle qui fonctionne sans lui. Les enfants sont passés en
`children` et restent rendus sur le serveur — le référentiel lu en base ne traverse jamais la
frontière du client.

**T3.2 — Le piège de focus a été éprouvé dans un navigateur, pas déduit du code.** Chrome en mode
headless, piloté par le protocole DevTools, touches réellement dépêchées. **Avec JavaScript** : le
focus s'ouvre sur « Fermer le panneau » ; treize tabulations parcourent les six contrôles et
atteignent « Annuler » ; la quatorzième **revient sur la croix**, et le cycle se répète à l'identique
— aucun arrêt hors du panneau, la barre latérale n'est jamais atteinte. Maj+Tab depuis le premier
arrêt donne « Annuler », Tab depuis le dernier donne la croix, et un focus posé de force sur un lien
de la barre latérale est ramené dans le panneau à la tabulation suivante. Échap ramène à
`/projets/{id}` et le dialogue disparaît. `aria-modal` vaut `true` après hydratation. **Sans
JavaScript** (`Emulation.setScriptExecutionDisabled`) : le panneau est rendu, `aria-modal` est
absent, `inert` est là, les trois sorties pointent sur la page nue, un clic sur la croix ferme
vraiment — et le focus repose sur « Fermer le panneau », **lu dans l'arbre d'accessibilité** puisque
`Runtime.evaluate` n'est pas disponible dans ce mode. À noter au passage : un `input type="date"`
consomme trois ou quatre arrêts de tabulation à lui seul, ses segments jour/mois/année en prenant un
chacun. Ce n'est pas un défaut, c'est le contrôle natif — mais cela fait treize tabulations là où le
formulaire n'a que six contrôles, et c'est à savoir avant de compter les arrêts à la main.

**T3.2 — L'ombre du panneau reste absente, et le filet a dû être mesuré pour la remplacer.** La
maquette sépare le panneau du fond par `-8px 0 32px rgba(21,21,27,.16)` ; le design system nomme
ses trois élévations sans leur donner de valeur (dette ouverte depuis T1.1, et ce ticket est
exactement le composant qu'elle y attendait). L'interdit du ticket est explicite : la question se
fait remonter, elle ne se comble pas. La séparation repose donc sur deux choses, et **la première
mesure a fait tomber un défaut** : le voile `surface-neutral-opacity-distinct` — `greyscale-900` à
40 %, soit exactement la valeur de la maquette mais prise au thème — laisse la surface du panneau à
2,66:1 de lui, et le filet `content-neutral-normal` retenu partout depuis T2.3 s'y effondre à
**1,46:1**, c'est-à-dire une limite de panneau qu'on devine. `content-neutral-dark` la rétablit à
3,05:1 côté voile et 8,12:1 côté panneau. C'est le seul endroit du produit où un filet est plus
sombre que celui des contrôles, et la raison est écrite dans le fichier. **Note pour qui maintient
le design system** : la couche sémantique n'expose que cinq surfaces à opacité, la plus dense à
40 % ; un voile de modale qui porterait seul la séparation demanderait plus.

**T3.2 — « Enregistrer » est rendu inactif, faute d'action à lui donner.** La fiche annonce un
formulaire « qui n'enregistre rien à ce stade » et interdit toute écriture. Un bouton actif aurait
soit ne rien fait, soit rechargé la page en jetant la saisie — les deux mentent davantage qu'un
bouton visiblement inactif. Il n'est donc pas un arrêt de tabulation entre T3.2 et T3.3 : l'ordre
de tabulation se termine sur « Annuler ». `opacity-60` reprend le `disabled:opacity-60` du
formulaire de projet ; mesuré, il donne 3,99:1, sous les 4,5:1 — un contrôle désactivé en est
dispensé, mais la mesure est écrite ici plutôt que passée sous silence. **T3.3 lui donne son action
et referme ce point.**

**T3.2 — La case « à planifier » ne masque pas la période, et c'est du texte qui le dit.** La
maquette bascule le champ au clic (`sc-if` sur `drawerPlanned`), ce qui suppose du script. Sans lui,
les deux restent affichés et la note sous la case énonce la règle : cochée, elle remplace la
période. C'est T3.3 qui arbitre le conflit — période saisie **et** case cochée —, puisque c'est lui
qui valide.

**T3.2 — `FormField` est redit dans le panneau plutôt qu'importé. Dette assumée.**
`components/projects/project-form.tsx` porte un `FormField` et une constante `CONTROL` qui font
exactement ce qu'il faut, mais ce fichier est `"use client"` — l'importer entraînerait un module
client dans un composant serveur pour quinze lignes de balisage. Le panneau les redit localement.
**Troisième occurrence du même motif** (produit, projet, activité) : c'est le seuil à partir duquel
l'extraction se justifie. T3.4 reprend ce fichier et sera le bon moment pour poser
`components/ui/form-field.tsx`, si le besoin se confirme.

**T3.2 — Les deux référentiels sont lus dans la page, pas dans `lib/queries`. Écart assumé, et
provisoire.** Le type d'activité groupé par famille et l'approche viennent du domaine ; la fiche de
T3.2 exclut `lib/queries/*` de son périmètre alors que celle de T3.3 nomme explicitement
`lib/queries/activities.ts`. Le choix — arbitré avec l'humain avant écriture — est de poser le
formulaire complet dès maintenant et de lire les deux référentiels dans
`app/(app)/projets/[id]/page.tsx`, fichier du périmètre, par `session.db.list` : la règle 1 tient,
et T3.3 déplacera la lecture là où sa propre fiche la place. Les deux requêtes ne sont émises **que
si le panneau s'ouvre** — la page la plus consultée du produit ne les paie pas pour un panneau
fermé.

**T3.2 — Léa Fontaine n'est pas le témoin « non contributeur » que T2.5 et T2.6 en avaient fait.**
Les deux tickets précédents l'ont utilisée pour éprouver un refus, et à juste titre : ils testaient
`manageDomain`, qu'elle n'a pas. Mais elle est contributrice désignée sur « Autonomie des opérations
courantes » **et** sur « Refonte de l'espace documents », les deux projets d'essai de ce ticket —
elle a donc `writeProject` sur les deux. La vérification a été refaite avec Inès Kaddour
(contributrice sur le premier, pas sur le second) et Sofia Marchand (sur aucun des deux), ce qui a
au passage éprouvé ce qu'un seul témoin n'aurait pas montré : le droit est **par projet**, et la
même personne voit l'action sur l'un et pas sur l'autre. **À retenir pour C3 et C4** : le témoin
d'un refus dépend du droit testé, et la fixture n'a pas de personne sans aucun droit d'écriture.

**T3.2 — Écarts de périmètre : un seul, `components/ui/focus-trap.tsx`.** Les quatre fichiers de la
fiche sont ceux du plan — `components/projects/activity-panel.tsx`,
`app/(app)/projets/[id]/page.tsx`, `components/projects/roadmap.tsx`, `lib/navigation.ts`. Le
cinquième est venu d'une demande de l'humain après livraison, le panneau laissant sortir la
tabulation ; il vit dans `components/ui/` et non dans `components/projects/` parce qu'il ne sait
rien des activités — T3.4 et T3.5 rouvrent le même panneau, et une modale de C4 s'en servira. Il ne
pouvait pas tenir dans `activity-panel.tsx` : `"use client"` s'applique au module entier, et le
panneau importe l'énuméré `activityFamily` du schéma. Aucun fichier de tests n'est ajouté, pour la
première fois depuis T1.3 : le ticket ne pose aucune fonction pure à éprouver — ses arbitrages sont
de rendu, et se vérifient dans le HTML servi et dans un navigateur, comme ceux de T1.6.

---

**T3.3 — Un argument lié à une action serveur n'est pas un secret. Affirmation corrigée dans le
code.** J'avais écrit, dans `app/(app)/projets/[id]/page.tsx` comme dans l'en-tête de son
`actions.ts`, que l'identifiant du projet lié par `createActivity.bind(null, project.id)` « ne
transite par aucun champ, et ne peut donc pas être remplacé par celui d'un projet voisin ». C'est
faux, et la vérification l'a montré : le balisage servi porte
`<input type="hidden" name="$ACTION_1:1" value="[&quot;a9357cc0-…&quot;,{…}]">` — l'argument lié en
clair, au moins en développement. Réécrire ce champ et soumettre a été fait pour le voir. **La règle
qui en sort dépasse ce ticket** : une action serveur ne doit jamais tirer une autorisation de la
valeur qu'on lui a liée. `createActivity` interroge `session.can.writeProject(projectId)` sur
l'identifiant **reçu**, si bien que le repointage est refusé comme le reste — mais c'est ce contrôle
qui protège, pas la liaison. La liaison ne fait qu'une chose, utile mais modeste : sortir
l'identifiant de la saisie, pour que le panneau ne connaisse pas le projet dans lequel il écrit.
`updateProduct` et `updateProject` de C2 lient déjà un identifiant et n'ont rien à reprendre : tous
deux exigent `manageDomain`, un droit qui ne dépend d'aucun identifiant. À revoir au premier ticket
qui liera une valeur **dont dépend** un droit.

**T3.3 — « Enregistrer » vivait hors du `<form>` depuis T3.2.** Le pied du panneau était un `div`
frère du formulaire, si bien que le bouton n'aurait rien soumis même sans son `disabled`. Le défaut
était invisible tant qu'aucune action n'était branchée, et c'est précisément ce que « le formulaire
vide — qui n'enregistre rien à ce stade » avait rendu inobservable. Le formulaire enveloppe
désormais le corps défilant **et** le pied, ce qui n'a coûté qu'un niveau de `flex`. À retenir : un
composant dont une moitié est désactivée « en attendant le ticket suivant » ne s'éprouve pas, et le
ticket suivant hérite du défaut.

**T3.3 — Le panneau devient un composant client, et la propriété revendiquée par T3.2 tombe.**
L'en-tête de `activity-panel.tsx` faisait de son absence de `"use client"` « tout le propos ». La
fiche de T3.3 exige qu'« une saisie refusée revienne dans le panneau avec ses valeurs », ce qui
demande `useActionState` — il n'existe pas de troisième voie : une action qui redirigerait en
réencodant la saisie dans l'URL serait pire à tous égards, et un formulaire qui repart vide jette ce
qui a été tapé. L'arbitrage a été rendu avec l'humain avant écriture, contre l'alternative
d'extraire un `activity-form.tsx` client et de garder le panneau serveur : elle préservait la
propriété et une frontière plus étroite, au prix d'un fichier hors périmètre et d'un panneau coupé
en deux que T3.4, T3.5 et T3.6 toucheront tous les trois. **Ce qui n'a pas bougé mérite d'être dit**
: l'ouverture reste une URL, les trois sorties restent des liens, `inert` et `autofocus` restent des
attributs HTML, et `FocusTrap` reste le seul endroit où du JavaScript est indispensable. C'est la
frontière du bundle qui a bougé, pas la nature du socle — vérifié dans Chrome scripts coupés, où
`aria-modal` absent prouve que rien ne s'exécute et où le parcours entier aboutit quand même.

**T3.3 — `today` est un paramètre de la dérivation, jamais lu à l'horloge.** `deriveActivityState`
reçoit le jour courant en `YYYY-MM-DD` ; seule l'action le calcule, en un seul endroit. Sans cela,
les tests de bascule — la veille, le jour même, le lendemain — auraient été justes le jour de leur
écriture et faux le mois suivant, et un test de date qui ne se trompe que dans six mois est pire
qu'aucun test. Le calcul passe par `toLocaleDateString("sv-SE")` et non par `toISOString()` : ce
dernier convertit en UTC et reculerait d'un jour pour toute saisie faite avant 2 h du matin en heure
d'été française.

**T3.3 — Cinquième refus non prévu par la fiche : une fin de période sans début.** Arbitré avec
l'humain en ouverture de ticket. Le cas n'était couvert ni par la fiche, ni par les trois arbitrages
d'avance, et il n'était pas neutre : `activities_planned_requires_period_or_unscheduled` exige un
`period_start`, donc une fin seule **à venir** n'a aucun état légal et aurait produit une exception
PostgreSQL — un 500 là où l'on attend un message de champ. Dériver `done` pour une fin passée et
refuser pour une fin à venir aurait fait deux comportements pour une même forme de saisie,
impossibles à énoncer dans la note du champ. Le refus est donc uniforme. La propriété que cela
préserve est celle qui porte le ticket : **les deux contraintes `CHECK` du schéma tiennent par
construction**, jamais par un rattrapage.

**T3.3 — `isIsoDay` et `valueOrNull` sont importés de `lib/forms/project.ts`. Dette assumée.** Les
deux fonctions sont des règles générales — une date qui existe, un champ vide qui part à `null` —
et ne doivent rien au formulaire de projet. Les redire dans `lib/forms/activity.ts` aurait posé une
seconde autorité sur l'aller-retour de date, qui divergerait un jour ; les importer donne une
dépendance qui se lit mal, `activity` n'ayant rien à faire de `project`. Un `lib/forms/dates.ts`
aurait tranché, mais c'est un fichier hors du périmètre annoncé. **À poser au premier ticket dont la
fiche nomme déjà `lib/forms/`** — T3.4 est le candidat, qui rouvre `lib/forms/activity.ts`.

**T3.3 — `FormField` est redit une troisième fois, et la dette de T3.2 n'est pas refermée.** T3.2
annonçait T3.4 comme le moment d'extraire `components/ui/form-field.tsx`. T3.3 n'en a pas profité,
et cette fois la raison n'est plus la frontière client — le panneau est passé client — mais le
périmètre : le fichier n'est pas dans la fiche. Le `PanelField` local a gagné son message d'erreur
et son `errorId`, ce qui le rapproche encore du `FormField` de `project-form.tsx`. **Deux
différences restent réelles** et devront être des props si l'extraction se fait : le panneau est
dense — intitulés `text-2xs`, gouttières de 1,5 — là où la page ne l'est pas, et le panneau porte la
mention « (obligatoire) » que la page n'a jamais eue.

**T3.3 — Écarts de périmètre : deux, tous deux annoncés avant écriture.**
`app/(app)/projets/[id]/page.tsx` — le panneau ne peut pas se lier lui-même à un projet, et la page
est le seul endroit où l'action se lie côté serveur ; elle y reprend au passage
`listActivityFormOptions`, le déplacement que T3.2 avait annoncé pour ce ticket. Et deux lignes de
commentaire dans `components/ui/focus-trap.tsx`, dont l'en-tête justifiait son `:not([disabled])`
par un « Enregistrer » inactif « tant que T3.3 n'a pas branché son action » : le sélecteur ne bouge
pas — il sert désormais l'état `pending` — mais la phrase serait devenue fausse.

**T3.3 — Les cinq saisies de vérification ont été archivées, pas supprimées.** Une fois les critères
lus dans le HTML servi, laisser cinq activités d'essai sur « Autonomie des opérations courantes »
aurait rendu illisible le critère de T3.1, qui se lit sur cinq activités dans un ordre exact.
`scope.archive` est le geste sanctionné par la règle 4, et la roadmap écarte déjà les lignes
archivées : le projet est revenu à ses cinq activités et sa fraîcheur à août 2026, vérifié. **Effet
de bord instructif** : l'archivage a fait redescendre `last_activity_at` de septembre à août, ce qui
éprouve une moitié de la règle que T3.3 n'avait pas à vérifier — la couche recalcule le champ à
l'archivage comme à l'insertion. Noter enfin qu'**aucun écran n'archive une activité** : il a fallu
passer par la couche. L'annulation de T3.5 ne remplace pas ce geste, elle exige un motif et laisse
l'activité visible.

**T3.4 — L'arbitrage (c) tient dans une comparaison, mais elle doit porter sur trois champs et pas
deux.** « L'état n'est redérivé que si la période a bougé » se lit comme une comparaison de deux
dates. C'en est une de trois valeurs : `is_unscheduled` en fait partie, et l'oublier ne se voit sur
aucun écran d'aujourd'hui. La raison est dans le schéma :
`activities_planned_requires_period_or_unscheduled` autorise la case **avec** une période — c'est le
formulaire de T3.3 qui refuse la combinaison, pas la base. Une telle ligne peut donc exister
(amorçage, T3.5, écriture par la couche), et décocher sa case sans toucher aux dates ne changerait
alors *que* la case : sans le troisième terme, la ligne existante serait rendue telle quelle et la
case resterait cochée. Le défaut a été trouvé **en neutralisant**, pas en relisant : le test écrit
d'abord comparait des valeurs que la dérivation rendait identiques de toute façon, et la
neutralisation ne faisait tomber aucun test.

**T3.4 — Deux tests écrits ce jour-là ne discriminaient rien, et la mise en défaut l'a montré.** Le
premier neutralisation de la conservation de l'état ne faisait tomber que deux tests sur les quatre
qui prétendaient l'éprouver ; les deux autres comparaient `resolveActivityPeriod` à une valeur que
`deriveActivityState` rendait identique par hasard — « à planifier » réenregistrée telle quelle, et
une borne vide contre une borne nulle. Ils ont été récrits : le premier sur l'**identité** de l'objet
rendu (`toBe`), qui distingue « la ligne existante est rendue » de « une ligne équivalente est
refabriquée » ; le second sur un cas où l'état diverge — une activité `planned` à début seul, que la
dérivation dirait `in_progress`. **La leçon n'est pas nouvelle mais elle s'est payée ici** : un test
vert ne prouve rien tant qu'on ne l'a pas vu rouge, et « il passe » n'est pas « il éprouve ».

**T3.4 — Le second argument lié d'une action désigne la ligne écrite, et il est réécrivable.** T3.3
avait établi qu'un argument lié n'est pas un secret. T3.4 en lie deux, et le second — l'identifiant
de l'activité — n'est pas de même nature que le premier : il ne sert pas à vérifier un droit, il
**désigne ce qu'on écrit**. La parade n'est donc pas la même : `writeProject` ne dit rien de
l'activité, et il a fallu un contrôle d'appartenance explicite — l'activité reçue relève-t-elle du
projet reçu, est-elle vivante, n'est-elle pas annulée. Sans lui, une liaison repointée aurait écrit
dans l'activité d'un autre accompagnement en toute légalité de droit, et l'interdit « aucun
changement de projet de rattachement » serait tombé par la porte de derrière. Éprouvé : liaison
repointée vers une activité d'un autre projet, refus rendu, les deux lignes relues intactes.

**T3.4 — Une activité annulée ne s'édite pas. Décision de ticket, à reprendre par T3.5.** La roadmap
n'affiche pas les annulées (T3.1), donc aucun lien n'y mène ; mais une URL se tape, et l'action est
un point d'entrée HTTP. Le refus est explicite plutôt qu'implicite, pour une raison de fond : une
période déplacée sur une activité annulée la ferait sortir de `cancelled` **sans qu'on l'ait
demandé**, la dérivation ne connaissant pas cet état. Décider ce que devient l'état d'une annulée
qu'on rouvre est le geste de T3.5, pas celui-ci. **Conséquence pour T3.5** : le jour où le cinquième
groupe s'affiche, ses entrées porteront un lien « Modifier » qui refusera — à retirer pour ce
groupe, ou à autoriser en tranchant l'état.

**T3.4 — L'écriture est évitée quand rien n'a changé, et c'est un arbitrage, pas une optimisation.**
« Une re-soumission à l'identique ne change aucune ligne » peut se lire au sens métier — aucune
donnée ne bouge — ou au sens strict — aucune ligne n'est touchée. Le second a été retenu avec
l'humain : `session.db.update` repousse `updated_at` et recalcule la fraîcheur, si bien qu'au sens
métier la ligne aurait quand même porté la trace d'une modification qui n'en est pas une, et le
journal de C6 l'aurait enregistrée. `activityRowUnchanged` compare les sept colonnes que ce
formulaire écrit. Vérifié en relisant `updated_at` **à la milliseconde** de part et d'autre d'une
re-soumission : inchangé. Le panneau se referme quand même — refuser de fermer parce que rien n'a
changé aurait été une confirmation intermédiaire de plus, que `docs/06` §9 écarte.

**T3.4 — Le type archivé est conservé par une exception nominative, et le produit n'est plus
cohérent sur ce point.** `listActivityFormOptions` accepte `keepActivityTypeId` et lit alors
`or(archived_at is null, id = celui-ci)` — le motif de `findAccompanimentRank`, le seul autre endroit
du code qui excepte une ligne archivée par son identifiant. C'est ce que la fiche exigeait, et c'est
le bon comportement : obliger à changer le type d'une activité pour en corriger l'objectif serait
absurde. **Mais la fiche se trompe en présentant cela comme « le même comportement que T2.5 et
T2.6 »** : ces deux formulaires ne conservent rien — une entité ou un produit archivés disparaissent
de leurs options et le formulaire exige un nouveau choix, comme le note le point ouvert d'`ETAT.md`
depuis T2.5. Désaccord consigné plutôt que rejoué : T3.4 fait ce que sa fiche décrit, et les deux
autres formulaires restent à aligner.

**T3.4 — `ActivityPanel` porte une `key`, pour un défaut qui n'est pas atteignable.**
`useActionState` ne relit son état initial qu'au montage : un panneau réutilisé d'une activité à
l'autre afficherait la saisie de la précédente. Le chemin n'existe pas aujourd'hui — le contenu de
la page est `inert` tant que le panneau est ouvert, donc on repasse toujours par la page nue, où le
panneau se démonte. La `key` coûte un attribut et rend la garantie indépendante de ce raisonnement,
qui tomberait le jour où une navigation d'un panneau à l'autre deviendrait possible.

**T3.4 — Ni `lib/forms/dates.ts`, ni `components/ui/form-field.tsx`. Les deux dettes de T3.3 restent
ouvertes.** T3.3 désignait T3.4 comme le candidat pour l'une et pour l'autre. Aucune n'a été
refermée, et la raison est la même : ce sont des **fichiers neufs**, hors de la fiche, et le ticket
portait déjà quatre écarts annoncés. En ajouter deux de plus sans les avoir annoncés aurait été le
contraire de ce que la règle 3 protège. Noter que T3.4 n'a pas aggravé la première — il n'a écrit
aucune règle de date nouvelle, `resolveActivityPeriod` comparant des valeurs déjà normalisées par
`deriveActivityState`. `PanelField` n'a pas bougé non plus.

**T3.4 — Écarts de périmètre : quatre, tous annoncés avant écriture.**
`app/(app)/projets/[id]/page.tsx` — elle seule lit `?activite=`, donc elle seule peut distinguer
`nouvelle` d'un identifiant, lire l'activité et lier la bonne action ; `lib/navigation.ts` pour
`ROUTES.projectActivityEdit`, l'entrée que T3.2 annonçait ; `lib/queries/activities.ts` pour
l'exception ci-dessus, qu'il aurait fallu sinon écrire dans la page ; et son fichier de tests, dont
la fixture portait déjà un type d'activité archivé depuis T3.1.

**T3.4 — Aucun navigateur n'a été piloté, et c'est une différence avec T3.2 et T3.3.** Ces deux
tickets dépêchaient de vraies touches dans Chrome, scripts coupés. La session de T3.4 n'avait pas
d'outil de pilotage de navigateur. Ce qui a été fait à la place : des soumissions `multipart`
reconstituées à partir des champs `$ACTION_…` du balisage servi, **sans en-tête `Next-Action`** —
c'est-à-dire exactement ce qu'envoie un navigateur sans JavaScript. Ce qui n'a donc pas été
re-vérifié cette fois : le cycle de tabulation et la fermeture par Échap, qui dépendent de
`FocusTrap`. Le panneau n'a pas changé de forme — mêmes contrôles, même ordre, l'ordre du DOM a été
relu dans le rendu — mais la vérification est de seconde main sur ce point, et il faut le savoir.

**T3.5 — `page.tsx` n'était pas dans la fiche, et le geste devait pourtant naître dans
`roadmap.tsx`.** La fiche listait `actions.ts`, `roadmap.tsx`, `activity-panel.tsx` et
`lib/forms/activity.ts` — pas `page.tsx`, ni `lib/queries/activities.ts`. La question posée était :
qui lie les deux actions neuves à l'activité concernée ? Deux réponses possibles — `roadmap.tsx`
importe `actions.ts` directement, en rupture avec la convention du produit (« `page.tsx` lie, les
composants rendent ») ; ou `page.tsx` les importe et les passe en props à `Roadmap`, gatées à
`null` comme `editHref`, au prix d'un écart de périmètre de plus. La seconde a été retenue, parce
que T3.4 avait déjà tranché la même tension dans le même sens sans que sa fiche ne l'annonce non
plus. `lib/queries/activities.ts` était de toute façon inévitable : `ETAT.md` l'annonçait mot pour
mot depuis T3.1 pour le cinquième groupe.

**T3.5 — `activity-panel.tsx` figurait au périmètre et n'a pas été touché.** Rien dans la
conception ne l'exigeait : les quatre transitions sont des formulaires nus, directement dans
l'entrée de roadmap, jamais dans le panneau complet — c'est littéralement ce que dit la fiche
(« sans passer par le formulaire complet »). Le fichier était probablement listé par précaution,
comme d'autres tickets de C3 l'ont fait pour des fichiers finalement inchangés. Consigné plutôt
qu'inventé une raison de le modifier.

**T3.5 — « Marquer terminée » ne collecte aucune date, et c'est une conséquence directe de
l'arbitrage du 13/08/2026, pas une limitation du ticket.** Une activité `in_progress` dont la
période n'a qu'un début (le cas que `deriveActivityState` documente depuis T3.3, « en cours
indéfiniment ») ne peut donc pas être close par ce geste à un clic : le bouton ne s'affiche pas
faute de `period_end`, et l'action refuserait une requête forgée pour la même raison. La fermer
réellement demande d'abord une fin de période, saisie par une personne via le panneau d'édition
(T3.4) — jamais fabriquée par Vision. Le geste de T3.5 ne fait que valider un fait déjà écrit.

**T3.5 — L'annulation n'a pas de `useActionState`, à la différence de tout le reste du produit qui
préserve une saisie refusée.** Le motif est `required` en HTML : une soumission vide est bloquée
par le navigateur, sans aller-retour serveur. Le serveur revalide en second filet et refuse
silencieusement si ce filet est contourné — vérifié par une requête forgée avec un champ
`cancellationReason` vide, la ligne relue intacte. Aucune saisie à préserver dans ce cas : le motif
vide n'atteint jamais l'écran en usage normal, contrairement aux refus de `lib/forms/product.ts` ou
`lib/forms/project.ts`, qui protègent des formulaires à plusieurs champs où retaper coûte cher.

**T3.5 — Le groupe « Annulé » s'enveloppe dans un `<details>`, pas un composant client repliable.**
« Replié par défaut » (`docs/03` §6) se lit littéralement : `<details>` sans attribut `open` l'est
nativement, sans JavaScript, et le triangle de divulgation par défaut du navigateur a été conservé
plutôt que masqué — c'est le signal standard d'un contenu replié, et la règle 2 interdit
d'inventer une valeur visuelle pour le remplacer. `<summary>` n'accepte que du contenu de phrasé
(et, en premier enfant, un titre) : l'en-tête de groupe a dû être extrait en fragment
(`headerContent`) plutôt que le `<div>` qu'il portait jusque-là, pour rester posable aussi bien
dans un `<summary>` que dans le `<div>` toujours-ouvert des quatre autres groupes.

**T3.5 — Le choix laissé ouvert par T3.4 sur « Modifier » d'une activité annulée est tranché : le
lien est retiré.** T3.4 posait la question sans y répondre : garder le lien ferait pointer vers un
panneau qui refuse déjà d'ouvrir une activité annulée (`updateActivity` depuis T3.4), donc vers un
lien mort. Le motif s'affiche à sa place, texte et non couleur seule.

**T3.5 — Vérifié sur le chemin réel, sans outil de pilotage de navigateur, comme T3.4.** Quatre
transitions jouées par soumissions `multipart` reconstituées à partir des champs `$ACTION_…` du
balisage servi, sans en-tête `Next-Action` : prévue → en cours → terminée sur une activité datée,
annulation refusée sans motif puis acceptée avec, et une transition forgée sous le cookie d'un
membre non contributeur refusée, ligne relue intacte. La fraîcheur du projet a été observée bouger
d'août à octobre 2026 dans la liste transverse au passage prévue → en cours d'une activité
d'octobre — le critère explicite de la fiche, pas une extrapolation depuis T2.1. Les quatre
écritures de vérification n'ont pas été reprises en base ; consignées dans `ETAT.md`.

**T3.6 — Un défaut réel trouvé en vérifiant, corrigé avant livraison : l'ordre du diff
`syncParticipants` laissait un refus retirer quand même une personne légitime.** La première
version délivait d'abord (`unlink` de ce qui a disparu) puis ajoutait (`insertMany` de ce qui
manque). Éprouvé sur le chemin réel — une soumission qui retire une personne existante et en ajoute
une forgée hors domaine — le refus était bien rendu (`DomainScopeError` → `scopeRefusal`), **mais
la personne retirée avait déjà disparu de la table** au moment où l'ajout forgé faisait échouer la
requête : le retrait, lui, n'échoue jamais. C'est le seul refus du produit qui n'aurait pas laissé
« la ligne relue intacte », contrairement à tout ce que T2.5, T2.6, T3.2, T3.3, T3.4 et T3.5 ont
éprouvé et consigné. Corrigé en inversant l'ordre : l'ajout passe en premier, et
`insertMany` vérifie **chaque** ligne (`assertPreconditions`) avant d'écrire quoi que ce soit — une
personne hors domaine parmi les ajouts fait donc échouer l'ensemble avant qu'aucun retrait n'ait eu
lieu. Reproduit puis corrigé sur la base de développement, participant restauré à la main.
**Leçon pour tout futur diff de liaison qui n'aurait pas de pré-vérification en amont (`checkReferences`)** :
l'ordre à l'intérieur du diff porte la garantie transactionnelle à lui seul, et l'ajout doit
toujours précéder le retrait.

**T3.6 — Aucune vérification de l'existence d'un participant dans le domaine côté action, par choix
explicite de la fiche — à la différence de `activityTypeId`/`approachId` (T3.3) et de l'équipe de
projet (T2.6).** « Une personne d'un autre domaine est refusée par la couche d'accès, pas par
l'écran » : `checkReferences` dans `projets/[id]/actions.ts` ne porte donc aucune règle sur
`participantIds`, et c'est `assertPreconditions` de `lib/db/scoped.ts` — déjà là pour toute clé
étrangère du schéma — qui est le seul filet, attrapé par `scopeRefusal`. Assumé : c'est ce choix qui
a rendu atteignable le défaut ci-dessus, une pré-vérification à l'écran l'aurait rendu impossible en
détournant le problème plutôt qu'en le résolvant.

**T3.6 — La non-atomicité de l'écriture d'activité, rouverte comme `ETAT.md` l'annonçait
d'avance.** `createActivity` écrit désormais deux tables — `activities` puis
`activity_participants` — sans transaction interactive (`neon-http` n'expose que `batch`). Un
participant forgé peut donc faire échouer `syncParticipants` **après** que la ligne `activities` a
déjà été insérée : l'activité existe, sans ses participants, et l'écran affiche un refus. Fenêtre
resserrée par l'ordre (la vérification de forme précède l'écriture, comme partout) mais pas fermée
— la même limite acceptée en T2.6 pour la création d'un projet. Non reproduit : forger un
participant hors domaine à la **création** n'a pas été rejoué séparément de l'édition, le mécanisme
`assertPreconditions` étant strictement le même des deux côtés et déjà éprouvé en édition.

**T3.6 — Imprécision de la fiche : « une personne de type `external` ».** L'énuméré du schéma
(`persons.kind`) ne connaît que `center` et `stakeholder` (D19, repris depuis T2.4/T2.6, « côté
entité »). Aucun type `external` n'existe. Traité comme un raccourci de rédaction pour
`stakeholder`, et implémenté comme tel — c'est la seule lecture qui rattache la fiche au reste du
produit, où « côté entité » désigne déjà exactement ce cas sur trois écrans.

**T3.6 — Vérifié sur le chemin réel, par soumissions `multipart` reconstituées à partir des champs
`$ACTION_…` du balisage servi, comme T3.3 à T3.5.** Un serveur de développement d'une session
précédente était encore actif (`localhost:3001`) ; réutilisé tel quel plutôt que d'en relancer un
second, Turbopack rechargeant les fichiers modifiés sans redémarrage. Cinq gestes joués et relus en
base à chaque étape : création avec deux participants ; retrait de l'un, ajout d'un troisième — la
ligne `activities` relue avec un `updated_at` **inchangé à la milliseconde**, la preuve que
`syncParticipants` tourne indépendamment de `activityRowUnchanged` ; re-soumission strictement
identique sans doublon ; participant forgé refusé par la couche d'accès (voir l'entrée ci-dessus,
défaut trouvé puis corrigé à cette étape) ; édition tentée sous le cookie de Sofia Marchand,
non-contributrice de ce projet, refusée avec la ligne intacte. L'activité de vérification a été
archivée en fin de parcours (règle 4), et non reprise en base autrement — contrairement à T3.3 et
T3.5, aucune trace de vérification n'est restée visible dans la roadmap.

**C4 (découpage) — Aucun chemin de correction pour une ressource ni pour un résultat, et c'est une
lecture stricte de `docs/05`.** Le document écrit « Création et édition de projet » et « Activités :
création, édition, changement d'état » ; pour les deux lignes de C4 il n'écrit que « Saisie
déclarative : libellé, valeur, unité, date, lien vers l'outil » et « Lien, titre, type saisi,
rattachement facultatif à une activité ». Le verbe manque, donc le découpage n'a pas créé le ticket
— arbitrage rendu avec l'humain en ouverture de session. **Conséquence assumée** : une URL mal
collée ou une valeur d'audit mal recopiée reste telle quelle dans l'interface, alors que le produit,
le projet et l'activité se corrigent tous depuis T2.5, T2.6 et T3.4. C'est le premier objet de Vision
qui s'écrit sans se relire. À reprendre avec le ticket d'archivage déjà attendu en C7 pour le produit
et le projet, qui traitera les deux gestes manquants du même mouvement — corriger et ranger.

**C4 (découpage) — `resources.source_updated_at` n'est saisi par aucun ticket.** La colonne existe
depuis T1.2 (`docs/04` §4, « date de mise à jour côté source, si connue »), mais la ligne de
`docs/05` §3 ne nomme que le lien, le titre, le type et le rattachement. Elle restera nulle sur toute
ressource créée par l'interface. Deux façons de la remplir un jour : une saisie à la main, qui
demanderait à quelqu'un d'aller lire une date dans SharePoint, ou la synchronisation des métadonnées
— explicitement hors périmètre du POC (`docs/05` §4, « le lien suffit ; la synchronisation demande
des autorisations Graph longues à obtenir »). La seconde est la seule qui vaille, et elle n'est pas
pour ce POC.

**C4 (découpage) — Relier une ressource ne déplace pas la fraîcheur du projet, et `docs/03` §8 peut
se lire autrement.** Le document dit « la date la plus récente parmi ses activités **et
modifications** ». T2.1 a tranché le calcul sur les seules activités, `planned` exclues, et T3.3 à
T3.6 l'ont vérifié par l'écran quatre fois. Le découpage de C4 ne rouvre pas cette décision : aucun
de ses tickets n'appelle `refreshLastActivity`. **Le désaccord potentiel est consigné, pas arbitré**
— si l'usage montre qu'un projet vivant paraît figé parce que ses contributeurs y attachent des
liens sans saisir d'activité, c'est cette note qu'il faudra relire, et la question sera celle du sens
de la colonne : « dernière activité » ou « dernière écriture ».

**C4 (découpage) — Trois colonnes du schéma restent sans aucun geste après C4.** `tools.base_url`,
`results.external_ref` et `results.synced_at` ont été créées en T1.2 pour éviter une migration le
jour où Ergonome exposera son API (`docs/04` §4, D15). Aucun ticket de C4 ne les écrit ni ne les lit :
le lien profond se colle en entier dans `results.external_url` plutôt que de se composer à partir de
`base_url` et d'un identifiant, parce que rien du POC ne connaît la forme d'une URL d'Ergonome.
`tools.base_url` est d'ailleurs vide sur les quatre outils de la fixture. À reprendre avec le
branchement de niveau 3, pas avant.

**C4 (découpage) — Les deux résultats de la fixture n'ont pas de lien profond, et T4.3 en fait un cas
normal plutôt qu'un manque à combler.** Le point était déjà ouvert dans `ETAT.md` depuis T1.5 : le
brief §7 nomme l'outil (« résultat 62/100, lien Ergonome ») sans donner d'adresse, et rien n'a été
inventé. La conséquence est un critère de validation, et c'est ce qui en fait un bon critère : sur les
deux entrées de roadmap qui portent un résultat, la valeur s'affiche et **aucun lien sortant n'est
rendu**. Une ressource, elle, n'existe pas sans URL — la colonne est non nulle, et
`scripts/seed.ts` a dû inventer une adresse en `.invalid` pour la seule ressource semée. Les deux
objets ne traitent donc pas l'absence de lien de la même façon, et c'est le schéma qui le décide :
`resources.url` est obligatoire, `results.external_url` ne l'est pas.

**C4 (découpage) — Deux panneaux latéraux sur une même page, l'inconnue technique de C4.** T3.2 a
posé un panneau ouvert par un paramètre d'URL, le contenu rendu `inert` derrière lui. C4 en ajoute
deux — `?ressource=` en T4.2, `?resultat=` en T4.4 —, et la page projet portera donc trois
paramètres d'ouverture pour trois panneaux. Le découpage impose leur **exclusion mutuelle** dès T4.2
plutôt que de la laisser arriver en T4.4 : deux `role="dialog"` simultanés, ou deux `inert`
concurrents, ne sont pas rattrapables après coup. C'est le seul endroit de C4 où le ticket rencontre
quelque chose que C3 n'a pas déjà éprouvé. Noter aussi que le point ouvert d'`ETAT.md` sur la
coquille de navigation — focalisable derrière le voile sans JavaScript, le layout ne recevant pas les
`searchParams` — vaudra pour ces deux panneaux comme pour le premier, et qu'une seconde modale est
exactement la condition que cette note se donnait pour être reprise.

**C4 (découpage) — La maquette place la saisie du résultat dans le panneau d'activité ; le découpage
l'en sort.** `vision.html` ligne 667 montre une case « Activité terminée — ajouter un résultat » qui
révèle quatre champs en pied du panneau. T3.2 avait déjà renvoyé ce bloc à C4 dans ses interdits.
Écarté en découpage, pour deux raisons, arbitrage rendu avec l'humain : sans JavaScript une case ne
révèle rien — la limite déjà rencontrée par « à planifier » en T3.3, où la note sous la case a dû
énoncer la règle que le refus fait respecter — et une soumission unique écrirait `activities` puis
`results` sans transaction, ce qui aggraverait la note de non-atomicité ouverte par T2.6 et rouverte
par T3.6. Le résultat se saisit donc dans un panneau à lui, ouvert depuis l'entrée de roadmap. **Ce
que ce choix coûte** : le geste « je termine mon audit et je pose sa valeur » demande deux ouvertures
de panneau au lieu d'une. À rouvrir si l'usage montre que la seconde ne se fait jamais.

**T4.1 — L'ordre du bloc « Ressources » est tranché ici, faute d'être écrit nulle part.** Retenu :
**la plus récemment reliée en tête** — `created_at desc`, `id` en départage pour qu'un affichage ne
varie jamais d'un rechargement à l'autre. Arbitrage rendu avec l'humain avant écriture, parmi trois
options présentées. La raison est un manque plutôt qu'une préférence : une ressource n'a **aucune
date propre à l'écran**. `source_updated_at` existe dans le schéma mais aucun ticket de C4 ne la
saisit (note du découpage ci-dessus), et le rattachement à une activité est facultatif — trier sur
la période de l'activité aurait donc laissé les ressources non rattachées sans clé, et rejoué en
plus le tri à cinq groupes de `listProjectRoadmap`, instable dès qu'une activité change d'état.
`created_at` est la seule date qui existe, et elle répond au geste que C4 installe : on relie une
restitution, on la retrouve en tête.

**T4.1 — Le lien sortant ouvre un nouvel onglet.** `docs/06` §8 exige qu'il soit « reconnaissable
avant le clic » et ne dit rien de la cible. `components/ui/external-link.tsx` porte donc
`target="_blank" rel="noreferrer"` — arbitrage rendu avec l'humain : partir consulter un PowerPoint
ne doit pas coûter la page projet, la plus consultée du produit. `rel="noreferrer"` couvre
`noopener` dans tous les navigateurs qui portent `target="_blank"` ; l'inverse n'est pas vrai. La
marque est **une forme et un texte** (`docs/06` §11) : un chevron `aria-hidden` collé au titre par
une espace insécable, et « (lien externe, nouvel onglet) » en `sr-only` — retirer la couleur au lien
ne lui retire ni l'une ni l'autre. T4.3 reprendra le composant tel quel.

**T4.1 — Une ressource rattachée à une activité archivée affiche quand même son libellé.** Troisième
arbitrage rendu avec l'humain. C'est la règle « on décrit, on ne propose pas » de T3.3/T3.4, ici
appliquée à une jointure plutôt qu'à un référentiel : `listProjectRoadmap` affiche déjà le libellé
d'un **type** archivé, et la lecture des ressources ne filtre donc pas l'activité jointe sur son
`archived_at`. Le libellé est du texte, il ne mène nulle part. **Écart à connaître** : la roadmap
n'affiche aucune activité archivée, si bien qu'une ressource peut nommer une activité que l'écran ne
montre plus. Le cas n'est pas atteignable par l'interface — rien n'archive une activité (note
ouverte depuis T3.3) — mais la base de développement en porte cinq, et le test le couvre nommément.

**T4.1 — Les deux filtres de domaine des jointures sont infalsifiables sur des données légitimes.**
Découvert en mettant les tests en défaut, et c'est le seul résultat inattendu du ticket. Retirer
`filter(activities)` ou `filter(activityTypes)` de `listProjectResources` ne faisait tomber **aucun**
des dix tests écrits par la couche scopée, pour une raison de fond : la jointure porte sur une **clé
primaire** (`activities.id = resources.activity_id`), et `assertPreconditions` refuse déjà d'écrire
un rattachement hors domaine — aucune ligne honnête ne peut faire mentir la jointure. Deux tests ont
donc été ajoutés qui **écrivent directement par `db`**, hors de la couche, exactement ce qu'elle
interdit : une ressource du domaine B pointant une activité de A, puis une activité de B pointant un
type de A. C'est le seul endroit du projet qui contourne la couche, et il le fait pour éprouver ce
qu'elle ne peut pas produire. Ce faisant, la propriété relevée de T2.2 à T3.1 s'est vérifiée une
sixième fois, **mesurée cette fois-ci** : `filter(activities)` retiré seul ne fait toujours rien
tomber — `filter(activityTypes)` le rattrape, le type de l'activité étrangère relevant lui aussi de
l'autre domaine —, `filter(activityTypes)` retiré seul fait tomber le second test, et les deux
retirés ensemble font tomber les deux. Les neuf neutralisations jouées : filtre de projet **4** tests,
`isNull(archived_at)` **2**, le tri **1**, `filter(resources)` **1**, les deux filtres de jointure
**2**, les trois ensemble **3**, et les `leftJoin` passés en `innerJoin` **5**.

**T4.1 — Le séparateur « · » du bloc s'écarte du jeton employé par les trois écrans précédents.**
La page produit, la liste transverse et l'en-tête de projet écrivent leur `·` en
`content-neutral-light`, **mesuré ici à 2,22:1** sur la surface de section. Les trois le font entre
deux éléments visuellement distincts — une pastille de statut et une période, un libellé et une
valeur de filtre. Dans ce bloc, « PowerPoint » et « Test utilisateur » ont exactement la même taille
et la même graisse : un séparateur qu'on devine y laisserait lire « PowerPoint Test utilisateur ».
Il garde donc la couleur du texte qu'il sépare, `content-neutral-base`, **4,98:1** — aucun couple
neuf n'est introduit, c'est celui du texte lui-même. Le glyphe reste `aria-hidden` : ce sont les
mentions `sr-only` « Type : » et « Activité : » qui portent l'information pour l'assistance, la
règle de T2.3.

**T4.1 — L'état vide du bloc est un paragraphe et non un `EmptyState`.** La règle 5 en fait un écran
à part entière, et `EmptyState` est la forme que le produit lui donne depuis T1.6 — mais il porte un
`h2` et une hauteur pensés pour un bloc pleine largeur, là où « Ressources » occupe une demi-colonne
de la grille sous le `h2` de sa propre section. Deux `h2` empilés dans une même carte casseraient la
hiérarchie des titres vérifiée en audit (`docs/06` §11). Le paragraphe reprend mot pour mot celui que
`REFERENCE_BLOCKS` portait depuis T2.4 : il dit ce que le bloc contiendra, ce qu'un état vide doit
dire. **Ce qu'il ne dit pas encore**, c'est le geste qui l'y met — T4.2 l'ajoutera aux deux
emplacements, en tête du bloc et dans l'état vide, comme `Roadmap` le fait depuis T3.2.

**T4.1 — La vignette de format de la maquette est écartée.** `vision.html` place devant chaque
ressource un carré de 34 px, filet et rayon compris, portant les initiales du format en 9 px. La
fiche l'interdit (« aucune vignette, aucune icône de format inventée hors du design system »), et la
règle 2 le confirmerait seule : ni la taille du carré, ni celle du texte, ni son interlettrage
`.02em` n'existent dans `app/tokens.css` — le même manque d'interlettrage que T3.1 avait déjà
consigné. Le type s'écrit donc en toutes lettres, ce que la fiche demande par ailleurs.

**T4.1 — Vérifié sur le HTML servi, serveur de développement d'une session précédente réutilisé.**
Comme T3.6 : `localhost:3001` était encore actif, Turbopack ayant rechargé les fichiers modifiés
sans redémarrage. Aucun navigateur n'a été piloté — le ticket ne pose ni action, ni panneau, ni
JavaScript, et ce qui restait à éprouver était le rendu serveur. L'ordre de tabulation a été
**extrait du rendu** et non supposé : chez la responsable de domaine, le lien de la ressource est le
**47ᵉ et dernier** élément focalisable de la page, après les gestes de roadmap ; chez une membre non
contributrice, le **10ᵉ et dernier**, la roadmap n'offrant alors aucun lien. Le bloc n'ajoute donc
qu'un arrêt par ressource, et nulle part ailleurs.

**14/08/2026, hors ticket — `ETAT.md` avait dérivé de sa propre convention.** Le fichier faisait
855 lignes / 78 Ko, lu intégralement à chaque session (protocole étape 1, rendu obligatoire par
`AGENTS.md`), soit ~22–25k tokens avant la moindre ligne de code. Deux causes. **La première est
écrite dans le fichier lui-même** : le sous-titre du « Journal des tickets » dit « une ligne par
ticket terminé », et les entrées faisaient 15 à 32 lignes — T4.1 seul en faisait 32. **La seconde
est un mode de croissance** : un point ouvert recevait un addendum par ticket plutôt que d'être
récrit, si bien que la dette du design system portait six alinéas dont trois disaient « T3.3
n'ajoute rien », « T3.4 n'ajoute rien non plus », « T4.1 n'ajoute rien non plus » — trois phrases
pour dire qu'une règle tient, ce qui est son état normal. Sept points refermés y occupaient encore
la place, dont un de 35 lignes. **Effet plus grave que le poids** : un point ouvert qui compte ne se
distinguait plus d'un point rangé.

**14/08/2026, hors ticket — un quatrième fichier de suivi que `CLAUDE.md` ne connaît pas.**
`HISTORIQUE-TICKETS.md` reçoit les 463 lignes de récit, à la ligne près, plus les points refermés.
Il n'est pas lu au démarrage. **La table « Où écrire quoi » de `CLAUDE.md` n'en porte pas de ligne**,
et la règle 7 m'interdit de l'y mettre : le texte à coller a été proposé à l'humain. Tant qu'elle
n'y est pas, le protocole ignore ce fichier. Même remarque pour `AGENTS.md`, dont la section « Droits
d'écriture » énumère trois fichiers ouverts et devrait en compter quatre.

**14/08/2026, hors ticket — la règle 4 ne s'applique pas à la base de développement.** Quatre points
ouverts distincts inventoriaient sa dérive (T2.6, T3.3, T3.5, plus des lignes orphelines d'une
session antérieure), chacun justifiant par la règle 4 le fait de n'avoir rien défait. **Arbitrage
rendu avec l'humain : la base de développement est jetable.** La règle 4 protège la donnée métier,
pas une fixture locale. Conséquence assumée et désormais écrite une seule fois : un critère de
ticket passé ne s'y relit pas nécessairement — ceux de T2.1 à T2.4 se lisaient sur « 2
accompagnements » et s'y liraient sur 3. **Il n'existe pas de `db:reset`** : `db:seed` ignore ce
qu'il n'a pas semé, si bien qu'aucune commande ne ramène la base à la fixture. Non traité — ce
serait un ticket d'outillage, hors du périmètre de tout ticket C4.

**14/08/2026, hors ticket — la condition d'ouverture d'un point ouvert peut être atteinte sans que
personne le voie.** Le point sur la coquille de navigation focalisable derrière le voile se donnait
pour condition d'être repris « si une seconde modale arrive ». `?ressource=` de T4.2 est cette
seconde modale, et **la fiche T4.2 ne la mentionne pas** — elle demande l'exclusion mutuelle des
paramètres, ce qui est un autre sujet, et ne porte pas `app/(app)/layout.tsx`. Arbitrage rendu avec
l'humain : noté, pas traité en T4.2, et rattaché au ticket de la barre latérale. **À en tirer une
discipline** : un point ouvert dont la destination est une condition (« si X arrive ») doit être
relu au découpage de chaque chantier, sans quoi la condition s'atteint en silence.

**14/08/2026, hors ticket — les cinq disciplines de vérification n'existaient que par répétition.**
`ETAT.md` les désignait comme le vrai levier — « tant qu'elles ne sont pas écrites dans `CLAUDE.md`,
un ticket peut être correct **et** non vérifié » — sans jamais les lister. Elles ont été extraites
des dix-neuf récits, où elles reviennent à l'identique : le critère lu dans le HTML servi et jamais
affirmé ; les tests mis en défaut avant d'être crus ; le contraste mesuré avant d'être cru ; le
droit éprouvé par l'action et non par l'écran ; le parcours joué sans une ligne de JavaScript. Le
texte a été proposé à l'humain pour l'étape 4 du protocole. **Je ne peux pas l'y écrire** (règle 7),
et c'est précisément pourquoi la dette a tenu dix-neuf tickets.

**14/08/2026, hors ticket — incohérence documentaire assumée : `docs/05` §5 écrit « Sept
chantiers », il y en a huit.** Le chantier ajouté est l'archivage et la correction, décidé avec
l'humain et placé entre C4 et C5. **Ce n'est pas un oubli de découpage, c'est une absence du
cadrage** : `docs/05` §3 distribue « création et édition » pour le produit et le projet, « création,
édition, changement d'état » pour l'activité, et pour la ressource et le résultat seulement « saisie
déclarative » — le verbe *corriger* n'apparaît nulle part, et *ranger* pas davantage. Six manques
s'étaient accumulés dans `ETAT.md` sans destination réelle avant d'être réunis. `docs/` étant figé,
la divergence vit dans `ETAT.md` seul, et le document de cadrage n'est pas touché.

**14/08/2026, hors ticket — le numéro d'un chantier n'est pas son rang, et c'est la règle 6 qui
l'impose.** Placer le nouveau chantier « entre C4 et C5 » invitait à renuméroter : C5 archivage,
C6 indicateurs, C7 liens, C8 finitions. **Impossible sans falsifier des décisions figées.** L'inventaire
avant décision : « C7 » est écrit dans **`docs/07` D25** (écran des référentiels), **D28** (budget)
et **D37** (SSO reporté en C7), que la règle 6 interdit de rouvrir ; deux fois dans `docs/05` §7 ;
trois fois dans `tickets-C4.md`, dont la ligne d'interdits communs qui renvoie « budget (C7) » ; et
onze fois dans ce journal. Une renumérotation aurait fait coexister deux sens du même identifiant,
sans moyen de les distinguer à la lecture. **Le chantier prend donc le numéro libre C8 et s'exécute
en cinquième position** ; ses tickets s'appellent T8.1, T8.2… sans collision avec les T5.x du
chantier des indicateurs. Conséquence heureuse, vérifiée : aucune destination existante n'a eu à
bouger — « `/a-propos`, C7 au plus tard », « barre latérale, C7 », « (D25, C7) » restent justes,
C7 valant toujours Finitions. **À retenir pour tout chantier ajouté plus tard** : le numéro
identifie, la table d'avancement classe.

**14/08/2026, hors ticket — la règle 7 a été enfreinte sur instruction explicite de l'humain, et
c'est consigné ici parce que c'en est l'endroit.** `CLAUDE.md` et `AGENTS.md` ont reçu trois
modifications que j'avais d'abord refusé de faire, textes fournis et validés par l'humain avant
écriture : (1) la ligne `HISTORIQUE-TICKETS.md` dans la table « Où écrire quoi » ; (2) les cinq
disciplines de vérification à l'étape 4 du protocole de ticket ; (3) `AGENTS.md` passant de trois à
quatre fichiers ouverts, et de `tickets-C3.md` — périmé, C3 étant clos — au `tickets-*.md` du
chantier courant. **Le raisonnement, à connaître pour la prochaine fois** : la règle 7 a été posée
en T1.1 après que `next dev` eut ajouté de lui-même un bloc `nextjs-agent-rules` en fin de
`CLAUDE.md`. Elle vise l'écriture **silencieuse** par un outil, pas la main de l'humain passant par
moi sur un texte qu'il a lu et approuvé. **L'exception ne vaut pas précédent** : hors instruction
explicite portant sur un texte déjà validé, ces deux fichiers restent fermés, et la formulation
absolue de la règle reste la bonne — c'est elle qui a fait que la question a été posée plutôt que
tranchée toute seule. Le garde-fou technique reste en place : `agentRules: false` dans
`next.config.ts`, et la vérification « aucun outil ne modifie `CLAUDE.md` » du §« Droits d'écriture »
d'`AGENTS.md` est inchangée.

**14/08/2026, hors ticket — les cinq disciplines n'étaient pas une invention, mais une extraction.**
Elles ont été relevées dans les dix-neuf récits de tickets de T1.1 à T4.1, où elles reviennent aux
mêmes mots : « le critère est tenu et lu dans le HTML servi, pas affirmé », « les tests ont été mis
en défaut avant d'être crus », « le contraste a été mesuré avant d'être cru », « le droit a été
éprouvé par l'action et pas par l'écran », « le parcours a été joué sans une ligne de JavaScript ».
Aucune n'a été ajoutée ni reformulée au passage. **Ce qui change en les écrivant** : elles cessent
d'être une habitude que chaque session redécouvre en lisant les récits — ce qui était précisément
l'argument pour alléger `ETAT.md`, et qui l'aurait sinon vidé de sa substance.

**14/08/2026, hors ticket — pourquoi le mécanisme anti-embonpoint n'est pas une règle de plus.**
`ETAT.md` portait déjà en sous-titre « une ligne par ticket terminé », et dix-neuf tickets d'affilée
ont écrit entre 15 et 32 lignes. **Une règle écrite avait donc déjà échoué dix-neuf fois**, et en
ajouter une seconde aurait reproduit l'échec. Le diagnostic retenu : ce n'était pas un oubli mais une
pression — le récit de vérification était vrai et utile, et n'avait aucun autre endroit où aller.
Trois leviers ont été posés à la place, dans cet ordre d'efficacité décroissante. **(1) La cause est
supprimée** : `HISTORIQUE-TICKETS.md` existe et `CLAUDE.md` le nomme, la soupape est ouverte.
**(2) Le repliage de fin de chantier** — un chantier clos devient une ligne — est ce qui rend
`ETAT.md` **borné** et non pas seulement lent à croître : sans lui, une ligne par ticket donne
encore ~90 lignes de journal en fin de projet (≈45 tickets × 2 lignes) ; avec lui, la section reste
à ~15 lignes pour toujours. **(3) Un seuil chiffré, 250 lignes**, parce que « court par conception »
figure dans `CLAUDE.md` depuis T1.1 et n'a rien arrêté, là qu'un nombre se contrôle en une commande.
Régime permanent estimé : ~165 lignes / 13 Ko, quel que soit le nombre de chantiers restants.

**14/08/2026, hors ticket — `CLAUDE.md` ne décrivait pas la session de découpage, qui avait pourtant
déjà eu lieu deux fois.** `877c740` et `cb93744` ont découpé C3 et C4 sans qu'aucun document ne dise
ce qu'une telle session fait, ni qu'elle écrit `tickets-C<n>.md`. Le protocole de ticket la
présupposait — son étape 1 dit « lire la fiche du ticket dans `tickets-*.md` » — sans dire d'où la
fiche vient. La section neuve comble ce trou et y accroche le balayage d'`ETAT.md`, au moment exact
où un lot de points ouverts se referme. **Deuxième exception à la règle 7 dans la même journée**, sur
instruction explicite et texte validé d'avance ; elle ne vaut pas plus précédent que la première.

**14/08/2026, hors ticket — le repliage de C1 à C3 est volontairement reporté.** Les trois chantiers
clos occupent 18 des 19 lignes du journal des tickets et pourraient se replier immédiatement.
Arbitrage rendu avec l'humain : **le geste s'éprouvera d'abord sur C4 fraîchement clos**, à la
session de découpage de C8, où les quatre chantiers se replieront ensemble. Un geste de fin de
chantier vaut mieux d'être essayé sur un chantier dont on se souvient que sur trois qu'on relit.
`ETAT.md` porte la dette en tête de sa section « Journal des tickets » pour qu'elle ne se perde pas.

**14/08/2026, hors ticket — le chantier « C8 » est renommé « C4bis », quelques heures après avoir
été nommé. La note ci-dessus sur « le numéro identifie, il ne classe pas » est caduque.** Son
analyse de contrainte reste juste — renuméroter falsifierait D25, D28 et D37 —, mais sa
**conclusion était fausse** : j'en avais déduit qu'il fallait un numéro libre, alors qu'un nom
intercalaire satisfait les deux exigences à la fois. C5, C6 et C7 gardent le sens de `docs/05`,
**et** le nom dit sa place sans qu'on ait rien à expliquer. **Ce qui l'a révélé** : l'humain, auteur
de la décision de placement la veille, a lu « découpage de C8 » comme « on saute à la fin » et a
demandé pourquoi on ne procédait pas dans l'ordre. **Le coût réel avait été sous-estimé** : j'avais
noté le risque en décidant — « seule nouveauté à expliquer, une ligne de la table n'est pas à sa
place numérique » — et je l'avais rangé comme une gêne cosmétique, compensable par sept lignes de
note sous la table. Il s'est manifesté en moins d'une journée, sur la personne la mieux informée du
projet. **La leçon à garder** : un identifiant qu'il faut expliquer à chaque lecture est un mauvais
identifiant, et le nombre de lignes de note nécessaires pour le défendre en est la mesure — sept
ici, zéro pour `C4bis`. Les tickets s'appellent T4bis.1, T4bis.2… La note sous la table d'avancement
est supprimée, devenue inutile. Les mentions de « C8 » qui subsistent dans les trois entrées de
journal précédentes sont laissées telles quelles : elles datent la décision, celle-ci la corrige.

**14/08/2026, hors ticket — la session de découpage gagne un déclencheur, un geste 0 et un plan
mode.** La première version de la section, écrite le matin même, avait trois manques qui n'ont été
vus qu'en cherchant quel prompt taper en fin de chantier — la question de l'humain a servi de test.
**(1) Aucun déclencheur.** Le protocole de ticket dit « à appliquer intégralement dès qu'un ticket
est annoncé, sans qu'on ait à le rappeler » ; la section de découpage ne disait rien d'équivalent,
donc rien ne garantissait qu'une session future s'y réfère au lieu d'improviser. La phrase est
calquée sur celle du protocole. **(2) Aucun plan mode.** C'était le manque sérieux : une session de
découpage écrit `tickets-C<n>.md`, qui gouverne **tout un chantier**, là où un ticket isolé — bien
moins engageant — exige déjà une validation explicite à l'étape 2. Rien n'empêchait d'écrire le
fichier directement. **(3) Aucun geste sur les points « À trancher ».** Ce groupe est défini dans
`ETAT.md` par « sinon les tickets suivants héritent du problème » : une session de découpage est donc
le moment exact où il se paie, et il devient le geste 0. La preuve était sous la main — la décision
sur l'archivage, prise hors rituel, a changé l'ordre de tous les chantiers restants. **À retenir sur
la méthode** : les trois manques n'ont pas été trouvés en relisant la section, mais en se demandant
ce qu'il faudrait taper pour la déclencher. Un rituel se teste par son point d'entrée.

**14/08/2026, hors ticket — la lecture conditionnelle ne couvrait pas le découpage, et le trou ne
se voyait pas sur C4bis.** La table de `CLAUDE.md` s'ouvre sur « **Si le ticket touche à…** » : une
session de découpage n'étant pas un ticket, rien n'instruisait de lire `docs/05` §5, qui est
pourtant le seul endroit où le contenu de chaque chantier est défini. **Le trou était invisible sur
le prochain découpage** — la matière de C4bis vit dans `ETAT.md`, six manques numérotés qu'un `grep`
suffit à rassembler. Il devient béant sur le suivant : `ETAT.md` ne dit de C5 que son titre,
« Indicateurs et temps long », soit quatre mots, là où `docs/05` §5 lui donne trois lignes et où
`docs/04` porte `indicators`, `indicator_readings` et `project_indicators`. Une session aurait
découpé six tickets sur quatre mots sans que rien ne le signale. Une phrase dans l'intro de la
section étend explicitement la table au découpage. **Deuxième manque trouvé en simulant l'usage
plutôt qu'en relisant** — comme le déclencheur, le plan mode et le geste 0 quelques heures plus tôt.
Le rituel a été éprouvé sur le chantier suivant, où il tombait juste, puis sur celui d'après, où il
tombait à côté : **un rituel se teste sur le cas qu'il ne traite pas encore.**

**T4.2 — `ExternalLink` rend le `href` tel quel, et c'est la saisie qui doit s'en occuper.** Le
composant de T4.1 pose `<a href={resource.url}>` sans rien filtrer, ce qui est le comportement
attendu d'un composant d'affichage. La conséquence ne l'était pas : une adresse `javascript:` ou
`data:text/html,…` enregistrée dans `resources.url` **s'exécuterait au clic sur le titre**, sur la
page la plus consultée du produit. Le contrôle est donc posé à l'écriture, dans
`validateResourceForm` — `new URL()` puis `protocol === "http:" || "https:"` — et pas au rendu :
c'est le dernier endroit où l'on décide encore de ce qui entre, et le seul qui puisse rendre un
message de champ. **La fiche de T4.2 ne demandait que « URL vide » parmi ses quatre refus** ; celui-ci
s'y ajoute comme partie de la validation du champ, pas comme fonctionnalité. `new URL` rejette du
même geste les adresses relatives — une ressource est par définition hébergée ailleurs. **Rien
n'appelle l'adresse** : on analyse une chaîne, on ne fait aucune requête sortante (interdit de la
fiche). **À reprendre** si un jour une ressource peut se corriger (C4bis) ou s'importer autrement
que par ce formulaire : le contrôle vit dans `lib/forms/resource.ts`, il ne protège que ce qui y
passe.

**T4.2 — L'exclusivité de deux paramètres d'ouverture se tient par une variable, pas par une
discipline.** `?activite=` et `?ressource=` cohabitent depuis ce ticket, et `?resultat=` arrive en
T4.4. La forme retenue tient en deux lignes en tête de la page : `conflict` si les deux clés sont
présentes, puis `asked` — l'objet vide en cas de conflit, les paramètres sinon. **Tout le reste de la
page lit `asked`, jamais les paramètres bruts**, si bien qu'aucun chemin ne peut ouvrir deux panneaux.
Écrire à la place trois conditions qui s'excluent mutuellement aurait tenu aussi, et aurait cessé de
tenir au quatrième paramètre — la garantie doit être dans une valeur, pas dans la relecture. Le
comportement retenu, arbitré avec l'humain : **deux clés n'ouvrent rien**. Aucune préséance inventée
entre deux gestes de même rang, et c'est déjà ce que la page fait de toute valeur d'`?activite=`
qu'elle ne reconnaît pas. Conséquence à connaître : une URL portant les deux rend la page nue sans
rien dire — inatteignable par l'interface, aucun lien ne la construit.

**T4.2 — Le groupe « Annulé » est écarté des activités proposées, sans être refusé par l'action.**
Une activité annulée n'a rien produit : la proposer au rattachement d'une ressource n'aurait aucun
sens. Elle reste pourtant **acceptée** si une soumission forgée la désigne — « ce qu'on ne propose
pas, on continue de l'accepter », la règle posée en T3.4 pour un type d'activité archivé. Ce n'est
pas une négligence : une activité a pu produire un document avant d'être abandonnée, et la ressource
qui le référence décrit un fait. Ce que l'action refuse, elle, est ce qui serait **faux** : une
activité d'un autre projet, ou archivée. **Aucune requête neuve pour ces options** — elles se
dérivent de `listProjectRoadmap`, déjà lue par l'écran, dont les archivées sont déjà absentes ;
`lib/queries/activities.ts` n'est pas dans le périmètre de la fiche, et n'avait pas à y entrer.

**T4.2 — Troisième copie de `PanelField`, et la dette est désormais chiffrée.** `project-form.tsx`
(T2.5), `activity-panel.tsx` (T3.3) et maintenant `resource-panel.tsx` portent chacun un composant de
champ de quinze lignes, quasi identiques — les deux panneaux le sont exactement, seul celui du
formulaire de page diffère par la taille et le poids de l'intitulé. La copie n'a pas été évitable
ici : `activity-panel.tsx` ne l'exporte pas et n'appartient pas au périmètre de T4.2. **L'extraction
appartient au premier ticket qui pourra toucher les trois fichiers ensemble** — aucun de C4, C5 ou C6
ne le fait, donc ce n'est pas une destination, c'est une dette. Le vrai coût n'est pas la
duplication du balisage mais celle des **choix mesurés** qu'il porte : bordure de contrôle, bordure
d'erreur, mention « (obligatoire) » écrite plutôt qu'étoilée. Un quatrième formulaire qui les
recopierait de mémoire finirait par en inventer un septième.

**T4.2 — `createResource` ne revalide que la page du projet, et c'est une décision.** `refresh()`
revalide quatre chemins, dont la liste des produits et la page du produit, **parce qu'une écriture
d'activité fait recalculer `last_activity_at` par la couche**. Relier une ressource n'est pas une
activité : la fraîcheur ne bouge pas, et appeler `refresh()` aurait fait croire le contraire à qui
lit le fichier. Un seul `revalidatePath(ROUTES.project(projectId))`, avec la raison en commentaire.
C'est aussi ce que l'interdit de la fiche demande, lu à l'endroit : « aucun recalcul de
`last_activity_at` ».

**T4.2 — `openProject` reçoit son message de refus en paramètre.** Le texte disait « La saisie d'une
activité est réservée… », ce qui aurait été faux sous le panneau de ressource. Le paramètre porte une
valeur par défaut égale au texte existant : **aucun appel existant ne change**, et les deux gestes
gardent le même droit — `docs/02` §5 range activités et ressources dans ce que le contributeur
désigné écrit. Seul le mot change, jamais la règle.

**T4.3 — La date d'un résultat se lit au jour, et D13 n'est pas enfreinte.** D13 pose « le mois »
comme unité de temps **de la roadmap**, et l'en-tête de `lib/format.ts` l'écrit en toutes lettres :
« Un audit "de juin 2026" ne gagne rien à devenir "du 30 juin 2026" ». `formatDay` fait exactement
cela, et le critère de la fiche l'exige — « 31 mai 2024 ». La contradiction n'est qu'apparente :
D13 parle des **périodes d'accompagnement**, qui s'étalent, tandis que `results.measured_on` est un
fait ponctuel produit par un outil externe, que D39 autorise à reporter « avec sa date ». Un audit
rendu le 31 mai perdrait son sens en « mai 2024 », qui laisserait croire à un travail étalé.
**L'entorse est bornée par le fait que `formatDay` n'a qu'un appelant** : le jour où une **période**
d'activité s'affichera au jour, ce sera une infraction, pas une extension. La docstring de la
fonction porte la raison, et `ETAT.md` a récrit le point ouvert qui guettait ce déclencheur — il n'a
pas été déclenché.

**T4.3 — `Intl.NumberFormat` sur un `numeric(18,4)` : une perte de précision assumée.** Le pilote
rend « 62.0000 » ; l'affichage doit dire « 62 ». La voie retenue passe par `Number(value)`, donc par
un flottant 64 bits : au-delà de 2^53 le chiffre affiché cesserait d'être celui de la colonne, qui
va jusqu'à 10^14. Deux options ont été écartées. Découper la chaîne à la main donnait l'exactitude
mais perdait la virgule française et le groupement des milliers, qu'il aurait fallu réécrire.
`Intl.NumberFormat.format` accepte une **chaîne** depuis ES2023 et formaterait sans perte, mais
c'est une nouveauté de plateforme dont rien d'autre dans le projet ne dépend. Retenu : le flottant,
la limite écrite dans la docstring. **Aucun score, taux ou durée d'audit n'approche 2^53** — et le
jour où une valeur le ferait, le contrat unique de `docs/02` §5 aurait un autre problème.

**T4.3 — `results_activity_unique` ignore l'archivage, et cela ferme une porte à C4bis.** La
contrainte porte sur `activity_id` **seul**. Un résultat archivé occupe donc toujours la place : la
base refuse d'en écrire un second sur la même activité. Découvert en écrivant les tests, où une
liaison forgée visait une activité qui portait déjà un résultat archivé — la contrainte a fait
tomber le test avant qu'une lecture ne le fasse. **Conséquence pour C4bis** : « archiver puis
ressaisir » n'est pas un chemin de correction possible pour un résultat. Il faudra une édition en
place, ou une unicité partielle (`where archived_at is null`), donc une migration. Consigné au point
ouvert du chantier plutôt qu'ici seul, parce qu'il en change la matière.

**T4.3 — L'unité d'un résultat est du texte libre, et son espacement est une règle de deux lignes.**
`results.unit` est un `text` nullable : rien n'en borne le contenu, et le critère de la fiche en met
deux formes côte à côte — « 62/100 » collé, « 68 % » séparé. La règle retenue est la plus courte qui
les produise toutes les deux : **collé si l'unité commence par `/`, insécable sinon**. Elle est
typographiquement juste pour le français (`%`, `s`, `€`, `pts`) et pour les fractions. Ce qu'elle ne
couvre pas : une unité qui commencerait par une autre ponctuation collante — `°` par exemple — se
verrait séparée. Aucune n'existe, et inventer une liste de caractères collants aurait été une règle
que rien ne demande. **L'insécable ne se vérifie pas à l'œil** : elle a été relue sur le point de
code dans le HTML servi (`0xa0`), et un test l'éprouve par la négative — `not.toContain(" ")` avec
une espace ordinaire, faute de quoi le test passerait le jour où la règle sauterait.

**T4.3 — Un fichier de tests pour `lib/format.ts`, écart de périmètre déclaré.** La fiche ne nomme
que `lib/format.ts`, qui n'avait aucun test depuis T1.1. Le ticket y pose trois règles muettes — les
zéros de queue, l'insécable, le fuseau du jour — dont **aucune n'est éprouvable depuis les tests de
lecture** : `listProjectRoadmap` remonte la chaîne brute, le formatage n'étant pas son travail. Lues
dans le HTML servi, elles ne se vérifient que sur les deux résultats de la fixture, et aucun cas
limite ne l'est — décimale, millier, unité absente, premier du mois. Le fichier ne couvre **que les
deux fonctions du ticket** : un fichier de tests neuf n'est pas une invitation à couvrir les six
autres, qui appartiennent aux tickets qui les ont écrites.

**14/08/2026, hors ticket — la cinquième discipline de vérification est retirée, le jour même où
elle avait été écrite.** « Le parcours se joue sans une ligne de JavaScript » quitte l'étape 4 du
protocole, qui compte désormais **quatre disciplines**. Décision de l'humain, prise après enquête.

**Ce que la règle n'était pas.** Ni une décision de `docs/07`, ni une contrainte de fondation :
le mot « JavaScript » n'apparaît **nulle part** dans `docs/01` à `docs/07`. La règle 6 ne la
protégeait donc pas. Elle datait de la veille au plus, extraite des dix-neuf récits de T1.1 à T4.1
— voir l'entrée « les cinq disciplines n'étaient pas une invention, mais une extraction » plus haut
dans ce fichier. **Elle n'a jamais interdit d'écrire du JavaScript**, et il faut le dire clairement
pour qu'aucune session ne la relise après coup comme une interdiction rétroactive : six composants
portent `"use client"` — `focus-trap`, `main-nav`, `product-form`, `project-form`, `activity-panel`,
`resource-panel` — et `useActionState` est employé depuis T2.5. La formulation disait « se joue »,
donc une discipline de **vérification** ; elle a été lue et appliquée comme une contrainte de
**conception**, et c'est cet écart entre les deux lectures qui a fini par coûter.

**Ce qu'elle a coûté, trois fois.** (1) **T2.6** — « on n'ajoute qu'une personne par
enregistrement », faute de champ répétable, limite écrite dans l'écran et reportée jusqu'à C7.
(2) **T2.4** — l'édition en place des champs simples du produit écartée au profit d'une page
`/produits/{id}/modifier`, l'un des trois motifs étant qu'un second état de la page produit aurait
fait deux rendus à tenir. (3) **Arbitrage (b) de `tickets-C4.md`** — la case « Activité terminée —
ajouter un résultat » de la maquette écartée parce qu'une case « ne peut rien révéler sans
JavaScript ». **Et elle n'a pas protégé l'accessibilité, contrairement à l'intuition** : sans
JavaScript, la coquille de navigation reste focalisable derrière le voile et `aria-modal` est
absent. C'est `FocusTrap` — donc JavaScript — qui répare. La règle a donc payé un prix de
conception pour une garantie qu'elle ne rendait pas.

**Ce que le retrait fait perdre, et c'est une dette assumée, pas un oubli.** Le rejeu d'une
soumission `multipart` reconstituée à la main **sans en-tête `Next-Action`** n'est plus nommé nulle
part dans `CLAUDE.md`. Or c'est exactement ce qu'envoie un client hostile, et c'était l'unique mode
opératoire de la discipline qui reste — « le droit s'éprouve par l'action, jamais par l'écran ».
Sans lui, cette quatrième discipline risque de redevenir une intention que chaque session
réinterprète. **La réserve a été formulée avant décision et écartée en connaissance de cause.**
La technique, elle, reste décrite en détail dans ce journal, aux entrées **T2.5** (les champs
`$ACTION_REF_1`, `$ACTION_1:0`, `$ACTION_KEY` du balisage servi), **T3.4** (« sans en-tête
`Next-Action` — c'est-à-dire exactement ce qu'envoie un navigateur sans JavaScript ») et **T4.2**.
Une session qui doit éprouver un droit va les y chercher.

**Ce qui n'a pas bougé.** `tickets-C4.md` garde la contrainte dans la validation de **T4.4**,
ticket suivant : un `tickets-*.md` n'est ouvert qu'en session de découpage, et le coût y est nul —
T4.4 reprend les mécaniques d'URL de T3.2 et T4.2, déjà éprouvées. `docs/` est figé et muet sur le
sujet. `AGENTS.md` ne mentionne pas la règle. Aucun fichier de `app/`, `components/` ou `lib/`
n'est touché : **rien de ce qui est livré n'est rouvert**, la règle change ce qui est exigé demain,
pas ce qui a été fait hier.

**Seconde exception à la règle 7, et le raisonnement est celui du 14/08.** L'édition de `CLAUDE.md`
a été faite par moi, sur instruction explicite et sur un texte présenté puis validé avant écriture.
La règle 7 vise l'écriture **silencieuse** par un outil — elle a été posée en T1.1 après que
`next dev` eut ajouté de lui-même un bloc en fin de fichier —, pas la main de l'humain passant par
moi. **L'exception ne vaut toujours pas précédent** : hors instruction explicite portant sur un
texte déjà validé, `CLAUDE.md` et `AGENTS.md` restent fermés. Le garde-fou technique est inchangé
(`agentRules: false` dans `next.config.ts`).

**T4.4 — `Number` n'est pas un validateur de colonne `numeric`, et le croire aurait rendu un 500.**
Le premier jet validait la valeur par `Number.isFinite(Number(v))`, puis écrivait la chaîne **telle
qu'elle avait été tapée**. Trois entrées passent ce contrôle et font lever PostgreSQL : « 0x10 »
(hexadécimal, 16), « 1e5 » (notation scientifique, 100000) et « Infinity ». Une soumission forgée
aurait donc obtenu une erreur de base, donc un 500, exactement là où l'on attend un message de champ
— le même piège que celui de `lib/uuid.ts`, à un type près. **Le contrôle est devenu une forme**
(`/^-?(?:\d+|\d*[.,]\d+)$/`), calée sur ce que la colonne accepte et non sur ce que JavaScript sait
lire, plus un plafond de quatorze chiffres avant la virgule — `numeric(18, 4)` : la précision moins
l'échelle. Les décimales, elles, sont arrondies par la colonne et n'ont rien à refuser. **À retenir
au-delà de ce ticket** : valider avec les outils du langage puis écrire dans la base, ce sont deux
grammaires, et la seconde est la seule qui compte.

**T4.4 — la virgule décimale est acceptée, et c'est une conséquence de T4.3.** `formatResultValue`
rend « 74,5 » à l'écran, `fr-FR` oblige. Refuser « 74,5 » en saisie aurait tendu un piège à qui
recopie le chiffre qu'il voit juste à côté. La normalisation vit donc dans `lib/forms/result.ts`, et
`values` (ce qui revient à la personne) diverge volontairement d'`input` (ce qui part en base) :
« 74,5 » d'un côté, « 74.5 » de l'autre. **L'aller-retour complet a été vérifié**, pas supposé —
tapé « 74,5 », relu « 74,5/100 » dans le HTML servi.

**T4.4 — un sixième refus que la fiche ne listait pas, et pourquoi il n'est pas hors périmètre.**
La fiche en énumère cinq et pose par ailleurs que le point d'entrée n'existe que sur une activité
terminée **dont le type porte `produces_result`**. Ces deux phrases ne peuvent pas être vraies
ensemble sans un contrôle dans l'action : une soumission forgée vers une activité terminée d'un type
non producteur passait les cinq refus. Le contrôle a donc été ajouté, forgé et vu refuser. **Ce n'est
pas une fonctionnalité de plus au sens de la règle 3** : c'est la quatrième discipline de
vérification appliquée à une condition que la fiche énonce elle-même. La distinction à garder : un
écran qui montre moins que ce que l'action accepte est un défaut, pas une simplification.

**T4.4 — la règle du résultat sur activité terminée vit dans `lib/db/scoped.ts`, et elle y reste.**
`assertPreconditions` lève `IntegrityError` — et non `DomainScopeError`, ce que le premier jet du
`catch` avait supposé. Deux classes distinctes, deux messages distincts. La fiche demandait de
« laisser refuser » plutôt que de réécrire la règle dans l'action : c'est la première écriture du
produit dont une règle métier est portée par la couche d'accès, parce qu'elle traverse deux tables
et qu'aucune clé étrangère ne sait le faire. L'action ne fait que rendre le refus lisible.

**T4.4 — le contrôle d'unicité lit `includeArchived`, et ce n'est pas un excès de prudence.**
`results_activity_unique` porte sur `activity_id` **seul** et ignore `archived_at` — le piège relevé
par T4.3, consigné à `ETAT.md`. Un `list` par défaut écarte les archivées : une ligne archivée
aurait donc bloqué l'insertion sans que la pré-vérification la voie, transformant un message en 500.
Le chemin n'est pas atteignable — rien n'archive un résultat avant C4bis — et c'est exactement
pourquoi le contrôle épouse la **contrainte** plutôt que le cas courant. **Course résiduelle
assumée** : entre ce contrôle et l'insertion, `neon-http` n'offre aucune transaction interactive, et
deux soumissions simultanées sur la même activité verraient la seconde lever une violation
d'unicité non rattrapée. C'est la dette de non-atomicité déjà inscrite, ni élargie ni refermée.

**T4.4 — la dérive de la base de développement a servi le ticket, et il faut le dire.** Le plan
prévoyait de fabriquer le cas manquant — aucune activité de la **fixture** n'est terminée, d'un type
producteur et sans résultat — en faisant passer un Audit UX par les gestes de T3.5. Inutile : la
base de développement portait déjà ce cas, l'une des « quatre transitions non revenues en arrière
depuis T3.5 ». **Le ticket a donc été vérifié sur un état que `db:seed` ne reproduit pas.** La règle
du 14/08 tient — la base de développement est jetable — mais la conséquence mérite d'être écrite :
qui rejouera cette vérification sur une base fraîche devra d'abord terminer une activité d'audit.

**T4.4 — quatrième copie de `PanelField`, et la dette a maintenant un coût mesurable.**
`project-form.tsx` (T2.5), `activity-panel.tsx` (T3.3), `resource-panel.tsx` (T4.2), et celle-ci.
Aucun des trois ne l'exporte, et aucun n'appartenait au périmètre. Le composant est identique aux
quatre exemplaires — même balisage, mêmes jetons, même règle du « (obligatoire) » écrit et non
marqué d'une étoile. **L'extraction appartient au ticket qui pourra toucher les quatre fichiers
ensemble** ; à quatre copies, ce ticket devient difficile à repousser encore.

**T4.4 — `$ACTION_REF_1` est rendu sans attribut `value`, et l'omettre fait échouer l'action.**
Piège de vérification, pas de production. Le harnais de rejeu récoltait les champs cachés par
`name="…" value="…"` et manquait donc celui-là, rendu `<input type="hidden" name="$ACTION_REF_1"/>`.
Next répondait « Failed to find Server Action », ce qui **ressemble à un refus** et n'en est pas un —
de quoi conclure faussement qu'un droit a tenu. **À retenir pour tout rejeu futur** : un navigateur
poste les champs cachés sans `value` avec une valeur vide, et le harnais doit faire pareil ; un
message d'erreur de Next n'est jamais la preuve qu'une règle du produit a joué.

**C4bis (découpage) — `archive()` existe depuis T1.3 et n'a jamais eu un seul appelant.** C'est le
constat qui fonde le chantier, et il se mesure : `grep -rn '\.archive('` sur `app/`, `components/`,
`lib/` et `scripts/` ne rend rien. La fonction est écrite, documentée, couverte par les tests de
`lib/db/scoped.test.ts` — et morte. **À retenir : une couche testée ne prouve pas qu'un geste
existe.** Les quatre chantiers livrés ont tous branché ce qu'ils écrivaient ; celui-ci existe parce
que personne n'a vérifié qu'une fonction de la couche avait un chemin depuis l'interface. Le même
`grep` passé sur les autres membres de l'API rend au moins un appelant partout — `unlink` dans
`syncParticipants` et `syncMembers`, `refreshLastActivity` dans `scripts/seed.ts:1053`. **`archive`
était le seul orphelin**, et c'est ce qui rend le chantier borné.

**C4bis (découpage) — « un projet archivé est-il en lecture seule ? » n'a de réponse nulle part.**
F1-D3 dit qu'un projet s'archive et ne se supprime jamais ; `docs/04` §1 pose l'archivage
systématique ; D42 dit que ce n'est pas un statut. **Aucun des trois ne dit ce qu'un projet archivé
autorise.** Le silence n'était pas neutre : depuis T1.4, `writeProject` ignore `archived_at`, donc un
contributeur désigné écrit dans un projet archivé — ce qui vide le geste de son sens avant même qu'il
existe. Tranché en session : **lecture seule stricte**, portée par `openProject` et `openActivity`,
les deux seules portes des cinq écritures de la page projet. Ce n'est pas une décision de `docs/07`
rouverte, c'est un silence comblé — mais il valait d'être noté comme tel.

**C4bis (découpage) — le rétablissement est asymétrique, et c'est assumé.** Produit et projet se
rétablissent, activité, ressource et résultat non. La raison est topographique, pas doctrinale : les
deux premiers ont une page qui reste servie après archivage et peut donc porter le retour ; les trois
autres n'existent qu'à l'intérieur d'un écran dont ils viennent de disparaître. Leur donner un retour
demanderait un écran des éléments archivés — un septième écran (`docs/06` §2) pour un geste rare, là
où une activité se ressaisit en moins d'une minute (`docs/05` §7, signal 1). **Si le POC montre qu'on
archive par erreur plus souvent qu'on ne le croit, c'est cet arbitrage qu'il faudra rouvrir en
premier**, et non la lecture seule.

**C4bis (découpage) — « Rétablir » n'est nommé par aucun document.** `docs/02` et `docs/04` donnent
« archiver » ; le verbe inverse n'apparaît nulle part, ni dans le glossaire, ni dans les décisions.
« Désarchiver » était l'autre candidat, dérivé du mot documenté mais laid à l'écran. Choix retenu :
**« Rétablir »**, sans appui documentaire. Le vocabulaire du CLAUDE.md n'est pas enfreint — il porte
des concepts, pas des verbes d'interface —, mais c'est une invention, et elle est consignée pour être
corrigée d'un seul geste si le glossaire tranche autrement.

**C4bis (découpage) — T4bis.6 portera la première migration depuis T1.2, et T4.4 l'avait annoncée.**
`results_activity_unique` porte sur `activity_id` seul et ignore `archived_at` : archiver un résultat
ne libère pas son activité. T4.3 a relevé le piège, T4.4 l'a **épousé** plutôt que contourné — son
contrôle d'unicité lit `includeArchived: true`, ce qui était juste tant que rien n'archivait un
résultat. L'index partiel de T4bis.6 rend ce `includeArchived` **faux** : il interdirait la ressaisie
que la migration vient d'autoriser. Les deux se relisent dans le même ticket, jamais l'un sans
l'autre — c'est écrit dans la fiche, et c'est le seul endroit du chantier où un ticket doit défaire
une ligne écrite par un ticket antérieur.

**C4bis (découpage) — la perte silencieuse d'une liaison pèse plus lourd qu'un `select` amputé, et
c'est ce qui met T4bis.1 en tête.** Le point ouvert hérité de C4 parlait d'« une entité ou un produit
archivé [qui] exigerait un nouveau choix » : vrai, visible, réparable par l'utilisateur. Le cas grave
est ailleurs. `project_jobs`, `project_approaches` et `project_members` se saisissent par cases à
cocher, et une case absente du rendu **ne revient pas dans le `FormData`** : les diffs de
`projets/actions.ts` concluent alors que la liaison a été retirée. Un métier archivé disparaît donc du
projet à la première re-soumission, sans que rien ne s'affiche. Le ticket vient en tête du chantier
pour cette raison, et son critère se compte **en base** — l'écran ne peut pas témoigner de ce qu'il
n'affiche plus.

**C4bis (découpage) — `events` connaît le verbe `archived`, et le chantier ne l'écrit pas.**
`docs/04` §4 liste `archived` parmi les cinq verbes du journal, aux côtés de `created`, `updated`,
`state_changed` et `linked`. C4bis livre cinq gestes d'archivage et **n'écrit aucune ligne
d'`events`** : le journal est le chantier C6 entier, et l'ouvrir à moitié ici poserait une seconde
autorité sur une table que personne n'a encore branchée. Conséquence à connaître : **quand C6
arrivera, le journal démarrera vide sur des archivages déjà effectués.** C'est la même situation que
pour toutes les écritures de C2 à C4bis, et elle n'est pas propre à l'archivage.

**C4bis (découpage) — le mécanisme d'entretien d'`ETAT.md` a tenu, et voici sa mesure.** Le fichier
était à 250 lignes exactement, son plafond. Après les quatre gestes : **188 lignes**, soit 62 de
marge pour six tickets. Les trois postes, mesurés section par section : la section « Journal des
tickets » passe de 52 lignes à 17 — les 22 lignes de ticket repliées en quatre lignes de chantier,
la note de repliage exécutée —, soit **35 rendues** ; la sortie du point sur `CLAUDE.md` en rend
**12** ; la récriture du point C4bis, 23 lignes d'addenda accumulés de T4.1 à T4.4 devenues six, en
rend **17**. Le total dépasse le delta observé de deux lignes, reprises par les destinations posées
sur deux points de la section b. **Ce qui compte n'est pas le compte mais son classement : le
repliage rend le plus, la récriture vient juste après, et c'est elle qu'on saute** — un addendum
coûte une ligne à l'écrire et n'en coûte aucune à ne pas replier. Le seuil de 250 lignes dit quand
agir, jamais quoi replier.

**T4bis.1 — la fiche annonçait un critère que son périmètre ne pouvait pas produire.** « Une
re-soumission à l'identique laisse `project_jobs`, `project_approaches` et `project_members`
inchangés » : les quatre fichiers annoncés ne touchent que des lectures, et `checkReferences`
(`app/(app)/projets/actions.ts`) valide ces trois liaisons par `list`, qui écarte les archivés. La
case serait bien revenue cochée dans le HTML, et la soumission aurait été **refusée par un message
de champ** — la perte silencieuse échangée contre un formulaire qu'on ne peut plus enregistrer.
Deux options ont été posées à l'humain avant écriture : périmètre strict, avec le manque consigné
pour un ticket ultérieur, ou extension d'un septième fichier. Tranché : **extension**. La leçon
générale, pour les cinq tickets qui suivent : **une exception d'archivage écrite dans une lecture
n'est pas terminée tant que l'écriture qui reçoit cette valeur n'a pas été relue.** Le couple
lecture/validation est le vrai périmètre, jamais la lecture seule.

**T4bis.1 — l'exception se rapproche de la base, jamais de la soumission.** `checkReferences` tolère
les identifiants archivés que le projet **porte déjà**, et ces identifiants viennent de
`findProjectLinks`, lecture scopée, pas du `FormData`. Écrire le contraire — un `includeArchived:
true` sur les trois `list` — aurait été trois caractères de moins et une porte ouverte : n'importe
quelle soumission forgée aurait pu lier une valeur archivée à un projet qui ne la portait pas. Les
deux cas ont été éprouvés séparément, en modification et en création, et refusés tous les deux.
C'est la même famille de vigilance que le rappel « un argument lié n'est pas un secret » : la
soumission ne se valide jamais elle-même.

**T4bis.1 — `is_active` et `archived_at` sont deux filtres, et un seul était visible.** La lecture
des personnes portait `where: eq(persons.isActive, true)` ; le second filtre était posé par la
couche, hors du fichier. Poser `includeArchived: true` pour l'exception **retire silencieusement**
ce second filtre, et il faut le réécrire à la main dans le `where`. Le piège est propre à
`scope.list` : le filtre qu'on ne voit pas est celui qu'on oublie de rétablir. Un test dédié le
tient, sur une personne désactivée sans être archivée — cas que la fixture ne portait pas et qui
n'existe nulle part en base de développement.

**T4bis.1 — dette assumée : la lecture des entités est dupliquée entre deux écrans.**
`/produits/[id]/modifier` passe désormais par `listProductFormOptions` ; `/produits/nouveau` garde
son `session.db.list(entities, …)` en ligne, la fiche disant que le formulaire de création « ne
change pas d'un caractère » et la page n'étant pas au périmètre (règle 3). Les deux tris ont été
alignés sur `asc(entities.label)` pour que la duplication ne devienne pas une divergence. → **à
refermer par le ticket qui touchera `/produits/nouveau`, sans urgence.**

**T4bis.1 — un commentaire de `lib/queries/activities.ts` est devenu faux, et n'a pas été corrigé.**
L'en-tête de `listActivityFormOptions` dit de `keepActivityTypeId` : « c'est le seul endroit du
produit où une exception d'archivage est nominative ». Ce ticket en pose six autres. Le fichier
n'est pas au périmètre, et la fiche interdit explicitement de rouvrir le panneau d'activité — « T3.4
est déjà juste, et le rouvrir serait réécrire ce qui sert de modèle ». L'incohérence est donc
consignée plutôt que corrigée. Même remarque sur `listResultToolOptions`, dont l'en-tête renvoie la
question « en C4bis » : c'est T4bis.6 qui la traitera, et l'en-tête le dit déjà correctement.

**T4bis.1 — la page de modification d'un accompagnement a perdu son `Promise.all`.** Les options du
formulaire dépendent désormais des liaisons de la ligne éditée : l'exception est nominative, elle ne
peut pas se construire avant de savoir ce que le projet porte. Deux allers-retours séquentiels là où
il y en avait deux en parallèle. Le coût est réel et assumé ; le supprimer demanderait de fusionner
`findProjectLinks` et `listProjectFormOptions` en une fonction qui ferait deux choses.

**T4bis.2 — aucune vérification n'a pu tourner, et c'est la dette la plus lourde de la session.**
L'environnement de cette session a refusé toute commande qui exécute du code : `npx tsc --noEmit`,
`npm run lint`, `npm test` et `next dev` ont tous rendu « requires approval », sept tentatives sous
quatre formes différentes comprises. Le ticket est donc livré **relu, jamais éprouvé** — et le
protocole exige l'inverse : « le critère se lit dans le HTML servi, jamais il ne s'affirme ». Ce
qui a été fait à la place est une relecture ligne à ligne, qui ne remplace rien : elle ne peut ni
compiler un `bind`, ni observer un `303`, ni compter des lignes en base. **La règle à en tirer,
pour la session qui reprend :** un ticket dont l'étape 4 n'a pas tourné n'est pas terminé, quel que
soit l'état du code — la ligne d'`ETAT.md` le dit, le point ouvert de la section « à trancher »
l'énumère discipline par discipline, et le commit porte la mention. Il vaut mieux un ticket
explicitement inachevé qu'un ticket dont on croit à tort qu'il a été éprouvé.

**T4bis.2 — « Rétablir » n'avait aucun chemin, et l'écart était invisible dans la fiche.** Le
périmètre annoncé listait six fichiers, tous côté application. Or `archive()` pose `archived_at`
(`lib/db/scoped.ts`) et **rien ne le retirait** : `update()` lève `IntegrityError` dès que
`archivedAt` figure dans les valeurs — un garde-fou de T1.3, délibéré —, `UpdateValues` l'exclut du
typage, et `eslint.config.mjs` interdit d'importer `lib/db/client` hors de `scoped.ts`. Les trois
verrous sont bons ; leur somme était une impasse. **Le motif est exactement celui de T4bis.1** — une
fiche qui annonce un critère que son périmètre ne peut pas produire —, à ceci près qu'il ne s'agit
plus d'une lecture oubliée mais d'un **verbe qui n'existe pas**. La leçon se généralise aux quatre
tickets restants du chantier : **avant d'écrire, chercher le verbe, pas seulement le fichier.**
T4bis.3 rétablit un accompagnement et trouvera `restore()` en place ; T4bis.4, T4bis.5 et T4bis.6
n'ont rien à rétablir (arbitrage (b)) et ne rouvriront donc pas la couche.

**T4bis.2 — `restore()` recalcule `last_activity_at` pour un chemin que rien n'appelle.** La branche
`activities` du `batch` est reprise d'`archive()` alors que l'arbitrage (b) exclut le rétablissement
d'une activité : aucune interface n'y mène, et aucune n'y mènera dans ce chantier. Elle est écrite
quand même, parce que l'en-tête de `lib/db/scoped.ts` promet que **toute écriture d'activité
recalcule le champ** — c'est l'une des trois règles que la base ne peut pas tenir seule, et une
promesse de couche qui ne vaudrait que pour les chemins actuellement branchés n'est pas une
promesse. Le test qui la couvre fait l'aller-retour complet : la date tombe à l'archivage, revient
au rétablissement. **Contrepartie assumée** : c'est du code sans appelant applicatif, que seul son
test exerce. La règle qui l'emporte est celle de `docs/04` §6 — une seule autorité sur un champ
dérivé, et elle est complète ou elle n'est pas.

**T4bis.2 — le refus d'un produit archivé ne pouvait pas passer par le `undefined` existant.** Le
tronc commun `submit` de `produits/actions.ts` traduisait déjà un `undefined` rendu par `write` en
« Ce produit n'existe plus dans ce domaine » — la ligne introuvable, inconnue ou d'un autre domaine,
que la couche scopée ne distingue pas. Réutiliser ce chemin pour le produit archivé aurait été gratuit
et **faux** : le produit existe, il est lisible, et sa page est servie deux clics plus loin. `write`
rend donc `string | { refused: string } | undefined`, et le refus nommé porte son propre message.
Trois caractères de plus qu'un `return undefined`, et un message qui ne ment pas.

**T4bis.2 — le mot « Rétablir » n'est écrit nulle part dans `docs/`, et le choix est ici.**
L'arbitrage (d) de `tickets-C4bis.md` pose « Archiver » — celui de `docs/04` §1 et de D42 — et
constate qu'aucun document ne nomme le retour. « Restaurer » a été écarté : il appartient au
vocabulaire de la sauvegarde, donc de la perte, et la règle 4 dit précisément qu'il n'y a pas de
perte. « Désarchiver » a été écarté aussi, comme tout verbe en dés- qui se lit comme une annulation
technique. **« Rétablir » dit qu'on remet une chose à sa place**, ce qui est exactement le geste. Le
libellé complet est « Rétablir ce produit », par symétrie avec « Modifier ce produit ».

**T4bis.2 — trou connu, non traité, règle 3 : `createProject` accepte un produit archivé.** Le
formulaire de création d'un accompagnement ne propose plus le produit archivé (T4bis.1 y a posé
l'exception nominative, qui ne joue qu'en édition), et la page produit n'affiche plus « Nouvel
accompagnement ». Mais `createProject` ne relit pas l'archivage du produit **reçu** :
`assertPreconditions` vérifie l'appartenance au domaine, jamais `archived_at`. Une soumission forgée
rattacherait donc un accompagnement neuf à un produit rangé — accompagnement qui n'apparaîtrait sur
aucune liste, les deux jointures écartant les projets d'un produit archivé. Le cas est **inatteignable
par l'interface** et n'est pas au périmètre de la fiche, qui nomme `updateProduct` et pas
`createProject`. → **à refermer par le ticket qui touchera `app/(app)/projets/actions.ts`**, T4bis.3
étant le premier candidat : il y écrit déjà la lecture seule d'un accompagnement archivé, et la
question « qu'accepte-t-on d'un parent rangé » y est exactement la même.

**T4bis.2 — la mention datée se lit au mois, et le jour aurait été une seconde entorse.** `docs/04`
§1 stocke `archived_at` en `timestamptz`, donc l'heure est là. D13 pose le mois comme unité de temps,
et `lib/format.ts` ne connaît **qu'une** entorse, documentée et bornée : `formatDay`, pour la date de
mesure d'un résultat, que D39 autorise nommément comme « valeur reportée d'un outil externe, avec sa
date ». Une date de rangement n'est ni l'une ni l'autre : c'est un fait interne, et savoir qu'un
produit a été rangé le 14 plutôt qu'en août n'ajoute rien à la lecture. `formatMonth` était déjà
exporté et prend un `Date` — `lib/format.ts` n'est donc pas entré au périmètre.

**T4bis.3 — les vérifications de T4bis.2 ont enfin pu tourner, et elles passent.** La dette la plus
lourde du chantier était que T4bis.2 n'avait obtenu le droit de lancer aucune commande. Cette
session les a jouées : `tsc --noEmit` muet, `lint` sans erreur (quatre avertissements
`no-unused-vars` sur les `_previous`/`_formData` des deux actions de confirmation, motif imposé par
la signature de `useActionState`), `vitest` à 379 tests verts sur 12 fichiers, `next dev` servant les
écrans. Les trois tests neufs de `products.test.ts` passent, et la mise en défaut du `select` de
`findProjectDetail` a été jouée sur le modèle qu'ils posaient. **Le point ouvert de T4bis.2 se
referme donc pour ce qui est mécanisable** — reste ce qui ne l'est pas : le parcours d'archivage
d'un **produit** dans le navigateur, et le refus (e) avec son compte, qu'aucune commande ne joue.

**T4bis.3 — une règle de lecture seule à cinq exemplaires aurait divergé ; deux portes existaient
déjà.** La tentation était d'ajouter le contrôle dans chacune des cinq actions, là où chacune
commence. `openProject` et `openActivity` couvraient déjà les cinq à elles deux — la première pour
les quatre gestes à formulaire, la seconde pour la transition et l'annulation. Deux lignes ont suffi,
et la propriété « aucune écriture sur un projet archivé » se **lit** dans le code au lieu de se
vérifier en relisant cinq fonctions. C'est le même geste qu'`assertPreconditions` dans la couche : la
règle vit à l'endroit que tout le monde traverse, pas à celui où elle se manifeste.

**T4bis.3 — le décompte d'exclusivité de T4.4 a servi dès le ticket suivant, et sans être touché.**
T4.2 posait la règle en une comparaison binaire ; T4.4 l'a récrite en décompte « pour rester juste
quand C5 ajoutera sa clé ». C'est T4bis.3 qui en a profité le premier, avec `archiver` : la ligne
`const keys = { … }` gagne une entrée, et **rien d'autre ne bouge** — ni la condition, ni `asked`, ni
le raisonnement. Un cas rare où une généralisation écrite en prévision d'un besoin lointain a été
payée par le ticket suivant.

**T4bis.3 — aucun composant n'a eu à changer, et c'est la discipline des `| null` qui l'a permis.**
`Roadmap` reçoit `addHref`, `editHref`, `resultHref`, `transitionActivity` et `cancelActivity`
nullables depuis T3.1 à T3.6, `Resources` son `addHref` depuis T4.1 — tous introduits pour le
**droit**. La lecture seule d'un accompagnement archivé est un second motif de les annuler, et il a
suffi d'un `&& !archived` sur `canWrite`. Aucun composant du périmètre n'a été ouvert : la fiche
listait sept fichiers, sept ont été touchés.

**T4bis.3 — arbitrage (a) posé pour cinq actions, appliqué à six.** La fiche énumère
`createActivity`, `updateActivity`, `transitionActivity`, `createResource` et `createResult`, toutes
dans `projets/[id]/actions.ts`. `updateProject` — le formulaire d'identité, dans `projets/actions.ts`
— est une **sixième** écriture, que la fiche ne nomme pas mais que la phrase d'ouverture de
l'arbitrage (a) couvre : « aucune écriture sur un projet archivé ». Le précédent était à portée :
T4bis.2 avait fait exactement ce contrôle sur `updateProduct`, et pour la même raison — une route en
404 ne protège pas l'action qu'elle affichait. Arbitrage rendu **avant écriture**, le fichier étant
déjà au périmètre pour l'archivage. La transposition a demandé le refus **nommé** `{ refused }` dans
`submit`, copie de celui de `produits/actions.ts` : sans lui, le seul canal était le `null` dont le
message dit « n'existe plus dans ce domaine », qui aurait été faux.

**T4bis.3 — rétablir un accompagnement sous un produit archivé le laisse invisible, et c'est
assumé.** L'état est atteignable, et même normal : l'arbitrage (e) n'autorise l'archivage d'un
produit que si **tous** ses accompagnements sont archivés, donc « produit rangé, accompagnements
rangés » est l'état courant après un archivage de produit. En rétablir un depuis sa page — qui reste
servie, et porte « Rétablir » pour le responsable — donne un projet vivant sous un produit rangé :
`listProjects` et `listProductProjects` l'écartent toutes deux par jointure, si bien que le geste
paraît ne rien faire. Deux options se présentaient : refuser muettement en retirant le point d'entrée
et en disant pourquoi à l'écran, au prix d'une colonne de plus dans `findProjectDetail` et **d'une
règle absente de la fiche** ; ou ne rien garder, l'arbitrage (f) posant qu'il n'y a pas de cascade et
le chantier interdisant d'ouvrir un septième arbitrage en cours de ticket. La seconde a été retenue,
et l'humain l'a tranchée avant écriture. Rien n'est perdu — rétablir le produit rend tout cohérent —
mais le geste est trompeur, et c'est un point ouvert. → **destination posée dans `ETAT.md`.**

**T4bis.3 — le trou `createProject` × produit archivé reste ouvert, contre l'attente du journal de
T4bis.2.** L'entrée précédente désignait « le ticket qui touchera `app/(app)/projets/actions.ts`,
T4bis.3 étant le premier candidat ». Le fichier a bien été touché, et le trou n'a **pas** été
refermé : la fiche de T4bis.3 porte l'interdit « aucun archivage de produit — T4bis.2 l'a livré, ce
ticket ne le rouvre pas », et règle 3. L'arbitrage a été posé avant écriture et tranché avec
l'humain. La note de T4bis.2 reste donc valide, son candidat en moins : **le prochain ticket qui
ouvrira `projets/actions.ts` sans en être empêché par sa fiche.**

**T4bis.3 — comment le droit a été éprouvé par l'action, et pourquoi le second temps compte.** La
première moitié de la discipline est facile à jouer et facile à mal jouer : reposter les cinq actions
après archivage et constater qu'elles sont refusées ne prouve rien à soi seul, puisqu'une charge
malformée, une clé d'action périmée ou un harnais qui n'atteint pas l'action produisent exactement le
même refus. Le protocole retenu, en expérience contrôlée : (1) récolter les sept charges sur la page
servie **avant** archivage — les champs `$ACTION_<n>:0` et `$ACTION_<n>:1` du balisage, où les
arguments liés se lisent **en clair**, comme les rappels de contexte le disent depuis T3.3 ; (2)
prouver que le harnais écrit, par une soumission témoin acceptée ; (3) archiver ; (4) reposter les
sept — toutes refusées, base relue **inchangée** au diff près d'`archived_at` ; (5) rétablir ; (6)
reposter **les mêmes charges, non retouchées** — les sept acceptées. C'est l'étape (6) qui ferme le
raisonnement : même charge, même cookie, deux états, deux issues. La garde d'`updateProject` a
demandé un pas de plus, sa route rendant 404 : elle a été **isolée** en neutralisant le `notFound()`
de `modifier/page.tsx` le temps d'une soumission — la page rend alors 200, l'action refuse seule, la
base ne bouge pas, et la ligne a été rétablie à l'identique aussitôt. **Un panneau absent du rendu n'a
jamais protégé le point d'entrée HTTP qui l'accompagne, et une route en 404 non plus.**

**T4bis.3 — dette assumée : les gardes d'action ne sont couvertes par aucun test.** Les deux lignes
qui portent toute la lecture seule — dans `openProject` et `openActivity` — ne sont vérifiées que par
la discipline de re-soumission ci-dessus, jouée à la main. Il n'existe pas de banc d'essai pour les
actions serveur dans ce dépôt : `vitest` couvre `lib/`, jamais `app/`. La mise en défaut a donc porté
sur ce qui est testable — retirer `archivedAt` du `select` de `findProjectDetail` fait tomber
exactement les deux tests neufs — et **pas** sur les gardes elles-mêmes. Neutraliser une garde ne
ferait tomber aucun test, et c'est un fait à dire plutôt qu'à laisser croire couvert. → **le jour où
un ticket d'outillage montera un banc d'essai pour les actions.**

**T4bis.3 — la base de développement a servi de terrain, et la règle du jetable a tenu.** Deux
activités de sonde ont été semées sur « Refonte du parcours de virement » pour que la roadmap offre
une transition et un rattachement de résultat — la fixture n'en portait aucune dans ces états. Les
sept re-soumissions acceptées de l'étape (6) ont ensuite écrit sept lignes « REPOST … » et renommé le
projet. Tout a été retiré en fin de session, et le projet remis sous son nom, son objectif et sa
fraîcheur d'origine. La dérive inventoriée dans `ETAT.md` n'a donc pas augmenté ; elle n'a pas
diminué non plus.

**T4bis.4 — le refus d'un résultat vivant ne se dit pas, il se retire de l'écran.** La fiche exige
que l'archivage d'une activité portant un résultat soit refusé ; elle ne dit pas comment ce refus se
donne à voir, et le geste est un formulaire nu, sans état où loger un message. Deux options : rendre
le geste toujours et faire remonter un refus lisible, au prix d'un `useActionState` par entrée de
roadmap — donc un composant client là où il n'y en avait pas —, ou faire disparaître le geste dès
qu'un résultat vivant est posé et laisser l'action refuser en silence. La seconde a été retenue : la
mécanique existe déjà à l'identique pour « Saisir un résultat » depuis T4.4, où **la même donnée
décide du lien et de l'action**, si bien que l'un ne peut pas survivre à l'autre ; et `activity.result`
est déjà porté par `RoadmapActivity`, donc aucune requête ne s'ajoute à l'écran. Le refus muet est
celui de `transitionActivity`, `cancelActivity` et `restoreProject`. **Contrepartie assumée, et
bornée : jusqu'à T4bis.6, une activité portant un résultat n'offre aucun chemin d'archivage et
l'écran n'en dit pas la raison.** T4bis.6 livre « Retirer le résultat », et le geste réapparaît de
lui-même — c'est l'ordre du chantier qui referme cette dette, pas un ticket à ouvrir.

**T4bis.4 — le geste traverse le groupe « Annulé », et ce n'est pas une entorse à T3.5.** `editHref`
n'est pas transmis à ce groupe depuis T3.5 : aucun retour en arrière depuis `cancelled`. La fiche
situe l'archivage « à côté de "Corriger" », ce qui pouvait se lire comme la même restriction.
Arbitrage tranché avant écriture : **l'archivage n'est pas une transition d'état.** Il ne fait pas
sortir de `cancelled`, il sort du récit — l'interdit de T3.5 porte sur le retour en arrière, pas sur
le rangement. Une activité saisie par erreur *puis* annulée est un cas ordinaire, et l'exclure
l'aurait laissée sans aucun chemin, soit exactement le manque (3) que le ticket referme. Lu dans le
HTML servi de « Test projet » : les deux entrées annulées portent « Archiver la saisie » et aucune ne
porte « Modifier ».

**T4bis.4 — « Archiver la saisie », parce que « Archiver » seul se confondrait avec « Annuler ».**
L'arbitrage (d) du chantier fixe le verbe — jamais « Ranger », jamais « Supprimer » — et la fiche
ajoute que l'écran doit distinguer l'archivage de l'annulation **par ses libellés**. Empilés dans la
même colonne d'actions, en même graisse et même taille, « Annuler » et « Archiver » ne se distinguent
que par deux lettres. Le complément porte le sens du geste : c'est la *saisie* qu'on retire, pas
l'activité qu'on annule. Le verbe de l'arbitrage (d) est conservé, l'`aria-label` porte l'activité
comme celui de « Modifier ».

**T4bis.4 — un cookie sans session ne prouve aucun refus, il en fabrique un faux — ou pire, une
acceptation.** Le premier essai du refus « membre non contributeur » a été joué sous le cookie de
Marc Tellier, choisi parce que `project_members.is_contributor` vaut `false` pour lui. La
re-soumission a **écrit**. La garde n'était pas en cause : `persons.has_access` est `false` pour
cette personne, `loadCurrentSession` rend donc `null`, et le repli du stub
(`lib/auth/provider.ts`, « tolérance propre au stub ») retombe sur la personne par défaut — le
responsable de domaine. Le cookie ne désignait personne, et la charge a été traitée avec tous les
droits. L'essai a été refait sous Awa Diallo — membre, `has_access = true`, contributrice d'un autre
projet —, et le refus a tenu : page servie sans aucun geste d'archivage, charge repostée refusée,
base inchangée. **À retenir pour les tickets suivants : le cookie du stub ne vaut que pour une
personne dont `has_access` est vrai ; sinon on éprouve le repli, pas le droit.** L'activité archivée
par erreur pendant cet essai a été rétablie aussitôt.

**T4bis.4 — `restore()` a servi pour la première fois sur une activité, hors interface et pour
réparer le terrain.** L'arbitrage (b) du chantier interdit tout rétablissement d'activité par
l'écran, et son en-tête dans `lib/db/scoped.ts` annonçait un chemin sans appelant. Les quatre
activités archivées en vérification — dont celle de l'essai raté ci-dessus — ont été rétablies par un
script jetable appelant `scope.restore(activities, id)`, hors du dépôt. Le rétablissement a recalculé
`last_activity_at` comme l'archivage l'avait fait : la fraîcheur d'« Espace client web » est repassée
d'août à octobre 2026 dans `/produits`. La branche `activities` de `restore`, écrite en T4bis.2 « pour
qu'une promesse de couche se tienne partout », s'est donc éprouvée sans qu'aucune interface n'y mène.
**La dérive inventoriée dans `ETAT.md` n'a pas augmenté.**

**T4bis.4 — la preuve du recalcul est une date lue à l'écran, pas une ligne de code relue.** La fiche
demande que la fraîcheur du produit ait changé dans `/produits` quand l'activité archivée était la
plus récente à avoir eu lieu. Le terrain a demandé d'être choisi plutôt que trouvé : archiver
n'importe quelle activité ne déplace rien à l'écran, la fraîcheur d'un produit étant le maximum sur
ses accompagnements vivants. C'est « Audit UX » (octobre 2026) sur « Autonomie des opérations
courantes » qui la portait pour « Espace client web » ; l'archiver a fait passer la ligne du produit
de « Dernière activité : octobre 2026 » à « août 2026 », `last_activity_at` du projet suivant de
2026-10-31 à 2026-08-31 — et **aucune ligne du ticket n'écrit ce champ.** C'est le `batch` d'`archive`
dans `lib/db/scoped.ts`, vérifié et non réécrit.

**T4bis.4 — la mise en défaut a porté sur ce qui est testable, et la dette de T4bis.3 tient toujours.**
Neutraliser `isNull(activities.archivedAt)` dans le `leftJoin` de `listProjectResources` fait tomber
**exactement un test** — le test inversé —, et rien d'autre : ni l'ordre, ni les deux liaisons
forgées, ni l'étanchéité. Le test frère, lui, ne tombe pas, et c'est voulu : il constate que la
ressource **reste** dans la lecture, propriété vraie des deux côtés du filtre, qui prouve que celui-ci
vit dans le `on` de la jointure et non dans le `where`. `archiveActivity` et sa garde du résultat
vivant, elles, ne sont couvertes par aucun test — `vitest` couvre `lib/`, jamais `app/`. La dette
relevée par T4bis.3 est donc inchangée, et le ticket ne prétend pas l'avoir réduite.

**T4bis.5 — l'écran garde ses deux verbes, la fiche garde sa prose.** La fiche dit « corriger » et
« retirer » ; l'écran dit déjà « Modifier » (le lien de correction d'une activité, `roadmap.tsx`) et
« Archiver » (l'arbitrage (d) du chantier, tenu par T4bis.2, .3 et .4). Arbitrage tranché avant
écriture : **aucun verbe neuf n'entre à l'écran.** Retenir « Corriger / Retirer » aurait fait quatre
verbes pour deux gestes, sur des objets voisins d'une même page. Le « à côté de "Corriger" » de la
fiche de T4bis.4 désignait déjà un lien libellé « Modifier » : c'est le même écart entre la prose
d'une fiche et le mot de l'interface, et il se tranche du même côté. Titre du panneau en correction :
« Modifier la ressource », bouton « Enregistrer les modifications ».

**T4bis.5 — l'exception nominative devait couvrir l'activité annulée, que la fiche ne nommait pas.**
La fiche demande que « le rattachement à une activité **archivée depuis** reste sélectionné sans être
proposé ». Or les options du panneau se dérivent de la roadmap **moins le groupe « Annulé »** : une
ressource rattachée à une activité annulée est exactement dans le même cas, et il est atteignable
aujourd'hui — le `select` retomberait sur « Aucune » et la première re-soumission détacherait la
ressource **en silence**, le défaut même que T4bis.1 a refermé. Arbitrage tranché avant écriture :
**une règle, un chemin de code**, `findResourceActivity` ne filtrant ni sur `archived_at` ni sur
`state`, et `checkResourceActivity` acceptant l'activité archivée **si et seulement si** c'est celle
que la ressource porte déjà (quatrième paramètre `keptActivityId`, `null` par défaut, `createResource`
inchangé). Vérifié en base et non à l'écran, car l'écran ne peut pas en témoigner depuis T4bis.4 : le
bloc n'affiche plus le libellé d'une activité archivée. Ouvrir la correction, ne rien changer,
enregistrer — `activity_id` identique avant et après, pour l'archivée comme pour l'annulée. Et le
panneau de **création** ne propose ni l'une ni l'autre : une option ajoutée, jamais deux.

**T4bis.5 — le test « autre domaine » ne prouvait pas ce qu'il semblait prouver.** La mise en défaut
de `filter(activities)` dans `findResourceActivity` n'a fait tomber **aucun** test. Le test qui
interroge une activité d'un autre domaine était en réalité porté par `filter(activityTypes)` : les
deux filtres se rattrapent l'un l'autre — la propriété relevée de T2.2 à T3.1 — et un test qui passe
par les deux ne pince ni l'un ni l'autre. Un test isolant a donc été **ajouté avant de croire la
discipline** : il forge par `db.insert` direct une activité du domaine A dont le type appartient au
domaine B, situation qu'aucune écriture de l'application ne produit, et que seul `filter(activities)`
peut refuser. La sabotage refait tombe alors exactement sur ce test. **À retenir : « le test tombe »
ne se vérifie qu'en retirant la règle une par une ; un test vert au retrait d'une règle est un test
qui ne la couvre pas, même s'il porte son nom.**

**T4bis.5 — un `<form>` ne tient pas dans un `<p>`, et le rendu servi s'en charge tout seul.** La
rangée de gestes de chaque entrée du bloc a d'abord été écrite dans un `<p>`, par symétrie avec la
ligne « Type · Activité » juste au-dessus. Un `<form>` est du contenu de flux : le navigateur ferme le
paragraphe avant lui et rouvre après, si bien que l'arbre rendu ne correspond plus au balisage servi —
et l'hydratation de React tombe dessus. Corrigé en `<div>`, avec la raison écrite sur place pour que
la symétrie ne soit pas rétablie par mégarde. **Le balisage servi et l'arbre du navigateur sont deux
choses ; seul le second décide.**

**T4bis.5 — `ACTION_LINK` est redit dans `resources.tsx`, dette assumée et bornée.** La constante
(`text-xs font-semibold text-content-primary-dark underline`) vit dans `roadmap.tsx` depuis T3.5, qui
ne l'exporte pas et n'est pas au périmètre du ticket (règle 3). Elle est donc recopiée, commentée
comme redite. Le couple `content-primary-dark` sur `surface-neutral-pale` est déjà celui de « Relier
une ressource » dans ce même bloc — **aucun couple neuf par la position** — et il a tout de même été
mesuré : **15,72:1**, AA et AAA atteints. Le jour où un troisième bloc porte la même rangée, la
constante mérite `components/ui/`.

**T4bis.5 — la variable `resources` de la page a dû céder son nom à la table.** `page.tsx` déstructure
la liste sous le nom `resources` depuis T4.1 ; le pré-remplissage du panneau demande d'importer la
**table** `resources` du schéma pour le `find`. La liste est renommée `projectResources`, la table
garde son nom — c'est elle qui vient du schéma, et un alias d'import aurait déplacé la surprise
ailleurs.

**T4bis.5 — la base de développement a été remise en état, et le serveur écoutait ailleurs.** Les
vérifications ont demandé deux ressources factices — l'une sur une activité archivée, l'autre sur une
annulée —, un projet archivé puis rétabli, et une ressource d'un **autre** accompagnement corrigée par
une charge dont les deux arguments liés étaient réécrits (écriture légitime : la responsable de domaine
a bien ce droit sur cette ligne). Toutes les lignes touchées ont été remises dans leur état de départ,
`archived_at` compris ; la dérive inventoriée dans `ETAT.md` augmente de deux ressources factices sur
« Test projet ». Le serveur de développement, lui, tournait déjà sur le port **3000** pour ce dépôt :
`next dev` refuse d'en lancer un second et le signale. Les relevés de T4bis.5 sont donc pris sur 3000,
là où ceux de la session précédente citaient 3001.

**T4bis.6 — `drizzle-kit` rend le `DROP CONSTRAINT` avant le `CREATE UNIQUE INDEX`, et c'est ce qu'il
fallait.** L'arbitrage gardait le nom `results_activity_unique` en passant d'une contrainte unique à un
index partiel : PostgreSQL l'accepte, à condition que la contrainte — qui possède son index — soit
retirée avant que le nouvel index ne prenne le nom. L'ordre n'était pas garanti par la documentation,
il a donc été **relu dans le fichier généré** avant d'être appliqué, et il était juste, sans retouche à
la main. La vérification vaut d'être refaite au prochain renommage d'index : rien ne promet cet ordre.

**T4bis.6 — `toolId` vient de la colonne, `toolName` de la jointure filtrée, et la différence est
volontaire.** `listProjectRoadmap` joint `tools` avec `filter(tools)` : sélectionner `tools.id` aurait
rendu `null` dès que le `tool_id` pointe l'outil d'un autre domaine — et le panneau de correction, qui
resélectionne l'outil, aurait alors silencieusement détaché un résultat parfaitement légitime dès qu'un
`tool_id` forgé traînait. `results.toolId` dit ce que la ligne **porte** ; la jointure dit ce qu'on a le
droit d'en **nommer**. Un test l'éprouve sur la ligne forgée du domaine `b` (`toolName` nul, `toolId`
intact), et c'est le seul endroit où la distinction se voit.

**T4bis.6 — la valeur d'un `numeric(18,4)` ne se réaffiche pas telle que la colonne la rend.** Le
pilote rend « 62.0000 » ; le poser dans le champ « Valeur » invitait à retaper. `toResultFormValues`
rogne les zéros décimaux non significatifs et **garde le point** — `lib/forms/` ne connaît aucune
locale, c'est `lib/format.ts` qui la porte, et l'importer là aurait mis une règle d'affichage dans un
module qui n'en a pas. Ce qui compte est le **tour complet**, et deux tests l'éprouvent : réaffiché,
resoumis sans être touché, le résultat réécrit la même valeur. La virgule reste acceptée en saisie ;
elle n'est simplement pas produite.

**T4bis.6 — la correction d'un résultat ne peut pas exiger `done`, et c'est un cas atteignable.** Un
résultat ne s'écrit que sur une activité terminée — `assertPreconditions` en reste la seule autorité —
mais `resolveActivityPeriod` (T3.4) redérive l'état quand la période bouge : corriger les dates d'une
activité terminée qui porte un résultat la fait passer en « prévu » ou « en cours », le résultat
restant accroché. Confiner « Corriger » et « Archiver le résultat » au groupe « Terminé » l'aurait
rendu **visible, incorrigible et irretirable**. Les deux gestes suivent donc le résultat, la saisie
seule garde les quatre conditions de T4.4. Ni la roadmap ni la page n'ont eu besoin d'une condition de
plus pour cela : c'est la même expression, à un `||` près.

**T4bis.6 — la mise en défaut a porté trois fois, et la leçon de T4bis.5 a été appliquée d'avance.**
(1) La contrainte totale rétablie à la main sur la branche de test fait tomber **le seul** test de
ressaisie, et rien d'autre — les deux autres tests du bloc éprouvent la règle qui survit à la
migration, ils devaient donc rester verts. (2) `keepToolId` neutralisée (`where` retiré,
`includeArchived` gardé) fait tomber le seul test qui isole l'exception — « l'exception ne retient que
celui-là » —, les autres passant faute d'être sensibles à une liste trop permissive. (3) Le filtre de
domaine de `tools` neutralisé dans la couche fait tomber ce même test isolant. C'est exactement le trou
que T4bis.5 avait découvert après coup sur `findResourceActivity` ; ici le test isolant a été écrit
avant, et il tient.

**T4bis.6 — « aucune alerte » pour le membre non contributeur n'est pas un défaut, et la preuve se fait
par différence.** `updateResult` refusé rend un message, mais le panneau qui l'afficherait n'est pas
monté pour qui ne peut pas écrire : la page revient nue. Constater l'absence d'alerte ne prouve donc
rien — ni que l'action a refusé, ni qu'elle a seulement été ignorée. La preuve retenue est la
**différence** : la même charge, non retouchée, n'écrit rien sous le cookie du membre et écrit sous
celui de la responsable. Même protocole pour la lecture seule : deux charges récoltées **avant**
l'archivage du projet, refusées après, puis acceptées telles quelles après rétablissement.

**T4bis.6 — la base de développement a été remise en état, sauf ce que le ticket devait y laisser.**
Les vérifications ont corrigé, retiré, ressaisi un résultat sur « Test projet », archivé puis rétabli
son accompagnement, archivé puis rétabli l'outil « Ergonome », et archivé une activité annulée par une
soumission de trop — celle-ci a été rétablie, l'autre activité archivée du même projet datant d'avant
la session. Ce qui **reste volontairement** : l'audit de « Test projet » porte deux résultats, un rangé
et un vivant, soit l'état que seule l'unicité partielle autorise et qu'aucune fixture ne produit.
`ETAT.md` en porte l'inventaire à jour.

**T4bis.6 — `ETAT.md` dépasse 250 lignes, et seul le repliage peut le corriger.** Le fichier finit à
**256** lignes. L'étape 5 du protocole demande de le balayer au-delà du seuil ; la session de découpage
se dit « le seul moment où `ETAT.md` se balaie », et le **repliage d'un chantier clos en une ligne**
est sa première étape. Les deux se contredisent ici, C4bis venant tout juste de se clore. Choix retenu :
**ne pas faire le travail du découpage**, resserrer les seuls paragraphes que ce ticket écrit ou rend
historiques — ce qui a rendu cinq lignes — et **nommer le dépassement dans `ETAT.md` avec sa cause et
son échéance**. Le repliage de C4bis rendra une quarantaine de lignes d'un coup.

**Découpage de C5 — écart assumé à `docs/02` §5 : un seul lieu de création d'un indicateur.** Le
document écrit qu'un projet « adopte un indicateur existant du produit, **ou en crée un nouveau** ».
L'arbitrage (c) de `tickets-C5.md` ne retient que la première moitié : la création vit sur la page
produit, et le panneau d'adoption de T5.4 renvoie vers elle quand le produit ne porte aucun
indicateur. **Ce n'est pas une décision rouverte** — `docs/07` ne porte rien sur ce point, D11 disant
seulement à qui l'indicateur appartient. La raison est chiffrée : trois copies de `PanelField`
existent déjà (T2.5, T3.3, T4.2), chacune portant les choix mesurés que le design system ne nomme
pas — bordure de contrôle, bordure d'erreur, mention « (obligatoire) » écrite. Un quatrième
formulaire les recopierait de mémoire, et c'est ainsi qu'un septième substitut s'invente. **À
rouvrir** le jour où l'usage montre qu'un contributeur crée ses indicateurs depuis le projet plutôt
que depuis le produit : le signal 3 de `docs/05` §7 est fait pour cela.

**Découpage de C5 — le droit d'écrire un indicateur n'existait dans aucun des deux droits posés.**
D23 dit « les contributeurs du projet saisissent les indicateurs » ; D1 et D11 posent que
l'indicateur appartient au **produit**. La page produit, elle, ne connaît que `manageDomain` depuis
T2.5. Les deux lectures possibles étaient : réserver la saisie au responsable de domaine, contre la
lettre de D23 ; ou dériver le droit des accompagnements du produit. Retenu, arbitrage (b) :
`manageDomain` **ou** contributeur désigné d'au moins un accompagnement de ce produit. Le calcul ne
coûte aucune requête — la page lit déjà ses accompagnements, et `session.can.writeProject` répond sur
chacun. **Aucun droit neuf n'entre dans `SessionRights`** : ce serait un troisième niveau là où D9
en pose deux, et le jour où Entra ID remplacera le stub, c'est `lib/auth/provider.ts` qui change,
pas la règle. L'action redérive le droit sur l'identifiant reçu, jamais sur ce que le rendu a décidé.

**Découpage de C5 — la deuxième migration du projet est décidée avant d'être écrite, et c'est
volontaire.** `indicator_readings` n'a pas d'`archived_at` (T1.2). Retirer un relevé saisi en double
n'avait donc que la suppression pour chemin, que la règle 4 interdit. Trois options étaient sur la
table : ne pas offrir le retrait — une correction rattrape toute erreur de saisie, jamais un doublon ;
ajouter la colonne ; ou traiter le relevé comme une liaison, ce qu'il n'est pas. Retenu : la colonne,
dans T5.3, **avec le geste qu'elle autorise** — une migration qui n'a pas de lecteur le jour où elle
est posée est une migration qu'on relira sans savoir pourquoi. La couche d'accès ne change pas d'une
ligne : `hasArchivedAt` introspecte le schéma, donc `archive`, `restore` et le filtre des vivants
couvrent la table du jour où la colonne existe. **C'est la première fois que cette propriété de T1.3
est éprouvée** ; si elle ne tient pas, c'est `lib/db/scoped.ts` qui a un défaut, pas T5.3.

**Découpage de C5 — le repliage de C4bis n'a coûté aucun geste, et c'est T4bis.1 qui l'avait payé
d'avance.** La section « C4bis » de `HISTORIQUE-TICKETS.md` a été ouverte le 14/08/2026 avec la
consigne de recopier chaque ligne de ticket **au fil de l'eau**, plutôt que d'attendre le repliage.
Le geste 1 de la session de découpage s'est donc réduit à supprimer les six lignes d'`ETAT.md` et à
poser la ligne de chantier : rien à déplacer, rien à récrire, rien à perdre. Les lignes d'`ETAT.md`
portaient davantage — les vérifications jouées, les charges refusées —, et ce détail vit dans le
récit détaillé, ticket par ticket. `ETAT.md` passe de **256 à 219 lignes**. **À garder pour C5** :
la section « C5 » de `HISTORIQUE-TICKETS.md` s'ouvre au premier ticket livré, avec la même consigne.

**T5.1 — le dernier relevé ne s'obtient pas par un `max()`, et la fixture du brief l'aurait
caché.** La lecture doit rendre, en une requête jointe, le décompte des relevés **et** la valeur du
plus récent. Le décompte est un `count`, la date un `max(read_on)` — mais la valeur portée par la
ligne la plus récente n'est pas la plus grande des valeurs. Sur la série du brief, croissante (54,
63, 71), un `max(value)` aurait rendu 71 et serait passé pour juste. Retenu :
`(array_agg(<colonne> order by read_on desc, id desc))[1]`, deux fois. Les alternatives écartées :
une sous-requête corrélée par colonne — deux fois le même parcours, et le décompte à part —, et un
`leftJoinLateral` que Drizzle expose mais qui aurait introduit une forme de jointure que le dépôt
n'emploie nulle part. **Le test qui l'épingle a dû être ajouté après coup** : la fixture recopiait la
série du brief, et aucun de ses tests ne distinguait les deux écritures. Un indicateur à série
**décroissante** l'isole. Leçon reprise de T4bis.5 : un test qui ne tombe pas quand on neutralise la
règle n'éprouve pas la règle.

**T5.1 — l'indicateur sans relevé ne coûte pas un cas particulier.** `count(readings.id)` vaut 0 et
`array_agg` vaut `null` sur un `leftJoin` sans correspondance : les trois champs tombent justes sans
un `if`. C'est ce qui permet au composant de n'avoir qu'une seule condition — `lastReadOn` nulle ou
non —, et à `docs/03` §7 d'être tenu sans y penser : sans relevé, aucune date n'est affichée, donc
aucune date n'est inventée.

**T5.1 — écart de périmètre déclaré et tranché avant écriture : `lib/format.ts` et son test.** La
fiche ne nomme que quatre fichiers, et le ticket en a touché six. Trois formats neufs étaient
nécessaires — le mois d'une colonne `date`, le décompte de relevés, le libellé de `direction` — et
les trois avaient déjà leur place écrite dans `lib/format.ts` : `formatDay` pour le premier,
`formatAccompaniments` et `formatProjects` pour le deuxième, `formatResourceType` et son `Record`
exhaustif pour le troisième. Les garder dans le composant aurait mis un formatage de date hors du
module des formats, et fait de `formatActivityPeriod` — dont le nom parle de période d'activité — le
formateur d'une date de relevé. Arbitrage posé à l'humain avant écriture, tranché option A.
`formatDateMonth` servira T5.3 et T5.6.

**T5.1 — un test d'ordre alphabétique ne se fait pas dépendre de la collation.** Les libellés de la
fixture ont d'abord porté un accent (« Égalité »). En collation `C`, un caractère accentué encodé en
UTF-8 trie **après** « Z » ; en `en_US.UTF-8` ou en ICU, il trie entre « E » et « F ». Le test aurait
donc dit la collation de la branche Neon, pas le tri de la requête. Libellés remis en ASCII. À garder
pour tout test d'ordre à venir sur du texte français.

**T5.1 — le parcours d'archivage produit : deux pièges du harnais, avant même la première preuve.**
(1) La charge de `restoreProduct` a d'abord été bâtie avec un champ `$ACTION_KEY` — présent sur les
formulaires de `useActionState`, **absent** du formulaire de rétablissement, qui est un formulaire
nu. Une charge qui n'est pas celle de l'écran ne prouve rien : elle a été refaite. (2) Le bloc de
champs `$ACTION_1:1` porte du JSON, donc des guillemets, qu'un heredoc de shell mange en silence — le
premier rejeu a rendu un 500 et une `SyntaxError` dans le journal de `next dev`, et non le refus
attendu. La charge vit désormais dans un fichier, lue par `$(cat …)` et passée en `--form-string`.
**Un 500 n'est pas un refus**, et un harnais qui n'atteint pas l'action produit exactement l'écran
d'un droit qui refuse : c'est toute la raison de l'étape témoin du protocole de T4bis.3.

**T5.1 — le refus (e) d'`archiveProduct` reste au pluriel dans sa dernière phrase.** Trouvé en
relisant le message au singulier, ce qu'aucune session n'avait fait : « Ce produit porte encore
1 accompagnement non archivé. Archivez-**le** d'abord : ranger le produit **les** ferait disparaître
des listes sans les ranger. » Le `plural` de `app/(app)/produits/actions.ts:246` gouverne le nom et le
premier pronom ; les deux derniers sont écrits en dur. Défaut de langue seul — le refus refuse, la
base ne bouge pas. Hors du périmètre de fichiers de T5.1, règle 3 : consigné dans `ETAT.md` avec sa
destination, **T5.4**, seul ticket de C5 dont la fiche ouvre ce fichier, et qui doit précisément y
recopier « la forme exacte du refus (e) d'`archiveProduct` ». Un défaut se corrige avant d'être
recopié.

**T5.2 — le droit dérivé oblige à retourner l'ordre de la porte, et c'est la première fois.** Les
quatre portes du projet — `openProduct`, `openProject`, `openActivity`, `openResource`, `openResult` —
interrogent toutes le **droit** avant de chercher la ligne, parce que `manageDomain` et
`writeProject` répondent sans rien lire d'autre que la session. L'arbitrage (b) de C5 pose un
troisième cas : un droit **dérivé des accompagnements du produit**, qui ne s'énonce pas avant de
connaître le produit. `openProductWrite` lit donc le produit, puis son archivage, puis le droit.
Alternative écartée : demander `contributorProjectIds` à la session et compter les projets du produit
qui s'y trouvent — même requête, ordre inversé pour rien, et un `inArray` sur une liste vide à
traiter à part. L'ordre ne divulgue rien de plus que l'écran, la page produit étant lisible par tout
le domaine (D9) ; **à relire si un jour une page de détail cesse de l'être.**

**T5.2 — un produit archivé ne reçoit plus de saisie d'indicateur, et la fiche ne le disait pas.**
Ni `tickets-C5.md` ni la fiche T5.2 ne nomment le cas ; ils ne nomment pas non plus son contraire.
Deux lectures se défendaient : laisser le responsable de domaine écrire — un indicateur n'est pas un
accompagnement —, ou fermer le produit comme T4bis.3 ferme l'accompagnement. Retenu : **fermer**.
`updateProduct` refuse déjà le produit archivé **reçu** depuis T4bis.2, et autoriser des indicateurs
neufs sur un produit que plus aucune liste n'affiche aurait créé une donnée que personne ne peut
relire par un chemin de navigation. La conséquence est un `&&` unique dans la page — le `canWrite`
de T4bis.3 transposé — qui fait tomber ensemble le panneau et les trois gestes du bloc. Arbitrage
posé à l'humain avant écriture, tranché option A.

**T5.2 — un fichier nommé par une fiche n'est pas un fichier à écrire.** Le périmètre de T5.2 liste
`lib/queries/indicators.ts` et son test. Rien n'y était à faire : `listProductIndicators` écarte déjà
les indicateurs archivés — son test « un indicateur archivé n'apparaît nulle part » couvre le geste
d'archivage de ce ticket sans une ligne de plus —, et le panneau en correction lit sa ligne par
`session.db.find(indicators, …)`, la forme exacte de la page projet avec `find(activities, …)`, qui
n'ajoute aucune fonction de lecture. Le fichier est donc **ouvert et laissé intact**. Écrire une
fonction pour honorer une liste aurait ajouté un lecteur de plus à maintenir pour rien — règle 3, par
l'autre bout.

**T5.2 — la quatrième copie de `PanelField`, et la deuxième d'`ACTION_LINK`.** La dette de T4.2 n'a
pas bougé, elle s'est épaissie : `project-form.tsx` (T2.5), `activity-panel.tsx` (T3.3),
`resource-panel.tsx` (T4.2) et maintenant `indicator-panel.tsx` portent le même composant de champ,
et `resources.tsx` comme `indicators.tsx` portent la même constante de geste texte. Aucun des
fichiers sources ne l'exporte, et aucun n'appartenait au périmètre de ce ticket. **L'extraction
appartient au ticket qui pourra toucher les quatre fichiers ensemble** — elle ne se fera pas au
détour d'un cinquième panneau.

**T5.2 — le piège du `$ACTION_KEY` de T5.1 ne se contourne pas, il se structure.** Le harnais de
rejeu récoltait d'abord les champs cachés **page par page**, ce qui collait le `$ACTION_KEY` du
panneau — un formulaire de `useActionState` — sur la charge du formulaire nu d'archivage, qui n'en
porte pas. C'est exactement la charge que T5.1 avait dû refaire. La parade est de découper le
balisage **par `<form>`** avant d'en extraire les champs : une charge est alors, par construction,
celle d'un formulaire réel de l'écran. À reprendre tel quel en T5.3 et T5.4, qui rejoueront tous deux
un panneau et un geste nu.

**T5.2 — un refus ne se lit pas dans le HTML d'une action, et l'absence d'effet ne prouve rien.** La
réponse d'une action serveur est un flux RSC, pas une page : le premier jet du harnais cherchait le
bandeau `role="alert"` dans le corps de la réponse et n'y trouvait rien, ce qui aurait pu passer pour
« aucun refus » alors que les trois actions refusaient bel et bien. Le message se lit dans le flux
(`"message":"…"`), et la base se compte à côté. **Un 500 laisse la base intacte exactement comme un
refus** : compter les lignes ne suffit jamais, il faut lire le message — la leçon de l'étape témoin
de T4bis.3, retrouvée par un autre chemin.

**T5.3 — `hasArchivedAt` a tenu sa promesse, et c'est la première fois qu'on la lui demande.**
`lib/db/scoped.ts` introspecte le schéma pour savoir si une table porte `archived_at` : `archive`,
`restore` et le filtre des vivants couvrent donc `indicator_readings` du jour où la migration passe,
**sans qu'une ligne de la couche change**. La propriété est écrite depuis T1.3 et n'avait jamais eu
de cas réel. Elle en a un. À retenir pour les tables qui gagneront la colonne plus tard : la
migration suffit, il n'y a rien à câbler.

**T5.3 — deux filtres d'archivage des relevés, et ils ne se remplacent pas.** Celui de
`listProductIndicators` est dans le **`on`** de la jointure ; celui de `listProductReadings` est dans
son `where`. Déplacer le premier dans le `where` ferait disparaître l'indicateur **avec** ses relevés
retirés au lieu de n'écarter que ceux-ci — un indicateur dont tous les relevés seraient retirés
sortirait du bloc. Les deux mises en défaut le montrent séparément : chacune fait tomber quatre
tests, et un seul test tombe dans les deux cas — celui qui vérifie que la tête de série et le
« dernier relevé » sont le même relevé. C'est sa raison d'être.

**T5.3 — `isDecimal` et `decimalAsTyped` exportées, plutôt qu'une cinquième copie.**
`indicator_readings.value` et `results.value` sont **la même** `numeric(18,4)`, et deux copies d'une
règle de validation divergent le jour où l'une des deux précisions bouge. L'import croisé est la
règle du dossier `lib/forms/` — `result.ts` lit déjà `isWebUrl` de `resource.ts` et `isIsoDay` de
`project.ts`. Ce qui se recopie dans ce dossier, ce sont les libellés et les messages ; ce qui
s'importe, ce sont les règles.

**T5.3 — `$ACTION_REF_<n>` sans `value` : le piège de T4.4, repayé faute d'avoir relu le journal.**
Le harnais de rejeu a été réécrit de zéro et a reproduit exactement le défaut consigné en T4.4 : les
champs cachés récoltés par `name="…" value="…"`, donc `$ACTION_REF_<n>` manquant, donc « Failed to
find Server Action » et un 500. **Une action introuvable laisse la base intacte exactement comme un
droit qui refuse** — sans le journal du serveur de développement, la conclusion aurait été qu'un
droit tenait. Deux enseignements : le journal se relit **avant** d'écrire un harnais, et le journal
de Next se lit dans `.next/dev/logs/next-development.log`, y compris pour un serveur qu'on n'a pas
démarré soi-même.

**T5.3 — un serveur de développement de longue durée sert des identifiants d'action périmés.** Avant
de trouver le vrai défaut ci-dessus, le serveur en place depuis la session précédente a été relancé,
sans effet : la piste était fausse. À retenir pour ne pas la reprendre — « Failed to find Server
Action » désigne d'abord une charge incomplète, pas un serveur fatigué. Le serveur `next dev` tourne
désormais sous un processus lancé par la session, journal capturé dans le répertoire de travail
temporaire.

**T5.3 — la cinquième copie de `PanelField` et la troisième d'`ACTION_LINK`.** La dette de T4.2, déjà
récrite en T5.2, s'alourdit d'un cran : `project-form.tsx`, `activity-panel.tsx`,
`resource-panel.tsx`, `indicator-panel.tsx` et maintenant `reading-panel.tsx` portent le même
composant de champ ; `roadmap.tsx`, `resources.tsx` et `indicators.tsx` la même constante de geste
texte. Aucun des fichiers ne l'exporte, aucun n'appartenait au périmètre. **À cinq copies, le ticket
d'extraction ne se repousse plus par la même phrase** : il se pose, ou la dette cesse d'être bornée.

**T5.4 — un geste nu n'a nulle part où afficher un refus, et le typage le dit avant le raisonnement.**
L'arbitrage (e) de `tickets-C5.md` demande que le refus d'`archiveIndicator` « dise combien ».
Or ce geste est un `<form>` sans champ, lié à une action `Promise<void>` : il n'y a pas de
`useActionState` pour faire revenir un état, et lui en faire rendre un ne compile même pas —
`Promise<{ message }>` n'est pas assignable au type de la prop qui le reçoit
(`((indicatorId: string) => Promise<void>) | null`), la règle d'assignabilité de `void` ne
traversant pas `Promise`. Trois issues se présentaient : refuser en silence et reporter le
« combien » ; élargir le périmètre pour que l'écran le dise ; ou inventer un canal de message pour
les gestes nus. La troisième est un mécanisme neuf que la fiche ne demande pas. Retenu, **posé à
l'humain et tranché** : `listProductIndicators` rend un `adoptionCount`, le bloc remplace « Archiver »
par la mention, et l'action refuse quand même — **le point d'entrée disparaît avant que le refus ne
serve, et le refus existe quand même**, un point d'entrée absent du rendu n'ayant jamais protégé le
point d'entrée HTTP qui l'accompagne. Coût : un fichier hors fiche.
**À retenir : un arbitrage qui demande un message suppose un endroit où le lire ; à défaut, c'est
l'écran qui parle avant le geste, pas l'action après lui.**

**T5.4 — le décompte d'adoptions ne pouvait pas être une jointure, et un test à une seule adoption
ne l'aurait jamais montré.** `adoptionCount` est une **sous-requête corrélée** dans le `select` de
`listProductIndicators`. Un `leftJoin` sur `project_indicators` aurait multiplié les lignes par le
nombre d'adoptions : `count(indicator_readings.id)` aurait compté chaque relevé autant de fois, et
les deux `array_agg` ordonnés auraient gardé la bonne réponse — l'ordre étant stable — tout en
changeant de sens. Sur la fixture, qui porte **une** adoption, rien n'aurait paru. Le test qui
l'épingle écrit donc une **seconde** adoption le temps de la mesure, puis la défait. La sous-requête
a un second mérite : elle laisse la jointure de T5.1 et le filtre de T5.3 exactement où ils sont, et
leurs tests avec eux. **À retenir : une lecture qui gagne un agrégat sur une table à cardinalité
variable se vérifie à deux lignes, jamais à une.**

**T5.4 — un test peut porter le nom d'une règle sans la couvrir, et la mise en défaut l'a dit.**
Le test « une adoption d'un autre domaine n'exclut rien » forgeait d'abord une ligne de domaine `a`
sur un **projet de `a`**, puis lisait les options d'un projet de `b`. Retirer la condition de domaine
de la sous-requête d'exclusion n'a fait tomber **aucun test** : la condition `project_id` écartait
déjà la ligne forgée, et le test passait par elle. Récrit pour que la ligne forgée porte **le projet
visé par la lecture** et ne se distingue que par son `domain_id`, il tombe. C'est mot pour mot la
leçon de T4bis.5, retrouvée sur une autre règle : **un test vert au retrait d'une règle est un test
qui ne la couvre pas, même s'il porte son nom.** Six sabotages joués en tout sur ce ticket ; c'est le
seul qui a d'abord échoué à faire tomber quoi que ce soit.

**T5.4 — l'écart de périmètre du panneau était forcé, pas choisi.** La fiche écrit « le panneau
reprend la clé `?indicateur=` » et ne nomme aucun fichier pour lui — elle liste
`components/projects/adopted-indicators.tsx` et rien d'autre côté composants. Faire porter le panneau
par le bloc aurait fait basculer **tout le bloc** dans le paquet client, `useActionState` étant un
crochet : c'est la forme que `Resources` et `Indicators` refusent depuis T4.1. `adoption-panel.tsx`
est donc créé, sixième jumeau d'`activity-panel.tsx`. **À retenir pour les découpages : une fiche qui
demande un panneau doit lister son fichier ; T5.2 le faisait, T5.4 l'a oublié.**

**T5.4 — « Retirer » est un verbe neuf, et c'est le geste qui l'impose.** T4bis.5 avait posé
qu'« aucun verbe neuf n'entre à l'écran », et l'écran n'en portait que deux — « Modifier » et
« Archiver ». Le retrait d'une adoption n'est ni l'un ni l'autre : `project_indicators` n'a pas
d'`archived_at`, `LinkTable` refuse `archive` à la compilation, et la ligne est **supprimée**.
Écrire « Archiver » aurait nommé faux un geste irréversible. La règle de T4bis.5 vaut pour deux
formes d'un même geste, pas pour deux gestes de nature différente. **Rien n'est perdu pour autant** :
les relevés vivent sur l'indicateur, l'indicateur sur le produit, et la règle 4 protège la donnée
métier — pas une liaison, arbitrage de fait de T1.2.

**T5.4 — le séparateur a été posé à 2,22:1, et c'est la mesure qui l'a rattrapé.** Le `·` entre la
dernière valeur et son mois avait reçu `content-neutral-light` par recopie d'un autre écran. Ses deux
côtés ont exactement la même graisse et la même taille : à 2,22:1 sur `surface-neutral-pale`,
« 71 % juin 2026 » se lit d'une traite. Ramené à la couleur du texte — `content-neutral-dark`,
8,12:1 —, ce que `resources.tsx` fait depuis T4bis.5 et `indicators.tsx` depuis T5.1, les deux sans
classe de couleur sur le séparateur. **Aucun couple neuf par la position dans tout le ticket**, les
sept mesurés : 4,98 / 8,12 / 17,87 / 15,72 / 6,41 / 3,88:1. **À retenir : un jeton recopié d'un
écran voisin n'est pas un jeton mesuré ; c'est la position qui décide, pas la provenance.**

**T5.4 — la sixième copie de `PanelField` et la quatrième d'`ACTION_LINK`.** T5.3 écrivait qu'« à
cinq copies, le ticket d'extraction ne se repousse plus par la même phrase : il se pose, ou la dette
cesse d'être bornée ». Il ne s'est pas posé, et la sixième est là — `project-form.tsx`,
`activity-panel.tsx`, `resource-panel.tsx`, `indicator-panel.tsx`, `reading-panel.tsx`,
`adoption-panel.tsx`. Aucun ne l'exporte, aucun n'appartenait au périmètre de ce ticket. **La dette
n'est plus bornée par une phrase, et il faut le dire ainsi** : le prochain ticket qui ouvre deux de
ces fichiers ensemble doit extraire, ou C5 se termine à sept copies avec T5.5 et T5.6.

**T5.4 — `ETAT.md` finit à 249 lignes, à une du seuil.** Le fichier passe de 238 à 249 : une ligne de
ticket, un point ouvert neuf, un point refermé parti dans `HISTORIQUE-TICKETS.md`, et l'inventaire de
dérive augmenté d'une phrase. Le protocole fixe 250. **T5.5 le franchira**, et son étape 5 devra
balayer avant d'écrire — ou la session de découpage de C6 le fera, mais elle vient après deux tickets.
À traiter au plus tard à l'ouverture de T5.6.

**T5.5 — la fiche demandait `role="img"` *et* des bandes focusables ; les deux ne tiennent pas
ensemble.** Le contenu d'un élément `role="img"` est retiré de l'arbre d'accessibilité : un `<a href>`
qui y vit reste dans le cycle de tabulation tout en étant invisible à l'assistance — un focus qui se
pose sur rien, soit WCAG 4.1.2. Trois issues : renoncer aux liens (la fiche demande la descente de
`docs/06` §7 et la navigation clavier), superposer un calque HTML de liens sur un SVG décoratif (la
géométrie s'écrirait deux fois, et les deux dériveraient), ou changer le rôle. Retenu, **posé à
l'humain et tranché** : `role="group"` porteur de l'`aria-label`, bandes `<a>` focusables et nommées,
le détail restant lisible dans la liste juste en dessous. **À retenir : une fiche qui demande à la
fois une image et des cibles focalisables demande deux choses qui s'excluent ; c'est le rôle qui
cède, jamais l'accès.**

**T5.5 — un `viewBox` aurait mis le texte de la frise à l'échelle, et personne ne l'aurait vu venir.**
`viewBox="0 0 720 H"` avec `width="100%"` paraît le réflexe. Sous `max-w-310`, la largeur réelle du
contenu est de 1 112 px : le facteur vaut 1,54, et un `text-xs` de 12 px se serait affiché à 18,5 px —
plus gros que le `text-md` des titres de section qui l'encadrent, et variable avec la largeur de la
fenêtre. Retenu : **aucun `viewBox`**, abscisses en pourcentages et ordonnées en pixels. Le texte garde
alors la taille du reste de la page à toute largeur, et le critère se relit en pour cent dans le
balisage — `left + width` doit valoir 100 et non 719,9998. **À retenir : dans un SVG qui porte du
texte de contenu, la mise à l'échelle du `viewBox` est un choix typographique, pas un détail de
gabarit.**

**T5.5 — les quatre filtres de domaine se rattrapent l'un l'autre, et aucun test ne peut en isoler
un.** La mise en défaut de `listProductMilestones` a d'abord semblé rater : retirer `filter(results)`
ne fait tomber **aucun test**, et retirer `filter(activities)` non plus. La raison est structurelle —
la lecture joint quatre tables sur leurs clés étrangères, si bien qu'un seul filtre survivant suffit à
ramener toute la chaîne dans le domaine. C'est mot pour mot ce que l'en-tête de
`lib/queries/activities.ts` écrit depuis T2.2 : « les filtres de domaine se rattrapent l'un l'autre —
ne dispense d'aucun d'eux ». Les quatre restent donc écrits, et la mise en défaut se joue sur **la
règle** et non sur sa quatrième ligne : retirés ensemble, le seul test d'étanchéité tombe, seul. **À
retenir : sur une lecture jointe, ce qui se met en défaut est le filtrage de domaine dans son
entier ; un test qui prétendrait épingler un `filter()` nommé mentirait.**

**T5.5 — le contour de focus d'un `<a>` SVG n'a pas été observé dans un navigateur.** La règle
`*:focus-visible` d'`app/globals.css` est lue dans la feuille servie, l'ancre est un `<a href>` donc
focalisable par construction, et `outline` s'applique aux éléments SVG dans les moteurs courants.
Cela reste une **déduction**, là où la fiche demande une navigation clavier vérifiée. Ce qui manquait
est l'outil : aucun pilotage de navigateur n'est installé, et en ajouter un pour une vérification
sortait du périmètre. **Dette bornée et nommée : à regarder à l'œil au premier passage manuel sur la
page produit, ou le jour où le projet se dote d'un pilotage de navigateur.**

**T5.5 — les constantes de tracé d'un SVG ne sont pas des valeurs visuelles en dur, et il fallait le
dire dans le fichier.** La règle 2 interdit couleurs, tailles, espacements et rayons hors thème. Un
SVG ne peut pas ne pas porter d'ordonnées : hauteur de ligne, hauteur de barre, rayon d'un repère.
Elles sont groupées dans un `GEOMETRY` en tête de `timeline.tsx`, commenté comme **système de
coordonnées du dessin** — tandis que tout ce qui est couleur ou taille de texte passe par les classes
du thème (`fill-*`, `stroke-*`, `text-xs`), vérifiées dans la feuille servie : chacune émet
`fill: var(--surface-…)`, jamais une couleur littérale. Le seul attribut de peinture écrit à la main
est `fill="none"` sur la cible de clic, qui n'est pas une couleur mais l'absence de peinture. **À
retenir : la règle 2 se tient par ce que la feuille de style servie contient, pas par ce que le JSX
promet.**

**T5.5 — la table `nature → couleur` est redite une troisième fois.** `status-dot.tsx` porte des
`bg-*` et ne les exporte pas ; la frise a besoin des mêmes natures en `fill-*`. Le fichier n'était pas
au périmètre, la table est donc **redite**, comme `ACTION_LINK` l'a été en T5.1. Deux dettes de même
forme cohabitent désormais — un jeton de geste texte à quatre copies, une table de statut à deux —,
et elles ont la même issue : **le ticket qui pourra ouvrir les fichiers concernés ensemble extrait, ou
la dette cesse d'être bornée par la phrase qui la reporte.**

**T5.5 — `ETAT.md` a été balayé à l'étape 5, et le seuil de 250 lignes est tenu à la ligne près.**
T5.4 l'avait annoncé — « T5.5 le franchira ». Écrit tel quel, le fichier montait à 263. Trois gestes,
tous prévus par le protocole et aucun réservé à la session de découpage : l'inventaire de dérive de la
base, devenu une pile d'addenda, a été **récrit** ; deux rappels devenus des faits datés — le retrait
de la cinquième discipline, le relevé des modèles — sont partis dans la section « Faits acquis » de
`HISTORIQUE-TICKETS.md` ; et la ligne du ticket a été resserrée. Résultat : **250 lignes exactement.**
Le repliage de C5 en une ligne reste dû à la session de découpage de C6, et c'est lui qui rendra de la
marge — d'ici là, **T5.6 franchira le seuil à son tour.**

**T5.6 — `polyline` et `path` n'acceptent pas de pourcentage, et c'est structurel.** Le réflexe pour
une courbe est `<polyline points="17.5676%,292 …">` ; l'attribut `points`, comme le `d` de `<path>`,
n'admet **que des nombres** en unités utilisateur — un pourcentage y est ignoré, silencieusement, et
la courbe se dessine dans les quelques pixels du coin haut-gauche. Or la frise n'a **pas de
`viewBox`** (T5.5, pour que son texte garde la taille du reste de la page), donc ses abscisses *sont*
des pourcentages. Un segment est par conséquent une `<line x1="…%" x2="…%">`, qui, elle, accepte les
pourcentages comme le filet de l'axe et les graduations d'année. **À retenir : le choix « pas de
`viewBox` » de T5.5 se paie en géométrie primitive** — tant qu'il tient, aucune primitive à liste de
points n'est utilisable, et une aire remplie sous la courbe (`path`) serait impossible sans le
rouvrir.

**T5.6 — les fonctions d'échelle verticale sont hors du périmètre de fichiers de la fiche.** Elle
donnait `components/products/timeline.tsx`, `lib/queries/indicators.ts` et la page ; elle exigeait
aussi qu'une neutralisation du calcul de position verticale fasse tomber des tests, donc du pur et du
testé. `valueScale` et `valueOffset` vivent dans `lib/queries/timeline.ts`, à côté de `monthBand` et
`monthMark` : séparer la verticale de l'horizontale ferait chercher la moitié d'un dessin dans un
module de lecture. Écart d'un fichier, de la même nature que celui de T5.4 (`adoption-panel.tsx`), et
tranché avant écriture.

**T5.6 — une bande plate écrit deux fois la même borne.** Un indicateur à un seul relevé, ou dont
tous les relevés valent la même chose, a `min === max` : `valueOffset` pose tout à 50 — une droite au
milieu, ce que ces relevés disent —, et les deux bornes de la bande affichent le même chiffre, en
haut et en bas. C'est exact et c'est redondant. Écarter la borne haute dans ce cas demanderait une
condition d'affichage que la fiche ne réclame pas (règle 3). **Dette assumée, sans échéance.**

**T5.6 — le regroupement des relevés par indicateur est redit une seconde fois.** `indicators.tsx`
porte `groupByIndicator` depuis T5.3, non exporté, et pour un tri inverse (la série se lit du plus
récent au plus ancien, la courbe du plus ancien au plus récent). `timeline.tsx` refait le sien dans
`curvesOf`. Troisième dette de recopie du chantier, après `ACTION_LINK` (T5.1) et la table
`nature → couleur` (T5.5). Elles ont toutes la même issue : **le ticket qui pourra ouvrir les
fichiers concernés ensemble extrait, ou la dette cesse d'être bornée par la phrase qui la reporte.**

**T5.6 — le test d'étanchéité des cibles était vert au retrait de sa règle.** Les deux lectures
croisées — `listProductTargets(a.scope, b.fullId)` et sa symétrique — ne couvraient **pas**
`filter(projects)` : `filter(projectIndicators)` limite déjà la lecture aux adoptions du domaine
courant, et celles-ci ne pointent, en fonctionnement normal, que vers des accompagnements du même
domaine. Il a fallu forger par `db.insert` une adoption du domaine `a` sur un accompagnement du
domaine `b`, portant une cible, pour que le filtre ait quelque chose à écarter. **Troisième
manifestation de la même loi** — T4bis.5 (« un test vert au retrait d'une règle est un test qui ne la
couvre pas »), T5.5 (« les filtres de domaine se rattrapent ») : sur une lecture jointe, un filtre de
domaine ne s'éprouve que par une ligne que l'application ne sait pas écrire.

**T5.6 — `ETAT.md` dépasse le seuil, et T5.5 l'avait annoncé.** 263 lignes, contre 250 tenues à la
ligne près par le balayage de T5.5, qui écrivait « T5.6 franchira le seuil à son tour ». Les six
lignes de ticket de C5 se replient en une seule au **repliage**, geste 1 de la session de découpage
de C6 et seul moment où `ETAT.md` se balaie : c'est lui qui rendra la marge, et le dépassement est
précisément ce qui l'appelle.

**TD.1 — huit copies d'un composant de champ, et la seule fenêtre pour les réunir.** La dette de T4.2
avait été reportée cinq fois par la même phrase — « l'extraction appartient au ticket qui pourra
toucher les fichiers ensemble » —, et T5.4 avait fini par écrire qu'elle n'était « plus bornée par une
phrase ». Elle ne l'était plus parce que **aucune fiche de chantier ne peut ouvrir huit fichiers de
huit tickets différents** : une fiche a un périmètre, et la règle 3 le rend contraignant. La fenêtre
n'était donc pas un ticket mais l'**entre-deux-chantiers** — C5 clos, C6 non découpé. **À retenir pour
les découpages : une dette qui traverse un chantier ne se referme pas dans un ticket de chantier ; il
faut lui en ouvrir un hors chantier, ou elle se reportera indéfiniment par une phrase juste.**

**TD.1 — la coquille de panneau était identique aux six exemplaires, et personne ne l'avait mesuré.**
Le journal ne consignait que `PanelField` et `ACTION_LINK`. En comparant les six panneaux ligne à
ligne, la **coquille entière** — `FocusTrap`, voile, `role="dialog"`, en-tête, croix, bandeau
`role="alert"`, `<form>` enveloppant, pied — s'est révélée identique, aux seuls titre, sous-titres et
identifiant de titre près, plus `CONTROL` et `borderOf` à huit exemplaires chacun. **La dette
consignée était la partie visible de la dette réelle** : ce qui se recopie se remarque quand un
ticket ajoute le geste, pas quand il ajoute l'enveloppe. Bilan de l'extraction : −2 181 / +1 205
lignes suivies, 332 dans trois fichiers neufs, **−644 nettes**.

**TD.1 — un `${className ?? ""}` interpolé sert un espace final, et c'est la seule différence.**
`activity-panel.tsx` et `project-form.tsx` écrivaient `` className={`flex flex-col gap-1.5 ${className ?? ""}`} ``,
si bien que leurs champs sans `className` servaient `class="flex flex-col gap-1.5 "`. Le composant
partagé n'ajoute l'espace que lorsqu'il y a quelque chose à séparer : **18 lignes du diff HTML**, sans
effet sur le rendu ni sur les règles CSS. C'est la seule différence de balisage de tout le ticket, et
elle valait d'être vue plutôt que masquée par un `diff -w` — **un diff qu'on assouplit cesse d'être un
instrument.**

**TD.1 — une donnée créée au navigateur pendant la mesure a faussé le diff, et le diagnostic a tenu à
une date.** La comparaison finale montrait un diff volumineux sur six écrans. Rien dans le code ne
l'expliquait ; la base, elle, portait un indicateur « test » et un relevé de 30 % créés **quatre
minutes plus tôt** par la personne courante, depuis le navigateur. La comparaison a été refaite à
données constantes — `git stash push -u`, capture, `git stash pop` — et n'a plus montré que les 18
espaces et les 2 jetons de couleur attendus. **À retenir : sur une base de développement partagée avec
un humain qui l'utilise, une capture avant/après ne mesure le code que si les données n'ont pas bougé
entre les deux ; sinon elle mesure la base. Le réflexe n'est pas de douter du code, c'est de dater les
lignes.**

**TD.1 — un harnais qui poste en urlencoded obtient 200 sans message, et ce n'est pas un refus.** Le
`<form>` que React rend pour une action serveur porte `encType="multipart/form-data"`. Posté en
`application/x-www-form-urlencoded`, Next **ne reconnaît pas l'invocation** : il ré-rend la page nue,
répond **200**, n'écrit rien et ne dit rien. C'est la **troisième forme** du même piège, après les deux
consignées en T4.4 et T5.3 — `$ACTION_REF_<n>` sans `value` donnant un 500 « Failed to find Server
Action ». Dans les trois cas la base est intacte, et dans les trois cas l'action ne s'est pas exécutée.
**Seule l'étape témoin les distingue d'un refus**, et il faut l'exiger *avant* de conclure, jamais
après : sans elle, ce ticket aurait rapporté que la règle du produit archivé tenait alors que l'action
n'était jamais atteinte. La leçon générale de T5.3 se précise donc : ce n'est pas seulement la charge
qui doit être complète, c'est **l'encodage qui doit être celui du formulaire servi**.

**TD.1 — le trou de `createProject` avait un jumeau, et c'est la porte unique qui l'a révélé.** Le
point ouvert ne nommait que la création. En posant la règle dans `checkReferences` — la porte que les
deux actions traversent, discipline de T4bis.3 — le déplacement d'`updateProject` **vers** un produit
rangé s'est refermé du même geste, alors qu'il n'était consigné nulle part. L'inverse aurait été vrai
aussi : écrire la règle dans `createProject` seule aurait refermé le point ouvert **en laissant le
défaut**. **À retenir : quand un point ouvert nomme un point d'entrée, chercher la porte plutôt que le
point d'entrée — la porte dira s'il y en avait d'autres.**

**TD.1 — l'exception nominative était nécessaire, et le point ouvert voisin le disait.** Refuser tout
produit archivé rendait immodifiable un accompagnement resté sous un produit rangé — état que le point
ouvert d'`ETAT.md` sur le rétablissement décrit comme atteignable, et même normal après un archivage
de produit. `ProjectLinksKeep` gagne donc `productId`, sur le modèle exact de T4bis.1. **Deux points
ouverts se lisent ensemble ou pas du tout** : celui qu'on referme et celui qui décrit l'état que la
règle va rencontrer.

**TD.1 — un défaut d'accessibilité avait produit trois contournements avant d'être corrigé.**
`EmptyState` rendait un `h2` ; trois blocs — `resources.tsx`, `indicators.tsx`, `timeline.tsx` — ont
écrit un `<p>` à la main pour l'éviter, chacun citant le précédent. Le `level` corrige le défaut, et
**les trois contournements restent** : leur raison de fond n'était pas le titre mais le cadre tireté à
`px-8 py-11` dans une demi-largeur de grille, et pour `timeline.tsx` deux phrases distinctes là où
`EmptyState` n'a qu'un `description`. Leurs commentaires ont été récrits — ils invoquaient un doublon
qui n'existe plus. **À retenir : un contournement recopié trois fois signale un composant à corriger,
et le corriger ne rend pas les contournements caducs pour autant ; il faut relire ce que chacun
évitait vraiment.**

**TD.1 — une pastille et un surtitre ne se corrigent pas avec le même jeton, et la mesure seule le
dit.** Les cinq textes de `/dev/session` semblaient un seul remplacement. Quatre sont sur le fond de
page, où `content-neutral-base` donne 4,73:1 ; la pastille « non » est sur un voile de 8 %
(`#e5e5e6`), où le même jeton retombe à **4,02:1** — sous les 4,5:1. Retenu `content-neutral-dark`,
**6,56:1**, symétrique du 6,87:1 mesuré sur la pastille « oui ». C'est la leçon de T5.4 sur un autre
écran : **un jeton recopié d'une ligne voisine n'est pas un jeton mesuré ; c'est la position qui
décide.** Et trois des cinq ne se rendent que sous un cookie de simple membre — un correctif de
contraste se relit sous le profil qui déclenche la couleur, pas sous celui qu'on a.

**TD.1 — la règle eslint sur le souligné a débusqué un import mort dans la minute.** Ajouter
`argsIgnorePattern: "^_"` était censé faire taire quatre avertissements structurels de
`useActionState`. Le premier lancement en a rendu **un cinquième, réel** : `ProjectStatusNature`
importé dans `timeline.tsx` et devenu inutile avec `BAND_FILL`. `tsc` ne le voyait pas,
`noUnusedLocals` étant désactivé. **Démonstration en acte de la raison du changement** : un journal
qui porte des avertissements permanents ne montre pas les avertissements neufs.

**TD.1 — le plan annonçait une mise en défaut sur une fonction qui n'avait pas de test.** Il écrivait
que la neutralisation de `groupByIndicator` « doit faire tomber les tests de la frise ». Aucun ne
serait tombé : la fonction vivait dans un composant, et `vitest` ne couvre pas `components/`. La
déplacer dans `lib/queries/` la rendait testable, mais ne la testait pas. Quatre tests écrits, deux
mutations jouées — accumulation écrasée, ordre inversé —, deux tests tombés à chaque fois, exactement
ceux qui portent la règle. **À retenir : « la mise en défaut portera sur X » n'est vérifiable qu'après
avoir vérifié que X a un test ; un plan peut affirmer une couverture qui n'existe pas.**

**TD.1 — la règle du produit archivé n'est couverte par aucun test, et il faut le dire.** Elle vit
dans `app/(app)/projets/actions.ts`, que `vitest` ne couvre pas. Sa neutralisation ne fait tomber
aucun test — elle a été éprouvée par re-soumission, en six temps dont l'étape témoin et la
neutralisation sous la même charge. La dette de banc d'essai pour les actions serveur, inscrite en
T4bis.3, n'est **ni élargie ni refermée**.

**TD.1 — les sondes s'archivent, et c'est le compilateur qui l'impose.** Deux produits, deux
accompagnements et cinq lignes écrites par le harnais devaient disparaître. `unlink` est réservé par
le typage aux tables sans `archived_at` — `products` et `projects` en portent une —, si bien que
`scope.unlink(products, id)` ne compile pas. **La règle 4 est tenue par le type, pas par la
discipline**, jusque dans un script jetable. Les sondes sont donc archivées ; elles quittent les
listes, ce qui suffit, et l'inventaire de dérive d'`ETAT.md` le note.

**TD.1 — `ETAT.md` a été balayé sans le repliage de C5, qui n'appartient pas à un ticket.** Le fichier
montait à 272 lignes. Le repliage des six lignes de C5 en une seule est le geste 1 de la session de
découpage, seul moment où le fichier se balaie : il n'a **pas** été fait ici. Trois gestes que le
protocole autorise à l'étape 5 ont suffi — l'inventaire de dérive **récrit** plutôt qu'augmenté, le
point du design system resserré autour du fait neuf (les substituts ont désormais un seul lieu), et
deux notes de chantier devenues des faits datés versées aux « Faits acquis » de
`HISTORIQUE-TICKETS.md`. Résultat : **263 lignes**. La marge reste due au repliage.


**C5bis — une dérogation demandée, accordée, et bornée par six garde-fous.** `CLAUDE.md` écrit que
Vision n'est pas **un outil d'évaluation des personnes** ; `docs/06` §10 interdit le classement de
personnes ; D39 interdit tout indice **calculé par Vision** pour qualifier une personne. La demande
du 17/08/2026 — un niveau de maîtrise par compétence, et un radar par personne — est, à la lettre,
une évaluation de personne. **Le désaccord a été porté avant d'écrire une ligne**, comme la règle 6
l'exige, et l'humain a tranché : dérogation accordée, sous garde-fous. Ils sont six, et ils sont
recopiés en tête de `tickets-C5bis.md` parce qu'un garde-fou qui ne vit que dans un journal n'est
pas opposable : niveau **déclaré** et jamais mesuré ; aucune moyenne ni score ni total ; aucun tri
des personnes par niveau ; un radar, une personne ; des axes qui sont **les seules compétences de la
personne**, ce qui rend la superposition impossible ; et la valeur écrite en toutes lettres à côté du
dessin. `CLAUDE.md`, `docs/02`, `docs/06` et `docs/07` restent à amender **par l'humain** — la règle
7 vaut aussi le jour où c'est lui qui demande le changement.

**C5bis — D29 n'est pas rouverte, et c'est ce qui a décidé de la forme.** « Pas de page personne au
POC » aurait été le point de friction le plus coûteux du chantier : une fiche est exactement ce que
la décision refuse. La fiche est donc un **panneau** sur `/equipe`, sur la mécanique des six
existants — une URL, pas un état. Ce que D29 économisait était un écran de navigation de plus ; il
n'y en a pas un de plus. **Une décision peut se satisfaire sans se rouvrir, et c'est presque toujours
moins cher que de la rouvrir.**

**C5bis — cinquième entrée de navigation, contre la lettre de `docs/06` §8.** Le document écrit
« Navigation principale, quatre entrées, dans cet ordre ». Équipe en fait une cinquième, placée après
Projets et avant À propos : le chemin canonique reste Produits › Projets, et Équipe n'est pas un
chemin vers un accompagnement. L'écart est consigné, il ne se discute pas — et il rappelle que
l'entrée Administration attend toujours son ticket, ce qui en fera une sixième.

**C5bis — la disponibilité est stockée là où D40 posait un précédent de calcul.** D40 pose que le
statut d'accompagnement d'un produit est **calculé** à partir de ses projets, jamais stocké. La
disponibilité d'une personne se dériverait de la même façon de ses accompagnements en cours, et la
demande dit explicitement qu'elle « pourra ensuite être automatisée ». Elle est pourtant **une
colonne** au POC : la dérivation exigerait de trancher ce qui rend une personne partiellement
disponible — un nombre d'accompagnements ? une charge ? une période ? — et aucune de ces réponses
n'existe dans le modèle. Une colonne saisie aujourd'hui, une dérivation le jour où la règle sera
connue. **La dette est nommée ici pour qu'elle ne se redécouvre pas comme une incohérence.**

**C5bis — le nom `bis` désigne l'intercalation, pas la correction.** C4bis rattrapait des manques ;
C5bis ajoute un objet que `docs/05` §5 n'avait pas prévu. Le point commun, et la raison du nom, est
qu'aucun des deux ne décale C6 ni C7, qui gardent leur contenu et leur rang. Le numéro dit **où le
chantier s'insère**, jamais ce qu'il vaut.

**C5bis — `filter()` ne porte que le domaine, et c'est ce qui rend l'archivage d'une personne sûr.**
`lib/db/scoped.ts:266` — `filter` est un `eq(table.domainId, domainId)`, sans condition d'archivage,
là où `list()` ajoute `isNull(archivedAt)`. Conséquence pour l'arbitrage (e) du chantier : archiver
une personne la retire du référentiel et des choix du formulaire de projet, mais **pas de l'équipe
des accompagnements passés**, que `findProjectDetail` lit par `joinedRead` et `filter(persons)`.
C'est la règle 4 tenue — une donnée ne disparaît pas d'un écran qui la racontait. **Propriété à
vérifier au ticket, jamais à supposer** : elle tient à une ligne de la couche d'accès.


**Hors ticket, 17/08/2026 — la liste transverse perd deux de ses sept colonnes, contre la lettre de
`docs/06` §4.** Le document énumère « nom du projet, produit de rattachement, entité, statut,
métiers, équipe, date de dernière activité. Rien d'autre », et « Filtres : entité, métier, approche,
statut » ; `docs/05` §3 reprend la même liste sur la ligne « Vue globale des projets ». Sur demande
du 17/08/2026, la colonne
**Entité** et la colonne **Métiers** sont retirées, et les deux filtres avec elles : la ligne était
trop chargée pour la comparaison ligne à ligne, qui est le but de l'écran. Restent cinq colonnes et
trois dimensions — recherche, approche, statut. **L'écart est consigné, il ne se discute pas** ;
`docs/` est figé et n'a pas été touché.

**Hors ticket, 17/08/2026 — deux décisions frôlées, aucune rouverte.** (1) **D44** pose que les
métiers déclarés « font foi pour le filtrage et l'affichage » : la décision garde tout son objet au
formulaire de projet, qui les saisit toujours, et n'en a plus sur cette liste. Son périmètre se
réduit, sa règle ne change pas. (2) **D29** écarte la page personne parce que « les filtres par
métier et la recherche par nom sur la liste transverse » suffisent à répondre à « qui travaille sur
quoi ». La moitié « métier » de cette justification disparaît **au moment précis où C5bis la
remplace mieux** : T5bis.3 donne à `/equipe` son propre filtre `metier`, conjoint avec les
compétences. La moitié « entité », elle, reste servie par `?entite=` sur `/produits`, qui la garde.
**Vérifié avant d'écrire : aucun lien du dépôt ne construit `/projets?entite=…` ni `?metier=…`** —
la vue d'ensemble, qui promet des chiffres cliquables, est encore un gabarit sans lien.

**Hors ticket, 17/08/2026 — retirer un filtre se prouve par un paramètre survivant, jamais par un
écran.** Un `<select>` absent du rendu ne dit rien du sort du paramètre : le code aurait pu garder
la condition et perdre seulement son contrôle. Le seul geste qui distingue « retiré » de « caché »
est de rejouer l'URL complète — `/projets?entite=<uuid réel>&metier=<uuid réel>` rend les **cinq**
lignes, comme `/projets` nu, sans mention dans le résumé des filtres actifs ni lien « Retirer tous
les filtres ». C'est la transposition au filtre de la règle éprouvée en C4bis sur le droit : **il
s'éprouve par la requête, pas par le rendu.** Le diff avant/après du HTML servi, par `git stash`, ne
montre que les deux `<select>` et les deux colonnes — rien d'autre n'a bougé.

**Hors ticket, 17/08/2026 — deux colonnes de moins, quatre requêtes SQL de moins par affichage.**
`listProjects` passe de trois allers-retours à deux (la requête `declaredJobs` disparaît, et la
jointure `entities` avec elle, dont `entityLabel` était le seul lecteur) ; `listProjectFilterOptions`
passe de quatre à deux. Le gain n'était pas le but, il est la conséquence d'être allé **jusqu'à la
requête** plutôt que de s'arrêter au rendu : une colonne alimentée sans lecteur est exactement ce que
T5.2 a appris à ne pas laisser derrière soi. Deux tests ont été **reportés et non supprimés** — la
combinaison cumulative des filtres, rejouée sur `statut × approche × recherche`, et le seul test
d'étanchéité de domaine sur un filtre, rejoué sur `approachId` : ce sont des propriétés de la
mécanique, pas des dimensions retirées. Mise en défaut jouée deux fois : neutraliser `statusId` fait
tomber 2 tests, neutraliser `approachId` en fait tomber 3, exactement ceux qui les portent.

**Hors ticket, 17/08/2026 — la roadmap quitte le SVG, et l'arbitrage (d) de `tickets-C5.md` avec
lui.** La maquette `docs/design/maquettes/blocs/roadmap/Roadmap.dc.html` dessine une grille de texte
à deux colonnes, pas un tracé vectoriel : la frise est reconstruite en HTML, et les courbes
d'indicateurs sortent dans leur propre bloc (`components/products/indicator-curves.tsx`). **L'axe
commun aux trois couches, que l'arbitrage (d) posait explicitement, est donc perdu** — la roadmap
porte le sien, filtrable, les courbes le leur, déduit de leurs seuls relevés. C'est un désaccord
assumé avec une décision de chantier, pas un oubli : deux blocs distincts ne peuvent pas partager
une abscisse sans que l'un impose sa fenêtre à l'autre, et c'est la séparation qui était demandée.
Ce que (d) protégeait vraiment reste tenu : **une bande par indicateur, jamais deux unités sur une
même verticale.**

**Hors ticket, 17/08/2026 — la contrainte « pas de `viewBox`, donc pas de `polyline` » survit à
moitié.** Elle gouvernait `timeline.tsx` depuis T5.5. La roadmap, passée au HTML, s'en affranchit
entièrement — ses barres sont des `<div>` en pourcentage. Le bloc des courbes, lui, reste en SVG
parce qu'une courbe l'est, et garde donc la règle intacte : une `<line>` par segment, jamais un
`path`. La note de T5.6 reste vraie, mais **elle ne vaut plus que pour un fichier sur deux** — la
relire comme une règle du projet serait désormais un contresens.

**Hors ticket, 17/08/2026 — trois éléments de la maquette ne sont pas rendus.** (1) L'**ombre
portée** de la carte : le design system nomme ses trois élévations sans leur donner de valeur
(`tokens.css` §8), et la règle « aucun septième substitut ne s'invente » interdit d'en écrire une à
la main. La carte se distingue par son rayon et son ampleur, pas par sa profondeur. (2) Le **menu
« … »** (exporter en PDF, partager le lien, paramètres d'affichage) : hors du périmètre de
`docs/05`, et impossible sans JavaScript. (3) L'application du filtre **à l'`onChange`** : remplacée
par un bouton « Appliquer », qui est le prix d'un `<form method="get">` natif — le bloc reste
entièrement rendu sur le serveur, filtre compris.

**Hors ticket, 17/08/2026 — `de` et `a` n'entrent pas dans le décompte d'exclusivité des panneaux.**
La page produit refuse d'ouvrir un panneau quand plusieurs clés d'ouverture sont présentes (T5.2,
T5.3). Les deux bornes de la fenêtre de roadmap **n'y sont pas ajoutées**, et c'est délibéré : elles
n'ouvrent rien, ne posent ni `role="dialog"` ni `inert`, et leur absence est l'état sans filtre
plutôt qu'une fermeture. Les faire compter fermerait un panneau chaque fois que la roadmap est
filtrée. La contrepartie assumée est l'inverse : ouvrir un panneau perd la fenêtre, ce qui est
exactement la dette déjà consignée dans `ETAT.md` (« les filtres ne survivent pas à un aller-retour
par la navigation principale »). Elle n'est ni creusée ni refermée.

**Hors ticket, 17/08/2026 — `monthBand` borne, donc il fallait un prédicat pour faire disparaître.**
Piège non évident : `clampIndex` ramène toute borne dans la fenêtre, si bien qu'un accompagnement de
2024 regardé à travers une fenêtre 2026 ne disparaît pas — il rend une barre **écrasée contre le
bord gauche**, qui affirme une présence que sa période dément. `withinWindow` est ce qui l'écarte, et
`hiddenNotice` ce qui l'annonce. La même correction vaut pour les repères. Mise en défaut jouée sur
quatre règles (`timelineWindow` : bornage, remise à l'endroit ; `withinWindow` : le prédicat ;
`monthTicks` : le dernier mois forcé) — chacune fait tomber exactement les tests qui la nomment,
2, 1, 4 et 2, et rien d'autre. **Le premier passage de mise en défaut a menti** : le `grep` de
filtrage des résultats, calé sur des mots-clés, masquait un test en échec (« borné » ne contient pas
« borne »). Un filtre lossy sur une sortie de test annule la moitié « et rien d'autre » de la
discipline — rejoué en imprimant tous les échecs.

**Hors ticket, 17/08/2026 — les sondes de vérification ont été archivées, y compris des anciennes.**
Quatre états n'existaient dans aucune donnée semée (produit sans accompagnement, accompagnement non
daté, indicateur sans relevé, indicateur muet à côté d'indicateurs traçés). Ils ont été créés à la
main dans la base de développement, lus dans le HTML servi, puis archivés. Le nettoyage a filtré sur
`label like 'SONDE —%'` et a donc **ré-archivé des sondes de tickets antérieurs** au passage :
4 produits, 2 indicateurs et 2 accompagnements pour 5 lignes créées. Sans conséquence — la base de
développement est jetable (règle du 14/08/2026) — mais c'est un `archived_at` réécrit sur des lignes
qu'on n'avait pas créées, et il valait mieux cibler par identifiant.

**Hors ticket, 17/08/2026 — « toutes les bordures en #E4E4EA », sauf celle des deux `<select>`.**
La demande d'ajustement porte le bloc entier à `surface-neutral-lighter` (greyscale-200, exactement
#E4E4EA) : carte, barre de filtre, séparateurs de ligne. **La bordure des deux sélecteurs de période
reste à `content-neutral-normal`** (greyscale-400, 3,88:1 mesuré). Ce n'est pas un oubli : c'est la
**limite d'un composant de saisie**, que WCAG 1.4.11 mesure à 3:1, et #E4E4EA sur `surface-neutral-pale`
tombe à 1,24:1 — mesuré. C'est très exactement le manque n°2 du design system et le substitut en
vigueur depuis T2.3. Un contrôle dont la limite ne se voit pas est un défaut d'accessibilité dans un
produit dont le centre fait métier d'audits. **À faire trancher** : soit le design system se dote
d'un jeton de bordure de contrôle, soit l'écart visuel des deux sélecteurs est accepté tel quel.

**Hors ticket, 17/08/2026 — la ligne des repères est masquée par un drapeau, pas supprimée.**
`SHOW_MILESTONES = false` dans `roadmap.tsx` : le POC n'a pas besoin des activités porteuses d'un
résultat. Le choix du drapeau plutôt que de la suppression tient à ce que la couche est **entière et
vivante** — `listProductMilestones`, `monthMark`, `milestoneTitle`, le filtrage par fenêtre. La
supprimer aurait rendu morte une lecture scopée et testée, pour la ressusciter au prochain ticket.
**Les dates de mesure continuent de porter l'axe** : rallumer la ligne ne déplacera donc aucune
barre, ce qui est la propriété qu'on voulait — un drapeau qui change l'axe en le basculant serait un
drapeau qui ment. Contrepartie assumée : l'axe peut s'étendre au-delà de ce qui est dessiné.

**Hors ticket, 17/08/2026 — un `perl -0pi -e` qui ne s'applique pas ne fait échouer aucun test, et
ça ressemble à un test faible.** Deuxième mise en défaut de `formatPeriodShort` : zéro échec, ce qui
se lit d'abord comme « le test ne couvre pas la règle ». La substitution n'avait simplement pas
trouvé sa cible — le motif multi-lignes ne correspondait pas à la source. Rejouée en **vérifiant que
la mutation a bien touché le fichier** avant de lire le résultat : un seul test tombe, celui qui
nomme la règle. **Une mise en défaut se vérifie en deux temps** — que la mutation a pris, puis ce
qui tombe. Sans le premier, l'absence d'échec est ambiguë et se conclut à faux. C'est le pendant du
`grep` lossy relevé plus haut le même jour : les deux fois, c'est l'outil de mesure qui mentait.

**Hors ticket, 17/08/2026 — D39 est enfreinte sciemment, et voici où.** La page produit affiche
désormais **l'écart du dernier relevé à la cible** (« Encore 14 % pour atteindre la cible »,
« Cible atteinte ») et une **jauge de progression** vers cette cible. Quatre textes l'interdisent en
propres termes : **D39** (`docs/07`, « est interdit tout indice **calculé par Vision** ») dont
l'en-tête précise qu'« aucune ne se rouvre en cours de développement » ; **`docs/06` §6** (« aucun
calcul d'écart […] le point de bascule où Vision cesserait d'être un outil de mémoire pour devenir
un outil de justification ») ; l'**arbitrage (g)** de `tickets-C5.md` (« ni "atteinte", ni écart au
dernier relevé, ni pourcentage de progression ») ; et **`brief-design.md` §4.3**. La jauge tombe en
outre sous les interdits d'interface du `CLAUDE.md` et de `docs/06` §10 (« pourcentage
d'avancement, jauge de complétion »).

Arbitré par l'humain les 17/08/2026, en deux temps : l'écart d'abord, la jauge ensuite — elle avait
été écartée au premier tour, puis redemandée. La règle 6 du `CLAUDE.md` prévoit exactement ce cas :
« un désaccord se consigne dans `JOURNAL-TECHNIQUE.md`, et le travail continue. » C'est fait.
**Les quatre textes restent en vigueur et disent le contraire du code** : qui les relira trouvera la
divergence, et c'est ici qu'elle s'explique. Le calcul vit dans `targetGap`
(`lib/queries/indicators.ts`), isolé et testé, plutôt qu'égrené dans un JSX — une dérogation qu'on
assume se tient à un seul endroit.

Un piège que la maquette portait et que le code ne reprend pas : elle fait `cible − courant` et
annonce « Encore X pts », ce qui se lit **à l'envers** d'un indicateur `lower_is_better` — un taux
d'abandon à 8 % pour une cible à 5 % y passait pour atteint. `targetGap` juge l'atteinte sur
`direction` et rend une distance **non signée**.

**Hors ticket, 17/08/2026 — la North Star est un concept sans document.** Elle n'existe ni dans
`docs/02-concepts.md`, ni dans `docs/04-modele-donnees.md`, ni dans aucun chantier restant de
`docs/05` §5. Elle vit sur `indicators.is_north_star` plutôt qu'en clé sur `products` parce que
`docs/02` §10 écrit qu'un indicateur « reste un objet à part entière, relié à un produit, **et non
une propriété de celui-ci** » — un drapeau respecte cette lecture, une clé sur le produit
l'inverserait. L'unicité est un **index partiel** `(product_id) where is_north_star and archived_at
is null` : la leçon de `results_activity_unique` (T4bis.6), un indicateur archivé qui garderait son
drapeau occuperait la place et la désignation suivante lèverait un 500.

**Hors ticket, 17/08/2026 — `indicators.target_value` est un second lieu de vérité pour la cible.**
`project_indicators.target_value` reste celle d'une **adoption** — ce qu'un accompagnement s'est
fixé (`docs/02` §4, « toute cible d'indicateur appartient à un projet ») ; la colonne neuve porte
l'objectif **du produit**. Les deux coexistent et ne disent pas la même chose. L'écran les
distingue par le dessin — la cible produit porte l'étoile et la jauge, celles d'adoption sont des
traits discrets. Choix arbitré ; le risque est qu'on saisisse l'une pour l'autre, et la note du
champ le dit.

**Hors ticket, 17/08/2026 — `setNorthStar` éteint avant d'allumer, et l'ordre n'est pas
indifférent.** L'index partiel refuse deux North Star vivantes, et `neon-http` n'a pas de
transaction interactive (dette de T3.6). L'ordre inverse lèverait la violation une fois sur deux.
C'est le **miroir de T3.6**, qui ordonnait les ajouts avant les retraits pour la raison symétrique :
là c'est le retrait qui cassait, ici c'est l'ajout. La fenêtre entre les deux écritures laisse le
produit **sans** North Star, jamais avec deux — l'état dégradé qu'on préfère, lisible et rejouable.

**Hors ticket, 17/08/2026 — premier état d'ouverture côté client.** `indicator-menu.tsx` est un
`"use client"` qui décide *lui-même* de ce qui est visible, là où les cinq composants clients
existants (`panel.tsx` et les panneaux de saisie) rendent ce qu'une URL a décidé (D30, tenu depuis
T3.2). **Sans JavaScript, le menu ne s'ouvre pas** — c'est la seule régression du bloc ; les gestes
restent atteignables par leur URL (`?indicateur=`, `?releve=`, `?releves=`) mais plus par l'écran.
Arbitré. Le composant ne reçoit ni droit ni action : ses entrées sont des `<Link>` et des `<form>`
décidés par le serveur, comme `Panel` n'en reçoit aucune.

**Hors ticket, 17/08/2026 — la contrainte « pas de `viewBox`, donc pas de `path` » ne vaut plus
partout.** Elle gouvernait la frise depuis T5.6 parce que le SVG portait du **texte**, qu'un
`viewBox` mis à l'échelle aurait grossi. Le bloc North Star n'en met aucun : points, valeurs et
graduations sont du HTML posé en pourcentage par-dessus. `viewBox` + `preserveAspectRatio="none"` +
`vector-effect="non-scaling-stroke"` redonnent donc `path`, et `curvePath` le rend, testé. La note
de T5.6 reste vraie **pour un SVG qui porte du texte**, et la relire comme une règle du projet
serait désormais un contresens.

**Hors ticket, 17/08/2026 — l'axe du bloc North Star part de zéro.** `valueScale` bornait au plus
petit et au plus grand des relevés : la courbe remplissait sa boîte, mais une progression de 54 à
60 % y ressemblait à une envolée — l'œil lisait une pente qui n'existe pas à cette échelle.
`axisScale` part de zéro quand toutes les valeurs sont positives, et retombe sur `valueScale` dès
qu'une descend en dessous — une mesure signée n'a pas de plancher naturel à zéro. La jauge et la
courbe partagent cette échelle, si bien que la jauge est la projection du dernier point sur l'axe
du tracé, et non un second système de coordonnées à réconcilier de l'œil.

**Hors ticket, 17/08/2026 — la roadmap est passée sous la liste, contre `docs/06` §6.** Le document
la veut « au-dessus de la liste des accompagnements, sans la déplacer ». L'ordre de la page est
désormais : North Star, liste, roadmap. La raison assumée : la North Star porte la question à
laquelle le produit répond, la roadmap détaille le comment, et le détail vient après. `docs/06` §6
reste en vigueur et dit le contraire.

**Hors ticket, 17/08/2026 — `app/**` entre dans le périmètre des tests.** `vitest.config.mts`
n'incluait que `lib/**`, si bien que la discipline « le droit s'éprouve par l'action » n'avait
aucun chemin pour s'exercer : les actions vivent dans `app/`. `actions.test.ts` est le premier
fichier de tests d'action du projet ; il remplace `next/headers` et `next/cache`, et rien d'autre —
la base est réelle, les portes sont les vraies. **Il a démenti deux de mes premisses** : sans
cookie, `requireSession` ne refuse pas et le domaine ne protège pas — `resolveDomainId` rend le
premier domaine actif et `resolveAccount` y choisit un compte, si bien qu'on est quelqu'un, parfois
le responsable. C'est le sélecteur de personne du POC (T1.4, D37), pas un défaut de l'action. Le
test l'épingle et **tombera en C7**, quand Entra ID remplacera `lib/auth/provider.ts` : c'est ce
qu'on lui demande.

**Hors ticket, 17/08/2026 — une mise en défaut a révélé un test qui ne tient rien.** Retirer le
`continue` de la boucle d'extinction de `setNorthStar` ne fait tomber **aucun** test, y compris
celui nommé « redésigner la North Star en place la laisse en place ». C'est exact et non
rattrapable par un meilleur test : sans `continue`, l'action écrit `false` puis `true` sur la même
ligne, et l'état final est identique. Le `continue` est une **économie d'écriture, pas une garantie
de correction** — le commentaire du code le disait de travers. Conservé pour l'économie, avec le
commentaire corrigé. → **rien à faire ; noté pour qui relira le test.**

**Hors ticket, 17/08/2026 — la jauge s'arrêtait à la cible, parce que l'échelle se bornait sur les
données.** Défaut signalé et corrigé le jour même. `axisScale` prenait son maximum au plus haut des
relevés **et de la cible** ; une cible à 85 % plus haute que tous les relevés devenait donc le
maximum, et son marqueur se collait au bout de la piste — la jauge « allait jusqu'à 85 % » au lieu
d'aller jusqu'à 100. Le cas n'est pas marginal : c'est le cas **normal** d'un objectif pas encore
atteint.

La correction ne peut pas être un référentiel d'unités — D25 en renvoie l'écran à C7, et le
`CLAUDE.md` interdit d'inventer. Elle lit ce que **la personne a elle-même écrit** :
`unitCeiling` reconnaît « % » (100) et « /N » (N), et rend `null` pour tout le reste — « jours »,
« s », « € » n'ont aucun plafond naturel et l'échelle se borne alors sur les données, comme avant.
Ce n'est pas un référentiel : c'est la lecture d'une notation.

Deux gardes que la mise en défaut tient : le plafond **ne rogne jamais une donnée** (un 120 % saisi
par erreur reste visible — une échelle qui cache une valeur ment davantage qu'une échelle trop
haute), et il **ne s'applique pas à une grandeur signée** (une variation en points de pourcentage
n'est pas un pourcentage).

**Corollaire : la sparkline des cartes ne partage pas cette échelle.** Elle est revenue à
`valueScale` — min → max de la série —, ce que fait aussi le `spark()` de la maquette. Une
sparkline montre une **forme** ; partir de zéro l'aplatirait jusqu'à l'illisible. Elle n'est pas
décorative pour autant : la carte écrit la valeur, sa date, le sens de lecture et le décompte à
côté. Le grand tracé, lui, a un axe chiffré et part de zéro.

**Hors ticket, 17/08/2026 — deux défauts du graphe North Star, signalés et corrigés.**

**(1) La valeur du dernier point mangeait le libellé de cible.** Le libellé vit au bord droit ; le
dernier relevé se pose à `(n − 0,5) / n` de l'axe, soit ~97 % sur une série large, et sa valeur
centrée débordait dessus. Le tracé et ses points reculent donc derrière une **gouttière de 96 px**
(`right-24`), là où les filets et les traits de cible gardent toute la largeur — ce sont eux qui
portent le libellé, et les rétrécir l'aurait décollé du bord. **La rangée de graduations a dû
prendre la même gouttière** (`mr-24`) : sans elle, la dernière graduation tombait à droite du point
qu'elle situe — un défaut introduit par le correctif lui-même, et rattrapé avant d'être servi. Les
valeurs des points se calent en outre comme les graduations : centrées au milieu, rentrées aux deux
bouts.

**(2) La cible s'affichait deux fois.** Quand un accompagnement s'est donné **la même cible que le
produit** — le cas courant, puisque c'est souvent le même objectif —, son trait se superposait
exactement à celui du produit et son libellé s'imprimait par-dessus : deux fois « Cible 85 % » au
même pixel. Le dédoublonnage se fait sur `valueOffset` et non sur la chaîne brute — « 85 » et
« 85.0000 » sont la même cible et se superposeraient tout autant. Les cibles d'adoption qui
subsistent passent au **même rouge** que celle du produit : ce sont des cibles, et la couleur le
dit ; c'est le libellé ★ qui distingue l'objectif global, pas une seconde teinte.

**Hors ticket, 17/08/2026 — une exécution rouge non reproduite.** Un `npm test` a rendu 10 échecs,
soit exactement la taille d'`actions.test.ts`, puis cinq exécutions consécutives — trois complètes,
deux ciblées — sont vertes, et aucun domaine `__test__%` ne subsiste en base. Cause non établie :
la branche Neon est partagée par tous les fichiers de test et par le serveur de développement qui
tournait à côté, et `beforeAll` y crée un domaine entier. **Je n'ai pas de démonstration, seulement
une absence de reproduction** — noté pour que la prochaine occurrence ne soit pas prise pour la
première. → **à surveiller ; un `beforeAll` qui échoue rend tout le fichier rouge d'un coup, ce qui
est la signature observée.**

**Hors ticket, 17/08/2026 — `relative` et `absolute` se disputaient la même propriété, et l'ordre
des classes ne tranche pas.** Le menu « … » des cartes s'affichait en haut à **gauche**, dans le
flux, au lieu du coin haut-droit. `IndicatorMenu` pose `relative` sur sa racine — son déroulant en a
besoin pour s'ancrer — et la carte lui passait `className="absolute right-3 top-3"`, concaténé
après. **Deux utilitaires de `position` dans un même attribut ne se départagent pas par leur ordre
d'écriture** : c'est l'ordre de la feuille générée qui décide, et Tailwind y émet `relative` après
`absolute`. Le prop `className` est donc **retiré** du composant — il invitait au piège — et qui
veut placer le menu l'enveloppe dans un conteneur positionné. La règle vaut pour tout composant qui
pose lui-même sa `position` : elle ne se surcharge pas de l'extérieur.

**Hors ticket, 17/08/2026 — les sparklines des cartes sont retirées, et le crochet d'écart avec.**
Les sparklines prenaient de la hauteur sans porter de lecture que la valeur, la date, le sens et le
décompte écrits à côté ne portaient déjà (demande du 17/08/2026). Le grand tracé de la North Star,
lui, reste : il a un axe chiffré et il porte la question du bloc.

**Le crochet d'écart était calculé et jamais rendu**, découvert en nettoyant : son JSX avait disparu
d'une réécriture antérieure alors que son `const` survivait, et je l'avais rapporté comme présent en
me fiant à un `grep` sur `border-dotted` qui, à ce moment-là, disait vrai. **Il n'a pas été
rétabli** : l'écart est déjà écrit en toutes lettres dans la colonne de gauche, et le redoubler sur
le graphe serait une seconde affirmation du même indice — celui que D39 interdit déjà. Le `const`
mort est retiré ; la question était posée dans le plan et se referme ainsi. → **si le crochet est
voulu un jour, il se réécrit à partir de `targetGap`.**

**Hors ticket, 17/08/2026 — la page produit portait trois langages visuels, et le bloc du milieu
n'en avait aucun.** Demande de cohérence d'ensemble sur « North Star », « Accompagnements » et
« Roadmap ». L'état de départ : deux cartes et **une section nue** ; trois graisses de titre
(12 px capitales primaire · 16 px demi-gras · 20 px gras) ; une note tantôt sous le titre, tantôt
**à côté** de lui ; trois rythmes verticaux (`mt-4` ad hoc · `gap-4` · `gap-5`). Rien de tout cela
n'était un défaut isolé — chaque bloc était cohérent avec sa propre maquette. **Les deux maquettes
ne s'accordent pas entre elles** : `roadmap/Roadmap.dc.html` donne un titre de 22 px, et
`northstar/NorthStar.dc.html` un surtitre de 12 px en capitales, pour deux blocs de même rang sur
la même page. Elles s'accordent en revanche sur la **coquille** — rayon 22 px, filet, même padding.
C'est donc la coquille qui a fait référence, et le surtitre de la North Star qui est devenu un
titre de plein rang.

**Le langage tient en cinq points**, et vit dans `components/ui/block.tsx` : coquille `Block` à deux
tonalités (`neutral`, `primary` pour la North Star, seule spécificité qui lui reste dans la
coquille) ; en-tête `BlockHeader` — marque décorative facultative, `h2`, note **toujours dessous**,
emplacement d'action à droite aligné en haut ; `gap-5` au premier rang des trois blocs ;
`rounded-2xl` pour les surfaces posées **dans** un bloc, le `3xl` restant celui du bloc ; un seul
jeton de note et un seul d'état vide.

**C'est une mesure qui a tranché la couleur de note, pas un goût.** `SectionHeader` note en
`content-neutral-base` ; sur `surface-primary-lighter` ce jeton tombe à **3,75:1**, sous la limite
du texte courant. Un en-tête commun devant tenir sur les deux tonalités, c'est le jeton qui passe
partout qui gagne : `content-neutral-dark`, **6,11:1** sur la surface bleue et **8,12:1** sur la
pâle. La roadmap a donc changé de jeton, et non l'inverse. Titre en `content-neutral-darkest` :
**13,45:1** sur la bleue, mesuré aussi.

**`flush` retire la carte d'une liste, jamais ses lignes.** Le bloc « Accompagnements » entrant dans
une carte, sa `List` en portait une seconde à l'intérieur. Le prop **se passe aux deux** — la liste
pour la surface, la ligne pour le retrait horizontal — faute d'un contexte : `list.tsx` est rendu
sur le serveur, et `createContext` y imposerait un `"use client"` que rien d'autre ne justifie. Le
défaut est `false`, aucun autre appelant ne bouge. Les lignes d'accompagnement sont depuis
exactement celles de la roadmap juste en dessous : même filet, même `py-4`.

**Un commentaire JSX ne peut pas être frère de la racine retournée.** `return ( {/* … */} <div> )`
donne `TS1005: ')' expected` — quatre erreurs en cascade pour un commentaire mal placé. Un
`/* … */` JavaScript au même endroit passe : c'est une expression parenthésée, pas du JSX.

**Les deux états vides ont été éprouvés en mettant la règle en défaut**, non en les décrivant :
`projects.length > 0` forcé à `false` fait paraître l'`EmptyState` dans la carte, en `h3` sous le
`h2` du bloc — et rien d'autre ne bouge ; `!scale` forcé à vrai fait paraître le paragraphe de
roadmap sans date, **avec la promesse de filtre retirée de la note**, ce qui est la seule raison
qui restait à `Header` d'être local. Les deux neutralisations ont été défaites avant la vérification
finale.

**Un écart connu et non traité : `Section` et `Block` cohabitent.** La page projet garde `Section`
— rayon `xl`, titre `md` —, la page produit prend `Block`. Les deux pages divergent donc entre
elles là où leurs blocs sont de même nature. Hors du périmètre de la demande, qui portait sur la
page produit. → **ETAT.md, point ouvert.**

**Une incohérence documentaire relevée en passant, non corrigée** : l'en-tête de `roadmap.tsx`
renvoie encore à `indicator-curves.tsx`, supprimé le 17/08/2026 et fusionné dans `indicators.tsx`.
Règle 3 — le fichier n'était ouvert que pour sa coquille.

---

## Menu « … » sur les cartes de roadmap — hors ticket, 17/08/2026

**Le composant demandé existait déjà, au mauvais endroit.** La demande décrivait un bouton « … »
réutilisable ouvrant un menu contextuel ; `components/products/indicator-menu.tsx` en était un,
écrit la veille pour le bloc North Star, avec `Échap`, le clic extérieur en `pointerdown` et les
attributs ARIA déjà arbitrés. Il a été **promu** en `components/ui/action-menu.tsx` plutôt que
doublé. Un second menu aux mesures différentes aurait été exactement ce qu'un composant partagé
existe pour empêcher.

**La mesure demandée corrige un défaut d'accessibilité, elle ne fait pas que changer un style.**
La bordure passait de `border-primary-lighter` (`--midnight-200`, #d4def2) à `border-primary-base`
(`--midnight-500`, #24226a). Mesuré sur `surface-neutral-pale` (#fdfdfd) : **1,33:1 avant, 13,65:1
après**, là où WCAG 1.4.11 demande 3:1 pour la limite d'un composant d'interface. L'ancienne
bordure était donc invisible au sens de la norme, sur les deux menus North Star, depuis la veille.
Les trois points (`surface-primary-dark`) donnent 15,72:1 et ne bougent pas.

Le fond reste `surface-neutral-pale` (#fdfdfd) et non le `#ffffff` de la demande : `--greyscale-0`
n'a **pas** de jeton sémantique de surface dans ce thème, et la règle « aucun septième substitut »
interdit de lui en inventer un. 32×32 s'obtient par `h-8 w-8`, 8px par `rounded-lg`, 1px par
`border` — aucune valeur en dur (règle 2).

**Un champ obligatoire ne tient pas dans une entrée de menu, et c'est ce qui a déplacé « Annuler ».**
Les six autres gestes sont des liens ou des formulaires nus, qui entrent tels quels. L'annulation
porte un motif `required` (`activities_cancelled_requires_reason`) que l'entrée dépliait sous un
`<details>`. Dans un menu, ce repli aurait doublé la hauteur du panneau pour un geste rare. Le geste
part donc en `ConfirmPanel` sur `?annuler=<id>`, sixième clé de la page.

**Conséquence non anticipée : `cancelActivity` a dû cesser de refuser en silence.** Sa note disait
« un refus est muet : ni saisie à préserver ni message à afficher ». C'était vrai tant que le geste
n'avait pas d'écran ; un panneau muet devant un refus n'apprend rien. Elle prend la signature
d'`archiveProject` — `(id, ConfirmState, FormData) => Promise<ConfirmState>` — et `transitionActivity`
reste seule à refuser sans mot, n'ayant toujours pas d'écran. **Une note qui devient fausse se
récrit** : les deux JSDoc qui l'affirmaient ont été corrigés, dans le fichier d'actions et dans
`roadmap.tsx`.

**`ConfirmPanel` a accueilli un champ sans qu'une ligne change**, ce qui n'était pas acquis : ses
`children` sont rendus **à l'intérieur** de son `<form action={submit}>` (l. 119 → 133). Un panneau
« qui ne saisit rien », selon son propre en-tête, saisit donc très bien quand on lui en donne
l'occasion. Aucune sixième coquille n'a été écrite.

**Ce que le HTML servi dit de la régression sans JavaScript.** Sur `/projets/<id>`, trois
`<button aria-haspopup="menu" aria-expanded="false">` sont rendus, et **zéro** `role="menu"`,
**zéro** `role="menuitem"`, **zéro** champ `$ACTION_` de roadmap. Les formulaires n'existent que
dans la charge RSC, où l'on lit en clair `"name":"bound archiveActivity"` et ses arguments liés —
confirmation que l'argument lié n'est pas un secret, et que le verrou reste dans l'action.

**Le droit a été éprouvé par l'action, pas par l'écran.** Quatre POST multipart forgés sur
`cancelActivity`, avec l'identifiant d'action et les arguments relus dans le HTML : motif vide,
activité d'un autre projet en état `done`, identifiant inexistant, et session sans `writeProject`.
Les quatre rendent un message et **n'écrivent rien** — vérifié après coup sur la roadmap, qui ne
montre ni groupe « Annulé » ni motif forgé. Trois sessions sans droit d'écriture ne reçoivent
**aucun** bouton « … », `hasGestures` tombant en entier.

**Un piège de mesure, pas de code : la base de développement rend des échecs transitoires.** Une
première mise en défaut de `validateCancellationReason` a fait tomber **onze** tests, dont dix sur
`setNorthStar` — sans rapport avec un motif d'annulation. Rejouée, elle n'en fait tomber qu'un,
`validateCancellationReason > un motif vide est refusé`, et rien d'autre. Les dix autres étaient des
requêtes Neon en échec, visibles dans `.next/dev/logs/next-development.log`. **Une neutralisation ne
se lit pas sur une seule exécution quand la suite touche le réseau.**

**Une modification étrangère au travail, laissée en place.** `components/products/roadmap.tsx` porte
une neutralisation non défaite du 17/08/2026 : `Header` ignore son argument `filterable` et la note
a perdu sa phrase « Filtrez la période affichée. » — précisément la neutralisation que l'entrée
précédente de ce journal déclarait défaite avant vérification finale. Elle produit le seul
avertissement d'ESLint du dépôt. Hors périmètre (règle 3) : signalée, pas corrigée.


**T5bis.1 — la fiche annonçait `0003`, la migration est `0004`, et ce n'est pas une coquille
isolée.** Le numéro a été consommé le matin même par la North Star, hors ticket, entre le découpage
de C5bis et son premier ticket. Sans conséquence ici — le fichier est généré, son nom ne se choisit
pas — mais la leçon vaut pour les six fiches restantes : **une fiche écrite au découpage vieillit dès
qu'un travail hors ticket touche au même dépôt.** Les fiches suivantes nomment des numéros de
migration ; aucun ne se croira sur parole.

**T5bis.1 — la recette de mise en défaut de la fiche ne compile pas, et la variante n'est pas
équivalente.** La fiche demande de « retirer `domainRef()` de `person_skills` » pour voir tomber les
cas d'étanchéité. Le geste est impossible : sans `domainId`, la table cesse de satisfaire
`ScopedTable`, et ce sont **tous** les appels du fichier qui cassent, pas un test qui tombe. Une
mise en défaut qui empêche la compilation ne prouve rien — elle ne distingue pas le mécanisme visé
du reste. Variante retenue : retirer le `.references()` de `skillId`, qui prive `parentChecksOf` de
la clé sans toucher au typage, et fait tomber **un** cas. **Une recette de vérification écrite au
découpage se relit à l'exécution, comme le reste de la fiche.**

**T5bis.1 — un test à trois assertions n'est pas trois tests, et la mise en défaut le révèle.** Les
trois clés étrangères de `person_skills` étaient d'abord éprouvées dans un cas unique. La
neutralisation de l'une faisait tomber le même nom de test que la neutralisation des deux autres :
le témoin ne désignait plus rien, et « exactement les tests attendus » devenait invérifiable. Scindé
en trois avant d'être cru. **La granularité d'un test se juge à ce que sa chute apprend, jamais à ce
qu'il couvre.**

**T5bis.1 — sept présentations et sept disponibilités inventées, contre la règle de tête de
`seed.ts`.** Le fichier promet que « les données factices viennent de `docs/design/brief-design.md`
§7, et de nulle part ailleurs. Un champ que le brief ne donne pas reste nul » — règle qui a fait
laisser nuls `external_url`, `tools.base_url` et les courriels. Le brief ne connaît ni présentation,
ni disponibilité, ni compétence, et la fiche T5bis.1 les exige nommément parce que six écrans en
vivent. L'invention est donc assumée et **écrite dans le fichier**, à l'endroit où elle se lit. La
dérogation est bornée à ces trois champs : `email` et `external_id` restent nuls.

**T5bis.1 — la répartition des compétences de la fixture est un instrument de vérification, pas une
donnée d'agrément.** Trois de ses propriétés seront des critères de tickets à venir : une personne à
**deux** compétences (l'absence de radar, T5bis.5), une personne qui porte **User Research et
Accessibilité** quand quatre autres n'en portent qu'une (la conjonction du filtre, T5bis.3), et les
**trois** valeurs de disponibilité représentées (les trois couleurs de pastille à mesurer, T5bis.2).
Une fixture « rangée » plus tard casserait trois critères sans qu'aucun test ne s'en plaigne : le
seul rempart est la phrase qui l'explique, dans `seed.ts` et ici.

**T5bis.1 — le compte de tables de `lib/db/scoped.ts` est devenu faux, et n'a pas été corrigé.**
L'en-tête de `schema.ts` disait « les 23 tables métier » et dit désormais 26 ; la phrase jumelle de
`scoped.ts:71`, « Les 22 sauf `domains` », en dénombre maintenant 25 et n'a pas été touchée : le
fichier est hors du périmètre de la fiche (règle 3). Un commentaire faux dans un fichier qu'on
n'ouvre pas est le prix d'un périmètre tenu ; il se corrigera au premier ticket qui ouvrira
`scoped.ts` — C6 en aura l'occasion.

**T5bis.1 — un `CHECK` sur une table existante était un chemin non éprouvé, et drizzle-kit le
génère.** Les quatre `CHECK` du dépôt étaient nés à l'intérieur d'un `CREATE TABLE` (migration
`0000`) ; rien ne disait que l'outil savait en ajouter un par `ALTER TABLE`. Il le fait, en dernière
instruction du fichier généré. Le risque était réel — la fiche interdit d'écrire à la main dans un
fichier généré, et l'alternative aurait été d'arrêter le ticket — et il est désormais levé pour les
`CHECK` à venir.

**T5bis.2 — `docs/06` §8 écrit « Navigation principale, quatre entrées », il y en a cinq.** L'écart
est décidé par la fiche du ticket, qui l'annonce et ordonne de le consigner sans le discuter. Il est
donc **assumé et localisé** : `MAIN_NAV` porte la raison en commentaire — Équipe se range après
« Projets » parce que le chemin canonique reste Produits › Projets, et qu'une personne n'est pas un
chemin vers un accompagnement. `docs/` est figé ; c'est ici que la divergence se lit.

**T5bis.2 — une jointure scopée ne se met en défaut que sur une ligne forgée, et forgée sur une
seule colonne.** Retirer `filter(personSkills)`, `filter(skills)` ou `filter(skillLevels)` de
`listTeam` ne faisait tomber **aucun** test tant que la fixture n'était écrite que par la couche
scopée : la seconde lecture ne remonte que les personnes du domaine (`inArray`), et cet `inArray`
masque à lui seul les trois fuites. La couche refusant par construction d'écrire une ligne
transfrontalière (`assertPreconditions`), les quatre lignes témoins sont **forgées par le client
brut `db`** dans la fixture. Deuxième moitié de la leçon, découverte en les écrivant : une ligne qui
franchit la frontière sur **deux** colonnes à la fois — liaison d'un autre domaine *et* compétence
d'un autre domaine — est rattrapée par le second filtre quand on neutralise le premier, si bien que
le test reste vert et que la mise en défaut ne prouve rien. Chaque témoin ne traverse donc qu'une
colonne. **Sept neutralisations jouées, sept fois exactement un test tombé** : les cinq `filter()`,
le tri des personnes, celui des compétences.

**T5bis.2 — la base de développement sert neuf personnes, la fixture en compte huit.** Le HTML de
`/equipe` porte une « Nadia Berthier », intervenante côté entité qu'aucun `db:seed` ne connaît —
créée au navigateur par un ticket passé, très probablement par le bloc « Ajouter une personne » du
formulaire de projet que T5bis.7 doit retirer. C'est la dérive actée du 14/08/2026, et non un
défaut : le critère de la fiche a été lu sur les **huit** personnes semées, toutes présentes et
justes. La ligne surnuméraire se comporte d'ailleurs comme attendu — mention « côté entité »,
métier « Non renseigné », aucune disponibilité.

**T5bis.2 — le contraste le plus juste du dépôt, et ce sur quoi il a été mesuré.**
`surface-warning-base` (`--orange-500`, #f26500) sur `surface-neutral-pale` (#fdfdfd) donne
**3,11:1**, à onze centièmes du seuil de 3:1 d'un objet graphique. Retenu quand même, et sans
inventer un septième substitut au design system : la pastille est `aria-hidden`, et
`AvailabilityDot` **écrit le mot lui-même** au lieu de le laisser à son appelant — rien ne repose sur
la couleur seule. C'est une divergence délibérée d'avec `StatusDot`, dont trois appelants viendront
d'ici la fin du chantier. Faute de navigateur pilotable dans cette session, les couples ont été
mesurés sur la **feuille de style servie** : les trois classes littérales sont bien émises par
Tailwind, et la chaîne de jetons y résout `--surface-warning-base` → `--orange-500` → `#f26500`. Les
deux autres pastilles : succès 4,53:1, neutre 4,98:1.

**T5bis.2 — l'état vide de `/equipe` n'a pas été éprouvé au rendu.** Le vider demanderait d'archiver
les neuf personnes de la base de développement, donc d'écrire pour vérifier une lecture. Le chemin
est tenu par le typage et par le patron des quatre autres écrans, pas par une observation. À
regarder au premier ticket qui écrira dans `persons` — T5bis.6, qui archive une personne.

**T5bis.2 — `ETAT.md` est au seuil, et le seuil n'est pas tenable sans balayage.** Le fichier était à
**251 lignes** en début de ticket, déjà au-dessus des 250 que `CLAUDE.md` fixe. Il en fait 250 après
compression de l'entrée neuve et du point ouvert récrit — au prix d'une prose plus sèche, et sans
marge pour les cinq tickets restants de C5bis. Un ticket ne peut pas balayer : `CLAUDE.md` réserve ce
geste à la session de découpage. **Le prochain découpage héritera donc d'un fichier saturé**, et
c'est là que ses sept lignes de C5bis se replieront en une.

---

## Hors ticket — « Vision produit », 18/08/2026

**« Vision Produit » est un concept ajouté hors des `docs/`.** Ni `docs/02` ni `docs/04` ne le
nomment : `docs/02` §7 pose bien « la raison d'être du niveau produit » comme « la question à
laquelle aucun outil du centre ne sait répondre », mais comme une question, jamais comme une
colonne. `products.vision` (migration **0005**) est donc, comme `indicators.is_north_star` le
17/08/2026, une **colonne que la documentation ne prévoit pas**. Les deux écarts sont de même
nature et se relisent ensemble. Rien n'est contredit — aucun texte n'interdit une vision produit —
mais quiconque compare `docs/04` §3 au schéma trouvera deux colonnes de plus, et c'est ici qu'elles
s'expliquent.

**L'arbitrage du 17/08/2026 sur le rattachement aux accompagnements est renversé, sous une autre
forme.** `indicators.tsx` portait en tête : « Le rattachement aux accompagnements ne se lit plus
ici (arbitrage du 17/08/2026, "strictement la maquette") : il vit sur la page projet ». La demande
du 18/08 le rétablit **sur les cartes seulement, et en puce** — un nom, jamais la ligne « Adopté
par… » qui avait été retirée. Ce qui alourdissait le bloc était la ligne, pas l'information. La
North Star n'en porte aucune : elle est l'objectif du produit, tous accompagnements confondus, et
lui coller une puce dirait le contraire. La page projet garde son bloc « Indicateurs adoptés »,
seul lieu des quatre valeurs chiffrées. Le renversement est assumé et l'en-tête du fichier le dit à
la place de l'ancien paragraphe, plutôt qu'à côté de lui.

**Le domaine courant se trouve par ordre alphabétique, et un fichier de tests peut en hériter d'un
autre.** `resolveDomainId` (`lib/auth/session.ts`) rend **le premier domaine actif *par nom***, le
POC n'ayant aucun moyen de lui en désigner un. Un fichier de tests d'action crée son domaine, mais
si un autre domaine actif trie avant lui, `requireSession` ouvre une session **dans cet autre
domaine** — ou aucune, si celui-ci n'a pas de compte. Les huit tests d'`updateProductVision` ont
échoué sur « Aucune personne courante : le domaine n'est pas amorcé », qui ne nomme pas la cause.

Trois domaines d'exécutions interrompues subsistaient sur la branche de test —
`__test__actions__ybwq1t44`, `__test__roadmap__a__5rtqoaa8`, `__test__roadmap__a__6j06n3um` — et le
fichier voisin `app/(app)/produits/[id]/actions.test.ts` **ne passait que par chance alphabétique**,
`__test__actions__` triant avant `__test__roadmap__`. Deux gestes : les trois domaines résiduels ont
été supprimés, et le fichier neuf porte désormais un nom qui trie en tête (`__0__test__vision__`)
**plus une garde** qui échoue en nommant la cause et en listant les domaines présents. La chance
alphabétique du fichier voisin, elle, reste entière — hors périmètre, et rien ne l'a corrigée.

**Une action serveur ne s'éprouve pas au `curl`, et c'est l'étape témoin qui l'a montré.** Le POST
multipart d'`updateProductVision`, monté avec les trois champs cachés `$ACTION_…` du balisage servi
et l'en-tête `Next-Action`, rend un **500 « Connection closed. »**. Le même harnais, pointé sur
`updateIndicator` — en place et fonctionnelle depuis T5.2 —, rend **le même 500**. Le défaut est
donc dans le harnais, pas dans l'action : sans ce témoin, on aurait cherché un bug qui n'existe pas,
symétrique exact de la leçon de TD.1 où un harnais urlencoded obtenait un 200 muet. **Le chemin
d'écriture se prouve par `app/(app)/produits/actions.test.ts`** — quatre cas, mis en défaut — et le
**rendu** d'une vision écrite se lit dans le HTML servi après écriture par la couche d'accès.

**`ETAT.md` dépasse le seuil, et le dépassement était annoncé.** T5bis.2 laissait le fichier à
**250 lignes** exactement en écrivant que « le prochain découpage héritera d'un fichier saturé ». Il
en fait **256** après cette entrée, compressée deux fois. Un ticket ne peut pas balayer —
`CLAUDE.md` réserve ce geste à la session de découpage — et une entrée de moins d'une ligne n'existe
pas. Le seuil est donc franchi sciemment, et il le restera jusqu'au découpage de C6.

---

## Hors ticket — l'ordre et le nom des trois blocs de la page produit, 18/08/2026

**L'ordre demandé rend à `docs/06` §6 ce que la veille lui avait pris, et ouvre un autre écart.**
La page rend désormais « Vision produit », puis la frise, puis la liste — donc la frise **au-dessus
de la liste des accompagnements, sans la déplacer**, ce que le document réclame et que l'ordre du
17/08/2026 avait inversé en la faisant fermer la page. Ce qui reste hors du document n'est plus la
position, c'est **le nom et la fenêtre** : le bloc s'intitule « Accompagnements en cours » et la
liste « Tous les accompagnements », deux libellés qu'aucun document ne porte ; et la frise s'ouvre
sur l'année en cours là où `docs/06` §6 décrit « une frise unique sur un axe temporel commun » sans
rien dire de son cadrage par défaut. Le couple se lit comme un couple : le cadrage annuel en haut,
l'histoire entière en bas.

**« En cours » qualifie la fenêtre, pas le statut.** Arbitrage tranché avant écriture : aucun filtre
sur `statusNature` n'a été posé. Un accompagnement terminé en mars 2026 reste dessiné dans le bloc,
parce que ce que le bloc montre est *ce qui s'est passé cette année*, et non *ce qui est actif
aujourd'hui*. La seconde lecture aurait demandé un tri des natures — donc une règle de plus, sur un
écran qui n'en demandait pas.

**Le repli hors-axe est ce qui empêche `defaultWindow` de mentir, et il se mesure.** `timelineWindow`
**borne**, il n'écarte pas : `yearWindow(scale, 2027)` sur un produit dont les données s'arrêtent en
février 2026 ramène les deux bornes sur `2026-02` et rend une fenêtre **d'un seul mois** — une
période affirmée que rien ne porte. C'est exactement le piège que `withinWindow` avait corrigé pour
les bandes le 17/08/2026, reparu un étage plus haut. La mise en défaut le montre en clair :
neutraliser le repli fait tomber **deux** tests, ceux qui le nomment, avec
`expected { firstMonth: '2026-02' } to deeply equal { firstMonth: '2024-03' }`. Éprouvé aussi **dans
le rendu**, en faisant croire au composant qu'on est en 2030 : l'axe servi rend alors ses sept
graduations de mars '24 à mars '27, et « Tout » porte `aria-current`.

**Une URL sans paramètre ne vaut plus « Tout », et le préréglage a dû changer de cible.** Il pointait
sur `ROUTES.product(productId)` ; il écrit désormais les deux bornes de l'axe entier
(`?de=<premier>&a=<dernier>`). Sans ce geste, le bouton « Tout » aurait ramené la fenêtre par défaut
au lieu de l'élargir — un contrôle qui ne fait pas ce qu'il dit. Vérifié dans le HTML servi sur trois
produits.

**Deuxième drapeau du fichier, et la même raison que le premier.** `SHOW_MONTH_RANGE = false` masque
le formulaire « De … à … » au mois. Une suppression aurait rendu morts `windowMonths` et les deux
paramètres d'URL — que les préréglages d'année continuent d'emprunter —, pour les ressusciter au
prochain ticket. Le formulaire est **sorti dans son propre composant** (`MonthRange`) plutôt que
laissé sous une condition dans `FilterBar` : sinon `const months = windowMonths(scale)` y restait
calculé sans lecteur, et rendait un avertissement ESLint là où on venait justement d'en retirer un.

**L'avertissement ESLint de `Header` est tombé, et ce n'est pas un nettoyage de passage.** Le
paramètre `filterable` était reçu sans être lu depuis le 17/08/2026 — c'est la « modification
étrangère au travail, laissée en place » consignée ce jour-là. Sa raison d'être était que la note ne
promette le filtre que lorsqu'il est rendu ; la note neuve — « Les accompagnements de ce produit sur
l'année en cours. » — ne promet plus rien, donc le paramètre n'a plus d'objet et il part avec elle.
Il reste **un** avertissement au dépôt, dans `components/ui/section.tsx` (`note` reçu sans lecteur,
même famille, sur le composant de la page projet) : hors périmètre, non corrigé, mesuré à 2
avertissements avant et 1 après.

**Le mot « roadmap » ne paraît plus à l'écran ; il reste dans le code.** `roadmap.tsx` et le
composant `Roadmap` gardent leur nom : ils désignent la couche de `docs/03` §7, dont la nature n'a
pas changé. Renommer le fichier aurait déplacé un import pour un mot d'interface, et le vocabulaire
du `CLAUDE.md` ne connaît de toute façon pas « roadmap » comme concept de modèle.

**Un piège de lecture du HTML, pas de code.** Le segment du bloc s'extrayait en coupant à la
première occurrence de « Tous les accompagnements » — qui apparaît désormais **à l'intérieur** du
paragraphe d'état vide de la frise, laquelle y renvoie. La coupe tombait donc avant le paragraphe
qu'on cherchait à lire, et l'absence se serait conclue à faux. Troisième variante de la même leçon
après le `grep` lossy et le `perl -0pi` sans cible : **l'outil de mesure ment plus souvent que le
code**.

Les deux états vides ont été éprouvés **en mettant la règle en défaut**, non en les décrivant :
`!scale` forcé à vrai rend la phrase « Aucun accompagnement de ce produit ne porte de date … Le bloc
« Tous les accompagnements », ci-dessous, les porte tous. » ; `projects.length === 0` forcé à vrai
rend « Les accompagnements de ce produit s'afficheront ici dès que l'un d'eux sera daté … ». Les deux
neutralisations ont été défaites avant la vérification finale, et l'absence de mutation résiduelle
vérifiée par `grep` avant de relire le rendu.

**`ETAT.md` passe de 256 à 263 lignes**, seuil de 250 toujours franchi. Rien de neuf : le
dépassement est celui qu'a consigné l'entrée « Vision produit » le matin même, et un travail hors
ticket ne balaie pas plus qu'un ticket — `CLAUDE.md` réserve ce geste à la session de découpage.
La ligne ajoutée est celle qu'exige l'étape 5, pas une de plus.

---

## Hors ticket — le bloc « Vision produit » sur `northstar-v2`, 18/08/2026

Reprise de `docs/design/maquettes/blocs/northstar-v2/` — structure, ergonomie, style — plus le
passage de toutes les typographies à Poppins. Les cartes d'indicateurs associés sont **hors
périmètre par consigne** : la maquette ne les porte plus, ce qui est une omission de la maquette et
non une suppression demandée.

**Trois arbitrages rendus avant écriture, dont deux élargissent une dérogation.**

1. **Le bloc quitte le langage d'en-tête commun.** `BlockHeader` — titre de plein rang, note
   dessous, action à droite — cède au surtitre de 12 pixels en capitales et au kebab en absolu de la
   maquette. C'est **l'unification du 17/08 défaite pour un bloc sur trois** : « Accompagnements en
   cours » et « Tous les accompagnements » gardent `BlockHeader`. Arbitré, consigné en dette
   `ETAT.md` §c. Le surtitre vit dans `indicators.tsx` sous le nom `Eyebrow` et **non** dans
   `components/ui/block.tsx`, précisément parce qu'il n'est pas partagé ; il déménagera le jour où
   un second bloc le reprend, pas avant.
2. **Le crochet d'écart et sa pastille « +14 pts » sont repris.** Ils redisent en image l'indice
   calculé que la phrase « Encore 14 points… » dit déjà en mots, et tombent sous la dérogation à D39
   arbitrée le 17/08 — laquelle s'élargit donc d'un élément. Aucun calcul neuf : `targetGap` rendait
   déjà `{ reached, distance }`, `topOf` rendait déjà les deux ordonnées.
3. **La vision s'écrit en `text-3xl`.** La maquette demande 27 pixels ; l'échelle §3.2 porte 24 puis
   30, et rien ne s'invente entre les deux.

**Le piège du chantier, et il ne s'est pas vu à la lecture du diff.** La North Star entre dans une
carte blanche. Trois éléments se peignaient jusque-là **avec le fond du bloc** pour rester lisibles
par-dessus les filets de la courbe : la pastille de cible du produit, celles des adoptions, et
l'anneau des points. Posés tels quels sur la carte, ils y auraient dessiné trois rectangles bleus.
`bg-surface-primary-lighter` → `bg-surface-neutral-pale`, `border-surface-primary-lighter` →
`border-surface-neutral-pale`. **Leçon transportable : un conteneur qui change de fond emporte tout
ce qui se peignait du fond d'avant**, et ces peintures-là ne se déclarent nulle part — elles ne se
retrouvent qu'en cherchant le nom du fond quitté dans les descendants.

**La carte se détache moins que dans la maquette, et c'est mesuré.** Maquette : carte `#ffffff` sur
bloc `#eef2fb`, 1,12:1. Nos jetons : `surface-neutral-pale` sur `surface-primary-lightest`,
**1,04:1** — `midnight-100` est presque blanc. En revanche **notre bordure est plus franche que la
sienne** : 1,33:1 contre l'intérieur de la carte et 1,28:1 contre le bloc, là où la maquette pose
1,23:1 et 1,10:1. La carte se lit donc par son trait plutôt que par son fond. Le bleu intermédiaire
n'existe pas en jeton : `midnight-150` (`#e4ecf8`) est une primitive que la couche sémantique §2.1
n'utilise nulle part, et lui donner un jeton serait modifier le design system, hors du périmètre
d'une reprise de bloc. Consigné en dette `ETAT.md` §c.

**Le dégradé, lui, est rendu — contrairement à celui de la jauge, et la différence tient aux
stops.** Le 17/08 avait refusé le dégradé de la jauge parce que `#4b45ab` n'a pas de jeton et que
`tokens.css` §9 nomme les gradients sans les définir. La barre d'accent du rang 1 va de `#211c5e` à
`#9c360c`, qui **sont** `content-primary-dark` et `content-warning-darker`. Le CSS servi le
confirme : `--tw-gradient-from: var(--content-primary-dark)`. Aucune valeur ne s'invente ; seule la
construction est structurelle, comme l'est un `flex`.

**Toutes les mesures d'espacement neuves passent par le jeton, vérifié dans la feuille servie** —
`.mt-7\.5 { margin-top: calc(var(--number-4) * 7.5) }`, et de même pour `mb-6.5`, `mt-8.5`,
`h-0.75`, `w-5.5`, `gap-2.25`, `right-8`, `max-w-215`. La règle 2 tient : le rythme 16/30-26/14/34-16
de la maquette s'obtient en multiples du pas de 4 pixels, sans une valeur littérale.

**Un rythme propre revient là où le 17/08 l'avait retiré.** Le `gap-5` de `Block` mettait la même
valeur entre tous les rangs ; la maquette rythme. Tout le contenu tient donc dans **un seul enfant
de `Block`** — le `gap-5` ne s'applique plus qu'à lui — et les marges se portent élément par
élément. Ce même enfant est `relative`, ce qui ancre le kebab sans toucher une ligne de `block.tsx` :
`ActionMenu` refuse tout `className`, sa racine portant elle-même le `relative` dont son déroulant a
besoin.

**Poppins passe en famille secondaire, et le fait qu'elle ne se propage pas tient à un seul
endroit.** `--font-family-secondary` valait `Arial, sans-serif` et n'avait qu'un lecteur
(`app/dev/session/page.tsx`). Le jeton est **conservé** plutôt qu'effacé : c'est le point où un autre
domaine posera sa seconde famille. Poppins n'est écrite nulle part ailleurs — vérifié par `grep` sur
`app/`, `components/` et `lib/`, qui ne rend que `tokens.css`, `globals.css` et le `next/font` de
`app/layout.tsx`.

**La gouttière du tracé se resserre de 96 à 32 pixels.** Elle protégeait le libellé de cible, qui
vivait au bord droit depuis le correctif du 17/08 ; la maquette le passe à gauche, la raison tombe.
Il en reste de quoi laisser respirer la valeur du dernier point et sa pastille d'écart. **Le risque
change de côté sans disparaître** : le libellé de cible peut désormais rencontrer le premier point
plutôt que le dernier, quand la cible vaut à peu près le plus ancien relevé. `monthMark` pose le
premier point au milieu de sa tranche, jamais à 0 %, ce qui laisse un peu d'air ; la maquette accepte
la même géométrie et n'oppose aucun mécanisme. Non traité, signalé.

**La mise en défaut du décompte a demandé deux neutralisations, pas une.** `formatComplementaryIndicators`
accorde **deux** mots. Forcé au pluriel constant, seuls « zéro » et « singulier » tombent — le test
du pluriel passe encore, et l'accord de l'adjectif n'aurait jamais été éprouvé. Forcé à
`indicateur${s} complémentaire`, ce sont « zéro » et « pluriel » qui tombent. **Une seule
neutralisation aurait déclaré la règle couverte alors qu'un `s` manquant sur l'adjectif serait passé.**
Les deux neutralisations ont été défaites et les 27 tests du fichier revérifiés au vert.

**Un piège de mesure, encore, et de la même famille que les trois déjà consignés.** La matrice des
droits a d'abord montré le responsable de domaine **sans** kebab et deux membres **avec** — soit
l'inverse de la règle. Le code n'y était pour rien : les premières requêtes de la boucle couraient
contre une compilation à la demande et rendaient une page partielle. Relancée à chaud, la matrice
donne Camille (responsable) `1/1/1`, Awa (membre non contributrice) `0/0/0`, Inès et Léa (membres
contributrices) `1/0/1` — les deux points d'entrée tombant bien séparément. **Quatrième variante de
« l'outil de mesure ment plus souvent que le code » : sur un serveur de développement, la première
lecture d'une route ne mesure pas la route.**

**`ETAT.md` passe de 263 à 288 lignes**, seuil de 250 franchi de plus belle. Les 25 lignes sont
celles qu'exigent les étapes 5 et 6 — une ligne de journal et deux dettes mesurées, chacune avec sa
destination. Le dépassement préexiste depuis le 18/08 au matin, et un travail hors ticket ne balaie
pas plus qu'un ticket : `CLAUDE.md` réserve ce geste à la session de découpage, qui devra le faire
avant d'ouvrir C6.

---

## Hors ticket — le bloc « Personae », 18/08/2026

**Le concept « Persona » est ajouté hors des `docs/`**, et c'est la troisième fois. Ni `docs/02` ni
`docs/04` ne le nomment : le vocabulaire de `CLAUDE.md` ne connaît que `persons`, la personne
réelle. La North Star (17/08) puis la vision produit (18/08) avaient ouvert ce chemin ; celui-ci va
plus loin qu'eux — ce n'est pas une colonne sur une table existante, ce sont **deux tables neuves**,
`personas` et `persona_traits`. La règle 6 demande de le consigner plutôt que de rouvrir une
décision : c'est fait ici. Ce qu'il faudra trancher un jour, et qui n'appartient pas à un travail
hors ticket : `docs/02` et `docs/04` décrivent-ils désormais les personae, ou vit-on avec un modèle
dont trois éléments ne sont écrits que dans le code ?

**`persons` et `personas` ne diffèrent que d'une lettre, et n'ont aucun rapport.** C'est la seconde
paire de ce genre après `activities` / `events`, que `CLAUDE.md` signale comme « piège à ne jamais
confondre ». `persons` porte les membres du centre et les intervenants, avec leurs compétences et
leur disponibilité ; `personas` porte des archétypes d'utilisateurs qui n'existent pas et ne se
connectent à rien. Le piège est écrit en tête des deux tables du schéma. **Il est plus dangereux que
le premier** : `activities` et `events` ne se ressemblent qu'au sens, ces deux-là se ressemblent à
la frappe — et l'autocomplétion propose les deux.

**`persona_traits` n'a délibérément pas d'`archived_at`, et c'est ce qui la rend écrivable.** Le
typage de `lib/db/scoped.ts` réserve `unlink` — la seule vraie suppression de la couche — aux tables
sans cette colonne. Une ligne d'objectif est une ligne d'une zone de texte : on la retire comme on
vide la vision d'un produit, et ce n'est pas la donnée métier que la règle 4 protège. Poser
`archived_at` « par prudence » aurait rendu la table non modifiable autrement que par archivage, et
une correction de faute d'orthographe aurait laissé la faute en base à côté de sa correction.

**Le diff par `(kind, label)` plutôt que le remplacement : la seule décision d'architecture du
lot.** `syncTraits` aurait pu récrire les trois listes à chaque enregistrement — c'est plus court,
et personne ne l'aurait vu. La demande porte pourtant sur un **référentiel** : « pour quel persona
concevons-nous cet élément », et à terme « quel irritant cet écran adresse ». Un remplacement
donnerait à chaque trait un identifiant neuf à chaque correction, et la liaison posée hier
pointerait demain une ligne effacée. Le rapprochement se fait donc sur ce qu'une personne reconnaît
— la famille et le libellé —, et le test qui l'épingle est explicite : *« les traits gardent leur
identifiant quand leur libellé ne change pas »*. **Corollaire assumé** : corriger une faute dans un
libellé casse l'identité de ce trait. C'est le prix d'un rapprochement par le texte, faute d'un
champ stable que la saisie en zone de texte ne peut pas porter.

**Le champ répétable reste interdit, et la structure ne le paie pas.** La limite du 14/08 tient : un
champ qui se duplique au clic exige le JavaScript que la cinquième discipline refuse. Trois zones de
texte, une ligne = un élément, et `readLines` fait le découpage. **La saisie est donc du texte et la
donnée est structurée**, ce qui était le point de la demande — et le formulaire fonctionne sans une
ligne de script, comme les huit autres.

**Deux clés d'URL pour un même objet, et c'est la première fois.** `?persona=` ouvre la saisie,
`?fiche=` ouvre la lecture. La règle du dépôt depuis T3.2 est « une clé, dont la valeur porte le
cas » ; elle est enfreinte ici sciemment, parce que ce ne sont pas deux gestes de même rang mais
**deux droits** : la fiche se lit par tout le domaine (D9), la saisie demande le droit d'écrire. Une
clé unique aurait fait tomber la fiche avec le droit, ou ouvert la saisie à qui ne l'a pas. C'est la
séparation que `releves` tenait déjà pour la série d'un indicateur, portée cette fois sur le même
objet. Le décompte d'exclusivité passe de cinq clés à sept **sans qu'un caractère change** — c'est
la troisième fois qu'il encaisse une clé neuve, et il avait été écrit en décompte pour cela.

**Le seul `<img>` du dépôt, et le seul `eslint-disable`.** Vision n'héberge aucun fichier : l'adresse
d'un portrait est arbitraire et externe. `next/image` aurait demandé d'ouvrir `remotePatterns` à
**tout** hôte distant dans `next.config.ts` et fait transiter l'image par notre serveur — deux
choses qu'une photo de persona ne justifie pas. La balise nue porte `alt=""` (l'image est
décorative, le nom est écrit à côté — la règle d'`Avatar`), `loading="lazy"` et
`referrerPolicy="no-referrer"`, pour que l'hôte distant n'apprenne pas depuis quelle page de Vision
il est appelé. **Ce que le lot ne fait pas** : vérifier que l'adresse mène à une image. Elle est
validée comme lien web, comme celle d'une ressource, et rien de plus — une adresse morte affiche une
image cassée, ce qu'aucun écran ne rattrape aujourd'hui.

**La directive `eslint-disable-next-line` a d'abord porté sur un commentaire.** Écrite sur deux
lignes — la directive puis son explication —, elle désignait la **seconde ligne de commentaire**, pas
la balise. ESLint l'a dit exactement : « Unused eslint-disable directive » **et** l'avertissement
qu'elle prétendait taire, côte à côte. Les deux avertissements ensemble sont le symptôme ; un seul
aurait pu passer pour normal. L'explication est passée avant, la directive collée à la balise.

**La création n'est pas atomique, et rejoint la dette de la création d'un projet.** `neon-http` n'a
pas de transaction interactive : un persona écrit dont les traits échoueraient resterait sans
traits. Le cas est bénin ici — c'est exactement l'état d'un persona créé sans qu'on saisisse de
trait, donc un état que l'écran sait rendre et que la correction répare —, mais il est de la même
famille, et il s'ajoutera à ce que refermera le jour où la couche exposera une transaction.

**Aucun persona n'est semé.** Le brief n'en fournit aucun, et la règle de tête de `scripts/seed.ts`
interdit d'en inventer — l'écart de T5bis.1 est encore frais. Le bloc s'ouvre donc sur son état vide,
qui est un écran à part entière (règle 5) et qui porte le geste. **Deux personae ont en revanche été
écrits à la main dans la base de développement** pour lire les cartes et la fiche dans le HTML servi.
Ils y restent : la base de développement est jetable, et `db:seed` ne les connaîtra pas.

**La mise en défaut a été prise quatre fois, et chaque fois elle a désigné exactement sa règle.**
Le filtre de domaine de `lib/db/scoped.ts` neutralisé fait tomber **cinq** tests de
`lib/queries/personas.test.ts` et eux seuls — les deux lignes forgées, plus trois lectures qui se
mettent alors à voir le domaine voisin. La règle d'URL retirée fait tomber **deux** tests de forme.
Le rapprochement `persona.productId !== productId` retiré d'`openPersona` fait tomber **les deux**
tests de soumission forgée, et rien d'autre. Le droit dérivé neutralisé dans `openProductWrite` fait
tomber **quatre** tests — un par action de persona, plus celui de `setNorthStar`, ce qui confirme au
passage que les cinq actions plus anciennes passent bien par cette porte.

**Aucun couple de couleurs neuf, et c'est le résultat d'une mesure, pas d'une intention.** Les
quatorze couples du bloc, de la fiche et du panneau ont été calculés : le plus bas des couples de
**texte** est à 4,98:1, et tous les autres montent à 6,84, 8,12, 15,72 ou 17,87:1. Deux couples non
textuels restent sous 3:1 — le filet de carte à 1,17:1 et le fond de la puce « Principal » à 1,04:1
—, mais **ni l'un ni l'autre n'est neuf** : ce sont exactement les couples et les positions de
`Section`, d'`EmptyState` et de `Tag`, dont l'en-tête porte déjà l'arbitrage. Ce qui a été vérifié
avant de s'y résoudre : **aucun jeton ne fait mieux**. `surface-neutral-lightest` comme fond de carte
donne 1,05:1 contre le bloc, et le plus franc des `surface-neutral-*` plafonne à 2,22:1. La dette est
récrite dans `ETAT.md`, elle n'a pas reçu d'addendum.

**`ETAT.md` passe de 288 à 303 lignes.** Le seuil de 250 était déjà franchi ce matin ; les quinze
lignes ajoutées sont celles qu'exigent les étapes 5 et 6 — une ligne de journal, et une dette récrite
plutôt qu'augmentée. Un travail hors ticket ne balaie pas plus qu'un ticket : `CLAUDE.md` réserve ce
geste à la session de découpage, qui devra le faire avant d'ouvrir C6.

---

## Hors ticket — les indicateurs associés repliés, 18/08/2026

**La demande.** Replier par défaut le rang « Indicateurs associés » du bloc « Vision produit », pour
gagner la place de ses cartes et laisser à l'utilisateur la liberté de les déplier.

**Un `<details>` natif, comme le groupe « Annulé » de la roadmap projet.** Aucun état à tenir, aucun
JavaScript, aucun composant client de plus : le repli est celui du navigateur, et il survit à un
rendu serveur. Le `<details>` n'a pas d'attribut `open` — c'est cette absence, lue dans le HTML
servi, qui est le critère.

**`BlockDivider` sait désormais être un `<summary>`, et c'est pour cela que l'intertitre n'a pas
bougé.** L'autre voie — inliner le balisage du séparateur dans le `<summary>` — aurait dupliqué un
langage que `components/ui/block.tsx` déclare tenir « une fois pour toutes », et le jour où le filet
change, un des deux rangs ne suivrait pas. Un `<div>` autour du contenu n'était pas une option :
`<summary>` n'accepte que du contenu de phrasé, plus un titre en premier enfant — la remarque était
déjà écrite dans `roadmap.tsx`. La balise change, le `h3` et le décompte ne changent pas ; le
décompte compte d'ailleurs pour le repli plus que pour l'ouverture, puisqu'il est ce qui reste à
l'écran quand les cartes n'y sont plus.

**Le piège, et il contredit un commentaire du dépôt : `display: flex` retire à `<summary>` le
triangle natif.** Le marqueur d'un `<summary>` n'existe que tant qu'il est `display: list-item` ;
la classe `flex` — nécessaire ici pour que le filet coure jusqu'au bord — le fait disparaître.
`roadmap.tsx` affirme en toutes lettres, sur son groupe « Annulé », que « le triangle natif du
navigateur est conservé » : il ne l'est pas, et ce repli-là n'a donc aujourd'hui aucune marque
visible. **Le cas n'est pas corrigé ici** — règle 3, c'est un autre bloc et une autre page ; il est
posé en point ouvert dans `ETAT.md`. Sur le rang des indicateurs, la marque est rétablie en `mark`,
là où le ★ de la North Star se pose déjà : un `▶` `aria-hidden` qui tourne d'un quart de tour sur
`group-open`. Aucun jeton n'est enfreint — `text-2xs` est une taille du thème (`--font-size-2xs`),
`rotate-90` et `transition-transform` ne sont ni une couleur, ni une taille, ni un espacement, ni un
rayon. L'état, lui, n'est jamais porté par la marque : `<summary>` l'expose nativement à
l'assistance, et la couleur ne porte jamais seule (`docs/06` §11).

**Ce que la mesure a confirmé dans le CSS servi**, parce qu'un variant Tailwind se vérifie plutôt
qu'il ne se suppose : `group-open:rotate-90` est bien compilé, en
`.group-open\:rotate-90:is(:where(.group):is([open], :popover-open, :open) *)` — le `group` est
posé sur le `<details>`, l'ouverture le traverse. Les deux garde-fous du marqueur (`list-none` et
`[&::-webkit-details-marker]:hidden`) sont compilés eux aussi.

**« Ajouter un indicateur » se replie avec les cartes**, et c'est un arbitrage. Le sortir de la
grille pour le garder visible aurait déplacé un point d'entrée que la maquette pose là, et fait du
rang replié une barre à demi ouverte. Rien n'est perdu : le lien reste dans le rendu — le repli est
visuel, pas conditionnel —, et aucun droit ne change, puisque les actions redérivent le leur sur
l'identifiant reçu.

**Ce que le travail ne fait pas.** Il ne mémorise pas l'état d'ouverture d'une visite à l'autre : il
faudrait une clé d'URL ou un stockage client, et la demande dit « par défaut replié », pas
« se souvenir ». Il ne touche ni au rang « North Star », ni au bloc « Personae », ni au `<details>`
de la roadmap projet.

**Aucun couple de couleurs neuf.** Le chevron prend la couleur du `h3` qu'il précède
(`content-neutral-dark` sur `surface-primary-lighter`), à la position exacte du ★ du rang
au-dessus : rien à mesurer que l'en-tête du 18/08 n'ait déjà mesuré.

**Les 732 tests passent, et aucun ne parlait de ce rang** — il n'a pas de logique, seulement une
balise. La mise en défaut porte donc sur le HTML servi : sans l'attribut `open`, les trois pages
produit de la base de développement rendent leurs cartes et leur lien d'ajout **dans le document**,
repliés. `ETAT.md` passe de 303 à 309 lignes ; le seuil de 250 reste franchi, et attend la session
de découpage de C6.

## TD.2 — les panneaux s'ouvrent côté client, 18/08/2026

**Ce que le ticket retourne, et ce qu'il ne rouvre pas.** L'ouverture d'un panneau était un
paramètre de recherche : chaque clic naviguait, la page se re-rendait entière, l'URL changeait. Le
geste se lisait comme un changement de page alors qu'un panneau est un élément contextuel. **D30
n'est pas rouvert** — il pose « panneau latéral plutôt que page dédiée, *pour la fluidité et la
conservation du contexte* » (`docs/06` §295), ce que ce ticket sert plutôt qu'il ne contredit. Ce qui
se retourne est l'invariant d'implémentation de T3.2, « le panneau n'est pas un état, c'est une
URL », qui n'a jamais été une décision de `docs/07` — le journal l'appelait « D30, tenu depuis
T3.2 », relecture *a posteriori* que ce ticket corrige. La cinquième discipline, elle, avait déjà
été retirée le 14/08/2026.

**Quatre arbitrages humains, demandés avant d'écrire une ligne.** (1) Les URL d'ouverture restent des
adresses valides. (2) Le contenu arrive en nœud serveur à la demande. (3) Aucune entrée d'historique
— le Retour ne referme plus. (4) Glissement à l'ouverture, avec les jetons qu'il faudra poser.

### L'inconnue technique, éprouvée avant d'être supposée

Tout le plan reposait sur une propriété non documentée : **une fonction `"use server"` peut-elle
renvoyer un `ReactNode` ?** Une sonde jetable a été écrite d'abord, et le repli était cadré (renvoyer
des données sérialisables, lier les actions côté client, faire passer les deux panneaux serveur en
client). Elle a rendu, dans le DOM :

```html
<div data-probe="1">
  <p data-probe-server="1">SONDE-SERVEUR alpha domaine=57c6dbed</p>
  <form action="javascript:throw new Error('A React form was unexpectedly submitted…')">
```

Trois propriétés d'un coup : le nœud traverse, un composant **serveur** imbriqué y rend sur le
serveur — il a lu la vraie session —, et une action liée côté serveur y reste soumissible, React
l'ayant interceptée. Le repli n'a pas servi.

**Deux faux départs, tous deux du harnais et non du mécanisme.** (a) Dans un module `"use server"`,
seules les **exportations** deviennent des actions : une fonction interne liée par `bind` doit porter
son propre `"use server"`, faute de quoi Next lève « Functions cannot be passed directly to Client
Components ». (b) `chrome --headless --dump-dom` ferme l'onglet au `load` et **coupe le flux RSC**
de l'appel en cours — « The destination stream closed early ». Le constat était donc muet pour une
raison sans rapport avec ce qu'on mesurait. Un harnais CDP qui garde la page vivante a levé les deux
doutes ; il a servi ensuite à toute la vérification.

### Le partage coquille / corps, qui n'était pas dans le plan initial

Deux panneaux — `readings-panel.tsx` et `persona-detail.tsx` — sont des composants **serveur**. Un
composant serveur ne peut pas recevoir de fonction : leur donner un `onClose` était impossible. D'où
le partage retenu : le voile, le tiroir, l'en-tête, la croix et le piège de focus remontent dans
`DrawerHost`, qui est client ; le corps seul revient du serveur. La conséquence heureuse est que
**la coquille s'ouvre avant tout aller-retour**, ce qui est exactement la fluidité demandée.

`DrawerContent` a donc gagné un `header` facultatif, employé par un seul panneau : la fiche d'un
persona porte son portrait et son étiquette « Principal » à côté du nom. Sans lui, il aurait fallu
descendre l'avatar dans le corps — la fiche n'aurait plus ressemblé à la carte qu'elle détaille.

### Trois pièges que seule l'épreuve au navigateur a montrés

**`autoFocus` n'est honoré qu'à l'analyse du HTML.** Il tenait depuis T3.2 parce que le panneau
arrivait dans le document servi. Un élément inséré par un script ne le reçoit pas : à l'ouverture au
clic, le focus restait sur `<body>` — la coquille s'ouvrait **hors du clavier**. Mesuré à 50, 150,
400, 1200 et 2500 ms, toujours `BODY`. Un effet pose désormais le focus sur la croix ; l'attribut
reste, parce que c'est lui qui fait le travail quand l'URL ouvre, et le seul sans JavaScript.

**Le focus ne revient pas dans un sous-arbre inerte.** Rendre le focus au déclencheur au moment où la
fermeture est décidée ne fait rien : le contenu de page porte encore `inert`. Il faut attendre
l'effet qui suit la levée. Même symptôme que le précédent — `BODY` —, cause opposée.

**Une référence sur un composant, une référence sur un élément.** Le premier correctif posait une
`ref` sur `DrawerClose` ; le focus restait sur `BODY`. La référence vit maintenant sur le
`<div role="dialog">`, un élément du DOM, et la croix s'y cherche par son `aria-label` : rien ne
dépend plus de la façon dont une référence traverse une frontière de composant.

### Une adresse qui mentait

Un panneau ouvert par son URL puis refermé laissait `?vision=modifier` dans la barre : une adresse
qui dit ouvert ce qui est fermé, et qui rouvre au rechargement. La fermeture retire donc les clés
d'ouverture par `replaceState` — **aucune entrée d'historique n'est empilée**, et l'adresse n'est pas
*modifiée* mais remise d'accord avec l'état.

**Retirées une à une, et non remplacées par `closeHref`.** `?de=` et `?a=` ne sont pas des clés
d'ouverture — ce sont les bornes de la fenêtre de roadmap —, et les balayer aurait défait un filtre
en fermant un panneau. Éprouvé : fermer `?de=2026-01&a=2026-12&fiche=<id>` laisse
`?de=2026-01&a=2026-12`. C'est la distinction que le décompte d'exclusivité tient depuis le
17/08/2026, ici transportée telle quelle.

### `redirect` cesse d'être la fermeture

Dix-huit actions de panneau se terminaient par `redirect` vers la page hôte : la navigation *était*
la fermeture. Elle ne peut plus l'être sans re-rendre la page que le ticket cherche à ne plus
re-rendre. Elles rendent désormais `ok: true` ; `revalidatePath` reste, et la réponse de l'action
porte l'arbre réactualisé — **éprouvé** : après enregistrement, le panneau se referme, la vision
écrite paraît dans le bloc derrière, et le journal de navigation du navigateur est vide.

Les deux `redirect` restants sont ceux de `goToProduct` et `goToProject`, qui servent les formulaires
de **page pleine** (`nouveau`, `modifier`) : ceux-là naviguent pour de bon, et rien n'a changé.

**Le constat d'écriture change de nature dans les tests.** `actions.test.ts` tenait qu'« une levée de
`redirect` est le constat qu'une écriture a eu lieu, et son absence celui d'un refus ». Le signe est
maintenant `ok` — même fonction, autre forme, et deux helpers (`expectWritten`, `written`) l'exigent
plutôt que de laisser un test conclure sur une base qu'un autre aurait remplie. Le mock de
`next/navigation` reste en place pour les formulaires de page pleine. **732 tests passent.**

### Ce que la vérification a établi

**Le critère se lit dans le HTML servi.** Les treize panneaux s'ouvrent encore par leur URL —
`role="dialog"` présent une fois, `inert` posé, titre attendu — et la page nue n'en porte aucune
trace. Les points d'entrée restent servis en `<a href>`, si bien que `⌘`+clic, clic milieu et
l'absence de JavaScript retombent sur la navigation d'avant.

**Les tests se sont mis en défaut.** Confrontation `productId === product.id` neutralisée dans
`resolveProductDrawer` : un indicateur d'un **autre** produit s'ouvre alors sur cette page, par les
deux chemins. Rétablie : page nue. Rien d'autre n'a bougé.

**Le contraste n'avait rien de neuf à mesurer, et il fallait le montrer.** Diff des classes de la
coquille avant/après : le voile et le filet gauche gardent leurs jetons au caractère près
(`surface-neutral-opacity-distinct`, `border-content-neutral-dark`), seules des utilitaires de
transition s'ajoutent. Le seul texte neuf est « Chargement… », en `content-neutral-base` sur
`surface-neutral-pale` — le couple des sous-titres, dans le même en-tête, mesuré à 4,98:1.

**Le droit s'est éprouvé par l'action.** La fonction serveur est un **point d'entrée HTTP neuf** : sa
requête a été capturée au navigateur (`next-action`, corps `["<productId>",{"kind":"indicator"}]`)
puis rejouée en `curl` sous quatre identités et quatre charges forgées. Refusés : le membre non
contributeur du produit, le contributeur d'un **autre** produit, le produit inexistant, un
`productId` qui n'est pas un UUID, un `kind` appartenant à l'**autre** page, un `kind` inventé.
Rendus : le responsable de domaine, et le contributeur désigné d'un accompagnement **de ce
produit-là**.

**Piège de lecture, à ne pas répéter :** `project_members` ne dit pas le droit. C'est
`is_contributor` qui le dit (`lib/auth/session.ts` l. 190) — une personne peut être membre d'un
accompagnement du produit et n'y rien écrire. Une première lecture, faite sans cette colonne, a fait
passer un refus correct pour un défaut ; la requête refaite avec elle a montré que les trois cas
tombaient juste.

**Le mouvement se coupe pour qui le demande.** Sous `prefers-reduced-motion: reduce`,
`--duration-drawer` vaut `0s` et le tiroir est posé d'emblée (`translate: 0px` à 35 ms) ; sans
préférence, `.22s` et le tiroir est à 5,9 % de sa course à 120 ms. Un seul jeton porte le mouvement,
donc un seul endroit à couper.

**Et la fluidité, mesurée.** À l'ouverture : une seule requête réseau, `POST /produits/<id>` — la
fonction serveur —, **aucune navigation RSC de page** ; l'URL ne bouge pas ; le défilement est
conservé (304 px avant, 304 px après) ; le dialogue est dans le DOM à 120 ms, avant que son corps
n'arrive.

### Dettes et écarts assumés

- **Le Retour navigateur ne referme plus le panneau, il quitte la page** (arbitrage 3). C'est une
  régression par rapport au comportement d'avant, où la fermeture était une navigation. Une entrée
  d'historique sur la même adresse la refermerait sans toucher à l'URL affichée. → **si l'usage le
  réclame.**
- **Deux jetons de mouvement sont posés dans `app/tokens.css`**, septième manque du design system
  (`ETAT.md`). Ils y sont à la place des autres et jamais dans un composant : la règle 2 est tenue,
  et le manque est nommé plutôt que masqué. → **à faire remonter avec les six précédents.**
- **L'attente ne porte pas de titre.** La coquille s'ouvre avec `aria-label="Panneau en cours
  d'ouverture"` et « Chargement… », puis reçoit son `<h2>`. Faire porter le titre par le point
  d'entrée l'aurait affiché plus tôt, au prix de le dupliquer entre le client et le serveur — deux
  libellés à tenir d'accord pour gagner un aller-retour local. → **sans échéance.**
- **La coquille applicative n'est toujours pas `inert`.** TD.2 rend le correctif possible pour la
  première fois (voir le point ouvert récrit dans `ETAT.md`) mais ne le fait pas : la règle 3
  l'interdit, le ticket ne visant pas `app/(app)/layout.tsx`.

### Leçon de méthode, sur mes propres modifications

**Deux `replace` Python ont échoué en silence** — le motif visé avait été reformaté par Prettier
entre-temps — et les deux effets de focus n'ont jamais été insérés. Le symptôme observé au navigateur
était identique à celui d'un correctif qui ne marche pas, et j'ai d'abord cherché la cause dans
React. Un `grep` sur le fichier a montré qu'il n'y avait rien à chercher. **Règle : toute
substitution automatique s'assortit d'un `assert`**, et un correctif se relit dans le fichier avant
d'être éprouvé au navigateur.

`ETAT.md` passe de 314 à 331 lignes. Le seuil de 250 reste franchi et attend la session de découpage
de C6 — c'est le seul moment où le fichier se balaie.

---

## Hors ticket — la doctrine de composition, 18/08/2026

**Ce n'est pas un ticket, c'est un audit et un arbitrage.** La question posée était double : le
produit s'éloigne-t-il d'une logique de composants, et faudrait-il descendre le style dans le CSS
plutôt que de l'empiler en classes sur les éléments ? Aucun fichier de code n'a été modifié. Ce qui
suit est le constat mesuré, puis la doctrine qui en sort, puis ce qu'elle refuse.

### Le constat, mesuré et non affirmé

**La prémisse « trop de classes » ne se confirme pas.** 427 attributs `className` littéraux dans
`app/` et `components/` : **moyenne 3,9 classes, médiane 4, p90 8, maximum 14**. C'est bas pour du
Tailwind, et c'est le signe que `components/ui/` fait son travail. Les deux attributs les plus
chargés sont `action-menu.tsx:142` et `projects/roadmap.tsx:556`, à quatorze chacun.

**Les fondations tiennent, et se vérifient.**

- `app/globals.css` efface les namespaces Tailwind (`--color-*: initial`, `--text-*`, `--radius-*`,
  `--shadow-*`) avant de les reconstruire à partir des seuls jetons. `bg-blue-500` **ne compile
  pas** : la règle 2 est structurelle et non déclarative. Recherche des violations de couleur sur
  vingt-deux teintes et onze niveaux : **aucune**. Aucun `#hex` hors de `tokens.css` — les quatre
  occurrences trouvées sont dans des commentaires.
- La couche est **acyclique et étanche**, vérifié : `components/ui/` n'importe aucun composant
  métier, aucune requête, aucune action. L'unique exception est un `import type` d'énuméré
  (`ui/status-dot.tsx:13`), sans couplage à l'exécution, et c'est lui qui rend
  `STATUS_PILL: Record<ProjectStatusNature, string>` exhaustif à la compilation. Zéro import croisé
  entre `components/products/` et `components/projects/`.
- Zéro dépendance d'interface : ni Radix, ni `cva`, ni `clsx`, ni `tailwind-merge`, ni `vaul`. Le
  tiroir, le piège de focus, le menu et les icônes sont écrits à la main.

**Ces trois faits sont liés, et c'est ce qui compte.** La composition manuelle par gabarit de chaîne
est viable **parce que** `--color-*: initial` ferme l'espace de classes : les collisions que
`tailwind-merge` sert à arbitrer deviennent rares quand la palette fait cent dix couleurs au lieu de
deux mille. Retirer l'un rendrait l'autre douteux.

### La doctrine — trois niveaux, et le critère entre les deux premiers

| Niveau | Quand | Exemples en place |
|---|---|---|
| **Composant** | l'élément rendu est fixe | `FormField`, `Block`, `StatusDot`, `Panel` |
| **Constante de classes exportée** | c'est **la balise** qui varie | `ACTION_LINK`, `CONTROL`, `MENU_ITEM` |
| **Rien** | usage unique, aucun choix mesuré | mise en page locale |

Le niveau 2 n'est pas un pis-aller, et `components/ui/action-link.ts` le dit déjà mieux que cette
note : « une constante et non un composant : elle s'applique à un `<Link>`, à un
`<button type="submit">` et à un `<summary>` — un composant imposerait l'un des trois ». Le bouton
secondaire est dans ce cas exact : `produits/[id]/page.tsx:320-332` le porte sur un `<Link>` et un
`<DrawerLink>` **dans le même `<span>`**, à côté d'un `<button type="submit">`. Il lui faut les deux
niveaux, pas un.

### Ce que la doctrine refuse, et pourquoi

**`@apply` et `@layer components` : écartés.** Une classe CSS de composant poserait une troisième
couche de noms (`.btn-primary`) par-dessus les jetons, **sous** TypeScript : sans props typées, sans
variante vérifiée à la compilation, et surtout sans l'endroit où s'écrit la justification mesurée.
Or c'est cette justification qui est l'actif rare de ce dépôt — « `content-neutral-normal` à 3,88:1,
substitut au jeton de bordure de contrôle qui manque au design system » se lit dans
`form-field.tsx:24-37` et ne se loge pas dans une règle CSS. Le bénéfice habituellement invoqué pour
`@apply` — pouvoir rethémer sans recompiler — est déjà obtenu, et mieux, par `@theme inline`.

**La taxonomie de l'atomic design : écartée.** Il faut distinguer ses deux moitiés. Le **modèle
mental** — il existe des niveaux de composition — est vrai et Vision l'applique déjà intégralement,
avec une couche que Brad Frost n'a pas : les jetons, qui viennent d'ailleurs et lui sont
orthogonaux. La **taxonomie de dossiers** (`atoms/ molecules/ organisms/`) est l'autre moitié, et
elle coûte sans rendre :

- elle remplacerait une frontière **vérifiable par `grep`** — « ce fichier importe-t-il une requête
  ou une action ? » — par une frontière **discutable** : `FormField` est-il un atome ou une
  molécule ? `Field` ? `StatusDot` ? Ces questions n'ont pas de réponse et se rejouent à chaque
  ajout ;
- `organisms/` est un seau plat, là où `products/` et `projects/` disent **où le composant sert**.
  Le découpage actuel calque le vocabulaire imposé par `CLAUDE.md` — Domaine › Produit › Projet — et
  la taxonomie le contredirait ;
- elle renommerait une trentaine de fichiers, donc tous les chemins cités dans les en-têtes, **là où
  vit le raisonnement**.

**Décision : `ui/ · products/ · projects/ · shell/ · team/` ne bouge pas.**

### Ce que l'atomic design a raison d'imposer, et qui manque

Sa pratique réelle est que **l'inventaire se décide avant, pas à la huitième copie**. Cet inventaire
existe déjà : `docs/design/design-system.md` §10 nomme une quarantaine de composants.
`components/ui/` en porte dix-sept, et **pas de bouton** — l'élément le plus réutilisé de toute
interface.

La dette est donc une dette de **couverture**, pas de technique, et son rythme se lit dans ce
journal :

| Élément | Copies atteintes avant extraction |
|---|---|
| `FormField` | **8** (extrait en TD.1) |
| `Panel` | **6** (extrait en TD.1) |
| `ACTION_LINK` | **4** (extrait en TD.1) — puis **redivergé** depuis |
| Bouton primaire | **11**, jamais extrait, **déjà dérivé** |
| Lien-action `sm` | **9**, jamais extrait |
| État vide dans un bloc | **~15, en 5 variantes** |

Le processus extrait à quatre ou huit copies, **après** la divergence. Il fonctionne — TD.1 a retiré
644 lignes nettes à HTML constant — mais il paie le nettoyage deux fois. T4.2 avait déjà nommé la
loi et elle se vérifie : « le vrai coût n'est pas la duplication du balisage mais celle des **choix
mesurés** qu'il porte ».

**La preuve la plus nette est fraîche.** `components/products/readings-panel.tsx:42` redéfinit un
`ACTION_LINK` local qui **diverge** de celui du socle (`underline-offset-2` en trop), alors que le
fichier importe déjà depuis `components/ui/`. C'est le défaut que l'en-tête d'`action-link.ts`
prétend avoir refermé, revenu par une autre porte, **six jours après**. Un socle qu'on ne voit pas ne
protège personne — d'où l'idée d'une page de catalogue, non retenue faute de ticket, notée ci-dessous.

### Trois défauts trouvés en chemin, tous consignés

- **`components/ui/section.tsx:26` déclare une prop `note` et ne la rend jamais.**
  `components/projects/roadmap.tsx:171` lui passe « Le récit de l'accompagnement, au mois. » — cette
  phrase **n'est dans aucun HTML servi**. TypeScript ne dit rien : la prop est déclarée, seulement
  jamais lue. **Mais ESLint, lui, le dit** — `'note' is defined but never used`, et c'est
  l'**unique** avertissement de `npm run lint` sur tout le dépôt. Il est donc là depuis T2.3, lu par
  personne. C'est exactement ce que l'en-tête d'`underscoreIsIntentional` dans `eslint.config.mjs`
  annonçait en creux : « un avertissement permanent est un avertissement qu'on cesse de lire, donc un
  avertissement neuf qu'on ne verra pas ». La règle a été écrite pour supprimer quatre faux positifs ;
  le seul vrai positif qui restait a survécu à côté d'eux. **Règle : `npm run lint` doit finir à zéro
  avertissement, sinon le suivant est invisible.** → **TD.4 (c), à trancher avant écriture.**
- **`--spacing` est le seul trou de la règle 2.** `--spacing: var(--number-4)` est un **pas**, pas
  une échelle : Tailwind en dérive n'importe quel multiplicateur. **Une soixantaine de valeurs hors
  échelle** se sont accumulées — `gap-2.5` (10px, ×12), `px-2.25` (9px), `mt-3.5` (14px), `top-7.5`
  (30px), `w-2.75` (11px), `w-5.5` (22px) : aucune n'existe au §4 du design system. Seuls `0.5` et
  `1.5` sont conformes, retombant sur `--number-2` et `--number-6`. → **TD.5.**
- **Deux dimensions en dur et une épaisseur brute** : `indicators.tsx:494`
  (`minmax(300px,1fr)`), `indicators.tsx:586` (`grid-cols-[20rem_1fr]`), et
  `projects/roadmap.tsx:556` (`border-l-3` là où `globals.css:201` prescrit
  `border-l-[length:var(--border-width-2)]`). → **TD.5.**

### La contrainte qui pèse sur tout ce qui suivra

**Il n'existe aucun test de présentation**, et c'est délibéré : `vitest.config.mts` restreint à
`lib/**` et `app/**/*.test.ts`, en `environment: "node"`, avec « aucun composant n'entre ». Ni
jsdom, ni snapshot, ni e2e. La doctrine est cohérente — le droit s'éprouve par l'action, jamais par
l'écran — mais elle a une conséquence directe : **toute refonte de présentation se fait sans filet
automatisé.** C'est ce qui impose le critère de TD.1 à tous les tickets TD (diff HTML capturé
avant/après, base immobile entre les deux mesures), et c'est ce qui commande de séparer les
extractions **mécaniques** des fusions **éditoriales**. Les secondes — `Section` contre `Block`, la
note perdue — demandent un arbitrage humain et ne se décident pas en cours de ticket.

### Un échec de test intermittent, observé une fois et non reproduit

**Le premier `npm test` de la session a rendu « 1 failed | 22 passed », soit un test sur 732.** Deux
relances consécutives ont rendu **732/732**, et le nom du test en échec n'a pas pu être capturé — la
sortie n'était plus disponible au moment de la recherche. Aucun fichier de code n'avait été modifié :
ce n'est donc pas une régression, et la cause la plus probable est le réseau, les tests de
`lib/queries/**` frappant une vraie base Neon par HTTP.

Le fait est consigné parce qu'il compte : **une suite qui échoue une fois sur trois lancements sans
raison visible est une suite qu'on cesse de croire**, et c'est le seul filet automatisé du projet.
→ **si le symptôme revient, instrumenter avant de conclure** — `vitest --reporter=verbose` conservé
dans un fichier, plutôt qu'une relance qui efface la preuve.

### Le garde-fou est devenu TD.6, et son mécanisme a été éprouvé avant d'être prescrit

Les deux pistes notées d'abord sans ticket ont été départagées : **la règle ESLint devient TD.6**, la
page de catalogue reste ouverte.

**Le mécanisme a été mis à l'épreuve le 18/08/2026 par une sonde jetable**, parce qu'une fiche qui
prescrit une règle sans l'avoir vue se déclencher l'affirme au lieu de la lire. `no-restricted-syntax`
accepte un sélecteur esquery portant une expression régulière sur la valeur du nœud, et il faut
**deux** sélecteurs — `Literal` pour `className="…"`, `TemplateElement` pour `className={\`…\`}` —,
mesuré : le second seul a rattrapé le cas en gabarit de chaîne.

Sur la seule signature du bouton primaire, motif `bg-surface-primary-base[^"]*px-4[^"]*py-2` :

- **12 déclenchements** — les 11 copies exactes **plus** `app/dev/session/page.tsx:112`. C'est le
  motif **lâche** qui rattrape la dérivée, qu'une regex calquée sur la chaîne exacte aurait manquée.
  **Règle : le motif porte sur ce qui fait la signature, jamais sur la chaîne entière.**
- **Témoin négatif concluant** : `bg-surface-neutral-pale px-4 py-2` et
  `bg-surface-primary-base px-3 py-1` n'ont pas déclenché.

Un piège mesuré au passage, à savoir pour qui relira la sonde : **une config ESLint minimale
rapporte des faux positifs** — trois « Definition for rule was not found » sur des `eslint-disable`
inline pointant des règles qu'elle ne définit pas. Le décompte brut annonçait 14 ; le vrai est 12.

**Ce que TD.6 ne fera pas, et qui doit rester dit :** la règle garde **les signatures qu'elle
connaît**. C'est un cliquet sur la duplication constatée, pas une preuve de cohérence.

- **La page de catalogue `/dev/design`** — sur le modèle de `/dev/session` : 404 en production,
  reliée à aucune navigation, rendant tous les exports de `components/ui/`. C'est ce qui montrerait
  l'inventaire d'un coup d'œil, là où la règle ne fait que refuser. Écartée de TD.6 : **ouvrir une
  route est une décision d'architecture, pas une factorisation**, et elle ne se prend pas au détour
  d'un garde-fou. → **si l'inventaire continue de diverger, ou sur demande.**

### Un fichier modifié hors de cette session, à 23:20

**`tickets-C5bis.md` a changé pendant la session, après toutes les écritures faites ici.** Il n'était
pas modifié au début — `git status` ne le listait pas, et son horodatage était du 17/08 11:37. Il
porte désormais un amendement daté du 18/08/2026, cohérent, complet et sans marqueur de conflit, qui
met les arbitrages (a) de C5bis à jour de la mécanique de tiroir de TD.2 et leur ajoute une section
« La mécanique des panneaux depuis TD.2 ». **Aucune commande de cette session ne l'a touché**, et son
horodatage — 23:20 — est postérieur à la dernière écriture faite ici (23:11).

Le fichier a été **laissé intact**. → **à savoir : une seconde session travaille peut-être sur ce
dépôt ; vérifier avant de committer que le contenu de `tickets-C5bis.md` est bien voulu.**

`ETAT.md` passe de 331 à 366 lignes, soit **116 au-dessus du seuil de 250**. Le balayage reste
réservé à la session de découpage de C6 — c'est le seul moment où le fichier se balaie, et cette note
n'y déroge pas —, mais il faut le dire franchement : **l'écart se creuse plus vite qu'il ne se
résorbe**, et trois travaux hors ticket en trois jours y ont chacun ajouté leur ligne. Le repliage de
C5bis devra sortir vers `HISTORIQUE-TICKETS.md` bien plus que ses propres lignes.

---

## T5bis.3 — les filtres de la liste Équipe, 18/08/2026

### Quatre arbitrages rendus avant écriture

`AskUserQuestion` n'était pas disponible dans la session de plan ; les quatre choix ont donc été
posés en prose, avec leur valeur par défaut, et tranchés par l'humain avant la première écriture.

**(1) Le patron de `ProjectFilters` est repris entier**, et pas seulement son formulaire : la ligne
de synthèse `aria-live`, le lien « Retirer tous les filtres » et **un état vide distinct** quand des
filtres sont posés. Sans le troisième, une recherche infructueuse afficherait « Aucune personne pour
l'instant » — un texte qui ment sur la cause. **Écart de périmètre assumé :** `formatPersons`
s'ajoute à `lib/format.ts`, cinquième d'une famille qui en comptait quatre.

**(2) Métier et compétence ne proposent que ce qu'une personne vivante porte** — la règle déjà posée
par `listProjectFilterOptions` : proposer un filtre qui ne ramène rien serait offrir un chemin vers
le vide. **L'échelle, elle, est proposée entière**, et la raison est sa sémantique : « au moins ce
niveau » est un **seuil**, pas une valeur. Un échelon que personne n'occupe exactement reste un
seuil qui a du sens, et une échelle tronquée se lirait comme un référentiel amputé.

**(3) `likePattern` est recopié dans `team.ts`, les libellés de disponibilité ne le sont pas.** Les
deux cas se ressemblent et se tranchent à l'inverse, et c'est délibéré : importer `likePattern` de
`lib/queries/projects.ts` coupleraient deux modules de lecture sans rapport, et lui choisir un
module neutre est une décision qui appartient à TD, pas à un ticket de filtre (règle 3). Les trois
libellés, eux, sont **les mêmes mots à l'écran** : les recopier, c'est se garantir qu'un jour la
pastille et le filtre en diront deux versions. `AVAILABILITY_LABEL` est donc exporté
d'`availability-dot.tsx` — un mot ajouté, aucun comportement changé, **écart de périmètre assumé**.
→ **l'extraction de `likePattern` vers un module neutre est proposée à TD** ; deux copies d'une
fonction pure de trois lignes, dont l'échappement est le seul choix mesuré qu'elle porte.

**(4) La clé de recherche est `q`**, que la fiche de T5bis.3 écrit deux fois — contre le `recherche`
de la liste des projets et contre les segments de route, tous en français. Les quatre autres clés
sont françaises. **La fiche prime, et l'incohérence est réelle.** → **à uniformiser le jour où l'un
des deux écrans se rouvre ; sans échéance.**

### Ce que la vérification a appris

**Un `filter()` neuf qu'aucune ligne forgée ne vise n'est pas éprouvé.** Les cinq filtres
d'étanchéité de T5bis.2 couvraient les deux lectures d'alors ; ce ticket en ajoute **huit** — deux
dans le `exists` conjonctif, six dans `listTeamFilterOptions` — et les lignes forgées existantes
n'en couvraient que la moitié. Deux forgeages de plus ont été ajoutés, chacun ne franchissant la
frontière que sur **une** colonne :

- une liaison **de `a` en tout point sauf la personne**, qui est de `b` : seul `filter(persons)` de
  la requête d'options de compétence l'écarte — la liste, elle, ne peut pas s'en apercevoir, sa
  seconde lecture étant bornée aux personnes qu'elle vient de lire ;
- une **personne de `b` portant un métier de `a`** que personne d'autre ne porte : l'exact miroir de
  la Chloé forgée de T5bis.2, et seul `filter(persons)` de la requête d'options de métier l'écarte.

**Onze neutralisations ont été jouées**, chacune suivie d'un `vitest run` dont les tests tombés ont
été relevés et comparés à la liste attendue. **Onze fois sur onze, le compte est exact** : la règle
de conjonction (`or` à la place des `exists` conjoints) fait tomber un test et un seul ; le retrait
du `gte` en fait tomber deux, ceux qui isolent le seuil ; et chacun des neuf `filter()` fait tomber
son propre cas d'étanchéité, jamais celui d'un autre.

**La requête d'options de compétence joint `skill_levels` sans le lire.** C'est une jointure qui ne
sert qu'à filtrer : sans elle, une liaison dont le niveau vient d'un autre domaine — que la liste
n'honore pas — ferait paraître sa compétence dans les options, et le filtre proposé ne ramènerait
personne. Les deux requêtes disent alors la même chose de la même ligne.

**Le droit s'éprouve par l'action — et ici l'action n'existe pas, ce qui se mesure aussi.** Le HTML
servi de `/equipe` porte **un** `<form>`, en `method="get"`, **zéro** champ `$ACTION_…` et **zéro**
`"use server"` dans le périmètre. L'absence de point d'entrée en écriture est un constat, pas un
sous-entendu.

**Le contraste n'introduit aucun couple neuf par la position**, et c'est vérifié plutôt qu'affirmé :
la barre reprend les jetons de `components/ui/form-field.tsx` aux mêmes positions que celle de la
liste des projets, sur le même fond (`--surface-neutral-lightest`, `#f7f7f8`). Mesures refaites :
`content-neutral-dark` sur le fond de page **7,72:1** (le `<legend>` et les intitulés de champ),
`content-neutral-darkest` **16,98:1** (les libellés de case), et le filet de contrôle
`content-neutral-normal` **3,88:1** contre l'intérieur du champ, **3,69:1** contre le fond de page —
au-dessus de la limite de 3:1 des deux côtés. **Aucun septième substitut n'a été inventé** ; les
cases à cocher restent natives, sans `accent-*`.

### Deux pièges rencontrés

**`searchParams` rend une chaîne *ou* un tableau**, et le typer en `string` seul ferait mentir le
compilateur sur le cas qui est justement l'objet du ticket : `competence` est répétable, et Next
rend un tableau **dès la seconde occurrence** — jamais à la première. D'où `string | string[]` dans
le type et les deux aides `one()` / `many()`, cette dernière dédoublonnant.

**Un `<fieldset>` ne se met pas en `flex`.** Le `<legend>` y devient un élément de flux dont le
rendu diffère d'un moteur à l'autre. Le groupe de cases est donc un `<div class="flex flex-wrap">`
**à l'intérieur** d'un `<fieldset>` resté en flux normal, et la `<legend>` porte sa marge basse.

### Un vestige de sonde, et sa propreté

La vérification du cas « une compétence d'un autre domaine » a demandé un **second domaine en base
de développement** — il n'y en avait qu'un. Il a été créé sous le nom `Zzz Domaine sonde T5bis.3`,
délibérément **après « Groupe Meridian » dans l'alphabet** : `resolveDomainId` rend le premier
domaine actif **par nom**, et un nom en tête aurait fait basculer tout l'écran de développement sur
la sonde — la leçon du 18/08 sur le harnais voisin, qui ne passait que par chance alphabétique. La
sonde et sa compétence ont été **supprimées** après mesure, la base ne portant plus qu'un domaine ;
c'est une fixture locale, pas de la donnée métier (règle du 14/08).

`ETAT.md` passe de 366 à 378 lignes, soit **128 au-dessus du seuil de 250**. Le constat du
18/08/2026 tient sans être récrit : le balayage reste réservé à la session de découpage de C6.

---

## T5bis.4 — la fiche d'une personne, en panneau, 19/08/2026

### Le ticket était écrit, il restait à l'éprouver

Le code de la fiche était **déjà dans l'arbre de travail** au début de cette session — neuf fichiers,
dont quatre neufs — sans qu'aucune des quatre disciplines de l'étape 4 ait été jouée. C'est le cas
le plus glissant du protocole : un ticket qui compile, dont les tests passent et dont l'écran a l'air
juste **n'a rien démontré**. Tout ce qui suit est le travail de vérification, plus quatre corrections
de forme (indentation du corps de `<DrawerHost>`, quatre lignes de commentaire re-justifiées).

### Le harnais d'une fonction serveur, qui n'est pas celui d'une action

`loadTeamDrawer` est le premier point d'entrée frappé à la main **qui ne soit pas une action de
formulaire**, et la leçon de TD.1 ne s'y transporte pas telle quelle.

- **L'identifiant se lit dans le manifeste**, et non dans le balisage : une fonction serveur
  n'apparaît dans aucun champ `$ACTION_…`, puisqu'aucun `<form>` ne la porte.
  `.next/dev/server/server-reference-manifest.json` en donne un seul pour `app/(app)/equipe/page` —
  `408f8627…` —, ce qui est en soi un constat : la page n'a **qu'un** point d'entrée serveur, et
  T5bis.6 en ajoutera d'autres qui se compteront là.
- **La charge est le tableau d'arguments, en `text/plain`.** `[{"kind":"personDetail","id":"…"}]`
  avec `Content-Type: text/plain;charset=UTF-8` atteint la fonction. **En urlencodé, le serveur rend
  un 404** — pas le 200 muet de TD.1, mais une seconde manière de se tromper de refus tout aussi
  indiscernable sans témoin. Et **sans l'en-tête `next-action`, la même requête rend la page
  entière en 78 ko**, ce qui ressemble à un succès et n'en est pas un.
- **L'étape témoin est ce qui rend le reste lisible**, et elle tient en un nombre d'octets : la
  charge légitime rend **7 756 octets** portant `panneau-personne-titre` ; chacune des onze charges
  forgées rend **70 octets**, dont le corps est littéralement `1:null`. Deux ordres de grandeur
  séparent le panneau du refus ; aucune interprétation n'est nécessaire.

**Onze charges forgées, toutes refusées** sous l'identité d'un simple membre : quatre `kind`
appartenant à d'autres pages — dont `personaDetail`, **qui ne diffère de `personDetail` que d'une
lettre** —, un `kind` sans `id`, un `id` absent, un `id` qui n'est pas un UUID, une chaîne
d'injection, un UUID inconnu, une personne d'un autre domaine, une personne archivée.

### Le refus se rétrécit deux fois, et les deux fois avant la base

`asTeamRequest` écarte les `kind` étrangers **avant la session**, et `isUuid` écarte les
identifiants malformés **avant la requête**. Le second n'est pas un ornement : une colonne `uuid`
interrogée avec `'pas-un-uuid'` rend une erreur PostgreSQL, donc un 500, là où l'on attend la page
nue. Mesuré : `/equipe?personne=bonjour` rend **200 sans panneau**, comme `?personne=` vide et comme
la chaîne d'injection.

### Ce que la mise en défaut a établi

**Treize neutralisations, treize fois le compte exact.** Chacune a été appliquée sur une seule
ligne, suivie d'un `vitest run` dont les tests tombés ont été relevés, puis défaite. Aucune n'a
laissé la suite verte, et aucune n'a fait tomber un test qu'elle ne visait pas :

- les **neuf `filter()`** de la fiche font tomber chacun son propre cas d'étanchéité ;
- `isNull(persons.archivedAt)` fait tomber « une personne archivée n'ouvre rien », seule ;
- `isNull(projects.archivedAt)` fait tomber « un accompagnement archivé n'est pas dans la fiche » ;
- l'ordre des compétences et le `nulls last` des accompagnements font tomber leur seul test d'ordre ;
- `leftJoin(jobs)` passé en `innerJoin` en fait tomber **trois**, et c'est juste : il fait disparaître
  la fiche entière d'une personne sans métier.

**Quatre des neutralisations entraînent un second test avec elles**, celui qui compare la liste des
accompagnements par `toEqual`. Ce n'est pas un défaut de découpage mais la propriété d'une
comparaison exacte : toute ligne forgée qui entre dans la liste la fait tomber, en plus du cas
d'étanchéité qui la nomme. Le cas nommé, lui, reste **seul à tomber pour son propre filtre**, ce qui
est la condition posée par T5bis.3.

**Trois lignes forgées de plus** ont été nécessaires, sur la règle de T5bis.2 — franchir la
frontière sur *une seule* colonne. La plus instructive est la deuxième : un projet de `b` **portant
un statut de `a`**. Sans ce détail, `filter(projectStatuses)` l'aurait écarté lui aussi, et la chute
du test n'aurait plus désigné `filter(projects)`.

### Une sonde en base de développement, et ce qu'elle a coûté

Deux refus ne se lisaient dans aucun HTML servi, faute de matière : la base de développement n'a
**qu'un domaine** et **aucune personne archivée**. La sonde a donc créé un second domaine avec une
personne, et archivé Yanis Bertin le temps de la mesure. Les deux refus se lisent : `HTTP 200`, zéro
`role="dialog"`, zéro `inert`, et la même chose côté fonction serveur — 70 octets contre 7 756.
Yanis a **quitté la liste** pendant l'archivage (0 occurrence dans `/equipe`) et l'a retrouvée après
(9 lignes, comme avant).

**Le nom de la sonde a été choisi contre `resolveDomainId`**, qui rend le premier domaine actif *par
nom* : `Sonde T5bis.4 …` vient après `Groupe Meridian` dans l'alphabet, comme le `Zzz Domaine sonde`
de T5bis.3. Le défaire a en revanche été **partiel** : Yanis est rétabli, la personne-sonde est
archivée et les deux domaines-sonde sont **suspendus et archivés**, mais leur suppression a été
refusée par le bac à sable. Ils sont inertes — un domaine suspendu n'est jamais rendu par
`resolveDomainId` — et cette forme est celle que TD.1 avait déjà laissée à ses propres sondes. Deux
domaines ont été créés au lieu d'un, deux essais ayant échoué sur la signature de `forDomain`, qui
prend un `Scope` et non une chaîne.

### Ce que le contraste a donné

Le panneau introduit **une position neuve** : le fond du tiroir, `surface-neutral-pale` (`#fdfdfd`),
n'avait encore porté ni carte ni intertitre. Tous les couples ont donc été mesurés plutôt que
supposés :

| Couple | Mesure | Limite |
|---|---|---|
| Présentation et intertitres · `content-neutral-dark` | **8,12:1** | 4,5 |
| Niveaux et phrases d'état vide · `content-neutral-base` | **4,98:1** | 4,5 |
| Libellés · `content-neutral-darkest` | **17,87:1** | 4,5 |
| Filet des cartes · `surface-neutral-lighter` | **1,24:1** | 3 |
| Séparateur « · » · `content-neutral-light` | **2,22:1** | 3 |

Les trois couples de texte passent. Les deux autres ne passent pas, et **aucun des deux n'est une
décision de ce ticket** : le filet est la dette « une carte ne se détache d'aucun fond », récrite
dans `ETAT.md` avec sa troisième position ; le séparateur est `aria-hidden`, absent de l'arbre
d'accessibilité, et porte le même jeton aux **six** autres endroits où l'application sépare deux
mentions — fil d'Ariane, liste des projets, ligne de la liste Équipe, page projet. **Aucun septième
substitut n'a été inventé** (règle 2).

### Trois écarts assumés

**La fiche a deux sorties, pas trois.** La fiche du ticket annonce « les trois sorties sont des liens
vers `/equipe` » ; un panneau de **lecture** n'en a que deux — le voile et la croix. La troisième,
« Annuler », est le bouton d'un panneau de saisie, et `PersonDetail` n'a pas de `<form>`. Les deux
sorties présentes sont bien des `<a href>`, et elles portent l'adresse de repli attendue.

**Le décompte d'exclusivité ne peut pas être mis en défaut aujourd'hui.** `TEAM_PANEL_PARAMS` n'a
qu'une clé, si bien que la condition `> 1` n'est atteignable par aucune URL. Il est écrit d'avance
pour les deux clés de T5bis.6, exactement comme la fiche le demande, et c'est **la première fois
qu'une règle de ce dépôt est posée sans pouvoir être éprouvée le jour où on l'écrit**. Elle le sera
au ticket qui la rend atteignable ; d'ici là, elle est une intention, pas une garantie.

**Le chemin du clic n'a pas été parcouru.** Aucun navigateur pilotable dans la session. Le point est
ouvert dans `ETAT.md` avec ce qu'il reste précisément à voir, et ce qui le borne : les cinq
propriétés en attente appartiennent à `DrawerHost`, que TD.2 a éprouvé le 18/08 et qui n'a pas
changé d'une ligne.

### Un piège de conception, qui n'en est pas devenu un

**`ListRow` rend un `<Link>` quand on lui donne un `href`**, et un panneau ne doit pas naviguer. Le
`DrawerLink` a donc été posé **à l'intérieur** de la ligne plutôt qu'à sa place, `components/ui/list.tsx`
étant hors périmètre (règle 3). Le HTML servi montre que le résultat est celui qu'on voulait : un
seul `<a>` couvre les quatre colonnes, donc **un seul arrêt de tabulation par personne** et une
cible large. Le jour où une seconde liste voudra ouvrir un panneau, c'est `ListRow` qui devra
apprendre à recevoir une demande — pas ce contournement qui devra être recopié.

### L'adresse de repli, la seule chose que cette page hôte fait autrement

Les deux premières pages hôtes ferment sur leur URL nue, qui n'efface rien. Ici elle effacerait la
recherche : `docs/06` §9 veut les filtres conservés. `teamHref` les recompose donc, **à partir des
valeurs déjà confrontées au domaine** et jamais des paramètres reçus — réinjecter un identifiant
d'un autre domaine dans un lien serait redonner du crédit à ce qu'on vient de refuser. Lu dans le
HTML servi de `/equipe?dispo=available&q=fontaine&personne=<id>` : les deux sorties portent
`?q=fontaine&dispo=available`, et le lien de la ligne porte les trois clés.

### Le compte des lignes

`ETAT.md` passe de 378 à 403 lignes, soit **153 au-dessus du seuil de 250**. Le constat du 18/08/2026
tient sans être récrit : le balayage reste réservé à la session de découpage de C6, qui est le seul
moment où le protocole l'autorise.

---

## TD.3 — le bouton et le lien d'action, 19/08/2026

### Le piège du harnais, et il est neuf : le HTML servi en développement n'est pas déterministe

**Mesuré, pas supposé.** Deux `curl` consécutifs sur la même adresse, code inchangé et base immobile,
rendent **94 604 puis 94 713 octets**. Le diff porte sur trois cents lignes. Rien n'a bougé.

La cause est la **charge RSC embarquée** : Next sérialise l'arbre dans des `<script>` en fin de
document, et ses identifiants de rangée (`ec:I[…]` d'un côté, `f5:I[…]` de l'autre pour le même
`DrawerHost`) ainsi que le nonce `self.__next_r` changent à chaque requête. Comme la charge
**duplique tous les `className`** du document, un ticket qui compare des `class` sur du HTML brut
compare surtout du bruit.

**La parade tient en une ligne** : remplacer tout `<script>…</script>` par un jeton avant de
comparer. Vérifié avant d'être employé — deux captures successives du DOM ainsi nettoyé sont
identiques **au caractère près**, sur le plus lourd des vingt écrans (466 lignes).

**Ce qu'il faut en retenir pour TD.4 et TD.5, qui ont le même critère :** le critère « diff du HTML
servi » de TD.1 n'est un instrument que sur le **DOM**, jamais sur la réponse entière. Un diff
volumineux en développement n'est pas nécessairement une régression — mais il faut l'avoir mesuré
pour le dire, et un ticket qui découvrirait ce bruit après coup ne saurait plus distinguer ce qu'il a
cassé de ce que Next a renuméroté.

**À ne pas confondre avec la leçon de TD.1**, qui portait sur la **base** : une donnée créée pendant
la capture. Les deux se cumulent. Ici la base n'a pas bougé — le ticket n'a écrit aucune ligne.

### L'ordre des attributs se lit, il ne se suppose pas

`Button` compose `<button {...props} className={…}>`. Mettre `className` **avant** le spread aurait
rendu `<button class="…" type="submit">` là où les neuf points d'appel servaient
`<button type="submit" class="…">` — React rend les attributs dans l'ordre des props, et un attribut
réordonné est un attribut qui a changé. Même raison pour le skip-link d'`app/(app)/layout.tsx`, dont
`sr-only` **précède** la chaîne du bouton et dont les quatre `focus:*` la suivent : un
`${BUTTON_PRIMARY} sr-only …` aurait été juste visuellement et faux au diff.

**Le cas est réglé, mais il fixe une règle pour TD.4** : `BlockNote` et `ArchivedNotice` recevront
eux aussi des props sur des éléments dont l'attribut `class` est en dernière position. La règle est
d'écrire le spread avant, et de **le lire dans le HTML**.

### Deux écarts de rendu là où la fiche n'en annonçait qu'un

La fiche range `dev/session:112` dans « l'unique écart, assumé et rapporté » et traite la divergence
de `readings-panel.tsx` en incise — « une divergence se referme au passage ». Or la refermer **change
le rendu** : cinq éléments perdent `underline-offset-2`. Ce n'est pas un défaut de la fiche, c'est
une omission de comptage, et elle est signalée parce qu'un ticket qui découvre un écart non listé ne
peut plus dire si son critère tient. Les deux sont rapportés séparément, chacun avec sa mesure.

### Le périmètre de la fiche était périmé de trois copies

`app/(app)/equipe/page.tsx` porte trois des vingt-sept copies et n'est pas dans la liste de
`tickets-TD.md`. La raison est datée : T5bis.2 et T5bis.3 ont écrit ces trois copies **le jour même
de l'audit**, et le comptage 11 / 4 / 9 de la fiche est celui d'avant. Retrancher `/equipe` redonne
exactement ces trois nombres.

**Ce n'est pas une erreur de la fiche, c'est une propriété du dispositif** : un audit qui chiffre une
duplication produit un chiffre daté, et tout ticket écrit entre l'audit et son exécution le périme.
→ **à savoir pour TD.4 et TD.5, dont les comptages datent du même jour** — les vérifier par `grep`
avant d'écrire, jamais les reprendre de la fiche. TD.5 est le plus exposé : sa « soixantaine de
valeurs hors échelle » est un décompte sur tout le dépôt.

**Conséquence pour TD.6, consignée dans `ETAT.md`** : sa table de signatures s'appuie sur les mêmes
chiffres périmés. Elle n'en tire rien de faux — un motif lâche rattrape n'importe quel nombre de
copies —, mais son texte de fiche est à corriger.

### Une dette de forme, assumée et bornée

Les points d'appel où un `className` littéral devient un identifiant court gardent leur **forme
multiligne** :

```tsx
<Link
  href={ROUTES.productNew}
  className={BUTTON_PRIMARY}
>
```

Prettier replierait l'ouverture sur une seule ligne, l'élément tenant désormais en 80 colonnes. Le
dépôt **n'a pas Prettier en dépendance** et rien ne normalise ces fichiers ; replier à la main
coûterait trois lignes de diff par point d'appel pour un gain nul, là où la forme retenue tient la
promesse de la fiche — **seul l'attribut `className` change**, une ligne par site, revue immédiate.
→ **sans échéance ; le jour où le dépôt se dote d'un formateur, il repliera tout d'un coup.**

### Ce que le ticket n'a pas eu à payer

**Aucune sonde, aucune écriture en base.** Les deux boutons « Rétablir » ne se rendent que sur une
fiche archivée ; six produits et cinq accompagnements archivés existaient déjà, sondes de TD.1 et de
tickets antérieurs, **archivées et jamais supprimées** parce que le typage d'`unlink` refuse une
table à `archived_at`. La règle 4 a rendu la mesure gratuite — c'est la première fois qu'une dette
consignée comme telle sert d'outil.

### Le compte des lignes

`ETAT.md` passe de 403 à 420 lignes, soit **170 au-dessus du seuil de 250**. Le constat ne change pas
de nature : le balayage reste réservé à la session de découpage de C6. Il faut cependant noter que
**la section « Journal des tickets » a repris trois lignes en deux jours** après avoir été repliée le
17/08, et que le repliage suivant devra sortir les entrées hors chantier autant que celles des
chantiers clos.


---

## TD.4 — l'état vide dans un bloc, et le bandeau d'archivage, 19/08/2026

**Un audit qui `grep` ne sait pas ce que le code veut dire — cinq faux positifs sur quinze.** Le
tableau (a) de `tickets-TD.md` groupait les états vides par **chaîne CSS**. Quatre des sites listés
dans `components/projects/roadmap.tsx` (:410, :568, :576, :598) sont le résultat, l'objectif, les
participants et le motif d'annulation d'une carte d'activité : des lignes **présentes quand la donnée
existe**, c'est-à-dire l'exact inverse d'une absence. Le cinquième, `products/roadmap.tsx:573`, est
l'avis de troncature « 1 accompagnement est masqué hors de cette période », lu tel quel dans le HTML
servi pendant la mesure. **Les convertir aurait changé le rendu de cinq lignes de métadonnées pour
les faire ressembler à des états vides.** Symétriquement, le même `grep` avait manqué trois vraies
absences que leur préfixe de classe (`mt-3.5`, `border-t`) soustrayait à la recherche exacte.
*Transportable : une chaîne de classes identique ne prouve pas une intention identique, et
l'inverse non plus. Le prochain audit de duplication doit lire les branches, pas seulement les
attributs.*

**Écart au plan, assumé : `components/products/roadmap.tsx` est entré au périmètre.** Le plan validé
le déclarait hors périmètre, ses deux sites listés s'étant révélés être l'un un faux positif, l'autre
« structurellement différent ». La lecture du fichier pendant l'écriture a montré un **troisième**
site (:390) — une vraie absence, portant déjà la variante retenue —, et a montré que le second (:566)
se compose **à diff nul** avec le préfixe `className`. Les deux sont entrés : les laisser aurait
donné à TD.6 deux chaînes à garder sans logement, dans un ticket dont le critère est de finir à zéro.
Coût réel : nul au rendu, vérifié.

**Une décision de composant prise à contre-pied de TD.3, par la même méthode.** `BlockNote` compose
`className` en **préfixe**, `Button` le compose en **suffixe**. Ce n'est pas une incohérence : TD.3
avait lu ses neuf points d'appel et constaté `className` écrit en dernier ; TD.4 a lu les siens et
constaté la marge écrite en tête. Les deux règles sortent de la même discipline — *lu dans le HTML
servi, pas supposé* — appliquée à des données opposées. **Le jour où un point d'appel voudra les
deux**, la composition en préfixe ne suffira plus et il faudra trancher entre deux props ou un
`tailwind-merge` que le dépôt s'interdit. Aucun n'en veut aujourd'hui.

**La décision du jeton était déjà écrite dans le dépôt, sans pouvoir s'imposer.**
`components/products/roadmap.tsx:386` portait, en commentaire, **le raisonnement exact et les trois
ratios exacts** qui ont départagé `content-neutral-base` et `content-neutral-dark` — 8,12:1, 6,11:1,
3,75:1. Quelqu'un avait donc déjà tranché, dans un fichier, pour un paragraphe, sans moyen d'imposer
la conclusion aux quatorze autres. *C'est la meilleure illustration qu'on ait de ce à quoi sert un
socle : non pas trouver la bonne valeur — elle était trouvée — mais empêcher qu'on la retrouve
quatorze fois et qu'on se trompe cinq fois sur quatorze.*

**Cinq branches d'état vide n'existent dans aucune donnée du domaine.** Le relevé absent d'une North
Star, sa cible absente, la carte d'indicateur sans relevé, le panneau « Gérer les relevés » vide et
la personne sans équipe. Les deux seuls indicateurs vivants portent relevés **et** cible ; le seul
indicateur sans relevé est archivé, donc refusé par la résolution de panneau ; la seule personne sans
équipe n'entre pas dans la liste Équipe. Leur code a changé comme celui des autres, **leur rendu n'a
pas été vu**, et c'est dit plutôt que supposé. Dette de jeu d'essai, pas dette de code — consignée
dans `ETAT.md`.

**Deux pièges de mesure, coûteux en temps, à savoir pour le prochain harnais.** Le paramètre
d'ouverture de la fiche d'un persona est **`fiche`** sur la page produit, tandis que `persona`
désigne le panneau de **saisie** — et `fiche` est aussi le nom que j'avais supposé pour la fiche
d'une personne, qui est en réalité **`personne`**. Une adresse d'ouverture mal devinée ne rend pas
d'erreur : elle rend la page sans son panneau, et une capture silencieusement amputée passe pour une
capture valide. *Les onze noms de paramètres se lisent en une commande dans `lib/navigation` ; les
deviner coûte plus cher que les lire.* Second piège : `?releves=<id>` sur un indicateur **archivé**
rend la page sans panneau, pour la même raison invisible.

**`ETAT.md` passe de 420 à 428 lignes, soit 178 au-dessus du seuil de 250.** Un point refermé en est
sorti vers `HISTORIQUE-TICKETS.md`, un point ouvert a été récrit plutôt que d'empiler, et un point
neuf est entré. Le balayage reste réservé à la session de découpage de C6, comme le protocole le
veut — mais le fichier a désormais crû à chacun des trois derniers tickets, et le seuil n'est plus
un seuil : c'est un chiffre qu'on rapporte.

## TD.5 — le garde-fou de la règle 2 sur les espacements, 19/08/2026

### La mise en défaut la plus forte n'est pas un témoin, c'est l'inventaire

Un témoin prouve qu'une règle **peut** tomber ; il ne prouve pas qu'elle tombe **là où il faut**.
L'inventaire, lui, est établi indépendamment de la règle — au `grep`, avant de l'écrire — et il donne
un chiffre que la règle doit retrouver. Elle l'a retrouvé : **12 fichiers, exactement ceux du
relevé**, et pas un de plus.

**Mais le nombre, lui, ne tombait pas juste — 36 erreurs pour 40 occurrences —, et l'écart est une
propriété d'ESLint qu'il faut connaître avant de conclure à un trou.** *ESLint signale un **nœud**, pas
une occurrence.* Quatre `className` portaient deux classes fautives chacun — `h-0.75 w-5.5`,
`mt-7.5 mb-6.5`, `h-2.75 w-2.75`, `h-2.5 w-2.5` —, comptés une fois. 40 − 4 = 36, et le compte tombe.
*Sans cette vérification, un ticket pouvait conclure à quatre échappées et se mettre à élargir un
motif déjà juste.*

Les trois témoins classiques ont été passés ensuite, et les trois clauses en avaient besoin
inégalement :

- **Clause 1** — un `gap-2.5` posé dans `components/ui/avatar.tsx`, fichier propre : 37 erreurs, la
  nouvelle sur lui et **sur lui seul** ; retiré, retour exact à 36.
- **Clause 2** — elle n'a **aucun appelant au dépôt**, par l'arbitrage des gabarits de grille. Une
  clause qu'aucune ligne ne déclenche est une clause qu'on croit sur parole : `w-[300px]` posé au même
  endroit la fait tomber, `w-[calc(100%-var(--number-8))]` non.
- **Clause 3** — éprouvée deux fois par construction : le seul appelant du dépôt (`border-l-3`) vit
  dans un **gabarit de chaîne**, et le témoin dans un **littéral**. Les deux sélecteurs sont donc
  nécessaires, mesuré plutôt que repris de la sonde de TD.6.

Témoins négatifs, tous posés dans un attribut `className` réel : `gap-1.5`, `gap-0.5`, `flex-[1.4]`,
`grid-cols-[20rem_1fr]`, `first:border-t-0`, `border-t-[length:var(--border-width-1)]` — aucun ne
déclenche.

### La limite du sélecteur, mesurée : une classe hors `className` échappe à tout

`const PROBE = "gap-2.5 border-2 w-[300px]"` posé dans un fichier surveillé ne déclenche **aucune**
des trois clauses — le seul retour d'ESLint est l'avertissement de variable inutilisée. Les
sélecteurs sont ancrés sur `JSXAttribute[name.name="className"]`, et une chaîne de classes rangée
dans une constante n'est pas dessous.

**Le trou est vide aujourd'hui** — les 36 nœuds rendent compte des 40 occurrences du dépôt — mais le
motif existe : `app/(app)/projets/page.tsx:56` (`"min-w-0 flex-[1.4]"`), `components/ui/button.tsx`,
`components/ui/action-link.ts`. Ce dernier ajoute une seconde limite : **`files: ["**/*.tsx"]` ne voit
pas les `.ts`**, où vivent justement deux constantes du socle. Aucune ne porte d'espacement
aujourd'hui. → **la même limite attend `socleLock` en TD.6**, dont les signatures sont précisément des
chaînes de classes que le socle range dans des constantes.

### L'arbitrage qui défait une décision de la veille, et pourquoi il a quand même été rendu

Le journal du 18/08 défend nommément `mt-7.5`, `mb-6.5`, `mt-8.5`, `h-0.75`, `w-5.5` et `gap-2.25` :
« le rythme 16/30-26/14/34-16 de la maquette s'obtient en multiples du pas de 4 pixels, sans une
valeur littérale ». C'est vrai et c'est insuffisant : **un multiple fractionnaire du pas n'est pas une
valeur de l'échelle** — le §4 ne nomme ni 30, ni 26, ni 34, ni 9, ni 22, ni 3. Le bloc « Vision
produit » passe donc à **16/28-24/12/32-16**, décision humaine prise avant écriture. L'autre issue —
exempter le fichier — aurait demandé une dizaine d'`eslint-disable` dans le fichier le plus fautif du
dépôt, c'est-à-dire désactiver la règle là où elle avait le plus à dire.

### Ce que la règle ne vise pas, et pourquoi ce n'est pas une exception

`minmax(300px,1fr)` et `grid-cols-[20rem_1fr]` disent à quelle largeur une carte cesse de tenir : un
**point d'arrêt de mise en page**, pas une valeur de thème — l'arbitrage de T1.6 sur les points
d'arrêt responsifs, que la fiche de TD.5 reprend déjà pour `flex-[1.4]`. Ils sont hors de la clause 2
**par construction** : elle énumère les utilitaires de dimension et ne connaît ni `grid-cols-` ni
`flex-`. *Correction d'une chose que j'ai dite trop vite en posant l'arbitrage* : le pas **atteint**
ces deux valeurs — 300 px et 320 px sont 75 et 80 fois 4 px, et `--spacing(75)` les écrirait. Ce
n'est donc pas l'impossibilité qui les met hors règle, c'est leur nature. *Une exception se désactive, une portée se lit* — et écrire l'arbitrage dans la forme du
motif plutôt que dans un `ignores` est ce qui empêche la règle de se faire contourner par le geste
qui la contournerait légitimement une fois.

### Un huitième manque du design system, découvert par l'arrondi

`h-42.5` (170 px) s'arrondit en `h-42` (168 px), et 168 n'est pas plus dans la liste `--number-*` que
170 : **l'échelle nommée s'arrête à 100 px** alors que le pas de 4 px se prolonge. Le relevé donne
**dix-neuf valeurs légitimes au-delà**, de `w-28` (112 px) à `max-w-310` (1 240 px) — c'est-à-dire
toutes les largeurs de colonne, de panneau et de gouttière du dépôt, et non un cas isolé. Conséquence
sur la règle, assumée : **`spacingScaleLock` surveille le pas, pas l'appartenance à la liste.** Inventer les
jetons manquants aurait été toucher au design system, ce que la fiche interdit. Consigné en manque
(8) dans `ETAT.md`.

### Deux branches changent sans que leur rendu ait été vu

`components/products/roadmap.tsx:206` et `:225` (`px-2.5`, la fenêtre libre au mois) sont derrière
`SHOW_MONTH_RANGE = false` depuis le 18/08 ; `:554` (`h-2.5 w-2.5`, la pastille de jalon) attend un
jalon qu'aucun produit de la fixture ne porte — la ligne « Activités porteuses d'un résultat » ne
figure dans aucune des 28 captures. Leur code a changé comme celui des autres, **leur rendu n'a pas
été vu**. Même nature que les cinq branches d'état vide relevées en TD.4 : dette de jeu d'essai, pas
dette de code.

### Le harnais, repris de TD.3 et TD.4 sans surprise

28 adresses, tout `<script>` neutralisé, **déterminisme prouvé sur deux captures successives avant
la mesure et deux après**, base immobile — aucune écriture, aucune sonde en base. **367 paires de
lignes changent, 408 rendus modifiés, et zéro ligne inexpliquée** : chaque ligne « avant » redonne
exactement la ligne « après » quand on lui applique les 23 substitutions annoncées, vérifié
mécaniquement plutôt qu'à l'œil. `/dev/session` ne bouge pas d'un caractère — elle vit hors du groupe
`(app)`, donc sans la barre latérale, seule adresse dans ce cas.

### `ETAT.md` passe de 428 à 449 lignes, soit 199 au-dessus du seuil de 250

Un point refermé en est sorti vers `HISTORIQUE-TICKETS.md`, un point ouvert a été récrit plutôt que
d'empiler, et deux points neufs sont entrés — le manque (8) et l'arbitrage des gabarits de grille.
**Le fichier a crû à chacun des quatre derniers tickets** (420 → 428 → 449), et le protocole se
contredit sur qui doit le corriger : l'étape 5 dit « au-delà, le balayer avant de continuer », la
session de découpage dit qu'elle en est « le seul moment ». Un ticket qui balaierait toucherait aux
points de quinze autres. → **le balayage attend le découpage de C6, et le seuil n'est plus un seuil.**

### Une ligne manque au journal des tickets d'`ETAT.md`, et elle n'a pas été ajoutée

TD.4 n'a **pas** de ligne dans « Journal des tickets », là où TD.1, TD.2 et TD.3 en ont une ; seul
l'en-tête de dernière mise à jour le mentionnait. La ligne de TD.5 s'insère donc après celle de TD.3,
en laissant le trou. **Règle 3** : l'écrire aurait été un ajout « pendant que j'y suis » sur le récit
d'un autre ticket. → **une ligne à ajouter par qui a écrit TD.4, ou au prochain balayage.**

---

## TD.6 — le garde-fou du socle, 19/08/2026

### Le format plat d'ESLint écrase une règle, il ne la fusionne pas — et TD.5 a failli disparaître

C'est le piège central du ticket, et il ne se voit dans aucun message. `spacingScaleLock` (TD.5)
posait `no-restricted-syntax` sur `**/*.tsx`. Un second bloc posant **la même règle** sur le même
ensemble de fichiers ne s'y ajoute pas : **le dernier gagne, en entier.** Écrit naïvement, `socleLock`
aurait donc **désactivé les trois clauses de TD.5 partout hors de `components/ui/`** — c'est-à-dire
partout où elles servent, et le lendemain du jour où elles ont été écrites. Rien n'aurait signalé la
perte : `npm run lint` serait resté vert, pour la mauvaise raison.

La parade tient en trois gestes : `SPACING_CLAUSES` devient une constante nommée ; `socleLock` porte
`["error", ...SPACING_CLAUSES, ...SOCLE_CLAUSES]` ; `spacingScaleLock` se restreint à
`components/ui/**/*.tsx`, le seul ensemble que `socleLock` ignore. La couverture est complète et
sans recouvrement, mais elle **repose sur une reprise manuelle** : quiconque ajoutera un troisième
bloc `no-restricted-syntax` devra reprendre les deux tableaux, ou perdre celui qu'il n'a pas repris.
→ **piège à connaître avant d'ajouter une règle de syntaxe ; il n'y a pas de garde-fou du garde-fou.**

**La non-régression se mesure, elle ne se raisonne pas.** Un `gap-2.5` témoin doit tomber des deux
côtés de la frontière — hors du socle (preuve de la reprise) et dedans (preuve de la couverture
restante). Les deux mesures ont été faites ; sans elles, l'erreur serait indiscernable du succès.

### Aucun motif esquery ne porte d'espace littéral, et c'est une précaution non éprouvée

Les quatre motifs de signature qui décrivent une suite de classes emploient `\s` là où un espace
serait naturel (`rounded-lg\sborder`, `text-sm\sleading-175\s…`). La raison : la grammaire d'esquery
ne garantit pas qu'un espace traverse l'analyse d'un sélecteur d'attribut, et **les trois motifs de
TD.5 n'en portaient aucun** — la question n'avait donc jamais été posée au dépôt. Elle n'a pas été
tranchée ici non plus : `\s` fonctionne, et l'espace littéral n'a pas été essayé. C'est une
précaution qui coûte un caractère et évite une classe de panne silencieuse.
→ **sans échéance ; à ne pas « simplifier » sans mesure.**

### Un geste dont les classes vivent dans deux attributs échappe à toutes les signatures

C'est la limite la plus coûteuse du ticket, et elle est structurelle. `components/projects/roadmap.tsx:235`,
`components/projects/resources.tsx:215` et `components/projects/adopted-indicators.tsx:285` portent
tous trois `inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${className}`,
et l'appelant fournit la couleur : `roadmap.tsx:209` passe
`bg-surface-primary-base text-content-neutral-pale`, `:177` passe
`border border-content-neutral-normal bg-surface-neutral-pale text-content-primary-dark`.

**C'est le bouton primaire, et le secondaire, en deux morceaux** — invisibles à `socleLock`, dont
chaque motif ne voit qu'un attribut à la fois. Les rattraper demanderait un motif portant sur la
couleur seule (`bg-surface-primary-base`), ce que les interdits du ticket refusent — et à raison :
les couleurs sont déjà protégées structurellement par `--color-*: initial`, et une règle redondante
est une règle qu'on désactive. La vraie réponse est que ces trois coquilles **devraient être
`Button` / `BUTTON_PRIMARY`**, ce qui les ferait rentrer sous la règle par disparition plutôt que
par détection. Hors périmètre (règle 3) : la fiche de TD.3 ne les listait pas, et ce ticket ne
touche aucun composant. → **ticket propre, consigné en point ouvert dans `ETAT.md`.**

C'est la parente de la limite mesurée en TD.5 — *une classe écrite hors d'un attribut `className`
échappe aux clauses* —, et elle vaut identiquement ici : les deux garde-fous partagent le mécanisme,
donc l'angle mort.

### `uiLayerSeal` ne scelle pas `components/shell/`, et la fiche ne le demandait pas

Les trois groupes interdits sont ceux que la fiche énumère : `@/lib/queries/*` (en valeur),
`@/components/{products,projects,team}/*`, `@/app/*`. **`@/components/shell/*` n'y est pas** —
`breadcrumb.tsx`, `main-nav.tsx` et la coquille applicative sont hors du socle au même titre que les
composants métier, et rien n'empêcherait aujourd'hui `components/ui/` de les importer. L'ajouter
aurait été un quatrième groupe que la fiche ne demande pas (règle 3), et la propriété est vraie
aujourd'hui : le socle n'importe rien de `shell/`. Ce n'est donc pas une régression, c'est un trou
dans le scellement. → **une ligne à ajouter au prochain ticket qui ouvre `eslint.config.mjs`.**

### La signature de `BlockNote` ne se laisse pas écrire, et le ticket l'assume

`text-sm leading-175 text-content-neutral-dark` — la variante que TD.4 a retenue — est **indiscernable
au motif de classes** de quatre paragraphes qui disent l'inverse d'une absence : la bio de
`person-card.tsx:39`, le résumé de `persona-detail.tsx:131`, la note de vision d'`indicators.tsx:361`,
l'écart chiffré d'`indicators.tsx:622`. Le premier est le **voisin immédiat d'un vrai `<BlockNote>`
dans le même ternaire** : le même fichier, la même balise, la même chaîne, deux intentions opposées.

Ce qui distingue les deux est l'intention, et ESLint ne la lit pas. Le motif retenu porte donc sur
les trois écritures que TD.4 a **fait disparaître** — il garde la divergence, pas la duplication.
Conséquence assumée et à ne pas oublier : **une copie à l'identique de la chaîne retenue passe
sous le garde-fou.** C'est la seule des six signatures dans ce cas.
→ **sans échéance ; ce serait une propriété de composant, pas de chaîne.**

### `ETAT.md` passe de 451 à 465 lignes, soit 215 au-dessus du seuil de 250

Un point ouvert est refermé et sorti vers `HISTORIQUE-TICKETS.md`, deux points neufs entrent — le
bouton en deux attributs, et le trou de `shell/` dans le scellement. **La contradiction du protocole
relevée par TD.5 n'a pas bougé** : l'étape 5 dit « au-delà, le balayer avant de continuer », la
session de découpage dit qu'elle en est « le seul moment ». → **le balayage attend le découpage de
C6, et le seuil n'est plus un seuil.**

### La ligne manquante de TD.4 dans `ETAT.md` n'a toujours pas été ajoutée

TD.5 l'avait relevée et laissée : TD.4 n'a pas de ligne dans « Journal des tickets », là où TD.1,
TD.2, TD.3 et maintenant TD.5 et TD.6 en ont une. **Le groupe TD se clôt donc avec un trou dans son
propre récit.** La ligne de TD.6 s'insère après celle de TD.5, en laissant le trou où il est : règle
3, et l'arbitrage de TD.5 tient toujours — l'écrire serait un ajout sur le récit d'un autre ticket.
→ **à combler au prochain balayage, c'est-à-dire au découpage de C6.**

## Le bloc « Use Cases » — hors ticket, 19/08/2026

**Un helper dont l'objet s'appelle `useX` doit mettre le verbe devant, et la règle a mordu deux
fois.** `react-hooks/rules-of-hooks` reconnaît un crochet React à `use` suivi d'une **majuscule**,
et refuse alors tout appel depuis une fonction qui n'est ni un composant ni un crochet.
`useCaseRefusal` et `useCaseScopeRefusal` dans `actions.ts` ont donné cinq erreurs de lint, sur
leurs cinq appels ; `useCaseForm` et `useCasesOf` dans `actions.test.ts` en ont donné deux de plus,
après coup — la seconde fois alors que la leçon était déjà écrite dans le fichier voisin. Les
quatre s'appellent désormais `refuseUseCase`, `refuseUseCaseScope`, `formForUseCase` et
`liveUseCasesOf`. **La convention `objetPuisAction` du dépôt cède devant la règle**, et elle cédera
pour tout objet futur dont le nom commence par `use` — ce qui, sur un produit qui parle de use
cases, arrivera encore. Rien de tout cela n'apparaît au typage : seul `npm run lint` le dit.

**`now()` est le temps de la transaction, pas celui de la ligne : un lot d'insertion ne conserve
pas l'ordre du fichier.** `listProductUseCases` ordonne par `created_at` puis `id`, faute de
colonne de rang (voir plus bas). Les deux use cases de la fixture, écrits par un même `insertMany`,
portent **le même horodatage à la milliseconde** — mesuré : `2026-08-19T17:41:36.339Z` pour les
deux —, si bien que c'est l'identifiant, un UUID tiré au hasard, qui les départage. Ils se lisent à
l'écran dans l'ordre inverse du fichier. **L'ordre reste stable**, ce qui est la propriété que la
lecture doit garantir et que les tests vérifient ; il n'est simplement pas celui qu'on croit. Les
commentaires de `lib/queries/use-cases.ts` et de `lib/db/schema.ts` ont été **corrigés après
mesure** — ils affirmaient « l'ordre où ils ont été déclarés ». Vaut pour toute table future qu'on
ordonnera par `created_at` sans colonne de rang.

**L'unicité de `use_case_personas` rend un doublon inter-domaines non représentable, et cela a
changé le test.** La première écriture de `lib/queries/use-cases.test.ts` forgeait un second
rattachement `(zéro, Alice)` sous un autre `domain_id`, pour éprouver qu'un persona n'y soit pas
compté deux fois. La base l'a refusé :
`use_case_personas_use_case_persona_unique` porte sur `(use_case_id, persona_id)` **sans**
`domain_id`. C'est une propriété, pas un obstacle, et elle rend le test plus fort — ce qui fuirait
n'est pas un doublon mais un persona **de plus**. La ligne forgée vise donc Carole, un profil
vivant du même produit et délibérément non rattaché. **Sans cette ligne, le filtre de domaine de la
seconde lecture ne serait éprouvé par rien** : la leçon de T5bis.3, resservie.

**Un test d'étanchéité vu du mauvais côté n'énonce pas ce qu'on croit.** Le miroir de
« le domaine `a` ne voit pas la ligne forgée » avait été écrit
`expect(listProductUseCases(b.scope, a.productId)).toEqual([])`. Il a échoué, et il avait tort : la
ligne forgée appartient au domaine `b` et vit sur le produit de `a`, donc `b` la voit — c'est
exactement ce que « forger » voulait dire. L'énoncé juste est que `b` ne voit **aucun des use cases
de `a`**, ce qu'aucune ligne forgée ne peut masquer.

**Le droit dérivé rend un membre ordinaire capable d'écrire sur un produit dont la page ne lui
proposait rien, et c'est la règle.** Sonde HTTP du 19/08/2026 : Awa Diallo, `member`, a réécrit le
`productId` **lié** dans le champ `$ACTION_1:1` du formulaire servi — il y est en clair, comme le
`Rappel de contexte` d'`ETAT.md` le dit — et la création est passée sur l'autre produit. Vérification
faite, elle y est `contributor = true` sur un accompagnement vivant : `openProductWrite` répond sur
le `productId` **reçu**, l'arbitrage (b) de `tickets-C5.md` le veut ainsi, et le refus n'aurait pas
eu lieu d'être. **La sonde était fausse, pas le code** — reprise sur un troisième produit où elle
n'est contributrice de rien, elle refuse. À retenir pour toute sonde de droit à venir : **choisir
l'identité en lisant ses rattachements, jamais son rôle de domaine seul.**

**Trois écarts documentaires assumés, tous arbitrés par l'humain le 19/08/2026.**
(1) **L'intitulé « Use Cases » est en anglais**, contre « interface en français » de `CLAUDE.md`,
et la clé d'URL `usecase` avec lui — traduire l'adresse d'un bloc que l'écran nomme en anglais
aurait donné deux vocabulaires pour un objet. (2) **`use_cases` et `use_case_personas` n'existent
dans aucun `docs/`**, comme `products.vision`, `indicators.is_north_star` et `personas` avant elles
(règle 6). (3) **La fixture reçoit une troisième source** : l'en-tête de `scripts/seed.ts` pose
« deux sources, et pas une de plus » — les `docs/` et le brief §7 —, et les deux use cases amorcés
viennent de la demande humaine, qui les rédige mot pour mot.

**La fixture ne sème aucun persona, si bien que le rattachement n'est pas amorçable.**
`scripts/seed.ts` ne connaît pas la table `personas` — le bloc du 18/08/2026 n'y est jamais entré.
Les deux use cases amorcés n'ont donc **aucun rattachement**, ce qui reste un état valide, le
rattachement étant facultatif. Le lien a été éprouvé à la main, par sonde scopée, sur un persona
existant de la base de développement. Semer des personae aurait été ouvrir le bloc voisin (règle 3).
→ **le jour où la fixture sèmera des personae, y joindre deux rattachements.**

**Deux lignes de sonde restent dans la base de développement, archivées.** « Sonde temoin » et
« Sonde detournee », écrites par les sondes HTTP du droit, sont **archivées et non supprimées** —
la pratique posée par TD.1. Elles n'apparaissent nulle part à l'écran ; `db:seed` ne les connaît pas
et ne les nettoiera pas. La dérive de la base de développement, déjà actée, s'allonge de deux lignes.
