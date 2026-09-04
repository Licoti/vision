# ETAT — Vision

Fichier de contexte de session. Mis à jour par Claude en fin de chaque ticket.

**Dernière mise à jour :** 04/09/2026, session de découpage de **C8**. **Balayage fait ce jour** —
de **744 lignes** à moins de 250 ; le « Journal des tickets » et les « Points ouverts » d'avant
balayage sont repris **verbatim** dans `HISTORIQUE-TICKETS.md`, où l'on va quand la forme brève
ci-dessous ne suffit pas.
**Chantier en cours :** **C8 — Dette**, cinq tickets, dans `tickets-C8.md`. **C7 est en pause, pas
clos** — T7.7 → T7.10 reprennent après C8 (décision humaine du 04/09) ; écart à `docs/05` §6 consigné
au journal technique. **Le SSO est sorti de C8 et forme C9 avec l'administration multi-domaine.**
**Ticket suivant : T8.1 — la suite de tests repasse au vert.** Bloquant : aucun autre ne s'ouvre
tant qu'elle est rouge. **À vérifier par l'humain :** la base de test doit porter la `0014` —
`ETAT.md` n'en connaissait que la `0013` au 02/09, et c'est la piste première des 63 échecs.

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
| C7 — Finitions | T7.1 → T7.10 | **en pause** — T7.1 → T7.6 livrés, reprise après C8 |
| C8 — Dette | T8.1 → T8.5 | **en cours** — aucun ticket livré |
| C9 — SSO et administration multi-domaine | à découper | bloqué sur l'inscription Entra ID |
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
- **C7 — Finitions — T7.1 → T7.6 livrés, 28-30/08, puis en pause.** Le budget (dernier bloc annoncé
  de `docs/06` §5), les deux filtres manquants et la répartition par entité, l'administration passée
  d'**un référentiel sur neuf à neuf sur neuf** en deux tickets (145 tests neufs), la coquille et sa
  barre d'ancres, et les petits écrans — **19 formes de page sur 31 en défaut à 375 px** avant,
  aucune après.
- **Hors ticket, 17/08 → 02/09 — vingt-neuf gestes**, tous à la demande humaine, tous détaillés dans
  `HISTORIQUE-TICKETS.md` et `JOURNAL-TECHNIQUE.md`. Cinq portent une migration : **`0010`**
  disponibilité déduite et suppression définitive · **`0011`** une seule cible par indicateur, portée
  par le produit · **`0012`** la période déduite des activités · **`0013`** le dispositif de mesure ·
  **`0014`** les repères de contexte. Le reste est de la reprise d'ergonomie sur canevas, **le bouton
  aligné sur le design system de référence** (01-02/09), et le **renommage de « Projets » en
  « Accompagnements »** (02/09), qui **rouvre D35** sur demande humaine explicite.

---

## Points ouverts

*(un point, une destination — sans destination, c'est un point qu'on n'a pas tranché. Un point
refermé part dans `HISTORIQUE-TICKETS.md`, avec la rédaction longue d'avant le 04/09/2026.)*

### a. À trancher — sinon les tickets suivants héritent du problème

- **C9 attend quatre choses qui ne sont pas du code** : un tenant, un client, un secret, une URI de
  redirection. Le SSO est sorti de C7 le 27/08 (écart à D37 consigné), puis de C8 le 04/09 pour
  former **C9 avec l'administration multi-domaine** — les deux tiennent ensemble, `session.ts`
  retenant **le premier domaine actif trouvé en base** tant que l'authentification est un stub.
  **C9 ne se découpe pas avant que l'inscription existe.** → **action humaine, puis C9.**
- **Le rôle de super administrateur est dans les documents et pas dans le schéma.** `docs/02` §3 le
  définit et `docs/04` écrit *« seul le super administrateur écrit dans cette table »* ; or
  `domain_role` ne porte que `domain_manager` et `member`, **et `persons.domain_id` est obligatoire :
  un super administrateur ne peut pas être une ligne de `persons`** telle qu'elle est. (`superAdmin`
  de `scoped.ts` n'est pas un rôle : trois fonctions sans aucune authentification.) Deux gestes
  humains avant qu'un ticket s'écrive — **lever l'exclusion de `docs/05` §4** et **trancher où vit un
  super administrateur**. → **action humaine, puis C9.**
- **Les secrets Neon n'ont jamais été tournés.** Deux chaînes ont transité en clair le 12/08. Hors
  dépôt (`.env.local` seul), mais valides. **Reportés trois fois** — découpages de C6, C7 et C8 —,
  et la raison est la même : aucun de ces chantiers n'en dépend. → **action humaine.**
- **La table de vocabulaire de `CLAUDE.md` porte encore « Statut de projet »** quand l'écran dit
  « Statuts d'accompagnement », et son entrée « Projet » ne dit pas que le menu affiche
  « Accompagnements ». La règle 7 réserve ce fichier à l'humain. → **action humaine.**
- **Ce qu'un macro-parcours relie reste à trancher**, et avec lui **« macro-parcours » contre le
  « Réseau de liens entre produits » de `docs/02` §10**, qui dit la même direction sous un autre nom.
  L'entrée de menu et l'écran vide restent tels quels — ni table, ni objet, ni droit. Le concept
  devra entrer dans `docs/02` §2, et `docs/` est figé. → **session de découpage de C10.**

### b. Assignés à un ticket

**T8.1 — la remise au vert.** La suite est rouge : **63 échecs sur 3 fichiers** sur 1 582, relevés
sur `HEAD` intact le 02/09 — `accompagnements/actions.test.ts`, `accompagnements/[id]/actions.test.ts`,
`equipe/actions.test.ts` ; cause non cherchée, piste première l'état de migration de la branche de
test · **deux fichiers de tests d'action nettoient sur `if (!f?.domainId) return`** (`accompagnements/`,
`produits/`), la forme même d'une cascade — `equipe/` et `administration/` ont la forme à reprendre ·
**un test de `lib/queries/activities.test.ts` est intermittent** (un échec sur six le 31/08,
l'hypothèse d'une ligne restée archivée ayant été vérifiée et écartée).

**T8.2 — les listes et leurs décomptes.** **`countProjects` et la répartition par entité ne rejouent
pas la jointure de statut de `listProjects`** : le contrat écrit dans `overview.ts` est faux d'une
jointure, et les deux constats d'égalité du test ne tiennent que parce qu'aucune ligne de ce genre
n'existe · **deux colonnes de `docs/06` §4 manquent à la liste transverse**, l'entité et les métiers
· **`/produits` n'affiche aucun compteur**, là où `/accompagnements` en affiche un.

**T8.3 — le journal.** **Onze objets écrivent sans laisser de trace** : persona, use case,
indicateur, personne, entité, vision produit, budget, dispositif de mesure, plan de taggage, repère
de contexte, et la suppression d'un accompagnement — cette dernière d'une autre nature,
`events.project_id` étant `cascade` : pas de ligne à écrire, une disparition à admettre ·
**l'en-tête de `schema.ts` dit « les 26 tables métier », elles sont 33** — cinquième
chiffre faux d'une même famille, le geste est de **retirer** (était destiné à T7.10, C8 passe avant).

**T8.4 — les garde-fous du dépôt.** **`uiLayerSeal` ne scelle ni `shell/`, ni `overview/`, ni
`admin/`**, et la destination « au prochain qui l'ouvre » a **déjà échoué** le 29/08 · **l'amorçage
rapproche par clé naturelle, donc un renommage recrée — et c'est arrivé** ; refermé pour les entités
seules, six clés restent · **les deux use cases de la fixture n'ont aucun persona rattaché**.

**T8.5 — les adresses.** **Deux redirections 308 tiennent `/projets` en vie** dans `next.config.ts`,
**sans condition de retrait**, et rien ne dira le jour où plus personne ne détient d'ancienne
adresse. Elles couvrent la route, **pas le fragment** : `#projets-lies` est devenu
`#accompagnements-lies` sans filet, le bloc étant masqué depuis le 28/08.

**C9 — le SSO et l'administration multi-domaine** (sous la condition du groupe a).
**`lib/auth/session.ts:10` promet encore que « C7 change de source d'identité »** — cinquième énoncé
de la famille, la ligne 4 **citant** D37 et restant juste · **le RLS que D38 rattache au SSO** ·
l'**écran au-dessus des domaines**, `domains.status` portant déjà `active`/`suspended` · l'**amorçage
des référentiels d'un domaine neuf**, aujourd'hui tenu par `scripts/seed.ts`.

**C7 est en pause : ses huit points gardent leur ticket, et leur fiche les décrit en entier.**
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

**Au prochain ticket qui ouvre le fichier.** `listResultToolOptions` sert trois panneaux et son nom
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
  deux résultats sans lien profond, `tools.base_url` sur trois `example.com`. → **sans échéance.**
- **La base de développement a dérivé de la fixture, et elle est jetable** — la règle 4 protège la
  donnée métier, pas une fixture locale, et **une comparaison avant/après n'y vaut que si rien n'a
  bougé entre les deux mesures**. Pas de `db:reset`. → **outillage si besoin réel.**
- **La création d'un projet n'est pas atomique, et ne peut pas l'être** — `neon-http` n'a pas de
  transaction interactive ; tout se confronte au domaine **avant** l'écriture (T3.6). → **le jour où
  la couche l'exposera.**
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
- **L'authentification est un stub sans échéance** depuis la sortie du SSO de C7, mais le contexte
  de session a sa forme finale. `lib/auth/provider.ts` reste le seul fichier que le SSO réécrira, et
  **`/dev/session` reste** : seul endroit où l'on change de personne courante, 404 en production.
- **Les maquettes `docs/design/maquettes/` sont une référence visuelle**, jamais branchées, et **le
  levier n'est pas le modèle mais les quatre disciplines de vérification.**
