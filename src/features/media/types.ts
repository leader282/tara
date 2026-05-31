import type {
  MEDIA_ALLOWED_MIME_TYPES,
  MEDIA_PURPOSES,
  MEDIA_UPLOAD_PROGRESS_STEPS,
  MEDIA_UPLOAD_STATUSES,
} from "@/features/media/constants";
import type { MediaErrorCode } from "@/lib/errors/mediaErrorMessages";
import type { Database, Tables } from "@/lib/supabase/database.types";

export type MediaAsset = Tables<"media_assets">;
export type MediaMimeType = (typeof MEDIA_ALLOWED_MIME_TYPES)[number];
export type MediaPurpose = (typeof MEDIA_PURPOSES)[number];
export type MediaUploadStatus = (typeof MEDIA_UPLOAD_STATUSES)[number];
export type MediaUploadProgressStep = (typeof MEDIA_UPLOAD_PROGRESS_STEPS)[number];

type ReserveMediaAssetRpcResult =
  Database["public"]["Functions"]["reserve_media_asset"]["Returns"][number];

export type ReservedMediaAsset = Omit<
  ReserveMediaAssetRpcResult,
  "size_bytes" | "width" | "height"
> & {
  size_bytes: number | null;
  width: number | null;
  height: number | null;
};

export type MediaUploadInput = {
  localUri: string;
  mimeType?: MediaMimeType | null;
  width?: number;
  height?: number;
  purpose: MediaPurpose;
};

export type ReserveMediaAssetInput = {
  mimeType: MediaMimeType;
  sizeBytes?: number | null;
  width?: number;
  height?: number;
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
  processedImage: ProcessedImageUpload;
};

export type MediaUploadProgressState = {
  step: MediaUploadProgressStep;
  message: string | null;
  errorCode: MediaErrorCode | null;
};

export type PickedImage = {
  uri: string;
  width: number;
  height: number;
  mimeType: MediaMimeType | null;
  fileSize: number | null;
  fileName: string | null;
};

export type PickedImageCancelReason =
  | "canceled"
  | "permission_denied"
  | "unsupported_file_type"
  | "unknown";

export type PickedImageResult =
  | {
      canceled: true;
      reason: PickedImageCancelReason;
    }
  | {
      canceled: false;
      image: PickedImage;
    };

export type SignedMediaUrlResult = {
  storagePath: string;
  signedUrl: string;
  expiresInSeconds: number;
  expiresAt: number;
};

export type MarkMediaAssetFailedResult =
  Database["public"]["Functions"]["mark_media_asset_failed"]["Returns"][number];
