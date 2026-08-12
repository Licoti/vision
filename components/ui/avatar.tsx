/**
 * Le groupe d'avatars — l'équipe d'un accompagnement, en pastilles
 * d'initiales légèrement superposées, d'après les maquettes.
 *
 * **Deux lettres dans un cercle ne sont pas un nom.** Les pastilles sont donc
 * décoratives pour l'assistance (`aria-hidden`), et le groupe porte la liste
 * des noms en toutes lettres. C'est la même règle que le bandeau de colonnes
 * de `List` : ce qui se lit d'un coup d'œil ne doit rien retirer à ce qui se
 * lit à la voix.
 *
 * L'anneau reprend le fond de la ligne : c'est lui qui détache deux pastilles
 * qui se chevauchent, sans ombre — le design system n'a pas de token
 * d'élévation.
 *
 * Les couleurs sont **mesurées**, pas supposées. Une pastille claire
 * (`surface-primary-lightest`) portait des initiales à 15:1 mais ne se
 * détachait du fond de la ligne qu'à 1,04:1 : invisible en tant que forme, et
 * deux pastilles superposées se lisaient comme un seul mot. Le fond retenu est
 * celui de la maquette — initiales à 7,11:1 sur la pastille, pastille à
 * 7,11:1 sur la ligne.
 */

import { initials } from "@/lib/format";

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
        <span
          key={`${name}-${index}`}
          aria-hidden="true"
          className="-ml-1.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-surface-primary-light text-2xs font-semibold text-content-neutral-pale ring-2 ring-surface-neutral-pale first:ml-0"
        >
          {initials(name)}
        </span>
      ))}
    </div>
  );
}
