/**
 * Projet — la page la plus consultée du produit.
 *
 * Sa segmentation obéit à la règle de `docs/06` §5 : **un récit dominant, des
 * blocs de référence autour.** T2.4 pose l'en-tête d'identité, T3.1 branche la
 * roadmap ; les cinq blocs de référence restent des états vides annoncés, dans
 * leur ordre définitif — un bloc vide est un écran à part entière, pas une page
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
 * **Le panneau de saisie d'activité est cette page, plus un paramètre** (D30,
 * T3.2). `?activite=nouvelle` l'ouvre ; la page reste rendue derrière lui, et
 * porte alors l'attribut HTML `inert` — sans JavaScript, c'est l'ordre du DOM
 * qui décide de la tabulation, et `inert` est ce qui empêche d'entrer au
 * clavier dans le contenu masqué par le voile.
 *
 * **Le droit décide du rendu, pas seulement de l'affichage d'un bouton.** Un
 * membre non contributeur qui tape l'URL d'ouverture obtient la page nue — pas
 * un 404 : la page projet reste lisible par tout le domaine (D9), seul le
 * panneau disparaît.
 *
 * Aucune requête directe : tout passe par `session.db`, déjà scopé sur le
 * domaine courant. Règle 1.
 */

import { asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";

import { ActivityPanel } from "@/components/projects/activity-panel";
import { Roadmap } from "@/components/projects/roadmap";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { Avatar } from "@/components/ui/avatar";
import { Field, FieldRow } from "@/components/ui/field";
import { Page, PageHeader } from "@/components/ui/page";
import { Section, SectionHeader } from "@/components/ui/section";
import { StatusDot } from "@/components/ui/status-dot";
import { Tag } from "@/components/ui/tag";
import { requireSession } from "@/lib/auth/provider";
import { activityTypes, approaches } from "@/lib/db/schema";
import { formatPeriod, formatRank } from "@/lib/format";
import { ACTIVITY_PANEL_NEW, ROUTES } from "@/lib/navigation";
import { listProjectRoadmap } from "@/lib/queries/activities";
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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ activite?: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const session = await requireSession();

  const project = await findProjectDetail(session.db, id);
  if (!project) notFound();

  /* D9 — responsable de domaine, ou contributeur désigné de ce projet. La
     règle est déjà écrite dans le contexte de session : elle ne se rejoue pas
     ici. */
  const canWrite = session.can.writeProject(project.id);
  const { activite } = await searchParams;
  const panelOpen = canWrite && activite === ACTIVITY_PANEL_NEW;

  const [rank, roadmap] = await Promise.all([
    findAccompanimentRank(session.db, project),
    listProjectRoadmap(session.db, project.id),
  ]);

  /* Les deux référentiels ne sont lus **que** si le panneau s'ouvre : la page
     la plus consultée du produit ne paie pas deux requêtes pour un panneau
     fermé. `list` écarte déjà les lignes archivées — on propose des lignes
     vivantes, là où la roadmap **décrit** avec les libellés archivés compris.
     `position` est l'ordre du domaine et prime sur l'alphabet ; la famille le
     précède pour le type, son énuméré portant l'ordre de `docs/03` §2. */
  const panelOptions = panelOpen
    ? await Promise.all([
        session.db.list(activityTypes, {
          orderBy: [
            asc(activityTypes.family),
            asc(activityTypes.position),
            asc(activityTypes.label),
          ],
        }),
        session.db.list(approaches, {
          orderBy: [asc(approaches.position), asc(approaches.label)],
        }),
      ])
    : null;

  return (
    <>
      {panelOptions ? (
        <ActivityPanel
          projectName={project.name}
          closeHref={ROUTES.project(project.id)}
          activityTypes={panelOptions[0].map((row) => ({
            id: row.id,
            label: row.label,
            family: row.family,
          }))}
          approaches={panelOptions[1].map((row) => ({
            id: row.id,
            label: row.label,
          }))}
        />
      ) : null}

      {/* `inert` est un attribut HTML, pas un script : le contenu reste lu et
          affiché derrière le voile, mais ne prend plus ni focus ni clic tant
          que le panneau est ouvert. */}
      <div inert={panelOpen}>
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
              référence (docs/06 §5). L'action d'ouverture du panneau n'existe
              que pour qui peut écrire dans ce projet (D9) : le composant ne
              connaît aucun droit, c'est ici qu'il se lit. */}
          <Roadmap
            groups={roadmap}
            addHref={canWrite ? ROUTES.projectActivityNew(project.id) : null}
          />

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
      </div>
    </>
  );
}
