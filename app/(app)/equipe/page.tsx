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
 * `ProjectFilters` (`app/(app)/accompagnements/page.tsx`), **repris et non généralisé** :
 * une barre de recherche appartient à sa liste (D32), elle n'est pas un
 * composant de socle.
 *
 * **Les compétences se cumulent : l'une *et* l'autre.** Le conjonctif est la
 * question qui fonde le chantier ; un `or` y répondrait à côté.
 *
 * ---
 *
 * **Reprise d'ergonomie du 31/08/2026 — direction B, « la question à gauche,
 * les personnes à droite ».** Retenue par l'humain sur un canevas de maquettes
 * qui portait un diagnostic de dix-sept frictions et trois directions. Ce que
 * la direction change, et pourquoi :
 *
 * 1. **Les cinq filtres passent dans un rail collant de 320 px**, la forme
 *    retenue sur la vue d'ensemble le 29/08. Ils occupaient jusqu'ici 138 px en
 *    tête d'écran, **avant la première personne**, et ne se repliaient jamais :
 *    sur huit personnes, le filtre prenait plus de hauteur que ce qu'il
 *    filtrait. Dans un rail, rien ne se replie et rien ne se cherche.
 * 2. **Les onze cases à cocher deviennent des pastilles** —
 *    `FILTER_CHIP`, la variante sans case de la pastille extraite du
 *    formulaire de projet — lequel avait posé la condition de sa propre
 *    extraction. Les cases natives mesuraient 16 px de côté ; elles sont
 *    désormais masquées, et c'est la pastille — 39 px de haut au calibre `xs`,
 *    de 100 à 250 de large — qui est le contrôle.
 * 3. **Le décompte du domaine monte en ligne de faits.** `PageHeader.facts`
 *    attendait un appelant depuis le 28/08. Elle porte ce qui ne bouge pas avec
 *    les filtres — la taille du centre et le nombre d'intervenants côté entité ;
 *    le compteur de résultats, lui, reste au-dessus de la liste, où il change.
 * 4. **La ligne de synthèse cesse de répéter l'état des contrôles**, et ne porte
 *    plus que le décompte. Elle énumérait « Métier : UX Research » quand le
 *    `select` l'affichait déjà ; c'est le rail qui dit ce qui est actif — un
 *    `select` posé, une pastille cochée —, et **c'est au pied du rail que le
 *    retrait a rejoint les contrôles qu'il vide**.
 * 5. **Le métier descend sous le nom**, avec la mention « côté entité » — la
 *    formulation exacte de `PersonDetailHeader`, si bien que la ligne et la
 *    fiche disent la même chose de la même façon. Il gagne
 *    `content-neutral-dark` au passage : « côté entité » était jusqu'ici la
 *    mention la plus faible de la ligne alors qu'elle décide de trois choses.
 * 6. **La colonne des compétences se borne à deux étiquettes, puis « +N ».**
 *    Elle en portait jusqu'à cinq, sur trois rangs : la hauteur d'une ligne
 *    variait de 58 à 122 px, et c'est la comparaison ligne à ligne — celle qui
 *    fonde la liste dense (`components/ui/list.tsx`) — qui tombait.
 * 7. **Un chevron annonce que la ligne ouvre un panneau**, et non un écran :
 *    sur `/accompagnements`, une ligne du même dessin emmène ailleurs.
 *
 * **Ce que la direction coûte, et qui était nommé au canevas** : le rail prend
 * 320 px à une liste dont les colonnes étaient déjà serrées, et « +3 » cache ce
 * que la ligne portait. Rien n'est perdu — la fiche porte le profil entier, et
 * c'est elle qui a la place de l'écrire.
 *
 * **Ce que la reprise ne touche pas** : la fiche en panneau, hors périmètre par
 * consigne. Aucune requête, aucune action, aucun droit, aucune migration.
 *
 * ---
 *
 * Un identifiant qui ne désigne rien dans le domaine est ignoré, jamais
 * affiché : inventer un libellé à partir d'un paramètre serait donner du crédit
 * à ce qu'on n'a pas lu.
 *
 * **Aucun classement, aucun décompte de correspondance** (garde-fous 2 et 3) :
 * l'ordre reste le nom quelle que soit la recherche, et les compétences d'une
 * ligne sont les premières **du profil**, dans l'ordre que la requête rend —
 * jamais celles qui ont filtré.
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
 * filtre, et les balayer à la fermeture défairait la recherche.
 *
 * **Les sorties du panneau conservent les filtres**, à la différence des deux
 * autres pages hôtes, dont l'URL nue n'efface rien : ici elle effacerait la
 * recherche, et `docs/06` §9 veut les filtres conservés. Elles sont recomposées
 * à partir des valeurs **déjà confrontées au domaine**, jamais des paramètres
 * reçus.
 *
 * **Un seul geste sur cet écran** (T5bis.6) : « Ajouter une personne », rendu au
 * seul `manageDomain` (arbitrage (c)). Les cinq autres vivent dans la fiche, et
 * la lecture, elle, ne passe par aucun droit (D9). Ce n'est pas ce rendu qui
 * protège : les six actions redérivent le droit sur l'identifiant **reçu**.
 *
 * Aucune requête directe : tout passe par `session.db`, déjà scopé sur le
 * domaine courant. Règle 1.
 */

import { asc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  AVAILABILITY_LABEL,
  AvailabilityDot,
} from "@/components/team/availability-dot";
import { ACTION_LINK_SM } from "@/components/ui/action-link";
import { Avatar } from "@/components/ui/avatar";
import { Button, buttonClass } from "@/components/ui/button";
import {
  filterChipClass,
  FILTER_CHIP_INPUT,
} from "@/components/ui/checkbox-chip";
import { DrawerHost, DrawerLink } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { borderOf, CONTROL, CONTROL_TEXT } from "@/components/ui/form-field";
import {
  LIST_ROW_FLEX,
  List,
  ListHeader,
  ListRow,
} from "@/components/ui/list";
import { Page, PageHeader } from "@/components/ui/page";
import { Section } from "@/components/ui/section";
import { Tag } from "@/components/ui/tag";
import { loadTeamDrawer } from "./drawers";
import { requireSession } from "@/lib/auth/provider";
import { PERSON_AVAILABILITY_VALUES } from "@/lib/availability";
import { jobs, persons, skillLevels, skills } from "@/lib/db/schema";
import {
  resolveTeamDrawer,
  TEAM_PANEL_PARAMS,
  teamRequestFromParams,
} from "@/lib/drawers/team";
import { formatPersons } from "@/lib/format";
import {
  ARCHIVE_PANEL_PARAM,
  DELETE_PANEL_PARAM,
  PERSON_FORM_NEW,
  PERSON_FORM_PARAM,
  PERSON_PANEL_PARAM,
  ROUTES,
  SKILL_PANEL_PARAM,
} from "@/lib/navigation";
import {
  listTeam,
  listTeamFilterOptions,
  type PersonAvailability,
  type TeamFilterOption,
  type TeamFilterOptions,
  type TeamMemberRow,
} from "@/lib/queries/team";
import { isUuid } from "@/lib/uuid";

export const metadata = {
  title: "Équipe — Vision",
};

/**
 * Les gabarits de colonne, tenus en un seul endroit pour que l'en-tête et
 * les lignes ne puissent pas diverger.
 *
 * **Trois colonnes depuis la direction B**, et non quatre : le métier a rejoint
 * le nom, dans la ligne qui le qualifie. C'est ce qui rend au profil la place
 * que le rail lui prend.
 *
 * **Sous `xl`, la ligne se replie** (T7.6). La personne et ses compétences
 * prennent chacune leur ligne : ce sont les deux seules colonnes dont le
 * contenu est une liste, et les serrer côte à côte sur un téléphone les rendait
 * illisibles l'une comme l'autre.
 */
const COLUMN = {
  person: "w-full min-w-0 xl:w-auto xl:flex-[1.2]",
  availability: "flex-none xl:w-40",
  skills: "w-full min-w-0 xl:w-auto xl:flex-[1.6]",
} as const;

/**
 * Combien de compétences une **ligne** affiche avant de compter le reste.
 *
 * **Deux, et le nombre est une mesure et non un goût.** À 1 440 px, le contenu
 * fait 1 112 px ; le rail en prend 320 et sa gouttière 24, la carte 40 de
 * padding, les gouttières de colonne 48, la disponibilité 160 et le chevron 16 :
 * il reste environ 288 px pour les compétences. Une étiquette
 * « compétence · niveau » en mesure de 180 à 320. Deux tiennent sur deux rangs,
 * cinq en demandaient trois à quatre — et c'est cette variation, de 58 à 122 px
 * de hauteur de ligne, que la direction B corrige.
 *
 * **Ce ne sont pas les compétences qui ont filtré**, et la nuance porte le
 * garde-fou 2 : la requête rend le profil dans son ordre — rang décroissant,
 * puis libellé —, et la ligne en montre le début. Elle n'affiche jamais une
 * correspondance, et le reste n'est pas caché : il est dans la fiche, à un clic.
 */
const LIST_SKILLS_SHOWN = 2;

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
 * mentir le compilateur sur le cas qui est justement l'objet de T5bis.3.
 *
 * Les clés de panneau s'y ajoutent — `personne` en T5bis.4, puis `profil`,
 * `maitrise` et `archiver` en T5bis.6, et `supprimer` le 28/08/2026. Ce ne sont
 * pas des filtres, ce que le décompte d'exclusivité et `TEAM_PANEL_PARAMS`
 * tiennent séparément.
 */
type PanelParam =
  | typeof PERSON_PANEL_PARAM
  | typeof PERSON_FORM_PARAM
  | typeof SKILL_PANEL_PARAM
  | typeof ARCHIVE_PANEL_PARAM
  | typeof DELETE_PANEL_PARAM;

type SearchParams = Partial<
  Record<(typeof PARAM)[keyof typeof PARAM] | PanelParam, string | string[]>
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

/** La disponibilité n'est pas un identifiant : elle se vérifie contre la liste
 *  fermée, sans aller en base. **Celle-ci ne vient plus du schéma** — la colonne
 *  est tombée le 28/08/2026 —, mais de `lib/availability.ts`, qui porte aussi la
 *  règle qui la produit. */
function availabilityParam(
  value: string | undefined,
): PersonAvailability | undefined {
  return PERSON_AVAILABILITY_VALUES.find((option) => option === value);
}

/** Les trois disponibilités, telles que le `select` les propose. Le libellé
 *  vient de la pastille : un seul endroit dit ces trois mots. */
const AVAILABILITY_OPTIONS: TeamFilterOption[] =
  PERSON_AVAILABILITY_VALUES.map((value) => ({
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
function teamHref(
  filters: AppliedFilters,
  /**
   * Le panneau à rouvrir sur cette adresse, s'il y en a un. La clé vient de
   * `lib/navigation.ts`, et d'aucun autre endroit — elle est posée **avant** les
   * filtres pour que l'adresse se lise dans l'ordre où elle se raconte.
   */
  panel?: { key: PanelParam; value: string },
): string {
  const query = new URLSearchParams();

  if (panel) query.set(panel.key, panel.value);
  if (filters.search) query.set(PARAM.search, filters.search);
  if (filters.jobId) query.set(PARAM.job, filters.jobId);
  // Répétable : c'est la forme que la conjonction de T5bis.3 attend.
  for (const skillId of filters.skillIds) query.append(PARAM.skill, skillId);
  if (filters.levelId) query.set(PARAM.level, filters.levelId);
  if (filters.availability) {
    query.set(PARAM.availability, filters.availability);
  }

  const suffix = query.toString();
  return suffix ? `${ROUTES.team}?${suffix}` : ROUTES.team;
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
     **une seule** lecture, qui confronte et fournit les identifiants cochés dans
     le même aller-retour ; celles que la couche n'a pas rendues sont simplement
     ignorées.

     **Les deux décomptes de la ligne de faits voyagent avec.** Ce sont deux
     `count` scopés sur `persons`, qui écartent les archivées comme `listTeam` —
     et qui ne connaissent aucun filtre : la ligne de faits dit la taille du
     domaine, pas le résultat d'une recherche. Un dénombrement, jamais un indice
     (garde-fou 2, D39). */
  const [activeJob, activeLevel, activeSkills, centerCount, stakeholderCount] =
    await Promise.all([
      requestedJob ? session.db.find(jobs, requestedJob) : undefined,
      requestedLevel ? session.db.find(skillLevels, requestedLevel) : undefined,
      requestedSkills.length > 0
        ? session.db.list(skills, {
            where: inArray(skills.id, requestedSkills),
            orderBy: [asc(skills.position), asc(skills.label)],
          })
        : [],
      session.db.count(persons, { where: eq(persons.kind, "center") }),
      session.db.count(persons, { where: eq(persons.kind, "stakeholder") }),
    ]);

  const options = await listTeamFilterOptions(session.db);

  const rows = await listTeam(session.db, {
    search: search || undefined,
    jobId: activeJob?.id,
    skillIds: activeSkills.map((skill) => skill.id),
    minRank: activeLevel?.rank,
    availability,
  });

  /* Combien de filtres sont posés — et rien de plus. La direction B a retiré
     l'énumération qui vivait ici : elle répétait, mot pour mot, l'état que les
     contrôles du rail affichent déjà. Ce nombre ne sert qu'à trois décisions :
     montrer le rail, proposer le retrait, et choisir l'état vide. */
  const posedFilters =
    (search ? 1 : 0) +
    (activeJob ? 1 : 0) +
    activeSkills.length +
    (activeLevel ? 1 : 0) +
    (availability ? 1 : 0);

  /* Le rail paraît dès qu'il y a quelque chose à filtrer, ou qu'un filtre est
     déjà posé — sans quoi une recherche infructueuse retirerait le formulaire
     qui l'a produite, et il n'y aurait plus aucun moyen de la corriger. */
  const showFilters = rows.length > 0 || posedFilters > 0;

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
     présentes ensemble n'ouvrent **rien**. Elle est écrite en **décompte**, et
     elle est passée d'une clé à **quatre** en T5bis.6 sans qu'un caractère de
     son énoncé change — c'est pour cela qu'elle avait été écrite ainsi, la forme
     de la page produit depuis T5.2. Côté clic, elle est structurelle : l'état ne
     porte qu'une demande à la fois.

     **Les cinq clés de filtre n'y entrent pas** : ce ne sont pas des clés
     d'ouverture, et les faire compter fermerait la fiche dès qu'on filtre. */
  const panelKeys = {
    [PERSON_PANEL_PARAM]: one(params[PERSON_PANEL_PARAM]),
    [PERSON_FORM_PARAM]: one(params[PERSON_FORM_PARAM]),
    [SKILL_PANEL_PARAM]: one(params[SKILL_PANEL_PARAM]),
    [ARCHIVE_PANEL_PARAM]: one(params[ARCHIVE_PANEL_PARAM]),
    [DELETE_PANEL_PARAM]: one(params[DELETE_PANEL_PARAM]),
  };
  const conflict =
    Object.values(panelKeys).filter((value) => value !== undefined).length > 1;
  const request = teamRequestFromParams(conflict ? {} : panelKeys);

  const drawer = request ? await resolveTeamDrawer(session, request) : null;

  /* **Le seul geste de cet écran** (T5bis.6), et le seul droit qu'il lise :
     `manageDomain` (arbitrage (c)). Il paraît à deux endroits — l'en-tête et
     l'état vide initial —, et l'adresse **reconduit les filtres** comme les
     liens de ligne : refermer le panneau ne doit pas défaire la recherche.

     Ce n'est pas ce rendu qui protège : `createPerson` redérive le droit, et un
     bouton masqué n'a jamais protégé le point d'entrée HTTP qui l'accompagne. */
  const addPersonHref = session.can.manageDomain
    ? teamHref(activeFilters, {
        key: PERSON_FORM_PARAM,
        value: PERSON_FORM_NEW,
      })
    : null;

  const addPersonLink = addPersonHref ? (
    <DrawerLink
      href={addPersonHref}
      request={{ kind: "person" }}
      className={buttonClass()}
    >
      Ajouter une personne
    </DrawerLink>
  ) : null;

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
          /* **Les faits du domaine, jamais ceux de la recherche.** Ce que
             l'écran sait de son objet ne bouge pas quand on filtre ; le
             compteur qui bouge est resté au-dessus de la liste, avec son
             `aria-live`. Les deux nombres sont des dénombrements de lignes
             saisies — la frontière que `CLAUDE.md` trace entre le chiffre
             reporté et le chiffre calculé par Vision reste où elle est. */
          facts={`${formatPersons(centerCount)} au centre · ${formatPersons(
            stakeholderCount,
          )} côté entité`}
          {...(addPersonLink ? { action: addPersonLink } : {})}
        />

        {/* **Le rail à gauche, la liste à droite** — et `items-start`, sans quoi
            le rail s'étirerait sur toute la hauteur de la rangée et `sticky`
            n'aurait rien à faire glisser. Sous `xl`, les deux se remettent en
            pile : c'est le palier de T7.6, celui au-dessus duquel les colonnes
            de liste tiennent réellement. */}
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
          {showFilters ? (
            <TeamFilters
              options={options}
              posedFilters={posedFilters}
              search={search}
              jobId={activeJob?.id}
              checkedSkills={checked}
              levelId={activeLevel?.id}
              availability={availability}
            />
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {showFilters ? (
              <p
                // Le compteur change sans rechargement de page perceptible :
                // l'assistance doit l'entendre.
                aria-live="polite"
                className="text-sm font-semibold text-content-neutral-darkest"
              >
                {formatPersons(rows.length)}
              </p>
            ) : null}

            {rows.length > 0 ? (
              <List label="Les personnes du domaine">
                <ListHeader>
                  <span className={COLUMN.person}>Personne</span>
                  <span className={COLUMN.availability}>Disponibilité</span>
                  <span className={COLUMN.skills}>Compétences déclarées</span>
                  {/* La place du chevron, pour que le bandeau et les lignes
                      s'alignent. Le bandeau entier est déjà `aria-hidden`. */}
                  <span className="hidden w-4 flex-none xl:block" />
                </ListHeader>

                {rows.map((row) => (
                  <ListRow key={row.id}>
                    <PersonLine row={row} filters={activeFilters} />
                  </ListRow>
                ))}
              </List>
            ) : posedFilters > 0 ? (
              <EmptyState
                title="Aucune personne ne répond à ces critères"
                description="Les filtres se combinent : chacun restreint le résultat du précédent, et les compétences cochées se cumulent — une personne doit les porter toutes. En décocher une suffit peut-être à retrouver ce que vous cherchez."
                action={
                  <Link href={ROUTES.team} className={ACTION_LINK_SM}>
                    Voir toutes les personnes
                  </Link>
                }
              />
            ) : (
              <EmptyState
                title="Aucune personne pour l'instant"
                description="Cette liste réunira les membres du centre de compétence et les intervenants côté entité — leur métier, leur disponibilité, et les compétences que chacun déclare. C'est ce référentiel qui dira un jour qui pourrait intervenir sur un accompagnement."
                {...(addPersonLink ? { action: addPersonLink } : {})}
              />
            )}
          </div>
        </div>
      </Page>
    </DrawerHost>
  );
}

/**
 * Une ligne de personne — trois colonnes, et le chevron qui dit où elle mène.
 *
 * **La ligne entière ouvre la fiche** (T5bis.4), et n'emmène sur aucun écran :
 * il n'y a pas de page personne (D29). Le lien est posé *dans* la `ListRow`
 * plutôt que par son `href` — `ListRow` rend un `<Link>` de navigation, et
 * `components/ui/list.tsx` est hors du périmètre de cette reprise. Le résultat
 * est le même : un seul arrêt de tabulation par personne, et une cible large.
 *
 * **C'est un vrai `<a href>`**, dont seul le clic gauche est intercepté : le
 * `⌘`+clic, le clic milieu et l'absence de JavaScript retombent sur l'adresse,
 * qui rend la même fiche au rendu serveur. Elle reconduit les filtres courants,
 * pour que la sortie du panneau ne défasse pas la recherche.
 */
function PersonLine({
  row,
  filters,
}: {
  row: TeamMemberRow;
  filters: AppliedFilters;
}) {
  /* **La formulation de `PersonDetailHeader`, mot pour mot** : la ligne et la
     fiche qualifient une personne de la même façon, et « côté entité » n'est
     plus la mention la plus faible de la ligne — elle est sur le trait qui
     qualifie, au même poids que le métier. */
  const qualifier =
    [row.jobLabel, row.kind === "stakeholder" ? "côté entité" : null]
      .filter((part) => part !== null)
      .join(" · ") || "Métier non renseigné";

  const shown = row.skills.slice(0, LIST_SKILLS_SHOWN);
  const hidden = row.skills.length - shown.length;

  return (
    <DrawerLink
      href={teamHref(filters, { key: PERSON_PANEL_PARAM, value: row.id })}
      request={{ kind: "personDetail", id: row.id }}
      /* **C'est ce lien, et non la `ListRow`, qui est le conteneur flex de la
         ligne** : le repli doit donc se poser ici aussi, sans quoi la dernière
         colonne sort de la carte et s'y fait rogner (T7.6). `LIST_ROW_FLEX` est
         la chaîne de `components/ui/list.tsx`, pour que les deux ne divergent
         pas. */
      className={`${LIST_ROW_FLEX} min-w-0 flex-1`}
    >
      <span className={`${COLUMN.person} flex items-center gap-2`}>
        <Avatar name={row.fullName} tone={row.kind} />
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-semibold text-content-neutral-darkest">
            {row.fullName}
          </span>
          <span className="truncate text-xs text-content-neutral-dark">
            {qualifier}
          </span>
        </span>
      </span>

      {/* Un intervenant côté entité n'a pas de disponibilité : c'est une
          propriété du centre, et la colonne porte un tiret plutôt que du vide
          (arbitrage (d)). Le tiret est décoratif — l'absence est déjà dite en
          toutes lettres par « côté entité », deux colonnes plus tôt. */}
      <span className={COLUMN.availability}>
        {row.availability ? (
          <>
            <span className="sr-only">Disponibilité : </span>
            <AvailabilityDot availability={row.availability} />
          </>
        ) : (
          <span aria-hidden="true" className="text-content-neutral-light">
            —
          </span>
        )}
      </span>

      {/* Le début du profil, dans l'ordre que la requête rend — et non les
          seules compétences qui ont filtré : une ligne affiche ce que la
          personne déclare, jamais une correspondance (garde-fou 2). */}
      <span className={COLUMN.skills}>
        <span className="sr-only">Compétences : </span>
        {row.skills.length > 0 ? (
          <span className="flex flex-wrap items-center gap-1.5">
            {shown.map((skill, index) => {
              const tag = (
                <Tag size="xs" label={`${skill.label} · ${skill.levelLabel}`} />
              );

              /* **Le reste voyage avec la dernière étiquette**, et c'est une
                 correction lue au rendu : posé en frère dans la boîte
                 `flex-wrap`, « +3 » partait seul sur un troisième rang dès que
                 les deux étiquettes remplissaient le premier — un nombre
                 orphelin sous les valeurs qu'il complète. Groupés, ils passent
                 à la ligne ensemble ou pas du tout. */
              if (index < shown.length - 1 || hidden === 0) {
                return <span key={skill.id}>{tag}</span>;
              }

              return (
                <span key={skill.id} className="flex items-center gap-1.5">
                  {tag}
                  {/* Le nombre se dit en toutes lettres à la voix : « +3 » seul
                      ne dit ni de quoi ni où le lire. */}
                  <span className="sr-only">
                    {`et ${hidden} autre${hidden > 1 ? "s" : ""}, dans la fiche`}
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-xs font-semibold text-content-neutral-base"
                  >
                    {`+${hidden}`}
                  </span>
                </span>
              );
            })}
          </span>
        ) : (
          <span className="text-content-neutral-base">
            Aucune compétence déclarée
          </span>
        )}
      </span>

      {/* **Ce que la ligne ouvre, dit à l'œil.** Sur `/accompagnements`, une ligne du
          même dessin emmène sur un écran ; ici elle ouvre un tiroir, et rien ne
          les distinguait. Il sort de l'arbre d'accessibilité : le lien porte
          déjà le nom de la personne, et un chevron lu à la voix n'ajouterait
          rien.

          **Il ne se rend qu'au-dessus du palier de repli.** Sous `xl` la ligne
          se met en rangs et le chevron, qui n'est plus au bout de rien, tombait
          seul sur un cinquième rang — un glyphe sans objet. Il se masque donc,
          comme le bandeau de colonnes de `components/ui/list.tsx` et pour la
          même raison : c'est le seul autre `hidden` responsive du dépôt, et lui
          aussi ne porte que du décor. **Rien d'interactif ne disparaît**, le
          seul critère de T7.6 — la ligne entière reste le lien.

          **`content-neutral-base` et non `content-neutral-light`, et c'est la
          mesure qui a tranché.** Le second donne 2,22:1 sur le fond de la
          ligne — un chevron qu'on devine, quand celui-ci est justement ce qu'il
          faut savoir voir (WCAG 1.4.11, le seuil de 3:1 d'un composant). Le
          premier donne **4,98:1**, et c'est le couple que « +N » porte déjà
          deux colonnes plus tôt : aucun jeton neuf, aucun couple neuf par la
          position. */}
      <span aria-hidden="true" className="hidden flex-none text-content-neutral-base xl:block">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </span>
    </DrawerLink>
  );
}

/**
 * Le rail de filtres — la direction B.
 *
 * Un `form method="get"` : le navigateur écrit lui-même l'URL, l'écran la
 * relit, et rien n'est conservé en mémoire côté client. Chaque contrôle se
 * réaffiche sur la valeur active — le formulaire dit l'état de l'URL.
 *
 * Local à cet écran, comme `ProjectFilters` l'est resté au sien : c'est une
 * barre de recherche de liste (D32), pas un composant de socle.
 *
 * **Le rail est une `Section`, et ce n'est pas un détail de forme.** Les quatre
 * mesures de la pastille sont prises sur `surface-neutral-pale` — le fond de la
 * carte du formulaire de projet. `Section` porte exactement ce fond, si bien
 * qu'**aucun couple de couleurs n'est neuf par la position** et que rien n'est à
 * remesurer. Un rail posé nu sur le fond de page en aurait créé quatre.
 *
 * **Il suit le défilement à partir de `xl`**, et pas avant : sous ce palier il
 * repasse au-dessus de la liste, et un bloc collant en pile masquerait ce qu'il
 * filtre. `items-start` sur la rangée est la condition technique — un élément
 * flex étiré sur toute la hauteur n'a rien à faire glisser.
 *
 * **Onze compétences en colonne, sans repli et sans envoi implicite** : c'est ce
 * que la direction B achète avec ses 320 px. La case reste native à l'intérieur
 * de la pastille — elle porte l'état, elle part dans la requête, elle s'annonce
 * à la voix —, mais elle est **hors de vue** : c'est la pastille qu'on voit et
 * qu'on vise. `components/ui/checkbox-chip.ts` dit les trois conséquences de ce
 * masquage et la seule valeur où la maquette a cédé à la mesure.
 */
function TeamFilters({
  options,
  posedFilters,
  search,
  jobId,
  checkedSkills,
  levelId,
  availability,
}: {
  options: TeamFilterOptions;
  /** Combien de filtres sont posés — le retrait n'existe que s'il a de quoi retirer. */
  posedFilters: number;
  search: string;
  jobId: string | undefined;
  checkedSkills: ReadonlySet<string>;
  levelId: string | undefined;
  availability: PersonAvailability | undefined;
}) {
  return (
    <div className="xl:sticky xl:top-9 xl:w-80 xl:flex-none">
      <Section>
        <form
          method="get"
          action={ROUTES.team}
          className="flex flex-col gap-5"
          aria-label="Filtrer les personnes"
        >
          <Field label="Rechercher" htmlFor="filtre-q">
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
          />
          <Select
            id="filtre-dispo"
            label="Disponibilité"
            name={PARAM.availability}
            all="Toutes"
            options={AVAILABILITY_OPTIONS}
            value={availability}
          />

          {options.skills.length > 0 ? (
            <fieldset className="flex flex-col gap-2">
              {/* Un `<fieldset>` est ce qui dit à l'assistance que ces cases
                  forment un groupe et lui donne son nom. La légende dit la
                  règle une fois, là où l'on coche. */}
              <legend className="mb-2 text-2xs font-semibold text-content-neutral-dark uppercase">
                Compétences — cochées, elles se cumulent
              </legend>
              <div className="flex flex-wrap gap-2">
                {options.skills.map((skill) => (
                  <label
                    key={skill.id}
                    htmlFor={`filtre-competence-${skill.id}`}
                    className={filterChipClass({ size: "xs" })}
                  >
                    <input
                      id={`filtre-competence-${skill.id}`}
                      type="checkbox"
                      name={PARAM.skill}
                      value={skill.id}
                      defaultChecked={checkedSkills.has(skill.id)}
                      className={FILTER_CHIP_INPUT}
                    />
                    {skill.label}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          {/* **Le retrait est au pied du rail, et non plus au-dessus de la
              liste** (31/08/2026, à la demande). Il vivait à l'autre bout de
              l'écran des contrôles qu'il vide — c'était la friction n° 4 du
              diagnostic, à demi refermée : la ligne de synthèse avait cessé de
              répéter l'état des filtres, mais le geste qui les défait était
              resté avec elle.

              **Un lien, jamais un `<button type="reset">`** : celui-ci
              rétablirait les valeurs *par défaut* du formulaire, c'est-à-dire
              les filtres actuellement appliqués — il ne ferait rien de visible.
              Ce qui remet à zéro est une adresse, `ROUTES.team` nue, et elle
              fonctionne sans une ligne de JavaScript comme le reste du rail.

              **Il ne paraît que s'il a de quoi retirer.** Un geste inerte
              posé en permanence sous le bouton d'envoi apprend à ne plus le
              lire. `ACTION_LINK_SM` est la constante du socle pour ce rang, et
              son commentaire nomme mot pour mot cet emploi. */}
          <div className="flex flex-col items-center gap-3">
            <Button type="submit" className="w-full">
              Filtrer
            </Button>
            {posedFilters > 0 ? (
              <Link href={ROUTES.team} className={ACTION_LINK_SM}>
                Retirer tous les filtres
              </Link>
            ) : null}
          </div>
        </form>
      </Section>
    </div>
  );
}

/** Un champ et son étiquette — jamais un placeholder à la place du libellé. */
function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
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
  options: TeamFilterOption[];
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
