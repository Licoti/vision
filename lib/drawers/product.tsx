/**
 * La résolution des neuf panneaux de la page produit — TD.2, puis les deux
 * du use case (19/08/2026).
 *
 * **Ce fichier n'invente rien.** Tout ce qu'il contient vient de
 * `app/(app)/produits/[id]/page.tsx`, où il vivait entre le décompte
 * d'exclusivité et le rendu des panneaux. Il en sort pour une seule raison :
 * **deux chemins doivent y passer** — l'URL, qui reste une adresse valide, et
 * le clic, qui ne l'écrit plus. Les faire diverger aurait mis une règle de
 * droit à deux endroits, et c'est exactement ce qu'on ne veut pas d'une
 * refonte de mécanisme.
 *
 * **Les disciplines tenues, sans exception.** La forme de l'UUID se vérifie
 * **avant** la base — une colonne `uuid` interrogée avec n'importe quoi rend une
 * erreur PostgreSQL, donc un 500, là où l'on attend une page nue. Chaque cible
 * est ensuite **confrontée** au produit de la page et à son archivage : une
 * demande forgée n'ouvre jamais plus que ce que l'écran propose. Et ce n'est
 * pas ce rendu qui protège — les actions redérivent le droit sur l'identifiant
 * reçu, ce que TD.2 ne change pas d'un caractère.
 *
 * **Ce qui a disparu, et pourquoi ce n'est pas une perte.** La règle
 * d'exclusivité — plusieurs clés d'ouverture n'en ouvrent aucune — ne vaut plus
 * que pour le chemin URL, où elle reste dans la page. Côté clic, elle est
 * devenue **structurelle** : l'état ne porte qu'une demande à la fois, et deux
 * `role="dialog"` concurrents ne sont plus représentables.
 */

import { ConfirmPanel } from "@/components/ui/confirm-panel";
import { IndicatorPanel } from "@/components/products/indicator-panel";
import {
  PersonaDetail,
  PersonaDetailHeader,
} from "@/components/products/persona-detail";
import { PersonaPanel } from "@/components/products/persona-panel";
import { UseCaseDetail } from "@/components/products/use-case-detail";
import { UseCasePanel } from "@/components/products/use-case-panel";
import { ReadingPanel } from "@/components/products/reading-panel";
import { ReadingsPanel } from "@/components/products/readings-panel";
import { VisionPanel } from "@/components/products/vision-panel";
import type { Session } from "@/lib/auth/session";
import {
  indicatorReadings,
  indicators,
  personas,
  useCases,
} from "@/lib/db/schema";
import { toIndicatorFormValues } from "@/lib/forms/indicator";
import { toPersonaFormValues } from "@/lib/forms/persona";
import { toReadingFormValues } from "@/lib/forms/reading";
import { toUseCaseFormValues } from "@/lib/forms/use-case";
import { toVisionFormValues } from "@/lib/forms/vision";
import {
  ARCHIVE_PANEL_CONFIRM,
  ARCHIVE_PANEL_PARAM,
  INDICATOR_PANEL_NEW,
  INDICATOR_PANEL_PARAM,
  PERSONA_DETAIL_PARAM,
  PERSONA_PANEL_NEW,
  PERSONA_PANEL_PARAM,
  READING_PANEL_PARAM,
  READINGS_PANEL_PARAM,
  ROUTES,
  USE_CASE_DETAIL_PARAM,
  USE_CASE_PANEL_NEW,
  USE_CASE_PANEL_PARAM,
  VISION_PANEL_EDIT,
  VISION_PANEL_PARAM,
} from "@/lib/navigation";
import type { DrawerContent, ProductDrawerRequest } from "@/lib/drawers/types";
import type {
  ProductIndicator,
  ProductReading,
} from "@/lib/queries/indicators";
import { listPersonaTraits, listProductPersonas } from "@/lib/queries/personas";
import type { ProductPersona } from "@/lib/queries/personas";
import { listProductUseCases, personasOf } from "@/lib/queries/use-cases";
import type { ProductUseCase } from "@/lib/queries/use-cases";
import {
  listProductIndicators,
  listProductReadings,
} from "@/lib/queries/indicators";
import type { ProductDetail } from "@/lib/queries/products";
import { listProductProjects } from "@/lib/queries/products";
import { isUuid } from "@/lib/uuid";

import {
  archiveProduct,
  updateProductVision,
} from "@/app/(app)/produits/actions";
import {
  archivePersona,
  archiveReading,
  archiveUseCase,
  createIndicator,
  createPersona,
  createReading,
  createUseCase,
  updateIndicator,
  updatePersona,
  updateReading,
  updateUseCase,
} from "@/app/(app)/produits/[id]/actions";

/**
 * Ce que la résolution a besoin de savoir, et que la page a déjà lu.
 *
 * **Trois collections seulement, et jamais toutes à la fois.** La page les
 * passe telles quelles ; la fonction serveur ne lit que celles dont la demande
 * a besoin (`loadProductDrawerContext`). C'est la discipline de T3.3 tenue à
 * l'envers : la page ne payait pas pour un panneau fermé, l'ouverture ne paie
 * pas pour un panneau qu'elle n'ouvre pas.
 */
export type ProductDrawerContext = {
  /**
   * Le droit d'écrire les indicateurs, **dérivé des accompagnements du
   * produit** (arbitrage (b) de `tickets-C5.md`) : `manageDomain`, ou
   * contributeur désigné d'au moins un accompagnement vivant. Un produit
   * archivé est en lecture seule.
   */
  canWrite: boolean;
  indicators: readonly ProductIndicator[];
  readings: readonly ProductReading[];
  personas: readonly ProductPersona[];
  useCases: readonly ProductUseCase[];
};

/** Le droit d'écrire, dérivé une fois pour les deux chemins. */
export async function productWriteRight(
  session: Session,
  product: ProductDetail,
): Promise<boolean> {
  if (product.archivedAt !== null) return false;
  if (session.can.manageDomain) return true;
  const projects = await listProductProjects(session.db, product.id);
  return projects.some((project) => session.can.writeProject(project.id));
}

/**
 * Les lectures qu'une demande exige, et rien de plus.
 *
 * Appelée par la **fonction serveur** seulement : la page, elle, a déjà tout lu
 * pour son écran et n'a rien à relire.
 */
export async function loadProductDrawerContext(
  session: Session,
  product: ProductDetail,
  request: ProductDrawerRequest,
): Promise<ProductDrawerContext> {
  const canWrite = await productWriteRight(session, product);

  if (request.kind === "readings") {
    const [productIndicators, productReadings] = await Promise.all([
      listProductIndicators(session.db, product.id),
      listProductReadings(session.db, product.id),
    ]);
    return {
      canWrite,
      indicators: productIndicators,
      readings: productReadings,
      personas: [],
      useCases: [],
    };
  }

  if (request.kind === "personaDetail") {
    return {
      canWrite,
      indicators: [],
      readings: [],
      personas: await listProductPersonas(session.db, product.id),
      useCases: [],
    };
  }

  /* La fiche d'un use case a besoin des deux : le use case lui-même, et les
     personae dont il rend les noms. Le panneau de **saisie**, lui, n'a besoin
     que des personae — ses cases à cocher —, et se résout sur la ligne qu'il
     relit lui-même. */
  if (request.kind === "useCaseDetail") {
    const [productPersonas, productUseCases] = await Promise.all([
      listProductPersonas(session.db, product.id),
      listProductUseCases(session.db, product.id),
    ]);
    return {
      canWrite,
      indicators: [],
      readings: [],
      personas: productPersonas,
      useCases: productUseCases,
    };
  }

  if (request.kind === "useCase") {
    return {
      canWrite,
      indicators: [],
      readings: [],
      personas: await listProductPersonas(session.db, product.id),
      useCases: [],
    };
  }

  return { canWrite, indicators: [], readings: [], personas: [], useCases: [] };
}

export async function resolveProductDrawer(
  session: Session,
  product: ProductDetail,
  context: ProductDrawerContext,
  request: ProductDrawerRequest,
): Promise<DrawerContent | null> {
  const archived = product.archivedAt !== null;

  switch (request.kind) {
    /* ------------------------------------------------------------------ */
    case "archive": {
      /* On ne confirme pas l'archivage de ce qui est déjà rangé. Qui n'a pas
         le droit obtient la page nue — pas un 404 : la page produit reste
         lisible par tout le domaine (D9), seul le panneau disparaît. */
      if (!session.can.manageDomain || archived) return null;
      return {
        titleId: "panneau-confirmation-titre",
        title: "Archiver ce produit",
        subtitles: [product.name],
        /* L'action est liée **côté serveur** au produit courant : l'identifiant
           sort de la saisie. Ce n'est pas un verrou — Next sérialise les
           arguments liés dans un champ `$ACTION_…`, réécrivable. Le verrou est
           dans l'action, qui interroge `manageDomain` puis rapproche le produit
           reçu du domaine courant. */
        body: (
          <ConfirmPanel
            action={archiveProduct.bind(null, product.id)}
            submitLabel="Archiver ce produit"
            pendingLabel="Archivage…"
          >
            <div className="flex flex-col gap-3 text-sm text-content-neutral-dark">
              <p>
                Ce produit disparaît de la liste des produits et des écrans qui
                la reprennent. Rien n&apos;est supprimé.
              </p>
              <p>
                Sa page reste lisible par son adresse, avec ses accompagnements
                passés : c&apos;est la mémoire du centre, elle ne se perd pas.
              </p>
              <p>Le geste se défait : « Rétablir » ramène le produit.</p>
            </div>
          </ConfirmPanel>
        ),
      };
    }

    /* ------------------------------------------------------------------ */
    case "indicator": {
      if (!context.canWrite) return null;

      /* La forme est vérifiée avant la base. L'indicateur est ensuite
         confronté au produit et à l'archivage — le bloc n'affiche aucun lien
         vers un indicateur archivé, mais une demande se forge. */
      const row =
        request.id && isUuid(request.id)
          ? await session.db.find(indicators, request.id)
          : undefined;
      const indicator =
        row && row.productId === product.id && row.archivedAt === null
          ? row
          : null;

      if (request.id && !indicator) return null;

      return {
        titleId: "panneau-indicateur-titre",
        title: indicator ? "Modifier l'indicateur" : "Ajouter un indicateur",
        subtitles: [product.name],
        body: (
          <IndicatorPanel
            action={
              indicator
                ? updateIndicator.bind(null, product.id, indicator.id)
                : createIndicator.bind(null, product.id)
            }
            {...(indicator
              ? {
                  submitLabel: "Enregistrer les modifications",
                  initial: toIndicatorFormValues(indicator),
                }
              : {})}
          />
        ),
      };
    }

    /* ------------------------------------------------------------------ */
    case "reading": {
      if (!context.canWrite || !isUuid(request.id)) return null;

      /* La valeur change de **table** et non de nature : l'identifiant d'un
         indicateur saisit un relevé, celui d'un relevé le corrige. Deux
         lectures scopées successives tranchent, et ce qui n'est ni l'un ni
         l'autre n'ouvre rien. L'indicateur d'abord : c'est le cas courant. */
      const indicatorRow = await session.db.find(indicators, request.id);
      const newFor =
        indicatorRow &&
        indicatorRow.productId === product.id &&
        indicatorRow.archivedAt === null
          ? indicatorRow
          : null;

      /* Le relevé ensuite, et sa chaîne remontée jusqu'au produit — relevé,
         indicateur, produit : la même que remonte `openReading` dans l'action,
         et pour la même raison. */
      const readingRow = newFor
        ? undefined
        : await session.db.find(indicatorReadings, request.id);
      const readingIndicator =
        readingRow && readingRow.archivedAt === null
          ? await session.db.find(indicators, readingRow.indicatorId)
          : undefined;

      const panel = newFor
        ? { indicator: newFor, reading: null }
        : readingRow &&
            readingIndicator &&
            readingIndicator.productId === product.id &&
            readingIndicator.archivedAt === null
          ? { indicator: readingIndicator, reading: readingRow }
          : null;

      if (!panel) return null;

      return {
        titleId: "panneau-releve-titre",
        title: panel.reading ? "Modifier le relevé" : "Ajouter un relevé",
        subtitles: [`${product.name} · ${panel.indicator.label}`],
        body: (
          <ReadingPanel
            action={
              panel.reading
                ? updateReading.bind(null, product.id, panel.reading.id)
                : createReading.bind(null, product.id, panel.indicator.id)
            }
            {...(panel.reading
              ? {
                  submitLabel: "Enregistrer les modifications",
                  initial: toReadingFormValues(panel.reading),
                }
              : {})}
          />
        ),
      };
    }

    /* ------------------------------------------------------------------ */
    case "readings": {
      /* **Il ne dépend d'aucun droit** : lire la série d'un indicateur se fait
         par tout le domaine (D9), comme le bloc lui-même. Ce sont les gestes
         *dans* le panneau qui tombent avec `canWrite`. */
      if (!isUuid(request.id)) return null;
      const row = await session.db.find(indicators, request.id);
      const indicator =
        row && row.productId === product.id && row.archivedAt === null
          ? context.indicators.find((entry) => entry.id === row.id)
          : undefined;
      if (!indicator) return null;

      return {
        titleId: "panneau-releves-titre",
        title: "Relevés",
        subtitles: [`${product.name} · ${indicator.label}`],
        body: (
          <ReadingsPanel
            indicator={indicator}
            readings={context.readings.filter(
              (reading) => reading.indicatorId === indicator.id,
            )}
            addReadingHref={
              context.canWrite
                ? ROUTES.productReadingNew(product.id, indicator.id)
                : null
            }
            editReadingHref={
              context.canWrite
                ? (readingId) =>
                    ROUTES.productReadingEdit(product.id, readingId)
                : null
            }
            archiveReading={
              context.canWrite ? archiveReading.bind(null, product.id) : null
            }
          />
        ),
      };
    }

    /* ------------------------------------------------------------------ */
    case "vision": {
      /* **La seule qui n'ouvre pas sur le droit dérivé** : la vision est une
         propriété du produit, donc `manageDomain` seul (F1-D1, D9). Un
         contributeur désigné, qui écrit les indicateurs, n'écrit pas la vision
         — et le panneau lui est simplement absent. */
      if (!session.can.manageDomain || archived) return null;
      return {
        titleId: "panneau-vision-titre",
        title: product.vision
          ? "Modifier la vision produit"
          : "Ajouter la vision produit",
        subtitles: [product.name],
        body: (
          <VisionPanel
            action={updateProductVision.bind(null, product.id)}
            {...(product.vision
              ? {
                  submitLabel: "Enregistrer les modifications",
                  initial: toVisionFormValues(product),
                }
              : {})}
          />
        ),
      };
    }

    /* ------------------------------------------------------------------ */
    case "persona": {
      if (!context.canWrite) return null;

      const row =
        request.id && isUuid(request.id)
          ? await session.db.find(personas, request.id)
          : undefined;
      const persona =
        row && row.productId === product.id && row.archivedAt === null
          ? row
          : null;

      if (request.id && !persona) return null;

      const traits = persona
        ? await listPersonaTraits(session.db, persona.id)
        : [];

      return {
        titleId: "panneau-persona-saisie-titre",
        title: persona ? "Modifier le persona" : "Ajouter un persona",
        subtitles: [product.name],
        body: (
          <PersonaPanel
            action={
              persona
                ? updatePersona.bind(null, product.id, persona.id)
                : createPersona.bind(null, product.id)
            }
            {...(persona
              ? {
                  submitLabel: "Enregistrer les modifications",
                  initial: toPersonaFormValues(persona, traits),
                }
              : {})}
          />
        ),
      };
    }

    /* ------------------------------------------------------------------ */
    case "personaDetail": {
      /* **La fiche se lit par tout le domaine** (D9), à la différence de la
         saisie : son ouverture ne passe par aucun droit. Ce sont ses deux
         gestes qui tombent avec lui, chacun à `null`. Elle se résout sur la
         liste déjà lue plutôt que par une lecture de plus — un persona archivé
         ou d'un autre produit n'y est pas, et c'est ce qui remplace ici la
         confrontation en deux temps. */
      if (!isUuid(request.id)) return null;
      const persona =
        context.personas.find((entry) => entry.id === request.id) ?? null;
      if (!persona) return null;

      const traits = await listPersonaTraits(session.db, persona.id);

      return {
        titleId: "panneau-persona-titre",
        title: persona.name,
        subtitles: [product.name],
        header: (
          <PersonaDetailHeader productName={product.name} persona={persona} />
        ),
        body: (
          <PersonaDetail
            persona={persona}
            traits={traits}
            editHref={
              context.canWrite
                ? ROUTES.productPersonaEdit(product.id, persona.id)
                : null
            }
            archivePersona={
              context.canWrite
                ? archivePersona.bind(null, product.id, persona.id)
                : null
            }
          />
        ),
      };
    }

    /* ------------------------------------------------------------------ */
    case "useCase": {
      if (!context.canWrite) return null;

      /* La forme avant la base, puis la confrontation au produit et à
         l'archivage : le bloc n'affiche aucun lien vers un use case archivé,
         mais une demande se forge. Le patron de `persona`, à la lettre. */
      const row =
        request.id && isUuid(request.id)
          ? await session.db.find(useCases, request.id)
          : undefined;
      const useCase =
        row && row.productId === product.id && row.archivedAt === null
          ? row
          : null;

      if (request.id && !useCase) return null;

      /* Les rattachements en place ne se relisent que pour une correction : à
         la création, il n'y a rien à cocher d'avance. */
      const attached = useCase
        ? (
            await listProductUseCases(session.db, product.id)
          ).find((entry) => entry.id === useCase.id)?.personaIds ?? []
        : [];

      return {
        titleId: "panneau-usecase-saisie-titre",
        title: useCase ? "Modifier le use case" : "Ajouter un use case",
        subtitles: [product.name],
        body: (
          <UseCasePanel
            action={
              useCase
                ? updateUseCase.bind(null, product.id, useCase.id)
                : createUseCase.bind(null, product.id)
            }
            personas={context.personas}
            {...(useCase
              ? {
                  submitLabel: "Enregistrer les modifications",
                  initial: toUseCaseFormValues(useCase, attached),
                }
              : {})}
          />
        ),
      };
    }

    /* ------------------------------------------------------------------ */
    case "useCaseDetail": {
      /* **La fiche se lit par tout le domaine** (D9), à la différence de la
         saisie : son ouverture ne passe par aucun droit. Ce sont ses deux
         gestes qui tombent avec lui, chacun à `null`. Elle se résout sur la
         liste déjà lue plutôt que par une lecture de plus — un use case archivé
         ou d'un autre produit n'y est pas, et c'est ce qui remplace ici la
         confrontation en deux temps. La règle de `personaDetail`. */
      if (!isUuid(request.id)) return null;
      const useCase =
        context.useCases.find((entry) => entry.id === request.id) ?? null;
      if (!useCase) return null;

      return {
        titleId: "panneau-usecase-titre",
        title: useCase.title,
        subtitles: [product.name],
        body: (
          <UseCaseDetail
            useCase={useCase}
            personas={personasOf(useCase, context.personas)}
            personaHref={(personaId) =>
              ROUTES.productPersona(product.id, personaId)
            }
            editHref={
              context.canWrite
                ? ROUTES.productUseCaseEdit(product.id, useCase.id)
                : null
            }
            archiveUseCase={
              context.canWrite
                ? archiveUseCase.bind(null, product.id, useCase.id)
                : null
            }
          />
        ),
      };
    }
  }
}

/**
 * La traduction des paramètres d'URL en demande — le chemin qui reste ouvert.
 *
 * **Le vocabulaire d'URL vit ici et nulle part ailleurs.** Les clés et leurs
 * valeurs d'ouverture gardent exactement le sens que `lib/navigation.ts` leur
 * donne depuis T3.2 : une clé, dont la **valeur** porte le cas — `nouvel` crée,
 * un identifiant corrige, tout le reste n'ouvre rien. Ce qui a changé, c'est
 * qu'elles ne sont plus le mécanisme : elles sont une **adresse** parmi deux
 * chemins, et la résolution qu'elles atteignent est la même que celle du clic.
 *
 * Une clé inconnue ou une valeur qui ne désigne rien rend `null`, c'est-à-dire
 * la page nue — jamais un 404 : la page produit reste lisible par tout le
 * domaine (D9), seul le panneau disparaît.
 */
export function productRequestFromParams(asked: {
  archiver?: string | undefined;
  indicateur?: string | undefined;
  releve?: string | undefined;
  releves?: string | undefined;
  vision?: string | undefined;
  persona?: string | undefined;
  fiche?: string | undefined;
  usecase?: string | undefined;
  scenario?: string | undefined;
}): ProductDrawerRequest | null {
  if (asked.archiver === ARCHIVE_PANEL_CONFIRM) return { kind: "archive" };

  if (asked.indicateur !== undefined) {
    return asked.indicateur === INDICATOR_PANEL_NEW
      ? { kind: "indicator" }
      : { kind: "indicator", id: asked.indicateur };
  }

  if (asked.releve !== undefined) return { kind: "reading", id: asked.releve };
  if (asked.releves !== undefined)
    return { kind: "readings", id: asked.releves };

  if (asked.vision === VISION_PANEL_EDIT) return { kind: "vision" };

  if (asked.persona !== undefined) {
    return asked.persona === PERSONA_PANEL_NEW
      ? { kind: "persona" }
      : { kind: "persona", id: asked.persona };
  }

  if (asked.fiche !== undefined) {
    return { kind: "personaDetail", id: asked.fiche };
  }

  if (asked.usecase !== undefined) {
    return asked.usecase === USE_CASE_PANEL_NEW
      ? { kind: "useCase" }
      : { kind: "useCase", id: asked.usecase };
  }

  if (asked.scenario !== undefined) {
    return { kind: "useCaseDetail", id: asked.scenario };
  }

  return null;
}

/**
 * Les clés d'URL qui ouvrent un panneau **sur la page produit**.
 *
 * `de` et `a` n'y sont pas, et c'est tout leur sens : ce ne sont pas des clés
 * d'ouverture mais les bornes de la fenêtre de roadmap, et une fermeture ne
 * doit pas défaire un filtre. La même distinction que tient le décompte
 * d'exclusivité depuis le 17/08/2026.
 */
export const PRODUCT_PANEL_PARAMS = [
  ARCHIVE_PANEL_PARAM,
  INDICATOR_PANEL_PARAM,
  READING_PANEL_PARAM,
  READINGS_PANEL_PARAM,
  VISION_PANEL_PARAM,
  PERSONA_PANEL_PARAM,
  PERSONA_DETAIL_PARAM,
  USE_CASE_PANEL_PARAM,
  USE_CASE_DETAIL_PARAM,
] as const;
