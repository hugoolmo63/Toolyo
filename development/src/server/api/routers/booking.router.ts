import { createTRPCRouter, authedProcedure } from "../trpc";
import { BookingAcceptSchema, BookingGetByIdSchema, BookingListSchema, BookingRejectSchema, BookingRequestSchema } from "@/features/bookings/shared/booking.schema";
import { acceptBooking, getBookingById, listBookingRecords, rejectBooking, requestBooking } from "@/features/bookings/application/booking.service";
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

export const bookingRouter = createTRPCRouter({
  request: authedProcedure.input(BookingRequestSchema).mutation(({ ctx, input }) => safely("booking.request", ctx.session.userId, () => requestBooking(ctx.prisma, ctx.session.userId, input))),
  accept: authedProcedure.input(BookingAcceptSchema).mutation(({ ctx, input }) => safely("booking.accept", ctx.session.userId, () => acceptBooking(ctx.prisma, ctx.session.userId, input))),
  reject: authedProcedure.input(BookingRejectSchema).mutation(({ ctx, input }) => safely("booking.reject", ctx.session.userId, () => rejectBooking(ctx.prisma, ctx.session.userId, input))),
  list: authedProcedure.input(BookingListSchema).query(({ ctx, input }) => safely("booking.list", ctx.session.userId, () => listBookingRecords(ctx.prisma, ctx.session.userId, input))),
  getById: authedProcedure.input(BookingGetByIdSchema).query(({ ctx, input }) => safely("booking.getById", ctx.session.userId, () => getBookingById(ctx.prisma, ctx.session.userId, input.bookingId))),
});
