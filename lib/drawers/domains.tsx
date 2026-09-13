/**
 * La résolution des panneaux de l'écran **au-dessus des domaines** — T9.4.
 *
 * **Jumeau de `lib/drawers/admin.tsx`, à une différence près qui est tout le
 * ticket** : il ne reçoit pas de `Session` mais un `SuperAdminGrant`. Un super
 * administrateur n'a ni domaine ni ligne `persons` (arbitrage (4) de
 * `tickets-C9.md`), donc pas de session — et pas de `session.db` : les lectures
 * passent par `asSuperAdmin(grant)`, qui **relit la ligne** avant chacune.
 *
 * **L'ordre est invariant dans chaque branche** : autorité → forme de l'UUID →
 * lecture → état de la ligne. La forme se vérifie avant la base parce qu'une
 * colonne `uuid` interrogée avec n'importe quoi rend un 500, pas un 404.
 *
 * **Rien de ce qui est rendu ici ne protège quoi que ce soit.** Un panneau
 * absent du rendu n'a jamais protégé le point d'entrée HTTP qui l'accompagne :
 * les sept actions redérivent l'autorité et leur condition sur ce qu'elles
 * **reçoivent**.
 *
 * **Deux hôtes depuis T12.4, une seule résolution.** Les cinq panneaux ciblés
 * s'ouvrent désormais sur la **fiche** de l'entreprise qu'ils visent, la liste
 * ne gardant que la création. **Rien de ce fichier n'a changé pour cela** au
 * dessus de cette ligne : c'est l'hôte qui change, et les deux chemins
 * d'ouverture — le clic par `DrawerHost`, l'adresse collée au rendu serveur —
 * traversent la même résolution qu'avant (TD.2). Ce que le déménagement ajoute
 * est en bas du fichier : **ce que chacun des deux écrans lit dans son
 * adresse**.
 */

import {
  DomainIdentitiesPanel,
  type DomainIdentityRow,
} from "@/components/admin/domain-identities-panel";
import { DomainIdentityPanel } from "@/components/admin/domain-identity-panel";
import { DomainManagerPanel } from "@/components/admin/domain-manager-panel";
import { DomainPanel } from "@/components/admin/domain-panel";
import { ConfirmPanel } from "@/components/ui/confirm-panel";
import { INVITATION_TTL_DAYS } from "@/lib/auth/invitation";
import { asSuperAdmin, type SuperAdminGrant } from "@/lib/db/scoped";
import { formatDomainStatus } from "@/lib/format";
import {
  ARCHIVE_PANEL_PARAM,
  DELETE_PANEL_PARAM,
  DOMAIN_IDENTITIES_PANEL_PARAM,
  DOMAIN_IDENTITY_PANEL_PARAM,
  DOMAIN_MANAGER_PANEL_PARAM,
  DOMAIN_PANEL_NEW,
  DOMAIN_PANEL_PARAM,
  DOMAIN_STATUS_PANEL_PARAM,
  ROUTES,
} from "@/lib/navigation";
import { isUuid } from "@/lib/uuid";

import type { DomainDrawerRequest, DrawerContent } from "./types";

import {
  addDomainIdentity,
  archiveDomain,
  createDomain,
  deleteDomain,
  designateDomainManager,
  removeDomainIdentity,
  suspendDomain,
} from "@/app/domaines/actions";

export async function resolveDomainDrawer(
  grant: SuperAdminGrant,
  request: DomainDrawerRequest,
): Promise<DrawerContent | null> {
  switch (request.kind) {
    case "domain":
      return {
        titleId: "panneau-domaine-titre",
        title: "Ajouter une entreprise cliente",
        subtitles: ["Au-dessus des domaines"],
        body: (
          <DomainPanel action={createDomain} expiryDays={INVITATION_TTL_DAYS} />
        ),
      };

    case "identities":
      return identities(grant, request.id);

    case "identity":
      return identityForm(grant, request.id);

    case "manager":
      return manager(grant, request.id);

    case "suspend":
      return suspend(grant, request.id);

    case "archive":
      return archive(grant, request.id);

    case "delete":
      return remove(grant, request.id);
  }
}

/**
 * Le domaine visé, ou rien.
 *
 * **Une seule porte pour les six panneaux ciblés**, et elle range dans l'ordre
 * ce que chacun aurait sinon récrit : la forme d'abord, la ligne ensuite. Un
 * identifiant d'une autre forme n'atteint jamais la base.
 */
async function openDomain(grant: SuperAdminGrant, id: string) {
  if (!isUuid(id)) return null;

  const domain = await asSuperAdmin(grant).listDomainsForAdmin();
  return domain.find((row) => row.id === id) ?? null;
}

async function identities(
  grant: SuperAdminGrant,
  id: string,
): Promise<DrawerContent | null> {
  const domain = await openDomain(grant, id);
  if (!domain) return null;

  const rows = await asSuperAdmin(grant).listDomainIdentities(domain.id);

  return {
    titleId: "panneau-identites-titre",
    title: "Identités vérifiées",
    subtitles: [domain.name],
    body: (
      <DomainIdentitiesPanel
        domainId={domain.id}
        domainName={domain.name}
        identities={rows satisfies readonly DomainIdentityRow[]}
        addIdentityHref={ROUTES.domainIdentityNew(domain.id)}
        removeIdentity={removeDomainIdentity.bind(null, domain.id)}
      />
    ),
  };
}

async function identityForm(
  grant: SuperAdminGrant,
  id: string,
): Promise<DrawerContent | null> {
  const domain = await openDomain(grant, id);
  if (!domain) return null;

  return {
    titleId: "panneau-identite-titre",
    title: "Ajouter une identité vérifiée",
    subtitles: [domain.name],
    body: <DomainIdentityPanel action={addDomainIdentity.bind(null, domain.id)} />,
  };
}

async function manager(
  grant: SuperAdminGrant,
  id: string,
): Promise<DrawerContent | null> {
  const domain = await openDomain(grant, id);
  if (!domain) return null;

  /* **La condition est vérifiée ici comme dans l'action**, et ce n'est pas une
     redite : l'écran évite un cul-de-sac, l'action tient la règle. Une fois un
     compte posé, la suite se passe à l'intérieur du domaine — c'est le
     responsable désigné qui désigne les suivants, jamais le super
     administrateur, qui n'entre pas dans les entreprises.

     **La seconde moitié vient de T11.4** : un domaine dont l'invitation est en
     attente n'accepte pas une seconde désignation, faute de quoi deux liens
     ouvriraient le même premier compte. Le geste se révoque et se refait. */
  if (domain.hasAccount || domain.hasPendingInvitation) return null;

  return {
    titleId: "panneau-responsable-titre",
    title: "Désigner le premier responsable",
    subtitles: [domain.name],
    body: (
      <DomainManagerPanel
        action={designateDomainManager.bind(null, domain.id)}
        expiryDays={INVITATION_TTL_DAYS}
      />
    ),
  };
}

async function suspend(
  grant: SuperAdminGrant,
  id: string,
): Promise<DrawerContent | null> {
  const domain = await openDomain(grant, id);
  if (!domain || domain.archivedAt || domain.status !== "active") return null;

  return {
    titleId: "panneau-confirmation-titre",
    title: "Suspendre cette entreprise",
    subtitles: [domain.name, formatDomainStatus(domain)],
    body: (
      <ConfirmPanel
        action={suspendDomain.bind(null, domain.id)}
        submitLabel="Suspendre cette entreprise"
        pendingLabel="Suspension…"
      >
        <div className="flex flex-col gap-3 text-sm text-content-neutral-dark">
          <p>
            Personne de cette entreprise ne pourra plus ouvrir de session, dès
            la requête suivante. Ce qui est saisi reste en place et rien
            n&apos;est supprimé.
          </p>
          <p>Le geste se défait : une entreprise suspendue se rétablit.</p>
        </div>
      </ConfirmPanel>
    ),
  };
}

async function archive(
  grant: SuperAdminGrant,
  id: string,
): Promise<DrawerContent | null> {
  const domain = await openDomain(grant, id);
  if (!domain || domain.archivedAt) return null;

  return {
    titleId: "panneau-confirmation-titre",
    title: "Archiver cette entreprise",
    subtitles: [domain.name, formatDomainStatus(domain)],
    body: (
      <ConfirmPanel
        action={archiveDomain.bind(null, domain.id)}
        submitLabel="Archiver cette entreprise"
        pendingLabel="Archivage…"
      >
        <div className="flex flex-col gap-3 text-sm text-content-neutral-dark">
          <p>
            L&apos;entreprise quitte la liste des clientes et plus personne
            n&apos;y ouvre de session. Rien n&apos;est supprimé : ses produits,
            ses accompagnements et son journal restent en base.
          </p>
          <p>
            Le geste se défait : une entreprise archivée se rétablit, et
            retrouve le statut qu&apos;elle avait.
          </p>
        </div>
      </ConfirmPanel>
    ),
  };
}

/**
 * La confirmation de suppression — **le seul panneau de cet écran qui refuse
 * sur une lecture, et non sur une colonne**.
 *
 * **Il n'ouvre que sur une entreprise vide.** La condition est vérifiée ici
 * comme dans l'action, et ce n'est pas une redite : l'écran évite un cul-de-sac,
 * l'action tient la règle — *un panneau absent du rendu n'a jamais protégé le
 * point d'entrée HTTP qui l'accompagne*.
 *
 * **Il s'offre sur une entreprise vivante comme archivée**, et c'est le choix de
 * `deleteProject` : *ranger puis effacer est le chemin naturel*. Rien ici ne
 * dépend du statut ni de `archived_at`.
 *
 * **Il nomme ce que le geste emporte, il ne le chiffre pas.** Le panneau de
 * l'accompagnement compte ses activités parce que le décompte est la seule
 * information qui aide à décider ; ici il n'y a rien à compter — ce qui part est
 * ce que l'amorçage a écrit, toujours le même, et jamais une donnée saisie.
 */
async function remove(
  grant: SuperAdminGrant,
  id: string,
): Promise<DrawerContent | null> {
  const domain = await openDomain(grant, id);
  if (!domain) return null;

  const emptiness = await asSuperAdmin(grant).domainEmptiness(domain.id);
  if (!emptiness.empty) return null;

  return {
    titleId: "panneau-confirmation-titre",
    title: "Supprimer cette entreprise",
    subtitles: [domain.name, formatDomainStatus(domain)],
    body: (
      <ConfirmPanel
        action={deleteDomain.bind(null, domain.id)}
        submitLabel="Supprimer définitivement"
        pendingLabel="Suppression…"
      >
        <div className="flex flex-col gap-3 text-sm text-content-neutral-dark">
          {/* Ce que le geste a d'exceptionnel, **avant** qu'on le propose : la
              ligne est effacée de la base, elle n'est pas rangée. */}
          <p className="font-semibold">
            Ce geste ne se défait pas. L&apos;entreprise est effacée de la base,
            elle n&apos;est pas rangée.
          </p>

          <p>
            Personne n&apos;est jamais entré dans cette entreprise et rien n&apos;y
            a été saisi. Sont effacés avec elle ses référentiels par défaut, ses
            identités vérifiées, son invitation d&apos;amorçage et son journal
            d&apos;administration.
          </p>

          <p>
            Une entreprise où quelqu&apos;un est entré, ou qui porte le moindre
            produit, ne s&apos;efface pas : elle s&apos;archive.
          </p>
        </div>
      </ConfirmPanel>
    ),
  };
}

/**
 * De l'URL à la demande — le second chemin d'ouverture, celui du rendu serveur.
 *
 * **Les deux chemins traversent la même résolution** : coller une adresse ouvre
 * exactement ce qu'un clic ouvre, et aucune règle ne vit à deux endroits.
 *
 * **Privée depuis T12.4** : deux écrans la servent désormais, et chacun n'en
 * prend pas la même part. Ce qu'ils exportent est en dessous.
 */
function domainRequestFromParams(asked: {
  domaine?: string | undefined;
  identites?: string | undefined;
  identite?: string | undefined;
  responsable?: string | undefined;
  suspendre?: string | undefined;
  archiver?: string | undefined;
  supprimer?: string | undefined;
}): DomainDrawerRequest | null {
  /* **La création n'accepte qu'une valeur**, et toute autre n'ouvre rien : il
     n'y a pas de correction d'entreprise, donc aucun identifiant n'a de sens
     ici. La forme se vérifie avant la base, partout. */
  if (asked.domaine !== undefined) {
    return asked.domaine === DOMAIN_PANEL_NEW ? { kind: "domain" } : null;
  }

  if (asked.identites !== undefined) {
    return { kind: "identities", id: asked.identites };
  }

  if (asked.identite !== undefined) {
    return { kind: "identity", id: asked.identite };
  }

  if (asked.responsable !== undefined) {
    return { kind: "manager", id: asked.responsable };
  }

  if (asked.suspendre !== undefined) {
    return { kind: "suspend", id: asked.suspendre };
  }

  if (asked.archiver !== undefined) {
    return { kind: "archive", id: asked.archiver };
  }

  if (asked.supprimer !== undefined) {
    return { kind: "delete", id: asked.supprimer };
  }

  return null;
}

/* ==========================================================================
   Ce que chacun des deux écrans lit dans son adresse — T12.4

   **Le décompte d'exclusivité vient de `app/domaines/page.tsx`**, où il était
   recopié depuis les quatre pages qui le portent déjà. Il descend ici parce
   qu'il y a désormais **deux** hôtes : l'y laisser aurait fait une règle à deux
   endroits, et T12.4 déménage les gestes sans multiplier les règles.

   **Écrit en décompte et non en comparaison**, comme partout ailleurs : c'est
   la propriété pour laquelle T4.4 l'avait écrit ainsi — une clé de plus ne
   change pas un caractère.
   ========================================================================== */

/** Une valeur d'URL, réduite à la première quand Next en rend plusieurs. */
function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

type SearchParams = Record<string, string | string[] | undefined>;

/** Les sept clés d'une adresse, et rien d'autre — plusieurs ensemble n'ouvrent rien. */
function askedKeys(params: SearchParams) {
  const asked = {
    [DOMAIN_PANEL_PARAM]: one(params[DOMAIN_PANEL_PARAM]),
    [DOMAIN_IDENTITIES_PANEL_PARAM]: one(params[DOMAIN_IDENTITIES_PANEL_PARAM]),
    [DOMAIN_IDENTITY_PANEL_PARAM]: one(params[DOMAIN_IDENTITY_PANEL_PARAM]),
    [DOMAIN_MANAGER_PANEL_PARAM]: one(params[DOMAIN_MANAGER_PANEL_PARAM]),
    [DOMAIN_STATUS_PANEL_PARAM]: one(params[DOMAIN_STATUS_PANEL_PARAM]),
    [ARCHIVE_PANEL_PARAM]: one(params[ARCHIVE_PANEL_PARAM]),
    [DELETE_PANEL_PARAM]: one(params[DELETE_PANEL_PARAM]),
  };

  const present = Object.values(asked).filter((value) => value !== undefined);
  return present.length > 1 ? {} : asked;
}

/**
 * Ce que **la liste** ouvre : le panneau de création, et lui seul — T12.4.
 *
 * **La liste redevient une liste.** Les cinq panneaux ciblés ont déménagé sur la
 * fiche de l'entreprise qu'ils visent (arbitrage (1) de `tickets-C12.md`), et
 * les adresses qui les portaient sur cet écran n'ouvrent donc plus rien. Ce
 * qu'elle garde est le seul geste qui **ne vise aucune ligne**.
 *
 * **La règle de la valeur reste dans `domainRequestFromParams`** : `nouveau`
 * ouvre, toute autre valeur n'ouvre rien. La récrire ici l'aurait mise à deux
 * endroits pour économiser un appel.
 */
export function domainListRequest(
  params: SearchParams,
): DomainDrawerRequest | null {
  const asked = askedKeys(params);
  const request = domainRequestFromParams(asked);

  return request?.kind === "domain" ? request : null;
}

/**
 * Ce que **la fiche** ouvre : les sept panneaux, sur son entreprise — T12.4,
 * plus la suppression (12/09/2026).
 *
 * **L'appartenance est la contrepartie de la clé qui garde son identifiant.**
 * Le chemin porte déjà l'entreprise ; la clé la répète, parce que la résolution
 * **confronte ce qu'elle reçoit** et que la lui retirer demanderait une seconde
 * forme de `DomainDrawerRequest`. En échange, la fiche refuse une clé qui ne
 * désigne pas son objet : sur la fiche de A, `?identites=<B>` n'ouvre rien —
 * c'est le geste de l'exclusivité, déjà écrit en décompte sur cinq pages,
 * appliqué à l'appartenance.
 *
 * **Elle ne protège rien, et il n'y a rien à y protéger.** Les six panneaux
 * ciblés ne montrent que ce qu'un super administrateur voit déjà de la liste, et
 * `resolveDomainDrawer` relit l'autorité puis la ligne dans tous les cas. Ce
 * qu'elle tient est une **cohérence d'écran** : une fiche qui ouvrirait le
 * panneau d'une autre entreprise agirait sur ce qu'elle ne nomme pas, et c'est
 * précisément le défaut que ce ticket referme.
 *
 * **Elle ne vaut que pour ce chemin-ci**, celui du rendu serveur. Le clic passe
 * par `loadDomainDrawer`, qui ne sait pas de quelle page il vient — et les seuls
 * liens de la fiche visent son entreprise. Fait consigné au journal technique.
 *
 * **`domaine=nouveau` ouvre ici aussi**, et c'est une adresse, pas un point
 * d'entrée : la fiche n'affiche aucun lien vers la création, qui reste le geste
 * de la liste. Le refuser aurait demandé une septième branche pour interdire ce
 * qu'aucun écran ne propose.
 */
export function domainPageRequest(
  domainId: string,
  params: SearchParams,
): DomainDrawerRequest | null {
  const request = domainRequestFromParams(askedKeys(params));
  if (!request) return null;

  return request.kind === "domain" || request.id === domainId ? request : null;
}

/**
 * Les clés d'URL qui ouvrent un panneau **sur l'un des deux écrans**.
 *
 * `DrawerHost` les retire au montage ; toute autre clé survit. Ni la liste ni la
 * fiche n'a de sélecteur à préserver.
 *
 * **Une seule liste pour les deux hôtes**, bien que la liste n'en résolve plus
 * qu'une depuis T12.4 : ce qu'un hôte retire à la fermeture est ce qui ne doit
 * pas rester dans l'adresse, et une clé morte sur un écran n'a pas plus à y
 * rester qu'une clé vivante.
 */
export const DOMAIN_PANEL_PARAMS = [
  DOMAIN_PANEL_PARAM,
  DOMAIN_IDENTITIES_PANEL_PARAM,
  DOMAIN_IDENTITY_PANEL_PARAM,
  DOMAIN_MANAGER_PANEL_PARAM,
  DOMAIN_STATUS_PANEL_PARAM,
  ARCHIVE_PANEL_PARAM,
  DELETE_PANEL_PARAM,
] as const;
