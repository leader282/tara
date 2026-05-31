import { useCallback, useMemo, useState } from "react";

import * as ImagePicker from "expo-image-picker";

import { MEDIA_ALLOWED_MIME_TYPES } from "@/features/media/constants";
import { pickedImageSchema } from "@/features/media/schemas";
import type {
  PickedImageCancelReason,
  MediaMimeType,
  MediaUploadProgressState,
  PickedImageResult,
} from "@/features/media/types";
import {
  getMediaErrorMessage,
  toMediaActionError,
  type MediaErrorCode,
} from "@/lib/errors/mediaErrorMessages";

const ALLOWED_MIME_TYPES = new Set<MediaMimeType>(MEDIA_ALLOWED_MIME_TYPES);

function inferImageMimeType(uri: string, mimeType?: string): MediaMimeType | null {
  if (mimeType && ALLOWED_MIME_TYPES.has(mimeType as MediaMimeType)) {
    return mimeType as MediaMimeType;
  }

  const normalizedUri = uri.toLowerCase();
  if (normalizedUri.endsWith(".jpg") || normalizedUri.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  if (normalizedUri.endsWith(".png")) {
    return "image/png";
  }

  if (normalizedUri.endsWith(".webp")) {
    return "image/webp";
  }

  return null;
}

function createCanceledResult(reason: PickedImageCancelReason): PickedImageResult {
  return {
    canceled: true,
    reason,
  };
}

function toMediaErrorCodeFromCancelReason(reason: PickedImageCancelReason): MediaErrorCode {
  if (reason === "permission_denied") {
    return "permission_denied";
  }

  if (reason === "unsupported_file_type") {
    return "unsupported_file_type";
  }

  if (reason === "canceled") {
    return "picker_canceled";
  }

  return "unknown";
}

function toCancelReasonFromErrorCode(code: MediaErrorCode): PickedImageCancelReason {
  if (code === "permission_denied") {
    return "permission_denied";
  }

  if (code === "unsupported_file_type") {
    return "unsupported_file_type";
  }

  if (code === "picker_canceled") {
    return "canceled";
  }

  return "unknown";
}

function mapPickerResult(result: ImagePicker.ImagePickerResult): PickedImageResult {
  if (result.canceled) {
    return createCanceledResult("canceled");
  }

  const firstAsset = result.assets[0];
  if (!firstAsset) {
    return createCanceledResult("canceled");
  }

  if (firstAsset.type && firstAsset.type !== "image") {
    return createCanceledResult("unsupported_file_type");
  }

  const mimeType = inferImageMimeType(firstAsset.uri, firstAsset.mimeType);
  if (!mimeType) {
    return createCanceledResult("unsupported_file_type");
  }

  return {
    canceled: false,
    image: pickedImageSchema.parse({
      uri: firstAsset.uri,
      width: firstAsset.width,
      height: firstAsset.height,
      mimeType,
      fileSize: firstAsset.fileSize ?? null,
      fileName: firstAsset.fileName ?? null,
    }),
  };
}

export function usePickImage() {
  const [progress, setProgress] = useState<MediaUploadProgressState>({
    step: "idle",
    message: null,
    errorCode: null,
  });

  const setPermissionRequestState = useCallback(() => {
    setProgress({
      step: "requesting_permission",
      message: null,
      errorCode: null,
    });
  }, []);

  const setSuccessState = useCallback(() => {
    setProgress({
      step: "success",
      message: null,
      errorCode: null,
    });
  }, []);

  const setErrorState = useCallback((errorCode: MediaErrorCode) => {
    setProgress({
      step: "error",
      message: getMediaErrorMessage(errorCode),
      errorCode,
    });
  }, []);

  const pickFromLibrary = useCallback(async (): Promise<PickedImageResult> => {
    try {
      setPermissionRequestState();

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setErrorState("permission_denied");
        return createCanceledResult("permission_denied");
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        allowsMultipleSelection: false,
        exif: false,
        quality: 1,
      });

      const mappedResult = mapPickerResult(result);
      if (mappedResult.canceled) {
        if (mappedResult.reason === "canceled") {
          setProgress({
            step: "idle",
            message: null,
            errorCode: null,
          });
        } else {
          setErrorState(toMediaErrorCodeFromCancelReason(mappedResult.reason));
        }

        return mappedResult;
      }

      setSuccessState();
      return mappedResult;
    } catch (error) {
      const mediaError = toMediaActionError(error);
      setErrorState(mediaError.code);
      return createCanceledResult(toCancelReasonFromErrorCode(mediaError.code));
    }
  }, [setErrorState, setPermissionRequestState, setSuccessState]);

  const takePhoto = useCallback(async (): Promise<PickedImageResult> => {
    try {
      setPermissionRequestState();

      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setErrorState("permission_denied");
        return createCanceledResult("permission_denied");
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        exif: false,
        quality: 1,
      });

      const mappedResult = mapPickerResult(result);
      if (mappedResult.canceled) {
        if (mappedResult.reason === "canceled") {
          setProgress({
            step: "idle",
            message: null,
            errorCode: null,
          });
        } else {
          setErrorState(toMediaErrorCodeFromCancelReason(mappedResult.reason));
        }

        return mappedResult;
      }

      setSuccessState();
      return mappedResult;
    } catch (error) {
      const mediaError = toMediaActionError(error);
      setErrorState(mediaError.code);
      return createCanceledResult(toCancelReasonFromErrorCode(mediaError.code));
    }
  }, [setErrorState, setPermissionRequestState, setSuccessState]);

  const resetProgress = useCallback(() => {
    setProgress({
      step: "idle",
      message: null,
      errorCode: null,
    });
  }, []);

  const friendlyError = useMemo(() => progress.message, [progress.message]);

  return {
    pickFromLibrary,
    takePhoto,
    progress,
    friendlyError,
    resetProgress,
  };
}
