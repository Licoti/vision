# ETAT — Vision

Fichier de contexte de session. Mis à jour par Claude en fin de chaque ticket.

**Dernière mise à jour :** 06/09/2026, **session de découpage de C9** — six arbitrages rendus, dont
deux délégués, et `tickets-C9.md` écrit : T9.1 → T9.5. **La condition de matériel descend du chantier
au ticket** — les inscriptions fournissent des valeurs, pas une forme, et ne bloquent plus que la
vérification de T9.2.
**Chantier en cours :** **C9 — SSO et administration multi-domaine** (`tickets-C9.md`), découpé et
non ouvert. **C7 garde ses quatre tickets** T7.7 → T7.10 (`tickets-C7.md`) et passe après C9 —
second écart à `docs/05` §6. **Vert de référence, relevé par T8.1 et inchangé depuis T8.3 : 1 646
tests sur 55 fichiers, `lint` et `tsc` au vert** — chaque ticket y compare le sien, jamais à un
souvenir. **Ticket suivant : T9.1 — le schéma de l'identité**, qui ne dépend d'aucun matériel.

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
| C7 — Finitions | T7.1 → T7.10 | **en pause** — T7.1 → T7.6 livrés, T7.7 → T7.10 après C9 |
| C8 — Dette | T8.1 → T8.5 | **terminé** |
| C9 — SSO et administration multi-domaine | T9.1 → T9.6 | **découpé** — T9.4 attend une levée de `docs/05` §4 ; T9.6 ajouté le 06/09 |
| C10 — les macro-parcours | à découper | reporté hors C8, 04/09/2026 |

---

## Journal des tickets

*(une ligne par **chantier clos**, une par ticket du chantier en cours. Récit : `HISTORIQUE-TICKETS.md` ; pièges et dettes : `JOURNAL-TECHNIQUE.md`.)*

- **C1 — Socle technique — T1.1 → T1.6, 11-12/08.** Schéma, couche scopée, contexte de session,
  référentiels, coquille. Rien de visible, tout le reste en dépend.
- **C2 — Produits et projets — T2.1 → T2.6, 12-13/08.** Quatre écrans de lecture, deux formulaires.
- **C3 — Activités et roadmap — T3.1 → T3.6, 13/08.** Clôt le POC minimal démontrable.
- **C4 et C4bis — T4.1 → T4.4 puis T4bis.1 → T4bis.6, 13-15/08.** La boucle de `docs/05` §2 est
  fermée ; un seul `canWrite` fait tomber sept gestes.
- **C5 — Indicateurs et temps long — T5.1 → T5.6, 16-17/08.** **Tout a depuis été refait hors
  ticket** (17/08), neuf dérogations au journal technique.
- **TD — Dette et couche de présentation — TD.1 → TD.6, 17-19/08.** **Hors chantier** : socle des
  panneaux (**−644 lignes nettes**), bouton, garde-fous ESLint (`--max-warnings=0`).
- **C5bis — Équipe — T5bis.1 → T5bis.7, 17-25/08.** Chantier non prévu par `docs/05` §5, intercalé
  sans décaler C6 ni C7 : trois tables, l'entrée « Équipe », le radar, six gestes.
- **C6 — Liens et journal — T6.1 → T6.7, 26-27/08.** `events` reçoit sa première ligne après six
  chantiers au schéma : cinq verbes, six `target_type`, dix-neuf points d'appel. Puis le bloc
  « Journal », les liens déduits **en SQL**, les déclarés, la vue d'ensemble entière.
- **C7 — Finitions — T7.1 → T7.6 livrés, 28-30/08, puis en pause.** Le budget, les deux filtres
  manquants, l'administration passée d'**un référentiel sur neuf à neuf sur neuf**, la coquille et
  ses ancres, et les petits écrans — **19 formes sur 31 en défaut à 375 px** avant, aucune après.
- **C8 — Dette — T8.1 → T8.5, 04-05/09.** Le premier chantier que `docs/05` §5 n'a pas écrit, tiré
  des seuls points ouverts — et **quatre énoncés de fiche sur cinq y ont été mis en défaut**, du
  domaine de tests résiduel à la redirection redondante. 1 582 → 1 646 tests.
- **Hors ticket, 17/08 → 02/09 — vingt-neuf gestes**, tous à la demande humaine, tous détaillés dans
  `HISTORIQUE-TICKETS.md` et `JOURNAL-TECHNIQUE.md`. **Cinq portent une migration, `0010` à `0014`** :
  disponibilité déduite, cible unique portée par le produit, période déduite des activités,
  dispositif de mesure, repères de contexte. Le reste est de la reprise d'ergonomie, **le bouton
  aligné sur le design system de référence** (01-02/09), et le **renommage de « Projets » en
  « Accompagnements »** (02/09), qui **rouvre D35** sur demande humaine explicite.

---

## Points ouverts

*(un point, une destination — sans destination, c'est un point qu'on n'a pas tranché. Un point
refermé part dans `HISTORIQUE-TICKETS.md`, avec la rédaction longue d'avant le 04/09/2026.)*

### a. À trancher — sinon les tickets suivants héritent du problème

- **T9.2 s'ouvre avec quatre valeurs, six pour les deux fournisseurs** — et l'ancienne liste de
  quatre était fausse deux fois : un tenant **en trop**, un `AUTH_SECRET` **en moins**. **Google
  d'abord** : Entra ID Free demande une **carte bancaire** de vérification, non débitée, et un tenant
  gratuit n'en crée pas d'autre ; Google ne demande rien pour des portées non sensibles. Tout est
  nommé en tête de `tickets-C9.md`. → **action humaine, puis T9.2.**
- **T9.4 attend la levée de l'exclusion de `docs/05` §4** — *« interface d'administration
  multi-domaine : un seul domaine au POC »* — et de §3, *« domaine unique … amorçage par script »*.
  `docs/` est figé : ces lignes se récrivent, ou l'écart s'autorise et se consigne. → **action
  humaine, puis T9.4.**
- **Les secrets Neon n'ont jamais été tournés.** Deux chaînes ont transité en clair le 12/08. Hors
  dépôt (`.env.local` seul), mais valides. **Reportés quatre fois** — découpages de C6, C7, C8 et
  C9 —, mais la raison ne tient plus : **C9 touche aux secrets de toute façon.** → **action humaine.**
- **`CLAUDE.md` porte trois énoncés périmés** : « Statut de projet » quand l'écran dit « Statuts
  d'accompagnement » · l'entrée « Projet », qui tait que le menu affiche « Accompagnements » ·
  *« Entra ID le remplacera en C7 »*, quand C9 en porte **deux**, Google et Microsoft — même écart
  dans `docs/01` §141, *« environnement Microsoft »*. La règle 7 réserve ce fichier à l'humain, et
  `docs/` est figé. **Aucun des trois ne bloque un ticket.** → **action humaine.**
- **Ce qu'un macro-parcours relie reste à trancher**, et avec lui **« macro-parcours » contre le
  « Réseau de liens entre produits » de `docs/02` §10**, qui dit la même direction sous un autre nom.
  L'entrée de menu et l'écran vide restent tels quels — ni table, ni objet, ni droit. Le concept
  devra entrer dans `docs/02` §2, et `docs/` est figé. → **session de découpage de C10.**

### b. Assignés à un ticket

**C9 — chaque point a désormais son ticket, et sa fiche le décrit en entier** (`tickets-C9.md`).
**T9.1** le schéma de l'identité — `super_admins` hors domaine, `domain_identities`, migration
`0016` · **T9.2** le SSO, deux fournisseurs par `oauth4webapi`, six règles d'entrée, et **le couplage
que T8.1 n'a pas pu lever**, `resolveDomainId` cessant de rendre le premier domaine actif *par nom* ·
**T9.3** le droit qui manque aux trois fonctions de `superAdmin` · **T9.4** l'écran au-dessus des
domaines · **T9.5** l'amorçage d'un domaine neuf, aujourd'hui tenu par `scripts/seed.ts` · **T9.6**
les comptes d'un domaine — **aucun écran n'écrit `has_access`, `domain_role` ni même `email`**,
trouvé le 06/09 en confrontant une question au code et non à la fiche.
**`lib/auth/session.ts:10` promet encore que « C7 change de source d'identité »** — cinquième énoncé
de la famille, corrigé par T9.2. **Le RLS a quitté C9** : voir le groupe (c).

**C7 passe après C9 : ses huit points gardent leur ticket, et leur fiche les décrit en entier.**
**T7.7** — le **clic** de `/equipe` et le **mode enrichi de `Picker`** n'ont jamais été parcourus au
navigateur · la cible de clic d'un repère fait **24 px**, sous les 44 px d'usage tactile · la frise
du produit défile dans son conteneur, **et ce conteneur n'est pas atteignable au clavier** · la
coquille reste **focalisable derrière le voile** sans JavaScript.
**T7.8** — les **quatre états vides de T7.4 n'ont pas été vus rendus** · le contenu rédigé
d'`/a-propos` reste à écrire, sans lecture en base (D36).
**T7.9** — `products.kind` (D10) et `persons.kind` ne sont lus par aucun écran ·
`project_indicators.note` n'a ni écrivain ni lecteur · passer une personne du centre en intervenant
côté entité **lui laisse ses compétences**, illisibles en écriture · **quatre libellés vivent hors
de `lib/format.ts`**, dont `PERSON_KIND_LABEL`, qui porte **un vocabulaire à trancher**.
**T7.10** — une piste ne mène pas à l'activité qu'elle suggère, **et c'est aussi le point d'entrée
annoncé du bloc « Démarrage »** qu'un point distinct destinait à C8 : le recouvrement a été trouvé
au découpage, il n'y a qu'un geste · `default_tool_id` ne présélectionne rien · le groupe « Annulé »
n'est plus replié par défaut (`docs/03` §6) · rétablir un accompagnement sous un produit archivé le
laisse invisible.

**Le journal reste incomplet : la liste des onze était périmée** (T8.3, laissé intact — règle 3).
**Quatre familles écrivent sans trace** — le **produit**, dans le fichier même où sa vision en laisse
une · l'**adoption**, dont l'absence n'était écrite nulle part et que l'en-tête
d'`accompagnements/[id]/` niait · la **compétence portée** · les **huit référentiels** autres que
l'entité, trente-deux gestes. Chacune est **fixée par un test qui tombera**. L'énuméré et
`lib/journal.ts` sont prêts ; il manque un ticket. → **prochaine session de découpage.**

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

- **Une carte ne se détache d'aucun fond.** Quatre positions de 1,04:1 à 1,24:1 quand le seuil d'un
  composant est 3:1, et le plus franc des `surface-neutral-*` plafonne à **2,22:1** ; tous les
  couples de **texte** passent 4,5:1. Depuis le 29/08 le manque coûte **un état d'interaction** et
  non plus un contour. **C8 ne le referme pas : aucun neuvième jeton ne s'invente.** → **design system.**
- **Le design system a huit manques, et aucun n'a été inventé** — trois élévations, deux gradients,
  aucun jeton de bordure de contrôle (`form-field.tsx` tient à 3,88:1), d'erreur, d'interlettrage,
  de voile, de séparateur, de mouvement ; **`--number-*` s'arrête à 100 px** pour dix-neuf valeurs
  légitimes. Six substituts mesurés. Et **les points d'arrêt sont posés à la main, écran par écran**,
  hors de la clause 2 de `spacingScaleLock` (T1.6). → **design system.**
- **Six points attendent une main humaine, et aucun ne se referme par un ticket.** Le **filtre de la
  roadmap** ne se partage plus par son adresse (repassé côté client le 21/08 : il ne se copie plus,
  ne survit plus au rechargement, n'existe plus sans JavaScript) · la **page produit porte deux
  langages d'en-tête**, `northstar-v2` contre `BlockHeader` · **`docs/06` §3 porte deux écarts** du
  29/08 — l'ordre des blocs, dit non neutre, et « Accès direct » qui n'est plus rendu —, et reste à
  trancher **si le document suit ou si l'écart tient**, `docs/` étant figé · les **deux listes de
  l'écran d'accueil** se rendent de la même façon et leurs titres partagent le mot « activité » pour
  `events` d'un côté et `activities` de l'autre · la **page projet ne consomme pas
  `PageHeader.facts`**, le seul fait qu'on y écrirait étant un décompte interdit par D39 · **« +N »
  sur `/equipe`** est un décompte de compétences que T5bis.2 interdit. → **arbitrage humain.**
- **La liste close de `docs/06` §5 porte trois écarts** (28/08, à la demande) — « Projets liés »
  n'est plus rendu, « Démarrage » ne l'est que sans activité, « Budget » est un rang de la fiche
  d'identité. **Rien n'est supprimé**, tout reste testé. → **assumés** ; le geste restant est en
  T7.10.
- **Quatre dettes sans échéance.** Sans JavaScript, **les gestes d'une carte de roadmap ne sont plus
  atteignables** — le menu « … » décide de son ouverture, seule exception arbitrée à D30, et les
  quatre actions serveur n'ont aucun repli · **`disabled:opacity-40` est servi sur douze balises qui
  ne peuvent pas être désactivées**, à **2,35:1** composé sur la page, WCAG 1.4.3 exemptant les
  composants inactifs · **rien en base ne retient un outil**, ses quatre clés entrantes étant `set
  null` quand les huit autres butent sur un `restrict`, son refus d'archivage vivant dans l'action
  seule (`refusalOfToolUsage`) · **la fixture est incomplète sur les ressources et les résultats** —
  deux résultats sans lien profond, `tools.base_url` sur trois `example.com` · **le réseau fait
  tomber la suite** : l'intermittent de T8.1 est **`NeonDbError: fetch failed`**, reproduit une fois
  sur dix **sans aucun écart d'assertion**, et sur un test *voisin* de celui que le point nommait —
  il n'appartient à aucun test, et le remède serait un réessai dans `lib/db/client.ts`.
  → **sans échéance.**
- **Un référentiel sur neuf reste ouvert au renommage, et c'est structurel.** T8.4 reconnaît une
  ligne par sa `position` — **huit refermés, mesurés** —, mais `tools` n'a pas d'ordinal : **mesuré
  8 → 9**, comme les sept tables hors référentiel. Refermer demande une colonne, donc une migration.
  **L'orpheline « Audit d'accessibilité » reste** — le rapprochement corrige, il n'efface pas — et
  **`ensureAll` n'a aucun test**. → **le jour où une colonne s'autorise.**
- **La base de développement a dérivé de la fixture, et elle est jetable** — la règle 4 protège la
  donnée métier, pas une fixture locale, et **une comparaison avant/après n'y vaut que si rien n'a
  bougé entre les deux mesures**. Pas de `db:reset`. → **outillage si besoin réel.**
- **Deux dettes, une seule cause : `neon-http` n'a pas de transaction interactive.** La **création
  d'un projet n'est pas atomique** — tout se confronte au domaine **avant** l'écriture (T3.6) —, et
  **`SET LOCAL app.domain_id` n'est pas offert**, donc **le RLS que D38 rattache au SSO est sorti de
  C9** (06/09/2026) : les trois issues coûtent plus qu'elles ne rapportent, et `pg_session_jwt`
  annonce lui-même une API susceptible de changer. L'étanchéité tient par `lib/db/scoped.ts` et ses
  tests, et C9 la durcit au **point d'entrée**. Écart à D38 consigné. → **le jour où le pilote
  exposera la transaction interactive ; les deux se referment ensemble.**
- **Deux règles de période voisines vivent à deux endroits** — `lastActivityExpression` et
  `projectPeriods` — **et divergent sur un point voulu** : la seconde compte les `planned`, la
  première les écarte. L'une dit l'étendue, l'autre la fraîcheur ; deux témoins tiennent l'accord, et
  une activité `in_progress` porte de ce fait une fin de période à venir, juste au mois.
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
- **Le domaine courant est le premier domaine actif trouvé en base**, rendu **par nom** (`docs/05`
  §3 pose un domaine unique) : le jour où un second existe, le choix revient au fournisseur — C9.
- **L'authentification est un stub, et il a de nouveau une échéance : T9.2.** Le contexte de session
  a sa forme finale ; `lib/auth/provider.ts` reste le seul fichier que le SSO réécrira, et
  **`/dev/session` reste** : seul endroit où l'on change de personne courante, 404 en production.
- **Les maquettes `docs/design/maquettes/` sont une référence visuelle**, jamais branchées, et **le
  levier n'est pas le modèle mais les quatre disciplines de vérification.**
