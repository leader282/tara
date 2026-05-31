import { decode as decodeBase64 } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";

import {
  markMediaAssetFailed,
  markMediaAssetUploaded,
  reserveMediaAsset,
  uploadMediaObject,
} from "@/features/media/api/storageApi";
import { MEDIA_MAX_UPLOAD_BYTES } from "@/features/media/constants";
import { uploadMediaInputSchema } from "@/features/media/schemas";
import { processImageForUpload } from "@/features/media/services/imageProcessing";
import type {
  MediaUploadInput,
  MediaUploadProgressState,
  MediaUploadResult,
  ReservedMediaAsset,
} from "@/features/media/types";
import { getMediaErrorMessage, toMediaActionError } from "@/lib/errors/mediaErrorMessages";

type UploadPickedImageOptions = {
  input: MediaUploadInput;
  onProgress?: (state: MediaUploadProgressState) => void;
};

function emitProgress(
  onProgress: UploadPickedImageOptions["onProgress"],
  state: MediaUploadProgressState
): void {
  onProgress?.(state);
}

async function fileUriToArrayBuffer(
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

export async function uploadPickedImage({
  input,
  onProgress,
}: UploadPickedImageOptions): Promise<MediaUploadResult> {
  let reservedMediaAsset: ReservedMediaAsset | null = null;

  try {
    const parsedInput = uploadMediaInputSchema.parse(input);

    emitProgress(onProgress, {
      step: "processing",
      message: null,
      errorCode: null,
    });

    const processedImage = await processImageForUpload({
      uri: parsedInput.localUri,
      width: parsedInput.width,
      height: parsedInput.height,
    });

    emitProgress(onProgress, {
      step: "reserving",
      message: null,
      errorCode: null,
    });

    reservedMediaAsset = await reserveMediaAsset({
      mimeType: processedImage.mimeType,
      sizeBytes: processedImage.estimatedSizeBytes,
      width: processedImage.width,
      height: processedImage.height,
      purpose: parsedInput.purpose,
    });

    emitProgress(onProgress, {
      step: "uploading",
      message: null,
      errorCode: null,
    });

    const { arrayBuffer, sizeBytes } = await fileUriToArrayBuffer(processedImage.uri);
    if (sizeBytes <= 0 || sizeBytes > MEDIA_MAX_UPLOAD_BYTES) {
      throw new Error("Processed image exceeds upload size limits.");
    }

    await uploadMediaObject({
      storagePath: reservedMediaAsset.storage_path,
      arrayBuffer,
      contentType: processedImage.mimeType,
    });

    emitProgress(onProgress, {
      step: "finalizing",
      message: null,
      errorCode: null,
    });

    const mediaAsset = await markMediaAssetUploaded({
      mediaAssetId: reservedMediaAsset.id,
      sizeBytes,
      width: processedImage.width,
      height: processedImage.height,
    });

    emitProgress(onProgress, {
      step: "success",
      message: null,
      errorCode: null,
    });

    return {
      reservedMediaAsset,
      mediaAsset,
      processedImage: {
        ...processedImage,
        estimatedSizeBytes: sizeBytes,
      },
    };
  } catch (error) {
    if (reservedMediaAsset) {
      try {
        await markMediaAssetFailed({ mediaAssetId: reservedMediaAsset.id });
      } catch {
        // Ignore cleanup errors so the original upload error reaches the UI.
      }
    }

    const mediaError = toMediaActionError(error);

    emitProgress(onProgress, {
      step: "error",
      message: getMediaErrorMessage(mediaError.code),
      errorCode: mediaError.code,
    });

    throw mediaError;
  }
}
