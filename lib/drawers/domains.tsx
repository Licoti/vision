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
 * les six actions redérivent l'autorité et leur condition sur ce qu'elles
 * **reçoivent**.
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
  }
}

/**
 * Le domaine visé, ou rien.
 *
 * **Une seule porte pour les cinq panneaux ciblés**, et elle range dans l'ordre
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
 * De l'URL à la demande — le second chemin d'ouverture, celui du rendu serveur.
 *
 * **Les deux chemins traversent la même résolution** : coller une adresse ouvre
 * exactement ce qu'un clic ouvre, et aucune règle ne vit à deux endroits.
 */
export function domainRequestFromParams(asked: {
  domaine?: string | undefined;
  identites?: string | undefined;
  identite?: string | undefined;
  responsable?: string | undefined;
  suspendre?: string | undefined;
  archiver?: string | undefined;
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

  return null;
}

/**
 * Les clés d'URL qui ouvrent un panneau **sur l'écran des domaines**.
 *
 * `DrawerHost` les retire au montage ; toute autre clé survit. L'écran n'a pas
 * de sélecteur à préserver — il n'en a qu'une liste.
 */
export const DOMAIN_PANEL_PARAMS = [
  DOMAIN_PANEL_PARAM,
  DOMAIN_IDENTITIES_PANEL_PARAM,
  DOMAIN_IDENTITY_PANEL_PARAM,
  DOMAIN_MANAGER_PANEL_PARAM,
  DOMAIN_STATUS_PANEL_PARAM,
  ARCHIVE_PANEL_PARAM,
] as const;
