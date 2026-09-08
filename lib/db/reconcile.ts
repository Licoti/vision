/**
 * Le rapprochement — reconnaître une ligne qu'on a déjà semée (T8.4).
 *
 * **Ce module ne contient aucune donnée.** Il porte le seul mécanisme, et il
 * vit ici — et non plus dans `scripts/seed.ts` — parce que **deux appelants
 * l'utilisent depuis T9.5** : le script d'amorçage, et l'action qui crée une
 * entreprise depuis l'écran au-dessus des domaines.
 *
 * Le rapprochement va en trois temps, du plus sûr au plus faible :
 *
 *   1. la **clé naturelle** — un libellé, un nom, un titre ;
 *   2. l'**ancre**, quand la table en porte une : la `position`, colonne
 *      qu'aucun renommage ne touche. C'est elle qui fait qu'un libellé changé —
 *      en base par l'écran d'administration, ou dans le fichier — est
 *      **reconnu et corrigé** au lieu d'être recréé à côté de l'ancien ;
 *   3. les **anciens libellés déclarés** (`formerKeys`), là où l'appelant sait
 *      qu'il a renommé une de ses propres lignes.
 *
 * Ce qui manque ensuite est créé, ce qui a dérivé est remis à la valeur du
 * fichier, le reste est laissé tel quel. Deux exécutions successives laissent
 * la base dans le même état.
 *
 * **Le résidu, et il est mesuré.** Huit référentiels portent une `position` et
 * sont donc refermés. **`tools` n'en porte aucune** — un renommage en base y
 * recrée encore —, et il en va de même de `products`, `projects`, `persons`,
 * `indicators`, `resources`, `use_cases` et `personas`. Les refermer
 * demanderait une colonne, donc une migration, que les interdits communs de C9
 * posent en signal d'arrêt. Le fait est écrit dans `ETAT.md` plutôt que
 * contourné.
 *
 * **Le compte rendu se crée par appel** (T9.5), là où le script le portait en
 * deux globales : deux amorçages simultanés — une requête qui crée une
 * entreprise pendant qu'un autre script tourne — n'écriraient pas dans le même
 * décompte. C'est le seul changement de forme de l'extraction.
 */

import type {
  InsertValues,
  Row,
  ScopedDb,
  ScopedTable,
} from "./scoped";

/** Ce qu'une table a subi pendant un amorçage. */
export type Tally = {
  created: number;
  updated: number;
  /** Reconnue par son ancre ou par un ancien libellé, donc **pas** recréée. */
  renamed: number;
  unchanged: number;
};

/** Ce que l'appelant déclare pour une ligne, et ce qui la reconnaît. */
export type Seed<T extends ScopedTable> = {
  /** La clé naturelle : le libellé, le nom, le titre. Celle qui se renomme. */
  key: string;
  /**
   * Ce qu'un renommage ne touche pas — la `position`, pour les référentiels
   * qui en portent une. Nulle là où la table n'a rien de tel.
   */
  anchor?: string;
  /**
   * Les libellés que cette ligne a portés avant, dans le fichier.
   *
   * C'est l'appelant qui déclare ses propres renommages : sans cela, changer un
   * nom sème une ligne neuve et laisse l'ancienne orpheline — ce qui est arrivé
   * le 20/08/2026 avec « Audit d'accessibilité » → « Everyone ».
   */
  formerKeys?: string[];
  values: InsertValues<T>;
};

/** Ce qu'un amorçage rend de son passage : la manœuvre, et sa trace. */
export type Reconciler = {
  ensureAll: <T extends ScopedTable>(
    scope: ScopedDb,
    table: T,
    name: string,
    keyOfRow: (row: Row<T>) => string,
    seeds: Seed<T>[],
    anchorOfRow?: (row: Row<T>) => string | null,
  ) => Promise<Map<string, Row<T>>>;
  /**
   * Ce qu'une table a subi hors d'`ensureAll`.
   *
   * Un seul appelant s'en sert : `scripts/seed.ts`, pour le domaine lui-même —
   * la seule table qu'aucune portée ne couvre, et qui n'a donc pas de `seed`.
   */
  record: (table: string, outcome: keyof Tally, count?: number) => void;
  /** Le décompte par table, pour le compte rendu de fin. */
  tallies: Map<string, Tally>;
  /**
   * Les renommages reconnus, nommés des deux côtés.
   *
   * **Une correction silencieuse est une correction qu'on redécouvre.** Le
   * décompte dit le chiffre ; ces lignes disent *quelle* ligne a été reprise et
   * depuis quel libellé, faute de quoi le geste de T8.4 serait invisible le
   * jour où il agit.
   */
  renames: string[];
};

/**
 * Deux valeurs de colonne sont-elles la même ?
 *
 * `numeric` revient de PostgreSQL en chaîne cadrée — `"62.0000"` pour un
 * `"62"` écrit. Les comparer telles quelles ferait réécrire la ligne à chaque
 * exécution, et l'amorçage ne serait plus rejouable, seulement bavard.
 */
export function sameValue(left: unknown, right: unknown): boolean {
  if (left === null || left === undefined) return right === null || right === undefined;
  if (right === null || right === undefined) return false;

  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (
    typeof left !== "boolean" &&
    typeof right !== "boolean" &&
    !Number.isNaN(leftNumber) &&
    !Number.isNaN(rightNumber) &&
    String(left).trim() !== "" &&
    String(right).trim() !== ""
  ) {
    return leftNumber === rightNumber;
  }

  return String(left) === String(right);
}

/** Toute ligne scopée porte un identifiant : le typage générique l'ignore. */
const rowId = (row: unknown): string => (row as { id: string }).id;

/**
 * Un amorçage, et le compte rendu qui va avec.
 *
 * La fabrique existe pour que le décompte cesse d'être une globale de module :
 * la signature d'`ensureAll` n'a pas bougé d'un caractère depuis T8.4.
 */
export function createReconciler(): Reconciler {
  const tallies = new Map<string, Tally>();
  const renames: string[] = [];

  function record(table: string, outcome: keyof Tally, count = 1): void {
    const tally = tallies.get(table) ?? {
      created: 0,
      updated: 0,
      renamed: 0,
      unchanged: 0,
    };
    tally[outcome] += count;
    tallies.set(table, tally);
  }

  /**
   * Amène une table à l'état décrit par l'appelant, et rend ses lignes indexées
   * par clé naturelle — c'est cet index qui sert ensuite à résoudre les
   * rattachements sans jamais écrire un identifiant à la main.
   */
  async function ensureAll<T extends ScopedTable>(
    scope: ScopedDb,
    table: T,
    name: string,
    keyOfRow: (row: Row<T>) => string,
    seeds: Seed<T>[],
    /** L'ancre d'une ligne en base. Absente : la table n'en porte pas. */
    anchorOfRow?: (row: Row<T>) => string | null,
  ): Promise<Map<string, Row<T>>> {
    const seen = new Set<string>();
    for (const seed of seeds) {
      if (seen.has(seed.key)) {
        throw new Error(
          `Clé naturelle en double dans la fixture ${name} : « ${seed.key} ». ` +
            "Deux lignes indiscernables rendraient l'amorçage non rejouable.",
        );
      }
      seen.add(seed.key);
    }

    const rows = await scope.list(table, { includeArchived: true });
    const existing = new Map<string, Row<T>>();
    for (const row of rows) existing.set(keyOfRow(row), row);

    /* La reconnaissance se fait **avant toute écriture** : on résout d'abord les
       lignes, on écrit ensuite. Une ligne déjà revendiquée par un `seed` ne peut
       plus l'être par un autre — sans quoi deux lignes du fichier se
       disputeraient la même ligne en base. */
    const claimed = new Set<string>();
    const matched = new Map<string, Row<T>>();
    const renamedFrom = new Map<string, string>();

    for (const seed of seeds) {
      const row = existing.get(seed.key);
      if (!row) continue;
      claimed.add(rowId(row));
      matched.set(seed.key, row);
    }

    /** Une ligne que ni la fixture ni un autre `seed` ne désigne déjà. */
    const free = (row: Row<T>): boolean =>
      !claimed.has(rowId(row)) && !seen.has(keyOfRow(row));

    for (const seed of seeds) {
      if (matched.has(seed.key)) continue;

      /* L'ancre. **Deux candidates n'en désignent aucune** : l'amorçage ne
         devine jamais entre deux lignes, il insère et laisse la base telle
         quelle. */
      let found: Row<T> | undefined;
      if (anchorOfRow && seed.anchor !== undefined) {
        const candidates = rows.filter(
          (row) => free(row) && anchorOfRow(row) === seed.anchor,
        );
        if (candidates.length === 1) found = candidates[0];
      }

      /* Les anciens libellés, dans l'ordre déclaré. */
      if (!found) {
        for (const former of seed.formerKeys ?? []) {
          const row = existing.get(former);
          if (row && free(row)) {
            found = row;
            break;
          }
        }
      }

      if (!found) continue;
      claimed.add(rowId(found));
      matched.set(seed.key, found);
      renamedFrom.set(seed.key, keyOfRow(found));
    }

    const missing = seeds.filter((seed) => !matched.has(seed.key));

    for (const seed of seeds) {
      const row = matched.get(seed.key);
      if (!row) continue;

      const former = renamedFrom.get(seed.key);
      const current = row as unknown as Record<string, unknown>;
      const wanted = seed.values as unknown as Record<string, unknown>;
      const drifted = Object.keys(wanted).filter(
        (column) => !sameValue(current[column], wanted[column]),
      );

      if (drifted.length === 0 && former === undefined) {
        record(name, "unchanged");
        continue;
      }

      const updated = await scope.update(table, rowId(row), seed.values);
      if (updated) {
        existing.set(seed.key, updated);
        matched.set(seed.key, updated);
      }

      if (former === undefined) {
        record(name, "updated");
        continue;
      }

      /* La ligne existait sous un autre nom : elle est reprise, jamais doublée. */
      existing.delete(former);
      record(name, "renamed");
      renames.push(`${name} : « ${former} » reconnu, et rendu à « ${seed.key} ».`);
    }

    if (missing.length > 0) {
      // `insertMany` attend `InsertValues<NoInfer<T>>` : derrière un `T` non
      // résolu, TypeScript ne sait pas rapprocher les deux formes du même type.
      // Le cast est confiné à cette ligne, et le résultat retypé aussitôt.
      const inserted = (await scope.insertMany(
        table,
        missing.map((seed) => seed.values) as never,
      )) as Row<T>[];
      inserted.forEach((row) => existing.set(keyOfRow(row), row));
      record(name, "created", inserted.length);
    }

    return existing;
  }

  return { ensureAll, record, tallies, renames };
}

/**
 * L'ancre d'un référentiel ordonné : sa `position`, normalisée.
 *
 * PostgreSQL rend un `numeric(10,2)` cadré — `"3.00"` pour un `"3"` écrit —, et
 * comparer les deux chaînes telles quelles ne rapprocherait jamais rien. C'est
 * la raison d'être de `sameValue` plus haut, resservie ici.
 */
export const positionAnchor = (row: { position: string }): string =>
  String(Number(row.position));

/** L'identifiant d'une ligne attendue, ou une erreur qui nomme ce qui manque. */
export function idOf<T extends ScopedTable>(
  index: Map<string, Row<T>>,
  key: string,
  what: string,
): string {
  const row = index.get(key);
  if (!row) {
    throw new Error(`${what} introuvable après amorçage : « ${key} ».`);
  }
  return rowId(row);
}

/** La position d'un référentiel : l'ordre du fichier fait foi. */
export const positionOf = (index: number): string => String(index + 1);
