/**
 * Les deux états vides — un écran à part entière, jamais un cas d'erreur
 * (règle 5).
 *
 * **Ils sont deux, et ils vivent dans le même fichier** (TD.4) : `EmptyState`
 * est l'état vide **d'écran** — bordure tiretée, titre de rang 2 ou 3, une
 * action ; `BlockNote` est le paragraphe d'absence posé **dans un bloc déjà
 * rempli par ailleurs** — « aucun relevé », « aucune ressource reliée ». Les
 * séparer en deux fichiers aurait fait chercher le second à qui a trouvé le
 * premier, et c'est ainsi que l'un d'eux se réécrit à la main.
 *
 * Au démarrage, tout Vision sera vide : c'est la première impression du
 * produit (docs/06 §9). Un état vide dit donc deux choses et pas une de
 * moins : ce que le bloc contiendra, et le geste qui l'y met. Il ne s'excuse
 * pas, il ne reproche rien, il n'affiche ni alerte ni couleur
 * d'avertissement.
 *
 * Le trait tireté vient des maquettes : il distingue l'attente d'un contenu
 * d'un bloc plein, sans jamais ressembler à une erreur.
 *
 * **`level` existe parce qu'un titre a un rang, et que le rang dépend de
 * l'appelant** (TD.1, défaut relevé en T2.4 et présent depuis T2.2). Un état
 * vide qui remplit un écran est un `h2` sous le `h1` de `PageHeader` ; le même
 * état vide **dans une `Section`** est contenu par le `h2` de `SectionHeader`,
 * et l'écrire `h2` à son tour en faisait un frère de ce qui le contient. La
 * hiérarchie des titres est vérifiée en audit d'accessibilité, et le centre en
 * fait métier (`docs/06` §11).
 */

import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  level = 2,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  /** 2 quand l'état vide est l'écran, 3 quand il est dans une `Section`. */
  level?: 2 | 3;
}) {
  const Heading = level === 3 ? "h3" : "h2";

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-surface-neutral-lighter bg-surface-neutral-pale px-8 py-11 text-center">
      <Heading className="text-lg font-semibold text-content-neutral-darkest">
        {title}
      </Heading>
      <p className="max-w-160 text-sm leading-175 text-content-neutral-dark">
        {description}
      </p>
      {action}
    </div>
  );
}

/**
 * Le paragraphe d'absence dans un bloc — « Aucun relevé pour l'instant »,
 * « Les liens vers les documents s'afficheront ici ».
 *
 * **Un seul exemplaire, après quatorze**, et l'audit du 18/08/2026 en avait
 * relevé **cinq variantes** pour une seule intention : `content-neutral-base`
 * contre `-dark`, trois tailles de texte, avec ou sans marge. La règle 5 dit
 * qu'un état vide est un écran à part entière ; cinq façons de l'écrire est la
 * manière la plus discrète de le traiter comme un reste.
 *
 * **Ce n'est pas `EmptyState`, et le critère entre les deux est le rang.** Un
 * bloc qui n'a que son absence à montrer prend `EmptyState`, qui porte un titre
 * et une action. Un bloc **déjà rempli par ailleurs** — un panneau qui a son
 * en-tête, une section qui a son `SectionHeader` — n'a pas de titre à redonner
 * à son quart vide : il prend celui-ci. Les points d'appel gardent le
 * commentaire qui dit ce choix, que le composant ne peut pas dire à leur place.
 *
 * **`content-neutral-dark`, et c'est une mesure qui l'impose.** Les deux jetons
 * en présence passent sur les deux tonalités où ce paragraphe se rend
 * aujourd'hui — `-base` donne 4,79:1 sur `surface-primary-lightest` et 4,98:1
 * sur `surface-neutral-pale`. Mais `-base` tombe à **3,75:1** sur
 * `surface-primary-lighter`, sous la limite du texte courant, là où `-dark`
 * tient à 6,11:1. Le même paragraphe devant pouvoir tenir sur toute surface de
 * bloc, c'est le jeton qui passe **partout** qui gagne — exactement l'arbitrage
 * qui avait donné sa note à `BlockHeader` (`block.tsx`), et le seul des deux
 * qu'un bloc bleu de demain ne mettra pas en défaut.
 *
 * **Aucune variante de taille.** Une fois les cinq faux positifs de l'audit
 * écartés — le résultat, l'objectif, les participants et le motif d'annulation
 * d'une carte de roadmap ne sont pas des absences, ils sont l'inverse —, il
 * restait **un** point d'appel en `text-xs`. Un composant de socle qui porte une
 * variante à un seul appelant est une variante que le suivant emploiera de
 * travers (doctrine TD.3).
 *
 * **`className` se compose en préfixe, et c'est l'inverse de `Button`.** Les
 * trois seuls points d'appel qui portent une classe lui donnent une marge haute,
 * et tous trois l'écrivent **en tête** de l'attribut servi. En suffixe, deux
 * d'entre eux — qui portaient déjà la variante retenue — auraient vu leur
 * `class` réordonné pour rien. C'est la méthode de `Button` appliquée à
 * d'autres données, avec un résultat opposé : lu dans le HTML servi, pas
 * supposé. Le ternaire, jamais `${className ?? ""}` — TD.1 a mesuré ce que
 * coûte la seconde forme.
 */
const BLOCK_NOTE = "text-sm leading-175 text-content-neutral-dark";

export function BlockNote({
  className,
  children,
}: {
  /** Une marge haute, quand le rythme du bloc la demande. Rien d'autre. */
  className?: string;
  children: ReactNode;
}) {
  return (
    <p className={className ? `${className} ${BLOCK_NOTE}` : BLOCK_NOTE}>
      {children}
    </p>
  );
}
