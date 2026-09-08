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
 *
 * **T8.3 y ajoute le journal de la personne** — `person`, l'un des dix
 * `target_type` de la migration `0015`. Ses trois lignes sont les **premières du
 * dépôt à ne porter ni `project_id` ni `product_id`** : le cas de niveau
 * domaine que `docs/04` §4 prévoyait depuis T1.2 sans que rien ne l'écrive.
 * Aucun écran ne dira ce point, et c'est le dernier bloc qui le mesure.
 *
 * **La suppression, elle, n'écrit toujours rien**, et ce n'est pas un oubli :
 * aucun `event_verb` ne dit l'effacement, `archived` mentirait, et T8.3
 * s'interdit un sixième verbe. Un constat le fixe plutôt que de le laisser se
 * redécouvrir.
 */

import { eq, inArray, sql } from "drizzle-orm";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from "vitest";

import { SESSION_COOKIE, sealPrincipal } from "@/lib/auth/cookie";
import { db } from "@/lib/db/client";
import {
  asSuperAdmin,
  forDomain,
  withoutAnySession,
  type ScopedDb,
} from "@/lib/db/scoped";
import {
  activities,
  activityParticipants,
  activityTypes,
  domains,
  entities,
  events,
  invitations,
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

/* Une fixture écrit hors de toute session — l'échappée nommée de T9.3. */
const outsideAnySession = asSuperAdmin(withoutAnySession("fixture"));

/**
 * Qui la requête prétend être — **et dans quel domaine** (T9.2).
 *
 * Le cookie du stub portait un identifiant de personne en clair, et le domaine
 * se déduisait ailleurs : `resolveDomainId` rendait « le premier domaine actif,
 * par nom ». C'est le couplage que T8.1 avait nommé sans pouvoir le lever —
 * *rien ne pouvait lui désigner un autre domaine, donc ce fichier dépendait de
 * l'état global de la branche*, et un domaine résiduel faisait tomber 63 tests
 * sur trois fichiers (02/09/2026).
 *
 * Le cookie porte désormais le couple, **scellé par le vrai sceau** — la
 * signature n'est pas simulée, elle est celle du produit. Ce fichier désigne son
 * domaine, et la garde qui vérifiait l'ordre alphabétique a disparu avec sa
 * raison d'être. Le balayage de `vitest.global-setup.ts` reste : il cesse d'être
 * la seule protection, il ne devient pas inutile.
 */
let currentPerson: string | null = null;
let currentDomain: string | null = null;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === SESSION_COOKIE && currentPerson && currentDomain
        ? {
            name,
            value: sealPrincipal({
              kind: "person",
              personId: currentPerson,
              domainId: currentDomain,
            }),
          }
        : undefined,
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const {
  archivePerson,
  createPerson,
  deletePerson,
  grantPersonAccess,
  invitePerson,
  revokeInvitation,
  revokePersonAccess,
  updatePerson,
} = await import("./actions");

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
  const domain = await outsideAnySession.createDomain({
    name: `__test__equipe_actions__${suffix}`,
    competenceCenterName: `Centre ${suffix}`,
  });
  domainId = domain.id;

  currentDomain = domain.id;
  const scope = forDomain({ domainId: domain.id });

  /**
   * **Les deux comptes portent une adresse depuis T9.6**, et ce n'est pas du
   * décor : un compte sans e-mail n'est joignable par aucun fournisseur (règle
   * d'entrée 6), et `grantPersonAccess` le refuse **avant** de regarder le rôle.
   * Sans elles, le test de la rétrogradation du dernier responsable passait pour
   * la mauvaise raison — mesuré par sa mise en défaut, qui ne le faisait pas
   * tomber. Les personnes sans accès n'en portent pas : c'est D19, et c'est ce
   * que le refus « sans adresse » éprouve.
   */
  const person = (fullName: string, role: "domain_manager" | "member" | null) =>
    scope.insert(persons, {
      fullName,
      source: "manual",
      kind: "center",
      ...(role
        ? {
            hasAccess: true,
            domainRole: role,
            email: `${role}.${suffix}@acme.com`,
          }
        : { hasAccess: false }),
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
    /* `invitations` retient `persons` par une clé `restrict` : elle part
       avant. */
    invitations,
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

/**
 * Une personne neuve, que le test peut effacer sans troubler ses voisins.
 *
 * **Deux options depuis T9.6**, et chacune sert un refus : l'adresse, sans
 * laquelle aucun accès ne s'accorde, et le genre, `stakeholder` n'en recevant
 * jamais. Elles sont posées **par la fixture et non par le geste** — ce sont les
 * conditions du test, pas ce qu'il mesure.
 */
async function freshPerson(
  label: string,
  extra: { email?: string; kind?: "center" | "stakeholder" } = {},
) {
  return f.scope.insert(persons, {
    fullName: `${label} ${suffix}`,
    source: "manual",
    kind: extra.kind ?? "center",
    ...(extra.email === undefined ? {} : { email: extra.email }),
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
     mesure, pas un oubli** — mais la raison a changé avec T9.2. Elle était :
     *sans cookie, le stub replie sur la première personne éligible du premier
     domaine actif, et la suppression réussit*. Ce repli n'existe plus — « une
     identité fournie et inéligible est refusée, jamais remplacée », et une
     identité absente ne se remplace pas davantage : `requireSession` redirige
     vers l'écran d'entrée. Le cas est désormais éprouvé **une fois**, là où il
     dit quelque chose de la porte plutôt que de cette action —
     `produits/[id]/actions.test.ts`, avec son étape témoin. Le cas qui prouve
     quelque chose ici reste celui d'une personne courante réelle **sans**
     `manageDomain`, ci-dessus. */

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
    const other = await outsideAnySession.createDomain({
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

/* ==========================================================================
   Le journal de la personne — T8.3
   ========================================================================== */

/**
 * L'insécable de `lib/journal.ts`, **en échappement**.
 *
 * Écrit en caractère, il est indiscernable d'une espace ordinaire dans un
 * fichier source. C'est la forme des deux autres fichiers de tests d'action qui
 * lisent une phrase de journal.
 */
const NBSP = "\u00A0";

type EventRow = {
  verb: string;
  targetType: string;
  targetId: string | null;
  actorId: string | null;
  projectId: string | null;
  productId: string | null;
  summary: string;
};

async function journal(): Promise<EventRow[]> {
  return db
    .select({
      verb: events.verb,
      targetType: events.targetType,
      targetId: events.targetId,
      actorId: events.actorId,
      projectId: events.projectId,
      productId: events.productId,
      summary: events.summary,
    })
    .from(events)
    .where(eq(events.domainId, domainId as string))
    .orderBy(events.occurredAt, events.createdAt);
}

/** Les lignes qu'un geste vient d'écrire — le décompte avant, le décompte après. */
async function traced(gesture: () => Promise<unknown>): Promise<EventRow[]> {
  const before = await journal();
  await gesture();
  return (await journal()).slice(before.length);
}

/** Le formulaire d'une personne, tel qu'une soumission le porte. */
function personForm(overrides: Record<string, string> = {}): FormData {
  const data = new FormData();
  const values: Record<string, string> = {
    fullName: `Camille Roux ${suffix}`,
    email: "",
    jobId: "",
    kind: "center",
    bio: "",
    ...overrides,
  };
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const NO_PERSON_STATE = {
  values: { fullName: "", email: "", jobId: "", kind: "", bio: "" },
  errors: {},
};

/** La ligne créée par le chemin normal, retrouvée par son nom. */
async function personNamed(fullName: string) {
  const rows = await db
    .select({ id: persons.id, fullName: persons.fullName })
    .from(persons)
    .where(eq(persons.fullName, fullName));
  return rows[0] ?? null;
}

describe("le journal de la personne", () => {
  test("la création écrit une ligne, sans projet ni produit", async () => {
    currentPerson = f.managerId;

    const written = await traced(() =>
      createPerson(NO_PERSON_STATE, personForm({ fullName: `Neuve ${suffix}` })),
    );

    expect(written).toHaveLength(1);
    expect(written[0]?.verb).toBe("created");
    expect(written[0]?.targetType).toBe("person");
    expect(written[0]?.actorId).toBe(f.managerId);
    expect(written[0]?.summary).toBe(`Personne créée${NBSP}: Neuve ${suffix}`);

    /* **Le point qu'aucun écran ne dira** : un événement de niveau domaine.
       Une personne existe sans aucun accompagnement (D29), et lui en attribuer
       un serait choisir arbitrairement parmi ceux qu'elle mène. La conséquence
       est voulue — la ligne se rend **sans origine** dans le flux global. */
    expect(written[0]?.projectId).toBeNull();
    expect(written[0]?.productId).toBeNull();

    const created = await personNamed(`Neuve ${suffix}`);
    expect(written[0]?.targetId).toBe(created?.id);
  });

  test("la correction écrit `updated`, avec le nom d'après le geste", async () => {
    currentPerson = f.managerId;
    const target = await freshPerson("Avant renommage");

    const written = await traced(() =>
      updatePerson(
        target.id,
        NO_PERSON_STATE,
        personForm({ fullName: `Après renommage ${suffix}` }),
      ),
    );

    expect(written).toHaveLength(1);
    expect(written[0]?.verb).toBe("updated");
    expect(written[0]?.targetType).toBe("person");
    expect(written[0]?.targetId).toBe(target.id);
    expect(written[0]?.summary).toBe(
      `Personne modifiée${NBSP}: Après renommage ${suffix}`,
    );
    /* Le nom **d'après** : celui d'avant serait la « valeur avant » que D22
       refuse, et une personne renommée reste la même personne. */
    expect(written[0]?.summary).not.toContain("Avant renommage");
  });

  test("le rangement écrit `archived`", async () => {
    currentPerson = f.managerId;
    const target = await freshPerson("À ranger");

    const written = await traced(() =>
      archivePerson(target.id, {}, new FormData()),
    );

    expect(written).toHaveLength(1);
    expect(written[0]?.verb).toBe("archived");
    expect(written[0]?.targetType).toBe("person");
    expect(written[0]?.targetId).toBe(target.id);
    expect(written[0]?.summary).toBe(
      `Personne archivée${NBSP}: À ranger ${suffix}`,
    );
  });

  /**
   * **Le droit s'éprouve par l'action** : un refus n'écrit ni la personne ni sa
   * ligne de journal. Le point d'entrée n'est rendu qu'au responsable de
   * domaine, et ce n'est pas ce qui protège.
   */
  test("un refus n'écrit ni la personne ni l'événement", async () => {
    currentPerson = f.memberId;

    const written = await traced(async () => {
      const state = await createPerson(
        NO_PERSON_STATE,
        personForm({ fullName: `Forgée ${suffix}` }),
      );
      expect(state.message).toBeDefined();
      expect(state.ok).toBeUndefined();
    });

    expect(written).toHaveLength(0);
    expect(await personNamed(`Forgée ${suffix}`)).toBeNull();
  });

  /**
   * **La suppression n'écrit rien, et l'arbitrage est rendu** (T8.3) :
   * `event_verb` n'a aucun verbe qui dise l'effacement, et `archived` ferait
   * dire à la colonne « rangée » d'un geste qui efface. Rien ne l'empêchait
   * techniquement — `events` ne cascade pas sur `persons`, une ligne survivrait
   * anonyme, ce que le test voisin prouve —, et c'est ce qui sépare ce cas de
   * `deleteProject`, à qui la cascade retire jusqu'à la possibilité.
   *
   * **Le jour où un sixième verbe entrera, c'est ce test qui tombera**, et
   * c'est ce qu'on lui demande.
   */
  test("la suppression n'écrit aucune ligne de journal", async () => {
    currentPerson = f.managerId;
    const doomed = await freshPerson("Effacée sans trace");

    const written = await traced(async () => {
      const state = await deletePerson(doomed.id, {}, new FormData());
      expect(state.ok).toBe(true);
    });

    expect(written).toHaveLength(0);
    expect(await exists(doomed.id)).toBe(false);
  });

  /**
   * **La compétence portée n'entre pas au journal**, et ce constat fixe une
   * asymétrie plutôt que de la laisser se découvrir : `person_skills` n'était
   * pas dans la liste des dix objets que la fiche T8.3 autorise. C'est un
   * périmètre, pas un arbitrage — point ouvert d'`ETAT.md`.
   */
  test("poser une compétence n'écrit aucune ligne", async () => {
    currentPerson = f.managerId;

    /* Une personne **neuve** : `f.orphanId` est celle que les tests de
       suppression effacent, et la fixture est partagée. */
    const carrier = await freshPerson("Porteuse de compétence");
    const [skill] = await db
      .select({ id: skills.id })
      .from(skills)
      .where(eq(skills.domainId, domainId as string));
    const [level] = await db
      .select({ id: skillLevels.id })
      .from(skillLevels)
      .where(eq(skillLevels.domainId, domainId as string));

    const written = await traced(async () => {
      await f.scope.insert(personSkills, {
        personId: carrier.id,
        skillId: skill!.id,
        levelId: level!.id,
      });
    });

    expect(written).toHaveLength(0);
  });
});

/* ==========================================================================
   Le compte — T9.6

   **Le décompte en base tranche, jamais le code de retour.** `grantPersonAccess`
   rend un état de formulaire : un refus et une réussite se ressemblent, et seule
   la ligne relue dit ce qui a eu lieu. Chaque test la relit — c'est l'étape
   témoin, et elle n'est pas optionnelle (leçon de T6.1 : un archivage refusé rend
   200, exactement comme celui qui réussit).

   **Le retrait est muet**, et c'est le partage de `removeDomainIdentity` (T9.4) :
   il ne rend rien du tout. Il n'y a donc **que** l'étape témoin pour le juger, ce
   qui est la situation la plus honnête de tout le fichier.
   ========================================================================== */

const NO_ACCESS_STATE = { values: { role: "" }, errors: {} };

/** Le formulaire d'accès, tel qu'une soumission le porte. */
function accessForm(role: string): FormData {
  const data = new FormData();
  data.set("role", role);
  return data;
}

/**
 * Le responsable de la fixture, **rendu à son état** — quoi qu'il vienne de se
 * passer.
 *
 * **C'est une exigence de la mise en défaut, pas une politesse.** Les deux tests
 * du dernier responsable visent l'acteur lui-même : c'est le seul cas où le
 * décompte peut valoir zéro. Garde neutralisée, le geste **réussit** — l'acteur
 * perd `manageDomain`, et les tests suivants tombent en cascade pour une raison
 * qui n'est pas la leur. Le rétablissement précède donc l'assertion : la garde
 * mise en défaut fait tomber **son** test, et rien d'autre.
 */
async function restoreTheManager(): Promise<void> {
  const account = await accountOf(f.managerId);
  if (account?.hasAccess && account.domainRole === "domain_manager") return;

  await db
    .update(persons)
    .set({ hasAccess: true, domainRole: "domain_manager" })
    .where(eq(persons.id, f.managerId));
}

/** Le compte d'une personne, **relu en base** — le seul verdict qui compte. */
async function accountOf(personId: string): Promise<{
  hasAccess: boolean;
  domainRole: string | null;
  email: string | null;
} | null> {
  const rows = await db
    .select({
      hasAccess: persons.hasAccess,
      domainRole: persons.domainRole,
      email: persons.email,
    })
    .from(persons)
    .where(eq(persons.id, personId));
  return rows[0] ?? null;
}

describe("grantPersonAccess — le couple se pose ensemble", () => {
  test("l'accès et le rôle s'écrivent dans la même ligne", async () => {
    currentPerson = f.managerId;
    const target = await freshPerson("À doter", {
      email: `a.doter.${suffix}@acme.com`,
    });

    /* L'étape témoin **avant** : sans elle, un accès qui existait déjà se
       confondrait avec un accès accordé. */
    expect(await accountOf(target.id)).toMatchObject({
      hasAccess: false,
      domainRole: null,
    });

    const state = await grantPersonAccess(
      target.id,
      NO_ACCESS_STATE,
      accessForm("member"),
    );

    expect(state.ok).toBe(true);
    expect(state.message).toBeUndefined();
    expect(await accountOf(target.id)).toMatchObject({
      hasAccess: true,
      domainRole: "member",
    });
  });

  test("le rôle se change par le même point d'entrée", async () => {
    currentPerson = f.managerId;
    const target = await freshPerson("À promouvoir", {
      email: `a.promouvoir.${suffix}@acme.com`,
    });

    await grantPersonAccess(target.id, NO_ACCESS_STATE, accessForm("member"));
    const promoted = await grantPersonAccess(
      target.id,
      NO_ACCESS_STATE,
      accessForm("domain_manager"),
    );

    expect(promoted.ok).toBe(true);
    expect(await accountOf(target.id)).toMatchObject({
      hasAccess: true,
      domainRole: "domain_manager",
    });

    /* **La fixture est rendue à son état**, et ce n'est pas de la politesse :
       les deux tests du dernier responsable, plus bas, mesurent un domaine où
       `f.managerId` est le **seul** à gérer. Un second responsable laissé
       derrière les ferait passer pour de mauvaises raisons. */
    await grantPersonAccess(target.id, NO_ACCESS_STATE, accessForm("member"));
    await revokePersonAccess(target.id);
    expect(await accountOf(target.id)).toMatchObject({ hasAccess: false });
  });

  /**
   * **La contrainte est réelle, et ce test est ce qui le dit.** Le couple ne tient
   * pas par la discipline de l'action : `persons_role_requires_access` refuse en
   * base *accès sans rôle* et *rôle sans accès*. Sans cette mesure, « les deux
   * s'écrivent ensemble » ne serait qu'une convention de l'appelant.
   */
  test("la base refuse une moitié du couple, écrite hors du geste", async () => {
    const target = await freshPerson("Moitié de couple");

    await expect(
      f.scope.update(persons, target.id, { hasAccess: true }),
    ).rejects.toThrow();
    await expect(
      f.scope.update(persons, target.id, { domainRole: "member" }),
    ).rejects.toThrow();

    expect(await accountOf(target.id)).toMatchObject({
      hasAccess: false,
      domainRole: null,
    });
  });

  test("sans `manageDomain`, aucun accès n'est accordé", async () => {
    const target = await freshPerson("Défendue au compte", {
      email: `defendue.${suffix}@acme.com`,
    });

    currentPerson = f.memberId;
    const state = await grantPersonAccess(
      target.id,
      NO_ACCESS_STATE,
      accessForm("domain_manager"),
    );

    expect(state.message).toBeDefined();
    expect(state.ok).toBeUndefined();
    expect(await accountOf(target.id)).toMatchObject({ hasAccess: false });
  });

  test("un rôle hors énuméré n'écrit rien, et rend une erreur de champ", async () => {
    currentPerson = f.managerId;
    const target = await freshPerson("Rôle forgé", {
      email: `role.forge.${suffix}@acme.com`,
    });

    /* Une soumission forgée porte ce qu'elle veut. `super_admin` n'est pas un
       rôle de domaine et ne peut pas en être un (arbitrage (4)) : ce qui doit
       revenir est un message **sous le champ**, jamais un 500. */
    const state = await grantPersonAccess(
      target.id,
      NO_ACCESS_STATE,
      accessForm("super_admin"),
    );

    expect(state.errors.role).toBeDefined();
    expect(state.ok).toBeUndefined();
    expect(await accountOf(target.id)).toMatchObject({ hasAccess: false });
  });
});

/**
 * Quelle contrainte a refusé cette écriture ?
 *
 * **Un `toThrow()` nu passe pour n'importe quelle levée** — une colonne
 * manquante, un réseau coupé — et cesse alors de dire ce qu'il prétend dire.
 * Le nom de la contrainte, lui, ne peut venir que d'elle. Il vit dans la
 * **cause** : `drizzle` enveloppe la levée du pilote dans un « Failed query »,
 * si bien que le message ne le porte pas.
 */
async function refusedBy(write: Promise<unknown>): Promise<string | undefined> {
  try {
    await write;
    return undefined;
  } catch (error) {
    return (error as { cause?: { constraint?: string } }).cause?.constraint;
  }
}

describe("grantPersonAccess — les refus, éprouvés séparément", () => {
  /**
   * **Garde-fou 1** — `docs/05` §4 exclut *« l'accès des commanditaires côté
   * entité »*, décidé en F1 (D2). Le refus est dans l'action : la fiche d'un
   * `stakeholder` n'affiche aucun point d'entrée d'accès, et un point d'entrée
   * absent du rendu n'a jamais protégé le point d'entrée HTTP qui l'accompagne.
   */
  test("un intervenant côté entité ne reçoit jamais d'accès", async () => {
    currentPerson = f.managerId;
    const target = await freshPerson("Côté entité", {
      kind: "stakeholder",
      email: `cote.entite.${suffix}@acme.com`,
    });

    const state = await grantPersonAccess(
      target.id,
      NO_ACCESS_STATE,
      accessForm("member"),
    );

    expect(state.message).toBeDefined();
    expect(await accountOf(target.id)).toMatchObject({
      hasAccess: false,
      domainRole: null,
    });
  });

  /**
   * **Garde-fou 3** — `loadSession` refuse déjà une personne archivée ; lui
   * accorder un accès qu'elle ne pourra pas exercer serait écrire une
   * contradiction en base.
   *
   * **Ce refus vient d'`openPerson`, partagé avec la correction de profil et les
   * compétences** : le neutraliser fait tomber les tests de cette **même** règle
   * sur les trois gestes, ce qui est une règle mise en défaut une fois, pas trois
   * règles. Le fait est écrit plutôt que découvert.
   */
  test("une personne archivée ne reçoit pas d'accès", async () => {
    currentPerson = f.managerId;
    const target = await freshPerson("Rangée puis dotée", {
      email: `rangee.${suffix}@acme.com`,
    });
    await f.scope.archive(persons, target.id);

    const state = await grantPersonAccess(
      target.id,
      NO_ACCESS_STATE,
      accessForm("member"),
    );

    expect(state.message).toBeDefined();
    expect(await accountOf(target.id)).toMatchObject({ hasAccess: false });
  });

  /**
   * **Le geste 1 tenu par le geste 2** : la règle d'entrée 6 rapproche l'identité
   * sur l'e-mail au premier passage (`lib/auth/entry.ts`). Un accès accordé à qui
   * n'a pas d'adresse ne servirait à personne — et **c'est cette mesure que
   * l'e-mail retiré du formulaire fait tomber**, aucune autre.
   */
  test("sans adresse e-mail, l'accès est refusé", async () => {
    currentPerson = f.managerId;
    const target = await freshPerson("Sans adresse");

    const state = await grantPersonAccess(
      target.id,
      NO_ACCESS_STATE,
      accessForm("member"),
    );

    expect(state.message).toBeDefined();
    expect(await accountOf(target.id)).toMatchObject({
      hasAccess: false,
      email: null,
    });
  });

  /**
   * **Le quatrième refus** (arbitrage du 07/09/2026) : `findPerson` rapproche
   * l'e-mail en `limit 1` **sans ordre**, si bien que deux personnes portant la
   * même adresse rendraient un rapprochement arbitraire — l'une se connecterait
   * sous l'identité de l'autre. Aucune contrainte de base ne l'interdit ; ce refus
   * est ce qui tient la promesse en attendant qu'une unicité s'autorise.
   */
  /**
   * **Ce refus a changé de gardien, et les deux tests qui l'éprouvaient ne
   * peuvent plus s'écrire.**
   *
   * T9.6 comptait les jumelles dans l'action, `ETAT.md` notant en regard que
   * *« rien n'interdit en base deux adresses identiques dans un domaine »*, avec
   * pour destination *« le jour où une contrainte s'autorise »*. T11.1 est ce
   * jour : `persons_domain_email_unique` porte sur `(domain_id, lower(email))`,
   * **sans clause partielle**, donc archivées comprises.
   *
   * **La conséquence est que l'état qu'on refusait ne peut plus naître.** Les
   * deux fixtures d'alors — deux jumelles vivantes, une jumelle rangée et une
   * vivante — sont refusées par la base **avant** d'atteindre l'action. Le
   * `twins > 0` de `grantPersonAccess` ne peut donc plus valoir vrai : c'est un
   * contrôle **inatteignable**, conservé comme filet sur décision humaine du
   * 08/09/2026, et **aucun test ne peut plus l'exercer**. Le fait est consigné
   * au journal technique plutôt que masqué par un test qui feindrait de le
   * couvrir.
   *
   * **La propriété, elle, n'est pas perdue — elle a trois lecteurs** : les deux
   * cas de l'index dans `lib/db/scoped.test.ts` (vivante et archivée), et les
   * trois cas du formulaire en bas de ce fichier, où la garde rend un message
   * là où la base rendait une levée.
   */
  test("une adresse déjà portée ne peut plus naître, donc l'accès n'a plus à la refuser", async () => {
    currentPerson = f.managerId;
    const shared = `jumelle.${suffix}@acme.com`;

    const first = await freshPerson("Première jumelle", { email: shared });

    /* Le refus est **en base**, et il tombe avant l'action : c'est ce que ce
       test constate, et c'est ce qui rend le contrôle de l'action mort. */
    expect(await refusedBy(freshPerson("Seconde jumelle", { email: shared }))).toBe(
      "persons_domain_email_unique",
    );

    /* **Et il tient sur une jumelle archivée**, parce que le rapprochement la
       lit — `findPerson` passe `includeArchived: true`. Un index partiel aurait
       laissé passer exactement le cas qu'il prétend fermer. */
    await f.scope.archive(persons, first.id);
    expect(await refusedBy(freshPerson("Jumelle d'après", { email: shared }))).toBe(
      "persons_domain_email_unique",
    );

    /* **Le décompte en base tranche** : une seule ligne porte l'adresse, et
       elle n'a pas d'accès — le geste n'a jamais eu lieu. */
    const twins = await f.scope.count(persons, {
      where: sql`lower(${persons.email}) = lower(${shared})`,
      includeArchived: true,
    });
    expect(twins).toBe(1);
    expect(await accountOf(first.id)).toMatchObject({ hasAccess: false });
  });

  /**
   * **Garde-fou 2** — sans responsable, le domaine deviendrait inadministrable, et
   * **rien dans Vision ne permettrait de le rouvrir** : le super administrateur
   * crée des domaines, il n'entre pas dedans.
   *
   * Le décompte porte sur **les autres**, et qui exerce ce geste est
   * nécessairement un responsable vivant : il ne peut donc valoir zéro que
   * lorsque la cible est l'acteur lui-même — exactement le cas mesuré ici.
   */
  test("le dernier responsable ne se rétrograde pas", async () => {
    currentPerson = f.managerId;

    const state = await grantPersonAccess(
      f.managerId,
      NO_ACCESS_STATE,
      accessForm("member"),
    );
    const after = await accountOf(f.managerId);
    await restoreTheManager();

    expect(state.message).toBeDefined();
    expect(state.ok).toBeUndefined();
    expect(after).toMatchObject({
      hasAccess: true,
      domainRole: "domain_manager",
    });
  });
});

describe("revokePersonAccess — muet, et mesuré en base", () => {
  test("l'accès et le rôle tombent dans la même ligne", async () => {
    currentPerson = f.managerId;
    const target = await freshPerson("À retirer", {
      email: `a.retirer.${suffix}@acme.com`,
    });
    await grantPersonAccess(target.id, NO_ACCESS_STATE, accessForm("member"));
    expect(await accountOf(target.id)).toMatchObject({ hasAccess: true });

    await revokePersonAccess(target.id);

    expect(await accountOf(target.id)).toMatchObject({
      hasAccess: false,
      domainRole: null,
    });
  });

  test("sans `manageDomain`, rien n'est retiré", async () => {
    currentPerson = f.managerId;
    const target = await freshPerson("Retrait défendu", {
      email: `retrait.defendu.${suffix}@acme.com`,
    });
    await grantPersonAccess(target.id, NO_ACCESS_STATE, accessForm("member"));

    currentPerson = f.memberId;
    await revokePersonAccess(target.id);

    /* Le geste est muet : il n'y a **que** l'étape témoin pour le juger. */
    expect(await accountOf(target.id)).toMatchObject({
      hasAccess: true,
      domainRole: "member",
    });

    currentPerson = f.managerId;
    await revokePersonAccess(target.id);
  });

  test("le dernier responsable ne se retire pas", async () => {
    currentPerson = f.managerId;

    await revokePersonAccess(f.managerId);
    const after = await accountOf(f.managerId);
    await restoreTheManager();

    expect(after).toMatchObject({
      hasAccess: true,
      domainRole: "domain_manager",
    });
  });

  /**
   * **Une ligne rangée qui garde un accès est la contradiction qu'on veut pouvoir
   * corriger** : la porte du retrait ne regarde donc pas l'archivage, à rebours de
   * celle de l'accord. C'est l'argument d'`openPersonIgnoringArchive`, déjà écrit
   * pour la suppression.
   */
  test("une personne archivée peut perdre son accès", async () => {
    currentPerson = f.managerId;
    const target = await freshPerson("Rangée avec accès", {
      email: `rangee.avec.acces.${suffix}@acme.com`,
    });
    await grantPersonAccess(target.id, NO_ACCESS_STATE, accessForm("member"));
    await f.scope.archive(persons, target.id);

    await revokePersonAccess(target.id);

    expect(await accountOf(target.id)).toMatchObject({
      hasAccess: false,
      domainRole: null,
    });
  });
});

/**
 * **La boucle entière, et c'est le critère qui compte** (mesure 4 de la fiche) :
 * les autres mesures prouvent que le ticket ne casse rien, celle-ci prouve qu'il
 * sert à quelque chose.
 *
 * `listAccounts` est ce que `/dev/session` propose et ce que `resolveAccount`
 * interroge : une personne qui y paraît **pourrait se connecter**. Avant T9.6,
 * aucune personne créée par l'écran n'y entrait jamais — `createPerson` forçait
 * `hasAccess: false`, définitivement.
 */
describe("la boucle du compte", () => {
  test("créée par l'écran avec une adresse, elle entre dans `listAccounts`", async () => {
    currentPerson = f.managerId;
    const fullName = `Nouvelle recrue ${suffix}`;
    const email = `nouvelle.recrue.${suffix}@acme.com`;

    const created = await createPerson(
      NO_PERSON_STATE,
      personForm({ fullName, email }),
    );
    expect(created.ok).toBe(true);

    const row = await personNamed(fullName);
    expect(row).not.toBeNull();

    /* **Le point de départ, mesuré** : créée, elle n'est pas un compte. D19
       sépare *être référencé* de *pouvoir se connecter*, et la création ne
       l'enfreint pas. */
    const { listAccounts } = await import("@/lib/auth/session");
    expect(
      (await listAccounts(domainId as string)).map((one) => one.id),
    ).not.toContain(row!.id);

    const granted = await grantPersonAccess(
      row!.id,
      NO_ACCESS_STATE,
      accessForm("member"),
    );
    expect(granted.ok).toBe(true);

    const accounts = await listAccounts(domainId as string);
    expect(accounts.map((one) => one.id)).toContain(row!.id);
    expect(accounts.find((one) => one.id === row!.id)).toMatchObject({
      fullName,
      email,
      role: "member",
    });

    /* Et le geste se défait : elle sort de la liste comme elle y est entrée. */
    await revokePersonAccess(row!.id);
    expect(
      (await listAccounts(domainId as string)).map((one) => one.id),
    ).not.toContain(row!.id);
  });
});

describe("le journal du compte", () => {
  test("accorder écrit `state_changed`, avec le rôle dans la phrase", async () => {
    currentPerson = f.managerId;
    const target = await freshPerson("Tracée à l'accord", {
      email: `tracee.accord.${suffix}@acme.com`,
    });

    const written = await traced(() =>
      grantPersonAccess(target.id, NO_ACCESS_STATE, accessForm("member")),
    );

    expect(written).toHaveLength(1);
    /* **Aucun sixième verbe** : `state_changed` est celui des cinq qui nomme un
       état atteint, et l'ajouter à l'énuméré serait une migration — signal
       d'arrêt des interdits communs de C9. */
    expect(written[0]?.verb).toBe("state_changed");
    expect(written[0]?.targetType).toBe("person");
    expect(written[0]?.targetId).toBe(target.id);
    expect(written[0]?.actorId).toBe(f.managerId);
    expect(written[0]?.summary).toBe(
      `Accès accordé${NBSP}: Tracée à l'accord ${suffix}${NBSP}— membre`,
    );
    /* Un événement de niveau **domaine**, comme les trois autres de la personne. */
    expect(written[0]?.projectId).toBeNull();
    expect(written[0]?.productId).toBeNull();
  });

  test("retirer écrit `state_changed`, sans nommer de rôle", async () => {
    currentPerson = f.managerId;
    const target = await freshPerson("Tracée au retrait", {
      email: `tracee.retrait.${suffix}@acme.com`,
    });
    await grantPersonAccess(target.id, NO_ACCESS_STATE, accessForm("member"));

    const written = await traced(() => revokePersonAccess(target.id));

    expect(written).toHaveLength(1);
    expect(written[0]?.verb).toBe("state_changed");
    expect(written[0]?.summary).toBe(
      `Accès retiré${NBSP}: Tracée au retrait ${suffix}`,
    );
    expect(written[0]?.summary).not.toContain("membre");
  });

  /**
   * **Un refus n'écrit pas de trace**, et c'est la même discipline que sur la
   * création : une ligne de journal qui raconterait un fait qui n'a pas eu lieu
   * serait pire qu'aucune ligne.
   *
   * **Le refus éprouvé ici est celui du droit, et ce choix est délibéré** : les
   * trois garde-fous ont chacun **un** test, et un seul, pour que leur mise en
   * défaut n'en fasse tomber qu'un. Rejouer l'un d'eux ici lui aurait donné un
   * second témoin, et « exactement son test, et rien d'autre » aurait cessé
   * d'être vrai.
   */
  test("un refus n'écrit aucune ligne", async () => {
    currentPerson = f.managerId;
    const target = await freshPerson("Refusée sans trace", {
      email: `refusee.${suffix}@acme.com`,
    });

    currentPerson = f.memberId;
    const written = await traced(async () => {
      const state = await grantPersonAccess(
        target.id,
        NO_ACCESS_STATE,
        accessForm("member"),
      );
      expect(state.message).toBeDefined();
    });

    expect(written).toHaveLength(0);
    expect(await accountOf(target.id)).toMatchObject({ hasAccess: false });
  });

  /**
   * **Le geste sans objet n'écrit rien non plus** : retirer un accès qui n'existe
   * pas n'est pas un fait, et `revokePersonAccess` s'arrête avant d'écrire.
   */
  test("retirer un accès inexistant n'écrit aucune ligne", async () => {
    currentPerson = f.managerId;
    const target = await freshPerson("Sans accès à retirer");

    const written = await traced(() => revokePersonAccess(target.id));

    expect(written).toHaveLength(0);
  });
});

/* ==========================================================================
   L'adresse en double — le formulaire, pas seulement l'action
   ========================================================================== */

/**
 * **Mesure du défaut, avant sa réparation.**
 *
 * `persons_domain_email_unique` (T11.1) referme en base ce que T9.6 refusait
 * dans l'action. Le gain est réel, et il a un prix qu'aucune lecture de code ne
 * dispense de constater : `createPerson` et `updatePerson` écrivent l'adresse
 * sans garde, et `scopeRefusal` n'attrape que `DomainScopeError` — il **relève**
 * tout le reste. Une adresse en double saisie au formulaire cessait donc de
 * rendre un message pour rendre une erreur non rattrapée.
 *
 * Ce bloc est écrit dans cet ordre : le défaut d'abord, mesuré, puis la garde.
 */
describe("l'adresse en double se refuse au formulaire", () => {
  test("une seconde saisie de la même adresse rend un message, jamais une levée", async () => {
    currentPerson = f.managerId;
    const shared = `saisie.doublon.${suffix}@acme.com`;

    const first = await createPerson(
      NO_PERSON_STATE,
      personForm({ fullName: `Saisie une ${suffix}`, email: shared }),
    );
    expect(first.ok).toBe(true);

    /* **La casse ne sauve pas** : l'index porte sur `lower(email)`, et la garde
       doit lire du même côté — sans quoi elle laisserait passer ce que la base
       refuse, et le message redeviendrait une levée. */
    const second = await createPerson(
      NO_PERSON_STATE,
      personForm({
        fullName: `Saisie deux ${suffix}`,
        email: shared.toUpperCase(),
      }),
    );
    expect(second.ok).toBeUndefined();
    expect(second.message).toBeDefined();

    /* **Le décompte en base tranche**, jamais le retour de l'action : une
       seconde ligne écrite puis annoncée refusée serait le pire des deux. */
    const twins = await f.scope.count(persons, {
      where: sql`lower(${persons.email}) = lower(${shared})`,
      includeArchived: true,
    });
    expect(twins).toBe(1);
  });

  test("la correction d'une personne vers une adresse déjà prise rend un message", async () => {
    currentPerson = f.managerId;
    const taken = `correction.prise.${suffix}@acme.com`;
    await freshPerson("Porteuse", { email: taken });
    const other = await freshPerson("Corrigée");

    const state = await updatePerson(
      other.id,
      NO_PERSON_STATE,
      personForm({ fullName: `Corrigée ${suffix}`, email: taken }),
    );

    expect(state.ok).toBeUndefined();
    expect(state.message).toBeDefined();
    expect((await f.scope.find(persons, other.id))?.email).toBeNull();
  });

  test("garder sa propre adresse n'est pas un doublon", async () => {
    currentPerson = f.managerId;
    const own = `sienne.${suffix}@acme.com`;
    const person = await freshPerson("Sienne", { email: own });

    /* **La garde compte les *autres*, jamais soi-même** — c'est la forme du
       décompte des responsables, resservie. Sans le `ne(persons.id, …)`, une
       personne ne pourrait plus corriger son nom sans changer son adresse. */
    const state = await updatePerson(
      person.id,
      NO_PERSON_STATE,
      personForm({ fullName: `Sienne corrigée ${suffix}`, email: own }),
    );

    expect(state.ok).toBe(true);
    expect((await f.scope.find(persons, person.id))?.fullName).toBe(
      `Sienne corrigée ${suffix}`,
    );
  });
});

/* ==========================================================================
   L'invitation — T11.2

   **Ce qui se mesure ici est le geste, jamais son acceptation** : celle-ci vit
   dans `lib/auth/invitation.test.ts`, sur claims forgés et sans écran. La
   frontière est celle du chantier — l'action promet un accès, le rappel du
   fournisseur le pose.

   **`invitePerson` n'écrit pas `has_access`**, et c'est la propriété que chaque
   cas revérifie en base : c'est toute la différence avec `grantPersonAccess`,
   qui ne bouge pas (arbitrage (6)).
   ========================================================================== */

const NO_INVITATION_STATE = { values: { role: "" }, errors: {} };

/** Le formulaire d'invitation, tel qu'une soumission le porte. */
function inviteForm(role: string): FormData {
  const data = new FormData();
  data.set("role", role);
  return data;
}

/** Les invitations **vivantes** d'une personne — la condition de l'index. */
async function pendingOf(personId: string) {
  return f.scope.list(invitations, {
    where: sql`${invitations.personId} = ${personId} and ${invitations.acceptedAt} is null and ${invitations.revokedAt} is null`,
  });
}

/** Toutes ses lignes, vivantes ou refermées : une trace ne s'efface pas. */
async function allInvitationsOf(personId: string) {
  return f.scope.list(invitations, {
    where: eq(invitations.personId, personId),
  });
}

describe("invitePerson — ce que le geste écrit, et ce qu'il ne touche pas", () => {
  test("une ligne, un lien rendu une fois, et aucun accès ouvert", async () => {
    currentPerson = f.managerId;
    const target = await freshPerson("À inviter", {
      email: `a.inviter.${suffix}@acme.com`,
    });

    /* Étape témoin : sans elle, un état rendu ne prouve rien. */
    expect(await accountOf(target.id)).toMatchObject({
      hasAccess: false,
      domainRole: null,
    });
    expect(await pendingOf(target.id)).toHaveLength(0);

    const state = await invitePerson(
      target.id,
      NO_INVITATION_STATE,
      inviteForm("member"),
    );

    expect(state.message).toBeUndefined();
    expect(state.link).toContain("/invitation/");

    /* **L'accès n'est pas ouvert**, et c'est l'arbitrage (9) : un accès qui n'a
       jamais servi n'existe pas. Il se posera à l'acceptation. */
    expect(await accountOf(target.id)).toMatchObject({
      hasAccess: false,
      domainRole: null,
    });

    const rows = await pendingOf(target.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ role: "member", sentAt: null });
    /* **L'adresse est copiée**, pas jointe : c'est elle que l'acceptation
       confrontera à l'e-mail vérifié. */
    expect(rows[0]?.email).toBe(`a.inviter.${suffix}@acme.com`);
  });

  /* **Le clair ne descend jamais en base** (T11.1) : la colonne `token`
     n'existe pas, et l'empreinte n'est pas le lien. */
  test("la base ne porte que l'empreinte, jamais le lien", async () => {
    currentPerson = f.managerId;
    const target = await freshPerson("Empreinte seule", {
      email: `empreinte.${suffix}@acme.com`,
    });

    const state = await invitePerson(
      target.id,
      NO_INVITATION_STATE,
      inviteForm("member"),
    );

    const token = state.link?.split("/invitation/")[1] ?? "";
    expect(token).not.toBe("");

    const row = (await pendingOf(target.id))[0];
    expect(row?.tokenHash).not.toContain(token);
    expect(row?.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(Object.keys(row ?? {})).not.toContain("token");
  });

  /* **Aucune trace au journal** — arbitrage (c) du 08/09/2026, et le geste
     rejoint les familles ouvertes depuis T8.3. Le constat le fixe plutôt que de
     le laisser se redécouvrir. */
  test("le geste n'écrit aucune ligne de journal", async () => {
    currentPerson = f.managerId;
    const target = await freshPerson("Sans trace", {
      email: `sans.trace.inv.${suffix}@acme.com`,
    });

    const before = await journal();
    await invitePerson(target.id, NO_INVITATION_STATE, inviteForm("member"));
    const after = await journal();

    expect(after.length).toBe(before.length);
  });
});

describe("invitePerson — les six refus, éprouvés séparément", () => {
  test("sans `manageDomain`, aucune invitation n'est créée", async () => {
    const target = await freshPerson("Défendue à l'invitation", {
      email: `defendue.inv.${suffix}@acme.com`,
    });

    currentPerson = f.memberId;
    const state = await invitePerson(
      target.id,
      NO_INVITATION_STATE,
      inviteForm("domain_manager"),
    );

    expect(state.message).toBeDefined();
    expect(state.link).toBeUndefined();
    expect(await pendingOf(target.id)).toHaveLength(0);
  });

  test("un intervenant côté entité ne s'invite pas", async () => {
    currentPerson = f.managerId;
    const target = await freshPerson("Commanditaire", {
      email: `commanditaire.${suffix}@acme.com`,
      kind: "stakeholder",
    });

    const state = await invitePerson(
      target.id,
      NO_INVITATION_STATE,
      inviteForm("member"),
    );

    expect(state.message).toBeDefined();
    expect(await pendingOf(target.id)).toHaveLength(0);
  });

  test("sans adresse, il n'y a personne à qui écrire", async () => {
    currentPerson = f.managerId;
    const target = await freshPerson("Sans adresse à inviter");

    const state = await invitePerson(
      target.id,
      NO_INVITATION_STATE,
      inviteForm("member"),
    );

    expect(state.message).toBeDefined();
    expect(await pendingOf(target.id)).toHaveLength(0);
  });

  test("une personne qui a déjà un accès n'a rien à recevoir", async () => {
    currentPerson = f.managerId;
    const target = await freshPerson("Déjà dotée", {
      email: `deja.dotee.${suffix}@acme.com`,
    });
    await grantPersonAccess(target.id, NO_ACCESS_STATE, accessForm("member"));
    expect(await accountOf(target.id)).toMatchObject({ hasAccess: true });

    const state = await invitePerson(
      target.id,
      NO_INVITATION_STATE,
      inviteForm("member"),
    );

    expect(state.message).toBeDefined();
    expect(await pendingOf(target.id)).toHaveLength(0);
  });

  /* **Le sixième refus, et il double l'index partiel.** Sans lui, la base
     lèverait `invitations_pending_unique` — un 500 là où l'on attend un message
     qui dit le geste à faire : révoquer, puis réinviter. */
  test("deux invitations vivantes pour une même personne, refusées", async () => {
    currentPerson = f.managerId;
    const target = await freshPerson("Invitée deux fois", {
      email: `deux.fois.${suffix}@acme.com`,
    });

    const first = await invitePerson(
      target.id,
      NO_INVITATION_STATE,
      inviteForm("member"),
    );
    expect(first.link).toBeDefined();

    const second = await invitePerson(
      target.id,
      NO_INVITATION_STATE,
      inviteForm("member"),
    );

    expect(second.message).toBeDefined();
    expect(second.link).toBeUndefined();
    /* **Le décompte tranche** : une ligne refusée ne doit pas d'abord
       s'écrire. */
    expect(await pendingOf(target.id)).toHaveLength(1);
  });

  test("un rôle hors énuméré est une erreur de champ, jamais une levée", async () => {
    currentPerson = f.managerId;
    const target = await freshPerson("Rôle forgé", {
      email: `role.forge.invitation.${suffix}@acme.com`,
    });

    const state = await invitePerson(
      target.id,
      NO_INVITATION_STATE,
      inviteForm("super_admin"),
    );

    expect(state.errors.role).toBeDefined();
    expect(state.link).toBeUndefined();
    expect(await pendingOf(target.id)).toHaveLength(0);
  });

  /* **Le dernier responsable ne se rétrograde pas, même en différé** :
     l'inviter comme `member` le rétrograderait le jour où il accepterait. */
  test("le dernier responsable ne s'invite pas à un rôle moindre", async () => {
    currentPerson = f.managerId;

    const state = await invitePerson(
      f.managerId,
      NO_INVITATION_STATE,
      inviteForm("member"),
    );

    await restoreTheManager();

    expect(state.message).toBeDefined();
    expect(await pendingOf(f.managerId)).toHaveLength(0);
  });

  test("une personne archivée ne s'invite pas", async () => {
    currentPerson = f.managerId;
    const target = await freshPerson("Rangée puis invitée", {
      email: `rangee.inv.${suffix}@acme.com`,
    });
    await f.scope.archive(persons, target.id);

    const state = await invitePerson(
      target.id,
      NO_INVITATION_STATE,
      inviteForm("member"),
    );

    expect(state.message).toBeDefined();
    expect(await pendingOf(target.id)).toHaveLength(0);
  });
});

/* ==========================================================================
   L'envoi — T11.3

   **Ce qui se mesure ici est l'effet de l'envoi sur l'invitation**, jamais
   l'envoi lui-même : celui-ci vit dans `lib/mail/send.test.ts`, sans base. Ce
   que la fiche demande à ce fichier tient en une phrase — *un envoi qui échoue
   n'annule jamais l'invitation* —, et cela ne se lit qu'en base.

   **Le `fetch` global n'est pas remplacé, il est intercepté.** `neon-http`
   parle à la base **par `fetch`** : un `mockImplementation` sans condition
   ferait tomber toute la fixture, et le fichier mesurerait un défaut qu'il
   aurait lui-même créé. Seules les requêtes vers `api.resend.com` sont
   détournées ; les autres passent au `fetch` d'origine.

   **Aucun courriel réel ne part**, ici comme ailleurs : ce que ces cas
   mesurent est *ce que Vision fait de la réponse*.
   ========================================================================== */

/** Le `fetch` d'avant l'espion — celui par lequel la base répond. */
const NETWORK = globalThis.fetch;

const RESEND = "https://api.resend.com/";

/** Détourne les seuls appels à Resend, et laisse passer la base. */
function interceptMail(reply: () => Promise<Response>) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input instanceof Request ? input.url : input);
      return url.startsWith(RESEND) ? reply() : NETWORK(input, init);
    });
}

/** Ce qui est **effectivement sorti** vers Resend, et rien d'autre. */
function mailCalls(spy: ReturnType<typeof interceptMail>) {
  return spy.mock.calls.filter((call) =>
    String(call[0] instanceof Request ? call[0].url : call[0]).startsWith(
      RESEND,
    ),
  );
}

/** Les deux valeurs de l'envoi, posées ou retirées ensemble. */
function connectMail(
  values: { key?: string; from?: string } = {
    key: "une-cle",
    from: "vision@acme.com",
  },
) {
  vi.stubEnv("RESEND_API_KEY", values.key ?? "");
  vi.stubEnv("MAIL_FROM", values.from ?? "");
}

describe("invitePerson — l'envoi, et ce qu'il ne peut pas défaire", () => {
  beforeAll(() => {
    /* L'échec se nomme sur la sortie d'erreur, et deux cas l'exercent : une
       suite verte n'a pas à écrire des lignes d'erreur qu'on cesserait de lire. */
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    /* L'espion de `fetch` se retire à chaque cas : la base parle par lui, et un
       espion qui survivrait à son test ferait tomber le suivant. */
    vi.restoreAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  /** **Mesure 1 de la fiche** : sans clé, rien ne sort, et tout le reste tient. */
  test("sans clé d'envoi : l'invitation existe, `sent_at` est nul, rien ne sort", async () => {
    currentPerson = f.managerId;
    connectMail({});
    const spy = interceptMail(() =>
      Promise.resolve(new Response("{}", { status: 200 })),
    );

    const target = await freshPerson("Sans envoi", {
      email: `sans.envoi.${suffix}@acme.com`,
    });

    const state = await invitePerson(
      target.id,
      NO_INVITATION_STATE,
      inviteForm("member"),
    );

    expect(state.link).toContain("/invitation/");
    expect(state.sent).toBe(false);
    expect(mailCalls(spy)).toHaveLength(0);

    const rows = await pendingOf(target.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.sentAt).toBeNull();
  });

  /**
   * **Mesure 2 de la fiche**, premier échec : l'API refuse. L'invitation existe
   * toujours, `sent_at` est nul — **et le décompte en base tranche**, l'état
   * rendu ressemblant trait pour trait à celui du succès, le lien compris.
   */
  test("l'API refuse : l'invitation reste, `sent_at` reste nul", async () => {
    currentPerson = f.managerId;
    connectMail();
    const spy = interceptMail(() =>
      Promise.resolve(new Response("{}", { status: 422 })),
    );

    const target = await freshPerson("Envoi refusé", {
      email: `envoi.refuse.${suffix}@acme.com`,
    });

    const state = await invitePerson(
      target.id,
      NO_INVITATION_STATE,
      inviteForm("member"),
    );

    expect(state.message).toBeUndefined();
    expect(state.link).toContain("/invitation/");
    expect(state.sent).toBe(false);
    /* La tentative a bien eu lieu : sans elle, « `sent_at` reste nul » ne
       dirait que l'absence d'envoi. */
    expect(mailCalls(spy)).toHaveLength(1);

    const rows = await pendingOf(target.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.sentAt).toBeNull();
  });

  /** **Mesure 2**, second échec : le réseau coupe. Une levée ferait tomber ce cas. */
  test("le réseau coupe : l'invitation reste, `sent_at` reste nul", async () => {
    currentPerson = f.managerId;
    connectMail();
    const spy = interceptMail(() =>
      Promise.reject(new TypeError("fetch failed")),
    );

    const target = await freshPerson("Envoi coupé", {
      email: `envoi.coupe.${suffix}@acme.com`,
    });

    const state = await invitePerson(
      target.id,
      NO_INVITATION_STATE,
      inviteForm("member"),
    );

    expect(state.link).toContain("/invitation/");
    expect(state.sent).toBe(false);
    expect(mailCalls(spy)).toHaveLength(1);

    const rows = await pendingOf(target.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.sentAt).toBeNull();
  });

  /**
   * **La contre-épreuve, et elle vaut autant que les trois mesures.** Sans un
   * cas où l'envoi réussit, « `sent_at` reste nul » ne prouverait que l'absence
   * d'écrivain — le 200 muet de C9, transposé à une colonne.
   *
   * **Et elle mesure la jointure** : le lien que le panneau affichera est
   * **celui-là même** qui part dans le message. Les deux moitiés de la chaîne
   * se rejoignent ici, sur la seule valeur qui les relie.
   */
  test("l'envoi accepté : `sent_at` est daté, et c'est ce lien-là qui part", async () => {
    currentPerson = f.managerId;
    connectMail();
    const spy = interceptMail(() =>
      Promise.resolve(new Response("{}", { status: 200 })),
    );

    const target = await freshPerson("Envoi accepté", {
      email: `envoi.accepte.${suffix}@acme.com`,
    });

    const before = new Date();
    const state = await invitePerson(
      target.id,
      NO_INVITATION_STATE,
      inviteForm("domain_manager"),
    );

    expect(state.sent).toBe(true);

    const rows = await pendingOf(target.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.sentAt).toBeInstanceOf(Date);
    expect(rows[0]?.sentAt?.getTime()).toBeGreaterThanOrEqual(
      before.getTime() - 1_000,
    );

    const calls = mailCalls(spy);
    expect(calls).toHaveLength(1);
    const body = JSON.parse(String(calls[0]?.[1]?.body)) as {
      to: string[];
      text: string;
    };
    expect(body.to).toEqual([`envoi.accepte.${suffix}@acme.com`]);
    expect(body.text).toContain(state.link);
  });

  /**
   * **Un envoi par invitation, jamais deux** : aucune relance, aucun réessai,
   * aucune file (`docs/03` §8, interdit commun de C11). Le refus du sixième cas
   * — *une invitation vit déjà* — n'écrit rien et n'envoie rien non plus.
   */
  test("une invitation déjà vivante ne renvoie rien", async () => {
    currentPerson = f.managerId;
    connectMail();
    const spy = interceptMail(() =>
      Promise.resolve(new Response("{}", { status: 200 })),
    );

    const target = await freshPerson("Un seul envoi", {
      email: `un.seul.envoi.${suffix}@acme.com`,
    });

    await invitePerson(target.id, NO_INVITATION_STATE, inviteForm("member"));
    expect(mailCalls(spy)).toHaveLength(1);

    const second = await invitePerson(
      target.id,
      NO_INVITATION_STATE,
      inviteForm("member"),
    );

    expect(second.message).toBeDefined();
    expect(second.link).toBeUndefined();
    expect(mailCalls(spy)).toHaveLength(1);
    expect(await pendingOf(target.id)).toHaveLength(1);
  });
});

describe("revokeInvitation — muette, et mesurée en base", () => {
  test("la ligne reste, avec sa date : une invitation se révoque", async () => {
    currentPerson = f.managerId;
    const target = await freshPerson("À révoquer", {
      email: `a.revoquer.${suffix}@acme.com`,
    });
    await invitePerson(target.id, NO_INVITATION_STATE, inviteForm("member"));

    const row = (await pendingOf(target.id))[0];
    expect(row).toBeDefined();

    await revokeInvitation(row!.id);

    expect(await pendingOf(target.id)).toHaveLength(0);
    /* **Rien n'est effacé** (règle 4, et l'index est partiel) : la trace
       reste, et c'est elle qui refuse un lien déjà parti. */
    const all = await allInvitationsOf(target.id);
    expect(all).toHaveLength(1);
    expect(all[0]?.revokedAt).toBeInstanceOf(Date);
  });

  test("révoquer rouvre le geste, et les deux lignes coexistent", async () => {
    currentPerson = f.managerId;
    const target = await freshPerson("Réinvitée", {
      email: `reinvitee.${suffix}@acme.com`,
    });
    await invitePerson(target.id, NO_INVITATION_STATE, inviteForm("member"));

    const first = (await pendingOf(target.id))[0];
    await revokeInvitation(first!.id);

    const state = await invitePerson(
      target.id,
      NO_INVITATION_STATE,
      inviteForm("domain_manager"),
    );

    expect(state.link).toBeDefined();
    expect(state.link).not.toBe(first!.tokenHash);
    expect(await pendingOf(target.id)).toHaveLength(1);
    expect(await allInvitationsOf(target.id)).toHaveLength(2);
  });

  test("sans `manageDomain`, rien n'est révoqué", async () => {
    currentPerson = f.managerId;
    const target = await freshPerson("Défendue à la révocation", {
      email: `defendue.rev.${suffix}@acme.com`,
    });
    await invitePerson(target.id, NO_INVITATION_STATE, inviteForm("member"));
    const row = (await pendingOf(target.id))[0];

    currentPerson = f.memberId;
    await revokeInvitation(row!.id);

    /* Le geste est muet : **seul le décompte le juge**. */
    expect(await pendingOf(target.id)).toHaveLength(1);
    expect((await allInvitationsOf(target.id))[0]?.revokedAt).toBeNull();
  });

  test("une invitation déjà révoquée ne se re-date pas", async () => {
    currentPerson = f.managerId;
    const target = await freshPerson("Révoquée deux fois", {
      email: `revoquee.deux.${suffix}@acme.com`,
    });
    await invitePerson(target.id, NO_INVITATION_STATE, inviteForm("member"));
    const row = (await pendingOf(target.id))[0];

    await revokeInvitation(row!.id);
    const first = (await allInvitationsOf(target.id))[0]?.revokedAt;

    await revokeInvitation(row!.id);

    expect((await allInvitationsOf(target.id))[0]?.revokedAt).toEqual(first);
  });

  test("un identifiant d'un autre domaine ne révoque rien", async () => {
    currentPerson = f.managerId;
    const target = await freshPerson("Voisine à protéger", {
      email: `voisine.rev.${suffix}@acme.com`,
    });
    await invitePerson(target.id, NO_INVITATION_STATE, inviteForm("member"));
    const row = (await pendingOf(target.id))[0];

    /* **Le geste porte l'identifiant reçu, jamais celui qu'on lui a lié** : la
       même valeur, sous une session d'un autre domaine, ne doit rien atteindre.
       C'est la règle 1, éprouvée par l'action. */
    const other = await outsideAnySession.createDomain({
      name: `__test__equipe__inv__voisin__${suffix}`,
      competenceCenterName: "Voisin",
    });
    const otherScope = forDomain({ domainId: other.id });
    const intruder = await otherScope.insert(persons, {
      fullName: `Intruse ${suffix}`,
      source: "manual",
      kind: "center",
      hasAccess: true,
      domainRole: "domain_manager",
      email: `intruse.${suffix}@voisin.com`,
    });

    const savedDomain = currentDomain;
    currentPerson = intruder.id;
    currentDomain = other.id;

    await revokeInvitation(row!.id);

    currentPerson = f.managerId;
    currentDomain = savedDomain;

    expect(await pendingOf(target.id)).toHaveLength(1);

    await db.delete(persons).where(eq(persons.domainId, other.id));
    await db.delete(domains).where(inArray(domains.id, [other.id]));
  });
});
