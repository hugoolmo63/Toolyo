export const MAX_LISTING_VIDEO_BYTES = 50 * 1024 * 1024;

export const LISTING_VIDEO_TYPES = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
} as const;

export function getListingVideoExtension(file: { type: string; size: number }) {
  if (file.size <= 0 || file.size > MAX_LISTING_VIDEO_BYTES) return null;
  return LISTING_VIDEO_TYPES[file.type as keyof typeof LISTING_VIDEO_TYPES] ?? null;
}