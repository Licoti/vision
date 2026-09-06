/**
 * Les tests des six règles d'entrée — **le droit s'éprouve par l'action**.
 *
 * C'est le premier chantier où une erreur silencieuse ouvre les données d'une
 * entreprise à une autre. Ces tests interrogent donc `resolvePrincipal`, qui
 * *est* le point d'entrée : la base est réelle, les lectures sont les vraies, et
 * aucune connexion n'est simulée — les claims sont forgés, ce qui est
 * exactement la forme que la fiche prescrit.
 *
 * **La limite de mesure, écrite avant d'être rencontrée** (`tickets-C9.md`).
 * L'arbitrage (2) refuse les comptes sans `hd` ni `tid`, et une adresse
 * personnelle n'en porte aucun : le chemin d'un membre de domaine **ne se
 * parcourt pas au navigateur**. Il se mesure ici, sur claims forgés — et ce
 * n'est pas un pis-aller : aucun des sept refus ne dépend d'une connexion
 * réelle, et le jour où un vrai client existe, son `hd` entre dans
 * `domain_identities` et le chemin s'ouvre sans une ligne de code.
 *
 * **Chaque refus porte sa cause, et chaque cause a son test.** C'est ce qui
 * rend la mise en défaut possible : une règle neutralisée doit faire tomber
 * *son* test et rien d'autre. Un refus qui en entraîne six autres n'a pas été
 * isolé.
 */

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { resolvePrincipal } from "./entry";
import type { VerifiedClaims } from "./oidc";
import { db } from "../db/client";
import { forDomain, superAdmin, type ScopedTable } from "../db/scoped";
import { domainIdentities, domains, persons, superAdmins } from "../db/schema";

const suffix = Math.random().toString(36).slice(2, 10);

/** L'entreprise vérifiée du domaine ouvert — un `hd` Google. */
const CLIENT_HD = `cliente-${suffix}.example.test`;
/** Celle d'un domaine suspendu : cliente hier, fermée aujourd'hui. */
const CLOSED_HD = `suspendue-${suffix}.example.test`;
/** Une entreprise qui n'est cliente de personne. */
const STRANGER_HD = `inconnue-${suffix}.example.test`;

const teardownOrder: ScopedTable[] = [persons, domainIdentities];

let openDomainId: string;
let closedDomainId: string;
let neighbourDomainId: string;
let superAdminId: string;

const email = {
  member: `membre.${suffix}@cliente.test`,
  withoutAccess: `sans-acces.${suffix}@cliente.test`,
  archived: `archivee.${suffix}@cliente.test`,
  inactive: `inactive.${suffix}@cliente.test`,
  directory: `annuaire.${suffix}@cliente.test`,
  neighbour: `voisine.${suffix}@cliente.test`,
  admin: `super.${suffix}@ailleurs.test`,
  stranger: `personne.${suffix}@cliente.test`,
};

/** L'identifiant que le fournisseur rend pour la personne d'annuaire. */
const DIRECTORY_SUBJECT = `oidc-sub-${suffix}`;

/** Des claims vérifiés, tels qu'`oidc.ts` les rendrait. */
function claims(overrides: Partial<VerifiedClaims> = {}): VerifiedClaims {
  return {
    provider: "google",
    subject: `sub-${suffix}`,
    email: email.member,
    enterprise: CLIENT_HD,
    ...overrides,
  };
}

beforeAll(async () => {
  /* Trois domaines : l'ouvert, le suspendu, et un voisin qui ne porte aucune
     identité — c'est lui qui éprouve l'étanchéité. */
  const open = await superAdmin.createDomain({
    name: `__test__entry__ouvert__${suffix}`,
    competenceCenterName: "Centre ouvert",
  });
  openDomainId = open.id;

  const closed = await superAdmin.createDomain({
    name: `__test__entry__suspendu__${suffix}`,
    competenceCenterName: "Centre suspendu",
  });
  closedDomainId = closed.id;
  await db
    .update(domains)
    .set({ status: "suspended" })
    .where(eq(domains.id, closed.id));

  const neighbour = await superAdmin.createDomain({
    name: `__test__entry__voisin__${suffix}`,
    competenceCenterName: "Centre voisin",
  });
  neighbourDomainId = neighbour.id;

  const open_ = forDomain({ domainId: openDomainId });
  const closed_ = forDomain({ domainId: closedDomainId });
  const neighbour_ = forDomain({ domainId: neighbourDomainId });

  await open_.insert(domainIdentities, {
    provider: "google",
    value: CLIENT_HD,
  });
  await closed_.insert(domainIdentities, {
    provider: "google",
    value: CLOSED_HD,
  });

  await open_.insert(persons, {
    source: "manual",
    fullName: "Chloé Membre",
    email: email.member,
    kind: "center",
    hasAccess: true,
    domainRole: "member",
  });
  await open_.insert(persons, {
    source: "manual",
    fullName: "Denis SansAcces",
    email: email.withoutAccess,
    kind: "center",
    hasAccess: false,
  });
  await open_.insert(persons, {
    source: "manual",
    fullName: "Zoé Partie",
    email: email.inactive,
    kind: "center",
    hasAccess: true,
    domainRole: "member",
    isActive: false,
  });

  const archived = await open_.insert(persons, {
    source: "manual",
    fullName: "Ancienne Personne",
    email: email.archived,
    kind: "center",
    hasAccess: true,
    domainRole: "member",
  });
  await open_.archive(persons, archived.id);

  /* Une ligne d'annuaire : la seule qui puisse porter le couple
     (fournisseur, identifiant), `persons_external_id_requires_directory`
     l'exigeant. Son e-mail est **celui d'une personne d'un autre domaine**,
     pour que le rapprochement par identifiant se distingue du repli. */
  await open_.insert(persons, {
    source: "directory",
    externalId: DIRECTORY_SUBJECT,
    identityProvider: "google",
    fullName: "Ida Annuaire",
    email: email.directory,
    kind: "center",
    hasAccess: true,
    domainRole: "domain_manager",
  });

  /* La même adresse, dans le domaine voisin : c'est l'étanchéité qui se mesure,
     pas la présence d'une ligne. */
  await neighbour_.insert(persons, {
    source: "manual",
    fullName: "Voisine Homonyme",
    email: email.neighbour,
    kind: "center",
    hasAccess: true,
    domainRole: "domain_manager",
  });

  const [admin] = await db
    .insert(superAdmins)
    .values({ email: email.admin, fullName: "Super Administratrice" })
    .returning();
  superAdminId = admin!.id;
});

afterAll(async () => {
  const ids = [openDomainId, closedDomainId, neighbourDomainId].filter(Boolean);
  if (ids.length > 0) {
    for (const table of teardownOrder) {
      await db.delete(table).where(inArray(table.domainId, ids));
    }
    await db.delete(domains).where(inArray(domains.id, ids));
  }
  if (superAdminId) {
    await db.delete(superAdmins).where(eq(superAdmins.id, superAdminId));
  }
});

/* ==========================================================================
   Règle 2 — `super_admins` est consulté en premier, et l'ordre est la règle
   ========================================================================== */

describe("la règle 2, avant toutes les autres", () => {
  test("un super administrateur entre sans entreprise vérifiée", async () => {
    const outcome = await resolvePrincipal(
      claims({ email: email.admin, enterprise: null }),
    );

    expect(outcome.granted).toEqual({
      kind: "super_admin",
      superAdminId,
    });
  });

  /* **C'est l'ordre qui se mesure ici, pas le résultat.** Avec une entreprise
     cliente et une ligne `persons`, les deux chemins aboutiraient ; seul celui
     que la règle 2 impose rend un principal de super administrateur. */
  test("elle passe avant le domaine, même quand le domaine aboutirait", async () => {
    await db
      .update(persons)
      .set({ email: email.admin })
      .where(eq(persons.domainId, neighbourDomainId));

    const outcome = await resolvePrincipal(claims({ email: email.admin }));

    expect(outcome.granted?.kind).toBe("super_admin");

    await db
      .update(persons)
      .set({ email: email.neighbour })
      .where(eq(persons.domainId, neighbourDomainId));
  });

  test("une adresse inconnue de la table ne devient pas super administratrice", async () => {
    const outcome = await resolvePrincipal(
      claims({ email: email.stranger, enterprise: null }),
    );

    expect(outcome.granted).toBeUndefined();
  });
});

/* ==========================================================================
   Le cas nominal, et le rapprochement en deux temps de la règle 6
   ========================================================================== */

describe("ce qui ouvre une session", () => {
  test("une entreprise cliente et une personne à qui l'accès est accordé", async () => {
    const outcome = await resolvePrincipal(claims());

    expect(outcome.refused).toBeUndefined();
    expect(outcome.granted?.kind).toBe("person");
    expect(
      outcome.granted?.kind === "person" ? outcome.granted.domainId : null,
    ).toBe(openDomainId);
  });

  test("l'e-mail se rapproche sans égard à la casse", async () => {
    const outcome = await resolvePrincipal(
      claims({ email: email.member.toUpperCase() }),
    );

    expect(outcome.granted?.kind).toBe("person");
  });

  /* Le couple (fournisseur, identifiant) prime sur l'e-mail : les claims
     portent ici l'identifiant d'Ida et l'adresse de Chloé, et c'est Ida qui
     entre. Sans le premier temps, ce serait Chloé — deux fournisseurs peuvent
     rendre le même identifiant, et c'est la raison de la colonne. */
  test("l'identifiant du fournisseur prime sur le repli par e-mail", async () => {
    const outcome = await resolvePrincipal(
      claims({ subject: DIRECTORY_SUBJECT, email: email.member }),
    );

    const found =
      outcome.granted?.kind === "person"
        ? await forDomain({ domainId: openDomainId }).find(
            persons,
            outcome.granted.personId,
          )
        : null;

    expect(found?.fullName).toBe("Ida Annuaire");
  });

  test("le même identifiant chez l'autre fournisseur ne rapproche rien", async () => {
    const outcome = await resolvePrincipal(
      claims({
        provider: "microsoft",
        subject: DIRECTORY_SUBJECT,
        email: null,
        enterprise: CLIENT_HD,
      }),
    );

    /* `microsoft` + ce `hd` ne désigne aucun domaine : l'unicité de
       `domain_identities` porte sur le couple, pas sur la valeur seule. */
    expect(outcome.refused).toBe("unknown_enterprise");
    expect(outcome.granted).toBeUndefined();
  });
});

/* ==========================================================================
   Les sept refus, chacun isolé
   ========================================================================== */

describe("ce qui referme la porte", () => {
  test("règle 4 — ni `hd` ni `tid`", async () => {
    const outcome = await resolvePrincipal(
      claims({ email: email.stranger, enterprise: null }),
    );

    expect(outcome.refused).toBe("no_enterprise");
    expect(outcome.granted).toBeUndefined();
  });

  test("règle 5 — l'entreprise n'est pas cliente", async () => {
    const outcome = await resolvePrincipal(claims({ enterprise: STRANGER_HD }));

    expect(outcome.refused).toBe("unknown_enterprise");
  });

  /* Le point qu'`ETAT.md` portait depuis T9.1, refermé : **non**. Le domaine
     existe, son identité est reconnue, et la porte reste close. */
  test("un domaine suspendu n'ouvre pas de session", async () => {
    const outcome = await resolvePrincipal(claims({ enterprise: CLOSED_HD }));

    expect(outcome.refused).toBe("domain_closed");
    expect(outcome.granted).toBeUndefined();
  });

  test("règle 6 — aucune ligne `persons` dans le domaine désigné", async () => {
    const outcome = await resolvePrincipal(claims({ email: email.stranger }));

    expect(outcome.refused).toBe("no_person");
    expect(outcome.granted).toBeUndefined();
  });

  /* L'étanchéité : la personne existe, avec l'accès et le rôle — dans un autre
     domaine. Le domaine vient du jeton, pas de la recherche. */
  test("une personne d'un autre domaine n'est pas trouvée", async () => {
    const outcome = await resolvePrincipal(claims({ email: email.neighbour }));

    expect(outcome.refused).toBe("no_person");
    expect(outcome.granted).toBeUndefined();
  });

  test("règle 6 — une personne archivée", async () => {
    const outcome = await resolvePrincipal(claims({ email: email.archived }));

    expect(outcome.refused).toBe("person_archived");
    expect(outcome.granted).toBeUndefined();
  });

  test("règle 6 — une personne désactivée", async () => {
    const outcome = await resolvePrincipal(claims({ email: email.inactive }));

    expect(outcome.refused).toBe("person_inactive");
    expect(outcome.granted).toBeUndefined();
  });

  /* D19 — être référencé et pouvoir se connecter sont deux choses distinctes. */
  test("règle 6 — `has_access` est faux", async () => {
    const outcome = await resolvePrincipal(
      claims({ email: email.withoutAccess }),
    );

    expect(outcome.refused).toBe("no_access");
    expect(outcome.granted).toBeUndefined();
  });

});
