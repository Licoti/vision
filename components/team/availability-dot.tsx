/**
 * La disponibilité d'une personne du centre : une pastille, et le mot.
 *
 * Écrit sur le patron de `components/ui/status-pill.tsx`, avec **une différence
 * assumée** : la disponibilité garde le point de 8 px là où le statut d'un
 * accompagnement est passé à la pastille pleine. Ce ne sont pas les mêmes
 * objets, et rien n'oblige les deux à se dessiner de la même façon. Ce qui
 * compte leur est commun : ni l'un ni l'autre ne laisse la couleur voyager
 * seule (`docs/06` §11) — ici parce que le composant rend la pastille *et* le
 * mot, quand son appelant pourrait l'oublier.
 *
 * La pastille est `aria-hidden` : c'est le texte qui porte l'information.
 *
 * Les deux `Record` sont **exhaustifs à la compilation** : le jour où l'énuméré
 * s'allonge, ce fichier ne compile plus tant qu'on ne les a pas complétés tous
 * les deux.
 *
 * **Trois littéraux de classe, et c'est structurel** : Tailwind ne voit que les
 * classes écrites en toutes lettres, et `` `bg-${…}` `` ne produirait aucune
 * règle — la raison déjà consignée dans `status-pill.tsx`.
 *
 * Les couleurs sont **mesurées** sur `surface-neutral-pale`, le fond de la
 * ligne : `surface-success-base` 4,53:1 · `surface-warning-base` 3,11:1 ·
 * `surface-neutral-base` 4,98:1. Aucun jeton neuf, aucun substitut de plus —
 * le design system en compte six, et il n'en s'invente pas un septième. Le
 * rouge est écarté d'office : une indisponibilité n'est pas une erreur, et
 * Vision n'affiche pas de badge d'alerte.
 */

import type { PersonAvailability } from "@/lib/queries/team";

const DOT: Record<PersonAvailability, string> = {
  available: "bg-surface-success-base",
  partial: "bg-surface-warning-base",
  unavailable: "bg-surface-neutral-base",
};

/**
 * Le mot, écrit juste à côté de la pastille. Jamais abrégé.
 *
 * **Exporté depuis T5bis.3** : le `select` « Disponibilité » de la barre de
 * filtres nomme les trois mêmes valeurs, et recopier trois libellés, c'est se
 * garantir qu'un jour la pastille et le filtre en diront deux versions.
 */
export const AVAILABILITY_LABEL: Record<PersonAvailability, string> = {
  available: "Disponible",
  partial: "Partiellement disponible",
  unavailable: "Indisponible",
};

export function AvailabilityDot({
  availability,
}: {
  availability: PersonAvailability;
}) {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className={`h-2 w-2 flex-none rounded-full ${DOT[availability]}`}
      />
      {AVAILABILITY_LABEL[availability]}
    </span>
  );
}
