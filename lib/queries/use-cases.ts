/**
 * Les lectures liées aux **use cases** : comment un produit est construit.
 *
 * Un use case est un **grand scénario d'usage** — « Démarrer, reprendre un
 * projet », « Gérer les droits d'accès ». Il regroupe ce qui sert un même
 * objectif, et c'est le niveau de lecture du milieu : `personas` dit pour qui
 * on conçoit, les use cases disent quels parcours structurent le produit, les
 * fonctionnalités diront demain ce qui les réalise.
 *
 * **Ce module ne calcule rien.** Il rend ce que les lignes portent : un titre,
 * une description, et les identifiants des personae rattachés. Aucun décompte
 * de couverture — « 3 use cases sur 4 ont un persona » serait exactement
 * l'indice calculé par Vision que D39 interdit.
 *
 * **Aucune jointure, donc aucun `joinedRead`** : deux `list` successifs, chacun
 * sur une seule table, et `list` pose déjà le filtre de domaine sur chacune.
 * C'est la forme de `lib/queries/personas.ts`, et elle suffit — **les noms des
 * personae ne sont pas relus ici**, la page les a déjà lus pour son bloc
 * « Personae » et les écrans rapprochent sur l'identifiant. Aucun bloc n'ajoute
 * une lecture par objet : la discipline que la page produit tient depuis T5.5.
 *
 * **Un persona archivé disparaît donc des use cases qui le désignaient**, sans
 * qu'une ligne de liaison ne bouge : `listProductPersonas` l'écarte, et le
 * rapprochement ne le retrouve plus. Rien n'est perdu (règle 4) — le lien
 * redeviendrait visible si le persona revenait.
 *
 * Ce module n'importe pas `db` : il reçoit un `ScopedDb` déjà lié au domaine
 * courant. Règle 1.
 */

import { asc, eq, inArray } from "drizzle-orm";

import type { ScopedDb } from "@/lib/db/scoped";
import { useCasePersonas, useCases } from "@/lib/db/schema";

/** Une carte du bloc « Use Cases », et le haut de son panneau de détail. */
export type ProductUseCase = {
  id: string;
  title: string;
  /** Ce que le scénario permet, et pourquoi. Jamais nulle — la colonne l'exige. */
  summary: string;
  /**
   * Les personae rattachés, **par identifiant seulement**.
   *
   * L'écran a déjà la liste des personae du produit : lui redonner des noms
   * ici serait une seconde source pour la même donnée, qui divergerait le jour
   * où l'une des deux lectures changerait d'ordre ou de filtre.
   *
   * Vide est un état normal : le rattachement est facultatif.
   */
  personaIds: string[];
};

/**
 * Les use cases vivants d'un produit — **par ordre d'écriture**.
 *
 * L'ordre est tranché ici, aucun document ne l'écrivant, et il n'est pas
 * alphabétique : une liste de scénarios se lit comme la structure du produit,
 * et l'alphabet la brouillerait. `created_at` d'abord, `id` ensuite.
 *
 * **Ce que cet ordre garantit, et ce qu'il ne garantit pas** — mesuré, pas
 * supposé. Il est **stable** : deux affichages successifs rendent la même
 * liste, et c'est la propriété requise (la règle de `listProjectResources`). Il
 * coïncide avec l'ordre de saisie **quand les lignes sont écrites une à une**,
 * c'est-à-dire pour toute saisie par l'interface. Il n'y coïncide **pas** pour
 * un lot : `now()` est en PostgreSQL le temps de la **transaction**, si bien
 * qu'un `insertMany` donne à toutes ses lignes le même horodatage à la
 * milliseconde et laisse l'identifiant — un UUID tiré au hasard — départager.
 * Constaté sur les deux lignes de la fixture, écrites en un lot, qui se lisent
 * dans l'ordre inverse du fichier. Le jour où l'ordre devra être **choisi** et
 * non subi, ce sera une colonne de rang et le geste qui l'écrit.
 *
 * **Deux lectures, jamais une par carte.** La seconde ne part que si la
 * première a rendu quelque chose : `inArray` sur une liste vide produit un
 * `false` que PostgreSQL évalue quand même, et une requête qu'on sait vide ne
 * se pose pas.
 *
 * Les use cases archivés sont écartés : `list` le fait d'elle-même sur une
 * table qui porte `archived_at`. Un produit sans use case rend un tableau vide
 * — l'état vide appartient à l'écran (règle 5).
 */
export async function listProductUseCases(
  scope: ScopedDb,
  productId: string,
): Promise<ProductUseCase[]> {
  const rows = await scope.list(useCases, {
    where: eq(useCases.productId, productId),
    orderBy: [asc(useCases.createdAt), asc(useCases.id)],
  });

  if (rows.length === 0) return [];

  /* `use_case_personas` ne porte pas `archived_at` : `list` n'a rien à écarter,
     et elle le sait par introspection. Ce qui reste écarté est ce que la
     jointure d'écran fera — un persona archivé n'est plus dans la liste que le
     rapprochement consulte. */
  const links = await scope.list(useCasePersonas, {
    where: inArray(
      useCasePersonas.useCaseId,
      rows.map((row) => row.id),
    ),
    orderBy: [asc(useCasePersonas.id)],
  });

  const byUseCase = new Map<string, string[]>();
  for (const link of links) {
    const held = byUseCase.get(link.useCaseId);
    if (held) held.push(link.personaId);
    else byUseCase.set(link.useCaseId, [link.personaId]);
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    summary: row.summary,
    personaIds: byUseCase.get(row.id) ?? [],
  }));
}

/**
 * Les personae rattachés à un use case, **résolus sur une liste déjà lue**.
 *
 * Le bloc et la fiche s'en servent l'un et l'autre, et l'écrire une fois est
 * ce qui garantit qu'ils rendent le **même** ensemble dans le **même** ordre —
 * celui de `listProductPersonas`, les principaux d'abord puis par nom, et non
 * l'ordre où les cases ont été cochées.
 *
 * Ce n'est pas une lecture : aucun `ScopedDb`, aucune requête. C'est le
 * rapprochement que la règle 1 n'a pas à connaître.
 */
export function personasOf<T extends { id: string }>(
  useCase: Pick<ProductUseCase, "personaIds">,
  personas: readonly T[],
): T[] {
  const wanted = new Set(useCase.personaIds);
  return personas.filter((persona) => wanted.has(persona.id));
}
