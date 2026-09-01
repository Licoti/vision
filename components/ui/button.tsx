/**
 * Le bouton — un composant, trois rangs, quatre tailles, et le rang se déclare
 * par son nom.
 *
 * **Un seul exemplaire, après vingt-sept**, puis **trois rangs après deux**. Les
 * trois chaînes de geste de l'application étaient recopiées à la main partout où
 * un geste s'offrait ; TD.3 les a réunies ici. Ce qui restait dehors, et que ce
 * fichier absorbe : **trois coquilles** de `components/projects/` qui écrivaient
 * le bouton en deux attributs — la forme ici, la couleur au point de montage —,
 * et **deux boutons icône seule** écrits chacun de leur côté (le kebab
 * d'`action-menu.tsx`, la croix de `drawer.tsx`).
 *
 * **Une fonction de variantes, pas une classe CSS.** La question d'un `.btn` en
 * `@layer components` a été posée puis tranchée deux fois pour la même raison :
 * `@apply` est ce que la documentation de Tailwind déconseille pour abstraire un
 * composant, et une classe CSS poserait une troisième couche de noms **sous**
 * TypeScript — sans variante vérifiée à la compilation, et surtout sans l'endroit
 * où s'écrit la justification mesurée, qui est l'actif rare de ce dépôt. Le
 * standard que `cva` et `tailwind-variants` formalisent est celui retenu ici : une
 * fonction qui rend la chaîne, un composant qui l'appelle. Le dépôt en avait déjà
 * le précédent avec `borderOf()` de `form-field.tsx`.
 *
 * **Pas de `cva`, pas de `cn`, pas de `tailwind-merge`.** Le dépôt n'a aucune
 * dépendance d'interface, et la composition manuelle par gabarit de chaîne y est
 * viable **parce que** `app/globals.css` pose `--color-*: initial` : l'espace de
 * classes est fermé, et les collisions que `tailwind-merge` sert à arbitrer
 * deviennent rares quand la palette fait cent dix couleurs au lieu de deux mille.
 * Ce n'est pas une préférence, c'est la conséquence d'une décision antérieure.
 *
 * ## L'alignement sur le design system de référence
 *
 * Les valeurs de ce fichier ne sont plus déduites de la maquette : elles sont
 * **lues dans la définition du composant `Button` du design system**, dans le
 * bundle servi par son site de documentation (`/docs/_astro/dist.*.js`). La
 * feuille de style seule ne les portait pas — un rythme par taille ne s'y lit
 * pas. Ce qui en vient, tel quel :
 *
 * | | `xs` | `small` | `medium` | `large` |
 * |---|---|---|---|---|
 * | primaire, secondaire | `px-2 py-1` | `px-3 py-2` | `px-4 py-3` | `px-6 py-4` |
 * | tertiaire | `p-0.5` | `p-1` | `p-2` | `p-3` |
 * | libellé | 10 px | 12 px | 14 px | 16 px |
 *
 * Sa palette `primary-*` **est** la primitive `midnight-*` de `tokens.css`, à la
 * valeur près : rien n'est traduit, tout est nommé. `primary-500` est
 * `surface-primary-base`, `primary-400` `surface-primary-normal`, `primary-300`
 * `content-primary-light`, `primary-700` `surface-primary-dark`.
 *
 * **Trois décisions antérieures sont retournées, et il faut les nommer.**
 *
 * 1. **L'invariant « trois rangs, même gabarit » ne tient plus.** Le tertiaire
 *    prend le rythme serré du design system — `p-2` contre `px-4 py-3` —, si bien
 *    qu'échanger un rang contre un autre **déplace** désormais la mise en page.
 *    C'était l'argument du `border` transparent hérité de la maquette
 *    (`fiche-accompagnement.css:90`) ; le filet reste, sa raison a changé : il
 *    tient l'égalité du primaire et du secondaire, plus celle des trois.
 * 2. **Le filet du secondaire n'est plus `content-neutral-normal`.** Il est
 *    `border-primary-base`, et le couple passe de **3,88:1 à 13,65:1**. Le
 *    substitut au jeton de bordure de contrôle qui manque au design system n'est
 *    plus employé ici ; il reste entier dans `form-field.tsx`, et le manque avec
 *    lui.
 * 3. **Le survol du primaire change de sens** : il **éclaircit**
 *    (`surface-primary-normal`) là où il assombrissait, et c'est l'appui qui
 *    assombrit (`surface-primary-dark`). Un geste s'allume sous le pointeur et
 *    s'enfonce sous le doigt.
 *
 * ## Les couples de couleurs, mesurés
 *
 * | Couple | Ratio |
 * |---|---|
 * | PRIMAIRE `content-neutral-pale` sur `surface-primary-base` — repos | 13,65:1 |
 * | PRIMAIRE `content-neutral-pale` sur `surface-primary-normal` — survol | 9,50:1 |
 * | PRIMAIRE `content-neutral-pale` sur `surface-primary-dark` — appui | 15,72:1 |
 * | SECONDAIRE `content-primary-base` sur `surface-neutral-pale` — repos | 13,65:1 |
 * | SECONDAIRE `content-primary-base` sur `surface-primary-lightest` — survol | 13,15:1 |
 * | SECONDAIRE `content-primary-base` sur `surface-primary-lighter` — appui | 10,27:1 |
 * | SECONDAIRE filet `border-primary-base` sur la carte | 13,65:1 |
 * | SECONDAIRE filet `border-primary-base` sur la page | 12,97:1 |
 * | TERTIAIRE `content-primary-base` sur la page — repos | 12,97:1 |
 * | TERTIAIRE `content-primary-light` sur la page — survol | 6,75:1 |
 * | TERTIAIRE `content-primary-dark` sur la page — appui | 14,94:1 |
 *
 * **Deux faits rapportés, et non masqués.** Aucun seuil WCAG ne porte sur eux, et
 * ce fichier a le précédent — il rapportait déjà le survol à 1,24:1 qu'il tenait
 * de la maquette.
 *
 * - **Le survol du secondaire ne se détache que de 1,01:1** du fond de page, et
 *   d'à peine plus de son propre repos : `surface-primary-lightest` est un blanc
 *   bleuté. C'est ce que le design system dessine, et **aucun jeton ne fait mieux
 *   sans changer de palier**. L'appui, lui, se voit (1,26:1), et le focus clavier
 *   ne dépend pas du survol — il est porté par `*:focus-visible` de
 *   `globals.css`.
 * - **Le désactivé tombe à 2,35:1** une fois `opacity-40` composée sur la page,
 *   contre 4,04:1 à l'`opacity-60` d'avant. WCAG 1.4.3 exempte explicitement les
 *   composants inactifs ; la valeur est celle du design system.
 *
 * ## Ce qui n'existe pas, et pourquoi
 *
 * Pas de `danger`, pas de `ghost`, pas de `reversed` : aucun appelant n'en a. La
 * règle vaut toujours — un composant de socle qui porte une variante sans appelant
 * est une variante que le suivant emploiera de travers — et **elle est enfreinte
 * sciemment**, à la demande, sur `xs`, `small` et `large` : l'échelle du design
 * system est écrite entière alors que les trente points d'appel restent tous au
 * défaut `medium`. C'est le troisième écart de ce genre après le rang `tertiary`
 * et les props d'icône, et il est consigné dans `JOURNAL-TECHNIQUE.md`.
 *
 * **`tertiary` avait trouvé son appelant le lendemain** (21/08/2026) : le kebab
 * des entrées de roadmap. La variante sans appelant aura tenu un jour.
 *
 * **Deux classes de débogage retirées le même jour** : `bbb` sur `secondary` et
 * `aaaa` sur `tertiary` étaient committées dans `VARIANT` et partaient telles
 * quelles dans l'attribut `class` servi. Elles ne cassaient rien — l'espace de
 * classes est fermé par `--color-*: initial`, donc aucune règle CSS ne leur
 * répondait — et c'est bien le problème : rien ne les signalait.
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Le rang du geste, et la première chose qu'un appelant ait à connaître.
 *
 * `primary` — le geste principal d'un écran : « Nouveau produit », « Enregistrer ».
 * `secondary` — le geste de second rang : « Modifier », « Archiver », « Filtrer ».
 * `tertiary` — le geste discret : ni fond ni filet, et un rythme serré.
 */
export type ButtonVariant = "primary" | "secondary" | "tertiary";

/**
 * La taille du geste, et la seconde.
 *
 * `medium` est le défaut et couvre l'application entière. `small` et `xs` sont
 * pour les surfaces denses — une ligne de tableau, une carte compacte — où un
 * bouton de plein calibre écraserait ce qui l'entoure ; `large` pour la page qui
 * ne porte qu'un geste. **Aucun appelant ne les emploie au jour de l'écriture.**
 */
export type ButtonSize = "xs" | "small" | "medium" | "large";

/** De quel côté du texte se pose l'icône. */
export type ButtonIconSide = "left" | "right";

/**
 * Ce que tous les boutons ont en commun : la forme, l'écart qui sépare une icône
 * de son texte, le fondu d'un état à l'autre et l'aspect du désactivé.
 *
 * **`inline-flex` et non le `flex flex-row` du design system** : le sien
 * s'accompagne d'une prop `relaxed` qui n'existe pas ici, et un bouton de ce
 * produit se pose dans une ligne de texte.
 *
 * **`cursor-pointer` n'est pas cosmétique.** La preflight de Tailwind 4 ne pose
 * plus `cursor: pointer` sur `<button>` — vérifié dans
 * `node_modules/tailwindcss/preflight.css`, où le mot ne paraît que pour les
 * flèches d'un `<input type="number">` sous Safari. Sans cette classe, tous les
 * gestes du produit rendaient une flèche.
 *
 * **`transition-colors` et non le `transition-all` du design system** : seules la
 * couleur, le fond et le filet changent d'un état à l'autre. `transition-all`
 * animerait aussi des propriétés de mise en page, sans qu'aucune ne bouge.
 *
 * **`disabled:opacity-40` est ici et non dans `VARIANT`** : il ne dépend pas du
 * rang, et il y était écrit trois fois. Il **ne s'applique pas** aux `<a>` et aux
 * `<Link>` qui portent `buttonClass()` — une balise qu'on ne peut pas désactiver
 * ne reçoit jamais l'attribut. Le fait est un point ouvert d'`ETAT.md`, pas un
 * oubli.
 *
 * **Pas de `font-primary`** : `--default-font-family` est posé dans `@theme`, et
 * la preflight fait hériter la police aux éléments de formulaire.
 *
 * **Pas de `group`** : le design system en a besoin parce que son libellé est un
 * `<span>` enfant dont la couleur suit le survol du parent. Ici le texte est
 * enfant direct du bouton, et `hover:text-…` posé sur le bouton lui parvient par
 * héritage — l'icône d'`ButtonIcon` comprise.
 */
const BASE =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border font-semibold " +
  "transition-colors duration-[var(--duration-state)] " +
  "disabled:cursor-not-allowed disabled:opacity-40";

/**
 * Le rythme du bouton plein — celui qui a un fond ou un filet, donc le primaire
 * et le secondaire. Chaque palier porte sa taille de texte : elle appartient au
 * gabarit, pas à la forme.
 */
const SIZE: Record<ButtonSize, string> = {
  xs: "px-2 py-1 text-2xs",
  small: "px-3 py-2 text-xs",
  medium: "px-4 py-3 text-sm",
  large: "px-6 py-4 text-md",
};

/**
 * Le rythme du tertiaire, et il est à lui : sans fond ni filet, un bouton n'a
 * pas de boîte à respecter, et le design system le serre nettement. En `medium`,
 * huit pixels de marge au lieu de seize et douze — trente-huit pixels de haut
 * contre quarante-six.
 */
const SIZE_TERTIARY: Record<ButtonSize, string> = {
  xs: "p-0.5 text-2xs",
  small: "p-1 text-xs",
  medium: "p-2 text-sm",
  large: "p-3 text-md",
};

/**
 * Le carré de 32 px des boutons icône seule — le calibre que le kebab et la croix
 * du tiroir portaient déjà tous les deux, mesuré avant d'être repris. Il est
 * **hors de l'échelle** : `size` ne l'atteint pas, et le design system fait de
 * même en confiant l'icône seule à un autre composant.
 *
 * `text-sm` y est écrit **explicitement**, parce que `BASE` ne le donne plus : le
 * kebab et la croix sont des caractères, et sans cette classe ils hériteraient la
 * taille de leur contexte. C'est exactement ce qu'ils rendaient auparavant.
 */
const ICON_ONLY = "size-8 text-sm";

/**
 * Le rang, sur le patron de `TONE` dans `block.tsx` : un objet nommé, une
 * interpolation, et le type se lit dans les clés.
 *
 * Le primaire porte un filet **opaque** de la couleur de son fond, et non
 * transparent : c'est ce que fait le design system, et cela lui donne trois états
 * de filet là où le fond en a trois. Le tertiaire garde le sien transparent — il
 * doit tenir la hauteur du plein sans en dessiner la boîte.
 */
const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "border-border-primary-base bg-surface-primary-base text-content-neutral-pale " +
    "hover:border-border-primary-normal hover:bg-surface-primary-normal " +
    "active:border-border-primary-dark active:bg-surface-primary-dark",
  secondary:
    "border-border-primary-base bg-surface-neutral-pale text-content-primary-base " +
    "hover:bg-surface-primary-lightest active:bg-surface-primary-lighter",
  tertiary:
    "border-transparent text-content-primary-base " +
    "hover:text-content-primary-light active:text-content-primary-dark",
};

/**
 * Les classes d'un bouton, pour **toute** balise.
 *
 * **Une fonction et non trois constantes**, et le critère est celui
 * d'`action-link.ts` retourné d'un cran : `Button` couvre les `<button>`, mais un
 * bouton se porte aussi sur un `<Link>`, un `<DrawerLink>` et un `<a>` — treize
 * points d'appel de l'application, dont le skip-link. Un composant en imposerait
 * un des quatre ; une constante par combinaison en ferait vingt-quatre. Une
 * fonction rend la combinaison demandée et laisse la balise libre.
 *
 * ```tsx
 * <Link href={href} className={buttonClass()}>Nouveau produit</Link>
 * <DrawerLink href={href} className={buttonClass({ variant: "secondary" })}>Archiver</DrawerLink>
 * <a className={buttonClass({ variant: "secondary", iconOnly: true })} aria-label="…" />
 * ```
 *
 * **`iconOnly` l'emporte sur `size`, en silence.** Les deux ne se composent pas :
 * le carré de 32 px est hors de l'échelle, et une taille posée avec lui n'a aucun
 * effet. Le cas ne se présente pas — les deux appelants d'`iconOnly` ne posent
 * pas de taille —, et le rendre impossible à écrire coûterait une union
 * discriminée de plus sur une fonction que quatre balises appellent.
 *
 * L'ordre des morceaux est fixe — forme, gabarit, rang — pour que l'attribut
 * `class` servi soit stable d'un appel à l'autre : c'est ce qui rend un diff de
 * HTML lisible.
 */
export function buttonClass(options?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconOnly?: boolean;
}): string {
  const {
    variant = "primary",
    size = "medium",
    iconOnly = false,
  } = options ?? {};
  const gauge = iconOnly
    ? ICON_ONLY
    : variant === "tertiary"
      ? SIZE_TERTIARY[size]
      : SIZE[size];
  return `${BASE} ${gauge} ${VARIANT[variant]}`;
}

/**
 * L'icône d'un bouton — un glyphe, jamais une information.
 *
 * **Exportée parce que l'`aria-hidden` s'oublie.** Le dépôt n'a aucune librairie
 * d'icônes : ce sont des caractères (`+`, `✕`) et des `<span>` dessinés, et
 * chacun doit être retiré de l'arbre d'accessibilité, le bouton étant nommé par
 * son texte ou par son `aria-label`. `Button` s'en sert tout seul ; les balises
 * qui composent leurs propres enfants — les trois `<DrawerLink>` de
 * `components/projects/` — l'appellent à la main.
 */
export function ButtonIcon({ children }: { children: ReactNode }) {
  return <span aria-hidden="true">{children}</span>;
}

type ButtonShared = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "aria-label"
> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
};

/**
 * Un `<button>`, et rien d'autre — jamais un lien déguisé.
 *
 * **Le nom accessible ne peut pas manquer, et c'est le type qui le garantit.** Un
 * bouton sans `children` est un bouton icône seule ; son `label` devient alors
 * **obligatoire** et l'union discriminée ci-dessous refuse de compiler sans lui.
 * C'est la leçon de T5bis.5 rendue structurelle : `<title>` vidé par React avait
 * donné un `role="img"` sans nom accessible, avec `tsc` et `eslint` au vert. Ici,
 * l'oubli ne compile pas.
 *
 * **`className` s'ajoute en suffixe, il ne remplace pas.** C'est la règle de
 * `CONTROL_TEXT` (`form-field.tsx`).
 *
 * **Le ternaire, jamais `${className ?? ""}`** : TD.1 a mesuré ce que coûte la
 * seconde forme — dix-huit espaces finaux dans un attribut `class` servi.
 *
 * **`{...props}` précède `className`**, et l'ordre n'est pas indifférent : React
 * rend les attributs dans l'ordre des props, les points d'appel portaient tous
 * `className` en dernier, et l'inverser remonterait `class` devant `type` dans le
 * HTML servi. Lu dans le HTML, pas supposé.
 */
export function Button({
  variant = "primary",
  size = "medium",
  icon,
  iconSide = "left",
  label,
  className,
  children,
  ...props
}:
  | (ButtonShared & {
      children: ReactNode;
      iconSide?: ButtonIconSide;
      label?: never;
    })
  | (ButtonShared & {
      children?: never;
      icon: ReactNode;
      iconSide?: never;
      label: string;
    })) {
  const iconOnly = children === undefined;
  const shell = buttonClass({ variant, size, iconOnly });
  return (
    <button
      {...props}
      {...(iconOnly ? { "aria-label": label } : null)}
      className={className ? `${shell} ${className}` : shell}
    >
      {icon !== undefined && iconSide !== "right" ? (
        <ButtonIcon>{icon}</ButtonIcon>
      ) : null}
      {children}
      {icon !== undefined && iconSide === "right" ? (
        <ButtonIcon>{icon}</ButtonIcon>
      ) : null}
    </button>
  );
}
