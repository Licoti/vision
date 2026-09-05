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
 * **Les sept colonnes de `docs/06` §4 depuis T8.2** — nom, produit, entité,
 * statut, métiers, équipe, dernière activité —, et dans son ordre. Les deux
 * dernières venues ont attendu un chantier : T7.2 avait posé leurs **filtres**
 * sans poser leurs colonnes, son « Attendu » ne les nommant pas, et les ajouter
 * alors aurait été une fonctionnalité hors du ticket (règle 3).
 *
 * **L'entité se lit sur le produit**, jamais sur l'accompagnement — il n'en
 * porte pas —, et **les métiers sont ceux qu'il déclare** (D44), jamais ceux que
 * son équipe porte : les deux peuvent diverger, et c'est le déclaré qui fait
 * foi, comme pour le filtre du même nom.
 *
 * Un identifiant qui ne désigne rien dans le domaine est ignoré, jamais
 * affiché : inventer un libellé à partir d'un paramètre serait donner du
 * crédit à ce qu'on n'a pas lu.
 *
 * **« Nouvel accompagnement » n'apparaît qu'au responsable de domaine**
 * (F1-D1, D9) : l'action est absente du rendu pour tout autre, pas grisée.
 *
 * Aucune requête directe : tout passe par `session.db`, déjà scopé sur le
 * domaine courant. Règle 1.
 */

import Link from "next/link";
import type { ReactNode } from "react";

import { ACTION_LINK_SM } from "@/components/ui/action-link";
import { AvatarGroup } from "@/components/ui/avatar";
import { Button, buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { borderOf, CONTROL, CONTROL_TEXT } from "@/components/ui/form-field";
import { List, ListHeader, ListRow } from "@/components/ui/list";
import { Page, PageHeader } from "@/components/ui/page";
import { StatusPill } from "@/components/ui/status-pill";
import { requireSession } from "@/lib/auth/provider";
import { approaches, entities, jobs, projectStatuses } from "@/lib/db/schema";
import { formatAccompaniments, formatMonth } from "@/lib/format";
import { PROJECT_FILTER_PARAM, ROUTES } from "@/lib/navigation";
import {
  listProjectFilterOptions,
  listProjects,
  type FilterOption,
  type ProjectFilterOptions,
} from "@/lib/queries/projects";
import { isUuid } from "@/lib/uuid";

export const metadata = {
  title: "Accompagnements — Vision",
};

/** Les gabarits de colonne, tenus en un seul endroit pour que l'en-tête et
 *  les lignes ne puissent pas diverger. **Leur ordre est celui de
 *  `docs/06` §4**, et il n'a pas d'autre raison.
 *
 *  **Sous `xl`, la ligne se replie** (T7.6) : les colonnes fixes étaient rognées
 *  avant de se rétrécir. Le nom prend sa ligne, le reste suit.
 *
 *  **T8.2 en ajoute deux, et les nombres bougent** : les colonnes fixes passent
 *  de 336 px à **592**, gouttières comprises de 400 à **688**. Le palier de
 *  repli, lui, ne bouge pas — mesuré à 375, 1280 et 1440 px, rien n'est rogné :
 *  le repli sous `xl` fait son office, et au-delà ce sont les deux colonnes
 *  élastiques qui cèdent, jamais la carte qui coupe. */
const COLUMN = {
  name: "w-full min-w-0 xl:w-auto xl:flex-[1.4]",
  product: "min-w-0 xl:flex-1",
  entity: "min-w-0 flex-none truncate xl:w-28",
  status: "flex-none xl:w-28",
  jobs: "min-w-0 flex-none xl:w-36",
  team: "flex-none xl:w-28",
  freshness: "flex-none text-right xl:w-28",
} as const;

/**
 * Les noms des paramètres d'URL. En français, comme les segments de route.
 *
 * **Les quatre filtres viennent de `lib/navigation.ts`** : `approche` et
 * `statut` y sont montés en T6.7, quand la répartition de la vue d'ensemble
 * s'est mise à servir des chiffres cliquables vers cet écran — une clé qui vit
 * à deux endroits n'en est plus une — et `entite` et `metier` les y rejoignent
 * en T7.2, avec la troisième dimension de cette même répartition.
 *
 * `recherche` reste ici, et c'est la frontière de `docs/06` §4 : elle sépare
 * les **filtres**, chacun le nom d'un référentiel, de la **recherche**, qui
 * court sur trois colonnes. Rien hors de cette page ne l'écrit.
 */
const PARAM = {
  search: "recherche",
  entity: PROJECT_FILTER_PARAM.entity,
  job: PROJECT_FILTER_PARAM.job,
  approach: PROJECT_FILTER_PARAM.approach,
  status: PROJECT_FILTER_PARAM.status,
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
        title="Accompagnements"
        lead="Quels accompagnements existent en ce moment, tous produits confondus ?"
        action={session.can.manageDomain ? <NewProjectLink /> : null}
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
              {formatAccompaniments(rows.length)}
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
              className={ACTION_LINK_SM}
            >
              Retirer tous les filtres
            </Link>
          ) : null}
        </div>
      ) : null}

      {rows.length > 0 ? (
        <List label="Accompagnements, tous produits confondus">
          <ListHeader>
            <span className={COLUMN.name}>Accompagnement</span>
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

              {/* L'entité **du produit**, jamais de l'accompagnement : c'est
                  la lecture de `docs/06` §4, et la même que celle du filtre
                  d'entité posé par T7.2. Rien n'est rendu quand la lecture n'a
                  pas su la nommer — cas forgé d'un produit dont l'entité est
                  d'un autre domaine : un libellé inventé serait pire qu'un
                  blanc, et un `sr-only` sans valeur annoncerait du vide. */}
              <span className={COLUMN.entity}>
                {row.entityLabel ? (
                  <>
                    <span className="sr-only">Entité : </span>
                    {row.entityLabel}
                  </>
                ) : null}
              </span>

              <span className={`${COLUMN.status} flex items-center`}>
                <span className="sr-only">Statut : </span>
                <StatusPill nature={row.statusNature} label={row.statusLabel} />
              </span>

              {/* **Les métiers déclarés** (D44), joints par le point médian de
                  `/equipe` — une liste courte se lit mieux en une phrase qu'en
                  pastilles, et des pastilles ici feraient une seconde colonne de
                  statuts. L'absence s'écrit en toutes lettres : « Aucun métier
                  déclaré » dit qui n'a rien déclaré, quand une cellule vide
                  laisserait croire à un défaut d'affichage — la règle de « Aucun
                  plan déclaré » sur la liste des produits. Aucun décompte :
                  ce sont des libellés, pas un nombre qui qualifierait
                  l'accompagnement (D39). */}
              <span className={COLUMN.jobs}>
                <span className="sr-only">Métiers : </span>
                {row.jobLabels.length > 0 ? (
                  row.jobLabels.join(" · ")
                ) : (
                  <span className="text-content-neutral-base">
                    Aucun métier déclaré
                  </span>
                )}
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
          title="Aucun accompagnement ne répond à ces critères"
          description="Les filtres se combinent : chacun restreint le résultat du précédent. En retirer un suffit peut-être à retrouver ce que vous cherchez."
          action={
            <Link
              href={ROUTES.projects}
              className={ACTION_LINK_SM}
            >
              Voir tous les accompagnements
            </Link>
          }
        />
      ) : (
        <EmptyState
          title="Aucun accompagnement pour l'instant"
          description="Cette liste réunira tous les accompagnements, tous produits confondus — une lecture transverse de ce que fait le centre. Chaque ligne portera son produit de rattachement, cliquable, pour que la hiérarchie reste à portée."
          {...(session.can.manageDomain
            ? { action: <NewProjectLink /> }
            : {})}
        />
      )}
    </Page>
  );
}

/** L'action de création. Rendue par l'appelant, et lui seul, sous condition
 *  de droit — ce composant n'en connaît aucun. */
function NewProjectLink() {
  return (
    <Link
      href={ROUTES.projectNew}
      className={buttonClass()}
    >
      Nouvel accompagnement
    </Link>
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
      aria-label="Filtrer les accompagnements"
    >
      <Field label="Rechercher" htmlFor="filtre-recherche" className="min-w-60 flex-1">
        <input
          id="filtre-recherche"
          type="search"
          name={PARAM.search}
          defaultValue={search}
          placeholder="Un nom, un objectif, un membre…"
          className={`${CONTROL_TEXT} ${borderOf(undefined)}`}
        />
      </Field>

      {/* L'ordre des quatre est celui de `docs/06` §4 : entité, métier,
          approche, statut. Chacun se masque seul quand sa liste est vide. */}
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

      <Button type="submit">Filtrer</Button>
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
        className={`${CONTROL} ${borderOf(undefined)}`}
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
