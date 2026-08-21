/**
 * Ce qu'un panneau demande, et ce que le serveur en renvoie — TD.2.
 *
 * **Un panneau n'est plus une URL, c'est une demande.** Jusqu'ici l'ouverture
 * était un paramètre de recherche : le clic naviguait, la page se re-rendait
 * entière, et la barre d'adresse changeait. Le geste se lisait comme un
 * changement de page alors qu'un panneau est un élément contextuel de
 * l'interface. D30 n'a pas bougé — « panneau latéral plutôt que page dédiée,
 * **pour la fluidité et la conservation du contexte** » —, c'est son
 * implémentation de T3.2 qui se retourne, et elle n'a jamais été une décision
 * de `docs/07`.
 *
 * **Les URL restent des adresses valides**, et c'est un arbitrage, pas un
 * reste : coller `?fiche=<id>` ouvre encore le panneau au rendu serveur. Ce que
 * le clic ne fait plus, c'est l'écrire. Les deux chemins traversent la **même**
 * résolution — `lib/drawers/product.tsx`, `lib/drawers/project.tsx` —, si bien
 * qu'aucune règle de droit ni aucune confrontation ne vit à deux endroits.
 *
 * **Ces types ne portent aucun droit et aucune donnée.** Une demande dit
 * seulement *quoi ouvrir sur quoi* ; elle traverse la frontière du client, donc
 * elle est réécrivable, donc elle ne prouve rien. C'est la règle tenue depuis
 * T3.3 : le serveur redérive tout sur l'identifiant **reçu**, et un panneau
 * absent du rendu n'a jamais protégé le point d'entrée qui l'accompagne.
 */

import type { ReactNode } from "react";

/**
 * Les neuf panneaux de la page produit.
 *
 * `id` est facultatif là où la valeur portait le cas dans l'URL (`nouvel`
 * contre un identifiant) : son absence dit « créer ». Là où la valeur désignait
 * toujours une cible — `reading`, `readings`, `personaDetail`, `useCaseDetail`
 * —, il est requis. `archive` et `vision` n'en prennent aucun : l'objet visé est
 * le produit de la page, comme leur clé d'URL le disait déjà.
 *
 * **Les deux derniers sont la paire du use case** (19/08/2026), et ils
 * reprennent la séparation des deux précédents sans l'inventer : la fiche se lit
 * par tout le domaine, la saisie demande le droit d'écrire.
 */
export type ProductDrawerRequest =
  | { kind: "archive" }
  | { kind: "indicator"; id?: string | undefined }
  /** La valeur change de **table** et non de nature : un indicateur saisit, un relevé corrige. */
  | { kind: "reading"; id: string }
  | { kind: "readings"; id: string }
  | { kind: "vision" }
  | { kind: "persona"; id?: string | undefined }
  | { kind: "personaDetail"; id: string }
  | { kind: "useCase"; id?: string | undefined }
  | { kind: "useCaseDetail"; id: string };

/**
 * Les sept panneaux de la page projet, sur la même forme.
 *
 * **Le septième est le seul en lecture seule** (20/08/2026) : `starter` ouvre le
 * détail d'une piste de démarrage, que tout le domaine lit (D9), là où les six
 * autres ouvrent une écriture ou une confirmation. Il n'a pas de jumeau
 * d'écriture — la paire « une clé pour lire, une clé pour écrire » de la page
 * produit n'a rien à séparer sur un référentiel dont D25 donne l'écran à C7.
 */
export type ProjectDrawerRequest =
  | { kind: "archive" }
  | { kind: "cancel"; id: string }
  | { kind: "result"; id: string }
  | { kind: "adoption"; id?: string | undefined }
  | { kind: "resource"; id?: string | undefined }
  | { kind: "activity"; id?: string | undefined }
  | { kind: "starter"; id: string };

/**
 * Les quatre panneaux de la page **Équipe** — T5bis.4, puis T5bis.6.
 *
 * **Une lecture et trois écritures**, et la séparation est celle que la page
 * produit tient déjà deux fois : `personDetail` se lit par tout le domaine
 * (D9), comme `personaDetail` et `useCaseDetail` ; `person`, `skill` et
 * `archive` demandent `manageDomain` (arbitrage (c) de C5bis).
 *
 * `id` est facultatif là où la valeur porte le cas dans l'URL — `nouveau`
 * contre un identifiant : son absence dit « créer ». Il est requis partout
 * ailleurs, y compris sur `archive`, qui désigne **une personne** et non
 * l'objet de la page : `/equipe` n'en a pas.
 *
 * **`skill` est polymorphe** : la valeur change de **table** et non de nature —
 * l'identifiant d'une personne pose une compétence, celui d'une ligne de
 * `person_skills` en corrige le niveau. C'est la forme de `reading` sur la page
 * produit.
 *
 * `personDetail` ne se confond pas avec le `personaDetail` du produit, et le
 * piège de nom est celui du schéma : `persons` porte les membres du centre,
 * `personas` les profils pour lesquels on conçoit. Deux tables sans rapport,
 * deux panneaux sans rapport.
 */
export type TeamDrawerRequest =
  | { kind: "personDetail"; id: string }
  | { kind: "person"; id?: string | undefined }
  | { kind: "skill"; id: string }
  | { kind: "archive"; id: string };

/**
 * Les trois panneaux de la page **Administration** (21/08/2026).
 *
 * **Une écriture et deux confirmations**, et aucune lecture : cet écran ne
 * s'ouvre qu'à `manageDomain`, si bien qu'il n'a pas la paire « une clé pour
 * lire, une clé pour écrire » que les pages produit et Équipe tiennent chacune.
 * Une entité est un libellé : elle n'a rien à détailler qu'une ligne de liste
 * ne dise déjà.
 *
 * `id` est facultatif sur `entity` — la valeur porte le cas dans l'URL,
 * `nouvelle` contre un identifiant, et son absence dit « créer ». Il est requis
 * sur les deux confirmations, qui désignent **une entité** et non l'objet de la
 * page : `/administration` n'en a pas.
 *
 * **`delete` n'est pas une variante d'`archive`**, et le type le dit comme
 * l'URL : l'un range et se défait, l'autre efface et ne se défait pas. Les
 * confondre en une clé aurait mis l'écart à la règle 4 derrière un booléen.
 */
export type AdminDrawerRequest =
  | { kind: "entity"; id?: string | undefined }
  | { kind: "archive"; id: string }
  | { kind: "delete"; id: string };

export type DrawerRequest =
  | ProductDrawerRequest
  | ProjectDrawerRequest
  | TeamDrawerRequest
  | AdminDrawerRequest;

/**
 * Ce que le serveur renvoie, et ce que la coquille sait afficher.
 *
 * **La coquille et le corps sont séparés**, et c'est le cœur de TD.2 : le
 * voile, le tiroir, l'en-tête, la croix et le piège de focus vivent dans un
 * composant client qui s'ouvre **avant** tout aller-retour ; le corps arrive
 * ensuite. Sans ce partage, `readings-panel.tsx` et `persona-detail.tsx` —
 * composants **serveur** — auraient dû recevoir une fonction de fermeture,
 * qu'un composant serveur ne peut pas recevoir. Ils restent serveur.
 *
 * Le titre traverse en **texte** et non en balisage : c'est la coquille qui le
 * rend, une seule fois, dans son `<h2>` désigné par `aria-labelledby`.
 */
export type DrawerContent = {
  /** Ce que `aria-labelledby` du dialogue désigne. */
  titleId: string;
  title: string;
  /**
   * Ce qui rappelle le contexte sous le titre : le nom du produit, celui de
   * l'accompagnement, l'activité rattachée. Le panneau ne quitte pas son
   * contexte, il le rappelle.
   */
  subtitles: readonly string[];
  /**
   * Un en-tête à la place du couple titre / sous-titres, quand le panneau en
   * demande un plus riche que deux lignes de texte.
   *
   * **Un seul l'emploie, et c'est la raison d'être du champ** : la fiche d'un
   * persona porte son portrait et son étiquette « Principal » à côté de son
   * nom. Sans lui, il aurait fallu soit descendre l'avatar dans le corps — la
   * fiche n'aurait plus ressemblé à la carte qu'elle détaille —, soit rendre la
   * coquille générique sur ce qu'elle n'est pas. Le `titleId` reste désigné par
   * le `<h2>` que cet en-tête porte lui-même.
   */
  header?: ReactNode | undefined;
  /** Le corps, rendu sur le serveur. */
  body: ReactNode;
};

/**
 * Les demandes que la page **produit** connaît. Toute autre est refusée.
 *
 * **Un filtre, et non un confort de typage.** La demande traverse la frontière
 * du client : elle est réécrivable, donc `kind` peut valoir n'importe quoi, y
 * compris le nom d'un panneau de l'autre page. Le point d'entrée serveur la
 * rétrécit avant de l'employer, et ce qui ne passe pas n'ouvre rien — la même
 * règle que la forme d'un UUID vérifiée avant la base.
 */
const PRODUCT_KINDS = [
  "archive",
  "indicator",
  "reading",
  "readings",
  "vision",
  "persona",
  "personaDetail",
  "useCase",
  "useCaseDetail",
] as const;

const PROJECT_KINDS = [
  "archive",
  "cancel",
  "result",
  "adoption",
  "resource",
  "activity",
  "starter",
] as const;

const TEAM_KINDS = ["personDetail", "person", "skill", "archive"] as const;

const ADMIN_KINDS = ["entity", "archive", "delete"] as const;

export function asProductRequest(
  request: DrawerRequest,
): ProductDrawerRequest | null {
  return (PRODUCT_KINDS as readonly string[]).includes(request.kind)
    ? (request as ProductDrawerRequest)
    : null;
}

/** Le jumeau, pour la page projet. `archive` est la seule clé commune. */
export function asProjectRequest(
  request: DrawerRequest,
): ProjectDrawerRequest | null {
  return (PROJECT_KINDS as readonly string[]).includes(request.kind)
    ? (request as ProjectDrawerRequest)
    : null;
}

/**
 * Le troisième jumeau, pour la page Équipe (T5bis.4, complété en T5bis.6).
 *
 * **`archive` est désormais la seule clé commune aux trois pages**, et ce
 * rétrécissement ne la distingue donc pas : une demande `{ kind: "archive" }`
 * forgée depuis la page produit — qui n'y porte aucun identifiant — passe ce
 * filtre. C'est `resolveTeamDrawer` qui la refuse, en vérifiant la forme de
 * l'UUID avant toute lecture. Le rétrécissement écarte le reste : une demande
 * `personaDetail`, dont le nom ne diffère que d'une lettre, n'ouvre rien ici.
 */
export function asTeamRequest(
  request: DrawerRequest,
): TeamDrawerRequest | null {
  return (TEAM_KINDS as readonly string[]).includes(request.kind)
    ? (request as TeamDrawerRequest)
    : null;
}

/**
 * Le quatrième jumeau, pour la page Administration (21/08/2026).
 *
 * `archive` reste la clé commune aux quatre pages, et ce rétrécissement ne la
 * distingue donc pas : une demande `{ kind: "archive" }` forgée depuis la page
 * produit — qui n'y porte aucun identifiant — passe ce filtre. C'est
 * `resolveAdminDrawer` qui la refuse, en vérifiant la forme de l'UUID avant
 * toute lecture, puis le droit avant toute chose.
 */
export function asAdminRequest(
  request: DrawerRequest,
): AdminDrawerRequest | null {
  return (ADMIN_KINDS as readonly string[]).includes(request.kind)
    ? (request as AdminDrawerRequest)
    : null;
}
