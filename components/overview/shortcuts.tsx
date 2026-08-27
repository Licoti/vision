/**
 * Le bloc « Accès direct » — le quatrième et dernier bloc de la vue d'ensemble
 * (`docs/06` §3) : *« un accès direct aux projets et produits »*.
 *
 * **Il redit la barre de navigation, et c'est son objet.** `docs/06` §8 place
 * Produits et Projets dans la coquille ; ce bloc les reprend en pied d'écran
 * parce que la vue d'ensemble répond à *« que se passe-t-il en ce moment »* et
 * qu'une réponse se termine par un endroit où aller. Ce que la barre ne dit pas
 * et que ce bloc dit, c'est **combien** : la barre est un chemin, l'entrée est
 * un chemin et une taille.
 *
 * **Les deux nombres sont des décomptes de lignes, jamais des indices.** Chacun
 * mène à la liste sans filtre, qui rend exactement ce nombre — c'est le contrat
 * de la répartition voisine, appliqué à l'entrée qui ne pose aucun filtre. Les
 * deux pages de destination affichent d'ailleurs déjà ces mêmes nombres
 * (`formatProjects`, `formatProducts`). Ce n'est pas la taille du centre : un
 * décompte ne qualifie personne, il dit ce que l'écran suivant contient
 * (frontière de D39).
 *
 * **Aucun état vide, et il n'y en a pas à écrire.** Les deux entrées existent
 * toujours — un domaine sans aucun produit a quand même la page qui le dira, et
 * elle porte son propre état vide, avec son geste. Un bloc d'accès qui
 * disparaîtrait quand il n'y a rien retirerait précisément le chemin vers
 * l'écran qui propose de commencer.
 *
 * **Aucun droit ne se lit ici** : ce sont deux liens de lecture, ouverts à tout
 * le domaine (D9). « Nouvel accompagnement » n'y figure pas — l'action vit sur
 * `/projets`, sous condition de droit, et une action à deux endroits est une
 * règle de droit à deux endroits.
 *
 * Le composant ne lit aucune base : les deux nombres viennent de
 * `countProjects` et `countProducts`.
 */

import Link from "next/link";

import { Section, SectionHeader } from "@/components/ui/section";
import { formatProducts, formatProjects } from "@/lib/format";
import { ROUTES } from "@/lib/navigation";

export function Shortcuts({
  projectCount,
  productCount,
}: {
  projectCount: number;
  productCount: number;
}) {
  return (
    <Section>
      <SectionHeader
        title="Accès direct"
        note="Les deux listes transverses, telles que la hiérarchie les traverse."
      />

      {/* Une `ul` : les deux entrées ne s'ordonnent pas, elles coexistent.
          L'ordre est celui de `MAIN_NAV` — Produits avant Projets, parce que la
          hiérarchie est le chemin canonique et que la liste transverse n'en est
          qu'un raccourci (`docs/06` §8). */}
      <ul role="list" className="flex flex-col">
        <Shortcut
          href={ROUTES.products}
          label="Produits"
          note="Sur quels objets le centre intervient-il, et pour quelles entités ?"
          count={formatProducts(productCount)}
        />
        <Shortcut
          href={ROUTES.projects}
          label="Projets"
          note="Quels accompagnements existent en ce moment, tous produits confondus ?"
          count={formatProjects(projectCount)}
        />
      </ul>
    </Section>
  );
}

/**
 * Une entrée d'accès : le nom de la liste, la question à laquelle elle répond,
 * et le nombre de lignes qu'elle contient.
 *
 * La question reprend mot pour mot le `lead` de la page visée : c'est la même
 * phrase que l'écran d'arrivée, et deux formulations pour une même destination
 * feraient douter qu'on parle du même endroit.
 *
 * Le filet sépare, il n'encadre pas : il se pose sur la ligne — seule à
 * connaître son rang —, jamais sur le lien, toujours premier enfant du sien.
 * Même règle que le bloc « Répartition ».
 */
function Shortcut({
  href,
  label,
  note,
  count,
}: {
  href: string;
  label: string;
  note: string;
  count: string;
}) {
  return (
    <li className="border-t border-surface-neutral-lighter first:border-t-0">
      <Link
        href={href}
        className="flex flex-wrap items-baseline justify-between gap-3 py-3"
      >
        <span className="flex min-w-0 flex-col">
          <span className="text-sm font-semibold text-content-info-base underline">
            {label}
          </span>
          <span className="text-xs text-content-neutral-base">{note}</span>
        </span>
        <span className="text-sm font-semibold text-content-neutral-darkest">
          {count}
        </span>
      </Link>
    </li>
  );
}
