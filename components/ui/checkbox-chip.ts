/**
 * Les classes d'une **valeur de référentiel qu'on coche** — une case à cocher,
 * en plus grand.
 *
 * **Un seul exemplaire, après deux — et l'extraction était écrite d'avance.**
 * La chaîne est née dans `components/projects/project-form.tsx` le 29/08/2026,
 * sous un commentaire qui posait sa propre condition de sortie : *« C'est la
 * quatrième écriture d'une pastille dans le dépôt, après les deux chips de
 * filtre et la bascule d'échelle. Aucune des trois n'est une case à cocher ;
 * l'extraction se fera le jour où deux le seront. »* Le rail de filtres
 * d'`/equipe` est la seconde. La condition est remplie, le geste suit.
 *
 * **Une constante et non un composant**, la règle d'`ACTION_LINK` : elle
 * s'applique à un `<label>` qui enveloppe une case de formulaire de saisie
 * comme à un `<label>` qui enveloppe une case de filtre, et ces deux-là ne
 * partagent ni leur `name`, ni leur `id`, ni leur `aria-describedby`. Un
 * composant imposerait une signature à deux appelants qui n'ont en commun que
 * leur forme.
 *
 * **Le défaut réparé est une cible de clic.** Une case native mesure une
 * quinzaine de pixels et son seul agrandissement est le `<label>` qui la suit.
 * La pastille porte `px-4 py-3` autour du couple case + texte, ce qui donne un
 * peu plus de 44 px de haut.
 *
 * **44 px est un confort, pas une règle de ce produit, et la nuance a été
 * vérifiée le 31/08/2026** : le chiffre n'apparaît ni dans `docs/06` §11 — qui
 * demande « navigation clavier complète, focus visible, contrastes conformes »
 * et ne dit rien des cibles — ni dans aucune fiche de ticket. Il vient de
 * WCAG 2.5.5, qui est **AAA** ; le seuil **AA** est 2.5.8, à 24×24 px. Deux
 * commentaires du dépôt l'attribuaient à T7.6 : c'était faux, T7.6 portait sur
 * des colonnes rognées, et ils sont récrits.
 *
 * **La case reste là, et c'est ce qui autorise le filet clair de l'état coché.**
 * Le contrôle qui se mesure à 3:1 (WCAG 1.4.11) est la case native, dessinée
 * par le navigateur ; la pastille est l'aire de son intitulé. Elle porte quand
 * même `content-neutral-normal` au repos — le filet de tous les contrôles de
 * saisie du dépôt.
 *
 * **L'état ne tient pas à la couleur seule** : la case est cochée, et c'est
 * elle qui porte l'information. Le fond et le filet la redoublent, ils ne la
 * remplacent pas.
 *
 * **La teinte est en CSS, jamais calculée au rendu.** Une classe choisie depuis
 * l'état aurait été juste au premier affichage et fausse à la première coche :
 * rien ne re-rend ces `<label>`, les cases étant non contrôlées. `has-checked:`
 * fait porter l'état par le sélecteur `:has(:checked)` — il suit le clic, il
 * suit une remise à zéro du formulaire, et **il fonctionne sans une ligne de
 * JavaScript**.
 *
 * Les deux couples sont mesurés sur `surface-neutral-pale` — le fond de la
 * carte du formulaire de projet, et celui du rail d'`/equipe`, qui est la même
 * `Section`. **Aucun couple n'est neuf par la position**, et les quatre mesures
 * du 29/08/2026 valent donc telles quelles :
 *
 * | Couple | Ratio |
 * |---|---|
 * | `content-neutral-darkest` sur `surface-neutral-pale` — au repos | 17,87:1 |
 * | `content-neutral-normal` — le filet au repos | 3,88:1 |
 * | `content-primary-dark` sur `surface-primary-lightest` — coché | 15,14:1 |
 * | `border-primary-base` — le filet coché | 13,65:1 |
 */
export const CHECKBOX_CHIP = [
  "flex items-center gap-2 rounded-lg border px-4 py-3 text-sm",
  "border-content-neutral-normal bg-surface-neutral-pale text-content-neutral-darkest",
  "has-checked:border-border-primary-base has-checked:bg-surface-primary-lightest has-checked:font-medium has-checked:text-content-primary-dark",
].join(" ");

/**
 * La case elle-même, teintée à la couleur primaire. Un seul utilitaire, mais il
 * accompagne la pastille partout où elle va : le séparer serait rouvrir la
 * divergence que cette extraction referme.
 */
export const CHECKBOX_CHIP_INPUT = "accent-surface-primary-base";

/**
 * La même pastille, **sans sa case** — celle du rail de filtres d'`/equipe`,
 * telle que la maquette de la direction B la dessine (31/08/2026).
 *
 * **Une seconde famille et non un drapeau sur la première**, et la divergence
 * est voulue : dans un formulaire de saisie, une case visible dit « ceci est un
 * contrôle de ce formulaire » au milieu de champs qui le disent tous ; dans un
 * rail de filtres, elle n'a rien à distinguer, et onze cases alignées y sont du
 * bruit. Ce sont deux objets, ils se nomment séparément — le jour où l'un des
 * deux gagne une mesure, l'autre ne la reçoit pas par accident.
 *
 * **La case n'est pas retirée, elle est masquée** (`sr-only`) : c'est toujours
 * elle qui porte l'état, qui part dans la requête, qui s'annonce à la voix avec
 * son état coché, et qui déclenche `:has(:checked)`. La retirer aurait demandé
 * du JavaScript et un `aria-pressed` là où le HTML natif suffit.
 *
 * **Trois conséquences de ce masquage, et aucune n'est cosmétique.**
 *
 * 1. **La pastille devient le contrôle**, donc c'est son filet qui doit se voir
 *    à 3:1 (WCAG 1.4.11). La maquette le pose en `greyscale-250` — **mesuré à
 *    1,65:1**, un contour qu'on devine. Il reste donc `content-neutral-normal`,
 *    **3,88:1**, le filet de tous les contrôles du dépôt. C'est le seul écart à
 *    la maquette, et il est mesuré.
 * 2. **Le focus change de porteur.** L'anneau global de `globals.css` se
 *    peindrait sur la boîte d'un pixel de la case masquée, donc invisible. Il
 *    est repris ici par la pastille, `has-[:focus-visible]:`, avec les **mêmes
 *    jetons** que la règle globale — `--number-2` pour l'épaisseur et le
 *    décalage, `border-focus` pour la couleur. Aucune valeur en dur (règle 2).
 * 3. **L'état coché perd son porteur non chromatique le plus franc.** La case
 *    cochée le portait ; il reste le passage de la graisse **400 à 600** — la
 *    valeur de la maquette, et non le `500` de la pastille de saisie, choisi
 *    justement parce qu'il doit porter seul ce que la case portait. Le fond, le
 *    filet et la couleur du texte le redoublent. **C'est plus faible qu'une case
 *    visible**, et c'est consigné : une coche qui paraîtrait dans la pastille
 *    rendrait la différence entière, au prix d'un emplacement réservé sur les
 *    onze.
 *
 * Les couples sont ceux de `CHECKBOX_CHIP`, **aucun n'est neuf par la
 * position** : 17,87:1 au repos · 3,88:1 son filet · 15,14:1 coché · 13,65:1 son
 * filet. Les deux valeurs que la maquette partage avec le dépôt — le fond
 * `#f5f9ff` et le texte `#1c1a50` de l'état coché — sont exactement
 * `surface-primary-lightest` et `content-primary-dark`.
 */
/**
 * Les deux calibres de la pastille de filtre, sur le patron de `SIZE` dans
 * `avatar.tsx` et `tag.tsx` — un objet nommé, une interpolation, le type dans
 * les clés.
 *
 * `sm` est la forme héritée de la pastille de saisie : `px-4 py-3`, un peu plus
 * de 44 px de haut. `xs` est arrivé le 31/08/2026 avec le rail d'`/equipe`, où
 * **onze pastilles s'empilent dans une colonne de 320 px** : ce qui est un
 * confort sur quatre valeurs de formulaire devient de la hauteur perdue sur
 * onze. Il rend **39 px**, mesurés au filet dans le rendu.
 *
 * **Ce que ce calibre coûte, dit franchement** : il sort du confort AAA de
 * WCAG 2.5.5 (44×44) et reste très au-dessus du seuil **AA** de 2.5.8 (24×24),
 * le seul que ce produit doive tenir. La cible ne se rétrécit d'ailleurs que
 * verticalement — une pastille fait de 100 à 250 px de large.
 *
 * **La taille du texte ne bouge pas** : `text-sm` vaut 14 px, et le nom d'une
 * compétence est ce qu'on lit pour choisir. Seul le rembourrage cède.
 */
const FILTER_CHIP_SIZE = {
  sm: "px-4 py-3",
  xs: "px-3 py-2",
} as const;

export type FilterChipSize = keyof typeof FILTER_CHIP_SIZE;

/**
 * Les classes d'une pastille de filtre, pour toute balise — la forme de
 * `buttonClass()` dans `components/ui/button.tsx`, et pour la même raison : une
 * fonction rend les combinaisons, une constante par combinaison les
 * multiplierait.
 */
export function filterChipClass(
  options?: { size?: FilterChipSize },
): string {
  const { size = "sm" } = options ?? {};
  return [
    `flex items-center rounded-full border text-sm ${FILTER_CHIP_SIZE[size]}`,
    "border-content-neutral-normal bg-surface-neutral-pale text-content-neutral-darkest",
    "has-checked:border-border-primary-base has-checked:bg-surface-primary-lightest has-checked:font-semibold has-checked:text-content-primary-dark",
    "has-[:focus-visible]:outline-[length:var(--number-2)] has-[:focus-visible]:outline-border-focus has-[:focus-visible]:outline-offset-[length:var(--number-2)]",
  ].join(" ");
}

/**
 * La case du rail : présente, annoncée, tabulable — et hors de vue. `sr-only`
 * et non `hidden` : ce dernier la sortirait de l'arbre d'accessibilité **et** de
 * l'ordre de tabulation, c'est-à-dire retirerait le filtre au clavier.
 */
export const FILTER_CHIP_INPUT = "sr-only";
