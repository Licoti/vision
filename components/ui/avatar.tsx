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
 */

import { initials } from "@/lib/format";

/** Le côté d'où vient la personne. */
export type AvatarTone = "center" | "stakeholder";

const TONE: Record<AvatarTone, string> = {
  center: "bg-surface-primary-light",
  stakeholder: "bg-surface-neutral-base",
};

export function Avatar({
  name,
  tone = "center",
  className = "",
}: {
  name: string;
  tone?: AvatarTone;
  /** La mise en page appartient à l'appelant : chevauchement, marges. */
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-2xs font-semibold text-content-neutral-pale ${TONE[tone]} ${className}`}
    >
      {initials(name)}
    </span>
  );
}

/**
 * L'équipe d'un accompagnement, en pastilles légèrement superposées, d'après
 * les maquettes.
 *
 * L'anneau reprend le fond de la ligne : c'est lui qui détache deux pastilles
 * qui se chevauchent, sans ombre — le design system n'a pas de token
 * d'élévation.
 */
export function AvatarGroup({
  names,
  label = "Équipe",
}: {
  names: readonly string[];
  /** Ce que la liste de noms annonce. */
  label?: string;
}) {
  if (names.length === 0) return null;

  return (
    <div className="flex items-center">
      <span className="sr-only">{`${label} : ${names.join(", ")}`}</span>
      {names.map((name, index) => (
        <Avatar
          key={`${name}-${index}`}
          name={name}
          className="-ml-1.5 ring-2 ring-surface-neutral-pale first:ml-0"
        />
      ))}
    </div>
  );
}
