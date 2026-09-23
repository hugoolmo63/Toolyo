import { z } from "zod";

export const MessageNotificationSchema = z.object({
  recipientUserId: z.string().min(1),
  senderUserId: z.string().min(1),
  conversationId: z.string().min(1),
  messageId: z.string().min(1),
  preview: z.string().max(160),
});

export type MessageNotification = z.infer<typeof MessageNotificationSchema>;
