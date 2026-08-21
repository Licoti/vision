/**
 * Le bouton — un composant, trois rangs, et le rang se déclare par son nom.
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
 * **Les trois rangs ont le même gabarit, et c'est le point.** Chacun porte un
 * `border` d'un pixel — transparent pour le primaire et le tertiaire —, si bien
 * qu'un rang se substitue à un autre **sans qu'un pixel de mise en page bouge**.
 * La maquette dessine exactement cela (`fiche-accompagnement.css:90`,
 * `border: 1px solid transparent`).
 *
 * Les couples de couleurs sont mesurés, repos et survol :
 *
 * | Couple | Ratio |
 * |---|---|
 * | `content-neutral-pale` sur `surface-primary-base` — primaire au repos | 13,65:1 |
 * | `content-neutral-pale` sur `surface-primary-dark` — primaire au survol | 15,72:1 |
 * | `content-neutral-dark` sur `surface-neutral-pale` — secondaire au repos | 8,12:1 |
 * | `content-neutral-dark` sur `surface-neutral-lighter` — secondaire au survol | 6,52:1 |
 * | `content-primary-dark` sur `surface-neutral-pale` — tertiaire au repos | 15,72:1 |
 * | `content-primary-dark` sur `surface-neutral-lighter` — tertiaire au survol | 12,63:1 |
 * | `content-neutral-normal` sur `surface-neutral-pale` — filet du secondaire | 3,88:1 |
 *
 * Le filet du secondaire est `content-neutral-normal`, **le substitut au jeton de
 * bordure de contrôle qui manque au design system** — celui de `form-field.tsx`,
 * et aucun de plus ne s'invente (règle 2, `ETAT.md`).
 *
 * **Le fond de survol ne se détache qu'à 1,24:1** d'une carte et à 1,18:1 du fond
 * de page. C'est faible, c'est la valeur que la maquette dessine elle-même
 * (`#f7f7f9` sur `#fff`), et **aucun jeton du design system ne fait mieux** — le
 * manque est celui déjà consigné dans `ETAT.md`, « une carte ne se détache d'aucun
 * fond ». Aucun seuil WCAG ne porte sur un survol ; le fait est rapporté, pas
 * masqué.
 *
 * **Ce qui n'existe pas, et pourquoi.** Pas de `size`, pas de `danger`, pas de
 * `ghost` : aucun appelant n'en a. La règle vaut toujours — un composant de socle
 * qui porte une variante sans appelant est une variante que le suivant emploiera
 * de travers — et **elle est enfreinte sciemment sur deux points**, à la demande :
 * le rang `tertiary` et les props d'icône de `Button` n'ont aucun point d'appel au
 * jour où ils sont écrits. Le troisième rang et l'icône sont l'objet même de la
 * demande ; les livrer sans eux aurait été livrer autre chose.
 *
 * **`tertiary` a trouvé son appelant le lendemain** (21/08/2026) : le kebab des
 * entrées de roadmap, qui portait le rang secondaire — un carré à filet répété
 * quinze fois dans une même liste. La variante sans appelant aura tenu un jour.
 *
 * **Deux classes de débogage retirées le même jour** : `bbb` sur `secondary` et
 * `aaaa` sur `tertiary` étaient committées dans `VARIANT` et partaient telles
 * quelles dans l'attribut `class` servi. Elles ne cassaient rien — l'espace de
 * classes est fermé par `--color-*: initial`, donc aucune règle CSS ne leur
 * répondait — et c'est bien le problème : rien ne les signalait.
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Le rang du geste, et la seule chose qu'un appelant ait à connaître.
 *
 * `primary` — le geste principal d'un écran : « Nouveau produit », « Enregistrer ».
 * `secondary` — le geste de second rang : « Modifier », « Archiver », « Filtrer ».
 * `tertiary` — le geste discret : ni fond ni filet, même gabarit que les deux autres.
 */
export type ButtonVariant = "primary" | "secondary" | "tertiary";

/** De quel côté du texte se pose l'icône. */
export type ButtonIconSide = "left" | "right";

/**
 * Ce que les trois rangs ont en commun : la forme, le rythme et l'écart qui
 * sépare une icône de son texte.
 *
 * `border` est ici et non dans les variantes — un filet d'un pixel que le primaire
 * et le tertiaire rendent transparent. Sans lui, changer de rang changerait la
 * hauteur du bouton, et l'échange de variante cesserait d'être gratuit.
 */
const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg border text-sm font-semibold";

/**
 * Le gabarit. Deux seulement : le bouton à texte, et le carré de 32 px des
 * boutons icône seule — le calibre que le kebab et la croix du tiroir portaient
 * déjà tous les deux, mesuré avant d'être repris.
 */
const SIZE = {
  text: "px-4 py-2",
  iconOnly: "size-8",
} as const;

/**
 * Le rang, sur le patron de `TONE` dans `block.tsx` : un objet nommé, une
 * interpolation, et le type se lit dans les clés.
 *
 * `disabled:opacity-60` est dans les trois chaînes et non au point d'appel. Il y
 * était recopié quatre fois — les quatre pieds de formulaire —, et un état qui
 * dépend du rang n'a rien à faire chez celui qui pose le rang.
 */
const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-surface-primary-base text-content-neutral-pale hover:bg-surface-primary-dark disabled:opacity-60",
  secondary:
    "border-content-neutral-normal bg-surface-neutral-pale text-content-neutral-dark hover:bg-surface-neutral-lighter disabled:opacity-60",
  tertiary:
    "border-transparent text-content-primary-dark hover:bg-surface-neutral-lighter disabled:opacity-60",
};

/**
 * Les classes d'un bouton, pour **toute** balise.
 *
 * **Une fonction et non trois constantes**, et le critère est celui
 * d'`action-link.ts` retourné d'un cran : `Button` couvre les `<button>`, mais un
 * bouton se porte aussi sur un `<Link>`, un `<DrawerLink>` et un `<a>` — treize
 * points d'appel de l'application, dont le skip-link. Un composant en imposerait
 * un des quatre ; une constante par combinaison en ferait six. Une fonction rend
 * la combinaison demandée et laisse la balise libre.
 *
 * ```tsx
 * <Link className={buttonClass()}>Nouveau produit</Link>
 * <DrawerLink className={buttonClass({ variant: "secondary" })}>Archiver</DrawerLink>
 * <a className={buttonClass({ variant: "secondary", iconOnly: true })} aria-label="…" />
 * ```
 *
 * L'ordre des morceaux est fixe — forme, gabarit, rang — pour que l'attribut
 * `class` servi soit stable d'un appel à l'autre : c'est ce qui rend un diff de
 * HTML lisible.
 */
export function buttonClass(options?: {
  variant?: ButtonVariant;
  iconOnly?: boolean;
}): string {
  const { variant = "primary", iconOnly = false } = options ?? {};
  return `${BASE} ${iconOnly ? SIZE.iconOnly : SIZE.text} ${VARIANT[variant]}`;
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
  const shell = buttonClass({ variant, iconOnly });
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
