# ETAT — Vision

Fichier de contexte de session. Mis à jour par Claude en fin de chaque ticket.

**Dernière mise à jour :** 09/09/2026. **T11.6 terminé — le contrôle de sécurité de C9 et C11 n'a
trouvé aucune faille**, trois trous de *couverture* (jamais de faille) comblés par des tests
permanents, cinq constats de durcissement consignés. Le rapport est `SECURITE-C9-C11.md` (document
de travail). **Frappe hybride** : la matrice des droits et l'étanchéité par le harnais du dépôt
(cookie réellement scellé, décompte en base, étape témoin), plus des frappes HTTP réelles au `curl`.
**Un énoncé de fiche corrigé** : `next/image` n'est employé **nulle part** — trois commentaires, pas
trois usages —, et l'API AVIF, servie, ne peut optimiser aucun fichier (URL distant refusé, pas de
`public/`). **Deux croisements de charge ne s'ajoutent pas** : sûrs, mais incapables d'échouer à la
mise en défaut. **Aucune correction, aucun écart de périmètre** — l'exception critique ne s'est pas
présentée. **Vert : 1 962 tests sur 69 fichiers** (1 956 sur 68 avant). **C11 refermé une seconde
fois. Suivant : C7 — T7.7 → T7.10, qui ferme le POC.**

**09/09/2026 — C11 a rouvert pour T11.6, le contrôle, puis s'est refermé.** Le ticket a éprouvé
**ensemble**, comme une surface d'attaque, ce que C9 et C11 avaient écrit ticket par ticket. Sept
familles frappées, chacune mise en défaut avant d'être crue. Le socle d'étanchéité
(`lib/db/scoped.ts`) et le chemin d'authentification (`lib/auth/`) tiennent leurs promesses, mesurés.

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
| C7 — Finitions | T7.1 → T7.10 | **suivant** — T7.1 → T7.6 livrés, T7.7 → T7.10 ferment le POC |
| C8 — Dette | T8.1 → T8.5 | **terminé** |
| C9 — SSO et administration multi-domaine | T9.1 → T9.6 | **terminé** |
| C10 — les macro-parcours | à découper | reporté hors C8, 04/09/2026 |
| C11 — Le parcours d'entrée | T11.1 → T11.6 | **terminé** (rouvert puis refermé le 09/09) |

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
  le SSO — le domaine cesse d'être *trouvé* pour être *désigné*, **aucun écran du produit ne bouge**
  —, le droit dont **la preuve se passe en argument**, l'écran au-dessus des domaines, l'amorçage
  extrait du script, et les comptes. **Trois énoncés de fiche mis en défaut.** 1 646 → **1 816**.
- **Hors ticket, 08/09 — le fournisseur non raccordé.** Trouvé par une question : `?fournisseur=`
  `microsoft` rendait **500**, l'aller n'attrapant pas la levée que le retour attrape. **→ 1 824.**
- **C11 — Le parcours d'entrée — T11.1 → T11.6, 08-09/09.** Les trois maillons qui manquaient au
  geste de C9 — l'invitation (sans courriel puis avec, en `fetch` sans dépendance), l'amorçage d'un
  domaine en un geste (quatre tables, l'administrateur qui naît sans accès), la correction des
  informations de son domaine (`updateOwnDomain`, cible jamais un argument) — puis, C11 rouvert le
  09/09, **le contrôle de sécurité T11.6** : sept familles éprouvées ensemble, **aucune faille**,
  trois trous de couverture comblés, un énoncé de fiche corrigé. Détail : `HISTORIQUE-TICKETS.md` ;
  contrôle : `SECURITE-C9-C11.md`. 1 816 → **1 962 tests, 69 fichiers**.
- **Hors ticket, 17/08 → 02/09 — vingt-neuf gestes**, tous à la demande humaine, détaillés dans
  `HISTORIQUE-TICKETS.md`. **Cinq portent une migration, `0010` à `0014`** ; le reste est de
  l'ergonomie, plus le **renommage de « Projets » en « Accompagnements »**, qui **rouvre D35**.

---

## Points ouverts

*(un point, une destination — sans destination, c'est un point qu'on n'a pas tranché. Un point
refermé part dans `HISTORIQUE-TICKETS.md`, avec la rédaction longue d'avant le 04/09/2026.)*

### a. À trancher — sinon les tickets suivants héritent du problème · gestes détaillés : `ACTIONS-HUMAINES-C9.md`

- **Microsoft est écrit et n'est pas branché** — Entra ID Free demande une carte bancaire, et
  `ENTRA_CLIENT_ID`/`_SECRET` manquent de `.env.local`. **Mesuré** : la découverte aboutit, l'adresse
  d'autorisation est juste. **Pas mesuré** : l'échange du code, et la substitution du gabarit
  `{tenantid}`. Son bouton ne rend plus 500 (08/09), et la page d'invitation ne le propose pas
  davantage (T11.2). → **action humaine.**
- **Les secrets Neon n'ont jamais été tournés.** Deux chaînes ont transité en clair le 12/08, hors
  dépôt mais valides. **Reportés cinq fois, et C9 est passé** — la raison qui les reportait n'existe
  plus. → **action humaine, et c'est la plus vieille de la liste.**
- **Rien n'est prêt côté production.** `AUTH_URL` vaut `localhost:3000`, l'URI de rappel de
  production n'est enregistrée nulle part, et les trois secrets ne sont pas dans Netlify. **Le SSO ne
  peut pas fonctionner en ligne avant ces quatre gestes** (`ACTIONS-HUMAINES-C9.md` §4).
  → **action humaine, avant tout déploiement.**
- **`CLAUDE.md` porte trois énoncés périmés** : « Statut de projet » contre « Statuts
  d'accompagnement » · l'entrée « Projet » contre « Accompagnements » · *« Entra ID le remplacera en
  C7 »*, quand c'est Google, en C9 (même écart `docs/01` §141). → **action humaine.**
- **L'envoi de courriel est écrit et n'est pas branché** — ni `RESEND_API_KEY` ni `MAIL_FROM`, et
  **aucune requête réelle n'a jamais été émise**. Rien ne casse, mais la moitié du parcours reste à
  la main. Gestes : `ACTIONS-HUMAINES-C11.md`. → **action humaine.**
- **Ce qu'un macro-parcours relie reste à trancher**, et avec lui **« macro-parcours » contre le
  « Réseau de liens entre produits » de `docs/02` §10**, même direction sous un autre nom. L'entrée
  de menu et l'écran vide restent tels quels — ni table, ni objet, ni droit ; le concept devra entrer
  dans `docs/02` §2, figé. → **session de découpage de C10.**

### b. Assignés à un ticket

**C9 est clos ; six points lui survivent.** **Le jeu de démonstration n'a ni adresse ni identité
vérifiée** — cela ne l'empêche pas d'être connectable, cela l'empêche d'être **cohérent** : le `hd`
vient de Google, jamais de nous, et seul un vrai domaine Workspace ouvre le chemin d'un membre.
→ **le prochain ticket qui ouvre `scripts/seed.ts`, pour la fixture et non pour le SSO.**
**Le décompte de jumelles de `grantPersonAccess` est inatteignable** depuis T11.1 : il lit
`lower(email)`, l'expression même de l'index. Filet conservé le 08/09, **et aucun test ne peut plus
l'exercer**. → **le jour où l'on ôte un filet.**
**Le libellé des deux rôles est écrit à trois endroits**, plus deux mots que `lib/journal.ts` récrit
exprès, étant pur. → **T7.9**, avec les quatre libellés hors de `lib/format.ts`.
**`withoutAnySession()` reste importable depuis `app/`**, rien ne l'en empêchant mécaniquement : la
refermer demande une clause dans `eslint.config.mjs`, ce qui réveille la dette d'`uiLayerSeal` — deux
sujets pour un geste. → **le prochain ticket qui ouvre `eslint.config.mjs`.**
**`persons.identity_provider` n'a aucun écrivain**, et l'inscrire sur une ligne trouvée par e-mail
buterait sur `persons_external_id_requires_directory`. → **le jour où l'import d'annuaire arrive.**
**L'amorçage d'un domaine n'est pas atomique, et il écrit désormais quatre tables** (T11.4) — une
panne laisse une entreprise sans identité, sans compte ou sans invitation, et **aucun geste ne répare
un amorçage partiel** : le rapprochement de T8.4 le rendrait rejouable sans rien doubler, il ne manque
qu'un appelant. → **avec la dette de T3.6.**
**Le RLS a quitté C9** : voir le groupe (c).

**C11 est refermé (T11.6 livré le 09/09) ; C7 ferme le POC** (T7.7 → T7.10).

**Deux points de T11.2, dont un récrit par sa mesure.** **Sans JavaScript, le lien d'invitation est
perdu** — mesuré en T11.3, harnais éprouvé par étape témoin : `resolveTeamDrawer` ferme le panneau
dès qu'une invitation vivante existe, donc sur celle qu'il vient de créer, et le clair n'existe nulle
part ailleurs. L'invitation, elle, est écrite. **Seconde exception à D30**, non arbitrée.
→ **arbitrage humain, puis le ticket qui rouvre `lib/drawers/team.tsx`.**

**Deux points de T11.4.** **Sans JavaScript, aucun geste de la ligne d'entreprise n'est atteignable**
— mesuré : `ActionMenu` n'est pas dans le HTML servi, ce qui vaut depuis T9.4 pour les deux
rétablissements ; **la révocation d'amorçage en aggrave la portée**, étant le seul chemin qui rouvre
une entreprise close. **Troisième exception à D30**, non arbitrée. → **arbitrage humain, puis le
ticket qui rouvre `lib/drawers/domains.tsx`.**
**Rien en base ne double le refus « une invitation attend déjà »** — `invitations_pending_unique`
porte sur `(domain_id, person_id)`, et une seconde désignation vise une autre personne : le contrôle
applicatif est le seul gardien, là où celui d'`invitePerson` en a deux. → **à relire avant de
« simplifier » `designateDomainManager`, jamais après.**
**`redeemInvitation` ne juge pas l'état du domaine, et c'est ce qui rend l'arbitrage (4) mesurable** :
un test le fixe, et il tombera le jour où quelqu'un « sécurisera » le module — **un seul témoin isole
l'ordre des six règles**, le domaine suspendu. → **à relire avant de corriger, jamais après.**

**Le journal reste incomplet** (T8.3, laissé intact — règle 3) : **six familles écrivent sans
trace** — le produit, l'adoption, la compétence portée, les huit référentiels autres que l'entité
(trente-deux gestes), **les trois gestes de l'invitation** (T11.2, arbitrage assumé : l'acceptation
n'a ni session ni acteur), et **la correction des informations du domaine** (T11.5, arbitrage : aucun
`event_target_type` ne dit « domaine », et le poser sur `person` mentirait). Chacune est **fixée par
un test qui tombera** — **et la fiche de T11.5 annonçait un cinquième nom là où c'est le sixième**,
son décompte datant de son écriture. → **prochaine session de découpage.**

**Au prochain ticket qui ouvre le fichier** — **destination qui a déjà échoué une fois**, T8.4 ayant
dû recevoir un ticket pour ce seul motif. **`uiLayerSeal` garde une liste de six dossiers, pas une
propriété** : un septième lui échappera · **`listProductsWithCounts` ne rejoue pas la jointure de
statut** (`lib/queries/products.ts`) — **le quatrième décompte de la famille**, trouvé par la ligne
forgée de T8.2, son fichier étant hors périmètre (règle 3) · `listResultToolOptions` sert trois
panneaux et son nom n'en dit qu'un · `sameReferentialLabel` et `sameEntityLabel` disent la même règle
deux fois, et `entities.position` ne se saisit pas · la carte radio est écrite deux fois, et le
formulaire de produit ne dit pas « (obligatoire) » quand celui de projet le dit · le bloc des
personnes retenues n'a pas d'état vide (`picker.tsx`, **les deux appelants**) · un pied de formulaire
sur quatre met « Annuler » au rang secondaire · les props d'icône de `Button` n'ont aucun appelant.

### c. Dettes assumées — le fait et sa destination ; le détail vit dans `JOURNAL-TECHNIQUE.md`

- **Cinq constats de durcissement du contrôle T11.6 (09/09), aucun critique — le détail dans
  `SECURITE-C9-C11.md`.** Le dépôt ne sert **aucun en-tête de sécurité** (ni CSP, ni HSTS, ni
  `X-Frame-Options` — la page publique d'invitation est cadrable en iframe) et n'a **aucun
  `middleware.ts`** ; `X-Powered-By: Next.js` fuit la pile → **durcissement du transport.**
  `next@16.3.0` porte **deux avis critiques** (RCE Windows — hébergement Linux, sans objet ; RCE
  AVIF — API servie mais **inexploitable**, aucun `remotePatterns`, pas de `public/`) et `sharp` un
  avis haut, corrigés en 16.3.4 → **une montée de version, hors revue, avec sa propre mesure.**
- **Le design system a neuf manques, et aucun n'a été inventé.** **Une carte ne se détache d'aucun
  fond** — **cinq** positions de 1,04:1 à 1,27:1 depuis le bloc « Ce domaine » (T11.5), quand le seuil
  d'un composant est 3:1 ; tous les couples de **texte** passent 4,5:1. S'y ajoutent trois élévations, deux gradients, aucun jeton de
  bordure de contrôle, d'erreur, d'interlettrage, de voile, de séparateur, de mouvement, et
  **`--number-*` s'arrête à 100 px**. Six substituts mesurés ; les points d'arrêt restent posés à la
  main, hors de `spacingScaleLock` (T1.6). → **design system.**
- **Six points attendent une main humaine, et aucun ne se referme par un ticket.** Le **filtre de la
  roadmap** ne se partage plus par son adresse (21/08) · la **page produit porte deux langages
  d'en-tête** · **`docs/06` §3 porte deux écarts** du 29/08, et *si le document suit ou si l'écart
  tient* reste à trancher · les **deux listes de l'accueil** partagent le mot « activité » pour deux
  tables · la **page projet ne consomme pas `PageHeader.facts`** (D39) · **« +N » sur `/equipe`** est
  un décompte que T5bis.2 interdit. → **arbitrage humain.**
- **La liste close de `docs/06` §5 porte trois écarts** (28/08, à la demande) — « Projets liés »
  n'est plus rendu, « Démarrage » ne l'est que sans activité, « Budget » est un rang de la fiche
  d'identité. Rien n'est supprimé, tout reste testé. → **assumés**, geste en T7.10.
- **Cinq dettes sans échéance.** Sans JavaScript, **les gestes d'une carte de roadmap ne sont plus
  atteignables** — seule exception arbitrée à D30 · **`disabled:opacity-40` est servi sur douze
  balises qui ne peuvent pas être désactivées**, à 2,35:1 composé · **rien en base ne retient un
  outil**, ses quatre clés entrantes étant `set null` · **la fixture est incomplète sur les
  ressources et les résultats** · **le réseau fait tomber la suite** : l'intermittent de T8.1 est
  **`NeonDbError: fetch failed`**, une fois sur dix **sans écart d'assertion**. → **sans échéance.**
- **Un référentiel sur neuf reste ouvert au renommage, et c'est structurel.** T8.4 reconnaît une
  ligne par sa `position` — **huit refermés, mesurés** —, mais `tools` n'a pas d'ordinal : refermer
  demande une migration. L'orpheline « Audit d'accessibilité » reste en base de développement, et
  `ensureAll` a ses tests depuis T9.5. → **le jour où une colonne s'autorise.**
- **Un test est faux par construction, et il l'était avant T9.4** :
  `app/(app)/produits/[id]/actions.test.ts:1490` assère qu'un résumé ne contient pas `"62"` ni
  `"88"`, contre un suffixe de fixture **aléatoire** — **une fois sur cinquante environ**, et ce
  n'est pas l'intermittent réseau. → **le prochain ticket qui ouvre ce fichier.**
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
  `projectPeriods` — **et divergent sur un point voulu** : la seconde compte les `planned`.
  → **à reposer si une troisième lecture apparaît.**
- **Trois dettes que seul l'usage tranchera** : les filtres ne survivent pas à un aller-retour par
  la navigation (`docs/06` §9 les veut conservés) · le référentiel des personnes est servi **en
  entier** dans les deux formulaires · la liste transverse n'est pas plafonnée. → **si l'usage le
  réclame.**

---

## Rappels de contexte

- **Un argument lié à une action serveur n'est pas un secret.** `bind(null, project.id)` sort
  l'identifiant de la saisie, mais Next le sérialise dans un champ `$ACTION_…` qu'une soumission peut
  réécrire. **Une action interroge le droit sur la valeur reçue**, jamais sur celle qu'on lui a liée.
- **Une fonction serveur se frappe en `text/plain`**, jamais en urlencodé — la charge est le tableau
  d'arguments encodé en Flight. **Le code HTTP ne dit jamais ce qui a été écrit** : T6.1, puis T11.2,
  ont mesuré des refus qui rendent **200** comme les succès. **Seul le décompte en base tranche**, et
  la contre-épreuve — le même appel par qui a le droit — vaut autant que la mesure.
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
- **La période d'un accompagnement se déduit de ses activités** (31/08), **cinq lectures joignant la
  même règle** en sous-requête groupée et non corrélée.
- **Le domaine vient du jeton, et de lui seul.** `resolveDomainId` prend une identité vérifiée —
  le `hd` de Google, le `tid` d'Entra — et interroge `domain_identities`. « Le premier domaine actif
  par nom » ne survit que dans `setCurrentPerson`, hors production, pour `/dev/session` seul.
- **Le cookie authentifie, donc il se signe** (`lib/auth/cookie.ts`, HMAC-SHA256). **Trois charges
  depuis T11.2**, et chacune **se relit par sa forme** : un principal — union personne / super
  administrateur, ce dernier sans domaine ni ligne `persons` —, un handshake de dix minutes, une
  invitation de quinze. La signature dit qu'une charge n'a pas été récrite, jamais qu'elle est celle
  qu'on attend : **un cookie d'invitation n'ouvre aucune session**, et c'est mesuré. **Le repli du
  stub est mort** : une identité inéligible est refusée, jamais remplacée. **`/dev/session` reste**,
  404 en production, et exige désormais une session déjà ouverte.
- **Un accès et son rôle ne se séparent jamais** : `persons_role_requires_access` refuse chaque
  moitié écrite seule — mesuré. **Le dernier responsable ne se rétrograde ni ne se retire** : le
  décompte porte sur les *autres* responsables vivants, et comme qui exerce le geste en est un, il ne
  vaut zéro que sur soi-même. **Un intervenant côté entité n'en reçoit jamais** (D2).
- **Une écriture au-dessus des domaines se prouve.** `superAdmin` ne porte que des lectures ; les
  deux écrivains vivent derrière `asSuperAdmin(grant)`, et la couche **relit la ligne** — un grant
  forgé ne vaut rien. `requireSuperAdmin()` depuis une session, `withoutAnySession(motif)` hors.
- **Les maquettes `docs/design/maquettes/` sont une référence visuelle**, jamais branchées ; **le
  levier n'est pas le modèle mais les quatre disciplines de vérification.**
