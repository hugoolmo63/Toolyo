import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { type PrismaClient } from "@prisma/client";
import { AppError } from "../lib/errors/domain-errors";
import { validateSession } from "../auth/session.service";
import { readSessionCookie } from "@/lib/auth";

/**
 * Contexto tRPC. La sesión se carga desde la cookie opaca respaldada por DB (003-login).
 * Si no hay cookie, la sesión es inválida o está revocada, `session` es `null`.
 * `pendingCookies` recoge cookies a establecer en la respuesta HTTP via responseMeta.
 */
export interface TRPCContext {
  prisma: PrismaClient;
  session: { userId: string; role: "user" | "admin" } | null;
  sessionToken: string | null;
  pendingCookies: string[];
  setCookie: (value: string) => void;
}

export async function createTRPCContext(opts: { prisma: PrismaClient; request?: Request }): Promise<TRPCContext> {
  const pendingCookies: string[] = [];
  let session: { userId: string; role: "user" | "admin" } | null = null;
  let sessionToken: string | null = null;

  if (opts.request) {
    const cookieHeader = opts.request.headers.get("cookie");
    const token = readSessionCookie(cookieHeader);
    if (token) {
      const claims = await validateSession(opts.prisma, token);
      if (claims) {
        // TODO: derive role from user data when RBAC is fully implemented
        session = { userId: claims.userId, role: "user" };
        sessionToken = token;
      }
    }
  }

  return {
    prisma: opts.prisma,
    session,
    sessionToken,
    pendingCookies,
    setCookie: (value: string) => pendingCookies.push(value),
  };
}

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
 * Procedimiento autenticado — requiere sesión válida cargada desde cookie (003-login).
 */
export const authedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
