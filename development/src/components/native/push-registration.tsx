"use client";

import { useEffect, useRef } from "react";
import { api } from "@/lib/trpc-react";
import { isNativeShell } from "@/lib/native/platform";
import { registerForPush } from "@/lib/native/push";

/**
 * Registra el dispositivo para notificaciones push cuando la app corre en el
 * shell nativo y hay sesión. Silencioso: las notificaciones son opcionales
 * (FR-012); la app funciona igual si el permiso se deniega.
 */
export function PushRegistration() {
  const registerDevice = api.mobile.registerDevice.useMutation();
  const registerRef = useRef(registerDevice);
  registerRef.current = registerDevice;

  useEffect(() => {
    if (!isNativeShell()) {
      return;
    }

    let disposed = false;
    let cleanup: (() => void) | undefined;

    registerForPush({
      onToken: (registration) => {
        void registerRef.current.mutateAsync(registration).catch(() => {});
      },
    })
      .then((remove) => {
        if (disposed) {
          remove();
        } else {
          cleanup = remove;
        }
      })
      .catch(() => {});

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return null;
}
