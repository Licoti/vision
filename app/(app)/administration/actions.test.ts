/**
 * Les tests des cinq écritures du référentiel des entités — **le droit
 * s'éprouve par l'action**.
 *
 * `CLAUDE.md` pose la discipline en toutes lettres : « un panneau absent du
 * rendu n'a jamais protégé le point d'entrée HTTP qui l'accompagne ». Ici
 * l'écran entier rend 404 à qui n'administre pas, et cela ne prouve **rien** :
 * une action serveur vit à côté de la route, pas derrière elle — ses champs se
 * récoltent sur la page servie au responsable et se repostent sous un autre
 * cookie, les identifiants liés étant sérialisés en clair dans un champ
 * `$ACTION_…`. Ce fichier interroge donc les cinq actions elles-mêmes, sous
 * l'identité d'un membre ordinaire.
 *
 * **Le second sujet est la suppression**, qui est l'écart à la règle 4 arbitré
 * le 21/08/2026. Trois choses la bornent, et les trois s'éprouvent ici : le
 * refus sur un produit **vivant**, le refus sur un produit **archivé** — le cas
 * qui la sépare de l'archivage —, et l'effacement réel quand plus rien ne
 * référence. Le quatrième barrage, la clé étrangère `restrict`, est éprouvé par
 * `lib/db/scoped.test.ts` : c'est la couche qui le porte.
 *
 * **Deux modules de Next sont remplacés**, et pas trois : aucune de ces cinq
 * actions ne redirige — le panneau se referme sur `ok` depuis TD.2, et
 * `restoreEntity` ne rend rien. Rien d'autre n'est simulé : la base est réelle,
 * la porte est la vraie, et `requireSession` fait son travail entier.
 */

import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import { resolveDomainId } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { forDomain, superAdmin, type ScopedDb } from "@/lib/db/scoped";
import { domains, entities, persons, products } from "@/lib/db/schema";

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

const {
  archiveEntity,
  createEntity,
  deleteEntity,
  restoreEntity,
  updateEntity,
} = await import("./actions");

const suffix = Math.random().toString(36).slice(2, 10);

/** L'appel de saisie, tel qu'une soumission le fait : un `FormData`. */
function labelForm(label: string): FormData {
  const data = new FormData();
  data.append("label", label);
  return data;
}

const EMPTY = { values: { label: "" }, errors: {} };

/** L'appel d'une confirmation : un état vide, et un `FormData` sans champ. */
function confirm(): [Record<string, never>, FormData] {
  return [{}, new FormData()];
}

type Fixture = {
  domainId: string;
  scope: ScopedDb;
  managerId: string;
  outsiderId: string;
  /** Deux produits vivants : archivage et suppression tous deux refusés. */
  loadedEntityId: string;
  /** Un seul produit, archivé : archivable, mais jamais supprimable. */
  rangedEntityId: string;
  /** Aucun produit : les deux gestes s'ouvrent. */
  freeEntityId: string;
  /** Archivée : corrigeable seulement après rétablissement. */
  archivedEntityId: string;
};

let f: Fixture;

beforeAll(async () => {
  const domain = await superAdmin.createDomain({
    name: `__0__test__admin__${suffix}`,
    competenceCenterName: `Centre ${suffix}`,
  });
  const scope = forDomain({ domainId: domain.id });

  /* **Le domaine courant n'est pas choisi, il est trouvé** : `resolveDomainId`
     rend **le premier domaine actif par nom**, et le POC n'a aucun moyen de lui
     en désigner un autre. D'où le nom qui trie en tête, et cette garde, qui
     échoue en **nommant la cause** — la leçon du 18/08/2026. */
  const resolved = await resolveDomainId();
  if (resolved !== domain.id) {
    const others = await superAdmin.listDomains({ includeArchived: true });
    throw new Error(
      "Le domaine courant n'est pas celui de ce fichier : `resolveDomainId` " +
        "rend le premier domaine actif par nom, et la branche de test en " +
        "porte un qui trie avant. Domaines présents : " +
        others.map((row) => row.name).join(", ") +
        ". Nettoyer les domaines `__test__…` laissés par une exécution " +
        "interrompue avant de relancer.",
    );
  }

  const person = (fullName: string, domainRole: "domain_manager" | "member") =>
    scope.insert(persons, {
      fullName,
      source: "manual",
      kind: "center",
      hasAccess: true,
      domainRole,
    });

  const manager = await person(`Responsable ${suffix}`, "domain_manager");
  const outsider = await person(`Membre ${suffix}`, "member");

  const loaded = await scope.insert(entities, { label: `Chargée ${suffix}` });
  const ranged = await scope.insert(entities, { label: `Rangée ${suffix}` });
  const free = await scope.insert(entities, { label: `Libre ${suffix}` });
  const archived = await scope.insert(entities, {
    label: `Archivée ${suffix}`,
  });
  await scope.archive(entities, archived.id);

  await scope.insert(products, {
    name: `Produit vivant ${suffix}`,
    entityId: loaded.id,
  });
  const onRanged = await scope.insert(products, {
    name: `Produit rangé ${suffix}`,
    entityId: ranged.id,
  });
  await scope.archive(products, onRanged.id);

  f = {
    domainId: domain.id,
    scope,
    managerId: manager.id,
    outsiderId: outsider.id,
    loadedEntityId: loaded.id,
    rangedEntityId: ranged.id,
    freeEntityId: free.id,
    archivedEntityId: archived.id,
  };
}, 180_000);

afterAll(async () => {
  if (!f?.domainId) return;
  for (const table of [products, entities, persons]) {
    await db.delete(table).where(eq(table.domainId, f.domainId));
  }
  await db.delete(domains).where(eq(domains.id, f.domainId));
});

/** La ligne telle qu'elle est en base, sans passer par une lecture d'écran. */
async function entityRow(id: string) {
  const rows = await db.select().from(entities).where(eq(entities.id, id));
  return rows[0];
}

/** Le nombre d'entités du domaine, archivées comprises. */
async function entityCount(): Promise<number> {
  const rows = await db
    .select()
    .from(entities)
    .where(eq(entities.domainId, f.domainId));
  return rows.length;
}

/* ==========================================================================
   Créer
   ========================================================================== */

describe("createEntity — ce que le geste écrit", () => {
  test("le responsable de domaine crée une entité", async () => {
    currentPerson = f.managerId;

    const state = await createEntity(EMPTY, labelForm(`Neuve ${suffix}`));

    expect(state.ok).toBe(true);
    expect(state.errors).toEqual({});

    const created = (
      await db
        .select()
        .from(entities)
        .where(eq(entities.label, `Neuve ${suffix}`))
    )[0];
    expect(created?.domainId).toBe(f.domainId);
    expect(created?.archivedAt).toBeNull();
    /* `position` garde son défaut : le formulaire ne l'écrit pas, et aucun
       écran ne la lit. */
    expect(created?.position).toBe("0.00");
  });
});

describe("createEntity — ce que le geste refuse", () => {
  test("un membre ordinaire ne crée rien", async () => {
    currentPerson = f.outsiderId;
    const before = await entityCount();

    const state = await createEntity(EMPTY, labelForm(`Forgée ${suffix}`));

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("responsable de domaine");
    /* La saisie revient telle quelle : Vision ne jette jamais en silence ce qui
       a été tapé, y compris quand ce qu'elle refuse n'est pas la saisie. */
    expect(state.values.label).toBe(`Forgée ${suffix}`);
    expect(await entityCount()).toBe(before);
  });

  test("un libellé vide est refusé sur le champ", async () => {
    currentPerson = f.managerId;
    const before = await entityCount();

    const state = await createEntity(EMPTY, labelForm("   "));

    expect(state.ok).toBeUndefined();
    expect(state.errors.label).toBe("Le nom de l'entité est obligatoire.");
    expect(await entityCount()).toBe(before);
  });

  test("un libellé déjà pris est refusé, et le refus nomme la jumelle", async () => {
    currentPerson = f.managerId;
    const before = await entityCount();

    const state = await createEntity(EMPTY, labelForm(`Libre ${suffix}`));

    expect(state.ok).toBeUndefined();
    expect(state.errors.label).toContain(`Libre ${suffix}`);
    expect(await entityCount()).toBe(before);
  });

  test("la casse et l'accent ne suffisent pas à en faire une autre", async () => {
    currentPerson = f.managerId;
    const before = await entityCount();

    const state = await createEntity(EMPTY, labelForm(`libre ${suffix}`));

    expect(state.ok).toBeUndefined();
    expect(state.errors.label).toBeDefined();
    expect(await entityCount()).toBe(before);
  });

  test("un libellé pris par une entité **archivée** propose de la rétablir", async () => {
    /* C'est le point ouvert d'`ETAT.md` : l'amorçage rapproche par clé
       naturelle, un renommage recrée sous l'ancien nom. Le refus doit envoyer
       vers le geste juste, et la liste montre la ligne rangée. */
    currentPerson = f.managerId;
    const before = await entityCount();

    const state = await createEntity(EMPTY, labelForm(`Archivée ${suffix}`));

    expect(state.ok).toBeUndefined();
    expect(state.errors.label).toContain("Rétablissez-la");
    expect(await entityCount()).toBe(before);
  });
});

/* ==========================================================================
   Corriger
   ========================================================================== */

describe("updateEntity — ce que le geste écrit", () => {
  test("le responsable renomme une entité", async () => {
    currentPerson = f.managerId;

    const state = await updateEntity(
      f.freeEntityId,
      EMPTY,
      labelForm(`Libre corrigée ${suffix}`),
    );

    expect(state.ok).toBe(true);
    expect((await entityRow(f.freeEntityId))?.label).toBe(
      `Libre corrigée ${suffix}`,
    );

    // Remise en état pour les tests suivants, qui nomment cette ligne.
    await updateEntity(f.freeEntityId, EMPTY, labelForm(`Libre ${suffix}`));
  });

  test("récrire une entité sous son propre nom n'est pas un doublon", async () => {
    currentPerson = f.managerId;

    const state = await updateEntity(
      f.freeEntityId,
      EMPTY,
      labelForm(`Libre ${suffix}`),
    );

    expect(state.ok).toBe(true);
  });
});

describe("updateEntity — ce que le geste refuse", () => {
  test("un membre ordinaire ne corrige rien", async () => {
    currentPerson = f.outsiderId;

    const state = await updateEntity(
      f.freeEntityId,
      EMPTY,
      labelForm(`Volée ${suffix}`),
    );

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("responsable de domaine");
    expect((await entityRow(f.freeEntityId))?.label).toBe(`Libre ${suffix}`);
  });

  test("une entité archivée ne reçoit plus de correction", async () => {
    currentPerson = f.managerId;

    const state = await updateEntity(
      f.archivedEntityId,
      EMPTY,
      labelForm(`Ressuscitée ${suffix}`),
    );

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("archivée");
    expect((await entityRow(f.archivedEntityId))?.label).toBe(
      `Archivée ${suffix}`,
    );
  });

  test("un identifiant inconnu du domaine n'existe pas", async () => {
    currentPerson = f.managerId;

    const state = await updateEntity(
      "00000000-0000-4000-8000-000000000000",
      EMPTY,
      labelForm(`Nulle part ${suffix}`),
    );

    expect(state.ok).toBeUndefined();
    expect(state.message).toBe("Cette entité n'existe plus dans ce domaine.");
  });

  test("prendre le nom d'une voisine est refusé", async () => {
    currentPerson = f.managerId;

    const state = await updateEntity(
      f.freeEntityId,
      EMPTY,
      labelForm(`Chargée ${suffix}`),
    );

    expect(state.ok).toBeUndefined();
    expect(state.errors.label).toContain(`Chargée ${suffix}`);
    expect((await entityRow(f.freeEntityId))?.label).toBe(`Libre ${suffix}`);
  });
});

/* ==========================================================================
   Ranger, sortir du rangement
   ========================================================================== */

describe("archiveEntity", () => {
  test("un membre ordinaire n'archive rien", async () => {
    currentPerson = f.outsiderId;

    const state = await archiveEntity(f.rangedEntityId, ...confirm());

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("responsable de domaine");
    expect((await entityRow(f.rangedEntityId))?.archivedAt).toBeNull();
  });

  test("un produit vivant s'oppose au rangement, et le refus dit combien", async () => {
    currentPerson = f.managerId;

    const state = await archiveEntity(f.loadedEntityId, ...confirm());

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("1 produit vivant");
    expect((await entityRow(f.loadedEntityId))?.archivedAt).toBeNull();
  });

  test("un produit **archivé** ne s'y oppose pas : il a déjà quitté les listes", async () => {
    currentPerson = f.managerId;

    const state = await archiveEntity(f.rangedEntityId, ...confirm());

    expect(state.ok).toBe(true);
    expect((await entityRow(f.rangedEntityId))?.archivedAt).toBeInstanceOf(
      Date,
    );
  });

  test("archiver ce qui est déjà rangé ne fait rien, et ne se dit pas écrit", async () => {
    currentPerson = f.managerId;

    const state = await archiveEntity(f.archivedEntityId, ...confirm());

    expect(state.ok).toBeUndefined();
    expect(state.message).toBeUndefined();
  });

  test("aucune cascade : le produit rattaché n'est pas touché", async () => {
    /* Arbitrage (f) de `tickets-C4bis.md`, transposé : archiver une entité
       n'archive aucun produit. Le produit de `rangedEntityId` était déjà rangé
       avant le test ci-dessus ; ce qui compte est que celui de `loadedEntityId`
       n'ait pas bougé. */
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.entityId, f.loadedEntityId));

    expect(rows).toHaveLength(1);
    expect(rows[0]?.archivedAt).toBeNull();
  });
});

describe("restoreEntity", () => {
  test("un membre ordinaire ne rétablit rien, et le refus est muet", async () => {
    currentPerson = f.outsiderId;

    await expect(restoreEntity(f.rangedEntityId)).resolves.toBeUndefined();
    expect((await entityRow(f.rangedEntityId))?.archivedAt).toBeInstanceOf(
      Date,
    );
  });

  test("le responsable rétablit une entité archivée", async () => {
    currentPerson = f.managerId;

    await restoreEntity(f.rangedEntityId);

    expect((await entityRow(f.rangedEntityId))?.archivedAt).toBeNull();
  });
});

/* ==========================================================================
   Supprimer — l'écart à la règle 4
   ========================================================================== */

describe("deleteEntity — ce que le geste refuse", () => {
  test("un membre ordinaire ne supprime rien", async () => {
    currentPerson = f.outsiderId;

    const state = await deleteEntity(f.freeEntityId, ...confirm());

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("responsable de domaine");
    expect(await entityRow(f.freeEntityId)).toBeDefined();
  });

  test("un produit vivant retient la ligne", async () => {
    currentPerson = f.managerId;

    const state = await deleteEntity(f.loadedEntityId, ...confirm());

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("1 produit");
    expect(await entityRow(f.loadedEntityId)).toBeDefined();
  });

  test("un produit **archivé** la retient tout autant", async () => {
    /* Le cas qui sépare les deux gestes, et la raison des deux décomptes :
       `rangedEntityId` vient d'être archivée puis rétablie sans que rien ne
       s'y oppose, et elle ne se supprime pourtant pas. */
    currentPerson = f.managerId;

    const state = await deleteEntity(f.rangedEntityId, ...confirm());

    expect(state.ok).toBeUndefined();
    expect(state.message).toContain("archivé compris");
    expect(await entityRow(f.rangedEntityId)).toBeDefined();
  });

  test("un identifiant inconnu du domaine n'existe pas", async () => {
    currentPerson = f.managerId;

    const state = await deleteEntity(
      "00000000-0000-4000-8000-000000000000",
      ...confirm(),
    );

    expect(state.ok).toBeUndefined();
    expect(state.message).toBe("Cette entité n'existe plus dans ce domaine.");
  });
});

describe("deleteEntity — ce que le geste écrit", () => {
  test("une entité que rien ne référence est effacée pour de bon", async () => {
    currentPerson = f.managerId;

    const doomed = await f.scope.insert(entities, {
      label: `À effacer ${suffix}`,
    });

    const state = await deleteEntity(doomed.id, ...confirm());

    expect(state.ok).toBe(true);
    /* Effacée, et non rangée : c'est ce qui distingue ce geste de tous les
       autres de Vision, et c'est pour cela que le panneau le dit avant. */
    expect(await entityRow(doomed.id)).toBeUndefined();
  });

  test("une entité archivée se supprime aussi, si rien ne la référence", async () => {
    currentPerson = f.managerId;

    const doomed = await f.scope.insert(entities, {
      label: `Rangée puis effacée ${suffix}`,
    });
    await f.scope.archive(entities, doomed.id);

    const state = await deleteEntity(doomed.id, ...confirm());

    expect(state.ok).toBe(true);
    expect(await entityRow(doomed.id)).toBeUndefined();
  });
});
