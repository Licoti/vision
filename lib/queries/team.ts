/**
 * Les lectures de l'écran Équipe.
 *
 * Elle joint quatre tables, elle passe donc par `joinedRead` — le seul chemin
 * que la couche d'accès ouvre à une jointure. **Toute table jointe porte
 * `filter(table)`** : c'est la condition posée par l'en-tête de `joinedRead`, et
 * un oubli serait une fuite de domaine que rien d'autre ne rattraperait. La
 * leçon que T5.5 a resservie : les filtres de domaine se rattrapent.
 *
 * Ce module n'importe pas `db` : il reçoit un `ScopedDb` déjà lié au domaine
 * courant. Règle 1.
 */

import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";

import type { ScopedDb } from "@/lib/db/scoped";
import {
  jobs,
  personAvailability,
  personKind,
  personSkills,
  persons,
  skillLevels,
  skills,
} from "@/lib/db/schema";

/** Le côté d'où vient la personne — centre de compétence ou entité (docs/04 §2). */
export type PersonKind = (typeof personKind.enumValues)[number];

/**
 * Les trois disponibilités, telles que le schéma les énumère.
 *
 * Exportée d'ici et non du schéma, comme `ProjectStatusNature` l'est de
 * `lib/queries/projects.ts` : la pastille lit le type de la requête qui la
 * nourrit, et non de la table. C'est ce précédent qu'`AvailabilityDot` suit.
 */
export type PersonAvailability = (typeof personAvailability.enumValues)[number];

/**
 * Une compétence portée, avec son niveau.
 *
 * `levelRank` accompagne `levelLabel` parce que c'est lui qui ordonne : le
 * libellé se renomme, le rang non — la règle déjà tenue par la nature d'un
 * statut de projet.
 */
export type TeamSkill = {
  id: string;
  label: string;
  levelLabel: string;
  levelRank: number;
};

/** Une ligne de la liste Équipe — ses quatre colonnes. */
export type TeamMemberRow = {
  id: string;
  fullName: string;
  /** Nul pour qui n'a pas de métier design : une personne hors centre. */
  jobLabel: string | null;
  kind: PersonKind;
  /** Toujours nulle pour un intervenant côté entité (arbitrage (d) de C5bis). */
  availability: PersonAvailability | null;
  skills: TeamSkill[];
};

/**
 * Les personnes du domaine, avec leur métier, leur disponibilité et les
 * compétences qu'elles déclarent.
 *
 * **Le tri est le nom, et rien d'autre** (garde-fou 3) : aucun classement, quel
 * que soit ce que porte le profil. L'identifiant départage deux homonymes, sans
 * quoi l'ordre varierait d'un affichage à l'autre — ce qui serait un défaut.
 *
 * Les personnes archivées sont écartées : l'écran est un référentiel. Elles
 * restent affichées dans l'équipe des accompagnements qu'elles ont menés
 * (arbitrage (e)), et c'est une autre lecture.
 *
 * **Deux lectures fixes, jamais une par personne.** Une seule requête ferait
 * tenir le tout en un aller-retour, au prix d'un `leftJoin` qui multiplierait la
 * ligne de personne autant de fois qu'elle porte de compétences — le motif
 * exact déjà tranché pour les membres d'un projet (`listProjects`) et pour les
 * participants d'une activité (`findProjectActivities`). Le nombre de requêtes
 * ne dépend pas du nombre de personnes.
 *
 * **Les compétences dont le référentiel a été archivé restent affichées** : seul
 * le filtre de domaine porte sur les tables jointes. La personne a déclaré cette
 * compétence ; la retirer de l'écran ferait disparaître ce que l'écran
 * racontait. T5bis.3 écartera les valeurs archivées des **options de filtre**,
 * ce qui n'est pas le même objet — un filtre n'affiche aucun profil.
 */
export function listTeam(scope: ScopedDb): Promise<TeamMemberRow[]> {
  return scope.joinedRead(async (database, { filter }) => {
    // `leftJoin` : `job_id` est facultatif, une personne hors centre n'a pas de
    // métier design (docs/04 §2). Une jointure interne la ferait disparaître.
    const rows = await database
      .select({
        id: persons.id,
        fullName: persons.fullName,
        jobLabel: jobs.label,
        kind: persons.kind,
        availability: persons.availability,
      })
      .from(persons)
      .leftJoin(jobs, and(eq(jobs.id, persons.jobId), filter(jobs)))
      .where(and(filter(persons), isNull(persons.archivedAt)))
      .orderBy(asc(persons.fullName), asc(persons.id));

    if (rows.length === 0) return [];

    const ids = rows.map((row) => row.id);

    /* L'ordre est celui de la fiche de T5bis.4 : rang décroissant, libellé
       départageant. C'est un ordre de lecture **à l'intérieur** d'un profil, et
       jamais un classement entre personnes — le garde-fou 3 porte sur l'ordre
       des personnes, que la requête ci-dessus tient au nom. Deux écrans qui
       montreraient le même profil dans deux ordres seraient un défaut. */
    const skillRows = await database
      .select({
        personId: personSkills.personId,
        id: personSkills.id,
        label: skills.label,
        levelLabel: skillLevels.label,
        levelRank: skillLevels.rank,
      })
      .from(personSkills)
      .innerJoin(skills, and(eq(skills.id, personSkills.skillId), filter(skills)))
      .innerJoin(
        skillLevels,
        and(eq(skillLevels.id, personSkills.levelId), filter(skillLevels)),
      )
      .where(and(filter(personSkills), inArray(personSkills.personId, ids)))
      .orderBy(desc(skillLevels.rank), asc(skills.label));

    const byPerson = new Map<string, TeamSkill[]>();
    for (const row of skillRows) {
      const carried = byPerson.get(row.personId) ?? [];
      carried.push({
        id: row.id,
        label: row.label,
        levelLabel: row.levelLabel,
        levelRank: row.levelRank,
      });
      byPerson.set(row.personId, carried);
    }

    return rows.map((row) => ({
      ...row,
      skills: byPerson.get(row.id) ?? [],
    }));
  });
}
