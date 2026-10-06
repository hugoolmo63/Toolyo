"use client";

import { StatusBar, Style } from "@capacitor/status-bar";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getAppPlatform, isBlockedOnMobile, type AppPlatform } from "@/lib/native/platform";
import { registerBackButtonHandler } from "@/lib/native/back-button";
import { getEffectiveEndpoint, getEndpointConfig, type MobileEndpointConfig } from "@/lib/native/endpoint-config";
import { DeepLinkHandler } from "./deep-link-handler";
import { MobileEndpointSettings } from "./mobile-endpoint-settings";
import { NetworkStatusBanner } from "./network-status-banner";

interface NativeShellContextValue {
  platform: AppPlatform;
  isNative: boolean;
  endpoint: MobileEndpointConfig;
  effectiveEndpoint: string;
  refreshEndpoint: () => void;
}

const DEFAULT_ENDPOINT: MobileEndpointConfig = {
  baseUrl: "",
  allowRuntimeOverride: false,
  allowCleartext: false,
};

const NativeShellContext = createContext<NativeShellContextValue | null>(null);

/**
 * Contexto del shell nativo. Detecta la plataforma, resuelve el endpoint
 * configurable (FR-016) y ajusta la barra de estado en Android/iOS.
 */
export function NativeShellProvider({ children }: { children: ReactNode }) {
  const [platform, setPlatform] = useState<AppPlatform>("web");
  const [endpoint, setEndpoint] = useState<MobileEndpointConfig>(DEFAULT_ENDPOINT);
  const [effectiveEndpoint, setEffectiveEndpoint] = useState("");

  const refreshEndpoint = useCallback(() => {
    const config = getEndpointConfig();
    setEndpoint(config);
    setEffectiveEndpoint(getEffectiveEndpoint(config));
  }, []);

  useEffect(() => {
    const detected = getAppPlatform();
    setPlatform(detected);

    // El backoffice no es un destino de la app móvil (FR-014).
    if (detected !== "web" && isBlockedOnMobile(window.location.pathname)) {
      window.location.replace("/");
      return;
    }

    refreshEndpoint();

    if (detected !== "web") {
      document.documentElement.dataset.nativeShell = detected;
      // Texto oscuro sobre fondo claro del tema profesional-seguro.
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    }

    const removeBackHandler = registerBackButtonHandler();
    return removeBackHandler;
  }, [refreshEndpoint]);

  return (
    <NativeShellContext.Provider
      value={{
        platform,
        isNative: platform !== "web",
        endpoint,
        effectiveEndpoint,
        refreshEndpoint,
      }}
    >
      <DeepLinkHandler />
      <NetworkStatusBanner endpoint={effectiveEndpoint} />
      <MobileEndpointSettings
        platform={platform}
        endpoint={endpoint}
        effectiveEndpoint={effectiveEndpoint}
        refreshEndpoint={refreshEndpoint}
      />
      {children}
    </NativeShellContext.Provider>
  );
}

export function useNativeShell(): NativeShellContextValue {
  const context = useContext(NativeShellContext);
  if (!context) {
    throw new Error("useNativeShell debe usarse dentro de NativeShellProvider");
  }
  return context;
}
