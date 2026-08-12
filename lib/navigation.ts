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
 * Les adresses des six écrans, et des formulaires qui les alimentent. Les
 * pages de détail prennent un identifiant : le schéma en pose des UUID, et
 * rien ne promet encore de slug — ce choix revient à C2, avec l'écran qui
 * construit le lien.
 *
 * `productNew` est un segment statique sous `/produits`, là où `product` est
 * dynamique : Next donne la priorité au statique, et `isUuid` rattraperait de
 * toute façon en 404. Les formulaires ne figurent pas dans `MAIN_NAV` — un
 * formulaire n'est pas une destination de navigation.
 */
export const ROUTES = {
  overview: "/",
  products: "/produits",
  product: (id: string) => `/produits/${id}`,
  productNew: "/produits/nouveau",
  productEdit: (id: string) => `/produits/${id}/modifier`,
  projects: "/projets",
  project: (id: string) => `/projets/${id}`,
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
