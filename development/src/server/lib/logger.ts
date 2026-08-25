/**
 * Logger estructurado (BACKEND.md §9.3).
 * En un scaffold mínimo usamos console con formato JSON; en producción
 * sustituir por un sink real (Pino, Logtail, etc.) manteniendo la interfaz.
 */

type Level = "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

function emit(level: Level, message: string, fields: LogFields = {}): void {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...fields,
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    // eslint-disable-next-line no-console
    console.error(line);
  } else if (level === "warn") {
    // eslint-disable-next-line no-console
    console.warn(line);
  } else {
    // eslint-disable-next-line no-console
    console.info(line);
  }
}

export const logger = {
  info: (message: string, fields?: LogFields) => emit("info", message, fields),
  warn: (message: string, fields?: LogFields) => emit("warn", message, fields),
  error: (message: string, fields?: LogFields) => emit("error", message, fields),
};