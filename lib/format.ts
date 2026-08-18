/**
 * Les formatages d'affichage, en français.
 *
 * Le temps se lit au mois, jamais au jour (D13) : Vision décrit des périodes
 * d'accompagnement, pas des horodatages. Un audit « de juin 2026 » ne gagne
 * rien à devenir « du 30 juin 2026 ».
 */

import type { IndicatorDirection } from "@/lib/queries/indicators";
import type { ResourceType } from "@/lib/queries/resources";

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
  return unit.startsWith("/") ? `${number}${unit}` : `${number} ${unit}`;
}
