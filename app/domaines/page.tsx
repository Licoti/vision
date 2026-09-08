/**
 * L'écran au-dessus des domaines — les entreprises clientes, et ce qui les rend
 * joignables (T9.4).
 *
 * Il répond à « qui sont les entreprises clientes, et laquelle peut ouvrir une
 * session ? ». C'est l'écran que `docs/02` §3 promet au rôle *Super
 * administrateur* — *« créer, suspendre, archiver un domaine ; désigner ses
 * responsables »* —, et que `docs/05` §4 a rendu possible en levant son
 * exclusion le 06/09/2026.
 *
 * **Il vit hors du groupe `(app)`**, et ce n'est pas un rangement de fichiers.
 * La coquille de l'application lit une session ; un super administrateur n'en a
 * pas — il n'a ni domaine ni ligne `persons` (arbitrage (4) de
 * `tickets-C9.md`), et `getSession()` rend `null` pour lui. La barre latérale,
 * `MainNav` et la carte de personne courante n'auraient rien à afficher. C'est
 * le précédent d'`/auth/acces`, qui l'écrit : *« ni coquille, ni navigation — la
 * barre latérale suppose un domaine. »*
 *
 * **Il redirige, il ne rend pas 404.** `/administration` fait `notFound()` parce
 * qu'on l'atteint depuis l'intérieur d'un domaine où l'on a le droit d'être ;
 * celui-ci s'atteint sans session du tout, et l'écran d'entrée est la réponse
 * utile. Ni l'un ni l'autre n'est un oracle : `/auth/acces` dit la même chose
 * dans tous les cas — *un refus qui distingue ses causes à l'écran est un oracle
 * offert à qui frappe*.
 *
 * **Ce n'est pas cette route qui protège.** Les huit actions et le point
 * d'entrée des panneaux redérivent l'autorité sur ce qu'ils **reçoivent**, et la
 * couche relit la ligne avant chaque écriture. Une route retirée n'a jamais
 * protégé les points d'entrée HTTP qu'elle affichait.
 *
 * **La liste montre les entreprises archivées**, comme la page Administration
 * montre ses référentiels rangés, et pour la même raison : un écran de gestion
 * doit montrer ce qu'il a rangé, sans quoi l'archivage serait une disparition et
 * le rétablissement n'aurait aucun point d'entrée.
 *
 * **Aucun décompte, aucun classement, aucun indice.** Ni nombre de produits, ni
 * fraîcheur, ni jauge : D39 interdit tout indice calculé qualifiant une
 * entreprise. Ce que la liste dit d'une entreprise tient en deux absences —
 * aucune identité, aucun compte —, et ce sont des **faits d'accessibilité** :
 * elles disent ce qui s'oppose à l'ouverture d'une session, comme le décompte
 * d'usage de la page Administration dit ce qui s'oppose à un rangement. Elles
 * commandent un geste, elles ne notent personne.
 *
 * **Il n'accède à aucune donnée d'un domaine** : ni produit, ni accompagnement,
 * ni personne — seulement l'existence d'un compte. Il administre des
 * entreprises, il ne les traverse pas.
 */

import Link from "next/link";

import { ACTION_LINK_SM } from "@/components/ui/action-link";

import {
  ActionMenu,
  MENU_ITEM,
  MENU_ITEM_DANGER,
} from "@/components/ui/action-menu";
import { buttonClass } from "@/components/ui/button";
import { DrawerHost, DrawerLink } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { List, ListHeader, ListRow } from "@/components/ui/list";
import { Page, PageHeader } from "@/components/ui/page";
import { AUTH_ROUTES } from "@/lib/auth/provider";
import { requireSuperAdmin } from "@/lib/auth/super-admin";
import { asSuperAdmin } from "@/lib/db/scoped";
import {
  domainRequestFromParams,
  DOMAIN_PANEL_PARAMS,
  resolveDomainDrawer,
} from "@/lib/drawers/domains";
import { formatDomainStatus } from "@/lib/format";
import {
  ARCHIVE_PANEL_PARAM,
  DOMAIN_IDENTITIES_PANEL_PARAM,
  DOMAIN_IDENTITY_PANEL_PARAM,
  DOMAIN_MANAGER_PANEL_PARAM,
  DOMAIN_PANEL_PARAM,
  DOMAIN_STATUS_PANEL_PARAM,
  ROUTES,
} from "@/lib/navigation";

import { restoreDomain, resumeDomain } from "./actions";
import { loadDomainDrawer } from "./drawers";

/* L'autorité se relit à chaque requête : rien à mettre en cache. */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Domaines — Vision",
};

/** Les gabarits de colonne, tenus en un seul endroit pour que l'en-tête et les
 *  lignes ne puissent pas diverger. Sous `xl`, la ligne se replie. */
const COLUMN = {
  name: "w-full min-w-0 xl:w-auto xl:flex-1",
  center: "min-w-0 xl:w-56 xl:flex-none",
  identities: "min-w-0 xl:w-64 xl:flex-none",
  state: "flex-none xl:w-40",
  actions: "flex-none xl:w-12",
} as const;

/** Une valeur d'URL, réduite à la première quand Next en rend plusieurs. */
function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DomainsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  /* L'autorité avant toute lecture. Elle redirige — rien de ce qui suit ne
     s'exécute pour qui ne la porte pas —, et elle **relit la ligne** : archiver
     un super administrateur lui retire son droit à la requête suivante. */
  const grant = await requireSuperAdmin();

  const domains = await asSuperAdmin(grant).listDomainsForAdmin();

  const params = await searchParams;

  /* **L'URL reste une adresse, elle n'est plus le mécanisme** (TD.2). Coller
     `?identites=<identifiant>` ouvre encore le panneau, ici, au rendu serveur ;
     le clic passe par `DrawerHost`. Les deux chemins traversent ensuite la
     **même** résolution.

     L'exclusivité ne vaut que pour ce chemin-ci : plusieurs clés de panneau
     présentes ensemble n'ouvrent **rien**. Écrite en décompte, comme sur les
     quatre pages qui la portent déjà. */
  const panelKeys = {
    [DOMAIN_PANEL_PARAM]: one(params[DOMAIN_PANEL_PARAM]),
    [DOMAIN_IDENTITIES_PANEL_PARAM]: one(params[DOMAIN_IDENTITIES_PANEL_PARAM]),
    [DOMAIN_IDENTITY_PANEL_PARAM]: one(params[DOMAIN_IDENTITY_PANEL_PARAM]),
    [DOMAIN_MANAGER_PANEL_PARAM]: one(params[DOMAIN_MANAGER_PANEL_PARAM]),
    [DOMAIN_STATUS_PANEL_PARAM]: one(params[DOMAIN_STATUS_PANEL_PARAM]),
    [ARCHIVE_PANEL_PARAM]: one(params[ARCHIVE_PANEL_PARAM]),
  };
  const conflict =
    Object.values(panelKeys).filter((value) => value !== undefined).length > 1;
  const request = domainRequestFromParams(conflict ? {} : panelKeys);

  const drawer = request ? await resolveDomainDrawer(grant, request) : null;

  /* Le seul geste qui ne vise aucune ligne. Il paraît à deux endroits —
     l'en-tête et l'état vide —, `docs/06` §9 voulant qu'un état vide propose le
     geste qui le remplit. */
  const addDomainLink = (
    <DrawerLink
      href={ROUTES.domainNew}
      request={{ kind: "domain" }}
      className={buttonClass()}
    >
      Ajouter une entreprise
    </DrawerLink>
  );

  return (
    <DrawerHost
      initial={drawer}
      load={loadDomainDrawer}
      panelParams={DOMAIN_PANEL_PARAMS}
      closeHref={ROUTES.domains}
    >
      <main className="mx-auto flex min-h-screen max-w-320 flex-col gap-8 px-10 py-12">
        {/* La coquille tient en deux liens : l'identité de l'écran, et la
            sortie. Aucune navigation de produit — un super administrateur
            n'entre dans aucun domaine. */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <p className="flex items-center gap-2 text-xl font-bold text-content-neutral-darkest">
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-surface-secondary-base"
            />
            Vision
          </p>
          <Link
            href={AUTH_ROUTES.signOut}
            className={buttonClass({ variant: "tertiary", size: "small" })}
          >
            Se déconnecter
          </Link>
        </header>

        <Page>
          <PageHeader
            overline="Au-dessus des domaines"
            title="Entreprises clientes"
            lead="Chaque entreprise est une frontière étanche : rien de ce qui est saisi dans l'une n'est lisible depuis une autre. Une entreprise s'ouvre par l'identité que son fournisseur vérifie, et par les comptes qu'elle a inscrits."
            action={addDomainLink}
          />

          {domains.length > 0 ? (
            <List label="Entreprises clientes">
              <ListHeader>
                <span className={COLUMN.name}>Entreprise</span>
                <span className={COLUMN.center}>Centre de compétence</span>
                <span className={COLUMN.identities}>Identités vérifiées</span>
                <span className={COLUMN.state}>État</span>
                <span className={COLUMN.actions} />
              </ListHeader>

              {domains.map((domain) => {
                const archived = domain.archivedAt !== null;

                return (
                  <ListRow key={domain.id}>
                    <span className={COLUMN.name}>
                      <span className="font-semibold text-content-neutral-darkest">
                        {domain.name}
                      </span>
                      {/* **Une absence se dit, elle ne se compte pas.** Sans
                          compte, l'entreprise est close : c'est la règle
                          d'entrée 6, et c'est ce qui commande le geste du
                          premier responsable. */}
                      {!domain.hasAccount && !archived ? (
                        <span className="mt-1 block text-xs text-content-neutral-base">
                          Aucun compte — personne ne peut se connecter
                        </span>
                      ) : null}
                    </span>

                    <span className={COLUMN.center}>
                      <span className="sr-only">Centre de compétence : </span>
                      {domain.competenceCenterName}
                    </span>

                    <span className={COLUMN.identities}>
                      <span className="sr-only">Identités vérifiées : </span>
                      {domain.hasIdentity ? (
                        <DrawerLink
                          href={ROUTES.domainIdentities(domain.id)}
                          request={{ kind: "identities", id: domain.id }}
                          className={ACTION_LINK_SM}
                        >
                          Gérer les identités
                        </DrawerLink>
                      ) : (
                        <span className="text-content-neutral-base">
                          Aucune identité — aucun jeton ne la désigne
                        </span>
                      )}
                    </span>

                    <span className={COLUMN.state}>
                      <span className="sr-only">État : </span>
                      {archived ? (
                        <span className="text-content-neutral-base">
                          {formatDomainStatus(domain)}
                        </span>
                      ) : (
                        formatDomainStatus(domain)
                      )}
                    </span>

                    <span className={`${COLUMN.actions} flex justify-end`}>
                      <ActionMenu
                        label={`Options de l'entreprise ${domain.name}`}
                        variant="tertiary"
                      >
                        {archived ? (
                          /* Un formulaire nu : le rétablissement n'a rien à
                             saisir et rien à confirmer — c'est le geste qui
                             **défait**, et `docs/06` §9 proscrit la confirmation
                             là où elle ne protège rien. */
                          <form action={restoreDomain.bind(null, domain.id)}>
                            <button
                              type="submit"
                              role="menuitem"
                              className={MENU_ITEM}
                            >
                              Rétablir cette entreprise
                            </button>
                          </form>
                        ) : (
                          <>
                            <DrawerLink
                              href={ROUTES.domainIdentities(domain.id)}
                              request={{ kind: "identities", id: domain.id }}
                              role="menuitem"
                              className={MENU_ITEM}
                            >
                              Gérer les identités vérifiées
                            </DrawerLink>

                            {/* **Il n'ouvre qu'une fois** : une fois un compte
                                posé, la suite se passe à l'intérieur du domaine,
                                par son responsable. */}
                            {!domain.hasAccount ? (
                              <DrawerLink
                                href={ROUTES.domainManager(domain.id)}
                                request={{ kind: "manager", id: domain.id }}
                                role="menuitem"
                                className={MENU_ITEM}
                              >
                                Désigner le premier responsable
                              </DrawerLink>
                            ) : null}

                            {domain.status === "active" ? (
                              <DrawerLink
                                href={ROUTES.domainSuspend(domain.id)}
                                request={{ kind: "suspend", id: domain.id }}
                                role="menuitem"
                                className={MENU_ITEM}
                              >
                                Suspendre cette entreprise
                              </DrawerLink>
                            ) : (
                              <form action={resumeDomain.bind(null, domain.id)}>
                                <button
                                  type="submit"
                                  role="menuitem"
                                  className={MENU_ITEM}
                                >
                                  Rétablir l&apos;accès
                                </button>
                              </form>
                            )}

                            <DrawerLink
                              href={ROUTES.domainArchive(domain.id)}
                              request={{ kind: "archive", id: domain.id }}
                              role="menuitem"
                              className={MENU_ITEM_DANGER}
                            >
                              Archiver cette entreprise
                            </DrawerLink>
                          </>
                        )}
                      </ActionMenu>
                    </span>
                  </ListRow>
                );
              })}
            </List>
          ) : (
            <EmptyState
              title="Aucune entreprise cliente"
              description="Une entreprise naît de son nom, du libellé de son centre de compétence, et de l'identité que son fournisseur vérifie. Sans cette identité, aucun jeton ne la désigne et personne ne peut s'y connecter."
              action={addDomainLink}
            />
          )}
        </Page>
      </main>
    </DrawerHost>
  );
}
