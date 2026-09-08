/**
 * Le départ vers un fournisseur, depuis une invitation —
 * `GET /invitation/[jeton]/entrer?fournisseur=google|microsoft`, T11.2.
 *
 * **Pourquoi une route et non la page.** Une page rendue côté serveur ne peut
 * pas poser de cookie — Next le refuse —, et le jeton doit voyager quelque part
 * pendant l'aller-retour SSO. Un formulaire l'aurait pu, au prix d'un `POST` là
 * où le geste est une navigation ; cette route est le calque exact de
 * `/auth/connexion`, qui pose déjà le handshake sur un `GET` et redirige. La
 * page reste donc des liens, et tient sans JavaScript.
 *
 * **Le jeton part dans un cookie scellé, jamais dans l'URL d'autorisation.**
 * Il y traverserait le fournisseur, ses journaux et le `Referer` du navigateur.
 * Le sceau est celui du handshake — **le même HMAC**, `lib/auth/cookie.ts` —,
 * et il ne prouve rien du jeton : il dit qu'il n'a pas été récrit en chemin.
 * Ce qu'il vaut, `redeemInvitation` seul le tranche, au retour.
 *
 * **Elle ne juge pas le jeton**, et c'est délibéré : elle ne lit pas la base.
 * Un jeton mort passe ici et se refuse au rappel, où le refus est indistinct.
 * Vérifier deux fois n'aurait rien ajouté — sinon un second endroit où une
 * cause pourrait fuir.
 *
 * **Un fournisseur absent, inconnu ou non raccordé ramène à la page
 * d'invitation, jamais à une erreur.** C'est la règle qu'`/auth/connexion` a
 * apprise le 08/09/2026 en rendant `500` sur le bouton Microsoft, et elle est
 * reprise telle quelle plutôt que réapprise.
 */

import { NextResponse, type NextRequest } from "next/server";

import {
  INVITATION_COOKIE,
  INVITATION_TTL_SECONDS,
  sealInvitation,
} from "@/lib/auth/cookie";
import { isProviderConnected, isProviderId } from "@/lib/auth/oidc";
import { AUTH_ROUTES, sessionCookieOptions } from "@/lib/auth/provider";
import { ROUTES } from "@/lib/navigation";

/* Un cookie tiré d'un secret : rien à mettre en cache. */
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jeton: string }> },
): Promise<NextResponse> {
  const { jeton } = await params;
  const asked = request.nextUrl.searchParams.get("fournisseur");

  if (!isProviderId(asked) || !isProviderConnected(asked)) {
    return NextResponse.redirect(
      new URL(ROUTES.invitation(jeton), request.nextUrl),
    );
  }

  const response = NextResponse.redirect(
    new URL(AUTH_ROUTES.signIn(asked), request.nextUrl),
  );

  response.cookies.set(INVITATION_COOKIE, sealInvitation({ token: jeton }), {
    ...sessionCookieOptions,
    maxAge: INVITATION_TTL_SECONDS,
  });

  return response;
}
