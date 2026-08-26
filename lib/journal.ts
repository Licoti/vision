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
 * moyen qu'ils divergent serait de changer la table des participes.
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

/** L'espace insécable, U+00A0. Devant « : » et « ; », la typographie l'exige. */
const NBSP = "\u00A0";

/**
 * Les objets dont le journal sait parler — un sous-ensemble d'`event_target_type`.
 *
 * **Deux, et deux seulement, parce que T6.1 n'en journalise que deux.** Un nom
 * sans appelant est celui que le ticket suivant emploiera de travers :
 * `activity`, `resource`, `result` et `indicator_reading` arrivent en T6.2,
 * avec les gestes qui les écrivent.
 */
export type JournalKind = "project" | "member";

/**
 * Ce qu'un geste a fait de l'objet.
 *
 * **`restored` n'est pas un verbe de l'énuméré**, et c'est voulu :
 * `restoreProject` écrit le verbe `updated` — rétablir *est* une modification
 * pour la base. Ce que la phrase distingue, la colonne n'a pas à le distinguer.
 */
export type JournalDeed = "created" | "updated" | "archived" | "restored";

/**
 * Le nom français de chaque objet, et son genre.
 *
 * Le genre n'est pas un ornement : « Accompagnement créé » et « Équipe
 * modifiée » ne s'écrivent pas de la même manière, et les quatre participes
 * ci-dessous forment tous leur féminin par un `e`. Les deux genres ont un
 * appelant dans ce ticket — sans quoi la moitié du mécanisme serait à la merci
 * du premier qui s'en servirait.
 *
 * `member` porte « Équipe » et non « Membre » : la fiche pose **une seule
 * ligne** pour tout le diff, jamais une par personne. C'est la composition qui
 * a changé, pas un membre.
 */
const NOUNS: Record<JournalKind, { label: string; feminine: boolean }> = {
  project: { label: "Accompagnement", feminine: false },
  member: { label: "Équipe", feminine: true },
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
