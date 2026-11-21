import { StyleSheet, View } from "react-native";

import { AppText, Card, Icon } from "@/components/ui";
import { CapsuleStatusBadge } from "@/features/capsules/components/CapsuleStatusBadge";
import type { CapsuleListItem } from "@/features/capsules/types";
import { formatCapsuleCountdown, formatUnlockDateTime } from "@/lib/dates/format";
import { colors, radii, spacing } from "@/theme/tokens";

type CapsuleCardProps = {
  item: CapsuleListItem;
  onPress: (capsuleId: string) => void;
};

function getCapsuleEmoji(status: CapsuleListItem["status"]): string {
  switch (status) {
    case "openable":
      return "🎁";
    case "opened":
      return "💌";
    default:
      return "🔒";
  }
}

export function CapsuleCard({ item, onPress }: CapsuleCardProps) {
  const unlockLabel = formatUnlockDateTime(item.capsule.unlock_at) ?? "Unlock date unavailable";
  const countdownLabel = formatCapsuleCountdown(item.capsule.unlock_at, item.capsule.opened_at);
  const isReady = item.status === "openable";

  return (
    <Card
      accessibilityLabel={`Open memory capsule ${item.capsule.title}`}
      onPress={() => onPress(item.capsule.id)}
      padding="md"
      style={isReady ? styles.readyCard : null}
    >
      <View style={styles.container}>
        <View style={[styles.emojiWell, isReady ? styles.emojiWellReady : null]}>
          <AppText style={styles.emoji}>{getCapsuleEmoji(item.status)}</AppText>
        </View>
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <AppText numberOfLines={1} style={styles.title} variant="label">
              {item.capsule.title}
            </AppText>
            <CapsuleStatusBadge status={item.status} />
          </View>
          {item.capsule.emotional_context ? (
            <AppText color="textSecondary" numberOfLines={2} variant="bodyMuted">
              {item.capsule.emotional_context}
            </AppText>
          ) : null}
          <View style={styles.metaRow}>
            <Icon color="textTertiary" name="time-outline" size={13} />
            <AppText color="textSecondary" numberOfLines={1} style={styles.meta} variant="caption">
              {isReady || item.isOpened ? countdownLabel : `Unlocks ${unlockLabel}`}
            </AppText>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  readyCard: {
    borderColor: colors.primary,
    borderWidth: 1,
  },
  container: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
  },
  emojiWell: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  emojiWellReady: {
    backgroundColor: colors.primarySoft,
  },
  emoji: {
    fontSize: 24,
    lineHeight: 30,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  title: {
    flex: 1,
    fontSize: 16,
    lineHeight: 21,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  meta: {
    flex: 1,
  },
});
