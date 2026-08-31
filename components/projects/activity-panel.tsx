"use client";

/**
 * Le panneau de saisie d'activité — D30, et le geste critique du produit.
 *
 * `docs/06` §9 : la saisie d'activité doit tenir en moins d'une minute, en
 * panneau latéral plutôt qu'en page dédiée. T3.2 a levé la question qui
 * conditionnait tout le chantier — **ouvrir et fermer un panneau sans une ligne
 * de JavaScript** — et T3.3 lui donne son action.
 *
 * La réponse de T3.2 tient en une phrase, et elle n'a pas bougé : le panneau
 * n'est pas un état, c'est une URL. `?activite=nouvelle` sur la page du projet,
 * et la page reste rendue derrière lui — le contexte est conservé par
 * construction, pas par un `useState` qu'il faudrait sauvegarder. Trois sorties
 * mènent au même endroit : la croix, « Annuler » et le voile, tous trois de
 * simples liens vers la page nue.
 *
 * **Ce fichier était un composant serveur, et ne l'est plus.** T3.2 en faisait
 * une propriété — « rien ici n'a d'état, et c'est tout le propos ». La fiche de
 * T3.3 exige qu'« une saisie refusée revienne dans le panneau avec ses
 * valeurs », ce qui demande `useActionState`, donc une frontière client. Le
 * panneau prend donc la forme exacte de `project-form.tsx` depuis T2.5 : un
 * composant client dont l'action serveur est **déjà liée**, et que React 19
 * améliore progressivement — le formulaire est soumis par le navigateur,
 * l'action s'exécute, et **tout fonctionne sans une ligne de JavaScript**. Ce
 * que le hook ajoute quand JavaScript est là : la saisie survit à un refus sans
 * recharger la page.
 *
 * Il ne reçoit pas la session : un composant client n'a rien à faire d'un
 * contexte de droits. Il reçoit ce qu'il affiche — les deux référentiels, le
 * nom du projet — et une action qui ne connaît ni le domaine ni l'identifiant
 * du projet. **C'est le serveur qui décide ce que ce formulaire écrit, jamais
 * un champ caché.**
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
 *
 * **Un seul formulaire, deux points d'entrée** (T3.4). Corriger une activité
 * ouvre ce panneau-ci, pré-rempli : mêmes champs, mêmes règles, même
 * validation. Ce qui change tient en trois props d'affichage — le titre,
 * l'intitulé du bouton, la saisie de départ — et **rien dans le comportement**.
 * Le panneau ne sait pas s'il crée ou s'il corrige : c'est l'action qui le
 * sait, et elle est liée côté serveur.
 *
 * **L'état ne se saisit pas, il se déduit de la période** (`docs/06` §9). Le
 * panneau ne porte donc aucun choix d'état : la règle vit dans
 * `lib/forms/activity.ts`, et la correction à la main est le geste de T3.5. En
 * correction, cette dérivation n'a lieu **que si la période a bougé** — même
 * fichier, même raison.
 *
 * **La planification se choisit en trois modes exclusifs** (31/08/2026) — à
 * planifier, période, date précise —, et les champs suivent le choix. Ce
 * fichier a longtemps affirmé le contraire : *« sans JavaScript, un champ ne
 * disparaît pas »*, écrit pour justifier que la case et les deux dates
 * cohabitent. L'énoncé était juste quand il a été écrit et ne l'est plus —
 * `:has()` est disponible partout depuis fin 2023, et `checkbox-chip.ts` s'en
 * sert déjà pour teinter une pastille cochée sans une ligne de script. Le
 * masquage est donc en CSS, `hidden group-has-checked:flex`, et **le panneau ne
 * gagne aucun état React** : ce qui précède reste vrai au caractère près.
 *
 * **Aucune ombre.** Le design system nomme ses élévations sans leur donner de
 * valeur (`docs/design/design-system.md` §8) ; la séparation vient du voile et
 * d'un filet, deux jetons du thème.
 *
 * **On cherche un participant au lieu de parcourir le référentiel**
 * (29/08/2026, hors ticket, à la demande — même geste que le formulaire de
 * projet, même composant). Ce que ce fichier affirme plus haut du
 * fonctionnement sans JavaScript **reste vrai au caractère près** : le HTML
 * servi porte toujours une case à cocher par personne du domaine. `Picker`
 * (`components/ui/picker.tsx`) ne remplace cet affichage qu'**au montage**, et
 * une personne retenue porte alors un champ caché de même nom — `participantIds`
 * ne change pas, `readActivityForm` non plus.
 *
 * **Une différence avec l'équipe de projet, et elle est assumée** :
 * `ActivityFormPerson` ne porte ni métier ni disponibilité, là où
 * `ProjectFormPerson` porte les deux. La recherche ne s'appuie donc ici que sur
 * le nom. Étendre `listActivityFormOptions` serait le « pendant que j'y suis »
 * que la règle 3 interdit ; l'écart est au journal technique.
 */

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { borderOf, CONTROL, FormField } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import { Picker } from "@/components/ui/picker";
import { formatActivityFamily } from "@/lib/format";
import {
  EMPTY_ACTIVITY_VALUES,
  type ActivityFormState,
  type ActivityFormValues,
} from "@/lib/forms/activity";
import type {
  ActivityFamily,
  ActivityFormPerson,
  ActivityTypeOption,
  ApproachOption,
} from "@/lib/queries/activities";

/* La carte d'une option de planification : un bouton radio, un titre, et la
   phrase qui dit à quoi l'option sert.

   **Ces classes sont celles du « Type » de produit** (`product-form.tsx`), au
   caractère près — deuxième écriture du même motif. Les replier dans le socle
   demanderait d'ouvrir ce fichier-là, hors du périmètre de cette demande
   (règle 3) ; le point est au journal technique avec sa destination.

   `py-3` et non `py-2` : la clause 2 de `socleLock` interdit le second, qui est
   la signature d'un bouton secondaire. */
const PLANNING_CARD =
  "flex items-start gap-3 rounded-lg border border-content-neutral-normal bg-surface-neutral-pale px-4 py-3";

/* Les six libellés de famille vivaient ici jusqu'à T7.4, qui en a eu besoin
   côté serveur pour la liste d'administration : ils sont partis dans
   `lib/format.ts`, avec les libellés d'énuméré voisins. Un déplacement, pas une
   copie — aucun libellé ne change, et l'`optgroup` ci-dessous lit la même
   chose. */

export function ActivityPanel({
  action,
  activityTypes,
  approaches,
  persons,
  submitLabel = "Enregistrer",
  initial = EMPTY_ACTIVITY_VALUES,
}: {
  /**
   * L'action serveur, **déjà liée** côté serveur : au projet en création, au
   * projet **et** à l'activité en correction. Le panneau ne connaît ni l'un ni
   * l'autre — il ne sait même pas lequel des deux gestes il sert.
   */
  action: (
    state: ActivityFormState,
    formData: FormData,
  ) => Promise<ActivityFormState>;
  activityTypes: readonly ActivityTypeOption[];
  approaches: readonly ApproachOption[];
  /** Facultatif (`docs/03` §4). Aucune création à la volée — T2.6, D19. */
  persons: readonly ActivityFormPerson[];
  submitLabel?: string;
  /**
   * La saisie de départ — vide en création, la ligne existante en correction
   * (T3.4). C'est l'**état initial** de `useActionState` : un refus le remplace
   * par ce qui vient d'être tapé, et le pré-remplissage ne réapparaît jamais
   * par-dessus une saisie en cours.
   */
  initial?: ActivityFormValues;
}) {
  const [state, submit, pending] = useActionState(action, {
    values: initial,
    errors: {},
  });

  const values = state.values;
  const errors = state.errors;

  /* Qui participe. La case à cocher du repli reste non contrôlée : cet état ne
     gouverne que ce que le mode enrichi affiche, et une soumission refusée le
     retrouve tel que la personne l'avait laissé. */
  const [chosen, setChosen] = useState<readonly string[]>(
    () => initial.participantIds,
  );

  /* Aucun indice : `ActivityFormPerson` ne porte pas le métier, et l'étendre
     serait hors du geste demandé. La recherche porte donc sur le seul nom. */
  const participantOptions = persons.map((person) => ({
    ...person,
    label: person.fullName,
  }));

  /* Le référentiel arrive déjà trié par famille : les regrouper ne demande
     donc qu'un passage, et l'ordre des `optgroup` est celui du référentiel du
     domaine, pas celui de la table de libellés qui les nomme. */
  const families = activityTypes.reduce<
    { family: ActivityFamily; types: ActivityTypeOption[] }[]
  >((groups, type) => {
    const last = groups.at(-1);
    if (last?.family === type.family) last.types.push(type);
    else groups.push({ family: type.family, types: [type] });
    return groups;
  }, []);

  return (
    <Panel
      action={submit}
      pending={pending}
      submitLabel={submitLabel}
      message={state.message}
      errors={errors}
      ok={state.ok}
    >
      {/* D16 — le type est le seul champ vraiment obligatoire, et il vient
          du référentiel du domaine : jamais une liste codée en dur
          (`docs/03` §2). */}
      <FormField
        label="Type d'activité"
        htmlFor="activite-type"
        error={errors.activityTypeId}
        errorId="activite-type-erreur"
        required
      >
        {activityTypes.length > 0 ? (
          <select
            id="activite-type"
            name="activityTypeId"
            defaultValue={values.activityTypeId}
            aria-invalid={errors.activityTypeId ? true : undefined}
            aria-describedby={
              errors.activityTypeId ? "activite-type-erreur" : undefined
            }
            className={`${CONTROL} ${borderOf(errors.activityTypeId)}`}
          >
            <option value="">Choisir un type</option>
            {families.map((group) => (
              <optgroup
                key={group.family}
                label={formatActivityFamily(group.family)}
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
      </FormField>

      {/* **Trois modes exclusifs, et les champs suivent le choix** (31/08/2026).

          La case « à planifier » et les deux dates vivaient ici côte à côte,
          toutes visibles, et leurs combinaisons illégales étaient refusées
          après coup. Le commentaire qui s'y trouvait disait pourquoi : « sans
          JavaScript, un champ ne disparaît pas ». **Ce n'est plus vrai.**
          `:has()` est disponible partout depuis fin 2023, et le dépôt s'en sert
          déjà — `checkbox-chip.ts` porte son état coché en `has-checked:`,
          « il suit le clic, il suit une remise à zéro du formulaire, et il
          fonctionne sans une ligne de JavaScript ».

          Chaque option est un `group` qui contient sa carte **et** ses champs ;
          le bloc de champs porte `hidden group-has-checked:flex`. Aucun état
          React, rien à re-rendre, et le geste est identique avec et sans
          script. C'est le premier masquage conditionnel en CSS pur du dépôt.

          **Les trois blocs restent dans le document servi**, donc postés : ce
          n'est pas un défaut à contourner, c'est ce qui rend les deux régimes
          identiques. C'est le serveur qui décide lesquels comptent, sur
          `planning` et sur rien d'autre (`lib/forms/activity.ts`).

          La forme visuelle n'est pas neuve : c'est celle du « Type » de produit
          (`product-form.tsx`), une carte par valeur, avec la phrase qui dit à
          quoi elle sert. **Aucune teinte de sélection** — le radio natif porte
          l'état, les champs qui apparaissent le portent mieux encore, et
          `docs/06` §11 veut la hiérarchie par l'espacement et le poids, pas par
          la couleur. */}
      <fieldset className="flex flex-col gap-3">
        <legend className="text-2xs font-semibold text-content-neutral-dark uppercase">
          Planification
          <span className="font-normal text-content-neutral-base">
            {" (obligatoire)"}
          </span>
        </legend>

        {errors.planning ? (
          <p
            id="activite-planning-erreur"
            className="text-xs font-semibold text-content-danger-dark"
          >
            {errors.planning}
          </p>
        ) : null}

        {/* « À planifier » — D14. Aucun champ dessous : c'est tout le propos. */}
        <div className="group flex flex-col gap-3">
          <label
            htmlFor="activite-planning-unscheduled"
            className={PLANNING_CARD}
          >
            <input
              id="activite-planning-unscheduled"
              name="planning"
              type="radio"
              value="unscheduled"
              defaultChecked={values.planning === "unscheduled"}
              aria-describedby={
                errors.planning ? "activite-planning-erreur" : undefined
              }
              className="mt-1 accent-surface-primary-base"
            />
            <span className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-content-neutral-darkest">
                À planifier
              </span>
              <span className="text-xs text-content-neutral-dark">
                {
                  "La date n'est pas encore connue. L'activité rejoint le groupe « à planifier » de la roadmap."
                }
              </span>
            </span>
          </label>
        </div>

        {/* « Période » — le début est exigé, la fin ne l'est pas : `docs/03` §4
            n'attend qu'une date de début d'une activité en cours. */}
        <div className="group flex flex-col gap-3">
          <label htmlFor="activite-planning-period" className={PLANNING_CARD}>
            <input
              id="activite-planning-period"
              name="planning"
              type="radio"
              value="period"
              defaultChecked={values.planning === "period"}
              aria-describedby={
                errors.planning ? "activite-planning-erreur" : undefined
              }
              className="mt-1 accent-surface-primary-base"
            />
            <span className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-content-neutral-darkest">
                Période
              </span>
              <span className="text-xs text-content-neutral-dark">
                Sur plusieurs jours ou semaines. La période se saisit au jour et
                se lit au mois.
              </span>
            </span>
          </label>

          {/* Les champs sont **hors du `label`** : cliquer une date ne doit pas
              traverser un label et retomber sur son bouton radio. */}
          <div className="hidden flex-wrap gap-4 pl-4 group-has-checked:flex">
            <FormField
              label="Début"
              htmlFor="activite-debut"
              error={errors.periodStart}
              errorId="activite-debut-erreur"
              className="flex-1"
            >
              <input
                id="activite-debut"
                name="periodStart"
                type="date"
                defaultValue={values.periodStart}
                aria-invalid={errors.periodStart ? true : undefined}
                aria-describedby={
                  errors.periodStart ? "activite-debut-erreur" : undefined
                }
                className={`${CONTROL} ${borderOf(errors.periodStart)}`}
              />
            </FormField>

            <FormField
              label="Fin"
              htmlFor="activite-fin"
              note="Facultative."
              error={errors.periodEnd}
              errorId="activite-fin-erreur"
              className="flex-1"
            >
              <input
                id="activite-fin"
                name="periodEnd"
                type="date"
                defaultValue={values.periodEnd}
                aria-invalid={errors.periodEnd ? true : undefined}
                aria-describedby={
                  errors.periodEnd ? "activite-fin-erreur" : undefined
                }
                className={`${CONTROL} ${borderOf(errors.periodEnd)}`}
              />
            </FormField>
          </div>
        </div>

        {/* « Date précise » — en base, une période d'un jour : la même date aux
            deux bornes. Aucune colonne ne dit le mode, il se relit sur elles. */}
        <div className="group flex flex-col gap-3">
          <label htmlFor="activite-planning-day" className={PLANNING_CARD}>
            <input
              id="activite-planning-day"
              name="planning"
              type="radio"
              value="day"
              defaultChecked={values.planning === "day"}
              aria-describedby={
                errors.planning ? "activite-planning-erreur" : undefined
              }
              className="mt-1 accent-surface-primary-base"
            />
            <span className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-content-neutral-darkest">
                Date précise
              </span>
              <span className="text-xs text-content-neutral-dark">
                {
                  "Un seul jour — une restitution, un atelier. Elle se lit au jour."
                }
              </span>
            </span>
          </label>

          <div className="hidden flex-wrap gap-4 pl-4 group-has-checked:flex">
            <FormField
              label="Le"
              htmlFor="activite-jour"
              error={errors.periodDay}
              errorId="activite-jour-erreur"
              className="flex-1"
            >
              <input
                id="activite-jour"
                name="periodDay"
                type="date"
                defaultValue={values.periodDay}
                aria-invalid={errors.periodDay ? true : undefined}
                aria-describedby={
                  errors.periodDay ? "activite-jour-erreur" : undefined
                }
                className={`${CONTROL} ${borderOf(errors.periodDay)}`}
              />
            </FormField>
          </div>
        </div>

        {/* L'état n'est pas un champ : il se déduit de ce qui précède
            (`docs/06` §9). Le dire évite qu'on le cherche. */}
        <p className="text-xs text-content-neutral-base">
          {
            "L'état ne se saisit pas : une période passée donne une activité terminée, une période en cours une activité en cours, une période à venir ou sans date une activité prévue."
          }
        </p>
      </fieldset>

      {/* D12 — approche et type sont deux axes distincts, et une activité
          n'en porte qu'une. */}
      <FormField
        label="Approche"
        htmlFor="activite-approche"
        note="Facultative. Une seule par activité."
        error={errors.approachId}
        errorId="activite-approche-erreur"
      >
        {approaches.length > 0 ? (
          <select
            id="activite-approche"
            name="approachId"
            defaultValue={values.approachId}
            aria-invalid={errors.approachId ? true : undefined}
            aria-describedby={
              errors.approachId ? "activite-approche-erreur" : undefined
            }
            className={`${CONTROL} ${borderOf(errors.approachId)}`}
          >
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
      </FormField>

      <FormField
        label="Objectif"
        htmlFor="activite-objectif"
        note="Facultatif, et fortement encouragé. Une phrase qui dit ce que cette activité cherche à obtenir."
        error={errors.objective}
        errorId="activite-objectif-erreur"
      >
        <input
          id="activite-objectif"
          name="objective"
          type="text"
          defaultValue={values.objective}
          autoComplete="off"
          className={`${CONTROL} ${borderOf(errors.objective)}`}
        />
      </FormField>

      {/* Le lien vers l'outil où le travail se fait (21/08/2026) — Ergonome
          pour un audit UX, Everyone pour un audit d'accessibilité.

          **À ne pas confondre avec « Lien vers le rapport »** du panneau de
          résultat : celui-là pointe une mesure produite, donc n'existe qu'une
          fois l'activité terminée ; celui-ci pointe l'espace de travail, et
          vaut dès qu'une activité est prévue.

          **Le champ est offert à tous les types, et il ne disparaît pas.**
          Le masquer selon le type demanderait du JavaScript, et c'est
          exactement ce que la case « à planifier » ci-dessus refuse de faire
          pour la même raison. La note dit à qui il s'adresse ; une activité
          sans outil le laisse vide, ce qui est un cas normal.

          `type="url"` sert le clavier des mobiles ; la validation qui compte
          est celle de `validateActivityForm`. */}
      <FormField
        label="Lien vers l'outil"
        htmlFor="activite-lien"
        note="Facultatif. Pour une activité outillée — l'audit dans Ergonome ou dans Everyone, par exemple. Vision renvoie vers l'outil, elle n'en reproduit pas le contenu."
        error={errors.externalUrl}
        errorId="activite-lien-erreur"
      >
        <input
          id="activite-lien"
          name="externalUrl"
          type="url"
          inputMode="url"
          defaultValue={values.externalUrl}
          autoComplete="off"
          placeholder="https://"
          aria-invalid={errors.externalUrl ? true : undefined}
          aria-describedby={
            errors.externalUrl ? "activite-lien-erreur" : undefined
          }
          className={`${CONTROL} ${borderOf(errors.externalUrl)}`}
        />
      </FormField>

      {/* Facultatif (`docs/03` §4). Sur le modèle de l'équipe de projet
          (T2.6) : les personnes viennent de la liste existante, aucune
          création à la volée (D19). Aucun rôle, aucune quotité : la case
          seule porte l'information. */}
      <fieldset className="flex flex-col gap-2">
        <legend className="text-2xs font-semibold text-content-neutral-dark uppercase">
          Participants
        </legend>
        <Picker
          searchLabel="Rechercher une personne"
          placeholder="Un nom…"
          note={
            <p className="text-xs text-content-neutral-base">
              {
                "Facultatif. Les personnes qui ont pris part à cette activité, parmi celles déjà référencées dans le domaine."
              }
            </p>
          }
          options={participantOptions}
          chosen={chosen}
          onChoose={(personId) =>
            setChosen((was) =>
              was.includes(personId) ? was : [...was, personId],
            )
          }
          renderRow={(person, enhanced) =>
            enhanced ? (
              <span className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm text-content-neutral-darkest">
                  {person.fullName}
                  {person.kind === "stakeholder" ? (
                    <span className="text-xs text-content-neutral-base">
                      {" · côté entité"}
                    </span>
                  ) : null}
                </span>
                {/* Le champ porte le **même nom** que la case du repli : le
                    contrat de `readActivityForm` ne bouge pas. */}
                <input
                  type="hidden"
                  name="participantIds"
                  value={person.id}
                />
                <Button
                  type="button"
                  variant="tertiary"
                  onClick={() =>
                    setChosen((was) => was.filter((kept) => kept !== person.id))
                  }
                >
                  Retirer
                  <span className="sr-only">{` ${person.fullName} des participants`}</span>
                </Button>
              </span>
            ) : (
              <label
                htmlFor={`activite-participant-${person.id}`}
                className="flex items-center gap-2 text-sm text-content-neutral-darkest"
              >
                <input
                  id={`activite-participant-${person.id}`}
                  name="participantIds"
                  type="checkbox"
                  value={person.id}
                  defaultChecked={values.participantIds.includes(person.id)}
                  aria-describedby={
                    errors.participantIds
                      ? "activite-participants-erreur"
                      : undefined
                  }
                  className="accent-surface-primary-base"
                />
                {person.fullName}
                {/* Texte, jamais couleur seule (`docs/06` §11) — la
                    règle de T2.4 et T2.6, reprise ici pour un troisième
                    écran. */}
                {person.kind === "stakeholder" ? (
                  <span className="text-xs text-content-neutral-base">
                    {" · côté entité"}
                  </span>
                ) : null}
              </label>
            )
          }
          emptyOptions={
            <p className="text-sm text-content-neutral-dark">
              Aucune personne référencée dans ce domaine.
            </p>
          }
          noMatch="Aucune personne ne correspond à cette recherche."
          countLabel={(shown, total) =>
            shown < total
              ? `${shown} personnes proposées sur ${total} qui correspondent.`
              : total === 1
                ? "1 personne correspond."
                : `${total} personnes correspondent.`
          }
        />

        {errors.participantIds ? (
          <p
            id="activite-participants-erreur"
            className="text-xs font-semibold text-content-danger-dark"
          >
            {errors.participantIds}
          </p>
        ) : null}
      </fieldset>
    </Panel>
  );
}
