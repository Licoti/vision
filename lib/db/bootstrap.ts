/**
 * L'amorçage d'un domaine neuf — ses référentiels par défaut (T9.5).
 *
 * `docs/04` §2 : *« créer un domaine déclenche l'amorçage de ses référentiels
 * par défaut. »* C'était `scripts/seed.ts`, lancé à la main sur un domaine
 * nommé en dur ; l'écran de T9.4 crée des entreprises, et celle qu'il crée
 * naissait vide. Ce module est ce que les deux appellent.
 *
 * **La séparation qu'il tient, et c'est sa raison d'être.** Les *référentiels*
 * viennent de `docs/02` §3-4, `docs/03` §2 et `docs/04` §2 : ils sont ici. Les
 * *données factices* viennent de `docs/design/brief-design.md` §7 : elles
 * restent au script, et **un domaine créé par l'écran n'en reçoit aucune**.
 *
 * **Huit référentiels, pas neuf — et le décompte de la fiche est mis en
 * défaut.** `entities` est le neuvième, et il n'est pas ici : les cinq entités
 * du script sont les divisions de « Groupe Meridian », donnée de brief. Les
 * semer chez un vrai client serait inventer son organigramme. Un domaine neuf
 * naît donc **sans entité**, et c'est un état déjà rendu — *« Aucune entité dans
 * ce domaine »* existe sur `/produits/nouveau` comme dans `/administration`.
 *
 * **Les outils naissent sans adresse**, et pour la même raison. `base_url` est
 * une configuration propre au client, jamais une donnée de référentiel : semer
 * `https://ergonome.example.com` chez un vrai client poserait un lien profond
 * qui ne mène nulle part **sans le dire**, ce qui est pire qu'une adresse
 * absente. « Outil budget » est déjà sans adresse aujourd'hui : l'état est
 * servi. Le script passe les siennes en argument (`toolBaseUrls`).
 *
 * **Rejouable**, par le mécanisme de T8.4 que `lib/db/reconcile.ts` porte :
 * deux amorçages successifs sur un même domaine laissent la base dans le même
 * état. **`tools` est le seul des huit qui reste ouvert au renommage**, la
 * table n'ayant pas d'ordinal — refermer demanderait une colonne, donc une
 * migration.
 *
 * **Règle 1 sans exception** : tout passe par le `ScopedDb` reçu. Le module ne
 * connaît pas `domains`, et n'a rien à en connaître — qui l'appelle tient déjà
 * son identifiant.
 */

import {
  activityFamily,
  activityTypes,
  approaches,
  jobs,
  projectStatusNature,
  projectStatuses,
  skillLevels,
  skills,
  starterKind,
  starters,
  toolKind,
  tools,
} from "./schema";
import {
  idOf,
  positionAnchor,
  positionOf,
  type Reconciler,
} from "./reconcile";
import type { Row, ScopedDb } from "./scoped";

/* ==========================================================================
   Types dérivés du schéma — jamais réécrits à la main
   ========================================================================== */

type Nature = (typeof projectStatusNature.enumValues)[number];
type ToolKind = (typeof toolKind.enumValues)[number];
type StarterKind = (typeof starterKind.enumValues)[number];
type Family = (typeof activityFamily.enumValues)[number];

/* ==========================================================================
   Les huit référentiels
   ========================================================================== */

/** `docs/02` §3 — le métier est une propriété de la personne. */
export const JOBS = [
  "Product Design",
  "UX Research",
  "UI Design",
  "Design System",
  "UX Writing",
  "Accessibilité",
];

/**
 * Les onze compétences de la demande du 17/08/2026.
 *
 * Elles ne se confondent pas avec `JOBS` : le métier qualifie la personne, la
 * compétence dit ce qu'elle sait faire, et une personne en porte plusieurs.
 */
export const SKILLS = [
  "UI Design",
  "UX Design",
  "User Research",
  "Architecture de l'information",
  "Facilitation",
  "Prototypage",
  "UX Audit",
  "Accessibilité",
  "Design System",
  "Design Strategy",
  "Service Design",
];

/**
 * L'échelle de maîtrise. Le `rank` porte l'ordre, le `label` se renomme.
 * Garde-fou 1 — le niveau est **déclaré**, jamais mesuré par Vision.
 */
export const SKILL_LEVELS: { label: string; rank: number }[] = [
  { label: "Débutant", rank: 1 },
  { label: "Intermédiaire", rank: 2 },
  { label: "Avancé", rank: 3 },
  { label: "Expert", rank: 4 },
];

/** Brief §3 et `docs/02` §4 — la manière d'accompagner. */
export const APPROACHES = [
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
export const STATUSES: { label: string; nature: Nature }[] = [
  { label: "Cadrage", nature: "framing" },
  { label: "En cours", nature: "active" },
  { label: "En pause", nature: "paused" },
  { label: "Terminé", nature: "done" },
];

/**
 * `docs/04` §2 — brancher un outil coûte une ligne, pas un module.
 *
 * **Aucune adresse ici** (T9.5), et c'est l'arbitrage rendu à l'ouverture du
 * ticket : `base_url` appartient au client, pas au référentiel. Le script passe
 * les siennes — provisoires, sur `example.com`, le domaine réservé à la
 * documentation — par `toolBaseUrls`.
 *
 * **« Audit d'accessibilité » s'appelle désormais « Everyone »**, du nom de la
 * plateforme. Le renommage du 20/08/2026 avait semé une ligne neuve et laissé
 * l'ancienne orpheline ; il est **déclaré** depuis T8.4 (`formerNames`), et
 * l'amorçage reprend la ligne au lieu d'en créer une seconde.
 *
 * **`tools` est le seul des huit référentiels qui reste ouvert**, et c'est
 * mesuré : la table ne porte **pas** de `position`, donc aucune ancre ne
 * survivrait à un renommage fait **en base** depuis `/administration`. Les sept
 * autres sont refermés par leur position ; celui-ci demanderait une colonne,
 * donc une migration, que les interdits communs de C9 posent en signal d'arrêt.
 */
export const TOOLS: {
  name: string;
  kind: ToolKind;
  /** Les noms portés avant celui-ci, dans ce fichier. */
  formerNames?: string[];
}[] = [
  { name: "Ergonome", kind: "audit" },
  {
    name: "Everyone",
    kind: "audit",
    formerNames: ["Audit d'accessibilité"],
  },
  { name: "Portail analytics", kind: "analytics" },
  /* **Trois outils de mesure**, ajoutés le 01/09/2026 avec le dispositif de
     mesure : sans eux, son panneau n'aurait qu'une option à proposer, et la
     souplesse annoncée — « un outil de plus est une ligne » — ne se verrait
     nulle part. Ils n'ont rien de particulier : ce sont des lignes du
     référentiel, saisissables en administration comme les quatre autres. */
  { name: "Google Analytics 4", kind: "analytics" },
  { name: "Matomo", kind: "analytics" },
  { name: "Microsoft Clarity", kind: "analytics" },
  { name: "Outil budget", kind: "budget" },
];

/**
 * `docs/03` §2 — le référentiel de départ, en six familles.
 *
 * `produces_result` est vrai pour les audits (`docs/04` §2), et pour eux
 * seuls : c'est ce drapeau qui conditionne la saisie d'un résultat.
 *
 * `defaultTool` n'est posé que sur les deux types dont le brief documente
 * l'outil — « résultat 62/100, lien Ergonome », « 68 % de conformité, lien
 * vers l'outil ». Les autres restent nuls plutôt que devinés.
 *
 * « Atelier de priorisation » ne figure pas dans `docs/03` : il vient du
 * brief §7, et le type est une donnée du domaine. Arbitrage rendu avec
 * l'humain à l'ouverture de T8.4, consigné au journal.
 */
export const ACTIVITY_TYPES: {
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
    defaultTool: "Everyone",
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
 * Les **pistes de démarrage** — le référentiel du bloc « Démarrage »
 * (20/08/2026).
 *
 * Elles viennent de la demande humaine, qui nomme les trois premières mot pour
 * mot — audit UX vers Ergonome, audit d'accessibilité vers Everyone, mise en
 * place du tracking vers le portail analytics.
 *
 * **La quatrième est une invention assumée**, signalée avant écriture et non
 * découverte après. Elle paie deux fois : elle est la preuve que le référentiel
 * accueille une **méthode sans outil**, ce que la demande réclame explicitement
 * pour la suite ; et elle est la seule ligne qui **rende visible la branche
 * « piste sans lien »** du bloc, qui rejoindrait sinon les états vides
 * qu'aucun HTML servi ne montre.
 *
 * Le texte long reste nul sur la quatrième : une piste sans texte long est un
 * état normal, et il fallait qu'une ligne le serve.
 */
export const STARTERS: {
  label: string;
  kind: StarterKind;
  summary: string;
  guidance?: string;
  tool?: string;
}[] = [
  {
    label: "Audit UX",
    kind: "tool",
    tool: "Ergonome",
    summary:
      "Mesurer la qualité d'usage du produit sur une grille heuristique, et repartir d'un état des lieux daté.",
    guidance:
      "À envisager quand l'accompagnement s'ouvre sur un produit déjà en ligne : l'audit donne un point de départ chiffré, auquel les mesures suivantes se compareront. Ergonome produit le rapport ; Vision en reporte la valeur, sa date et son lien, et rien de plus — le détail reste dans l'outil.",
  },
  {
    label: "Audit d'accessibilité",
    kind: "tool",
    tool: "Everyone",
    summary:
      "Situer le produit face au référentiel d'accessibilité, et savoir ce qui bloque avant de concevoir.",
    guidance:
      "À envisager tôt : un écran conçu sans cette lecture se reprend deux fois. Everyone rend un taux de conformité que l'accompagnement peut adopter comme indicateur du produit, puis suivre dans le temps.",
  },
  {
    label: "Mise en place du tracking",
    kind: "tool",
    tool: "Portail analytics",
    summary:
      "Poser les mesures d'usage avant de changer le produit, pour que l'effet du travail soit lisible après.",
    guidance:
      "À envisager avant toute refonte : sans mesure d'avant, il n'y aura pas d'après. Le portail documente la pose des marqueurs ; les valeurs reviennent ensuite dans Vision comme relevés d'indicateur, avec leur date.",
  },
  {
    label: "Entretiens utilisateurs",
    kind: "method",
    summary:
      "Aller chercher chez les utilisateurs ce qu'aucune mesure ne dit : leurs raisons, leurs contournements, leurs mots.",
  },
];

/* ==========================================================================
   La pose
   ========================================================================== */

/**
 * Les index rendus, par clé naturelle.
 *
 * L'appelant qui pose des données par-dessus s'en sert pour résoudre ses
 * rattachements sans jamais écrire un identifiant à la main — c'est ce que fait
 * `scripts/seed.ts` avec ses personnes, ses projets et ses activités.
 */
export type ReferentialIndexes = {
  jobs: Map<string, Row<typeof jobs>>;
  skills: Map<string, Row<typeof skills>>;
  skillLevels: Map<string, Row<typeof skillLevels>>;
  approaches: Map<string, Row<typeof approaches>>;
  projectStatuses: Map<string, Row<typeof projectStatuses>>;
  tools: Map<string, Row<typeof tools>>;
  activityTypes: Map<string, Row<typeof activityTypes>>;
  starters: Map<string, Row<typeof starters>>;
};

export type BootstrapOptions = {
  /**
   * Les adresses d'outil, par nom. Absente : l'outil naît sans adresse, et
   * c'est le cas d'un domaine créé par l'écran.
   */
  toolBaseUrls?: Readonly<Record<string, string>>;
};

/**
 * Amène les huit référentiels d'un domaine à leur valeur par défaut.
 *
 * **L'ordre n'est pas d'agrément** : `tools` passe avant `activity_types`, qui
 * y prend son `default_tool_id`, et avant `starters`, qui y prend son
 * `tool_id`. Les deux les résolvent par `idOf` sur l'index rendu.
 */
export async function bootstrapReferentials(
  scope: ScopedDb,
  reconciler: Reconciler,
  options: BootstrapOptions = {},
): Promise<ReferentialIndexes> {
  const { ensureAll } = reconciler;
  const baseUrls = options.toolBaseUrls ?? {};

  const jobIndex = await ensureAll(
    scope,
    jobs,
    "jobs",
    (row) => row.label,
    JOBS.map((label, index) => ({
      key: label,
      anchor: positionOf(index),
      values: { label, position: positionOf(index) },
    })),
    positionAnchor,
  );

  const skillIndex = await ensureAll(
    scope,
    skills,
    "skills",
    (row) => row.label,
    SKILLS.map((label, index) => ({
      key: label,
      anchor: positionOf(index),
      values: { label, position: positionOf(index) },
    })),
    positionAnchor,
  );

  const levelIndex = await ensureAll(
    scope,
    skillLevels,
    "skill_levels",
    (row) => row.label,
    SKILL_LEVELS.map((level, index) => ({
      key: level.label,
      anchor: positionOf(index),
      values: {
        label: level.label,
        rank: level.rank,
        position: positionOf(index),
      },
    })),
    positionAnchor,
  );

  const approachIndex = await ensureAll(
    scope,
    approaches,
    "approaches",
    (row) => row.label,
    APPROACHES.map((label, index) => ({
      key: label,
      anchor: positionOf(index),
      values: { label, position: positionOf(index) },
    })),
    positionAnchor,
  );

  const statusIndex = await ensureAll(
    scope,
    projectStatuses,
    "project_statuses",
    (row) => row.label,
    STATUSES.map((status, index) => ({
      key: status.label,
      anchor: positionOf(index),
      values: {
        label: status.label,
        nature: status.nature,
        position: positionOf(index),
      },
    })),
    positionAnchor,
  );

  const toolIndex = await ensureAll(
    scope,
    tools,
    "tools",
    (row) => row.name,
    TOOLS.map((tool) => ({
      key: tool.name,
      formerKeys: tool.formerNames,
      values: {
        name: tool.name,
        kind: tool.kind,
        // L'adresse appartient au client : nulle par défaut, posée par
        // l'appelant qui en connaît une. Voir `TOOLS`.
        baseUrl: baseUrls[tool.name] ?? null,
      },
    })),
  );

  const typeIndex = await ensureAll(
    scope,
    activityTypes,
    "activity_types",
    (row) => row.label,
    ACTIVITY_TYPES.map((type, index) => ({
      key: type.label,
      anchor: positionOf(index),
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
    positionAnchor,
  );

  /* Les pistes de démarrage. Elles viennent après les outils, dont elles
     tirent leur lien, et la clé naturelle est le libellé — celui que l'écran
     affiche, comme partout ailleurs. */
  const starterIndex = await ensureAll(
    scope,
    starters,
    "starters",
    (row) => row.label,
    STARTERS.map((starter, index) => ({
      key: starter.label,
      anchor: positionOf(index),
      values: {
        label: starter.label,
        kind: starter.kind,
        summary: starter.summary,
        guidance: starter.guidance ?? null,
        position: positionOf(index),
        toolId: starter.tool ? idOf(toolIndex, starter.tool, "Outil") : null,
      },
    })),
    positionAnchor,
  );

  return {
    jobs: jobIndex,
    skills: skillIndex,
    skillLevels: levelIndex,
    approaches: approachIndex,
    projectStatuses: statusIndex,
    tools: toolIndex,
    activityTypes: typeIndex,
    starters: starterIndex,
  };
}
