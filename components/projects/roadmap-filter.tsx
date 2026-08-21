"use client";

/**
 * La barre de pastilles de la roadmap et la liste qu'elle filtre (21/08/2026).
 *
 * **Le filtre a quitté l'URL, à la demande.** Il vivait dans `?etat=<clé>`
 * depuis le 20/08/2026, et chaque pastille était un lien : le rendu restait
 * serveur, mais un clic était une navigation, donc un retour en haut de page.
 * Sur un bloc qui vit au milieu d'une page longue, ce saut coûtait plus que ce
 * que l'adresse partageable rapportait.
 *
 * **Trois propriétés sont perdues, et il faut les nommer** : le filtre ne se
 * copie plus, ne se partage plus, ne survit plus au rechargement — et il ne
 * fonctionne plus sans JavaScript. La roadmap, elle, reste **entière et
 * lisible** dans ce dernier cas : ce sont les pastilles qui deviennent inertes,
 * jamais le contenu qui disparaît. Régression assumée, arbitrée avec l'humain
 * et consignée dans `JOURNAL-TECHNIQUE.md`.
 *
 * **Les entrées arrivent déjà rendues.** `Roadmap` reste un composant serveur :
 * il construit ses `<RoadmapEntry>` comme avant, avec leurs actions serveur
 * liées et leurs `DrawerLink`, et les passe ici en `ReactNode` accompagnés de
 * leur clé de groupe. Ce composant ne lit aucune base, ne connaît aucun droit,
 * et ne sait pas ce qu'une entrée contient — il décide seulement laquelle
 * paraît. C'est la règle d'`ActionMenu`, tenue une fois de plus.
 *
 * **Des `<button>`, et non des liens** : ils ne mènent nulle part, et un lien
 * qui ne navigue pas est un mensonge pour qui tabule. `aria-pressed` remplace
 * l'`aria-current="page"` que portait le lien — l'état retenu ne se signale
 * donc pas qu'à la couleur (`docs/06` §11).
 *
 * **Les décomptes ne sont pas un indice** (D39) : « Terminé 2 » compte des
 * faits saisis, il ne qualifie ni le projet ni personne. Aucun total ne dit ce
 * qui « reste à faire », aucune part n'est rapportée à une autre.
 */

import { Fragment, useState, type ReactNode } from "react";

import { BlockNote } from "@/components/ui/empty-state";

import type { RoadmapGroupKey } from "@/lib/queries/activities";

/** Une pastille. `key` à `null` désigne « Toutes », donc le retrait du filtre. */
export type RoadmapChip = {
  key: RoadmapGroupKey | null;
  label: string;
  count: number;
  /** La classe de fond du point coloré, décidée par `Roadmap`. */
  dot: string;
};

/** Une entrée déjà rendue, et le groupe auquel elle appartient. */
export type RoadmapFilterEntry = {
  id: string;
  key: RoadmapGroupKey;
  node: ReactNode;
};

export function RoadmapFilter({
  chips,
  entries,
}: {
  chips: readonly RoadmapChip[];
  entries: readonly RoadmapFilterEntry[];
}) {
  const [state, setState] = useState<RoadmapGroupKey | null>(null);

  /* Le filtre choisit une tranche, il ne réordonne rien : l'ordre reste celui
     de `listProjectRoadmap`, aplati par `Roadmap`. Un ordre calculé par
     l'écran est un ordre qu'aucun test de lecture n'éprouve. */
  const kept = state ? entries.filter((entry) => entry.key === state) : entries;

  return (
    <>
      <ul role="list" className="flex flex-wrap gap-2">
        {chips.map((chip) => {
          const active = chip.key === state;
          return (
            <li key={chip.key ?? "toutes"}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => setState(chip.key)}
                className={[
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium",
                  active
                    ? "border-border-primary-base bg-surface-primary-base text-content-neutral-pale"
                    : "border-surface-neutral-lighter bg-surface-neutral-pale text-content-neutral-dark",
                ].join(" ")}
              >
                {/* Décoratif : le libellé est écrit juste à côté, et la
                    couleur ne porte jamais seule (`docs/06` §11). */}
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 flex-none rounded-full ${chip.dot}`}
                />
                {chip.label}
                <span className="font-bold">{chip.count}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {kept.length > 0 ? (
        /* Les entrées **sont** les `<li>` : `RoadmapEntry` en rend un. Un
           `Fragment` porte donc la clé sans ajouter de balise, et la liste
           reste une liste au sens du HTML servi. */
        <ul role="list" className="flex flex-col">
          {kept.map((entry) => (
            <Fragment key={entry.id}>{entry.node}</Fragment>
          ))}
        </ul>
      ) : (
        /* Un état **filtré** vide, et non l'état vide du bloc : il y a des
           activités, aucune dans cet état. Il dit donc le chemin du retour
           plutôt que le geste de saisie — proposer « Ajouter une activité »
           ici laisserait croire que le filtre a effacé quelque chose. */
        <BlockNote>
          Aucune activité dans cet état pour l&apos;instant.{" "}
          <button
            type="button"
            onClick={() => setState(null)}
            className="text-content-info-base underline"
          >
            Voir toute la roadmap
          </button>
          .
        </BlockNote>
      )}
    </>
  );
}
