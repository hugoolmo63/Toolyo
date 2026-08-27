import type { Metadata } from "next";
import "../styles/globals.css";
import { AppProviders } from "../providers/app-providers";

export const metadata: Metadata = {
  title: "Toolyo — Alquila con confianza",
  description: "Marketplace local de alquiler entre particulares.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="profesional-seguro">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}