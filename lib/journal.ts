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
 * moyen qu'ils divergent serait de changer la table des participes. **Trois
 * formes depuis T6.2**, et la troisième n'est pas un quatorzième point d'appel
 * déguisé : les onze gestes qui disent « ceci a été créé, corrigé ou archivé »
 * passent tous par `objectPhrase`, et seuls les deux qui font *atteindre un
 * état* passent par `statePhrase`.
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

/**
 * L'espace insécable, U+00A0. Devant « : » et « ; », la typographie l'exige.
 *
 * Il est posé aussi **devant le tiret d'incise** du motif d'annulation (T6.2),
 * où la typographie ne l'exige pas : un tiret rejeté seul en début de ligne
 * dans une frise repliée se lit comme une puce, et la phrase paraît coupée.
 */
const NBSP = "\u00A0";

/**
 * Les objets dont le journal sait parler — **les six d'`event_target_type`**.
 *
 * Ils sont deux depuis T6.1 et six depuis T6.2, **chacun arrivé avec le geste
 * qui l'écrit** : un nom sans appelant est celui que le ticket suivant
 * emploierait de travers. L'énuméré est désormais couvert entier, et il ne
 * s'étend pas — persona, use case, indicateur, personne, entité et vision
 * produit ne sont pas journalisés (arbitrage (b) de `tickets-C6.md`).
 */
export type JournalKind =
  | "project"
  | "member"
  | "activity"
  | "resource"
  | "result"
  | "indicator_reading";

/**
 * Ce qu'un geste a fait de l'objet.
 *
 * **`restored` n'est pas un verbe de l'énuméré**, et c'est voulu :
 * `restoreProject` écrit le verbe `updated` — rétablir *est* une modification
 * pour la base. Ce que la phrase distingue, la colonne n'a pas à le distinguer.
 *
 * **Les quatre suffisent aux six objets, et T6.2 n'en ajoute aucun.** Un
 * cinquième participe pour le rétablissement d'une ressource ou d'un résultat
 * n'aurait pas d'appelant : ces objets se **ressaisissent** plutôt qu'ils ne se
 * rétablissent (arbitrage (b) de `tickets-C4bis.md`).
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
