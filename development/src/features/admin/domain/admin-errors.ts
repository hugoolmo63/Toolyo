import { AppError } from "@/server/lib/errors/domain-errors";

export class AdminForbiddenError extends AppError {
  constructor(message = "No tienes permisos para esta acción administrativa") { super(message, "admin_forbidden", 403); }
}

export class TotpInvalidError extends AppError {
  constructor() { super("El código TOTP no es válido", "totp_invalid", 401); }
}

export class TotpLockedError extends AppError {
  constructor() { super("El segundo factor está temporalmente bloqueado", "totp_locked", 429); }
}

export class KycInvalidTransitionError extends AppError {
  constructor() { super("La transición KYC no es válida", "kyc_invalid_transition", 409); }
}

export class ReviewAlreadyResolvedError extends AppError {
  constructor() { super("El reporte de review ya fue resuelto", "review_already_resolved", 409); }
}

export class AuditWriteFailedError extends AppError {
  constructor() { super("No se pudo registrar la auditoría administrativa", "audit_write_failed", 500); }
}