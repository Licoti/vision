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
