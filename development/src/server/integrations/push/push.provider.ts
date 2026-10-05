import { env } from "@/env.mjs";

export interface PushMessage {
  token: string;
  platform: "android" | "ios";
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushProvider {
  send(message: PushMessage): Promise<{ providerMessageId: string }>;
}

/**
 * Adaptador de desarrollo: no envía nada real y nunca registra el token completo.
 */
export const consolePushProvider: PushProvider = {
  async send({ platform, token }) {
    return { providerMessageId: `console-push:${platform}:${token.slice(0, 6)}` };
  },
};

/**
 * Firebase Cloud Messaging (HTTP v1). Entrega a Android directamente y a iOS a
 * través de la integración FCM→APNs, de modo que un único canal cubre ambas plataformas.
 * Requiere `FCM_PROJECT_ID` y un `FCM_ACCESS_TOKEN` válido (obtenido del service
 * account por el entorno de despliegue; nunca se persiste en el repositorio).
 */
const fcmPushProvider: PushProvider = {
  async send({ token, title, body, data }) {
    if (!env.FCM_PROJECT_ID || !env.FCM_ACCESS_TOKEN) {
      throw new Error("FCM_PROJECT_ID y FCM_ACCESS_TOKEN son obligatorios cuando PUSH_PROVIDER=fcm");
    }

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${env.FCM_PROJECT_ID}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.FCM_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: { token, notification: { title, body }, data },
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`FCM respondió con estado ${response.status}: ${detail.slice(0, 200)}`);
    }

    const payload = (await response.json()) as { name?: string };
    return { providerMessageId: payload.name ?? `fcm:${token.slice(0, 6)}` };
  },
};

export function getPushProvider(): PushProvider {
  return env.PUSH_PROVIDER === "fcm" ? fcmPushProvider : consolePushProvider;
}

/** Indica si un fallo del proveedor corresponde a un token inválido/no registrado. */
export function isInvalidTokenError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /UNREGISTERED|NOT_REGISTERED|registration-token-not-registered|invalid registration/i.test(message);
}
