/**
 * Les tests de la couche OIDC — **le raccordement d'un fournisseur**, 08/09/2026.
 *
 * **Aucune base, aucun réseau**, et c'est ce qui rend ce fichier possible : ce
 * qui est éprouvé ici ne dépend ni d'une fixture ni d'un document de découverte,
 * seulement de ce que l'environnement porte. La découverte, l'échange du code et
 * la vérification du jeton restent hors de portée d'un test unitaire — c'est
 * `lib/auth/entry.test.ts` qui les couvre sur claims forgés.
 *
 * **Ce fichier naît d'une mesure, pas d'une relecture.** L'écran d'entrée
 * proposait ses deux fournisseurs quand un seul a ses valeurs, et
 * `GET /auth/connexion?fournisseur=microsoft` rendait **500** — `required()`
 * levait `ProviderConfigError` sans personne pour la rattraper. La règle 5 veut
 * un écran, jamais un cas d'erreur.
 *
 * **L'environnement se pose ici, jamais on ne le suppose.** `.env.local` est
 * injecté dans la suite (`vitest.global-setup.ts`) : `GOOGLE_CLIENT_ID` y est,
 * `ENTRA_CLIENT_ID` n'y est pas. Un test qui lirait l'état du dépôt passerait
 * chez moi et tomberait chez le suivant — chaque cas pose donc ses deux valeurs
 * et les retire.
 */

import { afterEach, describe, expect, test, vi } from "vitest";

import { isProviderConnected, isProviderId, PROVIDERS } from "./oidc";

afterEach(() => {
  vi.unstubAllEnvs();
});

/** Les deux valeurs d'un fournisseur, posées ou retirées ensemble. */
function connect(
  provider: "google" | "microsoft",
  values: { id?: string; secret?: string } = { id: "un-id", secret: "un-secret" },
) {
  vi.stubEnv(PROVIDERS[provider].clientIdEnv, values.id ?? "");
  vi.stubEnv(PROVIDERS[provider].clientSecretEnv, values.secret ?? "");
}

describe("isProviderId — le mot désigne-t-il un fournisseur ?", () => {
  test("les deux de la table, et eux seuls", () => {
    expect(isProviderId("google")).toBe(true);
    expect(isProviderId("microsoft")).toBe(true);
  });

  test("tout le reste est refusé, y compris l'absence", () => {
    for (const value of ["okta", "GOOGLE", "", "google "]) {
      expect(isProviderId(value)).toBe(false);
    }
    expect(isProviderId(null)).toBe(false);
  });
});

describe("isProviderConnected — le fournisseur a-t-il ses deux valeurs ?", () => {
  test("les deux posées : il est raccordé", () => {
    connect("microsoft");
    expect(isProviderConnected("microsoft")).toBe(true);
  });

  test("aucune : il ne l'est pas", () => {
    connect("microsoft", {});
    expect(isProviderConnected("microsoft")).toBe(false);
  });

  /**
   * **Le secret compte autant que l'identifiant**, et ce n'est pas de la
   * symétrie : l'aller n'a besoin que du premier. Un fournisseur à demi
   * renseigné mènerait donc l'utilisateur jusque chez Google pour le faire
   * échouer **au retour**, après consentement — le pire des deux moments pour
   * découvrir un réglage manquant.
   */
  test("une seule des deux ne suffit pas, dans un sens comme dans l'autre", () => {
    connect("microsoft", { id: "un-id" });
    expect(isProviderConnected("microsoft")).toBe(false);

    connect("microsoft", { secret: "un-secret" });
    expect(isProviderConnected("microsoft")).toBe(false);
  });

  test("une valeur vide vaut une valeur absente", () => {
    connect("google", { id: "", secret: "" });
    expect(isProviderConnected("google")).toBe(false);
  });

  /**
   * **Les deux fournisseurs sont indépendants**, et c'est tout l'arbitrage (1) :
   * *la couche s'écrit pour deux fournisseurs et en sert un*. Ajouter Microsoft,
   * ce sera deux valeurs de plus — jamais une reprise.
   */
  test("raccorder l'un ne raccorde pas l'autre", () => {
    connect("google");
    connect("microsoft", {});

    expect(isProviderConnected("google")).toBe(true);
    expect(isProviderConnected("microsoft")).toBe(false);
  });

  /**
   * **Lu à l'usage, jamais figé au chargement du module** : un même artefact se
   * déploie sur deux environnements, et l'écran doit dire l'état de celui qui le
   * sert. Ce test tombe le jour où la valeur serait capturée au module.
   */
  test("la réponse suit l'environnement, sans rechargement", () => {
    connect("microsoft", {});
    expect(isProviderConnected("microsoft")).toBe(false);

    connect("microsoft");
    expect(isProviderConnected("microsoft")).toBe(true);
  });
});
