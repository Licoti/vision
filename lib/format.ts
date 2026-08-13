/**
 * Les formatages d'affichage, en français.
 *
 * Le temps se lit au mois, jamais au jour (D13) : Vision décrit des périodes
 * d'accompagnement, pas des horodatages. Un audit « de juin 2026 » ne gagne
 * rien à devenir « du 30 juin 2026 ».
 */

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
