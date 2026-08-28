/**
 * Les tests des gestes de la page Équipe — 28/08/2026.
 *
 * **Le fichier n'existait pas.** `/equipe` portait six actions d'écriture
 * depuis C5bis sans qu'aucune soit interrogée par son point d'entrée : les
 * refus se lisaient dans le rendu, ce que `CLAUDE.md` refuse en toutes lettres
 * — « un panneau absent du rendu n'a jamais protégé le point d'entrée HTTP qui
 * l'accompagne ». Il s'ouvre ici sur la **suppression**, qui est le geste dont
 * l'erreur ne se rattrape pas.
 *
 * **Le décompte en base tranche, jamais un code de retour.** `deletePerson`
 * rend un `ConfirmState` : un refus et un succès se ressemblent, et seule la
 * ligne présente ou absente dit ce qui a eu lieu. Chaque test compte avant et
 * après.
 *
 * **Ce que la fixture doit prouver, elle doit d'abord le porter** : une
 * personne qui n'a rien, une qui est dans une équipe, une qui a participé à une
 * activité, une qui porte des compétences, et une qui a **créé** des lignes.
 * Sans ces cinq-là, un refus juste et un refus universel se ressembleraient.
 *
 * **Le nettoyage ne dépend pas de la réussite du `beforeAll`.** `domainId` est
 * retenu dès la création du domaine, hors de la fixture : un `beforeAll` qui
 * échoue après cette ligne laisse malgré tout un domaine à effacer, et le
 * `if (!f?.domainId) return` des trois fichiers voisins l'abandonnerait — point
 * ouvert d'`ETAT.md`, qui ne gagne pas un quatrième nom.
 */

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import { db } from "@/lib/db/client";
import { forDomain, superAdmin, type ScopedDb } from "@/lib/db/scoped";
import {
  activities,
  activityParticipants,
  activityTypes,
  domains,
  entities,
  events,
  jobs,
  personSkills,
  persons,
  products,
  projectMembers,
  projectStatuses,
  projects,
  skillLevels,
  skills,
} from "@/lib/db/schema";

/** Qui la requête prétend être. Chaque test la pose avant d'appeler l'action. */
let currentPerson: string | null = null;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "vision_person" && currentPerson
        ? { name, value: currentPerson }
        : undefined,
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const { archivePerson, deletePerson } = await import("./actions");

const suffix = Math.random().toString(36).slice(2, 10);

/** Retenu **dès la création**, pour que le nettoyage ne dépende de rien. */
let domainId: string | null = null;

type Fixture = {
  scope: ScopedDb;
  managerId: string;
  memberId: string;
  /** Ne référence rien : c'est elle que le geste doit effacer. */
  orphanId: string;
  /** Membre d'une équipe : les clés `restrict` la retiennent. */
  teamedId: string;
  /** Participante d'une activité : l'autre clé `restrict`. */
  participantId: string;
  /** Deux compétences déclarées, et rien d'autre : elles partent avec elle. */
  skilledId: string;
  projectId: string;
  activityId: string;
};

let f: Fixture;

beforeAll(async () => {
  const domain = await superAdmin.createDomain({
    name: `__test__equipe_actions__${suffix}`,
    competenceCenterName: `Centre ${suffix}`,
  });
  domainId = domain.id;

  const scope = forDomain({ domainId: domain.id });

  const person = (fullName: string, role: "domain_manager" | "member" | null) =>
    scope.insert(persons, {
      fullName,
      source: "manual",
      kind: "center",
      ...(role ? { hasAccess: true, domainRole: role } : { hasAccess: false }),
    });

  const manager = await person(`Responsable ${suffix}`, "domain_manager");
  const member = await person(`Simple membre ${suffix}`, "member");
  const orphan = await person(`Doublon ${suffix}`, null);
  const teamed = await person(`Dans une équipe ${suffix}`, null);
  const participant = await person(`A participé ${suffix}`, null);
  const skilled = await person(`Porte des compétences ${suffix}`, null);

  const entity = await scope.insert(entities, { label: `Entité ${suffix}` });
  const status = await scope.insert(projectStatuses, {
    label: `En cours ${suffix}`,
    nature: "active",
  });
  const product = await scope.insert(products, {
    name: `Produit ${suffix}`,
    entityId: entity.id,
  });
  const project = await scope.insert(projects, {
    name: `Accompagnement ${suffix}`,
    productId: product.id,
    statusId: status.id,
  });
  const activityType = await scope.insert(activityTypes, {
    label: `Atelier ${suffix}`,
    family: "framing",
  });
  const activity = await scope.insert(activities, {
    projectId: project.id,
    activityTypeId: activityType.id,
    state: "planned",
    periodStart: "2026-03-01",
  });

  await scope.insert(projectMembers, {
    projectId: project.id,
    personId: teamed.id,
    isContributor: false,
  });
  await scope.insert(activityParticipants, {
    activityId: activity.id,
    personId: participant.id,
  });

  const level = await scope.insert(skillLevels, {
    label: `Avancé ${suffix}`,
    rank: 3,
  });
  for (const label of [`UX ${suffix}`, `A11y ${suffix}`]) {
    const skill = await scope.insert(skills, { label });
    await scope.insert(personSkills, {
      personId: skilled.id,
      skillId: skill.id,
      levelId: level.id,
    });
  }

  f = {
    scope,
    managerId: manager.id,
    memberId: member.id,
    orphanId: orphan.id,
    teamedId: teamed.id,
    participantId: participant.id,
    skilledId: skilled.id,
    projectId: project.id,
    activityId: activity.id,
  };
}, 180_000);

afterAll(async () => {
  if (!domainId) return;
  const tables = [
    events,
    activityParticipants,
    activities,
    activityTypes,
    personSkills,
    skills,
    skillLevels,
    projectMembers,
    projects,
    projectStatuses,
    products,
    entities,
    jobs,
    persons,
  ];
  for (const table of tables) {
    await db.delete(table).where(eq(table.domainId, domainId));
  }
  await db.delete(domains).where(eq(domains.id, domainId));
});

/** La personne est-elle encore en base ? Le seul verdict qui compte. */
async function exists(personId: string): Promise<boolean> {
  const rows = await db
    .select({ id: persons.id })
    .from(persons)
    .where(eq(persons.id, personId));
  return rows.length === 1;
}

/** Ses compétences déclarées, comptées en base. */
async function skillsOf(personId: string): Promise<number> {
  const rows = await db
    .select({ id: personSkills.id })
    .from(personSkills)
    .where(eq(personSkills.personId, personId));
  return rows.length;
}

/** Une personne neuve, que le test peut effacer sans troubler ses voisins. */
async function freshPerson(label: string) {
  return f.scope.insert(persons, {
    fullName: `${label} ${suffix}`,
    source: "manual",
    kind: "center",
  });
}

describe("deletePerson — ce que le geste refuse", () => {
  test("sans `manageDomain`, rien n'est effacé", async () => {
    const doomed = await freshPerson("Défendue");

    currentPerson = f.memberId;
    const state = await deletePerson(doomed.id, {}, new FormData());

    expect(state.message).toBeDefined();
    expect(state.ok).toBeUndefined();
    // Le décompte tranche : l'état rendu ne prouve rien à lui seul.
    expect(await exists(doomed.id)).toBe(true);
  });

  /* **Le cas « aucune personne courante » n'est pas testé ici, et c'est une
     mesure, pas un oubli** : sans cookie, le stub d'authentification replie sur
     la première personne éligible du premier domaine actif
     (`lib/auth/provider.ts`), et la suppression **réussit**. C'est une propriété
     du stub — documentée, sans échéance depuis que le SSO est sorti de C7 —, pas
     de cette action, et l'éprouver ici ferait croire que ce fichier la couvre.
     Le cas qui prouve quelque chose est celui d'une personne courante réelle
     **sans** `manageDomain`, ci-dessus. */

  /* La première des deux clés `restrict`. Le décompte parle — l'action rend une
     phrase qui dit *ce qui* s'oppose —, la clé étrangère décide. */
  test("une personne dans une équipe n'est pas effacée", async () => {
    currentPerson = f.managerId;
    const state = await deletePerson(f.teamedId, {}, new FormData());

    /* **« équipe » et non « accompagnement »**, et la nuance a été mesurée : en
       neutralisant le décompte, la clé `restrict` refuse quand même et rend
       « rattachée à un accompagnement entre-temps » — une assertion sur
       « accompagnement » passait donc dans les deux cas, et ne disait pas
       lequel des deux refus avait joué. Ce mot-ci n'appartient qu'au décompte. */
    expect(state.message).toContain("équipe");
    expect(state.ok).toBeUndefined();
    expect(await exists(f.teamedId)).toBe(true);
  });

  /* La seconde. Elle est **distincte** : une personne peut avoir participé à
     une activité sans être de l'équipe du projet, et un refus qui ne verrait
     que la première la laisserait passer jusqu'à l'erreur PostgreSQL. */
  test("une participante d'activité n'est pas effacée", async () => {
    currentPerson = f.managerId;
    const state = await deletePerson(f.participantId, {}, new FormData());

    expect(state.message).toContain("activité");
    expect(await exists(f.participantId)).toBe(true);
  });

  test("un identifiant inconnu ne rend qu'une phrase", async () => {
    currentPerson = f.managerId;
    const state = await deletePerson(
      "00000000-0000-4000-8000-000000000000",
      {},
      new FormData(),
    );

    expect(state.message).toBeDefined();
    expect(state.ok).toBeUndefined();
  });

  /* La couche est scopée : une personne d'un autre domaine n'existe pas, elle
     ne « manque » pas. Le refus doit être le même, et la ligne doit rester. */
  test("une personne d'un autre domaine n'est pas effacée", async () => {
    const other = await superAdmin.createDomain({
      name: `__test__equipe_voisin__${suffix}`,
      competenceCenterName: `Voisin ${suffix}`,
    });
    const stranger = await forDomain({ domainId: other.id }).insert(persons, {
      fullName: `Étrangère ${suffix}`,
      source: "manual",
      kind: "center",
    });

    currentPerson = f.managerId;
    const state = await deletePerson(stranger.id, {}, new FormData());

    expect(state.message).toBeDefined();
    expect(await exists(stranger.id)).toBe(true);

    await db.delete(persons).where(eq(persons.domainId, other.id));
    await db.delete(domains).where(inArray(domains.id, [other.id]));
  });
});

describe("deletePerson — ce que le geste écrit", () => {
  test("une personne que rien ne référence est effacée", async () => {
    currentPerson = f.managerId;
    expect(await exists(f.orphanId)).toBe(true);

    const state = await deletePerson(f.orphanId, {}, new FormData());

    expect(state.ok).toBe(true);
    expect(state.message).toBeUndefined();
    expect(await exists(f.orphanId)).toBe(false);
  });

  /* `person_skills` est `on delete cascade` : les compétences déclarées partent
     avec la personne. C'est ce que le panneau annonce, et c'est ici que la
     phrase se vérifie. */
  test("ses compétences déclarées partent avec elle", async () => {
    currentPerson = f.managerId;
    expect(await skillsOf(f.skilledId)).toBe(2);

    const state = await deletePerson(f.skilledId, {}, new FormData());

    expect(state.ok).toBe(true);
    expect(await exists(f.skilledId)).toBe(false);
    expect(await skillsOf(f.skilledId)).toBe(0);
  });

  /* Ranger puis effacer est le chemin naturel : `openPersonForDelete` ne
     regarde pas `archived_at`, à la différence d'`openPerson`. Sans ce test, le
     refus d'`openPerson` reviendrait un jour sans qu'on s'en aperçoive. */
  test("une personne archivée se supprime aussi", async () => {
    currentPerson = f.managerId;
    const doomed = await freshPerson("Rangée puis effacée");
    await archivePerson(doomed.id, {}, new FormData());

    const state = await deletePerson(doomed.id, {}, new FormData());

    expect(state.ok).toBe(true);
    expect(await exists(doomed.id)).toBe(false);
  });

  /**
   * **Ce qu'elle a créé reste, sans son nom.** `created_by` est `on delete set
   * null` sur toutes les tables : la ligne de journal garde sa phrase et perd
   * son auteur. C'est la conséquence la moins visible du geste, et celle que le
   * panneau annonce — donc celle qu'il faut prouver.
   */
  test("ce qu'elle a écrit survit, son nom en moins", async () => {
    const author = await freshPerson("Autrice");

    // La ligne est écrite **en son nom** : c'est le contexte qui pose `actor_id`.
    const authored = forDomain({
      domainId: domainId as string,
      actorId: author.id,
    });
    const trace = await authored.record({
      projectId: f.projectId,
      verb: "updated",
      targetType: "project",
      targetId: f.projectId,
      summary: `Trace de l'autrice ${suffix}`,
    });
    expect(trace.actorId).toBe(author.id);

    currentPerson = f.managerId;
    expect((await deletePerson(author.id, {}, new FormData())).ok).toBe(true);

    const after = await db
      .select({ actorId: events.actorId, summary: events.summary })
      .from(events)
      .where(eq(events.id, trace.id));

    expect(after).toHaveLength(1);
    expect(after[0]?.summary).toBe(`Trace de l'autrice ${suffix}`);
    expect(after[0]?.actorId).toBeNull();
  });
});
