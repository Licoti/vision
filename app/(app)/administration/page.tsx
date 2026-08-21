/**
 * Administration — le référentiel des entités (21/08/2026).
 *
 * Elle répond à « comment adapter le vocabulaire du domaine ? » (`docs/06` §2).
 * C'est l'écran promis par **D25** — « un écran sommaire de gestion des
 * référentiels existe, en C7 » —, avancé sur **un seul** référentiel : les six
 * autres portent des colonnes propres (`family`, `nature`, `rank`,
 * `produces_result`) et donc d'autres formulaires. Ils reprendront cette forme.
 *
 * **L'écran entier est réservé au responsable de domaine** (F1-D1, D9, D25), et
 * il rend **404** à qui ne l'est pas — pas 403 : c'est la règle de
 * `produits/nouveau`, et elle vaut ici pour la même raison qu'un identifiant
 * d'un autre domaine rend 404. Dire « interdit » serait dire qu'il y a quelque
 * chose derrière.
 *
 * **Ce n'est pas cette route qui protège**, et il faut le redire à chaque
 * écran : les cinq actions redérivent le droit sur ce qu'elles reçoivent, et
 * `loadAdminDrawer` le redérive de son côté. Une route retirée n'a jamais
 * protégé les points d'entrée HTTP qu'elle affichait.
 *
 * **La liste montre les entités archivées**, seule de l'application à le faire.
 * Un écran de gestion doit montrer ce qu'il a rangé : sans cela l'archivage
 * serait une disparition, et le rétablissement n'aurait aucun point d'entrée.
 *
 * **Aucun tri par usage, aucun classement.** Les lignes s'ordonnent par nom,
 * comme partout ailleurs — `docs/06` §10 proscrit le classement d'entités, et
 * ranger le référentiel par « nombre de produits » serait exactement cela.
 * Le décompte est là pour dire ce qui **s'oppose à un geste**, jamais pour
 * qualifier une division de l'entreprise.
 *
 * Aucune requête directe : tout passe par `session.db`, déjà scopé sur le
 * domaine courant. Règle 1.
 */

import { notFound } from "next/navigation";

import { ActionMenu, MENU_ITEM, MENU_ITEM_DANGER } from "@/components/ui/action-menu";
import { buttonClass } from "@/components/ui/button";
import { DrawerHost, DrawerLink } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { List, ListHeader, ListRow } from "@/components/ui/list";
import { Page, PageHeader } from "@/components/ui/page";
import { requireSession } from "@/lib/auth/provider";
import {
  ADMIN_PANEL_PARAMS,
  adminRequestFromParams,
  resolveAdminDrawer,
} from "@/lib/drawers/admin";
import { formatMonth, formatProducts } from "@/lib/format";
import {
  ARCHIVE_PANEL_PARAM,
  DELETE_PANEL_PARAM,
  ENTITY_FORM_PARAM,
  ROUTES,
} from "@/lib/navigation";
import { listEntitiesForAdmin } from "@/lib/queries/entities";

import { restoreEntity } from "./actions";
import { loadAdminDrawer } from "./drawers";

export const metadata = {
  title: "Administration — Vision",
};

/** Les gabarits de colonne, tenus en un seul endroit pour que l'en-tête et
 *  les lignes ne puissent pas diverger. */
const COLUMN = {
  label: "min-w-0 flex-1",
  products: "w-44 flex-none",
  state: "w-40 flex-none",
  actions: "w-12 flex-none",
} as const;

/** Une valeur d'URL, réduite à la première quand Next en rend plusieurs. */
function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();

  /* Le droit avant toute lecture : il ne dépend d'aucun identifiant, et l'écran
     entier lui appartient. `notFound()` lève — rien de ce qui suit ne s'exécute
     pour qui n'administre pas. */
  if (!session.can.manageDomain) notFound();

  const params = await searchParams;
  const rows = await listEntitiesForAdmin(session.db);

  /* **L'URL reste une adresse, elle n'est plus le mécanisme** (TD.2). Coller
     `?entite=<identifiant>` ouvre encore le panneau, ici, au rendu serveur ; le
     clic, lui, passe par `DrawerHost` et n'écrit plus rien. Les deux chemins
     traversent ensuite la **même** résolution — `resolveAdminDrawer`.

     L'exclusivité ne vaut donc que pour ce chemin-ci : plusieurs clés de panneau
     présentes ensemble n'ouvrent **rien**. Elle est écrite en **décompte**,
     comme sur les trois pages qui la portent déjà — c'est ce qui la laissera
     juste le jour où un second référentiel ajoutera ses clés. Côté clic, elle
     est structurelle : l'état ne porte qu'une demande à la fois. */
  const panelKeys = {
    [ENTITY_FORM_PARAM]: one(params[ENTITY_FORM_PARAM]),
    [ARCHIVE_PANEL_PARAM]: one(params[ARCHIVE_PANEL_PARAM]),
    [DELETE_PANEL_PARAM]: one(params[DELETE_PANEL_PARAM]),
  };
  const conflict =
    Object.values(panelKeys).filter((value) => value !== undefined).length > 1;
  const request = adminRequestFromParams(conflict ? {} : panelKeys);

  const drawer = request ? await resolveAdminDrawer(session, request) : null;

  /* Le seul geste qui ne vise aucune ligne. Il paraît à deux endroits —
     l'en-tête et l'état vide —, `docs/06` §9 voulant qu'un état vide propose le
     geste qui le remplit. Aucune condition de droit ici : la page entière est
     déjà tombée pour qui n'administre pas. */
  const addEntityLink = (
    <DrawerLink
      href={ROUTES.adminEntityNew}
      request={{ kind: "entity" }}
      className={buttonClass()}
    >
      Ajouter une entité
    </DrawerLink>
  );

  return (
    <DrawerHost
      initial={drawer}
      load={loadAdminDrawer}
      panelParams={ADMIN_PANEL_PARAMS}
      closeHref={ROUTES.admin}
    >
      <Page>
        <PageHeader
          title="Administration"
          lead="Comment adapter le vocabulaire du domaine ? Les entités qualifient les produits ; les autres référentiels rejoindront cet écran."
          action={addEntityLink}
        />

        {rows.length > 0 ? (
          <List label="Les entités du domaine">
            <ListHeader>
              <span className={COLUMN.label}>Entité</span>
              <span className={COLUMN.products}>Produits</span>
              <span className={COLUMN.state}>État</span>
              <span className={COLUMN.actions} />
            </ListHeader>

            {rows.map((row) => {
              const archived = row.archivedAt !== null;
              /* Les deux conditions que l'écran **annonce** — il ne les tient
                 pas : `archiveEntity` recompte, `deleteEntity` recompte, et la
                 clé étrangère tranche la seconde. Retirer une entrée de menu
                 n'a jamais protégé l'action qu'elle affichait. */
              const canArchive = !archived && row.liveProductCount === 0;
              const canDelete = row.totalProductCount === 0;

              return (
                <ListRow key={row.id}>
                  <span
                    className={`${COLUMN.label} truncate font-semibold text-content-neutral-darkest`}
                  >
                    {row.label}
                  </span>

                  <span className={COLUMN.products}>
                    {/* L'en-tête de colonne est décoratif : la ligne dit
                        elle-même de quoi ce nombre est le nombre. */}
                    <span className="sr-only">Produits rattachés : </span>
                    {formatProducts(row.liveProductCount)}
                    {/* Le total ne paraît que lorsqu'il diffère : sinon la
                        colonne dirait deux fois la même chose. C'est lui qui
                        explique qu'une entité sans produit vivant ne se
                        supprime pourtant pas. */}
                    {row.totalProductCount > row.liveProductCount ? (
                      <span className="text-content-neutral-base">
                        {` · ${row.totalProductCount - row.liveProductCount} archivé${
                          row.totalProductCount - row.liveProductCount > 1
                            ? "s"
                            : ""
                        }`}
                      </span>
                    ) : null}
                  </span>

                  <span className={COLUMN.state}>
                    <span className="sr-only">État : </span>
                    {archived && row.archivedAt ? (
                      <span className="text-content-neutral-base">
                        {`Archivée en ${formatMonth(row.archivedAt)}`}
                      </span>
                    ) : (
                      "En service"
                    )}
                  </span>

                  <span className={`${COLUMN.actions} flex justify-end`}>
                    <ActionMenu
                      label={`Options de l'entité ${row.label}`}
                      variant="tertiary"
                    >
                      {archived ? (
                        /* Un formulaire nu : le rétablissement n'a rien à saisir
                           et rien à confirmer — c'est le geste qui **défait**, et
                           `docs/06` §9 proscrit la confirmation là où elle ne
                           protège rien. La forme de `restoreProduct`. */
                        <form action={restoreEntity.bind(null, row.id)}>
                          <button
                            type="submit"
                            role="menuitem"
                            className={MENU_ITEM}
                          >
                            Rétablir cette entité
                          </button>
                        </form>
                      ) : (
                        <DrawerLink
                          href={ROUTES.adminEntityEdit(row.id)}
                          request={{ kind: "entity", id: row.id }}
                          role="menuitem"
                          className={MENU_ITEM}
                        >
                          Modifier le nom
                        </DrawerLink>
                      )}

                      {canArchive ? (
                        <DrawerLink
                          href={ROUTES.adminEntityArchive(row.id)}
                          request={{ kind: "archive", id: row.id }}
                          role="menuitem"
                          className={MENU_ITEM}
                        >
                          Archiver cette entité
                        </DrawerLink>
                      ) : null}

                      {canDelete ? (
                        <DrawerLink
                          href={ROUTES.adminEntityDelete(row.id)}
                          request={{ kind: "delete", id: row.id }}
                          role="menuitem"
                          className={MENU_ITEM_DANGER}
                        >
                          Supprimer cette entité
                        </DrawerLink>
                      ) : null}
                    </ActionMenu>
                  </span>
                </ListRow>
              );
            })}
          </List>
        ) : (
          <EmptyState
            title="Aucune entité dans ce domaine"
            description="Les entités sont les divisions de l'entreprise cliente : elles qualifient les produits et filtrent leur liste. Tant qu'il n'y en a aucune, aucun produit ne peut être créé."
            action={addEntityLink}
          />
        )}
      </Page>
    </DrawerHost>
  );
}
