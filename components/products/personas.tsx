/**
 * Le rang « Personae » — **pour qui** ce produit est conçu (18/08/2026).
 *
 * **Ce n'est plus un bloc depuis le 21/08/2026** : c'est le premier des deux
 * rangs d'« Utilisateurs et usages » (`audience.tsx`), avec « Use Cases ». Les
 * deux répondaient à la même question sous deux titres, et deux cartes posées
 * l'une sous l'autre repoussaient les accompagnements hors de l'écran. La
 * distinction reste entière — un intertitre, une grille de cartes qui n'a pas
 * changé —, elle a seulement cessé d'être une carte de plus.
 *
 * Il complète le bloc de tête : « Vision produit » dit pourquoi le produit
 * existe et ce qu'il mesure, celui-ci dit à qui il s'adresse. Le bloc
 * « Accompagnements », entre les deux, dit ce qu'on a fait.
 *
 * **Un persona n'est pas un contenu éditorial**, et le bloc ne le rend pas comme
 * tel : c'est un référentiel rattaché au produit, dont chaque ligne porte un
 * identifiant stable qu'un parcours ou un use case pourra désigner le jour où
 * ces objets existeront.
 *
 * **La carte résume, la fiche détaille.** La carte porte l'image, le nom et le
 * rôle — ce qui se reconnaît d'un coup d'œil ; tout le reste vit dans le panneau
 * de détail, ouvert par un clic (`?fiche=<identifiant>`). C'est ce qui garde la
 * page compacte quand un produit portera huit personae.
 *
 * **Composant serveur**, comme `Indicators` et `Resources` : il n'a aucun état.
 * Il ne connaît aucun droit non plus — les points d'entrée arrivent à `null`
 * quand ils ne doivent pas paraître, et c'est l'appelant qui en décide. Un
 * point d'entrée absent du rendu ne protège rien : les trois actions redérivent
 * le droit sur les identifiants reçus.
 *
 * **Son geste d'ajout vit dans le menu du bloc** depuis la fusion : un rang ne
 * porte pas d'en-tête, donc pas d'action d'en-tête. Le paragraphe d'absence le
 * reprend en lien inline — c'est le seul endroit où ce rang l'écrit.
 *
 * **Aucun décompte de complétude, aucune couverture, aucune jauge** : un persona
 * ne se note pas, et D39 interdit tout indice calculé par Vision pour qualifier
 * un produit.
 */

import { DrawerLink } from "@/components/ui/drawer";

import { ACTION_LINK } from "@/components/ui/action-link";
import { Avatar } from "@/components/ui/avatar";
import { BlockDivider } from "@/components/ui/block";
import { BlockNote } from "@/components/ui/empty-state";
import { Tag } from "@/components/ui/tag";
import type { ProductPersona } from "@/lib/queries/personas";

export function PersonasRank({
  personas,
  detailHref,
  addHref,
}: {
  /** Les personae vivants du produit, **déjà triés** : aucun tri ne se rejoue. */
  personas: ProductPersona[];
  /** La fiche se lit par tout le domaine (D9) : ce lien n'est jamais nul. */
  detailHref: (personaId: string) => string;
  /** `null` retire le point d'entrée — le composant ne connaît aucun droit. */
  addHref: string | null;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* L'intertitre du bloc partagé, et le seul endroit où ce rang se nomme.
          Son filet est celui de la tonalité neutre : sur la surface bleue de
          « Vision produit » ce n'en serait pas le bon, et un séparateur qui ne
          suivrait pas sa carte se verrait. */}
      <BlockDivider
        title="Personae"
        note="Les profils pour lesquels ce produit est conçu."
        rule="bg-surface-neutral-lighter"
      />

      {personas.length > 0 ? (
        /* Une grille de cartes, et non une `List` : celle-ci est dense et
           verticale, faite pour comparer des lignes. Ici on reconnaît un
           visage et un rôle, pas on ne compare des colonnes. */
        <ul role="list" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {personas.map((persona) => (
            <li key={persona.id} className="min-w-0">
              <PersonaCard persona={persona} href={detailHref(persona.id)} />
            </li>
          ))}
        </ul>
      ) : (
        /* **Un paragraphe et non un `EmptyState`**, depuis la fusion — et c'est
           le critère écrit dans `empty-state.tsx` : un rang qui a son
           intertitre n'a pas de titre à redonner à son quart vide. Il en va de
           la hiérarchie des titres autant que du dessin : le `h3` d'un
           `EmptyState` suivrait ici le `h3` de l'intertitre.

           Le geste est dans le menu du bloc ; le lien inline est le second
           chemin, celui d'`indicators.tsx` pour la vision absente. */
        <BlockNote>
          Aucun persona pour l&apos;instant. Ce rang réunira les profils pour
          lesquels ce produit est conçu — leur rôle, ce qu&apos;ils cherchent à
          faire, ce qui les bloque et ce qu&apos;ils attendent.
          {addHref ? (
            <>
              {" "}
              <DrawerLink
                href={addHref}
                request={{ kind: "persona" }}
                className={ACTION_LINK}
              >
                Ajouter un persona
              </DrawerLink>
            </>
          ) : null}
        </BlockNote>
      )}
    </div>
  );
}

/**
 * Une carte : l'image ou les initiales, le nom, le rôle, et le rang quand il est
 * principal.
 *
 * **La carte entière est le lien**, comme une `ListRow` : la cible est plus
 * large que le nom, et il n'y a qu'un arrêt de tabulation par persona.
 *
 * **Le filet porte la carte, sans fond.** Sur `surface-neutral-pale`, aucun
 * jeton ne donne une surface qui s'en détache — c'est la dette déjà consignée
 * sur la carte blanche de la North Star —, et **aucun septième substitut ne
 * s'invente** (règle 2). Le filet est celui de `Section`, d'`EmptyState` et du
 * bloc lui-même : aucun couple de couleurs neuf n'apparaît ici.
 *
 * **Le rang est écrit, jamais porté par une couleur seule** (`docs/06` §11) : la
 * puce dit « Principal » en toutes lettres. Un persona secondaire ne porte rien
 * — l'absence de puce n'est pas une information à décoder, c'est le cas courant.
 */
function PersonaCard({
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
      className="flex h-full items-start gap-3 rounded-2xl border border-surface-neutral-lighter p-4"
    >
      <PersonaImage persona={persona} />

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-md font-semibold text-content-neutral-darkest">
          {persona.name}
        </span>
        {persona.role ? (
          <span className="text-sm text-content-neutral-base">
            {persona.role}
          </span>
        ) : null}
        {persona.kind === "primary" ? (
          <span className="mt-1">
            <Tag label="Principal" />
          </span>
        ) : null}
      </span>
    </DrawerLink>
  );
}

/**
 * Le portrait, ou les initiales à défaut.
 *
 * **Vision n'héberge aucun fichier** : l'adresse est arbitraire et pointe hors
 * du produit. L'image est donc rendue par une balise `img` nue plutôt que par
 * `next/image`, qui demanderait d'ouvrir `remotePatterns` à **tout** hôte
 * distant dans `next.config.ts` et ferait transiter l'image par notre serveur —
 * deux choses qu'une image de persona ne justifie pas. L'écart à la règle de
 * `core-web-vitals` est donc explicite, et c'est le seul du dépôt.
 *
 * **`alt=""` : l'image est décorative**, et c'est la règle d'`Avatar` — deux
 * lettres dans un cercle ne sont pas un nom, une photo non plus. Le nom est
 * écrit juste à côté, en toutes lettres. Un texte de remplacement qui répéterait
 * le nom le ferait lire deux fois à la synthèse vocale.
 *
 * `referrerPolicy="no-referrer"` : le chargement ne dit pas à l'hôte distant
 * depuis quelle page de Vision il est demandé. `loading="lazy"` : huit portraits
 * ne retardent pas l'affichage du bloc.
 */
function PersonaImage({ persona }: { persona: ProductPersona }) {
  if (!persona.imageUrl) {
    return <Avatar name={persona.name} className="h-11 w-11 text-xs" />;
  }

  return (
    // Adresse externe arbitraire, jamais un fichier hébergé par Vision : voir
    // l'en-tête de cette fonction pour les deux raisons de ne pas passer par
    // `next/image`.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={persona.imageUrl}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      className="h-11 w-11 flex-none rounded-full object-cover"
    />
  );
}
