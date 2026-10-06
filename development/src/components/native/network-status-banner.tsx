"use client";

import { Network } from "@capacitor/network";
import { useEffect, useState } from "react";

type ConnectivityState = "online" | "offline" | "unreachable";

async function isEndpointReachable(endpoint: string): Promise<boolean> {
  if (!endpoint) {
    return true;
  }
  try {
    const { origin } = new URL(endpoint);
    // Fuera del mismo origen no se puede comprobar (CORS): no marcar como inaccesible.
    if (origin !== window.location.origin) {
      return true;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${origin}/api/health`, {
      signal: controller.signal,
      cache: "no-store",
    });
    window.clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Distingue "sin conexión" de "servicio no accesible" (FR-011, FR-016/FR-017).
 * El segundo caso aparece cuando el endpoint solo es alcanzable desde la red local.
 */
export function NetworkStatusBanner({ endpoint }: { endpoint: string }) {
  const [state, setState] = useState<ConnectivityState>("online");

  useEffect(() => {
    let active = true;

    const evaluate = async () => {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        if (active) setState("offline");
        return;
      }
      const reachable = await isEndpointReachable(endpoint);
      if (active) setState(reachable ? "online" : "unreachable");
    };

    void evaluate();

    const onOnline = () => void evaluate();
    const onOffline = () => setState("offline");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    let removeNetwork: (() => void) | undefined;
    Network.addListener("networkStatusChange", () => {
      void evaluate();
    })
      .then((listener) => {
        removeNetwork = () => listener.remove();
      })
      .catch(() => {});

    return () => {
      active = false;
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      removeNetwork?.();
    };
  }, [endpoint]);

  if (state === "online") {
    return null;
  }

  return (
    <div className="alert alert-warning safe-area-top" role="status">
      {state === "offline" ? (
        <p>Sin conexión. Revisa tu red; lo que hayas escrito no se pierde.</p>
      ) : (
        <p>
          Servicio no accesible. Si usas una dirección de red local, comprueba que estás
          conectado a esa red.
        </p>
      )}
    </div>
  );
}
