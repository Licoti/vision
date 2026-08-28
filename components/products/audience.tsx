/**
 * « Utilisateurs et usages » — le bloc qui réunit « Personae » et « Use Cases »
 * (21/08/2026).
 *
 * **Deux blocs pour une seule question.** Les personae disent *pour qui* le
 * produit est conçu, les use cases *ce qu'on vient y faire* : c'est la même
 * chaîne de lecture — `Personae → Use Cases → Features` —, coupée en deux
 * cartes que rien ne séparait vraiment. Deux cartes de pleine largeur posées
 * l'une sous l'autre repoussaient les accompagnements hors de l'écran, ce qui
 * est l'inverse de la hiérarchie voulue.
 *
 * **La distinction reste entière à l'intérieur.** Chaque rang garde son
 * intertitre, sa note et son dessin propre — une **grille** pour les personae,
 * une **ligne défilante** pour les use cases. Le regroupement change le nombre
 * de cartes, pas la lecture.
 *
 * **Deux boutons, et non plus un menu** (28/08/2026). Les deux « Ajouter »
 * avaient été rangés dans un `ActionMenu` le 21/08/2026 ; ils en ressortent au
 * rang **secondaire**, la forme que les deux autres blocs de la page donnent
 * désormais à leur geste d'ajout. La page portait cinq dessins pour un même
 * geste — bouton primaire, menu d'en-tête, menu de bloc, lien souligné, carte
 * pointillée ; elle en porte deux, et chacun dit son rang. Un menu qui n'aurait
 * plus rien à cacher n'est qu'un clic de plus.
 *
 * Chaque geste reste atteignable d'un second chemin, le lien inline du
 * paragraphe d'absence de son rang.
 *
 * **Composant serveur**, comme les deux rangs qu'il porte : il n'a aucun état,
 * ne lit aucune base, et **ne connaît aucun droit** — les points d'entrée
 * arrivent à `null` quand ils ne doivent pas paraître. Un menu absent du rendu
 * ne protège rien : les actions redérivent le droit sur les identifiants reçus.
 */

import { Block, BlockHeader } from "@/components/ui/block";
import { buttonClass } from "@/components/ui/button";
import { DrawerLink } from "@/components/ui/drawer";
import { PersonasRank } from "@/components/products/personas";
import { UseCasesRank } from "@/components/products/use-cases";
import type { ProductPersona } from "@/lib/queries/personas";
import type { ProductUseCase } from "@/lib/queries/use-cases";

export function Audience({
  personas,
  useCases,
  personaHref,
  useCaseHref,
  addPersonaHref,
  addUseCaseHref,
}: {
  /** Les personae vivants du produit, **déjà triés** : aucun tri ne se rejoue. */
  personas: ProductPersona[];
  /** Les use cases vivants du produit, **déjà triés** de la même façon. */
  useCases: ProductUseCase[];
  /** La fiche d'un persona — elle se lit par tout le domaine (D9). */
  personaHref: (personaId: string) => string;
  /** La fiche d'un use case, de même. */
  useCaseHref: (useCaseId: string) => string;
  /** `null` retire le geste — le composant ne connaît aucun droit. */
  addPersonaHref: string | null;
  /** `null` retire le geste. Les deux tombent ensemble aujourd'hui, séparément demain. */
  addUseCaseHref: string | null;
}) {
  return (
    <Block>
      <BlockHeader
        title="Utilisateurs et usages"
        note="Pour qui ce produit est conçu, et ce qu'on vient y faire."
        /* **Rien ne se rend quand les deux gestes sont nuls**, et les deux
           conditions restent séparées : le jour où les deux droits divergeront,
           l'en-tête n'aura pas à changer de forme — il ne portera qu'un bouton.
           `flex-wrap` parce que deux boutons de cette longueur passent à la
           ligne avant le titre sur un écran étroit. */
        action={
          addPersonaHref || addUseCaseHref ? (
            <span className="flex flex-wrap items-center gap-2">
              {addPersonaHref ? (
                <DrawerLink
                  href={addPersonaHref}
                  request={{ kind: "persona" }}
                  className={buttonClass({ variant: "secondary" })}
                >
                  Ajouter un persona
                </DrawerLink>
              ) : null}
              {addUseCaseHref ? (
                <DrawerLink
                  href={addUseCaseHref}
                  request={{ kind: "useCase" }}
                  className={buttonClass({ variant: "secondary" })}
                >
                  Ajouter un use case
                </DrawerLink>
              ) : null}
            </span>
          ) : null
        }
      />

      {/* L'ordre des deux rangs est celui de la chaîne de lecture : on sait
          pour qui avant de savoir quoi. `Block` est une colonne à `gap-5`, et
          les deux rangs y sont deux enfants directs — leur rythme intérieur est
          plus serré (`gap-4`), ce qui fait lire la coupure. */}
      <PersonasRank
        personas={personas}
        detailHref={personaHref}
        addHref={addPersonaHref}
      />

      <UseCasesRank
        useCases={useCases}
        personas={personas}
        detailHref={useCaseHref}
        addHref={addUseCaseHref}
      />
    </Block>
  );
}
