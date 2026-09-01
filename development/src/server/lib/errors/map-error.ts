import { TRPCError } from "@trpc/server";
import { AppError } from "./domain-errors";

/**
 * Mapea un error de dominio lanzado por un servicio a un TRPCError
 * con el código HTTP correspondiente (BACKEND.md §9.2).
 * Los errores desconocidos se convierten en INTERNAL_SERVER_ERROR sin leak.
 */
export function mapErrorToTRPC(err: unknown): TRPCError {
  if (err instanceof AppError) {
    const code = statusToCode(err.statusCode);
    return new TRPCError({ code, message: err.message, cause: err });
  }
  if (err instanceof TRPCError) {
    return err;
  }
  // Error inesperado: detalle va al logger, no al cliente (BACKEND.md §9.2)
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Error interno del servidor",
    cause: err,
  });
}

function statusToCode(status: number): TRPCError["code"] {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 429:
      return "TOO_MANY_REQUESTS";
    default:
      return "INTERNAL_SERVER_ERROR";
  }
}