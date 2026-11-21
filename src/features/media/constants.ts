export const MEDIA_BUCKET = "couple-media";

export const MEDIA_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MEDIA_VIDEO_MIME_TYPES = ["video/mp4", "video/quicktime"] as const;
export const MEDIA_ALLOWED_MIME_TYPES = [...MEDIA_IMAGE_MIME_TYPES, ...MEDIA_VIDEO_MIME_TYPES] as const;

export const MEDIA_TYPES = ["image", "video"] as const;

export const MEDIA_PURPOSES = [
  "ritual_completion",
  "memory_capsule_content",
  "shared_moment",
  "profile_avatar",
  "attachment",
] as const;

export const MEDIA_UPLOAD_STATUSES = ["pending", "uploaded", "failed"] as const;

// A ritual answer or memory capsule holds at most this many photos and videos.
export const MEDIA_MAX_ITEMS = 5;

export const MEDIA_MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MEDIA_MAX_VIDEO_UPLOAD_BYTES = 30 * 1024 * 1024;
export const MEDIA_MAX_VIDEO_SECONDS = 5;
// Clips trimmed to 5 seconds often report a few extra milliseconds.
export const MEDIA_MAX_VIDEO_DURATION_MS = MEDIA_MAX_VIDEO_SECONDS * 1000 + 500;
export const MEDIA_MAX_IMAGE_DIMENSION = 1600;
export const MEDIA_JPEG_QUALITY = 0.75;
export const MEDIA_SIGNED_URL_TTL_SECONDS = 300;
// Videos keep one URL for longer so playback isn't interrupted by a refresh.
export const MEDIA_VIDEO_SIGNED_URL_TTL_SECONDS = 3600;
export const MEDIA_UPLOAD_CACHE_CONTROL_SECONDS = 3600;
