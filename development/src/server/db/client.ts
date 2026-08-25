import { PrismaClient } from "@prisma/client";

/**
 * Cliente Prisma singleton tipado.
 * No se expone Prisma crudo a routers/servicios; usa funciones tipadas
 * en lugar de acceder directo al cliente (BACKEND.md §2.2).
 */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}