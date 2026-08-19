/**
 * Les classes d'un **geste texte** — « Modifier », « Archiver », « Retirer ».
 *
 * **Un seul exemplaire, après quatre.** La constante a été recopiée dans
 * `roadmap.tsx` (T3.3), `resources.tsx` (T4.1), `indicators.tsx` (T5.1) et
 * `adopted-indicators.tsx` (T5.4) — chaque fois parce qu'aucun des fichiers
 * précédents ne l'exportait.
 *
 * **Une constante et non un composant** : elle s'applique à un `<Link>`, à un
 * `<button type="submit">` et à un `<summary>`, trois éléments que `roadmap.tsx`
 * emploie côte à côte. Un composant imposerait l'un des trois.
 *
 * Le couple de couleurs est mesuré depuis T4.1 et n'a pas bougé :
 * `content-primary-dark` sur `surface-neutral-pale`. Le soulignement porte la
 * nature du geste sans la couleur — un lien qui ne se distinguerait que par sa
 * teinte serait invisible à qui ne la perçoit pas (`docs/06` §11).
 */
export const ACTION_LINK =
  "text-xs font-semibold text-content-primary-dark underline";

/**
 * Le même geste, d'un rang au-dessus — « Annuler » au pied d'un formulaire,
 * « Retirer tous les filtres », l'action d'un état vide.
 *
 * **Un seul exemplaire, après onze.** La variante `xs` a été factorisée en TD.1 ;
 * celle-ci n'a jamais eu droit au même traitement, et elle est allée deux fois
 * plus loin. Elle porte les deux mêmes balises que sa jumelle et une troisième —
 * `<Link>`, `<button type="submit">`, `<DrawerClose>` —, ce qui la range au même
 * niveau : une constante, pas un composant.
 *
 * **Écrite en entier plutôt que dérivée d'`ACTION_LINK`** : la taille est en
 * tête de chaîne. Un `${ACTION_LINK} text-sm` servirait deux `text-*` dans le
 * même attribut, et il faudrait alors savoir laquelle gagne — c'est exactement
 * la question que `tailwind-merge` existe pour trancher, et que ce dépôt évite
 * en ne la posant pas.
 */
export const ACTION_LINK_SM =
  "text-sm font-semibold text-content-primary-dark underline";
