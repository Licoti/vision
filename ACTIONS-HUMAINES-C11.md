# Actions humaines — chantier C11

**Ce que Claude ne peut pas faire, et qui laisse une moitié du parcours d'entrée non exercée.**

Ce fichier ne figure pas dans le tableau « Où écrire quoi » du `CLAUDE.md` : il est une liste de
travail, pas une fondation. Il se vide au fur et à mesure et **se supprime à la clôture de C11** —
ce qui resterait ouvert repartirait alors dans le groupe (a) d'`ETAT.md`, qui en est la source.

Établi le 08/09/2026, après T11.3. **Aucun point n'empêche un ticket de s'ouvrir** : le produit
fonctionne sans envoi, et c'est une propriété mesurée, pas une tolérance.

---

## 1. Raccorder l'envoi de courriel — **rien n'est bloqué, une moitié du parcours reste à la main**

**Ce qui marche sans rien faire.** Sans `RESEND_API_KEY`, **aucune requête sortante n'est tentée**,
l'invitation se crée quand même, `sent_at` reste nul, et le panneau affiche le lien à transmettre —
c'est l'état de T11.2, et il n'y a pas de second chemin de code. La chaîne entière — inviter, suivre
le lien, passer le SSO, obtenir l'accès — est parcourable **dès aujourd'hui**, à condition de copier
le lien à la main.

**Ce qui manque.** Le `fetch` vers Resend n'a **jamais été exercé en vrai** : ses quatre mesures
portent sur un `fetch` espionné. C'est le même état que le fournisseur Microsoft depuis C9 — écrit,
non branché, et le dire vaut mieux que de le supposer.

**Quatre gestes, dans cet ordre.**

1. **Créer le compte** sur `resend.com`. Le palier gratuit suffit au POC (100 messages par jour).
2. **Vérifier un domaine d'expédition** — `resend.com › Domains › Add Domain`, puis les
   enregistrements DNS que la console indique. **Tant qu'aucun domaine n'est vérifié**,
   `onboarding@resend.dev` reste employable, mais il **n'écrit qu'à l'adresse du compte Resend** :
   suffisant pour voir un message partir, insuffisant pour inviter qui que ce soit d'autre.
3. **Créer la clé** — `resend.com › API Keys › Create API key`, droit *Sending access*. Elle n'est
   **pas réaffichable** après création.
4. **Poser les deux valeurs dans `.env.local`** (jamais dans un fil de discussion — les deux chaînes
   Neon du 12/08/2026 y ont transité en clair) :

```
RESEND_API_KEY="re_…"
MAIL_FROM="Vision <invitations@votre-domaine.fr>"
```

**Les deux comptent.** Une clé sans expéditeur ne raccorde rien : `isMailConnected()` demande les
deux, pour la raison qui vaut déjà chez les fournisseurs d'identité — à demi renseigné, l'envoi
échouerait *après* que le geste a cru pouvoir écrire.

> Sans elles : le lien se transmet à la main, et rien d'autre ne change.

---

## 2. Les mêmes deux valeurs dans Netlify — **avant tout déploiement**

Elles rejoignent les quatre gestes de production déjà listés dans `ACTIONS-HUMAINES-C9.md` §4
(`AUTH_URL`, l'URI de rappel enregistrée en console, les trois secrets). **Un environnement en ligne
sans ces deux valeurs se comporte comme le développement d'aujourd'hui** : l'invitation existe, le
lien s'affiche, personne ne reçoit rien — ce qui est cohérent, mais ne doit pas se découvrir le jour
où l'on croyait avoir invité quelqu'un.

---

## 3. Vérifier une fois que le message part — **et lire ce qu'il dit**

Une fois les deux valeurs posées, inviter une personne dont l'adresse vous appartient, puis :

- **le message arrive** — il dit le domaine, qui invite, ce que le rôle donne, la date
  d'expiration, et rien d'autre ;
- **`sent_at` est daté** en base, et le panneau dit *« un courriel vient de partir vers … »* ;
- **le lien du message est celui du panneau** — c'est déjà mesuré par un test, jamais en vrai.

**Si l'envoi échoue**, rien n'est perdu : l'invitation reste valide, `sent_at` reste nul, le lien
reste affiché, et la cause est écrite sur la sortie d'erreur du serveur. **Aucune relance n'est
tentée, et ce n'est pas un manque** : `docs/03` §8 l'interdit, et réinviter est un geste humain qui
révoque d'abord le lien précédent.
