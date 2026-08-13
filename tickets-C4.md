# Tickets — C4

Un ticket = une session de CLI. Chaque ticket porte un objectif, un périmètre de fichiers, un
critère de validation vérifiable et ses interdits.

**Règle commune à tous les tickets :** ne modifier aucun fichier hors du périmètre annoncé, ne
créer aucune fonctionnalité non listée, mettre à jour `ETAT.md` en fin de ticket.

---

# C4 — Ressources et résultats · **Sonnet**, T4.4 sur **Opus**

Le premier chantier d'après le POC minimal démontrable. `docs/05` §5 lui donne une phrase —
*« rattachement au projet et à l'activité, saisie déclarative des résultats d'audit, liens vers les
outils »* — et sa table §3 deux lignes : **Résultats d'audit** *(libellé, valeur, unité, date, lien
vers l'outil)* et **Ressources** *(lien, titre, type saisi, rattachement facultatif à une
activité)*. Il n'y a rien d'autre à distribuer, et les quatre tickets ne distribuent rien d'autre.

C'est le chantier qui **ferme la boucle minimale** de `docs/05` §2 : *« un contributeur ouvre
Vision, trouve son projet, saisit l'activité qu'il vient de terminer, **attache le lien de sa
restitution**, et repart. »* C3 a livré la première moitié de ce geste ; C4 livre la seconde. L'ordre
des quatre tickets en découle : **la ressource avant le résultat**, parce que c'est elle qui ferme
la boucle, et dans les deux cas **la lecture avant l'écriture**, parce qu'un écran d'écriture ne se
vérifie que sur l'écran qui l'affiche — la discipline tenue depuis T2.1, un critère lu dans le HTML
servi. **T4.2 rend le geste testable de bout en bout**, au deuxième ticket sur quatre.

**Deux arbitrages rendus avant écriture, à ne pas rouvrir en cours de ticket.**

**(a) Aucune correction dans C4.** `docs/05` §3 écrit « création et édition » pour le projet et
« création, édition, changement d'état » pour l'activité ; pour la ressource et le résultat il
n'écrit que « saisie déclarative » et « lien, titre, type saisi, rattachement ». Le verbe manque,
donc le ticket n'existe pas. Une ressource ou un résultat mal saisi n'a aucun chemin dans
l'interface : le manque est consigné au journal, à reprendre avec le ticket d'archivage déjà attendu
en C7.

**(b) Le résultat se saisit dans un panneau dédié**, ouvert depuis l'entrée de roadmap de l'activité
terminée — la mécanique de T3.2, une action, une table. La maquette le place en pied du panneau
d'activité derrière une case « Activité terminée — ajouter un résultat » : écarté, la case ne peut
rien révéler sans JavaScript (la limite déjà rencontrée par « à planifier » en T3.3), et une seule
soumission écrirait alors deux tables sans transaction.

**Interdits communs aux quatre tickets.** Indicateur, relevé, adoption et frise du temps long (C5),
journal et liens entre projets (C6), budget (C7). Aucun fichier stocké ni téléversé — Vision
n'affiche qu'un lien (règle du produit, `docs/02` §5). Aucun détail de constat d'audit. Aucun indice
calculé par Vision à partir des résultats — moyenne, progression, écart à la cible (D39). Aucune
ressource ni aucun résultat sur la liste transverse (`docs/06` §4 : « rien d'autre ») ni sur la vue
d'ensemble. Aucune requête sortante vers l'URL saisie — ni vérification, ni aperçu, ni titre deviné.
Aucune synchronisation d'API : le POC s'en tient au niveau 1 déclaratif (D15). Aucune suppression,
aucun archivage.

## T4.1 — Bloc « Ressources » de la page projet, lecture

**Objectif** — Le bloc « Ressources » affiche les documents rattachés à l'accompagnement, à la place
de l'état vide annoncé par T2.4.

**Périmètre** — `lib/queries/resources.ts` et ses tests, `components/projects/resources.tsx`,
`components/ui/external-link.tsx`, `app/(app)/projets/[id]/page.tsx`, `lib/format.ts` pour les
libellés des sept valeurs de `resource_type`.

**Attendu** — Le bloc est le **premier** des blocs de référence, l'ordre de `docs/06` §5 étant déjà
posé depuis T2.4 : il vient après la roadmap, jamais avant. Chaque entrée porte son titre, son type
en toutes lettres et l'activité qui l'a produite si le rattachement est renseigné — c'est ce second
rattachement qui « transforme une liste de fichiers en récit lisible » (`docs/02` §5). Le titre est
un **lien sortant explicitement marqué** (`docs/06` §8) : reconnaissable avant le clic, et la marque
ne dépend jamais de la seule couleur. `components/ui/external-link.tsx` porte cette marque une fois
pour toutes ; T4.3 le reprend tel quel. L'ordre d'affichage n'est écrit nulle part : le ticket le
choisit et le consigne au journal. Un projet sans ressource affiche un état vide qui dit ce que le
bloc contiendra — un projet sans ressource est un projet normal, pas une page incomplète
(`docs/06` §5).

**Validation** — Sur « Autonomie des opérations courantes », « Restitution des tests — vague 2 »
s'affiche avec « PowerPoint » et « Test utilisateur », lu dans le HTML servi. Sur « Refonte du
parcours de virement » et « Dématérialisation de la déclaration », l'état vide s'affiche. Les
ressources d'un autre projet n'apparaissent nulle part, et les tests montrent qu'un domaine ne lit
pas les ressources d'un autre.

**Interdits** — Aucune écriture, aucune action. Aucune vignette, aucun aperçu, aucune icône de
format inventée hors du design system. Aucun compte de ressources ailleurs que dans ce bloc.

## T4.2 — Relier une ressource

**Objectif** — Attacher depuis la page projet le lien d'un document hébergé ailleurs, en moins d'une
minute : le geste qui ferme la boucle minimale de `docs/05` §2.

**Périmètre** — `lib/forms/resource.ts` et ses tests, `components/projects/resource-panel.tsx`,
`app/(app)/projets/[id]/actions.ts`, `app/(app)/projets/[id]/page.tsx`, `lib/navigation.ts`,
`components/projects/resources.tsx`.

**Attendu** — Panneau latéral et non page dédiée, sur la mécanique posée par T3.2 : l'ouverture est
un paramètre d'URL (`?ressource=nouvelle`), la page reste rendue derrière et porte `inert`, et
`components/ui/focus-trap.tsx` se réutilise sans être modifié. **Aucun écran de plus** : `docs/06`
§2 pose six écrans comme un plancher et exige qu'un septième soit justifié par une question à
laquelle aucun autre ne répond. **Le ticket doit rendre les deux paramètres d'ouverture mutuellement
exclusifs** — `?activite=` et `?ressource=` sur la même page, un seul panneau à la fois, un seul
`inert`. Champs : le **titre** et l'**URL**, obligatoires ; le **type**, saisi et jamais déduit de
l'URL (D21) ; l'**activité** de rattachement, facultative, parmi les activités de ce projet. L'action
et le panneau n'existent que pour qui peut écrire dans ce projet (D9), et **le droit se vérifie dans
l'action, pas seulement à l'écran** : un panneau absent du rendu n'a jamais protégé le point d'entrée
HTTP qui l'accompagne. Une saisie refusée revient dans le panneau avec ses valeurs. Le point d'entrée
est en tête du bloc, et repris dans son état vide.

**Validation** — Une ressource reliée apparaît aussitôt dans le bloc, avec son type et son activité,
lu dans le HTML servi ; le parcours est joué sans une ligne de JavaScript. Les champs récoltés chez
un responsable et repostés sous le cookie d'un membre non contributeur sont refusés, base inchangée.
Quatre refus éprouvés séparément : titre vide, URL vide, type hors de l'énuméré, activité relevant
d'un autre projet. Chez un membre non contributeur, l'action est absente des deux endroits et l'URL
d'ouverture rend la page nue.

**Interdits** — Aucun téléversement, aucun stockage, aucun aperçu du document. Aucune déduction du
type depuis l'URL (D21). Aucune saisie de `source_updated_at` : la colonne existe, `docs/05` ne la
liste pas. Aucune requête sortante vers l'URL saisie. Aucun recalcul de `last_activity_at` : la
fraîcheur se lit sur les activités depuis T2.1, et relier une ressource n'est pas une activité.
Aucune création de ressource depuis la vue d'ensemble ou la liste des projets — toujours depuis son
projet, la règle de D17 transposée.

## T4.3 — Le résultat sur l'entrée de roadmap, lecture

**Objectif** — Une activité qui porte un résultat l'affiche sur son entrée de roadmap, avec le lien
vers l'outil qui l'a produit.

**Périmètre** — `lib/queries/activities.ts` et ses tests, `components/projects/roadmap.tsx`,
`lib/format.ts`.

**Attendu** — `docs/03` §6 et `docs/06` §5 : chaque entrée affiche son type, son objectif, sa
période, son approche, « et le cas échéant son résultat avec le lien vers l'outil ». Le **contrat
unique** de `docs/02` §5 — un libellé, une valeur, une unité, une date, le nom de l'outil, un lien
profond — et **rien de plus** : Vision n'affiche jamais le détail des constats, il vit dans l'outil
qui l'a produit. Le lien reprend `components/ui/external-link.tsx` de T4.1. **Un résultat sans lien
profond est un cas normal** : la valeur s'affiche, et aucun lien mort n'est rendu — les deux
résultats de la fixture sont exactement ce cas. Le rapprochement se fait par une **seconde lecture**
et non par une jointure de plus sur `listProjectRoadmap`, pour la raison qui sépare déjà les
participants de leur activité depuis T3.6. Attention à la valeur : `results.value` est un
`numeric(18,4)`, qui se lit « 62 » et non « 62.0000 ».

**Validation** — Sur « Refonte du parcours de virement », l'Audit UX porte « Score d'audit UX ·
62/100 · 31 mai 2024 · Ergonome », lu dans le HTML servi. Sur « Autonomie des opérations courantes »,
l'Audit d'accessibilité porte « Taux de conformité · 68 % · 30 juin 2026 ». Aucune autre entrée de
roadmap ne porte de ligne de résultat, et **aucun lien sortant n'est rendu**, les deux résultats de
la fixture n'ayant pas d'adresse.

**Interdits** — Aucune écriture, aucune action. Aucun détail de constat. Aucun résultat sur la page
produit — les activités porteuses d'un résultat y sont attendues en repères de la frise, et c'est C5.
Aucune comparaison entre deux résultats, aucune évolution, aucune flèche de tendance (D39).

## T4.4 — Saisie déclarative d'un résultat

**Objectif** — Reporter dans Vision la valeur qu'un outil externe a produite, depuis l'activité
terminée qui l'a produite.

**Périmètre** — `lib/forms/result.ts` et ses tests, `components/projects/result-panel.tsx`,
`app/(app)/projets/[id]/actions.ts`, `app/(app)/projets/[id]/page.tsx`, `lib/navigation.ts`,
`components/projects/roadmap.tsx`.

**Attendu** — Le niveau 1 de `docs/03` §5 : le contributeur saisit la valeur et colle le lien vers le
rapport (D15). Panneau dédié ouvert par `?resultat=<identifiant d'activité>` depuis l'entrée de
roadmap — arbitrage (b) ci-dessus —, exclusif des deux autres paramètres comme T4.2 l'a établi.
Champs du contrat unique : **libellé**, **valeur**, **unité**, **date de mesure**, **outil** du
référentiel, **lien profond**. Le point d'entrée n'existe que sur une activité **terminée** dont le
type porte `produces_result` — le drapeau de `docs/04` §2 « conditionne la saisie d'un résultat » —,
et il disparaît une fois le résultat posé : `results_activity_unique` n'en autorise qu'un par
activité. **Le rattachement à une activité non terminée est refusé par `assertPreconditions`**, qui
porte cette règle depuis T1.3 : le ticket la donne à voir en la laissant refuser, il ne la réécrit
pas. Le droit est celui de T4.2, vérifié dans l'action. Une saisie refusée revient dans le panneau
avec ses valeurs.

**Validation** — Un résultat saisi apparaît aussitôt sur son entrée de roadmap avec son libellé, sa
valeur, son unité, sa date et son lien, lu dans le HTML servi ; le point d'entrée a disparu de cette
entrée. Le parcours est joué sans une ligne de JavaScript. Les champs récoltés chez un responsable et
repostés sous le cookie d'un membre non contributeur sont refusés, base inchangée. Cinq refus
éprouvés séparément : libellé vide, valeur qui n'est pas un nombre, date de mesure absente, activité
non terminée forgée dans la soumission, seconde saisie sur une activité qui porte déjà un résultat.

**Interdits** — Aucun résultat sur une activité qui n'est pas terminée : `docs/03` §4 en fait le seul
état qui l'autorise. Aucun second résultat sur une même activité. Aucune saisie de `external_ref` ni
de `synced_at` : ces colonnes existent pour éviter une migration le jour de l'API, elles ne portent
aucun geste au POC. Aucun appel à l'outil externe, aucun pré-remplissage depuis lui, aucun bouton de
lancement délégué — c'est le niveau 2, après le POC. Aucun détail de constat. Aucun seuil, aucun code
couleur de bon ou mauvais score : Vision reporte une valeur, elle ne la juge pas (D39).
