"use server";

/**
 * Le point d'entrée serveur des panneaux de la page projet — TD.2.
 *
 * Jumeau de `app/(app)/produits/[id]/drawers.tsx`, et la note de celui-ci vaut
 * mot pour mot : le clic entre ici, la coquille s'est déjà ouverte, et le corps
 * revient rendu avec ses référentiels et ses actions liées **côté serveur**.
 *
 * **Elle ne fait confiance à aucun de ses arguments.** `projectId` et
 * l'identifiant de la demande traversent la frontière du client : la session
 * est relue, l'accompagnement retrouvé dans le domaine courant, et le droit
 * redérivé sur ce qui a été **reçu**.
 */

import { requireSession } from "@/lib/auth/provider";
import {
  loadProjectDrawerContext,
  resolveProjectDrawer,
} from "@/lib/drawers/project";
import {
  asProjectRequest,
  type DrawerContent,
  type DrawerRequest,
} from "@/lib/drawers/types";
import { findProjectDetail } from "@/lib/queries/projects";
import { isUuid } from "@/lib/uuid";

export async function loadProjectDrawer(
  projectId: string,
  received: DrawerRequest,
): Promise<DrawerContent | null> {
  const request = asProjectRequest(received);
  if (!request) return null;

  /* La forme avant la base : une colonne `uuid` interrogée avec n'importe quoi
     rend une erreur PostgreSQL, donc un 500, là où l'on attend un panneau qui
     ne s'ouvre pas. */
  if (!isUuid(projectId)) return null;

  const session = await requireSession();

  const project = await findProjectDetail(session.db, projectId);
  if (!project) return null;

  const context = await loadProjectDrawerContext(session, project, request);
  return resolveProjectDrawer(session, project, context, request);
}
