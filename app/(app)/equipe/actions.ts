"use server";

/**
 * Les écritures de la page **Équipe** — T5bis.6.
 *
 * Six gestes sur deux objets : créer une personne, corriger son profil,
 * l'archiver ; poser une compétence avec son niveau, corriger ce niveau, la
 * **retirer**. Sans eux, C5bis livrerait un référentiel qu'un script seul
 * alimente.
 *
 * **Le droit est `session.can.manageDomain`, seul** (arbitrage (c) de C5bis).
 * `docs/02` §Rôle donne au responsable de domaine la gestion « des référentiels
 * et des membres » : un profil d'équipe est l'un et l'autre. **Aucun droit neuf
 * n'entre dans `lib/auth/session.ts`** — `SessionRights` garde ses quatre
 * membres, et C7 n'aura pas un droit de plus à reprendre. Le droit dérivé des
 * accompagnements, qui gouverne les indicateurs et les personae, n'a rien à
 * faire ici : une personne n'appartient à aucun produit.
 *
 * **L'ordre de la porte est celui d'`openProduct`, et non celui
 * d'`openProductWrite`** : `manageDomain` ne dépend d'aucun identifiant, il
 * s'énonce donc **avant** toute lecture. On ne cherche une ligne qu'après avoir
 * établi qu'on a le droit d'y toucher.
 *
 * **Le droit se vérifie ici, et pas à l'écran.** Les points d'entrée ne
 * paraissent qu'à qui peut écrire, mais une action serveur est un point d'entrée
 * HTTP à part entière : ses champs se récoltent sur la page servie à quelqu'un
 * d'autre et se repostent sous un autre cookie. Un bouton masqué n'est pas un
 * droit.
 *
 * **Les identifiants sont liés côté serveur** — `updatePerson.bind(null,
 * person.id)`. Ce ne sont pas des champs du formulaire, mais **ce ne sont pas
 * non plus des secrets** : Next les sérialise dans un champ `$ACTION_…` du
 * balisage, en clair en développement, et une soumission peut donc les
 * réécrire. La liaison range les identifiants hors de la saisie ; elle ne les
 * protège pas. Ce qui protège est la porte, interrogée sur ce qui a été **reçu**.
 *
 * **Le refus de l'intervenant côté entité est dans l'action** (arbitrage (d)) :
 * `openPersonSkill` refuse une compétence posée sur un `stakeholder`, et non
 * seulement l'écran qui n'en propose pas le geste.
 *
 * **Retirer une compétence est un `unlink`, jamais un `archive`** :
 * `person_skills` n'a pas d'`archived_at`, ce qui la range dans `LinkTable` et
 * rend le typage lui-même porteur de la règle (T5bis.1). Le verbe à l'écran est
 * « **Retirer** », la règle de T5.4. Cela ne contredit pas la règle 4 : une
 * liaison n'est pas une donnée métier, c'est un lien entre deux qui restent.
 *
 * **Aucune suppression de personne, jamais** (règle 4) : l'archivage la retire
 * du référentiel Équipe et des choix du formulaire de projet, rien de plus. Elle
 * reste affichée dans l'équipe des accompagnements qu'elle a menés (arbitrage
 * (e)) — `filter()` ne porte que le domaine, et `findProjectDetail` continue de
 * la rendre.
 *
 * **Aucun rétablissement** : arbitrage (b) de C4bis — il existe pour les deux
 * objets qui ont une page, et une personne n'en a pas (D29).
 *
 * **Aucun recalcul de `last_activity_at`** : ni un profil ni une compétence
 * n'est un fait d'accompagnement, et appeler `refreshLastActivity` ferait croire
 * le contraire à qui lit ce fichier — la leçon de T4.2.
 *
 * Aucune écriture directe : tout passe par `session.db`, déjà scopé sur le
 * domaine courant et sur la personne courante — `domain_id` et `created_by` sont
 * posés par la couche, l'appelant n'y pense pas. Règle 1.
 */

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import type { ConfirmState } from "@/components/ui/confirm-panel";
import { requireSession } from "@/lib/auth/provider";
import type { Session } from "@/lib/auth/session";
import { personSkills, persons } from "@/lib/db/schema";
import { DomainScopeError, type Row } from "@/lib/db/scoped";
import {
  parsePersonForm,
  readPersonForm,
  type PersonFormState,
} from "@/lib/forms/person";
import {
  parsePersonSkillForm,
  readPersonSkillForm,
  type PersonSkillFormState,
} from "@/lib/forms/person-skill";
import { ROUTES } from "@/lib/navigation";

/**
 * Le refus que les cinq points d'entrée d'écriture partagent, quand il ne vient
 * ni du droit ni d'une ligne disparue.
 */
const RESERVED =
  "La gestion des personnes et de leurs compétences est réservée au responsable de domaine.";

/**
 * Un refus qui n'appartient à aucun champ — un droit, une ligne disparue.
 *
 * La saisie revient telle quelle : Vision ne jette jamais en silence ce qui a
 * été tapé, y compris quand ce qu'elle refuse n'est pas la saisie.
 */
function refusal(formData: FormData, message: string): PersonFormState {
  return { values: readPersonForm(formData), errors: {}, message };
}

/**
 * Le même refus, sur la saisie d'une compétence — jumeau explicite du précédent.
 *
 * `lockedSkillId` traverse : un refus en correction doit réafficher la
 * compétence de la liaison, et non la chaîne vide que le formulaire poste.
 */
function skillRefusal(
  formData: FormData,
  message: string,
  lockedSkillId?: string | undefined,
): PersonSkillFormState {
  return {
    values: readPersonSkillForm(formData, lockedSkillId),
    errors: {},
    message,
  };
}

/**
 * Le second filet : une référence a franchi la vérification et la couche l'a
 * refusée. L'écran le dit plutôt que de rendre une page en erreur.
 *
 * Il sert le métier, dont l'appartenance au domaine n'est pas vérifiée par
 * l'action mais par `assertPreconditions`, qui dérive les clés étrangères du
 * schéma : `persons.job_id` y est couvert sans qu'on y pense.
 */
function scopeRefusal(error: unknown, formData: FormData): PersonFormState {
  if (error instanceof DomainScopeError) {
    return refusal(
      formData,
      "Une référence de ce formulaire n'appartient pas au domaine : la saisie n'a pas été enregistrée.",
    );
  }
  throw error;
}

/** Le même filet, sur la saisie d'une compétence — jumeau explicite. */
function skillScopeRefusal(
  error: unknown,
  formData: FormData,
  lockedSkillId?: string | undefined,
): PersonSkillFormState {
  if (error instanceof DomainScopeError) {
    return skillRefusal(
      formData,
      "Une référence de ce formulaire n'appartient pas au domaine : la saisie n'a pas été enregistrée.",
      lockedSkillId,
    );
  }
  throw error;
}

/* ==========================================================================
   Vérifier avant d'écrire
   ========================================================================== */

/**
 * Le droit, puis la personne **reçue**, puis son archivage — dans cet ordre, et
 * avant toute lecture du formulaire.
 *
 * `manageDomain` ne dépend d'aucun identifiant : il s'énonce avant la moindre
 * lecture, à rebours de la porte des indicateurs, dont le droit dérivé ne
 * s'énonce pas avant de connaître le produit.
 *
 * `find` rend les lignes archivées, délibérément : une donnée archivée reste
 * lisible. C'est ici qu'on en tire les conséquences — une personne rangée ne
 * reçoit plus de saisie, la transposition de T4bis.2 et de T4bis.3.
 */
async function openPerson(
  session: Session,
  personId: string,
): Promise<{ person: Row<typeof persons> } | { message: string }> {
  if (!session.can.manageDomain) return { message: RESERVED };

  const person = await session.db.find(persons, personId);
  if (!person) {
    return { message: "Cette personne n'existe plus dans ce domaine." };
  }

  if (person.archivedAt !== null) {
    return {
      message:
        "Cette personne est archivée : elle ne reçoit plus de saisie. Rien n'est perdu — ses accompagnements passés l'affichent toujours.",
    };
  }

  return { person };
}

/**
 * La même porte, plus le refus de l'**intervenant côté entité** — arbitrage (d)
 * de C5bis : les compétences sont une propriété du centre, comme la
 * disponibilité.
 *
 * **Et le refus est dans l'action**, jamais dans le rendu : la fiche d'un
 * `stakeholder` n'affiche aucun point d'entrée de compétence, mais un point
 * d'entrée absent du rendu n'a jamais protégé le point d'entrée HTTP qui
 * l'accompagne.
 */
async function openPersonForSkill(
  session: Session,
  personId: string,
): Promise<{ person: Row<typeof persons> } | { message: string }> {
  const gate = await openPerson(session, personId);
  if ("message" in gate) return gate;

  if (gate.person.kind !== "center") {
    return {
      message:
        "Les compétences sont une propriété du centre de compétence : un intervenant côté entité n'en porte pas.",
    };
  }

  return gate;
}

/**
 * La liaison reçue, remontée jusqu'à sa personne — la troisième porte, sur le
 * modèle d'`openReading` (T5.3).
 *
 * **La chaîne se remonte, elle ne se raccourcit pas** : liaison → personne. Le
 * droit d'écrire une compétence est celui d'écrire le profil qui la porte ;
 * inventer une règle propre à la liaison serait le troisième niveau de droit que
 * D9 refuse.
 *
 * `person_skills` n'a pas d'`archived_at` : il n'y a donc pas de liaison rangée
 * dont il faudrait se garder — une liaison existe, ou elle a été retirée.
 */
async function openPersonSkill(
  session: Session,
  personSkillId: string,
): Promise<
  | { person: Row<typeof persons>; link: Row<typeof personSkills> }
  | { message: string }
> {
  if (!session.can.manageDomain) return { message: RESERVED };

  const missing = { message: "Cette compétence n'est plus portée par cette personne." };

  const link = await session.db.find(personSkills, personSkillId);
  if (!link) return missing;

  const gate = await openPersonForSkill(session, link.personId);
  if ("message" in gate) return gate;

  return { person: gate.person, link };
}

/* ==========================================================================
   La personne — créer, corriger, archiver
   ========================================================================== */

/**
 * Créer une personne.
 *
 * **Un seul lieu de création, et c'est ici** (arbitrage (g) de C5bis) : T5bis.7
 * a retiré le bloc « Ajouter une personne » du formulaire de projet, ce qui
 * referme le point ouvert « on n'ajoute qu'une personne par enregistrement » —
 * sa limitation n'a plus d'objet une fois la création partie ailleurs.
 *
 * `source: "manual"`, `hasAccess: false` et `domainRole: null` tiennent les deux
 * `CHECK` de `persons` : pas d'identifiant annuaire sans annuaire, pas de rôle
 * de domaine sans accès. Être référencé et pouvoir se connecter restent deux
 * choses distinctes (D19) — cette personne n'apparaîtra pas dans `/dev/session`,
 * et son compte est l'affaire de C7.
 *
 * `previous` est l'état que `useActionState` fait circuler, dont l'action n'a pas
 * besoin — la saisie repart du `FormData` à chaque soumission.
 */
export async function createPerson(
  _previous: PersonFormState,
  formData: FormData,
): Promise<PersonFormState> {
  const session = await requireSession();
  if (!session.can.manageDomain) return refusal(formData, RESERVED);

  const { values, errors, input } = parsePersonForm(formData);
  if (!input) return { values, errors };

  try {
    await session.db.insert(persons, {
      source: "manual",
      hasAccess: false,
      domainRole: null,
      isActive: true,
      ...input,
    });
  } catch (error) {
    return scopeRefusal(error, formData);
  }

  /* **Cette page-là, et elle seule.** Une personne créée ne paraît sur aucun
     autre écran tant qu'elle n'est dans l'équipe d'aucun accompagnement. C'est
     `revalidatePath` qui la fait paraître dans la liste derrière le voile. */
  revalidatePath(ROUTES.team);

  /* **Le panneau se referme sur ce succès, et non plus sur une navigation**
     (TD.2). `redirect` était la fermeture ; elle ne peut plus l'être sans
     re-rendre la page que le panneau n'a justement plus à quitter. Ce qui a été
     saisi paraît dans la liste, et c'est toute la confirmation (`docs/06` §9). */
  return { values, errors: {}, ok: true };
}

/**
 * Corriger un profil : **le même formulaire, la même validation, les mêmes
 * refus** qu'à la création — la propriété qui fait qu'un seul panneau sert les
 * deux gestes, posée en T3.4 et tenue depuis.
 *
 * **Cinq colonnes, et pas une de plus** : `source`, `has_access`, `domain_role`
 * et `is_active` ne sont pas des champs de ce formulaire et ne le deviennent
 * pas. Les écrire ici ferait de cet écran une console de comptes, ce qu'il n'est
 * pas — l'authentification est reprise par C7.
 */
export async function updatePerson(
  personId: string,
  _previous: PersonFormState,
  formData: FormData,
): Promise<PersonFormState> {
  const session = await requireSession();

  const gate = await openPerson(session, personId);
  if ("message" in gate) return refusal(formData, gate.message);

  const { values, errors, input } = parsePersonForm(formData);
  if (!input) return { values, errors };

  try {
    const updated = await session.db.update(persons, personId, input);
    if (!updated) {
      return refusal(formData, "Cette personne n'existe plus dans ce domaine.");
    }
  } catch (error) {
    return scopeRefusal(error, formData);
  }

  revalidatePath(ROUTES.team);

  return { values, errors: {}, ok: true };
}

/**
 * Archiver une personne : elle quitte le référentiel Équipe, rien n'est supprimé
 * (règle 4).
 *
 * **Avec confirmation**, à la différence d'un indicateur ou d'un relevé —
 * arbitrage (c) de C4bis : la confirmation se justifie là où le geste retire de
 * la lecture tout un ensemble. Une personne emporte son profil et ses
 * compétences hors du référentiel, et le geste **ne se défait pas depuis cet
 * écran** (arbitrage (b) de C4bis : le rétablissement existe pour les deux
 * objets qui ont une page, et une personne n'en a pas).
 *
 * **Aucune cascade, et c'est l'arbitrage (e)** : les liaisons d'équipe ne sont
 * pas retirées à la place de qui range. `filter()` ne porte que le domaine
 * (`lib/db/scoped.ts`), si bien que `findProjectDetail` continue d'afficher
 * cette personne dans l'équipe d'un accompagnement ancien — la donnée ne
 * disparaît pas d'un écran qui la racontait. C'est la règle 4 tenue, et **cette
 * propriété se vérifie, elle ne s'affirme pas**.
 *
 * **Aucun refus de la personne encore en équipe**, à la différence du produit
 * dont les accompagnements vivants s'opposent au rangement : là-bas, ranger
 * ferait disparaître ce que plus aucun écran ne pourrait défaire ; ici, rien ne
 * disparaît — l'équipe des accompagnements l'affiche toujours.
 */
export async function archivePerson(
  personId: string,
  _previous: ConfirmState,
  _formData: FormData,
): Promise<ConfirmState> {
  const session = await requireSession();

  const gate = await openPerson(session, personId);
  if ("message" in gate) return { message: gate.message };

  await session.db.archive(persons, personId);

  revalidatePath(ROUTES.team);

  return { ok: true };
}

/* ==========================================================================
   La compétence portée — poser, corriger le niveau, retirer
   ========================================================================== */

/**
 * Poser une compétence sur une personne, avec le niveau qu'elle déclare.
 *
 * **L'unicité est pré-contrôlée, et c'est ce qui en fait une erreur de champ.**
 * `person_skills_person_skill_unique` refuserait l'insertion, mais par une
 * violation PostgreSQL — une trace serveur, donc, là où la fiche demande un
 * message sous le champ. Le `count` est le mécanisme ; la contrainte reste le
 * dernier mot, et couvre la fenêtre que `neon-http` laisse ouverte faute de
 * transaction interactive (dette consignée depuis T3.6).
 *
 * La compétence et le niveau reçus ne sont **pas** confrontés au domaine ici :
 * `assertPreconditions` le fait à l'insertion, en dérivant les clés étrangères
 * du schéma, et `skillId` comme `levelId` y sont couverts. Une valeur d'un autre
 * domaine lève `DomainScopeError`, que `skillScopeRefusal` rend en message.
 */
export async function createPersonSkill(
  personId: string,
  _previous: PersonSkillFormState,
  formData: FormData,
): Promise<PersonSkillFormState> {
  const session = await requireSession();

  const gate = await openPersonForSkill(session, personId);
  if ("message" in gate) return skillRefusal(formData, gate.message);

  const { values, errors, input } = parsePersonSkillForm(formData);
  if (!input) return { values, errors };

  const held = await session.db.count(personSkills, {
    where: and(
      eq(personSkills.personId, personId),
      eq(personSkills.skillId, input.skillId),
    ),
  });
  if (held > 0) {
    return {
      values,
      errors: {
        skillId:
          "Cette personne porte déjà cette compétence : corrigez son niveau plutôt que de la poser deux fois.",
      },
    };
  }

  try {
    await session.db.insert(personSkills, { personId, ...input });
  } catch (error) {
    return skillScopeRefusal(error, formData);
  }

  revalidatePath(ROUTES.team);

  return { values, errors: {}, ok: true };
}

/**
 * Corriger le niveau d'une compétence portée.
 *
 * **Seul le niveau s'écrit.** La compétence de la liaison est relue côté serveur
 * et passée à `parsePersonSkillForm`, qui ignore alors ce que le formulaire
 * porterait : une liaison ne se déplace pas d'une compétence à l'autre, et
 * l'unicité n'a donc rien à arbitrer sur ce chemin. Se tromper de compétence se
 * répare en la retirant puis en la reposant.
 */
export async function updatePersonSkill(
  personSkillId: string,
  _previous: PersonSkillFormState,
  formData: FormData,
): Promise<PersonSkillFormState> {
  const session = await requireSession();

  const gate = await openPersonSkill(session, personSkillId);
  if ("message" in gate) return skillRefusal(formData, gate.message);

  const locked = gate.link.skillId;
  const { values, errors, input } = parsePersonSkillForm(formData, locked);
  if (!input) return { values, errors };

  try {
    const updated = await session.db.update(personSkills, personSkillId, {
      levelId: input.levelId,
    });
    if (!updated) {
      return skillRefusal(
        formData,
        "Cette compétence n'est plus portée par cette personne.",
        locked,
      );
    }
  } catch (error) {
    return skillScopeRefusal(error, formData, locked);
  }

  revalidatePath(ROUTES.team);

  return { values, errors: {}, ok: true };
}

/**
 * Retirer une compétence — **un retrait, jamais un archivage**.
 *
 * `person_skills` est une table de liaison : elle n'a pas d'`archived_at`, ce
 * qui la range dans `LinkTable` et rend `unlink` disponible **à la
 * compilation**, quand `archive` y devient un refus de typage (T5bis.1). C'est
 * la propriété éprouvée en T5.4 sur l'adoption d'un indicateur, et le verbe à
 * l'écran est « Retirer », jamais « Archiver ».
 *
 * **Le refus est muet** : ce geste n'a aucune saisie à rendre, et son formulaire
 * nu n'a nulle part où afficher un message. Le point d'entrée n'est rendu qu'à
 * qui peut écrire, sur une personne vivante du centre ; ce refus n'en est pas
 * moins nécessaire, un point d'entrée absent du rendu n'ayant jamais protégé le
 * point d'entrée HTTP qui l'accompagne.
 */
export async function removePersonSkill(personSkillId: string): Promise<void> {
  const session = await requireSession();

  const gate = await openPersonSkill(session, personSkillId);
  if ("message" in gate) return;

  await session.db.unlink(personSkills, personSkillId);

  revalidatePath(ROUTES.team);
}
