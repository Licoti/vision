/**
 * La saisie d'un projet : lecture du formulaire, et validation.
 *
 * **Ni base, ni Next, ni React**, comme `lib/forms/product.ts` — c'est ce qui
 * rend la règle énonçable et vérifiable seule, sans branche Neon ni fixture.
 *
 * Ce module ne valide **que la forme** : un nom non vide, des identifiants qui
 * ressemblent à des identifiants, des dates qui existent, des rôles d'équipe
 * qui appartiennent à leur énuméré. Il ne dit rien de l'existence du produit,
 * du statut, d'un métier ou d'une personne dans le domaine : cette question
 * appartient au domaine, donc à `lib/db/scoped.ts`. Revérifier ici poserait
 * une seconde autorité, qui divergerait un jour de la première.
 *
 * Un projet écrit cinq tables là où un produit en écrivait une. La forme des
 * valeurs le reflète : la ligne `projects` d'un côté, les liaisons de l'autre.
 */

import { personKind } from "@/lib/db/schema";
import { isUuid } from "@/lib/uuid";

/** `center` · `stakeholder`. Dérivé du schéma, jamais réécrit à la main. */
export type PersonKind = (typeof personKind.enumValues)[number];

/**
 * D19 — une personne peut être référencée sans compte. Le libellé dit de quel
 * côté elle se tient, seule chose que le formulaire ait besoin d'en savoir.
 */
export const PERSON_KIND_LABEL: Record<PersonKind, string> = {
  center: "Côté centre de compétence",
  stakeholder: "Côté entité",
};

/* ==========================================================================
   L'équipe

   D9 — appartenir à l'équipe et avoir le droit d'écrire sont deux choses
   distinctes. Une seule valeur par personne les porte toutes les deux : c'est
   ce qui rend impossible l'état « contributeur sans être membre », qu'il
   faudrait sinon rattraper à la validation.
   ========================================================================== */

export const TEAM_ROLES = ["none", "member", "contributor"] as const;

export type TeamRole = (typeof TEAM_ROLES)[number];

export const TEAM_ROLE_LABEL: Record<TeamRole, string> = {
  none: "Pas dans l'équipe",
  member: "Membre",
  contributor: "Contributeur",
};

export function isTeamRole(value: string): value is TeamRole {
  return (TEAM_ROLES as readonly string[]).includes(value);
}

export function isPersonKind(value: string): value is PersonKind {
  return (personKind.enumValues as readonly string[]).includes(value);
}

/** Le préfixe des champs d'équipe : `team:{personId}`. */
export const TEAM_FIELD_PREFIX = "team:";

export function teamFieldName(personId: string): string {
  return `${TEAM_FIELD_PREFIX}${personId}`;
}

/* ==========================================================================
   Ce que la personne a saisi
   ========================================================================== */

/** Des chaînes et des tableaux de chaînes, jamais des objets métier. */
export type ProjectFormValues = {
  productId: string;
  name: string;
  objective: string;
  sponsor: string;
  statusId: string;
  /** Colonnes `date` : `YYYY-MM-DD`, telles que les rend `input type="date"`. */
  startedOn: string;
  expectedEndOn: string;
  jobIds: string[];
  approachIds: string[];
  /** `personId` → rôle saisi. Les personnes hors équipe y figurent aussi. */
  team: Record<string, string>;
  newPersonName: string;
  newPersonKind: string;
  newPersonRole: string;
};

export type ProjectFormErrors = Partial<
  Record<keyof ProjectFormValues | "newPerson", string>
>;

/**
 * L'état que `useActionState` fait circuler entre le formulaire et l'action.
 * Il porte les valeurs autant que les erreurs : sans elles, une équipe de dix
 * personnes serait à ressaisir au premier nom oublié.
 */
export type ProjectFormState = {
  values: ProjectFormValues;
  errors: ProjectFormErrors;
  /** Un empêchement qui n'appartient à aucun champ : un droit, une panne. */
  message?: string;
};

export const EMPTY_PROJECT_VALUES: ProjectFormValues = {
  productId: "",
  name: "",
  objective: "",
  sponsor: "",
  statusId: "",
  startedOn: "",
  expectedEndOn: "",
  jobIds: [],
  approachIds: [],
  team: {},
  newPersonName: "",
  newPersonKind: "stakeholder",
  newPersonRole: "member",
};

/** Le champ, lu et rogné. Absent ou d'un type inattendu, il vaut « vide ». */
function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Les valeurs cochées d'un champ multiple, rognées et dédoublonnées.
 *
 * Le dédoublonnage n'est pas une politesse : `project_jobs` porte une
 * contrainte d'unicité sur le couple projet/métier, et deux cases de même
 * valeur feraient échouer l'écriture entière.
 */
function fields(formData: FormData, name: string): string[] {
  const values = formData
    .getAll(name)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
  return [...new Set(values)];
}

/**
 * Les champs du ticket, et eux seuls.
 *
 * L'action ne construit jamais sa ligne par étalement d'un `FormData` : un
 * champ caché ajouté par n'importe qui deviendrait une colonne écrite. Les
 * champs d'équipe font exception à la lecture nommée — ils sont ouverts par
 * construction, une par personne du domaine — mais pas à la vérification : la
 * clé doit avoir la forme d'un identifiant, la valeur appartenir à l'énuméré.
 */
export function readProjectForm(formData: FormData): ProjectFormValues {
  const team: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith(TEAM_FIELD_PREFIX)) continue;
    if (typeof value !== "string") continue;
    team[key.slice(TEAM_FIELD_PREFIX.length)] = value.trim();
  }

  return {
    productId: field(formData, "productId"),
    name: field(formData, "name"),
    objective: field(formData, "objective"),
    sponsor: field(formData, "sponsor"),
    statusId: field(formData, "statusId"),
    startedOn: field(formData, "startedOn"),
    expectedEndOn: field(formData, "expectedEndOn"),
    jobIds: fields(formData, "jobIds"),
    approachIds: fields(formData, "approachIds"),
    team,
    newPersonName: field(formData, "newPersonName"),
    newPersonKind: field(formData, "newPersonKind") || "stakeholder",
    newPersonRole: field(formData, "newPersonRole") || "member",
  };
}

/* ==========================================================================
   Les dates

   Les colonnes sont en `date` : la valeur y va telle quelle, en `YYYY-MM-DD`.
   L'affichage, lui, reste au mois partout (D13, `formatPeriod`) — on saisit
   plus fin qu'on n'affiche, et c'est assumé.
   ========================================================================== */

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Vrai si la chaîne est une date qui **existe**.
 *
 * Le motif seul ne suffit pas : `2026-02-31` le satisfait et PostgreSQL le
 * refuse — donc une exception là où l'on attend un message de champ. Le
 * rapprochement passe par l'aller-retour, seul moyen de voir que le 31 février
 * s'est déplacé au 3 mars.
 */
export function isIsoDay(value: string): boolean {
  if (!ISO_DAY.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

/* ==========================================================================
   La validation
   ========================================================================== */

export function validateProjectForm(
  values: ProjectFormValues,
): ProjectFormErrors {
  const errors: ProjectFormErrors = {};

  // La forme est vérifiée avant la base, pour la raison exposée dans
  // `lib/uuid.ts` : une colonne `uuid` interrogée avec n'importe quoi rend une
  // erreur PostgreSQL, donc un 500, là où l'on attend un message de champ.
  if (!values.productId) {
    // D4 — le rattachement à un produit est obligatoire, sans exception (D10).
    errors.productId = "Le produit accompagné est obligatoire.";
  } else if (!isUuid(values.productId)) {
    errors.productId = "Ce produit n'est pas reconnu.";
  }

  if (!values.name) {
    errors.name = "Le nom de l'accompagnement est obligatoire.";
  }

  if (!values.statusId) {
    errors.statusId = "Le statut est obligatoire.";
  } else if (!isUuid(values.statusId)) {
    errors.statusId = "Ce statut n'est pas reconnu.";
  }

  if (values.startedOn && !isIsoDay(values.startedOn)) {
    errors.startedOn = "Cette date de début n'existe pas.";
  }

  if (values.expectedEndOn && !isIsoDay(values.expectedEndOn)) {
    errors.expectedEndOn = "Cette date de fin n'existe pas.";
  }

  // Le schéma ne porte aucune contrainte sur ce couple : la règle est ici, et
  // nulle part ailleurs. Comparaison de chaînes — deux dates `YYYY-MM-DD`
  // s'ordonnent lexicographiquement comme elles s'ordonnent dans le temps.
  if (
    !errors.startedOn &&
    !errors.expectedEndOn &&
    values.startedOn &&
    values.expectedEndOn &&
    values.expectedEndOn < values.startedOn
  ) {
    errors.expectedEndOn =
      "La fin attendue ne peut pas précéder le début de l'accompagnement.";
  }

  if (values.jobIds.some((id) => !isUuid(id))) {
    errors.jobIds = "Un métier sélectionné n'est pas reconnu.";
  }

  if (values.approachIds.some((id) => !isUuid(id))) {
    errors.approachIds = "Une approche sélectionnée n'est pas reconnue.";
  }

  const teamEntries = Object.entries(values.team);
  if (teamEntries.some(([personId]) => !isUuid(personId))) {
    errors.team = "Une personne de l'équipe n'est pas reconnue.";
  } else if (teamEntries.some(([, role]) => !isTeamRole(role))) {
    errors.team = "Un rôle d'équipe n'existe pas.";
  }

  // Le nom vide n'est pas une erreur : c'est un bloc d'ajout qu'on n'a pas
  // rempli. Rempli, en revanche, il doit l'être correctement.
  if (values.newPersonName) {
    if (!isPersonKind(values.newPersonKind)) {
      errors.newPerson = "Le rattachement de cette personne n'existe pas.";
    } else if (
      !isTeamRole(values.newPersonRole) ||
      values.newPersonRole === "none"
    ) {
      errors.newPerson =
        "Une personne ajoutée rejoint l'équipe : membre, ou contributeur.";
    }
  }

  return errors;
}

/* ==========================================================================
   De la saisie aux lignes
   ========================================================================== */

/** Les colonnes de `projects` que ce formulaire écrit, et pas une de plus. */
export type ProjectRowInput = {
  productId: string;
  name: string;
  objective: string | null;
  sponsor: string | null;
  statusId: string;
  startedOn: string | null;
  expectedEndOn: string | null;
};

/** Une désignation d'équipe, telle qu'elle part en base. */
export type ProjectMemberInput = { personId: string; isContributor: boolean };

/** La personne ajoutée à la main (D19). Une par soumission, au plus. */
export type NewPersonInput = {
  fullName: string;
  kind: PersonKind;
  isContributor: boolean;
};

/** Tout ce que l'action doit écrire, réparti par table. */
export type ProjectInput = {
  row: ProjectRowInput;
  jobIds: string[];
  approachIds: string[];
  members: ProjectMemberInput[];
  newPerson: NewPersonInput | null;
};

/**
 * Un champ facultatif tel qu'il part en base : `null` plutôt que `""`.
 *
 * Un champ non renseigné n'est pas une chaîne vide — les colonnes sont
 * nullables pour cette raison, et la page projet teste `sponsor` pour choisir
 * entre la valeur et « Non renseigné ». Une chaîne vide y passerait pour un
 * commanditaire et afficherait un blanc.
 */
export function valueOrNull(value: string): string | null {
  return value || null;
}

/**
 * Lit le formulaire, le valide, et rend les lignes prêtes à écrire.
 *
 * `input` est non nul **si et seulement si** `errors` est vide : c'est ce qui
 * évite d'affirmer par un `as` un type que la validation venait de prouver. Un
 * `as` tiendrait aujourd'hui et mentirait le jour où une quatrième valeur
 * entrerait dans un énuméré.
 */
export function parseProjectForm(formData: FormData): {
  values: ProjectFormValues;
  errors: ProjectFormErrors;
  input: ProjectInput | null;
} {
  const values = readProjectForm(formData);
  const errors = validateProjectForm(values);

  if (Object.keys(errors).length > 0) return { values, errors, input: null };

  const members: ProjectMemberInput[] = [];
  for (const [personId, role] of Object.entries(values.team)) {
    // La validation vient de le prouver ; le vérifier de nouveau coûte une
    // ligne et évite l'affirmation.
    if (!isTeamRole(role) || role === "none") continue;
    members.push({ personId, isContributor: role === "contributor" });
  }

  const newPerson: NewPersonInput | null =
    values.newPersonName &&
    isPersonKind(values.newPersonKind) &&
    isTeamRole(values.newPersonRole) &&
    values.newPersonRole !== "none"
      ? {
          fullName: values.newPersonName,
          kind: values.newPersonKind,
          isContributor: values.newPersonRole === "contributor",
        }
      : null;

  return {
    values,
    errors,
    input: {
      row: {
        productId: values.productId,
        name: values.name,
        objective: valueOrNull(values.objective),
        sponsor: valueOrNull(values.sponsor),
        statusId: values.statusId,
        startedOn: valueOrNull(values.startedOn),
        expectedEndOn: valueOrNull(values.expectedEndOn),
      },
      jobIds: values.jobIds,
      approachIds: values.approachIds,
      members,
      newPerson,
    },
  };
}
