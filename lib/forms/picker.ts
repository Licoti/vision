/**
 * Le rapprochement d'une saisie et d'une liste d'options — la règle du champ
 * de recherche de `components/ui/picker.tsx`.
 *
 * **Ni base, ni Next, ni React**, comme les dix-huit autres modules de
 * `lib/forms/` : c'est ce qui rend la règle énonçable et vérifiable seule. Elle
 * vit ici et pas dans le composant pour une raison mesurable —
 * `vitest.config.mts` n'inclut que `lib/**` et `app/**`, et aucun test de
 * composant client n'existe dans le dépôt. Une règle écrite dans le `.tsx`
 * serait une règle qu'on croit sur parole.
 *
 * **Ce module ne classe rien.** Il retient ce qui correspond, dans l'ordre où
 * on le lui a donné — les deux lectures qui l'alimentent trient déjà par nom.
 * Un plafond d'affichage n'est pas un classement : les options au-delà ne sont
 * pas « moins pertinentes », elles sont hors de l'écran, et le décompte le dit.
 *
 * **Il ne cherche pas dans une base.** Le rapprochement porte sur une liste
 * déjà servie ; c'est ce qui permet à la suggestion d'arriver à la frappe, sans
 * aller-retour, et c'est aussi sa limite — elle est consignée à `ETAT.md`.
 */

/**
 * Ce que le composant sait d'une option, et rien de plus.
 *
 * `label` est ce qu'on lit et ce sur quoi on cherche ; `hint` est le second
 * rang — un métier, une qualité —, qui se cherche aussi : taper « research »
 * doit trouver les personnes dont c'est le métier, sans quoi l'indice
 * n'existerait que pour l'œil.
 */
export type PickerOption = {
  id: string;
  label: string;
  hint?: string | undefined;
};

/** Le nombre de suggestions affichées, faute d'une valeur donnée. */
export const PICKER_LIMIT = 8;

const DIACRITIC = /\p{Diacritic}/gu;

/**
 * La forme sur laquelle deux chaînes se comparent : minuscules, sans
 * diacritiques, rognée.
 *
 * « lea » doit trouver « Léa », et « perlé » ne doit pas manquer « Perle ». La
 * décomposition `NFD` sépare la lettre de son signe, le retrait des signes
 * laisse la lettre — c'est le seul chemin qui n'exige pas de table de
 * correspondance à maintenir.
 */
export function normalizeQuery(value: string): string {
  return value.normalize("NFD").replace(DIACRITIC, "").toLowerCase().trim();
}

/**
 * Ce que le composant affiche, et ce qu'il annonce.
 *
 * **Générique sur l'option**, et pas sur `PickerOption` : l'appelant range ce
 * qu'il veut à côté du libellé — un métier, une disponibilité, une nature — et
 * le récupère intact dans son rendu de ligne. Rétrécir ici l'obligerait à
 * retrouver la personne par son identifiant, à chaque suggestion.
 */
export type PickerMatches<T extends PickerOption> = {
  /** Les options à rendre, plafonnées. */
  shown: readonly T[];
  /** Combien correspondent en tout — `shown.length` ou davantage. */
  total: number;
};

/**
 * Les options qui correspondent à la saisie, hors celles déjà retenues.
 *
 * **Une saisie vide ne rend rien**, et ce n'est pas un cas dégénéré : le champ
 * ne redéploie pas la liste entière qu'on vient de replier. C'est la demande
 * même — on cherche, on ne parcourt pas.
 *
 * **Les retenues sont exclues** plutôt que grisées : une option qu'on ne peut
 * pas choisir n'a rien à faire dans une liste de choix, et elle est déjà
 * visible juste en dessous.
 */
export function matchOptions<T extends PickerOption>(
  options: readonly T[],
  query: string,
  chosen: ReadonlySet<string>,
  limit: number = PICKER_LIMIT,
): PickerMatches<T> {
  const shown: T[] = [];
  const needle = normalizeQuery(query);
  if (!needle) return { shown, total: 0 };

  let total = 0;

  for (const option of options) {
    if (chosen.has(option.id)) continue;

    const haystack = normalizeQuery(
      option.hint ? `${option.label} ${option.hint}` : option.label,
    );
    if (!haystack.includes(needle)) continue;

    total += 1;
    if (shown.length < limit) shown.push(option);
  }

  return { shown, total };
}
