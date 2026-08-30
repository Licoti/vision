/**
 * La résolution des trois panneaux de la page **Administration** (21/08/2026,
 * rendus multi-référentiels par T7.3, portés à neuf référentiels par T7.4).
 *
 * **Deux chemins, une seule résolution.** L'URL reste une adresse valide —
 * coller `?referentiel=metiers&ligne=<identifiant>` ouvre encore le panneau, au
 * rendu serveur — et le clic passe par `DrawerHost`, qui n'écrit plus l'adresse
 * (TD.2). Les faire diverger mettrait une règle de droit à deux endroits, et
 * c'est exactement ce qu'une refonte de mécanisme ne doit pas produire.
 *
 * **Les disciplines tenues, sans exception.** Le droit s'énonce **avant** toute
 * lecture : il ne dépend d'aucun identifiant. Le référentiel est rétréci par
 * `asAdminRequest` avant d'atteindre le `switch` ci-dessous. La forme de l'UUID
 * se vérifie ensuite, **avant** la base — une colonne `uuid` interrogée avec
 * n'importe quoi rend une erreur PostgreSQL, donc un 500, là où l'on attend la
 * page nue. La cible est enfin confrontée au domaine par la lecture scopée
 * elle-même : une ligne d'un autre domaine n'existe pas, elle ne « manque » pas.
 *
 * **Trois écritures, aucune lecture.** À la différence des pages produit et
 * Équipe, cet écran n'a pas la paire « une clé pour lire, une clé pour
 * écrire » : la page entière est réservée à `manageDomain`, il n'y a donc pas
 * deux droits à séparer. Une ligne de référentiel est un libellé et un ordre —
 * la ligne de liste dit tout ce qu'il y aurait à détailler.
 *
 * **Le décompte est lu ici pour être dit, jamais pour décider.** Le panneau
 * annonce ce qui s'oppose au geste avant qu'on l'exerce, plutôt que de le
 * refuser après coup ; ce qui protège est l'action, qui recompte sur ce qu'elle
 * reçoit (arbitrage (j) de `tickets-C7.md`). Un panneau absent du rendu n'a
 * jamais protégé le point d'entrée HTTP qui l'accompagne.
 */

import { eq } from "drizzle-orm";
import type { ReactNode } from "react";

import { ActivityTypePanel } from "@/components/admin/activity-type-panel";
import { ReferentialPanel } from "@/components/admin/referential-panel";
import { EntityPanel } from "@/components/admin/entity-panel";
import { StarterPanel } from "@/components/admin/starter-panel";
import { StatusPanel } from "@/components/admin/status-panel";
import { ToolPanel } from "@/components/admin/tool-panel";
import { ConfirmPanel } from "@/components/ui/confirm-panel";
import type { Session } from "@/lib/auth/session";
import {
  activityTypes,
  approaches,
  entities,
  jobs,
  products,
  projectStatuses,
  skillLevels,
  skills,
  starters,
  tools,
} from "@/lib/db/schema";
import type { AdminDrawerRequest, DrawerContent } from "@/lib/drawers/types";
import { formatProducts, REFERENTIAL_NOUN } from "@/lib/format";
import { toActivityTypeFormValues } from "@/lib/forms/activity-type";
import { toEntityFormValues } from "@/lib/forms/entity";
import { toProjectStatusFormValues } from "@/lib/forms/project-status";
import {
  ORDERED_BY_POSITION,
  ORDERED_BY_RANK,
  toReferentialFormValues,
  type ReferentialShape,
} from "@/lib/forms/referential";
import { toStarterFormValues } from "@/lib/forms/starter";
import { toToolFormValues } from "@/lib/forms/tool";
import {
  ARCHIVE_PANEL_PARAM,
  DELETE_PANEL_PARAM,
  REFERENTIAL_ROW_NEW,
  REFERENTIAL_ROW_PARAM,
  type Referential,
} from "@/lib/navigation";
import {
  listResultToolOptions,
  type ResultToolOption,
} from "@/lib/queries/activities";
import {
  countReferentialUsage,
  isUnused,
  type ManagedReferential,
  type ManagedReferentialRow,
  type ReferentialUsage,
} from "@/lib/queries/referentials";
import { isUuid } from "@/lib/uuid";

import {
  archiveActivityType,
  archiveApproach,
  archiveEntity,
  archiveJob,
  archiveProjectStatus,
  archiveSkill,
  archiveSkillLevel,
  archiveStarter,
  archiveTool,
  createActivityType,
  createApproach,
  createEntity,
  createJob,
  createProjectStatus,
  createSkill,
  createSkillLevel,
  createStarter,
  createTool,
  deleteEntity,
  updateActivityType,
  updateApproach,
  updateEntity,
  updateJob,
  updateProjectStatus,
  updateSkill,
  updateSkillLevel,
  updateStarter,
  updateTool,
} from "@/app/(app)/administration/actions";

/**
 * Ce que chaque référentiel donne au panneau : sa table, son geste d'archivage,
 * et la façon de nommer une de ses lignes.
 *
 * **Ce n'est pas une indirection d'écriture.** Les trente-deux actions restent
 * nommées une à une, chacune liée à sa table côté serveur ; cette table-ci ne
 * fait que les **choisir** à partir d'une valeur déjà rétrécie. Ce que la fiche
 * de T7.3 refuse est de faire écrire une fonction générique, pas de rendre un
 * panneau.
 *
 * **`find` est une fonction et non une table, et le compilateur l'exige.**
 * `session.db.find(table, id)` sur une **union** de huit tables ne rend pas
 * l'union des huit lignes : il rend leurs colonnes **communes**, c'est-à-dire
 * `id`, `archived_at` et les estampilles. Cela suffisait tant que les quatre
 * tables de T7.3 portaient toutes un `label` ; `tools` ne le porte pas, et le
 * type s'est effondré. Une lecture par table rend au contraire une union qui se
 * rétrécit par un `in` — donc sans un seul `as`.
 */
const MANAGED = {
  metiers: {
    find: (session: Session, id: string) => session.db.find(jobs, id),
    archive: archiveJob,
  },
  approches: {
    find: (session: Session, id: string) => session.db.find(approaches, id),
    archive: archiveApproach,
  },
  competences: {
    find: (session: Session, id: string) => session.db.find(skills, id),
    archive: archiveSkill,
  },
  niveaux: {
    find: (session: Session, id: string) => session.db.find(skillLevels, id),
    archive: archiveSkillLevel,
  },
  statuts: {
    find: (session: Session, id: string) => session.db.find(projectStatuses, id),
    archive: archiveProjectStatus,
  },
  types: {
    find: (session: Session, id: string) => session.db.find(activityTypes, id),
    archive: archiveActivityType,
  },
  outils: {
    find: (session: Session, id: string) => session.db.find(tools, id),
    archive: archiveTool,
  },
  pistes: {
    find: (session: Session, id: string) => session.db.find(starters, id),
    archive: archiveStarter,
  },
} as const satisfies Record<ManagedReferential, { [k: string]: unknown }>;

/**
 * Ce que les quatre référentiels **simples** donnent en plus au panneau commun :
 * la forme de leur formulaire, et la phrase qui explique ce que leur libellé
 * qualifie.
 *
 * Ils sont quatre et non huit, et c'est le sujet de T7.4 : un statut, un type
 * d'activité, un outil et une piste portent de la logique, donc des champs que
 * `ReferentialPanel` ne connaît pas. Chacun a son panneau.
 */
const SIMPLE = {
  metiers: {
    create: createJob,
    update: updateJob,
    shape: ORDERED_BY_POSITION,
    labelNote:
      "Le métier tel qu'il se nomme dans le centre. Il qualifie une personne, et il filtre la liste transverse des accompagnements.",
  },
  approches: {
    create: createApproach,
    update: updateApproach,
    shape: ORDERED_BY_POSITION,
    labelNote:
      "La manière d'accompagner : Research, Design Thinking, Audit UX… Elle qualifie un accompagnement et chacune de ses activités.",
  },
  competences: {
    create: createSkill,
    update: updateSkill,
    shape: ORDERED_BY_POSITION,
    labelNote:
      "Ce qu'une personne du centre sait faire. Une compétence n'est pas un métier : on en porte plusieurs, chacune à son niveau.",
  },
  niveaux: {
    create: createSkillLevel,
    update: updateSkillLevel,
    shape: ORDERED_BY_RANK,
    labelNote:
      "Le nom du niveau, tel que le centre le dit. Un domaine renomme « Avancé » sans renommer son rang.",
  },
} as const satisfies Record<
  "metiers" | "approches" | "competences" | "niveaux",
  { shape: ReferentialShape; labelNote: string; [k: string]: unknown }
>;

export async function resolveAdminDrawer(
  session: Session,
  request: AdminDrawerRequest,
): Promise<DrawerContent | null> {
  /* Le droit d'abord, une seule fois pour les trois panneaux : il ne dépend
     d'aucun identifiant, et l'écran entier lui appartient. Qui ne l'a pas
     n'atteint de toute façon pas cette page — elle rend 404. */
  if (!session.can.manageDomain) return null;

  switch (request.kind) {
    /* ------------------------------------------------------------------ */
    case "row":
      return request.referential === "entites"
        ? entityForm(session, request.id)
        : managedForm(session, request.referential, request.id);

    /* ------------------------------------------------------------------ */
    case "archive":
      return request.referential === "entites"
        ? entityArchive(session, request.id)
        : managedArchive(session, request.referential, request.id);

    /* ------------------------------------------------------------------ */
    case "delete":
      /* La suppression n'existe que sur les entités — arbitrage (g) de
         `tickets-C7.md`, et c'est déjà ce que le type dit : cette demande ne
         porte aucun référentiel. */
      return entityDelete(session, request.id);
  }
}

/* ==========================================================================
   Les entités — le référentiel qui se supprime
   ========================================================================== */

async function entityForm(
  session: Session,
  id: string | undefined,
): Promise<DrawerContent | null> {
  /* Sans identifiant : la création. Le panneau est vide, et l'action liée n'a
     rien à recevoir. */
  if (id === undefined) {
    return {
      titleId: "panneau-entite-titre",
      title: "Ajouter une entité",
      subtitles: ["Référentiel du domaine"],
      body: <EntityPanel action={createEntity} />,
    };
  }

  if (!isUuid(id)) return null;

  const entity = await session.db.find(entities, id);
  /* Une entité archivée ne se corrige pas : le geste juste est de la rétablir,
     et l'action le refuse de son côté — ce qui est le seul contrôle qui
     protège. */
  if (!entity || entity.archivedAt !== null) return null;

  return {
    titleId: "panneau-entite-titre",
    title: "Modifier l'entité",
    subtitles: [entity.label],
    /* L'action est liée **côté serveur** à l'entité : l'identifiant sort de la
       saisie. Ce n'est pas un verrou — Next sérialise les arguments liés dans un
       champ `$ACTION_…`, réécrivable. Le verrou est dans l'action, qui interroge
       `manageDomain` puis rapproche l'entité reçue du domaine courant. */
    body: (
      <EntityPanel
        action={updateEntity.bind(null, entity.id)}
        submitLabel="Enregistrer les modifications"
        initial={toEntityFormValues(entity)}
      />
    ),
  };
}

async function entityArchive(
  session: Session,
  id: string,
): Promise<DrawerContent | null> {
  // On ne confirme pas l'archivage de ce qui est déjà rangé.
  if (!isUuid(id)) return null;

  const entity = await session.db.find(entities, id);
  if (!entity || entity.archivedAt !== null) return null;

  /* Le décompte est **lu ici pour être dit** : le panneau annonce ce qui
     s'oppose au geste avant qu'on l'exerce, plutôt que de le refuser après
     coup. Ce n'est pas lui qui décide — `archiveEntity` recompte. */
  const alive = await session.db.count(products, {
    where: eq(products.entityId, entity.id),
  });

  return {
    titleId: "panneau-confirmation-titre",
    title: "Archiver cette entité",
    subtitles: [entity.label],
    body: (
      <ConfirmPanel
        action={archiveEntity.bind(null, entity.id)}
        submitLabel="Archiver cette entité"
        pendingLabel="Archivage…"
      >
        <div className="flex flex-col gap-3 text-sm text-content-neutral-dark">
          <p>
            Cette entité disparaît des filtres de la liste des produits et des
            entités proposées à un produit. Rien n&apos;est supprimé.
          </p>
          <p>
            Les produits déjà rattachés gardent son nom : c&apos;est la mémoire
            de l&apos;accompagnement, elle ne se perd pas.
          </p>
          {alive > 0 ? (
            <p className="font-semibold">
              {formatProducts(alive)}
              {alive > 1
                ? " vivants portent encore cette entité : le geste sera refusé tant qu'ils ne sont pas rattachés ailleurs ou archivés."
                : " vivant porte encore cette entité : le geste sera refusé tant qu'il n'est pas rattaché ailleurs ou archivé."}
            </p>
          ) : (
            <p>Le geste se défait : une entité archivée se rétablit.</p>
          )}
        </div>
      </ConfirmPanel>
    ),
  };
}

async function entityDelete(
  session: Session,
  id: string,
): Promise<DrawerContent | null> {
  if (!isUuid(id)) return null;

  const entity = await session.db.find(entities, id);
  if (!entity) return null;

  /* Le décompte total, archivés compris : c'est celui que la clé étrangère
     `on delete restrict` opposera. Il est lu pour être **dit**, comme
     ci-dessus — `deleteEntity` recompte, et la base tranche. */
  const total = await session.db.count(products, {
    where: eq(products.entityId, entity.id),
    includeArchived: true,
  });

  return {
    titleId: "panneau-confirmation-titre",
    title: "Supprimer cette entité",
    subtitles: [entity.label],
    body: (
      <ConfirmPanel
        action={deleteEntity.bind(null, entity.id)}
        submitLabel="Supprimer définitivement"
        pendingLabel="Suppression…"
      >
        <div className="flex flex-col gap-3 text-sm text-content-neutral-dark">
          {/* Le panneau dit ce que le geste a d'exceptionnel avant de le
              proposer : c'est la seule suppression de cet écran, et elle ne se
              défait pas. */}
          <p className="font-semibold">
            Ce geste ne se défait pas. La ligne est effacée de la base, elle
            n&apos;est pas rangée.
          </p>
          <p>
            Il n&apos;existe que pour une entité créée par erreur — un doublon,
            une faute de frappe corrigée en créant une seconde ligne. Une entité
            qui a servi s&apos;archive.
          </p>
          {total > 0 ? (
            <p className="font-semibold">
              {formatProducts(total)}
              {total > 1
                ? " portent encore cette entité, archivés compris : le geste sera refusé."
                : " porte encore cette entité, archivé compris : le geste sera refusé."}
            </p>
          ) : (
            <p>Aucun produit ne la référence : rien ne se perdra.</p>
          )}
        </div>
      </ConfirmPanel>
    ),
  };
}

/* ==========================================================================
   Les huit référentiels qui ne se suppriment pas — T7.3 et T7.4
   ========================================================================== */

/**
 * Le corps du formulaire, référentiel par référentiel.
 *
 * **Cinq panneaux et non un**, et c'est le geste central de T7.4 : quatre
 * référentiels portent une logique — une `nature`, une `family`, un genre —, et
 * étendre `ReferentialPanel` d'un champ conditionnel par colonne en aurait fait
 * une forme qu'on ne peut plus relire dans aucun de ses états. Le `switch`
 * ci-dessous **choisit** un panneau ; il n'en paramètre aucun.
 *
 * `row` est `undefined` à la création. Chaque branche lie alors l'action de
 * création, et pré-remplit sinon — l'identifiant sort de la saisie, **et ce
 * n'est pas un verrou** : Next sérialise les arguments liés dans un champ
 * `$ACTION_…`, réécrivable. Le verrou est dans l'action.
 */
function managedFormBody(
  referential: ManagedReferential,
  row: ManagedReferentialRow | undefined,
  toolOptions: ResultToolOption[],
): ReactNode {
  const noun = REFERENTIAL_NOUN[referential];

  switch (referential) {
    case "metiers":
    case "approches":
    case "competences":
    case "niveaux": {
      const kind = SIMPLE[referential];
      if (!row) {
        return (
          <ReferentialPanel
            action={kind.create}
            shape={kind.shape}
            labelNote={kind.labelNote}
            submitLabel={`Ajouter ${noun.indefinite}`}
          />
        );
      }
      /* `"label" in row` retrouve la table sans `as` : la ligne vient du même
         référentiel que le `switch`, et cette branche est donc inatteignable —
         mais c'est le compilateur qui l'établit, et non un commentaire. */
      if (!("label" in row)) return null;
      return (
        <ReferentialPanel
          action={kind.update.bind(null, row.id)}
          shape={kind.shape}
          labelNote={kind.labelNote}
          submitLabel="Enregistrer les modifications"
          initial={toReferentialFormValues(row)}
        />
      );
    }

    case "statuts":
      if (!row) {
        return (
          <StatusPanel
            action={createProjectStatus}
            submitLabel={`Ajouter ${noun.indefinite}`}
          />
        );
      }
      if (!("nature" in row)) return null;
      return (
        <StatusPanel
          action={updateProjectStatus.bind(null, row.id)}
          submitLabel="Enregistrer les modifications"
          initial={toProjectStatusFormValues(row)}
        />
      );

    case "types":
      if (!row) {
        return (
          <ActivityTypePanel
            action={createActivityType}
            tools={toolOptions}
            submitLabel={`Ajouter ${noun.indefinite}`}
          />
        );
      }
      if (!("family" in row)) return null;
      return (
        <ActivityTypePanel
          action={updateActivityType.bind(null, row.id)}
          tools={toolOptions}
          submitLabel="Enregistrer les modifications"
          initial={toActivityTypeFormValues(row)}
        />
      );

    case "outils":
      if (!row) {
        return (
          <ToolPanel
            action={createTool}
            submitLabel={`Ajouter ${noun.indefinite}`}
          />
        );
      }
      if (!("name" in row)) return null;
      return (
        <ToolPanel
          action={updateTool.bind(null, row.id)}
          submitLabel="Enregistrer les modifications"
          initial={toToolFormValues(row)}
        />
      );

    case "pistes":
      if (!row) {
        return (
          <StarterPanel
            action={createStarter}
            tools={toolOptions}
            submitLabel={`Ajouter ${noun.indefinite}`}
          />
        );
      }
      if (!("summary" in row)) return null;
      return (
        <StarterPanel
          action={updateStarter.bind(null, row.id)}
          tools={toolOptions}
          submitLabel="Enregistrer les modifications"
          initial={toStarterFormValues(row)}
        />
      );
  }
}

/**
 * Les outils du domaine — **lus seulement pour les deux référentiels qui en
 * choisissent un**.
 *
 * `listResultToolOptions` porte déjà exactement la règle attendue, `keepToolId`
 * compris : l'outil déjà porté par la ligne qu'on corrige reste dans la liste
 * même archivé, et n'apparaît nulle part ailleurs. Son nom dit « Result » parce
 * que le panneau de résultat a été son premier appelant (T4.4) ; il en a trois
 * depuis T7.4, et le renommer aurait ouvert `lib/queries/activities.ts`, hors du
 * périmètre du ticket.
 *
 * Les six autres référentiels n'appellent rien : une requête qu'aucun champ ne
 * lit est une requête de trop.
 */
async function toolOptionsFor(
  session: Session,
  referential: ManagedReferential,
  keepToolId: string | null,
): Promise<ResultToolOption[]> {
  if (referential !== "types" && referential !== "pistes") return [];
  return listResultToolOptions(session.db, keepToolId ? { keepToolId } : {});
}

/** L'outil déjà porté par la ligne, quel que soit le nom de sa colonne. */
function heldToolOf(row: ManagedReferentialRow): string | null {
  if ("defaultToolId" in row) return row.defaultToolId;
  if ("toolId" in row) return row.toolId;
  return null;
}

async function managedForm(
  session: Session,
  referential: ManagedReferential,
  id: string | undefined,
): Promise<DrawerContent | null> {
  const kind = MANAGED[referential];
  const noun = REFERENTIAL_NOUN[referential];

  if (id === undefined) {
    return {
      titleId: "panneau-ligne-titre",
      title: `Ajouter ${noun.indefinite}`,
      subtitles: ["Référentiel du domaine"],
      body: managedFormBody(
        referential,
        undefined,
        await toolOptionsFor(session, referential, null),
      ),
    };
  }

  if (!isUuid(id)) return null;

  const row: ManagedReferentialRow | undefined = await kind.find(session, id);
  /* Une ligne archivée ne se corrige pas : le geste juste est de la rétablir,
     et l'action le refuse de son côté. */
  if (!row || row.archivedAt !== null) return null;

  return {
    titleId: "panneau-ligne-titre",
    title: `Modifier ${noun.demonstrative}`,
    subtitles: [nameOf(row)],
    body: managedFormBody(
      referential,
      row,
      await toolOptionsFor(session, referential, heldToolOf(row)),
    ),
  };
}

/**
 * Le libellé d'une ligne, quel que soit le nom de sa colonne.
 *
 * **`tools` est la seule des neuf tables à nommer la sienne `name`**, et c'est
 * la seule raison d'être de cette fonction. Elle rétrécit par un `in`, comme le
 * corps du formulaire : aucun `as`, et le jour où une dixième table entrerait,
 * le compilateur redemanderait la question.
 */
function nameOf(row: ManagedReferentialRow): string {
  return "name" in row ? row.name : row.label;
}

async function managedArchive(
  session: Session,
  referential: ManagedReferential,
  id: string,
): Promise<DrawerContent | null> {
  if (!isUuid(id)) return null;

  const kind = MANAGED[referential];
  const noun = REFERENTIAL_NOUN[referential];

  const row: ManagedReferentialRow | undefined = await kind.find(session, id);
  if (!row || row.archivedAt !== null) return null;

  const usage = await countReferentialUsage(session.db, referential, row.id);

  return {
    titleId: "panneau-confirmation-titre",
    title: `Archiver ${noun.demonstrative}`,
    subtitles: [nameOf(row)],
    body: (
      <ConfirmPanel
        action={kind.archive.bind(null, row.id)}
        submitLabel={`Archiver ${noun.demonstrative}`}
        pendingLabel="Archivage…"
      >
        <div className="flex flex-col gap-3 text-sm text-content-neutral-dark">
          <p>
            Cette ligne disparaît des filtres et des formulaires qui la
            proposent. Rien n&apos;est supprimé.
          </p>
          <p>
            Ce qui la référence déjà garde son libellé : c&apos;est la mémoire de
            l&apos;accompagnement, elle ne se perd pas — aucune rétroaction, ni
            sur une roadmap, ni sur un résultat déjà saisi.
          </p>
          {isUnused(usage) ? (
            <p>Le geste se défait : une ligne archivée se rétablit.</p>
          ) : (
            <p className="font-semibold">
              {announceUsage(usage)} : le geste sera refusé tant que ce
              rattachement dure.
            </p>
          )}
        </div>
      </ConfirmPanel>
    ),
  };
}

/**
 * Ce qui s'oppose au geste, **dit** avant qu'on l'exerce.
 *
 * Il énumère les sources non nulles, dans l'ordre où le décompte les porte.
 * C'est une annonce, jamais une décision : la phrase du **refus** vit dans
 * `actions.ts`, où elle est écrite quatre fois — une par table, en phrases
 * entières plutôt qu'en phrase à trous (la règle du dépôt depuis T5.1).
 */
function announceUsage(usage: ReferentialUsage): string {
  const parts: string[] = [];

  if (usage.projects > 0) {
    parts.push(
      usage.projects > 1
        ? `${usage.projects} accompagnements vivants la déclarent`
        : "1 accompagnement vivant la déclare",
    );
  }
  if (usage.persons > 0) {
    parts.push(
      usage.persons > 1
        ? `${usage.persons} fiches de personne la citent`
        : "1 fiche de personne la cite",
    );
  }
  if (usage.activities > 0) {
    parts.push(
      usage.activities > 1
        ? `${usage.activities} activités vivantes la portent`
        : "1 activité vivante la porte",
    );
  }
  /* **Des déclarations, jamais des personnes** : une personne en porte
     plusieurs au même niveau. Le mot dit ce que le nombre compte. */
  if (usage.declarations > 0) {
    parts.push(
      usage.declarations > 1
        ? `${usage.declarations} compétences déclarées le citent`
        : "1 compétence déclarée le cite",
    );
  }
  /* Les deux sources d'un **outil** (T7.4). Elles ne sont pas des barrières de
     base — les quatre clés qui pointent `tools` sont `set null` — mais ce que
     l'archivage rendrait muet : la carte d'une piste perdrait son adresse, et
     la carte de roadmap le nom de son espace de travail. */
  if (usage.activityTypes > 0) {
    parts.push(
      usage.activityTypes > 1
        ? `${usage.activityTypes} types d'activité le nomment par défaut`
        : "1 type d'activité le nomme par défaut",
    );
  }
  if (usage.starters > 0) {
    parts.push(
      usage.starters > 1
        ? `${usage.starters} pistes de démarrage y renvoient`
        : "1 piste de démarrage y renvoie",
    );
  }

  return parts.join(", et ");
}

/**
 * La traduction des paramètres d'URL en demande — le chemin qui reste ouvert.
 *
 * **Le vocabulaire d'URL vit ici et nulle part ailleurs.** Chaque clé garde le
 * sens que `lib/navigation.ts` lui donne : `ligne` porte le cas dans sa valeur,
 * `nouvelle` créant et un identifiant corrigeant ; `archiver` et `supprimer`
 * désignent toujours la ligne visée, `/administration` n'ayant pas d'objet de
 * page. Une valeur qui ne désigne rien n'ouvre rien — c'est `isUuid`, dans la
 * résolution, qui le tranche.
 *
 * **Le référentiel vient à part, et ce n'est pas une clé d'ouverture** : il est
 * déjà rétréci par `asReferential` quand il arrive ici, et c'est le sélecteur de
 * la page — hors du décompte d'exclusivité, comme `de` et `a` sur la page
 * produit.
 */
export function adminRequestFromParams(
  referential: Referential,
  asked: {
    ligne?: string | undefined;
    archiver?: string | undefined;
    supprimer?: string | undefined;
  },
): AdminDrawerRequest | null {
  if (asked.ligne !== undefined) {
    return asked.ligne === REFERENTIAL_ROW_NEW
      ? { kind: "row", referential }
      : { kind: "row", referential, id: asked.ligne };
  }

  if (asked.archiver !== undefined) {
    return { kind: "archive", referential, id: asked.archiver };
  }

  if (asked.supprimer !== undefined) {
    /* La suppression ne porte pas de référentiel : elle n'existe que sur les
       entités. Sur un autre référentiel, la clé ne désigne donc rien — et
       `resolveAdminDrawer` cherchera une entité qui n'existe pas, ce qui
       n'ouvre rien. Il n'y a pas de second endroit où l'écrire. */
    return { kind: "delete", id: asked.supprimer };
  }

  return null;
}

/**
 * Les clés d'URL qui ouvrent un panneau **sur la page Administration**.
 *
 * Les trois y sont, et `referentiel` n'y est pas : c'est un **sélecteur**, pas
 * une clé d'ouverture. C'est aussi ce qui le laisse survivre au nettoyage d'URL
 * que `DrawerHost` fait au montage — les clés de cette liste sont retirées, les
 * autres restent, comme `?de=` et `?a=` sur la page produit.
 */
export const ADMIN_PANEL_PARAMS = [
  REFERENTIAL_ROW_PARAM,
  ARCHIVE_PANEL_PARAM,
  DELETE_PANEL_PARAM,
] as const;
