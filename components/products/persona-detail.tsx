/**
 * La **fiche d'un persona**, en panneau latéral — ce que la carte résume
 * (18/08/2026).
 *
 * **Ce n'est pas un panneau de saisie**, et il ne ressemble donc pas aux sept
 * autres : aucun formulaire de saisie, aucun `useActionState`, aucun bouton
 * d'envoi. C'est une **lecture**, et il reste rendu sur le serveur — comme
 * `readings-panel.tsx`, le seul autre panneau du projet dans ce cas.
 *
 * Il ne réutilise pas `Panel` pour cette raison exacte : le corps de TD.1
 * enveloppe ses `children` dans un `<form>` et exige un dispatch, une attente et
 * un libellé d'envoi. Les emprunter pour une fiche aurait demandé de rendre
 * `Panel` générique sur ce qu'il n'est pas.
 *
 * **Sa coquille l'a quitté en TD.2**, et c'est ce qui lui permet de rester
 * serveur : le voile, le tiroir et la croix vivent dans `DrawerHost`, qui est
 * client et porte donc la fermeture.
 *
 * **Il garde son en-tête**, et c'est le seul panneau dans ce cas : le portrait
 * et l'étiquette « Principal » à côté du nom ne se disent pas en deux lignes de
 * texte. `DrawerContent.header` existe pour lui — le descendre dans le corps
 * aurait défait la ressemblance avec la carte qu'il détaille.
 *
 * **Il se lit par tout le domaine** (D9), à la différence du panneau de saisie :
 * c'est pourquoi son ouverture ne passe par aucun droit. Ce sont ses **deux
 * gestes** qui tombent avec lui, chacun à `null`.
 *
 * **Les trois listes sont des listes**, pas des paragraphes : un objectif est
 * une ligne de `persona_traits`, et le balisage le dit — c'est ce qui rend la
 * fiche lisible à la voix autant qu'à l'œil, et ce qui rendra un trait
 * désignable le jour où un use case le citera.
 *
 * **Rien n'est calculé d'une ligne à l'autre** : ni décompte de complétude, ni
 * couverture, ni comparaison entre personae. On affiche ce qui a été saisi.
 */

import { ACTION_LINK } from "@/components/ui/action-link";
import { Avatar } from "@/components/ui/avatar";
import { DrawerLink } from "@/components/ui/drawer";
import { Tag } from "@/components/ui/tag";
import type {
  PersonaTrait,
  PersonaTraitKind,
  ProductPersona,
} from "@/lib/queries/personas";

/**
 * Les trois familles, dans l'ordre où la lecture les rend — et la phrase qui
 * remplace chacune quand elle est vide.
 *
 * L'état vide d'une liste est **une phrase, pas un `EmptyState`** : la règle de
 * `readings-panel.tsx` et de `Resources` — un état vide dans un panneau n'a pas
 * de titre à porter, le panneau en a déjà un.
 */
const FAMILIES: readonly {
  kind: PersonaTraitKind;
  title: string;
  empty: string;
}[] = [
  {
    kind: "goal",
    title: "Objectifs",
    empty:
      "Aucun objectif saisi pour l'instant — ce que ce profil cherche à faire.",
  },
  {
    kind: "pain",
    title: "Irritants",
    empty:
      "Aucun irritant saisi pour l'instant — ce qui le bloque ou le ralentit aujourd'hui.",
  },
  {
    kind: "expectation",
    title: "Attentes",
    empty: "Aucune attente saisie pour l'instant — ce qu'il attend du produit.",
  },
];

/**
 * L'en-tête de la fiche, que la coquille rend à la place du couple
 * titre / sous-titres. Il porte lui-même le `<h2>` que `aria-labelledby`
 * désigne.
 */
export function PersonaDetailHeader({
  productName,
  persona,
}: {
  productName: string;
  persona: ProductPersona;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3.5">
      <PersonaImage persona={persona} />
      <div className="flex min-w-0 flex-col gap-1">
        <h2
          id="panneau-persona-titre"
          className="text-md font-semibold text-content-neutral-darkest"
        >
          {persona.name}
        </h2>
        <p className="text-xs text-content-neutral-base">
          {persona.role ? `${productName} · ${persona.role}` : productName}
        </p>
        {persona.kind === "primary" ? (
          <span className="mt-1">
            <Tag label="Principal" />
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function PersonaDetail({
  persona,
  traits,
  editHref,
  archivePersona,
}: {
  persona: ProductPersona;
  /** Les traits de **ce** persona, déjà triés par famille puis par position. */
  traits: PersonaTrait[];
  /** `null` retire le geste — le composant ne connaît aucun droit. */
  editHref: string | null;
  archivePersona: (() => Promise<void>) | null;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
      {persona.summary ? (
        <p className="text-sm leading-175 text-content-neutral-dark">
          {persona.summary}
        </p>
      ) : null}

      {FAMILIES.map((family) => (
        <Family
          key={family.kind}
          title={family.title}
          empty={family.empty}
          items={traits.filter((trait) => trait.kind === family.kind)}
        />
      ))}

      {/* Un `div` et non un `span` : `<form>` est du contenu de flux, et un
            élément de phrasé ne l'accepte pas — le balisage servi serait réécrit
            par le navigateur. La règle de `readings-panel.tsx`. */}
      {editHref || archivePersona ? (
        <div className="flex flex-wrap items-center gap-4 border-t border-surface-neutral-lighter pt-4">
          {editHref ? (
            <DrawerLink
              href={editHref}
              request={{ kind: "persona", id: persona.id }}
              aria-label={`Modifier le persona ${persona.name}`}
              className={ACTION_LINK}
            >
              Modifier ce persona
            </DrawerLink>
          ) : null}
          {archivePersona ? (
            /* Un formulaire nu : ni confirmation (arbitrage (c) de
                 `tickets-C4bis.md`), ni motif. « Archiver » est le mot de
                 l'arbitrage (d), jamais « Supprimer » : rien n'est supprimé
                 (règle 4) — le persona quitte le bloc, ses traits restent avec
                 lui. */
            <form action={archivePersona}>
              <button
                type="submit"
                aria-label={`Archiver le persona ${persona.name}`}
                className={ACTION_LINK}
              >
                Archiver ce persona
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Une famille de traits : son intitulé, puis ses lignes — ou sa phrase. */
function Family({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: PersonaTrait[];
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-2xs font-semibold uppercase text-content-neutral-dark">
        {title}
      </h3>
      {items.length > 0 ? (
        <ul
          role="list"
          className="flex flex-col gap-1.5 text-sm leading-175 text-content-neutral-darkest"
        >
          {items.map((trait) => (
            <li key={trait.id} className="flex gap-2.5">
              <span
                aria-hidden="true"
                className="mt-2 h-1 w-1 flex-none rounded-full bg-content-neutral-base"
              />
              <span className="min-w-0">{trait.label}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-175 text-content-neutral-base">{empty}</p>
      )}
    </section>
  );
}

/**
 * Le portrait de la fiche, ou les initiales à défaut — le jumeau de celui du
 * bloc, en plus grand, et pour les mêmes raisons (voir `personas.tsx`).
 */
function PersonaImage({ persona }: { persona: ProductPersona }) {
  if (!persona.imageUrl) {
    return <Avatar name={persona.name} className="h-12 w-12 text-xs" />;
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
      className="h-12 w-12 flex-none rounded-full object-cover"
    />
  );
}
