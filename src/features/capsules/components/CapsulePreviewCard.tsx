import { StyleSheet, View } from "react-native";

import { AppText, Button, Card } from "@/components/ui";
import { PrivateImage } from "@/features/media/components/PrivateImage";
import type { MemoryCapsule } from "@/features/capsules/types";
import { formatCapsuleCountdown, formatUnlockDateTime } from "@/lib/dates/format";
import { radii, spacing } from "@/theme/tokens";

type CapsulePreviewCardProps = {
  capsule: MemoryCapsule;
  note: string | null | undefined;
  mediaAssetId?: string | null;
  isRefreshing?: boolean;
  onRetry?: () => void;
};

export function CapsulePreviewCard({
  capsule,
  note,
  mediaAssetId = null,
  isRefreshing = false,
  onRetry,
}: CapsulePreviewCardProps) {
  const unlockLabel = formatUnlockDateTime(capsule.unlock_at) ?? "Unlock date unavailable";
  const countdownLabel = formatCapsuleCountdown(capsule.unlock_at, capsule.opened_at);
  const normalizedNote = note?.trim();
  const hasPreviewContent = Boolean(normalizedNote || mediaAssetId);

  return (
    <Card>
      <View style={styles.container}>
        <AppText variant="subtitle">{capsule.title}</AppText>
        <AppText color="textSecondary" variant="bodyMuted">
          You can preview your note. Your partner sees only capsule metadata until it unlocks.
        </AppText>

        {capsule.emotional_context ? (
          <AppText color="textSecondary" variant="bodyMuted">
            {capsule.emotional_context}
          </AppText>
        ) : null}

        <View style={styles.meta}>
          <AppText color="textSecondary" variant="caption">
            Unlocks {unlockLabel}
          </AppText>
          <AppText color="textSecondary" variant="caption">
            {countdownLabel}
          </AppText>
        </View>

        {hasPreviewContent ? (
          <View style={styles.preview}>
            <AppText variant="subtitle">Your content preview</AppText>
            {normalizedNote ? <AppText variant="body">{normalizedNote}</AppText> : null}
            {mediaAssetId ? (
              <PrivateImage
                accessibilityLabel="Your capsule photo"
                containerStyle={styles.media}
                mediaAssetId={mediaAssetId}
              />
            ) : null}
          </View>
        ) : (
          <View style={styles.preview}>
            <AppText color="textSecondary" variant="bodyMuted">
              We could not load your preview content right now.
            </AppText>
            {onRetry ? (
              <Button
                disabled={isRefreshing}
                loading={isRefreshing}
                onPress={onRetry}
                title="Try again"
                variant="secondary"
              />
            ) : null}
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  meta: {
    gap: spacing.xs,
  },
  preview: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  media: {
    aspectRatio: 4 / 3,
    borderRadius: radii.sm,
    overflow: "hidden",
    width: "100%",
  },
});
