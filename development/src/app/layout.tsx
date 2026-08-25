import type { Metadata } from "next";
import "../styles/globals.css";
import { AppProviders } from "../providers/app-providers";

export const metadata: Metadata = {
  title: "Toolyo — Scaffold de referencia",
  description: "Caso dummy de desarrollo: entidad Category end-to-end.",
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