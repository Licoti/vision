# vision

## le prompt pour faire les tickets

Le prompt d'une ligne suffira à Opus. Pour Sonnet, je le rendrais explicite au moins sur les trois premiers tickets, le temps de vérifier qu'il suit vraiment le protocole :

> Ticket T2.1. Applique le protocole de ticket du CLAUDE.md, les huit étapes.
> Rappels : plan mode avant toute écriture, aucun fichier hors du périmètre du ticket, arrêt après la proposition de message de commit.

## Le découpage

Trois choses à distinguer : quand découper, qui découpe, et comment cadrer la sortie.

**Quand : juste avant, jamais tout d'un coup.** Découper C3 à C7 maintenant produirait des tickets écrits sans connaître la forme réelle du code. Après C2, tu sauras comment sont structurés tes composants de liste, ta couche d'accès, tes formulaires — et les frontières de tickets seront justes. Un chantier se découpe la veille de son démarrage, en une session dédiée qui n'écrit aucun code.

**Qui : Opus pour C3, Sonnet ensuite.** C3 est le cœur du produit — la roadmap, les états, le panneau de saisie, le geste critique. C'est là que le découpage a une vraie valeur de jugement : où couper entre modèle, affichage et saisie, quoi livrer en premier pour éprouver le geste. Une fois que C3 aura établi le patron, C4, C6 et C7 sont plus mécaniques et Sonnet les découpera très bien en s'appuyant sur les tickets existants comme modèle. C5 mérite Opus aussi, à cause de la frise et de la juxtaposition des deux séries temporelles.

**Le prompt de session de découpage**

Nouvelle mécanique de découpage :

> Clôture de Cx, découpage de Cy.

Elle déclenche le chargement de CLAUDE.md (dans les deux harnais — AGENTS.md l'impose en première action sous Antigravity), puis les six gestes : trancher les points « À trancher », replier le chantier clos, sortir les points refermés, récrire ceux qui ont pris un addendum, vérifier les 250 lignes, et présenter le découpage en plan mode. Avec, désormais, l'instruction de lire docs/05 §5 et les documents de la lecture conditionnelle — qui ne valait jusqu'ici que pour les tickets.

Rappel des deux arrêts prévus : le geste 0 te posera les décisions en attente, le geste 5 te rendra un plan et non un fichier.

Une observation que je consigne parce qu'elle s'est vérifiée deux fois aujourd'hui. Les quatre manques de cette section — déclencheur, plan mode, geste 0, lecture conditionnelle — n'ont été trouvés ni en la rédigeant, ni en la relisant. Je l'avais relue et déclarée bonne. Ils sont apparus en simulant son usage : d'abord en cherchant quel prompt taper, puis en la testant sur C5 plutôt que sur C4bis. Le premier test tombait juste parce que la matière de C4bis est déjà dans ETAT.md ; c'est le chantier d'après qui a révélé le trou. Un rituel se teste sur le cas qu'il ne traite pas encore, pas sur le prochain.

État : CLAUDE.md 175 lignes, ETAT.md 242 (seuil 250), lint passe, aucun fichier applicatif touché depuis 59651c3

> Session de découpage, aucun code.
>
> Lis `CLAUDE.md`, `ETAT.md`, `tickets-C1-C2.md`, `docs/05-perimetre.md` section C3, `docs/03-accompagnement.md` et `docs/06-architecture-info.md`.
>
> Produis `tickets-C3.md` en reprenant exactement le format de `tickets-C1-C2.md` : pour chaque ticket un identifiant, un objectif en une phrase, un périmètre de fichiers, un attendu, un critère de validation vérifiable, et des interdits.
>
> Contraintes : des tickets de 30 à 60 minutes ; chacun se termine par quelque chose de vérifiable ; l'ordre doit permettre de tester le geste de saisie d'activité le plus tôt possible.
>
> **Le découpage ne crée aucun périmètre.** Tu redistribues ce que `docs/05` liste pour C3, rien de plus. Si tu penses qu'un élément manque, tu l'écris dans `JOURNAL-TECHNIQUE.md` au lieu de l'ajouter.
>
> Plan mode d'abord : présente-moi la liste des tickets et leur ordre avant d'écrire le fichier.

La dernière contrainte est celle qui compte. Sans elle, une session de découpage invente des tickets — journalisation, exports, écrans d'administration — en toute bonne foi, et le périmètre du POC se dilate avant même qu'une ligne soit écrite.

**Un ajout au `CLAUDE.md`**, à faire toi-même quand tu voudras :

> ## Sessions de découpage
> Un chantier se découpe juste avant son démarrage, dans une session dédiée qui n'écrit aucun code, au format de `tickets-C1-C2.md`. Le découpage redistribue le périmètre défini dans `docs/05-perimetre.md`, il ne l'élargit jamais.

Et pense à mettre à jour `ETAT.md` au passage : remplacer « à découper » par « à découper — session dédiée avant démarrage » évite qu'un ticket lambda s'y attaque au passage.