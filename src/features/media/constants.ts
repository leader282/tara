export const MEDIA_BUCKET = "couple-media";

export const MEDIA_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MEDIA_PURPOSES = [
  "ritual_completion",
  "memory_capsule_content",
  "shared_moment",
  "profile_avatar",
  "attachment",
] as const;

export const MEDIA_UPLOAD_STATUSES = ["pending", "uploaded", "failed"] as const;

export const MEDIA_UPLOAD_PROGRESS_STEPS = [
  "idle",
  "requesting_permission",
  "processing",
  "reserving",
  "uploading",
  "finalizing",
  "success",
  "error",
] as const;

export const MEDIA_MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MEDIA_MAX_IMAGE_DIMENSION = 1600;
export const MEDIA_JPEG_QUALITY = 0.75;
export const MEDIA_SIGNED_URL_TTL_SECONDS = 300;
export const MEDIA_UPLOAD_CACHE_CONTROL_SECONDS = 3600;
