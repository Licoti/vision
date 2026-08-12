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
 * « 2 accompagnements » · « 1 accompagnement » · « Aucun accompagnement ».
 *
 * Zéro s'écrit en toutes lettres : une colonne pleine de « 0 » se lit comme
 * un manque, alors qu'un produit sans accompagnement est un produit normal.
 */
export function formatAccompaniments(count: number): string {
  if (count === 0) return "Aucun accompagnement";
  return `${count} accompagnement${count > 1 ? "s" : ""}`;
}
