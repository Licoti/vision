/**
 * Le budget — **un rang de la fiche d'identité** depuis le 28/08/2026, et le
 * dernier des cinq blocs de référence de `docs/06` §5 à avoir reçu son contenu
 * (D28).
 *
 * `budgets` était au schéma depuis la migration `0000` et n'avait jamais reçu
 * une ligne : le bloc s'annonçait en carte de référence, avec la phrase de ce
 * qu'il porterait un jour. **Il porte désormais son contenu, donc il n'annonce
 * plus rien** — c'est la règle de « Projets liés » en T6.4.
 *
 * **Il a cessé d'être un bloc**, et c'est un écart assumé à `docs/06` §5, dont
 * la liste de cinq est close. C'est le **deuxième** à cette même liste, après
 * « Projets liés » masqué le 28/08 : la page rend trois de ses blocs et porte le
 * quatrième en rang. La raison est de mise en page — quatre couples nom/valeur
 * et un lien sortant sont exactement ce qu'une fiche de référence sait porter,
 * là où un bloc de la colonne du récit leur donnait une carte entière. Consigné
 * dans `JOURNAL-TECHNIQUE.md`.
 *
 * **Conséquence à écrire pendant qu'elle est visible** : l'ancre `#budget`
 * disparaît avec la `Section`. Une future barre de sous-navigation
 * (`components/projects/subnav.tsx`, sans appelant depuis le 21/08) a donc une
 * cible de moins — comme elle en avait déjà perdu deux le 28/08.
 *
 * **Une synthèse macro et un lien, rien d'autre** (`docs/02` §5). Ce que ce bloc
 * n'affiche pas est aussi important que ce qu'il affiche : **aucun reste à
 * consommer, aucun pourcentage, aucune jauge, aucune barre de progression** —
 * « 73 % consommé » serait exactement l'indice **calculé par Vision** que D39
 * interdit. Aucun détail de dépense, aucun historique non plus : le suivi est
 * tenu dans l'outil, et Vision renvoie vers la source. C'est ce qui garantit
 * que brancher un outil de gestion de plus coûte une ligne de référentiel.
 *
 * Les deux montants sont donc **juxtaposés**, jamais mis en rapport. Vision
 * juxtapose, elle ne prouve pas.
 *
 * Le lien est un lien sortant marqué (`ExternalLink`, `docs/06` §8) : *un lien
 * qui quitte Vision doit être reconnaissable avant le clic.* La marque est une
 * forme et un texte, jamais une couleur seule.
 *
 * `editHref` à `null` retire le geste des **deux** emplacements — la rangée
 * d'actions et l'état vide. Le composant ne connaît aucun droit : c'est
 * l'appelant qui les lit, la règle de `Roadmap`, de `Resources` et de
 * `RelatedProjects`. Et un état vide qui proposerait un geste à qui ne peut pas
 * l'accomplir serait un cul-de-sac de plus.
 *
 * Le composant ne lit aucune base : `budget` est ce que `findProjectBudget` a
 * déjà lu et joint.
 */

import { ACTION_LINK } from "@/components/ui/action-link";
import { BlockDivider } from "@/components/ui/block";
import { ButtonIcon, buttonClass } from "@/components/ui/button";
import { DrawerLink } from "@/components/ui/drawer";
import { BlockNote } from "@/components/ui/empty-state";
import { ExternalLink } from "@/components/ui/external-link";
import { Field } from "@/components/ui/field";
import { formatDay, formatResultValue } from "@/lib/format";
import type { BudgetUnit, ProjectBudget } from "@/lib/queries/budgets";

/**
 * L'unité des deux montants, en toutes lettres.
 *
 * **Un `Record` exhaustif à la compilation**, la forme des deux `Record` de
 * `status-pill.tsx` : le jour où `budget_unit` gagnera une seconde valeur, ce
 * fichier cessera de compiler plutôt que de rendre un montant muet.
 *
 * **Il vit ici et non dans `lib/format.ts`**, qui est hors du périmètre de
 * T7.1. Ce n'est pas sa place définitive : `formatResourceType`,
 * `formatStarterKind` et `formatIndicatorDirection` y vivent tous, et
 * `PERSON_KIND_LABEL` doit les y rejoindre en T7.9 — celui-ci suivra le même
 * chemin, avec le vocabulaire que ce ticket-là tranche.
 */
const BUDGET_UNIT_LABEL: Record<BudgetUnit, string> = {
  days: "jours",
};

/** « Non renseigné » est une information ; un trou n'en est pas une. */
function Missing({ feminine = false }: { feminine?: boolean }) {
  return (
    <span className="text-content-neutral-base">
      {feminine ? "Non renseignée" : "Non renseigné"}
    </span>
  );
}

export function BudgetRank({
  budget,
  editHref,
}: {
  /** La ligne du projet, ou `null` : un accompagnement sans budget est normal. */
  budget: ProjectBudget | null;
  /** L'ouverture du panneau, ou `null` pour qui ne peut pas écrire (D9). */
  editHref: string | null;
}) {
  /* `formatResultValue` est repris **tel quel** : `budgets.allocated` est le
     même `numeric(18,4)` que `results.value`, le pilote le rend en chaîne, et
     le formateur pose la virgule française et l'espace insécable entre le
     nombre et son unité. Une seconde règle de mise en forme des décimales
     divergerait le jour où l'une des deux précisions bougerait. */
  const unit = budget ? BUDGET_UNIT_LABEL[budget.unit] : "";
  const allocated = budget ? formatResultValue(budget.allocated, unit) : null;
  const consumed = budget ? formatResultValue(budget.consumed, unit) : null;

  return (
    <>
      {/* L'intertitre de rang de la page produit, repris tel quel : c'est le
          langage que `components/ui/block.tsx` porte depuis le 18/08/2026, et
          `personas.tsx`, `use-cases.tsx` et la roadmap produit lui passent tous
          le même filet sur une surface pâle. Un troisième dessin de coupure
          n'avait aucune raison d'être inventé ici.

          Le `h3` est le seul de la page projet, et il ne saute aucun niveau :
          il vit sous le `h2` de la fiche. */}
      {/* **Sans note, et c'est la largeur qui tranche.** `BlockDivider` pose
          son titre, sa note et son filet sur une seule ligne `flex` : dans le
          rail de 320 px, une note d'une phrase prend toute la place restante et
          **le filet disparaît**, si bien que l'intertitre ne se lit plus comme
          une coupure mais comme une étiquette égarée. Mesuré au rendu, pas
          supposé. Les notes que les autres appels lui passent sont des
          décomptes — « 3 accompagnements » —, et c'est la largeur qu'il sait
          porter ici. Le titre suffit : « Budget » ne demande pas de glose. */}
      <BlockDivider title="Budget" rule="bg-surface-neutral-lighter" />

      {budget ? (
        /* Quatre couples nom/valeur : `Field` les écrit en `<dt>`/`<dd>`, ce qui
           donne à l'assistance le rattachement que la seule mise en page
           suggère à l'œil (`docs/06` §11). La rangée est écrite ici plutôt que
           reprise de `FieldRow`, dont le filet et la marge haute appartiennent
           au bas de la carte d'en-tête. */
        <dl className="flex flex-wrap gap-x-10 gap-y-6">
          <Field label="Alloué">{allocated ?? <Missing />}</Field>
          <Field label="Consommé">{consumed ?? <Missing />}</Field>
          <Field label="Date de relevé">
            {budget.measuredOn ? (
              formatDay(budget.measuredOn)
            ) : (
              <Missing feminine />
            )}
          </Field>
          <Field label="Outil de gestion">
            {budget.externalUrl ? (
              /* Le nom de l'outil porte l'ancre quand il est là ; sinon une
                 phrase, parce qu'un lien nu ne dit pas où il mène. Un budget
                 **sans** lien profond reste un cas normal : aucun lien mort
                 n'est rendu. */
              <ExternalLink href={budget.externalUrl}>
                {budget.toolName ?? "Ouvrir le suivi budgétaire"}
              </ExternalLink>
            ) : (
              (budget.toolName ?? <Missing />)
            )}
          </Field>
        </dl>
      ) : (
        <div className="flex flex-col items-start gap-4">
          <BlockNote>
            La synthèse macro — alloué, consommé, date de relevé —
            s&apos;affichera ici, avec le lien vers l&apos;outil de gestion. Le
            suivi budgétaire est tenu là-bas ; Vision renvoie vers la source
            plutôt que d&apos;en reproduire le détail.
          </BlockNote>
          {editHref ? (
            <DrawerLink
              href={editHref}
              request={{ kind: "budget" }}
              className={buttonClass()}
            >
              <ButtonIcon>+</ButtonIcon>
              Saisir le budget
            </DrawerLink>
          ) : null}
        </div>
      )}

      {/* **Le geste quitte l'en-tête faute d'en-tête**, et prend la rangée
          alignée à droite que `resources.tsx` et `adopted-indicators.tsx`
          servent déjà sous leurs cartes. Aucun dessin neuf : c'est le même
          `ACTION_LINK`, au même endroit relatif — après ce qu'il modifie.

          Il ne paraît qu'avec un budget à modifier : l'état vide porte son
          propre geste, « Saisir le budget », et les deux ne se rencontrent
          jamais.

          Un `div` et non un `p` : la rangée voisine porte un `<form>` chez ses
          deux modèles, et le gabarit reste le leur. */}
      {budget && editHref ? (
        <div className="flex flex-wrap items-center justify-end gap-4">
          <DrawerLink
            href={editHref}
            request={{ kind: "budget" }}
            aria-label="Modifier le budget de cet accompagnement"
            className={ACTION_LINK}
          >
            Modifier
          </DrawerLink>
        </div>
      ) : null}
    </>
  );
}
