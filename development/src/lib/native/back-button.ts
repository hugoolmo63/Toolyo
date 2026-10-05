import { App } from "@capacitor/app";
import { isNativeShell } from "./platform";

/**
 * Maneja el botón/gesto "atrás" del sistema en Android.
 * Vuelve en el historial del WebView y, si no hay historial, navega al inicio;
 * en el inicio, minimiza la app (FR-007).
 */
export function registerBackButtonHandler(): () => void {
  if (!isNativeShell()) {
    return () => {};
  }

  const listenerPromise = App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack && window.history.length > 1) {
      window.history.back();
      return;
    }
    if (window.location.pathname !== "/") {
      window.location.assign("/");
      return;
    }
    void App.minimizeApp().catch(() => {});
  });

  return () => {
    void listenerPromise.then((listener) => listener.remove()).catch(() => {});
  };
}
