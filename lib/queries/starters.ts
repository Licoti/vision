/**
 * Les lectures du bloc « Démarrage » : ce qu'un designer peut envisager pour
 * ouvrir un accompagnement.
 *
 * Une piste est un **référentiel du domaine** — la même boîte à outils sur tous
 * les accompagnements. C'est ce qui en fait une invitation et non une
 * prescription : rien ici ne regarde le projet, donc rien ne peut lui reprocher
 * ce qu'il n'a pas fait.
 *
 * **Ce module ne calcule rien.** Il rend ce que les lignes portent : un
 * libellé, une phrase, un texte long, une nature, et le nom de l'outil avec son
 * adresse. Aucun décompte — « 3 pistes sur 4 sont engagées » serait exactement
 * l'indice calculé par Vision que D39 interdit, et la jauge de complétion que
 * `docs/06` §10 proscrit.
 *
 * **Une jointure, donc un `joinedRead`**, et la règle du fichier s'y applique
 * sans exception : `starters` et `tools` portent l'une comme l'autre
 * `filter(table)`. Sans le filtre sur `tools`, un `tool_id` pointant l'outil
 * d'un autre domaine en rendrait le nom et l'adresse — la fuite exacte que la
 * troisième lecture de `listProjectRoadmap` a déjà refermée.
 *
 * **Le `on` écarte aussi les outils archivés, et c'est délibéré.** Une lecture
 * qui *décrit* joint les archivés — la roadmap nomme l'outil d'un résultat
 * ancien. Une lecture qui *propose* les écarte : ce bloc propose. Une piste dont
 * l'outil est archivé se lit donc encore, sans lien, plutôt que de disparaître —
 * le texte de la piste reste vrai quand la plateforme ne l'est plus.
 *
 * Ce module n'importe pas `db` : il reçoit un `ScopedDb` déjà lié au domaine
 * courant. Règle 1.
 */

import { and, asc, eq, isNull } from "drizzle-orm";

import type { ScopedDb } from "@/lib/db/scoped";
import { starterKind, starters, tools } from "@/lib/db/schema";

/** `tool` · `method` · `resource`. Dérivé du schéma, jamais réécrit à la main. */
export type StarterKind = (typeof starterKind.enumValues)[number];

/** Une ligne du bloc « Démarrage », et le contenu de son panneau. */
export type DomainStarter = {
  id: string;
  label: string;
  /** La phrase de la carte. Jamais nulle — la colonne l'exige. */
  summary: string;
  /**
   * Le texte long du panneau, ou `null` tant que personne ne l'a écrit. Une
   * piste sans texte long reste une piste : le panneau le dit, il ne le
   * reproche pas.
   */
  guidance: string | null;
  kind: StarterKind;
  /**
   * Le nom de l'outil, ou `null` — trois cas qui se lisent pareil à l'écran :
   * la piste n'a pas d'outil, l'outil est archivé, l'outil appartient à un
   * autre domaine.
   */
  toolName: string | null;
  /**
   * L'adresse de l'outil, ou `null` quand le référentiel n'en porte pas
   * encore. La piste se lit alors, elle ne mène nulle part.
   */
  toolUrl: string | null;
};

/**
 * Les pistes vivantes du domaine, dans l'ordre du référentiel.
 *
 * `position` d'abord, `label` ensuite — l'ordre d'`activity_types`, et la
 * position est écrite par l'amorçage. Ce n'est pas la colonne de rang sans
 * écrivain que le journal du 19/08/2026 proscrit : elle a le sien.
 *
 * Un domaine sans piste rend un tableau vide — l'état vide appartient à
 * l'écran (règle 5).
 */
export async function listStarters(scope: ScopedDb): Promise<DomainStarter[]> {
  return scope.joinedRead(async (database, { filter }) => {
    const rows = await database
      .select({
        id: starters.id,
        label: starters.label,
        summary: starters.summary,
        guidance: starters.guidance,
        kind: starters.kind,
        toolName: tools.name,
        toolUrl: tools.baseUrl,
      })
      .from(starters)
      .leftJoin(
        tools,
        and(
          eq(tools.id, starters.toolId),
          filter(tools),
          isNull(tools.archivedAt),
        ),
      )
      .where(and(filter(starters), isNull(starters.archivedAt)))
      .orderBy(asc(starters.position), asc(starters.label));

    return rows;
  });
}

/**
 * La piste que le panneau détaille, **retrouvée sur une liste déjà lue**.
 *
 * Ce n'est pas une lecture : aucun `ScopedDb`, aucune requête. La page a lu la
 * liste pour son bloc, et le panneau y pointe — aucun écran n'ajoute une
 * requête par carte, la discipline que la page produit tient depuis T5.5.
 *
 * Chercher dans la liste **vivante** est aussi ce qui donne la règle de refus
 * sans l'écrire : une piste archivée n'y est pas, donc son adresse n'ouvre
 * rien.
 */
export function findStarter(
  /* Le paramètre ne s'appelle pas `starters` : ce nom est celui de la table
     importée en tête de fichier, et le masquer rendrait la fonction illisible
     le jour où elle lirait quoi que ce soit. */
  list: readonly DomainStarter[],
  id: string,
): DomainStarter | undefined {
  return list.find((starter) => starter.id === id);
}
