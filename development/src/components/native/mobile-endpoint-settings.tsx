"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  getRuntimeOverride,
  normalizeEndpoint,
  probeEndpoint,
  setRuntimeOverride,
  validateEndpoint,
} from "@/lib/native/endpoint-config";
import type { AppPlatform } from "@/lib/native/platform";
import type { MobileEndpointConfig } from "@/lib/native/endpoint-config";

interface MobileEndpointSettingsProps {
  platform: AppPlatform;
  endpoint: MobileEndpointConfig;
  effectiveEndpoint: string;
  refreshEndpoint: () => void;
}

export function MobileEndpointSettings({
  platform,
  endpoint,
  effectiveEndpoint,
  refreshEndpoint,
}: MobileEndpointSettingsProps) {
  const [value, setValue] = useState(effectiveEndpoint);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasOverride, setHasOverride] = useState(() => Boolean(getRuntimeOverride()));

  useEffect(() => {
    setValue(effectiveEndpoint);
    setHasOverride(Boolean(getRuntimeOverride()));
  }, [effectiveEndpoint]);

  if ((platform !== "android" && platform !== "ios") || !endpoint.allowRuntimeOverride) {
    return null;
  }

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeEndpoint(value);
    const validationError = validateEndpoint(normalized, { allowCleartext: true });
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setIsSaving(true);
    setMessage("Comprobando el servidor...");
    const reachable = await probeEndpoint(normalized);
    if (!reachable) {
      setIsSaving(false);
      setMessage("No se puede alcanzar el servidor. La dirección anterior sigue activa.");
      return;
    }

    setRuntimeOverride(normalized);
    refreshEndpoint();
    setIsSaving(false);
    setHasOverride(true);
    setMessage("Dirección guardada y aplicada.");
  };

  const reset = () => {
    setRuntimeOverride(null);
    refreshEndpoint();
    setHasOverride(false);
    setMessage("Se restauró la dirección predeterminada.");
  };

  return (
    <section className="native-endpoint-settings" aria-labelledby="native-endpoint-title">
      <h2 id="native-endpoint-title">Servidor de conexión</h2>
      <p>La interfaz está disponible sin conexión. Configura aquí la dirección de la API.</p>
      <form onSubmit={save} noValidate>
        <label htmlFor="native-endpoint-url">Dirección del servidor</label>
        <input
          id="native-endpoint-url"
          name="native-endpoint-url"
          type="url"
          inputMode="url"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-describedby="native-endpoint-help native-endpoint-message"
          disabled={isSaving}
        />
        <p id="native-endpoint-help" className="field-hint">
          Usa HTTPS en producción. HTTP solo está disponible para redes locales internas.
        </p>
        <div>
          <button type="submit" disabled={isSaving}>
            {isSaving ? "Comprobando..." : "Guardar dirección"}
          </button>
          {hasOverride ? (
            <button type="button" onClick={reset} disabled={isSaving}>
              Restablecer
            </button>
          ) : null}
        </div>
        <p id="native-endpoint-message" role="status" aria-live="polite">
          {message}
        </p>
      </form>
    </section>
  );
}
