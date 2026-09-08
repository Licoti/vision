/**
 * Les tests de l'invitation — T11.2.
 *
 * **La forme d'`entry.test.ts`, et pour la même raison** : `redeemInvitation`
 * est un point d'entrée. La base est réelle, les lectures sont les vraies, et
 * aucune connexion n'est simulée — les claims sont forgés, ce qui est la seule
 * façon d'atteindre ce chemin : une adresse personnelle ne porte ni `hd` ni
 * `tid` (arbitrage (2) de C9), et le parcours d'un membre de domaine ne se fait
 * pas au navigateur.
 *
 * **Chaque refus porte sa cause, et chaque cause a son test.** Une règle
 * neutralisée doit faire tomber *son* test et rien d'autre — un refus qui en
 * entraîne six autres n'a pas été isolé.
 *
 * **Ce qui n'est pas testé ici** : que le callback n'appelle ce module que sur
 * `no_access`. C'est l'arbitrage (4), et il vit dans
 * `app/auth/callback/[fournisseur]/route.ts` ; sa mise en défaut consiste à
 * déplacer l'appel avant `resolvePrincipal`, et elle se rapporte à la main.
 */

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import {
  hashInvitationToken,
  INVITATION_TTL_DAYS,
  invitationExpiry,
  invitationLink,
  InvitationLinkError,
  newInvitationToken,
  redeemInvitation,
} from "./invitation";
import type { VerifiedClaims } from "./oidc";
import { db } from "../db/client";
import {
  asSuperAdmin,
  forDomain,
  withoutAnySession,
  type ScopedTable,
} from "../db/scoped";
import {
  domainIdentities,
  domains,
  invitations,
  persons,
} from "../db/schema";

const outsideAnySession = asSuperAdmin(withoutAnySession("fixture"));

const suffix = Math.random().toString(36).slice(2, 10);

const CLIENT_HD = `invitee-${suffix}.example.test`;
const OTHER_HD = `voisine-${suffix}.example.test`;

/* `invitations` d'abord : elle retient `persons` par une clé `restrict`. */
const teardownOrder: ScopedTable[] = [invitations, persons, domainIdentities];

let domainId: string;
let otherDomainId: string;

function claims(overrides: Partial<VerifiedClaims> = {}): VerifiedClaims {
  return {
    provider: "google",
    subject: `sub-${suffix}`,
    email: `invitee.${suffix}@cliente.test`,
    enterprise: CLIENT_HD,
    ...overrides,
  };
}

/**
 * Une personne sans accès, et l'invitation qui la vise — **une par cas**.
 *
 * `invitations_pending_unique` porte sur `(domain_id, person_id)` : deux cas qui
 * partageraient une personne se gêneraient par l'index qu'ils éprouvent, et le
 * second tomberait pour la raison du premier. C'est le couplage par l'ordre que
 * T11.1 a mesuré, et chaque cas crée donc sa propre personne.
 */
async function invite(
  label: string,
  options: {
    scope?: ReturnType<typeof forDomain>;
    email?: string;
    role?: "domain_manager" | "member";
    expiresAt?: Date;
    revokedAt?: Date | null;
    acceptedAt?: Date | null;
    archived?: boolean;
    isActive?: boolean;
  } = {},
) {
  const scope = options.scope ?? forDomain({ domainId });
  const address = options.email ?? `${label}.${suffix}@cliente.test`;

  const person = await scope.insert(persons, {
    source: "manual",
    fullName: `Invité ${label}`,
    email: address,
    kind: "center",
    hasAccess: false,
    ...(options.isActive === false ? { isActive: false } : {}),
  });

  if (options.archived) await scope.archive(persons, person.id);

  const { token, tokenHash } = newInvitationToken();

  const row = await scope.insert(invitations, {
    personId: person.id,
    email: address,
    role: options.role ?? "member",
    tokenHash,
    expiresAt: options.expiresAt ?? invitationExpiry(),
  });

  if (options.revokedAt || options.acceptedAt) {
    await scope.update(invitations, row.id, {
      ...(options.revokedAt ? { revokedAt: options.revokedAt } : {}),
      ...(options.acceptedAt ? { acceptedAt: options.acceptedAt } : {}),
    });
  }

  return { person, token, invitationId: row.id, email: address };
}

/** Ce que la base dit du compte — la seule mesure qui tranche. */
async function accountOf(personId: string) {
  const rows = await db.select().from(persons).where(eq(persons.id, personId));
  const row = rows[0];
  return {
    hasAccess: row?.hasAccess ?? null,
    domainRole: row?.domainRole ?? null,
  };
}

async function invitationRow(id: string) {
  const rows = await db
    .select()
    .from(invitations)
    .where(eq(invitations.id, id));
  return rows[0];
}

beforeAll(async () => {
  const client = await outsideAnySession.createDomain({
    name: `__test__invitation__${suffix}`,
    competenceCenterName: "Centre invité",
  });
  domainId = client.id;

  const other = await outsideAnySession.createDomain({
    name: `__test__invitation__voisin__${suffix}`,
    competenceCenterName: "Centre voisin",
  });
  otherDomainId = other.id;

  await forDomain({ domainId }).insert(domainIdentities, {
    provider: "google",
    value: CLIENT_HD,
  });
  await forDomain({ domainId: otherDomainId }).insert(domainIdentities, {
    provider: "google",
    value: OTHER_HD,
  });
}, 180_000);

afterAll(async () => {
  const ids = [domainId, otherDomainId].filter(Boolean);
  if (ids.length === 0) return;

  for (const table of teardownOrder) {
    await db.delete(table).where(inArray(table.domainId, ids));
  }
  await db.delete(domains).where(inArray(domains.id, ids));
});

/* ==========================================================================
   Le jeton
   ========================================================================== */

describe("le jeton, et ce que la base en connaît", () => {
  test("deux jetons ne se ressemblent pas, et l'empreinte est stable", () => {
    const first = newInvitationToken();
    const second = newInvitationToken();

    expect(first.token).not.toBe(second.token);
    expect(first.tokenHash).not.toBe(second.tokenHash);
    expect(first.tokenHash).toBe(hashInvitationToken(first.token));
    /* SHA-256 en hexadécimal : soixante-quatre caractères, jamais le jeton. */
    expect(first.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(first.tokenHash).not.toContain(first.token);
  });

  test("un lien vaut sept jours, et la valeur est écrite une fois", () => {
    const now = new Date("2026-09-08T12:00:00.000Z");
    const expiry = invitationExpiry(now);

    expect(INVITATION_TTL_DAYS).toBe(7);
    expect(expiry.getTime() - now.getTime()).toBe(
      INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000,
    );
  });
});

describe("le lien à transmettre", () => {
  test("il porte l'hôte d'`AUTH_URL`, et le jeton", () => {
    const link = invitationLink("jeton-abc");

    expect(link).toContain("/invitation/jeton-abc");
    expect(link.startsWith("http")).toBe(true);
  });

  /* **Un lien sans hôte ne mène nulle part**, et le silence coûterait ici
     exactement ce que le lien sert à éviter. */
  test("sans `AUTH_URL`, il lève plutôt que de rendre un chemin nu", () => {
    const saved = process.env.AUTH_URL;
    delete process.env.AUTH_URL;

    try {
      expect(() => invitationLink("jeton-abc")).toThrow(InvitationLinkError);
    } finally {
      process.env.AUTH_URL = saved;
    }
  });
});

/* ==========================================================================
   Les sept refus, isolés
   ========================================================================== */

describe("redeemInvitation — les sept refus, chacun le sien", () => {
  test("un jeton qu'aucune ligne ne porte", async () => {
    const outcome = await redeemInvitation(`inventé-${suffix}`, claims());

    expect(outcome.refused).toBe("unknown");
    expect(outcome.granted).toBeUndefined();
  });

  test("un lien révoqué", async () => {
    const invited = await invite("revoque", { revokedAt: new Date() });

    const outcome = await redeemInvitation(
      invited.token,
      claims({ email: invited.email }),
    );

    expect(outcome.refused).toBe("revoked");
    expect(await accountOf(invited.person.id)).toMatchObject({
      hasAccess: false,
    });
  });

  test("un lien qui a déjà servi — un lien vaut une fois", async () => {
    const invited = await invite("deja-accepte", { acceptedAt: new Date() });

    const outcome = await redeemInvitation(
      invited.token,
      claims({ email: invited.email }),
    );

    expect(outcome.refused).toBe("already_accepted");
  });

  test("un lien périmé", async () => {
    const invited = await invite("perime", {
      expiresAt: new Date(Date.now() - 1_000),
    });

    const outcome = await redeemInvitation(
      invited.token,
      claims({ email: invited.email }),
    );

    expect(outcome.refused).toBe("expired");
    expect(await accountOf(invited.person.id)).toMatchObject({
      hasAccess: false,
    });
  });

  /* **L'adresse confrontée est celle de l'invitation, pas celle de la ligne
     `persons`** : elle est copiée au moment du geste (T11.1), pour qu'un profil
     corrigé ensuite ne déplace pas la cible d'un lien déjà parti. */
  test("un e-mail vérifié qui n'est pas celui qu'on a invité", async () => {
    const invited = await invite("autre-adresse");

    const outcome = await redeemInvitation(
      invited.token,
      claims({ email: `quelquun.dautre.${suffix}@cliente.test` }),
    );

    expect(outcome.refused).toBe("email_mismatch");
    expect(await accountOf(invited.person.id)).toMatchObject({
      hasAccess: false,
    });
  });

  /* Un fournisseur qui ne vérifie pas l'adresse rend `email: null`
     (`oidc.ts`) : une adresse non vérifiée ne rapproche rien. */
  test("un jeton sans e-mail vérifié", async () => {
    const invited = await invite("sans-email");

    const outcome = await redeemInvitation(
      invited.token,
      claims({ email: null }),
    );

    expect(outcome.refused).toBe("email_mismatch");
  });

  /* **Le domaine vient du jeton, et de lui seul.** Une invitation ne désigne
     jamais un domaine à la place du claim vérifié (arbitrage (2) de C9) : le
     `hd` d'une autre entreprise ne l'ouvre pas, quand bien même le lien serait
     authentique et l'adresse la bonne. */
  test("une entreprise vérifiée qui n'est pas celle de l'invitation", async () => {
    const invited = await invite("autre-domaine");

    const outcome = await redeemInvitation(
      invited.token,
      claims({ email: invited.email, enterprise: OTHER_HD }),
    );

    expect(outcome.refused).toBe("domain_mismatch");
    expect(await accountOf(invited.person.id)).toMatchObject({
      hasAccess: false,
    });
  });

  test("une entreprise que personne ne réclame", async () => {
    const invited = await invite("domaine-inconnu");

    const outcome = await redeemInvitation(
      invited.token,
      claims({
        email: invited.email,
        enterprise: `nulle-part-${suffix}.example.test`,
      }),
    );

    expect(outcome.refused).toBe("domain_mismatch");
  });

  test("un jeton sans entreprise du tout", async () => {
    const invited = await invite("sans-entreprise");

    const outcome = await redeemInvitation(
      invited.token,
      claims({ email: invited.email, enterprise: null }),
    );

    expect(outcome.refused).toBe("domain_mismatch");
  });

  /* **Personne d'archivé ne ressuscite** : l'invitation ne répare que
     `no_access`, jamais `person_archived`. */
  test("une personne archivée depuis l'envoi", async () => {
    const invited = await invite("archivee", { archived: true });

    const outcome = await redeemInvitation(
      invited.token,
      claims({ email: invited.email }),
    );

    expect(outcome.refused).toBe("person_unavailable");
    expect(await accountOf(invited.person.id)).toMatchObject({
      hasAccess: false,
    });
  });

  test("une personne désactivée depuis l'envoi", async () => {
    const invited = await invite("inactive", { isActive: false });

    const outcome = await redeemInvitation(
      invited.token,
      claims({ email: invited.email }),
    );

    expect(outcome.refused).toBe("person_unavailable");
  });
});

/* ==========================================================================
   L'acceptation — le décompte en base tranche
   ========================================================================== */

/* ==========================================================================
   Ce que ce module NE juge pas — et c'est l'ordre qui protège
   ========================================================================== */

describe("le domaine fermé n'est pas jugé ici, et c'est l'arbitrage (4)", () => {
  /**
   * **Un domaine suspendu passe `redeemInvitation`, et c'est voulu.**
   *
   * Le septième refus d'`entry.ts` — `domain_closed` — vit **avant** ce module :
   * le callback n'appelle l'acceptation que sur `no_access`, et un domaine
   * suspendu ne rend jamais `no_access`. Doubler le contrôle ici serait réécrire
   * une règle mesurée, et surtout **rendre la mise en défaut de l'arbitrage (4)
   * impossible** : c'est précisément parce que ce module ne juge pas l'état du
   * domaine que déplacer l'acceptation avant `resolvePrincipal` ouvrirait une
   * porte, et donc que l'ordre se mesure.
   *
   * **Ce test fixe le contrat plutôt que la vertu.** Il tombe le jour où
   * quelqu'un ajoute le contrôle ici — et ce jour-là, il faudra relire
   * l'arbitrage (4) avant de le corriger, pas après.
   *
   * La seconde barrière reste posée : `loadSession` refait les quatre refus à
   * **chaque requête** et refuse un domaine suspendu. Un cookie posé par erreur
   * n'ouvrirait donc aucun écran.
   */
  test("un domaine suspendu ne l'arrête pas — c'est `entry.ts` qui l'arrête", async () => {
    const invited = await invite("domaine-suspendu");

    await db
      .update(domains)
      .set({ status: "suspended" })
      .where(eq(domains.id, domainId));

    try {
      const outcome = await redeemInvitation(
        invited.token,
        claims({ email: invited.email }),
      );

      expect(outcome.granted).toBeDefined();
    } finally {
      await db
        .update(domains)
        .set({ status: "active" })
        .where(eq(domains.id, domainId));
    }
  });
});

describe("redeemInvitation — ce que l'acceptation écrit", () => {
  test("le couple et la date, et le principal qui en découle", async () => {
    const invited = await invite("acceptante", { role: "domain_manager" });

    /* **Étape témoin** : sans elle, un test qui passe ne dit pas si le geste a
       écrit quoi que ce soit. */
    expect(await accountOf(invited.person.id)).toMatchObject({
      hasAccess: false,
      domainRole: null,
    });

    const outcome = await redeemInvitation(
      invited.token,
      claims({ email: invited.email }),
    );

    expect(outcome.granted).toEqual({
      kind: "person",
      personId: invited.person.id,
      domainId,
    });

    expect(await accountOf(invited.person.id)).toMatchObject({
      hasAccess: true,
      domainRole: "domain_manager",
    });

    const row = await invitationRow(invited.invitationId);
    expect(row?.acceptedAt).toBeInstanceOf(Date);
    expect(row?.revokedAt).toBeNull();
  });

  /* L'adresse se compare en minuscules des deux côtés — la règle des quatre
     autres lectures d'identité. */
  test("la casse de l'adresse ne fait pas échouer un lien légitime", async () => {
    const invited = await invite("casse", {
      email: `casse.${suffix}@cliente.test`,
    });

    const outcome = await redeemInvitation(
      invited.token,
      claims({ email: `Casse.${suffix}@Cliente.Test` }),
    );

    expect(outcome.granted).toBeDefined();
    expect(await accountOf(invited.person.id)).toMatchObject({
      hasAccess: true,
    });
  });

  /* **Un lien vaut une fois**, et c'est `accepted_at` qui le tient. La seconde
     tentative ne réécrit rien : elle tombe sur `already_accepted`. */
  test("le même lien, deux fois", async () => {
    const invited = await invite("deux-fois");

    const first = await redeemInvitation(
      invited.token,
      claims({ email: invited.email }),
    );
    expect(first.granted).toBeDefined();

    const acceptedAt = (await invitationRow(invited.invitationId))?.acceptedAt;

    const second = await redeemInvitation(
      invited.token,
      claims({ email: invited.email }),
    );

    expect(second.refused).toBe("already_accepted");
    expect((await invitationRow(invited.invitationId))?.acceptedAt).toEqual(
      acceptedAt,
    );
  });

  /* **Une seconde invitation devient possible dès que la première est
     refermée** — l'index est partiel, et les traces s'accumulent. */
  test("réinviter après révocation ouvre l'accès du second lien", async () => {
    const invited = await invite("reinvitee", { revokedAt: new Date() });

    const scope = forDomain({ domainId });
    const { token, tokenHash } = newInvitationToken();
    await scope.insert(invitations, {
      personId: invited.person.id,
      email: invited.email,
      role: "member",
      tokenHash,
      expiresAt: invitationExpiry(),
    });

    /* Le lien révoqué reste refusé, et le neuf ouvre. */
    expect((await redeemInvitation(invited.token, claims({ email: invited.email }))).refused).toBe("revoked");

    const outcome = await redeemInvitation(
      token,
      claims({ email: invited.email }),
    );

    expect(outcome.granted).toBeDefined();
    expect(await accountOf(invited.person.id)).toMatchObject({
      hasAccess: true,
      domainRole: "member",
    });
  });
});
