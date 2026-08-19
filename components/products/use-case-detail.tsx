/**
 * La **fiche d'un use case**, en panneau latéral — ce que la carte résume
 * (19/08/2026).
 *
 * **Ce n'est pas un panneau de saisie**, et il ne ressemble donc pas aux sept
 * panneaux de formulaire : aucun `useActionState`, aucun bouton d'envoi. C'est
 * une **lecture**, et il reste rendu sur le serveur — comme `PersonaDetail` et
 * `ReadingsPanel`, les deux autres panneaux du dépôt dans ce cas. Il ne
 * réutilise pas `Panel` pour cette raison exacte : le corps de TD.1 enveloppe
 * ses `children` dans un `<form>` et exige un dispatch, une attente et un
 * libellé d'envoi.
 *
 * **Il garde le couple titre / sous-titre de la coquille**, à la différence de
 * `PersonaDetail` : `DrawerContent.header` reste l'exception que le portrait
 * d'un persona justifie seul. Un titre de scénario et le nom du produit se
 * disent en deux lignes de texte.
 *
 * **Il se lit par tout le domaine** (D9), comme le bloc qui le porte : son
 * ouverture ne passe par aucun droit. Ce sont ses **deux gestes** qui tombent
 * avec lui, chacun à `null`.
 *
 * **Le chemin `Use Case → Persona` est ici, et c'est le seul endroit où il
 * existe.** Chaque persona rattaché est un point d'entrée vers sa propre fiche :
 * d'un scénario on ouvre le profil qu'il sert, dans le même panneau et sans
 * quitter la page. C'est ce qui fait de la chaîne `Personae → Use Cases` un
 * chemin parcourable plutôt qu'un schéma — et le mécanisme est acquis, le corps
 * du panneau étant rendu **à l'intérieur** du contexte de `DrawerHost`.
 *
 * **Rien n'est calculé d'une ligne à l'autre** : ni décompte de personae, ni
 * couverture, ni comparaison entre use cases. On affiche ce qui a été saisi.
 */

import { ACTION_LINK } from "@/components/ui/action-link";
import { Avatar } from "@/components/ui/avatar";
import { DrawerLink } from "@/components/ui/drawer";
import { BlockNote } from "@/components/ui/empty-state";
import { Tag } from "@/components/ui/tag";
import type { ProductPersona } from "@/lib/queries/personas";
import type { ProductUseCase } from "@/lib/queries/use-cases";

export function UseCaseDetail({
  useCase,
  personas,
  personaHref,
  editHref,
  archiveUseCase,
}: {
  useCase: ProductUseCase;
  /** Les personae de **ce** use case, déjà résolus et dans l'ordre du bloc. */
  personas: ProductPersona[];
  /** La fiche d'un persona se lit par tout le domaine (D9) : jamais nul. */
  personaHref: (personaId: string) => string;
  /** `null` retire le geste — le composant ne connaît aucun droit. */
  editHref: string | null;
  archiveUseCase: (() => Promise<void>) | null;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
      {/* La description **en entier**, là où la carte la tronquait : c'est
          toute la raison d'être de ce panneau. */}
      <p className="text-sm leading-175 text-content-neutral-dark">
        {useCase.summary}
      </p>

      <section className="flex flex-col gap-2">
        <h3 className="text-2xs font-semibold uppercase text-content-neutral-dark">
          Personae associés
        </h3>

        {personas.length > 0 ? (
          <ul role="list" className="flex flex-col gap-1">
            {personas.map((persona) => (
              <li key={persona.id}>
                <PersonaRow
                  persona={persona}
                  href={personaHref(persona.id)}
                />
              </li>
            ))}
          </ul>
        ) : (
          /* Une phrase, pas un `EmptyState` : un état vide dans un panneau n'a
             pas de titre à porter, le panneau en a déjà un. La règle de
             `readings-panel.tsx` et de `PersonaDetail`.

             Elle ne reproche rien — le rattachement est facultatif (arbitrage
             du 19/08/2026) —, elle dit ce qu'un rattachement apporterait. */
          <BlockNote>
            Aucun persona rattaché pour l&apos;instant — les profils que ce
            scénario sert.
          </BlockNote>
        )}
      </section>

      {/* Un `div` et non un `span` : `<form>` est du contenu de flux, et un
          élément de phrasé ne l'accepte pas — le balisage servi serait réécrit
          par le navigateur. La règle de `readings-panel.tsx`. */}
      {editHref || archiveUseCase ? (
        <div className="flex flex-wrap items-center gap-4 border-t border-surface-neutral-lighter pt-4">
          {editHref ? (
            <DrawerLink
              href={editHref}
              request={{ kind: "useCase", id: useCase.id }}
              aria-label={`Modifier le use case ${useCase.title}`}
              className={ACTION_LINK}
            >
              Modifier ce use case
            </DrawerLink>
          ) : null}
          {archiveUseCase ? (
            /* Un formulaire nu : ni confirmation (arbitrage (c) de
               `tickets-C4bis.md`), ni motif. « Archiver » est le mot de
               l'arbitrage (d), jamais « Supprimer » : rien n'est supprimé
               (règle 4) — le use case quitte le bloc, ses rattachements
               restent avec lui. */
            <form action={archiveUseCase}>
              <button
                type="submit"
                aria-label={`Archiver le use case ${useCase.title}`}
                className={ACTION_LINK}
              >
                Archiver ce use case
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Un persona rattaché : sa pastille, son nom, son rôle, et son rang quand il
 * est principal.
 *
 * **La ligne entière est le lien**, et ce lien ouvre la **fiche du persona** —
 * il remplace le contenu du panneau plutôt que de naviguer. Un seul arrêt de
 * tabulation par persona, comme sur la carte du bloc voisin.
 *
 * `?fiche=<identifiant>` reste l'adresse de repli : sans JavaScript, le clic
 * charge la page produit avec la fiche du persona ouverte — le même endroit,
 * par l'autre chemin.
 */
function PersonaRow({
  persona,
  href,
}: {
  persona: ProductPersona;
  href: string;
}) {
  return (
    <DrawerLink
      href={href}
      request={{ kind: "personaDetail", id: persona.id }}
      className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm"
    >
      <PersonaImage persona={persona} />

      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <span className="font-semibold text-content-neutral-darkest">
          {persona.name}
        </span>
        {persona.role ? (
          <span className="text-xs text-content-neutral-base">
            {persona.role}
          </span>
        ) : null}
        {persona.kind === "primary" ? <Tag label="Principal" /> : null}
      </span>
    </DrawerLink>
  );
}

/**
 * Le portrait, ou les initiales à défaut — le cadet de ceux du bloc et de la
 * fiche de persona, et pour les mêmes raisons (voir `personas.tsx`).
 */
function PersonaImage({ persona }: { persona: ProductPersona }) {
  if (!persona.imageUrl) {
    return <Avatar name={persona.name} className="h-8 w-8" />;
  }

  return (
    // Adresse externe arbitraire, jamais un fichier hébergé par Vision : les
    // deux raisons de ne pas passer par `next/image` sont dans `personas.tsx`.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={persona.imageUrl}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      className="h-8 w-8 flex-none rounded-full object-cover"
    />
  );
}
