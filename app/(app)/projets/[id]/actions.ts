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
 * arbitrage (a) de `tickets-C4bis.md`). Deux portes couvrent les écritures
 * de ce fichier : `openProject` pour la création et la correction d'activité, la
 * ressource et le résultat ; `openActivity` pour la transition, l'annulation et
 * **l'archivage d'une activité** (T4bis.4). Toutes deux exigent un projet non
 * archivé, et **c'est le seul endroit où la règle s'écrit** — une règle posée à
 * six exemplaires diverge un jour, et ces deux fonctions existent précisément
 * pour qu'elle n'ait qu'une adresse. Les trois panneaux disparaissent aussi du
 * rendu, et les gestes de roadmap avec eux ; ce n'est pas ce rendu qui protège.
 *
 * **Sept écritures ajoutent ou corrigent ; trois retirent** (T4bis.4, T4bis.5,
 * T4bis.6). `archiveActivity`, `archiveResource` et `archiveResult` sont les
 * seuls gestes de ce fichier qui sortent une ligne du récit, et les seuls
 * appelants d'`archive()` ici. Ils ne suppriment rien (règle 4) et ne cascadent
 * sur rien (arbitrage (f)) : archiver une activité laisse ses ressources avec
 * leur `activity_id` et leur `archived_at` nul.
 *
 * **Corriger et retirer une ressource (T4bis.5)** ferme la moitié du manque (4)
 * du chantier. `openResource` en est la troisième porte : elle enchaîne
 * `openProject` sur le projet **reçu** et le rapprochement de la ressource
 * **reçue** à ce projet — sans ce second contrôle, une soumission forgée
 * corrigerait la ressource d'un autre accompagnement.
 *
 * **Corriger et retirer un résultat (T4bis.6)** ferme l'autre moitié, et
 * `openResult` est la quatrième porte — un maillon de plus que les autres, le
 * résultat pendant à une activité qui pend elle-même au projet, `results`
 * n'ayant pas de `project_id`. Le ticket porte aussi **la première migration
 * depuis T1.2** : `results_activity_unique` est devenu un index **partiel**, et
 * le contrôle d'unicité de `checkResultActivity` s'est relu avec elle — T4.4
 * l'avait écrit pour épouser l'ancienne contrainte, et le laisser interdirait
 * la ressaisie que la migration vient d'autoriser.
 *
 * **`last_activity_at` n'est pas recalculé ici.** `lib/db/scoped.ts` le fait
 * pour toute écriture d'activité — **l'archivage compris**, dans le même `batch`
 * que la pose d'`archived_at` —, comme il le fait pour l'insertion et la
 * modification. Le refaire ici poserait une seconde autorité sur un champ
 * dérivé, ce que `docs/04` §6 interdit.
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
 * `projectId` lié : `writeProject` s'y vérifie de la même façon.
 *
 * **Leurs refus ont cessé de se ressembler le jour où le menu contextuel est
 * arrivé sur les cartes de roadmap.** `transitionActivity` refuse toujours en
 * silence : c'est un geste sans écran, qui n'a aucune saisie à rendre, et rien
 * ne justifie de lui inventer un message qu'aucune vue n'atteint.
 * `cancelActivity`, elle, a désormais un écran — le `ConfirmPanel` ouvert par
 * `?annuler=<id>`, qui a sorti son champ « Motif » de la pile des gestes —, et
 * un panneau muet devant un refus n'apprend rien à personne. Elle rend donc un
 * `ConfirmState`, comme `archiveProject`.
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
 * **Aucune suppression, jamais** (règle 4) : la couche n'expose pas de `delete`,
 * et ce fichier ne lui en demande pas. Ce qui se retire s'archive.
 */

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import type { ConfirmState } from "@/components/ui/confirm-panel";
import { requireSession } from "@/lib/auth/provider";
import type { Session } from "@/lib/auth/session";
import {
  activities,
  activityParticipants,
  activityTypes,
  approaches,
  indicators,
  projectIndicators,
  projects,
  resources,
  results,
  tools,
} from "@/lib/db/schema";
import { DomainScopeError, IntegrityError, type Row } from "@/lib/db/scoped";
import {
  parseAdoptionForm,
  readAdoptionForm,
  type AdoptionFormErrors,
  type AdoptionFormState,
  type AdoptionRowInput,
} from "@/lib/forms/adoption";
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
 * Six gestes, un seul message.
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
     Six écritures passent par cette ligne : la création et la correction
     d'activité, la création, la correction et le retrait d'une ressource, le
     résultat. */
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

  /* **Le panneau se referme sur ce succès, et non plus sur une navigation**
     (TD.2). `redirect` était la fermeture ; elle ne peut plus l'être sans
     re-rendre la page que le panneau n'a justement plus à quitter.
     `revalidatePath` reste, et la réponse de l'action porte l'arbre
     réactualisé : ce qui a été écrit paraît dans son bloc, et c'est toute la
     confirmation (`docs/06` §9). */
  return { values, errors: {}, ok: true };
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
    externalUrl: existing.externalUrl,
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

  /* **Le panneau se referme sur ce succès, et non plus sur une navigation**
     (TD.2). `redirect` était la fermeture ; elle ne peut plus l'être sans
     re-rendre la page que le panneau n'a justement plus à quitter.
     `revalidatePath` reste, et la réponse de l'action porte l'arbre
     réactualisé : ce qui a été écrit paraît dans son bloc, et c'est toute la
     confirmation (`docs/06` §9). */
  return { values, errors: {}, ok: true };
}

/* ==========================================================================
   Le cycle de vie — T3.5
   ========================================================================== */

/**
 * L'activité et son projet, retrouvés à partir de l'activité **reçue** — ces
 * trois gestes n'ont pas de `projectId` lié, contrairement à `createActivity`
 * et `updateActivity`. `writeProject` se vérifie sur le projet ainsi trouvé,
 * jamais sur un identifiant qu'on nous soumettrait à côté. **C'est aussi ce qui
 * refuse l'activité d'un autre accompagnement sans qu'un contrôle s'ajoute** :
 * le droit est interrogé sur le projet de l'activité reçue, si bien qu'une
 * activité d'ailleurs se juge sur le projet d'ailleurs, où l'on n'écrit pas.
 *
 * Un refus ici est **muet** : ni redirection, ni message. Ces trois actions ne
 * s'atteignent en usage normal que par un bouton que l'écran n'affiche que
 * lorsque le geste est légal — le contrôle protège la requête forgée, pas un
 * parcours que l'interface est censée emprunter.
 *
 * **Seconde adresse de la lecture seule** (T4bis.3) : un projet archivé ferme la
 * transition, l'annulation et l'archivage d'une activité comme il ferme le
 * formulaire complet. Le refus y est muet, comme les autres refus de cette porte
 * — la roadmap d'un accompagnement archivé n'affiche plus aucun de ces gestes.
 *
 * **Une activité déjà archivée est refusée d'entrée**, et T4bis.4 s'en repose :
 * l'archivage n'a donc aucun contrôle d'idempotence à écrire, et `archive()`
 * ne toucherait de toute façon rien (son filtre porte `is null`).
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
 * court (`docs/03` §4). Le champ reste `required` en HTML ; les vérifications
 * ci-dessous sont un second filet, pour la requête qui l'aurait contourné.
 *
 * **Son refus n'est plus muet, et c'est le geste qui a changé de place.** Tant
 * que le motif se saisissait dans un `<details>` au milieu de la pile des autres
 * gestes de l'entrée de roadmap, il n'y avait ni saisie à rendre ni endroit où
 * dire quoi que ce soit : ne rien faire était la seule réponse possible. Le
 * geste vit désormais dans un `ConfirmPanel` — un panneau ouvert par
 * `?annuler=<id>`, qui **a** un endroit pour un message et dont c'est la raison
 * d'être d'être client (`useActionState`). Un panneau qui se contenterait de ne
 * rien faire laisserait quelqu'un devant un écran muet.
 *
 * Elle rejoint donc `archiveProject` dans sa forme — `(id, état, saisie)` vers
 * un `ConfirmState` — et quitte `transitionActivity` et `archiveActivity`, qui
 * restent des gestes sans écran et donc sans message.
 *
 * Les messages sont des constats, jamais des reproches. Ils ne distinguent pas
 * le droit manquant de la ligne absente : cette distinction renseignerait sur ce
 * qui existe hors du domaine.
 *
 * En succès, `redirect` referme le panneau en ramenant à la page nue — la
 * mécanique d'`archiveProject`, à ceci près que la roadmap a bougé et que
 * `refresh` l'a déjà revalidée.
 */
export async function cancelActivity(
  activityId: string,
  _previous: ConfirmState,
  formData: FormData,
): Promise<ConfirmState> {
  const session = await requireSession();

  const gate = await openActivity(session, activityId);
  if (!gate) {
    return { message: "Cette activité ne peut pas être annulée." };
  }
  const { activity, project } = gate;

  if (!canTransitionActivity(activity.state, "cancelled")) {
    return {
      message:
        "Seule une activité prévue, à planifier ou en cours peut être annulée.",
    };
  }

  const reason = readCancellationReason(formData);
  const invalid = validateCancellationReason(reason);
  if (invalid) return { message: invalid };

  await session.db.update(activities, activityId, {
    state: "cancelled",
    cancellationReason: reason,
  });

  refresh(activity.projectId, project.productId);
  /* **Le panneau se referme sur ce succès, et non plus sur une navigation**
     (TD.2). `redirect` était la fermeture ; elle ne peut plus l'être sans
     re-rendre la page que le panneau n'a justement plus à quitter.
     `revalidatePath` reste, et la réponse de l'action porte l'arbre
     réactualisé : ce qui a été écrit paraît dans son bloc, et c'est toute la
     confirmation (`docs/06` §9). */
  return { ok: true };
}

/* ==========================================================================
   Archiver une saisie — T4bis.4

   **Deux gestes, deux sens, et ils ne se remplacent pas.** L'annulation de
   T3.5 dit « cette activité ne se fera pas » et la garde au récit, dans le
   cinquième groupe de la roadmap ; l'archivage dit « elle n'aurait pas dû être
   saisie » et l'en sort. `docs/03` §4 ne connaît que le premier — une activité
   saisie par erreur n'avait, jusqu'ici, aucun chemin.

   Le droit est `writeProject` (D9), comme la saisie : ce qu'on a le droit
   d'écrire, on a le droit de le retirer. Ni confirmation (arbitrage (c)) ni
   motif — l'annulation en demande un parce qu'elle raconte quelque chose, une
   saisie erronée n'a rien à dire.
   ========================================================================== */

/**
 * Archiver une activité saisie par erreur : elle quitte la roadmap, rien n'est
 * supprimé (règle 4).
 *
 * **Aucun rétablissement** — arbitrage (b) : une activité se **ressaisit** en
 * moins d'une minute plutôt qu'elle ne se rétablit, et lui inventer un écran des
 * éléments archivés serait un septième écran pour un geste rare.
 *
 * **Un résultat vivant s'oppose au rangement.** Il resterait accroché à une
 * activité sortie du récit. Le résultat se retire d'abord — **et depuis T4bis.6
 * il y a un geste pour cela** : « Archiver le résultat » sur la même entrée de
 * roadmap, après quoi « Archiver la saisie » reparaît. L'entrée n'offre jamais
 * les deux à la fois, la même donnée décidant du lien et de l'action. `count`
 * écarte les archivés d'elle-même : c'est bien un résultat **vivant** qui
 * refuse, pas un déjà rangé — et c'est ce qui rend ce chemin praticable, là où
 * l'ancienne unicité totale laissait le résultat rangé bloquer la ressaisie.
 *
 * **Le refus est muet**, comme `transitionActivity` et `cancelActivity` : ce
 * geste n'a aucune saisie à rendre, et rien ne justifie de lui inventer un
 * message que l'écran n'atteint jamais en usage normal.
 *
 * **`last_activity_at` n'est pas recalculé ici** : `archive()` le fait dans le
 * même `batch` que la pose d'`archived_at`, une activité archivée sortant du
 * calcul. `refresh` revalide donc les quatre écrans, dont la liste des produits
 * et la page du produit, toutes deux porteuses de cette fraîcheur.
 */
export async function archiveActivity(activityId: string): Promise<void> {
  const session = await requireSession();

  const gate = await openActivity(session, activityId);
  if (!gate) return;
  const { activity, project } = gate;

  const attached = await session.db.count(results, {
    where: eq(results.activityId, activityId),
  });
  if (attached > 0) return;

  await session.db.archive(activities, activityId);

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
 * La ressource reçue, rapprochée de **ce** projet — la troisième porte du
 * fichier (T4bis.5), sur le modèle d'`openProject` et d'`openActivity`.
 *
 * Deux contrôles, et chacun ferme une porte :
 *
 * 1. `openProject` sur le `projectId` **reçu** — le droit `writeProject` (D9),
 *    l'appartenance au domaine, et la lecture seule d'un accompagnement archivé,
 *    d'un seul appel ;
 * 2. la ressource reçue **appartient à ce projet** et n'est pas déjà archivée.
 *    Sans ce second contrôle, une soumission forgée corrigerait ou retirerait la
 *    ressource d'un autre accompagnement — les identifiants liés sont sérialisés
 *    en clair dans un champ `$ACTION_…`, et une soumission peut les réécrire.
 *
 * Les deux refus se ressemblent volontairement : l'écran ne distingue pas la
 * ressource inconnue de celle d'un autre domaine, pour la même raison que la
 * page projet rend 404 dans les deux cas.
 *
 * Le message n'est utilisé que par `updateResource` : `archiveResource` refuse
 * en silence, n'ayant aucune saisie à rendre.
 */
async function openResource(
  session: Session,
  projectId: string,
  resourceId: string,
  refused: string,
): Promise<
  | { project: Row<typeof projects>; resource: Row<typeof resources> }
  | { message: string }
> {
  const gate = await openProject(session, projectId, refused);
  if ("message" in gate) return gate;

  const resource = await session.db.find(resources, resourceId);
  if (
    !resource ||
    resource.projectId !== projectId ||
    resource.archivedAt !== null
  ) {
    return { message: "Cette ressource n'existe plus dans cet accompagnement." };
  }

  return { project: gate.project, resource };
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
 * **`keptActivityId` est l'exception nominative de T4bis.1, transposée ici**
 * (T4bis.5). Une ressource dont l'activité a été archivée **depuis** la garde
 * sélectionnée dans le panneau : la refuser à la re-soumission rendrait toute
 * correction impossible sans changer le rattachement, ce qui est précisément la
 * perte que ce ticket vient éviter. L'exception est **nominative** — elle
 * n'accepte que la valeur déjà portée par la ligne éditée, et n'ouvre la porte à
 * aucune autre archivée. `createResource` ne passe rien : une création n'a
 * aucune valeur antérieure à préserver.
 *
 * Un message de champ, jamais une exception : `assertPreconditions` reste le
 * second filet, pas le premier.
 */
async function checkResourceActivity(
  session: Session,
  projectId: string,
  input: ResourceRowInput,
  keptActivityId: string | null = null,
): Promise<ResourceFormErrors> {
  if (!input.activityId) return {};

  const activity = await session.db.find(activities, input.activityId);
  if (
    !activity ||
    activity.projectId !== projectId ||
    (activity.archivedAt !== null && activity.id !== keptActivityId)
  ) {
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

  /* **Le panneau se referme sur ce succès, et non plus sur une navigation**
     (TD.2). `redirect` était la fermeture ; elle ne peut plus l'être sans
     re-rendre la page que le panneau n'a justement plus à quitter.
     `revalidatePath` reste, et la réponse de l'action porte l'arbre
     réactualisé : ce qui a été écrit paraît dans son bloc, et c'est toute la
     confirmation (`docs/06` §9). */
  return { values, errors: {}, ok: true };
}

/* ==========================================================================
   Corriger et retirer une ressource — T4bis.5

   La ressource était, avec le résultat, **le premier objet de Vision sans
   chemin de correction** : C4 n'écrivait que la création (arbitrage (a) de
   `tickets-C4.md`, qui renvoyait explicitement ici). Un lien mal collé — mauvais
   titre, mauvaise adresse, mauvais rattachement — n'avait aucun geste.

   Les deux actions partagent `openResource` et ne se distinguent que par ce
   qu'elles font d'un refus : la correction le **rend**, le retrait se tait.
   ========================================================================== */

/**
 * Corriger une ressource déjà reliée : **le même formulaire, la même
 * validation, les mêmes refus** qu'à la création — la propriété qui fait qu'un
 * seul panneau sert les deux gestes.
 *
 * `projectId` et `resourceId` sont liés côté serveur, comme `updateActivity`
 * depuis T3.4. **Ce ne sont pas des secrets** : Next les sérialise en clair dans
 * un champ `$ACTION_…`, et une soumission peut les réécrire. Ce qui protège est
 * `openResource`, qui interroge le droit sur le projet **reçu** puis rapproche
 * la ressource **reçue** de ce projet.
 *
 * **Aucun contrôle d'idempotence** à la `activityRowUnchanged` de T3.4 : il
 * existe là-bas pour ne pas repousser une fraîcheur ni écrire au journal de C6
 * une modification qui n'en est pas une. Ici `last_activity_at` n'est pas en
 * jeu — corriger une ressource n'est pas une activité — et l'inventer sortirait
 * du périmètre du ticket (règle 3).
 *
 * **Aucune requête sortante vers l'adresse saisie**, pas plus qu'à la création :
 * elle est enregistrée telle qu'elle a été tapée, une fois son schéma vérifié.
 */
export async function updateResource(
  projectId: string,
  resourceId: string,
  _previous: ResourceFormState,
  formData: FormData,
): Promise<ResourceFormState> {
  const session = await requireSession();

  const gate = await openResource(
    session,
    projectId,
    resourceId,
    "La modification d'une ressource est réservée au responsable de domaine et aux contributeurs désignés de cet accompagnement.",
  );
  if ("message" in gate) return resourceRefusal(formData, gate.message);

  const { values, errors, input } = parseResourceForm(formData);
  if (!input) return { values, errors };

  /* L'exception nominative : l'activité que la ressource porte **déjà** est
     acceptée même archivée, et elle seule. Le panneau la garde sélectionnée
     sans la proposer ; sans cette ligne, une re-soumission à l'identique serait
     refusée. */
  const misplaced = await checkResourceActivity(
    session,
    projectId,
    input,
    gate.resource.activityId,
  );
  if (Object.keys(misplaced).length > 0) return { values, errors: misplaced };

  try {
    const updated = await session.db.update(resources, resourceId, input);
    if (!updated) {
      return resourceRefusal(
        formData,
        "Cette ressource n'existe plus dans cet accompagnement.",
      );
    }
  } catch (error) {
    if (error instanceof DomainScopeError) {
      return resourceRefusal(
        formData,
        "Une référence de ce formulaire n'appartient pas au domaine : la saisie n'a pas été enregistrée.",
      );
    }
    throw error;
  }

  // Cette page-là, et elle seule — la raison de `createResource` : corriger une
  // ressource n'est pas écrire une activité, et `last_activity_at` n'a pas bougé.
  revalidatePath(ROUTES.project(projectId));

  /* **Le panneau se referme sur ce succès, et non plus sur une navigation**
     (TD.2). `redirect` était la fermeture ; elle ne peut plus l'être sans
     re-rendre la page que le panneau n'a justement plus à quitter.
     `revalidatePath` reste, et la réponse de l'action porte l'arbre
     réactualisé : ce qui a été écrit paraît dans son bloc, et c'est toute la
     confirmation (`docs/06` §9). */
  return { values, errors: {}, ok: true };
}

/**
 * Retirer une ressource du bloc : elle s'archive, rien n'est supprimé (règle 4).
 *
 * **Sans confirmation** — arbitrage (c) de `tickets-C4bis.md` : la confirmation
 * se justifie là où le geste retire de la lecture tout un ensemble, un produit
 * et ses accompagnements, un accompagnement et sa roadmap. Retirer un lien mal
 * collé est au contraire le geste qu'on veut rapide, et `docs/06` §9 proscrit la
 * confirmation partout où elle ne protège rien.
 *
 * **Aucun rétablissement** — arbitrage (b) : une ressource se **ressaisit** en
 * moins d'une minute, un titre et une adresse.
 *
 * **Le refus est muet**, comme `archiveActivity` : ce geste n'a aucune saisie à
 * rendre, et rien ne justifie de lui inventer un message que l'écran n'atteint
 * jamais en usage normal.
 *
 * **Aucun recalcul de `last_activity_at`** : `resources` n'est pas `activities`,
 * `archive()` ne déclenche donc aucun `batch` de recalcul, et la revalidation
 * s'en tient à cette page — retirer un lien n'a rien changé à la fraîcheur du
 * produit.
 */
export async function archiveResource(
  projectId: string,
  resourceId: string,
): Promise<void> {
  const session = await requireSession();

  const gate = await openResource(
    session,
    projectId,
    resourceId,
    // Jamais rendu : ce geste n'affiche aucun refus.
    "Le retrait d'une ressource est réservé au responsable de domaine et aux contributeurs désignés de cet accompagnement.",
  );
  if ("message" in gate) return;

  await session.db.archive(resources, resourceId);

  revalidatePath(ROUTES.project(projectId));
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
 * 3. **aucun résultat vivant n'y est déjà posé** — `results_activity_unique`
 *    n'en autorise qu'un, et depuis T4bis.6 il ne compte que les vivants. Sans
 *    ce contrôle, la seconde saisie ne serait pas refusée mais **plantée** :
 *    une violation d'unicité est une exception PostgreSQL, donc un 500, là où
 *    l'on attend un message.
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

  /* **`includeArchived` a disparu ici, et c'est la migration de T4bis.6 qui
     l'exige.** T4.4 l'avait écrit pour épouser `results_activity_unique`, qui
     portait sur `activity_id` seul et ignorait `archived_at` : une ligne
     archivée bloquait l'insertion sans que la lecture par défaut la voie, et le
     contrôle devait donc voir ce que la contrainte voyait. L'index est
     désormais **partiel** — `where archived_at is null` —, si bien que le
     défaut de `list` dit exactement ce qu'il interdit. Le laisser interdirait
     la ressaisie que la migration vient d'autoriser : les deux se relisent
     ensemble, jamais l'un sans l'autre. */
  const existing = await session.db.list(results, {
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

  /* **Le panneau se referme sur ce succès, et non plus sur une navigation**
     (TD.2). `redirect` était la fermeture ; elle ne peut plus l'être sans
     re-rendre la page que le panneau n'a justement plus à quitter.
     `revalidatePath` reste, et la réponse de l'action porte l'arbre
     réactualisé : ce qui a été écrit paraît dans son bloc, et c'est toute la
     confirmation (`docs/06` §9). */
  return { values, errors: {}, ok: true };
}

/* ==========================================================================
   Corriger et retirer un résultat — T4bis.6

   L'autre moitié du manque (4), et le dernier objet de Vision sans chemin de
   correction. Le ticket porte aussi **la première migration depuis T1.2** :
   `results_activity_unique` est devenu un index **partiel**, sans quoi retirer
   un résultat ne libérait pas son activité et la ressaisie levait une exception
   PostgreSQL. Le contrôle d'unicité de `checkResultActivity` s'est relu avec
   elle, ci-dessus.

   Les deux actions partagent `openResult` et ne se distinguent que par ce
   qu'elles font d'un refus : la correction le **rend**, le retrait se tait —
   la forme exacte de T4bis.5.
   ========================================================================== */

/**
 * Le résultat reçu, rapproché de l'activité reçue, elle-même rapprochée de ce
 * projet — la **quatrième porte** du fichier, sur le modèle d'`openResource`.
 *
 * Trois contrôles, et chacun ferme une porte :
 *
 * 1. `openProject` sur le `projectId` **reçu** — le droit `writeProject` (D9),
 *    l'appartenance au domaine, et la lecture seule d'un accompagnement
 *    archivé, d'un seul appel ;
 * 2. l'activité reçue **appartient à ce projet** et n'est pas archivée ;
 * 3. le résultat reçu **appartient à cette activité** et n'est pas déjà
 *    archivé.
 *
 * **Les trois sont nécessaires, et le troisième n'est pas redondant.**
 * `results` n'a pas de `project_id` : sans le second contrôle, l'activité ne
 * dirait rien du projet ; sans le troisième, une soumission forgée corrigerait
 * ou retirerait le résultat d'une autre activité du même accompagnement. Les
 * identifiants liés sont sérialisés en clair dans un champ `$ACTION_…`, et une
 * soumission peut les réécrire.
 *
 * Les deux derniers refus se ressemblent volontairement : l'écran ne distingue
 * pas le résultat inconnu de celui d'ailleurs, pour la même raison que la page
 * projet rend 404 dans les deux cas.
 *
 * **Aucun contrôle sur l'état de l'activité ici.** Un résultat ne s'écrit que
 * sur une activité terminée — `assertPreconditions` en reste la seule autorité
 * (T4.4) —, mais une période corrigée peut redériver l'état d'une activité qui
 * porte déjà le sien (`resolveActivityPeriod`, T3.4). Exiger `done` pour
 * corriger rendrait alors ce résultat intouchable : on ne peut pas retirer ce
 * qu'on n'a plus le droit d'atteindre.
 *
 * Le message n'est utilisé que par `updateResult` : `archiveResult` refuse en
 * silence, n'ayant aucune saisie à rendre.
 */
async function openResult(
  session: Session,
  projectId: string,
  activityId: string,
  resultId: string,
  refused: string,
): Promise<
  | {
      project: Row<typeof projects>;
      activity: Row<typeof activities>;
      result: Row<typeof results>;
    }
  | { message: string }
> {
  const gate = await openProject(session, projectId, refused);
  if ("message" in gate) return gate;

  const activity = await session.db.find(activities, activityId);
  if (
    !activity ||
    activity.projectId !== projectId ||
    activity.archivedAt !== null
  ) {
    return { message: "Cette activité n'existe plus dans cet accompagnement." };
  }

  const result = await session.db.find(results, resultId);
  if (
    !result ||
    result.activityId !== activityId ||
    result.archivedAt !== null
  ) {
    return { message: "Ce résultat n'existe plus sur cette activité." };
  }

  return { project: gate.project, activity, result };
}

/**
 * Corriger un résultat déjà reporté : **le même formulaire, la même validation,
 * les mêmes refus** qu'à la saisie — la propriété qui fait qu'un seul panneau
 * sert les deux gestes.
 *
 * `projectId`, `activityId` et `resultId` sont liés côté serveur. **Ce ne sont
 * pas des secrets** : Next les sérialise en clair dans un champ `$ACTION_…`, et
 * une soumission peut les réécrire. Ce qui protège est `openResult`.
 *
 * **L'activité ne se corrige pas ici** : `results.activity_id` n'est pas un
 * champ du formulaire et ne le devient pas. Déplacer un résultat d'une activité
 * à l'autre serait un geste que la fiche ne demande pas — et un résultat mal
 * placé se retire et se ressaisit, ce que ce ticket rend possible pour la
 * première fois.
 *
 * **Aucun contrôle d'idempotence** à la `activityRowUnchanged` de T3.4, pour la
 * raison d'`updateResource` : `last_activity_at` n'est pas en jeu — corriger un
 * résultat n'est pas écrire une activité.
 *
 * **Aucune requête sortante**, ni vers l'adresse saisie ni vers l'outil : le POC
 * s'en tient au niveau 1 déclaratif (D15).
 */
export async function updateResult(
  projectId: string,
  activityId: string,
  resultId: string,
  _previous: ResultFormState,
  formData: FormData,
): Promise<ResultFormState> {
  const session = await requireSession();

  const gate = await openResult(
    session,
    projectId,
    activityId,
    resultId,
    "La correction d'un résultat est réservée au responsable de domaine et aux contributeurs désignés de cet accompagnement.",
  );
  if ("message" in gate) return resultRefusal(formData, gate.message);

  const { values, errors, input } = parseResultForm(formData);
  if (!input) return { values, errors };

  /* L'outil reçu, rapproché du domaine — le contrôle de `createResult`, repris
     tel quel. `find` rend aussi les lignes archivées, et c'est ce qui fait
     passer l'**exception nominative** sans une ligne de plus : l'outil qu'un
     résultat porte déjà reste sélectionné dans le panneau, et une re-soumission
     à l'identique doit continuer de l'accepter. Ce qu'on ne propose plus, on
     continue de l'accepter. */
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
    const updated = await session.db.update(results, resultId, input);
    if (!updated) {
      return resultRefusal(
        formData,
        "Ce résultat n'existe plus sur cette activité.",
      );
    }
  } catch (error) {
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

  // Cette page-là, et elle seule — la raison de `createResult` : corriger un
  // résultat n'est pas écrire une activité, et `last_activity_at` n'a pas bougé.
  revalidatePath(ROUTES.project(projectId));

  /* **Le panneau se referme sur ce succès, et non plus sur une navigation**
     (TD.2). `redirect` était la fermeture ; elle ne peut plus l'être sans
     re-rendre la page que le panneau n'a justement plus à quitter.
     `revalidatePath` reste, et la réponse de l'action porte l'arbre
     réactualisé : ce qui a été écrit paraît dans son bloc, et c'est toute la
     confirmation (`docs/06` §9). */
  return { values, errors: {}, ok: true };
}

/**
 * Retirer un résultat de son entrée de roadmap : il s'archive, rien n'est
 * supprimé (règle 4).
 *
 * **C'est le geste que la migration de ce ticket rend enfin réversible.** Avant
 * elle, un résultat archivé occupait toujours la place de son activité et
 * aucune ressaisie n'était possible ; l'index partiel libère l'activité au
 * moment où le résultat est rangé. C'est pourquoi ce geste-ci n'a pas besoin de
 * rétablissement — arbitrage (b) : un résultat se **ressaisit**, un libellé,
 * une valeur et une date.
 *
 * **Sans confirmation** — arbitrage (c) : elle se justifie là où le geste retire
 * de la lecture tout un ensemble, et `docs/06` §9 la proscrit partout où elle ne
 * protège rien.
 *
 * **Le refus est muet**, comme `archiveResource` : ce geste n'a aucune saisie à
 * rendre.
 *
 * **Aucun recalcul de `last_activity_at`** : `results` n'est pas `activities`,
 * `archive()` ne déclenche donc aucun `batch` de recalcul, et la revalidation
 * s'en tient à cette page — retirer un résultat n'a rien changé à la fraîcheur
 * du produit.
 *
 * **Conséquence à connaître** : l'entrée de roadmap retrouve « Archiver la
 * saisie », qu'`archiveActivity` refusait tant qu'un résultat vivant y pendait.
 * Le chemin « retirer le résultat, puis archiver l'activité » que T4bis.4
 * annonçait est ouvert par ce geste, sans qu'une ligne y soit écrite pour lui.
 */
export async function archiveResult(
  projectId: string,
  activityId: string,
  resultId: string,
): Promise<void> {
  const session = await requireSession();

  const gate = await openResult(
    session,
    projectId,
    activityId,
    resultId,
    // Jamais rendu : ce geste n'affiche aucun refus.
    "Le retrait d'un résultat est réservé au responsable de domaine et aux contributeurs désignés de cet accompagnement.",
  );
  if ("message" in gate) return;

  await session.db.archive(results, resultId);

  revalidatePath(ROUTES.project(projectId));
}

/* ==========================================================================
   Adopter, corriger et retirer une adoption — T5.4

   `project_indicators` relie l'accompagnement à son effet supposé (`docs/04`
   §3). Trois gestes, une seule porte de plus — `openAdoption` —, et **aucune
   condition de droit qui s'ajoute** : le `canWrite` de la page et l'`openProject`
   des actions gouvernent ces trois écritures comme les sept précédentes.

   Le retrait passe par `unlink` et non par `archive` (arbitrage (f)) : une
   adoption est une **liaison**, `project_indicators` ne porte pas
   `archived_at`, et `LinkTable` l'impose à la compilation. Rien de la mémoire du
   centre ne s'y perd — les relevés vivent sur l'indicateur, pas sur l'adoption.
   ========================================================================== */

/**
 * Un refus qui n'appartient à aucun champ — jumeau de `resourceRefusal`.
 *
 * La saisie revient telle quelle : Vision ne jette jamais en silence ce qui a
 * été tapé, y compris quand ce qu'elle refuse n'est pas la saisie.
 */
function adoptionRefusal(
  formData: FormData,
  message: string,
): AdoptionFormState {
  return { values: readAdoptionForm(formData), errors: {}, message };
}

/**
 * L'adoption reçue, rapprochée de **ce** projet — la quatrième porte du fichier,
 * sur le modèle exact d'`openResource`.
 *
 * Deux contrôles, et chacun ferme une porte :
 *
 * 1. `openProject` sur le `projectId` **reçu** — le droit `writeProject` (D9),
 *    l'appartenance au domaine, et la lecture seule d'un accompagnement archivé,
 *    d'un seul appel ;
 * 2. l'adoption reçue **appartient à ce projet**. Sans ce second contrôle, une
 *    soumission forgée corrigerait ou retirerait l'adoption d'un autre
 *    accompagnement — les identifiants liés sont sérialisés en clair dans un
 *    champ `$ACTION_…`, et une soumission peut les réécrire.
 *
 * **Aucun contrôle d'archivage sur l'adoption** : `project_indicators` n'a pas
 * de colonne `archived_at`, et c'est le fond de l'arbitrage (f) — une liaison ne
 * s'archive pas, elle se défait.
 *
 * Le message n'est utilisé que par `updateAdoption` : `removeAdoption` refuse en
 * silence, n'ayant aucune saisie à rendre.
 */
async function openAdoption(
  session: Session,
  projectId: string,
  adoptionId: string,
  refused: string,
): Promise<
  | { project: Row<typeof projects>; adoption: Row<typeof projectIndicators> }
  | { message: string }
> {
  const gate = await openProject(session, projectId, refused);
  if ("message" in gate) return gate;

  const adoption = await session.db.find(projectIndicators, adoptionId);
  if (!adoption || adoption.projectId !== projectId) {
    return {
      message: "Cette adoption n'existe plus dans cet accompagnement.",
    };
  }

  return { project: gate.project, adoption };
}

/**
 * L'indicateur reçu, rapproché du **produit de ce projet**.
 *
 * D11 pose qu'un indicateur appartient à un seul produit : un indicateur d'un
 * autre produit n'est pas adoptable, et le vérifier ici est la seule façon de
 * l'empêcher — `assertPreconditions` ne connaît que le domaine, et le domaine
 * est le même. Sans ce contrôle, une soumission forgée ferait apparaître dans ce
 * bloc un indicateur que la page du produit n'affiche pas, et le bloc
 * afficherait fidèlement ce mensonge.
 *
 * Un indicateur **archivé** est refusé pour la raison de `checkResourceActivity`
 * : le panneau ne le propose pas, et rien ne justifie de l'accepter par requête.
 *
 * **`keptIndicatorId` est l'exception nominative** (T4bis.1, T4bis.5, T4bis.6).
 * Elle n'a rien à voir avec l'unicité, qui se traite plus bas : elle ne concerne
 * que l'archivage. Une adoption dont l'indicateur a été archivé **avant** que
 * l'arbitrage (e) ne l'interdise garde son indicateur sélectionné dans le
 * panneau ; le refuser à la re-soumission rendrait toute correction impossible
 * sans changer d'indicateur. L'exception est **nominative** — elle n'accepte que
 * la valeur déjà portée par la ligne éditée, et n'ouvre la porte à aucun autre
 * archivé. `createAdoption` ne passe rien : une création n'a aucune valeur
 * antérieure à préserver.
 *
 * Un message de champ, jamais une exception.
 */
async function checkAdoptionIndicator(
  session: Session,
  productId: string,
  input: AdoptionRowInput,
  keptIndicatorId: string | null = null,
): Promise<AdoptionFormErrors> {
  const indicator = await session.db.find(indicators, input.indicatorId);
  if (
    !indicator ||
    indicator.productId !== productId ||
    (indicator.archivedAt !== null && indicator.id !== keptIndicatorId)
  ) {
    return { indicatorId: "Cet indicateur n'existe pas sur ce produit." };
  }

  return {};
}

/**
 * L'unicité `(projet, indicateur)`, **devancée plutôt que subie**.
 *
 * `project_indicators_project_indicator_unique` est une contrainte **totale** —
 * la table n'a pas d'`archived_at`, donc rien à rendre partiel (T4bis.6). Une
 * seconde adoption du même indicateur lèverait une violation d'unicité
 * PostgreSQL, donc un 500, là où l'on attend un message : ce qui se refuse doit
 * se lire, pas se planter.
 *
 * `exceptAdoptionId` est la correction : une adoption qui garde son propre
 * indicateur ne se heurte pas à elle-même.
 */
async function checkAdoptionUnique(
  session: Session,
  projectId: string,
  indicatorId: string,
  exceptAdoptionId: string | null = null,
): Promise<AdoptionFormErrors> {
  const held = await session.db.list(projectIndicators, {
    where: and(
      eq(projectIndicators.projectId, projectId),
      eq(projectIndicators.indicatorId, indicatorId),
    ),
  });

  const clash = held.some((row) => row.id !== exceptAdoptionId);
  if (clash) {
    return {
      indicatorId: "Cet accompagnement adopte déjà cet indicateur.",
    };
  }

  return {};
}

/**
 * Les deux écrans que cette écriture change.
 *
 * La page du **produit** en fait partie depuis T5.4 : son bloc « Indicateurs »
 * dit combien d'accompagnements adoptent chaque indicateur, et c'est ce
 * décompte qui gouverne le geste « Archiver ». Adopter ou retirer le déplace.
 *
 * Ce n'est **pas** `refresh` : `last_activity_at` n'a pas bougé — une adoption
 * n'est pas un fait d'accompagnement —, et revalider la liste des projets ferait
 * croire le contraire au lecteur de ce fichier (la leçon de T4.2).
 */
function refreshAdoption(projectId: string, productId: string): void {
  revalidatePath(ROUTES.project(projectId));
  revalidatePath(ROUTES.product(productId));
}

/**
 * Adopter un indicateur du produit pour cet accompagnement.
 *
 * `projectId` est lié côté serveur ; `previous` est l'état que `useActionState`
 * fait circuler, dont l'action n'a pas besoin — la saisie repart du `FormData`
 * à chaque soumission.
 *
 * **Aucune adoption automatique**, aucune suggestion, aucune reprise de
 * l'adoption d'un accompagnement précédent : le geste est déclaratif, et ce
 * qu'il déclare est un choix.
 */
export async function createAdoption(
  projectId: string,
  _previous: AdoptionFormState,
  formData: FormData,
): Promise<AdoptionFormState> {
  const session = await requireSession();

  const gate = await openProject(
    session,
    projectId,
    "L'adoption d'un indicateur est réservée au responsable de domaine et aux contributeurs désignés de cet accompagnement.",
  );
  if ("message" in gate) return adoptionRefusal(formData, gate.message);

  const { values, errors, input } = parseAdoptionForm(formData);
  if (!input) return { values, errors };

  const misplaced = await checkAdoptionIndicator(
    session,
    gate.project.productId,
    input,
  );
  if (Object.keys(misplaced).length > 0) return { values, errors: misplaced };

  const held = await checkAdoptionUnique(session, projectId, input.indicatorId);
  if (Object.keys(held).length > 0) return { values, errors: held };

  try {
    await session.db.insert(projectIndicators, { projectId, ...input });
  } catch (error) {
    if (error instanceof DomainScopeError) {
      return adoptionRefusal(
        formData,
        "Une référence de ce formulaire n'appartient pas au domaine : la saisie n'a pas été enregistrée.",
      );
    }
    throw error;
  }

  refreshAdoption(projectId, gate.project.productId);

  /* **Le panneau se referme sur ce succès, et non plus sur une navigation**
     (TD.2). `redirect` était la fermeture ; elle ne peut plus l'être sans
     re-rendre la page que le panneau n'a justement plus à quitter.
     `revalidatePath` reste, et la réponse de l'action porte l'arbre
     réactualisé : ce qui a été écrit paraît dans son bloc, et c'est toute la
     confirmation (`docs/06` §9). */
  return { values, errors: {}, ok: true };
}

/**
 * Corriger une adoption : **le même formulaire, la même validation, les mêmes
 * refus** qu'à l'adoption — la propriété qui fait qu'un seul panneau sert les
 * deux gestes.
 *
 * `projectId` et `adoptionId` sont liés côté serveur. **Ce ne sont pas des
 * secrets** : Next les sérialise en clair dans un champ `$ACTION_…`, et une
 * soumission peut les réécrire. Ce qui protège est `openAdoption`, qui interroge
 * le droit sur le projet **reçu** puis rapproche l'adoption **reçue** de ce
 * projet.
 *
 * **L'indicateur peut changer** : corriger une adoption, c'est aussi s'être
 * trompé d'indicateur. Les trois contrôles valent alors comme à la création —
 * appartenance au produit, archivage, unicité —, l'adoption éditée exceptée
 * d'elle-même.
 */
export async function updateAdoption(
  projectId: string,
  adoptionId: string,
  _previous: AdoptionFormState,
  formData: FormData,
): Promise<AdoptionFormState> {
  const session = await requireSession();

  const gate = await openAdoption(
    session,
    projectId,
    adoptionId,
    "La modification d'une adoption est réservée au responsable de domaine et aux contributeurs désignés de cet accompagnement.",
  );
  if ("message" in gate) return adoptionRefusal(formData, gate.message);

  const { values, errors, input } = parseAdoptionForm(formData);
  if (!input) return { values, errors };

  /* L'exception nominative : l'indicateur que l'adoption porte **déjà** est
     accepté même archivé, et lui seul. Le panneau le garde sélectionné sans le
     proposer ; sans cette ligne, une re-soumission à l'identique serait
     refusée. */
  const misplaced = await checkAdoptionIndicator(
    session,
    gate.project.productId,
    input,
    gate.adoption.indicatorId,
  );
  if (Object.keys(misplaced).length > 0) return { values, errors: misplaced };

  const held = await checkAdoptionUnique(
    session,
    projectId,
    input.indicatorId,
    adoptionId,
  );
  if (Object.keys(held).length > 0) return { values, errors: held };

  try {
    const updated = await session.db.update(
      projectIndicators,
      adoptionId,
      input,
    );
    if (!updated) {
      return adoptionRefusal(
        formData,
        "Cette adoption n'existe plus dans cet accompagnement.",
      );
    }
  } catch (error) {
    if (error instanceof DomainScopeError) {
      return adoptionRefusal(
        formData,
        "Une référence de ce formulaire n'appartient pas au domaine : la saisie n'a pas été enregistrée.",
      );
    }
    throw error;
  }

  refreshAdoption(projectId, gate.project.productId);

  /* **Le panneau se referme sur ce succès, et non plus sur une navigation**
     (TD.2). `redirect` était la fermeture ; elle ne peut plus l'être sans
     re-rendre la page que le panneau n'a justement plus à quitter.
     `revalidatePath` reste, et la réponse de l'action porte l'arbre
     réactualisé : ce qui a été écrit paraît dans son bloc, et c'est toute la
     confirmation (`docs/06` §9). */
  return { values, errors: {}, ok: true };
}

/**
 * Retirer l'adoption : la liaison se **défait**, elle ne s'archive pas
 * (arbitrage (f)).
 *
 * **Ce n'est pas une entorse à la règle 4.** La règle protège la donnée métier ;
 * une adoption est un lien, et c'est l'arbitrage de fait de T1.2 — celui des
 * membres de projet et des participants d'activité, que `syncParticipants`
 * applique depuis T3.6. `LinkTable` le dit à la compilation : `archive` ne
 * compilerait pas sur cette table, `unlink` seul le peut. Rien de la mémoire du
 * centre ne s'y perd — les relevés vivent sur l'indicateur, et l'indicateur sur
 * le produit.
 *
 * **Sans confirmation** — arbitrage (c) de `tickets-C4bis.md` : elle se justifie
 * là où le geste retire de la lecture tout un ensemble, et `docs/06` §9 la
 * proscrit partout où elle ne protège rien. Retirer une adoption posée par
 * erreur est le geste qu'on veut rapide, et il se refait.
 *
 * **Le refus est muet**, comme `archiveResource` : ce geste n'a aucune saisie à
 * rendre, et rien ne justifie de lui inventer un message que l'écran n'atteint
 * jamais en usage normal.
 */
export async function removeAdoption(
  projectId: string,
  adoptionId: string,
): Promise<void> {
  const session = await requireSession();

  const gate = await openAdoption(
    session,
    projectId,
    adoptionId,
    // Jamais rendu : ce geste n'affiche aucun refus.
    "Le retrait d'une adoption est réservé au responsable de domaine et aux contributeurs désignés de cet accompagnement.",
  );
  if ("message" in gate) return;

  await session.db.unlink(projectIndicators, adoptionId);

  refreshAdoption(projectId, gate.project.productId);
}
