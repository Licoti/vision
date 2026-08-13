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
 * et `updateActivity.bind(null, project.id, activity.id)` depuis T3.4. Ce ne
 * sont pas des champs du formulaire, mais **ce ne sont pas non plus des
 * secrets** : Next sérialise les arguments liés dans un champ `$ACTION_…` du
 * balisage, en clair en développement, et une requête soumise peut donc les
 * réécrire — vérifié, pas supposé. La liaison range les identifiants hors de la
 * saisie ; elle ne les protège pas.
 *
 * **Ce qui protège est le contrôle ci-dessous, et lui seul** : `writeProject`
 * est interrogé sur le `projectId` **reçu**, quel qu'il soit, et l'activité
 * reçue est rapprochée de ce projet. Repointer une liaison vers un projet où
 * l'on n'écrit pas, ou vers une activité d'ailleurs, est donc refusé comme le
 * reste.
 *
 * **`last_activity_at` n'est pas recalculé ici.** `lib/db/scoped.ts` le fait
 * pour toute écriture d'activité, dans le même `batch` que l'insertion ou la
 * modification. Le refaire ici poserait une seconde autorité sur un champ
 * dérivé.
 *
 * Aucune écriture directe : tout passe par `session.db`, déjà scopé sur le
 * domaine courant et sur la personne courante — `domain_id` et `created_by`
 * sont posés par la couche, l'appelant n'y pense pas. Règle 1.
 *
 * Ce que ce fichier ne fait pas : changer d'état ni annuler (T3.5), déclarer
 * des participants (T3.6). Aucune suppression, aucun archivage, jamais.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/provider";
import type { Session } from "@/lib/auth/session";
import { activities, activityTypes, approaches, projects } from "@/lib/db/schema";
import { DomainScopeError, type Row } from "@/lib/db/scoped";
import {
  activityRowUnchanged,
  parseActivityForm,
  readActivityForm,
  type ActivityCurrentRow,
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

/**
 * Un refus qui n'appartient à aucun champ — un droit, une ligne disparue.
 *
 * La saisie revient telle quelle : Vision ne jette jamais en silence ce qui a
 * été tapé, y compris quand ce qu'elle refuse n'est pas la saisie.
 */
function refusal(formData: FormData, message: string): ActivityFormState {
  return { values: readActivityForm(formData), errors: {}, message };
}

/* ==========================================================================
   Vérifier avant d'écrire
   ========================================================================== */

/**
 * Le droit, puis le projet — dans cet ordre, et avant toute lecture du
 * formulaire.
 *
 * `writeProject` porte sur une **désignation**, pas sur une appartenance de
 * domaine : le projet est donc confronté au domaine ensuite, faute de quoi un
 * identifiant d'un autre domaine passerait par une désignation homonyme.
 */
async function openProject(
  session: Session,
  projectId: string,
): Promise<{ project: Row<typeof projects> } | { message: string }> {
  // D9 — responsable de domaine, ou contributeur désigné de **ce** projet. Le
  // droit est par projet : la même personne peut écrire sur l'un et pas sur
  // l'autre, ce que T3.2 a éprouvé sur quatre couples personne × projet.
  if (!session.can.writeProject(projectId)) {
    return {
      message:
        "La saisie d'une activité est réservée au responsable de domaine et aux contributeurs désignés de cet accompagnement.",
    };
  }

  const project = await session.db.find(projects, projectId);
  if (!project) {
    return { message: "Cet accompagnement n'existe plus dans ce domaine." };
  }

  return { project };
}

/**
 * Le type et l'approche reçus, rapprochés du domaine courant.
 *
 * Un identifiant inconnu — ou d'un autre domaine, que la couche ne distingue
 * pas — produit un message de champ, jamais une exception.
 * `assertPreconditions` reste le second filet, pas le premier.
 *
 * `find` rend les lignes archivées, et c'est voulu : une activité qui pointe un
 * type archivé depuis reste modifiable sans qu'on lui impose d'en changer
 * (T3.4). Ce que l'on ne **propose** pas, on continue de l'accepter.
 */
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
 * Les quatre écrans que cette écriture change.
 *
 * La liste des produits et la page du produit en font partie : toutes deux
 * affichent la **fraîcheur** du produit, que la couche vient de recalculer.
 */
function refresh(projectId: string, productId: string): void {
  revalidatePath(ROUTES.project(projectId));
  revalidatePath(ROUTES.projects);
  revalidatePath(ROUTES.products);
  revalidatePath(ROUTES.product(productId));
}

/**
 * Le second filet : une référence a franchi la vérification et la couche l'a
 * refusée. L'écran le dit plutôt que de rendre une page en erreur.
 */
function scopeRefusal(error: unknown, formData: FormData): ActivityFormState {
  if (error instanceof DomainScopeError) {
    return refusal(
      formData,
      "Une référence de ce formulaire n'appartient pas au domaine : la saisie n'a pas été enregistrée.",
    );
  }
  throw error;
}

/* ==========================================================================
   Créer
   ========================================================================== */

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
  const session = await requireSession();

  const gate = await openProject(session, projectId);
  if ("message" in gate) return refusal(formData, gate.message);

  const { values, errors, input } = parseActivityForm(formData, today());
  if (!input) return { values, errors };

  const unknown = await checkReferences(session, input);
  if (Object.keys(unknown).length > 0) return { values, errors: unknown };

  try {
    await session.db.insert(activities, { projectId, ...input });
  } catch (error) {
    return scopeRefusal(error, formData);
  }

  refresh(projectId, gate.project.productId);

  // La page nue, panneau refermé : « enregistrement sans confirmation
  // intermédiaire » (`docs/06` §9). La roadmap affiche l'activité dans le
  // groupe que sa période commande, et c'est toute la confirmation. `redirect`
  // lève : elle est appelée hors de tout `try`, faute de quoi le `catch`
  // ci-dessus avalerait la navigation.
  redirect(ROUTES.project(projectId));
}

/* ==========================================================================
   Corriger — T3.4
   ========================================================================== */

/**
 * Corriger une activité déjà saisie : **le même formulaire, la même
 * validation, les mêmes règles.** Seul l'état suit un chemin différent.
 *
 * Trois contrôles enchaînés, et chacun ferme une porte :
 *
 * 1. `openProject` — le droit sur le `projectId` **reçu**, puis son domaine ;
 * 2. l'activité reçue **appartient à ce projet**, ce qui interdit d'en
 *    déplacer une d'un accompagnement à l'autre par requête forgée (`docs/03`
 *    §6 : une activité appartient à un seul projet). C'est aussi pourquoi
 *    `ActivityRowInput` ne porte pas `projectId` : la colonne n'est pas
 *    écrite ;
 * 3. elle n'est ni archivée ni annulée. **Une activité annulée ne s'édite
 *    pas** : la roadmap ne l'affiche pas (T3.1), aucun lien n'y mène, et une
 *    période déplacée la ferait sortir de `cancelled` sans qu'on l'ait
 *    demandé — c'est le geste de T3.5, pas celui-ci.
 *
 * Les trois refus se ressemblent volontairement : l'écran ne distingue pas
 * l'activité inconnue de celle d'un autre domaine, pour la même raison que la
 * page projet rend 404 dans les deux cas.
 */
export async function updateActivity(
  projectId: string,
  activityId: string,
  _previous: ActivityFormState,
  formData: FormData,
): Promise<ActivityFormState> {
  const session = await requireSession();

  const gate = await openProject(session, projectId);
  if ("message" in gate) return refusal(formData, gate.message);

  const existing = await session.db.find(activities, activityId);
  if (
    !existing ||
    existing.projectId !== projectId ||
    existing.archivedAt !== null ||
    existing.state === "cancelled"
  ) {
    return refusal(
      formData,
      "Cette activité n'existe plus dans cet accompagnement.",
    );
  }

  /* La ligne d'avant, sur laquelle se décide tout ce qui suit : l'état n'est
     redérivé que si la période a bougé (arbitrage (c) du 13/08/2026), et
     l'écriture n'a lieu que si quelque chose a changé. */
  const current: ActivityCurrentRow = {
    state: existing.state,
    periodStart: existing.periodStart,
    periodEnd: existing.periodEnd,
    isUnscheduled: existing.isUnscheduled,
    activityTypeId: existing.activityTypeId,
    approachId: existing.approachId,
    objective: existing.objective,
  };

  const { values, errors, input } = parseActivityForm(
    formData,
    today(),
    current,
  );
  if (!input) return { values, errors };

  const unknown = await checkReferences(session, input);
  if (Object.keys(unknown).length > 0) return { values, errors: unknown };

  // Une re-soumission à l'identique n'écrit rien : ni `updated_at` repoussé, ni
  // fraîcheur recalculée, ni ligne dans le journal de C6 pour une modification
  // qui n'en est pas une. Le panneau se referme quand même — refuser de fermer
  // parce que rien n'a changé serait une confirmation intermédiaire de plus.
  if (!activityRowUnchanged(input, current)) {
    try {
      const updated = await session.db.update(activities, activityId, input);
      if (!updated) {
        return refusal(
          formData,
          "Cette activité n'existe plus dans cet accompagnement.",
        );
      }
    } catch (error) {
      return scopeRefusal(error, formData);
    }

    refresh(projectId, gate.project.productId);
  }

  redirect(ROUTES.project(projectId));
}
