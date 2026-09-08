/**
 * Le panneau « Identités vérifiées » d'une entreprise — T9.4.
 *
 * **Ce n'est pas un panneau de saisie**, et il ne ressemble donc pas aux trois
 * autres de cet écran : aucun formulaire d'ensemble, aucun `useActionState`,
 * aucun bouton d'envoi. C'est une **liste**, et il reste rendu sur le serveur —
 * d'où l'absence de `"use client"`. C'est exactement la forme de
 * `readings-panel.tsx`, et pour la même raison : `Panel` enveloppe ses
 * `children` dans un `<form>` et exige un dispatch, une attente et un libellé
 * d'envoi. Les emprunter pour une liste aurait demandé de rendre `Panel`
 * générique sur ce qu'il n'est pas.
 *
 * **L'ajout ouvre un autre panneau sans fermer celui-ci** : c'est un
 * `DrawerLink`, et la coquille échange son corps au lieu de naviguer.
 *
 * **Le retrait est un formulaire muet**, comme l'archivage d'un relevé : une
 * identité retirée se ressaisit, et un geste qui se défait n'a rien à faire
 * annoncer. Le mot est « Retirer » et non « Archiver » — `domain_identities`
 * n'a pas d'`archived_at`, et c'est structurel : *un rattachement se retire, il
 * ne s'archive pas* (T9.1). La règle 4 protège la donnée métier ; une identité
 * vérifiée est un lien.
 *
 * **La dernière identité ne porte pas le geste**, et la phrase dit pourquoi.
 * **Ce n'est pas l'écran qui protège** : l'action refuse le retrait de la
 * dernière sur ce qu'elle **reçoit**, et c'est le décompte en base qui tranche.
 * Un bouton absent du rendu n'a jamais protégé le point d'entrée qui
 * l'accompagne — ici il évite un cul-de-sac, rien de plus.
 */

import { ACTION_LINK } from "@/components/ui/action-link";
import { DrawerLink } from "@/components/ui/drawer";
import { BlockNote } from "@/components/ui/empty-state";
import { formatIdentityProvider } from "@/lib/format";
import type { IdentityProviderValue } from "@/lib/forms/domain";

export type DomainIdentityRow = {
  id: string;
  provider: IdentityProviderValue;
  value: string;
};

export function DomainIdentitiesPanel({
  domainId,
  domainName,
  identities,
  addIdentityHref,
  removeIdentity,
}: {
  domainId: string;
  /** Pour nommer les gestes : « Retirer » seul ne dit pas laquelle. */
  domainName: string;
  /** Les identités de **cette** entreprise, reçues triées. */
  identities: readonly DomainIdentityRow[];
  addIdentityHref: string;
  removeIdentity: (identityId: string) => Promise<void>;
}) {
  /* **Le seuil est ici plutôt que par ligne** : ce qui interdit le retrait
     n'est pas la ligne, c'est qu'il n'en resterait aucune. */
  const removable = identities.length > 1;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
      <p className="text-sm leading-175 text-content-neutral-dark">
        Ce que le fournisseur d&apos;identité vérifie pour rattacher un compte à
        cette entreprise. Jamais le domaine d&apos;une adresse e-mail, qui peut
        être un alias.
      </p>

      <DrawerLink
        href={addIdentityHref}
        request={{ kind: "identity", id: domainId }}
        className={ACTION_LINK}
      >
        Ajouter une identité
      </DrawerLink>

      {identities.length > 0 ? (
        <ul role="list" className="flex flex-col gap-3">
          {identities.map((identity) => (
            <li
              key={identity.id}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-surface-neutral-lighter pt-3 first:border-t-0 first:pt-0"
            >
              <span className="text-xs text-content-neutral-base">
                <span className="font-semibold text-content-neutral-dark">
                  {identity.value}
                </span>
                <span aria-hidden="true">{" · "}</span>
                <span className="sr-only">vérifiée par </span>
                {formatIdentityProvider(identity.provider)}
              </span>

              {/* Un `div` et non un `span` : `<form>` est du contenu de flux, et
                  un élément de phrasé ne l'accepte pas — le balisage servi
                  serait réécrit par le navigateur. */}
              {removable ? (
                <div className="flex flex-wrap items-center gap-4">
                  <form action={removeIdentity.bind(null, identity.id)}>
                    <button
                      type="submit"
                      aria-label={`Retirer l'identité ${identity.value} de ${domainName}`}
                      className={ACTION_LINK}
                    >
                      Retirer
                    </button>
                  </form>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        /* Un paragraphe et non un `EmptyState` — la règle des panneaux : un état
           vide n'a pas de titre à porter, le panneau en a déjà un. */
        <BlockNote>
          Aucune identité vérifiée. Tant qu&apos;il n&apos;y en a pas, aucun
          jeton ne désigne cette entreprise : personne ne peut s&apos;y
          connecter.
        </BlockNote>
      )}

      {identities.length === 1 ? (
        <BlockNote>
          Une entreprise garde au moins une identité vérifiée. Pour remplacer
          celle-ci, ajouter la nouvelle d&apos;abord.
        </BlockNote>
      ) : null}
    </div>
  );
}
