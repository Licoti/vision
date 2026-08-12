/**
 * Le sélecteur de personne courante — outil de développement, pas un écran du
 * produit. Il n'existe qu'en développement : en production la route rend 404.
 *
 * Il tient le rôle que le SSO tiendra en C7 : désigner qui l'on est. Et il
 * rend le critère de validation de T1.4 observable — basculer de personne
 * change les droits affichés, parce que ce sont les droits du contexte, lus
 * tels quels, jamais recalculés ici.
 *
 * Interdit du ticket : aucune page de connexion. Ceci n'authentifie rien.
 */

import { asc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

import { getSession, setCurrentPerson } from "@/lib/auth/provider";
import { listAccounts, type DomainRole } from "@/lib/auth/session";
import { projects } from "@/lib/db/schema";

/* Le contexte se lit à chaque requête : rien à mettre en cache. */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Contexte de session — développement",
};

const ROLE_LABEL: Record<DomainRole, string> = {
  domain_manager: "responsable de domaine",
  member: "membre",
};

export default async function DevSessionPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const session = await getSession();
  const accounts = session ? await listAccounts(session.domainId) : [];

  /* Les projets ouverts à la saisie, nommés. `includeArchived` pour que la
     liste affichée corresponde exactement aux désignations du contexte. */
  const contributorProjects =
    session && session.can.contributorProjectIds.length > 0
      ? await session.db.list(projects, {
          where: inArray(projects.id, [...session.can.contributorProjectIds]),
          orderBy: [asc(projects.name)],
          includeArchived: true,
        })
      : [];

  async function switchPerson(formData: FormData) {
    "use server";
    const personId = formData.get("personId");
    if (typeof personId === "string" && personId.length > 0) {
      await setCurrentPerson(personId);
    }
    revalidatePath("/", "layout");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-180 flex-col gap-8 px-10 py-18">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-content-neutral-light uppercase">
          Développement
        </p>
        <h1 className="text-3xl font-bold text-content-neutral-darkest">
          Contexte de session
        </h1>
        <p className="text-sm leading-200 text-content-neutral-dark">
          L&apos;authentification est un stub jusqu&apos;en C7. La personne
          courante se désigne ici ; le contexte qu&apos;elle alimente a déjà sa
          forme définitive.
        </p>
      </header>

      {session ? (
        <>
          <form
            action={switchPerson}
            className="flex flex-col gap-3 rounded-md border border-border-default bg-surface-neutral-opacity-trace p-6"
          >
            <label
              htmlFor="personId"
              className="text-xs font-semibold text-content-neutral-base uppercase"
            >
              Personne courante
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <select
                id="personId"
                name="personId"
                defaultValue={session.person.id}
                className="min-w-80 rounded-sm border border-border-default bg-surface-neutral-lightest px-3 py-2 text-sm text-content-neutral-darkest"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.fullName} — {ROLE_LABEL[account.role]}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-sm bg-surface-primary-base px-4 py-2 text-sm font-semibold text-surface-neutral-lightest"
              >
                Basculer
              </button>
            </div>
          </form>

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-content-neutral-darkest">
              Ce que le contexte expose
            </h2>
            <dl className="flex flex-col gap-3 text-sm">
              <Field label="Personne">
                {session.person.fullName}
                {session.person.email ? (
                  <span className="text-content-neutral-light">
                    {" "}
                    · {session.person.email}
                  </span>
                ) : null}
              </Field>
              <Field label="Domaine">
                {session.domain.name}
                <span className="text-content-neutral-light">
                  {" "}
                  · centre {session.domain.competenceCenterName}
                </span>
              </Field>
              <Field label="Rôle">{ROLE_LABEL[session.role]}</Field>
              <Field label="Identifiant de domaine">
                <code className="font-secondary text-xs">
                  {session.domainId}
                </code>
              </Field>
            </dl>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-content-neutral-darkest">
              Droits d&apos;écriture
            </h2>
            <ul className="flex flex-col gap-2">
              <Right granted={session.can.manageDomain}>
                Crée et modifie produits, projets et référentiels
              </Right>
              <Right granted={session.can.writeAnyProject}>
                Saisit activités, ressources, résultats et relevés
              </Right>
            </ul>
            <p className="text-sm leading-200 text-content-neutral-dark">
              {session.can.manageDomain
                ? "Portée de saisie : tous les projets du domaine."
                : contributorProjects.length > 0
                  ? `Portée de saisie : les projets où cette personne est contributrice désignée — ${contributorProjects
                      .map((project) => project.name)
                      .join(", ")}.`
                  : "Portée de saisie : aucun projet. Cette personne lit tout le domaine et n'y écrit rien."}
            </p>
          </section>
        </>
      ) : (
        <section className="flex flex-col gap-3 rounded-md border border-border-default bg-surface-neutral-opacity-trace p-6">
          <h2 className="text-lg font-semibold text-content-neutral-darkest">
            Aucune personne courante
          </h2>
          <p className="text-sm leading-200 text-content-neutral-dark">
            La base ne porte pas encore de domaine actif, ou aucune de ses
            personnes ne peut se connecter. L&apos;amorçage est le ticket
            suivant, T1.5 ; le sélecteur se remplira seul.
          </p>
        </section>
      )}
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <dt className="min-w-50 text-content-neutral-base">{label}</dt>
      <dd className="text-content-neutral-darkest">{children}</dd>
    </div>
  );
}

function Right({
  granted,
  children,
}: {
  granted: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 text-sm">
      <span
        className={
          granted
            ? "rounded-full bg-surface-success-lightest px-3 py-1 text-xs font-semibold text-content-success-dark"
            : "rounded-full bg-surface-neutral-opacity-faded px-3 py-1 text-xs font-semibold text-content-neutral-light"
        }
      >
        {granted ? "oui" : "non"}
      </span>
      <span
        className={
          granted ? "text-content-neutral-darkest" : "text-content-neutral-light"
        }
      >
        {children}
      </span>
    </li>
  );
}
