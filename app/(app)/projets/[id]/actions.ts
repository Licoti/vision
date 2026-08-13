"use server";

/**
 * Les écritures d'activité — le geste critique du produit (`docs/06` §9).
 *
 * D9 : **saisir dans un projet est ouvert au contributeur désigné**, pas
 * seulement au responsable de domaine. C'est ce qui distingue ce fichier de
 * `projets/actions.ts`, qui exige `manageDomain` : modifier l'identité d'un
 * accompagnement et y saisir une activité ne demandent pas le même droit.
 *
 * **Le droit se vérifie ici, et pas à l'écran.** Le panneau n'apparaît qu'à qui
 * peut écrire, mais une action serveur est un point d'entrée HTTP à part
 * entière : ses champs se récoltent sur la page servie à quelqu'un d'autre et
 * se repostent sous un autre cookie. Un bouton masqué n'est pas un droit.
 *
 * **Le projet est lié côté serveur** — `createActivity.bind(null, project.id)`,
 * comme l'identifiant l'est déjà dans `/projets/[id]/modifier`. Ce n'est pas un
 * champ du formulaire, mais **ce n'est pas non plus un secret** : Next sérialise
 * l'argument lié dans un champ `$ACTION_…` du balisage, en clair en
 * développement, et une requête soumise peut donc le réécrire — vérifié, pas
 * supposé. La liaison range l'identifiant hors de la saisie ; elle ne le
 * protège pas.
 *
 * **Ce qui protège est le contrôle ci-dessous, et lui seul** : `writeProject`
 * est interrogé sur le `projectId` **reçu**, quel qu'il soit. Repointer la
 * liaison vers un projet où l'on n'écrit pas est donc refusé comme le reste —
 * éprouvé en récoltant le panneau là où le droit existe et en le soumettant
 * vers un projet où il n'existe pas.
 *
 * **`last_activity_at` n'est pas recalculé ici.** `lib/db/scoped.ts` le fait
 * pour toute écriture d'activité, dans le même `batch` que l'insertion. Le
 * refaire ici poserait une seconde autorité sur un champ dérivé.
 *
 * Aucune écriture directe : tout passe par `session.db`, déjà scopé sur le
 * domaine courant et sur la personne courante — `domain_id` et `created_by`
 * sont posés par la couche, l'appelant n'y pense pas. Règle 1.
 *
 * Ce que ce fichier ne fait pas : éditer (T3.4), changer d'état ni annuler
 * (T3.5), déclarer des participants (T3.6). Aucune suppression, jamais.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/provider";
import type { Session } from "@/lib/auth/session";
import { activities, activityTypes, approaches, projects } from "@/lib/db/schema";
import { DomainScopeError } from "@/lib/db/scoped";
import {
  parseActivityForm,
  type ActivityFormErrors,
  type ActivityFormState,
  type ActivityRowInput,
} from "@/lib/forms/activity";
import { ROUTES } from "@/lib/navigation";

/**
 * Le jour courant en `YYYY-MM-DD`, dans le fuseau du serveur.
 *
 * **C'est le seul endroit du chemin où l'horloge est consultée.** La
 * dérivation, elle, reçoit cette valeur en paramètre : une règle de date qui
 * lirait l'heure ne s'éprouverait pas. `sv-SE` rend l'ISO sans décalage — le
 * `toISOString` d'un `Date` local reculerait d'un jour avant 02 h en été.
 */
function today(): string {
  return new Date().toLocaleDateString("sv-SE");
}

/* ==========================================================================
   Vérifier avant d'écrire

   Le type et l'approche reçus sont rapprochés du domaine courant. Un
   identifiant inconnu — ou d'un autre domaine, que la couche ne distingue pas
   — produit un message de champ, jamais une exception. `assertPreconditions`
   reste le second filet, pas le premier.
   ========================================================================== */

async function checkReferences(
  session: Session,
  input: ActivityRowInput,
): Promise<ActivityFormErrors> {
  const errors: ActivityFormErrors = {};

  const [type, approach] = await Promise.all([
    session.db.find(activityTypes, input.activityTypeId),
    input.approachId
      ? session.db.find(approaches, input.approachId)
      : Promise.resolve(undefined),
  ]);

  if (!type) {
    errors.activityTypeId = "Ce type d'activité n'existe pas dans ce domaine.";
  }
  if (input.approachId && !approach) {
    errors.approachId = "Cette approche n'existe pas dans ce domaine.";
  }

  return errors;
}

/**
 * Saisir une activité sur un projet.
 *
 * `projectId` est lié côté serveur ; `previous` est l'état que
 * `useActionState` fait circuler, dont l'action n'a pas besoin — la saisie
 * repart du `FormData` à chaque soumission.
 */
export async function createActivity(
  projectId: string,
  _previous: ActivityFormState,
  formData: FormData,
): Promise<ActivityFormState> {
  const { values, errors, input } = parseActivityForm(formData, today());
  const session = await requireSession();

  // D9 — responsable de domaine, ou contributeur désigné de **ce** projet. Le
  // droit est par projet : la même personne peut écrire sur l'un et pas sur
  // l'autre, ce que T3.2 a éprouvé sur quatre couples personne × projet.
  if (!session.can.writeProject(projectId)) {
    return {
      values,
      errors: {},
      message:
        "La saisie d'une activité est réservée au responsable de domaine et aux contributeurs désignés de cet accompagnement.",
    };
  }

  if (!input) return { values, errors };

  // Le projet est confronté au domaine avant tout : `writeProject` répond sur
  // une désignation, pas sur une appartenance de domaine.
  const project = await session.db.find(projects, projectId);
  if (!project) {
    return {
      values,
      errors: {},
      message: "Cet accompagnement n'existe plus dans ce domaine.",
    };
  }

  const unknown = await checkReferences(session, input);
  if (Object.keys(unknown).length > 0) return { values, errors: unknown };

  try {
    await session.db.insert(activities, { projectId, ...input });
  } catch (error) {
    // Le second filet : une référence a franchi la vérification et la couche
    // l'a refusée. L'écran le dit plutôt que de rendre une page en erreur.
    if (error instanceof DomainScopeError) {
      return {
        values,
        errors: {},
        message:
          "Une référence de ce formulaire n'appartient pas au domaine : la saisie n'a pas été enregistrée.",
      };
    }
    throw error;
  }

  /* Les quatre écrans que cette écriture change. La liste des produits et la
     page du produit en font partie : toutes deux affichent la **fraîcheur** du
     produit, que la couche vient de recalculer. `redirect` lève : elle est
     appelée hors de tout `try`, faute de quoi le `catch` ci-dessus avalerait
     la navigation. */
  revalidatePath(ROUTES.project(projectId));
  revalidatePath(ROUTES.projects);
  revalidatePath(ROUTES.products);
  revalidatePath(ROUTES.product(project.productId));

  // La page nue, panneau refermé : « enregistrement sans confirmation
  // intermédiaire » (`docs/06` §9). La roadmap affiche l'activité dans le
  // groupe que sa période commande, et c'est toute la confirmation.
  redirect(ROUTES.project(projectId));
}
