/**
 * La garde du super administrateur — T9.3.
 *
 * **Ce ticket ne rend aucun écran, et son critère n'est donc pas un HTML.** Sa
 * fiche demande une mesure « par l'action, en `text/plain` » ; il n'existe aucun
 * point d'entrée HTTP à frapper avant T9.4, et la « Vérification de fin de
 * chantier » de `tickets-C9.md` le dit d'ailleurs elle-même : *« T9.3 ne rend
 * aucun écran non plus : son critère est un décompte en base après un appel
 * refusé »*. L'écart entre les deux phrases de la fiche est consigné.
 *
 * **Ce qui remplace le `curl` est plus fort que lui**, et c'est ce que ce
 * fichier mesure : le cookie n'est pas simulé, il est **scellé par le vrai
 * sceau** (`sealPrincipal`) et rouvert par le vrai code. La forme est celle des
 * six fichiers de tests d'action du dépôt.
 *
 * **Le décompte en base tranche, jamais la levée.** `requireSuperAdmin`
 * redirige, et *une redirection n'est pas une écriture refusée* — un refus rend
 * 200 comme une réussite (leçon de T6.1). Chaque cas lit la cible **avant** le
 * geste, puis après ; sans cette étape témoin, un zéro final ne distingue pas un
 * refus d'une cible qui n'a jamais été atteignable.
 *
 * **Le geste mesuré est celui que T9.4 écrira** — `requireSuperAdmin()` puis
 * `asSuperAdmin(grant)`. Il vit ici parce que ce ticket ne rend aucune action ;
 * la garde, elle, existe avant l'écran, et c'est tout l'objet du ticket.
 *
 * **Les deux barrières sont éprouvées séparément.** Celle de la couche —
 * `asSuperAdmin` relit la ligne — est mesurée dans `lib/db/scoped.test.ts` sur
 * une autorité forgée ; celle du droit — le cookie ne porte pas ce qu'il faut —
 * l'est ici. Aucune ne remplace l'autre : la première protège d'un appelant qui
 * fabrique son autorité, la seconde d'un visiteur qui n'en a pas.
 */

import { eq, inArray, like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import { SESSION_COOKIE, sealPrincipal, type Principal } from "./cookie";
import { db } from "../db/client";
import {
  asSuperAdmin,
  forDomain,
  withoutAnySession,
  type SuperAdminGrant,
} from "../db/scoped";
import { domains, persons, superAdmins } from "../db/schema";

/* Une fixture écrit hors de toute session — l'échappée nommée de T9.3. */
const outsideAnySession = asSuperAdmin(withoutAnySession("fixture"));

/**
 * Ce que la requête présente. `null` couvre le visiteur sans cookie.
 *
 * La valeur est scellée à chaque lecture plutôt qu'une fois : c'est la signature
 * du produit qui est éprouvée, pas une chaîne recopiée.
 */
let principal: Principal | null = null;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === SESSION_COOKIE && principal
        ? { name, value: sealPrincipal(principal) }
        : undefined,
  }),
}));

/* La levée est **conservée** plutôt que supprimée : un `redirect` muet ferait
   croire qu'un geste refusé s'est déroulé jusqu'au bout. Elle ne prouve rien à
   elle seule pour autant — c'est le décompte qui tranche. */
const REDIRECT = "NEXT_REDIRECT:";

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`${REDIRECT}${to}`);
  },
}));

const { requireSuperAdmin, getSuperAdmin } = await import("./super-admin");

const suffix = Math.random().toString(36).slice(2, 10);

let domainId: string;
let managerId: string;
let liveAdminId: string;
let archivedAdminId: string;

beforeAll(async () => {
  const domain = await outsideAnySession.createDomain({
    name: `__test__droit-super-admin__${suffix}`,
    competenceCenterName: "Centre du droit",
  });
  domainId = domain.id;

  const scope = forDomain({ domainId });
  const manager = await scope.insert(persons, {
    fullName: `Responsable ${suffix}`,
    source: "manual",
    kind: "center",
    hasAccess: true,
    domainRole: "domain_manager",
  });
  managerId = manager.id;

  const live = await outsideAnySession.upsertSuperAdmin({
    email: `en-exercice.${suffix}@exemple.test`,
    fullName: `En exercice ${suffix}`,
  });
  liveAdminId = live.row.id;

  const archived = await outsideAnySession.upsertSuperAdmin({
    email: `archive.${suffix}@exemple.test`,
    fullName: `Archivé ${suffix}`,
  });
  archivedAdminId = archived.row.id;
  await db
    .update(superAdmins)
    .set({ archivedAt: new Date() })
    .where(eq(superAdmins.id, archivedAdminId));
});

afterAll(async () => {
  principal = null;
  await db.delete(superAdmins).where(like(superAdmins.email, `%${suffix}%`));
  if (!domainId) return;
  await db.delete(persons).where(eq(persons.domainId, domainId));
  await db
    .delete(domains)
    .where(like(domains.name, `__test__%super-admin%${suffix}%`));
  await db.delete(domains).where(inArray(domains.id, [domainId]));
});

/**
 * Le geste que T9.4 écrira : la preuve, puis l'écriture.
 *
 * Il est composé ici parce que ce ticket ne rend aucune action — mais il est
 * déjà le point d'entrée que la garde protège, et c'est lui qu'on frappe.
 */
async function createDomainAsSuperAdmin(name: string) {
  const grant: SuperAdminGrant = await requireSuperAdmin();
  return asSuperAdmin(grant).createDomain({
    name,
    competenceCenterName: "Centre créé",
  });
}

const countDomains = async (name: string): Promise<number> =>
  (await db.select().from(domains).where(eq(domains.name, name))).length;

describe("le droit du super administrateur", () => {
  test("sans cookie, aucun domaine n'est créé", async () => {
    const name = `__test__super-admin__sans-cookie__${suffix}`;
    principal = null;

    // Étape témoin : la cible est vide **avant** le geste.
    expect(await countDomains(name)).toBe(0);

    await expect(createDomainAsSuperAdmin(name)).rejects.toThrow(
      `${REDIRECT}/auth/acces`,
    );

    expect(await countDomains(name)).toBe(0);
  });

  /* **Le cas qui compte, et c'est celui que T9.4 rejouera par l'action.** Un
     responsable de domaine est la personne la plus habilitée du produit : elle
     crée produits, projets et référentiels. Elle ne crée pas d'entreprise —
     `docs/02` §3 réserve le geste au super administrateur, qui est *au-dessus*
     des domaines et n'a pas de ligne `persons`. */
  test("un responsable de domaine ne crée pas de domaine", async () => {
    const name = `__test__super-admin__responsable__${suffix}`;
    principal = { kind: "person", personId: managerId, domainId };

    expect(await countDomains(name)).toBe(0);

    await expect(createDomainAsSuperAdmin(name)).rejects.toThrow(
      `${REDIRECT}/auth/acces`,
    );

    expect(await countDomains(name)).toBe(0);
    // Le cookie reste celui d'une session valide : ce n'est pas l'identité qui
    // a été refusée, c'est l'autorité qui manque.
    expect(await getSuperAdmin()).toBeNull();
  });

  /* La seconde barrière — celle qui vaut dans le temps. Le cookie vit trente
     jours et il est parfaitement valide ; c'est la **relecture de la ligne** qui
     refuse, et sans elle le droit survivrait un mois à son retrait. */
  test("un super administrateur archivé ne crée plus de domaine", async () => {
    const name = `__test__super-admin__archive__${suffix}`;
    principal = { kind: "super_admin", superAdminId: archivedAdminId };

    expect(await countDomains(name)).toBe(0);

    await expect(createDomainAsSuperAdmin(name)).rejects.toThrow(
      `${REDIRECT}/auth/acces`,
    );

    expect(await countDomains(name)).toBe(0);
  });

  /* **La seule mesure qui prouve que la garde sert à quelque chose.** Les trois
     au-dessus prouvent qu'elle ne laisse pas passer ; celle-ci prouve qu'elle
     laisse passer ce qu'elle doit. Une garde qui refuse tout se testerait aussi
     bien sans le produit. */
  test("un super administrateur en exercice crée un domaine", async () => {
    const name = `__test__super-admin__en-exercice__${suffix}`;
    principal = { kind: "super_admin", superAdminId: liveAdminId };

    expect(await countDomains(name)).toBe(0);
    expect((await getSuperAdmin())?.id).toBe(liveAdminId);

    const domain = await createDomainAsSuperAdmin(name);

    try {
      expect(await countDomains(name)).toBe(1);
    } finally {
      await db.delete(domains).where(eq(domains.id, domain.id));
    }
  });
});
