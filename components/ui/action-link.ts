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
