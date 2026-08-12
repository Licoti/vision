/**
 * Produits — la liste, chemin canonique de la navigation.
 *
 * Elle répond à « sur quels objets le centre intervient-il, et pour quelles
 * entités ». Quatre colonnes, pas une de plus : nom, entité, nombre
 * d'accompagnements, dernière activité.
 *
 * **Le filtre passe par l'URL** (`?entite=…`) et non par un état client : il
 * se partage, il survit à un rechargement, et l'écran reste un composant
 * serveur. Un identifiant qui ne désigne aucune entité du domaine est ignoré,
 * jamais affiché — inventer un libellé à partir d'un paramètre serait donner
 * du crédit à ce qu'on n'a pas lu.
 *
 * **« Nouveau produit » n'apparaît qu'au responsable de domaine** (F1-D1, D9).
 * C'est le critère de validation de T2.5, et il se lit ici : l'action est
 * absente du rendu, pas seulement grisée. Elle figure aussi dans l'état vide,
 * `docs/06` §9 voulant qu'un état vide propose le geste qui le remplit.
 *
 * Aucune requête directe : tout passe par `session.db`, déjà scopé sur le
 * domaine courant. Règle 1.
 */

import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { List, ListHeader, ListRow } from "@/components/ui/list";
import { Page, PageHeader } from "@/components/ui/page";
import { requireSession } from "@/lib/auth/provider";
import { entities } from "@/lib/db/schema";
import { formatAccompaniments, formatMonth } from "@/lib/format";
import { ROUTES } from "@/lib/navigation";
import {
  listProductEntities,
  listProductsWithCounts,
  type ProductEntity,
} from "@/lib/queries/products";
import { isUuid } from "@/lib/uuid";

export const metadata = {
  title: "Produits — Vision",
};

/** Les gabarits de colonne, tenus en un seul endroit pour que l'en-tête et
 *  les lignes ne puissent pas diverger. */
const COLUMN = {
  name: "min-w-0 flex-1",
  entity: "w-40 flex-none",
  count: "w-40 flex-none",
  freshness: "w-36 flex-none text-right",
} as const;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ entite?: string }>;
}) {
  const session = await requireSession();
  const { entite } = await searchParams;

  const filters = await listProductEntities(session.db);

  // La forme est vérifiée avant la base (`lib/uuid`), puis le paramètre est
  // confronté au domaine avant d'être cru. `find` est scopé : l'entité d'un
  // autre domaine n'existe pas, elle ne « manque » pas.
  const requested = entite && isUuid(entite) ? entite : undefined;
  const activeEntity = requested
    ? await session.db.find(entities, requested)
    : undefined;

  const products = await listProductsWithCounts(session.db, {
    entityId: activeEntity?.id,
  });

  return (
    <Page>
      <PageHeader
        title="Produits"
        lead="Sur quels objets le centre intervient-il, et pour quelles entités ?"
        action={session.can.manageDomain ? <NewProductLink /> : null}
      />

      {filters.length > 0 ? (
        <EntityFilters entities={filters} activeId={activeEntity?.id} />
      ) : null}

      {products.length > 0 ? (
        <List label="Produits accompagnés">
          <ListHeader>
            <span className={COLUMN.name}>Produit</span>
            <span className={COLUMN.entity}>Entité</span>
            <span className={COLUMN.count}>Accompagnements</span>
            <span className={COLUMN.freshness}>Dernière activité</span>
          </ListHeader>

          {products.map((product) => (
            <ListRow key={product.id} href={ROUTES.product(product.id)}>
              <span
                className={`${COLUMN.name} font-semibold text-content-neutral-darkest`}
              >
                {product.name}
              </span>
              <span className={COLUMN.entity}>{product.entityLabel}</span>
              <span className={COLUMN.count}>
                {formatAccompaniments(product.projectCount)}
              </span>
              <span className={`${COLUMN.freshness} text-content-neutral-base`}>
                {product.lastActivityAt ? (
                  <>
                    {/* L'en-tête de colonne est décoratif : la ligne dit
                        elle-même de quoi cette date est la date. */}
                    <span className="sr-only">Dernière activité : </span>
                    {formatMonth(product.lastActivityAt)}
                  </>
                ) : (
                  <>
                    <span className="sr-only">Dernière activité : </span>
                    aucune à ce jour
                  </>
                )}
              </span>
            </ListRow>
          ))}
        </List>
      ) : activeEntity ? (
        <EmptyState
          title={`Aucun produit pour ${activeEntity.label}`}
          description="Le centre n'accompagne aucun produit rattaché à cette entité. Les produits d'une autre entité restent visibles sans le filtre."
          action={
            <Link
              href={ROUTES.products}
              className="text-sm font-semibold text-content-primary-dark underline"
            >
              Voir tous les produits
            </Link>
          }
        />
      ) : (
        <EmptyState
          title="Aucun produit accompagné pour l'instant"
          description="Cette liste réunira les objets sur lesquels le centre intervient — pas le catalogue de l'entreprise. Chaque produit y portera son entité, le nombre d'accompagnements qu'il a reçus et la date de sa dernière activité."
          {...(session.can.manageDomain
            ? { action: <NewProductLink /> }
            : {})}
        />
      )}
    </Page>
  );
}

/** L'action de création. Rendue par l'appelant, et lui seul, sous condition
 *  de droit — ce composant n'en connaît aucun. */
function NewProductLink() {
  return (
    <Link
      href={ROUTES.productNew}
      className="rounded-lg bg-surface-primary-base px-4 py-2 text-sm font-semibold text-content-neutral-pale"
    >
      Nouveau produit
    </Link>
  );
}

/**
 * Les filtres d'entité, en liens.
 *
 * Local à cet écran, et volontairement : T2.3 devra combiner quatre filtres et
 * une recherche, ce qui appelle une autre forme. La poser ici reviendrait à
 * écrire ce ticket-là par avance.
 */
function EntityFilters({
  entities: options,
  activeId,
}: {
  entities: ProductEntity[];
  activeId: string | undefined;
}) {
  const chip = (active: boolean) =>
    [
      "rounded-full border px-4 py-1.5 text-sm",
      active
        ? "border-border-primary-lighter bg-surface-primary-lightest font-semibold text-content-primary-dark"
        : "border-surface-neutral-lighter bg-surface-neutral-pale font-medium text-content-neutral-dark",
    ].join(" ");

  return (
    <nav aria-label="Filtrer par entité">
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link
            href={ROUTES.products}
            aria-current={activeId ? undefined : "true"}
            className={chip(!activeId)}
          >
            Toutes les entités
          </Link>
        </li>
        {options.map((option) => (
          <li key={option.id}>
            <Link
              href={`${ROUTES.products}?entite=${option.id}`}
              aria-current={activeId === option.id ? "true" : undefined}
              className={chip(activeId === option.id)}
            >
              {option.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
