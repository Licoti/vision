/**
 * La saisie d'une **personne** : lecture du formulaire, et validation.
 *
 * **Ni base, ni Next, ni React**, comme les douze modules qui le précèdent dans
 * ce dossier. C'est ce qui rend la règle énonçable et vérifiable seule, sans
 * branche Neon ni fixture.
 *
 * Ce module ne valide **que la forme** : un nom non vide, un genre qui
 * appartient à son énuméré, un métier qui ressemble à un identifiant, une
 * adresse qu'un fournisseur pourrait vérifier. Il ne dit rien de l'existence du
 * métier dans le domaine, ni du droit d'écrire un profil, ni de l'unicité de
 * l'adresse dans le domaine : ces questions appartiennent au domaine, donc à
 * l'action et à `lib/db/scoped.ts`. Revérifier ici poserait une seconde
 * autorité, qui divergerait un jour de la première.
 *
 * **Cinq champs depuis T9.6, et pas un de plus.** `email` est entré avec le
 * geste qui le rend nécessaire : la règle d'entrée 6 de `tickets-C9.md`
 * rapproche une identité **sur l'e-mail au premier passage** (`lib/auth/entry.ts`),
 * et une personne sans adresse n'est joignable par aucun fournisseur. `source`,
 * `has_access`, `domain_role` et `is_active` ne se saisissent **pas ici** : la
 * première est posée à la création (`manual`, D19) ; les deux du milieu se
 * posent **ensemble**, par le formulaire d'accès du bas de ce fichier, et jamais
 * par celui-ci ; `is_active` est une désactivation d'annuaire et non un droit,
 * et rien ne l'écrit encore.
 *
 * **Ce que cet en-tête a promis à C7 pendant deux chantiers.** Il disait que les
 * trois dernières *« appartiennent à l'authentification, que C7 reprendra »* —
 * sixième énoncé de la famille des promesses faites à C7, et **c'est C9 qui l'a
 * fait**, en T9.6. Un commentaire faux vaut une ligne de code fausse (leçon de
 * T7.5).
 *
 * **La disponibilité n'est plus un champ** (28/08/2026) : elle se **déduit** du
 * nombre d'accompagnements vivants (`lib/availability.ts`), et une valeur déduite
 * ne se saisit pas. Le champ, sa validation, son effacement au passage du centre
 * à l'entité et le `CHECK` qui les doublait sont tombés ensemble.
 *
 * **Aucun champ de score, de date de validation ni d'historique** : Vision ne
 * mesure pas une personne (garde-fous 1 et 2, D39).
 */

import { domainRole, personKind } from "@/lib/db/schema";
import { isEmailAddress } from "@/lib/forms/domain-manager";
import { valueOrNull } from "@/lib/forms/project";

/**
 * `center` · `stakeholder`. Dérivé du schéma, jamais réécrit à la main — la
 * règle d'`IndicatorDirectionValue`.
 *
 * Jumeau assumé de `PersonKind` (`lib/queries/team.ts`) : ce dossier ne dépend
 * pas de `lib/queries`, qui traîne un `ScopedDb` dont un module de formulaire
 * n'a que faire. Les deux dérivent du **même** énuméré : elles ne peuvent pas
 * diverger.
 */
export type PersonKindValue = (typeof personKind.enumValues)[number];

/** Les deux genres, dans l'ordre du schéma — celui que le `select` propose. */
export const PERSON_KIND_VALUES: readonly PersonKindValue[] =
  personKind.enumValues;

/**
 * Les deux mots du genre, tels que l'écran les propose.
 *
 * Ils vivent ici et non dans `lib/format.ts`, hors du périmètre du ticket. Le
 * vocabulaire est celui que la liste et la fiche emploient depuis T5bis.2 —
 * « côté entité » —, et non un troisième.
 */
export const PERSON_KIND_LABEL: Record<PersonKindValue, string> = {
  center: "Membre du centre",
  stakeholder: "Intervenant côté entité",
};

export function isPersonKind(value: string): value is PersonKindValue {
  return (personKind.enumValues as readonly string[]).includes(value);
}

/* ==========================================================================
   Ce que la personne a saisi
   ========================================================================== */

/** Cinq chaînes, jamais un objet métier. */
export type PersonFormValues = {
  /** « Camille Roux ». Obligatoire — `not null`. */
  fullName: string;
  /**
   * L'adresse que le fournisseur d'identité vérifiera (T9.6).
   *
   * **Facultative tant qu'aucun accès n'est accordé, obligatoire au moment où
   * l'accès l'est** : D19 sépare *être référencé* de *pouvoir se connecter*, et
   * une personne référencée n'a pas besoin d'adresse. La colonne est nullable ;
   * l'obligation ne vient donc pas de la base, elle vient du geste, et c'est
   * `emailRequired` qui la porte.
   */
  email: string;
  /** Facultatif : une personne hors centre n'a pas de métier design. */
  jobId: string;
  /** Obligatoire — `not null`, et sans valeur par défaut dans le schéma. */
  kind: string;
  /** La courte présentation. Facultative — la colonne est nullable. */
  bio: string;
};

export type PersonFormErrors = Partial<Record<keyof PersonFormValues, string>>;

/**
 * L'état que `useActionState` fait circuler entre le panneau et l'action.
 * Il porte les valeurs autant que les erreurs : une saisie refusée revient dans
 * le panneau avec ce qui a été tapé, jamais vidée.
 */
export type PersonFormState = {
  values: PersonFormValues;
  errors: PersonFormErrors;
  /** Un empêchement qui n'appartient à aucun champ : un droit, une ligne rangée. */
  message?: string;
  /** L'écriture a eu lieu : le panneau se referme (TD.2). */
  ok?: boolean;
};

export const EMPTY_PERSON_VALUES: PersonFormValues = {
  fullName: "",
  email: "",
  jobId: "",
  kind: "",
  bio: "",
};

/**
 * La ligne déjà enregistrée, ramenée aux cinq chaînes du formulaire — le
 * pré-remplissage du panneau en correction.
 *
 * `null` devient `""` : le formulaire ne connaît que des chaînes, et l'absence
 * s'y écrit vide. La règle de `toIndicatorFormValues`.
 */
export function toPersonFormValues(row: {
  fullName: string;
  email: string | null;
  jobId: string | null;
  kind: PersonKindValue;
  bio: string | null;
}): PersonFormValues {
  return {
    fullName: row.fullName,
    email: row.email ?? "",
    jobId: row.jobId ?? "",
    kind: row.kind,
    bio: row.bio ?? "",
  };
}

/** Le champ, lu et rogné. Absent ou d'un type inattendu, il vaut « vide ». */
function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Les cinq champs du ticket, et eux seuls.
 *
 * L'action ne construit jamais sa ligne par étalement d'un `FormData` : un champ
 * caché ajouté par n'importe qui deviendrait une colonne écrite — et
 * `has_access` comme `domain_role` sont précisément les colonnes qu'un tel champ
 * atteindrait.
 *
 * **L'adresse est abaissée**, du même côté que le rapprochement de la règle
 * d'entrée 6, qui compare en `lower(email)` des deux côtés
 * (`lib/auth/entry.ts`). Une adresse saisie en capitales ne doit pas rendre un
 * compte injoignable. C'est la règle de `readDomainManagerForm`, et la même
 * ligne.
 */
export function readPersonForm(formData: FormData): PersonFormValues {
  return {
    fullName: field(formData, "fullName"),
    email: field(formData, "email").toLowerCase(),
    jobId: field(formData, "jobId"),
    kind: field(formData, "kind"),
    bio: field(formData, "bio"),
  };
}

/**
 * La forme d'un identifiant, **recopiée plutôt qu'importée**, et c'est un choix.
 *
 * `lib/uuid.ts` est le module des points d'entrée serveur : l'importer ferait
 * entrer dans ce dossier une dépendance qui n'y a rien à faire, et les douze
 * modules voisins tiennent pour règle de ne rien connaître d'autre que du
 * texte. Le motif n'est pas un contrôle de domaine — celui-là vit dans
 * `assertPreconditions`, et il n'est écrit qu'une fois.
 */
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* ==========================================================================
   La validation
   ========================================================================== */

/**
 * Ce que l'appelant sait et que le formulaire ne peut pas deviner.
 *
 * **Un seul drapeau, et il vient du serveur.** `createPerson` passe faux — une
 * personne naît sans compte (D19), et l'accès est un geste explicite et séparé.
 * `updatePerson` passe `has_access` de la ligne **relue en base**, jamais un
 * champ du formulaire : la valeur qui décide de l'obligation ne peut pas venir
 * de la saisie qu'elle contraint.
 */
export type PersonFormOptions = {
  /** La personne porte déjà un accès : son adresse cesse d'être facultative. */
  emailRequired?: boolean;
};

export function validatePersonForm(
  values: PersonFormValues,
  options: PersonFormOptions = {},
): PersonFormErrors {
  const errors: PersonFormErrors = {};

  if (!values.fullName) {
    errors.fullName = "Le nom de la personne est obligatoire.";
  }

  /* **`isEmailAddress` est réemployée, jamais récrite** : T9.4 l'exporte depuis
     `lib/forms/domain-manager.ts` en écrivant pourquoi — c'est la **même** règle
     de forme, et deux copies divergent un jour ; c'est celle qu'on a oublié de
     corriger qui laisse passer. La seule autorité sur la validité d'une adresse
     reste le fournisseur d'identité. */
  if (!values.email) {
    if (options.emailRequired) {
      errors.email =
        "Cette personne a un accès : son adresse e-mail est obligatoire, c'est elle qui rapproche son compte de son identité.";
    }
  } else if (!isEmailAddress(values.email)) {
    errors.email = "Cette adresse e-mail n'est pas valide.";
  }

  /* La liste est fermée, et le second contrôle n'est pas décoratif : le `select`
     ne propose que les deux valeurs de l'énuméré, mais une soumission forgée
     porte ce qu'elle veut, et une valeur hors énuméré rendrait une erreur
     PostgreSQL — un 500 — là où l'on attend un message de champ. */
  if (!values.kind) {
    errors.kind = "Le genre de la personne est obligatoire.";
  } else if (!isPersonKind(values.kind)) {
    errors.kind = "Ce genre de personne n'existe pas.";
  }

  /* Le métier est facultatif ; ce qui ne l'est pas, c'est que ce qui arrive
     **ressemble** à un identifiant. Son appartenance au domaine est une autre
     question, que la couche d'accès tranche à l'écriture. */
  if (values.jobId && !UUID.test(values.jobId)) {
    errors.jobId =
      "Ce métier n'est pas désigné correctement : la saisie n'a pas été enregistrée.";
  }

  // `bio` n'est pas validée : un texte libre, nullable en base. Lui imposer une
  // forme serait décider à la place de qui écrit.

  return errors;
}

/* ==========================================================================
   De la saisie aux lignes
   ========================================================================== */

/**
 * Les colonnes de `persons` que ce formulaire écrit, et pas une de plus.
 *
 * `source`, `has_access`, `domain_role` et `is_active` n'y figurent pas : la
 * première est posée par la création, les deux du milieu se posent **ensemble**
 * par `parsePersonAccessForm` — jamais ici, sans quoi un champ caché suffirait à
 * se donner un rôle —, et rien n'écrit `is_active`.
 */
export type PersonRowInput = {
  fullName: string;
  /** `null` quand rien n'est saisi : l'adresse est facultative sans accès (D19). */
  email: string | null;
  /** `null` quand rien n'est choisi : une personne hors centre n'a pas de métier. */
  jobId: string | null;
  kind: PersonKindValue;
  /** `null` quand rien n'est saisi : la présentation est facultative. */
  bio: string | null;
};

/**
 * Lit le formulaire, le valide, et rend la ligne prête à écrire.
 *
 * `input` est non nul **si et seulement si** `errors` est vide : la propriété
 * posée en T2.5, qui évite d'affirmer par un `as` un type que la validation
 * venait de prouver. Un `as` tiendrait aujourd'hui et mentirait le jour où une
 * troisième valeur entrerait dans l'un des deux énumérés.
 *
 * Le genre est donc **renarrowé** ici plutôt qu'affirmé — la forme exacte de
 * `parseIndicatorForm`. Le rattrapage qui suit est inatteignable,
 * `validatePersonForm` ayant déjà posé l'erreur, et il coûte deux lignes :
 * c'est ce qui garantit la propriété ci-dessus **par construction**, plutôt que
 * par la lecture croisée de deux fonctions.
 *
 * **Ils étaient deux énumérés** jusqu'au 28/08/2026 : la disponibilité est
 * partie avec le champ qui la saisissait.
 */
export function parsePersonForm(
  formData: FormData,
  options: PersonFormOptions = {},
): {
  values: PersonFormValues;
  errors: PersonFormErrors;
  input: PersonRowInput | null;
} {
  const values = readPersonForm(formData);
  const errors = validatePersonForm(values, options);

  const kind = isPersonKind(values.kind) ? values.kind : null;
  if (!kind && !errors.kind) errors.kind = "Ce genre de personne n'existe pas.";

  if (!kind || Object.keys(errors).length > 0) {
    return { values, errors, input: null };
  }

  return {
    values,
    errors,
    input: {
      fullName: values.fullName,
      email: valueOrNull(values.email),
      jobId: valueOrNull(values.jobId),
      kind,
      bio: valueOrNull(values.bio),
    },
  };
}

/* ==========================================================================
   L'accès au domaine — T9.6

   **Un second formulaire dans le même module**, sur le précédent de
   `lib/forms/domain.ts`, qui porte le domaine et son identité vérifiée depuis
   T9.4. La raison est la même : c'est le même objet — une personne —, vu par
   deux gestes que tout sépare. Le profil se corrige par tout ce qui peut écrire
   dans le domaine ; l'accès **se donne**, et il ne se glisse pas dans un champ
   du profil.
   ========================================================================== */

/**
 * `domain_manager` · `member`. Dérivé du schéma, jamais réécrit à la main — la
 * règle de `PersonKindValue`, cinq cents lignes plus haut.
 *
 * Jumeau assumé de `DomainRole` (`lib/auth/session.ts`), et pour la raison qui
 * fait déjà le jumeau de `PersonKind` : ce dossier ne dépend ni de
 * `lib/auth`, ni de `lib/queries`. Les deux dérivent du **même** énuméré : elles
 * ne peuvent pas diverger.
 *
 * **Deux rôles, et pas un troisième** : un super administrateur ne vit pas dans
 * `persons` (arbitrage (4) de `tickets-C9.md`) — `persons.domain_id` est
 * obligatoire, et ce qui est au-dessus des domaines ne se scope pas.
 */
export type PersonRoleValue = (typeof domainRole.enumValues)[number];

/** Les deux rôles, dans l'ordre du schéma — celui que le `select` propose. */
export const PERSON_ROLE_VALUES: readonly PersonRoleValue[] =
  domainRole.enumValues;

/**
 * Les deux mots du rôle, tels que l'écran les propose.
 *
 * **Troisième copie du couple**, avec `components/shell/current-person.tsx` et
 * `app/dev/session/page.tsx` — le constat part dans `ETAT.md`, vers T7.9, qui
 * porte déjà quatre libellés hors de `lib/format.ts`. Les mots sont ceux du
 * bandeau de session, au pluriel près : deux écrans qui nommeraient le même rôle
 * de deux façons seraient un défaut.
 */
export const PERSON_ROLE_LABEL: Record<PersonRoleValue, string> = {
  domain_manager: "Responsable de domaine",
  member: "Membre",
};

/**
 * Ce que chaque rôle donne, dit à qui l'accorde.
 *
 * La note vit ici, à côté des mots qu'elle explique : le panneau la rend, il ne
 * la rédige pas. Les termes sont ceux de `docs/02` §3 — *« désigner les
 * contributeurs d'un projet, gérer les référentiels et les membres »* — et ceux
 * de D9 pour le second.
 */
export const PERSON_ROLE_NOTE: Record<PersonRoleValue, string> = {
  domain_manager:
    "Gère les référentiels, les personnes et les comptes, et écrit dans tous les accompagnements du domaine.",
  member:
    "Lit tout le domaine, et n'écrit que dans les accompagnements où il est désigné contributeur.",
};

export function isPersonRole(value: string): value is PersonRoleValue {
  return (domainRole.enumValues as readonly string[]).includes(value);
}

/** Une chaîne, jamais un objet métier — et **une seule** : le rôle. */
export type PersonAccessFormValues = {
  /** Obligatoire : `persons_role_requires_access` refuse un accès sans rôle. */
  role: string;
};

export type PersonAccessFormErrors = Partial<
  Record<keyof PersonAccessFormValues, string>
>;

export type PersonAccessFormState = {
  values: PersonAccessFormValues;
  errors: PersonAccessFormErrors;
  /** Un empêchement qui n'appartient à aucun champ : un droit, un dernier responsable. */
  message?: string;
  /** L'écriture a eu lieu : le panneau se referme (TD.2). */
  ok?: boolean;
};

export const EMPTY_PERSON_ACCESS_VALUES: PersonAccessFormValues = { role: "" };

/**
 * Le rôle déjà porté, pour ouvrir le panneau dessus — `""` quand il n'y en a
 * aucun, l'absence s'écrivant vide comme partout dans ce dossier.
 */
export function toPersonAccessFormValues(row: {
  domainRole: PersonRoleValue | null;
}): PersonAccessFormValues {
  return { role: row.domainRole ?? "" };
}

/**
 * Le seul champ de ce formulaire, et il n'y en aura pas un second.
 *
 * **`has_access` n'est pas saisi, il est posé** par l'action : ce geste est
 * l'accord d'un accès, et un booléen dans un formulaire aurait fait de lui deux
 * gestes déguisés en un. `is_active` n'y est pas davantage — c'est une
 * désactivation d'annuaire, pas un droit (interdit du ticket).
 */
export function readPersonAccessForm(
  formData: FormData,
): PersonAccessFormValues {
  return { role: field(formData, "role") };
}

export function validatePersonAccessForm(
  values: PersonAccessFormValues,
): PersonAccessFormErrors {
  const errors: PersonAccessFormErrors = {};

  /* Le second contrôle n'est pas décoratif, et c'est ici qu'il compte le plus :
     le `select` ne propose que les deux valeurs de l'énuméré, mais une
     soumission forgée porte ce qu'elle veut — y compris un mot qui n'est pas un
     rôle. Une valeur hors énuméré rendrait une erreur PostgreSQL, donc un 500,
     là où l'on attend un message de champ. */
  if (!values.role) {
    errors.role = "Le rôle est obligatoire : un accès sans rôle est refusé.";
  } else if (!isPersonRole(values.role)) {
    errors.role = "Ce rôle n'existe pas.";
  }

  return errors;
}

/**
 * Les colonnes que ce formulaire décide, et pas une de plus.
 *
 * **`has_access` n'y figure pas parce qu'il ne se décide pas** : ce geste
 * l'accorde, l'action l'écrit à vrai, et `persons_role_requires_access` refuse
 * les deux moitiés séparées.
 */
export type PersonAccessRowInput = {
  role: PersonRoleValue;
};

/**
 * Lit le formulaire d'accès, le valide, et rend le rôle prêt à écrire.
 *
 * **Le renarrowage de `parsePersonForm`**, à la lettre : `input` est non nul si
 * et seulement si `errors` est vide, et le rattrapage inatteignable coûte deux
 * lignes pour que la propriété tienne par construction plutôt que par la lecture
 * croisée de deux fonctions.
 */
export function parsePersonAccessForm(formData: FormData): {
  values: PersonAccessFormValues;
  errors: PersonAccessFormErrors;
  input: PersonAccessRowInput | null;
} {
  const values = readPersonAccessForm(formData);
  const errors = validatePersonAccessForm(values);

  const role = isPersonRole(values.role) ? values.role : null;
  if (!role && !errors.role) errors.role = "Ce rôle n'existe pas.";

  if (!role || Object.keys(errors).length > 0) {
    return { values, errors, input: null };
  }

  return { values, errors, input: { role } };
}
