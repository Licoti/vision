import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // `next dev` ajoute sinon un bloc de sa main dans CLAUDE.md, à chaque
  // démarrage. La règle 7 du CLAUDE.md l'interdit : ce fichier n'est écrit
  // que par l'humain.
  agentRules: false,
  // Un package-lock.json traîne au-dessus du dépôt : sans cette borne,
  // Turbopack remonte le chercher et prend la mauvaise racine.
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
  /**
   * `/projets` a été l'adresse de la liste transverse et de toutes les pages
   * d'accompagnement jusqu'au renommage du vocabulaire, le 02/09/2026. Les
   * adresses de Vision circulent — la page d'un accompagnement se copie et se
   * colle dans un fil de discussion, et `docs/06` §7 fait de la remontée une
   * garantie. Une adresse partagée hier ne doit pas rendre 404 aujourd'hui.
   *
   * `permanent: true` rend un 308, qui préserve la méthode. **Next reporte la
   * chaîne de requête de lui-même**, remesuré le 05/09/2026 :
   * `/projets?statut=<uuid>` rend `location: /accompagnements?statut=<uuid>`,
   * un seul saut, destination 200. Les liens filtrés de la vue d'ensemble et
   * les liens de panneau arrivent donc entiers.
   *
   * **Les deux règles se retirent après le 02/03/2027, et c'est une date parce
   * qu'aucun signal ne viendra.** Une redirection sans condition de fin est une
   * dette qui ne se remboursera jamais : rien ne dira le jour où plus personne
   * ne détient d'ancienne adresse. La population servie est bornée — les seules
   * adresses en `/projets` qui aient pu circuler ont été partagées entre le
   * 11/08/2026, premier commit du dépôt, et le 02/09/2026 —, et six mois
   * couvrent la vie utile d'un lien collé dans un fil. Le jour venu, le retrait
   * s'éprouve comme l'ajout : des 404 mesurés, pas supposés.
   *
   * **La première règle est redondante, et elle reste.** `/projets/:path*`
   * accepte `/projets` nu — dans le motif compilé, le groupe qui porte la barre
   * oblique est optionnel — et rend alors exactement `/accompagnements`, sans
   * barre finale. Mesuré le 05/09/2026, la première règle neutralisée :
   * `/projets` rend toujours 308 vers `/accompagnements`, un seul saut. Elle
   * est gardée parce que cette couverture tient à la sémantique du moteur de
   * motifs, que `path-to-regexp` a déjà changée d'une version majeure à
   * l'autre : l'énoncé explicite ne dépend d'aucune version, la redondance si.
   * Le jour où les règles tombent, elles tombent ensemble.
   *
   * **Un 308 porte la route, jamais le fragment** : un `#` ne quitte pas le
   * navigateur. Le renommage a déplacé une seule ancre — `#projets-lies` est
   * devenu `#accompagnements-lies` (`components/projects/related.tsx`) —, les
   * quatre autres `id` de la page d'accompagnement étant intacts. **Rien n'est
   * ajouté pour la rattraper** : le bloc « Accompagnements liés » n'a plus
   * d'appelant depuis le 28/08/2026, donc aucun des deux noms ne vise quoi que
   * ce soit aujourd'hui, et une ancre de compatibilité posée dans un composant
   * sans appelant ne se mesurerait dans aucun HTML servi. Le risque redevient
   * faible — pas nul — le jour où le bloc revient.
   */
  async redirects() {
    return [
      {
        source: "/projets",
        destination: "/accompagnements",
        permanent: true,
      },
      {
        source: "/projets/:path*",
        destination: "/accompagnements/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
