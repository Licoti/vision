/**
 * La roadmap des activités — le bloc dominant de la page projet.
 *
 * `docs/06` §5 : elle vient immédiatement après l'en-tête, avant tout bloc de
 * référence. C'est le récit de l'accompagnement, et la raison d'être de Vision.
 *
 * **Elle passe à la forme de `docs/design/maquettes/blocs/project-v2`**
 * (20/08/2026) : une carte, une barre de pastilles de filtre en tête, puis
 * **une seule liste** d'entrées à plat. Les cinq intertitres de groupe — « En
 * cours », « Prévu », « À planifier », « Terminé », « Annulé » replié —
 * disparaissent : c'est un **écart assumé à `docs/03` §6**, arbitré avec
 * l'humain avant écriture et consigné dans `JOURNAL-TECHNIQUE.md`. Ce que le
 * groupement disait, l'entrée le dit désormais elle-même — sa pastille de
 * statut est écrite en toutes lettres à côté de son titre, là où l'intertitre
 * l'écrivait une fois pour toute une tranche.
 *
 * **L'ordre des entrées, lui, ne bouge pas d'une ligne.** Il reste celui de
 * `listProjectRoadmap` — les cinq groupes dans l'ordre de `docs/03` §6, et
 * dedans le tri SQL de T3.1 — simplement aplati. Rien n'est retrié ici : un
 * ordre calculé par l'écran est un ordre qu'aucun test de lecture n'éprouve.
 *
 * **Le filtre passe par l'URL, sans une ligne de JavaScript** — le patron de la
 * frise de la page produit, et non le `onclick` de la maquette. Une pastille
 * est un lien vers `?etat=<clé>` ; « Toutes » est le lien vers l'adresse nue.
 * Il en découle trois propriétés que l'état client n'aurait pas données : le
 * filtre se copie, se partage et survit au rechargement ; il **n'entre pas dans
 * le décompte d'exclusivité des sept clés de panneau** (`ROADMAP_STATE_PARAM`),
 * si bien que fermer un panneau ne défait pas le filtre et que poser un filtre
 * ne ferme aucun panneau ; et la roadmap reste rendue sur le serveur.
 *
 * **Les décomptes ne sont pas un indice.** « Terminé 2 » compte des faits
 * saisis, il ne qualifie ni le projet ni personne : c'est une valeur de la
 * donnée, pas une note calculée par Vision (D39, frontière du `CLAUDE.md`).
 * Aucun total ne dit ce qui « reste à faire », aucune part n'est rapportée à
 * une autre.
 *
 * Le composant porte **la section entière**, son en-tête compris. T3.2 tient la
 * promesse écrite ici par T3.1 : « Ajouter une activité » est en tête du bloc
 * *et* dans l'état vide, les deux emplacements vivent ici, et la page n'a pas à
 * connaître ce détail. En **tête**, jamais en pied (`docs/06` §5).
 *
 * `addHref` à `null` retire les deux : l'action n'existe que pour qui peut
 * écrire dans ce projet (D9). Le composant, lui, ne connaît aucun droit — c'est
 * l'appelant qui les lit, comme pour `PageHeader` depuis T1.6. `editHref`,
 * `cancelHref` et `transitionActivity` suivent la même règle pour les gestes de
 * chaque entrée (T3.4, T3.5) : chez qui ne peut pas écrire, la roadmap se lit et
 * ne s'ouvre, ni ne se corrige, nulle part — et depuis que les gestes vivent
 * dans un menu, l'entrée ne porte alors même plus de bouton pour l'ouvrir.
 *
 * `transitionActivity`, `archiveActivity` et `archiveResult` sont les actions
 * serveur de `projets/[id]/actions.ts`, **non liées** : c'est ici, à l'intérieur
 * de la boucle sur les entrées, qu'elles sont liées à l'activité concernée — le
 * composant reçoit ce qu'il faut pour agir, jamais un droit à interpréter.
 * `cancelActivity` a quitté cette liste : son motif obligatoire l'a envoyée dans
 * un `ConfirmPanel`, et l'entrée n'en garde qu'une adresse.
 *
 * Le reste ne lit toujours aucune base : `groups` est ce que
 * `listProjectRoadmap` a déjà groupé et trié.
 */

import Link from "next/link";

import {
  ButtonIcon,
  buttonClass,
  type ButtonVariant,
} from "@/components/ui/button";
import { DrawerLink } from "@/components/ui/drawer";

import {
  ActionMenu,
  MENU_ITEM,
  MENU_ITEM_DANGER,
} from "@/components/ui/action-menu";
import { AvatarGroup } from "@/components/ui/avatar";
import { BlockNote, EmptyState } from "@/components/ui/empty-state";
import { ExternalLink } from "@/components/ui/external-link";
import { Section, SectionHeader } from "@/components/ui/section";
import { StatusPill } from "@/components/ui/status-pill";
import { Tag } from "@/components/ui/tag";
import {
  formatActivityPeriod,
  formatDay,
  formatResultValue,
} from "@/lib/format";
import type {
  ActivityResult,
  RoadmapActivity,
  RoadmapGroup,
  RoadmapGroupKey,
} from "@/lib/queries/activities";
import type { ProjectStatusNature } from "@/lib/queries/projects";

/**
 * Le point coloré d'un groupe, porté par la pastille de filtre et par l'entrée.
 *
 * **Le filet vertical de gauche a disparu avec le groupement** (20/08/2026) :
 * il redisait la couleur du point à 3 px de lui, et la maquette `project-v2`
 * n'en pose aucun.
 *
 * Il est **décoratif** : le statut est écrit en toutes lettres dans la
 * pastille de l'entrée, et la couleur ne porte jamais seule une information
 * (`docs/06` §11) — ce qui compte davantage depuis que l'intertitre de groupe a
 * disparu. Les teintes reprennent celles des natures de statut d'un
 * accompagnement — en cours, à venir, en attente, terminé se lisent de la même
 * façon d'un objet à l'autre. `cancelled` reprend un ton plus retiré encore que
 * `unscheduled` : « en retrait », au sens de `docs/03` §6.
 */
const GROUP_TONE: Record<RoadmapGroupKey, string> = {
  in_progress: "bg-surface-primary-base",
  planned: "bg-surface-info-base",
  unscheduled: "bg-surface-neutral-base",
  done: "bg-surface-success-base",
  cancelled: "bg-surface-neutral-light",
};

/**
 * L'état d'une entrée, dit dans le vocabulaire de la pastille de statut.
 *
 * **Aucune couleur neuve, et aucune pastille de plus** : `StatusPill` est la
 * seule forme du statut depuis le 19/08/2026 (septième clause de `socleLock`),
 * et ses quatre tons sont mesurés. Les cinq états d'activité s'y rangent sans
 * reste, et les couples ainsi formés sont **exactement** ceux que la maquette
 * dessine — `pill--encours` est `active`, `pill--prevu` est `framing`,
 * `pill--aplanifier` est `paused`, `pill--termine` est `done`. Une activité
 * annulée reprend le ton retiré de « à planifier » : le schéma des natures
 * d'accompagnement n'en porte pas de cinquième, et en inventer un ici serait
 * une valeur visuelle de plus (règle 2).
 *
 * Le **libellé**, lui, vient du groupe et non de cette table : c'est le
 * domaine qui nomme, comme pour un statut d'accompagnement.
 */
const GROUP_NATURE: Record<RoadmapGroupKey, ProjectStatusNature> = {
  in_progress: "active",
  planned: "framing",
  unscheduled: "paused",
  done: "done",
  cancelled: "paused",
};

/** L'action du cycle de vie, gatée à `null` comme `editHref`. */
type TransitionAction =
  | ((activityId: string, target: "in_progress" | "done") => Promise<void>)
  | null;

/**
 * L'archivage d'une saisie erronée (T4bis.4), gaté à `null` comme les deux
 * précédentes. Un seul argument : ce geste n'a ni cible d'état ni motif.
 */
type ArchiveAction = ((activityId: string) => Promise<void>) | null;

/**
 * Le retrait d'un résultat (T4bis.6), gaté de la même façon. **Deux arguments**,
 * là où l'archivage d'activité n'en a qu'un : `results` n'a pas de
 * `project_id`, et l'action rapproche le résultat reçu de l'activité reçue,
 * elle-même rapprochée du projet lié côté serveur.
 */
type ArchiveResultAction =
  ((activityId: string, resultId: string) => Promise<void>) | null;

export function Roadmap({
  groups,
  state,
  stateHref,
  addHref,
  editHref,
  resultHref,
  cancelHref,
  transitionActivity,
  archiveActivity,
  archiveResult,
}: {
  groups: RoadmapGroup[];
  /**
   * L'état retenu, ou `null` pour la roadmap entière — **déjà validé** par
   * `roadmapStateFromParam`. Le composant ne connaît pas l'URL, il connaît une
   * clé de groupe : la même règle que pour les droits, qui arrivent en props.
   */
  state: RoadmapGroupKey | null;
  /** L'adresse d'une pastille. `null` désigne « Toutes », donc l'adresse nue. */
  stateHref: (state: RoadmapGroupKey | null) => string;
  /** L'ouverture du panneau de saisie, ou `null` pour qui ne peut pas écrire. */
  addHref: string | null;
  /**
   * L'ouverture du panneau sur une activité donnée (T3.4), ou `null` pour qui
   * ne peut pas écrire — la même règle que `addHref`, et le composant ne lit
   * toujours aucun droit.
   */
  editHref: ((activityId: string) => string) | null;
  /**
   * L'ouverture du panneau de résultat sur une activité donnée (T4.4). Même
   * règle que `editHref` pour le droit ; **les autres conditions se lisent dans
   * la donnée**, et l'entrée les tient elle-même.
   *
   * **Une seule adresse pour deux gestes depuis T4bis.6** : la même URL saisit
   * quand l'entrée n'a pas de résultat et corrige quand elle en porte un.
   */
  resultHref: ((activityId: string) => string) | null;
  /**
   * L'ouverture du panneau d'annulation sur une activité donnée. **C'est une
   * adresse et non une action serveur depuis que le menu contextuel est arrivé
   * sur les entrées** : le champ « Motif » ne tient pas dans une entrée de menu,
   * il vit désormais dans un `ConfirmPanel` ouvert par `?annuler=<id>`.
   */
  cancelHref: ((activityId: string) => string) | null;
  /**
   * « Marquer en cours », « Marquer terminée » (T3.5) — l'action serveur non
   * liée, à lier par activité au moment du rendu. `null` pour qui ne peut pas
   * écrire, la même règle que `editHref`.
   */
  transitionActivity: TransitionAction;
  /**
   * Archiver une saisie erronée (T4bis.4). Même règle de droit que les deux
   * précédentes ; la **cinquième** condition — aucun résultat vivant sur
   * l'entrée — se lit dans la donnée, et l'entrée la tient elle-même.
   */
  archiveActivity: ArchiveAction;
  /**
   * Retirer le résultat d'une entrée (T4bis.6). Même règle de droit que les
   * trois précédentes ; la condition qui reste — l'entrée porte un résultat
   * vivant — se lit dans la donnée, et l'entrée la tient elle-même.
   */
  archiveResult: ArchiveResultAction;
}) {
  /* Les groupes retenus, **dans leur ordre de lecture** : le filtre choisit une
     tranche, il ne réordonne rien. Un état demandé qu'aucune activité ne porte
     rend une liste vide — l'état vide filtré ci-dessous, jamais un 404 : une
     adresse qui ne montre rien est une lecture, pas une erreur (règle 5). */
  const kept = state ? groups.filter((group) => group.key === state) : groups;

  /* La liste à plat que la maquette dessine. Chaque entrée garde la clé de son
     groupe : c'est elle qui décide de sa pastille, de son filet et des gestes
     qu'elle offre — ce que l'intertitre décidait pour toute une tranche. */
  const entries = kept.flatMap((group) =>
    group.activities.map((activity) => ({ group, activity })),
  );

  const total = groups.reduce(
    (count, group) => count + group.activities.length,
    0,
  );

  return (
    <Section id="activites">
      <SectionHeader
        title="Roadmap des activités"
        note="Le récit de l'accompagnement, au mois."
        {...(addHref
          ? {
              action: <AddActivity href={addHref} variant="secondary" />,
            }
          : {})}
      />

      {groups.length > 0 ? (
        <>
          <StatusChips
            groups={groups}
            total={total}
            state={state}
            stateHref={stateHref}
          />

          {entries.length > 0 ? (
            <ul role="list" className="flex flex-col">
              {entries.map(({ group, activity }) => (
                <RoadmapEntry
                  key={activity.id}
                  activity={activity}
                  groupKey={group.key}
                  groupLabel={group.label}
                  transitionActivity={transitionActivity}
                  archiveActivity={archiveActivity}
                  archiveResult={archiveResult}
                  {...(editHref && group.key !== "cancelled"
                    ? { editHref: editHref(activity.id) }
                    : {})}
                  {...(cancelHref && CANCELLABLE.has(group.key)
                    ? { cancelHref: cancelHref(activity.id) }
                    : {})}
                  /* **Les deux gestes du résultat suivent le résultat, pas le
                     groupe** (T4bis.6). La **saisie** garde les quatre
                     conditions de T4.4 — le droit, l'état terminé, un type qui
                     produit, aucun résultat déjà posé. La **correction**, elle,
                     ne demande que l'existence du résultat : éditer la période
                     d'une activité terminée la redérive en « prévu » ou « en
                     cours » sans toucher au résultat, et l'enfermer dans le
                     groupe « Terminé » le laisserait orphelin. */
                  {...(resultHref &&
                  (activity.result !== null ||
                    (group.key === "done" && activity.producesResult))
                    ? { resultHref: resultHref(activity.id) }
                    : {})}
                />
              ))}
            </ul>
          ) : (
            /* Un état **filtré** vide, et non l'état vide du bloc : il y a des
               activités, aucune dans cet état. Il dit donc le chemin du retour
               plutôt que le geste de saisie — proposer « Ajouter une activité »
               ici laisserait croire que le filtre a effacé quelque chose. */
            <BlockNote>
              Aucune activité dans cet état pour l&apos;instant.{" "}
              <Link
                href={stateHref(null)}
                className="text-content-info-base underline"
              >
                Voir toute la roadmap
              </Link>
              .
            </BlockNote>
          )}
        </>
      ) : (
        <EmptyState
          level={3}
          title="Aucune activité pour l'instant"
          description="La roadmap réunira ici les ateliers, tests, audits et restitutions de l'accompagnement, chacun avec son état : en cours, prévu, à planifier, terminé. Chaque activité portera son type, son objectif, sa période, son approche et, le cas échéant, son résultat avec le lien vers l'outil qui l'a produit."
          {...(addHref
            ? {
                action: <AddActivity href={addHref} variant="primary" />,
              }
            : {})}
        />
      )}
    </Section>
  );
}

/**
 * Les trois groupes d'où l'on peut encore annuler.
 *
 * La condition vivait dans `RoadmapSection` tant que la roadmap était groupée ;
 * elle se lit maintenant par entrée, sur la clé que l'entrée porte. Rien n'a
 * changé de son contenu. `cancelActivity` refuse de toute façon l'activité reçue
 * qui n'est plus dans un état annulable.
 */
const CANCELLABLE = new Set<RoadmapGroupKey>([
  "planned",
  "unscheduled",
  "in_progress",
]);

/**
 * La barre de filtre — « Toutes », puis un état par groupe **peuplé**.
 *
 * **Aucune pastille pour un groupe vide** : une roadmap sans activité annulée
 * n'a pas à porter un filtre « Annulé 0 », qui ne mènerait qu'à un écran vide.
 * Ce que la barre offre est exactement ce que la roadmap contient, et c'est ce
 * qui rend le décompte lisible sans le rendre normatif.
 *
 * **Des liens, jamais des boutons** : chacun mène à une adresse — la page du
 * projet portant `?etat=<clé>` — et se copie, se partage, s'ouvre dans un
 * onglet. La maquette en fait des `<button>` pilotés par un `onclick` ; les
 * trois propriétés y seraient perdues, et le filtre avec le JavaScript.
 *
 * **`Link` et non `<a>`**, comme les préréglages de la frise produit : la
 * navigation reste côté client, si bien que poser un filtre ne repart pas du
 * haut de la page — ce qui compte ici, la roadmap vivant sous une barre d'ancres
 * collante. L'adresse, elle, est la même : le repli sans JavaScript est un
 * `href` complet.
 *
 * `aria-current="page"` porte l'état retenu : la pastille active ne se signale
 * pas qu'à la couleur (`docs/06` §11) — la règle de `MainNav`.
 *
 * Le point coloré est **décoratif** : le libellé est écrit juste à côté.
 */
function StatusChips({
  groups,
  total,
  state,
  stateHref,
}: {
  groups: RoadmapGroup[];
  total: number;
  state: RoadmapGroupKey | null;
  stateHref: (state: RoadmapGroupKey | null) => string;
}) {
  const chips: {
    key: RoadmapGroupKey | null;
    label: string;
    count: number;
    dot: string;
  }[] = [
    {
      key: null,
      label: "Toutes",
      count: total,
      dot: "bg-surface-neutral-light",
    },
    ...groups.map((group) => ({
      key: group.key,
      label: group.label,
      count: group.activities.length,
      dot: GROUP_TONE[group.key],
    })),
  ];

  return (
    <ul role="list" className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const active = chip.key === state;
        return (
          <li key={chip.key ?? "toutes"}>
            <Link
              href={stateHref(chip.key)}
              aria-current={active ? "page" : undefined}
              className={[
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium",
                active
                  ? "border-border-primary-base bg-surface-primary-base text-content-neutral-pale"
                  : "border-surface-neutral-lighter bg-surface-neutral-pale text-content-neutral-dark",
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className={`h-2 w-2 flex-none rounded-full ${chip.dot}`}
              />
              {chip.label}
              <span className="font-bold">{chip.count}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * L'action d'ouverture du panneau, aux deux emplacements.
 *
 * C'est un lien et non un bouton, parce que c'en est un : il mène à une URL,
 * celle de la page du projet portant `?activite=nouvelle`. Il se copie, se
 * partage, s'ouvre dans un onglet — ce qu'un bouton d'ouverture piloté par du
 * JavaScript n'aurait fait dans aucun des trois cas.
 *
 * Le `+` de la maquette est décoratif : « Ajouter une activité » se lit seul.
 */
function AddActivity({
  href,
  variant,
}: {
  href: string;
  variant: ButtonVariant;
}) {
  return (
    <DrawerLink
      href={href}
      request={{ kind: "activity" }}
      className={buttonClass({ variant })}
    >
      <ButtonIcon>+</ButtonIcon>
      Ajouter une activité
    </DrawerLink>
  );
}

/**
 * Le résultat d'une activité — **le contrat unique** de `docs/02` §5, et rien
 * de plus : un libellé, une valeur, une unité, une date, le nom de l'outil, un
 * lien profond. Vision n'affiche **jamais le détail des constats** : il vit
 * dans l'outil qui l'a produit, et c'est ce qui garantit que brancher un outil
 * de plus coûte une ligne de configuration.
 *
 * « Résultat : Score d'audit UX ↗ · 62/100 · 31 mai 2024 · Ergonome »
 *
 * **Le libellé porte l'ancre** quand le lien profond est renseigné, via
 * `ExternalLink` de T4.1 **repris tel quel**. **Un résultat sans lien profond
 * est un cas normal** : la valeur s'affiche et aucun lien mort n'est rendu.
 *
 * Les `·` sont décoratifs et chaque part porte son libellé pour l'assistance.
 *
 * **Aucun seuil, aucun code couleur, aucune flèche de tendance** : Vision
 * reporte une valeur, elle ne la juge pas et ne la compare à rien (D39).
 */
function Result({ result }: { result: ActivityResult }) {
  const value = formatResultValue(result.value, result.unit);

  return (
    <p className="mt-1.5 text-xs leading-175 text-content-neutral-base">
      {"Résultat : "}
      {result.externalUrl ? (
        <ExternalLink href={result.externalUrl}>{result.label}</ExternalLink>
      ) : (
        result.label
      )}
      {value ? (
        <>
          <span aria-hidden="true">{" · "}</span>
          <span className="sr-only">Valeur : </span>
          {value}
        </>
      ) : null}
      <span aria-hidden="true">{" · "}</span>
      <span className="sr-only">Mesuré le </span>
      {formatDay(result.measuredOn)}
      {result.toolName ? (
        <>
          <span aria-hidden="true">{" · "}</span>
          <span className="sr-only">Outil : </span>
          {result.toolName}
        </>
      ) : null}
    </p>
  );
}

/**
 * Une entrée : son état, son type, son approche, son objectif, ses
 * participants, sa période, et le cas échéant son résultat avec le lien vers
 * l'outil (T4.3, `docs/06` §5).
 *
 * **Elle porte désormais son état elle-même** (20/08/2026) : un point coloré à
 * gauche et une `StatusPill` à côté du titre, à la place de l'intertitre de
 * groupe qui le disait pour toute une tranche. C'est ce qui rend la liste à
 * plat lisible — et c'est la condition posée à l'écart avec `docs/03` §6.
 *
 * **Les participants passent en pile d'avatars** (maquette `project-v2`), avec
 * leur décompte écrit à côté. La ligne « Participants : Camille Roux, Inès
 * Kaddour · côté entité » disparaît de l'œil, **jamais de l'assistance** :
 * `AvatarGroup` porte la liste complète en texte de remplacement, mention
 * « côté entité » comprise, et la teinte de chaque pastille la redit — la
 * couleur ne porte pas seule, elle double (`docs/06` §11).
 *
 * **L'entrée n'est pas cliquable en entier**, et c'est un choix : un `<a>` n'en
 * contient pas un autre, et elle porte jusqu'à trois formulaires.
 *
 * **Les gestes vivent dans un menu contextuel** (`components/ui/action-menu.tsx`).
 * **Le bouton ne paraît pas quand il n'ouvrirait rien** : `hasGestures` est la
 * disjonction des sept conditions ; chez qui ne peut pas écrire, ou sur un
 * accompagnement archivé, elles tombent toutes ensemble. Ce n'est pas ce rendu
 * qui protège : chaque action redérive le droit sur l'identifiant reçu.
 *
 * Le nom accessible du bouton porte l'activité qu'il commande : trois points ne
 * se lisent pas, et « Options » répété quinze fois ne dit pas de quoi.
 *
 * **Les gestes du cycle de vie restent des formulaires nus**, sans confirmation
 * intermédiaire (`docs/03` §4). Une activité `cancelled` n'en offre aucun et
 * affiche son motif à leur place.
 *
 * **« Archiver la saisie » et « Archiver le résultat » ne se rencontrent
 * jamais** : la même donnée les exclut l'un l'autre.
 */
function RoadmapEntry({
  activity,
  groupKey,
  groupLabel,
  editHref,
  resultHref,
  cancelHref,
  transitionActivity,
  archiveActivity,
  archiveResult,
}: {
  activity: RoadmapActivity;
  groupKey: RoadmapGroupKey;
  /** Le libellé du groupe — ce que dit la pastille de statut de l'entrée. */
  groupLabel: string;
  editHref?: string;
  resultHref?: string;
  cancelHref?: string;
  transitionActivity: TransitionAction;
  archiveActivity: ArchiveAction;
  archiveResult: ArchiveResultAction;
}) {
  const period = formatActivityPeriod(
    activity.periodStart,
    activity.periodEnd,
    activity.isUnscheduled,
  );

  const canMarkInProgress =
    transitionActivity &&
    (groupKey === "planned" || groupKey === "unscheduled");
  const canMarkDone =
    transitionActivity &&
    groupKey === "in_progress" &&
    activity.periodEnd !== null;
  const canArchiveResult = archiveResult !== null && activity.result !== null;
  const canArchiveActivity =
    archiveActivity !== null && activity.result === null;

  /* Sept conditions, une disjonction : elle décide du **bouton**, là où chacune
     décide de son entrée. Sans elle, une entrée sans aucun geste porterait un
     « … » qui n'ouvre rien — ce qui arrive à toute la roadmap dès que
     l'accompagnement est archivé. */
  const hasGestures =
    Boolean(editHref) ||
    Boolean(resultHref) ||
    Boolean(cancelHref) ||
    Boolean(canMarkInProgress) ||
    Boolean(canMarkDone) ||
    canArchiveResult ||
    canArchiveActivity;

  return (
    <li className="flex flex-wrap items-start gap-x-4 gap-y-3 border-t border-surface-neutral-lighter py-4">
      <span
        aria-hidden="true"
        className={`mt-1.5 h-2 w-2 flex-none rounded-full ${GROUP_TONE[groupKey]}`}
      />

      <div className="min-w-55 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="text-md font-semibold text-content-neutral-darkest">
            {activity.typeLabel}
          </span>
          <StatusPill nature={GROUP_NATURE[groupKey]} label={groupLabel} />
          {activity.approachLabel ? (
            <Tag label={activity.approachLabel} />
          ) : null}
        </div>
        {activity.objective ? (
          <p className="mt-1.5 text-xs leading-175 text-content-neutral-base">
            {activity.objective}
          </p>
        ) : null}
        {/* Le résultat (T4.3). Il ne croise jamais le motif d'annulation —
            seule une activité terminée porte un résultat (`docs/03` §4). */}
        {activity.result ? <Result result={activity.result} /> : null}
        {/* `cancellationReason` n'est renseigné que dans ce groupe
            (`activities_cancelled_requires_reason`) : le motif remplace les
            gestes, il ne s'ajoute pas à côté d'eux. Texte, pas couleur seule
            (`docs/06` §11). */}
        {groupKey === "cancelled" && activity.cancellationReason ? (
          <p className="mt-1.5 text-xs leading-175 text-content-neutral-base italic">
            Motif : {activity.cancellationReason}
          </p>
        ) : null}
      </div>

      {/* Facultatif (`docs/03` §4, T3.6) : la plupart des entrées n'ont aucun
          participant, et `AvatarGroup` rend `null` sur une liste vide — la
          colonne disparaît alors sans qu'une condition s'écrive ici. */}


      <span className="min-w-21 text-right text-xs whitespace-nowrap text-content-neutral-base">
        {period}
      </span>

      {hasGestures ? (
        <ActionMenu
          label={`Options de l'activité ${activity.typeLabel} — ${period}`}
        >
          {editHref ? (
            <DrawerLink
              href={editHref}
              request={{ kind: "activity", id: activity.id }}
              role="menuitem"
              className={MENU_ITEM}
            >
              Modifier
            </DrawerLink>
          ) : null}
          {/* Le point d'entrée de T4.4, **et sa correction depuis T4bis.6** :
              une seule adresse, un seul panneau, deux gestes. Ce n'est pas le
              lien qui change, c'est son libellé. */}
          {resultHref ? (
            <DrawerLink
              href={resultHref}
              request={{ kind: "result", id: activity.id }}
              role="menuitem"
              className={MENU_ITEM}
            >
              {activity.result ? "Corriger le résultat" : "Saisir un résultat"}
            </DrawerLink>
          ) : null}
          {/* « Archiver le résultat » : le mot de l'arbitrage (d), jamais
              « Supprimer » — rien n'est supprimé (règle 4). */}
          {archiveResult && activity.result ? (
            <form
              action={archiveResult.bind(null, activity.id, activity.result.id)}
            >
              <button type="submit" role="menuitem" className={MENU_ITEM}>
                Archiver le résultat
              </button>
            </form>
          ) : null}
          {canMarkInProgress ? (
            <form
              action={transitionActivity.bind(null, activity.id, "in_progress")}
            >
              <button type="submit" role="menuitem" className={MENU_ITEM}>
                Marquer en cours
              </button>
            </form>
          ) : null}
          {canMarkDone ? (
            <form action={transitionActivity.bind(null, activity.id, "done")}>
              <button type="submit" role="menuitem" className={MENU_ITEM}>
                Marquer terminée
              </button>
            </form>
          ) : null}
          {/* Un formulaire nu, sans confirmation ni motif (arbitrage (c)) — à la
              différence d'« Annuler l'activité » juste dessous, dont le motif
              est obligatoire et qui a donc dû quitter le menu pour un panneau. */}
          {archiveActivity && activity.result === null ? (
            <form action={archiveActivity.bind(null, activity.id)}>
              <button
                type="submit"
                role="menuitem"
                className={MENU_ITEM_DANGER}
              >
                Archiver la saisie
              </button>
            </form>
          ) : null}
          {/* « Annuler l'activité » et non « Annuler » : dans un menu, le verbe
              seul se lit comme le renoncement à ce qu'on est en train de faire. */}
          {cancelHref ? (
            <DrawerLink
              href={cancelHref}
              request={{ kind: "cancel", id: activity.id }}
              role="menuitem"
              className={MENU_ITEM_DANGER}
            >
              Annuler l&apos;activité
            </DrawerLink>
          ) : null}
        </ActionMenu>
      ) : null}
    </li>
  );
}
