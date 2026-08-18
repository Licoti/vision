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
 */

import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import { resolveDomainId } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { forDomain, superAdmin, type ScopedDb } from "@/lib/db/scoped";
import {
  domains,
  entities,
  persons,
  products,
  projectMembers,
  projectStatuses,
  projects,
} from "@/lib/db/schema";
import { ROUTES } from "@/lib/navigation";

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
 * L'issue d'une écriture réussie : la cible de la redirection.
 *
 * Elle **exige** la levée. Une action qui rendrait un état au lieu de rediriger
 * n'a pas écrit, et ce helper le dit plutôt que de laisser le test conclure sur
 * une base qu'un autre test aurait remplie.
 */
async function redirectedTo(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith(REDIRECT)) return message.slice(REDIRECT.length);
    throw error;
  }
  throw new Error("l'action a rendu un état au lieu de rediriger");
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

beforeAll(async () => {
  const domain = await superAdmin.createDomain({
    name: `__0__test__vision__${suffix}`,
    competenceCenterName: `Centre ${suffix}`,
  });
  const scope = forDomain({ domainId: domain.id });

  /* **Le domaine courant n'est pas choisi, il est trouvé** : `resolveDomainId`
     (`lib/auth/session.ts`) rend **le premier domaine actif par nom**, et le
     POC n'a aucun moyen de lui en désigner un autre. Un fichier de test dont le
     domaine ne trie pas en tête tourne donc contre un autre domaine — le sien
     est bien créé, mais la session n'y est jamais.
   
     C'est un piège réel, découvert le 18/08/2026 : trois domaines de tests
     interrompus subsistaient sur la branche, et le fichier voisin ne passait
     que parce que `__test__actions__` triait avant eux. D'où les deux
     précautions ici — un nom qui trie en tête, et cette garde, qui **échoue en
     nommant la cause** au lieu de laisser huit tests se plaindre d'un domaine
     « non amorcé ». Consigné dans `JOURNAL-TECHNIQUE.md`. */
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
  if (!f?.domainId) return;
  const tables = [
    projectMembers,
    projects,
    projectStatuses,
    products,
    entities,
    persons,
  ];
  for (const table of tables) {
    await db.delete(table).where(eq(table.domainId, f.domainId));
  }
  await db.delete(domains).where(eq(domains.id, f.domainId));
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
      const to = await redirectedTo(
        call(f.productId, "Devenir le point d'entrée unique des démarches."),
      );

      expect(to).toBe(ROUTES.product(f.productId));
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
      await redirectedTo(call(f.productId, "Première direction."));
      await redirectedTo(call(f.productId, "Seconde direction."));

      expect(await visionOf(f.productId)).toBe("Seconde direction.");
    } finally {
      await clear();
    }
  });

  test("le champ rogné : les espaces de bord ne partent pas en base", async () => {
    currentPerson = f.managerId;
    try {
      await redirectedTo(call(f.productId, "   Une direction.   "));
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
      await redirectedTo(call(f.productId, "Une direction."));
      await redirectedTo(call(f.productId, "   "));

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
