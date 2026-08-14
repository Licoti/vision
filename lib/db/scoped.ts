/**
 * La couche d'accès scopée — le seul module qui importe `db`.
 *
 * Règle 1 du CLAUDE.md, rendue structurelle : toute lecture et toute écriture
 * passe par une fonction qui exige un `domainId`. Le filtre de domaine est
 * posé par la couche, jamais par l'appelant, et il ne peut pas être retiré :
 * le `where` fourni est combiné en `and()`, il ne remplace rien.
 *
 * D38 — l'isolation est garantie par cette couche et par ses tests, pas par
 * du RLS. Le RLS se posera avec le SSO.
 *
 * Trois règles que la base ne peut pas tenir seule vivent ici, et nulle part
 * ailleurs (cf. JOURNAL-TECHNIQUE, T1.2) :
 *   — un résultat ne se rattache qu'à une activité `done` ;
 *   — toute écriture d'activité recalcule `projects.last_activity_at` ;
 *   — le `domain_id` d'une ligne est cohérent avec celui de ses parents.
 *
 * Ce que cette couche n'expose pas : de suppression générique. Le mot
 * `delete` ne figure pas dans son API. Règle 4 — aucune donnée métier ne se
 * supprime, elle s'archive.
 *
 * `archive` et `restore` sont les **deux seuls chemins** vers `archived_at` :
 * `update` refuse la colonne, et `UpdateValues` l'exclut du typage. Un
 * archivage qui se déferait par une écriture ordinaire ne serait plus un
 * geste, ce serait un champ.
 */

import {
  and,
  eq,
  isNotNull,
  isNull,
  sql,
  type InferInsertModel,
  type InferSelectModel,
  type SQL,
} from "drizzle-orm";
import { getTableConfig, type PgColumn, type PgTable } from "drizzle-orm/pg-core";

import { db, type Database } from "./client";
import { activities, domains, projects, results } from "./schema";

/* ==========================================================================
   Erreurs

   Deux classes distinctes, pour que l'appelant sache s'il a franchi une
   frontière de domaine ou violé une règle métier. Les confondre rendrait le
   message d'interface impossible à écrire.
   ========================================================================== */

/** Une écriture a tenté de sortir de son domaine, ou d'en forcer un autre. */
export class DomainScopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainScopeError";
  }
}

/** Une règle métier que la base ne peut pas porter a été violée. */
export class IntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntegrityError";
  }
}

/* ==========================================================================
   Ce qu'est une table scopée
   ========================================================================== */

/** Toute table métier : un identifiant, un domaine. Les 22 sauf `domains`. */
export type ScopedTable = PgTable & {
  id: PgColumn;
  domainId: PgColumn;
};

/** Les tables qui portent `archived_at` : celles qui s'archivent. */
export type ArchivableTable = ScopedTable & { archivedAt: PgColumn };

/**
 * Les tables de liaison — celles qui ne portent pas `archived_at`.
 * T1.2 a tranché de fait : retirer un membre d'un projet est une suppression
 * de ligne, pas un archivage. `archivedAt?: undefined` exclut à la
 * compilation toute table qui porte la colonne.
 */
export type LinkTable = ScopedTable & { archivedAt?: undefined };

/**
 * `Omit` et non `Except` serait plus court — et faux.
 *
 * Derrière un alias générique, TypeScript laisse `Omit<InferInsertModel<T>, …>`
 * non résolu et finit par rejeter des colonnes qui existent bel et bien
 * (`state`, `periodEnd`, `value`…). Le `extends infer M` force la résolution
 * du modèle avant d'en retirer les clés ; le type mappé est homomorphe, il
 * conserve donc les propriétés facultatives. **Ne pas remplacer par `Omit`.**
 */
type Except<X, K extends PropertyKey> = X extends infer M
  ? { [P in keyof M as P extends K ? never : P]: M[P] }
  : never;

/** `domain_id` et `created_by` appartiennent à la couche, pas à l'appelant. */
export type InsertValues<T extends ScopedTable> = Except<
  InferInsertModel<T>,
  "domainId" | "createdBy" | "archivedAt"
>;

/** `id`, `created_at` et `archived_at` ne se modifient pas par `update`. */
export type UpdateValues<T extends ScopedTable> = Partial<
  Except<
    InferInsertModel<T>,
    "domainId" | "createdBy" | "archivedAt" | "id" | "createdAt"
  >
>;

export type Row<T extends ScopedTable> = InferSelectModel<T>;

/* ==========================================================================
   Introspection du schéma

   Les colonnes à vérifier ne sont pas écrites à la main : elles sont dérivées
   des clés étrangères déclarées dans `schema.ts`. Une table ajoutée plus tard
   est couverte sans qu'on y pense — c'est la seule façon d'éviter une liste
   qui se désynchronise en silence.
   ========================================================================== */

type ParentCheck = { readonly key: string; readonly parent: ScopedTable };

const parentCheckCache = new WeakMap<PgTable, readonly ParentCheck[]>();

function isScoped(table: PgTable): table is ScopedTable {
  const candidate = table as unknown as Record<string, unknown>;
  return "id" in candidate && "domainId" in candidate;
}

function hasArchivedAt(table: ScopedTable): table is ArchivableTable {
  return "archivedAt" in (table as unknown as Record<string, unknown>);
}

/**
 * Drizzle refuse une table générique dans `from` / `insert` / `update` : ses
 * garde-types ne savent pas réduire un `T` non résolu. Le cast est confiné
 * ici, et les résultats sont retypés à la sortie de chaque méthode.
 */
function anyTable(table: ScopedTable): PgTable {
  return table as unknown as PgTable;
}

/** Un lot d'instructions pour `db.batch`, que Neon exécute en une transaction. */
type Batch = Parameters<Database["batch"]>[0];

/** La propriété TypeScript qui porte une colonne donnée (`project_id` → `projectId`). */
function propertyOf(table: PgTable, column: PgColumn): string | undefined {
  for (const [key, value] of Object.entries(table)) {
    if (value === column) return key;
  }
  return undefined;
}

/**
 * Les clés étrangères d'une table qui pointent une autre table scopée.
 * `domains` est écartée : c'est la couche qui écrit ce lien.
 */
function parentChecksOf(table: ScopedTable): readonly ParentCheck[] {
  const cached = parentCheckCache.get(table);
  if (cached) return cached;

  const checks: ParentCheck[] = [];
  for (const foreignKey of getTableConfig(table).foreignKeys) {
    const reference = foreignKey.reference();
    // Aucune clé composite dans le schéma ; si l'une apparaît, elle sera
    // ignorée ici plutôt que vérifiée à moitié.
    if (reference.columns.length !== 1) continue;

    const column = reference.columns[0];
    const parent = reference.foreignTable;
    if (!column || parent === domains || !isScoped(parent)) continue;

    const key = propertyOf(table, column);
    if (key) checks.push({ key, parent });
  }

  parentCheckCache.set(table, checks);
  return checks;
}

/* ==========================================================================
   `last_activity_at`

   `docs/04` §6 confie le champ à la couche d'écriture sans en donner la
   définition. Retenu : la date du dernier fait d'accompagnement **qui a eu
   lieu** — activités non archivées, non annulées, et non `planned`.
   L'autre lecture possible, l'horodatage de la dernière modification, est le
   rôle d'`events`, pas de ce champ. Nul si le projet n'a rien commencé.

   **Pourquoi `planned` est exclu** (tranché en T2.1, avec l'humain). T1.3
   comptait toutes les activités non annulées, ce qui posait la date dans le
   futur dès qu'un audit était prévu — `docs/03` §8 veut pourtant que ce champ
   dise « depuis quand un projet n'a pas bougé ». Une activité `in_progress`
   compte, elle a commencé ; une activité `planned` n'a pas eu lieu.

   La condition porte sur l'**état**, jamais sur l'horloge : un champ stocké
   dont la valeur dépendrait de `current_date` serait faux le lendemain de son
   calcul.
   ========================================================================== */

function lastActivityExpression(domainId: string): SQL {
  return sql`(
    select max(coalesce(${activities.periodEnd}, ${activities.periodStart}))::timestamptz
    from ${activities}
    where ${activities.projectId} = ${projects.id}
      and ${activities.domainId} = ${domainId}
      and ${activities.archivedAt} is null
      and ${activities.state} <> 'cancelled'
      and ${activities.state} <> 'planned'
  )`;
}

function recalcByProject(domainId: string, projectId: string) {
  return db
    .update(projects)
    .set({ lastActivityAt: lastActivityExpression(domainId) })
    .where(and(eq(projects.id, projectId), eq(projects.domainId, domainId)));
}

/** Même recalcul, quand on ne connaît que l'activité touchée. */
function recalcByActivity(domainId: string, activityId: string) {
  return db
    .update(projects)
    .set({ lastActivityAt: lastActivityExpression(domainId) })
    .where(
      and(
        eq(projects.domainId, domainId),
        sql`${projects.id} = (
          select ${activities.projectId} from ${activities}
          where ${activities.id} = ${activityId}
            and ${activities.domainId} = ${domainId}
        )`,
      ),
    );
}

/* ==========================================================================
   Le point d'entrée
   ========================================================================== */

/**
 * Le domaine courant, et la personne qui écrit.
 *
 * `actorId` est facultatif : l'amorçage (T1.5) et les écritures système n'ont
 * pas de personne courante — `created_by` est nullable pour cette raison.
 * En T1.4 le contexte de session fournira ce couple ; la forme ne bougera pas.
 */
export type Scope = { domainId: string; actorId?: string | null };

export type ScopedDb = ReturnType<typeof forDomain>;

export function forDomain(scope: Scope) {
  const { domainId } = scope;
  const actorId = scope.actorId ?? null;

  if (!domainId) {
    throw new DomainScopeError("Un domaine est exigé : `domainId` est vide.");
  }

  /** La condition de domaine d'une table. Le cœur de la règle 1. */
  const filter = (table: ScopedTable): SQL => eq(table.domainId, domainId);

  const alive = (table: ScopedTable, includeArchived: boolean): SQL[] =>
    !includeArchived && hasArchivedAt(table) ? [isNull(table.archivedAt)] : [];

  const isTable = (table: ScopedTable, other: PgTable): boolean =>
    (table as unknown as PgTable) === other;

  /* ---------------------------------------------------------------------
     Préconditions d'écriture
     --------------------------------------------------------------------- */

  /** `domain_id` est écrit par la couche. Le forcer est refusé, pas corrigé. */
  function assertNoForcedDomain(values: Record<string, unknown>): void {
    if ("domainId" in values && values.domainId !== domainId) {
      throw new DomainScopeError(
        "`domainId` ne se fournit pas à l'écriture : il vient du contexte.",
      );
    }
  }

  /**
   * Vérifie, en un seul aller-retour, que chaque parent référencé appartient
   * au domaine — et, pour `results`, que l'activité visée est terminée.
   *
   * La base ne peut ni l'un ni l'autre : ses clés étrangères ignorent le
   * domaine, et la règle du résultat traverse deux tables.
   */
  async function assertPreconditions(
    table: ScopedTable,
    values: Record<string, unknown>,
  ): Promise<void> {
    const queries: unknown[] = [];
    const labels: { key: string; kind: "parent" | "doneActivity" }[] = [];
    const isResult = isTable(table, results);

    for (const check of parentChecksOf(table)) {
      const value = values[check.key];
      if (typeof value !== "string") continue;

      // Pour `results.activity_id`, la requête d'état vaut aussi vérification
      // d'appartenance : inutile d'interroger deux fois.
      if (isResult && check.key === "activityId") continue;

      queries.push(
        db
          .select({ id: check.parent.id })
          .from(anyTable(check.parent))
          .where(and(eq(check.parent.id, value), filter(check.parent)))
          .limit(1),
      );
      labels.push({ key: check.key, kind: "parent" });
    }

    if (isResult && typeof values.activityId === "string") {
      queries.push(
        db
          .select({ state: activities.state })
          .from(activities)
          .where(and(eq(activities.id, values.activityId), filter(activities)))
          .limit(1),
      );
      labels.push({ key: "activityId", kind: "doneActivity" });
    }

    if (queries.length === 0) return;

    // `neon-http` n'a pas de transaction interactive ; `batch` regroupe ces
    // lectures en un seul appel.
    const outcomes = (await db.batch(queries as unknown as Batch)) as unknown as {
      state?: string;
    }[][];

    outcomes.forEach((rows, index) => {
      const label = labels[index];
      if (!label) return;
      const row = rows[0];

      if (!row) {
        throw new DomainScopeError(
          `\`${label.key}\` pointe une ligne absente du domaine courant.`,
        );
      }
      if (label.kind === "doneActivity" && row.state !== "done") {
        throw new IntegrityError(
          "Un résultat ne se rattache qu'à une activité terminée (`done`).",
        );
      }
    });
  }

  /* ---------------------------------------------------------------------
     Lectures
     --------------------------------------------------------------------- */

  /**
   * Les lignes du domaine. Les tables qui portent `archived_at` sont filtrées
   * sur les lignes vivantes, sauf `includeArchived`.
   */
  async function list<T extends ScopedTable>(
    table: T,
    options: {
      where?: SQL;
      orderBy?: (SQL | PgColumn)[];
      limit?: number;
      offset?: number;
      includeArchived?: boolean;
    } = {},
  ): Promise<Row<T>[]> {
    const conditions = [
      filter(table),
      ...alive(table, options.includeArchived ?? false),
      ...(options.where ? [options.where] : []),
    ];

    let query = db
      .select()
      .from(anyTable(table))
      .where(and(...conditions))
      .$dynamic();
    if (options.orderBy?.length) query = query.orderBy(...options.orderBy);
    if (options.limit !== undefined) query = query.limit(options.limit);
    if (options.offset !== undefined) query = query.offset(options.offset);

    return (await query) as Row<T>[];
  }

  /** Une ligne du domaine, ou `undefined`. Y compris archivée. */
  async function find<T extends ScopedTable>(
    table: T,
    id: string,
  ): Promise<Row<T> | undefined> {
    const rows = (await db
      .select()
      .from(anyTable(table))
      .where(and(eq(table.id, id), filter(table)))
      .limit(1)) as Row<T>[];
    return rows[0];
  }

  async function count<T extends ScopedTable>(
    table: T,
    options: { where?: SQL; includeArchived?: boolean } = {},
  ): Promise<number> {
    const conditions = [
      filter(table),
      ...alive(table, options.includeArchived ?? false),
      ...(options.where ? [options.where] : []),
    ];
    const rows = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(anyTable(table))
      .where(and(...conditions));
    return rows[0]?.total ?? 0;
  }

  /**
   * La seule lecture qui ne se filtre pas d'elle-même — pour les jointures :
   * listes de C2, liens déduits de `docs/04` §5.
   *
   * Elle reçoit le domaine, elle ne le contourne pas. **Toute table jointe
   * porte `scope.filter(table)` dans son `on` ou son `where`.** Un oubli est
   * une fuite : c'est le seul endroit du code où cette phrase doit être lue.
   */
  function joinedRead<R>(
    read: (
      database: Database,
      readScope: { domainId: string; filter: (table: ScopedTable) => SQL },
    ) => Promise<R>,
  ): Promise<R> {
    return read(db, { domainId, filter });
  }

  /* ---------------------------------------------------------------------
     Écritures
     --------------------------------------------------------------------- */

  async function insertMany<T extends ScopedTable>(
    table: T,
    rows: InsertValues<NoInfer<T>>[],
  ): Promise<Row<T>[]> {
    if (rows.length === 0) return [];

    const prepared: Record<string, unknown>[] = rows.map((values) => {
      const record = values as Record<string, unknown>;
      assertNoForcedDomain(record);
      return { ...record, domainId, createdBy: actorId };
    });

    for (const record of prepared) await assertPreconditions(table, record);

    const insertion = db
      .insert(anyTable(table))
      .values(prepared as never)
      .returning();

    // Toute écriture d'activité remet `last_activity_at` à jour. À l'insertion
    // le projet est connu d'avance : le recalcul part dans le même appel.
    if (isTable(table, activities)) {
      const projectIds = [
        ...new Set(
          prepared
            .map((record) => record.projectId)
            .filter((id): id is string => typeof id === "string"),
        ),
      ];
      const outcomes = (await db.batch([
        insertion,
        ...projectIds.map((id) => recalcByProject(domainId, id)),
      ] as unknown as Batch)) as unknown as Row<T>[][];
      return outcomes[0] ?? [];
    }

    return (await insertion) as Row<T>[];
  }

  async function insert<T extends ScopedTable>(
    table: T,
    values: InsertValues<NoInfer<T>>,
  ): Promise<Row<T>> {
    const rows = await insertMany(table, [values]);
    const row = rows[0];
    if (!row) throw new IntegrityError("L'insertion n'a rien renvoyé.");
    return row;
  }

  /**
   * Modifie une ligne du domaine. Une ligne d'un autre domaine n'est pas
   * trouvée : l'écriture ne touche rien et rend `undefined`.
   */
  async function update<T extends ScopedTable>(
    table: T,
    id: string,
    values: UpdateValues<NoInfer<T>>,
  ): Promise<Row<T> | undefined> {
    const record = values as Record<string, unknown>;
    assertNoForcedDomain(record);

    if ("archivedAt" in record) {
      throw new IntegrityError(
        "`archivedAt` ne se modifie pas par `update` : passer par `archive`.",
      );
    }
    if ("id" in record) {
      throw new IntegrityError("L'identifiant d'une ligne ne se modifie pas.");
    }

    await assertPreconditions(table, record);

    const isActivity = isTable(table, activities);
    // Déplacer une activité de projet est rare (D17), mais possible : il faut
    // alors recalculer les deux projets, dont l'ancien, qu'on lit avant.
    const movedFrom =
      isActivity && typeof record.projectId === "string"
        ? ((await find(activities, id))?.projectId ?? null)
        : null;

    const mutation = db
      .update(anyTable(table))
      .set({ ...record, updatedAt: new Date() } as never)
      .where(and(eq(table.id, id), filter(table)))
      .returning();

    if (!isActivity) return ((await mutation) as Row<T>[])[0];

    const outcomes = (await db.batch([
      mutation,
      recalcByActivity(domainId, id),
      ...(movedFrom ? [recalcByProject(domainId, movedFrom)] : []),
    ] as unknown as Batch)) as unknown as Row<T>[][];
    return outcomes[0]?.[0];
  }

  /**
   * Archive une ligne : `archived_at` est posé, la ligne reste lisible.
   * Règle 4 — aucune donnée métier ne se supprime.
   */
  async function archive<T extends ArchivableTable>(
    table: T,
    id: string,
  ): Promise<Row<T> | undefined> {
    const now = new Date();
    const mutation = db
      .update(anyTable(table))
      .set({ archivedAt: now, updatedAt: now } as never)
      .where(and(eq(table.id, id), filter(table), isNull(table.archivedAt)))
      .returning();

    if (!isTable(table, activities)) {
      return ((await mutation) as Row<T>[])[0];
    }

    // Une activité archivée sort du calcul : le projet est recalculé après.
    const outcomes = (await db.batch([
      mutation,
      recalcByActivity(domainId, id),
    ] as unknown as Batch)) as unknown as Row<T>[][];
    return outcomes[0]?.[0];
  }

  /**
   * Rétablit une ligne archivée : `archived_at` repasse à nul.
   *
   * Miroir exact d'`archive`, jusqu'au filtre : la condition porte sur
   * `is not null` là où l'archivage porte sur `is null`, si bien qu'un
   * rétablissement d'une ligne vivante ne touche rien et rend `undefined`. Un
   * geste qui prétendrait défaire ce qui n'a pas été fait mentirait à son
   * appelant, qui ne saurait plus distinguer le succès de l'inutile.
   *
   * `updated_at` est repoussé, comme à l'archivage : ranger et sortir du
   * rangement sont deux modifications métier, et non des rafraîchissements de
   * champ dérivé.
   *
   * La branche `activities` reprend celle d'`archive` pour la même raison :
   * l'en-tête de ce module promet que **toute écriture d'activité recalcule
   * `last_activity_at`**, et une promesse de couche ne se tient pas seulement
   * là où une interface y mène. Rien n'appelle encore ce chemin — arbitrage
   * (b) de `tickets-C4bis.md`, l'activité se ressaisit plutôt qu'elle ne se
   * rétablit — et il serait faux le jour où quelque chose l'appellerait.
   */
  async function restore<T extends ArchivableTable>(
    table: T,
    id: string,
  ): Promise<Row<T> | undefined> {
    const mutation = db
      .update(anyTable(table))
      .set({ archivedAt: null, updatedAt: new Date() } as never)
      .where(and(eq(table.id, id), filter(table), isNotNull(table.archivedAt)))
      .returning();

    if (!isTable(table, activities)) {
      return ((await mutation) as Row<T>[])[0];
    }

    // Une activité rétablie rentre dans le calcul : le projet est recalculé
    // après, comme il l'est quand elle en sort.
    const outcomes = (await db.batch([
      mutation,
      recalcByActivity(domainId, id),
    ] as unknown as Batch)) as unknown as Row<T>[][];
    return outcomes[0]?.[0];
  }

  /**
   * Rejoue le calcul de `last_activity_at` — sur les projets nommés, ou sur
   * tous ceux du domaine.
   *
   * Le recalcul existe depuis T1.3, mais n'était atteignable que par une
   * écriture d'activité. Il fallait donc écrire pour corriger, ce qui est
   * absurde le jour où c'est la **définition** qui change : les lignes déjà en
   * base gardaient l'ancienne valeur pour toujours. T2.1 a changé cette
   * définition ; cette fonction est ce qui permet de l'appliquer.
   *
   * `updated_at` n'est pas touché, délibérément : rafraîchir un champ dérivé
   * n'est pas une modification métier, et le journal de C6 n'a rien à en dire.
   *
   * Rend le nombre de projets recalculés.
   */
  async function refreshLastActivity(
    projectIds?: readonly string[],
  ): Promise<number> {
    if (projectIds) {
      if (projectIds.length === 0) return 0;
      await db.batch(
        projectIds.map((id) => recalcByProject(domainId, id)) as unknown as Batch,
      );
      return projectIds.length;
    }

    const refreshed = await db
      .update(projects)
      .set({ lastActivityAt: lastActivityExpression(domainId) })
      .where(eq(projects.domainId, domainId))
      .returning({ id: projects.id });
    return refreshed.length;
  }

  /**
   * Défait une liaison. Réservé aux tables sans `archived_at` — le typage
   * refuse toute table métier archivable.
   */
  async function unlink<T extends LinkTable>(
    table: T,
    id: string,
  ): Promise<number> {
    const removed = await db
      .delete(anyTable(table))
      .where(and(eq(table.id, id), filter(table)))
      .returning({ id: table.id });
    return removed.length;
  }

  return {
    domainId,
    actorId,
    /** À passer à chaque table jointe dans `joinedRead`. */
    filter,
    list,
    find,
    count,
    joinedRead,
    insert,
    insertMany,
    update,
    archive,
    restore,
    refreshLastActivity,
    unlink,
  };
}

/* ==========================================================================
   Les domaines eux-mêmes

   `domains` est la seule table sans `domain_id` : rien ne peut la scoper.
   Plutôt qu'un contournement glissé dans l'amorçage, un objet nommé pour ce
   qu'il est. Trois fonctions, une seule table, aucune donnée métier joignable
   par ce chemin — un domaine créé ici ne se lit ensuite que par `forDomain`.
   ========================================================================== */

export const superAdmin = {
  async createDomain(values: {
    name: string;
    competenceCenterName: string;
  }): Promise<InferSelectModel<typeof domains>> {
    const rows = await db.insert(domains).values(values).returning();
    const row = rows[0];
    if (!row) {
      throw new IntegrityError("La création du domaine n'a rien renvoyé.");
    }
    return row;
  },

  async findDomain(
    id: string,
  ): Promise<InferSelectModel<typeof domains> | undefined> {
    const rows = await db
      .select()
      .from(domains)
      .where(eq(domains.id, id))
      .limit(1);
    return rows[0];
  },

  async listDomains(
    options: { includeArchived?: boolean } = {},
  ): Promise<InferSelectModel<typeof domains>[]> {
    return db
      .select()
      .from(domains)
      .where(options.includeArchived ? undefined : isNull(domains.archivedAt))
      .orderBy(domains.name);
  },
};
