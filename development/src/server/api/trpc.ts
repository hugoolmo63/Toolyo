import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { type PrismaClient } from "@prisma/client";
import { AppError } from "../lib/errors/domain-errors";

/**
 * Contexto tRPC. En el scaffold no hay autenticación real;
 * `session` queda a null y `authedProcedure` preparado como punto de extensión
 * (BACKEND.md §4.1, research.md R6).
 */
export interface TRPCContext {
  prisma: PrismaClient;
  session: { userId: string; role: "user" | "admin" } | null;
}

export const createTRPCContext = (opts: { prisma: PrismaClient }): TRPCContext => ({
  prisma: opts.prisma,
  session: null,
});

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    // Mapea errores de dominio y de Zod a códigos HTTP limpios sin leaks (BACKEND.md §9.2)
    if (error.cause instanceof AppError) {
      return {
        ...shape,
        data: {
          ...shape.data,
          code: error.cause.code,
          httpStatus: error.cause.statusCode,
        },
      };
    }
    if (error.cause instanceof ZodError) {
      return {
        ...shape,
        data: {
          ...shape.data,
          code: "validation_error",
          httpStatus: 400,
        },
      };
    }
    return shape;
  },
});

/** Procedimiento público: sin autenticación (para lecturas del scaffold). */
export const publicProcedure = t.procedure;

/**
 * Procedimiento autenticado — preparado pero NO cableado a un proveedor en este
 * scaffold. Cuando se integre Auth.js, se rellena el middleware y `session`
 * deja de ser `null` (punto de extensión).
 */
export const authedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;