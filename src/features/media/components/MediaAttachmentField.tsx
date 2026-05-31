import { useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { MediaPickerButton } from "@/features/media/components/MediaPickerButton";
import { MediaPreview } from "@/features/media/components/MediaPreview";
import { MediaUploadProgress } from "@/features/media/components/MediaUploadProgress";
import { useMediaAttachment } from "@/features/media/hooks/useMediaAttachment";
import { usePickImage } from "@/features/media/hooks/usePickImage";
import type { MediaAsset, MediaPurpose, MediaUploadProgressState } from "@/features/media/types";
import { spacing } from "@/theme/tokens";

type MediaAttachmentFieldProps = {
  value: MediaAsset | null;
  onChange: (nextValue: MediaAsset | null) => void;
  purpose: MediaPurpose;
  disabled?: boolean;
  label?: string;
  helperText?: string;
  required?: boolean;
};

function getCombinedProgressState(params: {
  pickerProgress: MediaUploadProgressState;
  uploadProgress: MediaUploadProgressState;
}): MediaUploadProgressState | null {
  const { pickerProgress, uploadProgress } = params;

  if (uploadProgress.step !== "idle") {
    return uploadProgress;
  }

  if (pickerProgress.step === "requesting_permission" || pickerProgress.step === "error") {
    return pickerProgress;
  }

  return null;
}

export function MediaAttachmentField({
  value,
  onChange,
  purpose,
  disabled = false,
  label = "Photo attachment",
  helperText = "Photos stay private to your couple and follow ritual/capsule privacy rules.",
  required = false,
}: MediaAttachmentFieldProps) {
  const picker = usePickImage();
  const attachment = useMediaAttachment({ defaultPurpose: purpose });

  const isBusy = disabled || attachment.isUploading;
  const combinedProgress = getCombinedProgressState({
    pickerProgress: picker.progress,
    uploadProgress: attachment.progress,
  });

  const handleUploadCurrentPick = useCallback(async () => {
    if (!attachment.pickedImage || isBusy) {
      return;
    }

    try {
      const uploadedAsset = await attachment.uploadAttachment(purpose, attachment.pickedImage);
      onChange(uploadedAsset);
    } catch {
      // The upload hook already maps and exposes a friendly error state.
    }
  }, [attachment, isBusy, onChange, purpose]);

  const handlePickFromLibrary = useCallback(async () => {
    if (isBusy) {
      return;
    }

    const result = await picker.pickFromLibrary();
    if (result.canceled) {
      return;
    }

    attachment.setPickedImage(result.image);
    try {
      const uploadedAsset = await attachment.uploadAttachment(purpose, result.image);
      onChange(uploadedAsset);
    } catch {
      // The upload hook already maps and exposes a friendly error state.
    }
  }, [attachment, isBusy, onChange, picker, purpose]);

  const handleTakePhoto = useCallback(async () => {
    if (isBusy) {
      return;
    }

    const result = await picker.takePhoto();
    if (result.canceled) {
      return;
    }

    attachment.setPickedImage(result.image);
    try {
      const uploadedAsset = await attachment.uploadAttachment(purpose, result.image);
      onChange(uploadedAsset);
    } catch {
      // The upload hook already maps and exposes a friendly error state.
    }
  }, [attachment, isBusy, onChange, picker, purpose]);

  const handleRemoveAttachment = useCallback(() => {
    attachment.clearAttachment();
    picker.resetProgress();
    onChange(null);
  }, [attachment, onChange, picker]);

  const retryUploadAction = attachment.progress.step === "error" ? handleUploadCurrentPick : undefined;

  const helperOrErrorText = useMemo(() => {
    if (attachment.friendlyError) {
      return attachment.friendlyError;
    }

    if (picker.progress.step === "error" && picker.friendlyError) {
      return picker.friendlyError;
    }

    return helperText;
  }, [attachment.friendlyError, helperText, picker.friendlyError, picker.progress.step]);

  const currentPreviewAsset = value ?? attachment.uploadedMediaAsset;
  const localPreviewUri = attachment.pickedImage?.uri ?? null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="subtitle">
          {label}
          {required ? " *" : ""}
        </AppText>
        <AppText
          color={
            attachment.friendlyError || (picker.progress.step === "error" && picker.friendlyError)
              ? "danger"
              : "textSecondary"
          }
          variant="caption"
        >
          {helperOrErrorText}
        </AppText>
      </View>

      <MediaPickerButton
        disabled={isBusy}
        loading={attachment.isUploading}
        onPickFromLibrary={handlePickFromLibrary}
        onTakePhoto={handleTakePhoto}
      />

      <MediaPreview
        disabled={isBusy}
        localUri={localPreviewUri}
        mediaAsset={currentPreviewAsset}
        onRemove={handleRemoveAttachment}
        onReplace={handlePickFromLibrary}
      />

      <MediaUploadProgress
        onRetry={retryUploadAction}
        progress={combinedProgress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
});
