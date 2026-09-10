/**
 * L'écran d'entrée — et de refus. **C'est le même**, et c'est une décision.
 *
 * Règle 5 : un état vide est un écran à part entière, jamais un cas d'erreur.
 * Celui-ci en est un, et il porte **un seul message** : *il ne dit jamais si
 * l'entreprise est cliente ni si la personne existe*. Un refus qui distingue
 * ses causes à l'écran est un oracle offert à qui frappe — les sept causes
 * d'`entry.ts` nomment des tests, pas des messages.
 *
 * **Les liens de connexion vivent ici, et nulle part ailleurs.**
 * `/auth/connexion?fournisseur=…` est une redirection, pas un écran : sans cet
 * écran, rien ne permettrait de *démarrer* une connexion au navigateur.
 * Réunir l'entrée et le refus tient donc en une phrase — on n'apprend rien de
 * plus en étant refusé qu'en arrivant.
 *
 * **Ils ne sont proposés que raccordés** (08/09/2026). L'écran offrait les deux
 * fournisseurs de la table quand un seul a ses valeurs — arbitrage (1) : *la
 * couche s'écrit pour deux fournisseurs et en sert un*. Le bouton Microsoft
 * menait à un **500** (mesuré), là où la règle 5 veut un écran. Ce n'est pas un
 * oracle : ce qui se révèle ici est la configuration de Vision, jamais si une
 * entreprise est cliente ni si une personne existe.
 *
 * **Aucun fournisseur raccordé reste un état, pas une erreur** : l'écran le dit
 * et ne propose rien. Le cas ne s'atteint que sur un environnement sans aucune
 * valeur — et c'est exactement là qu'un écran muet coûterait le plus cher.
 *
 * **Deux états, et le troisième a duré le temps d'un chantier.** Un super
 * administrateur n'a ni domaine ni ligne `persons` (arbitrage 4) : sa connexion
 * aboutit sans produire de `Session`, et il bouclerait entre `/` et cette
 * adresse. T9.2 l'a retenu par un état vide qui disait *« l'administration des
 * domaines n'est pas encore ouverte »* ; **T9.4 l'a ouverte**, et cet état a
 * cédé la place à la redirection qu'il annonçait.
 *
 * **Aucune boucle entre les deux écrans**, et la raison tient en une phrase :
 * celui-ci ne renvoie vers `/domaines` que **muni** d'une autorité, quand
 * `/domaines` ne renvoie ici que faute d'en avoir une.
 *
 * **Il vit hors du groupe `(app)`** : ni coquille, ni navigation. La barre
 * latérale suppose un domaine, et il n'y en a pas ici.
 *
 * **Aucun couple de couleurs neuf par la position** : les trois jetons de
 * texte sont ceux que TD.1 a mesurés sur le fond de page — `-darkest`,
 * `-dark`, `-base` à 4,73:1 —, `EmptyState` porte les siens, et les liens sont
 * le bouton du design system, sans une valeur en dur (règle 2).
 *
 * **Le mot « Vision » est le `h1` de l'écran** (T7.7). Il l'était déjà par la
 * position et par le poids ; il ne l'était pas par la balise, et le HTML servi
 * s'ouvrait donc sur le `h2` d'`EmptyState` — mesuré : *0 h1*. Un écran sans
 * `h1` n'a pas de titre pour qui le parcourt par ses titres, et le rang 2 qui
 * le suit devenait un rang sauté. La balise change, les classes ne changent
 * pas : ce ticket pose des attributs, il ne redessine rien.
 */

import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button";
import { AUTH_ROUTES, getSession, readPrincipal } from "@/lib/auth/provider";
import {
  isProviderConnected,
  PROVIDERS,
  type ProviderId,
} from "@/lib/auth/oidc";
import { ROUTES } from "@/lib/navigation";

/* La session se lit à chaque requête : rien à mettre en cache. */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Accès — Vision",
};

const ORDER: readonly ProviderId[] = ["google", "microsoft"];

export default async function AccessPage() {
  /* Une session valide n'a rien à faire ici. Une personne dont le cookie est
     encore là mais dont l'accès a été retiré, si : elle retombe sur le refus
     indistinct, comme si elle n'avait jamais eu de cookie. */
  if (await getSession()) redirect("/");

  /* Un super administrateur n'a pas de `Session` — `getSession` rend `null`
     pour lui —, et ce n'est donc pas la garde ci-dessus qui l'écarte d'ici :
     c'est celle-ci. Son écran est `/domaines`, où `requireSuperAdmin()` relira
     sa ligne. */
  const principal = await readPrincipal();
  if (principal?.kind === "super_admin") redirect(ROUTES.domains);

  /* Lu à la requête, jamais figé au module : l'écran doit dire l'état de
     **cet** environnement, et un environnement se déploie avec d'autres
     valeurs que celui d'à côté. */
  const offered = ORDER.filter(isProviderConnected);

  return (
    <main className="mx-auto flex min-h-screen max-w-160 flex-col justify-center gap-8 px-10 py-18">
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

      <EmptyState
        title="Aucun accès"
        description={
          offered.length > 0
            ? "Cet espace est réservé aux personnes que leur entreprise y a inscrites. Se connecter avec un compte professionnel :"
            : "Cet espace est réservé aux personnes que leur entreprise y a inscrites. Aucun fournisseur d'identité n'est raccordé à cet environnement : la connexion n'y est pas possible."
        }
        {...(offered.length > 0
          ? {
              action: (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {offered.map((provider, index) => (
                    <Link
                      key={provider}
                      href={AUTH_ROUTES.signIn(provider)}
                      /* **Le premier proposé porte le bouton principal**, et non
                         « Google toujours » : le jour où Google se retire d'un
                         environnement, un écran sans aucun bouton principal
                         serait un écran sans chemin évident. L'ordre est celui
                         d'`ORDER`, jamais celui de la table. */
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
    </main>
  );
}
