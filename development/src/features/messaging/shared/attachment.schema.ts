import { z } from "zod";

const id = z.string().trim().min(1).max(120);
const imageMime = z.enum(["image/jpeg", "image/png", "image/webp"]);

export const CreateAttachmentUploadSchema = z.object({
  conversationId: id,
  mimeType: imageMime,
  byteSize: z.number().int().positive().max(10 * 1024 * 1024),
  width: z.number().int().positive().max(10000).optional(),
  height: z.number().int().positive().max(10000).optional(),
  checksum: z.string().trim().max(128).optional(),
});

export const ConfirmAttachmentSchema = z.object({
  attachmentId: id,
  checksum: z.string().trim().max(128).optional(),
});

export type CreateAttachmentUploadInput = z.infer<typeof CreateAttachmentUploadSchema>;
export type ConfirmAttachmentInput = z.infer<typeof ConfirmAttachmentSchema>;
