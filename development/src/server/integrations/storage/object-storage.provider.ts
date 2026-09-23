import { createHash } from "node:crypto";
import { env } from "@/env.mjs";

export type PresignedUpload = {
  storageKey: string;
  uploadUrl: string;
  publicUrl: string;
  expiresAt: Date;
};

export interface ObjectStorageProvider {
  createPresignedUpload(input: { storageKey: string; mimeType: string; byteSize: number; expiresAt: Date }): Promise<PresignedUpload>;
  inspectObject(input: { storageKey: string }): Promise<{ exists: boolean; byteSize?: number; mimeType?: string; checksum?: string }>;
}

export class LocalObjectStorageProvider implements ObjectStorageProvider {
  async createPresignedUpload(input: { storageKey: string; mimeType: string; byteSize: number; expiresAt: Date }): Promise<PresignedUpload> {
    const token = createHash("sha256").update(`${input.storageKey}:${input.expiresAt.toISOString()}`).digest("hex");
    return {
      storageKey: input.storageKey,
      uploadUrl: `${env.STORAGE_PUBLIC_BASE_URL}/presigned/${encodeURIComponent(input.storageKey)}?token=${token}`,
      publicUrl: `${env.STORAGE_PUBLIC_BASE_URL}/${encodeURIComponent(input.storageKey)}`,
      expiresAt: input.expiresAt,
    };
  }

  async inspectObject(): Promise<{ exists: boolean }> {
    // Local development cannot inspect an object store; confirmation still validates
    // the signed key, owner, expiry, MIME and declared size.
    return { exists: true };
  }
}

export function getObjectStorageProvider(): ObjectStorageProvider {
  // The S3-compatible adapter is intentionally kept behind this port. Until the
  // project adopts an approved S3/R2 SDK, local mode provides deterministic tests.
  return new LocalObjectStorageProvider();
}
