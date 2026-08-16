"use server";

/**
 * Les écritures de la page **produit** — les indicateurs, depuis T5.2.
 *
 * C'est le premier fichier d'actions attaché à la page d'un produit :
 * `produits/actions.ts` porte les écritures de l'**identité** du produit, qui
 * exigent `manageDomain` (F1-D1, D9) ; celles-ci portent ce que le produit
 * **mesure**, et le droit n'est pas le même. La séparation est celle de
 * `projets/actions.ts` et `projets/[id]/actions.ts` depuis T3.3.
 *
 * **Le droit d'écrire un indicateur se dérive des accompagnements du produit**
 * (arbitrage (b) de `tickets-C5.md`) : `manageDomain`, ou contributeur désigné
 * d'au moins un accompagnement de ce produit. C'est la lettre de D23 — « les
 * contributeurs du projet saisissent les indicateurs » — sur un objet qui, lui,
 * appartient au produit (D1, D11). Ni troisième niveau de droit, ni exception :
 * D9 en pose deux, et ce chantier n'en invente pas un.
 *
 * **Aucune requête neuve pour ce droit.** La page produit lit déjà ses
 * accompagnements (`listProductProjects`) et interroge `session.can.writeProject`
 * sur chacun ; l'action, elle, relit les accompagnements **vivants** du produit
 * reçu par une lecture scopée ordinaire — `list` écarte les archivés d'elle-même,
 * si bien que l'écran et l'action répondent exactement à la même question.
 *
 * **Le droit se vérifie ici, et pas à l'écran.** Le panneau n'apparaît qu'à qui
 * peut écrire, mais une action serveur est un point d'entrée HTTP à part
 * entière : ses champs se récoltent sur la page servie à quelqu'un d'autre et se
 * repostent sous un autre cookie. Un bouton masqué n'est pas un droit.
 *
 * **Le produit est lié côté serveur** — `createIndicator.bind(null, product.id)`,
 * et l'indicateur en plus en correction. Ce ne sont pas des champs du
 * formulaire, mais **ce ne sont pas non plus des secrets** : Next sérialise les
 * arguments liés dans un champ `$ACTION_…` du balisage, en clair en
 * développement, et une requête soumise peut donc les réécrire. La liaison range
 * les identifiants hors de la saisie ; elle ne les protège pas. Ce qui protège
 * est `openProductWrite`, interrogé sur le `productId` **reçu**, quel qu'il soit.
 *
 * **Un produit archivé ne reçoit plus de saisie** (arbitrage du 16/08/2026,
 * tranché avant écriture) : la fiche T5.2 ne le disait pas, et c'est la
 * transposition exacte de T4bis.2 — `updateProduct` refuse déjà le produit
 * archivé reçu — et de T4bis.3, où un accompagnement archivé est en lecture
 * seule, strictement. Sans elle, le responsable de domaine écrirait des
 * indicateurs sur un produit rangé, que plus aucune liste n'affiche.
 *
 * **L'ordre de la porte est l'inverse de celui d'`openProduct`**, et la raison
 * est dans le droit lui-même : `manageDomain` ne dépend d'aucun identifiant et
 * s'énonce donc avant toute lecture, là où un droit **dérivé des
 * accompagnements du produit** ne s'énonce pas avant de connaître le produit. La
 * porte lit donc le produit, puis son archivage, puis le droit. Elle ne divulgue
 * rien de plus que l'écran : la page produit est lisible par tout le domaine
 * (D9).
 *
 * **Aucun recalcul de `last_activity_at`** : un indicateur n'est pas un fait
 * d'accompagnement, et appeler `refreshLastActivity` ferait croire le contraire
 * à qui lit ce fichier — la leçon de T4.2. La revalidation s'en tient à la page
 * du produit : la liste des produits n'affiche aucun indicateur.
 *
 * Aucune écriture directe : tout passe par `session.db`, déjà scopé sur le
 * domaine courant et sur la personne courante — `domain_id` et `created_by` sont
 * posés par la couche, l'appelant n'y pense pas. Règle 1.
 *
 * **Aucune suppression, jamais** (règle 4) : la couche n'expose pas de `delete`,
 * et ce fichier ne lui en demande pas. Ce qui se retire s'archive.
 */

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/provider";
import type { Session } from "@/lib/auth/session";
import { indicators, products, projects } from "@/lib/db/schema";
import { DomainScopeError, type Row } from "@/lib/db/scoped";
import {
  parseIndicatorForm,
  readIndicatorForm,
  type IndicatorFormState,
} from "@/lib/forms/indicator";
import { ROUTES } from "@/lib/navigation";

/**
 * Un refus qui n'appartient à aucun champ — un droit, une ligne disparue.
 *
 * La saisie revient telle quelle : Vision ne jette jamais en silence ce qui a
 * été tapé, y compris quand ce qu'elle refuse n'est pas la saisie.
 */
function refusal(formData: FormData, message: string): IndicatorFormState {
  return { values: readIndicatorForm(formData), errors: {}, message };
}

/* ==========================================================================
   Vérifier avant d'écrire
   ========================================================================== */

/**
 * Le produit **reçu**, son archivage, puis le droit — dans cet ordre, et avant
 * toute lecture du formulaire.
 *
 * Le droit dérivé (arbitrage (b)) se lit sur les accompagnements **vivants** du
 * produit : `list` écarte les archivés d'elle-même, et ce sont exactement ceux
 * que la page affiche. Le responsable de domaine, lui, n'a pas besoin de cette
 * lecture — la condition est court-circuitée, et la requête n'a pas lieu.
 *
 * `refused` dit **quel geste** est réservé. Le refus du produit archivé, lui,
 * n'est pas paramétrable, et c'est voulu : ce n'est pas le geste qui est
 * réservé, c'est le produit qui est rangé. Trois gestes, un seul message.
 */
async function openProductWrite(
  session: Session,
  productId: string,
  refused: string,
): Promise<{ product: Row<typeof products> } | { message: string }> {
  const product = await session.db.find(products, productId);
  if (!product) {
    return { message: "Ce produit n'existe plus dans ce domaine." };
  }

  /* La lecture seule d'un produit archivé — la transposition de T4bis.2 et de
     T4bis.3. `find` rend les lignes archivées, délibérément : une donnée
     archivée reste lisible. C'est ici qu'on en tire les conséquences. */
  if (product.archivedAt !== null) {
    return {
      message:
        "Ce produit est archivé : il ne reçoit plus de saisie. Rétablissez-le d'abord.",
    };
  }

  if (!session.can.manageDomain) {
    const accompaniments = await session.db.list(projects, {
      where: eq(projects.productId, productId),
    });
    const contributes = accompaniments.some((accompaniment) =>
      session.can.writeProject(accompaniment.id),
    );
    if (!contributes) return { message: refused };
  }

  return { product };
}

/**
 * L'indicateur reçu, rapproché du produit reçu — la seconde porte, sur le
 * modèle d'`openResource` (T4bis.5).
 *
 * Deux contrôles, et chacun ferme une porte :
 *
 * 1. `openProductWrite` sur le `productId` **reçu** — le droit dérivé,
 *    l'appartenance au domaine et la lecture seule d'un produit archivé, d'un
 *    seul appel ;
 * 2. l'indicateur reçu **appartient à ce produit** et n'est pas déjà archivé.
 *    Sans ce second contrôle, une soumission forgée corrigerait ou rangerait
 *    l'indicateur d'un autre produit — D11 pose qu'un indicateur appartient à un
 *    seul —, les identifiants liés étant sérialisés en clair dans un champ
 *    `$ACTION_…`.
 *
 * Les deux refus se ressemblent volontairement : l'écran ne distingue pas
 * l'indicateur inconnu de celui d'un autre domaine, pour la même raison que la
 * page produit rend 404 dans les deux cas.
 *
 * Le message n'est utilisé que par `updateIndicator` : `archiveIndicator` refuse
 * en silence, n'ayant aucune saisie à rendre.
 */
async function openIndicator(
  session: Session,
  productId: string,
  indicatorId: string,
  refused: string,
): Promise<
  | { product: Row<typeof products>; indicator: Row<typeof indicators> }
  | { message: string }
> {
  const gate = await openProductWrite(session, productId, refused);
  if ("message" in gate) return gate;

  const indicator = await session.db.find(indicators, indicatorId);
  if (
    !indicator ||
    indicator.productId !== productId ||
    indicator.archivedAt !== null
  ) {
    return { message: "Cet indicateur n'existe plus sur ce produit." };
  }

  return { product: gate.product, indicator };
}

/**
 * Le second filet : une référence a franchi la vérification et la couche l'a
 * refusée. L'écran le dit plutôt que de rendre une page en erreur.
 */
function scopeRefusal(error: unknown, formData: FormData): IndicatorFormState {
  if (error instanceof DomainScopeError) {
    return refusal(
      formData,
      "Une référence de ce formulaire n'appartient pas au domaine : la saisie n'a pas été enregistrée.",
    );
  }
  throw error;
}

/* ==========================================================================
   Créer
   ========================================================================== */

/**
 * Saisir un indicateur sur un produit.
 *
 * **Un seul lieu de création, et c'est ici** (arbitrage (c) de
 * `tickets-C5.md`) : le panneau d'adoption de T5.4 ne proposera que les
 * indicateurs déjà portés par le produit, et renverra vers cette page quand il
 * n'y en aura aucun.
 *
 * `productId` est lié côté serveur ; `previous` est l'état que `useActionState`
 * fait circuler, dont l'action n'a pas besoin — la saisie repart du `FormData` à
 * chaque soumission.
 */
export async function createIndicator(
  productId: string,
  _previous: IndicatorFormState,
  formData: FormData,
): Promise<IndicatorFormState> {
  const session = await requireSession();

  const gate = await openProductWrite(
    session,
    productId,
    "La saisie d'un indicateur est réservée au responsable de domaine et aux contributeurs désignés d'un accompagnement de ce produit.",
  );
  if ("message" in gate) return refusal(formData, gate.message);

  const { values, errors, input } = parseIndicatorForm(formData);
  if (!input) return { values, errors };

  try {
    await session.db.insert(indicators, { productId, ...input });
  } catch (error) {
    return scopeRefusal(error, formData);
  }

  /* **Cette page-là, et elle seule.** La liste des produits n'affiche aucun
     indicateur, et la page projet n'en affichera qu'en T5.4, par l'adoption.
     Revalider davantage ferait croire à qui lit ce fichier qu'un indicateur
     touche à la fraîcheur d'un produit — la leçon de T4.2. */
  revalidatePath(ROUTES.product(productId));

  // La page nue, panneau refermé : « enregistrement sans confirmation
  // intermédiaire » (`docs/06` §9). L'indicateur paraît dans le bloc de T5.1, à
  // sa place alphabétique, et c'est toute la confirmation. `redirect` lève :
  // elle est appelée hors de tout `try`, faute de quoi le `catch` ci-dessus
  // avalerait la navigation.
  redirect(ROUTES.product(productId));
}

/* ==========================================================================
   Corriger
   ========================================================================== */

/**
 * Corriger un indicateur déjà saisi : **le même formulaire, la même validation,
 * les mêmes refus** qu'à la création — la propriété qui fait qu'un seul panneau
 * sert les deux gestes, posée en T3.4 et tenue depuis.
 *
 * `productId` et `indicatorId` sont liés côté serveur. **Ce ne sont pas des
 * secrets** : Next les sérialise en clair dans un champ `$ACTION_…`, et une
 * soumission peut les réécrire. Ce qui protège est `openIndicator`, qui
 * interroge le droit sur le produit **reçu** puis rapproche l'indicateur
 * **reçu** de ce produit.
 *
 * **Le produit ne se corrige pas ici** : `indicators.product_id` n'est pas un
 * champ du formulaire et ne le devient pas. Déplacer un indicateur d'un produit
 * à l'autre serait un geste que la fiche ne demande pas — et D11 pose qu'un
 * indicateur appartient à un seul produit.
 *
 * **Aucun contrôle d'idempotence** à la `activityRowUnchanged` de T3.4 : il
 * existe là-bas pour ne pas repousser une fraîcheur ni écrire au journal de C6
 * une modification qui n'en est pas une. Ici `last_activity_at` n'est pas en
 * jeu — corriger un indicateur n'est pas écrire une activité — et l'inventer
 * sortirait du périmètre du ticket (règle 3).
 */
export async function updateIndicator(
  productId: string,
  indicatorId: string,
  _previous: IndicatorFormState,
  formData: FormData,
): Promise<IndicatorFormState> {
  const session = await requireSession();

  const gate = await openIndicator(
    session,
    productId,
    indicatorId,
    "La modification d'un indicateur est réservée au responsable de domaine et aux contributeurs désignés d'un accompagnement de ce produit.",
  );
  if ("message" in gate) return refusal(formData, gate.message);

  const { values, errors, input } = parseIndicatorForm(formData);
  if (!input) return { values, errors };

  try {
    const updated = await session.db.update(indicators, indicatorId, input);
    if (!updated) {
      return refusal(formData, "Cet indicateur n'existe plus sur ce produit.");
    }
  } catch (error) {
    return scopeRefusal(error, formData);
  }

  revalidatePath(ROUTES.product(productId));

  // La page nue, panneau refermé : le libellé corrigé paraît dans le bloc, et
  // c'est toute la confirmation (`docs/06` §9). `redirect` lève, donc hors du
  // `try`.
  redirect(ROUTES.product(productId));
}

/* ==========================================================================
   Archiver
   ========================================================================== */

/**
 * Ranger un indicateur : il quitte le bloc, rien n'est supprimé (règle 4).
 *
 * **Sans confirmation** — arbitrage (c) de `tickets-C4bis.md` : elle se justifie
 * là où le geste retire de la lecture tout un ensemble, un produit et ses
 * accompagnements, un accompagnement et sa roadmap. Un indicateur sans relevé se
 * retape, et `docs/06` §9 proscrit la confirmation partout où elle ne protège
 * rien.
 *
 * **Aucun rétablissement** — arbitrage (b) de `tickets-C4bis.md` : le
 * rétablissement existe pour les deux objets qui ont une page, et un indicateur
 * n'en a pas.
 *
 * **Aucun refus d'adoption ici** — arbitrage (e) de `tickets-C5.md` : un
 * indicateur encore adopté par un accompagnement ne s'archivera pas, et le refus
 * dira combien, mais il appartient à **T5.4**, qui crée les adoptions. T5.2 n'a
 * rien à refuser : aucune adoption n'existe encore par l'interface.
 *
 * **Le refus est muet**, comme `archiveResource` et `archiveResult` : ce geste
 * n'a aucune saisie à rendre, et rien ne justifie de lui inventer un message que
 * l'écran n'atteint jamais en usage normal — le point d'entrée n'est rendu qu'à
 * qui peut écrire, sur un indicateur vivant de ce produit.
 */
export async function archiveIndicator(
  productId: string,
  indicatorId: string,
): Promise<void> {
  const session = await requireSession();

  const gate = await openIndicator(
    session,
    productId,
    indicatorId,
    // Jamais rendu : ce geste n'affiche aucun refus.
    "Le rangement d'un indicateur est réservé au responsable de domaine et aux contributeurs désignés d'un accompagnement de ce produit.",
  );
  if ("message" in gate) return;

  await session.db.archive(indicators, indicatorId);

  revalidatePath(ROUTES.product(productId));
}
