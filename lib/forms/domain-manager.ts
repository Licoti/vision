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
 * **Depuis T11.4, il ne pose plus l'accès : il l'invite** (arbitrage (9)). La
 * personne naît sans compte, et c'est l'acceptation du lien qui pose le couple
 * `has_access` / `domain_role` — un accès qui n'a jamais servi n'existe pas.
 * Rien ne change dans ce module-ci, qui ne saisissait ni l'un ni l'autre ; ce
 * qui change est ce que l'action en fait.
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
 *
 * **La règle d'adresse de T11.4 vit ici, et une seule fois** (arbitrage (11) de
 * `tickets-C11.md`). Deux formulaires la posent — la création d'une entreprise
 * et la redésignation de son premier responsable —, et elle ne s'y recopie pas :
 * deux copies divergent un jour, et c'est celle qu'on a oublié de corriger qui
 * laisse passer. Ce qu'elle confronte lui est **donné** : les noms de domaine
 * dont une adresse peut relever se dérivent des identités vérifiées, et cette
 * dérivation-là connaît les fournisseurs — elle vit donc dans
 * `lib/forms/domain.ts`, qui les connaît déjà.
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

/**
 * L'adresse relève-t-elle de l'entreprise ? — **refus strict** (arbitrage (11)).
 *
 * `user1@mycompany.com` pour `mycompany.com`, **et rien d'autre** : ni un
 * sous-domaine, ni un nom voisin. Comparaison en minuscules des deux côtés,
 * comme les trois autres lectures d'identité du produit.
 *
 * **Ce n'est pas un rattachement**, et la distinction est celle de l'arbitrage
 * (2) de C9 : le rattachement se fait sur le claim **vérifié**, jamais sur la
 * chaîne de l'adresse. Cette règle-ci est une **cohérence de saisie**, qui
 * attrape la faute au formulaire plutôt qu'au premier échec de connexion — un
 * écran d'entrée ne distingue pas ses causes, et découvrir la faute là-bas,
 * c'est la découvrir sans que rien ne dise pourquoi.
 *
 * **Une liste vide ne refuse rien**, et c'est le cas d'Entra ID : le `tid` est
 * un identifiant de locataire, aucune adresse réelle ne le porte, et confronter
 * l'un à l'autre refuserait toute saisie légitime. Il n'y a alors rien à
 * confronter, et le module le dit plutôt que d'inventer une règle.
 */
export function emailMatchesAddressDomain(
  email: string,
  addressDomains: readonly string[],
): boolean {
  if (addressDomains.length === 0) return true;

  const at = email.lastIndexOf("@");
  if (at < 0) return false;

  const host = email.slice(at + 1).toLowerCase();
  return addressDomains.some((candidate) => candidate.toLowerCase() === host);
}

/** Le refus, écrit une fois : il nomme ce qu'on attendait, et le contournement. */
export function addressDomainRefusal(
  addressDomains: readonly string[],
): string {
  const expected = addressDomains
    .map((domain) => `« @${domain} »`)
    .join(" ou ");

  return `Cette adresse ne relève pas de l'entreprise : elle doit se terminer par ${expected}. Une adresse d'un autre nom de domaine ne serait rapprochée par aucun jeton, et son compte n'ouvrirait jamais. Si l'entreprise emploie plusieurs noms de domaine, ajoutez le second comme identité vérifiée.`;
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
  /**
   * Le lien d'invitation, **rendu une seule fois** — T11.4.
   *
   * **Il tient lieu d'`ok`**, et pour la raison qu'`InvitationFormState` écrit
   * déjà : `ok` referme le panneau (TD.2) et emporterait avec lui la seule
   * occurrence en clair du jeton, dont Vision ne garde que l'empreinte (T11.1).
   * Le panneau reste donc ouvert sur ce qu'il vient de créer.
   */
  link?: string;
  /** Le courriel est-il **parti** ? — un fait, jamais un réglage (T11.3). */
  sent?: boolean;
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

/**
 * **Les noms de domaine se reçoivent, ils ne se devinent pas.**
 *
 * Le formulaire de création les tire de l'identité qu'il saisit ; la
 * redésignation les tire des identités déjà rattachées au domaine. Ni l'une ni
 * l'autre lecture n'appartient à un module pur — d'où l'argument, qui rend la
 * règle énonçable et vérifiable seule, sans branche Neon.
 */
export function validateDomainManagerForm(
  values: DomainManagerFormValues,
  addressDomains: readonly string[],
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
  } else if (!emailMatchesAddressDomain(values.email, addressDomains)) {
    errors.email = addressDomainRefusal(addressDomains);
  }

  return errors;
}

/**
 * Les colonnes que ce formulaire écrit, et pas une de plus.
 *
 * `has_access` et `domain_role` **ne sont ni saisis, ni posés** : depuis T11.4,
 * ils attendent l'acceptation de l'invitation, et le rôle invité vaut
 * `domain_manager` — ce geste n'en connaît pas d'autre. `source` vaut `manual` —
 * `persons_external_id_requires_directory` interdit un `external_id` autrement,
 * et il n'y en a pas ici : c'est le fournisseur qui le rendra au premier
 * passage. `kind` vaut `center` — un intervenant côté entité ne reçoit jamais
 * d'accès (`docs/05` §4, D2), et le premier responsable en reçoit un.
 */
export type DomainManagerRowInput = {
  fullName: string;
  email: string;
};

export function parseDomainManagerForm(
  formData: FormData,
  addressDomains: readonly string[],
): {
  values: DomainManagerFormValues;
  errors: DomainManagerFormErrors;
  input: DomainManagerRowInput | null;
} {
  const values = readDomainManagerForm(formData);
  const errors = validateDomainManagerForm(values, addressDomains);

  if (Object.keys(errors).length > 0) {
    return { values, errors, input: null };
  }

  return {
    values,
    errors,
    input: { fullName: values.fullName, email: values.email },
  };
}
