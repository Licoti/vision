# Tickets — C11

Un ticket = une session de CLI. Chaque ticket porte un objectif, un périmètre de fichiers, un
critère de validation vérifiable et ses interdits.

**Règle commune à tous les tickets :** ne modifier aucun fichier hors du périmètre annoncé, ne
créer aucune fonctionnalité non listée, mettre à jour `ETAT.md` en fin de ticket.

---

# C11 — Le parcours d'entrée, de bout en bout

**Le chantier qui referme le geste que C9 avait laissé ouvert.** T9.6 a donné aux domaines leurs
comptes — une personne, une adresse, un accès, un rôle — et s'est arrêté là, sur un interdit écrit
en toutes lettres : *« Aucun envoi de courriel, aucune invitation, aucune notification »*. Le
résultat est un produit où **l'accès s'ouvre sans que personne ne le sache** :
`components/team/access-panel.tsx` le dit à l'écran — *« la personne se connectera quand elle se
connectera »*.

**Le chantier a doublé de taille le 08/09/2026**, sur une spécification humaine qui décrit le
parcours attendu **en entier** :

> Super Admin crée un domaine → désigne son administrateur → l'administrateur reçoit une invitation
> → connexion en SSO → accès à son domaine → gestion des administrateurs et membres du domaine.

**Trois des six maillons existaient**, et ce n'est pas rien : le cloisonnement (règle 1 et
`lib/db/scoped.ts` depuis C1, durci au point d'entrée par C9), le SSO **lié au domaine** —
`resolveDomainId` lit le `hd` du jeton et jamais l'adresse —, et la gestion des utilisateurs d'un
domaine. **Trois manquaient** : l'invitation, l'amorçage en un geste avec sa règle d'adresse, et
*« gérer les informations de son domaine »*, que T9.4 avait explicitement écarté — *« aucun
`updateDomain`, et ce n'est pas un oubli »*.

**C11 pose les trois qui manquent, et rien d'autre.**

**Amendement du 09/09/2026 — le chantier rouvre pour un quatrième objet, et il n'est pas du même
ordre que les trois autres.** T11.5 avait clos C11 la veille : les trois manques étaient posés, le
parcours entier rejoué. **Décision humaine du 09/09/2026 : un T11.6 s'y ajoute, et c'est un
contrôle, pas une fonctionnalité.** *« Rien d'autre »* reste donc vrai au sens où il a été écrit —
C11 n'ajoute aucun quatrième maillon au parcours ; ce que T11.6 apporte est une **épreuve** de ce
que C9 et C11 ont déjà écrit.

**Pourquoi ici plutôt que dans un chantier à lui.** Le contrôle porte sur deux chantiers, dont
celui-ci, et **rien n'est encore en ligne** : c'est le dernier moment où il coûte peu. Ouvrir un
chantier pour un seul ticket aurait demandé une session de découpage — et un découpage se fait sur
un contenu qu'on ne connaît pas encore, puisque c'est précisément ce que le contrôle doit
découvrir. **Le chantier repasse « en cours » dans `ETAT.md`, et se referme une seconde fois avec
T11.6.**

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

**C11 passe devant C7**, décision humaine du 08/09/2026 — **troisième écart à `docs/05` §6**,
*« un chantier à la fois, fermé avant d'ouvrir le suivant »*, après ceux des découpages de C8 et de
C9. Consigné au journal technique, et le travail continue (règle 6).

**Deux raisons, et la première est écrite dans `tickets-C7.md`** : *« les deux balayages viennent
après les écrans neufs, faute de quoi ils passeraient sur un produit qu'un ticket suivant
changerait »*. T11.2 ajoute un écran neuf ; T7.7 est l'un de ces deux balayages. Dans l'ordre
inverse, la page d'invitation n'aurait **jamais** été balayée. La seconde est comptable : deux
chantiers sont ouverts à moitié, et refermer C11 en deux tickets n'en laisse plus qu'un.

**Et le second balayage est déjà dépensé.** T7.6 — les petits écrans — est livré depuis le
30/08/2026 et ne repassera pas. **La page d'invitation se fait donc responsive à la main**, dans
T11.2, plutôt qu'en comptant sur un ticket qui ne reviendra pas : c'est écrit dans sa fiche.

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

## Onze arbitrages rendus le 08/09/2026, à ne pas rouvrir en cours de ticket

Sept viennent de l'humain, quatre lui ont été délégués. **Les quatre derniers sont postérieurs à la
spécification du parcours complet**, et l'un d'eux en amende un plus ancien.

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

**(5) Deux migrations, et pas une troisième** — `0017` pour `invitations`, `0018` pour
`domains.description`. **L'arbitrage disait « une seule » et il s'amende le 08/09/2026**, la
spécification demandant une description de domaine qu'aucune colonne ne porte. La règle de fond ne
bouge pas : **une migration hors de ces deux-là est un signal d'arrêt**, pas une étape.

**(6) `grantPersonAccess` reste intact, et les deux gestes cohabitent.** Accorder un accès
immédiatement et inviter sont **deux gestes voisins, pas un remplacement** : le premier sert quand
la personne est là, le second quand elle ne l'est pas. Fondre les deux aurait réécrit un geste
mesuré hors du périmètre du chantier (règle 3). **Point rouvrable par l'humain, jamais par un
ticket.**

**(7) Un lien vaut sept jours.** Assez pour une semaine de congés, trop court pour qu'un lien oublié
dans une boîte reste une porte. La valeur est écrite **une fois**, dans `lib/auth/invitation.ts`.

**(8) `full_name` reste un seul champ.** La spécification écrit *« son prénom ; son nom »* ; le séparer
n'est pas un champ de plus mais une migration **et** la reprise de chaque écran, de chaque tri et de
chaque phrase de journal qui lit un nom — l'équipe, le radar, les participants d'activité, la carte
de la personne courante. Le libellé dit « Prénom et nom » et porte un exemple. **Écart à la
spécification, assumé et écrit** ; s'il doit se refermer, ce sera par son propre chantier, jamais en
sous-main d'un ticket de C11.

**(9) L'accès du premier administrateur se pose à l'acceptation**, comme tous les autres. C'est
l'arbitrage (1) tenu jusqu'au bout : un accès qui n'a jamais servi n'existe pas. **Contrepartie
nommée** : entre la création et le premier clic, **le domaine n'a aucun administrateur** — état déjà
lisible sur `/domaines`, qui affiche le fait *« aucun compte »* depuis T9.4, et qui dira désormais
*« invitation en attente »*. Le geste se révoque et se refait.

**(10) Les identités et le statut restent au super administrateur.** Un administrateur de domaine
gère le **nom**, le **nom du centre de compétence** et la **description** — trois champs descriptifs.
Il ne touche ni `domain_identities`, ni `status`, ni `archived_at`. **La raison n'est pas
hiérarchique, elle est d'étanchéité** : une identité vérifiée dit *quelle entreprise Google ouvre ce
domaine*. Qui pourrait en ajouter une rattacherait le `hd` d'une autre entreprise à son propre
domaine — c'est la frontière elle-même, et elle ne se délègue pas. Le typage l'interdit, pas la
vigilance.

**(11) Une adresse hors du nom de domaine est refusée, strictement.** `user1@mycompany.com` pour
`mycompany.com`, et rien d'autre ; comparaison en minuscules des deux côtés, comme les trois autres
lectures d'identité. **Ce n'est pas un rattachement**, et la distinction est celle de l'arbitrage (2)
de C9 : le rattachement se fait sur le `hd` **vérifié**, jamais sur la chaîne de l'adresse. Cette
règle-ci est une **cohérence de saisie**, qui attrape la faute au formulaire plutôt qu'au premier
échec de connexion. **Sa limite est écrite** : une entreprise dont le `hd` est `mycompany.com` et les
adresses `@mycompany.fr` verra sa saisie refusée — le contournement est d'ajouter le second nom de
domaine comme identité, ce que le super administrateur peut faire.

---

## Interdits communs aux tickets du chantier

**Ils valent pour les six**, T11.6 compris — un contrôle qui s'autoriserait ce qu'un ticket
s'interdit ne contrôlerait plus rien. T11.6 ajoute les siens, il n'en retire aucun.

**Aucune relance, aucun rappel, aucun envoi récurrent.** `docs/03` §8 n'est pas amendé : une
invitation part une fois. Réinviter est un geste **humain et explicite**, qui révoque le lien
précédent — et le mot « relancer » n'apparaît nulle part à l'écran.

**Aucune personne ne naît d'un jeton** (`docs/04` §7). C'est le chemin de connexion que l'interdit
vise, et il ne bouge pas : un jeton valide dont l'e-mail n'a pas de ligne `persons` est refusé.
Une personne se crée **par un geste humain nommé** — `createPerson` depuis `/equipe`, la désignation
depuis `/domaines` — et l'invitation ne fait que suivre.

**Aucune modification de `lib/auth/entry.ts`.** Les six règles d'entrée et leurs sept causes ne se
rouvrent pas — c'est l'arbitrage (4), rendu opposable.

**Aucun troisième rôle**, aucune écriture d'`is_active`, aucun sélecteur de domaine à l'écran.

**Aucune migration hors de `0017` et `0018`** (arbitrage 5). **Aucune dépendance neuve**
(arbitrage 3). **Aucun `event_target_type` neuf**, et aucun sixième `event_verb`.

**Aucune suppression de donnée métier** (règle 4). Une invitation se **révoque** — une date de plus
sur la ligne —, elle ne s'efface pas.

**Aucune valeur visuelle en dur** (règle 2), et **aucun neuvième jeton de design system inventé**,
y compris sur la page publique d'invitation, **seul écran neuf du chantier** — T11.5 n'ajoute qu'un
bloc à un écran qui existe. **Elle se fait responsive à la main**, T7.6 étant passé.

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
`app/auth/` : pas de coquille, pas de navigation, aucune session. **Responsive et accessible dès
l'écriture** — T7.6 est passé et ne repassera pas ; T7.7, lui, la prendra en balayage. Elle nomme le domaine et n'offre
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

## T11.4 — L'amorçage d'un domaine : un geste, une règle d'adresse, et une invitation

**Objectif** — Que le premier maillon du parcours existe : le super administrateur crée une
entreprise **et** désigne son administrateur en un seul geste, et cet administrateur **reçoit une
invitation**.

**Périmètre** — `lib/db/schema.ts` · `drizzle/0018_*.sql` · `lib/forms/domain.ts` (+ test) ·
`lib/forms/domain-manager.ts` (+ test) · `app/domaines/actions.ts` (+ test) ·
`components/admin/domain-panel.tsx` · `components/admin/domain-manager-panel.tsx` ·
`app/domaines/page.tsx`.

**Attendu** — Cinq gestes.

**1. `domains.description`, facultative** — migration `0018`, la seconde et la dernière du chantier.
Un texte, sans autre règle : c'est la seule colonne que la spécification demande et qu'aucune table
ne porte.

**2. Un seul formulaire, là où il y en avait deux.** Le nom de l'entreprise, le nom du centre de
compétence, le fournisseur et le nom de domaine, la description, puis les prénom-et-nom et l'adresse
de l'administrateur. **Le geste écrit quatre tables** — `domains`, `domain_identities`, `persons`,
`invitations` — et **il n'est pas atomique** : `neon-http` n'a pas de transaction interactive (dette
de T3.6). **Tout se confronte donc avant la première écriture**, comme la création d'un projet
depuis C1, et l'ordre va du plus contraignant au moins : la règle d'adresse, puis l'unicité de
l'identité, puis le reste.

**3. L'adresse doit porter le nom de domaine saisi** — arbitrage (11), refus strict, `lower()` des
deux côtés. **Elle se refuse au formulaire, pas à la connexion** : découvrir la faute au premier
échec de SSO, c'est la découvrir sans que rien ne dise pourquoi, l'écran d'entrée ne distinguant pas
ses causes.

**4. L'administrateur naît sans accès, et reçoit une invitation `domain_manager`** — arbitrage (9).
`ALREADY_STAFFED` s'étend : **un domaine dont l'invitation est en attente n'accepte pas une seconde
désignation**, faute de quoi deux liens ouvriraient le même premier compte. Le super administrateur
**révoque et redésigne** si la personne ne vient jamais — c'est le seul chemin, et il est explicite.

**5. `/domaines` dit l'état neuf.** L'écran affiche déjà deux faits d'accessibilité — *aucune
identité*, *aucun compte*. Un troisième s'y ajoute, **invitation en attente**, sans quoi un domaine
correctement amorcé serait annoncé comme inaccessible. **Aucun décompte, aucun badge, aucune
relance** : un fait, comme les deux autres.

**Validation** — Quatre mesures, et la première est le parcours lui-même.

1. **Le parcours entier, mesuré** : un domaine créé par l'écran, son administrateur invité, le lien
   suivi, le SSO passé — et `has_access` **et** `domain_role = domain_manager` **en base**, avec
   `accepted_at` daté. C'est la seule mesure qui prouve que le chantier sert.
2. **L'adresse hors du nom de domaine est refusée**, et **rien n'est écrit** — ni domaine, ni
   identité, ni personne, ni invitation. **Le décompte en base tranche** : un refus qui aurait déjà
   créé le domaine serait le pire des deux.
3. **Deux désignations d'affilée** : la seconde refusée tant que la première est en attente ;
   acceptée après révocation.
4. **Lu dans le HTML servi**, `<script>` retirés : `/domaines` porte le fait *invitation en attente*
   sur le domaine qui vient d'être créé.

**Mise en défaut** — La règle d'adresse neutralisée fait tomber **la mesure 2 et aucune autre** ;
l'extension d'`ALREADY_STAFFED` neutralisée fait tomber **la seule** mesure 3.

**Interdits** — **Aucun troisième rôle** : le premier compte est `domain_manager`, et le rôle n'est
pas un champ, il est le geste (T9.4). **Aucune migration hors de `0018`.** **Aucun accès accordé à la
désignation** — arbitrage (9). **Aucun `updateDomain`** : c'est T11.5.

---

## T11.5 — Le domaine vu par son administrateur

**Objectif** — *« Gérer les informations de son domaine »*, et **exactement cela** : trois champs
descriptifs, bornés par le typage.

**Périmètre** — `lib/db/scoped.ts` (+ test) · `lib/forms/domain.ts` (+ test) ·
`app/(app)/administration/…` (l'écran et son action) · `components/admin/…` (le panneau).

**Attendu** — Trois gestes.

**1. `updateOwnDomain` dans la couche scopée** — une **quatrième** forme d'écriture, et elle mérite
son nom. `superAdmin` tourne sans autorité nommable ; `asSuperAdmin(grant)` écrit **au-dessus** des
domaines ; `forDomain(scope)` écrit les tables métier. Ici, une autorité **à l'intérieur** d'un
domaine écrit la ligne qui le nomme — `domains` étant la seule table sans `domain_id`, aucune des
trois ne convient. La méthode vit sur `ScopedDb`, ne peut toucher **que** la ligne du domaine de son
appelant, et **n'accepte que trois colonnes** : `name`, `competence_center_name`, `description`. Ni
`status`, ni `archived_at`, ni rien d'autre — **refusés à la compilation**, pas par vigilance
(arbitrage 10).

**2. Un bloc « Ce domaine » en tête de l'écran Administration**, et son panneau. **Pas un sixième
écran** : `docs/06` §2 pose *six écrans, dont deux formulaires et un panneau — c'est le plancher*, et
l'arbitrage (f) de C7 a tenu l'administration à un seul écran pour neuf référentiels. Le domaine
n'est pas un référentiel, mais il est l'objet dont cet écran parle. **Droit : `manageDomain`**, celui
des référentiels et des membres.

**3. Le geste n'est pas journalisé, et c'est un arbitrage, pas un oubli.** Aucun
`event_target_type` ne dit « domaine ». L'élargir demanderait une migration d'énuméré pour un seul
objet — ce que l'arbitrage (d) de C7 refuse et que l'interdit commun redit. Et le poser sur `person`
mentirait sur l'objet, ce qui est pire qu'un silence. **Le geste rejoint donc la liste des familles
qui écrivent sans trace**, ouverte depuis T8.3, avec un cinquième nom.

**Validation** — Trois mesures.

1. **Lu dans le HTML servi** : le nom et la description du domaine paraissent sur l'écran
   Administration, et la correction s'y lit après le geste.
2. **Le droit s'éprouve par l'action**, en `text/plain`, avec étape témoin : un `member` qui frappe
   le point d'entrée n'écrit rien. **Le décompte en base tranche, jamais le code HTTP.**
3. **Les colonnes interdites le sont à la compilation** : `status` et `archived_at` passés à
   `updateOwnDomain` sont un refus de typage, relu dans le test des garde-fous — c'est l'idiome de
   `LinkTable` et de `DeletableTable`, resservi.

**Mise en défaut** — Le contrôle de `manageDomain` neutralisé fait tomber **la seule** mesure 2. La
borne de trois colonnes retirée fait tomber la mesure 3, et **rien d'autre**.

**Interdits** — **Aucune écriture de `domain_identities`, de `status` ni d'`archived_at`**
(arbitrage 10). **Aucun sixième écran.** **Aucune migration.** **Aucun `event_target_type` neuf.**


---

## T11.6 — Le contrôle de sécurité de C9 et C11

**Objectif** — Éprouver **ensemble**, comme une surface d'attaque, ce que C9 et C11 ont écrit ticket
par ticket : la connexion, le SSO, la gestion des domaines, l'étanchéité et les droits. **Le ticket
mesure, il ne répare pas** — sauf une exception nommée plus bas.

**Ce n'est pas une relecture de code.** Un contrôle qui se contente de lire conclut ce qu'il croyait
déjà. Ici chaque énoncé se frappe : une requête, une réponse, **et un décompte en base**.

---

### Trois arbitrages, rendus au plan du 09/09/2026

**(1) Mesurer et consigner, jamais corriger — sauf le critique.** Chaque faille confirmée devient un
point ouvert daté, avec sa destination, et sa correction est un ticket à elle : c'est la règle 3, et
c'est aussi ce qui permet d'**annoncer** un périmètre à un ticket qui touche l'authentification.
**L'exception, et elle est étroite** : une faille **critique** — une donnée d'un domaine lisible ou
écrivable depuis un autre, un contournement d'authentification — se corrige **dans** le ticket, et
l'écart de périmètre se consigne comme les neuf précédents. Laisser une porte ouverte le temps d'un
commit ne se défend pas.

**(2) Ce qui reste après le ticket, ce sont des tests.** Une sonde qui **trouve un trou**, ou qui
éprouve une garde qu'**aucun test ne couvre**, devient un test permanent. Celle qui ne ferait que
rejouer une garde déjà mesurée ne s'ajoute pas : la suite en compte 1 956, et un contrôle qui les
double n'ajoute que du temps d'exécution. **L'inventaire de ce qui est déjà couvert est fait** — il
est dans la section « Ce qui tient déjà » ci-dessous, et il se vérifie avant d'écrire quoi que ce
soit.

**(3) Le résultat s'écrit dans `SECURITE-C9-C11.md`**, créé par ce ticket. **Document de travail, pas
fondation** : il le dit dans son propre en-tête, comme `ACTIONS-HUMAINES-C11.md`, et il ne figure pas
au tableau « Où écrire quoi » de `CLAUDE.md`. Les failles confirmées repartent ensuite dans `ETAT.md`
avec leur destination ; les pièges dans `JOURNAL-TECHNIQUE.md`.

---

### Périmètre

**Ce qui se lit** — `lib/auth/` en entier (`cookie.ts`, `oidc.ts`, `entry.ts`, `invitation.ts`,
`super-admin.ts`, `provider.ts`, `session.ts`) · les sept routes et pages publiques de `app/auth/`,
`app/invitation/` et `app/dev/` · les **cinquante-huit actions serveur** de C9 et C11
(`app/domaines/actions.ts` 9, `app/(app)/equipe/actions.ts` 11, `app/(app)/administration/actions.ts`
38) et les cinq fonctions `load*Drawer` · `lib/db/scoped.ts` · `eslint.config.mjs` ·
`next.config.ts` et `netlify.toml`.

**Ce qui s'écrit** — `SECURITE-C9-C11.md` (créé) · des tests, **là où l'arbitrage (2) le demande et
nulle part ailleurs** · `ETAT.md` et `JOURNAL-TECHNIQUE.md` en fin de ticket.

**La couche d'accès est de C1, et elle entre quand même.** `docs/04` §6 : *« le filtrage par domaine
ne doit pas être facultatif — c'est la seule faille qui, en multi-domaine, causerait une fuite de
données entre entreprises »*. Contrôler l'étanchéité sans elle n'aurait pas de sens.

---

### Ce qui tient déjà — à vérifier, jamais à réécrire

**Sept fichiers de tests portent déjà la sécurité de ces deux chantiers**, et le contrôle commence
par les relire plutôt que par les refaire :

| Fichier | Ce qu'il tient déjà |
|---|---|
| `lib/auth/cookie.test.ts` | La signature, l'altération, la troncature, le mauvais secret, l'expiration, la forme inconnue, et **trois cas de confusion de charge** |
| `lib/auth/entry.test.ts` | La règle 2 avant les autres, et **les huit refus** des règles 4, 5 et 6 |
| `lib/auth/invitation.test.ts` | **Les sept refus**, l'entropie, l'empreinte, les sept jours, le lien qui ne vaut qu'une fois |
| `lib/auth/session.test.ts` | Les droits, les identités refusées, le domaine désigné par le couple vérifié |
| `lib/auth/super-admin.test.ts` | Sans cookie, en responsable de domaine, en super administrateur archivé |
| `app/auth/callback/[fournisseur]/route.test.ts` | **Aucun cookie posé sur un refus**, et l'ordre `resolvePrincipal` → `redeemInvitation` |
| `lib/db/scoped.test.ts` | La frontière de domaine en lecture, en écriture, en jointure ; l'autorité forgée ; l'unicité des identités |

**Une ligne du rapport qui ne ferait que citer l'un d'eux n'est pas un contrôle** : elle dit ce qui
est couvert, et le contrôle porte alors sur ce qui l'entoure.

---

### Attendu — sept familles, et chacune se frappe

**A. Le cookie et la session.** La **matrice de confusion des trois charges** — session, handshake,
invitation : un seul HMAC les scelle, et la distinction est **structurelle**, pas étiquetée. Les neuf
croisements se mesurent, dont trois le sont déjà. S'y ajoutent les drapeaux du cookie servi, et la
**seconde barrière** : accès retiré, personne archivée, personne désactivée, domaine suspendu — **un
cookie déjà posé n'y survit pas**, et cela se mesure en frappant une action avec un cookie devenu
caduc, jamais en lisant `loadSession`.

**B. Le SSO.** Rejeu du `code`, rejeu du `state`, `state` d'un autre aller-retour, handshake d'un
autre fournisseur, absence de handshake, `nonce` absent ou faux. **Le cookie de handshake s'efface
dans tous les cas** — accepté comme refusé. `?fournisseur=` inconnu et non raccordé : le 500 corrigé
le 08/09/2026 se re-mesure. Et **aucune cause de refus ne se distingue** dans ce que le visiteur
reçoit — un refus qui nomme sa cause est un oracle. **Le chemin Microsoft reste non mesurable**
(aucun locataire raccordé) : il se **déclare** tel dans le rapport, il ne se suppose pas correct.

**C. L'invitation.** Les sept refus, isolés. **La page publique comme oracle** : jeton inconnu,
révoqué, périmé, déjà accepté doivent rendre **le même écran** — et le rapport dit si le temps de
réponse les distingue. Le cookie d'invitation n'ouvre aucune session. Le rejeu d'un lien accepté.
L'ordre `resolvePrincipal` → `redeemInvitation`, qui est l'arbitrage (4) du chantier.

**D. Les droits, éprouvés par l'action.** La matrice **cinquante-huit points d'entrée × quatre
identités** — aucune, membre, responsable de domaine, super administrateur. **Le décompte en base
tranche, jamais le code de retour**, et **l'étape témoin n'est pas optionnelle** : la même charge,
sous l'identité qui a le droit, doit écrire. **Les cinq `load*Drawer` en sont** : ce sont des points
d'entrée HTTP, pas des détails de rendu.

**E. L'étanchéité.** Chaque action qui reçoit un identifiant, frappée avec **un identifiant d'un
autre domaine** — deux domaines de fixture, et le décompte lu sur les deux. **Les arguments liés par
`.bind(null, id)` en font partie** : Next les sérialise dans un champ `$ACTION_…` qu'une soumission
réécrit, et le rappel de contexte d'`ETAT.md` le dit depuis C6. C'est la famille que `docs/04` §6
nomme *« la seule faille »* : une confirmée y est **critique** au sens de l'arbitrage (1).

**F. Le transport et l'exposition.** **Deux constats sont déjà en main au 09/09/2026, et ils sont
écrits ici plutôt que laissés à découvrir** : le dépôt ne sert **aucun en-tête de sécurité** — ni
`Content-Security-Policy`, ni `Strict-Transport-Security`, ni `X-Frame-Options`, ni
`Referrer-Policy`, ni `X-Content-Type-Options` — et **il n'a aucun `middleware.ts`**. Il s'ensuit que
la page publique d'invitation est **cadrable dans une iframe**, et que `/dev/session` ne tient qu'à
un `notFound()` posé dans le composant, avec une action inline `switchPerson` qui ne porte **aucun
`requireSession`** — sa fermeture en production vit en profondeur, dans `setCurrentPerson`. Les trois
se mesurent : un `curl -I` pour les en-têtes, une page cadrée pour l'iframe, et l'action frappée sous
`NODE_ENV=production`. S'y ajoutent les journaux de serveur — deux `console.error` dans
`lib/mail/send.ts`, déjà propres au 09/09, à re-mesurer — et les messages d'erreur servis.

**G. Les dépendances.** `npm audit --omit=dev`, et **le résultat du 09/09/2026 est déjà connu** :
`next@16.3.0` porte **deux avis critiques** — exécution de code à distance non authentifiée sur les
serveurs hébergés sous Windows, et la même dans l'API d'optimisation d'images sur des fichiers AVIF,
corrigées en **16.3.4** — et `sharp` un avis **haut**. `next/image` est employé sur trois composants,
donc l'API concernée est servie ; l'hébergement visé est Netlify, donc Linux. **Le rapport dit
l'exposition réelle, pas la sévérité annoncée.** **La montée de version n'est pas un geste de
revue** : elle change le produit, elle demande sa propre mesure, et elle est **interdite ici**.

---

### Validation — quatre mesures, et la deuxième est la plus importante

1. **`SECURITE-C9-C11.md` existe, et chaque ligne porte sa mesure** : la requête, la réponse, le
   décompte en base, le verdict. **Une ligne qui porte une appréciation sans mesure est un défaut du
   ticket**, pas un résultat — c'est *« le critère se lit, jamais il ne s'affirme »* appliqué à un
   rapport.
2. **Chaque sonde se met en défaut avant d'être crue.** Neutraliser la garde qu'elle vise doit la
   faire passer au rouge, et **une sonde qui ne peut pas échouer ne prouve rien** — c'est la
   deuxième discipline du protocole, retournée contre le contrôle lui-même. Le rapport dit, pour
   chaque sonde, **ce qui a été neutralisé et ce qui est tombé**.
3. **Toute faille confirmée est rejouable** : sa reproduction tient en une commande ou en un test
   nommé, écrite dans le rapport — sans quoi le ticket suivant repart de zéro.
4. `npm run lint` (`--max-warnings=0`), `npm run test` et `tsc` au vert. **Le vert de référence est
   1 956 tests sur 68 fichiers** (T11.5), et il ne bouge que des tests neufs de l'arbitrage (2).

**Mise en défaut** — la discipline vaut pour les tests **ajoutés** : chacun doit tomber quand on
neutralise la règle qu'il vise, et **rien d'autre ne doit tomber avec lui**.

---

### Interdits

**Aucune correction hors de l'exception critique** de l'arbitrage (1) — et une correction faite à ce
titre se nomme, s'argumente et se mesure comme n'importe quel geste.

**Aucune montée de version, aucune dépendance neuve, aucune migration.** La famille G consigne ; elle
ne répare pas.

**Aucun RLS** — D38 tient, et sa destination n'a pas bougé : *le jour où le pilote de base expose la
transaction interactive*, avec la dette de T3.6.

**Aucun secret dans le rapport** — ni jeton en clair, ni clé, ni chaîne de connexion, ni charge de
cookie scellée. Les sondes n'écrivent que des **empreintes** et des **décomptes**. C'est l'interdit
commun de C9, resservi : *« aucun secret dans le dépôt, aucun secret dans un message »*.

**Aucune mesure contre une base autre que celle de développement ou de test.** Rien ne se frappe en
ligne — il n'y a d'ailleurs rien en ligne.

**Aucun script d'attaque conservé.** Une sonde qui reste devient un **test** ; une sonde qui ne reste
pas se retire, comme le parcours de clôture de T11.5. Le dépôt ne range pas d'exploit.

**Aucune décision de `docs/07` rouverte**, ni les six arbitrages de C9, ni les onze de C11. Un
désaccord se consigne dans `JOURNAL-TECHNIQUE.md`, et le travail continue (règle 6).

**Aucun écran, aucun geste, aucune fonctionnalité.** Ce ticket ne rend rien : **il déroge au premier
point du protocole et le dit**, comme T9.1, T9.3 et T11.1 — son critère est un rapport mesuré et des
décomptes en base.

---

## Ce que C11 ne fait pas, et ce sont des décisions

**Les prénom et nom séparés** — arbitrage (8). Écart nommé à la spécification du 08/09/2026 : le
séparer demande son propre chantier.

**Le statut d'un domaine, et ses identités vérifiées** — arbitrage (10). Suspendre, archiver,
rétablir, rattacher une entreprise : le super administrateur, et lui seul.

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

**Et le parcours entier se rejoue en fin de chantier**, pas seulement les critères de chaque ticket :
créer un domaine, désigner son administrateur, suivre le lien, passer le SSO, inviter un membre, le
voir entrer. C'est la spécification du 08/09/2026, et c'est la seule mesure qui dit que C11 a servi.
**Il a été rejoué le 08/09/2026 avec T11.5**, en six étapes, et **T11.6 ne le rejoue pas** : un
contrôle n'est pas un parcours, et ce qu'il referme est la question *« est-ce sûr ? »*, pas la
question *« est-ce que ça marche ? »*.

En fin de chantier : `npm run lint` (`--max-warnings=0`), `npm run test` et `tsc` au vert. **Le vert
de référence était 1 834 tests sur 64 fichiers** après T11.1 ; il est de **1 956 sur 68** après
T11.5, et c'est à celui-là que T11.6 compare le sien — jamais à un souvenir.
