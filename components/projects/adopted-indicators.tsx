/**
 * Le bloc « Indicateurs adoptés » — le rail droit de la page projet.
 *
 * `docs/06` §5 le place juste après « Ressources » ; la maquette
 * `docs/design/maquettes/blocs/project-v2` sort les deux du corps et les pose
 * en **colonne de référence** à droite du récit (20/08/2026). L'ordre du
 * document est conservé à l'intérieur de ce rail : les indicateurs d'abord, les
 * ressources dessous. Le bloc porte **sa section entière**, son en-tête
 * compris, la forme de `Roadmap` depuis T3.1.
 *
 * **La North Star du produit ouvre le bloc, dans un encadré à elle**
 * (20/08/2026). Ce n'est pas une North Star « du projet » — il n'y en a pas :
 * `indicators.is_north_star` porte un index unique partiel qui en garantit une
 * au plus **par produit**, et un accompagnement qui l'adopte adopte celle-là.
 * L'encadré dit donc « voici l'objectif du produit, et ce que cet
 * accompagnement s'est donné dessus ». Les autres adoptions suivent en cartes,
 * étiquetées « Complémentaire ».
 *
 * ⚠ **La jauge et l'écart chiffré de la maquette ne sont pas repris**, et c'est
 * l'arbitrage rendu avant écriture le 20/08/2026. La maquette dessine une barre
 * remplie à 71 %, un trait de cible à 85 % et la phrase « Encore 14 pts » : les
 * trois sont **le même indice calculé par Vision**, que D39, `docs/06` §6,
 * l'arbitrage (g) de `tickets-C5.md` et `brief-design.md` §4.3 refusent en
 * propres termes. Le bloc « Vision produit » en porte une **par dérogation
 * explicite** du 17/08/2026 ; cette dérogation **ne s'étend pas ici**. La cible
 * reste ce que `docs/03` §7 en dit — un repère écrit, jamais un état. Consigné
 * dans `JOURNAL-TECHNIQUE.md`.
 *
 * **C'est la table qui relie l'accompagnement à son effet supposé, et elle ne
 * calcule rien** (`docs/04` §3). Quatre valeurs **reportées** — la référence, la
 * cible, la dernière valeur datée, la valeur finale — et jamais un cinquième
 * chiffre : ni écart à la cible, ni pourcentage de progression, ni barre de
 * remplissage, ni badge « cible atteinte ». **Les quatre survivent au changement
 * de dessin** : la maquette n'en montre que deux, et les deux autres se
 * seraient perdues sans qu'aucun écran les reprenne.
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
 * — dans son état vide comme sous son panneau.
 *
 * Le composant ne lit aucune base : `adoptions` est ce que
 * `listProjectAdoptions` a déjà lu, filtré et trié — **North Star en tête**,
 * puis l'alphabet.
 */

import Link from "next/link";

import {
  ButtonIcon,
  buttonClass,
  type ButtonVariant,
} from "@/components/ui/button";
import { DrawerLink } from "@/components/ui/drawer";

import { ACTION_LINK } from "@/components/ui/action-link";
import { BlockNote } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Section, SectionHeader } from "@/components/ui/section";
import { Tag } from "@/components/ui/tag";
import { formatDateMonth, formatResultValue } from "@/lib/format";
import type { ProjectAdoption } from "@/lib/queries/indicators";

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
    <Section id="indicateurs">
      <SectionHeader
        title="Indicateurs adoptés"
        {...(addHref
          ? {
              action: <AdoptIndicator href={addHref} variant="secondary" />,
            }
          : {})}
      />

      {adoptions.length > 0 ? (
        <ul role="list" className="flex flex-col gap-3">
          {adoptions.map((adoption) => (
            <li key={adoption.id}>
              <AdoptionCard
                adoption={adoption}
                {...(editHref ? { editHref: editHref(adoption.id) } : {})}
                {...(removeAdoption
                  ? { removeAdoption: removeAdoption.bind(null, adoption.id) }
                  : {})}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-start gap-4">
          <BlockNote>
            Les indicateurs du produit que cet accompagnement reprend à son
            compte s&apos;afficheront ici, avec leur valeur de référence, la
            cible fixée et le dernier relevé. Un indicateur se crée sur{" "}
            <Link
              href={productHref}
              className="text-content-info-base underline"
            >
              la page du produit
            </Link>
            , puis s&apos;adopte ici.
          </BlockNote>
          {addHref ? <AdoptIndicator href={addHref} variant="primary" /> : null}
        </div>
      )}
    </Section>
  );
}

/**
 * La carte d'une adoption — **une seule forme, deux tonalités**.
 *
 * La North Star porte la surface bleue, le surtitre `★ NORTH STAR` et la grande
 * valeur ; les autres portent le filet neutre, l'étiquette « Complémentaire » et
 * une valeur d'un rang au-dessous. Tout le reste — la cible, les deux valeurs
 * reportées, les deux gestes — est **commun**, et c'est délibéré : deux
 * composants auraient divergé à la première correction, ce que TD.1 a mesuré
 * quatre fois.
 *
 * **Les couples de couleurs de la tonalité bleue sont mesurés**, la surface
 * étant neuve par la position pour quatre jetons :
 * `content-warning-darker` sur `surface-primary-lightest` 8,21:1 ·
 * `content-neutral-darkest` 17,21:1 · `content-neutral-dark` 7,82:1 ·
 * `content-primary-dark` (le lien d'action) 15,14:1. `content-neutral-base` —
 * le jeton d'une valeur absente — y tient à 4,79:1.
 *
 * **Le ★ est décoratif** : « North Star » est écrit juste à côté, et la couleur
 * ne porte jamais seule (`docs/06` §11). La règle de `BlockHeader`.
 */
function AdoptionCard({
  adoption,
  editHref,
  removeAdoption,
}: {
  adoption: ProjectAdoption;
  editHref?: string;
  removeAdoption?: () => Promise<void>;
}) {
  const northStar = adoption.isNorthStar;
  const target = formatResultValue(adoption.targetValue, adoption.unit);

  return (
    <div
      className={
        northStar
          ? "rounded-2xl border border-border-primary-lighter bg-surface-primary-lightest p-4"
          : "rounded-2xl border border-surface-neutral-lighter p-4"
      }
    >
      {northStar ? (
        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-content-warning-darker">
          <span aria-hidden="true">★</span>
          North Star
        </p>
      ) : null}

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-content-neutral-darkest">
          {adoption.label}
        </span>
        {/* L'étiquette dit **le rang de l'indicateur dans le produit**, jamais
            un jugement porté sur l'accompagnement : « complémentaire » de la
            North Star, au sens où `indicators.tsx` nomme déjà son rang 3
            « Indicateurs associés ». */}
        {northStar ? null : <Tag label="Complémentaire" />}
      </div>

      {/* Le dernier relevé, en grand — c'est la valeur qu'on vient chercher.
          La date se lit **au mois** (D13), et un indicateur sans relevé le dit :
          il n'est **jamais posé à aujourd'hui** (`docs/03` §7).

          **La cible est à droite, et elle reste un repère** : un nombre écrit à
          côté d'un autre, sans barre qui les rapporte l'un à l'autre ni phrase
          qui dise ce qu'il en manque (D39). */}
      <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <LastReading adoption={adoption} big={northStar} />
        <span
          className={`ml-auto text-xs font-semibold ${
            northStar
              ? "text-content-warning-darker"
              : "text-content-neutral-dark"
          }`}
        >
          {target === null ? "Pas de cible définie" : `Cible ${target}`}
        </span>
      </div>

      {/* Les deux valeurs que la maquette ne montre pas, et qui n'ont aucun
          autre écran : la référence d'où l'accompagnement est parti, et la
          valeur qu'il a inscrite en fin de parcours. `Field` est repris tel
          quel — mêmes jetons, mêmes balises —, la rangée seule est écrite ici :
          le filet supérieur de `FieldRow` appartient à l'en-tête de la page. */}
      <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
        <Field label="Référence">
          <Reported value={adoption.baselineValue} unit={adoption.unit} />
        </Field>
        <Field label="Valeur finale">
          <Reported value={adoption.finalValue} unit={adoption.unit} />
        </Field>
      </dl>

      {/* Un `div` et non un `p` : `<form>` est du contenu de flux, et un
          paragraphe n'accepte que du phrasé — le balisage servi serait réécrit
          par le navigateur, et l'hydratation divergerait (T4bis.5).

          **« Retirer », et non « Archiver »** : le geste défait une liaison par
          `unlink` (arbitrage (f)), il n'archive rien. Sans confirmation :
          `docs/06` §9 la proscrit là où elle ne protège rien.

          Le nom accessible porte le libellé de l'indicateur : « Modifier »
          répété quatre fois dans une liste de liens ne dit pas laquelle. */}
      {editHref || removeAdoption ? (
        <div className="mt-3 flex flex-wrap items-center justify-end gap-4">
          {editHref ? (
            <DrawerLink
              href={editHref}
              request={{ kind: "adoption", id: adoption.id }}
              aria-label={`Modifier l'adoption de l'indicateur ${adoption.label}`}
              className={ACTION_LINK}
            >
              Modifier
            </DrawerLink>
          ) : null}
          {removeAdoption ? (
            <form action={removeAdoption}>
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
    </div>
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
 * **Elle est nommée pour l'assistance** : hors du contexte visuel, « 71 % juin
 * 2026 » ne dit pas de quoi ce nombre est la valeur — la grande taille le dit à
 * l'œil, et la taille n'est pas une information (`docs/06` §11).
 *
 * La date se lit **au mois** (D13). Un indicateur sans relevé le dit et n'est
 * **jamais posé à aujourd'hui** — `docs/03` §7. La série complète, elle, se lit
 * sur la page du produit : ce bloc en donne la tête, pas le détail.
 */
function LastReading({
  adoption,
  big,
}: {
  adoption: ProjectAdoption;
  /** La North Star porte sa valeur d'un rang au-dessus des autres. */
  big: boolean;
}) {
  const formatted = formatResultValue(adoption.lastValue, adoption.unit);

  if (formatted === null || adoption.lastReadOn === null) {
    return (
      <span className="text-sm text-content-neutral-base">
        <span className="sr-only">Dernier relevé : </span>
        Aucun relevé
      </span>
    );
  }

  return (
    <>
      <span
        className={`font-bold text-content-neutral-darkest ${
          big ? "text-3xl" : "text-2xl"
        }`}
      >
        <span className="sr-only">Dernier relevé : </span>
        {formatted}
      </span>
      <span className="text-xs text-content-neutral-dark">
        <span className="sr-only">relevé en </span>
        {formatDateMonth(adoption.lastReadOn)}
      </span>
    </>
  );
}

/**
 * Le point d'entrée du panneau, aux deux emplacements — en tête du bloc et dans
 * son état vide.
 *
 * Un lien et non un bouton : il mène à une URL, donc il se copie, se partage
 * et s'ouvre dans un onglet — ce que TD.2 préserve exactement, le clic gauche
 * seul étant intercepté. La forme de `LinkResource` (T4.2), jusqu'au `+` en
 * `aria-hidden` : le mot porte seul le sens.
 */
function AdoptIndicator({
  href,
  variant,
}: {
  href: string;
  variant: ButtonVariant;
}) {
  return (
    <DrawerLink
      href={href}
      request={{ kind: "adoption" }}
      className={buttonClass({ variant })}
    >
      <ButtonIcon>+</ButtonIcon>
      Adopter un indicateur
    </DrawerLink>
  );
}
