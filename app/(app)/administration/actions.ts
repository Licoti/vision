"use server";

/**
 * Les écritures de la page **Administration** — les référentiels du domaine
 * (21/08/2026 pour les entités, T7.3 pour les quatre suivants).
 *
 * Cinq gestes sur l'entité : la créer, corriger son libellé, l'archiver, la
 * rétablir, la supprimer. Puis **quatre gestes sur chacun des quatre
 * référentiels simples** — métiers, approches, compétences, échelle de
 * maîtrise —, la suppression en moins (arbitrage (g) de `tickets-C7.md`). Sans
 * eux, ces tables restent ce qu'elles étaient depuis T1.2 : des tables qu'un
 * script seul alimente, et qu'un renommage fait doubler (point ouvert
 * d'`ETAT.md`).
 *
 * **Une fonction d'écriture par table, et c'est la fiche de T7.3.** Seize
 * fonctions se ressemblent ; une seule, paramétrée par la table, aurait fait de
 * la couche scopée un endroit où le domaine se **déduit** plutôt qu'il ne se
 * pose, et rendu `assertPreconditions` illisible. Ce qui se partage ici est
 * **la lecture** — la porte, le doublon, le décompte —, jamais l'écriture : une
 * lecture ne pose rien.
 *
 * **Le droit est `session.can.manageDomain`, seul.** `docs/02` §Rôle donne au
 * responsable de domaine la gestion « des référentiels et des membres », et
 * D25 nomme cet écran. **Aucun droit neuf n'entre dans `lib/auth/session.ts`**
 * — l'arbitrage (c) de C5bis l'interdit, et C7 n'aura pas un droit de plus à
 * reprendre.
 *
 * **L'ordre de la porte est celui d'`openPerson`** : `manageDomain` ne dépend
 * d'aucun identifiant, il s'énonce donc **avant** toute lecture. On ne cherche
 * une ligne qu'après avoir établi qu'on a le droit d'y toucher.
 *
 * **Le droit se vérifie ici, et pas à l'écran.** `/administration` rend 404 à
 * qui n'administre pas et la barre latérale n'y mène pas, mais une action
 * serveur est un point d'entrée HTTP à part entière : ses champs se récoltent
 * sur la page servie à quelqu'un d'autre et se repostent sous un autre cookie.
 * Un écran absent n'est pas un droit.
 *
 * **La suppression est l'écart à la règle 4**, arbitré par l'humain le
 * 21/08/2026 et consigné dans `JOURNAL-TECHNIQUE.md`. Il est borné par trois
 * choses, et il faut les lire ensemble : le **typage** de `DeletableTable`, qui
 * n'ouvre `deleteRow` qu'aux référentiels nommés ; la **clé étrangère**
 * `products.entity_id`, déclarée `on delete restrict`, qui refuse elle-même
 * d'effacer une entité qu'un produit porte encore, archivé compris ; et le
 * **décompte** ci-dessous, qui n'existe que pour dire combien — jamais pour
 * décider. Une entité que rien ne référence n'a jamais qualifié quoi que ce
 * soit : ce n'est pas la donnée métier que la règle 4 protège, c'est un doublon
 * d'amorçage.
 *
 * **L'archivage, lui, se refuse sur les produits vivants** — la forme
 * d'`archiveProduct` et l'arbitrage (e) de `tickets-C4bis.md` : ranger une
 * entité que des produits portent encore les laisserait dans la liste sans leur
 * filtre, et « produit rangé, filtre rangé » ne serait plus vrai. Un produit
 * **archivé** ne s'y oppose pas : il a déjà quitté les listes.
 *
 * **Aucune cascade, jamais** (arbitrage (f)) : archiver une entité ne touche
 * aucun produit.
 *
 * **Aucun recalcul de `last_activity_at`** : une entité n'est pas un fait
 * d'accompagnement, et appeler `refreshLastActivity` ferait croire le contraire
 * à qui lit ce fichier — la leçon de T4.2.
 *
 * Aucune écriture directe : tout passe par `session.db`, déjà scopé sur le
 * domaine courant et sur la personne courante — `domain_id` et `created_by`
 * sont posés par la couche, l'appelant n'y pense pas. Règle 1.
 */

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import type { ConfirmState } from "@/components/ui/confirm-panel";
import { requireSession } from "@/lib/auth/provider";
import type { Session } from "@/lib/auth/session";
import {
  approaches,
  entities,
  jobs,
  products,
  skillLevels,
  skills,
} from "@/lib/db/schema";
import {
  IntegrityError,
  type ArchivableTable,
  type Row,
} from "@/lib/db/scoped";
import {
  formatActivities,
  formatDeclarations,
  formatPersons,
  formatProducts,
  formatProjects,
} from "@/lib/format";
import {
  parseEntityForm,
  readEntityForm,
  sameEntityLabel,
  type EntityFormState,
} from "@/lib/forms/entity";
import {
  ORDERED_BY_POSITION,
  ORDERED_BY_RANK,
  parseReferentialForm,
  readReferentialForm,
  sameReferentialLabel,
  type ReferentialFormState,
} from "@/lib/forms/referential";
import { ROUTES, type Referential } from "@/lib/navigation";
import { listEntityLabels } from "@/lib/queries/entities";
import {
  countReferentialUsage,
  listReferentialLabels,
  type ReferentialUsage,
  type SimpleReferentialTable,
} from "@/lib/queries/referentials";

/** Le refus que les cinq points d'entrée partagent, quand il vient du droit. */
const RESERVED =
  "La gestion des entités est réservée au responsable de domaine.";

/** Le refus que les quatre gestes ciblés partagent, quand la ligne a disparu. */
const GONE = "Cette entité n'existe plus dans ce domaine.";

/**
 * Un refus qui n'appartient à aucun champ — un droit, une ligne disparue.
 *
 * La saisie revient telle quelle : Vision ne jette jamais en silence ce qui a
 * été tapé, y compris quand ce qu'elle refuse n'est pas la saisie.
 */
function refusal(formData: FormData, message: string): EntityFormState {
  return { values: readEntityForm(formData), errors: {}, message };
}

/**
 * La porte des quatre gestes ciblés : le droit, puis la ligne **reçue**.
 *
 * **Elle ne refuse pas une entité archivée**, à la différence d'`openPerson` :
 * deux des quatre gestes qu'elle sert — rétablir, supprimer — ne s'exercent
 * que sur une ligne rangée. C'est donc chaque geste qui dit ce que l'archivage
 * lui interdit, et le contrôle porte sur la ligne **lue**, jamais sur ce que
 * l'écran affichait.
 */
async function openEntity(
  session: Session,
  entityId: string,
): Promise<{ entity: Row<typeof entities> } | { message: string }> {
  if (!session.can.manageDomain) return { message: RESERVED };

  /* `find` est scopée : une entité d'un autre domaine n'existe pas, elle ne
     « manque » pas. L'écran ne distingue pas les deux, et c'est voulu — dire
     laquelle des deux serait dire qu'un autre domaine porte cet identifiant. */
  const entity = await session.db.find(entities, entityId);
  if (!entity) return { message: GONE };

  return { entity };
}

/**
 * Le libellé est-il déjà pris dans ce domaine ?
 *
 * **La table ne porte aucune contrainte d'unicité**, et son commentaire dit
 * pourquoi : « une contrainte non demandée contraindrait l'écran de gestion dû
 * à C7 ». L'écran est là, et il choisit de refuser le doublon — mais dans
 * l'action, où le refus se dit en français et se nuance, plutôt qu'en base, où
 * il rendrait un 500.
 *
 * **Les entités archivées comptent**, et c'est le cœur du geste : le point
 * ouvert d'`ETAT.md` décrit exactement une seconde ligne créée sous un nom que
 * la première portait déjà. Le refus propose alors de rétablir, ce qui est le
 * geste juste — et il le propose en toutes lettres, faute de quoi il enverrait
 * chercher une ligne que la liste montre pourtant.
 */
async function duplicateOf(
  session: Session,
  label: string,
  exceptId?: string,
): Promise<string | null> {
  const existing = await listEntityLabels(session.db, {
    ...(exceptId ? { exceptId } : {}),
  });
  const twin = existing.find((row) => sameEntityLabel(row.label, label));
  if (!twin) return null;

  if (twin.archivedAt) {
    return `Une entité archivée porte déjà ce nom : « ${twin.label} ». Rétablissez-la plutôt que d'en créer une seconde.`;
  }
  return `Une entité porte déjà ce nom : « ${twin.label} ».`;
}

/** Les deux écrans que toute écriture d'entité change. */
function revalidate(): void {
  revalidatePath(ROUTES.admin);
  /* La liste des produits porte le filtre par entité et la colonne « Entité » :
     un libellé corrigé ou une entité rangée s'y lisent aussitôt. */
  revalidatePath(ROUTES.products);
}

/* ==========================================================================
   Créer et corriger
   ========================================================================== */

export async function createEntity(
  _previous: EntityFormState,
  formData: FormData,
): Promise<EntityFormState> {
  const session = await requireSession();
  if (!session.can.manageDomain) return refusal(formData, RESERVED);

  const { values, errors, input } = parseEntityForm(formData);
  if (!input) return { values, errors };

  const duplicate = await duplicateOf(session, input.label);
  if (duplicate) return { values, errors: { label: duplicate } };

  /* `position` n'est pas écrite : elle garde son défaut. Aucun écran de Vision
     ne la lit — tous les tris se font sur `label` —, et la poser ici ferait
     croire à un ordre que rien ne rend. */
  await session.db.insert(entities, { label: input.label });

  revalidate();
  return { values, errors: {}, ok: true };
}

export async function updateEntity(
  entityId: string,
  _previous: EntityFormState,
  formData: FormData,
): Promise<EntityFormState> {
  const session = await requireSession();

  const gate = await openEntity(session, entityId);
  if ("message" in gate) return refusal(formData, gate.message);

  /* Une entité archivée ne se corrige plus : le geste juste est de la
     rétablir. Le contrôle porte sur la ligne lue — le menu retire son entrée
     « Modifier » sur une ligne rangée, mais un formulaire récolté avant
     l'archivage se reposte tel quel ensuite. */
  if (gate.entity.archivedAt !== null) {
    return refusal(
      formData,
      "Cette entité est archivée : elle ne reçoit plus de correction. Rétablissez-la d'abord.",
    );
  }

  const { values, errors, input } = parseEntityForm(formData);
  if (!input) return { values, errors };

  const duplicate = await duplicateOf(session, input.label, entityId);
  if (duplicate) return { values, errors: { label: duplicate } };

  const updated = await session.db.update(entities, entityId, {
    label: input.label,
  });
  if (!updated) return refusal(formData, GONE);

  revalidate();
  return { values, errors: {}, ok: true };
}

/* ==========================================================================
   Ranger, sortir du rangement
   ========================================================================== */

/**
 * Le refus de l'archivage, en deux phrases plutôt qu'en une à trous.
 *
 * C'est la règle du dépôt depuis T5.1 : une phrase à trous ne se relit pas dans
 * ses deux états, et le singulier de `refusalOfLivingProjects` avait vécu trois
 * tickets avant d'être lu.
 */
function refusalOfLivingProducts(alive: number): string {
  if (alive > 1) {
    return `${formatProducts(alive)} vivants portent encore cette entité. Rattachez-les ailleurs ou archivez-les d'abord : ranger l'entité les laisserait dans la liste sans leur filtre.`;
  }
  return `${formatProducts(alive)} vivant porte encore cette entité. Rattachez-le ailleurs ou archivez-le d'abord : ranger l'entité le laisserait dans la liste sans son filtre.`;
}

/**
 * Archiver une entité : elle quitte les filtres et les formulaires, ses
 * produits gardent son libellé (règle 4).
 *
 * Le compte se lit par `count`, qui écarte les archivés d'elle-même : ce sont
 * bien les produits **vivants** qui s'opposent au rangement, pas ceux qu'on a
 * déjà rangés.
 */
export async function archiveEntity(
  entityId: string,
  _previous: ConfirmState,
  _formData: FormData,
): Promise<ConfirmState> {
  const session = await requireSession();

  const gate = await openEntity(session, entityId);
  if ("message" in gate) return { message: gate.message };

  // Déjà archivée : le geste n'a rien à faire, et `archive` ne toucherait rien.
  if (gate.entity.archivedAt !== null) return {};

  const alive = await session.db.count(products, {
    where: eq(products.entityId, entityId),
  });
  if (alive > 0) return { message: refusalOfLivingProducts(alive) };

  await session.db.archive(entities, entityId);

  revalidate();
  return { ok: true };
}

/**
 * Rétablir une entité archivée — le retour que sa ligne porte.
 *
 * **Un refus est muet**, comme `restoreProduct` : ce geste n'a aucune saisie à
 * rendre, et rien ne justifie de lui inventer un message que l'écran n'atteint
 * jamais en usage normal — le point d'entrée n'est rendu qu'au responsable de
 * domaine, sur une entité archivée.
 *
 * **Aucune confirmation** : rétablir ne retire rien, et un panneau pour dire
 * « voulez-vous vraiment remettre cette ligne en service » serait une friction
 * sans objet. La forme de `restoreProduct`, jusqu'au type de retour.
 */
export async function restoreEntity(entityId: string): Promise<void> {
  const session = await requireSession();

  const gate = await openEntity(session, entityId);
  if ("message" in gate) return;

  await session.db.restore(entities, entityId);

  revalidate();
}

/* ==========================================================================
   Supprimer — l'écart à la règle 4
   ========================================================================== */

/** Le jumeau de `refusalOfLivingProducts`, sur le décompte total. */
function refusalOfAnyProducts(total: number): string {
  if (total > 1) {
    return `${formatProducts(total)} portent encore cette entité, archivés compris. Une entité ne se supprime que si plus rien ne la référence — archivez-la plutôt.`;
  }
  return `${formatProducts(total)} porte encore cette entité, archivé compris. Une entité ne se supprime que si plus rien ne la référence — archivez-la plutôt.`;
}

/**
 * Supprimer une entité que rien ne référence — définitivement.
 *
 * **Le geste n'existe que pour la ligne créée par erreur** : un doublon
 * d'amorçage, une faute de frappe corrigée en créant une seconde ligne. Une
 * entité qui a qualifié un produit, fût-il archivé, ne s'efface pas — elle
 * s'archive, et la règle 4 reprend ses droits.
 *
 * **Le décompte parle, la clé étrangère décide.** Le `count` ci-dessous porte
 * `includeArchived: true` et sert à dire *combien* de produits s'y opposent ;
 * ce qui interdit réellement l'effacement est `on delete restrict`, que
 * `deleteRow` traduit en `IntegrityError`. Le second existe parce que le
 * premier ne peut pas tenir la fenêtre entre le compte et l'effacement — et
 * parce qu'une garde qui ne vit que dans l'appelant est une garde qu'un
 * prochain appelant oubliera.
 *
 * **Aucun rétablissement** : c'est la nature du geste, et c'est ce que le
 * panneau de confirmation dit avant de le proposer.
 */
export async function deleteEntity(
  entityId: string,
  _previous: ConfirmState,
  _formData: FormData,
): Promise<ConfirmState> {
  const session = await requireSession();

  const gate = await openEntity(session, entityId);
  if ("message" in gate) return { message: gate.message };

  const total = await session.db.count(products, {
    where: eq(products.entityId, entityId),
    includeArchived: true,
  });
  if (total > 0) return { message: refusalOfAnyProducts(total) };

  try {
    const removed = await session.db.deleteRow(entities, entityId);
    if (removed === 0) return { message: GONE };
  } catch (error) {
    /* La barrière qui décide. Elle se déclenche là où le décompte ne pouvait
       pas : une écriture concurrente entre les deux. */
    if (error instanceof IntegrityError) {
      return {
        message:
          "Un produit a été rattaché à cette entité entre-temps : elle ne peut plus être supprimée.",
      };
    }
    throw error;
  }

  revalidate();
  return { ok: true };
}

/* ==========================================================================
   Les quatre référentiels simples — T7.3

   Métiers, approches, compétences, échelle de maîtrise. Même forme que les
   entités, la suppression en moins : ils s'archivent et se rétablissent
   (arbitrage (g) de `tickets-C7.md`), et `DeletableTable` ne les nomme pas.
   ========================================================================== */

/** Le refus que les seize points d'entrée partagent, quand il vient du droit. */
const RESERVED_REFERENTIAL =
  "La gestion des référentiels est réservée au responsable de domaine.";

/** Le refus que les douze gestes ciblés partagent, quand la ligne a disparu. */
const GONE_REFERENTIAL = "Cette ligne n'existe plus dans ce domaine.";

/** Le refus d'une correction sur une ligne rangée — le geste juste est ailleurs. */
const ARCHIVED_REFERENTIAL =
  "Cette ligne est archivée : elle ne reçoit plus de correction. Rétablissez-la d'abord.";

/**
 * Un refus qui n'appartient à aucun champ, pour les huit formulaires.
 *
 * La saisie revient telle quelle : Vision ne jette jamais en silence ce qui a
 * été tapé, y compris quand ce qu'elle refuse n'est pas la saisie.
 */
function referentialRefusal(
  formData: FormData,
  message: string,
): ReferentialFormState {
  return { values: readReferentialForm(formData), errors: {}, message };
}

/**
 * La porte des douze gestes ciblés : le droit, puis la ligne **reçue**.
 *
 * **Générique, et elle peut l'être** : elle ne pose rien — ni domaine, ni
 * acteur, ni colonne. Elle lit. C'est l'écriture que la fiche refuse
 * d'indirecter, et l'écriture est plus bas, table par table.
 *
 * Elle ne refuse pas une ligne archivée, à la différence d'`openPerson` : un des
 * gestes qu'elle sert — rétablir — ne s'exerce que sur une ligne rangée. C'est
 * donc chaque geste qui dit ce que l'archivage lui interdit, et le contrôle
 * porte sur la ligne **lue**, jamais sur ce que l'écran affichait.
 */
async function openReferentialRow<T extends ArchivableTable>(
  session: Session,
  table: T,
  rowId: string,
): Promise<{ row: Row<T> } | { message: string }> {
  if (!session.can.manageDomain) return { message: RESERVED_REFERENTIAL };

  /* `find` est scopée : une ligne d'un autre domaine n'existe pas, elle ne
     « manque » pas. L'écran ne distingue pas les deux, et c'est voulu. */
  const row = await session.db.find(table, rowId);
  if (!row) return { message: GONE_REFERENTIAL };

  return { row };
}

/**
 * Le libellé est-il déjà pris dans ce référentiel ?
 *
 * **Aucune de ces tables ne porte de contrainte d'unicité**, et `schema.ts` dit
 * pourquoi pour l'échelle : « une contrainte non demandée contraindrait l'écran
 * de gestion dû à C7 ». L'écran est là, et il choisit de refuser le doublon —
 * mais dans l'action, où le refus se dit en français et se nuance, plutôt qu'en
 * base, où il rendrait un 500.
 *
 * **Les lignes archivées comptent**, et c'est le cœur du geste : le point ouvert
 * d'`ETAT.md` décrit exactement une seconde ligne créée sous un nom que la
 * première portait déjà. Le refus propose alors de rétablir, et il le propose en
 * toutes lettres — faute de quoi il enverrait chercher une ligne que la liste
 * montre pourtant. Jumeau de `duplicateOf`, sur les entités.
 */
async function duplicateReferentialOf(
  session: Session,
  table: SimpleReferentialTable,
  label: string,
  exceptId?: string,
): Promise<string | null> {
  const existing = await listReferentialLabels(session.db, table, {
    ...(exceptId ? { exceptId } : {}),
  });
  const twin = existing.find((row) => sameReferentialLabel(row.label, label));
  if (!twin) return null;

  if (twin.archivedAt) {
    return `Une ligne archivée porte déjà ce libellé : « ${twin.label} ». Rétablissez-la plutôt que d'en créer une seconde.`;
  }
  return `Une ligne porte déjà ce libellé : « ${twin.label} ».`;
}

/**
 * Les écrans que l'écriture d'un référentiel change.
 *
 * `/administration` toujours ; le reste selon ce que le libellé qualifie — un
 * métier se lit sur la liste transverse et sur l'Équipe, une approche sur la
 * liste transverse et sur la répartition de la vue d'ensemble (T7.2), une
 * compétence et un niveau sur l'Équipe seule. **Aucune page de détail** :
 * `revalidatePath` invalide une route, et les routes dynamiques se
 * rafraîchissent d'elles-mêmes — c'est la règle que `revalidate` tient déjà
 * au-dessus.
 */
function revalidateReferential(referential: Referential): void {
  revalidatePath(ROUTES.admin);

  switch (referential) {
    case "metiers":
      revalidatePath(ROUTES.projects);
      revalidatePath(ROUTES.team);
      return;
    case "approches":
      revalidatePath(ROUTES.projects);
      revalidatePath(ROUTES.overview);
      return;
    case "competences":
    case "niveaux":
      revalidatePath(ROUTES.team);
      return;
    case "entites":
      revalidatePath(ROUTES.products);
      return;
  }
}

/* --------------------------------------------------------------------------
   Ce qui s'oppose au rangement, référentiel par référentiel

   Quatre fonctions et non une, parce que ce sont quatre phrases et non une
   phrase à trous : la règle du dépôt depuis T5.1, où le singulier de
   `refusalOfLivingProjects` avait vécu trois tickets avant d'être lu. Chacune
   rend `null` quand rien ne s'oppose — c'est ce `null` que l'archivage attend.
   -------------------------------------------------------------------------- */

function refusalOfJobUsage(usage: ReferentialUsage): string | null {
  if (usage.projects > 1) {
    return `${formatProjects(usage.projects)} vivants déclarent encore ce métier. Retirez-le de leur fiche ou archivez-les d'abord : ranger le métier les laisserait dans la liste sans leur filtre.`;
  }
  if (usage.projects === 1) {
    return `${formatProjects(1)} vivant déclare encore ce métier. Retirez-le de sa fiche ou archivez-le d'abord : ranger le métier le laisserait dans la liste sans son filtre.`;
  }
  if (usage.persons > 1) {
    return `${formatPersons(usage.persons)} portent encore ce métier. Donnez-leur un autre métier ou archivez-les d'abord : ranger le métier laisserait leur fiche sans filtre.`;
  }
  if (usage.persons === 1) {
    return `${formatPersons(1)} porte encore ce métier. Donnez-lui un autre métier ou archivez-la d'abord : ranger le métier laisserait sa fiche sans filtre.`;
  }
  return null;
}

function refusalOfApproachUsage(usage: ReferentialUsage): string | null {
  if (usage.projects > 1) {
    return `${formatProjects(usage.projects)} vivants déclarent encore cette approche. Retirez-la de leur fiche ou archivez-les d'abord : ranger l'approche les laisserait dans la liste sans leur filtre.`;
  }
  if (usage.projects === 1) {
    return `${formatProjects(1)} vivant déclare encore cette approche. Retirez-la de sa fiche ou archivez-le d'abord : ranger l'approche le laisserait dans la liste sans son filtre.`;
  }
  if (usage.activities > 1) {
    return `${formatActivities(usage.activities)} vivantes portent encore cette approche. Corrigez-les ou archivez-les d'abord : ranger l'approche les laisserait sur la roadmap sans leur manière.`;
  }
  if (usage.activities === 1) {
    return `${formatActivities(1)} vivante porte encore cette approche. Corrigez-la ou archivez-la d'abord : ranger l'approche la laisserait sur la roadmap sans sa manière.`;
  }
  return null;
}

function refusalOfSkillUsage(usage: ReferentialUsage): string | null {
  if (usage.persons > 1) {
    return `${formatPersons(usage.persons)} déclarent encore cette compétence. Retirez-la de leur fiche ou archivez-les d'abord : ranger la compétence la laisserait sur leur radar sans qu'on puisse la reprendre.`;
  }
  if (usage.persons === 1) {
    return `${formatPersons(1)} déclare encore cette compétence. Retirez-la de sa fiche ou archivez-la d'abord : ranger la compétence la laisserait sur son radar sans qu'on puisse la reprendre.`;
  }
  return null;
}

function refusalOfLevelUsage(usage: ReferentialUsage): string | null {
  /* **Des déclarations, jamais des personnes** : une personne en porte
     plusieurs au même niveau, et c'est chaque ligne de `person_skills` qui
     retient le rang (`restrict`). */
  if (usage.declarations > 1) {
    return `${formatDeclarations(usage.declarations)} citent encore ce niveau. Changez leur niveau ou archivez les personnes qui les portent : ranger le niveau laisserait leur radar sans graduation.`;
  }
  if (usage.declarations === 1) {
    return `${formatDeclarations(1)} cite encore ce niveau. Changez son niveau ou archivez la personne qui la porte : ranger le niveau laisserait son radar sans graduation.`;
  }
  return null;
}

/* --------------------------------------------------------------------------
   Métiers — `jobs`
   -------------------------------------------------------------------------- */

export async function createJob(
  _previous: ReferentialFormState,
  formData: FormData,
): Promise<ReferentialFormState> {
  const session = await requireSession();
  if (!session.can.manageDomain) {
    return referentialRefusal(formData, RESERVED_REFERENTIAL);
  }

  const { values, errors, input } = parseReferentialForm(
    formData,
    ORDERED_BY_POSITION,
  );
  if (!input) return { values, errors };

  const duplicate = await duplicateReferentialOf(session, jobs, input.label);
  if (duplicate) return { values, errors: { label: duplicate } };

  await session.db.insert(jobs, {
    label: input.label,
    ...(input.position === undefined ? {} : { position: input.position }),
  });

  revalidateReferential("metiers");
  return { values, errors: {}, ok: true };
}

export async function updateJob(
  jobId: string,
  _previous: ReferentialFormState,
  formData: FormData,
): Promise<ReferentialFormState> {
  const session = await requireSession();

  const gate = await openReferentialRow(session, jobs, jobId);
  if ("message" in gate) return referentialRefusal(formData, gate.message);
  if (gate.row.archivedAt !== null) {
    return referentialRefusal(formData, ARCHIVED_REFERENTIAL);
  }

  const { values, errors, input } = parseReferentialForm(formData, ORDERED_BY_POSITION);
  if (!input) return { values, errors };

  const duplicate = await duplicateReferentialOf(
    session,
    jobs,
    input.label,
    jobId,
  );
  if (duplicate) return { values, errors: { label: duplicate } };

  const updated = await session.db.update(jobs, jobId, {
    label: input.label,
    ...(input.position === undefined ? {} : { position: input.position }),
  });
  if (!updated) return referentialRefusal(formData, GONE_REFERENTIAL);

  revalidateReferential("metiers");
  return { values, errors: {}, ok: true };
}

export async function archiveJob(
  jobId: string,
  _previous: ConfirmState,
  _formData: FormData,
): Promise<ConfirmState> {
  const session = await requireSession();

  const gate = await openReferentialRow(session, jobs, jobId);
  if ("message" in gate) return { message: gate.message };
  if (gate.row.archivedAt !== null) return {};

  /* **Le décompte est refait ici**, et c'est lui qui protège : le panneau
     l'annonce, l'écran retire l'entrée de menu, et ni l'un ni l'autre n'a jamais
     tenu un point d'entrée HTTP (arbitrage (j) de `tickets-C7.md`). */
  const usage = await countReferentialUsage(session.db, "metiers", jobId);
  const refusal = refusalOfJobUsage(usage);
  if (refusal) return { message: refusal };

  await session.db.archive(jobs, jobId);

  revalidateReferential("metiers");
  return { ok: true };
}

export async function restoreJob(jobId: string): Promise<void> {
  const session = await requireSession();

  const gate = await openReferentialRow(session, jobs, jobId);
  if ("message" in gate) return;

  await session.db.restore(jobs, jobId);

  revalidateReferential("metiers");
}

/* --------------------------------------------------------------------------
   Approches — `approaches`
   -------------------------------------------------------------------------- */

export async function createApproach(
  _previous: ReferentialFormState,
  formData: FormData,
): Promise<ReferentialFormState> {
  const session = await requireSession();
  if (!session.can.manageDomain) {
    return referentialRefusal(formData, RESERVED_REFERENTIAL);
  }

  const { values, errors, input } = parseReferentialForm(
    formData,
    ORDERED_BY_POSITION,
  );
  if (!input) return { values, errors };

  const duplicate = await duplicateReferentialOf(
    session,
    approaches,
    input.label,
  );
  if (duplicate) return { values, errors: { label: duplicate } };

  await session.db.insert(approaches, {
    label: input.label,
    ...(input.position === undefined ? {} : { position: input.position }),
  });

  revalidateReferential("approches");
  return { values, errors: {}, ok: true };
}

export async function updateApproach(
  approachId: string,
  _previous: ReferentialFormState,
  formData: FormData,
): Promise<ReferentialFormState> {
  const session = await requireSession();

  const gate = await openReferentialRow(session, approaches, approachId);
  if ("message" in gate) return referentialRefusal(formData, gate.message);
  if (gate.row.archivedAt !== null) {
    return referentialRefusal(formData, ARCHIVED_REFERENTIAL);
  }

  const { values, errors, input } = parseReferentialForm(
    formData,
    ORDERED_BY_POSITION,
  );
  if (!input) return { values, errors };

  const duplicate = await duplicateReferentialOf(
    session,
    approaches,
    input.label,
    approachId,
  );
  if (duplicate) return { values, errors: { label: duplicate } };

  const updated = await session.db.update(approaches, approachId, {
    label: input.label,
    ...(input.position === undefined ? {} : { position: input.position }),
  });
  if (!updated) return referentialRefusal(formData, GONE_REFERENTIAL);

  revalidateReferential("approches");
  return { values, errors: {}, ok: true };
}

export async function archiveApproach(
  approachId: string,
  _previous: ConfirmState,
  _formData: FormData,
): Promise<ConfirmState> {
  const session = await requireSession();

  const gate = await openReferentialRow(session, approaches, approachId);
  if ("message" in gate) return { message: gate.message };
  if (gate.row.archivedAt !== null) return {};

  const usage = await countReferentialUsage(
    session.db,
    "approches",
    approachId,
  );
  const refusal = refusalOfApproachUsage(usage);
  if (refusal) return { message: refusal };

  await session.db.archive(approaches, approachId);

  revalidateReferential("approches");
  return { ok: true };
}

export async function restoreApproach(approachId: string): Promise<void> {
  const session = await requireSession();

  const gate = await openReferentialRow(session, approaches, approachId);
  if ("message" in gate) return;

  await session.db.restore(approaches, approachId);

  revalidateReferential("approches");
}

/* --------------------------------------------------------------------------
   Compétences — `skills`
   -------------------------------------------------------------------------- */

export async function createSkill(
  _previous: ReferentialFormState,
  formData: FormData,
): Promise<ReferentialFormState> {
  const session = await requireSession();
  if (!session.can.manageDomain) {
    return referentialRefusal(formData, RESERVED_REFERENTIAL);
  }

  const { values, errors, input } = parseReferentialForm(formData, ORDERED_BY_POSITION);
  if (!input) return { values, errors };

  const duplicate = await duplicateReferentialOf(session, skills, input.label);
  if (duplicate) return { values, errors: { label: duplicate } };

  await session.db.insert(skills, {
    label: input.label,
    ...(input.position === undefined ? {} : { position: input.position }),
  });

  revalidateReferential("competences");
  return { values, errors: {}, ok: true };
}

export async function updateSkill(
  skillId: string,
  _previous: ReferentialFormState,
  formData: FormData,
): Promise<ReferentialFormState> {
  const session = await requireSession();

  const gate = await openReferentialRow(session, skills, skillId);
  if ("message" in gate) return referentialRefusal(formData, gate.message);
  if (gate.row.archivedAt !== null) {
    return referentialRefusal(formData, ARCHIVED_REFERENTIAL);
  }

  const { values, errors, input } = parseReferentialForm(formData, ORDERED_BY_POSITION);
  if (!input) return { values, errors };

  const duplicate = await duplicateReferentialOf(
    session,
    skills,
    input.label,
    skillId,
  );
  if (duplicate) return { values, errors: { label: duplicate } };

  const updated = await session.db.update(skills, skillId, {
    label: input.label,
    ...(input.position === undefined ? {} : { position: input.position }),
  });
  if (!updated) return referentialRefusal(formData, GONE_REFERENTIAL);

  revalidateReferential("competences");
  return { values, errors: {}, ok: true };
}

export async function archiveSkill(
  skillId: string,
  _previous: ConfirmState,
  _formData: FormData,
): Promise<ConfirmState> {
  const session = await requireSession();

  const gate = await openReferentialRow(session, skills, skillId);
  if ("message" in gate) return { message: gate.message };
  if (gate.row.archivedAt !== null) return {};

  const usage = await countReferentialUsage(session.db, "competences", skillId);
  const refusal = refusalOfSkillUsage(usage);
  if (refusal) return { message: refusal };

  await session.db.archive(skills, skillId);

  revalidateReferential("competences");
  return { ok: true };
}

export async function restoreSkill(skillId: string): Promise<void> {
  const session = await requireSession();

  const gate = await openReferentialRow(session, skills, skillId);
  if ("message" in gate) return;

  await session.db.restore(skills, skillId);

  revalidateReferential("competences");
}

/* --------------------------------------------------------------------------
   Échelle de maîtrise — `skill_levels`

   Le seul des quatre qui saisisse un `rank` plutôt qu'une `position` : c'est
   `rank` qui ordonne l'échelle dans les quatre lectures qui la servent, et
   `skill_levels.position` n'a aucun lecteur.
   -------------------------------------------------------------------------- */

export async function createSkillLevel(
  _previous: ReferentialFormState,
  formData: FormData,
): Promise<ReferentialFormState> {
  const session = await requireSession();
  if (!session.can.manageDomain) {
    return referentialRefusal(formData, RESERVED_REFERENTIAL);
  }

  const { values, errors, input } = parseReferentialForm(formData, ORDERED_BY_RANK);
  if (!input || input.rank === undefined) return { values, errors };

  const duplicate = await duplicateReferentialOf(
    session,
    skillLevels,
    input.label,
  );
  if (duplicate) return { values, errors: { label: duplicate } };

  await session.db.insert(skillLevels, {
    label: input.label,
    rank: input.rank,
  });

  revalidateReferential("niveaux");
  return { values, errors: {}, ok: true };
}

export async function updateSkillLevel(
  levelId: string,
  _previous: ReferentialFormState,
  formData: FormData,
): Promise<ReferentialFormState> {
  const session = await requireSession();

  const gate = await openReferentialRow(session, skillLevels, levelId);
  if ("message" in gate) return referentialRefusal(formData, gate.message);
  if (gate.row.archivedAt !== null) {
    return referentialRefusal(formData, ARCHIVED_REFERENTIAL);
  }

  const { values, errors, input } = parseReferentialForm(formData, ORDERED_BY_RANK);
  if (!input || input.rank === undefined) return { values, errors };

  const duplicate = await duplicateReferentialOf(
    session,
    skillLevels,
    input.label,
    levelId,
  );
  if (duplicate) return { values, errors: { label: duplicate } };

  const updated = await session.db.update(skillLevels, levelId, {
    label: input.label,
    rank: input.rank,
  });
  if (!updated) return referentialRefusal(formData, GONE_REFERENTIAL);

  revalidateReferential("niveaux");
  return { values, errors: {}, ok: true };
}

export async function archiveSkillLevel(
  levelId: string,
  _previous: ConfirmState,
  _formData: FormData,
): Promise<ConfirmState> {
  const session = await requireSession();

  const gate = await openReferentialRow(session, skillLevels, levelId);
  if ("message" in gate) return { message: gate.message };
  if (gate.row.archivedAt !== null) return {};

  const usage = await countReferentialUsage(session.db, "niveaux", levelId);
  const refusal = refusalOfLevelUsage(usage);
  if (refusal) return { message: refusal };

  await session.db.archive(skillLevels, levelId);

  revalidateReferential("niveaux");
  return { ok: true };
}

export async function restoreSkillLevel(levelId: string): Promise<void> {
  const session = await requireSession();

  const gate = await openReferentialRow(session, skillLevels, levelId);
  if ("message" in gate) return;

  await session.db.restore(skillLevels, levelId);

  revalidateReferential("niveaux");
}
