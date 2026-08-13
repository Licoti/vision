/**
 * Les routes du produit et la navigation principale, en un seul endroit.
 *
 * Les segments d'URL sont en français : une URL se lit, se copie et se
 * partage — elle appartient à l'interface, pas au code. Le reste du projet
 * reste en anglais, conformément au CLAUDE.md.
 *
 * L'ordre de `MAIN_NAV` n'est pas neutre (docs/06 §8) : Produits précède
 * Projets parce que la hiérarchie est le chemin canonique, et que la liste
 * transverse n'en est qu'un raccourci.
 *
 * Administration n'y figure pas : son accès dépend du rôle de la personne
 * courante, donc d'une lecture en base, que T1.6 s'interdit.
 *
 * Ce module ne dépend de rien — ni de Next, ni de la base.
 */

/** Une entrée de navigation, ou un maillon de fil d'Ariane. */
export type NavEntry = {
  readonly href: string;
  readonly label: string;
};

/**
 * Le panneau de saisie d'activité s'ouvre par un paramètre d'URL sur la page du
 * projet, qui reste rendue derrière lui (D30). Le contexte est alors conservé
 * **par construction** : il n'y a pas d'état client à préserver, puisqu'il n'y
 * a pas d'état client.
 *
 * Une seule clé, dont la **valeur** porte le cas : `nouvelle` en création, et
 * l'identifiant de l'activité en correction (T3.4). Deux paramètres auraient
 * fait deux lectures à tenir cohérentes pour une seule décision — la promesse
 * de T3.2 est tenue sans qu'un caractère de cette forme ait bougé, un UUID ne
 * pouvant pas valoir `nouvelle`.
 */
export const ACTIVITY_PANEL_PARAM = "activite";

/** La valeur d'ouverture en création. Toute autre valeur est un identifiant. */
export const ACTIVITY_PANEL_NEW = "nouvelle";

/**
 * Les adresses des six écrans, et des formulaires qui les alimentent. Les
 * pages de détail prennent un identifiant : le schéma en pose des UUID, et
 * rien ne promet encore de slug — ce choix revient à C2, avec l'écran qui
 * construit le lien.
 *
 * `productNew` et `projectNew` sont des segments statiques sous `/produits` et
 * `/projets`, là où `product` et `project` sont dynamiques : Next donne la
 * priorité au statique, et `isUuid` rattraperait de toute façon en 404. Les
 * formulaires ne figurent pas dans `MAIN_NAV` — un formulaire n'est pas une
 * destination de navigation.
 */
export const ROUTES = {
  overview: "/",
  products: "/produits",
  product: (id: string) => `/produits/${id}`,
  productNew: "/produits/nouveau",
  productEdit: (id: string) => `/produits/${id}/modifier`,
  projects: "/projets",
  project: (id: string) => `/projets/${id}`,
  projectNew: "/projets/nouveau",
  /**
   * La même route, le produit pré-sélectionné. Un accompagnement se crée
   * depuis le produit qu'il accompagne : le rattachement est alors connu, et
   * le formulaire n'a pas à le redemander. Le paramètre reste une **suggestion**
   * — l'écran le confronte au domaine avant de le croire.
   */
  projectNewForProduct: (productId: string) =>
    `/projets/nouveau?produit=${productId}`,
  projectEdit: (id: string) => `/projets/${id}/modifier`,
  /**
   * La page du projet, panneau de saisie ouvert. **Ce n'est pas un écran de
   * plus** : c'est le même, avec un paramètre — et la fermeture est donc
   * `project(id)`, qui n'a pas besoin d'entrée à elle.
   */
  projectActivityNew: (id: string) =>
    `/projets/${id}?${ACTIVITY_PANEL_PARAM}=${ACTIVITY_PANEL_NEW}`,
  /**
   * Le même panneau, sur une activité existante (T3.4) : un seul formulaire,
   * deux points d'entrée. La fermeture reste `project(id)` — corriger une
   * activité ne fait pas davantage quitter la page du projet que d'en saisir
   * une.
   */
  projectActivityEdit: (id: string, activityId: string) =>
    `/projets/${id}?${ACTIVITY_PANEL_PARAM}=${activityId}`,
  about: "/a-propos",
} as const;

/** Navigation principale, dans l'ordre attendu par le ticket. */
export const MAIN_NAV: readonly NavEntry[] = [
  { href: ROUTES.overview, label: "Vue d'ensemble" },
  { href: ROUTES.products, label: "Produits" },
  { href: ROUTES.projects, label: "Projets" },
  { href: ROUTES.about, label: "À propos" },
];

/**
 * L'entrée de navigation qui correspond au chemin courant.
 *
 * La vue d'ensemble se compare à l'identique — sans quoi, son `/` étant le
 * préfixe de tout, elle resterait active partout. Les autres se comparent par
 * préfixe de segment, pour qu'une page de détail garde sa section allumée.
 */
export function isCurrentEntry(entry: NavEntry, pathname: string): boolean {
  if (entry.href === ROUTES.overview) return pathname === ROUTES.overview;
  return pathname === entry.href || pathname.startsWith(`${entry.href}/`);
}
