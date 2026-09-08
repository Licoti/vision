/**
 * Le retour — `GET /auth/callback/[fournisseur]`.
 *
 * **Trois temps, et l'ordre est la règle** : le jeton se vérifie
 * (`lib/auth/oidc.ts`), les six règles d'entrée statuent (`lib/auth/entry.ts`),
 * puis, et seulement alors, le cookie se pose.
 *
 * **Un refus ne pose aucun cookie, et c'est ce qui se mesure.** Une redirection
 * vers l'écran d'entrée ne prouve rien : *qu'un jeton soit refusé se lit dans la
 * réponse, mais qu'aucune session n'ait été posée se lit dans le cookie et dans
 * la base*. Le cookie d'aller-retour, lui, s'efface **dans tous les cas** — un
 * `state` consommé ne se rejoue pas.
 *
 * **La cause du refus ne sort jamais d'ici.** Elle nomme le test qui l'éprouve ;
 * l'écran dit la même chose dans les sept cas. Un refus qui distingue ses causes
 * est un oracle offert à qui frappe.
 *
 * **Un quatrième temps depuis T11.2, et il ne se glisse pas avant les autres.**
 * L'invitation s'accepte **après** `resolvePrincipal`, jamais avant (arbitrage
 * (4) de `tickets-C11.md`), et **seulement sur `no_access`** : c'est le seul des
 * sept refus qu'un lien peut réparer. Il en découle trois propriétés qu'aucune
 * ligne d'ici n'a à porter — aucune personne ne naît à la volée (`docs/04` §7),
 * aucun domaine non client ne s'ouvre (règle d'entrée 5), personne d'archivé ne
 * ressuscite. **`lib/auth/entry.ts` n'est pas modifié d'un caractère**, et
 * déplacer cet appel avant lui doit faire tomber les mesures de domaine et
 * d'archivage : c'est ainsi que l'arbitrage se met en défaut.
 *
 * **Le cookie d'invitation s'efface dans tous les cas**, comme le handshake :
 * accepté, refusé, ou simplement présent sur une connexion qui n'en avait pas
 * besoin. Un jeton qui survivrait à son aller-retour se rejouerait au suivant.
 */

import { NextResponse, type NextRequest } from "next/server";

import {
  HANDSHAKE_COOKIE,
  INVITATION_COOKIE,
  SESSION_COOKIE,
  openHandshake,
  openInvitation,
  sealPrincipal,
} from "@/lib/auth/cookie";
import { resolvePrincipal } from "@/lib/auth/entry";
import { redeemInvitation } from "@/lib/auth/invitation";
import { completeAuthorization, isProviderId } from "@/lib/auth/oidc";
import { AUTH_ROUTES, sessionCookieOptions } from "@/lib/auth/provider";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fournisseur: string }> },
): Promise<NextResponse> {
  const { fournisseur } = await params;

  const refuse = () => {
    const response = NextResponse.redirect(
      new URL(AUTH_ROUTES.entry, request.nextUrl),
    );
    response.cookies.delete(HANDSHAKE_COOKIE);
    response.cookies.delete(INVITATION_COOKIE);
    return response;
  };

  if (!isProviderId(fournisseur)) return refuse();

  const handshake = openHandshake(request.cookies.get(HANDSHAKE_COOKIE)?.value);
  if (!handshake) return refuse();

  let claims;
  try {
    claims = await completeAuthorization(
      fournisseur,
      request.nextUrl.searchParams,
      handshake,
    );
  } catch {
    /* Toute anomalie du jeton — signature, `iss`, `aud`, expiration, `nonce`,
       `state`, PKCE — se refuse ici, sans distinction. */
    return refuse();
  }

  const outcome = await resolvePrincipal(claims);

  /* **Les six règles ont statué ; l'invitation vient après, et pour un seul
     refus.** Une personne référencée sans compte (D19) rend `no_access` : c'est
     exactement l'état qu'un lien ouvre. Les six autres refus restent des refus,
     et le lien ne les touche pas. */
  let granted = outcome.granted;

  if (!granted && outcome.refused === "no_access") {
    const invitation = openInvitation(
      request.cookies.get(INVITATION_COOKIE)?.value,
    );

    if (invitation) {
      const redeemed = await redeemInvitation(invitation.token, claims);
      granted = redeemed.granted;
    }
  }

  if (!granted) return refuse();

  const response = NextResponse.redirect(new URL("/", request.nextUrl));
  response.cookies.delete(HANDSHAKE_COOKIE);
  response.cookies.delete(INVITATION_COOKIE);
  response.cookies.set(
    SESSION_COOKIE,
    sealPrincipal(granted),
    sessionCookieOptions,
  );
  return response;
}
