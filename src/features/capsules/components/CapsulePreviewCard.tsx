import { StyleSheet, View } from "react-native";

import { AppText, Button, Card } from "@/components/ui";
import type { MemoryCapsule } from "@/features/capsules/types";
import { formatCapsuleCountdown, formatUnlockDateTime } from "@/lib/dates/format";
import { spacing } from "@/theme/tokens";

type CapsulePreviewCardProps = {
  capsule: MemoryCapsule;
  note: string | null | undefined;
  isRefreshing?: boolean;
  onRetry?: () => void;
};

export function CapsulePreviewCard({
  capsule,
  note,
  isRefreshing = false,
  onRetry,
}: CapsulePreviewCardProps) {
  const unlockLabel = formatUnlockDateTime(capsule.unlock_at) ?? "Unlock date unavailable";
  const countdownLabel = formatCapsuleCountdown(capsule.unlock_at, capsule.opened_at);
  const normalizedNote = note?.trim();

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

        {normalizedNote ? (
          <View style={styles.preview}>
            <AppText variant="subtitle">Your note</AppText>
            <AppText variant="body">{normalizedNote}</AppText>
          </View>
        ) : (
          <View style={styles.preview}>
            <AppText color="textSecondary" variant="bodyMuted">
              We could not load your preview right now.
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
});
