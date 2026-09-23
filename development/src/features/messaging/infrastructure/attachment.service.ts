// Infrastructure-facing entry point kept separate from domain/application code
// so an approved S3/R2 SDK can replace the local provider without changing tRPC.
export {
  attachConfirmedUploads,
  confirmAttachment,
  createAttachmentUpload,
} from "../application/attachment.service";
