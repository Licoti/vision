/**
 * Le panneau de saisie d'activité — D30, et la seule inconnue technique de C3.
 *
 * `docs/06` §9 fait de la saisie d'activité **le** geste critique du produit :
 * elle doit tenir en moins d'une minute, en panneau latéral plutôt qu'en page
 * dédiée. Ce fichier lève la question qui conditionnait tout le chantier :
 * **ouvrir et fermer un panneau sans une ligne de JavaScript.**
 *
 * La réponse tient en une phrase : le panneau n'est pas un état, c'est une URL.
 * `?activite=nouvelle` sur la page du projet, et la page reste rendue derrière
 * lui — le contexte est conservé par construction, pas par un `useState` qu'il
 * faudrait sauvegarder. Trois sorties mènent au même endroit : la croix, le
 * bouton « Annuler » et le voile, tous trois de simples liens vers la page nue.
 *
 * **Composant serveur.** Aucun `"use client"` : rien ici n'a d'état, et c'est
 * tout le propos.
 *
 * **Le focus entre dans le panneau par `autofocus`, un attribut HTML** — React
 * le rend bien dans le balisage servi, vérifié — et il se pose sur la
 * fermeture : la première chose atteinte au clavier est la sortie. Le contenu
 * de la page, lui, porte `inert` : la tabulation ne visite jamais ce que le
 * voile masque.
 *
 * **Le cycle de tabulation, en revanche, demande du JavaScript** : `tabindex`
 * réordonne les arrêts, il n'en fait pas une boucle. `FocusTrap` le referme
 * quand le script est là, et **`aria-modal` n'est posé que par lui** — annoncer
 * que l'extérieur est hors d'atteinte serait faux tant que rien ne l'empêche.
 * Sans JavaScript, tout ce qui précède tient : le panneau s'ouvre, se ferme,
 * reçoit le focus, et on en sort par le haut du document.
 *
 * **Aucune ombre.** Le design system nomme ses élévations sans leur donner de
 * valeur (`docs/design/design-system.md` §8) ; l'interdit du ticket est
 * explicite — la question se fait remonter au journal, elle ne se comble pas.
 * La séparation vient du voile et d'un filet, deux jetons du thème.
 *
 * **Le formulaire n'enregistre rien à ce stade** : T3.3 lui donne son action,
 * sa validation et son droit d'écrire. Il porte déjà ses champs définitifs, de
 * sorte que le ticket suivant branche un formulaire plutôt que d'en écrire un.
 */

import Link from "next/link";
import type { ReactNode } from "react";

import { FocusTrap } from "@/components/ui/focus-trap";
import { activityFamily } from "@/lib/db/schema";

/** `framing` · `research` · … Dérivé du schéma, jamais réécrit à la main. */
type ActivityFamily = (typeof activityFamily.enumValues)[number];

/**
 * Les six familles de `docs/03` §2, dans l'ordre de l'énuméré du schéma.
 *
 * La famille est un **regroupement d'affichage** et rien d'autre : elle donne
 * au choix du type un axe de lecture, elle n'impose aucune méthodologie.
 */
const FAMILY_LABEL: Record<ActivityFamily, string> = {
  framing: "Cadrage",
  research: "Recherche",
  design: "Conception",
  evaluation: "Évaluation",
  measurement: "Mesure",
  transfer: "Transmission",
};

/** Un type d'activité proposé au choix : le référentiel du domaine (D16). */
export type ActivityTypeOption = {
  id: string;
  label: string;
  family: ActivityFamily;
};

/** Une approche proposée au choix. D12 — une seule par activité. */
export type ApproachOption = { id: string; label: string };

/**
 * Le filet des contrôles, plus sombre que celui des blocs.
 *
 * La raison est mesurée depuis T2.3 et reprise en T2.5 et T2.6 : la bordure
 * d'un champ est la limite d'un composant d'interface, elle se mesure à 3:1, et
 * aucun jeton `border-*` du design system ne l'atteint sur ce fond.
 * `content-neutral-normal` y arrive à 3,88:1.
 */
const CONTROL =
  "w-full rounded-lg border border-content-neutral-normal bg-surface-neutral-pale px-3 py-2 text-sm text-content-neutral-darkest";

export function ActivityPanel({
  projectName,
  closeHref,
  activityTypes,
  approaches,
}: {
  projectName: string;
  /** La page du projet, sans son paramètre. Les trois sorties y mènent. */
  closeHref: string;
  activityTypes: readonly ActivityTypeOption[];
  approaches: readonly ApproachOption[];
}) {
  const titleId = "panneau-activite-titre";

  /* Le référentiel arrive déjà trié par famille : les regrouper ne demande
     donc qu'un passage, et l'ordre des `optgroup` est celui du référentiel du
     domaine, pas celui de cette table de libellés. */
  const families = activityTypes.reduce<
    { family: ActivityFamily; types: ActivityTypeOption[] }[]
  >((groups, type) => {
    const last = groups.at(-1);
    if (last?.family === type.family) last.types.push(type);
    else groups.push({ family: type.family, types: [type] });
    return groups;
  }, []);

  return (
    <FocusTrap
      closeHref={closeHref}
      className="fixed inset-0 z-40 flex justify-end"
    >
      {/* Le voile ferme au clic, et **ne prend jamais le focus** : la fermeture
          au clavier passe par la croix et par « Annuler », qui portent l'une
          et l'autre un nom. Un lien sans texte, focalisable, serait un arrêt
          de tabulation muet. */}
      <Link
        href={closeHref}
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 bg-surface-neutral-opacity-distinct"
      />

      {/* Le filet gauche est **plus sombre que celui des contrôles**, et il a
          été mesuré avant d'être cru : `content-neutral-normal` — le choix
          retenu partout depuis T2.3 — tombe à 1,46:1 contre le voile,
          c'est-à-dire une limite de panneau qu'on devine. `content-neutral-dark`
          donne 3,05:1 côté voile et 8,12:1 côté panneau. C'est ce filet qui
          porte la séparation, faute d'ombre : le design system nomme ses
          élévations sans les définir, et l'inventer est interdit. */}
      <div
        role="dialog"
        aria-labelledby={titleId}
        className="relative flex h-full w-110 max-w-full flex-col border-l border-content-neutral-dark bg-surface-neutral-pale"
      >
        <div className="flex flex-none items-start justify-between gap-4 border-b border-surface-neutral-lighter px-6 py-5">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-md font-semibold text-content-neutral-darkest"
            >
              Nouvelle activité
            </h2>
            {/* Le nom du projet : le panneau ne quitte pas son contexte, il
                le rappelle. */}
            <p className="mt-1 text-xs text-content-neutral-base">
              {projectName}
            </p>
          </div>

          {/* `autoFocus` est rendu dans le HTML servi : à l'ouverture, le focus
              est déjà dans le panneau, et sur la sortie. C'est la moitié du
              comportement modal qui ne coûte aucun script. */}
          <Link
            href={closeHref}
            autoFocus
            aria-label="Fermer le panneau"
            className="flex size-8 flex-none items-center justify-center rounded-lg border border-content-neutral-normal text-sm text-content-neutral-dark"
          >
            <span aria-hidden="true">✕</span>
          </Link>
        </div>

        <form className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
          {/* D16 — le type est le seul champ vraiment obligatoire, et il vient
              du référentiel du domaine : jamais une liste codée en dur
              (`docs/03` §2). */}
          <PanelField label="Type d'activité" htmlFor="activite-type" required>
            {activityTypes.length > 0 ? (
              <select id="activite-type" name="activityTypeId" className={CONTROL}>
                <option value="">Choisir un type</option>
                {families.map((group) => (
                  <optgroup
                    key={group.family}
                    label={FAMILY_LABEL[group.family]}
                  >
                    {group.types.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            ) : (
              <p className="text-sm text-content-neutral-dark">
                {"Aucun type d'activité au référentiel du domaine."}
              </p>
            )}
          </PanelField>

          {/* D14 — « à planifier » n'est pas un état du schéma : c'est une
              activité prévue qui n'a pas encore de date. La case et la période
              se répondent, et le dire en toutes lettres est ce qui remplace le
              masquage au clic de la maquette : sans JavaScript, un champ ne
              disparaît pas. */}
          <fieldset className="flex flex-col gap-2.5">
            <legend className="text-2xs font-semibold text-content-neutral-dark uppercase">
              Période
            </legend>
            <label
              htmlFor="activite-unscheduled"
              className="flex items-center gap-2 text-sm text-content-neutral-darkest"
            >
              <input
                id="activite-unscheduled"
                name="isUnscheduled"
                type="checkbox"
                className="accent-surface-primary-base"
              />
              À planifier, sans date
            </label>
            <p className="text-xs text-content-neutral-base">
              {"Cochée, elle remplace la période : l'activité rejoint le groupe « à planifier » de la roadmap. La période se saisit au jour et se lit au mois."}
            </p>

            <div className="flex flex-wrap gap-4">
              <PanelField
                label="Début"
                htmlFor="activite-debut"
                className="flex-1"
              >
                <input
                  id="activite-debut"
                  name="periodStart"
                  type="date"
                  className={CONTROL}
                />
              </PanelField>

              <PanelField label="Fin" htmlFor="activite-fin" className="flex-1">
                <input
                  id="activite-fin"
                  name="periodEnd"
                  type="date"
                  className={CONTROL}
                />
              </PanelField>
            </div>
          </fieldset>

          {/* D12 — approche et type sont deux axes distincts, et une activité
              n'en porte qu'une. */}
          <PanelField
            label="Approche"
            htmlFor="activite-approche"
            note="Facultative. Une seule par activité."
          >
            {approaches.length > 0 ? (
              <select id="activite-approche" name="approachId" className={CONTROL}>
                <option value="">Aucune</option>
                {approaches.map((approach) => (
                  <option key={approach.id} value={approach.id}>
                    {approach.label}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-content-neutral-dark">
                Aucune approche au référentiel du domaine.
              </p>
            )}
          </PanelField>

          <PanelField
            label="Objectif"
            htmlFor="activite-objectif"
            note="Facultatif, et fortement encouragé. Une phrase qui dit ce que cette activité cherche à obtenir."
          >
            <input
              id="activite-objectif"
              name="objective"
              type="text"
              autoComplete="off"
              className={CONTROL}
            />
          </PanelField>
        </form>

        {/* « Enregistrer » est inactif : le ticket interdit toute écriture, et
            un bouton qui rechargerait la page en jetant la saisie mentirait
            davantage qu'un bouton visiblement inactif. T3.3 lui donne son
            action serveur. */}
        <div className="flex flex-none flex-wrap items-center gap-4 border-t border-surface-neutral-lighter px-6 py-4">
          <button
            type="submit"
            disabled
            className="rounded-lg bg-surface-primary-base px-4 py-2 text-sm font-semibold text-content-neutral-pale opacity-60"
          >
            Enregistrer
          </button>
          <Link
            href={closeHref}
            className="text-sm font-semibold text-content-primary-dark underline"
          >
            Annuler
          </Link>
        </div>
      </div>
    </FocusTrap>
  );
}

/**
 * Un champ du panneau : son intitulé, sa note, son contrôle.
 *
 * Jumeau du `FormField` de `project-form.tsx`, et redit ici plutôt
 * qu'importé : ce fichier-là est `"use client"`, et l'importer entraînerait un
 * module client dans un composant serveur pour quinze lignes de balisage.
 * Dette assumée, consignée au journal.
 *
 * L'intitulé est un `<label for>` — jamais un `placeholder` en guise de nom :
 * il disparaîtrait à la première frappe, et l'assistance ne le lit pas.
 */
function PanelField({
  label,
  htmlFor,
  note,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  note?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <label
        htmlFor={htmlFor}
        className="text-2xs font-semibold text-content-neutral-dark uppercase"
      >
        {label}
        {/* « obligatoire » est écrit, pas seulement marqué d'une étoile : un
            symbole coloré ne porte jamais seul une information. */}
        {required ? (
          <span className="font-normal text-content-neutral-base">
            {" (obligatoire)"}
          </span>
        ) : null}
      </label>
      {note ? <p className="text-xs text-content-neutral-base">{note}</p> : null}
      {children}
    </div>
  );
}
