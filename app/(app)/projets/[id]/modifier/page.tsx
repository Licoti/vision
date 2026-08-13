/**
 * Modifier un accompagnement — le miroir de `/projets/nouveau`, pré-rempli.
 *
 * Même garde de droit, même formulaire, même action ; seule change la
 * fonction d'écriture, **liée à l'identifiant côté serveur**. L'identifiant ne
 * transite donc par aucun champ caché : il ne peut pas être remplacé par celui
 * d'un autre projet dans la requête soumise.
 *
 * `docs/06` §9 demande une « édition en place pour les champs simples ». Une
 * page dédiée est retenue, comme en T2.5 et pour la même raison — désaccord
 * consigné au journal technique, pas rejoué ici. Il pèse d'ailleurs moins ici :
 * ce formulaire porte quatre tables, ce qu'aucune édition en place ne fait.
 *
 * L'identifiant vient de l'URL : sa forme est vérifiée avant la base, faute de
 * quoi un paramètre fantaisiste rendrait 500 et non 404. Un projet inconnu —
 * ou d'un autre domaine — rend 404, sans que les deux cas se distinguent.
 *
 * Aucune requête directe : tout passe par `session.db`. Règle 1.
 */

import { notFound } from "next/navigation";

import { ProjectForm } from "@/components/projects/project-form";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { Page, PageHeader } from "@/components/ui/page";
import { requireSession } from "@/lib/auth/provider";
import { projects } from "@/lib/db/schema";
import { EMPTY_PROJECT_VALUES } from "@/lib/forms/project";
import { ROUTES } from "@/lib/navigation";
import {
  findProjectLinks,
  listProjectFormOptions,
} from "@/lib/queries/projects";
import { isUuid } from "@/lib/uuid";

import { updateProject } from "../../actions";

export const metadata = {
  title: "Modifier un accompagnement — Vision",
};

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const session = await requireSession();
  if (!session.can.manageDomain) notFound();

  // `find` rend la ligne entière — `statusId`, `sponsor` et les dates
  // comprises, que `findProjectDetail` ne remonte pas telles quelles : elle
  // sert un en-tête, pas un formulaire, et elle n'a pas à changer pour ce
  // ticket.
  const project = await session.db.find(projects, id);
  if (!project) notFound();

  const [options, links] = await Promise.all([
    listProjectFormOptions(session.db),
    findProjectLinks(session.db, project.id),
  ]);

  return (
    <>
      <Breadcrumb
        items={[
          { href: ROUTES.projects, label: "Projets" },
          { href: ROUTES.project(project.id), label: project.name },
          { label: "Modifier" },
        ]}
      />
      <Page>
        <PageHeader
          overline="Modifier"
          title={project.name}
          lead="Les activités de cet accompagnement ne sont pas touchées : seuls son identité, son statut, sa période et son équipe changent."
        />

        <ProjectForm
          action={updateProject.bind(null, project.id)}
          products={options.products}
          statuses={options.statuses}
          jobs={options.jobs}
          approaches={options.approaches}
          people={options.people}
          initial={{
            ...EMPTY_PROJECT_VALUES,
            productId: project.productId,
            name: project.name,
            objective: project.objective ?? "",
            sponsor: project.sponsor ?? "",
            statusId: project.statusId,
            startedOn: project.startedOn ?? "",
            expectedEndOn: project.expectedEndOn ?? "",
            jobIds: links.jobIds,
            approachIds: links.approachIds,
            team: Object.fromEntries(
              links.members.map((member) => [
                member.personId,
                member.isContributor ? "contributor" : "member",
              ]),
            ),
          }}
          submitLabel="Enregistrer les modifications"
          cancelHref={ROUTES.project(project.id)}
        />
      </Page>
    </>
  );
}
