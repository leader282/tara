import { StyleSheet, View } from "react-native";

import { AppText, Button, Card } from "@/components/ui";
import type { MemoryCapsule } from "@/features/capsules/types";
import { formatUnlockDateTime } from "@/lib/dates/format";
import { spacing } from "@/theme/tokens";

type CapsuleOpenedContentProps = {
  capsule: MemoryCapsule;
  note: string | null | undefined;
  isRefreshing?: boolean;
  onRetry?: () => void;
};

export function CapsuleOpenedContent({
  capsule,
  note,
  isRefreshing = false,
  onRetry,
}: CapsuleOpenedContentProps) {
  const openedLabel = formatUnlockDateTime(capsule.opened_at) ?? "Just now";
  const normalizedNote = note?.trim();

  if (!normalizedNote) {
    return (
      <Card>
        <View style={styles.container}>
          <AppText variant="subtitle">Memory note</AppText>
          <AppText color="textSecondary" variant="bodyMuted">
            We opened this capsule, but the note has not loaded yet.
          </AppText>
          <AppText color="textSecondary" variant="caption">
            Opened {openedLabel}
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
      </Card>
    );
  }

  return (
    <Card>
      <View style={styles.container}>
        <AppText variant="subtitle">Memory note</AppText>
        <AppText variant="body">{normalizedNote}</AppText>
        {capsule.emotional_context ? (
          <AppText color="textSecondary" variant="bodyMuted">
            {capsule.emotional_context}
          </AppText>
        ) : null}
        <AppText color="textSecondary" variant="caption">
          Opened {openedLabel}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
});
