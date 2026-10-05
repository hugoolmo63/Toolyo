import { createTRPCRouter, authedProcedure } from "../trpc";
import {
  RegisterDeviceSchema,
  RevokeDeviceSchema,
} from "@/features/mobile/shared/mobile.schema";
import {
  registerDevice,
  revokeDevice,
} from "@/features/mobile/application/device-token.service";
import { mapErrorToTRPC } from "@/server/lib/errors/map-error";
import { logger } from "@/server/lib/logger";

async function safely<T>(operation: string, userId: string, action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    logger.error(operation, { error, userId });
    throw mapErrorToTRPC(error);
  }
}

/**
 * Router tRPC del dominio móvil (notificaciones push). El `userId` se deriva
 * siempre de la sesión; nunca se acepta desde el cliente.
 */
export const mobileRouter = createTRPCRouter({
  registerDevice: authedProcedure.input(RegisterDeviceSchema).mutation(({ ctx, input }) =>
    safely("mobile.registerDevice", ctx.session.userId, () =>
      registerDevice(ctx.prisma, ctx.session.userId, input),
    ),
  ),
  revokeDevice: authedProcedure.input(RevokeDeviceSchema).mutation(({ ctx, input }) =>
    safely("mobile.revokeDevice", ctx.session.userId, () =>
      revokeDevice(ctx.prisma, ctx.session.userId, input),
    ),
  ),
});
