/**
 * Macro-parcours — la lecture qui traverse les produits.
 *
 * **L'écran est vide, et c'est tout ce qu'il est.** Le chantier reliera les
 * produits entre eux par leurs use cases, dans une logique de parcours ; rien
 * de cela n'existe encore — ni table, ni objet, ni action, ni droit. Ce fichier
 * ne fait que tenir l'adresse que le menu annonce, pour que la structure de
 * navigation soit posée avant le chantier plutôt qu'après.
 *
 * La direction n'est pas neuve : `docs/02` §10 la consigne déjà comme piste
 * écartée du POC, sous le nom « Réseau de liens entre produits », en disant
 * qu'elle *« ouvrirait la lecture par famille de produits ou par parcours
 * client »*. C'est la même chose, nommée autrement — le point est consigné au
 * journal technique.
 *
 * Aucune action dans l'état vide : il n'y a rien à créer, et un bouton qui ne
 * mène nulle part se lit comme une panne. Le gabarit est celui d'`a-propos`,
 * l'autre écran que sa route précède.
 */

import { EmptyState } from "@/components/ui/empty-state";
import { Page, PageHeader } from "@/components/ui/page";

export const metadata = {
  title: "Macro-parcours — Vision",
};

export default function JourneysPage() {
  return (
    <Page>
      <PageHeader
        overline="À venir"
        title="Macro-parcours"
        lead="Comment les produits s'enchaînent-ils du point de vue de celui qui les traverse ?"
      />
      <EmptyState
        title="Les macro-parcours s'afficheront ici"
        description="Un macro-parcours reliera plusieurs produits entre eux et fera le lien entre leurs use cases, pour lire une trajectoire que la hiérarchie Produit › Accompagnement ne montre pas. Rien n'est encore saisissable : cette section attend son chantier."
      />
    </Page>
  );
}
