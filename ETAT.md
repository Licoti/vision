# ETAT — Vision

Fichier de contexte de session. Mis à jour par Claude en fin de chaque ticket.

**Dernière mise à jour :** 07/09/2026, **T9.6 terminé — et C9 est clos.** Les comptes d'un domaine :
**aucun écran n'écrivait `has_access` ni `domain_role`**, et un domaine créé par T9.4 portait un seul
compte, définitivement. L'e-mail entre au formulaire — facultatif sans accès, obligatoire dès qu'un
accès existe, **la bascule venant de la ligne relue** —, l'accès s'accorde avec son rôle par une clé
d'URL à lui, et se retire muet. **Un quatrième refus est venu d'une mesure** : le rapprochement lit
l'e-mail en `limit 1` **sans ordre**, donc un doublon d'adresse est refusé, archivées comprises.
**Huit neutralisations isolées, dont deux ont d'abord dit autre chose** — un test qui passait garde
retirée, six qui tombaient en cascade —, et le refus de la personne archivée d'`openPerson` **reçoit
son premier témoin depuis T5bis.6**. **Vert de référence : 1 816 tests sur 63 fichiers, `lint` et
`tsc` au vert** (1 771 avant T9.6). **Chantier suivant : C7 reprend** — **ticket suivant : T7.7,
accessibilité et navigation au clavier**, et le POC est complet le jour où C7 se referme.

---

## Avancement

| Chantier | Tickets | État |
|---|---|---|
| C1 — Socle technique | T1.1 → T1.6 | **terminé** |
| C2 — Produits et projets | T2.1 → T2.6 | **terminé** |
| C3 — Activités et roadmap | T3.1 → T3.6 | **terminé** |
| C4 — Ressources et résultats | T4.1 → T4.4 | **terminé** |
| C4bis — Archivage et correction | T4bis.1 → T4bis.6 | **terminé** |
| C5 — Indicateurs et lecture dans le temps | T5.1 → T5.6 | **terminé** |
| TD — Dette technique et couche de présentation | TD.1 → TD.6 | **terminé** |
| C5bis — Équipe | T5bis.1 → T5bis.7 | **terminé** |
| C6 — Liens et journal | T6.1 → T6.7 | **terminé** |
| C7 — Finitions | T7.1 → T7.10 | **à reprendre** — T7.1 → T7.6 livrés, T7.7 → T7.10 en attente |
| C8 — Dette | T8.1 → T8.5 | **terminé** |
| C9 — SSO et administration multi-domaine | T9.1 → T9.6 | **terminé** |
| C10 — les macro-parcours | à découper | reporté hors C8, 04/09/2026 |

---

## Journal des tickets

*(une ligne par **chantier clos**, une par ticket du chantier en cours. Récit : `HISTORIQUE-TICKETS.md` ; pièges et dettes : `JOURNAL-TECHNIQUE.md`.)*

- **C1 à C3 — T1.1 → T3.6, 11-13/08.** Le socle (schéma, couche scopée, contexte de session), puis
  quatre écrans de lecture et deux formulaires, puis les activités : le POC minimal démontrable.
- **C4 et C4bis — T4.1 → T4bis.6, 13-15/08.** La boucle de `docs/05` §2 est fermée.
- **C5 — Indicateurs et temps long — T5.1 → T5.6, 16-17/08.** **Tout a depuis été refait hors
  ticket** (17/08), neuf dérogations au journal.
- **TD — Dette et présentation — TD.1 → TD.6, 17-19/08.** **Hors chantier** : socle des panneaux
  (**−644 lignes nettes**), bouton, garde-fous ESLint (`--max-warnings=0`).
- **C5bis — Équipe — T5bis.1 → T5bis.7, 17-25/08.** Chantier non prévu par `docs/05` §5 : trois
  tables, l'entrée « Équipe », le radar, six gestes.
- **C6 — Liens et journal — T6.1 → T6.7, 26-27/08.** `events` reçoit sa première ligne après six
  chantiers au schéma : cinq verbes, six `target_type`, dix-neuf points d'appel. Puis les liens
  déduits **en SQL**, les déclarés, la vue d'ensemble.
- **C7 — Finitions — T7.1 → T7.6 livrés, 28-30/08, puis en pause.** Le budget, deux filtres,
  l'administration passée d'**un référentiel sur neuf à neuf sur neuf**, la coquille, et les petits
  écrans — **19 formes sur 31 en défaut à 375 px** avant, aucune après.
- **C8 — Dette — T8.1 → T8.5, 04-05/09.** Le premier chantier que `docs/05` §5 n'a pas écrit, tiré
  des seuls points ouverts — et **quatre énoncés de fiche sur cinq y ont été mis en défaut**, du
  domaine de tests résiduel à la redirection redondante. 1 582 → 1 646 tests.
- **C9 — SSO et administration multi-domaine — T9.1 → T9.6, 06-07/09.** Deux tables hors du produit,
  puis le SSO — le domaine cesse d'être *trouvé* pour être *désigné*, **aucun écran du produit ne
  bouge** —, puis le droit dont **la preuve se passe en argument**, l'écran au-dessus des domaines,
  l'amorçage extrait du script, et les comptes. **Trois énoncés de fiche mis en défaut** : neuf
  référentiels qui étaient huit, une condition de matériel qui portait sur un ticket et non sur le
  chantier, un périmètre incomplet de huit fichiers. 1 646 → **1 816 tests sur 63 fichiers**.
- **Hors ticket, 17/08 → 02/09 — vingt-neuf gestes**, tous à la demande humaine, détaillés dans
  `HISTORIQUE-TICKETS.md`. **Cinq portent une migration, `0010` à `0014`.** Le reste est de la
  reprise d'ergonomie, le bouton aligné sur le design system, et le **renommage de « Projets » en
  « Accompagnements »** (02/09), qui **rouvre D35** sur demande humaine explicite.

---

## Points ouverts

*(un point, une destination — sans destination, c'est un point qu'on n'a pas tranché. Un point
refermé part dans `HISTORIQUE-TICKETS.md`, avec la rédaction longue d'avant le 04/09/2026.)*

### a. À trancher — sinon les tickets suivants héritent du problème · gestes détaillés : `ACTIONS-HUMAINES-C9.md`

- **Microsoft est écrit et n'est pas branché.** Entra ID Free demande une carte bancaire, et
  *« only paid customers can create a new Workforce tenant »*. **Mesuré** : la découverte aboutit,
  l'adresse d'autorisation est juste. **Pas mesuré** : l'échange du code, et la substitution
  d'émetteur qu'impose le gabarit `{tenantid}` — **« deux valeurs de plus, jamais une reprise »
  reste une hypothèse.** → **action humaine.**
- **Les secrets Neon n'ont jamais été tournés.** Deux chaînes ont transité en clair le 12/08, hors
  dépôt mais valides. **Reportés quatre fois**, et la raison ne tient plus : **C9 touche aux secrets
  de toute façon.** → **action humaine.**
- **`CLAUDE.md` porte trois énoncés périmés**, et le troisième a empiré : « Statut de projet »
  quand l'écran dit « Statuts d'accompagnement » · l'entrée « Projet », qui tait que le menu affiche
  « Accompagnements » · *« Entra ID le remplacera en C7 »*, quand **c'est Google qui l'a remplacé,
  en C9** — même écart dans `docs/01` §141. Règle 7, et `docs/` figé. **Aucun ne bloque un
  ticket.** → **action humaine.**
- **Ce qu'un macro-parcours relie reste à trancher**, et avec lui **« macro-parcours » contre le
  « Réseau de liens entre produits » de `docs/02` §10**, qui dit la même direction sous un autre nom.
  L'entrée de menu et l'écran vide restent tels quels — ni table, ni objet, ni droit ; le concept
  devra entrer dans `docs/02` §2, figé. → **session de découpage de C10.**

### b. Assignés à un ticket

**C9 est clos ; six points lui survivent.** **Le jeu de démonstration n'a aucune adresse** —
`scripts/seed.ts` n'en écrit pas —, donc **aucun de ses comptes n'est joignable par le SSO** (T9.2) ;
l'écran Équipe sait désormais l'écrire. → **le prochain ticket qui ouvre `scripts/seed.ts`.**
**Rien n'interdit en base deux adresses identiques dans un domaine** : le refus de T9.6 vit dans
l'action, et l'unicité `(domain_id, lower(email))` — archivées comprises, le rapprochement les lisant
— serait une migration. → **le jour où une contrainte s'autorise.**
**Le libellé des deux rôles est écrit à trois endroits**, plus deux mots que `lib/journal.ts` récrit
exprès, étant pur. → **T7.9**, avec les quatre libellés hors de `lib/format.ts`.
**`withoutAnySession()` reste importable depuis `app/`**, rien ne l'en empêchant mécaniquement : la
refermer demande une clause dans `eslint.config.mjs`, ce qui réveille la dette d'`uiLayerSeal` — deux
sujets pour un geste. → **le prochain ticket qui ouvre `eslint.config.mjs`.**
**`persons.identity_provider` n'a aucun écrivain**, et l'inscrire sur une ligne trouvée par e-mail
buterait sur `persons_external_id_requires_directory`. → **le jour où l'import d'annuaire arrive.**
**L'amorçage d'un domaine créé par l'écran n'est pas atomique**, et **aucun geste ne répare un
amorçage partiel** — `npm run db:seed` ne vise que la démonstration, quand le rapprochement de T8.4
rend le geste rejouable sans rien doubler : il ne manque qu'un appelant. → **avec la dette de T3.6.**
**Le RLS a quitté C9** : voir le groupe (c).

**C7 reprend maintenant, et ses huit points vivent dans `tickets-C7.md`** — T7.7 l'accessibilité,
T7.8 les états vides et `/a-propos`, T7.9 les colonnes sans lecteur et les libellés, T7.10
l'ergonomie. **La liste cesse d'être recopiée ici** : elle y a doublé une fiche quatre chantiers
durant.

**Le journal reste incomplet** (T8.3, laissé intact — règle 3) : **quatre familles écrivent sans
trace** — le produit, l'adoption, la compétence portée, et les huit référentiels autres que l'entité
(trente-deux gestes), chacune **fixée par un test qui tombera**. → **prochaine session de découpage.**

**Au prochain ticket qui ouvre le fichier** — **destination qui a déjà échoué une fois**, et T8.4 a dû
recevoir un ticket pour ce seul motif. **`uiLayerSeal` garde une liste de six dossiers, pas une
propriété** : un septième lui échappera (`eslint.config.mjs`) ·
**`listProductsWithCounts` ne rejoue pas la jointure de statut** (`lib/queries/products.ts`) : sa
colonne « Accompagnements » compte `projects.id` sans confronter le statut au domaine — **le
quatrième décompte de la famille**, trouvé par la ligne forgée de T8.2 et laissé intact, son fichier
étant hors du périmètre de la fiche (règle 3) · `listResultToolOptions` sert trois panneaux et son nom
n'en dit qu'un (`lib/queries/activities.ts`) · `sameReferentialLabel` et `sameEntityLabel` disent la
même règle deux fois, et `entities.position` ne se saisit pas (`lib/forms/entity.ts`) · la carte
radio est écrite deux fois, et le formulaire de produit ne dit pas « (obligatoire) » quand celui de
projet le dit (`product-form.tsx`) · le bloc des personnes retenues n'a pas d'état vide
(`picker.tsx`, **les deux appelants**) · un pied de formulaire sur quatre met « Annuler » au rang
secondaire · les props d'icône de `Button` n'ont aucun appelant.

### c. Dettes assumées — le fait et sa destination ; le détail vit dans `JOURNAL-TECHNIQUE.md`

- **Le design system a neuf manques, et aucun n'a été inventé.** **Une carte ne se détache d'aucun
  fond** — quatre positions de 1,04:1 à 1,24:1 quand le seuil d'un composant est 3:1, le plus franc
  des `surface-neutral-*` plafonnant à **2,22:1** ; tous les couples de **texte** passent 4,5:1. S'y
  ajoutent trois élévations, deux gradients, aucun jeton de bordure de contrôle (`form-field.tsx`
  tient à 3,88:1), d'erreur, d'interlettrage, de voile, de séparateur, de mouvement ;
  **`--number-*` s'arrête à 100 px** pour dix-neuf valeurs légitimes. Six substituts mesurés. Et
  **les points d'arrêt sont posés à la main**, hors de la clause 2 de `spacingScaleLock` (T1.6).
  → **design system.**
- **Six points attendent une main humaine, et aucun ne se referme par un ticket.** Le **filtre de la
  roadmap** ne se partage plus par son adresse (21/08) · la **page produit porte deux langages
  d'en-tête**, `northstar-v2` contre `BlockHeader` · **`docs/06` §3 porte deux écarts** du 29/08 —
  l'ordre des blocs et « Accès direct » —, et **si le document suit ou si l'écart tient** reste à
  trancher · les **deux listes de l'accueil** partagent le mot « activité » pour `events` d'un côté
  et `activities` de l'autre · la **page projet ne consomme pas `PageHeader.facts`** (D39) ·
  **« +N » sur `/equipe`** est un décompte que T5bis.2 interdit. → **arbitrage humain.**
- **La liste close de `docs/06` §5 porte trois écarts** (28/08, à la demande) — « Projets liés »
  n'est plus rendu, « Démarrage » ne l'est que sans activité, « Budget » est un rang de la fiche
  d'identité. **Rien n'est supprimé**, tout reste testé. → **assumés**, geste restant en T7.10.
- **Quatre dettes sans échéance.** Sans JavaScript, **les gestes d'une carte de roadmap ne sont plus
  atteignables** — le menu « … » décide de son ouverture, seule exception arbitrée à D30, et les
  quatre actions serveur n'ont aucun repli · **`disabled:opacity-40` est servi sur douze balises qui
  ne peuvent pas être désactivées**, à **2,35:1** composé, WCAG 1.4.3 exemptant les composants
  inactifs · **rien en base ne retient un outil**, ses quatre clés entrantes étant `set null` quand
  les huit autres butent sur un `restrict`, son refus d'archivage vivant dans l'action seule
  (`refusalOfToolUsage`) · **la fixture est incomplète sur les ressources et les résultats** — deux
  résultats sans lien profond, et **six adresses d'outil sur `example.com`**, désormais dans
  `TOOL_BASE_URLS` seul (T9.5) · **le réseau fait tomber la suite** : l'intermittent de T8.1 est
  **`NeonDbError: fetch failed`**, une fois sur dix **sans aucun écart d'assertion**, et le remède
  serait un réessai dans `lib/db/client.ts`. → **sans échéance.**
- **Un référentiel sur neuf reste ouvert au renommage, et c'est structurel.** T8.4 reconnaît une
  ligne par sa `position` — **huit refermés, mesurés** —, mais `tools` n'a pas d'ordinal (**mesuré
  8 → 9**) : refermer demande une migration. **L'orpheline « Audit d'accessibilité » reste** en base
  de développement. `ensureAll` **a désormais ses tests** (T9.5) : le mécanisme vit dans
  `lib/db/reconcile.ts`, que `vitest` atteint. → **le jour où une colonne s'autorise.**
- **Un test est faux par construction, et il l'était avant T9.4** :
  `app/(app)/produits/[id]/actions.test.ts:1490` assère qu'un résumé ne contient pas `"62"` ni
  `"88"`, contre un suffixe de fixture **aléatoire** — tombé sur `44j62a0w` pendant une sonde,
  **environ une fois sur cinquante**. Ce n'est pas l'intermittent réseau, qui ne porte aucun écart
  d'assertion. → **le prochain ticket qui ouvre ce fichier.**
- **La base de développement a dérivé de la fixture, et elle est jetable** — la règle 4 protège la
  donnée métier, pas une fixture locale. Pas de `db:reset`. → **outillage si besoin réel.**
- **Deux dettes, une seule cause : `neon-http` n'a pas de transaction interactive.** La **création
  d'un projet n'est pas atomique** — tout se confronte au domaine **avant** l'écriture (T3.6) —, et
  **`SET LOCAL app.domain_id` n'est pas offert**, donc **le RLS que D38 rattache au SSO est sorti de
  C9** (06/09/2026) : les trois issues coûtent plus qu'elles ne rapportent, et `pg_session_jwt`
  annonce lui-même une API susceptible de changer. L'étanchéité tient par `lib/db/scoped.ts` et ses
  tests, et C9 la durcit au **point d'entrée**. Écart à D38 consigné. → **le jour où le pilote
  exposera la transaction interactive ; les deux se referment ensemble.**
- **Deux règles de période voisines vivent à deux endroits** — `lastActivityExpression` et
  `projectPeriods` — **et divergent sur un point voulu** : la seconde compte les `planned`, la
  première les écarte. L'une dit l'étendue, l'autre la fraîcheur ; deux témoins tiennent l'accord.
  → **à reposer si une troisième lecture de période apparaît.**
- **Trois dettes que seul l'usage tranchera** : les filtres ne survivent pas à un aller-retour par
  la navigation principale (`docs/06` §9 les veut conservés) · le référentiel des personnes reste
  servi **en entier** dans les deux formulaires · la liste transverse n'est pas plafonnée. → **si
  l'usage le réclame.**

---

## Rappels de contexte

- **Un argument lié à une action serveur n'est pas un secret.** `bind(null, project.id)` sort
  l'identifiant de la saisie, mais Next le sérialise dans un champ `$ACTION_…`, **en clair en
  développement**, et une soumission peut le réécrire. **Une action ne tire jamais une autorisation
  de la valeur qu'on lui a liée** : elle interroge le droit sur la valeur **reçue**. **Le droit
  s'éprouve par l'action, jamais par l'écran.**
- **Une fonction serveur se frappe en `text/plain`**, jamais en urlencodé — la charge est le tableau
  d'arguments encodé en Flight. **Le code HTTP ne dit jamais ce qui a été écrit** : T6.1 a mesuré un
  archivage refusé qui rend **200**, comme celui qui réussit. Trois « 200 muets » payés faute
  d'étape témoin. **Seul le décompte en base tranche.**
- **Le panneau s'ouvre côté client depuis TD.2, son corps restant rendu sur le serveur** : une
  fonction `"use server"` renvoie un `ReactNode`, et les URL d'ouverture passent par la **même**
  résolution que le clic.
- **La disponibilité est déduite, et sa base vit à trois endroits.** `0` accompagnement **en cours**
  → disponible, `1`–`2` → partiellement, `3` et plus → indisponible (`lib/availability.ts`). « En
  cours » veut dire **ni archivé, ni terminé** ; `paused` compte encore. Le seuil est écrit une
  fois, **les exclusions sont réécrites par chacune des trois lectures**, sous trois formes.
  **L'arbitrage (d) de C5bis n'a plus de gardien en base** : `persons_availability_requires_center`
  est tombé avec la colonne, et *un intervenant côté entité ne porte pas de disponibilité* n'est plus
  tenu que par trois `kind === "center"`.
- **Trois tables se suppriment, et elles n'ont pas la même barrière.** `entities` et `persons` sont
  retenues par des clés `restrict` ; **`projects` n'est retenue par rien** — ses dix clés étrangères
  sont `cascade`, son panneau de confirmation est le seul garde-fou. Ajouter une quatrième table à
  `DeletableTable` est un arbitrage humain, jamais une décision de ticket.
- **La période d'un accompagnement se déduit de ses activités** depuis le 31/08, **cinq lectures
  joignant la même règle** en sous-requête groupée et non corrélée.
- **Le domaine vient du jeton, et de lui seul.** `resolveDomainId` prend une identité vérifiée —
  le `hd` de Google, le `tid` d'Entra — et interroge `domain_identities`. « Le premier domaine actif
  par nom » ne survit que dans `setCurrentPerson`, hors production, pour `/dev/session` seul.
- **Le cookie authentifie, donc il se signe** (`lib/auth/cookie.ts`, HMAC-SHA256). Il porte une
  **union** : une personne porte `{personId, domainId}`, un super administrateur son seul
  identifiant — il n'a ni domaine ni ligne `persons`, et `getSession()` rend donc `null` pour lui.
  **Le repli du stub est mort** : une identité absente ou inéligible est refusée, jamais remplacée,
  et `requireSession` redirige vers `/auth/acces`. **`/dev/session` reste**, 404 en production :
  une adresse personnelle ne porte ni `hd` ni `tid`, donc le chemin d'un membre de domaine ne se
  parcourt pas au navigateur.
- **Un accès et son rôle ne se séparent jamais.** `persons_role_requires_access` refuse *accès sans
  rôle* et *rôle sans accès* : les deux colonnes s'écrivent dans la même instruction, et la base
  refuse chaque moitié écrite seule — mesuré, pas supposé. **Le dernier responsable d'un domaine ne
  se rétrograde ni ne se retire** : le décompte porte sur les *autres* responsables vivants, et comme
  qui exerce le geste en est un, il ne vaut zéro que sur soi-même. **Un intervenant côté entité n'en
  reçoit jamais** (`docs/05` §4, D2).
- **Une écriture au-dessus des domaines se prouve.** `superAdmin` ne porte que des lectures ; les
  deux écrivains vivent derrière `asSuperAdmin(grant)`, et la couche **relit la ligne** — un grant
  forgé ne vaut rien. `requireSuperAdmin()` depuis une session, `withoutAnySession(motif)` hors.
- **Les maquettes `docs/design/maquettes/` sont une référence visuelle**, jamais branchées, et **le
  levier n'est pas le modèle mais les quatre disciplines de vérification.**
