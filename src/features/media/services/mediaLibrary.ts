import * as ImagePicker from "expo-image-picker";

import { MEDIA_MAX_VIDEO_DURATION_MS, MEDIA_MAX_VIDEO_UPLOAD_BYTES, MEDIA_VIDEO_MIME_TYPES } from "@/features/media/constants";
import type { PickedMedia } from "@/features/media/types";

type VideoMimeType = (typeof MEDIA_VIDEO_MIME_TYPES)[number];

export type LibraryPickResult = {
  items: PickedMedia[];
  // Videos that were left out, so the field can say why.
  skippedTooLong: number;
  skippedOther: number;
};

function toVideoMimeType(uri: string, mimeType: string | null | undefined): VideoMimeType | null {
  const normalizedMimeType = mimeType?.toLowerCase();
  if (normalizedMimeType === "video/mp4" || normalizedMimeType === "video/quicktime") {
    return normalizedMimeType;
  }

  const normalizedUri = uri.toLowerCase();
  if (normalizedUri.endsWith(".mp4")) {
    return "video/mp4";
  }

  if (normalizedUri.endsWith(".mov")) {
    return "video/quicktime";
  }

  return null;
}

function positiveOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}

export function toPickedLibraryMedia(
  assets: ImagePicker.ImagePickerAsset[]
): LibraryPickResult {
  const result: LibraryPickResult = { items: [], skippedTooLong: 0, skippedOther: 0 };

  for (const asset of assets) {
    if (asset.type === "video") {
      const mimeType = toVideoMimeType(asset.uri, asset.mimeType);
      const durationMs = positiveOrNull(asset.duration);
      const fileSize = positiveOrNull(asset.fileSize);

      if (durationMs !== null && durationMs > MEDIA_MAX_VIDEO_DURATION_MS) {
        result.skippedTooLong += 1;
        continue;
      }

      if (!mimeType || durationMs === null || (fileSize !== null && fileSize > MEDIA_MAX_VIDEO_UPLOAD_BYTES)) {
        result.skippedOther += 1;
        continue;
      }

      result.items.push({
        uri: asset.uri,
        kind: "video",
        mimeType,
        width: positiveOrNull(asset.width),
        height: positiveOrNull(asset.height),
        fileSize,
        durationMs,
      });
      continue;
    }

    if (asset.type && asset.type !== "image") {
      result.skippedOther += 1;
      continue;
    }

    // Photos are re-encoded as JPEG before upload, so any format the phone can open works.
    result.items.push({
      uri: asset.uri,
      kind: "image",
      mimeType: "image/jpeg",
      width: positiveOrNull(asset.width),
      height: positiveOrNull(asset.height),
      fileSize: positiveOrNull(asset.fileSize),
      durationMs: null,
    });
  }

  return result;
}

// The system photo picker needs no permission prompt.
export async function pickMediaFromLibrary(limit: number): Promise<LibraryPickResult> {
  const selectionLimit = Math.max(1, Math.floor(limit));
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images", "videos"],
    allowsEditing: false,
    allowsMultipleSelection: selectionLimit > 1,
    selectionLimit,
    orderedSelection: true,
    exif: false,
    quality: 1,
  });

  if (result.canceled) {
    return { items: [], skippedTooLong: 0, skippedOther: 0 };
  }

  const picked = toPickedLibraryMedia(result.assets);
  return { ...picked, items: picked.items.slice(0, selectionLimit) };
}
