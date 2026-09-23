import { z } from "zod";

const id = z.string().trim().min(1).max(120);

export const ConversationJoinSchema = z.object({ conversationId: id });

export const MessageSendSchema = z.object({
  conversationId: id,
  clientMessageId: z.string().trim().min(8).max(120),
  body: z.string().max(4000).nullable().optional(),
  attachmentIds: z.array(id).max(5).default([]),
}).superRefine((value, context) => {
  if (!value.body?.trim() && value.attachmentIds.length === 0) context.addIssue({ code: z.ZodIssueCode.custom, path: ["body"], message: "El mensaje requiere contenido o un adjunto" });
});

export const ConversationReadSchema = z.object({ conversationId: id, messageId: id });

export const ListMessagesSchema = z.object({
  conversationId: id,
  cursor: z.string().trim().max(240).optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

export const MarkReadSchema = ConversationReadSchema;

export const GetUnreadCountSchema = z.object({ conversationId: id.optional() });

export type MessageSendInput = z.infer<typeof MessageSendSchema>;
export type ListMessagesInput = z.infer<typeof ListMessagesSchema>;
export type MarkReadInput = z.infer<typeof MarkReadSchema>;
