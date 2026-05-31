import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AppText, Button, Card } from "@/components/ui";
import type { MediaUploadProgressState } from "@/features/media/types";
import { colors, spacing } from "@/theme/tokens";

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

function getToneTextColor(tone: ProgressPresentation["tone"]): "textSecondary" | "success" | "danger" {
  if (tone === "success") {
    return "success";
  }

  if (tone === "danger") {
    return "danger";
  }

  return "textSecondary";
}

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

  const toneColor = getToneTextColor(presentation.tone);
  const helperText =
    progress.step === "error"
      ? progress.message ?? "We could not upload this photo."
      : progress.message;

  return (
    <Card>
      <View style={styles.container}>
        <View style={styles.statusRow}>
          {presentation.showSpinner ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <View
              style={[
                styles.statusDot,
                presentation.tone === "success" ? styles.statusDotSuccess : null,
                presentation.tone === "danger" ? styles.statusDotDanger : null,
              ]}
            />
          )}
          <AppText color={toneColor} variant="bodyMuted">
            {presentation.label}
          </AppText>
        </View>

        {helperText ? (
          <AppText color={toneColor} variant="caption">
            {helperText}
          </AppText>
        ) : null}

        {progress.step === "error" && onRetry ? (
          <View style={styles.retry}>
            <Button onPress={onRetry} title={retryLabel} variant="secondary" />
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  statusDot: {
    backgroundColor: colors.textSecondary,
    borderRadius: spacing.xs,
    height: spacing.sm,
    width: spacing.sm,
  },
  statusDotSuccess: {
    backgroundColor: colors.success,
  },
  statusDotDanger: {
    backgroundColor: colors.danger,
  },
  retry: {
    marginTop: spacing.xs,
  },
});
