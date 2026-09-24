import { createTRPCRouter, authedProcedure } from "../trpc";
import { ConversationGetOrCreateSchema, ConversationGetSchema, ConversationListSchema, GetUnreadCountSchema, ListMessagesSchema, MarkReadSchema, MessageSendSchema } from "@/features/messaging/shared/messaging.schema";
import { getConversation, getOrCreateListingConversation, getUnreadCount, listConversations, listMessages, markRead, sendMessage } from "@/features/messaging/application/messaging.service";
import { mapErrorToTRPC } from "@/server/lib/errors/map-error";
import { logger } from "@/server/lib/logger";
import { CreateAttachmentUploadSchema, ConfirmAttachmentSchema } from "@/features/messaging/shared/attachment.schema";
import { createAttachmentUpload, confirmAttachment } from "@/features/messaging/application/attachment.service";

async function safely<T>(operation: string, userId: string, action: () => Promise<T>): Promise<T> {
  try { return await action(); } catch (error) { logger.error(operation, { error, userId }); throw mapErrorToTRPC(error); }
}

export const messagingRouter = createTRPCRouter({
  getOrCreateConversation: authedProcedure.input(ConversationGetOrCreateSchema).mutation(({ ctx, input }) => safely("messaging.getOrCreateConversation", ctx.session.userId, () => getOrCreateListingConversation(ctx.prisma, ctx.session.userId, input))),
  listConversations: authedProcedure.input(ConversationListSchema).query(({ ctx, input }) => safely("messaging.listConversations", ctx.session.userId, () => listConversations(ctx.prisma, ctx.session.userId, input))),
  getConversation: authedProcedure.input(ConversationGetSchema).query(({ ctx, input }) => safely("messaging.getConversation", ctx.session.userId, () => getConversation(ctx.prisma, ctx.session.userId, input.conversationId))),
  sendMessage: authedProcedure.input(MessageSendSchema).mutation(({ ctx, input }) => safely("messaging.sendMessage", ctx.session.userId, () => sendMessage(ctx.prisma, ctx.session.userId, input))),
  listMessages: authedProcedure.input(ListMessagesSchema).query(({ ctx, input }) => safely("messaging.listMessages", ctx.session.userId, () => listMessages(ctx.prisma, ctx.session.userId, input))),
  markRead: authedProcedure.input(MarkReadSchema).mutation(({ ctx, input }) => safely("messaging.markRead", ctx.session.userId, () => markRead(ctx.prisma, ctx.session.userId, input))),
  getUnreadCount: authedProcedure.input(GetUnreadCountSchema).query(({ ctx, input }) => safely("messaging.getUnreadCount", ctx.session.userId, () => getUnreadCount(ctx.prisma, ctx.session.userId, input.conversationId))),
  createAttachmentUpload: authedProcedure.input(CreateAttachmentUploadSchema).mutation(({ ctx, input }) => safely("messaging.createAttachmentUpload", ctx.session.userId, () => createAttachmentUpload(ctx.prisma, ctx.session.userId, input))),
  confirmAttachment: authedProcedure.input(ConfirmAttachmentSchema).mutation(({ ctx, input }) => safely("messaging.confirmAttachment", ctx.session.userId, () => confirmAttachment(ctx.prisma, ctx.session.userId, input))),
});
