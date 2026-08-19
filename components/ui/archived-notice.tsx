/**
 * Le bandeau d'archivage — la mention datée qui ouvre la page d'un objet rangé.
 *
 * **Un seul exemplaire, après deux.** Les pages produit et projet portaient le
 * même bandeau **à la classe près** — dix classes identiques, même structure, et
 * jusqu'au même commentaire au-dessus, chacun renvoyant à l'autre pour dire d'où
 * venaient ses jetons. Seuls variaient le libellé en gras et la phrase ; c'est
 * exactement le partage que ce composant fait passer en paramètres.
 *
 * **La date est au mois** (D13) : c'est une date de rangement, pas un
 * horodatage — le jour n'apprendrait rien de plus. Le formatage est ici et non
 * chez l'appelant, parce que c'est une propriété du bandeau et non de la page.
 *
 * **Aucun couple de couleurs neuf** : le trio de jetons est celui que T2.4 avait
 * mesuré pour l'en-tête des deux pages de détail, repris tel quel.
 *
 * **Aucune couleur d'alerte, aucun badge.** Un objet archivé n'est pas un
 * problème : il est rangé. La mention dit ce que l'archivage a retiré et ce
 * qu'il a laissé lisible — la règle 4 veut qu'on ne supprime rien, et l'écran
 * doit le dire plutôt que de le laisser deviner.
 */

import { formatMonth } from "@/lib/format";

export function ArchivedNotice({
  label,
  archivedAt,
  sentence,
}: {
  /** Le nom de ce qui est archivé, en gras — « Produit archivé ». */
  label: string;
  archivedAt: Date;
  /** Ce que l'archivage retire, et ce qu'il laisse lisible. */
  sentence: string;
}) {
  return (
    <p className="rounded-xl border border-surface-neutral-lighter bg-surface-neutral-pale px-7 py-4 text-sm text-content-neutral-dark">
      <span className="font-semibold">{label}</span>
      {` en ${formatMonth(archivedAt)}. ${sentence}`}
    </p>
  );
}
