/**
 * L'aller — `GET /auth/connexion?fournisseur=google|microsoft`.
 *
 * **Le premier `route.ts` du dépôt**, et le ticket déroge ici au premier point
 * du protocole en le disant : son critère ne se lit pas dans le HTML servi mais
 * dans un code de réponse et un en-tête `Location`. C'est une mesure, pas une
 * lecture de code.
 *
 * `state`, `nonce` et le vérificateur PKCE repartent dans un cookie scellé de
 * dix minutes, jamais dans une mémoire de serveur : Vision se déploie sans
 * état, et un rappel peut atteindre une autre instance que l'aller.
 *
 * **Aucune URL d'autorisation n'est écrite à la main** : elle vient du document
 * de découverte du fournisseur (`lib/auth/oidc.ts`).
 */

import { NextResponse, type NextRequest } from "next/server";

import {
  HANDSHAKE_COOKIE,
  HANDSHAKE_TTL_SECONDS,
  sealHandshake,
} from "@/lib/auth/cookie";
import { beginAuthorization, isProviderId } from "@/lib/auth/oidc";
import { AUTH_ROUTES, sessionCookieOptions } from "@/lib/auth/provider";

/* Une redirection tirée d'un secret et d'un aléa : rien à mettre en cache. */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const asked = request.nextUrl.searchParams.get("fournisseur");

  /* Un fournisseur absent ou inconnu ramène à l'écran d'entrée, jamais à une
     erreur : l'adresse est publique, et un message d'erreur y renseignerait
     sur ce qui existe. */
  if (!isProviderId(asked)) {
    return NextResponse.redirect(new URL(AUTH_ROUTES.entry, request.nextUrl));
  }

  const { url, handshake } = await beginAuthorization(asked);

  const response = NextResponse.redirect(url);
  response.cookies.set(HANDSHAKE_COOKIE, sealHandshake(handshake), {
    ...sessionCookieOptions,
    maxAge: HANDSHAKE_TTL_SECONDS,
  });
  return response;
}
