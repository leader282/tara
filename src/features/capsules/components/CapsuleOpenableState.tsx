import { StyleSheet, View } from "react-native";

import { AppText, Button, Card } from "@/components/ui";
import type { MemoryCapsule } from "@/features/capsules/types";
import { formatCapsuleCountdown, formatUnlockDateTime } from "@/lib/dates/format";
import { spacing } from "@/theme/tokens";

type CapsuleOpenableStateProps = {
  capsule: MemoryCapsule;
  isOpening: boolean;
  errorMessage?: string | null;
  onOpenPress: () => void;
};

export function CapsuleOpenableState({
  capsule,
  isOpening,
  errorMessage,
  onOpenPress,
}: CapsuleOpenableStateProps) {
  const unlockLabel = formatUnlockDateTime(capsule.unlock_at) ?? "Unlock date unavailable";
  const countdownLabel = formatCapsuleCountdown(capsule.unlock_at, capsule.opened_at);

  return (
    <Card>
      <View style={styles.container}>
        <AppText variant="subtitle">{capsule.title}</AppText>
        <AppText color="textSecondary" variant="bodyMuted">
          This capsule is ready when you are. Open it to reveal its note and photo.
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

        <Button
          disabled={isOpening}
          loading={isOpening}
          onPress={onOpenPress}
          title="Open capsule"
        />

        {errorMessage ? (
          <AppText color="danger" variant="caption">
            {errorMessage}
          </AppText>
        ) : null}
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
});
