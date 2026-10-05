import { PushNotifications } from "@capacitor/push-notifications";
import { getAppPlatform, isNativeShell } from "./platform";

export interface PushRegistration {
  platform: "android" | "ios";
  token: string;
}

export interface PushOptions {
  onToken: (registration: PushRegistration) => void | Promise<void>;
  onError?: (message: string) => void;
}

/**
 * Solicita el permiso de notificaciones. Devuelve `false` si el usuario lo
 * deniega o si no estamos en el shell nativo (FR-012).
 */
export async function requestPushPermission(): Promise<boolean> {
  if (!isNativeShell()) {
    return false;
  }
  const permission = await PushNotifications.requestPermissions();
  return permission.receive === "granted";
}

/**
 * Registra los listeners de notificaciones: token de registro, errores y
 * apertura de una notificación (navega al destino indicado en `data.path`).
 * Devuelve una función para limpiar los listeners.
 */
export function initPushNotifications(options: PushOptions): () => void {
  if (!isNativeShell()) {
    return () => {};
  }

  const platform = getAppPlatform() === "ios" ? "ios" : "android";
  const listeners: Promise<{ remove: () => void }>[] = [];

  listeners.push(
    PushNotifications.addListener("registration", (token) => {
      void options.onToken({ platform, token: token.value });
    }),
  );

  listeners.push(
    PushNotifications.addListener("registrationError", (error) => {
      options.onError?.(error.error ?? "No se pudo registrar para notificaciones.");
    }),
  );

  listeners.push(
    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const path = action.notification.data?.path;
      if (typeof path === "string" && path.startsWith("/")) {
        window.location.assign(path);
      }
    }),
  );

  return () => {
    listeners.forEach((listener) => {
      void listener.then((handle) => handle.remove()).catch(() => {});
    });
  };
}

/**
 * Pide permiso y, si se concede, registra el dispositivo para recibir push.
 * El envío del token al backend lo realiza el componente que use `onToken`.
 */
export async function registerForPush(options: PushOptions): Promise<() => void> {
  if (!isNativeShell()) {
    return () => {};
  }
  const granted = await requestPushPermission();
  if (!granted) {
    options.onError?.("Permiso de notificaciones denegado. Puedes activarlo en los ajustes del dispositivo.");
    return () => {};
  }
  await PushNotifications.register();
  return initPushNotifications(options);
}
