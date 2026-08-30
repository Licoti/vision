/**
 * Administration — les référentiels du domaine (21/08/2026 sur les entités,
 * porté à cinq référentiels par T7.3, à neuf par T7.4).
 *
 * Elle répond à « comment adapter le vocabulaire du domaine ? » (`docs/06` §2).
 * C'est l'écran promis par **D25** — « un écran sommaire de gestion des
 * référentiels existe, en C7 » —, désormais tenu sur **les neuf référentiels du
 * domaine** : entités, métiers, approches, compétences, échelle de maîtrise,
 * statuts de projet, types d'activité, outils, pistes de démarrage. La promesse
 * est close.
 *
 * **Un seul écran, une clé qui choisit la table** (arbitrage (f) de
 * `tickets-C7.md`). `docs/06` §2 pose *six écrans, dont deux formulaires et un
 * panneau — c'est le plancher* : neuf référentiels ne font pas neuf routes. La
 * clé `referentiel` est un **sélecteur**, pas une clé d'ouverture — elle reste
 * donc hors du décompte d'exclusivité, comme `de` et `a` sur la page produit.
 * **Absente, elle vaut « entités »**, si bien qu'aucun lien servi avant T7.3 ne
 * casse ; **inconnue, elle y retombe aussi** — la forme se vérifie avant la
 * base, partout.
 *
 * **L'écran entier est réservé au responsable de domaine** (F1-D1, D9, D25), et
 * il rend **404** à qui ne l'est pas — pas 403 : c'est la règle de
 * `produits/nouveau`, et elle vaut ici pour la même raison qu'un identifiant
 * d'un autre domaine rend 404. Dire « interdit » serait dire qu'il y a quelque
 * chose derrière.
 *
 * **Ce n'est pas cette route qui protège**, et il faut le redire à chaque
 * écran : les trente-sept actions redérivent le droit sur ce qu'elles reçoivent,
 * et `loadAdminDrawer` le redérive de son côté. Une route retirée n'a jamais
 * protégé les points d'entrée HTTP qu'elle affichait.
 *
 * **La liste montre les lignes archivées**, seule de l'application à le faire.
 * Un écran de gestion doit montrer ce qu'il a rangé : sans cela l'archivage
 * serait une disparition, et le rétablissement n'aurait aucun point d'entrée.
 *
 * **Aucun tri par usage, aucun classement.** Chaque référentiel se range dans
 * l'ordre que ses propres lecteurs emploient — `position` puis libellé pour six
 * d'entre eux, `rank` puis libellé pour l'échelle, nom seul pour les entités et
 * pour les outils, qui n'ont pas de `position` au schéma. `docs/06` §10 proscrit
 * le classement, et ranger un référentiel par « nombre de projets » serait
 * exactement cela. Le décompte est là pour dire ce qui **s'oppose à un geste**,
 * jamais pour qualifier.
 *
 * **Quatre référentiels portent de la logique, et la ligne le dit** (T7.4) : la
 * nature d'un statut, la famille d'un type, le genre d'un outil ou d'une piste
 * se lisent sous le libellé. `docs/04` §1 pose que *les libellés changent, la
 * logique non* — un écran qui ne rendrait que le libellé laisserait sans réponse
 * la seule question qu'on s'y pose : qu'est-ce que cette ligne commande ?
 *
 * Aucune requête directe : tout passe par `session.db`, déjà scopé sur le
 * domaine courant. Règle 1.
 */

import { notFound } from "next/navigation";
import Link from "next/link";

import { ActionMenu, MENU_ITEM, MENU_ITEM_DANGER } from "@/components/ui/action-menu";
import { buttonClass } from "@/components/ui/button";
import { DrawerHost, DrawerLink } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { List, ListHeader, ListRow } from "@/components/ui/list";
import { Page, PageHeader } from "@/components/ui/page";
import { requireSession } from "@/lib/auth/provider";
import {
  ADMIN_PANEL_PARAMS,
  adminRequestFromParams,
  resolveAdminDrawer,
} from "@/lib/drawers/admin";
import { StatusPill } from "@/components/ui/status-pill";
import {
  formatActivities,
  formatActivityFamily,
  formatActivityTypes,
  formatDeclarations,
  formatMonth,
  formatPersons,
  formatProducts,
  formatProjects,
  formatProjectStatusNature,
  formatStarterKind,
  formatStarters,
  formatToolKind,
  REFERENTIAL_NOUN,
} from "@/lib/format";
import {
  ARCHIVE_PANEL_PARAM,
  asReferential,
  DELETE_PANEL_PARAM,
  REFERENTIAL_PARAM,
  REFERENTIAL_ROW_PARAM,
  REFERENTIALS,
  ROUTES,
  type Referential,
} from "@/lib/navigation";
import { listEntitiesForAdmin } from "@/lib/queries/entities";
import {
  listReferentialForAdmin,
  type AdminReferentialRow,
  type ReferentialLogic,
  type ReferentialUsage,
} from "@/lib/queries/referentials";

import {
  restoreActivityType,
  restoreApproach,
  restoreEntity,
  restoreJob,
  restoreProjectStatus,
  restoreSkill,
  restoreSkillLevel,
  restoreStarter,
  restoreTool,
} from "./actions";
import { loadAdminDrawer } from "./drawers";

export const metadata = {
  title: "Administration — Vision",
};

/** Les gabarits de colonne, tenus en un seul endroit pour que l'en-tête et
 *  les lignes ne puissent pas diverger.
 *
 *  **C'est la liste la plus large du dépôt, et c'est elle qui a nommé le
 *  défaut** (T7.6) : ses quatre colonnes fixes font 592 px, gouttières comprises
 *  656, si bien qu'en dessous de ≈ 1 184 px la carte en rognait la fin. Le
 *  libellé tombait à zéro et **le menu « … » disparaissait de l'écran en restant
 *  dans le HTML** — modifier, archiver et rétablir devenaient inatteignables.
 *  Sous `xl`, la ligne se replie ; l'`usage` reste rétrécissable, sa phrase
 *  étant la seule de la ligne qui puisse s'allonger. */
const COLUMN = {
  label: "w-full min-w-0 xl:w-auto xl:flex-1",
  order: "flex-none xl:w-24",
  usage: "min-w-0 xl:w-72 xl:flex-none",
  state: "flex-none xl:w-40",
  actions: "flex-none xl:w-12",
} as const;

/**
 * Les décomptes que chaque référentiel rend, et dans quel ordre.
 *
 * **C'est la seule chose qui distingue les cinq listes**, et c'est voulu : une
 * ligne de référentiel est un libellé, un ordre et un état — ce qui change d'un
 * référentiel à l'autre est ce qui **s'oppose à son rangement**. Les entités
 * n'ont qu'une source parce qu'elles n'ont qu'une clé étrangère entrante ; le
 * métier en a deux, parce qu'un métier qualifie à la fois un accompagnement et
 * une personne.
 */
const USAGE_SOURCES: Record<
  Referential,
  readonly (keyof ReferentialUsage)[]
> = {
  entites: ["products"],
  metiers: ["projects", "persons"],
  approches: ["projects", "activities"],
  competences: ["persons"],
  niveaux: ["declarations"],
  statuts: ["projects"],
  types: ["activities"],
  outils: ["activityTypes", "starters"],
  /* **Rien ne référence `starters`**, et la liste vide le dit mieux qu'un zéro :
     une colonne qui rendrait « Aucune référence » sur chaque ligne ne dirait
     rien. Elle n'est donc pas rendue du tout — ni son en-tête, ni ses cellules. */
  pistes: [],
};

/** L'en-tête de colonne — décoratif : la ligne dit elle-même ce qu'elle compte. */
const SOURCE_HEADING: Record<keyof ReferentialUsage, string> = {
  products: "Produits",
  projects: "Projets",
  persons: "Personnes",
  activities: "Activités",
  activityTypes: "Types",
  starters: "Pistes",
  declarations: "Déclarations",
};

/**
 * Le rétablissement, référentiel par référentiel.
 *
 * Neuf actions et non une : chacune nomme sa table côté serveur, et c'est la
 * fiche de T7.3 — une indirection sur l'écriture ferait de la couche scopée un
 * endroit où le domaine se déduit. Ce que cette table choisit est **laquelle
 * lier**, jamais ce qu'elle écrit.
 */
const RESTORE: Record<Referential, (rowId: string) => Promise<void>> = {
  entites: restoreEntity,
  metiers: restoreJob,
  approches: restoreApproach,
  competences: restoreSkill,
  niveaux: restoreSkillLevel,
  statuts: restoreProjectStatus,
  types: restoreActivityType,
  outils: restoreTool,
  pistes: restoreStarter,
};

/**
 * L'intitulé de la colonne d'ordre — **`null` là où il n'y en a pas**.
 *
 * Deux référentiels n'en ont aucun, et pour deux raisons différentes : les
 * entités portent bien une `position` mais **aucun écran ne la lit**, si bien
 * que leur formulaire ne la saisit pas ; les outils **n'ont pas la colonne**, ni
 * au schéma ni dans `docs/04` §2, et T7.4 n'avait pas de migration à dépenser
 * (arbitrage (a) de `tickets-C7.md`). Les deux se rangent donc par nom.
 *
 * Cette table remplace les deux ternaires que T7.3 portait : au troisième
 * référentiel sans ordre, la question ne se repose plus.
 */
const ORDER_HEADING: Record<Referential, string | null> = {
  entites: null,
  metiers: "Ordre",
  approches: "Ordre",
  competences: "Ordre",
  niveaux: "Rang",
  statuts: "Ordre",
  types: "Ordre",
  outils: null,
  pistes: "Ordre",
};

/** Une valeur d'URL, réduite à la première quand Next en rend plusieurs. */
function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();

  /* Le droit avant toute lecture : il ne dépend d'aucun identifiant, et l'écran
     entier lui appartient. `notFound()` lève — rien de ce qui suit ne s'exécute
     pour qui n'administre pas. */
  if (!session.can.manageDomain) notFound();

  const params = await searchParams;
  const referential = asReferential(one(params[REFERENTIAL_PARAM]));
  const noun = REFERENTIAL_NOUN[referential];

  /* **Les entités gardent leur lecture**, et c'est le seul écart : elles sont la
     seule table de cet écran qui se supprime (arbitrage (g)), donc la seule à
     porter deux décomptes — celui qui s'oppose au rangement, et celui qui
     s'oppose à l'effacement. Leurs lignes sont coulées ici dans la forme
     commune, sans que `lib/queries/entities.ts` bouge. */
  const entityRows =
    referential === "entites" ? await listEntitiesForAdmin(session.db) : null;
  const rows: AdminReferentialRow[] =
    referential === "entites"
      ? (entityRows ?? []).map((row) => ({
          id: row.id,
          label: row.label,
          position: null,
          rank: null,
          /* Une entité ne porte aucune logique : elle qualifie un produit, elle
             ne commande rien au code. */
          logic: null,
          archivedAt: row.archivedAt,
          usage: {
            products: row.liveProductCount,
            projects: 0,
            persons: 0,
            activities: 0,
            activityTypes: 0,
            starters: 0,
            declarations: 0,
          },
        }))
      : await listReferentialForAdmin(session.db, referential);

  /* **L'URL reste une adresse, elle n'est plus le mécanisme** (TD.2). Coller
     `?referentiel=metiers&ligne=<identifiant>` ouvre encore le panneau, ici, au
     rendu serveur ; le clic, lui, passe par `DrawerHost` et n'écrit plus rien.
     Les deux chemins traversent ensuite la **même** résolution.

     L'exclusivité ne vaut donc que pour ce chemin-ci : plusieurs clés de panneau
     présentes ensemble n'ouvrent **rien**. Elle est écrite en **décompte**,
     comme sur les trois pages qui la portent déjà — et T7.3 est exactement le
     ticket qu'elle attendait : quatre référentiels de plus, **pas une clé de
     plus**, donc pas un caractère de cette logique à changer. */
  const panelKeys = {
    [REFERENTIAL_ROW_PARAM]: one(params[REFERENTIAL_ROW_PARAM]),
    [ARCHIVE_PANEL_PARAM]: one(params[ARCHIVE_PANEL_PARAM]),
    [DELETE_PANEL_PARAM]: one(params[DELETE_PANEL_PARAM]),
  };
  const conflict =
    Object.values(panelKeys).filter((value) => value !== undefined).length > 1;
  const request = adminRequestFromParams(
    referential,
    conflict ? {} : panelKeys,
  );

  const drawer = request ? await resolveAdminDrawer(session, request) : null;

  /* Le seul geste qui ne vise aucune ligne. Il paraît à deux endroits —
     l'en-tête et l'état vide —, `docs/06` §9 voulant qu'un état vide propose le
     geste qui le remplit. Aucune condition de droit ici : la page entière est
     déjà tombée pour qui n'administre pas. */
  const addRowLink = (
    <DrawerLink
      href={ROUTES.adminRowNew(referential)}
      request={{ kind: "row", referential }}
      className={buttonClass()}
    >
      {`Ajouter ${noun.indefinite}`}
    </DrawerLink>
  );

  return (
    <DrawerHost
      initial={drawer}
      load={loadAdminDrawer}
      panelParams={ADMIN_PANEL_PARAMS}
      closeHref={ROUTES.adminReferential(referential)}
    >
      <Page>
        <PageHeader
          title="Administration"
          lead="Comment adapter le vocabulaire du domaine ? Chaque référentiel se renomme, se réordonne et se range sans qu'aucune donnée déjà saisie ne bouge."
          action={addRowLink}
        />

        <ReferentialNav active={referential} />

        {rows.length > 0 ? (
          <List label={`${noun.plural} du domaine`}>
            <ListHeader>
              <span className={COLUMN.label}>Libellé</span>
              {ORDER_HEADING[referential] ? (
                <span className={COLUMN.order}>
                  {ORDER_HEADING[referential]}
                </span>
              ) : null}
              {USAGE_SOURCES[referential].length > 0 ? (
                <span className={COLUMN.usage}>
                  {USAGE_SOURCES[referential]
                    .map((source) => SOURCE_HEADING[source])
                    .join(" · ")}
                </span>
              ) : null}
              <span className={COLUMN.state}>État</span>
              <span className={COLUMN.actions} />
            </ListHeader>

            {rows.map((row) => {
              const archived = row.archivedAt !== null;
              /* La ligne d'entité d'origine, retrouvée une fois : elle porte le
                 second décompte — le total, archivés compris — que la forme
                 commune ne transporte pas, parce que les quatre autres
                 référentiels n'ont rien à en faire. */
              const entityRow = entityRows?.find(
                (candidate) => candidate.id === row.id,
              );
              /* Les conditions que l'écran **annonce** — il ne les tient pas :
                 chaque action recompte sur ce qu'elle reçoit. Retirer une entrée
                 de menu n'a jamais protégé l'action qu'elle affichait. */
              const opposing = USAGE_SOURCES[referential].reduce(
                (total, source) => total + row.usage[source],
                0,
              );
              const canArchive = !archived && opposing === 0;

              return (
                <ListRow key={row.id}>
                  {/* La cellule passe en colonne pour porter la logique sous le
                      libellé : c'est ce qui répond à « qu'est-ce que cette ligne
                      commande ? » sans ajouter une sixième colonne vide sur cinq
                      référentiels. */}
                  <span
                    className={`${COLUMN.label} flex min-w-0 flex-col gap-0.5`}
                  >
                    <span className="truncate font-semibold text-content-neutral-darkest">
                      {row.label}
                    </span>
                    {row.logic ? <LogicCell logic={row.logic} /> : null}
                  </span>

                  {ORDER_HEADING[referential] ? (
                    <span className={COLUMN.order}>
                      <span className="sr-only">
                        {`${ORDER_HEADING[referential]} : `}
                      </span>
                      {referential === "niveaux" ? row.rank : row.position}
                    </span>
                  ) : null}

                  {USAGE_SOURCES[referential].length > 0 ? (
                    <span className={COLUMN.usage}>
                      <span className="sr-only">
                        {referential === "entites"
                          ? "Produits rattachés : "
                          : "Références : "}
                      </span>
                      <UsageCell
                        referential={referential}
                        usage={row.usage}
                        archivedProductCount={
                          entityRow
                            ? entityRow.totalProductCount -
                              entityRow.liveProductCount
                            : 0
                        }
                      />
                    </span>
                  ) : null}

                  <span className={COLUMN.state}>
                    <span className="sr-only">État : </span>
                    {archived && row.archivedAt ? (
                      <span className="text-content-neutral-base">
                        {`${noun.archived} en ${formatMonth(row.archivedAt)}`}
                      </span>
                    ) : (
                      "En service"
                    )}
                  </span>

                  <span className={`${COLUMN.actions} flex justify-end`}>
                    <ActionMenu
                      label={`Options ${noun.of} ${row.label}`}
                      variant="tertiary"
                    >
                      {archived ? (
                        /* Un formulaire nu : le rétablissement n'a rien à saisir
                           et rien à confirmer — c'est le geste qui **défait**, et
                           `docs/06` §9 proscrit la confirmation là où elle ne
                           protège rien. La forme de `restoreProduct`. */
                        <form action={RESTORE[referential].bind(null, row.id)}>
                          <button
                            type="submit"
                            role="menuitem"
                            className={MENU_ITEM}
                          >
                            {`Rétablir ${noun.demonstrative}`}
                          </button>
                        </form>
                      ) : (
                        <DrawerLink
                          href={ROUTES.adminRowEdit(referential, row.id)}
                          request={{ kind: "row", referential, id: row.id }}
                          role="menuitem"
                          className={MENU_ITEM}
                        >
                          {referential === "entites" || referential === "outils"
                            ? "Modifier le nom"
                            : "Modifier le libellé"}
                        </DrawerLink>
                      )}

                      {canArchive ? (
                        <DrawerLink
                          href={ROUTES.adminRowArchive(referential, row.id)}
                          request={{ kind: "archive", referential, id: row.id }}
                          role="menuitem"
                          className={MENU_ITEM}
                        >
                          {`Archiver ${noun.demonstrative}`}
                        </DrawerLink>
                      ) : null}

                      {/* **La suppression n'existe que sur les entités**
                          (arbitrage (g)) : un métier ou une approche fautifs
                          s'archivent sans rien bloquer, quand une entité fautive
                          empêche toute création de produit. */}
                      {entityRow && entityRow.totalProductCount === 0 ? (
                        <DrawerLink
                          href={ROUTES.adminEntityDelete(row.id)}
                          request={{ kind: "delete", id: row.id }}
                          role="menuitem"
                          className={MENU_ITEM_DANGER}
                        >
                          Supprimer cette entité
                        </DrawerLink>
                      ) : null}
                    </ActionMenu>
                  </span>
                </ListRow>
              );
            })}
          </List>
        ) : (
          <EmptyState
            title={EMPTY_TITLE[referential]}
            description={EMPTY_DESCRIPTION[referential]}
            action={addRowLink}
          />
        )}
      </Page>
    </DrawerHost>
  );
}

/* ==========================================================================
   Les pièces de l'écran
   ========================================================================== */

/**
 * La barre de choix du référentiel — cinq entrées, des liens, **aucun état
 * client**.
 *
 * Elle reprend la forme des filtres d'entité de `/produits` : une navigation, un
 * `aria-current` sur l'entrée active, et un clic qui est une navigation. Le
 * référentiel courant n'est pas un filtre de liste mais le choix de la table :
 * `<nav>` dit donc juste ce qu'il fait.
 *
 * **Les entités n'ont pas de clé dans leur adresse** : elles sont la valeur par
 * défaut, et `adminReferential` l'omet — c'est ce qui laisse intacte toute
 * adresse servie avant T7.3.
 */
function ReferentialNav({ active }: { active: Referential }) {
  const chip = (current: boolean) =>
    [
      "rounded-full border px-4 py-1.5 text-sm",
      current
        ? "border-border-primary-lighter bg-surface-primary-lightest font-semibold text-content-primary-dark"
        : "border-surface-neutral-lighter bg-surface-neutral-pale font-medium text-content-neutral-dark",
    ].join(" ");

  return (
    <nav aria-label="Choisir un référentiel">
      <ul className="flex flex-wrap gap-2">
        {REFERENTIALS.map((referential) => (
          <li key={referential}>
            <Link
              href={ROUTES.adminReferential(referential)}
              aria-current={referential === active ? "true" : undefined}
              className={chip(referential === active)}
            >
              {REFERENTIAL_NOUN[referential].plural}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Ce qui référence la ligne, source par source.
 *
 * **Les entités rendent leur décompte même à zéro**, et les quatre autres non :
 * ce n'est pas une inconséquence. La colonne des entités a un second rôle depuis
 * le 21/08/2026 — elle explique, par l'écart entre le vivant et le total,
 * pourquoi une entité sans produit vivant ne se supprime pourtant pas. Les
 * quatre référentiels de T7.3 ne se suppriment pas : leur colonne n'a qu'un
 * rôle, dire ce qui s'oppose au rangement, et « Aucune référence » le dit mieux
 * que deux zéros côte à côte.
 */
function UsageCell({
  referential,
  usage,
  archivedProductCount,
}: {
  referential: Referential;
  usage: ReferentialUsage;
  /** Les entités seules. Les quatre autres référentiels ne se suppriment pas. */
  archivedProductCount: number;
}) {
  if (referential === "entites") {
    return (
      <>
        {formatProducts(usage.products)}
        {/* Le total ne paraît que lorsqu'il diffère : sinon la colonne dirait
            deux fois la même chose. C'est lui qui explique qu'une entité sans
            produit vivant ne se supprime pourtant pas. */}
        {archivedProductCount > 0 ? (
          <span className="text-content-neutral-base">
            {` · ${archivedProductCount} archivé${
              archivedProductCount > 1 ? "s" : ""
            }`}
          </span>
        ) : null}
      </>
    );
  }

  const parts = USAGE_SOURCES[referential]
    .filter((source) => usage[source] > 0)
    .map((source) => formatSource(source, usage[source]));

  if (parts.length === 0) {
    return <span className="text-content-neutral-base">Aucune référence</span>;
  }

  return <>{parts.join(" · ")}</>;
}

/** Le décompte d'une source, en toutes lettres. Zéro n'arrive jamais ici. */
function formatSource(source: keyof ReferentialUsage, count: number): string {
  switch (source) {
    case "products":
      return formatProducts(count);
    case "projects":
      return formatProjects(count);
    case "persons":
      return formatPersons(count);
    case "activities":
      return formatActivities(count);
    case "activityTypes":
      return formatActivityTypes(count);
    case "starters":
      return formatStarters(count);
    case "declarations":
      return formatDeclarations(count);
  }
}

/**
 * La logique que la ligne porte, sous son libellé (T7.4).
 *
 * **La nature d'un statut prend la pastille**, et c'est un réemploi et non une
 * couleur neuve : `StatusPill` est déjà la seule forme du statut d'un
 * accompagnement, ses quatre couples de contraste sont mesurés (9,17 · 11,83 ·
 * 6,52 · 6,42:1), et la voir ici relie l'écran de gestion à la roadmap qu'il
 * commande. Les trois autres sont des étiquettes, pas des états : un texte
 * discret suffit, et le couple qu'il emploie est déjà servi dans cette liste par
 * la cellule « Aucune référence ».
 *
 * **Ce n'est pas un indice calculé** (D39) : c'est une colonne saisie, rendue en
 * toutes lettres. Rien ne la classe, rien ne l'ordonne.
 */
function LogicCell({ logic }: { logic: ReferentialLogic }) {
  if (logic.kind === "nature") {
    return (
      <span className="flex">
        <StatusPill
          nature={logic.value}
          label={formatProjectStatusNature(logic.value)}
        />
      </span>
    );
  }

  return (
    <span className="text-xs text-content-neutral-base">
      {logic.kind === "family"
        ? formatActivityFamily(logic.value)
        : logic.kind === "toolKind"
          ? formatToolKind(logic.value)
          : formatStarterKind(logic.value)}
    </span>
  );
}

/**
 * L'état vide, référentiel par référentiel — un écran à part entière (règle 5).
 *
 * Chacun dit ce que le référentiel sert, et non « il n'y a rien » : c'est ce qui
 * fait la différence entre un état vide et un cas d'erreur. Le geste qui le
 * remplit est passé à côté, `docs/06` §9 le voulant.
 */
const EMPTY_TITLE: Record<Referential, string> = {
  entites: "Aucune entité dans ce domaine",
  metiers: "Aucun métier dans ce domaine",
  approches: "Aucune approche dans ce domaine",
  competences: "Aucune compétence dans ce domaine",
  niveaux: "Aucun niveau de maîtrise dans ce domaine",
  statuts: "Aucun statut de projet dans ce domaine",
  types: "Aucun type d'activité dans ce domaine",
  outils: "Aucun outil raccordé à ce domaine",
  pistes: "Aucune piste de démarrage dans ce domaine",
};

const EMPTY_DESCRIPTION: Record<Referential, string> = {
  entites:
    "Les entités sont les divisions de l'entreprise cliente : elles qualifient les produits et filtrent leur liste. Tant qu'il n'y en a aucune, aucun produit ne peut être créé.",
  metiers:
    "Les métiers disent ce qu'une personne fait au centre — Product Design, UX Research, UI Design… Ils qualifient une personne et filtrent la liste transverse des accompagnements.",
  approches:
    "Les approches disent la manière d'accompagner — Research, Design Thinking, Audit UX… Un accompagnement en déclare plusieurs, une activité au plus une.",
  competences:
    "Les compétences disent ce qu'une personne du centre sait faire. Elles ne se confondent pas avec les métiers : on en porte plusieurs, chacune à son niveau.",
  niveaux:
    "L'échelle de maîtrise gradue les compétences déclarées. C'est le rang qui l'ordonne et que le radar de l'équipe lit ; le libellé, lui, se renomme librement.",
  statuts:
    "Les statuts disent où en est un accompagnement — En cadrage, En cours, En pause, Terminé. Tant qu'il n'y en a aucun, aucun accompagnement ne peut être créé : c'est la nature du statut qui dit au produit ce qui compte comme actif.",
  types:
    "Les types disent ce qu'est un fait d'accompagnement : un atelier, un audit, une campagne de tests. Ils sont groupés par famille, et ce sont eux qui décident si une activité terminée propose la saisie d'un résultat.",
  outils:
    "Les outils sont les plateformes externes que Vision raccorde : celle qui produit les audits, celle qui porte les analytics, celle qui tient le budget. Vision renvoie vers elles, elle ne les interroge pas.",
  pistes:
    "Les pistes de démarrage sont la boîte à outils proposée à qui ouvre un accompagnement sans activité. Ce sont des invitations, jamais des prescriptions : elles sont les mêmes sur tous les accompagnements.",
};
