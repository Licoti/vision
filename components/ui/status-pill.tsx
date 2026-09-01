/**
 * La pastille de statut d'un accompagnement, et le fond des barres de la frise.
 *
 * Elle est colorée par la **nature**, jamais par le libellé : un domaine
 * renomme « En cours », il ne renomme pas `active`. Le libellé est écrit dans
 * la pastille elle-même, si bien que la couleur ne porte jamais seule une
 * information (`docs/06` §11).
 *
 * **Une seule forme pour le statut, partout.** Le point de 8 px qui vivait ici
 * sous le nom de `StatusDot` disait la même chose dans un autre dessin, et la
 * page produit affichait les deux dans deux blocs consécutifs. La pastille est
 * celle que la maquette dessine ; c'est elle qui reste.
 */

import type { ProjectStatusNature } from "@/lib/queries/projects";

/**
 * La table des fonds de barre de la roadmap (`components/products/roadmap.tsx`).
 *
 * **Deux littéraux, et c'est structurel** : Tailwind ne voit que les classes
 * écrites en toutes lettres, et `` `bg-${…}` `` ne produirait aucune règle. Ce
 * que TD.1 a changé n'est donc pas le nombre de tables mais leur **voisinage** —
 * la frise redisait la sienne depuis T5.5, dans un autre fichier, où une couleur
 * pouvait bouger d'un côté seul sans que rien ne le montre. Ici, les deux se
 * lisent d'un même coup d'œil.
 *
 * Elle était en `fill-*` tant que la frise était un SVG. La maquette de la
 * roadmap dessine ses barres en HTML : une barre est un `<div>`, donc un fond.
 *
 * La barre est **décorative** — le statut est écrit en toutes lettres dans la
 * pastille juste à côté (`docs/06` §11).
 */
export const BAND_BG: Record<ProjectStatusNature, string> = {
  framing: "bg-surface-info-base",
  active: "bg-surface-primary-base",
  paused: "bg-surface-neutral-base",
  done: "bg-surface-success-base",
};

/**
 * Les tons de la pastille : un fond teinté, un texte lisible dessus.
 *
 * **Le ton est devenu le vocabulaire, la nature n'en est plus qu'un cas**
 * (01/09/2026). La table était indexée par `ProjectStatusNature` ; le dispositif
 * de mesure a des états déclarés qui n'en sont pas — un outil « partiel », un
 * plan « à revoir » —, et les ranger de force dans `framing` ou `paused` aurait
 * fait dire à un nom d'accompagnement ce qu'il ne dit pas. La table s'indexe
 * donc par **ton**, et `NATURE_TONE` ci-dessous garde la traduction : les cinq
 * écrans qui rendent `StatusPill` n'ont pas bougé d'un caractère.
 *
 * `warning` est le ton neuf, et le seul — les quatre autres portaient déjà les
 * quatre natures.
 *
 * **Les cinq couples sont mesurés** : un texte sur fond teinté est un couple
 * neuf par la position, et le contraste se mesure avant d'être cru.
 * `content-info-dark` sur `surface-info-subtle` 9,17:1 ·
 * `content-primary-dark` sur `surface-primary-lighter` 11,83:1 ·
 * `content-neutral-dark` sur `surface-neutral-lighter` 6,52:1 ·
 * `content-success-dark` sur `surface-success-subtle` 6,42:1 ·
 * `content-warning-darker` sur `surface-warning-subtle` **7,64:1** (01/09/2026).
 *
 * Elle ne s'exporte pas : ses seuls consommateurs sont les deux composants
 * ci-dessous, et une table exportée est une pastille qu'on récrit. `socleLock`
 * garde la signature, celle-ci en garde les couleurs.
 *
 * Les `Record` sont **exhaustifs à la compilation** : le jour où un énuméré
 * s'allonge, ce fichier ne compile plus tant qu'on ne l'a pas complété.
 */
export type PillTone = "info" | "primary" | "neutral" | "success" | "warning";

const PILL: Record<PillTone, string> = {
  info: "bg-surface-info-subtle text-content-info-dark",
  primary: "bg-surface-primary-lighter text-content-primary-dark",
  neutral: "bg-surface-neutral-lighter text-content-neutral-dark",
  success: "bg-surface-success-subtle text-content-success-dark",
  warning: "bg-surface-warning-subtle text-content-warning-darker",
};

/**
 * La traduction d'une nature d'accompagnement en ton.
 *
 * Elle porte ce que la table portait avant le 01/09/2026, et rien de plus : le
 * cadrage est bleu, l'actif est primaire, la pause est neutre, le terminé est
 * vert. Aucune nature ne réclame `warning` — Vision n'alerte sur aucun
 * accompagnement.
 */
const NATURE_TONE: Record<ProjectStatusNature, PillTone> = {
  framing: "info",
  active: "primary",
  paused: "neutral",
  done: "success",
};

const PILL_SHAPE = "flex-none rounded-full px-3 py-0.5 text-xs font-semibold";

/**
 * Un `<span>`, pas un lien : rien ne filtre par statut depuis les cinq écrans
 * qui la rendent, et un faux bouton coûterait un arrêt de tabulation pour rien.
 *
 * `flex-none` est porté par le composant et non par l'appelant : c'est ce qui
 * empêche la colonne de 280 px de la frise de la comprimer, et il est inerte
 * partout où le parent n'est pas un conteneur flex.
 */
export function StatusPill({
  nature,
  label,
}: {
  nature: ProjectStatusNature;
  label: string;
}) {
  return <TonePill tone={NATURE_TONE[nature]} label={label} />;
}

/**
 * La même pastille, pour un état qui n'est pas une nature d'accompagnement.
 *
 * **Le ton est reçu, jamais deviné** : le composant ne connaît ni les états d'un
 * outil de mesure ni ceux d'un plan de taggage, et c'est ce qui lui permet de
 * servir le suivant sans changer. L'appelant tient sa propre traduction, comme
 * `NATURE_TONE` tient la sienne.
 *
 * Le libellé reste **écrit dans la pastille** : ici comme ailleurs, la couleur
 * ne porte jamais seule une information (`docs/06` §11). C'est la raison pour
 * laquelle il n'existe pas de variante sans texte.
 */
export function TonePill({ tone, label }: { tone: PillTone; label: string }) {
  return <span className={`${PILL_SHAPE} ${PILL[tone]}`}>{label}</span>;
}
