"use server";

/**
 * Les écritures de l'écran Produits — les premières de Vision.
 *
 * F1-D1 et D9 : **créer et modifier un produit est réservé au responsable de
 * domaine.** Les deux formulaires sont déjà en 404 pour qui n'a pas ce droit ;
 * la garde qui compte est celle qui est ici. Une action serveur est un point
 * d'entrée HTTP à part entière — un bouton masqué n'est pas un droit, et une
 * route interdite ne protège pas l'action qu'elle affichait.
 *
 * Aucune écriture directe : tout passe par `session.db`, déjà scopé sur le
 * domaine courant et sur la personne courante — `domain_id` et `created_by`
 * sont posés par la couche, l'appelant n'a pas à y penser. Règle 1.
 *
 * Ce que ces actions ne font pas : archiver. Hors du périmètre de T2.5.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/provider";
import { products } from "@/lib/db/schema";
import { DomainScopeError } from "@/lib/db/scoped";
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
 * touché — celui qu'on vient de créer, ou celui qu'on vient de modifier.
 */
async function submit(
  formData: FormData,
  write: (
    session: Awaited<ReturnType<typeof requireSession>>,
    input: ProductInput,
  ) => Promise<string | undefined>,
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
    const productId = await write(session, input);
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
    // `input` ne porte que les quatre colonnes du ticket : `update` refuse
    // `id` et `archivedAt`, et rien d'autre ne peut s'y glisser depuis le
    // formulaire — `readProductForm` ne lit que ce qu'il connaît.
    const updated = await session.db.update(products, id, input);
    return updated?.id;
  });

  if ("state" in outcome) return outcome.state;
  goToProduct(outcome.productId);
}
