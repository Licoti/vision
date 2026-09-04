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
   * d'accompagnement jusqu'au renommage du vocabulaire. Les adresses de Vision
   * circulent — la page d'un accompagnement se copie et se colle dans un fil de
   * discussion, et `docs/06` §7 fait de la remontée une garantie. Une adresse
   * partagée hier ne doit pas rendre 404 aujourd'hui.
   *
   * `permanent: true` rend un 308, qui préserve la méthode. Next reporte la
   * chaîne de requête de lui-même : les liens filtrés de la vue d'ensemble
   * (`/projets?statut=…`) et les liens de panneau arrivent entiers.
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
