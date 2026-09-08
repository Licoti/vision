# Tickets — C11

Un ticket = une session de CLI. Chaque ticket porte un objectif, un périmètre de fichiers, un
critère de validation vérifiable et ses interdits.

**Règle commune à tous les tickets :** ne modifier aucun fichier hors du périmètre annoncé, ne
créer aucune fonctionnalité non listée, mettre à jour `ETAT.md` en fin de ticket.

---

# C11 — L'invitation

**Le chantier qui referme le geste que C9 avait laissé ouvert.** T9.6 a donné aux domaines leurs
comptes — une personne, une adresse, un accès, un rôle — et s'est arrêté là, sur un interdit écrit
en toutes lettres : *« Aucun envoi de courriel, aucune invitation, aucune notification »*. Le
résultat est un produit où **l'accès s'ouvre sans que personne ne le sache** :
`components/team/access-panel.tsx` le dit à l'écran — *« la personne se connectera quand elle se
connectera »*.

**C11 lui donne le chaînon manquant**, et rien de plus : un lien, un courriel, et l'accès qui ne se
pose qu'au moment où quelqu'un s'en sert.

**C10 reste aux macro-parcours**, non découpé. C11 prend le rang suivant plutôt que de s'insérer
dans un chantier dont le contenu n'est pas tranché.

---

## Une irrégularité, et elle s'écrit avant tout le reste

**T11.1 a été écrit avant cette fiche**, le 08/09/2026, à partir d'un plan validé par l'humain mais
vivant hors du dépôt. C'est un manquement au protocole de `CLAUDE.md` — *un chantier ne s'ouvre pas
sans session de découpage, et elle écrit `tickets-C<n>.md`* —, et il est consigné au journal
technique plutôt que masqué par une fiche antidatée.

**Ce document est donc écrit à contretemps pour un ticket, à l'heure pour les deux autres.** Ce qui
suit n'est pas une description de ce qui a été fait : c'est le contrat auquel T11.1 sera confronté
comme les autres, et ses écarts éventuels se noteront.

**Et C11 ne s'ouvre pas maintenant.** Décision humaine du 08/09/2026 : **C7 reprend d'abord**, à
T7.7, et se referme — c'est le dernier chantier du POC et il attend depuis le 30/08. C11 suit.
T11.1 reste une **avance prise**, commitée seule ; la session de découpage complète — celle qui
balaie `ETAT.md` et replie C7 — se tiendra à l'ouverture réelle de C11.

---

## Deux interdits levés, et par qui

**L'interdit de T9.6** — *« Aucun envoi de courriel, aucune invitation, aucune notification »*
(`tickets-C9.md`, 07/09/2026) — **est levé par décision humaine du 08/09/2026**. Ce n'était pas une
décision de `docs/07` : la règle 6 ne le protégeait pas, il n'avait pas de numéro, et sa
justification était un raisonnement par analogie avec un interdit voisin.

**L'exclusion de `docs/05` §4** — *« Notifications et relances »* — **est amendée par la même
décision, et bornée à l'invitation.** Le motif qu'elle cite tient toujours : `docs/03` §8 écrit
*« aucune relance automatique, aucun badge d'alerte, aucun rappel par courriel au POC. Vision montre
le fait ; […] un produit qui harcèle ses contributeurs perd ses contributeurs »*. **C11 ne le
rouvre pas** : une invitation part **une fois**, sur un geste explicite, vers quelqu'un qui n'a
encore rien à harceler. Ce qui reste interdit reste interdit — et l'interdit commun ci-dessous le
réécrit plutôt que de compter sur la mémoire.

`docs/` étant figé (règle 7), les deux écarts se consignent dans `JOURNAL-TECHNIQUE.md`.

---

## Sept arbitrages rendus le 08/09/2026, à ne pas rouvrir en cours de ticket

Trois viennent de l'humain, quatre lui ont été délégués.

**(1) Le jeton n'authentifie jamais.** Il transporte une intention que le SSO vient valider. Le
chemin d'authentification reste **unique** : un lien magique aurait fait d'une boîte mail la clé des
données d'une entreprise cliente, et créé un second chemin à sécuriser en parallèle du premier.
C'est ce qui permet à C11 de ne pas toucher `lib/auth/entry.ts`.

**(2) La règle d'entrée 5 tient.** On n'invite que dans un domaine dont l'entreprise est **déjà**
raccordée à `domain_identities`. Une invitation ne désigne jamais un domaine à la place du claim
vérifié — *« le domaine vient du jeton, et de lui seul »*. Un intervenant à l'adresse personnelle
reste donc hors d'atteinte, et **c'est voulu** : l'ouvrir serait une septième règle d'entrée, à
mesurer aussi soigneusement que les six autres, pour un besoin que rien n'a encore exprimé.

**(3) L'envoi passe par une API HTTP, en `fetch`.** Aucune dépendance npm neuve : le dépôt reste à
six paquets de production. SMTP demandait un paquet et une connexion longue, mal adaptée au
serverless ; Microsoft Graph demandait des autorisations d'application — *« longues à obtenir »*,
la raison exacte qui a tenu l'import d'annuaire hors de C9.

**(4) L'acceptation vient après `resolvePrincipal`, jamais avant.** Les six règles statuent
d'abord ; l'invitation ne peut réparer **qu'un seul** de leurs sept refus, `no_access`. Il en
découle trois propriétés qu'aucun code n'a à porter : aucune personne ne naît à la volée
(`docs/04` §7), aucun domaine non client ne s'ouvre (règle 5), personne d'archivé ne ressuscite.
**`lib/auth/entry.ts` n'est pas modifié d'un caractère**, et c'est l'interdit qui le garantit.

**(5) Une migration, et une seule** — `0017`. Une seconde serait un signal d'arrêt, pas une étape :
elle voudrait dire que le ticket a débordé de son périmètre. C'est la règle de C7 et de C9, tenue.

**(6) `grantPersonAccess` reste intact, et les deux gestes cohabitent.** Accorder un accès
immédiatement et inviter sont **deux gestes voisins, pas un remplacement** : le premier sert quand
la personne est là, le second quand elle ne l'est pas. Fondre les deux aurait réécrit un geste
mesuré hors du périmètre du chantier (règle 3). **Point rouvrable par l'humain, jamais par un
ticket.**

**(7) Un lien vaut sept jours.** Assez pour une semaine de congés, trop court pour qu'un lien oublié
dans une boîte reste une porte. La valeur est écrite **une fois**, dans `lib/auth/invitation.ts`.

---

## Interdits communs aux trois tickets

**Aucune relance, aucun rappel, aucun envoi récurrent.** `docs/03` §8 n'est pas amendé : une
invitation part une fois. Réinviter est un geste **humain et explicite**, qui révoque le lien
précédent — et le mot « relancer » n'apparaît nulle part à l'écran.

**Aucune création de personne à la volée** (`docs/04` §7). On invite une ligne `persons` qui existe
**déjà** ; la créer reste le geste séparé de `createPerson`.

**Aucune modification de `lib/auth/entry.ts`.** Les six règles d'entrée et leurs sept causes ne se
rouvrent pas — c'est l'arbitrage (4), rendu opposable.

**Aucun troisième rôle**, aucune écriture d'`is_active`, aucun sélecteur de domaine à l'écran.

**Aucune migration hors de `0017`** (arbitrage 5). **Aucune dépendance neuve** (arbitrage 3).

**Aucune suppression de donnée métier** (règle 4). Une invitation se **révoque** — une date de plus
sur la ligne —, elle ne s'efface pas.

**Aucune valeur visuelle en dur** (règle 2), et **aucun neuvième jeton de design system inventé**,
y compris sur la page publique d'invitation, qui est le seul écran neuf du chantier.

**Aucun indice calculé** (D39) : pas de décompte d'invitations en attente à l'accueil, pas de badge,
pas de jauge, pas de « X personnes ne se sont jamais connectées ».

---

## T11.1 — La table, et rien qu'elle

**Objectif** — Donner à l'invitation son objet en base, avec ses garanties, avant qu'aucun écran ne
la manipule.

**Périmètre** — `lib/db/schema.ts` · `drizzle/0017_*.sql` · `lib/db/scoped.ts` ·
`lib/db/scoped.test.ts` · **et, par extension décidée le 08/09/2026,**
`app/(app)/equipe/actions.ts` et `app/(app)/equipe/actions.test.ts`.

**L'extension, et sa raison — elle a été demandée, pas prise.** La contrainte
d'unicité de l'adresse traîne deux conséquences hors des quatre fichiers annoncés,
et aucune ne pouvait attendre un autre ticket :

- **`createPerson` et `updatePerson` écrivaient l'adresse sans garde**, et
  `scopeRefusal` n'attrape que `DomainScopeError` : une adresse en double saisie
  au formulaire rendait une **levée non rattrapée**, là où elle rendait un message.
  **Mesuré le 08/09 avant d'être réparé**, `NeonDbError` traversant l'action —
  même famille que le 500 du fournisseur non raccordé, corrigé la veille.
- **Le décompte de jumelles de `grantPersonAccess` est devenu inatteignable** : il
  lit `lower(email)`, l'expression même de l'index. Ses deux tests ne peuvent plus
  construire leur fixture, la base la refusant avant l'action.

**Le contrôle mort est conservé** (décision humaine du 08/09/2026) : il ne coûte
rien à laisser, et supprimer une garde écrite deux jours plus tôt demanderait son
propre argument. **Aucun test ne peut plus l'exercer**, et le fait part au journal
technique plutôt que sous un test qui feindrait de le couvrir.

**Attendu** — Trois gestes.

**1. La table `invitations`.** Treize colonnes, et **aucune colonne `token`** : `token_hash` porte le
SHA-256 des trente-deux octets qui voyagent dans le lien, si bien qu'une lecture de la base — un
export, une capture, un journal de requêtes — ne rend jamais un lien utilisable. **Sans
`archived_at`**, comme `domain_identities` et `person_skills` : la table entre dans `LinkTable` et
`archive` y devient un refus de typage. **Quatre horodatages, aucun statut** — `sent_at`,
`accepted_at`, `revoked_at`, `expires_at` — plutôt qu'un énuméré qu'il faudrait tenir d'accord avec
eux.

**2. Deux index, et chacun tient une propriété.** `invitations_token_hash_unique` rend la lecture
par lien non ambiguë — sans elle, un `limit 1` sans ordre choisirait entre deux candidates, le piège
que T9.6 a mesuré sur l'adresse. `invitations_pending_unique`, **partiel**, tient *une seule
invitation vivante par personne* : sans lui, deux liens ouvriraient le même accès et n'en révoquer
qu'un laisserait l'autre valide. Les refermées s'accumulent — une invitation acceptée est une trace.

**3. `superAdmin.findInvitationByTokenHash`.** La **troisième** lecture qui précède le domaine, au
rang de `findDomainIdentity` : elle s'exécute là où aucune session n'existe encore. **Elle ne juge
de rien** — ni expiration, ni révocation, ni acceptation déjà faite : une lecture qui filtre en
silence rend un refus *sans cause*, et les causes doivent s'isoler pour se mettre en défaut.

**Et un point ouvert d'`ETAT.md` qui devient bloquant.** *« Rien n'interdit en base deux adresses
identiques dans un domaine »*, destination *« le jour où une contrainte s'autorise »*. Ce jour est
celui de l'invitation, qui **se rapproche par l'adresse**. La même migration pose donc
`persons_domain_email_unique` sur `(domain_id, lower(email))`, **sans clause partielle** : le
rapprochement de la règle 6 lit `includeArchived`, une ligne archivée reste une candidate. Les
`NULL` restent distincts — une personne sans adresse ne gêne personne, ce qui est D19.

**Validation** — **Ce ticket ne rend aucun écran** : il déroge au premier point du protocole et le
dit, comme T9.1 et T9.3. Son critère se mesure en base.

1. Une empreinte de jeton en double, **refusée**.
2. Deux invitations vivantes pour une même personne, **refusée** ; la seconde devient possible dès
   que la première est révoquée, puis acceptée, et les trois lignes restent en base.
3. Un `person_id` d'un autre domaine, **refusé par `assertPreconditions`, avant l'écriture** — la
   clé étrangère PostgreSQL, elle, l'accepterait : elle ignore le domaine.
4. `findInvitationByTokenHash` rend une invitation **périmée**, sans la juger.
5. Deux adresses identiques dans un domaine, **refusées, casse comprise et archivées comprises** ;
   la même adresse dans deux domaines reste légitime.
6. **Au formulaire** : une seconde saisie de la même adresse rend **un message, jamais une levée**,
   à la création comme à la correction — et **le décompte en base tranche**, une ligne refusée ne
   devant pas d'abord s'écrire. Garder sa propre adresse n'est pas un doublon.

**Le nom de la contrainte se lit dans l'assertion**, jamais un `toThrow()` nu : celui-ci passe pour
n'importe quelle levée — une colonne manquante, un réseau coupé — et cesse alors de dire ce qu'il
prétend dire. Le nom vit dans la **cause**, `drizzle` enveloppant la levée du pilote.

**Mise en défaut** — La garde du formulaire neutralisée fait tomber **les deux** cas de saisie et
**aucun autre** ; son exclusion de soi-même retirée fait tomber **le seul** cas de la propre adresse.
Le sceau nominatif de `superAdmin` doit tomber si une clé s'ajoute sans décision — **et il est
tombé**, sur `findInvitationByTokenHash`. **Les trois index ne se neutralisent pas sans une écriture
en base** (`drop index`) : le substitut est le nom de la contrainte, assérté, qui ne peut venir
que d'elle.

**Interdits** — **Aucun écran, aucun panneau, aucun envoi, aucune action d'invitation.** La table
existe, rien ne l'écrit encore hors des tests ; les deux fichiers d'équipe ne reçoivent que la garde
d'adresse et la reprise de ses tests.

---

## T11.2 — Le geste, la page, et l'acceptation

**Objectif** — La boucle entière, **sans courriel** : un responsable invite, le lien s'affiche à
l'écran et se transmet à la main, et l'acceptation pose l'accès.

**Périmètre** — `lib/forms/invitation.ts` (+ test) · `lib/auth/invitation.ts` (+ test) ·
`app/(app)/equipe/actions.ts` · `components/team/invitation-panel.tsx` · `lib/drawers/team.tsx` ·
`app/(app)/equipe/page.tsx` · `app/invitation/[jeton]/page.tsx` ·
`app/auth/callback/[fournisseur]/route.ts` · `components/team/access-panel.tsx`.

**Attendu** — Cinq gestes.

**1. `lib/forms/invitation.ts`**, pur, au patron des vingt-six autres : lecture champ par champ —
jamais d'étalement de `FormData` —, invariant *`input` non nul **ssi** `errors` est vide*. Un seul
champ, `role`, **dérivé de `domainRole.enumValues`**. `isEmailAddress` se réemploie
(`lib/forms/domain-manager.ts`), elle sert déjà `lib/forms/person.ts`.

**2. `invitePerson`**, derrière la porte existante `openPersonForAccess` — donc `manageDomain`, donc
les quatre refus de `grantPersonAccess` **repris tels quels** : pas d'adresse · doublon d'adresse ·
dernier responsable · `DomainScopeError`. Un cinquième s'ajoute : la personne a déjà un accès.
**Elle n'écrit pas `has_access`** — c'est toute la différence avec le geste voisin, qui ne bouge pas.
`revokeInvitation` est son miroir, muet.

**3. `components/team/invitation-panel.tsx`**, jumeau d'`access-panel.tsx` : même `<Panel>`, même
`useActionState`, action **déjà liée**, aucune session reçue — un composant client n'a rien à faire
d'un contexte de droits. **Les garde-fous sont dans l'action**, un panneau absent du rendu n'ayant
jamais protégé le point d'entrée HTTP qui l'accompagne.

**4. `app/invitation/[jeton]/page.tsx`**, hors du groupe `(app)` comme `app/domaines/` et
`app/auth/` : pas de coquille, pas de navigation, aucune session. Elle nomme le domaine et n'offre
que les fournisseurs `isProviderConnected`. **Elle ne distingue pas ses causes** : jeton inconnu,
expiré, révoqué et déjà accepté disent le même mot — *un refus qui distingue ses causes est un
oracle offert à qui frappe*. Elle pose un cookie scellé de quinze minutes par le `seal`/`open` de
`lib/auth/cookie.ts` — **le même HMAC que le handshake**, pas une seconde mécanique.

**5. L'acceptation, dans le callback, après `resolvePrincipal`.** `redeemInvitation` vit dans
`lib/auth/invitation.ts` et est **pure au sens d'`entry.ts`** : pas de Next, pas de réseau, donc ses
refus se mesurent sur claims forgés. Le cookie d'invitation s'efface **dans tous les cas**, comme le
handshake depuis T9.2.

**Et un commentaire à corriger, parce que ce ticket est celui qui le rend faux** :
`components/team/access-panel.tsx:33` — *« Aucune invitation, aucun courriel, aucune relance »*.
**Un commentaire faux vaut une ligne de code fausse** (leçon de T7.5).

**Validation** — Quatre mesures, et la dernière seule prouve que le ticket sert.

1. **Lu dans le HTML servi**, `<script>` retirés : la page d'invitation **nomme le domaine**.
2. **Les cinq refus, isolés** : jeton inconnu · expiré · révoqué · déjà accepté · e-mail vérifié
   différent de celui de l'invitation. **Et un sixième** : le domaine résolu du jeton n'est pas celui
   de l'invitation.
3. **Aucun cookie de session n'est posé sur un refus**, et cela se lit **dans le cookie et dans la
   base**, jamais dans le code de réponse — *un refus affiché sans cookie vérifié n'est pas un refus
   vérifié* (discipline de C9).
4. **La boucle entière** : une personne sans accès est invitée, le lien mène à la page, l'acceptation
   pose `has_access` **et** son rôle en base, et `accepted_at` est daté. **Le décompte en base
   tranche, jamais le code HTTP.**

**Mise en défaut** — Chaque refus neutralisé fait tomber son test, et rien d'autre. Déplacer
l'acceptation **avant** `resolvePrincipal` doit faire tomber les mesures de domaine et d'archivage,
et c'est la mesure de l'arbitrage (4).

**Interdits** — **Aucun envoi de courriel** : le lien s'affiche et se transmet à la main. **Aucun
`lib/mail/`.** Voir aussi les interdits communs.

---

## T11.3 — L'envoi

**Objectif** — Que le lien parte tout seul, et que son absence ne casse rien.

**Périmètre** — `lib/mail/send.ts` (+ test) · `app/(app)/equipe/actions.ts` (l'appel seul) ·
`.env.example`.

**Attendu** — Deux gestes.

**1. Un `fetch` vers l'API de Resend**, deux variables — `RESEND_API_KEY`, `MAIL_FROM` —, **zéro
dépendance neuve**. Le corps dit le domaine, qui invite, ce que le rôle donne, et la date
d'expiration. **Rien d'autre.**

**2. `isMailConnected()`**, calque exact d'`isProviderConnected` (`lib/auth/oidc.ts`). Sans clé,
aucun envoi n'est tenté, **l'invitation existe quand même**, et le panneau affiche le lien à
transmettre — c'est-à-dire l'état de T11.2, atteint **sans second chemin de code**. Un envoi qui
échoue **n'annule jamais** l'invitation : `sent_at` reste nul, le lien reste affiché.

**Validation** — Trois mesures.

1. **Sans `RESEND_API_KEY`** : l'invitation se crée, `sent_at` est nul, le lien est **lu dans le
   HTML servi**, et aucune requête sortante n'est tentée.
2. **Avec la clé, l'envoi échouant** : l'invitation existe toujours, `sent_at` est nul. **Le
   décompte en base tranche.**
3. **Le corps du message ne porte ni relance, ni rappel, ni seconde adresse** — il se lit.

**Mise en défaut** — La clé retirée fait tomber la mesure 2 et **aucune autre** ; l'échec d'envoi
transformé en levée doit faire tomber la mesure 2 seule.

**Interdits** — **Aucun second envoi**, aucun réessai automatique, aucune file. Voir les interdits
communs.

---

## Ce que C11 ne fait pas, et ce sont des décisions

**Le super administrateur n'invite pas.** `designateDomainManager` crée le premier responsable avec
son accès, en un geste, et n'ouvre qu'une fois — *« les suivants se désignent depuis l'intérieur »*.
Lui donner la variante différée est un quatrième ticket, pas un « pendant que j'y suis ».

**L'import d'annuaire.** Sorti de C9 pour ses autorisations longues à obtenir ; C11 ne le rouvre
pas. `persons.identity_provider` reste donc sans écrivain.

**Le RLS.** Sa destination n'a pas bougé : *le jour où le pilote de base expose la transaction
interactive*, avec la dette de T3.6.

**L'invitation d'une adresse hors entreprise cliente** — arbitrage (2), et la porte reste fermée.

---

## Vérification, à chaque ticket

Les quatre disciplines du protocole, sans rappel : **le critère se lit dans le HTML servi** (T11.1
déroge et le dit) · **les tests se mettent en défaut** avant d'être crus · **le contraste se mesure**
sur tout couple neuf par la position · **le droit s'éprouve par l'action**, en `text/plain`, avec
étape témoin.

Et la discipline propre à ce terrain, héritée de C9 : **qu'un jeton soit refusé se lit dans la
réponse, mais qu'aucune session n'ait été posée se lit dans le cookie et dans la base.**

En fin de chantier : `npm run lint` (`--max-warnings=0`), `npm run test` et `tsc` au vert. **Le vert
de référence est 1 824 tests sur 64 fichiers**, relevé le 08/09/2026 — chaque ticket y compare le
sien, jamais à un souvenir.
