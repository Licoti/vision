/**
 * Le rapprochement de T8.4, éprouvé pour la première fois — T9.5.
 *
 * **Il n'avait aucun test, et ce n'était pas un oubli** : il vivait dans
 * `scripts/seed.ts`, et `vitest.config.mts` n'inclut que `lib/**` et `app/**`.
 * Le mécanisme était donc **structurellement hors d'atteinte**. C'est
 * l'extraction vers `lib/db/reconcile.ts` qui le rend mesurable, et le point
 * ouvert d'`ETAT.md` — *« `ensureAll` n'a aucun test »* — se referme ici.
 *
 * **Les trois temps s'éprouvent séparément**, du plus sûr au plus faible : la
 * clé naturelle, l'ancre, les anciens libellés. Un test qui les mesurerait
 * ensemble ne dirait pas lequel a reconnu la ligne.
 *
 * **Le constat se fait par le client brut** : compter des lignes à travers la
 * portée qui vient de les écrire ne prouverait pas qu'aucune n'a été doublée
 * ailleurs.
 */

import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { db } from "./client";
import { createReconciler, positionAnchor, positionOf } from "./reconcile";
import { domains, jobs } from "./schema";
import { asSuperAdmin, forDomain, withoutAnySession, type ScopedDb } from "./scoped";

const outsideAnySession = asSuperAdmin(withoutAnySession("fixture"));

const suffix = Math.random().toString(36).slice(2, 10);
const created: string[] = [];

async function newScope(label: string): Promise<ScopedDb> {
  const domain = await outsideAnySession.createDomain({
    name: `__test__reconcile__${label}__${suffix}`,
    competenceCenterName: `Centre ${label}`,
  });
  created.push(domain.id);
  return forDomain({ domainId: domain.id });
}

/** Les métiers d'un domaine, par le client brut, dans l'ordre des positions. */
async function jobsOf(scope: ScopedDb): Promise<{ label: string; position: string }[]> {
  const domainId = (await scope.list(jobs))[0]?.domainId;
  if (!domainId) return [];
  const rows = await db
    .select({ label: jobs.label, position: jobs.position })
    .from(jobs)
    .where(inArray(jobs.domainId, [domainId]));
  return rows.sort((a, b) => Number(a.position) - Number(b.position));
}

/** La fixture de trois métiers ordonnés, telle qu'un référentiel la déclare. */
const three = (labels: string[], formerKeys?: Record<string, string[]>) =>
  labels.map((label, index) => ({
    key: label,
    anchor: positionOf(index),
    formerKeys: formerKeys?.[label],
    values: { label, position: positionOf(index) },
  }));

async function ensureJobs(
  scope: ScopedDb,
  labels: string[],
  formerKeys?: Record<string, string[]>,
) {
  const reconciler = createReconciler();
  await reconciler.ensureAll(
    scope,
    jobs,
    "jobs",
    (row) => row.label,
    three(labels, formerKeys),
    positionAnchor,
  );
  return reconciler;
}

const BASE = ["Product Design", "UX Research", "UI Design"];

let base: ScopedDb;

beforeAll(async () => {
  base = await newScope("base");
  await ensureJobs(base, BASE);
});

afterAll(async () => {
  if (created.length === 0) return;
  await db.delete(jobs).where(inArray(jobs.domainId, created));
  await db.delete(domains).where(inArray(domains.id, created));
});

/* ==========================================================================
   Temps 1 — la clé naturelle
   ========================================================================== */

describe("la clé naturelle", () => {
  test("elle reconnaît une ligne inchangée, et n'écrit rien", async () => {
    const reconciler = await ensureJobs(base, BASE);

    expect(await jobsOf(base)).toHaveLength(3);
    expect(reconciler.tallies.get("jobs")).toEqual({
      created: 0,
      updated: 0,
      renamed: 0,
      unchanged: 3,
    });
  });

  test("une clé en double dans la fixture lève, plutôt que de deviner", async () => {
    const scope = await newScope("double");
    await expect(ensureJobs(scope, ["Métier", "Métier"])).rejects.toThrow(
      /Clé naturelle en double/,
    );
  });
});

/* ==========================================================================
   Temps 2 — l'ancre
   ========================================================================== */

describe("l'ancre — la position, qu'aucun renommage ne touche", () => {
  /**
   * **Le défaut que T8.4 referme, rejoué.** Une ligne renommée *en base* —
   * par l'écran d'administration — n'a plus la clé naturelle du fichier. Sans
   * l'ancre, l'amorçage suivant la recréerait à côté et laisserait l'ancienne
   * orpheline.
   */
  test("une ligne renommée en base est reconnue et rendue, jamais doublée", async () => {
    const scope = await newScope("ancre");
    await ensureJobs(scope, BASE);

    /* Le renommage, fait par la portée comme l'écran le ferait. */
    const rows = await scope.list(jobs);
    const target = rows.find((row) => row.label === "UX Research");
    await scope.update(jobs, target!.id, { label: "Recherche utilisateur" });

    const reconciler = await ensureJobs(scope, BASE);

    const after = await jobsOf(scope);
    expect(after).toHaveLength(3);
    expect(after.map((row) => row.label)).toEqual(BASE);
    expect(reconciler.tallies.get("jobs")?.renamed).toBe(1);
    expect(reconciler.tallies.get("jobs")?.created).toBe(0);
    expect(reconciler.renames).toEqual([
      "jobs : « Recherche utilisateur » reconnu, et rendu à « UX Research ».",
    ]);
  });

  /**
   * **Deux candidates n'en désignent aucune.** L'amorçage ne devine jamais
   * entre deux lignes : il insère, et laisse la base telle quelle — quitte à
   * doubler, ce qui se voit, plutôt qu'à écraser la mauvaise, ce qui ne se voit
   * pas.
   */
  test("deux lignes libres sur la même ancre ne désignent rien : l'amorçage insère", async () => {
    const scope = await newScope("ambigu");

    /* Deux lignes en position 2, aucune ne portant la clé du fichier. */
    await scope.insert(jobs, { label: "Première", position: "2" });
    await scope.insert(jobs, { label: "Seconde", position: "2" });

    const reconciler = await ensureJobs(scope, BASE);

    expect(await jobsOf(scope)).toHaveLength(5);
    expect(reconciler.tallies.get("jobs")?.created).toBe(3);
    expect(reconciler.tallies.get("jobs")?.renamed).toBe(0);
  });
});

/* ==========================================================================
   Temps 3 — les anciens libellés
   ========================================================================== */

describe("les anciens libellés déclarés", () => {
  /**
   * **Le seul recours de `tools`**, qui n'a pas d'ordinal. C'est la route qui a
   * rendu « Everyone » à la ligne semée sous « Audit d'accessibilité ».
   */
  test("un renommage déclaré par la fixture reprend la ligne, sans ancre", async () => {
    const scope = await newScope("former");
    const reconciler = createReconciler();

    /* Sans ancre : la table n'en porte pas, du point de vue de cet appel. */
    await reconciler.ensureAll(scope, jobs, "jobs", (row) => row.label, [
      { key: "Audit d'accessibilité", values: { label: "Audit d'accessibilité", position: "1" } },
    ]);

    const second = createReconciler();
    await second.ensureAll(scope, jobs, "jobs", (row) => row.label, [
      {
        key: "Everyone",
        formerKeys: ["Audit d'accessibilité"],
        values: { label: "Everyone", position: "1" },
      },
    ]);

    const after = await jobsOf(scope);
    expect(after.map((row) => row.label)).toEqual(["Everyone"]);
    expect(second.tallies.get("jobs")?.renamed).toBe(1);
    expect(second.renames).toEqual([
      "jobs : « Audit d'accessibilité » reconnu, et rendu à « Everyone ».",
    ]);
  });
});

/* ==========================================================================
   La dérive
   ========================================================================== */

describe("ce qui a dérivé est remis à la valeur du fichier", () => {
  test("une position changée en base revient, et la ligne n'est pas recréée", async () => {
    const scope = await newScope("derive");
    await ensureJobs(scope, BASE);

    const rows = await scope.list(jobs);
    const target = rows.find((row) => row.label === "UI Design");
    await scope.update(jobs, target!.id, { position: "9" });

    const reconciler = await ensureJobs(scope, BASE);

    const after = await jobsOf(scope);
    expect(after).toHaveLength(3);
    expect(after.map((row) => row.label)).toEqual(BASE);
    expect(reconciler.tallies.get("jobs")?.updated).toBe(1);
    expect(reconciler.tallies.get("jobs")?.created).toBe(0);
  });

  /**
   * `numeric(10,2)` revient cadré de PostgreSQL — `"3.00"` pour un `"3"`
   * écrit. Sans `sameValue`, chaque passage réécrirait chaque ligne, et
   * l'amorçage ne serait plus rejouable, seulement bavard.
   */
  test("une position cadrée par PostgreSQL n'est pas une dérive", async () => {
    const reconciler = await ensureJobs(base, BASE);
    expect(reconciler.tallies.get("jobs")?.updated).toBe(0);
  });
});
