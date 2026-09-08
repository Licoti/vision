# Actions humaines — chantier C9

**Ce que Claude ne peut pas faire, et qui bloque ou fragilise la suite du chantier.**

Ce fichier ne figure pas dans le tableau « Où écrire quoi » du `CLAUDE.md` : il est une liste de
travail, pas une fondation. Il se vide au fur et à mesure et **se supprime à la clôture de C9** —
ce qui resterait ouvert repartirait alors dans le groupe (a) d'`ETAT.md`, qui en est la source.

Établi le 06/09/2026, après T9.2. Chaque point dit **ce qui est bloqué** sans lui.
**Plus aucun point n'empêche un ticket de s'ouvrir** depuis la levée du 06/09/2026, en bas de page.

**Relu et mesuré le 08/09/2026, C9 étant clos** (T9.1 → T9.6, 1 824 tests sur 64 fichiers). Deux
points sont tombés — le premier super administrateur **existe en base**, et le refus de Microsoft
n'est plus une panne. **Quatre restent, tous humains** : les secrets Neon, les énoncés périmés de
`CLAUDE.md` et `docs/01`, l'adresse de rappel de production, et Microsoft le jour où un client
l'impose. Le fichier ne se supprime donc pas encore : ce qui reste ici doit d'abord passer dans le
groupe (a) d'`ETAT.md`, qui en est la source.

---

## 1. Poser le premier super administrateur — **bloque l'usage de T9.4**

```
npm run auth:super-admin -- --email=votre.adresse@exemple.com --nom="Votre Nom"
```

L'adresse est **celle que le fournisseur vérifiera** — pas celle qu'on aimerait avoir. Une adresse
personnelle convient et c'est même le cas intéressant : elle ne porte ni `hd` ni `tid`, et
l'arbitrage (2) refuse un tel compte **sauf** s'il est super administrateur (règle d'entrée 2). Ce
chemin est donc **le seul parcourable en vrai au navigateur** aujourd'hui.

Le script est rejouable : une seconde pose met le nom à jour et rétablit une ligne archivée.

**Fait — mesuré le 08/09/2026 : `super_admins` porte une ligne vivante.** Cette page disait *« la
table est vide »*, ce qui était vrai à l'écriture de T9.2 et faux depuis. **Le chemin du super
administrateur est donc le seul parcourable en vrai au navigateur aujourd'hui**, et il l'est
vraiment : connexion Google, puis `/domaines`.

> Sans lui : personne ne crée le premier domaine en T9.4, et l'écran resterait invérifiable.

---

## 2. Tourner les secrets Neon — **reporté quatre fois**

Deux chaînes de connexion ont transité **en clair** dans un fil de discussion le 12/08/2026. Elles
sont hors du dépôt, mais toujours valides. Le report a été décidé aux découpages de C6, C7 et C8
faute de chantier qui en dépende — **la raison ne tient plus depuis C9**, qui touche aux secrets.

> **Le geste :** régénérer `DATABASE_URL` et `TEST_DATABASE_URL` depuis la console Neon, les
> remplacer dans `.env.local`, et **relancer `npm run test`** — la suite écrit en base réelle sur
> la branche de test, elle dira tout de suite si une chaîne est fausse.

---

## 3. `CLAUDE.md` et `docs/01` — trois énoncés périmés

**Règle 7 : `CLAUDE.md` n'est écrit que par vous.** Aucun des trois ne bloque un ticket.

| Où | Ce qui est écrit | Ce qui est vrai |
|---|---|---|
| tableau du vocabulaire | « Statut de projet » | l'écran dit **« Statuts d'accompagnement »** |
| tableau du vocabulaire | l'entrée « Projet » | le menu affiche **« Accompagnements »** (02/09) |
| § Stack et conventions | *« Entra ID le remplacera en C7 »* | **c'est Google qui l'a remplacé, en C9** |

Le troisième a empiré avec T9.2 : il se trompait de chantier, il se trompe désormais aussi de
fournisseur. **Même écart dans `docs/01` §141** (*« environnement Microsoft »*) — et la levée du
06/09/2026 donne la forme à suivre : une ligne amendée et datée, pas un document récrit.

---

## 4. Enregistrer l'adresse de rappel de production — **avant tout déploiement**

`AUTH_URL` vaut `http://localhost:3000` dans `.env.local`. Elle construit la `redirect_uri`, que
Google compare **au caractère près** à celle enregistrée en console.

> **Le geste, le jour du déploiement Netlify :** ajouter l'URI de production
> `https://<domaine>/auth/callback/google` aux *Authorized redirect URIs* du client OAuth, et poser
> `AUTH_URL=https://<domaine>` dans les variables d'environnement Netlify — **avec `AUTH_SECRET`,
> `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`**, qui n'y sont pas encore.

Rappel mesuré : un `AUTH_SECRET` de moins de 32 caractères fait lever `lib/auth/cookie.ts`. C'est
volontaire — un secret court signe un cookie qu'on peut forger, et un cookie forgé n'est pas une
erreur, c'est une session.

---

## 5. Microsoft, le jour où un client l'impose — **non bloquant, mais non éprouvé**

La couche est écrite pour deux fournisseurs et **en sert un**. Entra ID Free demande une carte
bancaire à fin de vérification d'identité — non débitée —, et *« only paid customers can create a
new Workforce tenant »* : les valeurs n'existent pas.

**Ce qui a été mesuré de Microsoft** : la découverte aboutit, et l'adresse d'autorisation est bien
`login.microsoftonline.com/organizations/oauth2/v2.0/authorize`, avec les trois portées, PKCE et
`nonce`.
**Ce qui ne l'a pas été** : l'échange du code, la substitution d'émetteur que son gabarit
`{tenantid}` impose, et le claim `tid`. **La promesse « deux valeurs de plus, jamais une reprise »
est donc une hypothèse, pas un fait.**

**Et jusqu'au 08/09/2026, l'écran d'entrée proposait quand même son bouton** :
`GET /auth/connexion?fournisseur=microsoft` rendait **500** — `required()` levait
`ProviderConfigError`, et cette route n'avait personne pour la rattraper. **Mesuré, puis corrigé
hors ticket** : l'écran ne propose que les fournisseurs **raccordés**, et un fournisseur sans ses
deux valeurs se traite comme un fournisseur inconnu — retour à l'écran d'entrée, jamais une erreur
(règle 5). Le jour où les deux valeurs entrent dans `.env.local`, **le bouton reparaît sans qu'on
touche à une ligne** : c'est ce que `isProviderConnected` achète.

Quand le moment viendra, quatre réglages de console qui ne sont pas des valeurs :

- l'inscription dit **« comptes dans n'importe quel annuaire d'organisation »**, et **pas** la
  variante *« … et comptes Microsoft personnels »*, qui contredirait l'arbitrage (2) ;
- le claim optionnel **`email`** est ajouté à l'*ID token* (`oid` et `tid` y sont déjà) ;
- les portées restent `openid`, `email`, `profile`, **sans `offline_access`** ;
- l'URI de rappel enregistrée est `<AUTH_URL>/auth/callback/microsoft`, au caractère près.

Puis deux valeurs dans `.env.local` : `ENTRA_CLIENT_ID` et `ENTRA_CLIENT_SECRET` (portail Azure ›
App registrations › Certificates & secrets › **Value**, pas *Secret ID* — noter son expiration).
`ENTRA_TENANT_ID` **n'existe pas** : c'est le claim `tid`, confronté à `domain_identities`, qui
désigne l'entreprise.

---

## 6. L'identité vérifiée du premier domaine réel — **au moment de T9.4**

Créer une entreprise en T9.4 demande **au moins une identité vérifiée** : le domaine Google
Workspace tel que le claim `hd` le rend, et/ou le `tid` Entra.

**Ce n'est jamais le domaine de l'adresse e-mail** — une adresse peut être un alias, quand `hd` et
`tid` sont vérifiés par le fournisseur. C'est toute la différence entre une frontière et son
apparence.

> À récupérer auprès du client, ou à lire dans le jeton d'un de ses comptes le jour venu.

---

## Refermé

**L'exclusion de `docs/05` §3 et §4 est levée — 06/09/2026.** C'était le seul point qui empêchait
un ticket de s'ouvrir : `docs/05` §4 excluait *« interface d'administration multi-domaine : un seul
domaine au POC »*, et §3 posait *« domaine unique … amorçage par script »*, quand T9.4 et T9.5 font
exactement ces deux choses.

**Ce n'était pas une décision de `docs/07`** — aucune de `D1` à `D41` ne la portait —, donc la
règle 6 ne s'appliquait pas : un énoncé de périmètre à amender, pas une décision à rouvrir. Et
`docs/02` §3 comme `docs/04` (`domains`) décrivaient **déjà** l'écran : seul `docs/05` l'excluait,
et du POC, pas du produit.

**Deux lignes amendées et datées, pas un document récrit** — la forme que `docs/05` demande de
lui-même : *« une demande hors périmètre n'est pas refusée, elle est datée »*. L'exclusion reste
lisible, barrée, avec sa date et sa raison. Les douze autres exclusions de §4 tiennent, thème par
domaine compris.

**T9.4 n'est donc plus bloqué**, ni T9.5 ni T9.6 derrière lui.

---

## Ce qui n'est **pas** une action humaine

Pour éviter de chercher : `AUTH_SECRET` a été régénéré le 06/09/2026 (23 → 44 caractères), et les
quatre valeurs Google sont posées et **mesurées** — le 302 part vers la bonne adresse avec la bonne
`redirect_uri`. Rien à faire de ce côté.
