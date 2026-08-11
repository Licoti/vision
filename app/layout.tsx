import type { Metadata } from "next";
import { Poppins } from "next/font/google";

import "./globals.css";

/* Police primaire du design system (§3.1). next/font l'auto-héberge :
   aucune requête vers un domaine tiers au runtime. Les quatre graisses
   correspondent au §3.3. */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Vision",
  description:
    "Comment un centre de compétence design accompagne les produits d'une entreprise, dans le temps.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={poppins.variable}>
      <body>{children}</body>
    </html>
  );
}
