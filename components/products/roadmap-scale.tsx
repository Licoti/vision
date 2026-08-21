"use client";

/**
 * Le commutateur d'échelle du bloc « Accompagnements » — écrit hors ticket le
 * 21/08/2026, sur la demande « quand on filtre, on ne remonte pas en haut de la
 * page, et l'URL ne change pas : c'est juste un simple filtre ».
 *
 * **Le seul JavaScript du bloc, et il ne calcule rien.** Les préréglages étaient
 * des liens vers `?de=&a=` : chacun était une navigation entière — l'adresse
 * changeait, le défilement repartait en haut, et un panneau ouvert se fermait au
 * passage. Ce composant garde un `useState` et rien d'autre.
 *
 * **Les vues arrivent déjà rendues.** Le serveur dessine une frise par
 * préréglage — « Tout », puis un millésime par année d'histoire — et ce
 * composant monte celle qui est active. Toutes les positions restent donc
 * calculées par `lib/queries/timeline.ts` au rendu serveur, ce qui est la
 * propriété que `roadmap.tsx` revendique depuis T5.5 : ce fichier pose les
 * positions, il ne les calcule pas. C'est aussi ce qui évite d'embarquer ce
 * module — et avec lui le schéma de la base — dans le paquet du navigateur.
 * Le prix est dans la charge de la page, pas dans le DOM : les N vues y sont
 * sérialisées, une seule est montée.
 *
 * **Des boutons, et non plus des liens.** La raison qui imposait le lien — « ils
 * mènent à une autre URL de la même page » — tombe avec l'URL. Un lien sans
 * destination serait un bouton déguisé, et l'assistance l'annoncerait comme une
 * navigation qui n'a pas lieu. `aria-pressed` remplace donc `aria-current` :
 * c'est un groupe de bascule. La couleur ne porte jamais seule (`docs/06` §11).
 *
 * Le composant ne connaît aucun droit et ne porte aucun geste d'écriture : une
 * échelle est un cadrage de lecture.
 */

import { useState, type ReactNode } from "react";

/** Un préréglage : sa clé, son libellé, et la frise déjà rendue par le serveur. */
export type ScalePreset = {
  key: string;
  label: string;
  view: ReactNode;
};

/**
 * Le rendu d'un préréglage, actif ou non.
 *
 * Repris tel quel de la barre de filtre qu'il remplace : aucun couple de
 * couleurs neuf n'entre par ce fichier. L'anneau de focus est celui de tout le
 * produit (`*:focus-visible`, `app/globals.css`).
 */
const presetClass = (active: boolean) =>
  `rounded-md px-3 py-1.5 text-sm font-medium ${
    active
      ? "bg-surface-primary-dark text-content-neutral-pale"
      : "text-content-neutral-dark"
  }`;

export function ScaleSwitch({
  presets,
  initial,
}: {
  /** Au moins un préréglage — « Tout » est toujours du lot. */
  presets: ScalePreset[];
  /** La clé d'ouverture, décidée par le serveur : l'année en cours, ou « Tout ». */
  initial: string;
}) {
  const [active, setActive] = useState(initial);

  /* Le repli protège d'une clé qui ne désignerait plus rien — un préréglage
     disparu entre deux rendus. Sans lui, le bloc se viderait sans le dire. */
  const current = presets.find((preset) => preset.key === active) ?? presets[0];

  return (
    /* Un fragment : `Block` est une colonne à `gap-5`, et deux enfants directs
       y gardent le rythme vertical qu'avaient la barre de filtre et la frise. */
    <>
      <div className="flex flex-wrap items-center gap-3">
        <span
          id="roadmap-scale-label"
          className="text-xs font-semibold uppercase text-content-neutral-base"
        >
          Échelle
        </span>
        {/* Un `group` plutôt qu'une `nav` : ce sont des raccourcis de cadrage
            sur la page courante, pas une destination de navigation. */}
        <div
          role="group"
          aria-labelledby="roadmap-scale-label"
          className="flex flex-wrap gap-0.5 rounded-lg bg-surface-neutral-lightest p-1 border border-surface-neutral-lighter"
        >
          {presets.map((preset) => (
            <button
              key={preset.key}
              type="button"
              aria-pressed={preset.key === current?.key}
              onClick={() => setActive(preset.key)}
              className={presetClass(preset.key === current?.key)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {current?.view}
    </>
  );
}
