/**
 * Les lectures liées aux **personae** : pour qui un produit est conçu.
 *
 * Un persona est un archétype d'utilisateur rattaché au produit — pas une
 * personne réelle. **Le piège de nom est dans le schéma** : `persons` porte les
 * membres du centre et les intervenants ; `personas` porte les profils pour
 * lesquels on conçoit. Deux tables sans rapport.
 *
 * **Ce module ne calcule rien.** Il rend ce que les lignes portent : un nom, un
 * rôle, une description, une image, un rang, et les traits saisis. Aucun
 * décompte de complétude, aucune couverture, aucun indice — D39 pose la
 * frontière, et un chiffre calculé par Vision pour qualifier un produit la
 * franchirait.
 *
 * **Aucune jointure**, donc aucun `joinedRead` : les deux lectures portent sur
 * une seule table chacune, et `list` pose déjà le filtre de domaine. C'est la
 * forme la plus courte que la règle 1 autorise, et elle suffit ici.
 *
 * **L'appartenance au produit n'est pas vérifiée ici**, et c'est délibéré :
 * `listPersonaTraits` reçoit un identifiant de persona déjà confronté à son
 * produit par l'appelant — la chaîne exacte que la page tient pour un
 * indicateur avant d'ouvrir son panneau. Rejouer le contrôle ici poserait une
 * seconde autorité, qui divergerait un jour de la première.
 *
 * Ce module n'importe pas `db` : il reçoit un `ScopedDb` déjà lié au domaine
 * courant. Règle 1.
 */

import { asc, eq, sql } from "drizzle-orm";

import type { ScopedDb } from "@/lib/db/scoped";
import { personaKind, personaTraitKind, personaTraits, personas } from "@/lib/db/schema";

/** `primary` · `secondary`. Dérivé du schéma, jamais réécrit à la main. */
export type PersonaKind = (typeof personaKind.enumValues)[number];

/** `goal` · `pain` · `expectation`. Dérivé du schéma. */
export type PersonaTraitKind = (typeof personaTraitKind.enumValues)[number];

/** Une carte du bloc « Personae », et le haut de son panneau de détail. */
export type ProductPersona = {
  id: string;
  name: string;
  /** « Réseau d'agences ». Nul : le rôle est facultatif. */
  role: string | null;
  /** La description courte. Nulle : elle est facultative. */
  summary: string | null;
  /**
   * L'adresse de l'image, hébergée ailleurs. Nulle, l'écran retombe sur les
   * initiales. Jamais appelée par Vision — la règle de `resources.url`.
   */
  imageUrl: string | null;
  kind: PersonaKind;
};

/** Un objectif, un irritant ou une attente — une ligne, pas une phrase. */
export type PersonaTrait = {
  id: string;
  kind: PersonaTraitKind;
  label: string;
  position: number;
};

/**
 * Les personae vivants d'un produit — **les principaux d'abord**, puis par nom.
 *
 * L'ordre est tranché ici, aucun document ne l'écrivant. Le rang vient en
 * premier parce que c'est la question de l'écran : quels profils portent ce
 * produit. Le nom départage ensuite, et l'identifiant en dernier — un ordre qui
 * varierait d'un affichage à l'autre serait un défaut (la règle de
 * `listProjectResources`).
 *
 * **Le rang est ordonné par une expression, pas par la colonne.** Un énuméré
 * PostgreSQL se compare dans son ordre de déclaration, si bien qu'`asc(kind)`
 * donnerait le même résultat aujourd'hui — et changerait silencieusement le
 * jour où une valeur s'intercalerait dans l'énuméré. La propriété se lit dans
 * le code, elle ne se déduit pas de l'ordre d'une déclaration lointaine.
 *
 * Les personae archivés sont écartés : `list` le fait d'elle-même sur une table
 * qui porte `archived_at`. Un produit sans persona rend un tableau vide —
 * l'état vide appartient à l'écran (règle 5).
 */
export async function listProductPersonas(
  scope: ScopedDb,
  productId: string,
): Promise<ProductPersona[]> {
  const rows = await scope.list(personas, {
    where: eq(personas.productId, productId),
    orderBy: [
      sql`case when ${personas.kind} = 'primary' then 0 else 1 end`,
      asc(personas.name),
      asc(personas.id),
    ],
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    role: row.role,
    summary: row.summary,
    imageUrl: row.imageUrl,
    kind: row.kind,
  }));
}

/**
 * Les traits d'un persona, **par famille puis par position**.
 *
 * L'ordre des familles est celui de l'énuméré — objectifs, irritants, attentes
 * —, et il est posé par la même expression que le rang ci-dessus, pour la même
 * raison. La position, elle, est l'ordre de saisie : c'est ce qui rend au
 * panneau de correction les trois zones telles qu'elles ont été tapées.
 *
 * **`persona_traits` ne porte pas `archived_at`** : la table n'a rien à écarter,
 * et `list` le sait par introspection. Un persona sans trait rend un tableau
 * vide — trois listes vides sont un état normal, pas un manque.
 *
 * Cette lecture n'est appelée **que lorsqu'un panneau s'ouvre** : c'est une
 * lecture de plus dans ce cas, jamais une lecture par carte.
 */
export async function listPersonaTraits(
  scope: ScopedDb,
  personaId: string,
): Promise<PersonaTrait[]> {
  const rows = await scope.list(personaTraits, {
    where: eq(personaTraits.personaId, personaId),
    orderBy: [
      sql`case ${personaTraits.kind} when 'goal' then 0 when 'pain' then 1 else 2 end`,
      asc(personaTraits.position),
      asc(personaTraits.id),
    ],
  });

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    label: row.label,
    position: row.position,
  }));
}
