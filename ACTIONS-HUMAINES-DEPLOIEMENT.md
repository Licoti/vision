# Actions humaines — la mise en ligne

**Ce que Claude ne peut pas faire : tout ce qui se passe dans une console.**

Ce fichier ne figure pas dans le tableau « Où écrire quoi » du `CLAUDE.md` : il est une liste de
travail, pas une fondation. Il se vide au fur et à mesure et **se supprime le jour où le site est en
ligne et mesuré** — ce qui resterait ouvert repartirait alors dans le groupe (a) d'`ETAT.md`, qui en
est la source.

Établi le 12/09/2026. Il **rassemble** les deux points « avant tout déploiement » déjà écrits —
`ACTIONS-HUMAINES-C9.md` §4 (l'adresse de rappel et les trois secrets) et
`ACTIONS-HUMAINES-C11.md` §2 (les deux valeurs de courriel) — plutôt que de les recopier, et y
ajoute ce qu'aucun des deux ne dit : l'ordre des gestes, et ce qui se mesure une fois faits.

**Deux choses sont déjà dans le dépôt** et ne demandent rien : l'exclusion du scanner de secrets
(`netlify.toml`), et le fait que `NODE_VERSION = "24"` soit désormais le défaut de Netlify.

**Un choix est arrêté : la production sert la base Neon actuelle.** Les vingt migrations y sont
appliquées, le jeu de démonstration y est semé, et `super_admins` porte une ligne vivante depuis le
08/09/2026. Rien à provisionner — et le corollaire, qui compte : **dev et prod écrivent au même
endroit**, un `npm run db:seed` en local touchera la base servie en ligne.

---

## 1. Avant de brancher Netlify — trois gestes locaux

**Committer et pousser.** Netlify construit ce que porte `main` sur `github.com/Licoti/vision`, rien
d'autre. Un fichier modifié et non poussé n'existe pas pour le build.

**Mesurer le build en local** — `npm run build`. Il n'a jamais tourné dans ce dépôt. Un build rouge
ici est un build rouge chez Netlify, en dix fois moins de temps.

**Tourner les secrets Neon** — recommandé, pas bloquant, et c'est le plus vieux point ouvert de la
liste (`ACTIONS-HUMAINES-C9.md` §2, reporté cinq fois). Deux chaînes ont transité en clair le
12/08/2026 ; les poser en ligne les répand d'un cran. Régénérer depuis la console Neon, remplacer
dans `.env.local`, puis `npm run test` — la suite écrit en base réelle sur la branche de test, elle
dira tout de suite si une chaîne est fausse.

---

## 2. Créer le site — **Netlify › Add new site › Import an existing project › GitHub › `Licoti/vision`**

Branche de production : `main`. **Ne rien saisir dans le formulaire de build** : `netlify.toml`
porte déjà la commande, le dossier publié et l'adaptateur, et le fichier est prioritaire sur
l'interface.

---

## 3. Les variables d'environnement — **avant le premier build, pas après**

`lib/db/client.ts` lève à l'import si `DATABASE_URL` est absente : un build sans elle échoue. Les
poser dans *Site configuration › Environment variables*, en laissant la portée par défaut (*All
scopes*) — la valeur est lue à la construction **et** à l'exécution.

| Clé | Valeur |
|---|---|
| `DATABASE_URL` | la chaîne Neon de `.env.local` |
| `AUTH_SECRET` | celle de `.env.local`, ou `openssl rand -base64 32` |
| `AUTH_URL` | `https://<domaine>`, **sans barre finale** |
| `GOOGLE_CLIENT_ID` | console Google |
| `GOOGLE_CLIENT_SECRET` | console Google |
| `RESEND_API_KEY` | facultative |
| `MAIL_FROM` | facultative, **indissociable de la précédente** |

**`TEST_DATABASE_URL` n'a rien à faire en ligne** : elle n'existe que pour `vitest`.

**`AUTH_SECRET` fait 44 caractères.** En deçà de 32, `lib/auth/cookie.ts` refuse de signer, et c'est
volontaire : un secret court signe un cookie qu'on peut forger, et un cookie forgé n'est pas une
erreur, c'est une session.

**Les deux valeurs de courriel se posent ensemble ou pas du tout** — `isMailConnected()` exige les
deux, pour la raison qui vaut déjà chez les fournisseurs d'identité : à demi renseigné, l'envoi
échouerait *après* que le geste a cru pouvoir écrire. Sans elles, le comportement en ligne est celui
du développement d'aujourd'hui — l'invitation existe, le lien s'affiche dans le panneau, personne ne
reçoit rien. **Cohérent, mais à ne pas découvrir le jour où l'on croyait avoir invité quelqu'un.**

---

## 4. `AUTH_URL` et l'URI de rappel — **la même chaîne, des deux côtés**

`lib/auth/oidc.ts` construit la `redirect_uri` depuis `AUTH_URL`, et Google compare les deux chaînes
**au caractère près**. Ajouter aux *Authorized redirect URIs* du client OAuth (Google Cloud Console ›
Credentials) :

```
https://<domaine>/auth/callback/google
```

**Garder `http://localhost:3000/auth/callback/google` à côté** : les deux coexistent, et c'est ce
qui permet de continuer à développer.

`AUTH_URL` est l'œuf et la poule — le domaine n'est connu qu'une fois le site créé. Fixer d'abord le
domaine définitif (*Site configuration › Domain management*), puis poser la valeur une seule fois,
évite un aller-retour côté Google.

**Aucune prévisualisation ne passera le SSO** : un *deploy preview* reçoit une URL unique, et aucun
fournisseur n'accepte de joker dans une URI de redirection. Le SSO se parcourt en local ou en
production, jamais entre les deux.

---

## 5. Mesurer, quatre fois — **et ce n'est pas une formalité**

| Ce qu'on vérifie | Le geste | L'attendu |
|---|---|---|
| Le site répond | ouvrir `https://<domaine>` | redirection vers `/auth/acces` |
| L'entrée fonctionne | le bouton Google, avec l'adresse du super administrateur | arrivée sur `/domaines` |
| L'outil de développement est clos | `curl -I https://<domaine>/dev/session` | **404** |
| Les anciennes adresses remontent | `curl -I https://<domaine>/projets` | **308** vers `/accompagnements` |

**Le troisième est celui qui compte.** `/dev/session` est le sélecteur de personne courante : il
rend 404 quand `NODE_ENV` vaut `production`, et **cela s'éprouve par l'action, jamais par l'écran** —
une route absente de la navigation n'a jamais protégé un point d'entrée HTTP. Le quatrième éprouve
en vrai les deux redirections de `next.config.ts`, qui n'ont jamais été mesurées que sur un serveur
local.

**Une cinquième mesure, si et seulement si les deux valeurs de courriel sont posées** : inviter une
personne dont l'adresse vous appartient, et vérifier que le message arrive, que `sent_at` est daté,
et que le lien du message est celui du panneau (`ACTIONS-HUMAINES-C11.md` §3). Le `fetch` vers Resend
n'a jamais été exercé en vrai — ses quatre mesures portent sur un `fetch` espionné.

---

## 6. Ce qui peut refuser, et pourquoi

| Symptôme | Cause | Parade |
|---|---|---|
| Build refusé, *secrets detected* | le cache Turbopack, depuis Next 16.3 | l'exclusion de `netlify.toml` — c'est exactement ce qu'elle achète |
| Build rouge, *DATABASE_URL est absente* | variable absente, ou portée restreinte à *Functions* | la poser en *All scopes*, puis *Clear cache and deploy* |
| `redirect_uri_mismatch` | `AUTH_URL` et l'URI enregistrée diffèrent — barre finale, `http`/`https`, `.netlify.app` contre domaine propre | aligner les deux, au caractère près |
| 500 à l'entrée | `AUTH_SECRET` absente ou trop courte | `openssl rand -base64 32` |
| Aucun courriel ne part | `RESEND_API_KEY`/`MAIL_FROM` absentes | **comportement attendu**, pas une panne : le lien s'affiche dans le panneau |

---

## Ce qui n'est **pas** une action de mise en ligne

Pour éviter de chercher : **Microsoft reste non branché** et le restera tant qu'Entra ID Free
demandera une carte bancaire (`ACTIONS-HUMAINES-C9.md` §5) — l'écran d'entrée ne propose que les
fournisseurs raccordés, un site en ligne n'y change rien. Et **rien ne se joue côté base** : ni
`db:migrate`, ni `db:seed`, ni `auth:super-admin`.
