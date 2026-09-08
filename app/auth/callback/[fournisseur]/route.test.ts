/**
 * Les tests du rappel — **l'ordre des quatre temps, et lui seul**.
 *
 * **Ce fichier existe parce qu'une mise en défaut n'a rien fait tomber.**
 * Le 08/09/2026, l'acceptation a été déplacée **avant** `resolvePrincipal` — la
 * contre-épreuve que la fiche de T11.2 prescrit pour l'arbitrage (4) — et les
 * 1 884 tests sont restés verts. La leçon de T9.6 s'applique mot pour mot :
 * *une contre-épreuve qui ne fait tomber aucun test ne dit pas que la garde est
 * inutile ; elle dit que le test mesurait autre chose*. Le rappel n'avait aucun
 * test, et l'ordre des six règles n'était tenu que par la lecture du code.
 *
 * **Le réseau seul est simulé.** `completeAuthorization` rend des claims
 * forgés — c'est la frontière qu'`oidc.ts` a été écrit pour offrir. Tout le
 * reste est réel : la base, `resolvePrincipal`, `redeemInvitation`, et les
 * cookies, scellés par le vrai HMAC.
 *
 * **Ce qui se mesure ici ne se lit jamais dans le code de réponse.** Les sept
 * refus rendent la même redirection qu'un succès rendrait vers `/` : *qu'un
 * jeton soit refusé se lit dans la réponse, mais qu'aucune session n'ait été
 * posée se lit dans le cookie et dans la base.*
 */

import { eq, inArray } from "drizzle-orm";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import {
  HANDSHAKE_COOKIE,
  INVITATION_COOKIE,
  SESSION_COOKIE,
  sealHandshake,
  sealInvitation,
} from "@/lib/auth/cookie";
import {
  invitationExpiry,
  newInvitationToken,
} from "@/lib/auth/invitation";
import type { VerifiedClaims } from "@/lib/auth/oidc";
import { db } from "@/lib/db/client";
import {
  asSuperAdmin,
  forDomain,
  withoutAnySession,
  type ScopedTable,
} from "@/lib/db/scoped";
import {
  domainIdentities,
  domains,
  invitations,
  persons,
} from "@/lib/db/schema";

/** Ce que le fournisseur rendra — la seule valeur que le test pilote. */
let nextClaims: VerifiedClaims | null = null;

vi.mock("@/lib/auth/oidc", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/oidc")>();
  return {
    ...actual,
    completeAuthorization: async () => {
      if (!nextClaims) throw new Error("jeton refusé");
      return nextClaims;
    },
  };
});

const { GET } = await import("./route");

const outsideAnySession = asSuperAdmin(withoutAnySession("fixture"));
const suffix = Math.random().toString(36).slice(2, 10);
const CLIENT_HD = `rappel-${suffix}.example.test`;

const teardownOrder: ScopedTable[] = [invitations, persons, domainIdentities];

let domainId: string;

const HANDSHAKE = {
  provider: "google",
  state: "s-1",
  nonce: "n-1",
  codeVerifier: "v-1",
};

function claims(overrides: Partial<VerifiedClaims> = {}): VerifiedClaims {
  return {
    provider: "google",
    subject: `sub-${suffix}`,
    email: `qui.${suffix}@cliente.test`,
    enterprise: CLIENT_HD,
    ...overrides,
  };
}

/** Le rappel, frappé comme le navigateur le frappe : des cookies, une adresse. */
async function callback(options: { invitation?: string } = {}) {
  const cookies = [`${HANDSHAKE_COOKIE}=${sealHandshake(HANDSHAKE)}`];
  if (options.invitation) {
    cookies.push(
      `${INVITATION_COOKIE}=${sealInvitation({ token: options.invitation })}`,
    );
  }

  const request = new NextRequest(
    "http://localhost:3000/auth/callback/google?code=c&state=s-1",
    { headers: { cookie: cookies.join("; ") } },
  );

  return GET(request, { params: Promise.resolve({ fournisseur: "google" }) });
}

/** Le compte, **relu en base** — le seul verdict qui compte. */
async function accountOf(personId: string) {
  const rows = await db.select().from(persons).where(eq(persons.id, personId));
  return {
    hasAccess: rows[0]?.hasAccess ?? null,
    domainRole: rows[0]?.domainRole ?? null,
  };
}

/**
 * Une personne sans accès, et l'invitation qui la vise — **une par cas**.
 * `invitations_pending_unique` porte sur `(domain_id, person_id)` : deux cas qui
 * partageraient une personne se gêneraient par l'index qu'ils éprouvent.
 */
async function invited(
  label: string,
  options: { archived?: boolean; expiresAt?: Date; revoked?: boolean } = {},
) {
  const scope = forDomain({ domainId });
  const email = `${label}.${suffix}@cliente.test`;

  const person = await scope.insert(persons, {
    source: "manual",
    fullName: `Invité ${label}`,
    email,
    kind: "center",
    hasAccess: false,
  });
  if (options.archived) await scope.archive(persons, person.id);

  const { token, tokenHash } = newInvitationToken();
  const row = await scope.insert(invitations, {
    personId: person.id,
    email,
    role: "member",
    tokenHash,
    expiresAt: options.expiresAt ?? invitationExpiry(),
  });
  if (options.revoked) {
    await scope.update(invitations, row.id, { revokedAt: new Date() });
  }

  return { person, token, email, invitationId: row.id };
}

beforeAll(async () => {
  const domain = await outsideAnySession.createDomain({
    name: `__test__rappel__${suffix}`,
    competenceCenterName: "Centre du rappel",
  });
  domainId = domain.id;

  await forDomain({ domainId }).insert(domainIdentities, {
    provider: "google",
    value: CLIENT_HD,
  });
}, 180_000);

afterAll(async () => {
  if (!domainId) return;
  for (const table of teardownOrder) {
    await db.delete(table).where(inArray(table.domainId, [domainId]));
  }
  await db.delete(domains).where(inArray(domains.id, [domainId]));
});

/* ==========================================================================
   Les trois temps d'avant T11.2
   ========================================================================== */

describe("un refus ne pose aucun cookie de session", () => {
  test("un jeton que le fournisseur refuse", async () => {
    nextClaims = null;
    const response = await callback();

    expect(response.headers.get("location")).toContain("/auth/acces");
    expect(response.cookies.get(SESSION_COOKIE)?.value).toBeUndefined();
  });

  test("une personne sans accès, et sans invitation à faire valoir", async () => {
    const target = await invited("sans-invitation");
    nextClaims = claims({ email: target.email });

    /* Aucun cookie d'invitation : le lien n'accompagne pas la connexion. */
    const response = await callback();

    expect(response.headers.get("location")).toContain("/auth/acces");
    expect(response.cookies.get(SESSION_COOKIE)?.value).toBeUndefined();
    expect(await accountOf(target.person.id)).toMatchObject({
      hasAccess: false,
    });
  });

  test("une entreprise qui n'est cliente de personne", async () => {
    nextClaims = claims({ enterprise: `nulle-part-${suffix}.test` });
    const response = await callback();

    expect(response.cookies.get(SESSION_COOKIE)?.value).toBeUndefined();
  });
});

/* ==========================================================================
   Le quatrième temps — T11.2, et l'ordre qui le tient
   ========================================================================== */

describe("l'acceptation, et ce qu'elle ouvre", () => {
  test("un lien valide ouvre la session, et pose le couple en base", async () => {
    const target = await invited("acceptante");
    nextClaims = claims({ email: target.email });

    /* Étape témoin : sans elle, un cookie posé ne dit pas ce qui a été écrit. */
    expect(await accountOf(target.person.id)).toMatchObject({
      hasAccess: false,
      domainRole: null,
    });

    const response = await callback({ invitation: target.token });

    expect(response.headers.get("location")).toBe("http://localhost:3000/");
    expect(response.cookies.get(SESSION_COOKIE)?.value).toBeTruthy();

    /* **Le décompte en base tranche**, jamais l'en-tête. */
    expect(await accountOf(target.person.id)).toMatchObject({
      hasAccess: true,
      domainRole: "member",
    });

    const rows = await db
      .select()
      .from(invitations)
      .where(eq(invitations.id, target.invitationId));
    expect(rows[0]?.acceptedAt).toBeInstanceOf(Date);
  });

  test("le cookie d'invitation s'efface — accepté comme refusé", async () => {
    const accepted = await invited("efface-succes");
    nextClaims = claims({ email: accepted.email });
    const ok = await callback({ invitation: accepted.token });
    expect(ok.cookies.get(INVITATION_COOKIE)?.value).toBe("");

    const revoked = await invited("efface-refus", { revoked: true });
    nextClaims = claims({ email: revoked.email });
    const ko = await callback({ invitation: revoked.token });
    expect(ko.cookies.get(INVITATION_COOKIE)?.value).toBe("");
    expect(ko.cookies.get(SESSION_COOKIE)?.value).toBeUndefined();
  });

  test("un lien révoqué n'ouvre rien, et rien n'est écrit", async () => {
    const target = await invited("revoquee-rappel", { revoked: true });
    nextClaims = claims({ email: target.email });

    const response = await callback({ invitation: target.token });

    expect(response.headers.get("location")).toContain("/auth/acces");
    expect(response.cookies.get(SESSION_COOKIE)?.value).toBeUndefined();
    expect(await accountOf(target.person.id)).toMatchObject({
      hasAccess: false,
    });
  });
});

/* ==========================================================================
   L'arbitrage (4) — et c'est ce bloc qui tombe si l'ordre s'inverse
   ========================================================================== */

describe("l'acceptation vient après les six règles, jamais avant", () => {
  /**
   * **Personne d'archivé ne ressuscite.**
   *
   * `resolvePrincipal` rend `person_archived`, qui n'est pas `no_access` : le
   * lien n'est donc **jamais présenté**.
   *
   * **Ce test ne tombe pas quand l'ordre s'inverse, et c'est mesuré** (08/09) :
   * `redeemInvitation` refuse l'archivée de son côté, si bien que la garantie
   * est doublée. Il fixe donc la propriété — *personne d'archivé ne ressuscite* —
   * et non l'ordre qui la produit. Celui-là n'a qu'un seul témoin, le suivant.
   */
  test("une personne archivée, munie d'un lien valide, reste dehors", async () => {
    const target = await invited("archivee-rappel", { archived: true });
    nextClaims = claims({ email: target.email });

    const response = await callback({ invitation: target.token });

    expect(response.cookies.get(SESSION_COOKIE)?.value).toBeUndefined();
    expect(await accountOf(target.person.id)).toMatchObject({
      hasAccess: false,
    });
  });

  /**
   * **Le refus qui n'existe que grâce à l'ordre.**
   *
   * `redeemInvitation` **ne juge pas** l'état du domaine — c'est écrit dans son
   * fichier de tests, et c'est délibéré. Le septième refus d'`entry.ts`,
   * `domain_closed`, est donc la **seule** barrière ici : ce test est celui que
   * la mise en défaut de l'arbitrage (4) doit faire tomber, et il ne se double
   * nulle part.
   */
  test("un domaine suspendu n'ouvre pas, même avec un lien valide", async () => {
    const target = await invited("domaine-ferme-rappel");
    nextClaims = claims({ email: target.email });

    await db
      .update(domains)
      .set({ status: "suspended" })
      .where(eq(domains.id, domainId));

    try {
      const response = await callback({ invitation: target.token });

      expect(response.headers.get("location")).toContain("/auth/acces");
      expect(response.cookies.get(SESSION_COOKIE)?.value).toBeUndefined();
      expect(await accountOf(target.person.id)).toMatchObject({
        hasAccess: false,
      });
    } finally {
      await db
        .update(domains)
        .set({ status: "active" })
        .where(eq(domains.id, domainId));
    }
  });
});
