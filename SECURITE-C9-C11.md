# SÉCURITÉ — Contrôle de C9 et C11 (T11.6)

**Document de travail, pas fondation.** Il ne figure pas au tableau « Où écrire quoi » de
`CLAUDE.md`, comme `ACTIONS-HUMAINES-C11.md`. Il consigne un contrôle daté du **09/09/2026** ; les
failles confirmées repartent dans `ETAT.md` avec leur destination, les pièges dans
`JOURNAL-TECHNIQUE.md`.

**Ce que ce contrôle est.** Une épreuve, prise ensemble, de ce que C9 et C11 ont écrit ticket par
ticket : la connexion, le SSO, les domaines, l'étanchéité, les droits. **Il mesure, il ne corrige
pas** — sauf une faille critique (aucune trouvée). Chaque ligne porte sa mesure : la requête, la
réponse, le décompte, le verdict. Une appréciation sans mesure serait un défaut du ticket.

**Aucun secret ici.** Ni jeton en clair, ni clé, ni chaîne de connexion, ni charge de cookie
scellée — des empreintes et des décomptes. Le `client_id` Google qui apparaît dans une URL
d'autorisation est **public par construction** OAuth ; il n'est pas reproduit.

**Méthode.** Frappe **hybride**. La matrice des droits et l'étanchéité passent par le harnais du
dépôt — la fonction serveur appelée sous un cookie **réellement scellé** par `sealPrincipal`, avec
`next/headers` pour seul mock, décompte en base, étape témoin —, le paradigme déjà mesuré et jugé
« plus fort qu'une requête simulée ». S'y ajoutent des frappes **HTTP réelles** au `curl` contre
`next dev`, sur ce que l'in-process ne peut pas voir. Rien n'est frappé en ligne (rien n'est en
ligne) ; base de développement et de test seulement.

**Verdict d'ensemble.** **Aucune faille critique.** Trois trous de *couverture de test* (pas de
faille) comblés par des tests permanents (arbitrage 2). Cinq constats de durcissement, tous connus
ou attendus, consignés comme points ouverts datés. Le socle d'étanchéité (`lib/db/scoped.ts`) et le
chemin d'authentification (`lib/auth/`) tiennent leurs promesses, mesurés.

---

## Ce qui tient déjà — vérifié, pas réécrit

Huit fichiers de tests portent la sécurité de C9/C11. Le contrôle les a relus ; les compter n'est
pas les contrôler, mais dire ce qui est couvert borne ce qu'il reste à frapper.

| Fichier | Tests | Ce qu'il tient |
|---|---|---|
| `lib/auth/cookie.test.ts` | 19 | sceau HMAC, altération, troncature, mauvais secret, expiration, forme inconnue, **7 des 9 croisements de charge** (voir A) |
| `lib/auth/entry.test.ts` | 15 | la règle 2 d'abord, les huit refus, la personne d'un autre domaine |
| `lib/auth/invitation.test.ts` | 20 | les sept refus de `redeemInvitation`, l'empreinte, les 7 jours, le lien qui ne vaut qu'une fois |
| `lib/auth/session.test.ts` | 21 | droits, identités refusées, domaine désigné par le couple vérifié |
| `lib/auth/super-admin.test.ts` | 4 | sans cookie, en responsable, en super administrateur archivé |
| `lib/auth/oidc.test.ts` | 8 | le raccordement des fournisseurs, `isProviderId`, `isProviderConnected` |
| `app/auth/callback/[fournisseur]/route.test.ts` | 8 → **9** | aucun cookie sur un refus, l'ordre `resolvePrincipal`→`redeemInvitation` ; **+ handshake absent (T11.6)** |
| `lib/db/scoped.test.ts` | 81 | la frontière en lecture, écriture, jointure, archivage ; l'autorité forgée ; les compétences portées |

Les trois fichiers de tests d'action de C9/C11 portent en plus **148 tests** d'autorisation
(`app/domaines/actions.test.ts` 20, `app/(app)/equipe/actions.test.ts` 58→**61**,
`app/(app)/administration/actions.test.ts` 70).

---

## A — Le cookie et la session

**Le sceau.** Un HMAC-SHA256 sur `<base64url(json)>.<base64url(hmac)>`, `exp` **dans** la charge
signée, secret ≥ 32 caractères lu à l'usage. `open()` ne lève jamais sur une valeur reçue, compare
les longueurs avant `timingSafeEqual`. Couvert : altération d'un caractère, troncature, mauvais
secret, expiration, **charge réécrite sous l'ancienne signature** (l'escalade de `domainId` que
`cookie.test.ts` nomme « le test qui porte tout le poids »).

**La matrice de confusion des trois charges** — un seul HMAC les scelle, la distinction est
**structurelle** (les champs), pas étiquetée. Neuf croisements `open* × seal*` :

| lecteur \ charge | Principal | Handshake | Invitation |
|---|---|---|---|
| `openPrincipal` | ✓ (diag.) | **sûr, non testé** | ✓ `cookie.test.ts` |
| `openHandshake` | **sûr, non testé** | ✓ (diag.) | ✓ `cookie.test.ts` |
| `openInvitation` | ✓ `cookie.test.ts` | ✓ `cookie.test.ts` | ✓ (diag.) |

**Verdict : 7/9 couverts, 2 sûrs mais non testés — et ils ne s'ajoutent pas** (arbitrage 2). Mesuré
par lecture : `openPrincipal(sealHandshake)` rend `null` (un handshake n'a pas de `kind`), et même
la garde `kind` retirée il rendrait `null` (un handshake n'a ni `personId` ni `domainId` chaîne).
**La sonde ne peut pas se mettre en défaut → elle ne prouve rien → elle ne s'écrit pas.** Idem pour
`openHandshake(sealPrincipal)` : un principal n'a ni `state`, ni `nonce`, ni `codeVerifier`.

**Les drapeaux du cookie servi**, relevés au `curl` sur `POST /dev/session` (qui pose la même
session par les mêmes `sessionCookieOptions`) :

```
Set-Cookie: vision_session=<scellé>; Path=/; Expires=<+8h>; Max-Age=28800; HttpOnly; SameSite=lax
```

`HttpOnly` (vol par XSS impossible), `SameSite=lax` (le rappel SSO est une navigation cross-site,
`strict` perdrait le cookie), `Max-Age=28800` (8 h, une journée de travail). **`Secure` absent en
développement seulement** : `sessionCookieOptions` le pose sur `NODE_ENV === "production"`
(`lib/auth/provider.ts:65`) — vérifié par lecture, non frappable hors build de production. Verdict :
**conforme**.

**La seconde barrière** — accès retiré, personne archivée ou désactivée, domaine suspendu — est
réévaluée à **chaque requête** par `loadSession` (`lib/auth/session.ts:215-248`), et un cookie déjà
posé n'y survit pas. Couverte par `session.test.ts` (« les identités refusées », 6 cas) et
`route.test.ts` (personne archivée / domaine suspendu + lien valide restent dehors). Verdict :
**tient**.

---

## B — Le SSO

Frappes HTTP réelles sur `next dev` :

| Requête | Réponse | Verdict |
|---|---|---|
| `GET /auth/connexion?fournisseur=inconnu` | 307 → `/auth/acces` | **pas de 500** — le correctif du 08/09 tient |
| `GET /auth/connexion?fournisseur=microsoft` (non raccordé) | 307 → `/auth/acces` | idem — un fournisseur écrit mais non raccordé ne lève plus |
| `GET /auth/connexion` (absent) | 307 → `/auth/acces` | conforme |
| `GET /auth/connexion?fournisseur=google` (raccordé) | 307 → endpoint Google, `state`+`nonce`+`code_challenge` (PKCE **S256**) présents | conforme |
| `GET /auth/callback/inconnu?code=…&state=…` | 307 → `/auth/acces` | fournisseur inconnu refusé |
| **`GET /auth/callback/google?code=…&state=…` SANS handshake** | 307 → `/auth/acces`, `vision_oauth` **et** `vision_invitation` effacés, **aucune session** | **la garde `if (!handshake) return refuse()` tient** |

**Le dernier était un trou de test** (pas une faille) : `route.test.ts` posait toujours le cookie
de handshake, la garde n'était jamais éprouvée. **Test permanent ajouté** — voir « Tests ajoutés ».

**Rejeu du `code`/`state`, nonce, PKCE** : la validation vit dans `oidc.ts` (`oauth4webapi`,
`validateAuthResponse` confronte le `state`, `expectedNonce`), et `completeAuthorization` lève sur
toute anomalie — `route.ts` la traduit en `refuse()` sans distinction. La signature RS256, `iss`,
`aud`, l'expiration ne sont pas re-mesurées ici : elles relèvent de la bibliothèque, hors du code du
dépôt. **Le cookie de handshake s'efface dans tous les cas** — accepté comme refusé (mesuré :
`vision_oauth=` à l'époque Unix sur le refus ci-dessus).

**Aucune cause de refus ne se distingue** dans ce que le visiteur reçoit — tous les chemins mènent
au même `/auth/acces`. Un refus qui nommerait sa cause serait un oracle ; il n'en existe pas.

**Le chemin Microsoft reste non mesurable** — aucun locataire raccordé (`ENTRA_CLIENT_ID`/`_SECRET`
absents, point ouvert d'`ETAT.md`). Il se **déclare** tel, il ne se suppose pas correct.

**Constat de framework, positif.** Une Server Action frappée avec un `Origin` étranger est
**avortée par Next lui-même** avant d'atteindre le code applicatif :

```
`x-forwarded-host` header with value `localhost:3000` does not match `origin` header
with value `evil.example.com` … Aborting the action.
```

Mesuré sur `POST /dev/session` avec `Origin: https://evil.example.com` : 500 de framework
(application-code 9 ms), **aucun cookie posé**. La protection CSRF intégrée des Server Actions
défend le point d'entrée sans code de notre part.

---

## C — L'invitation

**Les sept refus de `redeemInvitation`** — `unknown`, `revoked`, `already_accepted`, `expired`,
`email_mismatch`, `domain_mismatch`, `person_unavailable` — sont isolés un à un par
`invitation.test.ts` (20 tests), chacun mis en défaut à part. Le domaine se **réinterroge** sur le
`hd` vérifié, jamais déduit du principal. L'ordre `resolvePrincipal`→`redeemInvitation`, et le seul
refus qu'un lien répare (`no_access`), sont tenus par `route.test.ts`.

**La page publique comme oracle**, frappée au `curl` avec trois jetons de longueurs différentes,
dont une chaîne d'injection `notauuid-injection'--` :

| Jeton | Réponse | Écran |
|---|---|---|
| 43×`a` | 200, ~14,1 ko | « Invitation indisponible » / `REFUSED` |
| 13×`b` | 200, ~14,0 ko | idem |
| `notauuid-injection'--` | 200, ~14,1 ko | idem, **aucune levée** |

**Même écran dans tous les cas** : `REFUSED` est une **constante unique** (`page.tsx:69`) — les
quatre causes (`isUsable`) ne peuvent pas diverger. Les écarts d'octets ne tiennent qu'au jeton
réémis dans la charge RSC de la route, pas à son état. **Le temps de réponse ne distingue rien** :
la première frappe coûtait 1,7 s (compilation à froid), les suivantes 0,04 s — c'est le compilateur,
pas un oracle. **L'injection ne lève pas** : le jeton est **haché** (`hashInvitationToken`) et
l'empreinte interrogée en requête paramétrée, jamais la chaîne brute. **Le cookie d'invitation
n'ouvre aucune session** (`cookie.test.ts`, `route.test.ts`). Verdict : **pas d'oracle**.

---

## D — Les droits, éprouvés par l'action

Les 58 points d'entrée × 4 identités (aucune, membre, responsable de domaine, super administrateur)
se réduisent, par les gardes partagées, à un petit nombre de règles — chacune déjà mise en défaut
avec **étape témoin** dans les trois fichiers de tests d'action, **sauf trois** (voir plus bas) :

| Fichier | Actions | Garde | Couverture |
|---|---|---|---|
| `app/domaines/actions.ts` | 9 | `requireSuperAdmin()` + `asSuperAdmin(grant)` (relit la ligne) | ✓ refus responsable/membre + témoin super admin, par groupe de gestes |
| `app/(app)/administration/actions.ts` | 38 | `requireSession()` + `manageDomain` (inline ou `openEntity`/`openReferentialRow`) | ✓ « les seize actions sous une identité sans manageDomain » ×2 + entités + `updateOwnDomain`, en boucle avec témoin |
| `app/(app)/equipe/actions.ts` | 11 | `requireSession()` + `manageDomain` (inline ou `openPerson*`) | ✓ 8/11 ; **3 non couvertes → comblées** |

**Les cinq `load*Drawer` en sont** (points d'entrée HTTP, pas détails de rendu) :
`loadProductDrawer`/`loadProjectDrawer` (`requireSession` + `isUuid` + lecture scopée),
`loadTeamDrawer`/`loadAdminDrawer` (`requireSession`, droit redérivé dans `resolve*`),
`loadDomainDrawer` (`requireSuperAdmin`). Aucun ne fait confiance à son argument — `kind` rétréci
avant la session, UUID vérifié, ligne re-cherchée scopée. Couverts par les tests de panneau des
tickets antérieurs (le refus in-process et la frappe `text/plain` de T5bis.6, T11.5).

**Le trou trouvé — et ce n'est pas une faille, c'est un défaut de couverture.** Les trois gestes de
la **compétence portée** — `createPersonSkill`, `updatePersonSkill`, `removePersonSkill` — n'étaient
frappés par **aucun test** : `lib/forms/person-skill.test.ts` n'éprouve que le *parsing* du
formulaire. Le code, lui, est **correct** : les deux portes (`openPersonForSkill`, `openPersonSkill`)
vérifient `manageDomain` en première ligne, redondamment. **Test permanent ajouté** (voir plus bas).

**Constat de framework, positif** : la charge de formulaire mal formée rend **500** (« Connection
closed. »), jamais un écrit — le piège de forme déjà nommé (T7.1). L'`$ACTION_ID_<id>` dans le
**nom** du champ est la forme sans-JS ; l'en-tête `Next-Action` est celle du fetch. Les deux ne sont
pas interchangeables.

---

## E — L'étanchéité entre domaines

C'est la famille que `docs/04` §6 nomme *« la seule faille »* en multi-domaine. **Aucune fuite
trouvée.**

**Le socle.** `forDomain(scope)` capture `domainId` en **fermeture** ; chaque méthode combine
`eq(table.domainId, domainId)` en `and()` avec la clause de l'appelant — le filtre ne se **remplace**
jamais, il se **combine**. `find`/`update`/`archive`/`unlink`/`deleteRow` sur un identifiant d'un
autre domaine rendent « n'existe pas », jamais la ligne. `assertPreconditions` refuse un parent hors
domaine à l'écriture. `lib/db/scoped.test.ts` (81 tests) éprouve la frontière en lecture, écriture,
jointure, archivage, et sur **trois clés étrangères distinctes** des compétences portées, une par
test.

**Aux points d'entrée.** Chaque action qui reçoit un identifiant le repasse par `session.db.find`
(scopé) ou une porte `openX` : administration teste « une ligne d'un autre domaine n'existe pas »,
equipe teste `revokeInvitation` frappée avec une invitation d'un **second domaine** (fixture à deux
domaines, décompte lu sur les deux : `pendingOf` inchangé). Les arguments liés par `.bind(null, id)`
n'échappent pas — l'action interroge le droit sur la **valeur reçue**, jamais sur celle qu'on lui a
liée (rappel de contexte d'`ETAT.md`, tenu depuis C6).

**La seule table non scopée est `domains`** (documenté) : elle n'est atteinte que par `superAdmin`
(lectures d'avant-session) et `asSuperAdmin(grant)` (écritures qui **relisent** la ligne). Un grant
forgé ne vaut rien (`scoped.test.ts`, `super-admin.test.ts`).

**`updateOwnDomain`** — la seule écriture d'un administrateur sur son propre domaine — **ne reçoit
aucun identifiant** : sa cible est le `domainId` de la fermeture, jamais un argument (T11.5). C'est
la conception la plus étanche du lot : rien à réécrire depuis une valeur cliente.

Verdict : **étanchéité tenue**, au socle et aux points d'entrée.

---

## F — Le transport et l'exposition

**Aucun en-tête de sécurité servi** — vérifié par lecture (aucun `headers()` dans `next.config.ts`,
aucun `[[headers]]` dans `netlify.toml`, aucun `middleware.ts`) **et** par `curl -I` :

```
$ curl -I http://localhost:3000/auth/acces
  → aucun Content-Security-Policy, Strict-Transport-Security, X-Frame-Options,
    Referrer-Policy, X-Content-Type-Options, Permissions-Policy
    (X-Powered-By: Next.js est présent — divulgation mineure)
```

**Conséquences mesurées.** La page publique d'invitation est **cadrable en iframe** (aucun
`X-Frame-Options`/CSP `frame-ancestors`) — risque de détournement de clic sur le seul écran public
neuf. Pas de HSTS — le déploiement Netlify sert en HTTPS, mais rien ne l'impose au navigateur.
**→ point ouvert daté, destination : durcissement du transport.**

**`/dev/session` et `switchPerson`.** La page rend `notFound()` en production (404), mais son action
inline `switchPerson` **ne porte aucun `requireSession`** — un écran absent ne protège pas le point
d'entrée. Sa fermeture vit dans `setCurrentPerson`, qui **lève** sur `NODE_ENV === "production"`
(`provider.ts:163`). C'était un **trou de test** (pas une faille) : aucun test ne l'éprouvait. **Test
permanent ajouté.** Mesuré aussi au `curl` en développement : `switchPerson` pose bien une session
sans cookie préalable — attendu (outil de développement), 404 en production.

**Les journaux de serveur.** Deux `console.error` dans `lib/mail/send.ts:151,160` — re-mesurés :
ils portent un **statut HTTP** et un message d'échec, **ni adresse, ni jeton, ni clé**. Propres.

---

## G — Les dépendances

`npm audit --omit=dev` (production seule), au 09/09/2026 :

| Paquet | Sévérité | Avis | Exposition réelle |
|---|---|---|---|
| `next@16.3.0` | **critique** | RCE non authentifiée sur serveurs **Windows** (`GHSA-p293-qw3h-jr36`) | **nulle** — hébergement Netlify = Linux |
| `next@16.3.0` | **critique** | RCE dans l'API d'optimisation d'images sur fichiers **AVIF** (`GHSA-2xp9-vwfh-vxw4`) | **API servie mais inexploitable ici** (voir ci-dessous) |
| `sharp@0.35.3` | haute | vulnérabilités `libheif` (`GHSA-rgj7-g3m4-5g8c`) | dépendance transitive de l'API d'images ci-dessus |

**L'exposition réelle, mesurée — et elle corrige la fiche.** La fiche annonçait *« `next/image` est
employé sur trois composants, donc l'API concernée est servie »*. **`next/image` n'est employé nulle
part** : les trois occurrences (`personas.tsx`, `persona-detail.tsx`, `use-case-detail.tsx`) sont
des **commentaires** expliquant pourquoi on l'évite (une balise `<img>` nue est servie — Vision
n'héberge aucun fichier). L'API `/_next/image` reste **servie par le framework**, mais :

```
$ curl "…/_next/image?url=https://example.com/a.avif&w=64&q=75"  → 400 "url parameter is not allowed"
$ curl "…/_next/image?url=%2Ffavicon.ico&w=64&q=75"              → 400 "not a valid image"
```

Aucun `remotePatterns` configuré (URL distant refusé), et **aucun fichier local à optimiser**
(pas de dossier `public/`). L'API ne peut donc traiter **aucun** AVIF. Exposition **résiduelle**.

**La montée en version corrige (16.3.4), mais elle est interdite ici** (arbitrage : ce n'est pas un
geste de revue, elle change le produit et demande sa propre mesure). **→ point ouvert daté.**

---

## Tests ajoutés (arbitrage 2) — chacun mis en défaut

Trois trous de **couverture** (jamais de faille) sont devenus des tests permanents. Chacun tombe
quand on neutralise la garde qu'il vise, et **rien d'autre** ne tombe avec lui.

1. **Les trois gestes de la compétence** — `app/(app)/equipe/actions.test.ts`, +3 tests.
   Membre refusé + témoin responsable, sur `createPersonSkill`, `updatePersonSkill`,
   `removePersonSkill`. **Mise en défaut** : la garde est **redondante** — neutraliser le seul
   `manageDomain` d'`openPersonSkill` ne fait **rien** tomber (`openPerson`, appelée en second,
   rattrape) ; neutraliser `openPerson` fait tomber `createPersonSkill` (sa seule garde) et 5 tests
   voisins qui la partagent ; neutraliser **les deux** fait tomber les trois, et eux seuls dans le
   bloc. *Défense en profondeur confirmée.*

2. **Le rappel SSO sans handshake** — `app/auth/callback/[fournisseur]/route.test.ts`, +1 test.
   Requête avec cookie d'invitation vivant et claims accordants, **sans** handshake → 307,
   invitation effacée, aucune session, rien en base. **Mise en défaut** : retirer
   `if (!handshake) return refuse()` fait passer le rappel à `completeAuthorization` (qui grante) —
   **un seul** test tombe.

3. **La garde de production de `setCurrentPerson`** — `lib/auth/provider.test.ts` (créé), +2 tests.
   Sous `NODE_ENV=production` : lève, aucun cookie posé ; hors production : pose la session (témoin).
   **Mise en défaut** : retirer le `throw` de production fait poser le cookie (domaine actif de
   fixture) — le test de production tombe, le témoin passe.

**Vert : 1 956 → 1 962 tests, 68 → 69 fichiers.** `npm run lint` (`--max-warnings=0`) et `tsc` au
vert.

---

## Reproductions — une commande par constat

- **En-têtes de sécurité absents** : `curl -sI http://localhost:3000/auth/acces`
- **Iframe** : une page locale avec `<iframe src="http://localhost:3000/invitation/<jeton>">` rend
- **CSRF de framework (positif)** : `POST /dev/session` + `Origin: https://evil.example.com` → avorté
- **API d'images inexploitable** : `curl "…/_next/image?url=https://x/a.avif&w=64&q=75"` → 400
- **Handshake absent** : test `un rappel sans handshake n'ouvre rien …` (`route.test.ts`)
- **Compétences non gardées (comblé)** : bloc `les trois gestes de la compétence …` (`equipe/actions.test.ts`)
- **Garde de production (comblé)** : `lib/auth/provider.test.ts`
- **Dépendances** : `npm audit --omit=dev`
