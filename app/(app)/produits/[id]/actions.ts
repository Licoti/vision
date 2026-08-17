"use server";

/**
 * Les écritures de la page **produit** — les indicateurs depuis T5.2, leurs
 * relevés depuis T5.3.
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
 * **Le droit d'un relevé est celui de son indicateur, par la même porte**
 * (T5.3) : un relevé appartient à un indicateur, qui appartient à un produit, et
 * inventer une troisième règle pour l'objet du bout de la chaîne serait le
 * troisième niveau de droit que D9 refuse. `openReading` remonte simplement la
 * chaîne — relevé, indicateur, produit — et s'arrête au même `openProductWrite`.
 *
 * **Aucun recalcul de `last_activity_at`** : ni un indicateur ni un relevé n'est
 * un fait d'accompagnement, et appeler `refreshLastActivity` ferait croire le
 * contraire à qui lit ce fichier — la leçon de T4.2. La revalidation s'en tient
 * à la page du produit : la liste des produits n'affiche aucun indicateur.
 *
 * Aucune écriture directe : tout passe par `session.db`, déjà scopé sur le
 * domaine courant et sur la personne courante — `domain_id` et `created_by` sont
 * posés par la couche, l'appelant n'y pense pas. Règle 1.
 *
 * **Aucune suppression, jamais** (règle 4) : la couche n'expose pas de `delete`,
 * et ce fichier ne lui en demande pas. Ce qui se retire s'archive.
 */

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/provider";
import type { Session } from "@/lib/auth/session";
import {
  indicatorReadings,
  indicators,
  products,
  projectIndicators,
  projects,
} from "@/lib/db/schema";
import { DomainScopeError, type Row } from "@/lib/db/scoped";
import {
  parseIndicatorForm,
  readIndicatorForm,
  type IndicatorFormState,
} from "@/lib/forms/indicator";
import {
  parseReadingForm,
  readReadingForm,
  type ReadingFormState,
} from "@/lib/forms/reading";
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

/** Le même refus, sur la saisie d'un relevé — jumeau explicite du précédent. */
function readingRefusal(
  formData: FormData,
  message: string,
): ReadingFormState {
  return { values: readReadingForm(formData), errors: {}, message };
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
 * Le relevé reçu, remonté jusqu'au produit reçu — la troisième porte, sur le
 * modèle exact des deux précédentes.
 *
 * **La chaîne se remonte, elle ne se raccourcit pas** : relevé → indicateur →
 * produit. Le droit d'écrire un relevé est celui de son indicateur, qui est
 * celui de son produit ; inventer une règle propre au relevé serait le troisième
 * niveau de droit que D9 refuse.
 *
 * Trois contrôles, et chacun ferme une porte :
 *
 * 1. `openProductWrite` sur le `productId` **reçu** — le droit dérivé,
 *    l'appartenance au domaine et la lecture seule d'un produit archivé ;
 * 2. le relevé reçu existe dans ce domaine et n'est pas déjà retiré ;
 * 3. son indicateur appartient **à ce produit** et n'est pas archivé. Sans ce
 *    dernier contrôle, une soumission forgée corrigerait ou retirerait le relevé
 *    d'un indicateur d'un autre produit — les identifiants liés étant sérialisés
 *    en clair dans un champ `$ACTION_…`.
 *
 * **L'ordre est celui d'`openIndicator`, et non celui de la chaîne de données** :
 * le droit d'abord, la ligne ensuite. Lire le relevé avant d'avoir interrogé le
 * droit n'aurait rien divulgué de plus que l'écran — la page produit est lisible
 * par tout le domaine (D9) —, mais l'ordre inverse est ce qui rend la porte
 * relisable : on ne cherche une ligne qu'après avoir établi qu'on a le droit d'y
 * toucher.
 *
 * Les trois refus se ressemblent volontairement : l'écran ne distingue pas le
 * relevé inconnu de celui d'un autre produit, pour la même raison que la page
 * produit rend 404 dans les deux cas.
 *
 * Le message n'est utilisé que par `updateReading` : `archiveReading` refuse en
 * silence, n'ayant aucune saisie à rendre.
 */
async function openReading(
  session: Session,
  productId: string,
  readingId: string,
  refused: string,
): Promise<
  | {
      indicator: Row<typeof indicators>;
      reading: Row<typeof indicatorReadings>;
    }
  | { message: string }
> {
  const gate = await openProductWrite(session, productId, refused);
  if ("message" in gate) return gate;

  const missing = { message: "Ce relevé n'existe plus sur ce produit." };

  const reading = await session.db.find(indicatorReadings, readingId);
  if (!reading || reading.archivedAt !== null) return missing;

  const indicator = await session.db.find(indicators, reading.indicatorId);
  if (
    !indicator ||
    indicator.productId !== productId ||
    indicator.archivedAt !== null
  ) {
    return missing;
  }

  return { indicator, reading };
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

/** Le même filet, sur la saisie d'un relevé — jumeau explicite du précédent. */
function readingScopeRefusal(
  error: unknown,
  formData: FormData,
): ReadingFormState {
  if (error instanceof DomainScopeError) {
    return readingRefusal(
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
 * **Le refus d'adoption, arrivé en T5.4** (arbitrage (e) de `tickets-C5.md`) :
 * un indicateur encore adopté par un accompagnement ne s'archive pas. C'est la
 * transposition exacte de l'arbitrage (e) de C4bis — ranger un objet dont les
 * liaisons vivent n'est pas ranger, c'est faire disparaître. `listProjectAdoptions`
 * écarte les adoptions dont l'indicateur est archivé : autoriser ce rangement
 * ferait donc sortir l'adoption du bloc de la page projet **sans que personne ne
 * l'ait retirée**, et sans qu'aucun écran ne puisse plus la défaire.
 *
 * **Aucune cascade** — arbitrage (f) : les adoptions ne sont pas retirées à la
 * place de qui range. Elles se retirent depuis la page de leur accompagnement,
 * une par une, et l'archivage redevient possible ensuite.
 *
 * **Le refus est muet, et l'écran dit combien avant le clic.** Ce geste n'a
 * aucune saisie à rendre, et son formulaire nu n'a nulle part où afficher un
 * message : c'est le bloc de la page produit qui remplace « Archiver » par une
 * mention nommant le nombre d'accompagnements — `adoptionCount`, lu par
 * `listProductIndicators`. Le point d'entrée disparaît donc **avant** que le
 * refus ne serve ; ce refus n'en est pas moins nécessaire, un point d'entrée
 * absent du rendu n'ayant jamais protégé le point d'entrée HTTP qui
 * l'accompagne.
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

  /* Le refus de l'arbitrage (e). `count` sur la table de liaison : elle n'a pas
     d'`archived_at`, donc toutes ses lignes sont vivantes — il n'y a pas
     d'adoption rangée qui cesserait de s'opposer au rangement. */
  const adopted = await session.db.count(projectIndicators, {
    where: eq(projectIndicators.indicatorId, indicatorId),
  });
  if (adopted > 0) return;

  await session.db.archive(indicators, indicatorId);

  revalidatePath(ROUTES.product(productId));
}

/**
 * Désigner la **North Star** d'un produit, ou n'en désigner aucune.
 *
 * Concept ajouté hors ticket le 17/08/2026, absent de `docs/02` et de `docs/04`.
 * Consigné dans `JOURNAL-TECHNIQUE.md`.
 *
 * **Un geste à part, et non un champ du formulaire d'indicateur.** Désigner une
 * North Star en éteint une autre : c'est une écriture sur **deux** lignes, que
 * le formulaire d'un seul indicateur ne saurait pas décrire. Une case à cocher
 * y aurait posé la question « et l'ancienne ? » sans y répondre — et l'index
 * unique partiel aurait répondu par une violation, donc un 500.
 *
 * **Éteindre d'abord, allumer ensuite**, et l'ordre n'est pas indifférent :
 * `indicators_north_star_unique` refuse deux North Star vivantes sur un produit,
 * et `neon-http` n'a pas de transaction interactive (dette consignée depuis
 * T3.6). L'ordre inverse lèverait la violation d'unicité une fois sur deux.
 * C'est le miroir de T3.6, qui ordonnait les ajouts **avant** les retraits pour
 * la raison symétrique : là c'est le retrait qui cassait, ici c'est l'ajout.
 *
 * La fenêtre qui s'ouvre entre les deux écritures laisse le produit **sans**
 * North Star, jamais avec deux : c'est l'état dégradé qu'on préfère — il est
 * lisible à l'écran, et le geste se rejoue.
 *
 * `indicatorId` à `null` retire la désignation sans en poser d'autre.
 */
export async function setNorthStar(
  productId: string,
  indicatorId: string | null,
): Promise<void> {
  const session = await requireSession();

  const refused =
    "La désignation de la North Star est réservée au responsable de domaine et aux contributeurs désignés d'un accompagnement de ce produit.";

  /* Le droit se redérive sur les identifiants **reçus**, jamais sur ce que
     l'écran affichait : un menu absent du rendu n'a jamais protégé un point
     d'entrée HTTP. Quand un indicateur est visé, `openIndicator` vérifie en
     outre qu'il appartient à ce produit et qu'il n'est pas archivé — sans quoi
     une soumission forgée désignerait l'indicateur d'un autre produit. */
  const gate = indicatorId
    ? await openIndicator(session, productId, indicatorId, refused)
    : await openProductWrite(session, productId, refused);
  if ("message" in gate) return;

  /* La North Star en place, s'il y en a une. `list` et non un `find` : c'est le
     produit qu'on interroge, pas une ligne connue — et `scoped.ts` n'a pas
     d'`updateMany` qui les éteindrait d'un geste. L'index garantit qu'il y en a
     au plus une, mais la boucle ne le suppose pas : elle éteint ce qu'elle
     trouve, ce qui rattraperait une base entrée en désordre avant l'index. */
  const current = await session.db.list(indicators, {
    where: and(
      eq(indicators.productId, productId),
      eq(indicators.isNorthStar, true),
    ),
  });

  /* Le `continue` est une **économie d'écriture, pas une garantie** : sans lui,
     redésigner la North Star en place l'éteindrait puis la rallumerait, et
     l'état final serait le même. La mise en défaut du 17/08/2026 l'a montré —
     le retirer ne fait tomber aucun test, et c'est exact. Consigné. */
  for (const previous of current) {
    if (previous.id === indicatorId) continue;
    await session.db.update(indicators, previous.id, { isNorthStar: false });
  }

  if (indicatorId) {
    await session.db.update(indicators, indicatorId, { isNorthStar: true });
  }

  revalidatePath(ROUTES.product(productId));
}

/* ==========================================================================
   Les relevés — T5.3

   Les trois mêmes gestes, un cran plus bas dans la hiérarchie, et **aucune
   règle de droit neuve** : `openIndicator` pour la saisie, `openReading` pour
   les deux autres, et les deux s'arrêtent au même `openProductWrite`.

   **Aucun recalcul de `last_activity_at`**, comme pour les indicateurs : un
   relevé n'est pas un fait d'accompagnement. La fiche l'interdit en toutes
   lettres, et la raison est la leçon de T4.2 — appeler `refresh()` ferait croire
   le contraire à qui lit le fichier.
   ========================================================================== */

/**
 * Saisir un relevé sur un indicateur.
 *
 * `productId` et `indicatorId` sont liés côté serveur — ce ne sont pas des
 * secrets pour autant : Next les sérialise en clair dans un champ `$ACTION_…`,
 * et une soumission peut les réécrire. Ce qui protège est `openIndicator`, qui
 * dérive le droit du produit **reçu** puis rapproche l'indicateur **reçu** de ce
 * produit.
 *
 * **`read_on` n'a pas de valeur par défaut, et ce n'est pas un oubli** : ni ici,
 * ni dans le formulaire, ni dans le panneau. Un relevé sans date est refusé par
 * `parseReadingForm` plutôt que daté d'office — `docs/03` §7 refuse qu'une mesure
 * soit « positionnée arbitrairement à aujourd'hui », et une valeur par défaut est
 * exactement la façon dont cela arriverait sans que personne ne l'ait décidé.
 */
export async function createReading(
  productId: string,
  indicatorId: string,
  _previous: ReadingFormState,
  formData: FormData,
): Promise<ReadingFormState> {
  const session = await requireSession();

  const gate = await openIndicator(
    session,
    productId,
    indicatorId,
    "La saisie d'un relevé est réservée au responsable de domaine et aux contributeurs désignés d'un accompagnement de ce produit.",
  );
  if ("message" in gate) return readingRefusal(formData, gate.message);

  const { values, errors, input } = parseReadingForm(formData);
  if (!input) return { values, errors };

  try {
    await session.db.insert(indicatorReadings, { indicatorId, ...input });
  } catch (error) {
    return readingScopeRefusal(error, formData);
  }

  revalidatePath(ROUTES.product(productId));

  // La page nue, panneau refermé : le relevé paraît en tête de sa série et
  // devient le « dernier relevé » du bloc, et c'est toute la confirmation
  // (`docs/06` §9). `redirect` lève : elle est appelée hors de tout `try`, faute
  // de quoi le `catch` ci-dessus avalerait la navigation.
  redirect(ROUTES.product(productId));
}

/**
 * Corriger un relevé déjà saisi : **le même formulaire, la même validation, les
 * mêmes refus** qu'à la saisie — la propriété qui fait qu'un seul panneau sert
 * les deux gestes, posée en T3.4 et tenue depuis.
 *
 * **L'indicateur ne se corrige pas ici** : `indicator_readings.indicator_id`
 * n'est pas un champ du formulaire et ne le devient pas. Déplacer un relevé d'un
 * indicateur à l'autre serait un geste que la fiche ne demande pas — et deux
 * indicateurs ne mesurent pas la même chose, ni forcément dans la même unité.
 *
 * **La date, elle, se corrige** : c'est même le cas que la fiche demande
 * d'éprouver à l'écran, le relevé changeant alors de place dans sa série sans
 * qu'aucun tri ne soit rejoué à la main — l'ordre vit dans la lecture.
 */
export async function updateReading(
  productId: string,
  readingId: string,
  _previous: ReadingFormState,
  formData: FormData,
): Promise<ReadingFormState> {
  const session = await requireSession();

  const gate = await openReading(
    session,
    productId,
    readingId,
    "La modification d'un relevé est réservée au responsable de domaine et aux contributeurs désignés d'un accompagnement de ce produit.",
  );
  if ("message" in gate) return readingRefusal(formData, gate.message);

  const { values, errors, input } = parseReadingForm(formData);
  if (!input) return { values, errors };

  try {
    const updated = await session.db.update(
      indicatorReadings,
      readingId,
      input,
    );
    if (!updated) {
      return readingRefusal(formData, "Ce relevé n'existe plus sur ce produit.");
    }
  } catch (error) {
    return readingScopeRefusal(error, formData);
  }

  revalidatePath(ROUTES.product(productId));

  // La page nue, panneau refermé : la série se réordonne d'elle-même, et c'est
  // toute la confirmation (`docs/06` §9). `redirect` lève, donc hors du `try`.
  redirect(ROUTES.product(productId));
}

/**
 * Retirer un relevé : il quitte la série, rien n'est supprimé (règle 4).
 *
 * **C'est le geste que la migration de ce ticket autorise.** Sans `archived_at`
 * sur `indicator_readings`, retirer un relevé saisi en double n'avait que la
 * suppression pour chemin — et la couche d'accès n'expose pas de `delete`. La
 * colonne existe désormais, et `archive` la couvre sans qu'une ligne de
 * `lib/db/scoped.ts` ait changé : `hasArchivedAt` introspecte le schéma.
 *
 * **Sans confirmation** — arbitrage (c) de `tickets-C4bis.md` : elle se justifie
 * là où le geste retire de la lecture tout un ensemble. Un relevé se retape, et
 * `docs/06` §9 proscrit la confirmation partout où elle ne protège rien.
 *
 * **Aucun rétablissement** — arbitrage (b) de `tickets-C4bis.md` : le
 * rétablissement existe pour les deux objets qui ont une page, et un relevé n'en
 * a pas. Il se retape, comme l'activité, la ressource et le résultat.
 *
 * **Le refus est muet**, comme `archiveIndicator`, `archiveResource` et
 * `archiveResult` : ce geste n'a aucune saisie à rendre, et rien ne justifie de
 * lui inventer un message que l'écran n'atteint jamais en usage normal — le point
 * d'entrée n'est rendu qu'à qui peut écrire, sur un relevé vivant de ce produit.
 */
export async function archiveReading(
  productId: string,
  readingId: string,
): Promise<void> {
  const session = await requireSession();

  const gate = await openReading(
    session,
    productId,
    readingId,
    // Jamais rendu : ce geste n'affiche aucun refus.
    "Le retrait d'un relevé est réservé au responsable de domaine et aux contributeurs désignés d'un accompagnement de ce produit.",
  );
  if ("message" in gate) return;

  await session.db.archive(indicatorReadings, readingId);

  revalidatePath(ROUTES.product(productId));
}
