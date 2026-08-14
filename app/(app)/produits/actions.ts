"use server";

/**
 * Les écritures de l'écran Produits — les premières de Vision.
 *
 * F1-D1 et D9 : **créer, modifier, archiver et rétablir un produit est réservé
 * au responsable de domaine.** Les formulaires et les points d'entrée sont déjà
 * absents du rendu pour qui n'a pas ce droit ; la garde qui compte est celle qui
 * est ici. Une action serveur est un point d'entrée HTTP à part entière — un
 * bouton masqué n'est pas un droit, et une route interdite ne protège pas
 * l'action qu'elle affichait.
 *
 * Aucune écriture directe : tout passe par `session.db`, déjà scopé sur le
 * domaine courant et sur la personne courante — `domain_id` et `created_by`
 * sont posés par la couche, l'appelant n'a pas à y penser. Règle 1.
 *
 * **L'archivage arrive en T4bis.2, et il est le premier appelant d'`archive()`**
 * — la fonction existait depuis T1.3 sans que rien n'y mène. Trois règles
 * l'accompagnent, et toutes trois vivent ici plutôt qu'à l'écran :
 *   — un produit déjà archivé ne se modifie plus, sur l'identifiant **reçu** ;
 *   — un produit qui porte encore un accompagnement vivant ne s'archive pas, et
 *     le refus dit combien (arbitrage (e) de `tickets-C4bis.md`) ;
 *   — aucune cascade, jamais (arbitrage (f)) : les accompagnements d'un produit
 *     archivé gardent leur `archived_at` nul et cessent de s'afficher parce que
 *     leur parent ne s'affiche plus.
 *
 * Aucune suppression, jamais (règle 4) : la couche n'expose pas de `delete`, et
 * ce qui est archivé se rétablit.
 */

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ConfirmState } from "@/components/ui/confirm-panel";
import { requireSession } from "@/lib/auth/provider";
import { products, projects } from "@/lib/db/schema";
import { DomainScopeError, type Row } from "@/lib/db/scoped";
import { formatAccompaniments } from "@/lib/format";
import {
  parseProductForm,
  type ProductFormState,
  type ProductInput,
} from "@/lib/forms/product";
import { ROUTES } from "@/lib/navigation";

/** L'issue d'une écriture : l'identifiant à atteindre, ou l'état à réafficher. */
type Outcome = { productId: string } | { state: ProductFormState };

/**
 * Le tronc commun des deux actions : le droit, la forme, puis l'écriture.
 *
 * `write` reçoit une ligne déjà validée. Elle rend l'identifiant du produit
 * touché — celui qu'on vient de créer, ou celui qu'on vient de modifier — ou un
 * refus qui porte son propre message. `undefined` reste le cas de la ligne
 * introuvable, dont le message est le même pour les deux actions ; un refus
 * nommé est ce qui permet à T4bis.2 de dire « archivé » plutôt que
 * « n'existe plus », qui serait faux.
 */
async function submit(
  formData: FormData,
  write: (
    session: Awaited<ReturnType<typeof requireSession>>,
    input: ProductInput,
  ) => Promise<string | { refused: string } | undefined>,
): Promise<Outcome> {
  const { values, errors, input } = parseProductForm(formData);
  const session = await requireSession();

  if (!session.can.manageDomain) {
    return {
      state: {
        values,
        errors: {},
        message:
          "La création et la modification d'un produit sont réservées au responsable de domaine.",
      },
    };
  }

  if (!input) return { state: { values, errors } };

  try {
    const written = await write(session, input);

    if (typeof written === "object") {
      return { state: { values, errors: {}, message: written.refused } };
    }

    const productId = written;
    if (!productId) {
      // `update` ne trouve rien : identifiant inconnu, ou d'un autre domaine.
      // La couche est scopée, elle ne distingue pas les deux — et l'écran non
      // plus, pour la même raison que la page produit rend 404 dans les deux cas.
      return {
        state: {
          values,
          errors: {},
          message: "Ce produit n'existe plus dans ce domaine.",
        },
      };
    }
    return { productId };
  } catch (error) {
    // L'entité a la forme d'un identifiant mais n'appartient pas au domaine :
    // la couche a **déjà refusé** l'écriture. L'écran ne fait que le dire.
    if (error instanceof DomainScopeError) {
      return {
        state: {
          values,
          errors: { entityId: "Cette entité n'appartient pas au domaine." },
        },
      };
    }
    throw error;
  }
}

/**
 * Les écrans à réactualiser après une écriture, puis la redirection.
 *
 * `redirect` lève : elle est appelée **hors de tout `try`**, faute de quoi le
 * `catch` de `submit` avalerait la navigation et rendrait un formulaire au
 * lieu d'une page produit.
 */
function goToProduct(productId: string): never {
  revalidatePath(ROUTES.products);
  revalidatePath(ROUTES.product(productId));
  redirect(ROUTES.product(productId));
}

export async function createProduct(
  _previous: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const outcome = await submit(formData, async (session, input) => {
    const created = await session.db.insert(products, input);
    return created.id;
  });

  if ("state" in outcome) return outcome.state;
  goToProduct(outcome.productId);
}

export async function updateProduct(
  id: string,
  _previous: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const outcome = await submit(formData, async (session, input) => {
    /* Un produit archivé ne se modifie plus (T4bis.2). Le contrôle porte sur
       l'identifiant **reçu**, et il est le seul qui protège : la page de
       modification rend 404 sur un produit archivé, mais une route interdite
       n'a jamais protégé l'action qu'elle affichait — les champs récoltés
       avant l'archivage se repostent tels quels ensuite. */
    const current = await session.db.find(products, id);
    if (current?.archivedAt) {
      return {
        refused:
          "Ce produit est archivé : il ne se modifie plus. Rétablissez-le d'abord.",
      };
    }

    // `input` ne porte que les quatre colonnes du ticket : `update` refuse
    // `id` et `archivedAt`, et rien d'autre ne peut s'y glisser depuis le
    // formulaire — `readProductForm` ne lit que ce qu'il connaît.
    const updated = await session.db.update(products, id, input);
    return updated?.id;
  });

  if ("state" in outcome) return outcome.state;
  goToProduct(outcome.productId);
}

/* ==========================================================================
   Archiver, et rétablir — T4bis.2
   ========================================================================== */

/**
 * Le droit, puis le produit, sur l'identifiant **reçu**.
 *
 * `bind(null, product.id)` fait sortir l'identifiant de la saisie, mais Next le
 * sérialise dans un champ `$ACTION_…` du balisage, en clair en développement, et
 * une soumission peut le réécrire. **Une action ne tire jamais une autorisation
 * de la valeur qu'on lui a liée** — elle interroge le droit sur la valeur reçue.
 */
async function openProduct(
  productId: string,
): Promise<
  | {
      session: Awaited<ReturnType<typeof requireSession>>;
      product: Row<typeof products>;
    }
  | { message: string }
> {
  const session = await requireSession();

  if (!session.can.manageDomain) {
    return {
      message:
        "L'archivage et le rétablissement d'un produit sont réservés au responsable de domaine.",
    };
  }

  const product = await session.db.find(products, productId);
  if (!product) {
    return { message: "Ce produit n'existe plus dans ce domaine." };
  }

  return { session, product };
}

/**
 * Archiver un produit : il quitte les listes, sa page reste lisible (règle 4).
 *
 * **Le refus qui compte est celui de l'arbitrage (e)** : un produit portant
 * encore un accompagnement non archivé ne s'archive pas, et le message dit
 * combien. L'autoriser masquerait des accompagnements **vivants** des deux
 * listes, `listProjects` et `listProductsWithCounts` écartant déjà par jointure
 * les projets d'un produit archivé. Ranger un parent dont les enfants vivent
 * n'est pas ranger, c'est faire disparaître.
 *
 * Le compte se lit par `count`, qui écarte les archivés d'elle-même : ce sont
 * bien les accompagnements **vivants** qui s'opposent au rangement, pas ceux
 * qu'on a déjà rangés.
 *
 * Aucune cascade — arbitrage (f) : les accompagnements archivés que ce produit
 * porte ne sont pas touchés, et le rétablissement reste donc écrivable.
 */
export async function archiveProduct(
  productId: string,
  _previous: ConfirmState,
  _formData: FormData,
): Promise<ConfirmState> {
  const gate = await openProduct(productId);
  if ("message" in gate) return gate;
  const { session, product } = gate;

  // Déjà archivé : le geste n'a rien à faire, et `archive` ne toucherait rien.
  if (product.archivedAt) return {};

  const alive = await session.db.count(projects, {
    where: eq(projects.productId, productId),
  });
  if (alive > 0) {
    const plural = alive > 1 ? "s" : "";
    return {
      message: `Ce produit porte encore ${formatAccompaniments(alive)} non archivé${plural}. Archivez-le${plural} d'abord : ranger le produit les ferait disparaître des listes sans les ranger.`,
    };
  }

  await session.db.archive(products, productId);

  revalidatePath(ROUTES.products);
  revalidatePath(ROUTES.product(productId));
  redirect(ROUTES.product(productId));
}

/**
 * Rétablir un produit archivé — le retour que sa page porte (arbitrage (b)).
 *
 * **Un refus est muet**, comme `transitionActivity` depuis T3.5 : ce geste n'a
 * aucune saisie à rendre, et rien ne justifie de lui inventer un message que
 * l'écran n'atteint jamais en usage normal — le point d'entrée n'est rendu qu'au
 * responsable de domaine, sur un produit archivé.
 */
export async function restoreProduct(productId: string): Promise<void> {
  const gate = await openProduct(productId);
  if ("message" in gate) return;

  await gate.session.db.restore(products, productId);

  revalidatePath(ROUTES.products);
  revalidatePath(ROUTES.product(productId));
}
