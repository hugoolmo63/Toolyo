import type { Metadata, Viewport } from "next";
import "../styles/globals.css";
import { AppProviders } from "../providers/app-providers";
import { NativeShellProvider } from "../components/native/native-shell-provider";

export const metadata: Metadata = {
  title: "Toolyo — Alquila con confianza",
  description: "Marketplace local de alquiler entre particulares.",
};

// `viewport-fit=cover` habilita las áreas seguras (notch, barra de gestos) en el shell nativo.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#005ce6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="profesional-seguro">
      <body>
        <AppProviders>
          <NativeShellProvider>{children}</NativeShellProvider>
        </AppProviders>
      </body>
    </html>
  );
}