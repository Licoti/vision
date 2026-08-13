/**
 * Projet — la page la plus consultée du produit.
 *
 * Sa segmentation obéit à la règle de `docs/06` §5 : **un récit dominant, des
 * blocs de référence autour.** T2.4 pose l'en-tête d'identité ; la roadmap et
 * les cinq blocs de référence restent des états vides annoncés, dans leur
 * ordre définitif — un bloc vide est un écran à part entière, pas une page
 * incomplète (règle 5).
 *
 * Le fil d'Ariane porte les trois maillons de la hiérarchie, le produit
 * cliquable : un projet ne s'affiche jamais sans son parent (`docs/06` §7).
 *
 * L'identifiant vient de l'URL : sa forme est vérifiée avant la base, faute de
 * quoi un paramètre fantaisiste ne produit pas un 404 mais une erreur
 * PostgreSQL, donc un 500. Un projet inconnu — ou d'un autre domaine — rend
 * 404 : la seconde réponse ne se distingue pas de la première, et c'est
 * volontaire.
 *
 * **« Modifier cet accompagnement » n'apparaît qu'au responsable de domaine**
 * (F1-D1, D9) : l'action est absente du rendu pour tout autre, pas grisée. Un
 * contributeur désigné écrit dans le projet — activités, ressources — mais ne
 * modifie pas son identité, qui reste au responsable.
 *
 * Aucune requête directe : tout passe par `session.db`, déjà scopé sur le
 * domaine courant. Règle 1.
 */

import { notFound } from "next/navigation";
import Link from "next/link";

import { Breadcrumb } from "@/components/shell/breadcrumb";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, FieldRow } from "@/components/ui/field";
import { Page, PageHeader } from "@/components/ui/page";
import { Section, SectionHeader } from "@/components/ui/section";
import { StatusDot } from "@/components/ui/status-dot";
import { Tag } from "@/components/ui/tag";
import { requireSession } from "@/lib/auth/provider";
import { formatPeriod, formatRank } from "@/lib/format";
import { ROUTES } from "@/lib/navigation";
import { findAccompanimentRank, findProjectDetail } from "@/lib/queries/projects";
import { isUuid } from "@/lib/uuid";

export const metadata = {
  title: "Projet — Vision",
};

/** Les blocs de référence, dans l'ordre de `docs/06` §5 — fréquence d'usage. */
const REFERENCE_BLOCKS: { title: string; description: string }[] = [
  {
    title: "Ressources",
    description:
      "Les liens vers les documents de l'accompagnement s'afficheront ici, avec leur type et l'activité qui les a produits. Vision n'héberge aucun fichier : elle renvoie vers l'outil qui le porte.",
  },
  {
    title: "Indicateurs adoptés",
    description:
      "Les indicateurs du produit que cet accompagnement reprend à son compte s'afficheront ici, avec leur valeur de référence, la cible fixée et le dernier relevé.",
  },
  {
    title: "Projets liés",
    description:
      "Les autres accompagnements de ce produit s'afficheront ici, puis les liens déclarés vers d'autres projets, chacun avec sa raison.",
  },
  {
    title: "Budget",
    description:
      "La synthèse macro — alloué, consommé — s'affichera ici, avec le lien vers l'outil de gestion. Le suivi budgétaire est tenu là-bas ; Vision renvoie vers la source plutôt que d'en reproduire le détail.",
  },
  {
    title: "Journal",
    description:
      "Qui a modifié quoi, et quand. Une information de contrôle, en dernier : elle sert à retrouver l'origine d'une saisie, pas à comprendre l'accompagnement.",
  },
];

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const session = await requireSession();

  const project = await findProjectDetail(session.db, id);
  if (!project) notFound();

  const rank = await findAccompanimentRank(session.db, project);

  return (
    <>
      <Breadcrumb
        items={[
          { href: ROUTES.products, label: "Produits" },
          { href: ROUTES.product(project.productId), label: project.productName },
          { label: project.name },
        ]}
      />
      <Page>
        <div className="rounded-xl border border-surface-neutral-lighter bg-surface-neutral-pale px-7 py-6">
          <p className="mb-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-2 font-semibold text-content-neutral-dark">
              <StatusDot nature={project.statusNature} />
              {project.statusLabel}
            </span>
            <span aria-hidden="true" className="text-content-neutral-light">
              ·
            </span>
            <span className="text-content-neutral-base">
              {formatPeriod(project.startedOn, project.expectedEndOn)}
            </span>
          </p>

          <PageHeader
            title={project.name}
            {...(project.objective ? { lead: project.objective } : {})}
            action={
              session.can.manageDomain ? (
                <Link
                  href={ROUTES.projectEdit(project.id)}
                  className="rounded-lg border border-content-neutral-normal px-4 py-2 text-sm font-semibold text-content-neutral-dark"
                >
                  Modifier cet accompagnement
                </Link>
              ) : null
            }
          />

          {/* Le rang **se calcule** (`findAccompanimentRank`), et il mène à la
              page produit : c'est la règle de continuité de docs/06 §7 — la
              maquette, elle, pointait vers l'accompagnement voisin. */}
          {rank !== null ? (
            <p className="mt-3 text-sm">
              <Link
                href={ROUTES.product(project.productId)}
                className="text-content-info-base underline"
              >
                {formatRank(rank)}
              </Link>
            </p>
          ) : null}

          <FieldRow>
            <Field label="Entité">{project.entityLabel}</Field>

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

            {/* Le nom est écrit en toutes lettres à côté de la pastille, et
                « côté entité » est du texte : la couleur de la pastille ne
                porte jamais seule la distinction (docs/06 §11). */}
            <Field label="Équipe">
              {project.team.length > 0 ? (
                <span className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  {project.team.map((member) => (
                    <span key={member.id} className="flex items-center gap-2">
                      <Avatar name={member.fullName} tone={member.kind} />
                      {member.fullName}
                      {member.kind === "stakeholder" ? (
                        <span className="text-xs text-content-neutral-base">
                          · côté entité
                        </span>
                      ) : null}
                    </span>
                  ))}
                </span>
              ) : (
                <span className="text-content-neutral-base">
                  Aucun membre désigné
                </span>
              )}
            </Field>
          </FieldRow>
        </div>

        {/* Le récit, en position dominante : il vient avant tout bloc de
            référence (docs/06 §5). */}
        <section className="flex flex-col gap-4">
          <SectionHeader
            title="Roadmap des activités"
            note="Le récit de l'accompagnement, au mois."
          />
          <EmptyState
            title="Aucune activité pour l'instant"
            description="La roadmap réunira ici les ateliers, tests, audits et restitutions de l'accompagnement, groupés par état : en cours, prévu, à planifier, terminé. Chaque activité portera son type, son objectif, sa période, son approche et, le cas échéant, son résultat avec le lien vers l'outil qui l'a produit."
          />
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          {REFERENCE_BLOCKS.map((block) => (
            <Section key={block.title}>
              <SectionHeader title={block.title} />
              <p className="text-sm leading-175 text-content-neutral-base">
                {block.description}
              </p>
            </Section>
          ))}
        </div>
      </Page>
    </>
  );
}
