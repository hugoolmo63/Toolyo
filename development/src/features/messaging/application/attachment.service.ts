import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { env } from "@/env.mjs";
import { ForbiddenError, NotFoundError, ValidationError } from "@/server/lib/errors/domain-errors";
import { assertConversationAccess } from "./messaging.service";
import { getObjectStorageProvider } from "@/server/integrations/storage/object-storage.provider";
import type { ConfirmAttachmentInput, CreateAttachmentUploadInput } from "../shared/attachment.schema";

const MAX_ATTACHMENTS_PER_MESSAGE = 5;

export async function createAttachmentUpload(db: PrismaClient, userId: string, input: CreateAttachmentUploadInput) {
  await assertConversationAccess(db, input.conversationId, userId);
  if (env.STORAGE_PROVIDER === "s3" && (!env.STORAGE_ACCESS_KEY_ID || !env.STORAGE_SECRET_ACCESS_KEY)) throw new ValidationError("Falta configuración del almacenamiento S3/R2");
  const expiresAt = new Date(Date.now() + env.STORAGE_PRESIGNED_TTL_SECONDS * 1000);
  const storageKey = `conversations/${input.conversationId}/${userId}/${randomUUID()}`;
  const signed = await getObjectStorageProvider().createPresignedUpload({ storageKey, mimeType: input.mimeType, byteSize: input.byteSize, expiresAt });
  const upload = await db.attachmentUpload.create({ data: { conversationId: input.conversationId, uploadedById: userId, storageKey, publicUrl: signed.publicUrl, mimeType: input.mimeType, byteSize: input.byteSize, width: input.width, height: input.height, checksum: input.checksum, expiresAt } });
  return { attachmentId: upload.id, storageKey, uploadUrl: signed.uploadUrl, publicUrl: signed.publicUrl, expiresAt: expiresAt.toISOString() };
}

export async function confirmAttachment(db: PrismaClient, userId: string, input: ConfirmAttachmentInput) {
  const upload = await db.attachmentUpload.findUnique({ where: { id: input.attachmentId } });
  if (!upload) throw new NotFoundError("Upload no encontrado");
  if (upload.uploadedById !== userId) throw new ForbiddenError("No puedes confirmar este upload");
  if (upload.expiresAt <= new Date()) throw new ValidationError("El upload ha expirado");
  if (input.checksum && upload.checksum && input.checksum !== upload.checksum) throw new ValidationError("El checksum no coincide");
  const inspected = await getObjectStorageProvider().inspectObject({ storageKey: upload.storageKey });
  if (!inspected.exists) throw new NotFoundError("El objeto no existe en el almacenamiento");
  return db.attachmentUpload.update({ where: { id: upload.id }, data: { confirmedAt: new Date(), checksum: input.checksum ?? upload.checksum }, select: { id: true, conversationId: true, mimeType: true, byteSize: true, width: true, height: true, checksum: true, publicUrl: true, confirmedAt: true } });
}

export async function attachConfirmedUploads(db: PrismaClient, userId: string, conversationId: string, messageId: string, attachmentIds: string[]) {
  if (attachmentIds.length > MAX_ATTACHMENTS_PER_MESSAGE) throw new ValidationError("No puedes adjuntar más de cinco imágenes");
  if (attachmentIds.length === 0) return [];
  const uploads = await db.attachmentUpload.findMany({ where: { id: { in: attachmentIds }, conversationId, uploadedById: userId, confirmedAt: { not: null }, message: null } });
  if (uploads.length !== attachmentIds.length) throw new ValidationError("Uno o más adjuntos no están confirmados o no pertenecen a la conversación");
  return Promise.all(uploads.map((upload) => db.messageAttachment.create({ data: { messageId, uploadId: upload.id, type: "image", storageKey: upload.storageKey, publicUrl: upload.publicUrl, mimeType: upload.mimeType, byteSize: upload.byteSize, width: upload.width, height: upload.height, checksum: upload.checksum } })));
}
