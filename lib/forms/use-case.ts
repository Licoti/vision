/**
 * La saisie d'un **use case** : lecture du formulaire, et validation.
 *
 * **Ni base, ni Next, ni React**, comme les onze modules qui le précèdent dans
 * ce dossier. C'est ce qui rend la règle énonçable et vérifiable seule, sans
 * branche Neon ni fixture.
 *
 * Ce module ne valide **que la forme** : un titre non vide, une description non
 * vide, des identifiants de personae qui ressemblent à des identifiants. Il ne
 * dit rien du produit qui porte le use case, ni du droit d'y écrire, **ni de
 * l'appartenance des personae reçus à ce produit** — cette dernière question est
 * celle du domaine, donc de l'action, qui rapproche chaque identifiant de la
 * liste des personae vivants du produit.
 *
 * **Il écrit deux tables**, comme `lib/forms/persona.ts` : une ligne de
 * `use_cases`, et la liste de ses rattachements. Les deux sortent du même
 * formulaire.
 *
 * **Le champ répétable reste interdit, et il n'a pas à l'être ici** : le
 * rattachement se saisit par des **cases à cocher** natives, une par persona du
 * produit. Elles fonctionnent sans une ligne de JavaScript — la cinquième
 * discipline —, là où les trois listes du persona avaient dû passer par des
 * zones de texte.
 */

/* ==========================================================================
   Ce que la personne a saisi
   ========================================================================== */

/** Trois champs, jamais un objet métier. */
export type UseCaseFormValues = {
  /** « Démarrer, reprendre un projet ». Obligatoire — `not null`. */
  title: string;
  /**
   * Ce que le scénario permet, et pourquoi. **Obligatoire**, à la différence de
   * `personas.summary` : un titre seul ne dit pas ce qu'un parcours recouvre.
   */
  summary: string;
  /**
   * Les personae rattachés. **Facultatif** — arbitrage humain du 19/08/2026 :
   * un produit peut porter ses scénarios avant d'avoir décrit ses profils.
   */
  personaIds: string[];
};

export type UseCaseFormErrors = Partial<
  Record<keyof UseCaseFormValues, string>
>;

/**
 * L'état que `useActionState` fait circuler entre le panneau et l'action.
 * Il porte les valeurs autant que les erreurs : une saisie refusée revient dans
 * le panneau avec ce qui a été tapé — et une description plus les cases cochées,
 * c'est précisément ce qu'on ne veut pas refaire.
 */
export type UseCaseFormState = {
  values: UseCaseFormValues;
  errors: UseCaseFormErrors;
  /** Un empêchement qui n'appartient à aucun champ : un droit, une ligne rangée. */
  message?: string;
  /** L'écriture a eu lieu : le panneau se referme (TD.2). */
  ok?: boolean;
};

export const EMPTY_USE_CASE_VALUES: UseCaseFormValues = {
  title: "",
  summary: "",
  personaIds: [],
};

/* ==========================================================================
   La lecture du formulaire
   ========================================================================== */

/** Le champ, lu et rogné. Absent ou d'un type inattendu, il vaut « vide ». */
function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Les cases cochées, dédoublonnées et dans l'ordre reçu.
 *
 * `getAll` et non `get` : un groupe de cases à cocher poste une valeur par case,
 * sous le même nom. Le dédoublonnage n'est pas décoratif — un navigateur n'envoie
 * jamais deux fois la même case, mais une soumission forgée le peut, et
 * l'unicité de `use_case_personas` rendrait alors une erreur PostgreSQL, donc un
 * 500, là où l'on attend un enregistrement ou un message.
 */
function checked(formData: FormData, name: string): string[] {
  const kept: string[] = [];
  const seen = new Set<string>();

  for (const raw of formData.getAll(name)) {
    if (typeof raw !== "string") continue;
    const value = raw.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    kept.push(value);
  }

  return kept;
}

/**
 * Les trois champs du formulaire, et pas un de plus.
 *
 * L'action ne construit jamais sa ligne par étalement d'un `FormData` : un champ
 * caché ajouté par n'importe qui deviendrait une colonne écrite. `productId` ne
 * se lit pas ici — il est lié côté serveur.
 */
export function readUseCaseForm(formData: FormData): UseCaseFormValues {
  return {
    title: field(formData, "title"),
    summary: field(formData, "summary"),
    personaIds: checked(formData, "personaIds"),
  };
}

/**
 * La ligne enregistrée et ses rattachements, ramenés aux trois champs du
 * formulaire — le pré-remplissage du panneau en correction.
 */
export function toUseCaseFormValues(
  row: { title: string; summary: string },
  personaIds: readonly string[],
): UseCaseFormValues {
  return {
    title: row.title,
    summary: row.summary,
    personaIds: [...personaIds],
  };
}

/* ==========================================================================
   La validation
   ========================================================================== */

export function validateUseCaseForm(
  values: UseCaseFormValues,
): UseCaseFormErrors {
  const errors: UseCaseFormErrors = {};

  if (!values.title) {
    errors.title = "Le titre du use case est obligatoire.";
  }

  if (!values.summary) {
    errors.summary = "La description du use case est obligatoire.";
  }

  /* Le rattachement est facultatif ; ce qui ne l'est pas, c'est que ce qui
     arrive **ressemble** à un identifiant. Une colonne `uuid` interrogée avec
     n'importe quoi rend une erreur PostgreSQL — un 500 — là où l'on attend un
     message de champ. C'est la règle tenue partout ailleurs : la forme avant la
     base. L'appartenance de ces identifiants au produit, elle, est une question
     de domaine, et l'action la tranche. */
  if (values.personaIds.some((id) => !UUID.test(id))) {
    errors.personaIds =
      "Un des personae rattachés n'est pas désigné correctement : la saisie n'a pas été enregistrée.";
  }

  return errors;
}

/**
 * La forme d'un identifiant, **recopiée plutôt qu'importée**, et c'est un choix.
 *
 * `lib/uuid.ts` est le module des points d'entrée serveur : l'importer ferait
 * entrer dans ce dossier une dépendance qui n'y a rien à faire, et les onze
 * modules voisins tiennent pour règle de ne rien connaître d'autre que du
 * texte. Le motif, lui, n'est pas un contrôle de sécurité — le contrôle est
 * l'appartenance au produit, qui vit dans l'action et n'est écrite qu'une fois.
 */
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* ==========================================================================
   De la saisie aux lignes
   ========================================================================== */

/** Les colonnes de `use_cases` que ce formulaire écrit, et pas une de plus. */
export type UseCaseRowInput = {
  title: string;
  summary: string;
};

export type UseCaseInput = {
  useCase: UseCaseRowInput;
  /** Les personae à rattacher — `use_case_id` est posé par l'action. */
  personaIds: string[];
};

/**
 * Lit le formulaire, le valide, et rend les lignes prêtes à écrire.
 *
 * `input` est non nul **si et seulement si** `errors` est vide : la propriété
 * posée en T2.5, qui évite d'affirmer par un `as` un type que la validation
 * venait de prouver.
 */
export function parseUseCaseForm(formData: FormData): {
  values: UseCaseFormValues;
  errors: UseCaseFormErrors;
  input: UseCaseInput | null;
} {
  const values = readUseCaseForm(formData);
  const errors = validateUseCaseForm(values);

  if (Object.keys(errors).length > 0) {
    return { values, errors, input: null };
  }

  return {
    values,
    errors,
    input: {
      useCase: { title: values.title, summary: values.summary },
      personaIds: [...values.personaIds],
    },
  };
}
