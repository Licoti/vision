/**
 * Le bloc « Indicateurs adoptés » — le deuxième des blocs de référence de la
 * page projet.
 *
 * `docs/06` §5 le place juste après « Ressources », et il porte depuis T4.1 un
 * état vide **annoncé** dans `REFERENCE_BLOCKS` : « les indicateurs du produit
 * que cet accompagnement reprend à son compte s'afficheront ici, avec leur
 * valeur de référence, la cible fixée et le dernier relevé ». T5.4 tient cette
 * promesse, et la page n'a plus à décrire ce bloc — il porte **sa section
 * entière**, son en-tête compris, la forme de `Roadmap` depuis T3.1 et de
 * `Resources` depuis T4.1.
 *
 * **C'est la table qui relie l'accompagnement à son effet supposé, et elle ne
 * calcule rien** (`docs/04` §3). Quatre valeurs **reportées** côte à côte — la
 * référence, la cible, la dernière valeur datée, la valeur finale — et jamais un
 * cinquième chiffre : ni écart à la cible, ni pourcentage de progression, ni
 * barre de remplissage, ni badge « cible atteinte ». D39 pose la frontière, et
 * `docs/03` §7 nomme le « +12 % depuis l'accompagnement » comme le point de
 * bascule où Vision cesserait d'être un outil de mémoire pour devenir un outil
 * de justification. **La cible est un repère, jamais un état.**
 *
 * Rien n'est tiré de `direction` non plus : le sens de lecture d'une courbe
 * n'est pas un jugement porté sur une valeur, et cette lecture ne le remonte
 * même pas.
 *
 * Les trois points d'entrée sont `| null` — la règle de `Resources` : le
 * composant ne connaît aucun droit, c'est l'appelant qui les lit (D9), et un
 * accompagnement archivé les annule tous les trois du même `canWrite`
 * (T4bis.3).
 *
 * **Aucune création d'indicateur ici** (arbitrage (c) de `tickets-C5.md`) : un
 * indicateur appartient au produit, il se crée sur sa page, et le bloc y renvoie
 * — dans son état vide comme sous son panneau. Un quatrième formulaire aurait
 * recopié des choix de design system que cinq copies de `PanelField` portent
 * déjà.
 *
 * Le composant ne lit aucune base : `adoptions` est ce que
 * `listProjectAdoptions` a déjà lu, filtré et trié.
 */

import Link from "next/link";

import { Field } from "@/components/ui/field";
import { Section, SectionHeader } from "@/components/ui/section";
import { formatDateMonth, formatResultValue } from "@/lib/format";
import type { ProjectAdoption } from "@/lib/queries/indicators";

/**
 * Les classes d'un geste texte — la constante `ACTION_LINK` de `roadmap.tsx`,
 * **redite** pour la troisième fois après `resources.tsx` et `indicators.tsx` :
 * aucun de ces modules ne l'exporte, et aucun n'appartient au périmètre de ce
 * ticket. La dette est consignée au journal ; à quatre copies, elle mérite
 * `components/ui/`.
 *
 * `content-primary-dark` sur `surface-neutral-pale` n'est **pas un couple neuf
 * par la position** : c'est déjà celui des gestes de « Ressources », dans la
 * case voisine de la même grille, mesuré à 15,72:1.
 */
const ACTION_LINK = "text-xs font-semibold text-content-primary-dark underline";

export function AdoptedIndicators({
  adoptions,
  addHref,
  editHref,
  removeAdoption,
  productHref,
}: {
  adoptions: ProjectAdoption[];
  /** L'ouverture du panneau, ou `null` pour qui ne peut pas écrire (D9). */
  addHref: string | null;
  /** L'ouverture du panneau sur une adoption donnée, ou `null`. */
  editHref: ((adoptionId: string) => string) | null;
  /**
   * Le retrait de l'adoption — l'action serveur **déjà liée au projet** côté
   * serveur, à lier à l'adoption au moment du rendu. Même règle de droit.
   */
  removeAdoption: ((adoptionId: string) => Promise<void>) | null;
  /**
   * La page du produit. Elle est nommée dans l'état vide et sous le panneau :
   * c'est le seul endroit où un indicateur se crée (arbitrage (c)), et le bloc
   * ne laisse jamais devant une impasse.
   */
  productHref: string;
}) {
  return (
    <Section>
      <SectionHeader
        title="Indicateurs adoptés"
        {...(addHref
          ? {
              action: (
                <AdoptIndicator
                  href={addHref}
                  className="border border-content-neutral-normal bg-surface-neutral-pale text-content-primary-dark"
                />
              ),
            }
          : {})}
      />

      {adoptions.length > 0 ? (
        <ul role="list" className="flex flex-col">
          {adoptions.map((adoption) => (
            <li
              key={adoption.id}
              className="border-t border-surface-neutral-lighter py-3 first:border-t-0 first:pt-0 last:pb-0"
            >
              <p className="text-sm font-medium text-content-neutral-darkest">
                {adoption.label}
              </p>

              {/* Quatre couples nom/valeur, donc une liste de définitions : le
                  rattachement que la mise en page suggère à l'œil est écrit pour
                  l'assistance (`docs/06` §11). **Les intitulés sont visibles**,
                  et non seulement lus : quatre nombres alignés sans leur nom ne
                  se distingueraient que par leur position, et la position ne
                  porte pas plus une information que la couleur.

                  `Field` est repris tel quel — mêmes jetons, mêmes balises. Seule
                  la rangée est écrite ici plutôt qu'empruntée à `FieldRow` : son
                  filet supérieur et ses espacements appartiennent à l'en-tête de
                  la page, et ce bloc occupe une demi-largeur de grille. Aucun
                  couple neuf par la position — `content-neutral-base` et
                  `content-neutral-dark` sur `surface-neutral-pale` sont ceux de
                  l'en-tête, sur le même fond. */}
              <dl className="mt-2 flex flex-wrap gap-x-8 gap-y-3">
                <Field label="Référence">
                  <Reported value={adoption.baselineValue} unit={adoption.unit} />
                </Field>
                <Field label="Cible">
                  <Reported value={adoption.targetValue} unit={adoption.unit} />
                </Field>
                <Field label="Dernier relevé">
                  <LastReading adoption={adoption} />
                </Field>
                <Field label="Valeur finale">
                  <Reported value={adoption.finalValue} unit={adoption.unit} />
                </Field>
              </dl>

              {/* Un `div` et non un `p` : `<form>` est du contenu de flux, et un
                  paragraphe n'accepte que du phrasé — le balisage servi serait
                  réécrit par le navigateur, et l'hydratation divergerait
                  (T4bis.5).

                  **« Retirer », et non « Archiver »** : le geste défait une
                  liaison par `unlink` (arbitrage (f)), il n'archive rien.
                  Écrire « Archiver » sur une suppression de ligne serait faux —
                  et rien n'est perdu pour autant, les relevés vivant sur
                  l'indicateur et non sur l'adoption. Sans confirmation :
                  `docs/06` §9 la proscrit là où elle ne protège rien.

                  Le nom accessible porte le libellé de l'indicateur, comme
                  ailleurs : « Modifier » répété quatre fois dans une liste de
                  liens ne dit pas laquelle. */}
              {editHref || removeAdoption ? (
                <div className="mt-2.5 flex flex-wrap items-center gap-4">
                  {editHref ? (
                    <Link
                      href={editHref(adoption.id)}
                      aria-label={`Modifier l'adoption de l'indicateur ${adoption.label}`}
                      className={ACTION_LINK}
                    >
                      Modifier
                    </Link>
                  ) : null}
                  {removeAdoption ? (
                    <form action={removeAdoption.bind(null, adoption.id)}>
                      <button
                        type="submit"
                        aria-label={`Retirer l'adoption de l'indicateur ${adoption.label}`}
                        className={ACTION_LINK}
                      >
                        Retirer
                      </button>
                    </form>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-start gap-4">
          <p className="text-sm leading-175 text-content-neutral-base">
            Les indicateurs du produit que cet accompagnement reprend à son
            compte s&apos;afficheront ici, avec leur valeur de référence, la
            cible fixée et le dernier relevé. Un indicateur se crée sur{" "}
            <Link href={productHref} className="text-content-info-base underline">
              la page du produit
            </Link>
            , puis s&apos;adopte ici.
          </p>
          {addHref ? (
            <AdoptIndicator
              href={addHref}
              className="bg-surface-primary-base text-content-neutral-pale"
            />
          ) : null}
        </div>
      )}
    </Section>
  );
}

/**
 * Une valeur reportée, mise en forme avec l'unité de l'indicateur — ou
 * l'absence, écrite.
 *
 * **Un champ sans valeur ne se masque pas** : « Non renseignée » est une
 * information, un trou n'en est pas une (la règle de `Field` depuis T2.4). Et
 * c'est une absence de saisie, pas un zéro : adopter un indicateur sans fixer de
 * cible est un geste normal.
 */
function Reported({
  value,
  unit,
}: {
  value: string | null;
  unit: string | null;
}) {
  const formatted = formatResultValue(value, unit);

  if (formatted === null) {
    return <span className="text-content-neutral-base">Non renseignée</span>;
  }
  return <>{formatted}</>;
}

/**
 * La dernière valeur relevée, et le mois où elle l'a été.
 *
 * La date se lit **au mois** (D13). Un indicateur sans relevé le dit et n'est
 * **jamais posé à aujourd'hui** — `docs/03` §7 : « signalé comme tel plutôt que
 * positionné arbitrairement à aujourd'hui ». La série complète, elle, se lit sur
 * la page du produit : ce bloc en donne la tête, pas le détail.
 */
function LastReading({ adoption }: { adoption: ProjectAdoption }) {
  const formatted = formatResultValue(adoption.lastValue, adoption.unit);

  if (formatted === null || adoption.lastReadOn === null) {
    return <span className="text-content-neutral-base">Aucun relevé</span>;
  }

  return (
    <>
      {formatted}
      {/* Le `·` est décoratif ; le mois est nommé pour l'assistance, faute de
          quoi « 71 % juin 2026 » se lirait d'un trait.

          **Il garde la couleur du texte qu'il sépare**, et ne porte aucune
          classe : ses deux côtés ont exactement la même graisse et la même
          taille, et `content-neutral-light` — mesuré à 2,22:1 sur ce fond —
          laisserait lire « 71 % juin 2026 » d'une traite. C'est la règle posée
          en T4bis.5 sur la ligne « Type · Activité » de `Resources`, et celle
          que `indicators.tsx` applique déjà. Ici c'est `content-neutral-dark`,
          à 8,12:1. */}
      <span aria-hidden="true">{" · "}</span>
      <span className="sr-only">relevé en </span>
      {formatDateMonth(adoption.lastReadOn)}
    </>
  );
}

/**
 * Le point d'entrée du panneau, aux deux emplacements — en tête du bloc et dans
 * son état vide.
 *
 * Un `<Link>` et non un bouton : il mène à une URL, donc il se copie, se
 * partage et s'ouvre dans un onglet. La forme de `LinkResource` (T4.2), jusqu'au
 * `+` en `aria-hidden` — le mot porte seul le sens.
 */
function AdoptIndicator({
  href,
  className,
}: {
  href: string;
  className: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${className}`}
    >
      <span aria-hidden="true">+</span>
      Adopter un indicateur
    </Link>
  );
}
