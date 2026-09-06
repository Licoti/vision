# Tickets — C9

Un ticket = une session de CLI. Chaque ticket porte un objectif, un périmètre de fichiers, un
critère de validation vérifiable et ses interdits.

**Règle commune à tous les tickets :** ne modifier aucun fichier hors du périmètre annoncé, ne
créer aucune fonctionnalité non listée, mettre à jour `ETAT.md` en fin de ticket.

---

# C9 — SSO et administration multi-domaine

**Le chantier que deux découpages avaient repoussé.** Le SSO est sorti de C7 le 27/08/2026, faute
d'inscription d'application — écart à D37 consigné. Il est sorti de C8 le 04/09/2026, et **un second
sujet est venu s'y adosser** : l'écran au-dessus des domaines, celui qui crée une entreprise, la
suspend et désigne ses responsables (`docs/02` §3, rôle *Super administrateur*).

**Les deux tiennent ensemble, et c'est la raison du chantier commun.** `lib/auth/session.ts`
retient aujourd'hui **le premier domaine actif trouvé en base, par nom**. Tant que
l'authentification est un stub, rien ne peut dire *« cette personne appartient à cette
entreprise »*, et un sélecteur d'entreprise sans fournisseur d'identité serait une liste déroulante
que n'importe qui change — **l'inverse de l'étanchéité qu'il prétendrait servir**. L'étanchéité
elle-même n'est pas en cause : elle tient depuis C1 par la règle 1 et `lib/db/scoped.ts`, `domains`
étant la seule table sans `domain_id`.

---

## Six arbitrages rendus le 06/09/2026, à ne pas rouvrir en cours de ticket

Quatre viennent de l'humain, deux lui ont été délégués. **Ensemble, ils lèvent la première des deux
conditions que le groupe « À trancher » d'`ETAT.md` posait à ce chantier** — *trancher où vit un
super administrateur*.

**(1) Deux fournisseurs d'identité, Google et Microsoft, tous deux multi-tenant.** Une seule
inscription par fournisseur vaut pour **toutes** les entreprises clientes : aucun réenregistrement
par client. C'est un écart à `docs/01` §141 — *« environnement Microsoft »* — et à la ligne du
`CLAUDE.md` qui annonce Entra ID seul ; consigné au journal technique, l'écriture des documents
restant à la main humaine (règle 7, `docs/` figé).

**(2) Un compte sans domaine d'entreprise vérifié est refusé au point d'entrée.** Un compte Google
Workspace porte un claim `hd` — *hosted domain* —, un compte Microsoft d'organisation porte `tid`.
Un compte grand public n'en porte aucun. **Le rattachement ne se fait jamais sur le domaine de la
chaîne e-mail** : une adresse peut être un alias, `hd` et `tid` sont vérifiés par le fournisseur.
C'est toute la différence entre une frontière et son apparence.

**(3) Une table `domain_identities`** rattache une entreprise vérifiée à un domaine Vision. Une
entreprise peut en porter plusieurs — filiale, second nom de domaine, migration d'un fournisseur à
l'autre — sans migration à chaque fois.

**(4) Une table `super_admins`, hors domaine.** `docs/02` §3 donne un rôle au super administrateur
et `docs/04` écrit *« seul le super administrateur écrit dans cette table »* ; or `domain_role` ne
porte que `domain_manager` et `member`, **et `persons.domain_id` est obligatoire : un super
administrateur ne peut pas être une ligne de `persons`** telle qu'elle est. Les trois autres
logements ont été écartés, et pour des raisons nommées — un rôle porté par le fournisseur devrait
se déclarer deux fois et vivrait hors de Vision · une liste d'e-mails en variable d'environnement
ne laisse aucune trace et demande un redéploiement · élargir `persons` casserait l'invariant qui
fonde la règle 1, *toute ligne de `persons` porte un domaine*.

**(5) `oauth4webapi`, et une seule dépendance neuve.** Le dépôt passe de cinq à six paquets de
production ; `oauth4webapi` 3.8.8 n'a **aucune dépendance transitive**, il est ESM et s'appuie sur
WebCrypto — aligné sur Next 16, Node 24 et le TypeScript strict du dépôt. Préféré à
`openid-client`, **qui l'appelle**, pour deux raisons : son API suit les RFC, qui ne bougent pas,
quand la couche haute a cassé la sienne d'une majeure à l'autre (v5 → v6) ; et ce qu'elle nous
épargnerait est le **câblage** — découverte, stockage de `state` et de `nonce` —, pas la
cryptographie, or le câblage est exactement là où vivent **nos** règles : les six refus ci-dessous,
`domain_identities`, `super_admins`. Ce que la bibliothèque fait et que nous n'écrirons pas : la
vérification RS256 contre les clés JWKS, leur rotation, `state`, `nonce`, PKCE. **C'est le seul
endroit du produit où une erreur est silencieuse** — un jeton forgé accepté ne produit pas une
erreur, il produit une session.

**(6) Le RLS sort du chantier, et change de destination.** D38 le rattache explicitement au SSO.
**Ce n'est pas un point ouvert de C9, c'est un point ouvert du pilote de base** : deux dettes déjà
consignées ont la même cause unique, `neon-http` — la création de projet non atomique (T3.6), et
l'impossibilité de `SET LOCAL app.domain_id`, qui est le même manque vu sous un autre angle, chaque
requête partant dans un appel HTTP séparé. Les trois issues coûtent plus qu'elles ne rapportent
**dans ce chantier** : récrire chaque lecture en lot de deux instructions · quitter `neon-http`
pour le pool WebSocket dans `lib/db/client.ts`, **que tout le dépôt traverse**, soit deux
fondations en mouvement en même temps · ou Neon RLS, dont la documentation de `pg_session_jwt`
annonce elle-même que **l'API est susceptible de changer** — bâtir la frontière entre entreprises
sur une API annoncée mouvante n'est pas robuste dans le temps, c'est l'inverse. **Et C9 durcit la
frontière là où elle est aujourd'hui traversable** : au point d'entrée. Destination récrite → *le
jour où le pilote de base expose la transaction interactive*, **la même que la dette de T3.6, et
les deux se referment ensemble**. Écart à D38 consigné.

---

## La condition de matériel, et ce qu'elle bloque exactement

`tickets-C8.md` écrivait *« C9 ne se découpe pas avant que l'inscription d'application Entra ID
existe »*. **Cette condition a été posée quand la forme du chantier était indécise ; elle ne l'est
plus.** Les inscriptions fournissent des **valeurs**, pas une forme : elles ne changent aucune
fiche. **La condition descend donc du chantier au ticket** — elle porte sur T9.2, et sur lui seul.

Six valeurs, à poser dans `.env.local`, **jamais dans un fil de discussion** — les deux chaînes
Neon du 12/08/2026 y ont transité en clair et **ne sont toujours pas tournées**. `.env.example`
reçoit les mêmes clés, sans valeur.

| Clé | Origine |
|---|---|
| `GOOGLE_CLIENT_ID` | Google Cloud Console › Credentials › OAuth client ID, type **Web application** |
| `GOOGLE_CLIENT_SECRET` | idem — **non réaffichable** après création |
| `ENTRA_CLIENT_ID` | portail Azure › App registrations › Overview › *Application (client) ID* |
| `ENTRA_CLIENT_SECRET` | Certificates & secrets › **Value**, pas *Secret ID* — noter sa date d'expiration |
| `AUTH_SECRET` | `openssl rand -base64 32`. **Aucune console ne le donne** : il signe le cookie de session, que le stub n'avait pas besoin de signer |
| `AUTH_URL` | `http://localhost:3000`. Construit la `redirect_uri`, qui doit être **identique au caractère près** à celle enregistrée |

**Le `ENTRA_TENANT_ID` qu'`ETAT.md` réclamait n'existe plus.** Une inscription multi-tenant
s'autorise sur `login.microsoftonline.com/organizations/v2.0` : c'est le claim `tid`, confronté à
`domain_identities`, qui désigne l'entreprise. La liste des quatre était donc fausse deux fois —
un tenant en trop, un secret de signature en moins.

**Quatre réglages de console qui ne sont pas des valeurs.** L'écran de consentement Google doit être
de type **External** — *Internal* limiterait la connexion à une seule organisation, l'inverse de ce
qu'on veut · l'inscription Entra doit dire **« comptes dans n'importe quel annuaire d'organisation »**
et **pas** la variante *« … et comptes Microsoft personnels »*, qui contredirait l'arbitrage (2) ·
le claim optionnel **`email`** doit être ajouté à l'*ID token* Entra, `oid` et `tid` y étant déjà ·
et **les portées demandées sont `openid`, `email`, `profile`, sans `offline_access`.**

**Le refus d'`offline_access` est un choix, pas un oubli.** Un jeton de rafraîchissement ne sert
qu'à rappeler l'API du fournisseur plus tard, et **Vision ne la rappelle jamais** : elle lit le
jeton d'identité à la connexion, en tire `hd`/`tid`, l'e-mail et l'identifiant, puis pose son propre
cookie — l'import d'annuaire est hors chantier, dit plus bas. Ne pas demander la portée fait tomber
avec elle **l'expiration à sept jours des jetons de rafraîchissement du mode *Testing* de Google**,
raccourcit l'écran de consentement, et retire un secret de longue vie. Les trois portées restantes
sont **non sensibles** : aucune vérification Google à subir, aucun délai avant publication.

**Deux valeurs qui ne sont pas des réglages non plus** : l'**e-mail du premier super
administrateur**, sans lequel personne ne crée le premier domaine, et, pour le premier domaine
réel, **son identité vérifiée** — le domaine Google Workspace tel que `hd` le rend, et/ou le `tid`
Entra.

---

## Les règles d'entrée — l'ordre *est* la règle

Elles sont l'objet de T9.2, et elles sont écrites ici parce qu'aucun ticket ne les rouvre.

1. **Le jeton est vérifié** — signature contre le JWKS du fournisseur, `iss`, `aud`, expiration,
   `nonce`.
2. **`super_admins` est consulté en premier**, sur l'e-mail vérifié. Un super administrateur est
   *au-dessus* des domaines : la règle du domaine d'entreprise ne le concerne pas. C'est ce qui
   permet d'être super administrateur avec une adresse hors entreprise **sans ouvrir la porte à
   personne d'autre**, et c'est la seule exception à l'arbitrage (2).
3. **Sinon l'entreprise est lue dans le jeton** — `hd` ou `tid` — et confrontée à
   `domain_identities`.
4. **Ni `hd` ni `tid` → refus.**
5. **Aucune ligne `domain_identities` → refus.** L'entreprise n'est pas cliente.
6. **Puis la ligne `persons`** du domaine, rapprochée sur l'identifiant du fournisseur, avec repli
   sur l'e-mail au premier passage. Pas de ligne, `has_access` faux, `is_active` faux, archivée →
   refus. **`loadSession` fait déjà ces quatre refus, sans repli** — *« une identité fournie et
   inéligible est refusée, pas remplacée »* —, et c'est exactement ce que D37 avait prévu en
   demandant la forme définitive du contexte dès C1.

**Vision ne crée jamais de personne à la volée.** `docs/04` §7 l'écrit — *« la synchronisation
annuaire est en lecture seule ; Vision ne crée jamais de personne »*. L'invitation précède la
connexion.

---

## Interdits communs aux six tickets

**Aucune création de personne à la volée** (`docs/04` §7). Un jeton valide dont l'e-mail n'a pas de
ligne `persons` dans le domaine **ne fait pas naître cette ligne**.

**Aucun sélecteur de domaine à l'écran.** Le domaine vient du jeton et de lui seul — c'est la
raison même du chantier commun, et une liste déroulante la défait.

**Aucune seconde dépendance** (arbitrage 5). **Aucun RLS** (arbitrage 6). **Aucune migration hors
de celle de T9.1** : une migration supplémentaire est un signal d'arrêt, pas une étape — elle
voudrait dire que le ticket a débordé de son périmètre.

**Aucune suppression de donnée métier** (règle 4). Cela vaut pour un domaine, qui **se suspend ou
s'archive**, jamais ne se supprime.

**Aucune valeur visuelle en dur** (règle 2), et **aucun neuvième jeton de design system inventé** —
la règle que huit manques ont tenue sans exception depuis C7.

**Les états vides sont des écrans à part entière** (règle 5). L'écran « aucun accès » de T9.2 et la
liste vide de domaines de T9.4 en sont, pas des cas d'erreur.

**Aucun indice calculé** (D39) : aucun décompte qui qualifierait une entreprise, une personne ou une
entité. **Aucun badge d'alerte, aucune notification, aucune relance.**

**Aucun secret dans le dépôt, aucun secret dans un message.** Les six valeurs vivent dans
`.env.local` ; `.env.example` en porte les clés et rien d'autre.

**`activities` n'est jamais `events`.** La règle de C6 ne s'éteint pas.

---

## T9.1 — Le schéma de l'identité

**Objectif** — Donner une place en base à ce qu'aucune table ne porte : un super administrateur, et
le rattachement **vérifié** d'une entreprise à un domaine.

**Périmètre** — `lib/db/schema.ts` ; une migration `0016` ; `lib/db/scoped.ts` ; les tests de ces
deux fichiers.

**Attendu** — Trois gestes, et pas un de plus.

**1. `super_admins`.** E-mail unique, nom, l'identifiant rendu par le fournisseur, `archived_at`,
les horodatages. **Sans `domain_id`** — comme `domains`, et pour la même raison : ce qui est
au-dessus des domaines ne se scope pas. **Sans `created_by`** non plus, qui pointerait `persons`,
elle-même scopée : c'est déjà le raisonnement écrit au-dessus de `domains` dans le schéma.

**2. `domain_identities`.** `domain_id`, le fournisseur (`google` · `microsoft`, un énuméré neuf),
la valeur — le `hd` ou le `tid` —, et **une contrainte d'unicité sur le couple (fournisseur,
valeur)**. C'est elle qui rend impossible qu'une même entreprise ouvre sur deux domaines Vision :
sans elle, l'étanchéité dépendrait de la vigilance de qui saisit.

**3. Sur `persons`, l'identifiant du fournisseur.** La table porte déjà `source`
(`directory` · `manual`), `external_id` et une unicité sur (`domain_id`, `external_id`). Deux
fournisseurs peuvent rendre le même identifiant : le fournisseur entre dans la clé, ou le ticket
écrit pourquoi il n'y entre pas. **La contrainte `persons_external_id_requires_directory` existe et
ne se contourne pas.**

**Le point d'architecture, et il se nomme dans la fiche.** `domain_identities` porte un `domain_id`,
**mais elle se lit avant que le domaine soit connu — c'est elle qui le désigne**. Elle ne peut donc
pas passer par `forDomain`, et ce n'est pas une entorse à la règle 1 : c'est le même cas que
`domains`. `superAdmin` (`lib/db/scoped.ts:891`) gagne les fonctions de lecture hors domaine que
cela demande, et **le commentaire qui coiffe ce bloc — « trois fonctions, une seule table » —
devient faux le jour où elles sont quatre** : le corriger fait partie du ticket. Un commentaire faux
vaut une ligne de code fausse (leçon de T7.5).

**Validation** — **Les contraintes se mesurent en base, jamais dans le schéma.** Trois écritures
refusées, chacune séparément : une seconde `domain_identities` sur le même couple (fournisseur,
valeur) · un second `super_admins` sur le même e-mail · une `domain_identities` pointant un domaine
inexistant. Et la migration s'applique **sur la branche de test** avant d'être crue.

**Mise en défaut** — Chaque contrainte retirée fait tomber **son** test, et rien d'autre.

**Interdits** — **Aucun écran, aucune route, aucune lecture de ces tables par le produit.** Aucune
donnée d'amorçage : la première ligne de `super_admins` se pose en T9.2, pas ici. Aucune
modification des droits de `lib/auth/session.ts`.

---

## T9.2 — Le SSO

**Condition d'ouverture** — **quatre valeurs suffisent à l'ouvrir**, celles de Google plus
`AUTH_SECRET` et `AUTH_URL`. **Le ticket s'écrit sans elles, il ne se vérifie pas sans elles**, et un
critère qu'on ne peut pas mesurer n'est pas un critère.

**Google d'abord, Microsoft quand un client l'impose — et la raison est nommée pour ne pas se
redécouvrir.** Vérifié le 06/09/2026 : Entra ID Free est gratuit, mais son inscription demande
**une carte bancaire à fin de vérification d'identité** — non débitée —, et *« only paid customers
can create a new Workforce tenant »*. Google ne demande ni carte, ni facturation, ni vérification
pour des portées non sensibles. **Ce n'est pas un renoncement à l'arbitrage (1)** : la couche
s'écrit pour deux fournisseurs et en sert un. Ajouter Microsoft, ce sera deux valeurs de plus et une
entrée de plus dans la table des fournisseurs — **jamais une reprise**. Le ticket est livrable avec
un seul fournisseur branché, **à condition que le second ne demande aucune modification de forme**,
et c'est cela que sa structure doit rendre évident.

**Objectif** — `lib/auth/provider.ts` réécrit, **et lui seul**. `lib/auth/session.ts` porte déjà la
forme définitive du contexte : *« le stub lit un cookie ; Entra ID lira un jeton, et appellera le
même `loadCurrentSession`. Le contexte, les droits, les écrans et les tests ne bougeront pas. »*
**C'est tout l'objet de la séparation posée en C1, et ce ticket est l'épreuve de cette promesse** :
si les écrans bougent, la séparation était fausse.

**Périmètre** — `lib/auth/provider.ts` et son test ; `lib/auth/session.ts` **pour `resolveDomainId`
seul** ; les routes neuves ; `package.json` ; `.env.example` ; `next.config.ts` si le rendu dynamique
l'exige.

**Attendu** — Quatre gestes.

**1. Les deux fournisseurs**, par `oauth4webapi`, avec `state`, `nonce` et PKCE. La découverte se
fait sur les documents publics des fournisseurs ; **aucune URL d'autorisation n'est écrite à la
main.**

**2. Les six règles d'entrée** ci-dessus, dans cet ordre, chacune éprouvée séparément.

**3. Le cookie de session, signé par `AUTH_SECRET`.** Le stub posait un identifiant de personne en
clair dans un cookie `httpOnly` — *« le cookie n'authentifie personne, il désigne »*. Celui-ci
authentifie : il se signe. **La tolérance du stub — un cookie survivant à un ré-amorçage retombe
sur la première personne connectable — disparaît avec lui**, et c'est le commentaire de
`provider.ts` qui l'annonce : *« le repli est un confort de développement, pas une règle. »*

**4. Les quatre routes** : `/auth/connexion`, `/auth/callback/[fournisseur]`, `/auth/deconnexion`,
et l'**écran « aucun accès »** — un écran à part entière (règle 5), qui dit ce qui manque sans
jamais dire si l'entreprise est cliente ni si la personne existe. **Un refus qui distingue ses
causes à l'écran est un oracle offert à qui frappe.**

`resolveDomainId` cesse de rendre le premier domaine actif par nom. **C'est ce geste qui referme le
couplage que T8.1 n'a pas pu lever** — *« rien ne peut lui désigner un autre domaine, donc un test
d'action dépend de l'état global de la branche »* — et la garde de `vitest.global-setup.ts` cesse
d'être la seule protection.

**Validation** — Trois mesures, dans cet ordre, et la troisième porte tout le poids.

1. **Le 302, lu dans l'en-tête `Location`** : `curl -i "http://localhost:3000/auth/connexion?fournisseur=google"`
   rend `accounts.google.com/o/oauth2/v2/auth` avec le bon `client_id` et une `redirect_uri`
   **identique au caractère près** à celle enregistrée ; l'équivalent Microsoft rend
   `login.microsoftonline.com/organizations/oauth2/v2.0/authorize`. **Ce ticket déroge au premier
   point du protocole et le dit** : son entrée ne se lit pas dans le HTML servi mais dans un code
   de réponse et un en-tête — ce qui est une mesure, pas une lecture de code.
2. **La session ouverte, lue en base**, avec le bon domaine et la bonne personne.
3. **Les cinq refus, éprouvés séparément par l'action** — un jeton sans `hd` ni `tid` · un `hd`
   sans `domain_identities` · un e-mail sans ligne `persons` dans le domaine désigné · une personne
   à `has_access` faux · une personne archivée. *Le droit s'éprouve par l'action, jamais par
   l'écran.* **Un panneau absent du rendu n'a jamais protégé le point d'entrée HTTP qui
   l'accompagne**, et une redirection vers l'écran « aucun accès » ne prouve pas qu'aucune session
   n'a été posée : **c'est l'absence de cookie de session, et le décompte en base, qui tranchent.**

**Mise en défaut** — **Chacun des cinq refus se neutralise pour voir tomber exactement son test, et
rien d'autre.** Cinq contre-épreuves, pas une seule : un refus qui tombe en entraînant les quatre
autres n'a pas été isolé.

**La limite de mesure, écrite avant d'être rencontrée.** L'arbitrage (2) refuse les comptes sans
`hd` ni `tid`, et **une adresse personnelle n'en porte aucun**. Conséquence directe : avec un compte
Google personnel, **le chemin du super administrateur se parcourt en vrai** — la règle 2 consulte
`super_admins` avant toute recherche de domaine, précisément pour cela —, mais **le chemin d'un
membre de domaine ne se parcourt pas au navigateur**. Il se mesure **sur claims forgés**, ce qui est
déjà la forme des cinq refus ci-dessus : aucun d'eux ne dépend d'une connexion réelle. `/dev/session`
reste, et le produit se parcourt en local sous n'importe quelle identité. Le jour où un vrai client
existe, son `hd` entre dans `domain_identities` **et le chemin s'ouvre sans une ligne de code** —
c'est ce que la table achète.

**Interdits** — **Aucune modification des droits de `session.ts`** : `rightsFor`, `loadSession` et
`listAccounts` restent tels quels, et les toucher serait le signe que la séparation de C1 a échoué.
**Aucun écran du produit touché** — si un seul bouge, le ticket s'arrête et le dit.
**`/dev/session` reste**, 404 en production : c'est le seul endroit où l'on change de personne
courante en développement, et le SSO ne le remplace pas. **Aucun écran de gestion de domaines** :
c'est T9.4.

---

## T9.3 — Le droit du super administrateur

**Objectif** — Les trois fonctions de `superAdmin` (`lib/db/scoped.ts:891`) créent, lisent et
listent des domaines **sans aucune authentification**. `ETAT.md` le dit depuis le découpage de C8 :
*« `superAdmin` n'est pas un rôle : trois fonctions sans aucune authentification. »* Tant qu'aucun
écran ne les appelait, le fait était sans conséquence. **T9.4 les appellera** : le droit passe
avant l'écran, et pas après.

**Périmètre** — `lib/db/scoped.ts` et son test ; `lib/auth/` pour le droit lui-même. **Aucun
composant, aucune page.**

**Attendu** — Un droit nommé, lu depuis la session, et une garde sur chaque fonction qui écrit.
`findDomain` et `listDomains` sont appelées par `loadCurrentSession` **avant** qu'une session
existe : le ticket distingue ce qui doit rester ouvert au chargement de session de ce qui exige un
droit, et **écrit cette distinction** plutôt que de la subir.

**Validation** — **Par l'action, en `text/plain`, avec étape témoin.** Un appel sans super
administrateur **ne crée pas de ligne**, et **c'est le décompte en base qui tranche, jamais le code
HTTP** : T6.1 a mesuré un archivage refusé qui rend 200, exactement comme celui qui réussit. Trois
« 200 muets » ont déjà été payés faute d'étape témoin — l'étape témoin n'est pas optionnelle.

**Mise en défaut** — La garde retirée, l'appel non authentifié crée la ligne : **le test qui vient
de passer doit tomber**. Un test de droit qui passe aussi bien avec qu'sans la garde ne teste rien.

**Interdits** — **Aucun écran.** Ce ticket protège un point d'entrée, il n'en rend aucun. Aucune
quatrième fonction ajoutée à `superAdmin` — celles de T9.1 suffisent.

---

## T9.4 — L'écran au-dessus des domaines

**Condition d'ouverture** — **la levée de l'exclusion de `docs/05` §4**, *« interface
d'administration multi-domaine : un seul domaine au POC »*, et de `docs/05` §3, *« domaine unique …
amorçage par script »*. `docs/` est figé : soit ces lignes sont récrites par une main humaine, soit
l'écart est explicitement autorisé et consigné. **C'est le seul ticket du chantier que cette
condition bloque.**

**Objectif** — Créer une entreprise, la suspendre, l'archiver, saisir ses identités vérifiées,
désigner son premier responsable de domaine.

**Périmètre** — Une section neuve sous `app/`, ses actions et leurs tests ; `lib/queries/` pour ses
lectures ; les composants de socle **réutilisés**, jamais réécrits — `PageHeader`, `BlockHeader`,
le socle des panneaux de TD.1, `Button`.

**Attendu** — Quatre gestes : la liste des domaines avec leur état · la création, qui saisit le nom,
le libellé du centre et **au moins une identité vérifiée** · la suspension et le rétablissement,
`domains.status` portant déjà `active` et `suspended` · l'archivage, `archived_at` existant. **Rien
à ajouter au schéma** — c'est la mesure de ce que T9.1 a bien posé.

**La désignation du premier responsable** est le geste sans lequel un domaine créé reste
inaccessible : une entreprise sans aucune ligne `persons` à `has_access` vrai n'ouvre aucune
session, par la règle 6.

**Validation** — **Le critère se lit dans le HTML servi**, `<script>` retirés, le HTML de
développement n'étant pas déterministe (leçon de TD.3). **Le contraste se mesure** sur tout couple
de couleurs neuf par la position — c'est la position qui décide du jeton, jamais la provenance
(leçon de T5.4). Et **le droit s'éprouve par l'action** : un responsable de domaine, qui n'est pas
super administrateur, **ne crée pas de domaine** — mesuré en base, pas à l'écran.

**Mise en défaut** — L'écran retiré, la garde de T9.3 tient toujours : c'est ce qui prouve que le
droit ne dépend pas du rendu.

**Interdits** — **Aucune suppression** : archivage seul (règle 4, qui vaut pour un domaine comme
pour le reste), et **`domains` n'entre pas dans `DeletableTable`** — ajouter une table à cette liste
est un arbitrage humain, jamais une décision de ticket. **Aucun indice calculé** qualifiant une
entreprise (D39) : ni nombre de projets, ni fraîcheur, ni jauge. **Aucun accès aux données d'un
domaine depuis cet écran** — il administre des domaines, il ne les traverse pas.

---

## T9.5 — L'amorçage d'un domaine neuf

**Objectif** — `docs/04` §2 écrit *« créer un domaine déclenche l'amorçage de ses référentiels par
défaut »*. C'est aujourd'hui `scripts/seed.ts`, lancé à la main, et `docs/05` §3 le disait en toutes
lettres : *« pas d'interface d'administration : amorçage par script. »* Le domaine créé en T9.4
naît vide ; ce ticket le fait naître utilisable.

**Périmètre** — `scripts/seed.ts` **en lecture d'abord** ; l'extraction de ses référentiels vers un
module appelable par l'action de création ; l'action de T9.4 ; les tests.

**Attendu** — Les neuf référentiels d'un domaine neuf, et **le mécanisme de rapprochement du script
réutilisé tel quel** — clé naturelle › `position` › `formerKeys`, les trois temps que T8.4 a posés,
du plus sûr au plus faible. **Sa limite connue reste écrite plutôt que contournée** : `tools` n'a
pas d'ordinal, donc un renommage en base y recrée encore, et refermer ce résidu demanderait une
colonne — donc une migration, que les interdits communs posent en signal d'arrêt.

**La séparation à tenir** : les **référentiels** viennent de `docs/02` §3-4, `docs/03` §2 et
`docs/04` §2 ; les **données factices** viennent de `docs/design/brief-design.md` §7 et **restent au
script**. Un domaine créé par l'écran reçoit les premiers, jamais les secondes.

**Validation** — **Comptés en base** : un domaine créé par l'écran porte ses neuf référentiels.
**Deux créations successives ne laissent aucune ligne en double** — c'est la propriété que T8.4 a
mesurée, rejouée ici sur le chemin de l'écran. Et `npm run db:seed` **reste rejouable** : le script
ne perd rien à l'extraction.

**Mise en défaut** — Un référentiel retiré du module fait tomber le décompte, et lui seul.

**Interdits** — **Aucune donnée factice** dans un domaine créé par l'écran. **Aucune personne
créée** — c'est T9.4 qui désigne le premier responsable, et il est saisi, pas inventé. Aucune
modification du jeu de démonstration.

---

## T9.6 — Les comptes d'un domaine : qui se connecte, et avec quel rôle

**Ajouté le 06/09/2026, après le découpage.** Le trou a été trouvé en confrontant une question
humaine — *« pourrai-je ajouter des administrateurs dans un domaine ? »* — au code, et non à la
fiche. **La réponse était non**, et T9.4 seul l'aurait laissée non.

**Objectif** — **Aucun écran de Vision n'écrit `has_access` ni `domain_role`.** Le seul lieu de
création d'une personne, `app/(app)/equipe/actions.ts:321`, force en dur `hasAccess: false` et
`domainRole: null`, sous un commentaire qui dit *« son compte est l'affaire de C7 »* — **et C7 ne
l'a jamais fait**. `lib/forms/person.ts` le redit à sa manière : *« `source`, `has_access`,
`domain_role` et `is_active` n'y figurent pas … les trois autres appartiennent à l'authentification
(C7) »*. Toutes les personnes qui peuvent se connecter aujourd'hui viennent de `scripts/seed.ts`.

**Sans ce ticket, un domaine créé par T9.4 porterait exactement un compte, définitivement.**

**Et un second manque, mesuré au même endroit, qui rend le premier inopérant s'il est laissé :**
**`email` n'est écrit par aucun formulaire.** Le mot n'apparaît ni dans `lib/forms/person.ts` — dont
le `PersonRowInput` porte `fullName`, `jobId`, `kind` et `bio`, et rien d'autre — ni nulle part sous
`app/(app)/equipe/`. Une personne créée dans Vision a donc `email = null`. Or **la règle 6 de T9.2
rapproche une identité sur l'e-mail au premier passage** : sans lui, un accès accordé ne servirait à
personne. Les deux manques sont indissociables, et c'est pourquoi ils tiennent dans un seul ticket.

**Périmètre** — `lib/forms/person.ts` et son test ; `app/(app)/equipe/actions.ts` et son test ;
`app/(app)/equipe/drawers.tsx` ; les composants de saisie de l'équipe. **Aucune migration** : les
trois colonnes existent depuis C1.

**Attendu** — Trois gestes.

**1. L'e-mail entre dans le formulaire de personne.** Facultatif tant qu'aucun accès n'est accordé —
une personne référencée n'a pas besoin d'adresse (D19) —, **obligatoire au moment où l'accès l'est**.

**2. Accorder l'accès, avec son rôle.** `has_access` et `domain_role` **se posent ensemble, jamais
séparément** : la contrainte `persons_role_requires_access` l'exige — *accès sans rôle* et *rôle sans
accès* sont tous deux refusés par la base. Deux rôles au choix, `domain_manager` et `member`, et
**pas un troisième** : un super administrateur ne vit pas dans `persons` (arbitrage 4).

**3. Retirer l'accès.** `has_access` à faux **et** `domain_role` à nul, dans la même écriture.

**Trois garde-fous, et chacun a sa source :**

- **Un intervenant côté entité ne reçoit jamais d'accès.** `docs/05` §4 exclut *« l'accès des
  commanditaires côté entité »*, décidé en F1 (D2) : *« la page projet est conçue lisible par eux,
  sans leur être ouverte »*. Le refus porte donc sur `kind === "stakeholder"`, et il s'éprouve par
  l'action, pas par l'absence du bouton.
- **Le dernier responsable d'un domaine ne se rétrograde pas**, et **ne se retire pas non plus** —
  sans quoi le domaine deviendrait inadministrable, et **rien dans Vision ne permettrait de le
  rouvrir** : le super administrateur crée des domaines, il n'entre pas dedans.
- **Une personne archivée ne reçoit pas d'accès.** `loadSession` la refuse déjà ; lui accorder un
  accès qu'elle ne pourra pas exercer serait écrire une contradiction en base.

**Le droit du geste est `manageDomain`** — c'est déjà celui de `createPerson` et d'`updatePerson`.
Un responsable de domaine désigne donc les responsables suivants, ce qui est exactement ce que
`docs/02` §3 lui donne : *« désigner les contributeurs d'un projet, gérer les référentiels et les
membres »*.

**Le journal reçoit le geste.** `person` est déjà un `event_target_type` et `updatePerson` écrit une
ligne ; accorder ou retirer un accès est un fait plus lourd qu'un changement de nom. **Un verbe
existant est réemployé** — aucune migration d'énuméré, c'est l'interdit commun.

**Validation** — Quatre mesures, et la première seule ne suffit pas.

1. **Lu dans le HTML servi**, `<script>` retirés : le rôle d'une personne se lit sur l'écran Équipe.
2. **Le couple se pose et se retire ensemble, mesuré en base** : jamais une ligne avec `has_access`
   vrai et `domain_role` nul, ni l'inverse — c'est la contrainte, et elle se constate.
3. **Les trois refus, éprouvés séparément par l'action**, en `text/plain`, avec étape témoin : un
   `stakeholder` promu · le dernier `domain_manager` rétrogradé · le même retiré. **Le décompte en
   base tranche, jamais le code HTTP** — un refus rend 200 comme une réussite (leçon de T6.1).
4. **La boucle entière, et c'est le critère qui compte** : une personne créée par l'écran, dotée
   d'un e-mail, reçoit `member`, **et apparaît alors dans `listAccounts`** — donc dans
   `/dev/session`, donc elle pourrait se connecter. **C'est la seule mesure qui prouve que le ticket
   sert à quelque chose** ; les trois autres prouvent qu'il ne casse rien.

**Mise en défaut** — Chacun des trois garde-fous se neutralise pour voir tomber **son** test, et rien
d'autre. Et l'e-mail retiré du formulaire fait tomber la mesure 4, jamais les autres.

**Interdits** — **Aucune migration** : les trois colonnes existent. **Aucun troisième rôle.**
**Aucun accès accordé à la création** — une personne naît sans compte, D19 tenant depuis C1, et le
geste reste **explicite et séparé**. **Aucun envoi de courriel, aucune invitation, aucune
notification** : Vision montre le fait, elle ne relance pas. **Aucune écriture de `is_active`**, qui
est une désactivation d'annuaire et non un droit — la troisième colonne du commentaire de
`lib/forms/person.ts` reste hors périmètre, et le ticket le dit.

**Et deux commentaires faux à corriger, parce que ce ticket est celui qui les rend faux** :
`app/(app)/equipe/actions.ts:317` — *« son compte est l'affaire de C7 »* — et
`lib/forms/person.ts:199` — *« appartiennent à l'authentification (C7) »*. **Sixième et septième
énoncés de la famille des promesses faites à C7** ; un commentaire faux vaut une ligne de code
fausse (leçon de T7.5).

---

## Ce que C9 ne fait pas, et ce sont des décisions

**Le RLS** — arbitrage (6), destination récrite : *le jour où le pilote de base expose la
transaction interactive*, avec la dette de T3.6.

**L'import d'annuaire.** `docs/05` §3 l'annonce au socle — *« import des personnes du centre »* — et
il n'a jamais été fait ; C9 ne le fait pas non plus. Le SSO **rapproche** une identité d'une ligne
`persons` existante, il ne peuple pas la table. La portée `User.Read` de Microsoft Graph et les
autorisations qui vont avec sont hors chantier, comme la synchronisation SharePoint que `docs/05`
§4 exclut déjà pour la même raison — des autorisations longues à obtenir.

**Le thème par domaine.** `docs/05` §4 l'exclut, et le multi-domaine ne le rouvre pas : la règle 2
tient depuis C1 pour que ce soit possible un jour, pas pour que ce soit fait maintenant.

**La reprise de C7.** T7.7 → T7.10 restent écrits dans `tickets-C7.md` et gardent leur fiche. C9
passe devant sur décision humaine du 06/09/2026 — **second écart à `docs/05` §6**, *« un chantier à
la fois, fermé avant d'ouvrir le suivant »*, le premier ayant été consigné au découpage de C8.

**La rotation des secrets Neon.** Reportée aux découpages de C6, C7 et C8, chaque fois faute de
chantier qui en dépende. **C9 est le premier qui touche aux secrets de toute façon** — mais c'est
un geste humain, pas un ticket.

---

## Vérification de fin de chantier

Les quatre disciplines du protocole, sans rappel :

1. **Le critère se lit dans le HTML servi**, jamais il ne s'affirme — `curl` sur l'adresse,
   `<script>` retirés.
2. **Les tests se mettent en défaut** avant d'être crus : neutraliser la règle, voir tomber
   exactement les tests attendus, et rien d'autre.
3. **Le contraste se mesure** sur tout couple de couleurs neuf par la position.
4. **Le droit s'éprouve par l'action**, jamais par l'écran, avec étape témoin, en `text/plain`.

**Trois tickets dérogent au premier point, et le disent.** T9.1 ne rend aucun écran : son critère
est une contrainte mesurée en base. T9.2 se lit dans un code de réponse et un en-tête `Location`.
T9.3 ne rend aucun écran non plus : son critère est un décompte en base après un appel refusé.

**Et une discipline propre à ce chantier.** C'est le premier où une erreur silencieuse ouvre les
données d'une entreprise à une autre. **Deux mesures ne se remplacent pas l'une l'autre** : qu'un
jeton soit refusé se lit dans la réponse, mais **qu'aucune session n'ait été posée se lit dans le
cookie et dans la base**. Un refus affiché sans cookie vérifié n'est pas un refus vérifié.

En fin de chantier : `npm run lint` (`--max-warnings=0`), `npm run test` et `tsc` au vert. **Le vert
de référence est 1 646 tests sur 55 fichiers**, relevé par T8.1 et inchangé depuis T8.3 — chaque
ticket y compare le sien, jamais à un souvenir. **Puis C7 reprend**, T7.7 → T7.10, et le POC est
complet le jour où il se referme.
