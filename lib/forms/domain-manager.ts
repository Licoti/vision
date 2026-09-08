/**
 * La saisie du **premier responsable** d'une entreprise cliente — T9.4.
 *
 * **Ni base, ni Next, ni React**, comme les vingt modules voisins.
 *
 * **Pourquoi ce formulaire existe.** Un domaine créé sans aucune personne à
 * `has_access` n'ouvre aucune session — c'est la règle d'entrée 6 de
 * `tickets-C9.md`, et elle fait de ce geste la condition sans laquelle l'écran
 * au-dessus des domaines ne servirait à rien : il créerait des entreprises que
 * personne ne pourrait ouvrir.
 *
 * **Pourquoi l'e-mail est obligatoire ici, alors que la colonne est nullable.**
 * D19 sépare *être référencé* de *pouvoir se connecter* : une personne saisie
 * dans une équipe n'a pas besoin d'adresse. Celle-ci se connecte, et la règle
 * d'entrée 6 la rapproche **sur son e-mail au premier passage** — sans adresse,
 * l'accès accordé ne servirait à personne. L'obligation ne vient donc pas de la
 * base, elle vient du geste.
 *
 * **`isEmailAddress` s'exporte, et c'est délibéré.** T9.6 fait entrer l'e-mail
 * dans le formulaire de personne, où il sera *« facultatif tant qu'aucun accès
 * n'est accordé, obligatoire au moment où l'accès l'est »* : c'est la **même**
 * règle de forme, et elle se réemploie plutôt que de se récrire. Deux copies
 * divergent un jour, et c'est celle qu'on a oublié de corriger qui laisse
 * passer.
 *
 * **Ce module ne valide que la forme.** Qu'une adresse soit déjà portée par une
 * autre personne du domaine demande de lire la base : cette question appartient
 * à l'action.
 */

import { referentialField } from "@/lib/forms/referential";

/**
 * Une adresse peut-elle être celle qu'un fournisseur vérifiera ?
 *
 * **Volontairement permissive.** La seule autorité sur la validité d'une adresse
 * est le fournisseur d'identité : lui seul dira si elle existe, et le
 * rapprochement se fera sur ce qu'il rend. Une règle plus serrée ne gagnerait
 * rien et refuserait un jour une adresse légitime — un `+`, un point dans la
 * partie locale, une extension longue. Ce qui est écarté ici est ce qu'aucun
 * fournisseur ne rendra jamais : une chaîne sans arobase, sans domaine, ou qui
 * en porte deux.
 */
export function isEmailAddress(value: string): boolean {
  const parts = value.split("@");
  if (parts.length !== 2) return false;

  const [local, domain] = parts;
  if (!local || !domain) return false;
  if (/\s/.test(value)) return false;

  /* Un domaine sans point n'est pas joignable depuis l'extérieur, et un point
     en bord de chaîne laisse une étiquette vide. */
  return (
    domain.includes(".") && !domain.startsWith(".") && !domain.endsWith(".")
  );
}

/** Ce que la personne a saisi, tel quel — des chaînes, jamais un objet métier. */
export type DomainManagerFormValues = {
  /** « Camille Roux ». Obligatoire — `persons.full_name` est `not null`. */
  fullName: string;
  /** L'adresse que le fournisseur vérifiera. Obligatoire — voir l'en-tête. */
  email: string;
};

export type DomainManagerFormErrors = Partial<
  Record<keyof DomainManagerFormValues, string>
>;

export type DomainManagerFormState = {
  values: DomainManagerFormValues;
  errors: DomainManagerFormErrors;
  /** Un empêchement qui n'appartient à aucun champ : un droit, un compte déjà là. */
  message?: string;
  /** L'écriture a eu lieu : le panneau se referme (TD.2). */
  ok?: boolean;
};

export const EMPTY_DOMAIN_MANAGER_VALUES: DomainManagerFormValues = {
  fullName: "",
  email: "",
};

/**
 * Les deux champs de ce formulaire, et pas un de plus.
 *
 * L'action ne construit jamais sa ligne par étalement d'un `FormData` : un champ
 * caché ajouté par n'importe qui deviendrait une colonne écrite — et
 * `domain_role` est précisément la colonne qu'un tel champ atteindrait. Le rôle
 * n'est pas saisi : ce geste désigne un **responsable de domaine**, et pas autre
 * chose.
 *
 * **L'adresse est abaissée**, du même côté que le rapprochement de la règle
 * d'entrée 6, qui compare en `lower(email)`. Une adresse saisie en capitales ne
 * doit pas rendre un compte injoignable.
 */
export function readDomainManagerForm(
  formData: FormData,
): DomainManagerFormValues {
  return {
    fullName: referentialField(formData, "fullName"),
    email: referentialField(formData, "email").toLowerCase(),
  };
}

export function validateDomainManagerForm(
  values: DomainManagerFormValues,
): DomainManagerFormErrors {
  const errors: DomainManagerFormErrors = {};

  if (!values.fullName) {
    errors.fullName = "Le nom du responsable est obligatoire.";
  }

  if (!values.email) {
    errors.email =
      "L'adresse e-mail est obligatoire : c'est elle qui rapproche le compte de son identité au premier passage.";
  } else if (!isEmailAddress(values.email)) {
    errors.email = "Cette adresse e-mail n'est pas valide.";
  }

  return errors;
}

/**
 * Les colonnes que ce formulaire écrit, et pas une de plus.
 *
 * `has_access` et `domain_role` **ne sont pas saisis, ils sont posés** par
 * l'action : ce geste ne connaît qu'un rôle. `source` vaut `manual` —
 * `persons_external_id_requires_directory` interdit un `external_id` autrement,
 * et il n'y en a pas ici : c'est le fournisseur qui le rendra au premier
 * passage. `kind` vaut `center` — un intervenant côté entité ne reçoit jamais
 * d'accès (`docs/05` §4, D2), et le premier responsable en reçoit un.
 */
export type DomainManagerRowInput = {
  fullName: string;
  email: string;
};

export function parseDomainManagerForm(formData: FormData): {
  values: DomainManagerFormValues;
  errors: DomainManagerFormErrors;
  input: DomainManagerRowInput | null;
} {
  const values = readDomainManagerForm(formData);
  const errors = validateDomainManagerForm(values);

  if (Object.keys(errors).length > 0) {
    return { values, errors, input: null };
  }

  return {
    values,
    errors,
    input: { fullName: values.fullName, email: values.email },
  };
}
