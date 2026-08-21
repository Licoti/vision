/**
 * La coquille applicative : barre latérale de navigation, et zone de contenu.
 *
 * Elle enveloppe le groupe de routes `(app)`, c'est-à-dire les sept écrans du
 * produit — et eux seuls. `/dev/session` vit hors du groupe : c'est un outil
 * de développement, il n'a pas à hériter de la navigation du produit, et
 * `ETAT.md` pose que T1.6 n'a pas à le référencer.
 *
 * **Elle lit la session depuis le 21/08/2026**, et c'est l'interdit de T1.6 qui
 * tombe — pas par oubli, mais parce que l'écran qui en avait le droit est
 * arrivé : l'entrée **Administration** de `docs/06` §8 n'a de sens que rendue
 * au seul responsable de domaine. `getSession()` est mémorisée par le `cache()`
 * de React, si bien que la page qu'elle enveloppe la relit sans second
 * aller-retour.
 *
 * **La carte de la personne courante reste absente**, et volontairement : c'est
 * l'autre bloc que T1.6 avait écarté, et il n'est du périmètre d'aucun ticket
 * en cours (règle 3). Ce qui lui manquait n'est plus un droit, c'est un ticket.
 *
 * **Cette lecture ne protège rien** : `/administration` rend 404 à qui
 * n'administre pas, et ses cinq actions redérivent le droit sur ce qu'elles
 * reçoivent. Ce qui se décide ici est ce qui s'affiche.
 *
 * Le lien d'évitement est le premier arrêt de tabulation de chaque page : sans
 * lui, atteindre le contenu coûterait la navigation entière, à chaque écran.
 */

import Link from "next/link";

import { MainNav } from "@/components/shell/main-nav";
import { buttonClass } from "@/components/ui/button";
import { getSession } from "@/lib/auth/provider";
import { ROUTES } from "@/lib/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* `getSession` et non `requireSession` : la coquille enveloppe aussi les
     écrans qui se rendent sans session établie, et une barre de navigation
     n'est pas l'endroit où l'on refuse l'accès. Sans session, aucune entrée
     d'administration — le repli le plus étroit. */
  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <a
        href="#contenu"
        /* `sr-only` **précède** la chaîne du bouton et les quatre `focus:*` la
           suivent : c'est l'ordre servi jusqu'ici, et un attribut réordonné est
           un attribut qui a changé. */
        className={`sr-only ${buttonClass()} focus:not-sr-only focus:absolute focus:top-4 focus:left-4`}
      >
        Aller au contenu
      </a>

      <aside className="flex flex-none flex-col gap-8 bg-surface-primary-base px-4 py-6 md:sticky md:top-0 md:h-screen md:w-62">
        <Link
          href={ROUTES.overview}
          className="flex items-center gap-2 px-1.5 text-xl font-bold text-content-neutral-pale focus-visible:outline-content-neutral-pale"
        >
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-surface-secondary-base"
          />
          Vision
        </Link>
        <MainNav canManageDomain={session?.can.manageDomain ?? false} />
      </aside>

      <main id="contenu" className="min-w-0 max-w-310 flex-1 px-10 pt-9 pb-18">
        {children}
      </main>
    </div>
  );
}
