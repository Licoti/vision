/**
 * La pastille d'initiales, seule ou en groupe.
 *
 * **Deux lettres dans un cercle ne sont pas un nom.** La pastille est donc
 * toujours décorative pour l'assistance (`aria-hidden`) : c'est à l'appelant
 * d'écrire le nom, en toutes lettres à côté d'elle — l'en-tête de la page
 * projet — ou en texte de remplacement — le groupe ci-dessous. C'est la même
 * règle que le bandeau de colonnes de `List` : ce qui se lit d'un coup d'œil
 * ne doit rien retirer à ce qui se lit à la voix.
 *
 * Le `tone` distingue le centre de compétence de l'entité accompagnée
 * (`persons.kind`, docs/04 §2). Il ne porte jamais seul cette distinction :
 * l'appelant l'écrit aussi. Une couleur qui informe seule est un défaut
 * d'accessibilité (docs/06 §11).
 *
 * Les couleurs sont **mesurées**, pas supposées. Une pastille claire
 * (`surface-primary-lightest`) portait des initiales à 15:1 mais ne se
 * détachait du fond de la ligne qu'à 1,04:1 : invisible en tant que forme, et
 * deux pastilles superposées se lisaient comme un seul mot. Le fond `center`
 * est celui de la maquette : initiales à 7,11:1 dessus, pastille à 7,11:1 sur
 * la surface claire où elle se pose. Le gris de la maquette pour `stakeholder`
 * (`surface-neutral-light`) tombait à 2,22:1 des deux côtés — une pastille
 * qu'on devine ; `surface-neutral-base` la rétablit à 4,98:1.
 *
 * **La taille arrive en prop depuis la reprise de `project-v2`** (20/08/2026) :
 * la maquette dessine deux calibres — 32 px dans l'en-tête d'un accompagnement,
 * 28 px sur une entrée de roadmap. `sm` est la taille de tous les points
 * d'appel antérieurs et reste le défaut : aucun rendu existant ne bouge.
 */

import { initials } from "@/lib/format";

/** Le côté d'où vient la personne. */
export type AvatarTone = "center" | "stakeholder";

const TONE: Record<AvatarTone, string> = {
  center: "bg-surface-primary-light",
  stakeholder: "bg-surface-neutral-base",
};

/**
 * Les deux calibres de la maquette. `sm` est le calibre historique — celui des
 * trois listes qui rendaient déjà un groupe — et le défaut, si bien qu'aucun
 * appelant antérieur ne change de rendu.
 */
const SIZE = {
  sm: { box: "h-7 w-7 text-2xs", overlap: "-ml-1.5" },
  md: { box: "h-8 w-8 text-xs", overlap: "-ml-2" },
} as const;

export type AvatarSize = keyof typeof SIZE;

export function Avatar({
  name,
  tone = "center",
  size = "sm",
  className = "",
}: {
  name: string;
  tone?: AvatarTone;
  size?: AvatarSize;
  /** La mise en page appartient à l'appelant : chevauchement, marges. */
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`flex flex-none items-center justify-center rounded-full font-semibold text-content-neutral-pale ${SIZE[size].box} ${TONE[tone]} ${className}`}
    >
      {initials(name)}
    </span>
  );
}

/**
 * Une personne du groupe : son nom seul, ou son nom et ce qui le qualifie.
 *
 * **La forme longue est arrivée avec `project-v2`** (20/08/2026), et elle est
 * la condition de la maquette : celle-ci remplace la liste des noms de
 * l'en-tête par une pile d'avatars, si bien que « · côté entité » n'a plus de
 * ligne de texte où vivre. Il passe donc dans le nom accessible du groupe, et
 * la teinte de la pastille le redit à l'œil — jamais l'inverse, la couleur ne
 * portant pas seule (`docs/06` §11).
 *
 * La forme courte reste une chaîne : les trois points d'appel antérieurs
 * passent un `string[]`, et ils continuent de compiler sans changer d'un
 * caractère.
 */
export type AvatarPerson =
  | string
  | {
      readonly fullName: string;
      readonly tone?: AvatarTone;
      /** Ce qui suit le nom dans le texte de remplacement — « côté entité ». */
      readonly note?: string;
    };

/**
 * L'équipe d'un accompagnement, en pastilles légèrement superposées, d'après
 * les maquettes.
 *
 * L'anneau reprend le fond de la ligne : c'est lui qui détache deux pastilles
 * qui se chevauchent, sans ombre — le design system n'a pas de token
 * d'élévation.
 *
 * **Le décompte est visible et facultatif** (20/08/2026) : « 5 personnes »,
 * « 4 participants ». C'est l'appelant qui l'écrit — le mot change d'un bloc à
 * l'autre, et un composant de socle qui choisirait entre « personne » et
 * « participant » le choisirait pour tous les écrans à la fois. Il reste hors
 * du texte de remplacement, qui porte déjà les noms : les compter à voix haute
 * après les avoir énumérés serait une redite.
 */
export function AvatarGroup({
  names,
  label = "Équipe",
  size = "sm",
  count,
}: {
  names: readonly AvatarPerson[];
  /** Ce que la liste de noms annonce. */
  label?: string;
  size?: AvatarSize;
  /** Le décompte écrit à droite de la pile, déjà formulé par l'appelant. */
  count?: string;
}) {
  if (names.length === 0) return null;

  const people = names.map((person) =>
    typeof person === "string" ? { fullName: person } : person,
  );

  return (
    <div className="flex items-center">
      <span className="sr-only">
        {`${label} : ${people
          .map((person) =>
            person.note ? `${person.fullName} · ${person.note}` : person.fullName,
          )
          .join(", ")}`}
      </span>
      {people.map((person, index) => (
        <Avatar
          key={`${person.fullName}-${index}`}
          name={person.fullName}
          size={size}
          {...(person.tone ? { tone: person.tone } : {})}
          className={`${SIZE[size].overlap} ring-2 ring-surface-neutral-pale first:ml-0`}
        />
      ))}
      {count ? (
        <span className="ml-3 text-xs text-content-neutral-base">{count}</span>
      ) : null}
    </div>
  );
}
