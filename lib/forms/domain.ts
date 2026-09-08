/**
 * La saisie d'une **entreprise cliente** et de ses identités vérifiées — T9.4.
 *
 * **Ni base, ni Next, ni React**, comme les dix-neuf modules voisins. C'est ce
 * qui rend la règle énonçable et vérifiable seule, sans branche Neon.
 *
 * **Deux formulaires dans un module, et une règle d'identité écrite une fois.**
 * La création saisit une entreprise, sa première identité *et son premier
 * administrateur* (T11.4) ; le panneau des identités n'en saisit qu'une. Les séparer en deux fichiers aurait fait vivre
 * la même règle de normalisation à deux endroits — *« deux copies divergent un
 * jour, et c'est celle qu'on a oublié de corriger qui laisse passer »*. Ce qui
 * les réunit n'est pas la commodité, c'est que la seconde est un morceau de la
 * première.
 *
 * **Pourquoi la création exige une identité.** Un domaine sans
 * `domain_identities` n'est désigné par aucun jeton : les règles d'entrée 3 et 5
 * de `tickets-C9.md` le rendent inatteignable. Une entreprise cliente qu'aucun
 * compte ne peut ouvrir n'est pas une entreprise cliente, c'est une ligne.
 *
 * **La valeur vérifiée est abaissée et rognée, et ce n'est pas de la
 * cosmétique.** `domain_identities_provider_value_unique` porte sur le couple
 * brut : `ACME.COM` et `acme.com` y sont deux valeurs distinctes, et ouvriraient
 * **deux domaines Vision pour la même entreprise** — exactement l'étanchéité que
 * la contrainte existe pour tenir. Normaliser ici referme la porte que la base
 * ne peut pas fermer seule, son index ne portant pas de `lower()`.
 *
 * **Ce module ne valide que la forme.** Qu'un couple soit déjà pris demande de
 * lire la base : cette question appartient à l'action. Revérifier ici poserait
 * une seconde autorité, qui divergerait un jour de la première.
 */

import { identityProvider } from "@/lib/db/schema";
import {
  validateDomainManagerForm,
  type DomainManagerFormValues,
} from "@/lib/forms/domain-manager";
import { referentialField } from "@/lib/forms/referential";

/** `google` · `microsoft`. Dérivé du schéma. */
export type IdentityProviderValue = (typeof identityProvider.enumValues)[number];

/**
 * L'ordre du choix est celui de l'énuméré — Google d'abord.
 *
 * **Ce n'est pas une préférence de produit** : la couche est écrite pour deux
 * fournisseurs et **en sert un**, Entra ID Free demandant une carte bancaire de
 * vérification (T9.2). Microsoft reste offert parce que le jour où un client
 * l'impose, il n'y aura ni forme ni écran à reprendre.
 */
export const IDENTITY_PROVIDERS: readonly IdentityProviderValue[] =
  identityProvider.enumValues;

/** Ce que le fournisseur appelle l'entreprise, et ce qu'on demande de saisir. */
export const IDENTITY_CLAIM: Record<IdentityProviderValue, string> = {
  google: "hd",
  microsoft: "tid",
};

export function isIdentityProvider(
  value: string,
): value is IdentityProviderValue {
  return (identityProvider.enumValues as readonly string[]).includes(value);
}

/**
 * La valeur telle qu'elle sera confrontée au jeton.
 *
 * Un `hd` est un nom de domaine, un `tid` est un identifiant : ni l'un ni
 * l'autre ne distingue la casse, et les deux se comparent en `eq` à la
 * connexion. Ce que cette fonction range, la contrainte d'unicité peut alors le
 * refuser.
 */
export function normalizeIdentityValue(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Les noms de domaine dont une adresse de cette entreprise peut relever —
 * T11.4, et **c'est le seul endroit qui en décide**.
 *
 * **Un `hd` est un nom de domaine ; un `tid` ne l'est pas.** Google rend le nom
 * de domaine de l'entreprise, qu'une adresse porte après son arobase ; Entra ID
 * rend un identifiant de locataire, qu'aucune adresse ne contient. Confronter
 * une adresse à un `tid` refuserait toute saisie légitime : Microsoft ne rend
 * donc **aucun** nom de domaine à confronter, et la règle ne s'applique pas —
 * décision humaine du 08/09/2026, consignée au journal technique.
 *
 * **Sa limite est celle de l'arbitrage (11)** : une entreprise dont le `hd` est
 * `mycompany.com` et les adresses `@mycompany.fr` verra sa saisie refusée. Le
 * contournement est d'ajouter le second nom de domaine comme identité vérifiée,
 * ce que le super administrateur peut faire — et cette liste le suit.
 */
export function addressDomainsOf(
  identities: readonly { provider: string; value: string }[],
): string[] {
  return identities
    .filter((identity) => identity.provider === "google")
    .map((identity) => identity.value);
}

/** La règle de forme d'une identité, partagée par les deux formulaires. */
function validateIdentity(
  provider: string,
  value: string,
): { provider?: string; value?: string } {
  const errors: { provider?: string; value?: string } = {};

  if (!isIdentityProvider(provider)) {
    errors.provider = "Ce fournisseur d'identité n'existe pas.";
  }

  if (!value) {
    errors.value =
      "L'identité vérifiée est obligatoire : sans elle, aucun compte de cette entreprise ne peut se connecter.";
  } else if (/\s/.test(value)) {
    /* Ni un `hd` ni un `tid` ne porte d'espace. La saisie la plus probable
       derrière une espace est une adresse e-mail complète ou un nom
       d'entreprise — deux choses que le fournisseur ne rendra jamais, et que le
       rapprochement ne trouverait donc jamais. */
    errors.value =
      "Une identité vérifiée ne contient pas d'espace : saisir le domaine rendu par le fournisseur, par exemple « acme.com ».";
  }

  return errors;
}

/* ==========================================================================
   Le formulaire de création
   ========================================================================== */

/** Ce que la personne a saisi, tel quel — des chaînes, jamais un objet métier. */
export type DomainFormValues = {
  /** « Acme ». Obligatoire — `not null`. */
  name: string;
  /** « Studio Design ». Obligatoire — `not null`. */
  competenceCenterName: string;
  /** La valeur d'énuméré, non traduite. */
  provider: string;
  /** Le `hd` de Google ou le `tid` d'Entra, tel que le fournisseur le rend. */
  identityValue: string;
  /** Ce que fait l'entreprise, en une phrase. **Facultative** — T11.4. */
  description: string;
  /** « Camille Roux ». Le premier administrateur, invité par ce même geste. */
  managerFullName: string;
  /** L'adresse que le fournisseur vérifiera, et qui reçoit l'invitation. */
  managerEmail: string;
};

export type DomainFormErrors = Partial<Record<keyof DomainFormValues, string>>;

/**
 * L'état que `useActionState` fait circuler entre le panneau et l'action.
 * Il porte les valeurs autant que les erreurs : une saisie refusée revient dans
 * le panneau avec ce qui a été tapé, jamais vidée.
 */
export type DomainFormState = {
  values: DomainFormValues;
  errors: DomainFormErrors;
  /** Un empêchement qui n'appartient à aucun champ : un droit, une ligne rangée. */
  message?: string;
  /**
   * Le lien d'invitation du premier administrateur, **rendu une seule fois** —
   * T11.4.
   *
   * **Il tient lieu d'`ok`** : `ok` referme le panneau (TD.2) et emporterait
   * avec lui la seule occurrence en clair du jeton, dont Vision ne garde que
   * l'empreinte (T11.1). Le panneau reste ouvert sur ce qu'il vient de créer —
   * c'est l'écart nommé de T11.2, resservi ici.
   */
  link?: string;
  /** Le courriel est-il **parti** ? — un fait, jamais un réglage (T11.3). */
  sent?: boolean;
};

export const EMPTY_DOMAIN_VALUES: DomainFormValues = {
  name: "",
  competenceCenterName: "",
  provider: "google",
  identityValue: "",
  description: "",
  managerFullName: "",
  managerEmail: "",
};

/**
 * Les sept champs de ce formulaire, et pas un de plus.
 *
 * L'action ne construit jamais sa ligne par étalement d'un `FormData` : un champ
 * caché ajouté par n'importe qui deviendrait une colonne écrite — et `status`
 * est précisément la colonne qu'un tel champ atteindrait, celle qui décide qui
 * peut ouvrir une session. Le **rôle** est le second nom qu'un tel champ
 * viserait : il ne se saisit pas, ce geste ne connaît que `domain_manager`.
 *
 * **L'adresse est abaissée**, du même côté que le rapprochement de la règle
 * d'entrée 6 et que la règle d'adresse : une saisie en capitales ne doit rendre
 * un compte ni injoignable, ni refusé à tort.
 */
export function readDomainForm(formData: FormData): DomainFormValues {
  return {
    name: referentialField(formData, "name"),
    competenceCenterName: referentialField(formData, "competenceCenterName"),
    provider: referentialField(formData, "provider"),
    identityValue: normalizeIdentityValue(
      referentialField(formData, "identityValue"),
    ),
    description: referentialField(formData, "description"),
    managerFullName: referentialField(formData, "managerFullName"),
    managerEmail: referentialField(formData, "managerEmail").toLowerCase(),
  };
}

/**
 * **Un seul formulaire, là où il y en avait deux** (T11.4).
 *
 * Les deux champs du responsable ne sont pas revalidés ici : ils passent par
 * `validateDomainManagerForm`, qui porte déjà la règle d'adresse et l'exigence
 * d'e-mail. Les récrire poserait une seconde autorité, qui divergerait un jour
 * de la première.
 *
 * **La règle d'adresse se confronte à l'identité saisie dans ce même
 * formulaire** : c'est la seule que l'entreprise portera à sa naissance.
 */
export function validateDomainForm(values: DomainFormValues): DomainFormErrors {
  const errors: DomainFormErrors = {};

  if (!values.name) {
    errors.name = "Le nom de l'entreprise est obligatoire.";
  }

  if (!values.competenceCenterName) {
    errors.competenceCenterName =
      "Le libellé du centre de compétence est obligatoire.";
  }

  const identity = validateIdentity(values.provider, values.identityValue);
  if (identity.provider) errors.provider = identity.provider;
  if (identity.value) errors.identityValue = identity.value;

  /* **Les noms de domaine ne se dérivent que d'une identité valide** : sur une
     saisie fautive, il n'y a rien à confronter, et refuser l'adresse en plus
     dirait une seconde faute là où il n'y en a qu'une. */
  const addressDomains =
    identity.value || identity.provider
      ? []
      : addressDomainsOf([
          { provider: values.provider, value: values.identityValue },
        ]);

  const manager = validateDomainManagerForm(
    {
      fullName: values.managerFullName,
      email: values.managerEmail,
    } satisfies DomainManagerFormValues,
    addressDomains,
  );
  if (manager.fullName) errors.managerFullName = manager.fullName;
  if (manager.email) errors.managerEmail = manager.email;

  /* Aucune longueur maximale : les trois colonnes sont des `text` sans
     contrainte, et en inventer une ici serait une règle produit que ni `docs/02`
     ni `docs/04` ne portent — la règle de `lib/forms/vision.ts`. La description
     n'a pas non plus d'obligation : c'est la seule colonne facultative du
     formulaire. */

  return errors;
}

/**
 * Les colonnes que ce formulaire écrit, **dans quatre tables** (T11.4).
 *
 * `domains` et `domain_identities` depuis T9.4 ; `persons` et `invitations`
 * depuis T11.4, où le premier administrateur naît **sans accès** et reçoit un
 * lien. `status` et `archived_at` n'y figurent pas : la première garde sa
 * valeur par défaut, la seconde n'appartient qu'à `archiveDomain` et
 * `restoreDomain`. `has_access` et `domain_role` non plus : ils attendent
 * l'acceptation (arbitrage (9)).
 */
export type DomainRowInput = {
  name: string;
  competenceCenterName: string;
  /** Nulle plutôt que vide : une description non saisie n'est pas une phrase vide. */
  description: string | null;
  provider: IdentityProviderValue;
  identityValue: string;
  manager: { fullName: string; email: string };
};

/**
 * Lit le formulaire, le valide, et rend la ligne prête à écrire.
 *
 * `input` est non nul **si et seulement si** `errors` est vide : la propriété
 * posée en T2.5. Le second membre du `if` **prouve** au compilateur le type de
 * `provider`, là où un `as` tiendrait aujourd'hui et mentirait le jour où
 * l'énuméré changerait.
 */
export function parseDomainForm(formData: FormData): {
  values: DomainFormValues;
  errors: DomainFormErrors;
  input: DomainRowInput | null;
} {
  const values = readDomainForm(formData);
  const errors = validateDomainForm(values);

  if (Object.keys(errors).length > 0 || !isIdentityProvider(values.provider)) {
    return { values, errors, input: null };
  }

  return {
    values,
    errors,
    input: {
      name: values.name,
      competenceCenterName: values.competenceCenterName,
      description: values.description || null,
      provider: values.provider,
      identityValue: values.identityValue,
      manager: {
        fullName: values.managerFullName,
        email: values.managerEmail,
      },
    },
  };
}

/* ==========================================================================
   Le formulaire d'une identité seule
   ========================================================================== */

export type DomainIdentityFormValues = {
  provider: string;
  value: string;
};

export type DomainIdentityFormErrors = Partial<
  Record<keyof DomainIdentityFormValues, string>
>;

export type DomainIdentityFormState = {
  values: DomainIdentityFormValues;
  errors: DomainIdentityFormErrors;
  message?: string;
  ok?: boolean;
};

export const EMPTY_DOMAIN_IDENTITY_VALUES: DomainIdentityFormValues = {
  provider: "google",
  value: "",
};

export function readDomainIdentityForm(
  formData: FormData,
): DomainIdentityFormValues {
  return {
    provider: referentialField(formData, "provider"),
    value: normalizeIdentityValue(referentialField(formData, "value")),
  };
}

export function validateDomainIdentityForm(
  values: DomainIdentityFormValues,
): DomainIdentityFormErrors {
  return validateIdentity(values.provider, values.value);
}

export type DomainIdentityRowInput = {
  provider: IdentityProviderValue;
  value: string;
};

export function parseDomainIdentityForm(formData: FormData): {
  values: DomainIdentityFormValues;
  errors: DomainIdentityFormErrors;
  input: DomainIdentityRowInput | null;
} {
  const values = readDomainIdentityForm(formData);
  const errors = validateDomainIdentityForm(values);

  if (Object.keys(errors).length > 0 || !isIdentityProvider(values.provider)) {
    return { values, errors, input: null };
  }

  return {
    values,
    errors,
    input: { provider: values.provider, value: values.value },
  };
}
