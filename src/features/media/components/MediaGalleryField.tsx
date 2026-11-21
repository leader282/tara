import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Keyboard, Pressable, StyleSheet, View } from "react-native";

import { AppText, BottomSheet, Button, Icon, ListRow } from "@/components/ui";
import { CameraCaptureModal, formatClipSeconds } from "@/features/media/components/CameraCaptureModal";
import { VideoClip } from "@/features/media/components/PrivateVideo";
import { MEDIA_MAX_ITEMS, MEDIA_MAX_VIDEO_SECONDS } from "@/features/media/constants";
import { pickMediaFromLibrary, type LibraryPickResult } from "@/features/media/services/mediaLibrary";
import { uploadPickedMedia } from "@/features/media/services/uploadMedia";
import type { MediaPurpose, PickedMedia } from "@/features/media/types";
import { toMediaActionError } from "@/lib/errors/mediaErrorMessages";
import { colors, radii, spacing } from "@/theme/tokens";

type GalleryItem = {
  key: string;
  media: PickedMedia;
  status: "uploading" | "uploaded" | "failed";
  mediaAssetId: string | null;
  error: string | null;
};

type MediaGalleryFieldProps = {
  purpose: MediaPurpose;
  // Uploaded items, in the order they were added.
  onChange: (mediaAssetIds: string[]) => void;
  onUploadingChange?: (isUploading: boolean) => void;
  disabled?: boolean;
  label?: string;
  helperText?: string;
  required?: boolean;
  maxItems?: number;
};

let nextItemKey = 0;

function toGalleryItem(media: PickedMedia): GalleryItem {
  nextItemKey += 1;
  return { key: `media-${nextItemKey}`, media, status: "uploading", mediaAssetId: null, error: null };
}

function describeSkipped({ skippedTooLong, skippedOther }: LibraryPickResult): string | null {
  if (skippedTooLong > 0) {
    return skippedTooLong === 1
      ? `That video is longer than ${MEDIA_MAX_VIDEO_SECONDS} seconds, so it wasn't added.`
      : `${skippedTooLong} videos are longer than ${MEDIA_MAX_VIDEO_SECONDS} seconds, so they weren't added.`;
  }

  if (skippedOther > 0) {
    return skippedOther === 1 ? "One item couldn't be added." : `${skippedOther} items couldn't be added.`;
  }

  return null;
}

export function MediaGalleryField({
  purpose,
  onChange,
  onUploadingChange,
  disabled = false,
  label = "Photos and videos",
  helperText = `Up to ${MEDIA_MAX_ITEMS} photos or ${MEDIA_MAX_VIDEO_SECONDS}-second videos, private to your couple.`,
  required = false,
  maxItems = MEDIA_MAX_ITEMS,
}: MediaGalleryFieldProps) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isReplaceSheetOpen, setIsReplaceSheetOpen] = useState(false);
  const [replaceKey, setReplaceKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const onChangeRef = useRef(onChange);
  const onUploadingChangeRef = useRef(onUploadingChange);
  const lastReportedIdsRef = useRef("");

  useEffect(() => {
    onChangeRef.current = onChange;
    onUploadingChangeRef.current = onUploadingChange;
  });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const uploadedIds = items.flatMap((item) => (item.mediaAssetId ? [item.mediaAssetId] : []));
    const reportedIds = uploadedIds.join(",");
    if (reportedIds !== lastReportedIdsRef.current) {
      lastReportedIdsRef.current = reportedIds;
      onChangeRef.current(uploadedIds);
    }
    onUploadingChangeRef.current?.(items.some((item) => item.status === "uploading"));
  }, [items]);

  const updateItem = useCallback((key: string, update: Partial<GalleryItem>) => {
    if (!isMountedRef.current) {
      return;
    }
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...update } : item)));
  }, []);

  const startUpload = useCallback(
    (item: GalleryItem) => {
      uploadPickedMedia({ media: item.media, purpose }).then(
        (result) => updateItem(item.key, { status: "uploaded", mediaAssetId: result.mediaAsset.id, error: null }),
        (error: unknown) =>
          updateItem(item.key, { status: "failed", mediaAssetId: null, error: toMediaActionError(error).message })
      );
    },
    [purpose, updateItem]
  );

  const addMedia = useCallback(
    (picked: PickedMedia[], targetKey: string | null) => {
      if (picked.length === 0) {
        return;
      }

      if (targetKey) {
        const replacement = toGalleryItem(picked[0]);
        setItems((current) => current.map((item) => (item.key === targetKey ? replacement : item)));
        setSelectedKey(replacement.key);
        startUpload(replacement);
        return;
      }

      const added = picked.slice(0, Math.max(maxItems - items.length, 0)).map(toGalleryItem);
      setItems((current) => [...current, ...added].slice(0, maxItems));
      added.forEach(startUpload);
    },
    [items.length, maxItems, startUpload]
  );

  const openCamera = (targetKey: string | null) => {
    // The camera opens over the form; blur the focused field so the keyboard doesn't return.
    Keyboard.dismiss();
    setReplaceKey(targetKey);
    setIsCameraOpen(true);
  };

  const openLibrary = async (targetKey: string | null) => {
    Keyboard.dismiss();
    setNotice(null);
    try {
      const result = await pickMediaFromLibrary(targetKey ? 1 : maxItems - items.length);
      setNotice(describeSkipped(result));
      addMedia(result.items, targetKey);
    } catch (error) {
      setNotice(toMediaActionError(error).message);
    }
  };

  const removeItem = (key: string) => {
    setItems((current) => current.filter((item) => item.key !== key));
    setSelectedKey(null);
  };

  const retryItem = (item: GalleryItem) => {
    const retried = { ...item, status: "uploading" as const, error: null };
    setItems((current) => current.map((candidate) => (candidate.key === item.key ? retried : candidate)));
    startUpload(retried);
  };

  const selectedItem = items.find((item) => item.key === selectedKey) ?? null;
  const failedItem = items.find((item) => item.status === "failed") ?? null;
  const isFull = items.length >= maxItems;
  const statusText = failedItem?.error ?? notice ?? helperText;
  const isError = Boolean(failedItem?.error) || Boolean(notice && notice !== helperText);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="label">
            {label}
            {required ? " *" : ""}
          </AppText>
          <AppText color={isError ? "danger" : "textSecondary"} variant="caption">
            {statusText}
          </AppText>
        </View>
        {items.length > 0 ? (
          <AppText color="textTertiary" variant="caption">
            {items.length}/{maxItems}
          </AppText>
        ) : null}
      </View>

      {items.length > 0 ? (
        <View style={styles.thumbnails}>
          {items.map((item, index) => {
            const isSelected = item.key === selectedKey;
            const kindLabel = item.media.kind === "video" ? "video" : "photo";

            return (
              <Pressable
                accessibilityHint="Shows options to replace or delete it"
                accessibilityLabel={`Attached ${kindLabel} ${index + 1}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={item.key}
                onPress={() => setSelectedKey(isSelected ? null : item.key)}
                style={[styles.thumbnail, isSelected ? styles.thumbnailSelected : null]}
              >
                {item.media.kind === "image" ? (
                  <Image source={{ uri: item.media.uri }} style={styles.thumbnailImage} />
                ) : (
                  <View style={[styles.thumbnailImage, styles.thumbnailVideo]}>
                    <Icon name="play" size={20} tintColor={colors.inkText} />
                    <AppText style={styles.videoDuration} variant="caption">
                      {formatClipSeconds(item.media.durationMs ?? 0)}
                    </AppText>
                  </View>
                )}
                {item.status === "uploading" ? (
                  <View accessibilityLabel="Uploading" style={styles.thumbnailOverlay}>
                    <ActivityIndicator color={colors.textInverse} size="small" />
                  </View>
                ) : null}
                {item.status === "failed" ? (
                  <View accessibilityLabel="Upload failed" style={[styles.thumbnailOverlay, styles.thumbnailFailed]}>
                    <Icon name="alert-circle" size={22} tintColor={colors.textInverse} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {selectedItem ? (
        <View style={styles.selected}>
          {selectedItem.media.kind === "image" ? (
            <Image
              accessibilityLabel="Selected photo"
              source={{ uri: selectedItem.media.uri }}
              style={styles.selectedMedia}
            />
          ) : (
            <VideoClip accessibilityLabel="Selected video" style={styles.selectedMedia} uri={selectedItem.media.uri} />
          )}
          <View style={styles.row}>
            {selectedItem.status === "failed" ? (
              <Button
                disabled={disabled}
                icon="refresh"
                onPress={() => retryItem(selectedItem)}
                size="sm"
                style={styles.rowButton}
                title="Try again"
                variant="outline"
              />
            ) : (
              <Button
                disabled={disabled}
                icon="swap-horizontal"
                onPress={() => setIsReplaceSheetOpen(true)}
                size="sm"
                style={styles.rowButton}
                title="Replace"
                variant="outline"
              />
            )}
            <Button
              disabled={disabled}
              icon="trash-outline"
              onPress={() => removeItem(selectedItem.key)}
              size="sm"
              style={styles.rowButton}
              title="Delete"
              variant="dangerSoft"
            />
          </View>
        </View>
      ) : null}

      {isFull ? null : (
        <View style={styles.row}>
          <Button
            accessibilityLabel="Take a photo or video"
            disabled={disabled}
            icon="camera-outline"
            onPress={() => openCamera(null)}
            size="md"
            style={styles.rowButton}
            title="Camera"
            variant="outline"
          />
          <Button
            accessibilityLabel="Choose from your library"
            disabled={disabled}
            icon="images-outline"
            onPress={() => void openLibrary(null)}
            size="md"
            style={styles.rowButton}
            title="Library"
            variant="outline"
          />
        </View>
      )}

      <CameraCaptureModal
        maxItems={replaceKey ? 1 : maxItems - items.length}
        onClose={() => setIsCameraOpen(false)}
        onDone={(captured) => {
          setIsCameraOpen(false);
          addMedia(captured, replaceKey);
        }}
        visible={isCameraOpen}
      />

      <BottomSheet
        onClose={() => setIsReplaceSheetOpen(false)}
        title={selectedItem?.media.kind === "video" ? "Replace video" : "Replace photo"}
        visible={isReplaceSheetOpen}
      >
        <View style={styles.sheetOptions}>
          <ListRow
            icon="camera-outline"
            onPress={() => {
              setIsReplaceSheetOpen(false);
              openCamera(selectedKey);
            }}
            title="Take a new one"
          />
          <ListRow
            icon="images-outline"
            onPress={() => {
              setIsReplaceSheetOpen(false);
              void openLibrary(selectedKey);
            }}
            title="Choose from library"
          />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  thumbnails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  thumbnail: {
    borderColor: "transparent",
    borderRadius: radii.md,
    borderWidth: 2,
    padding: 2,
  },
  thumbnailSelected: {
    borderColor: colors.primary,
  },
  thumbnailImage: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.sm,
    height: 64,
    width: 64,
  },
  thumbnailVideo: {
    alignItems: "center",
    backgroundColor: colors.ink,
    gap: 2,
    justifyContent: "center",
  },
  videoDuration: {
    color: colors.inkText,
  },
  thumbnailOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(28, 19, 16, 0.45)",
    borderRadius: radii.sm,
    bottom: 2,
    justifyContent: "center",
    left: 2,
    position: "absolute",
    right: 2,
    top: 2,
  },
  thumbnailFailed: {
    backgroundColor: "rgba(194, 54, 47, 0.7)",
  },
  selected: {
    gap: spacing.sm,
  },
  selectedMedia: {
    aspectRatio: 4 / 3,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    overflow: "hidden",
    width: "100%",
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  rowButton: {
    flex: 1,
  },
  sheetOptions: {
    gap: spacing.xs,
  },
});
