import * as FileSystem from "expo-file-system/legacy";
import { SaveFormat, manipulateAsync } from "expo-image-manipulator";

import {
  MEDIA_JPEG_QUALITY,
  MEDIA_MAX_IMAGE_DIMENSION,
  MEDIA_MAX_UPLOAD_BYTES,
} from "@/features/media/constants";
import type { ProcessedImageUpload } from "@/features/media/types";
import { MediaActionError, toMediaActionError } from "@/lib/errors/mediaErrorMessages";

type ProcessImageForUploadInput = {
  uri: string;
  width?: number;
  height?: number;
};

function getResizeTarget(width?: number, height?: number): { width?: number; height?: number } | null {
  if (!width || !height || width <= 0 || height <= 0) {
    return null;
  }

  const largestDimension = Math.max(width, height);
  if (largestDimension <= MEDIA_MAX_IMAGE_DIMENSION) {
    return null;
  }

  if (width >= height) {
    return { width: MEDIA_MAX_IMAGE_DIMENSION };
  }

  return { height: MEDIA_MAX_IMAGE_DIMENSION };
}

function getEstimatedSizeBytes(fileInfo: Awaited<ReturnType<typeof FileSystem.getInfoAsync>>): number | null {
  if (!fileInfo.exists || fileInfo.isDirectory) {
    return null;
  }

  return typeof fileInfo.size === "number" && fileInfo.size > 0 ? fileInfo.size : null;
}

export async function processImageForUpload(
  input: ProcessImageForUploadInput
): Promise<ProcessedImageUpload> {
  try {
    if (!input.uri.trim()) {
      throw new MediaActionError("processing_failed");
    }

    const resizeTarget = getResizeTarget(input.width, input.height);
    const actions = resizeTarget ? [{ resize: resizeTarget }] : [];

    // Re-encode as JPEG so uploads never include original EXIF/location metadata.
    const manipulated = await manipulateAsync(input.uri, actions, {
      compress: MEDIA_JPEG_QUALITY,
      format: SaveFormat.JPEG,
      base64: false,
    });

    if (manipulated.width <= 0 || manipulated.height <= 0) {
      throw new MediaActionError("processing_failed");
    }

    const fileInfo = await FileSystem.getInfoAsync(manipulated.uri);
    const estimatedSizeBytes = getEstimatedSizeBytes(fileInfo);

    if (estimatedSizeBytes && estimatedSizeBytes > MEDIA_MAX_UPLOAD_BYTES) {
      throw new MediaActionError("image_too_large");
    }

    return {
      uri: manipulated.uri,
      mimeType: "image/jpeg",
      width: manipulated.width,
      height: manipulated.height,
      estimatedSizeBytes,
    };
  } catch (error) {
    throw toMediaActionError(error);
  }
}
