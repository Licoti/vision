# 07 — Journal des décisions

Quarante-huit décisions tranchées pendant la phase de fondations. **Aucune ne se rouvre en cours de
développement.** Un désaccord se consigne dans `JOURNAL-TECHNIQUE.md` et le travail continue.

**Numérotation.** Les quatre décisions du document de cadrage sont préfixées `F1-` ; toutes les
autres forment une série continue `D1` à `D44`. Ne jamais écrire « D2 » ou « D4 » sans préfixe
pour désigner une décision de cadrage.

## Cadrage (docs/01)

| # | Décision |
|---|---|
| F1-D1 | Les droits de création sont réservés au responsable de domaine (voir D9). Une version antérieure de ce document ouvrait la création à tous : elle est caduque. |
| F1-D2 | Les commanditaires côté entité n'ont pas accès à Vision au POC. La page projet reste conçue lisible par eux. |
| F1-D3 | Un projet s'archive, ne se supprime jamais. |
| F1-D4 | Les critères de succès du POC s'évaluent par entretien, sans instrumentation. |

## Concepts (docs/02)

| # | Décision |
|---|---|
| D1 | Le concept de **Produit** existe, avec page dédiée, indicateurs et temps long. |
| D2 | L'approche est portée par le projet **et** par l'activité. Plusieurs approches par projet autorisées. |
| D3 | Granularité d'une activité : macro, de quelques jours à quelques semaines. Jamais l'acte unitaire. |
| D4 | Le rattachement d'un projet à un produit est **obligatoire**. |
| D5 | Pas de suivi du rôle fonctionnel d'une personne sur un projet au POC. |
| D6 | Le commanditaire est un champ texte libre. |
| D7 | Un projet peut être créé sans aucune activité. |
| D8 | **Un seul niveau** : l'activité est l'accompagnement, simplement typée. Pas de sous-niveau. |
| D9 | Le responsable de domaine crée produits et projets, puis désigne les contributeurs. Pas de création à la volée. Seuls les contributeurs désignés écrivent dans un projet ; la lecture reste ouverte à tout le domaine. |
| D10 | Les missions transverses vont dans un produit de type `internal`. Aucune exception au rattachement. |
| D11 | Un indicateur appartient à un seul produit au POC. |

## Accompagnement (docs/03)

| # | Décision |
|---|---|
| D12 | Une seule approche par activité, facultative. |
| D13 | Unité de temps de la roadmap : **le mois**. |
| D14 | Un groupe « à planifier » existe pour les activités sans date. |
| D15 | Résultats d'audit **saisis à la main** au POC. Les champs d'API existent déjà. |
| D16 | Le type d'activité est obligatoire. |
| D17 | Une activité se crée toujours depuis son projet. |
| D18 | La roadmap ne se réplique pas dans la liste des projets. |

## Modèle de données (docs/04)

| # | Décision |
|---|---|
| D19 | Une personne peut être référencée sans compte : `source = manual`, `has_access = false`. |
| D20 | Un projet peut changer de produit. Cas rare. |
| D21 | Le type de ressource est saisi au POC, non déduit de l'URL. |
| D22 | Journal `events` léger, sans versionnement ni restauration. |
| D23 | Les contributeurs du projet saisissent les indicateurs. |
| D24 | Un produit peut changer d'entité. |

## Périmètre (docs/05)

| # | Décision |
|---|---|
| D25 | Un écran sommaire de gestion des référentiels existe, en C7. |
| D26 | La page produit **socle** est dans le POC minimal (C2). La couche temps long attend C5. |
| D27 | Amorçage avec deux ou trois projets factices, saisie réelle en parallèle. |
| D28 | Le budget est dans le POC, en dernier (C7). |

## Architecture de l'information (docs/06)

| # | Décision |
|---|---|
| D29 | Pas de page personne au POC. |
| D30 | La saisie d'activité se fait en panneau latéral. |
| D31 | Ordre de la page projet : en-tête d'identité, puis roadmap, puis blocs de référence. |
| D32 | Pas de recherche globale. Une recherche par liste. |
| D33 | Pas de graphique sur la **vue d'ensemble** : des chiffres cliquables qui filtrent. L'interdit ne vaut que pour cet écran. |
| D34 | La liste transverse des projets est conservée à côté de la hiérarchie produit. |

## Terminologie et mise en œuvre

| # | Décision |
|---|---|
| D35 | Le terme retenu est **Projet**. « Accompagnement » ne subsiste que comme mot de lecture sur la page produit (« 2ᵉ accompagnement de ce produit »). |
| D36 | Une page **À propos** interne existe : ce qu'est Vision, son vocabulaire, ce qu'elle ne fait pas. Ton factuel, jamais promotionnel. |
| D37 | Le SSO est reporté en C7, **mais pas la notion d'utilisateur courant** : un stub alimente dès C1 le contexte de session dans sa forme finale. |
| D38 | L'isolation par domaine est garantie par une couche d'accès obligatoire et des tests, pas par du RLS. Le RLS se posera avec le SSO. |
| D39 | **Frontière du chiffre** : est interdit tout indice calculé par Vision pour qualifier un projet, une personne ou une entité. Est autorisée toute valeur reportée d'un outil externe, avec sa date et son lien. |
| D40 | Le statut d'accompagnement d'un produit est **calculé** à partir de ses projets, jamais stocké. |
| D41 | La courbe d'indicateurs de la page produit est attendue : elle porte une lecture. L'interdit de graphique ne concerne que la vue d'ensemble. |
| D42 | **L'archivage n'est pas un statut.** Il est porté exclusivement par `archived_at`. Un projet archivé conserve son dernier statut. La nature `archived` est retirée du référentiel des statuts. |
| D43 | **Les états d'activité sont une liste fermée** — prévue, en cours, terminée, annulée — non configurable, à la différence du statut de projet. La logique du produit en dépend directement. |
| D44 | **Les métiers du projet sont déclarés et font foi** pour le filtrage et l'affichage. Les métiers de l'équipe sont informatifs et peuvent diverger : un projet peut mobiliser un métier dont personne de l'équipe ne porte le libellé. Aucune cohérence n'est imposée entre les deux. |
