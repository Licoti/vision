/**
 * Le bloc « Use Cases » de la page produit — **comment ce produit est
 * construit** (19/08/2026).
 *
 * Il complète les deux blocs de tête : « Vision produit » dit pourquoi le
 * produit existe et ce qu'il mesure, « Personae » dit à qui il s'adresse,
 * celui-ci dit quels **grands scénarios** le structurent. C'est le niveau de
 * lecture du milieu — `Personae → Use Cases → Features` —, dont seuls les deux
 * premiers rangs existent aujourd'hui.
 *
 * **L'intitulé est en anglais, seul de la page à l'être** : arbitrage humain du
 * 19/08/2026, écart assumé à « interface en français » et consigné dans
 * `JOURNAL-TECHNIQUE.md` (règle 6).
 *
 * **Une ligne défilante, et non une grille.** C'est ce qui distingue ce bloc du
 * bloc « Personae » juste au-dessus, et ce n'est pas une variation de style :
 * une grille grandit vers le bas, et un produit qui porterait douze scénarios
 * repousserait ses accompagnements hors de l'écran. La ligne garde au bloc une
 * hauteur constante quel que soit le nombre de cartes, et l'exploration se fait
 * latéralement. **Le défilement au clavier est acquis sans attribut** : chaque
 * carte est un lien, donc la tabulation amène la suivante dans le champ — une
 * région défilante sans contenu focalisable aurait été un piège (WCAG 2.1.1).
 *
 * **La carte résume, la fiche détaille.** La carte porte le titre, la
 * description tronquée et les personae en pastilles ; tout le reste vit dans le
 * panneau, ouvert par un clic (`?scenario=<identifiant>`).
 *
 * **Composant serveur**, comme `Personas` et `Indicators` : il n'a aucun état.
 * Il ne connaît aucun droit non plus — les points d'entrée arrivent à `null`
 * quand ils ne doivent pas paraître, et c'est l'appelant qui en décide. Un
 * point d'entrée absent du rendu ne protège rien : les trois actions redérivent
 * le droit sur les identifiants reçus.
 *
 * **Aucun décompte, aucune couverture, aucune jauge** : ni « 4 use cases », ni
 * « 3 personae sur 5 couverts ». D39 interdit tout indice calculé par Vision
 * pour qualifier un produit, et une couverture en serait un.
 */

import { DrawerLink } from "@/components/ui/drawer";

import { ACTION_LINK } from "@/components/ui/action-link";
import { AvatarGroup } from "@/components/ui/avatar";
import { Block, BlockHeader } from "@/components/ui/block";
import { EmptyState } from "@/components/ui/empty-state";
import type { ProductPersona } from "@/lib/queries/personas";
import { personasOf, type ProductUseCase } from "@/lib/queries/use-cases";

export function UseCases({
  useCases,
  personas,
  detailHref,
  addHref,
}: {
  /** Les use cases vivants du produit, **déjà triés** : aucun tri ne se rejoue. */
  useCases: ProductUseCase[];
  /**
   * Les personae vivants du produit, **ceux que la page a déjà lus** pour le
   * bloc voisin. Le bloc les reçoit plutôt que de les relire : le rattachement
   * arrive en identifiants, et c'est ici qu'il retrouve des noms — sans une
   * lecture par carte, et sans seconde source pour la même donnée.
   */
  personas: readonly ProductPersona[];
  /** La fiche se lit par tout le domaine (D9) : ce lien n'est jamais nul. */
  detailHref: (useCaseId: string) => string;
  /** `null` retire le point d'entrée — le composant ne connaît aucun droit. */
  addHref: string | null;
}) {
  return (
    <Block>
      <BlockHeader
        title="Use Cases"
        note="Les grands scénarios d'usage qui structurent ce produit."
        action={
          addHref && useCases.length > 0 ? (
            <DrawerLink
              href={addHref}
              request={{ kind: "useCase" }}
              className={ACTION_LINK}
            >
              Ajouter un use case
            </DrawerLink>
          ) : null
        }
      />

      {useCases.length > 0 ? (
        /* Le retrait négatif compense le rembourrage, et il est là pour une
           raison qu'on ne voit qu'au clavier : `overflow-x` non visible fait
           calculer `overflow-y` en `auto`, si bien qu'un conteneur sans marge
           intérieure **rognerait le liseré de focus** de chaque carte, haut et
           bas. Quatre pixels de chaque côté, repris en marge, et le rythme du
           bloc ne bouge pas. */
        <ul
          role="list"
          className="-m-1 flex gap-4 overflow-x-auto p-1 pb-3"
        >
          {useCases.map((useCase) => (
            <li key={useCase.id} className="w-72 flex-none">
              <UseCaseCard
                useCase={useCase}
                personas={personasOf(useCase, personas)}
                href={detailHref(useCase.id)}
              />
            </li>
          ))}
        </ul>
      ) : (
        /* Un `EmptyState` et non un paragraphe : c'est un bloc de pleine
           largeur qui porte un **geste**, comme « Personae » et « Tous les
           accompagnements ». Il dit ce que le bloc contiendra et propose
           l'action (règle 5) ; il ne s'excuse pas et ne reproche rien. */
        <EmptyState
          level={3}
          title="Aucun use case pour l'instant"
          description="Ce bloc réunira les grands scénarios d'usage de ce produit — ce qu'on vient y faire, et ce que cela permet. Chacun regroupe les fonctionnalités qui servent un même objectif, et désigne les profils qu'il sert. C'est ce niveau de lecture qui permettra de dire, demain, quel parcours une fonctionnalité vient compléter."
          {...(addHref
            ? {
                action: (
                  <DrawerLink
                    href={addHref}
                    request={{ kind: "useCase" }}
                    className={ACTION_LINK}
                  >
                    Ajouter un use case
                  </DrawerLink>
                ),
              }
            : {})}
        />
      )}
    </Block>
  );
}

/**
 * Une carte : le titre, la description tronquée, et les personae rattachés.
 *
 * **La carte entière est le lien**, comme `PersonaCard` et comme une `ListRow` :
 * la cible est plus large que le titre, et il n'y a qu'un arrêt de tabulation
 * par use case — ce qui compte double dans une ligne défilante, où chaque arrêt
 * supplémentaire serait un déplacement latéral de plus.
 *
 * **Le filet porte la carte, sans fond**, exactement comme celui de
 * `PersonaCard` : sur `surface-neutral-pale`, aucun jeton ne donne une surface
 * qui s'en détache, et **aucun septième substitut ne s'invente** (règle 2). La
 * dette est celle déjà consignée dans `ETAT.md` ; elle prend ici une quatrième
 * position sans que rien de neuf soit introduit — donc **aucun couple de
 * couleurs neuf par la position**, et rien de nouveau à mesurer.
 *
 * **La description est tronquée à trois lignes**, et c'est la seule raison
 * d'être de la fiche : une carte qui porterait le texte entier ferait varier la
 * hauteur de la ligne d'une carte à l'autre, et la ligne défilante n'aurait plus
 * de hauteur. `line-clamp` tronque à l'affichage seulement — le texte reste
 * entier dans le HTML servi, donc entier pour la synthèse vocale.
 */
function UseCaseCard({
  useCase,
  personas,
  href,
}: {
  useCase: ProductUseCase;
  /** Les personae de **ce** use case, déjà résolus et dans l'ordre du bloc voisin. */
  personas: ProductPersona[];
  href: string;
}) {
  return (
    <DrawerLink
      href={href}
      request={{ kind: "useCaseDetail", id: useCase.id }}
      className="flex h-full flex-col gap-2 rounded-2xl border border-surface-neutral-lighter p-4"
    >
      <span className="text-md font-semibold text-content-neutral-darkest">
        {useCase.title}
      </span>

      <span className="line-clamp-3 text-sm text-content-neutral-base">
        {useCase.summary}
      </span>

      {/* `mt-auto` colle les pastilles au bas de la carte : les titres n'ont pas
          tous la même hauteur, et sans lui les rangs de pastilles ne
          s'aligneraient pas d'une carte à l'autre.

          **`AvatarGroup` rend `null` sur une liste vide**, ce qui est
          exactement l'état d'un use case sans persona — facultatif depuis
          l'arbitrage du 19/08/2026. Aucune phrase ne le signale : une absence
          n'est pas un manque, et le bloc n'a rien à reprocher.

          **Un `div` et non un `span`** : `AvatarGroup` rend un `div`, et un
          élément de phrasé ne l'accepte pas. Le `<a>` qui les entoure tous, lui,
          a un modèle de contenu **transparent** — son parent est un `<li>`, qui
          accepte du contenu de flux —, si bien que le mélange est valide. La
          règle de `readings-panel.tsx`, appliquée avant que le navigateur ne
          récrive le balisage servi. */}
      <div className="mt-auto pt-1">
        <AvatarGroup
          names={personas.map((persona) => persona.name)}
          label="Personae associés"
        />
      </div>
    </DrawerLink>
  );
}
