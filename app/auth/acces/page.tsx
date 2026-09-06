/**
 * L'écran d'entrée — et de refus. **C'est le même**, et c'est une décision.
 *
 * Règle 5 : un état vide est un écran à part entière, jamais un cas d'erreur.
 * Celui-ci en est un, et il porte **un seul message** : *il ne dit jamais si
 * l'entreprise est cliente ni si la personne existe*. Un refus qui distingue
 * ses causes à l'écran est un oracle offert à qui frappe — les sept causes
 * d'`entry.ts` nomment des tests, pas des messages.
 *
 * **Les deux liens de connexion vivent ici, et nulle part ailleurs.**
 * `/auth/connexion?fournisseur=…` est une redirection, pas un écran : sans cet
 * écran, rien ne permettrait de *démarrer* une connexion au navigateur.
 * Réunir l'entrée et le refus tient donc en une phrase — on n'apprend rien de
 * plus en étant refusé qu'en arrivant.
 *
 * **Trois états, dont un qui n'existe que le temps d'un chantier.** Un super
 * administrateur n'a ni domaine ni ligne `persons` (arbitrage 4) : sa
 * connexion aboutit sans produire de `Session`, et l'écran qui le concerne est
 * T9.4. Sans cet état, il boucherait entre `/` et cette adresse.
 *
 * **Il vit hors du groupe `(app)`** : ni coquille, ni navigation. La barre
 * latérale suppose un domaine, et il n'y en a pas ici.
 *
 * **Aucun couple de couleurs neuf par la position** : les trois jetons de
 * texte sont ceux que TD.1 a mesurés sur le fond de page — `-darkest`,
 * `-dark`, `-base` à 4,73:1 —, `EmptyState` porte les siens, et les liens sont
 * le bouton du design system, sans une valeur en dur (règle 2).
 */

import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button";
import { AUTH_ROUTES, getSession, readPrincipal } from "@/lib/auth/provider";
import { PROVIDERS, type ProviderId } from "@/lib/auth/oidc";

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

  const principal = await readPrincipal();

  return (
    <main className="mx-auto flex min-h-screen max-w-160 flex-col justify-center gap-8 px-10 py-18">
      <header className="flex flex-col gap-2">
        <p className="flex items-center gap-2 text-xl font-bold text-content-neutral-darkest">
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-surface-secondary-base"
          />
          Vision
        </p>
        <p className="text-sm leading-200 text-content-neutral-dark">
          Comment un centre de compétence design accompagne les produits
          d&apos;une entreprise, dans le temps.
        </p>
      </header>

      {principal?.kind === "super_admin" ? (
        <EmptyState
          title="Vous êtes connecté comme super administrateur"
          description="L'administration des domaines n'est pas encore ouverte. Un super administrateur vit au-dessus des entreprises clientes : il n'entre dans aucune d'elles."
          action={
            <Link
              href={AUTH_ROUTES.signOut}
              className={buttonClass({ variant: "secondary" })}
            >
              Se déconnecter
            </Link>
          }
        />
      ) : (
        <EmptyState
          title="Aucun accès"
          description="Cet espace est réservé aux personnes que leur entreprise y a inscrites. Se connecter avec un compte professionnel :"
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              {ORDER.map((provider) => (
                <Link
                  key={provider}
                  href={AUTH_ROUTES.signIn(provider)}
                  className={buttonClass({
                    variant: provider === "google" ? "primary" : "secondary",
                  })}
                >
                  {PROVIDERS[provider].label}
                </Link>
              ))}
            </div>
          }
        />
      )}
    </main>
  );
}
