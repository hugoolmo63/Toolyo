import { Geolocation } from "@capacitor/geolocation";
import { isNativeShell } from "./platform";

export interface Coordinates {
  lat: number;
  lng: number;
}

export class GeolocationPermissionError extends Error {}

/**
 * Obtiene las coordenadas del dispositivo usando el plugin nativo (FR-008).
 * En navegador delega en `navigator.geolocation` desde el hook de la app.
 */
export async function getNativeCoordinates(): Promise<Coordinates> {
  if (!isNativeShell()) {
    throw new GeolocationPermissionError(
      "Geolocalización nativa no disponible fuera del shell.",
    );
  }

  const permission = await Geolocation.checkPermissions();
  if (permission.location === "denied") {
    throw new GeolocationPermissionError(
      "Permiso de ubicación denegado. Puedes seleccionar una ubicación manualmente.",
    );
  }

  const position = await Geolocation.getCurrentPosition({
    enableHighAccuracy: false,
    timeout: 10000,
  });

  return { lat: position.coords.latitude, lng: position.coords.longitude };
}
