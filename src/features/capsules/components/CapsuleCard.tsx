import { Pressable, StyleSheet, View } from "react-native";

import { AppText, Card } from "@/components/ui";
import { CapsuleStatusBadge } from "@/features/capsules/components/CapsuleStatusBadge";
import type { CapsuleListItem } from "@/features/capsules/types";
import { formatCapsuleCountdown, formatUnlockDateTime } from "@/lib/dates/format";
import { spacing } from "@/theme/tokens";

type CapsuleCardProps = {
  item: CapsuleListItem;
  onPress: (capsuleId: string) => void;
};

export function CapsuleCard({ item, onPress }: CapsuleCardProps) {
  const unlockLabel = formatUnlockDateTime(item.capsule.unlock_at) ?? "Unlock date unavailable";
  const countdownLabel = formatCapsuleCountdown(item.capsule.unlock_at, item.capsule.opened_at);

  return (
    <Pressable
      accessibilityLabel={`Open memory capsule ${item.capsule.title}`}
      accessibilityRole="button"
      onPress={() => onPress(item.capsule.id)}
      style={({ pressed }) => [pressed ? styles.pressed : null]}
    >
      <Card>
        <View style={styles.container}>
          <View style={styles.header}>
            <AppText variant="subtitle">{item.capsule.title}</AppText>
            <CapsuleStatusBadge status={item.status} />
          </View>

          {item.capsule.emotional_context ? (
            <AppText color="textSecondary" variant="bodyMuted">
              {item.capsule.emotional_context}
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
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  meta: {
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.9,
  },
});
