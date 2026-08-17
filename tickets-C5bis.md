# Tickets — C5bis

Un ticket = une session de CLI. Chaque ticket porte un objectif, un périmètre de fichiers, un
critère de validation vérifiable et ses interdits.

**Règle commune à tous les tickets :** ne modifier aucun fichier hors du périmètre annoncé, ne
créer aucune fonctionnalité non listée, mettre à jour `ETAT.md` en fin de ticket.

---

# C5bis — Équipe : référentiel des personnes et des compétences

**Un chantier que `docs/05` §5 n'avait pas prévu, intercalé sans décaler les autres** — le geste de
C4bis, et le même nom. Il s'ouvre après C5 et se joue avant C6, qui garde son contenu et son rang.

**Le constat qui le fonde tient en une lecture du schéma.** `persons` existe depuis T1.2 et porte un
métier (`job_id`), un genre (`kind`), un accès (`has_access`). `project_members` dit qui compose
l'équipe d'un accompagnement depuis T2.6. Mais **aucun écran ne présente une personne** : elle
n'existe que vue depuis un projet, et Vision ne sait rien de ce qu'elle sait faire. La question
« quelles personnes pourraient intervenir sur un accompagnement demandant de l'UX Research et de
l'accessibilité ? » n'a aujourd'hui aucune réponse, et aucune table où la chercher.

C5bis remplit une matrice de trois objets et de leurs gestes :

| Objet | Lire | Écrire | Ranger |
|---|---|---|---|
| Personne | T5bis.2, T5bis.4 | T5bis.6 | T5bis.6, par `archived_at` |
| Compétence portée | T5bis.2, T5bis.4, T5bis.5 | T5bis.6 | T5bis.6, par `unlink` |
| Référentiels `skills` et `skill_levels` | T5bis.1 | amorçage seul | — (D25, C7) |

**L'ordre des sept tickets va du schéma à la lecture, puis à l'écriture, puis au reste de
l'application** — le rythme de C2, C3 et C5. Le radar vient après la fiche parce qu'il ne dessine que
ce qu'elle affiche déjà en toutes lettres ; la refonte du formulaire de projet vient en dernier
parce qu'elle ne peut retirer la création d'une personne qu'une fois qu'un autre écran la porte.

---

## La dérogation, et les six garde-fous qui la bornent

`CLAUDE.md` écrit que Vision n'est pas **un outil d'évaluation des personnes**, et `docs/06` §10
interdit le classement de personnes. Un niveau de maîtrise par compétence et un radar par personne
sont, à la lettre, une évaluation de personne. **La dérogation a été demandée et accordée par
l'humain le 17/08/2026**, qui seul écrit `CLAUDE.md` : elle est consignée dans
`JOURNAL-TECHNIQUE.md`, et `CLAUDE.md`, `docs/02`, `docs/06` et `docs/07` sont amendés par lui.

Elle n'est pas générale. Elle vaut sous **six garde-fous, qui sont la fiche de chaque ticket** :

1. **Le niveau est déclaré, jamais mesuré.** C'est celui que la personne dit, recueilli par le
   responsable de domaine. Vision ne le calcule pas, ne l'audite pas, ne le date pas comme un
   résultat, ne le fait pas expirer.
2. **Aucune moyenne, aucun score global, aucun total.** Ni « 4 compétences avancées », ni indice de
   profil, ni aire du radar : ce serait exactement l'indice calculé par Vision que D39 interdit.
3. **Aucun tri des personnes par niveau, aucun classement.** Les listes s'ordonnent par nom, quelle
   que soit la recherche.
4. **Un radar, une personne.** Jamais deux profils sur un même dessin, jamais deux radars côte à
   côte sur un même écran.
5. **Le radar ne porte que les compétences que la personne déclare.** Ses axes changent donc d'une
   personne à l'autre, ce qui rend la superposition et la comparaison visuelle structurellement
   impossibles.
6. **La valeur se lit toujours en toutes lettres** à côté du dessin. Le radar ne porte jamais seul
   une information — c'est la règle de la pastille de statut (`docs/06` §11), appliquée à un
   graphique.

---

## Sept arbitrages rendus avant écriture, à ne pas rouvrir en cours de ticket

**(a) D29 tient à la lettre : la fiche est un panneau, jamais une page.** « Pas de page personne au
POC » n'est pas rouvert — aucune route `/equipe/[id]` n'existe à la fin de ce chantier. La fiche
s'ouvre par un paramètre d'URL sur `/equipe`, sur la mécanique des six panneaux existants : une URL
et non un état, la page rendue derrière et portant `inert`, les sorties en liens. Ce que D29 refusait
était un écran de plus dans la navigation ; il n'y en a pas un de plus.

**(b) Le niveau est un référentiel, la disponibilité est un énuméré.** Les deux listes n'ont pas la
même nature. L'échelle de maîtrise doit **pouvoir évoluer** — la demande l'exige en toutes lettres —
donc c'est une table du domaine, comme `project_statuses` et pour la même raison (D42 a montré ce que
coûte un référentiel qu'on croit fermé). La disponibilité, elle, est une **liste fermée de trois
valeurs** dont la logique dépendra directement le jour où elle se dérivera des accompagnements :
c'est le cas de D43, et c'est un énuméré.

**(c) Le droit d'écrire un profil est `manageDomain`, seul.** `docs/02` §Rôle donne au responsable de
domaine la gestion « des référentiels et des membres » : un profil d'équipe est l'un et l'autre.
**Aucun droit neuf n'entre dans `lib/auth/session.ts`** — `SessionRights` garde ses quatre membres,
et C7 n'aura pas un droit de plus à reprendre. Le niveau reste déclaré par la personne (garde-fou 1),
recueilli par le responsable : c'est une convention d'usage, et le chantier ne prétend pas en faire
un mécanisme.

**(d) La disponibilité est une propriété du centre, pas d'un intervenant côté entité.** La colonne
est **nullable**, et un `CHECK` la refuse à un `kind = 'stakeholder'` — la forme exacte de
`persons_role_requires_access` (T1.2). Même règle pour les compétences : `openPersonSkill` refuse une
personne qui n'est pas du centre, **et le refus est dans l'action**, jamais dans le rendu.

**(e) Archiver une personne ne la retire pas des équipes passées.** `filter()` ne porte que le
domaine (`lib/db/scoped.ts:266`) : `findProjectDetail` continue d'afficher une personne archivée dans
l'équipe d'un accompagnement ancien, et c'est la règle 4 tenue — la donnée ne disparaît pas d'un
écran qui la racontait. L'archivage la retire du référentiel Équipe et des choix du formulaire de
projet, rien de plus. **Cette propriété se vérifie, elle ne s'affirme pas.**

**(f) Le radar porte un `viewBox` ; la frise n'en a pas, et les deux ont raison.** T5.5 s'en est
privée parce que ses abscisses sont des pourcentages d'une largeur inconnue, ce qui lui a interdit
`polyline` et `path` en T5.6. Un radar est un **carré de taille fixe** : ses coordonnées sont des
nombres, `<polygon>` y est disponible, et le texte reste hors du SVG. La divergence est un choix,
pas un oubli.

**(g) Une personne se crée dans Équipe, et nulle part ailleurs.** Le bloc « Ajouter une personne » du
formulaire de projet (T2.6) disparaît en T5bis.7. C'est la demande — « il ne faut pas recréer
manuellement une personne à chaque accompagnement » — et cela **referme** le point ouvert « on
n'ajoute qu'une personne par enregistrement », dont la limitation n'a plus d'objet une fois la
création partie ailleurs.

---

## Interdits communs aux sept tickets

Les six garde-fous ci-dessus, dans chaque ticket, sans rappel.

Aucune suggestion automatique de personnes pour un accompagnement : c'est la cible à terme, elle est
**hors de ce chantier**. Aucun rapprochement calculé entre les métiers déclarés d'un projet et les
compétences de son équipe — **D44 pose que les deux peuvent diverger et qu'aucune cohérence n'est
imposée**, et un écran qui signalerait l'écart le rouvrirait.

Aucune page personne, aucune entrée de navigation vers une personne (arbitrage (a), D29). Aucun
écran de gestion des référentiels : `skills` et `skill_levels` s'amorcent par script comme les six
autres, et leur écran reste dû à C7 (D25). Journal `events` et liens entre projets (C6). Budget et
SSO (C7).

Aucune bibliothèque de graphiques, aucune dépendance neuve, **aucun JavaScript pour le radar** : il
est rendu sur le serveur, en SVG, comme la frise. Aucune suppression de donnée métier (règle 4) : la
couche n'expose pas de `delete` et ce chantier ne lui en ajoute pas. Aucune valeur visuelle en dur
(règle 2) : les six manques du design system et leurs substituts mesurés sont consignés, et **aucun
septième ne s'invente**.

---

## T5bis.1 — Le schéma : compétences, niveaux, profil

**Objectif** — Poser les trois tables et les deux colonnes dont les six tickets suivants vivent, et
les amorcer. Rien de visible, comme T1.2.

**Périmètre** — `lib/db/schema.ts` ; `drizzle/0003_*.sql` (généré, jamais écrit à la main) ;
`scripts/seed.ts` ; `lib/db/scoped.test.ts`.

**Attendu** — Trois tables, toutes de formes déjà présentes dans le schéma :

- **`skills`** — référentiel du domaine, **forme exacte de `jobs`** : `id`, `domain_id`, `label`,
  `position numeric(10,2)`, `archived_at`, `stamps`, index sur `domain_id`.
- **`skill_levels`** — la forme de `jobs` plus un `rank smallint notNull`. C'est le `rank` qui
  ordonne l'échelle et qui donnera au radar sa seule grandeur ; le `label` reste libre, un domaine
  renommant « Avancé » sans renommer le rang 3.
- **`person_skills`** — table de **liaison**, donc **sans `archived_at`** : `person_id` → `persons`
  cascade, `skill_id` → `skills` restrict, `level_id` → `skill_levels` restrict, UNIQUE
  `(person_id, skill_id)`, index sur `domain_id`, `person_id` et `skill_id`. L'absence
  d'`archived_at` la range dans `LinkTable` et rend `unlink` disponible **à la compilation** : la
  propriété éprouvée en T5.4, où retirer une adoption est un retrait et jamais un archivage.

Deux colonnes sur `persons` : **`bio`**, `text` nullable, la courte présentation ; et
**`availability`**, énuméré neuf `person_availability` = `available | partial | unavailable`,
**nullable**, accompagnée du `CHECK` `persons_availability_requires_center` — arbitrage (d), sur la
forme de `persons_role_requires_access`. Les deux `CHECK` existants ne sont pas touchés.

**Amorçage** — `ensureAll` tel quel, rapprochement par clé naturelle : les **onze** compétences de la
demande (UI Design, UX Design, User Research, Architecture de l'information, Facilitation,
Prototypage, UX Audit, Accessibilité, Design System, Design Strategy, Service Design) ; les **quatre**
niveaux (Débutant 1, Intermédiaire 2, Avancé 3, Expert 4) ; une présentation et une disponibilité
pour les **sept** personnes du centre, aucune des deux pour l'intervenant côté entité ; et de trois à
cinq compétences par personne du centre, dont **une personne à deux compétences seulement** — c'est
elle qui éprouvera l'absence de radar en T5bis.5.

**Validation** — `npm run db:generate` puis `db:migrate` passent ; `db:seed` joué **deux fois** ne
crée rien la seconde, vérifié par décompte avant et après. Les cas neufs de `scoped.test.ts`
prouvent : que `unlink` accepte `person_skills` et que le compilateur le refuserait sur `persons` ;
qu'une `skill_id` d'un autre domaine lève `DomainScopeError` depuis `assertPreconditions` ; que le
`CHECK` de disponibilité refuse un `stakeholder` disponible. **Mise en défaut** : retirer
`domainRef()` de `person_skills` fait tomber exactement les cas d'étanchéité neufs, et rien d'autre.

**Interdits** — Aucun écran, aucune lecture applicative, aucune route. Aucune colonne de score, de
moyenne, de date de validation d'un niveau, d'historique de progression (garde-fous 1 et 2). Aucun
`archived_at` sur `person_skills` : ce serait retirer `unlink` du typage et rouvrir l'arbitrage (f)
de C5.

---

## T5bis.2 — L'entrée « Équipe » et la liste

**Objectif** — La cinquième entrée de navigation, et l'écran qui présente enfin les personnes. En
lecture seule, sur le rythme de T3.1 et T5.1 : on lit avant d'écrire.

**Périmètre** — `lib/navigation.ts` ; `lib/queries/team.ts` (neuf) et son test (neuf) ;
`app/(app)/equipe/page.tsx` (neuf) ; `components/team/availability-dot.tsx` (neuf).

**Attendu** — `ROUTES.team = "/equipe"`, et une **cinquième entrée** dans `MAIN_NAV`, après
« Projets » et avant « À propos » : le chemin canonique reste Produits › Projets (`docs/06` §8), et
Équipe n'est pas un chemin vers un accompagnement. `docs/06` §8 écrit « quatre entrées » — **l'écart
se consigne dans `JOURNAL-TECHNIQUE.md`, il ne se discute pas.**

`listTeam(scope)` rend, en **une** lecture jointe et jamais une requête par personne : nom, métier,
genre, disponibilité, et les compétences portées avec leur niveau. Un `filter()` par table jointe —
`persons`, `person_skills`, `skills`, `skill_levels` —, la leçon que T5.5 a resservie : **les filtres
de domaine se rattrapent.** Les personnes archivées sont écartées, le tri est **par nom** (garde-fou
3).

La page reprend `Page`, `PageHeader`, `List`, `ListHeader`, `ListRow`, `Avatar`, `Tag` et
`EmptyState` sans en modifier un. Une ligne porte : nom, métier, disponibilité, compétences en
étiquettes, et la mention « côté entité » pour un `stakeholder` — **la même qu'`app/(app)/projets/[id]/page.tsx`
depuis T2.4**, ce qui referme pour moitié le point ouvert « deux colonnes saisies ne s'affichent
nulle part ». Une personne sans compétence le dit ; ce n'est pas un état d'erreur.

`AvailabilityDot` est écrit sur le patron de `status-dot.tsx` : un `Record` **exhaustif à la
compilation** sur les trois valeurs de l'énuméré, la pastille `aria-hidden`, et **le mot écrit juste
à côté** — la couleur ne porte jamais seule une information.

**Validation** — Lu dans le HTML servi de `/equipe` : les huit personnes de la fixture, leur métier,
leur disponibilité, leurs compétences ; l'intervenant côté entité avec sa mention et **sans**
disponibilité. L'entrée de navigation porte `aria-current="page"`, et les quatre autres non.
**Contraste mesuré** sur les trois couleurs de pastille, neuves par la position, et sur tout autre
couple neuf. Le test amorce **deux domaines** — sans un second, aucun test d'étanchéité ne prouve
quoi que ce soit — et **se met en défaut** : retirer un `filter()` fait tomber le cas d'étanchéité
correspondant, et lui seul.

**Interdits** — Aucun filtre (T5bis.3), aucune fiche ni panneau (T5bis.4), aucun radar (T5bis.5),
aucune écriture : ni bouton, ni action, ni point d'entrée (T5bis.6). Aucun décompte de compétences
sur une ligne, aucun niveau agrégé, aucun tri autre que le nom (garde-fous 2 et 3).

---

## T5bis.3 — Les filtres de la liste

**Objectif** — Répondre à « quelles personnes pourraient intervenir sur un accompagnement demandant
de l'UX Research et de l'accessibilité ? », dans l'URL et sans une ligne de JavaScript.

**Périmètre** — `app/(app)/equipe/page.tsx` ; `lib/queries/team.ts` et son test.

**Attendu** — Le patron de `ProjectFilters` (`app/(app)/projets/page.tsx`), repris sans être
généralisé : un `<form method="get" action={ROUTES.team}>`, l'état dans l'URL, la restitution par le
retour navigateur.

| Clé | Contrôle | Sémantique |
|---|---|---|
| `q` | recherche | le nom de la personne |
| `metier` | `select` | un métier |
| `competence` | cases à cocher, **répétable** | **conjonctif** — l'une **et** l'autre |
| `niveau` | `select` | « au moins ce niveau », `rank >= n` |
| `dispo` | `select` | une des trois valeurs |

Le conjonctif s'écrit en **un `exists` par compétence cochée**, chacun portant son
`filter(personSkills)` : c'est la seule forme qui dise « les deux » sans regroupement ni décompte.
`niveau` s'applique aux compétences cochées ; seul, il vaut « porte au moins une compétence à ce
niveau ». Les valeurs reçues sont **confrontées au domaine avant d'être crues** — la règle de
`?produit=` de T2.5 : une compétence d'un autre domaine ne filtre pas, elle est ignorée.

L'exception d'archivage nominative des référentiels (`includeArchived: true` +
`or(isNull(archivedAt), inArray(id, keptIds))`) **ne s'applique pas ici** : un filtre n'édite aucune
ligne, il n'a donc aucune valeur à conserver sélectionnable. Les options archivées sont écartées.

**Validation** — Lu dans le HTML servi : `?competence=<ux-research>&competence=<accessibilite>` ne
rend que les personnes qui portent **les deux**, et une personne qui n'en porte qu'une n'y est pas.
`?dispo=partial`, `?metier=<uuid>`, `?niveau=<uuid>` et `?q=` se combinent, et survivent au
rechargement. Un `?competence=<uuid d'un autre domaine>` ne filtre rien et ne fuit rien. **Mise en
défaut** : remplacer les `exists` conjoints par un `or` fait tomber exactement le test de
conjonction, et rien d'autre.

**Interdits** — Aucun tri par niveau, aucun « meilleur profil », aucun décompte de correspondance,
aucun classement des résultats, aucun surlignage du plus qualifié (garde-fous 2 et 3). L'ordre reste
alphabétique quelle que soit la recherche. Aucune recherche globale (D32) : cette recherche
appartient à cette liste.

---

## T5bis.4 — La fiche, en panneau

**Objectif** — Tout ce qu'on veut savoir d'une personne d'un coup d'œil, **sans écran de plus**
(arbitrage (a), D29).

**Périmètre** — `lib/navigation.ts` ; `components/ui/panel.tsx` ; `components/team/person-card.tsx`
(neuf) ; `app/(app)/equipe/page.tsx` ; `lib/queries/team.ts` et son test.

**Attendu** — `PERSON_PANEL_PARAM = "personne"`, valeur = l'identifiant de la personne, toute autre
valeur n'ouvrant rien. La page prend la **règle d'exclusivité par décompte** de la page produit
(T5.2) — écrite d'avance pour les deux clés que T5bis.6 ajoutera, comme T5.2 l'avait été pour
`releve`.

**`Panel` gagne un mode lecture plutôt qu'une septième coquille.** `action`, `pending`,
`submitLabel`, `message` et `errors` deviennent **facultatifs** : sans `action`, pas de `<form>`, pas
de bouton d'enregistrement, un pied qui ne porte que « Fermer ». C'est exactement la propriété que
TD.1 cherchait — on ne recopie pas la coquille, on la généralise. Le voile, le `role="dialog"`, le
filet mesuré, `FocusTrap`, l'`autoFocus` et l'`inert` de la page **ne bougent pas d'une ligne**.

`Panel` est un composant client ; **le contenu de la fiche reste serveur**, passé en `children`
depuis la page. C'est ce qui permettra au radar de T5bis.5 d'y entrer sans franchir la frontière du
bundle.

`findPersonDetail(scope, personId)` rend : identité, métier, présentation, disponibilité ; les
compétences avec leur niveau, ordonnées par `rank` **décroissant** puis par libellé — un ordre de
lecture à l'intérieur d'un profil, jamais un classement entre personnes ; et **ses
accompagnements**, par jointure `project_members ⋈ projects`, chacun cliquable vers
`ROUTES.project(id)` avec sa période et son statut. Les accompagnements archivés sont écartés ;
l'absence est un état vide écrit.

**Validation** — Lu dans le HTML servi : `/equipe?personne=<uuid>` porte la fiche, la page reste
rendue derrière et porte `inert`, les trois sorties sont des liens vers `/equipe`. Le panneau
s'ouvre et se ferme **sans une ligne de JavaScript**, JavaScript désactivé. Un UUID inconnu, un UUID
d'un autre domaine et une personne archivée n'ouvrent rien. Les rendus de panneaux capturés par TD.1
sont **rejoués à données constantes** — `git stash` d'abord, la base de développement ayant dérivé —
et la généralisation de `Panel` ne change **pas un caractère** de leur HTML.

**Interdits** — Aucun graphique (T5bis.5). Aucune route `/equipe/[id]`, aucun lien vers une page
personne depuis un projet ou un produit : D29 tient. Aucun bouton d'écriture (T5bis.6). Aucun
décompte d'accompagnements présenté comme une mesure d'activité de la personne — la liste se lit,
elle ne se totalise pas.

---

## T5bis.5 — Le radar des compétences

**Objectif** — La forme d'un profil, d'un coup d'œil. Le second dessin du projet, après la frise.

**Périmètre** — `lib/queries/radar.ts` (neuf) et son test (neuf) ; `components/team/skill-radar.tsx`
(neuf) ; `components/team/person-card.tsx`.

**Attendu** — Un SVG **rendu sur le serveur**, sans dépendance, sans JavaScript, sans mesure de
viewport — la discipline de `components/products/timeline.tsx`. Avec **un `viewBox`**, lui, et la
raison est l'arbitrage (f) : le radar est un carré de taille fixe, ses coordonnées sont des nombres,
et `<polygon>` y est donc disponible là où la frise devait poser ses courbes `<line>` par `<line>`.

Les mathématiques vivent dans `lib/queries/radar.ts`, **pures et testées**, comme `timelineScale`
depuis T5.5 : `axisPoints(count, radius)` et `polygonPoints(ranks, maxRank, radius)`. **Aucune
trigonométrie dans le composant.** Le premier axe pointe vers le haut ; les suivants tournent dans le
sens horaire.

Les axes sont **les seules compétences déclarées par la personne** (garde-fou 5), dans l'ordre de la
fiche. **En dessous de trois compétences, aucun radar** : trois axes sont le minimum d'un polygone,
et la liste écrite tient seule l'écran. **Ce n'est pas un état d'erreur** — c'est le cas de
l'indicateur sans relevé de T5.1, qui se dit et ne s'invente pas.

Le dessin porte `role="img"` et un `<title>` : rien n'y est focalisable, à la différence des bandes
de la frise qui avaient imposé `role="group"` en T5.5. La liste « compétence — niveau » **en toutes
lettres** reste à côté du dessin, et c'est elle qui porte l'information (garde-fou 6). Une seule
couleur de thème, aucune légende, aucune graduation chiffrée, aucune infobulle.

**Validation** — Lu dans le HTML servi : le radar d'une personne à quatre compétences, avec ses
quatre axes et son polygone ; la personne à deux compétences de la fixture **n'a pas de radar** et
affiche sa liste. `radar.test.ts` fixe les sommets pour 3, 4 et 6 axes, et **se met en défaut** :
décaler l'origine d'un quart de tour fait tomber exactement ces cas. **Contraste mesuré** sur le
tracé, sur le remplissage et sur les libellés d'axe.

**Interdits** — Aucune moyenne, aucune aire calculée, aucun score, aucun pourcentage (garde-fou 2).
Aucun second profil sur le même dessin, aucun radar dans la liste ni dans un formulaire (garde-fou
4). Aucune valeur de comparaison — ni médiane de l'équipe, ni niveau attendu, ni cible : ce serait
l'indice calculé de D39, et la cible d'un indicateur n'a de sens que sur un produit, jamais sur une
personne.

---

## T5bis.6 — L'écriture : créer une personne, corriger son profil, poser ses compétences

**Objectif** — Les trois gestes sur les deux objets, dans le ticket qui les introduit (arbitrage (a)
de C5, tenu). Sans lui, C5bis livrerait un référentiel qu'un script seul alimente.

**Périmètre** — `lib/forms/person.ts` et son test (neufs) ; `lib/forms/person-skill.ts` et son test
(neufs) ; `components/team/person-panel.tsx` (neuf) ; `components/team/skill-panel.tsx` (neuf) ;
`app/(app)/equipe/actions.ts` (neuf) ; `lib/navigation.ts` ; `app/(app)/equipe/page.tsx` ;
`components/team/person-card.tsx`.

**Attendu** — Le patron en trois couches tenu depuis T3.3, sans dépendance neuve : un module de
validation **pur** (`readPersonForm`, `validatePersonForm`, `toPersonFormValues`, `parsePersonForm`,
où `input` est non nul **si et seulement si** `errors` est vide, par renarrowing et jamais par un
`as`) ; un composant client à `useActionState`, avec sa `key` pour que l'état initial se relise au
montage ; une action serveur `"use server"` avec sa **porte**.

Deux clés d'ouverture, sur les formes déjà tranchées : `personne=nouvelle` crée et
`personne=<uuid>` corrige — la forme d'`indicateur` (T5.2) ; `competence=<uuid de personne>` pose une
compétence et `competence=<uuid de person_skills>` la corrige — la forme **polymorphe** de `releve`
(T5.3), tranchée par deux lectures scopées successives, un UUID de `persons` n'étant pas un UUID de
`person_skills`. La règle d'exclusivité de T5bis.4 les absorbe **sans changer d'énoncé**.

Six gestes : créer une personne ; corriger son profil (nom, métier, genre, présentation,
disponibilité) ; **archiver** une personne, par `ConfirmPanel` et `ARCHIVE_PANEL_PARAM`, la
troisième page à reprendre ce couple tel quel ; ajouter une compétence avec son niveau ; corriger ce
niveau ; **retirer** la compétence par `unlink` — et le verbe à l'écran est « **Retirer** », jamais
« Archiver », la règle de T5.4.

**Le droit est `session.can.manageDomain`, seul** (arbitrage (c)). La porte lit la **ligne reçue**,
puis l'archivage, puis le droit, **avant** toute lecture du formulaire, et toujours sur
l'identifiant **reçu** — jamais sur celui qu'on a lié : `bind` fait sortir l'identifiant de la
saisie, mais Next le sérialise en clair dans un champ `$ACTION_…`. Elle refuse en outre une
compétence posée sur un `stakeholder` (arbitrage (d)).

**Validation** — **Le droit s'éprouve par l'action, jamais par l'écran.** Sous le cookie d'un simple
membre, chacun des **six** points d'entrée est reposté à la main, en **multipart** — un harnais qui
poste en urlencoded obtient un 200 muet, indiscernable d'un refus (leçon de TD.1) —, précédé d'une
**étape témoin** qui prouve que le harnais atteint bien l'action ; base comptée avant et après.
Charges forgées refusées : une personne d'un autre domaine, une compétence d'un autre domaine, une
compétence posée sur un intervenant côté entité, une personne déjà archivée.

Lu dans le HTML servi : une personne créée paraît aussitôt dans la liste ; corrigée elle s'y affiche
autrement ; archivée elle en disparaît **et reste affichée dans l'équipe de ses accompagnements
passés** (arbitrage (e), vérifié sur la page projet). Une compétence déjà portée est refusée par
l'unicité et rend une **erreur de champ**, jamais une trace serveur. **Mise en défaut** : neutraliser
l'obligation du nom, puis le refus du `stakeholder`, fait tomber exactement les tests qui les
isolent.

**Interdits** — Aucune écriture par la personne sur son propre profil : arbitrage (c) tranché, et
aucun droit neuf dans `lib/auth/session.ts`. Aucun champ de commentaire sur un niveau, aucune date de
validation, aucun historique de progression — une colonne écrite sans lecteur est une colonne qu'on
relit un jour sans savoir pourquoi (leçon de T5.2). Aucun rétablissement d'une personne archivée :
arbitrage (b) de C4bis, le rétablissement existe pour les deux objets qui ont une page, et une
personne n'en a pas. Aucune création ni modification d'une compétence du référentiel `skills` depuis
cet écran (D25, C7).

---

## T5bis.7 — La sélection d'équipe du formulaire de projet, refondue

**Objectif** — Que le formulaire de projet **puise** dans le référentiel au lieu de le doubler.

**Périmètre** — `components/projects/project-form.tsx` ; `lib/forms/project.ts` et son test ;
`app/(app)/projets/actions.ts` ; `lib/queries/projects.ts` et son test.

**Attendu** — Chaque ligne de personne porte désormais **son métier et sa disponibilité** à côté du
nom, en plus de la mention « côté entité » déjà présente : le choix se fait en connaissance de
cause, sans quitter le formulaire. `listProjectFormOptions` remonte les deux colonnes ; l'ordre reste
**par nom** (garde-fou 3), et le `select` à trois valeurs `none | member | contributor` ne change pas.

**Le bloc « Ajouter une personne » disparaît** (arbitrage (g)). `newPersonName`, `newPersonKind`,
`newPersonRole`, `NewPersonInput` et `addManualPerson` sont **retirés** ; à leur place, un lien vers
`/equipe`. Cela **referme le point ouvert** « on n'ajoute qu'une personne par enregistrement » : sa
raison — un champ répétable exige le JavaScript qu'on n'a pas — n'a plus d'objet une fois la
création partie ailleurs.

`syncMembers`, `project_members` et le contrat d'équipe **ne changent pas d'une ligne** : ce ticket
ne touche ni au modèle, ni à la synchronisation, ni aux droits.

**Validation** — Lu dans le HTML servi de `/projets/nouveau` et de `/projets/<id>/modifier` : chaque
ligne porte le métier et la disponibilité, et **aucun champ `newPerson*` ne subsiste**. Une personne
archivée en T5bis.6 n'est plus proposée, et un accompagnement qui la portait déjà l'affiche toujours.
**Le droit s'éprouve par l'action** : un POST forgé portant encore `newPersonName` **ne crée aucune
personne**, décompte de `persons` avant et après. Le cas de `parseProjectForm` qui lisait la personne
neuve **tombe** et est retiré ; les cas d'équipe restent verts, et `npm test` est vert.

**Interdits** — Aucun changement au modèle de `project_members`, à `syncMembers`, ni aux droits.
Aucun filtre ni recherche dans le formulaire de projet — c'est l'écran Équipe qui filtre. Aucune
suggestion automatique de personnes, aucun rapprochement entre les métiers déclarés du projet et les
compétences de l'équipe (D44). Aucun radar, aucun niveau affiché dans le formulaire : choisir une
équipe n'est pas comparer des personnes (garde-fou 4).
