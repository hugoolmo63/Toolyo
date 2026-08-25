/**
 * Jerarquía de errores de dominio (BACKEND.md §9.1).
 * Los servicios lanzan estos errores; los routers los mapean a códigos HTTP.
 */
export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    // Restaura el prototype para instanceof correcto con target ES2022
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "validation_error", 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, "not_found", 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "conflict", 409);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, "unauthorized", 401);
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Error interno del servidor") {
    super(message, "internal_server_error", 500);
  }
}