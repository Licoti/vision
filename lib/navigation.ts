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
 * Le panneau de saisie d'une **ressource** (T4.2), sur la même page et la même
 * mécanique — une URL, pas un état.
 *
 * **Une clé distincte, et non une valeur de plus sur `activite`** : ce sont deux
 * objets, pas deux gestes sur le même. Une seule clé les porterait tous les deux
 * au prix d'une valeur polymorphe que rien ne désambiguïserait — un identifiant
 * d'activité y voudrait dire « corriger cette activité » d'un côté et « relier
 * une ressource à cette activité » de l'autre.
 *
 * **La contrepartie est une règle d'exclusivité**, qui vit dans la page :
 * `activite` et `ressource` présentes ensemble n'ouvrent **rien**. Deux
 * `role="dialog"` ou deux `inert` concurrents ne se rattrapent pas après coup,
 * et aucune préséance n'est inventée entre deux gestes de même rang. T4.4
 * reprendra la règle telle quelle avec `resultat`.
 *
 * **Deux valeurs d'ouverture depuis T4bis.5**, comme `activite` en porte deux
 * depuis T3.4 : `nouvelle` relie, l'identifiant d'une **ressource** corrige. C4
 * n'écrivait aucune correction (arbitrage (a) de `tickets-C4.md`), qui renvoyait
 * explicitement à C4bis ; la forme, elle, n'a pas eu à changer d'un caractère —
 * un UUID ne peut pas valoir `nouvelle`, et toute autre valeur n'ouvre rien.
 */
export const RESOURCE_PANEL_PARAM = "ressource";

/** La valeur d'ouverture en création. Toute autre valeur est un identifiant. */
export const RESOURCE_PANEL_NEW = "nouvelle";

/**
 * Le panneau de saisie d'un **résultat** (T4.4), troisième clé d'ouverture de la
 * page projet — même mécanique, une URL et non un état.
 *
 * **Aucune valeur d'ouverture fixe, à la différence des deux autres.** La valeur
 * est l'identifiant de l'**activité** sur laquelle le résultat se saisit : un
 * résultat n'existe pas hors de l'activité qui l'a produit (`docs/02` §5,
 * `results.activity_id` étant `not null`). C'est la forme d'`?activite=<uuid>`
 * de T3.4, pour la même raison — la cible fait partie du geste, et `nouvelle`
 * n'aurait rien désigné.
 *
 * **La règle d'exclusivité passe de deux clés à trois sans changer d'énoncé** :
 * plusieurs clés d'ouverture présentes ensemble n'ouvrent **rien**. La page la
 * porte par un décompte, non par une condition binaire — ce qui la laisse juste
 * quand C5 ajoutera la sienne.
 */
export const RESULT_PANEL_PARAM = "resultat";

/**
 * Le panneau de **confirmation d'archivage** (T4bis.2), sur la page du produit.
 * Même mécanique que les trois précédents — une URL, pas un état : la page reste
 * rendue derrière, porte `inert`, et les trois sorties sont des liens.
 *
 * **Une seule valeur d'ouverture**, comme `ressource` : rien ici n'est
 * polymorphe, l'objet à archiver étant celui de la page. La valeur ne désigne
 * donc rien — elle ouvre, et c'est tout ; toute autre n'ouvre rien.
 *
 * Une clé distincte des trois autres, et pour la même raison qu'elles le sont
 * entre elles : ce sont des gestes différents, pas deux formes du même.
 *
 * **T4bis.3 a repris cette paire telle quelle sur la page du projet**, comme
 * annoncé : les deux pages de détail ouvrent leur confirmation par le même
 * couple clé/valeur, et l'objet visé reste celui de la page dans les deux cas.
 * Rien n'avait à changer ici — c'est la propriété qu'on cherchait.
 */
export const ARCHIVE_PANEL_PARAM = "archiver";

/** La seule valeur qui ouvre le panneau de confirmation. */
export const ARCHIVE_PANEL_CONFIRM = "confirmation";

/**
 * Le panneau de saisie d'un **indicateur** (T5.2), sur la page du **produit** —
 * la première clé d'ouverture de cette page qui ne soit pas une confirmation.
 * Même mécanique que les quatre précédentes : une URL, pas un état.
 *
 * **Deux valeurs d'ouverture**, comme `activite` depuis T3.4 et `ressource`
 * depuis T4bis.5 : `nouvel` crée, l'identifiant d'un **indicateur** corrige, et
 * toute autre valeur n'ouvre rien — un UUID ne peut pas valoir `nouvel`. Un seul
 * formulaire pour les deux gestes, l'arbitrage (a) de `tickets-C5.md` voulant
 * que chaque objet arrive avec ses trois gestes.
 *
 * **La page produit prend la règle d'exclusivité par décompte** de la page
 * projet : `archiver` et `indicateur` présentes ensemble n'ouvrent **rien**.
 * Deux `role="dialog"` ou deux `inert` concurrents ne se rattrapent pas après
 * coup, et aucune préséance ne s'invente entre deux gestes de même rang. La
 * forme est celle d'`app/(app)/projets/[id]/page.tsx`, choisie pour rester juste
 * quand T5.3 ajoutera `releve`.
 *
 * **T5.4 reprendra cette même clé sur la page projet**, pour l'adoption : ce
 * sont deux pages, jamais la même URL, et rien n'aura à changer ici.
 */
export const INDICATOR_PANEL_PARAM = "indicateur";

/** La valeur d'ouverture en création. Toute autre valeur est un identifiant. */
export const INDICATOR_PANEL_NEW = "nouvel";

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
  /**
   * La page du produit, panneau de confirmation d'archivage ouvert (T4bis.2).
   * **Ce n'est pas un écran de plus** : c'est le même, avec un paramètre — et la
   * fermeture est donc `product(id)`, qui n'a pas besoin d'entrée à elle.
   */
  productArchive: (id: string) =>
    `/produits/${id}?${ARCHIVE_PANEL_PARAM}=${ARCHIVE_PANEL_CONFIRM}`,
  /**
   * La page du produit, panneau d'indicateur ouvert (T5.2). **Ce n'est pas un
   * écran de plus** : c'est le même, avec un paramètre — et la fermeture est
   * donc `product(id)`, qui n'a pas besoin d'entrée à elle.
   */
  productIndicatorNew: (id: string) =>
    `/produits/${id}?${INDICATOR_PANEL_PARAM}=${INDICATOR_PANEL_NEW}`,
  /**
   * Le même panneau, sur un indicateur existant (T5.2) : un seul formulaire,
   * deux points d'entrée — la forme de `projectResourceEdit` jusqu'au nom de la
   * clé. La fermeture reste `product(id)` : corriger un indicateur ne fait pas
   * davantage quitter la page du produit que d'en saisir un.
   */
  productIndicatorEdit: (id: string, indicatorId: string) =>
    `/produits/${id}?${INDICATOR_PANEL_PARAM}=${indicatorId}`,
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
   * La page du projet, panneau de confirmation d'archivage ouvert (T4bis.3).
   * **Ce n'est pas un écran de plus** : c'est le même, avec un paramètre — et la
   * fermeture est donc `project(id)`, qui n'a pas besoin d'entrée à elle. Même
   * forme que `productArchive`, jusqu'au nom de la clé.
   */
  projectArchive: (id: string) =>
    `/projets/${id}?${ARCHIVE_PANEL_PARAM}=${ARCHIVE_PANEL_CONFIRM}`,
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
  /**
   * La page du projet, panneau de ressource ouvert (T4.2). Toujours depuis son
   * projet — la règle de D17 transposée : ni la vue d'ensemble ni la liste
   * transverse n'ont d'entrée vers ce geste. La fermeture reste `project(id)`.
   */
  projectResourceNew: (id: string) =>
    `/projets/${id}?${RESOURCE_PANEL_PARAM}=${RESOURCE_PANEL_NEW}`,
  /**
   * Le même panneau, sur une ressource existante (T4bis.5) : un seul
   * formulaire, deux points d'entrée — la forme de `projectActivityEdit`
   * jusqu'au nom de la clé. La fermeture reste `project(id)` : corriger une
   * ressource ne fait pas davantage quitter la page du projet que d'en relier
   * une.
   */
  projectResourceEdit: (id: string, resourceId: string) =>
    `/projets/${id}?${RESOURCE_PANEL_PARAM}=${resourceId}`,
  /**
   * La page du projet, panneau de résultat ouvert sur une activité donnée
   * (T4.4). Le geste part de l'entrée de roadmap de l'activité terminée qui a
   * produit le résultat — jamais d'ailleurs. La fermeture reste `project(id)`.
   */
  projectResultNew: (id: string, activityId: string) =>
    `/projets/${id}?${RESULT_PANEL_PARAM}=${activityId}`,
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
