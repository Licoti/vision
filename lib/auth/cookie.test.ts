/**
 * Les tests du sceau — **la seule chose que ce module garantit**.
 *
 * C'est le premier endroit du produit où une erreur est silencieuse : un cookie
 * forgé accepté ne produit pas une erreur, il produit une session. Ces tests ne
 * vérifient donc pas qu'un cookie valide se relit — c'est le cas facile —, mais
 * qu'un cookie **invalide** ne se relit pas, sous chacune des formes où il peut
 * l'être.
 *
 * **Le secret est celui du fichier, jamais celui de `.env.local`.** Un test qui
 * dépendrait du secret de la machine ne mesurerait pas la même chose d'une
 * machine à l'autre, et le cas « secret trop court » ne se mesurerait pas du
 * tout. Il est restauré à la fin : `entry.test.ts` et les six fichiers de tests
 * d'action tournent dans le même processus.
 */

import { afterAll, beforeAll, describe, expect, test } from "vitest";

import {
  AuthSecretError,
  openHandshake,
  openPrincipal,
  sealHandshake,
  sealPrincipal,
  type Principal,
} from "./cookie";

/** 44 caractères, la longueur que rend `openssl rand -base64 32`. */
const SECRET = "3PmSb0vQ0m7wTt2Xz8Kx1RcU5nJd9YfHqL4eA6oGiW0=";
const OTHER_SECRET = "Zq1Lm4Xv8Nb2Ct6Yr0Jw3Ke9Ds5Fh7Ug1Pa4Bo2Ti8=";

let saved: string | undefined;

beforeAll(() => {
  saved = process.env.AUTH_SECRET;
  process.env.AUTH_SECRET = SECRET;
});

afterAll(() => {
  if (saved === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = saved;
});

const person: Principal = {
  kind: "person",
  personId: "8f1a1a3e-0000-4000-8000-000000000001",
  domainId: "8f1a1a3e-0000-4000-8000-000000000002",
};

const admin: Principal = {
  kind: "super_admin",
  superAdminId: "8f1a1a3e-0000-4000-8000-000000000003",
};

describe("ce qui se relit", () => {
  test("un principal de personne fait l'aller-retour", () => {
    expect(openPrincipal(sealPrincipal(person))).toEqual(person);
  });

  test("un principal de super administrateur fait l'aller-retour", () => {
    expect(openPrincipal(sealPrincipal(admin))).toEqual(admin);
  });

  test("un aller-retour OAuth fait l'aller-retour", () => {
    const handshake = {
      provider: "google",
      state: "s-1",
      nonce: "n-1",
      codeVerifier: "v-1",
    };
    expect(openHandshake(sealHandshake(handshake))).toEqual(handshake);
  });
});

describe("ce qui ne se relit pas", () => {
  test("aucune valeur", () => {
    expect(openPrincipal(undefined)).toBeNull();
    expect(openPrincipal(null)).toBeNull();
    expect(openPrincipal("")).toBeNull();
  });

  test("une valeur sans signature", () => {
    const [body] = sealPrincipal(person).split(".");
    expect(openPrincipal(body)).toBeNull();
  });

  test("une signature falsifiée d'un seul caractère", () => {
    const sealed = sealPrincipal(person);
    const cut = sealed.lastIndexOf(".");
    const signature = sealed.slice(cut + 1);
    const forged =
      sealed.slice(0, cut + 1) +
      (signature[0] === "A" ? "B" : "A") +
      signature.slice(1);

    expect(openPrincipal(forged)).toBeNull();
  });

  test("une signature tronquée ne lève pas, elle refuse", () => {
    const sealed = sealPrincipal(person);
    expect(openPrincipal(sealed.slice(0, sealed.length - 4))).toBeNull();
  });

  /* **Le test qui porte tout le poids.** Une charge réécrite garde une
     signature valide *pour l'ancienne charge* : c'est exactement la forme
     qu'aurait une escalade — se donner un autre `domainId`. */
  test("une charge réécrite sous l'ancienne signature", () => {
    const sealed = sealPrincipal(person);
    const cut = sealed.lastIndexOf(".");
    const payload = JSON.parse(
      Buffer.from(sealed.slice(0, cut), "base64url").toString("utf8"),
    ) as Record<string, unknown>;

    payload.domainId = "8f1a1a3e-0000-4000-8000-0000000000ff";
    const rewritten = Buffer.from(JSON.stringify(payload)).toString(
      "base64url",
    );

    expect(openPrincipal(`${rewritten}.${sealed.slice(cut + 1)}`)).toBeNull();
  });

  test("une signature faite avec un autre secret", () => {
    const sealed = sealPrincipal(person);
    process.env.AUTH_SECRET = OTHER_SECRET;
    try {
      expect(openPrincipal(sealed)).toBeNull();
    } finally {
      process.env.AUTH_SECRET = SECRET;
    }
  });

  test("une charge expirée", () => {
    expect(openPrincipal(sealPrincipal(person, -1))).toBeNull();
  });

  /* Une charge scellée par nous reste une charge revenue du navigateur : la
     signature dit qu'elle n'a pas été récrite, pas qu'elle a la forme
     attendue. Un cookie d'un format antérieur la porte tout autant. */
  test("une charge d'une forme inconnue, pourtant bien signée", () => {
    const sealed = sealHandshake({
      provider: "google",
      state: "s",
      nonce: "n",
      codeVerifier: "v",
    });
    expect(openPrincipal(sealed)).toBeNull();
  });

  test("un aller-retour amputé de son vérificateur", () => {
    const sealed = sealPrincipal({
      kind: "person",
      personId: "x",
      domainId: "y",
    });
    expect(openHandshake(sealed)).toBeNull();
  });
});

describe("le secret", () => {
  test("absent, rien ne se signe", () => {
    delete process.env.AUTH_SECRET;
    try {
      expect(() => sealPrincipal(person)).toThrow(AuthSecretError);
    } finally {
      process.env.AUTH_SECRET = SECRET;
    }
  });

  /* La réserve d'`ETAT.md` mesurée plutôt qu'affirmée : `.env.local` portait
     23 caractères quand `openssl rand -base64 32` en rend 44. */
  test("trop court, rien ne se signe non plus", () => {
    process.env.AUTH_SECRET = "trop-court-23-caracteres";
    try {
      expect(() => sealPrincipal(person)).toThrow(AuthSecretError);
    } finally {
      process.env.AUTH_SECRET = SECRET;
    }
  });
});
