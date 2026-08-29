"use client";

/**
 * Le formulaire d'un accompagnement — création et modification, le même.
 *
 * Troisième composant client du projet, après `MainNav` et `ProductForm`, et
 * pour la même unique raison : `useActionState`. React 19 l'améliore
 * progressivement — l'action est une action serveur, le formulaire est soumis
 * par le navigateur, et **tout fonctionne sans une ligne de JavaScript**. Ce
 * que le hook apporte quand JavaScript est là : la saisie survit à un refus.
 * Sans lui, une équipe de dix personnes serait à ressaisir au premier nom
 * oublié.
 *
 * Il ne reçoit pas la session : un composant client n'a rien à faire d'un
 * contexte de droits. Il reçoit ce qu'il affiche — les référentiels, les
 * personnes, les valeurs initiales — et une action **déjà liée**, dont il ne
 * connaît ni le domaine ni l'identifiant du projet. C'est le serveur qui
 * décide ce que ce formulaire écrit, jamais un champ caché.
 *
 * **L'entité ne se saisit pas** : elle vient du produit (D24, `docs/02` — elle
 * qualifie les produits). Elle est donc écrite dans le libellé de chaque
 * option, où elle se lit sans JavaScript, plutôt que dans un champ qui aurait
 * demandé un état client pour suivre le choix.
 *
 * **Il puise dans le référentiel des personnes, il ne l'alimente plus**
 * (T5bis.7, arbitrage (g) de C5bis). Le bloc « Ajouter une personne » de T2.6
 * est parti dans `/equipe`, où une personne se crée avec son métier, sa
 * disponibilité et ses compétences ; ce qui reste ici est **une désignation**,
 * et chaque ligne porte de quoi la faire en connaissance de cause. Ce qu'elle
 * ne porte pas : aucun niveau de compétence, aucun rapprochement avec les
 * métiers déclarés du projet — D44 pose que les deux peuvent diverger.
 *
 * **On y cherche une personne au lieu de parcourir le référentiel** (29/08/2026,
 * hors ticket, à la demande). C'est la recherche par liste de D32, et c'est
 * l'interdit de la fiche de T5bis.7 — « aucun filtre ni recherche dans le
 * formulaire de projet » — qui tombe, sur demande humaine ; l'écart est au
 * journal technique. Ce que la phrase ci-dessus affirme du fonctionnement sans
 * JavaScript **reste vrai au caractère près** : le HTML servi porte toujours la
 * liste entière, une ligne et un `select` par personne du domaine. `Picker`
 * (`components/ui/picker.tsx`) ne remplace cet affichage qu'**au montage**, par
 * un champ de recherche et les seules personnes retenues — et les deux modes
 * passent par la même fonction de ligne, pour qu'un repli ne soit pas une
 * seconde écriture qui divergera.
 *
 * **Rien du contrat de saisie ne bouge.** Une personne non retenue n'a
 * simplement pas de champ `team:<uuid>` dans le `FormData`, ce que
 * `readProjectForm` et `syncMembers` traitent déjà comme un retrait.
 *
 * Le filet des contrôles est plus sombre que celui des blocs, pour la raison
 * mesurée en T2.3 et reprise en T2.5 : la bordure d'un champ est la limite d'un
 * composant d'interface, elle se mesure à 3:1, et aucun jeton `border-*` du
 * design system ne l'atteint sur ce fond.
 */

import Link from "next/link";
import { useActionState, useId, useState } from "react";

import { AvailabilityDot } from "@/components/team/availability-dot";
import { ACTION_LINK_SM } from "@/components/ui/action-link";
import { Button } from "@/components/ui/button";
import {
  borderOf,
  CONTROL_TEXT,
  FormAlert,
  FormField,
} from "@/components/ui/form-field";
import { Picker } from "@/components/ui/picker";

import {
  EMPTY_PROJECT_VALUES,
  TEAM_ROLES,
  TEAM_ROLE_LABEL,
  teamFieldName,
  type ProjectFormState,
  type ProjectFormValues,
} from "@/lib/forms/project";
import { ROUTES } from "@/lib/navigation";
import type {
  ProjectFormPerson,
  ProjectFormProduct,
} from "@/lib/queries/projects";

/** Une valeur de référentiel : statut, métier, approche. */
type ProjectFormOption = { id: string; label: string };

const BLOCK =
  "flex flex-col gap-3 rounded-lg border border-content-neutral-normal bg-surface-neutral-pale px-4 py-4";

/**
 * Le rôle qu'affiche une ligne au premier rendu.
 *
 * Dans le repli, c'est la saisie, et « pas dans l'équipe » à défaut. Avec le
 * champ de recherche, une ligne n'existe que si la personne est retenue : une
 * personne qu'on vient de désigner n'a encore aucun rôle saisi, et le sien est
 * « Membre » — le moins des deux, jamais le droit d'écrire (D9).
 */
function roleOf(saved: string | undefined, enhanced: boolean): string {
  if (saved && saved !== "none") return saved;
  return enhanced ? "member" : "none";
}

export function ProjectForm({
  action,
  products,
  statuses,
  jobs,
  approaches,
  people,
  initial = EMPTY_PROJECT_VALUES,
  submitLabel,
  cancelHref,
}: {
  action: (
    state: ProjectFormState,
    formData: FormData,
  ) => Promise<ProjectFormState>;
  products: readonly ProjectFormProduct[];
  statuses: readonly ProjectFormOption[];
  jobs: readonly ProjectFormOption[];
  approaches: readonly ProjectFormOption[];
  people: readonly ProjectFormPerson[];
  initial?: ProjectFormValues;
  submitLabel: string;
  /** Où l'on retourne sans rien écrire : la liste, ou la page du projet. */
  cancelHref: string;
}) {
  const [state, submit, pending] = useActionState(action, {
    values: initial,
    errors: {},
  });

  const prefix = useId();
  const id = (field: string) => `${prefix}-${field}`;
  const errorId = (field: string) => `${prefix}-${field}-erreur`;

  /* Ce que le formulaire réaffiche : la dernière saisie refusée, ou les
     valeurs d'origine au premier rendu. */
  const values = state.values;
  const errors = state.errors;

  /* Qui est retenu, et rien d'autre : le **rôle** reste dans son `select`, non
     contrôlé, exactement comme avant. Une soumission refusée ne remet pas cet
     état à zéro et n'a pas à le faire — le DOM porte déjà la dernière saisie,
     et cet état porte les mêmes personnes qu'elle. */
  const [chosen, setChosen] = useState<readonly string[]>(() =>
    Object.entries(initial.team)
      .filter(([, role]) => role !== "none")
      .map(([personId]) => personId),
  );

  /* Le libellé cherché est le nom, l'indice est le métier : taper « research »
     doit trouver les personnes dont c'est le métier. */
  const teamOptions = people.map((person) => ({
    ...person,
    label: person.fullName,
    hint: person.jobLabel ?? undefined,
  }));

  /* Le choix du rôle, écrit une fois pour les deux modes : les trois valeurs
     de D9 dans le repli, deux seulement quand le retrait est un bouton. */
  const roleSelect = (person: ProjectFormPerson, enhanced: boolean) => (
    <select
      id={id(`team-${person.id}`)}
      name={teamFieldName(person.id)}
      defaultValue={roleOf(values.team[person.id], enhanced)}
      aria-describedby={id(`team-${person.id}-profil`)}
      className="rounded-lg border border-content-neutral-normal bg-surface-neutral-pale px-3 py-1.5 text-sm text-content-neutral-darkest"
    >
      {/* « Pas dans l'équipe » n'a de sens que dans le repli, où c'est le seul
          moyen d'écarter quelqu'un. Là où le champ de recherche est là, le
          retrait est un bouton, et une ligne présente est toujours une personne
          retenue. */}
      {(enhanced
        ? TEAM_ROLES.filter((role) => role !== "none")
        : TEAM_ROLES
      ).map((role) => (
        <option key={role} value={role}>
          {TEAM_ROLE_LABEL[role]}
        </option>
      ))}
    </select>
  );

  return (
    <form action={submit} className="flex max-w-160 flex-col gap-6" noValidate>
      <FormAlert message={state.message} errors={errors} />

      <FormField
        label="Produit accompagné"
        htmlFor={id("productId")}
        error={errors.productId}
        errorId={errorId("productId")}
        note="Le rattachement est obligatoire. L'entité, indiquée à côté de chaque produit, en découle : elle ne se saisit pas."
      >
        <select
          id={id("productId")}
          name="productId"
          defaultValue={values.productId}
          aria-invalid={errors.productId ? true : undefined}
          aria-describedby={errors.productId ? errorId("productId") : undefined}
          className={`${CONTROL_TEXT} ${borderOf(errors.productId)}`}
        >
          <option value="">Choisir un produit</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} — {product.entityLabel}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label="Nom de l'accompagnement"
        htmlFor={id("name")}
        error={errors.name}
        errorId={errorId("name")}
      >
        <input
          id={id("name")}
          name="name"
          type="text"
          defaultValue={values.name}
          autoComplete="off"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? errorId("name") : undefined}
          className={`${CONTROL_TEXT} ${borderOf(errors.name)}`}
        />
      </FormField>

      <FormField
        label="Objectif"
        htmlFor={id("objective")}
        error={errors.objective}
        errorId={errorId("objective")}
        note="Facultatif. Une phrase qui dit ce que cet accompagnement cherche à obtenir."
      >
        <textarea
          id={id("objective")}
          name="objective"
          rows={2}
          defaultValue={values.objective}
          className={`${CONTROL_TEXT} ${borderOf(errors.objective)}`}
        />
      </FormField>

      <FormField
        label="Statut"
        htmlFor={id("statusId")}
        error={errors.statusId}
        errorId={errorId("statusId")}
        note="Le statut est saisi, jamais déduit des activités."
      >
        <select
          id={id("statusId")}
          name="statusId"
          defaultValue={values.statusId}
          aria-invalid={errors.statusId ? true : undefined}
          aria-describedby={errors.statusId ? errorId("statusId") : undefined}
          className={`${CONTROL_TEXT} ${borderOf(errors.statusId)}`}
        >
          <option value="">Choisir un statut</option>
          {statuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.label}
            </option>
          ))}
        </select>
      </FormField>

      {/* La période se saisit au jour et se lit au mois (D13) : on saisit plus
          fin qu'on n'affiche, et la fin reste une fin **attendue**. */}
      <fieldset className="flex flex-col gap-3">
        <legend className="text-2xs font-semibold text-content-neutral-dark uppercase">
          Période
        </legend>
        <p className="text-xs text-content-neutral-base">
          {"Facultative. Un accompagnement qui n'a pas de fin prévue s'affichera « depuis » son mois de début."}
        </p>
        <div className="flex flex-wrap gap-4">
          <FormField
            label="Début"
            htmlFor={id("startedOn")}
            error={errors.startedOn}
            errorId={errorId("startedOn")}
            className="flex-1"
          >
            <input
              id={id("startedOn")}
              name="startedOn"
              type="date"
              defaultValue={values.startedOn}
              aria-invalid={errors.startedOn ? true : undefined}
              aria-describedby={
                errors.startedOn ? errorId("startedOn") : undefined
              }
              className={`${CONTROL_TEXT} ${borderOf(errors.startedOn)}`}
            />
          </FormField>

          <FormField
            label="Fin attendue"
            htmlFor={id("expectedEndOn")}
            error={errors.expectedEndOn}
            errorId={errorId("expectedEndOn")}
            className="flex-1"
          >
            <input
              id={id("expectedEndOn")}
              name="expectedEndOn"
              type="date"
              defaultValue={values.expectedEndOn}
              aria-invalid={errors.expectedEndOn ? true : undefined}
              aria-describedby={
                errors.expectedEndOn ? errorId("expectedEndOn") : undefined
              }
              className={`${CONTROL_TEXT} ${borderOf(errors.expectedEndOn)}`}
            />
          </FormField>
        </div>
      </fieldset>

      <FormField
        label="Commanditaire"
        htmlFor={id("sponsor")}
        error={errors.sponsor}
        errorId={errorId("sponsor")}
        note="Facultatif, en texte libre (D6) : qui, côté entité, porte la demande."
      >
        <input
          id={id("sponsor")}
          name="sponsor"
          type="text"
          defaultValue={values.sponsor}
          autoComplete="off"
          className={`${CONTROL_TEXT} ${borderOf(errors.sponsor)}`}
        />
      </FormField>

      {/* D44 — les métiers déclarés du projet font foi pour le filtrage et
          l'affichage, indépendamment de ceux que porte l'équipe. */}
      <CheckboxGroup
        legend="Métiers mobilisés"
        note="Les métiers déclarés ici font foi pour la liste des projets. Ils peuvent différer de ceux de l'équipe."
        name="jobIds"
        idFor={id}
        options={jobs}
        checked={values.jobIds}
        error={errors.jobIds}
        errorId={errorId("jobIds")}
        empty="Aucun métier au référentiel du domaine."
      />

      <CheckboxGroup
        legend="Approches"
        note="Plusieurs approches par accompagnement sont possibles."
        name="approachIds"
        idFor={id}
        options={approaches}
        checked={values.approachIds}
        error={errors.approachIds}
        errorId={errorId("approachIds")}
        empty="Aucune approche au référentiel du domaine."
      />

      {/* D9 — appartenir à l'équipe et avoir le droit d'écrire sont deux
          choses distinctes. Une seule valeur par personne les porte toutes
          les deux : l'état « contributeur sans être membre » n'existe pas. */}
      <fieldset className="flex flex-col gap-3">
        <legend className="text-2xs font-semibold text-content-neutral-dark uppercase">
          Équipe
        </legend>
        <Picker
          searchLabel="Rechercher une personne"
          placeholder="Un nom, un métier…"
          note={
            <p className="text-xs text-content-neutral-base">
              {"Un membre figure dans l'équipe. Un contributeur y figure et peut, en plus, saisir dans cet accompagnement."}
            </p>
          }
          options={teamOptions}
          chosen={chosen}
          onChoose={(personId) =>
            setChosen((was) =>
              was.includes(personId) ? was : [...was, personId],
            )
          }
          renderRow={(person, enhanced) => (
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Le nom seul reste dans le `<label>` : c'est le nom
                  accessible du `select`, et le lui allonger du métier et de
                  la disponibilité ferait annoncer un profil là où l'on
                  demande « quel rôle pour cette personne ? ». Le second rang
                  est donc un frère, désigné par `aria-describedby` — il se
                  lit à l'œil comme à l'assistance, sans se confondre avec le
                  nom du contrôle. */}
              <span className="flex min-w-0 flex-col gap-0.5">
                <label
                  htmlFor={id(`team-${person.id}`)}
                  className="text-sm text-content-neutral-darkest"
                >
                  {person.fullName}
                  {person.kind === "stakeholder" ? (
                    <span className="text-xs text-content-neutral-dark">
                      {" · côté entité"}
                    </span>
                  ) : null}
                </label>
                <span
                  id={id(`team-${person.id}-profil`)}
                  className="flex flex-wrap items-center gap-2 text-xs text-content-neutral-base"
                >
                  {person.jobLabel ?? "Métier non renseigné"}
                  {/* Un intervenant côté entité n'a pas de disponibilité :
                      c'est une propriété du centre, et la ligne n'en invente
                      aucune (arbitrage (d) de C5bis). */}
                  {person.availability ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <AvailabilityDot availability={person.availability} />
                    </>
                  ) : null}
                </span>
              </span>
              {/* Le rang du rôle : le `select` seul dans le repli — le
                  balisage d'avant, au caractère près —, le `select` et le
                  retrait côte à côte quand la recherche est là. */}
              {enhanced ? (
                <span className="flex flex-wrap items-center gap-3">
                  {roleSelect(person, enhanced)}
                  {/* Le nom accessible dit **qui** on retire : un formulaire
                      d'équipe en porte autant que de membres, et « Retirer »
                      seul ne les distinguerait pas. */}
                  <Button
                    type="button"
                    variant="tertiary"
                    onClick={() =>
                      setChosen((was) =>
                        was.filter((kept) => kept !== person.id),
                      )
                    }
                  >
                    Retirer
                    <span className="sr-only">{` ${person.fullName} de l'équipe`}</span>
                  </Button>
                </span>
              ) : (
                roleSelect(person, enhanced)
              )}
            </div>
          )}
          emptyOptions={
            <p className="text-sm text-content-neutral-dark">
              {"Aucune personne référencée dans ce domaine. Une personne se crée dans Équipe, et nulle part ailleurs."}
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

        {/* Le seul reste du bloc d'ajout : une adresse. Elle ouvre le panneau
            de création d'`/equipe` au rendu serveur — même droit
            `manageDomain` que ce formulaire — et quitte donc cette page : la
            saisie en cours est perdue, comme elle l'est déjà par le « Créer un
            produit » de l'état vide. */}
        <p className="text-xs text-content-neutral-base">
          <Link href={ROUTES.teamPersonNew} className={ACTION_LINK_SM}>
            Ajouter une personne dans Équipe
          </Link>
        </p>

        {errors.team ? (
          <p className="text-xs font-semibold text-content-danger-dark">
            {errors.team}
          </p>
        ) : null}
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="submit"
          disabled={pending}
        >
          {pending ? "Enregistrement…" : submitLabel}
        </Button>
        <Link
          href={cancelHref}
          className={ACTION_LINK_SM}
        >
          Annuler
        </Link>
      </div>
    </form>
  );
}

/**
 * Un groupe de cases à cocher sur un référentiel du domaine.
 *
 * Un référentiel vide n'est pas une erreur : il se dit, et le formulaire reste
 * soumettable — métiers et approches sont facultatifs (règle 5).
 */
function CheckboxGroup({
  legend,
  note,
  name,
  idFor,
  options,
  checked,
  error,
  errorId,
  empty,
}: {
  legend: string;
  note: string;
  name: string;
  idFor: (field: string) => string;
  options: readonly ProjectFormOption[];
  checked: readonly string[];
  error: string | undefined;
  errorId: string;
  empty: string;
}) {
  const selected = new Set(checked);

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-2xs font-semibold text-content-neutral-dark uppercase">
        {legend}
      </legend>
      <p className="text-xs text-content-neutral-base">{note}</p>

      {options.length > 0 ? (
        <div className={`${BLOCK} flex-row flex-wrap gap-x-6 gap-y-3`}>
          {options.map((option) => (
            <label
              key={option.id}
              htmlFor={idFor(`${name}-${option.id}`)}
              className="flex items-center gap-2 text-sm text-content-neutral-darkest"
            >
              <input
                id={idFor(`${name}-${option.id}`)}
                name={name}
                type="checkbox"
                value={option.id}
                defaultChecked={selected.has(option.id)}
                aria-describedby={error ? errorId : undefined}
                className="accent-surface-primary-base"
              />
              {option.label}
            </label>
          ))}
        </div>
      ) : (
        <p className="text-sm text-content-neutral-dark">{empty}</p>
      )}

      {error ? (
        <p id={errorId} className="text-xs font-semibold text-content-danger-dark">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
