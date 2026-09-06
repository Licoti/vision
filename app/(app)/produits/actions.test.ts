/**
 * Les tests d'`updateProductVision` — **le droit s'éprouve par l'action**.
 *
 * `CLAUDE.md` pose la discipline en toutes lettres : « un panneau absent du
 * rendu n'a jamais protégé le point d'entrée HTTP qui l'accompagne ». Le menu
 * qui porte ce geste ne s'affiche qu'au responsable de domaine, et cela ne
 * prouve rien : les identifiants liés d'une action serveur sont sérialisés en
 * clair dans un champ `$ACTION_…`, réécrivable. Ce fichier interroge donc
 * l'action elle-même, avec les identifiants qu'une soumission forgée porterait.
 *
 * **Le test qui compte est celui du contributeur.** La vision est le seul geste
 * du bloc de tête qui demande `manageDomain` : ses voisins — indicateurs,
 * relevés, North Star — s'ouvrent au contributeur désigné d'un accompagnement
 * (arbitrage (b) de `tickets-C5.md`). Sans un contributeur qui **écrit** un
 * indicateur et **se voit refuser** la vision, rien ne distinguerait les deux
 * règles ; le premier de ces deux faits est éprouvé par
 * `app/(app)/produits/[id]/actions.test.ts`, le second l'est ici.
 *
 * **Trois modules de Next sont remplacés**, un de plus que dans le fichier
 * voisin, et le troisième est celui qui manquait : `updateProductVision` finit
 * par `redirect()`, qui **lève**. `setNorthStar` ne redirige pas, ce pour quoi
 * ses tests n'avaient jamais eu à le simuler. La levée est ici **conservée**
 * plutôt que supprimée — un `redirect` muet ferait passer pour une écriture
 * réussie une action qui n'a pas atteint sa dernière ligne.
 *
 * Rien d'autre n'est simulé : la base est réelle, la porte est la vraie, et
 * `requireSession` fait son travail entier.
 *
 * **T8.3 y ajoute la trace du geste.** La vision est le premier objet de ce
 * fichier à laisser une ligne au journal — `product_vision`, l'un des dix
 * `target_type` de la migration `0015` —, et **elle est la seule** : créer,
 * corriger, archiver et rétablir un **produit** n'écrivent toujours rien.
 * L'asymétrie est un périmètre, pas un arbitrage, et le dernier bloc de ce
 * fichier la mesure plutôt que de la laisser se supposer.
 */

import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import { SESSION_COOKIE, sealPrincipal } from "@/lib/auth/cookie";
import { db } from "@/lib/db/client";
import {
  asSuperAdmin,
  forDomain,
  withoutAnySession,
  type ScopedDb,
} from "@/lib/db/scoped";
import {
  domains,
  entities,
  events,
  persons,
  products,
  projectMembers,
  projectStatuses,
  projects,
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

/* Le vrai `redirect` lève une erreur que Next rattrape au rendu ; celui-ci lève
   la sienne, reconnaissable. **On garde la levée** : c'est elle qui prouve que
   l'action est allée jusqu'à sa dernière ligne, et un remplaçant muet ferait
   d'un refus silencieux le même résultat qu'une écriture. */
const REDIRECT = "NEXT_REDIRECT:";

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`${REDIRECT}${to}`);
  },
}));

const { updateProductVision } = await import("./actions");

const suffix = Math.random().toString(36).slice(2, 10);

/** L'appel, tel qu'une soumission le fait : un `FormData`, jamais un objet. */
function call(productId: string, vision: string) {
  const data = new FormData();
  data.append("vision", vision);
  return updateProductVision(
    productId,
    { values: { vision: "" }, errors: {} },
    data,
  );
}

/**
 * L'issue d'une écriture réussie — **`ok`, et non plus une redirection** (TD.2).
 *
 * `updateProductVision` fermait son panneau en redirigeant vers la page nue :
 * la navigation *était* la fermeture, et sa cible disait où l'on retombait. Le
 * panneau se fermant désormais côté client, elle rend son succès.
 *
 * Il **exige** `ok`. Une action qui rendrait un état sans lui n'a pas écrit, et
 * ce helper le dit plutôt que de laisser le test conclure sur une base qu'un
 * autre test aurait remplie — c'est la propriété que `redirectedTo` cherchait,
 * et elle est tenue par la même exigence.
 */
async function written<T extends { ok?: boolean; message?: string }>(
  promise: Promise<T>,
): Promise<T> {
  const state = await promise;
  if (!state.ok) {
    throw new Error(
      `l'action n'a pas écrit : ${state.message ?? "aucun message"}`,
    );
  }
  return state;
}

type Fixture = {
  domainId: string;
  scope: ScopedDb;
  managerId: string;
  outsiderId: string;
  contributorId: string;
  productId: string;
  archivedProductId: string;
};

let f: Fixture;

/**
 * Le domaine, retenu **dès sa création** et hors de la fixture — T8.1.
 *
 * Le nettoyage portait sur `f.domainId` : un `beforeAll` qui échoue **après**
 * avoir créé son domaine laisse `f` indéfinie, l'`afterAll` se saute, et le
 * domaine résiduel fait tomber les fichiers suivants. La garde ci-dessous
 * n'y change rien — elle échoue *avant* que `f` soit posée, et c'est
 * précisément le cas que ce nettoyage doit rattraper. Forme d'`equipe/` et
 * d'`administration/actions.test.ts` (T7.3).
 *
 * **Ce geste ne suffit pas seul** : un processus tué n'appelle aucun
 * `afterAll`. La garde qui couvre ce cas-là vit dans `vitest.global-setup.ts`.
 */
let createdDomainId: string | null = null;

beforeAll(async () => {
  const domain = await outsideAnySession.createDomain({
    name: `__0__test__vision__${suffix}`,
    competenceCenterName: `Centre ${suffix}`,
  });
  createdDomainId = domain.id;
  currentDomain = domain.id;
  const scope = forDomain({ domainId: domain.id });


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
  const contributor = await person(`Contributeur ${suffix}`, "member");

  const entity = await scope.insert(entities, { label: `Entité ${suffix}` });
  const status = await scope.insert(projectStatuses, {
    label: `En cours ${suffix}`,
    nature: "active",
  });

  const product = await scope.insert(products, {
    name: `Produit ${suffix}`,
    entityId: entity.id,
  });
  const archivedProduct = await scope.insert(products, {
    name: `Rangé ${suffix}`,
    entityId: entity.id,
  });
  await scope.archive(products, archivedProduct.id);

  /* Un accompagnement dont `contributor` est contributeur : c'est ce qui lui
     ouvre les **indicateurs** de ce produit (arbitrage (b)), et pas sa vision.
     Toute la distinction que ce fichier éprouve tient à cette ligne. */
  const project = await scope.insert(projects, {
    name: `Accompagnement ${suffix}`,
    productId: product.id,
    statusId: status.id,
  });
  await scope.insert(projectMembers, {
    projectId: project.id,
    personId: contributor.id,
    isContributor: true,
  });

  f = {
    domainId: domain.id,
    scope,
    managerId: manager.id,
    outsiderId: outsider.id,
    contributorId: contributor.id,
    productId: product.id,
    archivedProductId: archivedProduct.id,
  };
}, 180_000);

afterAll(async () => {
  if (!createdDomainId) return;
  /* **`events` en tête depuis T8.3**, et son absence aurait été une cascade de
     63 : `events.domain_id` est `restrict`, si bien que la suppression du
     domaine aurait échoué et laissé un résidu que `resolveDomainId` servait
     au fichier suivant. C'est exactement la panne que T8.1 a diagnostiquée, et
     `updateProductVision` est ce qui la rendait atteignable ici. */
  const tables = [
    events,
    projectMembers,
    projects,
    projectStatuses,
    products,
    entities,
    persons,
  ];
  for (const table of tables) {
    await db.delete(table).where(eq(table.domainId, createdDomainId));
  }
  await db.delete(domains).where(eq(domains.id, createdDomainId));
});

/** La colonne telle qu'elle est en base, sans passer par une lecture d'écran. */
async function visionOf(productId: string): Promise<string | null> {
  const rows = await db
    .select({ vision: products.vision })
    .from(products)
    .where(eq(products.id, productId));
  return rows[0]?.vision ?? null;
}

/** Remet le produit à zéro entre deux tests : la fixture est partagée. */
async function clear(): Promise<void> {
  await db
    .update(products)
    .set({ vision: null })
    .where(eq(products.domainId, f.domainId));
}

describe("updateProductVision — ce que le geste écrit", () => {
  test("le responsable de domaine écrit la vision, et la base la porte", async () => {
    currentPerson = f.managerId;
    try {
      await written(
        call(f.productId, "Devenir le point d'entrée unique des démarches."),
      );

      expect(await visionOf(f.productId)).toBe(
        "Devenir le point d'entrée unique des démarches.",
      );
    } finally {
      await clear();
    }
  });

  test("récrire remplace, et ne complète pas", async () => {
    currentPerson = f.managerId;
    try {
      await written(call(f.productId, "Première direction."));
      await written(call(f.productId, "Seconde direction."));

      expect(await visionOf(f.productId)).toBe("Seconde direction.");
    } finally {
      await clear();
    }
  });

  test("le champ rogné : les espaces de bord ne partent pas en base", async () => {
    currentPerson = f.managerId;
    try {
      await written(call(f.productId, "   Une direction.   "));
      expect(await visionOf(f.productId)).toBe("Une direction.");
    } finally {
      await clear();
    }
  });

  test("un champ vidé **retire** la vision — `null`, jamais une chaîne vide", async () => {
    /* Le geste que la note du panneau annonce. `null` et non `""` : la page
       teste la colonne pour décider de son état vide, et une chaîne vide y
       passerait pour une vision en rendant un paragraphe blanc. */
    currentPerson = f.managerId;
    try {
      await written(call(f.productId, "Une direction."));
      await written(call(f.productId, "   "));

      expect(await visionOf(f.productId)).toBeNull();
    } finally {
      await clear();
    }
  });
});

describe("updateProductVision — ce que le geste refuse", () => {
  test("un membre sans droit n'écrit rien, et le refus le dit", async () => {
    currentPerson = f.outsiderId;
    try {
      const state = await call(f.productId, "Une direction.");

      expect(state.message).toContain("responsable de domaine");
      /* Le refus **rend la saisie**, sans quoi une vision de dix lignes
         disparaîtrait au premier refus. */
      expect(state.values.vision).toBe("Une direction.");
      expect(await visionOf(f.productId)).toBeNull();
    } finally {
      await clear();
    }
  });

  test("un **contributeur** d'un accompagnement du produit est refusé", async () => {
    /* **Le test qui distingue les deux règles du bloc.** Cette personne écrit
       les indicateurs de ce produit et sa North Star — le fichier voisin le
       prouve. La vision, non : elle est une propriété du produit (F1-D1, D9).
       Sans ce test, `manageDomain` pourrait être remplacé par le droit dérivé
       sans qu'aucun test ne tombe. */
    currentPerson = f.contributorId;
    try {
      const state = await call(f.productId, "Une direction.");

      expect(state.message).toContain("responsable de domaine");
      expect(await visionOf(f.productId)).toBeNull();
    } finally {
      await clear();
    }
  });

  test("un produit **archivé** est en lecture seule", async () => {
    /* Règle 4 et T4bis.2 : le contrôle porte sur la ligne **lue**, jamais sur
       ce que l'écran affichait — le champ récolté avant l'archivage se
       repostant tel quel ensuite. Le refus dit « archivé » et non « n'existe
       plus », qui serait faux. */
    currentPerson = f.managerId;
    try {
      const state = await call(f.archivedProductId, "Une direction.");

      expect(state.message).toContain("archivé");
      expect(await visionOf(f.archivedProductId)).toBeNull();
    } finally {
      await clear();
    }
  });

  test("un produit d'un autre domaine ne se distingue pas d'un produit inconnu", async () => {
    /* La couche est scopée et ne fait pas la différence — l'écran non plus,
       pour la même raison que la page produit rend 404 dans les deux cas. */
    currentPerson = f.managerId;
    const state = await call("3f2504e0-4f89-11d3-9a0c-0305e82c3301", "Une direction.");

    expect(state.message).toContain("n'existe plus dans ce domaine");
  });
});

/* ==========================================================================
   Le journal de la vision — T8.3
   ========================================================================== */

type EventRow = {
  verb: string;
  targetType: string;
  targetId: string | null;
  actorId: string | null;
  projectId: string | null;
  productId: string | null;
  summary: string;
};

/** Toutes les lignes du journal du domaine, de la plus ancienne à la dernière. */
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
    .where(eq(events.domainId, f.domainId))
    .orderBy(events.occurredAt, events.createdAt);
}

/** Les lignes qu'un geste vient d'écrire — le décompte avant, le décompte après. */
async function lines(gesture: () => Promise<unknown>): Promise<EventRow[]> {
  const before = await journal();
  await gesture();
  return (await journal()).slice(before.length);
}

/**
 * L'insécable de `lib/journal.ts`, **en échappement**.
 *
 * Écrit en caractère, il est indiscernable d'une espace ordinaire dans un
 * fichier source : un test qui attendrait la seconde passerait le jour où la
 * règle sauterait, et celui qui le lirait ne saurait pas lequel il attend.
 * C'est la forme de `lib/format.test.ts` et des deux autres fichiers de tests
 * d'action qui lisent une phrase de journal.
 */
const NBSP = "\u00A0";

describe("le journal de la vision produit", () => {
  test("la saisie écrit une ligne, et une seule", async () => {
    await clear();
    currentPerson = f.managerId;

    const traced = await lines(() =>
      call(f.productId, "Devenir le point d'entrée unique du réseau."),
    );

    expect(traced).toHaveLength(1);
    expect(traced[0]?.verb).toBe("updated");
    expect(traced[0]?.targetType).toBe("product_vision");
    expect(traced[0]?.actorId).toBe(f.managerId);
    expect(traced[0]?.summary).toBe(
      `Vision produit modifiée${NBSP}: Produit ${suffix}`,
    );

    /* **`project_id` nul, `product_id` posé** : la vision est une propriété du
       produit — c'est ce qui lui a donné `manageDomain` quand le budget a pris
       `writeProject`. Aucun écran ne dira ce point. */
    expect(traced[0]?.projectId).toBeNull();
    expect(traced[0]?.productId).toBe(f.productId);

    /* `target_id` est le produit, faute d'une ligne à désigner : la vision est
       une colonne. */
    expect(traced[0]?.targetId).toBe(f.productId);
  });

  /**
   * **Vider le champ écrit une ligne, et c'est `updated`.** Retirer la vision
   * est la correction d'un champ de texte, pas une suppression (la note du
   * panneau le dit) : le journal ne distingue pas les deux, et il n'a aucun
   * verbe pour le faire.
   */
  test("le champ vidé écrit lui aussi, et le journal ne porte aucune valeur", async () => {
    await clear();
    currentPerson = f.managerId;
    await written(call(f.productId, "Une direction à retirer."));

    const emptied = await lines(() => call(f.productId, ""));

    expect(emptied).toHaveLength(1);
    expect(emptied[0]?.verb).toBe("updated");
    expect(await visionOf(f.productId)).toBeNull();

    /* Ni la valeur d'avant ni celle d'après : le journal n'est pas un
       historique (D22), et la phrase désigne ce qui a été touché. */
    expect(emptied[0]?.summary).not.toContain("Une direction à retirer");
  });

  /**
   * **Le droit s'éprouve par l'action** : un refus n'écrit ni la donnée ni sa
   * ligne de journal. Le contributeur est le cas qui compte — il écrit les
   * indicateurs du même produit, et pas sa vision.
   */
  test("un contributeur refusé n'écrit ni la vision ni l'événement", async () => {
    await clear();
    currentPerson = f.contributorId;

    const traced = await lines(async () => {
      const state = await call(f.productId, "Vision forgée.");
      expect(state.message).toBeDefined();
      expect(state.ok).toBeUndefined();
    });

    expect(traced).toHaveLength(0);
    expect(await visionOf(f.productId)).toBeNull();
  });

  /**
   * **Le produit lui-même n'entre pas au journal**, et ce constat est là pour
   * que l'asymétrie se lise plutôt qu'elle ne se découvre : la fiche T8.3
   * autorisait dix objets, `product` n'en était pas, et l'ajouter aurait été le
   * geste « pendant que j'y suis » que la règle 3 refuse. Le jour où un ticket
   * le journalisera, **c'est ce test qui tombera** — et c'est ce qu'on lui
   * demande.
   */
  test("archiver un produit n'écrit aucune ligne", async () => {
    currentPerson = f.managerId;

    const traced = await lines(async () => {
      await f.scope.archive(products, f.archivedProductId);
      await f.scope.restore(products, f.archivedProductId);
      await f.scope.archive(products, f.archivedProductId);
    });

    expect(traced).toHaveLength(0);
  });
});
