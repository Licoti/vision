# ETAT — Vision

Fichier de contexte de session. Mis à jour par Claude en fin de chaque ticket.

**Dernière mise à jour :** 11/09/2026. **T12.1 terminé** — `domain_events` existe et **rien ne
l'écrit encore** ; migration `0019`, **et pas une seconde**. 1 962 → **1 966 tests**. **Ticket
suivant : T12.2 — les dix gestes laissent leur trace.** **C7 reste ouvert** sur T7.9 et T7.10 : C12
passe devant, **quatrième écart à `docs/05` §6**, consigné — T7.10, qui ferme le POC, verra la fiche.

---

## Avancement

| Chantier | Tickets | État |
|---|---|---|
| C1 à C6, TD et C5bis | T1.1 → T6.7 | **terminés**, 11-27/08 |
| C7 — Finitions | T7.1 → T7.10 | **en cours** (rouvert le 09/09) — T7.1 → T7.8 livrés |
| C8 — Dette | T8.1 → T8.5 | **terminé** |
| C9 — SSO et administration multi-domaine | T9.1 → T9.6 | **terminé** |
| C10 — les macro-parcours | à découper | reporté hors C8, 04/09/2026 |
| C11 — Le parcours d'entrée | T11.1 → T11.6 | **terminé** (rouvert puis refermé le 09/09) |
| C12 — Détail et journal d'administration des domaines | T12.1 → T12.4 | **en cours** — T12.1 livré |

---

## Journal des tickets

*(une ligne par **chantier clos**, une par ticket du chantier en cours. Récit :
`HISTORIQUE-TICKETS.md` ; pièges et dettes : `JOURNAL-TECHNIQUE.md`.)*

- **C1 à C4bis — T1.1 → T4bis.6, 11-15/08.** Le socle, quatre écrans de lecture, deux formulaires,
  les activités, les ressources et les résultats : le POC minimal démontrable, et la boucle de
  `docs/05` §2 fermée.
- **C5, TD et C5bis — T5.1 → T5bis.7, 16-25/08.** Indicateurs et temps long — **tout a depuis été
  refait hors ticket**, neuf dérogations au journal —, puis **hors chantier** le socle des panneaux
  (**−644 lignes nettes**) et les garde-fous ESLint, puis l'Équipe : trois tables, le radar, six
  gestes, chantier que `docs/05` §5 n'avait pas prévu.
- **C6 — T6.1 → T6.7, 26-27/08.** `events` reçoit sa première ligne après six chantiers au schéma :
  cinq verbes, six `target_type`, dix-neuf points d'appel ; puis les liens déduits **en SQL**, les
  déclarés, la vue d'ensemble.
- **C7 — T7.1 → T7.6, 28-30/08, puis en pause.** Le budget, deux filtres, l'administration passée
  d'**un référentiel sur neuf à neuf sur neuf**, la coquille, les petits écrans — **19 formes sur 31
  en défaut à 375 px** avant, aucune après.
- **C8 — T8.1 → T8.5, 04-05/09.** Le premier chantier que `docs/05` §5 n'a pas écrit, tiré des seuls
  points ouverts — **quatre énoncés de fiche sur cinq mis en défaut**. 1 582 → 1 646 tests.
- **C9 — T9.1 → T9.6, 06-07/09.** Deux tables hors du produit, le SSO — le domaine cesse d'être
  *trouvé* pour être *désigné*, **aucun écran du produit ne bouge** —, le droit dont **la preuve se
  passe en argument**, l'écran au-dessus des domaines, l'amorçage, les comptes. 1 646 → **1 816**,
  puis 1 824 avec le `?fournisseur=` non raccordé qui rendait **500** (hors ticket, 08/09).
- **C11 — T11.1 → T11.6, 08-09/09.** Les trois maillons qui manquaient au geste de C9 —
  l'invitation, l'amorçage en un geste (quatre tables), la correction des informations de son
  domaine —, puis **le contrôle de sécurité T11.6** : sept familles éprouvées ensemble, **aucune
  faille** (`SECURITE-C9-C11.md`). 1 816 → **1 962 tests, 69 fichiers**.
- **C7 — T7.7, 10/09.** Accessibilité : deux `h1` absents, la frise atteignable au clavier,
  **trente-huit `role="menuitem"` retirés**, un cliquet de lint. **Trois énoncés de fiche en défaut.**
- **C7 — T7.8, 10/09.** D36 tenue : « À propos », **aucune lecture en base**, 200 sans cookie. Revue
  des **seize** états vides : **deux cul-de-sac** corrigés, **douze vus rendus**, **quatre nommés
  inatteignables**. 1 962 tests, inchangés.
- **C12 — T12.1, 11/09.** `domain_events` posée **avant tout écrivain et tout lecteur** : un
  `ScopedTable` hors produit, donc couvert **sans une ligne de couche neuve** ; quatre colonnes,
  toutes lues par T12.3 ; `archive` et `deleteRow` en refus de typage. **Quatre mises en défaut, une
  seule mesure tombe à chaque fois.** 1 962 → **1 966 tests**.
- **Hors ticket, 17/08 → 02/09 — vingt-neuf gestes**, tous à la demande humaine, détaillés dans
  `HISTORIQUE-TICKETS.md`. **Cinq portent une migration, `0010` à `0014`** ; le reste est de
  l'ergonomie, plus le **renommage de « Projets » en « Accompagnements »**, qui **rouvre D35**.

---

## Points ouverts

*(un point, une destination — sans destination, c'est un point qu'on n'a pas tranché. Un point
refermé part dans `HISTORIQUE-TICKETS.md`.)*

### a. À trancher · gestes détaillés : `ACTIONS-HUMAINES-C9.md` et `ACTIONS-HUMAINES-C11.md`

- **Les secrets Neon n'ont jamais été tournés.** Deux chaînes ont transité en clair le 12/08, hors
  dépôt mais valides ; **reportés cinq fois**, et la raison qui les reportait n'existe plus.
  → **action humaine, la plus vieille de la liste.**
- **Rien n'est prêt côté production** — `AUTH_URL` vaut `localhost:3000`, l'URI de rappel n'est
  enregistrée nulle part, les trois secrets ne sont pas dans Netlify : **le SSO ne peut pas
  fonctionner en ligne avant ces quatre gestes** (`ACTIONS-HUMAINES-C9.md` §4). → **action humaine.**
- **Microsoft est écrit et n'est pas branché** — Entra ID Free demande une carte bancaire, et
  `ENTRA_CLIENT_ID`/`_SECRET` manquent. **Mesuré** : la découverte aboutit, l'adresse d'autorisation
  est juste ; **pas mesuré** : l'échange du code et le gabarit `{tenantid}`. → **action humaine.**
- **L'envoi de courriel est écrit et n'est pas branché** — ni `RESEND_API_KEY` ni `MAIL_FROM`, et
  **aucune requête réelle n'a jamais été émise**. → **action humaine.**
- **`CLAUDE.md` porte trois énoncés périmés** : « Statut de projet » contre « Statuts
  d'accompagnement » · l'entrée « Projet » contre « Accompagnements » · *« Entra ID le remplacera en
  C7 »*, quand c'est Google, en C9 (même écart `docs/01` §141). → **action humaine.**
- **Ce qu'un macro-parcours relie reste à trancher**, et avec lui **« macro-parcours » contre le
  « Réseau de liens entre produits » de `docs/02` §10**, même direction sous un autre nom. L'entrée
  de menu et l'écran vide restent tels quels — ni table, ni objet, ni droit.
  → **session de découpage de C10.**
- **Le journal d'administration se lira-t-il depuis le domaine ?** **Reporté par l'arbitrage (3) de
  C12** : la suspension et l'archivage ferment la session, donc les deux gestes qui comptent le plus
  seraient invisibles de l'intérieur. **Rien n'est forclos** — `domain_events` porte `domain_id` —,
  mais la lecture demande un bloc, un droit, un état vide, et **la colonne d'acteur qui manque**.
  → **arbitrage humain, ou le jour où l'usage le réclame.**

### b. Assignés à un ticket

*(le fait et sa destination. Le récit vit dans `HISTORIQUE-TICKETS.md`, la mesure dans
`JOURNAL-TECHNIQUE.md`.)*

- **Le jeu de démonstration n'a ni adresse ni identité vérifiée** : connectable, pas **cohérent**.
  → **le prochain ticket qui ouvre `scripts/seed.ts`.**
- **Le décompte de jumelles de `grantPersonAccess` est inatteignable** depuis T11.1, qui a posé
  l'index sur `lower(email)` : filet conservé, **aucun test ne peut plus l'exercer**. → **le jour où
  l'on ôte un filet.**
- **Le libellé des deux rôles est écrit à trois endroits**, plus deux mots que `lib/journal.ts`
  récrit exprès, étant pur. → **T7.9**, avec les quatre libellés hors de `lib/format.ts`.
- **`persons.identity_provider` n'a aucun écrivain**, et l'inscrire buterait sur
  `persons_external_id_requires_directory`. → **le jour où l'import d'annuaire arrive.**
- **L'amorçage d'un domaine n'est pas atomique et écrit quatre tables** (T11.4) — **C12 lui en ajoute
  une, la ligne de journal, posée en dernier pour cette raison** ; rien ne répare un amorçage
  partiel, et le rapprochement de T8.4 le rendrait rejouable. → **avec la dette de T3.6.**
- **`withoutAnySession()` reste importable depuis `app/`** : la refermer demande une clause ESLint,
  ce qui réveille la dette d'`uiLayerSeal` — deux sujets pour un geste, et **T7.7 a ouvert le fichier
  sans les faire** (règle 3). **Seconde fois qu'une destination « le prochain ticket qui ouvre le
  fichier » échoue**, après T8.4. → **un ticket à soi, ou un arbitrage humain.**
- **Sans JavaScript, le lien d'invitation est perdu** — `resolveTeamDrawer` ferme le panneau dès
  qu'une invitation vivante existe ; l'invitation, elle, est écrite. **Seconde exception à D30**, non
  arbitrée. → **arbitrage humain, puis le ticket qui rouvre `lib/drawers/team.tsx`.**
- **Sans JavaScript, aucun geste de la ligne d'entreprise n'est atteignable** — `ActionMenu` n'est
  pas dans le HTML servi depuis T9.4. **Troisième exception à D30.** → **C12, T12.4 : le déménagement
  des gestes sur la fiche le referme sur cet écran, et sa mesure 1 le prouve.**
- **Deux garde-fous à relire avant de « simplifier », jamais après.** **Rien en base ne double le
  refus « une invitation attend déjà »** — l'index partiel porte sur `(domain_id, person_id)`, et une
  seconde désignation vise une autre personne, donc le contrôle applicatif est seul gardien
  (`designateDomainManager`) · **`redeemInvitation` ne juge pas l'état du domaine**, et c'est ce qui
  rend l'arbitrage (4) de C11 mesurable : **un seul témoin isole l'ordre des six règles**. → **à
  relire avant de toucher l'un des deux, jamais après.**
- **Le parcours clavier n'a jamais été fait au navigateur** (T7.7) : l'ordre de tabulation est mesuré
  **d'après le HTML servi** ; `Échap`, le clic extérieur, le retour du focus et le défilement de la
  frise aux flèches ne le sont pas. → **arbitrage humain : une dépendance de développement, ou le
  manque assumé.**
- **Lire un écran authentifié au `curl` demande un harnais qui n'existe pas** — `/dev/session` exige
  une session **déjà ouverte** depuis T11.6, et **trois tickets de suite l'ont redemandé**, T7.8
  payant sept scripts jetables. S'y rattachent **les deux corrections d'états vides de T7.8**,
  mesurées et non gardées. → **outillage : `scripts/probe.ts` ou son équivalent.**
- **Quatre états vides ne s'atteignent par aucun jeu de données** (T7.8), deux structurellement —
  `/administration`, dont les référentiels sont semés, et `/equipe`, dont la session **est** une
  personne du domaine. **Rien n'a été touché** (règle 3). → **le jour où un référentiel s'ajoute sans
  être semé.**
- **Le journal reste incomplet, et il perd son sixième nom** (T8.3, récrit le 11/09) : **cinq
  familles écrivent sans trace** — le produit, l'adoption, la compétence portée, les huit
  référentiels autres que l'entité (trente-deux gestes), les trois gestes de l'invitation (arbitrage
  assumé : l'acceptation n'a ni session ni acteur). La **sixième** — la correction des informations
  du domaine — **est prise par C12**. Chacune des cinq est **fixée par un test qui tombera**, et leur
  contenu est connu : une migration d'énuméré, une quarantaine de points d'appel. → **un ticket à
  soi, hors C12.**
- **Huit petites dettes partagent la même destination**, détaillées au journal technique :
  `uiLayerSeal` garde une liste de six dossiers et non une propriété · **`listProductsWithCounts` ne
  rejoue pas la jointure de statut — quatrième décompte de la famille, et le seul qui rende un
  chiffre faux** · `listResultToolOptions` · les deux comparateurs de libellé, et `entities.position`
  · la carte radio écrite deux fois · l'état vide absent de `picker.tsx` · un pied de formulaire sur
  quatre · les props d'icône de `Button`. → **au prochain ticket qui ouvre le fichier.**

### c. Dettes assumées — le fait et sa destination ; le détail vit dans `JOURNAL-TECHNIQUE.md`

- **Cinq constats du contrôle T11.6, aucun critique** — mesures dans `SECURITE-C9-C11.md`. Aucun
  **en-tête de sécurité**, aucun `middleware.ts`, la page d'invitation cadrable en iframe,
  `X-Powered-By` qui fuit la pile → **durcissement du transport.** `next@16.3.0` porte deux avis
  critiques — l'un sans objet sous Linux, l'autre **inexploitable** — et `sharp` un avis haut,
  corrigés en 16.3.4 → **une montée de version, hors revue.**
- **Le design system a neuf manques**, aucun inventé, tous mesurés. Le plus cher : **une carte ne se
  détache d'aucun fond** — cinq positions de **1,01:1 à 1,26:1** quand le seuil d'un composant est
  3:1, et le plus franc jeton de surface neutre employable en filet plafonne à **2,22:1**, le seul
  qui passerait étant un jeton de **texte**. Les couples de texte passent tous 4,5:1, l'anneau de
  focus 3:1 sauf sur la barre latérale (dérogation). S'y ajoutent trois élévations, deux gradients,
  six jetons absents, **`--number-*` arrêté à 100 px**. → **design system.**
- **Six points attendent une main humaine** : le **filtre de la roadmap** ne se partage plus par son
  adresse · la **page produit porte deux langages d'en-tête** · **`docs/06` §3 porte deux écarts**, et
  *si le document suit ou si l'écart tient* reste à trancher · les **deux listes de l'accueil**
  partagent le mot « activité » pour deux tables · la **page projet ne consomme pas
  `PageHeader.facts`** (D39) · **« +N » sur `/equipe`** est un décompte que T5bis.2 interdit.
  → **arbitrage humain.**
- **La liste close de `docs/06` §5 porte trois écarts** (28/08) — « Projets liés » n'est plus rendu,
  « Démarrage » ne l'est que sans activité, « Budget » est un rang de la fiche d'identité. Rien n'est
  supprimé, tout reste testé. → **assumés**, geste en T7.10.
- **Cinq dettes sans échéance.** Sans JavaScript, **les gestes d'une carte de roadmap ne sont plus
  atteignables** — seule exception arbitrée à D30 · **`disabled:opacity-40` est servi sur douze
  balises qui ne peuvent pas être désactivées**, à 2,35:1 composé · **rien en base ne retient un
  outil** (`set null`) · **la fixture est incomplète sur les ressources et les résultats** · **le
  réseau fait tomber la suite** : `NeonDbError: fetch failed`, une fois sur dix **sans écart
  d'assertion**. → **sans échéance.**
- **Un référentiel sur neuf reste ouvert au renommage, et c'est structurel.** T8.4 reconnaît une
  ligne par sa `position` — huit refermés, mesurés —, mais `tools` n'a pas d'ordinal ; l'orpheline
  « Audit d'accessibilité » reste en base de développement. → **le jour où une colonne s'autorise.**
- **Un test est faux par construction**, et il l'était avant T9.4 :
  `app/(app)/produits/[id]/actions.test.ts:1490` assère qu'un résumé ne contient ni `"62"` ni `"88"`,
  contre un suffixe de fixture **aléatoire** — une fois sur cinquante environ, et ce n'est pas
  l'intermittent réseau. → **le prochain ticket qui ouvre ce fichier.**
- **La base de développement a dérivé de la fixture, et elle est jetable** — la règle 4 protège la
  donnée métier, pas une fixture locale. Pas de `db:reset`. → **outillage si besoin réel.**
- **Deux dettes, une seule cause : `neon-http` n'a pas de transaction interactive.** La **création
  d'un projet n'est pas atomique** — tout se confronte au domaine **avant** l'écriture (T3.6) —, et
  **`SET LOCAL app.domain_id` n'est pas offert**, donc **le RLS que D38 rattache au SSO est sorti de
  C9** ; l'étanchéité tient par `lib/db/scoped.ts`, ses tests et le point d'entrée, écart consigné.
  → **le jour où le pilote exposera la transaction interactive ; les deux se referment ensemble.**
- **Deux règles de période voisines vivent à deux endroits** — `lastActivityExpression` et
  `projectPeriods` — **et divergent sur un point voulu** : la seconde compte les `planned`.
  → **à reposer si une troisième lecture apparaît.**
- **Trois dettes que seul l'usage tranchera** : les filtres ne survivent pas à un aller-retour par la
  navigation (`docs/06` §9 les veut conservés) · le référentiel des personnes est servi **en entier**
  dans les deux formulaires · la liste transverse n'est pas plafonnée. → **si l'usage le réclame.**

---

## Rappels de contexte

- **Un argument lié à une action serveur n'est pas un secret**, et **le code HTTP ne dit jamais ce
  qui a été écrit.** `bind(null, id)` sort l'identifiant de la saisie, mais Next le sérialise dans un
  champ `$ACTION_…` qu'une soumission réécrit : **une action interroge le droit sur la valeur
  reçue**. Une fonction serveur se frappe en **`text/plain`**, la charge étant le tableau d'arguments
  en Flight ; T6.1 puis T11.2 ont mesuré des refus qui rendent **200** comme les succès. **Seul le
  décompte en base tranche**, et la contre-épreuve — le même appel par qui a le droit — vaut autant.
- **Le panneau s'ouvre côté client depuis TD.2**, son corps restant rendu sur le serveur : une
  fonction `"use server"` rend un `ReactNode`, et l'URL passe par la **même** résolution que le clic.
- **La disponibilité est déduite, et sa base vit à trois endroits.** `0` accompagnement **en cours**
  → disponible, `1`–`2` → partiellement, `3` et plus → indisponible (`lib/availability.ts`). « En
  cours » veut dire **ni archivé, ni terminé** ; `paused` compte encore. Le seuil est écrit une fois,
  **les exclusions sont réécrites par chacune des trois lectures** — et l'arbitrage (d) de C5bis n'a
  plus de gardien en base, `persons_availability_requires_center` étant tombé avec la colonne.
- **Trois tables se suppriment, et elles n'ont pas la même barrière.** `entities` et `persons` sont
  retenues par des clés `restrict` ; **`projects` n'est retenue par rien** — ses dix clés étrangères
  sont `cascade`, son panneau de confirmation est le seul garde-fou. Ajouter une quatrième table à
  `DeletableTable` est un arbitrage humain, jamais une décision de ticket.
- **La période d'un accompagnement se déduit de ses activités** — **cinq lectures joignant la même
  règle**, en sous-requête groupée et non corrélée (31/08).
- **Le domaine vient du jeton, et de lui seul.** `resolveDomainId` prend une identité vérifiée — le
  `hd` de Google, le `tid` d'Entra — et interroge `domain_identities`. « Le premier domaine actif par
  nom » ne survit que dans `setCurrentPerson`, hors production, pour `/dev/session` seul.
- **Le cookie authentifie, donc il se signe** (`lib/auth/cookie.ts`, HMAC-SHA256). **Trois charges
  depuis T11.2**, et chacune **se relit par sa forme** : un principal — union personne / super
  administrateur, ce dernier sans domaine ni ligne `persons` —, un handshake de dix minutes, une
  invitation de quinze. La signature dit qu'une charge n'a pas été récrite, jamais qu'elle est celle
  qu'on attend : **un cookie d'invitation n'ouvre aucune session**, et c'est mesuré. **Le repli du
  stub est mort** ; **`/dev/session` reste**, 404 en production, et exige une session déjà ouverte.
- **Un accès et son rôle ne se séparent jamais** : `persons_role_requires_access` refuse chaque
  moitié écrite seule. **Le dernier responsable ne se rétrograde ni ne se retire**, le décompte
  portant sur les *autres* responsables vivants ; **un intervenant côté entité n'en reçoit jamais**
  (D2).
- **Une écriture au-dessus des domaines se prouve.** `superAdmin` ne porte que des lectures ; les
  deux écrivains vivent derrière `asSuperAdmin(grant)`, et la couche **relit la ligne** — un grant
  forgé ne vaut rien. Et l'écran des domaines **n'accède à aucune donnée d'un domaine** : *« il
  administre des entreprises, il ne les traverse pas »* (`app/domaines/page.tsx:44`) — la frontière
  que C12 ne franchit pas.
- **Les maquettes sont une référence visuelle**, jamais branchées ; **le levier n'est pas le modèle
  mais les quatre disciplines de vérification.**
