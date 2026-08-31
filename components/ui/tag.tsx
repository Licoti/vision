/**
 * La puce — une approche mobilisée, telle que la maquette la dessine.
 *
 * Un `<span>`, pas un lien : rien ne filtre par approche depuis la page
 * projet, et un faux bouton coûterait un arrêt de tabulation pour rien.
 *
 * Le fond et le filet sont **décoratifs** : c'est le texte qui porte
 * l'information, mesuré à 6,84:1 sur ce fond. La puce elle-même se détache peu
 * de la carte (1,04:1 pour le fond, 1,33:1 pour le filet) — acceptable ici, et
 * seulement ici : la limite à 3:1 vaut pour un composant qu'il faut savoir
 * viser, pas pour un cerne posé autour d'un mot lisible.
 */

/**
 * Les deux calibres, sur le patron de `SIZE` dans `avatar.tsx` — un objet nommé,
 * une interpolation, et le type se lit dans les clés.
 *
 * `sm` est le calibre historique, celui de la maquette, et **le défaut** : les
 * neuf points d'appel antérieurs ne passent aucune taille et ne changent donc
 * pas d'un caractère.
 *
 * `xs` est arrivé le 31/08/2026 avec la ligne d'`/equipe`, où la puce n'est plus
 * un ornement de carte mais **une valeur dans une colonne de 288 px**, deux ou
 * trois par ligne, sur dix lignes. Il rogne le rythme vertical — `py-1` devient
 * `py-0.5` — et l'horizontal — `px-3` devient `px-2` —, soit **quatre pixels de
 * haut et huit de large en moins**, mesurés au rendu.
 *
 * **La taille du texte ne bouge pas**, et c'est la seule chose qui ne se négocie
 * pas ici : `text-xs` vaut 12 px, et le mot « Intermédiaire » posé à côté d'une
 * compétence est de l'information, pas une étiquette de rubrique. Passer à
 * `text-2xs` aurait rendu 10 px — la taille des surtitres en capitales, jamais
 * celle d'une valeur qu'on lit. Le couple de couleurs est donc inchangé et
 * reste mesuré à 6,84:1 ; **aucun couple n'est neuf par la position**.
 */
const SIZE = {
  sm: "px-3 py-1",
  xs: "px-2 py-0.5",
} as const;

export type TagSize = keyof typeof SIZE;

export function Tag({
  label,
  size = "sm",
}: {
  label: string;
  /** `xs` quand la puce est une valeur de liste dense, et non un ornement. */
  size?: TagSize;
}) {
  return (
    <span
      /* Le calibre est interpolé **à la place exacte qu'occupaient `px-3 py-1`**,
         et non ajouté en suffixe : les neuf appelants antérieurs servent alors
         un attribut `class` identique à l'octet près, et non seulement un rendu
         équivalent. La leçon de `Button`, dont le commentaire de `className`
         dit la même chose de l'ordre des props. */
      className={`rounded-full border border-border-primary-lighter bg-surface-primary-lightest ${SIZE[size]} text-xs font-medium text-content-primary-light`}
    >
      {label}
    </span>
  );
}
