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
 * **Les écritures ajoutent ou corrigent ; trois retirent** (T4bis.4, T4bis.5,
 * T4bis.6). **Sans le compte** : la phrase disait « sept » quand elle a été
 * écrite, l'adoption et le lien déclaré l'ont dépassée, et T7.1 y ajoute le
 * budget — un nombre dans un commentaire vieillit à chaque ticket, et le geste
 * du dépôt est de le retirer (T6.1). `archiveActivity`, `archiveResource` et
 * `archiveResult` sont les seuls gestes de ce fichier qui sortent une ligne du
 * récit, et les seuls appelants d'`archive()` ici. Ils ne suppriment rien (règle 4) et ne cascadent
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
 *
 * **Onze de ces écritures laissent une trace depuis T6.2**, et c'est la seule
 * chose que ce ticket ajoute : cinq sur l'activité, trois sur la ressource,
 * trois sur le résultat. `session.db.record` est `insert(events, …)` avec
 * `actor_id` posé depuis le contexte ; **la décision de journaliser et la phrase
 * appartiennent à l'action**, seule à connaître le vocabulaire (arbitrage (a) de
 * `tickets-C6.md`). Le prix est nommé : un geste qui oublierait d'appeler
 * `record` ne laisserait pas de trace, et rien ne le signalerait.
 *
 * **Le journal ne redécide rien.** Chaque appel est posé **après** l'écriture
 * qu'il raconte et après la porte qui l'autorise : un refus n'a jamais de ligne
 * à écrire parce qu'il n'atteint jamais l'appel, et aucun contrôle n'a été
 * déplacé, dupliqué ni ajouté pour lui. La seule condition neuve de ce fichier
 * est celle d'`updateActivity`, et elle existait déjà sous un autre nom — c'est
 * celle qui décide de `refresh`.
 *
 * **`product_id` reste nul sur les onze** : le produit se déduit du projet, et
 * le figer serait faux le jour où l'accompagnement change de produit (D20).
 *
 * **Saisir le budget (T7.1)** est la dernière écriture de ce fichier, et la
 * seule qui ne soit ni tout à fait une création ni tout à fait une correction :
 * `budgets_project_unique` fait qu'un projet porte **au plus un** budget, si
 * bien que `saveProjectBudget` cherche la ligne **par le projet** et l'écrit ou
 * la récrit. Il n'y a donc ni identifiant à recevoir ni cible à rapprocher de la
 * page — et pas de porte de plus : `openProject` suffit, là où la ressource,
 * l'adoption et le lien en demandaient une seconde.
 *
 * **Elle ne laisse aucune trace au journal**, et c'est un arbitrage, pas un
 * oubli (arbitrage (d) de `tickets-C7.md`) : `budget` n'est pas l'un des six
 * `event_target_type`, et l'ouvrir pour un seul objet demanderait une migration
 * d'énuméré quand six autres objets écrivent déjà sans trace. Le point ouvert
 * d'`ETAT.md` se récrit avec un septième nom ; il ne se referme pas à moitié.
 * C'est la seule écriture de ce fichier dont l'absence de `record` soit voulue,
 * et elle est écrite ici pour qu'on ne la prenne pas pour un manque.
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
  budgets,
  indicators,
  projectIndicators,
  projectLinks,
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
  parseBudgetForm,
  readBudgetForm,
  type BudgetFormErrors,
  type BudgetFormState,
  type BudgetRowInput,
} from "@/lib/forms/budget";
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
  parseLinkForm,
  readLinkForm,
  type LinkFormErrors,
  type LinkFormState,
} from "@/lib/forms/link";
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
import { linkPhrase, objectPhrase, statePhrase } from "@/lib/journal";
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
 *
 * **Elle rend aussi le libellé du type** (T6.2) : une activité n'a pas de nom,
 * et c'est ce libellé que le journal fige comme désignation de ce qui a été
 * touché. La ligne est **déjà lue ici** ; la jeter puis la relire au point
 * d'appel serait une seconde lecture de la même ligne dans la même soumission,
 * donc une occasion de divergence. Il est vide quand le type est inconnu — le
 * cas où l'appelant rend ses erreurs et n'écrit rien.
 */
async function checkReferences(
  session: Session,
  input: ActivityRowInput,
): Promise<{ errors: ActivityFormErrors; typeLabel: string }> {
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

  return { errors, typeLabel: type?.label ?? "" };
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

  const { errors: unknown, typeLabel } = await checkReferences(session, input);
  if (Object.keys(unknown).length > 0) return { values, errors: unknown };

  try {
    const created = await session.db.insert(activities, { projectId, ...input });
    await syncParticipants(session, created.id, participantIds);

    /* **Une seule ligne, participants compris** — la forme de `createProject`
       en T6.1 : le journal est une trace de geste, pas de table, et une
       création n'a pas d'avant à comparer. Le `target_type` `member` reste ce
       que T6.1 en a fait, l'équipe du **projet** ; l'étendre aux participants
       d'une activité serait une règle neuve (règle 3). */
    await session.db.record({
      projectId,
      verb: "created",
      targetType: "activity",
      targetId: created.id,
      summary: objectPhrase("activity", "created", typeLabel),
    });
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

  const { errors: unknown, typeLabel } = await checkReferences(session, input);
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

    /* **La condition n'est pas neuve** : c'est exactement celle qui décide de
       `refresh` deux lignes plus bas. Ce que l'écran tient pour un changement,
       le journal le tient pour un geste — sans quoi un participant ajouté sans
       qu'une date bouge ne laisserait aucune trace. Ce que la fiche écarte est
       la « modification qui n'en est pas une », les deux gardes à faux.

       Le libellé figé est celui d'**après** le geste : un changement de type
       est une correction fréquente, et écrire l'ancien serait une « valeur
       avant », que D22 refuse. */
    if (rowChanged || participantsChanged) {
      await session.db.record({
        projectId,
        verb: "updated",
        targetType: "activity",
        targetId: activityId,
        summary: objectPhrase("activity", "updated", typeLabel),
      });
    }
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
 *
 * **Elle rend le libellé du type** (T6.2), comme `checkReferences` pour les deux
 * gestes de formulaire : c'est la désignation que le journal fige, une activité
 * n'ayant pas de nom. C'est **la seule lecture que ce ticket ajoute au
 * fichier**, et elle ne coûte que sur les trois gestes qui écrivent. Elle est
 * placée **après** les trois refus, jamais avant : on ne lit un libellé qu'une
 * fois établi qu'on a le droit d'y toucher.
 *
 * `find` rend les lignes archivées, et c'est voulu ici comme ailleurs : un type
 * archivé depuis reste la désignation de l'activité qui le porte. Le repli sur
 * la chaîne vide n'est atteignable par aucun chemin — `activity_type_id` est
 * `not null` et sa clé étrangère est scopée — mais une phrase **figée** ne doit
 * en aucun cas porter « undefined ».
 */
async function openActivity(
  session: Session,
  activityId: string,
): Promise<{
  activity: Row<typeof activities>;
  project: Row<typeof projects>;
  typeLabel: string;
} | null> {
  const activity = await session.db.find(activities, activityId);
  if (!activity || activity.archivedAt !== null) return null;
  if (!session.can.writeProject(activity.projectId)) return null;

  const project = await session.db.find(projects, activity.projectId);
  if (!project || project.archivedAt !== null) return null;

  const type = await session.db.find(activityTypes, activity.activityTypeId);

  return { activity, project, typeLabel: type?.label ?? "" };
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
  const { activity, project, typeLabel } = gate;

  if (!canTransitionActivity(activity.state, target)) return;
  if (target === "done" && activity.periodEnd === null) return;

  await session.db.update(activities, activityId, {
    state: target,
    ...(target === "in_progress" ? { isUnscheduled: false } : {}),
  });

  /* **Le verbe est `state_changed`**, le troisième de l'énuméré, et il n'a que
     deux appelants dans tout le produit — celui-ci et l'annulation.
     `canTransitionActivity` a déjà écarté les deux transitions qui ne font
     rien : rien n'est journalisé qui n'a pas eu lieu, et la garde qui le
     garantit est **au-dessus**, là où elle était déjà. */
  await session.db.record({
    projectId: activity.projectId,
    verb: "state_changed",
    targetType: "activity",
    targetId: activityId,
    summary: statePhrase(target, typeLabel),
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
  const { activity, project, typeLabel } = gate;

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

  /* **Le motif entre dans la phrase, et c'est la fiche qui l'exige** : une
     annulation dit quelque chose, là où l'archivage dit qu'une saisie n'aurait
     pas dû avoir lieu. Il est **figé** comme le libellé — il disparaîtrait de la
     trace le jour où l'activité serait corrigée. Il est déjà validé au-dessus :
     ce qui arrive ici a franchi `validateCancellationReason` et le `CHECK`
     `activities_cancelled_requires_reason`. */
  await session.db.record({
    projectId: activity.projectId,
    verb: "state_changed",
    targetType: "activity",
    targetId: activityId,
    summary: statePhrase("cancelled", typeLabel, reason),
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
  const { activity, project, typeLabel } = gate;

  const attached = await session.db.count(results, {
    where: eq(results.activityId, activityId),
  });
  if (attached > 0) return;

  await session.db.archive(activities, activityId);

  /* `openActivity` refuse d'entrée une activité déjà archivée : ce geste n'a
     aucun contrôle d'idempotence à écrire, et le journal n'en hérite aucun.
     C'est la propriété sur laquelle T4bis.4 se reposait déjà. */
  await session.db.record({
    projectId: activity.projectId,
    verb: "archived",
    targetType: "activity",
    targetId: activityId,
    summary: objectPhrase("activity", "archived", typeLabel),
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
    /* La ligne écrite est **retenue** depuis T6.2 : `target_id` la désigne, et
       elle n'existe qu'ici — une ressource ne se retrouve par aucune clé
       naturelle. */
    const created = await session.db.insert(resources, { projectId, ...input });

    await session.db.record({
      projectId,
      verb: "created",
      targetType: "resource",
      targetId: created.id,
      summary: objectPhrase("resource", "created", input.title),
    });
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

    /* Le titre figé est celui de la **ligne rendue par `update`**, jamais celui
       du `gate` : c'est le nom d'après le geste, et écrire celui d'avant serait
       une « valeur avant », que D22 refuse.

       **Aucun contrôle d'idempotence** n'est ajouté ici, pas plus que T4bis.5
       n'en avait posé : `activityRowUnchanged` existe pour `updateActivity`
       parce que la fraîcheur d'un produit en dépend, et l'inventer pour la
       ressource serait une règle neuve dans un ticket de trace (règle 3). */
    await session.db.record({
      projectId,
      verb: "updated",
      targetType: "resource",
      targetId: resourceId,
      summary: objectPhrase("resource", "updated", updated.title),
    });
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

  /* `openResource` refuse d'entrée une ressource déjà archivée : le geste ne
     s'exécute qu'une fois, et le journal n'a aucune garde à ajouter. */
  await session.db.record({
    projectId,
    verb: "archived",
    targetType: "resource",
    targetId: resourceId,
    summary: objectPhrase("resource", "archived", gate.resource.title),
  });

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
    const created = await session.db.insert(results, { activityId, ...input });

    /* `results` n'a **pas** de `project_id` — un résultat pend à l'activité qui
       l'a produite —, mais l'événement en porte un : c'est le projet **reçu**,
       celui qu'`openProject` vient d'autoriser et auquel `checkResultActivity`
       a rapproché l'activité. Sans lui, le résultat n'apparaîtrait dans la
       frise d'aucune page projet (T6.3). */
    await session.db.record({
      projectId,
      verb: "created",
      targetType: "result",
      targetId: created.id,
      summary: objectPhrase("result", "created", input.label),
    });
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

    // Le libellé figé est celui d'**après** le geste, comme `updateResource` :
    // celui d'avant serait une « valeur avant », que D22 refuse.
    await session.db.record({
      projectId,
      verb: "updated",
      targetType: "result",
      targetId: resultId,
      summary: objectPhrase("result", "updated", updated.label),
    });
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

  /* `openResult` refuse d'entrée un résultat déjà archivé : aucune garde
     d'idempotence à ajouter, ici pas plus qu'aux deux autres rangements. */
  await session.db.record({
    projectId,
    verb: "archived",
    targetType: "result",
    targetId: resultId,
    summary: objectPhrase("result", "archived", gate.result.label),
  });

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

/* ==========================================================================
   Les liens déclarés — T6.5

   Ce que le calcul ne peut pas voir. Les liens **déduits** ne s'écrivent nulle
   part (T6.4) ; ceux-ci s'écrivent, et c'est la seule table de liaison entre
   deux accompagnements du dépôt.

   **Le lien est orienté, et son droit ne l'est pas** (arbitrage (g) de
   `tickets-C6.md`) : `from_project_id` est le projet d'où l'on agit, et le
   droit exigé est `writeProject` sur **ce** projet, jamais sur les deux. Une
   règle de droit qui traverserait deux projets serait la première du dépôt, et
   D9 ne la porte pas. Conséquence assumée : un contributeur d'un seul des deux
   accompagnements pose un lien qui s'affiche sur l'autre.

   **La lecture est symétrique, l'écriture ne l'est pas.** Les deux pages
   portent la ligne ; seule celle d'où le lien part la retire — c'est
   `openLink` qui le tient, et lui seul.
   ========================================================================== */

function linkRefusal(formData: FormData, message: string): LinkFormState {
  return { values: readLinkForm(formData), errors: {}, message };
}

/**
 * Le lien reçu, rapproché de **ce** projet — la cinquième porte du fichier, sur
 * le modèle exact d'`openAdoption`.
 *
 * Deux contrôles, et chacun ferme une porte :
 *
 * 1. `openProject` sur le `projectId` **reçu** — le droit `writeProject` (D9),
 *    l'appartenance au domaine, et la lecture seule d'un accompagnement
 *    archivé, d'un seul appel ;
 * 2. le lien reçu **part de ce projet**. `fromProjectId` et non `toProjectId` :
 *    c'est l'asymétrie de l'arbitrage (g), et c'est ici qu'elle vit. Sans ce
 *    second contrôle, une soumission forgée corrigerait ou retirerait le lien
 *    d'un autre accompagnement — les identifiants liés sont sérialisés en clair
 *    dans un champ `$ACTION_…`, et une soumission peut les réécrire.
 *
 * **Aucun contrôle d'archivage sur le lien** : `project_links` n'a pas de
 * colonne `archived_at`, et c'est le fond de l'arbitrage (f) — une liaison ne
 * s'archive pas, elle se défait.
 *
 * Le message n'est utilisé que par `updateProjectLink` : `removeProjectLink`
 * refuse en silence, n'ayant aucune saisie à rendre.
 */
async function openLink(
  session: Session,
  projectId: string,
  linkId: string,
  refused: string,
): Promise<
  | { project: Row<typeof projects>; link: Row<typeof projectLinks> }
  | { message: string }
> {
  const gate = await openProject(session, projectId, refused);
  if ("message" in gate) return gate;

  const link = await session.db.find(projectLinks, linkId);
  if (!link || link.fromProjectId !== projectId) {
    return {
      message: "Ce lien n'a pas été déclaré depuis cet accompagnement.",
    };
  }

  return { project: gate.project, link };
}

/**
 * L'accompagnement visé, **confronté au domaine avant d'écrire**.
 *
 * `neon-http` n'a pas de transaction interactive : tout se vérifie avant. Trois
 * refus, et l'ordre est celui de la fiche — hors domaine, auto-lien, archivé —,
 * le doublon se traitant plus bas.
 *
 * **Les contraintes de base sont les secondes barrières, jamais les
 * premières.** `project_links_no_self_link` rendrait un 500 sur l'auto-lien, et
 * `DomainScopeError` une page en erreur sur un projet d'ailleurs : une
 * contrainte qui rend un 500 là où l'on attend un message n'a rien protégé.
 * Elles restent, et elles ne sont jamais atteintes.
 *
 * **Un projet archivé est refusé, et le forger n'y change rien** : le panneau
 * ne le propose pas (`listLinkableProjects`), et rien ne justifie de l'accepter
 * par requête — l'écran n'a jamais protégé le point d'entrée HTTP.
 *
 * **`keptProjectId` est l'exception nominative** (T4bis.1, T4bis.5, T4bis.6) :
 * le projet déjà visé par le lien que l'on corrige reste accepté même archivé
 * depuis, et lui seul. Sans elle, corriger la raison d'un lien vers un
 * accompagnement rangé depuis serait impossible sans changer de cible.
 * `createProjectLink` ne passe rien : une déclaration n'a aucune valeur
 * antérieure à préserver.
 *
 * **Elle rend aussi le nom du projet visé** — celui que le journal fige comme
 * désignation de ce qui a été relié. La ligne est **déjà lue ici** ; la jeter
 * puis la relire au point d'appel serait une seconde lecture de la même ligne
 * dans la même soumission, donc une occasion de divergence. Il est vide quand
 * le projet est refusé — le cas où l'appelant rend ses erreurs et n'écrit rien.
 */
async function checkLinkTarget(
  session: Session,
  projectId: string,
  toProjectId: string,
  keptProjectId: string | null = null,
): Promise<{ errors: LinkFormErrors; targetName: string }> {
  const target = await session.db.find(projects, toProjectId);

  if (!target) {
    return {
      errors: {
        toProjectId: "Cet accompagnement n'existe pas dans ce domaine.",
      },
      targetName: "",
    };
  }

  if (toProjectId === projectId) {
    return {
      errors: { toProjectId: "Un accompagnement ne se relie pas à lui-même." },
      targetName: "",
    };
  }

  if (target.archivedAt !== null && target.id !== keptProjectId) {
    return {
      errors: {
        toProjectId:
          "Cet accompagnement est archivé : il ne peut pas être relié.",
      },
      targetName: "",
    };
  }

  return { errors: {}, targetName: target.name };
}

/**
 * L'unicité `(from, to)`, **devancée plutôt que subie**.
 *
 * `project_links_from_to_unique` est une contrainte **totale** — la table n'a
 * pas d'`archived_at`, donc rien à rendre partiel. Une seconde déclaration du
 * même couple lèverait une violation d'unicité PostgreSQL, donc un 500, là où
 * l'on attend un message : ce qui se refuse doit se lire, pas se planter.
 *
 * **Le réciproque n'est pas un doublon.** La contrainte porte sur un couple
 * **orienté** : `A → B` et `B → A` coexistent, et c'est juste — ce sont deux
 * déclarations, chacune avec sa raison, faites depuis deux accompagnements. Y
 * ajouter un cinquième refus serait une règle que la fiche ne porte pas.
 *
 * `exceptLinkId` est la correction : un lien qui garde sa propre cible ne se
 * heurte pas à lui-même.
 */
async function checkLinkUnique(
  session: Session,
  projectId: string,
  toProjectId: string,
  exceptLinkId: string | null = null,
): Promise<LinkFormErrors> {
  const held = await session.db.list(projectLinks, {
    where: and(
      eq(projectLinks.fromProjectId, projectId),
      eq(projectLinks.toProjectId, toProjectId),
    ),
  });

  const clash = held.some((row) => row.id !== exceptLinkId);
  if (clash) {
    return { toProjectId: "Ce lien est déjà déclaré." };
  }

  return {};
}

/**
 * Les pages que cette écriture change — **les deux**, et c'est la conséquence
 * directe de la lecture symétrique : le lien paraît sur la page d'où il part
 * comme sur celle qu'il vise.
 *
 * Ce n'est **pas** `refresh` : `last_activity_at` n'a pas bougé — déclarer un
 * lien n'est pas un fait d'accompagnement —, et revalider la liste des projets
 * ou la page du produit ferait croire le contraire au lecteur de ce fichier (la
 * leçon de T4.2, reprise par `refreshAdoption`).
 *
 * Variadique parce qu'une correction peut changer de cible : l'ancienne page
 * doit perdre la ligne au même instant que la nouvelle la gagne. Le `Set`
 * évite de revalider deux fois la même adresse.
 */
function refreshLink(...projectIds: readonly string[]): void {
  for (const id of new Set(projectIds)) revalidatePath(ROUTES.project(id));
}

/**
 * Déclarer un lien vers un autre accompagnement.
 *
 * `projectId` est lié côté serveur ; `previous` est l'état que `useActionState`
 * fait circuler, dont l'action n'a pas besoin — la saisie repart du `FormData`
 * à chaque soumission.
 *
 * **Aucun lien créé automatiquement à partir d'une règle déduite** : les deux
 * natures ne se confondent pas. Un lien déclaré dit ce que le calcul ne voit
 * pas ; le dériver d'un calcul le viderait de son objet.
 */
export async function createProjectLink(
  projectId: string,
  _previous: LinkFormState,
  formData: FormData,
): Promise<LinkFormState> {
  const session = await requireSession();

  const gate = await openProject(
    session,
    projectId,
    "La déclaration d'un lien est réservée au responsable de domaine et aux contributeurs désignés de cet accompagnement.",
  );
  if ("message" in gate) return linkRefusal(formData, gate.message);

  const { values, errors, input } = parseLinkForm(formData);
  if (!input) return { values, errors };

  const target = await checkLinkTarget(session, projectId, input.toProjectId);
  if (Object.keys(target.errors).length > 0) {
    return { values, errors: target.errors };
  }

  const held = await checkLinkUnique(session, projectId, input.toProjectId);
  if (Object.keys(held).length > 0) return { values, errors: held };

  try {
    await session.db.insert(projectLinks, {
      fromProjectId: projectId,
      ...input,
    });
  } catch (error) {
    if (error instanceof DomainScopeError) {
      return linkRefusal(
        formData,
        "Une référence de ce formulaire n'appartient pas au domaine : la saisie n'a pas été enregistrée.",
      );
    }
    throw error;
  }

  /* **Le cinquième verbe de l'énuméré**, et le seul que T6.1 et T6.2 n'avaient
     pas posé sur son objet propre. `target_type` dit `project` — les six sont
     figés par l'arbitrage (b), et `link` n'en est pas — et `target_id` désigne
     l'accompagnement visé : c'est lui que le geste a touché. */
  await session.db.record({
    projectId,
    verb: "linked",
    targetType: "project",
    targetId: input.toProjectId,
    summary: linkPhrase("declared", target.targetName, input.reason),
  });

  refreshLink(projectId, input.toProjectId);

  return { values, errors: {}, ok: true };
}

/**
 * Corriger un lien déclaré : **le même formulaire, la même validation, les
 * mêmes refus** qu'à la déclaration — la propriété qui fait qu'un seul panneau
 * sert les deux gestes.
 *
 * `projectId` et `linkId` sont liés côté serveur. **Ce ne sont pas des
 * secrets** : Next les sérialise en clair dans un champ `$ACTION_…`, et une
 * soumission peut les réécrire. Ce qui protège est `openLink`, qui interroge le
 * droit sur le projet **reçu** puis rapproche le lien **reçu** de ce projet.
 *
 * **La cible peut changer** : corriger un lien, c'est aussi s'être trompé
 * d'accompagnement. Les trois contrôles valent alors comme à la déclaration —
 * domaine, auto-lien, archivage —, plus l'unicité, le lien édité excepté de
 * lui-même.
 */
export async function updateProjectLink(
  projectId: string,
  linkId: string,
  _previous: LinkFormState,
  formData: FormData,
): Promise<LinkFormState> {
  const session = await requireSession();

  const gate = await openLink(
    session,
    projectId,
    linkId,
    "La modification d'un lien est réservée au responsable de domaine et aux contributeurs désignés de cet accompagnement.",
  );
  if ("message" in gate) return linkRefusal(formData, gate.message);

  const { values, errors, input } = parseLinkForm(formData);
  if (!input) return { values, errors };

  /* L'exception nominative : la cible que le lien porte **déjà** est acceptée
     même archivée, et elle seule. Le panneau la garde sélectionnée sans la
     proposer ; sans cette ligne, une re-soumission à l'identique serait
     refusée. */
  const target = await checkLinkTarget(
    session,
    projectId,
    input.toProjectId,
    gate.link.toProjectId,
  );
  if (Object.keys(target.errors).length > 0) {
    return { values, errors: target.errors };
  }

  const held = await checkLinkUnique(
    session,
    projectId,
    input.toProjectId,
    linkId,
  );
  if (Object.keys(held).length > 0) return { values, errors: held };

  try {
    const updated = await session.db.update(projectLinks, linkId, input);
    if (!updated) {
      return linkRefusal(
        formData,
        "Ce lien n'a pas été déclaré depuis cet accompagnement.",
      );
    }
  } catch (error) {
    if (error instanceof DomainScopeError) {
      return linkRefusal(
        formData,
        "Une référence de ce formulaire n'appartient pas au domaine : la saisie n'a pas été enregistrée.",
      );
    }
    throw error;
  }

  await session.db.record({
    projectId,
    verb: "linked",
    targetType: "project",
    targetId: input.toProjectId,
    summary: linkPhrase("updated", target.targetName, input.reason),
  });

  /* L'ancienne cible est revalidée avec la nouvelle : elle perd la ligne au
     même instant que l'autre la gagne. */
  refreshLink(projectId, input.toProjectId, gate.link.toProjectId);

  return { values, errors: {}, ok: true };
}

/**
 * Retirer un lien déclaré : la liaison se **défait**, elle ne s'archive pas
 * (arbitrage (f)).
 *
 * **Ce n'est pas une entorse à la règle 4.** La règle protège la donnée
 * métier ; un lien déclaré est une liaison, et c'est l'arbitrage de fait de
 * T1.2 — celui des membres de projet, des participants d'activité et des
 * adoptions. `LinkTable` le dit à la compilation : `archive` ne compilerait pas
 * sur cette table, `unlink` seul le peut. Rien de la mémoire du centre ne s'y
 * perd — les deux accompagnements restent, avec leurs pages.
 *
 * **Aucune cascade** : `unlink` retire la ligne de liaison, rien d'autre.
 *
 * **Sans confirmation** — arbitrage (c) de `tickets-C4bis.md` : elle se
 * justifie là où le geste retire de la lecture tout un ensemble, et `docs/06`
 * §9 la proscrit partout où elle ne protège rien. Retirer un lien posé par
 * erreur est le geste qu'on veut rapide, et il se refait.
 *
 * **Le refus est muet**, comme `removeAdoption` : ce geste n'a aucune saisie à
 * rendre, et rien ne justifie de lui inventer un message que l'écran n'atteint
 * jamais en usage normal.
 */
export async function removeProjectLink(
  projectId: string,
  linkId: string,
): Promise<void> {
  const session = await requireSession();

  const gate = await openLink(
    session,
    projectId,
    linkId,
    // Jamais rendu : ce geste n'affiche aucun refus.
    "Le retrait d'un lien est réservé au responsable de domaine et aux contributeurs désignés de cet accompagnement.",
  );
  if ("message" in gate) return;

  /* Le nom du projet visé, que la phrase du journal fige.

     **L'ordre est indifférent, et le dire est une correction** : le premier
     jet plaçait cette lecture avant `unlink` en affirmant qu'après, « la
     liaison n'existe plus pour désigner sa cible ». C'est faux — `gate.link`
     est déjà en main, et `unlink` n'efface que la ligne de liaison, jamais le
     projet qu'elle vise (aucune cascade). La neutralisation l'a montré : les
     deux ordres passent les mêmes tests. Ce qui disparaîtrait vraiment, et que
     l'arbitrage (e) demande de figer, c'est le **nom** du jour où le projet
     serait renommé — pas la ligne qu'on retire. */
  const target = await session.db.find(projects, gate.link.toProjectId);

  await session.db.unlink(projectLinks, linkId);

  /* **Le verbe reste `linked`, et la phrase dit le retrait** : l'énuméré
     n'a pas d'`unlinked`, et en ajouter un demanderait une migration. Aucune
     raison n'est reprise — « Lien retiré : X » désigne ce qui a été touché,
     comme « Ressource archivée : X » ne redonne pas l'adresse du document. */
  await session.db.record({
    projectId,
    verb: "linked",
    targetType: "project",
    targetId: gate.link.toProjectId,
    summary: linkPhrase("removed", target?.name ?? ""),
  });

  refreshLink(projectId, gate.link.toProjectId);
}

/* ==========================================================================
   Le budget — T7.1

   `budgets` était au schéma depuis la migration `0000` et n'avait jamais reçu
   une ligne : c'est la dernière promesse non tenue de `docs/06` §5, et D28 la
   voulait en dernier.

   **Un seul geste, là où les autres blocs en ont trois.** Ni retrait ni
   archivage (arbitrage (c) de `tickets-C7.md`) : `budgets` ne porte pas
   d'`archived_at`, et lui en ajouter un serait une seconde migration que le
   chantier n'attend pas. `unlink` n'est pas employé non plus — l'exception de
   C6 était argumentée sur une **table de liaison**, et `budgets` n'en est pas
   une, puisqu'elle porte des valeurs propres. Un budget saisi par erreur se
   **corrige** : toutes ses colonnes de valeur sont nullables, et le formulaire
   vidé les remet à `null`. C'est le chemin de rattrapage, et il est complet.

   **Aucune ligne de journal** (arbitrage (d)). `budget` n'est pas l'un des six
   `event_target_type`, et l'ajouter demanderait une migration d'énuméré pour un
   seul objet quand persona, use case, indicateur, personne, entité et vision
   produit n'en ont pas. Le point ouvert d'`ETAT.md` se récrit avec un
   **septième** nom ; il ne se referme pas à moitié.
   ========================================================================== */

/**
 * Un refus qui n'appartient à aucun champ — jumeau d'`adoptionRefusal`.
 *
 * La saisie revient telle quelle : Vision ne jette jamais en silence ce qui a
 * été tapé, y compris quand ce qu'elle refuse n'est pas la saisie.
 */
function budgetRefusal(formData: FormData, message: string): BudgetFormState {
  return { values: readBudgetForm(formData), errors: {}, message };
}

/**
 * L'outil reçu, rapproché du domaine courant.
 *
 * Un identifiant inconnu — ou d'un autre domaine, que la couche ne distingue
 * pas — produit un message de champ, jamais une exception.
 * `assertPreconditions` reste le second filet, pas le premier.
 *
 * Un outil **archivé** est refusé pour la raison de `checkAdoptionIndicator` :
 * le panneau ne le propose pas, et rien ne justifie de l'accepter par requête.
 *
 * **`keptToolId` est l'exception nominative** (T4bis.6, transposée). Un budget
 * dont l'outil a été archivé depuis garde son outil sélectionné dans le
 * panneau — `listResultToolOptions` le lui rend nommément ; le refuser à la
 * re-soumission rendrait toute correction impossible sans changer d'outil.
 * L'exception est **nominative** : elle n'accepte que la valeur déjà portée par
 * la ligne, et n'ouvre la porte à aucun autre archivé. Une **saisie** n'en passe
 * aucune, n'ayant aucune valeur antérieure à préserver.
 */
async function checkBudgetTool(
  session: Session,
  input: BudgetRowInput,
  keptToolId: string | null = null,
): Promise<BudgetFormErrors> {
  if (!input.toolId) return {};

  const tool = await session.db.find(tools, input.toolId);
  if (!tool || (tool.archivedAt !== null && tool.id !== keptToolId)) {
    return { toolId: "Cet outil n'existe pas dans ce domaine." };
  }

  return {};
}

/**
 * Le seul écran que cette écriture change.
 *
 * Ce n'est **pas** `refresh` : `last_activity_at` n'a pas bougé — un budget
 * n'est pas un fait d'accompagnement —, et revalider la liste des projets ferait
 * croire le contraire au lecteur de ce fichier (la leçon de T4.2). Ce n'est pas
 * non plus `refreshAdoption` : la page du **produit** n'affiche aucun budget, et
 * la revalider serait annoncer une conséquence qui n'existe pas.
 */
function refreshBudget(projectId: string): void {
  revalidatePath(ROUTES.project(projectId));
}

/**
 * Saisir ou corriger le budget d'un accompagnement — **un seul geste, une seule
 * ligne**.
 *
 * `budgets_project_unique` fait qu'un projet porte au plus un budget : il n'y a
 * donc pas d'identifiant à recevoir, pas de cible à rapprocher de la page, et
 * pas de demande forgée à écarter de ce côté — la ligne se cherche **par le
 * projet**. C'est ce qui distingue cette action des trois gestes de la ressource
 * ou de l'adoption, et c'est une propriété de la table, pas un choix.
 *
 * `projectId` est lié côté serveur ; `previous` est l'état que `useActionState`
 * fait circuler, dont l'action n'a pas besoin — la saisie repart du `FormData` à
 * chaque soumission.
 *
 * **Ce qui protège est `openProject`, et lui seul** : le droit `writeProject`
 * est interrogé sur le `projectId` **reçu**, quel qu'il soit. L'identifiant lié
 * n'est pas un secret — Next le sérialise en clair dans un champ `$ACTION_…`, et
 * une soumission peut le réécrire.
 *
 * **Le droit est `writeProject`, jamais `manageDomain`** (arbitrage (e)) : le
 * budget est une propriété de l'**accompagnement**, ce qui le sépare de la
 * vision produit, propriété du produit. C'est le droit des ressources, des
 * résultats et des adoptions (D9, D23), et inventer un troisième niveau pour lui
 * serait ce que D9 refuse.
 *
 * **Une soumission entièrement vide est acceptée**, et c'est le geste qui défait
 * : les cinq colonnes repassent à `null`, la ligne reste. Refuser le formulaire
 * vide fermerait le seul rattrapage d'une saisie erronée.
 */
export async function saveProjectBudget(
  projectId: string,
  _previous: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const session = await requireSession();

  const gate = await openProject(
    session,
    projectId,
    "La saisie du budget est réservée au responsable de domaine et aux contributeurs désignés de cet accompagnement.",
  );
  if ("message" in gate) return budgetRefusal(formData, gate.message);

  const { values, errors, input } = parseBudgetForm(formData);
  if (!input) return { values, errors };

  /* La ligne déjà en place, s'il y en a une. `list` et non `find` : la clé de
     recherche est le projet, pas l'identifiant du budget — et `budgets` n'a pas
     d'`archived_at`, donc la couche n'a rien à écarter. L'`unique` garantit
     qu'il y en a zéro ou une ; en prendre la première ne masque aucun cas. */
  const held = await session.db.list(budgets, {
    where: eq(budgets.projectId, projectId),
  });
  const current = held[0] ?? null;

  const unknown = await checkBudgetTool(
    session,
    input,
    current?.toolId ?? null,
  );
  if (Object.keys(unknown).length > 0) return { values, errors: unknown };

  try {
    /* **Créer ou corriger la même ligne**, et c'est ce que la fiche demande :
       un seul geste, un seul formulaire, une seule adresse. `insert` ne peut
       jamais heurter `budgets_project_unique`, la lecture qui précède ayant
       déjà tranché — et si une soumission concurrente la posait entre les deux,
       la contrainte refuserait plutôt que de créer un doublon. */
    if (current) {
      await session.db.update(budgets, current.id, input);
    } else {
      await session.db.insert(budgets, { projectId, ...input });
    }
  } catch (error) {
    if (error instanceof DomainScopeError) {
      return budgetRefusal(
        formData,
        "Une référence de ce formulaire n'appartient pas au domaine : la saisie n'a pas été enregistrée.",
      );
    }
    throw error;
  }

  refreshBudget(projectId);

  /* Le panneau se referme sur ce succès (TD.2) : `revalidatePath` porte l'arbre
     réactualisé, ce qui a été saisi paraît dans son bloc, et c'est toute la
     confirmation (`docs/06` §9). */
  return { values, errors: {}, ok: true };
}
