/**
 * La barre de sous-navigation de la page d'un accompagnement (20/08/2026),
 * d'après `docs/design/maquettes/blocs/project-v2`. **Retirée le 21/08/2026,
 * rendue de nouveau par T7.5** — elle a passé dix jours sans appelant, ses `id`
 * de section et le `scroll-mt-19` de `Section` restant posés et inertes.
 *
 * La page est longue — le récit, les pistes, les blocs de référence — et la
 * maquette y répond par une barre collante qui saute d'un bloc à l'autre. Ce
 * sont des liens de fragment : ils se copient, se partagent, s'ouvrent dans un
 * onglet, et fonctionnent sans une ligne de JavaScript.
 *
 * **Elle ne connaît aucune liste d'ancres, et c'est la leçon des dix jours
 * d'absence.** Elle en portait quatre en dur ; trois cibles ont disparu depuis
 * sans qu'une ligne d'ici bouge — « Projets liés » a quitté le rendu, « Budget »
 * a cessé d'être une `Section` pour devenir un rang de la fiche d'identité, et
 * « Démarrage » ne se rend plus que sur un accompagnement sans activité. Une
 * ancre qui ne vise rien ne se voit pas à l'œil. C'est donc **la page** qui
 * construit les entrées, depuis les variables mêmes qui décident de ses blocs,
 * et ce composant ne fait que les rendre.
 *
 * **Aucune entrée n'est marquée « active », et c'est délibéré.** La maquette en
 * colore une, mais l'entrée courante d'une barre d'ancres est celle que le
 * défilement désigne : la calculer demanderait un observateur d'intersection,
 * donc un composant client, pour une information purement décorative. En
 * marquer une en dur — la première — serait pire : l'affirmation serait fausse
 * dès le premier coup de molette. La barre se lit donc comme ce qu'elle est,
 * un jeu de raccourcis de même rang. Écart consigné dans
 * `JOURNAL-TECHNIQUE.md`.
 *
 * **Le fond opaque n'est pas un ornement** : la barre est collante, et sans lui
 * le contenu défilerait au travers. Il reprend le fond de la page
 * (`surface-neutral-lightest`, posé sur `html` par `app/globals.css`), jamais
 * celui d'une carte — une barre qui paraîtrait posée sur une carte flotterait
 * au-dessus de toutes les autres.
 *
 * Le décalage d'ancre vit dans `Section` (`scroll-mt-19`, 76 px) : sans lui,
 * chaque saut poserait le titre visé **sous** cette barre.
 *
 * **Un `<nav>` nommé**, parce qu'il y en a déjà deux sur la page — la
 * navigation principale et le fil d'Ariane — et qu'une liste d'assistance qui
 * annoncerait trois fois « navigation » ne dirait laquelle (`docs/06` §11).
 */

/** Une ancre : le fragment visé, et ce qu'elle annonce. */
export type SubnavEntry = { readonly href: string; readonly label: string };

export function Subnav({ entries }: { entries: readonly SubnavEntry[] }) {
  return (
    <nav
      aria-label="Sections de l'accompagnement"
      className="sticky top-0 z-10 bg-surface-neutral-lightest pt-2 pb-4"
    >
      <ul className="flex w-fit flex-wrap gap-1 rounded-xl bg-surface-neutral-lighter p-1">
        {entries.map((entry) => (
          <li key={entry.href}>
            <a
              href={entry.href}
              className="block rounded-lg px-4 py-2 text-sm font-medium text-content-neutral-dark hover:bg-surface-neutral-pale"
            >
              {entry.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
