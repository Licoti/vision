/**
 * Les formatages d'affichage, en français.
 *
 * Le temps se lit au mois, jamais au jour (D13) : Vision décrit des périodes
 * d'accompagnement, pas des horodatages. Un audit « de juin 2026 » ne gagne
 * rien à devenir « du 30 juin 2026 ».
 */

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
