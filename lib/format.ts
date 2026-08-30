/**
 * Les formatages d'affichage, en français.
 *
 * Le temps se lit au mois, jamais au jour (D13) : Vision décrit des périodes
 * d'accompagnement, pas des horodatages. Un audit « de juin 2026 » ne gagne
 * rien à devenir « du 30 juin 2026 ».
 */

import type { Referential } from "@/lib/navigation";
import type { ActivityFamily } from "@/lib/queries/activities";
import type { IndicatorDirection } from "@/lib/queries/indicators";
import type { ProjectStatusNature } from "@/lib/queries/projects";
import type { ToolKind } from "@/lib/queries/referentials";
import type { ResourceType } from "@/lib/queries/resources";
import type { StarterKind } from "@/lib/queries/starters";

/**
 * L'espace insécable, U+00A0 — **écrit en échappement, jamais en caractère**
 * (T6.3).
 *
 * Il vivait ici en caractère depuis T4.3, et `lib/journal.ts` l'écrit sous ce
 * nom depuis T6.1 : deux écritures pour une seule règle, dont l'une invisible.
 * `ETAT.md` promettait le geste « au prochain ticket qui l'ouvre » — c'est
 * celui-ci. Dans un source comme dans un navigateur, l'insécable et l'espace
 * ordinaire sont indiscernables à l'œil, et une règle qu'on ne peut pas voir
 * est une règle qui saute au premier copier-coller.
 *
 * **Rien d'autre ne change** : `lib/format.test.ts` éprouve déjà la propriété
 * sur le point de code, et c'est ce test qui rend le remplacement mécanique.
 */
const NBSP = "\u00A0";

const MONTH = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
  // Les périodes sont stockées en `date`, remontées à minuit UTC. Sans ce
  // fuseau explicite, un serveur à l'ouest ferait reculer d'un mois toute
  // date tombant un premier du mois.
  timeZone: "UTC",
});

/** « août 2026 ». */
export function formatMonth(date: Date): string {
  return MONTH.format(date);
}

/**
 * Les colonnes `date` du schéma (`started_on`, `expected_end_on`, `read_on`…)
 * reviennent en chaîne `YYYY-MM-DD`, pas en `Date` : le pilote rend le type
 * PostgreSQL tel quel. La lecture se fait en UTC, pour la même raison que
 * `MONTH` porte son fuseau — un serveur à l'ouest reculerait d'un mois toute
 * date tombant un premier.
 */
function parseDay(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

/**
 * Le jour, pour la seule date de mesure d'un résultat (T4.3).
 *
 * **C'est la seule entorse au mois, et elle est bornée.** D13 pose « le mois »
 * comme unité de temps *de la roadmap*, et `formatActivityPeriod` la respecte :
 * une période d'accompagnement ne gagne rien à devenir un horodatage. Une date
 * de mesure n'est pas une période — c'est le fait daté qu'un outil externe a
 * produit, et D39 autorise « toute valeur reportée d'un outil externe, **avec
 * sa date** ». Un audit rendu le 31 mai perdrait son sens en « mai 2024 », qui
 * laisserait croire à un travail étalé sur tout le mois.
 *
 * Le fuseau explicite a la raison de `MONTH`, en plus serré encore : au jour,
 * un serveur à l'ouest reculerait **toute** date d'une journée, pas seulement
 * celles qui tombent un premier du mois.
 */
const DAY = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** « 31 mai 2024 ». Reçoit la chaîne `YYYY-MM-DD` d'une colonne `date`. */
export function formatDay(value: string): string {
  return DAY.format(parseDay(value));
}

/**
 * « 27 août 2026 » — le jour d'un **horodatage**, pour le journal (T6.3).
 *
 * `events.occurred_at` est un `timestamp with time zone`, non une colonne
 * `date` : il arrive en `Date` et n'a pas de chaîne `YYYY-MM-DD` à donner à
 * `formatDay`. D'où cette seconde porte sur le **même** formateur — la règle du
 * fuseau ne se réécrit pas, elle se partage.
 *
 * **Au jour, et c'est la seconde entorse bornée au mois de D13.** La première
 * est `formatDay` — la date de mesure d'un résultat. Celle-ci a la même nature
 * et la même limite : un événement de journal est un **fait daté ponctuel**,
 * pas une période d'accompagnement. Et le mois lui retirerait sa raison d'être
 * — dix lignes disant « août 2026 » ne retrouvent l'origine d'aucune saisie,
 * quand le bloc existe pour cela (`docs/06` §5 : *une information de
 * contrôle*).
 *
 * **Au jour et non à l'heure, et le fuseau en décide.** Les quatre formateurs
 * de ce module forcent `UTC` ; une heure affichée en UTC serait fausse pour qui
 * la lit, et la corriger demanderait `Europe/Paris` — la première rupture du
 * dépôt avec l'UTC, pour une précision que « retrouver l'origine d'une saisie »
 * ne réclame pas. Arbitrage (1) de T6.3.
 */
export function formatEventDay(value: Date): string {
  return DAY.format(value);
}

/**
 * « juin 2026 » — le mois d'une colonne `date`, reçue en « YYYY-MM-DD ».
 *
 * `formatMonth` prend un `Date` et `parseDay` est privé : sans cette fonction,
 * chaque écran qui lit une colonne `date` referait la conversion, et avec elle
 * la raison du fuseau explicite — un serveur à l'ouest ferait reculer d'un mois
 * toute date tombant un premier. Une règle qui vit à trois endroits n'en est
 * plus une.
 *
 * C'est le **mois** (D13), et non le jour de `formatDay` : la date d'un relevé
 * d'indicateur situe une mesure dans le temps long du produit, elle ne date pas
 * un fait ponctuel comme la mesure d'un résultat d'audit.
 */
export function formatDateMonth(value: string): string {
  return formatMonth(parseDay(value));
}

/**
 * Le mois abrégé d'une graduation d'axe : « mars '24 ».
 *
 * Reçoit « YYYY-MM » — la clé de mois de `lib/queries/timeline`, et non une
 * colonne `date` : une graduation situe un mois, elle ne date aucun fait.
 *
 * **Abrégé parce qu'il se répète.** Une graduation vit dans la largeur d'une
 * tranche d'axe, et « septembre 2026 » écrit huit fois de suite se chevauche là
 * où « sept. '26 » tient. C'est le seul endroit où le millésime se coupe à deux
 * chiffres : partout ailleurs, `formatMonth` l'écrit en entier.
 *
 * Le jour est forcé au premier et le fuseau reste UTC, pour la raison de
 * `MONTH` — sans quoi un serveur à l'ouest reculerait d'un mois toute
 * graduation, c'est-à-dire toutes.
 */
const MONTH_SHORT = new Intl.DateTimeFormat("fr-FR", {
  month: "short",
  timeZone: "UTC",
});

export function formatMonthTick(month: string): string {
  const date = parseDay(`${month}-01`);
  return `${MONTH_SHORT.format(date)} '${month.slice(2, 4)}`;
}

/**
 * La période d'un accompagnement, au mois (D13).
 *
 * « mars 2024 → septembre 2024 » · « depuis février 2026 » ·
 * « jusqu'à septembre 2024 » · « Période non renseignée ».
 *
 * Une période ouverte se dit « depuis » et non « mars 2024 → ? » : un
 * accompagnement en cours n'a pas de fin manquante, il n'en a pas encore.
 */
export function formatPeriod(
  startedOn: string | null,
  expectedEndOn: string | null,
): string {
  const start = startedOn ? formatMonth(parseDay(startedOn)) : null;
  const end = expectedEndOn ? formatMonth(parseDay(expectedEndOn)) : null;

  if (start && end) return `${start} → ${end}`;
  if (start) return `depuis ${start}`;
  if (end) return `jusqu'à ${end}`;
  return "Période non renseignée";
}

/**
 * La même période, **le mois abrégé** : « mars 2024 → sept. 2024 ».
 *
 * Pour les colonnes étroites, où `formatPeriod` et son « septembre » au long
 * poussent la période sur une deuxième ligne — la colonne de 280 px de la
 * roadmap, où la période partage sa ligne avec la pastille de statut.
 *
 * **Le millésime reste entier**, à la différence de `formatMonthTick` : une
 * graduation se répète le long d'un axe et se lit dans son voisinage, une
 * période se lit seule et doit se suffire. C'est le mois seul qu'on abrège.
 *
 * Les quatre cas de `formatPeriod`, à l'identique : une période ouverte se dit
 * « depuis » et non « mars 2024 → ? ». Un accompagnement en cours n'a pas une
 * fin manquante, il n'en a pas encore.
 */
const MONTH_SHORT_YEAR = new Intl.DateTimeFormat("fr-FR", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatPeriodShort(
  startedOn: string | null,
  expectedEndOn: string | null,
): string {
  const start = startedOn
    ? MONTH_SHORT_YEAR.format(parseDay(startedOn))
    : null;
  const end = expectedEndOn
    ? MONTH_SHORT_YEAR.format(parseDay(expectedEndOn))
    : null;

  if (start && end) return `${start} → ${end}`;
  if (start) return `depuis ${start}`;
  if (end) return `jusqu'à ${end}`;
  return "Période non renseignée";
}

/**
 * L'**étendue couverte** par une collection de dates — « janv. 2025 → juin 2026 ».
 *
 * Ce n'est pas la période d'un objet mais celle d'un ensemble : la page produit
 * s'en sert pour dire, en tête, de quand à quand ce produit a été accompagné.
 *
 * **C'est un fait, non un indice** : les deux bornes sont des dates saisies, et
 * la fonction ne fait que les retrouver. Rien n'est qualifié, rien n'est noté —
 * la frontière que `CLAUDE.md` trace entre le chiffre reporté et le chiffre
 * calculé par Vision n'est pas franchie.
 *
 * **Un seul mois se dit une seule fois.** Un produit accompagné sur un unique
 * trimestre rendrait « mars 2025 → mars 2025 », qui se lit comme une erreur
 * plutôt que comme une durée courte : les deux bornes sont comparées **après
 * mise en forme**, au mois, et non sur les jours.
 *
 * Les dates absentes ne comptent pas — un accompagnement sans date n'étend rien
 * —, et `null` quand aucune ne reste : la page n'a alors rien à écrire, et
 * `docs/06` §9 proscrit d'écrire l'absence là où elle n'apprend rien.
 */
export function formatCoverage(
  dates: readonly (string | null)[],
): string | null {
  const known = dates.filter((date): date is string => date !== null).sort();

  const first = known[0];
  const last = known[known.length - 1];
  if (!first || !last) return null;

  const start = MONTH_SHORT_YEAR.format(parseDay(first));
  const end = MONTH_SHORT_YEAR.format(parseDay(last));

  return start === end ? start : `${start} → ${end}`;
}

/**
 * La période d'une **activité**, au mois (D13).
 *
 * « août 2026 » · « mars 2026 → mai 2026 » · « À planifier » ·
 * « Période non renseignée ».
 *
 * `formatPeriod` ne conviendrait pas : une activité tient le plus souvent dans
 * un seul mois — du 1er au 31 août —, et elle s'afficherait
 * « août 2026 → août 2026 ». Le mois se replie donc quand les deux bornes
 * tombent dedans, et c'est toute la différence avec la période d'un
 * accompagnement, qui s'étale par nature.
 *
 * Une activité sans date **et** sans « à planifier » reste possible dans le
 * schéma — seuls `planned` et `done` sont contraints —, d'où la dernière
 * formule : on dit l'absence plutôt que de laisser un blanc.
 */
export function formatActivityPeriod(
  periodStart: string | null,
  periodEnd: string | null,
  isUnscheduled: boolean,
): string {
  if (isUnscheduled) return "À planifier";

  const start = periodStart ? formatMonth(parseDay(periodStart)) : null;
  const end = periodEnd ? formatMonth(parseDay(periodEnd)) : null;

  if (start && end) return start === end ? start : `${start} → ${end}`;
  if (start) return start;
  if (end) return end;
  return "Période non renseignée";
}

/**
 * « Camille Roux » → « CR ».
 *
 * Premier et dernier mot : un prénom composé ne produit pas trois lettres, et
 * un nom seul en produit une. Les initiales ne remplacent jamais le nom — le
 * groupe d'avatars écrit les noms en toutes lettres pour l'assistance.
 */
export function initials(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  const first = words[0];
  if (!first) return "";

  const last = words[words.length - 1];
  const letters = words.length > 1 && last ? [first[0], last[0]] : [first[0]];
  return letters.join("").toLocaleUpperCase("fr-FR");
}

/**
 * « 2 accompagnements » · « 1 accompagnement » · « Aucun accompagnement ».
 *
 * Zéro s'écrit en toutes lettres : une colonne pleine de « 0 » se lit comme
 * un manque, alors qu'un produit sans accompagnement est un produit normal.
 */
export function formatAccompaniments(count: number): string {
  if (count === 0) return "Aucun accompagnement";
  return `${count} accompagnement${count > 1 ? "s" : ""}`;
}

/**
 * « 1er accompagnement de ce produit » · « 2ᵉ accompagnement de ce produit ».
 *
 * Le rang **se calcule** — `findAccompanimentRank` le déduit de la place du
 * projet dans la chronologie de son produit. Ce qui se décide ici n'est que sa
 * forme française : ordinal masculin, « er » au premier, « ᵉ » ensuite.
 */
export function formatRank(rank: number): string {
  const ordinal = rank === 1 ? "1er" : `${rank}ᵉ`;
  return `${ordinal} accompagnement de ce produit`;
}

/**
 * « 3 projets » · « 1 projet » · « Aucun projet ».
 *
 * Le compteur de la liste transverse, qui dit ce que les filtres ont retenu.
 * Zéro s'écrit en toutes lettres, pour la même raison que ci-dessus.
 */
export function formatProjects(count: number): string {
  if (count === 0) return "Aucun projet";
  return `${count} projet${count > 1 ? "s" : ""}`;
}

/**
 * « 3 produits » · « 1 produit » · « Aucun produit ».
 *
 * Le décompte des produits rattachés à une entité, sur l'écran Administration
 * (21/08/2026). Il dit ce qui **s'oppose à un geste** — archiver, supprimer —
 * plutôt que ce qu'une recherche a retenu, et zéro y est donc l'état le plus
 * intéressant : c'est celui où les deux gestes s'ouvrent. Il s'écrit en toutes
 * lettres comme chez les quatre voisines.
 */
export function formatProducts(count: number): string {
  if (count === 0) return "Aucun produit";
  return `${count} produit${count > 1 ? "s" : ""}`;
}

/**
 * « 3 personnes » · « 1 personne » · « Aucune personne ».
 *
 * Le compteur de la liste Équipe, qui dit ce que les filtres ont retenu. Il
 * compte des lignes affichées, **jamais une mesure d'activité** : ce n'est pas
 * la taille du centre, c'est le résultat d'une recherche. Zéro s'écrit en
 * toutes lettres, la règle des quatre fonctions voisines.
 */
export function formatPersons(count: number): string {
  if (count === 0) return "Aucune personne";
  return `${count} personne${count > 1 ? "s" : ""}`;
}

/**
 * « 12 activités » · « 1 activité » · « Aucune activité ».
 *
 * **Les quatre décomptes qui suivent servent une seule phrase** : celle du
 * panneau qui annonce ce que la suppression d'un accompagnement emporte
 * (28/08/2026). Ils disent ce qu'un geste **efface**, là où `formatProducts` dit
 * ce qui s'y oppose — et c'est la seule chose qui aide à décider.
 *
 * **Ils ne s'affichent sur aucun écran de lecture.** Un nombre d'activités posé
 * à côté d'un accompagnement serait la mesure d'activité que D39 interdit ;
 * ici, il est le contenu d'une mise en garde, lue une fois, avant un geste
 * irréversible.
 *
 * **La clause s'est élargie en T7.3, et d'un seul cran** : un décompte qui dit
 * ce qui **s'oppose à un geste** sur l'écran de gestion des référentiels n'est
 * pas une mesure d'activité — c'est le rôle que `formatProducts` tient à côté
 * depuis le 21/08/2026, et il se lit dans son commentaire. « 3 projets ·
 * 12 activités » en face d'une approche ne qualifie pas l'approche : il dit
 * pourquoi l'archivage sera refusé. **T7.4 porte la clause de quatre
 * référentiels à huit** sans la changer d'un mot : un type d'activité compte
 * ses activités vivantes, un statut ses accompagnements vivants. Ce qui reste
 * interdit est inchangé — ce nombre ne paraît toujours ni sur une page de
 * produit, ni sur une page d'accompagnement, ni dans une ligne de liste qui
 * décrit un objet plutôt qu'un empêchement.
 *
 * Zéro s'écrit en toutes lettres, la règle des cinq fonctions voisines — et pour
 * une raison de plus ici : « 0 activité » se lirait comme un manque, quand la
 * phrase veut dire « rien de ce genre ne sera perdu ».
 */
export function formatActivities(count: number): string {
  if (count === 0) return "aucune activité";
  return `${count} activité${count > 1 ? "s" : ""}`;
}

/** « 3 ressources » · « 1 ressource » · « aucune ressource ». Même emploi. */
export function formatResources(count: number): string {
  if (count === 0) return "aucune ressource";
  return `${count} ressource${count > 1 ? "s" : ""}`;
}

/** « 3 résultats » · « 1 résultat » · « aucun résultat ». Même emploi. */
export function formatResults(count: number): string {
  if (count === 0) return "aucun résultat";
  return `${count} résultat${count > 1 ? "s" : ""}`;
}

/**
 * « 48 lignes de journal » · « 1 ligne de journal » · « aucune ligne de
 * journal ». Même emploi.
 *
 * **« Journal », jamais « activité »** : la règle de C6 ne s'éteint pas avec lui.
 * Une ligne de journal est une trace technique ; une activité est un fait
 * d'accompagnement. Les confondre dans une mise en garde ferait croire qu'on
 * efface deux fois la même chose.
 */
export function formatEvents(count: number): string {
  if (count === 0) return "aucune ligne de journal";
  return `${count} ligne${count > 1 ? "s" : ""} de journal`;
}

/**
 * « 3 relevés » · « 1 relevé » · « Aucun relevé ».
 *
 * Le compteur d'un indicateur, sur la page produit. Zéro s'écrit en toutes
 * lettres, pour la raison des deux fonctions ci-dessus — et pour une de plus
 * ici : un indicateur sans relevé n'est pas un indicateur en défaut, c'est un
 * indicateur qu'on n'a pas encore mesuré, et « 0 relevé » se lirait comme un
 * manque à combler.
 */
export function formatReadings(count: number): string {
  if (count === 0) return "Aucun relevé";
  return `${count} relevé${count > 1 ? "s" : ""}`;
}

/**
 * « 3 indicateurs complémentaires » · « 1 indicateur complémentaire » ·
 * « Aucun indicateur complémentaire ».
 *
 * Le décompte posé à côté de l'intertitre « Indicateurs associés » du bloc de
 * la vision produit (maquette `northstar-v2`). **« Complémentaire » et non
 * « associé »** : le mot dit ce que le décompte compte — ce qui vient *en plus*
 * de la North Star —, là où l'intertitre nomme la famille entière. Répéter
 * « associé » à dix centimètres de l'intertitre n'aurait rien ajouté.
 *
 * Zéro s'écrit en toutes lettres, la règle des trois fonctions ci-dessus : une
 * North Star sans indicateur autour d'elle n'est pas un produit en défaut.
 */
export function formatComplementaryIndicators(count: number): string {
  if (count === 0) return "Aucun indicateur complémentaire";
  return `${count} indicateur${count > 1 ? "s" : ""} complémentaire${
    count > 1 ? "s" : ""
  }`;
}

/**
 * Le type d'une ressource, en toutes lettres : « PowerPoint », « PDF », « Lien ».
 *
 * Les sept valeurs de l'énuméré `resource_type`, saisies et jamais déduites de
 * l'URL (D21). Les six premières portent le nom de l'outil tel qu'il s'écrit —
 * la casse est la sienne, pas la nôtre ; la septième est le cas ouvert, un lien
 * dont le format n'entre dans aucune des six autres cases.
 *
 * Le `Record` est **exhaustif à la compilation** : le jour où l'énuméré
 * s'allonge, ce fichier ne compile plus tant qu'on ne l'a pas complété. Une
 * chaîne rendue par défaut aurait laissé passer un type sans libellé.
 */
const RESOURCE_TYPES: Record<ResourceType, string> = {
  powerpoint: "PowerPoint",
  word: "Word",
  excel: "Excel",
  pdf: "PDF",
  figma: "Figma",
  sharepoint: "SharePoint",
  link: "Lien",
};

/**
 * « 15 compétences déclarées » · « 1 compétence déclarée ».
 *
 * Le décompte d'un **niveau de maîtrise** sur l'écran d'administration, et il
 * dit ce qui s'oppose à son rangement. **Il ne compte pas des personnes**, et le
 * mot est là pour cela : une personne déclare plusieurs compétences, souvent au
 * même niveau — sur la base de développement, le rang « Avancé » porte quinze
 * déclarations pour neuf personnes, dans un centre qui en compte dix. Employer
 * `formatPersons` y faisait dire « 15 personnes » à un écran qui n'en connaît
 * que dix : mesuré dans le HTML servi le 30/08/2026, et corrigé par ce mot-ci.
 *
 * Zéro ne s'écrit pas : ce décompte n'est rendu que lorsqu'il s'oppose à
 * quelque chose, et « Aucune référence » dit l'absence pour les quatre sources
 * à la fois.
 */
export function formatDeclarations(count: number): string {
  return `${count} compétence${count > 1 ? "s" : ""} déclarée${
    count > 1 ? "s" : ""
  }`;
}

/**
 * « 3 types d'activité » · « 1 type d'activité ».
 *
 * Le premier des deux décomptes qui disent ce qui s'oppose au rangement d'un
 * **outil** (T7.4) — un type d'activité qui le nomme par défaut. Comme le
 * précédent, il n'est rendu que lorsqu'il s'oppose : zéro ne s'écrit pas, et
 * « Aucune référence » dit l'absence pour toutes les sources à la fois.
 *
 * Le mot « type » seul serait ambigu sur un écran qui gère neuf référentiels :
 * il en porte huit dont un s'appelle « types d'activité ».
 */
export function formatActivityTypes(count: number): string {
  return `${count} type${count > 1 ? "s" : ""} d'activité`;
}

/**
 * « 2 pistes de démarrage » · « 1 piste de démarrage ».
 *
 * Le second, et il dit la même chose de l'autre côté : une piste renvoie vers
 * l'outil, et ranger l'outil lui retirerait son lien — `listStarters` joint
 * `tools` sur les seules lignes vivantes, si bien que la carte se lirait encore
 * sans mener nulle part.
 */
export function formatStarters(count: number): string {
  return `${count} piste${count > 1 ? "s" : ""} de démarrage`;
}

/**
 * Le nom des neuf référentiels que l'écran d'administration gère (T7.3 pour
 * cinq, T7.4 pour les quatre porteurs de logique).
 *
 * **Cinq formes et non un mot**, parce que le français décline : « Ajouter un
 * métier », « Archiver ce métier », « Options du métier Untel », « Archivé en
 * août 2026 ». Composer ces phrases à partir d'un seul nom demanderait de
 * décider du genre et de l'élision à l'endroit où la phrase se rend, c'est-à-dire
 * à neuf endroits — et `docs/06` §2 veut un écran sommaire, pas un moteur
 * d'accord.
 *
 * **Elles vivent ici**, avec les libellés d'énuméré voisins, plutôt que dans
 * l'écran qui les rend : `ETAT.md` porte depuis le 25/08/2026 un point ouvert
 * sur les libellés qui vivent hors de ce fichier, et en poser une troisième
 * table ailleurs irait à rebours de ce qu'il annonce (→ T7.9).
 *
 * `plural` ouvre une phrase — il porte donc sa majuscule ; les quatre autres la
 * continuent.
 *
 * **`Record<Referential, …>` : le jour où la liste close s'allonge, ce fichier
 * ne compile plus tant qu'il n'a pas son entrée.** C'est ce qui a fait entrer
 * `lib/format.ts` dans le périmètre de T7.4 — une exhaustivité vérifiée par le
 * compilateur ne se contourne pas, elle se remplit.
 */
export type ReferentialNoun = {
  /** « Métiers » — le titre de la liste et l'entrée de la barre. */
  plural: string;
  /** « un métier » — le geste qui remplit un état vide. */
  indefinite: string;
  /** « ce métier » — le geste qui vise la ligne. */
  demonstrative: string;
  /** « du métier » — la contraction, qui n'est pas la même pour les cinq. */
  of: string;
  /** « Archivé » / « Archivée » — l'accord, que seule la table connaît. */
  archived: string;
};

export const REFERENTIAL_NOUN: Record<Referential, ReferentialNoun> = {
  entites: {
    plural: "Entités",
    indefinite: "une entité",
    demonstrative: "cette entité",
    of: "de l'entité",
    archived: "Archivée",
  },
  metiers: {
    plural: "Métiers",
    indefinite: "un métier",
    demonstrative: "ce métier",
    of: "du métier",
    archived: "Archivé",
  },
  approches: {
    plural: "Approches",
    indefinite: "une approche",
    demonstrative: "cette approche",
    of: "de l'approche",
    archived: "Archivée",
  },
  competences: {
    plural: "Compétences",
    indefinite: "une compétence",
    demonstrative: "cette compétence",
    of: "de la compétence",
    archived: "Archivée",
  },
  niveaux: {
    plural: "Échelle de maîtrise",
    indefinite: "un niveau",
    demonstrative: "ce niveau",
    of: "du niveau",
    archived: "Archivé",
  },
  statuts: {
    plural: "Statuts de projet",
    indefinite: "un statut",
    demonstrative: "ce statut",
    of: "du statut",
    archived: "Archivé",
  },
  types: {
    plural: "Types d'activité",
    indefinite: "un type d'activité",
    demonstrative: "ce type",
    of: "du type",
    archived: "Archivé",
  },
  outils: {
    plural: "Outils",
    indefinite: "un outil",
    demonstrative: "cet outil",
    of: "de l'outil",
    archived: "Archivé",
  },
  pistes: {
    plural: "Pistes de démarrage",
    indefinite: "une piste",
    demonstrative: "cette piste",
    of: "de la piste",
    archived: "Archivée",
  },
};

export function formatResourceType(type: ResourceType): string {
  return RESOURCE_TYPES[type];
}

/**
 * Le sens de lecture d'un indicateur : « Plus haut vaut mieux » · « Plus bas
 * vaut mieux ».
 *
 * **Ce n'est pas un jugement, et la formulation le tient.** `direction` oriente
 * la lecture d'une **courbe** — elle dit dans quel sens la série se lit, jamais
 * si un chiffre est bon. Aucune couleur, aucun pictogramme, aucun mot appliqué à
 * une valeur ne s'en tire : D39 interdit tout indice calculé par Vision pour
 * qualifier un produit, et « 71 %, c'est bien » en serait un.
 *
 * Le `Record` est **exhaustif à la compilation**, comme celui des types de
 * ressource : le jour où l'énuméré s'allonge, ce fichier ne compile plus tant
 * qu'on ne l'a pas complété.
 */
const INDICATOR_DIRECTIONS: Record<IndicatorDirection, string> = {
  higher_is_better: "Plus haut vaut mieux",
  lower_is_better: "Plus bas vaut mieux",
};

export function formatIndicatorDirection(
  direction: IndicatorDirection,
): string {
  return INDICATOR_DIRECTIONS[direction];
}

/**
 * La nature d'une piste de démarrage : « Outil » · « Méthode » · « Ressource ».
 *
 * **Une étiquette, jamais un rang.** Les trois valeurs disent de quoi la piste
 * est faite, pas laquelle vaut mieux : rien dans le bloc ne les ordonne, et le
 * référentiel les mélange librement.
 *
 * Le `Record` est **exhaustif à la compilation**, comme les deux précédents.
 */
const STARTER_KINDS: Record<StarterKind, string> = {
  tool: "Outil",
  method: "Méthode",
  resource: "Ressource",
};

export function formatStarterKind(kind: StarterKind): string {
  return STARTER_KINDS[kind];
}

/**
 * La **nature** d'un statut de projet : « Cadrage » · « En cours » · « En
 * pause » · « Terminé ».
 *
 * **C'est la logique, pas le libellé** (`docs/04` §1) : un domaine renomme
 * « En cours » en « Actif » sans que rien ne bouge, parce que la nature reste
 * `active` — et c'est elle que la roadmap, la répartition de la vue d'ensemble
 * et `StatusPill` lisent. Ces quatre mots sont le nom de la logique elle-même,
 * et c'est pourquoi ils vivent ici et non dans le référentiel : le domaine ne
 * les renomme pas.
 *
 * **D42 — la nature `archived` n'existe pas** : l'archivage est porté
 * exclusivement par `archived_at`, et l'énuméré ne la porte donc pas. Le
 * `Record` étant exhaustif à la compilation, elle ne peut pas non plus revenir
 * par ici.
 */
const PROJECT_STATUS_NATURES: Record<ProjectStatusNature, string> = {
  framing: "Cadrage",
  active: "En cours",
  paused: "En pause",
  done: "Terminé",
};

export function formatProjectStatusNature(nature: ProjectStatusNature): string {
  return PROJECT_STATUS_NATURES[nature];
}

/**
 * Les six familles d'activité de `docs/03` §2, dans l'ordre de l'énuméré.
 *
 * La famille est un **regroupement d'affichage** et rien d'autre : elle donne au
 * choix du type un axe de lecture, elle n'impose aucune méthodologie.
 *
 * **Elle vivait dans `components/projects/activity-panel.tsx` jusqu'à T7.4**,
 * qui en a eu besoin côté serveur pour la liste d'administration. Le geste est
 * un **déplacement, pas une copie** : `ETAT.md` porte depuis le 25/08/2026 un
 * point ouvert sur les libellés qui vivent hors de ce fichier, et en recopier
 * six ici pour laisser les six autres là-bas aurait ajouté une divergence à un
 * point qui décrit déjà trois déplacements à faire. Aucun libellé ne change.
 */
const ACTIVITY_FAMILIES: Record<ActivityFamily, string> = {
  framing: "Cadrage",
  research: "Recherche",
  design: "Conception",
  evaluation: "Évaluation",
  measurement: "Mesure",
  transfer: "Transmission",
};

export function formatActivityFamily(family: ActivityFamily): string {
  return ACTIVITY_FAMILIES[family];
}

/**
 * Le genre d'un outil raccordé : « Audit » · « Analytics » · « Budget » ·
 * « Autre » (T7.4).
 *
 * **Il ne classe pas les outils, il dit ce qu'ils produisent** : `budget` est
 * l'outil de gestion vers lequel le bloc du budget renvoie (T7.1), `audit`
 * celui qui produit un résultat (T4.4), `analytics` celui qui alimente un
 * relevé d'indicateur. « Autre » n'est pas un défaut de saisie : c'est la
 * valeur qui rend le raccordement d'un outil imprévu aussi peu coûteux qu'une
 * ligne.
 *
 * `sync_mode` et `api_config` n'ont pas de libellé, et n'en auront pas tant
 * qu'ils ne se saisiront pas — arbitrage (i) de `tickets-C7.md`.
 */
const TOOL_KINDS: Record<ToolKind, string> = {
  audit: "Audit",
  analytics: "Analytics",
  budget: "Budget",
  other: "Autre",
};

export function formatToolKind(kind: ToolKind): string {
  return TOOL_KINDS[kind];
}

/**
 * La valeur d'un résultat, avec son unité : « 62/100 », « 68 % », « 1 234,5 s ».
 *
 * **Le chiffre.** `results.value` est un `numeric(18,4)` que le pilote rend en
 * chaîne brute — « 62.0000 », et non 62. `maximumFractionDigits: 4` est la
 * précision de la colonne, pas un choix : les zéros de queue tombent, une
 * décimale réelle survit, et la virgule française remplace le point.
 * **Limite connue** : au-delà de 2^53, `Number` perd des unités là où la
 * colonne, elle, n'en perd pas. Aucun score ni taux d'audit n'en approche.
 * Une chaîne que `Number` ne sait pas lire est rendue telle quelle plutôt
 * qu'en « NaN » : mieux vaut la valeur brute qu'un mot qui ne veut rien dire.
 *
 * **L'espace.** L'unité se colle quand elle commence par `/` — « 62/100 » est
 * une fraction, pas un nombre suivi d'un mot — et se sépare partout ailleurs
 * par une **espace insécable** (U+00A0) : « 68 % », « 1 234,5 s ». Insécable
 * parce qu'un chiffre resté seul en fin de ligne, coupé de son unité, ne veut
 * plus rien dire. La règle se lit dans le critère de T4.3 lui-même, qui écrit
 * les deux formes côte à côte.
 *
 * `null` quand il n'y a pas de valeur : la colonne est nullable, et une unité
 * seule ne dit rien. L'appelant retire alors la part, séparateur compris.
 */
const DECIMAL = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 4 });

export function formatResultValue(
  value: string | null,
  unit: string | null,
): string | null {
  if (value === null) return null;

  const parsed = Number(value);
  const number = Number.isFinite(parsed) ? DECIMAL.format(parsed) : value;

  if (!unit) return number;
  return unit.startsWith("/") ? `${number}${unit}` : `${number}${NBSP}${unit}`;
}
