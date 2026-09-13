/**
 * L'amorçage du domaine de démonstration — les données factices, et elles
 * seules.
 *
 * `docs/05` §3 : « un domaine amorcé avec ses référentiels. Pas d'interface
 * d'administration : amorçage par script. » `docs/04` §6 le dit autrement :
 * créer un domaine implique de créer ses entités, métiers, statuts, types
 * d'activité, approches et outils.
 *
 * **Depuis T9.5, ce fichier n'est plus seul à amorcer.** L'écran au-dessus des
 * domaines crée des entreprises, et celle qu'il crée doit naître utilisable :
 * les **référentiels** sont donc partis dans `lib/db/bootstrap.ts`, et le
 * **rapprochement** de T8.4 dans `lib/db/reconcile.ts`. Ce script les appelle
 * comme l'action le fait, puis pose par-dessus ce que lui seul porte.
 *
 * Deux sources, et pas une de plus :
 *   — les **référentiels** viennent de `docs/02` §3-4, `docs/03` §2 et
 *     `docs/04` §2. Ils vivent dans `lib/db/bootstrap.ts`, et un domaine créé
 *     par l'écran reçoit exactement les mêmes ;
 *   — les **données factices** viennent de `docs/design/brief-design.md` §7,
 *     et de nulle part ailleurs. Un champ que le brief ne donne pas reste nul.
 *     **Elles restent ici, et un domaine créé par l'écran n'en reçoit aucune.**
 *
 * **Deux choses de ce fichier tiennent à la fixture et non au référentiel**, et
 * c'est l'arbitrage de T9.5 : les **entités** — les cinq divisions de
 * « Groupe Meridian », qu'on n'irait pas semer chez un vrai client — et les
 * **adresses des outils** (`TOOL_BASE_URLS`), qui appartiennent au client.
 *
 * **Règle 1 sans exception.** Ce script n'importe pas `lib/db/client.ts` : il
 * passe par `forDomain`, comme le reste du produit. `superAdmin` sert à la
 * seule table que rien ne peut scoper, `domains`.
 *
 * `actorId` est nul : l'amorçage n'a pas de personne courante. C'est
 * exactement ce que `created_by` nullable prévoyait.
 *
 * **Rejouable** : ce qui manque est créé, ce qui a dérivé est remis à la valeur
 * du fichier, le reste est laissé tel quel. Deux exécutions successives
 * laissent la base dans le même état, et la seconde dit « Rien à faire ». Les
 * trois temps du rapprochement — clé naturelle, ancre, anciens libellés — et le
 * résidu mesuré de `tools` se lisent désormais dans `lib/db/reconcile.ts`.
 *
 *   npm run db:seed
 */

import { bootstrapReferentials } from "../lib/db/bootstrap";
import {
  createReconciler,
  idOf,
  positionAnchor,
  positionOf,
} from "../lib/db/reconcile";
import {
  asSuperAdmin,
  forDomain,
  superAdmin,
  withoutAnySession,
} from "../lib/db/scoped";
import {
  activities,
  activityParticipants,
  activityState,
  domainIdentities,
  domainRole,
  entities,
  indicatorReadings,
  indicators,
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
  products,
  projects,
  resources,
  results,
  useCasePersonas,
  useCases,
} from "../lib/db/schema";

/* L'amorçage écrit hors de toute session — l'échappée nommée de T9.3. */
const outsideAnySession = asSuperAdmin(withoutAnySession("amorçage"));

/* ==========================================================================
   La fixture — le cadre (docs/04 §2)
   ========================================================================== */

/** Brief §7. Le domaine est le seul objet créé hors de la couche scopée. */
const DOMAIN = {
  name: "Groupe Meridian",
  competenceCenterName: "Centre de compétence Design & Produit",
};

/**
 * **L'identité vérifiée du domaine de démonstration** — 11/09/2026.
 *
 * **Sans elle, le jeu de démonstration était incohérent** : un domaine sans
 * aucune ligne `domain_identities` est un domaine qu'**aucun jeton ne
 * désigne**, donc où personne ne peut ouvrir de session — quand ce même jeu
 * sème huit personnes dont deux avec un accès. Toute entreprise créée par
 * l'écran en reçoit une **dans le même geste** (T9.4) ; seule celle-ci, née
 * avant le SSO, n'en avait pas. Les deux écrans le disaient en toutes lettres,
 * chacun à sa place — *« Aucune identité — aucun jeton ne la désigne »* sur la
 * liste, l'état vide du bloc sur la fiche.
 *
 * **Provisoire et prouvablement provisoire**, exactement comme `TOOL_BASE_URLS`
 * ci-dessous et pour la même raison : `example.com` est le domaine réservé à la
 * documentation (RFC 2606), et un sous-domaine en est la seule forme qui soit
 * plausible dans sa structure **et** incapable d'atteindre un tiers réel par
 * accident. Une identité vérifiée est un nom de domaine nu, jamais une URL.
 *
 * **`google` parce que c'est le seul fournisseur branché** : Entra ID est écrit
 * et n'a ni `ENTRA_CLIENT_ID` ni secret (`ETAT.md`). Semer un fournisseur qu'on
 * ne peut pas éprouver serait semer une promesse.
 *
 * **Ce qui reste ouvert, et qui n'est pas de ce geste** : les huit personnes du
 * brief n'ont **aucune adresse** — `email` est nul, le brief n'en donne pas —,
 * si bien que le domaine est *désigné* sans être encore *connectable*. La
 * seconde moitié du point ouvert tient toujours.
 */
const DOMAIN_IDENTITY = {
  provider: "google",
  value: "meridian.example.com",
} as const;

/** Brief §7. */
const ENTITIES = [
  "Banque de détail",
  "Assurance",
  "Corporate",
  "Digital Factory",
  "RH & Interne",
];

/**
 * Les adresses des outils du domaine de démonstration — la fixture, et elle
 * seule.
 *
 * **Le référentiel des outils vit désormais dans `lib/db/bootstrap.ts`, sans
 * adresse** (T9.5) : `base_url` appartient au client, pas au référentiel. Ce
 * qui reste ici est ce que le brief ne donne pas et que le bloc « Démarrage »
 * exige — une adresse pour ouvrir quelque chose.
 *
 * **Elles sont provisoires**, et posées sur `example.com`, le domaine réservé à
 * la documentation : la seule forme qui soit plausible dans sa structure et
 * prouvablement provisoire, incapable d'atteindre un tiers réel par accident.
 * « Outil budget » reste sans adresse — aucune piste ne le désigne.
 */
const TOOL_BASE_URLS: Readonly<Record<string, string>> = {
  Ergonome: "https://ergonome.example.com",
  Everyone: "https://everyone.example.com",
  "Portail analytics": "https://analytics.example.com",
  "Google Analytics 4": "https://analytics.google.com",
  Matomo: "https://matomo.example.com",
  "Microsoft Clarity": "https://clarity.microsoft.com",
};

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

type ActivityState = (typeof activityState.enumValues)[number];
type DomainRole = (typeof domainRole.enumValues)[number];
type PersonaKind = (typeof personaKind.enumValues)[number];
type TraitKind = (typeof personaTraitKind.enumValues)[number];

/* ==========================================================================
   L'amorçage
   ========================================================================== */

async function seed(): Promise<void> {
  const host = process.env.DATABASE_URL
    ? new URL(process.env.DATABASE_URL).host
    : "(inconnu)";
  console.log(`Amorçage de « ${DOMAIN.name} » sur ${host}\n`);

  /* Le rapprochement de T8.4 et son compte rendu, créés pour cette exécution.
     Ils vivaient en globales de ce fichier jusqu'à T9.5 ; ils sont désormais
     dans `lib/db/reconcile.ts`, que l'écran au-dessus des domaines appelle
     aussi. */
  const reconciler = createReconciler();
  const { ensureAll, record, tallies, renames } = reconciler;

  /* --- Le domaine ------------------------------------------------------- */

  const known = await superAdmin.listDomains({ includeArchived: true });
  const existingDomain = known.find((row) => row.name === DOMAIN.name);
  const domain =
    existingDomain ?? (await outsideAnySession.createDomain(DOMAIN));
  record("domains", existingDomain ? "unchanged" : "created");

  const scope = forDomain({ domainId: domain.id, actorId: null });

  /* --- L'identité vérifiée ----------------------------------------------- */

  /* **Elle vient juste après le domaine**, et avant tout le reste : c'est
     l'ordre de l'écran au-dessus des domaines, où la création pose le domaine
     puis son identité avant d'amorcer quoi que ce soit.

     **La confrontation précède l'écriture**, comme dans `createDomain` :
     `domain_identities_provider_value_unique` est **globale**, pas bornée au
     domaine. Sans elle, une seconde exécution après qu'un autre domaine a pris
     la même valeur ferait lever la couche au lieu de dire ce qui se passe.

     **Rejouable** : `findDomainIdentity` compare en minuscules, donc la
     deuxième exécution reconnaît la ligne et ne réécrit rien. Une identité
     rattachée **ailleurs** n'est ni déplacée ni effacée — la règle 4 vaut aussi
     pour un rattachement —, elle est dite. */
  const takenIdentity = await superAdmin.findDomainIdentity(
    DOMAIN_IDENTITY.provider,
    DOMAIN_IDENTITY.value,
  );

  if (!takenIdentity) {
    await scope.insert(domainIdentities, { ...DOMAIN_IDENTITY });
    record("domain_identities", "created");
  } else if (takenIdentity.domainId === domain.id) {
    record("domain_identities", "unchanged");
  } else {
    record("domain_identities", "unchanged");
    console.warn(
      `  ⚠ « ${DOMAIN_IDENTITY.value} » est rattachée à une autre entreprise : ` +
        "rien n'a été touché, et le domaine de démonstration reste sans identité vérifiée.",
    );
  }

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

  /* Les huit référentiels du domaine, posés par `lib/db/bootstrap.ts` — le
     module que l'écran au-dessus des domaines appelle aussi (T9.5). La fixture
     n'y ajoute que les adresses de ses outils, qui appartiennent au client et
     non au référentiel. */
  const referentials = await bootstrapReferentials(scope, reconciler, {
    toolBaseUrls: TOOL_BASE_URLS,
  });

  const jobIndex = referentials.jobs;
  const skillIndex = referentials.skills;
  const levelIndex = referentials.skillLevels;
  const approachIndex = referentials.approaches;
  const statusIndex = referentials.projectStatuses;
  const toolIndex = referentials.tools;
  const typeIndex = referentials.activityTypes;

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
