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
};

export default nextConfig;
