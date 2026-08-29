/**
 * La fiche d'identité de l'accompagnement — le rail droit de la page projet.
 *
 * Écrite hors ticket le 28/08/2026, à la demande, pour la direction retenue au
 * canevas de maquettes : **le récit à gauche, la référence stable à droite.**
 *
 * Ce qu'elle porte vivait jusqu'ici dans la carte d'en-tête de la page —
 * la ligne de situation composée à la main (statut, période, rang) et la
 * `FieldRow` de quatre champs. Deux raisons de l'avoir descendue :
 *
 *   1. **Elle occupait le rang le plus haut de l'écran pour ce qui bouge le
 *      moins.** Entité, commanditaire et approches ne changent pas de la vie
 *      d'un accompagnement, et tenaient une rangée pleine juste avant le récit,
 *      qui est la raison d'être de la page (`docs/06` §5, D31).
 *   2. **Le rail servait mal les deux blocs qu'il portait.** À 380 px,
 *      « Ressources » écrivait ses gestes sous la description faute de largeur,
 *      et le commentaire de `resources.tsx` l'assumait. Des couples nom/valeur,
 *      eux, n'ont jamais eu besoin de plus.
 *
 * **C'est un écart à `docs/06` §5**, qui veut l'identité dans l'en-tête — « tout
 * ce qui permet de comprendre le projet sans faire défiler ». L'intention tient
 * et la lettre non : sur grand écran la fiche est visible sans défiler, et en
 * pile elle passe **au-dessus** du récit, à la place exacte qu'occupait la
 * rangée de champs. Consigné dans `JOURNAL-TECHNIQUE.md`.
 *
 * **Elle n'est pas collante**, et c'est mesuré plutôt que supposé : ses six
 * champs et son rang de budget font près de 700 px. Sur une fenêtre de portable
 * elle la remplirait presque, et une fiche plus haute que la fenêtre ne se lit
 * pas au-delà de son pli — le collant coûterait un motif neuf pour rien.
 *
 * **L'entité n'y figure pas.** Elle est le surtitre de l'écran, comme sur la
 * page produit (`produits/[id]/page.tsx`) : l'écrire aux deux endroits serait
 * une redondance, pas une intention.
 *
 * **Le composant ne connaît aucun droit.** Le point d'entrée du budget arrive en
 * `string | null`, déjà décidé par l'appelant — la règle de `PageHeader`, de
 * `SectionHeader` et de `Block`. Un composant de socle qui trancherait un droit
 * le trancherait pour tous les écrans à la fois.
 */

import Link from "next/link";

import { BudgetRank } from "@/components/projects/budget";
import { AvatarGroup } from "@/components/ui/avatar";
import { Field } from "@/components/ui/field";
import { Section, SectionHeader } from "@/components/ui/section";
import { StatusPill } from "@/components/ui/status-pill";
import { Tag } from "@/components/ui/tag";
import { formatPeriod, formatRank } from "@/lib/format";
import type { ProjectBudget } from "@/lib/queries/budgets";
import type { ProjectDetail } from "@/lib/queries/projects";

export function Identity({
  project,
  rank,
  productHref,
  budget,
  budgetEditHref,
}: {
  project: ProjectDetail;
  /** Le rang de l'accompagnement dans son produit, ou `null` s'il est inconnu. */
  rank: number | null;
  /** La page du produit — la remontée de `docs/06` §7, jamais un droit. */
  productHref: string;
  /** La ligne du projet, ou `null` : un accompagnement sans budget est normal. */
  budget: ProjectBudget | null;
  /** L'ouverture du panneau de budget, ou `null` pour qui ne peut pas écrire. */
  budgetEditHref: string | null;
}) {
  return (
    <Section>
      <SectionHeader
        title="Identité"
        note="Où en est l'accompagnement, qui le porte, et ce qu'il engage."
      />

      {/* Des couples nom/valeur, et non la `FieldRow` de l'en-tête : son filet
          supérieur et sa marge appartiennent au bas d'une carte de titre, et il
          n'y a plus de carte de titre. `Field` est repris tel quel — mêmes
          balises, mêmes jetons —, seule la rangée est écrite ici. C'est ce que
          fait déjà `AdoptionCard` pour ses deux valeurs.

          **Rangée qui se replie sous `xl`, colonne dans le rail** : la fiche
          occupe alors toute la largeur, et six valeurs courtes empilées y
          laisseraient une colonne de vide à leur droite. Les écarts sont ceux
          de `FieldRow` — `gap-x-10 gap-y-6` —, puisque c'est la mise en page
          qu'elle rend, et le `gap-5` de la colonne est celui du rail. */}
      <dl className="flex flex-wrap gap-x-10 gap-y-6 xl:flex-col xl:gap-5">
        <Field label="Statut">
          <StatusPill nature={project.statusNature} label={project.statusLabel} />
        </Field>

        {/* `formatPeriod` dit lui-même l'absence — « Période non renseignée » —,
            et une période ouverte se dit « depuis février 2026 » plutôt que
            « février 2026 → ? » : un accompagnement en cours n'a pas une fin
            manquante, il n'en a pas encore. */}
        <Field label="Période">
          {formatPeriod(project.startedOn, project.expectedEndOn)}
        </Field>

        {/* **Le rang est la règle de continuité de `docs/06` §7**, et il reste
            cliquable vers le produit : c'est ce détail qui fait comprendre que
            le produit a une histoire plus longue que l'accompagnement consulté.
            Le champ disparaît quand le rang est inconnu — un couple nom/valeur
            vide ne dirait rien que l'absence du champ ne dise mieux. */}
        {rank !== null ? (
          <Field label="Rang">
            <Link href={productHref} className="text-content-info-base underline">
              {formatRank(rank)}
            </Link>
          </Field>
        ) : null}

        <Field label="Commanditaire">
          {project.sponsor ?? (
            <span className="text-content-neutral-base">Non renseigné</span>
          )}
        </Field>

        <Field label="Approches">
          {project.approachLabels.length > 0 ? (
            <span className="flex flex-wrap gap-1.5">
              {project.approachLabels.map((label) => (
                <Tag key={label} label={label} />
              ))}
            </span>
          ) : (
            <span className="text-content-neutral-base">
              Aucune approche déclarée
            </span>
          )}
        </Field>

        {/* L'équipe en pile d'avatars et décompte, reprise telle quelle de
            l'en-tête (20/08/2026, maquette `project-v2`). Les noms ne
            disparaissent pas : `AvatarGroup` les porte en texte de
            remplacement, mention « côté entité » comprise, et la teinte de
            chaque pastille la redit à l'œil. La couleur ne porte donc pas seule
            (`docs/06` §11) — elle double une information que l'assistance
            reçoit en toutes lettres. */}
        <Field label="Équipe">
          {project.team.length > 0 ? (
            <AvatarGroup
              size="md"
              count={`${project.team.length} ${
                project.team.length > 1 ? "personnes" : "personne"
              }`}
              names={project.team.map((member) => ({
                fullName: member.fullName,
                tone: member.kind === "stakeholder" ? "stakeholder" : "center",
                ...(member.kind === "stakeholder" ? { note: "côté entité" } : {}),
              }))}
            />
          ) : (
            <span className="text-content-neutral-base">Aucun membre désigné</span>
          )}
        </Field>
      </dl>

      <BudgetRank budget={budget} editHref={budgetEditHref} />
    </Section>
  );
}
