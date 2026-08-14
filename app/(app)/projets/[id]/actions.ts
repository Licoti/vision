"use server";

/**
 * Les écritures de la page projet — le geste critique du produit (`docs/06` §9) :
 * les activités depuis T3.3, **relier une ressource** depuis T4.2, et **saisir
 * un résultat** depuis T4.4.
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
 * **Un accompagnement archivé est en lecture seule, strictement** (T4bis.3,
 * arbitrage (a) de `tickets-C4bis.md`). Deux portes couvrent les cinq écritures
 * de ce fichier : `openProject` pour la création et la correction d'activité, la
 * ressource et le résultat ; `openActivity` pour la transition et l'annulation.
 * Toutes deux exigent désormais un projet non archivé, et **c'est le seul
 * endroit où la règle s'écrit** — une règle posée à cinq exemplaires diverge un
 * jour, et ces deux fonctions existent précisément pour qu'elle n'ait qu'une
 * adresse. Les trois panneaux disparaissent aussi du rendu, et les gestes de
 * roadmap avec eux ; ce n'est pas ce rendu qui protège.
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
 * **Le changement d'état et l'annulation (T3.5) suivent le même principe, sous
 * une forme plus légère.** `transitionActivity` et `cancelActivity` ne
 * passent pas par ce formulaire complet — un geste depuis la roadmap, sans
 * champ pour la première, un motif court pour la seconde — mais retrouvent
 * eux-mêmes le projet à partir de l'activité **reçue**, faute d'un
 * `projectId` lié : `writeProject` s'y vérifie de la même façon, et un refus
 * n'écrit rien, silencieusement — ces deux gestes n'ont aucune saisie à
 * rendre, contrairement au formulaire complet, et rien ne justifie de leur
 * inventer un message d'erreur que l'écran n'atteint jamais en usage normal.
 *
 * **Les participants (T3.6)** suivent le même principe que le reste : aucune
 * création de personne à la volée — c'est le formulaire de projet qui la
 * porte (T2.6, D19) —, et l'existence d'une personne dans le domaine n'est
 * **pas** pré-vérifiée ici, à la différence du type et de l'approche. C'est un
 * choix de la fiche : `lib/db/scoped.ts` la refuse déjà d'elle-même, via
 * `assertPreconditions`, qui dérive les clés étrangères d'`activity_participants`
 * depuis le schéma et lève `DomainScopeError` — attrapée par `scopeRefusal`,
 * comme le reste. **Ce ticket rouvre la non-atomicité que T2.6 posait déjà**
 * (`ETAT.md`) : `createActivity` écrit désormais deux tables, sans transaction
 * interactive pour les lier — la fenêtre résiduelle est acceptée, pas fermée.
 *
 * **Relier une ressource (T4.2)** ne fait exception à rien de ce qui précède :
 * même porte d'entrée `openProject` — au message près, `docs/05` §3 distinguant
 * les deux gestes —, même vérification de la référence reçue avant l'écriture,
 * même refus qui rend la saisie. Deux points la distinguent, et les deux sont
 * des **retraits** : elle n'écrit qu'une table, donc la non-atomicité ne la
 * concerne pas ; et elle ne revalide que la page du projet, **relier une
 * ressource n'étant pas une activité** — la fraîcheur d'un produit ne bouge pas
 * parce qu'un lien a été attaché.
 *
 * **Saisir un résultat (T4.4)** suit `createResource` de bout en bout — même
 * porte d'entrée, même revalidation restreinte à la page du projet, même refus
 * qui rend la saisie. Ce qui lui est propre tient en deux points. Elle lie
 * **deux** identifiants plutôt qu'un, le projet et l'activité, comme
 * `updateActivity` : un résultat n'existe pas hors de l'activité qui l'a
 * produit. Et elle est la première écriture du produit dont une règle est
 * portée par `lib/db/scoped.ts` plutôt que par ce fichier — « un résultat ne
 * se rattache qu'à une activité terminée », qui traverse deux tables. Elle la
 * laisse refuser et se contente de rendre son refus lisible.
 *
 * Aucune suppression, aucun archivage, jamais.
 */

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/provider";
import type { Session } from "@/lib/auth/session";
import {
  activities,
  activityParticipants,
  activityTypes,
  approaches,
  projects,
  resources,
  results,
  tools,
} from "@/lib/db/schema";
import { DomainScopeError, IntegrityError, type Row } from "@/lib/db/scoped";
import {
  activityRowUnchanged,
  canTransitionActivity,
  parseActivityForm,
  readActivityForm,
  readCancellationReason,
  validateCancellationReason,
  type ActivityCurrentRow,
  type ActivityFormErrors,
  type ActivityFormState,
  type ActivityRowInput,
  type ActivityState,
} from "@/lib/forms/activity";
import {
  parseResourceForm,
  readResourceForm,
  type ResourceFormErrors,
  type ResourceFormState,
  type ResourceRowInput,
} from "@/lib/forms/resource";
import {
  parseResultForm,
  readResultForm,
  type ResultFormState,
} from "@/lib/forms/result";
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
 *
 * `refused` dit **quel geste** est réservé — l'activité par défaut, la ressource
 * depuis T4.2. Le droit, lui, est rigoureusement le même : `docs/02` §5 range
 * les deux dans ce que le contributeur désigné écrit.
 *
 * Le refus d'archivage, lui, n'est **pas** paramétrable, et c'est voulu : ce
 * n'est pas le geste qui est réservé, c'est l'accompagnement qui est fermé.
 * Quatre gestes, un seul message.
 */
async function openProject(
  session: Session,
  projectId: string,
  refused = "La saisie d'une activité est réservée au responsable de domaine et aux contributeurs désignés de cet accompagnement.",
): Promise<{ project: Row<typeof projects> } | { message: string }> {
  // D9 — responsable de domaine, ou contributeur désigné de **ce** projet. Le
  // droit est par projet : la même personne peut écrire sur l'un et pas sur
  // l'autre, ce que T3.2 a éprouvé sur quatre couples personne × projet.
  if (!session.can.writeProject(projectId)) {
    return { message: refused };
  }

  const project = await session.db.find(projects, projectId);
  if (!project) {
    return { message: "Cet accompagnement n'existe plus dans ce domaine." };
  }

  /* La lecture seule d'un accompagnement archivé, première des deux adresses
     (T4bis.3). `find` rend les lignes archivées — délibérément, une donnée
     archivée restant lisible —, et rien n'en tirait les conséquences ici.
     Quatre écritures passent par cette ligne : la création et la correction
     d'activité, la ressource, le résultat. */
  if (project.archivedAt !== null) {
    return {
      message:
        "Cet accompagnement est archivé : il ne reçoit plus de saisie. Rétablissez-le d'abord.",
    };
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
   Les participants — T3.6

   Le diff, pas un remplacement : `insertMany` ajoute ce qui manque,
   `unlink` défait ce qui a disparu — sur le modèle de `syncMembers` dans
   `projets/actions.ts`, en plus simple, puisqu'une ligne d'`activity_participants`
   ne porte aucun rôle à mettre à jour. Une re-soumission à l'identique ne
   touche donc jamais la table : les deux ensembles sont égaux, ni l'un ni
   l'autre ne trouve quoi que ce soit à faire.

   **L'ajout passe en premier, et ce n'est pas un détail.** `insertMany`
   vérifie chaque ligne avant d'écrire (`assertPreconditions`, dans
   `lib/db/scoped.ts`) : une personne hors domaine y fait lever
   `DomainScopeError` **avant** toute écriture, puisque la boucle de
   vérification précède l'unique `insert` groupé. Si le retrait passait
   avant, une soumission qui retire une personne légitime et en ajoute une
   forgée verrait le retrait déjà écrit au moment où l'ajout est refusé — la
   ligne ne resterait pas intacte, contrairement à tout refus du reste du
   produit. Éprouvé sur le vrai chemin : une personne retirée et une
   personne forgée dans la même soumission laissaient l'ancien participant
   disparu malgré le refus, avant que cet ordre ne soit corrigé.
   ========================================================================== */

/**
 * Rend vrai si la liaison a changé — pour que l'appelant sache s'il doit
 * revalider les pages, indépendamment de la ligne `activities` elle-même.
 */
async function syncParticipants(
  session: Session,
  activityId: string,
  wanted: readonly string[],
): Promise<boolean> {
  const current = await session.db.list(activityParticipants, {
    where: eq(activityParticipants.activityId, activityId),
  });

  const held = new Set(current.map((row) => row.personId));
  const added = wanted.filter((personId) => !held.has(personId));
  if (added.length > 0) {
    await session.db.insertMany(
      activityParticipants,
      added.map((personId) => ({ activityId, personId })),
    );
  }

  const target = new Set(wanted);
  let removed = false;
  for (const row of current) {
    if (!target.has(row.personId)) {
      await session.db.unlink(activityParticipants, row.id);
      removed = true;
    }
  }

  return added.length > 0 || removed;
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

  const { values, errors, input, participantIds } = parseActivityForm(
    formData,
    today(),
  );
  if (!input) return { values, errors };

  const unknown = await checkReferences(session, input);
  if (Object.keys(unknown).length > 0) return { values, errors: unknown };

  try {
    const created = await session.db.insert(activities, { projectId, ...input });
    await syncParticipants(session, created.id, participantIds);
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

  const { values, errors, input, participantIds } = parseActivityForm(
    formData,
    today(),
    current,
  );
  if (!input) return { values, errors };

  const unknown = await checkReferences(session, input);
  if (Object.keys(unknown).length > 0) return { values, errors: unknown };

  // Une re-soumission à l'identique n'écrit rien sur la ligne : ni
  // `updated_at` repoussé, ni fraîcheur recalculée, ni ligne dans le journal
  // de C6 pour une modification qui n'en est pas une. Les participants (T3.6)
  // suivent leur propre diff, **indépendant** de ce constat : ils peuvent
  // changer sans que la période ne bouge, et `syncParticipants` tourne donc
  // toujours — sa propre idempotence (aucune ligne à ajouter ni retirer)
  // suffit à ne rien écrire sur une re-soumission identique. Le panneau se
  // referme dans tous les cas — refuser de fermer parce que rien n'a changé
  // serait une confirmation intermédiaire de plus.
  const rowChanged = !activityRowUnchanged(input, current);
  let participantsChanged: boolean;

  try {
    if (rowChanged) {
      const updated = await session.db.update(activities, activityId, input);
      if (!updated) {
        return refusal(
          formData,
          "Cette activité n'existe plus dans cet accompagnement.",
        );
      }
    }
    participantsChanged = await syncParticipants(
      session,
      activityId,
      participantIds,
    );
  } catch (error) {
    return scopeRefusal(error, formData);
  }

  if (rowChanged || participantsChanged) {
    refresh(projectId, gate.project.productId);
  }

  redirect(ROUTES.project(projectId));
}

/* ==========================================================================
   Le cycle de vie — T3.5
   ========================================================================== */

/**
 * L'activité et son projet, retrouvés à partir de l'activité **reçue** — ces
 * deux gestes n'ont pas de `projectId` lié, contrairement à `createActivity`
 * et `updateActivity`. `writeProject` se vérifie sur le projet ainsi trouvé,
 * jamais sur un identifiant qu'on nous soumettrait à côté.
 *
 * Un refus ici est **muet** : ni redirection, ni message. Ces deux actions ne
 * s'atteignent en usage normal que par un bouton que l'écran n'affiche que
 * lorsque le geste est légal — le contrôle protège la requête forgée, pas un
 * parcours que l'interface est censée emprunter.
 *
 * **Seconde adresse de la lecture seule** (T4bis.3) : un projet archivé ferme
 * la transition et l'annulation comme il ferme le formulaire complet. Le refus
 * y est muet, comme les deux autres refus de cette porte — la roadmap d'un
 * accompagnement archivé n'affiche plus aucun de ces deux gestes.
 */
async function openActivity(
  session: Session,
  activityId: string,
): Promise<
  { activity: Row<typeof activities>; project: Row<typeof projects> } | null
> {
  const activity = await session.db.find(activities, activityId);
  if (!activity || activity.archivedAt !== null) return null;
  if (!session.can.writeProject(activity.projectId)) return null;

  const project = await session.db.find(projects, activity.projectId);
  if (!project || project.archivedAt !== null) return null;

  return { activity, project };
}

/**
 * Faire avancer une activité d'un cran — « Marquer en cours », « Marquer
 * terminée » — depuis l'entrée de roadmap, sans passer par le panneau complet
 * (`docs/03` §4).
 *
 * Passer à `in_progress` efface aussi `isUnscheduled` : une activité « à
 * planifier » qui démarre n'est plus sans date au sens de l'affichage —
 * `formatActivityPeriod` regarde `isUnscheduled` avant tout le reste, et le
 * laisser à `true` ferait lire « À planifier » sur une activité en cours.
 *
 * Passer à `done` exige une fin de période déjà écrite : ce geste n'a pas de
 * champ pour en saisir une, et Vision ne fabrique aucune date (arbitrage du
 * 13/08/2026, repris de la dérivation en T3.3). Une activité `in_progress`
 * dont la période n'a qu'un début reste donc « en cours » jusqu'à ce qu'une
 * fin lui soit donnée par le panneau d'édition (T3.4), qui redérive l'état
 * puisque la période aura bougé.
 */
export async function transitionActivity(
  activityId: string,
  target: Extract<ActivityState, "in_progress" | "done">,
): Promise<void> {
  const session = await requireSession();

  const gate = await openActivity(session, activityId);
  if (!gate) return;
  const { activity, project } = gate;

  if (!canTransitionActivity(activity.state, target)) return;
  if (target === "done" && activity.periodEnd === null) return;

  await session.db.update(activities, activityId, {
    state: target,
    ...(target === "in_progress" ? { isUnscheduled: false } : {}),
  });

  refresh(activity.projectId, project.productId);
}

/**
 * Annuler une activité — la seule transition qui exige une saisie, un motif
 * court (`docs/03` §4). Le champ est `required` en HTML ; la vérification
 * ci-dessous n'est qu'un second filet, pour la requête qui l'aurait
 * contourné.
 *
 * Comme `transitionActivity`, un refus est muet : ni saisie à préserver ni
 * message à afficher, le formulaire n'ayant qu'un champ dont l'absence est
 * déjà empêchée côté client.
 */
export async function cancelActivity(
  activityId: string,
  formData: FormData,
): Promise<void> {
  const session = await requireSession();

  const gate = await openActivity(session, activityId);
  if (!gate) return;
  const { activity, project } = gate;

  if (!canTransitionActivity(activity.state, "cancelled")) return;

  const reason = readCancellationReason(formData);
  if (validateCancellationReason(reason)) return;

  await session.db.update(activities, activityId, {
    state: "cancelled",
    cancellationReason: reason,
  });

  refresh(activity.projectId, project.productId);
}

/* ==========================================================================
   Relier une ressource — T4.2

   Le geste qui ferme la boucle minimale de `docs/05` §2. Une table, un
   formulaire, la même porte d'entrée que le reste du fichier.
   ========================================================================== */

/** Le jumeau de `refusal` ci-dessus, pour l'autre formulaire de cette page. */
function resourceRefusal(
  formData: FormData,
  message: string,
): ResourceFormState {
  return { values: readResourceForm(formData), errors: {}, message };
}

/**
 * L'activité reçue, rapprochée de **ce** projet.
 *
 * Le rattachement est facultatif (`docs/02` §5) : rien à vérifier quand il est
 * absent. Renseigné, il ne suffit pas qu'il désigne une activité du domaine —
 * une ressource appartient à un projet, et son activité productrice aussi. Sans
 * ce contrôle, une soumission forgée rattacherait la restitution d'un
 * accompagnement à l'activité d'un autre, et le bloc de T4.1 afficherait
 * fidèlement ce mensonge.
 *
 * Une activité **archivée** est refusée pour la même raison qu'en correction
 * (T3.4) : le panneau ne la propose pas, et rien ne justifie de l'accepter par
 * requête. Une activité **annulée**, en revanche, passe : elle n'est pas
 * proposée non plus, mais elle a pu produire un document avant d'être
 * abandonnée — ce qu'on ne propose pas, on continue de l'accepter.
 *
 * Un message de champ, jamais une exception : `assertPreconditions` reste le
 * second filet, pas le premier.
 */
async function checkResourceActivity(
  session: Session,
  projectId: string,
  input: ResourceRowInput,
): Promise<ResourceFormErrors> {
  if (!input.activityId) return {};

  const activity = await session.db.find(activities, input.activityId);
  if (!activity || activity.projectId !== projectId || activity.archivedAt !== null) {
    return {
      activityId: "Cette activité n'appartient pas à cet accompagnement.",
    };
  }

  return {};
}

/**
 * Relier une ressource à un projet, et facultativement à l'activité qui l'a
 * produite.
 *
 * `projectId` est lié côté serveur ; `previous` est l'état que `useActionState`
 * fait circuler, dont l'action n'a pas besoin — la saisie repart du `FormData`
 * à chaque soumission.
 *
 * **Aucune requête sortante vers l'adresse saisie** : elle est enregistrée telle
 * qu'elle a été tapée, une fois son schéma vérifié. Vision n'appelle pas les
 * outils qu'elle référence (interdit de la fiche, D15).
 */
export async function createResource(
  projectId: string,
  _previous: ResourceFormState,
  formData: FormData,
): Promise<ResourceFormState> {
  const session = await requireSession();

  const gate = await openProject(
    session,
    projectId,
    "Relier une ressource est réservé au responsable de domaine et aux contributeurs désignés de cet accompagnement.",
  );
  if ("message" in gate) return resourceRefusal(formData, gate.message);

  const { values, errors, input } = parseResourceForm(formData);
  if (!input) return { values, errors };

  const misplaced = await checkResourceActivity(session, projectId, input);
  if (Object.keys(misplaced).length > 0) return { values, errors: misplaced };

  try {
    await session.db.insert(resources, { projectId, ...input });
  } catch (error) {
    if (error instanceof DomainScopeError) {
      return resourceRefusal(
        formData,
        "Une référence de ce formulaire n'appartient pas au domaine : la saisie n'a pas été enregistrée.",
      );
    }
    throw error;
  }

  /* **Cette page-là, et elle seule.** `refresh` revalide en plus la liste des
     produits et la page du produit, toutes deux porteuses de la fraîcheur que
     la couche recalcule à chaque écriture d'activité. Relier une ressource
     n'est pas une activité : rien n'y a bougé, et les revalider ferait croire
     le contraire au lecteur de ce fichier. */
  revalidatePath(ROUTES.project(projectId));

  // La page nue, panneau refermé : « enregistrement sans confirmation
  // intermédiaire » (`docs/06` §9). La ressource paraît en tête de son bloc —
  // l'ordre tranché par T4.1 —, et c'est toute la confirmation. `redirect`
  // lève : elle est appelée hors de tout `try`, faute de quoi le `catch`
  // ci-dessus avalerait la navigation.
  redirect(ROUTES.project(projectId));
}

/* ==========================================================================
   Saisir un résultat — T4.4

   Le niveau 1 de `docs/03` §5, et lui seul (D15) : la valeur se saisit et le
   lien se colle. Vision n'appelle jamais l'outil qu'elle référence.
   ========================================================================== */

/** Le troisième jumeau de `refusal`, pour le troisième formulaire de la page. */
function resultRefusal(formData: FormData, message: string): ResultFormState {
  return { values: readResultForm(formData), errors: {}, message };
}

/**
 * L'activité **reçue**, confrontée au projet reçu et à ce qui autorise un
 * résultat.
 *
 * Trois contrôles, et un quatrième laissé à la couche :
 *
 * 1. elle existe, elle appartient à **ce** projet, elle n'est pas archivée —
 *    le contrôle de `checkResourceActivity`, pour la même raison : sans lui,
 *    une soumission forgée poserait le résultat d'un accompagnement sur
 *    l'activité d'un autre, et la roadmap afficherait fidèlement ce mensonge ;
 * 2. **son type porte `produces_result`** — `docs/04` §2 : le drapeau
 *    « conditionne la saisie d'un résultat ». L'écran ne montre le point
 *    d'entrée que là ; un panneau absent du rendu n'a jamais protégé le point
 *    d'entrée HTTP qui l'accompagne, et ce refus-ci n'est donc pas une règle
 *    de plus mais la même règle, éprouvée là où elle tient ;
 * 3. **aucun résultat n'y est déjà posé** — `results_activity_unique` n'en
 *    autorise qu'un. Sans ce contrôle, la seconde saisie ne serait pas refusée
 *    mais **plantée** : une violation d'unicité est une exception PostgreSQL,
 *    donc un 500, là où l'on attend un message.
 *
 * Le quatrième — l'activité est **terminée** — n'est pas réécrit ici :
 * `assertPreconditions` le porte depuis T1.3, à travers deux tables, et le
 * ticket se contente de le laisser refuser puis de rendre son refus lisible.
 * Deux autorités sur une même règle divergent un jour.
 */
async function checkResultActivity(
  session: Session,
  projectId: string,
  activityId: string,
): Promise<string | null> {
  const activity = await session.db.find(activities, activityId);
  if (
    !activity ||
    activity.projectId !== projectId ||
    activity.archivedAt !== null
  ) {
    return "Cette activité n'existe plus dans cet accompagnement.";
  }

  /* `find` rend les lignes archivées, et c'est voulu ici comme en T3.4 : un
     type archivé depuis reste celui de l'activité, et son drapeau reste vrai.
     Ce qu'on ne propose plus, on continue de l'accepter. */
  const type = await session.db.find(activityTypes, activity.activityTypeId);
  if (!type || !type.producesResult) {
    return "Ce type d'activité ne produit pas de résultat chiffré.";
  }

  /* `includeArchived` **et ce n'est pas une précaution de style** :
     `results_activity_unique` porte sur `activity_id` seul et ignore
     `archived_at` (piège relevé par T4.3). Une ligne archivée bloquerait donc
     l'insertion sans que la lecture par défaut la voie. Le chemin n'est pas
     atteignable — rien n'archive un résultat avant C4bis — et c'est exactement
     pourquoi le contrôle doit épouser la contrainte plutôt que le cas courant. */
  const existing = await session.db.list(results, {
    includeArchived: true,
    where: eq(results.activityId, activityId),
  });
  if (existing.length > 0) {
    return "Cette activité porte déjà un résultat.";
  }

  return null;
}

/**
 * Reporter dans Vision la valeur qu'un outil externe a produite, depuis
 * l'activité terminée qui l'a produite.
 *
 * `projectId` et `activityId` sont liés côté serveur, comme `updateActivity`
 * depuis T3.4. **Ce ne sont pas des secrets** : Next les sérialise en clair
 * dans un champ `$ACTION_…`, et une soumission peut les réécrire. Ce qui
 * protège est `openProject` interrogé sur le projet **reçu**, puis
 * `checkResultActivity` sur l'activité **reçue**.
 *
 * **Aucune requête sortante vers l'adresse saisie**, ni vers l'outil : le POC
 * s'en tient au niveau 1 déclaratif (D15). Aucun pré-remplissage, aucun bouton
 * de lancement délégué — c'est le niveau 2, après le POC.
 */
export async function createResult(
  projectId: string,
  activityId: string,
  _previous: ResultFormState,
  formData: FormData,
): Promise<ResultFormState> {
  const session = await requireSession();

  const gate = await openProject(
    session,
    projectId,
    "La saisie d'un résultat est réservée au responsable de domaine et aux contributeurs désignés de cet accompagnement.",
  );
  if ("message" in gate) return resultRefusal(formData, gate.message);

  const { values, errors, input } = parseResultForm(formData);
  if (!input) return { values, errors };

  const refused = await checkResultActivity(session, projectId, activityId);
  if (refused) return resultRefusal(formData, refused);

  /* L'outil reçu, rapproché du domaine — le modèle de `checkReferences`. Il est
     facultatif (`results.tool_id` est nullable) : rien à vérifier quand il est
     absent. `assertPreconditions` reste le second filet, pas le premier. */
  if (input.toolId) {
    const tool = await session.db.find(tools, input.toolId);
    if (!tool) {
      return {
        values,
        errors: { toolId: "Cet outil n'existe pas dans ce domaine." },
      };
    }
  }

  try {
    await session.db.insert(results, { activityId, ...input });
  } catch (error) {
    /* La règle de T1.3, laissée refuser et rendue lisible. Elle traverse deux
       tables — le résultat et l'état de son activité —, ce qu'aucune clé
       étrangère ne sait faire, et c'est pourquoi elle vit dans la couche. */
    if (error instanceof IntegrityError) {
      return resultRefusal(
        formData,
        "Un résultat ne se rattache qu'à une activité terminée.",
      );
    }
    if (error instanceof DomainScopeError) {
      return resultRefusal(
        formData,
        "Une référence de ce formulaire n'appartient pas au domaine : la saisie n'a pas été enregistrée.",
      );
    }
    throw error;
  }

  /* **Cette page-là, et elle seule**, pour la raison de `createResource` :
     saisir un résultat n'est pas écrire une activité. `last_activity_at` n'a
     pas bougé, et revalider la fraîcheur du produit ferait croire le contraire
     au lecteur de ce fichier. */
  revalidatePath(ROUTES.project(projectId));

  // La page nue, panneau refermé : « enregistrement sans confirmation
  // intermédiaire » (`docs/06` §9). Le résultat paraît sur l'entrée de roadmap
  // de son activité — la lecture de T4.3 —, et le point d'entrée en disparaît :
  // c'est toute la confirmation. `redirect` lève, donc hors de tout `try`.
  redirect(ROUTES.project(projectId));
}
