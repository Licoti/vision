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
 * Le panneau de **confirmation d'annulation d'une activité**, sur la page du
 * projet. Le geste vivait jusqu'ici dans l'entrée de roadmap, sous un
 * `<details>` qui dépliait son champ « Motif » au milieu de la pile des autres
 * gestes ; le menu contextuel de la carte l'en sort.
 *
 * **La valeur porte l'identifiant de l'activité**, comme `resultat` et à la
 * différence d'`archiver` : l'objet visé n'est pas celui de la page — une page
 * de projet porte quinze activités, et le panneau doit savoir laquelle. C'est
 * la règle tenue depuis T3.4.
 *
 * **Une clé à elle**, et pour la raison qui sépare déjà les cinq autres : annuler
 * n'est pas une forme d'archiver. L'annulation dit « cette activité ne se fera
 * pas » et la garde au récit ; l'archivage dit « elle n'aurait pas dû être
 * saisie » et l'en sort.
 *
 * Sixième clé de la page du projet — le décompte d'exclusivité l'absorbe sans
 * changer d'énoncé, ce pour quoi il avait été écrit ainsi.
 */
export const CANCEL_PANEL_PARAM = "annuler";

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
 * Le panneau de saisie d'un **relevé** (T5.3), sixième clé d'ouverture du
 * projet — la seconde de la page produit. Même mécanique que les cinq
 * précédentes : une URL, pas un état.
 *
 * **Aucune valeur d'ouverture fixe**, à la différence d'`indicateur` : la forme
 * est celle de `resultat` (T4.4), et pour la même raison — la valeur désigne la
 * **cible** du geste, et `nouveau` n'aurait rien désigné. L'identifiant d'un
 * **indicateur** ouvre la saisie d'un relevé sur cet indicateur, celui d'un
 * **relevé** ouvre sa correction. Un UUID d'`indicators` n'est pas un UUID
 * d'`indicator_readings` : deux lectures scopées successives tranchent, et ce
 * qui n'est ni l'un ni l'autre n'ouvre rien.
 *
 * **Une clé distincte d'`indicateur`, et non une valeur de plus sur elle** : ce
 * sont deux objets, pas deux gestes sur le même — la règle posée pour
 * `ressource` en T4.2. Une seule clé les porterait au prix d'une valeur
 * polymorphe que rien ne désambiguïserait : un identifiant d'indicateur y
 * voudrait dire « corriger cet indicateur » d'un côté et « lui ajouter un
 * relevé » de l'autre.
 *
 * **La règle d'exclusivité de la page produit passe de deux clés à trois sans
 * changer d'énoncé**, le décompte de T5.2 ayant été écrit pour cela.
 */
export const READING_PANEL_PARAM = "releve";

/**
 * Le panneau **« Gérer les relevés »** d'un indicateur (hors ticket, 17/08/2026),
 * septième clé d'ouverture du produit. La valeur est l'identifiant de
 * l'**indicateur** dont on déplie la série.
 *
 * **Au pluriel, et distincte de `releve` au singulier** : ce sont deux gestes sur
 * deux objets — l'un saisit *un* relevé, l'autre gère *la série*. La règle posée
 * pour `ressource` en T4.2 : une seule clé les porterait au prix d'une valeur
 * polymorphe que rien ne désambiguïserait, un identifiant d'indicateur y voulant
 * dire « saisir un relevé sur lui » d'un côté et « lister les siens » de l'autre.
 *
 * Elle rejoint le **décompte d'exclusivité** de la page produit, qui passe de
 * trois clés à quatre sans que son énoncé change — il a été écrit pour cela en
 * T5.2. `de` et `a` restent hors du décompte : ce ne sont pas des clés
 * d'ouverture.
 *
 * Le panneau existe parce que les cartes du bloc fusionné n'ont plus la place
 * d'afficher la série en ligne : sans lui, « Modifier » et « Archiver » un relevé
 * disparaîtraient de l'interface, et T5.3 les avait livrés avec leur migration.
 */
export const READINGS_PANEL_PARAM = "releves";

/**
 * Le panneau de la **vision produit** (18/08/2026), cinquième clé d'ouverture de
 * la page produit — et la première qui ne touche ni un indicateur ni un relevé.
 *
 * **Une seule valeur d'ouverture, `modifier`**, et non un identifiant : l'objet
 * visé est le produit de la page, comme pour `archiver`. Il n'y a rien à
 * désigner, et une valeur polymorphe n'aurait rien dit de plus. Toute autre
 * valeur n'ouvre rien.
 *
 * **Une seule valeur pour les deux gestes**, écrire et récrire : la vision est
 * une colonne nullable, pas deux lignes — c'est l'état de la colonne qui décide
 * du titre du panneau, jamais l'URL. `indicateur` avait besoin de `nouvel`
 * parce que créer et corriger portent sur deux lignes distinctes ; ici, non.
 *
 * Elle rejoint le **décompte d'exclusivité** de la page produit, qui passe de
 * quatre clés à cinq sans que son énoncé change d'un caractère — il a été écrit
 * en décompte pour cela dès T5.2.
 *
 * **Le droit qui la garde n'est pas celui des indicateurs** : `manageDomain`
 * seul (F1-D1, D9), la vision étant une propriété du produit et non de ses
 * accompagnements. Ce n'est pas cette route qui protège, mais
 * `updateProductVision`, qui redérive le droit sur l'identifiant reçu.
 */
export const VISION_PANEL_PARAM = "vision";

/** La seule valeur d'ouverture. Toute autre n'ouvre rien. */
export const VISION_PANEL_EDIT = "modifier";

/**
 * Le panneau de **saisie d'un persona** (18/08/2026), sixième clé d'ouverture
 * de la page produit.
 *
 * **Une seule clé, dont la valeur porte le cas** — la forme d'`indicateur` :
 * `nouveau` ouvre le panneau vide, un identifiant de persona l'ouvre sur la
 * ligne à corriger, tout le reste n'ouvre rien. Créer et corriger portent ici
 * sur deux lignes distinctes, à la différence de la vision : la valeur doit
 * donc désigner.
 *
 * **Le droit qui la garde est celui des indicateurs**, dérivé des
 * accompagnements du produit (arbitrage (b) de `tickets-C5.md`) : un persona
 * sort du travail d'accompagnement, et inventer un troisième niveau de droit
 * pour lui serait ce que D9 refuse. Ce n'est pas cette route qui protège, mais
 * les trois actions, qui redérivent le droit sur l'identifiant reçu.
 */
export const PERSONA_PANEL_PARAM = "persona";

/** La valeur qui ouvre le panneau vide. Un identifiant ouvre la correction. */
export const PERSONA_PANEL_NEW = "nouveau";

/**
 * Le panneau de **lecture d'un persona** (18/08/2026), septième et dernière clé
 * d'ouverture de la page produit. Sa valeur est **toujours** un identifiant de
 * persona, jamais polymorphe.
 *
 * **Deux clés et non une pour un même objet**, à rebours de la règle
 * d'`indicateur` : ce ne sont pas deux gestes de même rang, ce sont deux
 * **droits** différents. La fiche se lit par tout le domaine (D9), comme le
 * bloc qui la porte ; la saisie demande le droit d'écrire. Une clé unique aurait
 * mêlé les deux, et la fiche serait tombée avec le droit — c'est exactement la
 * séparation que `releves` tient déjà pour la série d'un indicateur.
 */
export const PERSONA_DETAIL_PARAM = "fiche";

/**
 * Le panneau de la **fiche d'une personne** (T5bis.4), seule clé d'ouverture de
 * la page Équipe — et la première d'une page qui n'a pas d'objet à elle.
 *
 * **Sa valeur est toujours un identifiant de personne**, jamais polymorphe et
 * jamais une valeur fixe : c'est la forme de `PERSONA_DETAIL_PARAM`, pour la
 * même raison — la fiche détaille une ligne, et il n'y a rien à créer ici.
 *
 * **Elle reste une adresse, elle n'est plus le mécanisme** (TD.2) :
 * `/equipe?personne=<identifiant>` rend encore la fiche au rendu serveur, mais
 * le clic passe par `DrawerHost` et n'écrit plus l'URL. Les deux chemins
 * traversent la **même** résolution — `lib/drawers/team.tsx`.
 *
 * **Aucun droit ne la garde** : la fiche se lit par tout le domaine (D9), comme
 * la liste qui la porte. T5bis.6 ajoutera deux clés d'écriture — `personne` y
 * prendra une seconde valeur, `nouvelle`, et `competence` viendra à côté —, qui
 * demanderont `manageDomain` (arbitrage (c)).
 */
export const PERSON_PANEL_PARAM = "personne";

/**
 * Les deux bornes de la fenêtre de la **roadmap**, sur la page du produit.
 *
 * **Ce ne sont pas des clés d'ouverture**, et elles ne rejoignent donc pas le
 * décompte d'exclusivité des six précédentes : elles n'ouvrent aucun panneau,
 * ne portent aucun geste d'écriture, et leur absence est un état normal — la
 * roadmap sans filtre — plutôt qu'une fermeture. Une fenêtre est une lecture.
 *
 * **Deux clés et non une**, à rebours de la règle d'`activite` : ce ne sont pas
 * deux gestes sur un objet, ce sont les deux bornes d'un même intervalle, que
 * les deux `<select>` du formulaire GET soumettent nativement sous deux noms. Un
 * paramètre unique « 2025-01..2025-12 » demanderait de le recomposer en
 * JavaScript, que le bloc s'interdit.
 *
 * Elles se lisent **ensemble ou pas du tout** : `timelineWindow` retombe sur
 * l'axe entier dès que l'une manque ou ne vaut pas « YYYY-MM ». C'est la seule
 * porte par où elles entrent dans un calcul, et elle s'éprouve par test.
 */
export const ROADMAP_FROM_PARAM = "de";
export const ROADMAP_TO_PARAM = "a";

/**
 * Les adresses des sept écrans, et des formulaires qui les alimentent. Les
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
  /**
   * La page du produit, panneau de relevé ouvert sur un indicateur donné (T5.3).
   * Le geste part de l'entrée de l'indicateur dans le bloc — jamais d'ailleurs :
   * un relevé n'existe pas hors de l'indicateur qu'il mesure. La fermeture reste
   * `product(id)`.
   */
  productReadingNew: (id: string, indicatorId: string) =>
    `/produits/${id}?${READING_PANEL_PARAM}=${indicatorId}`,
  /**
   * Le même panneau, sur un relevé existant (T5.3) : un seul formulaire, deux
   * points d'entrée — la forme de `productIndicatorEdit` jusqu'au nom de la clé,
   * à ceci près que la valeur change ici de **table** et non de nature.
   */
  productReadingEdit: (id: string, readingId: string) =>
    `/produits/${id}?${READING_PANEL_PARAM}=${readingId}`,
  /**
   * La page du produit, panneau « Gérer les relevés » ouvert sur un indicateur.
   * Même mécanique que les précédents : un paramètre, pas un écran de plus, et
   * la fermeture reste `product(id)`.
   */
  productReadings: (id: string, indicatorId: string) =>
    `/produits/${id}?${READINGS_PANEL_PARAM}=${indicatorId}`,
  /**
   * La page du produit, panneau de la vision ouvert (18/08/2026). **Ce n'est pas
   * un écran de plus** : c'est le même, avec un paramètre — la forme de
   * `productArchive` jusqu'au nom de la clé, et la fermeture est donc
   * `product(id)`, qui n'a pas besoin d'entrée à elle.
   *
   * **Une seule entrée pour les deux gestes**, écrire et récrire : c'est l'état
   * de la colonne qui décide de ce que le panneau annonce, jamais l'URL.
   */
  productVision: (id: string) =>
    `/produits/${id}?${VISION_PANEL_PARAM}=${VISION_PANEL_EDIT}`,
  /**
   * La page du produit, panneau de saisie d'un persona ouvert sur le vide.
   * Même mécanique que `productIndicatorNew` jusqu'au nom de la clé : un
   * paramètre, pas un écran de plus, et la fermeture reste `product(id)`.
   */
  productPersonaNew: (id: string) =>
    `/produits/${id}?${PERSONA_PANEL_PARAM}=${PERSONA_PANEL_NEW}`,
  /**
   * La même page, le même panneau, ouvert sur un persona à corriger : la valeur
   * porte le cas, et c'est la seule différence avec l'entrée ci-dessus.
   */
  productPersonaEdit: (id: string, personaId: string) =>
    `/produits/${id}?${PERSONA_PANEL_PARAM}=${personaId}`,
  /**
   * La page du produit, **fiche** d'un persona ouverte en lecture. Elle ne
   * demande aucun droit : c'est le détail que la carte résume, et il se lit par
   * tout le domaine (D9). Les gestes *dans* la fiche, eux, tombent avec le droit.
   */
  productPersona: (id: string, personaId: string) =>
    `/produits/${id}?${PERSONA_DETAIL_PARAM}=${personaId}`,
  /**
   * La page du produit, roadmap resserrée sur une fenêtre de mois.
   *
   * **Ce n'est pas un écran de plus**, comme les panneaux au-dessus : c'est le
   * même, avec deux paramètres. La différence est qu'ils ne portent aucun geste
   * d'écriture — une fenêtre est une lecture, et l'URL sans eux
   * (`product(id)`) est l'état sans filtre plutôt qu'une fermeture.
   *
   * Les deux bornes voyagent **ensemble** : `timelineWindow` retombe sur l'axe
   * entier dès que l'une manque, et une route qui n'en poserait qu'une ne mènerait
   * jamais qu'à l'état sans filtre.
   */
  productRoadmapWindow: (id: string, from: string, to: string) =>
    `/produits/${id}?${ROADMAP_FROM_PARAM}=${from}&${ROADMAP_TO_PARAM}=${to}`,
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
  /**
   * La page du projet, panneau d'annulation ouvert sur une activité donnée. Le
   * geste part du menu de l'entrée de roadmap — jamais d'ailleurs. La fermeture
   * reste `project(id)` : annuler une activité ne fait pas quitter la page de
   * l'accompagnement, pas plus qu'en saisir une.
   */
  projectActivityCancel: (id: string, activityId: string) =>
    `/projets/${id}?${CANCEL_PANEL_PARAM}=${activityId}`,
  /**
   * La page du projet, panneau d'adoption ouvert (T5.4). **La même clé que la
   * page produit**, comme la note d'`INDICATOR_PANEL_PARAM` l'annonçait : ce
   * sont deux pages, jamais la même URL, et rien n'a eu à changer là-haut. La
   * fermeture reste `project(id)`.
   */
  projectIndicatorNew: (id: string) =>
    `/projets/${id}?${INDICATOR_PANEL_PARAM}=${INDICATOR_PANEL_NEW}`,
  /**
   * Le même panneau, sur une adoption existante (T5.4) : un seul formulaire,
   * deux points d'entrée — la forme de `projectResourceEdit` jusqu'au nom de la
   * clé.
   *
   * **La valeur porte l'identifiant de l'adoption, et non celui de
   * l'indicateur.** C'est la règle tenue partout depuis T3.4 : la valeur désigne
   * l'objet que le panneau corrige, et ici c'est la ligne de
   * `project_indicators` — celle qui porte la référence, la cible et la valeur
   * finale. La même clé change donc de **table** d'un écran à l'autre, comme
   * `releve` en change entre ses deux cas.
   */
  projectIndicatorEdit: (id: string, adoptionId: string) =>
    `/projets/${id}?${INDICATOR_PANEL_PARAM}=${adoptionId}`,
  /**
   * Le référentiel des personnes (T5bis.2).
   *
   * **Cet écran n'a pas de page de détail**, et n'en aura pas : D29 tient. La
   * fonction ci-dessous n'en est donc pas une — c'est la même adresse, avec un
   * paramètre.
   */
  team: "/equipe",
  /**
   * La page Équipe, **fiche d'une personne ouverte** en lecture (T5bis.4).
   *
   * **Ce n'est pas un écran de plus** : c'est le même, avec un paramètre — la
   * forme de `productPersona` jusqu'au nom de la clé, et la fermeture est donc
   * `team`, qui n'a pas besoin d'entrée à elle. Elle ne demande aucun droit :
   * la fiche se lit par tout le domaine (D9), comme la liste qui la porte.
   *
   * **La forme canonique, et non celle qu'emploie la liste** : une ligne
   * filtrée y ajoute les filtres courants pour que la sortie du panneau les retrouve
   * sans JavaScript. Cette recomposition appartient à l'écran, qui seul a lu et
   * confronté ces valeurs — une route ne recopie pas des paramètres qu'elle n'a
   * pas vérifiés.
   */
  teamPerson: (personId: string) => `/equipe?${PERSON_PANEL_PARAM}=${personId}`,
  about: "/a-propos",
} as const;

/**
 * Navigation principale, dans l'ordre attendu par le ticket.
 *
 * **Cinq entrées depuis T5bis.2**, quand `docs/06` §8 en écrit quatre : l'écart
 * est décidé par la fiche du ticket et consigné au journal technique. Équipe se
 * place après « Projets » et avant « À propos » — le chemin canonique reste
 * Produits › Projets, et une personne n'est pas un chemin vers un
 * accompagnement.
 */
export const MAIN_NAV: readonly NavEntry[] = [
  { href: ROUTES.overview, label: "Vue d'ensemble" },
  { href: ROUTES.products, label: "Produits" },
  { href: ROUTES.projects, label: "Projets" },
  { href: ROUTES.team, label: "Équipe" },
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
