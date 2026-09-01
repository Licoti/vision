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
 *
 * **Trois écritures laissent une trace depuis T6.2, et trois seulement** : les
 * relevés. Ce sont les seuls événements du produit — `project_id` nul,
 * `product_id` posé, le cas que `docs/04` §4 prévoit par « nul pour les
 * événements de niveau produit ».
 *
 * **Les cinq autres objets de ce fichier n'en laissent aucune**, et ce n'est pas
 * un oubli : l'indicateur, la North Star, le persona, ses traits et le use case
 * ne sont pas dans les six `event_target_type` (arbitrage (b) de
 * `tickets-C6.md`). Le journal est la trace des objets de l'**accompagnement**,
 * pas du référentiel ni de la définition d'un produit. Point ouvert pour C7 —
 * pas un manque de ce chantier, et surtout pas quelque chose qu'un ticket
 * voisin ajoute « pendant qu'il y est » (règle 3).
 */

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/provider";
import type { Session } from "@/lib/auth/session";
import {
  contextMarkers,
  indicatorReadings,
  indicators,
  personaTraits,
  personas,
  productTrackings,
  products,
  projectIndicators,
  projects,
  taggingPlans,
  useCasePersonas,
  useCases,
} from "@/lib/db/schema";
import { DomainScopeError, type Row } from "@/lib/db/scoped";
import {
  parseContextMarkerForm,
  readContextMarkerForm,
  type ContextMarkerFormState,
} from "@/lib/forms/context-marker";
import {
  parseIndicatorForm,
  readIndicatorForm,
  type IndicatorFormState,
} from "@/lib/forms/indicator";
import {
  parsePersonaForm,
  readPersonaForm,
  type PersonaFormState,
  type PersonaTraitInput,
} from "@/lib/forms/persona";
import {
  parseReadingForm,
  readReadingForm,
  type ReadingFormState,
} from "@/lib/forms/reading";
import {
  parseTaggingPlanForm,
  readTaggingPlanForm,
  type TaggingPlanFormState,
} from "@/lib/forms/tagging-plan";
import {
  parseTrackingForm,
  readTrackingForm,
  type TrackingFormState,
} from "@/lib/forms/tracking";
import {
  parseUseCaseForm,
  readUseCaseForm,
  type UseCaseFormState,
} from "@/lib/forms/use-case";
import { objectPhrase } from "@/lib/journal";
import { ROUTES } from "@/lib/navigation";
import { findProductTaggingPlan } from "@/lib/queries/measurement";
import { listProductPersonas } from "@/lib/queries/personas";

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

  /* **Le panneau se referme sur ce succès, et non plus sur une navigation**
     (TD.2). `redirect` était la fermeture ; elle ne peut plus l'être sans
     re-rendre la page que le panneau n'a justement plus à quitter.
     `revalidatePath` reste, et la réponse de l'action porte l'arbre
     réactualisé : ce qui a été écrit paraît dans son bloc, et c'est toute la
     confirmation (`docs/06` §9). */
  return { values, errors: {}, ok: true };
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

  /* **Le panneau se referme sur ce succès, et non plus sur une navigation**
     (TD.2). `redirect` était la fermeture ; elle ne peut plus l'être sans
     re-rendre la page que le panneau n'a justement plus à quitter.
     `revalidatePath` reste, et la réponse de l'action porte l'arbre
     réactualisé : ce qui a été écrit paraît dans son bloc, et c'est toute la
     confirmation (`docs/06` §9). */
  return { values, errors: {}, ok: true };
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
    const created = await session.db.insert(indicatorReadings, {
      indicatorId,
      ...input,
    });

    /* **`project_id` est nul, `product_id` est posé** — le cas que `docs/04` §4
       prévoit par « nul pour les événements de niveau produit », et le seul du
       produit qui l'atteigne. Un relevé ne vit sur aucun accompagnement : lui en
       attribuer un serait choisir arbitrairement parmi ceux du produit.

       **La conséquence se lit d'avance et elle est voulue** : un relevé
       n'apparaît pas dans la frise de la page projet (T6.3), il apparaît dans
       le flux global (T6.6), qui nomme le produit quand `project_id` manque.

       La phrase nomme l'**indicateur** : un relevé n'a pas de nom propre, et
       « Relevé créé : 62 » ne désignerait rien. La porte le rend déjà — aucune
       lecture n'est ajoutée. */
    await session.db.record({
      productId,
      verb: "created",
      targetType: "indicator_reading",
      targetId: created.id,
      summary: objectPhrase("indicator_reading", "created", gate.indicator.label),
    });
  } catch (error) {
    return readingScopeRefusal(error, formData);
  }

  revalidatePath(ROUTES.product(productId));

  /* **Le panneau se referme sur ce succès, et non plus sur une navigation**
     (TD.2). `redirect` était la fermeture ; elle ne peut plus l'être sans
     re-rendre la page que le panneau n'a justement plus à quitter.
     `revalidatePath` reste, et la réponse de l'action porte l'arbre
     réactualisé : ce qui a été écrit paraît dans son bloc, et c'est toute la
     confirmation (`docs/06` §9). */
  return { values, errors: {}, ok: true };
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

    /* Le libellé figé est celui de l'indicateur, **pas** la valeur ni la date :
       ce que la phrase désigne est ce qui a été touché, et une valeur écrite là
       serait la « valeur après » que D22 refuse.

       Le nom de l'indicateur ne se corrige pas ici (`indicator_id` n'est pas un
       champ du formulaire) : la désignation d'avant et celle d'après sont la
       même, et la question du nom figé ne se pose pas comme sur la ressource. */
    await session.db.record({
      productId,
      verb: "updated",
      targetType: "indicator_reading",
      targetId: readingId,
      summary: objectPhrase("indicator_reading", "updated", gate.indicator.label),
    });
  } catch (error) {
    return readingScopeRefusal(error, formData);
  }

  revalidatePath(ROUTES.product(productId));

  /* **Le panneau se referme sur ce succès, et non plus sur une navigation**
     (TD.2). `redirect` était la fermeture ; elle ne peut plus l'être sans
     re-rendre la page que le panneau n'a justement plus à quitter.
     `revalidatePath` reste, et la réponse de l'action porte l'arbre
     réactualisé : ce qui a été écrit paraît dans son bloc, et c'est toute la
     confirmation (`docs/06` §9). */
  return { values, errors: {}, ok: true };
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

  /* `openReading` refuse d'entrée un relevé déjà archivé : aucune garde
     d'idempotence à ajouter. */
  await session.db.record({
    productId,
    verb: "archived",
    targetType: "indicator_reading",
    targetId: readingId,
    summary: objectPhrase("indicator_reading", "archived", gate.indicator.label),
  });

  revalidatePath(ROUTES.product(productId));
}

/* ==========================================================================
   Les personae — 18/08/2026

   **Le même droit que les indicateurs**, et par la même porte : `manageDomain`,
   ou contributeur désigné d'au moins un accompagnement vivant du produit
   (arbitrage (b) de `tickets-C5.md`). Un persona sort du travail
   d'accompagnement — une campagne de tests, des entretiens — et lui inventer un
   troisième niveau de droit serait ce que D9 refuse.

   C'est ce qui distingue ces trois actions de `updateProductVision`, qui vit
   dans `app/(app)/produits/actions.ts` sous `manageDomain` seul : la vision est
   une **colonne de `products`**, les personae sont **leurs propres tables**.
   C'est la table écrite qui décide du fichier, pas l'écran d'où part le geste.

   **Deux tables par geste**, et c'est leur seule singularité : une ligne de
   `personas`, et la liste de ses traits. `syncTraits` fait le second temps.
   ========================================================================== */

/** Un refus qui n'appartient à aucun champ, sur la saisie d'un persona. */
function personaRefusal(formData: FormData, message: string): PersonaFormState {
  return { values: readPersonaForm(formData), errors: {}, message };
}

/** Le même filet de dernier recours, sur la saisie d'un persona. */
function personaScopeRefusal(
  error: unknown,
  formData: FormData,
): PersonaFormState {
  if (error instanceof DomainScopeError) {
    return personaRefusal(
      formData,
      "Une référence de ce formulaire n'appartient pas au domaine : la saisie n'a pas été enregistrée.",
    );
  }
  throw error;
}

/**
 * Le persona reçu, rapproché du produit reçu — la quatrième porte, sur le modèle
 * exact d'`openIndicator`.
 *
 * Deux contrôles, et chacun ferme une porte :
 *
 * 1. `openProductWrite` sur le `productId` **reçu** — le droit dérivé,
 *    l'appartenance au domaine et la lecture seule d'un produit archivé, d'un
 *    seul appel ;
 * 2. le persona reçu **appartient à ce produit** et n'est pas déjà archivé.
 *    Sans ce second contrôle, une soumission forgée corrigerait ou rangerait le
 *    persona d'un autre produit, les identifiants liés étant sérialisés en clair
 *    dans un champ `$ACTION_…`.
 *
 * Les deux refus se ressemblent volontairement : l'écran ne distingue pas le
 * persona inconnu de celui d'un autre domaine, pour la même raison que la page
 * produit rend 404 dans les deux cas.
 *
 * Le message n'est utilisé que par `updatePersona` : `archivePersona` refuse en
 * silence, n'ayant aucune saisie à rendre.
 */
async function openPersona(
  session: Session,
  productId: string,
  personaId: string,
  refused: string,
): Promise<{ persona: Row<typeof personas> } | { message: string }> {
  const gate = await openProductWrite(session, productId, refused);
  if ("message" in gate) return gate;

  const persona = await session.db.find(personas, personaId);
  if (
    !persona ||
    persona.productId !== productId ||
    persona.archivedAt !== null
  ) {
    return { message: "Ce persona n'existe plus sur ce produit." };
  }

  return { persona };
}

/**
 * Le second temps de l'écriture : les traits du persona, mis à jour **par
 * différence**.
 *
 * C'est `syncJobs` (`app/(app)/projets/actions.ts`) transposé, et le choix du
 * diff plutôt que du remplacement n'est pas une économie de requêtes : c'est ce
 * qui garde l'**identifiant d'un trait stable** d'une correction à l'autre. Un
 * remplacement récrirait des lignes neuves à chaque enregistrement, et le jour
 * où un use case désignera « l'irritant qu'il adresse », il désignerait une
 * ligne effacée par la correction suivante. Le rapprochement se fait donc sur
 * `(kind, label)` — ce qu'une personne reconnaît comme « le même irritant ».
 *
 * **Les ajouts avant les retraits** (T3.6) : `neon-http` n'a pas de transaction
 * interactive, et un échec au milieu doit laisser trop de traits plutôt que pas
 * assez. Le rang se met à jour entre les deux, sur les lignes qui survivent.
 *
 * `unlink` est une vraie suppression, et le typage la réserve aux tables sans
 * `archived_at` : `persona_traits` en est une, délibérément (voir le schéma).
 * Retirer une ligne d'une zone de texte n'est pas l'archivage que la règle 4
 * proscrit — c'est la correction d'un champ, comme vider la vision d'un produit.
 */
async function syncTraits(
  session: Session,
  personaId: string,
  wanted: readonly PersonaTraitInput[],
): Promise<void> {
  const current = await session.db.list(personaTraits, {
    where: eq(personaTraits.personaId, personaId),
  });

  /* La clé du rapprochement : la famille et le libellé. `parsePersonaForm`
     déduplique déjà à la saisie, si bien qu'une clé ne désigne qu'une ligne. */
  const keyOf = (trait: { kind: string; label: string }): string =>
    `${trait.kind} ${trait.label}`;

  const held = new Map(current.map((row) => [keyOf(row), row]));

  const added = wanted.filter((trait) => !held.has(keyOf(trait)));
  if (added.length > 0) {
    await session.db.insertMany(
      personaTraits,
      added.map((trait) => ({
        personaId,
        kind: trait.kind,
        label: trait.label,
        position: trait.position,
      })),
    );
  }

  for (const trait of wanted) {
    const row = held.get(keyOf(trait));
    if (row && row.position !== trait.position) {
      await session.db.update(personaTraits, row.id, {
        position: trait.position,
      });
    }
  }

  const target = new Set(wanted.map(keyOf));
  for (const row of current) {
    if (!target.has(keyOf(row))) {
      await session.db.unlink(personaTraits, row.id);
    }
  }
}

/**
 * Saisir un persona sur un produit.
 *
 * `productId` est lié côté serveur ; `previous` est l'état que `useActionState`
 * fait circuler, dont l'action n'a pas besoin — la saisie repart du `FormData` à
 * chaque soumission.
 *
 * **La création n'est pas atomique, et ne peut pas l'être** : `neon-http` n'a
 * pas de transaction interactive. Un persona dont les traits échoueraient
 * resterait sans traits — soit exactement l'état d'un persona qu'on vient de
 * créer sans en saisir, donc un état que l'écran sait rendre, et que la
 * correction répare. C'est la dette déjà consignée pour la création d'un projet.
 */
export async function createPersona(
  productId: string,
  _previous: PersonaFormState,
  formData: FormData,
): Promise<PersonaFormState> {
  const session = await requireSession();

  const gate = await openProductWrite(
    session,
    productId,
    "La saisie d'un persona est réservée au responsable de domaine et aux contributeurs désignés d'un accompagnement de ce produit.",
  );
  if ("message" in gate) return personaRefusal(formData, gate.message);

  const { values, errors, input } = parsePersonaForm(formData);
  if (!input) return { values, errors };

  try {
    /* Un objet littéral, jamais un étalement de `FormData` : un champ caché
       ajouté par n'importe qui deviendrait une colonne écrite. */
    const created = await session.db.insert(personas, {
      productId,
      ...input.persona,
    });
    await syncTraits(session, created.id, input.traits);
  } catch (error) {
    return personaScopeRefusal(error, formData);
  }

  /* **Cette page-là, et elle seule.** La liste des produits n'affiche aucun
     persona, et aucun autre écran n'en porte encore. */
  revalidatePath(ROUTES.product(productId));

  /* **Le panneau se referme sur ce succès, et non plus sur une navigation**
     (TD.2). `redirect` était la fermeture ; elle ne peut plus l'être sans
     re-rendre la page que le panneau n'a justement plus à quitter.
     `revalidatePath` reste, et la réponse de l'action porte l'arbre
     réactualisé : ce qui a été écrit paraît dans son bloc, et c'est toute la
     confirmation (`docs/06` §9). */
  return { values, errors: {}, ok: true };
}

/**
 * Corriger un persona déjà saisi : **le même formulaire, la même validation,
 * les mêmes refus** qu'à la création — la propriété qui fait qu'un seul panneau
 * sert les deux gestes.
 *
 * `productId` et `personaId` sont liés côté serveur. **Ce ne sont pas des
 * secrets** : Next les sérialise en clair dans un champ `$ACTION_…`, et une
 * soumission peut les réécrire. Ce qui protège est `openPersona`, qui interroge
 * le droit sur le produit **reçu** puis rapproche le persona **reçu** de ce
 * produit.
 *
 * **Le produit ne se corrige pas ici** : `personas.product_id` n'est pas un
 * champ du formulaire et ne le devient pas. Déplacer un persona d'un produit à
 * l'autre serait un geste que rien ne demande.
 */
export async function updatePersona(
  productId: string,
  personaId: string,
  _previous: PersonaFormState,
  formData: FormData,
): Promise<PersonaFormState> {
  const session = await requireSession();

  const gate = await openPersona(
    session,
    productId,
    personaId,
    "La modification d'un persona est réservée au responsable de domaine et aux contributeurs désignés d'un accompagnement de ce produit.",
  );
  if ("message" in gate) return personaRefusal(formData, gate.message);

  const { values, errors, input } = parsePersonaForm(formData);
  if (!input) return { values, errors };

  try {
    const updated = await session.db.update(personas, personaId, input.persona);
    if (!updated) {
      return personaRefusal(
        formData,
        "Ce persona n'existe plus sur ce produit.",
      );
    }
    await syncTraits(session, personaId, input.traits);
  } catch (error) {
    return personaScopeRefusal(error, formData);
  }

  revalidatePath(ROUTES.product(productId));

  /* **Le panneau se referme sur ce succès, et non plus sur une navigation**
     (TD.2). `redirect` était la fermeture ; elle ne peut plus l'être sans
     re-rendre la page que le panneau n'a justement plus à quitter.
     `revalidatePath` reste, et la réponse de l'action porte l'arbre
     réactualisé : ce qui a été écrit paraît dans son bloc, et c'est toute la
     confirmation (`docs/06` §9). */
  return { values, errors: {}, ok: true };
}

/**
 * Ranger un persona : il quitte le bloc, rien n'est supprimé (règle 4).
 *
 * **Sans confirmation** — arbitrage (c) de `tickets-C4bis.md` : elle se justifie
 * là où le geste retire de la lecture tout un ensemble. Un persona ne porte rien
 * d'autre que ses propres traits, et `docs/06` §9 proscrit la confirmation
 * partout où elle ne protège rien.
 *
 * **Aucun rétablissement** — arbitrage (b) de `tickets-C4bis.md` : le
 * rétablissement existe pour les deux objets qui ont une page, et un persona
 * n'en a pas. Ses traits restent en base avec lui : archiver le parent ne
 * cascade sur rien (arbitrage (f)), et la fiche redeviendrait entière le jour où
 * un écran la rétablirait.
 *
 * **Le refus est muet**, comme `archiveIndicator` et `archiveReading` : ce geste
 * n'a aucune saisie à rendre, et rien ne justifie de lui inventer un message que
 * l'écran n'atteint jamais en usage normal — le point d'entrée n'est rendu qu'à
 * qui peut écrire, sur un persona vivant de ce produit. Ce n'est pas ce rendu
 * qui protège : la porte redérive le droit sur les identifiants reçus.
 */
export async function archivePersona(
  productId: string,
  personaId: string,
): Promise<void> {
  const session = await requireSession();

  const gate = await openPersona(
    session,
    productId,
    personaId,
    // Jamais rendu : ce geste n'affiche aucun refus.
    "Le rangement d'un persona est réservé au responsable de domaine et aux contributeurs désignés d'un accompagnement de ce produit.",
  );
  if ("message" in gate) return;

  await session.db.archive(personas, personaId);

  revalidatePath(ROUTES.product(productId));
}

/* ==========================================================================
   Les use cases — les grands scénarios d'usage du produit (19/08/2026)

   **Le même droit que les personae et les indicateurs**, dérivé des
   accompagnements du produit (arbitrage (b) de `tickets-C5.md`), et pour la
   même raison : un use case sort du travail d'accompagnement, et inventer un
   troisième niveau de droit serait ce que D9 refuse.

   **Deux tables par geste**, comme le groupe persona : une ligne de
   `use_cases`, et la liste de ses rattachements. `syncUseCasePersonas` fait le
   second temps.

   **Une porte de plus que le groupe persona, et elle est le cœur du groupe.**
   Les identifiants de personae arrivent par le formulaire, pas par une liaison
   côté serveur : ils sont saisis, donc réécrivables, donc ils ne prouvent rien.
   `attachablePersonas` les confronte aux personae **vivants du produit reçu**.
   ========================================================================== */

/**
 * Un refus qui n'appartient à aucun champ, sur la saisie d'un use case.
 *
 * **Le verbe passe devant, et ce n'est pas un caprice de nom** : les six
 * jumelles de ce fichier s'appellent `refusal`, `personaRefusal`,
 * `readingRefusal` — objet d'abord. `useCaseRefusal` aurait suivi la règle, et
 * `react-hooks/rules-of-hooks` l'aurait pris pour un **crochet React** : la
 * règle reconnaît un crochet à `use` suivi d'une majuscule, et refuse alors tout
 * appel depuis une fonction qui n'est ni un composant ni un crochet. Mesuré, pas
 * supposé — cinq erreurs de lint, sur les cinq appels. Le nom cède, la
 * convention est notée : **tout helper de ce dépôt dont l'objet s'appelle
 * `useX` devra passer le verbe devant.**
 */
function refuseUseCase(formData: FormData, message: string): UseCaseFormState {
  return { values: readUseCaseForm(formData), errors: {}, message };
}

/** Le même filet de dernier recours, sur la saisie d'un use case. */
function refuseUseCaseScope(
  error: unknown,
  formData: FormData,
): UseCaseFormState {
  if (error instanceof DomainScopeError) {
    return refuseUseCase(
      formData,
      "Une référence de ce formulaire n'appartient pas au domaine : la saisie n'a pas été enregistrée.",
    );
  }
  throw error;
}

/**
 * Le use case reçu, rapproché du produit reçu — sur le modèle exact
 * d'`openPersona`.
 *
 * Deux contrôles, et chacun ferme une porte :
 *
 * 1. `openProductWrite` sur le `productId` **reçu** — le droit dérivé,
 *    l'appartenance au domaine et la lecture seule d'un produit archivé, d'un
 *    seul appel ;
 * 2. le use case reçu **appartient à ce produit** et n'est pas déjà archivé.
 *    Sans ce second contrôle, une soumission forgée corrigerait ou rangerait le
 *    use case d'un autre produit, les identifiants liés étant sérialisés en
 *    clair dans un champ `$ACTION_…`.
 *
 * Le message n'est utilisé que par `updateUseCase` : `archiveUseCase` refuse en
 * silence, n'ayant aucune saisie à rendre.
 */
async function openUseCase(
  session: Session,
  productId: string,
  useCaseId: string,
  refused: string,
): Promise<{ useCase: Row<typeof useCases> } | { message: string }> {
  const gate = await openProductWrite(session, productId, refused);
  if ("message" in gate) return gate;

  const useCase = await session.db.find(useCases, useCaseId);
  if (
    !useCase ||
    useCase.productId !== productId ||
    useCase.archivedAt !== null
  ) {
    return { message: "Ce use case n'existe plus sur ce produit." };
  }

  return { useCase };
}

/**
 * Les identifiants de personae reçus, confrontés au produit — **la troisième
 * porte**, et celle que ce groupe d'actions ajoute aux précédents.
 *
 * Les cases à cocher du panneau ne sont pas une garantie : elles sont un
 * confort de saisie, rendues sur une page servie à quelqu'un d'autre, et une
 * soumission poste ce qu'elle veut sous le nom `personaIds`. Sans ce contrôle,
 * un scénario rattacherait le persona **d'un autre produit** — la fiche
 * afficherait alors un profil que le bloc « Personae » de la page ne montre pas.
 *
 * La liste de référence est **relue** par `listProductPersonas` sur le produit
 * reçu, jamais tirée du formulaire ni d'un argument lié. Elle écarte d'elle-même
 * les personae archivés : rattacher un profil rangé serait faire réapparaître
 * dans un use case ce qui a quitté le bloc voisin.
 *
 * **Le refus est global, pas par champ**, et c'est délibéré : en usage normal
 * cette branche est inatteignable — les cases ne proposent que des identifiants
 * valides. Elle n'est franchie que par une soumission forgée, à laquelle on ne
 * doit ni un message de champ ni le détail de ce qui a été refusé.
 *
 * Le domaine, lui, est déjà tenu : `listProductPersonas` ne rend que des lignes
 * du domaine courant, et `assertPreconditions` rattraperait de toute façon un
 * identifiant étranger — mais trop tard, en `DomainScopeError`, et sans message
 * lisible.
 */
async function attachablePersonas(
  session: Session,
  productId: string,
  wanted: readonly string[],
): Promise<{ personaIds: string[] } | { message: string }> {
  if (wanted.length === 0) return { personaIds: [] };

  const available = await listProductPersonas(session.db, productId);
  const known = new Set(available.map((persona) => persona.id));

  if (wanted.some((personaId) => !known.has(personaId))) {
    return {
      message:
        "Un des personae rattachés n'appartient pas à ce produit : la saisie n'a pas été enregistrée.",
    };
  }

  return { personaIds: [...wanted] };
}

/**
 * Le second temps de l'écriture : les rattachements, mis à jour **par
 * différence**.
 *
 * C'est `syncTraits` transposé, et le diff n'est pas une économie de requêtes :
 * c'est ce qui garde **l'identifiant d'un rattachement stable** d'une correction
 * à l'autre. Un remplacement récrirait des lignes neuves à chaque
 * enregistrement, et le jour où un méga-parcours désignera « le use case que
 * cette étape emprunte pour ce profil », il désignerait une ligne effacée par la
 * correction suivante. Le rapprochement se fait sur `persona_id`, qui **est**
 * l'identité du lien — à la différence des traits, rapprochés sur un couple
 * `(kind, label)` faute d'identifiant naturel.
 *
 * **Les ajouts avant les retraits** (T3.6) : `neon-http` n'a pas de transaction
 * interactive, et un échec au milieu doit laisser trop de rattachements plutôt
 * que pas assez. Aucune position à mettre à jour entre les deux — la table n'en
 * porte pas.
 *
 * `unlink` est une vraie suppression, et le typage la réserve aux tables sans
 * `archived_at` : `use_case_personas` en est une, délibérément (voir le schéma).
 * Décocher une case n'est pas l'archivage que la règle 4 proscrit — c'est la
 * correction d'un champ.
 */
async function syncUseCasePersonas(
  session: Session,
  useCaseId: string,
  wanted: readonly string[],
): Promise<void> {
  const current = await session.db.list(useCasePersonas, {
    where: eq(useCasePersonas.useCaseId, useCaseId),
  });

  const held = new Set(current.map((row) => row.personaId));

  const added = wanted.filter((personaId) => !held.has(personaId));
  if (added.length > 0) {
    await session.db.insertMany(
      useCasePersonas,
      added.map((personaId) => ({ useCaseId, personaId })),
    );
  }

  const target = new Set(wanted);
  for (const row of current) {
    if (!target.has(row.personaId)) {
      await session.db.unlink(useCasePersonas, row.id);
    }
  }
}

/**
 * Saisir un use case sur un produit.
 *
 * `productId` est lié côté serveur ; `previous` est l'état que `useActionState`
 * fait circuler, dont l'action n'a pas besoin — la saisie repart du `FormData` à
 * chaque soumission.
 *
 * **La création n'est pas atomique, et ne peut pas l'être** : `neon-http` n'a
 * pas de transaction interactive. Un use case dont les rattachements
 * échoueraient resterait sans persona — soit exactement l'état d'un use case
 * qu'on vient de créer sans en cocher, donc un état que l'écran sait rendre et
 * que la correction répare. C'est la dette déjà consignée pour la création d'un
 * projet.
 */
export async function createUseCase(
  productId: string,
  _previous: UseCaseFormState,
  formData: FormData,
): Promise<UseCaseFormState> {
  const session = await requireSession();

  const gate = await openProductWrite(
    session,
    productId,
    "La saisie d'un use case est réservée au responsable de domaine et aux contributeurs désignés d'un accompagnement de ce produit.",
  );
  if ("message" in gate) return refuseUseCase(formData, gate.message);

  const { values, errors, input } = parseUseCaseForm(formData);
  if (!input) return { values, errors };

  /* La troisième porte, **avant** la moindre écriture : un rattachement refusé
     ne doit pas laisser derrière lui un use case à demi écrit. C'est la règle
     de T3.6 — tout confronter au domaine avant d'écrire, faute de transaction. */
  const attachable = await attachablePersonas(
    session,
    productId,
    input.personaIds,
  );
  if ("message" in attachable) {
    return { values, errors: {}, message: attachable.message };
  }

  try {
    /* Un objet littéral, jamais un étalement de `FormData` : un champ caché
       ajouté par n'importe qui deviendrait une colonne écrite. */
    const created = await session.db.insert(useCases, {
      productId,
      ...input.useCase,
    });
    await syncUseCasePersonas(session, created.id, attachable.personaIds);
  } catch (error) {
    return refuseUseCaseScope(error, formData);
  }

  /* **Cette page-là, et elle seule.** Aucun autre écran ne porte de use case. */
  revalidatePath(ROUTES.product(productId));

  /* Le panneau se referme sur ce succès, et non sur une navigation (TD.2) :
     `revalidatePath` porte l'arbre réactualisé, ce qui a été écrit paraît dans
     son bloc, et c'est toute la confirmation (`docs/06` §9). */
  return { values, errors: {}, ok: true };
}

/**
 * Corriger un use case déjà saisi : **le même formulaire, la même validation,
 * les mêmes refus** qu'à la création — la propriété qui fait qu'un seul panneau
 * sert les deux gestes.
 *
 * `productId` et `useCaseId` sont liés côté serveur. **Ce ne sont pas des
 * secrets** : Next les sérialise en clair dans un champ `$ACTION_…`, et une
 * soumission peut les réécrire. Ce qui protège est `openUseCase`, qui interroge
 * le droit sur le produit **reçu** puis rapproche le use case **reçu** de ce
 * produit.
 *
 * **Le produit ne se corrige pas ici** : `use_cases.product_id` n'est pas un
 * champ du formulaire et ne le devient pas. Déplacer un scénario d'un produit à
 * l'autre serait un geste que rien ne demande — et qui laisserait derrière lui
 * des rattachements vers les personae de l'ancien produit.
 */
export async function updateUseCase(
  productId: string,
  useCaseId: string,
  _previous: UseCaseFormState,
  formData: FormData,
): Promise<UseCaseFormState> {
  const session = await requireSession();

  const gate = await openUseCase(
    session,
    productId,
    useCaseId,
    "La modification d'un use case est réservée au responsable de domaine et aux contributeurs désignés d'un accompagnement de ce produit.",
  );
  if ("message" in gate) return refuseUseCase(formData, gate.message);

  const { values, errors, input } = parseUseCaseForm(formData);
  if (!input) return { values, errors };

  const attachable = await attachablePersonas(
    session,
    productId,
    input.personaIds,
  );
  if ("message" in attachable) {
    return { values, errors: {}, message: attachable.message };
  }

  try {
    const updated = await session.db.update(useCases, useCaseId, input.useCase);
    if (!updated) {
      return refuseUseCase(formData, "Ce use case n'existe plus sur ce produit.");
    }
    await syncUseCasePersonas(session, useCaseId, attachable.personaIds);
  } catch (error) {
    return refuseUseCaseScope(error, formData);
  }

  revalidatePath(ROUTES.product(productId));

  return { values, errors: {}, ok: true };
}

/**
 * Ranger un use case : il quitte le bloc, rien n'est supprimé (règle 4).
 *
 * **Sans confirmation** — arbitrage (c) de `tickets-C4bis.md` : elle se justifie
 * là où le geste retire de la lecture tout un ensemble. Un use case ne porte que
 * ses propres rattachements, et `docs/06` §9 proscrit la confirmation partout où
 * elle ne protège rien.
 *
 * **Aucun rétablissement** — arbitrage (b) de `tickets-C4bis.md` : le
 * rétablissement existe pour les deux objets qui ont une page, et un use case
 * n'en a pas. Ses rattachements restent en base avec lui : archiver le parent ne
 * cascade sur rien (arbitrage (f)), et la fiche redeviendrait entière le jour où
 * un écran la rétablirait.
 *
 * **Le refus est muet**, comme `archivePersona` : ce geste n'a aucune saisie à
 * rendre. Ce n'est pas le rendu qui protège — la porte redérive le droit sur les
 * identifiants reçus.
 */
export async function archiveUseCase(
  productId: string,
  useCaseId: string,
): Promise<void> {
  const session = await requireSession();

  const gate = await openUseCase(
    session,
    productId,
    useCaseId,
    // Jamais rendu : ce geste n'affiche aucun refus.
    "Le rangement d'un use case est réservé au responsable de domaine et aux contributeurs désignés d'un accompagnement de ce produit.",
  );
  if ("message" in gate) return;

  await session.db.archive(useCases, useCaseId);

  revalidatePath(ROUTES.product(productId));
}

/* ==========================================================================
   Le dispositif de mesure — les outils, et le plan de taggage
   ==========================================================================

   **Le même droit que les indicateurs, et le même garde.** `openProductWrite`
   n'a pas été touché : responsable de domaine, ou contributeur désigné d'au
   moins un accompagnement de ce produit (arbitrage (b) de `tickets-C5.md`,
   étendu ici en session du 01/09/2026). La conséquence est assumée et
   consignée : un Web Analyst qui maintient la mesure sans avoir été désigné sur
   un accompagnement ne peut pas écrire. Un droit dérivé du **métier** est un
   concept que Vision n'a pas, et l'inventer pour deux tables aurait été un
   quatrième droit d'écriture sur le même produit.

   **Aucune ligne de journal** — le précédent des indicateurs, qui n'ont pas de
   `JournalKind`, et du budget, arbitrage (d) de T7.1. `events` ne gagne ni
   verbe ni cible : ce sont des données de référence du produit, pas des faits
   d'accompagnement. */

function trackingRefusal(
  formData: FormData,
  message: string,
): TrackingFormState {
  return { values: readTrackingForm(formData), errors: {}, message };
}

function trackingScopeRefusal(
  error: unknown,
  formData: FormData,
): TrackingFormState {
  if (error instanceof DomainScopeError) {
    return trackingRefusal(
      formData,
      "Une référence de ce formulaire n'appartient pas au domaine : la saisie n'a pas été enregistrée.",
    );
  }
  throw error;
}

function planRefusal(
  formData: FormData,
  message: string,
): TaggingPlanFormState {
  return { values: readTaggingPlanForm(formData), errors: {}, message };
}

function planScopeRefusal(
  error: unknown,
  formData: FormData,
): TaggingPlanFormState {
  if (error instanceof DomainScopeError) {
    return planRefusal(
      formData,
      "Une référence de ce formulaire n'appartient pas au domaine : la saisie n'a pas été enregistrée.",
    );
  }
  throw error;
}

const TOOL_TAKEN =
  "Cet outil est déjà déclaré sur ce produit. Corrigez la ligne existante plutôt que d'en ajouter une seconde.";

/**
 * Les outils **déjà déclarés vivants** sur ce produit — le contrôle d'unicité,
 * lu avant d'écrire.
 *
 * **Le patron de `checkResultActivity` (T4.4, relu en T4bis.6), et sa leçon la
 * plus fine** : le défaut de `list` exclut les lignes archivées, et
 * `product_trackings_tool_unique` est un index **partiel** sur les vivants. Les
 * deux disent donc exactement la même chose — un outil retiré ne bloque pas sa
 * redéclaration, ni à l'écran ni en base. Le jour où l'un des deux changerait
 * sans l'autre, c'est cette phrase-là qu'il faudrait relire.
 *
 * **Ce contrôle n'est pas la garantie**, il en est la traduction lisible :
 * l'index reste seul juge, et deux saisies simultanées le rencontreraient. Le
 * dépôt accepte cette non-atomicité depuis T2.6, faute de transaction dans la
 * couche d'accès ; ce qui est en jeu ici est un message de champ plutôt qu'une
 * page d'erreur, pas l'intégrité.
 */
async function declaredTools(
  session: Session,
  productId: string,
  except?: string,
): Promise<Set<string>> {
  const rows = await session.db.list(productTrackings, {
    where: eq(productTrackings.productId, productId),
  });
  return new Set(
    rows.filter((row) => row.id !== except).map((row) => row.toolId),
  );
}

/**
 * Le garde d'un outil déjà déclaré — le jumeau d'`openIndicator`.
 *
 * Il redérive le droit sur l'identifiant **reçu**, et vérifie que la ligne
 * appartient bien à ce produit-ci : un identifiant valide du bon domaine mais
 * d'un autre produit ne doit pas s'écrire depuis cette page.
 */
async function openTracking(
  session: Session,
  productId: string,
  trackingId: string,
  refused: string,
): Promise<
  | { product: Row<typeof products>; tracking: Row<typeof productTrackings> }
  | { message: string }
> {
  const gate = await openProductWrite(session, productId, refused);
  if ("message" in gate) return gate;

  const tracking = await session.db.find(productTrackings, trackingId);
  if (
    !tracking ||
    tracking.productId !== productId ||
    tracking.archivedAt !== null
  ) {
    return { message: "Cet outil de mesure n'existe plus sur ce produit." };
  }

  return { product: gate.product, tracking };
}

export async function createTracking(
  productId: string,
  _previous: TrackingFormState,
  formData: FormData,
): Promise<TrackingFormState> {
  const session = await requireSession();

  const gate = await openProductWrite(
    session,
    productId,
    "La saisie d'un outil de mesure est réservée au responsable de domaine et aux contributeurs désignés d'un accompagnement de ce produit.",
  );
  if ("message" in gate) return trackingRefusal(formData, gate.message);

  const { values, errors, input } = parseTrackingForm(formData);
  if (!input) return { values, errors };

  const taken = await declaredTools(session, productId);
  if (taken.has(input.toolId)) return { values, errors: { toolId: TOOL_TAKEN } };

  try {
    await session.db.insert(productTrackings, { productId, ...input });
  } catch (error) {
    return trackingScopeRefusal(error, formData);
  }

  /* **Cette page-là, et elle seule.** La liste des produits n'affiche aucun
     outil de mesure — elle ne porte que le plan de taggage. La leçon de T4.2 :
     revalider davantage ferait croire qu'un outil touche à la liste. */
  revalidatePath(ROUTES.product(productId));

  return { values, errors: {}, ok: true };
}

export async function updateTracking(
  productId: string,
  trackingId: string,
  _previous: TrackingFormState,
  formData: FormData,
): Promise<TrackingFormState> {
  const session = await requireSession();

  const gate = await openTracking(
    session,
    productId,
    trackingId,
    "La modification d'un outil de mesure est réservée au responsable de domaine et aux contributeurs désignés d'un accompagnement de ce produit.",
  );
  if ("message" in gate) return trackingRefusal(formData, gate.message);

  const { values, errors, input } = parseTrackingForm(formData);
  if (!input) return { values, errors };

  /* **La ligne courante est exceptée**, et c'est tout ce qui distingue ce
     contrôle du précédent : corriger le périmètre d'un outil sans changer
     l'outil ne doit pas se heurter à sa propre déclaration. */
  const taken = await declaredTools(session, productId, trackingId);
  if (taken.has(input.toolId)) return { values, errors: { toolId: TOOL_TAKEN } };

  try {
    const updated = await session.db.update(
      productTrackings,
      trackingId,
      input,
    );
    if (!updated) {
      return trackingRefusal(
        formData,
        "Cet outil de mesure n'existe plus sur ce produit.",
      );
    }
  } catch (error) {
    return trackingScopeRefusal(error, formData);
  }

  revalidatePath(ROUTES.product(productId));

  return { values, errors: {}, ok: true };
}

/**
 * Retirer un outil du dispositif — un archivage, jamais une suppression
 * (règle 4).
 *
 * La ligne retirée libère la place que tenait l'unicité partielle : redéclarer
 * le même outil ensuite est un chemin réel, et c'est ce que l'index `where
 * archived_at is null` garantit.
 */
export async function archiveTracking(
  productId: string,
  trackingId: string,
): Promise<void> {
  const session = await requireSession();

  const gate = await openTracking(
    session,
    productId,
    trackingId,
    // Jamais rendu : ce geste n'affiche aucun refus.
    "Le retrait d'un outil de mesure est réservé au responsable de domaine et aux contributeurs désignés d'un accompagnement de ce produit.",
  );
  if ("message" in gate) return;

  await session.db.archive(productTrackings, trackingId);

  revalidatePath(ROUTES.product(productId));
}

/**
 * **Un seul geste pour renseigner et pour corriger.**
 *
 * C'est ce que dit `tagging_plans_product_unique` : un produit a au plus un plan
 * vivant, donc « en ajouter un » et « corriger celui-là » sont la même écriture
 * vue à deux moments. Deux actions auraient demandé à l'écran de savoir lequel
 * appeler, c'est-à-dire de relire l'état juste avant le clic — et de se tromper
 * dès que deux personnes saisissent en même temps.
 *
 * La lecture qui décide est faite **ici**, après la garde et dans la même
 * requête scopée : `findProductTaggingPlan` rend le plan vivant ou `null`.
 */
export async function saveTaggingPlan(
  productId: string,
  _previous: TaggingPlanFormState,
  formData: FormData,
): Promise<TaggingPlanFormState> {
  const session = await requireSession();

  const gate = await openProductWrite(
    session,
    productId,
    "La saisie du plan de taggage est réservée au responsable de domaine et aux contributeurs désignés d'un accompagnement de ce produit.",
  );
  if ("message" in gate) return planRefusal(formData, gate.message);

  const { values, errors, input } = parseTaggingPlanForm(formData);
  if (!input) return { values, errors };

  const existing = await findProductTaggingPlan(session.db, productId);

  try {
    if (existing) {
      const updated = await session.db.update(
        taggingPlans,
        existing.id,
        input,
      );
      if (!updated) {
        return planRefusal(
          formData,
          "Ce plan de taggage n'existe plus sur ce produit.",
        );
      }
    } else {
      await session.db.insert(taggingPlans, { productId, ...input });
    }
  } catch (error) {
    return planScopeRefusal(error, formData);
  }

  revalidatePath(ROUTES.product(productId));
  /* **L'exception à « cette page-là, et elle seule ».** Le plan de taggage est
     la seule donnée de ce fichier qu'un **autre écran** affiche : la cinquième
     colonne de la liste des produits. Sans cette seconde revalidation, la liste
     garderait « Aucun plan déclaré » après une saisie réussie — le défaut exact
     que la leçon de T4.2 demande de peser dans les deux sens. */
  revalidatePath(ROUTES.products);

  return { values, errors: {}, ok: true };
}

/** Retirer le plan — archivage, comme partout (règle 4). */
export async function archiveTaggingPlan(productId: string): Promise<void> {
  const session = await requireSession();

  const gate = await openProductWrite(
    session,
    productId,
    // Jamais rendu : ce geste n'affiche aucun refus.
    "Le retrait du plan de taggage est réservé au responsable de domaine et aux contributeurs désignés d'un accompagnement de ce produit.",
  );
  if ("message" in gate) return;

  const existing = await findProductTaggingPlan(session.db, productId);
  if (!existing) return;

  await session.db.archive(taggingPlans, existing.id);

  revalidatePath(ROUTES.product(productId));
  revalidatePath(ROUTES.products);
}

/* ==========================================================================
   Les repères de contexte — ce qui s'est passé sur le produit, hors du centre
   ==========================================================================

   **Le même droit que les indicateurs et le dispositif de mesure.**
   `openProductWrite` n'est pas touché : responsable de domaine, ou contributeur
   désigné d'au moins un accompagnement de ce produit. Un repère de contexte est
   un fait constaté par qui travaille sur le produit, comme un relevé — pas une
   propriété du produit comme sa vision, qui a pris `manageDomain` le
   18/08/2026. Arbitrage rendu en session.

   **Rien ne se saisit pour les repères d'accompagnement.** Ils remontent des
   activités terminées, qui ont déjà leur écran et leur droit sur la page
   projet. Ce fichier ne porte donc que la moitié manuelle de la couche.

   **Aucune ligne de journal** — le précédent des indicateurs, du budget
   (arbitrage (d) de T7.1) et du dispositif de mesure. `events` ne gagne ni
   verbe ni cible : ce sont des faits du **produit**, pas des faits
   d'accompagnement. Le point ouvert des objets non journalisés reçoit un nom de
   plus, il ne se referme pas à moitié.

   **Une seule revalidation.** Aucun autre écran ne lit ces lignes — c'est ce
   qui sépare ce geste de celui du plan de taggage, dont la liste des produits
   affiche l'état. La leçon de T4.2, pesée dans les deux sens. */

function markerRefusal(
  formData: FormData,
  message: string,
): ContextMarkerFormState {
  return { values: readContextMarkerForm(formData), errors: {}, message };
}

function markerScopeRefusal(
  error: unknown,
  formData: FormData,
): ContextMarkerFormState {
  if (error instanceof DomainScopeError) {
    return markerRefusal(
      formData,
      "Une référence de ce formulaire n'appartient pas au domaine : la saisie n'a pas été enregistrée.",
    );
  }
  throw error;
}

const MARKER_WRITE_REFUSED =
  "La saisie d'un repère de contexte est réservée au responsable de domaine et aux contributeurs désignés d'un accompagnement de ce produit.";

const MARKER_GONE = "Ce repère n'existe plus sur ce produit.";

/**
 * L'accompagnement rattaché appartient-il à **ce** produit ?
 *
 * **La garde qu'aucune voisine n'a**, et elle est nécessaire : le formulaire ne
 * propose que les accompagnements du produit, et cela ne protège rien — les
 * identifiants d'une action serveur voyagent en clair dans le champ
 * `$ACTION_…`, réécrivable. Un identifiant valide du bon domaine mais d'un
 * autre produit poserait un repère qui nommerait un accompagnement qu'on ne
 * peut pas atteindre depuis cette page.
 *
 * Le message est **de champ** et non global : c'est le `<select>` qui porte la
 * valeur fautive, et l'y renvoyer est ce qui permet de la corriger.
 */
async function foreignProject(
  session: Session,
  productId: string,
  projectId: string | null,
): Promise<boolean> {
  if (projectId === null) return false;

  const project = await session.db.find(projects, projectId);
  return !project || project.productId !== productId;
}

/**
 * Le garde d'un repère existant : le droit du produit, puis l'appartenance de
 * la ligne — la forme d'`openTracking`.
 */
async function openContextMarker(
  session: Session,
  productId: string,
  markerId: string,
  refused: string,
): Promise<
  | { product: Row<typeof products>; marker: Row<typeof contextMarkers> }
  | { message: string }
> {
  const gate = await openProductWrite(session, productId, refused);
  if ("message" in gate) return gate;

  const marker = await session.db.find(contextMarkers, markerId);
  if (
    !marker ||
    marker.productId !== productId ||
    marker.archivedAt !== null
  ) {
    return { message: MARKER_GONE };
  }

  return { product: gate.product, marker };
}

/** Poser un repère de contexte sur ce produit. */
export async function createContextMarker(
  productId: string,
  _previous: ContextMarkerFormState,
  formData: FormData,
): Promise<ContextMarkerFormState> {
  const session = await requireSession();

  const gate = await openProductWrite(
    session,
    productId,
    MARKER_WRITE_REFUSED,
  );
  if ("message" in gate) return markerRefusal(formData, gate.message);

  const { values, errors, input } = parseContextMarkerForm(formData);
  if (!input) return { values, errors };

  if (await foreignProject(session, productId, input.projectId)) {
    return {
      values,
      errors: { projectId: "Cet accompagnement n'est pas celui de ce produit." },
    };
  }

  try {
    await session.db.insert(contextMarkers, { productId, ...input });
  } catch (error) {
    return markerScopeRefusal(error, formData);
  }

  revalidatePath(ROUTES.product(productId));

  return { values, errors: {}, ok: true };
}

/** Corriger un repère de contexte — le même formulaire, le même panneau. */
export async function updateContextMarker(
  productId: string,
  markerId: string,
  _previous: ContextMarkerFormState,
  formData: FormData,
): Promise<ContextMarkerFormState> {
  const session = await requireSession();

  const gate = await openContextMarker(
    session,
    productId,
    markerId,
    MARKER_WRITE_REFUSED,
  );
  if ("message" in gate) return markerRefusal(formData, gate.message);

  const { values, errors, input } = parseContextMarkerForm(formData);
  if (!input) return { values, errors };

  if (await foreignProject(session, productId, input.projectId)) {
    return {
      values,
      errors: { projectId: "Cet accompagnement n'est pas celui de ce produit." },
    };
  }

  try {
    const updated = await session.db.update(contextMarkers, markerId, input);
    if (!updated) return markerRefusal(formData, MARKER_GONE);
  } catch (error) {
    return markerScopeRefusal(error, formData);
  }

  revalidatePath(ROUTES.product(productId));

  return { values, errors: {}, ok: true };
}

/** Retirer un repère de contexte — archivage, comme partout (règle 4). */
export async function archiveContextMarker(
  productId: string,
  markerId: string,
): Promise<void> {
  const session = await requireSession();

  const gate = await openContextMarker(
    session,
    productId,
    markerId,
    // Jamais rendu : ce geste n'affiche aucun refus.
    MARKER_WRITE_REFUSED,
  );
  if ("message" in gate) return;

  await session.db.archive(contextMarkers, markerId);

  revalidatePath(ROUTES.product(productId));
}
