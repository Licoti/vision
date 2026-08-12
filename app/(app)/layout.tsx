/**
 * La coquille applicative : barre latérale de navigation, et zone de contenu.
 *
 * Elle enveloppe le groupe de routes `(app)`, c'est-à-dire les six écrans du
 * produit — et eux seuls. `/dev/session` vit hors du groupe : c'est un outil
 * de développement, il n'a pas à hériter de la navigation du produit, et
 * `ETAT.md` pose que T1.6 n'a pas à le référencer.
 *
 * Interdit du ticket, tenu : aucune lecture en base. Deux blocs de la
 * maquette en découlent absents, et le sont volontairement — la carte de la
 * personne courante et l'entrée Administration supposent l'une comme l'autre
 * de lire la session, donc la base. Ils reviendront avec l'écran qui en a le
 * droit.
 *
 * Le lien d'évitement est le premier arrêt de tabulation de chaque page : sans
 * lui, atteindre le contenu coûterait la navigation entière, à chaque écran.
 */

import Link from "next/link";

import { MainNav } from "@/components/shell/main-nav";
import { ROUTES } from "@/lib/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <a
        href="#contenu"
        className="sr-only rounded-lg bg-surface-primary-base px-4 py-2 text-sm font-semibold text-content-neutral-pale focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
      >
        Aller au contenu
      </a>

      <aside className="flex flex-none flex-col gap-8 bg-surface-primary-base px-4 py-6 md:sticky md:top-0 md:h-screen md:w-62">
        <Link
          href={ROUTES.overview}
          className="flex items-center gap-2.5 px-1.5 text-xl font-bold text-content-neutral-pale focus-visible:outline-content-neutral-pale"
        >
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full bg-surface-secondary-base"
          />
          Vision
        </Link>
        <MainNav />
      </aside>

      <main id="contenu" className="min-w-0 max-w-310 flex-1 px-10 pt-9 pb-18">
        {children}
      </main>
    </div>
  );
}
