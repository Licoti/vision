/**
 * La sortie — `/auth/deconnexion`.
 *
 * **Un cookie effacé, et rien d'autre** : il n'y a pas d'état de session côté
 * serveur à défaire. Vision ne rappelle jamais le fournisseur (aucun
 * `offline_access` demandé), et ne referme donc pas de session chez lui : cette
 * route dit « plus ici », pas « plus nulle part ».
 *
 * `POST` et `GET` : le geste se fait par un bouton de formulaire, et l'adresse
 * doit rester tapable.
 */

import { NextResponse, type NextRequest } from "next/server";

import { HANDSHAKE_COOKIE, SESSION_COOKIE } from "@/lib/auth/cookie";
import { AUTH_ROUTES } from "@/lib/auth/provider";

export const dynamic = "force-dynamic";

function signOut(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(
    new URL(AUTH_ROUTES.entry, request.nextUrl),
  );
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(HANDSHAKE_COOKIE);
  return response;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return signOut(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return signOut(request);
}
