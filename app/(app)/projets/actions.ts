"use server";

/**
 * Les écritures de l'écran Projets.
 *
 * F1-D1 et D9 : **créer et modifier un projet est réservé au responsable de
 * domaine.** Les deux formulaires sont déjà en 404 pour qui n'a pas ce droit ;
 * la garde qui compte est celle qui est ici. Une action serveur est un point
 * d'entrée HTTP à part entière — un bouton masqué n'est pas un droit, et une
 * route interdite ne protège pas l'action qu'elle affichait.
 *
 * Aucune écriture directe : tout passe par `session.db`, déjà scopé sur le
 * domaine courant et sur la personne courante — `domain_id` et `created_by`
 * sont posés par la couche sur les cinq tables, l'appelant n'y pense pas.
 * Règle 1.
 *
 * **Tout est confronté au domaine avant la moindre écriture.** `neon-http` n'a
 * pas de transaction interactive (cf. `lib/db/scoped.ts`, qui n'a que `batch`) :
 * un formulaire qui écrit cinq tables ne peut pas être atomique. La seule
 * défense est de vérifier d'abord et d'écrire ensuite, pour que
 * `assertPreconditions` soit un second filet et non le premier.
 *
 * Ce que ces actions ne font pas : archiver. Hors du périmètre de T2.6.
 */

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/provider";
import type { Session } from "@/lib/auth/session";
import {
  approaches,
  jobs,
  persons,
  products,
  projectApproaches,
  projectJobs,
  projectMembers,
  projectStatuses,
  projects,
} from "@/lib/db/schema";
import { DomainScopeError } from "@/lib/db/scoped";
import {
  parseProjectForm,
  type ProjectFormErrors,
  type ProjectFormState,
  type ProjectInput,
} from "@/lib/forms/project";
import { ROUTES } from "@/lib/navigation";

/** L'issue d'une écriture : où aller, ou l'état à réafficher. */
type Outcome =
  | { projectId: string; productIds: string[] }
  | { state: ProjectFormState };

/* ==========================================================================
   Vérifier avant d'écrire

   Chaque identifiant reçu est rapproché du domaine courant. Un identifiant
   inconnu — ou d'un autre domaine, que la couche ne distingue pas — produit un
   message de champ, jamais une exception ni une ligne à moitié écrite.
   ========================================================================== */

async function checkReferences(
  session: Session,
  input: ProjectInput,
): Promise<ProjectFormErrors> {
  const errors: ProjectFormErrors = {};

  const [product, status] = await Promise.all([
    session.db.find(products, input.row.productId),
    session.db.find(projectStatuses, input.row.statusId),
  ]);

  if (!product) errors.productId = "Ce produit n'existe pas dans ce domaine.";
  if (!status) errors.statusId = "Ce statut n'existe pas dans ce domaine.";

  if (input.jobIds.length > 0) {
    const known = await session.db.list(jobs, {
      where: inArray(jobs.id, input.jobIds),
    });
    if (known.length !== input.jobIds.length) {
      errors.jobIds = "Un métier sélectionné n'existe pas dans ce domaine.";
    }
  }

  if (input.approachIds.length > 0) {
    const known = await session.db.list(approaches, {
      where: inArray(approaches.id, input.approachIds),
    });
    if (known.length !== input.approachIds.length) {
      errors.approachIds = "Une approche sélectionnée n'existe pas dans ce domaine.";
    }
  }

  if (input.members.length > 0) {
    const ids = input.members.map((member) => member.personId);
    const known = await session.db.list(persons, {
      where: inArray(persons.id, ids),
    });
    if (known.length !== ids.length) {
      errors.team = "Une personne de l'équipe n'existe pas dans ce domaine.";
    }
  }

  return errors;
}

/* ==========================================================================
   Les liaisons

   Créer, c'est lier ce qui est coché. Modifier, c'est **un diff** : ce qui a
   disparu se délie, ce qui apparaît se lie, ce qui change de rôle se met à
   jour. `unlink` est une vraie suppression, réservée par le typage aux tables
   sans `archived_at` : les trois tables de liaison le sont (T1.2), et retirer
   un membre d'un projet n'est pas un archivage.
   ========================================================================== */

/**
 * Le diff des métiers déclarés (D44 — ce sont eux qui font foi, pas ceux de
 * l'équipe).
 *
 * Écrit sans généricité : `project_jobs` et `project_approaches` ont la même
 * forme mais pas la même colonne, et une fonction commune sur ces deux tables
 * ne se type qu'au prix d'un `as`. Deux fonctions courtes valent mieux qu'une
 * affirmation.
 */
async function syncJobs(
  session: Session,
  projectId: string,
  wanted: readonly string[],
): Promise<void> {
  const current = await session.db.list(projectJobs, {
    where: eq(projectJobs.projectId, projectId),
  });

  const target = new Set(wanted);
  for (const row of current) {
    if (!target.has(row.jobId)) await session.db.unlink(projectJobs, row.id);
  }

  const held = new Set(current.map((row) => row.jobId));
  const added = wanted.filter((jobId) => !held.has(jobId));
  if (added.length > 0) {
    await session.db.insertMany(
      projectJobs,
      added.map((jobId) => ({ projectId, jobId })),
    );
  }
}

/** Le diff des approches déclarées (D2 — plusieurs par projet autorisées). */
async function syncApproaches(
  session: Session,
  projectId: string,
  wanted: readonly string[],
): Promise<void> {
  const current = await session.db.list(projectApproaches, {
    where: eq(projectApproaches.projectId, projectId),
  });

  const target = new Set(wanted);
  for (const row of current) {
    if (!target.has(row.approachId)) {
      await session.db.unlink(projectApproaches, row.id);
    }
  }

  const held = new Set(current.map((row) => row.approachId));
  const added = wanted.filter((approachId) => !held.has(approachId));
  if (added.length > 0) {
    await session.db.insertMany(
      projectApproaches,
      added.map((approachId) => ({ projectId, approachId })),
    );
  }
}

/** Le diff de l'équipe. Le rôle change sans que la ligne soit refaite. */
async function syncMembers(
  session: Session,
  projectId: string,
  wanted: readonly { personId: string; isContributor: boolean }[],
): Promise<void> {
  const current = await session.db.list(projectMembers, {
    where: eq(projectMembers.projectId, projectId),
  });

  const target = new Map(wanted.map((member) => [member.personId, member]));

  for (const row of current) {
    const kept = target.get(row.personId);
    if (!kept) {
      await session.db.unlink(projectMembers, row.id);
      continue;
    }
    if (kept.isContributor !== row.isContributor) {
      await session.db.update(projectMembers, row.id, {
        isContributor: kept.isContributor,
      });
    }
  }

  const held = new Set(current.map((row) => row.personId));
  const added = wanted.filter((member) => !held.has(member.personId));
  if (added.length > 0) {
    await session.db.insertMany(
      projectMembers,
      added.map((member) => ({
        projectId,
        personId: member.personId,
        isContributor: member.isContributor,
      })),
    );
  }
}

/**
 * La personne ajoutée à la main, s'il y en a une (D19).
 *
 * `source: "manual"` et `hasAccess: false` tiennent les deux contraintes
 * `CHECK` de `persons` : pas d'identifiant annuaire sans annuaire, pas de rôle
 * de domaine sans accès. Être référencé et pouvoir se connecter restent deux
 * choses distinctes — cette personne n'apparaîtra jamais dans `/dev/session`.
 */
async function addManualPerson(
  session: Session,
  input: ProjectInput,
): Promise<{ personId: string; isContributor: boolean } | null> {
  if (!input.newPerson) return null;

  const created = await session.db.insert(persons, {
    source: "manual",
    fullName: input.newPerson.fullName,
    kind: input.newPerson.kind,
    hasAccess: false,
    domainRole: null,
    isActive: true,
  });

  return { personId: created.id, isContributor: input.newPerson.isContributor };
}

/* ==========================================================================
   Le tronc commun
   ========================================================================== */

/**
 * Le droit, la forme, les références, puis l'écriture.
 *
 * `write` reçoit une ligne déjà validée et rend l'identifiant du projet touché
 * — celui qu'on vient de créer, ou celui qu'on vient de modifier — avec les
 * pages produit à réactualiser : deux si le rattachement a changé (D20).
 */
async function submit(
  formData: FormData,
  write: (
    session: Session,
    input: ProjectInput,
  ) => Promise<{ projectId: string; productIds: string[] } | null>,
): Promise<Outcome> {
  const { values, errors, input } = parseProjectForm(formData);
  const session = await requireSession();

  if (!session.can.manageDomain) {
    return {
      state: {
        values,
        errors: {},
        message:
          "La création et la modification d'un accompagnement sont réservées au responsable de domaine.",
      },
    };
  }

  if (!input) return { state: { values, errors } };

  const unknown = await checkReferences(session, input);
  if (Object.keys(unknown).length > 0) {
    return { state: { values, errors: unknown } };
  }

  try {
    const written = await write(session, input);
    if (!written) {
      // `update` ne trouve rien : identifiant inconnu, ou d'un autre domaine.
      // La couche est scopée, elle ne distingue pas les deux — et l'écran non
      // plus, pour la même raison que la page projet rend 404 dans les deux cas.
      return {
        state: {
          values,
          errors: {},
          message: "Cet accompagnement n'existe plus dans ce domaine.",
        },
      };
    }
    return written;
  } catch (error) {
    // Le second filet : une référence a franchi la vérification et la couche
    // l'a refusée. L'écran le dit plutôt que de rendre une page en erreur.
    if (error instanceof DomainScopeError) {
      return {
        state: {
          values,
          errors: {},
          message:
            "Une référence de ce formulaire n'appartient pas au domaine : la saisie n'a pas été enregistrée.",
        },
      };
    }
    throw error;
  }
}

/**
 * Les écrans à réactualiser après une écriture, puis la redirection.
 *
 * La liste des produits en fait partie : elle affiche le **nombre**
 * d'accompagnements de chaque produit, qui vient de changer. C'est la moitié
 * du critère de validation du ticket.
 *
 * `redirect` lève : elle est appelée **hors de tout `try`**, faute de quoi le
 * `catch` de `submit` avalerait la navigation et rendrait un formulaire au
 * lieu d'une page projet.
 */
function goToProject(projectId: string, productIds: readonly string[]): never {
  revalidatePath(ROUTES.projects);
  revalidatePath(ROUTES.products);
  for (const productId of new Set(productIds)) {
    revalidatePath(ROUTES.product(productId));
  }
  revalidatePath(ROUTES.project(projectId));
  redirect(ROUTES.project(projectId));
}

export async function createProject(
  _previous: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const outcome = await submit(formData, async (session, input) => {
    const manual = await addManualPerson(session, input);
    const created = await session.db.insert(projects, input.row);

    await syncJobs(session, created.id, input.jobIds);
    await syncApproaches(session, created.id, input.approachIds);
    await syncMembers(session, created.id, [
      ...input.members,
      ...(manual ? [manual] : []),
    ]);

    return { projectId: created.id, productIds: [input.row.productId] };
  });

  if ("state" in outcome) return outcome.state;
  goToProject(outcome.projectId, outcome.productIds);
}

export async function updateProject(
  id: string,
  _previous: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const outcome = await submit(formData, async (session, input) => {
    // Le rattachement d'avant, lu avant l'écriture : si le projet change de
    // produit (D20), l'ancienne page produit doit être réactualisée elle aussi,
    // sans quoi elle continuerait d'afficher un accompagnement parti ailleurs.
    const before = await session.db.find(projects, id);
    if (!before) return null;

    const manual = await addManualPerson(session, input);

    // `input.row` ne porte que les colonnes du ticket : `update` refuse `id` et
    // `archivedAt`, et rien d'autre ne peut s'y glisser depuis le formulaire —
    // `readProjectForm` ne lit que ce qu'il connaît. `last_activity_at` reste
    // à la couche.
    const updated = await session.db.update(projects, id, input.row);
    if (!updated) return null;

    await syncJobs(session, id, input.jobIds);
    await syncApproaches(session, id, input.approachIds);
    await syncMembers(session, id, [
      ...input.members,
      ...(manual ? [manual] : []),
    ]);

    return {
      projectId: id,
      productIds: [before.productId, input.row.productId],
    };
  });

  if ("state" in outcome) return outcome.state;
  goToProject(outcome.projectId, outcome.productIds);
}
