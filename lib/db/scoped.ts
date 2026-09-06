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
 * Ce que cette couche n'expose pas : de suppression générique. Règle 4 —
 * aucune donnée métier ne se supprime, elle s'archive. Deux fonctions font
 * exception, et toutes deux portent leur exception **dans leur type** plutôt
 * que dans un commentaire : `unlink`, réservée aux tables de liaison, et
 * `deleteRow`, réservée aux tables que `DeletableTable` énumère.
 *
 * **`DeletableTable` a cessé d'être une exception de référentiel le
 * 28/08/2026**, à la demande de l'humain : elle nomme désormais `projects` et
 * `persons` à côté d'`entities`. La règle 4 est donc écartée sur trois tables
 * nommées, et l'écart est consigné dans `JOURNAL-TECHNIQUE.md` — `CLAUDE.md`
 * ne s'écrit pas d'ici (règle 7).
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
import {
  activities,
  domainIdentities,
  domains,
  entities,
  events,
  identityProvider,
  persons,
  projects,
  results,
  superAdmins,
} from "./schema";

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

/**
 * PostgreSQL a-t-il refusé une suppression parce qu'une ligne la référence ?
 *
 * **Deux codes et non un**, et c'est un piège mesuré le 21/08/2026 : `23503`
 * est la violation de clé étrangère ordinaire, celle que rend une clé
 * `no action` ; une clé déclarée **`restrict`** — c'est le cas de
 * `products.entity_id` — est tenue par un déclencheur distinct, qui rend
 * `23001`. N'attendre que `23503` laissait donc passer le seul cas que ce
 * code existe pour attraper.
 *
 * **Le code se cherche dans la chaîne des causes**, jamais sur l'erreur reçue :
 * Drizzle enveloppe celle du pilote dans un `DrizzleQueryError`, qui ne porte
 * pas de `code`. Et il se lit sur le code, jamais sur le message — celui-ci est
 * localisé par le serveur et changerait sous nos pieds.
 */
function isReferenceViolation(error: unknown): boolean {
  const REFERENCE_CODES = ["23001", "23503"];

  let current: unknown = error;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    if (typeof current !== "object") return false;
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string" && REFERENCE_CODES.includes(code)) return true;
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

/* ==========================================================================
   Ce qu'est une table scopée
   ========================================================================== */

/**
 * Toute table métier : un identifiant, un domaine. Toutes sauf `domains`.
 *
 * **Sans le compte**, et c'est la correction (T6.1). La phrase disait « les 22 » ;
 * elles étaient 26 quand T5bis.1 l'a constaté sans pouvoir la toucher, la fiche de
 * C6 en annonçait 25, et elles sont 30 au jour où l'on écrit. Un nombre dans un
 * commentaire vieillit à chaque migration, et il a menti deux fois avant celle-ci :
 * ce qui se relit ici est la **règle**, que `schema.ts` tient table par table.
 */
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
 * Les tables dont une ligne peut être **supprimée** — l'écart à la règle 4,
 * porté par le typage plutôt que par une convention (21/08/2026, élargi le
 * 28/08/2026).
 *
 * **Une union nominative, jamais un prédicat structurel.** `LinkTable` se
 * définit par une forme — l'absence d'`archived_at` — parce que la forme
 * *est* la règle : une liaison n'a rien à archiver. Ici, aucune forme ne
 * distingue les trois tables nommées de `products` ou d'`activities` : toutes
 * portent `archived_at`, toutes sont scopées. Ce qui les sépare est une
 * **décision**, et une union nommée est le seul endroit où une décision se
 * relit. Un prédicat rendrait supprimable la prochaine table qui aurait la
 * bonne forme, ce que personne n'aurait décidé.
 *
 * **Les trois n'ont pas la même barrière, et c'est ce qu'il faut savoir avant
 * d'en ajouter une quatrième :**
 *
 *   — `entities` (21/08/2026) — bornée par `products.entity_id`, déclarée
 *     `on delete restrict`. La base refuse d'effacer une entité qui a qualifié
 *     un produit, archivé compris. Rien ne se perd jamais.
 *   — `persons` (28/08/2026) — bornée par `project_members.person_id` et
 *     `activity_participants.person_id`, toutes deux `restrict`. La base refuse
 *     d'effacer qui a été sur un accompagnement ou dans une activité. Ce qui
 *     part avec la ligne est `person_skills` (`cascade`) ; ce que la personne a
 *     créé reste, son nom en moins (`created_by` et `events.actor_id` sont
 *     `set null`).
 *   — `projects` (28/08/2026) — **aucune barrière**. Les dix clés étrangères
 *     qui pointent `projects.id` sont `on delete cascade` : métiers, approches,
 *     équipe, activités — donc participants et résultats —, ressources,
 *     adoptions d'indicateurs, budget, liens déclarés et **journal** partent
 *     avec l'accompagnement. C'est `F1-D3` renversé, à la demande de l'humain,
 *     et le seul garde-fou est le panneau de confirmation qui l'annonce.
 *
 * **Ajouter une table ici est un arbitrage humain, jamais une décision de
 * ticket.** Et depuis `projects`, ce n'est plus « une ligne que rien ne
 * référence » qu'on autorise : la clause à énoncer est ce que la cascade
 * emporte.
 *
 * Les deux écarts à la règle 4 sont arbitrés par l'humain — le 21/08/2026, puis
 * le 28/08/2026 — et consignés dans `JOURNAL-TECHNIQUE.md` ; `CLAUDE.md` ne
 * s'écrit pas d'ici.
 */
export type DeletableTable =
  | typeof entities
  | typeof persons
  | typeof projects;

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

/**
 * Une ligne de journal, telle qu'un geste la dicte — T6.1.
 *
 * Cinq colonnes sont retirées à l'appelant, et chacune pour sa raison :
 * `domain_id` et `created_by` appartiennent à la couche comme partout ailleurs ;
 * `actor_id` est **posé depuis le contexte**, sans quoi une action pourrait
 * signer au nom d'un autre ; `occurred_at` est la date du geste, que
 * `defaultNow()` pose et qu'une soumission n'a pas à forger ; `id`, `created_at`
 * et `updated_at` ne se choisissent nulle part.
 *
 * Ce qui reste est exactement ce que le geste sait et que la couche ignore : où
 * il a eu lieu, ce qu'il a fait, à quoi, et la phrase qui le dit.
 */
export type JournalEntry = Except<
  InsertValues<typeof events>,
  "actorId" | "id" | "createdAt" | "updatedAt" | "occurredAt"
>;

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

  /**
   * Supprime une ligne — l'écart à la règle 4, borné aux trois tables que
   * `DeletableTable` nomme.
   *
   * **Le typage la borne** : `deleteRow(products, …)` ne compile pas. C'est la
   * méthode d'`unlink`, dont le type refuse déjà toute table archivable.
   *
   * **Elle ne vérifie jamais que la ligne est libre, et c'est délibéré — mais
   * ce que cela garantit dépend de la table.** Pour `entities` et `persons`,
   * une clé étrangère `restrict` (`products.entity_id`,
   * `project_members.person_id`, `activity_participants.person_id`) fait que
   * PostgreSQL refuse lui-même l'effacement de ce qui a servi : la barrière est
   * en base, et un décompte préalable serait une seconde autorité qui
   * divergerait un jour de la première — sans compter la fenêtre qu'il laisse
   * ouverte entre le compte et l'effacement.
   *
   * **Pour `projects`, il n'y a aucune barrière** : les dix clés étrangères qui
   * le pointent sont `cascade`, et cet appel efface donc l'accompagnement
   * entier — activités, ressources, résultats, budget, liens et journal
   * compris. Ce que la base ne refusera pas ici, c'est **le panneau de
   * confirmation** qui doit l'avoir annoncé. Voir `DeletableTable`.
   *
   * L'appelant compte donc pour **parler** — dire ce qui s'oppose au geste, ou
   * ce qu'il emporte —, jamais pour décider.
   *
   * Le refus de la base, quand il existe, est traduit en `IntegrityError`, la
   * classe prévue pour « une règle que l'appelant a violée » — sans quoi
   * l'écran rendrait un 500 là où l'on attend un message.
   *
   * Rend le nombre de lignes effacées : `0` quand l'identifiant est inconnu ou
   * appartient à un autre domaine, la couche étant scopée et ne distinguant
   * pas les deux.
   */
  async function deleteRow<T extends DeletableTable>(
    table: T,
    id: string,
  ): Promise<number> {
    try {
      const removed = await db
        .delete(anyTable(table))
        .where(and(eq(table.id, id), filter(table)))
        .returning({ id: table.id });
      return removed.length;
    } catch (error) {
      if (isReferenceViolation(error)) {
        throw new IntegrityError(
          "Cette ligne est encore référencée : elle ne peut pas être supprimée.",
        );
      }
      throw error;
    }
  }

  /* ---------------------------------------------------------------------
     Le journal — T6.1
     --------------------------------------------------------------------- */

  /**
   * Écrit une ligne du journal `events`.
   *
   * **Ce n'est pas une écriture de plus : c'est `insert(events, …)` avec
   * `actor_id` posé depuis le contexte.** Elle hérite donc gratuitement des
   * trois préconditions de la couche — `assertNoForcedDomain`, et
   * `assertPreconditions` qui confronte `project_id`, `product_id` et
   * `actor_id` au domaine, les clés étrangères d'`events` étant déjà dérivées
   * par `parentChecksOf`. **Aucune précondition neuve n'est écrite** : s'il en
   * fallait une, ce serait le signe que `record` a pris un chemin qu'`insert`
   * n'a pas.
   *
   * **La décision de journaliser n'est pas ici, et c'est un arbitrage** —
   * arbitrage (a) de `tickets-C6.md`. `docs/04` §4 écrit « alimenté par la
   * couche d'accès » : l'**écriture** y est, le **déclenchement** n'y est pas.
   * Journaliser depuis `insert` / `update` / `archive` aurait composé `summary`
   * depuis une table de libellés par table, sans savoir ce que le geste voulait
   * dire — « Projet modifié » là où l'action sait dire « Statut passé à
   * Terminé ». Seule l'action connaît le vocabulaire, donc seule l'action
   * appelle.
   *
   * **Le prix est nommé : un geste qui oublie d'appeler `record` ne laisse pas
   * de trace, et rien ne le signale.** On préfère une phrase juste qu'on peut
   * oublier à une phrase creuse qu'on ne peut pas.
   */
  async function record(entry: JournalEntry): Promise<Row<typeof events>> {
    return insert(events, { ...entry, actorId } as InsertValues<typeof events>);
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
    deleteRow,
    record,
  };
}

/* ==========================================================================
   Ce qui vit avant le domaine

   **Le compte a été retiré, il n'a pas été corrigé.** Ce bandeau annonçait
   « trois fonctions, une seule table » ; T9.1 en fait cinq sur trois, et un
   commentaire faux vaut une ligne de code fausse (leçon de T7.5). Ce qui se
   relit ici est donc la **propriété**, que l'objet tient fonction par fonction :

   aucune de ces requêtes ne peut porter de filtre de domaine, parce qu'aucune
   ne connaît encore de domaine. `domains` n'a pas de `domain_id` — rien ne peut
   la scoper. `super_admins` non plus, et pour la même raison : ce qui est
   au-dessus des domaines ne se scope pas. `domain_identities` en porte un, mais
   **elle se lit pour le désigner** : la confronter à un domaine courant
   demanderait de connaître la réponse avant de poser la question.

   Ce n'est donc pas un contournement de la règle 1, c'est le lieu nommé de ce
   qu'elle ne peut pas couvrir — et sa frontière est étroite : **aucune donnée
   métier n'est joignable par ce chemin.** Un domaine créé ici ne se lit ensuite
   que par `forDomain`, et les deux lectures d'identité ne rendent que de quoi
   *choisir* un domaine, jamais de quoi le traverser.

   **La distinction que T9.3 devait écrire, la voici — et elle est portée par
   deux objets, pas par un commentaire.**

     `superAdmin`            ce qui se **lit** avant le domaine. Ouvert, et il
                             doit l'être : ces lectures s'exécutent *pendant* la
                             connexion, quand aucune session n'existe encore.
                             Une garde ici fermerait la porte à qui vient
                             l'ouvrir.

     `asSuperAdmin(grant)`   ce qui s'**écrit** au-dessus des domaines. Fermé :
                             on ne l'obtient qu'en nommant son autorité.

   **C'est le geste de `forDomain`, appliqué un cran plus haut.** On n'écrit pas
   dans une table métier sans avoir nommé un domaine ; on n'écrit pas au-dessus
   des domaines sans avoir nommé une autorité. La preuve se passe en argument
   plutôt que de se vérifier par un sceau ESLint, et la raison est écrite dans
   `ETAT.md` à propos d'`uiLayerSeal` : *une garde qui désigne une liste plutôt
   qu'une propriété vieillit à chaque ajout*. Un sceau nommant `createDomain` et
   `upsertSuperAdmin` laisserait passer le troisième écrivain venu ; le typage,
   lui, le refuse sans qu'on ait à y penser.
   ========================================================================== */

/**
 * Une écriture au-dessus des domaines a été tentée sans autorité vivante.
 *
 * **Une troisième classe, et pas un `DomainScopeError`.** Celui-ci dit qu'une
 * écriture a tenté de sortir de son domaine ; ici il n'y a pas de domaine à
 * sortir — c'est l'autorité qui manque. Les confondre rendrait le message
 * d'interface impossible à écrire, ce que l'en-tête de ce fichier dit déjà des
 * deux premières.
 */
export class SuperAdminRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SuperAdminRequiredError";
  }
}

/**
 * L'autorité d'une écriture au-dessus des domaines. **Deux provenances, et pas
 * une de plus.**
 *
 * `super_admin` — une session vérifiée. C'est `requireSuperAdmin()`
 * (`lib/auth/super-admin.ts`) qui la produit, et elle **n'est pas crue sur
 * parole** : `asSuperAdmin` relit la ligne avant chaque écriture. Forger ce
 * couple depuis `app/` ne donne donc rien — l'identifiant doit désigner un
 * super administrateur qui existe et qui n'est pas archivé.
 *
 * `outside_any_session` — ce qui tourne hors de toute requête HTTP : les deux
 * scripts d'amorçage, et les fixtures des tests. **C'est l'échappée, et son nom
 * est l'alarme.** Rien n'empêche mécaniquement `app/` de l'importer ; ce qui
 * l'en empêche est qu'elle se lit. Le résidu est consigné au journal technique
 * plutôt que masqué.
 */
export type SuperAdminGrant =
  | { readonly kind: "super_admin"; readonly superAdminId: string }
  | { readonly kind: "outside_any_session"; readonly reason: string };

/**
 * L'autorité de ce qui n'a pas de session — **un script, une fixture**.
 *
 * *« L'amorçage d'un droit qui, par construction, ne peut pas s'accorder depuis
 * l'intérieur du produit — comme une première clé se pose de l'extérieur de la
 * serrure »* (`scripts/super-admin.ts`). Le motif n'est lu par personne : il
 * est là pour que l'appel dise pourquoi il se passe de session.
 */
export function withoutAnySession(reason: string): SuperAdminGrant {
  return { kind: "outside_any_session", reason };
}

export const superAdmin = {
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

  /**
   * La règle d'entrée 2 — consultée **avant** toute recherche de domaine.
   *
   * Un super administrateur est *au-dessus* des domaines : la règle du domaine
   * d'entreprise ne le concerne pas. C'est ce qui permet d'être super
   * administrateur avec une adresse hors entreprise **sans ouvrir la porte à
   * personne d'autre**, et c'est la seule exception à l'arbitrage (2) de
   * `tickets-C9.md`.
   *
   * **Le rapprochement se fait sur `lower(email)`**, du même côté que l'index
   * unique : une comparaison sensible à la casse ne trouverait pas la ligne que
   * la base a pourtant empêché d'exister en double.
   *
   * **Une ligne archivée n'est pas rendue**, et ce n'est pas un filtre
   * d'agrément : archiver un super administrateur *est* le geste qui lui retire
   * son droit. Le rendre puis compter sur l'appelant pour l'écarter mettrait la
   * frontière dans la vigilance de qui appelle.
   */
  async findSuperAdminByEmail(
    email: string,
  ): Promise<InferSelectModel<typeof superAdmins> | undefined> {
    const rows = await db
      .select()
      .from(superAdmins)
      .where(
        and(
          sql`lower(${superAdmins.email}) = lower(${email})`,
          isNull(superAdmins.archivedAt),
        ),
      )
      .limit(1);
    return rows[0];
  },

  /**
   * La même lecture, par identifiant — **et c'est la seconde barrière** (T9.3).
   *
   * Le cookie de session vit trente jours et ne porte qu'un identifiant.
   * `getSession` relit la personne à **chaque** requête, si bien qu'un accès
   * retiré ne survit pas dans un cookie déjà posé ; le super administrateur n'a
   * pas de raison d'échapper à cette règle. Sans cette lecture, archiver une
   * ligne ne retirerait son droit qu'au bout d'un mois — or *archiver **est** le
   * geste qui retire le droit*.
   *
   * **Elle n'est pas une commodité, elle est la garde** : `asSuperAdmin`
   * l'appelle avant chaque écriture, et `getSuperAdmin` avant chaque rendu.
   * C'est ce qui autorise à ne pas croire un `SuperAdminGrant` sur parole.
   *
   * **Elle enfreint la lettre d'un interdit de la fiche** — *« aucune quatrième
   * fonction ajoutée »* —, lettre déjà morte : T9.2 en a ajouté deux avec
   * argument, et `ETAT.md` note la fiche comme périmée sur ce point précis. Un
   * balayage de `listSuperAdmins` aurait tenu la lettre en disant « liste » là
   * où le geste dit « une ligne ».
   */
  async findSuperAdminById(
    id: string,
  ): Promise<InferSelectModel<typeof superAdmins> | undefined> {
    const rows = await db
      .select()
      .from(superAdmins)
      .where(and(eq(superAdmins.id, id), isNull(superAdmins.archivedAt)))
      .limit(1);
    return rows[0];
  },

  /**
   * Les super administrateurs en exercice — **la liste que le script relit**.
   *
   * Les archivés n'y figurent pas, pour la raison de `findSuperAdminByEmail` :
   * archiver *est* le geste qui retire le droit, et une liste qui les montrerait
   * demanderait à son lecteur de refaire le tri.
   */
  async listSuperAdmins(): Promise<InferSelectModel<typeof superAdmins>[]> {
    return db
      .select()
      .from(superAdmins)
      .where(isNull(superAdmins.archivedAt))
      .orderBy(superAdmins.email);
  },

  /**
   * Les règles d'entrée 3 et 5 — l'entreprise du jeton, confrontée aux clientes.
   *
   * Rend le rattachement, donc le `domain_id` : c'est cette ligne, et elle
   * seule, qui désigne le domaine d'une session. Aucune ligne, aucun domaine —
   * l'entreprise n'est pas cliente, et le point d'entrée refuse.
   *
   * **Elle ne juge pas de l'état du domaine**, et c'est délibéré : *un domaine
   * suspendu ouvre-t-il une session ?* n'est aucune des six règles d'entrée
   * écrites dans `tickets-C9.md`. T9.1 ne tranche pas à la place de T9.2 ; le
   * point est porté dans `ETAT.md` plutôt que décidé ici en silence.
   */
  async findDomainIdentity(
    provider: (typeof identityProvider.enumValues)[number],
    value: string,
  ): Promise<InferSelectModel<typeof domainIdentities> | undefined> {
    const rows = await db
      .select()
      .from(domainIdentities)
      .where(
        and(
          eq(domainIdentities.provider, provider),
          eq(domainIdentities.value, value),
        ),
      )
      .limit(1);
    return rows[0];
  },
};

/**
 * Les deux écritures au-dessus des domaines — **et la porte qui les précède**.
 *
 * `asSuperAdmin(grant)` est à `superAdmin` ce que `forDomain(scope)` est aux
 * tables métier : on ne tient pas l'écriture, on tient de quoi l'obtenir. Le
 * corps des deux fonctions n'a pas bougé d'une ligne en T9.3 ; seule leur porte
 * est neuve.
 *
 * **L'autorité se vérifie ici, et pas seulement chez l'appelant.** Un
 * `SuperAdminGrant` n'est pas un laissez-passer : la ligne est relue avant
 * chaque écriture, et une ligne archivée entre-temps ne passe plus. Mettre la
 * frontière dans la vigilance de qui appelle est exactement ce que
 * `findSuperAdminByEmail` refuse de faire depuis T9.1.
 *
 * **Aucun `created_by` n'est écrit pour autant** : `domains` n'en a pas, T9.1
 * l'a voulu ainsi, et lui en donner un serait une migration — donc un signal
 * d'arrêt (interdits communs de C9). L'autorité est une **preuve**, pas une
 * provenance.
 */
export function asSuperAdmin(grant: SuperAdminGrant) {
  /**
   * La garde, appelée avant chaque écriture et par elles seules.
   *
   * Hors session, il n'y a rien à vérifier : un script tourne dans le terminal
   * de qui tient déjà les secrets de la base, et la clé est dans sa main avant
   * d'être dans la serrure.
   */
  async function assertAuthority(): Promise<void> {
    if (grant.kind === "outside_any_session") return;

    const admin = await superAdmin.findSuperAdminById(grant.superAdminId);
    if (!admin) {
      throw new SuperAdminRequiredError(
        "Écriture au-dessus des domaines refusée : aucun super administrateur " +
          "en exercice ne porte cette autorité.",
      );
    }
  }

  return {
    async createDomain(values: {
      name: string;
      competenceCenterName: string;
    }): Promise<InferSelectModel<typeof domains>> {
      await assertAuthority();

      const rows = await db.insert(domains).values(values).returning();
      const row = rows[0];
      if (!row) {
        throw new IntegrityError("La création du domaine n'a rien renvoyé.");
      }
      return row;
    },

    /**
     * Le seul écrivain de `super_admins` — **et il n'a qu'un appelant, un
     * script** (T9.2, `scripts/auth:super-admin`).
     *
     * **Pourquoi la fonction vit ici.** Le premier super administrateur ne peut
     * pas s'accorder depuis l'intérieur du produit : c'est l'amorçage d'un
     * droit, comme une première clé se pose de l'extérieur de la serrure. Le
     * geste doit pourtant passer par cette couche — `lib/db/client` n'est
     * importable que par ce fichier (règle 1, tenue par ESLint), et un script
     * qui ouvrirait sa propre connexion pour contourner cela contournerait la
     * règle, pas la contrainte.
     *
     * **Rejouable**, comme l'amorçage des référentiels de T8.4 : une seconde
     * pose sur la même adresse met le nom à jour et **rétablit une ligne
     * archivée** plutôt que de buter sur `super_admins_email_unique`.
     * Réaccorder le droit à quelqu'un qu'on avait archivé est un geste
     * légitime, et le refuser en silence sur un conflit d'unicité serait
     * illisible.
     */
    async upsertSuperAdmin(values: {
      email: string;
      fullName: string;
    }): Promise<{
      row: InferSelectModel<typeof superAdmins>;
      created: boolean;
    }> {
      await assertAuthority();

      /* Sur `lower(email)`, du même côté que l'index unique — et **sans écarter
         les archivés**, à la différence de `findSuperAdminByEmail` : cette
         lecture-ci cherche la ligne que la base empêcherait de doubler, pas
         celle qui ouvre une session. */
      const existing = await db
        .select()
        .from(superAdmins)
        .where(sql`lower(${superAdmins.email}) = lower(${values.email})`)
        .limit(1);

      const known = existing[0];

      if (known) {
        const updated = await db
          .update(superAdmins)
          .set({ ...values, archivedAt: null, updatedAt: new Date() })
          .where(eq(superAdmins.id, known.id))
          .returning();

        const row = updated[0];
        if (!row) {
          throw new IntegrityError(
            "La mise à jour du super administrateur n'a rien renvoyé.",
          );
        }
        return { row, created: false };
      }

      const inserted = await db.insert(superAdmins).values(values).returning();
      const row = inserted[0];
      if (!row) {
        throw new IntegrityError(
          "La création du super administrateur n'a rien renvoyé.",
        );
      }
      return { row, created: true };
    },
  };
}
