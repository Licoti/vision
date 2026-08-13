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
 * l'appelant qui les lit, comme pour `PageHeader` depuis T1.6. `editHref` suit
 * la même règle pour le lien de correction de chaque entrée (T3.4) : chez qui
 * ne peut pas écrire, la roadmap se lit et ne s'ouvre nulle part.
 *
 * Quatre groupes seulement (`docs/03` §6) : le cinquième — annulé — arrive avec
 * T3.5, le ticket qui peut le peupler.
 *
 * Aucune lecture en base : le composant reçoit ce que `listProjectRoadmap` a
 * déjà groupé et trié.
 */

import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section";
import { Tag } from "@/components/ui/tag";
import { formatActivityPeriod } from "@/lib/format";
import type {
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
 * façon d'un objet à l'autre.
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
};

export function Roadmap({
  groups,
  addHref,
  editHref,
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
            <RoadmapSection key={group.key} group={group} editHref={editHref} />
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
 */
function RoadmapSection({
  group,
  editHref,
}: {
  group: RoadmapGroup;
  editHref: ((activityId: string) => string) | null;
}) {
  const tone = GROUP_TONE[group.key];

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2.5">
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
      </div>

      <ul role="list" className="flex flex-col gap-2">
        {group.activities.map((activity) => (
          <RoadmapEntry
            key={activity.id}
            activity={activity}
            edge={tone.edge}
            {...(editHref ? { editHref: editHref(activity.id) } : {})}
          />
        ))}
      </ul>
    </div>
  );
}

/**
 * Une entrée : son type, son approche, son objectif, sa période — et le lien
 * qui la corrige (T3.4).
 *
 * **L'entrée n'est pas cliquable en entier**, et c'est un choix : un `<a>` n'en
 * contient pas un autre, or T3.5 posera dans cette même entrée les boutons de
 * transition du cycle de vie. C'est le raisonnement tenu en T2.3 pour la ligne
 * de projet, et il vaut ici pour une raison de plus — l'entrée porte déjà un
 * texte long, l'objectif, qu'un lien engloberait sans rien y gagner.
 *
 * Le nom accessible du lien porte l'activité qu'il ouvre : « Modifier » répété
 * quinze fois dans une liste de liens ne dit rien à qui les parcourt sans le
 * contexte visuel. Le mot reste écrit à l'écran — l'`aria-label` complète, il
 * ne remplace pas.
 */
function RoadmapEntry({
  activity,
  edge,
  editHref,
}: {
  activity: RoadmapActivity;
  edge: string;
  editHref?: string;
}) {
  const period = formatActivityPeriod(
    activity.periodStart,
    activity.periodEnd,
    activity.isUnscheduled,
  );

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
      </div>

      <div className="flex flex-col items-end gap-1.5">
        <span className="text-xs whitespace-nowrap text-content-neutral-base">
          {period}
        </span>
        {editHref ? (
          <Link
            href={editHref}
            aria-label={`Modifier l'activité ${activity.typeLabel} — ${period}`}
            className="text-xs font-semibold text-content-primary-dark underline"
          >
            Modifier
          </Link>
        ) : null}
      </div>
    </li>
  );
}
