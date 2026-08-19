/**
 * Équipe — le référentiel des personnes, et ses filtres.
 *
 * Il répond à « qui compose le centre de compétence, et que sait faire
 * chacun ? », puis — depuis T5bis.3 — à « quelles personnes pourraient
 * intervenir sur un accompagnement demandant de l'UX Research **et** de
 * l'accessibilité ? ».
 *
 * **Les filtres passent par l'URL** et non par un état client : ils se
 * partagent, ils survivent à un rechargement, et l'écran reste un composant
 * serveur. Le formulaire fonctionne sans JavaScript. C'est le patron de
 * `ProjectFilters` (`app/(app)/projets/page.tsx`), **repris et non généralisé** :
 * une barre de recherche appartient à sa liste (D32), elle n'est pas un
 * composant de socle.
 *
 * **Les compétences se cumulent : l'une *et* l'autre.** Le conjonctif est la
 * question qui fonde le chantier ; un `or` y répondrait à côté.
 *
 * Un identifiant qui ne désigne rien dans le domaine est ignoré, jamais
 * affiché : inventer un libellé à partir d'un paramètre serait donner du crédit
 * à ce qu'on n'a pas lu.
 *
 * **Aucun classement, aucun décompte de correspondance** (garde-fous 2 et 3) :
 * l'ordre reste le nom quelle que soit la recherche, et une ligne retenue
 * affiche son profil entier — jamais les seules compétences qui ont filtré.
 *
 * **Une ligne ouvre la fiche, et n'emmène sur aucun écran** (D29, T5bis.4) : il
 * n'y a pas de page personne et il n'y en aura pas — la fiche est un panneau sur
 * cette même page, qui reste rendue derrière lui et porte alors `inert`.
 *
 * **Troisième page hôte de panneaux** après le produit et le projet. Depuis
 * TD.2, l'ouverture est un **état client** : `DrawerHost` monte la coquille
 * avant tout aller-retour, et `loadTeamDrawer` renvoie le corps **rendu sur le
 * serveur**. `?personne=<identifiant>` reste une **adresse** valide, et les deux
 * chemins traversent la même résolution — `lib/drawers/team.tsx` —, si bien
 * qu'aucune règle ne vit à deux endroits.
 *
 * **Le décompte d'exclusivité ne porte que sur les clés de panneau.** Les cinq
 * clés de filtre n'en sont pas : les faire compter fermerait la fiche dès qu'on
 * filtre, et les balayer à la fermeture défairait la recherche. Le décompte est
 * écrit d'avance pour les deux clés que T5bis.6 ajoutera, comme celui de la page
 * produit l'avait été pour `releve`.
 *
 * **Les sorties du panneau conservent les filtres**, à la différence des deux
 * autres pages hôtes, dont l'URL nue n'efface rien : ici elle effacerait la
 * recherche, et `docs/06` §9 veut les filtres conservés. Elles sont recomposées
 * à partir des valeurs **déjà confrontées au domaine**, jamais des paramètres
 * reçus.
 *
 * **Aucune écriture ici** : ni bouton, ni action, ni point d'entrée. Les trois
 * gestes arrivent en T5bis.6, et cet écran ne lit donc aucun droit — la fiche
 * elle-même se lit par tout le domaine (D9).
 *
 * Aucune requête directe : tout passe par `session.db`, déjà scopé sur le
 * domaine courant. Règle 1.
 */

import { asc, inArray } from "drizzle-orm";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  AVAILABILITY_LABEL,
  AvailabilityDot,
} from "@/components/team/availability-dot";
import { Avatar } from "@/components/ui/avatar";
import { DrawerHost, DrawerLink } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { borderOf, CONTROL, CONTROL_TEXT } from "@/components/ui/form-field";
import { List, ListHeader, ListRow } from "@/components/ui/list";
import { Page, PageHeader } from "@/components/ui/page";
import { Tag } from "@/components/ui/tag";
import { loadTeamDrawer } from "./drawers";
import { requireSession } from "@/lib/auth/provider";
import { jobs, personAvailability, skillLevels, skills } from "@/lib/db/schema";
import {
  resolveTeamDrawer,
  TEAM_PANEL_PARAMS,
  teamRequestFromParams,
} from "@/lib/drawers/team";
import { formatPersons } from "@/lib/format";
import { PERSON_PANEL_PARAM, ROUTES } from "@/lib/navigation";
import {
  listTeam,
  listTeamFilterOptions,
  type PersonAvailability,
  type TeamFilterOption,
  type TeamFilterOptions,
} from "@/lib/queries/team";
import { isUuid } from "@/lib/uuid";

export const metadata = {
  title: "Équipe — Vision",
};

/** Les gabarits de colonne, tenus en un seul endroit pour que l'en-tête et
 *  les lignes ne puissent pas diverger. */
const COLUMN = {
  person: "min-w-0 flex-[1.2]",
  job: "min-w-0 flex-1",
  availability: "w-52 flex-none",
  skills: "min-w-0 flex-[1.6]",
} as const;

/**
 * Les noms des paramètres d'URL.
 *
 * Quatre en français, comme les segments de route — et `q` pour la recherche,
 * que la fiche de T5bis.3 écrit ainsi. L'écart avec le `recherche` de la liste
 * des projets est consigné dans `JOURNAL-TECHNIQUE.md`.
 */
const PARAM = {
  search: "q",
  job: "metier",
  skill: "competence",
  level: "niveau",
  availability: "dispo",
} as const;

/**
 * `string | string[]` est **structurel** : `competence` est répétable, et Next
 * rend un tableau dès la seconde occurrence. Le typer en `string` seul ferait
 * mentir le compilateur sur le cas qui est justement l'objet du ticket.
 *
 * `personne` s'y ajoute en T5bis.4 : c'est une clé de **panneau** et non de
 * filtre, ce que le décompte d'exclusivité et `TEAM_PANEL_PARAMS` tiennent
 * séparément.
 */
type SearchParams = Partial<
  Record<
    (typeof PARAM)[keyof typeof PARAM] | typeof PERSON_PANEL_PARAM,
    string | string[]
  >
>;

/** La première valeur d'un paramètre qu'on n'attend qu'une fois. */
function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Toutes les valeurs d'un paramètre répétable, dédoublonnées. */
function many(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return [...new Set(Array.isArray(value) ? value : [value])];
}

/** La forme est vérifiée avant la base : un paramètre fantaisiste doit
 *  produire un écran, pas une erreur PostgreSQL. */
function uuidParam(value: string | undefined): string | undefined {
  return value && isUuid(value) ? value : undefined;
}

/** La disponibilité n'est pas un identifiant : elle se vérifie contre
 *  l'énuméré, sans aller en base. */
function availabilityParam(
  value: string | undefined,
): PersonAvailability | undefined {
  return personAvailability.enumValues.find((option) => option === value);
}

/** Les trois disponibilités, telles que le `select` les propose. Le libellé
 *  vient de la pastille : un seul endroit dit ces trois mots. */
const AVAILABILITY_OPTIONS: TeamFilterOption[] =
  personAvailability.enumValues.map((value) => ({
    id: value,
    label: AVAILABILITY_LABEL[value],
  }));

/** Les cinq filtres actifs, **déjà confrontés au domaine**. */
type AppliedFilters = {
  search: string;
  jobId: string | undefined;
  skillIds: readonly string[];
  levelId: string | undefined;
  availability: PersonAvailability | undefined;
};

/**
 * L'adresse de la liste, ses filtres conservés — et sa fiche ouverte, au besoin.
 *
 * **Elle recompose depuis les valeurs lues, jamais depuis les paramètres
 * reçus** : un identifiant d'un autre domaine a déjà été écarté, et le
 * réinjecter dans un lien serait redonner du crédit à ce qu'on n'a pas cru.
 *
 * C'est ce qui distingue cette page des deux autres pages hôtes, dont la
 * fermeture est l'URL nue : là-bas elle n'efface rien, ici elle effacerait la
 * recherche. `docs/06` §9 veut les filtres conservés.
 */
function teamHref(filters: AppliedFilters, personId?: string): string {
  const query = new URLSearchParams();

  if (filters.search) query.set(PARAM.search, filters.search);
  if (filters.jobId) query.set(PARAM.job, filters.jobId);
  // Répétable : c'est la forme que la conjonction de T5bis.3 attend.
  for (const skillId of filters.skillIds) query.append(PARAM.skill, skillId);
  if (filters.levelId) query.set(PARAM.level, filters.levelId);
  if (filters.availability) {
    query.set(PARAM.availability, filters.availability);
  }

  // La clé du panneau vient de `ROUTES`, et d'aucun autre endroit.
  const base = personId ? ROUTES.teamPerson(personId) : ROUTES.team;
  const suffix = query.toString();
  if (!suffix) return base;
  return `${base}${base.includes("?") ? "&" : "?"}${suffix}`;
}

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireSession();
  const params = await searchParams;

  const search = one(params[PARAM.search])?.trim() ?? "";
  const availability = availabilityParam(one(params[PARAM.availability]));

  const requestedJob = uuidParam(one(params[PARAM.job]));
  const requestedLevel = uuidParam(one(params[PARAM.level]));
  const requestedSkills = many(params[PARAM.skill]).filter(isUuid);

  /* Chaque valeur est confrontée au domaine avant d'être crue — la règle de
     `?produit=` (T2.5). `find` et `list` sont scopés : la valeur d'un autre
     domaine n'existe pas, elle ne « manque » pas. Les compétences passent par
     **une seule** lecture, qui confronte et fournit les libellés de la ligne de
     synthèse dans le même aller-retour ; celles que la couche n'a pas rendues
     sont simplement ignorées. */
  const [activeJob, activeLevel, activeSkills] = await Promise.all([
    requestedJob ? session.db.find(jobs, requestedJob) : undefined,
    requestedLevel ? session.db.find(skillLevels, requestedLevel) : undefined,
    requestedSkills.length > 0
      ? session.db.list(skills, {
          where: inArray(skills.id, requestedSkills),
          orderBy: [asc(skills.position), asc(skills.label)],
        })
      : [],
  ]);

  const options = await listTeamFilterOptions(session.db);

  const rows = await listTeam(session.db, {
    search: search || undefined,
    jobId: activeJob?.id,
    skillIds: activeSkills.map((skill) => skill.id),
    minRank: activeLevel?.rank,
    availability,
  });

  /** Ce qui est actif, dit en toutes lettres. Le libellé vient de la ligne lue
   *  en base, jamais du paramètre. */
  const applied: { field: string; value: string }[] = [
    ...(search ? [{ field: "Recherche", value: `« ${search} »` }] : []),
    ...(activeJob ? [{ field: "Métier", value: activeJob.label }] : []),
    ...(activeSkills.length > 0
      ? [
          {
            field:
              activeSkills.length > 1 ? "Compétences" : "Compétence",
            value: activeSkills.map((skill) => skill.label).join(" et "),
          },
        ]
      : []),
    ...(activeLevel
      ? [{ field: "Niveau minimum", value: activeLevel.label }]
      : []),
    ...(availability
      ? [{ field: "Disponibilité", value: AVAILABILITY_LABEL[availability] }]
      : []),
  ];

  /* La barre paraît dès qu'il y a quelque chose à filtrer, ou qu'un filtre est
     déjà posé — sans quoi une recherche infructueuse retirerait le formulaire
     qui l'a produite, et il n'y aurait plus aucun moyen de la corriger. */
  const showFilters = rows.length > 0 || applied.length > 0;

  const checked = new Set(activeSkills.map((skill) => skill.id));

  /* Les cinq filtres actifs, tels que les liens de repli les reconduisent : les
     valeurs lues en base, jamais les paramètres reçus. */
  const activeFilters: AppliedFilters = {
    search,
    jobId: activeJob?.id,
    skillIds: activeSkills.map((skill) => skill.id),
    levelId: activeLevel?.id,
    availability,
  };

  /* **L'URL reste une adresse, elle n'est plus le mécanisme** (TD.2). Coller
     `?personne=<identifiant>` ouvre encore la fiche, ici, au rendu serveur ; le
     clic, lui, passe par `DrawerHost` et n'écrit plus rien. Les deux chemins
     traversent ensuite la **même** résolution — `resolveTeamDrawer`.

     L'exclusivité ne vaut donc que pour ce chemin-ci : plusieurs clés de panneau
     présentes ensemble n'ouvrent **rien**. Elle est écrite en **décompte** pour
     que les deux clés de T5bis.6 l'absorbent sans que son énoncé change — la
     forme de la page produit depuis T5.2. Côté clic, elle est structurelle :
     l'état ne porte qu'une demande à la fois.

     **Les cinq clés de filtre n'y entrent pas** : ce ne sont pas des clés
     d'ouverture, et les faire compter fermerait la fiche dès qu'on filtre. */
  const panelKeys = {
    [PERSON_PANEL_PARAM]: one(params[PERSON_PANEL_PARAM]),
  };
  const conflict =
    Object.values(panelKeys).filter((value) => value !== undefined).length > 1;
  const request = teamRequestFromParams(conflict ? {} : panelKeys);

  const drawer = request ? await resolveTeamDrawer(session, request) : null;

  return (
    <DrawerHost
      initial={drawer}
      load={loadTeamDrawer}
      panelParams={TEAM_PANEL_PARAMS}
      closeHref={teamHref(activeFilters)}
    >
      <Page>
        <PageHeader
          title="Équipe"
          lead="Qui compose le centre de compétence, et que sait faire chacun ?"
        />

        {showFilters ? (
          <TeamFilters
            options={options}
            search={search}
            jobId={activeJob?.id}
            checkedSkills={checked}
            levelId={activeLevel?.id}
            availability={availability}
          />
        ) : null}

        {showFilters ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p
              // Le compteur et les filtres changent sans rechargement de page
              // perceptible : l'assistance doit l'entendre.
              aria-live="polite"
              className="flex flex-wrap items-center gap-2 text-sm text-content-neutral-dark"
            >
              <span className="font-semibold text-content-neutral-darkest">
                {formatPersons(rows.length)}
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
                href={ROUTES.team}
                className="text-sm font-semibold text-content-primary-dark underline"
              >
                Retirer tous les filtres
              </Link>
            ) : null}
          </div>
        ) : null}

        {rows.length > 0 ? (
          <List label="Les personnes du domaine">
            <ListHeader>
              <span className={COLUMN.person}>Personne</span>
              <span className={COLUMN.job}>Métier</span>
              <span className={COLUMN.availability}>Disponibilité</span>
              <span className={COLUMN.skills}>Compétences</span>
            </ListHeader>

            {rows.map((row) => (
              /* **La ligne entière ouvre la fiche** (T5bis.4), et n'emmène sur
                 aucun écran : il n'y a pas de page personne (D29). Le lien est
                 posé *dans* la `ListRow` plutôt que par son `href` — `ListRow`
                 rend un `<Link>` de navigation, et `components/ui/list.tsx` est
                 hors du périmètre de ce ticket. Le résultat est le même : un seul
                 arrêt de tabulation par personne, et une cible large.

                 **C'est un vrai `<a href>`**, dont seul le clic gauche est
                 intercepté : le `⌘`+clic, le clic milieu et l'absence de
                 JavaScript retombent sur l'adresse, qui rend la même fiche au
                 rendu serveur. Elle reconduit les filtres courants, pour que la
                 sortie du panneau ne défasse pas la recherche. */
              <ListRow key={row.id}>
                <DrawerLink
                  href={teamHref(activeFilters, row.id)}
                  request={{ kind: "personDetail", id: row.id }}
                  className="flex min-w-0 flex-1 items-center gap-4"
                >
                  <span className={`${COLUMN.person} flex items-center gap-2`}>
                    <Avatar name={row.fullName} tone={row.kind} />
                    <span className="truncate font-semibold text-content-neutral-darkest">
                      {row.fullName}
                    </span>
                    {row.kind === "stakeholder" ? (
                      <span className="flex-none text-xs text-content-neutral-base">
                        · côté entité
                      </span>
                    ) : null}
                  </span>

                  <span className={COLUMN.job}>
                    <span className="sr-only">Métier : </span>
                    {row.jobLabel ?? (
                      <span className="text-content-neutral-base">Non renseigné</span>
                    )}
                  </span>

                  {/* Un intervenant côté entité n'a pas de disponibilité : c'est une
                      propriété du centre, et la colonne reste vide plutôt que
                      d'inventer une valeur absente (arbitrage (d)). */}
                  <span className={COLUMN.availability}>
                    {row.availability ? (
                      <>
                        <span className="sr-only">Disponibilité : </span>
                        <AvailabilityDot availability={row.availability} />
                      </>
                    ) : null}
                  </span>

                  {/* Le profil entier, et non les seules compétences qui ont
                      filtré : une ligne affiche ce que la personne déclare, jamais
                      une correspondance (garde-fou 2). */}
                  <span className={COLUMN.skills}>
                    <span className="sr-only">Compétences : </span>
                    {row.skills.length > 0 ? (
                      <span className="flex flex-wrap gap-1.5">
                        {row.skills.map((skill) => (
                          <Tag
                            key={skill.id}
                            label={`${skill.label} · ${skill.levelLabel}`}
                          />
                        ))}
                      </span>
                    ) : (
                      <span className="text-content-neutral-base">
                        Aucune compétence déclarée
                      </span>
                    )}
                  </span>
                </DrawerLink>
              </ListRow>
            ))}
          </List>
        ) : applied.length > 0 ? (
          <EmptyState
            title="Aucune personne ne répond à ces critères"
            description="Les filtres se combinent : chacun restreint le résultat du précédent, et les compétences cochées se cumulent — une personne doit les porter toutes. En décocher une suffit peut-être à retrouver ce que vous cherchez."
            action={
              <Link
                href={ROUTES.team}
                className="text-sm font-semibold text-content-primary-dark underline"
              >
                Voir toutes les personnes
              </Link>
            }
          />
        ) : (
          <EmptyState
            title="Aucune personne pour l'instant"
            description="Cette liste réunira les membres du centre de compétence et les intervenants côté entité — leur métier, leur disponibilité, et les compétences que chacun déclare. C'est ce référentiel qui dira un jour qui pourrait intervenir sur un accompagnement."
          />
        )}
      </Page>
    </DrawerHost>
  );
}

/**
 * La barre de filtres.
 *
 * Un `form method="get"` : le navigateur écrit lui-même l'URL, l'écran la
 * relit, et rien n'est conservé en mémoire côté client. Chaque contrôle se
 * réaffiche sur la valeur active — le formulaire dit l'état de l'URL.
 *
 * Locale à cet écran, comme `ProjectFilters` l'est resté à la sienne : c'est
 * une barre de recherche de liste (D32), pas un composant de socle.
 *
 * **Deux rangs, et le second est un `<fieldset>`** : onze compétences ne
 * tiennent pas dans une barre en ligne, et un `<fieldset>` est ce qui dit à
 * l'assistance que ces cases forment un groupe et lui donne son nom.
 *
 * Les classes de contrôle viennent de `components/ui/form-field.tsx` — les
 * jetons y sont mesurés depuis T2.3 (`content-neutral-normal` à 3,88:1 sur
 * `surface-neutral-pale`, la bordure d'un composant se lisant à 3:1). **Aucun
 * jeton neuf, aucun septième substitut** ; les cases à cocher restent natives.
 */
function TeamFilters({
  options,
  search,
  jobId,
  checkedSkills,
  levelId,
  availability,
}: {
  options: TeamFilterOptions;
  search: string;
  jobId: string | undefined;
  checkedSkills: ReadonlySet<string>;
  levelId: string | undefined;
  availability: PersonAvailability | undefined;
}) {
  return (
    <form
      method="get"
      action={ROUTES.team}
      className="flex flex-col gap-3"
      aria-label="Filtrer les personnes"
    >
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Rechercher" htmlFor="filtre-q" className="min-w-60 flex-1">
          <input
            id="filtre-q"
            type="search"
            name={PARAM.search}
            defaultValue={search}
            placeholder="Un nom…"
            className={`${CONTROL_TEXT} ${borderOf(undefined)}`}
          />
        </Field>

        <Select
          id="filtre-metier"
          label="Métier"
          name={PARAM.job}
          all="Tous"
          options={options.jobs}
          value={jobId}
          className="w-56"
        />
        {/* « Au moins ce niveau » : c'est un seuil, d'où l'échelle entière et
            l'intitulé qui le dit. */}
        <Select
          id="filtre-niveau"
          label="Niveau minimum"
          name={PARAM.level}
          all="Tous"
          options={options.levels}
          value={levelId}
          className="w-52"
        />
        <Select
          id="filtre-dispo"
          label="Disponibilité"
          name={PARAM.availability}
          all="Toutes"
          options={AVAILABILITY_OPTIONS}
          value={availability}
          className="w-56"
        />

        <button
          type="submit"
          className="rounded-lg bg-surface-primary-base px-4 py-2 text-sm font-semibold text-content-neutral-pale"
        >
          Filtrer
        </button>
      </div>

      {options.skills.length > 0 ? (
        <fieldset>
          <legend className="mb-2 text-2xs font-semibold text-content-neutral-dark uppercase">
            Compétences — cochées, elles se cumulent
          </legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {options.skills.map((skill) => (
              <label
                key={skill.id}
                className="flex items-center gap-2 text-sm text-content-neutral-darkest"
              >
                <input
                  type="checkbox"
                  name={PARAM.skill}
                  value={skill.id}
                  defaultChecked={checkedSkills.has(skill.id)}
                  className="h-4 w-4 flex-none"
                />
                {skill.label}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
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
  className,
}: {
  id: string;
  label: string;
  name: string;
  /** « Toutes » ou « Tous », selon le genre du concept. */
  all: string;
  options: TeamFilterOption[];
  value: string | undefined;
  className?: string;
}) {
  if (options.length === 0) return null;

  return (
    <Field label={label} htmlFor={id} className={className}>
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
