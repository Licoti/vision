/**
 * Le bouton — le composant que le socle n'avait jamais porté.
 *
 * **Un seul exemplaire, après vingt-sept.** Les trois chaînes de geste de
 * l'application étaient recopiées à la main partout où un geste s'offrait :
 * douze fois le bouton primaire — plus une **treizième, dérivée** —, quatre fois
 * le secondaire, onze fois le lien-action `sm`. `docs/design/design-system.md`
 * §10 nomme `Button` depuis le premier jour ; `components/ui/` ne le portait pas,
 * et c'est l'élément le plus réutilisé de toute interface.
 *
 * **Deux niveaux, et le critère entre eux est celui d'`action-link.ts`** : un
 * composant quand l'élément rendu est fixe, une constante quand c'est la balise
 * qui varie. Les deux sont nécessaires, et `produits/[id]/page.tsx` en fait la
 * démonstration dans un seul `<span>` — le même bouton secondaire y porte un
 * `<Link>` et un `<DrawerLink>` côte à côte, à côté d'un `<button type="submit">`
 * ailleurs sur la page. Un composant en imposerait un des trois.
 *
 * **Pas de `cva`, pas de `cn`, pas de `tailwind-merge`.** Le dépôt n'a aucune
 * dépendance d'interface, et la composition manuelle par gabarit de chaîne y est
 * viable **parce que** `app/globals.css` pose `--color-*: initial` : l'espace de
 * classes est fermé, et les collisions que `tailwind-merge` sert à arbitrer
 * deviennent rares quand la palette fait cent dix couleurs au lieu de deux mille.
 * Ce n'est pas une préférence, c'est la conséquence d'une décision antérieure.
 *
 * **Aucune variante que personne n'appelle** — pas de `size`, pas de `danger`,
 * pas de `ghost`. Un composant de socle qui porte une variante sans appelant est
 * une variante que le suivant emploiera de travers.
 *
 * Les couples de couleurs sont mesurés et n'ont pas bougé :
 * `content-neutral-pale` sur `surface-primary-base` pour le primaire,
 * `content-neutral-dark` sur `surface-neutral-pale` pour le secondaire. Le filet
 * du secondaire est `content-neutral-normal`, **le substitut au jeton de bordure
 * de contrôle qui manque au design system** — celui de `form-field.tsx`, et
 * aucun de plus ne s'invente (règle 2, `ETAT.md`).
 */

import type { ButtonHTMLAttributes } from "react";

/**
 * Le geste principal d'un écran : « Nouveau produit », « Enregistrer »,
 * « Filtrer », « Rétablir ».
 *
 * Exportée en constante **en plus** du composant, parce que trois de ses treize
 * points d'appel ne sont pas des `<button>` : les deux `<Link>` de création des
 * listes, celui de la page produit — et le skip-link d'`app/(app)/layout.tsx`,
 * qui est ce bouton **plus** `sr-only` et quatre utilitaires de focus, dans cet
 * ordre.
 */
export const BUTTON_PRIMARY =
  "rounded-lg bg-surface-primary-base px-4 py-2 text-sm font-semibold text-content-neutral-pale";

/**
 * Le geste de second rang, sur les deux pages de détail : « Modifier »,
 * « Archiver ».
 *
 * **Elle n'a aucun appel en composant, et c'est normal** : ses quatre points
 * d'appel sont deux `<Link>` et deux `<DrawerLink>`. La variante existe dans
 * `VARIANT` malgré tout — un `<button>` secondaire est le prochain geste qu'on
 * écrira, et l'écrire hors du composant serait la quatorzième copie.
 */
export const BUTTON_SECONDARY =
  "rounded-lg border border-content-neutral-normal px-4 py-2 text-sm font-semibold text-content-neutral-dark";

/**
 * Le rang du geste. Sur le patron de `TONE` dans `block.tsx` : un objet nommé,
 * une interpolation, et le type se lit dans les clés.
 */
const VARIANT = {
  primary: BUTTON_PRIMARY,
  secondary: BUTTON_SECONDARY,
} as const;

/**
 * Un `<button>`, et rien d'autre — jamais un lien déguisé.
 *
 * **`className` s'ajoute en suffixe, il ne remplace pas.** C'est la règle de
 * `CONTROL_TEXT` (`form-field.tsx`), et elle sert ici les quatre pieds de
 * formulaire qui portent `disabled:opacity-60` : la classe reste **au point
 * d'appel** plutôt que dans la variante, parce que cinq des neuf boutons ne la
 * portent pas et qu'une classe qui apparaîtrait sur eux serait un changement de
 * rendu là où le ticket n'en veut aucun.
 *
 * **Le ternaire, jamais `${className ?? ""}`** : TD.1 a mesuré ce que coûte la
 * seconde forme — dix-huit espaces finaux dans un attribut `class` servi.
 *
 * **`{...props}` précède `className`**, et l'ordre n'est pas indifférent : React
 * rend les attributs dans l'ordre des props, les neuf points d'appel portaient
 * tous `className` en dernier, et l'inverser aurait remonté `class` devant
 * `type` dans le HTML servi. Lu dans le HTML, pas supposé.
 */
export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: {
  variant?: keyof typeof VARIANT;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        className ? `${VARIANT[variant]} ${className}` : VARIANT[variant]
      }
    >
      {children}
    </button>
  );
}
