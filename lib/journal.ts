/**
 * Le vocabulaire du journal — les phrases d'`events`, et rien d'autre.
 *
 * **Pur : ce module ne touche pas la base.** L'écriture est dans
 * `lib/db/scoped.ts` (`record`), le déclenchement est dans l'action — arbitrage
 * (a) de `tickets-C6.md`. Ici ne vit que ce que le geste **dit**.
 *
 * **Une fonction par forme de phrase, jamais une par point d'appel.** C'est ce
 * qui empêche deux gestes voisins de dire la même chose de deux manières :
 * `createProject` et `archiveProject` traversent la même fonction, et le seul
 * moyen qu'ils divergent serait de changer la table des participes. **Six
 * formes depuis T9.6** : les gestes qui disent « ceci a été créé, corrigé,
 * archivé ou rétabli » passent tous par `objectPhrase`, ceux qui font *atteindre
 * un état* par `statePhrase`, ceux qui touchent la composition d'une équipe par
 * `teamPhrase`, ceux qui relient deux accompagnements par `linkPhrase`, la
 * désignation de la North Star par `northStarPhrase`, et l'accès d'une personne
 * au domaine par `accessPhrase`.
 *
 * **La sixième non plus n'est pas venue d'un objet, mais d'un geste** : `person`
 * était déjà l'un des seize noms, et `objectPhrase` savait dire « Personne
 * modifiée ». Ce qu'elle ne savait pas dire, c'est qu'un compte vient de
 * s'ouvrir.
 *
 * **T8.3 n'a ajouté aucune forme pour les dix objets neufs**, et c'est la
 * mesure de ce que `objectPhrase` porte : dix noms de plus dans `NOUNS`, zéro
 * fonction de plus. La cinquième forme n'est pas venue d'un objet, elle est
 * venue d'un **geste** que les quatre participes ne savaient pas dire.
 *
 * **`summary` est figé à l'écriture** (D22, arbitrage (e)) : le libellé de
 * l'objet est recopié dans la phrase parce que c'est lui qui disparaîtrait
 * autrement — le nom d'un accompagnement renommé depuis, celui d'une personne
 * partie. Le nom de l'**acteur** n'y est jamais : il se lit par `actor_id`, et
 * il est courant. Une personne renommée l'est partout dans le journal, ce qui
 * est juste — c'est la même personne.
 *
 * **L'insécable s'écrit en échappement, jamais en caractère.** `NBSP` ci-dessous
 * porte U+00A0 sous un nom lisible : dans un source comme dans un navigateur,
 * l'insécable et l'espace ordinaire sont indiscernables à l'œil, et une règle
 * qu'on ne peut pas voir est une règle qui saute au premier copier-coller
 * (leçon de `lib/format.test.ts`).
 */

import type { ActivityState } from "@/lib/forms/activity";
import type { PersonRoleValue } from "@/lib/forms/person";

/**
 * L'espace insécable, U+00A0. Devant « : » et « ; », la typographie l'exige.
 *
 * Il est posé aussi **devant le tiret d'incise** du motif d'annulation (T6.2),
 * où la typographie ne l'exige pas : un tiret rejeté seul en début de ligne
 * dans une frise repliée se lit comme une puce, et la phrase paraît coupée.
 */
const NBSP = "\u00A0";

/**
 * Les objets dont le journal sait parler — **les seize d'`event_target_type`**.
 *
 * Ils sont deux depuis T6.1, six depuis T6.2 et seize depuis T8.3, **chacun
 * arrivé avec le geste qui l'écrit** : un nom sans appelant est celui que le
 * ticket suivant emploierait de travers. L'énuméré reste couvert entier, et
 * l'union se tient à la main plutôt que de se dériver de `eventTargetType` —
 * `lib/journal.ts` est **pur**, il n'importe pas le schéma, et c'est ce qui lui
 * permet de se tester sans base.
 *
 * **Ce qui n'y est toujours pas, et pourquoi.** Le produit lui-même, l'adoption
 * d'indicateur, la compétence portée et les huit référentiels d'administration
 * écrivent encore sans laisser de trace : ils n'étaient pas dans la liste des
 * onze que la fiche T8.3 autorise, et un objet ajouté « pendant qu'on y est »
 * est exactement ce que la règle 3 refuse. Point ouvert, récrit dans `ETAT.md`.
 */
export type JournalKind =
  | "project"
  | "member"
  | "activity"
  | "resource"
  | "result"
  | "indicator_reading"
  /* Les dix de T8.3, dans l'ordre de l'énuméré. */
  | "persona"
  | "use_case"
  | "indicator"
  | "person"
  | "entity"
  | "product_vision"
  | "budget"
  | "tracking"
  | "tagging_plan"
  | "context_marker";

/**
 * Ce qu'un geste a fait de l'objet.
 *
 * **`restored` n'est pas un verbe de l'énuméré**, et c'est voulu :
 * `restoreProject` écrit le verbe `updated` — rétablir *est* une modification
 * pour la base. Ce que la phrase distingue, la colonne n'a pas à le distinguer.
 *
 * **Les quatre suffisent aux seize objets, et T8.3 n'en ajoute aucun.** Un
 * cinquième participe pour le rétablissement d'une ressource ou d'un résultat
 * n'aurait pas d'appelant : ces objets se **ressaisissent** plutôt qu'ils ne se
 * rétablissent (arbitrage (b) de `tickets-C4bis.md`). `restored` a gagné un
 * second appelant en T8.3 — `restoreEntity` —, et c'est le seul mouvement.
 *
 * **Aucun participe pour l'effacement**, et ce n'est pas un oubli : ni
 * `deletePerson`, ni `deleteEntity`, ni `deleteProject` n'écrivent au journal.
 * Les deux premiers n'ont aucun `event_verb` qui les dise — `archived` dirait
 * « rangé » d'un geste qui efface, et T8.3 s'interdit un sixième verbe ; le
 * troisième ne le peut pas, `events.project_id` étant `cascade`. Un participe
 * sans verbe et sans appelant serait le nom que le ticket suivant emploierait de
 * travers.
 */
export type JournalDeed = "created" | "updated" | "archived" | "restored";

/**
 * Le nom français de chaque objet, et son genre.
 *
 * Le genre n'est pas un ornement : « Accompagnement créé » et « Équipe
 * modifiée » ne s'écrivent pas de la même manière, et les quatre participes
 * ci-dessous forment tous leur féminin par un `e`. Les deux genres ont un
 * appelant dans chacun des deux tickets — sans quoi la moitié du mécanisme
 * serait à la merci du premier qui s'en servirait.
 *
 * `member` porte « Équipe » et non « Membre » : la fiche pose **une seule
 * ligne** pour tout le diff, jamais une par personne. C'est la composition qui
 * a changé, pas un membre.
 *
 * **`person` et `member` ne sont pas le même objet, et ce n'est pas une
 * redondance** (T8.3). `member` dit la composition d'une équipe
 * d'accompagnement — un rattachement, porté par `project_members` ; `person`
 * dit la fiche d'une personne du référentiel Équipe, qui existe sans aucun
 * accompagnement. Deux `target_type`, deux libellés, et le second ne porte
 * jamais de projet.
 *
 * **`product_vision` est un objet du journal sans être une table** : la vision
 * est une colonne de `products`, écrite par son seul geste. Elle a son
 * `target_type` parce que c'est le geste qui se journalise, jamais la colonne —
 * et le produit lui-même, qui n'est pas dans la liste des dix, n'en a pas.
 *
 * **`activity` porte « Activité », et le mot reste au fait d'accompagnement.**
 * `docs/04` §4 pose le piège en toutes lettres : à l'écran on dit *journal* et
 * *événement*, et « activité » ne désigne jamais une ligne d'`events`. Ici le
 * mot est à sa place — c'est bien l'atelier, l'audit ou la campagne de tests
 * qui a été créé.
 *
 * **`indicator_reading` porte « Relevé », et sa phrase nomme l'indicateur** :
 * un relevé n'a pas de nom propre, et « Relevé créé : 62 » ne désignerait rien.
 * Ce que le lecteur cherche est *lequel* — « Relevé créé : Autonomie ».
 */
const NOUNS: Record<JournalKind, { label: string; feminine: boolean }> = {
  project: { label: "Accompagnement", feminine: false },
  member: { label: "Équipe", feminine: true },
  activity: { label: "Activité", feminine: true },
  resource: { label: "Ressource", feminine: true },
  result: { label: "Résultat", feminine: false },
  indicator_reading: { label: "Relevé", feminine: false },

  /* Les dix de T8.3. **Chaque libellé est celui de l'écran**, jamais celui de
     la table : « Use case » est le titre du bloc et le mot de tous ses
     `aria-label`, « Vision produit » celui de l'en-tête du bloc de tête, et
     « Outil de mesure » celui des messages de refus de `produits/[id]` — le
     bloc s'appelle « Dispositif de mesure », mais c'est le **bloc**, quand la
     ligne journalisée est un outil parmi ceux qu'il réunit. Un journal qui
     nommerait les objets autrement que l'écran obligerait à traduire. */
  persona: { label: "Persona", feminine: false },
  use_case: { label: "Use case", feminine: false },
  indicator: { label: "Indicateur", feminine: false },
  person: { label: "Personne", feminine: true },
  entity: { label: "Entité", feminine: true },
  product_vision: { label: "Vision produit", feminine: true },
  budget: { label: "Budget", feminine: false },
  tracking: { label: "Outil de mesure", feminine: false },
  tagging_plan: { label: "Plan de taggage", feminine: false },
  context_marker: { label: "Repère de contexte", feminine: false },
};

/** Les quatre participes. Leur féminin est régulier — un `e` suffit. */
const DEEDS: Record<JournalDeed, string> = {
  created: "créé",
  updated: "modifié",
  archived: "archivé",
  restored: "rétabli",
};

/** « Accompagnement créé », « Équipe modifiée ». */
function head(kind: JournalKind, deed: JournalDeed): string {
  const noun = NOUNS[kind];
  return `${noun.label} ${DEEDS[deed]}${noun.feminine ? "e" : ""}`;
}

/**
 * La première forme : un objet nommé, et ce qui lui est arrivé.
 *
 * « Accompagnement créé : Refonte du panier ».
 *
 * `label` est **figé ici** : c'est la désignation de ce qui a été touché, au
 * moment où on l'a touché. Sur une correction, c'est le nom **d'après** le
 * geste — écrire celui d'avant serait une « valeur avant », que D22 refuse.
 */
export function objectPhrase(
  kind: JournalKind,
  deed: JournalDeed,
  label: string,
): string {
  return `${head(kind, deed)}${NBSP}: ${label}`;
}

/**
 * Les états qu'un geste de cycle de vie fait **atteindre** — T6.2.
 *
 * **Trois, et jamais `planned`** : `transitionActivity` ne vise que
 * `in_progress` et `done` (`canTransitionActivity`), `cancelActivity` que
 * `cancelled`. Rien ne ramène une activité à « prévu », et un quatrième nom
 * sans appelant est celui que le suivant emploierait de travers. Le `Extract`
 * le tient depuis l'énuméré plutôt que d'en recopier une union : le jour où
 * `activity_state` gagne une valeur, ce type ne mentira pas.
 */
export type JournalState = Extract<
  ActivityState,
  "in_progress" | "done" | "cancelled"
>;

/**
 * L'état atteint, déjà accordé au féminin d'« Activité ».
 *
 * **Ces trois-là ne passent pas par `DEEDS`**, et ce n'est pas un oubli : « en
 * cours » n'est pas un participe, et « terminée » ne se forme pas depuis
 * « terminé » par la même règle que les quatre autres — la mécanique `feminine`
 * de `head` suppose un féminin régulier. Les écrire accordés ici évite
 * d'inventer une seconde règle d'accord pour trois valeurs.
 *
 * Les mots sont ceux de la roadmap (`docs/03` §6, `lib/queries/activities.ts`),
 * au genre près : ce que le journal dit d'une activité et ce que la roadmap
 * affiche d'elle ne doivent pas être deux vocabulaires.
 */
const STATES: Record<JournalState, string> = {
  in_progress: "en cours",
  done: "terminée",
  cancelled: "annulée",
};

/**
 * La troisième forme : l'état qu'une activité vient d'atteindre.
 *
 * « Activité terminée : Audit UX » · « Activité annulée : Audit UX — Reporté
 * à 2027 ».
 *
 * **C'est la forme d'`objectPhrase`, l'état à la place du participe**, et
 * l'unité de gabarit est le seul moyen qu'une frise mêlant les deux reste
 * lisible. La distinction porte sur ce que le geste a fait, pas sur la façon de
 * le dire : « Activité modifiée » est une correction de saisie, « Activité
 * terminée » un fait d'accompagnement.
 *
 * **Le motif n'est facultatif que dans cette signature.** `activities_cancelled_
 * requires_reason` l'exige en base et `cancelActivity` le valide avant
 * d'écrire ; ce module ne redécide rien — il ne compose pas une clause vide
 * quand rien ne lui est passé, et c'est tout ce qu'il garantit.
 *
 * Le motif est **figé** comme le libellé : c'est ce que le geste voulait dire,
 * et il disparaîtrait de la phrase le jour où l'activité serait corrigée.
 */
export function statePhrase(
  state: JournalState,
  label: string,
  reason?: string | null,
): string {
  const clause = `${NOUNS.activity.label} ${STATES[state]}${NBSP}: ${label}`;
  return reason ? `${clause}${NBSP}— ${reason}` : clause;
}

/**
 * Ce qu'un geste a fait de la **North Star** — T8.3.
 *
 * **Deux, et pas quatre** : `setNorthStar` désigne un indicateur, ou retire la
 * désignation sans en poser d'autre (`indicatorId` à `null`). Rien ne l'archive
 * ni ne la rétablit — c'est un drapeau sur `indicators.is_north_star`, pas une
 * ligne.
 */
export type JournalNorthStarDeed = "designated" | "removed";

/**
 * Les deux participes, accordés au féminin de « North Star ».
 *
 * **Ils ne passent pas par `DEEDS`**, et pour la raison qui écarte déjà les
 * trois états de `STATES` : « désigné » n'est pas dans la table des quatre, et
 * « retiré » y dirait autre chose — `LINK_DEEDS.removed` parle d'un lien
 * déclaré. Les écrire accordés ici évite d'inventer une seconde règle d'accord
 * pour deux valeurs.
 *
 * L'écran dit « Aucune North Star désignée » : le journal reprend son mot.
 */
const NORTH_STAR_DEEDS: Record<JournalNorthStarDeed, string> = {
  designated: "désignée",
  removed: "retirée",
};

/**
 * La cinquième forme : la North Star qu'un produit vient de se donner, ou de
 * reprendre.
 *
 * « North Star désignée : Autonomie » · « North Star retirée : Autonomie ».
 *
 * **C'est le gabarit d'`objectPhrase`, le nom de l'objet en moins** — et c'est
 * voulu : « Indicateur désigné : Autonomie » ne dirait pas *ce qui* a été
 * désigné, quand le seul geste de désignation du produit porte ce nom-là à
 * l'écran. Le `target_type` reste `indicator`, qui est l'objet touché ; la
 * phrase dit le geste. C'est exactement la dissociation de `linkPhrase`, et les
 * deux sont vraies — c'est la phrase qui se lit.
 *
 * **`objectPhrase` n'aurait pas pu la porter** : ses quatre participes disent
 * ce qui est *arrivé à un objet*, jamais ce qu'un objet est *devenu pour un
 * autre*. Le verbe de la colonne le dit d'ailleurs aussi — `state_changed`, le
 * seul des cinq qui nomme un état atteint.
 *
 * **Le libellé est celui de l'indicateur, et il est figé** (D22) : au retrait,
 * c'est celui qui **cesse** d'être North Star — sans lui, la ligne dirait qu'on
 * a retiré quelque chose sans dire quoi.
 */
export function northStarPhrase(
  deed: JournalNorthStarDeed,
  label: string,
): string {
  return `North Star ${NORTH_STAR_DEEDS[deed]}${NBSP}: ${label}`;
}

/**
 * Ce qu'un geste a fait du **compte** d'une personne — T9.6.
 *
 * **Deux, et pas quatre** : un accès s'accorde ou se retire, et le changement de
 * rôle est le premier — `grantPersonAccess` sert les deux, et ce qu'elle écrit
 * est toujours « cette personne a désormais ce rôle ». Rien ne l'archive ni ne
 * le rétablit : `has_access` et `domain_role` sont deux colonnes d'une ligne qui
 * reste.
 */
export type JournalAccessDeed = "granted" | "revoked";

/**
 * Les deux participes, accordés au masculin d'« Accès ».
 *
 * **Ils ne passent pas par `DEEDS`**, et pour la raison qui écarte déjà les
 * trois états de `STATES` et les deux de `NORTH_STAR_DEEDS` : « accordé » n'est
 * pas dans la table des quatre, et « retiré » y dirait autre chose —
 * `LINK_DEEDS.removed` parle d'un lien déclaré. Les écrire ici évite d'inventer
 * une seconde règle d'accord pour deux valeurs.
 */
const ACCESS_DEEDS: Record<JournalAccessDeed, string> = {
  granted: "accordé",
  revoked: "retiré",
};

/**
 * Les deux rôles, **en minuscules de phrase**.
 *
 * C'est le partage que `STATES` tient déjà avec la roadmap : le journal reprend
 * les mots de l'écran, à la casse près, parce qu'une phrase ne porte pas une
 * étiquette. `PERSON_ROLE_LABEL` (`lib/forms/person.ts`) reste l'autorité de ce
 * que le formulaire propose ; ici on écrit la même chose dans une phrase. Le
 * type, lui, est **le même** : ce module est pur — il n'importe pas le schéma —,
 * et il tient donc son union du dossier des formulaires, exactement comme
 * `ActivityState`.
 */
const ACCESS_ROLES: Record<PersonRoleValue, string> = {
  domain_manager: "responsable de domaine",
  member: "membre",
};

/**
 * La sixième forme : l'accès qu'une personne vient de recevoir, ou de perdre.
 *
 * « Accès accordé : Camille Roux — responsable de domaine » · « Accès retiré :
 * Camille Roux ».
 *
 * **C'est le gabarit d'`objectPhrase`, le nom de l'objet en moins**, et c'est le
 * choix de `northStarPhrase` pour la même raison : « Personne modifiée : Camille
 * Roux » ne dirait pas *ce qui* a changé, quand accorder un accès est un fait
 * plus lourd qu'un changement de nom. Le `target_type` reste `person`, qui est
 * l'objet touché ; la phrase dit le geste. Le verbe de la colonne est
 * `state_changed`, le seul des cinq qui nomme un état atteint — **aucun sixième
 * verbe**, ce qu'interdisent les interdits communs de C9.
 *
 * **Le rôle n'accompagne que l'accord.** Au retrait, il n'y a plus de rôle : le
 * dire serait raconter ce que la ligne ne porte plus. C'est la dissymétrie de
 * `statePhrase`, dont le motif ne vient qu'avec l'annulation.
 *
 * **Le nom est figé** (D22), comme partout : c'est la désignation de qui a reçu
 * l'accès au moment où il l'a reçu.
 */
export function accessPhrase(
  deed: JournalAccessDeed,
  label: string,
  role?: PersonRoleValue,
): string {
  const clause = `Accès ${ACCESS_DEEDS[deed]}${NBSP}: ${label}`;
  return role ? `${clause}${NBSP}— ${ACCESS_ROLES[role]}` : clause;
}

/** Les trois mouvements qu'une composition d'équipe peut avoir subis. */
export type TeamMoves = {
  readonly arrived: readonly string[];
  readonly left: readonly string[];
  readonly rerolled: readonly string[];
};

/** « Camille Roux », « Camille Roux et Rudy Zourane », « A, B et C ». */
const NAMES = new Intl.ListFormat("fr-FR", {
  style: "long",
  type: "conjunction",
});

/**
 * La seconde forme : ce qui a bougé dans l'équipe, en une phrase.
 *
 * « Équipe modifiée : Camille Roux rejoint l'équipe ; Léa Martin la quitte ;
 * Rudy Zourane change de rôle ».
 *
 * **Conjuguée, jamais accordée.** `persons` ne porte aucun genre, et il n'en
 * portera pas : « ajoutée » ou « ajouté » misgenderait une personne sur deux.
 * La troisième personne — « rejoint », « quitte », « change », et leurs pluriels
 * — est juste pour tout le monde.
 *
 * **Les noms se groupent par mouvement**, jamais une clause par personne : le
 * journal est une trace de geste, et une correction de formulaire qui renouvelle
 * cinq membres doit rester lisible en frise repliée.
 *
 * **Rend `null` quand rien n'a bougé, et c'est ici que la règle « une équipe qui
 * n'a pas changé n'écrit rien » se décide.** L'appelant n'a plus qu'à ne rien
 * écrire d'un `null` — il ne redécide pas, il constate. Un `teamSummary` qui
 * sort plus tôt pour s'épargner une lecture n'est pas une seconde autorité :
 * mesuré le 26/08/2026 en neutralisant ce `null`, la propriété tombe bien ici.
 */
export function teamPhrase(moves: TeamMoves): string | null {
  const clauses: string[] = [];

  if (moves.arrived.length > 0) {
    const verb = moves.arrived.length > 1 ? "rejoignent" : "rejoint";
    clauses.push(`${NAMES.format(moves.arrived)} ${verb} l'équipe`);
  }
  if (moves.left.length > 0) {
    const verb = moves.left.length > 1 ? "quittent" : "quitte";
    clauses.push(`${NAMES.format(moves.left)} la ${verb}`);
  }
  if (moves.rerolled.length > 0) {
    const verb = moves.rerolled.length > 1 ? "changent" : "change";
    clauses.push(`${NAMES.format(moves.rerolled)} ${verb} de rôle`);
  }

  if (clauses.length === 0) return null;
  return `${head("member", "updated")}${NBSP}: ${clauses.join(`${NBSP}; `)}`;
}

/**
 * Ce qu'un geste a fait d'un lien déclaré — T6.5.
 *
 * **Trois, et pas quatre** : un lien se déclare, se corrige et se retire ; rien
 * ne le rétablit, `project_links` n'ayant pas d'`archived_at` (`LinkTable`). Un
 * quatrième participe sans appelant est celui que le ticket suivant emploierait
 * de travers.
 */
export type JournalLinkDeed = "declared" | "updated" | "removed";

/** Les trois participes du lien. « Lien » est masculin : aucun accord à porter. */
const LINK_DEEDS: Record<JournalLinkDeed, string> = {
  declared: "déclaré",
  updated: "modifié",
  removed: "retiré",
};

/**
 * La quatrième forme : le lien qu'un accompagnement déclare vers un autre.
 *
 * « Lien déclaré : Refonte du panier — réutilise la grille d'entretien » ·
 * « Lien retiré : Refonte du panier ».
 *
 * **C'est la seule phrase du journal dont le nom ne soit pas celui de son
 * `target_type`**, et ce n'est pas une négligence. `event_target_type` n'a pas
 * de valeur `link` : les six sont figés par l'arbitrage (b) de
 * `tickets-C6.md`, et en ajouter une septième demanderait une migration, que le
 * chantier s'interdit. La colonne dit donc `project` — l'objet touché *est* un
 * accompagnement, celui que `target_id` désigne — et la phrase dit « Lien »,
 * qui est ce que le geste a fait. Les deux sont vrais ; c'est la phrase qui se
 * lit.
 *
 * **Le nom du projet visé est figé** (D22, arbitrage (e)) : c'est la
 * désignation de ce qui a été relié, et elle disparaîtrait autrement — au
 * retrait, la ligne de liaison n'existe plus pour la redonner.
 *
 * **La raison est figée avec elle, et seulement quand le geste en porte une.**
 * C'est la règle du motif d'annulation dans `statePhrase` : ce n'est pas une
 * « valeur avant » que D22 refuse, c'est ce que le geste voulait dire. Le
 * retrait, lui, n'en passe aucune — il ne dit pas *pourquoi* le lien existait,
 * il dit qu'il n'existe plus, comme « Ressource archivée » ne redonne pas
 * l'adresse du document.
 */
export function linkPhrase(
  deed: JournalLinkDeed,
  projectName: string,
  reason?: string | null,
): string {
  const clause = `Lien ${LINK_DEEDS[deed]}${NBSP}: ${projectName}`;
  return reason ? `${clause}${NBSP}— ${reason}` : clause;
}
