/**
 * La section — le bloc de la page projet : une carte posée sur le fond de la
 * page, un filet, un rayon.
 *
 * `SectionHeader` accepte une action à droite du titre, parce que la maquette
 * la place là et non en pied de bloc : « ajouter une activité » doit être
 * visible sans avoir à parcourir le contenu (docs/06 §5).
 *
 * Le titre est un `h2` : la hiérarchie des titres est vérifiée en audit
 * d'accessibilité, et le centre en fait métier (docs/06 §11).
 *
 * **Le cadre passe au format de `docs/design/maquettes/blocs/project-v2`**
 * (20/08/2026) : rayon `2xl` au lieu de `xl`, `px-7 py-6` au lieu de
 * `px-6 py-5`. C'est le geste qui **referme le point ouvert d'`ETAT.md`** — le
 * 17/08/2026 avait sorti la coquille des blocs de la page produit dans
 * `components/ui/block.tsx` et laissé la page projet sur un cadre plus étroit,
 * en notant que l'arbitrage restait éditorial. La maquette le rend : les deux
 * pages portent désormais des cartes de même rang, et `Section` reste distincte
 * de `Block` par ce qu'elle est — une carte de contenu, non un chapitre
 * (`gap-4` contre `gap-5`, rayon 16 contre 24).
 *
 * **Sans ombre portée** : le design system nomme ses trois élévations sans leur
 * donner de valeur (`tokens.css` §8), et aucun septième substitut ne s'invente
 * (`ETAT.md`). La maquette en pose une de 1 px ; l'écart est celui que
 * `block.tsx` consignait déjà.
 *
 * **La gouttière cède sous `md`** (T7.6) : `px-7` prend 56 px des 375 d'un
 * téléphone, et c'est ce qui faisait déborder la roadmap projet, dont la colonne
 * de titre a un plancher de 220 px. `px-5 py-5` sous le palier, le cadre de la
 * maquette au-dessus. **Le rythme intérieur ne bouge pas** : `gap-4` reste le pas
 * de la carte de contenu à toute largeur — le ticket rend de la largeur, il ne
 * redessine pas.
 *
 * **`id` et `scroll-mt` vont ensemble**, et c'est la barre de sous-navigation
 * qui les demande (`components/projects/subnav.tsx`) : elle est collante, donc
 * une ancre qui viserait le haut exact de la carte la ferait passer dessous.
 * Les 76 px sont ceux de la maquette, et ils s'écrivent par l'échelle —
 * `scroll-mt-19` vaut `19 × --number-4`. Le décalage est inerte partout où
 * aucune ancre ne vise le bloc.
 *
 * **La note se rend depuis TD.4 (19/08/2026), et c'est la correction d'un
 * défaut réel.** La prop était déclarée depuis T2.3 et **n'était affichée nulle
 * part** : `roadmap.tsx` lui passait « Le récit de l'accompagnement, au mois. »
 * depuis toujours, et cette phrase n'était dans aucun HTML servi. TypeScript se
 * taisait, la prop étant déclarée ; seul `npm run lint` le signalait, en unique
 * avertissement permanent du dépôt — et c'est la démonstration que le dépôt
 * s'est faite contre lui-même du principe de TD.6 (c) : *un avertissement
 * permanent est un avertissement qu'on cesse de lire.*
 *
 * **Sous le titre, jamais à côté** : c'est la place que `BlockHeader` lui donne,
 * pour la raison qu'il documente — à côté, elle entre en concurrence avec le
 * titre dès qu'elle dépasse trois mots. Aucun couple de couleurs neuf :
 * `content-neutral-dark` sur `surface-neutral-pale`, 8,12:1.
 *
 * **Le bloc titre est une colonne, et c'est ce qui tient l'action à droite**
 * (21/08/2026). La note prenait sa ligne par `basis-full` dans une boîte
 * `flex-wrap` — aucune balise ne s'ajoutait, l'argument était bon, mais
 * `basis-full` étire le bloc titre à **toute** la largeur disponible : l'action
 * n'avait plus de place sur la première ligne et `flex-wrap` la renvoyait
 * dessous. « Ajouter une activité » se lisait donc **sous** la note, là où
 * `docs/06` §5 la veut en tête de bloc et où la maquette la dessine.
 *
 * `flex-col` empile les deux sans balise de plus non plus, et `flex-1 min-w-0`
 * donne au bloc titre la largeur **restante** plutôt que toute la largeur : la
 * note s'y replie, l'action reste sur la ligne du titre. Le défaut était dans
 * le socle, il est donc corrigé pour les cinq blocs qui portent une note et une
 * action, pas pour la seule roadmap.
 *
 * **`SectionHeader` sait être le `<summary>` d'un `<details>`** (T6.3), comme
 * `BlockDivider` l'a appris le 18/08/2026 pour la page produit. Le besoin est
 * le même — un bloc replié par défaut, sans une ligne de JavaScript —, et le
 * porter ici plutôt que de récrire l'en-tête dans `components/projects/` évite
 * la recopie de signature que TD.3 → TD.6 ont passé six tickets à retirer,
 * **et qu'aucun motif de `socleLock` ne rattrape** : le `h2` du bloc n'a pas de
 * gardien, contrairement au bouton ou à la pastille de statut.
 *
 * Le titre ne change alors ni de contenu ni de rang — seule sa balise
 * enveloppante change, et avec elle le curseur. **Le triangle natif du
 * navigateur disparaît dès que `<summary>` cesse d'être `display: list-item`**,
 * ce que fait `flex` ; la marque de repli se passe donc en `mark`, et se
 * retourne sur `group-open`. Sans cela, un contenu replié n'annoncerait plus
 * qu'il l'est.
 */

import type { ReactNode } from "react";

export function Section({
  id,
  children,
}: {
  /** L'ancre que vise la barre de sous-navigation, quand le bloc en porte une. */
  id?: string;
  children: ReactNode;
}) {
  return (
    <section
      {...(id ? { id } : {})}
      className="flex scroll-mt-19 flex-col gap-4 rounded-2xl border border-surface-neutral-lighter bg-surface-neutral-pale px-5 py-5 md:px-7 md:py-6"
    >
      {children}
    </section>
  );
}

export function SectionHeader({
  mark,
  title,
  note,
  action,
  as = "div",
}: {
  /**
   * Une marque décorative devant le titre — le chevron d'un bloc repliable.
   * **Elle sort de l'arbre d'accessibilité**, comme celle de `BlockHeader` :
   * l'état ouvert ou fermé, c'est `<summary>` qui l'expose, et la couleur ne
   * porte jamais seule (`docs/06` §11).
   */
  mark?: ReactNode;
  title: string;
  note?: string;
  action?: ReactNode;
  /** `summary` quand l'en-tête ouvre et referme le bloc qu'il annonce. */
  as?: "div" | "summary";
}) {
  const Wrapper = as;

  return (
    <Wrapper
      className={
        as === "summary"
          ? /* `list-none` et le pseudo-élément WebKit retirent la puce que
               certains navigateurs laissent malgré `flex` — la parade de
               `BlockDivider`, éprouvée depuis le 18/08/2026. */
            "flex cursor-pointer list-none flex-wrap items-start justify-between gap-3 [&::-webkit-details-marker]:hidden"
          : "flex flex-wrap items-start justify-between gap-3"
      }
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <h2 className="flex items-center gap-2 text-xl font-bold text-content-neutral-darkest">
          {mark ? <span aria-hidden="true">{mark}</span> : null}
          {title}
        </h2>
        {note ? (
          <p className="max-w-160 text-sm leading-175 text-content-neutral-dark">
            {note}
          </p>
        ) : null}
      </div>
      {action}
    </Wrapper>
  );
}
