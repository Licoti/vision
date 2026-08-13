/**
 * L'amorçage du domaine — référentiels et données factices.
 *
 * `docs/05` §3 : « un domaine amorcé avec ses référentiels. Pas d'interface
 * d'administration : amorçage par script. » `docs/04` §6 le dit autrement :
 * créer un domaine implique de créer ses entités, métiers, statuts, types
 * d'activité, approches et outils.
 *
 * Deux sources, et pas une de plus :
 *   — les **référentiels** viennent de `docs/02` §3-4, `docs/03` §2 et
 *     `docs/04` §2. Ce sont des données du domaine, jamais des listes codées
 *     en dur ailleurs que dans ce fichier ;
 *   — les **données factices** viennent de `docs/design/brief-design.md` §7,
 *     et de nulle part ailleurs. Un champ que le brief ne donne pas reste nul.
 *
 * **Règle 1 sans exception.** Ce script n'importe pas `lib/db/client.ts` : il
 * passe par `forDomain`, comme le reste du produit. `superAdmin` sert à la
 * seule table que rien ne peut scoper, `domains`.
 *
 * `actorId` est nul : l'amorçage n'a pas de personne courante. C'est
 * exactement ce que `created_by` nullable prévoyait.
 *
 * **Rejouable.** Chaque table est rapprochée de son contenu par une clé
 * naturelle : ce qui manque est créé, ce qui a dérivé est remis à la valeur
 * du fichier, le reste est laissé tel quel. Deux exécutions successives
 * laissent la base dans le même état.
 *
 *   npm run db:seed
 */

import {
  forDomain,
  superAdmin,
  type InsertValues,
  type Row,
  type ScopedDb,
  type ScopedTable,
} from "../lib/db/scoped";
import {
  activities,
  activityFamily,
  activityParticipants,
  activityState,
  activityTypes,
  approaches,
  domainRole,
  entities,
  indicatorReadings,
  indicators,
  jobs,
  persons,
  projectApproaches,
  projectIndicators,
  projectJobs,
  projectMembers,
  projectStatusNature,
  projectStatuses,
  products,
  projects,
  resources,
  results,
  toolKind,
  tools,
} from "../lib/db/schema";

/* ==========================================================================
   La fixture — le cadre (docs/04 §2)
   ========================================================================== */

/** Brief §7. Le domaine est le seul objet créé hors de la couche scopée. */
const DOMAIN = {
  name: "Groupe Meridian",
  competenceCenterName: "Centre de compétence Design & Produit",
};

/** Brief §7. */
const ENTITIES = [
  "Banque de détail",
  "Assurance",
  "Corporate",
  "Digital Factory",
  "RH & Interne",
];

/** `docs/02` §3 — le métier est une propriété de la personne. */
const JOBS = [
  "Product Design",
  "UX Research",
  "UI Design",
  "Design System",
  "UX Writing",
  "Accessibilité",
];

/** Brief §3 et `docs/02` §4 — la manière d'accompagner. */
const APPROACHES = [
  "Research",
  "Design Thinking",
  "Lean",
  "Audit UX",
  "Audit d'accessibilité",
  "Audit d'éco-conception",
  "Mesure des usages",
];

/**
 * `docs/02` §4 — statuts d'amorçage, modifiables par le domaine. Seule la
 * `nature` porte la logique : elle, ne se renomme pas.
 */
const STATUSES: { label: string; nature: Nature }[] = [
  { label: "Cadrage", nature: "framing" },
  { label: "En cours", nature: "active" },
  { label: "En pause", nature: "paused" },
  { label: "Terminé", nature: "done" },
];

/** `docs/04` §2 — brancher un outil coûte une ligne, pas un module. */
const TOOLS: { name: string; kind: ToolKind }[] = [
  { name: "Ergonome", kind: "audit" },
  { name: "Audit d'accessibilité", kind: "audit" },
  { name: "Portail analytics", kind: "analytics" },
  { name: "Outil budget", kind: "budget" },
];

/**
 * `docs/03` §2 — le référentiel de départ, en six familles.
 *
 * `produces_result` est vrai pour les audits (`docs/04` §2), et pour eux
 * seuls : c'est ce drapeau qui conditionnera la saisie d'un résultat.
 *
 * `defaultTool` n'est posé que sur les deux types dont le brief documente
 * l'outil — « résultat 62/100, lien Ergonome », « 68 % de conformité, lien
 * vers l'outil ». Les autres restent nuls plutôt que devinés.
 *
 * « Atelier de priorisation » ne figure pas dans `docs/03` : il vient du
 * brief §7, et le type est une donnée du domaine. Arbitrage rendu avec
 * l'humain en ouverture du ticket, consigné au journal.
 */
const ACTIVITY_TYPES: {
  label: string;
  family: Family;
  producesResult?: boolean;
  defaultTool?: string;
}[] = [
  { label: "Atelier de cadrage", family: "framing" },
  { label: "Benchmark", family: "framing" },
  { label: "Analyse de l'existant", family: "framing" },
  { label: "Entretien commanditaire", family: "framing" },

  { label: "Entretiens utilisateurs", family: "research" },
  { label: "Test utilisateur", family: "research" },
  { label: "Questionnaire", family: "research" },
  { label: "Observation terrain", family: "research" },
  { label: "Analyse de verbatims", family: "research" },

  { label: "Atelier de co-conception", family: "design" },
  { label: "Sprint de conception", family: "design" },
  { label: "Maquettage", family: "design" },
  { label: "Revue de conception", family: "design" },
  { label: "Atelier de priorisation", family: "design" },

  {
    label: "Audit UX",
    family: "evaluation",
    producesResult: true,
    defaultTool: "Ergonome",
  },
  {
    label: "Audit d'accessibilité",
    family: "evaluation",
    producesResult: true,
    defaultTool: "Audit d'accessibilité",
  },
  { label: "Audit d'éco-conception", family: "evaluation", producesResult: true },
  { label: "Revue experte", family: "evaluation" },

  { label: "Définition d'indicateurs", family: "measurement" },
  { label: "Analyse des usages", family: "measurement" },
  { label: "Restitution de mesure", family: "measurement" },

  { label: "Restitution", family: "transfer" },
  { label: "Formation", family: "transfer" },
  { label: "Documentation", family: "transfer" },
  { label: "Passation", family: "transfer" },
];

/**
 * Brief §7 — les huit personnes nommées, et rien de plus.
 *
 * `source: manual` pour toutes : il n'y a pas d'annuaire au POC, et
 * fabriquer un `external_id` serait inventer. `email` reste nul, le brief
 * n'en donne aucun.
 *
 * D19 — Marc Tellier est « chef de projet côté entité, sans compte Vision » :
 * il figure dans l'équipe, il ne se connecte pas.
 *
 * Le brief ne désigne aucun responsable de domaine. Camille Roux est la seule
 * présente sur les deux accompagnements du produit vitrine ; le rôle lui
 * revient. Sans un responsable **et** un contributeur qui ne l'est pas, la
 * bascule de T1.4 n'a rien à montrer et T2.5 rien à vérifier.
 *
 * Les métiers sont attribués, non documentés : arbitrage rendu avec l'humain
 * pour que le filtre métier de T2.3 ait de quoi filtrer. Consigné au journal.
 */
const PERSONS: {
  fullName: string;
  kind: "center" | "stakeholder";
  job?: string;
  role?: DomainRole;
}[] = [
  { fullName: "Camille Roux", kind: "center", job: "Product Design", role: "domain_manager" },
  { fullName: "Sofia Marchand", kind: "center", job: "UX Research", role: "member" },
  { fullName: "Yanis Bertin", kind: "center", job: "UI Design", role: "member" },
  { fullName: "Inès Kaddour", kind: "center", job: "Accessibilité", role: "member" },
  { fullName: "Léa Fontaine", kind: "center", job: "UX Research", role: "member" },
  { fullName: "Thomas Lemaire", kind: "center", job: "Product Design", role: "member" },
  { fullName: "Awa Diallo", kind: "center", job: "UX Research", role: "member" },
  { fullName: "Marc Tellier", kind: "stakeholder" },
];

/* ==========================================================================
   La fixture — le travail (docs/04 §3)
   ========================================================================== */

/** Brief §7. Le brief ne donne pas de description : elle reste nulle. */
const PRODUCTS: { name: string; entity: string }[] = [
  { name: "Espace client web", entity: "Banque de détail" },
  { name: "Déclaration de sinistre en ligne", entity: "Assurance" },
];

/**
 * Brief §7 — trois accompagnements, dont deux sur le même produit à deux ans
 * d'écart. C'est ce couple qui donne à lire le temps long.
 *
 * D13 — granularité au mois : un début au premier jour, une fin au dernier.
 * `sponsor` reste nul, le brief ne nomme aucun commanditaire.
 */
const PROJECTS: {
  name: string;
  product: string;
  status: string;
  objective: string;
  startedOn: string;
  expectedEndOn?: string;
  approaches: string[];
  /** L'équipe. `contributor` faux pour qui figure sans écrire (D9, D19). */
  team: { person: string; contributor: boolean }[];
}[] = [
  {
    name: "Refonte du parcours de virement",
    product: "Espace client web",
    status: "Terminé",
    objective: "Réduire les abandons en cours de virement.",
    startedOn: "2024-03-01",
    expectedEndOn: "2024-09-30",
    approaches: ["Research", "Audit UX"],
    team: [
      { person: "Camille Roux", contributor: true },
      { person: "Sofia Marchand", contributor: true },
      { person: "Yanis Bertin", contributor: true },
    ],
  },
  {
    name: "Autonomie des opérations courantes",
    product: "Espace client web",
    status: "En cours",
    objective:
      "Permettre les opérations courantes sans contact avec le support.",
    startedOn: "2026-02-01",
    approaches: ["Research", "Audit d'accessibilité", "Mesure des usages"],
    team: [
      { person: "Camille Roux", contributor: true },
      { person: "Inès Kaddour", contributor: true },
      { person: "Léa Fontaine", contributor: true },
      { person: "Marc Tellier", contributor: false },
    ],
  },
  {
    name: "Dématérialisation de la déclaration",
    product: "Déclaration de sinistre en ligne",
    status: "En cours",
    objective:
      "Permettre une déclaration complète sans passer par un conseiller.",
    startedOn: "2026-05-01",
    approaches: ["Design Thinking", "Audit UX"],
    team: [
      { person: "Thomas Lemaire", contributor: true },
      { person: "Awa Diallo", contributor: true },
    ],
  },
];

/**
 * Brief §7 — les activités, dans l'ordre du brief.
 *
 * Le modèle n'a pas de titre d'activité : un **type** et un **objectif**
 * (`docs/04` §3). Quand le libellé du brief n'est pas un type du référentiel
 * — « Campagne de tests — vague 2 », « Observation en agence », « Formation
 * des équipes produit » —, il devient l'objectif, et le type est celui qui
 * décrit l'acte.
 *
 * D14 — « Formation des équipes produit » est à planifier : `planned` sans
 * date, `isUnscheduled` vrai.
 */
const ACTIVITIES: {
  project: string;
  type: string;
  objective?: string;
  state: ActivityState;
  periodStart?: string;
  periodEnd?: string;
  isUnscheduled?: boolean;
}[] = [
  {
    project: "Refonte du parcours de virement",
    type: "Entretiens utilisateurs",
    state: "done",
    periodStart: "2024-04-01",
    periodEnd: "2024-04-30",
  },
  {
    project: "Refonte du parcours de virement",
    type: "Audit UX",
    state: "done",
    periodStart: "2024-05-01",
    periodEnd: "2024-05-31",
  },
  {
    project: "Refonte du parcours de virement",
    type: "Atelier de co-conception",
    state: "done",
    periodStart: "2024-06-01",
    periodEnd: "2024-06-30",
  },
  {
    project: "Refonte du parcours de virement",
    type: "Restitution",
    state: "done",
    periodStart: "2024-09-01",
    periodEnd: "2024-09-30",
  },

  {
    project: "Autonomie des opérations courantes",
    type: "Test utilisateur",
    objective: "Campagne de tests — vague 2",
    state: "done",
    periodStart: "2026-03-01",
    periodEnd: "2026-03-31",
  },
  {
    project: "Autonomie des opérations courantes",
    type: "Audit d'accessibilité",
    state: "done",
    periodStart: "2026-06-01",
    periodEnd: "2026-06-30",
  },
  {
    project: "Autonomie des opérations courantes",
    type: "Atelier de priorisation",
    state: "in_progress",
    periodStart: "2026-08-01",
    periodEnd: "2026-08-31",
  },
  {
    project: "Autonomie des opérations courantes",
    type: "Audit UX",
    state: "planned",
    periodStart: "2026-10-01",
    periodEnd: "2026-10-31",
  },
  {
    project: "Autonomie des opérations courantes",
    type: "Formation",
    objective: "Formation des équipes produit",
    state: "planned",
    isUnscheduled: true,
  },

  {
    project: "Dématérialisation de la déclaration",
    type: "Atelier de cadrage",
    state: "done",
    periodStart: "2026-05-01",
    periodEnd: "2026-05-31",
  },
  {
    project: "Dématérialisation de la déclaration",
    type: "Observation terrain",
    objective: "Observation en agence",
    state: "done",
    periodStart: "2026-06-01",
    periodEnd: "2026-06-30",
  },
  {
    project: "Dématérialisation de la déclaration",
    type: "Audit UX",
    state: "planned",
    periodStart: "2026-09-01",
    periodEnd: "2026-09-30",
  },
];

/* ==========================================================================
   La fixture — les traces (docs/04 §4)
   ========================================================================== */

/**
 * Brief §7 — « résultat 62/100, lien Ergonome » et « résultat 68 % de
 * conformité, lien vers l'outil ».
 *
 * Le contrat unique de F2 : un libellé, une valeur, une unité, une date, un
 * lien. **`external_url` reste nul** : le brief nomme l'outil, pas l'adresse,
 * et une URL inventée serait un lien mort affiché comme un lien vivant.
 * Arbitrage rendu avec l'humain, consigné au journal.
 */
const RESULTS: {
  project: string;
  activityType: string;
  label: string;
  value: string;
  unit: string;
  measuredOn: string;
  tool: string;
}[] = [
  {
    project: "Refonte du parcours de virement",
    activityType: "Audit UX",
    label: "Score d'audit UX",
    value: "62",
    unit: "/100",
    measuredOn: "2024-05-31",
    tool: "Ergonome",
  },
  {
    project: "Autonomie des opérations courantes",
    activityType: "Audit d'accessibilité",
    label: "Taux de conformité",
    value: "68",
    unit: "%",
    measuredOn: "2026-06-30",
    tool: "Audit d'accessibilité",
  },
];

/**
 * Brief §7 — la seule ressource que le brief rattache à une activité :
 * « Campagne de tests — vague 2 (mars 2026, terminée, **restitution liée**) ».
 * Les trois autres du brief n'ont pas de rattachement donné ; elles
 * attendront C4.
 *
 * `url` est la seule invention du fichier, parce que la colonne est non
 * nulle. Le domaine `.invalid` est réservé par la RFC 2606 : le lien est
 * visiblement un exemple, et il ne pointera jamais ailleurs par accident.
 */
const RESOURCES: {
  project: string;
  activityType: string;
  title: string;
  url: string;
  resourceType: "powerpoint";
}[] = [
  {
    project: "Autonomie des opérations courantes",
    activityType: "Test utilisateur",
    title: "Restitution des tests — vague 2",
    url: "https://exemple.invalid/restitution-tests-vague-2",
    resourceType: "powerpoint",
  },
];

/**
 * Brief §7 — l'indicateur du produit et ses trois relevés, puis son adoption
 * par le second accompagnement.
 *
 * `direction` se lit dans la cible : de 54 % vers 85 %, plus haut vaut mieux.
 * `baseline_value` et `final_value` restent nuls, le brief ne les donne pas :
 * seule la cible est écrite.
 */
const INDICATOR = {
  product: "Espace client web",
  label: "Part des virements réalisés sans contact support",
  unit: "%",
  direction: "higher_is_better" as const,
  readings: [
    { value: "54", readOn: "2024-09-01" },
    { value: "63", readOn: "2025-03-01" },
    { value: "71", readOn: "2026-06-01" },
  ],
  adoption: { project: "Autonomie des opérations courantes", targetValue: "85" },
};

/* ==========================================================================
   Types dérivés du schéma — jamais réécrits à la main
   ========================================================================== */

type Nature = (typeof projectStatusNature.enumValues)[number];
type ToolKind = (typeof toolKind.enumValues)[number];
type Family = (typeof activityFamily.enumValues)[number];
type ActivityState = (typeof activityState.enumValues)[number];
type DomainRole = (typeof domainRole.enumValues)[number];

/* ==========================================================================
   Le rapprochement

   Une seule lecture par table, puis un seul lot d'insertions. Ce qui existe
   déjà est reconnu par sa clé naturelle, ce qui a dérivé est remis à la
   valeur du fichier.
   ========================================================================== */

type Tally = { created: number; updated: number; unchanged: number };

const tallies = new Map<string, Tally>();

function record(table: string, outcome: keyof Tally, count = 1): void {
  const tally = tallies.get(table) ?? { created: 0, updated: 0, unchanged: 0 };
  tally[outcome] += count;
  tallies.set(table, tally);
}

/**
 * Deux valeurs de colonne sont-elles la même ?
 *
 * `numeric` revient de PostgreSQL en chaîne cadrée — `"62.0000"` pour un
 * `"62"` écrit. Les comparer telles quelles ferait réécrire la ligne à chaque
 * exécution, et le script ne serait plus rejouable, seulement bavard.
 */
function sameValue(left: unknown, right: unknown): boolean {
  if (left === null || left === undefined) return right === null || right === undefined;
  if (right === null || right === undefined) return false;

  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (
    typeof left !== "boolean" &&
    typeof right !== "boolean" &&
    !Number.isNaN(leftNumber) &&
    !Number.isNaN(rightNumber) &&
    String(left).trim() !== "" &&
    String(right).trim() !== ""
  ) {
    return leftNumber === rightNumber;
  }

  return String(left) === String(right);
}

/** Ce que le fichier déclare pour une ligne, et la clé qui la reconnaît. */
type Seed<T extends ScopedTable> = {
  key: string;
  values: InsertValues<T>;
};

/** Toute ligne scopée porte un identifiant : le typage générique l'ignore. */
const rowId = (row: unknown): string => (row as { id: string }).id;

/**
 * Amène une table à l'état décrit par le fichier, et rend ses lignes indexées
 * par clé naturelle — c'est cet index qui sert ensuite à résoudre les
 * rattachements sans jamais écrire un identifiant à la main.
 */
async function ensureAll<T extends ScopedTable>(
  scope: ScopedDb,
  table: T,
  name: string,
  keyOfRow: (row: Row<T>) => string,
  seeds: Seed<T>[],
): Promise<Map<string, Row<T>>> {
  const seen = new Set<string>();
  for (const seed of seeds) {
    if (seen.has(seed.key)) {
      throw new Error(
        `Clé naturelle en double dans la fixture ${name} : « ${seed.key} ». ` +
          "Deux lignes indiscernables rendraient l'amorçage non rejouable.",
      );
    }
    seen.add(seed.key);
  }

  const existing = new Map<string, Row<T>>();
  for (const row of await scope.list(table, { includeArchived: true })) {
    existing.set(keyOfRow(row), row);
  }

  const missing = seeds.filter((seed) => !existing.has(seed.key));

  for (const seed of seeds) {
    const row = existing.get(seed.key);
    if (!row) continue;

    const current = row as unknown as Record<string, unknown>;
    const wanted = seed.values as unknown as Record<string, unknown>;
    const drifted = Object.keys(wanted).filter(
      (column) => !sameValue(current[column], wanted[column]),
    );

    if (drifted.length === 0) {
      record(name, "unchanged");
      continue;
    }

    const updated = await scope.update(table, rowId(row), seed.values);
    if (updated) existing.set(seed.key, updated);
    record(name, "updated");
  }

  if (missing.length > 0) {
    // `insertMany` attend `InsertValues<NoInfer<T>>` : derrière un `T` non
    // résolu, TypeScript ne sait pas rapprocher les deux formes du même type.
    // Le cast est confiné à cette ligne, et le résultat retypé aussitôt.
    const inserted = (await scope.insertMany(
      table,
      missing.map((seed) => seed.values) as never,
    )) as Row<T>[];
    inserted.forEach((row) => existing.set(keyOfRow(row), row));
    record(name, "created", inserted.length);
  }

  return existing;
}

/** L'identifiant d'une ligne attendue, ou une erreur qui nomme ce qui manque. */
function idOf<T extends ScopedTable>(
  index: Map<string, Row<T>>,
  key: string,
  what: string,
): string {
  const row = index.get(key);
  if (!row) {
    throw new Error(`${what} introuvable après amorçage : « ${key} ».`);
  }
  return rowId(row);
}

/** La position d'un référentiel : l'ordre du fichier fait foi. */
const positionOf = (index: number): string => String(index + 1);

/* ==========================================================================
   L'amorçage
   ========================================================================== */

async function seed(): Promise<void> {
  const host = process.env.DATABASE_URL
    ? new URL(process.env.DATABASE_URL).host
    : "(inconnu)";
  console.log(`Amorçage de « ${DOMAIN.name} » sur ${host}\n`);

  /* --- Le domaine ------------------------------------------------------- */

  const known = await superAdmin.listDomains({ includeArchived: true });
  const existingDomain = known.find((row) => row.name === DOMAIN.name);
  const domain = existingDomain ?? (await superAdmin.createDomain(DOMAIN));
  record("domains", existingDomain ? "unchanged" : "created");

  const scope = forDomain({ domainId: domain.id, actorId: null });

  /* --- Les référentiels -------------------------------------------------- */

  const entityIndex = await ensureAll(
    scope,
    entities,
    "entities",
    (row) => row.label,
    ENTITIES.map((label, index) => ({
      key: label,
      values: { label, position: positionOf(index) },
    })),
  );

  const jobIndex = await ensureAll(
    scope,
    jobs,
    "jobs",
    (row) => row.label,
    JOBS.map((label, index) => ({
      key: label,
      values: { label, position: positionOf(index) },
    })),
  );

  const approachIndex = await ensureAll(
    scope,
    approaches,
    "approaches",
    (row) => row.label,
    APPROACHES.map((label, index) => ({
      key: label,
      values: { label, position: positionOf(index) },
    })),
  );

  const statusIndex = await ensureAll(
    scope,
    projectStatuses,
    "project_statuses",
    (row) => row.label,
    STATUSES.map((status, index) => ({
      key: status.label,
      values: {
        label: status.label,
        nature: status.nature,
        position: positionOf(index),
      },
    })),
  );

  const toolIndex = await ensureAll(
    scope,
    tools,
    "tools",
    (row) => row.name,
    TOOLS.map((tool) => ({
      key: tool.name,
      // `base_url` reste nul : le brief nomme les outils, pas leurs adresses.
      values: { name: tool.name, kind: tool.kind },
    })),
  );

  const typeIndex = await ensureAll(
    scope,
    activityTypes,
    "activity_types",
    (row) => row.label,
    ACTIVITY_TYPES.map((type, index) => ({
      key: type.label,
      values: {
        label: type.label,
        family: type.family,
        producesResult: type.producesResult ?? false,
        position: positionOf(index),
        defaultToolId: type.defaultTool
          ? idOf(toolIndex, type.defaultTool, "Outil")
          : null,
      },
    })),
  );

  /* --- Les personnes ----------------------------------------------------- */

  const personIndex = await ensureAll(
    scope,
    persons,
    "persons",
    (row) => row.fullName,
    PERSONS.map((person) => ({
      key: person.fullName,
      values: {
        fullName: person.fullName,
        source: "manual",
        kind: person.kind,
        jobId: person.job ? idOf(jobIndex, person.job, "Métier") : null,
        hasAccess: person.role !== undefined,
        domainRole: person.role ?? null,
        isActive: true,
      },
    })),
  );

  /* --- Produits et projets ----------------------------------------------- */

  const productIndex = await ensureAll(
    scope,
    products,
    "products",
    (row) => row.name,
    PRODUCTS.map((product) => ({
      key: product.name,
      values: {
        name: product.name,
        entityId: idOf(entityIndex, product.entity, "Entité"),
        // Les deux produits du brief sont des produits, pas des missions
        // transverses : `internal` (D10) n'a pas d'emploi dans cette fixture.
        kind: "product",
      },
    })),
  );

  const projectIndex = await ensureAll(
    scope,
    projects,
    "projects",
    (row) => row.name,
    PROJECTS.map((project) => ({
      key: project.name,
      values: {
        name: project.name,
        productId: idOf(productIndex, project.product, "Produit"),
        statusId: idOf(statusIndex, project.status, "Statut"),
        objective: project.objective,
        startedOn: project.startedOn,
        expectedEndOn: project.expectedEndOn ?? null,
        // `last_activity_at` n'est jamais écrit ici : la couche d'accès le
        // recalcule à chaque écriture d'activité (docs/04 §6).
      },
    })),
  );

  /* --- Les liaisons du projet -------------------------------------------- */

  const jobOfPerson = new Map(
    PERSONS.map((person) => [person.fullName, person.job]),
  );

  await ensureAll(
    scope,
    projectApproaches,
    "project_approaches",
    (row) => `${row.projectId}·${row.approachId}`,
    PROJECTS.flatMap((project) =>
      project.approaches.map((approach) => {
        const projectId = idOf(projectIndex, project.name, "Projet");
        const approachId = idOf(approachIndex, approach, "Approche");
        return {
          key: `${projectId}·${approachId}`,
          values: { projectId, approachId },
        };
      }),
    ),
  );

  // D44 — les métiers déclarés du projet font foi. Ils sont **dérivés** de
  // l'équipe, jamais listés à la main : une équipe qui change les change.
  await ensureAll(
    scope,
    projectJobs,
    "project_jobs",
    (row) => `${row.projectId}·${row.jobId}`,
    PROJECTS.flatMap((project) => {
      const projectId = idOf(projectIndex, project.name, "Projet");
      const labels = new Set(
        project.team
          .map((member) => jobOfPerson.get(member.person))
          .filter((label): label is string => label !== undefined),
      );
      return [...labels].map((label) => {
        const jobId = idOf(jobIndex, label, "Métier");
        return { key: `${projectId}·${jobId}`, values: { projectId, jobId } };
      });
    }),
  );

  await ensureAll(
    scope,
    projectMembers,
    "project_members",
    (row) => `${row.projectId}·${row.personId}`,
    PROJECTS.flatMap((project) =>
      project.team.map((member) => {
        const projectId = idOf(projectIndex, project.name, "Projet");
        const personId = idOf(personIndex, member.person, "Personne");
        return {
          key: `${projectId}·${personId}`,
          values: { projectId, personId, isContributor: member.contributor },
        };
      }),
    ),
  );

  /* --- Les activités ------------------------------------------------------ */

  /**
   * La clé d'une activité, telle que la fixture la désigne. `projet · type`
   * ne suffit pas : C3 rend normal un second Audit UX sur un projet qui
   * dure, et deux lignes réelles sous la même clé se réconcilieraient en
   * une seule à l'amorçage suivant — le même piège que celui déjà documenté
   * pour le renommage d'un produit (`ETAT.md`, points ouverts). La période
   * distingue la fixture aujourd'hui ; une collision resterait possible à
   * type et mois identiques, résiduelle et assumée plutôt qu'éliminée.
   */
  const activityKey = (
    project: string,
    type: string,
    periodStart?: string | null,
  ): string =>
    `${idOf(projectIndex, project, "Projet")}·${idOf(typeIndex, type, "Type d'activité")}·${periodStart ?? "unscheduled"}`;

  /** Retrouve la période d'une activité de `ACTIVITIES` par sa désignation. */
  const periodOfActivity = (project: string, type: string): string | null => {
    const activity = ACTIVITIES.find(
      (row) => row.project === project && row.type === type,
    );
    return activity?.periodStart ?? null;
  };

  const activityIndex = await ensureAll(
    scope,
    activities,
    "activities",
    (row) => `${row.projectId}·${row.activityTypeId}·${row.periodStart ?? "unscheduled"}`,
    ACTIVITIES.map((activity) => {
      const projectId = idOf(projectIndex, activity.project, "Projet");
      const activityTypeId = idOf(typeIndex, activity.type, "Type d'activité");
      return {
        key: activityKey(activity.project, activity.type, activity.periodStart),
        values: {
          projectId,
          activityTypeId,
          objective: activity.objective ?? null,
          state: activity.state,
          periodStart: activity.periodStart ?? null,
          periodEnd: activity.periodEnd ?? null,
          isUnscheduled: activity.isUnscheduled ?? false,
        },
      };
    }),
  );

  // Participants : les membres du centre de l'équipe du projet. Le brief ne
  // détaille pas la présence activité par activité — inférence assumée,
  // consignée au journal.
  await ensureAll(
    scope,
    activityParticipants,
    "activity_participants",
    (row) => `${row.activityId}·${row.personId}`,
    ACTIVITIES.flatMap((activity) => {
      const project = PROJECTS.find((row) => row.name === activity.project);
      if (!project) return [];
      const activityId = idOf(
        activityIndex,
        activityKey(activity.project, activity.type, activity.periodStart),
        "Activité",
      );
      return project.team
        .filter((member) => jobOfPerson.get(member.person) !== undefined)
        .map((member) => {
          const personId = idOf(personIndex, member.person, "Personne");
          return {
            key: `${activityId}·${personId}`,
            values: { activityId, personId },
          };
        });
    }),
  );

  /* --- Les traces --------------------------------------------------------- */

  await ensureAll(
    scope,
    results,
    "results",
    (row) => row.activityId,
    RESULTS.map((result) => {
      const activityId = idOf(
        activityIndex,
        activityKey(
          result.project,
          result.activityType,
          periodOfActivity(result.project, result.activityType),
        ),
        "Activité",
      );
      return {
        key: activityId,
        values: {
          activityId,
          label: result.label,
          value: result.value,
          unit: result.unit,
          measuredOn: result.measuredOn,
          toolId: idOf(toolIndex, result.tool, "Outil"),
        },
      };
    }),
  );

  await ensureAll(
    scope,
    resources,
    "resources",
    (row) => row.title,
    RESOURCES.map((resource) => ({
      key: resource.title,
      values: {
        projectId: idOf(projectIndex, resource.project, "Projet"),
        activityId: idOf(
          activityIndex,
          activityKey(
            resource.project,
            resource.activityType,
            periodOfActivity(resource.project, resource.activityType),
          ),
          "Activité",
        ),
        title: resource.title,
        url: resource.url,
        resourceType: resource.resourceType,
      },
    })),
  );

  const indicatorIndex = await ensureAll(
    scope,
    indicators,
    "indicators",
    (row) => row.label,
    [
      {
        key: INDICATOR.label,
        values: {
          productId: idOf(productIndex, INDICATOR.product, "Produit"),
          label: INDICATOR.label,
          unit: INDICATOR.unit,
          direction: INDICATOR.direction,
        },
      },
    ],
  );

  const indicatorId = idOf(indicatorIndex, INDICATOR.label, "Indicateur");

  await ensureAll(
    scope,
    indicatorReadings,
    "indicator_readings",
    (row) => `${row.indicatorId}·${row.readOn}`,
    INDICATOR.readings.map((reading) => ({
      key: `${indicatorId}·${reading.readOn}`,
      values: { indicatorId, value: reading.value, readOn: reading.readOn },
    })),
  );

  await ensureAll(
    scope,
    projectIndicators,
    "project_indicators",
    (row) => `${row.projectId}·${row.indicatorId}`,
    [
      {
        key: `${idOf(projectIndex, INDICATOR.adoption.project, "Projet")}·${indicatorId}`,
        values: {
          projectId: idOf(projectIndex, INDICATOR.adoption.project, "Projet"),
          indicatorId,
          targetValue: INDICATOR.adoption.targetValue,
        },
      },
    ],
  );

  /* --- La fraîcheur ------------------------------------------------------- */

  /**
   * `last_activity_at` est un champ dérivé : la couche le pose à chaque
   * écriture d'activité. Or l'amorçage est idempotent — à la seconde
   * exécution, il n'écrit plus rien, donc il ne recalculerait plus rien. Une
   * base amorcée avant T2.1 garderait l'ancienne définition de la fraîcheur.
   *
   * Ce rafraîchissement rejoue le calcul sur tous les projets du domaine. Il
   * ne touche aucune ligne de fixture et n'entre donc pas dans le compte rendu
   * ci-dessous : le critère d'idempotence de T1.5 porte sur la fixture, pas
   * sur les champs qu'elle fait dériver.
   */
  const refreshed = await scope.refreshLastActivity();
  console.log(`\nFraîcheur recalculée sur ${refreshed} projet(s).`);

  /* --- Le compte rendu ---------------------------------------------------- */

  let created = 0;
  let updated = 0;
  for (const [table, tally] of tallies) {
    created += tally.created;
    updated += tally.updated;
    console.log(
      `${table.padEnd(22)} ${String(tally.created).padStart(3)} créé(s)  ` +
        `${String(tally.updated).padStart(3)} mis à jour  ` +
        `${String(tally.unchanged).padStart(3)} inchangé(s)`,
    );
  }

  console.log(
    created === 0 && updated === 0
      ? "\nRien à faire : le domaine était déjà à jour."
      : `\n${created} ligne(s) créée(s), ${updated} mise(s) à jour.`,
  );
}

seed().then(
  () => process.exit(0),
  (error: unknown) => {
    console.error("\nAmorçage interrompu.");
    console.error(error);
    process.exit(1);
  },
);
