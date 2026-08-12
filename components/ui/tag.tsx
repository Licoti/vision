/**
 * La puce — une approche mobilisée, telle que la maquette la dessine.
 *
 * Un `<span>`, pas un lien : rien ne filtre par approche depuis la page
 * projet, et un faux bouton coûterait un arrêt de tabulation pour rien.
 *
 * Le fond et le filet sont **décoratifs** : c'est le texte qui porte
 * l'information, mesuré à 6,84:1 sur ce fond. La puce elle-même se détache peu
 * de la carte (1,04:1 pour le fond, 1,33:1 pour le filet) — acceptable ici, et
 * seulement ici : la limite à 3:1 vaut pour un composant qu'il faut savoir
 * viser, pas pour un cerne posé autour d'un mot lisible.
 */

export function Tag({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-border-primary-lighter bg-surface-primary-lightest px-3 py-1 text-xs font-medium text-content-primary-light">
      {label}
    </span>
  );
}
