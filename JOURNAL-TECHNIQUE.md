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
