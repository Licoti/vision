/**
 * Projets — la liste transverse, raccourci vers le même arbre.
 *
 * Elle répond à « quels accompagnements existent en ce moment, tous produits
 * confondus ». Elle ne remplace pas la hiérarchie, elle la traverse : **le
 * produit de rattachement est sur chaque ligne et cliquable** (docs/06 §4),
 * seul garant que la structure reste lisible depuis le raccourci.
 *
 * **Les filtres passent par l'URL** et non par un état client : ils se
 * partagent, ils survivent à un rechargement, et l'écran reste un composant
 * serveur. Quatre dimensions plus une recherche font un formulaire `GET` — la
 * forme en pastilles de la liste des produits tenait à une seule dimension ;
 * ici elle produirait une vingtaine de pastilles. Le formulaire fonctionne
 * sans JavaScript.
 *
 * Un identifiant qui ne désigne rien dans le domaine est ignoré, jamais
 * affiché : inventer un libellé à partir d'un paramètre serait donner du
 * crédit à ce qu'on n'a pas lu.
 *
 * Aucune requête directe : tout passe par `session.db`, déjà scopé sur le
 * domaine courant. Règle 1.
 */

import Link from "next/link";
import type { ReactNode } from "react";

import { AvatarGroup } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { List, ListHeader, ListRow } from "@/components/ui/list";
import { Page, PageHeader } from "@/components/ui/page";
import { StatusDot } from "@/components/ui/status-dot";
import { requireSession } from "@/lib/auth/provider";
import { approaches, entities, jobs, projectStatuses } from "@/lib/db/schema";
import { formatMonth, formatProjects } from "@/lib/format";
import { ROUTES } from "@/lib/navigation";
import {
  listProjectFilterOptions,
  listProjects,
  type FilterOption,
  type ProjectFilterOptions,
} from "@/lib/queries/projects";
import { isUuid } from "@/lib/uuid";

export const metadata = {
  title: "Projets — Vision",
};

/** Les gabarits de colonne, tenus en un seul endroit pour que l'en-tête et
 *  les lignes ne puissent pas diverger. */
const COLUMN = {
  name: "min-w-0 flex-[1.4]",
  product: "min-w-0 flex-1",
  entity: "w-32 flex-none",
  status: "w-28 flex-none",
  jobs: "w-40 flex-none",
  team: "w-28 flex-none",
  freshness: "w-28 flex-none text-right",
} as const;

/** Les noms des paramètres d'URL. En français, comme les segments de route. */
const PARAM = {
  search: "recherche",
  entity: "entite",
  job: "metier",
  approach: "approche",
  status: "statut",
} as const;

type SearchParams = Partial<Record<(typeof PARAM)[keyof typeof PARAM], string>>;

/** La forme est vérifiée avant la base : un paramètre fantaisiste doit
 *  produire un écran, pas une erreur PostgreSQL. */
function uuidParam(value: string | undefined): string | undefined {
  return value && isUuid(value) ? value : undefined;
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireSession();
  const params = await searchParams;

  const search = params[PARAM.search]?.trim() ?? "";

  const requestedEntity = uuidParam(params[PARAM.entity]);
  const requestedJob = uuidParam(params[PARAM.job]);
  const requestedApproach = uuidParam(params[PARAM.approach]);
  const requestedStatus = uuidParam(params[PARAM.status]);

  // Chaque paramètre est confronté au domaine avant d'être cru. `find` est
  // scopé : la valeur d'un autre domaine n'existe pas, elle ne « manque » pas.
  const [activeEntity, activeJob, activeApproach, activeStatus] =
    await Promise.all([
      requestedEntity ? session.db.find(entities, requestedEntity) : undefined,
      requestedJob ? session.db.find(jobs, requestedJob) : undefined,
      requestedApproach
        ? session.db.find(approaches, requestedApproach)
        : undefined,
      requestedStatus
        ? session.db.find(projectStatuses, requestedStatus)
        : undefined,
    ]);

  const options = await listProjectFilterOptions(session.db);

  const rows = await listProjects(session.db, {
    entityId: activeEntity?.id,
    jobId: activeJob?.id,
    approachId: activeApproach?.id,
    statusId: activeStatus?.id,
    search: search || undefined,
  });

  /** Ce qui est actif, dit en toutes lettres. Le libellé vient de la ligne
   *  lue en base, jamais du paramètre. */
  const applied: { field: string; value: string }[] = [
    ...(search ? [{ field: "Recherche", value: `« ${search} »` }] : []),
    ...(activeEntity ? [{ field: "Entité", value: activeEntity.label }] : []),
    ...(activeJob ? [{ field: "Métier", value: activeJob.label }] : []),
    ...(activeApproach
      ? [{ field: "Approche", value: activeApproach.label }]
      : []),
    ...(activeStatus ? [{ field: "Statut", value: activeStatus.label }] : []),
  ];

  const hasOptions =
    options.entities.length > 0 ||
    options.jobs.length > 0 ||
    options.approaches.length > 0 ||
    options.statuses.length > 0;

  return (
    <Page>
      <PageHeader
        title="Projets"
        lead="Quels accompagnements existent en ce moment, tous produits confondus ?"
      />

      {hasOptions ? (
        <ProjectFilters
          options={options}
          search={search}
          entityId={activeEntity?.id}
          jobId={activeJob?.id}
          approachId={activeApproach?.id}
          statusId={activeStatus?.id}
        />
      ) : null}

      {hasOptions ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p
            // Le compteur et les filtres changent sans rechargement de page
            // perceptible : l'assistance doit l'entendre.
            aria-live="polite"
            className="flex flex-wrap items-center gap-2 text-sm text-content-neutral-dark"
          >
            <span className="font-semibold text-content-neutral-darkest">
              {formatProjects(rows.length)}
            </span>
            {applied.map((filter) => (
              <span key={filter.field} className="flex items-center gap-2">
                <span aria-hidden="true" className="text-content-neutral-light">
                  ·
                </span>
                {filter.field} : {filter.value}
              </span>
            ))}
          </p>

          {applied.length > 0 ? (
            <Link
              href={ROUTES.projects}
              className="text-sm font-semibold text-content-primary-dark underline"
            >
              Retirer tous les filtres
            </Link>
          ) : null}
        </div>
      ) : null}

      {rows.length > 0 ? (
        <List label="Accompagnements, tous produits confondus">
          <ListHeader>
            <span className={COLUMN.name}>Projet</span>
            <span className={COLUMN.product}>Produit</span>
            <span className={COLUMN.entity}>Entité</span>
            <span className={COLUMN.status}>Statut</span>
            <span className={COLUMN.jobs}>Métiers</span>
            <span className={COLUMN.team}>Équipe</span>
            <span className={COLUMN.freshness}>Dernière act.</span>
          </ListHeader>

          {rows.map((row) => (
            // La ligne n'est pas cliquable en entier : elle porte deux liens,
            // le projet et son produit, et l'un ne peut pas contenir l'autre.
            <ListRow key={row.id}>
              <span className={COLUMN.name}>
                <Link
                  href={ROUTES.project(row.id)}
                  className="font-semibold text-content-neutral-darkest"
                >
                  {row.name}
                </Link>
              </span>

              <span className={COLUMN.product}>
                <span className="sr-only">Produit : </span>
                <Link
                  href={ROUTES.product(row.productId)}
                  className="text-content-primary-dark underline"
                >
                  {row.productName}
                </Link>
              </span>

              <span className={COLUMN.entity}>
                <span className="sr-only">Entité : </span>
                {row.entityLabel}
              </span>

              <span className={`${COLUMN.status} flex items-center gap-2`}>
                <StatusDot nature={row.statusNature} />
                <span>
                  <span className="sr-only">Statut : </span>
                  {row.statusLabel}
                </span>
              </span>

              <span className={`${COLUMN.jobs} text-content-neutral-base`}>
                {row.jobLabels.length > 0 ? (
                  <>
                    <span className="sr-only">Métiers : </span>
                    {row.jobLabels.join(" · ")}
                  </>
                ) : null}
              </span>

              <span className={COLUMN.team}>
                <AvatarGroup names={row.team.map((member) => member.fullName)} />
              </span>

              <span className={`${COLUMN.freshness} text-content-neutral-base`}>
                <span className="sr-only">Dernière activité : </span>
                {row.lastActivityAt
                  ? formatMonth(row.lastActivityAt)
                  : "aucune à ce jour"}
              </span>
            </ListRow>
          ))}
        </List>
      ) : applied.length > 0 ? (
        <EmptyState
          title="Aucun projet ne répond à ces critères"
          description="Les filtres se combinent : chacun restreint le résultat du précédent. En retirer un suffit peut-être à retrouver ce que vous cherchez."
          action={
            <Link
              href={ROUTES.projects}
              className="text-sm font-semibold text-content-primary-dark underline"
            >
              Voir tous les projets
            </Link>
          }
        />
      ) : (
        <EmptyState
          title="Aucun accompagnement pour l'instant"
          description="Cette liste réunira tous les accompagnements, tous produits confondus — une lecture transverse de ce que fait le centre. Chaque ligne portera son produit de rattachement, cliquable, pour que la hiérarchie reste à portée."
        />
      )}
    </Page>
  );
}

/**
 * La barre de filtres.
 *
 * Un `form method="get"` : le navigateur écrit lui-même l'URL, l'écran la
 * relit, et rien n'est conservé en mémoire côté client. Chaque liste se
 * réaffiche sur la valeur active — le formulaire dit l'état de l'URL.
 *
 * Locale à cet écran, comme les pastilles d'entité le sont restées à la liste
 * des produits : c'est une barre de recherche de liste (D32), pas un composant
 * de socle.
 *
 * Le filet des contrôles est plus sombre que celui des blocs : la bordure d'un
 * champ est la limite d'un composant d'interface, elle se mesure à 3:1 et non
 * à 4,5:1 — aucun jeton `border-*` du design system ne l'atteint sur ce fond.
 */
function ProjectFilters({
  options,
  search,
  entityId,
  jobId,
  approachId,
  statusId,
}: {
  options: ProjectFilterOptions;
  search: string;
  entityId: string | undefined;
  jobId: string | undefined;
  approachId: string | undefined;
  statusId: string | undefined;
}) {
  return (
    <form
      method="get"
      action={ROUTES.projects}
      className="flex flex-wrap items-end gap-3"
      aria-label="Filtrer les projets"
    >
      <Field label="Rechercher" htmlFor="filtre-recherche" className="min-w-60 flex-1">
        <input
          id="filtre-recherche"
          type="search"
          name={PARAM.search}
          defaultValue={search}
          placeholder="Un nom, un objectif, un membre…"
          className="w-full rounded-lg border border-content-neutral-normal bg-surface-neutral-pale px-3 py-2 text-sm text-content-neutral-darkest placeholder:text-content-neutral-base"
        />
      </Field>

      <Select
        id="filtre-entite"
        label="Entité"
        name={PARAM.entity}
        all="Toutes"
        options={options.entities}
        value={entityId}
      />
      <Select
        id="filtre-metier"
        label="Métier"
        name={PARAM.job}
        all="Tous"
        options={options.jobs}
        value={jobId}
      />
      <Select
        id="filtre-approche"
        label="Approche"
        name={PARAM.approach}
        all="Toutes"
        options={options.approaches}
        value={approachId}
      />
      <Select
        id="filtre-statut"
        label="Statut"
        name={PARAM.status}
        all="Tous"
        options={options.statuses}
        value={statusId}
      />

      <button
        type="submit"
        className="rounded-lg bg-surface-primary-base px-4 py-2 text-sm font-semibold text-content-neutral-pale"
      >
        Filtrer
      </button>
    </form>
  );
}

/** Un champ et son étiquette — jamais un placeholder à la place du libellé. */
function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <label
        htmlFor={htmlFor}
        className="text-2xs font-semibold text-content-neutral-dark uppercase"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

/** Une liste déroulante de filtre. L'option vide retire le filtre. */
function Select({
  id,
  label,
  name,
  all,
  options,
  value,
}: {
  id: string;
  label: string;
  name: string;
  /** « Toutes » ou « Tous », selon le genre du concept. */
  all: string;
  options: FilterOption[];
  value: string | undefined;
}) {
  if (options.length === 0) return null;

  return (
    <Field label={label} htmlFor={id}>
      <select
        id={id}
        name={name}
        defaultValue={value ?? ""}
        className="rounded-lg border border-content-neutral-normal bg-surface-neutral-pale px-3 py-2 text-sm text-content-neutral-darkest"
      >
        <option value="">{all}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
