/**
 * La garde de production de `setCurrentPerson` — le trou trouvé par T11.6.
 *
 * **`/dev/session` est 404 en production, mais son action inline `switchPerson`
 * ne porte aucun `requireSession`** : sa fermeture en production vit tout entière
 * ici, dans le `throw` de `setCurrentPerson` (`lib/auth/provider.ts`). Aucun test
 * ne l'éprouvait — un écran absent du rendu n'a jamais protégé le point d'entrée
 * qui l'accompagne (leçon de T9.4, T11.5).
 *
 * **Ce que ce fichier mesure, et ce qu'il ne mesure pas.** Il éprouve *la garde*,
 * pas le protocole HTTP : `next/headers` est simulé pour observer le cookie posé,
 * comme les huit fichiers de tests d'action. La frappe HTTP réelle sous
 * `NODE_ENV=production` reste ce que dit le rapport `SECURITE-C9-C11.md` ; ce test
 * est le filet permanent que l'arbitrage (2) de T11.6 demande.
 *
 * **La mise en défaut** : retirer le `throw` de production fait procéder
 * `setCurrentPerson` jusqu'à poser le cookie — le domaine actif de la fixture est
 * là pour ça —, et le test tombe sur son `rejects.toThrow`.
 */

import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import { asSuperAdmin, withoutAnySession } from "@/lib/db/scoped";
import { domains } from "@/lib/db/schema";
import { db } from "@/lib/db/client";
import { eq } from "drizzle-orm";

/** Ce qu'un appel a écrit dans le magasin de cookies — le seul verdict. */
let cookieSets: { name: string; value: string }[] = [];

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined,
    set: (name: string, value: string) => {
      cookieSets.push({ name, value });
    },
    delete: () => {},
  }),
}));

const { setCurrentPerson } = await import("./provider");

const outsideAnySession = asSuperAdmin(withoutAnySession("fixture"));
const suffix = Math.random().toString(36).slice(2, 10);

let domainId: string | null = null;

beforeAll(async () => {
  /* Un domaine actif, pour que la mise en défaut mène à un succès observable :
     la garde retirée, `setCurrentPerson` trouve un domaine et pose le cookie. */
  const domain = await outsideAnySession.createDomain({
    name: `__test__provider__${suffix}`,
    competenceCenterName: `Centre ${suffix}`,
  });
  domainId = domain.id;
}, 60_000);

afterAll(async () => {
  if (domainId) await db.delete(domains).where(eq(domains.id, domainId));
});

describe("setCurrentPerson — la garde de production", () => {
  test("en production, elle lève et ne pose aucun cookie", async () => {
    vi.stubEnv("NODE_ENV", "production");
    cookieSets = [];

    try {
      await expect(
        setCurrentPerson("11111111-1111-4111-8111-111111111111"),
      ).rejects.toThrow(/outil de développement/);
      /* **Le décompte tranche** : aucune session n'a été posée. */
      expect(cookieSets).toHaveLength(0);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  test("hors production, elle pose la session — le témoin", async () => {
    /* `NODE_ENV` vaut « test » sous Vitest : la branche de production ne se prend
       pas, et le domaine actif de la fixture laisse le geste aller au bout. */
    cookieSets = [];

    await setCurrentPerson("22222222-2222-4222-8222-222222222222");

    expect(cookieSets).toHaveLength(1);
    expect(cookieSets[0]?.name).toBe("vision_session");
    expect(cookieSets[0]?.value).toBeTruthy();
  });
});
