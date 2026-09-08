/**
 * La saisie d'une **invitation** — T11.2.
 *
 * **Ni base, ni Next, ni React**, comme les vingt-six modules voisins.
 *
 * **Un seul champ, et c'est la même règle que le panneau du compte** : le rôle.
 * `has_access` ne se saisit pas — il n'est même pas écrit par ce geste, et c'est
 * toute la différence avec `grantPersonAccess` (arbitrage (6) de
 * `tickets-C11.md`, les deux gestes cohabitent). L'adresse ne se saisit pas non
 * plus : elle est **copiée** de la ligne `persons` par l'action, ce qui laisse
 * un lien déjà parti viser ce qu'il visait au départ.
 *
 * **Un champ de plus dans l'état, et il n'est pas une valeur saisie.** `link`
 * porte le lien à transmettre, que l'action rend **une fois**. C'est l'arbitrage
 * (a) du 08/09/2026 : seule l'empreinte est stockée (T11.1), le clair n'existe
 * donc que dans cette réponse-là, et le panneau ne se referme pas dessus.
 */

import { domainRole } from "@/lib/db/schema";

/**
 * Les deux rôles, dérivés du schéma — jamais réécrits à la main.
 *
 * **Jumeau assumé de `PersonRoleValue`** (`lib/forms/person.ts`), et pour la
 * raison qui fait déjà le jumeau de `DomainRole` : les deux dérivent du **même**
 * énuméré, elles ne peuvent pas diverger. Les *libellés*, eux, ne se recopient
 * pas : `PERSON_ROLE_LABEL` et `PERSON_ROLE_NOTE` se réemploient tels quels, et
 * le point ouvert des trois copies reste celui d'`ETAT.md`, vers T7.9.
 */
export type InvitationRoleValue = (typeof domainRole.enumValues)[number];

export function isInvitationRole(value: string): value is InvitationRoleValue {
  return (domainRole.enumValues as readonly string[]).includes(value);
}

/** Une chaîne, jamais un objet métier — et **une seule** : le rôle. */
export type InvitationFormValues = {
  /** Obligatoire : l'acceptation pose le couple, que la base refuse à moitié. */
  role: string;
};

export type InvitationFormErrors = Partial<
  Record<keyof InvitationFormValues, string>
>;

export type InvitationFormState = {
  values: InvitationFormValues;
  errors: InvitationFormErrors;
  /** Un empêchement qui n'appartient à aucun champ : un droit, un accès déjà là. */
  message?: string;
  /**
   * Le lien à transmettre, **rendu une seule fois**.
   *
   * **Il tient lieu d'`ok`, et ce n'est pas une négligence.** `ok` referme le
   * panneau (TD.2) et emporterait avec lui la seule occurrence en clair du
   * jeton : Vision n'en garde que l'empreinte, et rien ne saurait le
   * reconstituer. Le panneau reste donc ouvert et montre ce qu'il vient de
   * créer — écart nommé au patron de TD.2, consigné au journal technique.
   */
  link?: string;
};

export const EMPTY_INVITATION_VALUES: InvitationFormValues = { role: "" };

/**
 * Le seul champ de ce formulaire, lu **nommément**.
 *
 * Jamais d'étalement de `FormData` : un champ caché ajouté par n'importe qui
 * deviendrait une colonne écrite — et `email` est précisément celle qu'un tel
 * champ atteindrait, quand elle doit venir de la ligne relue.
 */
export function readInvitationForm(formData: FormData): InvitationFormValues {
  const value = formData.get("role");
  return { role: typeof value === "string" ? value.trim() : "" };
}

export function validateInvitationForm(
  values: InvitationFormValues,
): InvitationFormErrors {
  const errors: InvitationFormErrors = {};

  /* Le second contrôle n'est pas décoratif : le `select` ne propose que les
     deux valeurs de l'énuméré, mais une soumission forgée porte ce qu'elle
     veut. Une valeur hors énuméré rendrait une erreur PostgreSQL, donc un 500,
     là où l'on attend un message de champ. */
  if (!values.role) {
    errors.role =
      "Le rôle est obligatoire : c'est lui que l'acceptation posera.";
  } else if (!isInvitationRole(values.role)) {
    errors.role = "Ce rôle n'existe pas.";
  }

  return errors;
}

/** Ce que ce formulaire décide, et pas une colonne de plus. */
export type InvitationRowInput = {
  role: InvitationRoleValue;
};

/**
 * Lit le formulaire, le valide, et rend le rôle prêt à écrire.
 *
 * **Le renarrowage de `parsePersonAccessForm`**, à la lettre : `input` est non
 * nul si et seulement si `errors` est vide, et le rattrapage inatteignable coûte
 * deux lignes pour que la propriété tienne par construction plutôt que par la
 * lecture croisée de deux fonctions.
 */
export function parseInvitationForm(formData: FormData): {
  values: InvitationFormValues;
  errors: InvitationFormErrors;
  input: InvitationRowInput | null;
} {
  const values = readInvitationForm(formData);
  const errors = validateInvitationForm(values);

  const role = isInvitationRole(values.role) ? values.role : null;
  if (!role && !errors.role) errors.role = "Ce rôle n'existe pas.";

  if (!role || Object.keys(errors).length > 0) {
    return { values, errors, input: null };
  }

  return { values, errors, input: { role } };
}
