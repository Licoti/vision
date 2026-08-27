/**
 * Les liens **déduits** entre projets — les quatre règles de `docs/04` §5.
 *
 * **Rien n'est stocké.** Ce sont des requêtes exécutées à l'affichage, ce qui
 * garantit qu'elles sont toujours vraies : une personne ajoutée à une équipe
 * rapproche deux accompagnements le jour même, sans qu'aucune table n'ait à
 * être tenue à jour. À quinze projets le coût est négligeable — le dire ici
 * évite qu'un ticket futur « optimise » en dénormalisant.
 *
 * Les quatre règles, ordonnées par force :
 *
 * | Règle | Force | Ce qui se lit |
 * |---|---|---|
 * | Même produit | forte | « Même produit » |
 * | Personnes en commun (≥ 2) | moyenne | les personnes, nommées |
 * | Même entité | faible | l'entité, nommée |
 * | Approches communes | faible | les approches, nommées |
 *
 * **La force ordonne la liste ; elle ne se lit pas.** Aucun score, aucune force
 * chiffrée, aucun décompte nu : « 2 personnes en commun » se dit « Camille Roux
 * et Sofia Marchand en commun ». C'est la frontière de D39 appliquée à un lien
 * — ce qui se montre est le **fait** qui rapproche, pas l'indice qui le résume.
 *
 * **Un projet n'apparaît qu'une fois, sous sa règle la plus forte.** Deux
 * accompagnements du même produit partagent presque toujours leur entité et
 * souvent leurs personnes ; les dire trois fois ferait une liste de doublons là
 * où l'on attend une liste de voisins.
 *
 * **Les liens déclarés ne sont pas ici** : `project_links` est la matière de
 * T6.5, et ce module ne la lit pas.
 *
 * Ce module n'importe pas `db` : il reçoit un `ScopedDb` déjà lié au domaine
 * courant. Règle 1. Les lectures joignent, donc elles passent par `joinedRead`
 * — **toute table jointe porte `filter(table)`**, y compris dans les
 * sous-requêtes `exists`.
 *
 * **Les deux jeux de référence sont la frontière du module.** Les personnes et
 * les approches du projet consulté sont lues une fois, par des jointures
 * filtrées sur `persons` et sur `approaches` ; tout le reste ne compare plus que
 * des identifiants déjà confrontés au domaine. C'est ce qui permet à chacun de
 * ces deux `filter()` d'être **éprouvé seul** : un second filtre sur les mêmes
 * tables, plus bas, rattraperait la fuite que le premier laisserait passer, et
 * aucune mise en défaut ne saurait plus dire lequel des deux protège.
 */

import { and, asc, eq, exists, inArray, isNull, ne, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import type { ScopedDb } from "@/lib/db/scoped";
import {
  approaches,
  entities,
  persons,
  products,
  projectApproaches,
  projectMembers,
  projectStatuses,
  projects,
} from "@/lib/db/schema";
import type { ProjectStatusNature } from "@/lib/queries/projects";

/**
 * Les quatre règles, de la plus forte à la plus faible.
 *
 * L'ordre de cette liste **est** la préséance, et il est aussi celui de la
 * liste rendue : le lire ailleurs serait ouvrir une seconde autorité.
 */
const RULES = [
  "same_product",
  "shared_people",
  "same_entity",
  "shared_approaches",
] as const;

export type RelationRule = (typeof RULES)[number];

/**
 * Un voisin du projet consulté — son projet, son produit, son statut, sa
 * période et sa raison en toutes lettres.
 *
 * `rule` sort **pour l'ordre et pour les tests**, jamais pour l'écran : le
 * composant lit `reason`, qui dit le fait. Un écran qui tirerait de `rule` un
 * rang, une couleur ou une pastille de force retomberait dans l'indice calculé
 * que D39 interdit.
 */
export type RelatedProject = {
  id: string;
  name: string;
  /** Le rattachement, affiché **et cliquable** : la hiérarchie reste lisible. */
  productId: string;
  productName: string;
  statusLabel: string;
  statusNature: ProjectStatusNature;
  /** Colonnes `date` : chaînes `YYYY-MM-DD`, formatées par `lib/format`. */
  startedOn: string | null;
  expectedEndOn: string | null;
  rule: RelationRule;
  /** La raison, en toutes lettres. Jamais un chiffre. */
  reason: string;
};

/** L'insécable s'écrit en échappement, jamais en caractère (`lib/journal.ts`). */
const NBSP = "\u00A0";

/** « Camille Roux », « Camille Roux et Sofia Marchand », « A, B et C ». */
const NAMES = new Intl.ListFormat("fr-FR", {
  style: "long",
  type: "conjunction",
});

/**
 * Les quatre formes de phrase — **une par règle, pas une par point d'appel**.
 * C'est la leçon de `lib/journal.ts` : deux raisons voisines composées à deux
 * endroits finissent par ne plus dire la même chose de la même manière.
 *
 * Les trois dernières **nomment** ce qui rapproche, la première non : le nom du
 * produit est déjà sur la ligne, et « Même produit : Espace client web » le
 * dirait deux fois.
 */
export function sameProductReason(): string {
  return "Même produit";
}

export function sharedPeopleReason(names: readonly string[]): string {
  return `${NAMES.format(names)} en commun`;
}

export function sameEntityReason(label: string): string {
  return `Même entité${NBSP}: ${label}`;
}

export function sharedApproachesReason(labels: readonly string[]): string {
  return `Approches communes${NBSP}: ${NAMES.format(labels)}`;
}

/**
 * Le seuil de la règle « personnes en commun », posé par `docs/04` §5.
 *
 * **Il s'écrit deux fois, et c'est le prix de l'arbitrage** : une fois en SQL,
 * qui décide qui est candidat, une fois plus bas, qui décide sous quelle règle.
 * La constante est partagée pour qu'ils ne puissent pas diverger d'un chiffre.
 */
const SHARED_PEOPLE_THRESHOLD = 2;

/**
 * Les voisins du projet consulté, ordonnés par force puis par nom.
 *
 * Rend `[]` sur un identifiant inconnu **comme sur un projet d'un autre
 * domaine** : la distinction n'appartient pas à l'appelant, et l'écran affiche
 * son état vide dans les deux cas.
 *
 * **Les projets archivés sont écartés, et ceux d'un produit archivé avec eux**
 * — la règle des deux listes existantes. Un accompagnement rangé n'est plus un
 * accompagnement affiché : il garde sa page, il ne se propose plus comme
 * voisin. Le projet consulté, lui, garde ses voisins même archivé — la règle 4
 * range, elle ne cache pas.
 *
 * **Aucune borne, aucune pagination, aucun classement.** Le nom départage à
 * force égale, faute de quoi l'ordre varierait d'un affichage à l'autre.
 */
export function listRelatedProjects(
  scope: ScopedDb,
  projectId: string,
): Promise<RelatedProject[]> {
  return scope.joinedRead(async (database, { filter }) => {
    /* ------------------------------------------------------------------
       1. Le projet de référence — son produit, et l'entité de son produit.
       ------------------------------------------------------------------ */
    const referenceRows = await database
      .select({ productId: projects.productId, entityId: products.entityId })
      .from(projects)
      .innerJoin(
        products,
        and(eq(products.id, projects.productId), filter(products)),
      )
      .where(and(eq(projects.id, projectId), filter(projects)))
      .limit(1);

    const reference = referenceRows[0];
    if (!reference) return [];

    /* ------------------------------------------------------------------
       2. Ses personnes et ses approches — **les deux jeux de référence**.

       Les noms et les libellés sortent d'ici, et pas d'une seconde lecture
       plus bas : c'est ce qui fait de ces deux requêtes la seule frontière
       de domaine sur `persons` et sur `approaches`.

       Chacune sort **dans l'ordre où elle se dira** — alphabétique pour les
       personnes, celui du référentiel pour les approches, comme
       `findProjectDetail` — et c'est cet ordre-là que les raisons reprennent
       plus bas. Trier les noms au moment de composer la phrase serait un
       second endroit qui décide de l'ordre.
       ------------------------------------------------------------------ */
    const referencePersons = await database
      .select({ id: persons.id, fullName: persons.fullName })
      .from(projectMembers)
      .innerJoin(
        persons,
        and(eq(persons.id, projectMembers.personId), filter(persons)),
      )
      .where(
        and(filter(projectMembers), eq(projectMembers.projectId, projectId)),
      )
      .orderBy(asc(persons.fullName));

    const referenceApproaches = await database
      .select({ id: approaches.id, label: approaches.label })
      .from(projectApproaches)
      .innerJoin(
        approaches,
        and(eq(approaches.id, projectApproaches.approachId), filter(approaches)),
      )
      .where(
        and(
          filter(projectApproaches),
          eq(projectApproaches.projectId, projectId),
        ),
      )
      .orderBy(asc(approaches.position), asc(approaches.label));

    const referencePersonIds = referencePersons.map((row) => row.id);
    const referenceApproachIds = referenceApproaches.map((row) => row.id);

    /* ------------------------------------------------------------------
       3. Les candidats — le `or` des quatre règles.

       **Les quatre prédicats sont ici, seuil compris** : neutraliser une
       règle se fait à un endroit visible, et la lecture dit ce qu'elle
       cherche plutôt que de ramener le domaine entier pour trier ensuite.

       Les deux `exists` **disparaissent du `or`** quand leur jeu de
       référence est vide : un projet sans équipe ni approche n'a de voisin
       par aucune des deux, et `inArray(colonne, [])` n'est pas une condition
       qu'on veut avoir à interpréter. Le `or` reste non vide dans tous les
       cas — les deux égalités y sont toujours.
       ------------------------------------------------------------------ */
    const rules: SQL[] = [
      eq(projects.productId, reference.productId),
      eq(products.entityId, reference.entityId),
    ];

    if (referencePersonIds.length > 0) {
      /* Le seuil de `docs/04` §5 s'écrit en SQL : **deux** personnes du projet
         consulté, pas une. Sans le `having`, une connaissance en commun
         rapprocherait la moitié du centre. */
      rules.push(
        exists(
          database
            .select({ one: sql`1` })
            .from(projectMembers)
            .where(
              and(
                filter(projectMembers),
                eq(projectMembers.projectId, projects.id),
                inArray(projectMembers.personId, referencePersonIds),
              ),
            )
            .groupBy(projectMembers.projectId)
            .having(sql`count(*) >= ${SHARED_PEOPLE_THRESHOLD}`),
        ),
      );
    }

    if (referenceApproachIds.length > 0) {
      rules.push(
        exists(
          database
            .select({ one: sql`1` })
            .from(projectApproaches)
            .where(
              and(
                filter(projectApproaches),
                eq(projectApproaches.projectId, projects.id),
                inArray(projectApproaches.approachId, referenceApproachIds),
              ),
            ),
        ),
      );
    }

    const candidates = await database
      .select({
        id: projects.id,
        name: projects.name,
        productId: products.id,
        productName: products.name,
        entityId: products.entityId,
        entityLabel: entities.label,
        statusLabel: projectStatuses.label,
        statusNature: projectStatuses.nature,
        startedOn: projects.startedOn,
        expectedEndOn: projects.expectedEndOn,
      })
      .from(projects)
      .innerJoin(
        products,
        and(eq(products.id, projects.productId), filter(products)),
      )
      .innerJoin(
        entities,
        and(eq(entities.id, products.entityId), filter(entities)),
      )
      .innerJoin(
        projectStatuses,
        and(eq(projectStatuses.id, projects.statusId), filter(projectStatuses)),
      )
      .where(
        and(
          filter(projects),
          isNull(projects.archivedAt),
          isNull(products.archivedAt),
          ne(projects.id, projectId),
          // `or` ne rend `undefined` que sans condition : il y en a au moins deux.
          or(...rules)!,
        ),
      );

    if (candidates.length === 0) return [];

    /* ------------------------------------------------------------------
       4. Ce que chaque candidat partage — les identifiants seuls.

       Les noms sont déjà en main : ces deux lectures ne joignent **ni
       `persons` ni `approaches`**, et n'ont donc aucune frontière de domaine
       à tenir au-delà de celle de la table de liaison qu'elles lisent.
       ------------------------------------------------------------------ */
    const ids = candidates.map((row) => row.id);

    const sharedPeople =
      referencePersonIds.length > 0
        ? groupBy(
            await database
              .select({
                projectId: projectMembers.projectId,
                value: projectMembers.personId,
              })
              .from(projectMembers)
              .where(
                and(
                  filter(projectMembers),
                  inArray(projectMembers.projectId, ids),
                  inArray(projectMembers.personId, referencePersonIds),
                ),
              ),
          )
        : new Map<string, Set<string>>();

    const sharedApproaches =
      referenceApproachIds.length > 0
        ? groupBy(
            await database
              .select({
                projectId: projectApproaches.projectId,
                value: projectApproaches.approachId,
              })
              .from(projectApproaches)
              .where(
                and(
                  filter(projectApproaches),
                  inArray(projectApproaches.projectId, ids),
                  inArray(projectApproaches.approachId, referenceApproachIds),
                ),
              ),
          )
        : new Map<string, Set<string>>();

    /* ------------------------------------------------------------------
       5. La préséance — la seule part qui ne soit pas en SQL.
       ------------------------------------------------------------------ */
    const related: RelatedProject[] = [];

    for (const candidate of candidates) {
      /* Les noms se relisent **dans l'ordre du jeu de référence**, jamais dans
         celui que la base a rendu : c'est ce qui fait dire « Alice et Bob »
         plutôt que « Bob et Alice » d'un affichage à l'autre. */
      const people = referencePersons
        .filter((person) => sharedPeople.get(candidate.id)?.has(person.id))
        .map((person) => person.fullName);
      const shared = referenceApproaches
        .filter((approach) => sharedApproaches.get(candidate.id)?.has(approach.id))
        .map((approach) => approach.label);

      const reason: Pick<RelatedProject, "rule" | "reason"> | null =
        candidate.productId === reference.productId
          ? { rule: "same_product", reason: sameProductReason() }
          : people.length >= SHARED_PEOPLE_THRESHOLD
            ? { rule: "shared_people", reason: sharedPeopleReason(people) }
            : candidate.entityId === reference.entityId
              ? {
                  rule: "same_entity",
                  reason: sameEntityReason(candidate.entityLabel),
                }
              : shared.length > 0
                ? {
                    rule: "shared_approaches",
                    reason: sharedApproachesReason(shared),
                  }
                : null;

      /* **Aucune ligne sans raison.** Un candidat que le `or` retient sur une
         seule personne en commun n'atteint pas le seuil et n'a donc rien à
         dire : il sort de la liste plutôt que d'y figurer muet. C'est le seul
         écart entre le jeu que SQL retient et celui que l'écran reçoit. */
      if (!reason) continue;

      related.push({
        id: candidate.id,
        name: candidate.name,
        productId: candidate.productId,
        productName: candidate.productName,
        statusLabel: candidate.statusLabel,
        statusNature: candidate.statusNature,
        startedOn: candidate.startedOn,
        expectedEndOn: candidate.expectedEndOn,
        ...reason,
      });
    }

    return related.sort(
      (left, right) =>
        RULES.indexOf(left.rule) - RULES.indexOf(right.rule) ||
        left.name.localeCompare(right.name, "fr"),
    );
  });
}

/** Regroupe des liaisons par projet — un ensemble d'identifiants par projet. */
function groupBy(
  rows: { projectId: string; value: string }[],
): Map<string, Set<string>> {
  const grouped = new Map<string, Set<string>>();
  for (const row of rows) {
    const values = grouped.get(row.projectId) ?? new Set<string>();
    values.add(row.value);
    grouped.set(row.projectId, values);
  }
  return grouped;
}
