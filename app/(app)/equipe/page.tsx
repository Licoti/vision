/**
 * Équipe — le référentiel des personnes.
 *
 * Il répond à « qui compose le centre de compétence, et que sait faire
 * chacun ? ». `persons` existe depuis T1.2, mais aucun écran ne présentait une
 * personne : elle n'existait que vue depuis un projet.
 *
 * **Les lignes ne mènent nulle part** (D29) : il n'y a pas de page personne, et
 * il n'y en aura pas — la fiche s'ouvrira en T5bis.4 par un paramètre d'URL sur
 * cette même page, la mécanique des panneaux existants.
 *
 * **La mention « côté entité » est du texte**, et le nom est écrit en toutes
 * lettres à côté de la pastille d'initiales : la couleur ne porte jamais seule
 * la distinction (`docs/06` §11). C'est le balisage de la page projet, repris
 * tel quel.
 *
 * **Aucune écriture ici** : ni bouton, ni action, ni point d'entrée. Les trois
 * gestes arrivent en T5bis.6, et cet écran ne lit donc aucun droit — un ticket
 * de lecture précède un ticket d'écriture, le rythme de T3.1 et de T5.1.
 *
 * Aucune requête directe : tout passe par `session.db`, déjà scopé sur le
 * domaine courant. Règle 1.
 */

import { AvailabilityDot } from "@/components/team/availability-dot";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { List, ListHeader, ListRow } from "@/components/ui/list";
import { Page, PageHeader } from "@/components/ui/page";
import { Tag } from "@/components/ui/tag";
import { requireSession } from "@/lib/auth/provider";
import { listTeam } from "@/lib/queries/team";

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

export default async function TeamPage() {
  const session = await requireSession();
  const rows = await listTeam(session.db);

  return (
    <Page>
      <PageHeader
        title="Équipe"
        lead="Qui compose le centre de compétence, et que sait faire chacun ?"
      />

      {rows.length > 0 ? (
        <List label="Les personnes du domaine">
          <ListHeader>
            <span className={COLUMN.person}>Personne</span>
            <span className={COLUMN.job}>Métier</span>
            <span className={COLUMN.availability}>Disponibilité</span>
            <span className={COLUMN.skills}>Compétences</span>
          </ListHeader>

          {rows.map((row) => (
            // Sans `href` : une ligne ne mène nulle part, il n'y a pas de page
            // personne (D29).
            <ListRow key={row.id}>
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

              {/* Une personne sans compétence le dit. Ce n'est pas un état
                  d'erreur : le profil n'est simplement pas encore recueilli. */}
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
            </ListRow>
          ))}
        </List>
      ) : (
        <EmptyState
          title="Aucune personne pour l'instant"
          description="Cette liste réunira les membres du centre de compétence et les intervenants côté entité — leur métier, leur disponibilité, et les compétences que chacun déclare. C'est ce référentiel qui dira un jour qui pourrait intervenir sur un accompagnement."
        />
      )}
    </Page>
  );
}
