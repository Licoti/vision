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
 * **L'archivage arrive en T4bis.3**, sur le modèle de `produits/actions.ts` :
 * même droit `manageDomain` — c'est l'identité de l'accompagnement qui change
 * de place, pas son contenu —, même panneau de confirmation, même refus muet au
 * rétablissement. Deux règles l'accompagnent, et toutes deux vivent ici plutôt
 * qu'à l'écran :
 *   — un accompagnement déjà archivé ne se modifie plus, sur l'identifiant
 *     **reçu** (arbitrage (a) de `tickets-C4bis.md` : aucune écriture sur un
 *     projet archivé, et le formulaire d'identité en est une) ;
 *   — aucune cascade, jamais (arbitrage (f)) : les activités d'un projet
 *     archivé gardent leur `archived_at` nul et cessent de s'afficher parce que
 *     leur parent ne s'affiche plus.
 *
 * Ce que l'archivage d'un accompagnement ne porte **pas**, à la différence de
 * celui d'un produit : aucun refus fondé sur ce qu'il contient. L'arbitrage (e)
 * est écrit pour le produit et pour sa raison propre — masquer des
 * accompagnements vivants de deux listes. La page d'un projet archivé, elle,
 * reste servie **entière**, roadmap comprise : rien ne disparaît de la lecture,
 * donc rien ne s'oppose au rangement.
 *
 * Aucune suppression, jamais (règle 4) : la couche n'expose pas de `delete`, et
 * ce qui est archivé se rétablit.
 *
 * **Aucune écriture dans `persons`, jamais non plus** — depuis T5bis.7, et c'est
 * l'arbitrage (g) de C5bis : une personne se crée dans `/equipe`, et nulle part
 * ailleurs. Ces deux actions **désignent** des personnes du domaine, qu'elles
 * confrontent au domaine avant d'écrire ; `persons` n'apparaît plus ici que dans
 * `checkReferences`, en lecture. Le bloc « Ajouter une personne » du formulaire
 * l'écrivait, et une soumission forgée ne peut plus le rejouer : le champ n'est
 * plus lu par `lib/forms/project.ts`.
 */

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ConfirmState } from "@/components/ui/confirm-panel";
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
import { DomainScopeError, type Row } from "@/lib/db/scoped";
import {
  parseProjectForm,
  type ProjectFormErrors,
  type ProjectFormState,
  type ProjectInput,
} from "@/lib/forms/project";
import { ROUTES } from "@/lib/navigation";
import { findProjectLinks } from "@/lib/queries/projects";

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

/**
 * Les liaisons que l'accompagnement porte **déjà**, et qui échappent donc au
 * filtre d'archivage — T4bis.1.
 *
 * `keep` est nul en création : rien n'est encore lié, rien n'est toléré.
 *
 * `productId` a rejoint les trois listes en TD.1, pour la même raison qu'elles :
 * un accompagnement resté sous un produit rangé — état atteignable, cf. le point
 * ouvert d'`ETAT.md` sur le rétablissement — doit continuer de se modifier.
 * L'exception est **nominative** : ce produit-là, et lui seul.
 */
type ProjectLinksKeep = {
  productId: string;
  jobIds: readonly string[];
  approachIds: readonly string[];
  personIds: readonly string[];
};

/**
 * Ce qui reste à confronter au domaine : les identifiants reçus, moins ceux
 * que la ligne éditée porte déjà.
 *
 * C'est la forme **nominative** de l'exception, et non un `includeArchived`
 * global : une valeur inconnue du domaine reste refusée, et une valeur
 * archivée que ce projet ne porte pas déjà aussi. Les identifiants retranchés
 * n'ont pas besoin d'être revérifiés — ils viennent de `findProjectLinks`,
 * lecture scopée sur le domaine courant, pas de la soumission.
 */
function toCheck(
  received: readonly string[],
  tolerated: readonly string[] | undefined,
): string[] {
  if (!tolerated?.length) return [...received];
  const kept = new Set(tolerated);
  return received.filter((id) => !kept.has(id));
}

/**
 * Les trois listes se vérifient par `list`, qui écarte les lignes archivées :
 * **on n'accepte que des valeurs vivantes**, sauf celles que `keep` tolère
 * nommément. Le produit et le statut passent, eux, par `find`, qui rend les
 * lignes archivées — d'où le contrôle explicite ci-dessous pour le premier.
 *
 * **Un produit archivé n'accueille pas d'accompagnement**, et c'est ici que la
 * règle vit — la porte que les deux actions traversent, comme `openProject`
 * porte la lecture seule pour les cinq gestes de la page projet (T4bis.3). Le
 * trou était ouvert depuis T4bis.2 : le formulaire ne propose plus le produit
 * rangé et la page produit n'y mène plus, mais `find` rend les lignes archivées,
 * si bien qu'une soumission **forgée** rattachait un accompagnement neuf à un
 * produit qu'aucune liste n'affiche. `updateProject` portait le même trou en
 * déplacement de rattachement (D20).
 *
 * Le refus est un **message de champ** et non un refus de tronc commun : le
 * produit est un champ de ce formulaire, et emprunter le canal du « n'existe
 * plus dans ce domaine » aurait menti — il existe, il est lisible, et sa page
 * est servie deux clics plus loin (la leçon de T4bis.2).
 */
async function checkReferences(
  session: Session,
  input: ProjectInput,
  keep: ProjectLinksKeep | null,
): Promise<ProjectFormErrors> {
  const errors: ProjectFormErrors = {};

  const [product, status] = await Promise.all([
    session.db.find(products, input.row.productId),
    session.db.find(projectStatuses, input.row.statusId),
  ]);

  if (!product) errors.productId = "Ce produit n'existe pas dans ce domaine.";
  else if (product.archivedAt && keep?.productId !== product.id) {
    errors.productId =
      "Ce produit est archivé : il n'accueille plus d'accompagnement. Rétablissez-le d'abord.";
  }
  if (!status) errors.statusId = "Ce statut n'existe pas dans ce domaine.";

  const jobIds = toCheck(input.jobIds, keep?.jobIds);
  if (jobIds.length > 0) {
    const known = await session.db.list(jobs, {
      where: inArray(jobs.id, jobIds),
    });
    if (known.length !== jobIds.length) {
      errors.jobIds = "Un métier sélectionné n'existe pas dans ce domaine.";
    }
  }

  const approachIds = toCheck(input.approachIds, keep?.approachIds);
  if (approachIds.length > 0) {
    const known = await session.db.list(approaches, {
      where: inArray(approaches.id, approachIds),
    });
    if (known.length !== approachIds.length) {
      errors.approachIds = "Une approche sélectionnée n'existe pas dans ce domaine.";
    }
  }

  const personIds = toCheck(
    input.members.map((member) => member.personId),
    keep?.personIds,
  );
  if (personIds.length > 0) {
    const known = await session.db.list(persons, {
      where: inArray(persons.id, personIds),
    });
    if (known.length !== personIds.length) {
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

/* ==========================================================================
   Le tronc commun
   ========================================================================== */

/**
 * Le droit, la forme, les références, puis l'écriture.
 *
 * `write` reçoit une ligne déjà validée et rend l'identifiant du projet touché
 * — celui qu'on vient de créer, ou celui qu'on vient de modifier — avec les
 * pages produit à réactualiser : deux si le rattachement a changé (D20).
 *
 * `null` reste le cas de la ligne introuvable, dont le message est le même pour
 * les deux actions. **Un refus nommé** est ce qui permet à T4bis.3 de dire
 * « archivé » plutôt que « n'existe plus », qui serait faux — la forme est celle
 * de `produits/actions.ts` depuis T4bis.2, reprise sans en changer un caractère.
 *
 * `editing` porte l'identifiant du projet dont les liaisons se tolèrent
 * (T4bis.1). Il n'est fourni qu'en modification : en création, rien n'est
 * encore lié, et l'exception n'aurait rien à désigner.
 *
 * La ligne éditée est lue **ici, une fois**, et passée à `write` : l'exception
 * nominative et le contrôle d'archivage du projet la veulent tous deux, et deux
 * lectures de la même ligne dans la même soumission seraient deux occasions de
 * divergence. `write` la reçoit donc en second argument, `null` en création.
 */
async function submit(
  formData: FormData,
  write: (
    session: Session,
    input: ProjectInput,
    before: Row<typeof projects> | undefined,
  ) => Promise<
    { projectId: string; productIds: string[] } | { refused: string } | null
  >,
  editing?: string,
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

  /* Ce que le projet porte déjà, lu **en base** et non reçu du formulaire :
     une soumission ne se tolère pas elle-même. Sans ce rapprochement, une
     valeur archivée depuis serait refusée par `checkReferences` alors même que
     le formulaire vient de la réafficher, sélectionnée — la moitié invisible
     de T4bis.1. */
  const [before, links] = editing
    ? await Promise.all([
        session.db.find(projects, editing),
        findProjectLinks(session.db, editing),
      ])
    : [undefined, undefined];

  /* Le projet à modifier n'existe plus : `write` rendra le même `null`, et le
     message est le sien. Rien ne se tolère au nom d'une ligne absente. */
  const keep =
    before && links
      ? {
          productId: before.productId,
          jobIds: links.jobIds,
          approachIds: links.approachIds,
          personIds: links.members.map((member) => member.personId),
        }
      : null;

  const unknown = await checkReferences(session, input, keep);
  if (Object.keys(unknown).length > 0) {
    return { state: { values, errors: unknown } };
  }

  try {
    const written = await write(session, input, before);

    if (written && "refused" in written) {
      return { state: { values, errors: {}, message: written.refused } };
    }

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
    const created = await session.db.insert(projects, input.row);

    await syncJobs(session, created.id, input.jobIds);
    await syncApproaches(session, created.id, input.approachIds);
    await syncMembers(session, created.id, input.members);

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
  const outcome = await submit(formData, async (session, input, before) => {
    // Le rattachement d'avant est lu par `submit`, qui en a besoin pour
    // l'exception nominative : si le projet change de produit (D20), l'ancienne
    // page produit doit être réactualisée elle aussi, sans quoi elle
    // continuerait d'afficher un accompagnement parti ailleurs.
    if (!before) return null;

    /* Un accompagnement archivé ne se modifie plus (T4bis.3, arbitrage (a)).
       Le contrôle porte sur l'identifiant **reçu**, et il est le seul qui
       protège : la page de modification rend 404 sur un projet archivé, mais
       une route interdite n'a jamais protégé l'action qu'elle affichait — les
       champs récoltés avant l'archivage se repostent tels quels ensuite. */
    if (before.archivedAt) {
      return {
        refused:
          "Cet accompagnement est archivé : il ne se modifie plus. Rétablissez-le d'abord.",
      };
    }

    // `input.row` ne porte que les colonnes du ticket : `update` refuse `id` et
    // `archivedAt`, et rien d'autre ne peut s'y glisser depuis le formulaire —
    // `readProjectForm` ne lit que ce qu'il connaît. `last_activity_at` reste
    // à la couche.
    const updated = await session.db.update(projects, id, input.row);
    if (!updated) return null;

    await syncJobs(session, id, input.jobIds);
    await syncApproaches(session, id, input.approachIds);
    await syncMembers(session, id, input.members);

    return {
      projectId: id,
      productIds: [before.productId, input.row.productId],
    };
  }, id);

  if ("state" in outcome) return outcome.state;
  goToProject(outcome.projectId, outcome.productIds);
}

/* ==========================================================================
   Archiver, et rétablir — T4bis.3
   ========================================================================== */

/**
 * Le droit, puis l'accompagnement, sur l'identifiant **reçu**.
 *
 * **Le nom la distingue d'`openProject`** (`projets/[id]/actions.ts`), et ce
 * n'est pas une coquetterie : l'une exige `manageDomain`, l'autre
 * `writeProject`, et les confondre serait le seul moyen d'ouvrir l'archivage à
 * un contributeur désigné. D9 pose deux niveaux ; le partage est celui de T2.6,
 * où le contributeur saisit et le responsable modifie l'identité.
 *
 * `bind(null, project.id)` fait sortir l'identifiant de la saisie, mais Next le
 * sérialise dans un champ `$ACTION_…` du balisage, en clair en développement, et
 * une soumission peut le réécrire. **Une action ne tire jamais une autorisation
 * de la valeur qu'on lui a liée** — elle interroge le droit sur la valeur reçue.
 */
async function openProjectAsManager(
  projectId: string,
): Promise<
  | { session: Session; project: Row<typeof projects> }
  | { message: string }
> {
  const session = await requireSession();

  if (!session.can.manageDomain) {
    return {
      message:
        "L'archivage et le rétablissement d'un accompagnement sont réservés au responsable de domaine.",
    };
  }

  const project = await session.db.find(projects, projectId);
  if (!project) {
    return { message: "Cet accompagnement n'existe plus dans ce domaine." };
  }

  return { session, project };
}

/**
 * Les quatre écrans que l'archivage et le rétablissement changent.
 *
 * La liste des produits et la page du produit en font partie : toutes deux
 * comptent les accompagnements **vivants** et agrègent leur fraîcheur
 * (`listProductsWithCounts` filtre `isNull(projects.archived_at)` dans sa
 * jointure), et les deux valeurs viennent de changer.
 */
function refreshAround(projectId: string, productId: string): void {
  revalidatePath(ROUTES.projects);
  revalidatePath(ROUTES.products);
  revalidatePath(ROUTES.product(productId));
  revalidatePath(ROUTES.project(projectId));
}

/**
 * Archiver un accompagnement : il quitte les listes, sa page reste lisible.
 *
 * Un accompagnement archivé est **la mémoire du centre** (F1-D3) : sa page se
 * lit entière — en-tête, roadmap, ressources, résultats. Ce qui disparaît est
 * l'écriture, et elle disparaît **dans les deux portes** de
 * `projets/[id]/actions.ts`, pas ici.
 *
 * Aucune cascade — arbitrage (f) : les activités gardent leur `archived_at` nul
 * et cessent de s'afficher parce que leur projet ne s'affiche plus. Une cascade
 * rendrait le rétablissement impossible à écrire, faute de pouvoir distinguer
 * ce qui a été archivé de ce qui l'a été par ricochet.
 *
 * `last_activity_at` n'est pas touché : c'est la date du dernier fait
 * d'accompagnement, et archiver le projet n'efface pas ce qui a eu lieu.
 */
export async function archiveProject(
  projectId: string,
  _previous: ConfirmState,
  _formData: FormData,
): Promise<ConfirmState> {
  const gate = await openProjectAsManager(projectId);
  if ("message" in gate) return gate;
  const { session, project } = gate;

  // Déjà archivé : le geste n'a rien à faire, et `archive` ne toucherait rien.
  if (project.archivedAt) return {};

  await session.db.archive(projects, projectId);

  refreshAround(projectId, project.productId);
  /* **Le panneau se referme sur ce succès, et non plus sur une navigation**
     (TD.2). `redirect` était la fermeture ; elle ne peut plus l'être sans
     re-rendre la page que le panneau n'a justement plus à quitter.
     `revalidatePath` reste, et la réponse de l'action porte l'arbre
     réactualisé : ce qui a été écrit paraît dans son bloc, et c'est toute la
     confirmation (`docs/06` §9). */
  return { ok: true };
}

/**
 * Rétablir un accompagnement archivé — le retour que sa page porte
 * (arbitrage (b)).
 *
 * **Un refus est muet**, comme `restoreProduct` depuis T4bis.2 et
 * `transitionActivity` depuis T3.5 : ce geste n'a aucune saisie à rendre, et
 * rien ne justifie de lui inventer un message que l'écran n'atteint jamais en
 * usage normal — le point d'entrée n'est rendu qu'au responsable de domaine,
 * sur un accompagnement archivé.
 */
export async function restoreProject(projectId: string): Promise<void> {
  const gate = await openProjectAsManager(projectId);
  if ("message" in gate) return;
  const { session, project } = gate;

  await session.db.restore(projects, projectId);

  refreshAround(projectId, project.productId);
}
