/**
 * Les tests de l'envoi — **ce qui part, et ce qui ne part pas** (T11.3).
 *
 * **Aucune base, aucun réseau**, et c'est le patron de `lib/auth/oidc.test.ts` :
 * ce qui s'éprouve ici ne dépend que de ce que l'environnement porte et de ce
 * que `fetch` rend. Le `fetch` réel est **espionné**, jamais appelé — un test
 * qui atteindrait l'API de Resend enverrait des courriels à chaque exécution.
 *
 * **L'environnement se pose ici, jamais on ne le suppose.** `.env.local` est
 * injecté dans la suite (`vitest.config.mts`) : `RESEND_API_KEY` n'y est pas
 * aujourd'hui, et rien ne garantit qu'elle n'y sera pas demain. Chaque cas pose
 * donc ses deux valeurs et les retire — sans quoi ce fichier passerait ici et
 * tomberait chez le suivant.
 *
 * **Le chemin réseau lui-même n'est pas exercé**, et c'est écrit plutôt que
 * feint : aucune clé Resend n'existe au 08/09/2026, exactement comme aucune
 * valeur Entra n'existe depuis C9. Ce que ces tests mesurent est *ce que Vision
 * envoie*, jamais *ce que Resend en fait*.
 */

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  invitationMailBody,
  isMailConnected,
  sendInvitationMail,
  type InvitationMail,
} from "./send";

/** Une adresse, au sens le plus large : c'est ce qu'on cherche à ne pas trouver. */
const ANY_EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;

const MAIL: InvitationMail = {
  to: "invitee@acme.com",
  domainName: "Acme",
  inviterName: "Camille Responsable",
  role: "member",
  expiresAt: new Date("2026-09-15T10:00:00.000Z"),
  link: "https://vision.example/invitation/le-jeton",
};

/** Les deux valeurs de l'envoi, posées ou retirées ensemble. */
function connect(
  values: { key?: string; from?: string } = {
    key: "une-cle",
    from: "vision@acme.com",
  },
) {
  vi.stubEnv("RESEND_API_KEY", values.key ?? "");
  vi.stubEnv("MAIL_FROM", values.from ?? "");
}

/** Ce que `fetch` rendra, et la trace de ce qu'on lui a passé. */
function spyFetch(response: Response | Error) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(() =>
      response instanceof Error
        ? Promise.reject(response)
        : Promise.resolve(response),
    );
}

/** Le corps JSON réellement envoyé, relu comme l'API le lira. */
function sentBody(spy: ReturnType<typeof spyFetch>): Record<string, unknown> {
  const init = spy.mock.calls[0]?.[1];
  return JSON.parse(String(init?.body)) as Record<string, unknown>;
}

beforeEach(() => {
  /* L'échec se nomme sur la sortie d'erreur, et deux cas l'exercent : une suite
     verte n'a pas à écrire des lignes d'erreur qu'on finirait par ne plus lire. */
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("isMailConnected — l'envoi a-t-il ses deux valeurs ?", () => {
  test("les deux posées : il est raccordé", () => {
    connect();
    expect(isMailConnected()).toBe(true);
  });

  test("aucune : il ne l'est pas", () => {
    connect({});
    expect(isMailConnected()).toBe(false);
  });

  /**
   * **L'expéditeur compte autant que la clé**, et ce n'est pas de la symétrie :
   * une clé sans expéditeur mène jusqu'à l'appel pour le faire échouer chez
   * Resend — c'est-à-dire *après* que le geste a cru pouvoir écrire.
   */
  test("une seule des deux ne suffit pas, dans un sens comme dans l'autre", () => {
    connect({ key: "une-cle" });
    expect(isMailConnected()).toBe(false);

    connect({ from: "vision@acme.com" });
    expect(isMailConnected()).toBe(false);
  });

  test("une valeur vide vaut une valeur absente", () => {
    connect({ key: "", from: "" });
    expect(isMailConnected()).toBe(false);
  });

  /**
   * **Lu à l'usage, jamais figé au chargement du module** : un même artefact se
   * déploie sur deux environnements. Ce test tombe le jour où la valeur serait
   * capturée au module.
   */
  test("la réponse suit l'environnement, sans rechargement", () => {
    connect({});
    expect(isMailConnected()).toBe(false);

    connect();
    expect(isMailConnected()).toBe(true);
  });
});

describe("sendInvitationMail — ce qui part, et ce qui ne part pas", () => {
  /** **Mesure 1 de la fiche** : sans clé, aucune requête sortante n'est tentée. */
  test("non raccordé : aucune requête sortante, et le geste n'échoue pas", async () => {
    connect({});
    const fetchSpy = spyFetch(new Response("", { status: 200 }));

    await expect(sendInvitationMail(MAIL)).resolves.toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("raccordé : un POST, une clé, un seul destinataire", async () => {
    connect();
    const fetchSpy = spyFetch(new Response("{}", { status: 200 }));

    await expect(sendInvitationMail(MAIL)).resolves.toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [url, init] = fetchSpy.mock.calls[0] ?? [];
    expect(String(url)).toBe("https://api.resend.com/emails");
    expect(init?.method).toBe("POST");
    expect(
      (init?.headers as Record<string, string> | undefined)?.Authorization,
    ).toBe("Bearer une-cle");
    /* Une requête sans borne tiendrait l'action serveur ouverte : l'invitation
       serait écrite et le lien ne s'afficherait jamais. */
    expect(init?.signal).toBeInstanceOf(AbortSignal);

    const body = sentBody(fetchSpy);
    expect(body.from).toBe("vision@acme.com");
    expect(body.to).toEqual(["invitee@acme.com"]);
  });

  /**
   * **Mesure 3 de la fiche.** Ni relance, ni rappel, ni seconde adresse — et le
   * corps est du **texte**, jamais du HTML : un message mis en page demanderait
   * des valeurs visuelles en dur (règle 2).
   */
  test("le corps ne porte ni relance, ni rappel, ni seconde adresse", async () => {
    connect();
    const fetchSpy = spyFetch(new Response("{}", { status: 200 }));
    await sendInvitationMail(MAIL);

    const body = sentBody(fetchSpy);
    expect(body).not.toHaveProperty("html");
    expect(body).not.toHaveProperty("cc");
    expect(body).not.toHaveProperty("bcc");
    expect(body).not.toHaveProperty("reply_to");

    const text = String(body.text);
    for (const word of ["relance", "relancer", "rappel", "rappeler"]) {
      expect(text.toLowerCase()).not.toContain(word);
    }
    /* Aucune adresse dans le corps : celle du destinataire est déjà dans `to`,
       et celle de qui invite ferait voyager un contact de plus. */
    expect(text.match(ANY_EMAIL) ?? []).toEqual([]);
  });

  test("l'API refuse : rien ne lève, et rien n'est parti", async () => {
    connect();
    spyFetch(new Response("{}", { status: 422 }));

    await expect(sendInvitationMail(MAIL)).resolves.toBe(false);
  });

  /**
   * **Le réseau coupé ne lève pas non plus** : c'est la mise en défaut de la
   * fiche — *l'échec d'envoi transformé en levée doit faire tomber la mesure 2
   * seule*. Une levée ici remonterait dans l'action et défierait une invitation
   * déjà écrite en base.
   */
  test("le réseau coupe : rien ne lève, et rien n'est parti", async () => {
    connect();
    spyFetch(new TypeError("fetch failed"));

    await expect(sendInvitationMail(MAIL)).resolves.toBe(false);
  });
});

describe("invitationMailBody — ce que le message dit, et rien d'autre", () => {
  test("le domaine, qui invite, ce que le rôle donne, la date et le lien", () => {
    const { subject, text } = invitationMailBody(MAIL);

    expect(subject).toContain("Acme");
    expect(text).toContain("Camille Responsable");
    expect(text).toContain("Acme");
    expect(text).toContain("Membre");
    expect(text).toContain("n'écrit que dans les accompagnements");
    expect(text).toContain("15 septembre 2026");
    expect(text).toContain("https://vision.example/invitation/le-jeton");
  });

  /**
   * **Les mots du rôle ne se recopient pas** : ce sont ceux du panneau qui
   * invite (`PERSON_ROLE_LABEL`, `PERSON_ROLE_NOTE`). Ce test tombe le jour où
   * une quatrième copie s'écrirait ici.
   */
  test("le second rôle dit ce que le second rôle donne", () => {
    const { text } = invitationMailBody({ ...MAIL, role: "domain_manager" });

    expect(text).toContain("Responsable de domaine");
    expect(text).toContain("Gère les référentiels");
  });
});
