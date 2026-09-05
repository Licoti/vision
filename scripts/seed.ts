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
 * **Rejouable, et ce qui reconnaît une ligne se lit ici** (T8.4). Le
 * rapprochement va en trois temps, du plus sûr au plus faible :
 *
 *   1. la **clé naturelle** — un libellé, un nom, un titre ;
 *   2. l'**ancre**, quand la table en porte une : la `position`, colonne
 *      qu'aucun renommage ne touche. C'est elle qui fait qu'un libellé changé —
 *      en base par l'écran d'administration, ou ici par le fichier — est
 *      **reconnu et corrigé** au lieu d'être recréé à côté de l'ancien ;
 *   3. les **anciens libellés déclarés** (`formerKeys`), là où le fichier sait
 *      qu'il a renommé une de ses propres lignes.
 *
 * Ce qui manque ensuite est créé, ce qui a dérivé est remis à la valeur du
 * fichier, le reste est laissé tel quel. Deux exécutions successives laissent
 * la base dans le même état.
 *
 * **Le résidu, et il est mesuré.** Huit référentiels portent une `position` et
 * sont donc refermés. **`tools` n'en porte aucune** — un renommage en base y
 * recrée encore —, et il en va de même de `products`, `projects`, `persons`,
 * `indicators`, `resources`, `use_cases` et `personas`. Les refermer demanderait
 * une colonne, donc une migration, que l'arbitrage (a) de C8 pose en signal
 * d'arrêt. Le fait est écrit dans `ETAT.md` plutôt que contourné.
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
  personaKind,
  personaTraitKind,
  personaTraits,
  personSkills,
  personas,
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
  skillLevels,
  skills,
  starterKind,
  starters,
  toolKind,
  tools,
  useCasePersonas,
  useCases,
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

/**
 * Les onze compétences de la demande du 17/08/2026.
 *
 * Elles ne se confondent pas avec `JOBS` : le métier qualifie la personne, la
 * compétence dit ce qu'elle sait faire, et une personne en porte plusieurs.
 */
const SKILLS = [
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
const SKILL_LEVELS: { label: string; rank: number }[] = [
  { label: "Débutant", rank: 1 },
  { label: "Intermédiaire", rank: 2 },
  { label: "Avancé", rank: 3 },
  { label: "Expert", rank: 4 },
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

/**
 * `docs/04` §2 — brancher un outil coûte une ligne, pas un module.
 *
 * **Deux écarts à la règle de tête, arbitrés le 20/08/2026 avec l'humain**, et
 * tous deux appelés par le bloc « Démarrage », qui a besoin d'une adresse pour
 * ouvrir quoi que ce soit.
 *
 * (1) **Les adresses sont provisoires.** Le brief nomme les outils et jamais
 * leurs adresses ; celles-ci sont posées sur `example.com`, le domaine réservé
 * à la documentation — la seule forme qui soit plausible dans sa structure et
 * prouvablement provisoire, incapable d'atteindre un tiers réel par accident.
 * « Outil budget » reste sans adresse : aucune piste ne le désigne, et le
 * budget est en C7 (D28).
 *
 * (2) **« Audit d'accessibilité » s'appelle désormais « Everyone »**, du nom de
 * la plateforme. Le renommage a semé une ligne neuve et laissé l'ancienne
 * orpheline en base de développement — le défaut que T8.4 referme. Il est
 * désormais **déclaré** (`formerNames`) : le fichier dit ses propres
 * renommages, et l'amorçage reprend la ligne au lieu d'en créer une seconde.
 *
 * **`tools` est le seul des neuf référentiels qui reste ouvert**, et c'est
 * mesuré : la table ne porte **pas** de `position`, donc aucune ancre ne
 * survivrait à un renommage fait **en base** depuis `/administration`. Les huit
 * autres sont refermés par leur position ; celui-ci demanderait une colonne,
 * donc une migration, que l'arbitrage (a) de C8 pose en signal d'arrêt.
 */
const TOOLS: {
  name: string;
  kind: ToolKind;
  baseUrl?: string;
  /** Les noms portés avant celui-ci, dans ce fichier. */
  formerNames?: string[];
}[] = [
  { name: "Ergonome", kind: "audit", baseUrl: "https://ergonome.example.com" },
  {
    name: "Everyone",
    kind: "audit",
    baseUrl: "https://everyone.example.com",
    formerNames: ["Audit d'accessibilité"],
  },
  {
    name: "Portail analytics",
    kind: "analytics",
    baseUrl: "https://analytics.example.com",
  },
  /* **Trois outils de mesure**, ajoutés le 01/09/2026 avec le dispositif de
     mesure : sans eux, son panneau n'aurait qu'une option à proposer, et la
     souplesse annoncée — « un outil de plus est une ligne » — ne se verrait
     nulle part. Ils n'ont rien de particulier : ce sont des lignes du
     référentiel, saisissables en administration comme les quatre autres. */
  {
    name: "Google Analytics 4",
    kind: "analytics",
    baseUrl: "https://analytics.google.com",
  },
  { name: "Matomo", kind: "analytics", baseUrl: "https://matomo.example.com" },
  {
    name: "Microsoft Clarity",
    kind: "analytics",
    baseUrl: "https://clarity.microsoft.com",
  },
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
 * **Troisième source de ce fichier**, après les `docs/` et le brief §7 : elles
 * viennent de la demande humaine, qui nomme les trois premières mot pour mot —
 * audit UX vers Ergonome, audit d'accessibilité vers Everyone, mise en place du
 * tracking vers le portail analytics. Le précédent est celui des deux use cases
 * du 19/08/2026.
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
const STARTERS: {
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
 *
 * **Présentations, disponibilités et compétences sont inventées** (17/08/2026).
 * C'est une entorse assumée à la règle de tête de ce fichier — « un champ que le
 * brief ne donne pas reste nul » : le brief ne connaît ni les unes ni les
 * autres, mais la fiche T5bis.1 les exige nommément, et six écrans en vivent.
 * Consigné au journal.
 *
 * Trois propriétés de la répartition sont **construites**, et se casseraient si
 * on la « nettoyait » :
 *   — Inès Kaddour n'a que **deux** compétences : c'est elle qui éprouvera
 *     l'absence de radar (moins de trois axes, pas de polygone) ;
 *   — Léa Fontaine porte **User Research et Accessibilité**, quand Sofia et Awa
 *     n'ont que la première et Inès et Yanis que la seconde : sans ce jeu, le
 *     critère conjonctif du filtre par compétences se lirait sur un résultat
 *     vide, qui ne prouve rien ;
 *   — les **trois** valeurs de disponibilité sont représentées, sans quoi la
 *     pastille n'aurait que deux de ses trois couleurs à montrer.
 *
 * Arbitrage (d) — Marc Tellier, côté entité, n'a ni présentation ni compétence :
 * elles sont propriété du centre. **La disponibilité ne se sème plus** : elle se
 * déduit du nombre d'accompagnements vivants depuis le 28/08/2026, et c'est donc
 * l'équipe des projets ci-dessous qui la produit.
 */
const PERSONS: {
  fullName: string;
  kind: "center" | "stakeholder";
  job?: string;
  role?: DomainRole;
  bio?: string;
  skills?: { skill: string; level: string }[];
}[] = [
  {
    fullName: "Camille Roux",
    kind: "center",
    job: "Product Design",
    role: "domain_manager",
    bio: "Product designer, accompagne les équipes du cadrage à la mise en service.",
    skills: [
      { skill: "Design Strategy", level: "Expert" },
      { skill: "UX Design", level: "Avancé" },
      { skill: "Facilitation", level: "Avancé" },
      { skill: "Prototypage", level: "Intermédiaire" },
    ],
  },
  {
    fullName: "Sofia Marchand",
    kind: "center",
    job: "UX Research",
    role: "member",
    bio: "Chercheuse, mène les entretiens et les campagnes de tests utilisateurs.",
    skills: [
      { skill: "User Research", level: "Expert" },
      { skill: "Facilitation", level: "Avancé" },
      { skill: "UX Audit", level: "Intermédiaire" },
    ],
  },
  {
    fullName: "Yanis Bertin",
    kind: "center",
    job: "UI Design",
    role: "member",
    bio: "Designer d'interface, tient le design system et les parcours à l'écran.",
    skills: [
      { skill: "UI Design", level: "Expert" },
      { skill: "Design System", level: "Avancé" },
      { skill: "Prototypage", level: "Avancé" },
      { skill: "UX Design", level: "Intermédiaire" },
      { skill: "Accessibilité", level: "Intermédiaire" },
    ],
  },
  {
    fullName: "Inès Kaddour",
    kind: "center",
    job: "Accessibilité",
    role: "member",
    bio: "Référente accessibilité, conduit les audits de conformité et les mises en conformité.",
    skills: [
      { skill: "Accessibilité", level: "Expert" },
      { skill: "UX Audit", level: "Avancé" },
    ],
  },
  {
    fullName: "Léa Fontaine",
    kind: "center",
    job: "UX Research",
    role: "member",
    bio: "Chercheuse, travaille l'observation terrain et la structure de l'information.",
    skills: [
      { skill: "User Research", level: "Avancé" },
      { skill: "Architecture de l'information", level: "Avancé" },
      { skill: "Accessibilité", level: "Intermédiaire" },
    ],
  },
  {
    fullName: "Thomas Lemaire",
    kind: "center",
    job: "Product Design",
    role: "member",
    bio: "Product designer, intervient sur le cadrage et la conception de services.",
    skills: [
      { skill: "UX Design", level: "Avancé" },
      { skill: "Facilitation", level: "Avancé" },
      { skill: "Architecture de l'information", level: "Intermédiaire" },
      { skill: "Design Strategy", level: "Intermédiaire" },
    ],
  },
  {
    fullName: "Awa Diallo",
    kind: "center",
    job: "UX Research",
    role: "member",
    bio: "Chercheuse, relie les usages mesurés aux constats d'audit.",
    skills: [
      { skill: "User Research", level: "Avancé" },
      { skill: "UX Audit", level: "Avancé" },
      { skill: "Prototypage", level: "Intermédiaire" },
      { skill: "UI Design", level: "Intermédiaire" },
      { skill: "Service Design", level: "Débutant" },
    ],
  },
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
  approaches: string[];
  /** L'équipe. `contributor` faux pour qui figure sans écrire (D9, D19). */
  team: { person: string; contributor: boolean }[];
}[] = [
  {
    name: "Refonte du parcours de virement",
    product: "Espace client web",
    status: "Terminé",
    objective: "Réduire les abandons en cours de virement.",
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
 *
 * **`externalUrl` — troisième écart aux adresses, 21/08/2026.** Les trois
 * activités d'audit portent un lien vers l'outil où le travail se fait. C'est
 * l'extension de l'arbitrage du 20/08/2026 qui a posé les `tools.base_url` sur
 * `example.com` : le domaine est réservé à la documentation, l'adresse est
 * plausible dans sa structure et prouvablement provisoire, incapable
 * d'atteindre un tiers réel par accident.
 *
 * Sans elle, la branche neuve de la roadmap n'apparaîtrait dans **aucun HTML
 * servi**, et le critère de validation ne se lirait nulle part — la raison
 * exacte pour laquelle la quatrième piste de démarrage a été inventée le
 * 20/08/2026. L'arbitrage de `RESULTS` juste en dessous ne bouge pas d'un mot :
 * là, le brief nomme l'outil et jamais l'adresse d'un **rapport**, qui serait
 * une valeur inventée ; ici, c'est l'espace de travail de l'outil, dont
 * `tools.base_url` porte déjà la racine.
 */
const ACTIVITIES: {
  project: string;
  type: string;
  objective?: string;
  state: ActivityState;
  periodStart?: string;
  periodEnd?: string;
  isUnscheduled?: boolean;
  externalUrl?: string;
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
    externalUrl: "https://ergonome.example.com/audits/virement-2024",
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
    externalUrl: "https://everyone.example.com/audits/operations-2026",
  },
  {
    project: "Autonomie des opérations courantes",
    type: "Atelier de priorisation",
    state: "in_progress",
    periodStart: "2026-08-01",
    periodEnd: "2026-08-31",
  },
  /* **L'audit prévu est le cas que la colonne existe pour** : il n'a ni ne
     peut avoir de résultat — `docs/03` §4 réserve celui-ci à l'état terminé —,
     et il menait donc nulle part jusqu'ici. */
  {
    project: "Autonomie des opérations courantes",
    type: "Audit UX",
    state: "planned",
    periodStart: "2026-10-01",
    periodEnd: "2026-10-31",
    externalUrl: "https://ergonome.example.com/audits/operations-2026-10",
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
    externalUrl: "https://ergonome.example.com/audits/declaration-2026-09",
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
    tool: "Everyone",
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
 *
 * **La cible est portée par l'indicateur**, et non par l'adoption : depuis le
 * 29/08/2026 il n'y en a plus qu'une, et c'est celle du produit. Elle vivait sur
 * l'adoption jusque-là, ce que la migration `0011` reprend pour les bases déjà
 * amorcées — ici c'est la constante qui la place au bon endroit dès l'écriture.
 *
 * `baseline_value` reste nul : le brief ne le donne pas. L'adoption est donc
 * **nue** — un pur rattachement, ce qui est un état normal, et le seul que le
 * brief permette d'écrire.
 */
const INDICATOR = {
  product: "Espace client web",
  label: "Part des virements réalisés sans contact support",
  unit: "%",
  direction: "higher_is_better" as const,
  targetValue: "85",
  readings: [
    { value: "54", readOn: "2024-09-01" },
    { value: "63", readOn: "2025-03-01" },
    { value: "71", readOn: "2026-06-01" },
  ],
  adoption: { project: "Autonomie des opérations courantes" },
};

/**
 * Les **personae** du produit — **une quatrième source, et c'est un écart**
 * (T8.4).
 *
 * L'en-tête de ce fichier pose « deux sources, et pas une de plus » : les
 * référentiels des `docs/`, les données factices du brief §7. Le brief ne
 * connaît aucun persona. **Ces deux lignes sont donc inventées ici**, comme les
 * présentations et les compétences l'ont été le 17/08/2026 et la quatrième
 * piste de démarrage le 20/08 — signalé avant écriture, jamais découvert après.
 * L'écart est consigné dans `JOURNAL-TECHNIQUE.md` (règle 6).
 *
 * **Ce qui manquait n'était pas le lien, c'était le jeu d'essai.** Les deux use
 * cases ci-dessous n'avaient aucun persona rattaché depuis le 19/08/2026 : la
 * branche « rattaché » de la fiche d'un use case n'apparaissait dans **aucun
 * HTML servi**, et seul son état vide se lisait. C'est la raison exacte pour
 * laquelle la quatrième piste de démarrage a été inventée le 20/08.
 *
 * Deux propriétés sont **construites**, et se casseraient si on les
 * « nettoyait » :
 *   — les **deux valeurs** de `persona_kind` sont représentées, sans quoi la
 *     mention « Principal » de la fiche d'un use case n'aurait rien à rendre ;
 *   — le second persona **n'a aucun trait**, et c'est un état normal
 *     (`listPersonaTraits` rend trois listes vides) : il fallait qu'une ligne le
 *     serve, comme la quatrième piste sert la branche « sans lien ».
 *
 * `imageUrl` reste nul sur les deux : Vision ne stocke aucun fichier, et
 * inventer une adresse d'image afficherait un lien mort comme un lien vivant —
 * l'arbitrage rendu sur `results.external_url`. L'écran retombe sur la pastille
 * d'initiales, ce qu'il sait faire.
 */
const PERSONAS: {
  product: string;
  name: string;
  role: string;
  kind: PersonaKind;
  summary: string;
  /** Une ligne par trait, dans l'ordre de saisie : c'est lui qui fait `position`. */
  traits?: { kind: TraitKind; label: string }[];
}[] = [
  {
    product: "Espace client web",
    name: "Utilisateur autonome",
    role: "Usage quotidien, sans accompagnement",
    kind: "primary",
    summary:
      "Ouvre son espace de travail plusieurs fois par jour et attend de pouvoir démarrer sans demander l'aide de personne.",
    traits: [
      { kind: "goal", label: "Reprendre un travail en cours sans le reconfigurer" },
      { kind: "goal", label: "Retrouver en une minute ce qui a été fait la veille" },
      { kind: "pain", label: "Doit passer par le support pour la moindre opération inhabituelle" },
      { kind: "pain", label: "Perd sa saisie quand la session expire" },
      { kind: "expectation", label: "Savoir à tout moment où en est son opération" },
    ],
  },
  {
    product: "Espace client web",
    name: "Responsable des accès",
    role: "Ouvre et ferme les droits, côté entité",
    kind: "secondary",
    summary:
      "Donne et retire les accès aux projets, et doit pouvoir le faire sans ouvrir une demande au support.",
  },
];

/**
 * Les use cases du produit — **une troisième source, et c'est un écart**.
 *
 * L'en-tête de ce fichier pose « deux sources, et pas une de plus » : les
 * référentiels des `docs/`, les données factices du brief §7. Le brief ne dit
 * rien des scénarios d'usage. Ces deux lignes viennent donc de la demande
 * humaine du 19/08/2026, qui les rédige mot pour mot — elles ne sont pas
 * inventées ici, mais elles ne viennent pas d'un document non plus. L'écart est
 * consigné dans `JOURNAL-TECHNIQUE.md` (règle 6).
 *
 * **Les deux reçoivent un persona depuis T8.4.** Le rattachement reste
 * facultatif (arbitrage du 19/08/2026) — ces deux lignes étaient des use cases
 * complets sans lui, et le sont encore —, mais aucune des deux ne l'exerçait, si
 * bien que la branche « rattaché » de la fiche ne se lisait dans aucun HTML
 * servi. Voir `USE_CASE_PERSONAS` juste en dessous : l'un porte **un** profil,
 * l'autre **deux**, et la liste se lit donc dans ses deux formes.
 */
const USE_CASES: { product: string; title: string; summary: string }[] = [
  {
    product: "Espace client web",
    title: "Démarrer, reprendre un projet",
    summary:
      "Créer ou retrouver un environnement de travail prêt à l'emploi (outils, données, compute…), avec réutilisation automatique des ressources existantes, afin de commencer l'analyse rapidement.",
  },
  {
    product: "Espace client web",
    title: "Gérer les droits d'accès",
    summary:
      "Donner et configurer facilement les accès pour consulter, modifier ou publier les éléments d'un projet, afin de collaborer en toute sécurité.",
  },
];

/**
 * Qui chaque use case sert — le rattachement que la fixture n'exerçait pas.
 *
 * **Un use case à un profil, l'autre à deux** : c'est ce qui rend lisibles les
 * deux formes de la liste de la fiche, là où un jeu uniforme n'en montrerait
 * qu'une. Aucun des deux ne reste sans rattachement, ce qui est l'objet même du
 * point refermé ici.
 *
 * La table porte son unicité en base (`use_case_personas_use_case_persona_unique`)
 * et le couple est un **identifiant**, jamais un libellé : cette clé-là ne se
 * renomme pas, et rien ne peut la recréer.
 */
const USE_CASE_PERSONAS: {
  /** Le produit, écrit ici plutôt que déduit : les deux clés en dépendent. */
  product: string;
  useCase: string;
  persona: string;
}[] = [
  {
    product: "Espace client web",
    useCase: "Démarrer, reprendre un projet",
    persona: "Utilisateur autonome",
  },
  {
    product: "Espace client web",
    useCase: "Gérer les droits d'accès",
    persona: "Utilisateur autonome",
  },
  {
    product: "Espace client web",
    useCase: "Gérer les droits d'accès",
    persona: "Responsable des accès",
  },
];

/* ==========================================================================
   Types dérivés du schéma — jamais réécrits à la main
   ========================================================================== */

type Nature = (typeof projectStatusNature.enumValues)[number];
type ToolKind = (typeof toolKind.enumValues)[number];
type StarterKind = (typeof starterKind.enumValues)[number];
type Family = (typeof activityFamily.enumValues)[number];
type ActivityState = (typeof activityState.enumValues)[number];
type DomainRole = (typeof domainRole.enumValues)[number];
type PersonaKind = (typeof personaKind.enumValues)[number];
type TraitKind = (typeof personaTraitKind.enumValues)[number];

/* ==========================================================================
   Le rapprochement

   Une seule lecture par table, puis un seul lot d'insertions. Ce qui existe
   déjà est reconnu par sa clé naturelle, ce qui a dérivé est remis à la
   valeur du fichier.
   ========================================================================== */

type Tally = {
  created: number;
  updated: number;
  /** Reconnue par son ancre ou par un ancien libellé, donc **pas** recréée. */
  renamed: number;
  unchanged: number;
};

const tallies = new Map<string, Tally>();

function record(table: string, outcome: keyof Tally, count = 1): void {
  const tally = tallies.get(table) ?? {
    created: 0,
    updated: 0,
    renamed: 0,
    unchanged: 0,
  };
  tally[outcome] += count;
  tallies.set(table, tally);
}

/**
 * Les renommages reconnus, nommés des deux côtés.
 *
 * **Une correction silencieuse est une correction qu'on redécouvre.** Le compte
 * rendu dit le chiffre ; ces lignes disent *quelle* ligne a été reprise et
 * depuis quel libellé, faute de quoi le geste de T8.4 serait invisible le jour
 * où il agit.
 */
const renames: string[] = [];

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

/** Ce que le fichier déclare pour une ligne, et ce qui la reconnaît. */
type Seed<T extends ScopedTable> = {
  /** La clé naturelle : le libellé, le nom, le titre. Celle qui se renomme. */
  key: string;
  /**
   * Ce qu'un renommage ne touche pas — la `position`, pour les huit
   * référentiels qui en portent une. Nulle là où la table n'a rien de tel.
   */
  anchor?: string;
  /**
   * Les libellés que cette ligne a portés avant, dans le fichier.
   *
   * C'est la fixture qui déclare ses propres renommages : sans cela, changer un
   * nom ici sème une ligne neuve et laisse l'ancienne orpheline — ce qui est
   * arrivé le 20/08/2026 avec « Audit d'accessibilité » → « Everyone ».
   */
  formerKeys?: string[];
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
  /** L'ancre d'une ligne en base. Absente : la table n'en porte pas. */
  anchorOfRow?: (row: Row<T>) => string | null,
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

  const rows = await scope.list(table, { includeArchived: true });
  const existing = new Map<string, Row<T>>();
  for (const row of rows) existing.set(keyOfRow(row), row);

  /* La reconnaissance se fait **avant toute écriture** : on résout d'abord les
     lignes, on écrit ensuite. Une ligne déjà revendiquée par un `seed` ne peut
     plus l'être par un autre — sans quoi deux lignes du fichier se
     disputeraient la même ligne en base. */
  const claimed = new Set<string>();
  const matched = new Map<string, Row<T>>();
  const renamedFrom = new Map<string, string>();

  for (const seed of seeds) {
    const row = existing.get(seed.key);
    if (!row) continue;
    claimed.add(rowId(row));
    matched.set(seed.key, row);
  }

  /** Une ligne que ni la fixture ni un autre `seed` ne désigne déjà. */
  const free = (row: Row<T>): boolean =>
    !claimed.has(rowId(row)) && !seen.has(keyOfRow(row));

  for (const seed of seeds) {
    if (matched.has(seed.key)) continue;

    /* L'ancre. **Deux candidates n'en désignent aucune** : le script ne devine
       jamais entre deux lignes, il insère et laisse la base telle quelle. */
    let found: Row<T> | undefined;
    if (anchorOfRow && seed.anchor !== undefined) {
      const candidates = rows.filter(
        (row) => free(row) && anchorOfRow(row) === seed.anchor,
      );
      if (candidates.length === 1) found = candidates[0];
    }

    /* Les anciens libellés, dans l'ordre déclaré. */
    if (!found) {
      for (const former of seed.formerKeys ?? []) {
        const row = existing.get(former);
        if (row && free(row)) {
          found = row;
          break;
        }
      }
    }

    if (!found) continue;
    claimed.add(rowId(found));
    matched.set(seed.key, found);
    renamedFrom.set(seed.key, keyOfRow(found));
  }

  const missing = seeds.filter((seed) => !matched.has(seed.key));

  for (const seed of seeds) {
    const row = matched.get(seed.key);
    if (!row) continue;

    const former = renamedFrom.get(seed.key);
    const current = row as unknown as Record<string, unknown>;
    const wanted = seed.values as unknown as Record<string, unknown>;
    const drifted = Object.keys(wanted).filter(
      (column) => !sameValue(current[column], wanted[column]),
    );

    if (drifted.length === 0 && former === undefined) {
      record(name, "unchanged");
      continue;
    }

    const updated = await scope.update(table, rowId(row), seed.values);
    if (updated) {
      existing.set(seed.key, updated);
      matched.set(seed.key, updated);
    }

    if (former === undefined) {
      record(name, "updated");
      continue;
    }

    /* La ligne existait sous un autre nom : elle est reprise, jamais doublée. */
    existing.delete(former);
    record(name, "renamed");
    renames.push(`${name} : « ${former} » reconnu, et rendu à « ${seed.key} ».`);
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

/**
 * L'ancre d'un référentiel ordonné : sa `position`, normalisée.
 *
 * PostgreSQL rend un `numeric(10,2)` cadré — `"3.00"` pour un `"3"` écrit —, et
 * comparer les deux chaînes telles quelles ne rapprocherait jamais rien. C'est
 * la raison d'être de `sameValue` juste au-dessus, resservie ici.
 */
const positionAnchor = (row: { position: string }): string =>
  String(Number(row.position));

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
      anchor: positionOf(index),
      values: { label, position: positionOf(index) },
    })),
    positionAnchor,
  );

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
        // Provisoire, et nulle là où aucune piste n'en réclame : voir TOOLS.
        baseUrl: tool.baseUrl ?? null,
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
     affiche, comme partout ailleurs dans ce fichier. */
  await ensureAll(
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
        bio: person.bio ?? null,
        hasAccess: person.role !== undefined,
        domainRole: person.role ?? null,
        isActive: true,
      },
    })),
  );

  // Les compétences portées. Table de liaison : elle se retire, elle ne
  // s'archive pas — d'où l'absence d'`archived_at` dans le schéma.
  await ensureAll(
    scope,
    personSkills,
    "person_skills",
    (row) => `${row.personId}·${row.skillId}`,
    PERSONS.flatMap((person) =>
      (person.skills ?? []).map((held) => {
        const personId = idOf(personIndex, person.fullName, "Personne");
        const skillId = idOf(skillIndex, held.skill, "Compétence");
        return {
          key: `${personId}·${skillId}`,
          values: {
            personId,
            skillId,
            levelId: idOf(levelIndex, held.level, "Niveau"),
          },
        };
      }),
    ),
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
        // Aucune date ici : la période d'un accompagnement se déduit des
        // périodes de ses activités, semées plus bas. `last_activity_at` n'est
        // pas écrit non plus — la couche d'accès le recalcule à chaque écriture
        // d'activité (docs/04 §6).
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
          externalUrl: activity.externalUrl ?? null,
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
          targetValue: INDICATOR.targetValue,
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
        },
      },
    ],
  );

  /* --- Les use cases ------------------------------------------------------ */

  /* La clé naturelle est le couple produit · titre, et non le titre seul :
     deux produits peuvent légitimement porter « Gérer les droits d'accès ».
     C'est la forme de la clé des relevés juste au-dessus, pour la même raison.

     **Le renommage recrée**, comme partout ailleurs dans ce fichier : c'est la
     dette de la clé naturelle, déjà consignée dans `ETAT.md`, et sans
     conséquence en production où l'amorçage ne tourne pas. */
  const useCaseIndex = await ensureAll(
    scope,
    useCases,
    "use_cases",
    (row) => `${row.productId}·${row.title}`,
    USE_CASES.map((useCase) => ({
      key: `${idOf(productIndex, useCase.product, "Produit")}·${useCase.title}`,
      values: {
        productId: idOf(productIndex, useCase.product, "Produit"),
        title: useCase.title,
        summary: useCase.summary,
      },
    })),
  );

  /* --- Les personae ------------------------------------------------------- */

  /* La clé naturelle est le couple produit · nom, pour la raison des use cases
     ci-dessus : deux produits peuvent porter le même archétype. `personas` ne
     porte pas de `position` — c'est l'une des tables que T8.4 laisse ouvertes au
     renommage en base, et l'en-tête du fichier les nomme toutes. */
  const personaIndex = await ensureAll(
    scope,
    personas,
    "personas",
    (row) => `${row.productId}·${row.name}`,
    PERSONAS.map((persona) => ({
      key: `${idOf(productIndex, persona.product, "Produit")}·${persona.name}`,
      values: {
        productId: idOf(productIndex, persona.product, "Produit"),
        name: persona.name,
        role: persona.role,
        summary: persona.summary,
        // Vision ne stocke aucun fichier : voir l'en-tête de PERSONAS.
        imageUrl: null,
        kind: persona.kind,
      },
    })),
  );

  /* Les traits. La clé est `persona · famille · rang`, et elle est **déjà
     stable** : c'est le libellé qui se récrit, jamais le rang, qui est l'ordre
     de saisie de la zone de texte. Table de liaison au sens de `scoped.ts` —
     aucun `archived_at`, une ligne se retire, elle ne s'archive pas. */
  await ensureAll(
    scope,
    personaTraits,
    "persona_traits",
    (row) => `${row.personaId}·${row.kind}·${row.position}`,
    PERSONAS.flatMap((persona) => {
      const personaId = idOf(
        personaIndex,
        `${idOf(productIndex, persona.product, "Produit")}·${persona.name}`,
        "Persona",
      );
      const ranks = new Map<TraitKind, number>();
      return (persona.traits ?? []).map((trait) => {
        const position = ranks.get(trait.kind) ?? 0;
        ranks.set(trait.kind, position + 1);
        return {
          key: `${personaId}·${trait.kind}·${position}`,
          values: {
            personaId,
            kind: trait.kind,
            label: trait.label,
            position,
          },
        };
      });
    }),
  );

  await ensureAll(
    scope,
    useCasePersonas,
    "use_case_personas",
    (row) => `${row.useCaseId}·${row.personaId}`,
    USE_CASE_PERSONAS.map((link) => {
      const product = idOf(productIndex, link.product, "Produit");
      const useCaseId = idOf(
        useCaseIndex,
        `${product}·${link.useCase}`,
        "Use case",
      );
      const personaId = idOf(
        personaIndex,
        `${product}·${link.persona}`,
        "Persona",
      );
      return { key: `${useCaseId}·${personaId}`, values: { useCaseId, personaId } };
    }),
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

  if (renames.length > 0) {
    console.log("");
    renames.forEach((line) => console.log(line));
  }

  console.log("");

  let created = 0;
  let updated = 0;
  let renamed = 0;
  for (const [table, tally] of tallies) {
    created += tally.created;
    updated += tally.updated;
    renamed += tally.renamed;
    console.log(
      `${table.padEnd(22)} ${String(tally.created).padStart(3)} créé(s)  ` +
        `${String(tally.updated).padStart(3)} mis à jour  ` +
        `${String(tally.renamed).padStart(3)} renommé(s)  ` +
        `${String(tally.unchanged).padStart(3)} inchangé(s)`,
    );
  }

  console.log(
    created === 0 && updated === 0 && renamed === 0
      ? "\nRien à faire : le domaine était déjà à jour."
      : `\n${created} ligne(s) créée(s), ${updated} mise(s) à jour, ` +
          `${renamed} reconnue(s) sous un autre nom.`,
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
