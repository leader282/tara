import { decode as decodeBase64 } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";

import {
  markMediaAssetFailed,
  markMediaAssetUploaded,
  reserveMediaAsset,
  uploadMediaFile,
  uploadMediaObject,
} from "@/features/media/api/storageApi";
import {
  MEDIA_MAX_UPLOAD_BYTES,
  MEDIA_MAX_VIDEO_DURATION_MS,
  MEDIA_MAX_VIDEO_UPLOAD_BYTES,
} from "@/features/media/constants";
import { pickedMediaSchema } from "@/features/media/schemas";
import { processImageForUpload } from "@/features/media/services/imageProcessing";
import type { MediaUploadInput, MediaUploadResult, ReservedMediaAsset } from "@/features/media/types";
import { MediaActionError, toMediaActionError } from "@/lib/errors/mediaErrorMessages";

async function readFileAsArrayBuffer(
  fileUri: string
): Promise<{ arrayBuffer: ArrayBuffer; sizeBytes: number }> {
  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const arrayBuffer = decodeBase64(base64);
  return {
    arrayBuffer,
    sizeBytes: arrayBuffer.byteLength,
  };
}

async function getFileSize(fileUri: string): Promise<number | null> {
  const fileInfo = await FileSystem.getInfoAsync(fileUri);
  if (!fileInfo.exists || fileInfo.isDirectory) {
    return null;
  }

  return typeof fileInfo.size === "number" && fileInfo.size > 0 ? fileInfo.size : null;
}

// Uploads one picked photo or video into the couple's private storage. Photos are resized and
// re-encoded as JPEG first, which also drops their location data.
export async function uploadPickedMedia({ media, purpose }: MediaUploadInput): Promise<MediaUploadResult> {
  let reservedMediaAsset: ReservedMediaAsset | null = null;

  try {
    const pickedMedia = pickedMediaSchema.parse(media);

    if (pickedMedia.kind === "video") {
      if (!pickedMedia.durationMs || pickedMedia.durationMs > MEDIA_MAX_VIDEO_DURATION_MS) {
        throw new MediaActionError("video_too_long");
      }

      const sizeBytes = (await getFileSize(pickedMedia.uri)) ?? pickedMedia.fileSize;
      if (!sizeBytes) {
        throw new MediaActionError("upload_failed");
      }

      if (sizeBytes > MEDIA_MAX_VIDEO_UPLOAD_BYTES) {
        throw new MediaActionError("video_too_large");
      }

      reservedMediaAsset = await reserveMediaAsset({
        mimeType: pickedMedia.mimeType,
        sizeBytes,
        width: pickedMedia.width ?? undefined,
        height: pickedMedia.height ?? undefined,
        durationMs: pickedMedia.durationMs,
        purpose,
      });

      await uploadMediaFile({
        storagePath: reservedMediaAsset.storage_path,
        fileUri: pickedMedia.uri,
        contentType: pickedMedia.mimeType,
      });

      const mediaAsset = await markMediaAssetUploaded({
        mediaAssetId: reservedMediaAsset.id,
        sizeBytes,
        width: pickedMedia.width ?? undefined,
        height: pickedMedia.height ?? undefined,
      });

      return { reservedMediaAsset, mediaAsset };
    }

    const processedImage = await processImageForUpload({
      uri: pickedMedia.uri,
      width: pickedMedia.width ?? undefined,
      height: pickedMedia.height ?? undefined,
    });

    reservedMediaAsset = await reserveMediaAsset({
      mimeType: processedImage.mimeType,
      sizeBytes: processedImage.estimatedSizeBytes,
      width: processedImage.width,
      height: processedImage.height,
      purpose,
    });

    const { arrayBuffer, sizeBytes } = await readFileAsArrayBuffer(processedImage.uri);
    if (sizeBytes <= 0 || sizeBytes > MEDIA_MAX_UPLOAD_BYTES) {
      throw new MediaActionError("image_too_large");
    }

    await uploadMediaObject({
      storagePath: reservedMediaAsset.storage_path,
      arrayBuffer,
      contentType: processedImage.mimeType,
    });

    const mediaAsset = await markMediaAssetUploaded({
      mediaAssetId: reservedMediaAsset.id,
      sizeBytes,
      width: processedImage.width,
      height: processedImage.height,
    });

    return { reservedMediaAsset, mediaAsset };
  } catch (error) {
    if (reservedMediaAsset) {
      try {
        await markMediaAssetFailed({ mediaAssetId: reservedMediaAsset.id });
      } catch {
        // Ignore cleanup errors so the original upload error reaches the UI.
      }
    }

    throw toMediaActionError(error);
  }
}
