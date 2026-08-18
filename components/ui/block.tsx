/**
 * Le bloc de la page produit — la coquille et l'en-tête que ses trois blocs
 * partagent.
 *
 * Écrit hors ticket le 17/08/2026, sur la demande d'une cohérence visuelle
 * d'ensemble. Avant lui, « North Star », « Accompagnements » et « Roadmap »
 * portaient trois langages : deux cartes et une section nue, trois graisses de
 * titre, une note tantôt sous le titre tantôt à côté, trois rythmes verticaux.
 * Ils portent désormais la même structure, et **gardent chacun sa
 * spécificité** — la tonalité de surface, le contenu, l'action.
 *
 * **Ce n'est pas `Section`, et les deux cohabitent.** `Section` reste le bloc
 * de référence de la page projet (`docs/06` §5) : rayon `xl`, titre `md`. Les
 * maquettes de `docs/design/maquettes/blocs/` donnent aux blocs de la page
 * produit un cadre plus ample — rayon 22 px, en-tête de rang supérieur —, et
 * c'est ce que `Block` rend. Que les deux pages divergent entre elles est un
 * écart connu, hors du périmètre de la demande, signalé dans `ETAT.md`.
 *
 * **Sans ombre portée** : le design system nomme ses trois élévations sans leur
 * donner de valeur (`tokens.css` §8), et aucun septième substitut ne s'invente
 * (`ETAT.md`). Les maquettes en posent une ; l'écart est celui que `roadmap.tsx`
 * consignait déjà, il ne fait que changer de fichier.
 *
 * **Le composant ne connaît aucun droit.** L'action arrive en `ReactNode`, déjà
 * décidée par l'appelant — la règle de `PageHeader` et de `SectionHeader`.
 */

import type { ReactNode } from "react";

/**
 * La tonalité de surface d'un bloc.
 *
 * `neutral` est le défaut : la carte pâle des maquettes. `primary` est la
 * surface bleue de la North Star, **et c'est la seule spécificité qu'on lui
 * laisse dans la coquille** — le reste (rayon, filet, padding, rythme) est
 * commun. Elle porte un sens : ce bloc est l'objectif du produit, pas un bloc
 * de plus.
 */
const TONE = {
  neutral: "border-surface-neutral-lighter bg-surface-neutral-pale",
  primary: "border-border-primary-lighter bg-surface-primary-lightest",
} as const;

export function Block({
  tone = "neutral",
  children,
}: {
  tone?: keyof typeof TONE;
  children: ReactNode;
}) {
  return (
    <section
      className={`flex flex-col gap-5 rounded-3xl border p-6 ${TONE[tone]}`}
    >
      {children}
    </section>
  );
}

/**
 * L'en-tête d'un bloc : une marque facultative, un titre, une note, une action.
 *
 * Le titre est un `h2` : la hiérarchie des titres est vérifiée en audit
 * d'accessibilité, et le centre en fait métier (`docs/06` §11). Il est plus
 * fort que celui de `SectionHeader` parce que ces blocs sont les chapitres de
 * la page produit, non ses annexes.
 *
 * **La note est toujours sous le titre**, jamais à côté : à côté, elle entrait
 * en concurrence avec lui dès qu'elle dépassait trois mots, et c'était l'écart
 * le plus visible entre « Accompagnements » et les deux autres.
 *
 * **`content-neutral-dark` pour la note, et c'est une mesure qui l'impose** :
 * `content-neutral-base` — le jeton de note de `SectionHeader` — tombe à
 * 3,75:1 sur `surface-primary-lighter`, sous la limite du texte courant. Le
 * même en-tête devant tenir sur les deux tonalités, c'est le jeton qui passe
 * partout qui gagne : 6,11:1 sur la surface bleue, 8,12:1 sur la pâle.
 *
 * **L'action est alignée en haut**, pas centrée : le menu « … » de la North
 * Star doit rester à hauteur du titre quand la note tient sur deux lignes.
 */
export function BlockHeader({
  mark,
  title,
  note,
  action,
}: {
  /**
   * Une marque décorative devant le titre — le ★ de la North Star. **Elle sort
   * de l'arbre d'accessibilité** : le titre est écrit juste à côté, et la
   * couleur ne porte jamais seule (`docs/06` §11).
   */
  mark?: ReactNode;
  title: string;
  note?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2.5 text-xl font-bold text-content-neutral-darkest">
          {mark ? <span aria-hidden="true">{mark}</span> : null}
          {title}
        </h2>
        {note ? (
          <p className="mt-1 max-w-160 text-sm leading-175 text-content-neutral-dark">
            {note}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/**
 * Un intertitre dans un bloc : un `h3`, une marque facultative, puis un filet
 * qui court jusqu'au bord.
 *
 * Il est ici plutôt que dans `indicators.tsx` parce qu'il fait partie du
 * langage : le jour où un second bloc de la page se coupe en trois, il se coupe
 * de la même façon. Il en a d'ailleurs deux usages depuis le 18/08/2026 —
 * « North Star » et « Indicateurs associés ».
 *
 * **La marque est arrivée avec le bloc « Vision produit »** (18/08/2026) : le ★
 * désignait la North Star tant qu'elle titrait le bloc, et il devait la suivre
 * quand elle est devenue une de ses parties. Un ★ écrit dans la chaîne du titre
 * serait lu par la synthèse vocale ; la marque, non — c'est la règle de
 * `BlockHeader`, et la couleur ne porte jamais seule (`docs/06` §11).
 *
 * Le filet reprend le filet du bloc qui le contient, passé en `rule` : sur la
 * surface bleue ce n'est pas le même que sur la pâle, et un séparateur qui ne
 * suivrait pas sa carte se verrait.
 *
 * **La note s'intercale entre le titre et le filet** (18/08/2026, maquette
 * `northstar-v2`) : c'est la place que la maquette lui donne, et elle vaut
 * mieux que la fin de ligne — après le filet, un décompte se lirait comme la
 * légende du rang suivant plutôt que comme celle de l'intertitre. Elle reste
 * dans le flux du texte, jamais en `aria-hidden` : « 3 indicateurs
 * complémentaires » est une information, pas un ornement.
 */
export function BlockDivider({
  mark,
  title,
  note,
  rule,
}: {
  /**
   * Une marque décorative devant le titre — le ★ de la North Star. **Elle sort
   * de l'arbre d'accessibilité**, comme celle de `BlockHeader`.
   */
  mark?: ReactNode;
  title: string;
  /** Un décompte à côté du titre, quand il y a quelque chose à compter. */
  note?: string;
  /** La classe de fond du filet, accordée à la tonalité du bloc. */
  rule: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase text-content-neutral-dark">
        {mark ? <span aria-hidden="true">{mark}</span> : null}
        {title}
      </h3>
      {note ? (
        <p className="text-xs text-content-neutral-dark">{note}</p>
      ) : null}
      <span aria-hidden="true" className={`h-px flex-1 ${rule}`} />
    </div>
  );
}
