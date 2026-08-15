/**
 * La roadmap des activités — le bloc dominant de la page projet.
 *
 * `docs/06` §5 : elle vient immédiatement après l'en-tête, avant tout bloc de
 * référence. C'est le récit de l'accompagnement, et la raison d'être de Vision.
 *
 * Le composant porte **la section entière**, son en-tête compris. T3.2 tient la
 * promesse écrite ici par T3.1 : « Ajouter une activité » est en tête du bloc
 * *et* dans l'état vide, les deux emplacements vivent ici, et la page n'a pas à
 * connaître ce détail. En **tête**, jamais en pied (`docs/06` §5) : l'action
 * doit être visible sans avoir à parcourir la roadmap entière.
 *
 * `addHref` à `null` retire les deux : l'action n'existe que pour qui peut
 * écrire dans ce projet (D9). Le composant, lui, ne connaît aucun droit — c'est
 * l'appelant qui les lit, comme pour `PageHeader` depuis T1.6. `editHref`,
 * `transitionActivity` et `cancelActivity` suivent la même règle pour les
 * gestes de chaque entrée (T3.4, T3.5) : chez qui ne peut pas écrire, la
 * roadmap se lit et ne s'ouvre, ni ne se corrige, nulle part.
 *
 * **Cinq groupes** (`docs/03` §6) depuis T3.5, qui peuple le dernier — annulé,
 * en retrait, replié par défaut. Les quatre premiers restent ceux de T3.1.
 *
 * `transitionActivity` et `cancelActivity` sont les actions serveur de
 * `projets/[id]/actions.ts`, **non liées** : c'est ici, à l'intérieur de la
 * boucle sur les entrées, qu'elles sont liées à l'activité concernée — le
 * composant reçoit ce qu'il faut pour agir, jamais un droit à interpréter.
 *
 * Le reste ne lit toujours aucune base : `groups` est ce que
 * `listProjectRoadmap` a déjà groupé et trié.
 */

import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { ExternalLink } from "@/components/ui/external-link";
import { SectionHeader } from "@/components/ui/section";
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

/**
 * La pastille d'un groupe, et le filet qui reprend sa couleur sur l'entrée.
 *
 * Les deux sont **décoratifs** : l'intitulé du groupe est écrit juste au-dessus
 * des entrées qu'il colore, et la couleur ne porte jamais seule une information
 * (`docs/06` §11). Les teintes reprennent celles des natures de statut d'un
 * accompagnement — en cours, à venir, en attente, terminé se lisent de la même
 * façon d'un objet à l'autre. `cancelled` reprend un ton plus retiré encore que
 * `unscheduled` : « en retrait », au sens de `docs/03` §6.
 */
const GROUP_TONE: Record<RoadmapGroupKey, { dot: string; edge: string }> = {
  in_progress: {
    dot: "bg-surface-primary-base",
    edge: "border-l-surface-primary-base",
  },
  planned: { dot: "bg-surface-info-base", edge: "border-l-surface-info-base" },
  unscheduled: {
    dot: "bg-surface-neutral-base",
    edge: "border-l-surface-neutral-base",
  },
  done: { dot: "bg-surface-success-base", edge: "border-l-surface-success-base" },
  cancelled: {
    dot: "bg-surface-neutral-light",
    edge: "border-l-surface-neutral-lighter",
  },
};

/** Les deux actions du cycle de vie, gatées à `null` comme `editHref`. */
type TransitionAction =
  ((activityId: string, target: "in_progress" | "done") => Promise<void>) | null;
type CancelAction = ((activityId: string, formData: FormData) => Promise<void>) | null;

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
  | ((activityId: string, resultId: string) => Promise<void>)
  | null;

export function Roadmap({
  groups,
  addHref,
  editHref,
  resultHref,
  transitionActivity,
  cancelActivity,
  archiveActivity,
  archiveResult,
}: {
  groups: RoadmapGroup[];
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
   * quand l'entrée n'a pas de résultat et corrige quand elle en porte un. C'est
   * `lib/navigation.ts` qui l'avait rendu possible sans le savoir — la valeur y
   * désigne l'activité, donc la cible, jamais le geste.
   */
  resultHref: ((activityId: string) => string) | null;
  /**
   * « Marquer en cours », « Marquer terminée » (T3.5) — l'action serveur non
   * liée, à lier par activité au moment du rendu. `null` pour qui ne peut pas
   * écrire, la même règle que `editHref`.
   */
  transitionActivity: TransitionAction;
  /** Annuler, motif à l'appui (T3.5). Même règle. */
  cancelActivity: CancelAction;
  /**
   * Archiver une saisie erronée (T4bis.4). Même règle de droit que les deux
   * précédentes ; la **cinquième** condition — aucun résultat vivant sur
   * l'entrée — se lit dans la donnée, et l'entrée la tient elle-même, comme
   * elle tient déjà celles de `resultHref`.
   */
  archiveActivity: ArchiveAction;
  /**
   * Retirer le résultat d'une entrée (T4bis.6). Même règle de droit que les
   * trois précédentes ; la condition qui reste — l'entrée porte un résultat
   * vivant — se lit dans la donnée, et l'entrée la tient elle-même.
   */
  archiveResult: ArchiveResultAction;
}) {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Roadmap des activités"
        note="Le récit de l'accompagnement, au mois."
        {...(addHref
          ? {
              action: (
                <AddActivity
                  href={addHref}
                  className="border border-content-neutral-normal bg-surface-neutral-pale text-content-primary-dark"
                />
              ),
            }
          : {})}
      />

      {groups.length > 0 ? (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <RoadmapSection
              key={group.key}
              group={group}
              editHref={editHref}
              resultHref={resultHref}
              transitionActivity={transitionActivity}
              cancelActivity={cancelActivity}
              archiveActivity={archiveActivity}
              archiveResult={archiveResult}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Aucune activité pour l'instant"
          description="La roadmap réunira ici les ateliers, tests, audits et restitutions de l'accompagnement, groupés par état : en cours, prévu, à planifier, terminé. Chaque activité portera son type, son objectif, sa période, son approche et, le cas échéant, son résultat avec le lien vers l'outil qui l'a produit."
          {...(addHref
            ? {
                action: (
                  <AddActivity
                    href={addHref}
                    className="bg-surface-primary-base text-content-neutral-pale"
                  />
                ),
              }
            : {})}
        />
      )}
    </section>
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
  className,
}: {
  href: string;
  className: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${className}`}
    >
      <span aria-hidden="true">+</span>
      Ajouter une activité
    </Link>
  );
}

/**
 * Un groupe : son intitulé, son compteur, ses entrées.
 *
 * Le compteur est un `aria-hidden` : la liste porte déjà son nombre pour
 * l'assistance par le `role="list"` qu'elle expose. Le titre est un `h3` — la
 * section porte le `h2`, et la hiérarchie ne saute pas de niveau.
 *
 * **Le groupe « Annulé » s'enveloppe dans un `<details>` fermé par défaut**
 * (`docs/03` §6 : « en retrait, replié par défaut ») — natif, donc sans
 * JavaScript, comme le reste du produit. Les quatre autres groupes restent
 * toujours ouverts, dans un simple `<div>`. « Modifier » n'est pas transmis à
 * ce groupe : aucun retour en arrière depuis annulée (interdit de T3.5), donc
 * aucun lien qui y mènerait.
 *
 * **L'archivage, lui, traverse les cinq groupes** (T4bis.4, arbitrage du
 * 15/08/2026) : il n'est pas une transition d'état — il ne fait pas sortir de
 * `cancelled`, il sort du récit. L'interdit de T3.5 porte sur le retour en
 * arrière, pas sur le rangement, et une activité saisie par erreur puis annulée
 * n'aurait sinon aucun chemin.
 */
function RoadmapSection({
  group,
  editHref,
  resultHref,
  transitionActivity,
  cancelActivity,
  archiveActivity,
  archiveResult,
}: {
  group: RoadmapGroup;
  editHref: ((activityId: string) => string) | null;
  resultHref: ((activityId: string) => string) | null;
  transitionActivity: TransitionAction;
  cancelActivity: CancelAction;
  archiveActivity: ArchiveAction;
  archiveResult: ArchiveResultAction;
}) {
  const tone = GROUP_TONE[group.key];
  const cancelled = group.key === "cancelled";

  /* Les enfants seuls, sans conteneur : `<summary>` n'accepte que du contenu
     de phrasé (et, en premier enfant, un titre) — un `<div>` autour n'y est
     pas valide, contrairement au `<div>` toujours-ouvert des quatre autres
     groupes, qui porte ces mêmes classes lui-même. */
  const headerContent = (
    <>
      <span
        aria-hidden="true"
        className={`h-2 w-2 flex-none rounded-full ${tone.dot}`}
      />
      {/* Les capitales sans interlettrage, comme le bandeau de colonnes de
          `ListHeader` : la maquette écarte les lettres de .04em, mais le
          design system ne définit aucun jeton d'interlettrage et la règle 2
          interdit d'en emprunter un à Tailwind. */}
      <h3 className="text-2xs font-semibold text-content-neutral-base uppercase">
        {group.label}
      </h3>
      <span aria-hidden="true" className="text-xs text-content-neutral-base">
        {group.activities.length}
      </span>
      <span
        aria-hidden="true"
        className="h-px flex-1 bg-surface-neutral-lighter"
      />
    </>
  );

  const list = (
    <ul role="list" className="flex flex-col gap-2">
      {group.activities.map((activity) => (
        <RoadmapEntry
          key={activity.id}
          activity={activity}
          edge={tone.edge}
          groupKey={group.key}
          transitionActivity={transitionActivity}
          cancelActivity={cancelActivity}
          archiveActivity={archiveActivity}
          archiveResult={archiveResult}
          {...(editHref && !cancelled ? { editHref: editHref(activity.id) } : {})}
          /* **Les deux gestes du résultat suivent le résultat, pas le groupe**
             (T4bis.6, arbitrage du 15/08/2026). La **saisie** garde les quatre
             conditions de T4.4 — le droit, l'état terminé, un type qui produit,
             aucun résultat déjà posé. La **correction**, elle, ne demande que
             l'existence du résultat : éditer la période d'une activité terminée
             la redérive en « prévu » ou « en cours » (`resolveActivityPeriod`)
             sans toucher au résultat, et l'enfermer dans le groupe « Terminé »
             le laisserait orphelin — visible, incorrigible, irretirable. */
          {...(resultHref &&
          (activity.result !== null ||
            (group.key === "done" && activity.producesResult))
            ? { resultHref: resultHref(activity.id) }
            : {})}
        />
      ))}
    </ul>
  );

  if (cancelled) {
    return (
      <details className="flex flex-col gap-2.5">
        {/* Le triangle natif du navigateur est conservé : c'est le signal
            standard d'un contenu replié, et l'inventer autrement demanderait
            une valeur visuelle que le design system ne nomme pas (règle 2). */}
        <summary className="flex cursor-pointer items-center gap-2.5">
          {headerContent}
        </summary>
        <div className="mt-1">{list}</div>
      </details>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2.5">{headerContent}</div>
      {list}
    </div>
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
 * `ExternalLink` de T4.1 **repris tel quel** — c'est la forme du titre d'une
 * ressource, et une seule règle vaut mieux qu'une règle et son repli : `label`
 * est `not null` en base, l'ancre a donc toujours un texte. **Un résultat sans
 * lien profond est un cas normal**, celui des deux résultats de la fixture : la
 * valeur s'affiche et aucun lien mort n'est rendu.
 *
 * Le couple de couleurs de l'ancre n'est pas neuf par la position :
 * `content-info-base` sur `surface-neutral-pale` est celui du titre d'une
 * ressource depuis T4.1, l'entrée de roadmap et `Section` portant la même
 * surface.
 *
 * Les `·` sont décoratifs et chaque part porte son libellé pour l'assistance —
 * la règle de `resources.tsx` : hors du contexte visuel, « 62/100 · 31 mai
 * 2024 » ne dit pas lequel des deux est quoi. Une part absente disparaît avec
 * son séparateur ; seules la date et le libellé sont garantis par le schéma.
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

/** Les classes d'un geste texte, communes à « Modifier » et aux gestes de T3.5. */
const ACTION_LINK = "text-xs font-semibold text-content-primary-dark underline";

/**
 * Une entrée : son type, son approche, son objectif, sa période, et le cas
 * échéant son résultat avec le lien vers l'outil (T4.3, `docs/06` §5) — le lien
 * qui la corrige (T3.4), les gestes de son cycle de vie (T3.5), et le point
 * d'entrée qui saisit son résultat (T4.4).
 *
 * **L'entrée n'est pas cliquable en entier**, et c'est un choix : un `<a>` n'en
 * contient pas un autre, et elle porte désormais jusqu'à trois formulaires. La
 * même raison qu'en T2.3 pour la ligne de projet, amplifiée ici : l'entrée
 * porte déjà un texte long, l'objectif, qu'un lien engloberait sans rien y
 * gagner.
 *
 * Le nom accessible du lien « Modifier » porte l'activité qu'il ouvre : «
 * Modifier » répété quinze fois dans une liste de liens ne dit rien à qui les
 * parcourt sans le contexte visuel. Le mot reste écrit à l'écran — l'`aria-label`
 * complète, il ne remplace pas.
 *
 * **Les gestes du cycle de vie sont des formulaires nus**, sans panneau ni
 * confirmation intermédiaire (`docs/03` §4) : « Marquer en cours » depuis
 * `planned`/`unscheduled`, « Marquer terminée » depuis `in_progress` — affiché
 * seulement si une fin de période est déjà écrite, faute de quoi le geste
 * serait refusé sans pouvoir l'expliquer ici. « Annuler » se replie derrière un
 * `<details>` natif, le motif étant le seul champ que ce ticket introduit ; il
 * est `required`, ce qui suffit à empêcher une soumission vide sans aller-retour
 * serveur. Une activité `cancelled` n'offre plus aucun de ces gestes — le
 * schéma d'états ne lui en laisse aucun — et affiche son motif à leur place.
 *
 * **« Archiver la saisie » (T4bis.4) est le seul geste qui retire.** Son
 * libellé ne se réduit pas à « Archiver » : empilé sous « Annuler » dans la
 * même colonne, le verbe seul se confondrait avec lui, et la fiche demande que
 * l'écran distingue les deux gestes **par ses libellés**. C'est la saisie qu'on
 * retire, pas l'activité qu'on annule.
 *
 * **Il disparaît de lui-même quand un résultat est posé** : le résultat se
 * retire d'abord, sans quoi il resterait accroché à une activité sortie du
 * récit. **T4bis.6 donne enfin ce geste** — « Archiver le résultat » occupe
 * exactement la place que « Archiver la saisie » laisse vide, et les deux ne se
 * rencontrent jamais. La même donnée décide du geste et de l'action, comme elle
 * le fait déjà pour « Saisir un résultat » — l'un ne peut pas survivre à
 * l'autre. Ce n'est pas ce rendu qui protège : `archiveActivity` refuse
 * l'activité reçue qui porte un résultat.
 */
function RoadmapEntry({
  activity,
  edge,
  groupKey,
  editHref,
  resultHref,
  transitionActivity,
  cancelActivity,
  archiveActivity,
  archiveResult,
}: {
  activity: RoadmapActivity;
  edge: string;
  groupKey: RoadmapGroupKey;
  editHref?: string;
  resultHref?: string;
  transitionActivity: TransitionAction;
  cancelActivity: CancelAction;
  archiveActivity: ArchiveAction;
  archiveResult: ArchiveResultAction;
}) {
  const period = formatActivityPeriod(
    activity.periodStart,
    activity.periodEnd,
    activity.isUnscheduled,
  );

  const canMarkInProgress =
    transitionActivity && (groupKey === "planned" || groupKey === "unscheduled");
  const canMarkDone =
    transitionActivity && groupKey === "in_progress" && activity.periodEnd !== null;
  const canCancel =
    cancelActivity &&
    (groupKey === "planned" || groupKey === "unscheduled" || groupKey === "in_progress");

  return (
    <li
      className={`flex flex-wrap items-start justify-between gap-x-6 gap-y-2 rounded-lg border border-surface-neutral-lighter border-l-3 ${edge} bg-surface-neutral-pale px-5 py-4`}
    >
      <div className="min-w-55 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="text-sm font-semibold text-content-neutral-darkest">
            {activity.typeLabel}
          </span>
          {activity.approachLabel ? (
            <Tag label={activity.approachLabel} />
          ) : null}
        </div>
        {activity.objective ? (
          <p className="mt-1.5 text-xs leading-175 text-content-neutral-base">
            {activity.objective}
          </p>
        ) : null}
        {/* Facultatif (`docs/03` §4, T3.6). « · côté entité » en texte, jamais
            couleur seule (`docs/06` §11) — la règle de T2.4 et T2.6, reprise
            ici pour un troisième écran. */}
        {activity.participants.length > 0 ? (
          <p className="mt-1.5 text-xs leading-175 text-content-neutral-base">
            {"Participants : "}
            {activity.participants
              .map(
                (person) =>
                  person.fullName +
                  (person.kind === "stakeholder" ? " · côté entité" : ""),
              )
              .join(", ")}
          </p>
        ) : null}
        {/* Le résultat (T4.3), sur la forme exacte de la ligne des
            participants : même balise, mêmes classes, donc aucun couple de
            couleurs neuf par la position. Il ne croise jamais le motif
            d'annulation — seule une activité terminée porte un résultat
            (`docs/03` §4). */}
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

      <div className="flex flex-col items-end gap-1.5">
        <span className="text-xs whitespace-nowrap text-content-neutral-base">
          {period}
        </span>
        {editHref ? (
          <Link
            href={editHref}
            aria-label={`Modifier l'activité ${activity.typeLabel} — ${period}`}
            className={ACTION_LINK}
          >
            Modifier
          </Link>
        ) : null}
        {/* Le point d'entrée de T4.4, **et sa correction depuis T4bis.6** : une
            seule adresse, un seul panneau, deux gestes. Ce n'est pas le lien
            qui change, c'est son libellé — la même donnée qui décidait de
            l'afficher décide désormais de ce qu'il dit. Les conditions vivent
            dans `RoadmapSection` ; ici ne reste que le mot.

            « Corriger le résultat » et non « Modifier » : la fiche le nomme
            ainsi, et le verbe dit que la valeur reportée était fausse — non que
            la mesure a bougé, ce qui serait un second relevé et appartient aux
            indicateurs (C5). */}
        {resultHref ? (
          <Link
            href={resultHref}
            aria-label={`${
              activity.result ? "Corriger le résultat" : "Saisir un résultat"
            } de l'activité ${activity.typeLabel} — ${period}`}
            className={ACTION_LINK}
          >
            {activity.result ? "Corriger le résultat" : "Saisir un résultat"}
          </Link>
        ) : null}
        {/* Le retrait de T4bis.6, juste sous le geste qui corrige : l'ordre va
            du plus courant au plus rare, comme le reste de la colonne. Un
            formulaire nu, sans confirmation (arbitrage (c)) ni motif, et
            `ACTION_LINK` repris tel quel — aucun couple de couleurs neuf par la
            position.

            « Archiver le résultat » : le mot de l'arbitrage (d), jamais
            « Supprimer » — rien n'est supprimé (règle 4). Il ne se confond pas
            avec « Archiver la saisie » plus bas, et **ne peut pas s'y trouver
            côte à côte** : celui-là ne paraît que si l'entrée n'a pas de
            résultat, celui-ci que si elle en a un. La même donnée les exclut
            l'un l'autre. */}
        {archiveResult && activity.result ? (
          <form action={archiveResult.bind(null, activity.id, activity.result.id)}>
            <button
              type="submit"
              aria-label={`Archiver le résultat de l'activité ${activity.typeLabel} — ${period}`}
              className={ACTION_LINK}
            >
              Archiver le résultat
            </button>
          </form>
        ) : null}
        {canMarkInProgress ? (
          <form action={transitionActivity.bind(null, activity.id, "in_progress")}>
            <button type="submit" className={ACTION_LINK}>
              Marquer en cours
            </button>
          </form>
        ) : null}
        {canMarkDone ? (
          <form action={transitionActivity.bind(null, activity.id, "done")}>
            <button type="submit" className={ACTION_LINK}>
              Marquer terminée
            </button>
          </form>
        ) : null}
        {/* Le geste de T4bis.4, après ce qui fait avancer et avant ce qui
            annule : l'ordre de la colonne va du plus courant au plus rare.
            Un formulaire nu, sans confirmation ni motif (arbitrage (c)) — et
            `ACTION_LINK` repris tel quel, donc aucun couple de couleurs neuf
            par la position. Le nom accessible porte l'activité, comme celui de
            « Modifier » : « Archiver la saisie » répété quinze fois dans une
            liste de gestes ne dit pas laquelle. */}
        {archiveActivity && activity.result === null ? (
          <form action={archiveActivity.bind(null, activity.id)}>
            <button
              type="submit"
              aria-label={`Archiver l'activité ${activity.typeLabel} — ${period}`}
              className={ACTION_LINK}
            >
              Archiver la saisie
            </button>
          </form>
        ) : null}
        {canCancel ? (
          <details className="text-right">
            <summary className={`cursor-pointer ${ACTION_LINK}`}>Annuler</summary>
            <form
              action={cancelActivity.bind(null, activity.id)}
              className="mt-1.5 flex w-56 flex-col items-end gap-1.5"
            >
              <label className="w-full text-left">
                <span className="text-2xs font-semibold text-content-neutral-dark uppercase">
                  Motif
                </span>
                <input
                  name="cancellationReason"
                  type="text"
                  required
                  className="mt-1 w-full rounded-lg border border-content-neutral-normal bg-surface-neutral-pale px-3 py-2 text-xs text-content-neutral-darkest"
                />
              </label>
              <button
                type="submit"
                className="rounded-lg border border-content-neutral-normal px-3 py-1.5 text-xs font-semibold text-content-neutral-dark"
              >
                Confirmer l&apos;annulation
              </button>
            </form>
          </details>
        ) : null}
      </div>
    </li>
  );
}
