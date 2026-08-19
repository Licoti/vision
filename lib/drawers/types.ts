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
 * Les sept panneaux de la page produit.
 *
 * `id` est facultatif là où la valeur portait le cas dans l'URL (`nouvel`
 * contre un identifiant) : son absence dit « créer ». Là où la valeur désignait
 * toujours une cible — `reading`, `readings`, `personaDetail` —, il est requis.
 * `archive` et `vision` n'en prennent aucun : l'objet visé est le produit de la
 * page, comme leur clé d'URL le disait déjà.
 */
export type ProductDrawerRequest =
  | { kind: "archive" }
  | { kind: "indicator"; id?: string | undefined }
  /** La valeur change de **table** et non de nature : un indicateur saisit, un relevé corrige. */
  | { kind: "reading"; id: string }
  | { kind: "readings"; id: string }
  | { kind: "vision" }
  | { kind: "persona"; id?: string | undefined }
  | { kind: "personaDetail"; id: string };

/** Les six panneaux de la page projet, sur la même forme. */
export type ProjectDrawerRequest =
  | { kind: "archive" }
  | { kind: "cancel"; id: string }
  | { kind: "result"; id: string }
  | { kind: "adoption"; id?: string | undefined }
  | { kind: "resource"; id?: string | undefined }
  | { kind: "activity"; id?: string | undefined };

/**
 * Le panneau de la page **Équipe** — T5bis.4.
 *
 * **Un seul pour l'instant, et l'union est écrite pour trois de plus** :
 * T5bis.6 y ajoutera `person`, `skill` et `archive`, qui sont des écritures et
 * demandent donc un droit. La fiche, elle, se lit par tout le domaine (D9) —
 * c'est la séparation que la page produit tient déjà entre `personaDetail` et
 * `persona`.
 *
 * `personDetail` ne se confond pas avec le `personaDetail` du produit, et le
 * piège de nom est celui du schéma : `persons` porte les membres du centre,
 * `personas` les profils pour lesquels on conçoit. Deux tables sans rapport,
 * deux panneaux sans rapport.
 */
export type TeamDrawerRequest = { kind: "personDetail"; id: string };

export type DrawerRequest =
  | ProductDrawerRequest
  | ProjectDrawerRequest
  | TeamDrawerRequest;

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
] as const;

const PROJECT_KINDS = [
  "archive",
  "cancel",
  "result",
  "adoption",
  "resource",
  "activity",
] as const;

const TEAM_KINDS = ["personDetail"] as const;

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
 * Le troisième jumeau, pour la page Équipe (T5bis.4).
 *
 * Il n'a aucune clé en commun avec les deux autres : une demande de la page
 * produit — `personaDetail`, dont le nom ne diffère que d'une lettre — n'ouvre
 * donc rien ici, et c'est ce que le point d'entrée serveur doit garantir avant
 * la moindre lecture.
 */
export function asTeamRequest(
  request: DrawerRequest,
): TeamDrawerRequest | null {
  return (TEAM_KINDS as readonly string[]).includes(request.kind)
    ? (request as TeamDrawerRequest)
    : null;
}
