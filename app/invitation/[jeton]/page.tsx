/**
 * La page publique d'une invitation — `GET /invitation/[jeton]`, T11.2.
 *
 * **Le seul écran neuf du chantier**, et la seule adresse de Vision qui s'ouvre
 * sans session avec l'écran d'entrée.
 *
 * **Elle vit hors du groupe `(app)`**, comme `app/domaines/` et `app/auth/` :
 * ni coquille, ni navigation. La barre latérale suppose un domaine et une
 * personne, et il n'y en a aucun ici — c'est le précédent d'`/auth/acces`, qui
 * l'écrit : *« la barre latérale suppose un domaine »*. `app/layout.tsx` ne
 * fournissant ni `<main>` ni gouttière, cette page porte les siens.
 *
 * **Elle ne distingue pas ses causes.** Jeton inconnu, expiré, révoqué et déjà
 * accepté disent **le même mot** — *un refus qui distingue ses causes est un
 * oracle offert à qui frappe*. Les sept causes de `redeemInvitation` nomment des
 * tests, jamais des messages ; c'est la règle de l'écran d'entrée, et elle vaut
 * ici davantage encore : l'adresse est publique, et son paramètre se devine.
 *
 * **Elle nomme le domaine**, et c'est tout ce qu'elle rend d'une invitation
 * valide. `findInvitationByTokenHash` ne rend « que de quoi désigner un
 * domaine, jamais de quoi le traverser » (T11.1) : ni le nom de l'invité, ni son
 * adresse, ni son rôle ne paraissent — qui tient le lien n'a pas encore prouvé
 * qu'il est la personne attendue, et l'écran ne lui apprend rien qu'il ne sache.
 *
 * **Le jeton n'authentifie jamais** (arbitrage (1)) : cette page n'ouvre aucune
 * session et n'écrit rien. Elle mène au fournisseur, qui vérifie, et
 * l'acceptation se joue au retour — après les six règles d'entrée.
 *
 * **Responsive et accessible dès l'écriture** : T7.6 est passé le 30/08/2026 et
 * ne repassera pas ; T7.7, lui, la prendra en balayage. La mise en page reprend
 * les trois patterns mesurés de T7.6 — repli sans point d'arrêt (`flex-wrap`),
 * gouttière tenue, largeur bornée — et **n'invente aucun point d'arrêt**.
 *
 * **Aucun couple de couleurs neuf par la position** (règle 2) : les jetons de
 * texte sont ceux qu'`/auth/acces` porte sur le même fond de page —
 * `-darkest`, `-dark`, `-base`, mesurés par TD.1 —, `EmptyState` porte les
 * siens, et les liens sont le bouton du design system.
 *
 * **Le mot « Vision » est le `h1` de l'écran** (T7.7), pour la raison qu'il
 * l'est sur `/auth/acces` et mesurée de la même façon : sans lui, le HTML servi
 * s'ouvrait sur le `h2` d'`EmptyState`. Le titre de l'écran reste « Rejoindre
 * … » au rang 2 — il nomme ce que l'invité vient faire, jamais le produit qui
 * l'accueille.
 */

import Link from "next/link";

import { buttonClass } from "@/components/ui/button";
import { hashInvitationToken } from "@/lib/auth/invitation";
import {
  isProviderConnected,
  PROVIDERS,
  type ProviderId,
} from "@/lib/auth/oidc";
import { superAdmin } from "@/lib/db/scoped";
import { EmptyState } from "@/components/ui/empty-state";
import { ROUTES } from "@/lib/navigation";

/* Une invitation se révoque et se périme : rien à mettre en cache. */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Invitation — Vision",
};

/** L'ordre d'`/auth/acces`, et pour la même raison : il décide du bouton principal. */
const ORDER: readonly ProviderId[] = ["google", "microsoft"];

/**
 * Ce que la page dit d'un lien qui ne vaut rien, **dans les quatre cas**.
 *
 * Écrit une fois pour que les quatre ne puissent pas diverger : deux messages
 * voisins finiraient par se distinguer, et la distinction serait l'oracle.
 */
const REFUSED =
  "Ce lien d'invitation n'est plus valide. Il a peut-être expiré, ou déjà servi. Demandez à la personne qui vous a invité de vous en transmettre un nouveau.";

/**
 * Ce lien vaut-il encore ? — les quatre causes que cette page connaît, et
 * qu'elle ne dit pas.
 *
 * **Hors du composant, et c'est `react-hooks/purity` qui l'a exigé** : lire
 * l'horloge dans un rendu est un appel impur, dont le résultat changerait d'un
 * re-rendu à l'autre. La règle a mordu à l'écriture, et le déplacement est sa
 * réponse plutôt qu'une désactivation — la page est `force-dynamic`, mais un
 * garde-fou qu'on désactive au premier usage ne garde rien.
 *
 * **Trois des quatre causes se relisent dans `redeemInvitation`**, qui les
 * distingue une à une pour ses tests. Ici elles se confondent : l'écran n'a
 * aucune raison d'en savoir plus que l'invité.
 */
function isUsable(invitation: {
  revokedAt: Date | null;
  acceptedAt: Date | null;
  expiresAt: Date;
}): boolean {
  return (
    invitation.revokedAt === null &&
    invitation.acceptedAt === null &&
    invitation.expiresAt.getTime() > Date.now()
  );
}

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ jeton: string }>;
}) {
  const { jeton } = await params;

  /* **On interroge l'empreinte, jamais le jeton** : `token_hash` est tout ce
     que la base connaît du lien (T11.1). Le clair ne descend pas plus bas que
     cette ligne. */
  const invitation = await superAdmin.findInvitationByTokenHash(
    hashInvitationToken(jeton),
  );

  /* **Le tri se fait ici, et il ne se dit pas.** `findInvitationByTokenHash` ne
     juge de rien — c'est délibéré, et c'est ce qui permet à `redeemInvitation`
     d'isoler ses sept causes pour ses tests. Cette page, elle, n'en connaît que
     quatre et n'en dit aucune. */
  const usable = invitation !== undefined && isUsable(invitation);

  /* Le domaine se lit après, jamais avant : un lien mort ne nomme personne, et
     une lecture de plus sur un jeton inventé serait payée à chaque frappe. */
  const domain = usable ? await superAdmin.findDomain(invitation.domainId) : null;

  /* **Un domaine suspendu ou archivé refuse comme un lien mort** — la règle
     d'entrée qui rend `domain_closed` (`lib/auth/entry.ts`), tenue ici aussi
     pour que la page ne promette pas un accès que le rappel refusera. Et elle
     ne le dit pas davantage. */
  const open =
    domain !== undefined &&
    domain !== null &&
    domain.archivedAt === null &&
    domain.status === "active";

  const offered = ORDER.filter(isProviderConnected);

  return (
    <main className="mx-auto flex min-h-screen max-w-160 flex-col justify-center gap-8 px-5 py-12 md:px-10 md:py-18">
      <header className="flex flex-col gap-2">
        <h1 className="flex items-center gap-2 text-xl font-bold text-content-neutral-darkest">
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-surface-secondary-base"
          />
          Vision
        </h1>
        <p className="text-sm leading-200 text-content-neutral-dark">
          Comment un centre de compétence design accompagne les produits
          d&apos;une entreprise, dans le temps.
        </p>
      </header>

      {open && domain ? (
        <EmptyState
          title={`Rejoindre ${domain.name}`}
          description={
            offered.length > 0
              ? `Vous êtes invité à rejoindre l'espace Vision de ${domain.name}. Connectez-vous avec le compte professionnel dont l'adresse a reçu cette invitation : c'est votre fournisseur d'identité qui vérifie qui vous êtes, et ce lien seul n'ouvre aucun accès.`
              : `Vous êtes invité à rejoindre l'espace Vision de ${domain.name}. Aucun fournisseur d'identité n'est raccordé à cet environnement : la connexion n'y est pas possible pour l'instant.`
          }
          {...(offered.length > 0
            ? {
                action: (
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {offered.map((provider, index) => (
                      /* **Un lien, pas un formulaire** : l'adresse pose le
                         cookie et redirige, comme `/auth/connexion` le fait du
                         handshake depuis T9.2 — et la page tient donc sans
                         JavaScript. Le premier proposé porte le bouton
                         principal, jamais « Google toujours ». */
                      <Link
                        key={provider}
                        href={ROUTES.invitationEnter(jeton, provider)}
                        className={buttonClass({
                          variant: index === 0 ? "primary" : "secondary",
                        })}
                      >
                        {PROVIDERS[provider].label}
                      </Link>
                    ))}
                  </div>
                ),
              }
            : {})}
        />
      ) : (
        <EmptyState title="Invitation indisponible" description={REFUSED} />
      )}
    </main>
  );
}
