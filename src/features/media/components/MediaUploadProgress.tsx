import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AppText, Button, Icon } from "@/components/ui";
import type { MediaUploadProgressState } from "@/features/media/types";
import { colors, radii, spacing } from "@/theme/tokens";

type MediaUploadProgressProps = {
  progress: MediaUploadProgressState | null | undefined;
  onRetry?: () => void;
  retryLabel?: string;
};

type ProgressPresentation = {
  label: string;
  showSpinner: boolean;
  tone: "neutral" | "success" | "danger";
};

const PROGRESS_BY_STEP: Record<MediaUploadProgressState["step"], ProgressPresentation | null> = {
  idle: null,
  requesting_permission: {
    label: "Processing photo",
    showSpinner: true,
    tone: "neutral",
  },
  processing: {
    label: "Processing photo",
    showSpinner: true,
    tone: "neutral",
  },
  reserving: {
    label: "Preparing private upload",
    showSpinner: true,
    tone: "neutral",
  },
  uploading: {
    label: "Uploading photo",
    showSpinner: true,
    tone: "neutral",
  },
  finalizing: {
    label: "Saving attachment",
    showSpinner: true,
    tone: "neutral",
  },
  success: {
    label: "Uploaded",
    showSpinner: false,
    tone: "success",
  },
  error: {
    label: "Failed",
    showSpinner: false,
    tone: "danger",
  },
};

const backgroundByTone = {
  neutral: colors.surfaceMuted,
  success: colors.successSoft,
  danger: colors.dangerSoft,
} as const;

export function MediaUploadProgress({
  progress,
  onRetry,
  retryLabel = "Retry upload",
}: MediaUploadProgressProps) {
  if (!progress) {
    return null;
  }

  const presentation = PROGRESS_BY_STEP[progress.step];
  if (!presentation) {
    return null;
  }

  const toneColor =
    presentation.tone === "success" ? "success" : presentation.tone === "danger" ? "danger" : "textSecondary";
  const helperText =
    progress.step === "error"
      ? progress.message ?? "We could not upload this photo."
      : progress.message;

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.container, { backgroundColor: backgroundByTone[presentation.tone] }]}
    >
      <View style={styles.statusRow}>
        {presentation.showSpinner ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <Icon
            color={toneColor}
            name={presentation.tone === "success" ? "checkmark-circle" : "alert-circle"}
            size={18}
          />
        )}
        <AppText color={toneColor} style={styles.label} variant="label">
          {presentation.label}
        </AppText>
      </View>

      {helperText ? (
        <AppText color={toneColor} variant="caption">
          {helperText}
        </AppText>
      ) : null}

      {progress.step === "error" && onRetry ? (
        <Button icon="refresh" onPress={onRetry} size="sm" title={retryLabel} variant="outline" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.md,
    gap: spacing.sm,
    padding: spacing.md,
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  label: {
    flex: 1,
  },
});
