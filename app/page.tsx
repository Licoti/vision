/* Page d'accueil provisoire : elle ne prouve qu'une chose, que la chaîne
   Next.js — Tailwind — variables de thème fonctionne de bout en bout.
   La coquille applicative et la vue d'ensemble sont posées en T1.6. */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-160 flex-col justify-center gap-4 px-10 py-18">
      <p className="text-xs font-semibold text-content-neutral-light uppercase">
        Socle technique
      </p>
      <h1 className="text-3xl font-bold text-content-neutral-darkest">Vision</h1>
      <p className="text-md leading-200 text-content-neutral-dark">
        La chaîne technique répond. Chaque valeur visuelle de cette page — la
        couleur, la taille, la graisse, l&apos;espacement, le rayon — vient
        d&apos;une variable de thème traduite de{" "}
        <code className="rounded-sm bg-surface-neutral-opacity-faded px-1 font-secondary text-sm">
          docs/design/design-system.md
        </code>
        . Aucune valeur en dur nulle part.
      </p>
      <p className="text-sm text-content-neutral-base">
        Prochaine étape : T1.2, le schéma de la base de données.
      </p>
    </main>
  );
}
