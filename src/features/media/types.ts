import type {
  MEDIA_ALLOWED_MIME_TYPES,
  MEDIA_PURPOSES,
  MEDIA_TYPES,
  MEDIA_UPLOAD_STATUSES,
} from "@/features/media/constants";
import type { Database, Tables } from "@/lib/supabase/database.types";

export type MediaAsset = Tables<"media_assets">;
export type MediaMimeType = (typeof MEDIA_ALLOWED_MIME_TYPES)[number];
export type MediaKind = (typeof MEDIA_TYPES)[number];
export type MediaPurpose = (typeof MEDIA_PURPOSES)[number];
export type MediaUploadStatus = (typeof MEDIA_UPLOAD_STATUSES)[number];

// What a ritual answer or capsule needs to show one of its photos or videos.
export type AttachedMedia = Pick<
  MediaAsset,
  "id" | "storage_path" | "media_type" | "width" | "height" | "duration_ms" | "sort_order"
> & {
  ritual_completion_id: string | null;
  memory_capsule_id: string | null;
};

type ReserveMediaAssetRpcResult =
  Database["public"]["Functions"]["reserve_media_asset"]["Returns"][number];

export type ReservedMediaAsset = Omit<
  ReserveMediaAssetRpcResult,
  "size_bytes" | "width" | "height" | "duration_ms"
> & {
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  duration_ms: number | null;
};

// A photo or video picked from the library or captured with the camera, before upload.
export type PickedMedia = {
  uri: string;
  kind: MediaKind;
  mimeType: MediaMimeType;
  width: number | null;
  height: number | null;
  fileSize: number | null;
  durationMs: number | null;
};

export type MediaUploadInput = {
  media: PickedMedia;
  purpose: MediaPurpose;
};

export type ReserveMediaAssetInput = {
  mimeType: MediaMimeType;
  sizeBytes?: number | null;
  width?: number;
  height?: number;
  durationMs?: number | null;
  purpose: MediaPurpose;
};

export type MarkMediaAssetUploadedInput = {
  mediaAssetId: string;
  sizeBytes: number;
  width?: number;
  height?: number;
};

export type MarkMediaAssetFailedInput = {
  mediaAssetId: string;
};

export type UploadMediaObjectInput = {
  storagePath: string;
  arrayBuffer: ArrayBuffer;
  contentType: MediaMimeType;
};

export type UploadMediaFileInput = {
  storagePath: string;
  fileUri: string;
  contentType: MediaMimeType;
};

export type SignedMediaUrlInput = {
  storagePath: string;
  expiresInSeconds?: number;
};

export type ProcessedImageUpload = {
  uri: string;
  mimeType: "image/jpeg";
  width: number;
  height: number;
  estimatedSizeBytes: number | null;
};

export type MediaUploadResult = {
  reservedMediaAsset: ReservedMediaAsset;
  mediaAsset: MediaAsset;
};

export type SignedMediaUrlResult = {
  storagePath: string;
  signedUrl: string;
  expiresInSeconds: number;
  expiresAt: number;
};

export type MarkMediaAssetFailedResult =
  Database["public"]["Functions"]["mark_media_asset_failed"]["Returns"][number];
