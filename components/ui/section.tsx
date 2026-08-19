/**
 * La section — le bloc de référence des pages de détail : une surface posée
 * sur le fond de la page, un filet, un rayon.
 *
 * `SectionHeader` accepte une action à droite du titre, parce que la maquette
 * la place là et non en pied de bloc : « ajouter une activité » doit être
 * visible sans avoir à parcourir le contenu (docs/06 §5).
 *
 * Le titre est un `h2` : la hiérarchie des titres est vérifiée en audit
 * d'accessibilité, et le centre en fait métier (docs/06 §11).
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
 * **`basis-full` plutôt qu'un conteneur autour du titre**, et c'est le HTML
 * servi qui l'impose : l'en-tête est déjà une boîte `flex-wrap`, la note y prend
 * donc sa propre ligne sans qu'aucune balise s'ajoute. Envelopper le titre aurait
 * donné un `<div>` de plus aux **trois** appelants qui ne passent pas de note —
 * un écart de rendu sur des écrans que ce ticket ne vise pas. L'écartement
 * vertical est celui du `gap-3` de l'en-tête, et non le `mt-1` de `BlockHeader` :
 * le titre est ici d'un rang au-dessus, et sa note se pose à la distance que le
 * bloc donne déjà à ses lignes.
 * L'arbitrage entre rendre la note et retirer la prop était éditorial — une
 * phrase d'interface relève de qui écrit l'interface —, et il a été tranché
 * avant écriture.
 */

import type { ReactNode } from "react";

export function Section({ children }: { children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-surface-neutral-lighter bg-surface-neutral-pale px-6 py-5">
      {children}
    </section>
  );
}

export function SectionHeader({
  title,
  note,
  action,
}: {
  title: string;
  note?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="flex items-center gap-2 text-xl font-bold text-content-neutral-darkest">{title}</h2>
        {note ? (
          <p className="basis-full max-w-160 text-sm leading-175 text-content-neutral-dark">
            {note}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
