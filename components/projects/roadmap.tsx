/**
 * La roadmap des activités — le bloc dominant de la page projet.
 *
 * `docs/06` §5 : elle vient immédiatement après l'en-tête, avant tout bloc de
 * référence. C'est le récit de l'accompagnement, et la raison d'être de Vision.
 *
 * Le composant porte **la section entière**, son en-tête compris. T3.2 doit
 * poser « Ajouter une activité » en tête du bloc *et* dans l'état vide : les
 * deux emplacements vivent ici, et la page n'aura pas à connaître ce détail.
 *
 * Quatre groupes seulement (`docs/03` §6) : le cinquième — annulé — arrive avec
 * T3.5, le ticket qui peut le peupler.
 *
 * Aucune lecture en base : le composant reçoit ce que `listProjectRoadmap` a
 * déjà groupé et trié.
 */

import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section";
import { Tag } from "@/components/ui/tag";
import { formatActivityPeriod } from "@/lib/format";
import type { RoadmapGroup, RoadmapGroupKey } from "@/lib/queries/activities";

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

export function Roadmap({ groups }: { groups: RoadmapGroup[] }) {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Roadmap des activités"
        note="Le récit de l'accompagnement, au mois."
      />

      {groups.length > 0 ? (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <RoadmapSection key={group.key} group={group} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Aucune activité pour l'instant"
          description="La roadmap réunira ici les ateliers, tests, audits et restitutions de l'accompagnement, groupés par état : en cours, prévu, à planifier, terminé. Chaque activité portera son type, son objectif, sa période, son approche et, le cas échéant, son résultat avec le lien vers l'outil qui l'a produit."
        />
      )}
    </section>
  );
}

/**
 * Un groupe : son intitulé, son compteur, ses entrées.
 *
 * Le compteur est un `aria-hidden` : la liste porte déjà son nombre pour
 * l'assistance par le `role="list"` qu'elle expose. Le titre est un `h3` — la
 * section porte le `h2`, et la hiérarchie ne saute pas de niveau.
 */
function RoadmapSection({ group }: { group: RoadmapGroup }) {
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
          <li
            key={activity.id}
            className={`flex flex-wrap items-start justify-between gap-x-6 gap-y-2 rounded-lg border border-surface-neutral-lighter border-l-3 ${tone.edge} bg-surface-neutral-pale px-5 py-4`}
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

            <span className="text-xs whitespace-nowrap text-content-neutral-base">
              {formatActivityPeriod(
                activity.periodStart,
                activity.periodEnd,
                activity.isUnscheduled,
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
