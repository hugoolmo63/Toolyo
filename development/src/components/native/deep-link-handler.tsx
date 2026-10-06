"use client";

import { useEffect } from "react";
import { parseDeepLink } from "@/lib/native/deep-link";
import { isNativeShell } from "@/lib/native/platform";

function navigateTo(target: { pathname: string; search: string }) {
  const next = `${target.pathname}${target.search}`;
  const current = `${window.location.pathname}${window.location.search}`;
  if (next !== current) {
    // La navegación interna conserva el comportamiento de la web: si la ruta es
    // protegida, el middleware existente redirige al login y vuelve tras autenticarse.
    window.location.assign(next);
  }
}

/**
 * Escucha enlaces profundos (App Links / Universal Links) y navega a la ruta
 * interna correspondiente. Resuelve también el enlace con el que se abrió la app
 * (arranque en frío) (FR-009).
 */
export function DeepLinkHandler() {
  useEffect(() => {
    if (!isNativeShell()) {
      return;
    }

    let cancelled = false;
    let removeListener: (() => void) | undefined;

    void import("@capacitor/app")
      .then(async ({ App }) => {
        if (cancelled) return;

        const listener = await App.addListener("appUrlOpen", ({ url }) => {
          const target = parseDeepLink(url, window.location.origin);
          if (target) {
            navigateTo(target);
          }
        });

        if (cancelled) {
          await listener.remove();
          return;
        }
        removeListener = () => {
          void listener.remove();
        };

        const launch = await App.getLaunchUrl();
        if (cancelled || !launch?.url) return;

        const target = parseDeepLink(launch.url, window.location.origin);
        if (target) {
          navigateTo(target);
        }
      })
      .catch(() => {
        // El plugin puede no estar disponible en una plataforma o runtime nativo.
      });

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, []);

  return null;
}
